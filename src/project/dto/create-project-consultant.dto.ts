import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber } from 'class-validator';

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
