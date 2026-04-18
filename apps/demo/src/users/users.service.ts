import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@loonyjs/core';
import { CreateUserDto, UserRole } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Logger } from '@loonyjs/core';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly log = new Logger('UsersService');
  private users: User[] = [];
  private nextId = 1;

  onModuleInit(): void {
    // Seed some demo data
    this.users = [
      {
        id: '1',
        name: 'Alice Admin',
        email: 'alice@example.com',
        role: UserRole.ADMIN,
        createdAt: new Date(),
      },
      {
        id: '2',
        name: 'Bob User',
        email: 'bob@example.com',
        role: UserRole.USER,
        createdAt: new Date(),
      },
    ];
    this.nextId = 3;
    this.log.log(`Seeded ${this.users.length} demo users.`);
  }

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  create(dto: CreateUserDto): User {
    if (this.findByEmail(dto.email)) {
      throw new ConflictException(`Email ${dto.email} is already taken`);
    }

    const user: User = {
      id: String(this.nextId++),
      name: dto.name,
      email: dto.email,
      role: dto.role ?? UserRole.USER,
      createdAt: new Date(),
    };

    this.users.push(user);
    this.log.log(`Created user: ${user.email}`);
    return user;
  }

  update(id: string, dto: UpdateUserDto): User {
    const user = this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const existing = this.findByEmail(dto.email);
      if (existing) throw new ConflictException(`Email ${dto.email} is already taken`);
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;

    return user;
  }

  remove(id: string): void {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new NotFoundException(`User #${id} not found`);
    this.users.splice(idx, 1);
  }

  count(): number {
    return this.users.length;
  }
}
