'use strict';

angular.module('app').factory('Round', function($resource) {
  return $resource('/api/v1/rounds/:id',
    { id: '@_id' },
    {
      update: {
        method: 'PUT'
      }
    });
});
