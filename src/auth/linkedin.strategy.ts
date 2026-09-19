import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-openidconnect';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(
  Strategy,
  'linkedin',
) {
  constructor() {
    const clientID = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const callbackURL = process.env.LINKEDIN_CALLBACK_URL;

    if (!clientID) {
      throw new Error('LINKEDIN_CLIENT_ID is missing');
    }

    if (!clientSecret) {
      throw new Error('LINKEDIN_CLIENT_SECRET is missing');
    }

    if (!callbackURL) {
      throw new Error('LINKEDIN_CALLBACK_URL is missing');
    }

    console.log('LinkedIn Strategy initialized');
    console.log('LinkedIn callback URL:', callbackURL);

    super({
      issuer: 'https://www.linkedin.com/oauth',

      authorizationURL:
        'https://www.linkedin.com/oauth/v2/authorization',

      tokenURL:
        'https://www.linkedin.com/oauth/v2/accessToken',

      userInfoURL:
        'https://api.linkedin.com/v2/userinfo',

      clientID,
      clientSecret,
      callbackURL,

      scope: ['openid', 'profile', 'email'],
    });
  }

  async validate(
    issuer: string,
    profile: any,
    done: (error: unknown, user?: any) => void,
  ) {
    try {
      console.log('LinkedIn Strategy validate called');

      const rawProfile = profile?._json || {};

      const linkedinUrl =
        rawProfile.profile ||
        rawProfile.profile_url ||
        rawProfile.public_profile_url ||
        (rawProfile.vanityName
          ? `https://www.linkedin.com/in/${rawProfile.vanityName}`
          : null);

      const user = {
        linkedin_id: profile?.id || rawProfile?.sub,
        name:
          profile?.displayName ||
          rawProfile?.name ||
          null,
        email:
          profile?.emails?.[0]?.value ||
          rawProfile?.email ||
          null,
        linkedin_url: linkedinUrl,
      };

      return done(null, user);
    } catch (error) {
      console.error('LinkedIn validation error:', error);

      return done(error);
    }
  }
}
