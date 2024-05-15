"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2002-2017, University of Colorado Boulder

/**
 * PhET build and deploy server. The server is designed to run on the same host as the production site (phet-server.int.colorado.edu).
 * This file initializes the app and the main process queue.
 *
 * @author Aaron Davis
 * @author Matt Pennington
 */

var constants = require('./constants');
var childProcess = require('child_process'); // eslint-disable-line require-statement-match
var winston = require('./log.js'); // eslint-disable-line require-statement-match
var logRequest = require('./logRequest');
var sendEmail = require('./sendEmail');
var taskWorker = require('./taskWorker');
var async = require('async');
var bodyParser = require('body-parser'); // eslint-disable-line require-statement-match
var express = require('express');
var _ = require('lodash');
var parseArgs = require('minimist'); // eslint-disable-line require-statement-match
var persistentQueue = require('./persistentQueue');
var getStatus = require('./getStatus');

// set this process up with the appropriate permissions, value is in octal
process.umask(2);

/**
 * Handle command line input
 * First 2 args provide info about executables, ignore
 */
var parsedCommandLineOptions = parseArgs(process.argv.slice(2), {
  "boolean": true
});
var defaultOptions = {
  verbose: constants.BUILD_SERVER_CONFIG.verbose,
  // can be overridden by a flag on the command line

  // options for supporting help
  help: false,
  h: false
};
for (var key in parsedCommandLineOptions) {
  if (key !== '_' && parsedCommandLineOptions.hasOwnProperty(key) && !defaultOptions.hasOwnProperty(key)) {
    console.error("Unrecognized option: ".concat(key));
    console.error('try --help for usage information.');
    process.exit(1);
  }
}

// If help flag, print help and usage info
if (parsedCommandLineOptions.hasOwnProperty('help') || parsedCommandLineOptions.hasOwnProperty('h')) {
  console.log('Usage:');
  console.log('  node build-server.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help (print usage and exit)\n' + '    type: bool  default: false\n' + '  --verbose (output grunt logs in addition to build-server)\n' + '    type: bool  default: false\n');
  process.exit(1);
}

// Merge the default and supplied options.
var options = _.assignIn(defaultOptions, parsedCommandLineOptions);
var verbose = options.verbose;
var taskQueue = async.queue(taskWorker, 1); // 1 is the max number of tasks that can run concurrently

/**
 * Handle chipper 1.0 requests
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {String} key - one of 'query' or 'body', used to differentiate query parameters or POST data.
 */
var queueDeployApiVersion1 = function queueDeployApiVersion1(req, res, key) {
  var repos = JSON.parse(decodeURIComponent(req[key][constants.REPOS_KEY]));
  var simName = decodeURIComponent(req[key][constants.SIM_NAME_KEY]);
  var version = decodeURIComponent(req[key][constants.VERSION_KEY]);
  var locales = decodeURIComponent(req[key][constants.LOCALES_KEY]) || null;
  var option = decodeURIComponent(req[key][constants.OPTION_KEY]) || 'default';
  var email = decodeURIComponent(req[key][constants.EMAIL_KEY]) || null;
  var translatorId = decodeURIComponent(req[key][constants.USER_ID_KEY]) || null;
  var authorizationKey = decodeURIComponent(req[key][constants.AUTHORIZATION_KEY]);
  var branch = decodeURIComponent(req[key][constants.BRANCH_KEY]) || repos[simName].branch;

  // TODO https://github.com/phetsims/perennial/issues/167 determine if this comment needs updating for chipper 1.0 deploys
  // For RC deploys, only send to the dev server.  For production deploys, the local build will send to the dev server so the build-server
  // only sends to the production server (phet-server2).
  var servers = option === 'rc' ? [constants.DEV_SERVER] : [constants.PRODUCTION_SERVER];
  var brands = version.indexOf('phetio') < 0 ? [constants.PHET_BRAND] : [constants.PHET_IO_BRAND];
  queueDeploy('1.0', repos, simName, version, locales, brands, servers, email, translatorId, branch, authorizationKey, req, res);
};
var getQueueDeploy = function getQueueDeploy(req, res) {
  logRequest(req, 'query', winston);
  queueDeployApiVersion1(req, res, 'query');
};
var postQueueDeploy = function postQueueDeploy(req, res) {
  logRequest(req, 'body', winston);
  var api = decodeURIComponent(req.body[constants.API_KEY]);
  if (api && api.startsWith('2.')) {
    var repos = JSON.parse(req.body[constants.DEPENDENCIES_KEY]);
    var simName = req.body[constants.SIM_NAME_KEY];
    var version = req.body[constants.VERSION_KEY];
    var locales = req.body[constants.LOCALES_KEY] || null;
    var servers = req.body[constants.SERVERS_KEY];
    var brands = req.body[constants.BRANDS_KEY];
    var authorizationKey = req.body[constants.AUTHORIZATION_KEY];
    var translatorId = req.body[constants.TRANSLATOR_ID_KEY] || null;
    var email = req.body[constants.EMAIL_KEY] || null;
    var branch = req.body[constants.BRANCH_KEY] || null;
    queueDeploy(api, repos, simName, version, locales, brands, servers, email, translatorId, branch, authorizationKey, req, res);
  } else {
    queueDeployApiVersion1(req, res, 'body');
  }
};

/**
 * Adds the request to the processing queue and handles email notifications about success or failures
 *
 * @param {String} api
 * @param {Object} repos
 * @param {String} simName
 * @param {String} version
 * @param {Array.<String>} locales
 * @param {Array.<String>} brands
 * @param {Array.<String>} servers
 * @param {String} email
 * @param {String} userId
 * @param {String} branch
 * @param {String} authorizationKey
 * @param {express.Request} req
 * @param {express.Response} res
 */
