import { Table, Column, DataType, ForeignKey, BelongsTo, Model } from 'sequelize-typescript';
import { User } from './user.model';

@Table({ tableName: 'consultant_detail', timestamps: false })
export class ConsultantDetail extends Model<ConsultantDetail> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id: number;

  @Column(DataType.STRING)
  module: string;

  @Column(DataType.STRING)
  level: string;

  @Column(DataType.INTEGER)
  experience: number;

  @Column(DataType.INTEGER)
  rate: number;

  @Column(DataType.INTEGER)
  weekly_available_hours: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id: number;

  @BelongsTo(() => User)
  user: User;

  @Column(DataType.JSONB)
  schedule: object;

  @Column(DataType.STRING)
  cv_url: string;

  @Column(DataType.DATE)
  created_at: Date;
}
