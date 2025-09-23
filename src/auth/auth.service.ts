import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConsultantDetail } from 'models/consultant-detail.model';
import { User } from 'models/user.model';
import { CustomError } from 'src/config/custom-error.exception';
import { ConsultantDetailRepository } from '../../repository/consultant-detail.repository';
import { UserRepository } from '../../repository/user.repository';
import { CreateConsultantDetailDto } from '../user/dto/create-consultant-detail.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly consultantRepo: ConsultantDetailRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signupConsultant(consultantDto: CreateConsultantDetailDto) {
    const hashedPassword = await bcrypt.hash(consultantDto.password, 10);
    const user = await this.userRepo.createUser({
      ...consultantDto,
      password: hashedPassword,
    });

    await this.consultantRepo.createDetail(consultantDto, user.id);

    const userWithConsultant = await User.findOne({
      where: { id: user.id },
      include: [ConsultantDetail],
    });
    return userWithConsultant;
  }

  async signupUser(userDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(userDto.password, 10);
    return this.userRepo.createUser({
      ...userDto,
      password: hashedPassword,
    });
  }

  async login(email: string, password: string): Promise<User> {
    const user = await User.findOne({
      where: { email },
      attributes: { include: ['password'] },
    });
    if (!user) {
      throw new CustomError(404, 'User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new CustomError(401, 'Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    user.token = token;
    user.password = undefined;
    return user;
  }
}
