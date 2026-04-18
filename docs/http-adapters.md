# HTTP Adapters

LoonyJS never touches Express (or any HTTP library) directly. All HTTP operations go through `AbstractHttpAdapter`, an abstract class that defines the contract every adapter must fulfil.

This means you can swap the HTTP transport without changing any framework or application code.

---

## Default: ExpressAdapter

Express is used by default when you call `LoonyFactory.create()`:

```typescript
const app = await LoonyFactory.create(AppModule);
// equivalent to:
const app = await LoonyFactory.create(AppModule, new ExpressAdapter());
```

`ExpressAdapter` configures:
- `express.json()` body parser
- `express.urlencoded({ extended: true })` parser
- Routes registered in the order controllers are compiled

Access the underlying Express instance:

```typescript
const expressApp = app.getHttpAdapter().getInstance();
// attach Express-specific middleware
expressApp.use(helmet());
expressApp.use(compression());
```

---

## Custom Adapter

Implement `AbstractHttpAdapter<TServer, TRequest, TResponse>`:

```typescript
import { AbstractHttpAdapter } from '@loonyjs/core';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export class FastifyAdapter extends AbstractHttpAdapter<
  FastifyInstance,
  FastifyRequest,
  FastifyReply
> {
  constructor() {
    super(Fastify());
  }

  get(path: string, handler: any) {
    this.instance.get(path, async (req, res) => {
      await handler(req, res, () => {});
    });
  }

  post(path: string, handler: any) {
    this.instance.post(path, async (req, res) => {
      await handler(req, res, () => {});
    });
  }

  // … implement all abstract methods …

  reply(res: FastifyReply, body: unknown, statusCode?: number) {
    if (statusCode) res.status(statusCode);
    res.send(body);
  }

  listen(port: number, host: string, callback?: () => void) {
    this.instance.listen({ port, host }, callback);
  }

  async close(): Promise<void> {
    await this.instance.close();
  }

  // … getRequestUrl, getRequestBody, getRequestParam, etc.
}
```

Use it:

```typescript
const app = await LoonyFactory.create(AppModule, new FastifyAdapter());
await app.listen(3000);
```

---

## `AbstractHttpAdapter` Contract

```typescript
abstract class AbstractHttpAdapter<TServer, TRequest, TResponse> {
  // Route registration
  abstract get(path: string, handler: RequestHandler): void;
  abstract post(path: string, handler: RequestHandler): void;
  abstract put(path: string, handler: RequestHandler): void;
  abstract patch(path: string, handler: RequestHandler): void;
  abstract delete(path: string, handler: RequestHandler): void;
  abstract head(path: string, handler: RequestHandler): void;
  abstract options(path: string, handler: RequestHandler): void;
  abstract all(path: string, handler: RequestHandler): void;

  // Middleware
  abstract use(...handlers: any[]): void;
  abstract useByPath(path: string, ...handlers: any[]): void;

  // Server lifecycle
  abstract listen(port: number, host: string, callback?: () => void): void;
  abstract close(): Promise<void>;

  // Response manipulation
  abstract setHeader(response: TResponse, name: string, value: string): void;
  abstract status(response: TResponse, statusCode: number): TResponse;
  abstract reply(response: TResponse, body: unknown, statusCode?: number): void;
  abstract redirect(response: TResponse, url: string, statusCode: number): void;

  // Request reading
  abstract getRequestUrl(request: TRequest): string;
  abstract getRequestMethod(request: TRequest): string;
  abstract getRequestBody(request: TRequest): any;
  abstract getRequestParam(request: TRequest, key: string): string | undefined;
  abstract getRequestQuery(request: TRequest, key?: string): any;
  abstract getRequestHeader(request: TRequest, key: string): string | undefined;
  abstract getRequestIp(request: TRequest): string;

  // Access the underlying server
  getInstance(): TServer;
}
```

---

## Adding Global Middleware

Global middleware (not tied to a route) is applied directly through the adapter:

```typescript
import helmet from 'helmet';
import compression from 'compression';

const app = await LoonyFactory.create(AppModule);
app.useGlobalMiddleware(helmet(), compression());
```

Or access the raw adapter for Express-specific plugins:

```typescript
const express = app.getHttpAdapter().getInstance();
express.set('trust proxy', 1);
express.use(cookieParser());
```

---

## HTTPS

Wrap the adapter in an HTTPS server:

```typescript
import * as https from 'https';
import * as fs from 'fs';
import express from 'express';
import { ExpressAdapter } from '@loonyjs/core';

const expressApp = express();
const adapter = new ExpressAdapter(expressApp);

const app = await LoonyFactory.create(AppModule, adapter);
await app.init();

const credentials = {
  key:  fs.readFileSync('private.key'),
  cert: fs.readFileSync('certificate.crt'),
};

https.createServer(credentials, expressApp).listen(443, () => {
  console.log('HTTPS server listening on port 443');
});
```
