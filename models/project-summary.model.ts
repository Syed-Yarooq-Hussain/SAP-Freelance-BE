import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from './project.model';

@Table({ tableName: 'project_summary', timestamps: true })
export class ProjectSummary extends Model<ProjectSummary> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  project_id: number;

  @Column(DataType.TEXT)
  summary: string;

  @BelongsTo(() => Project)
  project: Project;
}
