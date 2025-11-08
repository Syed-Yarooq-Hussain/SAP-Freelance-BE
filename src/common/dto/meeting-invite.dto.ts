import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsDateString, IsNumber, IsString, IsIn } from 'class-validator';
import { MEETING_STATUS_ARRAY } from 'constant/enums';

export class CreateMeetingDto {
  @ApiProperty({ description: 'Date and time of the meeting (ISO format)' })
  @IsDateString()
  date_time: string;

  @ApiProperty({ description: 'Array of user IDs invited to the meeting' })
  @IsArray()
  @ArrayNotEmpty()
  invitees_id: number[];

  @ApiProperty({ description: 'Duration of the meeting in minutes' })
  @IsNumber()
  duration: number;

  @ApiProperty({ description: 'Type of meeting' })
  @IsString()
  event_type: string;
}

export class UpdateMeetingStatusDto {
  @IsIn(MEETING_STATUS_ARRAY)
  status: string;
}