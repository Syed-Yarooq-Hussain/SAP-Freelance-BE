import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectPayment } from '../models/project-payment.model';

@Injectable()
export class ProjectPaymentRepository {
  constructor(
    @InjectModel(ProjectPayment)
    private readonly projectPaymentModel: typeof ProjectPayment,
  ) {}

  // 🆕 Create new payment record
  async create(data: Partial<ProjectPayment>): Promise<ProjectPayment> {
    return this.projectPaymentModel.create(data);
  }

  // 📋 Get all payments (with optional filter)
  async findAll(options?: any): Promise<ProjectPayment[]> {
    return this.projectPaymentModel.findAll(options);
  }

  // 🔍 Find payment by ID
  async findById(id: number): Promise<ProjectPayment | null> {
    return this.projectPaymentModel.findByPk(id);
  }

  // 🔎 Find payments by project ID
  async findByProjectId(project_id: number): Promise<ProjectPayment[]> {
    return this.projectPaymentModel.findAll({ where: { project_id } });
  }

  // 🧠 Update payment record
  async update(
    id: number,
    data: Partial<ProjectPayment>,
  ): Promise<[number, ProjectPayment[]]> {
    return this.projectPaymentModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete payment record
  async delete(id: number): Promise<number> {
    return this.projectPaymentModel.destroy({ where: { id } });
  }
}
