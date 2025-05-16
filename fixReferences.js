// import { MongoClient, ObjectId } from 'mongodb';
// import { DBURL, DBNAME } from './helpers/db.js';

// const client = new MongoClient(DBURL);

// export async function fixReferences(db) {
//   try {
//     console.log("🛠️ Comprobando y reparando referencias...");

//     const usuarios = await db.collection('usuarios').find().toArray();
//     const movimientos = await db.collection('movimientos').find().toArray();

//     if (usuarios.length === 0 || movimientos.length === 0) {
//       throw new Error('Primero debes cargar usuarios y movimientos');
//     }

//     const tipos = ['consignación', 'retiro', 'pago_servicio'];
//     const servicios = ['luz', 'agua', 'gas'];
//     const descripciones = {
//       'consignación': ['Depósito en cuenta', 'Transferencia recibida'],
//       'retiro': ['Retiro en cajero', 'Retiro por ventanilla'],
//       'pago_servicio': ['Pago de luz', 'Pago de agua', 'Pago de gas']
//     };

//     let updates = 0;

//     for (let i = 0; i < movimientos.length; i++) {
//   const movimiento = movimientos[i];
//   const usuario = usuarios[i % usuarios.length];
//   const tipo = tipos[i % tipos.length];

//   const nuevoMovimiento = {
//     usuario: usuario._id,
//     tipo,
//     monto: Math.floor(Math.random() * 5000 + 1000),
//     fecha: new Date(2024, i % 12, (i % 28) + 1),
//     descripcion: descripciones[tipo][i % descripciones[tipo].length]
//   };

//   const updateOps = { $set: nuevoMovimiento };

//   if (tipo === 'pago_servicio') {
//     updateOps.$set.servicio = servicios[i % servicios.length];
//   } else {
//     updateOps.$unset = { servicio: "" };
//   }

//   await db.collection('movimientos').updateOne(
//     { _id: movimiento._id },
//     updateOps
//   );
//   updates++;
// }


//     console.log(`✅ ${updates} movimientos actualizados`);
//   } catch (err) {
//     console.error('❌ Error reparando referencias:', err.message);
//     throw err;
//   }
// }

// // Ejecutar directamente si es llamado como script
// if (import.meta.url === `file://${process.argv[1]}`) {
//   (async () => {
//     await client.connect();
//     try {
//       await fixReferences(client.db(DBNAME));
//     } finally {
//       await client.close();
//     }
//   })();
// }


import { MongoClient, ObjectId } from 'mongodb';
import { DBURL, DBNAME } from './helpers/db.js';

const client = new MongoClient(DBURL);

export async function fixReferences(db) {
  try {
    console.log("🛠️ Comprobando y reparando referencias usuarioId...");

    //  Obtener todos los usuarios y movimientos
    const usuarios = await db.collection('usuarios').find().toArray();
    const movimientos = await db.collection('movimientos').find().toArray();

    if (usuarios.length === 0 || movimientos.length === 0) {
      throw new Error('Primero debes cargar usuarios y movimientos');
    }

    let updates = 0;

    //  Actualizar cada movimiento manteniendo sus datos originales
    for (let i = 0; i < movimientos.length; i++) {
      const movimiento = movimientos[i];
      const usuario = usuarios[i % usuarios.length]; // Asignacion

      //  actualiza usuarioId 
      await db.collection('movimientos').updateOne(
        { _id: movimiento._id },
        { 
          $set: { 
            usuarioId: usuario._id // referencia
          },
          $setOnInsert: { 
            tipo: movimiento.tipo || 'movimiento',
            monto: movimiento.monto || 0,
            fecha: movimiento.fecha || new Date(),
            descripcion: movimiento.descripcion || '',
            servicio: movimiento.servicio || null
          }
        }
      );
      updates++;
    }

    console.log(`✅ ${updates} movimientos actualizados (solo campo usuarioId)`);
    return { totalMovimientos: movimientos.length, updates };
    
  } catch (err) {
    console.error('❌ Error reparando referencias:', err.message);
    throw err;
  }
}

// si es llamado como script
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await client.connect();
    try {
      await fixReferences(client.db(DBNAME));
    } finally {
      await client.close();
    }
  })();
}