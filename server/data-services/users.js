'use strict';

var customErrors = require('n-custom-errors');
var User         = require('mongoose').model('user');


exports.getUsers = (filter, keys) => {
  return User
    .find(filter, keys)
    .populate('badges')
    .populate('friends', 'firstName email' )
    .sort('email')
    .exec();
};

exports.getUser = (filter, keys) => {
  return User
    .findOne(filter)
    .populate('badges')
    .populate('friends' , 'firstName email')
    .select(keys)
    .exec()
    .then(user => {
      if (!user) {
        return customErrors.rejectWithObjectNotFoundError('user is not found');
      }
      return user;
    });
};

exports.handleFacebookAuth = (accessToken, refreshToken, profile) => {

    var user = {
        'email': profile.emails[0].value,
        'firstName' : profile.name.givenName,
        'lastName' : profile.name.familyName,
        'facebookId'   : profile.id,
        'role' : 'user',
        'provider' : 'facebook'
    }
    var filter = {
      facebookId: user.facebookId,
      provider: 'facebook'
    };
  return User
    .findOne(filter)
    .exec()
    .then(userData => {
        if(userData){
          console.log('data exists');
          return userData;
        }
        else{
          return User.create(user);
        }
     });

  /* User.findOrCreate(filter, user, (err, result) => {
      if (!user){
         return customErrors.rejectWithObjectNotFoundError('user is not created');
      }
      return user; 
    });*/
};

exports.createUser = userData => {
  var filter = {
    email: (userData.email || '').toLowerCase()
  };
  
  var filter2 = {
    firstName: userData.firstName
  };
  return User
    .count(filter)
    .then(cnt => {
      if (cnt > 0) {
        return customErrors.rejectWithDuplicateObjectError('This email is already in use.');
      }
      //return User.create(userData);
      return User.count(filter2)
              .then(cnt=>{
                if(cnt > 0) {
                  return customErrors.rejectWithDuplicateObjectError("This username is already in use.");
                }
                return User.create(userData);
              });
    });
    
};

exports.updateUser = (userData) => {
  var filter = {
    _id: userData._id
  };
  var emailFilter = {
    email: (userData.email || '').toLowerCase()
  };
  return User
    .findOne(filter)
    .exec()
    .then(user => {
      if (!user) {
        return customErrors.rejectWithObjectNotFoundError('user is not found');
      }
      if(user.email === userData.email)
        return userData.save();
      else
      {
        return User
          .count(emailFilter)
          .then(cnt => {
            if (cnt > 0) {
              return customErrors.rejectWithDuplicateObjectError('This email is already in use');
            }
            return userData.save();
          });
      }
      
    });
}

exports.saveUser = user => {
  return user.save();
};

exports.addBadge = (userId, badge) => {
  var filter = {
    _id: userId,
    badges : { $ne : badge._id}
  }

  return User
    .findOne(filter)
    .then(user => {
      if (!user){
        return customErrors.rejectWithObjectNotFoundError('user is not found /or badge is already exist');
      }
      return user;  
    })
    .then(user => {
      user.badges.push(badge._id); 
      return user.save();  
    });
  
};

exports.updateOnline = (userId, online, socketId) => {
    var filter = {_id : userId}
    return User
    .findOne(filter)
    .exec()
    .then(user => {
      if (!user) {
        return false;
      }
      user.online = online;
      user.socketId = socketId;
      return user.save();
    });
}

exports.updateOnlineWithSocketId = (socketId, online) => {
    var filter = {socketId : socketId};
    return User
    .findOne(filter)
    .exec()
    .then(user => {
      if (!user) {
        return false;
      }
      user.online = online;
      return user.save();
    });
}
 
exports.increasePoint = (userId, point) => {
    var filter = {_id : userId}
    return User
    .findOne(filter)
    .exec()
    .then(user => {
      if (!user) {
        return customErrors.rejectWithObjectNotFoundError('user is not found');
      }
      user.point += point;
      return user.save();
    });
}
exports.increaseGamesPlayed = (userIds, point) => {
    var filter = {  "_id": { $in : userIds }}
    return User
    .find(filter)
    .exec()
    .then(users => {
      if (!users) {
        return false; 
      }
      for(var i=0; i<users.length; i++){
        var user = users[i];
        user.gamesPlayed += point;
        user.save();        
      }
      return true;


    });
}

exports.increaseGamesWon = (userId, point) => {
    var filter = {_id : userId}
    return User
    .findOne(filter)
    .exec()
    .then(user => { 
      if (!user) {
        return customErrors.rejectWithObjectNotFoundError('user is not found');
      }
      user.gamesWon += point;
      return user.save();
    });
}

exports.getFriends = (userId, key) => {
  var filter = {
    _id : userId
  };
  return User.findOne(filter)
    .populate('friends')
    .exec()
    .then(user => {
      if(!user){
          return [];
      }else{
        var userIds = [];
          for(var i=0; i<user.friends.length; i++) {
            console.log(user.friends[i]);
            userIds.push(user.friends[i]._id);
          }
          var subfilter = {  "_id": { $in : userIds }}
          return User
            .find(subfilter)
            .populate('badges')
            .populate('friends' , 'firstName email')
            .exec()
           .then(users => {
             if (!users) {
              return []; 
             }
           
             return users;


           });
        }
    });
}

exports.getNonFriendUsersByKey = (userId, key) => {
  var key = key.trim();
  let reg = ".*"+key + ".*";
  var filter = {
     $or:[{"email":  {'$regex': reg}},
          {"firstName": {'$regex': reg} }
        ],
    role: 'user',
    friends : {$ne: userId} 

     };
  return User.find(filter)
    .populate('badges')
    .populate('friends', 'firstName email' )
    .sort('firstName')
    .limit(20)
    .exec()
    .then(users=> {
      if(!users){
        return [];
      }

      return users;
    })
}

exports.getUsersByKey = (key) => {
  var key = key.trim();
  let reg = ".*"+key + ".*";
  var filter = {
     $or:[{"email":  {'$regex': reg}},
          {"firstName": {'$regex': reg} }
        ],
     role: 'user',
     };
  return User.find(filter)
    .populate('badges')
    .populate('friends', 'firstName email' )
    .sort('firstName')
    .limit(20)
    .exec()
    .then(users=> {
      if(!users){
        return [];
      }

      return users;
    })
}

exports.existUser = (userId) => {
  return User
    .findOne({_id: userId})
    .then(user=> {
      return user;
    })
}

exports.addFriend = (userId, friendId) => {

  var filter = {
    _id: userId,
    friends : { $ne : friendId}
  }

  return User
    .findOne(filter)
    .then(user => {
      return user;  
    })
    .then(user => {
      if(!user){
        return false;
      }else{
        user.friends.push(friendId); 
        return user.save();  
      }
    });
  
};
