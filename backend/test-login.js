require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function testLogin() {
  try {
    // Obtener usuario admin
    const result = await pool.query(
      'SELECT username, password_hash FROM users WHERE username = $1',
      ['admin']
    );

    if (result.rows.length === 0) {
      console.log('❌ Usuario "admin" no encontrado');
      pool.end();
      return;
    }

    const user = result.rows[0];
    console.log('✅ Usuario encontrado:', user.username);
    console.log('   Hash length:', user.password_hash.length);
    console.log('   Hash preview:', user.password_hash.substring(0, 30) + '...');

    // Probar contraseñas comunes
    const testPasswords = ['admin123', 'Admin123', 'password', '123456'];

    console.log('\n🔑 Probando contraseñas:');
    for (const password of testPasswords) {
      const isValid = await bcrypt.compare(password, user.password_hash);
      console.log(`   "${password}": ${isValid ? '✅ VÁLIDA' : '❌ inválida'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

testLogin();
