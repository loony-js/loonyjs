import 'reflect-metadata';
import { METADATA_KEYS } from '../metadata/metadata-keys';
import { Type } from '../di/types';
import { RouteDefinition } from '../decorators/http-methods.decorator';
import { ControllerOptions } from '../decorators/controller.decorator';

export interface DiscoveredRoute {
  method: string;
  fullPath: string;
  handlerName: string | symbol;
  controllerClass: Type;
  httpCode?: number;
  headers?: [string, string][];
  redirect?: { url: string; statusCode: number };
}

/**
 * Walks module metadata to discover all controller routes.
 */
export class RouteExplorer {
  exploreControllers(controllers: Type[]): DiscoveredRoute[] {
    return controllers.flatMap((ctrl) => this.exploreController(ctrl));
  }

  private exploreController(ctrl: Type): DiscoveredRoute[] {
    const controllerMeta: ControllerOptions =
      Reflect.getMetadata(METADATA_KEYS.CONTROLLER, ctrl) ?? {};
    const basePath = this.normalisePath(controllerMeta.path ?? '');
    const routes: RouteDefinition[] =
      Reflect.getMetadata(METADATA_KEYS.ROUTES, ctrl) ?? [];

    return routes.map((route) => {
      const routePath = this.normalisePath(route.path);
      const fullPath = basePath + routePath || '/';

      const httpCode: number | undefined = Reflect.getMetadata(
        Symbol.for('loony:http_code'),
        ctrl,
        route.handlerName as string,
      );
      const headers: [string, string][] | undefined = Reflect.getMetadata(
        Symbol.for('loony:headers'),
        ctrl,
        route.handlerName as string,
      );
      const redirect: { url: string; statusCode: number } | undefined = Reflect.getMetadata(
        Symbol.for('loony:redirect'),
        ctrl,
        route.handlerName as string,
      );

      return {
        method: route.method,
        fullPath,
        handlerName: route.handlerName,
        controllerClass: ctrl,
        httpCode,
        headers,
        redirect,
      };
    });
  }

  private normalisePath(path: string): string {
    if (!path) return '';
    const p = path.startsWith('/') ? path : '/' + path;
    return p.endsWith('/') && p.length > 1 ? p.slice(0, -1) : p;
  }
}
