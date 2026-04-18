import { Type } from '@loonyjs/core';

export const DATA_SOURCE = 'LOONY_DATA_SOURCE';

export function getRepositoryToken(entity: Type): string {
  return `LOONY_REPOSITORY_${entity.name}`;
}
