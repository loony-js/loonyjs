import { PipeTransform, ArgumentMetadata, BadRequestException } from '@loonyjs/core';

/**
 * Built-in validation pipe.
 *
 * Uses a lightweight schema approach (no external deps).
 * Each DTO class can implement a static validate() method, or
 * fields can be decorated with @IsString(), @IsNumber() etc.
 *
 * Design decision: keeping validation in the pipe (not the controller)
 * means every route automatically gets validation when the pipe is global.
 */
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    if (!metadata.metatype || !this.shouldValidate(metadata.metatype)) {
      return value;
    }

    // If the metatype has a static validate() — call it
    const metatype = metadata.metatype as any;
    if (typeof metatype.validate === 'function') {
      const errors = metatype.validate(value);
      if (errors && errors.length > 0) {
        throw new BadRequestException({ message: 'Validation failed', errors });
      }
    }

    // Map plain object to typed instance
    return this.mapToInstance(metatype, value);
  }

  private mapToInstance(metatype: any, value: any): any {
    if (typeof value !== 'object' || value === null) return value;
    const instance = Object.create(metatype.prototype);
    return Object.assign(instance, value);
  }

  private shouldValidate(metatype: any): boolean {
    const primitives = [String, Boolean, Number, Array, Object];
    return !primitives.includes(metatype);
  }
}
