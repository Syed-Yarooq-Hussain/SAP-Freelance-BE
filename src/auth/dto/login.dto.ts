import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsTimeZone } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered email address of the user',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'Password used during registration',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  password: string;

  @ApiPropertyOptional({
    example: 'Europe/Berlin',
    description: 'Current IANA timezone. When omitted, the saved timezone is unchanged.',
  })
  @IsOptional()
  @IsString()
  @IsTimeZone({ message: 'Timezone must be a valid IANA timezone, e.g. Europe/Berlin' })
  timezone?: string;
}
