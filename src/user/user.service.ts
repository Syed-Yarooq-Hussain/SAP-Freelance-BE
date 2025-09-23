import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { User } from '../../models/user.model'
import { UserRepository } from 'repository/user.repository';
import { GetUsersDto } from './dto/get-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}


  async create(user: User): Promise<User> {
    return this.userRepository.createUser(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async update(id: number, updateUserDto: Partial<User>) {
    return this.userRepository.updateUser(id, updateUserDto);
  }

  async remove(id: number): Promise<number> {
    const result = await this.userRepository.deleteUser(id);
    return result;
  }

  async getUsers(currentUserId: number, query: GetUsersDto) {
    const page = parseInt(query.page as any, 10) || 1;
    const limit = parseInt(query.limit as any, 10) || 10;

    return this.userRepository.findAllWithFilters(
      currentUserId,
      page,
      limit,
      query.search,
      query.role,
    );
  }
}
