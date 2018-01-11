'use strict';

var mongoose     = require('mongoose');
var consts       = require('../../consts');
var timestamps   = require('./../plugins/timestamps');
var contributors = require('./../plugins/contributors');

var answerSchema = new mongoose.Schema({
  imageUrl:String,
  answerCreator:{
    type: mongoose.Schema.ObjectId,
    ref: 'user',
    required: true,
    index: true
  }
});

var roundSchema = new mongoose.Schema({
  startTime:Number,
  endTime:Number,
  timeout:{
    type:Number,
    required: true,
    default: false
  },
  roundName: String,
  roundIndex: {
    type: Number,
    required: true,
    default: 1
  },
  task: String,
  status:{
    type: String,
    required: true,
    enum: consts.GAME.STATUSES,
    default: 'open'
  },  
  judger: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  roundWinner: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
  },
  answers:[answerSchema]
});

roundSchema.plugin(timestamps, { index: true });
roundSchema.plugin(contributors, { index: true });

module.exports = mongoose.model('round', roundSchema);
