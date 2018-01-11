'use strict';

angular.module('app').controller('AccountForgetPasswordCtrl', function($scope, Auth, Notifier) {
  $scope.send = function() {
    $scope.isSaving = true;
    Auth
      .forgetPassword($scope.email)
      .then(function() {
        $scope.success = true;
      })
      .catch(function(err) {
        Notifier.warning(err);
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };
});
