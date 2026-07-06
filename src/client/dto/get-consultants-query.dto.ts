import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetClientConsultantsQueryDto {
  @ApiPropertyOptional({ description: 'Core module IDs for filtering consultants', type: [Number] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (!value) return [];
    const values = Array.isArray(value) ? value : String(value).split(',');
    return values.map(Number).filter((id) => !Number.isNaN(id));
  })
  modules?: number[];

  @ApiPropertyOptional({
    name: 'modules[]',
    description: 'Core module IDs for filtering consultants',
    type: [Number],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    const values = Array.isArray(value) ? value : String(value).split(',');
    return values.map(Number).filter((id) => !Number.isNaN(id));
  })
  'modules[]'?: number[];

  @ApiPropertyOptional({ description: 'Minimum consultant experience' })
  @IsOptional()
  @IsNumberString()
  experience?: number;

  @ApiPropertyOptional({ description: 'Minimum computed available hours' })
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

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumberString()
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', default: 10 })
  @IsOptional()
  @IsNumberString()
  limit?: number;
}
