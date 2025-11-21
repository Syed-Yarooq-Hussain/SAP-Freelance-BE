import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ProjectMilestone } from './project-milestone.model';

@Table({ tableName: 'milestone_docs', timestamps: false })
export class MilestoneDocs extends Model<MilestoneDocs> {  
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
  doc_name: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
  })
  file_url: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  uploaded_at: Date;

  @ForeignKey(() => ProjectMilestone)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  milestone_id: number;

  @BelongsTo(() => ProjectMilestone)
  milestone: ProjectMilestone;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  deleted_at: Date | null;
}
