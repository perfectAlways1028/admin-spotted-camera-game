'use strict';

var customErrors = require('n-custom-errors');
var Notification         = require('mongoose').model('notification');

exports.getNotifications = (filter, keys) => {
  return Notification
    .find(filter, keys)
    .exec();
};



exports.getNotification = (filter, keys) => {
  return Notification
    .findOne(filter)
    .select(keys)
    .exec()
    .then(notification => {
      if (!notification) {
        return customErrors.rejectWithObjectNotFoundError('notification is not found');
      }
      return notification;
    });
};


exports.createNotification = data => {
  return Notification.create(data);
};

exports.saveNotification = notification => {
  return notification.save();
};

exports.deleteNotification = notification => {
  return notification.remove();
};
