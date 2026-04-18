# Architecture

## Overview

LoonyJS is built around four interlocking ideas:

| Idea | Mechanism |
|---|---|
| **Inversion of Control** | The framework instantiates your classes; you declare dependencies |
| **Modular composition** | Feature modules define a scoped DI boundary |
| **Decorator metadata** | All routing, injection, and pipeline behaviour lives in `reflect-metadata` |
| **Swappable adapters** | HTTP transport is behind an abstract interface |

---

## Package Boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│                        Your Application                          │
│   AppModule → UsersModule → UsersController → UsersService       │
└──────────────────────┬───────────────────────────────────────────┘
                       │  imports
┌──────────────────────▼───────────────────────────────────────────┐
│                    @loonyjs/common                               │
│  ValidationPipe · LoggingInterceptor · RolesGuard · HttpFilter   │
└──────────────────────┬───────────────────────────────────────────┘
                       │  imports
┌──────────────────────▼───────────────────────────────────────────┐
│                     @loonyjs/core                                │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  DI      │  │ Module   │  │  Router  │  │  HTTP Adapter  │  │
│  │Container │  │Compiler  │  │Executor  │  │  (Express/…)   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Logger   │  │ Config   │  │Lifecycle │  │  Observable    │  │
│  │          │  │ Module   │  │  Hooks   │  │  (no RxJS)     │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Bootstrap Sequence

When you call `LoonyFactory.create(AppModule)`:

```
LoonyFactory.create(AppModule)
       │
       ▼
LoonyApplication.init()
       │
       ├─ 1. ModuleCompiler.compile(AppModule)
       │      │
       │      ├─ Depth-first traverse import graph
       │      ├─ Create child Container per module
       │      ├─ Register module providers in child container
       │      ├─ Wire exports to importers' containers
       │      └─ Global modules → publish to root container
       │
       ├─ 2. Register controllers per module
       │
       ├─ 3. Router.registerControllers() — attach Express routes
       │
       ├─ 4. Module.configure(consumer) — apply middleware
       │
       ├─ 5. LifecycleHooks.callModuleInit() — onModuleInit()
       │
       └─ 6. app.listen(port) → LifecycleHooks.callAppBootstrap()
```

---

## Module Graph & Container Hierarchy

Each module gets its own **child `Container`** that delegates to the root (global) container for unresolved tokens.

```
GlobalContainer
│  (global module exports live here)
│
├── AppModule.container
│   │
│   ├── AuthModule.container
│   │     providers: [AuthMiddleware, JwtAuthGuard]
│   │
│   ├── UsersModule.container
│   │     providers: [UsersService, UsersController]
│   │     (resolves UsersService locally, JwtAuthGuard from AuthModule export)
│   │
│   └── HealthModule.container
│         providers: [HealthController]
```

**Provider resolution order:**
1. Local module container
2. Parent containers (following import chain)
3. Global container (for `@Global()` modules)
4. Auto-instantiation fallback (for `@Injectable` classes not explicitly registered)

---

## Request Lifecycle

```
HTTP Request arrives at Express
         │
         ▼
  Express middleware stack
  (global middleware applied via app.use())
         │
         ▼
  LoonyJS route handler (created by RouterExecutor)
         │
         ├─── 1. Guards (canActivate)
         │          global guards
         │          → controller guards  (@UseGuards on class)
         │          → route guards       (@UseGuards on method)
         │          Returns false → throw ForbiddenException
         │
         ├─── 2. Interceptors wrap the rest
         │          (global → controller → route, outermost first)
         │          intercept(ctx, next) called before handler
         │
         ├─── 3. Pipes transform arguments
         │          global → controller → route level
         │          transform(value, metadata) called per argument
         │
         ├─── 4. Handler invoked
         │          @Param/@Body/@Query extracted by ParamsExtractor
         │          controller method called with typed arguments
         │
         ├─── 5. Interceptors post-process
         │          next.handle() returns Observable
         │          .map() / .tap() applied to the return value
         │
         └─── 6. Exception Filters  (if any step throws)
                    route filters first → controller → global
                    @Catch(ExceptionClass) matched by instanceof
                    Default: HttpException → JSON, Error → 500
```

---

## Core Subsystems

### DI Container (`packages/core/src/di/container.ts`)

- Token → `ProviderRecord` map
- Singleton instance cache per record
- Parent container delegation for cross-module resolution
- Async factory support (`resolveAsync`)
- Resolution stack for circular dependency detection

### Module Compiler (`packages/core/src/module/module-compiler.ts`)

- Depth-first traversal of the import graph
- Early registration to handle self-referential patterns
- Topological ordering ensures dependencies are ready before dependents
- Exports wired directly into the importer's container (not the global one, unless `@Global`)

### Router Executor (`packages/core/src/router/router-executor.ts`)

- Assembles the guard → interceptor → pipe → handler chain at request time
- Resolves pipeline elements from the DI container (or auto-instantiates)
- Error handler checks exception filters in route → controller → global order
- `@Catch()` metadata matched with `instanceof` checks

### Observable (`packages/core/src/utils/observable.ts`)

- ~120 lines: `of`, `from`, `map`, `tap`, `catchError`, `toPromise`
- Interceptors receive and return `Observable<T>` — no RxJS import needed
- Consumers can wrap with RxJS via an adapter if they need operators like `mergeMap`

---

## File Map

```
packages/core/src/
├── metadata/
│   └── metadata-keys.ts        — all Symbol keys, single source of truth
├── di/
│   ├── types.ts                — Token, Scope, Provider shapes, type guards
│   └── container.ts            — DI container implementation
├── decorators/
│   ├── module.decorator.ts     — @Module, @Global, DynamicModule
│   ├── injectable.decorator.ts — @Injectable, @Inject, @Optional
│   ├── controller.decorator.ts — @Controller
│   ├── http-methods.decorator.ts — @Get, @Post, …, @HttpCode, @Header, @Redirect
│   ├── params.decorator.ts     — @Body, @Param, @Query, createParamDecoratorFactory
│   └── pipeline.decorator.ts   — @UseGuards, @UseInterceptors, @UsePipes, @UseFilters,
│                                  @SetMetadata, @Catch
├── module/
│   ├── module-ref.ts           — runtime module wrapper + child container
│   └── module-compiler.ts      — module graph compilation
├── router/
│   ├── execution-context.ts    — ExecutionContextHost (HTTP context)
│   ├── route-explorer.ts       — discovers routes from controller metadata
│   ├── params-extractor.ts     — extracts handler arguments from request
│   ├── router-executor.ts      — pipeline assembly and execution
│   └── router.ts               — registers routes on the HTTP adapter
├── http/
│   ├── http-adapter.interface.ts — AbstractHttpAdapter
│   └── express-adapter.ts      — Express implementation
├── middleware/
│   └── middleware-consumer.ts  — fluent middleware binding API
├── lifecycle/
│   └── lifecycle-hooks.ts      — hook invocation helpers
├── services/
│   └── reflector.service.ts    — reads @SetMetadata values
├── config/
│   └── config.module.ts        — ConfigService + ConfigModule.forRoot()
├── logger/
│   └── logger.ts               — coloured structured logger
├── exceptions/
│   └── http-exception.ts       — HttpException + subclasses
├── interfaces/
│   └── index.ts                — CanActivate, PipeTransform, ExceptionFilter, …
├── utils/
│   └── observable.ts           — minimal Observable<T>
├── application.ts              — LoonyApplication class
├── factory.ts                  — LoonyFactory.create()
└── index.ts                    — public API
```
