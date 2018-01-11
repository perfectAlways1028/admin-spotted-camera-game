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

exports.getRounds = function(req, res, next) {
  roundsSrvc
    .getRounds({}, 'roundName roundIndex task status startTime endTime  judger roundWinner answers')
    .then(rounds => res.send(rounds))
    .catch(next);
};

exports.getRoundById = function(req, res, next) {
  var roundId = req.params._id;

  function validateParams() {
    if (!validationUtil.isValidObjectId(roundId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id'});
    }
    return Promise.resolve();
  }

  validateParams()
    .then(() => roundsSrvc.getRound({ _id: roundId }, 'roundName roundIndex task status startTime endTime  judger roundWinner answers'))
    .then(round => res.send(round))
    .catch(next);
};

exports.createRound = function(req, res, next) {
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['_gameId', 'roundName', 'roundIndex', 'task', 'startTime', 'endTime', 'status', 'judger'];
    var roundData = _.pick(body, allowedFields);
    roundData.startTime = (new Date).getTime();
    roundData.endTime = startTime + config.get("time").round;

    return Promise.resolve(roundData);
  }

  function validateParams(roundData) {
    if (!validationUtil.isValidObjectId(roundData._gameId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'gameId', errMsg: 'must be a valid id'});
    }
    if (!roundData.roundIndex) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'roundIndex', errMsg: 'must be a valid number'});
    }
    return Promise.resolve(roundData);
  }

  function doEdits(roundData) {
    var round = _.assign({}, roundData);
    return round;
  }

  function doEditRoundData(roundData){
      var _gameId = roundData._gameId;
      var _roundId = roundData.round._id;
      var round = roundData.round;
      var roundData = {_gameId, _roundId};
     // console.log(round);
      return {round, roundData};
  }

  parseParams(req)
    .then(validateParams)
    .then(doEdits)
    .then(roundData =>  roundsSrvc
        .createRound(roundData)
        .then(round => {       
          var _gameId = roundData._gameId;
          return {round, _gameId}; 
        })
    )
    .then(doEditRoundData)
    .then(roundData => gamesSrvc
      .addRound(roundData.roundData)
      .then(game=> {
        return roundData.round;
      })
     )
    .then(round => res.send(round))
    .catch(next);
};



