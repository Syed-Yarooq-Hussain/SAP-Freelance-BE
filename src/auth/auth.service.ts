import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CustomError } from '../config/custom-error.exception';
import { User } from '../../models/user.model';
import { ConsultantRepository } from '../../repository/consultant.repository';
import { UserRepository } from '../../repository/user.repository';
import { CreateConsultantDetailDto } from '../user/dto/create-consultant-detail.dto';
import { RegisterDto } from './dto/register.dto';
import { ConsultantLevel, USER_STATUS_ARRAY, UserRole, UserStatus } from 'constant/enums';
import { ConsultantModuleRepository } from 'repository/consultant-module.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly consultantRepo: ConsultantRepository,
    private readonly jwtService: JwtService,
    private readonly consultantModuleRepo: ConsultantModuleRepository
  ) {}

 // 🟢 Consultant Signup
async signupConsultant(consultantDto: CreateConsultantDetailDto) {
  // ✅ Step 1: Password Hashing
  
  const hashedPassword = await bcrypt.hash(consultantDto.user.password, 10);
  // ✅ Step 2: Create User Record
  const user = await this.userRepo.createUser({
    username: consultantDto.user.username,
    email: consultantDto.user.email,
    password: hashedPassword,
    role: +UserRole.CONSULTANT,
    status: UserStatus.PENDING,
    phone: consultantDto.user.phone || null,
    currency: consultantDto.user.currency || 'PKR',
    city: consultantDto.user.city || null,
    country: consultantDto.user.country || null,
  });


  // ✅ Step 3: Create Consultant Details (Link With user.id)
  const level= this.getLevelByExperience(consultantDto.consultant.experience);
  const schedule = this.generateWeekSchedule(consultantDto.consultant.weekly_available_hours);
  
  await this.consultantRepo.createDetail(
    {
      module: consultantDto.consultant.module,
      level,
      experience: consultantDto.consultant.experience,
      rate: consultantDto.consultant.rate,
      weekly_available_hours: consultantDto.consultant.weekly_available_hours,
      working_schedule: schedule,
      cv_url: consultantDto.consultant.cv_url,
      user_id: user.id,
    }
  );

  await this.consultantModuleRepo.createModule({
    user_id: user.id,
    module_id: +consultantDto.consultant.core_module[0],
    is_primary: true,
  });
  
  await this.consultantModuleRepo.createModule({
    user_id: user.id,
    module_id: +consultantDto.consultant.other_module[0],
  });
  // ✅ Step 4: Return Created Record (Without Password)
  const userWithConsultant = await User.findOne({
    where: { id: user.id },
  });

  if (userWithConsultant) (userWithConsultant as any).password = undefined;
  return userWithConsultant;
}

  // 🟣 User Signup
  async signupUser(userDto: RegisterDto) {
    // ✅ Step 1: Hash Password
    const hashedPassword = await bcrypt.hash(userDto.password, 10);

    // ✅ Step 2: Create user Record
    const newUser = await this.userRepo.createUser({
      username: userDto.username, 
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

    return user;
  }

  getLevelByExperience(experience: number): string {
    if (experience < 2) return ConsultantLevel.JUNIOR;
    if (experience >= 2 && experience < 5) return ConsultantLevel.MID;
    if (experience >= 5 && experience < 10) return ConsultantLevel.SENIOR;
    return ConsultantLevel.LEAD;
  }

  generateWeekSchedule(totalHours: number) {
    const weekdays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const dailyHours = totalHours / 5; 
    const startHour = 9; 
    const endHour = startHour + dailyHours;

    const formatTime = (h) => h.toString().padStart(2, "0") + ":00";

    return weekdays.map((day) => {
      if (day === "Saturday" || day === "Sunday") {
        return { day, active: false };
      } else {
        return {
          day,
          start: formatTime(startHour),
          end: formatTime(endHour),
          active: true,
        };
      }
    });
  }

}
