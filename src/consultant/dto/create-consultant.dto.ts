import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConsultantDto {
  @ApiProperty({ example: 'Alice Khan', description: 'The name of the consultant' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'alice@example.com', description: 'The email of the consultant' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Frontend Developer', description: 'The role or expertise of the consultant' })
  @IsString()
  @IsNotEmpty()
  expertise: string;
}
