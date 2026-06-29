import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CustomError } from '../config/custom-error.exception';
import { User } from '../../models/user.model';
import { ConsultantRepository } from '../../repository/consultant.repository';
import { UserRepository } from '../../repository/user.repository';
import { CreateConsultantDetailDto } from '../user/dto/create-consultant-detail.dto';
import { RegisterDto } from './dto/register.dto';
import { ConsultantLevel, EmailType, USER_STATUS_ARRAY, UserRole, UserStatus } from 'constant/enums';
import { ConsultantModuleRepository } from 'repository/consultant-module.repository';
import { extractText, parseWithOpenAI } from 'src/common/pdf/pdf.reader';
import { UpdateConsultantDetailDto } from './dto/register-consultant.dto';
import * as crypto from 'crypto';
import { sendEmail } from 'src/common/emails/email.util';
import { createThreeMonthScheduleWindow } from 'src/common/calender/schedule-window.util';

@Injectable()
export class AuthService {
  private readonly DEBUG = process.env.DEBUG === 'true' || process.env.LOG_LEVEL === 'debug';
  constructor(
    private readonly userRepo: UserRepository,
    private readonly consultantRepo: ConsultantRepository,
    private readonly jwtService: JwtService,
    private readonly consultantModuleRepo: ConsultantModuleRepository
  ) {}

 // 🟢 Consultant Signup
  async signupConsultantwithAI(consultantDto: CreateConsultantDetailDto) {

    const isUserExist = await User.findOne({
      where: { email: consultantDto.user.email },
    });

    if (isUserExist) {
      throw new CustomError(500, 'User with this email already exists');
    }
    
    const hashedPassword = await bcrypt.hash(consultantDto.user.password, 10);
    // ✅ Step 2: Create User Record
    const user = await this.userRepo.createUser({
      username: consultantDto.user.username ?? null,
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
        clients_summary: consultantDto.consultant.clients_summary,
        skills: consultantDto.consultant.skills,
        education: consultantDto.consultant.education,
        certification: consultantDto.consultant.certifications,
        work_experiences: consultantDto.consultant.work_experiences,
        languages: consultantDto.consultant.languages,
      }
    );

    // Core modules
    if (consultantDto.consultant.core_module?.length) {
      for (const moduleId of consultantDto.consultant.core_module) {
        await this.consultantModuleRepo.createModule({
          user_id: user.id,
          module_id: +moduleId,
          is_primary: true, 
        });
      }
    }

    // Other modules
    if (consultantDto.consultant.other_module?.length) {
      for (const moduleId of consultantDto.consultant.other_module) {
        await this.consultantModuleRepo.createModule({
          user_id: user.id,
          module_id: +moduleId,
        });
      }
    }
    
    // ✅ Step 4: Return Created Record (Without Password)
    const userWithConsultant = await User.findOne({
      where: { id: user.id },
    });

    if (userWithConsultant) (userWithConsultant as any).password = undefined;
    return userWithConsultant;
  }

  async signupConsultant(body: any) {
    const isUserExist = await User.findOne({
      where: { email: body.email },
    });

    if (isUserExist) {
      if (isUserExist.status === UserStatus.PENDING) {
        await this.sendVerificationEmail(isUserExist.id);
        throw new CustomError(400, 'User with this email already exists. Please verify your email address to continue.');
      }
      throw new CustomError(400, 'User with this email already exists.');
    }

    // password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(body.password)) {
      throw new CustomError(
        400,
        'Password must contain at least 1 uppercase letter, 1 number and be 8 characters long'
      );
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await this.userRepo.createUser({
      username: body.username ?? null,
      email: body.email,
      password: hashedPassword,
      role: +UserRole.CONSULTANT,
      status: UserStatus.PENDING,
      phone: '123456789',
      currency: 'PKR',
      city: 'N/A',
      country: 'N/A',
    });
    
    const schedule = this.generateWeekSchedule(0);
    
    await this.consultantRepo.createDetail(
      {
        module: null,
        level: null,
        experience: null,
        rate: null,
        weekly_available_hours: 0,
        working_schedule: schedule,
        cv_url: null,
        user_id: user.id,
        clients_summary: null,
        skills: null,
        education: null,
        certification: null,
        work_experiences: null,
        projects: null,
        languages: null,
      }
    );

    return user;
  }


