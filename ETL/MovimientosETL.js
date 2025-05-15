import fs from 'fs/promises';
import path from 'path';
import { ObjectId } from 'mongodb';
import { fileURLToPath } from 'url';

// Obtener el archivo actual y el directorio
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadMovimientos(db) {
  try {
    // Usamos __dirname para construir la ruta correcta
    const filePath = path.join(__dirname, '..', 'raw_data', 'movimientos.csv');
    const content = await fs.readFile(filePath, 'utf8');

    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(header => header.trim());

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(',').map(value => value.trim());

      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });

      records.push(record);
    }

    const movimientosData = records.map(record => {
      return {
        usuario_id: new ObjectId(record.usuario_id),  // Referencia al usuario
        tipo: record.tipo,  // 'consignación', 'retiro', 'pago_servicio'
        monto: parseFloat(record.monto),
        fecha: new Date(record.fecha),
        descripcion: record.descripcion || '',
        servicio: record.servicio || null,
      };
    });

    await db.collection('movimientos').insertMany(movimientosData);
    console.log("✅ Movimientos insertados correctamente.");
  } catch (error) {
    console.error("❌ Error al insertar movimientos:");
    console.error("📛 Mensaje:", error.message);
  }
}
