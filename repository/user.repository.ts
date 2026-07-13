import { Consultant } from 'models/consultant.model';
import { User } from '../models/user.model';
import { Op, QueryTypes } from 'sequelize';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { UserRole } from 'constant/enums';
import { ConsultantModule } from 'models/consultant-module.model';
import { ModuleEntity } from 'models/module.model';
import { Project } from 'models/project.model';

export interface ConsultantSearchFilters {
  user_ids?: number[];
  module_ids?: number[];
  experience?: number;
  available_hours?: number;
  min_rate?: number;
  max_rate?: number;
  country?: string;
}

@Injectable()
class UserRepository {
  private readonly userModel: typeof User;

  constructor(@InjectConnection() private readonly sequelize: Sequelize) {
    this.userModel = User;
  }

  // 🟢 Get All Users
  async findAll(email: string): Promise<User[]> {
    return this.userModel.findAll();
  }
  
  // 🟢 Get all Clients for Admin Screen
  async getAllClientsWithProjectstatus(status?: string): Promise<User[]> {
    return this.userModel.findAll({
      where: { role: UserRole.CLIENT },
      attributes: ['id', 'username', 'email', 'phone', 'status'],
      include: [
        {
          model: Project,
          required: true,
          attributes: [ 'id', 'name', 'status'],
        },
      ],
      raw: false,
    });
  }

  // 🟢 Get User Including Password
  async userLogin(email): Promise<User | null> {
    return this.userModel.findOne({
      where: { email },
      attributes: { include: ['password'] },
      raw: true,
    });
  }

  // 🔍 Get User By Id
  async findById(id: number): Promise<User | null> {
    return this.userModel.findByPk(id, {
    attributes: {
      exclude: ['password', 'deleted_at'],
    },
  });
  }


  // 📧 Find By Email
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  // ➕ Create User
  async createUser(userAttributes: Partial<User>): Promise<User> {
    try {
      const user = await this.userModel.create(userAttributes);
      return user;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  // 🔄 Update User
  async updateUser(id: number, userAttributes: Partial<User>): Promise<[number, User[]]> {
    return this.userModel.update(userAttributes, { where: { id }, returning: true });
  }

  // ❌ Delete User
  async deleteUser(id: number): Promise<number> {
    return this.userModel.destroy({ where: { id } });
  }

  // ⚙️ Filtered + Paginated List
  async findAllWithFilters(
    excludeUserId: number,
    page: number,
    limit: number,
    search?: string,
    role?: number,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const where: any = { id: { [Op.ne]: excludeUserId } };

    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await this.userModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [['created_at', 'DESC']],
    });
    
    return { data: rows, total: count, page, limit };
  }

  async findAllUsersWithConsultants(
    status?: string,
    filters: ConsultantSearchFilters = {},
  ): Promise<User[]> {
    const consultantWhere: any = {};
    const userWhere: any = {
      role: UserRole.CONSULTANT,
    };
    const moduleWhere: any = {};
    const moduleEntityWhere: any = {};

    if (filters.user_ids && filters.user_ids.length > 0) {
      userWhere.id = { [Op.in]: filters.user_ids };
    }

    if (filters.country) {
      userWhere.country = { [Op.iLike]: `%${filters.country}%` };
    }

    if (filters.experience !== undefined) {
      consultantWhere.experience = { [Op.gte]: filters.experience };
    }

    if (filters.available_hours !== undefined) {
      consultantWhere.weekly_available_hours = { [Op.lt]: filters.available_hours };
    }

    if (filters.min_rate !== undefined || filters.max_rate !== undefined) {
      consultantWhere.rate = {
        ...(filters.min_rate !== undefined ? { [Op.gte]: filters.min_rate } : {}),
        ...(filters.max_rate !== undefined ? { [Op.lte]: filters.max_rate } : {}),
      };
    }

    if (filters.module_ids && filters.module_ids.length > 0) {
      moduleWhere.module_id = { [Op.in]: filters.module_ids };
    }

    return await this.userModel.findAll({
      where: userWhere,
      attributes: ['id', 'username', 'email', 'phone', 'status', 'country'],
      include: [
        {
          model: Consultant,
          required: true,
          where: consultantWhere,
          attributes: [ 'weekly_available_hours', 'rate', 'experience', 'working_schedule' ],
        },
        {
          model: ConsultantModule,
          required: false,
          where: moduleWhere,
          attributes: ['id', 'module_id', 'is_primary'],
          include: [
            {
              model: ModuleEntity,
              required: false,
              where: moduleEntityWhere,
              attributes: ['id', 'name', 'is_core'],
            },
          ],
        },
        {
          model: Project,
          required: false,
          attributes: ['id', 'name', 'status'],
        },
      ],
      raw: false,
    });
  }

