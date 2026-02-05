/*
MIGRACIÓN: Sistema Completo de Torneo
Fecha: 2026-02-05
Descripción: Agrega tablas y campos necesarios para gestión de resultados, estadísticas y playoffs
*/

-- ==========================================================
-- 1. MODIFICACIONES A TABLA PARTIDO (Agregar campos de resultado)
-- ==========================================================

ALTER TABLE partido 
ADD COLUMN IF NOT EXISTS estado ENUM('pendiente', 'jugado', 'wo_local', 'wo_visitante', 'suspendido') DEFAULT 'pendiente' AFTER id_inscriptov,
ADD COLUMN IF NOT EXISTS ganador_id INT NULL AFTER estado,
ADD COLUMN IF NOT EXISTS sets_local INT DEFAULT 0 AFTER ganador_id,
ADD COLUMN IF NOT EXISTS sets_visitante INT DEFAULT 0 AFTER sets_local,
ADD COLUMN IF NOT EXISTS games_local INT DEFAULT 0 AFTER sets_visitante,
ADD COLUMN IF NOT EXISTS games_visitante INT DEFAULT 0 AFTER games_local,
ADD COLUMN IF NOT EXISTS tiebreak_local INT NULL AFTER games_visitante,
ADD COLUMN IF NOT EXISTS tiebreak_visitante INT NULL AFTER tiebreak_local,
ADD COLUMN IF NOT EXISTS es_bye BOOLEAN DEFAULT FALSE AFTER tiebreak_visitante,
ADD COLUMN IF NOT EXISTS ronda VARCHAR(20) NULL AFTER es_bye,
ADD CONSTRAINT fk_partido_ganador FOREIGN KEY (ganador_id) REFERENCES inscriptos(id) ON DELETE SET NULL;

-- ==========================================================
-- 2. TABLA: detalle_sets (Resultado detallado por set)
-- ==========================================================

CREATE TABLE IF NOT EXISTS detalle_sets (
  id INT NOT NULL AUTO_INCREMENT,
  id_partido INT NOT NULL,
  numero_set INT NOT NULL COMMENT '1, 2, o 3 (super TB)',
  games_local INT NOT NULL,
  games_visitante INT NOT NULL,
  es_super_tiebreak BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (id),
  KEY idx_partido (id_partido),
  CONSTRAINT fk_detalle_sets_partido FOREIGN KEY (id_partido) REFERENCES partido(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Detalle de cada set jugado';

-- ==========================================================
-- 3. TABLA: estadisticas_grupo (Materializado para performance)
-- ==========================================================

CREATE TABLE IF NOT EXISTS estadisticas_grupo (
  id INT NOT NULL AUTO_INCREMENT,
  id_grupo INT NOT NULL,
  id_inscripto INT NOT NULL,
  pj INT DEFAULT 0 COMMENT 'partidos jugados',
  pg INT DEFAULT 0 COMMENT 'partidos ganados (1 punto)',
  pp INT DEFAULT 0 COMMENT 'partidos perdidos',
  puntos INT DEFAULT 0,
  sets_ganados INT DEFAULT 0,
  sets_perdidos INT DEFAULT 0,
  dif_sets INT DEFAULT 0 COMMENT 'sets_ganados - sets_perdidos',
  games_ganados INT DEFAULT 0,
  games_perdidos INT DEFAULT 0,
  dif_games INT DEFAULT 0 COMMENT 'games_ganados - games_perdidos',
  posicion INT NULL,
  es_primero BOOLEAN DEFAULT FALSE,
  es_segundo BOOLEAN DEFAULT FALSE,
  clasificado BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (id),
  UNIQUE KEY unique_grupo_inscripto (id_grupo, id_inscripto),
  KEY idx_grupo (id_grupo),
  KEY idx_inscripto (id_inscripto),
  CONSTRAINT fk_estadisticas_grupo FOREIGN KEY (id_grupo) REFERENCES grupos(id) ON DELETE CASCADE,
  CONSTRAINT fk_estadisticas_inscripto FOREIGN KEY (id_inscripto) REFERENCES inscriptos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Estadísticas calculadas por grupo';

-- ==========================================================
-- 4. TABLA: horarios_playoffs (Horarios separados para eliminación)
-- ==========================================================

CREATE TABLE IF NOT EXISTS horarios_playoffs (
  id INT NOT NULL AUTO_INCREMENT,
  id_torneo INT NOT NULL,
  dia_semana VARCHAR(20) NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  cancha INT DEFAULT 1,
  disponible BOOLEAN DEFAULT TRUE COMMENT 'Si está libre para asignar',
  PRIMARY KEY (id),
  KEY idx_torneo (id_torneo),
  KEY idx_fecha_hora (fecha, hora_inicio),
  CONSTRAINT fk_horarios_playoffs_torneo FOREIGN KEY (id_torneo) REFERENCES torneos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Horarios exclusivos para partidos de playoffs';

-- ==========================================================
-- 5. TABLA: llave_eliminacion (Estructura del bracket de playoffs)
-- ==========================================================

CREATE TABLE IF NOT EXISTS llave_eliminacion (
  id INT NOT NULL AUTO_INCREMENT,
  id_torneo INT NOT NULL,
  categoria VARCHAR(50) NOT NULL COMMENT 'Categoría del torneo',
  ronda VARCHAR(20) NOT NULL COMMENT 'dieciseisavos, octavos, cuartos, semifinal, final',
  posicion INT NOT NULL COMMENT 'Posición en el bracket (1 a N)',
  id_partido INT NULL,
  id_inscripto_1 INT NULL,
  id_inscripto_2 INT NULL,
  id_grupo_1 INT NULL COMMENT 'Para evitar cruces del mismo grupo',
  id_grupo_2 INT NULL,
  ganador_id INT NULL,
  es_bye BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_torneo_categoria (id_torneo, categoria),
  KEY idx_ronda (ronda),
  KEY idx_partido (id_partido),
  CONSTRAINT fk_llave_torneo FOREIGN KEY (id_torneo) REFERENCES torneos(id) ON DELETE CASCADE,
  CONSTRAINT fk_llave_partido FOREIGN KEY (id_partido) REFERENCES partido(id) ON DELETE SET NULL,
  CONSTRAINT fk_llave_inscripto_1 FOREIGN KEY (id_inscripto_1) REFERENCES inscriptos(id) ON DELETE SET NULL,
  CONSTRAINT fk_llave_inscripto_2 FOREIGN KEY (id_inscripto_2) REFERENCES inscriptos(id) ON DELETE SET NULL,
  CONSTRAINT fk_llave_ganador FOREIGN KEY (ganador_id) REFERENCES inscriptos(id) ON DELETE SET NULL,
  CONSTRAINT fk_llave_grupo_1 FOREIGN KEY (id_grupo_1) REFERENCES grupos(id) ON DELETE SET NULL,
  CONSTRAINT fk_llave_grupo_2 FOREIGN KEY (id_grupo_2) REFERENCES grupos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Estructura de la llave de eliminación';

-- ==========================================================
-- NOTAS DE IMPLEMENTACIÓN:
-- ==========================================================
-- 1. Los resultados se guardan en 'partido' y detalle en 'detalle_sets'
-- 2. 'estadisticas_grupo' se recalcula automáticamente al cargar resultados
-- 3. 'horarios_playoffs' es independiente de 'horarios' (disponibilidad vs playoffs)
-- 4. 'llave_eliminacion' almacena la estructura completa del bracket
-- 5. Super tie-break: cada punto cuenta como 1 game, el TB completo como 1 set
-- ==========================================================