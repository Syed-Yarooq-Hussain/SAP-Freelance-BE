import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../repository/user.repository';
import { ConsultantDetailRepository } from '../../repository/consultant-detail.repository';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CreateConsultantDetailDto } from '../user/dto/create-consultant-detail.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly consultantRepo: ConsultantDetailRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signupConsultant(userDto: CreateUserDto, consultantDto: CreateConsultantDetailDto) {
    const hashedPassword = await bcrypt.hash(userDto.password, 10);
    const user = await this.userRepo.createUser({
      ...userDto,
      password: hashedPassword,
    });

    const consultantDetail = await this.consultantRepo.createDetail(consultantDto, user.id);

    return { user, consultantDetail };
  }

  async signupUser(userDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(userDto.password, 10);
    return this.userRepo.createUser({
      ...userDto,
      password: hashedPassword,
    });
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, role: user.role, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      user,
    };
  }
}
