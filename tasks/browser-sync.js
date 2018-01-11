'use strict';

var gulp        = require('gulp');
var browserSync = require('browser-sync');
var paths       = require('../config/gulp').paths;

gulp.task('browser-sync', ['nodemon'], () => {
  return browserSync({
    notify: true,
    proxy: 'localhost:3000',
    port: 3001,
    open: false,
    reloadDelay: 500,
    files: [
      paths.dist + '**',
      '!' + paths.dist + '**/*.map',
      paths.server + 'views/**/*.pug'
    ]
  });
});
