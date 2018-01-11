'use strict';

var _              = require('lodash');
var Promise        = require('bluebird');
var mongoose       = require('mongoose');
var customErrors   = require('n-custom-errors');
var consts         = require('../consts');
var usersSrvc      = require('../data-services/users');
var gamesSrvc      = require('../data-services/games');
var notificationsSrvc = require('../data-services/notifications');
var validationUtil = require('../util/validations');
var log            = require('../util/logger').logger;              
var config         = require('../../config/environment');
var apn            = require('apn');
var nodemailer   = require('nodemailer');
var generatePassword  = require('password-generator');
//var options = config.get("apn-option");
//var apnProvider = new apn.Provider(options);
var apnProvider    = require('../util/apnProvider').apnProvider;
var mailProvider   = require('../util/mailProvider').mailProvider;

exports.getUsers = function(req, res, next) {
  usersSrvc
    .getUsers({}, 'email firstName lastName role status gamePlayed facebookId ')
    .then(users => res.send(users))
    .catch(next);
};

exports.getUserById = function(req, res, next) {
  var userId = req.params._id;

  function validateParams() {
    if (!validationUtil.isValidObjectId(userId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id'});
    }
    return Promise.resolve();
  }

  validateParams()
    .then(() => usersSrvc.getUser({ _id: userId }, 'email firstName lastName role status gamesPlayed gamesWon point badges friends imageUrl facebookId'))
    .then(user => res.send(user))
    .catch(next);
};

exports.createUser = function(req, res, next) {
  function parseParams(body) {
    var allowedFields = ['email', 'firstName', 'lastName', 'role'];
    var userData = _.pick(body, allowedFields);
    return Promise.resolve(userData);
  }

  function validateParams(userData) {
    return _validateUserData(userData);
  }

  function doEdits(userData) {
    var user = _.assign({}, userData);
    user.status = 'active';
    return user;
  }

  parseParams(req.body)
    .then(validateParams)
    .then(doEdits)
    .then(user => usersSrvc.createUser(user))
    .then(user => res.send(user))
    .catch(next);
};

exports.updateUser = function(req, res, next) {
  function parseParams(body) {
    var allowedFields = ['email', 'firstName', 'lastName', 'role', 'status'];
    var userData = _.pick(body, allowedFields);
    userData._id = req.params._id;
    if(req.files.image){
      var image = req.files.image;
      userData.imageUrl = image.path.replace(/^.*[\\\/]/, '');
    }
    return Promise.resolve(userData);
  }

  function validateParams(userData) {
    if (!validationUtil.isValidObjectId(userData._id)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id' });
    }
    var allowedStatuses = consts.USER.STATUSES;
    if (!_.includes(allowedStatuses, userData.status)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'status', errMsg: 'must be a valid value'});
    }
    return _validateUserData(userData);
  }

  function doEdits(data) {
    _.extend(data.user, data.userData);
    return data.user;
  }

  parseParams(req.body)
    .then(validateParams)
    .then(userData => usersSrvc
      .getUser({ _id: userData._id })
      .then(user => {
        return { user, userData };
      })
    )
    .then(doEdits)
    .then(user => usersSrvc.saveUser(user))
    .then(user => res.send(user))
    .catch(next);
};

exports.forgotPassword = function(req, res, next){
  function parseParams(body) {
    var allowedFields = ['email'];
    var userData = _.pick(body, allowedFields);
    return Promise.resolve(userData);
  }

  function validateParams(userData) {
    return _validateUserData(userData);
  }

  function updateUser(userData) {
    userData.newPassword = generatePassword(12, false);
    return usersSrvc.getUser({ email: userData.email })
      .then(user => {
        user.set("password", userData.newPassword);
        user.newPassword = userData.newPassword;
          return user;   
      })
  }
  function sendEmail(userData) {
    let message = {
      from: 'kgom1028@hotmail.com', // sender address
      to: userData.email, // list of receivers
      subject: 'Spotted Game password changed.', // Subject line
      text: 'Your changed password: '+ userData.newPassword, // plain text body
      html: 'Your changed password: <b>'+ userData.newPassword + '</b>' // html body
    };
    console.log(message);
    mailProvider.sendMail(message, (error, info) => {
          if (error) {
              return console.log(error);
          }
          console.log('Message %s sent: %s', info.messageId, info.response);
      });
    return Promise.resolve(userData);
  }
 parseParams(req.body)
    .then(validateParams)
    .then(updateUser)
    .then(sendEmail)
    .then(user => usersSrvc.saveUser(user))
    .then(user => res.send(user))
    .catch(next);
}


