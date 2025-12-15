import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConsultantDto {
  @ApiProperty({ example: 'Alice Khan', description: 'The name of the consultant' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'alice@example.com', description: 'The email of the consultant' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Frontend Developer', description: 'The area of expertise of the consultant' })
  @IsString()
  @IsNotEmpty()
  expertise: string;

  @ApiProperty({ example: 'strongPassword123', description: 'Password for consultant account' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 1, description: 'User ID associated with this consultant (optional)' })
  user?: any;
}
