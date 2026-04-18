import {
  LoonyInterceptor,
  ExecutionContext,
  CallHandler,
  Observable,
  Injectable,
} from '@loonyjs/core';

const CACHE_KEY_METADATA = Symbol.for('loony:cache_key');
const CACHE_TTL_METADATA = Symbol.for('loony:cache_ttl');

/**
 * In-memory caching interceptor.
 *
 * Design decision: the cache key defaults to the request URL, but can be
 * overridden per-route using @CacheKey() and @CacheTTL() decorators.
 */
@Injectable()
export class CacheInterceptor implements LoonyInterceptor {
  private readonly store = new Map<string, { value: any; expiresAt: number }>();
  private readonly defaultTtl: number;

  constructor(ttlMs = 5000) {
    this.defaultTtl = ttlMs;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    if (req.method !== 'GET') return next.handle();

    const customKey: string | undefined = Reflect.getMetadata(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );
    const ttl: number =
      Reflect.getMetadata(CACHE_TTL_METADATA, context.getHandler()) ?? this.defaultTtl;

    const key = customKey ?? req.url;
    const cached = this.store.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return Observable.of(cached.value);
    }

    return next.handle().tap((data) => {
      this.store.set(key, { value: data, expiresAt: Date.now() + ttl });
    });
  }
}

export function CacheKey(key: string): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    Reflect.defineMetadata(CACHE_KEY_METADATA, key, (target as any).constructor, propertyKey as string);
  };
}

export function CacheTTL(ttlMs: number): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    Reflect.defineMetadata(CACHE_TTL_METADATA, ttlMs, (target as any).constructor, propertyKey as string);
  };
}
