'use strict';

var Promise       = require('bluebird');
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var customErrors  = require('n-custom-errors');
var usersSrvc     = require('../../data-services/users');

module.exports = () => {
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    (email, password, done) => {
      var filter = {
        email: (email || '').toLowerCase(),
        provider: 'local',
        status: 'active'
      };
      usersSrvc
        .getUser(filter)
        .catch(err => {
          if (customErrors.isObjectNotFoundError(err)) {
            return null;
          }
          return Promise.reject(err);
        })
        .then(user => {

          if (!user || !user.authenticate(password)) {
            return done(null, false, { message: 'Incorrect login and/or password' });
          }
          return done(null, user);
        })
        .catch(done);
    }
  ));
};
