import {
  LoonyInterceptor,
  ExecutionContext,
  CallHandler,
  Observable,
  Injectable,
} from '@loonyjs/core';

export interface WrappedResponse<T> {
  data: T;
  timestamp: string;
}

/**
 * Wraps all responses in a consistent envelope: { data, timestamp }.
 *
 * @example
 *   app.useGlobalInterceptors(new TransformInterceptor());
 *   // GET /users → { data: [...], timestamp: "2024-01-01T..." }
 */
@Injectable()
export class TransformInterceptor<T> implements LoonyInterceptor<T, WrappedResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<WrappedResponse<T>> {
    return next.handle().map((data) => ({
      data,
      timestamp: new Date().toISOString(),
    }));
  }
}
