import { Project } from '../models/project.model';

export class ProjectRepository {
  async create(data: any) {
    return await Project.create(data);
  }

  async findAll() {
    return await Project.findAll();
  }

  async findById(id: number) {
    return await Project.findByPk(id);
  }

  async update(id: number, data: any) {
    const project = await Project.findByPk(id);
    if (!project) return null;
    return await project.update(data);
  }

  async delete(id: number) {
    return await Project.destroy({ where: { id } });
  }
}
