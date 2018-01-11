'use strict';
var app = angular.module('app');
app.controller('BadgeNewCtrl',
  function($scope, $location, Notifier, Badge) {

  $scope.badge = {};
  $scope.isSaving = false;
  $scope.integerval = /^\d*$/;

  $scope.updateFormular = function() {
    if($scope.badge){
      var badge = $scope.badge;
      if(badge.property && badge.relation && badge.value)
      {
        badge.formular = "{ \"property\" : \"" + badge.property + "\", \"relation\" : \"" + badge.relation + "\", \"value\" : " + badge.value + "}";
      }
    }
  };
  
  $scope.createBadge = function() {
    $scope.isSaving = true;
    var badge = new Badge($scope.badge);
    badge
      .$save()
      .then(function() {
        Notifier.info('New badge created successfully');
        $location.path('/badges');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save changes');
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };
  $scope.uploadImage = function() {

  }
});
