import 'reflect-metadata';
import { METADATA_KEYS } from '../metadata/metadata-keys';
import { Container } from '../di/container';
import { Type, Provider, isTypeProvider } from '../di/types';
import { ModuleMetadata, DynamicModule, isDynamicModule } from '../decorators/module.decorator';
import { ModuleRef } from './module-ref';
import { Logger } from '../logger/logger';

const log = new Logger('ModuleCompiler');

/**
 * Compiles the module graph into a set of ModuleRef objects.
 *
 * Algorithm:
 *  1. Topological-sort the import graph (depth-first, error on cycles).
 *  2. For each module (leaves first):
 *     a. Create a child Container with the global container as ancestor.
 *     b. Register the module's own providers.
 *     c. Make exported providers available to importers via the global container
 *        (for @Global modules) or via the importer's container (for normal exports).
 *  3. Register controllers so the router can discover them later.
 */
export class ModuleCompiler {
  private readonly compiled = new Map<Type, ModuleRef>();
  private readonly globalContainer: Container;

  constructor(globalContainer: Container) {
    this.globalContainer = globalContainer;
  }

  async compile(rootModule: Type | DynamicModule): Promise<Map<Type, ModuleRef>> {
    await this.processModule(rootModule, []);
    return this.compiled;
  }

  // ------------------------------------------------------------------
  // Recursive compilation
  // ------------------------------------------------------------------

  private async processModule(
    moduleOrDynamic: Type | DynamicModule,
    ancestors: Type[],
  ): Promise<ModuleRef> {
    const { metatype, metadata } = this.resolve(moduleOrDynamic);

    if (this.compiled.has(metatype)) {
      return this.compiled.get(metatype)!;
    }

    // Cycle detection
    if (ancestors.includes(metatype)) {
      const chain = [...ancestors, metatype].map((m) => m.name).join(' → ');
      throw new Error(`Circular module dependency detected: ${chain}`);
    }

    log.verbose(`Compiling module: ${metatype.name}`);

    const moduleRef = new ModuleRef(metatype, this.globalContainer, metadata);
    // Store early to handle any future references before full compilation
    this.compiled.set(metatype, moduleRef);

    // Process imported modules first (so their exports are ready)
    for (const imp of metadata.imports ?? []) {
      const importedRef = await this.processModule(imp, [...ancestors, metatype]);
      // Wire exported providers from the imported module into this module's container
      this.wireExports(importedRef, moduleRef);
    }

    // Register this module's own providers
    for (const provider of metadata.providers ?? []) {
      moduleRef.container.register(provider);
    }

    // If global, register exported providers in the global container
    if (moduleRef.isGlobal) {
      this.publishToGlobal(moduleRef);
    }

    return moduleRef;
  }

  // ------------------------------------------------------------------
  // Export wiring
  // ------------------------------------------------------------------

  private wireExports(source: ModuleRef, target: ModuleRef): void {
    for (const exportToken of source.metadata.exports ?? []) {
      // Re-export a whole imported module
      if (typeof exportToken === 'function' && this.compiled.has(exportToken as Type)) {
        const reExported = this.compiled.get(exportToken as Type)!;
        this.wireExports(reExported, target);
        continue;
      }

      // Export a provider by token
      const record = this.findProviderRecord(source, exportToken);
      if (record) {
        target.container.register(record);
      } else {
        log.warn(
          `Module "${source.metatype.name}" exports token "${String(exportToken)}" but it is not registered as a provider.`,
        );
      }
    }
  }

  private publishToGlobal(moduleRef: ModuleRef): void {
    for (const exportToken of moduleRef.metadata.exports ?? []) {
      const record = this.findProviderRecord(moduleRef, exportToken);
      if (record) this.globalContainer.register(record);
    }
  }

  private findProviderRecord(moduleRef: ModuleRef, token: any): Provider | undefined {
    for (const provider of moduleRef.metadata.providers ?? []) {
      const providerToken = isTypeProvider(provider) ? provider : (provider as any).provide;
      if (providerToken === token) return provider;
    }
    return undefined;
  }

  // ------------------------------------------------------------------
  // Normalise Type | DynamicModule
  // ------------------------------------------------------------------

  private resolve(moduleOrDynamic: Type | DynamicModule): { metatype: Type; metadata: ModuleMetadata } {
    if (isDynamicModule(moduleOrDynamic)) {
      const { module, ...rest } = moduleOrDynamic;
      return { metatype: module, metadata: rest };
    }

    const metadata: ModuleMetadata =
      Reflect.getMetadata(METADATA_KEYS.MODULE, moduleOrDynamic) ?? {};
    return { metatype: moduleOrDynamic, metadata };
  }
}
