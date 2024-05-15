"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
// Copyright 2002-2015, University of Colorado Boulder

/**
 * Grunt configuration file for tasks that have no dependencies on other repos.
 * In particular, grunt checkout-shas and grunt checkout-main can be run from here
 * without worrying about an older version of chipper being checked out.
 *
 * In general when possible, modules are imported lazily in their task
 * declaration to save on overall load time of this file. The pattern is to require all modules needed at the top of the
 * grunt task registration. If a module is used in multiple tasks, it is best to lazily require in each
 * task.
 */

///////////////////////////
// NOTE: to improve performance, the vast majority of modules are lazily imported in task registrations. Even duplicating
// require statements improves the load time of this file noticeably. For details, see https://github.com/phetsims/chipper/issues/1107
var assertIsValidRepoName = require('../common/assertIsValidRepoName');
var assert = require('assert');
var _ = require('lodash');
require('./checkNodeVersion');
///////////////////////////

module.exports = function (grunt) {
  if (grunt.option('debug')) {
    var winston = require('../../../../../../perennial-alias/node_modules/winston');
    winston["default"].transports.console.level = 'debug';
  }

  // If true, will skip most prompts, but will fail out on things that should not be done in an automated manner.
  var noninteractive = !!grunt.option('noninteractive');

  /**
   * Wraps a promise's completion with grunt's asynchronous handling, with added helpful failure messages (including stack traces, regardless of whether --stack was provided).
   * @public
   *
   * @param {Promise} promise
   */
  function wrap(_x) {
    return _wrap.apply(this, arguments);
  }
  /**
   * Wraps an async function for a grunt task. Will run the async function when the task should be executed. Will properly handle grunt's async handling, and provides improved
   * error reporting.
   * @public
   *
   * @param {async function} asyncTaskFunction
   */
  function _wrap() {
    _wrap = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee34(promise) {
      var done;
      return _regeneratorRuntime().wrap(function _callee34$(_context34) {
        while (1) switch (_context34.prev = _context34.next) {
          case 0:
            done = grunt.task.current.async();
            _context34.prev = 1;
            _context34.next = 4;
            return promise;
          case 4:
            _context34.next = 9;
            break;
          case 6:
            _context34.prev = 6;
            _context34.t0 = _context34["catch"](1);
            if (_context34.t0.stack) {
              grunt.fail.fatal("Perennial task failed:\n".concat(_context34.t0.stack, "\nFull Error details:\n").concat(_context34.t0));
            } else if (typeof _context34.t0 === 'string') {
              grunt.fail.fatal("Perennial task failed: ".concat(_context34.t0));
            } else {
              grunt.fail.fatal("Perennial task failed with unknown error: ".concat(_context34.t0));
            }
          case 9:
            done();
          case 10:
          case "end":
            return _context34.stop();
        }
      }, _callee34, null, [[1, 6]]);
    }));
    return _wrap.apply(this, arguments);
  }
  function wrapTask(asyncTaskFunction) {
    return function () {
      wrap(asyncTaskFunction());
    };
  }
  grunt.registerTask('checkout-shas', 'Check out shas for a project, as specified in dependencies.json\n' + '--repo : repository name where package.json should be read from\n' + '--skipNpmUpdate : If provided, will prevent the usual npm update\n' + '--buildServer : If provided, it will read dependencies from the build-server temporary location (and will skip npm update)', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
    var checkoutDependencies, buildServer, repo, dependencies, includeNpmUpdate;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          assert(grunt.option('repo'), 'Requires specifying a repository with --repo={{REPOSITORY}}');
          checkoutDependencies = require('../common/checkoutDependencies');
          buildServer = !!grunt.option('buildServer');
          repo = grunt.option('repo');
          assertIsValidRepoName(repo);
          dependencies = grunt.file.readJSON(buildServer ? '../perennial/js/build-server/tmp/dependencies.json' : "../".concat(repo, "/dependencies.json"));
          includeNpmUpdate = !grunt.option('skipNpmUpdate') && !buildServer;
          _context.next = 9;
          return checkoutDependencies(repo, dependencies, includeNpmUpdate);
        case 9:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }))));
  grunt.registerTask('checkout-target', 'Check out a specific branch/SHA for a simulation and all of its declared dependencies\n' + '--repo : repository name where package.json should be read from\n' + '--target : the branch/SHA to check out\n' + '--branch : alias for --target\n' + '--skipNpmUpdate : If provided, will prevent the usual npm update', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
    var repo, target, checkoutTarget;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          repo = grunt.option('repo');
          assert(repo, 'Requires specifying a repository with --repo={{REPOSITORY}}');
          assert(!(grunt.option('target') && grunt.option('branch')), '--target and --branch are the same option, only use one.');
          target = grunt.option('target') || grunt.option('branch');
          assert(target, 'Requires specifying a branch/SHA with --target={{BRANCH}}');
          assertIsValidRepoName(repo);
          checkoutTarget = require('../common/checkoutTarget');
          _context2.next = 9;
          return checkoutTarget(repo, target, !grunt.option('skipNpmUpdate'));
        case 9:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }))));
  grunt.registerTask('checkout-release', 'Check out the latest deployed production release branch for a simulation and all of its declared dependencies\n' + '--repo : repository name where package.json should be read from\n' + '--skipNpmUpdate : If provided, will prevent the usual npm update', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
    var checkoutRelease, repo;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          checkoutRelease = require('../common/checkoutRelease');
          repo = grunt.option('repo');
          assert(repo, 'Requires specifying a repository with --repo={{REPOSITORY}}');
          assertIsValidRepoName(repo);
          _context3.next = 6;
          return checkoutRelease(repo, !grunt.option('skipNpmUpdate'));
        case 6:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }))));
  grunt.registerTask('checkout-timestamp', 'Check out a specific timestamp for a simulation and all of its declared dependencies\n' + '--repo : repository name where package.json should be read from\n' + '--timestamp : the timestamp to check things out for, e.g. --timestamp="Jan 08 2018"\n' + '--skipNpmUpdate : If provided, will prevent the usual npm update', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
    var repo, checkoutTimestamp;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          repo = grunt.option('repo');
          assert(repo, 'Requires specifying a repository with --repo={{REPOSITORY}}');
          assert(grunt.option('timestamp'), 'Requires specifying a timestamp with --timestamp={{BRANCH}}');
          assertIsValidRepoName(repo);
          checkoutTimestamp = require('../common/checkoutTimestamp');
          _context4.next = 7;
          return checkoutTimestamp(repo, grunt.option('timestamp'), !grunt.option('skipNpmUpdate'));
        case 7:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }))));
  grunt.registerTask('checkout-main', 'Check out main branch for all dependencies, as specified in dependencies.json\n' + '--repo : repository name where package.json should be read from\n' + '--skipNpmUpdate : If provided, will prevent the usual npm update', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
    var repo, checkoutMain;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          repo = grunt.option('repo');
          assert(repo, 'Requires specifying a repository with --repo={{REPOSITORY}}');
          checkoutMain = require('../common/checkoutMain');
          assertIsValidRepoName(repo);
          _context5.next = 6;
          return checkoutMain(repo, !grunt.option('skipNpmUpdate'));
        case 6:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }))));
  grunt.registerTask('checkout-main-all', 'Check out main branch for all repos in git root', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
    var checkoutMainAll;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          checkoutMainAll = require('./checkoutMainAll');
          checkoutMainAll();
        case 2:
        case "end":
          return _context6.stop();
      }
    }, _callee6);
  }))));
  grunt.registerTask('sha-check', 'Checks which simulations\' latest release version includes the given common-code SHA in its git tree.\n' + '--repo : repository to check for the SHA\n' + '--sha : git SHA', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7() {
    var repo, shaCheck;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          repo = grunt.option('repo');
          assertIsValidRepoName(repo);
          shaCheck = require('./shaCheck');
          _context7.next = 5;
          return shaCheck(repo, grunt.option('sha'));
        case 5:
        case "end":
          return _context7.stop();
      }
    }, _callee7);
  }))));
  grunt.registerTask('print-phet-io-links', 'Print the current list of all phet-io sims\' links', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8() {
    var getPhetioLinks, phetioLinks;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          getPhetioLinks = require('../common/getPhetioLinks');
          _context8.next = 3;
          return getPhetioLinks();
        case 3:
          phetioLinks = _context8.sent;
          console.log('Latest Links:');
          console.log("\n".concat(phetioLinks.join('\n')));
        case 6:
        case "end":
          return _context8.stop();
      }
    }, _callee8);
  }))));
  grunt.registerTask('update-gh-pages', 'Updates the gh-pages branches for various repos, including building of dot/kite/scenery', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9() {
    var updateGithubPages;
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          updateGithubPages = require('../common/updateGithubPages');
          _context9.next = 3;
          return updateGithubPages();
        case 3:
        case "end":
          return _context9.stop();
      }
    }, _callee9);
  }))));
  grunt.registerTask('sim-list', 'Prints out a list of live production HTML sims to stderr (can be filtered from other stdout output)\n' + '--versions : Outputs the sim version after its name.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10() {
    var simMetadata, winston, data;
    return _regeneratorRuntime().wrap(function _callee10$(_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          simMetadata = require('../common/simMetadata');
          winston = require('../../../../../../perennial-alias/node_modules/winston');
          winston["default"].transports.console.level = 'error';
          _context10.next = 5;
          return simMetadata({
            type: 'html'
          });
        case 5:
          data = _context10.sent;
          console.error(data.projects.map(function (project) {
            var name = project.name.slice(project.name.indexOf('/') + 1);
            var result = name;
            if (grunt.option('versions')) {
              result += " ".concat(project.version.major, ".").concat(project.version.minor, ".").concat(project.version.dev);
            }
            return result;
          }).join('\n'));
        case 7:
        case "end":
          return _context10.stop();
      }
    }, _callee10);
  }))));
  grunt.registerTask('release-branch-list', 'Prints out a list of all release branches that would need maintenance patches\n' + '--repo : Only show branches for a specific repository\n' + '--order=<ORDER> : alphabetical|date', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11() {
    var Maintenance, winston, repo, order, branches, structures, _iterator, _step, branch, _iterator2, _step2, struct;
    return _regeneratorRuntime().wrap(function _callee11$(_context11) {
      while (1) switch (_context11.prev = _context11.next) {
        case 0:
          Maintenance = require('../common/Maintenance');
          winston = require('../../../../../../perennial-alias/node_modules/winston');
          winston["default"].transports.console.level = 'error';
          repo = grunt.option('repo');
          order = grunt.option('order') || 'alphabetical';
          if (repo) {
            assertIsValidRepoName(repo);
          }
          assert(order === 'alphabetical' || order === 'date');
          _context11.next = 9;
          return Maintenance.getMaintenanceBranches(function (releaseBranch) {
            return !repo || releaseBranch.repo === repo;
          }, true, true);
        case 9:
          branches = _context11.sent;
          structures = [];
          _iterator = _createForOfIteratorHelper(branches);
          _context11.prev = 12;
          _iterator.s();
        case 14:
          if ((_step = _iterator.n()).done) {
            _context11.next = 25;
            break;
          }
          branch = _step.value;
          _context11.t0 = structures;
          _context11.t1 = branch;
          _context11.next = 20;
          return branch.getDivergingTimestamp();
        case 20:
          _context11.t2 = _context11.sent;
          _context11.t3 = {
            branch: _context11.t1,
            timestamp: _context11.t2
          };
          _context11.t0.push.call(_context11.t0, _context11.t3);
        case 23:
          _context11.next = 14;
          break;
        case 25:
          _context11.next = 30;
          break;
        case 27:
          _context11.prev = 27;
          _context11.t4 = _context11["catch"](12);
          _iterator.e(_context11.t4);
        case 30:
          _context11.prev = 30;
          _iterator.f();
          return _context11.finish(30);
        case 33:
          if (order === 'date') {
            structures = _.sortBy(structures, function (struct) {
              return struct.timestamp;
            });
          }
          console.log('\nRelease branches:\n{repo} {branch} {brand[,brand]+} {date}\n');
          _iterator2 = _createForOfIteratorHelper(structures);
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              struct = _step2.value;
              console.log("".concat(struct.branch.toString(), " ").concat(new Date(struct.timestamp).toISOString().split('T')[0]));
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        case 37:
        case "end":
          return _context11.stop();
      }
    }, _callee11, null, [[12, 27, 30, 33]]);
  }))));
  grunt.registerTask('npm-update', 'Runs npm update/prune for chipper, perennial-alias and the given repository\n' + '--repo : The repository to update', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee12() {
    var npmUpdate, repo;
    return _regeneratorRuntime().wrap(function _callee12$(_context12) {
      while (1) switch (_context12.prev = _context12.next) {
        case 0:
          npmUpdate = require('../common/npmUpdate');
          repo = grunt.option('repo');
          assert(repo, 'Requires specifying a repository with --repo={{REPOSITORY}}');
          assertIsValidRepoName(repo);
          _context12.next = 6;
          return npmUpdate(repo).then(function () {
            return npmUpdate('chipper');
          }).then(function () {
            return npmUpdate('perennial-alias');
          });
        case 6:
        case "end":
          return _context12.stop();
      }
    }, _callee12);
  }))));
  grunt.registerTask('create-release', 'Creates a new release branch for a given simulation\n' + '--repo : The repository to add the release branch to\n' + '--branch : The branch name, which should be {{MAJOR}}.{{MINOR}}, e.g. 1.0\n' + '--brands : The supported brands for the release, comma separated.\n' + '--message : An optional message that will be appended on version-change commits.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee13() {
    var createRelease, repo, branch, message, brands;
    return _regeneratorRuntime().wrap(function _callee13$(_context13) {
      while (1) switch (_context13.prev = _context13.next) {
        case 0:
          createRelease = require('./createRelease');
          repo = grunt.option('repo');
          assertIsValidRepoName(repo);
          branch = grunt.option('branch');
          message = grunt.option('message');
          brands = grunt.option('brands');
          assert(repo, 'Requires specifying a repository with --repo={{REPOSITORY}}');
          assert(brands, 'Requires specifying brands with --brands={{BRANDS}} (comma separated)');
          assert(branch, 'Requires specifying a branch with --branch={{BRANCH}}');
          assert(branch.split('.').length === 2, 'Branch should be {{MAJOR}}.{{MINOR}}');
          _context13.next = 12;
          return createRelease(repo, branch, brands.split(','), message);
        case 12:
        case "end":
          return _context13.stop();
      }
    }, _callee13);
  }))));
  grunt.registerTask('create-one-off', 'Creates a new release branch for a given simulation\n' + '--repo : The repository to add the release branch to\n' + '--branch : The branch/one-off name, which should be anything without dashes or periods\n' + '--message : An optional message that will be appended on version-change commits.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee14() {
    var createOneOff, repo, branch, message;
    return _regeneratorRuntime().wrap(function _callee14$(_context14) {
      while (1) switch (_context14.prev = _context14.next) {
        case 0:
          createOneOff = require('./createOneOff');
          repo = grunt.option('repo');
          assertIsValidRepoName(repo);
          branch = grunt.option('branch');
          message = grunt.option('message');
          assert(repo, 'Requires specifying a repository with --repo={{REPOSITORY}}');
          assert(branch, 'Requires specifying a branch with --branch={{BRANCH}}');
          assert(!branch.includes('-') && !branch.includes('.'), 'Branch should not contain dashes or periods');
          _context14.next = 10;
          return createOneOff(repo, branch, message);
        case 10:
        case "end":
          return _context14.stop();
      }
    }, _callee14);
  }))));
  grunt.registerTask('cherry-pick', 'Runs cherry-pick on a list of SHAs until one works. Reports success or failure\n' + '--repo : The repository to cherry-pick on\n' + '--shas : Comma-separated list of SHAs to try', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee15() {
    var cherryPick, repo, shas;
    return _regeneratorRuntime().wrap(function _callee15$(_context15) {
      while (1) switch (_context15.prev = _context15.next) {
        case 0:
          cherryPick = require('./cherryPick');
          repo = grunt.option('repo');
          assert(repo, 'Requires specifying a repository with --repo={{REPOSITORY}}');
          assert(grunt.option('shas'), 'Requires specifying a comma-separated list of SHAs with --shas={{SHAS}}');
          assertIsValidRepoName(repo);
          shas = grunt.option('shas').split(',');
          _context15.next = 8;
          return cherryPick(repo, shas);
        case 8:
        case "end":
          return _context15.stop();
      }
    }, _callee15);
  }))));
  grunt.registerTask('lint', 'Lints this repository only', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee16() {
    var execute, gruntCommand, index, tail;
    return _regeneratorRuntime().wrap(function _callee16$(_context16) {
      while (1) switch (_context16.prev = _context16.next) {
        case 0:
          execute = require('../common/execute');
          gruntCommand = require('../common/gruntCommand');
          index = process.argv.indexOf('lint');
          assert && assert(index >= 0, 'lint command does not appear');
          tail = process.argv.slice(index + 1);
          if (!grunt.option('repos')) {
            tail.push('--repos=perennial');
          }

          // Forward to chipper, supporting all of the options
          _context16.t0 = grunt.log;
          _context16.next = 9;
          return execute(gruntCommand, ['lint'].concat(_toConsumableArray(tail)), '../chipper', {
            errors: 'resolve'
          });
        case 9:
          _context16.t1 = _context16.sent.stdout;
          _context16.t0.writeln.call(_context16.t0, _context16.t1);
        case 11:
        case "end":
          return _context16.stop();
      }
    }, _callee16);
  }))));
  grunt.registerTask('dev', 'Deploys a dev version of the simulation\n' + '--repo : The name of the repository to deploy\n' + '--brands : A comma-separated list of brand names to deploy\n' + '--noninteractive : If specified, prompts will be skipped. Some prompts that should not be automated will fail out\n' + '--message : An optional message that will be appended on version-change commits.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee17() {
    var dev, repo;
    return _regeneratorRuntime().wrap(function _callee17$(_context17) {
      while (1) switch (_context17.prev = _context17.next) {
        case 0:
          dev = require('./dev');
          assert(grunt.option('repo'), 'Requires specifying a repository with --repo={{REPOSITORY}}');
          assert(grunt.option('brands'), 'Requires specifying brands (comma-separated) with --brands={{BRANDS}}');
          repo = grunt.option('repo');
          assertIsValidRepoName(repo);
          _context17.next = 7;
          return dev(repo, grunt.option('brands').split(','), noninteractive, 'main', grunt.option('message'));
        case 7:
        case "end":
          return _context17.stop();
      }
    }, _callee17);
  }))));
  grunt.registerTask('deploy-images', 'Rebuilds all images\n' + '--simulation : Optional. If present, only the given simulation will receive images from main. If absent, all sims' + 'will receive images from main.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee18() {
    var simulation, deployImages;
    return _regeneratorRuntime().wrap(function _callee18$(_context18) {
      while (1) switch (_context18.prev = _context18.next) {
        case 0:
          console.log(grunt.option('simulation'));
          simulation = grunt.option('simulation') || null;
          deployImages = require('./deployImages');
          _context18.next = 5;
          return deployImages({
            simulation: simulation
          });
        case 5:
        case "end":
          return _context18.stop();
      }
    }, _callee18);
  }))));
  grunt.registerTask('one-off', 'Deploys a one-off version of the simulation (using the current or specified branch)\n' + '--repo : The name of the repository to deploy\n' + '--branch : The name of the one-off branch (the name of the one-off)\n' + '--brands : A comma-separated list of brand names to deploy\n' + '--noninteractive : If specified, prompts will be skipped. Some prompts that should not be automated will fail out\n' + '--message : An optional message that will be appended on version-change commits.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee19() {
    var getBranch, dev, repo, brands, branch;
    return _regeneratorRuntime().wrap(function _callee19$(_context19) {
      while (1) switch (_context19.prev = _context19.next) {
        case 0:
          getBranch = require('../common/getBranch');
          dev = require('./dev');
          repo = grunt.option('repo');
          assertIsValidRepoName(repo);
          brands = grunt.option('brands');
          assert(repo, 'Requires specifying a repository with --repo={{REPOSITORY}}');
          assert(brands, 'Requires specifying brands (comma-separated) with --brands={{BRANDS}}');
          branch = grunt.option('branch');
          if (branch) {
            _context19.next = 13;
            break;
          }
          _context19.next = 11;
          return getBranch(repo);
        case 11:
          branch = _context19.sent;
          console.log("--branch not provided, using ".concat(branch, " detected from ").concat(repo));
        case 13:
          assert(branch !== 'main', 'One-off deploys for main are unsupported.');
          _context19.next = 16;
          return dev(repo, brands.split(','), noninteractive, branch, grunt.option('message'));
        case 16:
        case "end":
          return _context19.stop();
      }
    }, _callee19);
  }))));
  grunt.registerTask('rc', 'Deploys an rc version of the simulation\n' + '--repo : The name of the repository to deploy\n' + '--branch : The release branch name (e.g. "1.7") that should be used for deployment\n' + '--brands : A comma-separated list of brand names to deploy\n' + '--noninteractive : If specified, prompts will be skipped. Some prompts that should not be automated will fail out\n' + '--message : An optional message that will be appended on version-change commits.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee20() {
    var repo, rc;
    return _regeneratorRuntime().wrap(function _callee20$(_context20) {
      while (1) switch (_context20.prev = _context20.next) {
        case 0:
          assert(grunt.option('repo'), 'Requires specifying a repository with --repo={{REPOSITORY}}');
          assert(grunt.option('branch'), 'Requires specifying a branch with --branch={{BRANCH}}');
          assert(grunt.option('brands'), 'Requires specifying brands (comma-separated) with --brands={{BRANDS}}');
          repo = grunt.option('repo');
          assertIsValidRepoName(repo);
          rc = require('./rc');
          _context20.next = 8;
          return rc(repo, grunt.option('branch'), grunt.option('brands').split(','), noninteractive, grunt.option('message'));
        case 8:
        case "end":
          return _context20.stop();
      }
    }, _callee20);
  }))));
  grunt.registerTask('production', 'Marks a simulation as published, and deploys a production version of the simulation\n' + '--repo : The name of the repository to deploy\n' + '--branch : The release branch name (e.g. "1.7") that should be used for deployment\n' + '--brands : A comma-separated list of brand names to deploy\n' + '--noninteractive : If specified, prompts will be skipped. Some prompts that should not be automated will fail out\n' + '--redeploy: If specified with noninteractive, allow the production deploy to have the same version as the previous deploy\n' + '--message : An optional message that will be appended on version-change commits.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee21() {
    var production, markSimAsPublished, repo;
    return _regeneratorRuntime().wrap(function _callee21$(_context21) {
      while (1) switch (_context21.prev = _context21.next) {
        case 0:
          production = require('./production');
          markSimAsPublished = require('../common/markSimAsPublished');
          assert(grunt.option('repo'), 'Requires specifying a repository with --repo={{REPOSITORY}}');
          assert(grunt.option('branch'), 'Requires specifying a branch with --branch={{BRANCH}}');
          assert(grunt.option('brands'), 'Requires specifying brands (comma-separated) with --brands={{BRANDS}}');
          repo = grunt.option('repo');
          assertIsValidRepoName(repo);
          _context21.next = 9;
          return markSimAsPublished(repo);
        case 9:
          _context21.next = 11;
          return production(repo, grunt.option('branch'), grunt.option('brands').split(','), noninteractive, grunt.option('redeploy'), grunt.option('message'));
        case 11:
        case "end":
          return _context21.stop();
      }
    }, _callee21);
  }))));
  grunt.registerTask('prototype', 'Deploys a production (prototype) version of the simulation\n' + '--repo : The name of the repository to deploy\n' + '--branch : The release branch name (e.g. "1.7") that should be used for deployment\n' + '--brands : A comma-separated list of brand names to deploy\n' + '--noninteractive : If specified, prompts will be skipped. Some prompts that should not be automated will fail out\n' + '--redeploy: If specified with noninteractive, allow the production deploy to have the same version as the previous deploy\n' + '--message : An optional message that will be appended on version-change commits.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee22() {
    var production, repo;
    return _regeneratorRuntime().wrap(function _callee22$(_context22) {
      while (1) switch (_context22.prev = _context22.next) {
        case 0:
          production = require('./production');
          assert(grunt.option('repo'), 'Requires specifying a repository with --repo={{REPOSITORY}}');
          assert(grunt.option('branch'), 'Requires specifying a branch with --branch={{BRANCH}}');
          assert(grunt.option('brands'), 'Requires specifying brands (comma-separated) with --brands={{BRANDS}}');
          repo = grunt.option('repo');
          assertIsValidRepoName(repo);
          _context22.next = 8;
          return production(repo, grunt.option('branch'), grunt.option('brands').split(','), noninteractive, grunt.option('redeploy'), grunt.option('message'));
        case 8:
        case "end":
          return _context22.stop();
      }
    }, _callee22);
  }))));
  grunt.registerTask('deploy-decaf', 'Deploys a decaf version of the simulation\n' + '--project : The name of the project to deploy', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee23() {
    var deployDecaf;
    return _regeneratorRuntime().wrap(function _callee23$(_context23) {
      while (1) switch (_context23.prev = _context23.next) {
        case 0:
          deployDecaf = require('./decaf/deployDecaf');
          assert(grunt.option('project'), 'Requires specifying a repository with --project={{PROJECT}}');
          assert(grunt.option('dev') || grunt.option('production'), 'Requires at least one of --dev or --production');
          _context23.next = 5;
          return deployDecaf(grunt.option('project'), !!grunt.option('dev'), !!grunt.option('production'));
        case 5:
        case "end":
          return _context23.stop();
      }
    }, _callee23);
  }))));
  grunt.registerTask('build-decaf', 'Builds a decaf version of the simulation\n' + '--project : The name of the project to deploy', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee24() {
    var buildDecaf;
    return _regeneratorRuntime().wrap(function _callee24$(_context24) {
      while (1) switch (_context24.prev = _context24.next) {
        case 0:
          buildDecaf = require('./decaf/buildDecaf');
          assert(grunt.option('project'), 'Requires specifying a repository with --project={{PROJECT}}');
          _context24.next = 4;
          return buildDecaf(grunt.option('project'), grunt.option('preloadResources'));
        case 4:
        case "end":
          return _context24.stop();
      }
    }, _callee24);
  }))));
  grunt.registerTask('create-sim', 'Creates a sim based on the simula-rasa template.\n' + '--repo="string" : the repository name\n' + '--author="string" : the author name\n' + '--title="string" : (optional) the simulation title\n' + '--clean=true : (optional) deletes the repository directory if it exists', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee25() {
    var createSim, repo, author, title, clean;
    return _regeneratorRuntime().wrap(function _callee25$(_context25) {
      while (1) switch (_context25.prev = _context25.next) {
        case 0:
          createSim = require('./createSim');
          repo = grunt.option('repo');
          assertIsValidRepoName(repo);
          author = grunt.option('author');
          title = grunt.option('title');
          clean = grunt.option('clean');
          assert(repo, 'Requires specifying a repository name with --repo={{REPO}}');
          assert(grunt.option('author'), 'Requires specifying a author with --author={{AUTHOR}}');
          _context25.next = 10;
          return createSim(repo, author, {
            title: title,
            clean: clean
          });
        case 10:
        case "end":
          return _context25.stop();
      }
    }, _callee25);
  }))));
  grunt.registerTask('lint-everything', 'lint all js files for all repos', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee26() {
    var getDataFile, cache, activeRepos, fix, chipAway, showProgressBar, lint, lintReturnValue;
    return _regeneratorRuntime().wrap(function _callee26$(_context26) {
      while (1) switch (_context26.prev = _context26.next) {
        case 0:
          getDataFile = require('../common/getDataFile'); // --disable-eslint-cache disables the cache, useful for developing rules
          cache = !grunt.option('disable-eslint-cache');
          activeRepos = getDataFile('active-repos').filter(function (repo) {
            return repo !== 'perennial-alias';
          }); // remove duplicate perennial copy
          fix = grunt.option('fix');
          chipAway = grunt.option('chip-away');
          showProgressBar = !grunt.option('hide-progress-bar');
          try {
            lint = require('../../../chipper/js/grunt/lint');
          } catch (e) {
            console.log('lint process not found, is your chipper repo up to date?');
            lint = {};
          }

          // The APIs are the same for these two versions of lint support
          if (!(lint.chipperAPIVersion === 'promisesPerRepo1' || lint.chipperAPIVersion === 'npx')) {
            _context26.next = 12;
            break;
          }
          _context26.next = 10;
          return lint(activeRepos, {
            cache: cache,
            fix: fix,
            chipAway: chipAway,
            showProgressBar: showProgressBar
          });
        case 10:
          lintReturnValue = _context26.sent;
          // Output results on errors.
          if (!lintReturnValue.ok) {
            grunt.fail.fatal('Lint failed');
          }
        case 12:
        case "end":
          return _context26.stop();
      }
    }, _callee26);
  }))));
  grunt.registerTask('generate-data', 'Generates the lists under perennial/data/, and if there were changes, will commit and push.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee27() {
    var generateData;
    return _regeneratorRuntime().wrap(function _callee27$(_context27) {
      while (1) switch (_context27.prev = _context27.next) {
        case 0:
          generateData = require('./generateData');
          _context27.next = 3;
          return generateData(grunt);
        case 3:
        case "end":
          return _context27.stop();
      }
    }, _callee27);
  }))));
  grunt.registerTask('clone-missing-repos', 'Clones missing repos', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee28() {
    var cloneMissingRepos;
    return _regeneratorRuntime().wrap(function _callee28$(_context28) {
      while (1) switch (_context28.prev = _context28.next) {
        case 0:
          cloneMissingRepos = require('../common/cloneMissingRepos');
          _context28.next = 3;
          return cloneMissingRepos();
        case 3:
        case "end":
          return _context28.stop();
      }
    }, _callee28);
  }))));
  grunt.registerTask('maintenance', 'Starts a maintenance REPL', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee29() {
    var Maintenance;
    return _regeneratorRuntime().wrap(function _callee29$(_context29) {
      while (1) switch (_context29.prev = _context29.next) {
        case 0:
          Maintenance = require('../common/Maintenance');
          _context29.next = 3;
          return Maintenance.startREPL();
        case 3:
        case "end":
          return _context29.stop();
      }
    }, _callee29);
  }))));
  grunt.registerTask('maintenance-check-branch-status', 'Reports out on release branch statuses', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee30() {
    var Maintenance, winston;
    return _regeneratorRuntime().wrap(function _callee30$(_context30) {
      while (1) switch (_context30.prev = _context30.next) {
        case 0:
          Maintenance = require('../common/Maintenance');
          winston = require('../../../../../../perennial-alias/node_modules/winston');
          winston["default"].transports.console.level = 'error';
          _context30.next = 5;
          return Maintenance.checkBranchStatus();
        case 5:
        case "end":
          return _context30.stop();
      }
    }, _callee30);
  }))));
  grunt.registerTask('maintenance-list', 'Lists out the current maintenance process state', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee31() {
    var Maintenance;
    return _regeneratorRuntime().wrap(function _callee31$(_context31) {
      while (1) switch (_context31.prev = _context31.next) {
        case 0:
          Maintenance = require('../common/Maintenance');
          _context31.next = 3;
          return Maintenance.list();
        case 3:
        case "end":
          return _context31.stop();
      }
    }, _callee31);
  }))));
  grunt.registerTask('maintenance-create-patch', 'Adds a patch to the maintenance process', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee32() {
    var Maintenance, repo, message;
    return _regeneratorRuntime().wrap(function _callee32$(_context32) {
      while (1) switch (_context32.prev = _context32.next) {
        case 0:
          Maintenance = require('../common/Maintenance');
          repo = grunt.option('repo');
          assertIsValidRepoName(repo);
          message = grunt.option('message');
          assert(repo, 'Requires specifying a repo that will need to be patched with --repo={{REPO}}');
          assert(grunt.option('message'), 'Requires specifying a message (included with commits) with --message={{MESSAGE}}');
          _context32.next = 8;
          return Maintenance.createPatch(repo, message);
        case 8:
        case "end":
          return _context32.stop();
      }
    }, _callee32);
  }))));
  grunt.registerTask('reopen-issues-from-todos', 'If there is a TODO in the project pointing to a closed issue, reopen it.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee33() {
    return _regeneratorRuntime().wrap(function _callee33$(_context33) {
      while (1) switch (_context33.prev = _context33.next) {
        case 0:
          _context33.next = 2;
          return require('./reopenIssuesFromTODOs')();
        case 2:
        case "end":
          return _context33.stop();
      }
    }, _callee33);
  }))));
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVnZW5lcmF0b3JSdW50aW1lIiwiZSIsInQiLCJyIiwiT2JqZWN0IiwicHJvdG90eXBlIiwibiIsImhhc093blByb3BlcnR5IiwibyIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJpIiwiU3ltYm9sIiwiYSIsIml0ZXJhdG9yIiwiYyIsImFzeW5jSXRlcmF0b3IiLCJ1IiwidG9TdHJpbmdUYWciLCJkZWZpbmUiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ3cmFwIiwiR2VuZXJhdG9yIiwiY3JlYXRlIiwiQ29udGV4dCIsIm1ha2VJbnZva2VNZXRob2QiLCJ0cnlDYXRjaCIsInR5cGUiLCJhcmciLCJjYWxsIiwiaCIsImwiLCJmIiwicyIsInkiLCJHZW5lcmF0b3JGdW5jdGlvbiIsIkdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlIiwicCIsImQiLCJnZXRQcm90b3R5cGVPZiIsInYiLCJ2YWx1ZXMiLCJnIiwiZGVmaW5lSXRlcmF0b3JNZXRob2RzIiwiZm9yRWFjaCIsIl9pbnZva2UiLCJBc3luY0l0ZXJhdG9yIiwiaW52b2tlIiwiX3R5cGVvZiIsInJlc29sdmUiLCJfX2F3YWl0IiwidGhlbiIsImNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnIiwiRXJyb3IiLCJkb25lIiwibWV0aG9kIiwiZGVsZWdhdGUiLCJtYXliZUludm9rZURlbGVnYXRlIiwic2VudCIsIl9zZW50IiwiZGlzcGF0Y2hFeGNlcHRpb24iLCJhYnJ1cHQiLCJUeXBlRXJyb3IiLCJyZXN1bHROYW1lIiwibmV4dCIsIm5leHRMb2MiLCJwdXNoVHJ5RW50cnkiLCJ0cnlMb2MiLCJjYXRjaExvYyIsImZpbmFsbHlMb2MiLCJhZnRlckxvYyIsInRyeUVudHJpZXMiLCJwdXNoIiwicmVzZXRUcnlFbnRyeSIsImNvbXBsZXRpb24iLCJyZXNldCIsImlzTmFOIiwibGVuZ3RoIiwiZGlzcGxheU5hbWUiLCJpc0dlbmVyYXRvckZ1bmN0aW9uIiwiY29uc3RydWN0b3IiLCJuYW1lIiwibWFyayIsInNldFByb3RvdHlwZU9mIiwiX19wcm90b19fIiwiYXdyYXAiLCJhc3luYyIsIlByb21pc2UiLCJrZXlzIiwicmV2ZXJzZSIsInBvcCIsInByZXYiLCJjaGFyQXQiLCJzbGljZSIsInN0b3AiLCJydmFsIiwiaGFuZGxlIiwiY29tcGxldGUiLCJmaW5pc2giLCJfY2F0Y2giLCJkZWxlZ2F0ZVlpZWxkIiwiYXN5bmNHZW5lcmF0b3JTdGVwIiwiZ2VuIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJpbmZvIiwiZXJyb3IiLCJfYXN5bmNUb0dlbmVyYXRvciIsImZuIiwic2VsZiIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsImVyciIsInVuZGVmaW5lZCIsImFzc2VydElzVmFsaWRSZXBvTmFtZSIsInJlcXVpcmUiLCJhc3NlcnQiLCJfIiwibW9kdWxlIiwiZXhwb3J0cyIsImdydW50Iiwib3B0aW9uIiwid2luc3RvbiIsInRyYW5zcG9ydHMiLCJjb25zb2xlIiwibGV2ZWwiLCJub25pbnRlcmFjdGl2ZSIsIl94IiwiX3dyYXAiLCJfY2FsbGVlMzQiLCJwcm9taXNlIiwiX2NhbGxlZTM0JCIsIl9jb250ZXh0MzQiLCJ0YXNrIiwiY3VycmVudCIsInQwIiwic3RhY2siLCJmYWlsIiwiZmF0YWwiLCJjb25jYXQiLCJ3cmFwVGFzayIsImFzeW5jVGFza0Z1bmN0aW9uIiwicmVnaXN0ZXJUYXNrIiwiX2NhbGxlZSIsImNoZWNrb3V0RGVwZW5kZW5jaWVzIiwiYnVpbGRTZXJ2ZXIiLCJyZXBvIiwiZGVwZW5kZW5jaWVzIiwiaW5jbHVkZU5wbVVwZGF0ZSIsIl9jYWxsZWUkIiwiX2NvbnRleHQiLCJmaWxlIiwicmVhZEpTT04iLCJfY2FsbGVlMiIsInRhcmdldCIsImNoZWNrb3V0VGFyZ2V0IiwiX2NhbGxlZTIkIiwiX2NvbnRleHQyIiwiX2NhbGxlZTMiLCJjaGVja291dFJlbGVhc2UiLCJfY2FsbGVlMyQiLCJfY29udGV4dDMiLCJfY2FsbGVlNCIsImNoZWNrb3V0VGltZXN0YW1wIiwiX2NhbGxlZTQkIiwiX2NvbnRleHQ0IiwiX2NhbGxlZTUiLCJjaGVja291dE1haW4iLCJfY2FsbGVlNSQiLCJfY29udGV4dDUiLCJfY2FsbGVlNiIsImNoZWNrb3V0TWFpbkFsbCIsIl9jYWxsZWU2JCIsIl9jb250ZXh0NiIsIl9jYWxsZWU3Iiwic2hhQ2hlY2siLCJfY2FsbGVlNyQiLCJfY29udGV4dDciLCJfY2FsbGVlOCIsImdldFBoZXRpb0xpbmtzIiwicGhldGlvTGlua3MiLCJfY2FsbGVlOCQiLCJfY29udGV4dDgiLCJsb2ciLCJqb2luIiwiX2NhbGxlZTkiLCJ1cGRhdGVHaXRodWJQYWdlcyIsIl9jYWxsZWU5JCIsIl9jb250ZXh0OSIsIl9jYWxsZWUxMCIsInNpbU1ldGFkYXRhIiwiZGF0YSIsIl9jYWxsZWUxMCQiLCJfY29udGV4dDEwIiwicHJvamVjdHMiLCJtYXAiLCJwcm9qZWN0IiwiaW5kZXhPZiIsInJlc3VsdCIsInZlcnNpb24iLCJtYWpvciIsIm1pbm9yIiwiZGV2IiwiX2NhbGxlZTExIiwiTWFpbnRlbmFuY2UiLCJvcmRlciIsImJyYW5jaGVzIiwic3RydWN0dXJlcyIsIl9pdGVyYXRvciIsIl9zdGVwIiwiYnJhbmNoIiwiX2l0ZXJhdG9yMiIsIl9zdGVwMiIsInN0cnVjdCIsIl9jYWxsZWUxMSQiLCJfY29udGV4dDExIiwiZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcyIsInJlbGVhc2VCcmFuY2giLCJfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlciIsInQxIiwiZ2V0RGl2ZXJnaW5nVGltZXN0YW1wIiwidDIiLCJ0MyIsInRpbWVzdGFtcCIsInQ0Iiwic29ydEJ5IiwidG9TdHJpbmciLCJEYXRlIiwidG9JU09TdHJpbmciLCJzcGxpdCIsIl9jYWxsZWUxMiIsIm5wbVVwZGF0ZSIsIl9jYWxsZWUxMiQiLCJfY29udGV4dDEyIiwiX2NhbGxlZTEzIiwiY3JlYXRlUmVsZWFzZSIsIm1lc3NhZ2UiLCJicmFuZHMiLCJfY2FsbGVlMTMkIiwiX2NvbnRleHQxMyIsIl9jYWxsZWUxNCIsImNyZWF0ZU9uZU9mZiIsIl9jYWxsZWUxNCQiLCJfY29udGV4dDE0IiwiaW5jbHVkZXMiLCJfY2FsbGVlMTUiLCJjaGVycnlQaWNrIiwic2hhcyIsIl9jYWxsZWUxNSQiLCJfY29udGV4dDE1IiwiX2NhbGxlZTE2IiwiZXhlY3V0ZSIsImdydW50Q29tbWFuZCIsImluZGV4IiwidGFpbCIsIl9jYWxsZWUxNiQiLCJfY29udGV4dDE2IiwicHJvY2VzcyIsImFyZ3YiLCJfdG9Db25zdW1hYmxlQXJyYXkiLCJlcnJvcnMiLCJzdGRvdXQiLCJ3cml0ZWxuIiwiX2NhbGxlZTE3IiwiX2NhbGxlZTE3JCIsIl9jb250ZXh0MTciLCJfY2FsbGVlMTgiLCJzaW11bGF0aW9uIiwiZGVwbG95SW1hZ2VzIiwiX2NhbGxlZTE4JCIsIl9jb250ZXh0MTgiLCJfY2FsbGVlMTkiLCJnZXRCcmFuY2giLCJfY2FsbGVlMTkkIiwiX2NvbnRleHQxOSIsIl9jYWxsZWUyMCIsInJjIiwiX2NhbGxlZTIwJCIsIl9jb250ZXh0MjAiLCJfY2FsbGVlMjEiLCJwcm9kdWN0aW9uIiwibWFya1NpbUFzUHVibGlzaGVkIiwiX2NhbGxlZTIxJCIsIl9jb250ZXh0MjEiLCJfY2FsbGVlMjIiLCJfY2FsbGVlMjIkIiwiX2NvbnRleHQyMiIsIl9jYWxsZWUyMyIsImRlcGxveURlY2FmIiwiX2NhbGxlZTIzJCIsIl9jb250ZXh0MjMiLCJfY2FsbGVlMjQiLCJidWlsZERlY2FmIiwiX2NhbGxlZTI0JCIsIl9jb250ZXh0MjQiLCJfY2FsbGVlMjUiLCJjcmVhdGVTaW0iLCJhdXRob3IiLCJ0aXRsZSIsImNsZWFuIiwiX2NhbGxlZTI1JCIsIl9jb250ZXh0MjUiLCJfY2FsbGVlMjYiLCJnZXREYXRhRmlsZSIsImNhY2hlIiwiYWN0aXZlUmVwb3MiLCJmaXgiLCJjaGlwQXdheSIsInNob3dQcm9ncmVzc0JhciIsImxpbnQiLCJsaW50UmV0dXJuVmFsdWUiLCJfY2FsbGVlMjYkIiwiX2NvbnRleHQyNiIsImZpbHRlciIsImNoaXBwZXJBUElWZXJzaW9uIiwib2siLCJfY2FsbGVlMjciLCJnZW5lcmF0ZURhdGEiLCJfY2FsbGVlMjckIiwiX2NvbnRleHQyNyIsIl9jYWxsZWUyOCIsImNsb25lTWlzc2luZ1JlcG9zIiwiX2NhbGxlZTI4JCIsIl9jb250ZXh0MjgiLCJfY2FsbGVlMjkiLCJfY2FsbGVlMjkkIiwiX2NvbnRleHQyOSIsInN0YXJ0UkVQTCIsIl9jYWxsZWUzMCIsIl9jYWxsZWUzMCQiLCJfY29udGV4dDMwIiwiY2hlY2tCcmFuY2hTdGF0dXMiLCJfY2FsbGVlMzEiLCJfY2FsbGVlMzEkIiwiX2NvbnRleHQzMSIsImxpc3QiLCJfY2FsbGVlMzIiLCJfY2FsbGVlMzIkIiwiX2NvbnRleHQzMiIsImNyZWF0ZVBhdGNoIiwiX2NhbGxlZTMzIiwiX2NhbGxlZTMzJCIsIl9jb250ZXh0MzMiXSwic291cmNlcyI6WyJHcnVudGZpbGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMDItMjAxNSwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogR3J1bnQgY29uZmlndXJhdGlvbiBmaWxlIGZvciB0YXNrcyB0aGF0IGhhdmUgbm8gZGVwZW5kZW5jaWVzIG9uIG90aGVyIHJlcG9zLlxyXG4gKiBJbiBwYXJ0aWN1bGFyLCBncnVudCBjaGVja291dC1zaGFzIGFuZCBncnVudCBjaGVja291dC1tYWluIGNhbiBiZSBydW4gZnJvbSBoZXJlXHJcbiAqIHdpdGhvdXQgd29ycnlpbmcgYWJvdXQgYW4gb2xkZXIgdmVyc2lvbiBvZiBjaGlwcGVyIGJlaW5nIGNoZWNrZWQgb3V0LlxyXG4gKlxyXG4gKiBJbiBnZW5lcmFsIHdoZW4gcG9zc2libGUsIG1vZHVsZXMgYXJlIGltcG9ydGVkIGxhemlseSBpbiB0aGVpciB0YXNrXHJcbiAqIGRlY2xhcmF0aW9uIHRvIHNhdmUgb24gb3ZlcmFsbCBsb2FkIHRpbWUgb2YgdGhpcyBmaWxlLiBUaGUgcGF0dGVybiBpcyB0byByZXF1aXJlIGFsbCBtb2R1bGVzIG5lZWRlZCBhdCB0aGUgdG9wIG9mIHRoZVxyXG4gKiBncnVudCB0YXNrIHJlZ2lzdHJhdGlvbi4gSWYgYSBtb2R1bGUgaXMgdXNlZCBpbiBtdWx0aXBsZSB0YXNrcywgaXQgaXMgYmVzdCB0byBsYXppbHkgcmVxdWlyZSBpbiBlYWNoXHJcbiAqIHRhc2suXHJcbiAqL1xyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIE5PVEU6IHRvIGltcHJvdmUgcGVyZm9ybWFuY2UsIHRoZSB2YXN0IG1ham9yaXR5IG9mIG1vZHVsZXMgYXJlIGxhemlseSBpbXBvcnRlZCBpbiB0YXNrIHJlZ2lzdHJhdGlvbnMuIEV2ZW4gZHVwbGljYXRpbmdcclxuLy8gcmVxdWlyZSBzdGF0ZW1lbnRzIGltcHJvdmVzIHRoZSBsb2FkIHRpbWUgb2YgdGhpcyBmaWxlIG5vdGljZWFibHkuIEZvciBkZXRhaWxzLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzExMDdcclxuY29uc3QgYXNzZXJ0SXNWYWxpZFJlcG9OYW1lID0gcmVxdWlyZSggJy4uL2NvbW1vbi9hc3NlcnRJc1ZhbGlkUmVwb05hbWUnICk7XHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5yZXF1aXJlKCAnLi9jaGVja05vZGVWZXJzaW9uJyApO1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGdydW50ICkge1xyXG5cclxuICBpZiAoIGdydW50Lm9wdGlvbiggJ2RlYnVnJyApICkge1xyXG4gICAgY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5cclxuICAgIHdpbnN0b24uZGVmYXVsdC50cmFuc3BvcnRzLmNvbnNvbGUubGV2ZWwgPSAnZGVidWcnO1xyXG4gIH1cclxuXHJcbiAgLy8gSWYgdHJ1ZSwgd2lsbCBza2lwIG1vc3QgcHJvbXB0cywgYnV0IHdpbGwgZmFpbCBvdXQgb24gdGhpbmdzIHRoYXQgc2hvdWxkIG5vdCBiZSBkb25lIGluIGFuIGF1dG9tYXRlZCBtYW5uZXIuXHJcbiAgY29uc3Qgbm9uaW50ZXJhY3RpdmUgPSAhIWdydW50Lm9wdGlvbiggJ25vbmludGVyYWN0aXZlJyApO1xyXG5cclxuICAvKipcclxuICAgKiBXcmFwcyBhIHByb21pc2UncyBjb21wbGV0aW9uIHdpdGggZ3J1bnQncyBhc3luY2hyb25vdXMgaGFuZGxpbmcsIHdpdGggYWRkZWQgaGVscGZ1bCBmYWlsdXJlIG1lc3NhZ2VzIChpbmNsdWRpbmcgc3RhY2sgdHJhY2VzLCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgLS1zdGFjayB3YXMgcHJvdmlkZWQpLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7UHJvbWlzZX0gcHJvbWlzZVxyXG4gICAqL1xyXG4gIGFzeW5jIGZ1bmN0aW9uIHdyYXAoIHByb21pc2UgKSB7XHJcbiAgICBjb25zdCBkb25lID0gZ3J1bnQudGFzay5jdXJyZW50LmFzeW5jKCk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgcHJvbWlzZTtcclxuICAgIH1cclxuICAgIGNhdGNoKCBlICkge1xyXG4gICAgICBpZiAoIGUuc3RhY2sgKSB7XHJcbiAgICAgICAgZ3J1bnQuZmFpbC5mYXRhbCggYFBlcmVubmlhbCB0YXNrIGZhaWxlZDpcXG4ke2Uuc3RhY2t9XFxuRnVsbCBFcnJvciBkZXRhaWxzOlxcbiR7ZX1gICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHR5cGVvZiBlID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICBncnVudC5mYWlsLmZhdGFsKCBgUGVyZW5uaWFsIHRhc2sgZmFpbGVkOiAke2V9YCApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGdydW50LmZhaWwuZmF0YWwoIGBQZXJlbm5pYWwgdGFzayBmYWlsZWQgd2l0aCB1bmtub3duIGVycm9yOiAke2V9YCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZG9uZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV3JhcHMgYW4gYXN5bmMgZnVuY3Rpb24gZm9yIGEgZ3J1bnQgdGFzay4gV2lsbCBydW4gdGhlIGFzeW5jIGZ1bmN0aW9uIHdoZW4gdGhlIHRhc2sgc2hvdWxkIGJlIGV4ZWN1dGVkLiBXaWxsIHByb3Blcmx5IGhhbmRsZSBncnVudCdzIGFzeW5jIGhhbmRsaW5nLCBhbmQgcHJvdmlkZXMgaW1wcm92ZWRcclxuICAgKiBlcnJvciByZXBvcnRpbmcuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHthc3luYyBmdW5jdGlvbn0gYXN5bmNUYXNrRnVuY3Rpb25cclxuICAgKi9cclxuICBmdW5jdGlvbiB3cmFwVGFzayggYXN5bmNUYXNrRnVuY3Rpb24gKSB7XHJcbiAgICByZXR1cm4gKCkgPT4ge1xyXG4gICAgICB3cmFwKCBhc3luY1Rhc2tGdW5jdGlvbigpICk7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnY2hlY2tvdXQtc2hhcycsXHJcbiAgICAnQ2hlY2sgb3V0IHNoYXMgZm9yIGEgcHJvamVjdCwgYXMgc3BlY2lmaWVkIGluIGRlcGVuZGVuY2llcy5qc29uXFxuJyArXHJcbiAgICAnLS1yZXBvIDogcmVwb3NpdG9yeSBuYW1lIHdoZXJlIHBhY2thZ2UuanNvbiBzaG91bGQgYmUgcmVhZCBmcm9tXFxuJyArXHJcbiAgICAnLS1za2lwTnBtVXBkYXRlIDogSWYgcHJvdmlkZWQsIHdpbGwgcHJldmVudCB0aGUgdXN1YWwgbnBtIHVwZGF0ZVxcbicgK1xyXG4gICAgJy0tYnVpbGRTZXJ2ZXIgOiBJZiBwcm92aWRlZCwgaXQgd2lsbCByZWFkIGRlcGVuZGVuY2llcyBmcm9tIHRoZSBidWlsZC1zZXJ2ZXIgdGVtcG9yYXJ5IGxvY2F0aW9uIChhbmQgd2lsbCBza2lwIG5wbSB1cGRhdGUpJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGFzc2VydCggZ3J1bnQub3B0aW9uKCAncmVwbycgKSwgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYSByZXBvc2l0b3J5IHdpdGggLS1yZXBvPXt7UkVQT1NJVE9SWX19JyApO1xyXG5cclxuICAgICAgY29uc3QgY2hlY2tvdXREZXBlbmRlbmNpZXMgPSByZXF1aXJlKCAnLi4vY29tbW9uL2NoZWNrb3V0RGVwZW5kZW5jaWVzJyApO1xyXG5cclxuICAgICAgY29uc3QgYnVpbGRTZXJ2ZXIgPSAhIWdydW50Lm9wdGlvbiggJ2J1aWxkU2VydmVyJyApO1xyXG5cclxuICAgICAgY29uc3QgcmVwbyA9IGdydW50Lm9wdGlvbiggJ3JlcG8nICk7XHJcbiAgICAgIGFzc2VydElzVmFsaWRSZXBvTmFtZSggcmVwbyApO1xyXG5cclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggYnVpbGRTZXJ2ZXIgPyAnLi4vcGVyZW5uaWFsL2pzL2J1aWxkLXNlcnZlci90bXAvZGVwZW5kZW5jaWVzLmpzb24nIDogYC4uLyR7cmVwb30vZGVwZW5kZW5jaWVzLmpzb25gICk7XHJcbiAgICAgIGNvbnN0IGluY2x1ZGVOcG1VcGRhdGUgPSAhZ3J1bnQub3B0aW9uKCAnc2tpcE5wbVVwZGF0ZScgKSAmJiAhYnVpbGRTZXJ2ZXI7XHJcblxyXG4gICAgICBhd2FpdCBjaGVja291dERlcGVuZGVuY2llcyggcmVwbywgZGVwZW5kZW5jaWVzLCBpbmNsdWRlTnBtVXBkYXRlICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnY2hlY2tvdXQtdGFyZ2V0JyxcclxuICAgICdDaGVjayBvdXQgYSBzcGVjaWZpYyBicmFuY2gvU0hBIGZvciBhIHNpbXVsYXRpb24gYW5kIGFsbCBvZiBpdHMgZGVjbGFyZWQgZGVwZW5kZW5jaWVzXFxuJyArXHJcbiAgICAnLS1yZXBvIDogcmVwb3NpdG9yeSBuYW1lIHdoZXJlIHBhY2thZ2UuanNvbiBzaG91bGQgYmUgcmVhZCBmcm9tXFxuJyArXHJcbiAgICAnLS10YXJnZXQgOiB0aGUgYnJhbmNoL1NIQSB0byBjaGVjayBvdXRcXG4nICtcclxuICAgICctLWJyYW5jaCA6IGFsaWFzIGZvciAtLXRhcmdldFxcbicgK1xyXG4gICAgJy0tc2tpcE5wbVVwZGF0ZSA6IElmIHByb3ZpZGVkLCB3aWxsIHByZXZlbnQgdGhlIHVzdWFsIG5wbSB1cGRhdGUnLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVwbyA9IGdydW50Lm9wdGlvbiggJ3JlcG8nICk7XHJcblxyXG4gICAgICBhc3NlcnQoIHJlcG8sICdSZXF1aXJlcyBzcGVjaWZ5aW5nIGEgcmVwb3NpdG9yeSB3aXRoIC0tcmVwbz17e1JFUE9TSVRPUll9fScgKTtcclxuICAgICAgYXNzZXJ0KCAhKCBncnVudC5vcHRpb24oICd0YXJnZXQnICkgJiYgZ3J1bnQub3B0aW9uKCAnYnJhbmNoJyApICksICctLXRhcmdldCBhbmQgLS1icmFuY2ggYXJlIHRoZSBzYW1lIG9wdGlvbiwgb25seSB1c2Ugb25lLicgKTtcclxuICAgICAgY29uc3QgdGFyZ2V0ID0gZ3J1bnQub3B0aW9uKCAndGFyZ2V0JyApIHx8IGdydW50Lm9wdGlvbiggJ2JyYW5jaCcgKTtcclxuICAgICAgYXNzZXJ0KCB0YXJnZXQsICdSZXF1aXJlcyBzcGVjaWZ5aW5nIGEgYnJhbmNoL1NIQSB3aXRoIC0tdGFyZ2V0PXt7QlJBTkNIfX0nICk7XHJcblxyXG4gICAgICBhc3NlcnRJc1ZhbGlkUmVwb05hbWUoIHJlcG8gKTtcclxuXHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0VGFyZ2V0ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9jaGVja291dFRhcmdldCcgKTtcclxuXHJcbiAgICAgIGF3YWl0IGNoZWNrb3V0VGFyZ2V0KCByZXBvLCB0YXJnZXQsICFncnVudC5vcHRpb24oICdza2lwTnBtVXBkYXRlJyApICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnY2hlY2tvdXQtcmVsZWFzZScsXHJcbiAgICAnQ2hlY2sgb3V0IHRoZSBsYXRlc3QgZGVwbG95ZWQgcHJvZHVjdGlvbiByZWxlYXNlIGJyYW5jaCBmb3IgYSBzaW11bGF0aW9uIGFuZCBhbGwgb2YgaXRzIGRlY2xhcmVkIGRlcGVuZGVuY2llc1xcbicgK1xyXG4gICAgJy0tcmVwbyA6IHJlcG9zaXRvcnkgbmFtZSB3aGVyZSBwYWNrYWdlLmpzb24gc2hvdWxkIGJlIHJlYWQgZnJvbVxcbicgK1xyXG4gICAgJy0tc2tpcE5wbVVwZGF0ZSA6IElmIHByb3ZpZGVkLCB3aWxsIHByZXZlbnQgdGhlIHVzdWFsIG5wbSB1cGRhdGUnLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgY2hlY2tvdXRSZWxlYXNlID0gcmVxdWlyZSggJy4uL2NvbW1vbi9jaGVja291dFJlbGVhc2UnICk7XHJcblxyXG4gICAgICBjb25zdCByZXBvID0gZ3J1bnQub3B0aW9uKCAncmVwbycgKTtcclxuXHJcbiAgICAgIGFzc2VydCggcmVwbywgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYSByZXBvc2l0b3J5IHdpdGggLS1yZXBvPXt7UkVQT1NJVE9SWX19JyApO1xyXG4gICAgICBhc3NlcnRJc1ZhbGlkUmVwb05hbWUoIHJlcG8gKTtcclxuXHJcbiAgICAgIGF3YWl0IGNoZWNrb3V0UmVsZWFzZSggcmVwbywgIWdydW50Lm9wdGlvbiggJ3NraXBOcG1VcGRhdGUnICkgKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdjaGVja291dC10aW1lc3RhbXAnLFxyXG4gICAgJ0NoZWNrIG91dCBhIHNwZWNpZmljIHRpbWVzdGFtcCBmb3IgYSBzaW11bGF0aW9uIGFuZCBhbGwgb2YgaXRzIGRlY2xhcmVkIGRlcGVuZGVuY2llc1xcbicgK1xyXG4gICAgJy0tcmVwbyA6IHJlcG9zaXRvcnkgbmFtZSB3aGVyZSBwYWNrYWdlLmpzb24gc2hvdWxkIGJlIHJlYWQgZnJvbVxcbicgK1xyXG4gICAgJy0tdGltZXN0YW1wIDogdGhlIHRpbWVzdGFtcCB0byBjaGVjayB0aGluZ3Mgb3V0IGZvciwgZS5nLiAtLXRpbWVzdGFtcD1cIkphbiAwOCAyMDE4XCJcXG4nICtcclxuICAgICctLXNraXBOcG1VcGRhdGUgOiBJZiBwcm92aWRlZCwgd2lsbCBwcmV2ZW50IHRoZSB1c3VhbCBucG0gdXBkYXRlJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlcG8gPSBncnVudC5vcHRpb24oICdyZXBvJyApO1xyXG5cclxuICAgICAgYXNzZXJ0KCByZXBvLCAnUmVxdWlyZXMgc3BlY2lmeWluZyBhIHJlcG9zaXRvcnkgd2l0aCAtLXJlcG89e3tSRVBPU0lUT1JZfX0nICk7XHJcbiAgICAgIGFzc2VydCggZ3J1bnQub3B0aW9uKCAndGltZXN0YW1wJyApLCAnUmVxdWlyZXMgc3BlY2lmeWluZyBhIHRpbWVzdGFtcCB3aXRoIC0tdGltZXN0YW1wPXt7QlJBTkNIfX0nICk7XHJcblxyXG4gICAgICBhc3NlcnRJc1ZhbGlkUmVwb05hbWUoIHJlcG8gKTtcclxuXHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0VGltZXN0YW1wID0gcmVxdWlyZSggJy4uL2NvbW1vbi9jaGVja291dFRpbWVzdGFtcCcgKTtcclxuXHJcbiAgICAgIGF3YWl0IGNoZWNrb3V0VGltZXN0YW1wKCByZXBvLCBncnVudC5vcHRpb24oICd0aW1lc3RhbXAnICksICFncnVudC5vcHRpb24oICdza2lwTnBtVXBkYXRlJyApICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnY2hlY2tvdXQtbWFpbicsXHJcbiAgICAnQ2hlY2sgb3V0IG1haW4gYnJhbmNoIGZvciBhbGwgZGVwZW5kZW5jaWVzLCBhcyBzcGVjaWZpZWQgaW4gZGVwZW5kZW5jaWVzLmpzb25cXG4nICtcclxuICAgICctLXJlcG8gOiByZXBvc2l0b3J5IG5hbWUgd2hlcmUgcGFja2FnZS5qc29uIHNob3VsZCBiZSByZWFkIGZyb21cXG4nICtcclxuICAgICctLXNraXBOcG1VcGRhdGUgOiBJZiBwcm92aWRlZCwgd2lsbCBwcmV2ZW50IHRoZSB1c3VhbCBucG0gdXBkYXRlJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlcG8gPSBncnVudC5vcHRpb24oICdyZXBvJyApO1xyXG5cclxuICAgICAgYXNzZXJ0KCByZXBvLCAnUmVxdWlyZXMgc3BlY2lmeWluZyBhIHJlcG9zaXRvcnkgd2l0aCAtLXJlcG89e3tSRVBPU0lUT1JZfX0nICk7XHJcblxyXG4gICAgICBjb25zdCBjaGVja291dE1haW4gPSByZXF1aXJlKCAnLi4vY29tbW9uL2NoZWNrb3V0TWFpbicgKTtcclxuXHJcbiAgICAgIGFzc2VydElzVmFsaWRSZXBvTmFtZSggcmVwbyApO1xyXG5cclxuICAgICAgYXdhaXQgY2hlY2tvdXRNYWluKCByZXBvLCAhZ3J1bnQub3B0aW9uKCAnc2tpcE5wbVVwZGF0ZScgKSApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2NoZWNrb3V0LW1haW4tYWxsJyxcclxuICAgICdDaGVjayBvdXQgbWFpbiBicmFuY2ggZm9yIGFsbCByZXBvcyBpbiBnaXQgcm9vdCcsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBjaGVja291dE1haW5BbGwgPSByZXF1aXJlKCAnLi9jaGVja291dE1haW5BbGwnICk7XHJcblxyXG4gICAgICBjaGVja291dE1haW5BbGwoKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdzaGEtY2hlY2snLFxyXG4gICAgJ0NoZWNrcyB3aGljaCBzaW11bGF0aW9uc1xcJyBsYXRlc3QgcmVsZWFzZSB2ZXJzaW9uIGluY2x1ZGVzIHRoZSBnaXZlbiBjb21tb24tY29kZSBTSEEgaW4gaXRzIGdpdCB0cmVlLlxcbicgK1xyXG4gICAgJy0tcmVwbyA6IHJlcG9zaXRvcnkgdG8gY2hlY2sgZm9yIHRoZSBTSEFcXG4nICtcclxuICAgICctLXNoYSA6IGdpdCBTSEEnLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVwbyA9IGdydW50Lm9wdGlvbiggJ3JlcG8nICk7XHJcbiAgICAgIGFzc2VydElzVmFsaWRSZXBvTmFtZSggcmVwbyApO1xyXG5cclxuICAgICAgY29uc3Qgc2hhQ2hlY2sgPSByZXF1aXJlKCAnLi9zaGFDaGVjaycgKTtcclxuXHJcbiAgICAgIGF3YWl0IHNoYUNoZWNrKCByZXBvLCBncnVudC5vcHRpb24oICdzaGEnICkgKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdwcmludC1waGV0LWlvLWxpbmtzJyxcclxuICAgICdQcmludCB0aGUgY3VycmVudCBsaXN0IG9mIGFsbCBwaGV0LWlvIHNpbXNcXCcgbGlua3MnLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZ2V0UGhldGlvTGlua3MgPSByZXF1aXJlKCAnLi4vY29tbW9uL2dldFBoZXRpb0xpbmtzJyApO1xyXG4gICAgICBjb25zdCBwaGV0aW9MaW5rcyA9IGF3YWl0IGdldFBoZXRpb0xpbmtzKCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggJ0xhdGVzdCBMaW5rczonICk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCBgXFxuJHtwaGV0aW9MaW5rcy5qb2luKCAnXFxuJyApfWAgKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICd1cGRhdGUtZ2gtcGFnZXMnLFxyXG4gICAgJ1VwZGF0ZXMgdGhlIGdoLXBhZ2VzIGJyYW5jaGVzIGZvciB2YXJpb3VzIHJlcG9zLCBpbmNsdWRpbmcgYnVpbGRpbmcgb2YgZG90L2tpdGUvc2NlbmVyeScsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCB1cGRhdGVHaXRodWJQYWdlcyA9IHJlcXVpcmUoICcuLi9jb21tb24vdXBkYXRlR2l0aHViUGFnZXMnICk7XHJcblxyXG4gICAgICBhd2FpdCB1cGRhdGVHaXRodWJQYWdlcygpO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ3NpbS1saXN0JyxcclxuICAgICdQcmludHMgb3V0IGEgbGlzdCBvZiBsaXZlIHByb2R1Y3Rpb24gSFRNTCBzaW1zIHRvIHN0ZGVyciAoY2FuIGJlIGZpbHRlcmVkIGZyb20gb3RoZXIgc3Rkb3V0IG91dHB1dClcXG4nICtcclxuICAgICctLXZlcnNpb25zIDogT3V0cHV0cyB0aGUgc2ltIHZlcnNpb24gYWZ0ZXIgaXRzIG5hbWUuJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHNpbU1ldGFkYXRhID0gcmVxdWlyZSggJy4uL2NvbW1vbi9zaW1NZXRhZGF0YScgKTtcclxuICAgICAgY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5cclxuICAgICAgd2luc3Rvbi5kZWZhdWx0LnRyYW5zcG9ydHMuY29uc29sZS5sZXZlbCA9ICdlcnJvcic7XHJcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBzaW1NZXRhZGF0YSgge1xyXG4gICAgICAgIHR5cGU6ICdodG1sJ1xyXG4gICAgICB9ICk7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoIGRhdGEucHJvamVjdHMubWFwKCBwcm9qZWN0ID0+IHtcclxuICAgICAgICBjb25zdCBuYW1lID0gcHJvamVjdC5uYW1lLnNsaWNlKCBwcm9qZWN0Lm5hbWUuaW5kZXhPZiggJy8nICkgKyAxICk7XHJcblxyXG4gICAgICAgIGxldCByZXN1bHQgPSBuYW1lO1xyXG4gICAgICAgIGlmICggZ3J1bnQub3B0aW9uKCAndmVyc2lvbnMnICkgKSB7XHJcbiAgICAgICAgICByZXN1bHQgKz0gYCAke3Byb2plY3QudmVyc2lvbi5tYWpvcn0uJHtwcm9qZWN0LnZlcnNpb24ubWlub3J9LiR7cHJvamVjdC52ZXJzaW9uLmRldn1gO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICB9ICkuam9pbiggJ1xcbicgKSApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ3JlbGVhc2UtYnJhbmNoLWxpc3QnLFxyXG4gICAgJ1ByaW50cyBvdXQgYSBsaXN0IG9mIGFsbCByZWxlYXNlIGJyYW5jaGVzIHRoYXQgd291bGQgbmVlZCBtYWludGVuYW5jZSBwYXRjaGVzXFxuJyArXHJcbiAgICAnLS1yZXBvIDogT25seSBzaG93IGJyYW5jaGVzIGZvciBhIHNwZWNpZmljIHJlcG9zaXRvcnlcXG4nICtcclxuICAgICctLW9yZGVyPTxPUkRFUj4gOiBhbHBoYWJldGljYWx8ZGF0ZScsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBNYWludGVuYW5jZSA9IHJlcXVpcmUoICcuLi9jb21tb24vTWFpbnRlbmFuY2UnICk7XHJcbiAgICAgIGNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbiAgICAgIHdpbnN0b24uZGVmYXVsdC50cmFuc3BvcnRzLmNvbnNvbGUubGV2ZWwgPSAnZXJyb3InO1xyXG5cclxuICAgICAgY29uc3QgcmVwbyA9IGdydW50Lm9wdGlvbiggJ3JlcG8nICk7XHJcbiAgICAgIGNvbnN0IG9yZGVyID0gZ3J1bnQub3B0aW9uKCAnb3JkZXInICkgfHwgJ2FscGhhYmV0aWNhbCc7XHJcblxyXG4gICAgICBpZiAoIHJlcG8gKSB7XHJcbiAgICAgICAgYXNzZXJ0SXNWYWxpZFJlcG9OYW1lKCByZXBvICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGFzc2VydCggb3JkZXIgPT09ICdhbHBoYWJldGljYWwnIHx8IG9yZGVyID09PSAnZGF0ZScgKTtcclxuXHJcbiAgICAgIGNvbnN0IGJyYW5jaGVzID0gYXdhaXQgTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcyggcmVsZWFzZUJyYW5jaCA9PiAhcmVwbyB8fCByZWxlYXNlQnJhbmNoLnJlcG8gPT09IHJlcG8sIHRydWUsIHRydWUgKTtcclxuXHJcbiAgICAgIGxldCBzdHJ1Y3R1cmVzID0gW107XHJcbiAgICAgIGZvciAoIGNvbnN0IGJyYW5jaCBvZiBicmFuY2hlcyApIHtcclxuICAgICAgICBzdHJ1Y3R1cmVzLnB1c2goIHtcclxuICAgICAgICAgIGJyYW5jaDogYnJhbmNoLFxyXG4gICAgICAgICAgdGltZXN0YW1wOiBhd2FpdCBicmFuY2guZ2V0RGl2ZXJnaW5nVGltZXN0YW1wKClcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggb3JkZXIgPT09ICdkYXRlJyApIHtcclxuICAgICAgICBzdHJ1Y3R1cmVzID0gXy5zb3J0QnkoIHN0cnVjdHVyZXMsIHN0cnVjdCA9PiBzdHJ1Y3QudGltZXN0YW1wICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnXFxuUmVsZWFzZSBicmFuY2hlczpcXG57cmVwb30ge2JyYW5jaH0ge2JyYW5kWyxicmFuZF0rfSB7ZGF0ZX1cXG4nICk7XHJcbiAgICAgIGZvciAoIGNvbnN0IHN0cnVjdCBvZiBzdHJ1Y3R1cmVzICkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCBgJHtzdHJ1Y3QuYnJhbmNoLnRvU3RyaW5nKCl9ICR7bmV3IERhdGUoIHN0cnVjdC50aW1lc3RhbXAgKS50b0lTT1N0cmluZygpLnNwbGl0KCAnVCcgKVsgMCBdfWAgKTtcclxuICAgICAgfVxyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ25wbS11cGRhdGUnLFxyXG4gICAgJ1J1bnMgbnBtIHVwZGF0ZS9wcnVuZSBmb3IgY2hpcHBlciwgcGVyZW5uaWFsLWFsaWFzIGFuZCB0aGUgZ2l2ZW4gcmVwb3NpdG9yeVxcbicgK1xyXG4gICAgJy0tcmVwbyA6IFRoZSByZXBvc2l0b3J5IHRvIHVwZGF0ZScsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBucG1VcGRhdGUgPSByZXF1aXJlKCAnLi4vY29tbW9uL25wbVVwZGF0ZScgKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlcG8gPSBncnVudC5vcHRpb24oICdyZXBvJyApO1xyXG4gICAgICBhc3NlcnQoIHJlcG8sICdSZXF1aXJlcyBzcGVjaWZ5aW5nIGEgcmVwb3NpdG9yeSB3aXRoIC0tcmVwbz17e1JFUE9TSVRPUll9fScgKTtcclxuXHJcbiAgICAgIGFzc2VydElzVmFsaWRSZXBvTmFtZSggcmVwbyApO1xyXG5cclxuICAgICAgYXdhaXQgbnBtVXBkYXRlKCByZXBvICkudGhlbiggKCkgPT4gbnBtVXBkYXRlKCAnY2hpcHBlcicgKSApLnRoZW4oICgpID0+IG5wbVVwZGF0ZSggJ3BlcmVubmlhbC1hbGlhcycgKSApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2NyZWF0ZS1yZWxlYXNlJyxcclxuICAgICdDcmVhdGVzIGEgbmV3IHJlbGVhc2UgYnJhbmNoIGZvciBhIGdpdmVuIHNpbXVsYXRpb25cXG4nICtcclxuICAgICctLXJlcG8gOiBUaGUgcmVwb3NpdG9yeSB0byBhZGQgdGhlIHJlbGVhc2UgYnJhbmNoIHRvXFxuJyArXHJcbiAgICAnLS1icmFuY2ggOiBUaGUgYnJhbmNoIG5hbWUsIHdoaWNoIHNob3VsZCBiZSB7e01BSk9SfX0ue3tNSU5PUn19LCBlLmcuIDEuMFxcbicgK1xyXG4gICAgJy0tYnJhbmRzIDogVGhlIHN1cHBvcnRlZCBicmFuZHMgZm9yIHRoZSByZWxlYXNlLCBjb21tYSBzZXBhcmF0ZWQuXFxuJyArXHJcbiAgICAnLS1tZXNzYWdlIDogQW4gb3B0aW9uYWwgbWVzc2FnZSB0aGF0IHdpbGwgYmUgYXBwZW5kZWQgb24gdmVyc2lvbi1jaGFuZ2UgY29tbWl0cy4nLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgY3JlYXRlUmVsZWFzZSA9IHJlcXVpcmUoICcuL2NyZWF0ZVJlbGVhc2UnICk7XHJcblxyXG4gICAgICBjb25zdCByZXBvID0gZ3J1bnQub3B0aW9uKCAncmVwbycgKTtcclxuICAgICAgYXNzZXJ0SXNWYWxpZFJlcG9OYW1lKCByZXBvICk7XHJcblxyXG4gICAgICBjb25zdCBicmFuY2ggPSBncnVudC5vcHRpb24oICdicmFuY2gnICk7XHJcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBncnVudC5vcHRpb24oICdtZXNzYWdlJyApO1xyXG4gICAgICBjb25zdCBicmFuZHMgPSBncnVudC5vcHRpb24oICdicmFuZHMnICk7XHJcblxyXG4gICAgICBhc3NlcnQoIHJlcG8sICdSZXF1aXJlcyBzcGVjaWZ5aW5nIGEgcmVwb3NpdG9yeSB3aXRoIC0tcmVwbz17e1JFUE9TSVRPUll9fScgKTtcclxuICAgICAgYXNzZXJ0KCBicmFuZHMsICdSZXF1aXJlcyBzcGVjaWZ5aW5nIGJyYW5kcyB3aXRoIC0tYnJhbmRzPXt7QlJBTkRTfX0gKGNvbW1hIHNlcGFyYXRlZCknICk7XHJcbiAgICAgIGFzc2VydCggYnJhbmNoLCAnUmVxdWlyZXMgc3BlY2lmeWluZyBhIGJyYW5jaCB3aXRoIC0tYnJhbmNoPXt7QlJBTkNIfX0nICk7XHJcbiAgICAgIGFzc2VydCggYnJhbmNoLnNwbGl0KCAnLicgKS5sZW5ndGggPT09IDIsICdCcmFuY2ggc2hvdWxkIGJlIHt7TUFKT1J9fS57e01JTk9SfX0nICk7XHJcblxyXG4gICAgICBhd2FpdCBjcmVhdGVSZWxlYXNlKCByZXBvLCBicmFuY2gsIGJyYW5kcy5zcGxpdCggJywnICksIG1lc3NhZ2UgKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdjcmVhdGUtb25lLW9mZicsXHJcbiAgICAnQ3JlYXRlcyBhIG5ldyByZWxlYXNlIGJyYW5jaCBmb3IgYSBnaXZlbiBzaW11bGF0aW9uXFxuJyArXHJcbiAgICAnLS1yZXBvIDogVGhlIHJlcG9zaXRvcnkgdG8gYWRkIHRoZSByZWxlYXNlIGJyYW5jaCB0b1xcbicgK1xyXG4gICAgJy0tYnJhbmNoIDogVGhlIGJyYW5jaC9vbmUtb2ZmIG5hbWUsIHdoaWNoIHNob3VsZCBiZSBhbnl0aGluZyB3aXRob3V0IGRhc2hlcyBvciBwZXJpb2RzXFxuJyArXHJcbiAgICAnLS1tZXNzYWdlIDogQW4gb3B0aW9uYWwgbWVzc2FnZSB0aGF0IHdpbGwgYmUgYXBwZW5kZWQgb24gdmVyc2lvbi1jaGFuZ2UgY29tbWl0cy4nLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgY3JlYXRlT25lT2ZmID0gcmVxdWlyZSggJy4vY3JlYXRlT25lT2ZmJyApO1xyXG5cclxuICAgICAgY29uc3QgcmVwbyA9IGdydW50Lm9wdGlvbiggJ3JlcG8nICk7XHJcbiAgICAgIGFzc2VydElzVmFsaWRSZXBvTmFtZSggcmVwbyApO1xyXG5cclxuICAgICAgY29uc3QgYnJhbmNoID0gZ3J1bnQub3B0aW9uKCAnYnJhbmNoJyApO1xyXG4gICAgICBjb25zdCBtZXNzYWdlID0gZ3J1bnQub3B0aW9uKCAnbWVzc2FnZScgKTtcclxuICAgICAgYXNzZXJ0KCByZXBvLCAnUmVxdWlyZXMgc3BlY2lmeWluZyBhIHJlcG9zaXRvcnkgd2l0aCAtLXJlcG89e3tSRVBPU0lUT1JZfX0nICk7XHJcbiAgICAgIGFzc2VydCggYnJhbmNoLCAnUmVxdWlyZXMgc3BlY2lmeWluZyBhIGJyYW5jaCB3aXRoIC0tYnJhbmNoPXt7QlJBTkNIfX0nICk7XHJcbiAgICAgIGFzc2VydCggIWJyYW5jaC5pbmNsdWRlcyggJy0nICkgJiYgIWJyYW5jaC5pbmNsdWRlcyggJy4nICksICdCcmFuY2ggc2hvdWxkIG5vdCBjb250YWluIGRhc2hlcyBvciBwZXJpb2RzJyApO1xyXG5cclxuICAgICAgYXdhaXQgY3JlYXRlT25lT2ZmKCByZXBvLCBicmFuY2gsIG1lc3NhZ2UgKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdjaGVycnktcGljaycsXHJcbiAgICAnUnVucyBjaGVycnktcGljayBvbiBhIGxpc3Qgb2YgU0hBcyB1bnRpbCBvbmUgd29ya3MuIFJlcG9ydHMgc3VjY2VzcyBvciBmYWlsdXJlXFxuJyArXHJcbiAgICAnLS1yZXBvIDogVGhlIHJlcG9zaXRvcnkgdG8gY2hlcnJ5LXBpY2sgb25cXG4nICtcclxuICAgICctLXNoYXMgOiBDb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBTSEFzIHRvIHRyeScsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBjaGVycnlQaWNrID0gcmVxdWlyZSggJy4vY2hlcnJ5UGljaycgKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlcG8gPSBncnVudC5vcHRpb24oICdyZXBvJyApO1xyXG5cclxuICAgICAgYXNzZXJ0KCByZXBvLCAnUmVxdWlyZXMgc3BlY2lmeWluZyBhIHJlcG9zaXRvcnkgd2l0aCAtLXJlcG89e3tSRVBPU0lUT1JZfX0nICk7XHJcbiAgICAgIGFzc2VydCggZ3J1bnQub3B0aW9uKCAnc2hhcycgKSwgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBTSEFzIHdpdGggLS1zaGFzPXt7U0hBU319JyApO1xyXG5cclxuICAgICAgYXNzZXJ0SXNWYWxpZFJlcG9OYW1lKCByZXBvICk7XHJcblxyXG4gICAgICBjb25zdCBzaGFzID0gZ3J1bnQub3B0aW9uKCAnc2hhcycgKS5zcGxpdCggJywnICk7XHJcblxyXG4gICAgICBhd2FpdCBjaGVycnlQaWNrKCByZXBvLCBzaGFzICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnbGludCcsICdMaW50cyB0aGlzIHJlcG9zaXRvcnkgb25seScsIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICBjb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4uL2NvbW1vbi9leGVjdXRlJyApO1xyXG4gICAgY29uc3QgZ3J1bnRDb21tYW5kID0gcmVxdWlyZSggJy4uL2NvbW1vbi9ncnVudENvbW1hbmQnICk7XHJcblxyXG4gICAgY29uc3QgaW5kZXggPSBwcm9jZXNzLmFyZ3YuaW5kZXhPZiggJ2xpbnQnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbmRleCA+PSAwLCAnbGludCBjb21tYW5kIGRvZXMgbm90IGFwcGVhcicgKTtcclxuICAgIGNvbnN0IHRhaWwgPSBwcm9jZXNzLmFyZ3Yuc2xpY2UoIGluZGV4ICsgMSApO1xyXG5cclxuICAgIGlmICggIWdydW50Lm9wdGlvbiggJ3JlcG9zJyApICkge1xyXG4gICAgICB0YWlsLnB1c2goICctLXJlcG9zPXBlcmVubmlhbCcgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGb3J3YXJkIHRvIGNoaXBwZXIsIHN1cHBvcnRpbmcgYWxsIG9mIHRoZSBvcHRpb25zXHJcbiAgICBncnVudC5sb2cud3JpdGVsbiggKCBhd2FpdCBleGVjdXRlKCBncnVudENvbW1hbmQsIFsgJ2xpbnQnLCAuLi50YWlsIF0sICcuLi9jaGlwcGVyJywgeyBlcnJvcnM6ICdyZXNvbHZlJyB9ICkgKS5zdGRvdXQgKTtcclxuICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnZGV2JyxcclxuICAgICdEZXBsb3lzIGEgZGV2IHZlcnNpb24gb2YgdGhlIHNpbXVsYXRpb25cXG4nICtcclxuICAgICctLXJlcG8gOiBUaGUgbmFtZSBvZiB0aGUgcmVwb3NpdG9yeSB0byBkZXBsb3lcXG4nICtcclxuICAgICctLWJyYW5kcyA6IEEgY29tbWEtc2VwYXJhdGVkIGxpc3Qgb2YgYnJhbmQgbmFtZXMgdG8gZGVwbG95XFxuJyArXHJcbiAgICAnLS1ub25pbnRlcmFjdGl2ZSA6IElmIHNwZWNpZmllZCwgcHJvbXB0cyB3aWxsIGJlIHNraXBwZWQuIFNvbWUgcHJvbXB0cyB0aGF0IHNob3VsZCBub3QgYmUgYXV0b21hdGVkIHdpbGwgZmFpbCBvdXRcXG4nICtcclxuICAgICctLW1lc3NhZ2UgOiBBbiBvcHRpb25hbCBtZXNzYWdlIHRoYXQgd2lsbCBiZSBhcHBlbmRlZCBvbiB2ZXJzaW9uLWNoYW5nZSBjb21taXRzLicsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBkZXYgPSByZXF1aXJlKCAnLi9kZXYnICk7XHJcbiAgICAgIGFzc2VydCggZ3J1bnQub3B0aW9uKCAncmVwbycgKSwgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYSByZXBvc2l0b3J5IHdpdGggLS1yZXBvPXt7UkVQT1NJVE9SWX19JyApO1xyXG4gICAgICBhc3NlcnQoIGdydW50Lm9wdGlvbiggJ2JyYW5kcycgKSwgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYnJhbmRzIChjb21tYS1zZXBhcmF0ZWQpIHdpdGggLS1icmFuZHM9e3tCUkFORFN9fScgKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlcG8gPSBncnVudC5vcHRpb24oICdyZXBvJyApO1xyXG4gICAgICBhc3NlcnRJc1ZhbGlkUmVwb05hbWUoIHJlcG8gKTtcclxuXHJcbiAgICAgIGF3YWl0IGRldiggcmVwbywgZ3J1bnQub3B0aW9uKCAnYnJhbmRzJyApLnNwbGl0KCAnLCcgKSwgbm9uaW50ZXJhY3RpdmUsICdtYWluJywgZ3J1bnQub3B0aW9uKCAnbWVzc2FnZScgKSApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2RlcGxveS1pbWFnZXMnLFxyXG4gICAgJ1JlYnVpbGRzIGFsbCBpbWFnZXNcXG4nICtcclxuICAgICctLXNpbXVsYXRpb24gOiBPcHRpb25hbC4gSWYgcHJlc2VudCwgb25seSB0aGUgZ2l2ZW4gc2ltdWxhdGlvbiB3aWxsIHJlY2VpdmUgaW1hZ2VzIGZyb20gbWFpbi4gSWYgYWJzZW50LCBhbGwgc2ltcycgK1xyXG4gICAgJ3dpbGwgcmVjZWl2ZSBpbWFnZXMgZnJvbSBtYWluLicsXHJcblxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc29sZS5sb2coIGdydW50Lm9wdGlvbiggJ3NpbXVsYXRpb24nICkgKTtcclxuICAgICAgY29uc3Qgc2ltdWxhdGlvbiA9IGdydW50Lm9wdGlvbiggJ3NpbXVsYXRpb24nICkgfHwgbnVsbDtcclxuICAgICAgY29uc3QgZGVwbG95SW1hZ2VzID0gcmVxdWlyZSggJy4vZGVwbG95SW1hZ2VzJyApO1xyXG4gICAgICBhd2FpdCBkZXBsb3lJbWFnZXMoIHsgc2ltdWxhdGlvbjogc2ltdWxhdGlvbiB9ICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnb25lLW9mZicsXHJcbiAgICAnRGVwbG95cyBhIG9uZS1vZmYgdmVyc2lvbiBvZiB0aGUgc2ltdWxhdGlvbiAodXNpbmcgdGhlIGN1cnJlbnQgb3Igc3BlY2lmaWVkIGJyYW5jaClcXG4nICtcclxuICAgICctLXJlcG8gOiBUaGUgbmFtZSBvZiB0aGUgcmVwb3NpdG9yeSB0byBkZXBsb3lcXG4nICtcclxuICAgICctLWJyYW5jaCA6IFRoZSBuYW1lIG9mIHRoZSBvbmUtb2ZmIGJyYW5jaCAodGhlIG5hbWUgb2YgdGhlIG9uZS1vZmYpXFxuJyArXHJcbiAgICAnLS1icmFuZHMgOiBBIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGJyYW5kIG5hbWVzIHRvIGRlcGxveVxcbicgK1xyXG4gICAgJy0tbm9uaW50ZXJhY3RpdmUgOiBJZiBzcGVjaWZpZWQsIHByb21wdHMgd2lsbCBiZSBza2lwcGVkLiBTb21lIHByb21wdHMgdGhhdCBzaG91bGQgbm90IGJlIGF1dG9tYXRlZCB3aWxsIGZhaWwgb3V0XFxuJyArXHJcbiAgICAnLS1tZXNzYWdlIDogQW4gb3B0aW9uYWwgbWVzc2FnZSB0aGF0IHdpbGwgYmUgYXBwZW5kZWQgb24gdmVyc2lvbi1jaGFuZ2UgY29tbWl0cy4nLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuXHJcbiAgICAgIGNvbnN0IGdldEJyYW5jaCA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2V0QnJhbmNoJyApO1xyXG4gICAgICBjb25zdCBkZXYgPSByZXF1aXJlKCAnLi9kZXYnICk7XHJcblxyXG4gICAgICBjb25zdCByZXBvID0gZ3J1bnQub3B0aW9uKCAncmVwbycgKTtcclxuICAgICAgYXNzZXJ0SXNWYWxpZFJlcG9OYW1lKCByZXBvICk7XHJcblxyXG4gICAgICBjb25zdCBicmFuZHMgPSBncnVudC5vcHRpb24oICdicmFuZHMnICk7XHJcblxyXG4gICAgICBhc3NlcnQoIHJlcG8sICdSZXF1aXJlcyBzcGVjaWZ5aW5nIGEgcmVwb3NpdG9yeSB3aXRoIC0tcmVwbz17e1JFUE9TSVRPUll9fScgKTtcclxuICAgICAgYXNzZXJ0KCBicmFuZHMsICdSZXF1aXJlcyBzcGVjaWZ5aW5nIGJyYW5kcyAoY29tbWEtc2VwYXJhdGVkKSB3aXRoIC0tYnJhbmRzPXt7QlJBTkRTfX0nICk7XHJcblxyXG4gICAgICBsZXQgYnJhbmNoID0gZ3J1bnQub3B0aW9uKCAnYnJhbmNoJyApO1xyXG4gICAgICBpZiAoICFicmFuY2ggKSB7XHJcbiAgICAgICAgYnJhbmNoID0gYXdhaXQgZ2V0QnJhbmNoKCByZXBvICk7XHJcbiAgICAgICAgY29uc29sZS5sb2coIGAtLWJyYW5jaCBub3QgcHJvdmlkZWQsIHVzaW5nICR7YnJhbmNofSBkZXRlY3RlZCBmcm9tICR7cmVwb31gICk7XHJcbiAgICAgIH1cclxuICAgICAgYXNzZXJ0KCBicmFuY2ggIT09ICdtYWluJywgJ09uZS1vZmYgZGVwbG95cyBmb3IgbWFpbiBhcmUgdW5zdXBwb3J0ZWQuJyApO1xyXG5cclxuICAgICAgYXdhaXQgZGV2KCByZXBvLCBicmFuZHMuc3BsaXQoICcsJyApLCBub25pbnRlcmFjdGl2ZSwgYnJhbmNoLCBncnVudC5vcHRpb24oICdtZXNzYWdlJyApICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAncmMnLFxyXG4gICAgJ0RlcGxveXMgYW4gcmMgdmVyc2lvbiBvZiB0aGUgc2ltdWxhdGlvblxcbicgK1xyXG4gICAgJy0tcmVwbyA6IFRoZSBuYW1lIG9mIHRoZSByZXBvc2l0b3J5IHRvIGRlcGxveVxcbicgK1xyXG4gICAgJy0tYnJhbmNoIDogVGhlIHJlbGVhc2UgYnJhbmNoIG5hbWUgKGUuZy4gXCIxLjdcIikgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgZGVwbG95bWVudFxcbicgK1xyXG4gICAgJy0tYnJhbmRzIDogQSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBicmFuZCBuYW1lcyB0byBkZXBsb3lcXG4nICtcclxuICAgICctLW5vbmludGVyYWN0aXZlIDogSWYgc3BlY2lmaWVkLCBwcm9tcHRzIHdpbGwgYmUgc2tpcHBlZC4gU29tZSBwcm9tcHRzIHRoYXQgc2hvdWxkIG5vdCBiZSBhdXRvbWF0ZWQgd2lsbCBmYWlsIG91dFxcbicgK1xyXG4gICAgJy0tbWVzc2FnZSA6IEFuIG9wdGlvbmFsIG1lc3NhZ2UgdGhhdCB3aWxsIGJlIGFwcGVuZGVkIG9uIHZlcnNpb24tY2hhbmdlIGNvbW1pdHMuJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGFzc2VydCggZ3J1bnQub3B0aW9uKCAncmVwbycgKSwgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYSByZXBvc2l0b3J5IHdpdGggLS1yZXBvPXt7UkVQT1NJVE9SWX19JyApO1xyXG4gICAgICBhc3NlcnQoIGdydW50Lm9wdGlvbiggJ2JyYW5jaCcgKSwgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYSBicmFuY2ggd2l0aCAtLWJyYW5jaD17e0JSQU5DSH19JyApO1xyXG4gICAgICBhc3NlcnQoIGdydW50Lm9wdGlvbiggJ2JyYW5kcycgKSwgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYnJhbmRzIChjb21tYS1zZXBhcmF0ZWQpIHdpdGggLS1icmFuZHM9e3tCUkFORFN9fScgKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlcG8gPSBncnVudC5vcHRpb24oICdyZXBvJyApO1xyXG4gICAgICBhc3NlcnRJc1ZhbGlkUmVwb05hbWUoIHJlcG8gKTtcclxuXHJcbiAgICAgIGNvbnN0IHJjID0gcmVxdWlyZSggJy4vcmMnICk7XHJcblxyXG4gICAgICBhd2FpdCByYyggcmVwbywgZ3J1bnQub3B0aW9uKCAnYnJhbmNoJyApLCBncnVudC5vcHRpb24oICdicmFuZHMnICkuc3BsaXQoICcsJyApLCBub25pbnRlcmFjdGl2ZSwgZ3J1bnQub3B0aW9uKCAnbWVzc2FnZScgKSApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ3Byb2R1Y3Rpb24nLFxyXG4gICAgJ01hcmtzIGEgc2ltdWxhdGlvbiBhcyBwdWJsaXNoZWQsIGFuZCBkZXBsb3lzIGEgcHJvZHVjdGlvbiB2ZXJzaW9uIG9mIHRoZSBzaW11bGF0aW9uXFxuJyArXHJcbiAgICAnLS1yZXBvIDogVGhlIG5hbWUgb2YgdGhlIHJlcG9zaXRvcnkgdG8gZGVwbG95XFxuJyArXHJcbiAgICAnLS1icmFuY2ggOiBUaGUgcmVsZWFzZSBicmFuY2ggbmFtZSAoZS5nLiBcIjEuN1wiKSB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciBkZXBsb3ltZW50XFxuJyArXHJcbiAgICAnLS1icmFuZHMgOiBBIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGJyYW5kIG5hbWVzIHRvIGRlcGxveVxcbicgK1xyXG4gICAgJy0tbm9uaW50ZXJhY3RpdmUgOiBJZiBzcGVjaWZpZWQsIHByb21wdHMgd2lsbCBiZSBza2lwcGVkLiBTb21lIHByb21wdHMgdGhhdCBzaG91bGQgbm90IGJlIGF1dG9tYXRlZCB3aWxsIGZhaWwgb3V0XFxuJyArXHJcbiAgICAnLS1yZWRlcGxveTogSWYgc3BlY2lmaWVkIHdpdGggbm9uaW50ZXJhY3RpdmUsIGFsbG93IHRoZSBwcm9kdWN0aW9uIGRlcGxveSB0byBoYXZlIHRoZSBzYW1lIHZlcnNpb24gYXMgdGhlIHByZXZpb3VzIGRlcGxveVxcbicgK1xyXG4gICAgJy0tbWVzc2FnZSA6IEFuIG9wdGlvbmFsIG1lc3NhZ2UgdGhhdCB3aWxsIGJlIGFwcGVuZGVkIG9uIHZlcnNpb24tY2hhbmdlIGNvbW1pdHMuJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHByb2R1Y3Rpb24gPSByZXF1aXJlKCAnLi9wcm9kdWN0aW9uJyApO1xyXG4gICAgICBjb25zdCBtYXJrU2ltQXNQdWJsaXNoZWQgPSByZXF1aXJlKCAnLi4vY29tbW9uL21hcmtTaW1Bc1B1Ymxpc2hlZCcgKTtcclxuXHJcbiAgICAgIGFzc2VydCggZ3J1bnQub3B0aW9uKCAncmVwbycgKSwgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYSByZXBvc2l0b3J5IHdpdGggLS1yZXBvPXt7UkVQT1NJVE9SWX19JyApO1xyXG4gICAgICBhc3NlcnQoIGdydW50Lm9wdGlvbiggJ2JyYW5jaCcgKSwgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYSBicmFuY2ggd2l0aCAtLWJyYW5jaD17e0JSQU5DSH19JyApO1xyXG4gICAgICBhc3NlcnQoIGdydW50Lm9wdGlvbiggJ2JyYW5kcycgKSwgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYnJhbmRzIChjb21tYS1zZXBhcmF0ZWQpIHdpdGggLS1icmFuZHM9e3tCUkFORFN9fScgKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlcG8gPSBncnVudC5vcHRpb24oICdyZXBvJyApO1xyXG4gICAgICBhc3NlcnRJc1ZhbGlkUmVwb05hbWUoIHJlcG8gKTtcclxuXHJcbiAgICAgIGF3YWl0IG1hcmtTaW1Bc1B1Ymxpc2hlZCggcmVwbyApO1xyXG5cclxuICAgICAgYXdhaXQgcHJvZHVjdGlvbiggcmVwbywgZ3J1bnQub3B0aW9uKCAnYnJhbmNoJyApLCBncnVudC5vcHRpb24oICdicmFuZHMnICkuc3BsaXQoICcsJyApLCBub25pbnRlcmFjdGl2ZSxcclxuICAgICAgICBncnVudC5vcHRpb24oICdyZWRlcGxveScgKSwgZ3J1bnQub3B0aW9uKCAnbWVzc2FnZScgKSApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ3Byb3RvdHlwZScsXHJcbiAgICAnRGVwbG95cyBhIHByb2R1Y3Rpb24gKHByb3RvdHlwZSkgdmVyc2lvbiBvZiB0aGUgc2ltdWxhdGlvblxcbicgK1xyXG4gICAgJy0tcmVwbyA6IFRoZSBuYW1lIG9mIHRoZSByZXBvc2l0b3J5IHRvIGRlcGxveVxcbicgK1xyXG4gICAgJy0tYnJhbmNoIDogVGhlIHJlbGVhc2UgYnJhbmNoIG5hbWUgKGUuZy4gXCIxLjdcIikgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgZGVwbG95bWVudFxcbicgK1xyXG4gICAgJy0tYnJhbmRzIDogQSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBicmFuZCBuYW1lcyB0byBkZXBsb3lcXG4nICtcclxuICAgICctLW5vbmludGVyYWN0aXZlIDogSWYgc3BlY2lmaWVkLCBwcm9tcHRzIHdpbGwgYmUgc2tpcHBlZC4gU29tZSBwcm9tcHRzIHRoYXQgc2hvdWxkIG5vdCBiZSBhdXRvbWF0ZWQgd2lsbCBmYWlsIG91dFxcbicgK1xyXG4gICAgJy0tcmVkZXBsb3k6IElmIHNwZWNpZmllZCB3aXRoIG5vbmludGVyYWN0aXZlLCBhbGxvdyB0aGUgcHJvZHVjdGlvbiBkZXBsb3kgdG8gaGF2ZSB0aGUgc2FtZSB2ZXJzaW9uIGFzIHRoZSBwcmV2aW91cyBkZXBsb3lcXG4nICtcclxuICAgICctLW1lc3NhZ2UgOiBBbiBvcHRpb25hbCBtZXNzYWdlIHRoYXQgd2lsbCBiZSBhcHBlbmRlZCBvbiB2ZXJzaW9uLWNoYW5nZSBjb21taXRzLicsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBwcm9kdWN0aW9uID0gcmVxdWlyZSggJy4vcHJvZHVjdGlvbicgKTtcclxuXHJcbiAgICAgIGFzc2VydCggZ3J1bnQub3B0aW9uKCAncmVwbycgKSwgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYSByZXBvc2l0b3J5IHdpdGggLS1yZXBvPXt7UkVQT1NJVE9SWX19JyApO1xyXG4gICAgICBhc3NlcnQoIGdydW50Lm9wdGlvbiggJ2JyYW5jaCcgKSwgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYSBicmFuY2ggd2l0aCAtLWJyYW5jaD17e0JSQU5DSH19JyApO1xyXG4gICAgICBhc3NlcnQoIGdydW50Lm9wdGlvbiggJ2JyYW5kcycgKSwgJ1JlcXVpcmVzIHNwZWNpZnlpbmcgYnJhbmRzIChjb21tYS1zZXBhcmF0ZWQpIHdpdGggLS1icmFuZHM9e3tCUkFORFN9fScgKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlcG8gPSBncnVudC5vcHRpb24oICdyZXBvJyApO1xyXG4gICAgICBhc3NlcnRJc1ZhbGlkUmVwb05hbWUoIHJlcG8gKTtcclxuXHJcbiAgICAgIGF3YWl0IHByb2R1Y3Rpb24oIHJlcG8sIGdydW50Lm9wdGlvbiggJ2JyYW5jaCcgKSwgZ3J1bnQub3B0aW9uKCAnYnJhbmRzJyApLnNwbGl0KCAnLCcgKSwgbm9uaW50ZXJhY3RpdmUsXHJcbiAgICAgICAgZ3J1bnQub3B0aW9uKCAncmVkZXBsb3knICksIGdydW50Lm9wdGlvbiggJ21lc3NhZ2UnICkgKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdkZXBsb3ktZGVjYWYnLFxyXG4gICAgJ0RlcGxveXMgYSBkZWNhZiB2ZXJzaW9uIG9mIHRoZSBzaW11bGF0aW9uXFxuJyArXHJcbiAgICAnLS1wcm9qZWN0IDogVGhlIG5hbWUgb2YgdGhlIHByb2plY3QgdG8gZGVwbG95JyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGRlcGxveURlY2FmID0gcmVxdWlyZSggJy4vZGVjYWYvZGVwbG95RGVjYWYnICk7XHJcblxyXG4gICAgICBhc3NlcnQoIGdydW50Lm9wdGlvbiggJ3Byb2plY3QnICksICdSZXF1aXJlcyBzcGVjaWZ5aW5nIGEgcmVwb3NpdG9yeSB3aXRoIC0tcHJvamVjdD17e1BST0pFQ1R9fScgKTtcclxuICAgICAgYXNzZXJ0KCBncnVudC5vcHRpb24oICdkZXYnICkgfHwgZ3J1bnQub3B0aW9uKCAncHJvZHVjdGlvbicgKSwgJ1JlcXVpcmVzIGF0IGxlYXN0IG9uZSBvZiAtLWRldiBvciAtLXByb2R1Y3Rpb24nICk7XHJcbiAgICAgIGF3YWl0IGRlcGxveURlY2FmKCBncnVudC5vcHRpb24oICdwcm9qZWN0JyApLCAhIWdydW50Lm9wdGlvbiggJ2RldicgKSwgISFncnVudC5vcHRpb24oICdwcm9kdWN0aW9uJyApICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnYnVpbGQtZGVjYWYnLFxyXG4gICAgJ0J1aWxkcyBhIGRlY2FmIHZlcnNpb24gb2YgdGhlIHNpbXVsYXRpb25cXG4nICtcclxuICAgICctLXByb2plY3QgOiBUaGUgbmFtZSBvZiB0aGUgcHJvamVjdCB0byBkZXBsb3knLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgYnVpbGREZWNhZiA9IHJlcXVpcmUoICcuL2RlY2FmL2J1aWxkRGVjYWYnICk7XHJcblxyXG4gICAgICBhc3NlcnQoIGdydW50Lm9wdGlvbiggJ3Byb2plY3QnICksICdSZXF1aXJlcyBzcGVjaWZ5aW5nIGEgcmVwb3NpdG9yeSB3aXRoIC0tcHJvamVjdD17e1BST0pFQ1R9fScgKTtcclxuICAgICAgYXdhaXQgYnVpbGREZWNhZiggZ3J1bnQub3B0aW9uKCAncHJvamVjdCcgKSwgZ3J1bnQub3B0aW9uKCAncHJlbG9hZFJlc291cmNlcycgKSApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2NyZWF0ZS1zaW0nLFxyXG4gICAgJ0NyZWF0ZXMgYSBzaW0gYmFzZWQgb24gdGhlIHNpbXVsYS1yYXNhIHRlbXBsYXRlLlxcbicgK1xyXG4gICAgJy0tcmVwbz1cInN0cmluZ1wiIDogdGhlIHJlcG9zaXRvcnkgbmFtZVxcbicgK1xyXG4gICAgJy0tYXV0aG9yPVwic3RyaW5nXCIgOiB0aGUgYXV0aG9yIG5hbWVcXG4nICtcclxuICAgICctLXRpdGxlPVwic3RyaW5nXCIgOiAob3B0aW9uYWwpIHRoZSBzaW11bGF0aW9uIHRpdGxlXFxuJyArXHJcbiAgICAnLS1jbGVhbj10cnVlIDogKG9wdGlvbmFsKSBkZWxldGVzIHRoZSByZXBvc2l0b3J5IGRpcmVjdG9yeSBpZiBpdCBleGlzdHMnLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgY3JlYXRlU2ltID0gcmVxdWlyZSggJy4vY3JlYXRlU2ltJyApO1xyXG5cclxuICAgICAgY29uc3QgcmVwbyA9IGdydW50Lm9wdGlvbiggJ3JlcG8nICk7XHJcbiAgICAgIGFzc2VydElzVmFsaWRSZXBvTmFtZSggcmVwbyApO1xyXG5cclxuICAgICAgY29uc3QgYXV0aG9yID0gZ3J1bnQub3B0aW9uKCAnYXV0aG9yJyApO1xyXG4gICAgICBjb25zdCB0aXRsZSA9IGdydW50Lm9wdGlvbiggJ3RpdGxlJyApO1xyXG4gICAgICBjb25zdCBjbGVhbiA9IGdydW50Lm9wdGlvbiggJ2NsZWFuJyApO1xyXG5cclxuICAgICAgYXNzZXJ0KCByZXBvLCAnUmVxdWlyZXMgc3BlY2lmeWluZyBhIHJlcG9zaXRvcnkgbmFtZSB3aXRoIC0tcmVwbz17e1JFUE99fScgKTtcclxuICAgICAgYXNzZXJ0KCBncnVudC5vcHRpb24oICdhdXRob3InICksICdSZXF1aXJlcyBzcGVjaWZ5aW5nIGEgYXV0aG9yIHdpdGggLS1hdXRob3I9e3tBVVRIT1J9fScgKTtcclxuXHJcbiAgICAgIGF3YWl0IGNyZWF0ZVNpbSggcmVwbywgYXV0aG9yLCB7IHRpdGxlOiB0aXRsZSwgY2xlYW46IGNsZWFuIH0gKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdsaW50LWV2ZXJ5dGhpbmcnLCAnbGludCBhbGwganMgZmlsZXMgZm9yIGFsbCByZXBvcycsIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICBjb25zdCBnZXREYXRhRmlsZSA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2V0RGF0YUZpbGUnICk7XHJcblxyXG4gICAgLy8gLS1kaXNhYmxlLWVzbGludC1jYWNoZSBkaXNhYmxlcyB0aGUgY2FjaGUsIHVzZWZ1bCBmb3IgZGV2ZWxvcGluZyBydWxlc1xyXG4gICAgY29uc3QgY2FjaGUgPSAhZ3J1bnQub3B0aW9uKCAnZGlzYWJsZS1lc2xpbnQtY2FjaGUnICk7XHJcbiAgICBjb25zdCBhY3RpdmVSZXBvcyA9IGdldERhdGFGaWxlKCAnYWN0aXZlLXJlcG9zJyApLmZpbHRlciggcmVwbyA9PiByZXBvICE9PSAncGVyZW5uaWFsLWFsaWFzJyApOyAvLyByZW1vdmUgZHVwbGljYXRlIHBlcmVubmlhbCBjb3B5XHJcbiAgICBjb25zdCBmaXggPSBncnVudC5vcHRpb24oICdmaXgnICk7XHJcbiAgICBjb25zdCBjaGlwQXdheSA9IGdydW50Lm9wdGlvbiggJ2NoaXAtYXdheScgKTtcclxuICAgIGNvbnN0IHNob3dQcm9ncmVzc0JhciA9ICFncnVudC5vcHRpb24oICdoaWRlLXByb2dyZXNzLWJhcicgKTtcclxuXHJcbiAgICBsZXQgbGludDtcclxuICAgIHRyeSB7XHJcbiAgICAgIGxpbnQgPSByZXF1aXJlKCAnLi4vLi4vLi4vY2hpcHBlci9qcy9ncnVudC9saW50JyApO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCAnbGludCBwcm9jZXNzIG5vdCBmb3VuZCwgaXMgeW91ciBjaGlwcGVyIHJlcG8gdXAgdG8gZGF0ZT8nICk7XHJcbiAgICAgIGxpbnQgPSB7fTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUaGUgQVBJcyBhcmUgdGhlIHNhbWUgZm9yIHRoZXNlIHR3byB2ZXJzaW9ucyBvZiBsaW50IHN1cHBvcnRcclxuICAgIGlmICggbGludC5jaGlwcGVyQVBJVmVyc2lvbiA9PT0gJ3Byb21pc2VzUGVyUmVwbzEnIHx8IGxpbnQuY2hpcHBlckFQSVZlcnNpb24gPT09ICducHgnICkge1xyXG4gICAgICBjb25zdCBsaW50UmV0dXJuVmFsdWUgPSBhd2FpdCBsaW50KCBhY3RpdmVSZXBvcywge1xyXG4gICAgICAgIGNhY2hlOiBjYWNoZSxcclxuICAgICAgICBmaXg6IGZpeCxcclxuICAgICAgICBjaGlwQXdheTogY2hpcEF3YXksXHJcbiAgICAgICAgc2hvd1Byb2dyZXNzQmFyOiBzaG93UHJvZ3Jlc3NCYXJcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgLy8gT3V0cHV0IHJlc3VsdHMgb24gZXJyb3JzLlxyXG4gICAgICBpZiAoICFsaW50UmV0dXJuVmFsdWUub2sgKSB7XHJcbiAgICAgICAgZ3J1bnQuZmFpbC5mYXRhbCggJ0xpbnQgZmFpbGVkJyApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2dlbmVyYXRlLWRhdGEnLCAnR2VuZXJhdGVzIHRoZSBsaXN0cyB1bmRlciBwZXJlbm5pYWwvZGF0YS8sIGFuZCBpZiB0aGVyZSB3ZXJlIGNoYW5nZXMsIHdpbGwgY29tbWl0IGFuZCBwdXNoLicsIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICBjb25zdCBnZW5lcmF0ZURhdGEgPSByZXF1aXJlKCAnLi9nZW5lcmF0ZURhdGEnICk7XHJcbiAgICBhd2FpdCBnZW5lcmF0ZURhdGEoIGdydW50ICk7XHJcbiAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2Nsb25lLW1pc3NpbmctcmVwb3MnLCAnQ2xvbmVzIG1pc3NpbmcgcmVwb3MnLCB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgY29uc3QgY2xvbmVNaXNzaW5nUmVwb3MgPSByZXF1aXJlKCAnLi4vY29tbW9uL2Nsb25lTWlzc2luZ1JlcG9zJyApO1xyXG5cclxuICAgIGF3YWl0IGNsb25lTWlzc2luZ1JlcG9zKCk7XHJcbiAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ21haW50ZW5hbmNlJywgJ1N0YXJ0cyBhIG1haW50ZW5hbmNlIFJFUEwnLCB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgY29uc3QgTWFpbnRlbmFuY2UgPSByZXF1aXJlKCAnLi4vY29tbW9uL01haW50ZW5hbmNlJyApO1xyXG5cclxuICAgIGF3YWl0IE1haW50ZW5hbmNlLnN0YXJ0UkVQTCgpO1xyXG4gIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdtYWludGVuYW5jZS1jaGVjay1icmFuY2gtc3RhdHVzJywgJ1JlcG9ydHMgb3V0IG9uIHJlbGVhc2UgYnJhbmNoIHN0YXR1c2VzJywgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IE1haW50ZW5hbmNlID0gcmVxdWlyZSggJy4uL2NvbW1vbi9NYWludGVuYW5jZScgKTtcclxuICAgIGNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbiAgICB3aW5zdG9uLmRlZmF1bHQudHJhbnNwb3J0cy5jb25zb2xlLmxldmVsID0gJ2Vycm9yJztcclxuXHJcbiAgICBhd2FpdCBNYWludGVuYW5jZS5jaGVja0JyYW5jaFN0YXR1cygpO1xyXG4gIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdtYWludGVuYW5jZS1saXN0JywgJ0xpc3RzIG91dCB0aGUgY3VycmVudCBtYWludGVuYW5jZSBwcm9jZXNzIHN0YXRlJywgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IE1haW50ZW5hbmNlID0gcmVxdWlyZSggJy4uL2NvbW1vbi9NYWludGVuYW5jZScgKTtcclxuICAgIGF3YWl0IE1haW50ZW5hbmNlLmxpc3QoKTtcclxuICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnbWFpbnRlbmFuY2UtY3JlYXRlLXBhdGNoJywgJ0FkZHMgYSBwYXRjaCB0byB0aGUgbWFpbnRlbmFuY2UgcHJvY2VzcycsIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICBjb25zdCBNYWludGVuYW5jZSA9IHJlcXVpcmUoICcuLi9jb21tb24vTWFpbnRlbmFuY2UnICk7XHJcblxyXG4gICAgY29uc3QgcmVwbyA9IGdydW50Lm9wdGlvbiggJ3JlcG8nICk7XHJcbiAgICBhc3NlcnRJc1ZhbGlkUmVwb05hbWUoIHJlcG8gKTtcclxuXHJcbiAgICBjb25zdCBtZXNzYWdlID0gZ3J1bnQub3B0aW9uKCAnbWVzc2FnZScgKTtcclxuXHJcbiAgICBhc3NlcnQoIHJlcG8sICdSZXF1aXJlcyBzcGVjaWZ5aW5nIGEgcmVwbyB0aGF0IHdpbGwgbmVlZCB0byBiZSBwYXRjaGVkIHdpdGggLS1yZXBvPXt7UkVQT319JyApO1xyXG4gICAgYXNzZXJ0KCBncnVudC5vcHRpb24oICdtZXNzYWdlJyApLCAnUmVxdWlyZXMgc3BlY2lmeWluZyBhIG1lc3NhZ2UgKGluY2x1ZGVkIHdpdGggY29tbWl0cykgd2l0aCAtLW1lc3NhZ2U9e3tNRVNTQUdFfX0nICk7XHJcblxyXG4gICAgYXdhaXQgTWFpbnRlbmFuY2UuY3JlYXRlUGF0Y2goIHJlcG8sIG1lc3NhZ2UgKTtcclxuICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAncmVvcGVuLWlzc3Vlcy1mcm9tLXRvZG9zJywgJ0lmIHRoZXJlIGlzIGEgVE9ETyBpbiB0aGUgcHJvamVjdCBwb2ludGluZyB0byBhIGNsb3NlZCBpc3N1ZSwgcmVvcGVuIGl0LicsIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICBhd2FpdCByZXF1aXJlKCAnLi9yZW9wZW5Jc3N1ZXNGcm9tVE9ET3MnICkoKTtcclxuICB9ICkgKTtcclxufTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7K0NBQ0EscUpBQUFBLG1CQUFBLFlBQUFBLG9CQUFBLFdBQUFDLENBQUEsU0FBQUMsQ0FBQSxFQUFBRCxDQUFBLE9BQUFFLENBQUEsR0FBQUMsTUFBQSxDQUFBQyxTQUFBLEVBQUFDLENBQUEsR0FBQUgsQ0FBQSxDQUFBSSxjQUFBLEVBQUFDLENBQUEsR0FBQUosTUFBQSxDQUFBSyxjQUFBLGNBQUFQLENBQUEsRUFBQUQsQ0FBQSxFQUFBRSxDQUFBLElB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