
var App = angular.module('App', [
	'ngRoute',
	'ngCookies',
	'ui.bootstrap',
	'controllers'
]);

App.config(['$routeProvider', 
	function ($routeProvider) {
		$routeProvider.
			when('/', {
				templateUrl: 'partials/start.html'
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
			when('/chat/', {
				templateUrl: 'partials/chat.html',
				controller: 'chatController'
			}).
			when('/profile', {
				templateUrl: 'partials/profile.html',
				controller: 'profileController'
			}).
			otherwise({
				redirectTo: '/'
			});
	}
]);

App.controller('chatController', ['$rootScope', '$scope', 'socket', 
	function ($root, $scope, socket) {

		socket.emit('chat::get', null, function (data) {					
			for (var i = 0; i<data.messages.length; ++i ) {
				data.messages[i].created = new Date(data.messages[i].created);
			}
			$scope.messages = data.messages;
		})

		$scope.send = function (message) {
			socket.emit('chat::new_message', {
				message: message
			}, function (data){
				if (data.success) {
					data.message.created = new Date(data.message.created);
					$scope.messages.push(data.message);
				}
				$scope.message = "";
			})
		}

		socket.on('chat::new_message', function (data) {
			data.created = new Date(data.created);
			$scope.messages.push(data);
		})
	}
]);

App.controller('mainController', ['$rootScope', '$scope', 'socket', '$cookieStore',
	function ($root, $scope, socket, $cookie) {
		$scope.title = '132 группа. Марафон посещаемости.';

		$scope.subjects = [
			{ code: 'diskrl', name: "Дискретная математика (лекция)" },
			{ code: 'diskrp', name: "Дискретная математика (практика)"},
			{ code: 'matanl', name: "Математический анализ (лекция)"},
			{ code: 'matanp', name: 'Математический анализ (практика)'},
			{ code: 'evm', name: 'Практикум ЭВМ' },
			{ code: 'arch', name: 'Архитектура ЭВМ' },
			{ code: 'op', name: 'Основы программирования'},
			{ code: 'algeml', name: 'Алгебра и геометрия (лекция)'},
			{ code: 'algemp', name: 'Алгебра и геометрия (практика)'},
			{ code: 'hist', name: "История"},
		];

		var token = $cookie.get("token");
		if (token) {
			socket.emit("auth::check", {
				token: token
			}, function (data) {
				console.log("auth::check", data);
				if (data.success) {
					$root.auth_user = data.user;
					$root.auth = true;
				} else {

					$root.auth = false;
					$root.auth_user = {};
					$cookie.remove("token");
				}
			});
		}

		$scope.logout = function () {
			$root.auth = false;
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
					data.student.visit = true;
					$scope.students.push(data.student);

					new_student.name = "";
					new_student.family = "";
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
					var index=-1;
					for (var i = 0; i < $scope.students.length; ++i ){
						if ($scope.students[i]._id == id ) {
							index = i;
						}
					}
					if (index+1) $scope.students.splice(index, 1);
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
		$scope.load = false;

		$scope.signup = function (user) {
			$scope.load = true;

			socket.emit('auth::signup', user, function (data) {
				
				console.log('auth::signup', data);

				if (data.success) {

					$cookie.put("token", data.token);
					$root.auth_user = data.user;
					$root.auth = true;
					$scope.load = false;
					window.location.href = '#/';
				} else {

					$scope.error = data.error;
					$scope.load = false;
				}
			});

		}
	}
]);

App.controller('signinController', ['$rootScope', '$scope', 'socket', '$cookieStore', 
	function ($root, $scope, socket, $cookie) {
		$scope.load = false;
		$scope.signin = function (user) {
			$scope.iserror = false;
			$scope.load = true;
			socket.emit('auth::signin', user, function (data) {
				console.log('auth::signin', data);

				if (data.success) {
					$cookie.put("token", data.token);
					$root.auth_user = data.user;
					$root.auth = true;
					window.location.href = '#/';
				} else {

					$scope.iserror = true;
					$scope.load = false;
					$scope.error = data.error;
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
			case 'algeml': return "Алгебра и геометрия (лекция)";
			case 'algemp': return "Алгебра и геометрия (практика)";
			case 'op': return "Основы программирования";
			case 'evm': return "Практикум ЭВМ";
			case 'arch': return 'Архитектура ЭВМ';
			case 'hist': return "История";
			default: return null;
		}
	};
});

App.filter('error_message', function (){
	return function (input) {
		switch(input) {
			case 'db_error': return "Ошибка базы данных. Попробуйте позже.";
			case 'pwd': return "Неправильный логин или пароль. Попробуйте еще раз.";
			default: return null;
		}
	};
});