const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const path = require('path');
const helmet = require('helmet'); // Protección OWASP activa

// Inicialización de Firebase
const serviceAccount = require('./firebase-credentials.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const app = express();

// --- SEGURIDAD OWASP ---
app.use(helmet({
    contentSecurityPolicy: false, 
}));
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (HTML, CSS, JS) para usar http://localhost:3000
app.use(express.static(path.join(__dirname))); 

const SECRET_KEY = "clave_maestra_ramz_axcen";

// RUTA: REGISTRO DE USUARIO (Con validación y Hash)
app.post('/api/registro', async (req, res) => {
    try {
        const { nombre, email, telefono, password } = req.body;
        
        // Validación de entradas (OWASP: Validación de datos)
        if (!nombre || !email || !telefono || !password) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        const usersRef = db.collection('Usuarios');
        
        // Protección contra duplicados (Validación lógica)
        const emailCheck = await usersRef.where('correo', '==', email).get();
        const phoneCheck = await usersRef.where('telefono', '==', telefono).get();
        
        if (!emailCheck.empty) return res.status(400).json({ error: "El correo ya está registrado." });
        if (!phoneCheck.empty) return res.status(400).json({ error: "El teléfono ya está registrado." });

        // Cifrado de contraseña (OWASP: Hash seguro)
        const password_hash = await bcrypt.hash(password, 12);

        await usersRef.add({
            nombre: nombre,
            correo: email,
            telefono: telefono,
            password_hash: password_hash,
            fecha_registro: new Date().toISOString(),
            peso: "",
            estatura: "",
            objetivo: ""
        });

        res.status(200).json({ message: "Usuario creado con éxito" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// RUTA: LOGIN DUAL (Correo o Teléfono)
app.post('/api/login', async (req, res) => {
    try {
        const { identificador, password } = req.body;
        if (!identificador || !password) return res.status(400).json({ error: "Credenciales incompletas" });

        const usersRef = db.collection('Usuarios');
        let snapshot;

        // Lógica de identificación (Anti-Inyección SQL por NoSQL)
        if (identificador.includes('@')) {
            snapshot = await usersRef.where('correo', '==', identificador).get();
        } else {
            snapshot = await usersRef.where('telefono', '==', identificador).get();
        }

        if (snapshot.empty) return res.status(401).json({ error: "Usuario no encontrado" });

        let usuario = {};
        snapshot.forEach(doc => { usuario = { id: doc.id, ...doc.data() }; });

        // Verificación segura de contraseña
        const esValida = await bcrypt.compare(password, usuario.password_hash);
        if (!esValida) return res.status(401).json({ error: "Contraseña incorrecta" });

        // Generación de sesión segura (JWT)
        const token = jwt.sign({ id: usuario.id }, SECRET_KEY, { expiresIn: '1h' });

        res.status(200).json({ success: true, token: token });
    } catch (error) {
        res.status(500).json({ error: "Error en el inicio de sesión" });
    }
});

// MIDDLEWARE: VERIFICACIÓN DE SESIÓN (Rutas Protegidas)
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Acceso no autorizado" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Sesión expirada" });
        req.usuario = user;
        next();
    });
};

// RUTA: CONSULTA DE PERFIL (Información Protegida)
app.get('/api/perfil', verificarToken, async (req, res) => {
    try {
        const doc = await db.collection('Usuarios').doc(req.usuario.id).get();
        if (!doc.exists) return res.status(404).json({ error: "Perfil no encontrado" });
        
        const data = doc.data();
        res.status(200).json({ 
            nombre: data.nombre,
            correo: data.correo,
            peso: data.peso || '--',
            estatura: data.estatura || '--',
            objetivo: data.objetivo || 'No definido'
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener perfil" });
    }
});

// RUTA: ACTUALIZAR DATOS DE SALUD
app.put('/api/perfil', verificarToken, async (req, res) => {
    try {
        const { peso, estatura, objetivo } = req.body;
        await db.collection('Usuarios').doc(req.usuario.id).update({
            peso: peso,
            estatura: estatura,
            objetivo: objetivo
        });
        res.status(200).json({ message: "Datos actualizados" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar datos" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`--- SISTEMA NUTRI-FIT ---`);
    console.log(`Backend Blindado (OWASP) activo.`);
    console.log(`Servidor corriendo en: http://localhost:${PORT}`);
});