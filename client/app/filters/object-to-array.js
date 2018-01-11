'use strict';

angular.module('app').filter('objectToArray', function() {
  return function(obj) {
    return _.map(obj);
  };
});
