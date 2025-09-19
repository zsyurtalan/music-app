const { Sequelize } = require('sequelize');
require('dotenv').config();

// PostgreSQL konfigürasyonu
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'music-app',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'sıla',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: false,
    underscored: false,
    freezeTableName: true
  }
});

module.exports = sequelize;
