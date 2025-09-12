import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../../models/user.model';
import { ConsultantDetail } from '../../models/consultant-detail.model';
import { UserRepository } from '../../repository/user.repository';
import { ConsultantDetailRepository } from '../../repository/consultant-detail.repository';

@Module({
  imports: [
    SequelizeModule.forFeature([User, ConsultantDetail]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, ConsultantDetailRepository],
})
export class AuthModule {}
