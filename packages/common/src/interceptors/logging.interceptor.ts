import {
  LoonyInterceptor,
  ExecutionContext,
  CallHandler,
  Observable,
  Logger,
  Injectable,
} from '@loonyjs/core';

/**
 * Logs the method, path, and response time of every request.
 * Register globally: app.useGlobalInterceptors(new LoggingInterceptor());
 */
@Injectable()
export class LoggingInterceptor implements LoonyInterceptor {
  private readonly log = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().tap((data) => {
      const ms = Date.now() - start;
      this.log.log(`${method} ${url} → ${ms}ms`);
    });
  }
}
