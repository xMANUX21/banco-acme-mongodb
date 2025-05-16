import http from 'http';
import { MongoClient, ObjectId } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { createReadStream } from 'fs';
import { DBNAME, DBURL } from './helpers/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//  parsear JSON del body
async function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error('JSON inválido'));
            }
        });
    });
}

// Conectar a MongoDB
async function connectDB() {
    const client = await MongoClient.connect(DBURL);
    return client.db(DBNAME);
}

//  registrar movimientos
async function registrarMovimiento(db, usuarioId, tipo, monto, servicio = null) {
    const movimiento = {
        usuarioId: new ObjectId(usuarioId),
        tipo,
        monto: parseFloat(monto),
        fecha: new Date()
    };
    
    if (servicio) {
        movimiento.servicio = servicio;
    }
    
    await db.collection('movimientos').insertOne(movimiento);
}
// Handlers para POST
async function handleConsignar(req, res) {
    try {
        const data = await parseBody(req);
        const db = await connectDB();
        
        const result = await db.collection('usuarios').updateOne(
            { _id: new ObjectId(data.id) },
            { $inc: { saldo: parseFloat(data.monto) } }
        );
        
        await registrarMovimiento(db, data.id, 'consignación', data.monto);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, result }));
    } catch (error) {
        res.writeHead(400);
        res.end('Error al consignar: ' + error.message);
    }
}

async function handleRetiro(req, res) {
    try {
        const data = await parseBody(req);
        const db = await connectDB();
        const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(data.id) });

        if (usuario.saldo >= data.monto) {
            await db.collection('usuarios').updateOne(
                { _id: new ObjectId(data.id) },
                { $inc: { saldo: -parseFloat(data.monto) } }
            );
            
            await registrarMovimiento(db, data.id, 'retiro', data.monto);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(400);
            res.end('Saldo insuficiente');
        }
    } catch (error) {
        res.writeHead(400);
        res.end('Error al retirar: ' + error.message);
    }
}

async function handlePagoServicio(req, res) {
    try {
        const data = await parseBody(req);
        const db = await connectDB();
        const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(data.id) });

        if (!data.servicio || !['gas', 'luz', 'agua'].includes(data.servicio)) {
            res.writeHead(400);
            res.end('Servicio no válido. Debe ser gas, luz o agua');
            return;
        }

        if (usuario.saldo >= data.monto) {
            await db.collection('usuarios').updateOne(
                { _id: new ObjectId(data.id) },
                { $inc: { saldo: -parseFloat(data.monto) } }
            );
            
            await registrarMovimiento(db, data.id, 'pago_servicio', data.monto, data.servicio);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(400);
            res.end('Saldo insuficiente para el pago de servicio');
        }
    } catch (error) {
        res.writeHead(400);
        res.end('Error al pagar servicio: ' + error.message);
    }
}

// Handler para obtener movimientos
async function handleGetMovimientos(req, res) {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const usuarioId = url.searchParams.get('usuarioId');
        
        if (!usuarioId) {
            res.writeHead(400);
            res.end('Se requiere el ID de usuario');
            return;
        }

        const db = await connectDB();
        
        // Verificar si el usuario existe
        const usuario = await db.collection('usuarios').findOne({ 
            _id: new ObjectId(usuarioId) 
        });
        
        if (!usuario) {
            res.writeHead(404);
            res.end('Usuario no encontrado');
            return;
        }

        // Obtener  los movimientos del usuario
        const movimientos = await db.collection('movimientos')
            .find({ 
                $or: [
                    { usuarioId: new ObjectId(usuarioId) },
                    { usuarioId: usuarioId } // 
                ]
            })
            .sort({ fecha: -1 })
            .toArray();

        // Formatear respuesta consistente
        const responseData = {
            usuario: {
                _id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                saldo: usuario.saldo
            },
            movimientos: movimientos.map(mov => ({
                _id: mov._id,
                tipo: mov.tipo || 'movimiento', // Valor por defecto
                monto: mov.monto,
                fecha: mov.fecha,
                servicio: mov.servicio,
                descripcion: mov.descripcion
            }))
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseData));
    } catch (error) {
        res.writeHead(400);
        res.end('Error al obtener movimientos: ' + error.message);
    }
}

// Crear servidor
const server = http.createServer(async (req, res) => {
    console.log(`Solicitud: ${req.method} ${req.url}`);

    if (req.method === 'GET' && req.url === '/') {
        const htmlPath = join(__dirname, 'index.html');
        fs.readFile(htmlPath, 'utf8', (err, html) => {
            if (err) {
                res.writeHead(500);
                res.end('Error al cargar la página');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/css/style.css') {
        const cssPath = join(__dirname, 'css', 'style.css');
        const stream = createReadStream(cssPath);
        res.writeHead(200, { 'Content-Type': 'text/css' });
        stream.pipe(res);
        return;
    }

    // Endpoints de acciones
    if (req.method === 'POST') {
        switch (req.url) {
            case '/consignar':
                await handleConsignar(req, res);
                return;
            case '/retiro':
                await handleRetiro(req, res);
                return;
            case '/pagar_servicio':
                await handlePagoServicio(req, res);
                return;
            default:
                res.writeHead(404);
                res.end('Ruta no encontrada');
        }
    } else if (req.method === 'GET' && req.url.startsWith('/movimientos')) {
        await handleGetMovimientos(req, res);
        return;
    } else {
        res.writeHead(404);
        res.end('Ruta no encontrada');
    }
});

// Iniciar servidor
server.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});