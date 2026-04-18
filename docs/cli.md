# CLI Reference

The `@loonyjs/cli` package provides the `loony` command for scaffolding projects and resources.

---

## Installation

Within the monorepo, the CLI is at `packages/cli/dist/bin/loony.js`. In a standalone project, install globally:

```bash
npm install -g @loonyjs/cli
```

Or invoke via `npx`:

```bash
npx loony g module users
```

---

## Commands

### `loony new <project-name>`

Scaffold a new LoonyJS project from scratch.

```bash
loony new my-api
cd my-api
npm install
npx ts-node src/main.ts
```

Generated structure:

```
my-api/
├── src/
│   ├── main.ts         — bootstrap, listen()
│   └── app.module.ts   — root module
├── package.json
└── tsconfig.json
```

`package.json` includes `@loonyjs/core`, `@loonyjs/common`, `reflect-metadata`, `typescript`, and `ts-node`.

---

### `loony generate <schematic> <name>`

**Alias:** `loony g <schematic> <name>`

Generate a resource. Schematics:

| Schematic | Alias | Creates |
|---|---|---|
| `module` | `mo` | Module + Controller + Service |
| `controller` | `co` | Controller only |
| `service` | `sv` | Service only |
| `guard` | `gu` | Guard |
| `interceptor` | `in` | Interceptor |
| `middleware` | `mi` | Middleware |

---

#### `loony g module <name>`

Generates a complete feature slice:

```bash
loony g module orders
```

```
src/
└── orders/
    ├── orders.module.ts
    ├── orders.controller.ts
    └── orders.service.ts
```

**`orders.module.ts`**
```typescript
import { Module } from '@loonyjs/core';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
```

**`orders.controller.ts`** — pre-wired with `findAll`, `findOne`, `create`, `update`, `remove`.

**`orders.service.ts`** — in-memory CRUD implementation ready to replace with a real datasource.

---

#### `loony g controller <name>`

Generates a standalone controller in `src/<name>/`:

```bash
loony g controller products
```

---

#### `loony g service <name>`

Generates a standalone service in `src/<name>/`:

```bash
loony g service products
```

---

#### `loony g guard <name>`

Generates a guard in `src/guards/`:

```bash
loony g guard jwt-auth
```

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // TODO: implement guard logic
    return true;
  }
}
```

---

#### `loony g interceptor <name>`

Generates an interceptor in `src/interceptors/`:

```bash
loony g interceptor timing
```

```typescript
@Injectable()
export class TimingInterceptor implements LoonyInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // TODO: implement interceptor logic
    return next.handle();
  }
}
```

---

#### `loony g middleware <name>`

Generates middleware in `src/middleware/`:

```bash
loony g middleware cors
```

```typescript
@Injectable()
export class CorsMiddleware implements LoonyMiddleware {
  use(req: any, res: any, next: () => void): void {
    // TODO: implement middleware logic
    next();
  }
}
```

---

### `loony build`

Delegates to `npm run build` in the current directory.

```bash
loony build
# → npx tsc -p tsconfig.json
```

---

### `loony start`

Delegates to `npm run start` in the current directory.

```bash
loony start
# → node dist/main.js
```

---

## Naming Conventions

The CLI handles case conversions automatically:

| Input | Class name | File name |
|---|---|---|
| `users` | `UsersModule` | `users.module.ts` |
| `user-profile` | `UserProfileModule` | `user-profile.module.ts` |
| `UserProfile` | `UserProfileModule` | `user-profile.module.ts` |

---

## Full Help

```bash
loony --help
```

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

Examples:
  loony g module users
  loony g controller users
  loony g service users
  loony new my-project
```
