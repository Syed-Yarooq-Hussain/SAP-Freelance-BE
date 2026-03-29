import { Table, Column, Model, DataType, HasMany, HasOne, BelongsTo } from 'sequelize-typescript';
import { Consultant } from './consultant.model';
import { Project } from './project.model';
import { ProjectDetail } from './project-detail.model';
import { Meeting } from './meeting.model';
import { MeetingInvitee } from './meeting-invitee.model';
import { ModuleEntity } from './module.model';
import { ConsultantModule } from './consultant-module.model';

@Table({ tableName: 'users', timestamps: false })
export class User extends Model<User> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  username: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  currency: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  role?: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  city: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  country: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phone: string;
  
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  avatar: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: 1 || 'active',
  })
  status: string | number;
  
  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: new Date(),
  })
  created_at: any;

  @Column({ allowNull: true })
  tokenMail: string;

  @Column({ allowNull: true })
  tokenMailExpiresAt: Date;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  email_verified: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  phone_verified: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  linkedin_url: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  linkedin_sso_connected: boolean;

  @HasOne(() => Consultant)
  consultants: Consultant;

  @HasMany(() => Project)
  projects: Project[];

  @HasMany(() => Meeting, 'sender_id')
  sentMeetings: Meeting[];

  @HasMany(() => MeetingInvitee, 'user_id')
  receivedInvites: MeetingInvitee[];

  token: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  deleted_at: Date | null;


  @HasMany(() => ConsultantModule)
  modules: ConsultantModule[];
}
