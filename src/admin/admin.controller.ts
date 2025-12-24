import { Controller, Post, Body, Get, Param, Patch, Delete, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getDashboardstats() {
    return this.adminService.dashboardStatistic();
  }
  
  @Get('consultants/all')
  getAllConsultants(@Query('status') status: string) {
    console.log("Status Filter:", status);  
    return this.adminService.getAllConsultant(status);
  }
  
  @Post('consultants/:id')
  accpetRejectConsultant(@Param('id') id: string, @Body() body: any) {
    return this.adminService.accpetRejectConsultantById(+id, body);
  }
  
  @Get('clients/all')
  getAllClients(@Query('status') status: string) {
    return this.adminService.getAllClients(status);
  }

  @Post('clients/:id')
  accpetRejectClient(@Param('id') id: string, @Body() body: any) {
    return this.adminService.accpetRejectConsultantById(+id, body);
  }
  
  @Get('projects')
  getAllProjects() {
    return this.adminService.getAllProjects();
  }

  
}
