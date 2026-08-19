import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'models/user.model';
import { Consultant } from 'models/consultant.model';
import { DocumentRepository } from 'repository/document.repository';
import { City, Country } from 'country-state-city';
import { ModuleRequest } from 'models/module-request.model';
import { CreateModuleRequestDto } from './dto/create-module-request.dto';
import { UserRole } from 'constant/enums';
import { col, fn, Op, UniqueConstraintError, where } from 'sequelize';

@Injectable()
export class CommonService {
  constructor(
    private readonly meetingRepo: MeetingRepository,
    private readonly projectConsultantRepo: ProjectConsultantRepository,
    private readonly consultantRepo: ConsultantRepository,
    private readonly moduleRepo: ModuleRepository,
    private readonly industriesRepo: IndustriesRepository,
    private readonly documentRepo: DocumentRepository,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Consultant) private readonly consultantModel: typeof Consultant,
    @InjectModel(ModuleRequest) private readonly moduleRequestModel: typeof ModuleRequest,
  ) { }

  async createModuleRequest(authUser: any, body: CreateModuleRequestDto) {
    const allowedFields = new Set(['name', 'user_id']);
    if (!body || Object.keys(body).some(key => !allowedFields.has(key))) {
      throw new BadRequestException('Unsupported fields in module request');
    }
    if (Number(authUser?.role) !== UserRole.CONSULTANT) {
      throw new ForbiddenException('Only consultants can create module requests');
    }
    if (typeof body.name !== 'string' || !body.name.trim()) {
      throw new BadRequestException('name is required and must be a non-empty string');
    }
    if (typeof body.user_id !== 'number' || !Number.isInteger(body.user_id)) {
      throw new BadRequestException('user_id must be an integer');
    }
    if (body.user_id !== Number(authUser.id)) {
      throw new ForbiddenException('You cannot submit a request for another user');
    }

    const name = body.name.trim();
    const normalizedName = name.toLowerCase();
    const existingModule = await ModuleEntity.findOne({
      where: {
        deleted_at: null,
        [Op.and]: [where(fn('lower', col('name')), normalizedName)],
      },
    });
    if (existingModule) {
      throw new ConflictException('Module already exists');
    }

    const pendingRequest = await this.moduleRequestModel.findOne({
      where: {
        user_id: authUser.id,
        is_accepted: null,
        [Op.and]: [where(fn('lower', col('name')), normalizedName)],
      },
    });
    if (pendingRequest) {
      throw new ConflictException('An identical module request is already pending');
    }

    try {
      const request = await this.moduleRequestModel.create({
        name,
        user_id: authUser.id,
        is_accepted: null,
      });
      return { message: 'Module request submitted', data: request };
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException('An identical module request is already pending');
      }
      throw error;
    }
  }

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

  private toLocationSlug(value: string): string {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private getSortedCountries() {
    return Country.getAllCountries().slice().sort((a, b) =>
      a.name.localeCompare(b.name, 'en'),
    );
  }

  getCountries() {
    const countries = this.getSortedCountries().map((country, index) => ({
      id: index + 1,
      name: country.name,
      code: country.isoCode,
      slug: this.toLocationSlug(country.name),
    }));

    return {
      message: 'Countries fetched successfully',
      data: countries,
    };
  }

  getCitiesByCountry(countryIdentifier: string) {
    const normalizedIdentifier = this.toLocationSlug(
      String(countryIdentifier || '').slice(0, 100),
    );

    const country = this.getSortedCountries().find((item) =>
      this.toLocationSlug(item.name) === normalizedIdentifier ||
      item.isoCode.toLowerCase() === normalizedIdentifier,
    );

    if (!country) {
      return {
        message: 'Country not found',
        data: [],
      };
    }

    const cities = (City.getCitiesOfCountry(country.isoCode) || [])
      .slice()
      .sort((a, b) =>
        a.name.localeCompare(b.name, 'en') ||
        a.stateCode.localeCompare(b.stateCode, 'en'),
      )
      .map((city, index) => ({
        id: index + 1,
        name: city.name,
        country: country.name,
        country_code: country.isoCode,
      }));

    return {
      message: 'Cities fetched successfully',
      data: cities,
    };
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
    const resend = new Resend(process.env.RESEND_API_KEY);

    resend.emails.send({
      from: process.env.EMAIL_FROM?.trim() ||
        "The Consult Crew <no-reply@theconsultcrew.com>",
      to: "syed.yarooq1701@gmail.com",
      subject: "Test Email",
      html: "<p>Hello from Railways!</p>",
    }).then(console.log).catch(console.error);
  }

  async generatePdf(data: { text?: string; imagePath?: string; title?: string }) {
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

  // 🌳 Get Tree
  async getTree(): Promise<any[]> {
    return this.moduleRepo.getTree();
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
    if (data.parent_id) {
      if (data.parent_id === id) {
        throw new BadRequestException('Module cannot be its own parent');
      }
      const parent = await this.moduleRepo.findById(data.parent_id);
      if (!parent) {
        throw new BadRequestException('Parent module not found');
      }
    }
    if(!data.parent_id) {
      data.is_core = true;
    }
    return this.moduleRepo.update(id, data);
  }

  // ❌ Delete
  async delete(id: number) {
    const module = await this.moduleRepo.findById(id);
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    const children = await this.moduleRepo.findChildren(id);
    if (children.length > 0) {
      throw new BadRequestException('Cannot delete module with child modules');
    }
    return this.moduleRepo.delete(id);
  }

  // ============================================================
  // 📊 Excel + Google Drive — Consultant Bulk Import
  // ============================================================

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
      rows.map(async (row, index) => {
        // ✅ Hyperlink object bhi handle karo
        const rawUrl = row['url'];
        const driveUrl: string = typeof rawUrl === 'object' && rawUrl !== null
          ? (rawUrl.hyperlink ?? rawUrl.text ?? rawUrl.result ?? '')
          : String(rawUrl ?? '');

        let profileInfo: any = {};

        if (driveUrl) {
          try {
            const fileId = this.extractDriveFileId(driveUrl);
            const buffer = await this.downloadFromGoogleDrive(fileId);
            const text = await extractTextFromBuffer(buffer);
            profileInfo = this.extractProfileFromText(text);
          } catch (err) {
            profileInfo = { error: err ?? 'Unknown error' };
          }
        }

        // ✅ User + Consultant DB entry
        let userStatus = '';
        const email = profileInfo?.email ?? null;

        if (email) {
          const existingUser = await this.userModel.findOne({ where: { email } });

          if (existingUser) {
            userStatus = 'already_exists';
          } else {
            const hashedPassword = await bcrypt.hash('123456', 10);

            const newUser = await this.userModel.create({
              email,
              password: hashedPassword,
              username: profileInfo?.name ?? null,
              phone: profileInfo?.phone ?? null,
              city: profileInfo?.city ?? null,
              country: row['country'] ?? null,
              linkedin_url: profileInfo?.linkedin_url ?? null,
              role: 2,
              currency: 'USD',
              email_verified: true,
              phone_verified: false,
              linkedin_sso_connected: false,
              status: 'active',
            });

            await this.consultantModel.create({
              user_id: newUser.id,
              rate: row['rate'] ? Number(row['rate']) || 0 : 0,
              experience: row['expereince'] ? Math.round(Number(row['expereince'])) || 0 : 0,
              weekly_available_hours: row['availability'] ? Number(row['availability']) || 0 : 0,
              cv_url: driveUrl ?? null,
            });

            userStatus = 'created';
          }
        } else {
          userStatus = 'skipped_no_email';
        }

        return {
          status: userStatus,
          email,
          rate: Number(row['rate']) || 0,
          core_module: row['core_module'],
          experience: row['expereince'],
          availability: row['availability'],
          other_module: row['other_module'],
          country: row['country'],
          url: driveUrl,
          profile: profileInfo,
          row_number: index + 2,
        };
      })
    );

    return {
      message: 'Excel processed successfully',
      total: results.length,
      created: results.filter(r => r.status === 'created').length,
      already_exists: results.filter(r => r.status === 'already_exists').length,
      skipped: results.filter(r => r.status === 'skipped_no_email').length,
      data: results,
      skipped_rows: results
        .filter(r => r.status === 'skipped_no_email' || r.status === 'already_exists')
        .map(r => ({ row: r.row_number, email: r.email, reason: r.status })),
        };
  }

  private async downloadFromGoogleDrive(fileId: string): Promise<Buffer> {
    const url = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      maxRedirects: 10,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,application/octet-stream,*/*',
      },
    });

    const contentType: any = response.headers['content-type'] ?? '';

    if (contentType.includes('text/html')) {
      // Try 2: export=view
      const url2 = `https://drive.google.com/uc?export=view&id=${fileId}`;
      const response2 = await axios.get(url2, {
        responseType: 'arraybuffer',
        maxRedirects: 10,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      const ct2: any = response2.headers['content-type'] ?? '';
      if (ct2.includes('text/html')) {
        throw new Error(`Drive file download failed — file publicly shared nahi ya block ho raha hai. FileId: ${fileId}`);
      }

      return Buffer.from(response2.data);
    }

    return Buffer.from(response.data);
  }

  private extractDriveFileId(url: string): string {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /[?&]id=([a-zA-Z0-9_-]+)/,
      /\/document\/d\/([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    throw new Error(`Drive file ID nahi mila URL se: ${url}`);
  }

  private extractProfileFromText(text: string): any {
    const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,15}\d)/);
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const nameLine = lines.find(l => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(l));
    const cityMatch = text.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*(?:[A-Z][a-z]+|[A-Z]{2})\b/);

    return {
      name: nameLine ?? null,
      email: emailMatch?.[0] ?? null,
      phone: phoneMatch?.[0]?.trim() ?? null,
      city: cityMatch?.[1] ?? null,
      linkedin_url: linkedinMatch?.[0] ?? null,
    };
  }


  async uploadDocument(
    file: Express.Multer.File,
    type: string,
  ) {
    // Upload file to S3
    const fileUrl = await this.uploadToS3({
      file: file.buffer,
      folder: 'documents',
      filename: file.originalname,
      mimetype: file.mimetype,
    });

    // Save in DB
    const document = await this.documentRepo.create({
      url: fileUrl,
      type,
    });

    // Return response
    return {
      id: document.id,
      url: document.url,
      type: document.type,
    };
  }

}
