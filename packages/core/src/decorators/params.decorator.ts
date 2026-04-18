import 'reflect-metadata';
import { METADATA_KEYS } from '../metadata/metadata-keys';
import { Type } from '../di/types';

// ------------------------------------------------------------------
// Parameter metadata shape
// ------------------------------------------------------------------

export enum ParamType {
  BODY = 'BODY',
  PARAM = 'PARAM',
  QUERY = 'QUERY',
  HEADERS = 'HEADERS',
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  NEXT = 'NEXT',
  IP = 'IP',
  HOST = 'HOST',
  SESSION = 'SESSION',
  CUSTOM = 'CUSTOM',
}

export interface ParamMetadata {
  index: number;
  type: ParamType;
  /** The key to extract (e.g. 'id' for @Param('id')). Undefined = whole object. */
  key?: string;
  /** Custom factory for @Custom() params. */
  factory?: (req: any, res: any, ctx?: any) => any;
  /** Pipe chain applied to this specific param. */
  pipes?: Type[];
}

// ------------------------------------------------------------------
// Factory
// ------------------------------------------------------------------

function createParamDecorator(paramType: ParamType, key?: string): ParameterDecorator {
  return (target, propertyKey, paramIndex) => {
    const existing: ParamMetadata[] =
      Reflect.getMetadata(METADATA_KEYS.ROUTE_PARAMS, target.constructor, propertyKey as string) ?? [];

    existing.push({ index: paramIndex, type: paramType, key });
    Reflect.defineMetadata(
      METADATA_KEYS.ROUTE_PARAMS,
      existing,
      target.constructor,
      propertyKey as string,
    );
  };
}

// ------------------------------------------------------------------
// Built-in param decorators
// ------------------------------------------------------------------

/** Extracts the request body (or a specific property). */
export const Body = (key?: string) => createParamDecorator(ParamType.BODY, key);

/** Extracts a route parameter. @Param('id') → req.params.id */
export const Param = (key?: string) => createParamDecorator(ParamType.PARAM, key);

/** Extracts a query string parameter. */
export const Query = (key?: string) => createParamDecorator(ParamType.QUERY, key);

/** Injects the raw request object. */
export const Req = () => createParamDecorator(ParamType.REQUEST);

/** Alias for @Req(). */
export const Request = Req;

/** Injects the raw response object. */
export const Res = () => createParamDecorator(ParamType.RESPONSE);

/** Alias for @Res(). */
export const Response = Res;

/** Injects the next() function (middleware chains). */
export const Next = () => createParamDecorator(ParamType.NEXT);

/** Extracts request headers (or a specific header). */
export const Headers = (name?: string) => createParamDecorator(ParamType.HEADERS, name);

/** Injects the client IP address. */
export const Ip = () => createParamDecorator(ParamType.IP);

/** Injects the request host. */
export const HostParam = (key?: string) => createParamDecorator(ParamType.HOST, key);

/**
 * Create a custom parameter decorator.
 *
 * @example
 *   export const User = createParamDecoratorFactory((req) => req.user);
 */
export function createParamDecoratorFactory<T>(
  factory: (req: any, res: any, ctx: any) => T,
): () => ParameterDecorator {
  return () =>
    (target, propertyKey, paramIndex) => {
      const existing: ParamMetadata[] =
        Reflect.getMetadata(METADATA_KEYS.ROUTE_PARAMS, target.constructor, propertyKey as string) ?? [];

      existing.push({
        index: paramIndex,
        type: ParamType.CUSTOM,
        factory,
      });

      Reflect.defineMetadata(
        METADATA_KEYS.ROUTE_PARAMS,
        existing,
        target.constructor,
        propertyKey as string,
      );
    };
}
