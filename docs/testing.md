# Testing

LoonyJS is designed to be testable from day one. The `@loonyjs/testing` package provides a `TestingModule` builder that creates a real DI container with only the providers you declare — no HTTP server, no global state.

---

## Install

```bash
npm install --save-dev @loonyjs/testing
```

---

## TestingModule

`TestingModule.create(metadata).compile()` mirrors the framework's module bootstrap, but without routing or HTTP adapter overhead.

```typescript
import 'reflect-metadata';
import { TestingModule } from '@loonyjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await TestingModule.create({
      providers: [UsersService],
    }).compile();

    service = module.get(UsersService);
  });

  it('returns seeded users', () => {
    expect(service.findAll().length).toBeGreaterThan(0);
  });
});
```

---

## Mocking Dependencies

Replace any provider with a mock — the container resolves your override instead:

```typescript
const mockEmailService = {
  sendWelcome: jest.fn().mockResolvedValue(undefined),
  sendReset:   jest.fn().mockResolvedValue(undefined),
};

const module = await TestingModule.create({
  providers: [
    UsersService,
    { provide: EmailService, useValue: mockEmailService },
  ],
}).compile();

const service = module.get(UsersService);
await service.create({ name: 'Alice', email: 'alice@example.com' });

expect(mockEmailService.sendWelcome).toHaveBeenCalledWith('alice@example.com');
```

---

## `createMockProvider` Helper

Generates a stub provider where every method returns `undefined` by default:

```typescript
import { createMockProvider } from '@loonyjs/testing';

const emailMock = createMockProvider(EmailService);
// → { provide: EmailService, useValue: { sendWelcome: () => undefined, … } }

const module = await TestingModule.create({
  providers: [UsersService, emailMock],
}).compile();
```

Then assert on specific methods in your test body.

---

## Runtime Overrides

Override a provider after compilation:

```typescript
const module = await TestingModule.create({
  providers: [UsersService, EmailService],
}).compile();

// Override for this specific test
module.override(EmailService, { sendWelcome: jest.fn() });

const service = module.get(UsersService);
```

---

## Testing Lifecycle Hooks

If your service implements `OnModuleInit`, call it manually in tests:

```typescript
const module = await TestingModule.create({
  providers: [UsersService],
}).compile();

const service = module.get(UsersService);

// onModuleInit is NOT called automatically in TestingModule
await (service as any).onModuleInit();

expect(service.findAll()).toHaveLength(2); // seeded
```

---

## Testing Guards

Guards implement a simple interface — test them as plain classes:

```typescript
import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContextHost } from '@loonyjs/core'; // internal, but available

const mockReflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
const guard = new JwtAuthGuard(mockReflector as any);

const context = {
  getHandler: () => () => {},
  getClass:   () => class {},
  switchToHttp: () => ({
    getRequest: () => ({ user: { id: 1 } }),
    getResponse: () => ({}),
    getNext: () => () => {},
  }),
};

expect(guard.canActivate(context as any)).toBe(true);
```

---

## Testing Pipes

```typescript
import { ParseIntPipe } from '@loonyjs/common';
import { BadRequestException } from '@loonyjs/core';

const pipe = new ParseIntPipe();
const meta = { type: 'param' as const, data: 'id' };

expect(pipe.transform('42', meta)).toBe(42);
expect(() => pipe.transform('abc', meta)).toThrow(BadRequestException);
```

---

## Testing Interceptors

```typescript
import { LoggingInterceptor } from '@loonyjs/common';
import { Observable } from '@loonyjs/core';

const interceptor = new LoggingInterceptor();

const mockCtx = {
  switchToHttp: () => ({ getRequest: () => ({ method: 'GET', url: '/test' }) }),
  getHandler:   () => () => {},
  getClass:     () => class {},
};

const mockNext = {
  handle: () => Observable.of({ id: 1 }),
};

const result = await interceptor
  .intercept(mockCtx as any, mockNext)
  .toPromise();

expect(result).toEqual({ id: 1 });
```

---

## Example: Full Service Test

```typescript
import 'reflect-metadata';
import { TestingModule } from '@loonyjs/testing';
import { NotFoundException, ConflictException } from '@loonyjs/core';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await TestingModule.create({
      providers: [UsersService],
    }).compile();

    service = module.get(UsersService);
    await (service as any).onModuleInit(); // seed demo data
  });

  describe('findAll', () => {
    it('returns all users', () => {
      expect(service.findAll()).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('returns existing user', () => {
      expect(service.findOne('1').id).toBe('1');
    });

    it('throws NotFoundException for unknown id', () => {
      expect(() => service.findOne('999')).toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns a new user', () => {
      const user = service.create({
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'pass1234',
      });
      expect(user.id).toBeDefined();
      expect(user.email).toBe('charlie@example.com');
    });

    it('throws ConflictException on duplicate email', () => {
      expect(() =>
        service.create({ name: 'Dup', email: 'alice@example.com', password: 'pass' })
      ).toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('removes the user and subsequent findOne throws', () => {
      service.remove('1');
      expect(() => service.findOne('1')).toThrow(NotFoundException);
    });
  });
});
```

---

## CompiledTestingModule API

```typescript
module.get<T>(token: Token<T>): T           // synchronous resolution
module.getAsync<T>(token: Token<T>): Promise<T>
module.override<T>(token: Token<T>, value: T): void
```

---

## Running Tests

LoonyJS is test-runner agnostic. Use Jest, Vitest, Node's built-in test runner, or plain `ts-node`:

```bash
# Jest
jest

# Vitest
vitest

# ts-node (no test runner — manual asserts like the spec.ts in the demo)
ts-node src/users/users.service.spec.ts
```

Configure Jest with `ts-jest` and `experimentalDecorators: true` + `emitDecoratorMetadata: true` in your tsconfig.
