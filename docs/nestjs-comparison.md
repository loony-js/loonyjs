# LoonyJS vs NestJS — Design Comparison

LoonyJS was built by re-thinking every NestJS concept from first principles. This document catalogues where the frameworks differ, why those decisions were made, and what the trade-offs are.

---

## At a Glance

| Dimension | NestJS | LoonyJS |
|---|---|---|
| **Age / maturity** | 2017, production-hardened | 2024, greenfield |
| **Observable library** | RxJS (mandatory peer dep) | Custom `Observable<T>`, no RxJS |
| **Validation** | class-validator + class-transformer | Built-in field decorators, zero deps |
| **DI internals** | Module graph with WeakMap instance cache | Flat Map + parent-child container delegation |
| **Circular deps** | `forwardRef()` escape hatch | Detected via resolution stack, no workarounds |
| **HTTP adapter** | Deep framework coupling, hard to swap | Clean `abstract class AbstractHttpAdapter` |
| **Config** | Separate `@nestjs/config` package | Built into `@loonyjs/core` |
| **Pipeline elements** | Strict DI resolution only | DI resolution + auto-instantiation fallback |
| **Logger** | Pluggable via interface | Static level filter + pluggable via interface |
| **Bundle size** | ~3.5 MB (all packages) | Express + reflect-metadata only |
| **Ecosystem** | Enormous (Passport, TypeORM, Swagger…) | Minimal intentionally |
| **TypeScript strict** | Yes | Yes (strict + noUncheckedIndexedAccess) |

---

## 1. Observable / RxJS

**NestJS:** Interceptors receive and return `Observable<T>` from RxJS. RxJS is a required peer dependency. You get the full operator set (`switchMap`, `mergeMap`, `throttleTime`…), but it adds ~250 KB to your bundle and a non-trivial learning curve.

**LoonyJS:** Ships a custom 120-line `Observable<T>` that covers the interceptor use cases — `of`, `from`, `map`, `tap`, `catchError`, `toPromise`. No external dep. If you need advanced operators, wrap the observable with RxJS in your interceptor:

```typescript
import { from } from 'rxjs';
import { switchMap, timeout } from 'rxjs/operators';

intercept(ctx, next) {
  return from(next.handle().toPromise()).pipe(
    timeout(5000),
    switchMap(value => /* … */),
  );
}
```

**Trade-off:** You lose the full RxJS operator surface in exchange for zero mandatory dep.

---

## 2. Validation

**NestJS:** Relies on `class-validator` (decorator rules) and `class-transformer` (plain → class mapping). Both are separate packages, both require `emitDecoratorMetadata`. Total extra weight: ~100 KB.

**LoonyJS:** Implements validation field decorators (`@IsString`, `@IsEmail`, `@MinLength`…) in ~200 lines in `@loonyjs/common`. The `ValidationPipe` reads this metadata and runs checks. No external packages.

**Trade-off:** LoonyJS validation is simpler and covers 95% of real-world cases. Complex validators (e.g. `@ValidateNested`, `@ArrayUnique`) require writing a custom rule.

---

## 3. Dependency Injection — Container Internals

**NestJS:** The module graph is compiled into a tree of `Module` instances sharing a `NestContainer`. Providers are stored in a `Map<token, InstanceWrapper>` per module. The `InstanceWrapper` tracks whether an instance has been created and handles the singleton cache.

**LoonyJS:** Each module gets a plain `Container` (Map-based). Containers are parent-child linked — a child delegates to its parent when a token isn't found locally. No `InstanceWrapper` abstraction; the `ProviderRecord` handles caching directly.

**Practical difference:** NestJS's approach is more complex but supports advanced scoping (REQUEST scope with request context propagation). LoonyJS's approach is easier to understand and extend — you can instantiate a `Container` in a test with three lines.

---

## 4. Circular Dependencies

**NestJS:** Allows circular dependencies via `forwardRef()`, which creates a lazy reference resolved after all modules are compiled. Real-world usage is confusing.

```typescript
// NestJS
@Injectable()
class AService {
  constructor(
    @Inject(forwardRef(() => BService)) private b: BService,
  ) {}
}
```

**LoonyJS:** Circular dependencies are detected and reported with the full chain. The solution is always architectural: extract shared logic into a third service, or use a factory provider to break the cycle. This enforces cleaner module boundaries.

