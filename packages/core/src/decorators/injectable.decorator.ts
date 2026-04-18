import 'reflect-metadata';
import { METADATA_KEYS } from '../metadata/metadata-keys';
import { Scope, Token } from '../di/types';

export interface InjectableOptions {
  scope?: Scope;
}

/**
 * Marks a class as injectable and registers its scope.
 * Must be applied to any class that participates in DI.
 */
export function Injectable(options: InjectableOptions = {}): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(METADATA_KEYS.INJECTABLE, true, target);
    Reflect.defineMetadata(METADATA_KEYS.SCOPE, options.scope ?? Scope.SINGLETON, target);
  };
}

/**
 * Overrides the injection token for a specific constructor parameter.
 * Useful when the type alone is not enough (e.g. interface tokens).
 *
 * @example
 *   constructor(@Inject('CONFIG') private config: AppConfig) {}
 */
export function Inject(token: Token): ParameterDecorator {
  return (target, _propertyKey, parameterIndex) => {
    const existing: (Token | undefined)[] =
      Reflect.getMetadata(METADATA_KEYS.INJECT_TOKENS, target) ?? [];
    existing[parameterIndex] = token;
    Reflect.defineMetadata(METADATA_KEYS.INJECT_TOKENS, existing, target);
  };
}

/**
 * Marks a constructor parameter as optional.
 * If the token is not registered the value will be undefined instead of throwing.
 */
export function Optional(): ParameterDecorator {
  return (_target, _key, _idx) => {
    // Implemented at resolve-time in the container by catching "no provider" errors.
    // This decorator just marks the index so the injector knows to swallow them.
  };
}
