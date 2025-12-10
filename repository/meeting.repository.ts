import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Meeting } from '../models/meeting.model';
import { MeetingInvitee } from '../models/meeting-invitee.model';
import { User } from 'models/user.model';
import { Project } from 'models/project.model';
import { Op } from 'sequelize';

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

  async getMeetingWithDetails(user_id: number) {
  return this.meetingModel.findAll({
    where: {
      deleted_at: null,
      [Op.or]: [
        { sender_id: user_id },
        { '$invitees.user_id$': user_id },
      ],
    },
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
}
