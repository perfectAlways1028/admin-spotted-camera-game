'use strict';

angular.module('app').factory('UserPassword', function($resource) {
  return $resource('/api/v1/userPassword/:id',
    { id: '@_id' },
    {
      update: {
        method: 'PUT',
        params: {
            id: "@id"
        }
      }
    });
});
