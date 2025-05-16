import { loadMovimientos } from "./ETL/MovimientosETL.js";
import {  loadUsuarios } from "./ETL/UsuariosETL.js";
import { fixReferences } from './fixReferences.js';
import { main } from "./helpers/db.js";

const run = async () => {
  try {
    console.log("🚀 Iniciando carga completa de datos...");
    const db = await main();

    //  Carga de datos 
    console.log("📦 Cargando datos base...");
    await loadUsuarios(db);
  
    
    //  Carga de collections con referencias
    console.log("🔗 Cargando datos relacionales...");
  
    await loadMovimientos(db);
    
    // correccion de referencias
    console.log("🔧 Ajustando referencias...");
    await fixReferences(db);

    console.log("✅🎉 Carga completada exitosamente");
  } catch (err) {
    console.error("❌ Error crítico durante la carga:", err);
    process.exit(1);
  } finally {
    process.exit();
  }
};

run();