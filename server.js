// 1. Importaciones y configuración inicial
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

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
    let sql = 'SELECT id, integrantes, categoria FROM inscriptos WHERE id_torneo_fk = ?';
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
// ENDPOINT PARA ARMAR GRUPOS (SISTEMA EXPERTO) - SIMPLIFICADO
// ==========================================================
app.post('/api/armar-grupos', async (req, res) => {
    const { configuracionGrupos, idTorneo } = req.body;
    
    try {
        const resultado = await armarGruposBasico(configuracionGrupos, idTorneo);
        
        // Verificar si hubo error en la generación (ej: Gemini falló)
        if (resultado.error) {
            console.error('Error en armarGruposBasico:', resultado.error);
            return res.status(500).json({ 
                error: 'Error al generar grupos con IA', 
                details: resultado.error 
            });
        }
        
        // Verificar que se generaron grupos
        if (!resultado.grupos || resultado.grupos.length === 0) {
            return res.status(400).json({ 
                error: 'No se pudieron formar grupos', 
                details: 'La IA no pudo crear grupos con la configuración proporcionada. Intentá con otra distribución.' 
            });
        }
        
        res.status(200).json({ 
            grupos: resultado.grupos, 
            partidos: resultado.partidos,
            sin_grupo: resultado.sin_grupo,
            mensaje: 'Grupos generados exitosamente' 
        });
    } catch (error) {
        console.error('Error al armar grupos:', error);
        res.status(500).json({ error: 'Error al armar los grupos.', details: error.message });
    }
});

