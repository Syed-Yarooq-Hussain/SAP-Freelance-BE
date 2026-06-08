import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class LogConsultantHoursDto {
  @ApiProperty({ example: 12 })
  @IsNumber()
  project_id: number;

  @ApiProperty({ example: 7 })
  @IsNumber()
  milestone_id: number;

  @ApiPropertyOptional({ example: 31, description: 'Optional task id under the milestone' })
  @IsOptional()
  @IsNumber()
  task_id?: number;

  @ApiProperty({ example: 6.5 })
  @IsNumber()
  @IsPositive()
  hours: number;

  @ApiPropertyOptional({ example: '2026-05-17' })
  @IsOptional()
  @IsDateString()
  log_date?: string;

  @ApiPropertyOptional({ example: 'Configured integration mapping and tested edge cases' })
  @IsOptional()
  @IsString()
  description?: string;
}
