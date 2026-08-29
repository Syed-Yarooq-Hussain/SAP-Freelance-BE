import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { UpdateOnboardingStepDto } from './dto/update-onboarding-step.dto';
import { UpdateFeatureTourDto } from './dto/update_feature_tour.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // adjust to your existing guard

@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  getStatus(@Req() req: any) {
    return this.onboardingService.getStatus(req.user.id);
  }

  @Patch('step')
  advanceStep(@Req() req: any, @Body() dto: UpdateOnboardingStepDto) {
    return this.onboardingService.advanceStep(req.user.id, dto.step);
  }

  @Post('complete')
  complete(@Req() req: any) {
    return this.onboardingService.complete(req.user.id);
  }

  @Get('tours/:key')
  getFeatureTour(@Req() req: any, @Param('key') key: string) {
    return this.onboardingService.getFeatureTour(req.user.id, key);
  }

  @Patch('tours/:key')
  updateFeatureTour(
    @Req() req: any,
    @Param('key') key: string,
    @Body() dto: UpdateFeatureTourDto,
  ) {
    return this.onboardingService.updateFeatureTour(req.user.id, key, dto.status);
  }
}