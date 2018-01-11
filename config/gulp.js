'use strict';

var _    = require('lodash');
var argv = require('yargs').argv;

var CONFIG = './config/';
var TASKS  = './tasks/';
var SERVER = './server/';
var TEST   = './test/';
var CLIENT = './client/';
var DIST   = './public/';

var config = {
  args: {
    isNotProduction: argv.production !== true,
    isProduction: argv.production === true
  },

  filters: {
    js: '*.js',
    jsDeep: '**/*.js',
    styl: '*.styl',
    stylDeep: '**/*.styl',
    css: '*.css',
    cssDeep: '**/*.css',
    pug: '*.pug',
    pugDeep: '**/*.pug',
    images: '*.{ico,png,jpg,jpeg,gif,webp,svg}',
    imagesDeep: '**/*.{ico,png,jpg,jpeg,gif,webp,svg}',
    fonts: '*.{eot,svg,ttf,woff,woff2}',
    fontsDeep: '**/*.{eot,svg,ttf,woff,woff2}',
    uploadsDeep: '**/*.{ico,png,jpg,jpeg,gif,webp,svg}'
  },

  paths: {
    config: CONFIG,
    tasks: TASKS,
    server: SERVER,
    serverIndexPageSrc: SERVER + 'views/src/index.html',
    serverViews: SERVER + 'views/',
    changelog: './changelog.md',
    test: TEST,
    client: CLIENT,
    clientJs: CLIENT + 'app/',
    clientCss: CLIENT + 'css/',
    clientViews: CLIENT + 'views/',
    clientImages: CLIENT + 'images/',
    clientUploads: CLIENT + 'uploads/',
    dist: DIST,
    distJs: DIST + 'scripts/',
    distJsLocale: DIST + 'scripts/locale',
    distCss: DIST + 'css/',
    distViews: DIST + 'views/',
    distImages: DIST + 'images/',
    distFonts: DIST + 'fonts/',
    distUploads: DIST + 'uploads/'
  },
  coverage: {
    successPercent: 1
  }
};

var taskConfigs = {
  watcher: {
    watchers: [
      {
        src: [config.paths.clientJs + config.filters.jsDeep],
        tasks: ['build-app-js']
      },
      {
        src: [config.paths.clientCss + config.filters.stylDeep],
        tasks: ['build-app-css']
      },
      {
        src: [
          config.paths.clientViews + config.filters.pugDeep,
          config.paths.serverViews + config.filters.pugDeep
        ],
        tasks: ['build-app-views']
      },
      {
        src: [config.paths.clientImages + config.filters.imagesDeep],
        tasks: ['build-app-img']
      }
    ]
  }
};

_.assign(config, taskConfigs);

module.exports = config;
