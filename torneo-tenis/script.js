document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registrationForm');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const serverMessage = document.getElementById('server-message');
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async function (event) {
        // 1. Prevenimos que el formulario se envíe de la forma tradicional.
        event.preventDefault(); 
        
        // 2. Limpiamos cualquier error visual de intentos anteriores.
        clearErrors();
        serverMessage.classList.add('hidden');

        // 3. Validamos los campos en el navegador. Si algo está mal, mostramos los errores y nos detenemos aquí.
        if (!validateForm()) {
            return;
        }

        // 4. Si la validación es correcta, desactivamos el botón para que el usuario no haga clic dos veces.
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        // 5. Creamos un objeto con todos los datos del formulario.
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.terminos = formData.has('terminos'); // Esto se convierte en true o false

        try {
            // 6. Enviamos los datos a nuestra función de backend en Netlify.
            const response = await fetch('https://academia-torneos.onrender.com/api/inscribir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            // 7. Esperamos la respuesta. Si todo salió bien en el backend...
            if (response.ok) {
                // ...ocultamos el formulario y mostramos el mensaje de éxito.
                form.style.display = 'none';
                document.querySelector('#formulario-inscripcion h2').style.display = 'none';
                confirmationMessage.classList.remove('hidden');
            } else {
                // ...si el backend nos devolvió un error (ej: no pudo conectar a la BD)...
                const errorResult = await response.json();
                showServerError(`Error del servidor: ${errorResult.error || 'Inténtelo más tarde.'}`);
            }
        } catch (error) {
            // 8. Si hubo un error de red (ej: el usuario se quedó sin internet).
            console.error('Error de red:', error);
            showServerError('Error de conexión. Revisa tu internet e inténtalo de nuevo.');
        } finally {
            // 9. Pase lo que pase (éxito o error), volvemos a activar el botón.
            submitButton.disabled = false;
            submitButton.textContent = 'Inscribir Pareja';
        }
    });

    // --- FUNCIONES DE AYUDA PARA VALIDACIÓN Y ERRORES ---

    /**
     * Muestra un mensaje de error general proveniente del servidor.
     */
    function showServerError(message) {
        serverMessage.textContent = message;
        serverMessage.className = 'server-error'; // Asignamos una clase para darle estilo
        serverMessage.classList.remove('hidden');
    }

    /**
     * Revisa todos los campos requeridos del formulario.
     * Devuelve 'true' si todo está correcto, 'false' si hay algún error.
     */
    function validateForm() {
    let isValid = true;
    
    // --- Campos que ya validábamos ---
    const integrantes = document.getElementById('integrantes');
    const email = document.getElementById('email');
    const categoria = document.getElementById('categoria');
    const terminos = document.getElementById('terminos');

    if (integrantes.value.trim() === '') { showError(integrantes, 'El nombre de los integrantes es obligatorio.'); isValid = false; }
    if (email.value.trim() === '') { showError(email, 'El correo electrónico es obligatorio.'); isValid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { showError(email, 'Por favor, introduce un correo electrónico válido.'); isValid = false; }
    if (categoria.value === '') { showError(categoria, 'Debes seleccionar una categoría.'); isValid = false; }
    if (!terminos.checked) { showError(terminos, 'Debes aceptar los términos y condiciones.'); isValid = false; }
    
    // --- NUEVAS VALIDACIONES ---
    
    // 1. Validar Teléfono
    const telefono = document.getElementById('telefono');
    if (telefono.value.trim() === '') {
        showError(telefono, 'El teléfono es obligatorio.');
        isValid = false;
    }

    // 2. Validar todos los campos de disponibilidad horaria
    // Creamos una lista con los IDs de todos los campos de disponibilidad
    const diasDisponibilidad = [
        'sabado4', 'domingo5', 'lunes6', 'martes7',
        'miercoles8', 'jueves9', 'viernes10', 'sabado11'
    ];

    // Recorremos la lista y validamos cada campo
    diasDisponibilidad.forEach(idDia => {
        const campoDia = document.getElementById(idDia);
        if (campoDia.value.trim() === '') {
            // Obtenemos la etiqueta del campo para un mensaje de error más claro
            const label = document.querySelector(`label[for='${idDia}']`).textContent;
            showError(campoDia, `La disponibilidad para ${label.replace(':', '')} es obligatoria.`);
            isValid = false;
        }
    });

    return isValid;
}
    /**
     * Muestra un mensaje de error debajo de un campo específico y le pone un borde rojo.
     */
    function showError(input, message) {
        input.classList.add('error');
        const formGroup = input.parentElement;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '0.9em';
        errorDiv.style.marginTop = '5px';
        errorDiv.innerText = message;
        
        // Para el checkbox, el mensaje se añade después de todo el grupo
        if (input.type === 'checkbox') {
             formGroup.parentElement.appendChild(errorDiv);
        } else {
             formGroup.appendChild(errorDiv);
        }
    }

    /**
     * Elimina todos los mensajes de error y los bordes rojos.
     */
    function clearErrors() {
        const errorInputs = form.querySelectorAll('.error');
        errorInputs.forEach(input => input.classList.remove('error'));

        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
    }
});