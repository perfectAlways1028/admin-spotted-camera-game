'use strict';

angular.module('app').controller('UserNewCtrl',
  function($scope, $location, Notifier, User) {

  $scope.user = {};
  $scope.isSaving = false;

  $scope.createUser = function() {
    $scope.isSaving = true;
    var user = new User($scope.user);
    user
      .$save()
      .then(function() {
        Notifier.info('New user created successfully');
        $location.path('/users');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save changes');
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };
});
