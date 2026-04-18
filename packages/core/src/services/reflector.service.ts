import 'reflect-metadata';
import { Injectable } from '../decorators/injectable.decorator';

/**
 * The Reflector service reads metadata set by @SetMetadata().
 * Inject it into guards and interceptors to access route/controller metadata.
 *
 * Design decision: getAllAndOverride() follows route → controller priority,
 * which is more intuitive than NestJS's merge-then-override approach.
 */
@Injectable()
export class Reflector {
  /** Read metadata from a single target (class or method descriptor). */
  get<T = any>(key: string | symbol, target: Function): T | undefined {
    return Reflect.getMetadata(key, target) as T | undefined;
  }

  /**
   * Read from multiple targets (e.g. [handler, controller]).
   * Returns an array of all found values.
   */
  getAll<T = any>(key: string | symbol, targets: Function[]): (T | undefined)[] {
    return targets.map((t) => Reflect.getMetadata(key, t) as T | undefined);
  }

  /**
   * Returns the first defined value, scanning targets in order.
   * Useful for "route takes priority over controller" logic.
   */
  getAllAndOverride<T = any>(key: string | symbol, targets: Function[]): T | undefined {
    for (const target of targets) {
      const value = Reflect.getMetadata(key, target) as T | undefined;
      if (value !== undefined) return value;
    }
    return undefined;
  }

  /**
   * Merges array metadata from all targets into a single flat array.
   * Useful for collecting roles/permissions across the hierarchy.
   */
  getAllAndMerge<T extends any[] = any[]>(key: string | symbol, targets: Function[]): T {
    return targets.flatMap<any>((t) => Reflect.getMetadata(key, t) ?? []) as T;
  }
}
