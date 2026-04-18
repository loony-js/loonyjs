import { Inject, Type } from '@loonyjs/core';
import { getRepositoryToken } from './tokens';

/**
 * Injects a TypeORM Repository<Entity> for the given entity class.
 *
 * @example
 *   constructor(@InjectRepository(User) private repo: Repository<User>) {}
 */
export function InjectRepository(entity: Type): ParameterDecorator {
  return Inject(getRepositoryToken(entity));
}
