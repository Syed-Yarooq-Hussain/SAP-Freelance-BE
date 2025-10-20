import { Module } from '@nestjs/common';
import { ConsultantController } from './consultant.controller';
import { ConsultantService } from './consultant.service';

@Module({
  controllers: [ConsultantController],
  providers: [ConsultantService],
})
export class ConsultantModule {}
