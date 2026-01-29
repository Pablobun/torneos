// 1. Importaciones y configuración inicial
const express = require('express');
//const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
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
    console.log('=== DEBUG POST /api/armar-grupos ===');
    console.log('req.body:', req.body);
    
    const { configuracionGrupos, idTorneo } = req.body;
    
    try {
        console.log('Llamando a armarGruposBasico...');
        console.log('configuracionGrupos:', JSON.stringify(configuracionGrupos, null, 2));
        console.log('idTorneo:', idTorneo);
        
        const grupos = await armarGruposBasico(configuracionGrupos, idTorneo);
        console.log('Grupos generados:', grupos);
        
        res.status(200).json({ grupos, mensaje: 'Grupos generados exitosamente' });
    } catch (error) {
        console.error('=== ERROR COMPLETO ===');
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error al armar los grupos.', 
            details: error.message,
            stack: error.stack 
        });
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
    const grupos = [];
    let numeroCategoria = 1;
    
    for (const [categoria, config] of Object.entries(configuracionGrupos)) {
        // 1. Obtener inscriptos con sus horarios
        const sql = `
            SELECT i.id, i.integrantes, i.categoria,
                   GROUP_CONCAT(ih.id_horario_fk) as horarios
            FROM inscriptos i
            LEFT JOIN inscriptos_horarios ih ON i.id = ih.id_inscripto_fk
            WHERE i.id_torneo_fk = ? AND i.categoria = ?
            GROUP BY i.id
        `;
        const [inscriptos] = await connection.execute(sql, [idTorneo, categoria]);
        
        // 2. Analizar compatibilidad
        const { gruposFormados, sinCompatibilidad } = await analizarCompatibilidad(inscriptos, config, connection);
        
        // 3. Agregar grupos formados
        for (const grupo of gruposFormados) {
            grupos.push({
                numero: numeroCategoria++,
                categoria,
                cantidad: grupo.integrantes.length,
                integrantes: grupo.integrantes
            });
        }
        
        // 4. Si hay inscriptos sin compatibilidad, lanzar error
        if (sinCompatibilidad.length > 0) {
            const nombres = sinCompatibilidad.map(i => i.integrantes).join(', ');
            throw new Error(`Inscriptos sin horarios compatibles en ${categoria}: ${nombres}`);
        }
    }
    
    await connection.end();
    return grupos;
}

async function analizarCompatibilidad(inscriptos, config, connection) {
    const grupos = [];
    const sinCompatibilidad = [];
    const usados = new Set();
    
    // 1. Obtener capacidad de canchas por horario
    const sqlCanchas = 'SELECT id, Canchas FROM horarios WHERE id_torneo_fk = ?';
    const [horarios] = await connection.execute(sqlCanchas, [1]); // torneo activo
    
    const capacidadHorarios = {};
    horarios.forEach(h => {
        capacidadHorarios[h.id] = h.Canchas;
    });
    
    // 2. Para cada tamaño de grupo requerido
    for (const [tamano, cantidad] of Object.entries({grupos3: 3, grupos4: 4, grupos5: 5})) {
        for (let i = 0; i < (config[tamano] || 0); i++) {
            // 3. Buscar combinación compatible
            const grupo = await buscarGrupoCompatible(inscriptos, usados, parseInt(tamano.slice(6)), capacidadHorarios, connection);
            
            if (grupo) {
                grupos.push(grupo);
                grupo.integrantes.forEach(i => usados.add(i.id));
            } else {
                // No se encontró grupo compatible, buscar inscriptos sin compatibilidad
                const restantes = inscriptos.filter(i => !usados.has(i.id));
                sinCompatibilidad.push(...restantes);
                break;
            }
        }
    }
    
    return { gruposFormados: grupos, sinCompatibilidad };
}

async function buscarGrupoCompatible(inscriptos, usados, tamaño, capacidadHorarios, connection) {
    const disponibles = inscriptos.filter(i => !usados.has(i.id));
    
    // Si no hay suficientes inscriptos disponibles
    if (disponibles.length < tamaño) return null;
    
    // Obtener compatibilidades entre todos los inscriptos
    const compatibilidades = obtenerCompatibilidades(disponibles, capacidadHorarios);

    
    // Buscar grupo donde todos compartan al menos un horario con capacidad disponible
    for (let i = 0; i < disponibles.length - (tamaño - 1); i++) {
        for (let j = i + 1; j < disponibles.length; j++) {
            if (tamaño === 2 && compatibilidades[disponibles[i].id]?.has(disponibles[j].id)) {
                return { integrantes: [disponibles[i], disponibles[j]] };
            }
            
            for (let k = j + 1; k < disponibles.length; k++) {
                if (tamaño === 3 && compatibilidades[disponibles[i].id]?.has(disponibles[j].id) &&
                    compatibilidades[disponibles[i].id]?.has(disponibles[k].id) &&
                    compatibilidades[disponibles[j].id]?.has(disponibles[k].id)) {
                    return { integrantes: [disponibles[i], disponibles[j], disponibles[k]] };
                }
                
                for (let l = k + 1; l < disponibles.length; l++) {
                    if (tamaño === 4 && compatibilidades[disponibles[i].id]?.has(disponibles[j].id) &&
                        compatibilidades[disponibles[i].id]?.has(disponibles[k].id) &&
                        compatibilidades[disponibles[i].id]?.has(disponibles[l].id) &&
                        compatibilidades[disponibles[j].id]?.has(disponibles[k].id) &&
                        compatibilidades[disponibles[j].id]?.has(disponibles[l].id) &&
                        compatibilidades[disponibles[k].id]?.has(disponibles[l].id)) {
                        return { integrantes: [disponibles[i], disponibles[j], disponibles[k], disponibles[l]] };
                    }
                }
            }
        }
    }
    
    return null;
}

function obtenerCompatibilidades(inscriptos, capacidadHorarios) {
    const compatibilidades = {};
    
    // Para cada inscripto, obtener sus horarios
    for (const inscripto of inscriptos) {
        const horarios = inscripto.horarios ? inscripto.horarios.split(',').map(h => parseInt(h)) : [];
        
        // Para cada otro inscripto, verificar compatibilidad
        for (const otro of inscriptos) {
            if (inscripto.id === otro.id) continue;
            
            const otrosHorarios = otro.horarios ? otro.horarios.split(',').map(h => parseInt(h)) : [];
            
            // Encontrar horarios comunes con capacidad disponible
            const comunes = horarios.filter(h => 
                otrosHorarios.includes(h) && capacidadHorarios[h] > 0
            );
            
            if (comunes.length > 0) {
                if (!compatibilidades[inscripto.id]) {
                    compatibilidades[inscripto.id] = new Set();
                }
                compatibilidades[inscripto.id].add(otro.id);
            }
        }
    }
    
    return compatibilidades;
}



// 5. Puerto de escucha
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});