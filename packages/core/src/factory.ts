import 'reflect-metadata';
import { Type } from './di/types';
import { AbstractHttpAdapter } from './http/http-adapter.interface';
import { ExpressAdapter } from './http/express-adapter';
import { LoonyApplication, LoonyApplicationOptions } from './application';

/**
 * Entry point for creating a LoonyJS application.
 *
 * @example
 *   const app = await LoonyFactory.create(AppModule);
 *   await app.listen(3000);
 */
export class LoonyFactory {
  /**
   * Create a new application backed by Express (default).
   */
  static async create(
    rootModule: Type,
    options?: LoonyApplicationOptions,
  ): Promise<LoonyApplication>;

  /**
   * Create a new application with a custom HTTP adapter.
   */
  static async create(
    rootModule: Type,
    httpAdapter: AbstractHttpAdapter,
    options?: LoonyApplicationOptions,
  ): Promise<LoonyApplication>;

  static async create(
    rootModule: Type,
    adapterOrOptions?: AbstractHttpAdapter | LoonyApplicationOptions,
    maybeOptions?: LoonyApplicationOptions,
  ): Promise<LoonyApplication> {
    let adapter: AbstractHttpAdapter;
    let options: LoonyApplicationOptions;

    if (adapterOrOptions instanceof AbstractHttpAdapter) {
      adapter = adapterOrOptions;
      options = maybeOptions ?? {};
    } else {
      adapter = new ExpressAdapter();
      options = adapterOrOptions ?? {};
    }

    const app = new LoonyApplication(adapter, rootModule, options);
    return app.init();
  }
}
