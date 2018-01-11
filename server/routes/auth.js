	'use strict';

var config  = require('../../config/environment');
var auth    = require('../controllers/auth');

var apiVer = config.get('api:version');

module.exports = app => {
  app.post(`/api/${apiVer}/auth/login`, auth.login);
  app.post(`/api/${apiVer}/auth/logout`, auth.logout);
  app.post(`/api/${apiVer}/auth/forgetPassword`, auth.forgetPassword);
  app.post(`/api/${apiVer}/auth/restorePassword`, auth.restorePassword);
  app.get(`/api/${apiVer}/auth/facebook/token`, auth.facebookLogin);
};
