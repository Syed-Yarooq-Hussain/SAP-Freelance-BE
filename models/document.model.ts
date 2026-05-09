import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';

import { Project } from './project.model';
import { User } from './user.model';

@Table({
  tableName: 'documents',
  timestamps: false,
})
export class Document extends Model<Document> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  url: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  type: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  deleted_at: Date | null;
}