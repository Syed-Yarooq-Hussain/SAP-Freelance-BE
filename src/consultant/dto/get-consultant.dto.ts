import { ApiProperty } from '@nestjs/swagger';

export class GetConsultantDto {
  @ApiProperty({ example: 1, description: 'Unique ID of the consultant' })
  id: number;

  @ApiProperty({ example: 'Alice Khan', description: 'Name of the consultant' })
  name: string;

  @ApiProperty({ example: 'alice@example.com', description: 'Email address of the consultant' })
  email: string;

  @ApiProperty({ example: 'Frontend Developer', description: 'Expertise or role of the consultant' })
  expertise: string;
  password: string;
}