import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ConsultantLevel, ConsultantStatus } from 'constant/enums';

export class CreateProjectConsultantDto {
  
  @ApiProperty({
    description: 'Consultant ID',
    example: 202,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  consultant_id: number;

  @ApiProperty({
    description: 'Consultant requested hours',
    example: 'active',
    required: true,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  requested_hours: number;
}

export class UpdateProjectConsultantStatusDto {
  @ApiProperty({ description: 'Consultant ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  consultant_id: number;

  @ApiProperty({ description: 'Project ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  project_id: number;

  @ApiProperty({
    description: 'Consultant requested hours',
    example: 'active',
    required: true,
  })
  @IsEnum(ConsultantStatus)
  status: ConsultantStatus;

  @ApiProperty({ description: 'Negotiated hourly rate', required: false, example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  decided_rate?: number;

  @ApiProperty({ description: 'Rate basis in the consultant currency; defaults to agreed base rate', enum: ['base', 'client'], required: false })
  @IsOptional()
  rate_basis?: 'base' | 'client';

  @ApiProperty({ description: 'Allocated weekly hours', required: false, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  requested_hours?: number;

  @ApiProperty({
    description: 'Set role for the consultant in the project',
    example: 'Junior',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({
    description: 'Booking schedule for the consultant (optional)',
    example: { weekdays: [{ day: 'Monday', start: '09:00', end: '17:00', active: true }] },
    required: false,
    type: Object,
  })
  @IsOptional()
  booking_schedule?: any;
}

export class UpdateProjectConsultantRoleDto {

  @ApiProperty({ description: 'Consultant ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  consultant_id: number;

  @ApiProperty({ description: 'Project ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  project_id: number;

  @ApiProperty({
    description: 'Set role for the consultant in the project',
    example: ConsultantLevel.SENIOR,
    enum: ConsultantLevel 
   })
  @IsEnum(ConsultantLevel, { message: `role must be one of: ${Object.values(ConsultantLevel).join(', ')}` })
  @IsOptional()
  role?: ConsultantLevel;

  @ApiProperty({ description: 'Booking schedule', required: false, type: Object })
  @IsOptional()
  booking_schedule?: any;
}
