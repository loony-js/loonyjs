# Middleware, Guards & Interceptors

These three pipeline elements wrap every request at different points in the execution lifecycle. Understanding their order and responsibilities keeps your code clean and composable.

```
Request → [Middleware] → [Guards] → [Interceptors] → [Pipes] → Handler → [Interceptors] → Response
                                                                        ↑
                                                               [Exception Filters]  (on error)
```

---

## Middleware

Middleware runs **before** the LoonyJS pipeline (guards, interceptors). It is the right place for cross-cutting concerns that don't need access to the route handler's metadata.

### Class-based middleware

```typescript
import { Injectable, LoonyMiddleware } from '@loonyjs/core';

@Injectable()
export class LoggingMiddleware implements LoonyMiddleware {
  use(req: any, res: any, next: () => void): void {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();              // always call next() or the request hangs
  }
}
```

### Function middleware

```typescript
export function corsMiddleware(req: any, res: any, next: () => void) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}
```

### Applying middleware

Implement `MiddlewareConfigurable` on any module:

```typescript
import { Module, MiddlewareConfigurable, MiddlewareConsumer } from '@loonyjs/core';

@Module({ imports: [UsersModule] })
export class AppModule implements MiddlewareConfigurable {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(LoggingMiddleware, corsMiddleware)   // multiple at once, left-to-right
      .forRoutes('*');                            // all routes

    consumer
      .apply(AuthMiddleware)
      .forRoutes('api/admin');                    // specific path prefix
  }
}
```

### When to use middleware

| Use middleware for… | Use guards for… |
|---|---|
| Request parsing, logging, CORS | Authentication, authorisation |
| Rate limiting (stateless) | Role/permission checks |
| Request ID injection | Feature flags |
| Body transformations | Any logic that needs route metadata |

Middleware **cannot** access route metadata (`@SetMetadata`) because it runs before the route is matched to a handler. Use guards or interceptors for metadata-dependent logic.

---

## Guards

Guards are the **authentication and authorization** layer. They run after middleware but before any interceptor or pipe.

### Implementing a guard

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@loonyjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    return req.user != null;      // false → 403 ForbiddenException thrown automatically
  }
}
```

If `canActivate` returns `false`, LoonyJS throws `ForbiddenException` (HTTP 403). You can also throw any `HttpException` yourself for custom status codes:

```typescript
canActivate(context: ExecutionContext): boolean {
  const req = context.switchToHttp().getRequest();
  if (!req.user) throw new UnauthorizedException('Please log in');
  return true;
}
```

### Applying guards

Guards compose at three levels — they all run, outermost (global) first:

```typescript
// 1. Global — applies to every route
app.useGlobalGuards(new AuthGuard());

// 2. Controller — applies to all routes in the class
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {}

// 3. Route — applies to one handler
@UseGuards(OwnerGuard)
@Delete(':id')
remove(@Param('id') id: string) {}
```

### Role-based access control

Use `@SetMetadata` to attach roles, then read them in a guard via `Reflector`:

```typescript
// 1. Shorthand decorator
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// 2. Guard reads metadata
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),   // route-level takes priority
      context.getClass(),     // then controller-level
    ]);

    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    return required.some(role => user?.roles?.includes(role));
  }
}

// 3. Usage
@Roles('admin')
@Delete(':id')
remove() {}
```

`@loonyjs/common` ships `RolesGuard` and `@Roles()` ready to use:

```typescript
import { RolesGuard, Roles } from '@loonyjs/common';

app.useGlobalGuards(new RolesGuard(reflector));

@Roles('admin', 'superuser')
@Get('dashboard')
getDashboard() {}
```

---

## Interceptors

Interceptors wrap the handler execution. They can:

- Log timing / metrics
- Transform the response shape
- Cache responses
- Handle timeouts
- Catch and re-throw errors

### The `Observable` contract

Interceptors return an `Observable<T>`. The `next.handle()` call returns an `Observable` that emits the handler's return value. You use `.map()` and `.tap()` to transform it.

LoonyJS ships a custom minimal `Observable<T>` — no RxJS required.

### Implementing an interceptor

```typescript
import {
  LoonyInterceptor, ExecutionContext, CallHandler, Observable, Injectable
} from '@loonyjs/core';

@Injectable()
export class TimingInterceptor implements LoonyInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();

    return next.handle().tap(() => {
      const req = context.switchToHttp().getRequest();
      console.log(`${req.method} ${req.url} → ${Date.now() - start}ms`);
    });
  }
}
```

### Response transformation

Wrap every response in a standard envelope:

```typescript
@Injectable()
export class TransformInterceptor<T> implements LoonyInterceptor<T, { data: T; ts: string }> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<{ data: T; ts: string }> {
    return next.handle().map(data => ({
      data,
      ts: new Date().toISOString(),
    }));
  }
}
```

### Built-in interceptors (`@loonyjs/common`)

```typescript
import { LoggingInterceptor, TransformInterceptor, CacheInterceptor } from '@loonyjs/common';

// Global
app.useGlobalInterceptors(
  new LoggingInterceptor(),
  new TransformInterceptor(),
);

// Caching — GET responses cached in memory for 5 seconds by default
app.useGlobalInterceptors(new CacheInterceptor(5000));

// Override cache key and TTL per route
@CacheKey('all-users')
@CacheTTL(30_000)
@Get()
findAll() { ... }
```

### Applying interceptors

```typescript
// Global
app.useGlobalInterceptors(new LoggingInterceptor());

// Controller
@UseInterceptors(TimingInterceptor)
@Controller('users')
export class UsersController {}

// Route
@UseInterceptors(CacheInterceptor)
@Get()
findAll() {}
```

### Error handling in interceptors

```typescript
@Injectable()
export class ErrorLoggingInterceptor implements LoonyInterceptor {
  private readonly log = new Logger('Errors');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().catchError(err => {
      this.log.error('Handler threw:', err.stack);
      return Observable.throwError(() => err); // re-throw
    });
  }
}
```

---

## ExecutionContext

Both guards and interceptors receive an `ExecutionContext`, which is a thin wrapper over the request arguments:

```typescript
context.getHandler()          // Function — the route handler method
context.getClass()            // Function — the controller class
context.switchToHttp()        // HttpArgumentsHost
  .getRequest<T>()            // raw request (Express.Request by default)
  .getResponse<T>()           // raw response
  .getNext<T>()               // next() function
```

Use it with `Reflector` to read per-route metadata:

```typescript
const roles = this.reflector.getAllAndOverride('roles', [
  context.getHandler(),
  context.getClass(),
]);
```

---

## Composition Order

Given:
```typescript
app.useGlobalGuards(GlobalGuard);
app.useGlobalInterceptors(GlobalInterceptor);

@UseGuards(CtrlGuard)
@UseInterceptors(CtrlInterceptor)
@Controller('x')
class XController {
  @UseGuards(RouteGuard)
  @UseInterceptors(RouteInterceptor)
  @Get()
  handler() {}
}
```

Execution order:
```
Guards:        GlobalGuard → CtrlGuard → RouteGuard
Interceptors:  GlobalInterceptor (pre) → CtrlInterceptor (pre) → RouteInterceptor (pre)
               Handler runs
               RouteInterceptor (post) → CtrlInterceptor (post) → GlobalInterceptor (post)
```

Innermost interceptors are closest to the handler. Errors propagate outward — the first matching exception filter wins.
