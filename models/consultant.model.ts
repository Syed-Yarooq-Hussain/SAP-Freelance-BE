import {Table,Column,Model,DataType,ForeignKey,BelongsTo,} from 'sequelize-typescript';
import { ModuleEntity } from './module.model';
import { User } from './user.model';

@Table({ tableName: 'consultants', timestamps: false })
export class Consultant extends Model<Consultant> {
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
  experience: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  rate: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  weekly_available_hours: number;
  
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  level: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id: number;

  @Column({
    type: DataType.JSONB,  // ya DataType.JSON
    allowNull: true,
  })
  working_schedule: object;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  skills: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  career_details: string;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  deleted_at: Date | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  cv_url: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  clients_summary: string | null;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: null,
  })
  work_experiences: any | null;
  
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: null,
  })
  projects: any | null;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: null,
  })
  education: any | null;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: null,
  })
  certification: any | null;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: null,
  })
  languages: any | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: [],
  })
  badges: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_certified: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  certification_approved_at: Date;

}
