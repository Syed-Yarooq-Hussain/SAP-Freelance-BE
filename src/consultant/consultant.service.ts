import { Injectable } from '@nestjs/common';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { UpdateConsultantDto } from './dto/update-consultant.dto';
import { GetConsultantDto } from './dto/get-consultant.dto';
import * as bcrypt from 'bcrypt';
import { ProjectConsultantRepository } from 'repository/project-consultant.repository';
import { getConsultantleftSideBar, getConsultantProjectsResponse } from './transformer/consultant.transformer';
import { ConsultantRepository } from 'repository/consultant.repository';
import { buildMonthlySchedule } from '../common/calender/monthly.util';
import { MeetingRepository } from 'repository/meeting.repository';
import { groupEventsByDate, mergeEventsIntoSchedule } from 'src/common/calender/events.util';
import { User } from 'models/user.model';
import { UpdateConsultantDetailDto } from 'src/auth/dto/register-consultant.dto';
import { CustomError } from 'src/config/custom-error.exception';
import { ConsultantModuleRepository } from 'repository/consultant-module.repository';
import { UserRepository } from 'repository/user.repository';
import { CommonService } from 'src/utility/common.service';
import { ChatRepository } from 'repository/chat.repository';
import { ProjectTaskRepository } from 'repository/project-task.repository';
import { profile } from 'console';
import { create } from 'domain';
import { ConsultantMonthlyBillRepository } from 'repository/consultant-monthly-bill.repository';
import { groupBillsByMonth } from './transformer/monthly-bill.transformer';
import { createThreeMonthScheduleWindow } from 'src/common/calender/schedule-window.util';
@Injectable()
export class ConsultantService {
  constructor(
      private readonly projectConsultantRepo: ProjectConsultantRepository,
      private readonly consultantRepository: ConsultantRepository,
      private readonly meetingRepo: MeetingRepository,
      private readonly consultantModuleRepo: ConsultantModuleRepository,
      private readonly userRepo: UserRepository,
      private readonly chatRepo: ChatRepository,
      private readonly projectTaskRepo: ProjectTaskRepository,
      private readonly monthlyBillRepo: ConsultantMonthlyBillRepository,
      private readonly commonService: CommonService
    ) {}

  private roundAmount(value: number): number {
    return Math.round(Number(value) || 0);
  }

  private normalizeLinkedInProfileUrl(url: string): string {
    const normalized = url.trim().replace(/\/+$/, '');
    const isValidLinkedInProfile =
      /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+$/i.test(normalized);

    if (!isValidLinkedInProfile) {
      throw new CustomError(400, 'Please provide a valid LinkedIn profile URL');
    }

    return normalized;
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

    return [];
  }

  async getConsultantMonthlyBills(id: number) {
    const bills = await this.monthlyBillRepo.findByConsultant(id);
    return groupBillsByMonth(bills);
  }

  async getConsultantDetail(id: number) {
  const user = await this.consultantRepository.findConsultantProfileByUserId(id);

    if (!user) return null;

    let consultant = user.toJSON();
    let module = { core: '', others: '' };

    // modules combine
    for (const mod of consultant?.user?.modules || []) {
      if (!mod?.module) continue;

      if (mod.is_primary) {
        module.core += mod.module.name + ', ';
      } else {
        module.others += mod.module.name + ', ';
      }
    }

    module.core = module.core.replace(/, $/, '');
    module.others = module.others.replace(/, $/, '');

    // BADGES LOGIC
    const badges = consultant.badges || [];

    // VERIFIED
    if (
      consultant.user?.email ||
      consultant.user?.phone ||
      consultant.user?.linkedin_url
    ) {
      badges.push('VERIFIED');
    }

    // CERTIFIED
    if (consultant.is_certified) {
      badges.push('CERTIFIED');
    }

    // EXPERIENCE
    if (consultant.experience > 0 && consultant.experience < 1) {
      badges.push('JUNIOR');
    } else if (consultant.experience >= 1 && consultant.experience < 3) {
      badges.push('ASSOCIATE');
    } else if (consultant.experience >= 3 && consultant.experience < 6) {
      badges.push('MID_LEVEL');
    } else if (consultant.experience >= 6 && consultant.experience < 9) {
      badges.push('SENIOR');
    } else if (consultant.experience >= 9 && consultant.experience < 12) {
      badges.push('PRINCIPAL');
    } else if (consultant.experience >= 12) {
      badges.push('SOLUTION_ARCHITECT');
    }

    // remove duplicates
    const uniqueBadges = Array.from(new Set(badges));

    return {
      ...consultant,
      badges: uniqueBadges,
      user: {
        ...consultant.user,
        module,
        loginWithLinkedin: Boolean(consultant.user?.linkedin_sso_connected),
      },
    };
  }

