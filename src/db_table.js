var port = 34523; //34520
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
                req.session.portfolio_id = 1;
                res.redirect('home');
                return;
            }

            context.login_error = "Invalid username or password";
            res.render('login', context);            
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

function getPortfolioTable(req, res) {
    var inputParams;
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
                 "WHERE u.id = (?)" +
                 "AND pf.id = (?)";
    console.log('req.session.portfolio_id=' + req.session.portfolio_id);
    inputParams = [ req.session.logged_in_user_id, req.session.portfolio_id ];

    pool.query(sqlStr, inputParams, function(err, pf_data) {
        if (err) {
          next(err);
          return;
        }

        getWatchlist(req, res, pf_data);
    });
}

function getWatchlist(req, res, pf_data) {
    let list = {};
    list.pf_data = pf_data;

    // Get current date
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; // January=0
    var yyyy = today.getFullYear();
    var date = yyyy + '-' + mm + '-' + dd;

    // Set username
    list.username = req.session.logged_in_username;

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
    });

    // Query order types
    var sqlOrderTypes = "SELECT ot.id AS order_type_id, ot.type AS order_type_name " +
                        "FROM fp_order_type ot ORDER BY ot.id ASC";

    pool.query(sqlOrderTypes, null, function(err, ot_data) {
        if (err) {
            next(err);
            return;
        }

        list.order_type_list = ot_data;
    });

    // Query watchlist data
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

    pool.query(sqlStr, req.session.logged_in_user_id, function(err, wl_data) {
        if (err) {
            next(err);
            return;
        }

        list.wl_data = wl_data;

        res.render('home', list);
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

        // Send insertid back to client-side
        res.redirect('home');
    });
});

app.post('/submitOrder', function(req, res, next) {
    var sqlStr = "INSERT INTO `fp_order` (`stock_id`, `portfolio_id`, `order_type_id`, `price_id`, `quantity`) " +
                 "VALUES ( " +
                 "    (SELECT s.id FROM fp_stock s WHERE s.symbol = (?) LIMIT 1), " +
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
                 "     (?) " +
                 ")";
    var sqlVar = [ req.body["new-order-symbol"],
                   req.session.portfolio_id,
                   req.body["new-order-type"],
                   req.body["new-order-symbol"],
                   req.body["new-order-quantity"] ];

    pool.query(sqlStr, sqlVar, function(err, result) {
        if(err) {
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
