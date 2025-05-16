import { BaseCollection } from '../CRUD/BaseCRUD.js';

export class MovementsCollection extends BaseCollection {
  constructor(db) {
    super(db, 'movimientos');
  }

  async createCollection() {
    try {
      await this.collection.drop().catch(() => {});
      
      await this.db.createCollection(this.collectionName, {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["usuario_id", "tipo", "monto", "fecha"],
            properties: {
              usuario_id: {
                 bsonType: "objectId" 
                },
              tipo: {
                 enum: ["consignación", "retiro", "pago_servicio"] 
                },
              monto: {
                 bsonType: "double", minimum: 0.01
                 },
              fecha: { 
                bsonType: "date"
               },
              descripcion: { 
                bsonType: "string"
               },
              servicio: { 
                enum: ["luz", "gas", "agua"]
               }
            }
          }
        }
      });

      await this.collection.createIndex({ usuario_id: 1 });
      await this.collection.createIndex({ fecha: -1 });
      console.log(`✅ Colección '${this.collectionName}' creada con validación.`);
      return true;
    } catch (error) {
      console.error(`❌ Error creando colección ${this.collectionName}:`, error);
      return false;
    }
  }

  // Métodos específicos para movimientos
  async findByUserId(userId, options = {}) {
    try {
      const { limit = 10, skip = 0, sort = { fecha: -1 } } = options;
      return await this.collection.find({ usuario_id: new ObjectId(userId) })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error("Error buscando movimientos:", error);
      return [];
    }
  }

  async getMonthlySummary(userId, year, month) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      return await this.collection.aggregate([
        {
          $match: {
            usuario_id: new ObjectId(userId),
            fecha: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: "$tipo",
            total: { $sum: "$monto" },
            count: { $sum: 1 }
          }
        }
      ]).toArray();
    } catch (error) {
      console.error("Error generando resumen:", error);
      return [];
    }
  }

  // Sobrescribir campos protegidos
  getProtectedFields() {
    return [...super.getProtectedFields(), 'usuario_id', 'fecha'];
  }
}