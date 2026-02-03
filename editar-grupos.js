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

    // Mostrar partidos (con información de horarios reales)
    function mostrarPartidos() {
        if (partidosData.length === 0) {
            partidosContainer.innerHTML = '<p>No hay partidos guardados para este torneo.</p>';
            return;
        }

        let html = '<div class="partidos-list">';
        
        for (const partido of partidosData) {
            const local = partido.local_nombre || `ID ${partido.local_id}`;
            const visitante = partido.visitante_nombre || `ID ${partido.visitante_id}`;
            const dia = partido.dia_semana || 'Día no especificado';
            const hora = partido.horario || 'Hora no especificada';
            const categoria = partido.categoria || 'Sin categoría';
            const grupo = partido.grupo || '-';
            
            html += `
                <div class="partido-item">
                    <div class="partido-info">
                        <span class="partido-local">${local}</span>
                        <span class="partido-vs">VS</span>
                        <span class="partido-visitante">${visitante}</span>
                    </div>
                    <div class="partido-detalles">
                        <span class="partido-categoria">${categoria} - Grupo ${grupo}</span>
                        <span class="partido-horario">${dia} - ${hora}</span>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        partidosContainer.innerHTML = html;
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
        mostrarNotificacion('Función de actualización en desarrollo', 'info');
    });

    // Iniciar la aplicación
    inicializar();
});
