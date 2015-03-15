
var addId = require('mongo-add-id');
var bcrypt = require('bcrypt');
module.exports = function (opts) {
	var mongoose = opts.mongoose;

	var schema = mongoose.Schema({
		login: { type: String, unique: true},
		password: String,
		socket_id: String,
		role: String,
	});
	addId(schema);

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