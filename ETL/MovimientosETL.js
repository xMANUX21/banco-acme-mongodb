import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadMovimientos(db) {
  try {
    const filePath = path.join(__dirname, '..', 'raw_data', 'movimientos.csv');
    const content = await fs.readFile(filePath, 'utf8');

    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');

    const records = lines.slice(1).map(line => {
      const values = line.split(',');
      const record = {};
      headers.forEach((header, index) => {
        record[header.trim()] = values[index]?.trim();
      });

      
     return {
 
  tipo: record.tipo,
  monto:parseInt(record.monto),
  fecha: new Date(record.fecha),
  descripcion:record.descripcion,
  servicio: record.servicio,

};

    });

    await db.collection('movimientos').drop().catch(() => {});
    await db.createCollection('movimientos');

    await db.collection('movimientos').insertMany(records);
    console.log("✅Movimientos insertados correctamente");
  } catch (error) {
    console.error("❌ Error al insertar movimientos:");
    console.error("📛 Mensaje:", error.message);
  }
}


