import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'changeme',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const userId = payload.sub;
    const user = await this.authService.validateUser(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    // strip sensitive fields (passwordHash) before attaching to request
    const obj = user.toObject ? user.toObject() : (user as any);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...safeUser } = obj as any;
    void _passwordHash;
    return safeUser;
  }
}
