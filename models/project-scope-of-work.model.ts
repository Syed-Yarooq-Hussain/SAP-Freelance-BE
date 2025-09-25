import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from './project.model';

@Table({ tableName: 'project_scope_of_work', timestamps: false })
export class ProjectScopeOfWork extends Model<ProjectScopeOfWork> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  project_id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  type: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  detail: string;

  @Column(DataType.TEXT)
  document_url: string;

  @Column({ type: DataType.STRING, defaultValue: 'pending' })
  status: string;

  @BelongsTo(() => Project)
  project: Project;
}
