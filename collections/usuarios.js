import { BaseCollection } from '../CRUD/BaseCRUD.js';

export class UsersCollection extends BaseCollection {
  constructor(db) {
    super(db, 'usuarios');
  }

  async createCollection() {
    try {
      await this.collection.drop().catch(() => {});
      
      await this.db.createCollection(this.collectionName, {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["nombre", "documento", "clave", "saldo"],
            properties: {
              nombre: {
                 bsonType: "string"
                },
              documento: { 
                bsonType: "string"
               },
              clave: { 
                bsonType: "string" 
              },
              saldo: {
                 bsonType: "int", minimum: 0 
                },
              fecha_registro: {
                 bsonType: "date" 
                }
            }
          }
        }
      });

      await this.collection.createIndex({ documento: 1 }, { unique: true });
      console.log(`✅ Colección '${this.collectionName}' creada con validación.`);
      return true;
    } catch (error) {
      console.error(`❌ Error creando colección ${this.collectionName}:`, error);
      return false;
    }
  }

  // Métodos específicos para usuarios
  async findByDocument(documento) {
    try {
      return await this.collection.findOne({ documento });
    } catch (error) {
      console.error("Error buscando usuario por documento:", error);
      return null;
    }
  }

  async updateBalance(userId, amount) {
    try {
      const result = await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        { $inc: { saldo: amount } }
      );
      return {
        success: result.modifiedCount > 0,
        newBalance: await this.getBalance(userId)
      };
    } catch (error) {
      return this.handleError(error, 'actualizar saldo');
    }
  }

  async getBalance(userId) {
    const user = await this.findById(userId);
    return user?.saldo || 0;
  }

  // Sobrescribir campos protegidos
  getProtectedFields() {
    return [...super.getProtectedFields(), 'documento'];
  }
}