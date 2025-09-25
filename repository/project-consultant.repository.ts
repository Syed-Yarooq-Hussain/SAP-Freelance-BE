import { ProjectConsultant } from '../models/project-consultant.model';

export class ProjectConsultantRepository {
  async create(data: any) {
    return await ProjectConsultant.create(data);
  }

  async findAll() {
    return await ProjectConsultant.findAll();
  }

  async findById(id: number) {
    return await ProjectConsultant.findByPk(id);
  }

  async update(id: number, data: any) {
    const consultant = await ProjectConsultant.findByPk(id);
    if (!consultant) return null;
    return await consultant.update(data);
  }

  async delete(id: number) {
    return await ProjectConsultant.destroy({ where: { id } });
  }
}
