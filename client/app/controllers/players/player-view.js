'use strict';

angular.module('app').controller('PlayerViewCtrl',
  function($scope, $routeParams, $location, Notifier, Player) {

  $scope.isLoading = true;
  $scope.isSaving = false;

  (function loadData() {
    Player
      .get({
        id: $routeParams._id
      })
      .$promise
      .then(function(player) {
        $scope.player = player;
        $scope.isLoading = false;
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to load record');
        $location.path('/players');
      });
  })();

  $scope.viewGame = function(game) {
    $location.path('/games/' + game._id + '/view');
  };

});
