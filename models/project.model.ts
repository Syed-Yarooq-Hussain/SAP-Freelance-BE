import {Table,Column,Model,DataType,ForeignKey,BelongsTo,HasMany, HasOne,} from 'sequelize-typescript';
import { User } from './user.model';
import { ProjectConsultant } from './project-consultant.model';
import { ProjectIndustry } from './project-industries.model';
import { ProjectDetail } from './project-detail.model';
import { ProjectMilestone } from './project-milestone.model';
import { ProjectTask } from './project-task.model';
import { ProjectPayment } from './project-payment.model';
@Table({ tableName: 'project', timestamps: false })
export class Project extends Model<Project> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  client_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  company_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: 'pending',
  })
  status: string;

  @BelongsTo(() => User)
  client: User;
  

  @HasMany(() => ProjectConsultant)
  projectConsultants: ProjectConsultant[];

  @HasMany(() => ProjectIndustry)
  projectIndustries: ProjectIndustry[];

  @HasOne(() => ProjectDetail)
  projectDetails: ProjectDetail;

  @HasMany(() => ProjectMilestone)
  milestones: ProjectMilestone[];

  @HasMany(() => ProjectTask)
  tasks: ProjectTask[];

  @HasMany(() => ProjectPayment)
  payments: ProjectPayment[];

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  deleted_at: Date | null;
}
