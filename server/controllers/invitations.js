'use strict';

var _              = require('lodash');
var Promise        = require('bluebird');
var mongoose       = require('mongoose');
var customErrors   = require('n-custom-errors');
var consts         = require('../consts');
var usersSrvc      = require('../data-services/users');
var invitationsSrvc = require('../data-services/invitations');
var validationUtil = require('../util/validations');
var log            = require('../util/logger').logger;              
var config         = require('../../config/environment');
var apn            = require('apn');
var nodemailer   = require('nodemailer');
var generatePassword  = require('password-generator');
var apnProvider    = require('../util/apnProvider').apnProvider;
var mailProvider   = require('../util/mailProvider').mailProvider;


exports.resolveInvitations = function (req, res, next) {
  function parseParams(body) {
    var allowedFields = ['userId', 'facebookId'];
    var userData = _.pick(body, allowedFields);
    return Promise.resolve(userData);
  }

 function validateParams(userData) {
    if (!validationUtil.isValidObjectId(userData.userId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id' });
    }
    if(!userData.facebookId){
    	return customErrors.rejectWithUnprocessableRequestError({ paramName: 'facebookId', errMsg: 'must be a valid' });
    }
   	return Promise.resolve(userData);
  }

  function resolve(userData) {
  	var facebookId = userData.facebookId;
  	var userId = userData.userId;
  	var filter = {
  		receiverFacebookId : facebookId
  	};
  	return invitationsSrvc.getInvitations(filter, "_id sender receiverFacebookId")
  		.then(data=> {
  			for(var i=0; i<data.length; i++){
  				var invitation = data[i];
           usersSrvc.existUser(invitation.sender)
            .then(user => {
              if(user){
                  usersSrvc.addFriend(userId, invitation.sender);
                  usersSrvc.addFriend(invitation.sender, userId);
              }
            })
            invitationsSrvc.deleteInvitationById(invitation._id);


  			}
  			return true;
  		});

  }



  function doEdits(userData) {
    var user = _.assign({}, userData);
    user.status = 'active';
    return user;
  }

  parseParams(req.body)
    .then(validateParams)
    .then(doEdits)
    .then(resolve)
    .then(user => res.send(user))
    .catch(next);
};

exports.createInvitations = function(req, res, next){
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
    data.userId = userData.userId;
    data.inviteList = jsonData;

    return Promise.resolve(data);
  }

  function addInvites(userData) {
  	var inviteList = userData.inviteList;
   	for(var i=0; i<inviteList.length; i++){
   		var receiverFacebookId = inviteList[i];
   		createInvitation(userData.userId, "invite", receiverFacebookId);
   	}
   	return true;
  }


  function createInvitation(sender, type, receiverFacebookId){
    var inviteData = {};
    inviteData.sender =sender
    inviteData.type = type;
    inviteData.receiverFacebookId = receiverFacebookId;
	  invitationsSrvc.createInvitation(inviteData)
        
  }
  parseParams(req.body)
    .then(userData => validateParams(userData))
    .then(userData => addInvites(userData))
    .then(user => res.send(user))
    .catch(next);
};
