import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model';

@Table({ tableName: 'email_dispatches', timestamps: false })
export class EmailDispatch extends Model<EmailDispatch> {
  @Column({ type: DataType.BIGINT, autoIncrement: true, primaryKey: true })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  email_type: string;

  @Column({ type: DataType.STRING, allowNull: true })
  provider_message_id: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  sent_by: number;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  sent_at: Date;

  @BelongsTo(() => User)
  sender: User;
}
