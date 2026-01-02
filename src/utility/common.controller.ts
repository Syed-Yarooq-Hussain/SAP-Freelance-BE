import { Body, Controller, Get, Param, Post, Put, Delete, UseGuards, Req, Patch, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { CreateCommonDto } from './dto/create-common.dto';
import { UpdateCommonDto } from './dto/update-common.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateMeetingDto, UpdateMeetingStatusDto } from './dto/meeting-invite.dto';
import { CONSULTANT_LEVEL_ARRAY } from 'constant/enums';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

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
  @ApiOperation({ summary: 'Update Meeting Status' })
  @ApiResponse({ status: 200, description: 'update meeting status by Id ' })
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingStatusDto,
  ) {
    return this.commonService.updateMeetingStatus(Number(id), dto);
  }

  @Get("meetings")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all Meetings' })
  @ApiResponse({ status: 200, description: 'List of all meetings' })
  getAllMeetingByUsers(@Req() req: any) {
    return this.commonService.getAllMeeting(req.user.id);
  }

  @Post('send-email')
  async sendEmail(@Body() body: any) {
    return this.commonService.sendEmail(body);
  }

  @Post('pdf-create')
  async generatePdf(@Req() req: Request,@Body() body: any) {
    return this.commonService.generatePdf(body);
  }

  @Get("sap-modules")
  @ApiOperation({ summary: 'Get all SAP Modules' })
  @ApiResponse({ status: 200, description: 'List of all SAP MODULES' })
  getAllSAPModules() {
    return this.commonService.getSAPmodules();
  }

  @Post('pdf-reader')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/pdf',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(new Error('Only PDF files allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async readerPdf(@UploadedFile() file: Express.Multer.File) {
    return this.commonService.readerPdf(file.path);
  }

  @Post('upload-doc')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProjectDoc(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.commonService.uploadDoc(file);
  }
}