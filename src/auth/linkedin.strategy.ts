import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-openidconnect';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor() {
    super({
      issuer: 'https://www.linkedin.com/oauth',
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      userInfoURL: 'https://api.linkedin.com/v2/userinfo',

      clientID: '78pc9omxw8ybsq',
      clientSecret: 'WPL_AP1.eE5IFo7EiDoQdh9K.S7kgPw==',
      callbackURL: 'https://sap-freelance-be-production.up.railway.app/auth/linkedin/callback',

      scope: ['openid', 'profile', 'email'],
    });
  }

  async validate(issuer, profile, done) {
    console.log('🔵 LinkedIn Strategy validate called', profile);
    const user = {
      linkedin_id: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value || null,
    };

    done(null, user);
  }
}
