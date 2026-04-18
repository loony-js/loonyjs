import {
  ExceptionFilter,
  Catch,
  ExecutionContext,
  HttpException,
  Logger,
} from '@loonyjs/core';

/**
 * Global HTTP exception filter.
 * Formats HttpException responses consistently across the application.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  private readonly log = new Logger('ExceptionFilter');

  catch(exception: HttpException, context: ExecutionContext): void {
    const res = context.switchToHttp().getResponse();
    const req = context.switchToHttp().getRequest();
    const status = exception.getStatus();

    this.log.warn(`${req.method} ${req.url} → ${status}: ${exception.message}`);

    if (!res.headersSent) {
      res.status(status).json({
        ...exception.toJSON(),
        path: req.url,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
