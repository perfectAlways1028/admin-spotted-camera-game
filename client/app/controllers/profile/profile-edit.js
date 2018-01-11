'use strict';

angular.module('app').controller('ProfileEditCtrl',
  function($scope, $routeParams, $location, Notifier, User, UserPassword, Identity) {

  $scope.isLoading = true;
  $scope.isSaving = false;

  (function loadData() {
    $scope.currentUser = Identity.getCurrentUser();
    User
      .get({
        id: $scope.currentUser._id
      })
      .$promise
      .then(function(user) {
        $scope.user = user;
        $scope.isLoading = false;
      })
      .catch(function(err) {
        Notifier.error(err, 'Current user ' + $scope.currentUser._id);
        Notifier.error(err, 'Unable to load profile');
        $location.path('/profile');
      });
  })();

  

  $scope.saveUser = function() {
    $scope.isSaving = true;
    $scope.user
      .$update()
      .then(function() {
        Notifier.info('Profile updated successfully');
        $location.path('/profile');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save profile.');
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };

  $scope.savePassword = function() {
    $scope.isPasswordSaving = true;
    UserPassword
      .update({
        id: $scope.currentUser._id
      }, $scope.user)
      .$promise
      .then(function() {
        Notifier.info('Password updated successfully');
        $location.path('/profile');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save password');
      })
      .finally(function() {
        $scope.isPasswordSaving = false;
      });
  }; 
});
