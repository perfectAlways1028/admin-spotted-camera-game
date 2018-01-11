'use strict';

var _       = require('lodash');
var jwt     = require('jsonwebtoken');
var config  = require('../../config/environment');

exports.signToken = (user) => {
  var userData = _.pick(user, ['firstName', 'lastName', 'email', 'role']);
  return jwt.signAsync({ user: userData }, config.get('session:encryptionKey'), { expiresIn: '1d' });
};

exports.decodeToken = (token) => {
  return jwt.verifyAsync(token, config.get('session:encryptionKey'));
};
