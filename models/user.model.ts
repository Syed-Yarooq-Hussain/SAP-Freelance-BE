import {
  Table,
  Column,
  DataType,
  Model,
  HasOne,
  DefaultScope,
} from 'sequelize-typescript';
import { ConsultantDetail } from './consultant-detail.model';

@DefaultScope(() => ({
  attributes: { exclude: ['password'] },
}))
@Table({ tableName: 'users', timestamps: false })
export class User extends Model<User> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id: number;

  @Column(DataType.STRING)
  username: string;

  @Column(DataType.INTEGER)
  role: number;

  @Column(DataType.STRING)
  email: string;

  @Column(DataType.STRING)
  phone: string;

  @Column(DataType.STRING)
  password: string;

  @Column(DataType.STRING)
  currency: string;

  @Column(DataType.STRING)
  city: string;

  @Column(DataType.STRING)
  country: string;

  @Column(DataType.INTEGER)
  status: number;

  @Column(DataType.DATE)
  created_at: Date;

  @Column(DataType.DATE)
  updated_at: Date;

  @HasOne(() => ConsultantDetail)
  consultantDetail: ConsultantDetail;

  @Column({ type: DataType.VIRTUAL })
  token: string;
}
