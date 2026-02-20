/*
SQLyog Ultimate v11.11 (64 bit)
MySQL - 8.0.45-0ubuntu0.22.04.1 : Database - bunfer
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`bunfer` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `bunfer`;

/*Table structure for table `detalle_sets` */

DROP TABLE IF EXISTS `detalle_sets`;

CREATE TABLE `detalle_sets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_partido` int NOT NULL,
  `numero_set` int NOT NULL COMMENT '1, 2, o 3 (super TB)',
  `games_local` int NOT NULL,
  `games_visitante` int NOT NULL,
  `es_super_tiebreak` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_partido` (`id_partido`),
  CONSTRAINT `fk_detalle_sets_partido` FOREIGN KEY (`id_partido`) REFERENCES `partido` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=200 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Detalle de cada set jugado';

/*Data for the table `detalle_sets` */

/*Table structure for table `estadisticas_grupo` */

DROP TABLE IF EXISTS `estadisticas_grupo`;

CREATE TABLE `estadisticas_grupo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_grupo` int NOT NULL,
  `id_inscripto` int NOT NULL,
  `pj` int DEFAULT '0' COMMENT 'partidos jugados',
  `pg` int DEFAULT '0' COMMENT 'partidos ganados (1 punto)',
  `pp` int DEFAULT '0' COMMENT 'partidos perdidos',
  `puntos` int DEFAULT '0',
  `sets_ganados` int DEFAULT '0',
  `sets_perdidos` int DEFAULT '0',
  `dif_sets` int DEFAULT '0' COMMENT 'sets_ganados - sets_perdidos',
  `games_ganados` int DEFAULT '0',
  `games_perdidos` int DEFAULT '0',
  `dif_games` int DEFAULT '0' COMMENT 'games_ganados - games_perdidos',
  `posicion` int DEFAULT NULL,
  `es_primero` tinyint(1) DEFAULT '0',
  `es_segundo` tinyint(1) DEFAULT '0',
  `clasificado` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_grupo_inscripto` (`id_grupo`,`id_inscripto`),
  KEY `idx_grupo` (`id_grupo`),
  KEY `idx_inscripto` (`id_inscripto`),
  CONSTRAINT `fk_estadisticas_grupo` FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_estadisticas_inscripto` FOREIGN KEY (`id_inscripto`) REFERENCES `inscriptos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2623 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Estadísticas calculadas por grupo';

/*Data for the table `estadisticas_grupo` */

/*Table structure for table `grupo_integrantes` */

DROP TABLE IF EXISTS `grupo_integrantes`;

CREATE TABLE `grupo_integrantes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_grupo` int NOT NULL,
  `id_inscripto` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_grupo_inscripto` (`id_grupo`,`id_inscripto`),
  KEY `id_inscripto` (`id_inscripto`),
  CONSTRAINT `grupo_integrantes_ibfk_1` FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grupo_integrantes_ibfk_2` FOREIGN KEY (`id_inscripto`) REFERENCES `inscriptos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=329 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `grupo_integrantes` */

/*Table structure for table `grupos` */

DROP TABLE IF EXISTS `grupos`;

CREATE TABLE `grupos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_grupo` int NOT NULL,
  `id_torneo_fk` int NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `cantidad_integrantes` int NOT NULL,
  `estado` enum('armado','pendiente','finalizado') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'pendiente',
  PRIMARY KEY (`id`),
  KEY `id_torneo_fk` (`id_torneo_fk`),
  KEY `categoria` (`categoria`),
  CONSTRAINT `grupos_ibfk_1` FOREIGN KEY (`id_torneo_fk`) REFERENCES `torneos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `grupos` */

/*Table structure for table `horarios` */

DROP TABLE IF EXISTS `horarios`;

