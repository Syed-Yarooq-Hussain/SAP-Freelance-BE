import {Table,Column,Model,DataType,ForeignKey,BelongsTo,} from 'sequelize-typescript';
import { Project } from './project.model';
import { User } from './user.model';

@Table({
  tableName: 'project_consultants',
  timestamps: true,
})
export class ProjectConsultant extends Model<ProjectConsultant> {
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
    field: 'consultant_id',
  })
  consultantId: number;

  @BelongsTo(() => User, 'consultantId')
  consultant: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'client_id',
  })
  clientId: number;

  @BelongsTo(() => User, 'clientId')
  client: User;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'project_id',
  })
  projectId: number;

  @BelongsTo(() => Project)
  project: Project;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  role: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'assigned_at',
  })
  assignedAt: Date;
}
