
var addId = require('mongo-add-id');
var bcrypt = require('bcrypt');
module.exports = function (opts) {
	var mongoose = opts.mongoose;

	var schema = mongoose.Schema({
		login: { type: String },
		password: String,
		socket_id: String,
		role: String,

		first_name: String,
		last_name: String,
		email: { type:String },
		shemail: {
			type: String,
			get: function () {
				var arr = this.email.split('@');
				return arr[0];
			}
		},
		sex: String,
	});
	addId(schema);

	schema.pre('save', function (next) {
		var self = this;

		if (self.isNew) {

			if (!self.email) {
				next(new Error("email_empty"));
			} else {

				var Users = mongoose.models.users;

				Users.findOne({
					email: self.email
				}, function (err, user) {

					if (err) {
						next(new Error("db_error"));
					} else {

						if (user) {
							next(new Error("email_exist"));
						} else {

							next();
						}
					}
				})
			}

		} else next();
	});

	schema.methods.isPwd = function (str, callback) {
		var self = this;
		bcrypt.compare(str, self.password, callback);
	};

	schema.pre('save', function (next) {
		var self = this;
		if (self.isNew) {
			bcrypt.hash(self.password, 10, function (err, hash) {
				if (err) next( new Error('bcrypt_error') ); else {

					self.password = hash;
					next();
				}
			})
		} else next();
	});

	var Users = mongoose.model('users', schema);

	return Users;

}