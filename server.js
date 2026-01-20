// 1. Importaciones y configuración inicial
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// 2. Configuración de la conexión a la BD
const connectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
};

// ==========================================================
// ENDPOINT PARA OBTENER EL TORNEO ACTIVO
// ==========================================================
app.get('/api/torneo-activo', async (req, res) => {
    const sql = 'SELECT id, codigo_torneo, nombre FROM torneos WHERE activo_inscripcion = 1 LIMIT 1';
    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [rows] = await connection.execute(sql);
        await connection.end();
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ error: 'No hay torneos con inscripción activa.' });
        }
    } catch (error) {
        console.error('Error al obtener torneo activo:', error);
        res.status(500).json({ error: 'Error del servidor al buscar torneo.' });
    }
});

// ==========================================================
// ENDPOINT PARA OBTENER LOS HORARIOS DE UN TORNEO
// ==========================================================
app.get('/api/horarios/:idTorneo', async (req, res) => {
    const { idTorneo } = req.params;
    const sql = 'SELECT id, dia_semana, fecha, hora_inicio FROM horarios WHERE id_torneo_fk = ? AND activo = 1 ORDER BY fecha, hora_inicio';
    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [rows] = await connection.execute(sql, [idTorneo]);
        await connection.end();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener horarios:', error);
        res.status(500).json({ error: 'Error del servidor al buscar horarios.' });
    }
});

// ==========================================================
// ENDPOINT MODIFICADO PARA GUARDAR INSCRIPCIONES
// ==========================================================
app.post('/api/inscribir', async (req, res) => {
    const data = req.body;

    // Convertimos el array de horarios seleccionados a un texto JSON para guardarlo.
    const horariosSeleccionadosJSON = JSON.stringify(data.horarios);

    // Vaciamos las columnas de los días que ya no usamos.
    // Guardaremos el JSON de horarios en la columna 'sabado'. Es una solución temporal.
    const sql = `
        INSERT INTO inscriptos (
          id_torneo_fk, integrantes, correo, telefono, categoria,
          sabado, domingo, lunes, martes, miercoles, jueves, viernes, sabadof,
          acepto
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    
    const values = [
        data.id_torneo_fk,
        data.integrantes,
        data.email,
        data.telefono,
        data.categoria,
        horariosSeleccionadosJSON, // Guardamos el JSON aquí
        null, null, null, null, null, null, null, // El resto de días van nulos
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

// ==========================================================
// ENDPOINT PARA LISTAR INSCRIPTOS (SIN CAMBIOS POR AHORA)
// ==========================================================
app.get('/api/inscriptos', async (req, res) => {
    const { categoria } = req.query;
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

// 5. Puerto de escucha
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});