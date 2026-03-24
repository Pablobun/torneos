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
    const sql = 'SELECT id, dia_semana, fecha, hora_inicio, Canchas, lugar FROM horarios WHERE id_torneo_fk = ? AND activo = 1 AND (es_playoff = FALSE OR es_playoff IS NULL) ORDER BY fecha, hora_inicio';
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
// ENDPOINT PARA OBTENER HORARIOS DE UN INSCRIPTO
// ==========================================================
app.get('/api/inscriptos/:idInscripto/horarios', async (req, res) => {
    const { idInscripto } = req.params;
    const sql = `
        SELECT h.id, h.dia_semana, h.fecha, h.hora_inicio
        FROM inscriptos_horarios ih
        INNER JOIN horarios h ON ih.id_horario_fk = h.id
        WHERE ih.id_inscripto_fk = ?
        ORDER BY h.fecha, h.hora_inicio
    `;
    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [rows] = await connection.execute(sql, [idInscripto]);
        await connection.end();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener horarios del inscripto:', error);
        res.status(500).json({ error: 'Error al obtener los horarios del inscripto.' });
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

        // 2. Insertar TODOS los partidos (incluidos los sin horario asignado)
        // La tabla ahora permite NULL en id_horario
        let partidosGuardados = 0;
        let partidosConHorario = 0;
        let partidosSinHorario = 0;
        
        if (partidos && partidos.length > 0) {
            for (const partido of partidos) {
                // Manejar caso donde horario puede ser objeto {id, dia, hora} o número
                let horarioId = null;
                if (partido.horario !== null && partido.horario !== undefined) {
                    horarioId = typeof partido.horario === 'object' ? partido.horario.id : partido.horario;
                }
                
                const sqlPartido = `
                    INSERT INTO partido (id_horario, id_inscriptoL, id_inscriptoV)
                    VALUES (?, ?, ?)
                `;
                await connection.execute(sqlPartido, [
                    horarioId,
                    partido.local,
                    partido.visitante
                ]);
                partidosGuardados++;
                
                if (horarioId !== null) {
                    partidosConHorario++;
                } else {
                    partidosSinHorario++;
                }
            }
        }

        await connection.commit();
        
        let mensajeRespuesta = `Grupos y ${partidosGuardados} partidos guardados exitosamente`;
        if (partidosSinHorario > 0) {
            mensajeRespuesta += `. ${partidosSinHorario} partidos sin horario asignado (se pueden editar después).`;
        }
        
        res.status(200).json({ 
            mensaje: mensajeRespuesta,
            gruposGuardados: grupos.length,
            partidosGuardados: partidosGuardados,
            partidosConHorario: partidosConHorario,
            partidosSinHorario: partidosSinHorario
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
// ENDPOINT PARA VERIFICAR SI HAY GRUPOS EN UN TORNEO
// ==========================================================
app.get('/api/verificar-grupos/:idTorneo', async (req, res) => {
    const { idTorneo } = req.params;
    const sql = 'SELECT COUNT(*) as count FROM grupos WHERE id_torneo_fk = ?';
    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [rows] = await connection.execute(sql, [idTorneo]);
        await connection.end();
        const tieneGrupos = rows[0].count > 0;
        res.status(200).json({ tieneGrupos, cantidad: rows[0].count });
    } catch (error) {
        console.error('Error al verificar grupos:', error);
        res.status(500).json({ error: 'Error al verificar grupos.' });
    }
});

// ==========================================================
// ENDPOINT PARA ELIMINAR GRUPOS Y PARTIDOS DE UN TORNEO
// ==========================================================
app.delete('/api/limpiar-torneo/:idTorneo', async (req, res) => {
    const { idTorneo } = req.params;
    let connection;
    
    try {
        connection = await mysql.createConnection(connectionConfig);
        await connection.beginTransaction();

        // 1. Eliminar partidos del torneo
        const deletePartidos = `
            DELETE p FROM partido p
            LEFT JOIN inscriptos il ON p.id_inscriptoL = il.id
            LEFT JOIN inscriptos iv ON p.id_inscriptoV = iv.id
            WHERE il.id_torneo_fk = ? OR iv.id_torneo_fk = ?
        `;
        await connection.execute(deletePartidos, [idTorneo, idTorneo]);

        // 2. Eliminar integrantes de grupos
        const deleteIntegrantes = `
            DELETE gi FROM grupo_integrantes gi
            INNER JOIN grupos g ON gi.id_grupo = g.id
            WHERE g.id_torneo_fk = ?
        `;
        await connection.execute(deleteIntegrantes, [idTorneo]);

        // 3. Eliminar grupos
        await connection.execute('DELETE FROM grupos WHERE id_torneo_fk = ?', [idTorneo]);

        await connection.commit();
        res.status(200).json({ 
            mensaje: 'Torneo limpiado exitosamente. Se eliminaron todos los grupos y partidos.',
            gruposEliminados: true,
            partidosEliminados: true
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al limpiar torneo:', error);
        res.status(500).json({ error: 'Error al limpiar el torneo.' });
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
    
    // Query para obtener TODOS los partidos (con y sin horario) incluyendo categoria y resultados
    const sql = `
        SELECT 
            p.id,
            p.id_horario,
            p.ronda,
            h.dia_semana,
            h.fecha,
            h.hora_inicio as horario,
            h.Canchas as cupo,
            p.id_inscriptoL as local_id,
            il.integrantes as local_nombre,
            p.id_inscriptoV as visitante_id,
            iv.integrantes as visitante_nombre,
            g.categoria,
            g.numero_grupo as grupo,
            p.estado,
            p.ganador_id,
            p.sets_local,
            p.sets_visitante,
            p.games_local,
            p.games_visitante
        FROM partido p
        LEFT JOIN horarios h ON p.id_horario = h.id
        LEFT JOIN inscriptos il ON p.id_inscriptoL = il.id
        LEFT JOIN inscriptos iv ON p.id_inscriptoV = iv.id
        LEFT JOIN grupo_integrantes gil ON p.id_inscriptoL = gil.id_inscripto
        LEFT JOIN grupos g ON gil.id_grupo = g.id AND g.id_torneo_fk = ?
        WHERE il.id_torneo_fk = ? OR iv.id_torneo_fk = ?
        ORDER BY 
            CASE WHEN h.fecha IS NOT NULL THEN 0 ELSE 1 END,
            h.fecha, 
            h.hora_inicio
    `;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [rows] = await connection.execute(sql, [idTorneo, idTorneo, idTorneo]);
        await connection.end();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener partidos:', error);
        res.status(500).json({ error: 'Error al obtener los partidos: ' + error.message });
    }
});

// ==========================================================
// ENDPOINT PARA ACTUALIZAR HORARIO DE UN PARTIDO
// ==========================================================
app.put('/api/partidos/:idPartido', async (req, res) => {
    const { idPartido } = req.params;
    const { id_horario } = req.body;
    
    // Permitir null para quitar el horario del partido
    if (id_horario === undefined) {
        return res.status(400).json({ error: 'Se requiere id_horario (o null para quitar)' });
    }
    
    const sql = 'UPDATE partido SET id_horario = ? WHERE id = ?';
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [result] = await connection.execute(sql, [id_horario, idPartido]);
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Partido no encontrado' });
        }
        
        const mensaje = id_horario === null ? 
            'Horario eliminado exitosamente' : 
            'Horario actualizado exitosamente';
        
        res.status(200).json({ mensaje });
    } catch (error) {
        console.error('Error al actualizar partido:', error);
        res.status(500).json({ error: 'Error al actualizar el horario del partido.' });
    }
});

// ==========================================================
// FUNCIÓN PARA ARMAR GRUPOS (ALGORITMO LOCAL - SIN IA)
// ==========================================================

// Función para hacer shuffle determinista basado en semilla
function shuffleArray(array, seed) {
    const arr = [...array];
    let seedValue = seed;
    
    for (let i = arr.length - 1; i > 0; i--) {
        // Generar índice aleatorio basado en semilla
        seedValue = (seedValue * 9301 + 49297) % 233280;
        const j = Math.floor((seedValue / 233280) * (i + 1));
        
        // Intercambiar elementos
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    
    return arr;
}

// Función para intentar formar grupos con una semilla específica
function intentarFormarGrupos(jugadores, configuracionGrupos, horarios, horariosMap, semillaIndex) {
    // Hacer copia de jugadores y mezclar según semilla
    const inscriptos = shuffleArray(jugadores, semillaIndex + 1);
    
    // FUNCIÓN PARA CALCULAR COMPATIBILIDAD ENTRE DOS JUGADORES
    function calcularCompatibilidad(jugador1, jugador2) {
        const horarios1 = new Set(jugador1.horarios);
        const horarios2 = new Set(jugador2.horarios);
        
        let comunes = 0;
        for (const h of horarios1) {
            if (horarios2.has(h)) comunes++;
        }
        
        return comunes;
    }

    // FUNCIÓN PARA CALCULAR COMPATIBILIDAD DE UN JUGADOR CON UN GRUPO
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

    // ALGORITMO DE DISTRIBUCIÓN EN GRUPOS POR COMPATIBILIDAD
    let grupos = [];
    let partidos = [];
    let sinGrupo = [];

    for (const [categoria, config] of Object.entries(configuracionGrupos)) {
        const jugadoresCat = inscriptos.filter(i => i.categoria === categoria);
        
        if (jugadoresCat.length === 0) continue;

        // Reiniciar numeración de grupos a 1 para cada categoría
        let numeroGrupoCategoria = 1;

        const grupos3 = config.grupos3 || 0;
        const grupos4 = config.grupos4 || 0;
        const grupos5 = config.grupos5 || 0;
        
        const totalJugadoresNecesarios = (grupos3 * 3) + (grupos4 * 4) + (grupos5 * 5);
        
        let jugadoresDisponibles = [...jugadoresCat];
        let jugadoresSinGrupoCat = [];
        
        if (totalJugadoresNecesarios <= jugadoresCat.length) {
            jugadoresDisponibles.sort((a, b) => b.horarios.length - a.horarios.length);
            jugadoresSinGrupoCat = jugadoresDisponibles.slice(totalJugadoresNecesarios);
            jugadoresDisponibles = jugadoresDisponibles.slice(0, totalJugadoresNecesarios);
        }
        
        sinGrupo = sinGrupo.concat(jugadoresSinGrupoCat.map(j => j.id));
        
        const configGrupos = [
            ...Array(grupos5).fill(5),
            ...Array(grupos4).fill(4),
            ...Array(grupos3).fill(3)
        ];
        
        for (const tamanoGrupo of configGrupos) {
            if (jugadoresDisponibles.length === 0) break;
            
            const jugadorSemilla = jugadoresDisponibles.shift();
            const integrantesGrupo = [jugadorSemilla];
            
            while (integrantesGrupo.length < tamanoGrupo && jugadoresDisponibles.length > 0) {
                const jugadoresConScore = jugadoresDisponibles.map(j => ({
                    jugador: j,
                    score: calcularCompatibilidadConGrupo(j, integrantesGrupo.map(i => i.id), inscriptos)
                }));
                
                jugadoresConScore.sort((a, b) => b.score - a.score);
                
                const masCompatible = jugadoresConScore[0];
                integrantesGrupo.push(masCompatible.jugador);
                
                const index = jugadoresDisponibles.findIndex(j => j.id === masCompatible.jugador.id);
                if (index > -1) jugadoresDisponibles.splice(index, 1);
            }
            
            const incompleto = integrantesGrupo.length < tamanoGrupo;
            
            grupos.push({
                numero: numeroGrupoCategoria++,
                categoria: categoria,
                integrantes: integrantesGrupo.map(j => j.id),
                incompleto: incompleto,
                cantidad: tamanoGrupo
            });
        }
        
        if (jugadoresDisponibles.length > 0) {
            const grupoCategoria = grupos.filter(g => g.categoria === categoria);
            if (grupoCategoria.length > 0) {
                const ultimoGrupo = grupoCategoria[grupoCategoria.length - 1];
                ultimoGrupo.integrantes.push(...jugadoresDisponibles.map(j => j.id));
                ultimoGrupo.incompleto = ultimoGrupo.integrantes.length < ultimoGrupo.cantidad;
            } else {
                sinGrupo = sinGrupo.concat(jugadoresDisponibles.map(j => j.id));
            }
        }
    }

    // GENERAR PARTIDOS ROUND ROBIN CON HORARIOS COMPATIBLES
    // NUEVO: Tracking por jugador para evitar conflictos
    let usoHorarios = {};           // Uso de canchas por horario
    let jugadorHorarios = {};       // { jugadorId: Set(horarioIds) }
    let jugadorFechas = {};         // { jugadorId: Set(fechas) }
    let advertencias = [];
    
    // Inicializar tracking
    horarios.forEach(h => {
        usoHorarios[h.id] = 0;
    });
    
    inscriptos.forEach(j => {
        // Usar String para IDs para evitar problemas de tipo
        const jugadorId = String(j.id);
        jugadorHorarios[jugadorId] = new Set();
        jugadorFechas[jugadorId] = new Set();
    });
    
    // Función auxiliar para normalizar fechas a YYYY-MM-DD
    function normalizarFecha(fecha) {
        if (!fecha) return null;
        // Si es un objeto Date, convertirlo a string ISO y extraer YYYY-MM-DD
        if (fecha instanceof Date) {
            return fecha.toISOString().split('T')[0];
        }
        // Si es string, asumir que ya viene en formato correcto o limpiarlo
        if (typeof fecha === 'string') {
            // Si viene con hora (formato MySQL datetime), extraer solo la fecha
            return fecha.split(' ')[0].split('T')[0];
        }
        return String(fecha).split(' ')[0].split('T')[0];
    }

        for (const grupo of grupos) {
        const integrantesIds = grupo.integrantes;
        
        for (let i = 0; i < integrantesIds.length; i++) {
            for (let j = i + 1; j < integrantesIds.length; j++) {
                // Asegurar que los IDs son strings para consistencia
                const localId = String(integrantesIds[i]);
                const visitanteId = String(integrantesIds[j]);
                
                const jugadorLocal = inscriptos.find(j => String(j.id) === localId);
                const jugadorVisitante = inscriptos.find(j => String(j.id) === visitanteId);
                
                if (!jugadorLocal || !jugadorVisitante) {
                    console.error(`No se encontraron datos de jugadores ${localId} vs ${visitanteId}`);
                    continue;
                }
                
                const horariosLocalSet = new Set(jugadorLocal.horarios);
                const horariosComunes = jugadorVisitante.horarios.filter(h => horariosLocalSet.has(h));
                
                let horarioAsignado = null;
                
                if (horariosComunes.length === 0) {
                    advertencias.push({
                        tipo: 'sin_horario_compatible',
                        local: localId,
                        visitante: visitanteId,
                        grupo: grupo.numero,
                        mensaje: `Los jugadores ${localId} y ${visitanteId} no tienen horarios disponibles en común`
                    });
                } else {
                        // NUEVO: Filtrar horarios donde ningún jugador ya tenga partido ese día
                    const horariosDisponibles = horariosComunes.filter(horarioId => {
                        const horarioInfo = horariosMap[horarioId];
                        if (!horarioInfo) return false;
                        
                        // Normalizar fecha para comparación consistente
                        const fechaHorario = normalizarFecha(horarioInfo.fecha);
                        const horaHorario = horarioInfo.hora;
                        
                        // Verificar que ningún jugador ya tenga partido ese día
                        const localTienePartidoEseDia = jugadorFechas[localId].has(fechaHorario);
                        const visitanteTienePartidoEseDia = jugadorFechas[visitanteId].has(fechaHorario);
                        
                        // Verificar que ningún jugador ya tenga partido en ese horario específico
                        const localTieneEseHorario = jugadorHorarios[localId].has(horarioId);
                        const visitanteTieneEseHorario = jugadorHorarios[visitanteId].has(horarioId);
                        
                        // DEBUG: Log si hay conflicto
                        if (localTienePartidoEseDia || visitanteTienePartidoEseDia) {
                            console.log(`   ⚠️ Conflicto de fecha encontrado para partido ${jugadorLocal.nombre} vs ${jugadorVisitante.nombre} en ${fechaHorario} ${horaHorario}`);
                            console.log(`      Local ${localId} tiene partido ese día: ${localTienePartidoEseDia}, Visitante ${visitanteId} tiene partido ese día: ${visitanteTienePartidoEseDia}`);
                        }
                        
                        return !localTienePartidoEseDia && 
                               !visitanteTienePartidoEseDia && 
                               !localTieneEseHorario && 
                               !visitanteTieneEseHorario;
                    });
                    
                    if (horariosDisponibles.length === 0) {
                        // No hay horarios donde ambos estén libres ese día
                        advertencias.push({
                            tipo: 'jugadores_ocupados',
                            local: localId,
                            visitante: visitanteId,
                            grupo: grupo.numero,
                            mensaje: `Los jugadores ${localId} y ${visitanteId} ya tienen partidos asignados en todos los horarios comunes disponibles`
                        });
                    } else {
                        // Ordenar por: 1) uso de cancha, 2) cantidad de partidos ya asignados ese día a los jugadores
                        const horariosComunesInfo = horariosDisponibles.map(id => {
                            const horarioInfo = horariosMap[id];
                            const fecha = horarioInfo.fecha;
                            
                            // Calcular cuántos partidos ya tienen cada jugador ese día
                            const partidosDiaLocal = Array.from(jugadorFechas[localId]).filter(f => f === fecha).length;
                            const partidosDiaVisitante = Array.from(jugadorFechas[visitanteId]).filter(f => f === fecha).length;
                            const totalPartidosDia = partidosDiaLocal + partidosDiaVisitante;
                            
                            return {
                                id: id,
                                uso: usoHorarios[id] || 0,
                                cupo: horarios.find(h => h.id === id)?.cupo || 4,
                                fecha: fecha,
                                totalPartidosDia: totalPartidosDia
                            };
                        }).sort((a, b) => {
                            // Priorizar: 1) menos uso de cancha, 2) menos partidos ese día
                            if (a.uso !== b.uso) return a.uso - b.uso;
                            return a.totalPartidosDia - b.totalPartidosDia;
                        });
                        
                         for (const horarioInfo of horariosComunesInfo) {
                            if (horarioInfo.uso < horarioInfo.cupo) {
                                // VERIFICACIÓN FINAL: Asegurar que ningún jugador tenga partido ese día
                                // Normalizar fecha para verificación
                                const fechaVerificar = normalizarFecha(horarioInfo.fecha);
                                console.log(`   🔍 Verificando horario ${fechaVerificar} ${horarioInfo.hora}...`);
                                console.log(`      Fechas en jugadorFechas[${localId}]:`, Array.from(jugadorFechas[localId]));
                                console.log(`      Fechas en jugadorFechas[${visitanteId}]:`, Array.from(jugadorFechas[visitanteId]));
                                console.log(`      ¿${fechaVerificar} está en local?`, jugadorFechas[localId].has(fechaVerificar));
                                console.log(`      ¿${fechaVerificar} está en visitante?`, jugadorFechas[visitanteId].has(fechaVerificar));
                                
                                const localTienePartido = jugadorFechas[localId].has(fechaVerificar);
                                const visitanteTienePartido = jugadorFechas[visitanteId].has(fechaVerificar);
                                
                                if (localTienePartido || visitanteTienePartido) {
                                    console.log(`   ❌ CONFLICTO DETECTADO: No se puede asignar ${horarioInfo.fecha}`);
                                    console.log(`      Local ${localId} (${jugadorLocal.nombre}) tiene partido: ${localTienePartido}`);
                                    console.log(`      Visitante ${visitanteId} (${jugadorVisitante.nombre}) tiene partido: ${visitanteTienePartido}`);
                                    console.log(`      ⏭️ Saltando al siguiente horario...`);
                                    continue; // Saltar al siguiente horario
                                }
                                
                                console.log(`   ✅ SIN CONFLICTO: Asignando horario ${horarioInfo.fecha} ${horarioInfo.hora}`);
                                horarioAsignado = horarioInfo.id;
                                usoHorarios[horarioInfo.id]++;
                                
                                // NUEVO: Registrar horario y fecha para ambos jugadores
                                // Normalizar fecha antes de guardar (formato YYYY-MM-DD)
                                const fechaNormalizada = normalizarFecha(horarioInfo.fecha);
                                jugadorHorarios[localId].add(horarioAsignado);
                                jugadorHorarios[visitanteId].add(horarioAsignado);
                                jugadorFechas[localId].add(fechaNormalizada);
                                jugadorFechas[visitanteId].add(fechaNormalizada);
                                
                                console.log(`✓ Asignado horario ${horarioInfo.fecha} ${horarioInfo.hora} (ID: ${horarioAsignado}) para partido: ${jugadorLocal.nombre} vs ${jugadorVisitante.nombre}`);
                                console.log(`   Registrado: Jugador ${localId} y ${visitanteId} ahora tienen partido el ${horarioInfo.fecha}`);
                                break;
                            }
                        }
                        
                        if (!horarioAsignado) {
                            advertencias.push({
                                tipo: 'cupo_lleno',
                                local: localId,
                                visitante: visitanteId,
                                grupo: grupo.numero,
                                mensaje: `Los horarios comunes entre ${localId} y ${visitanteId} están todos ocupados`
                            });
                        }
                    }
                }
                
                let horarioInfo = null;
                if (horarioAsignado && horariosMap[horarioAsignado]) {
                    const h = horariosMap[horarioAsignado];
                    horarioInfo = {
                        id: h.id,
                        dia: h.dia,
                        hora: h.hora
                    };
                }
                
                let horariosLocal = [];
                let horariosVisitante = [];
                
                if (!horarioAsignado) {
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
                    horario: horarioInfo,
                    grupo: grupo.numero,
                    horariosDisponiblesLocal: horariosLocal,
                    horariosDisponiblesVisitante: horariosVisitante
                });
            }
        }
    }

    // Contar partidos pendientes (sin horario asignado)
    const partidosPendientesCount = partidos.filter(p => p.horario === null).length;

    return {
        grupos,
        partidos,
        sinGrupo,
        advertencias,
        partidosPendientesCount
    };
}

async function armarGruposBasico(configuracionGrupos, idTorneo) {
    const connection = await mysql.createConnection(connectionConfig);

    try {
        console.log('=== ARMANDO GRUPOS CON ALGORITMO LOCAL (OPTIMIZACIÓN 15 INTENTOS) ===');
        
        // 1. OBTENER DATOS DE LA BASE
        const [horariosResult] = await connection.execute(
            'SELECT id, dia_semana, fecha, hora_inicio, Canchas FROM horarios WHERE id_torneo_fk = ? AND (es_playoff = FALSE OR es_playoff IS NULL)',
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
        const horariosMap = {};
        const horarios = horariosResult.map(h => {
            const horarioInfo = {
                id: h.id,
                dia: h.dia_semana,
                fecha: h.fecha,
                hora: h.hora_inicio,
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

        // 3. OPTIMIZACIÓN: PROBAR 15 INTENTOS CON DIFERENTES ORDENES
        let mejorSolucion = null;
        let mejorPuntaje = Infinity;
        
        for (let intento = 0; intento < 15; intento++) {
            const resultado = intentarFormarGrupos(
                inscriptos,
                configuracionGrupos,
                horarios,
                horariosMap,
                intento
            );
            
            console.log(`Intento ${intento + 1}: ${resultado.partidosPendientesCount} partidos pendientes`);
            console.log(`   - Advertencias: ${resultado.advertencias.length}`);
            console.log(`   - Jugadores sin grupo: ${resultado.sinGrupo.length}`);
            
            if (resultado.partidosPendientesCount < mejorPuntaje) {
                mejorPuntaje = resultado.partidosPendientesCount;
                mejorSolucion = resultado;
                
                // Si encontramos solución perfecta, salir temprano
                if (mejorPuntaje === 0) {
                    console.log('✓ Solución perfecta encontrada en intento', intento + 1);
                    break;
                }
            }
        }

        console.log(`\n✓ Mejor solución: ${mejorSolucion.grupos.length} grupos, ${mejorPuntaje} partidos pendientes`);
        if (mejorSolucion.sinGrupo.length > 0) {
            console.log(`⚠ ${mejorSolucion.sinGrupo.length} jugadores sin grupo`);
        }
        if (mejorSolucion.advertencias.length > 0) {
            console.log(`⚠ ${mejorSolucion.advertencias.length} advertencias de horarios`);
            
            // Contar tipos de advertencias
            const tiposAdvertencias = {};
            mejorSolucion.advertencias.forEach(adv => {
                tiposAdvertencias[adv.tipo] = (tiposAdvertencias[adv.tipo] || 0) + 1;
            });
            console.log(`   Desglose:`, tiposAdvertencias);
        }

        return {
            grupos: mejorSolucion.grupos,
            partidos: mejorSolucion.partidos,
            sin_grupo: mejorSolucion.sinGrupo,
            advertencias: mejorSolucion.advertencias
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

// ==========================================================
// ENDPOINT: CARGAR RESULTADO DE UN PARTIDO
// ==========================================================
app.post('/api/partidos/:idPartido/resultado', async (req, res) => {
    const { idPartido } = req.params;
    const { sets, esWO, ganadorWO, superTiebreak } = req.body;
    
    let connection;
    
    try {
        connection = await mysql.createConnection(connectionConfig);
        await connection.beginTransaction();
        
        // 1. Obtener info del partido
        const [partidoInfo] = await connection.execute(
            `SELECT p.id, p.id_inscriptoL, p.id_inscriptoV, g.id as id_grupo 
             FROM partido p 
             LEFT JOIN grupo_integrantes gil ON p.id_inscriptoL = gil.id_inscripto
             LEFT JOIN grupos g ON gil.id_grupo = g.id
             WHERE p.id = ?`,
            [idPartido]
        );
        
        if (partidoInfo.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Partido no encontrado' });
        }
        
        const partido = partidoInfo[0];
        
        // 2. Procesar WO si aplica
        if (esWO) {
            const ganadorId = ganadorWO === 'local' ? partido.id_inscriptoL : partido.id_inscriptoV;
            const perdedorId = ganadorWO === 'local' ? partido.id_inscriptoV : partido.id_inscriptoL;
            
            // Limpiar sets anteriores
            await connection.execute('DELETE FROM detalle_sets WHERE id_partido = ?', [idPartido]);
            
            // Verificar si hay sets cargados
            let setsLocal = 0, setsVisitante = 0;
            let gamesLocalTotal = 0, gamesVisitanteTotal = 0;
            
            if (sets && sets.length > 0) {
                // Usar los sets cargados
                for (let i = 0; i < sets.length; i++) {
                    const set = sets[i];
                    gamesLocalTotal += parseInt(set.gamesLocal);
                    gamesVisitanteTotal += parseInt(set.gamesVisitante);
                    
                    if (set.gamesLocal > set.gamesVisitante) {
                        setsLocal++;
                    } else {
                        setsVisitante++;
                    }
                    
                    await connection.execute(
                        `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                         VALUES (?, ?, ?, ?, FALSE)`,
                        [idPartido, i + 1, set.gamesLocal, set.gamesVisitante]
                    );
                }
            } else {
                // WO sin sets: resultado 6-0 6-0
                setsLocal = ganadorWO === 'local' ? 2 : 0;
                setsVisitante = ganadorWO === 'local' ? 0 : 2;
                gamesLocalTotal = ganadorWO === 'local' ? 12 : 0;
                gamesVisitanteTotal = ganadorWO === 'local' ? 0 : 12;
                
                // Insertar sets 6-0 6-0
                await connection.execute(
                    `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                     VALUES (?, 1, 6, 0, FALSE)`,
                    [idPartido]
                );
                await connection.execute(
                    `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                     VALUES (?, 2, 6, 0, FALSE)`,
                    [idPartido]
                );
            }
            
            await connection.execute(
                `UPDATE partido SET 
                    estado = ?,
                    ganador_id = ?,
                    sets_local = ?,
                    sets_visitante = ?,
                    games_local = ?,
                    games_visitante = ?
                 WHERE id = ?`,
                [ganadorWO === 'local' ? 'wo_local' : 'wo_visitante', ganadorId, 
                 setsLocal, setsVisitante, gamesLocalTotal, gamesVisitanteTotal, idPartido]
            );
        } else {
            // 3. Calcular sets y games
            let setsLocal = 0, setsVisitante = 0;
            let gamesLocalTotal = 0, gamesVisitanteTotal = 0;
            
            // Limpiar sets anteriores
            await connection.execute('DELETE FROM detalle_sets WHERE id_partido = ?', [idPartido]);
            
            // Insertar sets normales
            for (let i = 0; i < sets.length; i++) {
                const set = sets[i];
                gamesLocalTotal += parseInt(set.gamesLocal);
                gamesVisitanteTotal += parseInt(set.gamesVisitante);
                
                if (set.gamesLocal > set.gamesVisitante) {
                    setsLocal++;
                } else {
                    setsVisitante++;
                }
                
                await connection.execute(
                    `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                     VALUES (?, ?, ?, ?, FALSE)`,
                    [idPartido, i + 1, set.gamesLocal, set.gamesVisitante]
                );
            }
            
            // 4. Procesar super tie-break si aplica
            let tiebreakLocal = null, tiebreakVisitante = null;
            if (superTiebreak && setsLocal === 1 && setsVisitante === 1) {
                tiebreakLocal = superTiebreak.local;
                tiebreakVisitante = superTiebreak.visitante;
                gamesLocalTotal += tiebreakLocal;
                gamesVisitanteTotal += tiebreakVisitante;
                
                // El super TB cuenta como 1 set para el ganador
                if (tiebreakLocal > tiebreakVisitante) {
                    setsLocal++;
                } else {
                    setsVisitante++;
                }
                
                await connection.execute(
                    `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                     VALUES (?, 3, ?, ?, TRUE)`,
                    [idPartido, tiebreakLocal, tiebreakVisitante]
                );
            }
            
            // Determinar ganador
            const ganadorId = setsLocal > setsVisitante ? partido.id_inscriptoL : partido.id_inscriptoV;
            
            // 5. Actualizar partido
            await connection.execute(
                `UPDATE partido SET 
                    estado = 'jugado',
                    ganador_id = ?,
                    sets_local = ?,
                    sets_visitante = ?,
                    games_local = ?,
                    games_visitante = ?,
                    tiebreak_local = ?,
                    tiebreak_visitante = ?
                 WHERE id = ?`,
                [ganadorId, setsLocal, setsVisitante, gamesLocalTotal, gamesVisitanteTotal, 
                 tiebreakLocal, tiebreakVisitante, idPartido]
            );
        }
        
        // 6. Recalcular estadísticas del grupo
        await calcularEstadisticasGrupo(connection, partido.id_grupo);
        
        await connection.commit();
        
        res.status(200).json({ 
            mensaje: 'Resultado guardado exitosamente',
            partidoId: idPartido
        });
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al guardar resultado:', error);
        res.status(500).json({ error: 'Error al guardar el resultado del partido' });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================================
// ENDPOINT: ACTUALIZAR RESULTADO DE UN PARTIDO
// ==========================================================
app.put('/api/partidos/:idPartido/resultado', async (req, res) => {
    const { idPartido } = req.params;
    const { sets, esWO, ganadorWO, superTiebreak } = req.body;
    
    let connection;
    
    try {
        connection = await mysql.createConnection(connectionConfig);
        await connection.beginTransaction();
        
        // Obtener info del partido
        const [partidoInfo] = await connection.execute(
            `SELECT p.id, p.id_inscriptoL, p.id_inscriptoV, g.id as id_grupo 
             FROM partido p 
             LEFT JOIN grupo_integrantes gil ON p.id_inscriptoL = gil.id_inscripto
             LEFT JOIN grupos g ON gil.id_grupo = g.id
             WHERE p.id = ?`,
            [idPartido]
        );
        
        if (partidoInfo.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Partido no encontrado' });
        }
        
        const partido = partidoInfo[0];
        
        // Resetear estado antes de recalcular
        if (esWO) {
            const ganadorId = ganadorWO === 'local' ? partido.id_inscriptoL : partido.id_inscriptoV;
            
            // Limpiar sets anteriores
            await connection.execute('DELETE FROM detalle_sets WHERE id_partido = ?', [idPartido]);
            
            // Verificar si hay sets cargados
            let setsLocal = 0, setsVisitante = 0;
            let gamesLocalTotal = 0, gamesVisitanteTotal = 0;
            
            if (sets && sets.length > 0) {
                // Usar los sets cargados
                for (let i = 0; i < sets.length; i++) {
                    const set = sets[i];
                    gamesLocalTotal += parseInt(set.gamesLocal);
                    gamesVisitanteTotal += parseInt(set.gamesVisitante);
                    
                    if (set.gamesLocal > set.gamesVisitante) {
                        setsLocal++;
                    } else {
                        setsVisitante++;
                    }
                    
                    await connection.execute(
                        `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                         VALUES (?, ?, ?, ?, FALSE)`,
                        [idPartido, i + 1, set.gamesLocal, set.gamesVisitante]
                    );
                }
            } else {
                // WO sin sets: resultado 6-0 6-0
                setsLocal = ganadorWO === 'local' ? 2 : 0;
                setsVisitante = ganadorWO === 'local' ? 0 : 2;
                gamesLocalTotal = ganadorWO === 'local' ? 12 : 0;
                gamesVisitanteTotal = ganadorWO === 'local' ? 0 : 12;
                
                // Insertar sets 6-0 6-0
                await connection.execute(
                    `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                     VALUES (?, 1, 6, 0, FALSE)`,
                    [idPartido]
                );
                await connection.execute(
                    `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                     VALUES (?, 2, 6, 0, FALSE)`,
                    [idPartido]
                );
            }
            
            await connection.execute(
                `UPDATE partido SET 
                    estado = ?,
                    ganador_id = ?,
                    sets_local = ?,
                    sets_visitante = ?,
                    games_local = ?,
                    games_visitante = ?
                 WHERE id = ?`,
                [ganadorWO === 'local' ? 'wo_local' : 'wo_visitante', ganadorId, 
                 setsLocal, setsVisitante, gamesLocalTotal, gamesVisitanteTotal, idPartido]
            );
        } else {
            let setsLocal = 0, setsVisitante = 0;
            let gamesLocalTotal = 0, gamesVisitanteTotal = 0;
            
            await connection.execute('DELETE FROM detalle_sets WHERE id_partido = ?', [idPartido]);
            
            for (let i = 0; i < sets.length; i++) {
                const set = sets[i];
                gamesLocalTotal += parseInt(set.gamesLocal);
                gamesVisitanteTotal += parseInt(set.gamesVisitante);
                
                if (set.gamesLocal > set.gamesVisitante) {
                    setsLocal++;
                } else {
                    setsVisitante++;
                }
                
                await connection.execute(
                    `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                     VALUES (?, ?, ?, ?, FALSE)`,
                    [idPartido, i + 1, set.gamesLocal, set.gamesVisitante]
                );
            }
            
            let tiebreakLocal = null, tiebreakVisitante = null;
            if (superTiebreak && setsLocal === 1 && setsVisitante === 1) {
                tiebreakLocal = superTiebreak.local;
                tiebreakVisitante = superTiebreak.visitante;
                gamesLocalTotal += tiebreakLocal;
                gamesVisitanteTotal += tiebreakVisitante;
                
                if (tiebreakLocal > tiebreakVisitante) {
                    setsLocal++;
                } else {
                    setsVisitante++;
                }
                
                await connection.execute(
                    `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                     VALUES (?, 3, ?, ?, TRUE)`,
                    [idPartido, tiebreakLocal, tiebreakVisitante]
                );
            }
            
            const ganadorId = setsLocal > setsVisitante ? partido.id_inscriptoL : partido.id_inscriptoV;
            
            await connection.execute(
                `UPDATE partido SET 
                    estado = 'jugado',
                    ganador_id = ?,
                    sets_local = ?,
                    sets_visitante = ?,
                    games_local = ?,
                    games_visitante = ?,
                    tiebreak_local = ?,
                    tiebreak_visitante = ?
                 WHERE id = ?`,
                [ganadorId, setsLocal, setsVisitante, gamesLocalTotal, gamesVisitanteTotal, 
                 tiebreakLocal, tiebreakVisitante, idPartido]
            );
        }
        
        await calcularEstadisticasGrupo(connection, partido.id_grupo);
        await connection.commit();
        
        res.status(200).json({ 
            mensaje: 'Resultado actualizado exitosamente',
            partidoId: idPartido
        });
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al actualizar resultado:', error);
        res.status(500).json({ error: 'Error al actualizar el resultado' });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================================
// ENDPOINT: ELIMINAR RESULTADO DE UN PARTIDO
// ==========================================================
app.delete('/api/partidos/:idPartido/resultado', async (req, res) => {
    const { idPartido } = req.params;
    
    let connection;
    
    try {
        connection = await mysql.createConnection(connectionConfig);
        await connection.beginTransaction();
        
        // Obtener info del partido
        const [partidoInfo] = await connection.execute(
            `SELECT p.id, g.id as id_grupo 
             FROM partido p 
             LEFT JOIN grupo_integrantes gil ON p.id_inscriptoL = gil.id_inscripto
             LEFT JOIN grupos g ON gil.id_grupo = g.id
             WHERE p.id = ?`,
            [idPartido]
        );
        
        if (partidoInfo.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Partido no encontrado' });
        }
        
        const idGrupo = partidoInfo[0].id_grupo;
        
        // Limpiar resultado
        await connection.execute('DELETE FROM detalle_sets WHERE id_partido = ?', [idPartido]);
        
        await connection.execute(
            `UPDATE partido SET 
                estado = 'pendiente',
                ganador_id = NULL,
                sets_local = 0,
                sets_visitante = 0,
                games_local = 0,
                games_visitante = 0,
                tiebreak_local = NULL,
                tiebreak_visitante = NULL
             WHERE id = ?`,
            [idPartido]
        );
        
        // Recalcular estadísticas
        await calcularEstadisticasGrupo(connection, idGrupo);
        await connection.commit();
        
        res.status(200).json({ mensaje: 'Resultado eliminado exitosamente' });
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al eliminar resultado:', error);
        res.status(500).json({ error: 'Error al eliminar el resultado' });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================================
// FUNCIÓN: CALCULAR ESTADÍSTICAS DE UN GRUPO (REAL-TIME)
// ==========================================================
async function calcularEstadisticasGrupo(connection, idGrupo) {
    // 1. Obtener todos los integrantes del grupo
    const [integrantes] = await connection.execute(
        `SELECT gi.id_inscripto 
         FROM grupo_integrantes gi 
         WHERE gi.id_grupo = ?`,
        [idGrupo]
    );
    
    if (integrantes.length === 0) return;
    
    // 2. Limpiar estadísticas actuales
    await connection.execute('DELETE FROM estadisticas_grupo WHERE id_grupo = ?', [idGrupo]);
    
    // 3. Inicializar estadísticas para cada jugador
    const stats = {};
    for (const integrante of integrantes) {
        stats[integrante.id_inscripto] = {
            id_inscripto: integrante.id_inscripto,
            pj: 0, pg: 0, pp: 0, puntos: 0,
            setsGanados: 0, setsPerdidos: 0,
            gamesGanados: 0, gamesPerdidos: 0
        };
    }
    
    // 4. Obtener todos los partidos jugados del grupo
    const idsIntegrantes = integrantes.map(i => i.id_inscripto);
    const placeholders = idsIntegrantes.map(() => '?').join(',');
    
    const [partidos] = await connection.execute(
        `SELECT 
            p.id_inscriptoL, p.id_inscriptoV,
            p.sets_local, p.sets_visitante,
            p.games_local, p.games_visitante,
            p.ganador_id, p.estado
         FROM partido p
         WHERE (p.id_inscriptoL IN (${placeholders}) OR p.id_inscriptoV IN (${placeholders}))
         AND p.estado IN ('jugado', 'wo_local', 'wo_visitante')`,
        [...idsIntegrantes, ...idsIntegrantes]
    );
    
    // 5. Calcular estadísticas
    for (const partido of partidos) {
        const localId = partido.id_inscriptoL;
        const visitanteId = partido.id_inscriptoV;
        
        if (!stats[localId] || !stats[visitanteId]) continue;
        
        // Partidos jugados
        stats[localId].pj++;
        stats[visitanteId].pj++;
        
        // Sets
        stats[localId].setsGanados += partido.sets_local;
        stats[localId].setsPerdidos += partido.sets_visitante;
        stats[visitanteId].setsGanados += partido.sets_visitante;
        stats[visitanteId].setsPerdidos += partido.sets_local;
        
        // Games
        stats[localId].gamesGanados += partido.games_local;
        stats[localId].gamesPerdidos += partido.games_visitante;
        stats[visitanteId].gamesGanados += partido.games_visitante;
        stats[visitanteId].gamesPerdidos += partido.games_local;
        
        // Puntos (1 por victoria)
        if (partido.ganador_id === localId) {
            stats[localId].pg++;
            stats[localId].puntos += 1;
            stats[visitanteId].pp++;
        } else {
            stats[visitanteId].pg++;
            stats[visitanteId].puntos += 1;
            stats[localId].pp++;
        }
    }
    
    // 6. Preparar array para ordenar
    let tablaPosiciones = Object.values(stats).map(s => ({
        ...s,
        difSets: s.setsGanados - s.setsPerdidos,
        difGames: s.gamesGanados - s.gamesPerdidos
    }));
    
    // 7. Ordenar según reglas de desempate
    // Puntos -> Dif sets -> Dif games
    tablaPosiciones.sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.difSets !== a.difSets) return b.difSets - a.difSets;
        return b.difGames - a.difGames;
    });
    
    // 8. Manejar empates (enfrentamiento directo)
    for (let i = 0; i < tablaPosiciones.length - 1; i++) {
        const jugadorA = tablaPosiciones[i];
        const jugadorB = tablaPosiciones[i + 1];
        
        if (jugadorA.puntos === jugadorB.puntos && 
            jugadorA.difSets === jugadorB.difSets && 
            jugadorA.difGames === jugadorB.difGames) {
            
            // Buscar enfrentamiento directo
            const [enfrentamiento] = await connection.execute(
                `SELECT ganador_id FROM partido 
                 WHERE ((id_inscriptoL = ? AND id_inscriptoV = ?) OR (id_inscriptoL = ? AND id_inscriptoV = ?))
                 AND estado IN ('jugado', 'wo_local', 'wo_visitante')`,
                [jugadorA.id_inscripto, jugadorB.id_inscripto, jugadorB.id_inscripto, jugadorA.id_inscripto]
            );
            
            if (enfrentamiento.length > 0) {
                const ganadorDirecto = enfrentamiento[0].ganador_id;
                if (ganadorDirecto === jugadorB.id_inscripto) {
                    // Swap posiciones
                    [tablaPosiciones[i], tablaPosiciones[i + 1]] = [tablaPosiciones[i + 1], tablaPosiciones[i]];
                }
            }
        }
    }
    
    // 9. Insertar estadísticas con posiciones
    for (let i = 0; i < tablaPosiciones.length; i++) {
        const s = tablaPosiciones[i];
        const posicion = i + 1;
        
        await connection.execute(
            `INSERT INTO estadisticas_grupo 
             (id_grupo, id_inscripto, pj, pg, pp, puntos, sets_ganados, sets_perdidos, dif_sets, 
              games_ganados, games_perdidos, dif_games, posicion, es_primero, es_segundo, clasificado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [idGrupo, s.id_inscripto, s.pj, s.pg, s.pp, s.puntos, s.setsGanados, s.setsPerdidos, s.difSets,
             s.gamesGanados, s.gamesPerdidos, s.difGames, posicion, 
             posicion === 1, posicion === 2, posicion <= 2]
        );
    }
}

// ==========================================================
// ENDPOINT: OBTENER ESTADÍSTICAS DE UN GRUPO
// ==========================================================
app.get('/api/grupos/:idGrupo/estadisticas', async (req, res) => {
    const { idGrupo } = req.params;
    
    let connection;
    
    try {
        connection = await mysql.createConnection(connectionConfig);
        
        // PRIMERO: Recalcular estadísticas para asegurar que estén actualizadas
        await calcularEstadisticasGrupo(connection, idGrupo);
        
        // Obtener estadísticas con nombres de jugadores
        const [estadisticas] = await connection.execute(
            `SELECT 
                eg.*,
                i.integrantes as nombre_jugador
             FROM estadisticas_grupo eg
             INNER JOIN inscriptos i ON eg.id_inscripto = i.id
             WHERE eg.id_grupo = ?
             ORDER BY eg.posicion`,
            [idGrupo]
        );
        
        // Obtener info del grupo
        const [grupoInfo] = await connection.execute(
            `SELECT g.*, t.nombre as nombre_torneo 
             FROM grupos g 
             INNER JOIN torneos t ON g.id_torneo_fk = t.id
             WHERE g.id = ?`,
            [idGrupo]
        );
        
        await connection.end();
        
        res.status(200).json({
            grupo: grupoInfo[0] || null,
            estadisticas: estadisticas
        });
        
    } catch (error) {
        if (connection) await connection.end();
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener las estadísticas del grupo' });
    }
});

// ==========================================================
// ENDPOINT: OBTENER RESULTADOS DE UN PARTIDO (CON DETALLE DE SETS)
// ==========================================================
app.get('/api/partidos/:idPartido/resultado', async (req, res) => {
    const { idPartido } = req.params;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Obtener info del partido
        const [partido] = await connection.execute(
            `SELECT 
                p.*,
                il.integrantes as local_nombre,
                iv.integrantes as visitante_nombre
             FROM partido p
             LEFT JOIN inscriptos il ON p.id_inscriptoL = il.id
             LEFT JOIN inscriptos iv ON p.id_inscriptoV = iv.id
             WHERE p.id = ?`,
            [idPartido]
        );
        
        if (partido.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Partido no encontrado' });
        }
        
        // Obtener detalle de sets
        const [sets] = await connection.execute(
            `SELECT * FROM detalle_sets WHERE id_partido = ? ORDER BY numero_set`,
            [idPartido]
        );
        
        await connection.end();
        
        res.status(200).json({
            partido: partido[0],
            sets: sets
        });
        
    } catch (error) {
        console.error('Error al obtener resultado:', error);
        res.status(500).json({ error: 'Error al obtener el resultado del partido' });
    }
});

// ==========================================================
// ENDPOINT: OBTENER TODOS LOS PARTIDOS CON DETALLE DE SETS
// ==========================================================
app.get('/api/partidos/:idTorneo/detallados', async (req, res) => {
    const { idTorneo } = req.params;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Obtener todos los partidos
        const [partidos] = await connection.execute(
            `SELECT 
                p.id,
                p.id_horario,
                h.dia_semana,
                h.fecha,
                h.hora_inicio as horario,
                p.id_inscriptoL as local_id,
                il.integrantes as local_nombre,
                p.id_inscriptoV as visitante_id,
                iv.integrantes as visitante_nombre,
                g.categoria,
                g.numero_grupo as grupo,
                p.estado,
                p.ganador_id
             FROM partido p
             LEFT JOIN horarios h ON p.id_horario = h.id
             LEFT JOIN inscriptos il ON p.id_inscriptoL = il.id
             LEFT JOIN inscriptos iv ON p.id_inscriptoV = iv.id
             LEFT JOIN grupo_integrantes gil ON p.id_inscriptoL = gil.id_inscripto
             LEFT JOIN grupos g ON gil.id_grupo = g.id AND g.id_torneo_fk = ?
             LEFT JOIN llave_eliminacion l ON p.id = l.id_partido
             WHERE (il.id_torneo_fk = ? OR iv.id_torneo_fk = ?)
             AND l.id IS NULL
             ORDER BY h.fecha, h.hora_inicio`,
            [idTorneo, idTorneo, idTorneo]
        );
        
        // Obtener detalle de sets para cada partido
        const partidosConSets = await Promise.all(partidos.map(async (partido) => {
            const [sets] = await connection.execute(
                `SELECT numero_set, games_local, games_visitante, es_super_tiebreak 
                 FROM detalle_sets WHERE id_partido = ? ORDER BY numero_set`,
                [partido.id]
            );
            return { ...partido, sets_detalle: sets };
        }));
        
        await connection.end();
        
        res.status(200).json(partidosConSets);
        
    } catch (error) {
        console.error('Error al obtener partidos detallados:', error);
        res.status(500).json({ error: 'Error al obtener los partidos' });
    }
});

// ==========================================================
// ENDPOINT: GENERAR LLAVE DE ELIMINACIÓN POR CATEGORÍA
// ==========================================================
app.post('/api/torneo/:idTorneo/generar-llave', async (req, res) => {
    const { idTorneo } = req.params;
    const { categoria } = req.body;
    
    let connection;
    
    try {
        connection = await mysql.createConnection(connectionConfig);
        await connection.beginTransaction();
        
        // 1. Verificar si ya existe llave para esta categoría
        const [llaveExistente] = await connection.execute(
            'SELECT COUNT(*) as count FROM llave_eliminacion WHERE id_torneo = ? AND categoria = ?',
            [idTorneo, categoria]
        );
        
        if (llaveExistente[0].count > 0) {
            await connection.rollback();
            return res.status(400).json({ error: `Ya existe una llave generada para la categoría ${categoria}` });
        }
        
        // 2. Obtener clasificados de cada grupo de la categoría (1° y 2°)
        const [clasificados] = await connection.execute(
            `SELECT 
                eg.id_inscripto,
                eg.id_grupo,
                g.numero_grupo,
                eg.posicion,
                eg.puntos,
                eg.dif_sets,
                eg.dif_games,
                i.integrantes as nombre
             FROM estadisticas_grupo eg
             INNER JOIN inscriptos i ON eg.id_inscripto = i.id
             INNER JOIN grupos g ON eg.id_grupo = g.id
             WHERE g.id_torneo_fk = ? AND g.categoria = ?
             AND eg.posicion <= 2
             ORDER BY g.numero_grupo, eg.posicion`,
            [idTorneo, categoria]
        );
        
        if (clasificados.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'No hay clasificados disponibles' });
        }
        
        // 3. Calcular estructura según reglamento (2 clasificados por grupo)
        const totalClasificados = clasificados.length;
        const potenciaDe2 = Math.pow(2, Math.floor(Math.log2(totalClasificados)));
        const jugadoresAEliminar = totalClasificados - potenciaDe2; // partidos pre-playoff
        const jugadoresAHacerJugar = jugadoresAEliminar * 2; // jugadores en pre-playoff
        const jugadoresConBye = totalClasificados - jugadoresAHacerJugar; // directos a ronda principal
        
        // 4. Aplicar criterios de desempate del reglamento
        function aplicarCriteriosDesempate(a, b) {
            if (a.posicion !== b.posicion) return a.posicion - b.posicion;
            if (b.puntos !== a.puntos) return b.puntos - a.puntos;
            if (b.dif_sets !== a.dif_sets) return b.dif_sets - a.dif_sets;
            if (b.dif_games !== a.dif_games) return b.dif_games - a.dif_games;
            return Math.random() - 0.5;
        }
        
        // 5. Ordenar todos los clasificados por ranking global
        const rankingGlobal = [...clasificados].sort(aplicarCriteriosDesempate);
        const rankingIndexById = new Map(rankingGlobal.map((j, idx) => [j.id_inscripto, idx]));
        
        // 6. Separar: BYE (mejores) y Pre-playoffs (peores)
        const jugadoresConByeArray = rankingGlobal.slice(0, jugadoresConBye);
        const jugadoresParaPrePlayoffs = jugadoresAHacerJugar > 0
            ? rankingGlobal.slice(-jugadoresAHacerJugar)
            : [];
        
        // 7. Determinar rondas según potencia de 2
        const rondasMap = {
            32: ['dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'final'],
            16: ['octavos', 'cuartos', 'semifinal', 'final'],
            8: ['cuartos', 'semifinal', 'final'],
            4: ['semifinal', 'final'],
            2: ['final']
        };
        const rondas = rondasMap[potenciaDe2] || ['final'];
        const primeraRonda = rondas[0];
        // Regla general: 1° y 2° del mismo grupo en mitades opuestas para todos los tamaños
        const modoEstrictoGrupos = true;
        
        // 8. Crear bracket completo
        const bracket = [];

        // PASO 1: Crear ronda principal (partidos) con directos y espacios para ganadores de pre-playoff
        const numPartidosPrimeraRonda = potenciaDe2 / 2;
        const primeraRondaPartidos = [];

        const partidosPrePlayoff = jugadoresAEliminar;
        const directos = jugadoresConBye;
        const partidosDD = Math.max(0, directos - numPartidosPrimeraRonda); // directo vs directo
        const partidosDS = directos - (partidosDD * 2); // directo vs ganador previo
        const partidosSS = numPartidosPrimeraRonda - partidosDD - partidosDS; // ganador previo vs ganador previo

        const espaciosGanadoresEsperados = (partidosDS + (partidosSS * 2));
        if (espaciosGanadoresEsperados !== partidosPrePlayoff) {
            await connection.rollback();
            return res.status(500).json({
                error: `Error de estructura: se esperaban ${partidosPrePlayoff} espacios de ganadores y se calcularon ${espaciosGanadoresEsperados}`
            });
        }

        // Elegir posiciones de partidos DS (protegidos) desde extremos hacia el centro
        const posicionesDS = [];
        let izq = 1;
        let der = numPartidosPrimeraRonda;
        while (posicionesDS.length < partidosDS && izq <= der) {
            posicionesDS.push(izq);
            if (posicionesDS.length < partidosDS && izq !== der) posicionesDS.push(der);
            izq++;
            der--;
        }

        const posicionesRestantes = [];
        for (let p = 1; p <= numPartidosPrimeraRonda; p++) {
            if (!posicionesDS.includes(p)) posicionesRestantes.push(p);
        }
        const posicionesDD = posicionesRestantes.slice(0, partidosDD);
        const posicionesSS = posicionesRestantes.slice(partidosDD);

        const plantillaPartidos = {};
        for (let p = 1; p <= numPartidosPrimeraRonda; p++) {
            const mitad = p <= (numPartidosPrimeraRonda / 2) ? 'superior' : 'inferior';
            if (posicionesDD.includes(p)) {
                plantillaPartidos[p] = { tipo: 'DD', mitad, slotDirecto: [1, 2], slotVacios: [] };
            } else if (posicionesDS.includes(p)) {
                const slotDirecto = mitad === 'superior' ? 1 : 2;
                plantillaPartidos[p] = {
                    tipo: 'DS',
                    mitad,
                    slotDirecto: [slotDirecto],
                    slotVacios: [slotDirecto === 1 ? 2 : 1]
                };
            } else {
                plantillaPartidos[p] = { tipo: 'SS', mitad, slotDirecto: [], slotVacios: [1, 2] };
            }
        }

        for (let p = 1; p <= numPartidosPrimeraRonda; p++) {
            primeraRondaPartidos.push({
                ronda: primeraRonda,
                posicion: p,
                id_inscripto_1: null,
                id_inscripto_2: null,
                id_grupo_1: null,
                id_grupo_2: null,
                es_bye: false,
                ganador_id: null,
                es_pre_playoff: false,
                _tipo: plantillaPartidos[p].tipo,
                _mitad: plantillaPartidos[p].mitad
            });
        }

        // 1.1 Resolver orientación por grupo (1ro y 2do en mitades opuestas)
        const directosSet = new Set(jugadoresConByeArray.map(j => j.id_inscripto));
        const preSet = new Set(jugadoresParaPrePlayoffs.map(j => j.id_inscripto));

        const gruposMap = new Map();
        for (const c of clasificados) {
            if (!gruposMap.has(c.id_grupo)) gruposMap.set(c.id_grupo, {});
            const entry = gruposMap.get(c.id_grupo);
            if (c.posicion === 1) entry.primero = c;
            if (c.posicion === 2) entry.segundo = c;
        }

        const gruposCompletos = [];
        for (const [idGrupo, val] of gruposMap.entries()) {
            if (val.primero && val.segundo) {
                gruposCompletos.push({
                    idGrupo,
                    primero: val.primero,
                    segundo: val.segundo,
                    p1d: directosSet.has(val.primero.id_inscripto) ? 1 : 0,
                    p2d: directosSet.has(val.segundo.id_inscripto) ? 1 : 0,
                    p1p: preSet.has(val.primero.id_inscripto) ? 1 : 0,
                    p2p: preSet.has(val.segundo.id_inscripto) ? 1 : 0
                });
            }
        }

        const directSlotsTop = Object.values(plantillaPartidos)
            .filter(p => p.mitad === 'superior')
            .reduce((acc, p) => acc + p.slotDirecto.length, 0);
        const directSlotsBottom = Object.values(plantillaPartidos)
            .filter(p => p.mitad === 'inferior')
            .reduce((acc, p) => acc + p.slotDirecto.length, 0);
        const preSlotsTop = Object.values(plantillaPartidos)
            .filter(p => p.mitad === 'superior')
            .reduce((acc, p) => acc + p.slotVacios.length, 0);
        const preSlotsBottom = Object.values(plantillaPartidos)
            .filter(p => p.mitad === 'inferior')
            .reduce((acc, p) => acc + p.slotVacios.length, 0);

        const objetivo = {
            directTop: directSlotsTop,
            directBottom: directSlotsBottom,
            preTop: preSlotsTop * 2,
            preBottom: preSlotsBottom * 2
        };

        const directosProtegidosIds = jugadoresConByeArray.slice(0, partidosDS).map(j => j.id_inscripto);
        const dsDirectSlotsTop = Object.values(plantillaPartidos)
            .filter(p => p.tipo === 'DS' && p.mitad === 'superior')
            .length;
        const dsDirectSlotsBottom = Object.values(plantillaPartidos)
            .filter(p => p.tipo === 'DS' && p.mitad === 'inferior')
            .length;

        let mejorMask = 0;
        let mejorScore = Number.POSITIVE_INFINITY;
        let mejorCostoPrePosicion = Number.POSITIVE_INFINITY;
        let mejorCostoCrucePosicion = Number.POSITIVE_INFINITY;
        const totalMasks = Math.pow(2, gruposCompletos.length);

        for (let mask = 0; mask < totalMasks; mask++) {
            let directTop = 0;
            let directBottom = 0;
            let preTop = 0;
            let preBottom = 0;
            let protegidosTop = 0;
            let protegidosBottom = 0;
            let directPrimeroTop = 0;
            let directPrimeroBottom = 0;
            let directSegundoTop = 0;
            let directSegundoBottom = 0;
            let prePrimeroTop = 0;
            let prePrimeroBottom = 0;
            let preSegundoTop = 0;
            let preSegundoBottom = 0;

            for (let i = 0; i < gruposCompletos.length; i++) {
                const g = gruposCompletos[i];
                const invertido = ((mask >> i) & 1) === 1;

                if (!invertido) {
                    directTop += g.p1d;
                    directBottom += g.p2d;
                    preTop += g.p1p;
                    preBottom += g.p2p;

                    directPrimeroTop += g.p1d;
                    directSegundoBottom += g.p2d;
                    prePrimeroTop += g.p1p;
                    preSegundoBottom += g.p2p;
                } else {
                    directTop += g.p2d;
                    directBottom += g.p1d;
                    preTop += g.p2p;
                    preBottom += g.p1p;

                    directSegundoTop += g.p2d;
                    directPrimeroBottom += g.p1d;
                    preSegundoTop += g.p2p;
                    prePrimeroBottom += g.p1p;
                }

                if (directosProtegidosIds.includes(g.primero.id_inscripto)) {
                    if (!invertido) protegidosTop++;
                    else protegidosBottom++;
                }
                if (directosProtegidosIds.includes(g.segundo.id_inscripto)) {
                    if (!invertido) protegidosBottom++;
                    else protegidosTop++;
                }
            }

            if (modoEstrictoGrupos) {
                if (directTop !== objetivo.directTop || directBottom !== objetivo.directBottom) {
                    continue;
                }
                if (preTop !== objetivo.preTop || preBottom !== objetivo.preBottom) {
                    continue;
                }
                if (protegidosTop !== dsDirectSlotsTop || protegidosBottom !== dsDirectSlotsBottom) {
                    continue;
                }
            }

            const score =
                Math.abs(objetivo.directTop - directTop) +
                Math.abs(objetivo.directBottom - directBottom) +
                Math.abs(objetivo.preTop - preTop) +
                Math.abs(objetivo.preBottom - preBottom);

            // Costo de cruce por puesto: minimizar 1°vs1° y 2°vs2° cuando hay alternativa
            const costoCrucePosicion =
                Math.abs(directPrimeroTop - directSegundoTop) +
                Math.abs(directPrimeroBottom - directSegundoBottom);

            // Costo de pre-playoff por puesto (prioritario cuando hay pre):
            // minimizar escenarios donde una mitad queda cargada de 1° o de 2°
            const costoPrePosicion =
                Math.abs(prePrimeroTop - preSegundoTop) +
                Math.abs(prePrimeroBottom - preSegundoBottom);

            if (
                score < mejorScore ||
                (score === mejorScore && costoPrePosicion < mejorCostoPrePosicion) ||
                (score === mejorScore && costoPrePosicion === mejorCostoPrePosicion && costoCrucePosicion < mejorCostoCrucePosicion)
            ) {
                mejorScore = score;
                mejorCostoPrePosicion = costoPrePosicion;
                mejorCostoCrucePosicion = costoCrucePosicion;
                mejorMask = mask;
                if (score === 0 && costoPrePosicion === 0 && costoCrucePosicion === 0) break;
            }
        }

        if (modoEstrictoGrupos && mejorScore === Number.POSITIVE_INFINITY) {
            await connection.rollback();
            return res.status(500).json({
                error: 'Error de estructura: no se encontró orientación válida respetando separación de grupos'
            });
        }

        const mitadRequerida = new Map();
        for (let i = 0; i < gruposCompletos.length; i++) {
            const g = gruposCompletos[i];
            const invertido = ((mejorMask >> i) & 1) === 1;
            if (!invertido) {
                mitadRequerida.set(g.primero.id_inscripto, 'superior');
                mitadRequerida.set(g.segundo.id_inscripto, 'inferior');
            } else {
                mitadRequerida.set(g.primero.id_inscripto, 'inferior');
                mitadRequerida.set(g.segundo.id_inscripto, 'superior');
            }
        }

        const dsSlots = [];
        const ddPartidos = [];
        for (let p = 1; p <= numPartidosPrimeraRonda; p++) {
            for (const slot of plantillaPartidos[p].slotDirecto) {
                const item = {
                    posicion: p,
                    slot,
                    mitad: plantillaPartidos[p].mitad
                };
                if (plantillaPartidos[p].tipo === 'DS') {
                    dsSlots.push(item);
                } else {
                    // DD se resuelve por partido completo (2 slots)
                    if (!ddPartidos.some(dp => dp.posicion === p)) {
                        ddPartidos.push({ posicion: p, mitad: plantillaPartidos[p].mitad });
                    }
                }
            }
        }

        const grupoMitadDirecto = new Map();
        const directosOrdenados = [...jugadoresConByeArray];

        function buscarSlotDisponible(pool, jugador, mitadPreferida) {
            let candidatos = pool.filter(s => !s.usado);
            if (mitadPreferida) {
                const filtrados = candidatos.filter(s => s.mitad === mitadPreferida);
                if (filtrados.length > 0) {
                    candidatos = filtrados;
                } else if (modoEstrictoGrupos) {
                    return null;
                }
            }

            for (const c of candidatos) {
                const partido = primeraRondaPartidos[c.posicion - 1];
                const grupoOcupado1 = partido.id_grupo_1;
                const grupoOcupado2 = partido.id_grupo_2;
                if (grupoOcupado1 !== jugador.id_grupo && grupoOcupado2 !== jugador.id_grupo) {
                    return c;
                }
            }

            if (modoEstrictoGrupos) {
                return null;
            }
            return pool.find(s => !s.usado) || null;
        }

        // 1.2 Ubicar primero a los protegidos en los partidos DS (esperan ganador previo)
        const directosProtegidos = directosOrdenados.slice(0, partidosDS);
        const directosResto = directosOrdenados.slice(partidosDS);

        const protegidosPendientes = [...directosProtegidos];
        for (const slotDs of dsSlots) {
            if (protegidosPendientes.length === 0) break;

            let idxJugador = protegidosPendientes.findIndex(j => (mitadRequerida.get(j.id_inscripto) || slotDs.mitad) === slotDs.mitad);
            if (idxJugador === -1) {
                if (modoEstrictoGrupos) {
                    await connection.rollback();
                    return res.status(500).json({
                        error: 'Error de estructura: no se pudo ubicar protegidos DS en mitades correctas'
                    });
                }
                idxJugador = 0;
            }

            const jugador = protegidosPendientes.splice(idxJugador, 1)[0];
            const mitadPreferida = mitadRequerida.get(jugador.id_inscripto) || slotDs.mitad;

            const slotElegido = buscarSlotDisponible(dsSlots, jugador, mitadPreferida);
            if (!slotElegido) {
                await connection.rollback();
                return res.status(500).json({
                    error: 'Error de estructura: no se encontró slot DS para ubicar clasificados protegidos'
                });
            }

            const partido = primeraRondaPartidos[slotElegido.posicion - 1];
            if (slotElegido.slot === 1) {
                partido.id_inscripto_1 = jugador.id_inscripto;
                partido.id_grupo_1 = jugador.id_grupo;
            } else {
                partido.id_inscripto_2 = jugador.id_inscripto;
                partido.id_grupo_2 = jugador.id_grupo;
            }

            partido.es_bye = 0;

            slotElegido.usado = true;
            if (!grupoMitadDirecto.has(jugador.id_grupo)) {
                grupoMitadDirecto.set(jugador.id_grupo, slotElegido.mitad);
            }
        }

        // 1.3 Ubicar el resto de directos en partidos DD
        // Prioridad: evitar 1° vs 1° y 2° vs 2° cuando exista alternativa
        const restantesDD = [...directosResto];
        ddPartidos.sort((a, b) => a.posicion - b.posicion);

        for (const dd of ddPartidos) {
            let candidatos = restantesDD.filter(j => (mitadRequerida.get(j.id_inscripto) || dd.mitad) === dd.mitad);
            if (candidatos.length < 2) {
                if (modoEstrictoGrupos) {
                    await connection.rollback();
                    return res.status(500).json({
                        error: 'Error de estructura: faltan directos en la mitad requerida para partido DD'
                    });
                }
                candidatos = [...restantesDD];
            }

            let parElegido = null;

            // Intento 1: par de distinto puesto (1° vs 2°) y distinto grupo
            for (let i = 0; i < candidatos.length && !parElegido; i++) {
                for (let j = i + 1; j < candidatos.length && !parElegido; j++) {
                    if (candidatos[i].id_grupo !== candidatos[j].id_grupo && candidatos[i].posicion !== candidatos[j].posicion) {
                        parElegido = [candidatos[i], candidatos[j]];
                    }
                }
            }

            // Intento 2: mismo puesto permitido, pero distinto grupo
            if (!parElegido) {
                for (let i = 0; i < candidatos.length && !parElegido; i++) {
                    for (let j = i + 1; j < candidatos.length && !parElegido; j++) {
                        if (candidatos[i].id_grupo !== candidatos[j].id_grupo) {
                            parElegido = [candidatos[i], candidatos[j]];
                        }
                    }
                }
            }

            if (!parElegido) {
                await connection.rollback();
                return res.status(500).json({
                    error: 'Error de estructura: no se pudo formar un par DD válido'
                });
            }

            const [jugadorA, jugadorB] = parElegido;
            const idxA = restantesDD.findIndex(j => j.id_inscripto === jugadorA.id_inscripto);
            const idxB = restantesDD.findIndex(j => j.id_inscripto === jugadorB.id_inscripto);
            if (idxA >= 0) restantesDD.splice(idxA, 1);
            if (idxB >= 0) {
                const nuevoIdxB = restantesDD.findIndex(j => j.id_inscripto === jugadorB.id_inscripto);
                if (nuevoIdxB >= 0) restantesDD.splice(nuevoIdxB, 1);
            }

            const partido = primeraRondaPartidos[dd.posicion - 1];
            partido.id_inscripto_1 = jugadorA.id_inscripto;
            partido.id_grupo_1 = jugadorA.id_grupo;
            partido.id_inscripto_2 = jugadorB.id_inscripto;
            partido.id_grupo_2 = jugadorB.id_grupo;
            partido.es_bye = 0;

            if (!grupoMitadDirecto.has(jugadorA.id_grupo)) grupoMitadDirecto.set(jugadorA.id_grupo, dd.mitad);
            if (!grupoMitadDirecto.has(jugadorB.id_grupo)) grupoMitadDirecto.set(jugadorB.id_grupo, dd.mitad);
        }

        const slotsVacios = [];
        for (let p = 1; p <= numPartidosPrimeraRonda; p++) {
            for (const slot of plantillaPartidos[p].slotVacios) {
                slotsVacios.push({ posicion: p, slot, mitad: plantillaPartidos[p].mitad });
            }
        }

        // PASO 2: Crear pre-playoffs respetando mitades objetivo
        function costoParejaPre(a, b) {
            let costo = 0;
            // Penalizar fuerte cruces del mismo puesto (1°vs1° o 2°vs2°)
            if (a.posicion === b.posicion) costo += 100;
            // Desempate suave por cercanía de ranking global
            const ra = rankingIndexById.get(a.id_inscripto) ?? 999;
            const rb = rankingIndexById.get(b.id_inscripto) ?? 999;
            costo += Math.abs(ra - rb) * 0.001;
            return costo;
        }

        function armarParesOptimos(jugadoresMitad) {
            const jugadores = [...jugadoresMitad];
            if (jugadores.length === 0) return [];
            if (jugadores.length % 2 !== 0) return null;

            const n = jugadores.length;
            const usados = new Array(n).fill(false);
            let mejorCosto = Number.POSITIVE_INFINITY;
            let mejorPares = null;

            function backtrack(paresActuales, costoActual) {
                if (costoActual >= mejorCosto) return;

                let i = -1;
                for (let k = 0; k < n; k++) {
                    if (!usados[k]) { i = k; break; }
                }

                if (i === -1) {
                    mejorCosto = costoActual;
                    mejorPares = [...paresActuales];
                    return;
                }

                usados[i] = true;
                for (let j = i + 1; j < n; j++) {
                    if (usados[j]) continue;
                    const a = jugadores[i];
                    const b = jugadores[j];
                    if (a.id_grupo === b.id_grupo) continue;

                    usados[j] = true;
                    paresActuales.push([a, b]);
                    backtrack(paresActuales, costoActual + costoParejaPre(a, b));
                    paresActuales.pop();
                    usados[j] = false;
                }
                usados[i] = false;
            }

            backtrack([], 0);

            if (mejorPares) return mejorPares;

            // Fallback (muy improbable): greedy sin mismo grupo
            const lista = [...jugadores];
            const pares = [];
            while (lista.length >= 2) {
                const j1 = lista.shift();
                let idx = lista.findIndex(j => j.id_grupo !== j1.id_grupo && j.posicion !== j1.posicion);
                if (idx === -1) idx = lista.findIndex(j => j.id_grupo !== j1.id_grupo);
                if (idx === -1) idx = 0;
                const j2 = lista.splice(idx, 1)[0];
                pares.push([j1, j2]);
            }
            return pares;
        }

        const preTop = [];
        const preBottom = [];
        for (const j of jugadoresParaPrePlayoffs) {
            const mitad = mitadRequerida.get(j.id_inscripto) || (preTop.length <= preBottom.length ? 'superior' : 'inferior');
            if (mitad === 'superior') preTop.push(j);
            else preBottom.push(j);
        }

        // Rebalanceo: ambas listas deben quedar pares para poder formar cruces completos
        if (preTop.length % 2 !== 0 || preBottom.length % 2 !== 0) {
            if (preTop.length % 2 !== 0 && preBottom.length % 2 !== 0) {
                if (preTop.length >= preBottom.length && preTop.length > 0) preBottom.push(preTop.pop());
                else if (preBottom.length > 0) preTop.push(preBottom.pop());
            } else if (preTop.length % 2 !== 0 && preTop.length > 0) {
                preBottom.push(preTop.pop());
            } else if (preBottom.length % 2 !== 0 && preBottom.length > 0) {
                preTop.push(preBottom.pop());
            }
        }

        if (preTop.length % 2 !== 0 || preBottom.length % 2 !== 0) {
            await connection.rollback();
            return res.status(500).json({ error: 'Error de estructura: no se pudo balancear pre-playoffs por mitad' });
        }

        const paresTop = armarParesOptimos(preTop);
        const paresBottom = armarParesOptimos(preBottom);
        if (!paresTop || !paresBottom) {
            await connection.rollback();
            return res.status(500).json({ error: 'Error de estructura: no se pudo armar cruces válidos de pre-playoff' });
        }

        const paresPre = [...paresTop, ...paresBottom];
        const prePlayoffs = [];
        let posicionPrePlayoff = 1;
        for (const [j1, j2] of paresPre) {
            prePlayoffs.push({
                ronda: 'pre-playoff',
                posicion: posicionPrePlayoff++,
                id_inscripto_1: j1.id_inscripto,
                id_inscripto_2: j2.id_inscripto,
                id_grupo_1: j1.id_grupo,
                id_grupo_2: j2.id_grupo,
                es_bye: 0,
                ganador_id: null,
                es_pre_playoff: true,
                _mitad_objetivo: mitadRequerida.get(j1.id_inscripto) || mitadRequerida.get(j2.id_inscripto) || 'superior'
            });
        }

        bracket.push(...prePlayoffs);

        const destinosPrePlayoff = [];
        for (const pre of prePlayoffs) {
            if (slotsVacios.length === 0) {
                await connection.rollback();
                return res.status(500).json({
                    error: 'Error de estructura: faltan slots vacíos para ganadores de pre-playoff'
                });
            }

            let mejorIdx = 0;
            let mejorScore = Number.POSITIVE_INFINITY;
            for (let i = 0; i < slotsVacios.length; i++) {
                const slot = slotsVacios[i];
                let score = slot.mitad === pre._mitad_objetivo ? 0 : 10;
                if (modoEstrictoGrupos && score > 0) {
                    continue;
                }
                if (score < mejorScore) {
                    mejorScore = score;
                    mejorIdx = i;
                }
            }

            if (modoEstrictoGrupos && mejorScore === Number.POSITIVE_INFINITY) {
                await connection.rollback();
                return res.status(500).json({
                    error: 'Error de estructura: no se encontró destino de mitad correcta para pre-playoff'
                });
            }

            const destino = slotsVacios.splice(mejorIdx, 1)[0];
            destinosPrePlayoff.push({
                prePosicion: pre.posicion,
                rondaDestino: primeraRonda,
                posicionDestino: destino.posicion,
                slotDestino: destino.slot
            });
        }

        primeraRondaPartidos.forEach(partido => {
            partido.es_bye = 0;
            delete partido._tipo;
            delete partido._mitad;
        });

        prePlayoffs.forEach(pre => {
            delete pre._mitad_objetivo;
        });

        primeraRondaPartidos.sort((a, b) => a.posicion - b.posicion);
        bracket.push(...primeraRondaPartidos);
        
        // PASO 3: Crear rondas siguientes
        for (let i = 1; i < rondas.length; i++) {
            const ronda = rondas[i];
            const numPartidos = Math.pow(2, rondas.length - i - 1);
            
            for (let j = 0; j < numPartidos; j++) {
                bracket.push({
                    ronda: ronda,
                    posicion: j + 1,
                    id_inscripto_1: null,
                    id_inscripto_2: null,
                    id_grupo_1: null,
                    id_grupo_2: null,
                    es_bye: false,
                    ganador_id: null,
                    es_pre_playoff: false
                });
            }
        }
        
        // 9. Validaciones
        const jugadoresEnBracket = new Set();
        const duplicadosEncontrados = [];
        
        bracket.forEach(elemento => {
            if (elemento.id_inscripto_1) {
                if (jugadoresEnBracket.has(elemento.id_inscripto_1)) {
                    duplicadosEncontrados.push(elemento.id_inscripto_1);
                }
                jugadoresEnBracket.add(elemento.id_inscripto_1);
            }
            if (elemento.id_inscripto_2) {
                if (jugadoresEnBracket.has(elemento.id_inscripto_2)) {
                    duplicadosEncontrados.push(elemento.id_inscripto_2);
                }
                jugadoresEnBracket.add(elemento.id_inscripto_2);
            }
        });
        
        if (duplicadosEncontrados.length > 0) {
            await connection.rollback();
            return res.status(500).json({ 
                error: `Error de duplicación: jugadores repetidos en el bracket: ${duplicadosEncontrados.join(', ')}` 
            });
        }
        
        const jugadoresClasificados = clasificados.map(c => c.id_inscripto);
        const jugadoresFaltantes = jugadoresClasificados.filter(id => !jugadoresEnBracket.has(id));
        
        if (jugadoresFaltantes.length > 0) {
            await connection.rollback();
            return res.status(500).json({ 
                error: `Error: jugadores clasificados no incluidos en el bracket: ${jugadoresFaltantes.join(', ')}` 
            });
        }
        
        // 10. Insertar en BD
        for (const elemento of bracket) {
            const [insertRes] = await connection.execute(
                `INSERT INTO llave_eliminacion 
                 (id_torneo, categoria, ronda, posicion, id_inscripto_1, id_inscripto_2, 
                  id_grupo_1, id_grupo_2, es_bye, ganador_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [idTorneo, categoria, elemento.ronda, elemento.posicion,
                 elemento.id_inscripto_1, elemento.id_inscripto_2,
                 elemento.id_grupo_1, elemento.id_grupo_2,
                 elemento.es_bye, elemento.ganador_id]
            );
            elemento.id_llave = insertRes.insertId;
        }

        // 10.1 Insertar mapeo determinístico de avance
        const llavePorRondaPos = new Map();
        for (const e of bracket) {
            llavePorRondaPos.set(`${e.ronda}:${e.posicion}`, e.id_llave);
        }

        try {
            // Pre-playoff -> ronda principal (según slots vacíos definidos en generación)
            for (const m of destinosPrePlayoff) {
                const origenId = llavePorRondaPos.get(`pre-playoff:${m.prePosicion}`);
                const destinoId = llavePorRondaPos.get(`${m.rondaDestino}:${m.posicionDestino}`);
                if (origenId && destinoId) {
                    await connection.execute(
                        `INSERT INTO llave_avance (id_llave_origen, id_llave_destino, slot_destino)
                         VALUES (?, ?, ?)`,
                        [origenId, destinoId, m.slotDestino]
                    );
                }
            }

            // Ronda principal y siguientes -> mapeo binario estándar
            for (let i = 0; i < rondas.length - 1; i++) {
                const rondaActual = rondas[i];
                const rondaSiguiente = rondas[i + 1];
                const partidosActuales = bracket
                    .filter(e => e.ronda === rondaActual)
                    .sort((a, b) => a.posicion - b.posicion);

                for (const partidoActual of partidosActuales) {
                    const posSiguiente = Math.ceil(partidoActual.posicion / 2);
                    const slotDestino = partidoActual.posicion % 2 === 1 ? 1 : 2;
                    const destinoId = llavePorRondaPos.get(`${rondaSiguiente}:${posSiguiente}`);
                    if (destinoId) {
                        await connection.execute(
                            `INSERT INTO llave_avance (id_llave_origen, id_llave_destino, slot_destino)
                             VALUES (?, ?, ?)`,
                            [partidoActual.id_llave, destinoId, slotDestino]
                        );
                    }
                }
            }
        } catch (mapeoError) {
            // Mantener compatibilidad si la tabla puente no está disponible en algún entorno
            console.warn('No se pudo guardar mapeo en llave_avance:', mapeoError.message);
        }
        
        await connection.execute(
            `UPDATE grupos SET estado = 'finalizado' WHERE id_torneo_fk = ?`,
            [idTorneo]
        );
        
        await connection.commit();
        
        res.status(200).json({
            mensaje: `Llave de eliminación generada exitosamente para ${categoria}`,
            categoria: categoria,
            totalClasificados: totalClasificados,
            estructura: {
                potenciaDe2: potenciaDe2,
                jugadoresAEliminar: jugadoresAEliminar,
                jugadoresAHacerJugar: jugadoresAHacerJugar,
                jugadoresConBye: jugadoresConBye,
                partidosPrePlayoffs: prePlayoffs.length,
                primeraRonda: primeraRonda
            },
            rondas: rondas,
            bracket: bracket,
            resumen: {
                prePlayoffs: bracket.filter(p => p.es_pre_playoff).length,
                byes: bracket.filter(p => p.es_bye && !p.es_pre_playoff).length,
                totalElementos: bracket.length
            }
        });
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al generar llave:', error);
        res.status(500).json({ error: 'Error al generar la llave de eliminación' });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================================
// ENDPOINT: OBTENER LLAVE DE ELIMINACIÓN POR CATEGORÍA
// ==========================================================
app.get('/api/torneo/:idTorneo/llave', async (req, res) => {
    const { idTorneo } = req.params;
    const { categoria } = req.query;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        let query = `
            SELECT 
                l.*,
                i1.integrantes as nombre_1,
                i2.integrantes as nombre_2,
                g.integrantes as nombre_ganador,
                p.id as id_partido_asignado,
                p.estado as partido_estado,
                hp.fecha,
                hp.hora_inicio
             FROM llave_eliminacion l
             LEFT JOIN inscriptos i1 ON l.id_inscripto_1 = i1.id
             LEFT JOIN inscriptos i2 ON l.id_inscripto_2 = i2.id
             LEFT JOIN inscriptos g ON l.ganador_id = g.id
             LEFT JOIN partido p ON l.id_partido = p.id
             LEFT JOIN horarios hp ON p.id_horario = hp.id AND hp.es_playoff = TRUE
             WHERE l.id_torneo = ?`;
        
        const params = [idTorneo];
        
        if (categoria) {
            query += ` AND l.categoria = ?`;
            params.push(categoria);
        }
        
        query += `
             ORDER BY 
                FIELD(l.ronda, 'final', 'semifinal', 'cuartos', 'octavos', 'dieciseisavos', 'pre-playoff'),
                l.posicion`;
        
        const [llave] = await connection.execute(query, params);
        
        // Obtener detalles de sets para cada partido
        const partidosIds = llave.filter(e => e.id_partido).map(e => e.id_partido);
        
        if (partidosIds.length > 0) {
            const placeholders = partidosIds.map(() => '?').join(',');
            const [setsDetalle] = await connection.execute(
                `SELECT id_partido, numero_set, games_local, games_visitante, es_super_tiebreak 
                 FROM detalle_sets 
                 WHERE id_partido IN (${placeholders})
                 ORDER BY id_partido, numero_set`,
                partidosIds
            );
            
            // Agrupar sets por partido
            const setsPorPartido = {};
            for (const set of setsDetalle) {
                if (!setsPorPartido[set.id_partido]) {
                    setsPorPartido[set.id_partido] = [];
                }
                setsPorPartido[set.id_partido].push(set);
            }
            
            // Agregar sets a cada enfrentamiento
            for (const enfrentamiento of llave) {
                if (enfrentamiento.id_partido && setsPorPartido[enfrentamiento.id_partido]) {
                    enfrentamiento.sets_detalle = setsPorPartido[enfrentamiento.id_partido];
                } else {
                    enfrentamiento.sets_detalle = [];
                }
            }
        }
        
        await connection.end();
        
        // Organizar por rondas
        const bracketPorRonda = {};
        for (const enfrentamiento of llave) {
            if (!bracketPorRonda[enfrentamiento.ronda]) {
                bracketPorRonda[enfrentamiento.ronda] = [];
            }
            bracketPorRonda[enfrentamiento.ronda].push(enfrentamiento);
        }
        
        res.status(200).json({
            bracket: bracketPorRonda,
            totalEnfrentamientos: llave.length,
            categoria: categoria || 'todas'
        });
        
    } catch (error) {
        console.error('Error al obtener llave:', error);
        res.status(500).json({ error: 'Error al obtener la llave de eliminación' });
    }
});

// ==========================================================
// ENDPOINT: OBTENER CATEGORÍAS CON LLAVE GENERADA
// ==========================================================
app.get('/api/torneo/:idTorneo/categorias-llave', async (req, res) => {
    const { idTorneo } = req.params;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        const [categorias] = await connection.execute(
            `SELECT DISTINCT categoria FROM llave_eliminacion WHERE id_torneo = ? ORDER BY categoria`,
            [idTorneo]
        );
        
        await connection.end();
        
        res.status(200).json({
            categorias: categorias.map(c => c.categoria)
        });
        
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener las categorías' });
    }
});

// ==========================================================
// ENDPOINT: ASIGNAR HORARIO A PARTIDO DE PLAYOFFS
// ==========================================================
app.put('/api/llave/:idLlave/horario', async (req, res) => {
    const { idLlave } = req.params;
    const { id_horario_playoffs } = req.body;
    
    let connection;
    
    try {
        connection = await mysql.createConnection(connectionConfig);
        await connection.beginTransaction();
        
        // 1. Obtener info de la llave
        const [llaveInfo] = await connection.execute(
            `SELECT * FROM llave_eliminacion WHERE id = ?`,
            [idLlave]
        );
        
        if (llaveInfo.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Enfrentamiento no encontrado' });
        }
        
        const llave = llaveInfo[0];
        
        // 2. Verificar si ya existe partido
        let partidoId = llave.id_partido;
        
        if (!partidoId) {
            // Crear nuevo partido
            const [resultPartido] = await connection.execute(
                `INSERT INTO partido (id_horario, id_inscriptoL, id_inscriptoV, estado, ronda)
                 VALUES (?, ?, ?, 'pendiente', ?)`,
                [id_horario_playoffs, llave.id_inscripto_1, llave.id_inscripto_2, llave.ronda]
            );
            partidoId = resultPartido.insertId;
            
            // Actualizar llave con referencia al partido
            await connection.execute(
                `UPDATE llave_eliminacion SET id_partido = ? WHERE id = ?`,
                [partidoId, idLlave]
            );
        } else {
            // Actualizar horario del partido existente
            await connection.execute(
                `UPDATE partido SET id_horario = ? WHERE id = ?`,
                [id_horario_playoffs, partidoId]
            );
        }
        
        // 3. No marcar horario como ocupado (permitir reuso)
        // Los horarios de playoffs pueden usarse múltiples veces
        
        await connection.commit();
        
        res.status(200).json({
            mensaje: 'Horario asignado exitosamente',
            partidoId: partidoId
        });
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al asignar horario:', error);
        res.status(500).json({ error: 'Error al asignar el horario' });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================================
// ENDPOINT: CARGAR RESULTADO EN PLAYOFFS
// ==========================================================
app.post('/api/llave/:idLlave/resultado', async (req, res) => {
    const { idLlave } = req.params;
    const { sets, esWO, ganadorWO, superTiebreak } = req.body;
    
    // DEBUG INICIO: Verificar que el endpoint se ejecuta
    console.log(`🔥🔥🔥 DEBUG - Endpoint POST /api/llave/${idLlave}/resultado llamado`);
    console.log(`🔥🔥🔥 DEBUG - Body recibido:`, { sets: sets ? 'presente' : 'ausente', esWO, ganadorWO });
    
    let connection;
    
    try {
        console.log(`🔥🔥🔥 DEBUG - Iniciando transacción...`);
        connection = await mysql.createConnection(connectionConfig);
        await connection.beginTransaction();
        
        // 1. Obtener info de la llave con datos del partido y horario
        const [llaveInfo] = await connection.execute(
            `SELECT l.*, p.id_horario, h.fecha, h.hora_inicio 
             FROM llave_eliminacion l
             LEFT JOIN partido p ON l.id_partido = p.id
             LEFT JOIN horarios h ON p.id_horario = h.id
             WHERE l.id = ?`,
            [idLlave]
        );
        
        if (llaveInfo.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Enfrentamiento no encontrado' });
        }
        
        const llave = llaveInfo[0];
        
        // 2. Verificar que tenga partido asignado
        if (!llave.id_partido) {
            await connection.rollback();
            return res.status(400).json({ error: 'No hay partido asignado a este enfrentamiento' });
        }
        
        // 3. Verificar que tenga horario asignado
        if (!llave.fecha || !llave.hora_inicio) {
            await connection.rollback();
            return res.status(400).json({ 
                error: 'Partido sin Horario asignado',
                mensaje: 'Debe asignar un horario antes de cargar el resultado'
            });
        }
        
        // 4. Procesar sets y calcular totales
        let setsLocal = 0, setsVisitante = 0;
        let gamesLocalTotal = 0, gamesVisitanteTotal = 0;
        let tiebreakLocal = null, tiebreakVisitante = null;
        let ganadorId = null;
        
        if (esWO) {
            ganadorId = ganadorWO === 'local' ? llave.id_inscripto_1 : llave.id_inscripto_2;
        } else {
            // Guardar detalle de sets en BD
            await connection.execute('DELETE FROM detalle_sets WHERE id_partido = ?', [llave.id_partido]);
            
            // Procesar sets 1 y 2
            for (let i = 0; i < sets.length; i++) {
                const set = sets[i];
                gamesLocalTotal += parseInt(set.gamesLocal);
                gamesVisitanteTotal += parseInt(set.gamesVisitante);
                
                if (parseInt(set.gamesLocal) > parseInt(set.gamesVisitante)) {
                    setsLocal++;
                } else {
                    setsVisitante++;
                }
                
                await connection.execute(
                    `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                     VALUES (?, ?, ?, ?, FALSE)`,
                    [llave.id_partido, i + 1, set.gamesLocal, set.gamesVisitante]
                );
            }
            
            // Procesar super tie-break si hay 1-1 en sets
            if (superTiebreak && setsLocal === 1 && setsVisitante === 1) {
                tiebreakLocal = parseInt(superTiebreak.local);
                tiebreakVisitante = parseInt(superTiebreak.visitante);
                gamesLocalTotal += tiebreakLocal;
                gamesVisitanteTotal += tiebreakVisitante;
                
                // El super tie-break determina el tercer set
                if (tiebreakLocal > tiebreakVisitante) {
                    setsLocal++;
                } else {
                    setsVisitante++;
                }
                
                await connection.execute(
                    `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                     VALUES (?, 3, ?, ?, TRUE)`,
                    [llave.id_partido, tiebreakLocal, tiebreakVisitante]
                );
            }
            
            // Determinar ganador DESPUÉS de procesar todos los sets incluyendo super TB
            ganadorId = setsLocal > setsVisitante ? llave.id_inscripto_1 : llave.id_inscripto_2;
        }
        
        // 5. Actualizar llave con ganador
        await connection.execute(
            `UPDATE llave_eliminacion SET ganador_id = ? WHERE id = ?`,
            [ganadorId, idLlave]
        );
        
        // 6. Actualizar partido con resultado
        await connection.execute(
            `UPDATE partido SET 
                estado = ?,
                ganador_id = ?,
                sets_local = ?,
                sets_visitante = ?,
                games_local = ?,
                games_visitante = ?,
                tiebreak_local = ?,
                tiebreak_visitante = ?
             WHERE id = ?`,
            [esWO ? (ganadorWO === 'local' ? 'wo_local' : 'wo_visitante') : 'jugado',
             ganadorId, setsLocal, setsVisitante, gamesLocalTotal, gamesVisitanteTotal,
             tiebreakLocal, tiebreakVisitante, llave.id_partido]
        );
        
        // 6. Avanzar ganador a siguiente ronda
        console.log(`🚀 DEBUG - Llamando avanzarGanadorEnLlave para llave ${idLlave}: ronda=${llave.ronda}, pos=${llave.posicion}, ganador=${ganadorId}`);
        try {
            await avanzarGanadorEnLlave(connection, llave.id, llave.id_torneo, llave.categoria, llave.ronda, llave.posicion, ganadorId);
            console.log(`✅ DEBUG - avanzarGanadorEnLlave completado exitosamente`);
        } catch (avanceError) {
            console.error(`❌ DEBUG - Error en avanzarGanadorEnLlave:`, avanceError.message);
            throw avanceError;
        }
        
        await connection.commit();
        
        res.status(200).json({
            mensaje: 'Resultado guardado y ganador avanzado',
            ganadorId: ganadorId
        });
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al cargar resultado en playoffs:', error);
        res.status(500).json({ error: 'Error al cargar el resultado' });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================================
// ENDPOINT: EDITAR RESULTADO EN PLAYOFFS
// ==========================================================
app.put('/api/llave/:idLlave/resultado', async (req, res) => {
    const { idLlave } = req.params;
    const { sets, esWO, ganadorWO, superTiebreak } = req.body;
    
    let connection;
    
    try {
        connection = await mysql.createConnection(connectionConfig);
        await connection.beginTransaction();
        
        // 1. Obtener info de la llave
        const [llaveInfo] = await connection.execute(
            `SELECT * FROM llave_eliminacion WHERE id = ?`,
            [idLlave]
        );
        
        if (llaveInfo.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Enfrentamiento no encontrado' });
        }
        
        const llave = llaveInfo[0];
        
        // 2. Verificar que tenga partido y resultado
        if (!llave.id_partido || !llave.ganador_id) {
            await connection.rollback();
            return res.status(400).json({ error: 'No hay resultado previo para editar' });
        }
        
        const ganadorAnterior = llave.ganador_id;
        
        // 3. Calcular nuevo ganador
        let ganadorId = null;
        
        if (esWO) {
            ganadorId = ganadorWO === 'local' ? llave.id_inscripto_1 : llave.id_inscripto_2;
        } else {
            let setsLocal = 0, setsVisitante = 0;
            
            for (const set of sets) {
                if (parseInt(set.gamesLocal) > parseInt(set.gamesVisitante)) {
                    setsLocal++;
                } else {
                    setsVisitante++;
                }
            }
            
            if (superTiebreak && setsLocal === 1 && setsVisitante === 1) {
                if (superTiebreak.local > superTiebreak.visitante) {
                    setsLocal++;
                } else {
                    setsVisitante++;
                }
            }
            
            ganadorId = setsLocal > setsVisitante ? llave.id_inscripto_1 : llave.id_inscripto_2;
        }
        
        // 4. Actualizar llave con nuevo ganador
        await connection.execute(
            `UPDATE llave_eliminacion SET ganador_id = ? WHERE id = ?`,
            [ganadorId, idLlave]
        );
        
        // 5. Guardar resultado en partido
        let setsLocal = 0, setsVisitante = 0;
        let gamesLocalTotal = 0, gamesVisitanteTotal = 0;
        let tiebreakLocal = null, tiebreakVisitante = null;
        
        if (!esWO) {
            await connection.execute('DELETE FROM detalle_sets WHERE id_partido = ?', [llave.id_partido]);
            
            for (let i = 0; i < sets.length; i++) {
                const set = sets[i];
                gamesLocalTotal += parseInt(set.gamesLocal);
                gamesVisitanteTotal += parseInt(set.gamesVisitante);
                
                if (set.gamesLocal > set.gamesVisitante) {
                    setsLocal++;
                } else {
                    setsVisitante++;
                }
                
                await connection.execute(
                    `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                     VALUES (?, ?, ?, ?, FALSE)`,
                    [llave.id_partido, i + 1, set.gamesLocal, set.gamesVisitante]
                );
            }
            
            if (superTiebreak && setsLocal === 1 && setsVisitante === 1) {
                tiebreakLocal = superTiebreak.local;
                tiebreakVisitante = superTiebreak.visitante;
                gamesLocalTotal += tiebreakLocal;
                gamesVisitanteTotal += tiebreakVisitante;
                
                await connection.execute(
                    `INSERT INTO detalle_sets (id_partido, numero_set, games_local, games_visitante, es_super_tiebreak) 
                     VALUES (?, 3, ?, ?, TRUE)`,
                    [llave.id_partido, tiebreakLocal, tiebreakVisitante]
                );
            }
        }
        
        await connection.execute(
            `UPDATE partido SET 
                estado = ?,
                ganador_id = ?,
                sets_local = ?,
                sets_visitante = ?,
                games_local = ?,
                games_visitante = ?,
                tiebreak_local = ?,
                tiebreak_visitante = ?
             WHERE id = ?`,
            [esWO ? (ganadorWO === 'local' ? 'wo_local' : 'wo_visitante') : 'jugado',
             ganadorId, setsLocal, setsVisitante, gamesLocalTotal, gamesVisitanteTotal,
             tiebreakLocal, tiebreakVisitante, llave.id_partido]
        );
        
        // 6. SIEMPRE avanzar el ganador a la siguiente ronda (sin importar si cambió o no)
        // Esto soluciona el problema de los BYE que ya tienen ganador_id seteado
        await avanzarGanadorEnLlave(connection, llave.id, llave.id_torneo, llave.categoria, llave.ronda, llave.posicion, ganadorId);
        
        await connection.commit();
        
        res.status(200).json({
            mensaje: 'Resultado actualizado correctamente',
            ganadorId: ganadorId
        });
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al editar resultado en playoffs:', error);
        res.status(500).json({ error: 'Error al editar el resultado' });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================================
// ENDPOINT: ELIMINAR RESULTADO EN PLAYOFFS
// ==========================================================
app.delete('/api/llave/:idLlave/resultado', async (req, res) => {
    const { idLlave } = req.params;
    
    let connection;
    
    try {
        connection = await mysql.createConnection(connectionConfig);
        await connection.beginTransaction();
        
        // 1. Obtener info de la llave
        const [llaveInfo] = await connection.execute(
            `SELECT * FROM llave_eliminacion WHERE id = ?`,
            [idLlave]
        );
        
        if (llaveInfo.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Enfrentamiento no encontrado' });
        }
        
        const llave = llaveInfo[0];
        
        // 2. Verificar que tenga resultado
        if (!llave.ganador_id) {
            await connection.rollback();
            return res.status(400).json({ error: 'No hay resultado para eliminar' });
        }
        
        const ganadorId = llave.ganador_id;
        
        // 3. Limpiar resultado de la llave actual
        await connection.execute(
            `UPDATE llave_eliminacion SET ganador_id = NULL WHERE id = ?`,
            [idLlave]
        );
        
        // 4. Limpiar resultado del partido
        if (llave.id_partido) {
            await connection.execute(
                `UPDATE partido SET 
                    estado = 'pendiente',
                    ganador_id = NULL,
                    sets_local = 0,
                    sets_visitante = 0,
                    games_local = 0,
                    games_visitante = 0,
                    tiebreak_local = NULL,
                    tiebreak_visitante = NULL
                 WHERE id = ?`,
                [llave.id_partido]
            );
            
            // 5. Eliminar detalle de sets
            await connection.execute(
                'DELETE FROM detalle_sets WHERE id_partido = ?',
                [llave.id_partido]
            );
        }
        
        // 6. Revertir ganador de la siguiente ronda
        await revertirGanadorEnLlave(connection, llave.id, llave.id_torneo, llave.categoria, llave.ronda, llave.posicion, ganadorId);
        
        await connection.commit();
        
        res.status(200).json({
            mensaje: 'Resultado eliminado correctamente'
        });
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al eliminar resultado en playoffs:', error);
        res.status(500).json({ error: 'Error al eliminar el resultado' });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================================
// FUNCIÓN: REVERTIR GANADOR DE LA LLAVE
// ==========================================================
async function revertirGanadorEnLlave(connection, idLlaveOrigen, idTorneo, categoria, rondaActual, posicionActual, ganadorId) {
    // Prioridad: usar tabla puente llave_avance (mapeo determinístico)
    try {
        const [mapeo] = await connection.execute(
            `SELECT la.slot_destino, ld.*
             FROM llave_avance la
             INNER JOIN llave_eliminacion ld ON ld.id = la.id_llave_destino
             WHERE la.id_llave_origen = ?
             LIMIT 1`,
            [idLlaveOrigen]
        );

        if (mapeo.length > 0) {
            const destino = mapeo[0];
            const campoInscripto = destino.slot_destino === 1 ? 'id_inscripto_1' : 'id_inscripto_2';
            const campoGrupo = destino.slot_destino === 1 ? 'id_grupo_1' : 'id_grupo_2';

            await connection.execute(
                `UPDATE llave_eliminacion
                 SET ${campoInscripto} = NULL, ${campoGrupo} = NULL, ganador_id = NULL
                 WHERE id = ?`,
                [destino.id]
            );

            if (destino.id_partido) {
                const campoPartido = destino.slot_destino === 1 ? 'id_inscriptoL' : 'id_inscriptoV';
                await connection.execute(
                    `UPDATE partido SET ${campoPartido} = NULL WHERE id = ?`,
                    [destino.id_partido]
                );
            }

            return;
        }
    } catch (errorMapeo) {
        console.warn('Fallback a lógica legacy en revertirGanadorEnLlave:', errorMapeo.message);
    }

    const progresionRondas = {
        'pre-playoff': { siguiente: null },
        'dieciseisavos': { siguiente: 'octavos' },
        'octavos': { siguiente: 'cuartos' },
        'cuartos': { siguiente: 'semifinal' },
        'semifinal': { siguiente: 'final' },
        'final': null
    };
    
    const progresion = progresionRondas[rondaActual];
    if (!progresion) return; // Es la final, no hay siguiente
    
    let siguienteRonda = progresion.siguiente;
    if (rondaActual === 'pre-playoff') {
        const orden = ['dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'final'];
        for (const r of orden) {
            const [existe] = await connection.execute(
                `SELECT COUNT(*) as total FROM llave_eliminacion WHERE id_torneo = ? AND categoria = ? AND ronda = ?`,
                [idTorneo, categoria, r]
            );
            if (existe[0].total > 0) {
                siguienteRonda = r;
                break;
            }
        }
        if (!siguienteRonda) return;
    }
    
    // Obtener cantidad de partidos en cada ronda para determinar el mapeo
    const [partidosRondaActual] = await connection.execute(
        `SELECT COUNT(*) as total FROM llave_eliminacion 
         WHERE id_torneo = ? AND categoria = ? AND ronda = ?`,
        [idTorneo, categoria, rondaActual]
    );
    
    const [partidosRondaSiguiente] = await connection.execute(
        `SELECT COUNT(*) as total FROM llave_eliminacion 
         WHERE id_torneo = ? AND categoria = ? AND ronda = ?`,
        [idTorneo, categoria, siguienteRonda]
    );
    
    // Calcular posición en siguiente ronda
    // REGLA: El bracket ya está generado correctamente (sin cruces de mismo grupo)
    // Solo necesitamos MAPEO DIRECTO POR POSICIÓN
    let siguientePosicion;
    
    // Mapeo específico para pre-playoffs → semifinales
    if (rondaActual === 'pre-playoff' && siguienteRonda === 'semifinal') {
        siguientePosicion = posicionActual; // Mapeo 1 a 1
    } else if (partidosRondaActual[0].total === partidosRondaSiguiente[0].total) {
        // Mapeo 1 a 1 para cualquier ronda con igual cantidad de partidos
        siguientePosicion = posicionActual;
    } else {
        // Lógica standard: cada 2 partidos van a 1
        siguientePosicion = Math.ceil(posicionActual / 2);
    }
    
    // Buscar el enfrentamiento en la siguiente ronda
    let [enfrentamientoSiguiente] = await connection.execute(
        `SELECT * FROM llave_eliminacion 
         WHERE id_torneo = ? AND categoria = ? AND ronda = ? AND posicion = ?`,
        [idTorneo, categoria, siguienteRonda, siguientePosicion]
    );
    
    if (enfrentamientoSiguiente.length > 0) {
        // Si hay múltiples enfrentamientos (duplicados), usar el primero y eliminar los demás
        if (enfrentamientoSiguiente.length > 1) {
            console.warn(`Encontrados ${enfrentamientoSiguiente.length} duplicados en ${siguienteRonda} pos ${siguientePosicion}. Usando el primero.`);
            for (let i = 1; i < enfrentamientoSiguiente.length; i++) {
                await connection.execute(
                    `DELETE FROM llave_eliminacion WHERE id = ?`,
                    [enfrentamientoSiguiente[i].id]
                );
            }
        }
        
        const enfrentamiento = enfrentamientoSiguiente[0];
        
        // LÓGICA CORREGIDA: Si al limpiar queda solo un BYE, mantener el BYE
        // Si el ganador está en id_inscripto_2 y id_inscripto_1 es un BYE → solo limpiar id_inscripto_2
        // Si el ganador está en id_inscripto_1 y id_inscripto_2 es un BYE → solo limpiar id_inscripto_1
        // En cualquier otro caso → limpiar normalmente
        
        if (enfrentamiento.id_inscripto_1 === ganadorId) {
            // Ganador está en posición 1
            const otroEsBye = enfrentamiento.id_inscripto_2 && enfrentamiento.es_bye === 1;
            if (otroEsBye) {
                // Mantener el BYE en posición 2, limpiar solo posición 1
                await connection.execute(
                    `UPDATE llave_eliminacion 
                     SET id_inscripto_1 = NULL, id_grupo_1 = NULL, ganador_id = NULL
                     WHERE id = ?`,
                    [enfrentamiento.id]
                );
            } else {
                // No hay BYE, limpiar normalmente
                await connection.execute(
                    `UPDATE llave_eliminacion 
                     SET id_inscripto_1 = NULL, id_grupo_1 = NULL, ganador_id = NULL
                     WHERE id = ?`,
                    [enfrentamiento.id]
                );
            }
        } else if (enfrentamiento.id_inscripto_2 === ganadorId) {
            // Ganador está en posición 2
            const otroEsBye = enfrentamiento.id_inscripto_1 && enfrentamiento.es_bye === 1;
            if (otroEsBye) {
                // Mantener el BYE en posición 1, limpiar solo posición 2
                await connection.execute(
                    `UPDATE llave_eliminacion 
                     SET id_inscripto_2 = NULL, id_grupo_2 = NULL, ganador_id = NULL
                     WHERE id = ?`,
                    [enfrentamiento.id]
                );
            } else {
                // No hay BYE, limpiar normalmente
                await connection.execute(
                    `UPDATE llave_eliminacion 
                     SET id_inscripto_2 = NULL, id_grupo_2 = NULL, ganador_id = NULL
                     WHERE id = ?`,
                    [enfrentamiento.id]
                );
            }
        }
        
        // Si tiene partido asociado, también limpiarlo
        if (enfrentamiento.id_partido) {
            await connection.execute(
                `UPDATE partido SET 
                    id_inscriptoL = CASE WHEN id_inscriptoL = ? THEN NULL ELSE id_inscriptoL END,
                    id_inscriptoV = CASE WHEN id_inscriptoV = ? THEN NULL ELSE id_inscriptoV END
                 WHERE id = ?`,
                [ganadorId, ganadorId, enfrentamiento.id_partido]
            );
        }
    }
}

// ==========================================================
// FUNCIÓN: AVANZAR GANADOR EN LA LLAVE
// ==========================================================
async function avanzarGanadorEnLlave(connection, idLlaveOrigen, idTorneo, categoria, rondaActual, posicionActual, ganadorId) {
    // Prioridad: usar tabla puente llave_avance (mapeo determinístico)
    try {
        const [mapeo] = await connection.execute(
            `SELECT la.slot_destino, ld.*
             FROM llave_avance la
             INNER JOIN llave_eliminacion ld ON ld.id = la.id_llave_destino
             WHERE la.id_llave_origen = ?
             LIMIT 1`,
            [idLlaveOrigen]
        );

        if (mapeo.length > 0) {
            const destino = mapeo[0];
            const campoInscripto = destino.slot_destino === 1 ? 'id_inscripto_1' : 'id_inscripto_2';
            const campoGrupo = destino.slot_destino === 1 ? 'id_grupo_1' : 'id_grupo_2';

            const [ganadorInfo] = await connection.execute(
                `SELECT id_grupo FROM grupo_integrantes WHERE id_inscripto = ? LIMIT 1`,
                [ganadorId]
            );
            const idGrupoGanador = ganadorInfo.length > 0 ? ganadorInfo[0].id_grupo : null;

            await connection.execute(
                `UPDATE llave_eliminacion
                 SET ${campoInscripto} = ?, ${campoGrupo} = ?
                 WHERE id = ?`,
                [ganadorId, idGrupoGanador, destino.id]
            );

            if (destino.id_partido) {
                const campoPartido = destino.slot_destino === 1 ? 'id_inscriptoL' : 'id_inscriptoV';
                await connection.execute(
                    `UPDATE partido SET ${campoPartido} = ? WHERE id = ?`,
                    [ganadorId, destino.id_partido]
                );
            }

            return;
        }
    } catch (errorMapeo) {
        console.warn('Fallback a lógica legacy en avanzarGanadorEnLlave:', errorMapeo.message);
    }

    // Mapeo de rondas para cualquier estructura
    const progresionRondas = {
        'pre-playoff': { siguiente: null },
        'dieciseisavos': { siguiente: 'octavos' },
        'octavos': { siguiente: 'cuartos' },
        'cuartos': { siguiente: 'semifinal' },
        'semifinal': { siguiente: 'final' },
        'final': null
    };
    
    const progresion = progresionRondas[rondaActual];
    if (!progresion) return; // Es la final, no hay siguiente
    
    let siguienteRonda = progresion.siguiente;
    if (rondaActual === 'pre-playoff') {
        const orden = ['dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'final'];
        for (const r of orden) {
            const [existe] = await connection.execute(
                `SELECT COUNT(*) as total FROM llave_eliminacion WHERE id_torneo = ? AND categoria = ? AND ronda = ?`,
                [idTorneo, categoria, r]
            );
            if (existe[0].total > 0) {
                siguienteRonda = r;
                break;
            }
        }
        if (!siguienteRonda) return;
    }
    
    // Obtener cantidad de partidos en cada ronda para determinar el mapeo
    const [partidosRondaActual] = await connection.execute(
        `SELECT COUNT(*) as total FROM llave_eliminacion 
         WHERE id_torneo = ? AND categoria = ? AND ronda = ?`,
        [idTorneo, categoria, rondaActual]
    );
    
    const [partidosRondaSiguiente] = await connection.execute(
        `SELECT COUNT(*) as total FROM llave_eliminacion 
         WHERE id_torneo = ? AND categoria = ? AND ronda = ?`,
        [idTorneo, categoria, siguienteRonda]
    );
    
    // Calcular posición en siguiente ronda
    // REGLA: El bracket ya está generado correctamente (sin cruces de mismo grupo)
    // Solo necesitamos MAPEO DIRECTO POR POSICIÓN
    let siguientePosicion;
    
    // Mapeo específico para pre-playoffs → semifinales
    // Pre-playoff #1 (posición 1) → Semifinal #1 (posición 1)
    // Pre-playoff #2 (posición 2) → Semifinal #2 (posición 2)
    if (rondaActual === 'pre-playoff' && siguienteRonda === 'semifinal') {
        siguientePosicion = posicionActual; // Mapeo 1 a 1
        console.log(`🎯 Ganador pre-playoff pos ${posicionActual} → Semifinal pos ${siguientePosicion}`);
    } else if (partidosRondaActual[0].total === partidosRondaSiguiente[0].total) {
        // Mapeo 1 a 1 para cualquier ronda con igual cantidad de partidos
        siguientePosicion = posicionActual;
    } else {
        // Lógica standard: cada 2 partidos van a 1
        siguientePosicion = Math.ceil(posicionActual / 2);
    }
    
    // Verificar si ya existe el enfrentamiento en la siguiente ronda
    // Usar SELECT FOR UPDATE para bloquear y evitar race conditions
    let [enfrentamientoSiguiente] = await connection.execute(
        `SELECT * FROM llave_eliminacion 
         WHERE id_torneo = ? AND categoria = ? AND ronda = ? AND posicion = ?
         FOR UPDATE`,
        [idTorneo, categoria, siguienteRonda, siguientePosicion]
    );
    
    if (enfrentamientoSiguiente.length === 0) {
        // Buscar más ampliamente por si hay diferencias de formato
        const [enfrentamientoAlternativo] = await connection.execute(
            `SELECT * FROM llave_eliminacion 
             WHERE id_torneo = ? AND LOWER(categoria) = LOWER(?) AND ronda = ? AND posicion = ?
             FOR UPDATE`,
            [idTorneo, categoria, siguienteRonda, siguientePosicion]
        );
        
        if (enfrentamientoAlternativo.length > 0) {
            // Usar el encontrado con búsqueda flexible
            enfrentamientoSiguiente = enfrentamientoAlternativo;
        } else {
            // ANTI-DUPLICADO: Buscar cualquier enfrentamiento en la siguiente ronda
            // Si ya existe uno (aunque sea diferente posición), NO crear otro
            const [cualquierEnfrentamiento] = await connection.execute(
                `SELECT id FROM llave_eliminacion 
                 WHERE id_torneo = ? AND categoria = ? AND ronda = ? 
                 FOR UPDATE LIMIT 1`,
                [idTorneo, categoria, siguienteRonda]
            );
            
            if (cualquierEnfrentamiento.length > 0) {
                // Ya existe un enfrentamiento en esta ronda, usar ese
                const [enfrentamientoExistente] = await connection.execute(
                    `SELECT * FROM llave_eliminacion WHERE id = ? FOR UPDATE`,
                    [cualquierEnfrentamiento[0].id]
                );
                enfrentamientoSiguiente = enfrentamientoExistente;
            } else {
                // Realmente no existe, crearlo
                const esPar = posicionActual % 2 === 0;
                const campo = esPar ? 'id_inscripto_2' : 'id_inscripto_1';
                
                await connection.execute(
                    `INSERT INTO llave_eliminacion 
                     (id_torneo, categoria, ronda, posicion, ${campo}, es_bye)
                     VALUES (?, ?, ?, ?, ?, FALSE)`,
                    [idTorneo, categoria, siguienteRonda, siguientePosicion, ganadorId]
                );
                return;
            }
        }
    }
    
    // Si hay múltiples enfrentamientos (duplicados), usar el primero y eliminar los demás
    if (enfrentamientoSiguiente.length > 1) {
        console.warn(`Encontrados ${enfrentamientoSiguiente.length} duplicados en ${siguienteRonda} pos ${siguientePosicion}. Usando el primero.`);
        // Eliminar duplicados (mantener solo el primero)
        for (let i = 1; i < enfrentamientoSiguiente.length; i++) {
            await connection.execute(
                `DELETE FROM llave_eliminacion WHERE id = ?`,
                [enfrentamientoSiguiente[i].id]
            );
        }
    }
    
    // Actualizar enfrentamiento existente
    const enfrentamiento = enfrentamientoSiguiente[0];
    
    // DEBUGGING: Log del estado del enfrentamiento
    console.log(`🔍 DEBUG - Enfrentamiento encontrado:`, {
        id: enfrentamiento.id,
        ronda: enfrentamiento.ronda,
        posicion: enfrentamiento.posicion,
        id_inscripto_1: enfrentamiento.id_inscripto_1,
        id_inscripto_2: enfrentamiento.id_inscripto_2,
        ganadorIdQueLlega: ganadorId
    });
    
    // LÓGICA CORREGIDA: Completar el enfrentamiento, no pisar
    // Si id_inscripto_1 tiene un jugador (BYE o normal) y id_inscripto_2 está vacío → ganador a id_inscripto_2
    // Si id_inscripto_1 está vacío → ganador a id_inscripto_1
    // Si ambos están ocupados, determinar según paridad (para reemplazo o edición)
    let campo, campoGrupo;
    
    if (enfrentamiento.id_inscripto_1 && !enfrentamiento.id_inscripto_2) {
        // Hay alguien en posición 1 (BYE o ganador previo), completar posición 2
        campo = 'id_inscripto_2';
        campoGrupo = 'id_grupo_2';
        console.log(`✅ DEBUG - Posición 1 ocupada, completando posición 2`);
    } else if (!enfrentamiento.id_inscripto_1) {
        // Posición 1 vacía, poner ganador ahí
        campo = 'id_inscripto_1';
        campoGrupo = 'id_grupo_1';
        console.log(`✅ DEBUG - Posición 1 vacía, colocando en posición 1`);
    } else {
        // Ambos ocupados - usar lógica de paridad para reemplazo/edición
        const esPar = posicionActual % 2 === 0;
        campo = esPar ? 'id_inscripto_2' : 'id_inscripto_1';
        campoGrupo = esPar ? 'id_grupo_2' : 'id_grupo_1';
        console.log(`⚠️ DEBUG - Ambas posiciones ocupadas, usando lógica de paridad`);
    }
    
    // Obtener grupo del ganador
    const [ganadorInfo] = await connection.execute(
        `SELECT id_grupo FROM grupo_integrantes WHERE id_inscripto = ? LIMIT 1`,
        [ganadorId]
    );
    
    console.log(`📝 DEBUG - Actualizando: ${campo} = ${ganadorId} en enfrentamiento ${enfrentamiento.id}`);
    
    await connection.execute(
        `UPDATE llave_eliminacion 
         SET ${campo} = ?, ${campoGrupo} = ?
         WHERE id = ?`,
        [ganadorId, ganadorInfo.length > 0 ? ganadorInfo[0].id_grupo : null, enfrentamiento.id]
    );
    
    console.log(`✅ DEBUG - Actualización completada`);
}

// ==========================================================
// ENDPOINT: GESTIONAR HORARIOS PLAYOFFS (CRUD)
// ==========================================================
app.get('/api/horarios-playoffs/:idTorneo', async (req, res) => {
    const { idTorneo } = req.params;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [horarios] = await connection.execute(
            `SELECT * FROM horarios 
             WHERE id_torneo_fk = ? AND es_playoff = TRUE
             ORDER BY fecha, hora_inicio`,
            [idTorneo]
        );
        await connection.end();
        
        res.status(200).json(horarios);
    } catch (error) {
        console.error('Error al obtener horarios playoffs:', error);
        res.status(500).json({ error: 'Error al obtener los horarios' });
    }
});

app.post('/api/horarios-playoffs/:idTorneo', async (req, res) => {
    const { idTorneo } = req.params;
    const { dia_semana, fecha, hora_inicio, lugar } = req.body;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [result] = await connection.execute(
            `INSERT INTO horarios (id_torneo_fk, dia_semana, fecha, hora_inicio, lugar, es_playoff, activo)
             VALUES (?, ?, ?, ?, ?, TRUE, TRUE)`,
            [idTorneo, dia_semana, fecha, hora_inicio, lugar]
        );
        await connection.end();
        
        res.status(200).json({
            mensaje: 'Horario creado exitosamente',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error al crear horario playoffs:', error);
        res.status(500).json({ error: 'Error al crear el horario' });
    }
});

app.delete('/api/horarios-playoffs/:idHorario', async (req, res) => {
    const { idHorario } = req.params;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        await connection.execute(
            `DELETE FROM horarios WHERE id = ? AND es_playoff = TRUE`,
            [idHorario]
        );
        await connection.end();
        
        res.status(200).json({ mensaje: 'Horario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar horario:', error);
        res.status(500).json({ error: 'Error al eliminar el horario' });
    }
});

// ==========================================================
// SECCIÓN DE AUTENTICACIÓN
// ==========================================================

const JWT_SECRET = process.env.JWT_SECRET || 'torneos-secret-key-2024';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No autorizado', mensaje: 'Debes iniciar sesión' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido', mensaje: 'Sesión expirada' });
    }
}

// Middleware para verificar si es admin
function adminMiddleware(req, res, next) {
    if (req.usuario.tipo_usuario !== 1) {
        return res.status(403).json({ error: 'Acceso denegado', mensaje: 'Solo administradores' });
    }
    next();
}

// ==========================================================
// ENDPOINT: LOGIN
// ==========================================================
app.post('/api/auth/login', async (req, res) => {
    const { nombre, pass } = req.body;
    
    if (!nombre || !pass) {
        return res.status(400).json({ error: 'Nombre y contraseña requeridos' });
    }
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        const [usuarios] = await connection.execute(
            'SELECT * FROM usuario WHERE nombre = ? AND activo = 1',
            [nombre]
        );
        
        await connection.end();
        
        if (usuarios.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        
        const usuario = usuarios[0];
        
        // Verificar si es primera vez (pass vacío o NULL)
        if (!usuario.pass || usuario.pass === '') {
            return res.status(200).json({
                primera_vez: true,
                nombre: usuario.nombre,
                mensaje: 'Debes establecer una contraseña'
            });
        }
        
        // Verificar contraseña
        const validPassword = await bcrypt.compare(pass, usuario.pass);
        if (!validPassword) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                id: usuario.id, 
                nombre: usuario.nombre, 
                tipo_usuario: usuario.tipousuario 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(200).json({
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                tipo_usuario: usuario.tipousuario
            },
            mensaje: 'Login exitoso'
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// ==========================================================
// ENDPOINT: ESTABLECER CONTRASEÑA (Primera vez o reset)
// ==========================================================
app.post('/api/auth/establecer-password', async (req, res) => {
    const { nombre, pass_nueva, pass_confirmar } = req.body;
    
    if (!nombre || !pass_nueva || !pass_confirmar) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    if (pass_nueva !== pass_confirmar) {
        return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }
    
    if (pass_nueva.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Verificar que el usuario existe
        const [usuarios] = await connection.execute(
            'SELECT * FROM usuario WHERE nombre = ? AND activo = 1',
            [nombre]
        );
        
        if (usuarios.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Encriptar nueva contraseña
        const hashedPassword = await bcrypt.hash(pass_nueva, 10);
        
        // Actualizar en BD
        await connection.execute(
            'UPDATE usuario SET pass = ? WHERE nombre = ?',
            [hashedPassword, nombre]
        );
        
        await connection.end();
        
        res.status(200).json({ mensaje: 'Contraseña establecida correctamente' });
        
    } catch (error) {
        console.error('Error al establecer contraseña:', error);
        res.status(500).json({ error: 'Error al guardar la contraseña' });
    }
});

// ==========================================================
// ENDPOINT: RESETEAR CONTRASEÑA (Solo admin)
// ==========================================================
app.post('/api/auth/reset-password', authMiddleware, adminMiddleware, async (req, res) => {
    const { nombre } = req.body;
    
    if (!nombre) {
        return res.status(400).json({ error: 'Nombre de usuario requerido' });
    }
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Verificar que el usuario existe
        const [usuarios] = await connection.execute(
            'SELECT * FROM usuario WHERE nombre = ?',
            [nombre]
        );
        
        if (usuarios.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Resetear contraseña (establecer como vacía)
        await connection.execute(
            'UPDATE usuario SET pass = NULL WHERE nombre = ?',
            [nombre]
        );
        
        await connection.end();
        
        res.status(200).json({ 
            mensaje: `Contraseña de ${nombre} reseteada. Deberá establecer una nueva al iniciar sesión.` 
        });
        
    } catch (error) {
        console.error('Error al resetear contraseña:', error);
        res.status(500).json({ error: 'Error al resetear la contraseña' });
    }
});

// ==========================================================
// ENDPOINT: LISTAR USUARIOS (Para el modal de reset)
// ==========================================================
app.get('/api/usuarios', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        const [usuarios] = await connection.execute(
            'SELECT id, nombre, tipousuario, activo FROM usuario WHERE activo = 1 ORDER BY nombre'
        );
        
        await connection.end();
        
        res.status(200).json({ usuarios });
        
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// ==========================================================
// ENDPOINT: VERIFICAR TOKEN
// ==========================================================
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    res.status(200).json({ usuario: req.usuario });
});

// ==========================================================
// ENDPOINT: VERIFICAR SI HAY GRUPOS GENERADOS
// ==========================================================
app.get('/api/verificar-grupos', authMiddleware, async (req, res) => {
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Obtener torneo activo
        const [torneo] = await connection.execute(
            'SELECT id FROM torneos WHERE activo_inscripcion = 1 ORDER BY id DESC LIMIT 1'
        );
        
        if (torneo.length === 0) {
            await connection.end();
            return res.status(200).json({ hayGrupos: false, mensaje: 'No hay torneo activo' });
        }
        
        // Verificar si hay grupos generados
        const [grupos] = await connection.execute(
            'SELECT COUNT(*) as cantidad FROM grupos WHERE id_torneo_fk = ?',
            [torneo[0].id]
        );
        
        await connection.end();
        
        res.status(200).json({ 
            hayGrupos: grupos[0].cantidad > 0,
            cantidad: grupos[0].cantidad
        });
        
    } catch (error) {
        console.error('Error al verificar grupos:', error);
        res.status(500).json({ error: 'Error al verificar grupos' });
    }
});

// 5. Puerto de escucha
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

// ==========================================================
// ENDPOINTS PARA GESTIÓN DE HORARIOS
// ==========================================================


// GET: Listar horarios de un torneo (versión admin con validaciones)
app.get("/api/horarios-admin/:idTorneo", authMiddleware, async (req, res) => {
    const { idTorneo } = req.params;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Obtener todos los horarios del torneo
        const [rows] = await connection.execute(
            `SELECT id, dia_semana, 
                    DATE_FORMAT(fecha, '%Y-%m-%d') as fecha, 
                    hora_inicio, 
                    Canchas, 
                    lugar, 
                    activo, 
                    es_playoff 
             FROM horarios 
             WHERE id_torneo_fk = ? AND activo = 1 AND es_playoff = 0
             ORDER BY fecha, hora_inicio`,
            [idTorneo]
        );
        
        // Verificar si cada horario puede ser eliminado (no está en uso)
        const horarios = await Promise.all(rows.map(async (h) => {
            // Verificar si está en inscriptos_horarios
            const [inscriptos] = await connection.execute(
                'SELECT COUNT(*) as count FROM inscriptos_horarios WHERE id_horario_fk = ?',
                [h.id]
            );
            
            // Verificar si está en partido
            const [partidos] = await connection.execute(
                'SELECT COUNT(*) as count FROM partido WHERE id_horario = ?',
                [h.id]
            );
            
            // Construir objeto con todos los campos explícitamente
            return {
                id: h.id,
                dia_semana: h.dia_semana,
                fecha: h.fecha,
                hora_inicio: h.hora_inicio,
                Canchas: h.Canchas,
                lugar: h.lugar,
                activo: h.activo,
                es_playoff: h.es_playoff,
                puede_eliminar: inscriptos[0].count === 0 && partidos[0].count === 0
            };
        }));
        
        await connection.end();
        res.status(200).json(horarios);
        
    } catch (error) {
        console.error('Error al obtener horarios:', error);
        res.status(500).json({ error: 'Error al obtener horarios: ' + error.message });
    }
});

// POST: Crear nuevo horario
app.post('/api/horarios', authMiddleware, async (req, res) => {
    const { id_torneo_fk, dia_semana, fecha, hora_inicio, Canchas, lugar } = req.body;
    
    if (!id_torneo_fk || !fecha || !hora_inicio || !Canchas) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Insertar nuevo horario
        const [result] = await connection.execute(
            `INSERT INTO horarios (id_torneo_fk, dia_semana, fecha, hora_inicio, Canchas, activo, es_playoff, lugar) 
             VALUES (?, ?, ?, ?, ?, 1, 0, ?)`,
            [id_torneo_fk, dia_semana, fecha, hora_inicio, Canchas, lugar || 'Aeroclub']
        );
        
        await connection.end();
        
        res.status(201).json({ 
            id: result.insertId, 
            mensaje: 'Horario creado correctamente' 
        });
        
    } catch (error) {
        console.error('Error al crear horario:', error);
        res.status(500).json({ error: 'Error al crear horario: ' + error.message });
    }
});

// DELETE: Eliminar horario (solo si no está en uso)
app.delete('/api/horarios/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Verificar si está en uso en inscriptos_horarios
        const [inscriptos] = await connection.execute(
            'SELECT COUNT(*) as count FROM inscriptos_horarios WHERE id_horario_fk = ?',
            [id]
        );
        
        if (inscriptos[0].count > 0) {
            await connection.end();
            return res.status(400).json({ 
                error: 'No se puede eliminar: el horario está asignado a inscriptos' 
            });
        }
        
        // Verificar si está en uso en partido
        const [partidos] = await connection.execute(
            'SELECT COUNT(*) as count FROM partido WHERE id_horario = ?',
            [id]
        );
        
        if (partidos[0].count > 0) {
            await connection.end();
            return res.status(400).json({ 
                error: 'No se puede eliminar: el horario está asignado a partidos' 
            });
        }
        
        // Eliminar horario (o marcar como inactivo)
        await connection.execute(
            'DELETE FROM horarios WHERE id = ?',
            [id]
        );
        
        await connection.end();
        res.status(200).json({ mensaje: 'Horario eliminado correctamente' });
        
    } catch (error) {
        console.error('Error al eliminar horario:', error);
        res.status(500).json({ error: 'Error al eliminar horario' });
    }
});

// ==================== ENDPOINTS DE ADMINISTRACIÓN ====================

// GET: Listar todos los torneos
app.get('/api/admin/torneos', authMiddleware, async (req, res) => {
    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [torneos] = await connection.execute(
            'SELECT id, codigo_torneo, nombre, fecha_inicio, fecha_fin, activo_inscripcion FROM torneos ORDER BY id DESC'
        );
        await connection.end();
        res.json(torneos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Listar todos los inscriptos con todos los campos
app.get('/api/admin/inscriptos', authMiddleware, async (req, res) => {
    const { id_torneo, categoria } = req.query;
    
    if (!id_torneo) {
        return res.status(400).json({ error: 'Se requiere el ID del torneo.' });
    }
    
    let sql = 'SELECT id, integrantes, correo, telefono, categoria, id_torneo_fk FROM inscriptos WHERE id_torneo_fk = ?';
    const params = [id_torneo];
    
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
        res.status(500).json({ error: 'Error al obtener inscriptos.' });
    }
});

// GET: Obtener un inscripto con todos los datos
app.get('/api/admin/inscriptos/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [rows] = await connection.execute(
            'SELECT id, integrantes, correo, telefono, categoria FROM inscriptos WHERE id = ?',
            [id]
        );
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Inscripto no encontrado' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener inscripto:', error);
        res.status(500).json({ error: 'Error al obtener inscripto' });
    }
});

// PUT: Editar inscripto
app.put('/api/admin/inscriptos/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { integrantes, correo, telefono, categoria } = req.body;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        await connection.execute(
            'UPDATE inscriptos SET integrantes = ?, correo = ?, telefono = ?, categoria = ? WHERE id = ?',
            [integrantes, correo, telefono, categoria, id]
        );
        
        await connection.end();
        res.status(200).json({ mensaje: 'Inscripto actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar inscripto:', error);
        res.status(500).json({ error: 'Error al actualizar inscripto' });
    }
});

// PUT: Actualizar horarios de inscripto
app.put('/api/admin/inscriptos/:id/horarios', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { horarios } = req.body;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Eliminar horarios actuales
        await connection.execute('DELETE FROM inscriptos_horarios WHERE id_inscripto_fk = ?', [id]);
        
        // Insertar nuevos horarios
        if (horarios && horarios.length > 0) {
            for (const idHorario of horarios) {
                await connection.execute(
                    'INSERT INTO inscriptos_horarios (id_inscripto_fk, id_horario_fk) VALUES (?, ?)',
                    [id, idHorario]
                );
            }
        }
        
        await connection.end();
        res.status(200).json({ mensaje: 'Horarios actualizados correctamente' });
    } catch (error) {
        console.error('Error al actualizar horarios:', error);
        res.status(500).json({ error: 'Error al actualizar horarios' });
    }
});

// POST: Crear grupo
app.post('/api/admin/grupos/crear', authMiddleware, async (req, res) => {
    const { id_torneo, numero_grupo, cantidad_integrantes, categoria } = req.body;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Verificar si ya existe un grupo con mismo número y categoría
        const [existente] = await connection.execute(
            'SELECT id FROM grupos WHERE id_torneo_fk = ? AND numero_grupo = ? AND categoria = ?',
            [id_torneo, numero_grupo, categoria]
        );
        
        if (existente.length > 0) {
            await connection.end();
            return res.status(400).json({ error: 'Ya existe un grupo con ese número en esta categoría' });
        }
        
        await connection.execute(
            'INSERT INTO grupos (id_torneo_fk, numero_grupo, cantidad_integrantes, categoria, estado) VALUES (?, ?, ?, ?, ?)',
            [id_torneo, numero_grupo, cantidad_integrantes, categoria, 'pendiente']
        );
        
        await connection.end();
        res.status(201).json({ mensaje: 'Grupo creado correctamente' });
    } catch (error) {
        console.error('Error al crear grupo:', error);
        res.status(500).json({ error: 'Error al crear grupo' });
    }
});

// GET: Obtener detalles de un grupo con integrantes (con IDs)
app.get('/api/admin/grupos/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        const [grupo] = await connection.execute(
            'SELECT id, numero_grupo, cantidad_integrantes, categoria, estado FROM grupos WHERE id = ?',
            [id]
        );
        
        if (grupo.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }
        
        const [integrantes] = await connection.execute(
            `SELECT gi.id_inscripto, i.integrantes 
             FROM grupo_integrantes gi 
             JOIN inscriptos i ON gi.id_inscripto = i.id 
             WHERE gi.id_grupo = ?`,
            [id]
        );
        
        await connection.end();
        
        res.json({
            ...grupo[0],
            integrantes: integrantes
        });
    } catch (error) {
        console.error('Error al obtener grupo:', error);
        res.status(500).json({ error: 'Error al obtener grupo' });
    }
});

// PUT: Editar grupo
app.put('/api/admin/grupos/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { numero_grupo, cantidad_integrantes } = req.body;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        await connection.execute(
            'UPDATE grupos SET numero_grupo = ?, cantidad_integrantes = ? WHERE id = ?',
            [numero_grupo, cantidad_integrantes, id]
        );
        
        await connection.end();
        res.status(200).json({ mensaje: 'Grupo actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar grupo:', error);
        res.status(500).json({ error: 'Error al actualizar grupo' });
    }
});

// DELETE: Eliminar grupo
app.delete('/api/admin/grupos/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Verificar si tiene integrantes
        const [integrantes] = await connection.execute(
            'SELECT COUNT(*) as count FROM grupo_integrantes WHERE id_grupo = ?',
            [id]
        );
        
        if (integrantes[0].count > 0) {
            await connection.end();
            return res.status(400).json({ error: 'No se puede eliminar: el grupo tiene integrantes. Quítelos primero.' });
        }
        
        await connection.execute('DELETE FROM grupos WHERE id = ?', [id]);
        
        await connection.end();
        res.status(200).json({ mensaje: 'Grupo eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar grupo:', error);
        res.status(500).json({ error: 'Error al eliminar grupo' });
    }
});

// POST: Agregar integrante a grupo
app.post('/api/admin/grupos/:id/integrante', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { id_inscripto } = req.body;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Verificar si ya está en el grupo
        const [existente] = await connection.execute(
            'SELECT id FROM grupo_integrantes WHERE id_grupo = ? AND id_inscripto = ?',
            [id, id_inscripto]
        );
        
        if (existente.length > 0) {
            await connection.end();
            return res.status(400).json({ error: 'El participante ya está en este grupo' });
        }
        
        // Verificar si está en otro grupo del mismo torneo y categoría
        const [grupo] = await connection.execute('SELECT id_torneo_fk, categoria FROM grupos WHERE id = ?', [id]);
        if (grupo.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }
        
        const [enOtro] = await connection.execute(`
            SELECT gi.id FROM grupo_integrantes gi
            JOIN grupos g ON gi.id_grupo = g.id
            WHERE gi.id_inscripto = ? AND g.id_torneo_fk = ? AND g.categoria = ? AND g.id != ?
        `, [id_inscripto, grupo[0].id_torneo_fk, grupo[0].categoria, id]);
        
        if (enOtro.length > 0) {
            await connection.end();
            return res.status(400).json({ error: 'El participante ya está en otro grupo de esta categoría' });
        }
        
        await connection.execute(
            'INSERT INTO grupo_integrantes (id_grupo, id_inscripto) VALUES (?, ?)',
            [id, id_inscripto]
        );
        
        await connection.end();
        res.status(201).json({ mensaje: 'Integrante agregado correctamente' });
    } catch (error) {
        console.error('Error al agregar integrante:', error);
        res.status(500).json({ error: 'Error al agregar integrante' });
    }
});

// DELETE: Quitar integrante de grupo
app.delete('/api/admin/grupos/:id/integrante/:idInscripto', authMiddleware, async (req, res) => {
    const { id, idInscripto } = req.params;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Verificar si tiene partidos jugados
        const [partidos] = await connection.execute(`
            SELECT id FROM partido 
            WHERE (id_inscriptoL = ? OR id_inscriptov = ?) 
            AND estado != 'pendiente'
        `, [idInscripto, idInscripto]);
        
        if (partidos.length > 0) {
            await connection.end();
            return res.status(400).json({ error: 'No puede quitarse: el participante tiene partidos jugados' });
        }
        
        await connection.execute(
            'DELETE FROM grupo_integrantes WHERE id_grupo = ? AND id_inscripto = ?',
            [id, idInscripto]
        );
        
        await connection.end();
        res.status(200).json({ mensaje: 'Integrante eliminado del grupo' });
    } catch (error) {
        console.error('Error al quitar integrante:', error);
        res.status(500).json({ error: 'Error al quitar integrante' });
    }
});

// POST: Crear partido
app.post('/api/admin/partidos/crear', authMiddleware, async (req, res) => {
    const { id_torneo, id_inscriptoL, id_inscriptov, id_horario } = req.body;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        await connection.execute(
            'INSERT INTO partido (id_horario, id_inscriptoL, id_inscriptov, estado) VALUES (?, ?, ?, ?)',
            [id_horario || null, id_inscriptoL, id_inscriptov, 'pendiente']
        );
        
        await connection.end();
        res.status(201).json({ mensaje: 'Partido creado correctamente' });
    } catch (error) {
        console.error('Error al crear partido:', error);
        res.status(500).json({ error: 'Error al crear partido' });
    }
});

// PUT: Modificar rivales de partido
app.put('/api/admin/partidos/:id/rivales', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { id_inscriptoL, id_inscriptov } = req.body;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Verificar que el partido esté pendiente
        const [partido] = await connection.execute('SELECT estado FROM partido WHERE id = ?', [id]);
        
        if (partido.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Partido no encontrado' });
        }
        
        if (partido[0].estado !== 'pendiente') {
            await connection.end();
            return res.status(400).json({ error: 'Solo se pueden editar partidos pendientes' });
        }
        
        await connection.execute(
            'UPDATE partido SET id_inscriptoL = ?, id_inscriptov = ? WHERE id = ?',
            [id_inscriptoL, id_inscriptov, id]
        );
        
        await connection.end();
        res.status(200).json({ mensaje: 'Partido actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar partido:', error);
        res.status(500).json({ error: 'Error al actualizar partido' });
    }
});

// DELETE: Eliminar partido
app.delete('/api/admin/partidos/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        // Verificar que el partido esté pendiente
        const [partido] = await connection.execute('SELECT estado FROM partido WHERE id = ?', [id]);
        
        if (partido.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Partido no encontrado' });
        }
        
        if (partido[0].estado !== 'pendiente') {
            await connection.end();
            return res.status(400).json({ error: 'Solo se pueden eliminar partidos pendientes' });
        }
        
        await connection.execute('DELETE FROM partido WHERE id = ?', [id]);
        
        await connection.end();
        res.status(200).json({ mensaje: 'Partido eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar partido:', error);
        res.status(500).json({ error: 'Error al eliminar partido' });
    }
});

// PUT: Modificar rivales en llave
app.put('/api/admin/llave/:id/rivales', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { id_inscripto_1, id_inscripto_2 } = req.body;
    
    try {
        const connection = await mysql.createConnection(connectionConfig);
        
        await connection.execute(
            'UPDATE llave_eliminacion SET id_inscripto_1 = ?, id_inscripto_2 = ? WHERE id = ?',
            [id_inscripto_1, id_inscripto_2, id]
        );
        
        await connection.end();
        res.status(200).json({ mensaje: 'Llave actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar llave:', error);
        res.status(500).json({ error: 'Error al actualizar llave' });
    }
});

// ==========================================================
// ENDPOINTS: AGENDA DE PLAYOFFS (RESERVAS SIN RIVALES)
// ==========================================================

// GET público: agenda activa por torneo (y categoría opcional)
app.get('/api/agenda-playoffs/:idTorneo', async (req, res) => {
    const { idTorneo } = req.params;
    const { categoria } = req.query;

    try {
        const connection = await mysql.createConnection(connectionConfig);

        let sql = `
            SELECT
                a.id,
                a.id_torneo,
                a.id_horario,
                a.categoria,
                a.leyenda,
                a.activo,
                h.dia_semana,
                h.fecha,
                h.hora_inicio as horario,
                h.lugar,
                h.Canchas as cupo
            FROM agenda_playoffs a
            INNER JOIN horarios h ON h.id = a.id_horario
            WHERE a.id_torneo = ? AND a.activo = 1
        `;

        const params = [idTorneo];
        if (categoria) {
            sql += ' AND LOWER(a.categoria) = LOWER(?)';
            params.push(categoria);
        }

        sql += ' ORDER BY h.fecha, h.hora_inicio, a.id';

        const [rows] = await connection.execute(sql, params);
        await connection.end();

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener agenda de playoffs:', error);
        res.status(500).json({ error: 'Error al obtener agenda de playoffs' });
    }
});

// GET admin: agenda (activos e inactivos)
app.get('/api/admin/agenda-playoffs', authMiddleware, async (req, res) => {
    const { id_torneo, categoria } = req.query;

    if (!id_torneo) {
        return res.status(400).json({ error: 'Falta id_torneo' });
    }

    try {
        const connection = await mysql.createConnection(connectionConfig);

        let sql = `
            SELECT
                a.id,
                a.id_torneo,
                a.id_horario,
                a.categoria,
                a.leyenda,
                a.activo,
                h.dia_semana,
                h.fecha,
                h.hora_inicio,
                h.lugar
            FROM agenda_playoffs a
            LEFT JOIN horarios h ON h.id = a.id_horario
            WHERE a.id_torneo = ?
        `;
        const params = [id_torneo];

        if (categoria) {
            sql += ' AND LOWER(a.categoria) = LOWER(?)';
            params.push(categoria);
        }

        sql += ' ORDER BY h.fecha, h.hora_inicio, a.id';

        const [rows] = await connection.execute(sql, params);
        await connection.end();

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener agenda admin:', error);
        res.status(500).json({ error: 'Error al obtener agenda' });
    }
});

// POST admin: crear reserva de agenda
app.post('/api/admin/agenda-playoffs', authMiddleware, async (req, res) => {
    const { id_torneo, id_horario, categoria, leyenda, activo } = req.body;

    if (!id_torneo || !id_horario || !categoria || !leyenda) {
        return res.status(400).json({ error: 'Faltan campos requeridos (id_torneo, id_horario, categoria, leyenda)' });
    }

    try {
        const connection = await mysql.createConnection(connectionConfig);
        await connection.execute(
            `INSERT INTO agenda_playoffs (id_torneo, id_horario, categoria, leyenda, activo)
             VALUES (?, ?, ?, ?, ?)`,
            [id_torneo, id_horario, categoria, leyenda, activo === 0 ? 0 : 1]
        );
        await connection.end();

        res.status(201).json({ mensaje: 'Reserva de agenda creada correctamente' });
    } catch (error) {
        console.error('Error al crear agenda:', error);
        res.status(500).json({ error: 'Error al crear agenda' });
    }
});

// PUT admin: editar reserva de agenda
app.put('/api/admin/agenda-playoffs/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { id_horario, categoria, leyenda } = req.body;

    if (!id_horario || !categoria || !leyenda) {
        return res.status(400).json({ error: 'Faltan campos requeridos (id_horario, categoria, leyenda)' });
    }

    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [result] = await connection.execute(
            `UPDATE agenda_playoffs
             SET id_horario = ?, categoria = ?, leyenda = ?
             WHERE id = ?`,
            [id_horario, categoria, leyenda, id]
        );
        await connection.end();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        res.status(200).json({ mensaje: 'Reserva actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar agenda:', error);
        res.status(500).json({ error: 'Error al actualizar agenda' });
    }
});

// PUT admin: activar/anular reserva
app.put('/api/admin/agenda-playoffs/:id/activo', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;

    if (activo === undefined) {
        return res.status(400).json({ error: 'Falta el campo activo' });
    }

    try {
        const connection = await mysql.createConnection(connectionConfig);
        const [result] = await connection.execute(
            `UPDATE agenda_playoffs SET activo = ? WHERE id = ?`,
            [activo ? 1 : 0, id]
        );
        await connection.end();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        res.status(200).json({ mensaje: 'Estado actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar estado agenda:', error);
        res.status(500).json({ error: 'Error al actualizar estado agenda' });
    }
});
