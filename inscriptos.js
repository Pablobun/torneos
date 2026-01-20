document.addEventListener('DOMContentLoaded', () => {
    // URL base de nuestro backend en Render
    const API_URL_BASE = 'https://academia-torneos.onrender.com/api';

    const filtroCategoria = document.getElementById('filtro-categoria');
    const tablaBody = document.querySelector('#tabla-inscriptos tbody');
    const loadingMessage = document.getElementById('loading-message');
    
    let idTorneoActivo = null; // Variable para guardar el ID del torneo actual

    // Función principal que se ejecuta al cargar la página
    async function inicializarPagina() {
        try {
            // 1. Primero, buscamos cuál es el torneo activo
            const torneoResponse = await fetch(`${API_URL_BASE}/torneo-activo`);
            if (!torneoResponse.ok) {
                throw new Error('No se encontró un torneo activo.');
            }
            const torneo = await torneoResponse.json();
            idTorneoActivo = torneo.id; // Guardamos el ID

            // 2. Con el ID, cargamos la lista completa de inscriptos para ese torneo
            await fetchInscriptos();

        } catch (error) {
            console.error('Error al inicializar:', error);
            loadingMessage.textContent = 'Error: No se pudo cargar la información del torneo.';
        }
    }

    // Función para buscar los inscriptos en el backend (ahora envía el ID del torneo)
    async function fetchInscriptos() {
        if (!idTorneoActivo) return; // No hace nada si no tenemos un torneo activo

        loadingMessage.style.display = 'block';
        tablaBody.innerHTML = '';
        
        const categoriaSeleccionada = filtroCategoria.value;
        
        // Construimos la URL con los parámetros correctos
        let url = `${API_URL_BASE}/inscriptos?id_torneo_fk=${idTorneoActivo}`;
        if (categoriaSeleccionada) {
            url += `&categoria=${categoriaSeleccionada}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Error al conectar con el servidor.');
            }
            const inscriptos = await response.json();
            renderTabla(inscriptos);
        } catch (error) {
            console.error('Error:', error);
            tablaBody.innerHTML = `<tr><td colspan="2" class="no-results">Error al cargar los datos. Inténtelo más tarde.</td></tr>`;
        } finally {
            loadingMessage.style.display = 'none';
        }
    }

    // Función para dibujar la tabla (sin cambios)
    function renderTabla(inscriptos) {
        if (inscriptos.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="2" class="no-results">No hay inscriptos en esta categoría.</td></tr>`;
            return;
        }

        inscriptos.forEach(inscripto => {
            const row = document.createElement('tr');
            // Formateamos el nombre de la categoría para que se vea más amigable
            const categoriaFormateada = inscripto.categoria.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            row.innerHTML = `
                <td>${inscripto.integrantes}</td>
                <td>${categoriaFormateada}</td>
            `;
            tablaBody.appendChild(row);
        });
    }

    // Evento que se dispara cuando el usuario cambia el filtro
    filtroCategoria.addEventListener('change', fetchInscriptos);

    // Iniciar todo el proceso al cargar la página
    inicializarPagina();
});