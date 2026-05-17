import { Injectable } from '@nestjs/common';
import { Consultant } from 'models/consultant.model';
import { User } from '../models/user.model';
import { Op, QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { UserRole } from 'constant/enums';
import { ConsultantModule } from 'models/consultant-module.model';
import { ModuleEntity } from 'models/module.model';
import { Project } from 'models/project.model';

export interface ConsultantSearchFilters {
  module_ids?: number[];
  user_ids?: number[];
  experience?: number;
  available_hours?: number;
  min_rate?: number;
  max_rate?: number;
  country?: string;
}

@Injectable()
class UserRepository {
  private readonly userModel: typeof User;

  constructor(private readonly sequelize: Sequelize) {
    this.userModel = User;
  }

  // 🟢 Get All Users
  async findAll(email: string): Promise<User[]> {
    return this.userModel.findAll();
  }
  
  // 🟢 Get all Clients for Admin Screen
  async getAllClientsWithProjectstatus(status?: string): Promise<User[]> {
    return this.userModel.findAll({
      where: { role: UserRole.CLIENT , ...(status ? { status } : {}), },
      attributes: ['id', 'username', 'status'],
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
      const consultantAnd: any[] = [];
      const userWhere: any = {
        role: UserRole.CONSULTANT,
        ...(status ? { status } : { status: 'active' }),
      };
      const moduleEntityWhere: any = {};
      const hasModuleFilter = !!(filters.module_ids && filters.module_ids.length > 0);

      if (filters.country) {
        userWhere.country = { [Op.iLike]: `%${filters.country}%` };
      }

      if (filters.user_ids?.length) {
        userWhere.id = { [Op.in]: filters.user_ids };
      }

      if (filters.experience !== undefined) {
        consultantAnd.push({
          [Op.or]: [
            { experience: { [Op.is]: null } },
            { experience: { [Op.gte]: filters.experience } },
          ],
        });
      }

      if (filters.available_hours !== undefined) {
        consultantAnd.push({
          [Op.or]: [
            { weekly_available_hours: { [Op.is]: null } },
            { weekly_available_hours: { [Op.gte]: filters.available_hours } },
          ],
        });
      }

      if (filters.min_rate !== undefined || filters.max_rate !== undefined) {
        const ratePredicates: any[] = [];
        if (filters.min_rate !== undefined) {
          ratePredicates.push({ rate: { [Op.gte]: filters.min_rate } });
        }
        if (filters.max_rate !== undefined) {
          ratePredicates.push({ rate: { [Op.lte]: filters.max_rate } });
        }
        consultantAnd.push({
          [Op.or]: [
            { rate: { [Op.is]: null } },
            ratePredicates.length === 1 ? ratePredicates[0] : { [Op.and]: ratePredicates },
          ],
        });
      }

      const consultantWhere =
        consultantAnd.length > 0 ? { [Op.and]: consultantAnd } : {};

      const consultantModuleInclude: any = {
        model: ConsultantModule,
        required: hasModuleFilter,
        attributes: ['id', 'module_id'],
        //separate: hasModuleFilter,
        include: [
          {
            model: ModuleEntity,
            required: false,
            where: moduleEntityWhere,
            attributes: ['id', 'name', 'is_core'],
          },
        ],
      };

      if (hasModuleFilter) {
        consultantModuleInclude.where = {
          module_id: { [Op.in]: filters.module_ids },
          deleted_at: { [Op.is]: null },
        };
      }

      return await this.userModel.findAll({
        where: userWhere,
        attributes: ['id', 'username', 'status', 'country'],
        include: [
          {
            model: Consultant,
            required: true,
            where: consultantWhere,
            attributes: [
              'weekly_available_hours',
              'rate',
              'experience',
              'working_schedule',
            ],
          },
          consultantModuleInclude,
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
      const replacements: any = {
        role: UserRole.CONSULTANT,
        status: 'active',
        projectStatuses: [
          'initiated',
          'Initiated',
          'completed',
          'Completed',
          'complete',
          'Complete',
        ],
        hiredStatuses: ['hired', 'Hired'],
        limit,
        offset: (page - 1) * limit,
      };
      const where: string[] = [
        'u.role = :role',
        'u.status = :status',
      ];

      if (filters.country) {
        replacements.country = `%${filters.country}%`;
        where.push('u.country ILIKE :country');
      }

      if (filters.experience !== undefined) {
        replacements.experience = filters.experience;
        where.push("(NULLIF(c.experience::text, '') IS NULL OR NULLIF(c.experience::text, '')::numeric >= :experience)");
      }

      if (filters.min_rate !== undefined) {
        replacements.minRate = filters.min_rate;
        where.push("(NULLIF(c.rate::text, '') IS NULL OR NULLIF(c.rate::text, '')::numeric >= :minRate)");
      }

      if (filters.max_rate !== undefined) {
        replacements.maxRate = filters.max_rate;
        where.push("(NULLIF(c.rate::text, '') IS NULL OR NULLIF(c.rate::text, '')::numeric <= :maxRate)");
      }

      if (filters.available_hours !== undefined) {
        replacements.availableHours = filters.available_hours;
        where.push("(COALESCE(NULLIF(c.weekly_available_hours::text, '')::numeric, 0) - COALESCE(b.booked_hours, 0)) >= :availableHours");
      }

      if (filters.module_ids?.length) {
        filters.module_ids.forEach((moduleId, index) => {
          const key = `moduleId${index}`;
          replacements[key] = moduleId;
          where.push(`
            EXISTS (
              SELECT 1
              FROM consultant_module cm
              WHERE cm.user_id = u.id
                AND cm.module_id = :${key}
                AND cm.deleted_at IS NULL
            )
          `);
        });
      }

      const baseSql = `
        FROM users u
        INNER JOIN consultants c ON c.user_id = u.id
        LEFT JOIN (
          SELECT pc.consultant_id, SUM(COALESCE(NULLIF(pc.requested_hours::text, '')::numeric, 0)) AS booked_hours
          FROM project_consultant pc
          INNER JOIN project p ON p.id = pc.project_id
          WHERE pc.deleted_at IS NULL
            AND pc.status IN (:hiredStatuses)
            AND p.deleted_at IS NULL
            AND p.status IN (:projectStatuses)
          GROUP BY pc.consultant_id
        ) b ON b.consultant_id = u.id
        WHERE ${where.join(' AND ')}
          AND c.deleted_at IS NULL
          AND (COALESCE(NULLIF(c.weekly_available_hours::text, '')::numeric, 0) - COALESCE(b.booked_hours, 0)) > 0
      `;

      const rows = await this.sequelize.query<{
        id: number;
        booked_hours: string;
        available_hours: string;
      }>(
        `
          SELECT
            u.id,
            COALESCE(b.booked_hours, 0) AS booked_hours,
            (COALESCE(NULLIF(c.weekly_available_hours::text, '')::numeric, 0) - COALESCE(b.booked_hours, 0)) AS available_hours
          ${baseSql}
          ORDER BY u.created_at DESC NULLS LAST, u.id DESC
          LIMIT :limit OFFSET :offset
        `,
        { replacements, type: QueryTypes.SELECT },
      );

      const countRows = await this.sequelize.query<{ total: string }>(
        `SELECT COUNT(*)::int AS total ${baseSql}`,
        { replacements, type: QueryTypes.SELECT },
      );

      return {
        rows: rows.map((row) => ({
          id: Number(row.id),
          booked_hours: Number(row.booked_hours) || 0,
          available_hours: Number(row.available_hours) || 0,
        })),
        total: Number(countRows[0]?.total) || 0,
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
