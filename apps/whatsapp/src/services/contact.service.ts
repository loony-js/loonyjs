import { Injectable, NotFoundException } from '@loonyjs/core';
import { InjectRepository } from '@loonyjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../entities/contact.entity';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}

  async addContact(ownerUserId: number, contactUserId: number, alias?: string): Promise<Contact> {
    const contact = this.contactRepository.create({
      owner_user_id: ownerUserId,
      contact_user_id: contactUserId,
      alias_name: alias,
    });
    return this.contactRepository.save(contact);
  }

  async getContactsOfUser(userId: number): Promise<Contact[]> {
    return this.contactRepository.find({
      where: { owner_user_id: userId },
      relations: ['contact_user'],
    });
  }

  async removeContact(ownerUserId: number, contactUserId: number): Promise<void> {
    const result = await this.contactRepository.delete({
      owner_user_id: ownerUserId,
      contact_user_id: contactUserId,
    });
    if (result.affected === 0) throw new NotFoundException('Contact not found');
  }
}