CREATE TABLE `horarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_torneo_fk` int NOT NULL,
  `dia_semana` varchar(20) NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `Canchas` int DEFAULT '4',
  `activo` tinyint(1) DEFAULT '1',
  `es_playoff` tinyint(1) DEFAULT '0',
  `lugar` enum('Aeroclub','Malon','Challenger','Estudiantes','Tenis Rio Cuarto','Banda Norte','Jockey Club') DEFAULT 'Aeroclub',
  PRIMARY KEY (`id`),
  KEY `id_torneo_fk` (`id_torneo_fk`),
  CONSTRAINT `horarios_ibfk_1` FOREIGN KEY (`id_torneo_fk`) REFERENCES `torneos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb3;

/*Data for the table `horarios` */

insert  into `horarios`(`id`,`id_torneo_fk`,`dia_semana`,`fecha`,`hora_inicio`,`Canchas`,`activo`,`es_playoff`,`lugar`) values (17,1,'Lunes','2026-03-09','14:00:00',3,1,0,'Aeroclub'),(18,1,'Lunes','2026-03-09','15:30:00',3,1,0,'Aeroclub'),(19,1,'Lunes','2026-03-09','17:00:00',3,1,0,'Aeroclub'),(20,1,'Sábado','2026-03-14','08:30:00',4,1,0,'Aeroclub'),(22,1,'Sábado','2026-03-14','11:30:00',4,1,0,'Aeroclub'),(25,1,'Sábado','2026-03-14','10:00:00',4,1,0,'Aeroclub'),(26,1,'Lunes','2026-03-09','18:30:00',3,1,0,'Aeroclub'),(27,1,'Lunes','2026-03-09','20:00:00',3,1,0,'Aeroclub'),(28,1,'Lunes','2026-03-09','21:30:00',4,1,0,'Aeroclub'),(29,1,'Martes','2026-03-10','21:30:00',4,1,0,'Aeroclub'),(30,1,'Martes','2026-03-10','20:00:00',3,1,0,'Aeroclub'),(31,1,'Martes','2026-03-10','18:30:00',3,1,0,'Aeroclub'),(32,1,'Martes','2026-03-10','17:00:00',3,1,0,'Aeroclub'),(33,1,'Martes','2026-03-10','15:30:00',3,1,0,'Aeroclub'),(34,1,'Martes','2026-03-10','14:00:00',3,1,0,'Aeroclub'),(35,1,'Miércoles','2026-03-11','21:30:00',4,1,0,'Aeroclub'),(36,1,'Miércoles','2026-03-11','20:00:00',3,1,0,'Aeroclub'),(37,1,'Miércoles','2026-03-11','18:30:00',3,1,0,'Aeroclub'),(38,1,'Miércoles','2026-03-11','17:00:00',3,1,0,'Aeroclub'),(39,1,'Miércoles','2026-03-11','15:30:00',3,1,0,'Aeroclub'),(40,1,'Miércoles','2026-03-11','14:00:00',3,1,0,'Aeroclub'),(41,1,'Jueves','2026-03-12','21:30:00',4,1,0,'Aeroclub'),(42,1,'Jueves','2026-03-12','20:00:00',3,1,0,'Aeroclub'),(43,1,'Jueves','2026-03-12','18:30:00',3,1,0,'Aeroclub'),(44,1,'Jueves','2026-03-12','17:00:00',3,1,0,'Aeroclub'),(45,1,'Jueves','2026-03-12','15:30:00',3,1,0,'Aeroclub'),(46,1,'Jueves','2026-03-12','14:00:00',3,1,0,'Aeroclub'),(47,1,'Viernes','2026-03-13','21:30:00',4,1,0,'Aeroclub'),(48,1,'Viernes','2026-03-13','20:00:00',3,1,0,'Aeroclub'),(49,1,'Viernes','2026-03-13','18:30:00',3,1,0,'Aeroclub'),(50,1,'Viernes','2026-03-13','17:00:00',3,1,0,'Aeroclub'),(51,1,'Viernes','2026-03-13','15:30:00',3,1,0,'Aeroclub'),(52,1,'Viernes','2026-03-13','14:00:00',3,1,0,'Aeroclub');

/*Table structure for table `inscriptos` */

DROP TABLE IF EXISTS `inscriptos`;

CREATE TABLE `inscriptos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_torneo_fk` int NOT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `integrantes` varchar(300) DEFAULT NULL,
  `telefono` varchar(100) DEFAULT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `acepto` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `id_torneo_fk` (`id_torneo_fk`),
  CONSTRAINT `inscriptos_ibfk_1` FOREIGN KEY (`id_torneo_fk`) REFERENCES `torneos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8mb3;

/*Data for the table `inscriptos` */

