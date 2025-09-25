import { IsString, IsOptional, IsDate } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  client_id: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDate()
  start_date?: Date;

  @IsOptional()
  @IsDate()
  end_date?: Date;
}
