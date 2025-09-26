import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from './project.model';
import { User } from './user.model';

@Table({ tableName: 'consultant_interviews', timestamps: true })
export class ConsultantInterview extends Model<ConsultantInterview> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  project_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  consultant_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  client_id: number;

  @Column({ type: DataType.DATE, allowNull: false })
  interview_date: Date;

  @Column({ type: DataType.TIME, allowNull: false })
  start_time: string;

  @Column({ type: DataType.TIME, allowNull: false })
  end_time: string;

  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => User, 'consultant_id')
  consultant: User;

  @BelongsTo(() => User, 'client_id')
  client: User;
}