exports.updatePassword = function(req, res, next){
  function parseParams(body) {
    var allowedFields = ['oldPassword', 'newPassword'];
    var userData = _.pick(body, allowedFields);
    userData._id = req.params._id;
    return Promise.resolve(userData);
  }

  function validateParams(userData) {
    if (!validationUtil.isValidObjectId(userData._id)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id' });
    }
    return Promise.resolve(userData);
  }


   parseParams(req.body)
    .then(validateParams)
    .then(userData => usersSrvc
      .getUser({ _id: userData._id })
      .then(user => {
        if(user.authenticate(userData.oldPassword)){
          user.set("password", userData.newPassword);
          return user;   
        }else {
          return customErrors.rejectWithUnprocessableRequestError({ paramName: 'oldPassword', errMsg: 'must be same as original password' });
        }
        
      })
    )
    .then(user => usersSrvc.saveUser(user))
    .then(user => res.send(user))
    .catch(next);

};
exports.acceptInvite = function(req, res, next) {
   function parseParams(body) {
    var allowedFields = ['userId', 'gameId', 'isAccept'];
    var data = _.pick(body, allowedFields);
    log.info(data);
    return Promise.resolve(data);
  }

  function validateParams(data) {
    if (!validationUtil.isValidObjectId(data.userId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'userId', errMsg: 'must be a valid id' });
    }
    if (!validationUtil.isValidObjectId(data.gameId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'gameId', errMsg: 'must be a valid id' });
    }
    return Promise.resolve(data);
  }

  function doEdits(data) {
    _.extend(data.user, data);
    return data.user;
  }
  function removeFromInvite(data){
     return gamesSrvc.removeInvite(data)
              .then(gameData=> Promise.resolve(data));
  }
  function addToPlayers(data){
    if(data.isAccept === '1'){
      log.info("Accept invite: add Player");
       return gamesSrvc.addPlayer(data)
              .then(gameData=> Promise.resolve(data));
    }else{
       return Promise.resolve(data); 
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

  function sendNotifications(data){
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
      console.log(player);
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
  

   parseParams(req.body)
    .then(validateParams)
    .then(removeFromInvite)
    .then(addToPlayers)
    .then(getGamePlayers)
    .then(sendNotifications)
    .then(user => res.send(user))
    .catch(next);

}
exports.requestFriend = function(req, res, next) {
    function safelyParseJSON (json) {
    var parsed;
    try {
      parsed = JSON.parse(json)
    } catch (e) {
      console.error("Invalid json");
    }
    return parsed;  // Could be undefined!
  }


  function parseParams(data) {
    var jsonData;
    if(data instanceof String){
        jsonData = safelyParseJSON(data);
    }else{
        jsonData = data;
    }
    //  console.log(jsonData);
    return Promise.resolve(jsonData);
  }

  function validateParams(userData) {
    var userList = userData.userList;
    var jsonData = safelyParseJSON(userList);
    var data= {};
    data.requesterId = userData.requesterId;
    data.userList = jsonData;
    return Promise.resolve(data);
  }
  function populateRequesterData(userData) {
    var filter = {
      '_id' : userData.requesterId
    }
    return usersSrvc.getUser(filter, "_id firstName email imageUrl")
      .then(user => {
        userData.requester = user;
        return Promise.resolve(userData);
      })

  }
  function populateUserData(userData){
    var ids = [];
     for(var i=0; i<userData.userList.length; i++){
        var user = userData.userList[i];

        ids.push(mongoose.Types.ObjectId(user.userId));
     }
    var filter = {
      '_id': { $in: ids}
    };
    return usersSrvc.getUsers(filter," _id APNSToken ")
            .then(users =>{
              userData.userList = users;
              return Promise.resolve(userData);
            });

  }
  function saveNotification(type, receiver, data, APNSToken){
    var notiData = {};
    notiData.type = type;
    notiData.data = JSON.stringify(data);;
    notiData.receiverId = receiver._id;
    console.log(notiData);
    return notificationsSrvc.createNotification(notiData)
            .then(notification => {
              notiData._id = notification._id;
              notiData.APNSToken = receiver.APNSToken;
              return notiData;
            })

  }
  function sendNotifications(userData){
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.sound = "ping.aiff";
    note.alert = userData.requester.firstName + " want to be a friend with you.";
    note.topic = "com.kgom.spotted";
    var userList = userData.userList;
    for(var i=0; i<userList.length; i++){
      var user = userList[i];
      if(user.APNSToken !== undefined){

         saveNotification(600, user, {'requesterId': userData.requester._id , 'mail': userData.requester.mail, 'firstName': userData.requester.firstName, 'imageUrl': userData.requester.imageUrl} )
          .then(notification => {
                        console.log("--------------notification---------");
            console.log(notification);
              note.payload = notification;
               apnProvider.send(note, notification.APNSToken)
                 .then( (result) => {
                   log.info('APNS','result=',result);
               }); 
          });
      }
        
    }
  
    return userData;   
  }


  parseParams(req.body)
    .then(userData => validateParams(userData))
    .then(userData => populateUserData(userData))
    .then(userData => populateRequesterData(userData))
    .then(userData => sendNotifications(userData))
    .then(user => res.send(user))
    .catch(next);
}

exports.acceptFriend = function(req, res, next) {
   function parseParams(body) {
    var allowedFields = ['userId', 'requesterId', 'isAccept'];
    var data = _.pick(body, allowedFields);
    return Promise.resolve(data);
  }

  function validateParams(data) {
    if (!validationUtil.isValidObjectId(data.userId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'userId', errMsg: 'must be a valid id' });
    }
    if (!validationUtil.isValidObjectId(data.requesterId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'requesterId', errMsg: 'must be a valid id' });
    }
    return Promise.resolve(data);
  }

  function doEdits(data) {
    _.extend(data.user, data);
    return data.user;
  }

  function addToFriends(data){
    if(data.isAccept === '1'){
      log.info("Accept request: add to Friends");
       return usersSrvc.addFriend(data.userId, data.requesterId)
                .then(user => usersSrvc.addFriend(data.requesterId, data.userId))
              .then(user=> Promise.resolve(data));
    }else{
       return Promise.resolve(data); 
    }
  }

  parseParams(req.body)
    .then(validateParams)
    .then(addToFriends)
    .then(user => res.send(user))
    .catch(next);

};

