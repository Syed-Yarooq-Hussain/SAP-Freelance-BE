import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

@Table({
  tableName: 'chat',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class Chat extends Model<Chat> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  sender_id: number;

  @BelongsTo(() => User, 'sender_id')
  sender: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  receiver_id: number;

  @BelongsTo(() => User, 'receiver_id')
  receiver: User;

  @Column({ type: DataType.INTEGER, allowNull: true })
  project_id: number | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  message: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'text' })
  message_type: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  is_read: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  deleted_at: Date | null;
}
