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

/*Table structure for table `agenda_playoffs` */

DROP TABLE IF EXISTS `agenda_playoffs`;

CREATE TABLE `agenda_playoffs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_torneo` int NOT NULL,
  `id_horario` int NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `leyenda` varchar(150) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_agenda_torneo` (`id_torneo`),
  KEY `idx_agenda_cat` (`categoria`),
  KEY `idx_agenda_activo` (`activo`),
  KEY `fk_agenda_horario` (`id_horario`),
  CONSTRAINT `agenda_playoffs_ibfk_1` FOREIGN KEY (`id_torneo`) REFERENCES `torneos` (`id`),
  CONSTRAINT `fk_agenda_horario` FOREIGN KEY (`id_horario`) REFERENCES `horarios` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `agenda_playoffs` */

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
) ENGINE=InnoDB AUTO_INCREMENT=412 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Detalle de cada set jugado';

/*Data for the table `detalle_sets` */

insert  into `detalle_sets`(`id`,`id_partido`,`numero_set`,`games_local`,`games_visitante`,`es_super_tiebreak`) values (203,339,1,7,5,0),(204,339,2,3,6,0),(205,339,3,11,9,1),(206,344,1,2,6,0),(207,344,2,5,7,0),(208,370,1,6,4,0),(209,370,2,6,0,0),(210,327,1,5,7,0),(211,327,2,6,2,0),(212,327,3,5,10,1),(213,318,1,6,4,0),(214,318,2,6,7,0),(215,318,3,11,9,1),(216,333,1,2,6,0),(217,333,2,6,2,0),(218,333,3,10,6,1),(219,323,1,6,4,0),(220,323,2,1,6,0),(221,323,3,10,8,1),(222,368,1,3,6,0),(223,368,2,2,6,0),(224,336,1,6,2,0),(225,336,2,6,4,0),(226,325,1,6,1,0),(227,325,2,6,1,0),(228,341,1,6,0,0),(229,341,2,6,0,0),(230,340,1,6,0,0),(231,340,2,6,0,0),(232,330,1,1,6,0),(233,330,2,2,6,0),(234,371,1,6,2,0),(235,371,2,6,3,0),(236,342,1,5,7,0),(237,342,2,3,6,0),(240,319,1,4,6,0),(241,319,2,2,6,0),(242,356,1,6,3,0),(243,356,2,6,1,0),(244,337,1,6,1,0),(245,337,2,6,0,0),(246,331,1,4,6,0),(247,331,2,2,6,0),(248,347,1,2,6,0),(249,347,2,3,6,0),(250,328,1,6,2,0),(251,328,2,6,4,0),(252,355,1,6,4,0),(253,355,2,6,2,0),(254,350,1,2,6,0),(255,350,2,3,6,0),(256,321,1,3,6,0),(257,321,2,6,2,0),(258,321,3,10,7,1),(259,358,1,6,0,0),(260,358,2,6,2,0),(261,334,1,6,2,0),(262,334,2,6,1,0),(266,369,1,3,6,0),(267,369,2,6,4,0),(268,369,3,10,3,1),(269,338,1,6,0,0),(270,338,2,6,0,0),(271,332,1,2,6,0),(272,332,2,4,6,0),(273,343,1,6,4,0),(274,343,2,2,6,0),(275,343,3,5,10,1),(278,360,1,6,1,0),(279,360,2,6,2,0),(280,348,1,4,6,0),(281,348,2,2,6,0),(282,346,1,4,6,0),(283,346,2,4,6,0),(284,353,1,3,6,0),(285,353,2,3,6,0),(286,329,1,5,7,0),(287,329,2,6,7,0),(288,335,1,4,6,0),(289,335,2,7,6,0),(290,335,3,4,10,1),(291,320,1,4,6,0),(292,320,2,2,6,0),(293,365,1,6,3,0),(294,365,2,6,2,0),(313,357,1,6,3,0),(314,357,2,6,2,0),(315,345,1,6,1,0),(316,345,2,7,5,0),(317,375,1,6,2,0),(318,375,2,0,6,0),(319,375,3,9,11,1),(320,374,1,3,6,0),(321,374,2,6,4,0),(322,374,3,6,10,1),(323,377,1,4,6,0),(324,377,2,6,2,0),(325,377,3,10,7,1),(326,354,1,7,6,0),(327,354,2,3,6,0),(328,354,3,3,10,1),(329,326,1,6,0,0),(330,326,2,6,2,0),(333,351,1,5,7,0),(334,351,2,7,5,0),(335,351,3,11,9,1),(336,324,1,5,7,0),(337,324,2,2,6,0),(338,364,1,2,6,0),(339,364,2,6,3,0),(340,364,3,10,3,1),(341,379,1,6,2,0),(342,379,2,6,0,0),(343,322,1,3,6,0),(344,322,2,6,7,0),(345,366,1,7,6,0),(346,366,2,6,1,0),(349,359,1,1,6,0),(350,359,2,6,2,0),(351,359,3,10,1,1),(352,361,1,3,6,0),(353,361,2,6,7,0),(354,363,1,3,6,0),(355,363,2,0,6,0),(356,349,1,6,4,0),(357,349,2,6,3,0),(358,362,1,1,6,0),(359,362,2,6,1,0),(360,362,3,10,7,1),(361,378,1,4,6,0),(362,378,2,3,6,0),(363,376,1,4,6,0),(364,376,2,3,6,0),(365,367,1,0,6,0),(366,367,2,0,6,0),(367,352,1,6,2,0),(368,352,2,6,7,0),(369,352,3,2,10,1),(370,383,1,6,2,0),(371,383,2,5,7,0),(372,383,3,10,5,1),(373,384,1,3,6,0),(374,384,2,3,6,0),(375,385,1,2,6,0),(376,385,2,6,3,0),(377,385,3,7,10,1),(378,380,1,7,6,0),(379,380,2,6,7,0),(380,380,3,9,11,1),(381,382,1,7,6,0),(382,382,2,6,2,0),(383,381,1,6,2,0),(384,381,2,4,6,0),(385,381,3,10,8,1),(386,386,1,6,3,0),(387,386,2,6,4,0),(388,387,1,3,6,0),(389,387,2,7,5,0),(390,387,3,7,10,1),(391,388,1,3,6,0),(392,388,2,4,6,0),(396,389,1,6,3,0),(397,389,2,1,6,0),(398,389,3,10,6,1),(399,390,1,6,3,0),(400,390,2,3,6,0),(401,390,3,7,10,1),(402,391,1,7,6,0),(403,391,2,3,6,0),(404,391,3,10,7,1),(405,392,1,6,4,0),(406,392,2,6,3,0),(407,393,1,6,4,0),(408,393,2,3,6,0),(409,393,3,12,14,1),(410,394,1,6,3,0),(411,394,2,6,0,0);

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
) ENGINE=InnoDB AUTO_INCREMENT=18364 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Estadísticas calculadas por grupo';

/*Data for the table `estadisticas_grupo` */

insert  into `estadisticas_grupo`(`id`,`id_grupo`,`id_inscripto`,`pj`,`pg`,`pp`,`puntos`,`sets_ganados`,`sets_perdidos`,`dif_sets`,`games_ganados`,`games_perdidos`,`dif_games`,`posicion`,`es_primero`,`es_segundo`,`clasificado`) values (18320,113,154,4,3,1,3,7,2,5,55,39,16,1,1,0,1),(18321,113,135,4,2,2,2,5,5,0,51,55,-4,2,0,1,1),(18322,113,142,3,1,2,1,3,5,-2,48,51,-3,3,0,0,0),(18323,113,130,3,1,2,1,2,5,-3,35,44,-9,4,0,0,0),(18324,114,157,2,2,0,2,4,0,4,25,9,16,1,1,0,1),(18325,114,129,2,1,1,1,2,2,0,19,15,4,2,0,1,1),(18326,114,172,2,0,2,0,0,4,-4,4,24,-20,3,0,0,0),(18327,122,163,4,3,1,3,7,2,5,49,39,10,1,1,0,1),(18328,122,152,4,3,1,3,6,3,3,53,32,21,2,0,1,1),(18329,122,127,3,1,2,1,2,5,-3,28,33,-5,3,0,0,0),(18330,122,150,3,0,3,0,1,6,-5,15,41,-26,4,0,0,0),(18331,123,126,3,3,0,3,6,0,6,37,17,20,1,1,0,1),(18332,123,146,3,2,1,2,4,3,1,38,30,8,2,0,1,1),(18333,123,167,3,1,2,1,2,5,-3,24,36,-12,3,0,0,0),(18334,123,136,3,0,3,0,2,6,-4,31,47,-16,4,0,0,0),(18335,120,159,4,4,0,4,8,1,7,57,39,18,1,1,0,1),(18336,120,148,4,2,2,2,5,4,1,53,46,7,2,0,1,1),(18337,120,145,3,1,2,1,2,5,-3,31,38,-7,3,0,0,0),(18338,120,147,3,0,3,0,1,6,-5,28,46,-18,4,0,0,0),(18339,121,153,3,3,0,3,6,1,5,43,25,18,1,1,0,1),(18340,121,128,3,2,1,2,5,3,2,49,46,3,2,0,1,1),(18341,121,168,3,1,2,1,2,4,-2,23,31,-8,3,0,0,0),(18342,121,158,3,0,3,0,1,6,-5,34,47,-13,4,0,0,0),(18343,115,139,2,1,1,1,3,2,1,28,25,3,1,1,0,1),(18344,115,155,2,1,1,1,2,2,0,20,23,-3,2,0,1,1),(18345,115,138,2,1,1,1,2,3,-1,30,30,0,3,0,0,0),(18346,116,123,2,2,0,2,4,0,4,24,12,12,1,1,0,1),(18347,116,149,2,1,1,1,2,2,0,18,15,3,2,0,1,1),(18348,116,125,2,0,2,0,0,4,-4,9,24,-15,3,0,0,0),(18349,117,151,2,2,0,2,4,1,3,30,17,13,1,1,0,1),(18350,117,144,2,1,1,1,2,3,-1,25,27,-2,2,0,1,1),(18351,117,143,2,0,2,0,2,4,-2,29,40,-11,3,0,0,0),(18352,118,162,2,2,0,2,4,0,4,24,7,17,1,1,0,1),(18353,118,140,2,1,1,1,2,2,0,18,12,6,2,0,1,1),(18354,118,131,2,0,2,0,0,4,-4,1,24,-23,3,0,0,0),(18355,119,132,2,2,0,2,4,1,3,33,20,13,1,1,0,1),(18356,119,170,2,1,1,1,3,2,1,32,21,11,2,0,1,1),(18357,119,171,2,0,2,0,0,4,-4,0,24,-24,3,0,0,0),(18358,124,164,2,2,0,2,4,0,4,24,5,19,1,1,0,1),(18359,124,156,2,1,1,1,2,2,0,13,19,-6,2,0,1,1),(18360,124,141,2,0,2,0,0,4,-4,12,25,-13,3,0,0,0),(18361,125,165,2,2,0,2,4,1,3,31,17,14,1,1,0,1),(18362,125,160,2,1,1,1,3,2,1,25,24,1,2,0,1,1),(18363,125,133,2,0,2,0,0,4,-4,9,24,-15,3,0,0,0);

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
) ENGINE=InnoDB AUTO_INCREMENT=382 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `grupo_integrantes` */

insert  into `grupo_integrantes`(`id`,`id_grupo`,`id_inscripto`) values (336,113,130),(338,113,135),(337,113,142),(339,113,154),(340,114,129),(341,114,157),(342,114,172),(344,115,138),(381,115,139),(345,115,155),(348,116,123),(380,116,125),(347,116,149),(350,117,143),(351,117,144),(349,117,151),(354,118,131),(353,118,140),(352,118,162),(355,119,132),(356,119,170),(357,119,171),(360,120,145),(358,120,147),(359,120,148),(361,120,159),(363,121,128),(365,121,153),(364,121,158),(362,121,168),(368,122,127),(369,122,150),(367,122,152),(366,122,163),(372,123,126),(373,123,136),(370,123,146),(371,123,167),(375,124,141),(374,124,156),(376,124,164),(379,125,133),(378,125,160),(377,125,165);

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
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `grupos` */

insert  into `grupos`(`id`,`numero_grupo`,`id_torneo_fk`,`categoria`,`cantidad_integrantes`,`estado`) values (113,1,1,'Cat.-B',4,'finalizado'),(114,2,1,'Cat.-B',3,'finalizado'),(115,1,1,'Cat.-D',3,'finalizado'),(116,2,1,'Cat.-D',3,'finalizado'),(117,3,1,'Cat.-D',3,'finalizado'),(118,4,1,'Cat.-D',3,'finalizado'),(119,5,1,'Cat.-D',3,'finalizado'),(120,1,1,'Cat.-C2',4,'finalizado'),(121,2,1,'Cat.-C2',4,'finalizado'),(122,1,1,'Cat.-C1',4,'finalizado'),(123,2,1,'Cat.-C1',4,'finalizado'),(124,1,1,'Cat.-E',3,'finalizado'),(125,2,1,'Cat.-E',3,'finalizado');

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
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb3;

/*Data for the table `horarios` */

insert  into `horarios`(`id`,`id_torneo_fk`,`dia_semana`,`fecha`,`hora_inicio`,`Canchas`,`activo`,`es_playoff`,`lugar`) values (17,1,'Lunes','2026-03-09','14:00:00',3,1,0,'Aeroclub'),(18,1,'Lunes','2026-03-09','15:30:00',3,1,0,'Aeroclub'),(19,1,'Lunes','2026-03-09','17:00:00',3,1,0,'Aeroclub'),(20,1,'Sábado','2026-03-14','08:30:00',4,1,0,'Aeroclub'),(22,1,'Sábado','2026-03-14','11:30:00',4,1,0,'Aeroclub'),(25,1,'Sábado','2026-03-14','10:00:00',4,1,0,'Aeroclub'),(26,1,'Lunes','2026-03-09','18:30:00',3,1,0,'Aeroclub'),(27,1,'Lunes','2026-03-09','20:00:00',3,1,0,'Aeroclub'),(28,1,'Lunes','2026-03-09','21:30:00',4,1,0,'Aeroclub'),(29,1,'Martes','2026-03-10','21:30:00',4,1,0,'Aeroclub'),(30,1,'Martes','2026-03-10','20:00:00',3,1,0,'Aeroclub'),(31,1,'Martes','2026-03-10','18:30:00',3,1,0,'Aeroclub'),(32,1,'Martes','2026-03-10','17:00:00',3,1,0,'Aeroclub'),(33,1,'Martes','2026-03-10','15:30:00',3,1,0,'Aeroclub'),(34,1,'Martes','2026-03-10','14:00:00',3,1,0,'Aeroclub'),(35,1,'Miércoles','2026-03-11','21:30:00',4,1,0,'Aeroclub'),(36,1,'Miércoles','2026-03-11','20:00:00',3,1,0,'Aeroclub'),(37,1,'Miércoles','2026-03-11','18:30:00',3,1,0,'Aeroclub'),(38,1,'Miércoles','2026-03-11','17:00:00',3,1,0,'Aeroclub'),(39,1,'Miércoles','2026-03-11','15:30:00',3,1,0,'Aeroclub'),(40,1,'Miércoles','2026-03-11','14:00:00',3,1,0,'Aeroclub'),(41,1,'Jueves','2026-03-12','21:30:00',4,1,0,'Aeroclub'),(42,1,'Jueves','2026-03-12','20:00:00',3,1,0,'Aeroclub'),(43,1,'Jueves','2026-03-12','18:30:00',3,1,0,'Aeroclub'),(44,1,'Jueves','2026-03-12','17:00:00',3,1,0,'Aeroclub'),(45,1,'Jueves','2026-03-12','15:30:00',3,1,0,'Aeroclub'),(46,1,'Jueves','2026-03-12','14:00:00',3,1,0,'Aeroclub'),(47,1,'Viernes','2026-03-13','21:30:00',4,1,0,'Aeroclub'),(48,1,'Viernes','2026-03-13','20:00:00',3,1,0,'Aeroclub'),(49,1,'Viernes','2026-03-13','18:30:00',3,1,0,'Aeroclub'),(50,1,'Viernes','2026-03-13','17:00:00',3,1,0,'Aeroclub'),(51,1,'Viernes','2026-03-13','15:30:00',3,1,0,'Aeroclub'),(52,1,'Viernes','2026-03-13','14:00:00',3,1,0,'Aeroclub'),(53,1,'Sábado','2026-03-14','14:00:00',4,1,0,'Aeroclub'),(54,1,'Sábado','2026-03-14','15:30:00',4,1,0,'Aeroclub'),(55,1,'Sábado','2026-03-14','17:00:00',4,1,0,'Aeroclub'),(56,1,'Sábado','2026-03-14','18:30:00',4,1,0,'Aeroclub'),(57,1,'Sábado','2026-03-14','20:00:00',4,1,0,'Aeroclub'),(58,1,'Viernes','2026-03-13','19:00:00',1,1,0,'Aeroclub'),(62,1,'Sábado','2026-03-15','11:30:00',4,1,1,'Aeroclub'),(63,1,'Sábado','2026-03-15','13:00:00',4,1,1,'Aeroclub'),(64,1,'Sábado','2026-03-15','15:30:00',4,1,1,'Aeroclub'),(65,1,'Sábado','2026-03-15','18:30:00',4,1,1,'Aeroclub'),(66,1,'Sábado','2026-03-15','19:00:00',4,1,1,'Aeroclub'),(67,1,'Sábado','2026-03-14','13:00:00',4,1,0,'Aeroclub'),(68,1,'Sábado','2026-03-14','21:30:00',4,1,0,'Aeroclub'),(69,1,'Sábado','2026-03-15','21:30:00',4,1,1,'Aeroclub'),(70,1,'Domingo','2026-03-15','08:30:00',4,1,0,'Aeroclub'),(71,1,'Sábado','2026-03-15','20:00:00',4,1,1,'Aeroclub'),(72,1,'Domingo','2026-03-15','10:30:00',4,1,1,'Aeroclub'),(73,1,'Domingo','2026-03-15','12:00:00',4,1,1,'Aeroclub'),(74,1,'Domingo','2026-03-15','09:00:00',4,1,1,'Aeroclub'),(75,1,'Domingo','2026-03-15','15:00:00',4,1,1,'Aeroclub'),(76,1,'Domingo','2026-03-15','16:30:00',4,1,1,'Aeroclub');

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
) ENGINE=InnoDB AUTO_INCREMENT=173 DEFAULT CHARSET=utf8mb3;

/*Data for the table `inscriptos` */

insert  into `inscriptos`(`id`,`id_torneo_fk`,`correo`,`integrantes`,`telefono`,`categoria`,`acepto`) values (123,1,'cintianoeliaguekens@gmail.com','JONATHAN TESSA  / CINTIA GUEKENS ','3585606707','Cat.-D',1),(125,1,'mavibarchiesi@gmail.com','CLAUDIO  LAMBRESE / MAVIRA BARCHIESI ','3584266114','Cat.-D',1),(126,1,'nataliamartinez_35@hotmail.com','RENATO NEGRI /  NATI MARTINEZ','3584249354','Cat.-C1',1),(127,1,'marcos.mationi@gmail.com','MARCOS MATIONI / M PIA LUCERO ','3585087385','Cat.-C1',1),(128,1,'P.bunader@gmail.com','P BUNADER / SELENE MONTILLA','3584201496','Cat.-D',1),(129,1,'ckvarela@hotmail.com','DARIO BERNARDES / CECILIA VARELA','3584247916','Cat.-B',1),(130,1,'gustavolascano@yahoo.com.ar','GUSTAVO LASCANO  / ANA P. LASCANO ','3585084747','Cat.-B',1),(131,1,'candesolenicolino@gmail.com','IGNACIO URETA / CANDELA NICOLINO ','3584231115','Cat.-D',1),(132,1,'joroviedo97@gmail.com','FEDERICO OVIEDO / JORGELINA  OVIEDO ','3584395320','Cat.-D',1),(133,1,'envasesrio4@gmail.com','JORGE PIROTTO / MACARENA MOYANO','3584014888','Cat.-D',1),(134,2,'olidonnelly@gmail.com','TOMÁS BEAMONTE  / OLIVIA DONNELLY ','1151065866','Cat.-C1',1),(135,1,'corialeo87@gmail.com','LEO CORIA / FER PEREZ RAMA','3584125980','Cat.-B',1),(136,1,'dtgonzalozambroni@gmail.com','GON ZAMBRONI / LU CENTENO','03584255546','Cat.-C1',1),(138,1,'enlacesyred@gmail.com','FRANCO TORRES / GABRIELA GONZALES','3463645130','Cat.-D',1),(139,1,'agucabral7@gmail.com','AGUS CABRAL / ESTEFANIA BUSSO','3584820889','Cat.-D',1),(140,1,'Lucasernandez14@hotmail.com','LUCAS FERNÁNDEZ  / MARIA L DURAN','3584308923','Cat.-D',1),(141,1,'erausquinbelen@gmail.com','ANDRES PANDOLFI / BELEN ERAUSQUIN','3584314646','Cat.-D',1),(142,1,'josemancinelli1@gmail.com','JOSÉ MANCINELLI  / CECI MARTÍNEZ ','3584366726','Cat.-B',1),(143,1,'hravera@gmail.com','DANIEL RAVERA  / ADRIANA ABALLAY','3584198860','Cat.-D',1),(144,1,'marilinamigliori@hotmail.com','CRISTIAN AGUILAR  / MARILINA MIGLIORI ','3586008983','Cat.-D',1),(145,1,'florthuer@gmail.com','JUAN OYOLA / FLORENCIA MARTIN','3584175073','Cat.-D',1),(146,1,'agustinpronotti@outlook.com','AGUS PRONOTTI  / JOSEFINA MORENO','3584020291','Cat.-C1',1),(147,1,'gastonthuer@gmail.com','GASTON THUER / MALENA THUER','3584174993','Cat.-D',1),(148,1,'valen.rod.aba@gmail.com','VALENTIN ABALLAY / SOFIA BLANCO','3584022446','Cat.-D',1),(149,1,'roberto.birri@gmail.com','ROBERTO BIRRI / MARTINA BIRRI','3586027510','Cat.-D',1),(150,1,'paulabunaroli@gmail.com','AGUS ABALLAY  / PAU ROSSAROLI','3586011358','Cat.-C1',1),(151,1,'gastonhbar1181@gmail.com','GASTÓN BÁRCENA / STELLA BRESSAN  ','3584337689','Cat.-D',1),(152,1,'yougebalzola@hotmail.com','MARCOS GIOVANNINI / EUGE BALZOLA','3584010801','Cat.-C1',1),(153,1,'mclararitta@gmail.com','MARCOS BERGAGNA  / M CLARA RITTA','3584196183','Cat.-D',1),(154,1,'maezoemi@gmail.com','EMI MAEZO / LUCIANA MUÑOZ ','3584312629','Cat.-B',1),(155,1,'mimibertoletti@gmail.com','ERICO LASSALLE / MIMI BERTOLETTI','3584282583','Cat.-D',1),(156,1,'alevale_272@outlook.com','SIMON FARIAS / ALEJANDRA MOLINA','3584175523','Cat.-D',1),(157,1,'soficerolini@gmail.com','VALENTIN LOPEZ / SOFÍA CEROLINI','3582440158','Cat.-B',1),(158,1,'iferrero@tate.com.ar','IGNA FERRERO / VALEN TORRES','3584846072','Cat.-D',1),(159,1,'que_llueva@hotmail.com','SANTIAGO ABRAHAN  / MICAELA OSELLA  ','3584015277','Cat.-D',1),(160,1,'ericavangon2000@gmail.com','GASTON ARGUELLO / GONZALEZ VANINA','03584025710','Cat.-D',1),(161,2,'brerosanti@gmail.com','SANTIAGO BRERO  / PILAR NICOLA','3585624228','Cat.-B',1),(162,1,'ari.ange@yahoo.com.ar','MAURI PUEBLA/ ANGELA FERNANDEZ ','3584176925','Cat.-D',1),(163,1,'mariochanique@hotmail.com','MARIO CHANIQUE / JIMENA VICENS','3584163726','Cat.-C1',1),(164,1,'rodricamila04@gmail.com','GUSTAVO GAVA  / CAMILA RODRIGUEZ ','3584833288','Cat.-D',1),(165,1,'anagiovannini32@gmail.com','JUAN SILVEIRA / ANA GIOVANNINI','3584862067','Cat.-D',1),(167,1,'cesardelimperio4@gmail.com','CESAR HELBLING / MIRIAN RIVERO','3584356707','Cat.-C1',1),(168,1,'josemiguelmarengo26@gmail.com','JOSÉ MARENGO  / NATALIA ZULLIANI','3585079299','Cat.-D',1),(169,2,'alsdjaksljd','MAL','768768','Categoria-C',1),(170,1,'p.bunader@gmail.com','PABLO BUNADER / PAULA ROSSAROLI','3586011358','Cat.-D',1),(171,1,'solebon@gmail.com','ELLAS FERNANDES / SOLEDAD BONGI','358603406','Cat.-D',1),(172,1,'descono@nose.com','JOSE MARENGO / NORMA JAIME','6666666666','Cat.-B',1);

/*Table structure for table `inscriptos_copy1` */

DROP TABLE IF EXISTS `inscriptos_copy1`;

CREATE TABLE `inscriptos_copy1` (
  `id` int NOT NULL AUTO_INCREMENT,
  `integrantes` varchar(300) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `telefono` varchar(100) DEFAULT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `sabado` varchar(200) DEFAULT NULL,
  `domingo` varchar(200) DEFAULT NULL,
  `lunes` varchar(200) DEFAULT NULL,
  `martes` varchar(200) DEFAULT NULL,
  `miercoles` varchar(200) DEFAULT NULL,
  `jueves` varchar(200) DEFAULT NULL,
  `viernes` varchar(200) DEFAULT NULL,
  `sabadof` varchar(200) DEFAULT NULL,
  `acepto` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb3;

/*Data for the table `inscriptos_copy1` */

insert  into `inscriptos_copy1`(`id`,`integrantes`,`correo`,`telefono`,`categoria`,`sabado`,`domingo`,`lunes`,`martes`,`miercoles`,`jueves`,`viernes`,`sabadof`,`acepto`) values (2,'Paula Rossaroli / Marilina Migliorini','Paulabunaroli@gmail.com','3584201496','femenino-d','despues de las 17','NO','NO','NO','Despues de las 20','No puedo','Despues de las 20','Solo por la tarde',1),(3,'Bunader Pablo / Tessa Jonathan','p.bunader@gmail.com','3586011358','masculino-C','despues de las 14','todo el dia','despues de las 14.30 hasta las 17','despues de las 14.30 hasta las 17','despues de las 14.30 hasta las 17  y despues de las 20','despues de las 14.30 hasta las 17','despues de las 14.30 hasta las 17 y despues de las 20','Despues de las 14',1),(4,'Guido Ferrer / Matias Vallejos','gferrer2004@hotmail.com','3584116265','masculino-b','desde las 12.30','Todo el dia','No','No','No','No','No','Despues de las 12.30',1),(12,'Cecilia Martínez Ullate / Virginia Elena','cmartinezu90@gmail.com','3584314324','femenino-b','No puedo','No Puedo','A partir de las 17:00 hs','A partir de las 17:00 hs','A partir de las 17:00 hs','A partir de las 17:00 hs','A partir de las 17:00 hs','Todo el dia',1),(13,'Martina tazzioli / Julia anino','anajuliaanino96@gmail.com','3584016246','femenino-c','A partir de las 10','no podemos','Puedo empezar a las 13-14hrs o a partir de las 18','Puedo empezar a las 13-14hrs o a partir de las 18','Puedo empezar a las 13-14hrs o a partir de las 18','Puedo empezar a las 13-14hrs o a partir de las 18','Puedo empezar a las 13-14hrs o a partir de las 18','A partir de las 10',1),(15,'Paula Martínez / Eugenia Scoppa','eugenia.scoppa@gmail.com','3584364679','femenino-d','Por la tarde hasta las 19hs','Por la tarde hasta las 19hs','De 15 a 17.30','NO','De 15 a 17.30','A partir de las 17.30','A partir de las 17.30','A partir de las 11 de la mañana ',1),(16,'Lopez Flavio / Javier Ison','javierhison8@gmail.com','3584283503','masculino-c','Podemos por la mañana y tarde.','Este día no podemos jugar.','Podemos empezar a jugar a partir de las 18hs-Debemos terminar antes de las 21:30hs.','Podemos empezar a jugar a partir de las 18hs-Debemos terminar antes de las 21:30hs','Podemos empezar a jugar a partir de las 18hs-Debemos terminar antes de las 21:30hs','Podemos empezar a jugar a partir de las 18hs-Debemos terminar antes de las 21:30hs','Podemos empezar a jugar a partir de las 18hs-Debemos terminar antes de las 21:30hs','Podemos todo el día.',1),(17,'Santiago Schapiro / Otto Franke','ventas@frankedistribuciones.com.ar','3584021113','masculino-c','NO PODEMOS','NO PODEMOS','A PARTIR DE LAS 19 HS','NO PODEMOS','A PARTIR DE LAS 19 HS','A PARTIR DE LAS 19 HS','A PARTIR DE LAS 19 HS','PODEMOS',1),(19,'Peralta Alicia / Maitana Cecilia','ceci.maitana@gmail.com','3584228750','femenino-b','No','No','No','A partir de las 19 hs','A partir de las 19 hs','A partir de las 19 hs','A partir de las 17 hs','Todo el día ',1),(20,'Grosso Lautaro / Grosso Mauricio','mauriciogrosso1979@gmail.com','3584236117','masculino-c','Todo el día ','Todo el día ','No puedo','A partir de las 20hs','No puedo','A partir de las 20hs','A partir de las 20hs','Todo el día ',1),(21,'Di Tirro Bianca / Tessa Macarena','biancaditirro@gmail.com','1162751400','femenino-c','Hasta las 15hs','Despues de las 14hs','Despues de las 18','Despues de las 18','Despues de las 18','Despues de las 18','Despues de las 18','Sin horarios',1),(22,'Ramiro Martitegui / Gustavo Cesareo ','gustavogabriel.cesareo@gmail.com','3585061281','masculino-c','Todo el dia','Todo el dia','Este día no puedo jugar','Este día no puedo jugar','Este día no puedo jugar','Este día no puedo jugar','Puedo jugar por la tarde','Todo el dia',1),(23,'Benjamín Lagos / Emiliano Zapico','benjamin_lagos@hotmail.com','3585095176','masculino-c','Solo por la mañana','Sin horarios','A partir de las 18 hs en adelante ','A partir de las 20 hs','A partir de las 18 hs','A partir de las 18 hs','A partir de las 17 hs','Sin horarios ',1),(24,'Natalia Martinez / Estela Metenda ','nataliamartinez_35@hotmail.com','3584249354','femenino-b','Sin horarios ','Sin horarios ','Después de las 18.30 ','Después de las 18.30','Después de las 18.30','No podemos ','Después de las 18.30','Sin horarios ',1),(25,'Pirotto Jorge / Grosso Daniel','envasesrio4@gmail.com','3584014888','masculino-e','A la mañana después de las 10 hs','A la mañana después de las 10 hs','De 15 hs a 18 hs','De 15 hs a 18 hs','De 15 hs a 18 hs','De 15 hs a 18 hs','De 15 hs a 18 hs','Después de las 10 hs',1),(26,'Cristian aguilar / Di Genaro Luciano','hravera@gmail.com','3584198860','masculino-c','A partir de las 10;00 hs','A partir de las 12:00hs','20;00','20;00','19:00','20;00','20;00','A partir de las 10;00',1),(27,'Grenat Gabriela / Bastida Alicia','gabrielagrenat@gmail.com','3585625332','femenino-c','no podemos','no podemos','no podemos','podemos hasta las 19 hs','podemos hasta las 13 hs','podemos hasta las 19 hs ','no podemos','podemos a la tarde',1),(28,'Alicia Suarez / Cecilia Varela','ckvarela@hotmail.com','3594247916','femenino-b','Sin horarios','Sin horarios','Despues de las 16','Despues de las 16','Despues de las 19:30','No','Despues de las 15','Sin horarios',1),(29,'Pronotti Agustín / Bárcena Gastón ','gastonhbar1181@gmail.com','3584337689','masculino-c','Todo el día ','Todo el día ','Desde las 17 hs','Desde las 18 hs ','Desde las 21 ','No','Desde las 20 30 hs ','Todo el día ',1),(30,'Luciana Centeno / Florencia Ortiz ','florortizcenteno@hotmail.com','3584903283','femenino-c','No podemos ','No podemos ','No podemos ','Por la mañana a las 9:30 o a partir de las 14:30 ','Por la mañana a las 9:30 o a partir de las 18','No podemos ','Por la mañana a las 9:30 o a partir de las 18','Disponibles ',1),(31,'Oscar Tardivo / Javier bertonatti ','tardivooscarariel@gmail.com','3584923450','masculino-b','No podemos','No podemos','Puedo empezar a jugar 14.30','Después de las 18.30','No puedo','Después de las 18.30','Puedo jugar 15.30','Después de las 15',1),(32,'Lucas Witowski / Rivera German ','ninayger@gmail.com','3534253135','masculino-d','Solo a la mañana temprano ','Por la tarde únicamente ','Después de las 18 ','Después de las 18 ','Después de las 18 ','No puedo ','Después de las 18 ','Por la tarde ',1),(35,'Julieta Loser / Alina Oviedo Bruhn','ali_bruhn@hotmail.com','3585481172','femenino-c','No podemos jugar ese día','Todo el día ','A partir de las 19 hs','A partir de las 19 hs','En lo posible no jugar este día, de no ser posible.. a partir de las 19 hs','A partir de las 19 hs','A partir de las 16 hs','En lo posible por la mañana',1),(37,'Cerutti Banchi / Andreazzini Eliana','eliandreazzini@gmail.com','3544406777','femenino-d','Desde de 15hs','Después de 15hs ','Puedo empezar a jugar 16hs debo terminar a las 19hs','Puedo empezar a jugar 16hs debo terminar a las 19hs','Puedo empezar a jugar 16hs debo terminar a las 19hs','Puedo empezar a jugar 16hs debo terminar a las 19hs','Puedo empezar a jugar 16hs debo terminar a las 19hs','Después de las 14hs',1),(38,'Tomas Stefani / Franco Giacone','tomasstefani2000@gmail.com','3585481185','masculino-b','No podemos','No podemos ','A partir de las 19','A partir de las 19','A partir de las 19','A partir de las 19','A partir de las 19','Todo el dia',1),(39,'Matías sodero / Rubén de la rosa ','matymes89@gmail.com','3584361906','masculino-d','No podemos ','No podemos ','No podemos ','Podemos jugar después de las 20:30','Podemos jugar después de las 20:30','Podemos jugar después de las 20:30','Podemos jugar después de las 20:30','Podemos jugar a las 13:30 y terminar como mucho a las 15:30 o después de las 20:00 hs ',1),(40,'Gigena Fernando / Gigena Tadeo','tadeogigena1@gmail.com','3584191489','masculino-e','Por la tarde','Del ½ día en adelante ','Después del ½ día ','Después del ½','Por la tarde','Por la tarde','Por la tarde','Cualquier horario ',1),(41,'Clara Serra / Dalila Barroti','Claraserra87@gmail.com','3583843680','femenino-d','Por la mañana ','Por la mañana y tarde ','Después de las 18','No podemos ','Después de las 18','No podemos ','No podemos ','Por la mañana ',1),(42,'Eguren Magdalena / Ekerman Cecilia','ceciliaekerman.ce@gmail.com','3584186569','femenino-d','No','Todo el dia','Este día no podemos jugar','A partir de las 17 hs','A partir de las 17 hs','A partir de las 17 hs','A partir de las 17 hs','Todo el dia',1),(43,'Victoria cormick / yamile lepore','crayamilelepore@hotmail.com','3584208102','femenino-c','No','No','NO','No','15.30 a 18','15.30 a 18','A la tarde ','Todo el dia',1),(44,'Natalia Diez / Celeste Genghini','natalia_diez22@yahoo.com.ar','3586011226','femenino-c','No podemos jugar','No podemos jugar','No podemos jugar','No podemos ugar','Podemos jugar 18:30','Podemos jugar 20 hs','Podemos jugar 16 hs','Podemos jugar SOLO  por la mañana',1),(45,'Gustavo Gava / Ariel Dominguez','ari.ange@yahoo.com.ar','3584314615','masculino-e','A partir de las 16.30 en adelante ','Todo el día ','A partir de las 16.30 hasta 19 hs','A partir de las 16.30 hasta 19 hs','A partir de las 16.30 hasta 19 hs','A partir de las 16.30 hasta 19 hs','A partir de las 16.30 hasta 19hs','A partir de las 16.30/ hasta las 19 hs ',1),(46,'Diego Villegas / Pachu Ceballos','psc2581980@gmail.com','3585600619','masculino-b','No podemos','No podemos','despues de las 19.30','despues de las 19.30','despues de las 19.30','despues de las 19.30','No podemos','Despues de las 14:00',1),(48,'Josefina Moreno / Ivana Destribats ','Josefinamoreno864@gmail.com','3586000110','femenino-c','Solo podemos jugar por la tarde ','Por la tarde ','podemos jugar desde las 18:30 en adelante ','podemos jugar desde las 19 en adelante ','Podemos jugar por la tarde ','por la tarde','por la tarde','Por la tarde',1),(52,'Tristan Amado / constantin triulzzi ','tristanamado@gmail.com','3584196837','masculino-c','Este día no puedo jugar ','Este día no puedo jugar ','Este día no puedo jugar ','Este día no puedo jugar ','Este día no puedo jugar ','Después 14.30','Después 14.30 ','Después 14.30',1),(53,'Gabriel Izaguirre / Andrés Colombo ','aac_296@hotmail.com','3584292290','masculino-c','Solo puedo jugar a la tarde ','Solo puedo jugar a la tarde','Puedo jugar a partir de las 18 30','Puedo jugar a partir de las 18 30','Puedo jugar a partir de las 18 30','Puedo jugar a partir de las 18 30','Puedo jugar a partir de las 18 30','Puedo jugar a partir de las 18 30',1),(54,'Agostina mores / Sofía cerolini ','agostinamores051109@gmail.com','3585706125','femenino-b','De 12:00 a 19:00','Disponible hasta las 19:00','No puedo ','No puedo ','No puedo','No puedo','No puedo ','Disponible ',1),(55,'Bernardo Rebella / David Rebella ','rebelladavito10@gmail.com','3585103751','masculino-e','Mañana y tarde ','Mañana y tarde ','Después de las 20hs','Después de las 20hs','Después de las 20hs ','Después de las 20hs','Después de las 20hs','Mañana y tarde ',1),(56,'Hernandez Sergio / Hernandez Daniel','dhsrl_danielh@hotmail.com','3584113754','masculino-c','Si podemos','Si podemos ','Podemos hasta las 18hs','Empezando a las 18 hasta las 21hs','Empezando a las 18 hasta las 21hs','Empezando a las 18 hasta las 21hs','Empezando a las 18 hasta las 21hs','Si podemos ',1),(57,'Agustin Tosco / Martin San Millan','msanmillan69@yahoo.com.ar','3585089205','masculino-c','despues de las 18','por la tarde','despues de las 20 30','despues de las 20 30','despues de las 20 30','despues de las 20 30','despues de las 20 30','despues de las 14',1),(58,'Zonni Agustin / Fernandez Diego','zonniagustin@gmail.com','3584029995','masculino-d','No','Todo el dia','A partir de las 18 hs','A partir de las 18 hs','A partir de las 18 hs','A partir de las 18 hs','A partir de las 18 hs','Lo más temprano posible',1),(59,'Martin Ferreyra / Bruno Sereno','Tinchoferreyra97@gmail.com','3585626232','masculino-b','No podemos','No podemos','Desde las 21hrs','No podemos','Desde las 21hrs','No podemos','Desde las 21hrs','A partir de las 12 del mediodía ',1),(60,'Ignacio Ferrero / Matías Carpio','jignacioferrero@gmail.com','3584846072','masculino-c','Por la tarde','Por la tarde','De 14 a 17 podemos jugar','A partir de las 18','No podemos','A partir de las 19','A partir de las 18','Todo el día',1),(61,'Seba pared / Ale aran','sebastianandrespared@gmail.com','3585105277','masculino-b','Desde 14:30 hs','Todo el dia','21 hs','21 hs','21 hs','21hs','21hs','14:30 hs',1),(62,'Shirley dulcich / Belén Enrique ','mariabelenenrique@yahoo.com.ar','3517532323','femenino-d','Todo el dia ','NO','Desde las 17 hs ','Desde las 20:30 ha ','Miércoles desde las 20:30 ','Desde las 18 hs ','Desde las 17 ha ','Todo el día ',1),(63,'Jonathan Tessa / Pablo Bunader','p.bunader@gmail.com','3586011358','masculino-d','cualquier horario','culaquier horario','despues de las 14.30 antes de las 17','despues de las 14.30 antes de las 17','despues de las 14.30 antes de las 17 y despues de las 20','despues de las 14.30 antes de las 17','despues de las 14.30 antes de las 17 y despues de las 20','a partir de las 14',1),(64,'Daniela Magnano/ Gabriela Magnano','gabim_22@hotmail.com','3584015891','femenino-d','No','No','No','De 13 a 19 hs','De 13 a 19 hs','De 13 a 19 hs','Después de las 17 hs','A partir de las 14 hs',1),(65,'Maxi Unanue/ Dario Testa','maximilianounanue@hotmail.com','3584017415','masculino-c','Podemos todo el dia','Es mi cumple No puedo','A partir de las 18 hs','NO PODEMOS EL MARTES 30','A partir de las 18 hs','A partir de las 18 hs','A partir de las 18 hs','Podemos todo el dia',1),(66,'Alaminos Maxi /  Caron Gonzalo','gonzaloo.c@hotmail.com','3584117355','masculino-b','no','no','podemos jugar desde las 20','podemos jugar desde las 18.30','podemos jugar desde las 20','podemos jugar desde las 18.30','podemos jugar desde las 18.30','sin horarios',1),(67,'Ezequiel Acosta / Ferrario Juan','juann.ferrario@hotmail.com','3584856449','masculino-b','no','no','no','no','no','no','A partir de las 15hs','Todo el dia ',1),(68,'Lautaro Sánchez / Emanuel Palmiotto','lautarosanchezmedina9@gmail.com','3585042760','masculino-b','Este día no puedo jugar','este día no puedo jugar','Puedo a partir de las 17hrs','Puedo a partir de las 17hrs','Puedo a partir de las 17hrs','Este día no puedo jugar','puedo a partir de las 17hrs','podemos a la mañana y a la tarde ',1),(69,'Jorgelina Oviedo / Macarena Díaz','macarediaz@gmail.com','2625515099','femenino-d','sin disponibilidad','sin disponibilidad','sin disponibilidad','A partir de las 20 hs','A partir de las 20 hs','A partir de las 20 hs','sin disponibilidad','A partir de las 14:30',1),(70,'Fabio Puebla / Martin Acosta Bocco','ab.martinacostabocco@gmail.com','3584201238','masculino-d','No podemos.-','No podemos.-','Podemos de 17:00 hs. en adelante.-','Podemos a partir de las 21:00 hs.-','Podemos de 17:00 hs. en adelante.-','Podemos a partir de las 21:00 hs.-','Podemos de 17:00 hs. en adelante.-','Podemos todo el día.-',1),(71,'Coria Leo/Helbling Cesar ','cesardelimperio4@gmail.com','3584356707','masculino-c','No','No','Después de las 20hr','Después de las 20hr','Después de las 20hr','Después de las 20hr','Después de las 20hr','A partir de las 10hr',1),(72,'Patricia Novillo / Andrea Piedi','patricianovillo@hotmail.com.ar','3582412369','femenino-b','Sin disponibilidad ','Sin disponibilidad ','De 14 a 17','De 14 a 17','De 14 a 17','De 14 a 17 ','De 14 a 17','Sin problemas de horario',1),(74,'Paula Narciso / Ruth Cooreman ','ruthcooreman@hotmail.com','3585078142','femenino-b','No podemos ','No podemos ','Podemos siesta o tardecita/noche','Podemos siesta y tardecita/nochec','Podemos tardecita/noche','Podemos siesta','Podemos a partir de las 18','Mañana y tarde ',1),(75,'Puebla Mauricio / Fernandes Lucas','pueblamauri@gmail.com','3584239228','masculino-d','Puedo','Piedo','No','20 horas','No','20 horas','No','Puedo',1),(76,'Gerardo Blanco / Javier Suarez','gersofeu@gmail.com','3585123265','masculino-c','No puedo','No puedo ','18:30 a 20:00 hs ','16:00 hs a 20:00 hs ','16:00 hs a 20:00 hs ','17:00 hs a 20:00 hs ','16:00 hs a 20:00 hs ','12:00 hs a 20:00 hs ',1),(77,'Abascal Manuel / Juan Carlos silveyra','abascalmanu@gmail.com','3584024034','masculino-e','Después de las 17','A la tarde hasta las 16','Después de la 16','Después de las 16','Después de las 18','Después de las 16','Después de las 18','Desde las 17',1),(78,'Zabala gaston /  Thuer gaston','gastonthuer@gmail.com','3584174993','masculino-c','No','No','Apartir  de las 18hs','Apartir de las 18hs','Apartir de las 18hs','Aopartir d elas 18hs antes de las 21hs','Apartir de las 18hs antes d elas 21hs','Apartir de las 12hs. Antes tambien es posible',1),(79,'Santiago Losada / Franco Berbe','berbefranco@gmail.com','3585046030','masculino-c','Todo el dia','A la tarde','No se puede',' A la tarde a partir de las 16:00','No puedo','A la tarde a partir de las 16:00','A partir de las 20:00','Todo el dia',1),(80,'Osella Micaela / Osella Antonella','que_llueva@hotmail.com','3584015277','femenino-c','Todo el dia','Por la mañana','hasta las 15:30','hasta las 15:30','Solo por la mañana','hasta las 15:30','Hasta las 15:30','Todo el dia',1),(81,'Victoria Perez Rama / Carola Semprini','perezramav@gmail.com','3584120708','femenino-d','No','No','De 13:00 a 15:00 o por la noche de 19:00 en adelante','De 17:30 en adelante','De 21:00 en adelante','Jueves no ','De 13:30 a 18:00hs','Todo el dia ',1),(82,'Mascotena Clara / Sottile Morena','clari.mascotena@gmail.com','3584021170','femenino-c','no podemos','no podemos','Desde las 16','no podemos','Desde las 16','Desde las 18','Desde las 18','A cualquier hora ',1),(83,'Ambar Safadi / Kamila safadi','ambarsafadi@gmail.com','3584862325','femenino-c','No podemos jugar ','No podemos jugar ','No podemos jugar','Podemos empezar a jugar a las 18:30','Podemos empezar a jugar a las 20:30','Podemos empezar a jugar a las18:30','Podemos empezar a jugar a las 17','Podemos todo el día ',1),(84,'Paula Rossaroli / Paola Acevedo','paulabunaroli@gmail.com','3584201496','femenino-c','NO','Todo el dia','desde las 15 antes de las 17','desde las 15 antes de las 17','desde las 15 antes de las 17','desde las 15 antes de las 17','NO','SI',1),(85,'Lorena Sagripanti / Belen Diaz','lorenasilvinasagripanti@gmail.com','3584208397','femenino-d','No podemos','No podemos','No podemos','Podemos a partir de las 18','No podemos','Podemos a partir de las 16','Podemos a partir de las 16','Podemos',1),(86,'Fausto Amaya Palandri/ David Amaya ','davidamaya22_14@hotmail.com','3584292403','masculino-d','No podemos ','No puedo Jugar','No podemos ','Podemos. A partir de las 18:30.','No podemos','No podemos ','A partir de las 17:30','Sólo por la mañana... Después de las 18 hs',1),(87,'Yachino Vanina / Drvar Heidi','vaninayachino3@gmail.com','3584026496','femenino-d','Sin horarios','Sin horarios','Podemos empezar a jugar a las 16 hasta las 19','Podemos empezar a jugar a las 17','Podemos empezar a jugar a las 17','No podemos jugar ese día!','Podemos empezar a jugar a las 17','Podemos empezar a jugar a las 14',1),(88,'Pablo Tonelli y Martín Barrionuevo','martin.barrionuevo@gmail.com','03585083068','masculino-d','después de las 13 hs','Todo el día','después de las 20 hs','después de las 20 hs','después de las 20 hs','después de las 20 hs','después de las 20 hs','despues de las 13 hs',1),(89,'Soledad Aladino - Florencia Martin','florthuer@gmail.com','03584175073','femenino-d','No','No','Desde 16hs','Desde 16hs','Desde 16hs','Desde 16hs','Desde 16hs','Desde las 10hs',1),(90,'5deenero','p.bunader@gmail.com','3586011358','femenino-e','no','no','no','no','no','no','no','si',1);

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
) ENGINE=InnoDB AUTO_INCREMENT=598 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `inscriptos_horarios` */

insert  into `inscriptos_horarios`(`id`,`id_inscripto_fk`,`id_horario_fk`) values (99,123,18),(100,123,19),(101,123,33),(102,123,32),(103,123,39),(104,123,38),(105,123,45),(106,123,44),(107,123,51),(108,123,50),(115,125,26),(116,125,27),(117,125,28),(118,125,31),(119,125,30),(120,125,29),(121,125,37),(122,125,36),(123,125,35),(124,125,43),(125,125,42),(126,125,41),(127,125,49),(128,125,48),(129,125,47),(130,125,25),(131,125,22),(136,127,26),(137,127,27),(138,127,28),(139,127,37),(140,127,36),(141,127,35),(142,127,49),(143,127,48),(144,127,47),(155,129,27),(156,129,28),(157,129,36),(158,129,35),(159,129,48),(160,129,47),(161,130,26),(162,130,27),(163,130,28),(164,130,31),(165,130,30),(166,130,29),(167,130,37),(168,130,36),(169,130,35),(170,130,44),(171,130,43),(172,130,42),(173,130,50),(174,130,49),(175,130,48),(176,130,47),(177,130,20),(178,130,25),(179,130,22),(180,131,27),(181,131,29),(182,131,36),(183,131,41),(184,131,52),(185,131,20),(186,132,18),(187,132,42),(188,132,49),(189,132,22),(190,133,26),(191,133,31),(192,133,37),(193,133,43),(194,133,49),(195,133,25),(196,134,19),(197,134,26),(198,134,32),(199,134,31),(200,134,38),(201,134,37),(202,134,44),(203,134,43),(204,134,50),(205,134,49),(206,135,27),(207,135,28),(208,135,30),(209,135,29),(210,135,36),(211,135,35),(212,135,42),(213,135,41),(214,135,48),(215,135,47),(216,135,25),(217,135,22),(218,136,49),(219,136,48),(220,136,47),(221,136,20),(222,136,25),(234,138,26),(235,138,27),(236,138,29),(237,138,37),(238,138,36),(239,138,49),(240,138,48),(241,138,47),(242,138,20),(243,138,25),(244,138,22),(245,139,19),(246,139,26),(247,139,32),(248,139,31),(249,139,38),(250,139,37),(251,139,44),(252,139,43),(253,139,50),(254,139,49),(255,139,25),(256,139,22),(257,140,28),(258,140,29),(259,140,35),(260,140,41),(261,140,47),(262,140,22),(263,141,28),(264,141,30),(265,141,36),(266,141,35),(267,141,42),(268,141,48),(269,141,47),(270,141,25),(271,141,22),(272,142,26),(273,142,27),(274,142,28),(275,142,31),(276,142,30),(277,142,29),(278,142,37),(279,142,36),(280,142,35),(281,142,43),(282,142,42),(283,142,41),(284,142,49),(285,142,48),(286,142,47),(287,142,25),(288,142,22),(289,143,27),(290,143,30),(291,143,36),(292,143,42),(293,143,48),(294,143,25),(295,144,28),(296,144,29),(297,144,35),(298,144,41),(299,144,47),(300,144,25),(301,145,19),(302,145,26),(303,145,27),(304,145,38),(305,145,37),(306,145,36),(307,145,44),(308,145,43),(309,145,42),(310,145,25),(311,145,22),(327,147,19),(328,147,26),(329,147,27),(330,147,28),(331,147,32),(332,147,31),(333,147,30),(334,147,29),(335,147,38),(336,147,37),(337,147,36),(338,147,35),(339,147,44),(340,147,43),(341,147,42),(342,147,50),(343,147,49),(344,147,48),(345,148,31),(346,148,30),(347,148,29),(348,148,44),(349,148,43),(350,148,42),(351,148,41),(352,148,50),(353,148,49),(354,148,48),(355,148,20),(356,148,25),(357,148,22),(358,149,26),(359,149,32),(360,149,31),(361,149,38),(362,149,37),(363,149,44),(364,149,43),(365,149,50),(366,149,49),(367,149,25),(368,149,22),(387,152,26),(388,152,27),(389,152,28),(390,152,37),(391,152,36),(392,152,35),(393,152,49),(394,152,48),(395,152,47),(396,152,25),(397,152,22),(398,153,36),(399,153,49),(400,153,20),(410,155,26),(411,155,37),(412,155,36),(413,155,43),(414,155,42),(415,155,49),(416,155,48),(417,155,25),(418,155,22),(419,156,18),(420,156,33),(421,156,32),(422,156,31),(423,156,39),(424,156,45),(425,156,50),(426,156,49),(427,156,48),(428,156,47),(429,156,20),(430,156,25),(431,156,22),(432,157,19),(433,157,26),(434,157,49),(435,157,48),(436,157,22),(437,158,19),(438,158,26),(439,158,38),(440,158,37),(441,158,25),(442,158,22),(443,159,18),(444,159,19),(445,159,26),(446,159,40),(447,159,39),(448,159,38),(449,159,37),(450,159,49),(451,159,20),(452,159,25),(453,160,26),(454,160,31),(455,160,37),(456,160,43),(457,160,49),(458,160,22),(459,161,26),(460,161,27),(461,161,28),(462,161,31),(463,161,30),(464,161,29),(465,161,37),(466,161,36),(467,161,35),(468,161,43),(469,161,42),(470,161,41),(471,161,49),(472,161,48),(473,161,47),(474,161,25),(475,161,22),(476,162,28),(477,162,29),(478,162,35),(479,162,41),(480,162,47),(481,162,20),(482,163,26),(483,163,27),(484,163,28),(485,163,31),(486,163,30),(487,163,29),(488,163,37),(489,163,36),(490,163,35),(491,163,43),(492,163,42),(493,163,41),(494,163,49),(495,163,48),(496,163,47),(497,163,25),(498,163,22),(499,151,26),(500,151,27),(501,151,28),(502,151,37),(503,151,36),(504,151,35),(505,151,25),(506,151,22),(507,128,28),(508,128,29),(509,128,35),(510,128,41),(511,128,47),(512,150,28),(513,150,29),(514,150,35),(515,150,41),(516,150,47),(517,164,28),(518,164,31),(519,164,35),(520,164,43),(521,164,49),(522,164,20),(523,165,26),(524,165,31),(525,165,37),(526,165,43),(527,165,49),(528,165,22),(535,167,31),(536,167,43),(537,167,25),(538,168,36),(539,168,35),(540,168,42),(541,168,41),(542,168,48),(543,168,47),(544,168,22),(545,126,30),(546,126,48),(547,126,25),(568,146,31),(569,146,30),(570,146,29),(571,146,43),(572,146,42),(573,146,41),(574,154,27),(575,154,28),(576,154,48),(577,154,47),(578,154,20),(579,154,25),(580,154,22),(582,170,34),(583,170,46),(584,171,34),(585,171,46),(596,172,19),(597,172,26);

/*Table structure for table `llave_avance` */

DROP TABLE IF EXISTS `llave_avance`;

CREATE TABLE `llave_avance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_llave_origen` int NOT NULL,
  `id_llave_destino` int NOT NULL,
  `slot_destino` tinyint NOT NULL COMMENT '1=id_inscripto_1, 2=id_inscripto_2',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_origen_unico` (`id_llave_origen`),
  UNIQUE KEY `uq_destino_slot` (`id_llave_destino`,`slot_destino`),
  CONSTRAINT `fk_llave_avance_destino` FOREIGN KEY (`id_llave_destino`) REFERENCES `llave_eliminacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_llave_avance_origen` FOREIGN KEY (`id_llave_origen`) REFERENCES `llave_eliminacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_slot_destino` CHECK ((`slot_destino` in (1,2)))
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `llave_avance` */

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
) ENGINE=InnoDB AUTO_INCREMENT=226 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Estructura de la llave de eliminación';

