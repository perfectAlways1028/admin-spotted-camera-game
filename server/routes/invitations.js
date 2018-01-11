'use strict';

var config = require('../../config/environment');
var auth   = require('../middleware/auth');
var invitations  = require('../controllers/invitations');
var apiVer = config.get('api:version');

module.exports = app => {
  app.post(`/api/${apiVer}/resolve_invitations`, invitations.resolveInvitations);
  app.post(`/api/${apiVer}/add_invitations`, invitations.createInvitations);
};
