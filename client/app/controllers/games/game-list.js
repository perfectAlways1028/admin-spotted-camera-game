'use strict';

angular.module('app').controller('GamesListCtrl',
  function($scope, $location, Notifier, Game) {

  $scope.isLoading = true;

  (function loadData() {
    Game
      .query()
      .$promise
      .then(function(games) {
        $scope.games = games;
        $scope.isLoading = false;
      });
  })();

  $scope.viewGame = function(game) {
    $location.path('/games/' + game._id + '/view');
  };
});
