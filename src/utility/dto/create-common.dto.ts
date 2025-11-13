import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommonDto {
  @ApiProperty({ description: 'Name of the common entry' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the common entry', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Priority of the common entry', required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;
}
