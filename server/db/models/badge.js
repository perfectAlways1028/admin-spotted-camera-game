'use strict';

var mongoose     = require('mongoose');
var consts       = require('../../consts');
var timestamps   = require('./../plugins/timestamps');
var contributors = require('./../plugins/contributors');

var badgeSchema = new mongoose.Schema({
  badgeName: String,
  imageUrl:{
    type: String,
    required: true,
    default: 'default_badge.png'
  },
  description: String,
  formular:{
    type: String,
    required: true
  }
});

badgeSchema.plugin(timestamps, { index: true });
badgeSchema.plugin(contributors, { index: true });

module.exports = mongoose.model('badge', badgeSchema);
