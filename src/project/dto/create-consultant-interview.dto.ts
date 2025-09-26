import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateConsultantInterviewDto {
  project_id: number;
  consultant_id: number;

  @IsDateString()
  interview_date: string;

  @IsNotEmpty()
  start_time: string;

  @IsNotEmpty()
  end_time: string;
}
