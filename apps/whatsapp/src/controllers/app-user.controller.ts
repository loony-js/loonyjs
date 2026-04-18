import { Controller, Get, Post, Put, Delete, Body, Param } from '@loonyjs/core';
import { AppUserService } from '../services/app-user.service';
import { AppUser } from '../entities/app-user.entity';

@Controller('users')
export class AppUserController {
  constructor(private readonly userService: AppUserService) {}

  @Get()
  findAll(): Promise<AppUser[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AppUser> {
    return this.userService.findById(Number(id));
  }

  @Post()
  create(@Body() body: Partial<AppUser>): Promise<AppUser> {
    return this.userService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<AppUser>): Promise<AppUser> {
    return this.userService.update(Number(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.userService.delete(Number(id));
  }
}
