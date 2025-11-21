import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from './project.model';
import { ProjectMilestone } from './project-milestone.model';
import { Document } from './document.model';

@Table({ tableName: 'project_payments', timestamps: false })
export class ProjectPayment extends Model<ProjectPayment> {  
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
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  project_milestone_id: number;

  @ForeignKey(() => Document)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  doc_id: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  payment_module: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_paid: boolean;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_at: Date;

  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => ProjectMilestone)
  milestone: ProjectMilestone;

  @BelongsTo(() => Document)
  document: Document;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  deleted_at: Date | null;
}
