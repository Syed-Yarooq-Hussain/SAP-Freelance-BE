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
    get(this: ModuleEntity) {
      const name = this.getDataValue('name');
      const abbreviation = this.getDataValue('abbreviation');
      return abbreviation ? `${name} (${abbreviation})` : name;
    },
    set(this: ModuleEntity, value: string) {
      this.setDataValue('name', value);
    },
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  abbreviation: string | null;


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
