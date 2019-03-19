-- MySQL Database Manipulation Queries
--
-- Host:		classmysql.engr.oregonstate.edu
-- Database:	cs340_deae
-- Authors:		Edmund Dea, Sam Judkis
-- Date:		2/9/2019
-- ------------------------------------------------------

-- Check whether user login is successful.
-- If login is successful, then return the user id.
-- If login failed, then return 0 rows.
SELECT u.id
FROM fp_user u 
WHERE u.username = :username_input
AND u.password = :password_input;

-- check if account with username already exists
-- return 0 rows if account doesn't exist
SELECT u.id
FROM fp_user u
WHERE u.username = :username_input;



-- select id of user's first portfolio
SELECT MIN(id) AS first_portfolio FROM fp_portfolio WHERE user_id = :user_id


-- Get user's watchlist
SELECT t1a.stock_id, s.name, s.symbol, FORMAT(ROUND(t1a.price, 2), 2) AS price,
       ROUND(((t1a.price - t1b.price) / t1b.price * 100), 2) AS percentage_change,
       t1a.timestamp
FROM fp_price t1a
INNER JOIN fp_price t1b
ON t1a.stock_id = t1b.stock_id
AND t1a.id = (
    SELECT p1.id
    FROM fp_price p1
    WHERE p1.stock_id = t1a.stock_id
    ORDER BY p1.timestamp DESC LIMIT 1
)
AND t1b.id = (
    SELECT p2.id
    FROM fp_price p2
    WHERE p2.stock_id = t1b.stock_id
    ORDER BY p2.timestamp DESC LIMIT 1 OFFSET 1
)
INNER JOIN fp_stock s
  ON s.id = t1a.stock_id
INNER JOIN fp_user_stock us
  ON s.id = us.stock_id
INNER JOIN fp_user u
  ON u.id = us.user_id
  AND u.id = :user_id_input
  AND s.sector_id = :sector_id_input
ORDER BY s.symbol ASC
  
-- Get user's portfolio data
SELECT o.id AS order_id, s.symbol, s.name, o.quantity, p.timestamp AS purchase_date, ot.type AS order_type, 
		FORMAT(ROUND(p.price, 2), 2) AS purchase_price, FORMAT(ROUND(p1.price, 2), 2) AS current_price
FROM fp_user u
INNER JOIN fp_portfolio pf ON u.id = pf.user_id
INNER JOIN fp_order o ON pf.id = o.portfolio_id
INNER JOIN fp_stock s ON o.stock_id = s.id
INNER JOIN fp_order_type ot ON o.order_type_id = ot.id
INNER JOIN fp_price p ON o.price_id = p.id
LEFT JOIN fp_price p1 ON p1.id = (
	SELECT p1a.id
	FROM fp_price p1a
	WHERE p1.stock_id = p1a.stock_id
	ORDER BY p1a.timestamp DESC LIMIT 1
)
AND p1.stock_id = s.id
WHERE u.id = :user_id_input
AND pf.id = :portfolio_id_input
ORDER BY s.symbol, purchase_date, o.quantity ASC

-- Get portfolio name
SELECT p.id AS portfolio_id, p.name AS portfolio_name
FROM fp_user u, fp_portfolio p
WHERE u.id = :user_id_input
AND u.id = p.user_id

-- Query all order type names
SELECT ot.id AS order_type_id, ot.type AS order_type_name
FROM fp_order_type ot
ORDER BY ot.id ASC

-- Query order type name that matches an order type id
SELECT ot.type AS order_type_name
FROM fp_order_type ot
WHERE ot.id = :order_type_id

-- Query all stock sectors, including an option for All sectors
SELECT 0 AS sector_id, 'All' AS sector_name UNION
SELECT id AS sector_id, name AS sector_name
FROM fp_sector
ORDER BY sector_name ASC

-- Query for missing price data. First, query for dates contained in both
-- time_series and the db's fp_price table.
SELECT DISTINCT DATE_FORMAT(p.timestamp, '%Y-%m-%d') as timestamp
FROM `fp_price` p
WHERE p.stock_id = (SELECT s.id FROM fp_stock s WHERE s.symbol = (?))
AND p.timestamp >= (?)
AND p.timestamp IN (?)

-- Add new user
INSERT INTO fp_user (`username`, `password`) VALUES ( :username_input, :password_input );

-- Add stock to user's watchlist
-- ex. symbol_input = 'SPY'
INSERT INTO fp_user_stock (`user_id`, `stock_id`) 
VALUES ( 
	:user_id_input,
	:stock_id_input
);

-- Add stock
INSERT INTO `fp_stock` (`symbol`, `name`, `sector_id`) 
VALUES (
	:symbol_input, 
	:name_input, 
	(SELECT id FROM fp_sector sctr WHERE sctr.name = :sector_name_input)
);

-- Check if stock exists in database
SELECT IF(COUNT(s.id) > 0, 1, 0) AS isStockInDb, s.id AS stockId 
FROM fp_stock s 
WHERE s.symbol = (:stock_symbol_input)

-- Check if stock has already been added to the watchlist
SELECT IF(COUNT(us.stock_id) > 0, 1, 0) AS isStockInWatchlist
FROM fp_user_stock us
WHERE us.stock_id = (:stock_id_input) 
AND us.user_id = (:user_id_input)

-- Add new portfolio associated with a user
INSERT INTO `fp_portfolio` (`user_id`, `name`) VALUES (:user_id_input, :portfolio_name_input)

-- Add new stock price
INSERT INTO `fp_price` (`stock_id`, `timestamp`, `price`) VALUES (
	(:stock_id_input, :timestamp, :price1),
	(:stock_id_input, :timestamp, :price2)
)

-- Add new order type
INSERT INTO `fp_order_type` (`type`) VALUES ( :order_type_input );

-- Add new stock sector
INSERT INTO `fp_sector` (`name`) VALUES ( :sector_name_input );

-- Create new stock order
INSERT INTO `fp_order` (`stock_id`, `portfolio_id`, `order_type_id`, `price_id`, `quantity`)
VALUES (
    (SELECT s.id FROM fp_stock s WHERE s.symbol = (:stock_symbol_input)),
    (:portfolio_id_input),
    (SELECT ot.id AS order_type_id FROM fp_order_type ot WHERE ot.id = (:order_type_id_input)),
    (SELECT p.id FROM fp_price p WHERE p.stock_id = (SELECT s.id FROM fp_stock s WHERE s.symbol = (:stock_symbol_input)) ORDER BY p.timestamp DESC LIMIT 1),
    (:quantity_input)
)

-- Check if stock has already been added to the watchlist
SELECT IF(COUNT(us.stock_id) > 0, 1, 0) AS isStockInWatchlist 
FROM fp_user_stock 
WHERE us.stock_id = :stock_id_input 
AND us.user_id = :user_id_input

-- Delete stock from user watchlist (M-to-M relationship deletion)
DELETE FROM `fp_user_stock` WHERE user_id = :user_id_input AND stock_id = :stock_id_input;

-- Update user password
UPDATE `fp_user` SET `password` = :password_input WHERE username = :username_input;

-- Update quantity for a selected stock in the portfolio
UPDATE `fp_order` o SET `quantity`=:quantity WHERE o.id = :order_id;

-- remove an order from a user's portfolio by setting portfolio id column to NULL
UPDATE `fp_order` o SET o.portfolio_id=NULL WHERE o.id = :order_id;
