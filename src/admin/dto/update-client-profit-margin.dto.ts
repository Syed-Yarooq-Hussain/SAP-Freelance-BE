import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateClientProfitMarginDto {
  @ApiProperty({
    description: 'Whole-number percentage added to consultant hourly rates',
    example: 20,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  profit_margin_percentage: number;
}
