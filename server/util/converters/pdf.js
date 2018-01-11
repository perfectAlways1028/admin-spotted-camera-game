'use strict';

var pdf     = require('html-pdf');
var Promise = require('bluebird');

exports.write = (html, output) => {
  return new Promise((resolve, reject) => {
    pdf
      .create(html)
      .toStream((err, pdfStream) => {
        if (err) {
          return reject(err);
        }
        pdfStream.pipe(output);
        pdfStream.on('end', resolve);
        pdfStream.on('error', reject);
      });
  });
};
