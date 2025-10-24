import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CustomResponse } from 'src/utils/CustomResponse';
import { User } from 'models/user.model';
import { CreateConsultantDetailDto } from '../user/dto/create-consultant-detail.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CustomError } from 'src/config/custom-error.exception';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  // 🟢 Consultant Signup
  @Post('signup/consultant')
  @ApiOperation({ summary: 'Signup as a consultant' })
  @ApiResponse({ status: 201, description: 'Consultant signed up successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiBody({ type: CreateConsultantDetailDto })
  async signupConsultant(
    @Body() consultantDto: CreateConsultantDetailDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.signupConsultant(consultantDto);
    return CustomResponse.success<User>(res, {
      data: result,
      message: 'Consultant signed up successfully',
    });
  }
  
  // 🟣 User Signup (Normal User)
  @Post('signup/user')
  async registerUser(@Body() registerDto: RegisterDto) {
    try {
      const user = await this.authService.signupUser(registerDto);
      return {
        code: 200,
        status: 'success',
        data: user,
      message: 'User registered successfully',
    };
  } catch (error) {
    console.error('Signup error:', error);
    throw new CustomError(500, 'Validation error');
  }
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
    return CustomResponse.success<User>(res, {
      data: result,
      message: 'Login successful',
    });
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
}
