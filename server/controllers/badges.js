'use strict';

var _              = require('lodash');
var Promise        = require('bluebird');
var customErrors   = require('n-custom-errors');
var consts         = require('../consts');
var badgesSrvc      = require('../data-services/badges');
var gamesSrvc      = require('../data-services/games');
var validationUtil = require('../util/validations');


exports.getBadges = function(req, res, next) {
  badgesSrvc
    .getBadges({}, 'badgeName formular imageUrl description')
    .then(badges => res.send(badges))
    .catch(next);
};

exports.getBadgeById = function(req, res, next) {
  var badgeId = req.params._id;

  function validateParams() {
    if (!validationUtil.isValidObjectId(badgeId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id'});
    }
    return Promise.resolve();
  }

  validateParams()
    .then(() => badgesSrvc.getBadge({ _id: badgeId }, 'badgeName formular imageUrl description'))
    .then(badge => res.send(badge))
    .catch(next);
};

exports.createBadge = function(req, res, next) {
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['badgeName', 'formular', 'description'];
    var badgeData = _.pick(body, allowedFields);
    if(req.files.image){
      var image =req.files.image;
      badgeData.imageUrl = image.path.replace(/^.*[\\\/]/, '');
    }
    return Promise.resolve(badgeData);
  }

  function validateParams(badgeData) {
    return Promise.resolve(badgeData);
  }

  function doEdits(badgeData) {
    var badge = _.assign({}, badgeData);
    return badge;
  }

  parseParams(req)
    .then(validateParams)
    .then(doEdits)
    .then(badge => badgesSrvc.createBadge(badge))
    .then(badge => res.send(badge))
    .catch(next);
};



exports.updateBadge = function(req, res, next) {
  function parseParams(req) {
    var body = req.body;
    var allowedFields = ['badgeName', 'formular', 'description'];
    var badgeData = _.pick(body, allowedFields);
    badgeData._id = req.params._id;
    if(req.files.image){
      var image =req.files.image;
      badgeData.imageUrl = image.path.replace(/^.*[\\\/]/, '');
    }
    return Promise.resolve(badgeData);
  }

  function validateParams(badgeData) {
    return Promise.resolve(badgeData);
  }

  function doEdits(data) {
    _.extend(data.badge, data.badgeData);
    return data.badge;
  }

  parseParams(req)
    .then(validateParams)
    .then(badgeData => badgesSrvc
      .getBadge({ _id: badgeData._id })
      .then(badge => {
        return { badge, badgeData };
      })
    )
    .then(doEdits)
    .then(badge => badgesSrvc.saveBadge(badge))
    .then(badge => res.send(badge))
    .catch(next);
};

exports.deleteBadge = (req, res, next) => {
  var badgeId = req.params._id;

  function validateParams() {
    if (!validationUtil.isValidObjectId(badgeId)) {
      return customErrors.rejectWithUnprocessableRequestError({ paramName: 'id', errMsg: 'must be a valid id' });
    }
    return Promise.resolve();
  }

  validateParams()
    .then(() => badgesSrvc.getBadge({ _id: badgeId }))
    .then(badge => badgesSrvc.deleteBadge(badge))
    .then(badges => res.send(true))
    .catch(next);
};
