import { User } from '../models/user.model';
import { Op, Sequelize } from 'sequelize';

class UserRepository {
  private readonly userModel: typeof User;

  constructor(sequelize: Sequelize) {
      this.userModel = User;
  }

  async findAll(): Promise<User[] | null> {
    return this.userModel.findAll();
  }

  async findById(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async createUser(userAttributes: Partial<any>): Promise<User> {
    return this.userModel.create(userAttributes);
  }

  async updateUser(id: number, userAttributes: Partial<any>) {
    return this.userModel.update(userAttributes, { where: { id } });
  }

  async deleteUser(id: number): Promise<number> {
    const result = await this.userModel.destroy({ where: { id } });
    return result;
  }

  async findAllWithFilters(
    excludeUserId: number,
    page: number,
    limit: number,
    search?: string,
    role?: number,
  ) {
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

}

export { UserRepository };
