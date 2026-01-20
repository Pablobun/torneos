document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'https://academia-torneos.onrender.com/api';
    const form = document.getElementById('registrationForm');
    const horariosContainer = document.getElementById('horarios-container');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const serverMessage = document.getElementById('server-message');
    const submitButton = form.querySelector('button[type="submit"]');

    // --- LÓGICA PARA CARGAR HORARIOS DINÁMICAMENTE ---

    async function cargarContenidoInicial() {
        try {
            // 1. Obtener el torneo activo
            const torneoResponse = await fetch(`${API_BASE_URL}/torneo-activo`);
            if (!torneoResponse.ok) {
                mostrarErrorGeneral('No hay inscripciones activas en este momento.');
                return;
            }
            const torneo = await torneoResponse.json();
            
            // Guardamos el ID del torneo para enviarlo con el formulario
            form.dataset.idTorneoFk = torneo.id;
            
            // 2. Obtener los horarios para ese torneo
            const horariosResponse = await fetch(`${API_BASE_URL}/horarios/${torneo.id}`);
            const horarios = await horariosResponse.json();

            if (horarios.length === 0) {
                mostrarErrorGeneral('No hay horarios de juego definidos para este torneo.');
                return;
            }

            // 3. Agrupar horarios por día
            const horariosPorDia = horarios.reduce((acc, horario) => {
                // La fecha llega como 'YYYY-MM-DD'
                const anio = horario.fecha.substring(2, 4); // Obtiene '25' de '2025'
                const mes = horario.fecha.substring(5, 7); // Obtiene '10'
                const dia = horario.fecha.substring(8, 10); // Obtiene '09'

                // Creamos el formato DD/MM/AA
                const fechaFormateada = `${dia}/${mes}/${anio}`;

                // Creamos la clave combinando el día de la semana y nuestra fecha formateada
                const diaKey = `${horario.dia_semana} ${fechaFormateada}`;

                // El resto de la lógica de agrupación sigue igual
                if (!acc[diaKey]) {
                    acc[diaKey] = [];
                }
                acc[diaKey].push(horario);
                return acc;
            }, {});

            // 4. Construir el HTML de los checkboxes
            let html = '<h4>Por favor, selecciona todos los horarios en los que podrías jugar:</h4>';
            for (const dia in horariosPorDia) {
                html += `<div class="dia-grupo"><h5>${dia}</h5><div class="horarios-grid">`;
                horariosPorDia[dia].forEach(h => {
                    const horaFormateada = h.hora_inicio.substring(0, 5);
                    html += `
                        <div class="horario-item">
                            <input type="checkbox" id="horario-${h.id}" name="horarios" value="${h.id}">
                            <label for="horario-${h.id}">${horaFormateada}</label>
                        </div>
                    `;
                });
                html += `</div></div>`;
            }
            horariosContainer.innerHTML = html;

        } catch (error) {
            console.error('Error al cargar contenido:', error);
            mostrarErrorGeneral('No se pudo conectar con el servidor para cargar los datos. Inténtalo más tarde.');
        }
    }

    function mostrarErrorGeneral(mensaje) {
        document.getElementById('info-torneo').style.display = 'none';
        document.getElementById('formulario-inscripcion').innerHTML = `<div class="inscripcion-cerrada"><h3>Error</h3><p>${mensaje}</p></div>`;
    }

    cargarContenidoInicial();

    // --- LÓGICA DEL FORMULARIO DE INSCRIPCIÓN ---
    
    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        clearErrors();
        serverMessage.classList.add('hidden');

        if (!validateForm()) {
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.horarios = formData.getAll('horarios');
        data.id_torneo_fk = form.dataset.idTorneoFk;
        data.terminos = formData.has('terminos');

        try {
            const response = await fetch(`${API_BASE_URL}/inscribir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                form.style.display = 'none';
                document.querySelector('#formulario-inscripcion h2').style.display = 'none';
                confirmationMessage.classList.remove('hidden');
            } else {
                const errorResult = await response.json();
                showServerError(`Error del servidor: ${errorResult.error || 'Inténtelo más tarde.'}`);
            }
        } catch (error) {
            console.error('Error de red:', error);
            showServerError('Error de conexión. Revisa tu internet e inténtalo de nuevo.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Inscribir Pareja';
        }
    });
    
    // --- FUNCIONES DE AYUDA (VALIDACIÓN, ERRORES, MODAL) ---

    function validateForm() {
        let isValid = true;
        const integrantes = document.getElementById('integrantes');
        const email = document.getElementById('email');
        const categoria = document.getElementById('categoria');
        const terminos = document.getElementById('terminos');
        const telefono = document.getElementById('telefono');

        if (integrantes.value.trim() === '') { showError(integrantes, 'El nombre de los integrantes es obligatorio.'); isValid = false; }
        if (email.value.trim() === '') { showError(email, 'El correo electrónico es obligatorio.'); isValid = false; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { showError(email, 'Por favor, introduce un correo electrónico válido.'); isValid = false; }
        if (categoria.value === '') { showError(categoria, 'Debes seleccionar una categoría.'); isValid = false; }
        if (telefono.value.trim() === '') { showError(telefono, 'El teléfono es obligatorio.'); isValid = false; }
        if (!terminos.checked) { showError(terminos, 'Debes aceptar los términos y condiciones.'); isValid = false; }
        
        // Nueva validación de horarios
        const horariosSeleccionados = document.querySelectorAll('input[name="horarios"]:checked');
        if (horariosSeleccionados.length === 0) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'Debes seleccionar al menos un horario de disponibilidad.';
            horariosContainer.appendChild(errorDiv);
            isValid = false;
        }

        return isValid;
    }

    function showError(input, message) {
        input.classList.add('error');
        const formGroup = input.parentElement;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        if (input.type === 'checkbox') {
             formGroup.parentElement.appendChild(errorDiv);
        } else {
             formGroup.appendChild(errorDiv);
        }
    }
    
    function showServerError(message) {
        serverMessage.textContent = message;
        serverMessage.className = 'server-error';
        serverMessage.classList.remove('hidden');
    }

    function clearErrors() {
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        form.querySelectorAll('.error-message').forEach(el => el.remove());
    }

    // --- LÓGICA PARA EL MODAL DE SPONSORS ---
    const modal = document.getElementById('modal-sponsors');
    const cerrarBoton = document.getElementById('cerrar-modal');
    const leyendaCerrar = document.querySelector('.modal-instruccion');
    if (modal && cerrarBoton) {
        const mostrarModal = () => modal.classList.add('visible');
        const ocultarModal = () => modal.classList.remove('visible');
        setTimeout(mostrarModal, 1500);
        cerrarBoton.addEventListener('click', ocultarModal);
        if (leyendaCerrar) leyendaCerrar.addEventListener('click', ocultarModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) ocultarModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('visible')) ocultarModal(); });
    }
});