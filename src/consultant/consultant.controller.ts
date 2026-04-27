import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req, Query, Patch, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ConsultantService } from './consultant.service';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { UpdateConsultantDto } from './dto/update-consultant.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateConsultantDetailDto } from 'src/auth/dto/register-consultant.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CONSULTANT_LEVEL_ARRAY } from 'constant/enums';

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

  @Post('upload-profile/:id')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfile(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const url = await this.consultantService.uploadProfileImage(id, file);

    return { url };
  }
  
  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboardData(
    @Req() req: any,
  ) {
    return await this.consultantService.getDashboradData(+req.user.id);
  }
  
  @Get('v2/dashboard')
  @UseGuards(JwtAuthGuard)
  async getNewDashboardData(
    @Req() req: any,
  ) {
    return await this.consultantService.getNewDashboardData(+req.user.id);
  }

  @Delete('profile/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete consultant profile and related consultant data' })
  @ApiResponse({ status: 200, description: 'Consultant profile deleted successfully' })
  deleteConsultantProfile(@Param('id') id: string) {
    return this.consultantService.deleteConsultantProfile(+id);
  }

  @Get('experience-levels')
  @ApiOperation({ summary: 'Get all consultant experience levels' })
  @ApiResponse({ status: 200, description: 'List of all consultant experience levels' })
  getExperienceLevels() {
    return {
      message: 'Experience levels fetched successfully',
      data: ['Junior', 'Associate', 'Mid-Level', 'Senior', 'Principal', 'Solution Architect']
    };
  }

}
