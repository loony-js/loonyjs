/**
 * Abstract HTTP adapter interface.
 *
 * Design decision: the framework never touches Express/Fastify directly.
 * All HTTP operations go through this interface, making it trivially
 * swappable without touching any framework code.
 */
export abstract class AbstractHttpAdapter<TServer = any, TRequest = any, TResponse = any> {
  protected instance: TServer;

  constructor(instance: TServer) {
    this.instance = instance;
  }

  abstract get(path: string, handler: RequestHandler): void;
  abstract post(path: string, handler: RequestHandler): void;
  abstract put(path: string, handler: RequestHandler): void;
  abstract patch(path: string, handler: RequestHandler): void;
  abstract delete(path: string, handler: RequestHandler): void;
  abstract head(path: string, handler: RequestHandler): void;
  abstract options(path: string, handler: RequestHandler): void;
  abstract all(path: string, handler: RequestHandler): void;

  abstract use(...handlers: any[]): void;
  abstract useByPath(path: string, ...handlers: any[]): void;

  abstract listen(port: number, host: string, callback?: () => void): void;
  abstract close(): Promise<void>;

  abstract setHeader(response: TResponse, name: string, value: string): void;
  abstract status(response: TResponse, statusCode: number): TResponse;
  abstract reply(response: TResponse, body: unknown, statusCode?: number): void;
  abstract redirect(response: TResponse, url: string, statusCode: number): void;

  abstract getRequestUrl(request: TRequest): string;
  abstract getRequestMethod(request: TRequest): string;
  abstract getRequestBody(request: TRequest): any;
  abstract getRequestParam(request: TRequest, key: string): string | undefined;
  abstract getRequestQuery(request: TRequest, key?: string): any;
  abstract getRequestHeader(request: TRequest, key: string): string | undefined;
  abstract getRequestIp(request: TRequest): string;

  getInstance(): TServer {
    return this.instance;
  }
}

export type RequestHandler<TReq = any, TRes = any> = (
  req: TReq,
  res: TRes,
  next: (err?: any) => void,
) => void | Promise<void>;
