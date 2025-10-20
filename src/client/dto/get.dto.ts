import { ApiProperty } from '@nestjs/swagger';

export class GetClientDto {
  @ApiProperty({ example: 1, description: 'Unique ID of the client' })
  id: number;

  @ApiProperty({ example: 'Client A', description: 'Name of the client' })
  name: string;

  @ApiProperty({ example: 'client@example.com', description: 'Email of the client' })
  email: string;
}
