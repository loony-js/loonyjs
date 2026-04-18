import express, { Application, Request, Response, NextFunction } from 'express';
import * as http from 'http';
import { AbstractHttpAdapter } from './http-adapter.interface';

/**
 * Express HTTP adapter.
 *
 * Wraps Express so the core framework has zero direct coupling to it.
 * To add Fastify support, implement AbstractHttpAdapter<FastifyInstance, ...>.
 */
export class ExpressAdapter extends AbstractHttpAdapter<Application, Request, Response> {
  private server: http.Server | undefined;

  constructor(instance?: Application) {
    super(instance ?? express());
    // Parse JSON and URL-encoded bodies by default
    this.instance.use(express.json());
    this.instance.use(express.urlencoded({ extended: true }));
  }

  get(path: string, handler: any): void {
    this.instance.get(path, handler);
  }
  post(path: string, handler: any): void {
    this.instance.post(path, handler);
  }
  put(path: string, handler: any): void {
    this.instance.put(path, handler);
  }
  patch(path: string, handler: any): void {
    this.instance.patch(path, handler);
  }
  delete(path: string, handler: any): void {
    this.instance.delete(path, handler);
  }
  head(path: string, handler: any): void {
    this.instance.head(path, handler);
  }
  options(path: string, handler: any): void {
    this.instance.options(path, handler);
  }
  all(path: string, handler: any): void {
    this.instance.all(path, handler);
  }

  use(...handlers: any[]): void {
    this.instance.use(...handlers);
  }
  useByPath(path: string, ...handlers: any[]): void {
    this.instance.use(path, ...handlers);
  }

  listen(port: number, host: string, callback?: () => void): void {
    this.server = http.createServer(this.instance);
    this.server.listen(port, host, callback);
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) return resolve();
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  setHeader(res: Response, name: string, value: string): void {
    res.setHeader(name, value);
  }

  status(res: Response, statusCode: number): Response {
    return res.status(statusCode) as unknown as Response;
  }

  reply(res: Response, body: unknown, statusCode?: number): void {
    if (statusCode) res.status(statusCode);
    if (body === undefined || body === null) {
      res.send();
      return;
    }
    if (typeof body === 'string') {
      res.send(body);
    } else {
      res.json(body);
    }
  }

  redirect(res: Response, url: string, statusCode: number): void {
    res.redirect(statusCode, url);
  }

  getRequestUrl(req: Request): string {
    return req.url;
  }
  getRequestMethod(req: Request): string {
    return req.method;
  }
  getRequestBody(req: Request): any {
    return req.body;
  }
  getRequestParam(req: Request, key: string): string | undefined {
    return req.params[key];
  }
  getRequestQuery(req: Request, key?: string): any {
    if (key) return req.query[key];
    return req.query;
  }
  getRequestHeader(req: Request, key: string): string | undefined {
    return req.headers[key.toLowerCase()] as string | undefined;
  }
  getRequestIp(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.socket.remoteAddress
      ?? '';
  }
}
