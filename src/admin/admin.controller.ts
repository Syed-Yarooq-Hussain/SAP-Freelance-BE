import { Controller, Post, Body, Get, Param, Patch, Delete, Query, Put, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'constant/enums';
import { DecideModuleRequestDto } from './dto/decide-module-request.dto';
import { SendInviteEmailsDto } from './dto/send-invite-emails.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('module-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List module requests newest first' })
  getModuleRequests(@Req() req: any) {
    return this.adminService.getModuleRequests(req.user);
  }

  @Patch('module-requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Accept or reject a pending module request' })
  decideModuleRequest(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: DecideModuleRequestDto,
  ) {
    return this.adminService.decideModuleRequest(req.user, id, body);
  }

  @Post('invite-emails')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send consultant invitation emails sequentially' })
  sendInviteEmails(@Req() req: any, @Body() body: SendInviteEmailsDto) {
    return this.adminService.sendInviteEmails(req.user, body);
  }

  @Get('stats')
  getDashboardstats() {
    return this.adminService.dashboardStatistic();
  }

  @Get('dashboard/consultants-summary')
  @ApiOperation({ summary: 'Get consultant overview and chart-ready breakdowns' })
  @ApiResponse({ status: 200, description: 'Consultant summary fetched successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  getConsultantsSummary() {
    return this.adminService.getConsultantsSummary();
  }
  
  @Get('consultants/all')
  getAllConsultants(@Query('status') status: string) {
    console.log("Status Filter:", status);  
    return this.adminService.getAllConsultant(status);
  }

  @Get('consultants/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get complete consultant profile by user ID' })
  getConsultantProfile(@Param('id') id: string) {
    return this.adminService.getConsultantProfileByUserId(Number(id));
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
