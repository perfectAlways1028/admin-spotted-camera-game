'use strict';

var config = require('../../config/environment');
var auth   = require('../middleware/auth');
var users  = require('../controllers/users');

var apiVer = config.get('api:version');

module.exports = app => {
  app.put(`/api/${apiVer}/userPassword/:_id`, users.updatePassword);
};
