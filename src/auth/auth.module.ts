import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.stretegy';
import { User } from '../../models/user.model';
import { ProjectDetail } from '../../models/project-detail.model';
import { UserRepository } from '../../repository/user.repository';
import { ConsultantModule } from '../../models/consultant-module.model';
import { ConsultantModule as ConsultantModuleImport } from '../consultant/consultant.module'; 
import { ConsultantModuleRepository } from 'repository/consultant-module.repository';
import { LinkedInStrategy } from './linkedin.strategy';
import { SessionSerializer } from './session.serializer';
import { LinkedInTimezoneMiddleware } from './linkedin-timezone.middleware';

@Module({
  imports: [
    SequelizeModule.forFeature([User, ProjectDetail, ConsultantModule ]),
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mysecret',
      signOptions: { expiresIn: '1d' },
    }), 
    ConsultantModuleImport
  ],

  controllers: [AuthController],
  providers: [
    AuthService,               
    JwtStrategy,                
    UserRepository, 
    ConsultantModuleRepository,
    LinkedInStrategy,
    SessionSerializer,
    LinkedInTimezoneMiddleware,
  ],
  exports: [
    AuthService, 
    JwtStrategy,                
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LinkedInTimezoneMiddleware).forRoutes({
      path: 'auth/linkedin',
      method: RequestMethod.GET,
    });
  }
}
