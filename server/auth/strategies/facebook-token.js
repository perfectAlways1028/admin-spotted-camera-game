'use strict';

var Promise       = require('bluebird');
var passport      = require('passport');
var FacebookTokenStrategy = require('passport-facebook-token');
var customErrors  = require('n-custom-errors');
var usersSrvc     = require('../../data-services/users');
var config     = require('../../../config/environment');

module.exports = () => {
  passport.use(new FacebookTokenStrategy(
    {
      clientID: config.get('facebook-token:clientID'),
      clientSecret: config.get('facebook-token:clientSecret')
    },
    (accessToken, refreshToken, profile, done) => {
      usersSrvc
        .handleFacebookAuth(accessToken, refreshToken, profile)
        .catch(err => {
          if (customErrors.isObjectNotFoundError(err)) {
            return null;
          }
          return Promise.reject(err);
        })
        .then(user => {
          return done(null, user);
        })
        .catch(done);
    }
  ));
};