/*Data for the table `llave_eliminacion` */

insert  into `llave_eliminacion`(`id`,`id_torneo`,`categoria`,`ronda`,`posicion`,`id_partido`,`id_inscripto_1`,`id_inscripto_2`,`id_grupo_1`,`id_grupo_2`,`ganador_id`,`es_bye`,`created_at`,`updated_at`) values (202,1,'Cat.-D','pre-playoff',4,374,140,144,118,117,144,0,'2026-03-14 05:43:01','2026-03-14 20:10:48'),(203,1,'Cat.-D','pre-playoff',1,375,155,149,115,116,149,0,'2026-03-14 05:43:01','2026-03-14 20:07:23'),(204,1,'Cat.-D','cuartos',1,378,162,149,118,116,149,0,'2026-03-14 05:43:01','2026-03-15 02:07:44'),(206,1,'Cat.-D','cuartos',2,376,151,170,117,117,170,0,'2026-03-14 05:43:01','2026-03-15 02:08:12'),(207,1,'Cat.-D','cuartos',3,377,132,139,119,115,132,0,'2026-03-14 05:43:01','2026-03-14 22:27:33'),(208,1,'Cat.-D','cuartos',4,379,123,144,116,NULL,123,0,'2026-03-14 05:43:01','2026-03-14 23:14:22'),(211,1,'Cat.-D','semifinal',1,385,149,170,116,119,170,0,'2026-03-14 05:43:01','2026-03-15 17:49:18'),(212,1,'Cat.-D','semifinal',2,380,132,123,119,116,123,0,'2026-03-14 05:43:01','2026-03-15 17:50:13'),(213,1,'Cat.-D','final',1,387,170,123,119,116,123,0,'2026-03-14 05:43:01','2026-03-15 22:59:37'),(214,1,'Cat.-B','semifinal',1,381,135,129,113,114,135,0,'2026-03-14 23:35:22','2026-03-15 17:55:55'),(215,1,'Cat.-B','semifinal',2,382,154,157,114,113,154,0,'2026-03-14 23:37:09','2026-03-15 17:50:58'),(216,1,'Cat.-B','final',1,386,154,135,113,113,154,0,'2026-03-14 23:37:26','2026-03-15 22:50:09'),(217,1,'Cat.-C1','semifinal',1,383,152,146,122,123,152,0,'2026-03-15 04:12:59','2026-03-15 13:57:32'),(218,1,'Cat.-C1','semifinal',2,384,126,163,123,122,163,0,'2026-03-15 04:15:00','2026-03-15 13:58:22'),(219,1,'Cat.-C1','final',1,388,152,163,122,122,163,0,'2026-03-15 04:15:21','2026-03-15 23:02:14'),(220,1,'Cat.-C2','semifinal',1,389,159,128,120,121,159,0,'2026-03-16 00:14:50','2026-03-16 00:18:12'),(221,1,'Cat.-C2','semifinal',2,390,153,148,121,120,148,0,'2026-03-16 00:16:15','2026-03-16 00:19:44'),(222,1,'Cat.-C2','final',1,391,159,148,120,120,159,0,'2026-03-16 00:16:40','2026-03-16 00:20:44'),(223,1,'Cat.-E','semifinal',1,392,164,160,124,125,164,0,'2026-03-16 00:23:03','2026-03-16 00:25:39'),(224,1,'Cat.-E','semifinal',2,393,156,165,125,124,165,0,'2026-03-16 00:24:12','2026-03-16 00:26:42'),(225,1,'Cat.-E','final',1,394,164,165,124,125,164,0,'2026-03-16 00:24:45','2026-03-16 00:27:45');

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
) ENGINE=InnoDB AUTO_INCREMENT=395 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `partido` */

