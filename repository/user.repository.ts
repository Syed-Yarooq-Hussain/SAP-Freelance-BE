import { Consultant } from 'models/consultant.model';
import { User } from '../models/user.model';
import { Op, Sequelize } from 'sequelize';
import { UserRole } from 'constant/enums';
import { ConsultantModule } from 'models/consultant-module.model';
import { ModuleEntity } from 'models/module.model';
import { Project } from 'models/project.model';

class UserRepository {
  private readonly userModel: typeof User;

  constructor(private readonly sequelize: Sequelize) {
    this.userModel = User;
  }

  // 🟢 Get all Clients for Admin Screen
  async getAllClientsWithProjectstatus(): Promise<User[]> {
    return this.userModel.findAll({
      where: { role: UserRole.CLIENT },
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

  // 🟢 Get user including password
  async userLogin(email): Promise<User | null> {
    return this.userModel.findOne({
      where: { email },
      attributes: { include: ['password'] },
      raw: true,
    });
  }

  // 🔍 Get user by ID
  async findById(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  // 📧 Find by email
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  // ➕ Create new user
  async createUser(userAttributes: Partial<User>): Promise<User> {
    try {
      const user = await this.userModel.create(userAttributes);
      return user;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  // 🔄 Update user
  async updateUser(id: number, userAttributes: Partial<User>): Promise<[number, User[]]> {
    return this.userModel.update(userAttributes, { where: { id }, returning: true });
  }

  // ❌ Delete user
  async deleteUser(id: number): Promise<number> {
    return this.userModel.destroy({ where: { id } });
  }

  // ⚙️ Filtered + Paginated list
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

  async findAllUsersWithConsultants(): Promise<User[]> {
    return await this.userModel.findAll({
      where: { role: UserRole.CONSULTANT },
      attributes: ['id', 'username'],
      include: [
        {
          model: Consultant,
          required: true,
          attributes: [ 'weekly_available_hours', 'rate', 'experience', 'working_schedule' ],
        },
        {
          model: ConsultantModule,
          required: false,
          attributes: ['id'],
          include: [
            {
              model: ModuleEntity,
              required: false,
              attributes: ['id', 'name', 'is_core'],
            },
          ],
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

    // Consultant-based filters
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
