import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class DecideModuleRequestDto {
  @ApiProperty({ example: true, nullable: false })
  @IsBoolean()
  is_accepted: boolean;
}