  async deleteConsultantProfile(userId: number) {
    const consultant = await this.consultantRepository.findByUserId(userId);
    if (!consultant) {
      throw new CustomError(404, 'Consultant profile not found');
    }

    await this.consultantModuleRepo.delete(userId);
    await this.projectConsultantRepo.deleteByConsultantId(userId);
    await this.meetingRepo.deleteBySenderId(userId);
    await this.meetingRepo.deleteInviteesByUserId(userId);
    await this.chatRepo.deleteByUserId(userId);
    await this.projectTaskRepo.clearAssignee(userId);
    await this.consultantRepository.deleteByUserId(userId);
    await this.userRepo.deleteUser(userId);

    return {
      message: 'Consultant user and consultant-related records deleted safely',
      userId,
      consultantId: consultant.id,
    };
  }

  private normalizeSchedulePayload(body: any) {
    const payload = body?.working_schedule || body?.schedule || body || {};

    return {
      weekly: Array.isArray(payload.weekly) ? payload.weekly : [],
      custom: Array.isArray(payload.custom)
        ? payload.custom
        : payload.date
          ? [payload]
          : [],
      effective_from: payload.effective_from,
      effective_to: payload.effective_to,
    };
  }

  private mergeSchedule(existingSchedule: any, scheduleUpdate: any) {
    const existing = {
      weekly: Array.isArray(existingSchedule?.weekly) ? existingSchedule.weekly : [],
      custom: Array.isArray(existingSchedule?.custom) ? existingSchedule.custom : [],
    };

    const update = this.normalizeSchedulePayload(scheduleUpdate);

    const weeklyByDay = new Map<string, any>();
    for (const item of existing.weekly) {
      if (item?.day) weeklyByDay.set(item.day, item);
    }
    for (const item of update.weekly) {
      if (item?.day) weeklyByDay.set(item.day, item);
    }

    const customByDate = new Map<string, any>();
    for (const item of existing.custom) {
      if (item?.date) customByDate.set(item.date, item);
    }
    for (const item of update.custom) {
      if (item?.date) customByDate.set(item.date, item);
    }

    return {
      effective_from:
        update.effective_from ||
        existingSchedule?.effective_from ||
        undefined,
      effective_to:
        update.effective_to ||
        existingSchedule?.effective_to ||
        undefined,
      weekly: Array.from(weeklyByDay.values()),
      custom: Array.from(customByDate.values()).sort((a, b) =>
        String(a.date).localeCompare(String(b.date)),
      ),
    };
  }

