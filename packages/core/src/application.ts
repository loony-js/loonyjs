import 'reflect-metadata';
import { AbstractHttpAdapter } from './http/http-adapter.interface';
import { Container } from './di/container';
import { Type, Token } from './di/types';
import { ModuleCompiler } from './module/module-compiler';
import { ModuleRef } from './module/module-ref';
import { Router } from './router/router';
import { LifecycleHooks } from './lifecycle/lifecycle-hooks';
import { MiddlewareConsumer } from './middleware/middleware-consumer';
import { Logger } from './logger/logger';
import { METADATA_KEYS } from './metadata/metadata-keys';
import { Reflector } from './services/reflector.service';

const log = new Logger('LoonyApplication');

export interface LoonyApplicationOptions {
  /** Prefix added to all routes. E.g. 'api'. */
  globalPrefix?: string;
  /** Disable shutdown hooks (default: false). */
  disableShutdownHooks?: boolean;
  /** Log level filter. */
  logger?: boolean | string[];
}

/**
 * The running LoonyJS application.
 *
 * Returned by LoonyFactory.create() — never instantiate directly.
 */
export class LoonyApplication {
  private readonly globalContainer: Container;
  private readonly router: Router;
  private compiledModules!: Map<Type, ModuleRef>;
  private globalPrefix = '';
  private readonly allInstances: any[] = [];
  private isInitialised = false;

  constructor(
    private readonly httpAdapter: AbstractHttpAdapter,
    private readonly rootModule: Type,
    private readonly options: LoonyApplicationOptions = {},
  ) {
    this.globalContainer = new Container();
    this.globalContainer.register({ provide: Reflector, useClass: Reflector });

    this.router = new Router(httpAdapter, this.globalContainer);
  }

  // ------------------------------------------------------------------
  // Bootstrap
  // ------------------------------------------------------------------

  async init(): Promise<this> {
    if (this.isInitialised) return this;

    log.log('Initialising LoonyJS application…');

    // Compile module graph
    const compiler = new ModuleCompiler(this.globalContainer);
    this.compiledModules = await compiler.compile(this.rootModule);

    // Register providers + controllers per module, call configure() for middleware
    const consumer = new MiddlewareConsumer(this.httpAdapter, this.globalContainer);

    for (const [, moduleRef] of this.compiledModules) {
      // Register providers in the module's container
      for (const provider of moduleRef.metadata.providers ?? []) {
        moduleRef.container.register(provider);
      }
      // Register controllers so they can be resolved
      for (const ctrl of moduleRef.metadata.controllers ?? []) {
        moduleRef.container.register(ctrl);
      }
      // Register router
      this.router.registerControllers(
        moduleRef.metadata.controllers ?? [],
        moduleRef.container,
      );
      // Middleware configure hook
      const moduleInstance = await this.tryInstantiateModule(moduleRef);
      if (moduleInstance && typeof (moduleInstance as any).configure === 'function') {
        await (moduleInstance as any).configure(consumer);
      }
    }

    consumer.registerAll();

    // Collect all instantiated providers for lifecycle hooks
    await this.collectInstances();

    // Fire lifecycle hooks
    await LifecycleHooks.callModuleInit(this.allInstances);

    // Global prefix
    if (this.options.globalPrefix) {
      this.setGlobalPrefix(this.options.globalPrefix);
    }

    // Shutdown hooks
    if (!this.options.disableShutdownHooks) {
      this.registerShutdownHooks();
    }

    this.isInitialised = true;
    log.log('Application initialised.');
    return this;
  }

  // ------------------------------------------------------------------
  // Listening
  // ------------------------------------------------------------------

  async listen(port: number, host = '0.0.0.0'): Promise<void> {
    await this.init();

    await LifecycleHooks.callAppBootstrap(this.allInstances);

    return new Promise((resolve) => {
      this.httpAdapter.listen(port, host, () => {
        log.log(`Listening on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
        resolve();
      });
    });
  }

  async close(): Promise<void> {
    await LifecycleHooks.callAppShutdown(this.allInstances);
    await LifecycleHooks.callModuleDestroy(this.allInstances);
    await this.httpAdapter.close();
    log.log('Application closed.');
  }

  // ------------------------------------------------------------------
  // Global pipeline configuration
  // ------------------------------------------------------------------

  useGlobalGuards(...guards: any[]): this {
    this.router.executor.setGlobalGuards(guards);
    return this;
  }

  useGlobalInterceptors(...interceptors: any[]): this {
    this.router.executor.setGlobalInterceptors(interceptors);
    return this;
  }

  useGlobalPipes(...pipes: any[]): this {
    this.router.executor.setGlobalPipes(pipes);
    return this;
  }

  useGlobalFilters(...filters: any[]): this {
    this.router.executor.setGlobalFilters(filters);
    return this;
  }

  useGlobalMiddleware(...middleware: any[]): this {
    this.httpAdapter.use(...middleware);
    return this;
  }

  setGlobalPrefix(prefix: string): this {
    this.globalPrefix = prefix.startsWith('/') ? prefix : '/' + prefix;
    // Prepend prefix to already-registered routes is not trivially done on Express.
    // Instead we mount the entire app under the prefix.
    log.warn('setGlobalPrefix should be called before listen() for full effect.');
    return this;
  }

  // ------------------------------------------------------------------
  // Module/Provider access
  // ------------------------------------------------------------------

  get<T>(token: Token<T>): T {
    return this.globalContainer.resolve<T>(token);
  }

  getHttpAdapter(): AbstractHttpAdapter {
    return this.httpAdapter;
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private async tryInstantiateModule(moduleRef: ModuleRef): Promise<any> {
    try {
      return moduleRef.container.resolve(moduleRef.metatype);
    } catch {
      return null;
    }
  }

  private async collectInstances(): Promise<void> {
    for (const [, moduleRef] of this.compiledModules) {
      for (const provider of moduleRef.metadata.providers ?? []) {
        try {
          const token = typeof provider === 'function' ? provider : (provider as any).provide;
          const inst = await moduleRef.container.resolveAsync(token);
          if (inst && !this.allInstances.includes(inst)) {
            this.allInstances.push(inst);
          }
        } catch { /* optional providers */ }
      }
    }
  }

  private registerShutdownHooks(): void {
    const shutdown = async (signal: string) => {
      log.log(`Received ${signal}, shutting down gracefully…`);
      await this.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  }
}
