'use strict';

var config = require('../../config/environment');
var auth   = require('../middleware/auth');
var games  = require('../controllers/games');
var apiVer = config.get('api:version');

module.exports = app => {
  app.get(`/api/${apiVer}/games/:_id`, games.getGameById);
  app.get(`/api/${apiVer}/games`, games.getGames);
  app.post(`/api/${apiVer}/games`, games.createGame);
  app.put(`/api/${apiVer}/games/:_id`, games.updateGame);
  app.post(`/api/${apiVer}/game_remove_player`, games.removePlayer);
  app.post(`/api/${apiVer}/game_write_task`, games.writeTask);
  app.delete(`/api/${apiVer}/games/:_id`, games.deleteGame);
  app.post(`/api/${apiVer}/game_over/:_id`, games.gameOver);
  app.post(`/api/${apiVer}/game_create`, games.createGameAndFirstRound );
  app.post(`/api/${apiVer}/my_games`, games.getGamesForUser);
};
