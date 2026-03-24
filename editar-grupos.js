document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'https://academia-torneos.onrender.com/api';
    const token = localStorage.getItem('token');
    
    // Headers comunes para llamadas autenticadas
    const getHeaders = () => ({
        'Authorization': `Bearer ${token}`
    });
    
    const postHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });
    
    // Elementos del DOM
    const infoTorneo = document.getElementById('info-torneo');
    const gruposContainer = document.getElementById('grupos-container');
    const partidosContainer = document.getElementById('partidos-container');
    const partidosPendientesSection = document.getElementById('partidos-pendientes-section');
    const partidosPendientesContainer = document.getElementById('partidos-pendientes-container');
    const btnVolver = document.getElementById('btn-volver');
    const btnActualizar = document.getElementById('btn-actualizar');
    const loadingOverlay = document.getElementById('loading-overlay');
    const notificationContainer = document.getElementById('notification-container');
    
    let torneoActivo = null;
    let gruposData = [];
    let partidosData = [];
    let inscriptosPorId = {};
    let horariosData = [];
    let horariosPorInscripto = {}; // Mapa de horarios por inscripto ID

    // Inicialización
    async function inicializar() {
        try {
            loadingOverlay.classList.remove('hidden');
            await cargarTorneoActivo();
            await cargarInscriptosConHorarios();
            await cargarHorarios();
            await cargarGruposYPartidos();
            mostrarGrupos();
            mostrarPartidos();
        } catch (error) {
            mostrarNotificacion('Error al cargar los datos: ' + error.message, 'error');
            console.error(error);
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    }

    // Helper function para formatear fechas a DD/MM/AA
    function formatearFecha(fecha) {
        if (!fecha) return '';
        // Remover T00:00:00.000Z si existe y convertir a DD/MM/AA
        const fechaLimpia = fecha.split('T')[0];
        const [year, month, day] = fechaLimpia.split('-');
        return `${day}/${month}/${year.slice(-2)}`; // DD/MM/AA
    }

    // Helper function para formatear hora sin segundos
    function formatearHora(hora) {
        if (!hora) return '--:--';
        // Si viene como "14:00:00", devolver "14:00"
        return hora.substring(0, 5);
    }

    function normalizarDia(valor) {
        if (!valor) return '';
        return String(valor)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function construirDiasOcupadosPorInscripto(partidos) {
        const ocupados = {};

        partidos.forEach(p => {
            // Solo cuenta partidos reales con horario asignado
            if (!p || p.es_agenda) return;
            if (!p.id_horario || !p.dia_semana) return;

            const dia = normalizarDia(p.dia_semana);
            if (!dia) return;

            [p.local_id, p.visitante_id].forEach(idInscripto => {
                if (!idInscripto) return;
                if (!ocupados[idInscripto]) ocupados[idInscripto] = new Set();
                ocupados[idInscripto].add(dia);
            });
        });

        return ocupados;
    }

    function formatearRondaCorta(ronda) {
        if (!ronda) return null;
        const map = {
            'agenda': 'AG',
            'pre-playoff': 'PP',
            'dieciseisavos': '16°',
            'octavos': '8°',
            'cuartos': '4°',
            'semifinal': 'SF',
            'final': 'F'
        };
        return map[ronda] || ronda;
    }

    // Cargar torneo activo
    async function cargarTorneoActivo() {
        const response = await fetch(`${API_BASE_URL}/torneo-activo`);
        if (!response.ok) throw new Error('No hay torneo activo');
        
        torneoActivo = await response.json();
        infoTorneo.innerHTML = `
            <div class="torneo-info">
                <h3>${torneoActivo.nombre}</h3>
                <p><strong>Código:</strong> ${torneoActivo.codigo_torneo}</p>
            </div>
        `;
    }

    // Cargar inscriptos con sus horarios disponibles
    async function cargarInscriptosConHorarios() {
        // 1. Cargar inscriptos básicos
        const response = await fetch(`${API_BASE_URL}/inscriptos?id_torneo_fk=${torneoActivo.id}`);
        if (!response.ok) throw new Error('No se pudieron cargar los inscriptos');
        
        const inscriptos = await response.json();
        inscriptosPorId = {};
        inscriptos.forEach(i => {
            inscriptosPorId[i.id] = i;
        });
        
        // 2. Cargar horarios para cada inscripto desde inscriptos_horarios
        horariosPorInscripto = {};
        const horariosPromises = inscriptos.map(async (inscripto) => {
            try {
                const response = await fetch(`${API_BASE_URL}/inscriptos/${inscripto.id}/horarios`);
                if (response.ok) {
                    const horarios = await response.json();
                    horariosPorInscripto[inscripto.id] = horarios;
                } else {
                    horariosPorInscripto[inscripto.id] = [];
                }
            } catch (error) {
                console.error(`Error cargando horarios para inscripto ${inscripto.id}:`, error);
                horariosPorInscripto[inscripto.id] = [];
            }
        });
        
        await Promise.all(horariosPromises);
    }

    // Cargar horarios disponibles
    async function cargarHorarios() {
        const response = await fetch(`${API_BASE_URL}/horarios/${torneoActivo.id}`);
        if (!response.ok) throw new Error('No se pudieron cargar los horarios');
        
        horariosData = await response.json();
    }

    // Cargar grupos y partidos guardados
    async function cargarGruposYPartidos() {
        // Cargar grupos
        const responseGrupos = await fetch(`${API_BASE_URL}/grupos/${torneoActivo.id}`);
        if (responseGrupos.ok) {
            gruposData = await responseGrupos.json();
        }
        
        // Cargar partidos
        const responsePartidos = await fetch(`${API_BASE_URL}/partidos/${torneoActivo.id}`);
        if (responsePartidos.ok) {
            partidosData = await responsePartidos.json();
        }

        const responseAgenda = await fetch(`${API_BASE_URL}/agenda-playoffs/${torneoActivo.id}`);
        if (responseAgenda.ok) {
            const agendaData = await responseAgenda.json();
            if (Array.isArray(agendaData)) {
                const agendaComoPartidos = agendaData.map(a => ({
                    id: `agenda-${a.id}`,
                    id_horario: a.id_horario,
                    ronda: 'agenda',
                    dia_semana: a.dia_semana,
                    fecha: a.fecha,
                    horario: a.horario,
                    local_id: null,
                    local_nombre: a.leyenda,
                    visitante_id: null,
                    visitante_nombre: a.leyenda,
                    categoria: a.categoria,
                    estado: 'pendiente',
                    es_agenda: true
                }));
                partidosData = [...partidosData, ...agendaComoPartidos];
            }
        }
    }

    // Mostrar grupos con integrantes
    function mostrarGrupos() {
        if (gruposData.length === 0) {
            gruposContainer.innerHTML = '<p>No hay grupos guardados para este torneo.</p>';
            return;
        }

        let html = '<div class="grupos-list">';
        
        for (const grupo of gruposData) {
            const integrantes = grupo.integrantes ? grupo.integrantes.split(' | ') : [];
            
            html += `
                <div class="grupo-card">
                    <h3>Grupo ${grupo.numero_grupo} - ${grupo.categoria}</h3>
                    <p class="integrantes-count">${integrantes.length} integrantes</p>
                    <ul class="integrantes-list">
                        ${integrantes.map(nombre => `<li>${nombre}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        html += '</div>';
        gruposContainer.innerHTML = html;
    }

    // Mostrar partidos agrupados por fecha
    function mostrarPartidos() {
        if (partidosData.length === 0) {
            partidosContainer.innerHTML = '<p>No hay partidos guardados para este torneo.</p>';
            return;
        }

        const diasOcupadosPorInscripto = construirDiasOcupadosPorInscripto(partidosData);

        // Separar partidos con y sin horario
        const partidosConHorario = partidosData.filter(p => p.id_horario !== null);
        const partidosSinHorario = partidosData.filter(p => p.id_horario === null);
        
        let html = '<div class="partidos-por-fecha">';
        
        // 1. Mostrar partidos con horario agrupados por fecha
        if (partidosConHorario.length > 0) {
            // Agrupar por fecha
            const partidosPorFecha = {};
            partidosConHorario.forEach(partido => {
                const fechaKey = partido.fecha || 'Sin fecha';
                if (!partidosPorFecha[fechaKey]) {
                    partidosPorFecha[fechaKey] = {
                        dia: partido.dia_semana,
                        fecha: fechaKey,
                        partidos: []
                    };
                }
                partidosPorFecha[fechaKey].partidos.push(partido);
            });
            
            // Ordenar fechas
            const fechasOrdenadas = Object.keys(partidosPorFecha).sort();
            
            // Mostrar cada fecha con sus partidos
            fechasOrdenadas.forEach(fechaKey => {
                const grupo = partidosPorFecha[fechaKey];
                const fechaFormateada = formatearFecha(grupo.fecha);
                
                html += `
                    <div class="fecha-grupo">
                        <div class="fecha-encabezado">
                            <span class="fecha-dia">${grupo.dia}</span>
                            <span class="fecha-fecha">${fechaFormateada}</span>
                        </div>
                        <div class="partidos-list">
                `;
                
                // Ordenar partidos por horario
                grupo.partidos.sort((a, b) => {
                    return (a.horario || '').localeCompare(b.horario || '');
                });
                
                grupo.partidos.forEach(partido => {
                    const local = partido.local_nombre || `ID ${partido.local_id}`;
                    const visitante = partido.visitante_nombre || `ID ${partido.visitante_id}`;
                    const categoria = partido.categoria || 'Sin cat';
                    const fase = formatearRondaCorta(partido.ronda);
                    const hora = formatearHora(partido.horario);
                    const partidoId = partido.id;
                    const esAgenda = !!partido.es_agenda;
                    
                    html += `
                        <div class="partido-item" data-partido-id="${partidoId}">
                            <div class="partido-hora">${hora}</div>
                            <div class="partido-match">
                                <span class="partido-local">${local}</span>
                                <span class="partido-vs">VS</span>
                                <span class="partido-visitante">${visitante}</span>
                            </div>
                            <div class="partido-meta">
                                <div class="partido-categoria">${categoria}</div>
                                ${fase ? `<div class="partido-fase">${fase}</div>` : ''}
                            </div>
                            ${esAgenda ? '<span class="btn-agenda-info" style="background:#95a5a6; color:white; border:none; padding:8px; border-radius:6px; font-size:1rem; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">📌</span>' : `<button class="btn-editar-horario" data-partido-id="${partidoId}">✏️</button>`}
                        </div>
                    `;
                });
                
                html += '</div></div>';
            });
        }
        
        // 2. Mostrar partidos sin horario al final
        if (partidosSinHorario.length > 0) {
            html += `
                <div class="fecha-grupo sin-horario">
                    <div class="fecha-encabezado">
                        <span class="fecha-dia">⏳</span>
                        <span class="fecha-fecha">Partidos sin horario asignado</span>
                    </div>
                    <div class="partidos-list">
            `;
            
            partidosSinHorario.forEach(partido => {
                const local = partido.local_nombre || `ID ${partido.local_id}`;
                const visitante = partido.visitante_nombre || `ID ${partido.visitante_id}`;
                const categoria = partido.categoria || 'Sin categoría';
                const fase = formatearRondaCorta(partido.ronda);
                const localId = partido.local_id;
                const visitanteId = partido.visitante_id;
                const partidoId = partido.id;
                const esAgenda = !!partido.es_agenda;
                
                html += `
                    <div class="partido-item partido-sin-horario" data-partido-id="${partidoId}">
                        <div class="partido-hora horario-pendiente">--:--</div>
                        <div class="partido-match">
                            <span class="partido-local">${local}</span>
                            <span class="partido-vs">VS</span>
                            <span class="partido-visitante">${visitante}</span>
                        </div>
                        <div class="partido-meta">
                            <div class="partido-categoria">${categoria}</div>
                            ${fase ? `<div class="partido-fase">${fase}</div>` : ''}
                        </div>
                        ${esAgenda ? '<span class="btn-agenda-info" style="background:#95a5a6; color:white; border:none; width:auto; padding:8px 10px; border-radius:6px;">📌 Agenda</span>' : `<button class="btn-editar-horario" data-partido-id="${partidoId}">✏️ Asignar</button>`}
                    </div>
                `;
                
                // Mostrar horarios disponibles
                const horariosLocal = (horariosPorInscripto[localId] || []).filter(h => {
                    const dia = normalizarDia(h.dia_semana);
                    return !diasOcupadosPorInscripto[localId] || !diasOcupadosPorInscripto[localId].has(dia);
                });
                const horariosVisitante = (horariosPorInscripto[visitanteId] || []).filter(h => {
                    const dia = normalizarDia(h.dia_semana);
                    return !diasOcupadosPorInscripto[visitanteId] || !diasOcupadosPorInscripto[visitanteId].has(dia);
                });
                
                const horariosLocalText = horariosLocal.length > 0 
                    ? horariosLocal.map(h => `${h.dia_semana} ${h.hora_inicio}`).join(', ')
                    : 'Sin horarios registrados';
                    
                const horariosVisitanteText = horariosVisitante.length > 0 
                    ? horariosVisitante.map(h => `${h.dia_semana} ${h.hora_inicio}`).join(', ')
                    : 'Sin horarios registrados';
                
                if (!esAgenda) {
                    html += `
                        <div class="horarios-disponibles">
                            <div class="horarios-jugador">
                                <strong>${local}:</strong> ${horariosLocalText}
                            </div>
                            <div class="horarios-jugador">
                                <strong>${visitante}:</strong> ${horariosVisitanteText}
                            </div>
                        </div>
                    `;
                }
            });
            
            html += '</div></div>';
        }
        
        html += '</div>';
        partidosContainer.innerHTML = html;
        
        // Agregar event listeners a los botones de editar
        document.querySelectorAll('.btn-editar-horario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const partidoId = e.target.dataset.partidoId;
                mostrarSelectorHorario(partidoId);
            });
        });
    }

    // Mostrar selector de horario para editar
    function mostrarSelectorHorario(partidoId) {
        const partido = partidosData.find(p => p.id == partidoId);
        if (!partido) return;

        // Encontrar el elemento del partido
        const partidoItem = document.querySelector(`.partido-item[data-partido-id="${partidoId}"]`);
        if (!partidoItem) return;

        // Crear modal o dropdown para seleccionar horario
        let opcionesHorarios = horariosData.map(h => 
            `<option value="${h.id}" ${h.id == partido.id_horario ? 'selected' : ''}>${h.dia_semana} ${formatearFecha(h.fecha) || ''} - ${h.hora_inicio}</option>`
        ).join('');

        // Agregar opción "Sin horario" al principio si el partido ya tiene horario
        const opcionSinHorario = partido.id_horario ? 
            `<option value="SIN_HORARIO">⏳ Sin horario asignado</option>` : '';

        const selectorHtml = `
            <div class="selector-horario-modal" id="modal-${partidoId}">
                <select id="select-horario-${partidoId}" class="select-horario">
                    <option value="">Seleccionar horario...</option>
                    ${opcionSinHorario}
                    ${opcionesHorarios}
                </select>
                <button class="btn-guardar-horario" data-partido-id="${partidoId}">💾 Guardar</button>
                <button class="btn-cancelar-horario" data-partido-id="${partidoId}">❌ Cancelar</button>
            </div>
        `;

        // Reemplazar el botón de editar con el selector
        const btnEditar = partidoItem.querySelector('.btn-editar-horario');
        if (btnEditar) {
            btnEditar.style.display = 'none';
            partidoItem.insertAdjacentHTML('beforeend', selectorHtml);
        }

        // Agregar event listeners
        document.querySelector(`#modal-${partidoId} .btn-guardar-horario`).addEventListener('click', async (e) => {
            const nuevoHorarioId = document.querySelector(`#select-horario-${partidoId}`).value;
            
            if (nuevoHorarioId === 'SIN_HORARIO') {
                // Quitar el horario del partido
                if (confirm('¿Estás seguro de que querés quitar el horario de este partido?')) {
                    await actualizarHorarioPartido(partidoId, null);
                }
            } else if (nuevoHorarioId) {
                // Cambiar a un horario específico
                await actualizarHorarioPartido(partidoId, nuevoHorarioId);
            }
        });

        document.querySelector(`#modal-${partidoId} .btn-cancelar-horario`).addEventListener('click', () => {
            mostrarPartidos(); // Recargar para cancelar
        });
    }

    // Actualizar horario de un partido
    async function actualizarHorarioPartido(partidoId, nuevoHorarioId) {
        try {
            loadingOverlay.classList.remove('hidden');
            
            const response = await fetch(`${API_BASE_URL}/partidos/${partidoId}`, {
                method: 'PUT',
                headers: postHeaders(),
                body: JSON.stringify({
                    id_horario: nuevoHorarioId
                })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar horario');
            }

            mostrarNotificacion('Horario actualizado exitosamente', 'success');
            
            // Recargar datos
            await cargarGruposYPartidos();
            mostrarPartidos();
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al actualizar horario: ' + error.message, 'error');
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    }

    // Función de notificación
    function mostrarNotificacion(mensaje, tipo = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${tipo}`;
        notification.textContent = mensaje;
        
        notificationContainer.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Event listeners
    btnVolver.addEventListener('click', () => {
        window.location.href = 'grupos.html';
    });

    btnActualizar.addEventListener('click', async () => {
        mostrarNotificacion('Recargando datos...', 'info');
        await cargarGruposYPartidos();
        mostrarPartidos();
        mostrarNotificacion('Datos actualizados', 'success');
    });

    // Iniciar la aplicación
    inicializar();
});