insert  into `partido`(`id`,`id_horario`,`id_inscriptoL`,`id_inscriptov`,`estado`,`ganador_id`,`sets_local`,`sets_visitante`,`games_local`,`games_visitante`,`tiebreak_local`,`tiebreak_visitante`,`es_bye`,`ronda`) values (318,26,130,142,'jugado',130,2,1,23,20,11,9,0,NULL),(319,30,130,135,'jugado',135,0,2,6,12,NULL,NULL,0,NULL),(320,48,130,154,'jugado',154,0,2,6,12,NULL,NULL,0,NULL),(321,36,142,135,'jugado',142,2,1,19,15,10,7,0,NULL),(322,55,142,154,'jugado',154,0,2,9,13,NULL,NULL,0,NULL),(323,27,135,154,'jugado',135,2,1,17,18,10,8,0,NULL),(324,57,129,157,'jugado',157,0,2,7,13,NULL,NULL,0,NULL),(325,28,129,172,'jugado',129,2,0,12,2,NULL,NULL,0,NULL),(326,55,157,172,'jugado',157,2,0,12,2,NULL,NULL,0,NULL),(327,26,139,138,'jugado',138,1,2,16,19,5,10,0,NULL),(328,37,139,155,'jugado',139,2,0,12,6,NULL,NULL,0,NULL),(329,49,138,155,'jugado',155,0,2,11,14,NULL,NULL,0,NULL),(330,32,125,149,'jugado',149,0,2,3,12,NULL,NULL,0,NULL),(331,38,125,123,'jugado',123,0,2,6,12,NULL,NULL,0,NULL),(332,44,149,123,'jugado',123,0,2,6,12,NULL,NULL,0,NULL),(333,27,151,143,'jugado',151,2,1,18,14,10,6,0,NULL),(334,35,151,144,'jugado',151,2,0,12,3,NULL,NULL,0,NULL),(335,58,143,144,'jugado',144,1,2,15,22,4,10,0,NULL),(336,28,162,140,'jugado',162,2,0,12,6,NULL,NULL,0,NULL),(337,29,162,131,'jugado',162,2,0,12,1,NULL,NULL,0,NULL),(338,NULL,140,131,'wo_local',140,2,0,12,0,NULL,NULL,0,NULL),(339,18,132,170,'jugado',132,2,1,21,20,11,9,0,NULL),(340,NULL,132,171,'wo_local',132,2,0,12,0,NULL,NULL,0,NULL),(341,NULL,170,171,'wo_local',170,2,0,12,0,NULL,NULL,0,NULL),(342,31,147,148,'jugado',148,0,2,8,13,NULL,NULL,0,NULL),(343,43,147,145,'jugado',145,1,2,13,20,5,10,0,NULL),(344,19,147,159,'jugado',159,0,2,7,13,NULL,NULL,0,NULL),(345,54,148,145,'jugado',148,2,0,13,6,NULL,NULL,0,NULL),(346,49,148,159,'jugado',159,0,2,8,12,NULL,NULL,0,NULL),(347,38,145,159,'jugado',159,0,2,5,12,NULL,NULL,0,NULL),(348,41,168,128,'jugado',128,0,2,6,12,NULL,NULL,0,NULL),(349,57,168,158,'jugado',168,2,0,12,7,NULL,NULL,0,NULL),(350,36,168,153,'jugado',153,0,2,5,12,NULL,NULL,0,NULL),(351,55,128,158,'jugado',128,2,1,23,21,11,9,0,NULL),(352,70,128,153,'jugado',153,1,2,14,19,2,10,0,NULL),(353,49,158,153,'jugado',153,0,2,6,12,NULL,NULL,0,NULL),(354,55,163,152,'jugado',152,1,2,13,22,3,10,0,NULL),(355,37,163,127,'jugado',163,2,0,12,6,NULL,NULL,0,NULL),(356,29,163,150,'jugado',163,2,0,12,4,NULL,NULL,0,NULL),(357,53,152,127,'jugado',152,2,0,12,5,NULL,NULL,0,NULL),(358,35,152,150,'jugado',152,2,0,12,2,NULL,NULL,0,NULL),(359,56,127,150,'jugado',127,2,1,17,9,10,1,0,NULL),(360,43,146,167,'jugado',146,2,0,12,3,NULL,NULL,0,NULL),(361,56,146,126,'jugado',126,0,2,9,13,NULL,NULL,0,NULL),(362,68,146,136,'jugado',146,2,1,17,14,10,7,0,NULL),(363,68,167,126,'jugado',126,0,2,3,12,NULL,NULL,0,NULL),(364,56,167,136,'jugado',167,2,1,18,12,10,3,0,NULL),(365,48,126,136,'jugado',126,2,0,12,5,NULL,NULL,0,NULL),(366,57,156,141,'jugado',156,2,0,13,7,NULL,NULL,0,NULL),(367,70,156,164,'jugado',164,0,2,0,12,NULL,NULL,0,NULL),(368,28,141,164,'jugado',164,0,2,5,12,NULL,NULL,0,NULL),(369,35,165,160,'jugado',165,2,1,19,13,10,3,0,NULL),(370,26,165,133,'jugado',165,2,0,12,4,NULL,NULL,0,NULL),(371,31,160,133,'jugado',160,2,0,12,5,NULL,NULL,0,NULL),(374,54,140,144,'jugado',144,1,2,15,20,6,10,0,'pre-playoff'),(375,54,155,149,'jugado',149,1,2,15,19,9,11,0,'pre-playoff'),(376,68,151,170,'jugado',170,0,2,7,12,NULL,NULL,0,'cuartos'),(377,56,132,139,'jugado',132,2,1,20,15,10,7,0,'cuartos'),(378,57,162,149,'jugado',149,0,2,7,12,NULL,NULL,0,'cuartos'),(379,56,123,144,'jugado',123,2,0,12,2,NULL,NULL,0,'cuartos'),(380,72,132,123,'jugado',123,1,2,22,24,9,11,0,'semifinal'),(381,73,135,129,'jugado',135,2,1,20,16,10,8,0,'semifinal'),(382,73,154,157,'jugado',154,2,0,13,8,NULL,NULL,0,'semifinal'),(383,74,152,146,'jugado',152,2,1,21,14,10,5,0,'semifinal'),(384,74,126,163,'jugado',163,0,2,6,12,NULL,NULL,0,'semifinal'),(385,72,149,170,'jugado',170,1,2,15,19,7,10,0,'semifinal'),(386,76,154,135,'jugado',154,2,0,12,7,NULL,NULL,0,'final'),(387,76,170,123,'jugado',123,1,2,17,21,7,10,0,'final'),(388,75,152,163,'jugado',163,0,2,7,12,NULL,NULL,0,'final'),(389,73,159,128,'jugado',159,2,1,17,15,10,6,0,'semifinal'),(390,73,153,148,'jugado',148,1,2,16,19,7,10,0,'semifinal'),(391,76,159,148,'jugado',159,2,1,20,19,10,7,0,'final'),(392,72,164,160,'jugado',164,2,0,12,7,NULL,NULL,0,'semifinal'),(393,72,156,165,'jugado',165,1,2,21,24,12,14,0,'semifinal'),(394,75,164,165,'jugado',164,2,0,12,3,NULL,NULL,0,'final');

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
