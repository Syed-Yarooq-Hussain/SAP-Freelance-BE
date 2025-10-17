import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterConsultantDto {
  @ApiProperty({
    example: 'consultant@example.com',
    description: 'Consultant email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Jane Consultant',
    description: 'Full name of the consultant',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'consultingExpert#2025',
    description: 'Password (minimum 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'AI & Full Stack Development',
    description: 'Consultant expertise area',
  })
  @IsString()
  @IsNotEmpty()
  expertise: string;
}
