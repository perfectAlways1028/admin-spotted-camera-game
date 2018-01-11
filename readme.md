# spotted game admin
This is a document assembly program written in MEAN stack.


### Used packages
 - Backend - `express`
 - Frontend - `angular v1.x`
 - CSS preprocessor - `styl`
 - CSS framework - `boostrap`
 - View engine - `pug`
 - Database - `mongodb`
 - Promises - `bluebird`
 - Task runner - `gulp`
 - JS linter - `jshint`
 - Testing - `mocha`, `should`, `supertest`, `sinon`
 - Logger - `winston, express-winston`


### How to use
1. Clone this repository.
2. Install gulp and bower globally: `npm i -g gulp bower`
3. Install server and client dependencies: `npm i && bower i`
4. Configure database (`config/environment/development.json`, `db` field)
5. Seed db: `npm run db:seed`
6. Build frontend: `npm run build`
7. Start the server: `npm start`
8. Open in the browser `http://localhost:3001`


### Commands

```sh
# Install dependencies
$ npm i
# Run seeder scripts:
$ npm run db:seed
# Build frontend:
$ npm run build # build development version
$ npm run build:production # build production version
# Run tests (one of the commands):
$ gulp test # run all tests
$ gulp test --grep 'test-name'
$ gulp test --filter 'path to test file/folder'
# Run code coverage tool:
$ gulp coverage
# Run jshint tool (one of the commands):
$ gulp lint # check all sources
$ gulp lint --filter 'path to source file/folder'
$ gulp lint-server # check server sources
$ gulp lint-test # check test sources
# Start app and watch for changes:
$ npm start
```

### Service structure
- [config] - app configuration options
- [client]
  - [app]
    - [controllers]
    - [directives]
    - [resources]
    - [util]
  - [css]
  - [images]
  - [views]
- [server]
  - [controllers] - controllers
  - [db] - database manager and models
  - [data-services] - local data services
  - [routes] - API end points
  - [services] - remote service wrappers
  - [util]
    - [validation-util] - validation utils
    - [logger] - app logger
- [tasks] - gulp tasks
- [test] - unit and functional tests

### License
Proprietary.  All rights reserved.

### Authors
**Ding** ([redflame1028@gmail.com](mailto:redflame1028@gmail.com))
