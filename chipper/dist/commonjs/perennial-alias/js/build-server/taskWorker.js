"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
// Copyright 2017-2019, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)

var constants = require('./constants');
var createTranslationsXML = require('./createTranslationsXML');
var devDeploy = require('./devDeploy');
var execute = require('../common/execute');
var fs = require('fs');
var getLocales = require('./getLocales');
var notifyServer = require('./notifyServer');
var rsync = require('rsync');
var SimVersion = require('../common/SimVersion');
var winston = require('../../../../../../perennial-alias/node_modules/winston');
var writePhetHtaccess = require('./writePhetHtaccess');
var writePhetioHtaccess = require('../common/writePhetioHtaccess');
var deployImages = require('./deployImages');
var persistentQueue = require('./persistentQueue');
var ReleaseBranch = require('../common/ReleaseBranch');
var loadJSON = require('../common/loadJSON');

/**
 * Abort build with err
 * @param {String|Error} err - error logged and sent via email
 */
var abortBuild = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(err) {
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          winston.log('error', "BUILD ABORTED! ".concat(err));
          err.stack && winston.log('error', err.stack);
          throw new Error("Build aborted, ".concat(err));
        case 3:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function abortBuild(_x) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Clean up after deploy. Remove tmp dir.
 */
var afterDeploy = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(buildDir) {
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return execute('rm', ['-rf', buildDir], '.');
        case 3:
          _context2.next = 9;
          break;
        case 5:
          _context2.prev = 5;
          _context2.t0 = _context2["catch"](0);
          _context2.next = 9;
          return abortBuild(_context2.t0);
        case 9:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 5]]);
  }));
  return function afterDeploy(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * taskQueue ensures that only one build/deploy process will be happening at the same time.  The main build/deploy logic is here.
 *
 * @property {JSON} repos
 * @property {String} api
 * @property {String} locales - comma separated list of locale codes
 * @property {String} simName - lower case simulation name used for creating files/directories
 * @property {String} version - sim version identifier string
 * @property {String} servers - deployment targets, subset of [ 'dev', 'production' ]
 * @property {string[]} brands - deployment brands
 * @property {String} email - used for sending notifications about success/failure
 * @property {String} translatorId - rosetta user id for adding translators to the website
 * @property {winston} winston - logger
 * @param options
 */
function runTask(_x3) {
  return _runTask.apply(this, arguments);
}
function _runTask() {
  _runTask = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(options) {
    var api, dependencies, locales, simName, version, email, brands, servers, userId, branch, simNameRegex, key, value, originalVersion, versionMatch, releaseBranch, chipperVersion, checkoutDirectory, packageJSON, packageVersion, checkoutDir, simRepoDir, buildDir, htaccessLocation, localesArray, isTranslationRequest, targetVersionDir, targetSimDir, _loop, i;
    return _regeneratorRuntime().wrap(function _callee3$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          persistentQueue.startTask(options);
          if (!options.deployImages) {
            _context4.next = 13;
            break;
          }
          _context4.prev = 2;
          _context4.next = 5;
          return deployImages(options);
        case 5:
          return _context4.abrupt("return");
        case 8:
          _context4.prev = 8;
          _context4.t0 = _context4["catch"](2);
          winston.error(_context4.t0);
          winston.error('Deploy images failed. See previous logs for details.');
          throw _context4.t0;
        case 13:
          _context4.prev = 13;
          //-------------------------------------------------------------------------------------
          // Parse and validate parameters
          //-------------------------------------------------------------------------------------
          api = options.api;
          dependencies = options.repos;
          locales = options.locales;
          simName = options.simName;
          version = options.version;
          email = options.email;
          brands = options.brands;
          servers = options.servers;
          userId = options.userId;
          branch = options.branch || version.match(/^(\d+\.\d+)/)[0];
          if (userId) {
            winston.log('info', "setting userId = ".concat(userId));
          }
          if (!(branch === null)) {
            _context4.next = 28;
            break;
          }
          _context4.next = 28;
          return abortBuild('Branch must be provided.');
        case 28:
          // validate simName
          simNameRegex = /^[a-z-]+$/;
          if (simNameRegex.test(simName)) {
            _context4.next = 32;
            break;
          }
          _context4.next = 32;
          return abortBuild("invalid simName ".concat(simName));
        case 32:
          _context4.t1 = _regeneratorRuntime().keys(dependencies);
        case 33:
          if ((_context4.t2 = _context4.t1()).done) {
            _context4.next = 57;
            break;
          }
          key = _context4.t2.value;
          if (!dependencies.hasOwnProperty(key)) {
            _context4.next = 55;
            break;
          }
          winston.log('info', "Validating repo: ".concat(key));

          // make sure all keys in dependencies object are valid sim names
          if (simNameRegex.test(key)) {
            _context4.next = 40;
            break;
          }
          _context4.next = 40;
          return abortBuild("invalid simName in dependencies: ".concat(simName));
        case 40:
          value = dependencies[key];
          if (!(key === 'comment')) {
            _context4.next = 47;
            break;
          }
          if (!(typeof value !== 'string')) {
            _context4.next = 45;
            break;
          }
          _context4.next = 45;
          return abortBuild('invalid comment in dependencies: should be a string');
        case 45:
          _context4.next = 55;
          break;
        case 47:
          if (!(value instanceof Object && value.hasOwnProperty('sha'))) {
            _context4.next = 53;
            break;
          }
          if (/^[a-f0-9]{40}$/.test(value.sha)) {
            _context4.next = 51;
            break;
          }
          _context4.next = 51;
          return abortBuild("invalid sha in dependencies. key: ".concat(key, " value: ").concat(value, " sha: ").concat(value.sha));
        case 51:
          _context4.next = 55;
          break;
        case 53:
          _context4.next = 55;
          return abortBuild("invalid item in dependencies. key: ".concat(key, " value: ").concat(value));
        case 55:
          _context4.next = 33;
          break;
        case 57:
          // Infer brand from version string and keep unstripped version for phet-io
          originalVersion = version;
          if (!(api === '1.0')) {
            _context4.next = 67;
            break;
          }
          // validate version and strip suffixes since just the numbers are used in the directory name on dev and production servers
          versionMatch = version.match(/^(\d+\.\d+\.\d+)(?:-.*)?$/);
          if (!(versionMatch && versionMatch.length === 2)) {
            _context4.next = 65;
            break;
          }
          if (servers.includes('dev')) {
            // if deploying an rc version use the -rc.[number] suffix
            version = versionMatch[0];
          } else {
            // otherwise strip any suffix
            version = versionMatch[1];
          }
          winston.log('info', "detecting version number: ".concat(version));
          _context4.next = 67;
          break;
        case 65:
          _context4.next = 67;
          return abortBuild("invalid version number: ".concat(version));
        case 67:
          if (!(api === '1.0')) {
            _context4.next = 71;
            break;
          }
          _context4.next = 70;
          return getLocales(locales, simName);
        case 70:
          locales = _context4.sent;
        case 71:
          // Git pull, git checkout, npm prune & update, etc. in parallel directory
          releaseBranch = new ReleaseBranch(simName, branch, brands, true);
          _context4.next = 74;
          return releaseBranch.updateCheckout(dependencies);
        case 74:
          chipperVersion = releaseBranch.getChipperVersion();
          winston.debug("Chipper version detected: ".concat(chipperVersion.toString()));
          if (!(!(chipperVersion.major === 2 && chipperVersion.minor === 0) && !(chipperVersion.major === 0 && chipperVersion.minor === 0))) {
            _context4.next = 79;
            break;
          }
          _context4.next = 79;
          return abortBuild('Unsupported chipper version');
        case 79:
          if (!(chipperVersion.major !== 1)) {
            _context4.next = 86;
            break;
          }
          checkoutDirectory = ReleaseBranch.getCheckoutDirectory(simName, branch);
          packageJSON = JSON.parse(fs.readFileSync("".concat(checkoutDirectory, "/").concat(simName, "/package.json"), 'utf8'));
          packageVersion = packageJSON.version;
          if (!(packageVersion !== version)) {
            _context4.next = 86;
            break;
          }
          _context4.next = 86;
          return abortBuild("Version mismatch between package.json and build request: ".concat(packageVersion, " vs ").concat(version));
        case 86:
          _context4.next = 88;
          return releaseBranch.build({
            clean: false,
            locales: locales,
            buildForServer: true,
            lint: false,
            allHTML: !(chipperVersion.major === 0 && chipperVersion.minor === 0 && brands[0] !== constants.PHET_BRAND)
          });
        case 88:
          winston.debug('Build finished.');
          winston.debug("Deploying to servers: ".concat(JSON.stringify(servers)));
          checkoutDir = ReleaseBranch.getCheckoutDirectory(simName, branch);
          simRepoDir = "".concat(checkoutDir, "/").concat(simName);
          buildDir = "".concat(simRepoDir, "/build");
          if (!(servers.indexOf(constants.DEV_SERVER) >= 0)) {
            _context4.next = 101;
            break;
          }
          winston.info('deploying to dev');
          if (!(brands.indexOf(constants.PHET_IO_BRAND) >= 0)) {
            _context4.next = 99;
            break;
          }
          htaccessLocation = chipperVersion.major === 2 && chipperVersion.minor === 0 ? "".concat(buildDir, "/phet-io") : buildDir;
          _context4.next = 99;
          return writePhetioHtaccess(htaccessLocation, {
            checkoutDir: checkoutDir,
            isProductionDeploy: false
          });
        case 99:
          _context4.next = 101;
          return devDeploy(checkoutDir, simName, version, chipperVersion, brands, buildDir);
        case 101:
          localesArray = typeof locales === 'string' ? locales.split(',') : locales; // if this build request comes from rosetta it will have a userId field and only one locale
          isTranslationRequest = userId && localesArray.length === 1 && localesArray[0] !== '*';
          if (!(servers.indexOf(constants.PRODUCTION_SERVER) >= 0)) {
            _context4.next = 112;
            break;
          }
          winston.info('deploying to production');
          // Loop over all brands
          _loop = /*#__PURE__*/_regeneratorRuntime().mark(function _loop() {
            var brand, phetBuildDir, files, _i, filename, newFilename, sourceDir, suffix, parsedVersion, simPackage, ignoreForAutomatedMaintenanceReleases;
            return _regeneratorRuntime().wrap(function _loop$(_context3) {
              while (1) switch (_context3.prev = _context3.next) {
                case 0:
                  if (!brands.hasOwnProperty(i)) {
                    _context3.next = 65;
                    break;
                  }
                  brand = brands[i];
                  winston.info("deploying brand: ".concat(brand));
                  // Pre-copy steps
                  if (!(brand === constants.PHET_BRAND)) {
                    _context3.next = 22;
                    break;
                  }
                  targetSimDir = constants.HTML_SIMS_DIRECTORY + simName;
                  targetVersionDir = "".concat(targetSimDir, "/").concat(version, "/");
                  if (!(chipperVersion.major === 2 && chipperVersion.minor === 0)) {
                    _context3.next = 20;
                    break;
                  }
                  // Remove _phet from all filenames in the phet directory
                  phetBuildDir = "".concat(buildDir, "/phet");
                  files = fs.readdirSync(phetBuildDir);
                  _context3.t0 = _regeneratorRuntime().keys(files);
                case 10:
                  if ((_context3.t1 = _context3.t0()).done) {
                    _context3.next = 20;
                    break;
                  }
                  _i = _context3.t1.value;
                  if (!files.hasOwnProperty(_i)) {
                    _context3.next = 18;
                    break;
                  }
                  filename = files[_i];
                  if (!(filename.indexOf('_phet') >= 0)) {
                    _context3.next = 18;
                    break;
                  }
                  newFilename = filename.replace('_phet', '');
                  _context3.next = 18;
                  return execute('mv', [filename, newFilename], phetBuildDir);
                case 18:
                  _context3.next = 10;
                  break;
                case 20:
                  _context3.next = 23;
                  break;
                case 22:
                  if (brand === constants.PHET_IO_BRAND) {
                    targetSimDir = constants.PHET_IO_SIMS_DIRECTORY + simName;
                    targetVersionDir = "".concat(targetSimDir, "/").concat(originalVersion);

                    // Chipper 1.0 has -phetio in the version schema for PhET-iO branded sims
                    if (chipperVersion.major === 0 && !originalVersion.match('-phetio')) {
                      targetVersionDir += '-phetio';
                    }
                    targetVersionDir += '/';
                  }
                case 23:
                  // Copy steps - allow EEXIST errors but reject anything else
                  winston.debug("Creating version dir: ".concat(targetVersionDir));
                  _context3.prev = 24;
                  _context3.next = 27;
                  return fs.promises.mkdir(targetVersionDir, {
                    recursive: true
                  });
                case 27:
                  winston.debug('Success creating sim dir');
                  _context3.next = 36;
                  break;
                case 30:
                  _context3.prev = 30;
                  _context3.t2 = _context3["catch"](24);
                  if (!(_context3.t2.code !== 'EEXIST')) {
                    _context3.next = 36;
                    break;
                  }
                  winston.error('Failure creating version dir');
                  winston.error(_context3.t2);
                  throw _context3.t2;
                case 36:
                  sourceDir = buildDir;
                  if (chipperVersion.major === 2 && chipperVersion.minor === 0) {
                    sourceDir += "/".concat(brand);
                  }
                  _context3.next = 40;
                  return new Promise(function (resolve, reject) {
                    winston.debug("Copying recursive ".concat(sourceDir, " to ").concat(targetVersionDir));
                    new rsync().flags('razpO').set('no-perms').set('exclude', '.rsync-filter').source("".concat(sourceDir, "/")).destination(targetVersionDir).output(function (stdout) {
                      winston.debug(stdout.toString());
                    }, function (stderr) {
                      winston.error(stderr.toString());
                    }).execute(function (err, code, cmd) {
                      if (err && code !== 23) {
                        winston.debug(code);
                        winston.debug(cmd);
                        reject(err);
                      } else {
                        resolve();
                      }
                    });
                  });
                case 40:
                  winston.debug('Copy finished');

                  // Post-copy steps
                  if (!(brand === constants.PHET_BRAND)) {
                    _context3.next = 53;
                    break;
                  }
                  if (isTranslationRequest) {
                    _context3.next = 45;
                    break;
                  }
                  _context3.next = 45;
                  return deployImages({
                    simulation: options.simName,
                    brands: options.brands,
                    version: options.version
                  });
                case 45:
                  _context3.next = 47;
                  return writePhetHtaccess(simName, version);
                case 47:
                  _context3.next = 49;
                  return createTranslationsXML(simName, version, checkoutDir);
                case 49:
                  _context3.next = 51;
                  return notifyServer({
                    simName: simName,
                    email: email,
                    brand: brand,
                    locales: locales,
                    translatorId: isTranslationRequest ? userId : undefined
                  });
                case 51:
                  _context3.next = 65;
                  break;
                case 53:
                  if (!(brand === constants.PHET_IO_BRAND)) {
                    _context3.next = 65;
                    break;
                  }
                  suffix = originalVersion.split('-').length >= 2 ? originalVersion.split('-')[1] : chipperVersion.major < 2 ? 'phetio' : '';
                  parsedVersion = SimVersion.parse(version, '');
                  _context3.next = 58;
                  return loadJSON("".concat(simRepoDir, "/package.json"));
                case 58:
                  simPackage = _context3.sent;
                  ignoreForAutomatedMaintenanceReleases = !!(simPackage && simPackage.phet && simPackage.phet.ignoreForAutomatedMaintenanceReleases); // This triggers an asyncronous task on the tomcat/wicket application and only waits for a response that the request was received.
                  // Do not assume that this task is complete because we use await.
                  _context3.next = 62;
                  return notifyServer({
                    simName: simName,
                    email: email,
                    brand: brand,
                    phetioOptions: {
                      branch: branch,
                      suffix: suffix,
                      version: parsedVersion,
                      ignoreForAutomatedMaintenanceReleases: ignoreForAutomatedMaintenanceReleases
                    }
                  });
                case 62:
                  winston.debug('server notified');
                  _context3.next = 65;
                  return writePhetioHtaccess(targetVersionDir, {
                    simName: simName,
                    version: originalVersion,
                    directory: constants.PHET_IO_SIMS_DIRECTORY,
                    checkoutDir: checkoutDir,
                    isProductionDeploy: true
                  });
                case 65:
                case "end":
                  return _context3.stop();
              }
            }, _loop, null, [[24, 30]]);
          });
          _context4.t3 = _regeneratorRuntime().keys(brands);
        case 107:
          if ((_context4.t4 = _context4.t3()).done) {
            _context4.next = 112;
            break;
          }
          i = _context4.t4.value;
          return _context4.delegateYield(_loop(), "t5", 110);
        case 110:
          _context4.next = 107;
          break;
        case 112:
          _context4.next = 114;
          return afterDeploy("".concat(buildDir));
        case 114:
          _context4.next = 120;
          break;
        case 116:
          _context4.prev = 116;
          _context4.t6 = _context4["catch"](13);
          _context4.next = 120;
          return abortBuild(_context4.t6);
        case 120:
        case "end":
          return _context4.stop();
      }
    }, _callee3, null, [[2, 8], [13, 116]]);
  }));
  return _runTask.apply(this, arguments);
}
module.exports = function taskWorker(task, taskCallback) {
  runTask(task).then(function () {
    taskCallback();
  })["catch"](function (reason) {
    taskCallback(reason);
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVnZW5lcmF0b3JSdW50aW1lIiwiZSIsInQiLCJyIiwiT2JqZWN0IiwicHJvdG90eXBlIiwibiIsImhhc093blByb3BlcnR5IiwibyIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJpIiwiU3ltYm9sIiwiYSIsIml0ZXJhdG9yIiwiYyIsImFzeW5jSXRlcmF0b3IiLCJ1IiwidG9TdHJpbmdUYWciLCJkZWZpbmUiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ3cmFwIiwiR2VuZXJhdG9yIiwiY3JlYXRlIiwiQ29udGV4dCIsIm1ha2VJbnZva2VNZXRob2QiLCJ0cnlDYXRjaCIsInR5cGUiLCJhcmciLCJjYWxsIiwiaCIsImwiLCJmIiwicyIsInkiLCJHZW5lcmF0b3JGdW5jdGlvbiIsIkdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlIiwicCIsImQiLCJnZXRQcm90b3R5cGVPZiIsInYiLCJ2YWx1ZXMiLCJnIiwiZGVmaW5lSXRlcmF0b3JNZXRob2RzIiwiZm9yRWFjaCIsIl9pbnZva2UiLCJBc3luY0l0ZXJhdG9yIiwiaW52b2tlIiwiX3R5cGVvZiIsInJlc29sdmUiLCJfX2F3YWl0IiwidGhlbiIsImNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnIiwiRXJyb3IiLCJkb25lIiwibWV0aG9kIiwiZGVsZWdhdGUiLCJtYXliZUludm9rZURlbGVnYXRlIiwic2VudCIsIl9zZW50IiwiZGlzcGF0Y2hFeGNlcHRpb24iLCJhYnJ1cHQiLCJUeXBlRXJyb3IiLCJyZXN1bHROYW1lIiwibmV4dCIsIm5leHRMb2MiLCJwdXNoVHJ5RW50cnkiLCJ0cnlMb2MiLCJjYXRjaExvYyIsImZpbmFsbHlMb2MiLCJhZnRlckxvYyIsInRyeUVudHJpZXMiLCJwdXNoIiwicmVzZXRUcnlFbnRyeSIsImNvbXBsZXRpb24iLCJyZXNldCIsImlzTmFOIiwibGVuZ3RoIiwiZGlzcGxheU5hbWUiLCJpc0dlbmVyYXRvckZ1bmN0aW9uIiwiY29uc3RydWN0b3IiLCJuYW1lIiwibWFyayIsInNldFByb3RvdHlwZU9mIiwiX19wcm90b19fIiwiYXdyYXAiLCJhc3luYyIsIlByb21pc2UiLCJrZXlzIiwicmV2ZXJzZSIsInBvcCIsInByZXYiLCJjaGFyQXQiLCJzbGljZSIsInN0b3AiLCJydmFsIiwiaGFuZGxlIiwiY29tcGxldGUiLCJmaW5pc2giLCJfY2F0Y2giLCJkZWxlZ2F0ZVlpZWxkIiwiYXN5bmNHZW5lcmF0b3JTdGVwIiwiZ2VuIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJpbmZvIiwiZXJyb3IiLCJfYXN5bmNUb0dlbmVyYXRvciIsImZuIiwic2VsZiIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsImVyciIsInVuZGVmaW5lZCIsImNvbnN0YW50cyIsInJlcXVpcmUiLCJjcmVhdGVUcmFuc2xhdGlvbnNYTUwiLCJkZXZEZXBsb3kiLCJleGVjdXRlIiwiZnMiLCJnZXRMb2NhbGVzIiwibm90aWZ5U2VydmVyIiwicnN5bmMiLCJTaW1WZXJzaW9uIiwid2luc3RvbiIsIndyaXRlUGhldEh0YWNjZXNzIiwid3JpdGVQaGV0aW9IdGFjY2VzcyIsImRlcGxveUltYWdlcyIsInBlcnNpc3RlbnRRdWV1ZSIsIlJlbGVhc2VCcmFuY2giLCJsb2FkSlNPTiIsImFib3J0QnVpbGQiLCJfcmVmIiwiX2NhbGxlZSIsIl9jYWxsZWUkIiwiX2NvbnRleHQiLCJsb2ciLCJjb25jYXQiLCJzdGFjayIsIl94IiwiYWZ0ZXJEZXBsb3kiLCJfcmVmMiIsIl9jYWxsZWUyIiwiYnVpbGREaXIiLCJfY2FsbGVlMiQiLCJfY29udGV4dDIiLCJ0MCIsIl94MiIsInJ1blRhc2siLCJfeDMiLCJfcnVuVGFzayIsIl9jYWxsZWUzIiwib3B0aW9ucyIsImFwaSIsImRlcGVuZGVuY2llcyIsImxvY2FsZXMiLCJzaW1OYW1lIiwidmVyc2lvbiIsImVtYWlsIiwiYnJhbmRzIiwic2VydmVycyIsInVzZXJJZCIsImJyYW5jaCIsInNpbU5hbWVSZWdleCIsIm9yaWdpbmFsVmVyc2lvbiIsInZlcnNpb25NYXRjaCIsInJlbGVhc2VCcmFuY2giLCJjaGlwcGVyVmVyc2lvbiIsImNoZWNrb3V0RGlyZWN0b3J5IiwicGFja2FnZUpTT04iLCJwYWNrYWdlVmVyc2lvbiIsImNoZWNrb3V0RGlyIiwic2ltUmVwb0RpciIsImh0YWNjZXNzTG9jYXRpb24iLCJsb2NhbGVzQXJyYXkiLCJpc1RyYW5zbGF0aW9uUmVxdWVzdCIsInRhcmdldFZlcnNpb25EaXIiLCJ0YXJnZXRTaW1EaXIiLCJfbG9vcCIsIl9jYWxsZWUzJCIsIl9jb250ZXh0NCIsInN0YXJ0VGFzayIsInJlcG9zIiwibWF0Y2giLCJ0ZXN0IiwidDEiLCJ0MiIsInNoYSIsImluY2x1ZGVzIiwidXBkYXRlQ2hlY2tvdXQiLCJnZXRDaGlwcGVyVmVyc2lvbiIsImRlYnVnIiwidG9TdHJpbmciLCJtYWpvciIsIm1pbm9yIiwiZ2V0Q2hlY2tvdXREaXJlY3RvcnkiLCJKU09OIiwicGFyc2UiLCJyZWFkRmlsZVN5bmMiLCJidWlsZCIsImNsZWFuIiwiYnVpbGRGb3JTZXJ2ZXIiLCJsaW50IiwiYWxsSFRNTCIsIlBIRVRfQlJBTkQiLCJzdHJpbmdpZnkiLCJpbmRleE9mIiwiREVWX1NFUlZFUiIsIlBIRVRfSU9fQlJBTkQiLCJpc1Byb2R1Y3Rpb25EZXBsb3kiLCJzcGxpdCIsIlBST0RVQ1RJT05fU0VSVkVSIiwiYnJhbmQiLCJwaGV0QnVpbGREaXIiLCJmaWxlcyIsIl9pIiwiZmlsZW5hbWUiLCJuZXdGaWxlbmFtZSIsInNvdXJjZURpciIsInN1ZmZpeCIsInBhcnNlZFZlcnNpb24iLCJzaW1QYWNrYWdlIiwiaWdub3JlRm9yQXV0b21hdGVkTWFpbnRlbmFuY2VSZWxlYXNlcyIsIl9sb29wJCIsIl9jb250ZXh0MyIsIkhUTUxfU0lNU19ESVJFQ1RPUlkiLCJyZWFkZGlyU3luYyIsInJlcGxhY2UiLCJQSEVUX0lPX1NJTVNfRElSRUNUT1JZIiwicHJvbWlzZXMiLCJta2RpciIsInJlY3Vyc2l2ZSIsImNvZGUiLCJmbGFncyIsInNldCIsInNvdXJjZSIsImRlc3RpbmF0aW9uIiwib3V0cHV0Iiwic3Rkb3V0Iiwic3RkZXJyIiwiY21kIiwic2ltdWxhdGlvbiIsInRyYW5zbGF0b3JJZCIsInBoZXQiLCJwaGV0aW9PcHRpb25zIiwiZGlyZWN0b3J5IiwidDMiLCJ0NCIsInQ2IiwibW9kdWxlIiwiZXhwb3J0cyIsInRhc2tXb3JrZXIiLCJ0YXNrIiwidGFza0NhbGxiYWNrIiwicmVhc29uIl0sInNvdXJjZXMiOlsidGFza1dvcmtlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDE5LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuLy8gQGF1dGhvciBNYXR0IFBlbm5pbmd0b24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcblxyXG5cclxuY29uc3QgY29uc3RhbnRzID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApO1xyXG5jb25zdCBjcmVhdGVUcmFuc2xhdGlvbnNYTUwgPSByZXF1aXJlKCAnLi9jcmVhdGVUcmFuc2xhdGlvbnNYTUwnICk7XHJcbmNvbnN0IGRldkRlcGxveSA9IHJlcXVpcmUoICcuL2RldkRlcGxveScgKTtcclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuLi9jb21tb24vZXhlY3V0ZScgKTtcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IGdldExvY2FsZXMgPSByZXF1aXJlKCAnLi9nZXRMb2NhbGVzJyApO1xyXG5jb25zdCBub3RpZnlTZXJ2ZXIgPSByZXF1aXJlKCAnLi9ub3RpZnlTZXJ2ZXInICk7XHJcbmNvbnN0IHJzeW5jID0gcmVxdWlyZSggJ3JzeW5jJyApO1xyXG5jb25zdCBTaW1WZXJzaW9uID0gcmVxdWlyZSggJy4uL2NvbW1vbi9TaW1WZXJzaW9uJyApO1xyXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XHJcbmNvbnN0IHdyaXRlUGhldEh0YWNjZXNzID0gcmVxdWlyZSggJy4vd3JpdGVQaGV0SHRhY2Nlc3MnICk7XHJcbmNvbnN0IHdyaXRlUGhldGlvSHRhY2Nlc3MgPSByZXF1aXJlKCAnLi4vY29tbW9uL3dyaXRlUGhldGlvSHRhY2Nlc3MnICk7XHJcbmNvbnN0IGRlcGxveUltYWdlcyA9IHJlcXVpcmUoICcuL2RlcGxveUltYWdlcycgKTtcclxuY29uc3QgcGVyc2lzdGVudFF1ZXVlID0gcmVxdWlyZSggJy4vcGVyc2lzdGVudFF1ZXVlJyApO1xyXG5jb25zdCBSZWxlYXNlQnJhbmNoID0gcmVxdWlyZSggJy4uL2NvbW1vbi9SZWxlYXNlQnJhbmNoJyApO1xyXG5jb25zdCBsb2FkSlNPTiA9IHJlcXVpcmUoICcuLi9jb21tb24vbG9hZEpTT04nICk7XHJcblxyXG4vKipcclxuICogQWJvcnQgYnVpbGQgd2l0aCBlcnJcclxuICogQHBhcmFtIHtTdHJpbmd8RXJyb3J9IGVyciAtIGVycm9yIGxvZ2dlZCBhbmQgc2VudCB2aWEgZW1haWxcclxuICovXHJcbmNvbnN0IGFib3J0QnVpbGQgPSBhc3luYyBlcnIgPT4ge1xyXG4gIHdpbnN0b24ubG9nKCAnZXJyb3InLCBgQlVJTEQgQUJPUlRFRCEgJHtlcnJ9YCApO1xyXG4gIGVyci5zdGFjayAmJiB3aW5zdG9uLmxvZyggJ2Vycm9yJywgZXJyLnN0YWNrICk7XHJcblxyXG4gIHRocm93IG5ldyBFcnJvciggYEJ1aWxkIGFib3J0ZWQsICR7ZXJyfWAgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDbGVhbiB1cCBhZnRlciBkZXBsb3kuIFJlbW92ZSB0bXAgZGlyLlxyXG4gKi9cclxuY29uc3QgYWZ0ZXJEZXBsb3kgPSBhc3luYyBidWlsZERpciA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGV4ZWN1dGUoICdybScsIFsgJy1yZicsIGJ1aWxkRGlyIF0sICcuJyApO1xyXG4gIH1cclxuICBjYXRjaCggZXJyICkge1xyXG4gICAgYXdhaXQgYWJvcnRCdWlsZCggZXJyICk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIHRhc2tRdWV1ZSBlbnN1cmVzIHRoYXQgb25seSBvbmUgYnVpbGQvZGVwbG95IHByb2Nlc3Mgd2lsbCBiZSBoYXBwZW5pbmcgYXQgdGhlIHNhbWUgdGltZS4gIFRoZSBtYWluIGJ1aWxkL2RlcGxveSBsb2dpYyBpcyBoZXJlLlxyXG4gKlxyXG4gKiBAcHJvcGVydHkge0pTT059IHJlcG9zXHJcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBhcGlcclxuICogQHByb3BlcnR5IHtTdHJpbmd9IGxvY2FsZXMgLSBjb21tYSBzZXBhcmF0ZWQgbGlzdCBvZiBsb2NhbGUgY29kZXNcclxuICogQHByb3BlcnR5IHtTdHJpbmd9IHNpbU5hbWUgLSBsb3dlciBjYXNlIHNpbXVsYXRpb24gbmFtZSB1c2VkIGZvciBjcmVhdGluZyBmaWxlcy9kaXJlY3Rvcmllc1xyXG4gKiBAcHJvcGVydHkge1N0cmluZ30gdmVyc2lvbiAtIHNpbSB2ZXJzaW9uIGlkZW50aWZpZXIgc3RyaW5nXHJcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBzZXJ2ZXJzIC0gZGVwbG95bWVudCB0YXJnZXRzLCBzdWJzZXQgb2YgWyAnZGV2JywgJ3Byb2R1Y3Rpb24nIF1cclxuICogQHByb3BlcnR5IHtzdHJpbmdbXX0gYnJhbmRzIC0gZGVwbG95bWVudCBicmFuZHNcclxuICogQHByb3BlcnR5IHtTdHJpbmd9IGVtYWlsIC0gdXNlZCBmb3Igc2VuZGluZyBub3RpZmljYXRpb25zIGFib3V0IHN1Y2Nlc3MvZmFpbHVyZVxyXG4gKiBAcHJvcGVydHkge1N0cmluZ30gdHJhbnNsYXRvcklkIC0gcm9zZXR0YSB1c2VyIGlkIGZvciBhZGRpbmcgdHJhbnNsYXRvcnMgdG8gdGhlIHdlYnNpdGVcclxuICogQHByb3BlcnR5IHt3aW5zdG9ufSB3aW5zdG9uIC0gbG9nZ2VyXHJcbiAqIEBwYXJhbSBvcHRpb25zXHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiBydW5UYXNrKCBvcHRpb25zICkge1xyXG4gIHBlcnNpc3RlbnRRdWV1ZS5zdGFydFRhc2soIG9wdGlvbnMgKTtcclxuICBpZiAoIG9wdGlvbnMuZGVwbG95SW1hZ2VzICkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZGVwbG95SW1hZ2VzKCBvcHRpb25zICk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNhdGNoKCBlICkge1xyXG4gICAgICB3aW5zdG9uLmVycm9yKCBlICk7XHJcbiAgICAgIHdpbnN0b24uZXJyb3IoICdEZXBsb3kgaW1hZ2VzIGZhaWxlZC4gU2VlIHByZXZpb3VzIGxvZ3MgZm9yIGRldGFpbHMuJyApO1xyXG4gICAgICB0aHJvdyBlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIHRyeSB7XHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIFBhcnNlIGFuZCB2YWxpZGF0ZSBwYXJhbWV0ZXJzXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIGNvbnN0IGFwaSA9IG9wdGlvbnMuYXBpO1xyXG4gICAgY29uc3QgZGVwZW5kZW5jaWVzID0gb3B0aW9ucy5yZXBvcztcclxuICAgIGxldCBsb2NhbGVzID0gb3B0aW9ucy5sb2NhbGVzO1xyXG4gICAgY29uc3Qgc2ltTmFtZSA9IG9wdGlvbnMuc2ltTmFtZTtcclxuICAgIGxldCB2ZXJzaW9uID0gb3B0aW9ucy52ZXJzaW9uO1xyXG4gICAgY29uc3QgZW1haWwgPSBvcHRpb25zLmVtYWlsO1xyXG4gICAgY29uc3QgYnJhbmRzID0gb3B0aW9ucy5icmFuZHM7XHJcbiAgICBjb25zdCBzZXJ2ZXJzID0gb3B0aW9ucy5zZXJ2ZXJzO1xyXG4gICAgY29uc3QgdXNlcklkID0gb3B0aW9ucy51c2VySWQ7XHJcbiAgICBjb25zdCBicmFuY2ggPSBvcHRpb25zLmJyYW5jaCB8fCB2ZXJzaW9uLm1hdGNoKCAvXihcXGQrXFwuXFxkKykvIClbIDAgXTtcclxuXHJcbiAgICBpZiAoIHVzZXJJZCApIHtcclxuICAgICAgd2luc3Rvbi5sb2coICdpbmZvJywgYHNldHRpbmcgdXNlcklkID0gJHt1c2VySWR9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggYnJhbmNoID09PSBudWxsICkge1xyXG4gICAgICBhd2FpdCBhYm9ydEJ1aWxkKCAnQnJhbmNoIG11c3QgYmUgcHJvdmlkZWQuJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHZhbGlkYXRlIHNpbU5hbWVcclxuICAgIGNvbnN0IHNpbU5hbWVSZWdleCA9IC9eW2Etei1dKyQvO1xyXG4gICAgaWYgKCAhc2ltTmFtZVJlZ2V4LnRlc3QoIHNpbU5hbWUgKSApIHtcclxuICAgICAgYXdhaXQgYWJvcnRCdWlsZCggYGludmFsaWQgc2ltTmFtZSAke3NpbU5hbWV9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG1ha2Ugc3VyZSB0aGUgcmVwb3MgcGFzc2VkIGluIHZhbGlkYXRlc1xyXG4gICAgZm9yICggY29uc3Qga2V5IGluIGRlcGVuZGVuY2llcyApIHtcclxuICAgICAgaWYgKCBkZXBlbmRlbmNpZXMuaGFzT3duUHJvcGVydHkoIGtleSApICkge1xyXG4gICAgICAgIHdpbnN0b24ubG9nKCAnaW5mbycsIGBWYWxpZGF0aW5nIHJlcG86ICR7a2V5fWAgKTtcclxuXHJcbiAgICAgICAgLy8gbWFrZSBzdXJlIGFsbCBrZXlzIGluIGRlcGVuZGVuY2llcyBvYmplY3QgYXJlIHZhbGlkIHNpbSBuYW1lc1xyXG4gICAgICAgIGlmICggIXNpbU5hbWVSZWdleC50ZXN0KCBrZXkgKSApIHtcclxuICAgICAgICAgIGF3YWl0IGFib3J0QnVpbGQoIGBpbnZhbGlkIHNpbU5hbWUgaW4gZGVwZW5kZW5jaWVzOiAke3NpbU5hbWV9YCApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBkZXBlbmRlbmNpZXNbIGtleSBdO1xyXG4gICAgICAgIGlmICgga2V5ID09PSAnY29tbWVudCcgKSB7XHJcbiAgICAgICAgICBpZiAoIHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGFib3J0QnVpbGQoICdpbnZhbGlkIGNvbW1lbnQgaW4gZGVwZW5kZW5jaWVzOiBzaG91bGQgYmUgYSBzdHJpbmcnICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB2YWx1ZSBpbnN0YW5jZW9mIE9iamVjdCAmJiB2YWx1ZS5oYXNPd25Qcm9wZXJ0eSggJ3NoYScgKSApIHtcclxuICAgICAgICAgIGlmICggIS9eW2EtZjAtOV17NDB9JC8udGVzdCggdmFsdWUuc2hhICkgKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGFib3J0QnVpbGQoIGBpbnZhbGlkIHNoYSBpbiBkZXBlbmRlbmNpZXMuIGtleTogJHtrZXl9IHZhbHVlOiAke3ZhbHVlfSBzaGE6ICR7dmFsdWUuc2hhfWAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBhd2FpdCBhYm9ydEJ1aWxkKCBgaW52YWxpZCBpdGVtIGluIGRlcGVuZGVuY2llcy4ga2V5OiAke2tleX0gdmFsdWU6ICR7dmFsdWV9YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEluZmVyIGJyYW5kIGZyb20gdmVyc2lvbiBzdHJpbmcgYW5kIGtlZXAgdW5zdHJpcHBlZCB2ZXJzaW9uIGZvciBwaGV0LWlvXHJcbiAgICBjb25zdCBvcmlnaW5hbFZlcnNpb24gPSB2ZXJzaW9uO1xyXG4gICAgaWYgKCBhcGkgPT09ICcxLjAnICkge1xyXG4gICAgICAvLyB2YWxpZGF0ZSB2ZXJzaW9uIGFuZCBzdHJpcCBzdWZmaXhlcyBzaW5jZSBqdXN0IHRoZSBudW1iZXJzIGFyZSB1c2VkIGluIHRoZSBkaXJlY3RvcnkgbmFtZSBvbiBkZXYgYW5kIHByb2R1Y3Rpb24gc2VydmVyc1xyXG4gICAgICBjb25zdCB2ZXJzaW9uTWF0Y2ggPSB2ZXJzaW9uLm1hdGNoKCAvXihcXGQrXFwuXFxkK1xcLlxcZCspKD86LS4qKT8kLyApO1xyXG4gICAgICBpZiAoIHZlcnNpb25NYXRjaCAmJiB2ZXJzaW9uTWF0Y2gubGVuZ3RoID09PSAyICkge1xyXG5cclxuICAgICAgICBpZiAoIHNlcnZlcnMuaW5jbHVkZXMoICdkZXYnICkgKSB7XHJcbiAgICAgICAgICAvLyBpZiBkZXBsb3lpbmcgYW4gcmMgdmVyc2lvbiB1c2UgdGhlIC1yYy5bbnVtYmVyXSBzdWZmaXhcclxuICAgICAgICAgIHZlcnNpb24gPSB2ZXJzaW9uTWF0Y2hbIDAgXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAvLyBvdGhlcndpc2Ugc3RyaXAgYW55IHN1ZmZpeFxyXG4gICAgICAgICAgdmVyc2lvbiA9IHZlcnNpb25NYXRjaFsgMSBdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB3aW5zdG9uLmxvZyggJ2luZm8nLCBgZGV0ZWN0aW5nIHZlcnNpb24gbnVtYmVyOiAke3ZlcnNpb259YCApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGF3YWl0IGFib3J0QnVpbGQoIGBpbnZhbGlkIHZlcnNpb24gbnVtYmVyOiAke3ZlcnNpb259YCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBhcGkgPT09ICcxLjAnICkge1xyXG4gICAgICBsb2NhbGVzID0gYXdhaXQgZ2V0TG9jYWxlcyggbG9jYWxlcywgc2ltTmFtZSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdpdCBwdWxsLCBnaXQgY2hlY2tvdXQsIG5wbSBwcnVuZSAmIHVwZGF0ZSwgZXRjLiBpbiBwYXJhbGxlbCBkaXJlY3RvcnlcclxuICAgIGNvbnN0IHJlbGVhc2VCcmFuY2ggPSBuZXcgUmVsZWFzZUJyYW5jaCggc2ltTmFtZSwgYnJhbmNoLCBicmFuZHMsIHRydWUgKTtcclxuICAgIGF3YWl0IHJlbGVhc2VCcmFuY2gudXBkYXRlQ2hlY2tvdXQoIGRlcGVuZGVuY2llcyApO1xyXG5cclxuICAgIGNvbnN0IGNoaXBwZXJWZXJzaW9uID0gcmVsZWFzZUJyYW5jaC5nZXRDaGlwcGVyVmVyc2lvbigpO1xyXG4gICAgd2luc3Rvbi5kZWJ1ZyggYENoaXBwZXIgdmVyc2lvbiBkZXRlY3RlZDogJHtjaGlwcGVyVmVyc2lvbi50b1N0cmluZygpfWAgKTtcclxuICAgIGlmICggISggY2hpcHBlclZlcnNpb24ubWFqb3IgPT09IDIgJiYgY2hpcHBlclZlcnNpb24ubWlub3IgPT09IDAgKSAmJiAhKCBjaGlwcGVyVmVyc2lvbi5tYWpvciA9PT0gMCAmJiBjaGlwcGVyVmVyc2lvbi5taW5vciA9PT0gMCApICkge1xyXG4gICAgICBhd2FpdCBhYm9ydEJ1aWxkKCAnVW5zdXBwb3J0ZWQgY2hpcHBlciB2ZXJzaW9uJyApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggY2hpcHBlclZlcnNpb24ubWFqb3IgIT09IDEgKSB7XHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0RGlyZWN0b3J5ID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggc2ltTmFtZSwgYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IHBhY2thZ2VKU09OID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgJHtjaGVja291dERpcmVjdG9yeX0vJHtzaW1OYW1lfS9wYWNrYWdlLmpzb25gLCAndXRmOCcgKSApO1xyXG4gICAgICBjb25zdCBwYWNrYWdlVmVyc2lvbiA9IHBhY2thZ2VKU09OLnZlcnNpb247XHJcblxyXG4gICAgICBpZiAoIHBhY2thZ2VWZXJzaW9uICE9PSB2ZXJzaW9uICkge1xyXG4gICAgICAgIGF3YWl0IGFib3J0QnVpbGQoIGBWZXJzaW9uIG1pc21hdGNoIGJldHdlZW4gcGFja2FnZS5qc29uIGFuZCBidWlsZCByZXF1ZXN0OiAke3BhY2thZ2VWZXJzaW9ufSB2cyAke3ZlcnNpb259YCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXdhaXQgcmVsZWFzZUJyYW5jaC5idWlsZCgge1xyXG4gICAgICBjbGVhbjogZmFsc2UsXHJcbiAgICAgIGxvY2FsZXM6IGxvY2FsZXMsXHJcbiAgICAgIGJ1aWxkRm9yU2VydmVyOiB0cnVlLFxyXG4gICAgICBsaW50OiBmYWxzZSxcclxuICAgICAgYWxsSFRNTDogISggY2hpcHBlclZlcnNpb24ubWFqb3IgPT09IDAgJiYgY2hpcHBlclZlcnNpb24ubWlub3IgPT09IDAgJiYgYnJhbmRzWyAwIF0gIT09IGNvbnN0YW50cy5QSEVUX0JSQU5EIClcclxuICAgIH0gKTtcclxuICAgIHdpbnN0b24uZGVidWcoICdCdWlsZCBmaW5pc2hlZC4nICk7XHJcblxyXG4gICAgd2luc3Rvbi5kZWJ1ZyggYERlcGxveWluZyB0byBzZXJ2ZXJzOiAke0pTT04uc3RyaW5naWZ5KCBzZXJ2ZXJzICl9YCApO1xyXG5cclxuICAgIGNvbnN0IGNoZWNrb3V0RGlyID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggc2ltTmFtZSwgYnJhbmNoICk7XHJcbiAgICBjb25zdCBzaW1SZXBvRGlyID0gYCR7Y2hlY2tvdXREaXJ9LyR7c2ltTmFtZX1gO1xyXG4gICAgY29uc3QgYnVpbGREaXIgPSBgJHtzaW1SZXBvRGlyfS9idWlsZGA7XHJcblxyXG4gICAgaWYgKCBzZXJ2ZXJzLmluZGV4T2YoIGNvbnN0YW50cy5ERVZfU0VSVkVSICkgPj0gMCApIHtcclxuICAgICAgd2luc3Rvbi5pbmZvKCAnZGVwbG95aW5nIHRvIGRldicgKTtcclxuICAgICAgaWYgKCBicmFuZHMuaW5kZXhPZiggY29uc3RhbnRzLlBIRVRfSU9fQlJBTkQgKSA+PSAwICkge1xyXG4gICAgICAgIGNvbnN0IGh0YWNjZXNzTG9jYXRpb24gPSAoIGNoaXBwZXJWZXJzaW9uLm1ham9yID09PSAyICYmIGNoaXBwZXJWZXJzaW9uLm1pbm9yID09PSAwICkgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgJHtidWlsZERpcn0vcGhldC1pb2AgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWlsZERpcjtcclxuICAgICAgICBhd2FpdCB3cml0ZVBoZXRpb0h0YWNjZXNzKCBodGFjY2Vzc0xvY2F0aW9uLCB7XHJcbiAgICAgICAgICBjaGVja291dERpcjogY2hlY2tvdXREaXIsXHJcbiAgICAgICAgICBpc1Byb2R1Y3Rpb25EZXBsb3k6IGZhbHNlXHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcbiAgICAgIGF3YWl0IGRldkRlcGxveSggY2hlY2tvdXREaXIsIHNpbU5hbWUsIHZlcnNpb24sIGNoaXBwZXJWZXJzaW9uLCBicmFuZHMsIGJ1aWxkRGlyICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbG9jYWxlc0FycmF5ID0gdHlwZW9mICggbG9jYWxlcyApID09PSAnc3RyaW5nJyA/IGxvY2FsZXMuc3BsaXQoICcsJyApIDogbG9jYWxlcztcclxuXHJcbiAgICAvLyBpZiB0aGlzIGJ1aWxkIHJlcXVlc3QgY29tZXMgZnJvbSByb3NldHRhIGl0IHdpbGwgaGF2ZSBhIHVzZXJJZCBmaWVsZCBhbmQgb25seSBvbmUgbG9jYWxlXHJcbiAgICBjb25zdCBpc1RyYW5zbGF0aW9uUmVxdWVzdCA9IHVzZXJJZCAmJiBsb2NhbGVzQXJyYXkubGVuZ3RoID09PSAxICYmIGxvY2FsZXNBcnJheVsgMCBdICE9PSAnKic7XHJcblxyXG4gICAgaWYgKCBzZXJ2ZXJzLmluZGV4T2YoIGNvbnN0YW50cy5QUk9EVUNUSU9OX1NFUlZFUiApID49IDAgKSB7XHJcbiAgICAgIHdpbnN0b24uaW5mbyggJ2RlcGxveWluZyB0byBwcm9kdWN0aW9uJyApO1xyXG4gICAgICBsZXQgdGFyZ2V0VmVyc2lvbkRpcjtcclxuICAgICAgbGV0IHRhcmdldFNpbURpcjtcclxuXHJcbiAgICAgIC8vIExvb3Agb3ZlciBhbGwgYnJhbmRzXHJcbiAgICAgIGZvciAoIGNvbnN0IGkgaW4gYnJhbmRzICkge1xyXG4gICAgICAgIGlmICggYnJhbmRzLmhhc093blByb3BlcnR5KCBpICkgKSB7XHJcbiAgICAgICAgICBjb25zdCBicmFuZCA9IGJyYW5kc1sgaSBdO1xyXG4gICAgICAgICAgd2luc3Rvbi5pbmZvKCBgZGVwbG95aW5nIGJyYW5kOiAke2JyYW5kfWAgKTtcclxuICAgICAgICAgIC8vIFByZS1jb3B5IHN0ZXBzXHJcbiAgICAgICAgICBpZiAoIGJyYW5kID09PSBjb25zdGFudHMuUEhFVF9CUkFORCApIHtcclxuICAgICAgICAgICAgdGFyZ2V0U2ltRGlyID0gY29uc3RhbnRzLkhUTUxfU0lNU19ESVJFQ1RPUlkgKyBzaW1OYW1lO1xyXG4gICAgICAgICAgICB0YXJnZXRWZXJzaW9uRGlyID0gYCR7dGFyZ2V0U2ltRGlyfS8ke3ZlcnNpb259L2A7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGNoaXBwZXJWZXJzaW9uLm1ham9yID09PSAyICYmIGNoaXBwZXJWZXJzaW9uLm1pbm9yID09PSAwICkge1xyXG4gICAgICAgICAgICAgIC8vIFJlbW92ZSBfcGhldCBmcm9tIGFsbCBmaWxlbmFtZXMgaW4gdGhlIHBoZXQgZGlyZWN0b3J5XHJcbiAgICAgICAgICAgICAgY29uc3QgcGhldEJ1aWxkRGlyID0gYCR7YnVpbGREaXJ9L3BoZXRgO1xyXG4gICAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoIHBoZXRCdWlsZERpciApO1xyXG4gICAgICAgICAgICAgIGZvciAoIGNvbnN0IGkgaW4gZmlsZXMgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGZpbGVzLmhhc093blByb3BlcnR5KCBpICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVuYW1lID0gZmlsZXNbIGkgXTtcclxuICAgICAgICAgICAgICAgICAgaWYgKCBmaWxlbmFtZS5pbmRleE9mKCAnX3BoZXQnICkgPj0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdGaWxlbmFtZSA9IGZpbGVuYW1lLnJlcGxhY2UoICdfcGhldCcsICcnICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZXhlY3V0ZSggJ212JywgWyBmaWxlbmFtZSwgbmV3RmlsZW5hbWUgXSwgcGhldEJ1aWxkRGlyICk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2UgaWYgKCBicmFuZCA9PT0gY29uc3RhbnRzLlBIRVRfSU9fQlJBTkQgKSB7XHJcbiAgICAgICAgICAgIHRhcmdldFNpbURpciA9IGNvbnN0YW50cy5QSEVUX0lPX1NJTVNfRElSRUNUT1JZICsgc2ltTmFtZTtcclxuICAgICAgICAgICAgdGFyZ2V0VmVyc2lvbkRpciA9IGAke3RhcmdldFNpbURpcn0vJHtvcmlnaW5hbFZlcnNpb259YDtcclxuXHJcbiAgICAgICAgICAgIC8vIENoaXBwZXIgMS4wIGhhcyAtcGhldGlvIGluIHRoZSB2ZXJzaW9uIHNjaGVtYSBmb3IgUGhFVC1pTyBicmFuZGVkIHNpbXNcclxuICAgICAgICAgICAgaWYgKCBjaGlwcGVyVmVyc2lvbi5tYWpvciA9PT0gMCAmJiAhb3JpZ2luYWxWZXJzaW9uLm1hdGNoKCAnLXBoZXRpbycgKSApIHtcclxuICAgICAgICAgICAgICB0YXJnZXRWZXJzaW9uRGlyICs9ICctcGhldGlvJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0YXJnZXRWZXJzaW9uRGlyICs9ICcvJztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDb3B5IHN0ZXBzIC0gYWxsb3cgRUVYSVNUIGVycm9ycyBidXQgcmVqZWN0IGFueXRoaW5nIGVsc2VcclxuICAgICAgICAgIHdpbnN0b24uZGVidWcoIGBDcmVhdGluZyB2ZXJzaW9uIGRpcjogJHt0YXJnZXRWZXJzaW9uRGlyfWAgKTtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGZzLnByb21pc2VzLm1rZGlyKCB0YXJnZXRWZXJzaW9uRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9ICk7XHJcbiAgICAgICAgICAgIHdpbnN0b24uZGVidWcoICdTdWNjZXNzIGNyZWF0aW5nIHNpbSBkaXInICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjYXRjaCggZXJyICkge1xyXG4gICAgICAgICAgICBpZiAoIGVyci5jb2RlICE9PSAnRUVYSVNUJyApIHtcclxuICAgICAgICAgICAgICB3aW5zdG9uLmVycm9yKCAnRmFpbHVyZSBjcmVhdGluZyB2ZXJzaW9uIGRpcicgKTtcclxuICAgICAgICAgICAgICB3aW5zdG9uLmVycm9yKCBlcnIgKTtcclxuICAgICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGxldCBzb3VyY2VEaXIgPSBidWlsZERpcjtcclxuICAgICAgICAgIGlmICggY2hpcHBlclZlcnNpb24ubWFqb3IgPT09IDIgJiYgY2hpcHBlclZlcnNpb24ubWlub3IgPT09IDAgKSB7XHJcbiAgICAgICAgICAgIHNvdXJjZURpciArPSBgLyR7YnJhbmR9YDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKCAoIHJlc29sdmUsIHJlamVjdCApID0+IHtcclxuICAgICAgICAgICAgd2luc3Rvbi5kZWJ1ZyggYENvcHlpbmcgcmVjdXJzaXZlICR7c291cmNlRGlyfSB0byAke3RhcmdldFZlcnNpb25EaXJ9YCApO1xyXG4gICAgICAgICAgICBuZXcgcnN5bmMoKVxyXG4gICAgICAgICAgICAgIC5mbGFncyggJ3JhenBPJyApXHJcbiAgICAgICAgICAgICAgLnNldCggJ25vLXBlcm1zJyApXHJcbiAgICAgICAgICAgICAgLnNldCggJ2V4Y2x1ZGUnLCAnLnJzeW5jLWZpbHRlcicgKVxyXG4gICAgICAgICAgICAgIC5zb3VyY2UoIGAke3NvdXJjZURpcn0vYCApXHJcbiAgICAgICAgICAgICAgLmRlc3RpbmF0aW9uKCB0YXJnZXRWZXJzaW9uRGlyIClcclxuICAgICAgICAgICAgICAub3V0cHV0KCBzdGRvdXQgPT4geyB3aW5zdG9uLmRlYnVnKCBzdGRvdXQudG9TdHJpbmcoKSApOyB9LFxyXG4gICAgICAgICAgICAgICAgc3RkZXJyID0+IHsgd2luc3Rvbi5lcnJvciggc3RkZXJyLnRvU3RyaW5nKCkgKTsgfSApXHJcbiAgICAgICAgICAgICAgLmV4ZWN1dGUoICggZXJyLCBjb2RlLCBjbWQgKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGVyciAmJiBjb2RlICE9PSAyMyApIHtcclxuICAgICAgICAgICAgICAgICAgd2luc3Rvbi5kZWJ1ZyggY29kZSApO1xyXG4gICAgICAgICAgICAgICAgICB3aW5zdG9uLmRlYnVnKCBjbWQgKTtcclxuICAgICAgICAgICAgICAgICAgcmVqZWN0KCBlcnIgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgeyByZXNvbHZlKCk7IH1cclxuICAgICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgICAgd2luc3Rvbi5kZWJ1ZyggJ0NvcHkgZmluaXNoZWQnICk7XHJcblxyXG4gICAgICAgICAgLy8gUG9zdC1jb3B5IHN0ZXBzXHJcbiAgICAgICAgICBpZiAoIGJyYW5kID09PSBjb25zdGFudHMuUEhFVF9CUkFORCApIHtcclxuICAgICAgICAgICAgaWYgKCAhaXNUcmFuc2xhdGlvblJlcXVlc3QgKSB7XHJcbiAgICAgICAgICAgICAgYXdhaXQgZGVwbG95SW1hZ2VzKCB7XHJcbiAgICAgICAgICAgICAgICBzaW11bGF0aW9uOiBvcHRpb25zLnNpbU5hbWUsXHJcbiAgICAgICAgICAgICAgICBicmFuZHM6IG9wdGlvbnMuYnJhbmRzLFxyXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogb3B0aW9ucy52ZXJzaW9uXHJcbiAgICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF3YWl0IHdyaXRlUGhldEh0YWNjZXNzKCBzaW1OYW1lLCB2ZXJzaW9uICk7XHJcbiAgICAgICAgICAgIGF3YWl0IGNyZWF0ZVRyYW5zbGF0aW9uc1hNTCggc2ltTmFtZSwgdmVyc2lvbiwgY2hlY2tvdXREaXIgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgc2hvdWxkIGJlIHRoZSBsYXN0IGZ1bmN0aW9uIGNhbGxlZCBmb3IgdGhlIHBoZXQgYnJhbmQuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgdHJpZ2dlcnMgYW4gYXN5bmNyb25vdXMgdGFzayBvbiB0aGUgdG9tY2F0L3dpY2tldCBhcHBsaWNhdGlvbiBhbmQgb25seSB3YWl0cyBmb3IgYSByZXNwb25zZSB0aGF0IHRoZSByZXF1ZXN0IHdhcyByZWNlaXZlZC5cclxuICAgICAgICAgICAgLy8gRG8gbm90IGFzc3VtZSB0aGF0IHRoaXMgdGFzayBpcyBjb21wbGV0ZSBiZWNhdXNlIHdlIHVzZSBhd2FpdC5cclxuICAgICAgICAgICAgYXdhaXQgbm90aWZ5U2VydmVyKCB7XHJcbiAgICAgICAgICAgICAgc2ltTmFtZTogc2ltTmFtZSxcclxuICAgICAgICAgICAgICBlbWFpbDogZW1haWwsXHJcbiAgICAgICAgICAgICAgYnJhbmQ6IGJyYW5kLFxyXG4gICAgICAgICAgICAgIGxvY2FsZXM6IGxvY2FsZXMsXHJcbiAgICAgICAgICAgICAgdHJhbnNsYXRvcklkOiBpc1RyYW5zbGF0aW9uUmVxdWVzdCA/IHVzZXJJZCA6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmICggYnJhbmQgPT09IGNvbnN0YW50cy5QSEVUX0lPX0JSQU5EICkge1xyXG4gICAgICAgICAgICBjb25zdCBzdWZmaXggPSBvcmlnaW5hbFZlcnNpb24uc3BsaXQoICctJyApLmxlbmd0aCA+PSAyID8gb3JpZ2luYWxWZXJzaW9uLnNwbGl0KCAnLScgKVsgMSBdIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgKCBjaGlwcGVyVmVyc2lvbi5tYWpvciA8IDIgPyAncGhldGlvJyA6ICcnICk7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZFZlcnNpb24gPSBTaW1WZXJzaW9uLnBhcnNlKCB2ZXJzaW9uLCAnJyApO1xyXG4gICAgICAgICAgICBjb25zdCBzaW1QYWNrYWdlID0gYXdhaXQgbG9hZEpTT04oIGAke3NpbVJlcG9EaXJ9L3BhY2thZ2UuanNvbmAgKTtcclxuICAgICAgICAgICAgY29uc3QgaWdub3JlRm9yQXV0b21hdGVkTWFpbnRlbmFuY2VSZWxlYXNlcyA9ICEhKCBzaW1QYWNrYWdlICYmIHNpbVBhY2thZ2UucGhldCAmJiBzaW1QYWNrYWdlLnBoZXQuaWdub3JlRm9yQXV0b21hdGVkTWFpbnRlbmFuY2VSZWxlYXNlcyApO1xyXG5cclxuICAgICAgICAgICAgLy8gVGhpcyB0cmlnZ2VycyBhbiBhc3luY3Jvbm91cyB0YXNrIG9uIHRoZSB0b21jYXQvd2lja2V0IGFwcGxpY2F0aW9uIGFuZCBvbmx5IHdhaXRzIGZvciBhIHJlc3BvbnNlIHRoYXQgdGhlIHJlcXVlc3Qgd2FzIHJlY2VpdmVkLlxyXG4gICAgICAgICAgICAvLyBEbyBub3QgYXNzdW1lIHRoYXQgdGhpcyB0YXNrIGlzIGNvbXBsZXRlIGJlY2F1c2Ugd2UgdXNlIGF3YWl0LlxyXG4gICAgICAgICAgICBhd2FpdCBub3RpZnlTZXJ2ZXIoIHtcclxuICAgICAgICAgICAgICBzaW1OYW1lOiBzaW1OYW1lLFxyXG4gICAgICAgICAgICAgIGVtYWlsOiBlbWFpbCxcclxuICAgICAgICAgICAgICBicmFuZDogYnJhbmQsXHJcbiAgICAgICAgICAgICAgcGhldGlvT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgYnJhbmNoOiBicmFuY2gsXHJcbiAgICAgICAgICAgICAgICBzdWZmaXg6IHN1ZmZpeCxcclxuICAgICAgICAgICAgICAgIHZlcnNpb246IHBhcnNlZFZlcnNpb24sXHJcbiAgICAgICAgICAgICAgICBpZ25vcmVGb3JBdXRvbWF0ZWRNYWludGVuYW5jZVJlbGVhc2VzOiBpZ25vcmVGb3JBdXRvbWF0ZWRNYWludGVuYW5jZVJlbGVhc2VzXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgICAgICB3aW5zdG9uLmRlYnVnKCAnc2VydmVyIG5vdGlmaWVkJyApO1xyXG4gICAgICAgICAgICBhd2FpdCB3cml0ZVBoZXRpb0h0YWNjZXNzKCB0YXJnZXRWZXJzaW9uRGlyLCB7XHJcbiAgICAgICAgICAgICAgc2ltTmFtZTogc2ltTmFtZSxcclxuICAgICAgICAgICAgICB2ZXJzaW9uOiBvcmlnaW5hbFZlcnNpb24sXHJcbiAgICAgICAgICAgICAgZGlyZWN0b3J5OiBjb25zdGFudHMuUEhFVF9JT19TSU1TX0RJUkVDVE9SWSxcclxuICAgICAgICAgICAgICBjaGVja291dERpcjogY2hlY2tvdXREaXIsXHJcbiAgICAgICAgICAgICAgaXNQcm9kdWN0aW9uRGVwbG95OiB0cnVlXHJcbiAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGF3YWl0IGFmdGVyRGVwbG95KCBgJHtidWlsZERpcn1gICk7XHJcbiAgfVxyXG4gIGNhdGNoKCBlcnIgKSB7XHJcbiAgICBhd2FpdCBhYm9ydEJ1aWxkKCBlcnIgKTtcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdGFza1dvcmtlciggdGFzaywgdGFza0NhbGxiYWNrICkge1xyXG4gIHJ1blRhc2soIHRhc2sgKVxyXG4gICAgLnRoZW4oICgpID0+IHtcclxuICAgICAgICB0YXNrQ2FsbGJhY2soKTtcclxuICAgICAgfVxyXG4gICAgKS5jYXRjaCggcmVhc29uID0+IHtcclxuICAgIHRhc2tDYWxsYmFj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