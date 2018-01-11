'use strict';

var mongoose     = require('mongoose');
var consts       = require('../../consts');
var timestamps   = require('./../plugins/timestamps');
var contributors = require('./../plugins/contributors');
var findOrCreate = require('findorcreate-promise');


var userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  imageUrl: {
    type: String,
    required: true,
    default: 'user_default.png'
  },
  role: {
    type: String,
    required: true,
    enum: consts.USER.ROLES,
    default: 'user'
  },

  provider: {
    type: String,
    default: 'local'
  },
  hashedPassword: String,
  salt: String,

  status: {
    type: String,
    enum: consts.USER.STATUSES
  },
  online: {
    type: String,
    required: true,
    enum: consts.USER.ONLINE,
    default: "online"
  },
  socketId: {
    type: String,
    required: true,
    default: 'default'
  },

  forgotKey: String,
  forgotKeyExpiryDate: Date,

  lastLogin: Date,
  lastSeen: Date,
  facebookId: String,
  APNSToken: String,
  
  badges: [{
    type: mongoose.Schema.ObjectId,
    ref: 'badge'
  }],

  friends: [{
    type: mongoose.Schema.ObjectId,
    ref: 'user',
  }],

  games: [{
    type: mongoose.Schema.ObjectId,
    ref: 'game',
  }],

  gamesPlayed: {
    type: Number,
    required: true,
    default : 0
  },
  gamesWon: {
    type: Number,
    required: true,
    default : 0
  },
  point: {
    type: Number,
    required: true,
    default : 0
  }


});

userSchema.plugin(timestamps, { index: true });
userSchema.plugin(contributors, { index: true });
userSchema.plugin(findOrCreate);

require('./user-middleware')(userSchema);

module.exports = mongoose.model('user', userSchema);
