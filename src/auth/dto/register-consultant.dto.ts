import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterConsultantDto {
  @ApiProperty({
    example: 'consultant@example.com',
    description: 'Consultant email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'Jane Consultant',
    description: 'Full name of the consultant',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @ApiProperty({
    example: 'consultingExpert#2025',
    description: 'Password (minimum 6 characters)',
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    example: 'AI & Full Stack Development',
    description: 'Consultant expertise area',
  })
  @IsString({ message: 'Expertise must be a string' })
  @IsNotEmpty({ message: 'Expertise cannot be empty' })
  expertise: string;
}
