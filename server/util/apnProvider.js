var config         = require('../../config/environment');
var apn = require('apn');
var options = config.get("apn-option");
var apnProvider = new apn.Provider(options);
exports.apnProvider = apnProvider;