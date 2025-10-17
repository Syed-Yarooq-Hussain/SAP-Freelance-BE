import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateProjectScopeDto {
  @IsNumber()
  project_id: number;

  @IsString()
  type: string;

  @IsString()
  detail: string;

  @IsOptional()
  @IsString()
  document_url?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
