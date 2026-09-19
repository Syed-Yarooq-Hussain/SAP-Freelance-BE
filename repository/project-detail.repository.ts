import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectDetail } from '../models/project-detail.model';

@Injectable()
export class ProjectDetailRepository {
  constructor(
    @InjectModel(ProjectDetail)
    private readonly projectDetailModel: typeof ProjectDetail,
  ) {}

  // 🆕 Create Project Detail
  async create(data: Partial<ProjectDetail>, transaction?: import('sequelize').Transaction): Promise<ProjectDetail> {
    return this.projectDetailModel.create(data, { raw: true, transaction });
  }

  // 📋 Get All Project Details 
  async findAll(): Promise<ProjectDetail[]> {
    return this.projectDetailModel.findAll();
  }

  // 🔍 Get Project Detail By Id
  async findById(id: number): Promise<ProjectDetail | null> {
    return this.projectDetailModel.findByPk(id);
  }

  // 🔎 Get Project Detail By ProjectId
  async findByProjectId(project_id: number, transaction?: import('sequelize').Transaction): Promise<ProjectDetail | null> {
    return this.projectDetailModel.findOne({ where: { project_id }, transaction });
  }

  async reassignOwner(project_id: number, previousClientId: number, clientId: number, transaction: import('sequelize').Transaction) {
    // Some installations have this legacy column; project.client_id is the
    // authoritative owner. Do not map the optional column onto normal reads.
    const queryInterface = this.projectDetailModel.sequelize.getQueryInterface();
    const table = this.projectDetailModel.getTableName();
    // Sequelize forwards query options, though describeTable's type omits transaction.
    const describeOptions = { transaction, logging: false as const };
    const columns = await queryInterface.describeTable(table, describeOptions);
    if (!columns.user_id) return;

    return queryInterface.bulkUpdate(
      table,
      { user_id: clientId },
      { project_id, user_id: previousClientId },
      { transaction },
    );
  }

  // 🧠 Update Project Detail
  async update(
    id: number,
    data: Partial<ProjectDetail>,
    transaction?: import('sequelize').Transaction,
  ): Promise<[number, ProjectDetail[]]> {
    return this.projectDetailModel.update(data, {
      transaction,
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete Project Detail
  async delete(id: number): Promise<number> {
    return this.projectDetailModel.destroy({ where: { id } });
  }
}
