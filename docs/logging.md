# Logging

LoonyJS ships a structured, coloured logger that works without any external dependency. It supports contextual labels, level filtering, and is designed to be injected — but also usable as a plain import.

---

## Log Levels

Levels in ascending severity order:

| Level | Colour | Use for |
|---|---|---|
| `verbose` | White | Highly detailed trace info (module compilation, route registration) |
| `debug` | Blue | Developer debugging, variable dumps |
| `log` | Green | Normal application events |
| `warn` | Yellow | Recoverable issues, deprecations |
| `error` | Red | Errors that affected a request or operation |
| `fatal` | Magenta | Application-level failures |

---

## Basic Usage

```typescript
import { Logger } from '@loonyjs/core';

// Instantiate with a context label shown in every line
const log = new Logger('UsersService');

log.log('User created successfully');
log.warn('Rate limit approaching for user 42');
log.error('Database connection failed', error.stack);
log.verbose('Resolving token: UsersService');
```

Output:
```
LOG     2024-01-01T12:00:00.000Z [UsersService] User created successfully
WARN    2024-01-01T12:00:00.000Z [UsersService] Rate limit approaching for user 42
ERROR   2024-01-01T12:00:00.000Z [UsersService] Database connection failed
```

---

## Injecting the Logger

Declare a `Logger` instance as a class field — the framework does not auto-inject it, so no need to register it as a provider:

```typescript
import { Injectable } from '@loonyjs/core';
import { Logger } from '@loonyjs/core';

@Injectable()
export class UsersService {
  private readonly log = new Logger(UsersService.name);

  create(dto: CreateUserDto) {
    this.log.log(`Creating user: ${dto.email}`);
    // ...
  }
}
```

Using `UsersService.name` as the context means the label automatically updates if you rename the class.

---

## Logger API

```typescript
log.verbose(message: any, context?: string): void
log.debug(message: any, context?: string): void
log.log(message: any, context?: string): void
log.warn(message: any, context?: string): void
log.error(message: any, trace?: string, context?: string): void
log.fatal(message: any, trace?: string, context?: string): void

log.setContext(context: string): void    // change the context label after construction
```

The optional `context` parameter on each method overrides the instance context for that one call:

```typescript
log.log('Connecting…', 'Database');    // prints [Database] even if instance was [AppService]
```

---

## Level Filtering

Filter which levels are printed globally — useful for suppressing `verbose`/`debug` in production:

```typescript
import { Logger, LogLevel } from '@loonyjs/core';

// Production: only warn, error, fatal
Logger.setLogLevels(['warn', 'error', 'fatal']);

// Development: everything
Logger.setLogLevels(['verbose', 'debug', 'log', 'warn', 'error', 'fatal']);
```

Or configure from an environment variable in `main.ts`:

```typescript
const isDev = process.env['NODE_ENV'] !== 'production';
Logger.setLogLevels(
  isDev
    ? ['verbose', 'debug', 'log', 'warn', 'error', 'fatal']
    : ['log', 'warn', 'error', 'fatal'],
);
```

---

## Object Logging

Pass any value — non-string values are `JSON.stringify`-ed with 2-space indent:

```typescript
log.log({ userId: 42, email: 'alice@example.com', roles: ['admin'] });
```

```
LOG     2024-01-01T12:00:00.000Z [UsersService]
{
  "userId": 42,
  "email": "alice@example.com",
  "roles": ["admin"]
}
```

---

## Logging in Interceptors

The built-in `LoggingInterceptor` from `@loonyjs/common` logs every request's method, path, and response time:

```typescript
import { LoggingInterceptor } from '@loonyjs/common';

app.useGlobalInterceptors(new LoggingInterceptor());
```

Output:
```
LOG     2024-01-01T12:00:00.000Z [HTTP] GET /users → 12ms
LOG     2024-01-01T12:00:00.000Z [HTTP] POST /users → 45ms
WARN    2024-01-01T12:00:00.000Z [ExceptionFilter] GET /users/999 → 404: User #999 not found
```

---

## Custom Logger

Implement `LoggerService` to integrate with Winston, Pino, or any logging library:

```typescript
import { LoggerService } from '@loonyjs/core';
import winston from 'winston';

export class WinstonAdapter implements LoggerService {
  private readonly logger = winston.createLogger({ /* … */ });

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }
  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }
  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }
  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }
  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }
  fatal(message: any, trace?: string, context?: string) {
    this.logger.crit(message, { trace, context });
  }
}
```

Then replace the static instance if you want it used framework-wide:

```typescript
import { Logger } from '@loonyjs/core';
Logger.instance = new WinstonAdapter();
```

---

## `LoggerService` Interface

```typescript
interface LoggerService {
  verbose(message: any, context?: string): void;
  debug(message: any, context?: string): void;
  log(message: any, context?: string): void;
  warn(message: any, context?: string): void;
  error(message: any, trace?: string, context?: string): void;
  fatal(message: any, trace?: string, context?: string): void;
  setLogLevels?(levels: LogLevel[]): void;
}
```
