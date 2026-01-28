import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { ConsultantService } from './consultant.service';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { UpdateConsultantDto } from './dto/update-consultant.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateConsultantDetailDto } from 'src/auth/dto/register-consultant.dto';

@ApiTags('Consultants') 
@Controller('consultants')
export class ConsultantController {
  constructor(private readonly consultantService: ConsultantService) {}

  @Get('projects')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Consulatant Projects' })
  @ApiResponse({ status: 201, description: 'Get project with client details' })
  createProject(@Req() req: any) {
    return this.consultantService.getProjectByConsultantId(+req.user.id);
  }
  
  //To be make
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get dashboard stats ' })
  @ApiResponse({ status: 201, description: 'Get dashboard stats ' })
  getConsultantStats(@Req() req: any) {
    return this.consultantService.getConsultantStats(+req.user.id);
  }
  
  @Get('left-sidebar')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get dashboard stats ' })
  @ApiResponse({ status: 201, description: 'Get dashboard stats ' })
  getConsultantleftSideBar(@Req() req: any) {
    return this.consultantService.getSideBarStats(+req.user.id);
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
    return this.consultantService.getConsultantPayments(+req.user.id);
  }
  
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Consulatant Details' })
  @ApiResponse({ status: 201, description: 'Get consultant Details' })
  getConsultantDetails(@Req() req: any) {
    return this.consultantService.getConsultantDetail(+req.user.id);
  }
  
  @Post('schedule')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add Consulatant Schedule ' })
  @ApiResponse({ status: 201, description: 'Add Consulatant Schedule' })
  setConsultantSchedule(@Req() req: any, @Body() body: any) {
    return this.consultantService.setConsultantSchedule(+req.user.id, body);
  }
  
  @Get('schedule')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Consulatant Schedule ' })
  @ApiResponse({ status: 201, description: 'Get Consulatant Schedule' })
  getConsultantSchedule(@Req() req: any, @Query() query: any) {
    return this.consultantService.getConsultantSchedule(+req.user.id, +query.month, +query.year);
  }

  @Put('')
  @UseGuards(JwtAuthGuard)
  async updateConsultant(
    @Body() updateDto: UpdateConsultantDetailDto, @Req() req: any,
  ) {
    const updatedUser = await this.consultantService.updateConsultant(
      +req.user.id,
      updateDto,
    );
    return updatedUser;
  }

}
