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
INSERT INTO `assignments` VALUES (11,'1','Tense',1,NULL,100.00,40.00,'2025-10-13 00:00:00','2025-10-14 00:00:00','sample_question_upload.xlsx',1,'2025-10-12 14:03:14','2025-10-12 14:03:14'),(12,'2','Verbose',1,NULL,100.00,40.00,'2025-10-13 00:00:00','2025-10-14 00:00:00','sample_question_upload.xlsx',1,'2025-10-12 14:44:47','2025-10-12 14:44:47');
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
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
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `department_code` (`department_code`),
  KEY `idx_dept_code` (`department_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Computer Science','CS',1,'2025-10-11 18:42:29','2025-10-11 18:42:29');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
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
INSERT INTO `sub_topics` VALUES (6,5,'Past Tense',1,'https://us7xgl2xx9.ufs.sh/f/NLwJvYRc8DXfBe34fsIZrb67gjCL5kFMaqTzV3evG81Ec0su','Requirements of ElectCare.docx','<p>Requirements of ElectCare</p><p></p><p></p><p></p><p>Day 2 (10:00am to 13:20pm)Doubt Clarification for Special Allowences</p><p></p><p>1) Special Allowences (daily allowences) is fixed amount for employee For example for fresher there will be 150 or 200 as a fixed special allowences and they change every revision for appraisal with salary they wil be fixed                  Salary Amount + Special AllowencesWhen Employee Login to the app when they set their visit record like stating field visit from and to they choose like they want to enable special allowance or notCalcaulation is like:so the field visit for the employee is like for 10 days and the special allowance for the employee is 150 so the 10 * 150 = 1500 rupees this need to be calculated automatically2) Accounts + Finance (Audio listen from 20:00 to )The accounts sees these details about money transaction in the account ledgerThe Finanace maintains finance related issue like is there sufficient amount or need money for the company and we need time period for this order or not .The accounts checks related to the payment transactions,tax related data checking by accounts and these transactions needed to storedAccount ----? Finance</p><p></p><p>Accounts and finance comes in contact with the client is when regarding with the sales invoice generation mail generation and payment collection .3) Sales Order’s are also needed to see by the Accounts department(BOTH SALES AND SERVICE) If a same customer is asking for another quotation the sales user or manager can verify to the accounts team that this order can be passed or not. For example if the customer has unpaid history or previous overdue amount that it is processed so the current order can be hold.The sales order needs to be approved by the accounts team and thn only they can proceed the sales orderthe accounts team will tell like first collect the precious unpaid amount then proceed the current order the sales order should show the status as Hold | Proceed.</p><p></p><p>with the reason need to be provided for every action.Every user who interacts and process a particaulr order needs the approval from accounts for further process and finialize the orderso the flow becomes like:Sales User -----? Accounts ---? Project Manager4) Purchase FlowPurchase User raise for material request and Purchase Manager can view the request raised.Purchase User only selects the suppliers and ask for verification with the purchase managerIn this also accounts comes in like once after completion of the supplier quotation and before coming to the final purchase order the purchase manager need to verify with the accounts teams about any pending transaction like tax, or any other additional amount and if the accounts department approve then they can finialize the purchase order.The purchase manager files a report like after the supplier selected and purchase order created for the product they gives necessary details like the amount required and conditions to the finance and finance decide whether to approve or not.The flow is Purchase User ---?Material Request --? RFQ --? Purchase Manager --?  Confirmation Ok ---? Supplier Quotation --? Purchae Manager --? Accounts and Finance ---? Purchase Manager --? Confirmed means ----? stores ---? AccountsFor more detail listen audio from 20:12 to 35:004) Delivery Note ( Currently it is not present in the company)It is needed in the sales and serviceIncase there is no need for sales invoice and service invoice they issue delivery not/delivery chalan stores creates a delivery note and these delivery note is send to the accounts and these accounts create the invoice just fetching from the delivery note and send to the customer5) Sales Invoice (there is doubt regarding this flow and for reference the audio is from 40:00 to 43:00)When invoice is generated for the request but the there is short in materials then they can create delivery note and attach to it and send to the client.if the bill is generated and if there is short supply it also needed to be mentioned in it and again for request just the  remaining it need to create bill.</p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p>Service Module1) Service is based on work order from the customer</p><p></p><p>2) After work order is request the sales user verifies the client history to confirm the work</p><p></p><p>order from the accounts department and It goes to the service manager.</p><p></p><p>3) After confirmation of the work order the manager assigns it to the service engineer</p><p></p><p></p><p></p><p>                                          Heirarchy</p><p></p><p></p><p></p><p>                    Service Manager ----?  Service Engineer</p><p></p><p>4) Special Allowence present for service engineers daily basis</p><p></p><p>5) Each work order against a ticket number is generated automatically by the system for</p><p></p><p>that particular work. For a work order there can be multiple ticket numbers</p><p></p><p>6) After the work is assigned to a service engineer they gets a notification about the details</p><p></p><p>of the work with the schedule like from when to when.</p><p></p><p>7) If the work needs extra working days they first need to raise an request to their</p><p></p><p>respective service manager</p><p></p><p>8) The final bill generated and provided to the user is calculated is based on the number of</p><p></p><p>days the work done no till the assigned date</p><p></p><p>9) If the work is done before the assigned schedule the remaing days are not closed so the</p><p></p><p>customer use the remaining days in the assigned date for other work and for that separate</p><p></p><p>bill is generated and this is valid till the year end.</p><p></p><p>10) service engineer can rise advance request or use their own money and raise for expense</p><p></p><p>claim to the service manager for the necessities like</p><p></p><p>food,accommodation</p><p></p><p>11) Data sheet regarding work order is feeded by the sales userwhich contains work order number(manual),date, against this the system creates a ticket number, client data, number of days, travel applicable or not with cost is fixed and this is given to service manager and to the service engineer.</p><p></p><p>11) Serive engineer needs to maintain a report(timesheet report) of each days work in detail and send the report to their respective service manager, this process till the final day of work. This is internal report</p><p></p><p>12)Final report(Service report)  is created by the service engineer and gets signed from the client and this is send to the service managerfor verification. After approved that is send to the client with bill finally.</p><p></p><p>13) Every machine that is diagnosed should maintain and store as a unique code or tag.this tag is used to get the past log of the work done on the machine.Each information need to shared in the timesheet that is done to a machine(can upload photo also).</p><p></p><p>14)so the history of work is like         </p><p></p><p>         Client id(or client code) --?  sub id (machine id) --? full details(log of each changes)</p><p></p><p>15)For one work order there can be multiple ticket raised and closed</p><p></p><p>16)The final report(Service report) generated is send to client with the bill for the client to verify.</p><p></p><p>17) The internal report should contains values after each SOP is performed in the particular machine.</p><p></p><p>18) the final report should mention working hours (fixed working hours 8 to 4) additional hours need to be mentioned in the both report</p><p></p><p>19) There is a  possibility that on a client visit they also visit multiple other client after completing the current so the final report of all client is send to the service manager for verification. This is possible so whenever a work order is completed the service engineer needs to upload the service report to their respective service manager</p><p></p><p>20) Digital Signature/Digital FingerPrint on the report/document for the necessary signee</p><p></p><p>21) if a new service engineer assigns to a existing customer, the service engineer can view a history of previous changes and diagnosis done to the machine using the appropriate machine id </p><p></p><p>22) E way bill automatically generating based on the sales invoice </p><p></p><p>23) E Invoice bill generation that gets authenticated by the Invoice Registration Portal.</p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p> </p><p></p><p></p>',1,'2025-10-12 14:02:44','2025-10-12 14:02:44');
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
INSERT INTO `topics` VALUES (5,1,'Tenses',NULL,1,1,'2025-10-12 14:02:44','2025-10-12 14:02:44');
/*!40000 ALTER TABLE `topics` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-12 21:16:45
