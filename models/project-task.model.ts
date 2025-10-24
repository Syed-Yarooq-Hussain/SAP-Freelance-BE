import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ProjectMilestone } from './project-milestone.model';
import { Project } from './project.model';
import { User } from './user.model';

@Table({ tableName: 'project_tasks', timestamps: false })
export class ProjectTask extends Model<ProjectTask> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  project_id: number;
  
  @ForeignKey(() => ProjectMilestone)
  @Column(DataType.INTEGER)
  milestone_id: number; 

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  assigned_to: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.ENUM('pending', 'in_progress', 'completed'),
    defaultValue: 'pending',
  })
  status: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  due_date: Date;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_at: Date;

  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => User, 'assigned_to')
  assignee: User;
}
