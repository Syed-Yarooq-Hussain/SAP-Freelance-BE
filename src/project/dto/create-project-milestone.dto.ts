import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsDate } from 'class-validator';

export class CreateProjectMilestoneDto {
  
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Milestone Due date',
    example: '2025-10-16',
  })
  @IsOptional()
  @IsDate()
  due_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsString()
  required_hours: number;
  
  @ApiProperty()
  @IsOptional()
  @IsString()
  project_id: number;
}
