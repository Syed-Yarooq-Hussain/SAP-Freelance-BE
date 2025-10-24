import {Table,Column,Model,DataType,ForeignKey,BelongsTo,} from 'sequelize-typescript';
import { Project } from './project.model';
import { Industries } from './industries.model';

@Table({ tableName: 'project_industries', timestamps: false })
export class ProjectIndustry extends Model<ProjectIndustry> {
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

  @ForeignKey(() => Industries)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  industry_id: number;

  // Relations
  @BelongsTo(() => Project)
  project: Project;

  @BelongsTo(() => Industries)
  industry: Industries;
}