insert  into `inscriptos`(`id`,`id_torneo_fk`,`correo`,`integrantes`,`telefono`,`categoria`,`acepto`) values (95,2,'alsdjaksljd','MAL','768768','Categoria-C',1),(122,1,'p.bunader@gmail.com','PABLO BUNADER / PAULA ROSSAROLI','3586011358','Categoria-D',1),(123,1,'cintianoeliaguekens@gmail.com','JONATHAN TESSA  / CINTIA GUEKENS ','3585606707','Categoria-D',1),(124,1,'anagiovannini32@gmail.com','ALBERTO  GIOVANNINI / ANA LAURA GIOVANNINI','3584862067','Categoria-D',1),(125,1,'mavibarchiesi@gmail.com','LAMBRESE CLAUDIO / BARCHIESI MAVIRA','3584266114','Categoria-D',1),(126,1,'nataliamartinez_35@hotmail.com','SAN MILLAN MARTIN / MARTINEZ NATALIA ','3584249354','Categoria-C1',1),(127,1,'marcos.mationi@gmail.com','MATIONI MARCOS / LUCERO MARÍA PIA','3585087385','Categoria-C1',1),(128,1,'P.bunader@gmail.com','PABLO BUNADER / PAULA ROSSAROLI','3584201496','Categoria-C2',1),(129,1,'ckvarela@hotmail.com','DARIO BERNARDES / CECILIA VARELA','3584247916','Categoria-B',1),(130,1,'gustavolascano@yahoo.com.ar','GUSTAVO LASCANO  / ANA PAULA LASCANO ','3585084747','Categoria-B',1),(131,1,'candesolenicolino@gmail.com','IGNACIO URETA / CANDELA NICOLINO ','3584231115','Categoria-D',1);

/*Table structure for table `inscriptos_horarios` */

DROP TABLE IF EXISTS `inscriptos_horarios`;

CREATE TABLE `inscriptos_horarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_inscripto_fk` int NOT NULL,
  `id_horario_fk` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_inscripto_fk` (`id_inscripto_fk`),
  KEY `id_horario_fk` (`id_horario_fk`),
  CONSTRAINT `inscriptos_horarios_ibfk_1` FOREIGN KEY (`id_inscripto_fk`) REFERENCES `inscriptos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inscriptos_horarios_ibfk_2` FOREIGN KEY (`id_horario_fk`) REFERENCES `horarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=186 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `inscriptos_horarios` */

insert  into `inscriptos_horarios`(`id`,`id_inscripto_fk`,`id_horario_fk`) values (86,122,17),(87,122,18),(88,122,34),(89,122,33),(90,122,40),(91,122,39),(92,122,46),(93,122,45),(94,122,52),(95,122,51),(96,122,20),(97,122,25),(98,122,22),(99,123,18),(100,123,19),(101,123,33),(102,123,32),(103,123,39),(104,123,38),(105,123,45),(106,123,44),(107,123,51),(108,123,50),(109,124,26),(110,124,31),(111,124,37),(112,124,43),(113,124,49),(114,124,25),(115,125,26),(116,125,27),(117,125,28),(118,125,31),(119,125,30),(120,125,29),(121,125,37),(122,125,36),(123,125,35),(124,125,43),(125,125,42),(126,125,41),(127,125,49),(128,125,48),(129,125,47),(130,125,25),(131,125,22),(132,126,30),(133,126,42),(134,126,48),(135,126,25),(136,127,26),(137,127,27),(138,127,28),(139,127,37),(140,127,36),(141,127,35),(142,127,49),(143,127,48),(144,127,47),(145,128,17),(146,128,18),(147,128,34),(148,128,33),(149,128,40),(150,128,39),(151,128,46),(152,128,45),(153,128,52),(154,128,51),(155,129,27),(156,129,28),(157,129,36),(158,129,35),(159,129,48),(160,129,47),(161,130,26),(162,130,27),(163,130,28),(164,130,31),(165,130,30),(166,130,29),(167,130,37),(168,130,36),(169,130,35),(170,130,44),(171,130,43),(172,130,42),(173,130,50),(174,130,49),(175,130,48),(176,130,47),(177,130,20),(178,130,25),(179,130,22),(180,131,27),(181,131,29),(182,131,36),(183,131,41),(184,131,52),(185,131,20);

/*Table structure for table `llave_eliminacion` */

DROP TABLE IF EXISTS `llave_eliminacion`;

