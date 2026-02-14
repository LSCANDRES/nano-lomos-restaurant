const bcrypt = require('bcrypt');
const db = require('./src/database/connection');

async function resetPasswords() {
  console.log('Resetting passwords...');
  
  const saltRounds = 10;
  
  // Reset admin
  const hashAdmin = await bcrypt.hash('admin123', saltRounds);
  await db.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hashAdmin, 'admin']);
  console.log('✅ admin: admin123');
  
  // Reset cocineros
  const hashCocina = await bcrypt.hash('cocina123', saltRounds);
  await db.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hashCocina, 'cocinero1']);
  await db.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hashCocina, 'cocinero2']);
  console.log('✅ cocinero1/cocinero2: cocina123');
  
  // Reset tomadores de pedidos
  const hashPedidos = await bcrypt.hash('pedidos123', saltRounds);
  await db.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hashPedidos, 'pedidos1']);
  await db.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hashPedidos, 'pedidos2']);
  console.log('✅ pedidos1/pedidos2: pedidos123');
  
  console.log('\n✅ Todas las contraseñas restablecidas!');
  process.exit(0);
}

resetPasswords().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
