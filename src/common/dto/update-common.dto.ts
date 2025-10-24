import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCommonDto {
  @ApiPropertyOptional({ description: 'Name of the common entry' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the common entry' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Priority of the common entry' })
  @IsOptional()
  @IsNumber()
  priority?: number;
  id: number;
}
