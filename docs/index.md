# LoonyJS Documentation

Welcome to the LoonyJS documentation. LoonyJS is a production-ready, decorator-driven Node.js backend framework built entirely from first principles.

---

## Getting Started

| | |
|---|---|
| [README](../README.md) | Overview, quick start, feature table |
| [Architecture](architecture.md) | High-level design, module graph, bootstrap sequence, file map |

---

## Core Concepts

| | |
|---|---|
| [Modules](modules.md) | Feature modules, global modules, dynamic modules, import/export |
| [Controllers](controllers.md) | Routing, HTTP method decorators, parameter decorators, response shaping |
| [Dependency Injection](dependency-injection.md) | Container, scopes, providers, tokens, injection |
| [Lifecycle Hooks](lifecycle-hooks.md) | OnModuleInit, OnApplicationBootstrap, OnApplicationShutdown |

---

## The Request Pipeline

| | |
|---|---|
| [Middleware, Guards & Interceptors](middleware-guards-interceptors.md) | Execution order, implementation, composition |
| [Pipes & Exception Filters](pipes-filters.md) | Validation, transformation, error handling |
| [Observable](observable.md) | Custom Observable<T>, interceptor operators |

---

## Utilities

| | |
|---|---|
| [Configuration](configuration.md) | ConfigModule, .env files, typed access |
| [Logging](logging.md) | Logger API, levels, context labels, custom adapters |
| [HTTP Adapters](http-adapters.md) | ExpressAdapter, custom adapters, HTTPS |

---

## Tooling

| | |
|---|---|
| [Testing](testing.md) | TestingModule, mocking, guard/pipe/interceptor tests |
| [CLI Reference](cli.md) | loony g, loony new, scaffolding schematics |

---

## Reference

| | |
|---|---|
| [NestJS Comparison](nestjs-comparison.md) | Side-by-side design decisions and trade-offs |

---

## Quick Links

**Decorators**

```
@Module          @Global           @Injectable        @Inject
@Controller      @Get @Post @Put   @Patch @Delete
@Body @Param     @Query @Headers   @Req @Res @Ip
@UseGuards       @UseInterceptors  @UsePipes          @UseFilters
@SetMetadata     @Catch            @HttpCode          @Header @Redirect
```

**Exceptions**

```
HttpException            BadRequestException (400)
UnauthorizedException (401)   ForbiddenException (403)
NotFoundException (404)       ConflictException (409)
UnprocessableEntityException (422)   TooManyRequestsException (429)
InternalServerErrorException (500)   ServiceUnavailableException (503)
```

**Common package**

```
ValidationPipe    ParseIntPipe     ParseUUIDPipe
LoggingInterceptor   TransformInterceptor   CacheInterceptor
RolesGuard   @Roles()
HttpExceptionFilter
@IsString @IsEmail @IsNotEmpty @MinLength @MaxLength @Min @Max @IsOptional
```
