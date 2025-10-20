import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateProjectSummaryDto {
  @IsNumber()
  project_id: number;

  @IsOptional()
  @IsString()
  summary?: string;
}
