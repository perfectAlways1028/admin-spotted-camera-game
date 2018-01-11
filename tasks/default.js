'use strict';

var gulp = require('gulp');

gulp.task('build', ['build-vendor-src', 'build-app-src']);
gulp.task('default', ['browser-sync', 'nodemon', 'watch']);
