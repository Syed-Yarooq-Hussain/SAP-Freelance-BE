import { Injectable } from '@nestjs/common';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { UpdateConsultantDto } from './dto/update-consultant.dto';
import { GetConsultantDto } from './dto/get-consultant.dto';
import * as bcrypt from 'bcrypt';
import { ProjectConsultantRepository } from 'repository/project-consultant.repository';
import { getConsultantProjectsResponse } from './transformer/consultant.transformer';
import { ConsultantRepository } from 'repository/consultant.repository';
import { buildMonthlySchedule } from '../common/calender/monthly.util';
import { MeetingRepository } from 'repository/meeting.repository';
import { groupEventsByDate, mergeEventsIntoSchedule } from 'src/common/calender/events.util';
import { User } from 'models/user.model';
import { UpdateConsultantDetailDto } from 'src/auth/dto/register-consultant.dto';
import { CustomError } from 'src/config/custom-error.exception';
import { ConsultantModuleRepository } from 'repository/consultant-module.repository';
import { UserRepository } from 'repository/user.repository';

@Injectable()
export class ConsultantService {
  constructor(
      private readonly projectConsultantRepo: ProjectConsultantRepository,
      private readonly consultantRepository: ConsultantRepository,
      private readonly meetingRepo: MeetingRepository,
      private readonly consultantModuleRepo: ConsultantModuleRepository,
      private readonly userRepo: UserRepository,
    ) {}
  private consultants: GetConsultantDto[] = [
    {id: 1, name: 'Alice Khan', email: 'alice@example.com', expertise: 'FrontendDeveloper',password:"" },
    { id: 2, name: 'Bob Ahmed', email: 'bob@example.com', expertise: 'Backend Developer',password:"" },
  ];

