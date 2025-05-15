import { loadUsuarios } from './ETL/UsuariosETL.js';  // Función que cargará los usuarios
import { loadMovimientos } from './ETL/MovimientosETL.js';  // Función que cargará los movimientos
// import { fixReferences } from './fixReferences.js';  // En caso de necesitar ajustes de referencias
import { main } from './helpers/db.js';  // Solo una importación de 'main'

const run = async () => {
  try {
    console.log("🚀 Iniciando carga completa de datos bancarios...");
    const db = await main();  // Obtener la conexión a la base de datos

    // Fase 1: Carga de usuarios
    console.log("📦 Cargando usuarios...");
    await loadUsuarios(db);

    // Fase 2: Carga de movimientos bancarios
    console.log("💰 Cargando movimientos...");
    await loadMovimientos(db);
    
    // Fase 3: Corrección de referencias (si es necesario)
    // console.log("🔧 Ajustando referencias...");
    // await fixReferences(db);  // Esto podría usarse si necesitas corregir algún vínculo de usuario-movimiento, etc.

    console.log("✅🎉 Carga completada exitosamente");
  } catch (err) {
    console.error("❌ Error crítico durante la carga:", err);
    process.exit(1);
  } finally {
    process.exit();
  }
};

run();
