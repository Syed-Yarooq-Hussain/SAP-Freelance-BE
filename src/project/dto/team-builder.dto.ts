import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConsultantLevel } from 'constant/enums';

export class TeamBuilderRoleDto {
  @ApiProperty({ example: 'f13d1d8f-cd50-40e7-bce4-e3ea585a05b5' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @Matches(/\S/)
  id: string;

  @ApiProperty({ enum: ConsultantLevel, example: 'senior' })
  @IsEnum(ConsultantLevel)
  title: ConsultantLevel;

  @ApiProperty({ type: [String], example: ['202'] })
  @IsArray()
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[1-9]\d*$/, { each: true })
  personIds: string[];

  @ApiProperty({ type: String, nullable: true, example: null })
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  parentId: string | null;

  @ApiProperty({ example: true })
  @IsBoolean()
  placed: boolean;
}

export class TeamBuilderMemberDto {
  @ApiProperty({ example: 202 })
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  consultant_id: number;

  @ApiProperty({ example: 16 })
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  requested_hours: number;
}

export class SaveTeamBuilderDto {
  @ApiProperty({ example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  @Max(2147483646)
  revision: number;

  @ApiProperty({ type: [TeamBuilderRoleDto], maxItems: 500 })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => TeamBuilderRoleDto)
  roles: TeamBuilderRoleDto[];

  @ApiProperty({ type: [TeamBuilderMemberDto], maxItems: 500 })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => TeamBuilderMemberDto)
  consultants: TeamBuilderMemberDto[];
}

export const teamBuilderResponseSchema = {
  example: {
    code: 200,
    status: 'success',
    message: 'Team builder loaded',
    data: {
      revision: 1,
      roles: [
        {
          id: 'f13d1d8f-cd50-40e7-bce4-e3ea585a05b5',
          title: 'senior',
          personIds: ['202'],
          parentId: null,
          placed: true,
        },
      ],
      consultants: [
        {
          id: 202,
          name: 'Example Consultant',
          modules: { core: 'FI', others: 'CO' },
          experience: 8,
          rate: 100,
          currency: 'USD',
          weekly_available_hours: 40,
          requested_hours: 16,
        },
      ],
    },
  },
};
