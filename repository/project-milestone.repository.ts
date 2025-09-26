import { ProjectMilestone } from '../models/project-milestone.model';

export class ProjectMilestoneRepository {
  async create(data: any) {
    return await ProjectMilestone.create(data);
  }

  async findAll() {
    return await ProjectMilestone.findAll();
  }

  async findById(id: number) {
    return await ProjectMilestone.findByPk(id);
  }

  async update(id: number, data: any) {
    const milestone = await ProjectMilestone.findByPk(id);
    if (!milestone) return null;
    return await milestone.update(data);
  }

  async delete(id: number) {
    return await ProjectMilestone.destroy({ where: { id } });
  }
}
