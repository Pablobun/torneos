// 1. Importaciones y configuración inicial
const express = require('express');
//const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
//app.use(cors());
// Middleware para manejar CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).send();
        return;
    }
    
    next();
});

//hasta aca
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
    let connection;

    // Unimos los nombres de los integrantes
    const integrantesUnidos = `${data.integrante_masculino} / ${data.integrante_femenino}`;

    try {
        connection = await mysql.createConnection(connectionConfig);
        await connection.beginTransaction();

        // 1. Insertamos en 'inscriptos'. La consulta ahora es más corta.
        const sqlInscriptos = `
            INSERT INTO inscriptos (id_torneo_fk, integrantes, correo, telefono, categoria, acepto)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        // El array de valores ahora coincide perfectamente con la consulta
        const valuesInscriptos = [
            data.id_torneo_fk,
            integrantesUnidos.toUpperCase(),
            data.email,
            data.telefono,
            data.categoria,
            data.terminos ? 1 : 0
        ];
        
        const [result] = await connection.execute(sqlInscriptos, valuesInscriptos);
        const nuevoInscriptoId = result.insertId;

        // 2. Insertamos los horarios en la tabla de enlace 'inscriptos_horarios'
        if (data.horarios && data.horarios.length > 0) {
            const sqlHorarios = 'INSERT INTO inscriptos_horarios (id_inscripto_fk, id_horario_fk) VALUES ?';
            const valuesHorarios = data.horarios.map(idHorario => [nuevoInscriptoId, idHorario]);
            await connection.query(sqlHorarios, [valuesHorarios]);
        }
        
        await connection.commit();
        res.status(200).json({ message: 'Inscripción guardada correctamente' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al guardar en la base de datos:', error);
        res.status(500).json({ error: 'No se pudo guardar la inscripción.' });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================================
// ENDPOINT PARA LISTAR INSCRIPTOS (VERSIÓN ÚNICA Y CORRECTA)
// ==========================================================
app.get('/api/inscriptos', async (req, res) => {
    const { id_torneo_fk, categoria } = req.query;
    if (!id_torneo_fk) {
        return res.status(400).json({ error: 'Se requiere el ID del torneo.' });
    }
    let sql = 'SELECT integrantes, categoria FROM inscriptos WHERE id_torneo_fk = ?';
    const params = [id_torneo_fk];
    if (categoria) {
        sql += ' AND categoria = ?';
        params.push(categoria);
    }
    sql += ' ORDER BY id DESC';
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
// ==========================================================
// ENDPOINT PARA OBTENER HORARIOS CON DETALLES DE INSCRIPTOS
// ==========================================================
app.get('/api/horarios-compatibles/:idTorneo', async (req, res) => {
    const { idTorneo } = req.params;
    const sql = `
        SELECT h.id, h.dia_semana, h.fecha, h.hora_inicio, h.Canchas,
               COUNT(ih.id_inscripto_fk) as inscriptos_disponibles
        FROM horarios h
        LEFT JOIN inscriptos_horarios ih ON h.id = ih.id_horario_fk
        LEFT JOIN inscriptos i ON ih.id_inscripto_fk = i.id
        WHERE h.id_torneo_fk = ? AND h.activo = 1
        GROUP BY h.id
        ORDER BY h.fecha, h.hora_inicio
    `;
    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [rows] = await connection.execute(sql, [idTorneo]);
        await connection.end();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener horarios compatibles:', error);
        res.status(500).json({ error: 'Error del servidor al obtener horarios.' });
    }
});

// ==========================================================
// ENDPOINT PARA ARMAR GRUPOS (SISTEMA EXPERTO)
// ==========================================================
app.post('/api/armar-grupos', async (req, res) => {
    const { configuracionGrupos, idTorneo } = req.body;
    
    try {
        const resultado = await armarGruposBasico(configuracionGrupos, idTorneo);
        res.status(200).json({ 
            grupos: resultado.grupos, 
            partidos: resultado.partidos,
            advertencias: resultado.advertencias,
            mensaje: 'Grupos y horarios generados exitosamente con IA' 
        });
    } catch (error) {
        console.error('Error al armar grupos:', error);
        res.status(500).json({ error: 'Error al armar los grupos.', details: error.message });
    }
});


// ==========================================================
// ENDPOINT PARA GUARDAR GRUPOS EN LA BD
// ==========================================================
app.post('/api/guardar-grupos', async (req, res) => {
    const { grupos, idTorneo } = req.body;
    let connection;

    try {
        connection = await mysql.createConnection(connectionConfig);
        await connection.beginTransaction();

        // Insertar grupos
        for (const grupo of grupos) {
            const sqlGrupo = `
                INSERT INTO grupos (numero_grupo, id_torneo_fk, categoria, cantidad_integrantes, estado)
                VALUES (?, ?, ?, ?, 'armado')
            `;
            const [resultGrupo] = await connection.execute(sqlGrupo, [
                grupo.numero,
                idTorneo,
                grupo.categoria,
                grupo.cantidad
            ]);
            
            const idGrupo = resultGrupo.insertId;
            
            // Insertar integrantes del grupo
            for (const integrante of grupo.integrantes) {
                const sqlIntegrante = `
                    INSERT INTO grupo_integrantes (id_grupo, id_inscripto)
                    VALUES (?, ?)
                `;
                await connection.execute(sqlIntegrante, [idGrupo, integrante.id]);
            }
        }

        await connection.commit();
        res.status(200).json({ mensaje: 'Grupos guardados exitosamente' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al guardar grupos:', error);
        res.status(500).json({ error: 'Error al guardar los grupos.' });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================================
// ENDPOINT PARA OBTENER GRUPOS FORMADOS
// ==========================================================
app.get('/api/grupos/:idTorneo', async (req, res) => {
    const { idTorneo } = req.params;
    const sql = `
        SELECT g.id, g.numero_grupo, g.categoria, g.cantidad_integrantes, g.estado,
               GROUP_CONCAT(i.integrantes SEPARATOR ' | ') as integrantes
        FROM grupos g
        LEFT JOIN grupo_integrantes gi ON g.id = gi.id_grupo
        LEFT JOIN inscriptos i ON gi.id_inscripto = i.id
        WHERE g.id_torneo_fk = ?
        GROUP BY g.id
        ORDER BY g.categoria, g.numero_grupo
    `;
    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [rows] = await connection.execute(sql, [idTorneo]);
        await connection.end();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener grupos:', error);
        res.status(500).json({ error: 'Error al obtener los grupos.' });
    }
});

// ==========================================================
// FUNCIÓN BÁSICA PARA ARMAR GRUPOS (TEMPORAL)
// ==========================================================
async function armarGruposBasico(configuracionGrupos, idTorneo) {
    const connection = await mysql.createConnection(connectionConfig);

    try {
        // 1. Obtener datos crudos
        const [horariosResult] = await connection.execute(
            'SELECT id, dia_semana, fecha, hora_inicio, Canchas FROM horarios WHERE id_torneo_fk = ?',
            [idTorneo]
        );

        const [inscriptosResult] = await connection.execute(
            `SELECT i.id, i.integrantes, i.categoria, 
                    GROUP_CONCAT(ih.id_horario_fk) as horarios
             FROM inscriptos i 
             LEFT JOIN inscriptos_horarios ih ON i.id = ih.id_inscripto_fk 
             WHERE i.id_torneo_fk = ? 
             GROUP BY i.id`,
            [idTorneo]
        );

        // 2. OPTIMIZACIÓN: Limpiar datos para ahorrar tokens (Clave para evitar el error 429)
        // Solo enviamos lo estrictamente necesario a la IA
        const horariosSimples = horariosResult.map(h => ({
            id: h.id,
            dia: `${h.dia_semana} ${h.fecha} ${h.hora_inicio}`, // Unificamos para leer menos texto
            cupo: h.Canchas
        }));

        const inscriptosSimples = inscriptosResult.map(i => ({
            id: i.id,
            n: i.integrantes, // Abreviamos nombre variable
            cat: i.categoria,
            h: i.horarios ? i.horarios.split(',') : [] // Convertimos string a array real
        }));

        // 3. Prompt dinámico y detallado
        const generarResumenConfiguracion = () => {
            return Object.entries(configuracionGrupos).map(([cat, config]) => {
                const totalPorCategoria = (config.grupos3 || 0) * 3 + (config.grupos4 || 0) * 4 + (config.grupos5 || 0) * 5;
                let detalle = `- ${cat}: Total requerido: ${totalPorCategoria} jugadores (`;
                const partes = [];
                if (config.grupos3 > 0) partes.push(`${config.grupos3} grupos de 3`);
                if (config.grupos4 > 0) partes.push(`${config.grupos4} grupos de 4`);
                if (config.grupos5 > 0) partes.push(`${config.grupos5} grupos de 5`);
                return detalle + partes.join(', ') + ')';
            }).join('\n');
        };

        const generarValidaciones = () => {
            return Object.entries(configuracionGrupos).map(([cat, config]) => {
                const totalRequerido = (config.grupos3 || 0) * 3 + (config.grupos4 || 0) * 4 + (config.grupos5 || 0) * 5;
                return `- ${cat}: Debe asignar EXACTAMENTE ${totalRequerido} jugadores únicos`;
            }).join('\n');
        };

        const prompt = `
Actúa como un organizador experto de torneos de tenis round robin. Genera un JSON válido.

DATOS DISPONIBLES:
- Horarios disponibles (id, dia, cupo): ${JSON.stringify(horariosSimples)}
- Jugadores (id, nombre, categoria, ids_horarios_disponibles): ${JSON.stringify(inscriptosSimples)}

CONFIGURACIÓN REQUERIDA EXACTA:
${generarResumenConfiguracion()}

REGLAS IMPORTANTES:
1. Round robin completo: cada jugador debe jugar contra todos los demás de su grupo
2. Horarios de partido: DEBEN estar en los horarios disponibles de AMBOS jugadores
3. Límite de cupos: cada partido ocupa 1 cupo del horario. NO EXCEDER cupos disponibles
4. Excluir jugadores sin horarios (arrays vacíos)
5. RESPETAR EXACTAMENTE las cantidades solicitadas en configuración
6. Separar por categorías: NO MEZCLAR jugadores entre categorías

VALIDACIONES OBLIGATORIAS:
${generarValidaciones()}

ESTRUCTURA JSON OBLIGATORIA (solo JSON, sin texto adicional):
{
  "grupos": [
    {
      "numero": 1,
      "categoria": "Categoria-B",
      "integrantes": [
        {"id": 99, "integrantes": "NOMBRE1 / NOMBRE2"},
        {"id": 100, "integrantes": "NOMBRE3 / NOMBRE4"},
        {"id": 101, "integrantes": "NOMBRE5 / NOMBRE6"}
      ]
    }
  ],
  "partidos": [
    {
      "grupo": 1,
      "categoria": "Categoria-B",
      "local": {"id": 99, "integrantes": "NOMBRE1 / NOMBRE2"},
      "visitante": {"id": 100, "integrantes": "NOMBRE3 / NOMBRE4"},
      "horario_id": 5,
      "dia": "Lunes 09/03",
      "hora": "14:30"
    }
  ],
  "advertencias": [
    {
      "categoria": "Categoria-B",
      "mensaje": "El jugador X no tiene horarios compatibles",
      "id_inscripto": 115
    }
  ]
}

Genera el JSON solicitado respetando exactamente todas las reglas:
`;

        // 4. Llamada a la IA sin responseMimeType para evitar errores
        console.log('Enviando datos a Gemini...');
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Limpieza del JSON
        const jsonString = text.replace(/```json|```/g, '').trim();
        const resultado = JSON.parse(jsonString);

        await connection.end();

        return {
            grupos: resultado.grupos || [],
            partidos: resultado.partidos || [],
            advertencias: resultado.advertencias || []
        };


    } catch (error) {
        if (connection) await connection.end();
        console.error('CRITICAL ERROR GEMINI:', error);
        // Devolvemos un objeto vacío en lugar de romper todo el servidor
        return { grupos: [], partidos: [], advertencias: [{ mensaje: "La IA está saturada, intenta en 1 minuto.", error: error.message }] };
    }
}



// 5. Puerto de escucha
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});