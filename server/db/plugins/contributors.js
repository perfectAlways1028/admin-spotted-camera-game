'use strict';

var mongoose = require('mongoose');

module.exports = (schema, options) => {
  schema.add({
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  });

  schema.add({
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  });

  if (options && options.index) {
    schema.path('createdBy').index(true);
    schema.path('updatedBy').index(true);
  }
};
