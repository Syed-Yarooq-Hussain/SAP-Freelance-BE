import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from './project.model';
import { User } from './user.model';

@Table({ tableName: 'project_milestones', timestamps: false })
export class ProjectMilestone extends Model<ProjectMilestone> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  project_id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column(DataType.STRING)
  expected_name: string;

  @Column(DataType.TEXT)
  description: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  owner: number;

  @Column(DataType.TEXT)
  dependencies: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  approval: boolean;

  @Column(DataType.TEXT)
  comments: string;

  @Column({ type: DataType.STRING, defaultValue: 'pending' })
  status: string;

  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => User, 'owner')
  ownerUser: User;
}
