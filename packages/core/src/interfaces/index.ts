import { Observable } from '../utils/observable';

// ------------------------------------------------------------------
// Execution context — passed to every pipeline element
// ------------------------------------------------------------------

export interface ExecutionContext {
  /** Returns the handler (method) being invoked. */
  getHandler(): Function;
  /** Returns the controller class. */
  getClass(): Function;
  /** Switch to HTTP context. */
  switchToHttp(): HttpArgumentsHost;
}

export interface HttpArgumentsHost {
  getRequest<T = any>(): T;
  getResponse<T = any>(): T;
  getNext<T = any>(): T;
}

// ------------------------------------------------------------------
// Guard
// ------------------------------------------------------------------

export interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

// ------------------------------------------------------------------
// Interceptor
// ------------------------------------------------------------------

export interface CallHandler<T = any> {
  handle(): Observable<T>;
}

export interface LoonyInterceptor<T = any, R = any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<R> | Promise<Observable<R>>;
}

// ------------------------------------------------------------------
// Pipe
// ------------------------------------------------------------------

export interface ArgumentMetadata {
  type: 'body' | 'query' | 'param' | 'custom';
  metatype?: Function;
  data?: string;
}

export interface PipeTransform<T = any, R = any> {
  transform(value: T, metadata: ArgumentMetadata): R | Promise<R>;
}

// ------------------------------------------------------------------
// Exception filter
// ------------------------------------------------------------------

export interface ExceptionFilter<T = any> {
  catch(exception: T, context: ExecutionContext): void | Promise<void>;
}

// ------------------------------------------------------------------
// Middleware
// ------------------------------------------------------------------

export interface LoonyMiddleware {
  use(req: any, res: any, next: () => void): void | Promise<void>;
}

// ------------------------------------------------------------------
// Lifecycle hooks
// ------------------------------------------------------------------

export interface OnModuleInit {
  onModuleInit(): void | Promise<void>;
}

export interface OnModuleDestroy {
  onModuleDestroy(): void | Promise<void>;
}

export interface OnApplicationBootstrap {
  onApplicationBootstrap(): void | Promise<void>;
}

export interface OnApplicationShutdown {
  onApplicationShutdown(signal?: string): void | Promise<void>;
}

// ------------------------------------------------------------------
// Reflector — reads SetMetadata values in guards/interceptors
// ------------------------------------------------------------------

export interface ReflectorService {
  get<T>(key: string | symbol, target: Function): T | undefined;
  getAll<T>(key: string | symbol, targets: Function[]): T[];
  getAllAndOverride<T>(key: string | symbol, targets: Function[]): T | undefined;
  getAllAndMerge<T extends any[]>(key: string | symbol, targets: Function[]): T;
}
