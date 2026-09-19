import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class MilestoneAllocationDto {
  @Transform(({ value }) =>
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value,
  )
  @IsInt()
  @Min(1)
  @Max(2147483647)
  consultant_id: number;

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100000)
  hours: number;
}

export class SaveMilestoneTeamDto {
  @IsInt()
  @Min(0)
  @Max(2147483647)
  revision: number;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MilestoneAllocationDto)
  allocations: MilestoneAllocationDto[];
}
