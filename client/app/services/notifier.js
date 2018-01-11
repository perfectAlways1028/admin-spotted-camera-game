'use strict';

angular.module('app').value('Toastr', toastr);

angular.module('app').factory('Notifier', function(Toastr) {
  return {
    success: function(msg) {
      Toastr.success(msg);
    },
    info: function(msg) {
      Toastr.info(msg);
    },
    warning: function(err, prefix) {
      Toastr.warning(_getErrorMessage(err, prefix));
    },
    error: function(err, prefix) {
      Toastr.error(_getErrorMessage(err, prefix));
    },
  };

  function _getErrorMessage(err, prefix) {
    var msg;
    if (typeof err === 'string') {
      msg = err;
    } else if (err) {
      msg = _.get(err, 'data.reason') || err.reason || err.message;
    }
    msg = msg || 'Unknown server error';

    if (prefix) {
      prefix = prefix + (_.endsWith(prefix, '.') ? ' ' : '. ');
      if (msg) {
        prefix += '<br/>';
      }
    } else {
      prefix = '';
    }

    return prefix + msg;
  }
});
