import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';

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

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  is_core: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  deleted_at: Date | null;

  // ✅ NEW FIELD
  @ForeignKey(() => ModuleEntity)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  parent_id: number;

  // ✅ RELATIONS
  @BelongsTo(() => ModuleEntity, 'parent_id')
  parent: ModuleEntity;

  @HasMany(() => ModuleEntity, 'parent_id')
  children: ModuleEntity[];
}