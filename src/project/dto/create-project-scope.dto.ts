import { IsString, IsOptional } from 'class-validator';

export class CreateProjectScopeDto {
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
