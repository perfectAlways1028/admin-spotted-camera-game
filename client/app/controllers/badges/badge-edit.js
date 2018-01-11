'use strict';

angular.module('app').controller('BadgeEditCtrl',
  function($scope, $routeParams, $location, Notifier, Badge) {

  $scope.isLoading = true;
  $scope.isSaving = false;

  (function loadData() {
    Badge
      .get({
        id: $routeParams._id
      })
      .$promise
      .then(function(badge) {
        $scope.badge = badge;
        $scope.isLoading = false;
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to load record');
        $location.path('/badges');
      });
  })();

  $scope.updateFormular = function() {
    if($scope.badge){
      var badge = $scope.badge;
      if(badge.property && badge.relation && badge.value)
      {
        badge.formular = "{ \"property\" : \"" + badge.property + "\", \"relation\" : \"" + badge.relation + "\", \"value\" : " + badge.value + "}";
      }
    }
  };
  
  $scope.saveBadge = function() {
    $scope.isSaving = true;
    $scope.badge
      .$update()
      .then(function() {
        Notifier.info('Badge updated successfully');
        $location.path('/badges');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save record');
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };
});