CREATE TABLE `llave_eliminacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_torneo` int NOT NULL,
  `categoria` varchar(50) NOT NULL COMMENT 'Categoría del torneo',
  `ronda` varchar(20) NOT NULL COMMENT 'dieciseisavos, octavos, cuartos, semifinal, final',
  `posicion` int NOT NULL COMMENT 'Posición en el bracket (1 a N)',
  `id_partido` int DEFAULT NULL,
  `id_inscripto_1` int DEFAULT NULL,
  `id_inscripto_2` int DEFAULT NULL,
  `id_grupo_1` int DEFAULT NULL COMMENT 'Para evitar cruces del mismo grupo',
  `id_grupo_2` int DEFAULT NULL,
  `ganador_id` int DEFAULT NULL,
  `es_bye` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_torneo_categoria` (`id_torneo`,`categoria`),
  KEY `idx_ronda` (`ronda`),
  KEY `idx_partido` (`id_partido`),
  KEY `fk_llave_inscripto_1` (`id_inscripto_1`),
  KEY `fk_llave_inscripto_2` (`id_inscripto_2`),
  KEY `fk_llave_ganador` (`ganador_id`),
  KEY `fk_llave_grupo_1` (`id_grupo_1`),
  KEY `fk_llave_grupo_2` (`id_grupo_2`),
  CONSTRAINT `fk_llave_ganador` FOREIGN KEY (`ganador_id`) REFERENCES `inscriptos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_llave_grupo_1` FOREIGN KEY (`id_grupo_1`) REFERENCES `grupos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_llave_grupo_2` FOREIGN KEY (`id_grupo_2`) REFERENCES `grupos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_llave_inscripto_1` FOREIGN KEY (`id_inscripto_1`) REFERENCES `inscriptos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_llave_inscripto_2` FOREIGN KEY (`id_inscripto_2`) REFERENCES `inscriptos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_llave_partido` FOREIGN KEY (`id_partido`) REFERENCES `partido` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_llave_torneo` FOREIGN KEY (`id_torneo`) REFERENCES `torneos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=172 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Estructura de la llave de eliminación';

/*Data for the table `llave_eliminacion` */

/*Table structure for table `partido` */

DROP TABLE IF EXISTS `partido`;

CREATE TABLE `partido` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_horario` int DEFAULT NULL,
  `id_inscriptoL` int NOT NULL,
  `id_inscriptov` int NOT NULL,
  `estado` enum('pendiente','jugado','wo_local','wo_visitante','suspendido') DEFAULT 'pendiente',
  `ganador_id` int DEFAULT NULL,
  `sets_local` int DEFAULT '0',
  `sets_visitante` int DEFAULT '0',
  `games_local` int DEFAULT '0',
  `games_visitante` int DEFAULT '0',
  `tiebreak_local` int DEFAULT NULL,
  `tiebreak_visitante` int DEFAULT NULL,
  `es_bye` tinyint(1) DEFAULT '0',
  `ronda` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_horario` (`id_horario`),
  KEY `id_inscriptoL` (`id_inscriptoL`),
  KEY `id_inscriptov` (`id_inscriptov`),
  KEY `fk_partido_ganador` (`ganador_id`),
  CONSTRAINT `fk_partido_ganador` FOREIGN KEY (`ganador_id`) REFERENCES `inscriptos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `partido_ibfk_1` FOREIGN KEY (`id_horario`) REFERENCES `horarios` (`id`),
  CONSTRAINT `partido_ibfk_2` FOREIGN KEY (`id_inscriptoL`) REFERENCES `inscriptos` (`id`),
  CONSTRAINT `partido_ibfk_3` FOREIGN KEY (`id_inscriptov`) REFERENCES `inscriptos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=312 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `partido` */

/*Table structure for table `torneos` */

DROP TABLE IF EXISTS `torneos`;

CREATE TABLE `torneos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo_torneo` varchar(50) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `activo_inscripcion` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_torneo` (`codigo_torneo`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;

/*Data for the table `torneos` */

insert  into `torneos`(`id`,`codigo_torneo`,`nombre`,`fecha_inicio`,`fecha_fin`,`activo_inscripcion`) values (1,'torneomixto-aeroclub','Torneo Abierto de Tenis Mixto \"Copa Aero Club\"','2026-03-09','2026-03-15',1),(2,'torneomal','torneomal','2025-01-01','2025-02-02',0);

/*Table structure for table `usuario` */

DROP TABLE IF EXISTS `usuario`;

CREATE TABLE `usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `pass` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `tipousuario` int DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `usuario` */

insert  into `usuario`(`id`,`nombre`,`pass`,`tipousuario`,`activo`) values (1,'Pablobun','$2b$10$84cDr9fPo5VDOnJeKSheIu29XS.MEHCd.B4v1M/wd8Y7WyH5FUZq6',1,1),(2,'Guido','$2b$10$8zYBTFWzAeBoqrPfyhYWG.qMvj/2RDV3CUtA8z5hcAW7vooxLNLmG',2,1);

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
