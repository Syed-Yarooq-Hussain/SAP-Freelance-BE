import { IsIn } from 'class-validator';
import { ONBOARDING_STEPS } from 'constant/onboarding';

export class UpdateOnboardingStepDto {
  @IsIn(ONBOARDING_STEPS)
  step: string;
}