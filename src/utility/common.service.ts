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
import * as ExcelJS from 'exceljs';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
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

  async readExcelWithDriveProfiles(file: any) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const worksheet = workbook.worksheets[0];

  const rows: any[] = [];
  let headers: string[] = [];

  worksheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) {
      headers = (row.values as any[]).slice(1).map(h => String(h).trim().toLowerCase());
    } else {
      const rowObj: any = {};
      (row.values as any[]).slice(1).forEach((val, i) => {
        rowObj[headers[i]] = val;
      });
      rows.push(rowObj);
    }
  });

  const results = await Promise.all(
    rows.map(async (row) => {
      const rawUrl = row['url'];
      const driveUrl: string = typeof rawUrl === 'object' && rawUrl !== null
        ? (rawUrl.hyperlink ?? rawUrl.text ?? rawUrl.result ?? '')
        : String(rawUrl ?? '');
      let profileInfo: any = {};

      if (driveUrl) {
        try {
          console.log(`Processing Drive URL: ${driveUrl}`);
          const fileId = this.extractDriveFileId(driveUrl);
          const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          console.log(`Constructed download URL: ${downloadUrl}`);
          const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data);

          // ✅ Sirf text extract karo — no OpenAI
          const text = await extractTextFromBuffer(buffer);

          // ✅ Regex se fields nikalo
          profileInfo = this.extractProfileFromText(text);

        } catch (err) {
          console.error(`Error processing Drive URL: ${driveUrl}`, err);
          profileInfo = { error: 'Could not extract profile from drive link' };
        }
      }

      return {
        rate: row['rate'],
        core_module: row['core_module'],
        experience: row['expereince'],
        availability: row['availability'],
        other_module: row['other_module'],
        country: row['country'],
        url: driveUrl,
        profile: profileInfo,
      };
    })
  );

  return {
    message: 'Excel processed successfully',
    total: results.length,
    data: results,
  };
}

// ✅ Regex based extractor — no AI needed
private extractProfileFromText(text: string): any {
  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  
  // Phone — international ya local formats
  const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,15}\d)/);
  
  // LinkedIn
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i);
  
  // Name — pehli line jo sirf words ho (simple heuristic)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const nameLine = lines.find(l => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(l));

  // City — common heuristic: "City, Country" pattern
  const cityMatch = text.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*(?:[A-Z][a-z]+|[A-Z]{2})\b/);

  return {
    name: nameLine ?? null,
    email: emailMatch?.[0] ?? null,
    phone: phoneMatch?.[0]?.trim() ?? null,
    city: cityMatch?.[1] ?? null,
    linkedin_url: linkedinMatch?.[0] ?? null,
  };
}

private extractDriveFileId(url: string): string {
  // Handle formats:
  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/open?id=FILE_ID
  // https://docs.google.com/document/d/FILE_ID/edit
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  throw new Error(`Could not extract file ID from URL: ${url}`);
}
  
}

