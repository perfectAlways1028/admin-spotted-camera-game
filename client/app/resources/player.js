'use strict';

angular.module('app').factory('Player', function($resource) {
  return $resource('/api/v1/players/:id',
    { id: '@_id' },
    {
      update: {
        method: 'PUT'
      }
    });
});
