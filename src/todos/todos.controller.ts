import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  async create(@Req() req: RequestWithUser, @Body() dto: CreateTodoDto) {
    const userId = req.user.userId;
    return this.todosService.create(userId, dto);
  }

  @Get()
  async findAll(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.todosService.findAllByUser(userId);
  }

  @Get(':id')
  async findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.todosService.findOneForUser(userId, id);
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
  ) {
    const userId = req.user.userId;
    return this.todosService.updateForUser(userId, id, dto);
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user.userId;
    await this.todosService.removeForUser(userId, id);
    return { deleted: true };
  }
}
