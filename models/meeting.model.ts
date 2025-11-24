import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from './user.model';
import { MeetingInvitee } from './meeting-invitee.model';
import { Project } from './project.model';

@Table({ tableName: 'meetings', timestamps: false })
export class Meeting extends Model<Meeting> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sender_id: number;

  @BelongsTo(() => User, 'sender_id')
  sender: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  url: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  date_time: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  duration: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'Pending',
  })
  status: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  event_type: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER })
  project_id: number;

  @BelongsTo(() => Project)
  project: Project;
  
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at: Date;

  @HasMany(() => MeetingInvitee)
  invitees: MeetingInvitee[];
}
