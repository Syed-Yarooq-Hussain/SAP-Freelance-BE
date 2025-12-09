import { Injectable, NotFoundException} from '@nestjs/common';
import { CreateCommonDto } from './dto/create-common.dto';
import { UpdateCommonDto } from './dto/update-common.dto';
import { CreateMeetingDto } from './dto/meeting-invite.dto';
import { MeetingRepository } from 'repository/meeting.repository';
import { ConsultantStatus, MEETING_STATUS_ARRAY, MeetingType } from 'constant/enums';
import { ProjectConsultantRepository } from 'repository/project-consultant.repository';
import { getAllMeetingResponse } from './transformer/meeting.transformer';
import { EmailService } from 'src/common/emails/email.service';
import * as path from 'path';
import * as fs from 'fs';
import * as PDFDocument from 'pdfkit';
import axios from 'axios';

@Injectable()
export class CommonService {
  constructor(
    private readonly meetingRepo: MeetingRepository, 
    private readonly projectConsultantRepo: ProjectConsultantRepository,
    private readonly emailService: EmailService) {}
  private industry = [
    {id:1, name:"Information tecnology"},
    {id:2, name:"Healthcare"}
  ]

  // 🔹 Create new entry
  createIndustry(dto: CreateCommonDto) {
    const newIndustry = { id: Date.now(), ...dto };
    this.industry.push(newIndustry);
    return {
      message: "Industry created successfully",
      data: newIndustry
    };
  }

  // 🔹 Get all entries
  getAllIndustry() {
    return{
      message: "Industry created successfully",
      data: this.industry
    };
  }
  
  getMeetingStatus() {
    return MEETING_STATUS_ARRAY
  }

  // 🔹 Update entry by ID
  updateIndustry(id:number, dto: UpdateCommonDto) {
    const index = this.industry.findIndex((i) => i.id === id);
    if (index === -1){return {massage: "Industry not found"};}
    this.industry[index] = { ...this.industry[index], ...dto };
    return {
      message: 'Industry updated successfully',
      data: this.industry[index],
    };
  } 

  async sendInvite(dto: CreateMeetingDto, sender_id: number) {

  if(dto.event_type.toLowerCase() === MeetingType.INTERVIEW) {
    for (const userId of dto.invitees_id) {
      const where= { project_id: dto.project_id, consultant_id: userId }; 
      await this.projectConsultantRepo.update(where, {status: ConsultantStatus.INTERVIEW_SCHEDULED});
    }

  }

  const meeting = await this.meetingRepo.createMeeting({
    sender_id,
    url: `https://meet.com/${Date.now()}`, // or any auto-generated link logic
    date_time: new Date(dto.date_time),
    duration: dto.duration,
    status: 'Pending',
    event_type: dto.event_type,
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

async updateMeetingStatus(meetingId: number, status: string) {
  const meeting = await this.meetingRepo.findMeetingById(meetingId);
  if (!meeting) {
    throw new Error('Meeting not found');
  }

  meeting.status = status;
  await meeting.save();

  return {
    message: 'Meeting status updated successfully',
    meeting,
  };
}

async getAllMeeting(userId: number) {
    const meetings = await this.meetingRepo.getMeetingWithDetails(userId);
    const transformedData = getAllMeetingResponse(meetings)
    return transformedData
  }

async sendEmail(body) {
  const { to, type } = body;
  if (!to || !type) {return { status: false, message: "Missing required fields: to/type" };}
  return await this.emailService.sendEmail(to, type);
}


async generatePdf(req, data: { text?: string; imagePath?: string; title?: string }) {

  const pdfFolder = path.join(process.cwd(), 'pdf');
  if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder)

  const fileName = `file-${Date.now()}.pdf`;
  const filePath = path.join(pdfFolder, fileName);

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  if (data.title) doc.fontSize(20).text(data.title).moveDown();
  if (data.text) doc.fontSize(14).text(data.text).moveDown();

  if (data.imagePath) {
    try {
      let imageBuffer;

      if (data.imagePath.startsWith('http')) {
        const response = await axios.get(data.imagePath, { responseType: 'arraybuffer' });
        imageBuffer = Buffer.from(response.data);
      } else if (fs.existsSync(data.imagePath)) {
        imageBuffer = fs.readFileSync(data.imagePath);
      }

      if (imageBuffer) {
        doc.image(imageBuffer, {
          fit: [400, 400],
          align: 'center',
          valign: 'center',
        });
        doc.moveDown();
      }
    } catch (error) {
      console.log("Image Error:", error.message);
    }
  }
  doc.end();

  const pdfUrl = `http://localhost:3000/pdf/${fileName}`;
  return { pdfUrl };
}
}