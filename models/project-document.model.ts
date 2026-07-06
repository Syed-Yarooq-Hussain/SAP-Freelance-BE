import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Project } from './project.model';
import { User } from './user.model';

@Table({
  tableName: 'project_documents',
  timestamps: false,
})
export class ProjectDocument extends Model<ProjectDocument> {
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  project_id: number;

  @BelongsTo(() => Project)
  project: Project;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  consultant_id: number;

  @BelongsTo(() => User)
  consultant: User;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  type: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  url: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  deleted_at: Date | null;
}
