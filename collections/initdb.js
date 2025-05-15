
import { MongoClient } from 'mongodb';
import { DBURL, DBNAME } from '../helpers/db.js';
import { MovementsCollection } from './movimientos.js';
import { UsersCollection } from './usuarios.js';

// a variables de entorno
const ADMIN_CONFIG = {
    user: process.env.DB_ADMIN_USER || 'admin_acme',
    pwd: process.env.DB_ADMIN_PASS || 'admin123'
};

export async function initializeDatabase() {
    const client = new MongoClient(DBURL);
    try {
        await client.connect();
        const db = client.db(DBNAME);

        console.log('---- INICIANDO BASE DE DATOS ---');
        //  seguridad
        await setupSecurity(db);
        //  colecciones con validaciones
        await createCollections(db);
        //  Indices
        await createIndexes(db);
        console.log('✅ Todos los componentes fueron inicializados correctamente');
        return true;
    } catch (error) {
        console.error(' Error durante la inicialización:', error.message);
        return false;
    } finally {
        await client.close();
    }
}

async function setupSecurity(db) {
    try {
        // Verifica si estamos en Atlas
        const isAtlas = DBURL.includes('mongodb+srv://'); // si estamos en atlas hara que no se creen los roles , pero si estamos en local si dejara , tambien se puede configurar en atlas los permisos de roles pero no quero
        
        if (!isAtlas) {
            await createRoles(db);
            await createAdminUser(db);
        } else {
            console.log(' Saltando creación de roles/usuario en Atlas - Configúralos manualmente');
        }
    } catch (error) {
        console.error(' Advertencia en configuración de seguridad:', error.message);
    }
}

async function createRoles(db) {
    const roles = [
        {
            role: 'banquero',
            privileges: [
                { resource: { db: DBNAME, collection: 'movimientos' },
                 actions: ['find', 'insert', 'update'] },

                { resource: { db: DBNAME, collection: 'usuarios' },
                 actions: ['find'] }
            ]
        },
        {
            role: 'customer',
            privileges: [
                { resource: { db: DBNAME, collection: 'movimientos' },
                 actions: ['find'] },

                { resource: { db: DBNAME, collection: 'usuarios' },
                 actions: ['find'] }
            ]
        }
    ];

    for (const roleDef of roles) {
        await db.command({
            createRole: roleDef.role,
            privileges: roleDef.privileges,
            roles: []
        });
    }
    console.log('✅ Roles creados:', roles.map(r => r.role).join(', '));
}

async function createAdminUser(db) {
    try {
        await db.command({
            createUser: ADMIN_CONFIG.user,
            pwd: ADMIN_CONFIG.pwd,
            roles: [
                { role: 'dbOwner', db: DBNAME },
                { role: 'banquero', db: DBNAME }
            ]
        });
        console.log(`✅ Usuario administrador "${ADMIN_CONFIG.user}" creado`);
    } catch (error) {
        if (error.codeName === 'DuplicateKey') {
            console.log(`El usuario administrador "${ADMIN_CONFIG.user}" ya existía`);
        } else {
            throw error;
        }
    }
}
// creacion de las collections
async function createCollections(db) {
    const collections = [
        new MovementsCollection(db),
        new UsersCollection(db),
    ];

    for (const collection of collections) {
        await collection.createCollection();
    }
}
// creacion de los indices
async function createIndexes(db) {
    const indexes = [
        // Usuarios
        { collection: 'usuarios', spec: { nombre: 1 }, options: { unique: false } },
        { collection: 'usuarios', spec: { documento: 1 },options:{unique:true} },
        
        // Movimientos
        { collection: 'movimientos', spec: { monto: 1} },
        { collection: 'movimientos', spec: { tipo:1 } },
        { collection: 'movimientos', spec: { servicio:1 } }
    ];

    for (const index of indexes) {
        await db.collection(index.collection)
            .createIndex(index.spec, index.options || {});
    }
    console.log('✅ Índices creados exitosamente');
}