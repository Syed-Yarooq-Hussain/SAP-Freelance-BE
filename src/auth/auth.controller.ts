import { Body, Controller, Get, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors, Logger, Query } from '@nestjs/common';
import { Response, Request } from 'express';
import * as passport from 'passport';

// Extend Express Request to include 'user' property
interface AuthenticatedRequest extends Request {
  user?: any;
}
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CustomResponse } from 'src/utils/CustomResponse';
import { User } from 'models/user.model';
import { CreateConsultantDetailDto } from '../user/dto/create-consultant-detail.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CustomError } from 'src/config/custom-error.exception';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private logger = new Logger('AuthController');

  constructor(private readonly authService: AuthService) {}
  
  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  loginWithLinkedIn() {}

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinCallback(@Req() req, @Res() res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'LinkedIn auth failed' });
    }
    const result = await this.authService.loginWithLinkedIn(req.user);
    console.log('🔵 LinkedIn login result:', result);
    return res.redirect(
      `${process.env.FE_BASE_URL}/auth/linkedin?token=${result.token}`,
    );
  }


  // 🟢 Consultant Signup
  @Post('signup/consultant')
  @ApiOperation({ summary: 'Signup as a consultant' })
  @ApiResponse({ status: 201, description: 'Consultant signed up successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiBody({ type: CreateConsultantDetailDto })
  async signupConsultant(
    @Body() consultantDto: CreateConsultantDetailDto,
  ) {
    return await this.authService.signupConsultant(consultantDto);
  }
  
  // 🟣 User Signup
  @Post('signup/user')
  async registerUser(@Body() registerDto: RegisterDto) {
      return await this.authService.signupUser(registerDto)
  }

// 🔵 Login Endpoint
@Post('login')
  @ApiOperation({ summary: 'Login using email and password' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    return CustomResponse.success<any>(res, {
      data: result,
      message: 'Login successful',
    });
  }

  @Post('parse-cv')
  @UseInterceptors(FileInterceptor('cv'))
  async parseCV(@UploadedFile() file: Express.Multer.File) {
    return this.authService.parse(file);
  }

  // 🧪 Test Endpoint
  @Get('test')
  @ApiOperation({ summary: 'Test endpoint for auth module' })
  @ApiResponse({ status: 200, description: 'Auth test successful.' })
  async test(@Res() res: Response) {
    return CustomResponse.success(res, {
      message: 'Auth module is working fine',
    });
  }

  // 🧪 Test Session
  @Get('test/session')
  async testSession(@Req() req: any, @Res() res: Response) {
  
      // Store something in session
    req.session.testData = {
      timestamp: new Date(),
      testValue: 'session-works',
    };
    
    return res.json({
      message: 'Session test',
      sessionId: req.sessionID,
      sessionData: req.session,
    });
  }

  // 🧪 Test LinkedIn Config
  @Post('send-verification-email')
  async sendVerificationEmail(@Body('userId') userId: number) {
    return this.authService.sendVerificationEmail(userId);
  }

  /**
   * CTA: Verify Email (From Email Link)
   */
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

   @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  // Reset Password
  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
    @Body('confirmPassword') confirmPassword: string
  ) {
    return this.authService.resetPassword(
      token,
      newPassword,
      confirmPassword
    );
  }
}
