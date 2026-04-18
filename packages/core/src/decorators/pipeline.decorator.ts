import 'reflect-metadata';
import { METADATA_KEYS } from '../metadata/metadata-keys';
import { Type, Token } from '../di/types';

type PipelineTarget = Type | object;

function applyToTarget(key: symbol, target: PipelineTarget, propertyKey: string | undefined, values: Token[]): void {
  if (propertyKey) {
    const existing: Token[] =
      Reflect.getMetadata(key, (target as any).constructor ?? target, propertyKey) ?? [];
    Reflect.defineMetadata(key, [...values, ...existing], (target as any).constructor ?? target, propertyKey);
  } else {
    const existing: Token[] = Reflect.getMetadata(key, target) ?? [];
    Reflect.defineMetadata(key, [...values, ...existing], target);
  }
}

// ------------------------------------------------------------------
// @UseGuards
// ------------------------------------------------------------------

/**
 * Applies guards to a controller class or a specific route handler.
 * Guards run before the handler and can block execution (return false → 403).
 *
 * @example
 *   @UseGuards(AuthGuard, RolesGuard)
 *   @Get('admin')
 *   getAdmin() { ... }
 */
export function UseGuards(...guards: Token[]): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, _descriptor?: any) => {
    applyToTarget(METADATA_KEYS.GUARDS, target, propertyKey as string | undefined, guards);
  };
}

// ------------------------------------------------------------------
// @UseInterceptors
// ------------------------------------------------------------------

/**
 * Applies interceptors to a controller or route.
 * Interceptors wrap the handler (pre + post processing).
 */
export function UseInterceptors(...interceptors: Token[]): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, _descriptor?: any) => {
    applyToTarget(METADATA_KEYS.INTERCEPTORS, target, propertyKey as string | undefined, interceptors);
  };
}

// ------------------------------------------------------------------
// @UsePipes
// ------------------------------------------------------------------

/**
 * Applies pipes to a controller or route.
 * Pipes transform / validate handler arguments.
 */
export function UsePipes(...pipes: Token[]): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, _descriptor?: any) => {
    applyToTarget(METADATA_KEYS.PIPES, target, propertyKey as string | undefined, pipes);
  };
}

// ------------------------------------------------------------------
// @UseFilters
// ------------------------------------------------------------------

/**
 * Binds exception filters to a controller or route.
 * Filters are checked route-first, then controller-level, then global.
 */
export function UseFilters(...filters: Token[]): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, _descriptor?: any) => {
    applyToTarget(METADATA_KEYS.FILTERS, target, propertyKey as string | undefined, filters);
  };
}

// ------------------------------------------------------------------
// @SetMetadata — generic metadata attachment
// ------------------------------------------------------------------

/**
 * Attach arbitrary metadata to a class or method.
 * Retrieve it in guards/interceptors via the Reflector service.
 *
 * @example
 *   @SetMetadata('roles', ['admin'])
 *   @Get('admin')
 *   getAdmin() { ... }
 */
export function SetMetadata<K extends string | symbol, V>(
  key: K,
  value: V,
): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, _descriptor?: any) => {
    if (propertyKey) {
      Reflect.defineMetadata(key, value, (target as any).constructor ?? target, propertyKey as string);
    } else {
      Reflect.defineMetadata(key, value, target);
    }
  };
}

// ------------------------------------------------------------------
// @Catch — marks an exception filter class
// ------------------------------------------------------------------

/**
 * Declares which exception types a filter handles.
 * An empty list means "handle everything".
 *
 * @example
 *   @Catch(HttpException)
 *   export class HttpExceptionFilter implements ExceptionFilter { ... }
 */
export function Catch(...exceptions: Type[]): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(Symbol.for('loony:catch'), exceptions, target);
  };
}