exports.invitePlayer = function(req, res, next){
  function safelyParseJSON (json) {
    var parsed;
    try {
      parsed = JSON.parse(json)
    } catch (e) {
      console.error("Invalid json");
    }
    return parsed;  // Could be undefined!
  }


  function parseParams(data) {
    var jsonData;
    if(data instanceof String){
        jsonData = safelyParseJSON(data);
    }else{
        jsonData = data;
    }
    //  console.log(jsonData);
    return Promise.resolve(jsonData);
  }

  function validateParams(userData) {
    var inviteList = userData.inviteList;
    var jsonData = safelyParseJSON(inviteList);
    var data= {};
    data.gameId = userData.gameId;
    data.userId = userData.userId;
    data.inviteList = jsonData;

    return Promise.resolve(data);
  }
  function populateRequesterData(userData) {
    var filter = {
      '_id' : userData.userId
    }
    return usersSrvc.getUser(filter, "_id firstName email imageUrl")
      .then(user => {
        userData.requester = user;
        return Promise.resolve(userData);
      })

  }


  function addInvites(userData) {
     return gamesSrvc.addInvites(userData)
              .then(gameData=> Promise.resolve(userData));

  }
  function populateUserData(userData){
    var ids = [];
     for(var i=0; i<userData.inviteList.length; i++){
        var user = userData.inviteList[i];

        ids.push(mongoose.Types.ObjectId(user.userId));
     }
    var filter = {
      '_id': { $in: ids}
    };
    return usersSrvc.getUsers(filter," _id APNSToken ")
            .then(users => {
              userData.inviteList = users;
              return Promise.resolve(userData);
            });
  }

  function saveNotification(type, receiver, data, APNSToken){
    var notiData = {};
    notiData.type = type;
    notiData.data = JSON.stringify(data);;
    notiData.receiverId = receiver._id;

    return notificationsSrvc.createNotification(notiData)
            .then(notification => {
              notiData._id = notification._id;
              notiData.APNSToken = receiver.APNSToken;
              return notiData;
            })

  }
  function sendNotifications(userData){
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.sound = "ping.aiff";

    note.topic = "com.kgom.spotted";
    var inviteList = userData.inviteList;
    for(var i=0; i<inviteList.length; i++){
      var inviter = inviteList[i];
      //console.log(inviter);
      if(inviter.APNSToken !== undefined){
        saveNotification(100, inviter, {'requesterId': userData.requester._id, 'requesterName': userData.requester.firstName, 'requesterImageUrl': userData.requester.imageUrl, 'gameId': userData.gameId} )
          .then(notification => {
            console.log(notification);
              note.payload = notification;
               apnProvider.send(note, notification.APNSToken)
                 .then( (result) => {
                   log.info('APNS','result=',result);
               }); 
          });

      }
        
    }
  
    return userData;   
  }


  parseParams(req.body)
    .then(userData => validateParams(userData))
    .then(userData => addInvites(userData))
    .then(userData => populateRequesterData(userData))
    .then(userData => populateUserData(userData))
    .then(userData => sendNotifications(userData))
    .then(user => res.send(user))
    .catch(next);
};