  // 🟣 User Signup
  async signupUser(userDto: RegisterDto) {
    // ✅ Step 1: Hash Password
    const isUserExist = await User.findOne({
      where: { email: userDto.email },
    });

    if (isUserExist) {
      throw new CustomError(400, 'User with this email already exists');
    }
    
    const hashedPassword = await bcrypt.hash(userDto.password, 10);

    // ✅ Step 2: Create user Record
    const newUser = await this.userRepo.createUser({
      username: userDto.username ?? null, 
      email: userDto.email,
      password: hashedPassword,
      role: +UserRole.CLIENT, 
      status: UserStatus.ACTIVE,
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

    /* if (user.status == UserStatus.PENDING) {
      throw new CustomError(403, 'Please verify your email first');
    } */

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new CustomError(401, 'Invalid credentials');

    const payload = { sub: user.id, role: user.role, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    user['token'] = token;
    user['loginWithLinkedin'] = Boolean(user.linkedin_sso_connected);
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

  const workingDays = 5;
  const dailyHours = totalHours / workingDays;

  const startHour = 9;
  const endHour = startHour + dailyHours;

  const formatTime = (h: number) =>
    `${Math.floor(h).toString().padStart(2, "0")}:00`;

  return {
    ...createThreeMonthScheduleWindow(),
    weekly: weekdays.map((day) => {
      if (day === "Saturday" || day === "Sunday") {
        return {
          day,
          active: false,
        };
      }

      return {
        day,
        slot: [
          {
            start: formatTime(startHour),
            end: formatTime(endHour),
          },
        ],
        active: true,
      };
    }),
    custom: [],
  };
  }

  private getAccurateLinkedInUrl(linkedinUser: any): string | null {
    const url = linkedinUser?.linkedin_url;
    if (typeof url !== 'string' || !url.trim()) return null;

    const normalized = url.trim();
    return /^https:\/\/(www\.)?linkedin\.com\/in\/[^/]+\/?$/i.test(normalized)
      ? normalized
      : null;
  }

  private isGeneratedLinkedInUrl(url: string | null, linkedInId: string) {
    if (!url || !linkedInId) return false;
    return (
      url.replace(/\/$/, '') ===
      `https://www.linkedin.com/in/${linkedInId}`.replace(/\/$/, '')
    );
  }

  async loginWithLinkedIn(linkedinUser: any) {
    try {
      console.log(`[AuthService][DEBUG] loginWithLinkedIn called: ${JSON.stringify({ id: linkedinUser?.id || linkedinUser?.linkedin_id, email: linkedinUser?.email })}`);

      // Validate LinkedIn user data
      if (!linkedinUser) {
        throw new CustomError(401, 'Invalid LinkedIn user data: null');
      }

      if (!linkedinUser.linkedin_id && !linkedinUser.sub) {
        throw new CustomError(401, 'Invalid LinkedIn user data: missing identifier');
      }

      // Use email if available, otherwise generate unique identifier
      const email = linkedinUser.email || `linkedin_${linkedinUser.linkedin_id}@temp.local`;
      const linkedinUrl = this.getAccurateLinkedInUrl(linkedinUser);
      

      let user = await User.findOne({
        where: { email: email },
      });

      if (!user) {
        
        user = await this.userRepo.createUser({
          username: linkedinUser.name || `LinkedIn User ${linkedinUser.linkedin_id}`,
          email: email,
          password: '123456',
          role: +UserRole.CONSULTANT,
          status: UserStatus.ACTIVE,
          phone: null,
          currency: 'PKR',
          city: null,
          country: null,
          email_verified: true,
          phone_verified: false,
          linkedin_url: linkedinUrl,
          linkedin_sso_connected: true,
        });

        const schedule = this.generateWeekSchedule(0);
        
        await this.consultantRepo.createDetail(
          {
            module: null,
            level: null,
            experience: null,
            rate: null,
            weekly_available_hours: 0,
            working_schedule: schedule,
            cv_url: null,
            user_id: user.id,
            clients_summary: null,
            skills: null,
            education: null,
            certification: null,
            work_experiences: null,
            projects: null,
            languages: null,
          }
        );

        
        
        console.log(`[AuthService][DEBUG] New user created: ${user.id}`);
      } else {
        console.log(`[AuthService][DEBUG] Existing user found: ${user.id}`);
        const userFields: Partial<User> = {
          linkedin_sso_connected: true,
        };

        if (linkedinUrl) {
          userFields.linkedin_url = linkedinUrl;
        } else if (this.isGeneratedLinkedInUrl(user.linkedin_url, linkedinUser.linkedin_id)) {
          userFields.linkedin_url = null;
        }

        await this.userRepo.updateUser(user.id, userFields);
        user = await User.findOne({ where: { id: user.id } });
      }

      // 🔐 Step 3: SAME JWT as normal login
     
      const payload = { sub: user.id, role: user.role, email: user.email };
      const token = await this.jwtService.signAsync(payload);

      return {
        token,
        user: {
          ...(user.toJSON() as any),
          password: undefined,
          loginWithLinkedin: Boolean(user.linkedin_sso_connected),
        },
      };
    } catch (error: any) {
      console.log(`[AuthService][ERROR] LinkedIn login error`, error?.stack || error?.message || String(error));
      throw new CustomError(500, `LinkedIn login failed: ${error.message}`);
    }
  }


  async parse(file: Express.Multer.File) {
    return {error:'to be fixed'};
   /*  const text = await extractText(file);
    return parseWithOpenAI(text); */
  }


  async sendVerificationEmail(userId: number) {
    const user = await User.findByPk(userId);

    if (!user) throw new CustomError(404, 'User not found');

    if (user.status === UserStatus.ACTIVE) {
      throw new CustomError(400, 'Email already verified, please login');
    }

    // ⛔ allow only once in 15 mins
    if (user.tokenMailExpiresAt && user.tokenMailExpiresAt > new Date()) {
      throw new CustomError(
        400,
        'Verification email already sent. Please wait 15 minutes.'
      );
    }

    const tokenMail = crypto.randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await user.update({
      tokenMail,
      tokenMailExpiresAt: expiresAt,
    });

    const verifyLink = `${process.env.FE_URL}/verify-email?token=${tokenMail}`;

    await sendEmail(
      user.email,
      EmailType.SIGNUP_VERIFICATION,
      user.username ?? null,
      'Consultcrew',
      verifyLink
    );

    return {
      message: 'An Email has been sent to your email address.',
    };
  }

  async verifyEmail(token: string) {
    const user = await User.findOne({ where: { tokenMail: token } });
    console.log(`[AuthService][DEBUG] Verifying email token: ${token}`);
    console.log(`[AuthService][DEBUG] Found user for token: ${user?.id}`);
    if (!user) {
      throw new CustomError(400, 'Invalid verification link');
    }

    if (user.tokenMailExpiresAt < new Date()) {
      throw new CustomError(
        400,
        'Verification link expired. Please signup again.'
      );
    }

    await user.update({
      status: UserStatus.ACTIVE,
      tokenMail: null,
      tokenMailExpiresAt: null,
      email_verified: true,
    });

    return {
      message: 'Email verified successfully. Please login.',
    };
  }



  async forgotPassword(email: string) {
    console.log(`[AuthService][DEBUG] forgotPassword called for email=${email}`);
    const user = await User.findOne({ where: { email } });

    // security: same response even if user not found
    if (!user) {
      return {
        message:
          'If an account exists with this email, a reset link has been sent.',
      };
    }

    // ⛔ 15 min rule
    if (user.tokenMailExpiresAt && user.tokenMailExpiresAt > new Date()) {
      throw new CustomError(
        400,
        'Password reset email already sent. Please wait 15 minutes.'
      );
    }

    const token = crypto.randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await user.update({
      tokenMail: token,
      tokenMailExpiresAt: expiresAt,
    });

    const resetLink = `${process.env.FE_URL}/reset-password?token=${token}`;

    await sendEmail(
      user.email,
      EmailType.RESET_PASSWORD,
      user.username || 'User',
      'Consultcrew',
      resetLink
    );

    console.log(`[AuthService][DEBUG] Password reset email queued for user=${user?.id} resetLink=${resetLink}`);

    return {
      message:
        'If an account exists with this email, a reset link has been sent.',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string
  ) {
    console.log(`[AuthService][DEBUG] resetPassword called for token=${token}`);
    if (newPassword !== confirmPassword) {
      throw new CustomError(400, 'Passwords do not match');
    }

    // same password validation as signup
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new CustomError(
        400,
        'Password must be at least 8 characters long, contain 1 uppercase letter and 1 number'
      );
    }

    const user = await User.findOne({ where: { tokenMail: token } });

    if (!user) {
      throw new CustomError(400, 'Invalid or expired reset link');
    }

    if (user.tokenMailExpiresAt < new Date()) {
      throw new CustomError(400, 'Reset link expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      tokenMail: null,
      tokenMailExpiresAt: null,
    });

    return {
      message: 'Password has been reset successfully. Please login.',
    };
  }

}
