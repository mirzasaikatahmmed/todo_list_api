import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Types } from 'mongoose';

type UserPlain = User & { _id: Types.ObjectId; passwordHash: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private toSafeUser(user: UserDocument) {
    const raw = user.toObject() as UserPlain;
    const { passwordHash: _passwordHash, ...safeUser } = raw;
    void _passwordHash;
    return safeUser;
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    const userId = (user._id as Types.ObjectId).toString();
    const token = this.generateToken(userId, user.email);

    const safeUser = this.toSafeUser(user);

    return {
      accessToken: token,
      user: safeUser,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userId = (user._id as Types.ObjectId).toString();
    const token = this.generateToken(userId, user.email);

    const safeUser = this.toSafeUser(user);

    return {
      accessToken: token,
      user: safeUser,
    };
  }

  async validateUser(userId: string): Promise<UserDocument> {
    return this.usersService.findById(userId);
  }

  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
