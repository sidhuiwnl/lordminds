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
INSERT INTO `assignments` VALUES (1,'1','Verbose',1,NULL,100.00,40.00,'2025-10-25 00:00:00','2025-10-26 00:00:00','sample_question_upload.xlsx','uploads/tests\\assignment\\4000e711-dd87-4e09-b38f-6ebe01071098.xlsx',1,'2025-10-24 18:57:26','2025-10-24 18:57:26');
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `college_departments`
--

DROP TABLE IF EXISTS `college_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `college_departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int NOT NULL,
  `department_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `college_id` (`college_id`,`department_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `college_departments_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`college_id`) ON DELETE CASCADE,
  CONSTRAINT `college_departments_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `college_departments`
--

LOCK TABLES `college_departments` WRITE;
/*!40000 ALTER TABLE `college_departments` DISABLE KEYS */;
INSERT INTO `college_departments` VALUES (1,1,1,'2025-10-24 16:43:13','2025-10-24 16:43:13'),(2,2,2,'2025-10-24 17:34:53','2025-10-24 17:34:53'),(3,2,1,'2025-10-24 17:34:53','2025-10-24 17:34:53');
/*!40000 ALTER TABLE `college_departments` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colleges`
--

LOCK TABLES `colleges` WRITE;
/*!40000 ALTER TABLE `colleges` DISABLE KEYS */;
INSERT INTO `colleges` VALUES (1,'Kgisl Institute of Technology','14/02 Marutham Nagar','2025-10-24 16:43:13'),(2,'KCT instution','14/02 Marutham Nagar','2025-10-24 17:34:53');
/*!40000 ALTER TABLE `colleges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department_topic_map`
--

DROP TABLE IF EXISTS `department_topic_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_topic_map` (
  `map_id` int NOT NULL AUTO_INCREMENT,
  `department_id` int NOT NULL,
  `topic_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`map_id`),
  KEY `department_id` (`department_id`),
  KEY `topic_id` (`topic_id`),
  CONSTRAINT `department_topic_map_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`),
  CONSTRAINT `department_topic_map_ibfk_2` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_topic_map`
--

LOCK TABLES `department_topic_map` WRITE;
/*!40000 ALTER TABLE `department_topic_map` DISABLE KEYS */;
/*!40000 ALTER TABLE `department_topic_map` ENABLE KEYS */;
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
  `college_id` int DEFAULT NULL,
  `department_code` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `department_code` (`department_code`),
  KEY `idx_dept_code` (`department_code`),
  KEY `fk_department_college` (`college_id`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`college_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_department_college` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`college_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Computer Science',NULL,'B.SC Cse',1,'2025-10-24 16:43:06','2025-10-24 16:43:06'),(2,'Artificial Intelligence and Data Science',NULL,'B.Sc AI and DS',1,'2025-10-24 17:33:58','2025-10-24 17:33:58');
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES (1,'sub_topic',1,1,'Fluent communication means speaking with a natural rhythm and without breaks.','{\"options\": [true, false, \"Sometimes\", \"Never\"], \"correct_answer\": true}',1.00,1,'2025-10-24 16:37:35','2025-10-24 16:37:35'),(2,'sub_topic',1,1,'Which of the following best defines fluency?','{\"options\": [\"Smooth speech flow\", \"Perfect grammar\", \"Loud voice\", \"Slow speaking\"], \"correct_answer\": \"Smooth speech flow\"}',1.00,2,'2025-10-24 16:37:35','2025-10-24 16:37:35'),(3,'sub_topic',1,1,'What skill helps improve fluency in a language?','{\"options\": [\"Listening\", \"Writing\", \"Translation\", \"Memorization\"], \"correct_answer\": \"Listening\"}',1.00,3,'2025-10-24 16:37:35','2025-10-24 16:37:35'),(4,'sub_topic',2,1,'Fluent communication means speaking with a natural rhythm and without breaks.','{\"options\": [true, false, \"Sometimes\", \"Never\"], \"correct_answer\": true}',1.00,1,'2025-10-24 16:39:19','2025-10-24 16:39:19'),(5,'sub_topic',2,1,'Which of the following best defines fluency?','{\"options\": [\"Smooth speech flow\", \"Perfect grammar\", \"Loud voice\", \"Slow speaking\"], \"correct_answer\": \"Smooth speech flow\"}',1.00,2,'2025-10-24 16:39:19','2025-10-24 16:39:19'),(6,'sub_topic',2,1,'What skill helps improve fluency in a language?','{\"options\": [\"Listening\", \"Writing\", \"Translation\", \"Memorization\"], \"correct_answer\": \"Listening\"}',1.00,3,'2025-10-24 16:39:19','2025-10-24 16:39:19'),(7,'sub_topic',3,1,'Fluent communication means speaking with a natural rhythm and without breaks.','{\"options\": [true, false, \"Sometimes\", \"Never\"], \"correct_answer\": true}',1.00,1,'2025-10-24 17:36:46','2025-10-24 17:36:46'),(8,'sub_topic',3,1,'Which of the following best defines fluency?','{\"options\": [\"Smooth speech flow\", \"Perfect grammar\", \"Loud voice\", \"Slow speaking\"], \"correct_answer\": \"Smooth speech flow\"}',1.00,2,'2025-10-24 17:36:46','2025-10-24 17:36:46'),(9,'sub_topic',3,1,'What skill helps improve fluency in a language?','{\"options\": [\"Listening\", \"Writing\", \"Translation\", \"Memorization\"], \"correct_answer\": \"Listening\"}',1.00,3,'2025-10-24 17:36:46','2025-10-24 17:36:46'),(10,'assignment',1,1,'Fluent communication means speaking with a natural rhythm and without breaks.','{\"options\": [true, false, \"Sometimes\", \"Never\"], \"correct_answer\": true}',1.00,1,'2025-10-24 18:57:27','2025-10-24 18:57:27'),(11,'assignment',1,1,'Which of the following best defines fluency?','{\"options\": [\"Smooth speech flow\", \"Perfect grammar\", \"Loud voice\", \"Slow speaking\"], \"correct_answer\": \"Smooth speech flow\"}',1.00,2,'2025-10-24 18:57:27','2025-10-24 18:57:27'),(12,'assignment',1,1,'What skill helps improve fluency in a language?','{\"options\": [\"Listening\", \"Writing\", \"Translation\", \"Memorization\"], \"correct_answer\": \"Listening\"}',1.00,3,'2025-10-24 18:57:27','2025-10-24 18:57:27');
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
  `test_file` varchar(255) DEFAULT NULL,
  `overview_content` longtext,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`sub_topic_id`),
  KEY `idx_subtopic_topic` (`topic_id`),
  KEY `idx_subtopic_order` (`topic_id`,`sub_topic_order`),
  CONSTRAINT `sub_topics_ibfk_1` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`topic_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_topics`
--

LOCK TABLES `sub_topics` WRITE;
/*!40000 ALTER TABLE `sub_topics` DISABLE KEYS */;
INSERT INTO `sub_topics` VALUES (1,1,'Past Tense',1,'https://us7xgl2xx9.ufs.sh/f/NLwJvYRc8DXfBe34fsIZrb67gjCL5kFMaqTzV3evG81Ec0su','Requirements of ElectCare.docx',NULL,'<p>Requirements of ElectCare</p><p><br></p><p><br></p><p><br></p><p>Day 2 (10:00am to 13:20pm)Doubt Clarification for Special Allowences</p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p> <br></p><p><br></p><p><br></p>',1,'2025-10-24 15:35:39','2025-10-24 15:35:39'),(2,2,'Promises',1,'https://us7xgl2xx9.ufs.sh/f/NLwJvYRc8DXfBe34fsIZrb67gjCL5kFMaqTzV3evG81Ec0su','Requirements of ElectCare.docx',NULL,'<p>Requirements of ElectCare</p><p><br></p><p><br></p><p><br></p><p>Day 2 (10:00am to 13:20pm)Doubt Clarification for Special Allowences</p><p><br></p><p>1) Special Allowences (daily allowences) is fixed amount for employee For example for fresher there will be 150 or 200 as a fixed special allowences and they change every revision for appraisal with salary they wil be fixed                  Salary Amount + Special AllowencesWhen Employee Login to the app when they set their visit record like stating field visit from and to they choose like they want to enable special allowance or notCalcaulation is like:so the field visit for the employee is like for 10 days and the special allowance for the employee is 150 so the 10 * 150 = 1500 rupees this need to be calculated automatically2) Accounts + Finance (Audio listen from 20:00 to )The accounts sees these details about money transaction in the account ledgerThe Finanace maintains finance related issue like is there sufficient amount or need money for the company and we need time period for this order or not .The accounts checks related to the payment transactions,tax related data checking by accounts and these transactions needed to storedAccount ----? Finance</p><p><br></p><p><br></p>',1,'2025-10-24 16:38:51','2025-10-24 16:38:51'),(3,3,'Go Routine',1,'https://us7xgl2xx9.ufs.sh/f/NLwJvYRc8DXfBe34fsIZrb67gjCL5kFMaqTzV3evG81Ec0su','Requirements of ElectCare.docx',NULL,'<p>Requirements of ElectCare</p><p><br></p><p><br></p><p><br></p><p>Day 2 (10:00am to 13:20pm)Doubt Clarification for Special Allowences</p><p><br></p><p>1) Special Allowences (daily allowences) is fixed amount for employee For example for fresher there will be 150 or 200 as a fixed special allowences and they change every revision for appraisal with salary they wil be fixed                  Salary Amount + Special AllowencesWhen Employee Login to the app when they set their visit record like stating field visit from and to they choose like they want to enable special allowance or notCalcaulation is like:so the field visit for the employee is like for 10 days and the special allowance for the employee is 150 so the 10 * 150 = 1500 rupees this need to be calculated automatically2) Accounts + Finance (Audio listen from 20:00 to )The accounts sees these details about money transaction in the account ledgerThe Finanace maintains finance related issue like is there sufficient amount or need money for the company and we need time period for this order or not .The accounts checks related to the payment transactions,tax related data checking by accounts and these transactions needed to storedAccount ----? Finance</p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p> <br></p><p><br></p><p><br></p><p><br></p>',1,'2025-10-24 17:36:29','2025-10-24 17:36:29');
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
  `department_id` int DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topics`
--

LOCK TABLES `topics` WRITE;
/*!40000 ALTER TABLE `topics` DISABLE KEYS */;
INSERT INTO `topics` VALUES (1,1,'Tenses',NULL,1,1,'2025-10-24 15:35:39','2025-10-24 17:29:07'),(2,1,'Javascript',NULL,2,1,'2025-10-24 16:38:51','2025-10-24 17:29:07'),(3,2,'Golang',NULL,1,1,'2025-10-24 17:36:29','2025-10-24 17:37:17');
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
  `college_id` int DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'21AIB38','$2b$12$jouElwAygx/GHEYYN3wFp.J5A1UBpbc.3EBE7fMOjPa8/1vjzhf6C','Sidharth',1,1,5,1,'2025-10-24 17:31:45','2025-10-24 17:31:45'),(2,'21AIB30','$2b$12$EX9j10zMqjOKInWtmaqOIeI38eZzUq1RCuHWqoJsJ8gQ/Adqz5T3C','Sankar',2,2,5,1,'2025-10-24 17:35:43','2025-10-24 17:35:43'),(3,'superadmin','$2a$12$iV8iuYIOOgf5BNve1Zje7utPfnFvc6RO4xdsU3yXmsotrySTWwR0q','superadmin',NULL,NULL,1,1,'2025-10-24 17:39:39','2025-10-24 17:39:39'),(4,'Admin','$2b$12$wUxvG/PFR0gGwbXKv4QeauOy1hsG/mrSs/vBx74NOpl2lWD5gp64i',NULL,1,NULL,3,1,'2025-10-24 17:41:53','2025-10-24 17:41:53');
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

-- Dump completed on 2025-10-25  2:06:37
