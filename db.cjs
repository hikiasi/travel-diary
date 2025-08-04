const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'travel_diary',
  password: 'ПАРОЛЬ', // Замените на ваш пароль
  port: 5432,
});

module.exports = pool; 