document.addEventListener('DOMContentLoaded', () => {
    // URL de nuestro backend en Render
    const API_URL_BASE = 'https://academia-torneos.onrender.com/api/inscriptos';

    const filtroCategoria = document.getElementById('filtro-categoria');
    const tablaBody = document.querySelector('#tabla-inscriptos tbody');
    const loadingMessage = document.getElementById('loading-message');

    // Función para buscar los inscriptos en el backend
    async function fetchInscriptos(categoria = '') {
        loadingMessage.style.display = 'block'; // Mostrar "Cargando..."
        tablaBody.innerHTML = ''; // Limpiar la tabla

        let url = API_URL_BASE;
        if (categoria) {
            url += `?categoria=${categoria}`;
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
            loadingMessage.style.display = 'none'; // Ocultar "Cargando..."
        }
    }

    // Función para dibujar la tabla con los datos recibidos
    function renderTabla(inscriptos) {
        if (inscriptos.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="2" class="no-results">No hay inscriptos en esta categoría.</td></tr>`;
            return;
        }

        inscriptos.forEach(inscripto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${inscripto.integrantes}</td>
                <td>${inscripto.categoria.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
            `;
            tablaBody.appendChild(row);
        });
    }

    // Evento que se dispara cuando el usuario cambia el filtro
    filtroCategoria.addEventListener('change', () => {
        fetchInscriptos(filtroCategoria.value);
    });

    // Cargar la lista completa al abrir la página por primera vez
    fetchInscriptos();
});