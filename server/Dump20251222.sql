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
-- Table structure for table `assignment_marks`
--

DROP TABLE IF EXISTS `assignment_marks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignment_marks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `assignment_id` int NOT NULL,
  `marks_obtained` decimal(5,2) DEFAULT NULL,
  `max_marks` decimal(5,2) DEFAULT NULL,
  `graded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `assignment_id` (`assignment_id`),
  CONSTRAINT `assignment_marks_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `assignment_marks_ibfk_2` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_marks`
--

LOCK TABLES `assignment_marks` WRITE;
/*!40000 ALTER TABLE `assignment_marks` DISABLE KEYS */;
/*!40000 ALTER TABLE `assignment_marks` ENABLE KEYS */;
UNLOCK TABLES;

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
  `college_id` int DEFAULT NULL,
  `description` text,
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  KEY `idx_assignment_dept` (`department_id`),
  KEY `idx_assignment_dates` (`start_date`,`end_date`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES (1,'1','Verbose',1,1,NULL,'2025-12-21 00:00:00','2025-12-22 00:00:00','questions (1).xlsx','uploads/tests\\assignment\\8162c735-0e07-4321-b98e-d5be908a3cff.xlsx',1,'2025-12-21 16:01:20','2025-12-21 16:01:20');
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
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`college_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colleges`
--

LOCK TABLES `colleges` WRITE;
/*!40000 ALTER TABLE `colleges` DISABLE KEYS */;
INSERT INTO `colleges` VALUES (1,'Kgisl Institute of Technology','14/02 Marutham Nagar','2025-12-21 14:46:04',1);
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
  `department_code` varchar(50) NOT NULL,
  `college_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `college_dept_code` (`college_id`,`department_code`),
  KEY `idx_dept_code` (`department_code`),
  CONSTRAINT `fk_departments_college` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`college_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'AI&DS','AI&D',1,1,'2025-12-21 14:46:04','2025-12-21 14:46:04');
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
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`question_id`),
  KEY `question_type_id` (`question_type_id`),
  KEY `idx_test_scope_ref` (`test_scope`,`reference_id`),
  CONSTRAINT `questions_ibfk_2` FOREIGN KEY (`question_type_id`) REFERENCES `question_type` (`question_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES (1,'sub_topic',1,3,'Match the animals with their sounds','{\"column2\": \"Roars,Meows,Moos,Barks\", \"option_a\": \"Dog\", \"option_b\": \"Cat\", \"option_c\": \"Cow\", \"option_d\": \"Lion\", \"correct_answer\": \"D,B,C,A\"}',1.00,1,'2025-12-21 15:56:03','2025-12-21 15:56:03',1),(2,'sub_topic',1,1,'What is the past tense of \'go\'?','{\"option_a\": \"Go\", \"option_b\": \"Going\", \"option_c\": \"Went\", \"option_d\": \"Goed\", \"correct_answer\": \"Went\"}',1.00,2,'2025-12-21 15:56:03','2025-12-21 15:56:03',1),(3,'sub_topic',1,8,'The sun rises in the east.','{\"option_a\": \"True\", \"option_b\": \"False\", \"correct_answer\": \"True\"}',1.00,3,'2025-12-21 15:56:03','2025-12-21 15:56:03',1),(4,'sub_topic',1,2,'Accuracy is about using correct ______ and ______.','{\"correct_answer\": \"Grammar, Vocabulary\"}',1.00,4,'2025-12-21 15:56:03','2025-12-21 15:56:03',1),(5,'sub_topic',1,9,'Pronounce the given word.','{\"correct_answer\": \"Photography\", \"pronunciation_word\": \"Photography\"}',1.00,5,'2025-12-21 15:56:03','2025-12-21 15:56:03',1),(6,'assignment',1,3,'Match the animals with their sounds','{\"column2\": \"Roars,Meows,Moos,Barks\", \"option_a\": \"Dog\", \"option_b\": \"Cat\", \"option_c\": \"Cow\", \"option_d\": \"Lion\", \"correct_answer\": \"D,B,C,A\"}',1.00,1,'2025-12-21 16:01:20','2025-12-21 16:01:20',1),(7,'assignment',1,1,'What is the past tense of \'go\'?','{\"option_a\": \"Go\", \"option_b\": \"Going\", \"option_c\": \"Went\", \"option_d\": \"Goed\", \"correct_answer\": \"Went\"}',1.00,2,'2025-12-21 16:01:20','2025-12-21 16:01:20',1),(8,'assignment',1,8,'The sun rises in the east.','{\"option_a\": \"True\", \"option_b\": \"False\", \"correct_answer\": \"True\"}',1.00,3,'2025-12-21 16:01:20','2025-12-21 16:01:20',1),(9,'assignment',1,2,'Accuracy is about using correct ______ and ______.','{\"correct_answer\": \"Grammar, Vocabulary\"}',1.00,4,'2025-12-21 16:01:20','2025-12-21 16:01:20',1),(10,'assignment',1,9,'Pronounce the given word.','{\"correct_answer\": \"Photography\", \"pronunciation_word\": \"Photography\"}',1.00,5,'2025-12-21 16:01:20','2025-12-21 16:01:20',1);
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
-- Table structure for table `student_profile`
--

DROP TABLE IF EXISTS `student_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_profile` (
  `profile_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `dob` date DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `github_url` varchar(255) DEFAULT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `resume_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_onboarded` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`profile_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_student_profile_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_profile`
--

LOCK TABLES `student_profile` WRITE;
/*!40000 ALTER TABLE `student_profile` DISABLE KEYS */;
INSERT INTO `student_profile` VALUES (1,1,'2025-04-15','7010604488','https://github.com/sidhuiwnl/','https://github.com/sidhuiwnl/','uploads/resumes\\d4edf0ad-3df2-454b-b971-c96d75caa64e_Latest_Resume.pdf','2025-12-21 15:57:30','2025-12-21 15:57:30',1);
/*!40000 ALTER TABLE `student_profile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_skills`
--

DROP TABLE IF EXISTS `student_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_skills` (
  `skill_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `skill_name` varchar(100) NOT NULL,
  PRIMARY KEY (`skill_id`),
  KEY `fk_student_skills_user` (`user_id`),
  CONSTRAINT `fk_student_skills_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_skills`
--

LOCK TABLES `student_skills` WRITE;
/*!40000 ALTER TABLE `student_skills` DISABLE KEYS */;
INSERT INTO `student_skills` VALUES (1,1,'React');
/*!40000 ALTER TABLE `student_skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_subtopic_progress`
--

DROP TABLE IF EXISTS `student_subtopic_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_subtopic_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `topic_id` int NOT NULL,
  `sub_topic_id` int NOT NULL,
  `is_completed` tinyint(1) DEFAULT '0',
  `score` decimal(5,2) DEFAULT '0.00',
  `time_spent_minutes` int DEFAULT '0',
  `last_accessed` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `topic_id` (`topic_id`),
  KEY `sub_topic_id` (`sub_topic_id`),
  CONSTRAINT `student_subtopic_progress_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `student_subtopic_progress_ibfk_2` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`topic_id`),
  CONSTRAINT `student_subtopic_progress_ibfk_3` FOREIGN KEY (`sub_topic_id`) REFERENCES `sub_topics` (`sub_topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_subtopic_progress`
--

LOCK TABLES `student_subtopic_progress` WRITE;
/*!40000 ALTER TABLE `student_subtopic_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_subtopic_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_test_attempts`
--

DROP TABLE IF EXISTS `student_test_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_test_attempts` (
  `attempt_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `test_scope` enum('assignment','sub_topic') DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `attempt_number` int DEFAULT '1',
  `is_completed` tinyint(1) DEFAULT '0',
  `total_marks` decimal(5,2) DEFAULT NULL,
  `obtained_marks` decimal(5,2) DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `time_spent_minutes` int DEFAULT '0',
  PRIMARY KEY (`attempt_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `student_test_attempts_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_test_attempts`
--

LOCK TABLES `student_test_attempts` WRITE;
/*!40000 ALTER TABLE `student_test_attempts` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_test_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_topic_progress`
--

DROP TABLE IF EXISTS `student_topic_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_topic_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `topic_id` int NOT NULL,
  `completed_sub_topics` int DEFAULT '0',
  `total_sub_topics` int NOT NULL,
  `progress_percent` decimal(5,2) DEFAULT '0.00',
  `average_score` decimal(5,2) DEFAULT '0.00',
  `status` enum('Not Started','Learning Now','Ongoing','Exploring','Completed') DEFAULT 'Not Started',
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `topic_id` (`topic_id`),
  CONSTRAINT `student_topic_progress_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `student_topic_progress_ibfk_2` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_topic_progress`
--

LOCK TABLES `student_topic_progress` WRITE;
/*!40000 ALTER TABLE `student_topic_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_topic_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_topic_marks`
--

DROP TABLE IF EXISTS `sub_topic_marks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sub_topic_marks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `sub_topic_id` int NOT NULL,
  `topic_id` int NOT NULL,
  `college_id` int NOT NULL,
  `department_id` int NOT NULL,
  `marks_obtained` decimal(5,2) DEFAULT NULL,
  `max_marks` decimal(5,2) DEFAULT NULL,
  `attempted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `sub_topic_id` (`sub_topic_id`),
  KEY `topic_id` (`topic_id`),
  KEY `college_id` (`college_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `sub_topic_marks_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `sub_topic_marks_ibfk_2` FOREIGN KEY (`sub_topic_id`) REFERENCES `sub_topics` (`sub_topic_id`),
  CONSTRAINT `sub_topic_marks_ibfk_3` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`topic_id`),
  CONSTRAINT `sub_topic_marks_ibfk_4` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`college_id`),
  CONSTRAINT `sub_topic_marks_ibfk_5` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_topic_marks`
--

LOCK TABLES `sub_topic_marks` WRITE;
/*!40000 ALTER TABLE `sub_topic_marks` DISABLE KEYS */;
/*!40000 ALTER TABLE `sub_topic_marks` ENABLE KEYS */;
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
  `sub_topic_order` int DEFAULT NULL,
  `overview_video_url` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `test_file` varchar(255) DEFAULT NULL,
  `overview_content` longtext,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`sub_topic_id`),
  KEY `topic_id` (`topic_id`),
  CONSTRAINT `sub_topics_ibfk_1` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`topic_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_topics`
