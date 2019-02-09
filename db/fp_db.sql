-- MySQL dump 10.16  Distrib 10.1.36-MariaDB, for Linux (x86_64)
--
-- Host: classmysql.engr.oregonstate.edu    Database: cs340_deae
-- ------------------------------------------------------
-- Server version	10.1.22-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `fp_industry`
--

DROP TABLE IF EXISTS `fp_industry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fp_industry` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fp_industry`
--

LOCK TABLES `fp_industry` WRITE;
/*!40000 ALTER TABLE `fp_industry` DISABLE KEYS */;
/*!40000 ALTER TABLE `fp_industry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fp_order`
--

DROP TABLE IF EXISTS `fp_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fp_order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stock_id` int(11) NOT NULL,
  `portfolio_id` int(11) NOT NULL,
  `order_type_id` int(11) NOT NULL,
  `price_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_id` (`stock_id`),
  KEY `portfolio_id` (`portfolio_id`),
  KEY `price_id` (`price_id`),
  KEY `order_type_id` (`order_type_id`),
  CONSTRAINT `order_type_id` FOREIGN KEY (`order_type_id`) REFERENCES `fp_order_type` (`id`),
  CONSTRAINT `portfolio_id` FOREIGN KEY (`portfolio_id`) REFERENCES `fp_portfolio` (`id`),
  CONSTRAINT `price_id` FOREIGN KEY (`price_id`) REFERENCES `fp_price` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fp_order`
--

LOCK TABLES `fp_order` WRITE;
/*!40000 ALTER TABLE `fp_order` DISABLE KEYS */;
/*!40000 ALTER TABLE `fp_order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fp_order_type`
--

DROP TABLE IF EXISTS `fp_order_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fp_order_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fp_order_type`
--

LOCK TABLES `fp_order_type` WRITE;
/*!40000 ALTER TABLE `fp_order_type` DISABLE KEYS */;
/*!40000 ALTER TABLE `fp_order_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fp_portfolio`
--

DROP TABLE IF EXISTS `fp_portfolio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fp_portfolio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_id` FOREIGN KEY (`user_id`) REFERENCES `fp_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fp_portfolio`
--

LOCK TABLES `fp_portfolio` WRITE;
/*!40000 ALTER TABLE `fp_portfolio` DISABLE KEYS */;
/*!40000 ALTER TABLE `fp_portfolio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fp_price`
--

DROP TABLE IF EXISTS `fp_price`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fp_price` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stock_id` int(11) NOT NULL,
  `timestamp` date NOT NULL,
  `price` decimal(10,0) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_id` (`stock_id`),
  CONSTRAINT `stock_id` FOREIGN KEY (`stock_id`) REFERENCES `fp_stock` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fp_price`
--

LOCK TABLES `fp_price` WRITE;
/*!40000 ALTER TABLE `fp_price` DISABLE KEYS */;
/*!40000 ALTER TABLE `fp_price` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fp_stock`
--

DROP TABLE IF EXISTS `fp_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fp_stock` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `symbol` varchar(5) DEFAULT NULL,
  `company_name` varchar(100) DEFAULT NULL,
  `industry_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Id` (`symbol`),
  CONSTRAINT `industry_id` FOREIGN KEY (`industry_id`) REFERENCES `fp_industry` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fp_stock`
--

LOCK TABLES `fp_stock` WRITE;
/*!40000 ALTER TABLE `fp_stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `fp_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fp_user`
--

DROP TABLE IF EXISTS `fp_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fp_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL,
  `password` varchar(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Id` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fp_user`
--

LOCK TABLES `fp_user` WRITE;
/*!40000 ALTER TABLE `fp_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `fp_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fp_user_stock`
--

DROP TABLE IF EXISTS `fp_user_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fp_user_stock` (
  `user_id` int(11) NOT NULL,
  `stock_id` int(11) NOT NULL,
  KEY `stock_id` (`stock_id`),
  KEY `user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fp_user_stock`
--

LOCK TABLES `fp_user_stock` WRITE;
/*!40000 ALTER TABLE `fp_user_stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `fp_user_stock` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-02-09  8:34:56
