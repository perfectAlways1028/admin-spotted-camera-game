'use strict';

var config = require('../../config/environment');
var auth   = require('../middleware/auth');
var badges  = require('../controllers/badges');
var apiVer = config.get('api:version');

module.exports = app => {
  app.get(`/api/${apiVer}/badges/:_id`, badges.getBadgeById);
  app.get(`/api/${apiVer}/badges`, badges.getBadges);
  app.post(`/api/${apiVer}/badges`, badges.createBadge);
  app.put(`/api/${apiVer}/badges/:_id`, badges.updateBadge);
  app.delete(`/api/${apiVer}/badges/:_id`, auth.requireRolesWrapper('admin'), badges.deleteBadge);

};
