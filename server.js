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
               // 1. Obtener datos crudos con logging
        console.log('=== DATOS CRUDOS ===');
        const [horariosResult] = await connection.execute(
            'SELECT id, dia_semana, fecha, hora_inicio, Canchas FROM horarios WHERE id_torneo_fk = ?',
            [idTorneo]
        );
        console.log('Horarios crudos:', horariosResult);

        const [inscriptosResult] = await connection.execute(
            `SELECT i.id, i.integrantes, i.categoria, 
                    GROUP_CONCAT(ih.id_horario_fk) as horarios
             FROM inscriptos i 
             LEFT JOIN inscriptos_horarios ih ON i.id = ih.id_inscripto_fk 
             WHERE i.id_torneo_fk = ? 
             GROUP BY i.id`,
            [idTorneo]
        );
        console.log('Inscriptos crudos:', inscriptosResult);

        // 2. Preparar datos para la IA con validación
               
        const horariosConCupo = horariosResult.map(h => ({
            id: h.id,
            fecha_formateada: h.fecha instanceof Date ? 
                `${h.fecha.getUTCDate()}/${h.fecha.getUTCMonth() + 1}/${h.fecha.getUTCFullYear().toString().slice(2)}` :
                `${h.fecha.substring(8,10)}/${h.fecha.substring(5,7)}/${h.fecha.substring(2,4)}`,
            hora: h.hora_inicio instanceof Date ? 
                `${h.hora_inicio.getUTCHours()}:${h.hora_inicio.getUTCMinutes().toString().padStart(2, '0')}` :
                h.hora_inicio.substring(0,5),
            cupo: h.Canchas
        }));

        const inscriptosConHorarios = inscriptosResult.map(i => ({
            id: i.id,
            integrantes: i.integrantes,
            categoria: i.categoria,
            horarios_disponibles: (typeof i.horarios === 'string') ? 
                i.horarios.split(',').map(h => parseInt(h.trim())).filter(h => !isNaN(h)) : []
        }));

        console.log('=== DATOS PROCESADOS PARA IA ===');
        console.log('Horarios procesados:', horariosConCupo.length);
        console.log('Inscriptos procesados:', inscriptosConHorarios.length);

              
        // 3. Generar resumen de configuración
        const generarResumenConfiguracion = () => {
            return Object.entries(configuracionGrupos).map(([cat, config]) => {
                const totalPorCategoria = (config.grupos3 || 0) * 3 + (config.grupos4 || 0) * 4 + (config.grupos5 || 0) * 5;
                let detalle = `- ${cat}: Se necesitan ${totalPorCategoria} jugadores (`;
                const partes = [];
                if (config.grupos3 > 0) partes.push(`${config.grupos3} grupos de 3`);
                if (config.grupos4 > 0) partes.push(`${config.grupos4} grupos de 4`);
                if (config.grupos5 > 0) partes.push(`${config.grupos5} grupos de 5`);
                return detalle + partes.join(', ') + ')';
            }).join('\n');
        };

        // 4. Construir prompt con las variables que se reemplazarán
                const prompt = `
Actúa como un organizador experto de torneos de tenis round robin.

DATOS DISPONIBLES:
- Horarios disponibles: ${JSON.stringify(horariosConCupo)}
- Jugadores (id, integrantes, categoria, horarios_disponibles): ${JSON.stringify(inscriptosConHorarios)}
- Configuración: ${JSON.stringify(configuracionGrupos)}

ESTRATEGIA INTELIGENTE:
1. Para cada categoría, analiza las disponibilidades horarias
2. Los jugadores con solo un horario disponible deben incluirse en grupos si es posible
3. Si un jugador con un solo horario no puede ser compatibilizado en grupos completos, irá a advertencias
4. Los grupos deben ser lo más competitivos posible

REGLAS:
1. Round robin completo: cada jugador debe jugar contra todos los demás de su grupo
2. Usar EXCLUSIVAMENTE los horarios listados en "Horarios disponibles"
3. Respetar límite de cupos por horario
4. Separar estrictamente por categorías
5. Formar exactamente las cantidades solicitadas en configuración

ESTRUCTURA JSON:
{
  "grupos": [...],
  "partidos": [...],
  "jugadores_sin_grupo": [...],
  "advertencias": [...]
}

Genera la solución óptima:
`;


        // 5. Llamada a la IA
        console.log('Enviando datos a Gemini...');
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // 6. Procesar respuesta
        console.log('Respuesta de Gemini:', text);
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
        return { grupos: [], partidos: [], advertencias: [{ mensaje: "Error al generar horarios con IA. " + error.message }] };
    }
}




// 5. Puerto de escucha
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});