  private generateWeekSchedule(totalHours: number) {
    const weekdays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    const dailyHours = Number(totalHours || 0) / 5;
    const startHour = 9;
    const endHour = startHour + dailyHours;

    const formatTime = (hour: number) => {
      const h = Math.floor(hour);
      const m = Math.round((hour - h) * 60);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    return {
      ...createThreeMonthScheduleWindow(),
      weekly: weekdays.map((day) => {
        if (day === 'Saturday' || day === 'Sunday' || dailyHours <= 0) {
          return { day, active: false, slot: [] };
        }

        return {
          day,
          active: true,
          slot: [{ start: formatTime(startHour), end: formatTime(endHour) }],
        };
      }),
      custom: [],
    };
  }

  async setConsultantSchedule(id: number, body: any) {
    const consultant = await this.consultantRepository.getSchedulesByUserId(id);
    const mergedSchedule = this.mergeSchedule(consultant?.working_schedule, body);
    const update = this.normalizeSchedulePayload(body);

    if (update.weekly.length && !update.effective_from && !update.effective_to) {
      Object.assign(mergedSchedule, createThreeMonthScheduleWindow());
    }

    await this.consultantRepository.updateByUserId(id, {
      working_schedule: mergedSchedule,
    });

    return mergedSchedule;
  }

  async getConsultantSchedule(id: number, month: number, year: number) {
  const consultant = await this.consultantRepository.getSchedulesByUserId(id);

  const meetings =
    await this.meetingRepo.getMeetingWithDetails(id);

  const monthlySchedule = await buildMonthlySchedule(year, month, consultant?.working_schedule || { weekly: [], custom: [] });

  const eventsByDate = groupEventsByDate(meetings);

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
    if (updateDto.user?.linkedin_url) {
      userFields.linkedin_url = this.normalizeLinkedInProfileUrl(
        updateDto.user.linkedin_url,
      );
    }
  
    if (updateDto.user && Object.prototype.hasOwnProperty.call(updateDto.user, 'avatar')) { 
      userFields.avatar = updateDto.user.avatar ?? ''; 
    }

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
      if (updateDto.consultant?.working_schedule) {
        const mergedSchedule = this.mergeSchedule(
          consultant.working_schedule,
          updateDto.consultant.working_schedule,
        );
        const scheduleUpdate = this.normalizeSchedulePayload(
          updateDto.consultant.working_schedule,
        );

        if (
          scheduleUpdate.weekly.length &&
          !scheduleUpdate.effective_from &&
          !scheduleUpdate.effective_to
        ) {
          Object.assign(mergedSchedule, createThreeMonthScheduleWindow());
        }

        consultantFields.working_schedule = mergedSchedule;
      } else if (updateDto.consultant?.weekly_available_hours !== undefined) {
        consultantFields.working_schedule = this.generateWeekSchedule(
          Number(updateDto.consultant.weekly_available_hours || 0),
        );
      }
  
      if (updateDto.consultant?.cv_url) consultantFields.cv_url = updateDto.consultant.cv_url;
      if (updateDto.consultant?.clients_summary) consultantFields.clients_summary = updateDto.consultant.clients_summary;
      if (updateDto.consultant?.skills) consultantFields.skills = updateDto.consultant.skills;
      if (updateDto.consultant?.education) consultantFields.education = updateDto.consultant.education;
      if (updateDto.consultant?.certification) consultantFields.certification = updateDto.consultant.certification;
      if (updateDto.consultant?.work_experiences) consultantFields.work_experiences = updateDto.consultant.work_experiences;
      if (updateDto.consultant?.projects) consultantFields.projects = updateDto.consultant.projects;
      if (updateDto.consultant?.languages) consultantFields.languages = updateDto.consultant.languages;
      if (updateDto.consultant?.industries) consultantFields.industries = updateDto.consultant.industries;
      if (updateDto.consultant?.professional_headline) consultantFields.professional_headline = updateDto.consultant.professional_headline;
      if (updateDto.consultant?.expertise_level) consultantFields.expertise_level = updateDto.consultant.expertise_level;
      if (Object.keys(consultantFields).length) {
        await this.consultantRepository.updateByUserId(user_id, consultantFields);
      }

      // ✅ Step 4: Update Modules if provided
      const coreModules = updateDto.consultant?.core_module || [];
        const otherModules = updateDto.consultant?.other_module || [];

        const allModules = [
          ...coreModules.map(id => ({ module_id: +id, is_primary: true })),
          ...otherModules.map(id => ({ module_id: +id, is_primary: false })),
        ];

        // delete old
        await this.consultantModuleRepo.delete( user_id );

        // insert new
        if (allModules.length) {
          await this.consultantModuleRepo.bulkCreateModules(
            allModules.map(m => ({
              user_id,
              module_id: m.module_id,
              is_primary: m.is_primary,
            }))
          );
        }
  
      // ✅ Step 5: Return Updated User without password
      const updatedUser = await User.findOne({ where: { id: user_id } });
      if (updatedUser) (updatedUser as any).password = undefined;
  
      return updatedUser;
    }

    async getConsultantStats(consultantId: number) {
      const meetings = await this.meetingRepo.getMeetingWithDetails(
        consultantId,
        'interview',
      );

      const projects =
        await this.projectConsultantRepo.findByConsultantId(consultantId);

      const consultant =
        await this.consultantRepository.findByUserId(consultantId);

      const now = new Date();

      /* =========================
        MEETING STATS (REAL)
      ========================= */

      const meetings_stats = {
        interview_requests: meetings.length,

        upcoming_interviews: meetings.filter(
          m =>
            m.status === 'Pending' &&
            new Date(m.date_time) > now,
        ).length,

        rescheduled_interviews: meetings.filter(
          m => m.status === 'Rescheduled',
        ).length,

        cancelled_interviews: meetings.filter(
          m => m.status === 'Cancelled',
        ).length,
      };

      /* =========================
        DASHBOARD STATS
      ========================= */

      const stats = {
        dashboard: {
          appeared_in_search: meetings.length * 3, // placeholder logic
          interview_schedule: meetings_stats.upcoming_interviews,

          projected_monthly_revenue:
            consultant?.weekly_available_hours && consultant?.rate
              ? this.roundAmount(consultant.weekly_available_hours * consultant.rate)
              : 0,

          total_earnings:
            projects?.[0]?.requested_hours && consultant?.rate
              ? this.roundAmount(projects[0].requested_hours * consultant.rate)
              : 0,
        },

        /* =========================
          PROJECT STATS
        ========================= */

        projects_stats: {
          current: {
            project: projects?.[0]?.project?.name || 'N/A',
            employeer:
              projects?.[0]?.project?.client?.username || 'N/A',
            project_info: projects?.[0]?.project?.projectDetails
              ? `${projects[0].project.projectDetails.start_date.toDateString()} 
                to ${projects[0].project.projectDetails.end_date.toDateString()},
                Role: ${projects[0].role}`
              : 'N/A',
          },

          upcoming: {
            project: projects?.[1]?.project?.name || 'N/A',
            employeer:
              projects?.[1]?.project?.client?.username || 'N/A',
            project_info: projects?.[1]?.project?.projectDetails
              ? `${projects[1].project.projectDetails.start_date.toDateString()} 
                to ${projects[1].project.projectDetails.end_date.toDateString()},
                Role: ${projects[1].role}`
              : 'N/A',
          },

          task: {
            total: projects?.[0]?.project ? 10 : 0,
            pending: projects?.[0]?.project ? 0 : 2,
          },
        },

        meetings_stats,
      };

      return stats;
    }


    async getSideBarStats(consultantId: number) {
      let consultants = await this.consultantRepository.findByUserId(consultantId);
      let consultantProjects = await this.projectConsultantRepo.findByConsultantId(consultantId);

      let resp = getConsultantleftSideBar({consultants, projects: consultantProjects});
      
      return resp
    }
    
    
    async uploadProfileImage(consultantId: number, file: Express.Multer.File) {
      let consultants = await this.userRepo.findById(consultantId);
      if (!consultants) {
        throw new CustomError(404, 'Consultant not found');
      }
      let key = await this.commonService.uploadToS3({
        file: file.buffer,
        folder: 'profiles',
        filename: file.originalname,
        mimetype: file.mimetype,
      });

      await this.userRepo.updateUser(consultantId, { avatar: key });
      
      return key
    }
    
    /* async getDashboradData(consultantId: number) {
      let consultants = {
        calender:{
          weekly_availability: 20,
          interview_schedule: 5,
          next_interview: new Date()
        },
        projects: {
          total_projects: 5,
          active: 2,
          projects: ['Project A', 'Project B', 'Project C', 'Project D', 'Project E', 'Project F'],
        },
        payment: {
          next_payment: 8500,
          projected_earning: 10000,
        },
        documents: {
          pending: 2,
          upcoming: 1,
        },
        profile: {
          profile_strength: '80%',
          badges: ['VERIFIED', 'CERTIFIED', 'EXPERT'],
        }
      }
      
      return consultants
      
    } */

      async getDashboradData(consultantId: number) {

        const meetings = await this.meetingRepo.getMeetingWithDetails(
          consultantId,
          'interview',
        );

        const projects =
          await this.projectConsultantRepo.findByConsultantId(consultantId);

        const consultant =
          await this.consultantRepository.findByUserId(consultantId);
        const now = new Date();

        /* =========================
            CALENDAR
        ========================= */

        const upcomingMeetings = meetings
          .filter(m => new Date(m.date_time) > now)
          .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

        const calendar = {
          weekly_availability: consultant?.weekly_available_hours || 0,
          interview_schedule: upcomingMeetings.length,
          next_interview: upcomingMeetings[0]?.date_time || null
        };

        /* =========================
            PROJECTS
        ========================= */

        const activeProjects = projects.filter(p =>
          p?.project?.projectDetails?.end_date
            ? new Date(p.project.projectDetails.end_date) > now
            : false
        );

        const projectNames = projects.map(p => p?.project?.name).filter(Boolean);

        const projectData = {
          total_projects: projects.length,
          active: activeProjects.length,
          projects: projectNames
        };

        /* =========================
            PAYMENTS
        ========================= */

        const projectedEarning =
          consultant?.weekly_available_hours && consultant?.rate
            ? this.roundAmount(consultant.weekly_available_hours * consultant.rate * 12)
            : 0;

        const bills = await this.monthlyBillRepo.findByConsultant(consultantId);
        const totalEarnings = bills
          .filter(bill => bill.is_paid)
          .reduce((sum, bill) => sum + (bill.amount || 0), 0);

        const nextUnpaidBill = bills.slice().reverse().find(bill => !bill.is_paid);
        const nextPayment = nextUnpaidBill ? nextUnpaidBill.amount : 0;

        const payment = {
          next_payment: nextPayment,
          projected_earning: projectedEarning,
          total_earnings: totalEarnings,
        };

        /* =========================
            DOCUMENTS (placeholder logic)
        ========================= */

        const documents = {
          pending: 0,
          upcoming: 0
        };

        /* =========================
            PROFILE
        ========================= */
        const badges = consultant.badges || [];

        // VERIFIED
        if (
          consultant.user?.email ||
          consultant.user?.phone ||
          consultant.user?.linkedin_url
        ) {
          badges.push('VERIFIED');
        }

        // CERTIFIED
        if (consultant.is_certified) {
          badges.push('CERTIFIED');
        }

        // EXPERIENCE
        if (consultant.experience >= 0 && consultant.experience < 1) {
          badges.push('JUNIOR');
        } else if (consultant.experience >= 1 && consultant.experience < 3) {
          badges.push('ASSOCIATE');
        } else if (consultant.experience >= 3 && consultant.experience < 6) {
          badges.push('MID_LEVEL');
        } else if (consultant.experience >= 6 && consultant.experience < 9) {
          badges.push('SENIOR');
        } else if (consultant.experience >= 9 && consultant.experience < 12) {
          badges.push('PRINCIPAL');
        } else if (consultant.experience >= 12) {
          badges.push('SOLUTION_ARCHITECT');
        }
        

        // remove duplicates
        const uniqueBadges = Array.from(new Set(badges));
        const profile = {
         // profile_strength: consultant?.profile_strength || '0%',
          badges: uniqueBadges
        };

        return {
          calender: calendar,
          projects: projectData,
          payment,
          documents,
          profile
        };
      }

      private hasProfileValue(value: any): boolean {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        if (typeof value === 'number') return value > 0;
        if (typeof value === 'boolean') return value;
        if (value && typeof value === 'object') return Object.keys(value).length > 0;
        return value !== null && value !== undefined;
      }

      private getProfileFieldChecks(consultant: any) {
        const modules = consultant?.user?.modules?.filter((m: any) => m?.deleted_at == null) ?? [];
        const coreModules = modules.filter((module: any) => module?.is_primary);
        const otherModules = modules.filter((module: any) => !module?.is_primary);

        return {
          photo: this.hasProfileValue(consultant?.user?.avatar),
          email: this.hasProfileValue(consultant?.user?.email),
          phone: this.hasProfileValue(consultant?.user?.phone),
          professional_headline: this.hasProfileValue(consultant?.professional_headline),
          linkedin_url: this.hasProfileValue(consultant?.user?.linkedin_url),
          experience: this.hasProfileValue(consultant?.experience),
          hourly_rate: this.hasProfileValue(consultant?.rate),
          weekly_availability: this.hasProfileValue(consultant?.weekly_available_hours),
          core_modules: coreModules.length > 0,
          other_modules: otherModules.length > 0,
          industry_focus: this.hasProfileValue(consultant?.industries),
          work_experience: this.hasProfileValue(consultant?.work_experiences),
          education: this.hasProfileValue(consultant?.education),
          certifications:
            this.hasProfileValue(consultant?.certification) ||
            consultant?.is_certified === true,
          projects: this.hasProfileValue(consultant?.projects),
        };
      }

      private isProfileSectionComplete(checks: boolean[]): boolean {
        return checks.length > 0 && checks.every(Boolean);
      }

      getProfileSectionsStatus(consultant: any) {
        const fields = this.getProfileFieldChecks(consultant);

        return {
          profile_essentials_completed: this.isProfileSectionComplete([
            fields.photo,
            fields.email,
            fields.phone,
            fields.professional_headline,
            fields.linkedin_url,
          ]),
          basic_information_completed: this.isProfileSectionComplete([
            fields.experience,
            fields.hourly_rate,
            fields.weekly_availability,
            fields.core_modules,
            fields.other_modules,
          ]),
          professional_information_completed: this.isProfileSectionComplete([
            fields.industry_focus,
            fields.work_experience,
            fields.education,
            fields.certifications,
            fields.projects,
          ]),
        };
      }

      calculateProfileStrength(consultant: any): string {
        const fields = Object.values(this.getProfileFieldChecks(consultant));
        const completed = fields.filter(Boolean).length;
        const score = Math.round((completed / fields.length) * 100);

        return `${score}%`;
      }

      async getNewDashboardData(consultantId: number) {
          const meetings = await this.meetingRepo.getMeetingWithDetails(
          consultantId,
          'interview',
        );

        const projects =
          await this.projectConsultantRepo.findByConsultantId(consultantId);

        const consultant =
          await this.consultantRepository.findConsultantProfileByUserId(consultantId);
        const now = new Date();

        /* =========================
            CALENDAR
        ========================= */

        const upcomingMeetings = meetings
          .filter(m => new Date(m.date_time) > now)
          .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

        const calendar = {
          weekly_availability: consultant?.weekly_available_hours || 0,
          interview_schedule: upcomingMeetings.length,
          next_interview: upcomingMeetings[0]?.date_time || null
        };

        /* =========================
            PROJECTS
        ========================= */

        const activeProjects = projects.filter(p =>
          p?.project?.projectDetails?.end_date
            ? new Date(p.project.projectDetails.end_date) > now
            : false
        );

        const projectNames = projects
          .map(p => ({
            name: p?.project?.name,
            client: p?.project?.client?.username,
            status: p?.project?.status,
          }))
          .filter(Boolean);

        const projectData = {
          total_projects: projects.length,
          active: activeProjects.length,
          projects: projectNames
        };

        /* =========================
            PAYMENTS
        ========================= */

        const projectedEarning =
          consultant?.weekly_available_hours && consultant?.rate
            ? this.roundAmount((consultant.weekly_available_hours / 5) * consultant.rate * 66)
            : 0;

        const bills = await this.monthlyBillRepo.findByConsultant(consultantId);
        const totalEarnings = bills
          .filter(bill => bill.is_paid)
          .reduce((sum, bill) => sum + (bill.amount || 0), 0);

        const nextUnpaidBill = bills.slice().reverse().find(bill => !bill.is_paid);
        const nextPayment = nextUnpaidBill ? nextUnpaidBill.amount : 0;

        const payment = {
          next_payment: nextPayment,
          projected_earning: projectedEarning,
          total_earnings: totalEarnings,
        };

        /* =========================
            DOCUMENTS (placeholder logic)
        ========================= */

        const documents = {
          pending: 0,
          upcoming: 0
        };

        /* =========================
            PROFILE
        ========================= */
        const badges = consultant.badges || [];

        // VERIFIED
        if (
          consultant.user?.email ||
          consultant.user?.phone ||
          consultant.user?.linkedin_url
        ) {
          badges.push('VERIFIED');
        }

        // CERTIFIED
        if (consultant.is_certified) {
          badges.push('CERTIFIED');
        }

        // EXPERIENCE
        if (consultant.experience >= 0 && consultant.experience < 1) {
          badges.push('JUNIOR');
        } else if (consultant.experience >= 1 && consultant.experience < 3) {
          badges.push('ASSOCIATE');
        } else if (consultant.experience >= 3 && consultant.experience < 6) {
          badges.push('MID_LEVEL');
        } else if (consultant.experience >= 6 && consultant.experience < 9) {
          badges.push('SENIOR');
        } else if (consultant.experience >= 9 && consultant.experience < 12) {
          badges.push('PRINCIPAL');
        } else if (consultant.experience >= 12) {
          badges.push('SOLUTION_ARCHITECT');
        }
        

        // remove duplicates
        const uniqueBadges = Array.from(new Set(badges));
        const profile = {
          profile_strength: this.calculateProfileStrength(consultant) || '0%',
          ...this.getProfileSectionsStatus(consultant),
          badges: uniqueBadges,
          name: consultant?.user?.username || '',
          city: consultant?.user?.city || '',
          country: consultant?.user?.country || '',
          avatar: consultant?.user?.avatar || '',
          created_at: consultant?.user?.created_at || null,
          modules: consultant?.user?.modules?.map((m: any) => m.module?.name).filter(Boolean)[0] || []
        };

        const today_schedule = meetings.length > 0 ? [{
            project_name: meetings[0]?.project?.name || 'N/A',
            date_time: meetings[0]?.date_time || null,
            client: meetings[0]?.project?.client?.username || 'N/A',
            source: 'Client',
          },
          {
            project_name: meetings[0]?.project?.name || 'N/A',
            date_time: meetings[0]?.date_time || null,
            client: meetings[0]?.project?.client?.username || 'N/A',
            source: 'Client',
          },
          {
            project_name: meetings[0]?.project?.name || 'N/A',
            date_time: meetings[0]?.date_time || null,
            client: meetings[0]?.project?.client?.username || 'N/A',
            source: 'Client',
          },] : []

        return {
          calender: calendar,
          projects: projectData,
          payment,
          documents,
          profile,
          today_schedule
        }; 
      }

}

