import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumberString, IsString } from 'class-validator';

export class GetConsultantsQueryDto {
  @ApiPropertyOptional({
   description: 'Comma separated statuses (e.g. shortlisted,interview_done,rejected)',
   type: String,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Search by consultant name or contact' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Module ID for filtering' })
  @IsOptional()
  @IsNumberString()
  module_id?: number;

  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  @IsNumberString()
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page' })
  @IsOptional()
  @IsNumberString()
  limit?: number;
}
