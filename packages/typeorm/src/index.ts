export { TypeOrmModule } from './typeorm.module';
export { InjectRepository } from './decorators';
export { DATA_SOURCE, getRepositoryToken } from './tokens';

// Re-export TypeORM essentials so consumers don't need a separate typeorm import
// for the most common types
export type { DataSource, Repository, DataSourceOptions } from 'typeorm';
export {
  Entity,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
  Unique,
} from 'typeorm';
