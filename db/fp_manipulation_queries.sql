-- MySQL Database Manipulation Queries
--
-- Host:		classmysql.engr.oregonstate.edu
-- Database:	cs340_deae
-- Authors:		Edmund Dea, Sam Judkis
-- Date:		2/9/2019
-- ------------------------------------------------------

-- Check whether user login is successful. If LOGIN_STATUS=0, login failed. If LOGIN_STATUS=1, login is successful.
SELECT COUNT(id) AS LOGIN_STATUS
FROM fp_user u 
WHERE u.username = :username_input
AND u.password = :password_input

-- Create new user
INSERT INTO fp_user (`username`, `password`) VALUES ( :username_input, :password_input )

-- Get user's watchlist
SELECT s.symbol, s.name, p.open AS current_price, AS percent_change 
FROM fp_user u, fp_user_stock us, fp_stock s, fp_price p 
WHERE u.id = us.user_id
AND us.stock_id = s.id
AND p.stock_id = s.id
ORDER BY p.id DESC LIMIT 1

-- Get user's portfolio
SELECT s.symbol, s.name, p.open AS price
FROM fp_user u, fp_user_stock us, fp_stock s, fp_price p 
WHERE u.id = us.user_id
AND us.stock_id = s.id
AND p.stock_id = s.id










------------------------------------------------------------------------------------------------------------------

-- get all Planet IDs and Names to populate the Homeworld dropdown
SELECT planet_id, name FROM bsg_planets

-- get all characters and their homeworld name for the List People page
SELECT bsg_people.character_id, fname, lname, bsg_planets.name AS homeworld, age FROM bsg_people INNER JOIN bsg_planets ON homeworld = bsg_planets.planet_id

-- get a single character's data for the Update People form
SELECT character_id, fname, lname, homeworld, age FROM bsg_people WHERE character_id = :character_ID_selected_from_browse_character_page

-- get all character's data to populate a dropdown for associating with a certificate  
SELECT character_id AS pid, fname, lname FROm bsg_people 
-- get all certificates to populate a dropdown for associating with people
SELECT certification_id AS cid, title FROM bsg_cert

-- get all peoople with their current associated certificates to list
SELECT pid, cid, CONCAT(fname,' ',lname) AS name, title AS certificate 
FROM bsg_people 
INNER JOIN bsg_cert_people ON bsg_people.character_id = bsg_cert_people.pid 
INNER JOIN bsg_cert on bsg_cert.certification_id = bsg_cert_people.cid 
ORDER BY name, certificate

-- add a new character
INSERT INTO bsg_people (fname, lname, homeworld, age) VALUES (:fnameInput, :lnameInput, :homeworld_id_from_dropdown_Input, :ageInput)

-- associate a character with a certificate (M-to-M relationship addition)
INSERT INTO bsg_cert_people (pid, cid) VALUES (:character_id_from_dropdown_Input, :certification_id_from_dropdown_Input)

-- update a character's data based on submission of the Update Character form 
UPDATE bsg_people SET fname = :fnameInput, lname= :lnameInput, homeworld = :homeworld_id_from_dropdown_Input, age= :ageInput WHERE id= :character_ID_from_the_update_form

-- delete a character
DELETE FROM bsg_people WHERE id = :character_ID_selected_from_browse_character_page

-- dis-associate a certificate from a person (M-to-M relationship deletion)
DELETE FROM bsg_cert_people WHERE pid = :character_ID_selected_from_certificate_and_character_list AND cid = :certification_ID_selected_from-certificate_and_character_list
