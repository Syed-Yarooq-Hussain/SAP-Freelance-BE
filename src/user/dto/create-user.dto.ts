import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsInt,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsInt()
  @IsNotEmpty()
  role: number; // 1=Admin, 2=Client, 3=Consultant

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsInt()
  status: number;
}
