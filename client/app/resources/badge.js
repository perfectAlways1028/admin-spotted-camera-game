'use strict';

angular.module('app').factory('Badge', function($resource) {
  return $resource('/api/v1/badges/:id',
    { id: '@_id' },
    {
      delete: {
        method: 'DELETE'
      },
      update: {
        method: 'PUT',
        headers: {
            'Content-Type': undefined
        },
        transformRequest: function(data) {
          console.log(data);
          if (data === undefined)
            return data;

          var fd = new FormData();
          angular.forEach(data, function(value, key) {
            if (value instanceof FileList) {
              if (value.length == 1) {
                fd.append(key, value[0]);

              } else {
                angular.forEach(value, function(file, index) {
                  fd.append(key + '_' + index, file);
                  });
              }
            } else {
              fd.append(key, value);
            }
          });

        return fd;
        }
      },
      save: {
        method: 'POST',
        headers: {
            'Content-Type': undefined
        },
        transformRequest: function(data) {
          console.log(data);
          if (data === undefined)
            return data;

          var fd = new FormData();
          angular.forEach(data, function(value, key) {
            if (value instanceof FileList) {
              if (value.length == 1) {
                fd.append(key, value[0]);

              } else {
                angular.forEach(value, function(file, index) {
                  fd.append(key + '_' + index, file);
                  });
              }
            } else {
              fd.append(key, value);
            }
          });

        return fd;
        }

        
      }    
    });
});
