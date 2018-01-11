'use strict';

angular.module('app').controller('NavbarCtrl', function($scope, $location, Auth, Identity) {
  $scope.currentUser = Identity.getCurrentUser();

  $scope.isActive = function(route) {
    var currentRoute = $location.path();
    return _.startsWith(currentRoute, route);
  };

  $scope.logout = function() {
    Auth.logout();
    $location.path('/login');
  };
});
