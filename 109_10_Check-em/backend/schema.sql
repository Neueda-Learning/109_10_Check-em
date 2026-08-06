CREATE DATABASE  IF NOT EXISTS `payflow` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `payflow`;
-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: payflow
-- ------------------------------------------------------
-- Server version	8.0.41

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
-- Table structure for table `autopay_mandates`
--

DROP TABLE IF EXISTS `autopay_mandates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `autopay_mandates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `merchant_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` bigint NOT NULL,
  `payment_method` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instrument_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `card_number_masked` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_holder_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upi_id` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_masked` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_ifsc` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `debit_amount` decimal(12,2) NOT NULL,
  `max_amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frequency` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mandate_merchant_code` (`merchant_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `autopay_mandates`
--

LOCK TABLES `autopay_mandates` WRITE;
/*!40000 ALTER TABLE `autopay_mandates` DISABLE KEYS */;
/*!40000 ALTER TABLE `autopay_mandates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_nodes`
--

DROP TABLE IF EXISTS `bank_nodes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_nodes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `bank_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `current_load` int NOT NULL DEFAULT '0',
  `max_capacity` int NOT NULL,
  `priority_weight` int NOT NULL DEFAULT '50',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bank_nodes_code` (`bank_code`)
) ENGINE=InnoDB AUTO_INCREMENT=166 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_nodes`
--

LOCK TABLES `bank_nodes` WRITE;
/*!40000 ALTER TABLE `bank_nodes` DISABLE KEYS */;
INSERT INTO `bank_nodes` VALUES (1,'HSBC','HSBC Bank India',1,0,120,90,'2026-08-04 06:24:02','2026-08-05 04:29:49'),(2,'HDFC','HDFC Bank',1,0,150,95,'2026-08-04 06:24:02','2026-08-04 06:24:02'),(3,'ICICI','ICICI Bank',1,0,140,92,'2026-08-04 06:24:02','2026-08-04 06:24:02'),(4,'SBI','State Bank of India',1,0,300,100,'2026-08-04 06:24:02','2026-08-04 06:24:02'),(5,'SIB','South Indian Bank',1,0,100,80,'2026-08-04 06:24:02','2026-08-04 06:24:02');
/*!40000 ALTER TABLE `bank_nodes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_route_history`
--

DROP TABLE IF EXISTS `bank_route_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_route_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `payment_id` bigint NOT NULL,
  `merchant_bank_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_bank_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selected_bank_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `routing_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `route_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bank_route_payment` (`payment_id`),
  KEY `fk_route_history_selected_bank` (`selected_bank_code`),
  CONSTRAINT `fk_route_history_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`),
  CONSTRAINT `fk_route_history_selected_bank` FOREIGN KEY (`selected_bank_code`) REFERENCES `bank_nodes` (`bank_code`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_route_history`
--

LOCK TABLES `bank_route_history` WRITE;
/*!40000 ALTER TABLE `bank_route_history` DISABLE KEYS */;
INSERT INTO `bank_route_history` VALUES (1,4,'HSBC','HDFC','HSBC','STATIC','ROUTED','Preferred merchant route','2026-08-04 09:34:57'),(2,5,'HSBC','SBI','HDFC','DYNAMIC','ROUTED','Load balancing under congestion','2026-08-04 09:34:57'),(3,6,'HSBC','ICICI','SBI','DYNAMIC','ROUTED','Fallback route selected','2026-08-04 09:34:57'),(4,7,'HDFC','HSBC','HDFC','STATIC','ROUTED','Merchant preferred processor','2026-08-04 09:34:57'),(5,8,'ICICI','SIB','ICICI','DYNAMIC','ROUTED','UPI optimized route','2026-08-04 09:34:57'),(6,9,'SBI','HSBC','SBI','STATIC','ROUTED','International settlement route','2026-08-04 09:34:57'),(7,10,'HSBC','HDFC','HSBC','INTER_BANK','ROUTED','Inter-bank routing applied','2026-08-05 04:02:59'),(8,11,'HSBC','SBI','HSBC','INTER_BANK','ROUTED','Inter-bank routing applied','2026-08-05 04:04:36'),(9,12,'HSBC','HDFC','HSBC','INTER_BANK','ROUTED','Inter-bank routing applied','2026-08-05 04:09:37'),(10,13,'HSBC','HDFC','HSBC','INTER_BANK','ROUTED','Inter-bank routing applied','2026-08-05 04:29:49');
/*!40000 ALTER TABLE `bank_route_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currency_rate_cache`
--

DROP TABLE IF EXISTS `currency_rate_cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currency_rate_cache` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `source_currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate` decimal(18,8) NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_currency_pair` (`source_currency`,`target_currency`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currency_rate_cache`
--

LOCK TABLES `currency_rate_cache` WRITE;
/*!40000 ALTER TABLE `currency_rate_cache` DISABLE KEYS */;
INSERT INTO `currency_rate_cache` VALUES (1,'INR','USD',0.01200000,'2026-08-05 05:15:07'),(2,'USD','INR',83.00000000,'2026-08-05 05:15:07'),(3,'INR','AED',0.04400000,'2026-08-05 05:15:07'),(4,'AED','INR',22.70000000,'2026-08-05 05:15:07'),(5,'USD','AED',3.67000000,'2026-08-05 05:15:07'),(6,'AED','USD',0.27000000,'2026-08-05 05:15:07');
/*!40000 ALTER TABLE `currency_rate_cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `merchant_bank_routes`
--

DROP TABLE IF EXISTS `merchant_bank_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merchant_bank_routes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `merchant_id` bigint NOT NULL,
  `preferred_bank_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_merchant_route` (`merchant_id`),
  KEY `fk_merchant_bank_route_bank` (`preferred_bank_code`),
  CONSTRAINT `fk_merchant_bank_route_bank` FOREIGN KEY (`preferred_bank_code`) REFERENCES `bank_nodes` (`bank_code`),
  CONSTRAINT `fk_merchant_bank_route_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `merchant_bank_routes`
--

LOCK TABLES `merchant_bank_routes` WRITE;
/*!40000 ALTER TABLE `merchant_bank_routes` DISABLE KEYS */;
INSERT INTO `merchant_bank_routes` VALUES (1,1,'HSBC','2026-08-04 09:34:57','2026-08-04 09:34:57'),(2,2,'HDFC','2026-08-04 09:34:57','2026-08-04 09:34:57'),(3,3,'ICICI','2026-08-04 09:34:57','2026-08-04 09:34:57'),(4,4,'SBI','2026-08-04 09:34:57','2026-08-04 09:34:57');
/*!40000 ALTER TABLE `merchant_bank_routes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `merchants`
--

DROP TABLE IF EXISTS `merchants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merchants` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `business_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `merchant_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GBP',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_merchant_code` (`merchant_code`),
  KEY `fk_merchant_user` (`user_id`),
  CONSTRAINT `fk_merchant_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `merchants`
--

LOCK TABLES `merchants` WRITE;
/*!40000 ALTER TABLE `merchants` DISABLE KEYS */;
INSERT INTO `merchants` VALUES (1,1,'H&M Retail','HM001','GBP'),(2,4,'Max Fashion','MAX001','INR'),(3,5,'Indigo Airlines','IND001','INR'),(4,6,'Hilton Hotels','HIL001','USD');
/*!40000 ALTER TABLE `merchants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_currency_conversions`
--

DROP TABLE IF EXISTS `payment_currency_conversions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_currency_conversions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `payment_id` bigint NOT NULL,
  `source_currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_amount` decimal(12,2) NOT NULL,
  `converted_amount` decimal(12,2) NOT NULL,
  `rate` decimal(18,8) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conv_payment` (`payment_id`),
  CONSTRAINT `fk_payment_conversion_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_currency_conversions`
--

LOCK TABLES `payment_currency_conversions` WRITE;
/*!40000 ALTER TABLE `payment_currency_conversions` DISABLE KEYS */;
INSERT INTO `payment_currency_conversions` VALUES (1,4,'INR','INR',49.99,49.99,1.00000000,'2026-08-04 09:34:57'),(2,7,'USD','INR',150.75,12512.25,83.00000000,'2026-08-04 09:34:57'),(3,8,'INR','INR',222.40,222.40,1.00000000,'2026-08-04 09:34:57'),(4,12,'GBP','GBP',2570.00,2570.00,1.00000000,'2026-08-05 04:09:37');
/*!40000 ALTER TABLE `payment_currency_conversions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_reversals`
--

DROP TABLE IF EXISTS `payment_reversals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_reversals` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `payment_id` bigint NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `initiated_by` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reversal_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reversal_payment` (`payment_id`),
  CONSTRAINT `fk_reversal_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_reversals`
--

LOCK TABLES `payment_reversals` WRITE;
/*!40000 ALTER TABLE `payment_reversals` DISABLE KEYS */;
INSERT INTO `payment_reversals` VALUES (1,6,89.00,'Auto reversal after failure','SYSTEM','COMPLETED','2026-08-04 09:34:57'),(2,10,2580.00,'Auto reversal after processing failure: Unable to convert unsupported currency pair: INR to GBP','SYSTEM','COMPLETED','2026-08-05 04:03:00'),(3,11,2570.00,'Auto reversal after processing failure: Unable to convert unsupported currency pair: INR to GBP','SYSTEM','COMPLETED','2026-08-05 04:04:36'),(4,1,49.99,'Manual reversal from merchant dashboard','MERCHANT_DASHBOARD','COMPLETED','2026-08-05 04:25:02'),(5,12,2570.00,'Manual reversal from merchant dashboard','MERCHANT_DASHBOARD','COMPLETED','2026-08-05 04:25:32'),(6,13,2570.00,'Auto reversal after processing failure: Unable to convert unsupported currency pair: INR to GBP','SYSTEM','COMPLETED','2026-08-05 04:29:49');
/*!40000 ALTER TABLE `payment_reversals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_status_history`
--

DROP TABLE IF EXISTS `payment_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_status_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `payment_id` bigint NOT NULL,
  `old_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_history_payment` (`payment_id`),
  CONSTRAINT `fk_history_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_status_history`
--

LOCK TABLES `payment_status_history` WRITE;
/*!40000 ALTER TABLE `payment_status_history` DISABLE KEYS */;
INSERT INTO `payment_status_history` VALUES (1,1,NULL,'INITIATED','Payment created','2026-08-04 05:18:17'),(2,1,'INITIATED','PENDING','Sent to bank','2026-08-04 05:18:17'),(3,1,'PENDING','SUCCESS','Bank confirmed','2026-08-04 05:18:17'),(4,2,NULL,'INITIATED','Payment created','2026-08-04 05:18:17'),(5,2,'INITIATED','PENDING','Awaiting confirmation','2026-08-04 05:18:17'),(6,3,NULL,'INITIATED','Payment created','2026-08-04 05:18:17'),(7,3,'INITIATED','PENDING','Sent to bank','2026-08-04 05:18:17'),(8,3,'PENDING','FAILED','Insufficient funds','2026-08-04 05:18:17'),(9,4,NULL,'INITIATED','Payment created','2026-08-04 09:34:57'),(10,4,'INITIATED','PENDING','Sent to acquiring bank','2026-08-04 09:34:57'),(11,4,'PENDING','SUCCESS','Approved by issuing bank','2026-08-04 09:34:57'),(12,5,NULL,'INITIATED','Payment created','2026-08-04 09:34:57'),(13,5,'INITIATED','PENDING','Awaiting wallet confirmation','2026-08-04 09:34:57'),(14,6,NULL,'INITIATED','Payment created','2026-08-04 09:34:57'),(15,6,'INITIATED','PENDING','Sent to bank','2026-08-04 09:34:57'),(16,6,'PENDING','FAILED','Insufficient funds at issuer','2026-08-04 09:34:57'),(17,6,'FAILED','REVERSED','Auto reversal after failure','2026-08-04 09:34:57'),(18,7,NULL,'INITIATED','Payment created','2026-08-04 09:34:57'),(19,7,'INITIATED','PENDING','3DS verification passed','2026-08-04 09:34:57'),(20,7,'PENDING','SUCCESS','Captured successfully','2026-08-04 09:34:57'),(21,8,NULL,'INITIATED','Payment created','2026-08-04 09:34:57'),(22,8,'INITIATED','PENDING','UPI collect initiated','2026-08-04 09:34:57'),(23,8,'PENDING','SUCCESS','UPI mandate approved','2026-08-04 09:34:57'),(24,9,NULL,'INITIATED','Payment created','2026-08-04 09:34:57'),(25,9,'INITIATED','PENDING','Sent for international auth','2026-08-04 09:34:57'),(26,9,'PENDING','FAILED','Network error from acquiring bank','2026-08-04 09:34:57'),(27,10,NULL,'INITIATED','Payment created','2026-08-05 04:02:45'),(28,10,'INITIATED','PENDING','Payment sent for processing','2026-08-05 04:02:59'),(29,10,'PENDING','FAILED','Unable to convert unsupported currency pair: INR to GBP','2026-08-05 04:03:00'),(30,10,'FAILED','REVERSED','Auto-reversed after failure','2026-08-05 04:03:00'),(31,11,NULL,'INITIATED','Payment created','2026-08-05 04:04:10'),(32,11,'INITIATED','PENDING','Payment sent for processing','2026-08-05 04:04:36'),(33,11,'PENDING','FAILED','Unable to convert unsupported currency pair: INR to GBP','2026-08-05 04:04:36'),(34,11,'FAILED','REVERSED','Auto-reversed after failure','2026-08-05 04:04:36'),(35,12,NULL,'INITIATED','Payment created','2026-08-05 04:09:25'),(36,12,'INITIATED','PENDING','Payment sent for processing','2026-08-05 04:09:37'),(37,12,'PENDING','SUCCESS','Processed via HSBC, converted GBP->GBP @ 1','2026-08-05 04:09:37'),(38,1,'SUCCESS','REVERSED','Manual reversal from merchant dashboard','2026-08-05 04:25:02'),(39,12,'SUCCESS','REVERSED','Manual reversal from merchant dashboard','2026-08-05 04:25:32'),(40,13,NULL,'INITIATED','Payment created','2026-08-05 04:29:46'),(41,13,'INITIATED','PENDING','Payment sent for processing','2026-08-05 04:29:49'),(42,13,'PENDING','FAILED','Unable to convert unsupported currency pair: INR to GBP','2026-08-05 04:29:49'),(43,13,'FAILED','REVERSED','Auto-reversed after failure','2026-08-05 04:29:49');
/*!40000 ALTER TABLE `payment_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `idempotency_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` bigint NOT NULL,
  `merchant_id` bigint NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GBP',
  `payment_method` enum('CARD','BANK_TRANSFER','UPI','WALLET') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('INITIATED','PENDING','SUCCESS','FAILED','REVERSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INITIATED',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_idempotency` (`idempotency_key`),
  KEY `fk_payment_customer` (`customer_id`),
  KEY `fk_payment_merchant` (`merchant_id`),
  CONSTRAINT `fk_payment_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_payment_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,'key-alice-001',2,1,49.99,'GBP','CARD','REVERSED','H&M jacket purchase','2026-08-04 05:18:17','2026-08-05 04:25:02'),(2,'key-alice-002',2,1,12.50,'GBP','WALLET','PENDING','H&M accessories','2026-08-04 05:18:17','2026-08-04 05:18:17'),(3,'key-bob-001',3,1,89.00,'GBP','BANK_TRANSFER','FAILED','H&M coat purchase','2026-08-04 05:18:17','2026-08-04 05:18:17'),(4,'idem_hm_alice_001',2,1,49.99,'INR','CARD','SUCCESS','H&M jacket purchase','2026-08-04 09:34:57','2026-08-04 09:34:57'),(5,'idem_hm_bob_001',3,1,12.50,'INR','WALLET','PENDING','H&M accessories','2026-08-04 09:34:57','2026-08-04 09:34:57'),(6,'idem_hm_chris_001',7,1,89.00,'INR','BANK_TRANSFER','REVERSED','H&M coat purchase','2026-08-04 09:34:57','2026-08-04 09:34:57'),(7,'idem_max_fatima_001',8,2,150.75,'USD','CARD','SUCCESS','Max premium purchase','2026-08-04 09:34:57','2026-08-04 09:34:57'),(8,'idem_ind_liam_001',9,3,222.40,'INR','UPI','SUCCESS','Indigo ticket payment','2026-08-04 09:34:57','2026-08-04 09:34:57'),(9,'idem_hil_alice_001',2,4,480.00,'AED','CARD','FAILED','Hilton booking hold','2026-08-04 09:34:57','2026-08-04 09:34:57'),(10,'IDEM_PFW4S77DTS',3,1,2580.00,'INR','CARD','REVERSED','Checkout for H&M','2026-08-05 04:02:45','2026-08-05 04:03:00'),(11,'IDEM_R8JKHFAQJP',3,1,2570.00,'INR','UPI','REVERSED','Checkout for H&M','2026-08-05 04:04:10','2026-08-05 04:04:36'),(12,'IDEM_KTVYT4H8E6',3,1,2570.00,'GBP','UPI','REVERSED','Checkout for H&M','2026-08-05 04:09:25','2026-08-05 04:25:32'),(13,'IDEM_8MIIKH7UL5',3,1,2570.00,'INR','WALLET','REVERSED','Checkout for H&M','2026-08-05 04:29:45','2026-08-05 04:29:49');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('CUSTOMER','MERCHANT','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CUSTOMER',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'H&M Store','store@hm.com','+441234567890','$2b$12$replacewithrealbcrypt','MERCHANT','2026-08-04 05:18:17'),(2,'Alice Johnson','alice@demo.com','+447000000001','$2b$12$replacewithrealbcrypt','CUSTOMER','2026-08-04 05:18:17'),(3,'Bob Smith','bob@demo.com','+447000000002','$2b$12$replacewithrealbcrypt','CUSTOMER','2026-08-04 05:18:17'),(4,'Max Store','store@max.com','+919100000002','sim-password','MERCHANT','2026-08-04 09:12:29'),(5,'Indigo Store','store@indigo.com','+919100000003','sim-password','MERCHANT','2026-08-04 09:12:29'),(6,'Hilton Store','store@hilton.com','+919100000004','sim-password','MERCHANT','2026-08-04 09:12:29'),(7,'Chris Patel','chris@demo.com','+919900000003','sim-password','CUSTOMER','2026-08-04 09:12:29'),(8,'Fatima Noor','fatima@demo.com','+971501234567','sim-password','CUSTOMER','2026-08-04 09:34:57'),(9,'Liam Walker','liam@demo.com','+61412345678','sim-password','CUSTOMER','2026-08-04 09:34:57');
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

-- Dump completed on 2026-08-06 14:02:17
