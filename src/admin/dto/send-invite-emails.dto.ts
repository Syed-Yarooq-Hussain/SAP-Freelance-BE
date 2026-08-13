import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendInviteEmailsDto {
  @ApiProperty({
    example: 'consultant1@example.com, consultant2@example.com',
    description: 'Comma-separated recipient email addresses',
  })
  @IsString()
  @IsNotEmpty()
  emails: string;
}
