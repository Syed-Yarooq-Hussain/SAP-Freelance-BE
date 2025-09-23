import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.stretegy';
import { User } from '../../models/user.model';
import { ConsultantDetail } from '../../models/consultant-detail.model';
import { UserRepository } from '../../repository/user.repository';
import { ConsultantDetailRepository } from '../../repository/consultant-detail.repository';

@Module({
  imports: [
    SequelizeModule.forFeature([User, ConsultantDetail]),
    PassportModule.register({ defaultStrategy: 'jwt' }), // ✅ Register JWT strategy
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    ConsultantDetailRepository,
    JwtStrategy, // ✅ Add JwtStrategy
  ],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
