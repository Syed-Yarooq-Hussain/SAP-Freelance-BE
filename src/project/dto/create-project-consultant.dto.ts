import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateProjectConsultantDto {
  project_id: number;
  consultant_id: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  nda_link?: string;

  @IsOptional()
  @IsBoolean()
  consultant_sign?: boolean;

  @IsOptional()
  @IsString()
  contract_link?: string;

  @IsOptional()
  @IsBoolean()
  client_sign?: boolean;
}
