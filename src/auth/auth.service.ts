import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CustomError } from '../config/custom-error.exception';
import { User } from '../../models/user.model';
import { ProjectDetail } from '../../models/project-detail.model';
import { ConsultantRepository } from '../../repository/consultant.repository';
import { UserRepository } from '../../repository/user.repository';
import { CreateConsultantDetailDto } from '../user/dto/create-consultant-detail.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from 'constant/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly consultantRepo: ConsultantRepository,
    private readonly jwtService: JwtService,
  ) {}

 // 🟢 Consultant Signup
async signupConsultant(consultantDto: CreateConsultantDetailDto) {
  // ✅ Step 1: Password hashing
  console.log('Hashed password:', consultantDto.user);

  const hashedPassword = await bcrypt.hash(consultantDto.user.password, 10);
  // ✅ Step 2: Create user record
  const user = await this.userRepo.createUser({
    username: consultantDto.user.username,
    email: consultantDto.user.email,
    password: hashedPassword,
    role: +UserRole.CONSULTANT,
    status: consultantDto.user.status === 'active' ? 1 : 0,
    phone: consultantDto.user.phone || null,
    currency: consultantDto.user.currency || 'USD',
    city: consultantDto.user.city || null,
    country: consultantDto.user.country || null,
  });

  // ✅ Step 3: Create consultant details (link with user.id)
  await this.consultantRepo.createDetail(
    {
      module: consultantDto.consultant.module,
      level: consultantDto.consultant.level,
      experience: consultantDto.consultant.experience,
      rate: consultantDto.consultant.rate,
      weekly_available_hours: consultantDto.consultant.weekly_available_hours,
      schedule: consultantDto.consultant.schedule,
      cv_url: consultantDto.consultant.cv_url
    },
    user.id,
  );

  // ✅ Step 4: Return created record (without password)
  const userWithConsultant = await User.findOne({
    where: { id: user.id },
    include: [ProjectDetail],
  });

  if (userWithConsultant) (userWithConsultant as any).password = undefined;
  return userWithConsultant;
}

  // 🟣 Normal User Signup
  async signupUser(userDto: RegisterDto) {
    // ✅ Step 1: Hash password
    const hashedPassword = await bcrypt.hash(userDto.password, 10);

    // ✅ Step 2: Create user record
    const newUser = await this.userRepo.createUser({
      username: userDto.username, // ✅ username instead of name
      email: userDto.email,
      password: hashedPassword,
      role: +UserRole.CLIENT, 
      status: 1 || "active",
      phone: userDto.phone || null,
      currency: userDto.currency || 'USD',
      city: userDto.city || 'Karachi',
      country: userDto.country || 'Pakistan',
    });

    (newUser as any).password = undefined;
    return newUser;
  }

  // 🔵 Login Service
  async login(email: string, password: string): Promise<any> {
    const user = await User.findOne({
      where: { email },
      attributes: { include: ['password'] },
      raw: true,
    });

    if (!user) throw new CustomError(404, 'User not found');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new CustomError(401, 'Invalid credentials');

    const payload = { sub: user.id, role: user.role, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    user['token'] = token;
    (user as any).password = undefined;
    console.log('Attempting login for email:', user);

    return user;
  }
}
