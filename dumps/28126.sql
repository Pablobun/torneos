/*
SQLyog Ultimate v11.11 (64 bit)
MySQL - 8.0.44-0ubuntu0.22.04.2 : Database - bunfer
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
  PRIMARY KEY (`id`),
  KEY `id_torneo_fk` (`id_torneo_fk`),
  CONSTRAINT `horarios_ibfk_1` FOREIGN KEY (`id_torneo_fk`) REFERENCES `torneos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3;

/*Data for the table `horarios` */

insert  into `horarios`(`id`,`id_torneo_fk`,`dia_semana`,`fecha`,`hora_inicio`,`Canchas`,`activo`) values (1,1,'Martes','2026-03-10','14:00:00',4,1),(2,1,'Lunes','2026-03-09','18:30:00',4,1),(3,1,'Lunes','2026-03-09','17:00:00',4,1),(5,1,'Martes','2026-03-10','15:30:00',4,1),(6,1,'Martes','2026-03-10','20:00:00',4,1),(7,1,'Lunes','2026-03-09','15:30:00',4,1),(8,1,'Lunes','2026-03-09','20:00:00',4,1),(9,1,'Lunes','2026-03-09','14:00:00',4,1);

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
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb3;

/*Data for the table `inscriptos` */

insert  into `inscriptos`(`id`,`id_torneo_fk`,`correo`,`integrantes`,`telefono`,`categoria`,`acepto`) values (95,2,'alsdjaksljd','MAL','768768','Categoria-C',1),(99,1,'a,sjdhakjkd@sadalkskjdl.com','PEDRO LEMO / JUANA VIALE','23725725376','Categoria-b',1);

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `inscriptos_horarios` */

insert  into `inscriptos_horarios`(`id`,`id_inscripto_fk`,`id_horario_fk`) values (8,99,9),(9,99,6);

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

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