var queueDeploy = function queueDeploy(api, repos, simName, version, locales, brands, servers, email, userId, branch, authorizationKey, req, res) {
  if (repos && simName && version && authorizationKey) {
    var productionBrands = [constants.PHET_BRAND, constants.PHET_IO_BRAND];
    if (authorizationKey !== constants.BUILD_SERVER_CONFIG.buildServerAuthorizationCode) {
      var err = 'wrong authorization code';
      winston.log('error', err);
      res.status(401);
      res.send(err);
    } else if (servers.indexOf(constants.PRODUCTION_SERVER) >= 0 && brands.some(function (brand) {
      return !productionBrands.includes(brand);
    })) {
      var _err = 'Cannot complete production deploys for brands outside of phet and phet-io';
      winston.log('error', _err);
      res.status(400);
      res.send(_err);
    } else {
      winston.log('info', "queuing build for ".concat(simName, " ").concat(version));
      var task = {
        api: api,
        repos: repos,
        simName: simName,
        version: version,
        locales: locales,
        servers: servers,
        brands: brands,
        email: email,
        userId: userId,
        branch: branch
      };
      persistentQueue.addTask(task);
      taskQueue.push(task, buildCallback(task));
      res.status(api === '1.0' ? 200 : 202);
      res.send('build process initiated, check logs for details');
    }
  } else {
    var errorString = 'missing one or more required query parameters: dependencies, simName, version, authorizationCode';
    winston.log('error', errorString);
    res.status(400);
    res.send(errorString);
  }
};
var buildCallback = function buildCallback(task) {
  return function (err) {
    var simInfoString = "Sim = ".concat(task.simName, " Version = ").concat(task.version, " Brands = ").concat(task.brands, " Locales = ").concat(task.locales);
    if (err) {
      var shas = task.repos;

      // try to format the JSON nicely for the email, but don't worry if it is invalid JSON
      try {
        shas = JSON.stringify(JSON.parse(shas), null, 2);
      } catch (e) {
        // invalid JSON
      }
      var errorMessage = "Build failure: ".concat(err, ". ").concat(simInfoString, " Shas = ").concat(JSON.stringify(shas));
      winston.log('error', errorMessage);
      sendEmail('BUILD ERROR', errorMessage, task.email);
    } else {
      winston.log('info', "build for ".concat(task.simName, " finished successfully"));
      persistentQueue.finishTask();
      sendEmail('Build Succeeded', simInfoString, task.email, true);
    }
  };
};
var postQueueImageDeploy = function postQueueImageDeploy(req, res) {
  logRequest(req, 'body', winston);
  var authorizationKey = req.body[constants.AUTHORIZATION_KEY];
  if (authorizationKey !== constants.BUILD_SERVER_CONFIG.buildServerAuthorizationCode) {
    var err = 'wrong authorization code';
    winston.log('error', err);
    res.status(401);
    res.send(err);
    return;
  }
  var branch = req.body[constants.BRANCH_KEY] || 'main';
  var brands = req.body[constants.BRANDS_KEY] || 'phet';
  var email = req.body[constants.EMAIL_KEY] || null;
  var simulation = req.body[constants.SIM_NAME_KEY] || null;
  var version = req.body[constants.VERSION_KEY] || null;
  var emailBodyText = 'Not implemented';
  taskQueue.push({
    deployImages: true,
    branch: branch,
    brands: brands,
    simulation: simulation,
    version: version
  }, function (err) {
    if (err) {
      var errorMessage = "Image deploy failure: ".concat(err);
      winston.log('error', errorMessage);
      sendEmail('IMAGE DEPLOY ERROR', errorMessage, email);
    } else {
      winston.log('info', 'Image deploy finished successfully');
      sendEmail('Image deploy succeeded', emailBodyText, email, true);
    }
  });
  res.status(202);
  res.send('build process initiated, check logs for details');
};

// Create the ExpressJS app
var app = express();

// to support JSON-encoded bodies
app.use(bodyParser.json());

// add the route to build and deploy
app.get('/deploy-html-simulation', getQueueDeploy);
app.post('/deploy-html-simulation', postQueueDeploy);
app.post('/deploy-images', postQueueImageDeploy);
app.set('views', './views');
app.set('view engine', 'pug');
app.get('/deploy-status', getStatus);

