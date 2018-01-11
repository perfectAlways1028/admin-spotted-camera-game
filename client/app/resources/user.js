'use strict';

angular.module('app').factory('User', function($resource) {
  return $resource('/api/v1/users/:id',
    { id: '@_id' },
    {
      update: {
        method: 'PUT'
      }
    });
});
