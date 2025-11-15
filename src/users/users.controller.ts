import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Body,
  Req,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { Types } from 'mongoose';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
  };
}

type UserPlain = User & { _id: Types.ObjectId; passwordHash: string };

function toSafeUser(user: UserDocument) {
  const raw = user.toObject() as UserPlain;
  const { passwordHash: _passwordHash, ...safeUser } = raw;
  void _passwordHash;
  return safeUser;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    const user = await this.usersService.getMe(userId);
    return toSafeUser(user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Req() req: RequestWithUser, @Body() dto: UpdateUserDto) {
    const userId = req.user.userId;
    const user = await this.usersService.updateMe(userId, dto);
    return toSafeUser(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    const avatarUrl = `/uploads/avatars/${file.filename}`;

    const user = await this.usersService.updateAvatar(userId, avatarUrl);
    return toSafeUser(user);
  }
}
