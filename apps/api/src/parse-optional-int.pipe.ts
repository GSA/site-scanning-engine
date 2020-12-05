import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParseOptionalIntPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value) {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        throw new BadRequestException('Expected an integer value');
      }
      return parsed;
    }
  }
}
