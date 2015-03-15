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
var Messages = require('./models/messages')({
	mongoose: mongoose,
	io: io
});

server.listen(1995, function () {
	console.log("Сервер запущен.");
});

var socket = require('./socket');
socket({
	mongoose: mongoose,
	io: io,
	redisStore: redisStore,
	appname: appname
});