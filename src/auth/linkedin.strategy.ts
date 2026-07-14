import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-openidconnect';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor() {
    console.log('LinkedIn Strategy Init');
    console.log('CLIENT ID:', process.env.LINKEDIN_CLIENT_ID);
    console.log('CALLBACK:', process.env.LINKEDIN_CALLBACK_URL);
    super({
      issuer: 'https://www.linkedin.com/oauth',
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      userInfoURL: 'https://api.linkedin.com/v2/userinfo',

      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: 'https://api.theconsultcrew.com/auth/linkedin/callback',
      // callbackURL: process.env.LINKEDIN_CALLBACK_URL,

      scope: ['openid', 'profile', 'email'],
    });
  }

  async validate(issuer, profile, done) {
    console.log('LinkedIn Strategy validate called', profile);
    const rawProfile = profile?._json || {};
    const linkedinUrl =
      rawProfile.profile ||
      rawProfile.profile_url ||
      rawProfile.public_profile_url ||
      (rawProfile.vanityName
        ? `https://www.linkedin.com/in/${rawProfile.vanityName}`
        : null);

    const user = {
      linkedin_id: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value || null,
      linkedin_url: linkedinUrl,
    };

    done(null, user);
  }
}
