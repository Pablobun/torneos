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
    const categoriasConfig = document.getElementById('categorias-config');
    const gruposFormados = document.getElementById('grupos-formados');
    const gruposContainer = document.getElementById('grupos-container');
    const partidosContainer = document.getElementById('partidos-container');
    const sinGrupoContainer = document.getElementById('sin-grupo-container');
    const advertenciasContainer = document.getElementById('advertencias-container');
    const btnArmarGrupos = document.getElementById('btn-armar-grupos');
    const btnGuardarGrupos = document.getElementById('btn-guardar-grupos');
    const btnLimpiarTorneo = document.getElementById('btn-limpiar-torneo');
    const btnVolver = document.getElementById('btn-volver');
    const btnReiniciar = document.getElementById('btn-reiniciar');
    const loadingOverlay = document.getElementById('loading-overlay');
    const notificationContainer = document.getElementById('notification-container');
    const gruposFormadosSection = document.getElementById('grupos-formados');
    
    let torneoActivo = null;
    let inscriptosPorCategoria = {};
    let inscriptosPorId = {}; // Mapa para buscar por ID
    let configuracionGrupos = {};
    let gruposGenerados = [];
let partidosGenerados = [];
let sinGrupo = [];
let advertencias = [];
let torneoTieneGrupos = false;

    // Inicialización
