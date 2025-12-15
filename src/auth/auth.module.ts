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
import { ConsultantModule } from '../../models/consultant-module.model';
import { ConsultantModule as ConsultantModuleImport } from '../consultant/consultant.module'; 
import { ConsultantModuleRepository } from 'repository/consultant-module.repository';

@Module({
  imports: [
    SequelizeModule.forFeature([User, ProjectDetail, ConsultantModule]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }), 
    ConsultantModuleImport
  ],

  controllers: [AuthController],
  providers: [
    AuthService,               
    JwtStrategy,                
    UserRepository, 
    ConsultantModuleRepository             
  ],
  exports: [
    AuthService, 
    JwtStrategy,                
  ],
})
export class AuthModule {}
