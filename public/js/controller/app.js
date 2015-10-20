/* global angular */
/* global updateHandler */
var app = angular.module('chatapp', []);

app.controller('roomFetcher', function($scope, $http, $interval) {
    var lastDate = 0, promise;
    $scope.rooms = [];
    $scope.roomData = {};
    
    var clearInterrupt = function(room) {
        if ($scope.roomData[room] && $scope.roomData[room].interrupt) {
            $scope.roomData[room].interrupt = false;
            return true;
        }
        return false;
    }
    
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
                
				response.data.forEach(function(msg) {
				    var time = new Date(msg.date).getTime();
				    var data = $scope.roomData[room];
				    data.lastDate = Math.max(time, lastDate);
				    data.msgs.push(msg);
				});
				
				if (!clearInterrupt(room))
				    poller();
				    
			}).catch(function (err) {
			    clearInterrupt(room);
				console.log(err);
			});
		};
		return poller;
	};
    
    $scope.addRoom = function (room) {
        console.log("Adding " + room);
        if (!clearInterrupt(room)) {
            if (!$scope.roomData[room]) {
                $scope.roomData[room] = { lastDate: 0, interrupt: false, msgs: [] };
                console.log("new room");
            }
            makePoller(room)();
        }
    }
    
    $scope.removeRoom = function (room) {
        console.log("Removing " + room);
        if ($scope.roomData[room])
            $scope.roomData[room].interrupt = true;
        else
            $scope.roomData[room] = { lastDate: 0, interrupt: true, msgs: [] };
    }
    
    var update = function() {
        $http({
            method: 'GET',
            url: '/getrooms/' + lastDate
        }).then(function (response) {
            response.data.rooms.forEach(function (obj) {
                console.log(obj);
                $scope.rooms.push(obj);
                if (obj.date > lastDate)
                    lastDate = obj.date;
            });
        }).catch(function (err) {
            alert(err.statusText);
            $interval.cancel(promise);
        });
    };
    
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

app.directive('updateOnEnd', function() {
    return function(scope, element, attrs) {
        if (scope.$last)
            updateHandler();
    };
});