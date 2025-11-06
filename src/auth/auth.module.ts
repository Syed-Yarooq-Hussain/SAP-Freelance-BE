import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.stretegy';
import { User } from '../../models/user.model';
import { ProjectDetail } from '../../models/project-detail.model';
import { UserRepository } from '../../repository/user.repository';
import { ConsultantModule } from '../consultant/consultant.module'; 

@Module({
  imports: [
    SequelizeModule.forFeature([User, ProjectDetail]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
    ConsultantModule, 
  ],

  controllers: [AuthController],
  providers: [
    AuthService,               
    JwtStrategy,                
    UserRepository,              
  ],
  exports: [
    AuthService, 
    JwtStrategy,                
  ],
})
export class AuthModule {}
