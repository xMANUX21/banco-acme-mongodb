import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { UsersCollection } from '../collections/usuarios.js';

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
      const values = [];
      let inQuotes = false;
      let currentValue = '';

      for (let char of line) {
        if (char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      records.push(record);
    }

    const usuariosData = records.map(record => {
      let topics = [];
      if (record.topics) {
        try {
          // Limpiar el string JSON
          let topicsStr = record.topics.trim();
          
          // Elimina comillas simples circundantes si existen
          if (topicsStr.startsWith("'") && topicsStr.endsWith("'")) {
            topicsStr = topicsStr.slice(1, -1);
          }
          
          // Asegura que las comillas dobles esten
          topicsStr = topicsStr.replace(/(\w+):/g, '"$1":');
          
          // Parsear el JSON
          topics = JSON.parse(topicsStr);
        } catch (err) {
          console.warn(`⚠️ No se pudo parsear topics en el curso ${record.code}:`, err.message);
          console.warn("📌 String problemático:", record.topics);
          topics = [];
        }
      }

      return {
        nombre:record.nombre,
        documento: record.documento,
        clave: record.clave,
        saldo: parseInt(record.saldo),
        fecha_registro: new Date(record.fecha_registro),
        
      };
    });

    const usuarios = new UsersCollection(db);
    await usuarios.createCollection();
    await db.collection('usuarios').insertMany(usuariosData);
    console.log("✅ Usuarios insertados correctamente.");
  } catch (error) {
    console.error("❌ Error al insertar usuarios:");
    console.error("📛 Mensaje:", error.message);
  }
}