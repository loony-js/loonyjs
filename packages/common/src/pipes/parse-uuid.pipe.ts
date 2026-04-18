import { PipeTransform, ArgumentMetadata, BadRequestException } from '@loonyjs/core';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!UUID_REGEX.test(value)) {
      throw new BadRequestException(
        `Validation failed. "${value}" is not a valid UUID (param: ${metadata.data}).`,
      );
    }
    return value;
  }
}
