import { IsString, IsNotEmpty, IsInt, IsUrl, IsJSON } from 'class-validator';

export class CreateConsultantDetailDto {
  @IsString()
  @IsNotEmpty()
  module: string;

  @IsString()
  @IsNotEmpty()
  level: string;

  @IsInt()
  experience: number;

  @IsInt()
  rate: number;

  @IsInt()
  weekly_available_hours: number;

  @IsJSON()
  schedule: object;

  @IsUrl()
  cv_url: string;
}
