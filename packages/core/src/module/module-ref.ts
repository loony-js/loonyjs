import { Container } from '../di/container';
import { Token } from '../di/types';
import { ModuleMetadata, DynamicModule } from '../decorators/module.decorator';
import { METADATA_KEYS } from '../metadata/metadata-keys';
import { Type } from '../di/types';

/**
 * Runtime representation of a compiled module.
 *
 * Each ModuleRef owns a Container that holds its locally-registered providers.
 * Exports are re-registered into the parent (importer) container so that
 * the importing module can resolve them.
 */
export class ModuleRef {
  readonly container: Container;
  readonly metadata: ModuleMetadata;
  readonly isGlobal: boolean;

  constructor(
    readonly metatype: Type,
    parentContainer: Container,
    metadata: ModuleMetadata,
  ) {
    this.metadata = metadata;
    this.isGlobal = Reflect.getMetadata(METADATA_KEYS.GLOBAL_MODULE, metatype) ?? false;
    // Child container delegates to parent for exported providers
    this.container = new Container(parentContainer);
  }

  /** Resolve a token from this module's DI scope. */
  get<T>(token: Token<T>): T {
    return this.container.resolve<T>(token);
  }

  async getAsync<T>(token: Token<T>): Promise<T> {
    return this.container.resolveAsync<T>(token);
  }
}
