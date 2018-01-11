'use strict';
var config         = require('../../config/environment');
var nodemailer     = require('nodemailer');
var options = config.get("mailer-option");
var mailProvider = nodemailer.createTransport(options);
exports.mailProvider = mailProvider;