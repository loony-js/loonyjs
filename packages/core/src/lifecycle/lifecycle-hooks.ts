import {
  OnModuleInit,
  OnModuleDestroy,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '../interfaces';

/**
 * Calls lifecycle hooks on provider instances in the correct order.
 *
 * Design decision: hooks are checked structurally (duck-typing) rather than
 * via inheritance, so any class with onModuleInit() qualifies — no base class needed.
 */
export class LifecycleHooks {
  static async callModuleInit(instances: any[]): Promise<void> {
    for (const inst of instances) {
      if (inst && typeof (inst as OnModuleInit).onModuleInit === 'function') {
        await (inst as OnModuleInit).onModuleInit();
      }
    }
  }

  static async callModuleDestroy(instances: any[]): Promise<void> {
    for (const inst of [...instances].reverse()) {
      if (inst && typeof (inst as OnModuleDestroy).onModuleDestroy === 'function') {
        await (inst as OnModuleDestroy).onModuleDestroy();
      }
    }
  }

  static async callAppBootstrap(instances: any[]): Promise<void> {
    for (const inst of instances) {
      if (inst && typeof (inst as OnApplicationBootstrap).onApplicationBootstrap === 'function') {
        await (inst as OnApplicationBootstrap).onApplicationBootstrap();
      }
    }
  }

  static async callAppShutdown(instances: any[], signal?: string): Promise<void> {
    for (const inst of [...instances].reverse()) {
      if (inst && typeof (inst as OnApplicationShutdown).onApplicationShutdown === 'function') {
        await (inst as OnApplicationShutdown).onApplicationShutdown(signal);
      }
    }
  }
}
