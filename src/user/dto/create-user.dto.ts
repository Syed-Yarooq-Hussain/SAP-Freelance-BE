import { ApiProperty } from '@nestjs/swagger';
import {IsEmail,IsNotEmpty,IsOptional,IsString,MinLength,IsNumber,} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({
    description: 'User ka full name',
    example: 'Abdul Haseeb',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    description: 'Valid email address',
    example: 'haseeb@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Password (minimum 6 characters)',
    example: 'strongPassword123',
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({
    description: 'Optional phone number',
    example: '+92 300 1234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Optional user role (1 = user, 2 = admin)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Role must be a number' })
  @Type(() => Number)
  role?: number;
}
