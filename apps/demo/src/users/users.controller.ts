import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  SetMetadata,
} from '@loonyjs/core';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Demo: mark a route as public (skips auth guard)
const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users?limit=10
   * Returns a paginated list of users.
   */
  @Get()
  @Public()
  findAll(@Query('limit') limit?: string) {
    const users = this.usersService.findAll();
    const maxItems = limit ? parseInt(limit, 10) : users.length;
    return {
      data: users.slice(0, maxItems),
      total: users.length,
    };
  }

  /**
   * GET /users/count
   * Must be registered BEFORE :id to avoid "count" being parsed as an id.
   */
  @Get('count')
  @Public()
  count() {
    return { count: this.usersService.count() };
  }

  /**
   * GET /users/:id
   */
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * POST /users
   * Returns 201 on success.
   */
  @Post()
  @HttpCode(201)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * PATCH /users/:id
   * Partial update.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * DELETE /users/:id
   * Returns 204 No Content.
   */
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    this.usersService.remove(id);
  }
}
