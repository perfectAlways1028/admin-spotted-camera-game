'use strict';

var _              = require('lodash');
var Promise        = require('bluebird');
var mongoose       = require('mongoose');
var usersSrvc      = require('../data-services/users');
var consts         = require('../consts');
var log            = require('../util/logger').logger;   
var config         = require('../../config/environment');
var validationUtil = require('../util/validations');

module.exports = function(io, socket) {
 	socket.on('signin', function(payload) {
 		console.log(payload);
		  function parseParams(payload) {
		    var allowedFields = ['_id'];
		    var userData = _.pick(payload, allowedFields);
		    userData.valid = true;
		    return Promise.resolve(userData);
	 	  }
	 	  function validateParams(userData) {
    		if (!validationUtil.isValidObjectId(userData._id)) {
     			userData.valid = false; 
   			  }
   			  return Promise.resolve(userData);

    	  }
    	  function sendUser(user){
			    io.emit('responseSignIn', user);
			    return Promise.resolve(user);
		  }

  	 	  parseParams(payload)
  	 	  	.then(validateParams)
	 	  	.then(user => {
	 	  		if(user.valid){
	 	  			console.log("online:"+socket.id);

	 	  			return usersSrvc.updateOnline(user._id,"online", socket.id);
	 	  		}else {
	 	  			return Promise.resolve(user);
	 	  		}
	 	  	})
	  	    .then(user => sendUser(user))
    			.catch(function(e) {
      			log.error(e);
    		}); 
	 });
	socket.on('disconnect', function() {
 	  	console.log("offline:"+socket.id);
		usersSrvc.updateOnlineWithSocketId(socket.id,"offline");
 	});
};