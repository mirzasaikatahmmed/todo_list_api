import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Todo, TodoDocument } from './schemas/todo.schema';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(
    @InjectModel(Todo.name)
    private readonly todoModel: Model<TodoDocument>,
  ) {}

  async create(userId: string, dto: CreateTodoDto): Promise<Todo> {
    const created = new this.todoModel({
      ...dto,
      owner: new Types.ObjectId(userId),
    });
    return created.save();
  }

  async findAllByUser(userId: string): Promise<Todo[]> {
    return this.todoModel
      .find({ owner: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOneForUser(userId: string, todoId: string): Promise<Todo> {
    const todo = await this.todoModel.findById(todoId).exec();

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    if (todo.owner.toString() !== userId) {
      throw new ForbiddenException('You do not own this todo');
    }

    return todo;
  }

  async updateForUser(
    userId: string,
    todoId: string,
    dto: UpdateTodoDto,
  ): Promise<Todo> {
    const todo = await this.todoModel.findById(todoId).exec();
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    if (todo.owner.toString() !== userId) {
      throw new ForbiddenException('You do not own this todo');
    }

    if (dto.title !== undefined) todo.title = dto.title;
    if (dto.description !== undefined) todo.description = dto.description;
    if (dto.isCompleted !== undefined) todo.isCompleted = dto.isCompleted;

    return todo.save();
  }

  async removeForUser(userId: string, todoId: string): Promise<void> {
    const todo = await this.todoModel.findById(todoId).exec();
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    if (todo.owner.toString() !== userId) {
      throw new ForbiddenException('You do not own this todo');
    }

    await todo.deleteOne();
  }
}
