import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { ConsultantService } from './consultant.service';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { UpdateConsultantDto } from './dto/update-consultant.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.consultantService.remove(+id);
  }

  @Get('projects')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get Consulatant Projects' })
    @ApiResponse({ status: 201, description: 'Get project with client details' })
    createProject(@Req() req: any) {
      return this.consultantService.getProjectByConsultantId(+req.user.id);
    }
}
