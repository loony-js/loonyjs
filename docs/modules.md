# Modules

Modules are the fundamental building blocks of a LoonyJS application. Every application has at least one module — the **root module** — and grows by composing feature modules together.

---

## Declaring a Module

```typescript
import { Module } from '@loonyjs/core';

@Module({
  imports:     [],   // modules whose exports are needed here
  providers:   [],   // services, repositories, helpers — DI-registered
  controllers: [],   // controllers whose routes are registered
  exports:     [],   // subset of providers shared with importing modules
})
export class UsersModule {}
```

All four fields are optional. An empty `@Module({})` is valid (useful as a namespace or future placeholder).

---

## The Module Graph

Modules form a directed acyclic graph (DAG). The `ModuleCompiler` traverses this graph depth-first at startup, compiling leaf modules before their dependents:

```
AppModule
├── imports: ConfigModule   (global)
├── imports: AuthModule
│   └── providers: [AuthMiddleware, JwtAuthGuard]
│   └── exports:  [JwtAuthGuard]
└── imports: UsersModule
    └── providers: [UsersService, UsersController]
    └── imports:  [AuthModule]   ← JwtAuthGuard available here
```

Cycle detection fires an error with the full chain:

```
Error: Circular module dependency detected: A → B → C → A
```

---

## Imports & Exports

**Exporting a provider** makes it available to any module that imports yours:

```typescript
// users.module.ts
@Module({
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],          // share UsersService outward
})
export class UsersModule {}

// posts.module.ts
@Module({
  imports: [UsersModule],           // PostsService can now inject UsersService
  providers: [PostsService],
})
export class PostsModule {}
```

**Re-exporting an imported module** — pass the module class in `exports`:

```typescript
@Module({
  imports: [TypeOrmModule],
  exports: [TypeOrmModule],         // anything importing SharedModule also gets TypeOrmModule
})
export class SharedModule {}
```

---

## Global Modules

Mark a module `@Global()` to make all its exports available everywhere without explicit imports:

```typescript
import { Module, Global } from '@loonyjs/core';

@Global()
@Module({
  providers: [ConfigService],
  exports:   [ConfigService],
})
export class CoreModule {}
```

After `CoreModule` is compiled, any module can inject `ConfigService` without listing `CoreModule` in its `imports`. Use sparingly — global modules make dependency tracing harder.

---

## Dynamic Modules

Dynamic modules are modules that compute their metadata at runtime, typically via a static factory method:

```typescript
export class ConfigModule {
  static forRoot(options: ConfigModuleOptions = {}): DynamicModule {
    return {
      module: ConfigModule,           // identifies the module class
      global: options.isGlobal,
      providers: [
        {
          provide: ConfigService,
          useValue: new ConfigService(loadEnv(options.envFilePath)),
        },
      ],
      exports: [ConfigService],
    };
  }
}

// Usage:
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.prod' })],
})
export class AppModule {}
```

`DynamicModule` is just `ModuleMetadata & { module: Type; global?: boolean }`. The compiler handles both static and dynamic modules uniformly.

---

## Module Lifecycle

Modules can implement `MiddlewareConfigurable` to hook into the middleware consumer:

```typescript
import { Module, MiddlewareConfigurable, MiddlewareConsumer } from '@loonyjs/core';
import { AuthMiddleware } from './auth.middleware';

@Module({ imports: [UsersModule] })
export class AppModule implements MiddlewareConfigurable {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*');              // apply to all routes

    consumer
      .apply(RateLimitMiddleware)
      .forRoutes('api/upload');     // or specific paths
  }
}
```

See [middleware-guards-interceptors.md](middleware-guards-interceptors.md) for the full middleware API.

---

## Module Scoping Rules

| Provider registered in | Visible to |
|---|---|
| `Module A` (not exported) | Only `Module A` |
| `Module A` (exported, imported by B) | `Module A` + `Module B` |
| `@Global()` module (exported) | Every module in the application |

Controllers are never exported — they belong to exactly one module.

---

## Accessing a Module's Providers at Runtime

`ModuleRef` exposes the module's container for rare runtime lookups:

```typescript
import { ModuleRef } from '@loonyjs/core';

@Injectable()
export class LazyFeatureService {
  constructor(private readonly moduleRef: ModuleRef) {}

  getPlugin(token: any) {
    return this.moduleRef.get(token);
  }
}
```

---

## Pattern: Feature Module

The standard LoonyJS structure for a CRUD feature:

```
src/
└── users/
    ├── users.module.ts       @Module({ controllers, providers, exports })
    ├── users.controller.ts   @Controller('users') + route methods
    ├── users.service.ts      @Injectable() business logic
    ├── users.repository.ts   @Injectable() data access (optional)
    └── dto/
        ├── create-user.dto.ts
        └── update-user.dto.ts
```

Generate all of this in one command:

```bash
loony g module users
```
