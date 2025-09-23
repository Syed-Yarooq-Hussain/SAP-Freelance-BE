import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { User } from 'models/user.model';
import { CustomResponse } from 'src/utils/CustomResponse';
import { CreateConsultantDetailDto } from '../user/dto/create-consultant-detail.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup/consultant')
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

  @Post('signup/user')
  async signupUser(@Body() userDto: CreateUserDto, @Res() res: Response) {
    const result = await this.authService.signupUser(userDto);
    return CustomResponse.success<User>(res, {
      data: result,
      message: 'User signed up successfully',
    });
  }

  @Post('login')
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

  @Get('/test')
  async test(@Res() res: Response) {
    return CustomResponse.success(res, {});
  }
}
