import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'users', // Specify the table name
})
class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  first_name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  last_name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  email: string;

  @Column({
    type: DataType.STRING(16),
  })
  phone?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  birthday: Date;

  /* @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  createdAt: Date; */

}

export { User };
