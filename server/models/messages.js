
module.exports = function (opts) {
	var mongoose = opts.mongoose;

	var schema = mongoose.Schema({
		name: String,
		user_id: String,
		message: String,
		created: Date
	});

	var Messages = mongoose.model('messages', schema);

	return Messages;
}