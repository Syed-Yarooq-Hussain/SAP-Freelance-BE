import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Meeting } from './meeting.model';
import { User } from './user.model';

@Table({ tableName: 'meeting_invitees', timestamps: false })
export class MeetingInvitee extends Model<MeetingInvitee> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Meeting)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  meeting_id: number;

  @BelongsTo(() => Meeting)
  meeting: Meeting;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id: number;

  @BelongsTo(() => User)
  user: User;
}
