import { PipeTransform, ArgumentMetadata, BadRequestException } from '@loonyjs/core';

export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new BadRequestException(
        `Validation failed. "${value}" is not a valid integer (param: ${metadata.data}).`,
      );
    }
    return parsed;
  }
}
