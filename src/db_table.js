var port = 34520;
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

module.exports.pool = pool;

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', port);

app.get('/home', function(req, res, next) {
    // check if the user is logged in
    if (!req.session.logged_in_username) {
        // if not logged in, render login page
        res.render('login');
    }
    else {
        var context = {};
        context.username = req.session.logged_in_username;
        res.render('home', context);
	showPortfolioTable(res);
    }
});

app.post('/home', function(req, res, next) {
    // check if the user is logged in
    /*if (!req.session.logged_in_username) {
        // if not logged in, render login page
        res.render('login');
    }
    else {*/
        //var context = {};
        //context.username = req.session.logged_in_username;
        //res.render('home', context);
	getPortfolioTable(res);
    //}
});

app.get('/', function(req, res, next) {
    // if user is already logged in, redirect request to homepage
    if (req.session.logged_in_username) {
        res.redirect('home');
        return;
    }


    // Check if table already exists
    var sqlStr = "SELECT 1 FROM information_schema.tables " +
                 "WHERE table_schema = (?) AND table_name = (?)";

    pool.query(sqlStr, [sqlDb, 'workouts'], function(err, results) {
        if (err) {
            next(err);
            return;
        }
    
        if (results.length === 0) {
            // If the table doesn't exist yet, then create it
            var sqlStr = "CREATE TABLE workouts(" +
                "id INT PRIMARY KEY AUTO_INCREMENT," +
                "name VARCHAR(255) NOT NULL," +
                "reps INT," +
                "weight INT," +
                "date DATE," +
                "lbs BOOLEAN)";

            pool.query(sqlStr, function(err) {
                if (err) {
                    next(err);
                    return;
                }
                var resultErr = showTable(res);
                if (resultErr)
                    next(resultErr);
            });
        } else {
          var resultErr = showTable(res);
          if (resultErr)
            next(resultErr);
        }
    });
});

function getPortfolioTable(res) {
    var sqlStr = "SELECT s.symbol, s.name, o.quantity, p.timestamp AS purchase_date, p.price AS purchase_price, t1.price AS current_price, ot.type AS order_type " +
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
                 "	GROUP BY p.stock_id DESC " +
                 ") t1 " +
                 "  ON s.id = t1.stock_id " +
                 "WHERE u.id = (?)";

    pool.query(sqlStr, [ 1 ], function(err, pf_data) {
        if (err) {
          next(err);
          return;
        }

        getWatchlist(res, pf_data);

        //res.render('home', { pf_data : pf_data });
    });
}

function getWatchlist(res, pf_data) {
    let list = [];
    list.pf_data = pf_data;

    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; // January=0
    var yyyy = today.getFullYear();
    var date = yyyy + '-' + mm + '-' + dd;

    var sqlStr = "SELECT s.symbol, s.name, t1.timestamp, t1.price, t2.percentage_change " +
		 "FROM fp_stock s " +
		 "INNER JOIN " +
		 "( " +
		 "    SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price " +
		 "	FROM fp_price p " +
		 "	GROUP BY p.stock_id DESC " +
		 ") t1 " +
		 "  ON s.id = t1.stock_id " +
		 "INNER JOIN " +
		 "( " +
		 "	SELECT ((t2b.price - t2a.price) / t2a.price * 100) AS percentage_change, t2a.stock_id " +
		 "	FROM " +
		 "	( " +
		 "		SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price " +
		 "		FROM fp_price p " +
		 "		WHERE p.timestamp >= concat(" + date + ", ' 00:00:00') " +
		 "		AND p.timestamp <= concat(" + date + ", ' 23:59:59') " +
		 "		GROUP BY p.stock_id ASC " +
		 "	) t2a " +
		 "	INNER JOIN " +
		 "	( " +
		 "		SELECT max(p.timestamp) AS timestamp, p.stock_id, p.price " +
		 "		FROM fp_price p " +
		 "		WHERE p.timestamp >= concat(" + date + ", ' 00:00:00') " +
		 "		AND p.timestamp <= concat(" + date + ", ' 23:59:59') " +
		 "		GROUP BY p.stock_id DESC " +
		 "	) t2b " +
		 "	  ON t2a.stock_id = t2b.stock_id " +
		 ") t2 " +
		 "  ON t2.stock_id = t1.stock_id " +
		 "INNER JOIN fp_user_stock us  " +
		 "  ON us.stock_id = t1.stock_id " +
		 "INNER JOIN fp_user u " +
		 "  ON us.user_id = u.id " +
		 "  AND u.id = (?)";

    pool.query(sqlStr, [ 1 ], function(err, wl_data) {
        if (err) {
            console.log(err);
            next(err);
            return;
        }

        list.wl_data = wl_data;

        console.log(list);

        res.render('home', list);
    });
}

