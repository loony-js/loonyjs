# Pipes & Exception Filters

---

## Pipes

Pipes sit between parameter extraction and the route handler. They have two responsibilities:

1. **Transformation** — convert the input to the desired type (string `"42"` → number `42`)
2. **Validation** — throw `BadRequestException` if the input is invalid

### Implementing a pipe

```typescript
import { PipeTransform, ArgumentMetadata, Injectable } from '@loonyjs/core';

@Injectable()
export class TrimPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (typeof value !== 'string') return value;
    return value.trim();
  }
}
```

`ArgumentMetadata` contains:

| Field | Type | Description |
|---|---|---|
| `type` | `'body' \| 'query' \| 'param' \| 'custom'` | Where the value came from |
| `metatype` | `Function \| undefined` | The TypeScript type of the parameter |
| `data` | `string \| undefined` | The key passed to `@Body('key')` etc. |

### Applying pipes

```typescript
// Global — runs on every route argument
app.useGlobalPipes(new ValidationPipe());

// Controller
@UsePipes(TrimPipe)
@Controller('users')
export class UsersController {}

// Route
@UsePipes(ParseIntPipe)
@Get(':id')
findOne(@Param('id') id: string) {}
```

---

## Built-in Pipes (`@loonyjs/common`)

### `ValidationPipe`

Validates DTO classes decorated with field decorators. If validation fails, throws `BadRequestException` with the list of errors.

```typescript
import { ValidationPipe } from '@loonyjs/common';

// Apply globally
app.useGlobalPipes(new ValidationPipe());
```

DTOs are plain classes decorated with field rules:

```typescript
import {
  IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum
} from '@loonyjs/common';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

**Available field validators** (all zero-dependency):

| Decorator | Validates |
|---|---|
| `@IsString()` | `typeof value === 'string'` |
| `@IsNumber()` | `typeof value === 'number'` and not NaN |
| `@IsBoolean()` | `typeof value === 'boolean'` |
| `@IsEmail()` | Basic email regex |
| `@IsNotEmpty()` | Not `undefined`, `null`, or `''` |
| `@MinLength(n)` | String length ≥ n |
| `@MaxLength(n)` | String length ≤ n |
| `@Min(n)` | Number ≥ n |
| `@Max(n)` | Number ≤ n |
| `@IsOptional()` | Skips all other checks if value is absent |
| `@IsArray()` | `Array.isArray(value)` |
| `@IsEnum(Enum)` | `Object.values(Enum).includes(value)` |

### `ParseIntPipe`

Converts a string route parameter to an integer:

```typescript
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  // id is guaranteed to be a number
}
// /users/abc → 400 Bad Request: '"abc" is not a valid integer (param: id)'
```

### `ParseUUIDPipe`

```typescript
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) {
  // validates UUID v4 format
}
```

---

## Custom Validation with `validateObject`

The `validateObject` helper runs field rules on a plain object — useful outside of the pipe:

```typescript
import { validateObject } from '@loonyjs/common';

const errors = validateObject(requestBody, CreateUserDto);
if (errors.length > 0) {
  throw new BadRequestException({ message: 'Validation failed', errors });
}
```

---

## Exception Filters

Exception filters are the last line of defence. They catch thrown exceptions and convert them to HTTP responses.

### Implementing a filter

```typescript
import { ExceptionFilter, Catch, ExecutionContext, HttpException } from '@loonyjs/core';

@Catch(HttpException)          // handle only HttpException (and subclasses)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, context: ExecutionContext): void {
    const res = context.switchToHttp().getResponse();
    const req = context.switchToHttp().getRequest();

    res.status(exception.getStatus()).json({
      ...exception.toJSON(),
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
```

`@Catch()` with no arguments catches everything:

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, context: ExecutionContext): void {
    const res = context.switchToHttp().getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    res.status(status).json({ statusCode: status, message: 'Unexpected error' });
  }
}
```

### Applying filters

```typescript
// Global — catches unhandled exceptions across the entire application
app.useGlobalFilters(new HttpExceptionFilter());

// Controller — only for routes in this class
@UseFilters(DatabaseExceptionFilter)
@Controller('users')
export class UsersController {}

// Route — most specific
@UseFilters(ValidationExceptionFilter)
@Post()
create() {}
```

Filter precedence (first matching filter wins):

```
Route filters → Controller filters → Global filters
```

### Built-in `HttpExceptionFilter` (`@loonyjs/common`)

```typescript
import { HttpExceptionFilter } from '@loonyjs/common';

app.useGlobalFilters(new HttpExceptionFilter());
```

Response shape:
```json
{
  "statusCode": 404,
  "message": "User #99 not found",
  "path": "/users/99",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Built-in HTTP Exceptions

All subclass `HttpException` and are importable from `@loonyjs/core`:

```typescript
import {
  BadRequestException,           // 400
  UnauthorizedException,         // 401
  ForbiddenException,            // 403
  NotFoundException,             // 404
  MethodNotAllowedException,     // 405
  ConflictException,             // 409
  UnprocessableEntityException,  // 422
  TooManyRequestsException,      // 429
  InternalServerErrorException,  // 500
  NotImplementedException,       // 501
  ServiceUnavailableException,   // 503
} from '@loonyjs/core';

// Simple message
throw new NotFoundException('User not found');

// Rich object body
throw new BadRequestException({
  message: 'Validation failed',
  errors: ['name is required', 'email must be valid'],
});
```

`HttpException` API:

```typescript
exception.getStatus()     // → number
exception.getResponse()   // → string | Record<string, unknown>
exception.toJSON()        // → { statusCode, message, ...rest }
exception.message         // → string (Error.message)
```

---

## Combining Pipes and Filters

A typical global configuration:

```typescript
import { ValidationPipe } from '@loonyjs/common';
import { HttpExceptionFilter } from '@loonyjs/common';

async function bootstrap() {
  const app = await LoonyFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());   // catch and format all HTTP errors
  app.useGlobalPipes(new ValidationPipe());           // validate all DTOs

  await app.listen(3000);
}
```

With this in place:
- Invalid request bodies → `400 Bad Request` with field errors
- `throw new NotFoundException(...)` → `404` with JSON body + path + timestamp
- Unhandled errors → `500 Internal Server Error`
