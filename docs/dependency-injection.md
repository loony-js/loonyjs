# Dependency Injection

LoonyJS ships a fully custom DI container built from scratch. It supports everything you'd expect from a modern IoC container — constructor injection, multiple provider shapes, lifecycle scopes, async factories, and circular dependency detection — without any external DI library.

---

## How it works

When a class is decorated with `@Injectable()`, TypeScript (via `emitDecoratorMetadata`) writes the constructor parameter types into `reflect-metadata` under the key `design:paramtypes`. The container reads that list at resolve time and recursively resolves each dependency.

```
@Injectable()           ← marks class as injectable, sets scope
class UsersService {
  constructor(private db: DatabaseService) {}  ← design:paramtypes = [DatabaseService]
}

container.register(UsersService)
container.resolve(UsersService)
  → reads design:paramtypes → [DatabaseService]
  → resolves DatabaseService (recursively)
  → new UsersService(dbInstance)
```

---

## The Container

`Container` (`packages/core/src/di/container.ts`) is a plain class you can instantiate independently:

```typescript
import { Container } from '@loonyjs/core';

const container = new Container();
container.register(MyService);
const instance = container.resolve(MyService);
```

Each LoonyJS module gets its own **child container** that delegates to its parent when a token cannot be found locally. This gives you module-scoped provider isolation without sacrificing cross-module resolution.

---

## Injection Tokens

A token is the key used to look up a provider. It can be:

| Token type | Example | When to use |
|---|---|---|
| Class constructor | `UsersService` | Most common — TypeScript types are tokens |
| `InjectionToken<T>` | `new InjectionToken('DB_URL')` | Non-class values (strings, objects) |
| Plain string | `'API_KEY'` | Simple named values |
| Symbol | `Symbol('cache')` | Collision-proof named tokens |

```typescript
import { InjectionToken, Inject, Injectable } from '@loonyjs/core';

// Define the token
export const DB_URL = new InjectionToken<string>('DB_URL');

// Register a value provider
container.register({ provide: DB_URL, useValue: 'mongodb://localhost/mydb' });

// Inject it
@Injectable()
export class DatabaseService {
  constructor(@Inject(DB_URL) private readonly url: string) {
    // url === 'mongodb://localhost/mydb'
  }
}
```

---

## Provider Shapes

### 1. Type provider (shorthand)

```typescript
@Module({
  providers: [UsersService],  // equivalent to { provide: UsersService, useClass: UsersService }
})
```

### 2. `useClass` — substitute a different implementation

```typescript
@Module({
  providers: [
    {
      provide: PaymentService,
      useClass: process.env['NODE_ENV'] === 'test'
        ? MockPaymentService
        : StripePaymentService,
    },
  ],
})
```

### 3. `useValue` — inject a literal value

```typescript
@Module({
  providers: [
    { provide: 'APP_NAME', useValue: 'LoonyJS Demo' },
    { provide: ConfigObject, useValue: { timeout: 5000, retries: 3 } },
  ],
})
```

### 4. `useFactory` — dynamic, async-safe construction

```typescript
@Module({
  providers: [
    {
      provide: DatabaseConnection,
      useFactory: async (config: ConfigService) => {
        const conn = new DatabaseConnection(config.getOrThrow('DB_URL'));
        await conn.connect();
        return conn;
      },
      inject: [ConfigService],  // resolved and passed as factory arguments
    },
  ],
})
```

### 5. `useExisting` — alias one token to another

```typescript
@Module({
  providers: [
    Logger,
    { provide: 'LOGGER', useExisting: Logger }, // same singleton, two tokens
  ],
})
```

---

## Scopes

Scopes control how many instances the container creates.

```typescript
import { Injectable, Scope } from '@loonyjs/core';

@Injectable({ scope: Scope.SINGLETON })   // default — one instance per container
export class CacheService {}

@Injectable({ scope: Scope.TRANSIENT })   // new instance every time it is injected
export class RequestLogger {}
```

| Scope | Instances | Lifetime |
|---|---|---|
| `SINGLETON` | 1 per container | Application lifetime |
| `TRANSIENT` | 1 per injection site | No sharing |
| `REQUEST` | 1 per HTTP request | (requires request context, planned) |

> **Singleton is default.** Most services — database connections, caches, service logic — should be singletons.

---

## The `@Inject()` Decorator

When the type alone is insufficient (interfaces, strings, Symbols), use `@Inject()` to specify the token explicitly:

```typescript
@Injectable()
export class ReportService {
  constructor(
    private readonly usersService: UsersService,              // resolved by type
    @Inject('REPORT_FORMAT') private readonly format: string, // resolved by string token
    @Inject(DB_URL) private readonly dbUrl: string,           // resolved by InjectionToken
  ) {}
}
```

---

## Circular Dependency Detection

If A depends on B which depends on A, the container detects this before any instantiation attempt:

```
Error: Circular dependency detected: ServiceA → ServiceB → ServiceA
```

Unlike NestJS, there is no `forwardRef()` escape hatch. The solution is always to restructure:

- Extract shared logic into a third service C
- Use the `useFactory` provider to break the cycle
- Inject the container itself (`Container`) and resolve lazily

---

## Accessing the Container Directly

In rare cases (e.g., lazy resolution) you can inject the container:

```typescript
@Injectable()
export class LazyLoader {
  constructor(private readonly container: Container) {}

  loadPlugin(name: string) {
    return this.container.resolve(name);
  }
}
```

`Container` is pre-registered in every container instance.

---

## Container API

```typescript
// Registration
container.register(provider: Provider): void
container.registerAll(providers: Provider[]): void
container.override(token, value): void          // replace for testing

// Resolution
container.resolve<T>(token: Token<T>): T
container.resolveAsync<T>(token: Token<T>): Promise<T>
container.has(token: Token): boolean

// Bootstrap (resolve all singletons eagerly)
container.bootstrapAll(): Promise<void>
```

---

## Testing with DI

The `TestingModule` builder creates a real container with only the providers you declare, making it easy to isolate and mock:

```typescript
import { TestingModule } from '@loonyjs/testing';

const module = await TestingModule.create({
  providers: [
    UsersService,
    // Override the real EmailService with a mock
    {
      provide: EmailService,
      useValue: {
        sendWelcome: jest.fn().mockResolvedValue(undefined),
      },
    },
  ],
}).compile();

const service = module.get(UsersService);
const email   = module.get(EmailService);
```

See [testing.md](testing.md) for the full guide.
