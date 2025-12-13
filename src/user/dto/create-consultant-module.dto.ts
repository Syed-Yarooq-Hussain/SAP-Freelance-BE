import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateConsultantModuleDto {
  @IsString()
  id: number;

  @IsOptional()
  @IsString()
  module_id?: number;

  @IsOptional()
  @IsNumber()
  user_id: number;
  
  @IsOptional()
  @IsNumber()
  is_primary: boolean;
}
