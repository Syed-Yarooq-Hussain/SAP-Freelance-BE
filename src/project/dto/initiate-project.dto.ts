import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class InitiateProjectDto {
  @ApiPropertyOptional({
    description: 'Required for admins. Clients always create projects for themselves.',
    example: 123,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  client_id?: number;
}
