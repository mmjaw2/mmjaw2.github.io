"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Copyright 2018, University of Colorado Boulder

/**
 * Represents a simulation release branch for deployment
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var buildLocal = require('./buildLocal');
var buildServerRequest = require('./buildServerRequest');
var ChipperVersion = require('./ChipperVersion');
var checkoutMain = require('./checkoutMain');
var checkoutTarget = require('./checkoutTarget');
var createDirectory = require('./createDirectory');
var execute = require('./execute');
var getActiveSims = require('./getActiveSims');
var getBranchDependencies = require('./getBranchDependencies');
var getBranches = require('./getBranches');
var getBuildArguments = require('./getBuildArguments');
var getDependencies = require('./getDependencies');
var getBranchMap = require('./getBranchMap');
var getBranchVersion = require('./getBranchVersion');
var getFileAtBranch = require('./getFileAtBranch');
var getRepoVersion = require('./getRepoVersion');
var gitCheckout = require('./gitCheckout');
var gitCheckoutDirectory = require('./gitCheckoutDirectory');
var gitCloneOrFetchDirectory = require('./gitCloneOrFetchDirectory');
var gitFirstDivergingCommit = require('./gitFirstDivergingCommit');
var gitIsAncestor = require('./gitIsAncestor');
var gitPull = require('./gitPull');
var gitPullDirectory = require('./gitPullDirectory');
var gitRevParse = require('./gitRevParse');
var gitTimestamp = require('./gitTimestamp');
var gruntCommand = require('./gruntCommand');
var loadJSON = require('./loadJSON');
var npmUpdateDirectory = require('./npmUpdateDirectory');
var puppeteerLoad = require('./puppeteerLoad');
var simMetadata = require('./simMetadata');
var simPhetioMetadata = require('./simPhetioMetadata');
var withServer = require('./withServer');
var assert = require('assert');
var fs = require('fs');
var winston = require('../../../../../../perennial-alias/node_modules/winston');
var _ = require('lodash');
module.exports = function () {
  var MAINTENANCE_DIRECTORY = '../release-branches';
  var ReleaseBranch = /*#__PURE__*/function () {
    /**
     * @public
     * @constructor
     *
     * @param {string} repo
     * @param {string} branch
     * @param {Array.<string>} brands
     * @param {boolean} isReleased
     */
    function ReleaseBranch(repo, branch, brands, isReleased) {
      _classCallCheck(this, ReleaseBranch);
      assert(typeof repo === 'string');
      assert(typeof branch === 'string');
      assert(Array.isArray(brands));
      assert(typeof isReleased === 'boolean');

      // @public {string}
      this.repo = repo;
      this.branch = branch;

      // @public {Array.<string>}
      this.brands = brands;

      // @public {boolean}
      this.isReleased = isReleased;
    }

    /**
     * Convert into a plain JS object meant for JSON serialization.
     * @public
     *
     * @returns {Object}
     */
    return _createClass(ReleaseBranch, [{
      key: "serialize",
      value: function serialize() {
        return {
          repo: this.repo,
          branch: this.branch,
          brands: this.brands,
          isReleased: this.isReleased
        };
      }

      /**
       * Takes a serialized form of the ReleaseBranch and returns an actual instance.
       * @public
       *
       * @param {Object}
       * @returns {ReleaseBranch}
       */
    }, {
      key: "equals",
      value:
      /**
       * Returns whether the two release branches contain identical information.
       * @public
       *
       * @param {ReleaseBranch} releaseBranch
       * @returns {boolean}
       */
      function equals(releaseBranch) {
        return this.repo === releaseBranch.repo && this.branch === releaseBranch.branch && this.brands.join(',') === releaseBranch.brands.join(',') && this.isReleased === releaseBranch.isReleased;
      }

      /**
       * Converts it to a (debuggable) string form.
       * @public
       *
       * @returns {string}
       */
    }, {
      key: "toString",
      value: function toString() {
        return "".concat(this.repo, " ").concat(this.branch, " ").concat(this.brands.join(',')).concat(this.isReleased ? '' : ' (unpublished)');
      }

      /**
       * @public
       *
       * @param repo {string}
       * @param branch {string}
       * @returns {string}
       */
    }, {
      key: "getLocalPhetBuiltHTMLPath",
      value: (
      /**
       * Returns the path (relative to the repo) to the built phet-brand HTML file
       * @public
       *
       * @returns {Promise<string>}
       */
      function () {
        var _getLocalPhetBuiltHTMLPath = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
          var usesChipper2;
          return _regeneratorRuntime().wrap(function _callee$(_context) {
            while (1) switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.usesChipper2();
              case 2:
                usesChipper2 = _context.sent;
                return _context.abrupt("return", "build/".concat(usesChipper2 ? 'phet/' : '').concat(this.repo, "_en").concat(usesChipper2 ? '_phet' : '', ".html"));
              case 4:
              case "end":
                return _context.stop();
            }
          }, _callee, this);
        }));
        function getLocalPhetBuiltHTMLPath() {
          return _getLocalPhetBuiltHTMLPath.apply(this, arguments);
        }
        return getLocalPhetBuiltHTMLPath;
      }()
      /**
       * Returns the path (relative to the repo) to the built phet-io-brand HTML file
       * @public
       *
       * @returns {Promise<string>}
       */
      )
    }, {
      key: "getLocalPhetIOBuiltHTMLPath",
      value: (function () {
        var _getLocalPhetIOBuiltHTMLPath = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
          var usesChipper2;
          return _regeneratorRuntime().wrap(function _callee2$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.usesChipper2();
              case 2:
                usesChipper2 = _context2.sent;
                return _context2.abrupt("return", "build/".concat(usesChipper2 ? 'phet-io/' : '').concat(this.repo).concat(usesChipper2 ? '_all_phet-io' : '_en-phetio', ".html"));
              case 4:
              case "end":
                return _context2.stop();
            }
          }, _callee2, this);
        }));
        function getLocalPhetIOBuiltHTMLPath() {
          return _getLocalPhetIOBuiltHTMLPath.apply(this, arguments);
        }
        return getLocalPhetIOBuiltHTMLPath;
      }()
      /**
       * Returns the query parameter to use for activating phet-io standalone mode
       * @public
       *
       * @returns {Promise<string>}
       */
      )
    }, {
      key: "getPhetioStandaloneQueryParameter",
      value: (function () {
        var _getPhetioStandaloneQueryParameter = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
          return _regeneratorRuntime().wrap(function _callee3$(_context3) {
            while (1) switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.usesOldPhetioStandalone();
              case 2:
                if (!_context3.sent) {
                  _context3.next = 6;
                  break;
                }
                _context3.t0 = 'phet-io.standalone';
                _context3.next = 7;
                break;
              case 6:
                _context3.t0 = 'phetioStandalone';
              case 7:
                return _context3.abrupt("return", _context3.t0);
              case 8:
              case "end":
                return _context3.stop();
            }
          }, _callee3, this);
        }));
        function getPhetioStandaloneQueryParameter() {
          return _getPhetioStandaloneQueryParameter.apply(this, arguments);
        }
        return getPhetioStandaloneQueryParameter;
      }()
      /**
       * @public
       *
       * @returns {ChipperVersion}
       */
      )
    }, {
      key: "getChipperVersion",
      value: function getChipperVersion() {
        var checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
        return ChipperVersion.getFromPackageJSON(JSON.parse(fs.readFileSync("".concat(checkoutDirectory, "/chipper/package.json"), 'utf8')));
      }

      /**
       * @public
       */
    }, {
      key: "updateCheckout",
      value: (function () {
        var _updateCheckout = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
          var _this = this;
          var overrideDependencies,
            checkoutDirectory,
            dependenciesOnBranchTip,
            dependencyRepos,
            _args5 = arguments;
          return _regeneratorRuntime().wrap(function _callee5$(_context5) {
            while (1) switch (_context5.prev = _context5.next) {
              case 0:
                overrideDependencies = _args5.length > 0 && _args5[0] !== undefined ? _args5[0] : {};
                winston.info("updating checkout for ".concat(this.toString()));
                if (fs.existsSync(MAINTENANCE_DIRECTORY)) {
                  _context5.next = 6;
                  break;
                }
                winston.info("creating directory ".concat(MAINTENANCE_DIRECTORY));
                _context5.next = 6;
                return createDirectory(MAINTENANCE_DIRECTORY);
              case 6:
                checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
                if (fs.existsSync(checkoutDirectory)) {
                  _context5.next = 11;
                  break;
                }
                winston.info("creating directory ".concat(checkoutDirectory));
                _context5.next = 11;
                return createDirectory(checkoutDirectory);
              case 11:
                _context5.next = 13;
                return gitCloneOrFetchDirectory(this.repo, checkoutDirectory);
              case 13:
                _context5.next = 15;
                return gitCheckoutDirectory(this.branch, "".concat(checkoutDirectory, "/").concat(this.repo));
              case 15:
                _context5.next = 17;
                return gitPullDirectory("".concat(checkoutDirectory, "/").concat(this.repo));
              case 17:
                _context5.next = 19;
                return loadJSON("".concat(checkoutDirectory, "/").concat(this.repo, "/dependencies.json"));
              case 19:
                dependenciesOnBranchTip = _context5.sent;
                dependenciesOnBranchTip.babel = {
                  sha: buildLocal.babelBranch,
                  branch: buildLocal.babelBranch
                };
                dependencyRepos = _.uniq([].concat(_toConsumableArray(Object.keys(dependenciesOnBranchTip)), _toConsumableArray(Object.keys(overrideDependencies))).filter(function (repo) {
                  return repo !== 'comment';
                }));
                _context5.next = 24;
                return Promise.all(dependencyRepos.map( /*#__PURE__*/function () {
                  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(repo) {
                    var repoPwd, sha;
                    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
                      while (1) switch (_context4.prev = _context4.next) {
                        case 0:
                          repoPwd = "".concat(checkoutDirectory, "/").concat(repo);
                          _context4.next = 3;
                          return gitCloneOrFetchDirectory(repo, checkoutDirectory);
                        case 3:
                          sha = overrideDependencies[repo] ? overrideDependencies[repo].sha : dependenciesOnBranchTip[repo].sha;
                          _context4.next = 6;
                          return gitCheckoutDirectory(sha, repoPwd);
                        case 6:
                          if (!(repo === 'babel')) {
                            _context4.next = 9;
                            break;
                          }
                          _context4.next = 9;
                          return gitPullDirectory(repoPwd);
                        case 9:
                          if (!(repo === 'chipper' || repo === 'perennial-alias' || repo === _this.repo)) {
                            _context4.next = 13;
                            break;
                          }
                          winston.info("npm ".concat(repo, " in ").concat(checkoutDirectory));
                          _context4.next = 13;
                          return npmUpdateDirectory(repoPwd);
                        case 13:
                        case "end":
                          return _context4.stop();
                      }
                    }, _callee4);
                  }));
                  return function (_x) {
                    return _ref.apply(this, arguments);
                  };
                }()));
              case 24:
                _context5.next = 26;
                return gitCloneOrFetchDirectory('perennial', checkoutDirectory);
              case 26:
              case "end":
                return _context5.stop();
            }
          }, _callee5, this);
        }));
        function updateCheckout() {
          return _updateCheckout.apply(this, arguments);
        }
        return updateCheckout;
      }()
      /**
       * @public
       *
       * @param {Object} [options] - optional parameters for getBuildArguments
       */
      )
    }, {
      key: "build",
      value: (function () {
        var _build = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(options) {
          var checkoutDirectory, repoDirectory, args;
          return _regeneratorRuntime().wrap(function _callee6$(_context6) {
            while (1) switch (_context6.prev = _context6.next) {
              case 0:
                checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
                repoDirectory = "".concat(checkoutDirectory, "/").concat(this.repo);
                args = getBuildArguments(this.getChipperVersion(), _.merge({
                  brands: this.brands,
                  allHTML: true,
                  debugHTML: true,
                  lint: false,
                  locales: '*'
                }, options));
                winston.info("building ".concat(checkoutDirectory, " with grunt ").concat(args.join(' ')));
                _context6.next = 6;
                return execute(gruntCommand, args, repoDirectory);
              case 6:
              case "end":
                return _context6.stop();
            }
          }, _callee6, this);
        }));
        function build(_x2) {
          return _build.apply(this, arguments);
        }
        return build;
      }()
      /**
       * @public
       */
      )
    }, {
      key: "transpile",
      value: (function () {
        var _transpile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7() {
          var checkoutDirectory, repoDirectory;
          return _regeneratorRuntime().wrap(function _callee7$(_context7) {
            while (1) switch (_context7.prev = _context7.next) {
              case 0:
                checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
                repoDirectory = "".concat(checkoutDirectory, "/").concat(this.repo);
                winston.info("transpiling ".concat(checkoutDirectory));

                // We might not be able to run this command!
                _context7.next = 5;
                return execute(gruntCommand, ['output-js-project'], repoDirectory, {
                  errors: 'resolve'
                });
              case 5:
              case "end":
                return _context7.stop();
            }
          }, _callee7, this);
        }));
        function transpile() {
          return _transpile.apply(this, arguments);
        }
        return transpile;
      }()
      /**
       * @public
       *
       * @returns {Promise<string|null>} - Error string, or null if no error
       */
      )
    }, {
      key: "checkUnbuilt",
      value: (function () {
        var _checkUnbuilt = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9() {
          var _this2 = this;
          return _regeneratorRuntime().wrap(function _callee9$(_context9) {
            while (1) switch (_context9.prev = _context9.next) {
              case 0:
                _context9.prev = 0;
                _context9.next = 3;
                return withServer( /*#__PURE__*/function () {
                  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8(port) {
                    var url;
                    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
                      while (1) switch (_context8.prev = _context8.next) {
                        case 0:
                          url = "http://localhost:".concat(port, "/").concat(_this2.repo, "/").concat(_this2.repo, "_en.html?brand=phet&ea&fuzzMouse&fuzzTouch");
                          _context8.prev = 1;
                          _context8.next = 4;
                          return puppeteerLoad(url, {
                            waitAfterLoad: 20000
                          });
                        case 4:
                          return _context8.abrupt("return", _context8.sent);
                        case 7:
                          _context8.prev = 7;
                          _context8.t0 = _context8["catch"](1);
                          return _context8.abrupt("return", "Failure for ".concat(url, ": ").concat(_context8.t0));
                        case 10:
                        case "end":
                          return _context8.stop();
                      }
                    }, _callee8, null, [[1, 7]]);
                  }));
                  return function (_x3) {
                    return _ref2.apply(this, arguments);
                  };
                }(), {
                  path: ReleaseBranch.getCheckoutDirectory(this.repo, this.branch)
                });
              case 3:
                return _context9.abrupt("return", _context9.sent);
              case 6:
                _context9.prev = 6;
                _context9.t0 = _context9["catch"](0);
                return _context9.abrupt("return", "[ERROR] Failure to check: ".concat(_context9.t0));
              case 9:
              case "end":
                return _context9.stop();
            }
          }, _callee9, this, [[0, 6]]);
        }));
        function checkUnbuilt() {
          return _checkUnbuilt.apply(this, arguments);
        }
        return checkUnbuilt;
      }()
      /**
       * @public
       *
       * @returns {Promise<string|null>} - Error string, or null if no error
       */
      )
    }, {
      key: "checkBuilt",
      value: (function () {
        var _checkBuilt = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11() {
          var _this3 = this;
          var usesChipper2;
          return _regeneratorRuntime().wrap(function _callee11$(_context11) {
            while (1) switch (_context11.prev = _context11.next) {
              case 0:
                _context11.prev = 0;
                _context11.next = 3;
                return this.usesChipper2();
              case 3:
                usesChipper2 = _context11.sent;
                _context11.next = 6;
                return withServer( /*#__PURE__*/function () {
                  var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10(port) {
                    var url;
                    return _regeneratorRuntime().wrap(function _callee10$(_context10) {
                      while (1) switch (_context10.prev = _context10.next) {
                        case 0:
                          url = "http://localhost:".concat(port, "/").concat(_this3.repo, "/build/").concat(usesChipper2 ? 'phet/' : '').concat(_this3.repo, "_en").concat(usesChipper2 ? '_phet' : '', ".html?fuzzMouse&fuzzTouch");
                          _context10.prev = 1;
                          return _context10.abrupt("return", puppeteerLoad(url, {
                            waitAfterLoad: 20000
                          }));
                        case 5:
                          _context10.prev = 5;
                          _context10.t0 = _context10["catch"](1);
                          return _context10.abrupt("return", "Failure for ".concat(url, ": ").concat(_context10.t0));
                        case 8:
                        case "end":
                          return _context10.stop();
                      }
                    }, _callee10, null, [[1, 5]]);
                  }));
                  return function (_x4) {
                    return _ref3.apply(this, arguments);
                  };
                }(), {
                  path: ReleaseBranch.getCheckoutDirectory(this.repo, this.branch)
                });
              case 6:
                return _context11.abrupt("return", _context11.sent);
              case 9:
                _context11.prev = 9;
                _context11.t0 = _context11["catch"](0);
                return _context11.abrupt("return", "[ERROR] Failure to check: ".concat(_context11.t0));
              case 12:
              case "end":
                return _context11.stop();
            }
          }, _callee11, this, [[0, 9]]);
        }));
        function checkBuilt() {
          return _checkBuilt.apply(this, arguments);
        }
        return checkBuilt;
      }()
      /**
       * Checks this release branch out.
       * @public
       *
       * @param {boolean} includeNpmUpdate
       */
      )
    }, {
      key: "checkout",
      value: (function () {
        var _checkout = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee12(includeNpmUpdate) {
          return _regeneratorRuntime().wrap(function _callee12$(_context12) {
            while (1) switch (_context12.prev = _context12.next) {
              case 0:
                _context12.next = 2;
                return checkoutTarget(this.repo, this.branch, includeNpmUpdate);
              case 2:
              case "end":
                return _context12.stop();
            }
          }, _callee12, this);
        }));
        function checkout(_x5) {
          return _checkout.apply(this, arguments);
        }
        return checkout;
      }()
      /**
       * Whether this release branch includes the given SHA for the given repo dependency. Will be false if it doesn't
       * depend on this repository.
       * @public
       *
       * @param {string} repo
       * @param {string} sha
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "includesSHA",
      value: (function () {
        var _includesSHA = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee13(repo, sha) {
          var result, dependencies, currentSHA;
          return _regeneratorRuntime().wrap(function _callee13$(_context13) {
            while (1) switch (_context13.prev = _context13.next) {
              case 0:
                result = false;
                _context13.next = 3;
                return gitCheckout(this.repo, this.branch);
              case 3:
                _context13.next = 5;
                return getDependencies(this.repo);
              case 5:
                dependencies = _context13.sent;
                if (!dependencies[repo]) {
                  _context13.next = 14;
                  break;
                }
                currentSHA = dependencies[repo].sha;
                _context13.t0 = sha === currentSHA;
                if (_context13.t0) {
                  _context13.next = 13;
                  break;
                }
                _context13.next = 12;
                return gitIsAncestor(repo, sha, currentSHA);
              case 12:
                _context13.t0 = _context13.sent;
              case 13:
                result = _context13.t0;
              case 14:
                _context13.next = 16;
                return gitCheckout(this.repo, 'main');
              case 16:
                return _context13.abrupt("return", result);
              case 17:
              case "end":
                return _context13.stop();
            }
          }, _callee13, this);
        }));
        function includesSHA(_x6, _x7) {
          return _includesSHA.apply(this, arguments);
        }
        return includesSHA;
      }()
      /**
       * Whether this release branch does NOT include the given SHA for the given repo dependency. Will be false if it doesn't
       * depend on this repository.
       * @public
       *
       * @param {string} repo
       * @param {string} sha
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "isMissingSHA",
      value: (function () {
        var _isMissingSHA = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee14(repo, sha) {
          var result, dependencies, currentSHA;
          return _regeneratorRuntime().wrap(function _callee14$(_context14) {
            while (1) switch (_context14.prev = _context14.next) {
              case 0:
                result = false;
                _context14.next = 3;
                return gitCheckout(this.repo, this.branch);
              case 3:
                _context14.next = 5;
                return getDependencies(this.repo);
              case 5:
                dependencies = _context14.sent;
                if (!dependencies[repo]) {
                  _context14.next = 14;
                  break;
                }
                currentSHA = dependencies[repo].sha;
                _context14.t0 = sha !== currentSHA;
                if (!_context14.t0) {
                  _context14.next = 13;
                  break;
                }
                _context14.next = 12;
                return gitIsAncestor(repo, sha, currentSHA);
              case 12:
                _context14.t0 = !_context14.sent;
              case 13:
                result = _context14.t0;
              case 14:
                _context14.next = 16;
                return gitCheckout(this.repo, 'main');
              case 16:
                return _context14.abrupt("return", result);
              case 17:
              case "end":
                return _context14.stop();
            }
          }, _callee14, this);
        }));
        function isMissingSHA(_x8, _x9) {
          return _isMissingSHA.apply(this, arguments);
        }
        return isMissingSHA;
      }()
      /**
       * The SHA at which this release branch's main repository diverged from main.
       * @public
       *
       * @returns {Promise.<string>}
       */
      )
    }, {
      key: "getDivergingSHA",
      value: (function () {
        var _getDivergingSHA = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee15() {
          return _regeneratorRuntime().wrap(function _callee15$(_context15) {
            while (1) switch (_context15.prev = _context15.next) {
              case 0:
                _context15.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context15.next = 4;
                return gitPull(this.repo);
              case 4:
                _context15.next = 6;
                return gitCheckout(this.repo, 'main');
              case 6:
                return _context15.abrupt("return", gitFirstDivergingCommit(this.repo, this.branch, 'main'));
              case 7:
              case "end":
                return _context15.stop();
            }
          }, _callee15, this);
        }));
        function getDivergingSHA() {
          return _getDivergingSHA.apply(this, arguments);
        }
        return getDivergingSHA;
      }()
      /**
       * The timestamp at which this release branch's main repository diverged from main.
       * @public
       *
       * @returns {Promise.<number>}
       */
      )
    }, {
      key: "getDivergingTimestamp",
      value: (function () {
        var _getDivergingTimestamp = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee16() {
          return _regeneratorRuntime().wrap(function _callee16$(_context16) {
            while (1) switch (_context16.prev = _context16.next) {
              case 0:
                _context16.t0 = gitTimestamp;
                _context16.t1 = this.repo;
                _context16.next = 4;
                return this.getDivergingSHA();
              case 4:
                _context16.t2 = _context16.sent;
                return _context16.abrupt("return", (0, _context16.t0)(_context16.t1, _context16.t2));
              case 6:
              case "end":
                return _context16.stop();
            }
          }, _callee16, this);
        }));
        function getDivergingTimestamp() {
          return _getDivergingTimestamp.apply(this, arguments);
        }
        return getDivergingTimestamp;
      }()
      /**
       * Returns the dependencies.json for this release branch
       * @public
       *
       * @returns {Promise}
       */
      )
    }, {
      key: "getDependencies",
      value: (function () {
        var _getDependencies = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee17() {
          return _regeneratorRuntime().wrap(function _callee17$(_context17) {
            while (1) switch (_context17.prev = _context17.next) {
              case 0:
                return _context17.abrupt("return", getBranchDependencies(this.repo, this.branch));
              case 1:
              case "end":
                return _context17.stop();
            }
          }, _callee17, this);
        }));
        function getDependencies() {
          return _getDependencies.apply(this, arguments);
        }
        return getDependencies;
      }()
      /**
       * Returns the SimVersion for this release branch
       * @public
       *
       * @returns {Promise<SimVersion>}
       */
      )
    }, {
      key: "getSimVersion",
      value: (function () {
        var _getSimVersion = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee18() {
          return _regeneratorRuntime().wrap(function _callee18$(_context18) {
            while (1) switch (_context18.prev = _context18.next) {
              case 0:
                return _context18.abrupt("return", getBranchVersion(this.repo, this.branch));
              case 1:
              case "end":
                return _context18.stop();
            }
          }, _callee18, this);
        }));
        function getSimVersion() {
          return _getSimVersion.apply(this, arguments);
        }
        return getSimVersion;
      }()
      /**
       * Returns a list of status messages of anything out-of-the-ordinary
       * @public
       *
       * @returns {Promise.<Array.<string>>}
       */
      )
    }, {
      key: "getStatus",
      value: (function () {
        var _getStatus = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee19() {
          var _this4 = this;
          var getBranchMapAsyncCallback,
            results,
            dependencies,
            dependencyNames,
            currentCommit,
            previousCommit,
            _iterator,
            _step,
            dependency,
            potentialReleaseBranch,
            branchMap,
            _args19 = arguments;
          return _regeneratorRuntime().wrap(function _callee19$(_context19) {
            while (1) switch (_context19.prev = _context19.next) {
              case 0:
                getBranchMapAsyncCallback = _args19.length > 0 && _args19[0] !== undefined ? _args19[0] : getBranchMap;
                results = [];
                _context19.next = 4;
                return this.getDependencies();
              case 4:
                dependencies = _context19.sent;
                dependencyNames = Object.keys(dependencies).filter(function (key) {
                  return key !== 'comment' && key !== _this4.repo && key !== 'phet-io-wrapper-sonification';
                }); // Check our own dependency
                if (!dependencies[this.repo]) {
                  _context19.next = 30;
                  break;
                }
                _context19.prev = 7;
                _context19.next = 10;
                return gitRevParse(this.repo, this.branch);
              case 10:
                currentCommit = _context19.sent;
                _context19.next = 13;
                return gitRevParse(this.repo, "".concat(currentCommit, "^"));
              case 13:
                previousCommit = _context19.sent;
                if (dependencies[this.repo].sha !== previousCommit) {
                  results.push('[INFO] Potential changes (dependency is not previous commit)');
                  results.push("[INFO] ".concat(currentCommit, " ").concat(previousCommit, " ").concat(dependencies[this.repo].sha));
                }
                _context19.next = 17;
                return this.getSimVersion();
              case 17:
                _context19.t1 = _context19.sent.testType;
                _context19.t0 = _context19.t1 === 'rc';
                if (!_context19.t0) {
                  _context19.next = 21;
                  break;
                }
                _context19.t0 = this.isReleased;
              case 21:
                if (!_context19.t0) {
                  _context19.next = 23;
                  break;
                }
                results.push('[INFO] Release candidate version detected (see if there is a QA issue)');
              case 23:
                _context19.next = 28;
                break;
              case 25:
                _context19.prev = 25;
                _context19.t2 = _context19["catch"](7);
                results.push("[ERROR] Failure to check current/previous commit: ".concat(_context19.t2.message));
              case 28:
                _context19.next = 31;
                break;
              case 30:
                results.push('[WARNING] Own repository not included in dependencies');
              case 31:
                _iterator = _createForOfIteratorHelper(dependencyNames);
                _context19.prev = 32;
                _iterator.s();
              case 34:
                if ((_step = _iterator.n()).done) {
                  _context19.next = 43;
                  break;
                }
                dependency = _step.value;
                potentialReleaseBranch = "".concat(this.repo, "-").concat(this.branch);
                _context19.next = 39;
                return getBranchMapAsyncCallback(dependency);
              case 39:
                branchMap = _context19.sent;
                if (Object.keys(branchMap).includes(potentialReleaseBranch)) {
                  if (dependencies[dependency].sha !== branchMap[potentialReleaseBranch]) {
                    results.push("[WARNING] Dependency mismatch for ".concat(dependency, " on branch ").concat(potentialReleaseBranch));
                  }
                }
              case 41:
                _context19.next = 34;
                break;
              case 43:
                _context19.next = 48;
                break;
              case 45:
                _context19.prev = 45;
                _context19.t3 = _context19["catch"](32);
                _iterator.e(_context19.t3);
              case 48:
                _context19.prev = 48;
                _iterator.f();
                return _context19.finish(48);
              case 51:
                return _context19.abrupt("return", results);
              case 52:
              case "end":
                return _context19.stop();
            }
          }, _callee19, this, [[7, 25], [32, 45, 48, 51]]);
        }));
        function getStatus() {
          return _getStatus.apply(this, arguments);
        }
        return getStatus;
      }()
      /**
       * Returns whether the sim is compatible with ES6 features
       * @public
       *
       * @returns {Promise<boolean>}
       */
      )
    }, {
      key: "usesES6",
      value: (function () {
        var _usesES = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee20() {
          var dependencies, sha;
          return _regeneratorRuntime().wrap(function _callee20$(_context20) {
            while (1) switch (_context20.prev = _context20.next) {
              case 0:
                _context20.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context20.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context20.sent;
                sha = dependencies.chipper.sha;
                _context20.next = 8;
                return gitCheckout(this.repo, 'main');
              case 8:
                return _context20.abrupt("return", gitIsAncestor('chipper', '80b4ad62cd8f2057b844f18d3c00cf5c0c89ed8d', sha));
              case 9:
              case "end":
                return _context20.stop();
            }
          }, _callee20, this);
        }));
        function usesES6() {
          return _usesES.apply(this, arguments);
        }
        return usesES6;
      }()
      /**
       * Returns whether this sim uses initialize-globals based query parameters
       * @public
       *
       * If true:
       *   phet.chipper.queryParameters.WHATEVER
       *   AND it needs to be in the schema
       *
       * If false:
       *   phet.chipper.getQueryParameter( 'WHATEVER' )
       *   FLAGS should use !!phet.chipper.getQueryParameter( 'WHATEVER' )
       *
       * @returns {Promise<boolean>}
       */
      )
    }, {
      key: "usesInitializeGlobalsQueryParameters",
      value: (function () {
        var _usesInitializeGlobalsQueryParameters = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee21() {
          var dependencies, sha;
          return _regeneratorRuntime().wrap(function _callee21$(_context21) {
            while (1) switch (_context21.prev = _context21.next) {
              case 0:
                _context21.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context21.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context21.sent;
                sha = dependencies.chipper.sha;
                _context21.next = 8;
                return gitCheckout(this.repo, 'main');
              case 8:
                return _context21.abrupt("return", gitIsAncestor('chipper', 'e454f88ff51d1e3fabdb3a076d7407a2a9e9133c', sha));
              case 9:
              case "end":
                return _context21.stop();
            }
          }, _callee21, this);
        }));
        function usesInitializeGlobalsQueryParameters() {
          return _usesInitializeGlobalsQueryParameters.apply(this, arguments);
        }
        return usesInitializeGlobalsQueryParameters;
      }()
      /**
       * Returns whether phet-io.standalone is the correct phet-io query parameter (otherwise it's the newer
       * phetioStandalone).
       * Looks for the presence of https://github.com/phetsims/chipper/commit/4814d6966c54f250b1c0f3909b71f2b9cfcc7665.
       * @public
       *
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "usesOldPhetioStandalone",
      value: (function () {
        var _usesOldPhetioStandalone = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee22() {
          var dependencies, sha;
          return _regeneratorRuntime().wrap(function _callee22$(_context22) {
            while (1) switch (_context22.prev = _context22.next) {
              case 0:
                _context22.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context22.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context22.sent;
                sha = dependencies.chipper.sha;
                _context22.next = 8;
                return gitCheckout(this.repo, 'main');
              case 8:
                _context22.next = 10;
                return gitIsAncestor('chipper', '4814d6966c54f250b1c0f3909b71f2b9cfcc7665', sha);
              case 10:
                return _context22.abrupt("return", !_context22.sent);
              case 11:
              case "end":
                return _context22.stop();
            }
          }, _callee22, this);
        }));
        function usesOldPhetioStandalone() {
          return _usesOldPhetioStandalone.apply(this, arguments);
        }
        return usesOldPhetioStandalone;
      }()
      /**
       * Returns whether the relativeSimPath query parameter is used for wrappers (instead of launchLocalVersion).
       * Looks for the presence of https://github.com/phetsims/phet-io/commit/e3fc26079358d86074358a6db3ebaf1af9725632
       * @public
       *
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "usesRelativeSimPath",
      value: (function () {
        var _usesRelativeSimPath = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee23() {
          var dependencies, sha;
          return _regeneratorRuntime().wrap(function _callee23$(_context23) {
            while (1) switch (_context23.prev = _context23.next) {
              case 0:
                _context23.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context23.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context23.sent;
                if (dependencies['phet-io']) {
                  _context23.next = 7;
                  break;
                }
                return _context23.abrupt("return", true);
              case 7:
                sha = dependencies['phet-io'].sha;
                _context23.next = 10;
                return gitCheckout(this.repo, 'main');
              case 10:
                return _context23.abrupt("return", gitIsAncestor('phet-io', 'e3fc26079358d86074358a6db3ebaf1af9725632', sha));
              case 11:
              case "end":
                return _context23.stop();
            }
          }, _callee23, this);
        }));
        function usesRelativeSimPath() {
          return _usesRelativeSimPath.apply(this, arguments);
        }
        return usesRelativeSimPath;
      }()
      /**
       * Returns whether phet-io Studio is being used instead of deprecated instance proxies wrapper.
       * @public
       *
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "usesPhetioStudio",
      value: (function () {
        var _usesPhetioStudio = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee24() {
          var dependencies, sha;
          return _regeneratorRuntime().wrap(function _callee24$(_context24) {
            while (1) switch (_context24.prev = _context24.next) {
              case 0:
                _context24.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context24.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context24.sent;
                sha = dependencies.chipper.sha;
                _context24.next = 8;
                return gitCheckout(this.repo, 'main');
              case 8:
                return _context24.abrupt("return", gitIsAncestor('chipper', '7375f6a57b5874b6bbf97a54c9a908f19f88d38f', sha));
              case 9:
              case "end":
                return _context24.stop();
            }
          }, _callee24, this);
        }));
        function usesPhetioStudio() {
          return _usesPhetioStudio.apply(this, arguments);
        }
        return usesPhetioStudio;
      }()
      /**
       * Returns whether phet-io Studio top-level (index.html) is used instead of studio.html.
       * @public
       *
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "usesPhetioStudioIndex",
      value: (function () {
        var _usesPhetioStudioIndex = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee25() {
          var dependencies, dependency, sha;
          return _regeneratorRuntime().wrap(function _callee25$(_context25) {
            while (1) switch (_context25.prev = _context25.next) {
              case 0:
                _context25.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context25.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context25.sent;
                dependency = dependencies['phet-io-wrappers'];
                if (dependency) {
                  _context25.next = 8;
                  break;
                }
                return _context25.abrupt("return", false);
              case 8:
                sha = dependency.sha;
                _context25.next = 11;
                return gitCheckout(this.repo, 'main');
              case 11:
                return _context25.abrupt("return", gitIsAncestor('phet-io-wrappers', '7ec1a04a70fb9707b381b8bcab3ad070815ef7fe', sha));
              case 12:
              case "end":
                return _context25.stop();
            }
          }, _callee25, this);
        }));
        function usesPhetioStudioIndex() {
          return _usesPhetioStudioIndex.apply(this, arguments);
        }
        return usesPhetioStudioIndex;
      }()
      /**
       * Returns whether an additional folder exists in the build directory of the sim based on the brand.
       * @public
       *
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "usesChipper2",
      value: (function () {
        var _usesChipper = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee26() {
          var dependencies, chipperVersion, result;
          return _regeneratorRuntime().wrap(function _callee26$(_context26) {
            while (1) switch (_context26.prev = _context26.next) {
              case 0:
                _context26.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context26.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context26.sent;
                _context26.next = 7;
                return gitCheckout('chipper', dependencies.chipper.sha);
              case 7:
                chipperVersion = ChipperVersion.getFromRepository();
                result = chipperVersion.major !== 0 || chipperVersion.minor !== 0;
                _context26.next = 11;
                return gitCheckout(this.repo, 'main');
              case 11:
                _context26.next = 13;
                return gitCheckout('chipper', 'main');
              case 13:
                return _context26.abrupt("return", result);
              case 14:
              case "end":
                return _context26.stop();
            }
          }, _callee26, this);
        }));
        function usesChipper2() {
          return _usesChipper.apply(this, arguments);
        }
        return usesChipper2;
      }()
      /**
       * Runs a predicate function with the contents of a specific file's contents in the release branch (with false if
       * it doesn't exist).
       * @public
       *
       * @param {string} file
       * @param {function(contents:string):boolean} predicate
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "withFile",
      value: (function () {
        var _withFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee27(file, predicate) {
          var contents;
          return _regeneratorRuntime().wrap(function _callee27$(_context27) {
            while (1) switch (_context27.prev = _context27.next) {
              case 0:
                _context27.next = 2;
                return this.checkout(false);
              case 2:
                if (!fs.existsSync(file)) {
                  _context27.next = 5;
                  break;
                }
                contents = fs.readFileSync(file, 'utf-8');
                return _context27.abrupt("return", predicate(contents));
              case 5:
                return _context27.abrupt("return", false);
              case 6:
              case "end":
                return _context27.stop();
            }
          }, _callee27, this);
        }));
        function withFile(_x10, _x11) {
          return _withFile.apply(this, arguments);
        }
        return withFile;
      }()
      /**
       * Re-runs a production deploy for a specific branch.
       * @public
       */
      )
    }, {
      key: "redeployProduction",
      value: (function () {
        var _redeployProduction = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee28() {
          var locales,
            version,
            dependencies,
            _args28 = arguments;
          return _regeneratorRuntime().wrap(function _callee28$(_context28) {
            while (1) switch (_context28.prev = _context28.next) {
              case 0:
                locales = _args28.length > 0 && _args28[0] !== undefined ? _args28[0] : '*';
                if (!this.isReleased) {
                  _context28.next = 16;
                  break;
                }
                _context28.next = 4;
                return checkoutTarget(this.repo, this.branch, false);
              case 4:
                _context28.next = 6;
                return getRepoVersion(this.repo);
              case 6:
                version = _context28.sent;
                _context28.next = 9;
                return getDependencies(this.repo);
              case 9:
                dependencies = _context28.sent;
                _context28.next = 12;
                return checkoutMain(this.repo, false);
              case 12:
                _context28.next = 14;
                return buildServerRequest(this.repo, version, this.branch, dependencies, {
                  locales: locales,
                  brands: this.brands,
                  servers: ['production']
                });
              case 14:
                _context28.next = 17;
                break;
              case 16:
                throw new Error('Should not redeploy a non-released branch');
              case 17:
              case "end":
                return _context28.stop();
            }
          }, _callee28, this);
        }));
        function redeployProduction() {
          return _redeployProduction.apply(this, arguments);
        }
        return redeployProduction;
      }()
      /**
       * Gets a list of ReleaseBranches which would be potential candidates for a maintenance release. This includes:
       * - All published phet brand release branches (from metadata)
       * - All published phet-io brand release branches (from metadata)
       * - All unpublished local release branches
       *
       * @public
       * @returns {Promise.<ReleaseBranch[]>}
       * @rejects {ExecuteError}
       */
      )
    }], [{
      key: "deserialize",
      value: function deserialize(_ref4) {
        var repo = _ref4.repo,
          branch = _ref4.branch,
          brands = _ref4.brands,
          isReleased = _ref4.isReleased;
        return new ReleaseBranch(repo, branch, brands, isReleased);
      }
    }, {
      key: "getCheckoutDirectory",
      value: function getCheckoutDirectory(repo, branch) {
        return "".concat(MAINTENANCE_DIRECTORY, "/").concat(repo, "-").concat(branch);
      }

      /**
       * Returns the maintenance directory, for things that want to use it directly.
       * @public
       *
       * @returns {string}
       */
    }, {
      key: "getMaintenanceDirectory",
      value: function getMaintenanceDirectory() {
        return MAINTENANCE_DIRECTORY;
      }
    }, {
      key: "getAllMaintenanceBranches",
      value: (function () {
        var _getAllMaintenanceBranches = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee29() {
          var simMetadataResult, phetBranches, phetioBranches, unreleasedBranches, _iterator2, _step2, _loop, allReleaseBranches;
          return _regeneratorRuntime().wrap(function _callee29$(_context31) {
            while (1) switch (_context31.prev = _context31.next) {
              case 0:
                winston.debug('retrieving available sim branches');
                console.log('loading phet brand ReleaseBranches');
                _context31.next = 4;
                return simMetadata({
                  type: 'html'
                });
              case 4:
                simMetadataResult = _context31.sent;
                // Released phet branches
                phetBranches = simMetadataResult.projects.map(function (simData) {
                  var repo = simData.name.slice(simData.name.indexOf('/') + 1);
                  var branch = "".concat(simData.version.major, ".").concat(simData.version.minor);
                  return new ReleaseBranch(repo, branch, ['phet'], true);
                });
                console.log('loading phet-io brand ReleaseBranches');
                _context31.next = 9;
                return simPhetioMetadata({
                  active: true,
                  latest: true
                });
              case 9:
                phetioBranches = _context31.sent.filter(function (simData) {
                  return simData.active && simData.latest;
                }).map(function (simData) {
                  var branch = "".concat(simData.versionMajor, ".").concat(simData.versionMinor);
                  if (simData.versionSuffix.length) {
                    branch += "-".concat(simData.versionSuffix); // additional dash required
                  }
                  return new ReleaseBranch(simData.name, branch, ['phet-io'], true);
                });
                console.log('loading unreleased ReleaseBranches');
                unreleasedBranches = [];
                _iterator2 = _createForOfIteratorHelper(getActiveSims());
                _context31.prev = 13;
                _loop = /*#__PURE__*/_regeneratorRuntime().mark(function _loop() {
                  var repo, branches, releasedBranches, _iterator3, _step3, _loop2;
                  return _regeneratorRuntime().wrap(function _loop$(_context30) {
                    while (1) switch (_context30.prev = _context30.next) {
                      case 0:
                        repo = _step2.value;
                        if (!JSON.parse(fs.readFileSync("../".concat(repo, "/package.json"), 'utf8')).phet.ignoreForAutomatedMaintenanceReleases) {
                          _context30.next = 3;
                          break;
                        }
                        return _context30.abrupt("return", 1);
                      case 3:
                        _context30.next = 5;
                        return getBranches(repo);
                      case 5:
                        branches = _context30.sent;
                        releasedBranches = phetBranches.concat(phetioBranches);
                        _iterator3 = _createForOfIteratorHelper(branches);
                        _context30.prev = 8;
                        _loop2 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop2() {
                          var branch, match, major, minor, projectMetadata, productionVersion, packageObject, includesPhetio, brands;
                          return _regeneratorRuntime().wrap(function _loop2$(_context29) {
                            while (1) switch (_context29.prev = _context29.next) {
                              case 0:
                                branch = _step3.value;
                                if (!releasedBranches.filter(function (releaseBranch) {
                                  return releaseBranch.repo === repo && releaseBranch.branch === branch;
                                }).length) {
                                  _context29.next = 3;
                                  break;
                                }
                                return _context29.abrupt("return", 1);
                              case 3:
                                match = branch.match(/^(\d+)\.(\d+)$/);
                                if (!match) {
                                  _context29.next = 18;
                                  break;
                                }
                                major = Number(match[1]);
                                minor = Number(match[2]); // Assumption that there is no phet-io brand sim that isn't also released with phet brand
                                projectMetadata = simMetadataResult.projects.find(function (project) {
                                  return project.name === "html/".concat(repo);
                                }) || null;
                                productionVersion = projectMetadata ? projectMetadata.version : null;
                                if (!(!productionVersion || major > productionVersion.major || major === productionVersion.major && minor > productionVersion.minor)) {
                                  _context29.next = 18;
                                  break;
                                }
                                _context29.t0 = JSON;
                                _context29.next = 13;
                                return getFileAtBranch(repo, branch, 'package.json');
                              case 13:
                                _context29.t1 = _context29.sent;
                                packageObject = _context29.t0.parse.call(_context29.t0, _context29.t1);
                                includesPhetio = packageObject.phet && packageObject.phet.supportedBrands && packageObject.phet.supportedBrands.includes('phet-io');
                                brands = ['phet'].concat(_toConsumableArray(includesPhetio ? ['phet-io'] : []));
                                if (!packageObject.phet.ignoreForAutomatedMaintenanceReleases) {
                                  unreleasedBranches.push(new ReleaseBranch(repo, branch, brands, false));
                                }
                              case 18:
                              case "end":
                                return _context29.stop();
                            }
                          }, _loop2);
                        });
                        _iterator3.s();
                      case 11:
                        if ((_step3 = _iterator3.n()).done) {
                          _context30.next = 17;
                          break;
                        }
                        return _context30.delegateYield(_loop2(), "t0", 13);
                      case 13:
                        if (!_context30.t0) {
                          _context30.next = 15;
                          break;
                        }
                        return _context30.abrupt("continue", 15);
                      case 15:
                        _context30.next = 11;
                        break;
                      case 17:
                        _context30.next = 22;
                        break;
                      case 19:
                        _context30.prev = 19;
                        _context30.t1 = _context30["catch"](8);
                        _iterator3.e(_context30.t1);
                      case 22:
                        _context30.prev = 22;
                        _iterator3.f();
                        return _context30.finish(22);
                      case 25:
                      case "end":
                        return _context30.stop();
                    }
                  }, _loop, null, [[8, 19, 22, 25]]);
                });
                _iterator2.s();
              case 16:
                if ((_step2 = _iterator2.n()).done) {
                  _context31.next = 22;
                  break;
                }
                return _context31.delegateYield(_loop(), "t0", 18);
              case 18:
                if (!_context31.t0) {
                  _context31.next = 20;
                  break;
                }
                return _context31.abrupt("continue", 20);
              case 20:
                _context31.next = 16;
                break;
              case 22:
                _context31.next = 27;
                break;
              case 24:
                _context31.prev = 24;
                _context31.t1 = _context31["catch"](13);
                _iterator2.e(_context31.t1);
              case 27:
                _context31.prev = 27;
                _iterator2.f();
                return _context31.finish(27);
              case 30:
                allReleaseBranches = ReleaseBranch.combineLists([].concat(_toConsumableArray(phetBranches), _toConsumableArray(phetioBranches), unreleasedBranches)); // FAMB 2.3-phetio keeps ending up in the MR list when we don't want it to, see https://github.com/phetsims/phet-io/issues/1957.
                return _context31.abrupt("return", allReleaseBranches.filter(function (rb) {
                  return !(rb.repo === 'forces-and-motion-basics' && rb.branch === '2.3-phetio');
                }));
              case 32:
              case "end":
                return _context31.stop();
            }
          }, _callee29, null, [[13, 24, 27, 30]]);
        }));
        function getAllMaintenanceBranches() {
          return _getAllMaintenanceBranches.apply(this, arguments);
        }
        return getAllMaintenanceBranches;
      }()
      /**
       * Combines multiple matching ReleaseBranches into one where appropriate, and sorts. For example, two ReleaseBranches
       * of the same repo but for different brands are combined into a single ReleaseBranch with multiple brands.
       * @public
       *
       * @param {Array.<ReleaseBranch>} simBranches
       * @returns {Array.<ReleaseBranch>}
       */
      )
    }, {
      key: "combineLists",
      value: function combineLists(simBranches) {
        var resultBranches = [];
        var _iterator4 = _createForOfIteratorHelper(simBranches),
          _step4;
        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var simBranch = _step4.value;
            var foundBranch = false;
            var _iterator5 = _createForOfIteratorHelper(resultBranches),
              _step5;
            try {
              for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                var resultBranch = _step5.value;
                if (simBranch.repo === resultBranch.repo && simBranch.branch === resultBranch.branch) {
                  foundBranch = true;
                  resultBranch.brands = [].concat(_toConsumableArray(resultBranch.brands), _toConsumableArray(simBranch.brands));
                  break;
                }
              }
            } catch (err) {
              _iterator5.e(err);
            } finally {
              _iterator5.f();
            }
            if (!foundBranch) {
              resultBranches.push(simBranch);
            }
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
        resultBranches.sort(function (a, b) {
          if (a.repo !== b.repo) {
            return a.repo < b.repo ? -1 : 1;
          }
          if (a.branch !== b.branch) {
            return a.branch < b.branch ? -1 : 1;
          }
          return 0;
        });
        return resultBranches;
      }
    }]);
  }();
  return ReleaseBranch;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVnZW5lcmF0b3JSdW50aW1lIiwiZSIsInQiLCJyIiwiT2JqZWN0IiwicHJvdG90eXBlIiwibiIsImhhc093blByb3BlcnR5IiwibyIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJpIiwiU3ltYm9sIiwiYSIsIml0ZXJhdG9yIiwiYyIsImFzeW5jSXRlcmF0b3IiLCJ1IiwidG9TdHJpbmdUYWciLCJkZWZpbmUiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ3cmFwIiwiR2VuZXJhdG9yIiwiY3JlYXRlIiwiQ29udGV4dCIsIm1ha2VJbnZva2VNZXRob2QiLCJ0cnlDYXRjaCIsInR5cGUiLCJhcmciLCJjYWxsIiwiaCIsImwiLCJmIiwicyIsInkiLCJHZW5lcmF0b3JGdW5jdGlvbiIsIkdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlIiwicCIsImQiLCJnZXRQcm90b3R5cGVPZiIsInYiLCJ2YWx1ZXMiLCJnIiwiZGVmaW5lSXRlcmF0b3JNZXRob2RzIiwiZm9yRWFjaCIsIl9pbnZva2UiLCJBc3luY0l0ZXJhdG9yIiwiaW52b2tlIiwiX3R5cGVvZiIsInJlc29sdmUiLCJfX2F3YWl0IiwidGhlbiIsImNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnIiwiRXJyb3IiLCJkb25lIiwibWV0aG9kIiwiZGVsZWdhdGUiLCJtYXliZUludm9rZURlbGVnYXRlIiwic2VudCIsIl9zZW50IiwiZGlzcGF0Y2hFeGNlcHRpb24iLCJhYnJ1cHQiLCJUeXBlRXJyb3IiLCJyZXN1bHROYW1lIiwibmV4dCIsIm5leHRMb2MiLCJwdXNoVHJ5RW50cnkiLCJ0cnlMb2MiLCJjYXRjaExvYyIsImZpbmFsbHlMb2MiLCJhZnRlckxvYyIsInRyeUVudHJpZXMiLCJwdXNoIiwicmVzZXRUcnlFbnRyeSIsImNvbXBsZXRpb24iLCJyZXNldCIsImlzTmFOIiwibGVuZ3RoIiwiZGlzcGxheU5hbWUiLCJpc0dlbmVyYXRvckZ1bmN0aW9uIiwiY29uc3RydWN0b3IiLCJuYW1lIiwibWFyayIsInNldFByb3RvdHlwZU9mIiwiX19wcm90b19fIiwiYXdyYXAiLCJhc3luYyIsIlByb21pc2UiLCJrZXlzIiwicmV2ZXJzZSIsInBvcCIsInByZXYiLCJjaGFyQXQiLCJzbGljZSIsInN0b3AiLCJydmFsIiwiaGFuZGxlIiwiY29tcGxldGUiLCJmaW5pc2giLCJfY2F0Y2giLCJkZWxlZ2F0ZVlpZWxkIiwiYXN5bmNHZW5lcmF0b3JTdGVwIiwiZ2VuIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJpbmZvIiwiZXJyb3IiLCJfYXN5bmNUb0dlbmVyYXRvciIsImZuIiwic2VsZiIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsImVyciIsInVuZGVmaW5lZCIsIl9jbGFzc0NhbGxDaGVjayIsImluc3RhbmNlIiwiQ29uc3RydWN0b3IiLCJfZGVmaW5lUHJvcGVydGllcyIsInRhcmdldCIsInByb3BzIiwiZGVzY3JpcHRvciIsIl90b1Byb3BlcnR5S2V5IiwiX2NyZWF0ZUNsYXNzIiwicHJvdG9Qcm9wcyIsInN0YXRpY1Byb3BzIiwiX3RvUHJpbWl0aXZlIiwidG9QcmltaXRpdmUiLCJTdHJpbmciLCJOdW1iZXIiLCJidWlsZExvY2FsIiwicmVxdWlyZSIsImJ1aWxkU2VydmVyUmVxdWVzdCIsIkNoaXBwZXJWZXJzaW9uIiwiY2hlY2tvdXRNYWluIiwiY2hlY2tvdXRUYXJnZXQiLCJjcmVhdGVEaXJlY3RvcnkiLCJleGVjdXRlIiwiZ2V0QWN0aXZlU2ltcyIsImdldEJyYW5jaERlcGVuZGVuY2llcyIsImdldEJyYW5jaGVzIiwiZ2V0QnVpbGRBcmd1bWVudHMiLCJnZXREZXBlbmRlbmNpZXMiLCJnZXRCcmFuY2hNYXAiLCJnZXRCcmFuY2hWZXJzaW9uIiwiZ2V0RmlsZUF0QnJhbmNoIiwiZ2V0UmVwb1ZlcnNpb24iLCJnaXRDaGVja291dCIsImdpdENoZWNrb3V0RGlyZWN0b3J5IiwiZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5IiwiZ2l0Rmlyc3REaXZlcmdpbmdDb21taXQiLCJnaXRJc0FuY2VzdG9yIiwiZ2l0UHVsbCIsImdpdFB1bGxEaXJlY3RvcnkiLCJnaXRSZXZQYXJzZSIsImdpdFRpbWVzdGFtcCIsImdydW50Q29tbWFuZCIsImxvYWRKU09OIiwibnBtVXBkYXRlRGlyZWN0b3J5IiwicHVwcGV0ZWVyTG9hZCIsInNpbU1ldGFkYXRhIiwic2ltUGhldGlvTWV0YWRhdGEiLCJ3aXRoU2VydmVyIiwiYXNzZXJ0IiwiZnMiLCJ3aW5zdG9uIiwiXyIsIm1vZHVsZSIsImV4cG9ydHMiLCJNQUlOVEVOQU5DRV9ESVJFQ1RPUlkiLCJSZWxlYXNlQnJhbmNoIiwicmVwbyIsImJyYW5jaCIsImJyYW5kcyIsImlzUmVsZWFzZWQiLCJBcnJheSIsImlzQXJyYXkiLCJzZXJpYWxpemUiLCJlcXVhbHMiLCJyZWxlYXNlQnJhbmNoIiwiam9pbiIsInRvU3RyaW5nIiwiY29uY2F0IiwiX2dldExvY2FsUGhldEJ1aWx0SFRNTFBhdGgiLCJfY2FsbGVlIiwidXNlc0NoaXBwZXIyIiwiX2NhbGxlZSQiLCJfY29udGV4dCIsImdldExvY2FsUGhldEJ1aWx0SFRNTFBhdGgiLCJfZ2V0TG9jYWxQaGV0SU9CdWlsdEhUTUxQYXRoIiwiX2NhbGxlZTIiLCJfY2FsbGVlMiQiLCJfY29udGV4dDIiLCJnZXRMb2NhbFBoZXRJT0J1aWx0SFRNTFBhdGgiLCJfZ2V0UGhldGlvU3RhbmRhbG9uZVF1ZXJ5UGFyYW1ldGVyIiwiX2NhbGxlZTMiLCJfY2FsbGVlMyQiLCJfY29udGV4dDMiLCJ1c2VzT2xkUGhldGlvU3RhbmRhbG9uZSIsInQwIiwiZ2V0UGhldGlvU3RhbmRhbG9uZVF1ZXJ5UGFyYW1ldGVyIiwiZ2V0Q2hpcHBlclZlcnNpb24iLCJjaGVja291dERpcmVjdG9yeSIsImdldENoZWNrb3V0RGlyZWN0b3J5IiwiZ2V0RnJvbVBhY2thZ2VKU09OIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwiX3VwZGF0ZUNoZWNrb3V0IiwiX2NhbGxlZTUiLCJfdGhpcyIsIm92ZXJyaWRlRGVwZW5kZW5jaWVzIiwiZGVwZW5kZW5jaWVzT25CcmFuY2hUaXAiLCJkZXBlbmRlbmN5UmVwb3MiLCJfYXJnczUiLCJfY2FsbGVlNSQiLCJfY29udGV4dDUiLCJleGlzdHNTeW5jIiwiYmFiZWwiLCJzaGEiLCJiYWJlbEJyYW5jaCIsInVuaXEiLCJfdG9Db25zdW1hYmxlQXJyYXkiLCJmaWx0ZXIiLCJhbGwiLCJtYXAiLCJfcmVmIiwiX2NhbGxlZTQiLCJyZXBvUHdkIiwiX2NhbGxlZTQkIiwiX2NvbnRleHQ0IiwiX3giLCJ1cGRhdGVDaGVja291dCIsIl9idWlsZCIsIl9jYWxsZWU2Iiwib3B0aW9ucyIsInJlcG9EaXJlY3RvcnkiLCJfY2FsbGVlNiQiLCJfY29udGV4dDYiLCJtZXJnZSIsImFsbEhUTUwiLCJkZWJ1Z0hUTUwiLCJsaW50IiwibG9jYWxlcyIsImJ1aWxkIiwiX3gyIiwiX3RyYW5zcGlsZSIsIl9jYWxsZWU3IiwiX2NhbGxlZTckIiwiX2NvbnRleHQ3IiwiZXJyb3JzIiwidHJhbnNwaWxlIiwiX2NoZWNrVW5idWlsdCIsIl9jYWxsZWU5IiwiX3RoaXMyIiwiX2NhbGxlZTkkIiwiX2NvbnRleHQ5IiwiX3JlZjIiLCJfY2FsbGVlOCIsInBvcnQiLCJ1cmwiLCJfY2FsbGVlOCQiLCJfY29udGV4dDgiLCJ3YWl0QWZ0ZXJMb2FkIiwiX3gzIiwicGF0aCIsImNoZWNrVW5idWlsdCIsIl9jaGVja0J1aWx0IiwiX2NhbGxlZTExIiwiX3RoaXMzIiwiX2NhbGxlZTExJCIsIl9jb250ZXh0MTEiLCJfcmVmMyIsIl9jYWxsZWUxMCIsIl9jYWxsZWUxMCQiLCJfY29udGV4dDEwIiwiX3g0IiwiY2hlY2tCdWlsdCIsIl9jaGVja291dCIsIl9jYWxsZWUxMiIsImluY2x1ZGVOcG1VcGRhdGUiLCJfY2FsbGVlMTIkIiwiX2NvbnRleHQxMiIsImNoZWNrb3V0IiwiX3g1IiwiX2luY2x1ZGVzU0hBIiwiX2NhbGxlZTEzIiwicmVzdWx0IiwiZGVwZW5kZW5jaWVzIiwiY3VycmVudFNIQSIsIl9jYWxsZWUxMyQiLCJfY29udGV4dDEzIiwiaW5jbHVkZXNTSEEiLCJfeDYiLCJfeDciLCJfaXNNaXNzaW5nU0hBIiwiX2NhbGxlZTE0IiwiX2NhbGxlZTE0JCIsIl9jb250ZXh0MTQiLCJpc01pc3NpbmdTSEEiLCJfeDgiLCJfeDkiLCJfZ2V0RGl2ZXJnaW5nU0hBIiwiX2NhbGxlZTE1IiwiX2NhbGxlZTE1JCIsIl9jb250ZXh0MTUiLCJnZXREaXZlcmdpbmdTSEEiLCJfZ2V0RGl2ZXJnaW5nVGltZXN0YW1wIiwiX2NhbGxlZTE2IiwiX2NhbGxlZTE2JCIsIl9jb250ZXh0MTYiLCJ0MSIsInQyIiwiZ2V0RGl2ZXJnaW5nVGltZXN0YW1wIiwiX2dldERlcGVuZGVuY2llcyIsIl9jYWxsZWUxNyIsIl9jYWxsZWUxNyQiLCJfY29udGV4dDE3IiwiX2dldFNpbVZlcnNpb24iLCJfY2FsbGVlMTgiLCJfY2FsbGVlMTgkIiwiX2NvbnRleHQxOCIsImdldFNpbVZlcnNpb24iLCJfZ2V0U3RhdHVzIiwiX2NhbGxlZTE5IiwiX3RoaXM0IiwiZ2V0QnJhbmNoTWFwQXN5bmNDYWxsYmFjayIsInJlc3VsdHMiLCJkZXBlbmRlbmN5TmFtZXMiLCJjdXJyZW50Q29tbWl0IiwicHJldmlvdXNDb21taXQiLCJfaXRlcmF0b3IiLCJfc3RlcCIsImRlcGVuZGVuY3kiLCJwb3RlbnRpYWxSZWxlYXNlQnJhbmNoIiwiYnJhbmNoTWFwIiwiX2FyZ3MxOSIsIl9jYWxsZWUxOSQiLCJfY29udGV4dDE5IiwidGVzdFR5cGUiLCJtZXNzYWdlIiwiX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXIiLCJpbmNsdWRlcyIsInQzIiwiZ2V0U3RhdHVzIiwiX3VzZXNFUyIsIl9jYWxsZWUyMCIsIl9jYWxsZWUyMCQiLCJfY29udGV4dDIwIiwiY2hpcHBlciIsInVzZXNFUzYiLCJfdXNlc0luaXRpYWxpemVHbG9iYWxzUXVlcnlQYXJhbWV0ZXJzIiwiX2NhbGxlZTIxIiwiX2NhbGxlZTIxJCIsIl9jb250ZXh0MjEiLCJ1c2VzSW5pdGlhbGl6ZUdsb2JhbHNRdWVyeVBhcmFtZXRlcnMiLCJfdXNlc09sZFBoZXRpb1N0YW5kYWxvbmUiLCJfY2FsbGVlMjIiLCJfY2FsbGVlMjIkIiwiX2NvbnRleHQyMiIsIl91c2VzUmVsYXRpdmVTaW1QYXRoIiwiX2NhbGxlZTIzIiwiX2NhbGxlZTIzJCIsIl9jb250ZXh0MjMiLCJ1c2VzUmVsYXRpdmVTaW1QYXRoIiwiX3VzZXNQaGV0aW9TdHVkaW8iLCJfY2FsbGVlMjQiLCJfY2FsbGVlMjQkIiwiX2NvbnRleHQyNCIsInVzZXNQaGV0aW9TdHVkaW8iLCJfdXNlc1BoZXRpb1N0dWRpb0luZGV4IiwiX2NhbGxlZTI1IiwiX2NhbGxlZTI1JCIsIl9jb250ZXh0MjUiLCJ1c2VzUGhldGlvU3R1ZGlvSW5kZXgiLCJfdXNlc0NoaXBwZXIiLCJfY2FsbGVlMjYiLCJjaGlwcGVyVmVyc2lvbiIsIl9jYWxsZWUyNiQiLCJfY29udGV4dDI2IiwiZ2V0RnJvbVJlcG9zaXRvcnkiLCJtYWpvciIsIm1pbm9yIiwiX3dpdGhGaWxlIiwiX2NhbGxlZTI3IiwiZmlsZSIsInByZWRpY2F0ZSIsImNvbnRlbnRzIiwiX2NhbGxlZTI3JCIsIl9jb250ZXh0MjciLCJ3aXRoRmlsZSIsIl94MTAiLCJfeDExIiwiX3JlZGVwbG95UHJvZHVjdGlvbiIsIl9jYWxsZWUyOCIsInZlcnNpb24iLCJfYXJnczI4IiwiX2NhbGxlZTI4JCIsIl9jb250ZXh0MjgiLCJzZXJ2ZXJzIiwicmVkZXBsb3lQcm9kdWN0aW9uIiwiZGVzZXJpYWxpemUiLCJfcmVmNCIsImdldE1haW50ZW5hbmNlRGlyZWN0b3J5IiwiX2dldEFsbE1haW50ZW5hbmNlQnJhbmNoZXMiLCJfY2FsbGVlMjkiLCJzaW1NZXRhZGF0YVJlc3VsdCIsInBoZXRCcmFuY2hlcyIsInBoZXRpb0JyYW5jaGVzIiwidW5yZWxlYXNlZEJyYW5jaGVzIiwiX2l0ZXJhdG9yMiIsIl9zdGVwMiIsIl9sb29wIiwiYWxsUmVsZWFzZUJyYW5jaGVzIiwiX2NhbGxlZTI5JCIsIl9jb250ZXh0MzEiLCJkZWJ1ZyIsImNvbnNvbGUiLCJsb2ciLCJwcm9qZWN0cyIsInNpbURhdGEiLCJpbmRleE9mIiwiYWN0aXZlIiwibGF0ZXN0IiwidmVyc2lvbk1ham9yIiwidmVyc2lvbk1pbm9yIiwidmVyc2lvblN1ZmZpeCIsImJyYW5jaGVzIiwicmVsZWFzZWRCcmFuY2hlcyIsIl9pdGVyYXRvcjMiLCJfc3RlcDMiLCJfbG9vcDIiLCJfbG9vcCQiLCJfY29udGV4dDMwIiwicGhldCIsImlnbm9yZUZvckF1dG9tYXRlZE1haW50ZW5hbmNlUmVsZWFzZXMiLCJtYXRjaCIsInByb2plY3RNZXRhZGF0YSIsInByb2R1Y3Rpb25WZXJzaW9uIiwicGFja2FnZU9iamVjdCIsImluY2x1ZGVzUGhldGlvIiwiX2xvb3AyJCIsIl9jb250ZXh0MjkiLCJmaW5kIiwicHJvamVjdCIsInN1cHBvcnRlZEJyYW5kcyIsImNvbWJpbmVMaXN0cyIsInJiIiwiZ2V0QWxsTWFpbnRlbmFuY2VCcmFuY2hlcyIsInNpbUJyYW5jaGVzIiwicmVzdWx0QnJhbmNoZXMiLCJfaXRlcmF0b3I0IiwiX3N0ZXA0Iiwic2ltQnJhbmNoIiwiZm91bmRCcmFuY2giLCJfaXRlcmF0b3I1IiwiX3N0ZXA1IiwicmVzdWx0QnJhbmNoIiwic29ydCIsImIiXSwic291cmNlcyI6WyJSZWxlYXNlQnJhbmNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXByZXNlbnRzIGEgc2ltdWxhdGlvbiByZWxlYXNlIGJyYW5jaCBmb3IgZGVwbG95bWVudFxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgYnVpbGRMb2NhbCA9IHJlcXVpcmUoICcuL2J1aWxkTG9jYWwnICk7XHJcbmNvbnN0IGJ1aWxkU2VydmVyUmVxdWVzdCA9IHJlcXVpcmUoICcuL2J1aWxkU2VydmVyUmVxdWVzdCcgKTtcclxuY29uc3QgQ2hpcHBlclZlcnNpb24gPSByZXF1aXJlKCAnLi9DaGlwcGVyVmVyc2lvbicgKTtcclxuY29uc3QgY2hlY2tvdXRNYWluID0gcmVxdWlyZSggJy4vY2hlY2tvdXRNYWluJyApO1xyXG5jb25zdCBjaGVja291dFRhcmdldCA9IHJlcXVpcmUoICcuL2NoZWNrb3V0VGFyZ2V0JyApO1xyXG5jb25zdCBjcmVhdGVEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9jcmVhdGVEaXJlY3RvcnknICk7XHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApO1xyXG5jb25zdCBnZXRBY3RpdmVTaW1zID0gcmVxdWlyZSggJy4vZ2V0QWN0aXZlU2ltcycgKTtcclxuY29uc3QgZ2V0QnJhbmNoRGVwZW5kZW5jaWVzID0gcmVxdWlyZSggJy4vZ2V0QnJhbmNoRGVwZW5kZW5jaWVzJyApO1xyXG5jb25zdCBnZXRCcmFuY2hlcyA9IHJlcXVpcmUoICcuL2dldEJyYW5jaGVzJyApO1xyXG5jb25zdCBnZXRCdWlsZEFyZ3VtZW50cyA9IHJlcXVpcmUoICcuL2dldEJ1aWxkQXJndW1lbnRzJyApO1xyXG5jb25zdCBnZXREZXBlbmRlbmNpZXMgPSByZXF1aXJlKCAnLi9nZXREZXBlbmRlbmNpZXMnICk7XHJcbmNvbnN0IGdldEJyYW5jaE1hcCA9IHJlcXVpcmUoICcuL2dldEJyYW5jaE1hcCcgKTtcclxuY29uc3QgZ2V0QnJhbmNoVmVyc2lvbiA9IHJlcXVpcmUoICcuL2dldEJyYW5jaFZlcnNpb24nICk7XHJcbmNvbnN0IGdldEZpbGVBdEJyYW5jaCA9IHJlcXVpcmUoICcuL2dldEZpbGVBdEJyYW5jaCcgKTtcclxuY29uc3QgZ2V0UmVwb1ZlcnNpb24gPSByZXF1aXJlKCAnLi9nZXRSZXBvVmVyc2lvbicgKTtcclxuY29uc3QgZ2l0Q2hlY2tvdXQgPSByZXF1aXJlKCAnLi9naXRDaGVja291dCcgKTtcclxuY29uc3QgZ2l0Q2hlY2tvdXREaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9naXRDaGVja291dERpcmVjdG9yeScgKTtcclxuY29uc3QgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5ID0gcmVxdWlyZSggJy4vZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5JyApO1xyXG5jb25zdCBnaXRGaXJzdERpdmVyZ2luZ0NvbW1pdCA9IHJlcXVpcmUoICcuL2dpdEZpcnN0RGl2ZXJnaW5nQ29tbWl0JyApO1xyXG5jb25zdCBnaXRJc0FuY2VzdG9yID0gcmVxdWlyZSggJy4vZ2l0SXNBbmNlc3RvcicgKTtcclxuY29uc3QgZ2l0UHVsbCA9IHJlcXVpcmUoICcuL2dpdFB1bGwnICk7XHJcbmNvbnN0IGdpdFB1bGxEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9naXRQdWxsRGlyZWN0b3J5JyApO1xyXG5jb25zdCBnaXRSZXZQYXJzZSA9IHJlcXVpcmUoICcuL2dpdFJldlBhcnNlJyApO1xyXG5jb25zdCBnaXRUaW1lc3RhbXAgPSByZXF1aXJlKCAnLi9naXRUaW1lc3RhbXAnICk7XHJcbmNvbnN0IGdydW50Q29tbWFuZCA9IHJlcXVpcmUoICcuL2dydW50Q29tbWFuZCcgKTtcclxuY29uc3QgbG9hZEpTT04gPSByZXF1aXJlKCAnLi9sb2FkSlNPTicgKTtcclxuY29uc3QgbnBtVXBkYXRlRGlyZWN0b3J5ID0gcmVxdWlyZSggJy4vbnBtVXBkYXRlRGlyZWN0b3J5JyApO1xyXG5jb25zdCBwdXBwZXRlZXJMb2FkID0gcmVxdWlyZSggJy4vcHVwcGV0ZWVyTG9hZCcgKTtcclxuY29uc3Qgc2ltTWV0YWRhdGEgPSByZXF1aXJlKCAnLi9zaW1NZXRhZGF0YScgKTtcclxuY29uc3Qgc2ltUGhldGlvTWV0YWRhdGEgPSByZXF1aXJlKCAnLi9zaW1QaGV0aW9NZXRhZGF0YScgKTtcclxuY29uc3Qgd2l0aFNlcnZlciA9IHJlcXVpcmUoICcuL3dpdGhTZXJ2ZXInICk7XHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoIGZ1bmN0aW9uKCkge1xyXG5cclxuICBjb25zdCBNQUlOVEVOQU5DRV9ESVJFQ1RPUlkgPSAnLi4vcmVsZWFzZS1icmFuY2hlcyc7XHJcblxyXG4gIGNsYXNzIFJlbGVhc2VCcmFuY2gge1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGJyYW5jaFxyXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gYnJhbmRzXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzUmVsZWFzZWRcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoIHJlcG8sIGJyYW5jaCwgYnJhbmRzLCBpc1JlbGVhc2VkICkge1xyXG4gICAgICBhc3NlcnQoIHR5cGVvZiByZXBvID09PSAnc3RyaW5nJyApO1xyXG4gICAgICBhc3NlcnQoIHR5cGVvZiBicmFuY2ggPT09ICdzdHJpbmcnICk7XHJcbiAgICAgIGFzc2VydCggQXJyYXkuaXNBcnJheSggYnJhbmRzICkgKTtcclxuICAgICAgYXNzZXJ0KCB0eXBlb2YgaXNSZWxlYXNlZCA9PT0gJ2Jvb2xlYW4nICk7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtzdHJpbmd9XHJcbiAgICAgIHRoaXMucmVwbyA9IHJlcG87XHJcbiAgICAgIHRoaXMuYnJhbmNoID0gYnJhbmNoO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7QXJyYXkuPHN0cmluZz59XHJcbiAgICAgIHRoaXMuYnJhbmRzID0gYnJhbmRzO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7Ym9vbGVhbn1cclxuICAgICAgdGhpcy5pc1JlbGVhc2VkID0gaXNSZWxlYXNlZDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlcnQgaW50byBhIHBsYWluIEpTIG9iamVjdCBtZWFudCBmb3IgSlNPTiBzZXJpYWxpemF0aW9uLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIHNlcmlhbGl6ZSgpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZXBvOiB0aGlzLnJlcG8sXHJcbiAgICAgICAgYnJhbmNoOiB0aGlzLmJyYW5jaCxcclxuICAgICAgICBicmFuZHM6IHRoaXMuYnJhbmRzLFxyXG4gICAgICAgIGlzUmVsZWFzZWQ6IHRoaXMuaXNSZWxlYXNlZFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGFrZXMgYSBzZXJpYWxpemVkIGZvcm0gb2YgdGhlIFJlbGVhc2VCcmFuY2ggYW5kIHJldHVybnMgYW4gYWN0dWFsIGluc3RhbmNlLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fVxyXG4gICAgICogQHJldHVybnMge1JlbGVhc2VCcmFuY2h9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBkZXNlcmlhbGl6ZSggeyByZXBvLCBicmFuY2gsIGJyYW5kcywgaXNSZWxlYXNlZCB9ICkge1xyXG4gICAgICByZXR1cm4gbmV3IFJlbGVhc2VCcmFuY2goIHJlcG8sIGJyYW5jaCwgYnJhbmRzLCBpc1JlbGVhc2VkICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHR3byByZWxlYXNlIGJyYW5jaGVzIGNvbnRhaW4gaWRlbnRpY2FsIGluZm9ybWF0aW9uLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7UmVsZWFzZUJyYW5jaH0gcmVsZWFzZUJyYW5jaFxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGVxdWFscyggcmVsZWFzZUJyYW5jaCApIHtcclxuICAgICAgcmV0dXJuIHRoaXMucmVwbyA9PT0gcmVsZWFzZUJyYW5jaC5yZXBvICYmXHJcbiAgICAgICAgICAgICB0aGlzLmJyYW5jaCA9PT0gcmVsZWFzZUJyYW5jaC5icmFuY2ggJiZcclxuICAgICAgICAgICAgIHRoaXMuYnJhbmRzLmpvaW4oICcsJyApID09PSByZWxlYXNlQnJhbmNoLmJyYW5kcy5qb2luKCAnLCcgKSAmJlxyXG4gICAgICAgICAgICAgdGhpcy5pc1JlbGVhc2VkID09PSByZWxlYXNlQnJhbmNoLmlzUmVsZWFzZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZXJ0cyBpdCB0byBhIChkZWJ1Z2dhYmxlKSBzdHJpbmcgZm9ybS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB0b1N0cmluZygpIHtcclxuICAgICAgcmV0dXJuIGAke3RoaXMucmVwb30gJHt0aGlzLmJyYW5jaH0gJHt0aGlzLmJyYW5kcy5qb2luKCAnLCcgKX0ke3RoaXMuaXNSZWxlYXNlZCA/ICcnIDogJyAodW5wdWJsaXNoZWQpJ31gO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSByZXBvIHtzdHJpbmd9XHJcbiAgICAgKiBAcGFyYW0gYnJhbmNoIHtzdHJpbmd9XHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHJlcG8sIGJyYW5jaCApIHtcclxuICAgICAgcmV0dXJuIGAke01BSU5URU5BTkNFX0RJUkVDVE9SWX0vJHtyZXBvfS0ke2JyYW5jaH1gO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgbWFpbnRlbmFuY2UgZGlyZWN0b3J5LCBmb3IgdGhpbmdzIHRoYXQgd2FudCB0byB1c2UgaXQgZGlyZWN0bHkuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGdldE1haW50ZW5hbmNlRGlyZWN0b3J5KCkge1xyXG4gICAgICByZXR1cm4gTUFJTlRFTkFOQ0VfRElSRUNUT1JZO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgcGF0aCAocmVsYXRpdmUgdG8gdGhlIHJlcG8pIHRvIHRoZSBidWlsdCBwaGV0LWJyYW5kIEhUTUwgZmlsZVxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZz59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldExvY2FsUGhldEJ1aWx0SFRNTFBhdGgoKSB7XHJcbiAgICAgIGNvbnN0IHVzZXNDaGlwcGVyMiA9IGF3YWl0IHRoaXMudXNlc0NoaXBwZXIyKCk7XHJcblxyXG4gICAgICByZXR1cm4gYGJ1aWxkLyR7dXNlc0NoaXBwZXIyID8gJ3BoZXQvJyA6ICcnfSR7dGhpcy5yZXBvfV9lbiR7dXNlc0NoaXBwZXIyID8gJ19waGV0JyA6ICcnfS5odG1sYDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIHBhdGggKHJlbGF0aXZlIHRvIHRoZSByZXBvKSB0byB0aGUgYnVpbHQgcGhldC1pby1icmFuZCBIVE1MIGZpbGVcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmc+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZXRMb2NhbFBoZXRJT0J1aWx0SFRNTFBhdGgoKSB7XHJcbiAgICAgIGNvbnN0IHVzZXNDaGlwcGVyMiA9IGF3YWl0IHRoaXMudXNlc0NoaXBwZXIyKCk7XHJcblxyXG4gICAgICByZXR1cm4gYGJ1aWxkLyR7dXNlc0NoaXBwZXIyID8gJ3BoZXQtaW8vJyA6ICcnfSR7dGhpcy5yZXBvfSR7dXNlc0NoaXBwZXIyID8gJ19hbGxfcGhldC1pbycgOiAnX2VuLXBoZXRpbyd9Lmh0bWxgO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgcXVlcnkgcGFyYW1ldGVyIHRvIHVzZSBmb3IgYWN0aXZhdGluZyBwaGV0LWlvIHN0YW5kYWxvbmUgbW9kZVxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZz59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldFBoZXRpb1N0YW5kYWxvbmVRdWVyeVBhcmFtZXRlcigpIHtcclxuICAgICAgcmV0dXJuICggYXdhaXQgdGhpcy51c2VzT2xkUGhldGlvU3RhbmRhbG9uZSgpICkgPyAncGhldC1pby5zdGFuZGFsb25lJyA6ICdwaGV0aW9TdGFuZGFsb25lJztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7Q2hpcHBlclZlcnNpb259XHJcbiAgICAgKi9cclxuICAgIGdldENoaXBwZXJWZXJzaW9uKCkge1xyXG4gICAgICBjb25zdCBjaGVja291dERpcmVjdG9yeSA9IFJlbGVhc2VCcmFuY2guZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuXHJcbiAgICAgIHJldHVybiBDaGlwcGVyVmVyc2lvbi5nZXRGcm9tUGFja2FnZUpTT04oXHJcbiAgICAgICAgSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgJHtjaGVja291dERpcmVjdG9yeX0vY2hpcHBlci9wYWNrYWdlLmpzb25gLCAndXRmOCcgKSApXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVwZGF0ZUNoZWNrb3V0KCBvdmVycmlkZURlcGVuZGVuY2llcyA9IHt9ICkge1xyXG4gICAgICB3aW5zdG9uLmluZm8oIGB1cGRhdGluZyBjaGVja291dCBmb3IgJHt0aGlzLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgICAgaWYgKCAhZnMuZXhpc3RzU3luYyggTUFJTlRFTkFOQ0VfRElSRUNUT1JZICkgKSB7XHJcbiAgICAgICAgd2luc3Rvbi5pbmZvKCBgY3JlYXRpbmcgZGlyZWN0b3J5ICR7TUFJTlRFTkFOQ0VfRElSRUNUT1JZfWAgKTtcclxuICAgICAgICBhd2FpdCBjcmVhdGVEaXJlY3RvcnkoIE1BSU5URU5BTkNFX0RJUkVDVE9SWSApO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0RGlyZWN0b3J5ID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBpZiAoICFmcy5leGlzdHNTeW5jKCBjaGVja291dERpcmVjdG9yeSApICkge1xyXG4gICAgICAgIHdpbnN0b24uaW5mbyggYGNyZWF0aW5nIGRpcmVjdG9yeSAke2NoZWNrb3V0RGlyZWN0b3J5fWAgKTtcclxuICAgICAgICBhd2FpdCBjcmVhdGVEaXJlY3RvcnkoIGNoZWNrb3V0RGlyZWN0b3J5ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGF3YWl0IGdpdENsb25lT3JGZXRjaERpcmVjdG9yeSggdGhpcy5yZXBvLCBjaGVja291dERpcmVjdG9yeSApO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dERpcmVjdG9yeSggdGhpcy5icmFuY2gsIGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb31gICk7XHJcbiAgICAgIGF3YWl0IGdpdFB1bGxEaXJlY3RvcnkoIGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb31gICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llc09uQnJhbmNoVGlwID0gYXdhaXQgbG9hZEpTT04oIGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb30vZGVwZW5kZW5jaWVzLmpzb25gICk7XHJcblxyXG4gICAgICBkZXBlbmRlbmNpZXNPbkJyYW5jaFRpcC5iYWJlbCA9IHsgc2hhOiBidWlsZExvY2FsLmJhYmVsQnJhbmNoLCBicmFuY2g6IGJ1aWxkTG9jYWwuYmFiZWxCcmFuY2ggfTtcclxuXHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY3lSZXBvcyA9IF8udW5pcSggW1xyXG4gICAgICAgIC4uLk9iamVjdC5rZXlzKCBkZXBlbmRlbmNpZXNPbkJyYW5jaFRpcCApLFxyXG4gICAgICAgIC4uLk9iamVjdC5rZXlzKCBvdmVycmlkZURlcGVuZGVuY2llcyApXHJcbiAgICAgIF0uZmlsdGVyKCByZXBvID0+IHJlcG8gIT09ICdjb21tZW50JyApICk7XHJcblxyXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbCggZGVwZW5kZW5jeVJlcG9zLm1hcCggYXN5bmMgcmVwbyA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVwb1B3ZCA9IGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3JlcG99YDtcclxuXHJcbiAgICAgICAgYXdhaXQgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5KCByZXBvLCBjaGVja291dERpcmVjdG9yeSApO1xyXG5cclxuICAgICAgICBjb25zdCBzaGEgPSBvdmVycmlkZURlcGVuZGVuY2llc1sgcmVwbyBdID8gb3ZlcnJpZGVEZXBlbmRlbmNpZXNbIHJlcG8gXS5zaGEgOiBkZXBlbmRlbmNpZXNPbkJyYW5jaFRpcFsgcmVwbyBdLnNoYTtcclxuICAgICAgICBhd2FpdCBnaXRDaGVja291dERpcmVjdG9yeSggc2hhLCByZXBvUHdkICk7XHJcblxyXG4gICAgICAgIC8vIFB1bGwgYmFiZWwsIHNpbmNlIHdlIGRvbid0IGdpdmUgaXQgYSBzcGVjaWZpYyBTSEEgKGp1c3QgYSBicmFuY2gpLFxyXG4gICAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGVyZW5uaWFsL2lzc3Vlcy8zMjZcclxuICAgICAgICBpZiAoIHJlcG8gPT09ICdiYWJlbCcgKSB7XHJcbiAgICAgICAgICBhd2FpdCBnaXRQdWxsRGlyZWN0b3J5KCByZXBvUHdkICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHJlcG8gPT09ICdjaGlwcGVyJyB8fCByZXBvID09PSAncGVyZW5uaWFsLWFsaWFzJyB8fCByZXBvID09PSB0aGlzLnJlcG8gKSB7XHJcbiAgICAgICAgICB3aW5zdG9uLmluZm8oIGBucG0gJHtyZXBvfSBpbiAke2NoZWNrb3V0RGlyZWN0b3J5fWAgKTtcclxuXHJcbiAgICAgICAgICBhd2FpdCBucG1VcGRhdGVEaXJlY3RvcnkoIHJlcG9Qd2QgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKSApO1xyXG5cclxuICAgICAgLy8gUGVyZW5uaWFsIGNhbiBiZSBhIG5pY2UgbWFudWFsIGFkZGl0aW9uIGluIGVhY2ggZGlyLCBpbiBjYXNlIHlvdSBuZWVkIHRvIGdvIGluIGFuZCBydW4gY29tbWFuZHMgdG8gdGhlc2VcclxuICAgICAgLy8gYnJhbmNoZXMgbWFudWFsbHkgKGxpa2UgYnVpbGQgb3IgY2hlY2tvdXQgb3IgdXBkYXRlKS4gTm8gbmVlZCB0byBucG0gaW5zdGFsbCwgeW91IGNhbiBkbyB0aGF0IHlvdXJzZWxmIGlmIG5lZWRlZC5cclxuICAgICAgYXdhaXQgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5KCAncGVyZW5uaWFsJywgY2hlY2tvdXREaXJlY3RvcnkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gb3B0aW9uYWwgcGFyYW1ldGVycyBmb3IgZ2V0QnVpbGRBcmd1bWVudHNcclxuICAgICAqL1xyXG4gICAgYXN5bmMgYnVpbGQoIG9wdGlvbnMgKSB7XHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0RGlyZWN0b3J5ID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCByZXBvRGlyZWN0b3J5ID0gYCR7Y2hlY2tvdXREaXJlY3Rvcnl9LyR7dGhpcy5yZXBvfWA7XHJcblxyXG4gICAgICBjb25zdCBhcmdzID0gZ2V0QnVpbGRBcmd1bWVudHMoIHRoaXMuZ2V0Q2hpcHBlclZlcnNpb24oKSwgXy5tZXJnZSgge1xyXG4gICAgICAgIGJyYW5kczogdGhpcy5icmFuZHMsXHJcbiAgICAgICAgYWxsSFRNTDogdHJ1ZSxcclxuICAgICAgICBkZWJ1Z0hUTUw6IHRydWUsXHJcbiAgICAgICAgbGludDogZmFsc2UsXHJcbiAgICAgICAgbG9jYWxlczogJyonXHJcbiAgICAgIH0sIG9wdGlvbnMgKSApO1xyXG5cclxuICAgICAgd2luc3Rvbi5pbmZvKCBgYnVpbGRpbmcgJHtjaGVja291dERpcmVjdG9yeX0gd2l0aCBncnVudCAke2FyZ3Muam9pbiggJyAnICl9YCApO1xyXG4gICAgICBhd2FpdCBleGVjdXRlKCBncnVudENvbW1hbmQsIGFyZ3MsIHJlcG9EaXJlY3RvcnkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqL1xyXG4gICAgYXN5bmMgdHJhbnNwaWxlKCkge1xyXG4gICAgICBjb25zdCBjaGVja291dERpcmVjdG9yeSA9IFJlbGVhc2VCcmFuY2guZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgY29uc3QgcmVwb0RpcmVjdG9yeSA9IGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb31gO1xyXG5cclxuICAgICAgd2luc3Rvbi5pbmZvKCBgdHJhbnNwaWxpbmcgJHtjaGVja291dERpcmVjdG9yeX1gICk7XHJcblxyXG4gICAgICAvLyBXZSBtaWdodCBub3QgYmUgYWJsZSB0byBydW4gdGhpcyBjb21tYW5kIVxyXG4gICAgICBhd2FpdCBleGVjdXRlKCBncnVudENvbW1hbmQsIFsgJ291dHB1dC1qcy1wcm9qZWN0JyBdLCByZXBvRGlyZWN0b3J5LCB7XHJcbiAgICAgICAgZXJyb3JzOiAncmVzb2x2ZSdcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZ3xudWxsPn0gLSBFcnJvciBzdHJpbmcsIG9yIG51bGwgaWYgbm8gZXJyb3JcclxuICAgICAqL1xyXG4gICAgYXN5bmMgY2hlY2tVbmJ1aWx0KCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiBhd2FpdCB3aXRoU2VydmVyKCBhc3luYyBwb3J0ID0+IHtcclxuICAgICAgICAgIGNvbnN0IHVybCA9IGBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vJHt0aGlzLnJlcG99LyR7dGhpcy5yZXBvfV9lbi5odG1sP2JyYW5kPXBoZXQmZWEmZnV6ek1vdXNlJmZ1enpUb3VjaGA7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgcHVwcGV0ZWVyTG9hZCggdXJsLCB7XHJcbiAgICAgICAgICAgICAgd2FpdEFmdGVyTG9hZDogMjAwMDBcclxuICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgRmFpbHVyZSBmb3IgJHt1cmx9OiAke2V9YDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICBwYXRoOiBSZWxlYXNlQnJhbmNoLmdldENoZWNrb3V0RGlyZWN0b3J5KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoIClcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgcmV0dXJuIGBbRVJST1JdIEZhaWx1cmUgdG8gY2hlY2s6ICR7ZX1gO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8c3RyaW5nfG51bGw+fSAtIEVycm9yIHN0cmluZywgb3IgbnVsbCBpZiBubyBlcnJvclxyXG4gICAgICovXHJcbiAgICBhc3luYyBjaGVja0J1aWx0KCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHVzZXNDaGlwcGVyMiA9IGF3YWl0IHRoaXMudXNlc0NoaXBwZXIyKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBhd2FpdCB3aXRoU2VydmVyKCBhc3luYyBwb3J0ID0+IHtcclxuICAgICAgICAgIGNvbnN0IHVybCA9IGBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vJHt0aGlzLnJlcG99L2J1aWxkLyR7dXNlc0NoaXBwZXIyID8gJ3BoZXQvJyA6ICcnfSR7dGhpcy5yZXBvfV9lbiR7dXNlc0NoaXBwZXIyID8gJ19waGV0JyA6ICcnfS5odG1sP2Z1enpNb3VzZSZmdXp6VG91Y2hgO1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIHB1cHBldGVlckxvYWQoIHVybCwge1xyXG4gICAgICAgICAgICAgIHdhaXRBZnRlckxvYWQ6IDIwMDAwXHJcbiAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNhdGNoKCBlcnJvciApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGBGYWlsdXJlIGZvciAke3VybH06ICR7ZXJyb3J9YDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICBwYXRoOiBSZWxlYXNlQnJhbmNoLmdldENoZWNrb3V0RGlyZWN0b3J5KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoIClcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgcmV0dXJuIGBbRVJST1JdIEZhaWx1cmUgdG8gY2hlY2s6ICR7ZX1gO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVja3MgdGhpcyByZWxlYXNlIGJyYW5jaCBvdXQuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpbmNsdWRlTnBtVXBkYXRlXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGNoZWNrb3V0KCBpbmNsdWRlTnBtVXBkYXRlICkge1xyXG4gICAgICBhd2FpdCBjaGVja291dFRhcmdldCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCwgaW5jbHVkZU5wbVVwZGF0ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciB0aGlzIHJlbGVhc2UgYnJhbmNoIGluY2x1ZGVzIHRoZSBnaXZlbiBTSEEgZm9yIHRoZSBnaXZlbiByZXBvIGRlcGVuZGVuY3kuIFdpbGwgYmUgZmFsc2UgaWYgaXQgZG9lc24ndFxyXG4gICAgICogZGVwZW5kIG9uIHRoaXMgcmVwb3NpdG9yeS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNoYVxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBpbmNsdWRlc1NIQSggcmVwbywgc2hhICkge1xyXG4gICAgICBsZXQgcmVzdWx0ID0gZmFsc2U7XHJcblxyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG5cclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuXHJcbiAgICAgIGlmICggZGVwZW5kZW5jaWVzWyByZXBvIF0gKSB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudFNIQSA9IGRlcGVuZGVuY2llc1sgcmVwbyBdLnNoYTtcclxuICAgICAgICByZXN1bHQgPSBzaGEgPT09IGN1cnJlbnRTSEEgfHwgYXdhaXQgZ2l0SXNBbmNlc3RvciggcmVwbywgc2hhLCBjdXJyZW50U0hBICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFdoZXRoZXIgdGhpcyByZWxlYXNlIGJyYW5jaCBkb2VzIE5PVCBpbmNsdWRlIHRoZSBnaXZlbiBTSEEgZm9yIHRoZSBnaXZlbiByZXBvIGRlcGVuZGVuY3kuIFdpbGwgYmUgZmFsc2UgaWYgaXQgZG9lc24ndFxyXG4gICAgICogZGVwZW5kIG9uIHRoaXMgcmVwb3NpdG9yeS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNoYVxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBpc01pc3NpbmdTSEEoIHJlcG8sIHNoYSApIHtcclxuICAgICAgbGV0IHJlc3VsdCA9IGZhbHNlO1xyXG5cclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuXHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggdGhpcy5yZXBvICk7XHJcblxyXG4gICAgICBpZiAoIGRlcGVuZGVuY2llc1sgcmVwbyBdICkge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRTSEEgPSBkZXBlbmRlbmNpZXNbIHJlcG8gXS5zaGE7XHJcbiAgICAgICAgcmVzdWx0ID0gc2hhICE9PSBjdXJyZW50U0hBICYmICEoIGF3YWl0IGdpdElzQW5jZXN0b3IoIHJlcG8sIHNoYSwgY3VycmVudFNIQSApICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBTSEEgYXQgd2hpY2ggdGhpcyByZWxlYXNlIGJyYW5jaCdzIG1haW4gcmVwb3NpdG9yeSBkaXZlcmdlZCBmcm9tIG1haW4uXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldERpdmVyZ2luZ1NIQSgpIHtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgYXdhaXQgZ2l0UHVsbCggdGhpcy5yZXBvICk7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIGdpdEZpcnN0RGl2ZXJnaW5nQ29tbWl0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoLCAnbWFpbicgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSB0aW1lc3RhbXAgYXQgd2hpY2ggdGhpcyByZWxlYXNlIGJyYW5jaCdzIG1haW4gcmVwb3NpdG9yeSBkaXZlcmdlZCBmcm9tIG1haW4uXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPG51bWJlcj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldERpdmVyZ2luZ1RpbWVzdGFtcCgpIHtcclxuICAgICAgcmV0dXJuIGdpdFRpbWVzdGFtcCggdGhpcy5yZXBvLCBhd2FpdCB0aGlzLmdldERpdmVyZ2luZ1NIQSgpICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBkZXBlbmRlbmNpZXMuanNvbiBmb3IgdGhpcyByZWxlYXNlIGJyYW5jaFxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZXREZXBlbmRlbmNpZXMoKSB7XHJcbiAgICAgIHJldHVybiBnZXRCcmFuY2hEZXBlbmRlbmNpZXMoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIFNpbVZlcnNpb24gZm9yIHRoaXMgcmVsZWFzZSBicmFuY2hcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxTaW1WZXJzaW9uPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgZ2V0U2ltVmVyc2lvbigpIHtcclxuICAgICAgcmV0dXJuIGdldEJyYW5jaFZlcnNpb24oIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYSBsaXN0IG9mIHN0YXR1cyBtZXNzYWdlcyBvZiBhbnl0aGluZyBvdXQtb2YtdGhlLW9yZGluYXJ5XHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPEFycmF5LjxzdHJpbmc+Pn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgZ2V0U3RhdHVzKCBnZXRCcmFuY2hNYXBBc3luY0NhbGxiYWNrID0gZ2V0QnJhbmNoTWFwICkge1xyXG4gICAgICBjb25zdCByZXN1bHRzID0gW107XHJcblxyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCB0aGlzLmdldERlcGVuZGVuY2llcygpO1xyXG4gICAgICBjb25zdCBkZXBlbmRlbmN5TmFtZXMgPSBPYmplY3Qua2V5cyggZGVwZW5kZW5jaWVzICkuZmlsdGVyKCBrZXkgPT4ge1xyXG4gICAgICAgIHJldHVybiBrZXkgIT09ICdjb21tZW50JyAmJiBrZXkgIT09IHRoaXMucmVwbyAmJiBrZXkgIT09ICdwaGV0LWlvLXdyYXBwZXItc29uaWZpY2F0aW9uJztcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgLy8gQ2hlY2sgb3VyIG93biBkZXBlbmRlbmN5XHJcbiAgICAgIGlmICggZGVwZW5kZW5jaWVzWyB0aGlzLnJlcG8gXSApIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgY3VycmVudENvbW1pdCA9IGF3YWl0IGdpdFJldlBhcnNlKCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcbiAgICAgICAgICBjb25zdCBwcmV2aW91c0NvbW1pdCA9IGF3YWl0IGdpdFJldlBhcnNlKCB0aGlzLnJlcG8sIGAke2N1cnJlbnRDb21taXR9XmAgKTtcclxuICAgICAgICAgIGlmICggZGVwZW5kZW5jaWVzWyB0aGlzLnJlcG8gXS5zaGEgIT09IHByZXZpb3VzQ29tbWl0ICkge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goICdbSU5GT10gUG90ZW50aWFsIGNoYW5nZXMgKGRlcGVuZGVuY3kgaXMgbm90IHByZXZpb3VzIGNvbW1pdCknICk7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCggYFtJTkZPXSAke2N1cnJlbnRDb21taXR9ICR7cHJldmlvdXNDb21taXR9ICR7ZGVwZW5kZW5jaWVzWyB0aGlzLnJlcG8gXS5zaGF9YCApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKCAoIGF3YWl0IHRoaXMuZ2V0U2ltVmVyc2lvbigpICkudGVzdFR5cGUgPT09ICdyYycgJiYgdGhpcy5pc1JlbGVhc2VkICkge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goICdbSU5GT10gUmVsZWFzZSBjYW5kaWRhdGUgdmVyc2lvbiBkZXRlY3RlZCAoc2VlIGlmIHRoZXJlIGlzIGEgUUEgaXNzdWUpJyApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICAgIHJlc3VsdHMucHVzaCggYFtFUlJPUl0gRmFpbHVyZSB0byBjaGVjayBjdXJyZW50L3ByZXZpb3VzIGNvbW1pdDogJHtlLm1lc3NhZ2V9YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXN1bHRzLnB1c2goICdbV0FSTklOR10gT3duIHJlcG9zaXRvcnkgbm90IGluY2x1ZGVkIGluIGRlcGVuZGVuY2llcycgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yICggY29uc3QgZGVwZW5kZW5jeSBvZiBkZXBlbmRlbmN5TmFtZXMgKSB7XHJcbiAgICAgICAgY29uc3QgcG90ZW50aWFsUmVsZWFzZUJyYW5jaCA9IGAke3RoaXMucmVwb30tJHt0aGlzLmJyYW5jaH1gO1xyXG4gICAgICAgIGNvbnN0IGJyYW5jaE1hcCA9IGF3YWl0IGdldEJyYW5jaE1hcEFzeW5jQ2FsbGJhY2soIGRlcGVuZGVuY3kgKTtcclxuXHJcbiAgICAgICAgaWYgKCBPYmplY3Qua2V5cyggYnJhbmNoTWFwICkuaW5jbHVkZXMoIHBvdGVudGlhbFJlbGVhc2VCcmFuY2ggKSApIHtcclxuICAgICAgICAgIGlmICggZGVwZW5kZW5jaWVzWyBkZXBlbmRlbmN5IF0uc2hhICE9PSBicmFuY2hNYXBbIHBvdGVudGlhbFJlbGVhc2VCcmFuY2ggXSApIHtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKCBgW1dBUk5JTkddIERlcGVuZGVuY3kgbWlzbWF0Y2ggZm9yICR7ZGVwZW5kZW5jeX0gb24gYnJhbmNoICR7cG90ZW50aWFsUmVsZWFzZUJyYW5jaH1gICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciB0aGUgc2ltIGlzIGNvbXBhdGlibGUgd2l0aCBFUzYgZmVhdHVyZXNcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgdXNlc0VTNigpIHtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuICAgICAgY29uc3Qgc2hhID0gZGVwZW5kZW5jaWVzLmNoaXBwZXIuc2hhO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCAnbWFpbicgKTtcclxuXHJcbiAgICAgIHJldHVybiBnaXRJc0FuY2VzdG9yKCAnY2hpcHBlcicsICc4MGI0YWQ2MmNkOGYyMDU3Yjg0NGYxOGQzYzAwY2Y1YzBjODllZDhkJywgc2hhICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBzaW0gdXNlcyBpbml0aWFsaXplLWdsb2JhbHMgYmFzZWQgcXVlcnkgcGFyYW1ldGVyc1xyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIElmIHRydWU6XHJcbiAgICAgKiAgIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuV0hBVEVWRVJcclxuICAgICAqICAgQU5EIGl0IG5lZWRzIHRvIGJlIGluIHRoZSBzY2hlbWFcclxuICAgICAqXHJcbiAgICAgKiBJZiBmYWxzZTpcclxuICAgICAqICAgcGhldC5jaGlwcGVyLmdldFF1ZXJ5UGFyYW1ldGVyKCAnV0hBVEVWRVInIClcclxuICAgICAqICAgRkxBR1Mgc2hvdWxkIHVzZSAhIXBoZXQuY2hpcHBlci5nZXRRdWVyeVBhcmFtZXRlciggJ1dIQVRFVkVSJyApXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVzZXNJbml0aWFsaXplR2xvYmFsc1F1ZXJ5UGFyYW1ldGVycygpIHtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuICAgICAgY29uc3Qgc2hhID0gZGVwZW5kZW5jaWVzLmNoaXBwZXIuc2hhO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCAnbWFpbicgKTtcclxuXHJcbiAgICAgIHJldHVybiBnaXRJc0FuY2VzdG9yKCAnY2hpcHBlcicsICdlNDU0Zjg4ZmY1MWQxZTNmYWJkYjNhMDc2ZDc0MDdhMmE5ZTkxMzNjJywgc2hhICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgcGhldC1pby5zdGFuZGFsb25lIGlzIHRoZSBjb3JyZWN0IHBoZXQtaW8gcXVlcnkgcGFyYW1ldGVyIChvdGhlcndpc2UgaXQncyB0aGUgbmV3ZXJcclxuICAgICAqIHBoZXRpb1N0YW5kYWxvbmUpLlxyXG4gICAgICogTG9va3MgZm9yIHRoZSBwcmVzZW5jZSBvZiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9jb21taXQvNDgxNGQ2OTY2YzU0ZjI1MGIxYzBmMzkwOWI3MWYyYjljZmNjNzY2NS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVzZXNPbGRQaGV0aW9TdGFuZGFsb25lKCkge1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG4gICAgICBjb25zdCBzaGEgPSBkZXBlbmRlbmNpZXMuY2hpcHBlci5zaGE7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuICEoIGF3YWl0IGdpdElzQW5jZXN0b3IoICdjaGlwcGVyJywgJzQ4MTRkNjk2NmM1NGYyNTBiMWMwZjM5MDliNzFmMmI5Y2ZjYzc2NjUnLCBzaGEgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSByZWxhdGl2ZVNpbVBhdGggcXVlcnkgcGFyYW1ldGVyIGlzIHVzZWQgZm9yIHdyYXBwZXJzIChpbnN0ZWFkIG9mIGxhdW5jaExvY2FsVmVyc2lvbikuXHJcbiAgICAgKiBMb29rcyBmb3IgdGhlIHByZXNlbmNlIG9mIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2NvbW1pdC9lM2ZjMjYwNzkzNThkODYwNzQzNThhNmRiM2ViYWYxYWY5NzI1NjMyXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyB1c2VzUmVsYXRpdmVTaW1QYXRoKCkge1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG5cclxuICAgICAgaWYgKCAhZGVwZW5kZW5jaWVzWyAncGhldC1pbycgXSApIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gRG9lc24ndCByZWFsbHkgbWF0dGVyIG5vdywgZG9lcyBpdD9cclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc2hhID0gZGVwZW5kZW5jaWVzWyAncGhldC1pbycgXS5zaGE7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIGdpdElzQW5jZXN0b3IoICdwaGV0LWlvJywgJ2UzZmMyNjA3OTM1OGQ4NjA3NDM1OGE2ZGIzZWJhZjFhZjk3MjU2MzInLCBzaGEgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciBwaGV0LWlvIFN0dWRpbyBpcyBiZWluZyB1c2VkIGluc3RlYWQgb2YgZGVwcmVjYXRlZCBpbnN0YW5jZSBwcm94aWVzIHdyYXBwZXIuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyB1c2VzUGhldGlvU3R1ZGlvKCkge1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG5cclxuICAgICAgY29uc3Qgc2hhID0gZGVwZW5kZW5jaWVzLmNoaXBwZXIuc2hhO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCAnbWFpbicgKTtcclxuXHJcbiAgICAgIHJldHVybiBnaXRJc0FuY2VzdG9yKCAnY2hpcHBlcicsICc3Mzc1ZjZhNTdiNTg3NGI2YmJmOTdhNTRjOWE5MDhmMTlmODhkMzhmJywgc2hhICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgcGhldC1pbyBTdHVkaW8gdG9wLWxldmVsIChpbmRleC5odG1sKSBpcyB1c2VkIGluc3RlYWQgb2Ygc3R1ZGlvLmh0bWwuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyB1c2VzUGhldGlvU3R1ZGlvSW5kZXgoKSB7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggdGhpcy5yZXBvICk7XHJcblxyXG4gICAgICBjb25zdCBkZXBlbmRlbmN5ID0gZGVwZW5kZW5jaWVzWyAncGhldC1pby13cmFwcGVycycgXTtcclxuICAgICAgaWYgKCAhZGVwZW5kZW5jeSApIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHNoYSA9IGRlcGVuZGVuY3kuc2hhO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCAnbWFpbicgKTtcclxuXHJcbiAgICAgIHJldHVybiBnaXRJc0FuY2VzdG9yKCAncGhldC1pby13cmFwcGVycycsICc3ZWMxYTA0YTcwZmI5NzA3YjM4MWI4YmNhYjNhZDA3MDgxNWVmN2ZlJywgc2hhICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgYW4gYWRkaXRpb25hbCBmb2xkZXIgZXhpc3RzIGluIHRoZSBidWlsZCBkaXJlY3Rvcnkgb2YgdGhlIHNpbSBiYXNlZCBvbiB0aGUgYnJhbmQuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyB1c2VzQ2hpcHBlcjIoKSB7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggdGhpcy5yZXBvICk7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCAnY2hpcHBlcicsIGRlcGVuZGVuY2llcy5jaGlwcGVyLnNoYSApO1xyXG5cclxuICAgICAgY29uc3QgY2hpcHBlclZlcnNpb24gPSBDaGlwcGVyVmVyc2lvbi5nZXRGcm9tUmVwb3NpdG9yeSgpO1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0gY2hpcHBlclZlcnNpb24ubWFqb3IgIT09IDAgfHwgY2hpcHBlclZlcnNpb24ubWlub3IgIT09IDA7XHJcblxyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCAnbWFpbicgKTtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoICdjaGlwcGVyJywgJ21haW4nICk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUnVucyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB3aXRoIHRoZSBjb250ZW50cyBvZiBhIHNwZWNpZmljIGZpbGUncyBjb250ZW50cyBpbiB0aGUgcmVsZWFzZSBicmFuY2ggKHdpdGggZmFsc2UgaWZcclxuICAgICAqIGl0IGRvZXNuJ3QgZXhpc3QpLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKGNvbnRlbnRzOnN0cmluZyk6Ym9vbGVhbn0gcHJlZGljYXRlXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHdpdGhGaWxlKCBmaWxlLCBwcmVkaWNhdGUgKSB7XHJcbiAgICAgIGF3YWl0IHRoaXMuY2hlY2tvdXQoIGZhbHNlICk7XHJcblxyXG4gICAgICBpZiAoIGZzLmV4aXN0c1N5bmMoIGZpbGUgKSApIHtcclxuICAgICAgICBjb25zdCBjb250ZW50cyA9IGZzLnJlYWRGaWxlU3luYyggZmlsZSwgJ3V0Zi04JyApO1xyXG4gICAgICAgIHJldHVybiBwcmVkaWNhdGUoIGNvbnRlbnRzICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlLXJ1bnMgYSBwcm9kdWN0aW9uIGRlcGxveSBmb3IgYSBzcGVjaWZpYyBicmFuY2guXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHJlZGVwbG95UHJvZHVjdGlvbiggbG9jYWxlcyA9ICcqJyApIHtcclxuICAgICAgaWYgKCB0aGlzLmlzUmVsZWFzZWQgKSB7XHJcbiAgICAgICAgYXdhaXQgY2hlY2tvdXRUYXJnZXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2gsIGZhbHNlICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHZlcnNpb24gPSBhd2FpdCBnZXRSZXBvVmVyc2lvbiggdGhpcy5yZXBvICk7XHJcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuXHJcbiAgICAgICAgYXdhaXQgY2hlY2tvdXRNYWluKCB0aGlzLnJlcG8sIGZhbHNlICk7XHJcblxyXG4gICAgICAgIGF3YWl0IGJ1aWxkU2VydmVyUmVxdWVzdCggdGhpcy5yZXBvLCB2ZXJzaW9uLCB0aGlzLmJyYW5jaCwgZGVwZW5kZW5jaWVzLCB7XHJcbiAgICAgICAgICBsb2NhbGVzOiBsb2NhbGVzLFxyXG4gICAgICAgICAgYnJhbmRzOiB0aGlzLmJyYW5kcyxcclxuICAgICAgICAgIHNlcnZlcnM6IFsgJ3Byb2R1Y3Rpb24nIF1cclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnU2hvdWxkIG5vdCByZWRlcGxveSBhIG5vbi1yZWxlYXNlZCBicmFuY2gnICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldHMgYSBsaXN0IG9mIFJlbGVhc2VCcmFuY2hlcyB3aGljaCB3b3VsZCBiZSBwb3RlbnRpYWwgY2FuZGlkYXRlcyBmb3IgYSBtYWludGVuYW5jZSByZWxlYXNlLiBUaGlzIGluY2x1ZGVzOlxyXG4gICAgICogLSBBbGwgcHVibGlzaGVkIHBoZXQgYnJhbmQgcmVsZWFzZSBicmFuY2hlcyAoZnJvbSBtZXRhZGF0YSlcclxuICAgICAqIC0gQWxsIHB1Ymxpc2hlZCBwaGV0LWlvIGJyYW5kIHJlbGVhc2UgYnJhbmNoZXMgKGZyb20gbWV0YWRhdGEpXHJcbiAgICAgKiAtIEFsbCB1bnB1Ymxpc2hlZCBsb2NhbCByZWxlYXNlIGJyYW5jaGVzXHJcbiAgICAgKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPFJlbGVhc2VCcmFuY2hbXT59XHJcbiAgICAgKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgZ2V0QWxsTWFpbnRlbmFuY2VCcmFuY2hlcygpIHtcclxuICAgICAgd2luc3Rvbi5kZWJ1ZyggJ3JldHJpZXZpbmcgYXZhaWxhYmxlIHNpbSBicmFuY2hlcycgKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnbG9hZGluZyBwaGV0IGJyYW5kIFJlbGVhc2VCcmFuY2hlcycgKTtcclxuICAgICAgY29uc3Qgc2ltTWV0YWRhdGFSZXN1bHQgPSBhd2FpdCBzaW1NZXRhZGF0YSgge1xyXG4gICAgICAgIHR5cGU6ICdodG1sJ1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBSZWxlYXNlZCBwaGV0IGJyYW5jaGVzXHJcbiAgICAgIGNvbnN0IHBoZXRCcmFuY2hlcyA9IHNpbU1ldGFkYXRhUmVzdWx0LnByb2plY3RzLm1hcCggc2ltRGF0YSA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVwbyA9IHNpbURhdGEubmFtZS5zbGljZSggc2ltRGF0YS5uYW1lLmluZGV4T2YoICcvJyApICsgMSApO1xyXG4gICAgICAgIGNvbnN0IGJyYW5jaCA9IGAke3NpbURhdGEudmVyc2lvbi5tYWpvcn0uJHtzaW1EYXRhLnZlcnNpb24ubWlub3J9YDtcclxuICAgICAgICByZXR1cm4gbmV3IFJlbGVhc2VCcmFuY2goIHJlcG8sIGJyYW5jaCwgWyAncGhldCcgXSwgdHJ1ZSApO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggJ2xvYWRpbmcgcGhldC1pbyBicmFuZCBSZWxlYXNlQnJhbmNoZXMnICk7XHJcbiAgICAgIGNvbnN0IHBoZXRpb0JyYW5jaGVzID0gKCBhd2FpdCBzaW1QaGV0aW9NZXRhZGF0YSgge1xyXG4gICAgICAgIGFjdGl2ZTogdHJ1ZSxcclxuICAgICAgICBsYXRlc3Q6IHRydWVcclxuICAgICAgfSApICkuZmlsdGVyKCBzaW1EYXRhID0+IHNpbURhdGEuYWN0aXZlICYmIHNpbURhdGEubGF0ZXN0ICkubWFwKCBzaW1EYXRhID0+IHtcclxuICAgICAgICBsZXQgYnJhbmNoID0gYCR7c2ltRGF0YS52ZXJzaW9uTWFqb3J9LiR7c2ltRGF0YS52ZXJzaW9uTWlub3J9YDtcclxuICAgICAgICBpZiAoIHNpbURhdGEudmVyc2lvblN1ZmZpeC5sZW5ndGggKSB7XHJcbiAgICAgICAgICBicmFuY2ggKz0gYC0ke3NpbURhdGEudmVyc2lvblN1ZmZpeH1gOyAvLyBhZGRpdGlvbmFsIGRhc2ggcmVxdWlyZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWxlYXNlQnJhbmNoKCBzaW1EYXRhLm5hbWUsIGJyYW5jaCwgWyAncGhldC1pbycgXSwgdHJ1ZSApO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggJ2xvYWRpbmcgdW5yZWxlYXNlZCBSZWxlYXNlQnJhbmNoZXMnICk7XHJcbiAgICAgIGNvbnN0IHVucmVsZWFzZWRCcmFuY2hlcyA9IFtdO1xyXG4gICAgICBmb3IgKCBjb25zdCByZXBvIG9mIGdldEFjdGl2ZVNpbXMoKSApIHtcclxuXHJcbiAgICAgICAgLy8gRXhjbHVkZSBleHBsaWNpdGx5IGV4Y2x1ZGVkIHJlcG9zXHJcbiAgICAgICAgaWYgKCBKU09OLnBhcnNlKCBmcy5yZWFkRmlsZVN5bmMoIGAuLi8ke3JlcG99L3BhY2thZ2UuanNvbmAsICd1dGY4JyApICkucGhldC5pZ25vcmVGb3JBdXRvbWF0ZWRNYWludGVuYW5jZVJlbGVhc2VzICkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBicmFuY2hlcyA9IGF3YWl0IGdldEJyYW5jaGVzKCByZXBvICk7XHJcbiAgICAgICAgY29uc3QgcmVsZWFzZWRCcmFuY2hlcyA9IHBoZXRCcmFuY2hlcy5jb25jYXQoIHBoZXRpb0JyYW5jaGVzICk7XHJcblxyXG4gICAgICAgIGZvciAoIGNvbnN0IGJyYW5jaCBvZiBicmFuY2hlcyApIHtcclxuICAgICAgICAgIC8vIFdlIGFyZW4ndCB1bnJlbGVhc2VkIGlmIHdlJ3JlIGluY2x1ZGVkIGluIGVpdGhlciBwaGV0IG9yIHBoZXQtaW8gbWV0YWRhdGEuXHJcbiAgICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2JhbGFuY2luZy1hY3QvaXNzdWVzLzExOFxyXG4gICAgICAgICAgaWYgKCByZWxlYXNlZEJyYW5jaGVzLmZpbHRlciggcmVsZWFzZUJyYW5jaCA9PiByZWxlYXNlQnJhbmNoLnJlcG8gPT09IHJlcG8gJiYgcmVsZWFzZUJyYW5jaC5icmFuY2ggPT09IGJyYW5jaCApLmxlbmd0aCApIHtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBicmFuY2gubWF0Y2goIC9eKFxcZCspXFwuKFxcZCspJC8gKTtcclxuXHJcbiAgICAgICAgICBpZiAoIG1hdGNoICkge1xyXG4gICAgICAgICAgICBjb25zdCBtYWpvciA9IE51bWJlciggbWF0Y2hbIDEgXSApO1xyXG4gICAgICAgICAgICBjb25zdCBtaW5vciA9IE51bWJlciggbWF0Y2hbIDIgXSApO1xyXG5cclxuICAgICAgICAgICAgLy8gQXNzdW1wdGlvbiB0aGF0IHRoZXJlIGlzIG5vIHBoZXQtaW8gYnJhbmQgc2ltIHRoYXQgaXNuJ3QgYWxzbyByZWxlYXNlZCB3aXRoIHBoZXQgYnJhbmRcclxuICAgICAgICAgICAgY29uc3QgcHJvamVjdE1ldGFkYXRhID0gc2ltTWV0YWRhdGFSZXN1bHQucHJvamVjdHMuZmluZCggcHJvamVjdCA9PiBwcm9qZWN0Lm5hbWUgPT09IGBodG1sLyR7cmVwb31gICkgfHwgbnVsbDtcclxuICAgICAgICAgICAgY29uc3QgcHJvZHVjdGlvblZlcnNpb24gPSBwcm9qZWN0TWV0YWRhdGEgPyBwcm9qZWN0TWV0YWRhdGEudmVyc2lvbiA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAoICFwcm9kdWN0aW9uVmVyc2lvbiB8fFxyXG4gICAgICAgICAgICAgICAgIG1ham9yID4gcHJvZHVjdGlvblZlcnNpb24ubWFqb3IgfHxcclxuICAgICAgICAgICAgICAgICAoIG1ham9yID09PSBwcm9kdWN0aW9uVmVyc2lvbi5tYWpvciAmJiBtaW5vciA+IHByb2R1Y3Rpb25WZXJzaW9uLm1pbm9yICkgKSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIERvIGEgY2hlY2tvdXQgc28gd2UgY2FuIGRldGVybWluZSBzdXBwb3J0ZWQgYnJhbmRzXHJcbiAgICAgICAgICAgICAgY29uc3QgcGFja2FnZU9iamVjdCA9IEpTT04ucGFyc2UoIGF3YWl0IGdldEZpbGVBdEJyYW5jaCggcmVwbywgYnJhbmNoLCAncGFja2FnZS5qc29uJyApICk7XHJcbiAgICAgICAgICAgICAgY29uc3QgaW5jbHVkZXNQaGV0aW8gPSBwYWNrYWdlT2JqZWN0LnBoZXQgJiYgcGFja2FnZU9iamVjdC5waGV0LnN1cHBvcnRlZEJyYW5kcyAmJiBwYWNrYWdlT2JqZWN0LnBoZXQuc3VwcG9ydGVkQnJhbmRzLmluY2x1ZGVzKCAncGhldC1pbycgKTtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgYnJhbmRzID0gW1xyXG4gICAgICAgICAgICAgICAgJ3BoZXQnLCAvLyBBc3N1bXB0aW9uIHRoYXQgdGhlcmUgaXMgbm8gcGhldC1pbyBicmFuZCBzaW0gdGhhdCBpc24ndCBhbHNvIHJlbGVhc2VkIHdpdGggcGhldCBicmFuZFxyXG4gICAgICAgICAgICAgICAgLi4uKCBpbmNsdWRlc1BoZXRpbyA/IFsgJ3BoZXQtaW8nIF0gOiBbXSApXHJcbiAgICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKCAhcGFja2FnZU9iamVjdC5waGV0Lmlnbm9yZUZvckF1dG9tYXRlZE1haW50ZW5hbmNlUmVsZWFzZXMgKSB7XHJcbiAgICAgICAgICAgICAgICB1bnJlbGVhc2VkQnJhbmNoZXMucHVzaCggbmV3IFJlbGVhc2VCcmFuY2goIHJlcG8sIGJyYW5jaCwgYnJhbmRzLCBmYWxzZSApICk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBhbGxSZWxlYXNlQnJhbmNoZXMgPSBSZWxlYXNlQnJhbmNoLmNvbWJpbmVMaXN0cyggWyAuLi5waGV0QnJhbmNoZXMsIC4uLnBoZXRpb0JyYW5jaGVzLCAuLi51bnJlbGVhc2VkQnJhbmNoZXMgXSApO1xyXG5cclxuICAgICAgLy8gRkFNQiAyLjMtcGhldGlvIGtlZXBzIGVuZGluZyB1cCBpbiB0aGUgTVIgbGlzdCB3aGVuIHdlIGRvbid0IHdhbnQgaXQgdG8sIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTk1Ny5cclxuICAgICAgcmV0dXJuIGFsbFJlbGVhc2VCcmFuY2hlcy5maWx0ZXIoIHJiID0+ICEoIHJiLnJlcG8gPT09ICdmb3JjZXMtYW5kLW1vdGlvbi1iYXNpY3MnICYmIHJiLmJyYW5jaCA9PT0gJzIuMy1waGV0aW8nICkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbWJpbmVzIG11bHRpcGxlIG1hdGNoaW5nIFJlbGVhc2VCcmFuY2hlcyBpbnRvIG9uZSB3aGVyZSBhcHByb3ByaWF0ZSwgYW5kIHNvcnRzLiBGb3IgZXhhbXBsZSwgdHdvIFJlbGVhc2VCcmFuY2hlc1xyXG4gICAgICogb2YgdGhlIHNhbWUgcmVwbyBidXQgZm9yIGRpZmZlcmVudCBicmFuZHMgYXJlIGNvbWJpbmVkIGludG8gYSBzaW5nbGUgUmVsZWFzZUJyYW5jaCB3aXRoIG11bHRpcGxlIGJyYW5kcy5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxSZWxlYXNlQnJhbmNoPn0gc2ltQnJhbmNoZXNcclxuICAgICAqIEByZXR1cm5zIHtBcnJheS48UmVsZWFzZUJyYW5jaD59XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBjb21iaW5lTGlzdHMoIHNpbUJyYW5jaGVzICkge1xyXG4gICAgICBjb25zdCByZXN1bHRCcmFuY2hlcyA9IFtdO1xyXG5cclxuICAgICAgZm9yICggY29uc3Qgc2ltQnJhbmNoIG9mIHNpbUJyYW5jaGVzICkge1xyXG4gICAgICAgIGxldCBmb3VuZEJyYW5jaCA9IGZhbHNlO1xyXG4gICAgICAgIGZvciAoIGNvbnN0IHJlc3VsdEJyYW5jaCBvZiByZXN1bHRCcmFuY2hlcyApIHtcclxuICAgICAgICAgIGlmICggc2ltQnJhbmNoLnJlcG8gPT09IHJlc3VsdEJyYW5jaC5yZXBvICYmIHNpbUJyYW5jaC5icmFuY2ggPT09IHJlc3VsdEJyYW5jaC5icmFuY2ggKSB7XHJcbiAgICAgICAgICAgIGZvdW5kQnJhbmNoID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmVzdWx0QnJhbmNoLmJyYW5kcyA9IFsgLi4ucmVzdWx0QnJhbmNoLmJyYW5kcywgLi4uc2ltQnJhbmNoLmJyYW5kcyBdO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCAhZm91bmRCcmFuY2ggKSB7XHJcbiAgICAgICAgICByZXN1bHRCcmFuY2hlcy5wdXNoKCBzaW1CcmFuY2ggKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJlc3VsdEJyYW5jaGVzLnNvcnQoICggYSwgYiApID0+IHtcclxuICAgICAgICBpZiAoIGEucmVwbyAhPT0gYi5yZXBvICkge1xyXG4gICAgICAgICAgcmV0dXJuIGEucmVwbyA8IGIucmVwbyA/IC0xIDogMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBhLmJyYW5jaCAhPT0gYi5icmFuY2ggKSB7XHJcbiAgICAgICAgICByZXR1cm4gYS5icmFuY2ggPCBiLmJyYW5jaCA/IC0xIDogMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHRCcmFuY2hlcztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBSZWxlYXNlQnJhbmNoO1xyXG59ICkoKTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7K0NBQ0EscUpBQUFBLG1CQUFBLFlBQUFBLG9CQUFBLFdBQUFDLENBQUEsU0FBQUMsQ0FBQSxFQUFBRCxDQUFBLE9BQUFFLENBQUEsR0FBQUMsTUFBQSxDQUFBQyxTQUFBLEVBQUFDLENBQUEsR0FBQUgsQ0FBQSxDQUFBSSxjQUFBLEVBQUFDLENBQUEsR0FBQUosTUFBQSxDQUFBSyxjQUFBLGNBQUFQLENBQUEsRUFBQUQsQ0FBQSxFQUFBRSxDQUFBLElBQUFELENBQUEsQ0FBQUQsQ0FBQSxJQUFBRSxDQUFBLENBQUFPLEtBQUEsS0FBQUMsQ0FBQSx3QkFBQUMsTUFBQSxHQUFBQSxNQUFBLE9BQUFDLENBQUEsR0FBQUYsQ0FBQSxDQUFBRyxRQUFBLGtCQUFBQyxDQUFBLEdBQUFKLENBQUEsQ0FBQUssYUFBQSx1QkFBQUMsQ0FBQSxHQUFBTixDQUFBLENBQUFPLFdBQUEsOEJBQUFDLE9BQUFqQixDQUFBLEVBQUFELENBQUEsRUFBQUUsQ0FBQSxXQUFBQyxNQUFBLENBQUFLLGNBQUEsQ0FBQVAsQ0FBQSxFQUFBRCxDQUFBLElBQUFTLEtBQUEsRUFBQVAsQ0FBQSxFQUFBaUIsVUFBQSxNQUFBQyxZQUFBLE1BQUFDLFFBQUEsU0FBQXBCLENBQUEsQ0FBQUQsQ0FB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