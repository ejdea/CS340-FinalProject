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
SELECT t1a.stock_id, s.symbol, t1a.price, ROUND(((t1a.price - t1b.price) / t1b.price * 100), 2) AS percentage_change, t1a.timestamp
FROM fp_price t1a
INNER JOIN fp_price t1b
ON t1a.stock_id = t1b.stock_id
AND t1a.timestamp = (
    SELECT timestamp
    FROM fp_price temp1 
    WHERE temp1.stock_id = t1a.stock_id
    ORDER BY timestamp DESC LIMIT 1
)
AND t1b.timestamp = (
    SELECT timestamp 
    FROM fp_price temp2 
    WHERE temp2.stock_id = t1b.stock_id 
    ORDER BY timestamp DESC LIMIT 1 OFFSET 1
)
INNER JOIN fp_stock s
  ON s.id = t1a.stock_id
INNER JOIN fp_user_stock us 
  ON s.id = us.stock_id
INNER JOIN fp_user u
  ON u.id = us.user_id
  AND u.id = :user_input
-- the following is added when the user chooses to filter watchlist
WHERE s.sector_id = :filter_sector
ORDER BY s.symbol ASC
  
-- Calculate percentage change in user watchlist
-- NOTE: This query is just a subquery in the user watchlist query.
--       Including this to help better understand the user watchlist query.
SELECT ROUND((t2b.price - t2a.price) / t2a.price * 100), 2) AS percentage_change, t2a.stock_id
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
  
-- Get user's portfolio data
SELECT s.symbol, s.name, o.quantity, p.timestamp AS purchase_date, FORMAT(ROUND(p.price, 2), 2) AS purchase_price, FORMAT(ROUND(t1.price, 2), 2) AS current_price, ot.type
FROM fp_user u
INNER JOIN fp_portfolio pf ON u.id = pf.user_id
INNER JOIN fp_order o ON pf.id = o.portfolio_id
INNER JOIN fp_stock s ON o.stock_id = s.id
INNER JOIN fp_order_type ot ON o.order_type_id = ot.id
INNER JOIN fp_price p ON o.price_id = p.id
LEFT JOIN
(
    SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price
	FROM fp_price p
	GROUP BY p.stock_id DESC
) t1
  ON s.id = t1.stock_id
WHERE u.id = :user_id_input

-- Get portfolio name
SELECT p.name
FROM fp_user u, fp_portfolio p
WHERE u.id = :user_id_input
AND u.id = p.user_id

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
UPDATE `fp_order` o SET `quantity`=:quantity WHERE o.id = :order_id