--

LOCK TABLES `sub_topics` WRITE;
/*!40000 ALTER TABLE `sub_topics` DISABLE KEYS */;
INSERT INTO `sub_topics` VALUES (1,1,'Past Tense',1,NULL,'questions (1).xlsx','uploads/tests\\sub_topic\\6c825bbf-e129-486c-9d4e-d015b1290b5d.xlsx','<p>This is correct<br></p>',1,'2025-12-21 15:55:34','2025-12-21 15:56:03');
/*!40000 ALTER TABLE `sub_topics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topic_college_department`
--

DROP TABLE IF EXISTS `topic_college_department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `topic_college_department` (
  `id` int NOT NULL AUTO_INCREMENT,
  `topic_id` int NOT NULL,
  `college_id` int NOT NULL,
  `department_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_topic_college_dept` (`topic_id`,`college_id`,`department_id`),
  KEY `fk_tcd_department` (`department_id`),
  CONSTRAINT `fk_tcd_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tcd_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`topic_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topic_college_department`
--

LOCK TABLES `topic_college_department` WRITE;
/*!40000 ALTER TABLE `topic_college_department` DISABLE KEYS */;
INSERT INTO `topic_college_department` VALUES (1,1,1,1,1,'2025-12-21 15:55:10');
/*!40000 ALTER TABLE `topic_college_department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topics`
--

DROP TABLE IF EXISTS `topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `topics` (
  `topic_id` int NOT NULL AUTO_INCREMENT,
  `topic_name` varchar(255) NOT NULL,
  `topic_number` varchar(50) DEFAULT NULL,
  `total_sub_topics` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`topic_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topics`
--

LOCK TABLES `topics` WRITE;
/*!40000 ALTER TABLE `topics` DISABLE KEYS */;
INSERT INTO `topics` VALUES (1,'Tenses',NULL,1,1,'2025-12-21 14:46:23','2025-12-21 15:55:34');
/*!40000 ALTER TABLE `topics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `duration_seconds` int GENERATED ALWAYS AS ((case when (`end_time` is not null) then timestampdiff(SECOND,`start_time`,`end_time`) else NULL end)) STORED,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=319 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
INSERT INTO `user_sessions` (`id`, `user_id`, `start_time`, `end_time`) VALUES (1,1,'2025-12-21 01:54:22',NULL),(2,1,'2025-12-21 01:54:22',NULL),(3,7,'2025-12-21 16:13:20',NULL),(4,7,'2025-12-21 16:13:20',NULL),(5,7,'2025-12-21 16:15:20',NULL),(6,7,'2025-12-21 16:15:20',NULL),(7,7,'2025-12-21 16:21:07',NULL),(8,7,'2025-12-21 16:21:07',NULL),(9,7,'2025-12-21 16:21:42',NULL),(10,7,'2025-12-21 16:21:42',NULL),(11,7,'2025-12-21 16:22:42',NULL),(12,7,'2025-12-21 16:22:42',NULL),(13,7,'2025-12-21 16:27:15',NULL),(14,7,'2025-12-21 16:27:15',NULL),(15,7,'2025-12-21 16:27:20',NULL),(16,7,'2025-12-21 16:27:21',NULL),(17,7,'2025-12-21 16:27:25',NULL),(18,7,'2025-12-21 16:27:25',NULL),(19,7,'2025-12-21 16:30:29',NULL),(20,7,'2025-12-21 16:30:29',NULL),(21,7,'2025-12-21 16:31:15',NULL),(22,7,'2025-12-21 16:31:15',NULL),(23,7,'2025-12-21 16:31:37',NULL),(24,7,'2025-12-21 16:31:37',NULL),(25,7,'2025-12-21 16:37:18',NULL),(26,7,'2025-12-21 16:37:18',NULL),(27,7,'2025-12-21 16:40:23',NULL),(28,7,'2025-12-21 16:40:23',NULL),(29,7,'2025-12-21 16:40:37',NULL),(30,7,'2025-12-21 16:40:37',NULL),(31,7,'2025-12-21 16:40:47',NULL),(32,7,'2025-12-21 16:40:47',NULL),(33,7,'2025-12-21 16:40:57',NULL),(34,7,'2025-12-21 16:40:57',NULL),(35,7,'2025-12-21 16:41:09',NULL),(36,7,'2025-12-21 16:41:09',NULL),(37,7,'2025-12-21 16:41:14',NULL),(38,7,'2025-12-21 16:41:14',NULL),(39,7,'2025-12-21 16:43:15',NULL),(40,7,'2025-12-21 16:43:15',NULL),(41,7,'2025-12-21 16:44:09',NULL),(42,7,'2025-12-21 16:44:09',NULL),(43,7,'2025-12-21 16:44:23',NULL),(44,7,'2025-12-21 16:44:23',NULL),(45,7,'2025-12-21 16:46:00',NULL),(46,7,'2025-12-21 16:46:00',NULL),(47,7,'2025-12-21 16:47:11',NULL),(48,7,'2025-12-21 16:47:11',NULL),(49,7,'2025-12-21 16:47:32',NULL),(50,7,'2025-12-21 16:47:32',NULL),(51,7,'2025-12-21 16:47:40',NULL),(52,7,'2025-12-21 16:47:40',NULL),(53,7,'2025-12-21 16:47:47',NULL),(54,7,'2025-12-21 16:47:47',NULL),(55,7,'2025-12-21 16:48:06',NULL),(56,7,'2025-12-21 16:48:06',NULL),(57,7,'2025-12-21 16:48:11',NULL),(58,7,'2025-12-21 16:48:11',NULL),(59,7,'2025-12-21 16:48:23',NULL),(60,7,'2025-12-21 16:48:23',NULL),(61,7,'2025-12-21 16:48:29',NULL),(62,7,'2025-12-21 16:48:29',NULL),(63,7,'2025-12-21 16:48:37',NULL),(64,7,'2025-12-21 16:48:37',NULL),(65,7,'2025-12-21 16:49:11',NULL),(66,7,'2025-12-21 16:49:11',NULL),(67,7,'2025-12-21 16:53:10',NULL),(68,7,'2025-12-21 16:53:10',NULL),(69,7,'2025-12-21 16:56:55',NULL),(70,7,'2025-12-21 16:56:55',NULL),(71,7,'2025-12-21 16:57:27',NULL),(72,7,'2025-12-21 16:57:27',NULL),(73,7,'2025-12-21 16:57:55',NULL),(74,7,'2025-12-21 16:57:55',NULL),(75,7,'2025-12-21 16:58:05',NULL),(76,7,'2025-12-21 16:58:05',NULL),(77,7,'2025-12-21 16:58:31',NULL),(78,7,'2025-12-21 16:58:31',NULL),(79,7,'2025-12-21 16:58:39',NULL),(80,7,'2025-12-21 16:58:39',NULL),(81,7,'2025-12-21 16:58:53',NULL),(82,7,'2025-12-21 16:58:53',NULL),(83,7,'2025-12-21 16:59:00',NULL),(84,7,'2025-12-21 16:59:00',NULL),(85,7,'2025-12-21 16:59:04',NULL),(86,7,'2025-12-21 16:59:04',NULL),(87,7,'2025-12-21 16:59:10',NULL),(88,7,'2025-12-21 16:59:10',NULL),(89,7,'2025-12-21 16:59:15',NULL),(90,7,'2025-12-21 16:59:15',NULL),(91,7,'2025-12-21 16:59:22',NULL),(92,7,'2025-12-21 16:59:22',NULL),(93,7,'2025-12-21 16:59:34',NULL),(94,7,'2025-12-21 16:59:34',NULL),(95,7,'2025-12-21 17:00:20',NULL),(96,7,'2025-12-21 17:00:20',NULL),(97,7,'2025-12-21 17:03:08',NULL),(98,7,'2025-12-21 17:03:08',NULL),(99,7,'2025-12-21 17:06:53',NULL),(100,7,'2025-12-21 17:06:53',NULL),(101,7,'2025-12-21 17:07:00',NULL),(102,7,'2025-12-21 17:07:00',NULL),(103,7,'2025-12-21 17:07:33',NULL),(104,7,'2025-12-21 17:07:33',NULL),(105,7,'2025-12-21 19:27:30',NULL),(106,7,'2025-12-21 19:27:30',NULL),(107,7,'2025-12-21 19:30:16',NULL),(108,7,'2025-12-21 19:30:16',NULL),(109,7,'2025-12-21 19:31:17',NULL),(110,7,'2025-12-21 19:31:17',NULL),(111,7,'2025-12-21 19:31:36',NULL),(112,7,'2025-12-21 19:31:36',NULL),(113,7,'2025-12-21 19:31:44',NULL),(114,7,'2025-12-21 19:31:44',NULL),(115,7,'2025-12-21 19:31:53',NULL),(116,7,'2025-12-21 19:31:53',NULL),(117,7,'2025-12-21 19:32:08',NULL),(118,7,'2025-12-21 19:32:08',NULL),(119,7,'2025-12-21 19:32:13',NULL),(120,7,'2025-12-21 19:32:13',NULL),(121,7,'2025-12-21 19:32:19',NULL),(122,7,'2025-12-21 19:32:19',NULL),(123,7,'2025-12-21 19:32:24',NULL),(124,7,'2025-12-21 19:32:25',NULL),(125,7,'2025-12-21 19:32:33',NULL),(126,7,'2025-12-21 19:32:33',NULL),(127,7,'2025-12-21 19:32:46',NULL),(128,7,'2025-12-21 19:32:46',NULL),(129,7,'2025-12-21 19:32:54',NULL),(130,7,'2025-12-21 19:32:54',NULL),(131,7,'2025-12-21 19:33:00',NULL),(132,7,'2025-12-21 19:33:00',NULL),(133,7,'2025-12-21 19:33:05',NULL),(134,7,'2025-12-21 19:33:05',NULL),(135,7,'2025-12-21 19:33:09',NULL),(136,7,'2025-12-21 19:33:09',NULL),(137,7,'2025-12-21 19:33:14',NULL),(138,7,'2025-12-21 19:33:14',NULL),(139,7,'2025-12-21 19:33:19',NULL),(140,7,'2025-12-21 19:33:19',NULL),(141,7,'2025-12-21 19:33:29',NULL),(142,7,'2025-12-21 19:33:29',NULL),(143,7,'2025-12-21 19:36:09',NULL),(144,7,'2025-12-21 19:36:09',NULL),(145,7,'2025-12-21 19:36:26',NULL),(146,7,'2025-12-21 19:36:26',NULL),(147,7,'2025-12-21 19:36:45',NULL),(148,7,'2025-12-21 19:36:45',NULL),(149,7,'2025-12-21 19:38:34',NULL),(150,7,'2025-12-21 19:38:34',NULL),(151,7,'2025-12-21 19:38:52',NULL),(152,7,'2025-12-21 19:38:52',NULL),(153,7,'2025-12-21 19:41:32',NULL),(154,7,'2025-12-21 19:41:32',NULL),(155,7,'2025-12-21 19:41:50',NULL),(156,7,'2025-12-21 19:41:50',NULL),(157,7,'2025-12-21 19:42:05',NULL),(158,7,'2025-12-21 19:42:05',NULL),(159,7,'2025-12-21 19:42:19',NULL),(160,7,'2025-12-21 19:42:19',NULL),(161,7,'2025-12-21 19:42:31',NULL),(162,7,'2025-12-21 19:42:31',NULL),(163,7,'2025-12-21 19:43:14',NULL),(164,7,'2025-12-21 19:43:14',NULL),(165,7,'2025-12-21 19:44:05',NULL),(166,7,'2025-12-21 19:44:05',NULL),(167,7,'2025-12-21 19:46:45',NULL),(168,7,'2025-12-21 19:46:45',NULL),(169,7,'2025-12-21 19:47:05',NULL),(170,7,'2025-12-21 19:47:05',NULL),(171,7,'2025-12-21 19:47:22',NULL),(172,7,'2025-12-21 19:47:22',NULL),(173,7,'2025-12-21 19:47:33',NULL),(174,7,'2025-12-21 19:47:33',NULL),(175,7,'2025-12-21 19:47:38',NULL),(176,7,'2025-12-21 19:47:38',NULL),(177,7,'2025-12-21 19:47:42',NULL),(178,7,'2025-12-21 19:47:42',NULL),(179,7,'2025-12-21 19:47:47',NULL),(180,7,'2025-12-21 19:47:47',NULL),(181,7,'2025-12-21 19:47:56',NULL),(182,7,'2025-12-21 19:47:56',NULL),(183,7,'2025-12-21 19:49:31',NULL),(184,7,'2025-12-21 19:49:31',NULL),(185,7,'2025-12-21 19:49:48',NULL),(186,7,'2025-12-21 19:49:48',NULL),(187,7,'2025-12-21 19:49:59',NULL),(188,7,'2025-12-21 19:49:59',NULL),(189,7,'2025-12-21 19:50:09',NULL),(190,7,'2025-12-21 19:50:09',NULL),(191,7,'2025-12-21 19:50:18',NULL),(192,7,'2025-12-21 19:50:19',NULL),(193,7,'2025-12-21 19:50:31',NULL),(194,7,'2025-12-21 19:50:31',NULL),(195,7,'2025-12-21 19:50:55',NULL),(196,7,'2025-12-21 19:50:55',NULL),(197,7,'2025-12-21 19:51:19',NULL),(198,7,'2025-12-21 19:51:19',NULL),(199,7,'2025-12-21 19:52:43',NULL),(200,7,'2025-12-21 19:52:43',NULL),(201,7,'2025-12-21 19:53:03',NULL),(202,7,'2025-12-21 19:53:03',NULL),(203,7,'2025-12-21 19:53:10',NULL),(204,7,'2025-12-21 19:53:10',NULL),(205,7,'2025-12-21 19:53:18',NULL),(206,7,'2025-12-21 19:53:18',NULL),(207,7,'2025-12-21 19:54:40',NULL),(208,7,'2025-12-21 19:54:40',NULL),(209,7,'2025-12-21 19:55:37',NULL),(210,7,'2025-12-21 19:55:37',NULL),(211,7,'2025-12-21 19:57:12',NULL),(212,7,'2025-12-21 19:57:12',NULL),(213,7,'2025-12-21 19:57:27',NULL),(214,7,'2025-12-21 19:57:27',NULL),(215,7,'2025-12-21 20:01:03',NULL),(216,7,'2025-12-21 20:01:03',NULL),(217,7,'2025-12-21 20:05:39',NULL),(218,7,'2025-12-21 20:05:39',NULL),(219,1,'2025-12-21 21:27:36',NULL),(220,1,'2025-12-21 21:27:36',NULL),(221,1,'2025-12-21 21:28:04',NULL),(222,1,'2025-12-21 21:28:04',NULL),(223,1,'2025-12-21 21:28:13',NULL),(224,1,'2025-12-21 21:28:13',NULL),(225,1,'2025-12-21 21:28:23',NULL),(226,1,'2025-12-21 21:28:23',NULL),(227,1,'2025-12-21 21:30:19',NULL),(228,1,'2025-12-21 21:30:19',NULL),(229,1,'2025-12-21 21:31:34',NULL),(230,1,'2025-12-21 21:31:34',NULL),(231,1,'2025-12-21 21:31:57',NULL),(232,1,'2025-12-21 21:31:57',NULL),(233,1,'2025-12-21 21:32:04',NULL),(234,1,'2025-12-21 21:32:04',NULL),(235,1,'2025-12-21 21:32:09',NULL),(236,1,'2025-12-21 21:32:09',NULL),(237,1,'2025-12-21 21:32:18',NULL),(238,1,'2025-12-21 21:32:18',NULL),(239,1,'2025-12-21 21:32:31',NULL),(240,1,'2025-12-21 21:32:31',NULL),(241,1,'2025-12-21 21:32:40',NULL),(242,1,'2025-12-21 21:32:40',NULL),(243,1,'2025-12-21 21:32:51',NULL),(244,1,'2025-12-21 21:32:51',NULL),(245,1,'2025-12-21 21:32:58',NULL),(246,1,'2025-12-21 21:32:58',NULL),(247,1,'2025-12-21 21:33:06',NULL),(248,1,'2025-12-21 21:33:06',NULL),(249,1,'2025-12-21 21:33:13',NULL),(250,1,'2025-12-21 21:33:13',NULL),(251,1,'2025-12-21 21:33:22',NULL),(252,1,'2025-12-21 21:33:22',NULL),(253,1,'2025-12-21 21:33:29',NULL),(254,1,'2025-12-21 21:33:29',NULL),(255,1,'2025-12-21 21:33:34',NULL),(256,1,'2025-12-21 21:33:34',NULL),(257,1,'2025-12-21 21:33:39',NULL),(258,1,'2025-12-21 21:33:39',NULL),(259,1,'2025-12-21 21:33:43',NULL),(260,1,'2025-12-21 21:33:43',NULL),(261,1,'2025-12-21 21:33:46',NULL),(262,1,'2025-12-21 21:33:46',NULL),(263,1,'2025-12-21 21:33:51',NULL),(264,1,'2025-12-21 21:33:51',NULL),(265,1,'2025-12-21 21:33:54',NULL),(266,1,'2025-12-21 21:33:54',NULL),(267,1,'2025-12-21 21:33:59',NULL),(268,1,'2025-12-21 21:33:59',NULL),(269,1,'2025-12-21 21:37:58',NULL),(270,1,'2025-12-21 21:37:58',NULL),(271,1,'2025-12-21 21:38:08',NULL),(272,1,'2025-12-21 21:38:08',NULL),(273,1,'2025-12-21 21:39:18',NULL),(274,1,'2025-12-21 21:39:18',NULL),(275,1,'2025-12-21 21:46:39',NULL),(276,1,'2025-12-21 21:46:39',NULL),(277,1,'2025-12-21 21:47:01',NULL),(278,1,'2025-12-21 21:47:01',NULL),(279,1,'2025-12-21 21:47:28',NULL),(280,1,'2025-12-21 21:47:28',NULL),(281,1,'2025-12-21 21:47:34',NULL),(282,1,'2025-12-21 21:47:34',NULL),(283,1,'2025-12-21 21:47:35',NULL),(284,1,'2025-12-21 21:47:35',NULL),(285,1,'2025-12-21 21:49:23',NULL),(286,1,'2025-12-21 21:49:23',NULL),(287,1,'2025-12-21 21:49:32',NULL),(288,1,'2025-12-21 21:49:32',NULL),(289,1,'2025-12-21 21:57:10',NULL),(290,1,'2025-12-21 21:57:10',NULL),(291,1,'2025-12-21 21:57:28',NULL),(292,1,'2025-12-21 21:57:28',NULL),(293,1,'2025-12-21 21:57:34',NULL),(294,1,'2025-12-21 21:57:34',NULL),(295,1,'2025-12-21 21:57:38',NULL),(296,1,'2025-12-21 21:57:39',NULL),(297,1,'2025-12-21 21:57:45',NULL),(298,1,'2025-12-21 21:57:45',NULL),(299,1,'2025-12-21 21:57:56',NULL),(300,1,'2025-12-21 21:57:56',NULL),(301,1,'2025-12-21 21:58:05',NULL),(302,1,'2025-12-21 21:58:05',NULL),(303,1,'2025-12-21 21:58:13',NULL),(304,1,'2025-12-21 21:58:13',NULL),(305,1,'2025-12-21 21:58:20',NULL),(306,1,'2025-12-21 21:58:20',NULL),(307,1,'2025-12-21 21:58:28',NULL),(308,1,'2025-12-21 21:58:28',NULL),(309,1,'2025-12-21 21:58:35',NULL),(310,1,'2025-12-21 21:58:35',NULL),(311,1,'2025-12-21 21:58:41',NULL),(312,1,'2025-12-21 21:58:41',NULL),(313,1,'2025-12-21 22:10:30',NULL),(314,1,'2025-12-21 22:10:30',NULL),(315,1,'2025-12-21 22:15:24','2025-12-21 22:15:25'),(316,1,'2025-12-21 22:15:25','2025-12-21 22:15:25'),(317,1,'2025-12-21 22:49:53','2025-12-21 22:49:53'),(318,1,'2025-12-21 22:49:53','2025-12-21 22:49:53');
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
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
  `email` varchar(255) DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT NULL,
  `last_logout` datetime DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username` (`username`),
  KEY `idx_role` (`role_id`),
  KEY `idx_college` (`college_id`),
  KEY `idx_dept` (`department_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`college_id`) ON DELETE RESTRICT,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'21AIB38','$2b$12$Yn2Nm7FNiUoZwgVZgrfASuI9SJjuYmVvDnmxqh16AJCggohJgCN96','Sidharth','sidharthinfernal@gmail.com',1,1,5,1,'2025-12-20 19:16:23','2025-12-21 16:07:51','2025-12-21 21:37:52','2025-12-21 21:34:19',NULL),(2,'21AIB30','$2b$12$/snUBOrS3uj6iC88mfq6b.eMNk/u9cGCnfSXrj.cf9gBu8PXbLHSq','Sidhu',NULL,1,1,5,0,'2025-12-20 19:16:39','2025-12-20 19:42:28',NULL,NULL,NULL),(3,'Teacher','$2b$12$2aAnLpBaXn0Hz5M4WGSQuuKoQRSpGqdR/M023amsyBXJTMWzuLmgK','Teacher',NULL,2,3,4,1,'2025-12-20 19:47:50','2025-12-21 12:18:35','2025-12-21 17:15:10',NULL,NULL),(4,'Administrator','$2b$12$vcN7CJBYF.TJ5OEvOp90QeJRPYHJYuAoxQiW.dERmtcJzqsXtIWZu','Administrator',NULL,2,NULL,3,1,'2025-12-20 19:50:54','2025-12-21 12:56:53','2025-12-21 18:26:54',NULL,NULL),(5,'superadmin','$2b$12$YV3DSROCyEretkunCJ2U6OC/ZeaAeI5/2zzpyWGXTPYYsRvupzN5C','superadmin','superadmin12@example.com',NULL,NULL,1,1,'2025-12-20 20:08:55','2025-12-22 02:32:55','2025-12-22 08:02:56',NULL,NULL),(6,'Admin','$2b$12$erc74ks7GOl6WQt0w/1e8.yPHUF6Q1r8dOrVa9xghqvIUNrE3Rvj6','Admin','admin12@example.com',NULL,NULL,2,1,'2025-12-20 20:09:15','2025-12-21 14:38:36','2025-12-21 20:08:36',NULL,NULL),(7,'21CS38','$2b$12$1RMTIyPAnVBI0F1H5wlup.mNVuA9ReqJqIEeYC31iiwYQ49AUsHWi','Sidharth','sidharthiwnl@gmail.com',2,3,5,1,'2025-12-21 03:15:42','2025-12-21 14:36:30','2025-12-21 19:31:16','2025-12-21 20:06:30',NULL),(10,'Student2','$2b$12$TXWb5W6kS1.rYlfhtyWovuCh3Tu.kmALjU7T53quXOmNj1zCBk11e','Student2',NULL,2,2,5,0,'2025-12-21 12:13:53','2025-12-21 12:17:03',NULL,NULL,NULL),(13,'Sankar','$2b$12$/HkM0OY3/iNp8DzWh8QZPO0PHCBv6ZtNfm8Y6WHEwae5nUnHmgWtq','Sankar',NULL,2,3,5,1,'2025-12-21 12:44:44','2025-12-21 12:44:44',NULL,NULL,NULL);
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

-- Dump completed on 2025-12-22  8:18:37
