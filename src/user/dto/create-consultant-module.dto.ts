import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateConsultantModuleDto {
  @IsString()
  module_name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  user_id: number;
}
