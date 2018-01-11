'use strict';

var express      = require('express');
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var multipart    = require('connect-multiparty');
var passport     = require('passport');
var session      = require('express-session');
var MongoStore   = require('connect-mongo')(session);
var config       = require('../config/environment');
var log          = require('./util/logger');

module.exports = function(app) {
  app.set('views', config.get('viewsPath'));
  app.set('port', config.get('port'));
  app.set('view engine', 'pug');

  app.use(express.static(config.get('publicPath')));

  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'test') {
    app.use(log.common);
  }
  // TODO: uncomment for favicon:
  // app.use(favicon(path.join(config.get('rootPath'), 'client', 'images', 'favicon.ico')));
  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ limit: '5mb', extended: false }));
  app.use(multipart({uploadDir: config.get('publicPath')+'/uploads'}));
  app.use(cookieParser());
  app.use(session({
    store: new MongoStore({ url: config.get('db') }),
    secret: config.get('session:encryptionKey'),
    name: config.get('session:sessionKey'),
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: config.get('session:sessionExpirationTime')
    }
  }));
  app.use(passport.initialize());
  app.use(passport.session());
};
