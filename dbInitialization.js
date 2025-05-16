// init.js
import { initializeDatabase } from './collections/initdb.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  try {
    const success = await initializeDatabase();
    process.exit(success ? 0 : 1); // si es 0 es que si se ejecuto , si no es que no pues
  } catch (error) {
    console.error('❌ Error en inicialización:', error);
    process.exit(1); //termina el preceso
  }
};

run();