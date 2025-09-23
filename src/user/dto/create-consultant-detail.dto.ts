import { IsString, IsNotEmpty, IsInt, IsUrl, IsJSON } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class CreateConsultantDetailDto extends CreateUserDto {
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
