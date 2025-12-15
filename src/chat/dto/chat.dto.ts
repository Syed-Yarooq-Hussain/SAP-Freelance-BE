import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class SendMessageDto {
  @IsNumber()
  sender_id: number;

  @IsNumber()
  @IsOptional()
  receiver_id?: number;

  @IsNumber()
  @IsOptional()
  project_id?: number;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  message_type?: string = 'text';
}

export class GetConversationDto {
  @IsNumber()
  sender_id: number;

  @IsNumber()
  receiver_id: number;

  @IsNumber()
  @IsOptional()
  limit?: number = 20;

  @IsNumber()
  @IsOptional()
  page?: number = 1;
}

export class MarkReadDto {
  @IsNumber()
  receiver_id: number;

  @IsNumber()
  sender_id: number;
}

export class DeleteMessageDto {
  @IsNumber()
  id: number;
}
