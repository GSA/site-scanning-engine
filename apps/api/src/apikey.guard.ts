import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const valid = this.validateRequest(request);
    return valid;
  }

  validateRequest(request): boolean {
    const apiKey = this.configService.get('apiKey');
    const headerKey = request.get('X-Secret-Api-Access-Token');
    return apiKey === headerKey;
  }
}
