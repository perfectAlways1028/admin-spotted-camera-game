'use strict';

angular.module('app').factory('Identity', function($cookieStore) {
  var _currentUser;

  return {
    getCurrentUser: function() {
      if (!_currentUser) {
        _currentUser = this.getUser() || {};
      }
      return _currentUser;
    },

    setCurrentUser: function(user) {
      _currentUser = user || {};
    },

    setTokenAndUser: function(data) {
      $cookieStore.put('token', data.token);
      $cookieStore.put('currentUser', data.user);
    },

    getToken: function() {
      return $cookieStore.get('token');
    },

    getUser: function() {
      return $cookieStore.get('currentUser');
    },

    removeTokenAndUser: function() {
      $cookieStore.remove('token');
      $cookieStore.remove('currentUser');
    },

    isLoggedIn: function() {
      return !_.isEmpty(_currentUser);
    },

    isAdmin: function() {
      return _.get(_currentUser, 'role') === 'admin';
    },

    isUser: function() {
      return _.get(_currentUser, 'role') === 'user';
    }
  };
});
