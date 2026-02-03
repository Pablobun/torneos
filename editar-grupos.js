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

    // Inicialización
    async function inicializar() {
        try {
            loadingOverlay.classList.remove('hidden');
            await cargarTorneoActivo();
            await cargarInscriptos();
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

    // Cargar inscriptos para mostrar nombres
    async function cargarInscriptos() {
        const response = await fetch(`${API_BASE_URL}/inscriptos?id_torneo_fk=${torneoActivo.id}`);
        if (!response.ok) throw new Error('No se pudieron cargar los inscriptos');
        
        const inscriptos = await response.json();
        inscriptosPorId = {};
        inscriptos.forEach(i => {
            inscriptosPorId[i.id] = i;
        });
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

    // Mostrar partidos (con información de horarios reales y opción de edición)
    function mostrarPartidos() {
        if (partidosData.length === 0) {
            partidosContainer.innerHTML = '<p>No hay partidos guardados para este torneo.</p>';
            return;
        }

        let html = '<div class="partidos-list">';
        
        for (const partido of partidosData) {
            const local = partido.local_nombre || `ID ${partido.local_id}`;
            const visitante = partido.visitante_nombre || `ID ${partido.visitante_id}`;
            const dia = partido.dia_semana || '';
            const fecha = partido.fecha || '';
            const hora = partido.horario || '';
            const partidoId = partido.id;
            
            // Formatear fecha y hora
            let fechaHoraTexto = '';
            if (dia && fecha) {
                fechaHoraTexto = `${dia} ${fecha}`;
            } else if (dia) {
                fechaHoraTexto = dia;
            }
            if (hora) {
                fechaHoraTexto += fechaHoraTexto ? ` - ${hora}` : hora;
            }
            if (!fechaHoraTexto) {
                fechaHoraTexto = 'Horario no especificado';
            }
            
            html += `
                <div class="partido-item" data-partido-id="${partidoId}">
                    <div class="partido-info">
                        <span class="partido-local">${local}</span>
                        <span class="partido-vs">VS</span>
                        <span class="partido-visitante">${visitante}</span>
                    </div>
                    <div class="partido-detalles">
                        <span class="partido-horario" id="horario-${partidoId}">${fechaHoraTexto}</span>
                    </div>
                    <div class="partido-acciones">
                        <button class="btn-editar-horario" data-partido-id="${partidoId}">✏️ Editar Horario</button>
                    </div>
                </div>
            `;
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

        // Crear modal o dropdown para seleccionar horario
        let opcionesHorarios = horariosData.map(h => 
            `<option value="${h.id}" ${h.id == partido.id_horario ? 'selected' : ''}>${h.dia_semana} ${h.fecha || ''} - ${h.hora_inicio}</option>`
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

        const horarioSpan = document.getElementById(`horario-${partidoId}`);
        horarioSpan.innerHTML = selectorHtml;

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
