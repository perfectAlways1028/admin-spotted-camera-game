'use strict';

var gulp     = require('gulp');
var jshint   = require('gulp-jshint');
var gpuglint = require('gulp-pug-lint');
var argv     = require('yargs').argv;
var filters  = require('../config/gulp').filters;
var paths    = require('../config/gulp').paths;

gulp.task('lint-client', () => {
  return gulp
    .src(paths.clientJs + filters.jsDeep)
    .pipe(jshint(paths.clientJs + '.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('lint-views', () => {
  return gulp
    .src([
      paths.clientViews + filters.pugDeep,
      paths.serverViews + filters.pugDeep
    ])
    .pipe(gpuglint());
});

gulp.task('lint-server', () => {
  return gulp
    .src([
      paths.config + filters.jsDeep,
      paths.tasks + filters.jsDeep,
      paths.server + filters.jsDeep
    ])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('lint-test', () => {
  var scanPaths;
  if (argv.filter) {
    scanPaths = argv.filter;
  } else {
    scanPaths = paths.test + filters.jsDeep;
  }

  return gulp
    .src(scanPaths)
    .pipe(jshint(paths.test + '.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('lint', ['lint-client', 'lint-server', 'lint-test', 'lint-views']);
