# AGENTS.md - Guía para Agentes de IA

## Información del Proyecto

**Nombre:** Sistema de Gestión de Torneos de Tenis  
**Repositorio:** https://github.com/Pablobun/torneos  
**Tecnologías:** Node.js, Express, MySQL, HTML/CSS/JavaScript, Gemini AI

## Estructura del Proyecto

```
torneos/
├── .github/workflows/       # GitHub Actions para CI/CD
│   ├── deploy.yml           # Despliegue frontend a DigitalOcean
│   └── keepalive.yml        # Mantiene vivo el backend en Render
├── dumps/                   # Backups de la base de datos
├── banners/                 # Imágenes de sponsors
├── logos/                   # Logos del proyecto
├── index.html              # Página principal de inscripción
├── inscriptos.html         # Lista de inscriptos
├── grupos.html             # Armado de grupos (nueva)
├── script.js               # Lógica frontend inscripciones
├── inscriptos.js           # Lógica frontend lista
├── grupos.js               # Lógica frontend grupos (nueva)
├── server.js               # Backend API
├── style.css               # Estilos globales
├── package.json            # Dependencias Node.js
└── reglamento.pdf          # Documento del torneo
```

## Convenciones de Código

### Backend (server.js)
- Usar `async/await` para todas las operaciones de BD
- Manejar errores con `try/catch` y siempre cerrar conexiones
- Endpoints RESTful: `/api/recurso/accion`
- Respuestas JSON consistentes: `{ grupos: [], partidos: [], advertencias: [] }`

### Frontend (JS)
- Variables en camelCase: `gruposGenerados`, `configuracionGrupos`
- Funciones descriptivas: `mostrarGruposFormados()`, `validarConfiguracion()`
- API URL base: `https://academia-torneos.onrender.com/api`
- Siempre validar respuestas del servidor antes de procesar

### CSS
- Mobile-first con media queries
- Separar estilos desktop y móvil claramente
- Usar variables del proyecto: colores `#4CAF50`, `#2c3e50`

### HTML
- IDs en kebab-case: `grupos-formados`, `btn-armar-grupos`
- Estructura semántica con sections
- Clases descriptivas: `categoria-card`, `grupo-config`

## Flujo de Trabajo

### Para hacer cambios:
1. **Editar en Codespace** (VS Code online) o localmente
2. **Test local** si es posible
3. **Git commit + push** → dispara deploy automático
4. **Verificar en** https://portaltorneos-riocuarto.com.ar

### Ruta Local del Repositorio
**Ruta principal:** `C:\torneos`
- Todos los archivos del proyecto están en `C:\torneos\`
- NO trabajar en `C:\Users\p_bun\torneonotocar\` - esa no es la ruta correcta

### RESTRICCIÓN IMPORTANTE
**SOLO PUEDE TRABAJAR EN LA CARPETA `C:\torneos`**
- Salvo expresa respuesta afirmativa de Pablo Bunader, NO se puede modificar archivos fuera de `C:\torneos`
- Se requiere aprobación explícita en el momento para trabajar en cualquier otra ruta
- Esta regla es estricta y no tiene excepciones

### Backend (Render):
- Variables de entorno en Dashboard de Render
- Logs en Render Dashboard > Logs
- Reiniciar servicio si es necesario

### Base de Datos:
- Host: separada (configurada en variables de entorno)
- Tablas principales: `torneos`, `inscriptos`, `horarios`, `grupos`, `partidos`
- Dumps en carpeta `/dumps` para backups

## Dependencias Principales

```json
{
  "express": "^4.x",
  "mysql2": "^3.x",
  "cors": "^2.x",
  "@google/generative-ai": "^0.x"
}
```

## Configuración de Variables de Entorno (Render)

```
DB_HOST=tu-host-mysql
DB_USER=tu-usuario
DB_PASSWORD=tu-password
DB_DATABASE=bunfer
DB_PORT=3306
GEMINI_API_KEY=tu-clave-gemini
PORT=10000
```

## Notas Importantes para IA

1. **NO crear tablas automáticamente** - Siempre pedir confirmación al usuario
2. **NO hacer inserts sin permiso** - Mostrar SQL primero
3. **VALIDAR datos** antes de enviar a la BD (fechas, IDs, etc.)
4. **MANTENER compatibilidad** con estructura existente
5. **PROBAR cambios** antes de pedir commit/push
6. **DOCUMENTAR endpoints** nuevos en este archivo

## Endpoints API Actuales

- `GET /api/torneo-activo` - Obtiene torneo con inscripción abierta
- `GET /api/horarios/:idTorneo` - Lista horarios del torneo
- `POST /api/inscribir` - Inscribe nueva pareja
- `GET /api/inscriptos` - Lista inscriptos (con filtro opcional)
- `POST /api/armar-grupos` - Genera grupos con IA
- `POST /api/guardar-grupos` - Guarda grupos en BD
- `GET /api/grupos/:idTorneo` - Obtiene grupos formados

## Problemas Conocidos

- Gemini API tiene límites de cuota (free tier)
- Algunos jugadores pueden tener horarios incompatibles
- La IA a veces genera JSON malformado - siempre validar

## Contacto/Responsable

**Propietario:** Pablo Bunader  
**Desarrollado por:** ITECLABS SOFTWARE  
**Email:** p.bunader@gmail.com
