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
  
  //To be make
  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get dashboard stats ' })
  @ApiResponse({ status: 201, description: 'Get dashboard stats ' })
  getConsultantStats(@Req() req: any) {
    return { appeared_in_search: 10, interview_schedule: 5, monthly_revenue: 3000, total_earnings: 5000 };
  }
  
  // To be make 
  @Get('schedules')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Consulatant Schedule' })
  @ApiResponse({ status: 201, description: 'Get consultant schedule' })
  getCOnsultantSchedules(@Req() req: any) {
    return this.consultantService.getScheduleByConsultantId(+req.user.id);
  }

  //To be make 
  @Get('payments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Consulatant Payments' })
  @ApiResponse({ status: 201, description: 'Get consultant payments' })
  getConsultantPayments(@Req() req: any) {
    return this.consultantService.getProjectByConsultantId(+req.user.id);
  }

}
