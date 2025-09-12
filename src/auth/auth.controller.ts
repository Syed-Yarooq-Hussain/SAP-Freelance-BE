import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CreateConsultantDetailDto } from '../user/dto/create-consultant-detail.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup/consultant')
  async signupConsultant(
    @Body('user') userDto: CreateUserDto,
    @Body('consultant') consultantDto: CreateConsultantDetailDto,
  ) {
    return this.authService.signupConsultant(userDto, consultantDto);
  }

  @Post('signup/user')
  async signupUser(@Body() userDto: CreateUserDto) {
    return this.authService.signupUser(userDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
