
var chat = {
	messages: [],

	clear: function () {
		setInterval(function () {
			messages.splice(Math.floor(messages.length/2), Math.floor(messages.length/2));
		}, 3600 * 1000);
	}
}

module.exports = function (socket, opts) {
	
	socket.on('chat::get', function (data, callback) {
		var Messages = opts.mongoose.models.messages;

		var cursor = Messages.find().sort({created:1}).limit(15);
		cursor.exec( function (err, messages) {
			callback({
				messages: messages
			});
		});

	});

	socket.on('chat::new_message', function (data, callback) {
		var Messages = opts.mongoose.models.messages;
		console.log(data);
		if (socket.user) {
			var message = {
				name: socket.user.shemail,
				user_id: socket.user.id,
				message: data.message,
				created: new Date()
			};

			var message = new Messages(message);
			message.save();

			chat.messages.push(message);

			socket.broadcast.emit("chat::new_message", message);
			callback({
				success: true,
				message: message
			});
		} else {
			callback({
				error: "access_error"
			})
		}
	});
}