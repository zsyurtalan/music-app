 const {DataTypes} = require('sequelize');
 const sequelize = require('../config/database');

 const User = sequelize.define('User', {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    keycloak_id:{
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    username:{
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email:{
        type: DataTypes.STRING(255),
        allowNull: false,
    },
}, {
    tableName: 'users',
    timestamps: true,
});
module.exports = User;


   