import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: any) {
    const allowed = (await super.canActivate(context)) as boolean;
    if (!allowed) return false;

    const request = context.switchToHttp().getRequest();
    return !!request.user;
  }
}
