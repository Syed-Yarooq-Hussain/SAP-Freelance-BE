import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getDashboardstats() {
    return this.adminService.dashboardStatistic();
  }
  
  @Get('consultants/all')
  getAllConsultants() {
    return this.adminService.getAllConsultant();
  }
  
  @Get('clients')
  getAllClients() {
    return this.adminService.getAllClients();
  }
  
  @Get('projects')
  getAllProjects() {
    return this.adminService.getAllProjects();
  }

  
}
