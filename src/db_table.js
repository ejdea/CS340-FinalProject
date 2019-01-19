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

app.get('/', function(req, res, next) {
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

function showTable(res) {
    var sqlStr = "SELECT id, name, reps, weight, DATE_FORMAT(date, '%Y-%m-%d') AS date, lbs FROM workouts";

    pool.query(sqlStr, function(err, data) {
        if (err) {
          next(err);
          return;
        }

        res.render('home', { data : data });
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
