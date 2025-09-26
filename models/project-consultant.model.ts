import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from './project.model';
import { User } from './user.model';

@Table({ tableName: 'project_consultants', timestamps: false })
export class ProjectConsultant extends Model<ProjectConsultant> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  project_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  consultant_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  client_id: number;

  @Column({ type: DataType.STRING, defaultValue: 'shortlisted' })
  status: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  selected_at: Date;

  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => User, 'consultant_id')
  consultant: User;

  @BelongsTo(() => User, 'client_id')
  client: User;
}
