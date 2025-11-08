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

  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  project_id: number;

  @BelongsTo(() => Project, 'project_id')
  project: Project;

  // ✅ Add this
  @HasMany(() => ProjectTask, 'project_milestone_id')
  tasks: ProjectTask[];
}
