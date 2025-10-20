import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDate, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project ka naam',
    example: 'AI Freelancer Portal',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Client ka ID jiska ye project hai',
    example: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  client_id: number;

  @ApiProperty({
    description: 'Project ka status (e.g. ongoing, completed)',
    example: 'ongoing',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Project ka start date',
    example: '2025-10-16',
    required: false,
  })
  @IsOptional()
  @IsDate()
  start_date?: Date;

  @ApiProperty({
    description: 'Project ka end date',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDate()
  end_date?: Date;
}
