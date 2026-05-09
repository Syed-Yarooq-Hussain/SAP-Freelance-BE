import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class GetClientConsultantsQueryDto {
  @ApiPropertyOptional({ description: 'Core module ID for filtering consultants' })
  @IsOptional()
  @IsNumberString()
  module_id?: number;

  @ApiPropertyOptional({ description: 'Minimum consultant experience' })
  @IsOptional()
  @IsNumberString()
  experience?: number;

  @ApiPropertyOptional({ description: 'Return consultants with available hours less than this value' })
  @IsOptional()
  @IsNumberString()
  available_hours?: number;

  @ApiPropertyOptional({ description: 'Minimum consultant hourly rate' })
  @IsOptional()
  @IsNumberString()
  min_rate?: number;

  @ApiPropertyOptional({ description: 'Maximum consultant hourly rate' })
  @IsOptional()
  @IsNumberString()
  max_rate?: number;

  @ApiPropertyOptional({ description: 'Country search text' })
  @IsOptional()
  @IsString()
  country?: string;
}
