import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { ProjectIndustry } from './project-industries.model';

@Table({ tableName: 'industries', timestamps: false })
export class Industries extends Model<Industries> {
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

  @HasMany(() => ProjectIndustry)
  projectIndustries: ProjectIndustry[];
}
