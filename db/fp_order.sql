-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- Host: classmysql.engr.oregonstate.edu:3306
-- Generation Time: Feb 07, 2019 at 01:15 AM
-- Server version: 10.1.22-MariaDB
-- PHP Version: 7.0.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cs340_deae`
--

-- --------------------------------------------------------

--
-- Table structure for table `fp_order`
--

CREATE TABLE `fp_order` (
  `id` int(11) NOT NULL,
  `stock_id` int(11) NOT NULL,
  `portfolio_id` int(11) NOT NULL,
  `order_type_id` int(11) NOT NULL,
  `price_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fp_order`
--
ALTER TABLE `fp_order`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_id` (`stock_id`),
  ADD KEY `portfolio_id` (`portfolio_id`),
  ADD KEY `price_id` (`price_id`),
  ADD KEY `order_type_id` (`order_type_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fp_order`
--
ALTER TABLE `fp_order`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `fp_order`
--
ALTER TABLE `fp_order`
  ADD CONSTRAINT `order_type_id` FOREIGN KEY (`order_type_id`) REFERENCES `fp_order_type` (`id`),
  ADD CONSTRAINT `portfolio_id` FOREIGN KEY (`portfolio_id`) REFERENCES `fp_portfolio` (`id`),
  ADD CONSTRAINT `price_id` FOREIGN KEY (`price_id`) REFERENCES `fp_price` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
