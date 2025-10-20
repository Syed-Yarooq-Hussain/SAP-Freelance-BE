import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDto } from './create-client.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiPropertyOptional({ example: 'Updated Name', description: 'Updated client name' })
  name?: string;

  @ApiPropertyOptional({ example: 'updated@example.com', description: 'Updated client email' })
  email?: string;
}
