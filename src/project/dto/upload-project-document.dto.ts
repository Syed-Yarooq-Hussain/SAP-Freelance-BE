import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class UploadProjectDocumentDto {
  @ApiPropertyOptional({
    description: 'Project ID. Optional when using /projects/:id/documents/upload',
  })
  @IsOptional()
  @IsNumberString()
  project_id?: number;

  @ApiProperty({ description: 'Consultant user ID' })
  @IsNotEmpty()
  @IsNumberString()
  user_id: number;

  @ApiProperty({ description: 'Document type' })
  @IsNotEmpty()
  @IsString()
  type: string;
}
