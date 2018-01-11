'use strict';

var customErrors = require('n-custom-errors');
var Game         = require('mongoose').model('game');

exports.getGames = (filter, keys) => {
  return Game
    .find(filter, keys)
    .populate('gameCreator')
    .populate('gameWinner')
    .populate('currentRound')
    .populate('gamePlayers.player')
    .populate('gamePlayers.badges')
    .populate({
      path: 'gameRounds',
      populate: { path: 'judger', select:'firstName'}
    })
    .exec();
};

exports.getGame = (filter, keys) => {
  var populateRound = {
    path:'gameRounds'

  }
  return Game
    .findOne(filter)
    .populate('gameCreator')
    .populate('gameWinner')
    .populate('currentRound')
    .populate('gamePlayers.player')
    .populate('gamePlayers.badges')
    .populate({
      path: 'gameRounds',
      populate: { path: 'judger', select:'firstName'}
    })
    .select(keys)
    .exec()
    .then(game => {
      if (!game) {
        return customErrors.rejectWithObjectNotFoundError('game is not found');
      }
      return game;
    });
};


exports.createGame = gameData => {
  var filter = {
    gameName: (gameData.gameName || '').toLowerCase()
  };
  
  return Game
    .count(filter)
    .then(cnt => {
      return Game.create(gameData);
    });
};



exports.saveGame = game => {
  return game.save();
};

exports.getPlayers = gameId => {
  var filter = {_id : gameId}
return Game
    .findOne(filter)
      .populate('gamePlayers.player', '22firstName email APNSToken')
      .populate({
        path: 'gameRounds',
        // Get friends of friends - populate the 'friends' array for every friend
        populate: { path: 'judger', select:'firstName'}
      })
    .exec()
    .then(game => {
      if (!game) {
        return customErrors.rejectWithObjectNotFoundError('game is not found');
      }
      return game;
    });
}

exports.addRound = roundData => {
 
  var filter = {
    _id: roundData._gameId,
    gameRounds : { $ne : roundData._roundId}
  }

  return Game
    .findOne(filter)
    .then(game => {
      if (!game){
        return customErrors.rejectWithObjectNotFoundError('game is not found /or round is already exist');
      }
      return game;  
    })
    .then(game => {
      game.gameRounds.push(roundData._roundId); 
      game.currentRound = roundData._roundId;
      return game.save();
    });
  
}
exports.addRoundById = (gameId, roundId) => {
 
  var filter = {
    _id: gameId,
    gameRounds : { $ne : roundId}
  }

  return Game
    .findOne(filter)
    .then(game => {
      if (!game){
        return customErrors.rejectWithObjectNotFoundError('game is not found /or round is already exist');
      }
      return game;  
    })
    .then(game => {
      game.gameRounds.push(roundId); 
      game.currentRound = roundId;
      return game.save();
    });
  
}
/*
  param data 
  {
    gameId : "xxxx",
    inviteUsers : [{"_id":"xxx"}]
  }
*/
exports.addInvites = data => {
 
  var filter = {
    _id: data.gameId
  }

  var inviteList  = data.inviteList;
  var userArr = [];

  for(var i=0; i<inviteList.length; i++){
    var user = inviteList[i];
    userArr.push(user.userId);
  }
  return Game
    .findOne(filter)
    .then(game => {
      if (!game){
        return customErrors.rejectWithObjectNotFoundError('game is not found');
      }
      return game;  
    })
    .then(game => {
      game.gameInvites = game.gameInvites.concat(userArr); 
//      console.log(game);
      return game.save();  
    });
  
}

exports.getGamesForUser = userId =>{
  var filter = {
    "gamePlayers.player": userId
  };
  return exports.getGames(filter, "gameName status startTime endTime gameCreator gameWinner gamePlayers gameRounds currentRound");
}


exports.removeInvite = data => {
  var filter = {
    _id : data.gameId

  };
  var subfilter = {
    $pull: {gameInvites : data.userId}
  };
  return Game
    .update(filter, subfilter)
    .exec();
}

exports.removePlayer = data => {
  var filter = {
    _id : data.gameId

  };
  var subfilter = {
    $pull: {gamePlayers : {player: data.userId}}
  };
  return Game
    .update(filter, subfilter)
    .exec();
}

exports.confirmJudger = data=> {
  var filter = {
    _id: data.gameId,
    gameJudger : data.userId
  }
  return Game
    .findOne(filter)
    .then(game => {
      if (!game){
        return customErrors.rejectWithObjectNotFoundError('game is not found');
      }
      return game;  
    })
}


exports.addPlayer = data => {
  var filter = {
    _id : data.gameId,
    "gamePlayers.player" : {"$ne": data.userId}
  };

  var subfilter = {
    $push: {gamePlayers : {player:data.userId}}
  };
  return Game
    .update(filter, subfilter)
    .exec();
}

