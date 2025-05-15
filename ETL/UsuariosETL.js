import fs from 'fs/promises';
import path from 'path';
import { ObjectId } from 'mongodb';
import { fileURLToPath } from 'url';

// Obtener el archivo actual y el directorio
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadUsuarios(db) {
  try {
    const filePath = path.join(__dirname, '..', 'raw_data', 'usuarios.csv');
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

    // Usamos updateOne con upsert para evitar duplicados
    const usuariosData = records.map(record => {
      return {
        nombre: record.nombre,
        documento: record.documento,
        clave: record.clave,  // Asegúrate de que la clave esté cifrada si es necesario
        saldo: parseFloat(record.saldo),
        fecha_registro: new Date(record.fecha_registro),
      };
    });

    for (const user of usuariosData) {
      await db.collection('usuarios').updateOne(
        { documento: user.documento },  // Buscar por documento
        { $set: { nombre: user.nombre, clave: user.clave, saldo: user.saldo, fecha_registro: user.fecha_registro } },  // Actualiza si existe
        { upsert: true }  // Si no existe, lo inserta
      );
    }

    console.log("✅ Usuarios insertados correctamente.");
  } catch (error) {
    console.error("❌ Error al insertar usuarios:");
    console.error("📛 Mensaje:", error.message);
  }
}