// start the server
app.listen(constants.LISTEN_PORT, function () {
  winston.log('info', "Listening on port ".concat(constants.LISTEN_PORT));
  winston.log('info', "Verbose mode: ".concat(verbose));

  // log the SHA of perennial - this may make it easier to duplicate and track down problems
  try {
    var sha = childProcess.execSync('git rev-parse HEAD');
    winston.info("current SHA: ".concat(sha.toString()));
  } catch (err) {
    winston.warn("unable to get SHA from git, err: ".concat(err));
  }

  // Recreate queue
  try {
    var queue = persistentQueue.getQueue().queue;
    var _iterator = _createForOfIteratorHelper(queue),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var task = _step.value;
        console.log('Resuming task from persistent queue: ', task);
        taskQueue.push(task, buildCallback(task));
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } catch (e) {
    console.error('could not resume queue');
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25zdGFudHMiLCJyZXF1aXJlIiwiY2hpbGRQcm9jZXNzIiwid2luc3RvbiIsImxvZ1JlcXVlc3QiLCJzZW5kRW1haWwiLCJ0YXNrV29ya2VyIiwiYXN5bmMiLCJib2R5UGFyc2VyIiwiZXhwcmVzcyIsIl8iLCJwYXJzZUFyZ3MiLCJwZXJzaXN0ZW50UXVldWUiLCJnZXRTdGF0dXMiLCJwcm9jZXNzIiwidW1hc2siLCJwYXJzZWRDb21tYW5kTGluZU9wdGlvbnMiLCJhcmd2Iiwic2xpY2UiLCJkZWZhdWx0T3B0aW9ucyIsInZlcmJvc2UiLCJCVUlMRF9TRVJWRVJfQ09ORklHIiwiaGVscCIsImgiLCJrZXkiLCJoYXNPd25Qcm9wZXJ0eSIsImNvbnNvbGUiLCJlcnJvciIsImNvbmNhdCIsImV4aXQiLCJsb2ciLCJvcHRpb25zIiwiYXNzaWduSW4iLCJ0YXNrUXVldWUiLCJxdWV1ZSIsInF1ZXVlRGVwbG95QXBpVmVyc2lvbjEiLCJyZXEiLCJyZXMiLCJyZXBvcyIsIkpTT04iLCJwYXJzZSIsImRlY29kZVVSSUNvbXBvbmVudCIsIlJFUE9TX0tFWSIsInNpbU5hbWUiLCJTSU1fTkFNRV9LRVkiLCJ2ZXJzaW9uIiwiVkVSU0lPTl9LRVkiLCJsb2NhbGVzIiwiTE9DQUxFU19LRVkiLCJvcHRpb24iLCJPUFRJT05fS0VZIiwiZW1haWwiLCJFTUFJTF9LRVkiLCJ0cmFuc2xhdG9ySWQiLCJVU0VSX0lEX0tFWSIsImF1dGhvcml6YXRpb25LZXkiLCJBVVRIT1JJWkFUSU9OX0tFWSIsImJyYW5jaCIsIkJSQU5DSF9LRVkiLCJzZXJ2ZXJzIiwiREVWX1NFUlZFUiIsIlBST0RVQ1RJT05fU0VSVkVSIiwiYnJhbmRzIiwiaW5kZXhPZiIsIlBIRVRfQlJBTkQiLCJQSEVUX0lPX0JSQU5EIiwicXVldWVEZXBsb3kiLCJnZXRRdWV1ZURlcGxveSIsInBvc3RRdWV1ZURlcGxveSIsImFwaSIsImJvZHkiLCJBUElfS0VZIiwic3RhcnRzV2l0aCIsIkRFUEVOREVOQ0lFU19LRVkiLCJTRVJWRVJTX0tFWSIsIkJSQU5EU19LRVkiLCJUUkFOU0xBVE9SX0lEX0tFWSIsInVzZXJJZCIsInByb2R1Y3Rpb25CcmFuZHMiLCJidWlsZFNlcnZlckF1dGhvcml6YXRpb25Db2RlIiwiZXJyIiwic3RhdHVzIiwic2VuZCIsInNvbWUiLCJicmFuZCIsImluY2x1ZGVzIiwidGFzayIsImFkZFRhc2siLCJwdXNoIiwiYnVpbGRDYWxsYmFjayIsImVycm9yU3RyaW5nIiwic2ltSW5mb1N0cmluZyIsInNoYXMiLCJzdHJpbmdpZnkiLCJlIiwiZXJyb3JNZXNzYWdlIiwiZmluaXNoVGFzayIsInBvc3RRdWV1ZUltYWdlRGVwbG95Iiwic2ltdWxhdGlvbiIsImVtYWlsQm9keVRleHQiLCJkZXBsb3lJbWFnZXMiLCJhcHAiLCJ1c2UiLCJqc29uIiwiZ2V0IiwicG9zdCIsInNldCIsImxpc3RlbiIsIkxJU1RFTl9QT1JUIiwic2hhIiwiZXhlY1N5bmMiLCJpbmZvIiwidG9TdHJpbmciLCJ3YXJuIiwiZ2V0UXVldWUiLCJfaXRlcmF0b3IiLCJfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlciIsIl9zdGVwIiwicyIsIm4iLCJkb25lIiwidmFsdWUiLCJmIl0sInNvdXJjZXMiOlsiYnVpbGQtc2VydmVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDAyLTIwMTcsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFBoRVQgYnVpbGQgYW5kIGRlcGxveSBzZXJ2ZXIuIFRoZSBzZXJ2ZXIgaXMgZGVzaWduZWQgdG8gcnVuIG9uIHRoZSBzYW1lIGhvc3QgYXMgdGhlIHByb2R1Y3Rpb24gc2l0ZSAocGhldC1zZXJ2ZXIuaW50LmNvbG9yYWRvLmVkdSkuXHJcbiAqIFRoaXMgZmlsZSBpbml0aWFsaXplcyB0aGUgYXBwIGFuZCB0aGUgbWFpbiBwcm9jZXNzIHF1ZXVlLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEFhcm9uIERhdmlzXHJcbiAqIEBhdXRob3IgTWF0dCBQZW5uaW5ndG9uXHJcbiAqL1xyXG5cclxuXHJcbmNvbnN0IGNvbnN0YW50cyA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKTtcclxuY29uc3QgY2hpbGRQcm9jZXNzID0gcmVxdWlyZSggJ2NoaWxkX3Byb2Nlc3MnICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcmVxdWlyZS1zdGF0ZW1lbnQtbWF0Y2hcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICcuL2xvZy5qcycgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSByZXF1aXJlLXN0YXRlbWVudC1tYXRjaFxyXG5jb25zdCBsb2dSZXF1ZXN0ID0gcmVxdWlyZSggJy4vbG9nUmVxdWVzdCcgKTtcclxuY29uc3Qgc2VuZEVtYWlsID0gcmVxdWlyZSggJy4vc2VuZEVtYWlsJyApO1xyXG5jb25zdCB0YXNrV29ya2VyID0gcmVxdWlyZSggJy4vdGFza1dvcmtlcicgKTtcclxuY29uc3QgYXN5bmMgPSByZXF1aXJlKCAnYXN5bmMnICk7XHJcbmNvbnN0IGJvZHlQYXJzZXIgPSByZXF1aXJlKCAnYm9keS1wYXJzZXInICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcmVxdWlyZS1zdGF0ZW1lbnQtbWF0Y2hcclxuY29uc3QgZXhwcmVzcyA9IHJlcXVpcmUoICdleHByZXNzJyApO1xyXG5jb25zdCBfID0gcmVxdWlyZSggJ2xvZGFzaCcgKTtcclxuY29uc3QgcGFyc2VBcmdzID0gcmVxdWlyZSggJ21pbmltaXN0JyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtc3RhdGVtZW50LW1hdGNoXHJcbmNvbnN0IHBlcnNpc3RlbnRRdWV1ZSA9IHJlcXVpcmUoICcuL3BlcnNpc3RlbnRRdWV1ZScgKTtcclxuY29uc3QgZ2V0U3RhdHVzID0gcmVxdWlyZSggJy4vZ2V0U3RhdHVzJyApO1xyXG5cclxuLy8gc2V0IHRoaXMgcHJvY2VzcyB1cCB3aXRoIHRoZSBhcHByb3ByaWF0ZSBwZXJtaXNzaW9ucywgdmFsdWUgaXMgaW4gb2N0YWxcclxucHJvY2Vzcy51bWFzayggMG8wMDAyICk7XHJcblxyXG4vKipcclxuICogSGFuZGxlIGNvbW1hbmQgbGluZSBpbnB1dFxyXG4gKiBGaXJzdCAyIGFyZ3MgcHJvdmlkZSBpbmZvIGFib3V0IGV4ZWN1dGFibGVzLCBpZ25vcmVcclxuICovXHJcbmNvbnN0IHBhcnNlZENvbW1hbmRMaW5lT3B0aW9ucyA9IHBhcnNlQXJncyggcHJvY2Vzcy5hcmd2LnNsaWNlKCAyICksIHtcclxuICBib29sZWFuOiB0cnVlXHJcbn0gKTtcclxuXHJcbmNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xyXG4gIHZlcmJvc2U6IGNvbnN0YW50cy5CVUlMRF9TRVJWRVJfQ09ORklHLnZlcmJvc2UsIC8vIGNhbiBiZSBvdmVycmlkZGVuIGJ5IGEgZmxhZyBvbiB0aGUgY29tbWFuZCBsaW5lXHJcblxyXG4gIC8vIG9wdGlvbnMgZm9yIHN1cHBvcnRpbmcgaGVscFxyXG4gIGhlbHA6IGZhbHNlLFxyXG4gIGg6IGZhbHNlXHJcbn07XHJcblxyXG5mb3IgKCBjb25zdCBrZXkgaW4gcGFyc2VkQ29tbWFuZExpbmVPcHRpb25zICkge1xyXG4gIGlmICgga2V5ICE9PSAnXycgJiYgcGFyc2VkQ29tbWFuZExpbmVPcHRpb25zLmhhc093blByb3BlcnR5KCBrZXkgKSAmJiAhZGVmYXVsdE9wdGlvbnMuaGFzT3duUHJvcGVydHkoIGtleSApICkge1xyXG4gICAgY29uc29sZS5lcnJvciggYFVucmVjb2duaXplZCBvcHRpb246ICR7a2V5fWAgKTtcclxuICAgIGNvbnNvbGUuZXJyb3IoICd0cnkgLS1oZWxwIGZvciB1c2FnZSBpbmZvcm1hdGlvbi4nICk7XHJcbiAgICBwcm9jZXNzLmV4aXQoIDEgKTtcclxuICB9XHJcbn1cclxuXHJcbi8vIElmIGhlbHAgZmxhZywgcHJpbnQgaGVscCBhbmQgdXNhZ2UgaW5mb1xyXG5pZiAoIHBhcnNlZENvbW1hbmRMaW5lT3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSggJ2hlbHAnICkgfHwgcGFyc2VkQ29tbWFuZExpbmVPcHRpb25zLmhhc093blByb3BlcnR5KCAnaCcgKSApIHtcclxuICBjb25zb2xlLmxvZyggJ1VzYWdlOicgKTtcclxuICBjb25zb2xlLmxvZyggJyAgbm9kZSBidWlsZC1zZXJ2ZXIuanMgW29wdGlvbnNdJyApO1xyXG4gIGNvbnNvbGUubG9nKCAnJyApO1xyXG4gIGNvbnNvbGUubG9nKCAnT3B0aW9uczonICk7XHJcbiAgY29uc29sZS5sb2coXHJcbiAgICAnICAtLWhlbHAgKHByaW50IHVzYWdlIGFuZCBleGl0KVxcbicgK1xyXG4gICAgJyAgICB0eXBlOiBib29sICBkZWZhdWx0OiBmYWxzZVxcbicgK1xyXG4gICAgJyAgLS12ZXJib3NlIChvdXRwdXQgZ3J1bnQgbG9ncyBpbiBhZGRpdGlvbiB0byBidWlsZC1zZXJ2ZXIpXFxuJyArXHJcbiAgICAnICAgIHR5cGU6IGJvb2wgIGRlZmF1bHQ6IGZhbHNlXFxuJ1xyXG4gICk7XHJcbiAgcHJvY2Vzcy5leGl0KCAxICk7XHJcbn1cclxuXHJcbi8vIE1lcmdlIHRoZSBkZWZhdWx0IGFuZCBzdXBwbGllZCBvcHRpb25zLlxyXG5jb25zdCBvcHRpb25zID0gXy5hc3NpZ25JbiggZGVmYXVsdE9wdGlvbnMsIHBhcnNlZENvbW1hbmRMaW5lT3B0aW9ucyApO1xyXG5jb25zdCB2ZXJib3NlID0gb3B0aW9ucy52ZXJib3NlO1xyXG5cclxuY29uc3QgdGFza1F1ZXVlID0gYXN5bmMucXVldWUoIHRhc2tXb3JrZXIsIDEgKTsgLy8gMSBpcyB0aGUgbWF4IG51bWJlciBvZiB0YXNrcyB0aGF0IGNhbiBydW4gY29uY3VycmVudGx5XHJcblxyXG4vKipcclxuICogSGFuZGxlIGNoaXBwZXIgMS4wIHJlcXVlc3RzXHJcbiAqXHJcbiAqIEBwYXJhbSB7ZXhwcmVzcy5SZXF1ZXN0fSByZXFcclxuICogQHBhcmFtIHtleHByZXNzLlJlc3BvbnNlfSByZXNcclxuICogQHBhcmFtIHtTdHJpbmd9IGtleSAtIG9uZSBvZiAncXVlcnknIG9yICdib2R5JywgdXNlZCB0byBkaWZmZXJlbnRpYXRlIHF1ZXJ5IHBhcmFtZXRlcnMgb3IgUE9TVCBkYXRhLlxyXG4gKi9cclxuY29uc3QgcXVldWVEZXBsb3lBcGlWZXJzaW9uMSA9ICggcmVxLCByZXMsIGtleSApID0+IHtcclxuICBjb25zdCByZXBvcyA9IEpTT04ucGFyc2UoIGRlY29kZVVSSUNvbXBvbmVudCggcmVxWyBrZXkgXVsgY29uc3RhbnRzLlJFUE9TX0tFWSBdICkgKTtcclxuICBjb25zdCBzaW1OYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KCByZXFbIGtleSBdWyBjb25zdGFudHMuU0lNX05BTUVfS0VZIF0gKTtcclxuICBjb25zdCB2ZXJzaW9uID0gZGVjb2RlVVJJQ29tcG9uZW50KCByZXFbIGtleSBdWyBjb25zdGFudHMuVkVSU0lPTl9LRVkgXSApO1xyXG4gIGNvbnN0IGxvY2FsZXMgPSBkZWNvZGVVUklDb21wb25lbnQoIHJlcVsga2V5IF1bIGNvbnN0YW50cy5MT0NBTEVTX0tFWSBdICkgfHwgbnVsbDtcclxuICBjb25zdCBvcHRpb24gPSBkZWNvZGVVUklDb21wb25lbnQoIHJlcVsga2V5IF1bIGNvbnN0YW50cy5PUFRJT05fS0VZIF0gKSB8fCAnZGVmYXVsdCc7XHJcbiAgY29uc3QgZW1haWwgPSBkZWNvZGVVUklDb21wb25lbnQoIHJlcVsga2V5IF1bIGNvbnN0YW50cy5FTUFJTF9LRVkgXSApIHx8IG51bGw7XHJcbiAgY29uc3QgdHJhbnNsYXRvcklkID0gZGVjb2RlVVJJQ29tcG9uZW50KCByZXFbIGtleSBdWyBjb25zdGFudHMuVVNFUl9JRF9LRVkgXSApIHx8IG51bGw7XHJcbiAgY29uc3QgYXV0aG9yaXphdGlvbktleSA9IGRlY29kZVVSSUNvbXBvbmVudCggcmVxWyBrZXkgXVsgY29uc3RhbnRzLkFVVEhPUklaQVRJT05fS0VZIF0gKTtcclxuICBjb25zdCBicmFuY2ggPSBkZWNvZGVVUklDb21wb25lbnQoIHJlcVsga2V5IF1bIGNvbnN0YW50cy5CUkFOQ0hfS0VZIF0gKSB8fCByZXBvc1sgc2ltTmFtZSBdLmJyYW5jaDtcclxuXHJcbiAgLy8gVE9ETyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGVyZW5uaWFsL2lzc3Vlcy8xNjcgZGV0ZXJtaW5lIGlmIHRoaXMgY29tbWVudCBuZWVkcyB1cGRhdGluZyBmb3IgY2hpcHBlciAxLjAgZGVwbG95c1xyXG4gIC8vIEZvciBSQyBkZXBsb3lzLCBvbmx5IHNlbmQgdG8gdGhlIGRldiBzZXJ2ZXIuICBGb3IgcHJvZHVjdGlvbiBkZXBsb3lzLCB0aGUgbG9jYWwgYnVpbGQgd2lsbCBzZW5kIHRvIHRoZSBkZXYgc2VydmVyIHNvIHRoZSBidWlsZC1zZXJ2ZXJcclxuICAvLyBvbmx5IHNlbmRzIHRvIHRoZSBwcm9kdWN0aW9uIHNlcnZlciAocGhldC1zZXJ2ZXIyKS5cclxuICBjb25zdCBzZXJ2ZXJzID0gKCBvcHRpb24gPT09ICdyYycgKSA/IFsgY29uc3RhbnRzLkRFVl9TRVJWRVIgXSA6IFsgY29uc3RhbnRzLlBST0RVQ1RJT05fU0VSVkVSIF07XHJcbiAgY29uc3QgYnJhbmRzID0gdmVyc2lvbi5pbmRleE9mKCAncGhldGlvJyApIDwgMCA/IFsgY29uc3RhbnRzLlBIRVRfQlJBTkQgXSA6IFsgY29uc3RhbnRzLlBIRVRfSU9fQlJBTkQgXTtcclxuXHJcbiAgcXVldWVEZXBsb3koICcxLjAnLCByZXBvcywgc2ltTmFtZSwgdmVyc2lvbiwgbG9jYWxlcywgYnJhbmRzLCBzZXJ2ZXJzLCBlbWFpbCwgdHJhbnNsYXRvcklkLCBicmFuY2gsIGF1dGhvcml6YXRpb25LZXksIHJlcSwgcmVzICk7XHJcbn07XHJcblxyXG5jb25zdCBnZXRRdWV1ZURlcGxveSA9ICggcmVxLCByZXMgKSA9PiB7XHJcbiAgbG9nUmVxdWVzdCggcmVxLCAncXVlcnknLCB3aW5zdG9uICk7XHJcbiAgcXVldWVEZXBsb3lBcGlWZXJzaW9uMSggcmVxLCByZXMsICdxdWVyeScgKTtcclxufTtcclxuXHJcbmNvbnN0IHBvc3RRdWV1ZURlcGxveSA9ICggcmVxLCByZXMgKSA9PiB7XHJcbiAgbG9nUmVxdWVzdCggcmVxLCAnYm9keScsIHdpbnN0b24gKTtcclxuXHJcbiAgY29uc3QgYXBpID0gZGVjb2RlVVJJQ29tcG9uZW50KCByZXEuYm9keVsgY29uc3RhbnRzLkFQSV9LRVkgXSApO1xyXG5cclxuICBpZiAoIGFwaSAmJiBhcGkuc3RhcnRzV2l0aCggJzIuJyApICkge1xyXG4gICAgY29uc3QgcmVwb3MgPSBKU09OLnBhcnNlKCByZXEuYm9keVsgY29uc3RhbnRzLkRFUEVOREVOQ0lFU19LRVkgXSApO1xyXG4gICAgY29uc3Qgc2ltTmFtZSA9IHJlcS5ib2R5WyBjb25zdGFudHMuU0lNX05BTUVfS0VZIF07XHJcbiAgICBjb25zdCB2ZXJzaW9uID0gcmVxLmJvZHlbIGNvbnN0YW50cy5WRVJTSU9OX0tFWSBdO1xyXG4gICAgY29uc3QgbG9jYWxlcyA9IHJlcS5ib2R5WyBjb25zdGFudHMuTE9DQUxFU19LRVkgXSB8fCBudWxsO1xyXG4gICAgY29uc3Qgc2VydmVycyA9IHJlcS5ib2R5WyBjb25zdGFudHMuU0VSVkVSU19LRVkgXTtcclxuICAgIGNvbnN0IGJyYW5kcyA9IHJlcS5ib2R5WyBjb25zdGFudHMuQlJBTkRTX0tFWSBdO1xyXG4gICAgY29uc3QgYXV0aG9yaXphdGlvbktleSA9IHJlcS5ib2R5WyBjb25zdGFudHMuQVVUSE9SSVpBVElPTl9LRVkgXTtcclxuICAgIGNvbnN0IHRyYW5zbGF0b3JJZCA9IHJlcS5ib2R5WyBjb25zdGFudHMuVFJBTlNMQVRPUl9JRF9LRVkgXSB8fCBudWxsO1xyXG4gICAgY29uc3QgZW1haWwgPSByZXEuYm9keVsgY29uc3RhbnRzLkVNQUlMX0tFWSBdIHx8IG51bGw7XHJcbiAgICBjb25zdCBicmFuY2ggPSByZXEuYm9keVsgY29uc3RhbnRzLkJSQU5DSF9LRVkgXSB8fCBudWxsO1xyXG5cclxuICAgIHF1ZXVlRGVwbG95KCBhcGksIHJlcG9zLCBzaW1OYW1lLCB2ZXJzaW9uLCBsb2NhbGVzLCBicmFuZHMsIHNlcnZlcnMsIGVtYWlsLCB0cmFuc2xhdG9ySWQsIGJyYW5jaCwgYXV0aG9yaXphdGlvbktleSwgcmVxLCByZXMgKTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBxdWV1ZURlcGxveUFwaVZlcnNpb24xKCByZXEsIHJlcywgJ2JvZHknICk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgdGhlIHJlcXVlc3QgdG8gdGhlIHByb2Nlc3NpbmcgcXVldWUgYW5kIGhhbmRsZXMgZW1haWwgbm90aWZpY2F0aW9ucyBhYm91dCBzdWNjZXNzIG9yIGZhaWx1cmVzXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBhcGlcclxuICogQHBhcmFtIHtPYmplY3R9IHJlcG9zXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzaW1OYW1lXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJzaW9uXHJcbiAqIEBwYXJhbSB7QXJyYXkuPFN0cmluZz59IGxvY2FsZXNcclxuICogQHBhcmFtIHtBcnJheS48U3RyaW5nPn0gYnJhbmRzXHJcbiAqIEBwYXJhbSB7QXJyYXkuPFN0cmluZz59IHNlcnZlcnNcclxuICogQHBhcmFtIHtTdHJpbmd9IGVtYWlsXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VySWRcclxuICogQHBhcmFtIHtTdHJpbmd9IGJyYW5jaFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gYXV0aG9yaXphdGlvbktleVxyXG4gKiBAcGFyYW0ge2V4cHJlc3MuUmVxdWVzdH0gcmVxXHJcbiAqIEBwYXJhbSB7ZXhwcmVzcy5SZXNwb25zZX0gcmVzXHJcbiAqL1xyXG5jb25zdCBxdWV1ZURlcGxveSA9ICggYXBpLCByZXBvcywgc2ltTmFtZSwgdmVyc2lvbiwgbG9jYWxlcywgYnJhbmRzLCBzZXJ2ZXJzLCBlbWFpbCwgdXNlcklkLCBicmFuY2gsIGF1dGhvcml6YXRpb25LZXksIHJlcSwgcmVzICkgPT4ge1xyXG5cclxuICBpZiAoIHJlcG9zICYmIHNpbU5hbWUgJiYgdmVyc2lvbiAmJiBhdXRob3JpemF0aW9uS2V5ICkge1xyXG4gICAgY29uc3QgcHJvZHVjdGlvbkJyYW5kcyA9IFsgY29uc3RhbnRzLlBIRVRfQlJBTkQsIGNvbnN0YW50cy5QSEVUX0lPX0JSQU5EIF07XHJcblxyXG4gICAgaWYgKCBhdXRob3JpemF0aW9uS2V5ICE9PSBjb25zdGFudHMuQlVJTERfU0VSVkVSX0NPTkZJRy5idWlsZFNlcnZlckF1dGhvcml6YXRpb25Db2RlICkge1xyXG4gICAgICBjb25zdCBlcnIgPSAnd3JvbmcgYXV0aG9yaXphdGlvbiBjb2RlJztcclxuICAgICAgd2luc3Rvbi5sb2coICdlcnJvcicsIGVyciApO1xyXG4gICAgICByZXMuc3RhdHVzKCA0MDEgKTtcclxuICAgICAgcmVzLnNlbmQoIGVyciApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHNlcnZlcnMuaW5kZXhPZiggY29uc3RhbnRzLlBST0RVQ1RJT05fU0VSVkVSICkgPj0gMCAmJiBicmFuZHMuc29tZSggYnJhbmQgPT4gIXByb2R1Y3Rpb25CcmFuZHMuaW5jbHVkZXMoIGJyYW5kICkgKSApIHtcclxuICAgICAgY29uc3QgZXJyID0gJ0Nhbm5vdCBjb21wbGV0ZSBwcm9kdWN0aW9uIGRlcGxveXMgZm9yIGJyYW5kcyBvdXRzaWRlIG9mIHBoZXQgYW5kIHBoZXQtaW8nO1xyXG4gICAgICB3aW5zdG9uLmxvZyggJ2Vycm9yJywgZXJyICk7XHJcbiAgICAgIHJlcy5zdGF0dXMoIDQwMCApO1xyXG4gICAgICByZXMuc2VuZCggZXJyICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgd2luc3Rvbi5sb2coICdpbmZvJywgYHF1ZXVpbmcgYnVpbGQgZm9yICR7c2ltTmFtZX0gJHt2ZXJzaW9ufWAgKTtcclxuICAgICAgY29uc3QgdGFzayA9IHtcclxuICAgICAgICBhcGk6IGFwaSxcclxuICAgICAgICByZXBvczogcmVwb3MsXHJcbiAgICAgICAgc2ltTmFtZTogc2ltTmFtZSxcclxuICAgICAgICB2ZXJzaW9uOiB2ZXJzaW9uLFxyXG4gICAgICAgIGxvY2FsZXM6IGxvY2FsZXMsXHJcbiAgICAgICAgc2VydmVyczogc2VydmVycyxcclxuICAgICAgICBicmFuZHM6IGJyYW5kcyxcclxuICAgICAgICBlbWFpbDogZW1haWwsXHJcbiAgICAgICAgdXNlcklkOiB1c2VySWQsXHJcbiAgICAgICAgYnJhbmNoOiBicmFuY2hcclxuICAgICAgfTtcclxuICAgICAgcGVyc2lzdGVudFF1ZXVlLmFkZFRhc2soIHRhc2sgKTtcclxuICAgICAgdGFza1F1ZXVlLnB1c2goIHRhc2ssIGJ1aWxkQ2FsbGJhY2soIHRhc2sgKSApO1xyXG5cclxuICAgICAgcmVzLnN0YXR1cyggYXBpID09PSAnMS4wJyA/IDIwMCA6IDIwMiApO1xyXG4gICAgICByZXMuc2VuZCggJ2J1aWxkIHByb2Nlc3MgaW5pdGlhdGVkLCBjaGVjayBsb2dzIGZvciBkZXRhaWxzJyApO1xyXG4gICAgfVxyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGNvbnN0IGVycm9yU3RyaW5nID0gJ21pc3Npbmcgb25lIG9yIG1vcmUgcmVxdWlyZWQgcXVlcnkgcGFyYW1ldGVyczogZGVwZW5kZW5jaWVzLCBzaW1OYW1lLCB2ZXJzaW9uLCBhdXRob3JpemF0aW9uQ29kZSc7XHJcbiAgICB3aW5zdG9uLmxvZyggJ2Vycm9yJywgZXJyb3JTdHJpbmcgKTtcclxuICAgIHJlcy5zdGF0dXMoIDQwMCApO1xyXG4gICAgcmVzLnNlbmQoIGVycm9yU3RyaW5nICk7XHJcbiAgfVxyXG59O1xyXG5cclxuY29uc3QgYnVpbGRDYWxsYmFjayA9IHRhc2sgPT4ge1xyXG4gIHJldHVybiBlcnIgPT4ge1xyXG4gICAgY29uc3Qgc2ltSW5mb1N0cmluZyA9IGBTaW0gPSAke3Rhc2suc2ltTmFtZVxyXG4gICAgfSBWZXJzaW9uID0gJHt0YXNrLnZlcnNpb25cclxuICAgIH0gQnJhbmRzID0gJHt0YXNrLmJyYW5kc1xyXG4gICAgfSBMb2NhbGVzID0gJHt0YXNrLmxvY2FsZXN9YDtcclxuXHJcbiAgICBpZiAoIGVyciApIHtcclxuICAgICAgbGV0IHNoYXMgPSB0YXNrLnJlcG9zO1xyXG5cclxuICAgICAgLy8gdHJ5IHRvIGZvcm1hdCB0aGUgSlNPTiBuaWNlbHkgZm9yIHRoZSBlbWFpbCwgYnV0IGRvbid0IHdvcnJ5IGlmIGl0IGlzIGludmFsaWQgSlNPTlxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHNoYXMgPSBKU09OLnN0cmluZ2lmeSggSlNPTi5wYXJzZSggc2hhcyApLCBudWxsLCAyICk7XHJcbiAgICAgIH1cclxuICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgLy8gaW52YWxpZCBKU09OXHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gYEJ1aWxkIGZhaWx1cmU6ICR7ZXJyfS4gJHtzaW1JbmZvU3RyaW5nfSBTaGFzID0gJHtKU09OLnN0cmluZ2lmeSggc2hhcyApfWA7XHJcbiAgICAgIHdpbnN0b24ubG9nKCAnZXJyb3InLCBlcnJvck1lc3NhZ2UgKTtcclxuICAgICAgc2VuZEVtYWlsKCAnQlVJTEQgRVJST1InLCBlcnJvck1lc3NhZ2UsIHRhc2suZW1haWwgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB3aW5zdG9uLmxvZyggJ2luZm8nLCBgYnVpbGQgZm9yICR7dGFzay5zaW1OYW1lfSBmaW5pc2hlZCBzdWNjZXNzZnVsbHlgICk7XHJcbiAgICAgIHBlcnNpc3RlbnRRdWV1ZS5maW5pc2hUYXNrKCk7XHJcbiAgICAgIHNlbmRFbWFpbCggJ0J1aWxkIFN1Y2NlZWRlZCcsIHNpbUluZm9TdHJpbmcsIHRhc2suZW1haWwsIHRydWUgKTtcclxuICAgIH1cclxuICB9O1xyXG59O1xyXG5cclxuY29uc3QgcG9zdFF1ZXVlSW1hZ2VEZXBsb3kgPSAoIHJlcSwgcmVzICkgPT4ge1xyXG4gIGxvZ1JlcXVlc3QoIHJlcSwgJ2JvZHknLCB3aW5zdG9uICk7XHJcblxyXG4gIGNvbnN0IGF1dGhvcml6YXRpb25LZXkgPSByZXEuYm9keVsgY29uc3RhbnRzLkFVVEhPUklaQVRJT05fS0VZIF07XHJcbiAgaWYgKCBhdXRob3JpemF0aW9uS2V5ICE9PSBjb25zdGFudHMuQlVJTERfU0VSVkVSX0NPTkZJRy5idWlsZFNlcnZlckF1dGhvcml6YXRpb25Db2RlICkge1xyXG4gICAgY29uc3QgZXJyID0gJ3dyb25nIGF1dGhvcml6YXRpb24gY29kZSc7XHJcbiAgICB3aW5zdG9uLmxvZyggJ2Vycm9yJywgZXJyICk7XHJcbiAgICByZXMuc3RhdHVzKCA0MDEgKTtcclxuICAgIHJlcy5zZW5kKCBlcnIgKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IGJyYW5jaCA9IHJlcS5ib2R5WyBjb25zdGFudHMuQlJBTkNIX0tFWSBdIHx8ICdtYWluJztcclxuICBjb25zdCBicmFuZHMgPSByZXEuYm9keVsgY29uc3RhbnRzLkJSQU5EU19LRVkgXSB8fCAncGhldCc7XHJcbiAgY29uc3QgZW1haWwgPSByZXEuYm9keVsgY29uc3RhbnRzLkVNQUlMX0tFWSBdIHx8IG51bGw7XHJcbiAgY29uc3Qgc2ltdWxhdGlvbiA9IHJlcS5ib2R5WyBjb25zdGFudHMuU0lNX05BTUVfS0VZIF0gfHwgbnVsbDtcclxuICBjb25zdCB2ZXJzaW9uID0gcmVxLmJvZHlbIGNvbnN0YW50cy5WRVJTSU9OX0tFWSBdIHx8IG51bGw7XHJcbiAgY29uc3QgZW1haWxCb2R5VGV4dCA9ICdOb3QgaW1wbGVtZW50ZWQnO1xyXG5cclxuICB0YXNrUXVldWUucHVzaChcclxuICAgIHtcclxuICAgICAgZGVwbG95SW1hZ2VzOiB0cnVlLFxyXG4gICAgICBicmFuY2g6IGJyYW5jaCxcclxuICAgICAgYnJhbmRzOiBicmFuZHMsXHJcbiAgICAgIHNpbXVsYXRpb246IHNpbXVsYXRpb24sXHJcbiAgICAgIHZlcnNpb246IHZlcnNpb25cclxuICAgIH0sXHJcbiAgICBlcnIgPT4ge1xyXG4gICAgICBpZiAoIGVyciApIHtcclxuICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBgSW1hZ2UgZGVwbG95IGZhaWx1cmU6ICR7ZXJyfWA7XHJcbiAgICAgICAgd2luc3Rvbi5sb2coICdlcnJvcicsIGVycm9yTWVzc2FnZSApO1xyXG4gICAgICAgIHNlbmRFbWFpbCggJ0lNQUdFIERFUExPWSBFUlJPUicsIGVycm9yTWVzc2FnZSwgZW1haWwgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB3aW5zdG9uLmxvZyggJ2luZm8nLCAnSW1hZ2UgZGVwbG95IGZpbmlzaGVkIHN1Y2Nlc3NmdWxseScgKTtcclxuICAgICAgICBzZW5kRW1haWwoICdJbWFnZSBkZXBsb3kgc3VjY2VlZGVkJywgZW1haWxCb2R5VGV4dCwgZW1haWwsIHRydWUgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICByZXMuc3RhdHVzKCAyMDIgKTtcclxuICByZXMuc2VuZCggJ2J1aWxkIHByb2Nlc3MgaW5pdGlhdGVkLCBjaGVjayBsb2dzIGZvciBkZXRhaWxzJyApO1xyXG59O1xyXG5cclxuLy8gQ3JlYXRlIHRoZSBFeHByZXNzSlMgYXBwXHJcbmNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcclxuXHJcbi8vIHRvIHN1cHBvcnQgSlNPTi1lbmNvZGVkIGJvZGllc1xyXG5hcHAudXNlKCBib2R5UGFyc2VyLmpzb24oKSApO1xyXG5cclxuLy8gYWRkIHRoZSByb3V0ZSB0byBidWlsZCBhbmQgZGVwbG95XHJcbmFwcC5nZXQoICcvZGVwbG95LWh0bWwtc2ltdWxhdGlvbicsIGdldFF1ZXVlRGVwbG95ICk7XHJcbmFwcC5wb3N0KCAnL2RlcGxveS1odG1sLXNpbXVsYXRpb24nLCBwb3N0UXVldWVEZXBsb3kgKTtcclxuYXBwLnBvc3QoICcvZGVwbG95LWltYWdlcycsIHBvc3RRdWV1ZUltYWdlRGVwbG95ICk7XHJcblxyXG5hcHAuc2V0KCAndmlld3MnLCAnLi92aWV3cycgKTtcclxuYXBwLnNldCggJ3ZpZXcgZW5naW5lJywgJ3B1ZycgKTtcclxuYXBwLmdldCggJy9kZXBsb3ktc3RhdHVzJywgZ2V0U3RhdHVzICk7XHJcblxyXG4vLyBzdGFydCB0aGUgc2VydmVyXHJcbmFwcC5saXN0ZW4oIGNvbnN0YW50cy5MSVNURU5fUE9SVCwgKCkgPT4ge1xyXG4gIHdpbnN0b24ubG9nKCAnaW5mbycsIGBMaXN0ZW5pbmcgb24gcG9ydCAke2NvbnN0YW50cy5MSVNURU5fUE9SVH1gICk7XHJcbiAgd2luc3Rvbi5sb2coICdpbmZvJywgYFZlcmJvc2UgbW9kZTogJHt2ZXJib3NlfWAgKTtcclxuXHJcbiAgLy8gbG9nIHRoZSBTSEEgb2YgcGVyZW5uaWFsIC0gdGhpcyBtYXkgbWFrZSBpdCBlYXNpZXIgdG8gZHVwbGljYXRlIGFuZCB0cmFjayBkb3duIHByb2JsZW1zXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHNoYSA9IGNoaWxkUHJvY2Vzcy5leGVjU3luYyggJ2dpdCByZXYtcGFyc2UgSEVBRCcgKTtcclxuICAgIHdpbnN0b24uaW5mbyggYGN1cnJlbnQgU0hBOiAke3NoYS50b1N0cmluZygpfWAgKTtcclxuICB9XHJcbiAgY2F0Y2goIGVyciApIHtcclxuICAgIHdpbnN0b24ud2FybiggYHVuYWJsZSB0byBnZXQgU0hBIGZyb20gZ2l0LCBlcnI6ICR7ZXJyfWAgKTtcclxuICB9XHJcblxyXG4gIC8vIFJlY3JlYXRlIHF1ZXVlXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHF1ZXVlID0gcGVyc2lzdGVudFF1ZXVlLmdldFF1ZXVlKCkucXVldWU7XHJcbiAgICBmb3IgKCBjb25zdCB0YXNrIG9mIHF1ZXVlICkge1xyXG4gICAgICBjb25zb2xlLmxvZyggJ1Jlc3VtaW5nIHRhc2sgZnJvbSBwZXJzaXN0ZW50IHF1ZXVlOiAnLCB0YXNrICk7XHJcbiAgICAgIHRhc2tRdWV1ZS5wdXNoKCB0YXNrLCBidWlsZENhbGxiYWNrKCB0YXNrICkgKTtcclxuICAgIH1cclxuICB9XHJcbiAgY2F0Y2goIGUgKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCAnY291bGQgbm90IHJlc3VtZSBxdWV1ZScgKTtcclxuICB9XHJcbn0gKTsiXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUE7O0FBRUE7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