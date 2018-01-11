'use strict';

angular.module('app').controller('MainCtrl', function ($scope, $location, Identity, $cookieStore) {
  $scope.currentUser = Identity.getCurrentUser();

  if (!Identity.isLoggedIn()) {
    $location.path('/login');
  }

  if (Identity.isLoggedIn() && !$cookieStore.get('terms') && Identity.isUser()) {
    $location.path('/terms');
  }

  if (Identity.isUser() && $location.path() === '/') {
    $location.path('/projects');
  }
});
