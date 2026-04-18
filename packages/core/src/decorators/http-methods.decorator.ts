import 'reflect-metadata';
import { METADATA_KEYS } from '../metadata/metadata-keys';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'ALL';

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  handlerName: string | symbol;
}

function createMethodDecorator(method: HttpMethod) {
  return (path = ''): MethodDecorator =>
    (target, propertyKey, _descriptor) => {
      const existing: RouteDefinition[] =
        Reflect.getMetadata(METADATA_KEYS.ROUTES, target.constructor) ?? [];

      existing.push({ method, path, handlerName: propertyKey });
      Reflect.defineMetadata(METADATA_KEYS.ROUTES, existing, target.constructor);
    };
}

export const Get = createMethodDecorator('GET');
export const Post = createMethodDecorator('POST');
export const Put = createMethodDecorator('PUT');
export const Patch = createMethodDecorator('PATCH');
export const Delete = createMethodDecorator('DELETE');
export const Head = createMethodDecorator('HEAD');
export const Options = createMethodDecorator('OPTIONS');

/** Match any HTTP method — useful for catch-all routes. */
export const All = createMethodDecorator('ALL');

/**
 * Override the HTTP response status code for a route.
 *
 * @example
 *   @Post()
 *   @HttpCode(201)
 *   create() { ... }
 */
export function HttpCode(statusCode: number): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    Reflect.defineMetadata(
      Symbol.for('loony:http_code'),
      statusCode,
      target.constructor,
      propertyKey as string,
    );
  };
}

/**
 * Set a response header on a specific route.
 */
export function Header(name: string, value: string): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    const existing: [string, string][] =
      Reflect.getMetadata(Symbol.for('loony:headers'), target.constructor, propertyKey as string) ?? [];
    existing.push([name, value]);
    Reflect.defineMetadata(
      Symbol.for('loony:headers'),
      existing,
      target.constructor,
      propertyKey as string,
    );
  };
}

/**
 * Mark a route as returning a redirect.
 */
export function Redirect(url: string, statusCode = 302): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    Reflect.defineMetadata(
      Symbol.for('loony:redirect'),
      { url, statusCode },
      target.constructor,
      propertyKey as string,
    );
  };
}