exports.roundTimeout = function (req, res, next) {
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['gameId', 'roundId'];
    var answerData = _.pick(body, allowedFields);
    return Promise.resolve(answerData);
  }

  function validateParams(answerData) {
    if (!validationUtil.isValidObjectId(answerData.roundId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'roundId', errMsg: 'must be a valid id'});
    }
    if (!validationUtil.isValidObjectId(answerData.userId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'userId', errMsg: 'must be a valid number'});
    }
    return Promise.resolve(answerData);
  }
  function doEdits(answerData) {
    var answer = _.assign({}, answerData);
    return answer;
  }

  function getGamePlayers(answerData){

    return gamesSrvc.getPlayers(answerData.gameId)
            .then(players=> {
              answerData.players = players.gamePlayers;

              return Promise.resolve(answerData);
            });
  }
  function confirmRoundTimeout(answerData){
   console.log("----------confirmRoundTimeout-------");
  
    var currentTime = (new Date).getTime();
    if(answerData.currentRound.endTime < currentTime)
    {
      answerData.isRoundFinished = false;

    }else {
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
      return Promise.resolve(answerData);
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
  parseParams(req)
    .then(validateParams)
    .then(doEdits)
    .then(getGamePlayers)
    .then(confirmRoundTimeout)
    .then(notifyJudger)
    .then(getGamePlayers)
    .then(sendUpdateNotifications)
    .then(round => res.send(round))
    .catch(next);
}


exports.addAnswer = function(req, res, next) {
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['gameId', 'roundId', 'userId'];
    var answerData = _.pick(body, allowedFields);
    if(req.files.image){
      var image =req.files.image;
      answerData.imageUrl = image.path.replace(/^.*[\\\/]/, '');
    }
    return Promise.resolve(answerData);
  }

  function validateParams(answerData) {
    if (!validationUtil.isValidObjectId(answerData.roundId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'roundId', errMsg: 'must be a valid id'});
    }
    if (!validationUtil.isValidObjectId(answerData.userId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'userId', errMsg: 'must be a valid number'});
    }
    return Promise.resolve(answerData);
  }

  function doEdits(answerData) {
    var answer = _.assign({}, answerData);
    return answer;
  }
  function markAnswered(answerData) {
      return gamesSrvc.updatePlayerAnswered(answerData.gameId, answerData.userId, true)
        .then(result => {
          return answerData;
        })
  }
  function confirmRoundFinished(answerData){
   console.log("----------confirmRoundFinished-------");
   //console.log(answerData);
   var isFinished = true;
   for(var i=0; i<answerData.players.length; i++) {
      var player = answerData.players[i];
      if(!player.player._id.equals(answerData.round.judger._id) &&  player.answered === 0) {
          isFinished = false;
      }
   }
    if(isFinished){
      answerData.isRoundFinished = true;
      roundsSrvc.updateRoundTimeStop(answerData.round._id);
    }else{
      answerData.isRoundFinished = false;
    }

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
      return Promise.resolve(answerData);
    }
  }
  function getGamePlayers(data){
     return gamesSrvc.getPlayers(data.gameId)
            .then(game => {
                data.currentRound = game.currentRound;
                data.gamePlayers = game.gamePlayers;
                return data;
              })
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

  function addAnswer(answerData){
    return roundsSrvc.addAnswer(answerData)
            .then(round=> {
              answerData.round = round;
              return Promise.resolve(answerData);
            });  
  }
  function getGame(answerData){

    return gamesSrvc.getPlayers(answerData.gameId)
            .then(players=> {
              answerData.players = players.gamePlayers;

              return Promise.resolve(answerData);
            });
  }

  parseParams(req)
    .then(validateParams)
    .then(doEdits)
    .then(answerData => roundsSrvc.checkAnswerExist(answerData))
    .then(addAnswer)
    .then(markAnswered)
    .then(getGame)
    .then(confirmRoundFinished)
    .then(notifyJudger)
    .then(getGamePlayers)
    .then(sendUpdateNotifications)
    .then(round => res.send(round))
    .catch(next);
};

