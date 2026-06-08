import { Controller, Post, Body, Get, Param, Patch, Delete, Query, Put } from '@nestjs/common';
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

  @Get('payments')
  getAllPayments() {
    return this.adminService.getAllPayments();
  }

  @Post('consultant/payment')
  createConsultantPayment(@Body() body: any) {
    return this.adminService.getConsultantPayments();
  }
  
  @Get('consultant/payment/:userId')
  getConsultantPayment(@Param('userId') userId: string) {
    return this.adminService.getConsultantPayments(+userId);
  }

  @Get('consultant/payments')
  getConsultantPayments() {
    return this.adminService.getConsultantPayments();
  }

  @Patch('consultant/payment/:id/paid')
  markConsultantPaymentPaid(@Param('id') id: string, @Body() body: { pdf_url?: string }) {
    return this.adminService.markConsultantPaymentPaid(+id, body);
  }

  // 🏭 Industries CRUD Endpoints
  @Post('industries')
  createIndustry(@Body() body: { name: string }) {
    return this.adminService.createIndustry(body.name);
  }

  @Get('industries')
  getAllIndustries() {
    return this.adminService.getAllIndustries();
  }

  @Get('industries/:id')
  getIndustryById(@Param('id') id: string) {
    return this.adminService.getIndustryById(+id);
  }

  @Put('industries/:id')
  updateIndustry(@Param('id') id: string, @Body() body: { name: string }) {
    return this.adminService.updateIndustry(+id, body.name);
  }

  @Delete('industries/:id')
  deleteIndustry(@Param('id') id: string) {
    return this.adminService.deleteIndustry(+id);
  }
}
