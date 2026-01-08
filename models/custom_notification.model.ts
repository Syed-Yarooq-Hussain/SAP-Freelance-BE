import {Table,Column,Model,DataType,ForeignKey,} from 'sequelize-typescript';
import { Notification } from './notification.model';

@Table({
  tableName: 'custom_notification',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class CustomNotification extends Model<CustomNotification> {

  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @ForeignKey(() => Notification)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  notification_id: number;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  user_id: number;
}
