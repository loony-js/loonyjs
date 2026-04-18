import 'reflect-metadata';
import { METADATA_KEYS } from '../metadata/metadata-keys';
import {
  Token,
  Type,
  Scope,
  Provider,
  ClassProvider,
  ValueProvider,
  FactoryProvider,
  ExistingProvider,
  isClassProvider,
  isValueProvider,
  isFactoryProvider,
  isExistingProvider,
  isTypeProvider,
} from './types';

// ------------------------------------------------------------------
// Internal record stored per token
// ------------------------------------------------------------------

interface ProviderRecord<T = any> {
  token: Token<T>;
  scope: Scope;
  // exactly one of these will be set
  useClass?: Type<T>;
  useValue?: T;
  useFactory?: (...deps: any[]) => T | Promise<T>;
  factoryDeps?: Token[];
  useExisting?: Token<T>;
  // cached singleton instance
  instance?: T;
}

// ------------------------------------------------------------------
// Container
// ------------------------------------------------------------------

/**
 * The LoonyJS DI container.
 *
 * Design decisions vs NestJS:
 *  - Flat Map per container instance (no layered prototype chain).
 *  - Parent-child delegation: child checks parent when local lookup fails.
 *  - Circular dependency detection via a resolution stack (no forward-ref hacks needed for most cases).
 *  - Async factory support out of the box.
 */
export class Container {
  private readonly records = new Map<Token, ProviderRecord>();
  private readonly parent: Container | null;

  constructor(parent: Container | null = null) {
    this.parent = parent;
    // Make the container injectable as itself
    this.records.set(Container, {
      token: Container,
      scope: Scope.SINGLETON,
      instance: this,
    });
  }

  // ------------------------------------------------------------------
  // Registration
  // ------------------------------------------------------------------

  register<T>(provider: Provider<T>): void {
    const record = this.normalise(provider);
    this.records.set(record.token, record);
  }

  registerAll(providers: Provider[]): void {
    for (const p of providers) this.register(p);
  }

  /** Replace or add a provider (used for testing overrides). */
  override<T>(token: Token<T>, value: T): void {
    this.records.set(token, { token, scope: Scope.SINGLETON, useValue: value, instance: value });
  }

  // ------------------------------------------------------------------
  // Resolution
  // ------------------------------------------------------------------

  has(token: Token): boolean {
    return this.records.has(token) || (this.parent?.has(token) ?? false);
  }

  /**
   * Resolve a token synchronously.
   * Throws if the token needs an async factory — use resolveAsync then.
   */
  resolve<T>(token: Token<T>, resolutionStack: Token[] = []): T {
    const record = this.findRecord<T>(token);
    if (!record) {
      throw new Error(`No provider found for token: ${tokenName(token)}`);
    }

    if (record.scope === Scope.SINGLETON && record.instance !== undefined) {
      return record.instance as T;
    }

    this.detectCircular(token, resolutionStack);
    const stack = [...resolutionStack, token];

    const instance = this.instantiateSync<T>(record, stack);

    if (record.scope === Scope.SINGLETON) {
      record.instance = instance;
    }
    return instance;
  }

  async resolveAsync<T>(token: Token<T>, resolutionStack: Token[] = []): Promise<T> {
    const record = this.findRecord<T>(token);
    if (!record) {
      throw new Error(`No provider found for token: ${tokenName(token)}`);
    }

    if (record.scope === Scope.SINGLETON && record.instance !== undefined) {
      return record.instance as T;
    }

    this.detectCircular(token, resolutionStack);
    const stack = [...resolutionStack, token];

    const instance = await this.instantiateAsync<T>(record, stack);

    if (record.scope === Scope.SINGLETON) {
      record.instance = instance;
    }
    return instance;
  }

  /** Resolve all registered instances (used during module bootstrap). */
  async bootstrapAll(): Promise<void> {
    for (const [token] of this.records) {
      await this.resolveAsync(token);
    }
  }

  // ------------------------------------------------------------------
  // Internal helpers
  // ------------------------------------------------------------------

  private findRecord<T>(token: Token<T>): ProviderRecord<T> | undefined {
    return (this.records.get(token) as ProviderRecord<T> | undefined)
      ?? this.parent?.findRecord<T>(token);
  }

  private detectCircular(token: Token, stack: Token[]): void {
    if (stack.includes(token)) {
      const chain = [...stack, token].map(tokenName).join(' → ');
      throw new Error(`Circular dependency detected: ${chain}`);
    }
  }

