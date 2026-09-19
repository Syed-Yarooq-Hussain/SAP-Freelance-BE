import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from 'models/user.model';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersDto } from './dto/get-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Consultant } from 'models/consultant.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userPayload: any = {
      ...createUserDto,
      role: createUserDto.role ? Number(createUserDto.role) : null,
    };

    const user = await this.userModel.create(userPayload);
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async getUsers(currentUserId: number, query: GetUsersDto) {
    const { name, email, role, page = 1, limit = 10 } = query;

    const where: any = {};

    if (name) {
      where.name = { [Op.iLike]: `%${name}%` };
    }

    if (email) {
      where.email = { [Op.iLike]: `%${email}%` };
    }

    if (role) {
      where.role = Number(role);
    }

    const offset = (page - 1) * limit;

    const { rows: users, count } = await this.userModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    return {
      data: users,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    const updatedPayload: any = {
      ...updateUserDto,
      ...(updateUserDto.role && { role: Number(updateUserDto.role) }),
    };

    return user.update(updatedPayload);
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id);
    await user.destroy();
    return { message: `User with ID ${id} has been deleted` };
  }
   async getFilteredUsers(
    experience?: number,
    availability?: number,
    budget?: number,
    country?: string,
  ): Promise<User[]> {
    const where: any = {};
    const consultantWhere: any = {}; 

    // 🌍 Country Filter
    if (country) {
      where.country = { [Op.iLike]: `%${country}%` };
    }

    // 💼 Experience Filter
    if (experience) {
      consultantWhere.experience = { [Op.gte]: experience }; 
    }

    // ⏱ Availability Filter
    if (availability) {
      consultantWhere.weekly_available_hours = { [Op.gte]: availability };
    }

    // 💰 Budget Filter
    if (budget) {
      consultantWhere.rate = { [Op.lte]: budget };
    }

    // 🧠 Run Sequelize Query With Include
    return await this.userModel.findAll({
      where,
      include: [
        {
          model: Consultant,
          required: true,
          where: consultantWhere,
        },
      ],
      raw: true,
      nest: true,
    });
  }

  async changePassword(userId: number, changePasswordDto: any) {
    const user = await this.userModel.findByPk(userId, {
      attributes: { include: ['password'] },
    });
    if (!user) throw new NotFoundException('User not found');

    const oldPassword = changePasswordDto?.oldPassword;
    const newPassword = changePasswordDto?.newPassword;
    const confirmPassword = changePasswordDto?.confirmPassword;

    if (!newPassword) {
      throw new BadRequestException('newPassword is required');
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (oldPassword) {
      if (!user.password) {
        throw new BadRequestException(
          'Password is not set for this account. Please use forgot password to set a password.',
        );
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      if (!isPasswordValid) throw new UnauthorizedException('Invalid old password');
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long, contain 1 uppercase letter and 1 number',
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return {
      message: 'Password changed successfully',
    };
  }
}
