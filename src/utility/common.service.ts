import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommonDto } from './dto/create-common.dto';
import { UpdateCommonDto } from './dto/update-common.dto';
import { CreateMeetingDto, UpdateMeetingStatusDto } from './dto/meeting-invite.dto';
import { MeetingRepository } from 'repository/meeting.repository';
import { ConsultantStatus, MEETING_STATUS_ARRAY, MeetingType } from 'constant/enums';
import { ProjectConsultantRepository } from 'repository/project-consultant.repository';
import { getAllMeetingResponse } from './transformer/meeting.transformer';
import { sendEmail } from 'src/common/emails/email.util';
import { generatePdf } from 'src/common/pdf/pdf.util';
import { ModuleRepository } from 'repository/module.repository';
import { extractText, extractTextFromBuffer, parseWithOpenAI } from 'src/common/pdf/pdf.reader';
import { consultantRegistertObjectTransformer } from './transformer/consultant-profile.transformer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConsultantRepository } from 'repository/consultant.repository';
import { IndustriesRepository } from 'repository/indutries.repository';
import { Resend } from 'resend';
import { ModuleEntity } from 'models/module.model';

@Injectable()
export class CommonService {
  constructor(
    private readonly meetingRepo: MeetingRepository,
    private readonly projectConsultantRepo: ProjectConsultantRepository,
    private readonly consultantRepo: ConsultantRepository,
    private readonly moduleRepo: ModuleRepository,
    private readonly industriesRepo: IndustriesRepository
  ) { }

  private get s3() {
    return new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  private get bucket() {
    return process.env.AWS_S3_BUCKET!;
  }

  async uploadToS3({
    file,
    folder,
    filename,
    mimetype,
  }: {
    file: Buffer;
    folder: string;
    filename: string;
    mimetype: string;
  }): Promise<string> {
    const key = `${folder}/${Date.now()}-${filename}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: mimetype,
      }),
    );

    return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  }

  // 🔹 Create New Industry
  async createIndustry(dto: CreateCommonDto) {
    const newIndustry = await this.industriesRepo.create({ name: dto.name });
    return {
      message: "Industry created successfully",
      data: newIndustry
    };
  }

  // 🔹 Get All Industries
  async getAllIndustry() {
    const industries = await this.industriesRepo.findAll();
    return {
      message: "Industries fetched successfully",
      data: industries
    };
  }

  getMeetingStatus() {
    return MEETING_STATUS_ARRAY
  }

  // 🔹 Update Industry By Id
  async updateIndustry(id: number, dto: UpdateCommonDto) {
    const industry = await this.industriesRepo.findById(id);
    if (!industry) {
      return { message: "Industry not found" };
    }
    const [, updatedIndustries] = await this.industriesRepo.update(id, { name: dto.name });
    return {
      message: 'Industry updated successfully',
      data: updatedIndustries[0],
    };
  }

  // 🔹 Delete Industry By Id
  async deleteIndustry(id: number) {
    const industry = await this.industriesRepo.findById(id);
    if (!industry) {
      return { message: "Industry not found" };
    }
    const deletedCount = await this.industriesRepo.delete(id);
    return {
      message: 'Industry deleted successfully',
      deletedCount
    };
  }

  async sendInvite(dto: CreateMeetingDto, sender_id: number) {

    if (dto.event_type.toLowerCase() === MeetingType.INTERVIEW) {
      for (const userId of dto.invitees_id) {
        const where = { project_id: dto.project_id, consultant_id: userId };
        await this.projectConsultantRepo.update(where, { status: ConsultantStatus.INTERVIEW_SCHEDULED });
      }
    }

    const meeting = await this.meetingRepo.createMeeting({
      sender_id,
      url: `https://meet.com/${Date.now()}`,
      date_time: new Date(dto.date_time),
      duration: dto.duration ?? 20,
      status: 'Pending',
      event_type: dto.event_type,
      project_id: +dto.project_id
    });

    const invitees = await Promise.all(
      dto.invitees_id.map(userId =>
        this.meetingRepo.addInvitee({
          meeting_id: meeting.id,
          user_id: userId,
        }),
      ),
    );

