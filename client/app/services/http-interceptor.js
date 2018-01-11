'use strict';

angular.module('app').factory('HttpInterceptor', function($q, $location, Identity, Notifier) {
  return {
    responseError: function(rejection) {
      var currentPath = $location.path();

      if ((rejection.status === 401 || rejection.status === 403) && (currentPath.indexOf('/login') === -1)) {
        Notifier.warning('You need to login in');
        $location.path('/login').search({
          redirect: currentPath
        });
      }

      return $q.reject(rejection);
    }
  };
});
