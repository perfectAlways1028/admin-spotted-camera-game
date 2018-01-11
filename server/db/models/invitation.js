'use strict';

var mongoose     = require('mongoose');
var consts       = require('../../consts');
var timestamps   = require('./../plugins/timestamps');
var contributors = require('./../plugins/contributors');

var invitationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
    required: true,
  },
  invitationType: {
    type: String,
    required: true,
    default: "invite"
  },
  receiverEmail : String,
  receiverFacebookId : String,
  receiverPhoneNumber : String,
});

invitationSchema.plugin(timestamps, { index: true });
invitationSchema.plugin(contributors, { index: true });

module.exports = mongoose.model('invitation', invitationSchema);
