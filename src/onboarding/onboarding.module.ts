import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { User } from 'models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}