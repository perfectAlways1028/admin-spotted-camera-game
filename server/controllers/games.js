'use strict';

var _              = require('lodash');
var Promise        = require('bluebird');
var customErrors   = require('n-custom-errors');
var consts         = require('../consts');
var gamesSrvc      = require('../data-services/games');
var roundsSrvc     = require('../data-services/rounds');
var validationUtil = require('../util/validations');
var config         = require('../../config/environment');
var log            = require('../util/logger').logger;   
var apn            = require('apn');
//var options = config.get("apn-option");
//var apnProvider = new apn.Provider(options);
var apnProvider    = require('../util/apnProvider').apnProvider;

exports.getGames = function(req, res, next) {
  gamesSrvc
    .getGames({}, 'gameName status startTime endTime gameCreator gameWinner gamePlayers gameRounds currentRound')
    .then(games => res.send(games))
    .catch(next);
};

exports.getGameById = function(req, res, next) {
  var gameId = req.params._id;

  function validateParams() {
    if (!validationUtil.isValidObjectId(gameId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id'});
    }
    return Promise.resolve();
  }

  validateParams()
    .then(() => gamesSrvc.getGame({ _id: gameId }, 'gameName status startTime endTime gameCreator gameWinner gamePlayers gameRounds currentRound'))
    .then(game => res.send(game))
    .catch(next);
};

exports.createGame = function(req, res, next) {
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['gameName', 'status', 'startTime', 'endTime', 'gameCreator'];
    var gameData = _.pick(body, allowedFields);
    return Promise.resolve(gameData);
  }

  function validateParams(gameData) {
    return Promise.resolve(gameData);
  }

  function doEdits(gameData) {
    var game = _.assign({}, gameData);
    return game;
  }

  parseParams(req)
    .then(validateParams)
    .then(doEdits)
    .then(game => gamesSrvc.createGame(game))
    .then(game => res.send(game))
    .catch(next);
};

exports.createGameAndFirstRound = function (req, res, next) {
    function parseParams(req) {
    var body = req.body;
    var allowedFields = ['gameName', 'status', 'startTime', 'endTime', 'gameCreator'];
    var gameData = _.pick(body, allowedFields);



    return Promise.resolve(gameData);
  }

  function validateParams(data) {
    if (!validationUtil.isValidObjectId(data.gameCreator)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'gameCreator', errMsg: 'must be a valid id'});
    }
    return Promise.resolve(data);
  }

  function doEdits(gameData) {
    gameData.gameJudger = gameData.gameCreator;
    var data = {gamePlayers:[{player: gameData.gameCreator, point: 0 }]};
    var game = _.assign(data, gameData);
    return game;
  }

  function createRound(game) {
    /*var startTime = (new Date).getTime();
    var endTime = startTime + config.get("time").round;*/
    var startTime = 0;
    var endTime = 0;
    
   var roundData = {
              roundName : "Round 1",
              roundIndex : 1,
              judger :   game.gameCreator,
              status: "open",
              _gameId: game._id,
              startTime: startTime,
              endTime: endTime
            };
   return roundsSrvc.createRound(roundData)
            .then(round => {       
              return {round, game}; 
            })
  }

  function doEditRoundData(roundData){
      var _gameId = roundData.game._id;
      var _roundId = roundData.round._id;
      var round = roundData.round;
      var roundData = {_gameId, _roundId};
      return {round, roundData};
  }

  function addRound(data) {
      return gamesSrvc
      .addRound(data.roundData);
  }


  parseParams(req)
    .then(validateParams)
    .then(doEdits)
    .then(game => gamesSrvc.createGame(game))
    .then(createRound)
    .then(doEditRoundData)
    .then(addRound)
    .then(game => gamesSrvc.getGame({_id : game._id}, "gameName status startTime endTime gameCreator gameWinner gamePlayers gameRounds"))
    .then(game => res.send(game))
    .catch(next);
};



