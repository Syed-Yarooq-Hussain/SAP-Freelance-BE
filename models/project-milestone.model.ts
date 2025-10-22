import {Table,Column,Model,DataType,ForeignKey,BelongsTo,} from 'sequelize-typescript';

import { Project } from './project.model';


@Table({
  tableName: 'project_milestones',
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
  milestone_name: string;

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
  amount?: number;

  // ✅ Foreign key setup
  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'project_id', // optional: maps DB column correctly
  })
  projectId: number;

  // ✅ Proper BelongsTo association
  @BelongsTo(() => Project, 'projectId')
  project: Project;
  
}
