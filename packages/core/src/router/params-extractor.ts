import 'reflect-metadata';
import { METADATA_KEYS } from '../metadata/metadata-keys';
import { ParamMetadata, ParamType } from '../decorators/params.decorator';
import { AbstractHttpAdapter } from '../http/http-adapter.interface';
import { Type } from '../di/types';

/**
 * Extracts handler arguments from the request object using
 * the metadata written by @Body, @Param, @Query etc.
 */
export class ParamsExtractor {
  constructor(private readonly adapter: AbstractHttpAdapter) {}

  extract(
    controllerClass: Type,
    handlerName: string | symbol,
    req: any,
    res: any,
    next: any,
  ): any[] {
    const params: ParamMetadata[] =
      Reflect.getMetadata(
        METADATA_KEYS.ROUTE_PARAMS,
        controllerClass,
        handlerName as string,
      ) ?? [];

    if (params.length === 0) return [];

    const maxIdx = Math.max(...params.map((p) => p.index));
    const args: any[] = new Array(maxIdx + 1).fill(undefined);

    for (const param of params) {
      args[param.index] = this.extractOne(param, req, res, next);
    }

    return args;
  }

  private extractOne(meta: ParamMetadata, req: any, res: any, next: any): any {
    switch (meta.type) {
      case ParamType.BODY:
        return meta.key
          ? this.adapter.getRequestBody(req)?.[meta.key]
          : this.adapter.getRequestBody(req);

      case ParamType.PARAM:
        return meta.key
          ? this.adapter.getRequestParam(req, meta.key)
          : req.params;

      case ParamType.QUERY:
        return meta.key
          ? this.adapter.getRequestQuery(req, meta.key)
          : this.adapter.getRequestQuery(req);

      case ParamType.HEADERS:
        return meta.key
          ? this.adapter.getRequestHeader(req, meta.key)
          : req.headers;

      case ParamType.REQUEST:
        return req;

      case ParamType.RESPONSE:
        return res;

      case ParamType.NEXT:
        return next;

      case ParamType.IP:
        return this.adapter.getRequestIp(req);

      case ParamType.HOST:
        return req.hostname;

      case ParamType.CUSTOM:
        return meta.factory ? meta.factory(req, res) : undefined;

      default:
        return undefined;
    }
  }
}
