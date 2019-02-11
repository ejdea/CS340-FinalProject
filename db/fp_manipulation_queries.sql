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

-- Get user's watchlist
SELECT s.symbol, s.name, t1.timestamp, t1.price, t2.percentage_change
FROM fp_stock s
INNER JOIN
(
    SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price
	FROM fp_price p
	GROUP BY p.stock_id DESC
) t1
  ON s.id = t1.stock_id
INNER JOIN
(
	SELECT ((t2b.price - t2a.price) / t2a.price * 100) AS percentage_change, t2a.stock_id
	FROM
	(
		SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price
		FROM fp_price p
		WHERE p.timestamp >= concat(:date_input, ' 00:00:00')
		AND p.timestamp <= concat(:date_input, ' 23:59:59')
		GROUP BY p.stock_id ASC
	) t2a
	INNER JOIN
	(
		SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price
		FROM fp_price p
		WHERE p.timestamp >= concat(:date_input, ' 00:00:00')
		AND p.timestamp <= concat(:date_input, ' 23:59:59')
		GROUP BY p.stock_id DESC
	) t2b
	  ON t2a.stock_id = t2b.stock_id
) t2
  ON t2.stock_id = t1.stock_id
INNER JOIN fp_user_stock us 
  ON us.stock_id = t1.stock_id
INNER JOIN fp_user u
  ON us.user_id = u.id
  AND u.id = :user_id_input;
  
-- Calculate percentage change in user watchlist
-- NOTE: This query is just a subquery in the user watchlist query.
--       Including this to help better understand the user watchlist query.
SELECT ((t2b.price - t2a.price) / t2a.price * 100) AS percentage_change, t2a.stock_id
FROM
(
	SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price
	FROM fp_price p
	WHERE p.timestamp >= concat(:date_input, ' 00:00:00')
	AND p.timestamp <= concat(:date_input, ' 23:59:59')
	GROUP BY p.stock_id ASC
) t2a
INNER JOIN
(
	SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price
	FROM fp_price p
	WHERE p.timestamp >= concat(:date_input, ' 00:00:00')
	AND p.timestamp <= concat(:date_input, ' 23:59:59')
	GROUP BY p.stock_id DESC
) t2b
  ON t2a.stock_id = t2b.stock_id;
  
-- Get user's portfolio
SELECT s.symbol, s.name, p.open AS price
FROM fp_user u, fp_user_stock us, fp_stock s, fp_price p 
WHERE u.id = us.user_id
AND us.stock_id = s.id
AND p.stock_id = s.id;

-- Add new user
INSERT INTO fp_user (`username`, `password`) VALUES ( :username_input, :password_input );

-- Add stock to user's watchlist
-- ex. symbol_input = 'SPY'
INSERT INTO fp_user_stock (`user_id`, `stock_id`) 
VALUES ( 
	:user_id_input,
	SELECT id FROM fp_stock s WHERE s.symbol = lower(:symbol_input)
);

-- Add stock
INSERT INTO `fp_stock` (`symbol`, `name`, `sector_id`) 
VALUES (
	:symbol_input, 
	:name_input, 
	(SELECT id FROM fp_sector sctr WHERE sctr.name = :sector_name_input LIMIT 1)
);

-- Add new portfolio associated with a user
INSERT INTO `fp_portfolio` (`user_id`) VALUES (:user_id_input)

-- Add new stock price
INSERT INTO `fp_price` (`stock_id`, `timestamp`, `price`) VALUES ( :stock_id_input, :timestamp, :price );

-- Add new order type
INSERT INTO `fp_order_type` (`type`) VALUES ( :order_type_input );

-- Add new stock sector
INSERT INTO `fp_sector` (`name`) VALUES ( :sector_name_input );

-- Create new stock order
INSERT INTO `fp_order` (`stock_id`, `portfolio_id`, `order_type_id`, `price_id`, `quantity`) 
VALUES (
	:stock_id_input,
    (SELECT p.id AS portfolio_id FROM fp_user u, fp_portfolio p WHERE u.id = p.user_id AND u.id = :user_id_input),
    (SELECT ot.id AS order_type_id FROM fp_order_type ot WHERE ot.type = :order_type_input),
    (SELECT t1.price_id	
		FROM (
			SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price, p.id AS price_id
			FROM fp_price p
			GROUP BY p.stock_id DESC
		) t1
	INNER JOIN fp_stock s 
	  ON t1.stock_id = s.id 
	  AND s.id = :stock_id_input),
    :quantity_input
)

-- Delete stock from user watchlist (M-to-M relationship deletion)
DELETE FROM `fp_user_stock` WHERE user_id = :user_id_input AND stock_id = :stock_id_input;

-- Update user password
UPDATE `fp_user` SET `password` = :password_input WHERE username = :username_input;