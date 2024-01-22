'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    
    
  }
  User.init(
    {
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING(16),
      },
      password: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      birthday: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      last_modified: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};