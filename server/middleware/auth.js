'use strict';

var _            = require('lodash');
var customErrors = require('n-custom-errors');
var jwtUtil      = require('../util/jwt');

exports.ensureAuthenticated = (req, res, next) => {
  var token = _.get(req, 'cookies.token');
  token = _.trim(token, '"');
  jwtUtil
    .decodeToken(token)
    .then(data => {
      req.user = data.user;
      return next();
    })
    .catch(() => {
      var err2 = customErrors.getUnauthorizedRequestError('Invalid token');
      next(err2);
    });
};

exports.ensureAuthenticatedWrapper = (req, res, next) => {
  exports.ensureAuthenticated(req, res, next);
};

exports.requireRoles = (roles) => {
  return (req, res, next) => {
    exports.ensureAuthenticated(req, res, (err) => {
      if (err) {
        return next(err);
      }
      if (!req.user || !exports.checkForRoles(req.user, roles)) {
        err = customErrors.getAccessDeniedError('Access denied');
        return next(err);
      }
      next();
    });
  };
};

exports.requireRolesWrapper = roles => {
  return exports.requireRoles(roles);
};

exports.checkForRoles = (user, roles) => {
  if (_.isString(roles)) {
    roles = [roles];
  }
  return _.includes(roles, user.role);
};
