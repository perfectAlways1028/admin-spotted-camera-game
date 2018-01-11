'use strict';

var config = require('../../config/environment');
var auth   = require('../middleware/auth');
var rounds  = require('../controllers/rounds');
var apiVer = config.get('api:version');

module.exports = app => {
  app.get(`/api/${apiVer}/rounds/:_id`, rounds.getRoundById);
  app.get(`/api/${apiVer}/rounds`, rounds.getRounds);
  app.post(`/api/${apiVer}/rounds`, rounds.createRound);
  app.put(`/api/${apiVer}/rounds/:_id`, rounds.updateRound);
  app.post(`/api/${apiVer}/submit_answer`, rounds.addAnswer);
  app.post(`/api/${apiVer}/submit_judge`, rounds.judgeAnswer);
};
