'use strict';

var config = require('../../config/environment');
var auth   = require('../middleware/auth');
var users  = require('../controllers/users');
var apiVer = config.get('api:version');

module.exports = app => {
  app.get(`/api/${apiVer}/users/:_id`, auth.requireRolesWrapper('admin'), users.getUserById);
  app.get(`/api/${apiVer}/users`, auth.requireRolesWrapper('admin'), users.getUsers);
  app.post(`/api/${apiVer}/users`, auth.requireRolesWrapper('admin'), users.createUser);
  app.put(`/api/${apiVer}/users/:_id`, auth.requireRolesWrapper('admin'), users.updateUser);

  app.post(`/api/${apiVer}/player_invite`, users.invitePlayer);
  app.get(`/api/${apiVer}/players/:_id`, users.getUserById);
  app.get(`/api/${apiVer}/players`, users.getPlayers);
  app.post(`/api/${apiVer}/players`, users.createPlayer);
  app.put(`/api/${apiVer}/players/:_id`, users.updatePlayer);
  app.post(`/api/${apiVer}/update_token/:_id`, users.updateToken);
  app.post(`/api/${apiVer}/player_invite_accept`, users.acceptInvite);
  app.post(`/api/${apiVer}/forgot_password`, users.forgotPassword);
  app.post(`/api/${apiVer}/player_friends/:_id`, users.searchFriends);
  app.post(`/api/${apiVer}/search_non_friends/:_id`, users.searchUsers);
  app.post(`/api/${apiVer}/player_friend_request`, users.requestFriend);
  app.post(`/api/${apiVer}/player_friend_accept`, users.acceptFriend);
  app.get(`/api/${apiVer}/player_notifications/:_id`, users.getNotifications);
  app.post(`/api/${apiVer}/delete_notification/:_id`, users.deleteNotification);
  /*app.get(`/api/${apiVer}/player_friends/:_id`, users.getFriends);
  app.post(`/api/${apiVer}/player_friends/:_id`, users.addFriends);
  app.put(`/api/${apiVer}/player_friends/:_id/:_friendId`, users.updateFriend);
  app.delete(`/api/${apiVer}/player_friends/:_id/:_friendId`, users.deleteFriend);
  app.delete(`/api/${apiVer}/player_friends/:_id`, users.clearFriends);*/

 // app.get(`/api/${apiVer}/player_badges/:_id`, users.getBadges);
  app.post(`/api/${apiVer}/player_badges/:_id`, users.addBadge);

  app.post(`/api/${apiVer}/get_pvp_info`, users.getPVPInfo);
};
