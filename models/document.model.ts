import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from './project.model';
import { User } from './user.model';

@Table({ tableName: 'documents', timestamps: false })
export class Document extends Model<Document> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  project_id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  file_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  file_url: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  uploaded_at: Date;

  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => User, 'uploaded_by')
  uploader: User;
}
