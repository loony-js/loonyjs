import { AbstractHttpAdapter } from '../http/http-adapter.interface';
import { Container } from '../di/container';
import { Token, Type } from '../di/types';
import { METADATA_KEYS } from '../metadata/metadata-keys';
import { DiscoveredRoute } from './route-explorer';
import { ParamsExtractor } from './params-extractor';
import { ExecutionContextHost } from './execution-context';
import { Observable } from '../utils/observable';
import {
  CanActivate,
  LoonyInterceptor,
  PipeTransform,
  ExceptionFilter,
  CallHandler,
  ExecutionContext,
} from '../interfaces';
import { HttpException, ForbiddenException } from '../exceptions/http-exception';
import { Logger } from '../logger/logger';

const log = new Logger('Router');

/**
 * RouterExecutor is the heart of the request pipeline.
 *
 * Execution order (mirrors NestJS but implemented independently):
 *   Middleware → Guards → Interceptors (pre) → Pipes → Handler → Interceptors (post)
 *   Errors → Exception Filters
 *
 * Design decision: the pipeline is composed lazily per-request using
 * Observable chains rather than a static middleware stack.  This makes
 * each step opt-in and avoids overhead on routes with no guards/interceptors.
 */
export class RouterExecutor {
  private readonly extractor: ParamsExtractor;
  private globalGuards: Token[] = [];
  private globalInterceptors: Token[] = [];
  private globalPipes: Token[] = [];
  private globalFilters: Token[] = [];

  constructor(
    private readonly adapter: AbstractHttpAdapter,
    private readonly container: Container,
  ) {
    this.extractor = new ParamsExtractor(adapter);
  }

  setGlobalGuards(guards: Token[]): void { this.globalGuards = guards; }
  setGlobalInterceptors(interceptors: Token[]): void { this.globalInterceptors = interceptors; }
  setGlobalPipes(pipes: Token[]): void { this.globalPipes = pipes; }
  setGlobalFilters(filters: Token[]): void { this.globalFilters = filters; }

  // ------------------------------------------------------------------
  // Build and register a single route handler
  // ------------------------------------------------------------------

  createHandler(route: DiscoveredRoute, controllerInstance: any): (req: any, res: any, next: any) => Promise<void> {
    const { controllerClass, handlerName } = route;
    const handler = (controllerInstance as any)[handlerName as string].bind(controllerInstance);

    return async (req: any, res: any, next: any) => {
      const ctx = new ExecutionContextHost([req, res, next], controllerClass, handler);

      try {
        // 1. Guards
        await this.runGuards(ctx, controllerClass, handlerName);

        // 2. Interceptors wrap the rest
        const result = await this.runWithInterceptors(ctx, controllerClass, handlerName, async () => {
          // 3. Extract + pipe params
          const args = await this.extractAndPipeParams(
            controllerClass,
            handlerName,
            req, res, next,
            ctx,
          );

          // 4. Invoke handler
          return handler(...args);
        });

        // 5. Send response (unless @Res() was used — user manages it)
        if (!res.headersSent) {
          if (route.redirect) {
            this.adapter.redirect(res, route.redirect.url, route.redirect.statusCode);
          } else {
            const statusCode = route.httpCode ?? (req.method === 'POST' ? 201 : 200);
            for (const [name, value] of route.headers ?? []) {
              this.adapter.setHeader(res, name, value);
            }
            this.adapter.reply(res, result, statusCode);
          }
        }
      } catch (err) {
        await this.handleError(err, ctx, controllerClass, handlerName, res);
      }
    };
  }

  // ------------------------------------------------------------------
  // Guards
  // ------------------------------------------------------------------

  private async runGuards(
    ctx: ExecutionContext,
    controllerClass: Type,
    handlerName: string | symbol,
  ): Promise<void> {
    const guardTokens = [
      ...this.globalGuards,
      ...(Reflect.getMetadata(METADATA_KEYS.GUARDS, controllerClass) ?? []),
      ...(Reflect.getMetadata(METADATA_KEYS.GUARDS, controllerClass, handlerName as string) ?? []),
    ];

    for (const token of guardTokens) {
      const guard = this.resolve<CanActivate>(token);
      const allowed = await guard.canActivate(ctx);
      if (!allowed) throw new ForbiddenException();
    }
  }

  // ------------------------------------------------------------------
  // Interceptors
  // ------------------------------------------------------------------

