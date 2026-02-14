const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '192.168.100.35',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'NANOLOMOS',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'dev1234'
});

async function updateImages() {
  try {
    // Actualizar lomos con imagen de lomo
    const lomos = await pool.query(
      "UPDATE menu_items SET image_url = '/images/menu/lomo.jpg' WHERE LOWER(name) LIKE '%lomo%' RETURNING id, name"
    );
    console.log('✅ Lomos actualizados:', lomos.rowCount);
    lomos.rows.forEach(r => console.log('  -', r.name));

    // Actualizar hamburguesas con imagen de hamburguesa
    const hamburguesas = await pool.query(
      "UPDATE menu_items SET image_url = '/images/menu/hamburguesa.jpg' WHERE LOWER(name) LIKE '%hamburguesa%' RETURNING id, name"
    );
    console.log('\n✅ Hamburguesas actualizadas:', hamburguesas.rowCount);
    hamburguesas.rows.forEach(r => console.log('  -', r.name));

    // Para pizzas y adicionales, usar una imagen genérica o dejar null
    // Por ahora un placeholder o nada
    console.log('\n📝 Pizzas y adicionales quedan sin imagen (no hay foto disponible)');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

updateImages();
