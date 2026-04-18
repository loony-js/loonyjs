import { AbstractHttpAdapter } from '../http/http-adapter.interface';
import { Container } from '../di/container';
import { Type } from '../di/types';
import { RouteExplorer } from './route-explorer';
import { RouterExecutor } from './router-executor';
import { Logger } from '../logger/logger';
import { METADATA_KEYS } from '../metadata/metadata-keys';

const log = new Logger('Router');

const METHOD_MAP: Record<string, keyof AbstractHttpAdapter> = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  PATCH: 'patch',
  DELETE: 'delete',
  HEAD: 'head',
  OPTIONS: 'options',
  ALL: 'all',
};

/**
 * Registers all discovered controller routes on the HTTP adapter.
 */
export class Router {
  private readonly explorer = new RouteExplorer();
  readonly executor: RouterExecutor;

  constructor(
    private readonly adapter: AbstractHttpAdapter,
    private readonly globalContainer: Container,
  ) {
    this.executor = new RouterExecutor(adapter, globalContainer);
  }

  registerControllers(controllers: Type[], moduleContainer: Container): void {
    const routes = this.explorer.exploreControllers(controllers);

    for (const route of routes) {
      const controllerInstance = moduleContainer.resolve(route.controllerClass);
      const handler = this.executor.createHandler(route, controllerInstance);
      const adapterMethod = METHOD_MAP[route.method];

      if (!adapterMethod) {
        log.warn(`Unknown HTTP method "${route.method}" for route ${route.fullPath}`);
        continue;
      }

      (this.adapter as any)[adapterMethod](route.fullPath, handler);

      log.log(`Route registered: ${route.method} ${route.fullPath}`, 'Router');
    }
  }
}
