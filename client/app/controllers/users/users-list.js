'use strict';

angular.module('app').controller('UsersListCtrl',
  function($scope, $location, Notifier, User) {

  $scope.isLoading = true;

  (function loadData() {
    User
      .query()
      .$promise
      .then(function(users) {
        $scope.users = users;
        $scope.isLoading = false;
      });
  })();

  $scope.editUser = function(user) {
    $location.path('/users/' + user._id + '/edit');
  };

  $scope.setUserStatus = function(user, status) {
    $scope.isSaving = true;
    user.status = status;
    user
      .$update()
      .then(function() {
        Notifier.info('User updated successfully');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save record');
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };
});
