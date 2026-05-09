import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';
import { ProjectMilestone } from './project-milestone.model';
import { Project } from './project.model';

@Table({ tableName: 'consultant_monthly_bills', timestamps: false })
export class ConsultantMonthlyBill extends Model<ConsultantMonthlyBill> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id: number;

  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  project_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id: number;

  @ForeignKey(() => ProjectMilestone)
  @Column({ type: DataType.INTEGER, allowNull: false })
  milestone_id: number;

  // Format: "2025-06" — easy filtering ke liye
  @Column({ type: DataType.STRING(7), allowNull: false })
  month: string;

  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  hours: number;

  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  amount: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_paid: boolean;

  // Jab payment ho, PDF upload karke yahan URL dalna
  @Column({ type: DataType.STRING, allowNull: true, defaultValue: null })
  pdf_url: string | null;
  
  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => ProjectMilestone)
  milestone: ProjectMilestone;
}