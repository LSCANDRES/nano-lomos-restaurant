const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '192.168.100.35',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'NANOLOMOS',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'dev1234'
});

async function activateUser() {
  try {
    const result = await pool.query(
      "UPDATE users SET is_active = true WHERE username = 'pedidos1'"
    );
    console.log('✅ Usuario pedidos1 activado');
    console.log('Filas actualizadas:', result.rowCount);
    
    // Verificar
    const check = await pool.query('SELECT username, is_active FROM users');
    console.log('\nEstado de usuarios:');
    check.rows.forEach(u => console.log(`  ${u.username}: ${u.is_active ? '✅ Activo' : '❌ Inactivo'}`));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

activateUser();
