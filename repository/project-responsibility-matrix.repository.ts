import { ProjectResponsibilityMatrix } from '../models/project-responsibility-matrix.model';

export class ProjectResponsibilityMatrixRepository {
  async create(data: any) {
    return await ProjectResponsibilityMatrix.create(data);
  }

  async findAll() {
    return await ProjectResponsibilityMatrix.findAll();
  }

  async findById(id: number) {
    return await ProjectResponsibilityMatrix.findByPk(id);
  }

  async update(id: number, data: any) {
    const responsibility = await ProjectResponsibilityMatrix.findByPk(id);
    if (!responsibility) return null;
    return await responsibility.update(data);
  }

  async delete(id: number) {
    return await ProjectResponsibilityMatrix.destroy({ where: { id } });
  }
}
