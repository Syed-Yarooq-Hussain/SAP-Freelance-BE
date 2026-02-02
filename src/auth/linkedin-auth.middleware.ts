import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as passport from 'passport';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      logIn?: (user: any, callback: (err?: Error) => void) => void;
    }
  }
}

@Injectable()
export class LinkedinAuthMiddleware implements NestMiddleware {
  private logger = new Logger('LinkedinAuthMiddleware');

  use(req: Request, res: Response, next: NextFunction) {
    // Only handle LinkedIn callback
    if (req.path !== '/auth/linkedin/callback') {
      return next();
    }

    this.logger.log('🔵 LinkedIn callback middleware triggered');
    this.logger.log('📋 Request details:');
    this.logger.log('   Path:', req.path);
    this.logger.log('   Query:', req.query);
    this.logger.log('   Method:', req.method);
    this.logger.log('   URL:', req.originalUrl);

    try {
      // Create a custom callback for passport
      const callback = (err: any, user: any, info: any) => {
        try {
          this.logger.log('📋 Passport callback executed');
          
          if (err) {
            this.logger.error('❌ Passport error occurred:', {
              message: err.message,
              name: err.name,
              statusCode: err.statusCode,
              error: err,
            });
            req.user = undefined;
          } else if (!user) {
            this.logger.warn('⚠️  No user returned from Passport');
            this.logger.log('Info:', info);
            req.user = undefined;
          } else {
            this.logger.log('✅ User authenticated successfully:', {
              linkedin_id: user.linkedin_id,
              email: user.email,
              name: user.name,
            });
            req.user = user;
          }
          
          // Continue to next middleware/controller
          next();
        } catch (callbackError) {
          this.logger.error('❌ Error in callback:', callbackError);
          next(callbackError);
        }
      };

      // Get the LinkedIn strategy's authenticate method
      const authenticate = passport.authenticate('linkedin', { 
        session: false,
        failWithError: true,
      });

      // Call it as a middleware
      this.logger.log('🔵 Calling passport.authenticate()');
      authenticate(req, res, callback);
    } catch (error) {
      this.logger.error('❌ Middleware exception:', {
        message: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }
}
