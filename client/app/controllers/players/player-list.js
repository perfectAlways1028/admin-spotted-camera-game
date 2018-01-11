'use strict';

angular.module('app').controller('PlayersListCtrl',
  function($scope, $location, Notifier, Player) {

  $scope.isLoading = true;

  (function loadData() {
    Player
      .query()
      .$promise
      .then(function(players) {
        $scope.players = players;
        $scope.isLoading = false;
      });
  })();

  $scope.viewPlayer = function(player) {
    $location.path('/players/' + player._id + '/view');
  };
});
