export class MovementsCollection {
  
    constructor(db) {
      this.database = db;
      this.collection = db.collection('movimientos');
    }
  
    async createCollection() {
       await this.database.collection('movimientos').drop().catch(() => {});
      await this.database.createCollection('movimientos', {
         validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["usuario_id", "tipo", "monto", "fecha"],
                properties: {
                  usuario_id: {
                    bsonType: "objectId",
                    description: "Debe ser un ObjectId válido que refiere al usuario"
                  },
                  tipo: {
                    bsonType: "string",
                    enum: ["consignación", "retiro", "pago_servicio"],
                    description: "El tipo de movimiento debe ser uno de: 'consignación', 'retiro', 'pago_servicio'"
                  },
                  monto: {
                    bsonType: "double",
                    minimum: 0.01,  // Monto mínimo debe ser mayor que 0
                    description: "El monto debe ser un número positivo mayor que 0"
                  },
                  fecha: {
                    bsonType: "date",
                    description: "La fecha debe ser una fecha válida"
                  },
                  descripcion: {
                    bsonType: "string",
                    description: "La descripción debe ser un string (opcional)"
                  },
                  servicio: {
                    bsonType: "string",
                    enum: ["luz", "gas", "energia"],
                    description: "Si es un pago de servicio, debe ser uno de: 'luz', 'gas', 'energia'"
                  }
                }
              }
         }
      });
      console.log("✅ Colección 'movimientos' creada con validación.");
    }
  }


