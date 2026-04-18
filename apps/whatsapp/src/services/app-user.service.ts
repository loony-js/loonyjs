import { Injectable, NotFoundException } from '@loonyjs/core';
import { InjectRepository } from '@loonyjs/typeorm';
import { Repository } from 'typeorm';
import { AppUser } from '../entities/app-user.entity';

@Injectable()
export class AppUserService {
  constructor(
    @InjectRepository(AppUser)
    private userRepository: Repository<AppUser>,
  ) {}

  async create(data: Partial<AppUser>): Promise<AppUser> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<AppUser[]> {
    return this.userRepository.find();
  }

  async findById(id: number): Promise<AppUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByPhone(phone: string): Promise<AppUser | null> {
    return this.userRepository.findOne({ where: { phone_number: phone } });
  }

  async update(id: number, data: Partial<AppUser>): Promise<AppUser> {
    await this.userRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`User ${id} not found`);
  }
}