app.get('/reset-table', function(req, res, next){
    var context = {};
    pool.query("DROP TABLE IF EXISTS workouts", function(err) {
        var createString = "CREATE TABLE workouts(" +
            "id INT PRIMARY KEY AUTO_INCREMENT," +
            "name VARCHAR(255) NOT NULL," +
            "reps INT," +
            "weight INT," +
            "date DATE," +
            "lbs BOOLEAN)";

        pool.query(createString, function(err) {
          context.results = "Table reset";
          res.render('home', context);
        });
    });
});

app.post('/', function(req, res, next) {
    var cmd = req.body["cmd"];

    switch (cmd) {
        case "create":
            // Check if table already exists
            var sqlStr = "SELECT 1 FROM information_schema.tables " +
                         "WHERE table_schema = (?) AND table_name = (?)";

            pool.query(sqlStr, [sqlDb, 'workouts'], function(err, results) {
                if (err) {
                    next(err);
                    return;
                }

                if (results.length === 0) {
                    // If the table doesn't exist yet, then create it
                    var sqlStr = "CREATE TABLE workouts(" +
                        "id INT PRIMARY KEY AUTO_INCREMENT," +
                        "name VARCHAR(255) NOT NULL," +
                        "reps INT," +
                        "weight INT," +
                        "date DATE," +
                        "lbs BOOLEAN)";

                    pool.query(sqlStr, function(err) {
                        if (err) {
                            next(err);
                            return;
                        }

                        // Now that the table is created, insert a new row
                        var sqlStr = "INSERT INTO `workouts`(`name`, `reps`, `weight`, `date`, `lbs`) VALUES (?, ?, ?, ?, ?)";
                        var sqlVar = [req.body["name"], 
                                      req.body["reps"], 
                                      req.body["weight"], 
                                      req.body["date"],
                                      req.body["lbs"]
                                     ];

                        pool.query(sqlStr, sqlVar, function(err, result) {
                            if(err) {
                                next(err);
                                return;
                            }

                            // Send insertid back to client-side
                            res.end(JSON.stringify(result));
                        });
                    });
                } else {
                    // The table already exists, so insert a new row
                    var sqlStr = "INSERT INTO `workouts`(`name`, `reps`, `weight`, `date`, `lbs`) VALUES (?, ?, ?, ?, ?)";
                    var sqlVar = [req.body["name"], 
                                  req.body["reps"], 
                                  req.body["weight"], 
                                  req.body["date"],
                                  req.body["lbs"]
                                 ];

                    pool.query(sqlStr, sqlVar, function(err, result) {
                        if(err) {
                            next(err);
                            return;
                        }

                        // Send insertid back to client-side
                        res.end(JSON.stringify(result));
                    });
                }
            });
            break;
        case "delete":
            var sqlStr = "DELETE FROM `workouts` WHERE `id` = (?)";
            var sqlVar = [req.body["id"]];

            pool.query(sqlStr, sqlVar, function(err, result) {
                if(err) {
                    next(err);
                    return;
                }

                // Send insertid back to client-side
                res.end(JSON.stringify(result));
            });
            break;
        case "edit":
            var sqlStr = "UPDATE `workouts` SET `name`=?,`reps`=?,`weight`=?,`date`=?,`lbs`=? WHERE `id`=?";
            var sqlVar = [req.body["name"], req.body["reps"], req.body["weight"], req.body["date"], req.body["lbs"], req.body["id"]];

            pool.query(sqlStr, sqlVar, function(err, result) {
                if(err) {
                    next(err);
                    return;
                }

                // Send insertid back to client-side
                res.end(JSON.stringify(result));
            });
            break;
        case "insert":
            var sqlStr = "INSERT INTO `workouts`(`name`, `reps`, `weight`, `date`, `lbs`) VALUES (?, ?, ?, ?, ?)";
            var sqlVar = [req.body["name"], 
                          req.body["reps"], 
                          req.body["weight"], 
                          req.body["date"],
                          req.body["lbs"]
                         ];

            pool.query(sqlStr, sqlVar, function(err, result) {
                if(err) {
                    next(err);
                    return;
                }

                // Send insertid back to client-side
                res.end(JSON.stringify(result));
            });
            break;
    }
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
