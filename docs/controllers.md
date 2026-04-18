# Controllers

Controllers are responsible for handling incoming HTTP requests and returning responses. They live at the presentation layer — they should call services, never contain business logic themselves.

---

## Declaring a Controller

```typescript
import { Controller } from '@loonyjs/core';

@Controller('users')       // base path: /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
}
```

The string passed to `@Controller()` is the base path for all routes in this class. It is prepended to each method-level path.

---

## HTTP Method Decorators

| Decorator | HTTP Method | Example path |
|---|---|---|
| `@Get(path?)` | GET | `@Get()` → `/users`, `@Get(':id')` → `/users/:id` |
| `@Post(path?)` | POST | `@Post()` → `/users` |
| `@Put(path?)` | PUT | `@Put(':id')` → `/users/:id` |
| `@Patch(path?)` | PATCH | `@Patch(':id')` → `/users/:id` |
| `@Delete(path?)` | DELETE | `@Delete(':id')` → `/users/:id` |
| `@Head(path?)` | HEAD | |
| `@Options(path?)` | OPTIONS | |
| `@All(path?)` | Any method | |

```typescript
import { Controller, Get, Post, Patch, Delete } from '@loonyjs/core';

@Controller('articles')
export class ArticlesController {
  @Get()             findAll()                 { /* GET /articles       */ }
  @Get(':slug')      findOne()                 { /* GET /articles/:slug */ }
  @Post()            create()                  { /* POST /articles      */ }
  @Patch(':id')      update()                  { /* PATCH /articles/:id */ }
  @Delete(':id')     remove()                  { /* DELETE /articles/:id*/ }
}
```

---

## Route Order Matters

Routes are registered in the order they appear in the class. Always put literal segments before parameter segments:

```typescript
@Controller('users')
export class UsersController {
  @Get('count')    // must be before :id or Express treats "count" as an id
  count() { ... }

  @Get(':id')
  findOne(@Param('id') id: string) { ... }
}
```

---

## Parameter Decorators

### `@Param(key?)`

```typescript
@Get(':id')
findOne(@Param('id') id: string) {
  // id = req.params.id
}

@Get(':category/:slug')
findBySlug(
  @Param('category') category: string,
  @Param('slug') slug: string,
) {}

@Get(':id')
findOneRaw(@Param() params: Record<string, string>) {
  // params = { id: '...' }   (whole params object)
}
```

### `@Body(key?)`

```typescript
@Post()
create(@Body() dto: CreateUserDto) {
  // dto = req.body
}

@Post()
createPartial(@Body('name') name: string) {
  // name = req.body.name
}
```

### `@Query(key?)`

```typescript
@Get()
findAll(@Query('limit') limit: string, @Query('offset') offset: string) {
  // /users?limit=10&offset=0
}

@Get()
search(@Query() query: Record<string, string>) {
  // whole query string object
}
```

### `@Headers(name?)`

```typescript
@Get()
withHeader(@Headers('authorization') auth: string) {
  // req.headers['authorization']
}

@Get()
allHeaders(@Headers() headers: Record<string, string>) {}
```

### `@Req()` / `@Res()` / `@Next()`

```typescript
import { Req, Res, Next } from '@loonyjs/core';

@Get()
raw(@Req() req: any, @Res() res: any) {
  // Direct access to Express req/res.
  // If you inject @Res(), YOU must send the response — LoonyJS won't.
  res.status(200).json({ ok: true });
}
```

> **Warning:** Injecting `@Res()` bypasses the interceptor post-processing pipeline. Only use it when you need streaming, SSE, or multipart responses.

### `@Ip()`

```typescript
@Get()
checkIp(@Ip() ip: string) {
  // respects X-Forwarded-For
}
```

---

## Response Shaping

### Return value → response body

By default, whatever the handler returns becomes the JSON response body:

```typescript
@Get()
findAll() {
  return [{ id: 1, name: 'Alice' }];
  // → HTTP 200  [{"id":1,"name":"Alice"}]
}
```

Return `undefined` or `null` → empty body with the default status code.

### `@HttpCode(statusCode)`

Override the default status code (200 for GET/PATCH/DELETE, 201 for POST):

```typescript
@Post()
@HttpCode(201)          // explicit — same as default for POST, but documented
create(@Body() dto: CreateUserDto) { ... }

@Delete(':id')
@HttpCode(204)          // No Content
remove(@Param('id') id: string) {
  this.service.remove(id);
  // return nothing → 204
}
```

### `@Header(name, value)`

Add a static response header to a route:

```typescript
@Get('export')
@Header('Content-Type', 'text/csv')
@Header('Content-Disposition', 'attachment; filename="users.csv"')
exportCsv() {
  return this.service.toCsv();
}
```

### `@Redirect(url, statusCode?)`

```typescript
@Get('old-path')
@Redirect('/new-path', 301)
redirectLegacy() {}

// Dynamic redirect: return { url, statusCode } from the handler
@Get('dynamic')
@Redirect('https://example.com')
dynamic() {
  return { url: 'https://other.com', statusCode: 302 };
}
```

---

## Custom Parameter Decorators

Use `createParamDecoratorFactory` to extract anything from the request:

```typescript
import { createParamDecoratorFactory } from '@loonyjs/core';

// Extracts req.user (set by auth middleware)
export const CurrentUser = createParamDecoratorFactory((req) => req.user);

// Use it in any controller
@Get('profile')
getProfile(@CurrentUser() user: AuthUser) {
  return user;
}
```

---

## Full Example

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode,
  UseGuards, UseInterceptors,
} from '@loonyjs/core';
import { LoggingInterceptor } from '@loonyjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)          // applied to every route in this controller
@UseInterceptors(LoggingInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('count')
  count() {
    return { count: this.usersService.count() };
  }

  @Get()
  findAll(@Query('limit') limit?: string) {
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    this.usersService.remove(id);
  }
}
```
