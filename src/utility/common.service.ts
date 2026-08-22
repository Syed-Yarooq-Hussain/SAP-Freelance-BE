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
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { User } from 'models/user.model';
import { Consultant } from 'models/consultant.model';
import { DocumentRepository } from 'repository/document.repository';
import { City, Country } from 'country-state-city';
import { ModuleRequest } from 'models/module-request.model';
import { CreateModuleRequestDto } from './dto/create-module-request.dto';
import { UserRole } from 'constant/enums';
import { col, fn, Op, UniqueConstraintError, where } from 'sequelize';
import { ConsultantModule } from 'models/consultant-module.model';
import { Sequelize } from 'sequelize-typescript';
import { PRODUCTION_SAP_MODULES } from 'constant/production-sap-modules';

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
    @InjectModel(ConsultantModule) private readonly consultantModuleModel: typeof ConsultantModule,
    @InjectConnection() private readonly sequelize: Sequelize,
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

  async exportExcelWithDriveProfiles(file: Express.Multer.File) {
    const normalizePhone = (value: any) => String(value ?? '').replace(/\D/g, '');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(file.buffer) as any);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new BadRequestException('Excel workbook does not contain a worksheet');

    let headers: string[] = [];
    const rows: any[] = [];
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) {
        headers = (row.values as any[]).slice(1).map(value => String(value).trim().toLowerCase());
        return;
      }
      const rowObject: any = {};
      (row.values as any[]).slice(1).forEach((value, index) => {
        rowObject[headers[index]] = value;
      });
      if (Object.values(rowObject).some(value => value != null && String(value).trim())) rows.push(rowObject);
    });
    if (!headers.length) throw new BadRequestException('Excel header row is required');
    if (rows.length > 20) {
      throw new BadRequestException('Maximum 20 CV rows are allowed per batch');
    }

    const moduleCatalog = PRODUCTION_SAP_MODULES;
    const moduleLookup = new Map<string, number>();
    for (const module of moduleCatalog) {
      const name = module.name.trim().toLowerCase();
      // Duplicate production names exist (e.g. Materials Management 38/172).
      // Keep the first/lowest production ID for name-only matches.
      if (name && !moduleLookup.has(name)) moduleLookup.set(name, module.id);
      moduleLookup.set(String(module.id), module.id);
    }

    const resolveModules = (value: any) => {
      const cell = value && typeof value === 'object' ? value.text ?? value.result ?? '' : value ?? '';
      const entries = String(cell).split(/[,;|\n]+/).map(item => item.trim()).filter(Boolean);
      const ids: number[] = [];
      const unresolved: string[] = [];
      for (const entry of entries) {
        const plainName = entry.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
        const id = moduleLookup.get(entry.toLowerCase()) ?? moduleLookup.get(plainName);
        if (id) ids.push(id); else unresolved.push(entry);
      }
      return { ids: Array.from(new Set(ids)), unresolved };
    };

    const results: any[] = [];
    for (const row of rows) {
      const rawUrl = row.url;
      const driveUrl = typeof rawUrl === 'object' && rawUrl !== null
        ? String(rawUrl.hyperlink ?? rawUrl.text ?? rawUrl.result ?? '')
        : String(rawUrl ?? '');
      let profile: any = {};
      let processingError = '';
      let cvText = '';
      if (driveUrl) {
        try {
          const fileId = this.extractDriveFileId(driveUrl);
          const pdf = await this.downloadFromGoogleDrive(fileId);
          cvText = await extractTextFromBuffer(pdf);
          const retryDelays = [0, 2000, 5000, 10000];
          let lastError: any;
          for (let attempt = 0; attempt < retryDelays.length; attempt++) {
            if (retryDelays[attempt]) {
              await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
            }
            try {
              profile = await parseWithOpenAI(cvText);
              lastError = null;
              break;
            } catch (error) {
              lastError = error;
              const message = error instanceof Error ? error.message : String(error);
              const isRateLimit = /429|rate.?limit|quota|too many requests/i.test(message);
              if (!isRateLimit) break;
            }
          }
          if (lastError) throw lastError;
        } catch (error) {
          processingError = error instanceof Error ? error.message : String(error || 'Unknown error');
        }
      }
      const sheetCore = resolveModules(row.core_module_ids ?? row.core_module);
      const sheetOther = resolveModules(row.other_module_ids ?? row.other_module);
      const detectedCore = resolveModules(
        `${profile.profile_summary || ''},${profile.clients_summary || ''}`,
      ).ids;
      const normalizedCvText = cvText.toLowerCase();
      const detectedAll = moduleCatalog
        .filter(module => normalizedCvText.includes(module.name.toLowerCase()))
        .map(module => module.id);
      const core = {
        ids: Array.from(new Set([...sheetCore.ids, ...detectedCore])),
        unresolved: sheetCore.unresolved,
      };
      const other = {
        ids: Array.from(new Set([...sheetOther.ids, ...detectedAll]))
          .filter(id => !core.ids.includes(id)),
        unresolved: sheetOther.unresolved,
      };
      results.push({
        ...row,
        username: profile.username ?? '',
        email: profile.email ?? '',
        phone: normalizePhone(profile.phone),
        city: profile.city ?? '',
        country: profile.country ?? row.country ?? '',
        experience: profile.total_experience_years ?? '',
        professional_headline: profile.professional_headline ?? '',
        profile_summary: profile.profile_summary ?? '',
        clients_summary: profile.clients_summary ?? profile.profile_summary ?? '',
        industries: JSON.stringify(profile.industries ?? []),
        skills: JSON.stringify(profile.skills ?? []),
        projects: JSON.stringify(profile.projects ?? []),
        work_experiences: JSON.stringify(profile.work_experiences ?? []),
        education: JSON.stringify(profile.education ?? []),
        certifications: JSON.stringify(profile.certifications ?? []),
        languages: JSON.stringify(profile.languages ?? []),
        cv_url: driveUrl,
        extracted_name: profile.username ?? '',
        extracted_email: profile.email ?? '',
        extracted_phone: normalizePhone(profile.phone),
        extracted_city: profile.city ?? '',
        extracted_linkedin_url: profile.linkedin_url ?? '',
        core_module_ids: core.ids.join(','),
        other_module_ids: other.ids.join(','),
        unresolved_core_modules: core.unresolved.join(','),
        unresolved_other_modules: other.unresolved.join(','),
        processing_error: processingError,
      });
    }

    const addedHeaders = [
      'username', 'email', 'phone', 'city', 'country', 'experience',
      'professional_headline', 'profile_summary', 'clients_summary', 'industries',
      'skills', 'projects', 'work_experiences', 'education', 'certifications',
      'languages', 'cv_url',
      'extracted_name', 'extracted_email', 'extracted_phone', 'extracted_city',
      'extracted_linkedin_url', 'core_module_ids', 'other_module_ids',
      'unresolved_core_modules', 'unresolved_other_modules', 'processing_error',
    ];
    const outputHeaders = [...headers, ...addedHeaders.filter(header => !headers.includes(header))];
    const outputWorkbook = new ExcelJS.Workbook();
    const outputSheet = outputWorkbook.addWorksheet('Processed Profiles');
    outputSheet.columns = outputHeaders.map(header => ({ header, key: header, width: 24 }));
    results.forEach(result => outputSheet.addRow(result));
    outputSheet.getRow(1).font = { bold: true };
    outputSheet.views = [{ state: 'frozen', ySplit: 1 }];
    outputSheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: outputHeaders.length } };

    const sourceName = String(file.originalname || 'consultant-profiles')
      .replace(/\.xlsx?$/i, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-');
    return {
      filename: `${sourceName}-processed.xlsx`,
      buffer: Buffer.from(await outputWorkbook.xlsx.writeBuffer()),
    };
  }

  async importReviewedExcelProfiles(file: Express.Multer.File, authUser: any) {
    if (Number(authUser?.role) !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can import consultant profiles');
    }

    if (!file.buffer?.length) throw new BadRequestException('Uploaded Excel file is empty');

    let headers: string[] = [];
    const rows: { rowNumber: number; data: any }[] = [];
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer', raw: false });
      const firstSheetName = workbook.SheetNames?.[0];
      if (!firstSheetName || !workbook.Sheets[firstSheetName]) {
        throw new Error('Workbook does not contain a worksheet');
      }

      const matrix = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[firstSheetName], {
        header: 1,
        defval: '',
        raw: false,
      });
      if (!matrix.length) throw new Error('Worksheet is empty');

      headers = matrix[0].map(value => String(value).trim().toLowerCase());
      matrix.slice(1).forEach((values, index) => {
        const data: any = {};
        headers.forEach((header, columnIndex) => data[header] = values[columnIndex] ?? '');
        if (Object.values(data).some(value => String(value ?? '').trim())) {
          rows.push({ rowNumber: index + 2, data });
        }
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unreadable workbook';
      throw new BadRequestException(`Invalid Excel file: ${reason}`);
    }

    for (const required of ['email', 'username', 'core_module_ids', 'other_module_ids']) {
      if (!headers.includes(required)) {
        throw new BadRequestException(`Required Excel column is missing: ${required}`);
      }
    }

    const validModuleIds = new Set(PRODUCTION_SAP_MODULES.map(module => module.id));
    const parseJson = (value: any, field: string, rowNumber: number, fallback: any) => {
      if (value == null || String(value).trim() === '') return fallback;
      if (typeof value !== 'string') return value;
      try { return JSON.parse(value); }
      catch { throw new Error(`Row ${rowNumber}: ${field} must contain valid JSON`); }
    };
    const parseLanguages = (value: any) => {
      if (value == null || String(value).trim() === '') return [];
      if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
      const text = String(value).trim();
      if (text.startsWith('[')) {
        try {
          const parsed = JSON.parse(text);
          return Array.isArray(parsed)
            ? parsed.map(item => String(item).trim()).filter(Boolean)
            : [String(parsed).trim()].filter(Boolean);
        } catch {
          // Fall through and preserve a malformed JSON-looking value as one language.
        }
      }
      return text.split(/[,;|]+/).map(item => item.trim()).filter(Boolean);
    };
    const parseIds = (value: any) => Array.from(new Set(
      String(value ?? '').split(/[,;|\s]+/).map(Number).filter(Number.isInteger),
    ));
    const normalizePhone = (value: any) => String(value ?? '').replace(/\D/g, '');

    const created: { row: number; user_id: number; email: string }[] = [];
    const skipped: { row: number; email: string; reason: string }[] = [];
    const failed: { row: number; email: string; error: string }[] = [];

    for (const item of rows) {
      const row = item.data;
      const email = String(row.email || '').trim().toLowerCase();
      try {
        if (String(row.processing_error || '').trim()) {
          throw new Error('Row still contains a CV processing error');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error('Valid email is required');
        }
        if (!String(row.username || '').trim()) throw new Error('username is required');

        const existing = await this.userModel.findOne({
          where: { email: { [Op.iLike]: email } },
        });
        if (existing) {
          skipped.push({ row: item.rowNumber, email, reason: 'email_already_exists' });
          continue;
        }

        const coreModuleIds = parseIds(row.core_module_ids);
        const otherModuleIds = parseIds(row.other_module_ids)
          .filter(id => !coreModuleIds.includes(id));
        const invalidIds = [...coreModuleIds, ...otherModuleIds]
          .filter(id => !validModuleIds.has(id));
        if (invalidIds.length) throw new Error(`Invalid module IDs: ${invalidIds.join(',')}`);

        const passwordHash = await bcrypt.hash('123456', 10);
        const user = await this.sequelize.transaction(async transaction => {
          const newUser = await this.userModel.create({
            username: String(row.username).trim(),
            email,
            password: passwordHash,
            phone: normalizePhone(row.phone) || null,
            city: String(row.city || '').trim() || null,
            country: String(row.country || '').trim() || null,
            linkedin_url: String(row.extracted_linkedin_url || row.linkedin_url || '').trim() || null,
            role: UserRole.CONSULTANT,
            currency: String(row.currency || 'PKR').trim(),
            status: 'active',
            email_verified: true,
            phone_verified: false,
            linkedin_sso_connected: false,
            timezone: String(row.timezone || 'Asia/Karachi').trim(),
          }, { transaction });

          await this.consultantModel.create({
            user_id: newUser.id,
            experience: row.experience === '' ? null : Number(row.experience) || 0,
            rate: row.rate === '' || row.rate == null ? null : Number(row.rate) || 0,
            weekly_available_hours: row.availability === '' || row.availability == null
              ? null : Number(row.availability) || 0,
            working_schedule: null,
            cv_url: String(row.cv_url || row.url || '').trim() || null,
            clients_summary: String(row.clients_summary || row.profile_summary || '').trim() || null,
            professional_headline: String(row.professional_headline || '').trim() || null,
            industries: JSON.stringify(parseJson(row.industries, 'industries', item.rowNumber, [])),
            skills: parseJson(row.skills, 'skills', item.rowNumber, []),
            projects: parseJson(row.projects, 'projects', item.rowNumber, []),
            work_experiences: parseJson(row.work_experiences, 'work_experiences', item.rowNumber, []),
            education: parseJson(row.education, 'education', item.rowNumber, []),
            certification: parseJson(row.certifications, 'certifications', item.rowNumber, []),
            languages: parseLanguages(row.languages),
          }, { transaction });

          const moduleRows = [
            ...coreModuleIds.map(module_id => ({ user_id: newUser.id, module_id, is_primary: true })),
            ...otherModuleIds.map(module_id => ({ user_id: newUser.id, module_id, is_primary: false })),
          ];
          if (moduleRows.length) {
            await this.consultantModuleModel.bulkCreate(moduleRows, { transaction });
          }
          return newUser;
        });
        created.push({ row: item.rowNumber, user_id: user.id, email });
      } catch (error) {
        failed.push({
          row: item.rowNumber,
          email,
          error: error instanceof Error ? error.message : 'Profile import failed',
        });
      }
    }

    return {
      message: 'Reviewed consultant profiles import completed',
      data: {
        total: rows.length,
        created_count: created.length,
        skipped_count: skipped.length,
        failed_count: failed.length,
        created,
        skipped,
        failed,
      },
    };
  }

  async readExcelWithDriveProfiles(file: any) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(file.buffer) as any);
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
