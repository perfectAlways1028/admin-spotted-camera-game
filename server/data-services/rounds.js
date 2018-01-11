'use strict';

var customErrors = require('n-custom-errors');
var Round         = require('mongoose').model('round');
var config         = require('../../config/environment');

exports.getRounds = (filter, keys) => {
  return Round
    .find(filter, keys)
    .populate('judger', 'firstName email')
    .exec();
};

exports.getRound = (filter, keys) => {
  return Round
    .findOne(filter)
    .select(keys)
    .populate('judger', 'firstName email')
    .exec()
    .then(round => {
      if (!round) {
        return customErrors.rejectWithObjectNotFoundError('round is not found');
      }
      return round;
    });
};
exports.deleteRounds = rounds => {
  var filter = {
    "_id": { $in : rounds }
  };

  return Round
    .find(filter)
    .exec()
    .then(rounds => {
      for(var i=0; i< rounds.length; i++){
        var round = rounds[i];
        round.remove();
      }
      return true;
    });
};

exports.createRound = roundData => { 
  return Round.create(roundData);
    
};

exports.saveRound = round => {
  return round.save();
};

exports.confirmRound = (filter) => {
 return Round
    .findOne(filter)
    .exec();  
    
};

exports.updateTask = (roundId, taskText) => {
  
  var startTime = (new Date).getTime();
  var endTime = startTime + config.get("time").round;
    var filter = {
    _id : roundId
  };
  var subfilter = {
    task : taskText,
    status : "play",
    startTime: startTime,
    endTime: endTime
  };
  return Round
    .update(filter, subfilter)
    .exec();

};
exports.updateRoundTimeStop = roundId => {
    var filter = {
    _id : roundId
  }
  var subfilter = {
    startTime : 0,
    endTime : 0
  };
  return Round
    .update(filter, subfilter)
    .exec();

};

exports.updateCompleteStatus = (roundWinnerId,roundId, stat) => {
    var filter = {
    _id : roundId
  }
  var subfilter = {
    status : stat,
    roundWinner : roundWinnerId
  };
  return Round
    .update(filter, subfilter)
    .exec();

};

exports.checkAnswerExist = answerData => {
  console.log(answerData);
  var filter = {
    _id : answerData.roundId,
    "answers.answerCreator": answerData.userId 
    
  };
   return Round
    .count(filter)
    .then(cnt => {
      console.log(cnt+"exist");
      if(cnt > 0){
          return customErrors.rejectWithDuplicateObjectError('Answer is already exist.');
      }else{
          return answerData;
      }
    });
};

exports.addAnswer = answerData => {
  var answer = {
    imageUrl: answerData.imageUrl,
    answerCreator: answerData.userId
  };
  var filter = {
    _id : answerData.roundId

  };
  var subfilter = {
    $push: {answers : answer}
  };
  return Round
    .update(filter, subfilter)
    .exec()
    .then(data => exports.getRound({_id: answerData.roundId},{}));
}

exports.removeAnswer = (roundId, userId) => {
  var filter = {
    _id : data.roundId

  };
  var subfilter = {
    $pull: {answers : {answerCreator: userId}}
  };
  return Game
    .update(filter, subfilter)
    .exec();
}


exports.getAnswer = (roundId, answerId) => {
  var filter = {
    _id : roundId
  };
  return Round.findOne(filter)
    .exec()
    .then(round => {
      if(!round){
          return customErrors.rejectWithObjectNotFoundError('round is not found');
      }else{
          return round.answers.id(answerId);
      }
    });
}