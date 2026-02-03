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

        // 2. Insertar partidos (solo los que tienen horario asignado)
        let partidosGuardados = 0;
        let partidosPendientes = 0;
        
        if (partidos && partidos.length > 0) {
            for (const partido of partidos) {
                // Solo guardar partidos con horario asignado (no null)
                if (partido.horario !== null && partido.horario !== undefined) {
                    const sqlPartido = `
                        INSERT INTO partido (id_horario, id_inscriptoL, id_inscriptoV)
                        VALUES (?, ?, ?)
                    `;
                    await connection.execute(sqlPartido, [
                        partido.horario,
                        partido.local,
                        partido.visitante
                    ]);
                    partidosGuardados++;
                } else {
                    partidosPendientes++;
                }
            }
        }

        await connection.commit();
        
        let mensajeRespuesta = 'Grupos y partidos guardados exitosamente';
        if (partidosPendientes > 0) {
            mensajeRespuesta += `. ${partidosPendientes} partidos quedaron pendientes (sin horario compatible).`;
        }
        
        res.status(200).json({ 
            mensaje: mensajeRespuesta,
            gruposGuardados: grupos.length,
            partidosGuardados: partidosGuardados,
            partidosPendientes: partidosPendientes
        });
        
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
// ENDPOINT PARA OBTENER PARTIDOS DE UN TORNEO
// ==========================================================
app.get('/api/partidos/:idTorneo', async (req, res) => {
    const { idTorneo } = req.params;
    const sql = `
        SELECT 
            p.id,
            p.id_horario,
            h.dia_semana,
            h.horario,
            h.Canchas as cupo,
            p.id_inscriptoL as local_id,
            il.integrantes as local_nombre,
            p.id_inscriptoV as visitante_id,
            iv.integrantes as visitante_nombre,
            g.categoria,
            g.numero_grupo as grupo
        FROM partido p
        LEFT JOIN horarios h ON p.id_horario = h.id
        LEFT JOIN inscriptos il ON p.id_inscriptoL = il.id
        LEFT JOIN inscriptos iv ON p.id_inscriptoV = iv.id
        LEFT JOIN grupo_integrantes gil ON p.id_inscriptoL = gil.id_inscripto
        LEFT JOIN grupos g ON gil.id_grupo = g.id AND g.id_torneo_fk = ?
        WHERE h.id_torneo_fk = ?
        ORDER BY g.categoria, g.numero_grupo, h.dia_semana, h.horario
    `;
    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [rows] = await connection.execute(sql, [idTorneo, idTorneo]);
        await connection.end();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener partidos:', error);
        res.status(500).json({ error: 'Error al obtener los partidos.' });
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
            'SELECT id, dia_semana, horario, Canchas FROM horarios WHERE id_torneo_fk = ?',
            [idTorneo]
        );

        const [inscriptosResult] = await connection.execute(
            `SELECT i.id, i.categoria, i.integrantes, GROUP_CONCAT(ih.id_horario_fk) as horarios
             FROM inscriptos i 
             LEFT JOIN inscriptos_horarios ih ON i.id = ih.id_inscripto_fk 
             WHERE i.id_torneo_fk = ? 
             GROUP BY i.id`,
            [idTorneo]
        );

        await connection.end();

        // 2. PREPARAR DATOS
        // Crear mapa de horarios para búsqueda rápida
        const horariosMap = {};
        const horarios = horariosResult.map(h => {
            const horarioInfo = {
                id: h.id,
                dia: h.dia_semana,
                hora: h.horario,
                cupo: parseInt(h.Canchas) || 4
            };
            horariosMap[h.id] = horarioInfo;
            return horarioInfo;
        });

        const inscriptos = inscriptosResult.map(i => ({
            id: i.id,
            nombre: i.integrantes,
            categoria: i.categoria,
            horarios: (typeof i.horarios === 'string') ? 
                i.horarios.split(',').map(h => parseInt(h)).filter(h => !isNaN(h)) : []
        }));

        // 3. FUNCIÓN PARA CALCULAR COMPATIBILIDAD ENTRE DOS JUGADORES
        function calcularCompatibilidad(jugador1, jugador2) {
            const horarios1 = new Set(jugador1.horarios);
            const horarios2 = new Set(jugador2.horarios);
            
            // Contar horarios en común
            let comunes = 0;
            for (const h of horarios1) {
                if (horarios2.has(h)) comunes++;
            }
            
            return comunes;
        }

        // 4. FUNCIÓN PARA CALCULAR COMPATIBILIDAD DE UN JUGADOR CON UN GRUPO
        function calcularCompatibilidadConGrupo(jugador, grupoIntegrantes, todosJugadores) {
            let compatibilidadTotal = 0;
            
            for (const idIntegrante of grupoIntegrantes) {
                const integrante = todosJugadores.find(j => j.id === idIntegrante);
                if (integrante) {
                    compatibilidadTotal += calcularCompatibilidad(jugador, integrante);
                }
            }
            
            return compatibilidadTotal;
        }

        // 5. ALGORITMO DE DISTRIBUCIÓN EN GRUPOS POR COMPATIBILIDAD
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
            
            // Separar jugadores que entrarán en grupos vs los que quedarán sin grupo
            let jugadoresDisponibles = [...jugadoresCat];
            let jugadoresSinGrupoCat = [];
            
            if (totalJugadoresNecesarios <= jugadoresCat.length) {
                // Hay más jugadores de los necesarios, algunos quedarán fuera
                // Los que quedan fuera son los que menos horarios tienen (menos flexibles)
                jugadoresDisponibles.sort((a, b) => b.horarios.length - a.horarios.length);
                jugadoresSinGrupoCat = jugadoresDisponibles.slice(totalJugadoresNecesarios);
                jugadoresDisponibles = jugadoresDisponibles.slice(0, totalJugadoresNecesarios);
            }
            
            // Agregar a la lista global de sin_grupo
            sinGrupo = sinGrupo.concat(jugadoresSinGrupoCat.map(j => j.id));
            
            // Crear grupos usando algoritmo greedy por compatibilidad
            const configGrupos = [
                ...Array(grupos5).fill(5),
                ...Array(grupos4).fill(4),
                ...Array(grupos3).fill(3)
            ];
            
            for (const tamanoGrupo of configGrupos) {
                if (jugadoresDisponibles.length === 0) break;
                
                // Tomar el primer jugador disponible como semilla
                const jugadorSemilla = jugadoresDisponibles.shift();
                const integrantesGrupo = [jugadorSemilla];
                
                // Completar el grupo con los jugadores más compatibles
                while (integrantesGrupo.length < tamanoGrupo && jugadoresDisponibles.length > 0) {
                    // Calcular compatibilidad de cada jugador disponible con el grupo actual
                    const jugadoresConScore = jugadoresDisponibles.map(j => ({
                        jugador: j,
                        score: calcularCompatibilidadConGrupo(j, integrantesGrupo.map(i => i.id), inscriptos)
                    }));
                    
                    // Ordenar por score descendente (mayor compatibilidad primero)
                    jugadoresConScore.sort((a, b) => b.score - a.score);
                    
                    // Tomar el más compatible
                    const masCompatible = jugadoresConScore[0];
                    integrantesGrupo.push(masCompatible.jugador);
                    
                    // Remover de disponibles
                    const index = jugadoresDisponibles.findIndex(j => j.id === masCompatible.jugador.id);
                    if (index > -1) jugadoresDisponibles.splice(index, 1);
                }
                
                // Crear el grupo
                const incompleto = integrantesGrupo.length < tamanoGrupo;
                
                grupos.push({
                    numero: numeroGrupoGlobal++,
                    categoria: categoria,
                    integrantes: integrantesGrupo.map(j => j.id),
                    incompleto: incompleto,
                    cantidad: tamanoGrupo
                });
            }
            
            // Si sobraron jugadores, los agregamos al último grupo de esta categoría
            if (jugadoresDisponibles.length > 0) {
                const grupoCategoria = grupos.filter(g => g.categoria === categoria);
                if (grupoCategoria.length > 0) {
                    const ultimoGrupo = grupoCategoria[grupoCategoria.length - 1];
                    ultimoGrupo.integrantes.push(...jugadoresDisponibles.map(j => j.id));
                    ultimoGrupo.incompleto = ultimoGrupo.integrantes.length < ultimoGrupo.cantidad;
                } else {
                    // No hay grupos en esta categoría, mandar a sin_grupo
                    sinGrupo = sinGrupo.concat(jugadoresDisponibles.map(j => j.id));
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
                    
                     // Preparar información del horario asignado
                    let horarioInfo = null;
                    if (horarioAsignado && horariosMap[horarioAsignado]) {
                        const h = horariosMap[horarioAsignado];
                        horarioInfo = {
                            id: h.id,
                            dia: h.dia,
                            hora: h.hora
                        };
                    }
                    
                    // Preparar horarios disponibles de cada jugador para partidos pendientes
                    let horariosLocal = [];
                    let horariosVisitante = [];
                    
                    if (!horarioAsignado) {
                        // Obtener información completa de horarios disponibles
                        horariosLocal = jugadorLocal.horarios.map(hId => {
                            const h = horariosMap[hId];
                            return h ? { id: h.id, dia: h.dia, hora: h.hora } : null;
                        }).filter(h => h !== null);
                        
                        horariosVisitante = jugadorVisitante.horarios.map(hId => {
                            const h = horariosMap[hId];
                            return h ? { id: h.id, dia: h.dia, hora: h.hora } : null;
                        }).filter(h => h !== null);
                    }
                    
                    partidos.push({
                        local: localId,
                        localNombre: jugadorLocal.nombre,
                        visitante: visitanteId,
                        visitanteNombre: jugadorVisitante.nombre,
                        horario: horarioInfo, // null si no se pudo asignar, o objeto con id, dia, hora
                        grupo: grupo.numero,
                        // Solo incluir si no hay horario asignado
                        horariosDisponiblesLocal: horariosLocal,
                        horariosDisponiblesVisitante: horariosVisitante
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
