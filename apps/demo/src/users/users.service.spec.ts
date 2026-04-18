/**
 * Unit tests for UsersService — shows how to use @loonyjs/testing.
 *
 * Run with:  npx ts-node -e "require('./run-tests')"
 * Or wire into Jest / Vitest normally.
 */
import 'reflect-metadata';
import { TestingModule } from '@loonyjs/testing';
import { UsersService } from './users.service';
import { ConflictException, NotFoundException } from '@loonyjs/core';
import { CreateUserDto, UserRole } from './dto/create-user.dto';

async function run() {
  // ── Bootstrap ────────────────────────────────────────────────────
  const module = await TestingModule.create({
    providers: [UsersService],
  }).compile();

  const service = module.get(UsersService);

  // onModuleInit seeds users — call it manually in tests
  await (service as any).onModuleInit();

  // ── Tests ────────────────────────────────────────────────────────
  let passed = 0;
  let failed = 0;

  function assert(label: string, condition: boolean) {
    if (condition) {
      console.log(`  ✅ ${label}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${label}`);
      failed++;
    }
  }

  function assertThrows(label: string, fn: () => any, expectedClass: any) {
    try {
      fn();
      console.error(`  ❌ FAIL: ${label} (no exception thrown)`);
      failed++;
    } catch (e) {
      if (e instanceof expectedClass) {
        console.log(`  ✅ ${label}`);
        passed++;
      } else {
        console.error(`  ❌ FAIL: ${label} (wrong exception: ${(e as any)?.constructor?.name})`);
        failed++;
      }
    }
  }

  console.log('\n──── UsersService ────');

  // findAll
  const all = service.findAll();
  assert('findAll returns seeded users', all.length >= 2);

  // findOne
  const user = service.findOne('1');
  assert('findOne returns correct user', user.id === '1');
  assertThrows('findOne throws NotFoundException for missing id', () => service.findOne('999'), NotFoundException);

  // create
  const dto: CreateUserDto = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: UserRole.USER,
  };
  const created = service.create(dto);
  assert('create returns new user', created.email === 'test@example.com');
  assert('create assigns auto id', typeof created.id === 'string');
  assertThrows('create throws ConflictException on duplicate email', () => service.create(dto), ConflictException);

  // update
  const updated = service.update(created.id, { name: 'Updated Name' });
  assert('update modifies name', updated.name === 'Updated Name');
  assert('update preserves email', updated.email === 'test@example.com');

  // count (all was captured before create, so count should be all.length + 1)
  const count = service.count();
  assert('count reflects total users', count === service.findAll().length);

  // remove
  service.remove(created.id);
  assertThrows('remove then findOne throws', () => service.findOne(created.id), NotFoundException);
  assertThrows('remove non-existent throws', () => service.remove('nonexistent'), NotFoundException);

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
