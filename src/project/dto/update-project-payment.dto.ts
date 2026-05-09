import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProjectPaymentDto {
  @ApiPropertyOptional({ description: 'Project ID' })
  @IsOptional()
  @IsNumber()
  project_id?: number;

  @ApiPropertyOptional({ description: 'Project milestone ID' })
  @IsOptional()
  @IsNumber()
  project_milestone_id?: number;

  @ApiPropertyOptional({ description: 'Document ID' })
  @IsOptional()
  @IsNumber()
  doc_id?: number;

  @ApiPropertyOptional({ description: 'Payment amount' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Payment module' })
  @IsOptional()
  @IsString()
  payment_module?: string;

  @ApiPropertyOptional({ description: 'Whether payment is paid' })
  @IsOptional()
  @IsBoolean()
  is_paid?: boolean;
}
