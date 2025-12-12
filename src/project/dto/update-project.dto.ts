import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  
  @ApiPropertyOptional({
    description: 'Project name',
    example: 'AI Dashboard Redesign',
  })
  @IsOptional()
  @IsString()
  name?: string;


  @ApiPropertyOptional({
    description: 'Project status (e.g. active, completed)',
    example: 'active',
  })
  @IsOptional()
  @IsString()
  status?: string;
  
  
  @ApiPropertyOptional({
    description: 'Project ka status (e.g. active, completed)',
    example: 'active',
  })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiPropertyOptional({
    description: 'Project start date',
    example: '2025-10-16',
  })
  @IsOptional()
  @IsDate()
  start_date?: Date;

  @ApiPropertyOptional({
    description: 'Project end date',
    example: '2026-01-31',
  })
  @IsOptional()
  @IsDate()
  end_date?: Date;
  
  @ApiPropertyOptional({
    description: 'Duration of the project in hours',
    example: '650',
  })
  @IsOptional()
  @IsDate()
  duration?: string;

  @ApiPropertyOptional({
    description: 'Cost of the project',
    example: 45000,
  })
  @IsOptional()
  @IsDate()
  cost?: number;

  @ApiPropertyOptional({
    description: 'Amount paid for the project',
    example: 45000,
  })
  @IsOptional()
  @IsDate()
  paid_amount?: number;
}