// ==========================================================
// ENDPOINT PARA GUARDAR GRUPOS Y PARTIDOS EN LA BD
// ==========================================================
app.post('/api/guardar-grupos', async (req, res) => {
    const { grupos, partidos, idTorneo } = req.body;
    let connection;

    try {
        connection = await mysql.createConnection(connectionConfig);
        await connection.beginTransaction();

        // 1. Insertar grupos
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
            for (const integranteId of grupo.integrantes) {
                const sqlIntegrante = `
                    INSERT INTO grupo_integrantes (id_grupo, id_inscripto)
                    VALUES (?, ?)
                `;
                await connection.execute(sqlIntegrante, [idGrupo, integranteId]);
            }
        }

        // 2. Insertar partidos
        if (partidos && partidos.length > 0) {
            for (const partido of partidos) {
                const sqlPartido = `
                    INSERT INTO partido (id_horario, id_inscriptoL, id_inscriptoV)
                    VALUES (?, ?, ?)
                `;
                await connection.execute(sqlPartido, [
                    partido.horario,
                    partido.local,
                    partido.visitante
                ]);
            }
        }

        await connection.commit();
        res.status(200).json({ mensaje: 'Grupos y partidos guardados exitosamente' });
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al guardar grupos:', error);
        res.status(500).json({ error: 'Error al guardar los grupos y partidos.' });
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
// FUNCIÓN PARA ARMAR GRUPOS (ALGORITMO LOCAL - SIN IA)
// ==========================================================
async function armarGruposBasico(configuracionGrupos, idTorneo) {
    const connection = await mysql.createConnection(connectionConfig);

    try {
        console.log('=== ARMANDO GRUPOS CON ALGORITMO LOCAL ===');
        
        // 1. OBTENER DATOS DE LA BASE
        const [horariosResult] = await connection.execute(
            'SELECT id, Canchas FROM horarios WHERE id_torneo_fk = ?',
            [idTorneo]
        );

        const [inscriptosResult] = await connection.execute(
            `SELECT i.id, i.categoria, GROUP_CONCAT(ih.id_horario_fk) as horarios
             FROM inscriptos i 
             LEFT JOIN inscriptos_horarios ih ON i.id = ih.id_inscripto_fk 
             WHERE i.id_torneo_fk = ? 
             GROUP BY i.id`,
            [idTorneo]
        );

        await connection.end();

        // 2. PREPARAR DATOS
        const horarios = horariosResult.map(h => ({
            id: h.id,
            cupo: parseInt(h.Canchas) || 4
        }));

        const inscriptos = inscriptosResult.map(i => ({
            id: i.id,
            categoria: i.categoria,
            horarios: (typeof i.horarios === 'string') ? 
                i.horarios.split(',').map(h => parseInt(h)).filter(h => !isNaN(h)) : []
        }));

        // 3. ALGORITMO DE DISTRIBUCIÓN EN GRUPOS
        let grupos = [];
        let partidos = [];
        let sinGrupo = [];
        let numeroGrupoGlobal = 1;

        for (const [categoria, config] of Object.entries(configuracionGrupos)) {
            const jugadoresCat = inscriptos.filter(i => i.categoria === categoria);
            
            if (jugadoresCat.length === 0) continue;

            // Calcular cuántos jugadores queremos usar según configuración
            const grupos3 = config.grupos3 || 0;
            const grupos4 = config.grupos4 || 0;
            const grupos5 = config.grupos5 || 0;
            
            const totalJugadoresNecesarios = (grupos3 * 3) + (grupos4 * 4) + (grupos5 * 5);
            
            // Si queremos más jugadores de los disponibles, algunos quedarán sin grupo
            let jugadoresAsignados = [];
            let jugadoresSinGrupoCat = [];
            
            if (totalJugadoresNecesarios <= jugadoresCat.length) {
                jugadoresAsignados = jugadoresCat.slice(0, totalJugadoresNecesarios);
                jugadoresSinGrupoCat = jugadoresCat.slice(totalJugadoresNecesarios);
            } else {
                // Si faltan jugadores, armamos grupos incompletos
                jugadoresAsignados = jugadoresCat;
            }
            
            // Agregar a la lista global de sin_grupo
            sinGrupo = sinGrupo.concat(jugadoresSinGrupoCat.map(j => j.id));
            
            // Distribuir jugadores en grupos
            let indiceJugador = 0;
            
            // Grupos de 3
            for (let g = 0; g < grupos3 && indiceJugador < jugadoresAsignados.length; g++) {
                const integrantes = jugadoresAsignados.slice(indiceJugador, indiceJugador + 3);
                const incompleto = integrantes.length < 3;
                
                grupos.push({
                    numero: numeroGrupoGlobal++,
                    categoria: categoria,
                    integrantes: integrantes.map(j => j.id),
                    incompleto: incompleto,
                    cantidad: 3
                });
                
                indiceJugador += integrantes.length;
            }
            
            // Grupos de 4
            for (let g = 0; g < grupos4 && indiceJugador < jugadoresAsignados.length; g++) {
                const integrantes = jugadoresAsignados.slice(indiceJugador, indiceJugador + 4);
                const incompleto = integrantes.length < 4;
                
                grupos.push({
                    numero: numeroGrupoGlobal++,
                    categoria: categoria,
                    integrantes: integrantes.map(j => j.id),
                    incompleto: incompleto,
                    cantidad: 4
                });
                
                indiceJugador += integrantes.length;
            }
            
            // Grupos de 5
            for (let g = 0; g < grupos5 && indiceJugador < jugadoresAsignados.length; g++) {
                const integrantes = jugadoresAsignados.slice(indiceJugador, indiceJugador + 5);
                const incompleto = integrantes.length < 5;
                
                grupos.push({
                    numero: numeroGrupoGlobal++,
                    categoria: categoria,
                    integrantes: integrantes.map(j => j.id),
                    incompleto: incompleto,
                    cantidad: 5
                });
                
                indiceJugador += integrantes.length;
            }
            
            // Si sobraron jugadores (caso de grupos incompletos), los agregamos al último grupo
            if (indiceJugador < jugadoresAsignados.length) {
                const sobrantes = jugadoresAsignados.slice(indiceJugador);
                if (grupos.length > 0) {
                    const ultimoGrupo = grupos[grupos.length - 1];
                    if (ultimoGrupo.categoria === categoria) {
                        ultimoGrupo.integrantes.push(...sobrantes.map(j => j.id));
                        ultimoGrupo.incompleto = ultimoGrupo.integrantes.length < ultimoGrupo.cantidad;
                    }
                } else {
                    // Si no hay grupos, crear uno con los sobrantes
                    sinGrupo = sinGrupo.concat(sobrantes.map(j => j.id));
                }
            }
        }

        // 4. GENERAR PARTIDOS ROUND ROBIN CON HORARIOS COMPATIBLES
        let usoHorarios = {}; // Seguimiento de cuántos partidos hay en cada horario
        let advertencias = []; // Para partidos que no se pueden jugar
        
        // Inicializar contador de uso para cada horario
        horarios.forEach(h => {
            usoHorarios[h.id] = 0;
        });

        for (const grupo of grupos) {
            const integrantesIds = grupo.integrantes;
            
            // Generar todos los partidos del round robin
            for (let i = 0; i < integrantesIds.length; i++) {
                for (let j = i + 1; j < integrantesIds.length; j++) {
                    const localId = integrantesIds[i];
                    const visitanteId = integrantesIds[j];
                    
                    // Obtener objetos completos de los jugadores
                    const jugadorLocal = inscriptos.find(j => j.id === localId);
                    const jugadorVisitante = inscriptos.find(j => j.id === visitanteId);
                    
                    if (!jugadorLocal || !jugadorVisitante) {
                        console.error(`No se encontraron datos de jugadores ${localId} vs ${visitanteId}`);
                        continue;
                    }
                    
                    // Encontrar horarios disponibles para AMBOS jugadores (intersección)
                    const horariosLocal = new Set(jugadorLocal.horarios);
                    const horariosComunes = jugadorVisitante.horarios.filter(h => horariosLocal.has(h));
                    
                    let horarioAsignado = null;
                    
                    if (horariosComunes.length === 0) {
                        // No hay horario compatible entre estos dos jugadores
                        advertencias.push({
                            tipo: 'sin_horario_compatible',
                            local: localId,
                            visitante: visitanteId,
                            grupo: grupo.numero,
                            mensaje: `Los jugadores ${localId} y ${visitanteId} no tienen horarios disponibles en común`
                        });
                        console.warn(`⚠ No hay horario compatible entre ${localId} y ${visitanteId}`);
                    } else {
                        // Entre los horarios comunes, buscar uno con cupo disponible
                        // Ordenar por uso (menos usados primero) para distribuir equitativamente
                        const horariosComunesInfo = horariosComunes.map(id => ({
                            id: id,
                            uso: usoHorarios[id] || 0,
                            cupo: horarios.find(h => h.id === id)?.cupo || 4
                        })).sort((a, b) => a.uso - b.uso);
                        
                        for (const horarioInfo of horariosComunesInfo) {
                            if (horarioInfo.uso < horarioInfo.cupo) {
                                horarioAsignado = horarioInfo.id;
                                usoHorarios[horarioInfo.id]++;
                                break;
                            }
                        }
                        
                        // Si todos los horarios comunes están llenos, advertir
                        if (!horarioAsignado) {
                            advertencias.push({
                                tipo: 'cupo_lleno',
                                local: localId,
                                visitante: visitanteId,
                                grupo: grupo.numero,
                                mensaje: `Los horarios comunes entre ${localId} y ${visitanteId} están todos ocupados`
                            });
                            console.warn(`⚠ Cupo lleno para partido ${localId} vs ${visitanteId}`);
                        }
                    }
                    
                    partidos.push({
                        local: localId,
                        visitante: visitanteId,
                        horario: horarioAsignado, // puede ser null si no se pudo asignar
                        grupo: grupo.numero
                    });
                }
            }
        }

        console.log(`✓ Generados ${grupos.length} grupos con ${partidos.length} partidos`);
        if (sinGrupo.length > 0) {
            console.log(`⚠ ${sinGrupo.length} jugadores sin grupo`);
        }
        if (advertencias.length > 0) {
            console.log(`⚠ ${advertencias.length} partidos con problemas de horarios`);
        }

        return {
            grupos: grupos,
            partidos: partidos,
            sin_grupo: sinGrupo,
            advertencias: advertencias
        };

    } catch (error) {
        if (connection) await connection.end();
        console.error('Error general:', error);
        
        return {
            grupos: [],
            partidos: [],
            sin_grupo: [],
            error: error.message
        };
    }
}

// 5. Puerto de escucha
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