exports.updateToken = function(req, res, next) {
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['APNSToken'];
    var userData = _.pick(body, allowedFields);
    userData._id = req.params._id;
    userData.role = 'user';
    userData.status = 'active';
    return Promise.resolve(userData);
  }

  function validateParams(userData) {
    if (!validationUtil.isValidObjectId(userData._id)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id' });
    }
    return Promise.resolve(userData);
  }

  function doEdits(data) {
    _.extend(data.user, data.userData);
    return data.user;
  }

  parseParams(req)
    .then(validateParams)
    .then(userData => usersSrvc
      .getUser({ _id: userData._id })
      .then(user => {

        return { user, userData };
      })
    )
    .then(doEdits)
    .then(user => usersSrvc.saveUser(user))
    .then(user => res.send(user))
    .catch(next);
};

exports.createPlayer = function(req, res, next){
  function parseParams(body) {
    var allowedFields = ['email', 'firstName', 'lastName', 'APNSToken', 'password'];
    var userData = _.pick(body, allowedFields);
    userData.role = 'user';
    userData.status = 'active';
    return Promise.resolve(userData);
  }

  function validateParams(userData) {
    return _validateUserData(userData);
  }

  function doEdits(userData) {
    var user = _.assign({}, userData);
    user.status = 'active';

    return user;
  }

  parseParams(req.body)
    .then(validateParams)
    .then(doEdits)
    .then(userData => usersSrvc
      .createUser(userData)
      .then(user => {
        user.set("password", userData.password);
        return user;
      })
      )
    .then(user => usersSrvc.saveUser(user))
    .then(user => res.send(user))
    .catch(next);
};
exports.updatePlayer = function(req, res, next){
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['email', 'firstName', 'lastName', 'APNSToken', 'gamesPlayed', 'gamesWon', 'point'];
    var userData = _.pick(body, allowedFields);
    userData._id = req.params._id;
    userData.role = 'user';
    userData.status = 'active';
    if(req.files && req.files.image){
      var image =req.files.image;
      userData.imageUrl = image.path.replace(/^.*[\\\/]/, '');
    }
    return Promise.resolve(userData);
  }

  function validateParams(userData) {
    if (!validationUtil.isValidObjectId(userData._id)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id' });
    }
    var allowedStatuses = consts.USER.STATUSES;
    if (!_.includes(allowedStatuses, userData.status)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'status', errMsg: 'must be a valid value'});
    }
    return _validateUserData(userData);
  }

  function doEdits(data) {
    _.extend(data.user, data.userData);
    return data.user;
  }

  parseParams(req)
    .then(validateParams)
    .then(userData => usersSrvc
      .getUser({ _id: userData._id })
      .then(user => {
        return { user, userData };
      })
    )
    .then(doEdits)
    .then(user => usersSrvc.updateUser(user))
    .then(user => res.send(user))
    .catch(next);
};

