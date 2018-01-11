'use strict';

var gulp           = require('gulp');
var gif            = require('gulp-if');
var gsize          = require('gulp-size');
var gconcat        = require('gulp-concat');
var gorder         = require('gulp-order');
var gsourcemaps    = require('gulp-sourcemaps');
var guglify        = require('gulp-uglify');
var gminifyCss     = require('gulp-minify-css');
var mainBowerFiles = require('main-bower-files');
var args           = require('../config/gulp').args;
var paths          = require('../config/gulp').paths;
var filters        = require('../config/gulp').filters;

gulp.task('build-vendor-js', () => {
  return gulp
    .src(mainBowerFiles(filters.jsDeep))
    .pipe(gsourcemaps.init())
    .pipe(gorder([
      'jquery.js',
      'bootstrap.js',
      'toastr.js',
      'moment.js',
      'lodash.js',
      'angular.js',
      'angular*.js',
      'ui-bootstrap*.js',
      'rangy-core.js',
      'rangy*.js',
      'textAngular-rangy.min.js',
      'textAngularSetup.js',
      'textAngular-sanitize.js',
      '*'
    ]))
    .pipe(gif(args.isProduction, guglify({ mangle: false })))
    .pipe(gconcat('vendor.js'))
    .pipe(gsourcemaps.write('map'))
    .pipe(gsize({
      title: 'vendor.js'
    }))
    .pipe(gulp.dest(paths.distJs));
});

gulp.task('build-vendor-css', () => {
  return gulp
    .src(mainBowerFiles(filters.cssDeep))
    .pipe(gif(args.isNotProduction, gsourcemaps.init()))
    .pipe(gorder([
      'bootstrap.css',
      'font-awesome.css',
      '*'
    ]))
    .pipe(gif(args.isProduction, gminifyCss()))
    .pipe(gconcat('vendor.css'))
    .pipe(gif(args.isNotProduction, gsourcemaps.write('map')))
    .pipe(gsize({
      title: 'vendor.css'
    }))
    .pipe(gulp.dest(paths.distCss));
});

gulp.task('build-vendor-fonts', () => {
  return gulp
    .src(mainBowerFiles(filters.fontsDeep))
    .pipe(gsize({
      title: 'vendor.fonts'
    }))
    .pipe(gulp.dest(paths.distFonts));
});

gulp.task('build-vendor-img', () => {
  return gulp
    .src(mainBowerFiles(filters.imagesDeep))
    .pipe(gsize({
      title: 'vendor.images'
    }))
    .pipe(gulp.dest(paths.distImages));
});

gulp.task('build-vendor-src', ['build-vendor-js', 'build-vendor-css', 'build-vendor-fonts', 'build-vendor-img']);
