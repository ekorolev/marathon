var appname = "eakorolev";
var express = require('express');
var app = express();
var redis = require('redis').createClient();
var RedisStore = require('redis-sessions');
var mongoose = require('mongoose').connect('mongodb://localhost/eakorolev');
var async = require('async');
var redisStore = new RedisStore({
	client: redis,
});

var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.use( express.static(__dirname + "/../www/"));
app.get('/', function (req, res) {
	res.sendFile(__dirname+"/../www/index.html");
});

var Users = require('./models/users')({
	mongoose: mongoose,
	io: io
});
var Students = require('./models/students')({
	mongoose: mongoose,
	io: io
});
var Visits = require('./models/visits')({
	mongoose: mongoose,
	io: io
});
server.listen(1995, function () {
	console.log("Сервер запущен.");
});

io.on('connection', function (socket) {
	console.log('Socket: новое подключение!');
	socket.user = {};

	socket.on("auth::signup", function (data, callback) {
		console.log(data);
		data.socket_id = socket.id;
		var user = new Users(data);
		user.save( function (err, user) {

			if (err) callback({ error: "db_error" }); else {

				redisStore.create({
					app: appname,
					id: user.id,
					ip: socket.handshake.address,
					ttl: 3600,
					d: {
						user_id: user.id
					}
				}, function (err, resp) {
					console.log(socket.handshake.address);
					console.log(err, resp);
					if (!err) {

						socket.sessionToken = resp.token;
						socket.user_id = user.id;
						socket.user = user;
						callback({
							success: true,
							user: user,
							token: resp.token
						});
					} else {

						user.remove();
					}
				});
			}
		});
	});


	socket.on('auth::signin', function (data, callback) {
		Users.findOne({
			login: data.login
		}, function (err, user) {

			if (err || !user) callback({ error: "db_error"}); else {

				user.isPwd(data.password, function (err, is) {
					if (err) callback({ error: "db_error" }); else{
						redisStore.create({
							app: appname,
							id: user.id,
							ip: socket.handshake.address,
							ttl: 3600,
							d: {
								user_id: user.id
							}
						},
						function (err, resp) {
							if (!err) {

								socket.sessionToken = resp.token;
								socket.user_id = user.id;
								socket.user = user;
								callback({
									success: true,
									user: user,
									token: resp.token
								});
							}
						});
					}
				});
			}
		});
	});
						

	socket.on("auth::check", function (data, callback) {
		redisStore.get({
			app: appname,
			token: data.token
		}, function (err, resp) {
			if (err || !resp) callback({ error: "session_not_found"});else {

				var user_id = resp.id;
				Users.findById(user_id, function (err, user) {
					if (!err && user) {

						socket.user_id = user.id;
						socket.sessionToken = data.token;
						socket.user = user;
						callback({
							success: true,
							user: user,
							token: data.token
						});
					}
				});
			}
		});
	});

	socket.on("auth::logout", function (data, callback) {
		redisStore.kill({
			app: appname,
			token: socket.sessionToken,
		}, function (err, resp) {
			callback();
		});
	});

	socket.on("students::get", function (data, callback) {
		Students.find({}, function (err, students) {
			callback({
				students: students
			})
		})
	});

	socket.on("students::create", function (data, callback) {
		if (socket.user.role=="admin") {

			var student = new Students(data);
			student.save( function (err, student) {
				callback({ success: err? false : true, error: err? "db_error" : false, student: student });
			})
		} else {
			callback({ error: "access_error" });
		}
	});

	socket.on("students::delete", function (data, callback) {
		if (socket.user.role=="admin") {

			var id = data.id;
			Students.findById(id, function (err, student) {
				if (err || !student) callback({error: 'db_error'}); else{

					student.remove( function (err){
						if (err) {
							callback({ error: "db_error"});
						} else {

							callback({ success: true });
						}
					});
				}
			})

		}
	});

	socket.on("students::show", function (data, callback) {
		var id = data.id;
		Students.findById(id, function (err, student) {

			if (err || !student) callback({ error: 'db_error' }); else {

				var cursor = Visits.find({
					student_id: student.id
				}).sort({ day: -1 });


				cursor.exec({
					student_id: student.id
				}, function (err, visits) {

					callback({
						success: true,
						student: student,
						visits: visits
					});

				});
			}
		});
	});

	socket.on("students::create_visits", function (data, callback) {

	});

	socket.on("students::add_visit", function (data, callback) {
		console.log(data);
		if (socket.user.role=='admin') {

			var visits = [];
			for (var i = 0; i<data.students.length; ++i) {
					visits.push(new Visits({
						student_id: data.students[i]._id,
						subject: data.subject,
						num_of_subject: data.num_of_subject,
						day: data.day,
						visit: data.students[i].visit
					}));
			}

			for (var i = 0; i<visits.length; ++i ){
				visits[i].save();
			}

			callback({success: true});
		}

	});

	socket.on("students::do_no_visit", function (data, callback) {
		if (socket.user.role=="admin") {
			var id = data.id;
			Visits.findById(id, function (err, visit) {
				visit.doNoVisit = true;
				visit.save( function () {
					callback({success:true});
				})
			})
		}
	});

});

function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};