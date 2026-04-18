import { DynamicModule, Type } from '@loonyjs/core';
import { DataSource, DataSourceOptions, EntityTarget, ObjectLiteral } from 'typeorm';
import { DATA_SOURCE, getRepositoryToken } from './tokens';

/** Sentinel class used as the DynamicModule identity for TypeOrmModule.forRoot(). */
class _TypeOrmRootModule {}

/**
 * TypeORM integration module for LoonyJS.
 *
 * Usage:
 *   @Module({ imports: [TypeOrmModule.forRoot({ type: 'postgres', ... })] })
 *   class AppModule {}
 *
 *   @Module({ imports: [TypeOrmModule.forFeature([User, Post])] })
 *   class UserModule {}
 */
export class TypeOrmModule {
  /**
   * Registers the TypeORM DataSource as a global provider.
   * Call once in your root AppModule.
   */
  static forRoot(options: DataSourceOptions): DynamicModule {
    return {
      module: _TypeOrmRootModule as any,
      global: true,
      providers: [
        {
          provide: DATA_SOURCE,
          useFactory: async (): Promise<DataSource> => {
            const dataSource = new DataSource(options);
            return dataSource.initialize();
          },
          inject: [],
        },
      ],
      exports: [DATA_SOURCE],
    };
  }

  /**
   * Registers Repository providers for the given entities.
   * Each entity gets a provider keyed by getRepositoryToken(Entity).
   * Use @InjectRepository(Entity) to inject them.
   *
   * Creates a unique module class per call so multiple forFeature()
   * calls in different feature modules don't collide in the module registry.
   */
  static forFeature(entities: EntityTarget<ObjectLiteral>[]): DynamicModule {
    // Unique class per call to avoid module-registry key collisions
    const moduleClass = class DynamicTypeOrmFeatureModule {};
    const entityNames = (entities as Type[]).map((e) => e.name).join('_');
    Object.defineProperty(moduleClass, 'name', {
      value: `TypeOrmFeatureModule(${entityNames})`,
    });

    const providers = (entities as Type[]).map((entity) => ({
      provide: getRepositoryToken(entity),
      useFactory: (dataSource: DataSource) => dataSource.getRepository(entity as any),
      inject: [DATA_SOURCE],
    }));

    const exports = (entities as Type[]).map((entity) => getRepositoryToken(entity));

    return {
      module: moduleClass as any,
      providers,
      exports,
    };
  }
}