exports.deleteGame = game => {
  return game.remove();
};

exports.updatePlayerPoint = (gameId, playerId, pointData) => {
 // console.log(pointData);
  var filter = {  
    _id : gameId,
    "gamePlayers.player": playerId  
  };

  var subfilter = {
    "$set": {"gamePlayers.$.point": pointData}, 

  };
  return Game
    .update(filter, subfilter)
    .exec();

};

exports.updatePlayerJudged = (gameId, judgerId, judged) => {
  var filter = {  
    _id : gameId,
    "gamePlayers.player": judgerId  
  };

  var subfilter = {
    "$set": {"gamePlayers.$.judged": judged}, 

  };
  return Game
    .update(filter, subfilter)
    .exec();

};

exports.updatePlayerAnswered = (gameId, playerId, answered) => {
  var filter = {  
    _id : gameId,
    "gamePlayers.player": playerId  
  };

  var subfilter = {
    "$set": {"gamePlayers.$.answered": answered}, 

  };
  return Game
    .update(filter, subfilter)
    .exec();
};

exports.updatePlayersAnswered = (gameId, answered) => {

  var filter = {  
    _id : gameId
  };

  var subfilter = {
    "$set": {"gamePlayers.$.answered": answered}
  };
  return Game
    .update(filter, subfilter, {"multi": true})
    .exec();
};




exports.addBadgeToGamePlayer = (gameId, playerId, badgeId)=> {
  var filter = {
    _id : gameId,
    "gamePlayers.player" : playerId,
    
  };
  var subfilter = {
    $push : {"gamePlayers.$.badges": badgeId}
  };
  return Game
    .update(filter, subfilter)
    .exec();
}

exports.getGamePlayer = (gameId, playerId) => {
  var filter = {
    _id : gameId
  };
  return Game.findOne(filter)
    .exec()
    .then(round => {
      if(!round){
          return customErrors.rejectWithObjectNotFoundError('round is not found');
      }else{
        console.log("gameCreator:"+playerId);
          var player = round.gamePlayers.filter(function(gamePlayer){              
            return gamePlayer.player.equals(playerId);
          }).pop();
          return player;
      }
    });
}

exports.getGamePlayers = (gameId) => {
  var filter = {
    _id : gameId
  };
  return Game.findOne(filter)
    .populate('gamePlayers.player')
    .exec()
    .then(round => {
      if(!round){
          return customErrors.rejectWithObjectNotFoundError('round is not found');
      }else{
        return round.gamePlayers;
      }
    });
}

exports.confirmGameJudger = (gameId, userId) => {
  var filter = {
    _id : gameId,
    gameJudger : userId
  };
  return Game.findOne(filter)
    .exec()
    .then(game => {
      if(!game){
        return false;
      }
      else 
        return true;
    })
}

exports.getJudger = (gameId) => {
  var filter = {
    _id : gameId
  };
  return Game.findOne(filter)
    .exec()
    .then(round => {
      if(!round){
          return customErrors.rejectWithObjectNotFoundError('round is not found');
      }else{
          var player = round.gamePlayers.filter(function(gamePlayer){  
            return gamePlayer.judged !== 1;
          }).pop();
          return Promise.resolve(player);
      }
    });
}

exports.updateGameJudger = (gameId, judgerId) => {
  var filter = {
    _id : gameId
  }

  var subfilter = {
    gameJudger : judgerId
  };
  return Game
    .update(filter, subfilter)
    .exec();
}

exports.updateCurrentRound = (gameId, roundId) => {
    var filter = {
    _id : gameId
  }
  var subfilter = {
    currentRound : roundId
  };
  return Game
    .update(filter, subfilter)
    .exec();

};

exports.gameOver = (gameId) => {
  var filter = {
    _id : gameId
  }
  var subfilter = {
    status : "close"
  };
  return Game
    .update(filter, subfilter)
    .exec(); 
}


exports.updateCompleteStatus = (gameId, winnerId) => {
  var filter = {
    _id : gameId
  }
  var subfilter = {
    gameWinner : winnerId,
    status : "close"
  };
  return Game
    .update(filter, subfilter)
    .exec(); 
}

exports.updateGamePlayerState = (gameId, playerId, playerState) => {
  var filter = {  
    _id : gameId,
    "gamePlayers.player": playerId  
  };

  var subfilter = {
    "$set": {"gamePlayers.$.playerState": playerState}
  };
  return Game
    .update(filter, subfilter)
    .exec();

};

exports.getGamesWithFriend = (userId, friendId) => {
  
  var filter = {
    "gamePlayers.player": { $in : [userId, friendId] }
  }

  var keys =  "gamePlayers gameWinner";

  return Game
    .find(filter, keys)
    .exec();
};