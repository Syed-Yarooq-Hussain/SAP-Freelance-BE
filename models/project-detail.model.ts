import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Project } from './project.model';

@Table({ tableName: 'project_detail', timestamps: false })
export class ProjectDetail extends Model<ProjectDetail> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  start_date: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  end_date: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  duration: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  cost: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  paid_amount: number;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  project_id: number;

  @BelongsTo(() => Project)
  project: Project;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  deleted_at: Date | null;

}
 