import { Injectable} from '@nestjs/common';
import { CreateCommonDto } from './dto/create-common.dto';
import { UpdateCommonDto } from './dto/update-common.dto';
import { CreateMeetingDto } from './dto/meeting-invite.dto';
import { MeetingRepository } from 'repository/meeting.repository';
import { MEETING_STATUS_ARRAY } from 'constant/enums';

@Injectable()
export class CommonService {
  constructor(private readonly meetingRepo: MeetingRepository) {}
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
    return{
      message: "list of meeting status fetched successfully",
      data: MEETING_STATUS_ARRAY
    };
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

}