  async create(dto: CreateConsultantDto) {
    if (!dto.password) {
      throw new Error('Password is required');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newConsultant: GetConsultantDto = {
      id: Date.now(),
      ...dto,
      password: hashedPassword,
    };

    this.consultants.push(newConsultant);
    return newConsultant;
  }

  findAll(): GetConsultantDto[] {
    return this.consultants;
  }

  findOne(id: number): GetConsultantDto | undefined {
    return this.consultants.find((c) => c.id === id);
  }

  update(id: number, dto: UpdateConsultantDto): GetConsultantDto | null {
    const index = this.consultants.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.consultants[index] = { ...this.consultants[index], ...dto };
    return this.consultants[index];
  }

  remove(id: number) {
    this.consultants = this.consultants.filter((c) => c.id !== id);
    return { deleted: true };
  }
  
  
  async getProjectByConsultantId(id: number) {
    let consultantProjectsList = await this.projectConsultantRepo.findByConsultantId(id);

    const consultantProjects = getConsultantProjectsResponse(consultantProjectsList);

    return consultantProjects;
  }
  
  
  async getScheduleByConsultantId(id: number) {
    const booking_schedule = await this.projectConsultantRepo.findBookingScheduleByConsultantId(id);
    const consultant_schedule = await this.consultantRepository.findByUserId(id);

    return {booking_schedule, consultant_schedule};
  }
  
  async getConsultantPayments(id: number) {

    return [
        {
            "id": "1",
            "project_id": "1",
            "project_milestone_id": null,
            "doc_id": null,
            "amount": 200,
            "payment_module": "custom",
            "is_paid": false,
            "deleted_at": null,
            "project": {
                "id": "1",
                "name": "p1",
                "consultant_id": id,
                "company_name": "ABC test",
                "status": "initiated",
                "deleted_at": null
            },
            "due_date": "2026-02-28T14:30:00.000Z"
        }
    ];
  }

  async getConsultantDetail(id: number) {
    return await this.consultantRepository.findConsultantProfileByUserId(id);
  }
  
  async setConsultantSchedule(id: number, body: any) {
    await this.consultantRepository.updateByUserId(id, {working_schedule: body});
    return body;
  }

  async getConsultantSchedule(id: number, month: number, year: number) {
  const consultant = await this.consultantRepository.getSchedulesByUserId(id);

  const meetings =
    await this.meetingRepo.getMeetingWithDetails(id);

  const monthlySchedule = await buildMonthlySchedule(
    year,
    month,
    consultant.working_schedule
  );

  const workingSchedule = consultant.working_schedule as {
    events?: any[];
  };

  const storedEvents = Array.isArray(workingSchedule?.events)
    ? workingSchedule.events
    : [];

  const allEvents = [...meetings, ...storedEvents];

  const eventsByDate = groupEventsByDate(allEvents);

  return mergeEventsIntoSchedule(monthlySchedule, eventsByDate);
  }

  // update consultant 
    async updateConsultant(user_id: number, updateDto: UpdateConsultantDetailDto) {
    // ✅ Step 1: Find User
    const user = await User.findOne({ where: { id: user_id } });
    if (!user) {
      throw new CustomError(404, 'User not found');
    }
  
    // ✅ Step 2: Update User fields if provided
    const userFields: Partial<User> = {};
    if (updateDto.user?.username) userFields.username = updateDto.user.username;
    if (updateDto.user?.email) userFields.email = updateDto.user.email;
    if (updateDto.user?.phone) userFields.phone = updateDto.user.phone;
    if (updateDto.user?.city) userFields.city = updateDto.user.city;
    if (updateDto.user?.country) userFields.country = updateDto.user.country;
    if (updateDto.user?.currency) userFields.currency = updateDto.user.currency;
  
    // Optional: password update
    if (updateDto.user?.password) {
      userFields.password = await bcrypt.hash(updateDto.user.password, 10);
    }
  
    if (Object.keys(userFields).length) {
      await this.userRepo.updateUser(user_id, userFields);
    }
  
    // ✅ Step 3: Update Consultant details
    const consultant = await this.consultantRepository.findByUserId(user_id);
    if (!consultant) {
      throw new CustomError(404, 'Consultant details not found');
    }
  
    const consultantFields: Partial<any> = {};
  
    if (updateDto.consultant?.module) consultantFields.module = updateDto.consultant.module;
    if (updateDto.consultant?.level) consultantFields.level = updateDto.consultant.level;
    if (updateDto.consultant?.experience !== undefined)
      consultantFields.experience = updateDto.consultant.experience;
    if (updateDto.consultant?.rate !== undefined) consultantFields.rate = updateDto.consultant.rate;
    if (updateDto.consultant?.weekly_available_hours !== undefined)
      consultantFields.weekly_available_hours = updateDto.consultant.weekly_available_hours;
  
    // ✅ Working schedule comes directly from FE
      if (updateDto.consultant?.working_schedule)
        consultantFields.working_schedule = updateDto.consultant.working_schedule;
  
      if (updateDto.consultant?.cv_url) consultantFields.cv_url = updateDto.consultant.cv_url;
      if (updateDto.consultant?.clients_summary) consultantFields.clients_summary = updateDto.consultant.clients_summary;
      if (updateDto.consultant?.skills) consultantFields.skills = updateDto.consultant.skills;
      if (updateDto.consultant?.education) consultantFields.education = updateDto.consultant.education;
      if (updateDto.consultant?.certification) consultantFields.certification = updateDto.consultant.certification;
      if (updateDto.consultant?.work_experiences) consultantFields.work_experiences = updateDto.consultant.work_experiences;
      if (updateDto.consultant?.languages) consultantFields.languages = updateDto.consultant.languages;
  
      if (Object.keys(consultantFields).length) {
        await this.consultantRepository.updateByUserId(user_id, consultantFields);
      }
  
      // ✅ Step 4: Update Modules if provided
      if (updateDto.consultant?.core_module?.length) {
        await this.consultantModuleRepo.updateModule({
          user_id,
          module_id: +updateDto.consultant.core_module[0],
          is_primary: true,
        });
      }
  
      if (updateDto.consultant?.other_module?.length) {
        await this.consultantModuleRepo.updateModule({
          user_id,
          module_id: +updateDto.consultant.other_module[0],
          is_primary: false,
        });
      }
  
      // ✅ Step 5: Return Updated User without password
      const updatedUser = await User.findOne({ where: { id: user_id } });
      if (updatedUser) (updatedUser as any).password = undefined;
  
      return updatedUser;
    }

}

