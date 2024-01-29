// auth.controller.ts

import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  @Get('login')
  @UseGuards(AuthGuard('oauth2'))
  login() {
    // Initiates the OAuth 2.0 authentication flow
  }

  @Get('callback')
  @UseGuards(AuthGuard('oauth2'))
  callback(@Req() req, @Res() res) {
    // Handles the OAuth 2.0 callback
    res.redirect('/');
  }
}
