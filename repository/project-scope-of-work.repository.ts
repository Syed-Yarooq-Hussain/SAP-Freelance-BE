import { ProjectScopeOfWork } from '../models/project-scope-of-work.model';

export class ProjectScopeOfWorkRepository {
  async create(data: any) {
    return await ProjectScopeOfWork.create(data);
  }

  async findAll() {
    return await ProjectScopeOfWork.findAll();
  }

  async findById(id: number) {
    return await ProjectScopeOfWork.findByPk(id);
  }

  async update(id: number, data: any) {
    const scope = await ProjectScopeOfWork.findByPk(id);
    if (!scope) return null;
    return await scope.update(data);
  }

  async delete(id: number) {
    return await ProjectScopeOfWork.destroy({ where: { id } });
  }
}
