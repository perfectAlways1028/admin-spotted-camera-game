'use strict';

angular.module('app').controller('UserEditCtrl',
  function($scope, $routeParams, $location, Notifier, User) {

  $scope.isLoading = true;
  $scope.isSaving = false;

  (function loadData() {
    User
      .get({
        id: $routeParams._id
      })
      .$promise
      .then(function(user) {
        $scope.user = user;
        $scope.isLoading = false;
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to load record');
        $location.path('/users');
      });
  })();

  $scope.saveUser = function() {
    $scope.isSaving = true;
    $scope.user
      .$update()
      .then(function() {
        Notifier.info('User updated successfully');
        $location.path('/users');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save record');
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };
});
