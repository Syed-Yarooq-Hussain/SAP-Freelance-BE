import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectDocument } from '../models/project-document.model';

@Injectable()
export class ProjectDocumentRepository {
  constructor(
    @InjectModel(ProjectDocument)
    private readonly projectDocumentModel: typeof ProjectDocument,
  ) {}

  async create(data: Partial<ProjectDocument>): Promise<ProjectDocument> {
    return this.projectDocumentModel.create(data);
  }

  async findAllByProjectId(projectId: number): Promise<ProjectDocument[]> {
    return this.projectDocumentModel.findAll({
      where: {
        project_id: projectId,
        deleted_at: null,
      },
      order: [['id', 'DESC']],
    });
  }

  async findById(id: number): Promise<ProjectDocument | null> {
    return this.projectDocumentModel.findOne({
      where: {
        id,
        deleted_at: null,
      },
    });
  }

  async softDelete(id: number): Promise<[number, ProjectDocument[]]> {
    return this.projectDocumentModel.update(
      { deleted_at: new Date() },
      {
        where: {
          id,
          deleted_at: null,
        },
        returning: true,
      },
    );
  }
}
