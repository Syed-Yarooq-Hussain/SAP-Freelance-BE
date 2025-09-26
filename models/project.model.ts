import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { User } from './user.model';
import { ProjectConsultant } from './project-consultant.model';
import { ConsultantInterview } from './consultant-interview.model';

@Table({ tableName: 'projects', timestamps: true })
export class Project extends Model<Project> {
  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  client_id: number;

  @Column({ type: DataType.STRING, defaultValue: 'pending' })
  status: string;

  @Column(DataType.DATE)
  start_date: Date;

  @Column(DataType.DATE)
  end_date: Date;

  @BelongsTo(() => User, 'client_id')
  client: User;

  @CreatedAt
  @Column({ field: 'created_at', type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ field: 'updated_at', type: DataType.DATE })
  updatedAt: Date;

  @HasMany(() => ProjectConsultant)
  consultants: ProjectConsultant[];

  @HasMany(() => ConsultantInterview)
  interviews: ConsultantInterview[];
}
