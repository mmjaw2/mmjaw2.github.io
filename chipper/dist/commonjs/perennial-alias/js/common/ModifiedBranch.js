"use strict";

function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Copyright 2018, University of Colorado Boulder

/**
 * Represents a modified simulation release branch, with either pending or applied (and not published) changes.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var Patch = require('./Patch');
var ReleaseBranch = require('./ReleaseBranch');
var SimVersion = require('./SimVersion');
var checkoutDependencies = require('./checkoutDependencies');
var getDependencies = require('./getDependencies');
var gitCheckout = require('./gitCheckout');
var gitPull = require('./gitPull');
var githubCreateIssue = require('./githubCreateIssue');
var assert = require('assert');
module.exports = function () {
  var ModifiedBranch = /*#__PURE__*/function () {
    /**
     * @public
     * @constructor
     *
     * @param {ReleaseBranch} releaseBranch
     * @param {Object} [changedDependencies]
     * @param {Array.<Patch>} [neededPatches]
     * @param {Array.<string>} [pendingMessages]
     * @param {Array.<string>} [pushedMessages]
     * @param {SimVersion|null} [deployedVersion]
     */
    function ModifiedBranch(releaseBranch) {
      var changedDependencies = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var neededPatches = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      var pendingMessages = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
      var pushedMessages = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
      var deployedVersion = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
      _classCallCheck(this, ModifiedBranch);
      assert(releaseBranch instanceof ReleaseBranch);
      assert(_typeof(changedDependencies) === 'object');
      assert(Array.isArray(neededPatches));
      neededPatches.forEach(function (patch) {
        return assert(patch instanceof Patch);
      });
      assert(Array.isArray(pushedMessages));
      pushedMessages.forEach(function (message) {
        return assert(typeof message === 'string');
      });
      assert(deployedVersion === null || deployedVersion instanceof SimVersion);

      // @public {ReleaseBranch}
      this.releaseBranch = releaseBranch;

      // @public {Object} - Keys are repo names, values are SHAs
      this.changedDependencies = changedDependencies;

      // @public {Array.<Patch>}
      this.neededPatches = neededPatches;

      // @public {Array.<string>} - Messages from already-applied patches or other changes NOT included in dependencies.json yet
      this.pendingMessages = pendingMessages;

      // @public {Array.<string>} - Messages from already-applied patches or other changes that have been included in dependencies.json
      this.pushedMessages = pushedMessages;

      // @public {string}
      this.repo = releaseBranch.repo;
      this.branch = releaseBranch.branch;

      // @public {Array.<string>}
      this.brands = releaseBranch.brands;

      // @public {SimVersion|null} - The deployed version for the latest patches applied. Will be reset to null when
      // updates are made.
      this.deployedVersion = deployedVersion;
    }

    /**
     * Convert into a plain JS object meant for JSON serialization.
     * @public
     *
     * @returns {Object}
     */
    return _createClass(ModifiedBranch, [{
      key: "serialize",
      value: function serialize() {
        return {
          releaseBranch: this.releaseBranch.serialize(),
          changedDependencies: this.changedDependencies,
          neededPatches: this.neededPatches.map(function (patch) {
            return patch.name;
          }),
          pendingMessages: this.pendingMessages,
          pushedMessages: this.pushedMessages,
          deployedVersion: this.deployedVersion ? this.deployedVersion.serialize() : null
        };
      }

      /**
       * Takes a serialized form of the ModifiedBranch and returns an actual instance.
       * @public
       *
       * @param {Object}
       * @param {Array.<Patch>} - We only want to store patches in one location, so don't fully save the info.
       * @returns {ModifiedBranch}
       */
    }, {
      key: "isUnused",
      get:
      /**
       * Whether there is no need to keep a reference to us.
       * @public
       *
       * @returns {boolean}
       */
      function get() {
        return this.neededPatches.length === 0 && Object.keys(this.changedDependencies).length === 0 && this.pushedMessages.length === 0 && this.pendingMessages.length === 0;
      }

      /**
       * Whether it is safe to deploy a release candidate for this branch.
       * @public
       *
       * @returns {boolean}
       */
    }, {
      key: "isReadyForReleaseCandidate",
      get: function get() {
        return this.neededPatches.length === 0 && this.pushedMessages.length > 0 && this.deployedVersion === null;
      }

      /**
       * Whether it is safe to deploy a production version for this branch.
       * @public
       *
       * @returns {boolean}
       */
    }, {
      key: "isReadyForProduction",
      get: function get() {
        return this.neededPatches.length === 0 && this.pushedMessages.length > 0 && this.deployedVersion !== null && this.deployedVersion.testType === 'rc';
      }

      /**
       * Returns the branch name that should be used in dependency repositories.
       * @public
       *
       * @returns {string}
       */
    }, {
      key: "dependencyBranch",
      get: function get() {
        return "".concat(this.repo, "-").concat(this.branch);
      }

      /**
       * Creates an issue to note that un-tested changes were patched into a branch, and should at some point be tested.
       * @public
       *
       * @param {string} [additionalNotes]
       */
    }, {
      key: "createUnreleasedIssue",
      value: (function () {
        var _createUnreleasedIssue = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
          var additionalNotes,
            _args = arguments;
          return _regeneratorRuntime().wrap(function _callee$(_context) {
            while (1) switch (_context.prev = _context.next) {
              case 0:
                additionalNotes = _args.length > 0 && _args[0] !== undefined ? _args[0] : '';
                _context.next = 3;
                return githubCreateIssue(this.repo, "Maintenance patches applied to branch ".concat(this.branch), {
                  labels: ['status:ready-for-qa'],
                  body: "This branch (".concat(this.branch, ") had changes related to the following applied:\n\n").concat(this.pushedMessages.map(function (message) {
                    return "- ".concat(message);
                  }).join('\n'), "\n\nPresumably one or more of these changes is likely to have been applied after the last RC version, and should be spot-checked by QA in the next RC (or if it was ready for a production release, an additional spot-check RC should be created).\n").concat(additionalNotes ? "\n".concat(additionalNotes) : '')
                });
              case 3:
              case "end":
                return _context.stop();
            }
          }, _callee, this);
        }));
        function createUnreleasedIssue() {
          return _createUnreleasedIssue.apply(this, arguments);
        }
        return createUnreleasedIssue;
      }()
      /**
       * Returns a list of deployed links for testing (depending on the brands deployed).
       * @public
       *
       * @param {boolean} [includeMessages]
       * @returns {Promise.<Array.<string>>}
       */
      )
    }, {
      key: "getDeployedLinkLines",
      value: (function () {
        var _getDeployedLinkLines = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
          var _this = this;
          var includeMessages,
            linkSuffixes,
            versionString,
            standaloneParams,
            proxiesParams,
            studioName,
            studioNameBeautified,
            usesChipper2,
            phetFolder,
            phetioFolder,
            phetSuffix,
            phetioSuffix,
            phetioBrandSuffix,
            studioPathSuffix,
            phetioDevVersion,
            results,
            _args2 = arguments;
          return _regeneratorRuntime().wrap(function _callee2$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                includeMessages = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : true;
                assert(this.deployedVersion !== null);
                linkSuffixes = [];
                versionString = this.deployedVersion.toString();
                _context2.next = 6;
                return this.releaseBranch.getPhetioStandaloneQueryParameter();
              case 6:
                standaloneParams = _context2.sent;
                _context2.next = 9;
                return this.releaseBranch.usesRelativeSimPath();
              case 9:
                if (!_context2.sent) {
                  _context2.next = 13;
                  break;
                }
                _context2.t0 = 'relativeSimPath';
                _context2.next = 14;
                break;
              case 13:
                _context2.t0 = 'launchLocalVersion';
              case 14:
                proxiesParams = _context2.t0;
                _context2.t1 = this.brands.includes('phet-io');
                if (!_context2.t1) {
                  _context2.next = 20;
                  break;
                }
                _context2.next = 19;
                return this.releaseBranch.usesPhetioStudio();
              case 19:
                _context2.t1 = _context2.sent;
              case 20:
                if (!_context2.t1) {
                  _context2.next = 24;
                  break;
                }
                _context2.t2 = 'studio';
                _context2.next = 25;
                break;
              case 24:
                _context2.t2 = 'instance-proxies';
              case 25:
                studioName = _context2.t2;
                studioNameBeautified = studioName === 'studio' ? 'Studio' : 'Instance Proxies';
                _context2.next = 29;
                return this.releaseBranch.usesChipper2();
              case 29:
                usesChipper2 = _context2.sent;
                phetFolder = usesChipper2 ? '/phet' : '';
                phetioFolder = usesChipper2 ? '/phet-io' : '';
                phetSuffix = usesChipper2 ? '_phet' : '';
                phetioSuffix = usesChipper2 ? '_all_phet-io' : '_en-phetio';
                phetioBrandSuffix = usesChipper2 ? '' : '-phetio';
                _context2.next = 37;
                return this.releaseBranch.usesPhetioStudioIndex();
              case 37:
                if (!_context2.sent) {
                  _context2.next = 41;
                  break;
                }
                _context2.t3 = '';
                _context2.next = 42;
                break;
              case 41:
                _context2.t3 = "/".concat(studioName, ".html?sim=").concat(this.repo, "&").concat(proxiesParams);
              case 42:
                studioPathSuffix = _context2.t3;
                phetioDevVersion = usesChipper2 ? versionString : versionString.split('-').join('-phetio');
                if (this.deployedVersion.testType === 'rc') {
                  if (this.brands.includes('phet')) {
                    linkSuffixes.push("](https://phet-dev.colorado.edu/html/".concat(this.repo, "/").concat(versionString).concat(phetFolder, "/").concat(this.repo, "_all").concat(phetSuffix, ".html)"));
                  }
                  if (this.brands.includes('phet-io')) {
                    linkSuffixes.push(" phet-io](https://phet-dev.colorado.edu/html/".concat(this.repo, "/").concat(phetioDevVersion).concat(phetioFolder, "/").concat(this.repo).concat(phetioSuffix, ".html?").concat(standaloneParams, ")"));
                    linkSuffixes.push(" phet-io ".concat(studioNameBeautified, "](https://phet-dev.colorado.edu/html/").concat(this.repo, "/").concat(phetioDevVersion).concat(phetioFolder, "/wrappers/").concat(studioName).concat(studioPathSuffix, ")"));
                  }
                } else {
                  if (this.brands.includes('phet')) {
                    linkSuffixes.push("](https://phet.colorado.edu/sims/html/".concat(this.repo, "/").concat(versionString, "/").concat(this.repo, "_all.html)"));
                  }
                  if (this.brands.includes('phet-io')) {
                    linkSuffixes.push(" phet-io](https://phet-io.colorado.edu/sims/".concat(this.repo, "/").concat(versionString).concat(phetioBrandSuffix, "/").concat(this.repo).concat(phetioSuffix, ".html?").concat(standaloneParams, ")"));
                    linkSuffixes.push(" phet-io ".concat(studioNameBeautified, "](https://phet-io.colorado.edu/sims/").concat(this.repo, "/").concat(versionString).concat(phetioBrandSuffix, "/wrappers/").concat(studioName).concat(studioPathSuffix, ")"));
                  }
                }
                results = linkSuffixes.map(function (link) {
                  return "- [ ] [".concat(_this.repo, " ").concat(versionString).concat(link);
                });
                if (includeMessages) {
                  results.unshift("\n**".concat(this.repo, " ").concat(this.branch, "** (").concat(this.pushedMessages.join(', '), ")\n"));
                }
                return _context2.abrupt("return", results);
              case 48:
              case "end":
                return _context2.stop();
            }
          }, _callee2, this);
        }));
        function getDeployedLinkLines() {
          return _getDeployedLinkLines.apply(this, arguments);
        }
        return getDeployedLinkLines;
      }()
      /**
       * Checks out the modified branch.
       * @public
       *
       * @param {boolean} [includeNpmUpdate]
       * @returns {Promise.<Array.<string>>} - Names of checked out repositories
       */
      )
    }, {
      key: "checkout",
      value: (function () {
        var _checkout = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
          var includeNpmUpdate,
            dependencies,
            _i,
            _Object$keys,
            key,
            _args3 = arguments;
          return _regeneratorRuntime().wrap(function _callee3$(_context3) {
            while (1) switch (_context3.prev = _context3.next) {
              case 0:
                includeNpmUpdate = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : true;
                _context3.next = 3;
                return gitCheckout(this.repo, this.branch);
              case 3:
                _context3.next = 5;
                return gitPull(this.repo);
              case 5:
                _context3.next = 7;
                return getDependencies(this.repo);
              case 7:
                dependencies = _context3.sent;
                for (_i = 0, _Object$keys = Object.keys(this.changedDependencies); _i < _Object$keys.length; _i++) {
                  key = _Object$keys[_i];
                  // This should exist hopefully
                  dependencies[key].sha = this.changedDependencies[key];
                }
                return _context3.abrupt("return", checkoutDependencies(this.repo, dependencies, includeNpmUpdate));
              case 10:
              case "end":
                return _context3.stop();
            }
          }, _callee3, this);
        }));
        function checkout() {
          return _checkout.apply(this, arguments);
        }
        return checkout;
      }())
    }], [{
      key: "deserialize",
      value: function deserialize(_ref, patches) {
        var releaseBranch = _ref.releaseBranch,
          changedDependencies = _ref.changedDependencies,
          neededPatches = _ref.neededPatches,
          pendingMessages = _ref.pendingMessages,
          pushedMessages = _ref.pushedMessages,
          deployedVersion = _ref.deployedVersion;
        return new ModifiedBranch(ReleaseBranch.deserialize(releaseBranch), changedDependencies, neededPatches.map(function (name) {
          return patches.find(function (patch) {
            return patch.name === name;
          });
        }), pendingMessages, pushedMessages, deployedVersion ? SimVersion.deserialize(deployedVersion) : null);
      }
    }]);
  }();
  return ModifiedBranch;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVnZW5lcmF0b3JSdW50aW1lIiwiZSIsInQiLCJyIiwiT2JqZWN0IiwicHJvdG90eXBlIiwibiIsImhhc093blByb3BlcnR5IiwibyIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJpIiwiU3ltYm9sIiwiYSIsIml0ZXJhdG9yIiwiYyIsImFzeW5jSXRlcmF0b3IiLCJ1IiwidG9TdHJpbmdUYWciLCJkZWZpbmUiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ3cmFwIiwiR2VuZXJhdG9yIiwiY3JlYXRlIiwiQ29udGV4dCIsIm1ha2VJbnZva2VNZXRob2QiLCJ0cnlDYXRjaCIsInR5cGUiLCJhcmciLCJjYWxsIiwiaCIsImwiLCJmIiwicyIsInkiLCJHZW5lcmF0b3JGdW5jdGlvbiIsIkdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlIiwicCIsImQiLCJnZXRQcm90b3R5cGVPZiIsInYiLCJ2YWx1ZXMiLCJnIiwiZGVmaW5lSXRlcmF0b3JNZXRob2RzIiwiZm9yRWFjaCIsIl9pbnZva2UiLCJBc3luY0l0ZXJhdG9yIiwiaW52b2tlIiwiX3R5cGVvZiIsInJlc29sdmUiLCJfX2F3YWl0IiwidGhlbiIsImNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnIiwiRXJyb3IiLCJkb25lIiwibWV0aG9kIiwiZGVsZWdhdGUiLCJtYXliZUludm9rZURlbGVnYXRlIiwic2VudCIsIl9zZW50IiwiZGlzcGF0Y2hFeGNlcHRpb24iLCJhYnJ1cHQiLCJUeXBlRXJyb3IiLCJyZXN1bHROYW1lIiwibmV4dCIsIm5leHRMb2MiLCJwdXNoVHJ5RW50cnkiLCJ0cnlMb2MiLCJjYXRjaExvYyIsImZpbmFsbHlMb2MiLCJhZnRlckxvYyIsInRyeUVudHJpZXMiLCJwdXNoIiwicmVzZXRUcnlFbnRyeSIsImNvbXBsZXRpb24iLCJyZXNldCIsImlzTmFOIiwibGVuZ3RoIiwiZGlzcGxheU5hbWUiLCJpc0dlbmVyYXRvckZ1bmN0aW9uIiwiY29uc3RydWN0b3IiLCJuYW1lIiwibWFyayIsInNldFByb3RvdHlwZU9mIiwiX19wcm90b19fIiwiYXdyYXAiLCJhc3luYyIsIlByb21pc2UiLCJrZXlzIiwicmV2ZXJzZSIsInBvcCIsInByZXYiLCJjaGFyQXQiLCJzbGljZSIsInN0b3AiLCJydmFsIiwiaGFuZGxlIiwiY29tcGxldGUiLCJmaW5pc2giLCJfY2F0Y2giLCJkZWxlZ2F0ZVlpZWxkIiwiYXN5bmNHZW5lcmF0b3JTdGVwIiwiZ2VuIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJpbmZvIiwiZXJyb3IiLCJfYXN5bmNUb0dlbmVyYXRvciIsImZuIiwic2VsZiIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsImVyciIsInVuZGVmaW5lZCIsIl9jbGFzc0NhbGxDaGVjayIsImluc3RhbmNlIiwiQ29uc3RydWN0b3IiLCJfZGVmaW5lUHJvcGVydGllcyIsInRhcmdldCIsInByb3BzIiwiZGVzY3JpcHRvciIsIl90b1Byb3BlcnR5S2V5IiwiX2NyZWF0ZUNsYXNzIiwicHJvdG9Qcm9wcyIsInN0YXRpY1Byb3BzIiwiX3RvUHJpbWl0aXZlIiwidG9QcmltaXRpdmUiLCJTdHJpbmciLCJOdW1iZXIiLCJQYXRjaCIsInJlcXVpcmUiLCJSZWxlYXNlQnJhbmNoIiwiU2ltVmVyc2lvbiIsImNoZWNrb3V0RGVwZW5kZW5jaWVzIiwiZ2V0RGVwZW5kZW5jaWVzIiwiZ2l0Q2hlY2tvdXQiLCJnaXRQdWxsIiwiZ2l0aHViQ3JlYXRlSXNzdWUiLCJhc3NlcnQiLCJtb2R1bGUiLCJleHBvcnRzIiwiTW9kaWZpZWRCcmFuY2giLCJyZWxlYXNlQnJhbmNoIiwiY2hhbmdlZERlcGVuZGVuY2llcyIsIm5lZWRlZFBhdGNoZXMiLCJwZW5kaW5nTWVzc2FnZXMiLCJwdXNoZWRNZXNzYWdlcyIsImRlcGxveWVkVmVyc2lvbiIsIkFycmF5IiwiaXNBcnJheSIsInBhdGNoIiwibWVzc2FnZSIsInJlcG8iLCJicmFuY2giLCJicmFuZHMiLCJzZXJpYWxpemUiLCJtYXAiLCJnZXQiLCJ0ZXN0VHlwZSIsImNvbmNhdCIsIl9jcmVhdGVVbnJlbGVhc2VkSXNzdWUiLCJfY2FsbGVlIiwiYWRkaXRpb25hbE5vdGVzIiwiX2FyZ3MiLCJfY2FsbGVlJCIsIl9jb250ZXh0IiwibGFiZWxzIiwiYm9keSIsImpvaW4iLCJjcmVhdGVVbnJlbGVhc2VkSXNzdWUiLCJfZ2V0RGVwbG95ZWRMaW5rTGluZXMiLCJfY2FsbGVlMiIsIl90aGlzIiwiaW5jbHVkZU1lc3NhZ2VzIiwibGlua1N1ZmZpeGVzIiwidmVyc2lvblN0cmluZyIsInN0YW5kYWxvbmVQYXJhbXMiLCJwcm94aWVzUGFyYW1zIiwic3R1ZGlvTmFtZSIsInN0dWRpb05hbWVCZWF1dGlmaWVkIiwidXNlc0NoaXBwZXIyIiwicGhldEZvbGRlciIsInBoZXRpb0ZvbGRlciIsInBoZXRTdWZmaXgiLCJwaGV0aW9TdWZmaXgiLCJwaGV0aW9CcmFuZFN1ZmZpeCIsInN0dWRpb1BhdGhTdWZmaXgiLCJwaGV0aW9EZXZWZXJzaW9uIiwicmVzdWx0cyIsIl9hcmdzMiIsIl9jYWxsZWUyJCIsIl9jb250ZXh0MiIsInRvU3RyaW5nIiwiZ2V0UGhldGlvU3RhbmRhbG9uZVF1ZXJ5UGFyYW1ldGVyIiwidXNlc1JlbGF0aXZlU2ltUGF0aCIsInQwIiwidDEiLCJpbmNsdWRlcyIsInVzZXNQaGV0aW9TdHVkaW8iLCJ0MiIsInVzZXNQaGV0aW9TdHVkaW9JbmRleCIsInQzIiwic3BsaXQiLCJsaW5rIiwidW5zaGlmdCIsImdldERlcGxveWVkTGlua0xpbmVzIiwiX2NoZWNrb3V0IiwiX2NhbGxlZTMiLCJpbmNsdWRlTnBtVXBkYXRlIiwiZGVwZW5kZW5jaWVzIiwiX2kiLCJfT2JqZWN0JGtleXMiLCJfYXJnczMiLCJfY2FsbGVlMyQiLCJfY29udGV4dDMiLCJzaGEiLCJjaGVja291dCIsImRlc2VyaWFsaXplIiwiX3JlZiIsInBhdGNoZXMiLCJmaW5kIl0sInNvdXJjZXMiOlsiTW9kaWZpZWRCcmFuY2guanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFJlcHJlc2VudHMgYSBtb2RpZmllZCBzaW11bGF0aW9uIHJlbGVhc2UgYnJhbmNoLCB3aXRoIGVpdGhlciBwZW5kaW5nIG9yIGFwcGxpZWQgKGFuZCBub3QgcHVibGlzaGVkKSBjaGFuZ2VzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgUGF0Y2ggPSByZXF1aXJlKCAnLi9QYXRjaCcgKTtcclxuY29uc3QgUmVsZWFzZUJyYW5jaCA9IHJlcXVpcmUoICcuL1JlbGVhc2VCcmFuY2gnICk7XHJcbmNvbnN0IFNpbVZlcnNpb24gPSByZXF1aXJlKCAnLi9TaW1WZXJzaW9uJyApO1xyXG5jb25zdCBjaGVja291dERlcGVuZGVuY2llcyA9IHJlcXVpcmUoICcuL2NoZWNrb3V0RGVwZW5kZW5jaWVzJyApO1xyXG5jb25zdCBnZXREZXBlbmRlbmNpZXMgPSByZXF1aXJlKCAnLi9nZXREZXBlbmRlbmNpZXMnICk7XHJcbmNvbnN0IGdpdENoZWNrb3V0ID0gcmVxdWlyZSggJy4vZ2l0Q2hlY2tvdXQnICk7XHJcbmNvbnN0IGdpdFB1bGwgPSByZXF1aXJlKCAnLi9naXRQdWxsJyApO1xyXG5jb25zdCBnaXRodWJDcmVhdGVJc3N1ZSA9IHJlcXVpcmUoICcuL2dpdGh1YkNyZWF0ZUlzc3VlJyApO1xyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoIGZ1bmN0aW9uKCkge1xyXG5cclxuICBjbGFzcyBNb2RpZmllZEJyYW5jaCB7XHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7UmVsZWFzZUJyYW5jaH0gcmVsZWFzZUJyYW5jaFxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjaGFuZ2VkRGVwZW5kZW5jaWVzXVxyXG4gICAgICogQHBhcmFtIHtBcnJheS48UGF0Y2g+fSBbbmVlZGVkUGF0Y2hlc11cclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IFtwZW5kaW5nTWVzc2FnZXNdXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBbcHVzaGVkTWVzc2FnZXNdXHJcbiAgICAgKiBAcGFyYW0ge1NpbVZlcnNpb258bnVsbH0gW2RlcGxveWVkVmVyc2lvbl1cclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoIHJlbGVhc2VCcmFuY2gsIGNoYW5nZWREZXBlbmRlbmNpZXMgPSB7fSwgbmVlZGVkUGF0Y2hlcyA9IFtdLCBwZW5kaW5nTWVzc2FnZXMgPSBbXSwgcHVzaGVkTWVzc2FnZXMgPSBbXSwgZGVwbG95ZWRWZXJzaW9uID0gbnVsbCApIHtcclxuICAgICAgYXNzZXJ0KCByZWxlYXNlQnJhbmNoIGluc3RhbmNlb2YgUmVsZWFzZUJyYW5jaCApO1xyXG4gICAgICBhc3NlcnQoIHR5cGVvZiBjaGFuZ2VkRGVwZW5kZW5jaWVzID09PSAnb2JqZWN0JyApO1xyXG4gICAgICBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIG5lZWRlZFBhdGNoZXMgKSApO1xyXG4gICAgICBuZWVkZWRQYXRjaGVzLmZvckVhY2goIHBhdGNoID0+IGFzc2VydCggcGF0Y2ggaW5zdGFuY2VvZiBQYXRjaCApICk7XHJcbiAgICAgIGFzc2VydCggQXJyYXkuaXNBcnJheSggcHVzaGVkTWVzc2FnZXMgKSApO1xyXG4gICAgICBwdXNoZWRNZXNzYWdlcy5mb3JFYWNoKCBtZXNzYWdlID0+IGFzc2VydCggdHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnICkgKTtcclxuICAgICAgYXNzZXJ0KCBkZXBsb3llZFZlcnNpb24gPT09IG51bGwgfHwgZGVwbG95ZWRWZXJzaW9uIGluc3RhbmNlb2YgU2ltVmVyc2lvbiApO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7UmVsZWFzZUJyYW5jaH1cclxuICAgICAgdGhpcy5yZWxlYXNlQnJhbmNoID0gcmVsZWFzZUJyYW5jaDtcclxuXHJcbiAgICAgIC8vIEBwdWJsaWMge09iamVjdH0gLSBLZXlzIGFyZSByZXBvIG5hbWVzLCB2YWx1ZXMgYXJlIFNIQXNcclxuICAgICAgdGhpcy5jaGFuZ2VkRGVwZW5kZW5jaWVzID0gY2hhbmdlZERlcGVuZGVuY2llcztcclxuXHJcbiAgICAgIC8vIEBwdWJsaWMge0FycmF5LjxQYXRjaD59XHJcbiAgICAgIHRoaXMubmVlZGVkUGF0Y2hlcyA9IG5lZWRlZFBhdGNoZXM7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtBcnJheS48c3RyaW5nPn0gLSBNZXNzYWdlcyBmcm9tIGFscmVhZHktYXBwbGllZCBwYXRjaGVzIG9yIG90aGVyIGNoYW5nZXMgTk9UIGluY2x1ZGVkIGluIGRlcGVuZGVuY2llcy5qc29uIHlldFxyXG4gICAgICB0aGlzLnBlbmRpbmdNZXNzYWdlcyA9IHBlbmRpbmdNZXNzYWdlcztcclxuXHJcbiAgICAgIC8vIEBwdWJsaWMge0FycmF5LjxzdHJpbmc+fSAtIE1lc3NhZ2VzIGZyb20gYWxyZWFkeS1hcHBsaWVkIHBhdGNoZXMgb3Igb3RoZXIgY2hhbmdlcyB0aGF0IGhhdmUgYmVlbiBpbmNsdWRlZCBpbiBkZXBlbmRlbmNpZXMuanNvblxyXG4gICAgICB0aGlzLnB1c2hlZE1lc3NhZ2VzID0gcHVzaGVkTWVzc2FnZXM7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtzdHJpbmd9XHJcbiAgICAgIHRoaXMucmVwbyA9IHJlbGVhc2VCcmFuY2gucmVwbztcclxuICAgICAgdGhpcy5icmFuY2ggPSByZWxlYXNlQnJhbmNoLmJyYW5jaDtcclxuXHJcbiAgICAgIC8vIEBwdWJsaWMge0FycmF5LjxzdHJpbmc+fVxyXG4gICAgICB0aGlzLmJyYW5kcyA9IHJlbGVhc2VCcmFuY2guYnJhbmRzO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7U2ltVmVyc2lvbnxudWxsfSAtIFRoZSBkZXBsb3llZCB2ZXJzaW9uIGZvciB0aGUgbGF0ZXN0IHBhdGNoZXMgYXBwbGllZC4gV2lsbCBiZSByZXNldCB0byBudWxsIHdoZW5cclxuICAgICAgLy8gdXBkYXRlcyBhcmUgbWFkZS5cclxuICAgICAgdGhpcy5kZXBsb3llZFZlcnNpb24gPSBkZXBsb3llZFZlcnNpb247XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZXJ0IGludG8gYSBwbGFpbiBKUyBvYmplY3QgbWVhbnQgZm9yIEpTT04gc2VyaWFsaXphdGlvbi5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxyXG4gICAgICovXHJcbiAgICBzZXJpYWxpemUoKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVsZWFzZUJyYW5jaDogdGhpcy5yZWxlYXNlQnJhbmNoLnNlcmlhbGl6ZSgpLFxyXG4gICAgICAgIGNoYW5nZWREZXBlbmRlbmNpZXM6IHRoaXMuY2hhbmdlZERlcGVuZGVuY2llcyxcclxuICAgICAgICBuZWVkZWRQYXRjaGVzOiB0aGlzLm5lZWRlZFBhdGNoZXMubWFwKCBwYXRjaCA9PiBwYXRjaC5uYW1lICksXHJcbiAgICAgICAgcGVuZGluZ01lc3NhZ2VzOiB0aGlzLnBlbmRpbmdNZXNzYWdlcyxcclxuICAgICAgICBwdXNoZWRNZXNzYWdlczogdGhpcy5wdXNoZWRNZXNzYWdlcyxcclxuICAgICAgICBkZXBsb3llZFZlcnNpb246IHRoaXMuZGVwbG95ZWRWZXJzaW9uID8gdGhpcy5kZXBsb3llZFZlcnNpb24uc2VyaWFsaXplKCkgOiBudWxsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUYWtlcyBhIHNlcmlhbGl6ZWQgZm9ybSBvZiB0aGUgTW9kaWZpZWRCcmFuY2ggYW5kIHJldHVybnMgYW4gYWN0dWFsIGluc3RhbmNlLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fVxyXG4gICAgICogQHBhcmFtIHtBcnJheS48UGF0Y2g+fSAtIFdlIG9ubHkgd2FudCB0byBzdG9yZSBwYXRjaGVzIGluIG9uZSBsb2NhdGlvbiwgc28gZG9uJ3QgZnVsbHkgc2F2ZSB0aGUgaW5mby5cclxuICAgICAqIEByZXR1cm5zIHtNb2RpZmllZEJyYW5jaH1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGRlc2VyaWFsaXplKCB7IHJlbGVhc2VCcmFuY2gsIGNoYW5nZWREZXBlbmRlbmNpZXMsIG5lZWRlZFBhdGNoZXMsIHBlbmRpbmdNZXNzYWdlcywgcHVzaGVkTWVzc2FnZXMsIGRlcGxveWVkVmVyc2lvbiB9LCBwYXRjaGVzICkge1xyXG4gICAgICByZXR1cm4gbmV3IE1vZGlmaWVkQnJhbmNoKFxyXG4gICAgICAgIFJlbGVhc2VCcmFuY2guZGVzZXJpYWxpemUoIHJlbGVhc2VCcmFuY2ggKSxcclxuICAgICAgICBjaGFuZ2VkRGVwZW5kZW5jaWVzLFxyXG4gICAgICAgIG5lZWRlZFBhdGNoZXMubWFwKCBuYW1lID0+IHBhdGNoZXMuZmluZCggcGF0Y2ggPT4gcGF0Y2gubmFtZSA9PT0gbmFtZSApICksXHJcbiAgICAgICAgcGVuZGluZ01lc3NhZ2VzLFxyXG4gICAgICAgIHB1c2hlZE1lc3NhZ2VzLFxyXG4gICAgICAgIGRlcGxveWVkVmVyc2lvbiA/IFNpbVZlcnNpb24uZGVzZXJpYWxpemUoIGRlcGxveWVkVmVyc2lvbiApIDogbnVsbFxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciB0aGVyZSBpcyBubyBuZWVkIHRvIGtlZXAgYSByZWZlcmVuY2UgdG8gdXMuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGdldCBpc1VudXNlZCgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubmVlZGVkUGF0Y2hlcy5sZW5ndGggPT09IDAgJiZcclxuICAgICAgICAgICAgIE9iamVjdC5rZXlzKCB0aGlzLmNoYW5nZWREZXBlbmRlbmNpZXMgKS5sZW5ndGggPT09IDAgJiZcclxuICAgICAgICAgICAgIHRoaXMucHVzaGVkTWVzc2FnZXMubGVuZ3RoID09PSAwICYmXHJcbiAgICAgICAgICAgICB0aGlzLnBlbmRpbmdNZXNzYWdlcy5sZW5ndGggPT09IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGV0aGVyIGl0IGlzIHNhZmUgdG8gZGVwbG95IGEgcmVsZWFzZSBjYW5kaWRhdGUgZm9yIHRoaXMgYnJhbmNoLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBnZXQgaXNSZWFkeUZvclJlbGVhc2VDYW5kaWRhdGUoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm5lZWRlZFBhdGNoZXMubGVuZ3RoID09PSAwICYmXHJcbiAgICAgICAgICAgICB0aGlzLnB1c2hlZE1lc3NhZ2VzLmxlbmd0aCA+IDAgJiZcclxuICAgICAgICAgICAgIHRoaXMuZGVwbG95ZWRWZXJzaW9uID09PSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciBpdCBpcyBzYWZlIHRvIGRlcGxveSBhIHByb2R1Y3Rpb24gdmVyc2lvbiBmb3IgdGhpcyBicmFuY2guXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGdldCBpc1JlYWR5Rm9yUHJvZHVjdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubmVlZGVkUGF0Y2hlcy5sZW5ndGggPT09IDAgJiZcclxuICAgICAgICAgICAgIHRoaXMucHVzaGVkTWVzc2FnZXMubGVuZ3RoID4gMCAmJlxyXG4gICAgICAgICAgICAgdGhpcy5kZXBsb3llZFZlcnNpb24gIT09IG51bGwgJiZcclxuICAgICAgICAgICAgIHRoaXMuZGVwbG95ZWRWZXJzaW9uLnRlc3RUeXBlID09PSAncmMnO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgYnJhbmNoIG5hbWUgdGhhdCBzaG91bGQgYmUgdXNlZCBpbiBkZXBlbmRlbmN5IHJlcG9zaXRvcmllcy5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBnZXQgZGVwZW5kZW5jeUJyYW5jaCgpIHtcclxuICAgICAgcmV0dXJuIGAke3RoaXMucmVwb30tJHt0aGlzLmJyYW5jaH1gO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhbiBpc3N1ZSB0byBub3RlIHRoYXQgdW4tdGVzdGVkIGNoYW5nZXMgd2VyZSBwYXRjaGVkIGludG8gYSBicmFuY2gsIGFuZCBzaG91bGQgYXQgc29tZSBwb2ludCBiZSB0ZXN0ZWQuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFthZGRpdGlvbmFsTm90ZXNdXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGNyZWF0ZVVucmVsZWFzZWRJc3N1ZSggYWRkaXRpb25hbE5vdGVzID0gJycgKSB7XHJcbiAgICAgIGF3YWl0IGdpdGh1YkNyZWF0ZUlzc3VlKCB0aGlzLnJlcG8sIGBNYWludGVuYW5jZSBwYXRjaGVzIGFwcGxpZWQgdG8gYnJhbmNoICR7dGhpcy5icmFuY2h9YCwge1xyXG4gICAgICAgIGxhYmVsczogWyAnc3RhdHVzOnJlYWR5LWZvci1xYScgXSxcclxuICAgICAgICBib2R5OiBgVGhpcyBicmFuY2ggKCR7dGhpcy5icmFuY2h9KSBoYWQgY2hhbmdlcyByZWxhdGVkIHRvIHRoZSBmb2xsb3dpbmcgYXBwbGllZDpcclxuXHJcbiR7dGhpcy5wdXNoZWRNZXNzYWdlcy5tYXAoIG1lc3NhZ2UgPT4gYC0gJHttZXNzYWdlfWAgKS5qb2luKCAnXFxuJyApfVxyXG5cclxuUHJlc3VtYWJseSBvbmUgb3IgbW9yZSBvZiB0aGVzZSBjaGFuZ2VzIGlzIGxpa2VseSB0byBoYXZlIGJlZW4gYXBwbGllZCBhZnRlciB0aGUgbGFzdCBSQyB2ZXJzaW9uLCBhbmQgc2hvdWxkIGJlIHNwb3QtY2hlY2tlZCBieSBRQSBpbiB0aGUgbmV4dCBSQyAob3IgaWYgaXQgd2FzIHJlYWR5IGZvciBhIHByb2R1Y3Rpb24gcmVsZWFzZSwgYW4gYWRkaXRpb25hbCBzcG90LWNoZWNrIFJDIHNob3VsZCBiZSBjcmVhdGVkKS5cclxuJHthZGRpdGlvbmFsTm90ZXMgPyBgXFxuJHthZGRpdGlvbmFsTm90ZXN9YCA6ICcnfWBcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhIGxpc3Qgb2YgZGVwbG95ZWQgbGlua3MgZm9yIHRlc3RpbmcgKGRlcGVuZGluZyBvbiB0aGUgYnJhbmRzIGRlcGxveWVkKS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpbmNsdWRlTWVzc2FnZXNdXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48QXJyYXkuPHN0cmluZz4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZXREZXBsb3llZExpbmtMaW5lcyggaW5jbHVkZU1lc3NhZ2VzID0gdHJ1ZSApIHtcclxuICAgICAgYXNzZXJ0KCB0aGlzLmRlcGxveWVkVmVyc2lvbiAhPT0gbnVsbCApO1xyXG5cclxuICAgICAgY29uc3QgbGlua1N1ZmZpeGVzID0gW107XHJcbiAgICAgIGNvbnN0IHZlcnNpb25TdHJpbmcgPSB0aGlzLmRlcGxveWVkVmVyc2lvbi50b1N0cmluZygpO1xyXG5cclxuICAgICAgY29uc3Qgc3RhbmRhbG9uZVBhcmFtcyA9IGF3YWl0IHRoaXMucmVsZWFzZUJyYW5jaC5nZXRQaGV0aW9TdGFuZGFsb25lUXVlcnlQYXJhbWV0ZXIoKTtcclxuICAgICAgY29uc3QgcHJveGllc1BhcmFtcyA9ICggYXdhaXQgdGhpcy5yZWxlYXNlQnJhbmNoLnVzZXNSZWxhdGl2ZVNpbVBhdGgoKSApID8gJ3JlbGF0aXZlU2ltUGF0aCcgOiAnbGF1bmNoTG9jYWxWZXJzaW9uJztcclxuICAgICAgY29uc3Qgc3R1ZGlvTmFtZSA9ICggdGhpcy5icmFuZHMuaW5jbHVkZXMoICdwaGV0LWlvJyApICYmIGF3YWl0IHRoaXMucmVsZWFzZUJyYW5jaC51c2VzUGhldGlvU3R1ZGlvKCkgKSA/ICdzdHVkaW8nIDogJ2luc3RhbmNlLXByb3hpZXMnO1xyXG4gICAgICBjb25zdCBzdHVkaW9OYW1lQmVhdXRpZmllZCA9IHN0dWRpb05hbWUgPT09ICdzdHVkaW8nID8gJ1N0dWRpbycgOiAnSW5zdGFuY2UgUHJveGllcyc7XHJcbiAgICAgIGNvbnN0IHVzZXNDaGlwcGVyMiA9IGF3YWl0IHRoaXMucmVsZWFzZUJyYW5jaC51c2VzQ2hpcHBlcjIoKTtcclxuICAgICAgY29uc3QgcGhldEZvbGRlciA9IHVzZXNDaGlwcGVyMiA/ICcvcGhldCcgOiAnJztcclxuICAgICAgY29uc3QgcGhldGlvRm9sZGVyID0gdXNlc0NoaXBwZXIyID8gJy9waGV0LWlvJyA6ICcnO1xyXG4gICAgICBjb25zdCBwaGV0U3VmZml4ID0gdXNlc0NoaXBwZXIyID8gJ19waGV0JyA6ICcnO1xyXG4gICAgICBjb25zdCBwaGV0aW9TdWZmaXggPSB1c2VzQ2hpcHBlcjIgPyAnX2FsbF9waGV0LWlvJyA6ICdfZW4tcGhldGlvJztcclxuICAgICAgY29uc3QgcGhldGlvQnJhbmRTdWZmaXggPSB1c2VzQ2hpcHBlcjIgPyAnJyA6ICctcGhldGlvJztcclxuICAgICAgY29uc3Qgc3R1ZGlvUGF0aFN1ZmZpeCA9ICggYXdhaXQgdGhpcy5yZWxlYXNlQnJhbmNoLnVzZXNQaGV0aW9TdHVkaW9JbmRleCgpICkgPyAnJyA6IGAvJHtzdHVkaW9OYW1lfS5odG1sP3NpbT0ke3RoaXMucmVwb30mJHtwcm94aWVzUGFyYW1zfWA7XHJcbiAgICAgIGNvbnN0IHBoZXRpb0RldlZlcnNpb24gPSB1c2VzQ2hpcHBlcjIgPyB2ZXJzaW9uU3RyaW5nIDogdmVyc2lvblN0cmluZy5zcGxpdCggJy0nICkuam9pbiggJy1waGV0aW8nICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuZGVwbG95ZWRWZXJzaW9uLnRlc3RUeXBlID09PSAncmMnICkge1xyXG4gICAgICAgIGlmICggdGhpcy5icmFuZHMuaW5jbHVkZXMoICdwaGV0JyApICkge1xyXG4gICAgICAgICAgbGlua1N1ZmZpeGVzLnB1c2goIGBdKGh0dHBzOi8vcGhldC1kZXYuY29sb3JhZG8uZWR1L2h0bWwvJHt0aGlzLnJlcG99LyR7dmVyc2lvblN0cmluZ30ke3BoZXRGb2xkZXJ9LyR7dGhpcy5yZXBvfV9hbGwke3BoZXRTdWZmaXh9Lmh0bWwpYCApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIHRoaXMuYnJhbmRzLmluY2x1ZGVzKCAncGhldC1pbycgKSApIHtcclxuICAgICAgICAgIGxpbmtTdWZmaXhlcy5wdXNoKCBgIHBoZXQtaW9dKGh0dHBzOi8vcGhldC1kZXYuY29sb3JhZG8uZWR1L2h0bWwvJHt0aGlzLnJlcG99LyR7cGhldGlvRGV2VmVyc2lvbn0ke3BoZXRpb0ZvbGRlcn0vJHt0aGlzLnJlcG99JHtwaGV0aW9TdWZmaXh9Lmh0bWw/JHtzdGFuZGFsb25lUGFyYW1zfSlgICk7XHJcbiAgICAgICAgICBsaW5rU3VmZml4ZXMucHVzaCggYCBwaGV0LWlvICR7c3R1ZGlvTmFtZUJlYXV0aWZpZWR9XShodHRwczovL3BoZXQtZGV2LmNvbG9yYWRvLmVkdS9odG1sLyR7dGhpcy5yZXBvfS8ke3BoZXRpb0RldlZlcnNpb259JHtwaGV0aW9Gb2xkZXJ9L3dyYXBwZXJzLyR7c3R1ZGlvTmFtZX0ke3N0dWRpb1BhdGhTdWZmaXh9KWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKCB0aGlzLmJyYW5kcy5pbmNsdWRlcyggJ3BoZXQnICkgKSB7XHJcbiAgICAgICAgICBsaW5rU3VmZml4ZXMucHVzaCggYF0oaHR0cHM6Ly9waGV0LmNvbG9yYWRvLmVkdS9zaW1zL2h0bWwvJHt0aGlzLnJlcG99LyR7dmVyc2lvblN0cmluZ30vJHt0aGlzLnJlcG99X2FsbC5odG1sKWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCB0aGlzLmJyYW5kcy5pbmNsdWRlcyggJ3BoZXQtaW8nICkgKSB7XHJcbiAgICAgICAgICBsaW5rU3VmZml4ZXMucHVzaCggYCBwaGV0LWlvXShodHRwczovL3BoZXQtaW8uY29sb3JhZG8uZWR1L3NpbXMvJHt0aGlzLnJlcG99LyR7dmVyc2lvblN0cmluZ30ke3BoZXRpb0JyYW5kU3VmZml4fS8ke3RoaXMucmVwb30ke3BoZXRpb1N1ZmZpeH0uaHRtbD8ke3N0YW5kYWxvbmVQYXJhbXN9KWAgKTtcclxuICAgICAgICAgIGxpbmtTdWZmaXhlcy5wdXNoKCBgIHBoZXQtaW8gJHtzdHVkaW9OYW1lQmVhdXRpZmllZH1dKGh0dHBzOi8vcGhldC1pby5jb2xvcmFkby5lZHUvc2ltcy8ke3RoaXMucmVwb30vJHt2ZXJzaW9uU3RyaW5nfSR7cGhldGlvQnJhbmRTdWZmaXh9L3dyYXBwZXJzLyR7c3R1ZGlvTmFtZX0ke3N0dWRpb1BhdGhTdWZmaXh9KWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBsaW5rU3VmZml4ZXMubWFwKCBsaW5rID0+IGAtIFsgXSBbJHt0aGlzLnJlcG99ICR7dmVyc2lvblN0cmluZ30ke2xpbmt9YCApO1xyXG4gICAgICBpZiAoIGluY2x1ZGVNZXNzYWdlcyApIHtcclxuICAgICAgICByZXN1bHRzLnVuc2hpZnQoIGBcXG4qKiR7dGhpcy5yZXBvfSAke3RoaXMuYnJhbmNofSoqICgke3RoaXMucHVzaGVkTWVzc2FnZXMuam9pbiggJywgJyApfSlcXG5gICk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVja3Mgb3V0IHRoZSBtb2RpZmllZCBicmFuY2guXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaW5jbHVkZU5wbVVwZGF0ZV1cclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlLjxBcnJheS48c3RyaW5nPj59IC0gTmFtZXMgb2YgY2hlY2tlZCBvdXQgcmVwb3NpdG9yaWVzXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGNoZWNrb3V0KCBpbmNsdWRlTnBtVXBkYXRlID0gdHJ1ZSApIHtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgYXdhaXQgZ2l0UHVsbCggdGhpcy5yZXBvICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggdGhpcy5yZXBvICk7XHJcbiAgICAgIGZvciAoIGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyggdGhpcy5jaGFuZ2VkRGVwZW5kZW5jaWVzICkgKSB7XHJcbiAgICAgICAgLy8gVGhpcyBzaG91bGQgZXhpc3QgaG9wZWZ1bGx5XHJcbiAgICAgICAgZGVwZW5kZW5jaWVzWyBrZXkgXS5zaGEgPSB0aGlzLmNoYW5nZWREZXBlbmRlbmNpZXNbIGtleSBdO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBjaGVja291dERlcGVuZGVuY2llcyggdGhpcy5yZXBvLCBkZXBlbmRlbmNpZXMsIGluY2x1ZGVOcG1VcGRhdGUgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBNb2RpZmllZEJyYW5jaDtcclxufSApKCk7Il0sIm1hcHBpbmdzIjoiOzsrQ0FDQSxxSkFBQUEsbUJBQUEsWUFBQUEsb0JBQUEsV0FBQUMsQ0FBQSxTQUFBQyxDQUFBLEVBQUFELENBQUEsT0FBQUUsQ0FBQSxHQUFBQyxNQUFBLENBQUFDLFNBQUEsRUFBQUMsQ0FBQSxHQUFBSCxD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