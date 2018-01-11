'use strict';

angular.module('app').controller('ModalCtrl', function($scope, $uibModalInstance, items) {
  $scope.items = items;

  $scope.ok = function(val) {
    $uibModalInstance.close(val);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
});
