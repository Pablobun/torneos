document.addEventListener('DOMContentLoaded', function () {
    // URL base de nuestro backend en Render
    const API_BASE_URL = 'https://academia-torneos.onrender.com/api';
    
    // Variables globales
    let torneoActivo = null;
    let gruposData = [];
    let partidosData = [];
    let jugadoresData = [];
    let vistaActual = 'ambos'; // 'ambos', 'grupos', 'partidos'
    
    // Elementos del DOM
    const elementos = {
        infoTorneo: document.getElementById('info-torneo'),
        filtroCategoria: document.getElementById('filtro-categoria'),
        filtroJugador: document.getElementById('filtro-jugador'),
        jugadoresList: document.getElementById('jugadores-list'),
        btnLimpiarFiltros: document.getElementById('btn-limpiar-filtros'),
        toggleButtons: document.querySelectorAll('.toggle-btn'),
        loadingEstado: document.getElementById('loading-estado'),
        contenidoPrincipal: document.getElementById('contenido-principal'),
        mensajeEstado: document.getElementById('mensaje-estado'),
        gruposContainer: document.getElementById('grupos-container'),
        partidosContainer: document.getElementById('partidos-container')
    };
    
    // Helper functions para formatear fechas y horas
    function formatearFecha(fecha) {
        if (!fecha) return '';
        // Remover T00:00:00.000Z si existe y convertir a DD/MM/AA
        const fechaLimpia = fecha.split('T')[0];
        const [year, month, day] = fechaLimpia.split('-');
        return `${day}/${month}/${year.slice(-2)}`; // DD/MM/AA
    }
    
    function formatearHora(hora) {
        if (!hora) return '--:--';
        // Si viene como "14:00:00", devolver "14:00"
        return hora.substring(0, 5);
    }
    
    // 1. Inicialización y carga de datos
    async function inicializar() {
        try {
            mostrarLoading(true);
            
            // Cargar torneo activo
            const torneo = await fetchTorneoActivo();
            torneoActivo = torneo;
            
            // Actualizar información del torneo
            elementos.infoTorneo.innerHTML = `
                <div class="torneo-info">
                    <h3>${torneo.nombre}</h3>
                    <p><strong>Código:</strong> ${torneo.codigo_torneo}</p>
                </div>
            `;
            
            // Cargar grupos y partidos en paralelo
            const [grupos, partidos] = await Promise.all([
                fetchGrupos(torneo.id),
                fetchPartidos(torneo.id)
            ]);
            
            gruposData = grupos;
            partidosData = partidos;
            
            // Extraer y organizar jugadores
            jugadoresData = extraerJugadoresDeGrupos(grupos);
            
            // Poblar filtros
            poblarFiltroCategoria();
            poblarFiltroJugadores();
            
            // Renderizar vista inicial
            renderizarVista();
            
            mostrarLoading(false);
            
        } catch (error) {
            manejarError(error);
        }
    }
    
    // 2. Funciones de API
    async function fetchTorneoActivo() {
        const response = await fetch(`${API_BASE_URL}/torneo-activo`);
        if (!response.ok) throw new Error('No hay torneo activo');
        return await response.json();
    }
    
    async function fetchGrupos(idTorneo) {
        const response = await fetch(`${API_BASE_URL}/grupos/${idTorneo}`);
        if (!response.ok) throw new Error('Error al cargar grupos');
        return await response.json();
    }
    
    async function fetchPartidos(idTorneo) {
        const response = await fetch(`${API_BASE_URL}/partidos/${idTorneo}`);
        if (!response.ok) throw new Error('Error al cargar partidos');
        return await response.json();
    }
    
    // 3. Extracción de jugadores con ordenamiento por categoría
    function extraerJugadoresDeGrupos(grupos) {
        const jugadoresPorCategoria = {};
        
        grupos.forEach(grupo => {
            const categoria = grupo.categoria;
            if (!jugadoresPorCategoria[categoria]) {
                jugadoresPorCategoria[categoria] = [];
            }
            
            // Extraer jugadores del string "Nombre1 / Nombre2 | Nombre3 / Nombre4"
            const integrantes = grupo.integrantes.split(' | ');
            integrantes.forEach(integrante => {
                if (integrante && !jugadoresPorCategoria[categoria].includes(integrante)) {
                    jugadoresPorCategoria[categoria].push(integrante);
                }
            });
        });
        
        // Ordenar alfabéticamente dentro de cada categoría
        Object.keys(jugadoresPorCategoria).forEach(categoria => {
            jugadoresPorCategoria[categoria].sort((a, b) => a.localeCompare(b));
        });
        
        return jugadoresPorCategoria;
    }
    
    // 4. Poblar filtros
    function poblarFiltroCategoria() {
        // Extraer categorías únicas de los grupos
        const categorias = [...new Set(gruposData.map(g => g.categoria))];
        categorias.sort();
        
        let html = '<option value="">Todas las categorías</option>';
        categorias.forEach(categoria => {
            html += `<option value="${categoria}">${categoria}</option>`;
        });
        
        elementos.filtroCategoria.innerHTML = html;
    }
    
    function poblarFiltroJugadores() {
        let html = '';
        
        // Crear grupos por categoría
        Object.keys(jugadoresData).sort().forEach(categoria => {
            html += `<option value="" disabled style="font-weight: bold; color: #4CAF50;">${categoria}:</option>`;
            jugadoresData[categoria].forEach(jugador => {
                html += `<option value="${jugador}">${jugador}</option>`;
            });
        });
        
        elementos.jugadoresList.innerHTML = html;
    }
    
    // 5. Agrupación de partidos por categoría → fecha → hora
    function agruparPartidosParaVista(partidos) {
        const agrupados = {};
        
        // Primero agrupar por categoría
        partidos.forEach(partido => {
            const categoria = partido.categoria || 'Sin categoría';
            
            if (!agrupados[categoria]) {
                agrupados[categoria] = {
                    conHorario: [],
                    sinHorario: []
                };
            }
            
            // Separar por si tienen horario o no
            if (partido.id_horario && partido.fecha) {
                agrupados[categoria].conHorario.push(partido);
            } else {
                agrupados[categoria].sinHorario.push(partido);
            }
        });
        
        // Ordenar por fecha y hora dentro de cada categoría
        Object.keys(agrupados).forEach(categoria => {
            agrupados[categoria].conHorario.sort((a, b) => {
                const fechaA = new Date(`${a.fecha} ${a.horario || '00:00'}`);
                const fechaB = new Date(`${b.fecha} ${b.horario || '00:00'}`);
                return fechaA - fechaB;
            });
            
            agrupados[categoria].sinHorario.sort((a, b) => {
                const localA = a.local_nombre || '';
                const localB = b.local_nombre || '';
                return localA.localeCompare(localB);
            });
        });
        
        return agrupados;
    }
    
    // 6. Renderizado de vista según filtros
    function renderizarVista() {
        const categoriaFiltro = elementos.filtroCategoria.value;
        const jugadorFiltro = elementos.filtroJugador.value.toLowerCase().trim();
        
        // Aplicar filtros
        let gruposFiltrados = gruposData;
        let partidosFiltrados = partidosData;
        
        if (categoriaFiltro) {
            gruposFiltrados = gruposFiltrados.filter(g => g.categoria === categoriaFiltro);
            partidosFiltrados = partidosFiltrados.filter(p => p.categoria === categoriaFiltro);
        }
        
        if (jugadorFiltro) {
            gruposFiltrados = gruposFiltrados.filter(g => 
                g.integrantes.toLowerCase().includes(jugadorFiltro)
            );
            partidosFiltrados = partidosFiltrados.filter(p => 
                p.local_nombre.toLowerCase().includes(jugadorFiltro) || 
                p.visitante_nombre.toLowerCase().includes(jugadorFiltro)
            );
        }
        
        // Renderizar según vista actual
        const mostrarGrupos = vistaActual === 'ambos' || vistaActual === 'grupos';
        const mostrarPartidos = vistaActual === 'ambos' || vistaActual === 'partidos';
        
        document.getElementById('seccion-grupos').style.display = mostrarGrupos ? 'block' : 'none';
        document.getElementById('seccion-partidos').style.display = mostrarPartidos ? 'block' : 'none';
        
        if (mostrarGrupos) {
            renderizarGrupos(gruposFiltrados);
        }
        
        if (mostrarPartidos) {
            renderizarPartidos(partidosFiltrados);
        }
        
        // Mostrar mensaje si no hay resultados
        if (gruposFiltrados.length === 0 && partidosFiltrados.length === 0) {
            mostrarMensaje('No hay resultados con los filtros aplicados', 'warning');
        } else {
            ocultarMensaje();
        }
    }
    
    // 7. Renderizado de grupos
    function renderizarGrupos(grupos) {
        if (grupos.length === 0) {
            elementos.gruposContainer.innerHTML = '<p class="sin-resultados">No hay grupos con los filtros seleccionados.</p>';
            return;
        }
        
        let html = '<div class="grupos-grid">';
        
        grupos.forEach(grupo => {
            const integrantes = grupo.integrantes.split(' | ');
            
            html += `
                <div class="grupo-tarjeta">
                    <div class="grupo-header">
                        <h3>Grupo ${grupo.numero_grupo}</h3>
                        <span class="categoria-badge ${grupo.categoria.toLowerCase().replace(/[^a-z0-9]/g, '')}">${grupo.categoria}</span>
                    </div>
                    <div class="grupo-integrantes">
                        ${integrantes.map(integrante => `
                            <div class="integrante-item">${integrante}</div>
                        `).join('')}
                    </div>
                    <div class="grupo-footer">
                        <span class="integrantes-count">${integrantes.length} integrantes</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        elementos.gruposContainer.innerHTML = html;
    }
    
    // 8. Renderizado de partidos por categoría → fecha → hora
    function renderizarPartidos(partidos) {
        if (partidos.length === 0) {
            elementos.partidosContainer.innerHTML = '<p class="sin-resultados">No hay partidos con los filtros seleccionados.</p>';
            return;
        }
        
        const agrupados = agruparPartidosParaVista(partidos);
        
        let html = '<div class="partidos-por-categoria">';
        
        Object.keys(agrupados).sort().forEach(categoria => {
            const { conHorario, sinHorario } = agrupados[categoria];
            
            html += `
                <div class="categoria-seccion">
                    <div class="categoria-header">
                        <h3>🏆 ${categoria}</h3>
                        <span class="partidos-count">
                            ${conHorario.length + sinHorario.length} partidos
                        </span>
                    </div>
            `;
            
            // Renderizar partidos con horario agrupados por fecha
            const partidosPorFecha = {};
            conHorario.forEach(partido => {
                const fechaKey = partido.fecha;
                if (!partidosPorFecha[fechaKey]) {
                    partidosPorFecha[fechaKey] = {
                        dia: partido.dia_semana,
                        partidos: []
                    };
                }
                partidosPorFecha[fechaKey].partidos.push(partido);
            });
            
            // Ordenar y renderizar fechas
            Object.keys(partidosPorFecha).sort().forEach(fechaKey => {
                const grupoFecha = partidosPorFecha[fechaKey];
                const fechaFormateada = formatearFecha(fechaKey);
                
                html += `
                    <div class="fecha-seccion">
                        <div class="fecha-header">
                            <span class="fecha-dia">${grupoFecha.dia}</span>
                            <span class="fecha-fecha">${fechaFormateada}</span>
                        </div>
                        <div class="partidos-list">
                `;
                
                // Ordenar partidos por hora
                grupoFecha.partidos.sort((a, b) => {
                    return (a.horario || '').localeCompare(b.horario || '');
                });
                
                grupoFecha.partidos.forEach(partido => {
                    const horaFormateada = formatearHora(partido.horario);
                    html += `
                        <div class="partido-item">
                            <div class="partido-hora">${horaFormateada}</div>
                            <div class="partido-match">
                                <span class="partido-local">${partido.local_nombre}</span>
                                <span class="partido-vs">VS</span>
                                <span class="partido-visitante">${partido.visitante_nombre}</span>
                            </div>
                            <div class="partido-categoria">${partido.categoria}</div>
                        </div>
                    `;
                });
                
                html += '</div></div>';
            });
            
            // Renderizar partidos sin horario al final
            if (sinHorario.length > 0) {
                html += `
                    <div class="partidos-sin-horario">
                        <div class="sin-horario-header">
                            ⏳ Partidos sin horario asignado
                        </div>
                        <div class="partidos-list">
                `;
                
                sinHorario.forEach(partido => {
                    html += `
                        <div class="partido-item sin-horario-item">
                            <div class="partido-hora">--:--</div>
                            <div class="partido-match">
                                <span class="partido-local">${partido.local_nombre}</span>
                                <span class="partido-vs">VS</span>
                                <span class="partido-visitante">${partido.visitante_nombre}</span>
                            </div>
                            <div class="partido-categoria">${partido.categoria}</div>
                        </div>
                    `;
                });
                
                html += '</div></div>';
            }
            
            html += '</div>'; // cierre de categoria-seccion
        });
        
        html += '</div>'; // cierre de partidos-por-categoria
        elementos.partidosContainer.innerHTML = html;
    }
    
    // 9. Funciones de UI
    function mostrarLoading(mostrar) {
        if (mostrar) {
            elementos.loadingEstado.classList.remove('hidden');
            elementos.contenidoPrincipal.classList.add('hidden');
        } else {
            elementos.loadingEstado.classList.add('hidden');
            elementos.contenidoPrincipal.classList.remove('hidden');
        }
    }
    
    function mostrarMensaje(mensaje, tipo = 'info') {
        elementos.mensajeEstado.textContent = mensaje;
        elementos.mensajeEstado.className = `mensaje-estado ${tipo}`;
        elementos.mensajeEstado.classList.remove('hidden');
    }
    
    function ocultarMensaje() {
        elementos.mensajeEstado.classList.add('hidden');
    }
    
    function manejarError(error) {
        console.error('Error:', error);
        mostrarLoading(false);
        mostrarMensaje('Error al cargar los datos: ' + error.message, 'error');
    }
    
    // 10. Event Listeners
    // Evento para cambio de filtro de categoría
    elementos.filtroCategoria.addEventListener('change', renderizarVista);
    
    // Evento para cambio de filtro de jugador
    elementos.filtroJugador.addEventListener('input', renderizarVista);
    
    // Evento para limpiar filtros
    elementos.btnLimpiarFiltros.addEventListener('click', () => {
        elementos.filtroCategoria.value = '';
        elementos.filtroJugador.value = '';
        renderizarVista();
    });
    
    // Evento para toggle de vista
    elementos.toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover clase active de todos los botones
            elementos.toggleButtons.forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            btn.classList.add('active');
            // Actualizar vista actual y renderizar
            vistaActual = btn.dataset.vista;
            renderizarVista();
        });
    });
    
    // 11. Iniciar la aplicación
    inicializar();
});