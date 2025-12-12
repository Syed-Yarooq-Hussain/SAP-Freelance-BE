import {Table,Column,Model,DataType,ForeignKey,BelongsTo,} from 'sequelize-typescript';
import { ModuleEntity } from './module.model';
import { User } from './user.model';

@Table({ tableName: 'consultant_module', timestamps: false })
export class ConsultantModule extends Model<ConsultantModule> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id: number;

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

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => ModuleEntity)
  module: ModuleEntity;
  
  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  deleted_at: Date | null;
}
