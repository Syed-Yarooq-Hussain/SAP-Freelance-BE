import { ConsultantInterview } from '../models/consultant-interview.model';

export class ConsultantInterviewRepository {
  async create(data: any) {
    return await ConsultantInterview.create(data);
  }

  async findAll() {
    return await ConsultantInterview.findAll();
  }

  async findById(id: number) {
    return await ConsultantInterview.findByPk(id);
  }

  async update(id: number, data: any) {
    const interview = await ConsultantInterview.findByPk(id);
    if (!interview) return null;
    return await interview.update(data);
  }

  async delete(id: number) {
    return await ConsultantInterview.destroy({ where: { id } });
  }
}