  private async runWithInterceptors(
    ctx: ExecutionContext,
    controllerClass: Type,
    handlerName: string | symbol,
    innerFn: () => Promise<any>,
  ): Promise<any> {
    const interceptorTokens = [
      ...this.globalInterceptors,
      ...(Reflect.getMetadata(METADATA_KEYS.INTERCEPTORS, controllerClass) ?? []),
      ...(Reflect.getMetadata(METADATA_KEYS.INTERCEPTORS, controllerClass, handlerName as string) ?? []),
    ];

    if (interceptorTokens.length === 0) return innerFn();

    // Build the interceptor chain right-to-left so the first listed runs outermost
    let chain: () => Promise<any> = innerFn;

    for (const token of [...interceptorTokens].reverse()) {
      const interceptor = this.resolve<LoonyInterceptor>(token);
      const previousChain = chain;
      chain = () => {
        const callHandler: CallHandler = {
          handle: () => Observable.from(previousChain()),
        };
        return Promise.resolve(interceptor.intercept(ctx, callHandler))
          .then((obs) => (obs instanceof Observable ? obs.toPromise() : obs));
      };
    }

    return chain();
  }

  // ------------------------------------------------------------------
  // Pipes
  // ------------------------------------------------------------------

  private async extractAndPipeParams(
    controllerClass: Type,
    handlerName: string | symbol,
    req: any, res: any, next: any,
    ctx: ExecutionContext,
  ): Promise<any[]> {
    const rawArgs = this.extractor.extract(controllerClass, handlerName, req, res, next);

    const pipeTokens = [
      ...this.globalPipes,
      ...(Reflect.getMetadata(METADATA_KEYS.PIPES, controllerClass) ?? []),
      ...(Reflect.getMetadata(METADATA_KEYS.PIPES, controllerClass, handlerName as string) ?? []),
    ];

    if (pipeTokens.length === 0) return rawArgs;

    const pipes = pipeTokens.map((t) => this.resolve<PipeTransform>(t));

    return Promise.all(
      rawArgs.map(async (arg, i) => {
        let value = arg;
        for (const pipe of pipes) {
          value = await pipe.transform(value, {
            type: 'custom',
            data: String(i),
          });
        }
        return value;
      }),
    );
  }

  // ------------------------------------------------------------------
  // Exception filters
  // ------------------------------------------------------------------

  private async handleError(
    err: unknown,
    ctx: ExecutionContext,
    controllerClass: Type,
    handlerName: string | symbol,
    res: any,
  ): Promise<void> {
    const filterTokens = [
      ...(Reflect.getMetadata(METADATA_KEYS.FILTERS, controllerClass, handlerName as string) ?? []),
      ...(Reflect.getMetadata(METADATA_KEYS.FILTERS, controllerClass) ?? []),
      ...this.globalFilters,
    ];

    for (const token of filterTokens) {
      const filter = this.resolve<ExceptionFilter>(token);
      const handles = this.filterHandles(token, err);
      if (handles) {
        await filter.catch(err, ctx);
        return;
      }
    }

    // Default error handler
    if (res.headersSent) return;

    if (err instanceof HttpException) {
      const status = err.getStatus();
      log.warn(`HttpException ${status}: ${err.message}`);
      this.adapter.reply(res, err.toJSON(), status);
    } else {
      log.error('Unhandled exception', err instanceof Error ? err.stack : String(err));
      this.adapter.reply(res, { statusCode: 500, message: 'Internal Server Error' }, 500);
    }
  }

  private filterHandles(token: Token, err: unknown): boolean {
    // If already an instance, check its constructor
    const filterClass = typeof token === 'function'
      ? token
      : (token && typeof token === 'object' ? (token as any).constructor : null);

    if (!filterClass) return true;

    const exceptions: Type[] = Reflect.getMetadata(Symbol.for('loony:catch'), filterClass) ?? [];
    if (exceptions.length === 0) return true;
    return exceptions.some((ExcClass) => err instanceof ExcClass);
  }

  // ------------------------------------------------------------------
  // Helper — resolves a DI token, a pre-instantiated object, or auto-instantiates
  // ------------------------------------------------------------------

  private resolve<T>(token: Token): T {
    // Already an instance — return directly
    if (token !== null && typeof token === 'object') {
      return token as unknown as T;
    }

    // Try the container first
    if (this.container.has(token)) {
      return this.container.resolve<T>(token);
    }

    // Fall back: if it's a class constructor, auto-register and instantiate it
    if (typeof token === 'function') {
      this.container.register(token as Type);
      return this.container.resolve<T>(token);
    }

    throw new Error(`Cannot resolve token: ${String(token)}`);
  }
}
