
var addId = require('mongo-add-id')
module.exports = function ( opts ) {
	var mongoose = opts.mongoose;

	var schema = mongoose.Schema({
		subject: String,
		num_of_subject: Number,
		student_id: String,
		day: Date,
		visit: Boolean,
		doNoVisit: { type: Boolean, default: false },
	});
	addId(schema);

	schema.pre('save', function (next) {
		if (this.isNew && this.visit) {
			var self = this;

			var Students = mongoose.models.students;
			Students.update({
				_id: self.student_id
			}, {
				$inc: { visit_count: 1 }
			}, function (err, count) {
				next();
			});

		} else next();
	});

	schema.pre('save', function (next) {
		var self = this;
		if (self.doNoVisit) {
			self.visit = false;
			self.doNoVisit = false;
			var Students = mongoose.models.students;

			Students.update({
				_id: self.student_id
			}, {
				$inc: { visit_count: -1 }
			}, function (err, count) {
				next();
			});
		} else next();
	});

	schema.post('remove', function (visit) {
		if (visit.visit) {

			var Students = mongoose.models.students;
			Students.update({
				_id: visit.student_id
			}, {
				$inc: { visit_count: -1 }
			}, function (err, count) {

			});
		}
	})

	var Visits = mongoose.model("visits", schema);

	return Visits;
}