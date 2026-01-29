document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'https://academia-torneos.onrender.com/api';
    
    // Elementos del DOM
    const infoTorneo = document.getElementById('info-torneo');
    const categoriasContainer = document.getElementById('categorias-container');
    const categoriasConfig = document.getElementById('categorias-config');
    const gruposContainer = document.getElementById('grupos-container');
    const btnArmarGrupos = document.getElementById('btn-armar-grupos');
    const btnGuardarGrupos = document.getElementById('btn-guardar-grupos');
    const btnReiniciar = document.getElementById('btn-reiniciar');
    const loadingOverlay = document.getElementById('loading-overlay');
    const notificationContainer = document.getElementById('notification-container');
    const gruposFormadosSection = document.getElementById('grupos-formados');
    

    let torneoActivo = null;
    let inscriptosPorCategoria = {};
    let configuracionGrupos = {};
    let gruposGenerados = [];

    // Inicialización
    async function inicializar() {
        try {
            await cargarTorneoActivo();
            await cargarInscriptosPorCategoria();
            mostrarConfiguracionGrupos();
        } catch (error) {
            mostrarNotificacion('Error al cargar los datos iniciales: ' + error.message, 'error');
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

    // Cargar inscriptos agrupados por categoría
    async function cargarInscriptosPorCategoria() {
        const response = await fetch(`${API_BASE_URL}/inscriptos?id_torneo_fk=${torneoActivo.id}`);
        if (!response.ok) throw new Error('No se pudieron cargar los inscriptos');
        
        const inscriptos = await response.json();
        
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
        categoriasContainer.innerHTML = html;
    }

    // Mostrar configuración de grupos
    function mostrarConfiguracionGrupos() {
        let html = '';
        
        for (const [categoria, inscriptos] of Object.entries(inscriptosPorCategoria)) {
            html += `
                <div class="categoria-config">
                    <h3>${categoria}: ${inscriptos.length} inscriptos</h3>
                    <p>¿Cómo querés distribuir los ${inscriptos.length} inscriptos?</p>
                    <div class="grupos-config-grid">
                        <div class="grupo-input">
                            <label>Grupos de 3:</label>
                            <input type="number" id="grupos3_${categoria}" min="0" max="${Math.floor(inscriptos.length / 3)}" value="0">
                        </div>
                        <div class="grupo-input">
                            <label>Grupos de 4:</label>
                            <input type="number" id="grupos4_${categoria}" min="0" max="${Math.floor(inscriptos.length / 4)}" value="0">
                        </div>
                        <div class="grupo-input">
                            <label>Grupos de 5:</label>
                            <input type="number" id="grupos5_${categoria}" min="0" max="${Math.floor(inscriptos.length / 5)}" value="0">
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

    // Validar configuración de grupos
    function validarConfiguracion(categoria) {
        const totalInscriptos = inscriptosPorCategoria[categoria].length;
        const grupos3 = parseInt(document.getElementById(`grupos3_${categoria}`).value) || 0;
        const grupos4 = parseInt(document.getElementById(`grupos4_${categoria}`).value) || 0;
        const grupos5 = parseInt(document.getElementById(`grupos5_${categoria}`).value) || 0;
        
        const totalUsados = (grupos3 * 3) + (grupos4 * 4) + (grupos5 * 5);
        
        document.getElementById(`usados_${categoria}`).textContent = totalUsados;
        
        // Verificar si la configuración es válida
        const isValid = totalUsados === totalInscriptos && (grupos3 + grupos4 + grupos5 > 0);
        
        if (isValid) {
            configuracionGrupos[categoria] = { grupos3, grupos4, grupos5 };
        } else {
            delete configuracionGrupos[categoria];
        }
        
        // Habilitar botón si todas las categorías tienen configuración válida
        const todasValidas = Object.keys(inscriptosPorCategoria).every(cat => configuracionGrupos[cat]);
        btnArmarGrupos.disabled = !todasValidas;
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
    btnArmarGrupos.addEventListener('click', async () => {
    loadingOverlay.classList.remove('hidden');
    btnArmarGrupos.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/armar-grupos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                configuracionGrupos: configuracionGrupos,
                idTorneo: torneoActivo.id
            })
        });

        if (!response.ok) {
            throw new Error('Error al armar grupos');
        }

        const result = await response.json();
        gruposGenerados = result.grupos;
        
        mostrarGruposFormados();
        mostrarNotificacion('Grupos generados exitosamente', 'success');
        
    } catch (error) {
        mostrarNotificacion('Error: ' + error.message, 'error');
    } finally {
        loadingOverlay.classList.add('hidden');
        btnArmarGrupos.disabled = false;
    }
});


    btnReiniciar.addEventListener('click', () => {
        location.reload();
    });

    // Iniciar la aplicación
    inicializar();
});
function mostrarGruposFormados() {
    console.log('mostrarGruposFormados llamado');
    console.log('gruposGenerados:', gruposGenerados);
    
    const section = document.getElementById('grupos-formados');
    console.log('section:', section);
    
    if (!section) {
        console.error('No se encontró el elemento grupos-formados');
        return;
    }
    
    section.classList.remove('hidden');
    
    let html = '<div class="grupos-list">';
    
    for (const grupo of gruposGenerados) {
        html += `
            <div class="grupo-card">
                <h3>Grupo ${grupo.numero} - ${grupo.categoria}</h3>
                <p class="integrantes-count">${grupo.cantidad} integrantes</p>
                <ul class="integrantes-list">
                    ${grupo.integrantes.map(i => `<li>${i.integrantes}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    html += '</div>';
    gruposContainer.innerHTML = html;
    btnGuardarGrupos.disabled = false;
}

