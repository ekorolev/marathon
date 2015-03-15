
module.exports = function (socket, opts) {

	var Users = opts.mongoose.models.users;
	var redisStore = opts.redisStore;
	var appname = opts.appname;

	socket.on("auth::signup", function (data, callback) {
		console.log(data);
		data.socket_id = socket.id;
		var user = new Users(data);
		user.save( function (err, user) {
			console.log(err);
			if (err) callback({ error: err.toString() }); else {

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
		console.log(data);
		Users.findOne({
			$or: [
				{ email: data.email },
				{ login: data.email },
			]
		}, function (err, user) {

			if (err || !user) {
				callback({
					error: err? "db_error" : "pwd"
				});
			} else {

				user.isPwd(data.password, function (err, is) {
					if (err){ 
						callback({
							error: "pwd" 
						}); 
					} else{
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
							} else {
								callback({
									error: "db_error"
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

}
