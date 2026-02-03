document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'https://academia-torneos.onrender.com/api';
    
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
                    const categoria = partido.categoria || 'Sin categoría';
                    const hora = partido.horario || '';
                    const partidoId = partido.id;
                    
                    html += `
                        <div class="partido-item" data-partido-id="${partidoId}">
                            <div class="partido-hora">${hora}</div>
                            <div class="partido-match">
                                <span class="partido-local">${local}</span>
                                <span class="partido-vs">VS</span>
                                <span class="partido-visitante">${visitante}</span>
                            </div>
                            <div class="partido-categoria">${categoria}</div>
                            <button class="btn-editar-horario" data-partido-id="${partidoId}">✏️ Editar</button>
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
                const localId = partido.local_id;
                const visitanteId = partido.visitante_id;
                const partidoId = partido.id;
                
                html += `
                    <div class="partido-item partido-sin-horario" data-partido-id="${partidoId}">
                        <div class="partido-hora horario-pendiente">--:--</div>
                        <div class="partido-match">
                            <span class="partido-local">${local}</span>
                            <span class="partido-vs">VS</span>
                            <span class="partido-visitante">${visitante}</span>
                        </div>
                        <div class="partido-categoria">${categoria}</div>
                        <button class="btn-editar-horario" data-partido-id="${partidoId}">✏️ Asignar</button>
                    </div>
                `;
                
                // Mostrar horarios disponibles
                const horariosLocal = horariosPorInscripto[localId] || [];
                const horariosVisitante = horariosPorInscripto[visitanteId] || [];
                
                const horariosLocalText = horariosLocal.length > 0 
                    ? horariosLocal.map(h => `${h.dia_semana} ${h.hora_inicio}`).join(', ')
                    : 'Sin horarios registrados';
                    
                const horariosVisitanteText = horariosVisitante.length > 0 
                    ? horariosVisitante.map(h => `${h.dia_semana} ${h.hora_inicio}`).join(', ')
                    : 'Sin horarios registrados';
                
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

        const selectorHtml = `
            <div class="selector-horario-modal" id="modal-${partidoId}">
                <select id="select-horario-${partidoId}" class="select-horario">
                    <option value="">Seleccionar horario...</option>
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
            if (nuevoHorarioId) {
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
                headers: {
                    'Content-Type': 'application/json'
                },
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