exports.judgeAnswer = function(req, res, next) {
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['userId', 'gameId', 'roundId', 'answerId'];
    var judgeData = _.pick(body, allowedFields);
    return Promise.resolve(judgeData);
  }
    function validateParams(answerData) {
    if (!validationUtil.isValidObjectId(answerData.userId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'userId', errMsg: 'must be a valid id'});
    }
    if (!validationUtil.isValidObjectId(answerData.gameId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'gameId', errMsg: 'must be a valid id'});
    }
    if (!validationUtil.isValidObjectId(answerData.roundId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'roundId', errMsg: 'must be a valid id'});
    }
    if (!validationUtil.isValidObjectId(answerData.answerId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'answerId', errMsg: 'must be a valid id'});
    }
    return Promise.resolve(answerData);
  }
  function getAnswer(data){
    return roundsSrvc.getAnswer(data.roundId, data.answerId)
      .then(answer => {
          data.answer = answer;
          console.log("--------Answer--------");
         // console.log(answer);
          return data;
      });
  }

  function getGame(data){
   return gamesSrvc.getGame({_id: data.gameId})
      .then(game =>{
        data.game = game;
        return data;
      });
  }
  function doEdits(data) {
    var judgeData = _.assign({}, data);
    return judgeData;
  }
  function updateUserPoint(data){
    //update user's point

    return usersSrvc.increasePoint(data.answer.answerCreator, 1)
      .then(result => roundsSrvc.updateCompleteStatus(data.answer.answerCreator, data.roundId, "close"))
      .then(result => gamesSrvc.getGamePlayer(data.gameId, data.answer.answerCreator))
      .then(player =>{
        console.log("----------player-----------");
        //console.log(player);
          return gamesSrvc.updatePlayerPoint(data.gameId, data.answer.answerCreator, player.point+1)
            .then(result => gamesSrvc.updatePlayerJudged(data.gameId, data.userId, true));
        } )
      .then(result =>{
        console.log("----------updatePlayer ------");
        //  console.log(result);
        return Promise.resolve(data);
      });
  
  }


  function checkGameStatus(data){
    //if all round finished
    return gamesSrvc.getJudger(data.gameId)
      .then(judger => {
        data.judger = judger;
        console.log("-----------judger-----------");
       // console.log(judger);
        if(judger != undefined){
          //set judger for game and create a new round with the judger
           return gamesSrvc.updateGameJudger(data.gameId, judger.player)
              .then(result => createRound(data))
              .then(result => {
                sendWriteTaskNotification(data.gameId, result._id, judger.player);
                return data;
              })
              .then(result => {
                sendJudgeFinishNotification(data);
                return data;
              })
              .then(result => sendUpdateNotifications(data));

        }else{
          //all rounds finished. check who is first. or tie

          var gamePlayers = data.game.gamePlayers;
          gamePlayers.sort(function(a, b){return a.point < b.point});
          console.log("-----------gamePlayers-----------");
          //console.log(gamePlayers);
          var top = [];
          var topPoint = gamePlayers[0].point;
          for(var i=0; i<gamePlayers.length; i++){
            if(gamePlayers[i].point === topPoint)
              top.push(gamePlayers[i]);
          }
          if(top.length === 1){
             //complete game.
             console.log("-----------complete-----------");
             //console.log(gamePlayers);
             data.winner = top[0].player;
             gamesSrvc.updateCompleteStatus(data.gameId, top[0].player)
              .then(result => increaseGamesWon(data))
              .then(result => increaseGamesPlayed(data))
              .then(result => presentBadge(data))
              .then(result => sendJudgeFinishNotification(data))
              .then(result => sendGameCompleteNotification(data)) 
              .then(result => sendUpdateNotifications(data));
          } else if(top.length === gamePlayers.length){
              console.log("-----------all tie-----------");
              var lastPlayer = gamePlayers[gamePlayers.length-1];
              data.judger = lastPlayer;
              updateGamePlayersNotJudged(data.gameId, gamePlayers);
              gamesSrvc.updateGameJudger(data.gameId, lastPlayer.player)
                .then(result => createRound(data))
                .then(result => {
                 return sendWriteTaskNotification(data.gameId, result._id, lastPlayer);
               })
                .then(result => sendJudgeFinishNotification(data))
                .then(result => sendUpdateNotifications(data));

          } else{
            //tie 
             console.log("-----------tie-----------");
             //console.log(gamePlayers);
              var lastPlayer = gamePlayers[gamePlayers.length-1];
              data.judger = lastPlayer;
              for(var j=top.length; j<gamePlayers.length; j++){
                gamesSrvc.updateGamePlayerState(data.gameId, gamePlayers[j].player, "losed");
              }
              gamesSrvc.updateGameJudger(data.gameId, lastPlayer.player)
                .then(result => createRound(data))
                .then(result => {
                 return sendWriteTaskNotification(data.gameId, result._id, lastPlayer);
               })
                .then(result => sendJudgeFinishNotification(data))
                .then(result => sendUpdateNotifications(data));
          }
          return Promise.resolve(data);
        }
      });

  }

  function updateGamePlayersNotJudged(gameId, gamePlayers) {
    for(var i=0; i<gamePlayers.length; i++){
      var player = gamePlayers[i].player;
      gamesSrvc.updatePlayerJudged(gameId, player, false);
    }
  }
  function increaseGamesWon(data){
    let winner = data.winner;
    if(winner){
      return usersSrvc.increaseGamesWon(winner._id, 1)
        .then(result => gamesSrvc.updateGamePlayerState(data.gameId, winner._id, "won"));
    } else {
      return Promise.resolve(data);  
    }
    
  }
  function increaseGamesPlayed(data){
     var gamePlayers = data.game.gamePlayers;
     var players = [];
    for(var i= 0; i<gamePlayers.length; i++){
      let player = gamePlayers[i].player;
      players.push(player._id);
     

    }
    return usersSrvc.increaseGamesPlayed(players, 1)
      .then(result => {
        return Promise.resolve(data);    
      })
    
  }
  function presentBadge(data){
    return gamesSrvc.getGamePlayers(data.game._id)
      .then(gamePlayers=> {
          console.log("---------------presentBadge--------------");
            for(var i= 0; i<gamePlayers.length; i++){
            presentBadgeForPlayer(data.game._id, gamePlayers[i]);

          }
          return Promise.resolve(data);
      })

  }

  function presentBadgeForPlayer(gameId, gamePlayer){
    console.log("---------------presentBadgeForPlayer--------------");
  //  console.log(gamePlayer);
    var player = gamePlayer.player;
    if(player.badges.length > 0) {
      var filter = {
       "_id" : { $nin : player.badges}
      };
    }else {
      var filter = {};
    }
    badgeSrvc.getBadges(filter,'_id badgeName formular imageUrl description')
            .then(badges => {
                for(var i = 0; i< badges.length; i++){
                  let badge = badges[i];
                    console.log(player.gamesPlayed + " " +player.gamesWon );
                  let available = checkBadgeForPlayer(badge, player.gamesPlayed, player.gamesWon, player.point);
                  if(available){
                  
                    usersSrvc.addBadge(player._id, badge);
                    gamesSrvc.addBadgeToGamePlayer(gameId, player._id, badge._id);
                  }
                }
            });
  }
  function checkBadgeForPlayer(badge, gamesPlayed, gamesWon, point) {
    console.log("---------------check badge-------------");
    var allowedFields = ['property', 'relation', 'value'];
   // console.log(badge.formular);
    try {
      var formular = JSON.parse(badge.formular)
    } catch (e) {
      var formular = {}
      console.error("Invalid json");
    }
  
    var value1 = formular.value;
    var value2 = gamesPlayed;
    if(formular.property === "gamesPlayed"){
      value2 = gamesPlayed;
    }else if(formular.property === "gamesWon"){
      value2 = gamesWon;
    }else if(formular.property === "point") {
      value2 = point;
    }

    if(formular.relation === "equal"){
      return value1 === value2;
    }else if(formular.relation === "smaller"){
      return value1 >= value2;
    }else{
      return value1 <= value2;
    }
    return false;

  }
  function createRound(data) {
    //var startTime = (new Date).getTime();
    //var endTime = startTime + config.get("time").round;
    var startTime = 0;
    var endTime = 0;
   var roundData = {
              roundName : "Round 1",
              roundIndex : data.game.currentRound.roundIndex+1,
              judger :   data.judger.player,
              status: "open",
              startTime: startTime,
              endTime: endTime,
              _gameId: data.game._id
            };
   return roundsSrvc.createRound(roundData)
            .then(round => { 
              gamesSrvc.addRoundById(data.gameId, round._id);      
              return round; 
            })
            .then(round=> {
              var gamePlayers = data.game.gamePlayers;
              for(var i=0; i<gamePlayers.length; i++) {
                var playerData = gamePlayers[i];
                 gamesSrvc.updatePlayerAnswered(data.gameId, playerData.player, false);
              }
             
              return round;
            });
  }
  function confirmJudger(data){

    return gamesSrvc.confirmGameJudger(data.gameId, data.userId)
      .then(result => {
          if(result){
            return Promise.resolve(data);
          }else{
            return customErrors.rejectWithUnprocessableRequestError({ paramName: 'userId', errMsg: 'must be judger'});
           }
      })
  }
  function sendGameCompleteNotification(data){
    console.log("-----------CompleteNotification-------");
    if(!data.winner){
       return customErrors.rejectWithObjectNotFoundError('winner is empty.');
    }
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.alert = "You won the Game.";
    note.sound = "ping.aiff";
    note.payload = {'type': 500, 'data': {'gameId' :data.game._id} };
    note.topic = "com.kgom.spotted";
    var player = data.winner;
    apnProvider.send(note, player.APNSToken)
         .then( (result) => {
            log.info('APNS','result=',result);
         });  
    return Promise.resolve(data);    

  }

  function sendJudgeFinishNotification(data) {
    console.log("-----------Judge Finish-------");
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.alert = "Judging Complete, View Images?";
    note.sound = "ping.aiff";
    note.payload = {'type': 700, 'data': {'gameId': data.gameId, 'roundId': data.roundId} };
    note.topic = "com.kgom.spotted";
    var players = data.game.gamePlayers;
    for(var i=0; i<players.length; i++){
      var player = players[i].player;
      //console.log(inviter);
      if(player.APNSToken !== undefined && !player._id.equals(data.userId)){
        //console.log(inviter.APNSToken);
        apnProvider.send(note, player.APNSToken)
         .then( (result) => {
            log.info('APNS','result=',result);
         });  
      }
        
    }
    return Promise.resolve(data);
  }

  function sendWriteTaskNotification(gameId, roundId, lastPlayer){
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.sound = "ping.aiff";
    note.alert = "Please write task.";
    note.payload = {'type': 800, 'data': {'gameId': gameId, 'roundId': roundId} };
    note.topic = "com.kgom.spotted";
    if(lastPlayer.APNSToken !== undefined){
        //console.log(inviter.APNSToken);
        apnProvider.send(note, lastPlayer.APNSToken)
         .then( (result) => {
            log.info('APNS','result=',result);
         });  
    }
    return Promise.resolve(lastPlayer); 
  }
  function sendGameTieNotification(data){
      return Promise.resolve(data);
  }

  function sendUpdateNotifications(data){
    console.log("-----------sendUpdateNotifications-------");
    if(!data.game.currentRound){
       return customErrors.rejectWithObjectNotFoundError('currentRound is empty.');
    }
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.sound = "ping.aiff";
    note.payload = {'type': 400, 'data': {} };
    note.topic = "com.kgom.spotted";
    var players = data.game.gamePlayers;
    for(var i=0; i<players.length; i++){
      var player = players[i].player;
      //console.log(inviter);
      if(player.APNSToken !== undefined){
        //console.log(inviter.APNSToken);
        apnProvider.send(note, player.APNSToken)
         .then( (result) => {
            log.info('APNS','result=',result);
         });  
      }
        
    }
    return Promise.resolve(data);
  }

  parseParams(req)
    .then(validateParams)
    .then(doEdits)
    .then(getAnswer)
    .then(confirmJudger)
    .then(updateUserPoint)
    .then(getGame)
    .then(checkGameStatus)

    .then(data => res.send(data))
    .catch(next);
}

exports.updateRound = function(req, res, next) {
  function parseParams(body) {
    var allowedFields = ['roundName', 'task', 'status', 'startTime', 'endTime', 'roundWinner', 'roundPlayers'];
    var roundData = _.pick(body, allowedFields);
    roundData._id = req.params._id;
    return Promise.resolve(roundData);
  }

  function validateParams(roundData) {
    return Promise.resolve(roundData);
  }

  function doEdits(data) {
    _.extend(data.round, data.roundData);
    return data.round;
  }

  parseParams(req.body)
    .then(validateParams)
    .then(roundData => roundsSrvc
      .getRound({ _id: roundData._id })
      .then(round => {
        return { round, roundData };
      })
    )
    .then(doEdits)
    .then(round => roundsSrvc.saveRound(round))
    .then(round => res.send(round))
    .catch(next);
};


