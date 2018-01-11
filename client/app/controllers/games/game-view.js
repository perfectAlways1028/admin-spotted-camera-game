'use strict';

angular.module('app').controller('GameViewCtrl',
  function($scope, $routeParams, $location, Notifier, Game) {

  $scope.isLoading = true;
  $scope.isSaving = false;

  (function loadData() {
    Game
      .get({
        id: $routeParams._id
      })
      .$promise
      .then(function(game) {
        $scope.game = game;
        $scope.isLoading = false;
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to load record');
        $location.path('/games');
      });
  })();

  $scope.viewRound = function(round) {
    $location.path('/rounds/' + round._id + '/view');
  };

});
