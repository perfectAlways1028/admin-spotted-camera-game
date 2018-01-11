'use strict';

angular.module('app').controller('RoundViewCtrl',
  function($scope, $routeParams, $location, Notifier, Round) {

  $scope.isLoading = true;
  $scope.isSaving = false;

  (function loadData() {
    Round
      .get({
        id: $routeParams._id
      })
      .$promise
      .then(function(round) {
        $scope.round = round;
        $scope.isLoading = false;
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to load record');
        $location.path('/games');
      });
  })();

  $scope.viewImage = function(round) {
    $location.path('/rounds/' + round._id + '/image');
  };

});
