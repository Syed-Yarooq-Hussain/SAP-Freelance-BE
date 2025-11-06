import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Meeting } from '../models/meeting.model';
import { MeetingInvitee } from '../models/meeting-invitee.model';

@Injectable()
export class MeetingRepository {
  constructor(
    @InjectModel(Meeting)
    private readonly meetingModel: typeof Meeting,

    @InjectModel(MeetingInvitee)
    private readonly inviteeModel: typeof MeetingInvitee,
  ) {}

  async createMeeting(meetingData: Partial<Meeting>): Promise<Meeting> {
    return this.meetingModel.create(meetingData);
  }

  async findAllMeetings(): Promise<Meeting[]> {
    return this.meetingModel.findAll({ include: [MeetingInvitee] });
  }

  async findMeetingById(id: number): Promise<Meeting> {
    return this.meetingModel.findOne({
      where: { id },
      include: [MeetingInvitee],
    });
  }

  async updateMeeting(id: number, updates: Partial<Meeting>): Promise<[number, Meeting[]]> {
    return this.meetingModel.update(updates, { where: { id }, returning: true });
  }

  async deleteMeeting(id: number): Promise<number> {
    return this.meetingModel.destroy({ where: { id } });
  }

  async addInvitee(inviteeData: Partial<MeetingInvitee>): Promise<MeetingInvitee> {
    return this.inviteeModel.create(inviteeData);
  }

  async getInvitees(meetingId: number): Promise<MeetingInvitee[]> {
    return this.inviteeModel.findAll({ where: { meeting_id: meetingId } });
  }
}
