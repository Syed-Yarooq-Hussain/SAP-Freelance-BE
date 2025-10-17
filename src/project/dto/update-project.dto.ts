import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({
    description: 'Project ka unique ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiPropertyOptional({
    description: 'Project ka naam',
    example: 'AI Dashboard Redesign',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Client ka ID',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  client_id?: number;

  @ApiPropertyOptional({
    description: 'Project ka status (e.g. active, completed)',
    example: 'active',
  })
  @IsOptional()
  @IsString()
  status?: string;

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
}
