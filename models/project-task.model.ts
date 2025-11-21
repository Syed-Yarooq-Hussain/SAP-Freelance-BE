import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ProjectMilestone } from './project-milestone.model';
import { Project } from './project.model';
import { User } from './user.model';

@Table({ tableName: 'project_task', timestamps: false })
export class ProjectTask extends Model<ProjectTask> {
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT })
  assignee_id: number;

  @ForeignKey(() => ProjectMilestone)
  @Column({ type: DataType.BIGINT })
  project_milestone_id: number;

  @ForeignKey(() => Project)
  @Column({ type: DataType.BIGINT })
  project_id: number;

  @Column({ type: DataType.INTEGER })
  required_hours: number;

  @BelongsTo(() => User, 'assignee_id')
  assignee: User;

  @BelongsTo(() => ProjectMilestone, 'project_milestone_id')
  milestone: ProjectMilestone;

  @BelongsTo(() => Project, 'project_id')
  project: Project;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  deleted_at: Date | null;
}
