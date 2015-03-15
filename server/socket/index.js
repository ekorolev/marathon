
module.exports = function (opts) {

	var io = opts.io;

	var auth = require('./auth');
	var students = require('./students');
	var chat = require('./chat');

	io.on('connection', function (socket) {
		socket.user = {};

		auth(socket, opts);
		students(socket, opts);
		chat(socket, opts);
	});
}