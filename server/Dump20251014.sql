-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: lordmind
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `assignment_number` varchar(50) NOT NULL,
  `assignment_topic` varchar(255) NOT NULL,
  `department_id` int NOT NULL,
  `description` text,
  `total_marks` decimal(5,2) DEFAULT '100.00',
  `passing_marks` decimal(5,2) DEFAULT '40.00',
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  KEY `idx_assignment_dept` (`department_id`),
  KEY `idx_assignment_dates` (`start_date`,`end_date`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `colleges`
--

DROP TABLE IF EXISTS `colleges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colleges` (
  `college_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `college_address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`college_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colleges`
--

LOCK TABLES `colleges` WRITE;
/*!40000 ALTER TABLE `colleges` DISABLE KEYS */;
INSERT INTO `colleges` VALUES (11,'ABC College',NULL,'2025-10-13 17:51:28'),(12,'XYZ University',NULL,'2025-10-13 17:51:28'),(13,'KGISL Institute','14/02 Marutham Nagar','2025-10-13 19:25:55');
/*!40000 ALTER TABLE `colleges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `department_id` int NOT NULL AUTO_INCREMENT,
  `department_name` varchar(255) NOT NULL,
  `college_id` int NOT NULL,
  `department_code` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `department_code` (`department_code`),
  KEY `idx_dept_code` (`department_code`),
  KEY `college_id` (`college_id`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`college_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (11,'B.Sc Computer Science',11,'BSCS',1,'2025-10-13 17:52:13','2025-10-13 17:52:13'),(12,'BSc Physics',12,'BSPHYS',1,'2025-10-13 17:52:13','2025-10-13 17:52:13'),(13,'BSc Physics',13,'BSC 13',1,'2025-10-13 19:25:55','2025-10-13 19:25:55');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `question_type`
--

DROP TABLE IF EXISTS `question_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_type` (
  `question_type_id` int NOT NULL AUTO_INCREMENT,
  `question_type` enum('mcq','fill_blank','match','rearrange','rewrite','own_response','one_word','true_false','pronunciation') NOT NULL,
  PRIMARY KEY (`question_type_id`),
  UNIQUE KEY `question_type` (`question_type`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `question_type`
--

LOCK TABLES `question_type` WRITE;
/*!40000 ALTER TABLE `question_type` DISABLE KEYS */;
INSERT INTO `question_type` VALUES (1,'mcq'),(2,'fill_blank'),(3,'match'),(4,'rearrange'),(5,'rewrite'),(6,'own_response'),(7,'one_word'),(8,'true_false'),(9,'pronunciation');
/*!40000 ALTER TABLE `question_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `question_id` int NOT NULL AUTO_INCREMENT,
  `test_scope` enum('assignment','sub_topic') NOT NULL DEFAULT 'assignment',
  `reference_id` int NOT NULL,
  `question_type_id` int NOT NULL,
  `question_text` text NOT NULL,
  `question_data` json DEFAULT NULL,
  `marks` decimal(5,2) DEFAULT '1.00',
  `order_no` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`question_id`),
  KEY `question_type_id` (`question_type_id`),
  KEY `idx_test_scope_ref` (`test_scope`,`reference_id`),
  CONSTRAINT `questions_ibfk_2` FOREIGN KEY (`question_type_id`) REFERENCES `question_type` (`question_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES (45,'assignment',11,1,'Fluency mainly refers to the ability to speak ______.','{\"options\": [\"quickly and smoothly\", \"slowly but correctly\", \"loudly and clearly\", \"with perfect grammar\"], \"correct_answer\": \"quickly and smoothly\"}',1.00,1,'2025-10-12 14:03:14','2025-10-12 14:03:14'),(46,'assignment',11,2,'Fluency is about the ______ of speech.','{\"sentence\": \"Fluency is about the ______ of speech.\", \"correct_answers\": [\"flow\"]}',1.00,2,'2025-10-12 14:03:14','2025-10-12 14:03:14'),(47,'assignment',11,3,'Match the following','{\"column_a\": [\"Fluency\", \"Accuracy\", \"Articulation\"], \"column_b\": [\"Smooth flow\", \"Correct grammar\", \"Clear pronunciation\"], \"correct_pairs\": {\"Fluency\": \"Smooth flow\", \"Accuracy\": \"Correct grammar\", \"Articulation\": \"Clear pronunciation\"}}',1.00,3,'2025-10-12 14:03:14','2025-10-12 14:03:14'),(48,'assignment',11,6,'How can you improve your fluency in English?','{\"expected_keywords\": [\"practice\", \"daily\", \"conversation\"]}',2.00,4,'2025-10-12 14:03:14','2025-10-12 14:03:14'),(49,'assignment',11,8,'Fluency means speaking without hesitation and with a natural flow.','{\"statement\": \"Fluency means speaking without hesitation and with a natural flow.\", \"correct_answer\": true}',1.00,5,'2025-10-12 14:03:14','2025-10-12 14:03:14'),(50,'assignment',11,7,'The ability to speak smoothly and continuously without frequent pauses.','{\"definition\": \"The ability to speak smoothly and continuously without frequent pauses.\", \"correct_answer\": \"Fluency\"}',1.00,6,'2025-10-12 14:03:14','2025-10-12 14:03:14'),(51,'assignment',12,1,'Fluency mainly refers to the ability to speak ______.','{\"options\": [\"quickly and smoothly\", \"slowly but correctly\", \"loudly and clearly\", \"with perfect grammar\"], \"correct_answer\": \"quickly and smoothly\"}',1.00,1,'2025-10-12 14:44:47','2025-10-12 14:44:47'),(52,'assignment',12,2,'Fluency is about the ______ of speech.','{\"sentence\": \"Fluency is about the ______ of speech.\", \"correct_answers\": [\"flow\"]}',1.00,2,'2025-10-12 14:44:47','2025-10-12 14:44:47'),(53,'assignment',12,3,'Match the following','{\"column_a\": [\"Fluency\", \"Accuracy\", \"Articulation\"], \"column_b\": [\"Smooth flow\", \"Correct grammar\", \"Clear pronunciation\"], \"correct_pairs\": {\"Fluency\": \"Smooth flow\", \"Accuracy\": \"Correct grammar\", \"Articulation\": \"Clear pronunciation\"}}',1.00,3,'2025-10-12 14:44:47','2025-10-12 14:44:47'),(54,'assignment',12,6,'How can you improve your fluency in English?','{\"expected_keywords\": [\"practice\", \"daily\", \"conversation\"]}',2.00,4,'2025-10-12 14:44:47','2025-10-12 14:44:47'),(55,'assignment',12,8,'Fluency means speaking without hesitation and with a natural flow.','{\"statement\": \"Fluency means speaking without hesitation and with a natural flow.\", \"correct_answer\": true}',1.00,5,'2025-10-12 14:44:47','2025-10-12 14:44:47'),(56,'assignment',12,7,'The ability to speak smoothly and continuously without frequent pauses.','{\"definition\": \"The ability to speak smoothly and continuously without frequent pauses.\", \"correct_answer\": \"Fluency\"}',1.00,6,'2025-10-12 14:44:47','2025-10-12 14:44:47'),(57,'sub_topic',6,1,'Fluency mainly refers to the ability to speak ______.','{\"options\": [\"quickly and smoothly\", \"slowly but correctly\", \"loudly and clearly\", \"with perfect grammar\"], \"correct_answer\": \"quickly and smoothly\"}',1.00,1,'2025-10-12 14:48:07','2025-10-12 14:48:07'),(58,'sub_topic',6,2,'Fluency is about the ______ of speech.','{\"sentence\": \"Fluency is about the ______ of speech.\", \"correct_answers\": [\"flow\"]}',1.00,2,'2025-10-12 14:48:07','2025-10-12 14:48:07'),(59,'sub_topic',6,3,'Match the following','{\"column_a\": [\"Fluency\", \"Accuracy\", \"Articulation\"], \"column_b\": [\"Smooth flow\", \"Correct grammar\", \"Clear pronunciation\"], \"correct_pairs\": {\"Fluency\": \"Smooth flow\", \"Accuracy\": \"Correct grammar\", \"Articulation\": \"Clear pronunciation\"}}',1.00,3,'2025-10-12 14:48:07','2025-10-12 14:48:07'),(60,'sub_topic',6,6,'How can you improve your fluency in English?','{\"expected_keywords\": [\"practice\", \"daily\", \"conversation\"]}',2.00,4,'2025-10-12 14:48:07','2025-10-12 14:48:07'),(61,'sub_topic',6,8,'Fluency means speaking without hesitation and with a natural flow.','{\"statement\": \"Fluency means speaking without hesitation and with a natural flow.\", \"correct_answer\": true}',1.00,5,'2025-10-12 14:48:07','2025-10-12 14:48:07'),(62,'sub_topic',6,7,'The ability to speak smoothly and continuously without frequent pauses.','{\"definition\": \"The ability to speak smoothly and continuously without frequent pauses.\", \"correct_answer\": \"Fluency\"}',1.00,6,'2025-10-12 14:48:07','2025-10-12 14:48:07');
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `name` enum('super_admin','admin','administrator','teacher','student') NOT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'super_admin'),(2,'admin'),(3,'administrator'),(4,'teacher'),(5,'student');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_topics`
--

DROP TABLE IF EXISTS `sub_topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sub_topics` (
  `sub_topic_id` int NOT NULL AUTO_INCREMENT,
  `topic_id` int NOT NULL,
  `sub_topic_name` varchar(255) NOT NULL,
  `sub_topic_order` int DEFAULT '1',
  `overview_video_url` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `overview_content` longtext,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`sub_topic_id`),
  KEY `idx_subtopic_topic` (`topic_id`),
  KEY `idx_subtopic_order` (`topic_id`,`sub_topic_order`),
  CONSTRAINT `sub_topics_ibfk_1` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`topic_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_topics`
--

LOCK TABLES `sub_topics` WRITE;
/*!40000 ALTER TABLE `sub_topics` DISABLE KEYS */;
/*!40000 ALTER TABLE `sub_topics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topics`
--

DROP TABLE IF EXISTS `topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `topics` (
  `topic_id` int NOT NULL AUTO_INCREMENT,
  `department_id` int NOT NULL,
  `topic_name` varchar(255) NOT NULL,
  `topic_number` varchar(50) DEFAULT NULL,
  `total_sub_topics` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`topic_id`),
  KEY `idx_topic_dept` (`department_id`),
  KEY `idx_topic_name` (`topic_name`),
  CONSTRAINT `topics_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topics`
--

LOCK TABLES `topics` WRITE;
/*!40000 ALTER TABLE `topics` DISABLE KEYS */;
/*!40000 ALTER TABLE `topics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `college_id` int NOT NULL,
  `department_id` int DEFAULT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username` (`username`),
  KEY `idx_role` (`role_id`),
  KEY `idx_college` (`college_id`),
  KEY `idx_dept` (`department_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`college_id`) ON DELETE RESTRICT,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (3,'21AIB38','$2b$12$opwE8leFuOExofLbsI9Mf.L7ApAWfzMDtQAot5vD03/rbTovxxlkm','John Doe',11,11,5,1,'2025-10-13 18:01:45','2025-10-13 18:01:45'),(4,'21AIB56','$2b$12$hoGiXQcIjbBlOx0i/VYSb..cwhP4tcnW4L7iGBEpZlW5lih7Uv39a','Jane Smith',11,11,5,1,'2025-10-13 18:01:45','2025-10-13 18:01:45'),(5,'21AIB57','$2b$12$7VDvkQA.Vkr8rennVApXbeYl7LXxku.F7lySELouhOziiwkwZcGTi','Alice Johnson',12,12,5,1,'2025-10-13 18:01:45','2025-10-13 18:01:45'),(6,'21AIB55','$2b$12$vRlP1/cIN3SiljvMIaaWeePIBV7yh2PRzS3P11QpLFy5EF6Snn.Uu','Bob Wilson',11,11,5,1,'2025-10-13 18:01:46','2025-10-13 18:01:45'),(7,'21AIB60','$2b$12$tkE6oSyt3PY3cx6YdK7x8eSGhhw2oPhJOqLkol/gQ.MJhcJE8Ypim','Carol Lee',12,12,5,1,'2025-10-13 18:01:46','2025-10-13 18:01:45');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-14  0:57:35
