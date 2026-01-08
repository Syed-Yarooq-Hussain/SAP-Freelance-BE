import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'notifications',
  timestamps: false,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Notification extends Model<Notification> {

  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @Column({type: DataType.STRING})
  title: string;

  @Column({type: DataType.TEXT})
  message: string;

  @Column({type: DataType.STRING})
  type: string;

  @Column({type: DataType.STRING})
  target: string;

  @Column({type: DataType.DATEONLY})
  date: Date;

  @Column({type: DataType.BOOLEAN})
  action: boolean;
  defaultValue: false; 
  allowNull: false;
}
