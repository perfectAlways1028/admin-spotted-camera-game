'use strict';

var customErrors = require('n-custom-errors');
var Invitation         = require('mongoose').model('invitation');

exports.getInvitations = (filter, keys) => {
  return Invitation
    .find(filter, keys)
    .exec();
};

exports.getInvitation = (filter, keys) => {
  return Invitation
    .findOne(filter)
    .select(keys)
    .exec()
    .then(invitation => {
      if (!invitation) {
        return customErrors.rejectWithObjectNotFoundError('invitation is not found');
      }
      return invitation;
    });
};

exports.createInvitation = data => {
  return Invitation.create(data);
};

exports.saveInvitation = invitation => {
  return invitation.save();
};

exports.deleteInvitation = invitation => {
  return invitation.remove();
};
exports.deleteInvitationById = inviationId => {
  return Invitation
    .find({_id: inviationId})
    .remove()
    .exec();

}