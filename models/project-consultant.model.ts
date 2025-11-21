import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Project } from './project.model';
import { Consultant } from './consultant.model'; 
import { User } from './user.model';

@Table({
  tableName: 'project_consultant',
  timestamps: false, 
})
export class ProjectConsultant extends Model<ProjectConsultant> {
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    field: 'consultant_id',
  })
  consultant_id!: number;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    field: 'project_id',
  })
  project_id!: number;

  @BelongsTo(() => Project)
  project!: Project;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  status?: string;
  
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  role?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'decided_rate',
  })
  decided_rate?: number;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    field: 'booking_schedule',
  })
  booking_schedule?: object;
  
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    field: 'is_joic_signed',
  })
  is_joic_signed?: boolean;
  
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'requested_hours',
  })
  requested_hours?: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  deleted_at: Date | null;
}
