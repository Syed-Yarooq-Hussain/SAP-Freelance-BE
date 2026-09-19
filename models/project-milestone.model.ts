import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Project } from './project.model';
import { ProjectTask } from './project-task.model';

@Table({
  tableName: 'project_milestone',
  timestamps: false,
})
export class ProjectMilestone extends Model<ProjectMilestone> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  start_date?: Date;


  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  due_date?: Date;

  @Column({
    type: DataType.STRING(100),
    defaultValue: 'Pending',
  })
  status: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  required_hours?: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  team_revision: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  team_configured: boolean;

  @Column({ type: DataType.DECIMAL(18, 2), allowNull: false, defaultValue: 0 })
  team_estimated_amount: number;

  @Column({ type: DataType.DECIMAL(18, 2), allowNull: false, defaultValue: 0 })
  team_payable_amount: number;

  @Column({ type: DataType.STRING(3), allowNull: false, defaultValue: 'USD' })
  team_currency: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  project_id: number;

  @BelongsTo(() => Project, 'project_id')
  project: Project;

  @HasMany(() => ProjectTask, 'project_milestone_id')
  tasks: ProjectTask[];

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  deleted_at: Date | null;
}
