/*
SQLyog Ultimate v11.11 (64 bit)
MySQL - 8.0.45-0ubuntu0.22.04.1 : Database - copiabunfer
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`copiabunfer` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `copiabunfer`;

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

insert  into `partido`(`id`,`id_horario`,`id_inscriptoL`,`id_inscriptov`,`estado`,`ganador_id`,`sets_local`,`sets_visitante`,`games_local`,`games_visitante`,`tiebreak_local`,`tiebreak_visitante`,`es_bye`,`ronda`) values (318,26,130,142,'jugado',130,2,1,23,20,11,9,0,NULL),(319,30,130,135,'jugado',135,0,2,6,12,NULL,NULL,0,NULL),(320,48,130,154,'jugado',154,0,2,6,12,NULL,NULL,0,NULL),(321,36,142,135,'jugado',142,2,1,19,15,10,7,0,NULL),(322,55,142,154,'jugado',154,0,2,9,13,NULL,NULL,0,NULL),(323,27,135,154,'jugado',135,2,1,17,18,10,8,0,NULL),(324,57,129,157,'jugado',157,0,2,7,13,NULL,NULL,0,NULL),(325,28,129,172,'jugado',129,2,0,12,2,NULL,NULL,0,NULL),(326,55,157,172,'jugado',157,2,0,12,2,NULL,NULL,0,NULL),(327,26,139,138,'jugado',138,1,2,16,19,5,10,0,NULL),(328,37,139,155,'jugado',139,2,0,12,6,NULL,NULL,0,NULL),(329,49,138,155,'jugado',155,0,2,11,14,NULL,NULL,0,NULL),(330,32,125,149,'jugado',149,0,2,3,12,NULL,NULL,0,NULL),(331,38,125,123,'jugado',123,0,2,6,12,NULL,NULL,0,NULL),(332,44,149,123,'jugado',123,0,2,6,12,NULL,NULL,0,NULL),(333,27,151,143,'jugado',151,2,1,18,14,10,6,0,NULL),(334,35,151,144,'jugado',151,2,0,12,3,NULL,NULL,0,NULL),(335,58,143,144,'jugado',144,1,2,15,22,4,10,0,NULL),(336,28,162,140,'jugado',162,2,0,12,6,NULL,NULL,0,NULL),(337,29,162,131,'jugado',162,2,0,12,1,NULL,NULL,0,NULL),(338,NULL,140,131,'wo_local',140,2,0,12,0,NULL,NULL,0,NULL),(339,18,132,170,'jugado',132,2,1,21,20,11,9,0,NULL),(340,NULL,132,171,'wo_local',132,2,0,12,0,NULL,NULL,0,NULL),(341,NULL,170,171,'wo_local',170,2,0,12,0,NULL,NULL,0,NULL),(342,31,147,148,'jugado',148,0,2,8,13,NULL,NULL,0,NULL),(343,43,147,145,'jugado',145,1,2,13,20,5,10,0,NULL),(344,19,147,159,'jugado',159,0,2,7,13,NULL,NULL,0,NULL),(345,54,148,145,'jugado',148,2,0,13,6,NULL,NULL,0,NULL),(346,49,148,159,'jugado',159,0,2,8,12,NULL,NULL,0,NULL),(347,38,145,159,'jugado',159,0,2,5,12,NULL,NULL,0,NULL),(348,41,168,128,'jugado',128,0,2,6,12,NULL,NULL,0,NULL),(349,57,168,158,'jugado',168,2,0,12,7,NULL,NULL,0,NULL),(350,36,168,153,'jugado',153,0,2,5,12,NULL,NULL,0,NULL),(351,55,128,158,'jugado',128,2,1,23,21,11,9,0,NULL),(352,70,128,153,'jugado',153,1,2,14,19,2,10,0,NULL),(353,49,158,153,'jugado',153,0,2,6,12,NULL,NULL,0,NULL),(354,55,163,152,'jugado',152,1,2,13,22,3,10,0,NULL),(355,37,163,127,'jugado',163,2,0,12,6,NULL,NULL,0,NULL),(356,29,163,150,'jugado',163,2,0,12,4,NULL,NULL,0,NULL),(357,53,152,127,'jugado',152,2,0,12,5,NULL,NULL,0,NULL),(358,35,152,150,'jugado',152,2,0,12,2,NULL,NULL,0,NULL),(359,56,127,150,'jugado',127,2,1,17,9,10,1,0,NULL),(360,43,146,167,'jugado',146,2,0,12,3,NULL,NULL,0,NULL),(361,56,146,126,'jugado',126,0,2,9,13,NULL,NULL,0,NULL),(362,68,146,136,'jugado',146,2,1,17,14,10,7,0,NULL),(363,68,167,126,'jugado',126,0,2,3,12,NULL,NULL,0,NULL),(364,56,167,136,'jugado',167,2,1,18,12,10,3,0,NULL),(365,48,126,136,'jugado',126,2,0,12,5,NULL,NULL,0,NULL),(366,57,156,141,'jugado',156,2,0,13,7,NULL,NULL,0,NULL),(367,70,156,164,'jugado',164,0,2,0,12,NULL,NULL,0,NULL),(368,28,141,164,'jugado',164,0,2,5,12,NULL,NULL,0,NULL),(369,35,165,160,'jugado',165,2,1,19,13,10,3,0,NULL),(370,26,165,133,'jugado',165,2,0,12,4,NULL,NULL,0,NULL),(371,31,160,133,'jugado',160,2,0,12,5,NULL,NULL,0,NULL),(374,64,140,144,'jugado',144,1,2,15,20,6,10,0,'pre-playoff'),(375,64,155,149,'jugado',149,1,2,15,19,9,11,0,'pre-playoff'),(376,69,151,170,'jugado',170,0,2,7,12,NULL,NULL,0,'cuartos'),(377,64,132,139,'jugado',132,2,1,20,15,10,7,0,'cuartos'),(378,71,162,149,'jugado',149,0,2,7,12,NULL,NULL,0,'cuartos'),(379,65,123,144,'jugado',123,2,0,12,2,NULL,NULL,0,'cuartos'),(380,72,132,123,'jugado',123,1,2,22,24,9,11,0,'semifinal'),(381,73,135,129,'jugado',135,2,1,20,16,10,8,0,'semifinal'),(382,73,154,157,'jugado',154,2,0,13,8,NULL,NULL,0,'semifinal'),(383,74,152,146,'jugado',152,2,1,21,14,10,5,0,'semifinal'),(384,74,126,163,'jugado',163,0,2,6,12,NULL,NULL,0,'semifinal'),(385,72,149,170,'jugado',170,1,2,15,19,7,10,0,'semifinal'),(386,76,154,135,'jugado',154,2,0,12,7,NULL,NULL,0,'final'),(387,76,170,123,'jugado',123,1,2,17,21,7,10,0,'final'),(388,75,152,163,'jugado',163,0,2,7,12,NULL,NULL,0,'final'),(389,73,159,128,'jugado',159,2,1,17,15,10,6,0,'semifinal'),(390,73,153,148,'jugado',148,1,2,16,19,7,10,0,'semifinal'),(391,76,159,148,'jugado',159,2,1,20,19,10,7,0,'final'),(392,72,164,160,'jugado',164,2,0,12,7,NULL,NULL,0,'semifinal'),(393,72,156,165,'jugado',165,1,2,21,24,12,14,0,'semifinal'),(394,75,164,165,'jugado',164,2,0,12,3,NULL,NULL,0,'final');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
