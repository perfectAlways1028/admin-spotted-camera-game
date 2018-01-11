'use strict';

var mongoose     = require('mongoose');
var consts       = require('../../consts');
var timestamps   = require('./../plugins/timestamps');
var contributors = require('./../plugins/contributors');

var notificationSchema = new mongoose.Schema({
  
  receiverId : String,
  type:{
    type: Number,
    required: true,
    default: 100
  },

  data:{
    type: String,
    required: true
  }
});

notificationSchema.plugin(timestamps, { index: true });
notificationSchema.plugin(contributors, { index: true });

module.exports = mongoose.model('notification', notificationSchema);
