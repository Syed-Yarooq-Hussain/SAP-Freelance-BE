import { Injectable } from '@nestjs/common';
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

@Injectable()
export class CommonService {
  constructor(
    private readonly meetingRepo: MeetingRepository,
    private readonly projectConsultantRepo: ProjectConsultantRepository,
    private readonly consultantRepo: ConsultantRepository,
    private readonly moduleRepo: ModuleRepository
  ) { }
  private industry = [
    { id: 1, name: "Information tecnology" },
    { id: 2, name: "Healthcare" }
  ]

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

  // 🔹 Create New Entry
  createIndustry(dto: CreateCommonDto) {
    const newIndustry = { id: Date.now(), ...dto };
    this.industry.push(newIndustry);
    return {
      message: "Industry created successfully",
      data: newIndustry
    };
  }

  // 🔹 Get All Entries
  getAllIndustry() {
    return {
      message: "Industry created successfully",
      data: this.industry
    };
  }

  getMeetingStatus() {
    return MEETING_STATUS_ARRAY
  }

  // 🔹 Update Entry By Id
  updateIndustry(id: number, dto: UpdateCommonDto) {
    const index = this.industry.findIndex((i) => i.id === id);
    if (index === -1) { return { massage: "Industry not found" }; }
    this.industry[index] = { ...this.industry[index], ...dto };
    return {
      message: 'Industry updated successfully',
      data: this.industry[index],
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
    const { to, type, receiverName, senderName } = body;

    if (!to || !type || !receiverName || !senderName)
      return { status: false, message: "Missing required fields" };

    return await sendEmail(to, type, receiverName, senderName);
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
  
}