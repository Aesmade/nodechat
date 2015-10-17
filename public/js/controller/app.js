/* global angular */
/* global updateHandler */
var app = angular.module('chatapp', []);

app.controller('roomFetcher', function($scope, $http, $interval) {
    var lastDate = 0, promise;
    $scope.rooms = new Array();
    
    var update = function() {
        $http(
            { method: 'GET', url: '/getrooms/' + lastDate }
        ).then(function (response) {
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