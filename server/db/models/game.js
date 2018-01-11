'use strict';

var mongoose     = require('mongoose');
var consts       = require('../../consts');
var timestamps   = require('./../plugins/timestamps');
var contributors = require('./../plugins/contributors');

var gameSchema = new mongoose.Schema({
  gameName: String,
  status:{
    type: String,
    required: true,
    enum: consts.GAME.STATUSES,
    default: 'open'
  },
  startTime: Number,
  endTime: Number,
  
  currentRound: {
    type:mongoose.Schema.ObjectId,
    ref: 'round'
  },
  gameJudger: {
      type:mongoose.Schema.ObjectId,
      ref: 'user'
  },
  gameCreator:{
      type: mongoose.Schema.ObjectId,
      ref: 'user'
  },
  gameWinner:{
      type: mongoose.Schema.ObjectId,
      ref: 'user'
  },

  gameInvites: [{
    type: mongoose.Schema.ObjectId,
    ref: 'user',
  }],

  gamePlayers: [{
    player:{
      type: mongoose.Schema.ObjectId,
      ref: 'user'
    },
    
    point:{
      type: Number,
      require: true,
      default: 0
    },
    
    judged:{
      type: Number,
      require: true,
      default: false
    },
    
    answered:{
      type: Number,
      require: true,
      default: false
    },
    badges: [{
      type: mongoose.Schema.ObjectId,
      ref: 'badge'
    }]
  }],
  gameRounds: [{
    type: mongoose.Schema.ObjectId,
    ref: 'round',
  }]
});

gameSchema.plugin(timestamps, { index: true });
gameSchema.plugin(contributors, { index: true });

module.exports = mongoose.model('game', gameSchema);
