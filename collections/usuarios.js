export class UsersCollection {
  
    constructor(db) {
      this.database = db;
      this.collection = db.collection('usuarios');
    }
  
    async createCollection() {
       await this.database.collection('usuarios').drop().catch(() => {});
      await this.database.createCollection('usuarios', {
         validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["nombre", "documento", "clave", "saldo"],
                properties: {
                  nombre: {
                    bsonType: "string",
                    description: "El nombre del usuario debe ser una cadena de caracteres."
                  },
                  documento: {
                    bsonType: "string",
                    description: "El documento debe ser una cadena."
                  },
                  clave: {
                    bsonType: "string",
                    description: "La clave debe ser una cadena cifrada (hash)."
                  },
                  saldo: {
                    bsonType: "double",
                    minimum: 0,
                    description: "El saldo debe ser un número positivo o cero."
                  },
                  fecha_registro: {
                    bsonType: "date",
                    description: "La fecha de registro debe ser un valor de fecha."
                  }
                }
              }
         }
      });
      console.log("✅ Colección 'users' creada con validación.");
    }
  }





  
   
  
  