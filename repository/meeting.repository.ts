import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Meeting } from '../models/meeting.model';
import { MeetingInvitee } from '../models/meeting-invitee.model';
import { User } from 'models/user.model';
import { Project } from 'models/project.model';
import { Op } from 'sequelize';

@Injectable()
export class MeetingRepository {
  getConsultantMeetings(consultantId: number) {
    throw new Error('Method not implemented.');
  }
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

  async deleteBySenderId(userId: number): Promise<number> {
    return this.meetingModel.destroy({ where: { sender_id: userId } });
  }

  async deleteInviteesByUserId(userId: number): Promise<number> {
    return this.inviteeModel.destroy({ where: { user_id: userId } });
  }

  async getMeetingWithDetails(
    user_id: number,
    type?: 'interview' | 'all',
  ) {
    const whereCondition: any = {
      deleted_at: null,
      [Op.or]: [
        { sender_id: user_id },
        { '$invitees.user_id$': user_id },
      ],
    };

    // 👉 sirf jab interview chahiye
    if (type === 'interview') {
      whereCondition.event_type = 'interview';
    }

    return this.meetingModel.findAll({
      where: whereCondition,
      distinct: true,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: Project,
          attributes: ['id', 'name', 'status'],
        },
        {
          model: MeetingInvitee,
          as: 'invitees',
          required: false,
          attributes: ['id', 'user_id'],
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'email'],
            },
          ],
        },
      ],
    } as any);
  }


  async getAllConsultantInterviews(consultant_id: number) {
    return this.inviteeModel.findAll({
      where: { user_id: consultant_id },
      include: [
        {
          model: Meeting,
          attributes: ['id', 'title', 'start_time', 'end_time'],
        },
      ],
    });
  }
}
