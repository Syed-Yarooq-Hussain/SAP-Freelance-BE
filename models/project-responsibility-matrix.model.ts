import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from './project.model';
import { User } from './user.model';

@Table({ tableName: 'project_responsibilities_matrix', timestamps: false })
export class ProjectResponsibilityMatrix extends Model<ProjectResponsibilityMatrix> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  project_id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  area: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  task: string;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  responsible: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  accountable: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  consulted: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  informed: number;

  @Column({ type: DataType.STRING, defaultValue: 'pending' })
  status: string;

  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => User, 'responsible')
  responsibleUser: User;

  @BelongsTo(() => User, 'accountable')
  accountableUser: User;

  @BelongsTo(() => User, 'consulted')
  consultedUser: User;

  @BelongsTo(() => User, 'informed')
  informedUser: User;
}
