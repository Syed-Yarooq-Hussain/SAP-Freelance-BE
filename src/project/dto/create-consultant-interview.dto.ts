import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateConsultantInterviewDto {
  @ApiProperty({
    description: 'Project ID jisme interview scheduled hai',
    example: 101,
  })
  @IsNumber()
  @IsNotEmpty()
  project_id: number;

  @ApiProperty({
    description: 'Consultant ka ID jiska interview hai',
    example: 202,
  })
  @IsNumber()
  @IsNotEmpty()
  consultant_id: number;

  @ApiProperty({
    description: 'Interview ki date (ISO format)',
    example: '2025-10-20',
  })
  @IsDateString()
  @IsNotEmpty()
  interview_date: string;

  @ApiProperty({
    description: 'Interview start time',
    example: '10:00 AM',
  })
  @IsNotEmpty()
  start_time: string;

  @ApiProperty({
    description: 'Interview end time',
    example: '11:00 AM',
  })
  @IsNotEmpty()
  end_time: string;
}
