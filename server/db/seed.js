'use strict';

/* jshint maxlen: false */
/* jshint quotmark: false */
/* jshint newcap: false */

var _                    = require('lodash');
var mongoose             = require('mongoose');
var db                   = require('./');
var log                  = require('../util/logger').logger;
var User                 = mongoose.model('user');
var ObjectId             = mongoose.Types.ObjectId;

function clearDb() {
  var ops = _(mongoose.models)
    .keys()
    .map(modelName => mongoose.model(modelName).remove())
    .value();

  return Promise.all(ops);
}

function insertUsers() {
  var users = [
    { "_id" : ObjectId("57fa20920cb5ff30ec85742f"), "firstName" : "admin", "email" : "admin@mail.com", "hashedPassword" : "9X90bV63RGD++6gC07iwJyNAIchA0yNdsC76J+93bKuDZc8grApRnECCr74UkQifIH2kZPw9F2iSbueICjw7qA==", "salt" : "hP0arE1TKVqN6RCkz8+vJQ==", "status" : "active", "invited" : false, "provider" : "local", "role" : "admin" },
  ];
  return User.create(users);
}


db
  .connect()
  .then(clearDb)
  .then(insertUsers)
  .then(() => log.info('All scripts applied succesfully'))
  .catch(err => log.error('The scripts are not applied', err))
  .finally(db.disconnect);
