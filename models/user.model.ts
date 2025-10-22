import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Consultant } from './consultant.model';
import { Project } from './project.model';
import { ProjectConsultant } from './project-consultant.model';

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
    allowNull: false,
  })
  name: string;

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
    type: DataType.NUMBER,
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
    defaultValue: 'active',
  })
  status: string;

  @HasMany(() => Consultant)
  consultants: Consultant[];

  @HasMany(() => Project)
  projects: Project[];

  @HasMany(() => ProjectConsultant)
  projectConsultants: ProjectConsultant[];
  token: string;
  username: any;
}
