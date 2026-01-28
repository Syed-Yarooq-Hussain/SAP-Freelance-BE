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


export interface UpdateConsultantDetailDto {
  user?: {
    username?: string;
    email?: string;
    password?: string;
    phone?: string;
    city?: string;
    country?: string;
    currency?: string;
  };
  consultant?: {
    experience?: number;
    rate?: number;
    weekly_available_hours?: number;
    level?: string;
    working_schedule?: {
      weekly: {
        day: string;
        slot?: { start: string; end: string }[];
        active: boolean;
      }[];
      custom?: any[];
    };
    module?: any; 
    core_module?: number[];
    other_module?: number[];
    cv_url?: string;
    clients_summary?: string;
    skills?: string[];
    work_experiences?: {
      company_name: string;
      position: string;
      start_date: string;
      end_date: string;
      responsibilities?: string[];
    }[];
    education?: {
      degree: string;
      institution_name: string;
      start_date: string;
      end_date: string;
      details?: any[];
    }[];
    certification?: any[];
    languages?: string[];
    career_details?: any;
  };
}