  async findPaginatedConsultantIdsWithAvailability(
    filters: ConsultantSearchFilters = {},
    page = 1,
    limit = 10,
  ): Promise<{
    rows: { id: number; booked_hours: number; available_hours: number }[];
    total: number;
  }> {
    const consultantWhere: any = {};
    const userWhere: any = {
      role: UserRole.CONSULTANT,
    };

    if (filters.country) {
      userWhere.country = { [Op.iLike]: `%${filters.country}%` };
    }

    if (filters.experience !== undefined) {
      consultantWhere.experience = { [Op.gte]: filters.experience };
    }

    if (filters.min_rate !== undefined || filters.max_rate !== undefined) {
      consultantWhere.rate = {
        ...(filters.min_rate !== undefined ? { [Op.gte]: filters.min_rate } : {}),
        ...(filters.max_rate !== undefined ? { [Op.lte]: filters.max_rate } : {}),
      };
    }

    const moduleIds = filters.module_ids || [];
    const consultants = await this.userModel.findAll({
      where: userWhere,
      attributes: ['id'],
      include: [
        {
          model: Consultant,
          required: true,
          where: consultantWhere,
          attributes: ['weekly_available_hours'],
        },
        {
          model: ConsultantModule,
          required: false,
          ...(moduleIds.length > 0
            ? { where: { module_id: { [Op.in]: moduleIds } } }
            : {}),
          attributes: ['module_id'],
        },
      ],
      order: [['id', 'ASC']],
    });

    const matchingConsultants = moduleIds.length
      ? consultants.filter((consultant: any) => {
          const selectedModuleIds = (consultant.modules || []).map((module: any) =>
            Number(module.module_id),
          );

          return moduleIds.every((moduleId) => selectedModuleIds.includes(Number(moduleId)));
        })
      : consultants;

    const consultantIds = matchingConsultants.map((consultant) => Number(consultant.id));
    const bookedRows = consultantIds.length
      ? await this.sequelize.query<{ consultant_id: number; booked_hours: string | number }>(
          `
          SELECT pc.consultant_id, COALESCE(SUM(pc.requested_hours), 0) AS booked_hours
          FROM project_consultant pc
          INNER JOIN project p ON p.id = pc.project_id
          WHERE pc.consultant_id IN (:consultantIds)
            AND pc.deleted_at IS NULL
            AND LOWER(COALESCE(pc.status, '')) = 'hired'
            AND p.deleted_at IS NULL
            AND LOWER(COALESCE(p.status, '')) NOT IN ('cancelled', 'completed')
          GROUP BY pc.consultant_id
          `,
          {
            replacements: { consultantIds },
            type: QueryTypes.SELECT,
          },
        )
      : [];

    const bookedHoursByConsultantId = new Map(
      bookedRows.map((row) => [Number(row.consultant_id), Number(row.booked_hours || 0)]),
    );

    const rows = matchingConsultants
      .map((consultant: any) => {
        const weeklyAvailableHours = Number(
          consultant.consultants?.weekly_available_hours || 0,
        );
        const bookedHours = bookedHoursByConsultantId.get(Number(consultant.id)) || 0;
        const availableHours = Math.max(weeklyAvailableHours - bookedHours, 0);

        return {
          id: Number(consultant.id),
          booked_hours: bookedHours,
          available_hours: availableHours,
        };
      })
      .filter((consultant) =>
        filters.available_hours === undefined
          ? true
          : consultant.available_hours >= filters.available_hours,
      );

    const offset = (page - 1) * limit;

    return {
      rows: rows.slice(offset, offset + limit),
      total: rows.length,
    };
  }


   async findFilteredUsers(
    experience?: number,
    availability?: number,
    budget?: number,
    country?: string,
  ): Promise<User[]> {
    const where: any = {};

    // 💼 Country
    if (country) where.country = { [Op.iLike]: `%${country}%` };

    // ➕ Consultant Based Filters
    const consultantWhere: any = {};
    if (experience) consultantWhere.experience = { [Op.gte]: experience };
    if (availability) consultantWhere.weekly_available_hours = { [Op.gte]: availability };
    if (budget) consultantWhere.rate = { [Op.lte]: budget };

    return await this.userModel.findAll({
      where,
      include: [
        {
          model: Consultant,
          where: consultantWhere,
          required: true,
        },
      ],
      raw: true,
      nest: true,
    });
  }

  async fetchClientDashboardData(userId: number) {
    return await this.userModel.findByPk(userId, {
      include: [
        {
          association: 'projects',
          separate: true,
          limit: 5,
          order: [['id', 'DESC']],
          include: [
            { association: 'projectDetails' },
            { association: 'payments', limit: 5, order: [['id', 'DESC']] },
            { association: 'projectConsultants' },
            { association: 'projectIndustries' },
          ]
        },
        {
          association: 'sentMeetings',
          include: [
            { association: 'invitees', attributes: ['user_id'] },
            { association: 'project', attributes: ['name'] },
          ]
        },
        {
          association: 'receivedInvites',
          include: [
            {
              association: 'meeting',
              include: [
                { association: 'invitees', attributes: ['user_id'] },
                { association: 'project', attributes: ['name'] },
              ]
            }
          ]
        }
      ]
    });
  }

}

export { UserRepository };
