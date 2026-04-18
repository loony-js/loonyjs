# Lifecycle Hooks

LoonyJS calls lifecycle methods on your providers and modules at well-defined points during the application startup and shutdown sequence. You don't need to register hooks — the framework discovers them structurally (duck-typing).

---

## Hook Interfaces

Import any combination from `@loonyjs/core`:

```typescript
import {
  OnModuleInit,
  OnModuleDestroy,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@loonyjs/core';
```

---

## `OnModuleInit`

Called after the module's providers are instantiated and all imports are resolved. The right place for:

- Database connection setup
- Loading initial data / seeding
- Validating external service connectivity

```typescript
import { Injectable, OnModuleInit } from '@loonyjs/core';

@Injectable()
export class DatabaseService implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.connect();
    console.log('Database connected');
  }
}
```

**Order:** leaf modules first, then importers (depth-first, bottom-up).

---

## `OnModuleDestroy`

Called when the application begins its shutdown sequence (before `close()` resolves). Use it to:

- Release database connections
- Flush write buffers
- Deregister service discovery entries

```typescript
@Injectable()
export class CacheService implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.flush();
    this.client.disconnect();
  }
}
```

**Order:** reverse of `OnModuleInit` (root first, leaves last).

---

## `OnApplicationBootstrap`

Called after all modules are initialised **and the HTTP server is listening**. Use it for:

- Registering with service discovery
- Starting background workers
- Emitting "app ready" events

```typescript
@Injectable()
export class ServiceDiscovery implements OnApplicationBootstrap {
  async onApplicationBootstrap(): Promise<void> {
    await this.register({
      name: 'users-api',
      port: process.env['PORT'],
    });
  }
}
```

---

## `OnApplicationShutdown`

Called on SIGTERM or SIGINT (graceful shutdown). Receives the signal name. Use it for:

- Draining in-flight requests
- Stopping background jobs
- Deregistering from service discovery

```typescript
@Injectable()
export class WorkerService implements OnApplicationShutdown {
  async onApplicationShutdown(signal?: string): Promise<void> {
    console.log(`Shutting down on ${signal}`);
    await this.stopAllWorkers();
  }
}
```

Shutdown hooks are registered automatically. To disable them:

```typescript
const app = await LoonyFactory.create(AppModule, {
  disableShutdownHooks: true,
});
```

---

## Execution Order Summary

```
LoonyFactory.create()
  │
  ├─ Modules compiled (DI graph built)
  ├─ Controllers registered (routes attached)
  ├─ Middleware configured
  │
  ├─ [OnModuleInit]           ← all providers, leaf-first
  │
app.listen(port)
  │
  ├─ [OnApplicationBootstrap] ← all providers, same order as init
  │
  │   (application running, handling requests)
  │
SIGTERM / SIGINT / app.close()
  │
  ├─ [OnApplicationShutdown]  ← reverse order
  ├─ [OnModuleDestroy]        ← reverse order
  └─ HTTP server closed
```

---

## Implementing Multiple Hooks

A single class can implement any combination:

```typescript
@Injectable()
export class FullLifecycleService
  implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap, OnApplicationShutdown
{
  async onModuleInit() {
    console.log('Module ready');
  }

  async onApplicationBootstrap() {
    console.log('App listening');
  }

  async onApplicationShutdown(signal?: string) {
    console.log(`Shutdown: ${signal}`);
  }

  async onModuleDestroy() {
    console.log('Cleaning up');
  }
}
```

---

## Manual Shutdown

```typescript
const app = await LoonyFactory.create(AppModule);
await app.listen(3000);

// Later — triggers OnApplicationShutdown + OnModuleDestroy + HTTP server close
await app.close();
```