exports.getPlayers = function(req, res, next){
  usersSrvc
    .getUsers({role:'user'}, 'email firstName lastName role status online gamesPlayed gamesWon point badges friends imageUrl facebookId')
    .then(users => res.send(users))
    .catch(next);
};

exports.getFriends = function(req, res, next){
  usersSrvc
    .getUsers({role:'user'}, 'email firstName lastName role status online gamesPlayed gamesWon point imageUrl')
    .then(users => res.send(users))
    .catch(next);
};

exports.addFriends = function(req, res, next){
  usersSrvc
    .getUsers({role:'user'}, 'email firstName lastName role status online gamesPlayed gamesWon point')
    .then(users => res.send(users))
    .catch(next);
};

exports.updateFriend = function(req, res, next){
   usersSrvc
    .getUsers({role:'user'}, 'email firstName lastName role status online gamesPlayed gamesWon point')
    .then(users => res.send(users))
    .catch(next);
};

exports.deleteFriend = function(req, res, next){
  usersSrvc
    .getUsers({role:'user'}, 'email firstName lastName role status online gamesPlayed gamesWon point')
    .then(users => res.send(users))
    .catch(next);
};

exports.clearFriends = function(req, res, next){
  usersSrvc
    .getUsers({role:'user'}, 'email firstName lastName role status online gamesPlayed gamesWon point')
    .then(users => res.send(users))
    .catch(next);
};

exports.getBadges = function(req, res, next){
  usersSrvc
    .getUsers({role:'user'}, 'badges')
    .then(users => res.send(users))
    .catch(next);
};

exports.addFriend = function(req, res, next) {
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['friend_fb_id'];
    var friendData = _.pick(body, allowedFields);
    var _id = req.params._id;
    var searchData = {_id, friendData};

    return Promise.resolve(searchData);
  }
  function validateParams(searchData) {
    if (!validationUtil.isValidObjectId(searchData._id)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: '_id', errMsg: 'must be a valid id' });
    }
    return Promise.resolve(searchData);
  }
  function getFriend(searchData){
    return usersSrvc.getUser({"facebookId" : searchData.friend_fb_id},"") 
      .then(user => {
        searchData.friend = user;
        return searchData;
      })
  }
  function addFriend(searchData){
    usersSrvc.addFriend(searchData._id, searchData.friend._id);
    usersSrvc.addFriend(searchData.friend._id, searchData._id);
    return searchData;
  }

  parseParams(req)
    .then(validateParams)
    .then(getFriend)
    .then(addFriend)
    .then(data => res.send(data))
    .catch(next);
}

exports.searchFriends = function(req, res, next) {
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['key'];
    var search = _.pick(body, allowedFields);
    var _id = req.params._id;
    var searchData = {_id, search};

    return Promise.resolve(searchData);
  }
  function validateParams(searchData) {
    if (!validationUtil.isValidObjectId(searchData._id)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: '_id', errMsg: 'must be a valid id' });
    }
    if(!searchData.search.key) {
      searchData.search.key = "";
    }
    return Promise.resolve(searchData);
  }
  function searchFriends (searchData){
     return usersSrvc.getFriends(searchData._id, searchData.search.key)
  }

 parseParams(req)
    .then(validateParams)
    .then(searchFriends)
    .then(data => res.send(data))
    .catch(next);
}

exports.searchUsers = function(req, res, next) {
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['key'];
    var search = _.pick(body, allowedFields);
    var _id = req.params._id;
    var searchData = {_id, search};

    return Promise.resolve(searchData);
  }
  function validateParams(searchData) {
    if (!validationUtil.isValidObjectId(searchData._id)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: '_id', errMsg: 'must be a valid id' });
    }
    if(!searchData.search.key) {
      searchData.search.key = "";
    }
    return Promise.resolve(searchData);
  }
  function searchNonFriends (searchData){
     return usersSrvc.getNonFriendUsersByKey(searchData._id, searchData.search.key)
            .then(users=>{
                    searchData =users;                   
                    return Promise.resolve(searchData);
                  }); 
}
 parseParams(req)
    .then(validateParams)
    .then(searchNonFriends)
    .then(data => res.send(data))
    .catch(next);
}



