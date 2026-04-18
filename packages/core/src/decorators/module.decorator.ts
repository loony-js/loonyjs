import 'reflect-metadata';
import { METADATA_KEYS } from '../metadata/metadata-keys';
import { Type, Provider } from '../di/types';

export interface ModuleMetadata {
  /** Other modules whose exported providers should be available here. */
  imports?: (Type | DynamicModule)[];
  /** Providers registered in this module's DI scope. */
  providers?: Provider[];
  /** Controllers handled by this module. */
  controllers?: Type[];
  /**
   * Subset of providers to make available to importing modules.
   * Can be a provider token or a whole module (re-export).
   */
  exports?: (Type | string | symbol)[];
}

export interface DynamicModule extends ModuleMetadata {
  module: Type;
  global?: boolean;
}

/**
 * Declares a class as a LoonyJS module.
 *
 * Design decision: metadata is stored on the class so modules are lazy —
 * we only process them when the module graph is compiled.
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(METADATA_KEYS.MODULE, metadata, target);
  };
}

/**
 * Makes all providers of this module globally available without
 * explicit import — mirrors NestJS @Global() behaviour.
 */
export function Global(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(METADATA_KEYS.GLOBAL_MODULE, true, target);
  };
}

export function isDynamicModule(value: any): value is DynamicModule {
  return value != null && typeof value === 'object' && 'module' in value;
}
