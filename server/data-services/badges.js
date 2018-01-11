'use strict';

var customErrors = require('n-custom-errors');
var Badge         = require('mongoose').model('badge');

exports.getBadges = (filter, keys) => {
  return Badge
    .find(filter, keys)
    .exec();
};



exports.getBadge = (filter, keys) => {
  return Badge
    .findOne(filter)
    .select(keys)
    .exec()
    .then(badge => {
      if (!badge) {
        return customErrors.rejectWithObjectNotFoundError('badge is not found');
      }
      return badge;
    });
};


exports.createBadge = badgeData => {
  var filter = {
    badgeName: (badgeData.badgeName || '').toLowerCase()
  };
  
  return Badge
    .count(filter)
    .then(cnt => {
      if (cnt > 0) {
        return customErrors.rejectWithDuplicateObjectError('This name is already in use');
      }
      return Badge.create(badgeData);
    });
};

exports.saveBadge = badge => {
  return badge.save();
};

exports.deleteBadge = badge => {
  return badge.remove();
};