/*
CORRECCIÓN PARA MySQL - Modificar tabla partido
Ejecutar en orden
*/

-- 1. Agregar columna estado
ALTER TABLE partido 
ADD COLUMN estado ENUM('pendiente', 'jugado', 'wo_local', 'wo_visitante', 'suspendido') DEFAULT 'pendiente' AFTER id_inscriptov;

-- 2. Agregar columna ganador_id
ALTER TABLE partido 
ADD COLUMN ganador_id INT NULL AFTER estado,
ADD CONSTRAINT fk_partido_ganador FOREIGN KEY (ganador_id) REFERENCES inscriptos(id) ON DELETE SET NULL;

-- 3. Agregar columnas de sets y games
ALTER TABLE partido 
ADD COLUMN sets_local INT DEFAULT 0 AFTER ganador_id,
ADD COLUMN sets_visitante INT DEFAULT 0 AFTER sets_local,
ADD COLUMN games_local INT DEFAULT 0 AFTER sets_visitante,
ADD COLUMN games_visitante INT DEFAULT 0 AFTER games_local,
ADD COLUMN tiebreak_local INT NULL AFTER games_visitante,
ADD COLUMN tiebreak_visitante INT NULL AFTER tiebreak_local,
ADD COLUMN es_bye BOOLEAN DEFAULT FALSE AFTER tiebreak_visitante,
ADD COLUMN ronda VARCHAR(20) NULL AFTER es_bye;
