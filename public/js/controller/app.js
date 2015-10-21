/* global angular */
/* global updateHandler */
var app = angular.module('chatapp', []);

app.controller('roomFetcher', function($scope, $http, $interval) {
    var lastDate = 0, promise;
    $scope.rooms = [];
    $scope.roomData = {};
    
    /* POST request to send a message */
    $scope.sendMsg = function(room, text, user) {
        console.log("Sending " + text + " to " + room + " as " + user);
        $http({
            method: 'POST',
            url: '/room/' + room + '/send',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                user: user,
                text: text
            }
        });
    };
    
    /* clear updating interrupt flag for a room and return if it was on */
    var clearInterrupt = function(room) {
        if ($scope.roomData[room] && $scope.roomData[room].interrupt) {
            $scope.roomData[room].interrupt = false;
            return true;
        }
        return false;
    }
    
    /* return a function that continuously polls the server for new messages for a room */
    var makePoller = function(room) {
		var poller = function() {
		    var lastDate = $scope.roomData[room] && $scope.roomData[room].lastDate || 0;
			$http({
                method: 'GET',
                url: '/room/' + room + '/getafter/' + lastDate + "?rnd=" + Math.random()
            }).then(function (response) {
                
                if (response.data.error) {
                    throw Error(response.data.error);
                }
                
                /* add new messages to array and keep the latest one's timestamp */
				response.data.forEach(function(msg) {
				    var time = new Date(msg.date).getTime();
				    var data = $scope.roomData[room];
				    data.lastDate = Math.max(time, lastDate);
				    data.msgs.push(msg);
				});
				
				/* if connection not interrupted, call this function again */
				if (!clearInterrupt(room))
				    poller();
				    
			}).catch(function (err) {
			    clearInterrupt(room);
				console.log(err);
			});
		};
		return poller;
	};
    
    /* poll the server for messages on this room */
    $scope.addRoom = function (room) {
        console.log("Adding " + room);
        if (!clearInterrupt(room)) {
            if (!$scope.roomData[room])
                $scope.roomData[room] = { lastDate: 0, interrupt: false, msgs: [] };
            makePoller(room)();
        }
    }
    
    /* stop polling for messages on this room */
    $scope.removeRoom = function (room) {
        console.log("Removing " + room);
        if ($scope.roomData[room])
            $scope.roomData[room].interrupt = true;
        else
            $scope.roomData[room] = { lastDate: 0, interrupt: true, msgs: [] };
    }
    
    /* get new rooms with a timestamp later than the last room found */
    var update = function() {
        $http({
            method: 'GET',
            url: '/getrooms/' + lastDate
        }).then(function (response) {
            response.data.rooms.forEach(function (obj) {
                console.log("New room object: " + obj);
                $scope.rooms.push(obj);
                if (obj.date > lastDate)
                    lastDate = obj.date;
            });
        }).catch(function (err) {
            alert(err.statusText);
            $interval.cancel(promise);
        });
    };
    
    /* POST request to create a new room */
    $scope.makenew = function(roomname) {
        var req = {
            method: 'POST',
            url: '/newroom',
            headers: {
                'Content-Type': 'application/json'
            },
            data: { name: roomname }
        };
        $http(req).then(function (response) {
            update();
        }).catch(function (err) {
            alert(err.statusText); 
        });
    };
    
    promise = $interval(update, 10000);
    update();
});

/* call updateHandler whenever rooms get updated */
app.directive('updateOnEnd', function() {
    return function(scope, element, attrs) {
        if (scope.$last)
            updateHandler();
    };
});