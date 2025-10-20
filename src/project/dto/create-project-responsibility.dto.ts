import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateProjectResponsibilityDto {
  @IsNumber()
  project_id: number;

  @IsString()
  area: string;

  @IsString()
  task: string;

  @IsOptional()
  @IsNumber()
  responsible?: number;

  @IsOptional()
  @IsNumber()
  accountable?: number;

  @IsOptional()
  @IsNumber()
  consulted?: number;

  @IsOptional()
  @IsNumber()
  informed?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
