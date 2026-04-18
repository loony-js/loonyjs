import { AbstractHttpAdapter } from '../http/http-adapter.interface';
import { Type } from '../di/types';
import { Container } from '../di/container';
import { LoonyMiddleware } from '../interfaces';

type MiddlewareToken = Type<LoonyMiddleware> | ((req: any, res: any, next: any) => void);

interface MiddlewareBinding {
  middleware: MiddlewareToken[];
  paths: string[];
  exclude: string[];
}

/**
 * Fluent API for binding middleware to routes.
 *
 * Usage (in a module that implements configure()):
 *   consumer
 *     .apply(AuthMiddleware, LoggingMiddleware)
 *     .forRoutes('users', { path: 'admin/*', method: RequestMethod.ALL })
 */
export class MiddlewareConsumer {
  private readonly bindings: MiddlewareBinding[] = [];

  constructor(
    private readonly adapter: AbstractHttpAdapter,
    private readonly container: Container,
  ) {}

  apply(...middleware: MiddlewareToken[]): MiddlewareBuilder {
    const binding: MiddlewareBinding = { middleware, paths: [], exclude: [] };
    this.bindings.push(binding);
    return new MiddlewareBuilder(binding, this);
  }

  /** Called by LoonyFactory after all modules are configured. */
  registerAll(): void {
    for (const { middleware, paths, exclude } of this.bindings) {
      const handlers = middleware.map((m) => this.toHandler(m));

      const targetPaths = paths.length === 0 ? ['/'] : paths;
      for (const path of targetPaths) {
        this.adapter.useByPath(path, ...handlers);
      }
    }
  }

  private toHandler(middlewareToken: MiddlewareToken) {
    if (typeof middlewareToken === 'function' && middlewareToken.length >= 2) {
      // Plain function middleware (req, res, next) => {}
      return middlewareToken;
    }
    // Class-based middleware — resolve from DI
    return (req: any, res: any, next: any) => {
      const instance = this.container.resolve<LoonyMiddleware>(middlewareToken as Type);
      return instance.use(req, res, next);
    };
  }
}

export class MiddlewareBuilder {
  constructor(
    private readonly binding: MiddlewareBinding,
    private readonly consumer: MiddlewareConsumer,
  ) {}

  forRoutes(...paths: string[]): MiddlewareConsumer {
    this.binding.paths.push(...paths);
    return this.consumer;
  }

  exclude(...paths: string[]): MiddlewareBuilder {
    this.binding.exclude.push(...paths);
    return this;
  }
}

/** Interface that modules can implement to configure middleware. */
export interface MiddlewareConfigurable {
  configure(consumer: MiddlewareConsumer): void | Promise<void>;
}
