'use strict';

angular.module('app').factory('Game', function($resource) {
  return $resource('/api/v1/games/:id',
    { id: '@_id' },
    {
      update: {
        method: 'PUT'
      }
    });
});
