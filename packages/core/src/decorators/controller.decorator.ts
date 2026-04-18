import 'reflect-metadata';
import { METADATA_KEYS } from '../metadata/metadata-keys';

export interface ControllerOptions {
  path?: string;
  version?: string;
}

/**
 * Declares a class as a controller.
 *
 * @example
 *   @Controller('users')
 *   export class UsersController { ... }
 */
export function Controller(pathOrOptions: string | ControllerOptions = ''): ClassDecorator {
  return (target) => {
    const options: ControllerOptions =
      typeof pathOrOptions === 'string' ? { path: pathOrOptions } : pathOrOptions;
    Reflect.defineMetadata(METADATA_KEYS.CONTROLLER, options, target);
  };
}
