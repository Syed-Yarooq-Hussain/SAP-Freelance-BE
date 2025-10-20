import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';

export class CreateProjectConsultantDto {
  @ApiProperty({
    description: 'Project ID',
    example: 101,
  })
  @IsNumber()
  project_id: number;

  @ApiProperty({
    description: 'Consultant ID',
    example: 202,
  })
  @IsNumber()
  consultant_id: number;

  @ApiProperty({
    description: 'Consultant ka status (e.g. active, pending)',
    example: 'active',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'NDA (Non-Disclosure Agreement) ka link',
    example: 'https://example.com/nda.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  nda_link?: string;

  @ApiProperty({
    description: 'Consultant ne NDA sign kiya ya nahi',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  consultant_sign?: boolean;

  @ApiProperty({
    description: 'Contract ka link',
    example: 'https://example.com/contract.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  contract_link?: string;

  @ApiProperty({
    description: 'Client ne contract sign kiya ya nahi',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  client_sign?: boolean;
}