exports.addBadge = function(req, res, next){
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['_id'];
    var badge = _.pick(body, allowedFields);
    var _userId = req.params._id;
    var badgeData = {_userId, badge};

    return Promise.resolve(badgeData);
  }

  function validateParams(badgeData) {
    if (!validationUtil.isValidObjectId(badgeData._userId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'user id', errMsg: 'must be a valid id' });
    }
    if (!validationUtil.isValidObjectId(badgeData.badge._id)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'badge id', errMsg: 'must be a valid id' });
    }
    return Promise.resolve(badgeData);
  }

  function doEdits(badgeData) {
    var badge = _.assign({}, badgeData);
    return badge;
  }

  parseParams(req)
    .then(validateParams)
    .then(doEdits)
    .then(badge => usersSrvc.addBadge(badge._userId, badge.badge))
    .then(user => res.send(user))
    .catch(next);
};


function _validateUserData(userData) {
  if (!validationUtil.isValidEmail(userData.email)) {
    return customErrors.rejectWithUnprocessableRequestError({
      paramName: 'email:'+userData.email,
      errMsg: 'is required and must be a valid email'
    });
  }
  return Promise.resolve(userData);
}


exports.getPVPInfo = function(req, res, next){
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['userId', 'friendId'];
    var data = _.pick(body, allowedFields);
    return Promise.resolve(data);
  }

  function validateParams(data) {
    if (!validationUtil.isValidObjectId(data.userId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'user id', errMsg: 'must be a valid id' });
    }
    if (!validationUtil.isValidObjectId(data.friendId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'friend id', errMsg: 'must be a valid id' });
    }
    return Promise.resolve(data);
  }

  function getGamesWithFriend(data) {
    return gamesSrvc.getGamesWithFriend(data.userId, data.friendId)
      .then(games => {
        data.games = games;
        return Promise.resolve(data);
      });
  }

  function doEdits(data) {
    var userData = _.assign({}, data);
    var responseData = {};
    responseData.userWon = 0;
    responseData.friendWon = 0;
    responseData.userPoint = 0;
    responseData.friendPoint = 0;
    userData.responseData = responseData;
    return Promise.resolve(userData);
  }

  function getPvpData(data) {

    if(data.games) {
      var games = data.games;
      var responseData = data.responseData;
      for(var i=0, len = games.length; i<len; i++){
        var game = games[i];
        var gamePlayers = game.gamePlayers;

        if(game.gameWinner) {
          var gameWinner = game.gameWinner;

          if(gameWinner.equals(data.userId)) {
            console.log("userWon");
             responseData.userWon ++; 
          }

          if(gameWinner.equals(data.friendId)) {
                        console.log("friendWon");
             responseData.friendWon ++; 
          }
        }
        for(var j=0, len2= gamePlayers.length; j<len2; j++ ){
          var gamePlayer = gamePlayers[j];
          if(gamePlayer.player.equals(data.userId)){
              responseData.userPoint += gamePlayer.point;
          }
          if(gamePlayer.player.equals(data.friendId)){
              responseData.friendPoint += gamePlayer.point;
          }
        }

      }
      return Promise.resolve(responseData);

    }
    else
    {
      return Promise.resolve(data.responseData);

    }
  }

  parseParams(req)
    .then(validateParams)
    .then(doEdits)
    .then(getGamesWithFriend)
    .then(getPvpData)
    .then(user => res.send(user))
    .catch(next);
};

exports.getNotifications = function(req, res, next) {
  var userId = req.params._id;

  function validateParams() {
    if (!validationUtil.isValidObjectId(userId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id'});
    }
    return Promise.resolve();
  }

  validateParams()
    .then(() => notificationsSrvc.getNotifications({ receiverId: userId }, '_id receiverId type data'))
    .then(user => res.send(user))
    .catch(next);
};

exports.deleteNotification = (req, res, next) => {
  var notificationId = req.params._id;

  function validateParams() {
    if (!validationUtil.isValidObjectId(notificationId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id' });
    }
    return Promise.resolve();
  }

  validateParams()
    .then(() => notificationsSrvc.getNotification({ _id: notificationId }))
    .then(notification => notificationsSrvc.deleteNotification(notification))
    .then(notification => res.send(true))
    .catch(next);
};