import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString, IsArray, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetClientConsultantsQueryDto {
  @ApiPropertyOptional({ description: 'Core module IDs for filtering consultants', type: [Number] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value ? value.map(Number) : [])
  modules?: number[];

  @ApiPropertyOptional({ description: 'Minimum consultant experience' })
  @IsOptional()
  @IsNumberString()
  experience?: number;

  @ApiPropertyOptional({ description: 'Return consultants with available hours less than this value' })
  @IsOptional()
  @IsNumberString()
  availability?: number;

  @ApiPropertyOptional({ description: 'Minimum consultant hourly rate' })
  @IsOptional()
  @IsNumberString()
  budgetMin?: number;

  @ApiPropertyOptional({ description: 'Maximum consultant hourly rate' })
  @IsOptional()
  @IsNumberString()
  budgetMax?: number;

  @ApiPropertyOptional({ description: 'Country search text' })
  @IsOptional()
  @IsString()
  country?: string;
}
