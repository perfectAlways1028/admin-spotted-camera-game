'use strict';

var _            = require('lodash');
var jsdom        = require('jsdom');
var moment       = require('moment');
var Promise      = require('bluebird');
var fs           = require('fs');
var request      = require('request');
var customErrors = require('n-custom-errors');
var consts       = require('../../consts');
var jquery       = fs.readFileSync('./node_modules/jquery/dist/jquery.js', 'utf-8');

var WEBSRVC_URL = 'http://vps95616.vps.ovh.ca:8080/convert';

exports.write = (html, styles, output) => {
  return new Promise((resolve, reject) => {
    jsdom.env({
      html: html,
      src: [jquery],
      done: function (err, window) {
        if (err) {
          return reject(err);
        }
        var gen = new Generator(window.$);
        var content = gen.generate();

        request({
          method: 'POST',
          url: WEBSRVC_URL,
          timeout: 1800000,
          formData: {
            jsonbody: JSON.stringify(content),
            jsonformat: JSON.stringify(styles)
          }
        }, (err, res, body) => {
          if (err) {
            err = customErrors.getThirdPartyServiceError({ srvcErr: 'JsonToDoc', errMsg: err.message });
            return reject(err);
          }
          if (res.statusCode >= 400) {
            err = customErrors.getThirdPartyServiceError({
              srvcErr: 'JsonToDoc',
              errMsg: body || `Unexpected response status - ${res.statusCode}`
            });
            return reject(err);
          }
          var bodyJs = JSON.parse(body);
          var bodyBuff = new Buffer(bodyJs.base64, 'base64');
          output.write(bodyBuff);
          output.on('end', resolve);
          output.on('error', reject);
          output.end();
        });
      }
    });
  });
};

function Generator($) {
  this.$ = $;
}

Generator.prototype.generate = function() {
  var self = this;
  var now = moment().format('YYYY-MM-DD');

  return {
    documentType: 'Comfort Letter',
    versionType: 'draft',
    draftDescriptor: {
      draftDate: now,
      text: ''
    },
    letterHead: {
      letterDate: now,
      recipient: []
    },
    content: _.map(self.$('body > *'), self.parseNode.bind(self))
  };
};

Generator.prototype.parseNode = function(node) {
  var self = this;
  var $node = self.$(node);

  var content = {
    type: 'paragraph',
    text: '',
    subContent: []
  };

  var tagName = _.toLower($node.prop('tagName'));
  switch (tagName) {
    case 'p':
      content.text = $node.text();
      break;
    case 'ul':
      content.text = self.getNodeOwnText.call(this, $node);
      content.subContent = _.map($node.children('li'), (elem, index) => {
        var subContent = self.parseNode.call(self, elem);
        subContent.index = consts.CHARS[index]; // TODO: can be more than CHARS.length
        return subContent;
      });
      break;
    case 'ol':
      content.text = self.getNodeOwnText.call(this, $node);
      content.subContent = _.map($node.children('li'), (elem, index) => {
        var subContent = self.parseNode.call(self, elem);
        subContent.index = index + 1;
        return subContent;
      });
      break;
    default:
      content.text = $node.text();
      break;
  }

  return content;
};

Generator.prototype.getNodeOwnText = function(node) {
  var nodes = this.$(node)
    .contents()
    .filter(function() {
      return this.nodeType === 3;
    });
  if (nodes.length > 0) {
    return nodes[0].nodeValue;
  }
  return '';
};
