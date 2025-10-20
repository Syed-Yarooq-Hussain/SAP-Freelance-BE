import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('login')
  @UseGuards(AuthGuard('oauth2'))
  async login(@Req() req, @Res() res) {

    const user = req.user;

    const token = this.jwtService.sign({ sub: user.id });

    res.cookie('access_token', token, { httpOnly: true });
    res.redirect('/');
  }
}
