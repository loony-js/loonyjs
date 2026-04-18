# Observable

LoonyJS ships a custom `Observable<T>` implementation specifically for the interceptor pipeline. It is intentionally minimal — just enough to make interceptors composable without pulling in RxJS.

---

## Why a Custom Observable?

NestJS requires RxJS as a peer dependency. RxJS adds ~250 KB to your bundle and has a steep learning curve. The interceptor use case only needs four operators: `map`, `tap`, `catchError`, and `toPromise`. LoonyJS implements exactly those.

If you need the full RxJS operator set in an interceptor, you can still use it — just convert:

```typescript
import { from } from 'rxjs';

intercept(ctx, next) {
  return from(next.handle().toPromise()).pipe(/* RxJS operators */);
}
```

---

## Creating Observables

```typescript
import { Observable } from '@loonyjs/core';

// Emit a single value and complete
const obs = Observable.of(42);

// Wrap a Promise
const obs = Observable.from(fetchUser(id));

// Emit an error
const obs = Observable.throwError(() => new Error('Something broke'));
```

---

## Operators

### `.map<R>(fn)`

Transform each emitted value:

```typescript
next.handle().map(data => ({ data, timestamp: new Date().toISOString() }));
```

### `.tap(fn)`

Side-effect without changing the value:

```typescript
next.handle().tap(data => logger.log(`Response: ${JSON.stringify(data)}`));
```

### `.catchError(fn)`

Handle errors, optionally recovering with a new Observable:

```typescript
next.handle().catchError(err => {
  logger.error('Handler threw', err.stack);
  return Observable.throwError(() => err);  // re-throw
});

// Or recover with a fallback value:
next.handle().catchError(() => Observable.of({ fallback: true }));
```

### `.toPromise()`

Convert to a `Promise<T | undefined>` — resolves with the last emitted value:

```typescript
const result = await next.handle().toPromise();
```

---

## Using in Interceptors

```typescript
import { LoonyInterceptor, ExecutionContext, CallHandler, Observable, Injectable } from '@loonyjs/core';

@Injectable()
export class WrapInterceptor implements LoonyInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .map(data => ({ ok: true, data }))
      .tap(() => console.log('Response sent'))
      .catchError(err => {
        console.error('Error in handler:', err.message);
        return Observable.throwError(() => err);
      });
  }
}
```

---

## Observable API

```typescript
// Static constructors
Observable.of<T>(value: T): Observable<T>
Observable.from<T>(promise: Promise<T>): Observable<T>
Observable.throwError<T>(errorFactory: () => any): Observable<T>

// Instance methods
obs.map<R>(fn: (value: T) => R): Observable<R>
obs.tap(fn: (value: T) => void): Observable<T>
obs.catchError(fn: (err: any) => Observable<T>): Observable<T>
obs.toPromise(): Promise<T | undefined>
obs.subscribe(observer?: Partial<Observer<T>>): Subscription
```

---

## Observer Interface

```typescript
interface Observer<T> {
  next(value: T): void;
  error(err: any): void;
  complete(): void;
}

interface Subscription {
  unsubscribe(): void;
}
```

---

## Composing Interceptors

Multiple interceptors compose correctly because each wraps the next:

```typescript
// Registration order: [LoggingInterceptor, TimingInterceptor, CacheInterceptor]
// Execution:
//   LoggingInterceptor.intercept → calls next (TimingInterceptor)
//     TimingInterceptor.intercept → calls next (CacheInterceptor)
//       CacheInterceptor.intercept → calls next (actual handler)
//       ← CacheInterceptor resolves
//     ← TimingInterceptor resolves
//   ← LoggingInterceptor resolves
```

This is the same onion model used by Express middleware and Koa, but expressed through the Observable abstraction — making pre- and post-processing cleanly separable in a single `intercept()` method.

---

## Limitations vs RxJS

If you need these, use RxJS directly in your interceptors:

- `switchMap`, `mergeMap`, `concatMap`, `exhaustMap`
- `debounceTime`, `throttleTime`, `delay`
- `combineLatest`, `zip`, `race`, `forkJoin`
- Hot observables / subjects
- `retry`, `retryWhen`
- `shareReplay`

Converting is straightforward since both share the same mental model.
