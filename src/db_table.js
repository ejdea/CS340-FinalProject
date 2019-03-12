var port = 34520
var serverName = "http://flip3.engr.oregonstate.edu";

var sqlHost = 'classmysql.engr.oregonstate.edu';
var sqlUser = 'cs340_deae';
var sqlPassword = '0343';
var sqlDb = 'cs340_deae';

var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var bodyParser = require('body-parser');
var mysql = require('mysql');
var session = require('express-session');

app.use(session({secret:'SuperSecretPassword'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

var pool = mysql.createPool({
  connectionLimit : 10,
  host  : sqlHost,
  user  : sqlUser,
  password: sqlPassword,
  database: sqlDb
});

// Set web server port
const args = process.argv;
if (args != null && args.length == 3) {
    port = args[2];
}

module.exports.pool = pool;

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', port);
const request = require('request');

// Register handlebars helper ifeq
const hbars = handlebars.handlebars;

hbars.registerHelper('ifeq', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});


app.get('/', function(req, res, next) {
    // if user is already logged in, redirect request to homepage
    if (req.session.logged_in_username) {
        res.redirect('home');
    }
    else {
        res.render('login');
    }
});



app.get('/logout', function(req, res, next) {
    req.session.logged_in_username = undefined;
    req.session.logged_in_user_id = undefined;
    res.render('login');
    return;
});

// handle login and account creation requests
app.post('/', function(req, res, next) {
    var form_type = req.body.form_type;
    var context = {};

    if (form_type == "login_form") {
        var sqlStr = "SELECT u.id FROM fp_user u WHERE u.username = (?) AND u.password = (?)";
        var sqlArgs = [req.body.login_username, req.body.login_password];

        pool.query(sqlStr, sqlArgs, function(err, results) {
            if (err) {
                console.log(err);
                next(err);
                return;
            }

            // check if user credentials were found
            if (results[0]) {
                req.session.logged_in_username = req.body.login_username;
                req.session.logged_in_user_id = results[0].id;

                sqlStr = "SELECT MIN(id) AS first_portfolio FROM fp_portfolio WHERE user_id=(?)";
                pool.query(sqlStr, req.session.logged_in_user_id, function(err, results) {
                    if (err) {
                        console.log(err);
                        next(err);
                        return;
                    }
                    
                    req.session.portfolio_id = results[0].first_portfolio;
                
                    res.redirect('home');
                    return;
                });
            }
            else {
                context.login_error = "Invalid username or password";
                res.render('login', context);
            }
        }); 
    }
});


app.post('/create_account', function(req, res, next) {
    var form_type = req.body.form_type;
    var context = {};
    var new_username = req.body.create_username;

    // if correct form was submitted
    if (form_type == "create_account_form") {
        var sqlStr = "SELECT u.id FROM fp_user u WHERE u.username = (?)";

        // check if username is already taken. SELECT by username
        pool.query(sqlStr, new_username, function(err, results) {
            if (err) {
                console.log(err);
                next(err);
                return;
            }

            // if username exists
            if (results[0]) {
                context.create_error = "Username is not available";
                res.render('login', context);
                return;
            }

            // otherwise, username is available. insert account info into db
            sqlStr = "INSERT INTO fp_user (username, password) VALUES (?, ?)";
            var sqlArgs = [new_username, req.body.create_password];

            pool.query(sqlStr, sqlArgs, function(err, result) {
                if (err) {
                    console.log(err);
                    next(err);
                    return;
                }

                // new username and password successfully inserted.
                // add to session, redirect user to home page
                req.session.logged_in_username = new_username;
                req.session.logged_in_user_id = req.body.create_password;
                req.session.filter_sector = 0;
                res.redirect('/home');
                return;
            });
        });
    }
    else {
        res.send("error");
    }
    return;
});


app.get('/home', function(req, res, next) {
    if (req.body.portfolio != null) {
        req.session.portfolio_id = req.body.portfolio;
    }

    if (req.body.filterWatchlistMenu != null) {
        req.session.filter_sector = req.body.filterWatchlistMenu;
    }

    // check if the user is logged in
    if (!req.session.logged_in_username) {
        // if not logged in, render login page
        res.render('login');
    }
    else {
        // user is logged in	
        getPortfolioTable(req, res);
    }
});

app.post('/home', function(req, res, next) {
    if (req.body.portfolio != null) {
        req.session.portfolio_id = req.body.portfolio;
    }

    if (req.body.filterWatchlistMenu != null) {
        req.session.filter_sector = req.body.filterWatchlistMenu;
    }

    // check if the user is logged in
    if (!req.session.logged_in_username) {
        // if not logged in, render login page
        res.render('login');
    } else {
	// user is logged in
        getPortfolioTable(req, res);
    }
});

function getPortfolioTable(req, res) {
    var inputParams;
    var sqlStr = "SELECT s.symbol, s.name, o.quantity, p.timestamp AS purchase_date, FORMAT(ROUND(p.price, 2), 2) AS purchase_price, FORMAT(ROUND(t1.price, 2), 2) AS current_price, ot.type AS order_type, o.id AS order_id " +
                 "FROM fp_user u " +
                 "INNER JOIN fp_portfolio pf ON u.id = pf.user_id " +
                 "INNER JOIN fp_order o ON pf.id = o.portfolio_id " +
                 "INNER JOIN fp_stock s ON o.stock_id = s.id " +
                 "INNER JOIN fp_order_type ot ON o.order_type_id = ot.id " +
                 "INNER JOIN fp_price p ON o.price_id = p.id " +
                 "LEFT JOIN " +
                 "( " +
                 "    SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price " +
                 "	FROM fp_price p " +
                 "	GROUP BY p.stock_id " +
                 "      ORDER BY timestamp DESC " +
                 ") t1 " +
                 "  ON s.id = t1.stock_id " +
                 "WHERE u.id = (?)" +
                 "AND pf.id = (?)";

    inputParams = [ req.session.logged_in_user_id, req.session.portfolio_id ];

    pool.query(sqlStr, inputParams, function(err, pf_data) {
        if (err) {
          next(err);
          return;
        }

        getWatchlist(req, res, pf_data);
    });
}

function queryPortfolioList(req, list, callback) {
    // Query portfolio name
    var sqlPortfolioName = "SELECT p.id AS portfolio_id, p.name AS portfolio_name " +
                           "FROM fp_user u, fp_portfolio p " +
                           "WHERE u.id = (?) " +
                           "AND u.id = p.user_id";

    pool.query(sqlPortfolioName, req.session.logged_in_user_id, function(err, pf_name) {
        if (err) {
            next(err);
            return;
        }

        list.pf_list = pf_name;
        list.selected_portfolio = req.session.portfolio_id;

        callback(list);
    });
}

function queryOrderTypes(list, callback) {
    // Query order types
    var sqlOrderTypes = "SELECT ot.id AS order_type_id, ot.type AS order_type_name " +
                        "FROM fp_order_type ot ORDER BY ot.id ASC";

    pool.query(sqlOrderTypes, null, function(err, ot_data) {
        if (err) {
            next(err);
            return;
        }

        list.order_type_list = ot_data;

        callback(list);
    });
}

function querySectors(req, list, callback) {
    var sqlSectors = "SELECT 0 AS sector_id, 'All' AS sector_name UNION " +
                     "SELECT id AS sector_id, name AS sector_name " +
                     "FROM fp_sector " +
                     "ORDER BY sector_name ASC";

    pool.query(sqlSectors, function(err, sector_names) {
        if (err) {
            next(err);
            return;
        }

        list.sector_names = sector_names;
        list.filter_sector = req.session.filter_sector;

        callback(list);
    });
}

function queryWatchlist(req, list, callback) {
    // Get current date
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; // January=0
    var yyyy = today.getFullYear();
    var date = yyyy + '-' + mm + '-' + dd;

    // Query watchlist data
    var sqlStr = "SELECT s.id AS stock_id, s.symbol, s.name, t1.timestamp, FORMAT(ROUND(t1.price, 2), 2) AS price, IFNULL(t2.percentage_change, 0) as percentage_change " +
                 "FROM fp_stock s " +
                 "INNER JOIN " +
                 "( " +
                 "    SELECT t1.timestamp, t1.stock_id, t1.price, s.symbol " +
                 "    FROM fp_stock s " +
                 "    INNER JOIN " +
                 "    ( " +
                 "        SELECT p.timestamp, p.stock_id, p.price " +
                 "        FROM fp_price p " +
                 "        GROUP BY p.stock_id DESC " +
                 "    ) t1 " +
                 "    ON t1.stock_id = s.id " +
                 "    ORDER BY s.symbol DESC " +
                 ") t1 " +
                 "  ON s.id = t1.stock_id " +
                 "LEFT JOIN " +
                 "( " +
                 "	SELECT ROUND(((t2b.price - t2a.price) / t2a.price * 100), 2) AS percentage_change, t2a.stock_id " +
                 "	FROM " +
                 "	( " +
                 "		SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price " +
                 "		FROM fp_price p " +
                 "		WHERE p.timestamp >= concat((?), ' 00:00:00') " +
                 "		AND p.timestamp <= concat((?), ' 23:59:59') " +
                 "		GROUP BY p.stock_id ASC " +
                 "	) t2a " +
                 "	INNER JOIN " +
                 "	( " +
                 "		SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price " +
                 "		FROM fp_price p " +
                 "		WHERE p.timestamp >= concat((?), ' 00:00:00') " +
                 "		AND p.timestamp <= concat((?), ' 23:59:59') " +
                 "		GROUP BY p.stock_id DESC " +
                 "	) t2b " +
                 "	  ON t2a.stock_id = t2b.stock_id " +
                 ") t2 " +
                 "  ON t2.stock_id = t1.stock_id " +
                 "INNER JOIN fp_user_stock us  " +
                 "  ON us.stock_id = t1.stock_id " +
                 "INNER JOIN fp_user u " +
                 "  ON us.user_id = u.id " +
                 "  AND u.id = (?) ";

    var sqlParams = [ date, date, date, date, req.session.logged_in_user_id ];

    if (req.session.filter_sector > 0) {
        // add wehere statement to filter by sector id
        sqlStr += "WHERE s.sector_id = (?) ";

        // add sector id to param list
        sqlParams.push(parseInt(req.session.filter_sector));
    }

    sqlStr += "ORDER BY t1.timestamp DESC";

    pool.query(sqlStr, sqlParams, function(err, wl_data) {
        if (err) {
            next(err);
            return;
        }

        // Check if query returned an empty dataset
        if (wl_data.length > 0) {
            if (wl_data) {
                list.wl_data = wl_data;
            }
        }

        callback();
    });
}

function getWatchlist(req, res, pf_data) {
    let list = {};
    list.pf_data = pf_data;

    // Set username
    list.username = req.session.logged_in_username;

    // Query portfolio name
    queryPortfolioList(req, list, function() {
        queryOrderTypes(list, function() {
            querySectors(req, list, function() {
                queryWatchlist(req, list, function() {
                    res.render('home', list);
                });
            });
        });
    });
}

app.post('/createPortfolio', function(req, res, next) {
    var sqlStr = "INSERT INTO `fp_portfolio` (`user_id`, `name`) VALUES (?, ?)";
    var sqlVar = [ req.session.logged_in_user_id,
                   req.body["new-portfolio-name"] ];

    pool.query(sqlStr, sqlVar, function(err, result) {
        if(err) {
            next(err);
            return;
        }

        req.session.portfolio_id = result.insertId;

        // Send insertid back to client-side
        res.redirect('home');
    });
});

function insertOrder(req, symbol, quantity, callback) {
    var sqlStr = "INSERT INTO `fp_order` (`stock_id`, `portfolio_id`, `order_type_id`, `price_id`, `quantity`) " +
                 "VALUES ( " +
                 "    (SELECT s.id FROM fp_stock s WHERE s.symbol = (?)), " +
                 "    (?), " +
                 "    (SELECT ot.id AS order_type_id FROM fp_order_type ot WHERE ot.id = (?)), " +
                 "    (SELECT t1.price_id " +	
                 "     FROM ( " +
                 "         SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price, p.id AS price_id " +
                 "         FROM fp_price p " +
                 "         GROUP BY p.stock_id DESC " +
                 "     ) t1 " +
                 "     INNER JOIN fp_stock s " +
                 "	  ON t1.stock_id = s.id " +
                 "	  AND s.id = (SELECT s.id FROM fp_stock s WHERE s.symbol = (?))), " +
                 "    (?) " +
                 ")";
    var sqlVar = [ symbol,
                   req.session.portfolio_id,
                   req.body["new-order-type"],
                   symbol,
                   quantity ];

    pool.query(sqlStr, sqlVar, function(err, result) {
        if(err) {
            next(err);
            return;
        }

        callback();
    });
}

app.post('/submitOrder', function(req, res, next) {
    // Reference: https://stackoverflow.com/questions/18647885/regular-expression-to-detect-company-tickers-using-java
    var regexStockSymbol = new RegExp(/^([a-zA-Z]{1,4}|\d{1,3}(?=\.)|\d{4,})$/);
    var regexInt = new RegExp(/^[0-9]*$/);

    // Validate input
    if (!regexStockSymbol.test(req.body["new-order-symbol"])) {
        console.log("Error: Invalid stock symbol input.");
        res.redirect('home');
        return;
    }

    if (!regexInt.test(req.body["new-order-quantity"])) {
        console.log("Error: Invalid quantity.");
        res.redirect('home');
        return;
    }

    var symbol = req.body["new-order-symbol"];
    var quantity = req.body["new-order-quantity"];

    isStockInDb(symbol, function(isStockInDb, stockId) {
        if (isStockInDb > 0) {
            insertOrder(req, symbol, quantity, function() {
                // Send insertid back to client-side
                res.redirect('home');
            });
        } else {
            insertStock(req, symbol, function(stockId) {
                insertOrder(req, symbol, quantity, function() {
                    // Send insertid back to client-side
                    res.redirect('home');
                });
            });
        }
    });
});

app.post('/updateQuantity', function(req, res, next) {
    var sqlStr = "UPDATE `fp_order` o SET `quantity`=(?) WHERE o.id = (?)";
    var sqlVar = [ req.body["update-quantity"],
                   req.body["update-quantity-order-id"] ];

    pool.query(sqlStr, sqlVar, function(err, result) {
        if (err) {
            next(err);
            return;
        }

        // Send insertid back to client-side
        res.redirect('home');
    });
});

function insertPriceData(time_series, stock_id, callback) {
    // Insert price data into fp_table
    var sqlStr = "INSERT INTO `fp_price` (`stock_id`, `timestamp`, `price`) VALUES ";
    var sqlVar = [];
    var ts_keys = Object.keys(time_series);

    // Validate input
    if (time_series == null || ts_keys.length == 0) {
        callback();
        return;
    }

    for (var i = 0; i < ts_keys.length; i++) {
        var date = ts_keys[i];
        var price = time_series[date]['4. close'];

        sqlStr += "( (?), (?), (?) )";
        sqlVar.push(stock_id, date, price);

        // Append comma
        if (i < (ts_keys.length - 1)) {
            sqlStr += ", ";
        }
    }

    pool.query(sqlStr, sqlVar, function(err, result) {
        if (err) {
            console.log(JSON.stringify(err));
            next(err);
            return;
        }

        callback();
    });
}

function queryStockPrice(symbol, stock_id, callback) {
    // Query 60min stock price data
    //var apiUrl = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY";
    //var apiString = apiUrl + '&interval=60min&symbol=' + symbol + '&' + apiKey;

    // Query daily stock price data
    var apiUrl = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY";
    var apiKey = "apikey=JENVZ7MHDQIFBTBE";
    var apiString = apiUrl + '&symbol=' + symbol + '&' + apiKey;

    request(apiString, { json: true }, (err, res, body) => {
        if (err) {
            next(err);
            return;
        }

        // Validate input
        if (body == null || body.length == 0) {
            callback();
            return;
        }

        var time_series = body['Time Series (Daily)'];

        // Validate input
        if (time_series == null || time_series.length == 0) {
            console.log("Error: API query did not return any price data for " + symbol + '.');
            callback();
            return;
        }

        // If this stock exists in the db
        if (stock_id != null) {
            // Get stock dates that have not been entered into the db yet
            // Note: It would be best if there was a separate process responsible for
            //       price data. Since this is just a small school project, let's just
            //       handle collecting price data within the node.js server script.
            var dateList = [];
            var dateEnd;
            var ts_keys = Object.keys(time_series);

            // Build array containing all dates in the time_series
            for (var i = 0; i < ts_keys.length; i++) {
                var date = ts_keys[i];
                dateList.push(date);

                // Get the end date in the time series
                if (i == (ts_keys.length - 1)) {
                    dateEnd = date;
                }
            }

            // Query for missing price data. First, query for dates contained in both
            // time_series and the db's fp_price table.
            var sqlStr = "SELECT DISTINCT DATE_FORMAT(p.timestamp, '%Y-%m-%d') as timestamp " +
                         "FROM `fp_price` p " +
                         "WHERE p.stock_id = (SELECT s.id FROM fp_stock s WHERE s.symbol = (?)) " +
                         "AND p.timestamp >= (?) " +
                         "AND p.timestamp IN (?)";
            var sqlVar = [ symbol, dateEnd, dateList ];

            pool.query(sqlStr, sqlVar, function(err, result) {
                if (err) {
                    console.log(JSON.stringify(err));
                    next(err);
                    return;
                }

                var parsedResults = JSON.parse(JSON.stringify(result));

                // Delete existing price data from time_series
                for (var i = 0; i < parsedResults.length; i++) {
                    var date = parsedResults[i].timestamp;

                    if (date != null && time_series[date] != null) {
                        delete time_series[date];
                    }
                }

                // Rebuild keys in time_series object
                ts_keys = Object.keys(time_series);

                if (ts_keys.length > 0) {
                    insertPriceData(time_series, stock_id, callback);
                } else {
                    callback();
                }
            });
        } else {
            console.log('Error: stock_id was unexpectedly null when querying for querying stock prices.');
            callback();
            return;
        }
    });
}

function insertStock(req, symbol, callback) {
    var apiUrl = "https://financialmodelingprep.com/public/api/company/profile/" + symbol;

    request({url: apiUrl, json: true}, (err, res, body) => {
        if (err) {
            console.log(err);
            next(err);
            return;
        }

        // Validate input
        if (symbol == null || body == null || body.length == 0 || 
            (body.message != null && body.message.toLowerCase() == "server error")) {
            console.log("Error: API could not find the stock " + symbol + ".");
            callback();
            return;
        }

        // Parse results
        var result = JSON.parse(body.substr(5).slice(0,-5));
        var profile = {};
        profile.companyName = result[symbol].companyName;
        profile.sector = result[symbol].sector;

        // Insert new stock to fp_stock table
        var sqlInsertStock = "INSERT INTO `fp_stock` (`symbol`, `name`, `sector_id`) " +
                             "VALUES ( " +
                             "	(?), " +
                             "	(?), " +
                             "	(SELECT sctr.id FROM fp_sector sctr WHERE sctr.name = (?)) " +
                             ")";
        var sqlInsertStockParams = [ symbol,
                                     profile.companyName,
                                     profile.sector ];

        pool.query(sqlInsertStock , sqlInsertStockParams, function(err, result) {
            if (err) {
                console.log(err);
                next(err);
                return;
            }

            if (result.insertId != null) {
                stockId = result.insertId;
                callback(stockId);
            } else {
                console.log('Error: Failed to add "' + symbol + '" to watchlist.');
                callback(null);
            }
        });
    });
}

function isStockInDb(symbol, callback) {
    // Check if stock exists in database
    var sqlStock = "SELECT IF(COUNT(s.id) > 0, 1, 0) AS isStockInDb, s.id AS stockId FROM fp_stock s WHERE s.symbol = (?)";
    var sqlStockParams = [ symbol ];

    pool.query(sqlStock, sqlStockParams, function(err, result) {
        if (err) {
            console.log(err);
            next(err);
            return;
        }

        callback(result[0].isStockInDb, result[0].stockId);
    });
}

app.post('/addStock', function(req, res, next) {
    var stockId = null;

    // Reference: https://stackoverflow.com/questions/18647885/regular-expression-to-detect-company-tickers-using-java
    var regexStockSymbol = new RegExp(/^([a-zA-Z]{1,4}|\d{1,3}(?=\.)|\d{4,})$/);

    // Validate input
    if (!regexStockSymbol.test(req.body["new-watchlist-stock"])) {
        console.log("Error: Invalid stock symbol input.");
        res.redirect('home');
        return;
    }

    var symbol = req.body["new-watchlist-stock"];

    isStockInDb(symbol, function(isStockInDb, stockId) {
        if (isStockInDb > 0) {
            // Check if stock has already been added to the watchlist
            var sqlStr = "SELECT IF(COUNT(us.stock_id) > 0, 1, 0) AS isStockInWatchlist " +
                         "FROM fp_user_stock us " +
                         "WHERE us.stock_id = (?) AND us.user_id = (?)";
            var sqlVar = [ stockId, req.session.logged_in_user_id ];

            pool.query(sqlStr, sqlVar, function(err, result) {
                if (err) {
                    next(err);
                    return;
                }

                // If the stock is in fp_stock but not in the watchlist yet
                if(result[0].isStockInWatchlist == 0) {
                    // Add stock to watchlist
                    var sqlStr = "INSERT INTO fp_user_stock (`user_id`, `stock_id`) VALUES ( (?), (?) )";
                    var sqlVar = [ req.session.logged_in_user_id, stockId ];

                    pool.query(sqlStr, sqlVar, function(err, result) {
                        if (err) {
                            next(err);
                            return;
                        }

                        // Query latest price for this stock from API
                        queryStockPrice(symbol, stockId, function() {
                            res.redirect('home');
                        });
                    });
                } else {
                    // Query latest price for this stock from API
                    queryStockPrice(symbol, stockId, function() {
                        res.redirect('home');
                    });
                }
            });
        } else {
            insertStock(req, symbol, function(stockId) {
                // Add stock to watchlist
                var sqlStr = "INSERT INTO fp_user_stock (`user_id`, `stock_id`) VALUES ( (?), (?) )";
                var sqlVar = [ req.session.logged_in_user_id, stockId ];

                pool.query(sqlStr, sqlVar, function(err, result) {
                    if (err) {
                        console.log(err);
                        next(err);
                        return;
                    }
                });

                queryStockPrice(symbol, stockId, function() {
                    res.redirect('home');
                }); 
            });
        }
    });
});

app.post('/deleteStock', function(req, res, next) {
    var sqlStr = "DELETE FROM `fp_user_stock` WHERE user_id = (?) AND stock_id = (?)";
    var sqlVar = [ req.session.logged_in_user_id,
                   req.body["delete-stock-id"] ];

    pool.query(sqlStr, sqlVar, function(err, result) {
        if (err) {
            next(err);
            return;
        }

        // Send insertid back to client-side
        res.redirect('home');
    });
});

app.use(function(req,res){
    res.status(404);
    res.render('404');
});

app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function(){
    console.log('Express started on ' + serverName + ':' + app.get('port') + '; press Ctrl-C to terminate.');
});