async function inicializar() {
    try {
        await cargarTorneoActivo();
        await verificarGruposExistentes();
        await cargarInscriptosPorCategoria();
        
        // Solo mostrar configuración si hay inscriptos
        if (Object.keys(inscriptosPorCategoria).length > 0) {
            mostrarConfiguracionGrupos();
        } else {
            categoriasConfig.innerHTML = '<p>No hay inscriptos para este torneo.</p>';
        }
        
        actualizarEstadoBotones();
    } catch (error) {
        mostrarNotificacion('Error al cargar los datos iniciales: ' + error.message, 'error');
        console.error('Error detallado:', error);
    }
}

    // Cargar torneo activo
    async function cargarTorneoActivo() {
        const response = await fetch(`${API_BASE_URL}/torneo-activo`, { headers: getHeaders() });
        if (!response.ok) throw new Error('No hay torneo activo');
        
        torneoActivo = await response.json();
        infoTorneo.innerHTML = `
            <div class="torneo-info">
                <h3>${torneoActivo.nombre}</h3>
                <p><strong>Código:</strong> ${torneoActivo.codigo_torneo}</p>
            </div>
        `;
    }

    // Verificar si ya existen grupos para este torneo
    async function verificarGruposExistentes() {
        try {
            const response = await fetch(`${API_BASE_URL}/verificar-grupos/${torneoActivo.id}`);
            if (!response.ok) throw new Error('No se pudo verificar grupos existentes');
            
            const result = await response.json();
            torneoTieneGrupos = result.tieneGrupos;
        } catch (error) {
            console.error('Error verificando grupos:', error);
            torneoTieneGrupos = false;
        }
    }

    // Actualizar estado de botones según si hay grupos existentes
    function actualizarEstadoBotones() {
        if (torneoTieneGrupos) {
            btnArmarGrupos.disabled = true;
            btnArmarGrupos.textContent = 'Grupos Ya Generados';
            btnArmarGrupos.classList.remove('btn-primary');
            btnArmarGrupos.classList.add('btn-secondary');
            btnLimpiarTorneo.classList.remove('hidden');
        } else {
            btnArmarGrupos.disabled = true; // Se habilitará cuando haya configuración válida
            btnArmarGrupos.textContent = 'Armar Grupos';
            btnArmarGrupos.classList.remove('btn-secondary');
            btnArmarGrupos.classList.add('btn-primary');
            btnLimpiarTorneo.classList.add('hidden');
        }
    }

    // Cargar inscriptos agrupados por categoría
    async function cargarInscriptosPorCategoria() {
        const response = await fetch(`${API_BASE_URL}/inscriptos?id_torneo_fk=${torneoActivo.id}`);
        if (!response.ok) throw new Error('No se pudieron cargar los inscriptos');
        
        const inscriptos = await response.json();
        
        // Crear mapa por ID para búsqueda rápida
        inscriptosPorId = {};
        inscriptos.forEach(i => {
            inscriptosPorId[i.id] = i;
        });
        
        // Agrupar por categoría
        inscriptosPorCategoria = inscriptos.reduce((acc, inscripto) => {
            const categoria = inscripto.categoria;
            if (!acc[categoria]) {
                acc[categoria] = [];
            }
            acc[categoria].push(inscripto);
            return acc;
        }, {});

        // Mostrar resumen
        let html = '<div class="categorias-grid">';
        for (const [categoria, inscriptos] of Object.entries(inscriptosPorCategoria)) {
            html += `
                <div class="categoria-card">
                    <h3>${categoria}</h3>
                    <p class="contador">${inscriptos.length} inscriptos</p>
                </div>
            `;
        }
        html += '</div>';
        categoriasConfig.innerHTML = html;
    }

    // Mostrar configuración de grupos
    function mostrarConfiguracionGrupos() {
        // Validar que el elemento exista
        if (!categoriasConfig) {
            console.error('Error: El elemento categorias-config no existe en el DOM');
            return;
        }
        
        // Validar que haya inscriptos
        if (!inscriptosPorCategoria || Object.keys(inscriptosPorCategoria).length === 0) {
            categoriasConfig.innerHTML = '<p>No hay inscriptos para configurar.</p>';
            return;
        }
        
        let html = '';
        
        for (const [categoria, inscriptos] of Object.entries(inscriptosPorCategoria)) {
            html += `
                <div class="categoria-config">
                    <h3>${categoria}: ${inscriptos.length} inscriptos</h3>
                    <p>¿Cómo querés distribuir los ${inscriptos.length} inscriptos?</p>
                    <div class="grupos-config-grid">
                        <div class="grupo-input">
                            <label>Grupos de 3:</label>
                            <input type="number" id="grupos3_${categoria}" min="0" max="${Math.ceil(inscriptos.length / 3)}" value="0">
                        </div>
                        <div class="grupo-input">
                            <label>Grupos de 4:</label>
                            <input type="number" id="grupos4_${categoria}" min="0" max="${Math.ceil(inscriptos.length / 4)}" value="0">
                        </div>
                        <div class="grupo-input">
                            <label>Grupos de 5:</label>
                            <input type="number" id="grupos5_${categoria}" min="0" max="${Math.ceil(inscriptos.length / 5)}" value="0">
                        </div>
                        <div class="grupo-resumen">
                            <span class="total-usados">Requeridos: <span id="usados_${categoria}">0</span></span>
                            <span class="total-disponibles">Disponibles: ${inscriptos.length}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        categoriasConfig.innerHTML = html;
        
        // Agregar event listeners para validar en tiempo real
        for (const categoria of Object.keys(inscriptosPorCategoria)) {
            ['3', '4', '5'].forEach(tamano => {
                const input = document.getElementById(`grupos${tamano}_${categoria}`);
                input.addEventListener('input', () => validarConfiguracion(categoria));
            });
        }
    }

    // Validar configuración de grupos - AHORA PERMITE INCOMPLETOS
    function validarConfiguracion(categoria) {
        const totalInscriptos = inscriptosPorCategoria[categoria].length;
        const grupos3 = parseInt(document.getElementById(`grupos3_${categoria}`).value) || 0;
        const grupos4 = parseInt(document.getElementById(`grupos4_${categoria}`).value) || 0;
        const grupos5 = parseInt(document.getElementById(`grupos5_${categoria}`).value) || 0;
        
        const totalUsados = (grupos3 * 3) + (grupos4 * 4) + (grupos5 * 5);
        
        document.getElementById(`usados_${categoria}`).textContent = totalUsados;
        
        // AHORA: Permitir grupos incompletos (hasta 2 jugadores de margen)
        const isValid = totalUsados > 0 && totalUsados <= (totalInscriptos + 2) && (grupos3 + grupos4 + grupos5 > 0);
        
        if (isValid) {
            configuracionGrupos[categoria] = { grupos3, grupos4, grupos5 };
        } else {
            delete configuracionGrupos[categoria];
        }
        
        // Habilitar botón si todas las categorías tienen configuración válida Y no hay grupos existentes
        const todasValidas = Object.keys(inscriptosPorCategoria).every(cat => configuracionGrupos[cat]);
        btnArmarGrupos.disabled = !todasValidas || torneoTieneGrupos;
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

    // Mostrar grupos formados - CORREGIDO PARA MANEJAR IDs
    function mostrarGruposFormados() {
        console.log('mostrarGruposFormados llamado');
        console.log('gruposGenerados:', gruposGenerados);
        
        const section = document.getElementById('grupos-formados');
        
        if (!section) {
            console.error('No se encontró el elemento grupos-formados');
            return;
        }
        
        section.classList.remove('hidden');
        
        let html = '<div class="grupos-list">';
        
        // Mostrar grupos
        for (const grupo of gruposGenerados) {
            const cantidadReal = grupo.integrantes.length;
            const cantidadEsperada = grupo.cantidad || cantidadReal;
            const incompleto = cantidadReal < cantidadEsperada;
            
            html += `
                <div class="grupo-card ${incompleto ? 'grupo-incompleto' : ''}">
                    <h3>Grupo ${grupo.numero} - ${grupo.categoria}</h3>
                    <p class="integrantes-count">
                        ${cantidadReal} integrantes ${incompleto ? `(incompleto, falta ${cantidadEsperada - cantidadReal})` : ''}
                    </p>
                    <ul class="integrantes-list">
                        ${grupo.integrantes.map(id => {
                            const inscripto = inscriptosPorId[id];
                            return `<li>${inscripto ? inscripto.integrantes : 'ID ' + id}</li>`;
                        }).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Mostrar partidos
        if (partidosGenerados && partidosGenerados.length > 0) {
            html += '<h3 class="partidos-titulo">Partidos Programados</h3>';
            html += '<div class="partidos-list">';
            
            for (const partido of partidosGenerados) {
                // Usar nombre del backend si está disponible, sino buscar en el mapa
                const localNombre = partido.localNombre || (inscriptosPorId[partido.local] ? inscriptosPorId[partido.local].integrantes : 'ID ' + partido.local);
                const visitanteNombre = partido.visitanteNombre || (inscriptosPorId[partido.visitante] ? inscriptosPorId[partido.visitante].integrantes : 'ID ' + partido.visitante);
                
                // Mostrar fecha y hora real en lugar de ID
                let horarioAsignado;
                if (partido.horario && partido.horario.dia) {
                    horarioAsignado = `<span class="horario-asignado">${partido.horario.dia} - ${partido.horario.hora}</span>`;
                } else {
                    // Partido pendiente - mostrar horarios disponibles de cada jugador
                    horarioAsignado = '<span class="horario-pendiente-badge"><span class="icono-reloj">⏳</span> Horario pendiente</span>';
                }
                const clasePartido = partido.horario ? '' : 'partido-sin-horario';
                
                html += `
                    <div class="partido-item ${clasePartido}">
                        <div class="partido-info">
                            <div class="partido-equipos">
                                <span class="partido-local">${localNombre}</span>
                                <span class="partido-vs">VS</span>
                                <span class="partido-visitante">${visitanteNombre}</span>
                            </div>
                        </div>
                        <div class="partido-horario-container">
                            ${horarioAsignado}
                        </div>
                    </div>
                `;
                
                // Si es partido pendiente, mostrar horarios disponibles
                if (!partido.horario && (partido.horariosDisponiblesLocal || partido.horariosDisponiblesVisitante)) {
                    html += '<div class="horarios-disponibles-container">';
                    html += '<div class="horarios-jugador-item">';
                    html += `<span class="jugador-nombre">${localNombre}:</span> `;
                    if (partido.horariosDisponiblesLocal && partido.horariosDisponiblesLocal.length > 0) {
                        html += partido.horariosDisponiblesLocal.map(h => `${h.dia} ${h.hora}`).join(', ');
                    } else {
                        html += 'Sin horarios disponibles';
                    }
                    html += '</div>';
                    html += '<div class="horarios-jugador-item">';
                    html += `<span class="jugador-nombre">${visitanteNombre}:</span> `;
                    if (partido.horariosDisponiblesVisitante && partido.horariosDisponiblesVisitante.length > 0) {
                        html += partido.horariosDisponiblesVisitante.map(h => `${h.dia} ${h.hora}`).join(', ');
                    } else {
                        html += 'Sin horarios disponibles';
                    }
                    html += '</div>';
                    html += '</div>';
                }
            }
            
            html += '</div>';
        }
        
        // Mostrar advertencias de partidos sin horario
        if (advertencias && advertencias.length > 0) {
            html += '<div class="advertencias-section">';
            html += '<h3 class="advertencias-titulo">⚠️ Resumen de Partidos sin Horario Compatible</h3>';
            html += '<ul class="advertencias-list">';
            
            for (const adv of advertencias) {
                const local = inscriptosPorId[adv.local];
                const visitante = inscriptosPorId[adv.visitante];
                html += `<li><strong>${local ? local.integrantes : 'ID ' + adv.local} vs ${visitante ? visitante.integrantes : 'ID ' + adv.visitante}</strong>: ${adv.mensaje}</li>`;
            }
            
            html += '</ul>';
            html += '</div>';
        }
        
        // Mostrar inscriptos sin grupo
        if (sinGrupo && sinGrupo.length > 0) {
            html += '<div class="sin-grupo-section">';
            html += '<h3 class="sin-grupo-titulo">Inscriptos sin Grupo (problemas de horarios)</h3>';
            html += '<ul class="sin-grupo-list">';
            
            for (const id of sinGrupo) {
                const inscripto = inscriptosPorId[id];
                html += `<li>${inscripto ? inscripto.integrantes : 'ID ' + id}</li>`;
            }
            
            html += '</ul>';
            html += '<p class="sin-grupo-ayuda">Estos inscriptos no pudieron ser asignados a ningún grupo por incompatibilidad de horarios.</p>';
            html += '</div>';
        }
        
        html += '</div>';
        gruposContainer.innerHTML = html;
        btnGuardarGrupos.disabled = false;
    }

    // Event listeners
    btnArmarGrupos.addEventListener('click', async () => {
        // Verificar si ya existen grupos
        if (torneoTieneGrupos) {
            mostrarNotificacion('Este torneo ya tiene grupos generados. Para generar nuevos grupos, primero elimine los existentes.', 'error');
            return;
        }
        
        loadingOverlay.classList.remove('hidden');
        btnArmarGrupos.disabled = true;
        
        try {
            const response = await fetch(`${API_BASE_URL}/armar-grupos`, {
                method: 'POST',
                headers: postHeaders(),
                body: JSON.stringify({
                    configuracionGrupos: configuracionGrupos,
                    idTorneo: torneoActivo.id
                })
            });

            const responseText = await response.text();
            console.log('Response text:', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.error('Error parsing JSON:', e);
                throw new Error('Respuesta inválida del servidor');
            }
            
            // Verificar si el servidor devolvió un error
            if (!response.ok || result.error) {
                const errorMsg = result.error || 'Error desconocido del servidor';
                const errorDetails = result.details || '';
                throw new Error(`${errorMsg}${errorDetails ? ': ' + errorDetails : ''}`);
            }
            
            gruposGenerados = result.grupos || [];
            partidosGenerados = result.partidos || [];
            sinGrupo = result.sin_grupo || [];
            advertencias = result.advertencias || [];
            
            mostrarGruposFormados();
            
            let mensajeNotificacion = `Se generaron ${gruposGenerados.length} grupos.`;
            let tipoNotificacion = 'success';
            
            if (sinGrupo.length > 0) {
                mensajeNotificacion += ` ${sinGrupo.length} inscriptos no pudieron ser asignados.`;
                tipoNotificacion = 'warning';
            }
            
            if (advertencias.length > 0) {
                mensajeNotificacion += ` ${advertencias.length} partidos tienen problemas de horarios.`;
                tipoNotificacion = 'warning';
            }
            
            mostrarNotificacion(mensajeNotificacion, tipoNotificacion);
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error: ' + error.message, 'error');
        } finally {
            loadingOverlay.classList.add('hidden');
            btnArmarGrupos.disabled = false;
        }
    });

    // GUARDAR GRUPOS Y PARTIDOS
    btnGuardarGrupos.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de que querés guardar estos grupos y partidos? Esta acción no se puede deshacer.')) {
            return;
        }
        
        loadingOverlay.classList.remove('hidden');
        btnGuardarGrupos.disabled = true;
        
        try {
            const response = await fetch(`${API_BASE_URL}/guardar-grupos`, {
                method: 'POST',
                headers: postHeaders(),
                body: JSON.stringify({
                    grupos: gruposGenerados,
                    partidos: partidosGenerados,
                    idTorneo: torneoActivo.id
                })
            });

            if (!response.ok) {
                throw new Error('Error al guardar');
            }
            
            const result = await response.json();
            mostrarNotificacion(result.mensaje || 'Grupos y partidos guardados exitosamente', 'success');
            
            // Redirigir a la página de edición después de 2 segundos
            setTimeout(() => {
                window.location.href = 'editar-grupos.html';
            }, 2000);
            
        } catch (error) {
            console.error('Error al guardar:', error);
            mostrarNotificacion('Error al guardar: ' + error.message, 'error');
        } finally {
            loadingOverlay.classList.add('hidden');
            btnGuardarGrupos.disabled = false;
        }
    });

    btnReiniciar.addEventListener('click', () => {
        location.reload();
    });

    // Limpiar torneo
    btnLimpiarTorneo.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de que querés eliminar TODOS los grupos y partidos de este torneo? Esta acción no se puede deshacer.')) {
            return;
        }
        
        if (!confirm('ADVERTENCIA: Esta acción eliminará permanentemente todos los grupos y partidos generados. ¿Continuar de todas formas?')) {
            return;
        }
        
        loadingOverlay.classList.remove('hidden');
        btnLimpiarTorneo.disabled = true;
        
        try {
            const response = await fetch(`${API_BASE_URL}/limpiar-torneo/${torneoActivo.id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Error al limpiar el torneo');
            }
            
            const result = await response.json();
            mostrarNotificacion(result.mensaje || 'Torneo limpiado exitosamente', 'success');
            
            // Actualizar estado
            torneoTieneGrupos = false;
            
            // Limpiar datos generados
            gruposGenerados = [];
            partidosGenerados = [];
            sinGrupo = [];
            advertencias = [];
            
            // Recargar la página después de 2 segundos
            setTimeout(() => {
                location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error limpiando torneo:', error);
            mostrarNotificacion('Error al limpiar el torneo: ' + error.message, 'error');
        } finally {
            loadingOverlay.classList.add('hidden');
            btnLimpiarTorneo.disabled = false;
        }
    });

    // Iniciar la aplicación
    inicializar();
});