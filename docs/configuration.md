# Configuration

LoonyJS includes a built-in configuration system in `@loonyjs/core` — no extra package needed.

---

## Quick Setup

```typescript
import { Module } from '@loonyjs/core';
import { ConfigModule } from '@loonyjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,        // inject ConfigService anywhere without re-importing
      envFilePath: '.env',   // default; can omit
    }),
  ],
})
export class AppModule {}
```

```typescript
import { Injectable } from '@loonyjs/core';
import { ConfigService } from '@loonyjs/core';

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getPort(): number {
    return this.config.get<number>('PORT', 3000);
  }
}
```

---

## `ConfigModule.forRoot(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `envFilePath` | `string \| string[]` | `'.env'` | Path(s) to .env file(s). Multiple files are merged left-to-right. |
| `isGlobal` | `boolean` | `false` | Register ConfigService globally (no need to import in each module). |
| `validationSchema` | `Record<string, RuleObject>` | `undefined` | Validate and provide defaults for required keys. |

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env', '.env.local'],   // .env loaded first, .env.local overrides
  validationSchema: {
    PORT:    { type: 'number', default: 3000 },
    DB_URL:  { required: true },
    NODE_ENV:{ required: true, default: 'development' },
  },
})
```

If `required: true` and no value or default is provided, startup fails with a clear error:

```
Configuration validation failed:
  - "DB_URL" is required
```

---

## `.env` File Format

```ini
# Comments are ignored
PORT=3000
NODE_ENV=production

# Quoted values are stripped
APP_NAME="My LoonyJS App"
SECRET='supersecret'

# Empty lines ignored
DB_URL=mongodb://localhost:27017/mydb
```

Key rules:
- `KEY=VALUE` — no spaces around `=`
- Lines starting with `#` are comments
- Surrounding single or double quotes are automatically stripped
- Keys already in `process.env` are **preserved** — environment wins over file

---

## `ConfigService` API

```typescript
// get<T>(key, default?) — returns undefined if not found and no default
config.get<string>('APP_NAME')           // 'My App' | undefined
config.get<number>('PORT', 3000)         // coerces string '3000' to number 3000

// getOrThrow<T>(key) — throws if missing
config.getOrThrow<string>('DB_URL')      // throws: Configuration key "DB_URL" is required

// set(key, value) — override at runtime
config.set('FEATURE_FLAG', true)
```

### Automatic type coercion

`ConfigService` automatically converts environment string values to native types:

| Raw value | Coerced to |
|---|---|
| `"true"` | `true` (boolean) |
| `"false"` | `false` (boolean) |
| `"3000"` | `3000` (number) |
| `""` | `""` (kept as string) |
| `"hello"` | `"hello"` (string) |

---

## Environment-specific configuration

### Pattern 1 — multiple .env files

```typescript
ConfigModule.forRoot({
  envFilePath: [
    '.env',
    `.env.${process.env['NODE_ENV'] ?? 'development'}`,
    '.env.local',        // local overrides, not committed to git
  ],
})
```

### Pattern 2 — factory provider

```typescript
@Module({
  providers: [
    {
      provide: 'APP_CONFIG',
      useFactory: (config: ConfigService) => ({
        port:    config.get<number>('PORT', 3000),
        dbUrl:   config.getOrThrow('DB_URL'),
        isProd:  config.get('NODE_ENV') === 'production',
      }),
      inject: [ConfigService],
    },
  ],
})
```

### Pattern 3 — typed config classes

```typescript
@Injectable()
export class DatabaseConfig {
  readonly url: string;
  readonly maxConnections: number;

  constructor(config: ConfigService) {
    this.url = config.getOrThrow('DB_URL');
    this.maxConnections = config.get<number>('DB_MAX_CONN', 10);
  }
}

@Module({
  providers: [DatabaseConfig],
  exports: [DatabaseConfig],
})
export class DatabaseModule {}
```

---

## Usage in `main.ts`

Read config before the application is created when you need it for the port or adapter setup:

```typescript
import 'reflect-metadata';
import { LoonyFactory } from '@loonyjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await LoonyFactory.create(AppModule);
  const config = app.get(ConfigService);              // get from root container

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}
```

---

## Gotchas

1. **`isGlobal: false` (default)** — you must import `ConfigModule` in every module that needs `ConfigService`.

2. **`process.env` takes priority** — values already in the environment override `.env` file values. This is intentional: CI/CD systems inject secrets via environment, not files.

3. **No deep nesting** — `ConfigService` is a flat key-value store. For hierarchical config, use typed config classes (Pattern 3 above).

4. **Restart required** — the config is loaded once at startup. Changes to `.env` while the process is running have no effect.
