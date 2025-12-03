import { Body, Controller, Get, Param, Post, Put, Delete, UseGuards, Req, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { CreateCommonDto } from './dto/create-common.dto';
import { UpdateCommonDto } from './dto/update-common.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateMeetingDto, UpdateMeetingStatusDto } from './dto/meeting-invite.dto';
import { CONSULTANT_LEVEL_ARRAY } from 'constant/enums';

@ApiTags('Common')
@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Post("industry")
  @ApiOperation({ summary: 'Create a new industry entry' })
  @ApiResponse({ status: 201, description: 'Industry created successfully.' })
  @ApiBody({ type: CreateCommonDto })
  createIndustry(@Body() dto: CreateCommonDto) {
    return this.commonService.createIndustry(dto);
  }

  @Get("industry")
  @ApiOperation({ summary: 'Get all industry' })
  @ApiResponse({ status: 200, description: 'List of all industry fetched successfully' })
  getAllIndustry() {
    return this.commonService.getAllIndustry();
  }
  
  @Get("consultant-levels")
  @ApiOperation({ summary: 'Get all industry' })
  @ApiResponse({ status: 200, description: 'List of all industry fetched successfully' })
  getConsultantLevels() {
    return CONSULTANT_LEVEL_ARRAY;
  }

  @Put('industry/:id')
  @ApiOperation({ summary: 'Update an existing industry' })
  @ApiBody({ type: UpdateCommonDto })
  updateIndustry(@Param('id') id: string,@Body() dto: UpdateCommonDto) {
    return this.commonService.updateIndustry(+id,dto);
  }

  @Post("meeting-invite")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send meeting/interview Invite' })
  @ApiResponse({ status: 201, description: 'Invitition created successfully.' })
  @ApiBody({ type: CreateMeetingDto })
  sendInvite(@Body() body: CreateMeetingDto, @Req() req: any) {
    return this.commonService.sendInvite(body, req.user.id);
  }

  @Get("meeting-status")
  @ApiOperation({ summary: 'Get all Meeting Status' })
  @ApiResponse({ status: 200, description: 'List of all industry fetched successfully' })
  getMeetingStatus() {
    return this.commonService.getMeetingStatus();
  }

  @Patch('meetings/:id/status')
  @ApiOperation({ summary: 'Get all Meeting Status' })
  @ApiResponse({ status: 200, description: 'List of all industry fetched successfully' })
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingStatusDto,
  ) {
    return this.commonService.updateMeetingStatus(Number(id), dto.status);
  }

  @Get("meetings")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all Meeting Status' })
  @ApiResponse({ status: 200, description: 'List of all meetings' })
  getAllMeetingByUsers(@Req() req: any) {
    return this.commonService.getAllMeeting(req.user.id);
  }

}