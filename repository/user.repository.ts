import { Consultant } from 'models/consultant.model';
import { User } from '../models/user.model';
import { Op, Sequelize } from 'sequelize';
import { UserRole } from 'constant/enums';
import { ConsultantModule } from 'models/consultant-module.model';
import { ModuleEntity } from 'models/module.model';
import { Project } from 'models/project.model';

export interface ConsultantSearchFilters {
  module_ids?: number[];
  experience?: number;
  available_hours?: number;
  min_rate?: number;
  max_rate?: number;
  country?: string;
}

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
    const consultantWhere: any = {};
    const userWhere: any = {
      role: UserRole.CONSULTANT,
      ...(status ? { status } : {}),
    };
    const moduleWhere: any = {};
    const moduleEntityWhere: any = {};

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
      attributes: ['id', 'username', 'status', 'country'],
      include: [
        {
          model: Consultant,
          required: true,
          where: consultantWhere,
          attributes: [ 'weekly_available_hours', 'rate', 'experience', 'working_schedule' ],
        },
        {
          model: ConsultantModule,
          required: filters.module_ids && filters.module_ids.length > 0,
          where: moduleWhere,
          attributes: ['id'],
          include: [
            {
              model: ModuleEntity,
              required: true,
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
