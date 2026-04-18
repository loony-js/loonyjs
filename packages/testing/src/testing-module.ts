import 'reflect-metadata';
import { Container } from '@loonyjs/core';
import { Type, Token, Provider, Scope } from '@loonyjs/core';
import { ModuleMetadata } from '@loonyjs/core';

/**
 * Test module builder — mirrors NestJS's Test.createTestingModule().
 *
 * Usage:
 *   const module = await TestingModule.create({
 *     providers: [UsersService, { provide: UsersRepo, useValue: mockRepo }],
 *   }).compile();
 *
 *   const service = module.get(UsersService);
 */
export class TestingModuleBuilder {
  constructor(private readonly metadata: ModuleMetadata) {}

  async compile(): Promise<CompiledTestingModule> {
    const container = new Container();

    // Register all providers
    for (const provider of this.metadata.providers ?? []) {
      container.register(provider);
    }
    for (const ctrl of this.metadata.controllers ?? []) {
      container.register(ctrl);
    }

    // Bootstrap
    await container.bootstrapAll();

    return new CompiledTestingModule(container);
  }
}

export class CompiledTestingModule {
  constructor(private readonly container: Container) {}

  get<T>(token: Token<T>): T {
    return this.container.resolve<T>(token);
  }

  async getAsync<T>(token: Token<T>): Promise<T> {
    return this.container.resolveAsync<T>(token);
  }

  /** Override a provider after compilation (useful for adding mocks). */
  override<T>(token: Token<T>, value: T): void {
    this.container.override(token, value);
  }
}

/**
 * Factory for creating test modules — entry point analogous to NestJS's Test class.
 */
export class TestingModule {
  static create(metadata: ModuleMetadata): TestingModuleBuilder {
    return new TestingModuleBuilder(metadata);
  }

  /** Create a simple mock object from an interface shape. */
  static createMock<T>(shape: Partial<T> = {}): T {
    return shape as T;
  }
}

// ------------------------------------------------------------------
// Mock helpers
// ------------------------------------------------------------------

/**
 * Create a provider stub where all methods return undefined by default.
 * Works without Jest — replace the spy factory if using Vitest or Sinon.
 */
export function createMockProvider<T>(cls: Type<T>): { provide: Type<T>; useValue: Partial<T> } {
  const methods = Object.getOwnPropertyNames(cls.prototype).filter((m) => m !== 'constructor');
  const mock: any = {};
  for (const method of methods) {
    mock[method] = () => undefined;
  }
  return { provide: cls, useValue: mock };
}
