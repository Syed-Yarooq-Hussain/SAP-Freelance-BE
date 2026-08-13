import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateModuleRequestDto {
  @ApiProperty({ example: 'SAP Transportation Management' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 123 })
  @IsInt()
  user_id: number;
}