    return {
      message: 'Invitation sent successfully',
      meeting,
      invitees,
    };
  }

  // 🔹 Update Meeting Status
  async updateMeetingStatus(meetingId: number, dto: UpdateMeetingStatusDto) {
    const meeting = await this.meetingRepo.findMeetingById(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    meeting.status = dto.status;
    meeting.date_time = dto.date_time || meeting.date_time;
    await meeting.save();

    return meeting;
  }

  // 🔹 Get All Meeting
  async getAllMeeting(userId: number) {
    const meetings = await this.meetingRepo.getMeetingWithDetails(userId);
    const transformedData = getAllMeetingResponse(meetings)
    return transformedData
  }

  async sendEmail(body: any) {
    /* const { to, type, receiverName, senderName } = body;

    if (!to || !type || !receiverName || !senderName)
      return { status: false, message: "Missing required fields" };

    return await sendEmail(to, type, receiverName, senderName); */
    const resend = new Resend(process.env.RESEND_API_KEY);

    resend.emails.send({
      from: "P9 System <no-reply@safeedposhkarachi.xyz>",
      to: "syed.yarooq1701@gmail.com",
      subject: "Test Email",
      html: "<p>Hello from Railways!</p>",
    }).then(console.log).catch(console.error);
  }


  async generatePdf( data: { text?: string; imagePath?: string; title?: string }) {
    const pdfUrl = await generatePdf(data);
    return pdfUrl;
  }

  async getSAPmodules() {
    const allModules = await this.moduleRepo.findAll();
    
    const core = allModules.filter(m => m.is_core === true);
    const others = allModules.filter(m => m.is_core === false);

    return { core, others };
  }

  async readerPdf(userId: any, file: Express.Multer.File) {

    const url = await this.uploadToS3({
      file: file.buffer,
      folder: 'cvs',
      filename: file.originalname,
      mimetype: file.mimetype,
    });

    const text = await extractTextFromBuffer(file.buffer);
    const userInfo = await parseWithOpenAI(text);
    const transormedUser = await consultantRegistertObjectTransformer(userInfo);

    await this.consultantRepo.updateByUserId(userId, {
      cv_url: url,
    });

    transormedUser.cv_url = url;
    return transormedUser;
  }

  async uploadDoc(file: Express.Multer.File) {
    const key = await this.uploadToS3({
      file: file.buffer,
      folder: 'profileImages',
      filename: file.originalname,
      mimetype: file.mimetype,
    });

    return key;
  }

   // 🆕 Create Module
  async create(data: Partial<ModuleEntity>): Promise<ModuleEntity> {
    // ✅ Parent validation
    if (data.parent_id) {
      const parent = await this.moduleRepo.findById(data.parent_id);

      if (!parent) {
        throw new BadRequestException('Parent module not found');
      }
    }

    return this.moduleRepo.create(data);
  }

  // 📋 Get All (flat)
  async findAll(isCore?: boolean): Promise<ModuleEntity[]> {
    return this.moduleRepo.findAll(isCore);
  }

  // 🌳 Get Tree (MAIN 🔥)
  async getTree(): Promise<any[]> {
    return this.moduleRepo.getTree(null);
  }

  // 🔍 Get By Id
  async findById(id: number): Promise<ModuleEntity> {
    const module = await this.moduleRepo.findById(id);

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    return module;
  }

  // 🧠 Update
  async update(id: number, data: Partial<ModuleEntity>) {
    const module = await this.moduleRepo.findById(id);

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // ✅ Parent validation
    if (data.parent_id) {
      if (data.parent_id === id) {
        throw new BadRequestException('Module cannot be its own parent');
      }

      const parent = await this.moduleRepo.findById(data.parent_id);

      if (!parent) {
        throw new BadRequestException('Parent module not found');
      }
    }

    return this.moduleRepo.update(id, data);
  }

  // ❌ Delete (SAFE 🔥)
  async delete(id: number) {
    const module = await this.moduleRepo.findById(id);

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // ✅ check children
    const children = await this.moduleRepo.findChildren(id);

    if (children.length > 0) {
      throw new BadRequestException(
        'Cannot delete module with child modules',
      );
    }

    return this.moduleRepo.delete(id);
  }
  
}