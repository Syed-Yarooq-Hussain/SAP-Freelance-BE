import {Table,Column,Model,DataType,ForeignKey,BelongsTo,} from 'sequelize-typescript';
import { Consultant } from './consultant.model';
import { ModuleEntity } from './module.model';

@Table({ tableName: 'consultant_module', timestamps: false })
export class ConsultantModule extends Model<ConsultantModule> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Consultant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  consultant_id: number;

  @ForeignKey(() => ModuleEntity)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  module_id: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_primary: boolean;

  // Relations
  @BelongsTo(() => Consultant)
  consultant: Consultant;

  @BelongsTo(() => ModuleEntity)
  module: ModuleEntity;
}
