const { Sequelize } = require('sequelize');
require('dotenv').config();

// SQLite kullan (En kolay)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './database.sqlite',
  logging: console.log, // SQL sorgularını göster
});

module.exports = sequelize;
