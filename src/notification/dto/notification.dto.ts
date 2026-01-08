import { ApiProperty } from '@nestjs/swagger';
import {IsString,IsEnum,IsOptional, IsBoolean} from 'class-validator';

export enum NotificationTarget {
  ALL_CONSULTANT = 'All consultant',
  CUSTOM_CONSULTANT = 'custom consultant',
  CUSTOM_CLIENT = 'custom client',
}

export class NotificationDto {

  @ApiProperty({example: 'Project Update',})
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({example: 'New project has been assigned',})
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({example: 'Project',})
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    enum: NotificationTarget,
    example: NotificationTarget.ALL_CONSULTANT,
  })
  @IsEnum(NotificationTarget)
  @IsOptional()
  target?: NotificationTarget;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  action?: boolean;
}
