'use strict';

angular.module('app').controller('AccountLoginCtrl',
  function($scope, $location, $window, Notifier, Auth) {

  $scope.user = {};

  $scope.login = function() {
    $scope.isRequesting = true;
    Auth
      .login({
        email: $scope.user.email,
        password: $scope.user.password
      })
      .then(function () {
          $location.path('/');
      })
      .catch(function(err) {
        Notifier.warning(err);
      })
      .finally(function() {
        $scope.isRequesting = false;
      });
  };
});
