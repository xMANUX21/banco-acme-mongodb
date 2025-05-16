import { ObjectId } from 'mongodb';

export class BaseCollection {
  constructor(db, collectionName) {
    this.db = db;
    this.collectionName = collectionName;
    this.collection = db.collection(collectionName);
  }

  // Insert
  async insert(document) {
    try {
      const result = await this.collection.insertOne(document);
      return {
        success: true,
        insertedId: result.insertedId,
        message: `${this.collectionName.slice(0, -1)} creado exitosamente`
      };
    } catch (error) {
      return this.handleError(error, 'insertar');
    }
  }

  // (Find by ID
  async findById(id) {
    try {
      return await this.collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error(`Error buscando por ID en ${this.collectionName}:`, error);
      return null;
    }
  }

  // UPDATE
  async update(id, updateData) {
    try {
      // Eliminar campos protegidos
      this.getProtectedFields().forEach(field => delete updateData[field]);

      const result = await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      return {
        success: result.modifiedCount > 0,
        modifiedCount: result.modifiedCount,
        message: result.modifiedCount > 0 
          ? `${this.collectionName.slice(0, -1)} actualizado exitosamente` 
          : "No se realizaron cambios"
      };
    } catch (error) {
      return this.handleError(error, 'actualizar');
    }
  }

  // DELETE
  async delete(id) {
    try {
      const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
      return {
        success: result.deletedCount > 0,
        deletedCount: result.deletedCount,
        message: result.deletedCount > 0
          ? `${this.collectionName.slice(0, -1)} eliminado exitosamente`
          : "No encontrado"
      };
    } catch (error) {
      return this.handleError(error, 'eliminar');
    }
  }

  //  sobrescribir en clases hijas
  getProtectedFields() {
    return ['_id', 'fecha_creacion', 'fecha_registro'];
  }

  handleError(error, action) {
    console.error(`Error al ${action} en ${this.collectionName}:`, error);
    const isDuplicate = error.code === 11000;
    const isValidation = error.message.includes('validation');
    
    return {
      success: false,
      error: isDuplicate ? 'Documento duplicado' : 
             isValidation ? 'Datos no válidos' : 
             error.message
    };
  }

  //  creacion de coleccion
  async createCollection() {
    throw new Error('Método createCollection() debe ser implementado por la clase hija');
  }
}