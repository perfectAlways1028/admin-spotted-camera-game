'use strict';

var gulp   = require('gulp');
var config = require('../config/gulp').watcher;

gulp.task('watch', cb => {
  config.watchers.forEach(watcher => {
    gulp.watch(watcher.src, watcher.tasks);
  });
  cb();
});
