'use strict';

angular.module('app').controller('AccountRestorePasswordCtrl', function($scope, $location, Auth, Notifier) {
  $scope.send = function() {
    if ($scope.validatePasswords()) {
      $scope.isSaving = true;
      Auth
        .restorePassword($location.search().token, $scope.newPassword)
        .then(function() {
          $scope.isPasswordRestored = true;
        })
        .catch(function(err) {
          Notifier.warning(err);
        })
        .finally(function() {
          $scope.isSaving = false;
        });
    }
  };

  $scope.validatePasswords = function() {
    $scope.passwordsDontMatchError = ($scope.newPassword !== $scope.passwordConfirmation);
    return !$scope.passwordsDontMatchError;
  };
});
