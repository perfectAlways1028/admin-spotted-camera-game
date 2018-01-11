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
.config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
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
}])
.config(['$provide', function($provide) {
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
}]);

angular.module('app').run(['$rootScope', function($rootScope) {
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
}]);

'use strict';

angular.module('app').controller('MainCtrl', ['$scope', '$location', 'Identity', '$cookieStore', function ($scope, $location, Identity, $cookieStore) {
  $scope.currentUser = Identity.getCurrentUser();

  if (!Identity.isLoggedIn()) {
    $location.path('/login');
  }

  if (Identity.isLoggedIn() && !$cookieStore.get('terms') && Identity.isUser()) {
    $location.path('/terms');
  }

  if (Identity.isUser() && $location.path() === '/') {
    $location.path('/projects');
  }
}]);

'use strict';

angular.module('app').controller('NavbarCtrl', ['$scope', '$location', 'Auth', 'Identity', function($scope, $location, Auth, Identity) {
  $scope.currentUser = Identity.getCurrentUser();

  $scope.isActive = function(route) {
    var currentRoute = $location.path();
    return _.startsWith(currentRoute, route);
  };

  $scope.logout = function() {
    Auth.logout();
    $location.path('/login');
  };
}]);

'use strict';

angular.module('app').controller('AccountForgetPasswordCtrl', ['$scope', 'Auth', 'Notifier', function($scope, Auth, Notifier) {
  $scope.send = function() {
    $scope.isSaving = true;
    Auth
      .forgetPassword($scope.email)
      .then(function() {
        $scope.success = true;
      })
      .catch(function(err) {
        Notifier.warning(err);
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };
}]);

'use strict';

angular.module('app').controller('AccountLoginCtrl',
  ['$scope', '$location', '$window', 'Notifier', 'Auth', function($scope, $location, $window, Notifier, Auth) {

  $scope.user = {};

  $scope.login = function() {
    $scope.isRequesting = true;
    Auth
      .login({
        email: $scope.user.email,
        password: $scope.user.password
      })
      .then(function () {
          $location.path('/');
      })
      .catch(function(err) {
        Notifier.warning(err);
      })
      .finally(function() {
        $scope.isRequesting = false;
      });
  };
}]);

'use strict';

angular.module('app').controller('AccountRestorePasswordCtrl', ['$scope', '$location', 'Auth', 'Notifier', function($scope, $location, Auth, Notifier) {
  $scope.send = function() {
    if ($scope.validatePasswords()) {
      $scope.isSaving = true;
      Auth
        .restorePassword($location.search().token, $scope.newPassword)
        .then(function() {
          $scope.isPasswordRestored = true;
        })
        .catch(function(err) {
          Notifier.warning(err);
        })
        .finally(function() {
          $scope.isSaving = false;
        });
    }
  };

  $scope.validatePasswords = function() {
    $scope.passwordsDontMatchError = ($scope.newPassword !== $scope.passwordConfirmation);
    return !$scope.passwordsDontMatchError;
  };
}]);

'use strict';

angular.module('app').controller('BadgeEditCtrl',
  ['$scope', '$routeParams', '$location', 'Notifier', 'Badge', function($scope, $routeParams, $location, Notifier, Badge) {

  $scope.isLoading = true;
  $scope.isSaving = false;

  (function loadData() {
    Badge
      .get({
        id: $routeParams._id
      })
      .$promise
      .then(function(badge) {
        $scope.badge = badge;
        $scope.isLoading = false;
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to load record');
        $location.path('/badges');
      });
  })();

  $scope.updateFormular = function() {
    if($scope.badge){
      var badge = $scope.badge;
      if(badge.property && badge.relation && badge.value)
      {
        badge.formular = "{ \"property\" : \"" + badge.property + "\", \"relation\" : \"" + badge.relation + "\", \"value\" : " + badge.value + "}";
      }
    }
  };
  
  $scope.saveBadge = function() {
    $scope.isSaving = true;
    $scope.badge
      .$update()
      .then(function() {
        Notifier.info('Badge updated successfully');
        $location.path('/badges');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save record');
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };
}]);

'use strict';

angular.module('app').controller('BadgesListCtrl',
  ['$scope', '$location', 'Notifier', 'Badge', function($scope, $location, Notifier, Badge) {

  $scope.isLoading = true;
  $scope.loadData = function loadData() {
    Badge
      .query()
      .$promise
      .then(function(badges) {
        $scope.badges = badges;
        $scope.isLoading = false;
      });
  };
  $scope.loadData();

  $scope.editBadge = function(badge) {
    $location.path('/badges/' + badge._id + '/edit');
  };

  $scope.removeBadge = function(badge){
    $scope.isLoading = true;
    badge
      .$delete()
      .then(function() {
        Notifier.info('Project removed successfully');
        $scope.loadData();
      })
      .catch(function(err) {
        $scope.isLoading = false;
        Notifier.error(err, 'Unable to remove project');
      })
  };

}]);

'use strict';
var app = angular.module('app');
app.controller('BadgeNewCtrl',
  ['$scope', '$location', 'Notifier', 'Badge', function($scope, $location, Notifier, Badge) {

  $scope.badge = {};
  $scope.isSaving = false;
  $scope.integerval = /^\d*$/;

  $scope.updateFormular = function() {
    if($scope.badge){
      var badge = $scope.badge;
      if(badge.property && badge.relation && badge.value)
      {
        badge.formular = "{ \"property\" : \"" + badge.property + "\", \"relation\" : \"" + badge.relation + "\", \"value\" : " + badge.value + "}";
      }
    }
  };
  
  $scope.createBadge = function() {
    $scope.isSaving = true;
    var badge = new Badge($scope.badge);
    badge
      .$save()
      .then(function() {
        Notifier.info('New badge created successfully');
        $location.path('/badges');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save changes');
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };
  $scope.uploadImage = function() {

  }
}]);

'use strict';

angular.module('app').controller('TermOfServiceCtrl',
  ['$scope', '$location', '$cookieStore', function ($scope, $location, $cookieStore) {
    $scope.terms = $cookieStore.get('terms');
    $scope.acceptTerms = function () {
      $cookieStore.put('terms', true);
      $location.path('/projects')
    };
  }]);

'use strict';

angular.module('app').controller('ModalCtrl', ['$scope', '$uibModalInstance', 'items', function($scope, $uibModalInstance, items) {
  $scope.items = items;

  $scope.ok = function(val) {
    $uibModalInstance.close(val);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
}]);

'use strict';

angular.module('app').controller('GamesListCtrl',
  ['$scope', '$location', 'Notifier', 'Game', function($scope, $location, Notifier, Game) {

  $scope.isLoading = true;

  (function loadData() {
    Game
      .query()
      .$promise
      .then(function(games) {
        $scope.games = games;
        $scope.isLoading = false;
      });
  })();

  $scope.viewGame = function(game) {
    $location.path('/games/' + game._id + '/view');
  };
}]);

'use strict';

angular.module('app').controller('GameViewCtrl',
  ['$scope', '$routeParams', '$location', 'Notifier', 'Game', function($scope, $routeParams, $location, Notifier, Game) {

  $scope.isLoading = true;
  $scope.isSaving = false;

  (function loadData() {
    Game
      .get({
        id: $routeParams._id
      })
      .$promise
      .then(function(game) {
        $scope.game = game;
        $scope.isLoading = false;
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to load record');
        $location.path('/games');
      });
  })();

  $scope.viewRound = function(round) {
    $location.path('/rounds/' + round._id + '/view');
  };

}]);


'use strict';

angular.module('app').controller('NavbarCtrl', ['$scope', '$location', 'Auth', 'Identity', function($scope, $location, Auth, Identity) {
  $scope.currentUser = Identity.getCurrentUser();

  $scope.isActive = function(route) {
    var currentRoute = $location.path();
    return _.startsWith(currentRoute, route);
  };

  $scope.logout = function() {
    Auth.logout();
    $location.path('/login');
  };
}]);

'use strict';

angular.module('app').controller('PlayersListCtrl',
  ['$scope', '$location', 'Notifier', 'Player', function($scope, $location, Notifier, Player) {

  $scope.isLoading = true;

  (function loadData() {
    Player
      .query()
      .$promise
      .then(function(players) {
        $scope.players = players;
        $scope.isLoading = false;
      });
  })();

  $scope.viewPlayer = function(player) {
    $location.path('/players/' + player._id + '/view');
  };
}]);

'use strict';

angular.module('app').controller('PlayerViewCtrl',
  ['$scope', '$routeParams', '$location', 'Notifier', 'Player', function($scope, $routeParams, $location, Notifier, Player) {

  $scope.isLoading = true;
  $scope.isSaving = false;

  (function loadData() {
    Player
      .get({
        id: $routeParams._id
      })
      .$promise
      .then(function(player) {
        $scope.player = player;
        $scope.isLoading = false;
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to load record');
        $location.path('/players');
      });
  })();

  $scope.viewGame = function(game) {
    $location.path('/games/' + game._id + '/view');
  };

}]);

'use strict';

angular.module('app').controller('ProfileEditCtrl',
  ['$scope', '$routeParams', '$location', 'Notifier', 'User', 'UserPassword', 'Identity', function($scope, $routeParams, $location, Notifier, User, UserPassword, Identity) {

  $scope.isLoading = true;
  $scope.isSaving = false;

  (function loadData() {
    $scope.currentUser = Identity.getCurrentUser();
    User
      .get({
        id: $scope.currentUser._id
      })
      .$promise
      .then(function(user) {
        $scope.user = user;
        $scope.isLoading = false;
      })
      .catch(function(err) {
        Notifier.error(err, 'Current user ' + $scope.currentUser._id);
        Notifier.error(err, 'Unable to load profile');
        $location.path('/profile');
      });
  })();

  

  $scope.saveUser = function() {
    $scope.isSaving = true;
    $scope.user
      .$update()
      .then(function() {
        Notifier.info('Profile updated successfully');
        $location.path('/profile');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save profile.');
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };

  $scope.savePassword = function() {
    $scope.isPasswordSaving = true;
    UserPassword
      .update({
        id: $scope.currentUser._id
      }, $scope.user)
      .$promise
      .then(function() {
        Notifier.info('Password updated successfully');
        $location.path('/profile');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save password');
      })
      .finally(function() {
        $scope.isPasswordSaving = false;
      });
  }; 
}]);

'use strict';

angular.module('app').controller('RoundViewCtrl',
  ['$scope', '$routeParams', '$location', 'Notifier', 'Round', function($scope, $routeParams, $location, Notifier, Round) {

  $scope.isLoading = true;
  $scope.isSaving = false;

  (function loadData() {
    Round
      .get({
        id: $routeParams._id
      })
      .$promise
      .then(function(round) {
        $scope.round = round;
        $scope.isLoading = false;
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to load record');
        $location.path('/games');
      });
  })();

  $scope.viewImage = function(round) {
    $location.path('/rounds/' + round._id + '/image');
  };

}]);

'use strict';

angular.module('app').controller('UserEditCtrl',
  ['$scope', '$routeParams', '$location', 'Notifier', 'User', function($scope, $routeParams, $location, Notifier, User) {

  $scope.isLoading = true;
  $scope.isSaving = false;

  (function loadData() {
    User
      .get({
        id: $routeParams._id
      })
      .$promise
      .then(function(user) {
        $scope.user = user;
        $scope.isLoading = false;
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to load record');
        $location.path('/users');
      });
  })();

  $scope.saveUser = function() {
    $scope.isSaving = true;
    $scope.user
      .$update()
      .then(function() {
        Notifier.info('User updated successfully');
        $location.path('/users');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save record');
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };
}]);

'use strict';

angular.module('app').controller('UserNewCtrl',
  ['$scope', '$location', 'Notifier', 'User', function($scope, $location, Notifier, User) {

  $scope.user = {};
  $scope.isSaving = false;

  $scope.createUser = function() {
    $scope.isSaving = true;
    var user = new User($scope.user);
    user
      .$save()
      .then(function() {
        Notifier.info('New user created successfully');
        $location.path('/users');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save changes');
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };
}]);

'use strict';

angular.module('app').controller('UsersListCtrl',
  ['$scope', '$location', 'Notifier', 'User', function($scope, $location, Notifier, User) {

  $scope.isLoading = true;

  (function loadData() {
    User
      .query()
      .$promise
      .then(function(users) {
        $scope.users = users;
        $scope.isLoading = false;
      });
  })();

  $scope.editUser = function(user) {
    $location.path('/users/' + user._id + '/edit');
  };

  $scope.setUserStatus = function(user, status) {
    $scope.isSaving = true;
    user.status = status;
    user
      .$update()
      .then(function() {
        Notifier.info('User updated successfully');
      })
      .catch(function(err) {
        Notifier.error(err, 'Unable to save record');
      })
      .finally(function() {
        $scope.isSaving = false;
      });
  };
}]);

'use strict';

angular.module('app')
.directive('dynamicHtml', ['$compile', '$timeout', function($compile, $timeout) {
  return {
    restrict: 'E',
    scope: {
      template: '=',
      variables: '=',
      selectedVariable: '=',
      onChange: '&'
    },
    link: function($scope, $element) {
      $scope.datePickers = {};

      $scope.onClick = function (variable, $event) {
        var currentTarget = $event.currentTarget;

        // accessing to projectEditor method.
        // Second argument tells for highlighting from editor,
        // but not from properties left-side block.
	      $scope.$parent.$parent.highlight(variable, true, currentTarget);
      }

      $timeout(function() {
        $scope.$apply(function() {
          var content = $compile($scope.template)($scope);
          $element.append(content);
        });
      });
    }
  };
}])
.directive("compareTo", function() {
    return {
      require: "ngModel",
      scope: {
        otherModelValue: "=compareTo"
      },
      link: function(scope, element, attributes, ngModel) {

        ngModel.$validators.compareTo = function(modelValue) {
          return modelValue == scope.otherModelValue;
        };

        scope.$watch("otherModelValue", function() {
          ngModel.$validate();
        });
      }
    };
  })
.directive('filesModel', ['$parse', function ($parse) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs){
      var model = $parse(attrs.filesModel)
        , modelSetter = model.assign
      element.bind('change', function(){
        scope.$apply(function(){
          modelSetter(scope, element[0].files)
        })
      })
    }
  };
}])
.directive('ngOffset', ['$filter', function($filter) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      scope.$watch(attrs.ngOffset, function(newVal, oldVal, scope){
        if (newVal !== undefined) {
          var offsetDate = new Date(scope.$eval(element.attr('ng-model')));

          offsetDate.setDate(offsetDate.getDate() + newVal);
          element.text($filter('date')(offsetDate, 'MMMM d, yyyy'));
        }
      });
      scope.$watch(attrs.ngModel, function(newVal, oldVal, scope){
        if (newVal !== undefined) {
          var offsetDate = new Date(newVal);
          var offset = 0;
          var is_offset_variable = element.attr('ng-date-offset-variable');
          if (is_offset_variable == "true") {
            var offset_variable = element.attr('ng-offset');
            offset = scope.$eval(offset_variable);
          } else {
            offset = parseInt(element.attr('ng-offset'));
            if (isNaN(offset)) offset = 0;
          }
          offsetDate.setDate(offsetDate.getDate() + offset);
          element.text($filter('date')(offsetDate, 'MMMM d, yyyy'));
        }
      });
    }
  };
}])
.directive('ngOffsetMonth', ['$filter', function($filter) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      scope.$watch(attrs.ngOffsetMonth, function(newVal, oldVal, scope){
        if (newVal !== undefined) {
          var offsetDate = new Date(scope.$eval(element.attr('ng-model')));

          offsetDate.setMonth(offsetDate.getMonth() + newVal);
          element.text($filter('date')(offsetDate, 'MMMM d, yyyy'));
        }
      });
      scope.$watch(attrs.ngModel, function(newVal, oldVal, scope){
        if (newVal !== undefined) {
          var offsetDate = new Date(newVal);
          var offset = 0;
          var is_offset_variable = element.attr('ng-date-offset-variable');
          if (is_offset_variable == "true") {
            var offset_variable = element.attr('ng-offset-month');
            offset = scope.$eval(offset_variable);
          } else {
            offset = parseInt(element.attr('ng-offset-month'));
            if (isNaN(offset)) offset = 0;
          }
          offsetDate.setMonth(offsetDate.getMonth() + offset);
          element.text($filter('date')(offsetDate, 'MMMM d, yyyy'));
        }
      });
    }
  };
}])
.directive('ngOffsetYear', ['$filter', function($filter) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      scope.$watch(attrs.ngOffsetYear, function(newVal, oldVal, scope){
        if (newVal !== undefined) {
          var offsetDate = new Date(scope.$eval(element.attr('ng-model')));

          offsetDate.setFullYear(offsetDate.getFullYear() + newVal);
          element.text($filter('date')(offsetDate, 'MMMM d, yyyy'));
        }
      });
      scope.$watch(attrs.ngModel, function(newVal, oldVal, scope){
        if (newVal !== undefined) {
          var offsetDate = new Date(newVal);
          var offset = 0;
          var is_offset_variable = element.attr('ng-date-offset-variable');
          if (is_offset_variable == "true") {
            var offset_variable = element.attr('ng-offset-year');
            offset = scope.$eval(offset_variable);
          } else {
            offset = parseInt(element.attr('ng-offset-year'));
            if (isNaN(offset)) offset = 0;
          }
          offsetDate.setFullYear(offsetDate.getFullYear() + offset);
          element.text($filter('date')(offsetDate, 'MMMM d, yyyy'));
        }
      });
    }
  };
}]);

'use strict';

angular.module('app').filter('objectToArray', function() {
  return function(obj) {
    return _.map(obj);
  };
});

'use strict';

angular.module('app').factory('Badge', ['$resource', function($resource) {
  return $resource('/api/v1/badges/:id',
    { id: '@_id' },
    {
      delete: {
        method: 'DELETE'
      },
      update: {
        method: 'PUT',
        headers: {
            'Content-Type': undefined
        },
        transformRequest: function(data) {
          console.log(data);
          if (data === undefined)
            return data;

          var fd = new FormData();
          angular.forEach(data, function(value, key) {
            if (value instanceof FileList) {
              if (value.length == 1) {
                fd.append(key, value[0]);

              } else {
                angular.forEach(value, function(file, index) {
                  fd.append(key + '_' + index, file);
                  });
              }
            } else {
              fd.append(key, value);
            }
          });

        return fd;
        }
      },
      save: {
        method: 'POST',
        headers: {
            'Content-Type': undefined
        },
        transformRequest: function(data) {
          console.log(data);
          if (data === undefined)
            return data;

          var fd = new FormData();
          angular.forEach(data, function(value, key) {
            if (value instanceof FileList) {
              if (value.length == 1) {
                fd.append(key, value[0]);

              } else {
                angular.forEach(value, function(file, index) {
                  fd.append(key + '_' + index, file);
                  });
              }
            } else {
              fd.append(key, value);
            }
          });

        return fd;
        }

        
      }    
    });
}]);

'use strict';

angular.module('app').factory('Game', ['$resource', function($resource) {
  return $resource('/api/v1/games/:id',
    { id: '@_id' },
    {
      update: {
        method: 'PUT'
      }
    });
}]);

'use strict';

angular.module('app').factory('Player', ['$resource', function($resource) {
  return $resource('/api/v1/players/:id',
    { id: '@_id' },
    {
      update: {
        method: 'PUT'
      }
    });
}]);

'use strict';

angular.module('app').factory('Round', ['$resource', function($resource) {
  return $resource('/api/v1/rounds/:id',
    { id: '@_id' },
    {
      update: {
        method: 'PUT'
      }
    });
}]);

'use strict';

angular.module('app').factory('UserPassword', ['$resource', function($resource) {
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
}]);

'use strict';

angular.module('app').factory('User', ['$resource', function($resource) {
  return $resource('/api/v1/users/:id',
    { id: '@_id' },
    {
      update: {
        method: 'PUT'
      }
    });
}]);

'use strict';

angular.module('app').factory('Auth', ['$location', '$rootScope', '$http', 'Identity', function($location, $rootScope, $http, Identity) {
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
}]);

'use strict';

angular.module('app').factory('HttpInterceptor', ['$q', '$location', 'Identity', 'Notifier', function($q, $location, Identity, Notifier) {
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
}]);

'use strict';

angular.module('app').factory('Identity', ['$cookieStore', function($cookieStore) {
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
}]);

'use strict';

angular.module('app').value('Toastr', toastr);

angular.module('app').factory('Notifier', ['Toastr', function(Toastr) {
  return {
    success: function(msg) {
      Toastr.success(msg);
    },
    info: function(msg) {
      Toastr.info(msg);
    },
    warning: function(err, prefix) {
      Toastr.warning(_getErrorMessage(err, prefix));
    },
    error: function(err, prefix) {
      Toastr.error(_getErrorMessage(err, prefix));
    },
  };

  function _getErrorMessage(err, prefix) {
    var msg;
    if (typeof err === 'string') {
      msg = err;
    } else if (err) {
      msg = _.get(err, 'data.reason') || err.reason || err.message;
    }
    msg = msg || 'Unknown server error';

    if (prefix) {
      prefix = prefix + (_.endsWith(prefix, '.') ? ' ' : '. ');
      if (msg) {
        prefix += '<br/>';
      }
    } else {
      prefix = '';
    }

    return prefix + msg;
  }
}]);

//# sourceMappingURL=map/app.js.map
