import { ProjectSummary } from '../models/project-summary.model';

export class ProjectSummaryRepository {
  async create(data: any) {
    return await ProjectSummary.create(data);
  }

  async findAll() {
    return await ProjectSummary.findAll();
  }

  async findById(id: number) {
    return await ProjectSummary.findByPk(id);
  }

  async update(id: number, data: any) {
    const summary = await ProjectSummary.findByPk(id);
    if (!summary) return null;
    return await summary.update(data);
  }

  async delete(id: number) {
    return await ProjectSummary.destroy({ where: { id } });
  }
}
