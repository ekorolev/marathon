
var App = angular.module('App', [
	'ngRoute',
	'ngCookies',
	'ui.bootstrap'
]);

App.config(['$routeProvider', 
	function ($routeProvider) {
		$routeProvider.
			when('/', {
				
			}).
			when('/signup', {
				templateUrl: 'partials/signup.html',
				controller: 'signupController'
			}).
			when('/signin', {
				templateUrl: 'partials/signin.html',
				controller: 'signinController'
			}).
			when('/marathon', {
				templateUrl: 'partials/marathon.html',
				controller: 'marathonController'
			}).
			when('/student/:id', {
				templateUrl: 'partials/student.html',
				controller: 'studentController'
			}).
			otherwise({
				redirectTo: '/'
			});
	}
])

App.controller('mainController', ['$rootScope', '$scope', 'socket', '$cookieStore',
	function ($root, $scope, socket, $cookie) {
		$scope.title = '@eakorolev';

		$scope.subjects = [
			{ code: 'diskrl', name: "Дискретная математика (лекция)" },
			{ code: 'diskrp', name: "Дискретная математика (практика)"},
			{ code: 'matanl', name: "Математический анализ (лекция)"},
			{ code: 'matanp', name: 'Математический анализ (практика)'},
			{ code: 'evm', name: 'Практикум ЭВМ' },
			{ code: 'op', name: 'Основы программирования'},
			{ code: 'algeml', name: 'Алгебра и геометрия (лекция)'},
			{ code: 'algemp', name: 'Алгебра и геометрия (практика)'},
			{ code: 'hist', name: "История"}
		];

		var token = $cookie.get("token");
		if (token) {
			socket.emit("auth::check", {
				token: token
			}, function (data) {
				console.log("auth::check", data);
				if (data.success) {
					$root.auth_user = data.user;
					$scope.auth = true;
				} else {

					$cookie.remove("token");
				}
			});
		}

		$scope.logout = function () {
			$scope.auth = false;
			$root.auth_user = {};
			$cookie.remove("token");
			socket.emit("auth::logout", function (data) {

			});
		};
	}
])

App.controller('tableController', ['$scope', 'socket', 
	function ($scope, socket) {

	}
]);

App.controller('marathonController', ['$scope', 'socket', 
	function ($scope, socket) {
		$scope.visit = {};
		$scope.visit.day = new Date();

		socket.emit('students::get', null, function (data) {
			$scope.students = data.students;
			$scope.students.map( function (it) {
				it.visit = true;
			});
		});

		$scope.create = function (new_student) {

			socket.emit('students::create', new_student, function (data) {
				if (data.success) {
					if (!$scope.students) $scope.students = [];
					$scope.students.push(data.student);
				} else {
					console.log(data);
				}
			});

		}

		$scope.delete = function (id) {
			console.log('delete', id);
			socket.emit('students::delete', {
				id: id
			}, function (data) {
				if (data.success) {
					var index;
					for (var i = 0; i < $scope.students.length; ++i ){
						if ($scope.students[i]._id == id ) {
							index = i;
						}
					}
					if (index) $scope.students.splice(index, 1);
				}
			});

		}

		$scope.add_visit = function () {
			socket.emit('students::add_visit', {
				students: $scope.students,
				subject: $scope.visit.subject,
				day: $scope.visit.day,
				num_of_subject: $scope.visit.num_of_subject
			}, function (data) {
				console.log(data);
			});
		}
	}
]);

App.controller('studentController', [
	'$rootScope', '$scope', 'socket', '$cookieStore', '$routeParams',
	function ($root, $scope, socket, $cookie, $routeParams) {
		var id = $routeParams.id;

		socket.emit('students::show', {
			id: id
		}, function (data) {

			$scope.student = data.student;
			$scope.visits = data.visits;
		});

		$scope.do_no_visit = function (id) {
			socket.emit("students::do_no_visit", {
				id: id
			}, function (data) {

			});
		}
	}
])

App.controller('signupController', ['$rootScope', '$scope', 'socket', '$cookieStore', 
	function ($root, $scope, socket, $cookie) {

		$scope.signup = function (user) {

			socket.emit('auth::signup', user, function (data) {
				console.log('auth::signup', data);

				if (data.success) {

					$cookie.put("token", data.token);
					$root.auth_user = data.user;
				}
			});

		}
	}
]);

App.controller('signinController', ['$rootScope', '$scope', 'socket', '$cookieStore', 
	function ($root, $scope, socket, $cookie) {
		$scope.signin = function (user) {
			socket.emit('auth::signin', user, function (data) {
				console.log('auth::signin', data);

				if (data.success) {
					$cookie.put("token", data.token);
					$root.auth_user = data.user;
					$root.auth = true;
					window.location.href = '#/';
				}
			});
		}
	}
]);

App.factory('socket', function ($rootScope) {
	var socket = io.connect();
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			})
		},

		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});

			});
		}
	} // return object
})

App.filter('subject', function (){
	return function (input) {
		switch(input) {
			case 'diskrl': return "Дискретная математика (лекция)";
			case 'diskrp': return "Дискретная математика (практика)";
			case 'matanl': return "Математический анализ (лекция)";
			case 'matanp': return "Математический анализ (практика)";
			case 'op': return "Основы программирования";
			case 'evm': return "Практикум ЭВМ";
			case 'hist': return "История";
			default: return null;
		}
	};
});