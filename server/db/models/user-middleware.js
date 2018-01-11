'use strict';

var crypto = require('crypto');

module.exports = userSchema => {
  userSchema.virtual('password').set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  });

  userSchema.pre('save', function(next) {
    this.email = this.email.toLowerCase();
    next();
  });

  userSchema.methods = {
    authenticate: function(plainText) {
      return this.encryptPassword(plainText) === this.hashedPassword;
    },

    encryptPassword: function(password) {
      if (!password || !this.salt) {
        return '';
      }
      var salt = new Buffer(this.salt, 'base64');
      console.log("-----salt-----");
      console.log(salt);
      return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
    },

    makeSalt: function() {
      return crypto.randomBytes(16).toString('base64');
    },

  };
};
