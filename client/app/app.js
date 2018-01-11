'use strict';

angular.module('app', [
  'ngResource',
  'ngRoute',
  'ngCookies',
  'ui.bootstrap',
  'ui.select',
  'textAngular',
  'mwl.confirm'
])
.config(function($routeProvider, $locationProvider, $httpProvider) {
  $locationProvider.html5Mode(true);
  $httpProvider.interceptors.push('HttpInterceptor');

  $routeProvider
    .when('/not-found', {
      templateUrl: 'views/not-found.html',
    })
    .when('/', {
      templateUrl: 'views/home.html',
    })
    .when('/terms', {
      templateUrl: 'views/terms.html',
      controller: 'TermOfServiceCtrl'
    })

    .when('/login', {
      templateUrl: 'views/account/login.html',
      controller: 'AccountLoginCtrl'
    })
    .when('/forget-password', {
      templateUrl: 'views/account/forget-password.html',
      controller: 'AccountForgetPasswordCtrl'
    })
    .when('/restore-password', {
      templateUrl: 'views/account/restore-password.html',
      controller: 'AccountRestorePasswordCtrl'
    })
    .when('/users', {
      templateUrl: 'views/users/users-list.html',
      controller: 'UsersListCtrl'
    })
    .when('/users/new', {
      templateUrl: 'views/users/user-new.html',
      controller: 'UserNewCtrl'
    })
    .when('/users/:_id/edit', {
      templateUrl: 'views/users/user-edit.html',
      controller: 'UserEditCtrl'
    })
    .when('/badges', {
      templateUrl: 'views/badges/badges-list.html',
      controller: 'BadgesListCtrl'
    })
    .when('/badges/new', {
      templateUrl: 'views/badges/badge-new.html',
      controller: 'BadgeNewCtrl'
    })
    .when('/badges/:_id/edit', {
      templateUrl: 'views/badges/badge-edit.html',
      controller: 'BadgeEditCtrl'
    })    .when('/players', {
      templateUrl: 'views/players/players-list.html',
      controller: 'PlayersListCtrl'
    })
    .when('/players/:_id/view', {
      templateUrl: 'views/players/player-view.html',
      controller: 'PlayerViewCtrl'
    })
    .when('/games', {
      templateUrl: 'views/games/games-list.html',
      controller: 'GamesListCtrl'
    })
    .when('/games/:_id/view', {
      templateUrl: 'views/games/game-view.html',
      controller: 'GameViewCtrl'
    })
    .when('/rounds/:_id/view', {
      templateUrl: 'views/rounds/round-view.html',
      controller: 'RoundViewCtrl'
    }) 
    .when('/profile', {
      templateUrl: 'views/profile/profile-edit.html',
      controller: 'ProfileEditCtrl'
    })


    .otherwise({
      redirectTo: '/not-found'
    });
})
.config(function($provide) {
  $provide.decorator('taOptions', ['taRegisterTool', '$delegate','$uibModal',
    function(taRegisterTool, taOptions, $uibModal) {

    taRegisterTool('table', {
      iconclass: 'fa fa-table',
      tooltiptext: 'insert table',
      action: function(deferred, restoreSelection) {
        var self = this;
        $uibModal
          .open({
            templateUrl: 'views/common/insert-table-dialog.html',
            controller: 'InsertTableDialogCtrl',
            resolve: {
              result: function () {
                return {};
              }
            },
            size: 'sm'
          })
          .result
          .then(function(result) {
            if (!result || !result.rows || !result.cols) {
              return;
            }
            deferred.promise
              .then(function() {
                restoreSelection();
                var html = _createTable(result.cols, result.rows);
                self.$editor().wrapSelection('insertHtml', html);
              });
            deferred.resolve();
          });

        return false;
      }
    });

    taOptions.toolbar[1].push('table');
    return taOptions;
  }]);
  

  function _createTable(colCount, rowCount) {
    var tds = '';
    var colWidth = Math.round(100 / colCount);
    for (var idxCol = 0; idxCol < colCount; idxCol++) {
      tds= tds + '<td style="width: ' + colWidth + '%"></td>';
    }
    var trs = '';
    for (var idxRow = 0; idxRow < rowCount; idxRow++) {
      trs = trs + '<tr>' + tds + '</tr>';
    }

    return '<table class="table table-bordered">' + trs + '</table>';
  }
});

angular.module('app').run(function($rootScope) {
  $rootScope.ifCond = function(op, v1, v2) {
    switch (op) {
      case 'and':
        return (v1 && v2);
      case 'not-and':
        return (!v1 && v2);
      case 'and-not':
        return (v1 && !v2);
      case 'not-and-not':
        return (!v1 && !v2);
      case 'or':
        return (v1 || v2);
      case 'not-or':
        return (!v1 || v2);
      case 'or-not':
        return (v1 || !v2);
      case 'not-or-not':
        return (!v1 || !v2);
    }
  };

  $rootScope.math = function(v1, op, v2) {  // chen_debug
    switch (op) {
      case 'add':
      case 'plus':
        return v1 + v2;
      case 'subtract':
      case 'minus':
        return v1 - v2;
      case 'multiply':
      case 'multiplied by':
        return v1 * v2;
      case 'divide':
      case 'divided by':
        return v1 / v2;
      case 'modulus':
      case 'modulo':
        return v1 % v2;
    }
  };

  $rootScope.case = function(op, v) {
    var titleCase = str => {
      return str.toLowerCase().replace(/\b[a-z]/g, firstLetter => {return firstLetter.toUpperCase();});
    }

    v = v.toString();
    switch(op) {
      case 'lower':
        return v.toLowerCase();
      case 'upper':
        return v.toUpperCase();
      case 'title':
        return titleCase(v);
      default:
        throw new Error('Invalid operator');
    }
  };

  $rootScope.ifVariant = function(v, opt) {
    return v === opt;
  };
});
