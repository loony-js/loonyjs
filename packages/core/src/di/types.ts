/** Anything that can be used as a class constructor. */
export type Type<T = any> = new (...args: any[]) => T;

/** Abstract class constructor (for abstract providers). */
export type AbstractType<T = any> = abstract new (...args: any[]) => T;

/**
 * An injection token can be:
 *  - a class constructor  (most common)
 *  - an InjectionToken<T> (string/Symbol wrapper for non-class values)
 *  - a plain string or symbol (escape hatch)
 */
export type Token<T = any> = Type<T> | InjectionToken<T> | string | symbol;

/** Wraps a non-class token so it is type-safe. */
export class InjectionToken<T = unknown> {
  readonly description: string;
  constructor(description: string) {
    this.description = description;
  }
  toString(): string {
    return `InjectionToken(${this.description})`;
  }
}

/** Provider lifetime scopes. */
export enum Scope {
  /** One instance for the whole application (default). */
  SINGLETON = 'SINGLETON',
  /** A fresh instance per injection site. */
  TRANSIENT = 'TRANSIENT',
  /** One instance per HTTP request (requires request context). */
  REQUEST = 'REQUEST',
}

// ------------------------------------------------------------------
// Provider shapes
// ------------------------------------------------------------------

export interface ClassProvider<T = any> {
  provide: Token<T>;
  useClass: Type<T>;
  scope?: Scope;
}

export interface ValueProvider<T = any> {
  provide: Token<T>;
  useValue: T;
}

export interface FactoryProvider<T = any> {
  provide: Token<T>;
  useFactory: (...deps: any[]) => T | Promise<T>;
  inject?: Token[];
  scope?: Scope;
}

export interface ExistingProvider<T = any> {
  provide: Token<T>;
  useExisting: Token<T>;
}

export type Provider<T = any> =
  | Type<T>
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>;

// ------------------------------------------------------------------
// Type guards
// ------------------------------------------------------------------

export function isClassProvider<T>(p: Provider<T>): p is ClassProvider<T> {
  return typeof p === 'object' && 'useClass' in p;
}

export function isValueProvider<T>(p: Provider<T>): p is ValueProvider<T> {
  return typeof p === 'object' && 'useValue' in p;
}

export function isFactoryProvider<T>(p: Provider<T>): p is FactoryProvider<T> {
  return typeof p === 'object' && 'useFactory' in p;
}

export function isExistingProvider<T>(p: Provider<T>): p is ExistingProvider<T> {
  return typeof p === 'object' && 'useExisting' in p;
}

export function isTypeProvider<T>(p: Provider<T>): p is Type<T> {
  return typeof p === 'function';
}
