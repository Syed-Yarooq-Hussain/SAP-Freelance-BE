export const ONBOARDING_STEPS = [
  'dashboard',
  'profile',
  'calendar',
  'my_profile',
] as const;
export type OnboardingStep = typeof ONBOARDING_STEPS[number];

export const NEXT_STEP: Record<OnboardingStep, OnboardingStep | 'completed'> = {
  dashboard: 'profile',
  profile: 'calendar',
  calendar: 'my_profile',
  my_profile: 'completed',
};
