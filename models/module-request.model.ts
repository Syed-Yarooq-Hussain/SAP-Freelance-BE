import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model';

@Table({
  tableName: 'module_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ModuleRequest extends Model<ModuleRequest> {
  @Column({ type: DataType.BIGINT, autoIncrement: true, primaryKey: true })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false })
  user_id: number;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: null })
  is_accepted: boolean | null;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updated_at: Date;

  @BelongsTo(() => User)
  user: User;
}
