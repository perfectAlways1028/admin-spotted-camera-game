var cookieParser = require('cookie-parser');
var passport = require('passport');
var Promise        = require('bluebird');
var log     = require('./util/logger').logger;

module.exports = function(server, io) {
    io.on('connection', function(socket) {
      require('./controllers/chat')(io, socket);
    });

};
 