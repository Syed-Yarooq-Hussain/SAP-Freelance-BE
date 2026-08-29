import { IsIn } from 'class-validator';

export class UpdateFeatureTourDto {
  @IsIn(['in_progress', 'completed'])
  status: string;
}