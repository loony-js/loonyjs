import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from '@loonyjs/typeorm';
import { AppUser } from './app-user.entity';

@Entity('contact')
@Index('idx_contact_owner', ['owner_user_id'])
@Index('idx_contact_contact', ['contact_user_id'])
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'owner_user_id' })
  owner_user_id: number;

  @Column({ name: 'contact_user_id' })
  contact_user_id: number;

  @Column({ type: 'text', nullable: true })
  alias_name: string;

  @ManyToOne(() => AppUser, (user) => user.contacts_owned, { onDelete: 'CASCADE' })
  owner_user: AppUser;

  @ManyToOne(() => AppUser, (user) => user.contacts_as_contact, { onDelete: 'CASCADE' })
  contact_user: AppUser;
}