  private normalise<T>(provider: Provider<T>): ProviderRecord<T> {
    if (isTypeProvider(provider)) {
      return {
        token: provider,
        scope: this.scopeOf(provider),
        useClass: provider,
      };
    }
    if (isClassProvider(provider)) {
      return {
        token: provider.provide,
        scope: provider.scope ?? this.scopeOf(provider.useClass),
        useClass: provider.useClass,
      };
    }
    if (isValueProvider(provider)) {
      return {
        token: provider.provide,
        scope: Scope.SINGLETON,
        useValue: provider.useValue,
        instance: provider.useValue,
      };
    }
    if (isFactoryProvider(provider)) {
      return {
        token: provider.provide,
        scope: provider.scope ?? Scope.SINGLETON,
        useFactory: provider.useFactory,
        factoryDeps: provider.inject ?? [],
      };
    }
    if (isExistingProvider(provider)) {
      return {
        token: provider.provide,
        scope: Scope.SINGLETON,
        useExisting: provider.useExisting,
      };
    }
    throw new Error(`Unknown provider shape: ${JSON.stringify(provider)}`);
  }

  private scopeOf(cls: Type): Scope {
    return Reflect.getMetadata(METADATA_KEYS.SCOPE, cls) ?? Scope.SINGLETON;
  }

  private instantiateSync<T>(record: ProviderRecord<T>, stack: Token[]): T {
    if (record.useValue !== undefined) return record.useValue as T;

    if (record.useExisting) {
      return this.resolve(record.useExisting, stack) as T;
    }

    if (record.useFactory) {
      const result = record.useFactory(...this.resolveDepsSync(record.factoryDeps ?? [], stack));
      if (result instanceof Promise) {
        throw new Error(
          `Provider "${tokenName(record.token)}" uses an async factory — call resolveAsync() instead.`,
        );
      }
      return result as T;
    }

    if (record.useClass) {
      const deps = this.getConstructorDeps(record.useClass, stack);
      return new record.useClass(...deps) as T;
    }

    throw new Error(`Cannot instantiate provider for token: ${tokenName(record.token)}`);
  }

  private async instantiateAsync<T>(record: ProviderRecord<T>, stack: Token[]): Promise<T> {
    if (record.useValue !== undefined) return record.useValue as T;

    if (record.useExisting) {
      return this.resolveAsync(record.useExisting, stack) as Promise<T>;
    }

    if (record.useFactory) {
      const deps = await this.resolveDepsAsync(record.factoryDeps ?? [], stack);
      return record.useFactory(...deps) as Promise<T>;
    }

    if (record.useClass) {
      const deps = await this.getConstructorDepsAsync(record.useClass, stack);
      return new record.useClass(...deps) as T;
    }

    throw new Error(`Cannot instantiate provider for token: ${tokenName(record.token)}`);
  }

  private getConstructorDeps(cls: Type, stack: Token[]): any[] {
    const paramTypes: Type[] = Reflect.getMetadata(METADATA_KEYS.DESIGN_PARAMTYPES, cls) ?? [];
    const injectTokens: (Token | undefined)[] =
      Reflect.getMetadata(METADATA_KEYS.INJECT_TOKENS, cls) ?? [];

    return paramTypes.map((paramType, idx) => {
      const token: Token = injectTokens[idx] ?? paramType;
      return this.resolve(token, stack);
    });
  }

  private async getConstructorDepsAsync(cls: Type, stack: Token[]): Promise<any[]> {
    const paramTypes: Type[] = Reflect.getMetadata(METADATA_KEYS.DESIGN_PARAMTYPES, cls) ?? [];
    const injectTokens: (Token | undefined)[] =
      Reflect.getMetadata(METADATA_KEYS.INJECT_TOKENS, cls) ?? [];

    return Promise.all(
      paramTypes.map((paramType, idx) => {
        const token: Token = injectTokens[idx] ?? paramType;
        return this.resolveAsync(token, stack);
      }),
    );
  }

  private resolveDepsSync(tokens: Token[], stack: Token[]): any[] {
    return tokens.map((t) => this.resolve(t, stack));
  }

  private async resolveDepsAsync(tokens: Token[], stack: Token[]): Promise<any[]> {
    return Promise.all(tokens.map((t) => this.resolveAsync(t, stack)));
  }
}

// ------------------------------------------------------------------
// Utility
// ------------------------------------------------------------------

export function tokenName(token: Token): string {
  if (typeof token === 'function') return token.name;
  if (typeof token === 'string') return token;
  if (typeof token === 'symbol') return token.toString();
  return String(token);
}
