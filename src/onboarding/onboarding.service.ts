import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'models/user.model';
import { ONBOARDING_STEPS, NEXT_STEP, OnboardingStep } from 'constant/onboarding';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async getStatus(userId: number) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    return {
      status: user.onboarding_status,
      currentStep: user.onboarding_step,
      startedAt: user.onboarding_started_at,
      completedAt: user.onboarding_completed_at,
    };
  }

  async advanceStep(userId: number, step: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');
  
    if (user.onboarding_status === 'completed') {
      throw new BadRequestException('Onboarding already completed');
    }
  
    const requestedIndex = ONBOARDING_STEPS.indexOf(step as OnboardingStep);
    if (requestedIndex === -1) {
      throw new BadRequestException('Invalid step');
    }
  
    // Same step again = no-op (FE may retry / remount)
    if (user.onboarding_step === step) {
      return this.getStatus(userId);
    }
  
    // Only allow moving forward (never jump backwards).
    if (user.onboarding_step) {
      const currentIndex = ONBOARDING_STEPS.indexOf(
        user.onboarding_step as OnboardingStep,
      );
      if (currentIndex !== -1 && requestedIndex < currentIndex) {
        throw new BadRequestException(
          `Cannot go back to "${step}" from "${user.onboarding_step}"`,
        );
      }
    }
  
    const updates: Partial<User> = {
      onboarding_step: step,
      onboarding_status: 'in_progress',
    };
  
    if (!user.onboarding_started_at) {
      updates.onboarding_started_at = new Date();
    }
  
    // Do NOT auto-complete on my_profile (or any last step).
    // POST /onboarding/complete → complete() handles that.
  
    await user.update(updates);
  
    return this.getStatus(userId);
  }
  
  async complete(userId: number) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');
  
    if (user.onboarding_status === 'completed') {
      throw new BadRequestException('Onboarding already completed');
    }
  
    if (user.onboarding_step !== 'my_profile') {
      throw new BadRequestException(
        `Cannot complete onboarding from step "${user.onboarding_step}"`,
      );
    }
  
    await user.update({
      onboarding_step: 'my_profile',
      onboarding_status: 'completed',
      onboarding_completed_at: new Date(),
    });
  
    return this.getStatus(userId);
  }

  async getFeatureTour(userId: number, key: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    const tour = user.feature_tours?.[key];
    return tour ?? { status: 'not_started' };
  }

  async updateFeatureTour(userId: number, key: string, status: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    const feature_tours = {
      ...user.feature_tours,
      [key]: {
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      },
    };

    await user.update({ feature_tours });

    return feature_tours[key];
  }
}