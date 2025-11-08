import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsInt } from 'class-validator';

export class CreateProjectTaskDto {
  @ApiProperty({ example: 'Design Landing Page' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Create responsive landing page with animations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 3, description: 'User ID of the assignee' })
  @IsOptional()
  @IsNumber()
  assignee_id?: number;

  @ApiPropertyOptional({ example: 40, description: 'Estimated required hours' })
  @IsOptional()
  @IsInt()
  required_hours?: number;

  // 🆕 Optional milestone and project for relocation
  @ApiPropertyOptional({ example: 5, description: 'Milestone ID (for relocation)' })
  @IsOptional()
  @IsNumber()
  project_milestone_id?: number;

  @ApiPropertyOptional({ example: 2, description: 'Project ID (auto-updated if milestone changes)' })
  @IsOptional()
  @IsNumber()
  project_id?: number;
}

export class UpdateProjectTaskDto extends PartialType(CreateProjectTaskDto) {}
