'use strict';

var express = require('express');
var socketio = require('socket.io');
var config  = require('../config/environment');
var db      = require('./db');
var log     = require('./util/logger').logger;
var Service = require('./service/service');

require('./util/promisify');
require('./util/errors');

var app = express();
require('./express')(app);
require('./routes')(app);
require('./auth/strategies')();

if (app.get('env') !== 'test') {
  db.connect();

  var server = app.listen(app.get('port'), function() {
    log.info('Express server started', 'environment=' + config.get('env'), 'listening on port=' + config.get('port'));
  });

  //socket.io config
  var io = socketio.listen(server);
  require('./socketio')(app, io);
  var service = new Service({interval:20000});
  service.run();

}

module.exports = app;
