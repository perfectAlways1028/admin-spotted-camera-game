'use strict';

angular.module('app').controller('BadgesListCtrl',
  function($scope, $location, Notifier, Badge) {

  $scope.isLoading = true;
  $scope.loadData = function loadData() {
    Badge
      .query()
      .$promise
      .then(function(badges) {
        $scope.badges = badges;
        $scope.isLoading = false;
      });
  };
  $scope.loadData();

  $scope.editBadge = function(badge) {
    $location.path('/badges/' + badge._id + '/edit');
  };

  $scope.removeBadge = function(badge){
    $scope.isLoading = true;
    badge
      .$delete()
      .then(function() {
        Notifier.info('Project removed successfully');
        $scope.loadData();
      })
      .catch(function(err) {
        $scope.isLoading = false;
        Notifier.error(err, 'Unable to remove project');
      })
  };

});
