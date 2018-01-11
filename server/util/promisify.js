'use strict';

var Promise = require('bluebird');
var jwt     = require('jsonwebtoken');

Promise.promisifyAll(jwt);

Promise.config({
  warnings: {
    wForgottenReturn: false
  }
});
