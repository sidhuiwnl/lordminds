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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_marks`
--

LOCK TABLES `assignment_marks` WRITE;
/*!40000 ALTER TABLE `assignment_marks` DISABLE KEYS */;
INSERT INTO `assignment_marks` VALUES (3,37,3,3.00,3.00,'2025-11-25 21:32:21');
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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES (3,'1','Past Tense',2,1,NULL,'2025-11-23 00:00:00',NULL,'sample_question_upload1.xlsx','uploads/tests\\assignment\\e2178a5d-850d-4c15-8b81-392a9939b601.xlsx',1,'2025-11-23 13:17:07','2025-11-23 13:17:07'),(20,'2','Verbose',2,1,NULL,'2025-12-03 00:00:00',NULL,'question_template.xlsx','uploads/tests\\assignment\\6b7a1c09-c3ac-40fc-b6b0-73e667dacc39.xlsx',1,'2025-12-03 17:16:15','2025-12-03 17:29:54');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colleges`
--

LOCK TABLES `colleges` WRITE;
/*!40000 ALTER TABLE `colleges` DISABLE KEYS */;
INSERT INTO `colleges` VALUES (1,'Kgisl Institute of Technology','14/02 Marutham Nagar','2025-11-23 11:30:00',1),(5,'KCT instution','14/02 Marutham nagar,Nallampalayam Coimbatore','2025-11-24 14:48:44',1),(6,'PSG','Sanganoor','2025-11-30 06:25:23',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Computer Science','COMP',1,1,'2025-11-23 11:30:00','2025-11-23 11:30:00'),(2,'Artificial Intelligence and Data Science','ARTI',1,1,'2025-11-23 11:30:00','2025-11-23 11:30:00'),(6,'Computer Science','COMP',5,1,'2025-11-24 14:48:44','2025-11-24 14:48:44'),(7,'Artificial Intelligence and Data Science','ARTI',6,1,'2025-11-30 06:25:23','2025-11-30 06:25:23');
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
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES (4,'sub_topic',1,1,'Fluent communication means speaking with a natural rhythm and without breaks.','{\"options\": [true, false, \"Sometimes\", \"Never\"], \"correct_answer\": true}',1.00,1,'2025-11-23 11:33:04','2025-11-23 11:33:04',1),(5,'sub_topic',1,1,'Which of the following best defines fluency?','{\"options\": [\"Smooth speech flow\", \"Perfect grammar\", \"Loud voice\", \"Slow speaking\"], \"correct_answer\": \"Smooth speech flow\"}',1.00,2,'2025-11-23 11:33:04','2025-11-23 11:33:04',1),(6,'sub_topic',1,1,'What skill helps improve fluency in a language?','{\"options\": [\"Listening\", \"Writing\", \"Translation\", \"Memorization\"], \"correct_answer\": \"Listening\"}',1.00,3,'2025-11-23 11:33:04','2025-11-23 11:33:04',1),(10,'assignment',3,1,'Fluent communication means speaking with a natural rhythm and without breaks.','{\"options\": [true, false, \"Sometimes\", \"Never\"], \"correct_answer\": true}',1.00,1,'2025-11-23 13:17:07','2025-11-23 13:17:07',1),(11,'assignment',3,1,'Which of the following best defines fluency?','{\"options\": [\"Smooth speech flow\", \"Perfect grammar\", \"Loud voice\", \"Slow speaking\"], \"correct_answer\": \"Smooth speech flow\"}',1.00,2,'2025-11-23 13:17:07','2025-11-23 13:17:07',1),(12,'assignment',3,1,'What skill helps improve fluency in a language?','{\"options\": [\"Listening\", \"Writing\", \"Translation\", \"Memorization\"], \"correct_answer\": \"Listening\"}',1.00,3,'2025-11-23 13:17:07','2025-11-23 13:17:07',1),(16,'sub_topic',2,1,'Fluent communication means speaking with a natural rhythm and without breaks.','{\"options\": [true, false, \"Sometimes\", \"Never\"], \"correct_answer\": true}',1.00,1,'2025-11-27 00:54:18','2025-11-27 00:54:18',1),(17,'sub_topic',2,1,'Which of the following best defines fluency?','{\"options\": [\"Smooth speech flow\", \"Perfect grammar\", \"Loud voice\", \"Slow speaking\"], \"correct_answer\": \"Smooth speech flow\"}',1.00,2,'2025-11-27 00:54:18','2025-11-27 00:54:18',1),(18,'sub_topic',2,1,'What skill helps improve fluency in a language?','{\"options\": [\"Listening\", \"Writing\", \"Translation\", \"Memorization\"], \"correct_answer\": \"Listening\"}',1.00,3,'2025-11-27 00:54:18','2025-11-27 00:54:18',1),(32,'assignment',20,3,'Match the animals with their sounds','{\"left\": [\"Dog\", \"Cat\", \"Cow\", \"Lion\"], \"right\": [\"barks\", \"meows\", \"moos\", \"roars\"], \"matches\": {\"A\": \"2\", \"B\": \"1\", \"C\": \"4\", \"D\": \"3\"}}',1.00,1,'2025-12-03 17:29:54','2025-12-03 17:29:54',1),(33,'assignment',20,1,'What is the past tense of \'go\'?','{\"options\": [\"go\", \"going\", \"went\", \"goed\"], \"correct_answer\": \"\"}',1.00,2,'2025-12-03 17:29:54','2025-12-03 17:29:54',1),(34,'assignment',20,8,'The sun rises in the east.','{\"options\": [\"True\", \"False\"], \"correct_answer\": \"false\"}',1.00,3,'2025-12-03 17:29:54','2025-12-03 17:29:54',1),(35,'assignment',20,2,'Accuracy is about using correct ______ and ______.','{\"correct_answers\": []}',1.00,4,'2025-12-03 17:29:54','2025-12-03 17:29:54',1),(36,'assignment',20,9,'Pronounce the given word.','{\"correct_answer\": \"\"}',1.00,5,'2025-12-03 17:29:54','2025-12-03 17:29:54',1);
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
INSERT INTO `student_profile` VALUES (1,37,'2025-11-10','7010604488','https://github.com/sidhuiwnl','https://www.linkedin.com/in/sidharth-babu-97141638b/','uploads/resumes\\95473a64-04cc-439a-8b02-764ecdb23b7b_Latest_Resume.pdf','2025-11-27 02:18:32','2025-11-27 02:18:32',1);
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
INSERT INTO `student_skills` VALUES (1,37,'React');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_subtopic_progress`
--

LOCK TABLES `student_subtopic_progress` WRITE;
/*!40000 ALTER TABLE `student_subtopic_progress` DISABLE KEYS */;
INSERT INTO `student_subtopic_progress` VALUES (1,37,1,1,1,3.00,NULL,'2025-11-25 15:33:04');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_test_attempts`
--

LOCK TABLES `student_test_attempts` WRITE;
/*!40000 ALTER TABLE `student_test_attempts` DISABLE KEYS */;
INSERT INTO `student_test_attempts` VALUES (1,37,'sub_topic',1,1,1,3.00,3.00,NULL,'2025-11-25 15:33:04',NULL),(2,37,'assignment',3,1,1,3.00,3.00,'2025-11-25 16:02:21','2025-11-25 16:02:21',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_topic_progress`
--

LOCK TABLES `student_topic_progress` WRITE;
/*!40000 ALTER TABLE `student_topic_progress` DISABLE KEYS */;
INSERT INTO `student_topic_progress` VALUES (1,37,1,1,1,100.00,100.00,'Completed','2025-11-25 15:33:04');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_topic_marks`
--

LOCK TABLES `sub_topic_marks` WRITE;
/*!40000 ALTER TABLE `sub_topic_marks` DISABLE KEYS */;
INSERT INTO `sub_topic_marks` VALUES (1,37,1,1,1,2,3.00,3.00,'2025-11-25 21:03:04');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_topics`
--

LOCK TABLES `sub_topics` WRITE;
/*!40000 ALTER TABLE `sub_topics` DISABLE KEYS */;
INSERT INTO `sub_topics` VALUES (1,1,'Past Tense',1,'https://us7xgl2xx9.ufs.sh/f/NLwJvYRc8DXfBe34fsIZrb67gjCL5kFMaqTzV3evG81Ec0su','sample_question_upload1.xlsx','uploads/tests\\sub_topic\\85a81357-9e37-44df-816c-936f18051e25.xlsx','<p>Requirements of ElectCare</p><p><br></p><p><br></p><p><br></p><p></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p> <br></p><p><br></p><p><br></p>',1,'2025-11-23 11:32:30','2025-11-23 11:33:04'),(2,2,'Go Routine',1,'','sample_question_upload1.xlsx','uploads/tests\\sub_topic\\4a9b7bb3-951d-45bc-b90a-6023df36bf70.xlsx','<p>Requirements of ElectCare</p><p><br></p><p><br></p><p><br></p><p></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p> <br></p><p><br></p><p><br></p>',1,'2025-11-27 00:53:57','2025-11-27 00:54:17'),(3,5,'1',1,'https://us7xgl2xx9.ufs.sh/f/NLwJvYRc8DXfBe34fsIZrb67gjCL5kFMaqTzV3evG81Ec0su',NULL,NULL,'<p>This is great</p>',1,'2025-11-30 06:54:59','2025-11-30 06:55:18');
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
  `topic_name` varchar(255) NOT NULL,
  `topic_number` varchar(50) DEFAULT NULL,
  `total_sub_topics` int DEFAULT '0',
  `college_id` int NOT NULL,
  `department_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`topic_id`),
  KEY `college_id` (`college_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `topics_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`college_id`),
  CONSTRAINT `topics_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topics`
--

LOCK TABLES `topics` WRITE;
/*!40000 ALTER TABLE `topics` DISABLE KEYS */;
INSERT INTO `topics` VALUES (1,'Tense',NULL,1,1,2,1,'2025-11-23 11:30:51','2025-11-23 11:32:30'),(2,'Golang',NULL,1,1,2,1,'2025-11-23 11:30:51','2025-11-27 00:53:57'),(3,'Zig',NULL,0,1,1,1,'2025-11-24 14:49:43','2025-11-24 14:49:43'),(4,'Zig',NULL,0,5,6,1,'2025-11-24 14:50:20','2025-11-24 14:50:20'),(5,'Table Info',NULL,1,6,7,1,'2025-11-30 06:54:26','2025-11-30 06:54:59');
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
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
INSERT INTO `user_sessions` (`id`, `user_id`, `start_time`, `end_time`) VALUES (1,38,'2025-01-10 09:00:00','2025-01-10 10:00:00'),(2,38,'2025-01-11 14:30:00','2025-01-11 15:10:00'),(3,37,'2025-01-10 08:15:00','2025-01-10 09:00:00'),(4,37,'2025-01-11 16:00:00','2025-01-11 17:00:00'),(5,37,'2025-11-23 19:26:29',NULL),(6,37,'2025-11-23 19:26:29',NULL),(7,37,'2025-11-24 05:31:35',NULL),(8,37,'2025-11-24 05:31:35',NULL),(9,37,'2025-11-24 05:31:41',NULL),(10,37,'2025-11-24 05:31:41',NULL),(11,37,'2025-11-24 05:31:50',NULL),(12,37,'2025-11-24 05:31:50',NULL),(13,37,'2025-11-24 05:37:55',NULL),(14,37,'2025-11-24 05:37:55',NULL),(15,37,'2025-11-24 05:38:33',NULL),(16,37,'2025-11-24 05:38:33',NULL),(17,37,'2025-11-24 05:42:10',NULL),(18,37,'2025-11-24 05:42:10',NULL),(19,37,'2025-11-24 05:42:17',NULL),(20,37,'2025-11-24 05:42:17',NULL),(21,37,'2025-11-24 05:42:40',NULL),(22,37,'2025-11-24 05:42:40',NULL),(23,37,'2025-11-24 05:42:45',NULL),(24,37,'2025-11-24 05:42:45',NULL),(25,37,'2025-11-24 05:42:52',NULL),(26,37,'2025-11-24 05:42:52',NULL),(27,37,'2025-11-24 05:54:50',NULL),(28,37,'2025-11-24 05:54:50',NULL),(29,37,'2025-11-24 05:56:25',NULL),(30,37,'2025-11-24 05:56:25',NULL),(31,37,'2025-11-24 05:58:58',NULL),(32,37,'2025-11-24 05:58:58',NULL),(33,37,'2025-11-24 06:00:52',NULL),(34,37,'2025-11-24 06:00:52',NULL),(35,37,'2025-11-24 06:01:24',NULL),(36,37,'2025-11-24 06:01:24',NULL),(37,37,'2025-11-24 06:02:00',NULL),(38,37,'2025-11-24 06:02:00',NULL),(39,37,'2025-11-24 06:03:34',NULL),(40,37,'2025-11-24 06:03:34',NULL),(41,37,'2025-11-24 06:03:44',NULL),(42,37,'2025-11-24 06:03:44',NULL),(43,37,'2025-11-24 06:03:50',NULL),(44,37,'2025-11-24 06:03:50',NULL),(45,37,'2025-11-26 07:43:10',NULL),(46,37,'2025-11-26 07:43:10',NULL),(47,37,'2025-11-26 07:50:41',NULL),(48,37,'2025-11-26 07:50:41',NULL),(49,37,'2025-11-26 07:54:30',NULL),(50,37,'2025-11-26 07:54:30',NULL),(51,37,'2025-11-26 07:54:40',NULL),(52,37,'2025-11-26 07:54:40',NULL),(53,37,'2025-11-26 07:56:55',NULL),(54,37,'2025-11-26 07:56:56',NULL),(55,37,'2025-11-26 07:59:55',NULL),(56,37,'2025-11-26 07:59:55',NULL),(57,37,'2025-11-27 06:20:12',NULL),(58,37,'2025-11-27 06:20:12',NULL),(59,37,'2025-11-27 06:39:17',NULL),(60,37,'2025-11-27 06:39:17',NULL),(61,37,'2025-11-27 06:39:24',NULL),(62,37,'2025-11-27 06:39:24',NULL),(63,37,'2025-11-27 06:40:46',NULL),(64,37,'2025-11-27 06:40:46',NULL),(65,37,'2025-11-30 12:50:17',NULL),(66,37,'2025-11-30 12:50:17',NULL),(67,37,'2025-12-03 20:37:40',NULL),(68,37,'2025-12-03 20:37:40',NULL),(69,37,'2025-12-03 20:46:25',NULL),(70,37,'2025-12-03 20:46:25',NULL),(71,37,'2025-12-03 20:46:32',NULL),(72,37,'2025-12-03 20:46:32',NULL),(73,37,'2025-12-03 20:51:13',NULL),(74,37,'2025-12-03 20:51:13',NULL),(75,37,'2025-12-03 23:00:08',NULL),(76,37,'2025-12-03 23:00:08',NULL),(77,37,'2025-12-03 23:06:04',NULL),(78,37,'2025-12-03 23:06:04',NULL),(79,37,'2025-12-03 23:12:30',NULL),(80,37,'2025-12-03 23:12:30',NULL),(81,37,'2025-12-03 23:12:39',NULL),(82,37,'2025-12-03 23:12:39',NULL),(83,37,'2025-12-03 23:12:49',NULL),(84,37,'2025-12-03 23:12:49',NULL),(85,37,'2025-12-03 23:14:26',NULL),(86,37,'2025-12-03 23:14:26',NULL),(87,37,'2025-12-03 23:16:28',NULL),(88,37,'2025-12-03 23:16:28',NULL),(89,37,'2025-12-03 23:16:56',NULL),(90,37,'2025-12-03 23:16:56',NULL),(91,37,'2025-12-03 23:17:14',NULL),(92,37,'2025-12-03 23:17:14',NULL),(93,37,'2025-12-03 23:17:18',NULL),(94,37,'2025-12-03 23:17:18',NULL),(95,37,'2025-12-03 23:18:06',NULL),(96,37,'2025-12-03 23:18:06',NULL),(97,37,'2025-12-03 23:18:28',NULL),(98,37,'2025-12-03 23:18:28',NULL),(99,37,'2025-12-03 23:18:32',NULL),(100,37,'2025-12-03 23:18:32',NULL),(101,37,'2025-12-04 06:19:37',NULL),(102,37,'2025-12-04 06:19:37',NULL),(103,37,'2025-12-04 06:19:49',NULL),(104,37,'2025-12-04 06:19:49',NULL),(105,37,'2025-12-04 06:25:05',NULL),(106,37,'2025-12-04 06:25:05',NULL),(107,37,'2025-12-04 06:25:33',NULL),(108,37,'2025-12-04 06:25:33',NULL),(109,37,'2025-12-04 06:29:06',NULL),(110,37,'2025-12-04 06:29:06',NULL),(111,37,'2025-12-04 06:31:01',NULL),(112,37,'2025-12-04 06:31:01',NULL),(113,37,'2025-12-04 06:32:01',NULL),(114,37,'2025-12-04 06:32:01',NULL),(115,37,'2025-12-04 06:32:15',NULL),(116,37,'2025-12-04 06:32:15',NULL),(117,37,'2025-12-04 06:32:32',NULL),(118,37,'2025-12-04 06:32:32',NULL),(119,37,'2025-12-04 06:36:30',NULL),(120,37,'2025-12-04 06:36:30',NULL),(121,37,'2025-12-04 06:40:21',NULL),(122,37,'2025-12-04 06:40:21',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (3,'superadmin','$2b$12$Wo5oGArrRtR0zftzOY2Aoehl/4ipXHwLDG/cOSzxmkDf5Ew8o8Mi.','superadmin',NULL,NULL,NULL,1,1,'2025-10-24 17:39:39','2025-12-03 17:00:10','2025-12-03 22:30:10',NULL,NULL),(11,'Admin','$2a$12$zcJbM1QgIyl4f3TicukrWuhzo5BsRaLHvWihmG4VHt8zv8JpVfZcy','Admin',NULL,NULL,NULL,2,1,'2025-11-01 17:20:05','2025-11-25 17:21:29','2025-11-25 22:51:29',NULL,NULL),(33,'21AIBT38','$2a$12$sRxPs1HNmZ30VWuvLv1lrOA2lNUJRLaCDw2t5Tc/h1WMg13mWlqYW','Teacher',NULL,1,1,4,1,'2025-11-20 17:11:56','2025-11-30 07:08:31','2025-11-30 12:38:31',NULL,NULL),(36,'Sanjay','$2b$12$52N09bco7HKLUtFedYG.puqNAWp0ZszRn08iYQc6kaQnnfT5DNH0K','Sanjay',NULL,1,NULL,3,1,'2025-11-23 07:11:11','2025-11-30 07:05:31','2025-11-30 12:35:31',NULL,NULL),(37,'21AIB38','$2b$12$cibokiLERYbIVASZ6pMkye2GRH/GfLHjPnl4FDPE35uwmonumGi..','Sidharth Babu','sidharthiwnl@gmail.com',1,2,5,1,'2025-11-23 13:01:03','2025-12-04 01:00:56','2025-12-04 06:30:56','2025-12-03 22:30:01',NULL),(38,'21AIB30','$2b$12$JAbluczSFjAhi.ctJmpB7OOZOC/Lx/CvdZ7.yz0bpxcK3TpY8CJ3.','Sankar',NULL,1,1,5,1,'2025-11-23 13:01:32','2025-11-25 17:22:34','2025-11-25 22:52:31','2025-11-25 22:52:34',NULL),(39,'21AIB37','$2b$12$NgkAGDfFm4OWwvn3xxdfJenPJblK.hSE6EeYExBBWZBI65mQ3izLa','John Doe',NULL,6,7,5,1,'2025-11-30 07:03:46','2025-11-30 07:03:45',NULL,NULL,NULL),(40,'21AIB56','$2b$12$itHPXt68wcIE28X7IVOsk.Ut5UWZKVg4XJntlSYcmIBkpWeM7eJb6','Jane Smith',NULL,6,7,5,1,'2025-11-30 07:03:46','2025-11-30 07:03:45',NULL,NULL,NULL);
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

-- Dump completed on 2025-12-04  6:51:52
