'use strict';
var _              = require('lodash');
var Promise        = require('bluebird');
var customErrors   = require('n-custom-errors');
var consts         = require('../consts');
var roundsSrvc     = require('../data-services/rounds');
var gamesSrvc      = require('../data-services/games');
var usersSrvc      = require('../data-services/users');
var badgeSrvc      = require('../data-services/badges');
var validationUtil = require('../util/validations');
var config         = require('../../config/environment');
var log            = require('../util/logger').logger;   
var apn            = require('apn');
//var options = config.get("apn-option");
//var apnProvider = new apn.Provider(options);
var apnProvider    = require('../util/apnProvider').apnProvider;

var Service = function(opts){
  this.interval = opts.interval||60000;
};


module.exports = Service;

Service.prototype.run = function () {
  this.interval = setInterval(this.tick.bind(this), this.interval);
};

Service.prototype.close = function () {
  clearInterval(this.interval);
};

Service.prototype.tick = function() {
  //check games and send timeout  
  console.log("tick");
  Service.checkGamesTimeout();
};

Service.checkGamesTimeout = function () {
  var answerData ={};
  function getGames(){
    var filter = {
      "status": "open"
    };
    return gamesSrvc
      .getGames(filter, 'gameName status startTime endTime gameCreator gameWinner gamePlayers gameRounds currentRound');
  }
  function checkGames(games) {
    games.map(game => {
      if(game.currentRound._id)
       Service.roundTimeoutFunc({"gameId":game._id});
    })

  }
  getGames()
    .then(checkGames)
    .catch(error => {
      console.log(error);
    })

}

Service.roundTimeoutFunc = function(data) {
  function getGamePlayers(answerData){

    return gamesSrvc.getPlayers(answerData.gameId)
            .then(game=> {
              answerData.currentRound = game.currentRound;
              answerData.players = game.gamePlayers;

              return Promise.resolve(answerData);
            });
  }

  function getRound(answerData) {
    return roundsSrvc.getRound({_id: answerData.currentRound})
      .then(round => {
        answerData.round = round;
        return Promise.resolve(answerData);
      })

  }
  function confirmRoundTimeout(answerData){
   console.log("----------confirmRoundTimeout-------");
  
    var currentTime = (new Date).getTime();
    console.log(answerData.round.endTime);
     answerData.isRoundFinished  = false;
    if(answerData.round.endTime !== 0 &&  answerData.round.endTime < currentTime)
    {
      answerData.isRoundFinished = true;

    }
    var answeredCnt = 0;
    for(var i=0; i<answerData.players.length; i++) {
      var player = answerData.players[i];
      if(!player.player._id.equals(answerData.round.judger._id) &&  player.answered !== 0) {
          answeredCnt ++;
      }
    }

    if(answeredCnt < 1 || answeredCnt == answerData.players.length)
      answerData.isRoundFinished = false;

     if(answerData.isRoundFinished)
      roundsSrvc.updateRoundTimeStop(answerData.round._id);
    return Promise.resolve(answerData);
    
  }
  function notifyJudger(answerData){
    console.log("----------notifyJudger-------");
   // console.log(answerData);
    if(answerData.isRoundFinished)
    {
      return usersSrvc.getUser({_id : answerData.round.judger}, "_id APNSToken")
                .then(data => {
                  answerData.judger = data;
                  return Promise.resolve(answerData);})
                .then(sendNotification);

    }else {
      throw new Error("round not finished");
      //return Promise.resolve(answerData);
    }
  }
  function sendUpdateNotifications(data){
   // console.log(data);
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.sound = "ping.aiff";
    note.payload = {'type': 400, 'data': {} };
    note.topic = "com.kgom.spotted";
    var players = data.players;
    for(var i=0; i<players.length; i++){
      var player = players[i].player;
      //console.log(inviter);
      //console.log(player);
      if(player.APNSToken !== undefined){
        //console.log(inviter.APNSToken);
        apnProvider.send(note, player.APNSToken)
         .then( (result) => {
            log.info('APNS','result=',result);
         });  
      }
        
    }
    return data;
  }

  function sendNotification(answerData){
    console.log("----------sendNotification-------");
   // console.log(answerData)
    if(!answerData.judger.APNSToken){
       return customErrors.rejectWithObjectNotFoundError('APNSToken is empty.');
    }
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.alert = "Please judge a round.";
    note.sound = "ping.aiff";
    note.payload = {'type': 300, 'data': {'gameId': answerData.gameId, 'roundId': answerData.roundId, 'answers': answerData.answers} };
    note.topic = "com.kgom.spotted";
      if(answerData.judger.APNSToken !== undefined){
        //console.log(inviter.APNSToken);
        apnProvider.send(note, answerData.judger.APNSToken)
         .then( (result) => {
            log.info('APNS','result=',result);
         });  
      }
    return answerData;
  }
  getGamePlayers(data)
    .then(getRound)
    .then(confirmRoundTimeout)
    .then(notifyJudger)
    .then(sendUpdateNotifications)
    .catch(error => {
        console.log(error);
    });
}