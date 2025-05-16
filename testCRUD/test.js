import { MongoClient } from 'mongodb';
import { DBURL, DBNAME } from './helpers/db.js';
import { UsersCollection } from '../collections/usuarios.js';
import { MovementsCollection } from '../collections/movimientos.js';

async function testCRUD() {
  const client = new MongoClient(DBURL);
  
  try {
    await client.connect();
    const db = client.db(DBNAME);

    // Inicializar colecciones
    const users = new UsersCollection(db);
    const movements = new MovementsCollection(db);
    
    await users.createCollection();
    await movements.createCollection();

    //  Crear usuario
    const userResult = await users.insert({
      nombre: "Carlos Pérez",
      documento: "987654321",
      clave: "hashed_123",
      saldo: 200000,
      fecha_registro: new Date()
    });

    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    //  Crear movimiento
    const movementResult = await movements.insert({
      usuario_id: new ObjectId(userResult.insertedId),
      tipo: "consignación",
      monto: 500000,
      descripcion: "Depósito inicial",
      fecha: new Date()
    });

    //  Consultar movimientos
    const userMovements = await movements.findByUserId(userResult.insertedId);
    console.log("Movimientos:", userMovements);

    // 4. Actualizar saldo
    const updateResult = await users.updateBalance(userResult.insertedId, -100000);
    console.log("Nuevo saldo:", updateResult.newBalance);

    // 5. Eliminar movimiento 
    // const deleteResult = await movements.delete(movementResult.insertedId);
    // console.log(deleteResult.message);

  } finally {
    await client.close();
  }
}

testCRUD();