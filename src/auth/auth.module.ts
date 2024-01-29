// auth.module.ts

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import * as OAuth2Strategy from 'passport-oauth2'; // Correct import statement
import { JwtStrategy } from './jwt.stretegy';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: 'your-secret-key', // Replace with your secret key
      signOptions: { expiresIn: '1h' }, // Set the expiration time as needed
    }),PassportModule],
  providers: [
    {
      provide: 'OAUTH2_STRATEGY',
      useFactory: () => {
        return new OAuth2Strategy(
          {
            authorizationURL: 'https://example.com/oauth2/authorize',
            tokenURL: 'https://example.com/oauth2/token',
            clientID: 'your-client-id',
            clientSecret: 'your-client-secret',
            callbackURL: 'http://localhost:3000/auth/callback',
          },
          (accessToken, refreshToken, profile, done) => {
            return done(null, profile);
          }
        );
      },
    },
  ],
  exports: [JwtModule]
})
export class AuthModule {}
