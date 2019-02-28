var port = 34521; //34520
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
        context.username = req.session.logged_in_username;;
        res.render('home', context);
    }
})



app.get('/', function(req, res, next) {
    // if user is already logged in, redirect request to homepage
    if (req.session.logged_in_username) {
        res.redirect('home');
        return;
    }
    else {
        res.render('login');
    }
});



app.get('/logout', function(req, res, next) {
    req.session.logged_in_username = undefined;
    req.session.logged_in_user_id = undefined;
    res.render('login');
});

// handle login and account creation requests
app.post('/login', function(req, res, next) {
    console.log(req.body.form_type);
    console.log(req.body.login_username);
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
                res.redirect('home');
                return;
            }
            context.login_error = "Invalid username or password";
            res.render('login', context);
            
        }); 
    }

    else {
        res.send('error');
    }
});


app.post('/home', function(req, res, next) {
    res.render('home');
});

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
