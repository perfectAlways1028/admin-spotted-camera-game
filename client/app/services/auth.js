'use strict';

angular.module('app').factory('Auth', function($location, $rootScope, $http, Identity) {
  return {
    login: function(user) {
      return $http
        .post('/api/v1/auth/login', {
          email: user.email,
          password: user.password
        })
        .then(function(res) {
          Identity.setTokenAndUser(res.data);
          Identity.setCurrentUser(res.data.user);
          return Identity.getCurrentUser();
        });
    },

    logout: function() {
      Identity.setCurrentUser();
      Identity.removeTokenAndUser();
    },

    forgetPassword: function(email) {
      return $http.post('/api/v1/auth/forget-password', {
        email: email
      });
    },

    restorePassword: function(token, newPassword) {
      return $http.post('/api/v1/auth/restore-password', {
        token: token,
        newPassword: newPassword
      });
    }
  };
});
