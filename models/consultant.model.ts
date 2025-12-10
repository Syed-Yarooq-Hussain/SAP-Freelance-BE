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

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  working_schedule: string;

  @Column({
    type: DataType.TEXT,
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
}
