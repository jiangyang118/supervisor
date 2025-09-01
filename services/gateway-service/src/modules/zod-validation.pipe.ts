import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: any, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const issues = result.error.issues || [];
      const msg = issues.length ? `${issues[0].path.join('.') || 'body'}: ${issues[0].message}` : 'Invalid request body';
      throw new BadRequestException(msg);
    }
    return result.data;
  }
}

