// 1. Importar las herramientas necesarias
const express = require('express');
const cors = require('cors'); // Para permitir la conexión desde Netlify
const mysql = require('mysql2/promise');

// 2. Crear la aplicación del servidor
const app = express();
app.use(cors()); // Habilitar CORS
app.use(express.json()); // Permitir que el servidor entienda datos JSON

// 3. Crear la ruta para recibir las inscripciones
app.post('/api/inscribir', async (req, res) => {
  const data = req.body;

  // La misma lógica de base de datos que ya teníamos
  const connectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
  };

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
    // Si todo va bien, enviamos una respuesta de éxito
    res.status(200).json({ message: 'Inscripción guardada correctamente' });
  } catch (error) {
    console.error('Error en la base de datos:', error);
    // Si algo falla, enviamos una respuesta de error
    res.status(500).json({ error: 'No se pudo guardar la inscripción.' });
  }
});

// ==========================================================
// NUEVA RUTA PARA OBTENER LA LISTA DE INSCRIPTOS
// ==========================================================
app.get('/api/inscriptos', async (req, res) => {
  // Obtenemos la categoría del filtro, si es que viene en la URL
  // ej: /api/inscriptos?categoria=masculino-c
  const { categoria } = req.query;

  // Preparamos la consulta base
  let sql = 'SELECT integrantes, categoria FROM inscriptos ORDER BY id DESC';
  const params = [];

  // Si nos piden filtrar por una categoría específica...
  if (categoria) {
    sql = 'SELECT integrantes, categoria FROM inscriptos WHERE categoria = ? ORDER BY id DESC';
    params.push(categoria);
  }

  try {
    const connection = await mysql.createConnection(connectionConfig);
    // Ejecutamos la consulta (con o sin filtro)
    const [rows] = await connection.execute(sql, params);
    await connection.end();
    // Enviamos la lista de jugadores como respuesta
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener inscriptos:', error);
    res.status(500).json({ error: 'No se pudo obtener la lista de inscriptos.' });
  }
});
// 4. Poner el servidor a escuchar en un puerto
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});