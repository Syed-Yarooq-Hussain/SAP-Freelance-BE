import { Body, Controller, Get, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CustomResponse } from 'src/utils/CustomResponse';
import { User } from 'models/user.model';
import { CreateConsultantDetailDto } from '../user/dto/create-consultant-detail.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CustomError } from 'src/config/custom-error.exception';
import { FileInterceptor } from '@nestjs/platform-express';

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
}
