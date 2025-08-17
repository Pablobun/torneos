// 1. Importar las herramientas necesarias
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

// 2. Crear la aplicación del servidor
const app = express();
app.use(cors());
app.use(express.json());

// ==========================================================
// CAMBIO IMPORTANTE: DEFINIMOS LA CONFIGURACIÓN AQUÍ AFUERA
// ==========================================================
// Al definir 'connectionConfig' aquí, es "global" para todo el archivo.
// Tanto la ruta POST como la GET podrán verla y usarla.
const connectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
};

// 3. Crear la ruta para GUARDAR las inscripciones (POST)
app.post('/api/inscribir', async (req, res) => {
    const data = req.body;

    // YA NO definimos 'connectionConfig' aquí dentro. La usamos directamente.

    const sql = `
        INSERT INTO inscriptos (
          integrantes, correo, telefono, categoria,
          sabado, domingo, lunes, martes, miercoles, jueves, viernes, sabadof,
          acepto
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const values = [
        data.integrantes, data.email, data.telefono, data.categoria,
        data.sabado4, data.domingo5, data.lunes6, data.martes7,
        data.miercoles8, data.jueves9, data.viernes10, data.sabado11,
        data.terminos ? 1 : 0
    ];

    try {
        const connection = await mysql.createConnection(connectionConfig);
        await connection.execute(sql, values);
        await connection.end();
        res.status(200).json({ message: 'Inscripción guardada correctamente' });
    } catch (error) {
        console.error('Error al guardar en la base de datos:', error);
        res.status(500).json({ error: 'No se pudo guardar la inscripción.' });
    }
});

// 4. Crear la ruta para OBTENER las inscripciones (GET)
app.get('/api/inscriptos', async (req, res) => {
    const { categoria } = req.query;

    // YA NO definimos 'connectionConfig' aquí dentro. La usamos directamente.

    let sql = 'SELECT integrantes, categoria FROM inscriptos ORDER BY id DESC';
    const params = [];

    if (categoria) {
        sql = 'SELECT integrantes, categoria FROM inscriptos WHERE categoria = ? ORDER BY id DESC';
        params.push(categoria);
    }

    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [rows] = await connection.execute(sql, params);
        await connection.end();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener inscriptos:', error);
        res.status(500).json({ error: 'No se pudo obtener la lista de inscriptos.' });
    }
});

// 5. Poner el servidor a escuchar en un puerto
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});