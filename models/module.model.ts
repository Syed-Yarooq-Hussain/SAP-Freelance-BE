import {Table,Column,Model,DataType,ForeignKey,BelongsTo,HasMany,} from 'sequelize-typescript';

@Table({ tableName: 'modules', timestamps: false })
export class ModuleEntity extends Model<ModuleEntity> {
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

  @ForeignKey(() => ModuleEntity)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  parent_id: number;

  // Self relationship
  @BelongsTo(() => ModuleEntity, 'parent_id')
  parent: ModuleEntity;

  @HasMany(() => ModuleEntity, 'parent_id')
  subModules: ModuleEntity[];
}
