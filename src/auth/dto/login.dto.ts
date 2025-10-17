import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
