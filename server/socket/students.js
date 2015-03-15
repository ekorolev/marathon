
module.exports = function (socket, opts) {

	var Students = opts.mongoose.models.students;
	var Visits = opts.mongoose.models.visits;

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
	
};