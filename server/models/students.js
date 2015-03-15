
var addId = require('mongo-add-id');
module.exports = function (opts) {
	var mongoose = opts.mongoose;

	var schema = mongoose.Schema({
		name: String,
		family: String,
		visit_count: {type: Number, default: 0 },
	});
	addId(schema);

	var Students = mongoose.model('students', schema);

	return Students;
}