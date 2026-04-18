/**
 * A minimal Observable implementation for the interceptor pipeline.
 *
 * Design decision: avoid pulling in RxJS as a hard dependency.
 * Interceptors only need map/tap/catchError — we cover those here.
 * Advanced consumers can wrap this with RxJS via an adapter.
 */
export class Observable<T> {
  constructor(private readonly _subscribe: (observer: Observer<T>) => void) {}

  subscribe(observer: Partial<Observer<T>> = {}): Subscription {
    const noop = () => {};
    const safeObserver: Observer<T> = {
      next: observer.next ?? noop,
      error: observer.error ?? ((e) => { throw e; }),
      complete: observer.complete ?? noop,
    };

    let cancelled = false;
    const wrappedObserver: Observer<T> = {
      next: (v) => { if (!cancelled) safeObserver.next(v); },
      error: (e) => { if (!cancelled) safeObserver.error(e); },
      complete: () => { if (!cancelled) safeObserver.complete(); },
    };

    try {
      this._subscribe(wrappedObserver);
    } catch (e) {
      wrappedObserver.error(e);
    }
    return { unsubscribe: () => { cancelled = true; } };
  }

  /** Transform emitted values. */
  map<R>(fn: (value: T) => R): Observable<R> {
    return new Observable<R>((observer) => {
      this.subscribe({
        next: (v) => observer.next(fn(v)),
        error: (e) => observer.error(e),
        complete: () => observer.complete(),
      });
    });
  }

  /** Side-effect on each value without changing it. */
  tap(fn: (value: T) => void): Observable<T> {
    return this.map((v) => { fn(v); return v; });
  }

  /** Handle errors, optionally recovering with a new value. */
  catchError(fn: (err: any) => Observable<T>): Observable<T> {
    return new Observable<T>((observer) => {
      this.subscribe({
        next: (v) => observer.next(v),
        error: (e) => {
          try {
            fn(e).subscribe(observer);
          } catch (inner) {
            observer.error(inner);
          }
        },
        complete: () => observer.complete(),
      });
    });
  }

  /** Convert to Promise (takes the last emitted value). */
  toPromise(): Promise<T | undefined> {
    return new Promise<T | undefined>((resolve, reject) => {
      let last: T | undefined;
      this.subscribe({
        next: (v) => { last = v; },
        error: reject,
        complete: () => resolve(last),
      });
    });
  }

  // ------------------------------------------------------------------
  // Static constructors
  // ------------------------------------------------------------------

  static of<T>(value: T): Observable<T> {
    return new Observable<T>((observer) => {
      observer.next(value);
      observer.complete();
    });
  }

  static from<T>(promise: Promise<T>): Observable<T> {
    return new Observable<T>((observer) => {
      promise.then(
        (v) => { observer.next(v); observer.complete(); },
        (e) => observer.error(e),
      );
    });
  }

  static throwError<T>(errorFactory: () => any): Observable<T> {
    return new Observable<T>((observer) => observer.error(errorFactory()));
  }
}

export interface Observer<T> {
  next(value: T): void;
  error(err: any): void;
  complete(): void;
}

export interface Subscription {
  unsubscribe(): void;
}
