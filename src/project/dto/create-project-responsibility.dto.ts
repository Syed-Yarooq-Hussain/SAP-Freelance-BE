import { IsString, IsOptional } from 'class-validator';

export class CreateProjectResponsibilityDto {
  project_id: number;

  @IsString()
  area: string;

  @IsString()
  task: string;

  @IsOptional()
  responsible?: number;

  @IsOptional()
  accountable?: number;

  @IsOptional()
  consulted?: number;

  @IsOptional()
  informed?: number;

  @IsOptional()
  status?: string;
}
