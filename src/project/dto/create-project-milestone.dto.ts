import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateProjectMilestoneDto {
  @IsNumber()
  project_id: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  expected_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  owner?: number;

  @IsOptional()
  @IsString()
  dependencies?: string;

  @IsOptional()
  @IsBoolean()
  approval?: boolean;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
