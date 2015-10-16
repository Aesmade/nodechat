/* global angular */
angular.module('roomlist', []).
controller('roomfetcher', function($scope, $http, $interval) {
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
            window.location = "room/" + response.data.id;
        }).catch(function (err) {
            alert(err.statusText); 
        });
    }
    
    var promise;
    var update = function() {
        $http(
            {method: 'GET', url: '/getrooms'}
        ).then(function (response) {
            $scope.rooms = response.data.rooms;
        }).catch(function (err) {
            alert(err.statusText);
            $interval.cancel(promise);
        });
    }
    promise = $interval(update, 1000);
    update();
});