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

async function testAllUsers() {
  try {
    console.log('\n📋 VERIFICACIÓN DE TODOS LOS USUARIOS Y CONTRASEÑAS\n');
    console.log('='.repeat(70));

    const users = [
      { username: 'admin', password: 'admin123' },
      { username: 'cocinero1', password: 'cocina123' },
      { username: 'cocinero2', password: 'cocina123' },
      { username: 'pedidos1', password: 'pedidos123' },
      { username: 'pedidos2', password: 'pedidos123' }
    ];

    for (const testUser of users) {
      console.log(`\n🔍 Usuario: ${testUser.username}`);
      
      // Buscar usuario en BD
      const result = await pool.query(
        'SELECT id, username, password_hash, role, is_active FROM users WHERE username = $1',
        [testUser.username]
      );

      if (result.rows.length === 0) {
        console.log(`   ❌ No existe en la base de datos`);
        continue;
      }

      const dbUser = result.rows[0];
      console.log(`   Rol: ${dbUser.role}`);
      console.log(`   Activo: ${dbUser.is_active ? '✅' : '❌'}`);

      // Verificar contraseña
      const isValid = await bcrypt.compare(testUser.password, dbUser.password_hash);
      console.log(`   Contraseña "${testUser.password}": ${isValid ? '✅ VÁLIDA' : '❌ INCORRECTA'}`);

      if (!isValid) {
        // Intentar con variaciones
        const variations = [
          testUser.password.toUpperCase(),
          testUser.password.toLowerCase(),
          testUser.password.charAt(0).toUpperCase() + testUser.password.slice(1)
        ];

        console.log(`   Probando variaciones...`);
        for (const variation of variations) {
          const varValid = await bcrypt.compare(variation, dbUser.password_hash);
          if (varValid) {
            console.log(`   ✅ Contraseña correcta: "${variation}"`);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Verificación completada\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

testAllUsers();
