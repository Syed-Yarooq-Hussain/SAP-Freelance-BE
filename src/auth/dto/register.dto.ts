import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'Password (minimum 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: '+923001234567',
    description: 'Phone number of the user (optional)',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'Karachi',
    description: 'City of the user (optional)',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    example: 'Pakistan',
    description: 'Country of the user (optional)',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: 'USD',
    description: 'Preferred currency of the user (optional)',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
