import { IsOptional, IsString } from 'class-validator';

export class CreateProjectSummaryDto {
  project_id: number;

  @IsOptional()
  @IsString()
  summary?: string;
}