exports.removePlayer = function(req, res, next) {
  function parseParams(body) {
    var allowedFields = ['userId', 'gameId'];
    var data = _.pick(body, allowedFields);
    return Promise.resolve(data);
  }

  function validateParams(data) {
    if (!validationUtil.isValidObjectId(data.gameId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'gameId', errMsg: 'must be a valid id'});
    }

    if (!validationUtil.isValidObjectId(data.userId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'userId', errMsg: 'must be a valid id'});
    }
    return Promise.resolve(data);
  }
  function removeFromPlayers(data){
     return gamesSrvc.removePlayer(data)
              .then(gameData=> Promise.resolve(data));
  }
  function removeAnswerFromCurrentRound(data) {
     return roundsSrvc.removeAnswer(dasta.currentRound._id, data.userId)
      .then(result => {
        return data;
      });
  }
  function getGamePlayers(data){
     return gamesSrvc.getPlayers(data.gameId)
            .then(game => {
                data.currentRound = game.currentRound;
                data.roundId = data.currentRound._id;
                data.gamePlayers = game.gamePlayers;
                return data;
              })
  }

  function confirmRoundFinished(data){
   console.log("----------confirmRoundFinished-------");
   var isFinished = true;
   for(var i=0; i<data.gamePlayers.length; i++) {
      var player = data.gamePlayers[i];
      if(!player.player._id.equals(data.round.judger) &&  player.answered === false) {
          isFinished = false;
      }
   }
    if(isFinished){
      data.isRoundFinished = true;
      roundsSrvc.updateRoundTimeStop(data.round._id);
    }else{
      data.isRoundFinished = false;
    }

    return Promise.resolve(data);
    
  }
  function notifyJudger(data){
    console.log("----------notifyJudger-------");
   // console.log(data);
    if(data.isRoundFinished)
    {
       return usersSrvc.getUser({_id : data.round.judger}, "_id APNSToken")
                .then(data => {
                  data.judger = data;
                  return Promise.resolve(data);})
                .then(sendJudgerNotification);
    }else {
      return Promise.resolve(data);
    }
  }

  function sendUpdateNotifications(data){
    console.log(data);
    if(!data.currentRound){
       return customErrors.rejectWithObjectNotFoundError('currentRound is empty.');
    }
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.sound = "ping.aiff";
    note.payload = {'type': 400, 'data': {} };
    note.topic = "com.kgom.spotted";
    var players = data.gamePlayers;
    for(var i=0; i<players.length; i++){
      var player = players[i].player;
      //console.log(inviter);
     // console.log(player);
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

  function sendJudgerNotification(data){
    console.log("----------sendJudgeNotification-------");
   // console.log(data)
    if(!data.judger.APNSToken){
       return customErrors.rejectWithObjectNotFoundError('APNSToken is empty.');
    }
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.alert = "Please judge a round.";
    note.sound = "ping.aiff";
    note.payload = {'type': 300, 'data': {'gameId': data.gameId, 'roundId': data.roundId, 'answers': data.answers} };
    note.topic = "com.kgom.spotted";
      if(data.judger.APNSToken !== undefined){
        //console.log(inviter.APNSToken);
        apnProvider.send(note, data.judger.APNSToken)
         .then( (result) => {
            log.info('APNS','result=',result);
         });  
      }
    return data;
  }

  parseParams(req.body)
    .then(validateParams)
    .then(removeFromPlayers)
    .then(getGamePlayers)
    .then(removeAnswerFromCurrentRound)
    .then(confirmRoundFinished)
    .then(notifyJudger)
    .then(sendUpdateNotifications)
    .then(data => res.send(data))
    .catch(next);

};


exports.writeTask = function(req, res, next) {
    function parseParams(body) {
      var allowedFields = ['userId', 'gameId', 'task'];
      var data = _.pick(body, allowedFields);
      return Promise.resolve(data);
    }

    function validateParams(data) {
      if (!validationUtil.isValidObjectId(data.gameId)) {
        return customErrors.rejectWithUnprocessableRequestError({ paramName: 'gameId', errMsg: 'must be a valid id'});
      }

      if (!validationUtil.isValidObjectId(data.userId)) {
        return customErrors.rejectWithUnprocessableRequestError({ paramName: 'userId', errMsg: 'must be a valid id'});
      }
      return Promise.resolve(data);
    }

    function getGame(data){
     return gamesSrvc.confirmJudger(data)
        .then(gameData=> doEdit(data, gameData));
    }
    function confirmJudger(data){
      if(String(data.game.gameJudger) === String(data.userData.userId)) {
        return Promise.resolve(data);
      }else {
       return customErrors.rejectWithUnprocessableRequestError({ paramName: 'You', errMsg: 'must be a judger.'});
   
      }
    }
    function doEdit(userData, game){
      var data = {};
      data.userData = userData;
      data.game = game;
      return Promise.resolve(data);
    }    
    function confirmRound(data){

      return roundsSrvc.updateTask(data.game.currentRound, data.userData.task)
        .then(round => Promise.resolve(data));
    }
    function mergeData(round, roundData) {
     _.extend(round, roundData);
    // console.log(round);
     return Promise.resolve(round);
    }
    function getGamePlayers(data){
      return gamesSrvc.getPlayers(data.game._id)
              .then(game => {
                data.currentRound = game.currentRound;
                data.gamePlayers = game.gamePlayers;
                return data;
              })
    }

  function sendNotifications(data){
    //console.log(data);
    if(!data.currentRound){
       return customErrors.rejectWithObjectNotFoundError('currentRound is empty.');
    }
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.alert = "Please take a photo of the task.";
    note.sound = "ping.aiff";
    note.payload = {'type': 200, 'data': {'gameId': data.game._id, 'roundId': data.currentRound} };
    note.topic = "com.kgom.spotted";
    var players = data.gamePlayers;
    for(var i=0; i<players.length; i++){
      var player = players[i].player;
      //console.log(inviter);
     // console.log(player);
      if(player.APNSToken !== undefined && !player._id.equals(data.userData.userId) && player.playerState !== "losed"){
        //console.log(inviter.APNSToken);
        apnProvider.send(note, player.APNSToken)
         .then( (result) => {
            log.info('APNS','result=',result);
         });  
      }
        
    }
    return data;
  }
   parseParams(req.body)
    .then(validateParams)
    .then(getGame)
    .then(confirmJudger)
    .then(confirmRound)
    .then(getGamePlayers)
    .then(sendNotifications)
    .then(data => res.send(data))
    .catch(next);
};

exports.getGamesForUser = function(req, res, next){
    function parseParams(body) {
      var allowedFields = ['userId'];
      var userData = _.pick(body, allowedFields);
      return Promise.resolve(userData);
    }
    function validateParams(data) {
      if (!validationUtil.isValidObjectId(data.userId)) {
        return customErrors.rejectWithUnprocessableRequestError({ paramName: 'userId', errMsg: 'must be a valid id'});
      }
      return Promise.resolve(data);
    }
   parseParams(req.body)
    .then(validateParams)
    .then(data => gamesSrvc.getGamesForUser(data.userId))
    .then(data => res.send(data))
    .catch(next);


}

exports.updateGame = function(req, res, next) {
  var gameId = req.params._id;
  var playerData = {};
  function parseParams(body) {
    var allowedFields = ['gameName', 'status', 'startTime', 'endTime', 'gameWinner', 'gamePlayers'];
    var gameData = _.pick(body, allowedFields);
    gameData._id = req.params._id;
    return Promise.resolve(gameData);
  }

  function validateParams(gameData) {
    return Promise.resolve(gameData);
  }

  function doEdits(data) {
    _.extend(data.game, data.gameData);
    return data.game;
  }
  function getGamePlayers(data){
     return gamesSrvc.getPlayers(gameId)
            .then(game => {
                playerData.currentRound = game.currentRound;
                playerData.gamePlayers = game.gamePlayers;
                return data;
              })
  }

  function sendNotifications(){
    var data = playerData;
    //console.log(data);
    if(!data.currentRound){
       return customErrors.rejectWithObjectNotFoundError('currentRound is empty.');
    }
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.sound = "ping.aiff";
    note.payload = {'type': 400, 'data': {} };
    note.topic = "com.kgom.spotted";
    var players = data.gamePlayers;
    for(var i=0; i<players.length; i++){
      var player = players[i].player;
      //console.log(inviter);
     // console.log(player);
      if(player.APNSToken !== undefined){
        //console.log(inviter.APNSToken);
        apnProvider.send(note, player.APNSToken)
         .then( (result) => {
            log.info('APNS','result=',result);
         });  
      }
        
    }
  }
  parseParams(req.body)
    .then(validateParams)
    .then(gameData => gamesSrvc
      .getGame({ _id: gameData._id })
      .then(game => {
        return { game, gameData };
      })
    )
    .then(doEdits)
    .then(game => gamesSrvc.saveGame(game))
    .then(getGamePlayers)
    .then(sendNotifications)
    .then(game => res.send(game))
    .catch(next);
};

exports.gameOver = (req, res, next) => {
  var gameId = req.params._id;
  var playerData = {};
  function validateParams() {
    if (!validationUtil.isValidObjectId(gameId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id' });
    }
    return Promise.resolve();
  }
  function getGamePlayers(data){
     return gamesSrvc.getPlayers(gameId)
            .then(game => {
                playerData.currentRound = game.currentRound;
                playerData.gamePlayers = game.gamePlayers;
                return data;
              })
  }

  function sendNotifications(){
    console.log("gameOver");
    var data = playerData;
    //console.log(data);
    if(!data.currentRound){
       return customErrors.rejectWithObjectNotFoundError('currentRound is empty.');
    }
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.sound = "ping.aiff";
    note.payload = {'type': 400, 'data': {} };
    note.topic = "com.kgom.spotted";
    var players = data.gamePlayers;
    for(var i=0; i<players.length; i++){
      var player = players[i].player;
      //console.log(inviter);
     // console.log(player);
      if(player.APNSToken !== undefined){
        //console.log(inviter.APNSToken);
        apnProvider.send(note, player.APNSToken)
         .then( (result) => {
            log.info('APNS','result=',result);
         });  
      }
        
    }
  }
  validateParams()
    .then(() => gamesSrvc.getGame({ _id: gameId }))
    .then(getGamePlayers)
    .then(data => gamesSrvc.gameOver(gameId))
    .then(sendNotifications)
    .then(data => res.send(true))
    .catch(next);
};

exports.deleteGame = (req, res, next) => {
  var gameId = req.params._id;
  var playerData = {};
  function validateParams() {
    if (!validationUtil.isValidObjectId(gameId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id' });
    }
    return Promise.resolve();
  }
  function getGamePlayers(data){
     return gamesSrvc.getPlayers(gameId)
            .then(game => {
                playerData.currentRound = game.currentRound;
                playerData.gamePlayers = game.gamePlayers;
                return data;
              })
  }
  function removeRounds(data) {
    return roundsSrvc.deleteRounds(data.gameRounds)
      .then(result => {
        return data;
      })
  }

  function sendNotifications(){
    var data = playerData;
  //  console.log(data);
    if(!data.currentRound){
       return customErrors.rejectWithObjectNotFoundError('currentRound is empty.');
    }
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.sound = "ping.aiff";
    note.payload = {'type': 400, 'data': {} };
    note.topic = "com.kgom.spotted";
    var players = data.gamePlayers;
    for(var i=0; i<players.length; i++){
      var player = players[i].player;
      //console.log(inviter);
     // console.log(player);
      if(player.APNSToken !== undefined){
        //console.log(inviter.APNSToken);
        apnProvider.send(note, player.APNSToken)
         .then( (result) => {
            log.info('APNS','result=',result);
         });  
      }
        
    }
  }
  validateParams()
    .then(() => gamesSrvc.getGame({ _id: gameId }))
    .then(getGamePlayers)
    .then(removeRounds)
    .then(game => gamesSrvc.deleteGame(game))
    .then(sendNotifications)
    .then(badges => res.send(true))

    .catch(next);
};
