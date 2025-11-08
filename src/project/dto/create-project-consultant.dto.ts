import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { ConsultantLevel, ConsultantStatus } from 'constant/enums';

export class CreateProjectConsultantDto {
  
  @ApiProperty({
    description: 'Consultant ID',
    example: 202,
  })
  @IsNumber()
  consultant_id: number;

  @ApiProperty({
    description: 'Consultant requested hours',
    example: 'active',
    required: true,
  })
  @IsOptional()
  @IsString()
  requested_hours: number;
}


export class UpdateProjectConsultantStatusDto {
  
  @ApiProperty({description: 'Consultant ID',  })
  @IsNumber()
  consultant_id: number;

  @ApiProperty({description: 'Project ID',  })
  @IsNumber()
  project_id: number;

  @ApiProperty({
    description: 'Consultant requested hours',
    example: 'active',
    required: true,
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Set role for the consultant in the project',
    example: 'Junior',  })
  @IsOptional()
  @IsString()
  role?: string;
}


export class UpdateProjectConsultantRoleDto {
  
  @ApiProperty({description: 'Consultant ID',  })
  @IsNumber()
  consultant_id: number;

  @ApiProperty({description: 'Project ID',  })
  @IsNumber()
  project_id: number;

  @ApiProperty({
    description: 'Consultant requested hours',
    example: 'active',
    required: true,
  })

  @ApiProperty({
    description: 'Set status for the consultant in the project',
    example: 'Accepted',
    enum: ConsultantStatus 
  })
  @IsEnum(ConsultantStatus, { message: `role must be one of: ${Object.values(ConsultantStatus).join(', ')}` })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Set role for the consultant in the project',
    example: 'Junior',
    enum: ConsultantLevel 
   })
  @IsEnum(ConsultantLevel, { message: `role must be one of: ${Object.values(ConsultantLevel).join(', ')}` })
  @IsOptional()
  @IsString()
  role?: string;
}
