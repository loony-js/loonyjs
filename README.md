<div align="center">

```
 _                           _     _ _____ 
| |    ___   ___  _ __  _   | |   | / ____|
| |   / _ \ / _ \| '_ \| | | | | | \___ \ 
| |__| (_) | (_) | | | | |_| | |_| |___) |
|_____\___/ \___/|_| |_|\__, |\___/|____/ 
                          __/ |            
                         |___/             
```

**A production-ready, decorator-driven Node.js backend framework — built from scratch.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-brightgreen)](LICENSE)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)

</div>

---

LoonyJS is an opinionated, enterprise-grade backend framework for Node.js written in TypeScript. Inspired by NestJS, but built **entirely from first principles** — no internal code copied, every design decision re-thought.

It gives you a structured, modular architecture with dependency injection, decorator-based routing, a rich middleware pipeline, built-in validation, and a CLI for scaffolding — all with minimal runtime overhead and zero mandatory third-party dependencies beyond Express and `reflect-metadata`.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Core Concepts](#core-concepts)
  - [Modules](#modules)
  - [Controllers](#controllers)
  - [Services & DI](#services--dependency-injection)
  - [Request Pipeline](#request-pipeline)
  - [Exception Handling](#exception-handling)
- [Packages](#packages)
- [CLI](#cli)
- [Documentation](#documentation)
- [Design Philosophy](#design-philosophy)
- [Comparison with NestJS](#comparison-with-nestjs)
- [Roadmap](#roadmap)

---

## Features

| Category | What's included |
|---|---|
| **Architecture** | Modular feature modules, global modules, dynamic modules |
| **DI Container** | Singleton & transient scopes, constructor injection, useClass/useValue/useFactory/useExisting providers, circular dependency detection |
| **HTTP Layer** | Swappable adapter (Express default), decorator-based routing, all HTTP methods |
| **Decorators** | `@Module`, `@Controller`, `@Injectable`, `@Get/@Post/…`, `@Body/@Param/@Query/@Headers/@Ip`, `@UseGuards/@UseInterceptors/@UsePipes/@UseFilters`, `@SetMetadata`, `@Catch` |
| **Pipeline** | Middleware → Guards → Interceptors → Pipes → Handler → Exception Filters |
| **Validation** | Built-in `ValidationPipe` + field decorators (`@IsString`, `@IsEmail`, `@MinLength`…) — zero external deps |
| **Interceptors** | `LoggingInterceptor`, `TransformInterceptor`, `CacheInterceptor` out of the box |
| **Lifecycle hooks** | `OnModuleInit`, `OnModuleDestroy`, `OnApplicationBootstrap`, `OnApplicationShutdown` |
| **Config** | `ConfigModule.forRoot()` with `.env` parsing, strong typing, validation schema |
| **Logging** | Coloured structured logger with level filtering, context labels, pluggable |
| **Observable** | Custom minimal `Observable<T>` — no RxJS required |
| **Testing** | `TestingModule` builder, `createMockProvider()`, full DI in tests |
| **CLI** | `loony g module/controller/service/guard/interceptor/middleware`, `loony new <project>` |
| **Graceful shutdown** | SIGTERM/SIGINT hooks with ordered teardown |

---

## Quick Start

### Option A — Clone this repo and run the demo

```bash
git clone https://github.com/your-org/loonyjs
cd loonyjs
npm install

# Build all packages
npx tsc -p packages/core/tsconfig.json
npx tsc -p packages/common/tsconfig.json
npx tsc -p apps/demo/tsconfig.json

# Start the demo
node apps/demo/dist/main.js
```

```
GET  http://localhost:3000/health
GET  http://localhost:3000/users
POST http://localhost:3000/users      (body: { name, email, password })
GET  http://localhost:3000/users/:id
PATCH http://localhost:3000/users/:id
DELETE http://localhost:3000/users/:id
```

### Option B — Scaffold a new project with the CLI

```bash
# (after building the CLI package)
node packages/cli/dist/bin/loony.js new my-api
cd my-api
npm install
npx ts-node src/main.ts
```

---

## Project Structure

```
loonyjs/
├── packages/
│   ├── core/          @loonyjs/core          — framework kernel
│   ├── common/        @loonyjs/common        — built-in pipes, interceptors, guards, filters
│   ├── testing/       @loonyjs/testing       — DI-aware test utilities
│   └── cli/           @loonyjs/cli           — scaffolding CLI (bin: loony)
├── apps/
│   └── demo/          Working CRUD demo application
├── docs/              Full documentation
├── tsconfig.base.json Shared compiler settings (strict, decorators, etc.)
└── package.json       npm workspaces root
```

---

## Core Concepts

### Modules

Every LoonyJS application is composed of **modules**. A module is a class decorated with `@Module()` that declares its controllers, providers, imports, and exports.

```typescript
import { Module } from '@loonyjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [],             // other modules whose exports you need
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // share with importing modules
})
export class UsersModule {}
```

The root module is passed to `LoonyFactory.create()`:

```typescript
import { LoonyFactory } from '@loonyjs/core';
import { AppModule } from './app.module';

const app = await LoonyFactory.create(AppModule);
await app.listen(3000);
```

### Controllers

Controllers handle HTTP requests. Decorate a class with `@Controller(path)` and methods with HTTP verb decorators:

```typescript
import { Controller, Get, Post, Body, Param, HttpCode } from '@loonyjs/core';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

**Parameter decorators:**

| Decorator | Extracts |
|---|---|
| `@Body(key?)` | `req.body` or `req.body[key]` |
| `@Param(key?)` | Route params (`req.params`) |
| `@Query(key?)` | Query string (`req.query`) |
| `@Headers(name?)` | Request headers |
| `@Req()` | Raw request object |
| `@Res()` | Raw response object |
| `@Ip()` | Client IP address |

### Services & Dependency Injection

Mark any class `@Injectable()` to make it participate in DI:

```typescript
import { Injectable, NotFoundException } from '@loonyjs/core';

@Injectable()
export class UsersService {
  private users: User[] = [];

  findOne(id: string): User {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }
}
```

**Custom providers:**

```typescript
// useValue
{ provide: 'CONFIG', useValue: { apiKey: 'abc' } }

// useFactory (supports async)
{
  provide: DatabaseService,
  useFactory: async (config: ConfigService) => {
    const db = new DatabaseService(config.get('DB_URL'));
    await db.connect();
    return db;
  },
  inject: [ConfigService],
}

// useExisting (alias)
{ provide: 'LOGGER', useExisting: Logger }
```

**Injection tokens:**

```typescript
import { InjectionToken, Inject } from '@loonyjs/core';

const API_KEY = new InjectionToken<string>('API_KEY');

@Injectable()
export class ApiService {
  constructor(@Inject(API_KEY) private readonly key: string) {}
}
```

### Request Pipeline

Every request flows through a deterministic pipeline:

```
Incoming Request
       │
       ▼
  [Middleware]    — global → module-level (any order)
       │
       ▼
  [Guards]        — global → controller → route-level
       │             Returns false → 403 ForbiddenException
       ▼
  [Interceptors]  — global → controller → route-level  (outermost first)
    pre-handle    
       │
       ▼
  [Pipes]         — transform / validate handler arguments
       │
       ▼
  [Route Handler] — your controller method
       │
       ▼
  [Interceptors]  — post-handle  (map / tap the return value)
       │
       ▼
  [Exc. Filters]  — route → controller → global  (on error only)
       │
       ▼
     Response
```

### Exception Handling

Throw any `HttpException` subclass and it's automatically formatted:

```typescript
import { NotFoundException, BadRequestException } from '@loonyjs/core';

throw new NotFoundException('User not found');
// → HTTP 404  { message: 'User not found', statusCode: 404 }

throw new BadRequestException({ message: 'Invalid input', fields: ['email'] });
// → HTTP 400  { message: 'Invalid input', fields: ['email'], statusCode: 400 }
```

Built-in exception classes: `BadRequestException` (400), `UnauthorizedException` (401), `ForbiddenException` (403), `NotFoundException` (404), `ConflictException` (409), `UnprocessableEntityException` (422), `TooManyRequestsException` (429), `InternalServerErrorException` (500).

---

## Packages

### `@loonyjs/core`

The framework kernel. Contains everything needed to build an application.

```typescript
import {
  // Bootstrap
  LoonyFactory, LoonyApplication,

  // Module system
  Module, Global, DynamicModule,

  // DI
  Injectable, Inject, InjectionToken, Scope,

  // Controllers
  Controller, Get, Post, Put, Patch, Delete, Head, Options,
  Body, Param, Query, Req, Res, Headers, Ip,
  HttpCode, Header, Redirect,

  // Pipeline
  UseGuards, UseInterceptors, UsePipes, UseFilters,
  SetMetadata, Catch,

  // Interfaces
  CanActivate, LoonyInterceptor, PipeTransform, ExceptionFilter, LoonyMiddleware,

  // Exceptions
  HttpException, NotFoundException, BadRequestException, /* … */,

  // Logger
  Logger,

  // Services
  Reflector,

  // Config
  ConfigService, ConfigModule,

  // Observable
  Observable,
} from '@loonyjs/core';
```

### `@loonyjs/common`

Production-ready pipes, interceptors, guards, and filters:

```typescript
import {
  // Pipes
  ValidationPipe, ParseIntPipe, ParseUUIDPipe,

  // Interceptors
  LoggingInterceptor, TransformInterceptor, CacheInterceptor,
  CacheKey, CacheTTL,

  // Guards
  RolesGuard, Roles,

  // Filters
  HttpExceptionFilter,

  // DTO decorators
  ApiProperty, IsString, IsEmail, IsNotEmpty, MinLength, IsOptional,
} from '@loonyjs/common';
```

### `@loonyjs/testing`

DI-aware test module builder:

```typescript
import { TestingModule } from '@loonyjs/testing';

const module = await TestingModule.create({
  providers: [
    UsersService,
    { provide: EmailService, useValue: mockEmailService },
  ],
}).compile();

const service = module.get(UsersService);
```

### `@loonyjs/cli`

```bash
loony g module   users
loony g controller users
loony g service  users
loony g guard    auth
loony g interceptor logging
loony g middleware cors
loony new my-project
```

---

## CLI

```
╔══════════════════════════════════════════╗
║          LoonyJS CLI  v0.1.0             ║
╚══════════════════════════════════════════╝

Usage:
  loony generate <schematic> <name>   (alias: g)
  loony new <project-name>            (alias: n)
  loony build                         (alias: b)
  loony start                         (alias: s)

Schematics:
  module (mo)         Generate a feature module
  controller (co)     Generate a controller
  service (sv)        Generate a service
  guard (gu)          Generate a guard
  interceptor (in)    Generate an interceptor
  middleware (mi)     Generate middleware
```

See [docs/cli.md](docs/cli.md) for the full reference.

---

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | High-level design, module graph, request lifecycle |
| [Dependency Injection](docs/dependency-injection.md) | Container internals, scopes, custom providers, tokens |
| [Modules](docs/modules.md) | Feature modules, global modules, dynamic modules |
| [Controllers](docs/controllers.md) | Routing, parameter decorators, response shaping |
| [Middleware](docs/middleware-guards-interceptors.md) | Middleware, guards, interceptors — the pipeline in depth |
| [Pipes & Filters](docs/pipes-filters.md) | Validation, transformation, exception filters |
| [Configuration](docs/configuration.md) | ConfigModule, .env files, typed access |
| [Logging](docs/logging.md) | Logger usage, levels, context labels |
| [Testing](docs/testing.md) | Unit tests, TestingModule, mocking patterns |
| [CLI Reference](docs/cli.md) | Full CLI command reference |
| [NestJS Comparison](docs/nestjs-comparison.md) | Side-by-side design decisions |

---

## Design Philosophy

**1. No magic, just metadata.**
Every behaviour is driven by `reflect-metadata`. There are no hidden class registries or global singletons. You can reason about what your decorators do by reading a single file: [packages/core/src/metadata/metadata-keys.ts](packages/core/src/metadata/metadata-keys.ts).

**2. Swappable at every layer.**
The HTTP layer is behind `AbstractHttpAdapter`. The Observable implementation is behind a clean interface. The logger is injected, not imported globally. You can replace any piece without changing framework code.

**3. Zero mandatory heavy dependencies.**
Core requires only `express` and `reflect-metadata`. Validation, caching, logging, and Observable support are implemented without pulling in `rxjs`, `class-validator`, `class-transformer`, or `winston`.

**4. Fail loudly and clearly.**
Circular dependencies produce a named chain: `A → B → C → A`. Missing providers name the token. Config validation errors list every missing key. No silent failures.

**5. Test-first ergonomics.**
`TestingModule.create()` gives you a real DI container in tests. You override only what you need to mock. No framework-specific test runners required.

---

## Comparison with NestJS

| | NestJS | LoonyJS |
|---|---|---|
| **Observable** | RxJS (mandatory) | Custom `Observable<T>` — RxJS optional |
| **Validation** | class-validator + class-transformer | Built-in field decorators, zero deps |
| **DI resolution** | WeakMap module graph | Flat Map + parent-child containers |
| **Circular deps** | `forwardRef()` escape hatch | Detected + reported, no workaround needed |
| **Config** | Separate `@nestjs/config` package | Built into `@loonyjs/core` |
| **HTTP adapter** | Complex internal coupling | Clean `abstract class AbstractHttpAdapter` |
| **Pipeline elements** | Class-based, strict DI only | Class-based + auto-instantiation fallback |
| **Bundle** | ~3.5 MB (all packages) | Tiny — Express + reflect-metadata only |
| **Maturity** | Production, years of battle testing | Greenfield — all design decisions documented |

See [docs/nestjs-comparison.md](docs/nestjs-comparison.md) for a deep dive.

---

## Roadmap

- [ ] WebSocket gateway (`@WebSocketGateway`, `@SubscribeMessage`)
- [ ] Microservices transport layer (Redis, RabbitMQ adapters)
- [ ] GraphQL integration (resolver decorators)
- [ ] JWT utilities (`JwtModule`, `JwtStrategy`)
- [ ] Rate limiting interceptor
- [ ] OpenAPI / Swagger generator (from `@ApiProperty` metadata)
- [ ] Fastify adapter
- [ ] Prisma / TypeORM integration modules
- [ ] Hot reload in dev mode

---

## License

MIT © LoonyJS Contributors
