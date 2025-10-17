import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ConsultantService } from './consultant.service';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { UpdateConsultantDto } from './dto/update-consultant.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Consultants') 
@Controller('consultants')
export class ConsultantController {
  constructor(private readonly consultantService: ConsultantService) {}

  @Post()
  create(@Body() dto: CreateConsultantDto) {
    return this.consultantService.create(dto);
  }

  @Get()
  findAll() {
    return this.consultantService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consultantService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConsultantDto) {
    return this.consultantService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.consultantService.remove(+id);
  }
}