```
Error: Circular dependency detected: ServiceA → ServiceB → ServiceA
```

**Trade-off:** LoonyJS requires you to fix circular deps; NestJS lets you paper over them. The LoonyJS stance is intentional — circular deps are always a design smell.

---

## 5. HTTP Adapter

**NestJS:** The `HttpAdapter` abstraction is internal. Swapping Express for Fastify requires the `@nestjs/platform-fastify` package, which re-implements significant internals.

**LoonyJS:** `AbstractHttpAdapter` is a first-class exported abstract class. Implementing it is ~50 methods, all with clear signatures. An `ExpressAdapter` is included. To add Fastify:

```typescript
import Fastify, { FastifyInstance } from 'fastify';
import { AbstractHttpAdapter } from '@loonyjs/core';

export class FastifyAdapter extends AbstractHttpAdapter<FastifyInstance> {
  get(path, handler) { this.instance.get(path, handler); }
  // … implement the other ~20 methods
}

const app = await LoonyFactory.create(AppModule, new FastifyAdapter());
```

---

## 6. Configuration

**NestJS:** Configuration is handled by the separate `@nestjs/config` package. The API is similar (`ConfigService.get<T>(key)`) but you need an extra install.

**LoonyJS:** `ConfigModule` and `ConfigService` are part of `@loonyjs/core`. No extra package. Includes `.env` parsing, validation schema, and type coercion.

---

## 7. Pipeline Element Resolution

**NestJS:** Guards, interceptors, pipes, and filters registered via `@UseGuards()` etc. must be DI-resolvable (registered in a module's providers).

**LoonyJS:** Tries DI resolution first. If the class isn't registered, it auto-instantiates it (assuming it has resolvable or no constructor deps). This is the "fallback instantiation" pattern:

```typescript
// In NestJS, this requires LoggingInterceptor to be in a provider list.
// In LoonyJS, it just works.
@UseInterceptors(LoggingInterceptor)
@Controller('users')
export class UsersController {}
```

**Trade-off:** LoonyJS is more forgiving and requires less boilerplate. NestJS is stricter and makes all pipeline elements explicitly traceable.

---

## 8. Logger

**NestJS:** Logger has a `context` string and supports plugging in a custom logger via `app.useLogger()`. The default prints coloured text to stdout.

**LoonyJS:** Identical concept. The main practical difference is that level filtering is static (`Logger.setLogLevels(['warn', 'error'])`) — applied once, affects all instances. NestJS level filtering is per-instance.

---

## 9. Module Architecture

Both frameworks use the same module concept. Key differences:

| | NestJS | LoonyJS |
|---|---|---|
| Dynamic modules | `.forRoot()`, `.register()`, `.forFeature()` conventions | Same conventions, but `DynamicModule` is just a type — no magic |
| Global modules | `@Global()` | `@Global()` |
| Re-exports | Module class in `exports[]` | Same |
| Lazy modules | Via `LazyModuleLoader` | Planned |

---

## 10. What LoonyJS Doesn't (Yet) Have

These NestJS features are on the LoonyJS roadmap but not yet implemented:

- **WebSocket gateways** (`@WebSocketGateway`, `@SubscribeMessage`)
- **Microservices** (`@MessagePattern`, transport layers)
- **GraphQL** (resolver decorators, schema-first or code-first)
- **REQUEST scope** (per-request DI container propagation)
- **Lazy module loading** at runtime
- **CLI watch mode** (ts-node-dev integration)
- **OpenAPI / Swagger** auto-generation from `@ApiProperty` metadata
- **Passport integration** (`@UseGuards(AuthGuard('jwt'))` pattern)

---

## When to Choose LoonyJS

- You want to understand exactly what the framework does — every line is readable and documented
- You prefer zero mandatory heavy deps (no RxJS, no class-validator)
- You're building a new project and want to start with a clean, opinionated structure
- You want to contribute to or fork the framework with confidence

## When to Choose NestJS

- You need battle-tested production stability
- You rely on the NestJS ecosystem (TypeORM integration, Passport, Swagger, Mikro-ORM)
- You need WebSockets, microservices, or GraphQL today
- Your team already knows NestJS
