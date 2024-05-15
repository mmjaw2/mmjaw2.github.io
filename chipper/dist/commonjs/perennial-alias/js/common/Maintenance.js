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
 * The main persistent state-bearing object for maintenance releases. Can be loaded from or saved to a dedicated file.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var production = require('../grunt/production');
var rc = require('../grunt/rc');
var ChipperVersion = require('./ChipperVersion');
var ModifiedBranch = require('./ModifiedBranch');
var Patch = require('./Patch');
var ReleaseBranch = require('./ReleaseBranch');
var build = require('./build');
var checkoutMain = require('./checkoutMain');
var checkoutTarget = require('./checkoutTarget');
var execute = require('./execute');
var getActiveRepos = require('./getActiveRepos');
var getBranches = require('./getBranches');
var getBranchMap = require('./getBranchMap');
var getDependencies = require('./getDependencies');
var gitAdd = require('./gitAdd');
var gitCheckout = require('./gitCheckout');
var gitCherryPick = require('./gitCherryPick');
var gitCommit = require('./gitCommit');
var gitCreateBranch = require('./gitCreateBranch');
var gitIsClean = require('./gitIsClean');
var gitPull = require('./gitPull');
var gitPush = require('./gitPush');
var gitRevParse = require('./gitRevParse');
var assert = require('assert');
var asyncq = require('async-q'); // eslint-disable-line require-statement-match
var _ = require('lodash');
var fs = require('fs');
var repl = require('repl');
var winston = require('../../../../../../perennial-alias/node_modules/winston');
var gruntCommand = require('./gruntCommand');
var chipperSupportsOutputJSGruntTasks = require('./chipperSupportsOutputJSGruntTasks');

// constants
var MAINTENANCE_FILE = '.maintenance.json';

// const PUBLIC_FUNCTIONS = [
//   'addAllNeededPatches',
//   'addNeededPatch',
//   'addNeededPatches',
//   'addNeededPatchesAfter',
//   'addNeededPatchesBefore',
//   'addNeededPatchesBuildFilter',
//   'addNeededPatchReleaseBranch',
//   'addPatchSHA',
//   'applyPatches',
//   'buildAll',
//   'checkBranchStatus',
//   'checkoutBranch',
//   'createPatch',
//   'deployProduction',
//   'deployReleaseCandidates',
//   'list',
//   'listLinks',
//   'removeNeededPatch',
//   'removeNeededPatches',
//   'removeNeededPatchesAfter',
//   'removeNeededPatchesBefore',
//   'removePatch',
//   'removePatchSHA',
//   'reset',
//   'updateDependencies'
//   'getAllMaintenanceBranches'
// ];

/**
 * @typedef SerializedMaintenance - see Maintenance.serialize()
 * @property {Array.<Object>} patches
 * @property {Array.<Object>} modifiedBranches
 * @property {Array.<Object>} allReleaseBranches
 */

module.exports = function () {
  var Maintenance = /*#__PURE__*/function () {
    /**
     * @public
     * @constructor
     *
     * @param {Array.<Patch>} [patches]
     * @param {Array.<ModifiedBranch>} [modifiedBranches]
     * @param  {Array.<ReleaseBranch>} [allReleaseBranches]
     */
    function Maintenance() {
      var patches = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var modifiedBranches = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      var allReleaseBranches = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      _classCallCheck(this, Maintenance);
      assert(Array.isArray(patches));
      patches.forEach(function (patch) {
        return assert(patch instanceof Patch);
      });
      assert(Array.isArray(modifiedBranches));
      modifiedBranches.forEach(function (branch) {
        return assert(branch instanceof ModifiedBranch);
      });

      // @public {Array.<Patch>}
      this.patches = patches;

      // @public {Array.<ModifiedBranch>}
      this.modifiedBranches = modifiedBranches;

      // @public {Array.<ReleaseBranch>}
      this.allReleaseBranches = allReleaseBranches;
    }

    /**
     * Resets ALL the maintenance state to a default "blank" state.
     * @public
     * @param keepCachedReleaseBranches {boolean} - allReleaseBranches take a while to populate, and have little to do
     *                                              with the current MR, so optionally keep them in storage.
     *
     * CAUTION: This will remove any information about any ongoing/complete maintenance release from your
     * .maintenance.json. Generally this should be done before any new maintenance release.
     */
    return _createClass(Maintenance, [{
      key: "getMaintenanceBranches",
      value: (
      /**
       * The prototype copy of Maintenance.getMaintenanceBranches(), in which we will mutate the class's allReleaseBranches
       * to ensure there is no save/load order dependency problems.
       *
       * @public
       * @param {function(ReleaseBranch):boolean} filterRepo - return false if the ReleaseBranch should be excluded.
       * @param {function} checkUnreleasedBranches - If false, will skip checking for unreleased branches. This checking needs all repos checked out
       * @param {boolean} forceCacheBreak=false - true if you want to force a recalculation of all ReleaseBranches
       * @returns {Promise.<Array.<ReleaseBranch>>}
       * @rejects {ExecuteError}
       */
      function () {
        var _getMaintenanceBranches = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
          var filterRepo,
            checkUnreleasedBranches,
            forceCacheBreak,
            _args = arguments;
          return _regeneratorRuntime().wrap(function _callee$(_context) {
            while (1) switch (_context.prev = _context.next) {
              case 0:
                filterRepo = _args.length > 0 && _args[0] !== undefined ? _args[0] : function () {
                  return true;
                };
                checkUnreleasedBranches = _args.length > 1 && _args[1] !== undefined ? _args[1] : true;
                forceCacheBreak = _args.length > 2 && _args[2] !== undefined ? _args[2] : false;
                return _context.abrupt("return", Maintenance.getMaintenanceBranches(filterRepo, checkUnreleasedBranches, forceCacheBreak, this));
              case 4:
              case "end":
                return _context.stop();
            }
          }, _callee, this);
        }));
        function getMaintenanceBranches() {
          return _getMaintenanceBranches.apply(this, arguments);
        }
        return getMaintenanceBranches;
      }()
      /**
       * @public
       * @param {function(ReleaseBranch):boolean} filterRepo - return false if the ReleaseBranch should be excluded.
       * @param {function} checkUnreleasedBranches - If false, will skip checking for unreleased branches. This checking needs all repos checked out
       * @param {boolean} forceCacheBreak=false - true if you want to force a recalculation of all ReleaseBranches
       @param {Maintenance} maintenance=Maintenance.load() - by default load from saved file the current maintenance instance.
       * @returns {Promise.<Array.<ReleaseBranch>>}
       * @rejects {ExecuteError}
       */
      )
    }, {
      key: "serialize",
      value:
      /**
       * Convert into a plain JS object meant for JSON serialization.
       * @public
       *
       * @returns {SerializedMaintenance} - see Patch.serialize() and ModifiedBranch.serialize()
       */
      function serialize() {
        return {
          patches: this.patches.map(function (patch) {
            return patch.serialize();
          }),
          modifiedBranches: this.modifiedBranches.map(function (modifiedBranch) {
            return modifiedBranch.serialize();
          }),
          allReleaseBranches: this.allReleaseBranches.map(function (releaseBranch) {
            return releaseBranch.serialize();
          })
        };
      }

      /**
       * Takes a serialized form of the Maintenance and returns an actual instance.
       * @public
       *
       * @param {SerializedMaintenance} - see Maintenance.serialize()
       * @returns {Maintenance}
       */
    }, {
      key: "save",
      value:
      /**
       * Saves the state of this object into the maintenance file.
       * @public
       */
      function save() {
        return fs.writeFileSync(MAINTENANCE_FILE, JSON.stringify(this.serialize(), null, 2));
      }

      /**
       * Loads a new Maintenance object (if possible) from the maintenance file.
       * @public
       *
       * @returns {Maintenance}
       */
    }, {
      key: "findPatch",
      value:
      /**
       * Looks up a patch by its name.
       * @public
       *
       * @param {string} patchName
       * @returns {Patch}
       */
      function findPatch(patchName) {
        var patch = this.patches.find(function (p) {
          return p.name === patchName;
        });
        assert(patch, "Patch not found for ".concat(patchName));
        return patch;
      }

      /**
       * Looks up (or adds) a ModifiedBranch by its identifying information.
       * @private
       *
       * @param {string} repo
       * @param {string} branch
       * @param {boolean} [errorIfMissing]
       * @param {Array.<ReleaseBranch>} [releaseBranches] - If provided, it will speed up the process
       * @returns {Promise.<ModifiedBranch>}
       */
    }, {
      key: "ensureModifiedBranch",
      value: (function () {
        var _ensureModifiedBranch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(repo, branch) {
          var errorIfMissing,
            releaseBranches,
            modifiedBranch,
            releaseBranch,
            _args2 = arguments;
          return _regeneratorRuntime().wrap(function _callee2$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                errorIfMissing = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : false;
                releaseBranches = _args2.length > 3 && _args2[3] !== undefined ? _args2[3] : null;
                modifiedBranch = this.modifiedBranches.find(function (modifiedBranch) {
                  return modifiedBranch.repo === repo && modifiedBranch.branch === branch;
                });
                if (modifiedBranch) {
                  _context2.next = 16;
                  break;
                }
                if (!errorIfMissing) {
                  _context2.next = 6;
                  break;
                }
                throw new Error("Could not find a tracked modified branch for ".concat(repo, " ").concat(branch));
              case 6:
                _context2.t0 = releaseBranches;
                if (_context2.t0) {
                  _context2.next = 11;
                  break;
                }
                _context2.next = 10;
                return this.getMaintenanceBranches(function (releaseBranch) {
                  return releaseBranch.repo === repo;
                });
              case 10:
                _context2.t0 = _context2.sent;
              case 11:
                releaseBranches = _context2.t0;
                releaseBranch = releaseBranches.find(function (release) {
                  return release.repo === repo && release.branch === branch;
                });
                assert(releaseBranch, "Could not find a release branch for repo=".concat(repo, " branch=").concat(branch));
                modifiedBranch = new ModifiedBranch(releaseBranch);

                // If we are creating it, add it to our list.
                this.modifiedBranches.push(modifiedBranch);
              case 16:
                return _context2.abrupt("return", modifiedBranch);
              case 17:
              case "end":
                return _context2.stop();
            }
          }, _callee2, this);
        }));
        function ensureModifiedBranch(_x, _x2) {
          return _ensureModifiedBranch.apply(this, arguments);
        }
        return ensureModifiedBranch;
      }()
      /**
       * Attempts to remove a modified branch (if it doesn't need to be kept around).
       * @public
       *
       * @param {ModifiedBranch} modifiedBranch
       */
      )
    }, {
      key: "tryRemovingModifiedBranch",
      value: function tryRemovingModifiedBranch(modifiedBranch) {
        if (modifiedBranch.isUnused) {
          var index = this.modifiedBranches.indexOf(modifiedBranch);
          assert(index >= 0);
          this.modifiedBranches.splice(index, 1);
        }
      }
    }], [{
      key: "reset",
      value: function reset() {
        var keepCachedReleaseBranches = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        console.log('Make sure to check on the active PhET-iO Deploy Status on phet.colorado.edu to ensure that the ' + 'right PhET-iO sims are included in this maintenance release.');
        var allReleaseBranches = [];
        if (keepCachedReleaseBranches) {
          var maintenance = Maintenance.load();
          allReleaseBranches.push.apply(allReleaseBranches, _toConsumableArray(maintenance.allReleaseBranches));
        }
        new Maintenance([], [], allReleaseBranches).save();
      }

      /**
       * Runs a number of checks through every release branch.
       * @public
       *
       * @param {function(ReleaseBranch):Promise.<boolean>} [filter] - Optional filter, release branches will be skipped
       *                                                               if this resolves to false
       * @returns {Promise}
       */
    }, {
      key: "checkBranchStatus",
      value: (function () {
        var _checkBranchStatus = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(filter) {
          var _iterator, _step, repo, releaseBranches, branchMaps, getBranchMapAsyncCallback, _iterator2, _step2, releaseBranch, _iterator3, _step3, line;
          return _regeneratorRuntime().wrap(function _callee4$(_context4) {
            while (1) switch (_context4.prev = _context4.next) {
              case 0:
                _iterator = _createForOfIteratorHelper(getActiveRepos());
                _context4.prev = 1;
                _iterator.s();
              case 3:
                if ((_step = _iterator.n()).done) {
                  _context4.next = 15;
                  break;
                }
                repo = _step.value;
                _context4.t0 = repo !== 'perennial';
                if (!_context4.t0) {
                  _context4.next = 10;
                  break;
                }
                _context4.next = 9;
                return gitIsClean(repo);
              case 9:
                _context4.t0 = !_context4.sent;
              case 10:
                if (!_context4.t0) {
                  _context4.next = 13;
                  break;
                }
                console.log("Unclean repository: ".concat(repo, ", please resolve this and then run checkBranchStatus again"));
                return _context4.abrupt("return");
              case 13:
                _context4.next = 3;
                break;
              case 15:
                _context4.next = 20;
                break;
              case 17:
                _context4.prev = 17;
                _context4.t1 = _context4["catch"](1);
                _iterator.e(_context4.t1);
              case 20:
                _context4.prev = 20;
                _iterator.f();
                return _context4.finish(20);
              case 23:
                _context4.next = 25;
                return Maintenance.getMaintenanceBranches(filter);
              case 25:
                releaseBranches = _context4.sent;
                // Set up a cache of branchMaps so that we don't make multiple requests
                branchMaps = {};
                getBranchMapAsyncCallback = /*#__PURE__*/function () {
                  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(repo) {
                    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
                      while (1) switch (_context3.prev = _context3.next) {
                        case 0:
                          if (branchMaps[repo]) {
                            _context3.next = 4;
                            break;
                          }
                          _context3.next = 3;
                          return getBranchMap(repo);
                        case 3:
                          branchMaps[repo] = _context3.sent;
                        case 4:
                          return _context3.abrupt("return", branchMaps[repo]);
                        case 5:
                        case "end":
                          return _context3.stop();
                      }
                    }, _callee3);
                  }));
                  return function getBranchMapAsyncCallback(_x4) {
                    return _ref.apply(this, arguments);
                  };
                }();
                _iterator2 = _createForOfIteratorHelper(releaseBranches);
                _context4.prev = 29;
                _iterator2.s();
              case 31:
                if ((_step2 = _iterator2.n()).done) {
                  _context4.next = 51;
                  break;
                }
                releaseBranch = _step2.value;
                _context4.t2 = !filter;
                if (_context4.t2) {
                  _context4.next = 38;
                  break;
                }
                _context4.next = 37;
                return filter(releaseBranch);
              case 37:
                _context4.t2 = _context4.sent;
              case 38:
                if (!_context4.t2) {
                  _context4.next = 48;
                  break;
                }
                console.log("".concat(releaseBranch.repo, " ").concat(releaseBranch.branch));
                _context4.t3 = _createForOfIteratorHelper;
                _context4.next = 43;
                return releaseBranch.getStatus(getBranchMapAsyncCallback);
              case 43:
                _context4.t4 = _context4.sent;
                _iterator3 = (0, _context4.t3)(_context4.t4);
                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    line = _step3.value;
                    console.log("  ".concat(line));
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }
                _context4.next = 49;
                break;
              case 48:
                console.log("".concat(releaseBranch.repo, " ").concat(releaseBranch.branch, " (skipping due to filter)"));
              case 49:
                _context4.next = 31;
                break;
              case 51:
                _context4.next = 56;
                break;
              case 53:
                _context4.prev = 53;
                _context4.t5 = _context4["catch"](29);
                _iterator2.e(_context4.t5);
              case 56:
                _context4.prev = 56;
                _iterator2.f();
                return _context4.finish(56);
              case 59:
              case "end":
                return _context4.stop();
            }
          }, _callee4, null, [[1, 17, 20, 23], [29, 53, 56, 59]]);
        }));
        function checkBranchStatus(_x3) {
          return _checkBranchStatus.apply(this, arguments);
        }
        return checkBranchStatus;
      }()
      /**
       * Builds all release branches (so that the state of things can be checked). Puts in in perennial/build.
       * @public
       */
      )
    }, {
      key: "buildAll",
      value: (function () {
        var _buildAll = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
          var releaseBranches, failed, _iterator4, _step4, releaseBranch;
          return _regeneratorRuntime().wrap(function _callee5$(_context5) {
            while (1) switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return Maintenance.getMaintenanceBranches();
              case 2:
                releaseBranches = _context5.sent;
                failed = [];
                _iterator4 = _createForOfIteratorHelper(releaseBranches);
                _context5.prev = 5;
                _iterator4.s();
              case 7:
                if ((_step4 = _iterator4.n()).done) {
                  _context5.next = 23;
                  break;
                }
                releaseBranch = _step4.value;
                console.log("building ".concat(releaseBranch.repo, " ").concat(releaseBranch.branch));
                _context5.prev = 10;
                _context5.next = 13;
                return checkoutTarget(releaseBranch.repo, releaseBranch.branch, true);
              case 13:
                _context5.next = 15;
                return build(releaseBranch.repo, {
                  brands: releaseBranch.brands
                });
              case 15:
                throw new Error('UNIMPLEMENTED, copy over');
              case 18:
                _context5.prev = 18;
                _context5.t0 = _context5["catch"](10);
                failed.push("".concat(releaseBranch.repo, " ").concat(releaseBranch.brand));
              case 21:
                _context5.next = 7;
                break;
              case 23:
                _context5.next = 28;
                break;
              case 25:
                _context5.prev = 25;
                _context5.t1 = _context5["catch"](5);
                _iterator4.e(_context5.t1);
              case 28:
                _context5.prev = 28;
                _iterator4.f();
                return _context5.finish(28);
              case 31:
                if (failed.length) {
                  console.log("Failed builds:\n".concat(failed.join('\n')));
                } else {
                  console.log('Builds complete');
                }
              case 32:
              case "end":
                return _context5.stop();
            }
          }, _callee5, null, [[5, 25, 28, 31], [10, 18]]);
        }));
        function buildAll() {
          return _buildAll.apply(this, arguments);
        }
        return buildAll;
      }()
      /**
       * Displays a listing of the current maintenance status.
       * @public
       *
       * @returns {Promise}
       */
      )
    }, {
      key: "list",
      value: (function () {
        var _list = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
          var maintenance, _iterator5, _step5, modifiedBranch, count, _i, _Object$keys, key, _iterator6, _step6, patch, _count, indexAndSpacing, _iterator7, _step7, sha, _iterator8, _step8, _modifiedBranch;
          return _regeneratorRuntime().wrap(function _callee6$(_context6) {
            while (1) switch (_context6.prev = _context6.next) {
              case 0:
                maintenance = Maintenance.load(); // At the top so that the important items are right above your cursor after calling the function
                if (maintenance.allReleaseBranches.length > 0) {
                  console.log("Total recognized ReleaseBranches: ".concat(maintenance.allReleaseBranches.length));
                }
                console.log('\nRelease Branches in MR:', maintenance.patches.length === 0 ? 'None' : '');
                _iterator5 = _createForOfIteratorHelper(maintenance.modifiedBranches);
                try {
                  for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                    modifiedBranch = _step5.value;
                    count = maintenance.modifiedBranches.indexOf(modifiedBranch) + 1;
                    console.log("".concat(count, ". ").concat(modifiedBranch.repo, " ").concat(modifiedBranch.branch, " ").concat(modifiedBranch.brands.join(',')).concat(modifiedBranch.releaseBranch.isReleased ? '' : ' (unreleased)'));
                    if (modifiedBranch.deployedVersion) {
                      console.log("    deployed: ".concat(modifiedBranch.deployedVersion.toString()));
                    }
                    if (modifiedBranch.neededPatches.length) {
                      console.log("    needs: ".concat(modifiedBranch.neededPatches.map(function (patch) {
                        return patch.name;
                      }).join(',')));
                    }
                    if (modifiedBranch.pushedMessages.length) {
                      console.log("    pushedMessages: \n      ".concat(modifiedBranch.pushedMessages.join('\n      ')));
                    }
                    if (modifiedBranch.pendingMessages.length) {
                      console.log("    pendingMessages: \n      ".concat(modifiedBranch.pendingMessages.join('\n      ')));
                    }
                    if (Object.keys(modifiedBranch.changedDependencies).length > 0) {
                      console.log('    deps:');
                      for (_i = 0, _Object$keys = Object.keys(modifiedBranch.changedDependencies); _i < _Object$keys.length; _i++) {
                        key = _Object$keys[_i];
                        console.log("      ".concat(key, ": ").concat(modifiedBranch.changedDependencies[key]));
                      }
                    }
                  }
                } catch (err) {
                  _iterator5.e(err);
                } finally {
                  _iterator5.f();
                }
                console.log('\nMaintenance Patches in MR:', maintenance.patches.length === 0 ? 'None' : '');
                _iterator6 = _createForOfIteratorHelper(maintenance.patches);
                try {
                  for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                    patch = _step6.value;
                    _count = maintenance.patches.indexOf(patch) + 1;
                    indexAndSpacing = "".concat(_count, ". ") + (_count > 9 ? '' : ' ');
                    console.log("".concat(indexAndSpacing, "[").concat(patch.name, "]").concat(patch.name !== patch.repo ? " (".concat(patch.repo, ")") : '', " ").concat(patch.message));
                    _iterator7 = _createForOfIteratorHelper(patch.shas);
                    try {
                      for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                        sha = _step7.value;
                        console.log("      ".concat(sha));
                      }
                    } catch (err) {
                      _iterator7.e(err);
                    } finally {
                      _iterator7.f();
                    }
                    _iterator8 = _createForOfIteratorHelper(maintenance.modifiedBranches);
                    try {
                      for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                        _modifiedBranch = _step8.value;
                        if (_modifiedBranch.neededPatches.includes(patch)) {
                          console.log("        ".concat(_modifiedBranch.repo, " ").concat(_modifiedBranch.branch, " ").concat(_modifiedBranch.brands.join(',')));
                        }
                      }
                    } catch (err) {
                      _iterator8.e(err);
                    } finally {
                      _iterator8.f();
                    }
                  }
                } catch (err) {
                  _iterator6.e(err);
                } finally {
                  _iterator6.f();
                }
              case 8:
              case "end":
                return _context6.stop();
            }
          }, _callee6);
        }));
        function list() {
          return _list.apply(this, arguments);
        }
        return list;
      }()
      /**
       * Shows any required testing links for the simulations.
       * @public
       *
       * @param {function(ModifiedBranch):boolean} [filter] - Control which branches are shown
       */
      )
    }, {
      key: "listLinks",
      value: (function () {
        var _listLinks = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7() {
          var filter,
            maintenance,
            deployedBranches,
            productionBranches,
            releaseCandidateBranches,
            _iterator9,
            _step9,
            modifiedBranch,
            links,
            _iterator10,
            _step10,
            link,
            _iterator11,
            _step11,
            _modifiedBranch2,
            _links,
            _iterator12,
            _step12,
            _link,
            _args7 = arguments;
          return _regeneratorRuntime().wrap(function _callee7$(_context7) {
            while (1) switch (_context7.prev = _context7.next) {
              case 0:
                filter = _args7.length > 0 && _args7[0] !== undefined ? _args7[0] : function () {
                  return true;
                };
                maintenance = Maintenance.load();
                deployedBranches = maintenance.modifiedBranches.filter(function (modifiedBranch) {
                  return !!modifiedBranch.deployedVersion && filter(modifiedBranch);
                });
                productionBranches = deployedBranches.filter(function (modifiedBranch) {
                  return modifiedBranch.deployedVersion.testType === null;
                });
                releaseCandidateBranches = deployedBranches.filter(function (modifiedBranch) {
                  return modifiedBranch.deployedVersion.testType === 'rc';
                });
                if (!productionBranches.length) {
                  _context7.next = 27;
                  break;
                }
                console.log('\nProduction links\n');
                _iterator9 = _createForOfIteratorHelper(productionBranches);
                _context7.prev = 8;
                _iterator9.s();
              case 10:
                if ((_step9 = _iterator9.n()).done) {
                  _context7.next = 19;
                  break;
                }
                modifiedBranch = _step9.value;
                _context7.next = 14;
                return modifiedBranch.getDeployedLinkLines();
              case 14:
                links = _context7.sent;
                _iterator10 = _createForOfIteratorHelper(links);
                try {
                  for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
                    link = _step10.value;
                    console.log(link);
                  }
                } catch (err) {
                  _iterator10.e(err);
                } finally {
                  _iterator10.f();
                }
              case 17:
                _context7.next = 10;
                break;
              case 19:
                _context7.next = 24;
                break;
              case 21:
                _context7.prev = 21;
                _context7.t0 = _context7["catch"](8);
                _iterator9.e(_context7.t0);
              case 24:
                _context7.prev = 24;
                _iterator9.f();
                return _context7.finish(24);
              case 27:
                if (!releaseCandidateBranches.length) {
                  _context7.next = 49;
                  break;
                }
                console.log('\nRelease Candidate links\n');
                _iterator11 = _createForOfIteratorHelper(releaseCandidateBranches);
                _context7.prev = 30;
                _iterator11.s();
              case 32:
                if ((_step11 = _iterator11.n()).done) {
                  _context7.next = 41;
                  break;
                }
                _modifiedBranch2 = _step11.value;
                _context7.next = 36;
                return _modifiedBranch2.getDeployedLinkLines();
              case 36:
                _links = _context7.sent;
                _iterator12 = _createForOfIteratorHelper(_links);
                try {
                  for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
                    _link = _step12.value;
                    console.log(_link);
                  }
                } catch (err) {
                  _iterator12.e(err);
                } finally {
                  _iterator12.f();
                }
              case 39:
                _context7.next = 32;
                break;
              case 41:
                _context7.next = 46;
                break;
              case 43:
                _context7.prev = 43;
                _context7.t1 = _context7["catch"](30);
                _iterator11.e(_context7.t1);
              case 46:
                _context7.prev = 46;
                _iterator11.f();
                return _context7.finish(46);
              case 49:
              case "end":
                return _context7.stop();
            }
          }, _callee7, null, [[8, 21, 24, 27], [30, 43, 46, 49]]);
        }));
        function listLinks() {
          return _listLinks.apply(this, arguments);
        }
        return listLinks;
      }()
      /**
       * Creates an issue to note patches on all unreleased branches that include a pushed message.
       * @public
       *
       * @param {string} [additionalNotes]
       */
      )
    }, {
      key: "createUnreleasedIssues",
      value: (function () {
        var _createUnreleasedIssues = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8() {
          var additionalNotes,
            maintenance,
            _iterator13,
            _step13,
            modifiedBranch,
            _args8 = arguments;
          return _regeneratorRuntime().wrap(function _callee8$(_context8) {
            while (1) switch (_context8.prev = _context8.next) {
              case 0:
                additionalNotes = _args8.length > 0 && _args8[0] !== undefined ? _args8[0] : '';
                maintenance = Maintenance.load();
                _iterator13 = _createForOfIteratorHelper(maintenance.modifiedBranches);
                _context8.prev = 3;
                _iterator13.s();
              case 5:
                if ((_step13 = _iterator13.n()).done) {
                  _context8.next = 13;
                  break;
                }
                modifiedBranch = _step13.value;
                if (!(!modifiedBranch.releaseBranch.isReleased && modifiedBranch.pushedMessages.length > 0)) {
                  _context8.next = 11;
                  break;
                }
                console.log("Creating issue for ".concat(modifiedBranch.releaseBranch.toString()));
                _context8.next = 11;
                return modifiedBranch.createUnreleasedIssue(additionalNotes);
              case 11:
                _context8.next = 5;
                break;
              case 13:
                _context8.next = 18;
                break;
              case 15:
                _context8.prev = 15;
                _context8.t0 = _context8["catch"](3);
                _iterator13.e(_context8.t0);
              case 18:
                _context8.prev = 18;
                _iterator13.f();
                return _context8.finish(18);
              case 21:
                console.log('Finished creating unreleased issues');
              case 22:
              case "end":
                return _context8.stop();
            }
          }, _callee8, null, [[3, 15, 18, 21]]);
        }));
        function createUnreleasedIssues() {
          return _createUnreleasedIssues.apply(this, arguments);
        }
        return createUnreleasedIssues;
      }()
      /**
       * Creates a patch
       * @public
       *
       * @param {string} repo
       * @param {string} message
       * @param {string} [patchName] - If no name is provided, the repo string will be used.
       * @returns {Promise}
       */
      )
    }, {
      key: "createPatch",
      value: (function () {
        var _createPatch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9(repo, message, patchName) {
          var maintenance, _iterator14, _step14, patch;
          return _regeneratorRuntime().wrap(function _callee9$(_context9) {
            while (1) switch (_context9.prev = _context9.next) {
              case 0:
                maintenance = Maintenance.load();
                patchName = patchName || repo;
                _iterator14 = _createForOfIteratorHelper(maintenance.patches);
                _context9.prev = 3;
                _iterator14.s();
              case 5:
                if ((_step14 = _iterator14.n()).done) {
                  _context9.next = 11;
                  break;
                }
                patch = _step14.value;
                if (!(patch.name === patchName)) {
                  _context9.next = 9;
                  break;
                }
                throw new Error('Multiple patches with the same name are not concurrently supported');
              case 9:
                _context9.next = 5;
                break;
              case 11:
                _context9.next = 16;
                break;
              case 13:
                _context9.prev = 13;
                _context9.t0 = _context9["catch"](3);
                _iterator14.e(_context9.t0);
              case 16:
                _context9.prev = 16;
                _iterator14.f();
                return _context9.finish(16);
              case 19:
                maintenance.patches.push(new Patch(repo, patchName, message));
                maintenance.save();
                console.log("Created patch for ".concat(repo, " with message: ").concat(message));
              case 22:
              case "end":
                return _context9.stop();
            }
          }, _callee9, null, [[3, 13, 16, 19]]);
        }));
        function createPatch(_x5, _x6, _x7) {
          return _createPatch.apply(this, arguments);
        }
        return createPatch;
      }()
      /**
       * Removes a patch
       * @public
       *
       * @param {string} patchName
       * @returns {Promise}
       */
      )
    }, {
      key: "removePatch",
      value: (function () {
        var _removePatch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10(patchName) {
          var maintenance, patch, _iterator15, _step15, branch;
          return _regeneratorRuntime().wrap(function _callee10$(_context10) {
            while (1) switch (_context10.prev = _context10.next) {
              case 0:
                maintenance = Maintenance.load();
                patch = maintenance.findPatch(patchName);
                _iterator15 = _createForOfIteratorHelper(maintenance.modifiedBranches);
                _context10.prev = 3;
                _iterator15.s();
              case 5:
                if ((_step15 = _iterator15.n()).done) {
                  _context10.next = 11;
                  break;
                }
                branch = _step15.value;
                if (!branch.neededPatches.includes(patch)) {
                  _context10.next = 9;
                  break;
                }
                throw new Error('Patch is marked as needed by at least one branch');
              case 9:
                _context10.next = 5;
                break;
              case 11:
                _context10.next = 16;
                break;
              case 13:
                _context10.prev = 13;
                _context10.t0 = _context10["catch"](3);
                _iterator15.e(_context10.t0);
              case 16:
                _context10.prev = 16;
                _iterator15.f();
                return _context10.finish(16);
              case 19:
                maintenance.patches.splice(maintenance.patches.indexOf(patch), 1);
                maintenance.save();
                console.log("Removed patch for ".concat(patchName));
              case 22:
              case "end":
                return _context10.stop();
            }
          }, _callee10, null, [[3, 13, 16, 19]]);
        }));
        function removePatch(_x8) {
          return _removePatch.apply(this, arguments);
        }
        return removePatch;
      }()
      /**
       * Adds a particular SHA (to cherry-pick) to a patch.
       * @public
       *
       * @param {string} patchName
       * @param {string} [sha]
       * @returns {Promise}
       */
      )
    }, {
      key: "addPatchSHA",
      value: (function () {
        var _addPatchSHA = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11(patchName, sha) {
          var maintenance, patch;
          return _regeneratorRuntime().wrap(function _callee11$(_context11) {
            while (1) switch (_context11.prev = _context11.next) {
              case 0:
                maintenance = Maintenance.load();
                patch = maintenance.findPatch(patchName);
                if (sha) {
                  _context11.next = 7;
                  break;
                }
                _context11.next = 5;
                return gitRevParse(patch.repo, 'HEAD');
              case 5:
                sha = _context11.sent;
                console.log("SHA not provided, detecting SHA: ".concat(sha));
              case 7:
                patch.shas.push(sha);
                maintenance.save();
                console.log("Added SHA ".concat(sha, " to patch ").concat(patchName));
              case 10:
              case "end":
                return _context11.stop();
            }
          }, _callee11);
        }));
        function addPatchSHA(_x9, _x10) {
          return _addPatchSHA.apply(this, arguments);
        }
        return addPatchSHA;
      }()
      /**
       * Removes a particular SHA (to cherry-pick) from a patch.
       * @public
       *
       * @param {string} patchName
       * @param {string} sha
       * @returns {Promise}
       */
      )
    }, {
      key: "removePatchSHA",
      value: (function () {
        var _removePatchSHA = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee12(patchName, sha) {
          var maintenance, patch, index;
          return _regeneratorRuntime().wrap(function _callee12$(_context12) {
            while (1) switch (_context12.prev = _context12.next) {
              case 0:
                maintenance = Maintenance.load();
                patch = maintenance.findPatch(patchName);
                index = patch.shas.indexOf(sha);
                assert(index >= 0, 'SHA not found');
                patch.shas.splice(index, 1);
                maintenance.save();
                console.log("Removed SHA ".concat(sha, " from patch ").concat(patchName));
              case 7:
              case "end":
                return _context12.stop();
            }
          }, _callee12);
        }));
        function removePatchSHA(_x11, _x12) {
          return _removePatchSHA.apply(this, arguments);
        }
        return removePatchSHA;
      }()
      /**
       * Removes all patch SHAs for a particular patch.
       * @public
       *
       * @param {string} patchName
       * @returns {Promise}
       */
      )
    }, {
      key: "removeAllPatchSHAs",
      value: (function () {
        var _removeAllPatchSHAs = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee13(patchName) {
          var maintenance, patch, _iterator16, _step16, sha;
          return _regeneratorRuntime().wrap(function _callee13$(_context13) {
            while (1) switch (_context13.prev = _context13.next) {
              case 0:
                maintenance = Maintenance.load();
                patch = maintenance.findPatch(patchName);
                _iterator16 = _createForOfIteratorHelper(patch.shas);
                try {
                  for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
                    sha = _step16.value;
                    console.log("Removing SHA ".concat(sha, " from patch ").concat(patchName));
                  }
                } catch (err) {
                  _iterator16.e(err);
                } finally {
                  _iterator16.f();
                }
                patch.shas = [];
                maintenance.save();
              case 6:
              case "end":
                return _context13.stop();
            }
          }, _callee13);
        }));
        function removeAllPatchSHAs(_x13) {
          return _removeAllPatchSHAs.apply(this, arguments);
        }
        return removeAllPatchSHAs;
      }()
      /**
       * Adds a needed patch to a given modified branch.
       * @public
       *
       * @param {string} repo
       * @param {string} branch
       * @param {string} patchName
       */
      )
    }, {
      key: "addNeededPatch",
      value: (function () {
        var _addNeededPatch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee14(repo, branch, patchName) {
          var maintenance, patch, modifiedBranch;
          return _regeneratorRuntime().wrap(function _callee14$(_context14) {
            while (1) switch (_context14.prev = _context14.next) {
              case 0:
                maintenance = Maintenance.load();
                patch = maintenance.findPatch(patchName);
                _context14.next = 4;
                return maintenance.ensureModifiedBranch(repo, branch);
              case 4:
                modifiedBranch = _context14.sent;
                modifiedBranch.neededPatches.push(patch);
                maintenance.save();
                console.log("Added patch ".concat(patchName, " as needed for ").concat(repo, " ").concat(branch));
              case 8:
              case "end":
                return _context14.stop();
            }
          }, _callee14);
        }));
        function addNeededPatch(_x14, _x15, _x16) {
          return _addNeededPatch.apply(this, arguments);
        }
        return addNeededPatch;
      }()
      /**
       * Adds a needed patch to a given release branch
       * @public
       *
       * @param {ReleaseBranch} releaseBranch
       * @param {string} patchName
       */
      )
    }, {
      key: "addNeededPatchReleaseBranch",
      value: (function () {
        var _addNeededPatchReleaseBranch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee15(releaseBranch, patchName) {
          var maintenance, patch, modifiedBranch;
          return _regeneratorRuntime().wrap(function _callee15$(_context15) {
            while (1) switch (_context15.prev = _context15.next) {
              case 0:
                maintenance = Maintenance.load();
                patch = maintenance.findPatch(patchName);
                modifiedBranch = new ModifiedBranch(releaseBranch);
                maintenance.modifiedBranches.push(modifiedBranch);
                modifiedBranch.neededPatches.push(patch);
                maintenance.save();
                console.log("Added patch ".concat(patchName, " as needed for ").concat(releaseBranch.repo, " ").concat(releaseBranch.branch));
              case 7:
              case "end":
                return _context15.stop();
            }
          }, _callee15);
        }));
        function addNeededPatchReleaseBranch(_x17, _x18) {
          return _addNeededPatchReleaseBranch.apply(this, arguments);
        }
        return addNeededPatchReleaseBranch;
      }()
      /**
       * Adds a needed patch to whatever subset of release branches match the filter.
       * @public
       *
       * @param {string} patchName
       * @param {function(ReleaseBranch):Promise.<boolean>} filter
       */
      )
    }, {
      key: "addNeededPatches",
      value: (function () {
        var _addNeededPatches = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee16(patchName, filter) {
          var releaseBranches, maintenance, patch, count, _iterator17, _step17, releaseBranch, needsPatch, modifiedBranch;
          return _regeneratorRuntime().wrap(function _callee16$(_context16) {
            while (1) switch (_context16.prev = _context16.next) {
              case 0:
                _context16.next = 2;
                return Maintenance.getMaintenanceBranches();
              case 2:
                releaseBranches = _context16.sent;
                maintenance = Maintenance.load();
                patch = maintenance.findPatch(patchName);
                count = 0;
                _iterator17 = _createForOfIteratorHelper(releaseBranches);
                _context16.prev = 7;
                _iterator17.s();
              case 9:
                if ((_step17 = _iterator17.n()).done) {
                  _context16.next = 23;
                  break;
                }
                releaseBranch = _step17.value;
                _context16.next = 13;
                return filter(releaseBranch);
              case 13:
                needsPatch = _context16.sent;
                if (needsPatch) {
                  _context16.next = 17;
                  break;
                }
                console.log("  skipping ".concat(releaseBranch.repo, " ").concat(releaseBranch.branch));
                return _context16.abrupt("continue", 21);
              case 17:
                _context16.next = 19;
                return maintenance.ensureModifiedBranch(releaseBranch.repo, releaseBranch.branch, false, releaseBranches);
              case 19:
                modifiedBranch = _context16.sent;
                if (!modifiedBranch.neededPatches.includes(patch)) {
                  modifiedBranch.neededPatches.push(patch);
                  console.log("Added needed patch ".concat(patchName, " to ").concat(releaseBranch.repo, " ").concat(releaseBranch.branch));
                  count++;
                  maintenance.save(); // save here in case a future failure would "revert" things
                } else {
                  console.log("Patch ".concat(patchName, " already included in ").concat(releaseBranch.repo, " ").concat(releaseBranch.branch));
                }
              case 21:
                _context16.next = 9;
                break;
              case 23:
                _context16.next = 28;
                break;
              case 25:
                _context16.prev = 25;
                _context16.t0 = _context16["catch"](7);
                _iterator17.e(_context16.t0);
              case 28:
                _context16.prev = 28;
                _iterator17.f();
                return _context16.finish(28);
              case 31:
                console.log("Added ".concat(count, " releaseBranches to patch: ").concat(patchName));
                maintenance.save();
              case 33:
              case "end":
                return _context16.stop();
            }
          }, _callee16, null, [[7, 25, 28, 31]]);
        }));
        function addNeededPatches(_x19, _x20) {
          return _addNeededPatches.apply(this, arguments);
        }
        return addNeededPatches;
      }()
      /**
       * Adds a needed patch to all release branches.
       * @public
       *
       * @param {string} patchName
       */
      )
    }, {
      key: "addAllNeededPatches",
      value: (function () {
        var _addAllNeededPatches = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee18(patchName) {
          return _regeneratorRuntime().wrap(function _callee18$(_context18) {
            while (1) switch (_context18.prev = _context18.next) {
              case 0:
                _context18.next = 2;
                return Maintenance.addNeededPatches(patchName, /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee17() {
                  return _regeneratorRuntime().wrap(function _callee17$(_context17) {
                    while (1) switch (_context17.prev = _context17.next) {
                      case 0:
                        return _context17.abrupt("return", true);
                      case 1:
                      case "end":
                        return _context17.stop();
                    }
                  }, _callee17);
                })));
              case 2:
              case "end":
                return _context18.stop();
            }
          }, _callee18);
        }));
        function addAllNeededPatches(_x21) {
          return _addAllNeededPatches.apply(this, arguments);
        }
        return addAllNeededPatches;
      }()
      /**
       * Adds a needed patch to all release branches that do NOT include the given commit on the repo
       * @public
       *
       * @param {string} patchName
       * @param {string} sha
       */
      )
    }, {
      key: "addNeededPatchesBefore",
      value: (function () {
        var _addNeededPatchesBefore = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee20(patchName, sha) {
          var maintenance, patch;
          return _regeneratorRuntime().wrap(function _callee20$(_context20) {
            while (1) switch (_context20.prev = _context20.next) {
              case 0:
                maintenance = Maintenance.load();
                patch = maintenance.findPatch(patchName);
                _context20.next = 4;
                return Maintenance.addNeededPatches(patchName, /*#__PURE__*/function () {
                  var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee19(releaseBranch) {
                    return _regeneratorRuntime().wrap(function _callee19$(_context19) {
                      while (1) switch (_context19.prev = _context19.next) {
                        case 0:
                          return _context19.abrupt("return", releaseBranch.isMissingSHA(patch.repo, sha));
                        case 1:
                        case "end":
                          return _context19.stop();
                      }
                    }, _callee19);
                  }));
                  return function (_x24) {
                    return _ref3.apply(this, arguments);
                  };
                }());
              case 4:
              case "end":
                return _context20.stop();
            }
          }, _callee20);
        }));
        function addNeededPatchesBefore(_x22, _x23) {
          return _addNeededPatchesBefore.apply(this, arguments);
        }
        return addNeededPatchesBefore;
      }()
      /**
       * Adds a needed patch to all release branches that DO include the given commit on the repo
       * @public
       *
       * @param {string} patchName
       * @param {string} sha
       */
      )
    }, {
      key: "addNeededPatchesAfter",
      value: (function () {
        var _addNeededPatchesAfter = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee22(patchName, sha) {
          var maintenance, patch;
          return _regeneratorRuntime().wrap(function _callee22$(_context22) {
            while (1) switch (_context22.prev = _context22.next) {
              case 0:
                maintenance = Maintenance.load();
                patch = maintenance.findPatch(patchName);
                _context22.next = 4;
                return Maintenance.addNeededPatches(patchName, /*#__PURE__*/function () {
                  var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee21(releaseBranch) {
                    return _regeneratorRuntime().wrap(function _callee21$(_context21) {
                      while (1) switch (_context21.prev = _context21.next) {
                        case 0:
                          return _context21.abrupt("return", releaseBranch.includesSHA(patch.repo, sha));
                        case 1:
                        case "end":
                          return _context21.stop();
                      }
                    }, _callee21);
                  }));
                  return function (_x27) {
                    return _ref4.apply(this, arguments);
                  };
                }());
              case 4:
              case "end":
                return _context22.stop();
            }
          }, _callee22);
        }));
        function addNeededPatchesAfter(_x25, _x26) {
          return _addNeededPatchesAfter.apply(this, arguments);
        }
        return addNeededPatchesAfter;
      }()
      /**
       * Adds a needed patch to all release branches that satisfy the given filter( releaseBranch, builtFileString )
       * where it builds the simulation with the defaults (brand=phet) and provides it as a string.
       * @public
       *
       * @param {string} patchName
       * @param {function(ReleaseBranch, builtFile:string): Promise.<boolean>} filter
       */
      )
    }, {
      key: "addNeededPatchesBuildFilter",
      value: (function () {
        var _addNeededPatchesBuildFilter = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee24(patchName, filter) {
          return _regeneratorRuntime().wrap(function _callee24$(_context24) {
            while (1) switch (_context24.prev = _context24.next) {
              case 0:
                _context24.next = 2;
                return Maintenance.addNeededPatches(patchName, /*#__PURE__*/function () {
                  var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee23(releaseBranch) {
                    var chipperVersion, filename;
                    return _regeneratorRuntime().wrap(function _callee23$(_context23) {
                      while (1) switch (_context23.prev = _context23.next) {
                        case 0:
                          _context23.next = 2;
                          return checkoutTarget(releaseBranch.repo, releaseBranch.branch, true);
                        case 2:
                          _context23.next = 4;
                          return gitPull(releaseBranch.repo);
                        case 4:
                          _context23.next = 6;
                          return build(releaseBranch.repo);
                        case 6:
                          chipperVersion = ChipperVersion.getFromRepository();
                          if (chipperVersion.major !== 0) {
                            filename = "../".concat(releaseBranch.repo, "/build/phet/").concat(releaseBranch.repo, "_en_phet.html");
                          } else {
                            filename = "../".concat(releaseBranch.repo, "/build/").concat(releaseBranch.repo, "_en.html");
                          }
                          return _context23.abrupt("return", filter(releaseBranch, fs.readFileSync(filename, 'utf8')));
                        case 9:
                        case "end":
                          return _context23.stop();
                      }
                    }, _callee23);
                  }));
                  return function (_x30) {
                    return _ref5.apply(this, arguments);
                  };
                }());
              case 2:
              case "end":
                return _context24.stop();
            }
          }, _callee24);
        }));
        function addNeededPatchesBuildFilter(_x28, _x29) {
          return _addNeededPatchesBuildFilter.apply(this, arguments);
        }
        return addNeededPatchesBuildFilter;
      }()
      /**
       * Removes a needed patch from a given modified branch.
       * @public
       *
       * @param {string} repo
       * @param {string} branch
       * @param {string} patchName
       */
      )
    }, {
      key: "removeNeededPatch",
      value: (function () {
        var _removeNeededPatch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee25(repo, branch, patchName) {
          var maintenance, patch, modifiedBranch, index;
          return _regeneratorRuntime().wrap(function _callee25$(_context25) {
            while (1) switch (_context25.prev = _context25.next) {
              case 0:
                maintenance = Maintenance.load();
                patch = maintenance.findPatch(patchName);
                _context25.next = 4;
                return maintenance.ensureModifiedBranch(repo, branch);
              case 4:
                modifiedBranch = _context25.sent;
                index = modifiedBranch.neededPatches.indexOf(patch);
                assert(index >= 0, 'Could not find needed patch on the modified branch');
                modifiedBranch.neededPatches.splice(index, 1);
                maintenance.tryRemovingModifiedBranch(modifiedBranch);
                maintenance.save();
                console.log("Removed patch ".concat(patchName, " from ").concat(repo, " ").concat(branch));
              case 11:
              case "end":
                return _context25.stop();
            }
          }, _callee25);
        }));
        function removeNeededPatch(_x31, _x32, _x33) {
          return _removeNeededPatch.apply(this, arguments);
        }
        return removeNeededPatch;
      }()
      /**
       * Removes a needed patch from whatever subset of (current) release branches match the filter.
       * @public
       *
       * @param {string} patchName
       * @param {function(ReleaseBranch): Promise.<boolean>} filter
       */
      )
    }, {
      key: "removeNeededPatches",
      value: (function () {
        var _removeNeededPatches = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee26(patchName, filter) {
          var maintenance, patch, count, _iterator18, _step18, modifiedBranch, needsRemoval, index;
          return _regeneratorRuntime().wrap(function _callee26$(_context26) {
            while (1) switch (_context26.prev = _context26.next) {
              case 0:
                maintenance = Maintenance.load();
                patch = maintenance.findPatch(patchName);
                count = 0;
                _iterator18 = _createForOfIteratorHelper(maintenance.modifiedBranches);
                _context26.prev = 4;
                _iterator18.s();
              case 6:
                if ((_step18 = _iterator18.n()).done) {
                  _context26.next = 23;
                  break;
                }
                modifiedBranch = _step18.value;
                _context26.next = 10;
                return filter(modifiedBranch.releaseBranch);
              case 10:
                needsRemoval = _context26.sent;
                if (needsRemoval) {
                  _context26.next = 14;
                  break;
                }
                console.log("  skipping ".concat(modifiedBranch.repo, " ").concat(modifiedBranch.branch));
                return _context26.abrupt("continue", 21);
              case 14:
                // Check if there's actually something to remove
                index = modifiedBranch.neededPatches.indexOf(patch);
                if (!(index < 0)) {
                  _context26.next = 17;
                  break;
                }
                return _context26.abrupt("continue", 21);
              case 17:
                modifiedBranch.neededPatches.splice(index, 1);
                maintenance.tryRemovingModifiedBranch(modifiedBranch);
                count++;
                console.log("Removed needed patch ".concat(patchName, " from ").concat(modifiedBranch.repo, " ").concat(modifiedBranch.branch));
              case 21:
                _context26.next = 6;
                break;
              case 23:
                _context26.next = 28;
                break;
              case 25:
                _context26.prev = 25;
                _context26.t0 = _context26["catch"](4);
                _iterator18.e(_context26.t0);
              case 28:
                _context26.prev = 28;
                _iterator18.f();
                return _context26.finish(28);
              case 31:
                console.log("Removed ".concat(count, " releaseBranches from patch: ").concat(patchName));
                maintenance.save();
              case 33:
              case "end":
                return _context26.stop();
            }
          }, _callee26, null, [[4, 25, 28, 31]]);
        }));
        function removeNeededPatches(_x34, _x35) {
          return _removeNeededPatches.apply(this, arguments);
        }
        return removeNeededPatches;
      }()
      /**
       * Removes a needed patch from all release branches that do NOT include the given commit on the repo
       * @public
       *
       * @param {string} patchName
       * @param {string} sha
       */
      )
    }, {
      key: "removeNeededPatchesBefore",
      value: (function () {
        var _removeNeededPatchesBefore = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee28(patchName, sha) {
          var maintenance, patch;
          return _regeneratorRuntime().wrap(function _callee28$(_context28) {
            while (1) switch (_context28.prev = _context28.next) {
              case 0:
                maintenance = Maintenance.load();
                patch = maintenance.findPatch(patchName);
                _context28.next = 4;
                return Maintenance.removeNeededPatches(patchName, /*#__PURE__*/function () {
                  var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee27(releaseBranch) {
                    return _regeneratorRuntime().wrap(function _callee27$(_context27) {
                      while (1) switch (_context27.prev = _context27.next) {
                        case 0:
                          return _context27.abrupt("return", releaseBranch.isMissingSHA(patch.repo, sha));
                        case 1:
                        case "end":
                          return _context27.stop();
                      }
                    }, _callee27);
                  }));
                  return function (_x38) {
                    return _ref6.apply(this, arguments);
                  };
                }());
              case 4:
              case "end":
                return _context28.stop();
            }
          }, _callee28);
        }));
        function removeNeededPatchesBefore(_x36, _x37) {
          return _removeNeededPatchesBefore.apply(this, arguments);
        }
        return removeNeededPatchesBefore;
      }()
      /**
       * Removes a needed patch from all release branches that DO include the given commit on the repo
       * @public
       *
       * @param {string} patchName
       * @param {string} sha
       */
      )
    }, {
      key: "removeNeededPatchesAfter",
      value: (function () {
        var _removeNeededPatchesAfter = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee30(patchName, sha) {
          var maintenance, patch;
          return _regeneratorRuntime().wrap(function _callee30$(_context30) {
            while (1) switch (_context30.prev = _context30.next) {
              case 0:
                maintenance = Maintenance.load();
                patch = maintenance.findPatch(patchName);
                _context30.next = 4;
                return Maintenance.removeNeededPatches(patchName, /*#__PURE__*/function () {
                  var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee29(releaseBranch) {
                    return _regeneratorRuntime().wrap(function _callee29$(_context29) {
                      while (1) switch (_context29.prev = _context29.next) {
                        case 0:
                          return _context29.abrupt("return", releaseBranch.includesSHA(patch.repo, sha));
                        case 1:
                        case "end":
                          return _context29.stop();
                      }
                    }, _callee29);
                  }));
                  return function (_x41) {
                    return _ref7.apply(this, arguments);
                  };
                }());
              case 4:
              case "end":
                return _context30.stop();
            }
          }, _callee30);
        }));
        function removeNeededPatchesAfter(_x39, _x40) {
          return _removeNeededPatchesAfter.apply(this, arguments);
        }
        return removeNeededPatchesAfter;
      }()
      /**
       * Helper for adding patches based on specific patterns, e.g.:
       * Maintenance.addNeededPatches( 'phetmarks', Maintenance.singleFileReleaseBranchFilter( '../phetmarks/js/phetmarks.ts' ), content => content.includes( 'data/wrappers' ) );
       * @public
       *
       * @param {string} file
       * @param {function(string):boolean}
       * @returns {function}
       */
      )
    }, {
      key: "singleFileReleaseBranchFilter",
      value: function singleFileReleaseBranchFilter(file, predicate) {
        return /*#__PURE__*/function () {
          var _ref8 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee31(releaseBranch) {
            var contents;
            return _regeneratorRuntime().wrap(function _callee31$(_context31) {
              while (1) switch (_context31.prev = _context31.next) {
                case 0:
                  _context31.next = 2;
                  return releaseBranch.checkout(false);
                case 2:
                  if (!fs.existsSync(file)) {
                    _context31.next = 5;
                    break;
                  }
                  contents = fs.readFileSync(file, 'utf-8');
                  return _context31.abrupt("return", predicate(contents));
                case 5:
                  return _context31.abrupt("return", false);
                case 6:
                case "end":
                  return _context31.stop();
              }
            }, _callee31);
          }));
          return function (_x42) {
            return _ref8.apply(this, arguments);
          };
        }();
      }

      /**
       * Checks out a specific Release Branch (using local commit data as necessary).
       * @public
       *
       * @param {string} repo
       * @param {string} branch
       * @param {boolean} outputJS=false - if true, once checked out this will also run `grunt output-js-project`
       */
    }, {
      key: "checkoutBranch",
      value: (function () {
        var _checkoutBranch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee32(repo, branch) {
          var outputJS,
            maintenance,
            modifiedBranch,
            _args32 = arguments;
          return _regeneratorRuntime().wrap(function _callee32$(_context32) {
            while (1) switch (_context32.prev = _context32.next) {
              case 0:
                outputJS = _args32.length > 2 && _args32[2] !== undefined ? _args32[2] : false;
                maintenance = Maintenance.load();
                _context32.next = 4;
                return maintenance.ensureModifiedBranch(repo, branch, true);
              case 4:
                modifiedBranch = _context32.sent;
                _context32.next = 7;
                return modifiedBranch.checkout();
              case 7:
                if (!(outputJS && chipperSupportsOutputJSGruntTasks())) {
                  _context32.next = 11;
                  break;
                }
                console.log('Running output-js-project');

                // We might not be able to run this command!
                _context32.next = 11;
                return execute(gruntCommand, ['output-js-project'], "../".concat(repo), {
                  errors: 'resolve'
                });
              case 11:
                // No need to save, shouldn't be changing things
                console.log("Checked out ".concat(repo, " ").concat(branch));
              case 12:
              case "end":
                return _context32.stop();
            }
          }, _callee32);
        }));
        function checkoutBranch(_x43, _x44) {
          return _checkoutBranch.apply(this, arguments);
        }
        return checkoutBranch;
      }()
      /**
       * Attempts to apply patches to the modified branches that are marked as needed.
       * @public
       */
      )
    }, {
      key: "applyPatches",
      value: (function () {
        var _applyPatches = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee33() {
          var maintenance, numApplied, _iterator19, _step19, modifiedBranch, repo, branch, _iterator20, _step20, patch, patchRepo, dependencies, sha, _iterator21, _step21, _sha, hasSha, cherryPickSuccess, currentSHA;
          return _regeneratorRuntime().wrap(function _callee33$(_context33) {
            while (1) switch (_context33.prev = _context33.next) {
              case 0:
                maintenance = Maintenance.load();
                numApplied = 0;
                _iterator19 = _createForOfIteratorHelper(maintenance.modifiedBranches);
                _context33.prev = 3;
                _iterator19.s();
              case 5:
                if ((_step19 = _iterator19.n()).done) {
                  _context33.next = 95;
                  break;
                }
                modifiedBranch = _step19.value;
                if (!(modifiedBranch.neededPatches.length === 0)) {
                  _context33.next = 9;
                  break;
                }
                return _context33.abrupt("continue", 93);
              case 9:
                repo = modifiedBranch.repo;
                branch = modifiedBranch.branch; // Defensive copy, since we modify it during iteration
                _iterator20 = _createForOfIteratorHelper(modifiedBranch.neededPatches.slice());
                _context33.prev = 12;
                _iterator20.s();
              case 14:
                if ((_step20 = _iterator20.n()).done) {
                  _context33.next = 83;
                  break;
                }
                patch = _step20.value;
                if (!(patch.shas.length === 0)) {
                  _context33.next = 18;
                  break;
                }
                return _context33.abrupt("continue", 81);
              case 18:
                patchRepo = patch.repo;
                _context33.prev = 19;
                if (!modifiedBranch.changedDependencies[patchRepo]) {
                  _context33.next = 25;
                  break;
                }
                _context33.next = 23;
                return gitCheckout(patchRepo, modifiedBranch.changedDependencies[patchRepo]);
              case 23:
                _context33.next = 37;
                break;
              case 25:
                _context33.next = 27;
                return gitCheckout(repo, branch);
              case 27:
                _context33.next = 29;
                return gitPull(repo);
              case 29:
                _context33.next = 31;
                return getDependencies(repo);
              case 31:
                dependencies = _context33.sent;
                sha = dependencies[patchRepo].sha;
                _context33.next = 35;
                return gitCheckout(repo, 'main');
              case 35:
                _context33.next = 37;
                return gitCheckout(patchRepo, sha);
              case 37:
                console.log("Checked out ".concat(patchRepo, " SHA for ").concat(repo, " ").concat(branch));
                _iterator21 = _createForOfIteratorHelper(patch.shas);
                _context33.prev = 39;
                _iterator21.s();
              case 41:
                if ((_step21 = _iterator21.n()).done) {
                  _context33.next = 67;
                  break;
                }
                _sha = _step21.value;
                _context33.next = 45;
                return execute('git', ['cat-file', '-e', _sha], "../".concat(patchRepo), {
                  errors: 'resolve'
                });
              case 45:
                _context33.t0 = _context33.sent.code;
                hasSha = _context33.t0 === 0;
                if (hasSha) {
                  _context33.next = 49;
                  break;
                }
                throw new Error("SHA not found in ".concat(patchRepo, ": ").concat(_sha));
              case 49:
                _context33.next = 51;
                return gitCherryPick(patchRepo, _sha);
              case 51:
                cherryPickSuccess = _context33.sent;
                if (!cherryPickSuccess) {
                  _context33.next = 64;
                  break;
                }
                _context33.next = 55;
                return gitRevParse(patchRepo, 'HEAD');
              case 55:
                currentSHA = _context33.sent;
                console.log("Cherry-pick success for ".concat(_sha, ", result is ").concat(currentSHA));
                modifiedBranch.changedDependencies[patchRepo] = currentSHA;
                modifiedBranch.neededPatches.splice(modifiedBranch.neededPatches.indexOf(patch), 1);
                numApplied++;

                // Don't include duplicate messages, since multiple patches might be for a single issue
                if (!modifiedBranch.pendingMessages.includes(patch.message)) {
                  modifiedBranch.pendingMessages.push(patch.message);
                }
                return _context33.abrupt("break", 67);
              case 64:
                console.log("Could not cherry-pick ".concat(_sha));
              case 65:
                _context33.next = 41;
                break;
              case 67:
                _context33.next = 72;
                break;
              case 69:
                _context33.prev = 69;
                _context33.t1 = _context33["catch"](39);
                _iterator21.e(_context33.t1);
              case 72:
                _context33.prev = 72;
                _iterator21.f();
                return _context33.finish(72);
              case 75:
                _context33.next = 81;
                break;
              case 77:
                _context33.prev = 77;
                _context33.t2 = _context33["catch"](19);
                maintenance.save();
                throw new Error("Failure applying patch ".concat(patchRepo, " to ").concat(repo, " ").concat(branch, ": ").concat(_context33.t2));
              case 81:
                _context33.next = 14;
                break;
              case 83:
                _context33.next = 88;
                break;
              case 85:
                _context33.prev = 85;
                _context33.t3 = _context33["catch"](12);
                _iterator20.e(_context33.t3);
              case 88:
                _context33.prev = 88;
                _iterator20.f();
                return _context33.finish(88);
              case 91:
                _context33.next = 93;
                return gitCheckout(modifiedBranch.repo, 'main');
              case 93:
                _context33.next = 5;
                break;
              case 95:
                _context33.next = 100;
                break;
              case 97:
                _context33.prev = 97;
                _context33.t4 = _context33["catch"](3);
                _iterator19.e(_context33.t4);
              case 100:
                _context33.prev = 100;
                _iterator19.f();
                return _context33.finish(100);
              case 103:
                maintenance.save();
                console.log("".concat(numApplied, " patches applied"));
              case 105:
              case "end":
                return _context33.stop();
            }
          }, _callee33, null, [[3, 97, 100, 103], [12, 85, 88, 91], [19, 77], [39, 69, 72, 75]]);
        }));
        function applyPatches() {
          return _applyPatches.apply(this, arguments);
        }
        return applyPatches;
      }()
      /**
       * Pushes local changes up to GitHub.
       * @public
       *
       * @param {function(ModifiedBranch):Promise.<boolean>} [filter] - Optional filter, modified branches will be skipped
       *                                                                if this resolves to false
       */
      )
    }, {
      key: "updateDependencies",
      value: (function () {
        var _updateDependencies = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee34(filter) {
          var maintenance, _iterator22, _step22, modifiedBranch, changedRepos, dependenciesJSONFile, dependenciesJSON, _i2, _changedRepos, dependency, dependencyBranch, branches, sha, currentSHA, message, _iterator23, _step23, _message;
          return _regeneratorRuntime().wrap(function _callee34$(_context34) {
            while (1) switch (_context34.prev = _context34.next) {
              case 0:
                maintenance = Maintenance.load();
                _iterator22 = _createForOfIteratorHelper(maintenance.modifiedBranches);
                _context34.prev = 2;
                _iterator22.s();
              case 4:
                if ((_step22 = _iterator22.n()).done) {
                  _context34.next = 87;
                  break;
                }
                modifiedBranch = _step22.value;
                changedRepos = Object.keys(modifiedBranch.changedDependencies);
                if (!(changedRepos.length === 0)) {
                  _context34.next = 9;
                  break;
                }
                return _context34.abrupt("continue", 85);
              case 9:
                _context34.t0 = filter;
                if (!_context34.t0) {
                  _context34.next = 14;
                  break;
                }
                _context34.next = 13;
                return filter(modifiedBranch);
              case 13:
                _context34.t0 = !_context34.sent;
              case 14:
                if (!_context34.t0) {
                  _context34.next = 17;
                  break;
                }
                console.log("Skipping dependency update for ".concat(modifiedBranch.repo, " ").concat(modifiedBranch.branch));
                return _context34.abrupt("continue", 85);
              case 17:
                _context34.prev = 17;
                _context34.next = 20;
                return checkoutTarget(modifiedBranch.repo, modifiedBranch.branch, false);
              case 20:
                console.log("Checked out ".concat(modifiedBranch.repo, " ").concat(modifiedBranch.branch));
                dependenciesJSONFile = "../".concat(modifiedBranch.repo, "/dependencies.json");
                dependenciesJSON = JSON.parse(fs.readFileSync(dependenciesJSONFile, 'utf-8')); // Modify the "self" in the dependencies.json as expected
                _context34.next = 25;
                return gitRevParse(modifiedBranch.repo, modifiedBranch.branch);
              case 25:
                dependenciesJSON[modifiedBranch.repo].sha = _context34.sent;
                _i2 = 0, _changedRepos = changedRepos;
              case 27:
                if (!(_i2 < _changedRepos.length)) {
                  _context34.next = 65;
                  break;
                }
                dependency = _changedRepos[_i2];
                dependencyBranch = modifiedBranch.dependencyBranch;
                _context34.next = 32;
                return getBranches(dependency);
              case 32:
                branches = _context34.sent;
                sha = modifiedBranch.changedDependencies[dependency];
                dependenciesJSON[dependency].sha = sha;
                if (!branches.includes(dependencyBranch)) {
                  _context34.next = 52;
                  break;
                }
                console.log("Branch ".concat(dependencyBranch, " already exists in ").concat(dependency));
                _context34.next = 39;
                return gitCheckout(dependency, dependencyBranch);
              case 39:
                _context34.next = 41;
                return gitPull(dependency);
              case 41:
                _context34.next = 43;
                return gitRevParse(dependency, 'HEAD');
              case 43:
                currentSHA = _context34.sent;
                if (!(sha !== currentSHA)) {
                  _context34.next = 50;
                  break;
                }
                console.log("Attempting to (hopefully fast-forward) merge ".concat(sha));
                _context34.next = 48;
                return execute('git', ['merge', sha], "../".concat(dependency));
              case 48:
                _context34.next = 50;
                return gitPush(dependency, dependencyBranch);
              case 50:
                _context34.next = 59;
                break;
              case 52:
                console.log("Branch ".concat(dependencyBranch, " does not exist in ").concat(dependency, ", creating."));
                _context34.next = 55;
                return gitCheckout(dependency, sha);
              case 55:
                _context34.next = 57;
                return gitCreateBranch(dependency, dependencyBranch);
              case 57:
                _context34.next = 59;
                return gitPush(dependency, dependencyBranch);
              case 59:
                delete modifiedBranch.changedDependencies[dependency];
                modifiedBranch.deployedVersion = null;
                maintenance.save(); // save here in case a future failure would "revert" things
              case 62:
                _i2++;
                _context34.next = 27;
                break;
              case 65:
                message = modifiedBranch.pendingMessages.join(' and ');
                fs.writeFileSync(dependenciesJSONFile, JSON.stringify(dependenciesJSON, null, 2));
                _context34.next = 69;
                return gitAdd(modifiedBranch.repo, 'dependencies.json');
              case 69:
                _context34.next = 71;
                return gitCommit(modifiedBranch.repo, "updated dependencies.json for ".concat(message));
              case 71:
                _context34.next = 73;
                return gitPush(modifiedBranch.repo, modifiedBranch.branch);
              case 73:
                // Move messages from pending to pushed
                _iterator23 = _createForOfIteratorHelper(modifiedBranch.pendingMessages);
                try {
                  for (_iterator23.s(); !(_step23 = _iterator23.n()).done;) {
                    _message = _step23.value;
                    if (!modifiedBranch.pushedMessages.includes(_message)) {
                      modifiedBranch.pushedMessages.push(_message);
                    }
                  }
                } catch (err) {
                  _iterator23.e(err);
                } finally {
                  _iterator23.f();
                }
                modifiedBranch.pendingMessages = [];
                maintenance.save(); // save here in case a future failure would "revert" things
                _context34.next = 79;
                return checkoutMain(modifiedBranch.repo, false);
              case 79:
                _context34.next = 85;
                break;
              case 81:
                _context34.prev = 81;
                _context34.t1 = _context34["catch"](17);
                maintenance.save();
                throw new Error("Failure updating dependencies for ".concat(modifiedBranch.repo, " to ").concat(modifiedBranch.branch, ": ").concat(_context34.t1));
              case 85:
                _context34.next = 4;
                break;
              case 87:
                _context34.next = 92;
                break;
              case 89:
                _context34.prev = 89;
                _context34.t2 = _context34["catch"](2);
                _iterator22.e(_context34.t2);
              case 92:
                _context34.prev = 92;
                _iterator22.f();
                return _context34.finish(92);
              case 95:
                maintenance.save();
                console.log('Dependencies updated');
              case 97:
              case "end":
                return _context34.stop();
            }
          }, _callee34, null, [[2, 89, 92, 95], [17, 81]]);
        }));
        function updateDependencies(_x45) {
          return _updateDependencies.apply(this, arguments);
        }
        return updateDependencies;
      }()
      /**
       * Deploys RC versions of the modified branches that need it.
       * @public
       *
       * @param {function(ModifiedBranch):Promise.<boolean>} [filter] - Optional filter, modified branches will be skipped
       *                                                                if this resolves to false
       */
      )
    }, {
      key: "deployReleaseCandidates",
      value: (function () {
        var _deployReleaseCandidates = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee35(filter) {
          var maintenance, _iterator24, _step24, modifiedBranch, version;
          return _regeneratorRuntime().wrap(function _callee35$(_context35) {
            while (1) switch (_context35.prev = _context35.next) {
              case 0:
                maintenance = Maintenance.load();
                _iterator24 = _createForOfIteratorHelper(maintenance.modifiedBranches);
                _context35.prev = 2;
                _iterator24.s();
              case 4:
                if ((_step24 = _iterator24.n()).done) {
                  _context35.next = 32;
                  break;
                }
                modifiedBranch = _step24.value;
                if (!(!modifiedBranch.isReadyForReleaseCandidate || !modifiedBranch.releaseBranch.isReleased)) {
                  _context35.next = 8;
                  break;
                }
                return _context35.abrupt("continue", 30);
              case 8:
                console.log('================================================');
                _context35.t0 = filter;
                if (!_context35.t0) {
                  _context35.next = 14;
                  break;
                }
                _context35.next = 13;
                return filter(modifiedBranch);
              case 13:
                _context35.t0 = !_context35.sent;
              case 14:
                if (!_context35.t0) {
                  _context35.next = 17;
                  break;
                }
                console.log("Skipping RC deploy for ".concat(modifiedBranch.repo, " ").concat(modifiedBranch.branch));
                return _context35.abrupt("continue", 30);
              case 17:
                _context35.prev = 17;
                console.log("Running RC deploy for ".concat(modifiedBranch.repo, " ").concat(modifiedBranch.branch));
                _context35.next = 21;
                return rc(modifiedBranch.repo, modifiedBranch.branch, modifiedBranch.brands, true, modifiedBranch.pushedMessages.join(', '));
              case 21:
                version = _context35.sent;
                modifiedBranch.deployedVersion = version;
                maintenance.save(); // save here in case a future failure would "revert" things
                _context35.next = 30;
                break;
              case 26:
                _context35.prev = 26;
                _context35.t1 = _context35["catch"](17);
                maintenance.save();
                throw new Error("Failure with RC deploy for ".concat(modifiedBranch.repo, " to ").concat(modifiedBranch.branch, ": ").concat(_context35.t1));
              case 30:
                _context35.next = 4;
                break;
              case 32:
                _context35.next = 37;
                break;
              case 34:
                _context35.prev = 34;
                _context35.t2 = _context35["catch"](2);
                _iterator24.e(_context35.t2);
              case 37:
                _context35.prev = 37;
                _iterator24.f();
                return _context35.finish(37);
              case 40:
                maintenance.save();
                console.log('RC versions deployed');
              case 42:
              case "end":
                return _context35.stop();
            }
          }, _callee35, null, [[2, 34, 37, 40], [17, 26]]);
        }));
        function deployReleaseCandidates(_x46) {
          return _deployReleaseCandidates.apply(this, arguments);
        }
        return deployReleaseCandidates;
      }()
      /**
       * Deploys production versions of the modified branches that need it.
       * @public
       *
       * @param {function(ModifiedBranch):Promise.<boolean>} [filter] - Optional filter, modified branches will be skipped
       *                                                                if this resolves to false
       */
      )
    }, {
      key: "deployProduction",
      value: (function () {
        var _deployProduction = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee36(filter) {
          var maintenance, _iterator25, _step25, modifiedBranch, version;
          return _regeneratorRuntime().wrap(function _callee36$(_context36) {
            while (1) switch (_context36.prev = _context36.next) {
              case 0:
                maintenance = Maintenance.load();
                _iterator25 = _createForOfIteratorHelper(maintenance.modifiedBranches);
                _context36.prev = 2;
                _iterator25.s();
              case 4:
                if ((_step25 = _iterator25.n()).done) {
                  _context36.next = 32;
                  break;
                }
                modifiedBranch = _step25.value;
                if (!(!modifiedBranch.isReadyForProduction || !modifiedBranch.releaseBranch.isReleased)) {
                  _context36.next = 8;
                  break;
                }
                return _context36.abrupt("continue", 30);
              case 8:
                _context36.t0 = filter;
                if (!_context36.t0) {
                  _context36.next = 13;
                  break;
                }
                _context36.next = 12;
                return filter(modifiedBranch);
              case 12:
                _context36.t0 = !_context36.sent;
              case 13:
                if (!_context36.t0) {
                  _context36.next = 16;
                  break;
                }
                console.log("Skipping production deploy for ".concat(modifiedBranch.repo, " ").concat(modifiedBranch.branch));
                return _context36.abrupt("continue", 30);
              case 16:
                _context36.prev = 16;
                console.log("Running production deploy for ".concat(modifiedBranch.repo, " ").concat(modifiedBranch.branch));
                _context36.next = 20;
                return production(modifiedBranch.repo, modifiedBranch.branch, modifiedBranch.brands, true, false, modifiedBranch.pushedMessages.join(', '));
              case 20:
                version = _context36.sent;
                modifiedBranch.deployedVersion = version;
                modifiedBranch.pushedMessages = [];
                maintenance.save(); // save here in case a future failure would "revert" things
                _context36.next = 30;
                break;
              case 26:
                _context36.prev = 26;
                _context36.t1 = _context36["catch"](16);
                maintenance.save();
                throw new Error("Failure with production deploy for ".concat(modifiedBranch.repo, " to ").concat(modifiedBranch.branch, ": ").concat(_context36.t1));
              case 30:
                _context36.next = 4;
                break;
              case 32:
                _context36.next = 37;
                break;
              case 34:
                _context36.prev = 34;
                _context36.t2 = _context36["catch"](2);
                _iterator25.e(_context36.t2);
              case 37:
                _context36.prev = 37;
                _iterator25.f();
                return _context36.finish(37);
              case 40:
                maintenance.save();
                console.log('production versions deployed');
              case 42:
              case "end":
                return _context36.stop();
            }
          }, _callee36, null, [[2, 34, 37, 40], [16, 26]]);
        }));
        function deployProduction(_x47) {
          return _deployProduction.apply(this, arguments);
        }
        return deployProduction;
      }()
      /**
       * Create a separate directory for each release branch. This does not interface with the saved maintenance state at
       * all, and instead just looks at the committed dependencies.json when updating.
       * @public
       *
       * @param {function(ReleaseBranch):Promise.<boolean>} [filter] - Optional filter, release branches will be skipped
       *                                                               if this resolves to false
       * @param {Object} [options] - build=false - to opt out of building, set to false.
       *                             transpile=false - to opt out of transpiling, set to false.
       */
      )
    }, {
      key: "updateCheckouts",
      value: (function () {
        var _updateCheckouts = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee38(filter, options) {
          var releaseBranches, filteredBranches, _iterator26, _step26, releaseBranch, asyncFunctions;
          return _regeneratorRuntime().wrap(function _callee38$(_context38) {
            while (1) switch (_context38.prev = _context38.next) {
              case 0:
                options = _.merge({
                  concurrent: 5,
                  build: true,
                  transpile: true,
                  buildOptions: {
                    lint: true
                  }
                }, options);
                console.log("Updating checkouts (running in parallel with ".concat(options.concurrent, " threads)"));
                _context38.next = 4;
                return Maintenance.getMaintenanceBranches();
              case 4:
                releaseBranches = _context38.sent;
                filteredBranches = []; // Run all filtering in a step before the parallel step. This way the filter has full access to repos and git commands without race conditions, https://github.com/phetsims/perennial/issues/341
                _iterator26 = _createForOfIteratorHelper(releaseBranches);
                _context38.prev = 7;
                _iterator26.s();
              case 9:
                if ((_step26 = _iterator26.n()).done) {
                  _context38.next = 20;
                  break;
                }
                releaseBranch = _step26.value;
                _context38.t0 = !filter;
                if (_context38.t0) {
                  _context38.next = 16;
                  break;
                }
                _context38.next = 15;
                return filter(releaseBranch);
              case 15:
                _context38.t0 = _context38.sent;
              case 16:
                if (!_context38.t0) {
                  _context38.next = 18;
                  break;
                }
                filteredBranches.push(releaseBranch);
              case 18:
                _context38.next = 9;
                break;
              case 20:
                _context38.next = 25;
                break;
              case 22:
                _context38.prev = 22;
                _context38.t1 = _context38["catch"](7);
                _iterator26.e(_context38.t1);
              case 25:
                _context38.prev = 25;
                _iterator26.f();
                return _context38.finish(25);
              case 28:
                console.log("Filter applied. Updating ".concat(filteredBranches.length, ":"), filteredBranches.map(function (x) {
                  return x.toString();
                }));
                asyncFunctions = filteredBranches.map(function (releaseBranch) {
                  return /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee37() {
                    return _regeneratorRuntime().wrap(function _callee37$(_context37) {
                      while (1) switch (_context37.prev = _context37.next) {
                        case 0:
                          console.log('Beginning: ', releaseBranch.toString());
                          _context37.prev = 1;
                          _context37.next = 4;
                          return releaseBranch.updateCheckout();
                        case 4:
                          _context37.t0 = options.transpile;
                          if (!_context37.t0) {
                            _context37.next = 8;
                            break;
                          }
                          _context37.next = 8;
                          return releaseBranch.transpile();
                        case 8:
                          _context37.prev = 8;
                          _context37.t1 = options.build;
                          if (!_context37.t1) {
                            _context37.next = 13;
                            break;
                          }
                          _context37.next = 13;
                          return releaseBranch.build(options.buildOptions);
                        case 13:
                          _context37.next = 18;
                          break;
                        case 15:
                          _context37.prev = 15;
                          _context37.t2 = _context37["catch"](8);
                          console.log("failed to build ".concat(releaseBranch.toString(), ": ").concat(_context37.t2));
                        case 18:
                          _context37.next = 23;
                          break;
                        case 20:
                          _context37.prev = 20;
                          _context37.t3 = _context37["catch"](1);
                          console.log("failed to update releaseBranch ".concat(releaseBranch.toString(), ": ").concat(_context37.t3));
                        case 23:
                        case "end":
                          return _context37.stop();
                      }
                    }, _callee37, null, [[1, 20], [8, 15]]);
                  }));
                });
                _context38.next = 32;
                return asyncq.parallelLimit(asyncFunctions, options.concurrent);
              case 32:
                console.log('Done');
              case 33:
              case "end":
                return _context38.stop();
            }
          }, _callee38, null, [[7, 22, 25, 28]]);
        }));
        function updateCheckouts(_x48, _x49) {
          return _updateCheckouts.apply(this, arguments);
        }
        return updateCheckouts;
      }()
      /**
       * @public
       *
       * @param {function(ReleaseBranch):Promise.<boolean>} [filter] - Optional filter, release branches will be skipped
       *                                                               if this resolves to false
       */
      )
    }, {
      key: "checkUnbuiltCheckouts",
      value: (function () {
        var _checkUnbuiltCheckouts = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee39(filter) {
          var releaseBranches, _iterator27, _step27, releaseBranch, unbuiltResult;
          return _regeneratorRuntime().wrap(function _callee39$(_context39) {
            while (1) switch (_context39.prev = _context39.next) {
              case 0:
                console.log('Checking unbuilt checkouts');
                _context39.next = 3;
                return Maintenance.getMaintenanceBranches();
              case 3:
                releaseBranches = _context39.sent;
                _iterator27 = _createForOfIteratorHelper(releaseBranches);
                _context39.prev = 5;
                _iterator27.s();
              case 7:
                if ((_step27 = _iterator27.n()).done) {
                  _context39.next = 22;
                  break;
                }
                releaseBranch = _step27.value;
                _context39.t0 = !filter;
                if (_context39.t0) {
                  _context39.next = 14;
                  break;
                }
                _context39.next = 13;
                return filter(releaseBranch);
              case 13:
                _context39.t0 = _context39.sent;
              case 14:
                if (!_context39.t0) {
                  _context39.next = 20;
                  break;
                }
                console.log(releaseBranch.toString());
                _context39.next = 18;
                return releaseBranch.checkUnbuilt();
              case 18:
                unbuiltResult = _context39.sent;
                if (unbuiltResult) {
                  console.log(unbuiltResult);
                }
              case 20:
                _context39.next = 7;
                break;
              case 22:
                _context39.next = 27;
                break;
              case 24:
                _context39.prev = 24;
                _context39.t1 = _context39["catch"](5);
                _iterator27.e(_context39.t1);
              case 27:
                _context39.prev = 27;
                _iterator27.f();
                return _context39.finish(27);
              case 30:
              case "end":
                return _context39.stop();
            }
          }, _callee39, null, [[5, 24, 27, 30]]);
        }));
        function checkUnbuiltCheckouts(_x50) {
          return _checkUnbuiltCheckouts.apply(this, arguments);
        }
        return checkUnbuiltCheckouts;
      }()
      /**
       * @public
       *
       * @param {function(ReleaseBranch):Promise.<boolean>} [filter] - Optional filter, release branches will be skipped
       *                                                               if this resolves to false
       */
      )
    }, {
      key: "checkBuiltCheckouts",
      value: (function () {
        var _checkBuiltCheckouts = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee40(filter) {
          var releaseBranches, _iterator28, _step28, releaseBranch, builtResult;
          return _regeneratorRuntime().wrap(function _callee40$(_context40) {
            while (1) switch (_context40.prev = _context40.next) {
              case 0:
                console.log('Checking built checkouts');
                _context40.next = 3;
                return Maintenance.getMaintenanceBranches();
              case 3:
                releaseBranches = _context40.sent;
                _iterator28 = _createForOfIteratorHelper(releaseBranches);
                _context40.prev = 5;
                _iterator28.s();
              case 7:
                if ((_step28 = _iterator28.n()).done) {
                  _context40.next = 22;
                  break;
                }
                releaseBranch = _step28.value;
                _context40.t0 = !filter;
                if (_context40.t0) {
                  _context40.next = 14;
                  break;
                }
                _context40.next = 13;
                return filter(releaseBranch);
              case 13:
                _context40.t0 = _context40.sent;
              case 14:
                if (!_context40.t0) {
                  _context40.next = 20;
                  break;
                }
                console.log(releaseBranch.toString());
                _context40.next = 18;
                return releaseBranch.checkBuilt();
              case 18:
                builtResult = _context40.sent;
                if (builtResult) {
                  console.log(builtResult);
                }
              case 20:
                _context40.next = 7;
                break;
              case 22:
                _context40.next = 27;
                break;
              case 24:
                _context40.prev = 24;
                _context40.t1 = _context40["catch"](5);
                _iterator28.e(_context40.t1);
              case 27:
                _context40.prev = 27;
                _iterator28.f();
                return _context40.finish(27);
              case 30:
              case "end":
                return _context40.stop();
            }
          }, _callee40, null, [[5, 24, 27, 30]]);
        }));
        function checkBuiltCheckouts(_x51) {
          return _checkBuiltCheckouts.apply(this, arguments);
        }
        return checkBuiltCheckouts;
      }()
      /**
       * Redeploys production versions of all release branches (or those matching a specific filter
       * @public
       *
       * NOTE: This does not use the current maintenance state!
       *
       * @param {string} message - Generally an issue to reference
       * @param {function(ReleaseBranch):Promise.<boolean>} [filter] - Optional filter, release branches will be skipped
       *                                                                if this resolves to false
       */
      )
    }, {
      key: "redeployAllProduction",
      value: (function () {
        var _redeployAllProduction = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee41(message, filter) {
          var releaseBranches, _iterator29, _step29, releaseBranch;
          return _regeneratorRuntime().wrap(function _callee41$(_context41) {
            while (1) switch (_context41.prev = _context41.next) {
              case 0:
                _context41.next = 2;
                return Maintenance.getMaintenanceBranches(function () {
                  return true;
                }, false);
              case 2:
                releaseBranches = _context41.sent;
                _iterator29 = _createForOfIteratorHelper(releaseBranches);
                _context41.prev = 4;
                _iterator29.s();
              case 6:
                if ((_step29 = _iterator29.n()).done) {
                  _context41.next = 22;
                  break;
                }
                releaseBranch = _step29.value;
                _context41.t0 = filter;
                if (!_context41.t0) {
                  _context41.next = 13;
                  break;
                }
                _context41.next = 12;
                return filter(releaseBranch);
              case 12:
                _context41.t0 = !_context41.sent;
              case 13:
                if (!_context41.t0) {
                  _context41.next = 15;
                  break;
                }
                return _context41.abrupt("continue", 20);
              case 15:
                console.log(releaseBranch.toString());
                _context41.next = 18;
                return rc(releaseBranch.repo, releaseBranch.branch, releaseBranch.brands, true, message);
              case 18:
                _context41.next = 20;
                return production(releaseBranch.repo, releaseBranch.branch, releaseBranch.brands, true, false, message);
              case 20:
                _context41.next = 6;
                break;
              case 22:
                _context41.next = 27;
                break;
              case 24:
                _context41.prev = 24;
                _context41.t1 = _context41["catch"](4);
                _iterator29.e(_context41.t1);
              case 27:
                _context41.prev = 27;
                _iterator29.f();
                return _context41.finish(27);
              case 30:
                console.log('Finished redeploying');
              case 31:
              case "end":
                return _context41.stop();
            }
          }, _callee41, null, [[4, 24, 27, 30]]);
        }));
        function redeployAllProduction(_x52, _x53) {
          return _redeployAllProduction.apply(this, arguments);
        }
        return redeployAllProduction;
      }())
    }, {
      key: "getMaintenanceBranches",
      value: (function () {
        var _getMaintenanceBranches2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee42() {
          var filterRepo,
            checkUnreleasedBranches,
            forceCacheBreak,
            maintenance,
            releaseBranches,
            _args42 = arguments;
          return _regeneratorRuntime().wrap(function _callee42$(_context42) {
            while (1) switch (_context42.prev = _context42.next) {
              case 0:
                filterRepo = _args42.length > 0 && _args42[0] !== undefined ? _args42[0] : function () {
                  return true;
                };
                checkUnreleasedBranches = _args42.length > 1 && _args42[1] !== undefined ? _args42[1] : true;
                forceCacheBreak = _args42.length > 2 && _args42[2] !== undefined ? _args42[2] : false;
                maintenance = _args42.length > 3 && _args42[3] !== undefined ? _args42[3] : Maintenance.load();
                _context42.next = 6;
                return Maintenance.loadAllMaintenanceBranches(forceCacheBreak, maintenance);
              case 6:
                releaseBranches = _context42.sent;
                return _context42.abrupt("return", releaseBranches.filter(function (releaseBranch) {
                  if (!checkUnreleasedBranches && !releaseBranch.isReleased) {
                    return false;
                  }
                  return filterRepo(releaseBranch);
                }));
              case 8:
              case "end":
                return _context42.stop();
            }
          }, _callee42);
        }));
        function getMaintenanceBranches() {
          return _getMaintenanceBranches2.apply(this, arguments);
        }
        return getMaintenanceBranches;
      }()
      /**
       * Loads every potential ReleaseBranch (published phet and phet-io brands, as well as unreleased branches), and
       * saves it to the maintenance state.
       * @public
       *
       * Call this with true to break the cache and force a recalculation of all ReleaseBranches
       *
       * @param {boolean} forceCacheBreak=false - true if you want to force a recalculation of all ReleaseBranches
       * @param {Maintenance} maintenance=Maintenance.load() - by default load from saved file the current maintenance instance.     * @returns {Promise<ReleaseBranch[]>}
       */
      )
    }, {
      key: "loadAllMaintenanceBranches",
      value: (function () {
        var _loadAllMaintenanceBranches = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee43() {
          var forceCacheBreak,
            maintenance,
            releaseBranches,
            _args43 = arguments;
          return _regeneratorRuntime().wrap(function _callee43$(_context43) {
            while (1) switch (_context43.prev = _context43.next) {
              case 0:
                forceCacheBreak = _args43.length > 0 && _args43[0] !== undefined ? _args43[0] : false;
                maintenance = _args43.length > 1 && _args43[1] !== undefined ? _args43[1] : Maintenance.load();
                releaseBranches = null;
                if (!(maintenance.allReleaseBranches.length > 0 && !forceCacheBreak)) {
                  _context43.next = 8;
                  break;
                }
                assert(maintenance.allReleaseBranches[0] instanceof ReleaseBranch, 'deserialization check');
                releaseBranches = maintenance.allReleaseBranches;
                _context43.next = 13;
                break;
              case 8:
                _context43.next = 10;
                return ReleaseBranch.getAllMaintenanceBranches();
              case 10:
                releaseBranches = _context43.sent;
                maintenance.allReleaseBranches = releaseBranches;
                maintenance.save();
              case 13:
                return _context43.abrupt("return", releaseBranches);
              case 14:
              case "end":
                return _context43.stop();
            }
          }, _callee43);
        }));
        function loadAllMaintenanceBranches() {
          return _loadAllMaintenanceBranches.apply(this, arguments);
        }
        return loadAllMaintenanceBranches;
      }())
    }, {
      key: "deserialize",
      value: function deserialize(_ref10) {
        var _ref10$patches = _ref10.patches,
          patches = _ref10$patches === void 0 ? [] : _ref10$patches,
          _ref10$modifiedBranch = _ref10.modifiedBranches,
          modifiedBranches = _ref10$modifiedBranch === void 0 ? [] : _ref10$modifiedBranch,
          _ref10$allReleaseBran = _ref10.allReleaseBranches,
          allReleaseBranches = _ref10$allReleaseBran === void 0 ? [] : _ref10$allReleaseBran;
        // Pass in patch references to branch deserialization
        var deserializedPatches = patches.map(Patch.deserialize);
        modifiedBranches = modifiedBranches.map(function (modifiedBranch) {
          return ModifiedBranch.deserialize(modifiedBranch, deserializedPatches);
        });
        modifiedBranches.sort(function (a, b) {
          if (a.repo !== b.repo) {
            return a.repo < b.repo ? -1 : 1;
          }
          if (a.branch !== b.branch) {
            return a.branch < b.branch ? -1 : 1;
          }
          return 0;
        });
        var deserializedReleaseBranches = allReleaseBranches.map(function (releaseBranch) {
          return ReleaseBranch.deserialize(releaseBranch);
        });
        return new Maintenance(deserializedPatches, modifiedBranches, deserializedReleaseBranches);
      }
    }, {
      key: "load",
      value: function load() {
        if (fs.existsSync(MAINTENANCE_FILE)) {
          return Maintenance.deserialize(JSON.parse(fs.readFileSync(MAINTENANCE_FILE, 'utf8')));
        } else {
          return new Maintenance();
        }
      }

      /**
       * Starts a command-line REPL with features loaded.
       * @public
       *
       * @returns {Promise}
       */
    }, {
      key: "startREPL",
      value: function startREPL() {
        return new Promise(function (resolve, reject) {
          winston["default"].transports.console.level = 'error';
          var session = repl.start({
            prompt: 'maintenance> ',
            useColors: true,
            replMode: repl.REPL_MODE_STRICT,
            ignoreUndefined: true
          });

          // Wait for promises before being ready for input
          var nodeEval = session.eval;
          session.eval = /*#__PURE__*/function () {
            var _ref11 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee44(cmd, context, filename, callback) {
              return _regeneratorRuntime().wrap(function _callee44$(_context44) {
                while (1) switch (_context44.prev = _context44.next) {
                  case 0:
                    nodeEval(cmd, context, filename, function (_, result) {
                      if (result instanceof Promise) {
                        result.then(function (val) {
                          return callback(_, val);
                        })["catch"](function (e) {
                          if (e.stack) {
                            console.error("Maintenance task failed:\n".concat(e.stack, "\nFull Error details:\n").concat(JSON.stringify(e, null, 2)));
                          } else if (typeof e === 'string') {
                            console.error("Maintenance task failed: ".concat(e));
                          } else {
                            console.error("Maintenance task failed with unknown error: ".concat(JSON.stringify(e, null, 2)));
                          }
                        });
                      } else {
                        callback(_, result);
                      }
                    });
                  case 1:
                  case "end":
                    return _context44.stop();
                }
              }, _callee44);
            }));
            return function (_x54, _x55, _x56, _x57) {
              return _ref11.apply(this, arguments);
            };
          }();

          // Only autocomplete "public" API functions for Maintenance.
          // const nodeCompleter = session.completer;
          // session.completer = function( text, cb ) {
          //   nodeCompleter( text, ( _, [ completions, completed ] ) => {
          //     const match = completed.match( /^Maintenance\.(\w*)+/ );
          //     if ( match ) {
          //       const funcStart = match[ 1 ];
          //       cb( null, [ PUBLIC_FUNCTIONS.filter( f => f.startsWith( funcStart ) ).map( f => `Maintenance.${f}` ), completed ] );
          //     }
          //     else {
          //       cb( null, [ completions, completed ] );
          //     }
          //   } );
          // };

          // Allow controlling verbosity
          Object.defineProperty(global, 'verbose', {
            get: function get() {
              return winston["default"].transports.console.level === 'info';
            },
            set: function set(value) {
              winston["default"].transports.console.level = value ? 'info' : 'error';
            }
          });
          session.context.Maintenance = Maintenance;
          session.context.m = Maintenance;
          session.context.M = Maintenance;
          session.context.ReleaseBranch = ReleaseBranch;
          session.context.rb = ReleaseBranch;
          session.on('exit', resolve);
        });
      }
    }]);
  }();
  return Maintenance;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVnZW5lcmF0b3JSdW50aW1lIiwiZSIsInQiLCJyIiwiT2JqZWN0IiwicHJvdG90eXBlIiwibiIsImhhc093blByb3BlcnR5IiwibyIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJpIiwiU3ltYm9sIiwiYSIsIml0ZXJhdG9yIiwiYyIsImFzeW5jSXRlcmF0b3IiLCJ1IiwidG9TdHJpbmdUYWciLCJkZWZpbmUiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ3cmFwIiwiR2VuZXJhdG9yIiwiY3JlYXRlIiwiQ29udGV4dCIsIm1ha2VJbnZva2VNZXRob2QiLCJ0cnlDYXRjaCIsInR5cGUiLCJhcmciLCJjYWxsIiwiaCIsImwiLCJmIiwicyIsInkiLCJHZW5lcmF0b3JGdW5jdGlvbiIsIkdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlIiwicCIsImQiLCJnZXRQcm90b3R5cGVPZiIsInYiLCJ2YWx1ZXMiLCJnIiwiZGVmaW5lSXRlcmF0b3JNZXRob2RzIiwiZm9yRWFjaCIsIl9pbnZva2UiLCJBc3luY0l0ZXJhdG9yIiwiaW52b2tlIiwiX3R5cGVvZiIsInJlc29sdmUiLCJfX2F3YWl0IiwidGhlbiIsImNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnIiwiRXJyb3IiLCJkb25lIiwibWV0aG9kIiwiZGVsZWdhdGUiLCJtYXliZUludm9rZURlbGVnYXRlIiwic2VudCIsIl9zZW50IiwiZGlzcGF0Y2hFeGNlcHRpb24iLCJhYnJ1cHQiLCJUeXBlRXJyb3IiLCJyZXN1bHROYW1lIiwibmV4dCIsIm5leHRMb2MiLCJwdXNoVHJ5RW50cnkiLCJ0cnlMb2MiLCJjYXRjaExvYyIsImZpbmFsbHlMb2MiLCJhZnRlckxvYyIsInRyeUVudHJpZXMiLCJwdXNoIiwicmVzZXRUcnlFbnRyeSIsImNvbXBsZXRpb24iLCJyZXNldCIsImlzTmFOIiwibGVuZ3RoIiwiZGlzcGxheU5hbWUiLCJpc0dlbmVyYXRvckZ1bmN0aW9uIiwiY29uc3RydWN0b3IiLCJuYW1lIiwibWFyayIsInNldFByb3RvdHlwZU9mIiwiX19wcm90b19fIiwiYXdyYXAiLCJhc3luYyIsIlByb21pc2UiLCJrZXlzIiwicmV2ZXJzZSIsInBvcCIsInByZXYiLCJjaGFyQXQiLCJzbGljZSIsInN0b3AiLCJydmFsIiwiaGFuZGxlIiwiY29tcGxldGUiLCJmaW5pc2giLCJfY2F0Y2giLCJkZWxlZ2F0ZVlpZWxkIiwiYXN5bmNHZW5lcmF0b3JTdGVwIiwiZ2VuIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJpbmZvIiwiZXJyb3IiLCJfYXN5bmNUb0dlbmVyYXRvciIsImZuIiwic2VsZiIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsImVyciIsInVuZGVmaW5lZCIsIl9jbGFzc0NhbGxDaGVjayIsImluc3RhbmNlIiwiQ29uc3RydWN0b3IiLCJfZGVmaW5lUHJvcGVydGllcyIsInRhcmdldCIsInByb3BzIiwiZGVzY3JpcHRvciIsIl90b1Byb3BlcnR5S2V5IiwiX2NyZWF0ZUNsYXNzIiwicHJvdG9Qcm9wcyIsInN0YXRpY1Byb3BzIiwiX3RvUHJpbWl0aXZlIiwidG9QcmltaXRpdmUiLCJTdHJpbmciLCJOdW1iZXIiLCJwcm9kdWN0aW9uIiwicmVxdWlyZSIsInJjIiwiQ2hpcHBlclZlcnNpb24iLCJNb2RpZmllZEJyYW5jaCIsIlBhdGNoIiwiUmVsZWFzZUJyYW5jaCIsImJ1aWxkIiwiY2hlY2tvdXRNYWluIiwiY2hlY2tvdXRUYXJnZXQiLCJleGVjdXRlIiwiZ2V0QWN0aXZlUmVwb3MiLCJnZXRCcmFuY2hlcyIsImdldEJyYW5jaE1hcCIsImdldERlcGVuZGVuY2llcyIsImdpdEFkZCIsImdpdENoZWNrb3V0IiwiZ2l0Q2hlcnJ5UGljayIsImdpdENvbW1pdCIsImdpdENyZWF0ZUJyYW5jaCIsImdpdElzQ2xlYW4iLCJnaXRQdWxsIiwiZ2l0UHVzaCIsImdpdFJldlBhcnNlIiwiYXNzZXJ0IiwiYXN5bmNxIiwiXyIsImZzIiwicmVwbCIsIndpbnN0b24iLCJncnVudENvbW1hbmQiLCJjaGlwcGVyU3VwcG9ydHNPdXRwdXRKU0dydW50VGFza3MiLCJNQUlOVEVOQU5DRV9GSUxFIiwibW9kdWxlIiwiZXhwb3J0cyIsIk1haW50ZW5hbmNlIiwicGF0Y2hlcyIsIm1vZGlmaWVkQnJhbmNoZXMiLCJhbGxSZWxlYXNlQnJhbmNoZXMiLCJBcnJheSIsImlzQXJyYXkiLCJwYXRjaCIsImJyYW5jaCIsIl9nZXRNYWludGVuYW5jZUJyYW5jaGVzIiwiX2NhbGxlZSIsImZpbHRlclJlcG8iLCJjaGVja1VucmVsZWFzZWRCcmFuY2hlcyIsImZvcmNlQ2FjaGVCcmVhayIsIl9hcmdzIiwiX2NhbGxlZSQiLCJfY29udGV4dCIsImdldE1haW50ZW5hbmNlQnJhbmNoZXMiLCJzZXJpYWxpemUiLCJtYXAiLCJtb2RpZmllZEJyYW5jaCIsInJlbGVhc2VCcmFuY2giLCJzYXZlIiwid3JpdGVGaWxlU3luYyIsIkpTT04iLCJzdHJpbmdpZnkiLCJmaW5kUGF0Y2giLCJwYXRjaE5hbWUiLCJmaW5kIiwiY29uY2F0IiwiX2Vuc3VyZU1vZGlmaWVkQnJhbmNoIiwiX2NhbGxlZTIiLCJyZXBvIiwiZXJyb3JJZk1pc3NpbmciLCJyZWxlYXNlQnJhbmNoZXMiLCJfYXJnczIiLCJfY2FsbGVlMiQiLCJfY29udGV4dDIiLCJ0MCIsInJlbGVhc2UiLCJlbnN1cmVNb2RpZmllZEJyYW5jaCIsIl94IiwiX3gyIiwidHJ5UmVtb3ZpbmdNb2RpZmllZEJyYW5jaCIsImlzVW51c2VkIiwiaW5kZXgiLCJpbmRleE9mIiwic3BsaWNlIiwia2VlcENhY2hlZFJlbGVhc2VCcmFuY2hlcyIsImNvbnNvbGUiLCJsb2ciLCJtYWludGVuYW5jZSIsImxvYWQiLCJfdG9Db25zdW1hYmxlQXJyYXkiLCJfY2hlY2tCcmFuY2hTdGF0dXMiLCJfY2FsbGVlNCIsImZpbHRlciIsIl9pdGVyYXRvciIsIl9zdGVwIiwiYnJhbmNoTWFwcyIsImdldEJyYW5jaE1hcEFzeW5jQ2FsbGJhY2siLCJfaXRlcmF0b3IyIiwiX3N0ZXAyIiwiX2l0ZXJhdG9yMyIsIl9zdGVwMyIsImxpbmUiLCJfY2FsbGVlNCQiLCJfY29udGV4dDQiLCJfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlciIsInQxIiwiX3JlZiIsIl9jYWxsZWUzIiwiX2NhbGxlZTMkIiwiX2NvbnRleHQzIiwiX3g0IiwidDIiLCJ0MyIsImdldFN0YXR1cyIsInQ0IiwidDUiLCJjaGVja0JyYW5jaFN0YXR1cyIsIl94MyIsIl9idWlsZEFsbCIsIl9jYWxsZWU1IiwiZmFpbGVkIiwiX2l0ZXJhdG9yNCIsIl9zdGVwNCIsIl9jYWxsZWU1JCIsIl9jb250ZXh0NSIsImJyYW5kcyIsImJyYW5kIiwiam9pbiIsImJ1aWxkQWxsIiwiX2xpc3QiLCJfY2FsbGVlNiIsIl9pdGVyYXRvcjUiLCJfc3RlcDUiLCJjb3VudCIsIl9pIiwiX09iamVjdCRrZXlzIiwiX2l0ZXJhdG9yNiIsIl9zdGVwNiIsIl9jb3VudCIsImluZGV4QW5kU3BhY2luZyIsIl9pdGVyYXRvcjciLCJfc3RlcDciLCJzaGEiLCJfaXRlcmF0b3I4IiwiX3N0ZXA4IiwiX21vZGlmaWVkQnJhbmNoIiwiX2NhbGxlZTYkIiwiX2NvbnRleHQ2IiwiaXNSZWxlYXNlZCIsImRlcGxveWVkVmVyc2lvbiIsInRvU3RyaW5nIiwibmVlZGVkUGF0Y2hlcyIsInB1c2hlZE1lc3NhZ2VzIiwicGVuZGluZ01lc3NhZ2VzIiwiY2hhbmdlZERlcGVuZGVuY2llcyIsIm1lc3NhZ2UiLCJzaGFzIiwiaW5jbHVkZXMiLCJsaXN0IiwiX2xpc3RMaW5rcyIsIl9jYWxsZWU3IiwiZGVwbG95ZWRCcmFuY2hlcyIsInByb2R1Y3Rpb25CcmFuY2hlcyIsInJlbGVhc2VDYW5kaWRhdGVCcmFuY2hlcyIsIl9pdGVyYXRvcjkiLCJfc3RlcDkiLCJsaW5rcyIsIl9pdGVyYXRvcjEwIiwiX3N0ZXAxMCIsImxpbmsiLCJfaXRlcmF0b3IxMSIsIl9zdGVwMTEiLCJfbW9kaWZpZWRCcmFuY2gyIiwiX2xpbmtzIiwiX2l0ZXJhdG9yMTIiLCJfc3RlcDEyIiwiX2xpbmsiLCJfYXJnczciLCJfY2FsbGVlNyQiLCJfY29udGV4dDciLCJ0ZXN0VHlwZSIsImdldERlcGxveWVkTGlua0xpbmVzIiwibGlzdExpbmtzIiwiX2NyZWF0ZVVucmVsZWFzZWRJc3N1ZXMiLCJfY2FsbGVlOCIsImFkZGl0aW9uYWxOb3RlcyIsIl9pdGVyYXRvcjEzIiwiX3N0ZXAxMyIsIl9hcmdzOCIsIl9jYWxsZWU4JCIsIl9jb250ZXh0OCIsImNyZWF0ZVVucmVsZWFzZWRJc3N1ZSIsImNyZWF0ZVVucmVsZWFzZWRJc3N1ZXMiLCJfY3JlYXRlUGF0Y2giLCJfY2FsbGVlOSIsIl9pdGVyYXRvcjE0IiwiX3N0ZXAxNCIsIl9jYWxsZWU5JCIsIl9jb250ZXh0OSIsImNyZWF0ZVBhdGNoIiwiX3g1IiwiX3g2IiwiX3g3IiwiX3JlbW92ZVBhdGNoIiwiX2NhbGxlZTEwIiwiX2l0ZXJhdG9yMTUiLCJfc3RlcDE1IiwiX2NhbGxlZTEwJCIsIl9jb250ZXh0MTAiLCJyZW1vdmVQYXRjaCIsIl94OCIsIl9hZGRQYXRjaFNIQSIsIl9jYWxsZWUxMSIsIl9jYWxsZWUxMSQiLCJfY29udGV4dDExIiwiYWRkUGF0Y2hTSEEiLCJfeDkiLCJfeDEwIiwiX3JlbW92ZVBhdGNoU0hBIiwiX2NhbGxlZTEyIiwiX2NhbGxlZTEyJCIsIl9jb250ZXh0MTIiLCJyZW1vdmVQYXRjaFNIQSIsIl94MTEiLCJfeDEyIiwiX3JlbW92ZUFsbFBhdGNoU0hBcyIsIl9jYWxsZWUxMyIsIl9pdGVyYXRvcjE2IiwiX3N0ZXAxNiIsIl9jYWxsZWUxMyQiLCJfY29udGV4dDEzIiwicmVtb3ZlQWxsUGF0Y2hTSEFzIiwiX3gxMyIsIl9hZGROZWVkZWRQYXRjaCIsIl9jYWxsZWUxNCIsIl9jYWxsZWUxNCQiLCJfY29udGV4dDE0IiwiYWRkTmVlZGVkUGF0Y2giLCJfeDE0IiwiX3gxNSIsIl94MTYiLCJfYWRkTmVlZGVkUGF0Y2hSZWxlYXNlQnJhbmNoIiwiX2NhbGxlZTE1IiwiX2NhbGxlZTE1JCIsIl9jb250ZXh0MTUiLCJhZGROZWVkZWRQYXRjaFJlbGVhc2VCcmFuY2giLCJfeDE3IiwiX3gxOCIsIl9hZGROZWVkZWRQYXRjaGVzIiwiX2NhbGxlZTE2IiwiX2l0ZXJhdG9yMTciLCJfc3RlcDE3IiwibmVlZHNQYXRjaCIsIl9jYWxsZWUxNiQiLCJfY29udGV4dDE2IiwiYWRkTmVlZGVkUGF0Y2hlcyIsIl94MTkiLCJfeDIwIiwiX2FkZEFsbE5lZWRlZFBhdGNoZXMiLCJfY2FsbGVlMTgiLCJfY2FsbGVlMTgkIiwiX2NvbnRleHQxOCIsIl9jYWxsZWUxNyIsIl9jYWxsZWUxNyQiLCJfY29udGV4dDE3IiwiYWRkQWxsTmVlZGVkUGF0Y2hlcyIsIl94MjEiLCJfYWRkTmVlZGVkUGF0Y2hlc0JlZm9yZSIsIl9jYWxsZWUyMCIsIl9jYWxsZWUyMCQiLCJfY29udGV4dDIwIiwiX3JlZjMiLCJfY2FsbGVlMTkiLCJfY2FsbGVlMTkkIiwiX2NvbnRleHQxOSIsImlzTWlzc2luZ1NIQSIsIl94MjQiLCJhZGROZWVkZWRQYXRjaGVzQmVmb3JlIiwiX3gyMiIsIl94MjMiLCJfYWRkTmVlZGVkUGF0Y2hlc0FmdGVyIiwiX2NhbGxlZTIyIiwiX2NhbGxlZTIyJCIsIl9jb250ZXh0MjIiLCJfcmVmNCIsIl9jYWxsZWUyMSIsIl9jYWxsZWUyMSQiLCJfY29udGV4dDIxIiwiaW5jbHVkZXNTSEEiLCJfeDI3IiwiYWRkTmVlZGVkUGF0Y2hlc0FmdGVyIiwiX3gyNSIsIl94MjYiLCJfYWRkTmVlZGVkUGF0Y2hlc0J1aWxkRmlsdGVyIiwiX2NhbGxlZTI0IiwiX2NhbGxlZTI0JCIsIl9jb250ZXh0MjQiLCJfcmVmNSIsIl9jYWxsZWUyMyIsImNoaXBwZXJWZXJzaW9uIiwiZmlsZW5hbWUiLCJfY2FsbGVlMjMkIiwiX2NvbnRleHQyMyIsImdldEZyb21SZXBvc2l0b3J5IiwibWFqb3IiLCJyZWFkRmlsZVN5bmMiLCJfeDMwIiwiYWRkTmVlZGVkUGF0Y2hlc0J1aWxkRmlsdGVyIiwiX3gyOCIsIl94MjkiLCJfcmVtb3ZlTmVlZGVkUGF0Y2giLCJfY2FsbGVlMjUiLCJfY2FsbGVlMjUkIiwiX2NvbnRleHQyNSIsInJlbW92ZU5lZWRlZFBhdGNoIiwiX3gzMSIsIl94MzIiLCJfeDMzIiwiX3JlbW92ZU5lZWRlZFBhdGNoZXMiLCJfY2FsbGVlMjYiLCJfaXRlcmF0b3IxOCIsIl9zdGVwMTgiLCJuZWVkc1JlbW92YWwiLCJfY2FsbGVlMjYkIiwiX2NvbnRleHQyNiIsInJlbW92ZU5lZWRlZFBhdGNoZXMiLCJfeDM0IiwiX3gzNSIsIl9yZW1vdmVOZWVkZWRQYXRjaGVzQmVmb3JlIiwiX2NhbGxlZTI4IiwiX2NhbGxlZTI4JCIsIl9jb250ZXh0MjgiLCJfcmVmNiIsIl9jYWxsZWUyNyIsIl9jYWxsZWUyNyQiLCJfY29udGV4dDI3IiwiX3gzOCIsInJlbW92ZU5lZWRlZFBhdGNoZXNCZWZvcmUiLCJfeDM2IiwiX3gzNyIsIl9yZW1vdmVOZWVkZWRQYXRjaGVzQWZ0ZXIiLCJfY2FsbGVlMzAiLCJfY2FsbGVlMzAkIiwiX2NvbnRleHQzMCIsIl9yZWY3IiwiX2NhbGxlZTI5IiwiX2NhbGxlZTI5JCIsIl9jb250ZXh0MjkiLCJfeDQxIiwicmVtb3ZlTmVlZGVkUGF0Y2hlc0FmdGVyIiwiX3gzOSIsIl94NDAiLCJzaW5nbGVGaWxlUmVsZWFzZUJyYW5jaEZpbHRlciIsImZpbGUiLCJwcmVkaWNhdGUiLCJfcmVmOCIsIl9jYWxsZWUzMSIsImNvbnRlbnRzIiwiX2NhbGxlZTMxJCIsIl9jb250ZXh0MzEiLCJjaGVja291dCIsImV4aXN0c1N5bmMiLCJfeDQyIiwiX2NoZWNrb3V0QnJhbmNoIiwiX2NhbGxlZTMyIiwib3V0cHV0SlMiLCJfYXJnczMyIiwiX2NhbGxlZTMyJCIsIl9jb250ZXh0MzIiLCJlcnJvcnMiLCJjaGVja291dEJyYW5jaCIsIl94NDMiLCJfeDQ0IiwiX2FwcGx5UGF0Y2hlcyIsIl9jYWxsZWUzMyIsIm51bUFwcGxpZWQiLCJfaXRlcmF0b3IxOSIsIl9zdGVwMTkiLCJfaXRlcmF0b3IyMCIsIl9zdGVwMjAiLCJwYXRjaFJlcG8iLCJkZXBlbmRlbmNpZXMiLCJfaXRlcmF0b3IyMSIsIl9zdGVwMjEiLCJfc2hhIiwiaGFzU2hhIiwiY2hlcnJ5UGlja1N1Y2Nlc3MiLCJjdXJyZW50U0hBIiwiX2NhbGxlZTMzJCIsIl9jb250ZXh0MzMiLCJjb2RlIiwiYXBwbHlQYXRjaGVzIiwiX3VwZGF0ZURlcGVuZGVuY2llcyIsIl9jYWxsZWUzNCIsIl9pdGVyYXRvcjIyIiwiX3N0ZXAyMiIsImNoYW5nZWRSZXBvcyIsImRlcGVuZGVuY2llc0pTT05GaWxlIiwiZGVwZW5kZW5jaWVzSlNPTiIsIl9pMiIsIl9jaGFuZ2VkUmVwb3MiLCJkZXBlbmRlbmN5IiwiZGVwZW5kZW5jeUJyYW5jaCIsImJyYW5jaGVzIiwiX2l0ZXJhdG9yMjMiLCJfc3RlcDIzIiwiX21lc3NhZ2UiLCJfY2FsbGVlMzQkIiwiX2NvbnRleHQzNCIsInBhcnNlIiwidXBkYXRlRGVwZW5kZW5jaWVzIiwiX3g0NSIsIl9kZXBsb3lSZWxlYXNlQ2FuZGlkYXRlcyIsIl9jYWxsZWUzNSIsIl9pdGVyYXRvcjI0IiwiX3N0ZXAyNCIsInZlcnNpb24iLCJfY2FsbGVlMzUkIiwiX2NvbnRleHQzNSIsImlzUmVhZHlGb3JSZWxlYXNlQ2FuZGlkYXRlIiwiZGVwbG95UmVsZWFzZUNhbmRpZGF0ZXMiLCJfeDQ2IiwiX2RlcGxveVByb2R1Y3Rpb24iLCJfY2FsbGVlMzYiLCJfaXRlcmF0b3IyNSIsIl9zdGVwMjUiLCJfY2FsbGVlMzYkIiwiX2NvbnRleHQzNiIsImlzUmVhZHlGb3JQcm9kdWN0aW9uIiwiZGVwbG95UHJvZHVjdGlvbiIsIl94NDciLCJfdXBkYXRlQ2hlY2tvdXRzIiwiX2NhbGxlZTM4Iiwib3B0aW9ucyIsImZpbHRlcmVkQnJhbmNoZXMiLCJfaXRlcmF0b3IyNiIsIl9zdGVwMjYiLCJhc3luY0Z1bmN0aW9ucyIsIl9jYWxsZWUzOCQiLCJfY29udGV4dDM4IiwibWVyZ2UiLCJjb25jdXJyZW50IiwidHJhbnNwaWxlIiwiYnVpbGRPcHRpb25zIiwibGludCIsIngiLCJfY2FsbGVlMzciLCJfY2FsbGVlMzckIiwiX2NvbnRleHQzNyIsInVwZGF0ZUNoZWNrb3V0IiwicGFyYWxsZWxMaW1pdCIsInVwZGF0ZUNoZWNrb3V0cyIsIl94NDgiLCJfeDQ5IiwiX2NoZWNrVW5idWlsdENoZWNrb3V0cyIsIl9jYWxsZWUzOSIsIl9pdGVyYXRvcjI3IiwiX3N0ZXAyNyIsInVuYnVpbHRSZXN1bHQiLCJfY2FsbGVlMzkkIiwiX2NvbnRleHQzOSIsImNoZWNrVW5idWlsdCIsImNoZWNrVW5idWlsdENoZWNrb3V0cyIsIl94NTAiLCJfY2hlY2tCdWlsdENoZWNrb3V0cyIsIl9jYWxsZWU0MCIsIl9pdGVyYXRvcjI4IiwiX3N0ZXAyOCIsImJ1aWx0UmVzdWx0IiwiX2NhbGxlZTQwJCIsIl9jb250ZXh0NDAiLCJjaGVja0J1aWx0IiwiY2hlY2tCdWlsdENoZWNrb3V0cyIsIl94NTEiLCJfcmVkZXBsb3lBbGxQcm9kdWN0aW9uIiwiX2NhbGxlZTQxIiwiX2l0ZXJhdG9yMjkiLCJfc3RlcDI5IiwiX2NhbGxlZTQxJCIsIl9jb250ZXh0NDEiLCJyZWRlcGxveUFsbFByb2R1Y3Rpb24iLCJfeDUyIiwiX3g1MyIsIl9nZXRNYWludGVuYW5jZUJyYW5jaGVzMiIsIl9jYWxsZWU0MiIsIl9hcmdzNDIiLCJfY2FsbGVlNDIkIiwiX2NvbnRleHQ0MiIsImxvYWRBbGxNYWludGVuYW5jZUJyYW5jaGVzIiwiX2xvYWRBbGxNYWludGVuYW5jZUJyYW5jaGVzIiwiX2NhbGxlZTQzIiwiX2FyZ3M0MyIsIl9jYWxsZWU0MyQiLCJfY29udGV4dDQzIiwiZ2V0QWxsTWFpbnRlbmFuY2VCcmFuY2hlcyIsImRlc2VyaWFsaXplIiwiX3JlZjEwIiwiX3JlZjEwJHBhdGNoZXMiLCJfcmVmMTAkbW9kaWZpZWRCcmFuY2giLCJfcmVmMTAkYWxsUmVsZWFzZUJyYW4iLCJkZXNlcmlhbGl6ZWRQYXRjaGVzIiwic29ydCIsImIiLCJkZXNlcmlhbGl6ZWRSZWxlYXNlQnJhbmNoZXMiLCJzdGFydFJFUEwiLCJ0cmFuc3BvcnRzIiwibGV2ZWwiLCJzZXNzaW9uIiwic3RhcnQiLCJwcm9tcHQiLCJ1c2VDb2xvcnMiLCJyZXBsTW9kZSIsIlJFUExfTU9ERV9TVFJJQ1QiLCJpZ25vcmVVbmRlZmluZWQiLCJub2RlRXZhbCIsImV2YWwiLCJfcmVmMTEiLCJfY2FsbGVlNDQiLCJjbWQiLCJjb250ZXh0IiwiY2FsbGJhY2siLCJfY2FsbGVlNDQkIiwiX2NvbnRleHQ0NCIsInJlc3VsdCIsInZhbCIsInN0YWNrIiwiX3g1NCIsIl94NTUiLCJfeDU2IiwiX3g1NyIsImdsb2JhbCIsImdldCIsInNldCIsIm0iLCJNIiwicmIiLCJvbiJdLCJzb3VyY2VzIjpbIk1haW50ZW5hbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUaGUgbWFpbiBwZXJzaXN0ZW50IHN0YXRlLWJlYXJpbmcgb2JqZWN0IGZvciBtYWludGVuYW5jZSByZWxlYXNlcy4gQ2FuIGJlIGxvYWRlZCBmcm9tIG9yIHNhdmVkIHRvIGEgZGVkaWNhdGVkIGZpbGUuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBwcm9kdWN0aW9uID0gcmVxdWlyZSggJy4uL2dydW50L3Byb2R1Y3Rpb24nICk7XHJcbmNvbnN0IHJjID0gcmVxdWlyZSggJy4uL2dydW50L3JjJyApO1xyXG5jb25zdCBDaGlwcGVyVmVyc2lvbiA9IHJlcXVpcmUoICcuL0NoaXBwZXJWZXJzaW9uJyApO1xyXG5jb25zdCBNb2RpZmllZEJyYW5jaCA9IHJlcXVpcmUoICcuL01vZGlmaWVkQnJhbmNoJyApO1xyXG5jb25zdCBQYXRjaCA9IHJlcXVpcmUoICcuL1BhdGNoJyApO1xyXG5jb25zdCBSZWxlYXNlQnJhbmNoID0gcmVxdWlyZSggJy4vUmVsZWFzZUJyYW5jaCcgKTtcclxuY29uc3QgYnVpbGQgPSByZXF1aXJlKCAnLi9idWlsZCcgKTtcclxuY29uc3QgY2hlY2tvdXRNYWluID0gcmVxdWlyZSggJy4vY2hlY2tvdXRNYWluJyApO1xyXG5jb25zdCBjaGVja291dFRhcmdldCA9IHJlcXVpcmUoICcuL2NoZWNrb3V0VGFyZ2V0JyApO1xyXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKTtcclxuY29uc3QgZ2V0QWN0aXZlUmVwb3MgPSByZXF1aXJlKCAnLi9nZXRBY3RpdmVSZXBvcycgKTtcclxuY29uc3QgZ2V0QnJhbmNoZXMgPSByZXF1aXJlKCAnLi9nZXRCcmFuY2hlcycgKTtcclxuY29uc3QgZ2V0QnJhbmNoTWFwID0gcmVxdWlyZSggJy4vZ2V0QnJhbmNoTWFwJyApO1xyXG5jb25zdCBnZXREZXBlbmRlbmNpZXMgPSByZXF1aXJlKCAnLi9nZXREZXBlbmRlbmNpZXMnICk7XHJcbmNvbnN0IGdpdEFkZCA9IHJlcXVpcmUoICcuL2dpdEFkZCcgKTtcclxuY29uc3QgZ2l0Q2hlY2tvdXQgPSByZXF1aXJlKCAnLi9naXRDaGVja291dCcgKTtcclxuY29uc3QgZ2l0Q2hlcnJ5UGljayA9IHJlcXVpcmUoICcuL2dpdENoZXJyeVBpY2snICk7XHJcbmNvbnN0IGdpdENvbW1pdCA9IHJlcXVpcmUoICcuL2dpdENvbW1pdCcgKTtcclxuY29uc3QgZ2l0Q3JlYXRlQnJhbmNoID0gcmVxdWlyZSggJy4vZ2l0Q3JlYXRlQnJhbmNoJyApO1xyXG5jb25zdCBnaXRJc0NsZWFuID0gcmVxdWlyZSggJy4vZ2l0SXNDbGVhbicgKTtcclxuY29uc3QgZ2l0UHVsbCA9IHJlcXVpcmUoICcuL2dpdFB1bGwnICk7XHJcbmNvbnN0IGdpdFB1c2ggPSByZXF1aXJlKCAnLi9naXRQdXNoJyApO1xyXG5jb25zdCBnaXRSZXZQYXJzZSA9IHJlcXVpcmUoICcuL2dpdFJldlBhcnNlJyApO1xyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5jb25zdCBhc3luY3EgPSByZXF1aXJlKCAnYXN5bmMtcScgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSByZXF1aXJlLXN0YXRlbWVudC1tYXRjaFxyXG5jb25zdCBfID0gcmVxdWlyZSggJ2xvZGFzaCcgKTtcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IHJlcGwgPSByZXF1aXJlKCAncmVwbCcgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5jb25zdCBncnVudENvbW1hbmQgPSByZXF1aXJlKCAnLi9ncnVudENvbW1hbmQnICk7XHJcbmNvbnN0IGNoaXBwZXJTdXBwb3J0c091dHB1dEpTR3J1bnRUYXNrcyA9IHJlcXVpcmUoICcuL2NoaXBwZXJTdXBwb3J0c091dHB1dEpTR3J1bnRUYXNrcycgKTtcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBNQUlOVEVOQU5DRV9GSUxFID0gJy5tYWludGVuYW5jZS5qc29uJztcclxuXHJcbi8vIGNvbnN0IFBVQkxJQ19GVU5DVElPTlMgPSBbXHJcbi8vICAgJ2FkZEFsbE5lZWRlZFBhdGNoZXMnLFxyXG4vLyAgICdhZGROZWVkZWRQYXRjaCcsXHJcbi8vICAgJ2FkZE5lZWRlZFBhdGNoZXMnLFxyXG4vLyAgICdhZGROZWVkZWRQYXRjaGVzQWZ0ZXInLFxyXG4vLyAgICdhZGROZWVkZWRQYXRjaGVzQmVmb3JlJyxcclxuLy8gICAnYWRkTmVlZGVkUGF0Y2hlc0J1aWxkRmlsdGVyJyxcclxuLy8gICAnYWRkTmVlZGVkUGF0Y2hSZWxlYXNlQnJhbmNoJyxcclxuLy8gICAnYWRkUGF0Y2hTSEEnLFxyXG4vLyAgICdhcHBseVBhdGNoZXMnLFxyXG4vLyAgICdidWlsZEFsbCcsXHJcbi8vICAgJ2NoZWNrQnJhbmNoU3RhdHVzJyxcclxuLy8gICAnY2hlY2tvdXRCcmFuY2gnLFxyXG4vLyAgICdjcmVhdGVQYXRjaCcsXHJcbi8vICAgJ2RlcGxveVByb2R1Y3Rpb24nLFxyXG4vLyAgICdkZXBsb3lSZWxlYXNlQ2FuZGlkYXRlcycsXHJcbi8vICAgJ2xpc3QnLFxyXG4vLyAgICdsaXN0TGlua3MnLFxyXG4vLyAgICdyZW1vdmVOZWVkZWRQYXRjaCcsXHJcbi8vICAgJ3JlbW92ZU5lZWRlZFBhdGNoZXMnLFxyXG4vLyAgICdyZW1vdmVOZWVkZWRQYXRjaGVzQWZ0ZXInLFxyXG4vLyAgICdyZW1vdmVOZWVkZWRQYXRjaGVzQmVmb3JlJyxcclxuLy8gICAncmVtb3ZlUGF0Y2gnLFxyXG4vLyAgICdyZW1vdmVQYXRjaFNIQScsXHJcbi8vICAgJ3Jlc2V0JyxcclxuLy8gICAndXBkYXRlRGVwZW5kZW5jaWVzJ1xyXG4vLyAgICdnZXRBbGxNYWludGVuYW5jZUJyYW5jaGVzJ1xyXG4vLyBdO1xyXG5cclxuLyoqXHJcbiAqIEB0eXBlZGVmIFNlcmlhbGl6ZWRNYWludGVuYW5jZSAtIHNlZSBNYWludGVuYW5jZS5zZXJpYWxpemUoKVxyXG4gKiBAcHJvcGVydHkge0FycmF5LjxPYmplY3Q+fSBwYXRjaGVzXHJcbiAqIEBwcm9wZXJ0eSB7QXJyYXkuPE9iamVjdD59IG1vZGlmaWVkQnJhbmNoZXNcclxuICogQHByb3BlcnR5IHtBcnJheS48T2JqZWN0Pn0gYWxsUmVsZWFzZUJyYW5jaGVzXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoIGZ1bmN0aW9uKCkge1xyXG5cclxuICBjbGFzcyBNYWludGVuYW5jZSB7XHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPFBhdGNoPn0gW3BhdGNoZXNdXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxNb2RpZmllZEJyYW5jaD59IFttb2RpZmllZEJyYW5jaGVzXVxyXG4gICAgICogQHBhcmFtICB7QXJyYXkuPFJlbGVhc2VCcmFuY2g+fSBbYWxsUmVsZWFzZUJyYW5jaGVzXVxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvciggcGF0Y2hlcyA9IFtdLCBtb2RpZmllZEJyYW5jaGVzID0gW10sIGFsbFJlbGVhc2VCcmFuY2hlcyA9IFtdICkge1xyXG4gICAgICBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIHBhdGNoZXMgKSApO1xyXG4gICAgICBwYXRjaGVzLmZvckVhY2goIHBhdGNoID0+IGFzc2VydCggcGF0Y2ggaW5zdGFuY2VvZiBQYXRjaCApICk7XHJcbiAgICAgIGFzc2VydCggQXJyYXkuaXNBcnJheSggbW9kaWZpZWRCcmFuY2hlcyApICk7XHJcbiAgICAgIG1vZGlmaWVkQnJhbmNoZXMuZm9yRWFjaCggYnJhbmNoID0+IGFzc2VydCggYnJhbmNoIGluc3RhbmNlb2YgTW9kaWZpZWRCcmFuY2ggKSApO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7QXJyYXkuPFBhdGNoPn1cclxuICAgICAgdGhpcy5wYXRjaGVzID0gcGF0Y2hlcztcclxuXHJcbiAgICAgIC8vIEBwdWJsaWMge0FycmF5LjxNb2RpZmllZEJyYW5jaD59XHJcbiAgICAgIHRoaXMubW9kaWZpZWRCcmFuY2hlcyA9IG1vZGlmaWVkQnJhbmNoZXM7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtBcnJheS48UmVsZWFzZUJyYW5jaD59XHJcbiAgICAgIHRoaXMuYWxsUmVsZWFzZUJyYW5jaGVzID0gYWxsUmVsZWFzZUJyYW5jaGVzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzZXRzIEFMTCB0aGUgbWFpbnRlbmFuY2Ugc3RhdGUgdG8gYSBkZWZhdWx0IFwiYmxhbmtcIiBzdGF0ZS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqIEBwYXJhbSBrZWVwQ2FjaGVkUmVsZWFzZUJyYW5jaGVzIHtib29sZWFufSAtIGFsbFJlbGVhc2VCcmFuY2hlcyB0YWtlIGEgd2hpbGUgdG8gcG9wdWxhdGUsIGFuZCBoYXZlIGxpdHRsZSB0byBkb1xyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aCB0aGUgY3VycmVudCBNUiwgc28gb3B0aW9uYWxseSBrZWVwIHRoZW0gaW4gc3RvcmFnZS5cclxuICAgICAqXHJcbiAgICAgKiBDQVVUSU9OOiBUaGlzIHdpbGwgcmVtb3ZlIGFueSBpbmZvcm1hdGlvbiBhYm91dCBhbnkgb25nb2luZy9jb21wbGV0ZSBtYWludGVuYW5jZSByZWxlYXNlIGZyb20geW91clxyXG4gICAgICogLm1haW50ZW5hbmNlLmpzb24uIEdlbmVyYWxseSB0aGlzIHNob3VsZCBiZSBkb25lIGJlZm9yZSBhbnkgbmV3IG1haW50ZW5hbmNlIHJlbGVhc2UuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyByZXNldCgga2VlcENhY2hlZFJlbGVhc2VCcmFuY2hlcyA9IGZhbHNlICkge1xyXG4gICAgICBjb25zb2xlLmxvZyggJ01ha2Ugc3VyZSB0byBjaGVjayBvbiB0aGUgYWN0aXZlIFBoRVQtaU8gRGVwbG95IFN0YXR1cyBvbiBwaGV0LmNvbG9yYWRvLmVkdSB0byBlbnN1cmUgdGhhdCB0aGUgJyArXHJcbiAgICAgICAgICAgICAgICAgICAncmlnaHQgUGhFVC1pTyBzaW1zIGFyZSBpbmNsdWRlZCBpbiB0aGlzIG1haW50ZW5hbmNlIHJlbGVhc2UuJyApO1xyXG5cclxuICAgICAgY29uc3QgYWxsUmVsZWFzZUJyYW5jaGVzID0gW107XHJcbiAgICAgIGlmICgga2VlcENhY2hlZFJlbGVhc2VCcmFuY2hlcyApIHtcclxuICAgICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuICAgICAgICBhbGxSZWxlYXNlQnJhbmNoZXMucHVzaCggLi4ubWFpbnRlbmFuY2UuYWxsUmVsZWFzZUJyYW5jaGVzICk7XHJcbiAgICAgIH1cclxuICAgICAgbmV3IE1haW50ZW5hbmNlKCBbXSwgW10sIGFsbFJlbGVhc2VCcmFuY2hlcyApLnNhdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJ1bnMgYSBudW1iZXIgb2YgY2hlY2tzIHRocm91Z2ggZXZlcnkgcmVsZWFzZSBicmFuY2guXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihSZWxlYXNlQnJhbmNoKTpQcm9taXNlLjxib29sZWFuPn0gW2ZpbHRlcl0gLSBPcHRpb25hbCBmaWx0ZXIsIHJlbGVhc2UgYnJhbmNoZXMgd2lsbCBiZSBza2lwcGVkXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRoaXMgcmVzb2x2ZXMgdG8gZmFsc2VcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgY2hlY2tCcmFuY2hTdGF0dXMoIGZpbHRlciApIHtcclxuICAgICAgZm9yICggY29uc3QgcmVwbyBvZiBnZXRBY3RpdmVSZXBvcygpICkge1xyXG4gICAgICAgIGlmICggcmVwbyAhPT0gJ3BlcmVubmlhbCcgJiYgISggYXdhaXQgZ2l0SXNDbGVhbiggcmVwbyApICkgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYFVuY2xlYW4gcmVwb3NpdG9yeTogJHtyZXBvfSwgcGxlYXNlIHJlc29sdmUgdGhpcyBhbmQgdGhlbiBydW4gY2hlY2tCcmFuY2hTdGF0dXMgYWdhaW5gICk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCByZWxlYXNlQnJhbmNoZXMgPSBhd2FpdCBNYWludGVuYW5jZS5nZXRNYWludGVuYW5jZUJyYW5jaGVzKCBmaWx0ZXIgKTtcclxuXHJcbiAgICAgIC8vIFNldCB1cCBhIGNhY2hlIG9mIGJyYW5jaE1hcHMgc28gdGhhdCB3ZSBkb24ndCBtYWtlIG11bHRpcGxlIHJlcXVlc3RzXHJcbiAgICAgIGNvbnN0IGJyYW5jaE1hcHMgPSB7fTtcclxuICAgICAgY29uc3QgZ2V0QnJhbmNoTWFwQXN5bmNDYWxsYmFjayA9IGFzeW5jIHJlcG8gPT4ge1xyXG4gICAgICAgIGlmICggIWJyYW5jaE1hcHNbIHJlcG8gXSApIHtcclxuICAgICAgICAgIGJyYW5jaE1hcHNbIHJlcG8gXSA9IGF3YWl0IGdldEJyYW5jaE1hcCggcmVwbyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYnJhbmNoTWFwc1sgcmVwbyBdO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgZm9yICggY29uc3QgcmVsZWFzZUJyYW5jaCBvZiByZWxlYXNlQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgaWYgKCAhZmlsdGVyIHx8IGF3YWl0IGZpbHRlciggcmVsZWFzZUJyYW5jaCApICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIGAke3JlbGVhc2VCcmFuY2gucmVwb30gJHtyZWxlYXNlQnJhbmNoLmJyYW5jaH1gICk7XHJcbiAgICAgICAgICBmb3IgKCBjb25zdCBsaW5lIG9mIGF3YWl0IHJlbGVhc2VCcmFuY2guZ2V0U3RhdHVzKCBnZXRCcmFuY2hNYXBBc3luY0NhbGxiYWNrICkgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgICAke2xpbmV9YCApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgJHtyZWxlYXNlQnJhbmNoLnJlcG99ICR7cmVsZWFzZUJyYW5jaC5icmFuY2h9IChza2lwcGluZyBkdWUgdG8gZmlsdGVyKWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEJ1aWxkcyBhbGwgcmVsZWFzZSBicmFuY2hlcyAoc28gdGhhdCB0aGUgc3RhdGUgb2YgdGhpbmdzIGNhbiBiZSBjaGVja2VkKS4gUHV0cyBpbiBpbiBwZXJlbm5pYWwvYnVpbGQuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBidWlsZEFsbCgpIHtcclxuICAgICAgY29uc3QgcmVsZWFzZUJyYW5jaGVzID0gYXdhaXQgTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcygpO1xyXG5cclxuICAgICAgY29uc3QgZmFpbGVkID0gW107XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCByZWxlYXNlQnJhbmNoIG9mIHJlbGVhc2VCcmFuY2hlcyApIHtcclxuICAgICAgICBjb25zb2xlLmxvZyggYGJ1aWxkaW5nICR7cmVsZWFzZUJyYW5jaC5yZXBvfSAke3JlbGVhc2VCcmFuY2guYnJhbmNofWAgKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgYXdhaXQgY2hlY2tvdXRUYXJnZXQoIHJlbGVhc2VCcmFuY2gucmVwbywgcmVsZWFzZUJyYW5jaC5icmFuY2gsIHRydWUgKTsgLy8gaW5jbHVkZSBucG0gdXBkYXRlXHJcbiAgICAgICAgICBhd2FpdCBidWlsZCggcmVsZWFzZUJyYW5jaC5yZXBvLCB7XHJcbiAgICAgICAgICAgIGJyYW5kczogcmVsZWFzZUJyYW5jaC5icmFuZHNcclxuICAgICAgICAgIH0gKTtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ1VOSU1QTEVNRU5URUQsIGNvcHkgb3ZlcicgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICBmYWlsZWQucHVzaCggYCR7cmVsZWFzZUJyYW5jaC5yZXBvfSAke3JlbGVhc2VCcmFuY2guYnJhbmR9YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCBmYWlsZWQubGVuZ3RoICkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCBgRmFpbGVkIGJ1aWxkczpcXG4ke2ZhaWxlZC5qb2luKCAnXFxuJyApfWAgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZyggJ0J1aWxkcyBjb21wbGV0ZScgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGlzcGxheXMgYSBsaXN0aW5nIG9mIHRoZSBjdXJyZW50IG1haW50ZW5hbmNlIHN0YXR1cy5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGxpc3QoKSB7XHJcbiAgICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xyXG5cclxuICAgICAgLy8gQXQgdGhlIHRvcCBzbyB0aGF0IHRoZSBpbXBvcnRhbnQgaXRlbXMgYXJlIHJpZ2h0IGFib3ZlIHlvdXIgY3Vyc29yIGFmdGVyIGNhbGxpbmcgdGhlIGZ1bmN0aW9uXHJcbiAgICAgIGlmICggbWFpbnRlbmFuY2UuYWxsUmVsZWFzZUJyYW5jaGVzLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coIGBUb3RhbCByZWNvZ25pemVkIFJlbGVhc2VCcmFuY2hlczogJHttYWludGVuYW5jZS5hbGxSZWxlYXNlQnJhbmNoZXMubGVuZ3RofWAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc29sZS5sb2coICdcXG5SZWxlYXNlIEJyYW5jaGVzIGluIE1SOicsIG1haW50ZW5hbmNlLnBhdGNoZXMubGVuZ3RoID09PSAwID8gJ05vbmUnIDogJycgKTtcclxuICAgICAgZm9yICggY29uc3QgbW9kaWZpZWRCcmFuY2ggb2YgbWFpbnRlbmFuY2UubW9kaWZpZWRCcmFuY2hlcyApIHtcclxuICAgICAgICBjb25zdCBjb3VudCA9IG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMuaW5kZXhPZiggbW9kaWZpZWRCcmFuY2ggKSArIDE7XHJcbiAgICAgICAgY29uc29sZS5sb2coIGAke2NvdW50fS4gJHttb2RpZmllZEJyYW5jaC5yZXBvfSAke21vZGlmaWVkQnJhbmNoLmJyYW5jaH0gJHttb2RpZmllZEJyYW5jaC5icmFuZHMuam9pbiggJywnICl9JHttb2RpZmllZEJyYW5jaC5yZWxlYXNlQnJhbmNoLmlzUmVsZWFzZWQgPyAnJyA6ICcgKHVucmVsZWFzZWQpJ31gICk7XHJcbiAgICAgICAgaWYgKCBtb2RpZmllZEJyYW5jaC5kZXBsb3llZFZlcnNpb24gKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgICBkZXBsb3llZDogJHttb2RpZmllZEJyYW5jaC5kZXBsb3llZFZlcnNpb24udG9TdHJpbmcoKX1gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5sZW5ndGggKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgICBuZWVkczogJHttb2RpZmllZEJyYW5jaC5uZWVkZWRQYXRjaGVzLm1hcCggcGF0Y2ggPT4gcGF0Y2gubmFtZSApLmpvaW4oICcsJyApfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBtb2RpZmllZEJyYW5jaC5wdXNoZWRNZXNzYWdlcy5sZW5ndGggKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgICBwdXNoZWRNZXNzYWdlczogXFxuICAgICAgJHttb2RpZmllZEJyYW5jaC5wdXNoZWRNZXNzYWdlcy5qb2luKCAnXFxuICAgICAgJyApfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBtb2RpZmllZEJyYW5jaC5wZW5kaW5nTWVzc2FnZXMubGVuZ3RoICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIGAgICAgcGVuZGluZ01lc3NhZ2VzOiBcXG4gICAgICAke21vZGlmaWVkQnJhbmNoLnBlbmRpbmdNZXNzYWdlcy5qb2luKCAnXFxuICAgICAgJyApfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBPYmplY3Qua2V5cyggbW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llcyApLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggJyAgICBkZXBzOicgKTtcclxuICAgICAgICAgIGZvciAoIGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyggbW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llcyApICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggYCAgICAgICR7a2V5fTogJHttb2RpZmllZEJyYW5jaC5jaGFuZ2VkRGVwZW5kZW5jaWVzWyBrZXkgXX1gICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggJ1xcbk1haW50ZW5hbmNlIFBhdGNoZXMgaW4gTVI6JywgbWFpbnRlbmFuY2UucGF0Y2hlcy5sZW5ndGggPT09IDAgPyAnTm9uZScgOiAnJyApO1xyXG4gICAgICBmb3IgKCBjb25zdCBwYXRjaCBvZiBtYWludGVuYW5jZS5wYXRjaGVzICkge1xyXG4gICAgICAgIGNvbnN0IGNvdW50ID0gbWFpbnRlbmFuY2UucGF0Y2hlcy5pbmRleE9mKCBwYXRjaCApICsgMTtcclxuICAgICAgICBjb25zdCBpbmRleEFuZFNwYWNpbmcgPSBgJHtjb3VudH0uIGAgKyAoIGNvdW50ID4gOSA/ICcnIDogJyAnICk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCBgJHtpbmRleEFuZFNwYWNpbmd9WyR7cGF0Y2gubmFtZX1dJHtwYXRjaC5uYW1lICE9PSBwYXRjaC5yZXBvID8gYCAoJHtwYXRjaC5yZXBvfSlgIDogJyd9ICR7cGF0Y2gubWVzc2FnZX1gICk7XHJcbiAgICAgICAgZm9yICggY29uc3Qgc2hhIG9mIHBhdGNoLnNoYXMgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgICAgICR7c2hhfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICggY29uc3QgbW9kaWZpZWRCcmFuY2ggb2YgbWFpbnRlbmFuY2UubW9kaWZpZWRCcmFuY2hlcyApIHtcclxuICAgICAgICAgIGlmICggbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5pbmNsdWRlcyggcGF0Y2ggKSApIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coIGAgICAgICAgICR7bW9kaWZpZWRCcmFuY2gucmVwb30gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9ICR7bW9kaWZpZWRCcmFuY2guYnJhbmRzLmpvaW4oICcsJyApfWAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNob3dzIGFueSByZXF1aXJlZCB0ZXN0aW5nIGxpbmtzIGZvciB0aGUgc2ltdWxhdGlvbnMuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihNb2RpZmllZEJyYW5jaCk6Ym9vbGVhbn0gW2ZpbHRlcl0gLSBDb250cm9sIHdoaWNoIGJyYW5jaGVzIGFyZSBzaG93blxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgbGlzdExpbmtzKCBmaWx0ZXIgPSAoKSA9PiB0cnVlICkge1xyXG4gICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuXHJcbiAgICAgIGNvbnN0IGRlcGxveWVkQnJhbmNoZXMgPSBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzLmZpbHRlciggbW9kaWZpZWRCcmFuY2ggPT4gISFtb2RpZmllZEJyYW5jaC5kZXBsb3llZFZlcnNpb24gJiYgZmlsdGVyKCBtb2RpZmllZEJyYW5jaCApICk7XHJcbiAgICAgIGNvbnN0IHByb2R1Y3Rpb25CcmFuY2hlcyA9IGRlcGxveWVkQnJhbmNoZXMuZmlsdGVyKCBtb2RpZmllZEJyYW5jaCA9PiBtb2RpZmllZEJyYW5jaC5kZXBsb3llZFZlcnNpb24udGVzdFR5cGUgPT09IG51bGwgKTtcclxuICAgICAgY29uc3QgcmVsZWFzZUNhbmRpZGF0ZUJyYW5jaGVzID0gZGVwbG95ZWRCcmFuY2hlcy5maWx0ZXIoIG1vZGlmaWVkQnJhbmNoID0+IG1vZGlmaWVkQnJhbmNoLmRlcGxveWVkVmVyc2lvbi50ZXN0VHlwZSA9PT0gJ3JjJyApO1xyXG5cclxuICAgICAgaWYgKCBwcm9kdWN0aW9uQnJhbmNoZXMubGVuZ3RoICkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCAnXFxuUHJvZHVjdGlvbiBsaW5rc1xcbicgKTtcclxuXHJcbiAgICAgICAgZm9yICggY29uc3QgbW9kaWZpZWRCcmFuY2ggb2YgcHJvZHVjdGlvbkJyYW5jaGVzICkge1xyXG4gICAgICAgICAgY29uc3QgbGlua3MgPSBhd2FpdCBtb2RpZmllZEJyYW5jaC5nZXREZXBsb3llZExpbmtMaW5lcygpO1xyXG4gICAgICAgICAgZm9yICggY29uc3QgbGluayBvZiBsaW5rcyApIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coIGxpbmsgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggcmVsZWFzZUNhbmRpZGF0ZUJyYW5jaGVzLmxlbmd0aCApIHtcclxuICAgICAgICBjb25zb2xlLmxvZyggJ1xcblJlbGVhc2UgQ2FuZGlkYXRlIGxpbmtzXFxuJyApO1xyXG5cclxuICAgICAgICBmb3IgKCBjb25zdCBtb2RpZmllZEJyYW5jaCBvZiByZWxlYXNlQ2FuZGlkYXRlQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgICBjb25zdCBsaW5rcyA9IGF3YWl0IG1vZGlmaWVkQnJhbmNoLmdldERlcGxveWVkTGlua0xpbmVzKCk7XHJcbiAgICAgICAgICBmb3IgKCBjb25zdCBsaW5rIG9mIGxpbmtzICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggbGluayApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhbiBpc3N1ZSB0byBub3RlIHBhdGNoZXMgb24gYWxsIHVucmVsZWFzZWQgYnJhbmNoZXMgdGhhdCBpbmNsdWRlIGEgcHVzaGVkIG1lc3NhZ2UuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFthZGRpdGlvbmFsTm90ZXNdXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBjcmVhdGVVbnJlbGVhc2VkSXNzdWVzKCBhZGRpdGlvbmFsTm90ZXMgPSAnJyApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBtb2RpZmllZEJyYW5jaCBvZiBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzICkge1xyXG4gICAgICAgIGlmICggIW1vZGlmaWVkQnJhbmNoLnJlbGVhc2VCcmFuY2guaXNSZWxlYXNlZCAmJiBtb2RpZmllZEJyYW5jaC5wdXNoZWRNZXNzYWdlcy5sZW5ndGggPiAwICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIGBDcmVhdGluZyBpc3N1ZSBmb3IgJHttb2RpZmllZEJyYW5jaC5yZWxlYXNlQnJhbmNoLnRvU3RyaW5nKCl9YCApO1xyXG4gICAgICAgICAgYXdhaXQgbW9kaWZpZWRCcmFuY2guY3JlYXRlVW5yZWxlYXNlZElzc3VlKCBhZGRpdGlvbmFsTm90ZXMgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnRmluaXNoZWQgY3JlYXRpbmcgdW5yZWxlYXNlZCBpc3N1ZXMnICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGEgcGF0Y2hcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbcGF0Y2hOYW1lXSAtIElmIG5vIG5hbWUgaXMgcHJvdmlkZWQsIHRoZSByZXBvIHN0cmluZyB3aWxsIGJlIHVzZWQuXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGNyZWF0ZVBhdGNoKCByZXBvLCBtZXNzYWdlLCBwYXRjaE5hbWUgKSB7XHJcbiAgICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xyXG5cclxuICAgICAgcGF0Y2hOYW1lID0gcGF0Y2hOYW1lIHx8IHJlcG87XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBwYXRjaCBvZiBtYWludGVuYW5jZS5wYXRjaGVzICkge1xyXG4gICAgICAgIGlmICggcGF0Y2gubmFtZSA9PT0gcGF0Y2hOYW1lICkge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnTXVsdGlwbGUgcGF0Y2hlcyB3aXRoIHRoZSBzYW1lIG5hbWUgYXJlIG5vdCBjb25jdXJyZW50bHkgc3VwcG9ydGVkJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgbWFpbnRlbmFuY2UucGF0Y2hlcy5wdXNoKCBuZXcgUGF0Y2goIHJlcG8sIHBhdGNoTmFtZSwgbWVzc2FnZSApICk7XHJcblxyXG4gICAgICBtYWludGVuYW5jZS5zYXZlKCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggYENyZWF0ZWQgcGF0Y2ggZm9yICR7cmVwb30gd2l0aCBtZXNzYWdlOiAke21lc3NhZ2V9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBhIHBhdGNoXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGNoTmFtZVxyXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyByZW1vdmVQYXRjaCggcGF0Y2hOYW1lICkge1xyXG4gICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuXHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGZvciAoIGNvbnN0IGJyYW5jaCBvZiBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzICkge1xyXG4gICAgICAgIGlmICggYnJhbmNoLm5lZWRlZFBhdGNoZXMuaW5jbHVkZXMoIHBhdGNoICkgKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdQYXRjaCBpcyBtYXJrZWQgYXMgbmVlZGVkIGJ5IGF0IGxlYXN0IG9uZSBicmFuY2gnICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBtYWludGVuYW5jZS5wYXRjaGVzLnNwbGljZSggbWFpbnRlbmFuY2UucGF0Y2hlcy5pbmRleE9mKCBwYXRjaCApLCAxICk7XHJcblxyXG4gICAgICBtYWludGVuYW5jZS5zYXZlKCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggYFJlbW92ZWQgcGF0Y2ggZm9yICR7cGF0Y2hOYW1lfWAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBwYXJ0aWN1bGFyIFNIQSAodG8gY2hlcnJ5LXBpY2spIHRvIGEgcGF0Y2guXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGNoTmFtZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtzaGFdXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGFkZFBhdGNoU0hBKCBwYXRjaE5hbWUsIHNoYSApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcblxyXG4gICAgICBjb25zdCBwYXRjaCA9IG1haW50ZW5hbmNlLmZpbmRQYXRjaCggcGF0Y2hOYW1lICk7XHJcblxyXG4gICAgICBpZiAoICFzaGEgKSB7XHJcbiAgICAgICAgc2hhID0gYXdhaXQgZ2l0UmV2UGFyc2UoIHBhdGNoLnJlcG8sICdIRUFEJyApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCBgU0hBIG5vdCBwcm92aWRlZCwgZGV0ZWN0aW5nIFNIQTogJHtzaGF9YCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwYXRjaC5zaGFzLnB1c2goIHNoYSApO1xyXG5cclxuICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coIGBBZGRlZCBTSEEgJHtzaGF9IHRvIHBhdGNoICR7cGF0Y2hOYW1lfWAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZXMgYSBwYXJ0aWN1bGFyIFNIQSAodG8gY2hlcnJ5LXBpY2spIGZyb20gYSBwYXRjaC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2hhXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIHJlbW92ZVBhdGNoU0hBKCBwYXRjaE5hbWUsIHNoYSApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcblxyXG4gICAgICBjb25zdCBwYXRjaCA9IG1haW50ZW5hbmNlLmZpbmRQYXRjaCggcGF0Y2hOYW1lICk7XHJcblxyXG4gICAgICBjb25zdCBpbmRleCA9IHBhdGNoLnNoYXMuaW5kZXhPZiggc2hhICk7XHJcbiAgICAgIGFzc2VydCggaW5kZXggPj0gMCwgJ1NIQSBub3QgZm91bmQnICk7XHJcblxyXG4gICAgICBwYXRjaC5zaGFzLnNwbGljZSggaW5kZXgsIDEgKTtcclxuXHJcbiAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCBgUmVtb3ZlZCBTSEEgJHtzaGF9IGZyb20gcGF0Y2ggJHtwYXRjaE5hbWV9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBhbGwgcGF0Y2ggU0hBcyBmb3IgYSBwYXJ0aWN1bGFyIHBhdGNoLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRjaE5hbWVcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgcmVtb3ZlQWxsUGF0Y2hTSEFzKCBwYXRjaE5hbWUgKSB7XHJcbiAgICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xyXG5cclxuICAgICAgY29uc3QgcGF0Y2ggPSBtYWludGVuYW5jZS5maW5kUGF0Y2goIHBhdGNoTmFtZSApO1xyXG5cclxuICAgICAgZm9yICggY29uc3Qgc2hhIG9mIHBhdGNoLnNoYXMgKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coIGBSZW1vdmluZyBTSEEgJHtzaGF9IGZyb20gcGF0Y2ggJHtwYXRjaE5hbWV9YCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwYXRjaC5zaGFzID0gW107XHJcblxyXG4gICAgICBtYWludGVuYW5jZS5zYXZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIGEgbmVlZGVkIHBhdGNoIHRvIGEgZ2l2ZW4gbW9kaWZpZWQgYnJhbmNoLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBhZGROZWVkZWRQYXRjaCggcmVwbywgYnJhbmNoLCBwYXRjaE5hbWUgKSB7XHJcbiAgICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xyXG5cclxuICAgICAgY29uc3QgcGF0Y2ggPSBtYWludGVuYW5jZS5maW5kUGF0Y2goIHBhdGNoTmFtZSApO1xyXG5cclxuICAgICAgY29uc3QgbW9kaWZpZWRCcmFuY2ggPSBhd2FpdCBtYWludGVuYW5jZS5lbnN1cmVNb2RpZmllZEJyYW5jaCggcmVwbywgYnJhbmNoICk7XHJcbiAgICAgIG1vZGlmaWVkQnJhbmNoLm5lZWRlZFBhdGNoZXMucHVzaCggcGF0Y2ggKTtcclxuXHJcbiAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCBgQWRkZWQgcGF0Y2ggJHtwYXRjaE5hbWV9IGFzIG5lZWRlZCBmb3IgJHtyZXBvfSAke2JyYW5jaH1gICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIGEgbmVlZGVkIHBhdGNoIHRvIGEgZ2l2ZW4gcmVsZWFzZSBicmFuY2hcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1JlbGVhc2VCcmFuY2h9IHJlbGVhc2VCcmFuY2hcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRjaE5hbWVcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGFkZE5lZWRlZFBhdGNoUmVsZWFzZUJyYW5jaCggcmVsZWFzZUJyYW5jaCwgcGF0Y2hOYW1lICkge1xyXG4gICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuXHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGNvbnN0IG1vZGlmaWVkQnJhbmNoID0gbmV3IE1vZGlmaWVkQnJhbmNoKCByZWxlYXNlQnJhbmNoICk7XHJcbiAgICAgIG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMucHVzaCggbW9kaWZpZWRCcmFuY2ggKTtcclxuICAgICAgbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5wdXNoKCBwYXRjaCApO1xyXG4gICAgICBtYWludGVuYW5jZS5zYXZlKCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggYEFkZGVkIHBhdGNoICR7cGF0Y2hOYW1lfSBhcyBuZWVkZWQgZm9yICR7cmVsZWFzZUJyYW5jaC5yZXBvfSAke3JlbGVhc2VCcmFuY2guYnJhbmNofWAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBuZWVkZWQgcGF0Y2ggdG8gd2hhdGV2ZXIgc3Vic2V0IG9mIHJlbGVhc2UgYnJhbmNoZXMgbWF0Y2ggdGhlIGZpbHRlci5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKFJlbGVhc2VCcmFuY2gpOlByb21pc2UuPGJvb2xlYW4+fSBmaWx0ZXJcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGFkZE5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgZmlsdGVyICkge1xyXG5cclxuICAgICAgLy8gZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcyBuZWVkcyB0byBjYWNoZSBpdHMgYnJhbmNoZXMgYW5kIG1haW50ZW5hbmNlLnNhdmUoKSB0aGVtLCBzbyBkbyBpdCBiZWZvcmUgbG9hZGluZ1xyXG4gICAgICAvLyBNYWludGVuYW5jZSBmb3IgdGhpcyBmdW5jdGlvbi5cclxuICAgICAgY29uc3QgcmVsZWFzZUJyYW5jaGVzID0gYXdhaXQgTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcygpO1xyXG4gICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuXHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGxldCBjb3VudCA9IDA7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCByZWxlYXNlQnJhbmNoIG9mIHJlbGVhc2VCcmFuY2hlcyApIHtcclxuICAgICAgICBjb25zdCBuZWVkc1BhdGNoID0gYXdhaXQgZmlsdGVyKCByZWxlYXNlQnJhbmNoICk7XHJcblxyXG4gICAgICAgIGlmICggIW5lZWRzUGF0Y2ggKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgc2tpcHBpbmcgJHtyZWxlYXNlQnJhbmNoLnJlcG99ICR7cmVsZWFzZUJyYW5jaC5icmFuY2h9YCApO1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBtb2RpZmllZEJyYW5jaCA9IGF3YWl0IG1haW50ZW5hbmNlLmVuc3VyZU1vZGlmaWVkQnJhbmNoKCByZWxlYXNlQnJhbmNoLnJlcG8sIHJlbGVhc2VCcmFuY2guYnJhbmNoLCBmYWxzZSwgcmVsZWFzZUJyYW5jaGVzICk7XHJcbiAgICAgICAgaWYgKCAhbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5pbmNsdWRlcyggcGF0Y2ggKSApIHtcclxuICAgICAgICAgIG1vZGlmaWVkQnJhbmNoLm5lZWRlZFBhdGNoZXMucHVzaCggcGF0Y2ggKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgQWRkZWQgbmVlZGVkIHBhdGNoICR7cGF0Y2hOYW1lfSB0byAke3JlbGVhc2VCcmFuY2gucmVwb30gJHtyZWxlYXNlQnJhbmNoLmJyYW5jaH1gICk7XHJcbiAgICAgICAgICBjb3VudCsrO1xyXG4gICAgICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpOyAvLyBzYXZlIGhlcmUgaW4gY2FzZSBhIGZ1dHVyZSBmYWlsdXJlIHdvdWxkIFwicmV2ZXJ0XCIgdGhpbmdzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIGBQYXRjaCAke3BhdGNoTmFtZX0gYWxyZWFkeSBpbmNsdWRlZCBpbiAke3JlbGVhc2VCcmFuY2gucmVwb30gJHtyZWxlYXNlQnJhbmNoLmJyYW5jaH1gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggYEFkZGVkICR7Y291bnR9IHJlbGVhc2VCcmFuY2hlcyB0byBwYXRjaDogJHtwYXRjaE5hbWV9YCApO1xyXG5cclxuICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIG5lZWRlZCBwYXRjaCB0byBhbGwgcmVsZWFzZSBicmFuY2hlcy5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBhZGRBbGxOZWVkZWRQYXRjaGVzKCBwYXRjaE5hbWUgKSB7XHJcbiAgICAgIGF3YWl0IE1haW50ZW5hbmNlLmFkZE5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgYXN5bmMgKCkgPT4gdHJ1ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIG5lZWRlZCBwYXRjaCB0byBhbGwgcmVsZWFzZSBicmFuY2hlcyB0aGF0IGRvIE5PVCBpbmNsdWRlIHRoZSBnaXZlbiBjb21taXQgb24gdGhlIHJlcG9cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2hhXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBhZGROZWVkZWRQYXRjaGVzQmVmb3JlKCBwYXRjaE5hbWUsIHNoYSApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGF3YWl0IE1haW50ZW5hbmNlLmFkZE5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgYXN5bmMgcmVsZWFzZUJyYW5jaCA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJlbGVhc2VCcmFuY2guaXNNaXNzaW5nU0hBKCBwYXRjaC5yZXBvLCBzaGEgKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIG5lZWRlZCBwYXRjaCB0byBhbGwgcmVsZWFzZSBicmFuY2hlcyB0aGF0IERPIGluY2x1ZGUgdGhlIGdpdmVuIGNvbW1pdCBvbiB0aGUgcmVwb1xyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRjaE5hbWVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzaGFcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGFkZE5lZWRlZFBhdGNoZXNBZnRlciggcGF0Y2hOYW1lLCBzaGEgKSB7XHJcbiAgICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xyXG4gICAgICBjb25zdCBwYXRjaCA9IG1haW50ZW5hbmNlLmZpbmRQYXRjaCggcGF0Y2hOYW1lICk7XHJcblxyXG4gICAgICBhd2FpdCBNYWludGVuYW5jZS5hZGROZWVkZWRQYXRjaGVzKCBwYXRjaE5hbWUsIGFzeW5jIHJlbGVhc2VCcmFuY2ggPT4ge1xyXG4gICAgICAgIHJldHVybiByZWxlYXNlQnJhbmNoLmluY2x1ZGVzU0hBKCBwYXRjaC5yZXBvLCBzaGEgKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIG5lZWRlZCBwYXRjaCB0byBhbGwgcmVsZWFzZSBicmFuY2hlcyB0aGF0IHNhdGlzZnkgdGhlIGdpdmVuIGZpbHRlciggcmVsZWFzZUJyYW5jaCwgYnVpbHRGaWxlU3RyaW5nIClcclxuICAgICAqIHdoZXJlIGl0IGJ1aWxkcyB0aGUgc2ltdWxhdGlvbiB3aXRoIHRoZSBkZWZhdWx0cyAoYnJhbmQ9cGhldCkgYW5kIHByb3ZpZGVzIGl0IGFzIGEgc3RyaW5nLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRjaE5hbWVcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oUmVsZWFzZUJyYW5jaCwgYnVpbHRGaWxlOnN0cmluZyk6IFByb21pc2UuPGJvb2xlYW4+fSBmaWx0ZXJcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGFkZE5lZWRlZFBhdGNoZXNCdWlsZEZpbHRlciggcGF0Y2hOYW1lLCBmaWx0ZXIgKSB7XHJcbiAgICAgIGF3YWl0IE1haW50ZW5hbmNlLmFkZE5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgYXN5bmMgcmVsZWFzZUJyYW5jaCA9PiB7XHJcbiAgICAgICAgYXdhaXQgY2hlY2tvdXRUYXJnZXQoIHJlbGVhc2VCcmFuY2gucmVwbywgcmVsZWFzZUJyYW5jaC5icmFuY2gsIHRydWUgKTtcclxuICAgICAgICBhd2FpdCBnaXRQdWxsKCByZWxlYXNlQnJhbmNoLnJlcG8gKTtcclxuICAgICAgICBhd2FpdCBidWlsZCggcmVsZWFzZUJyYW5jaC5yZXBvICk7XHJcbiAgICAgICAgY29uc3QgY2hpcHBlclZlcnNpb24gPSBDaGlwcGVyVmVyc2lvbi5nZXRGcm9tUmVwb3NpdG9yeSgpO1xyXG4gICAgICAgIGxldCBmaWxlbmFtZTtcclxuICAgICAgICBpZiAoIGNoaXBwZXJWZXJzaW9uLm1ham9yICE9PSAwICkge1xyXG4gICAgICAgICAgZmlsZW5hbWUgPSBgLi4vJHtyZWxlYXNlQnJhbmNoLnJlcG99L2J1aWxkL3BoZXQvJHtyZWxlYXNlQnJhbmNoLnJlcG99X2VuX3BoZXQuaHRtbGA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgZmlsZW5hbWUgPSBgLi4vJHtyZWxlYXNlQnJhbmNoLnJlcG99L2J1aWxkLyR7cmVsZWFzZUJyYW5jaC5yZXBvfV9lbi5odG1sYDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlciggcmVsZWFzZUJyYW5jaCwgZnMucmVhZEZpbGVTeW5jKCBmaWxlbmFtZSwgJ3V0ZjgnICkgKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBhIG5lZWRlZCBwYXRjaCBmcm9tIGEgZ2l2ZW4gbW9kaWZpZWQgYnJhbmNoLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyByZW1vdmVOZWVkZWRQYXRjaCggcmVwbywgYnJhbmNoLCBwYXRjaE5hbWUgKSB7XHJcbiAgICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xyXG5cclxuICAgICAgY29uc3QgcGF0Y2ggPSBtYWludGVuYW5jZS5maW5kUGF0Y2goIHBhdGNoTmFtZSApO1xyXG5cclxuICAgICAgY29uc3QgbW9kaWZpZWRCcmFuY2ggPSBhd2FpdCBtYWludGVuYW5jZS5lbnN1cmVNb2RpZmllZEJyYW5jaCggcmVwbywgYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IGluZGV4ID0gbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5pbmRleE9mKCBwYXRjaCApO1xyXG4gICAgICBhc3NlcnQoIGluZGV4ID49IDAsICdDb3VsZCBub3QgZmluZCBuZWVkZWQgcGF0Y2ggb24gdGhlIG1vZGlmaWVkIGJyYW5jaCcgKTtcclxuXHJcbiAgICAgIG1vZGlmaWVkQnJhbmNoLm5lZWRlZFBhdGNoZXMuc3BsaWNlKCBpbmRleCwgMSApO1xyXG4gICAgICBtYWludGVuYW5jZS50cnlSZW1vdmluZ01vZGlmaWVkQnJhbmNoKCBtb2RpZmllZEJyYW5jaCApO1xyXG5cclxuICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coIGBSZW1vdmVkIHBhdGNoICR7cGF0Y2hOYW1lfSBmcm9tICR7cmVwb30gJHticmFuY2h9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBhIG5lZWRlZCBwYXRjaCBmcm9tIHdoYXRldmVyIHN1YnNldCBvZiAoY3VycmVudCkgcmVsZWFzZSBicmFuY2hlcyBtYXRjaCB0aGUgZmlsdGVyLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRjaE5hbWVcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oUmVsZWFzZUJyYW5jaCk6IFByb21pc2UuPGJvb2xlYW4+fSBmaWx0ZXJcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIHJlbW92ZU5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgZmlsdGVyICkge1xyXG4gICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuXHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGxldCBjb3VudCA9IDA7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBtb2RpZmllZEJyYW5jaCBvZiBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzICkge1xyXG4gICAgICAgIGNvbnN0IG5lZWRzUmVtb3ZhbCA9IGF3YWl0IGZpbHRlciggbW9kaWZpZWRCcmFuY2gucmVsZWFzZUJyYW5jaCApO1xyXG5cclxuICAgICAgICBpZiAoICFuZWVkc1JlbW92YWwgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgc2tpcHBpbmcgJHttb2RpZmllZEJyYW5jaC5yZXBvfSAke21vZGlmaWVkQnJhbmNoLmJyYW5jaH1gICk7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlJ3MgYWN0dWFsbHkgc29tZXRoaW5nIHRvIHJlbW92ZVxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5pbmRleE9mKCBwYXRjaCApO1xyXG4gICAgICAgIGlmICggaW5kZXggPCAwICkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtb2RpZmllZEJyYW5jaC5uZWVkZWRQYXRjaGVzLnNwbGljZSggaW5kZXgsIDEgKTtcclxuICAgICAgICBtYWludGVuYW5jZS50cnlSZW1vdmluZ01vZGlmaWVkQnJhbmNoKCBtb2RpZmllZEJyYW5jaCApO1xyXG4gICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgY29uc29sZS5sb2coIGBSZW1vdmVkIG5lZWRlZCBwYXRjaCAke3BhdGNoTmFtZX0gZnJvbSAke21vZGlmaWVkQnJhbmNoLnJlcG99ICR7bW9kaWZpZWRCcmFuY2guYnJhbmNofWAgKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zb2xlLmxvZyggYFJlbW92ZWQgJHtjb3VudH0gcmVsZWFzZUJyYW5jaGVzIGZyb20gcGF0Y2g6ICR7cGF0Y2hOYW1lfWAgKTtcclxuXHJcbiAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZXMgYSBuZWVkZWQgcGF0Y2ggZnJvbSBhbGwgcmVsZWFzZSBicmFuY2hlcyB0aGF0IGRvIE5PVCBpbmNsdWRlIHRoZSBnaXZlbiBjb21taXQgb24gdGhlIHJlcG9cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2hhXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyByZW1vdmVOZWVkZWRQYXRjaGVzQmVmb3JlKCBwYXRjaE5hbWUsIHNoYSApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGF3YWl0IE1haW50ZW5hbmNlLnJlbW92ZU5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgYXN5bmMgcmVsZWFzZUJyYW5jaCA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJlbGVhc2VCcmFuY2guaXNNaXNzaW5nU0hBKCBwYXRjaC5yZXBvLCBzaGEgKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBhIG5lZWRlZCBwYXRjaCBmcm9tIGFsbCByZWxlYXNlIGJyYW5jaGVzIHRoYXQgRE8gaW5jbHVkZSB0aGUgZ2l2ZW4gY29tbWl0IG9uIHRoZSByZXBvXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGNoTmFtZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNoYVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgcmVtb3ZlTmVlZGVkUGF0Y2hlc0FmdGVyKCBwYXRjaE5hbWUsIHNoYSApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGF3YWl0IE1haW50ZW5hbmNlLnJlbW92ZU5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgYXN5bmMgcmVsZWFzZUJyYW5jaCA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJlbGVhc2VCcmFuY2guaW5jbHVkZXNTSEEoIHBhdGNoLnJlcG8sIHNoYSApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIZWxwZXIgZm9yIGFkZGluZyBwYXRjaGVzIGJhc2VkIG9uIHNwZWNpZmljIHBhdHRlcm5zLCBlLmcuOlxyXG4gICAgICogTWFpbnRlbmFuY2UuYWRkTmVlZGVkUGF0Y2hlcyggJ3BoZXRtYXJrcycsIE1haW50ZW5hbmNlLnNpbmdsZUZpbGVSZWxlYXNlQnJhbmNoRmlsdGVyKCAnLi4vcGhldG1hcmtzL2pzL3BoZXRtYXJrcy50cycgKSwgY29udGVudCA9PiBjb250ZW50LmluY2x1ZGVzKCAnZGF0YS93cmFwcGVycycgKSApO1xyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZyk6Ym9vbGVhbn1cclxuICAgICAqIEByZXR1cm5zIHtmdW5jdGlvbn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIHNpbmdsZUZpbGVSZWxlYXNlQnJhbmNoRmlsdGVyKCBmaWxlLCBwcmVkaWNhdGUgKSB7XHJcbiAgICAgIHJldHVybiBhc3luYyByZWxlYXNlQnJhbmNoID0+IHtcclxuICAgICAgICBhd2FpdCByZWxlYXNlQnJhbmNoLmNoZWNrb3V0KCBmYWxzZSApO1xyXG5cclxuICAgICAgICBpZiAoIGZzLmV4aXN0c1N5bmMoIGZpbGUgKSApIHtcclxuICAgICAgICAgIGNvbnN0IGNvbnRlbnRzID0gZnMucmVhZEZpbGVTeW5jKCBmaWxlLCAndXRmLTgnICk7XHJcbiAgICAgICAgICByZXR1cm4gcHJlZGljYXRlKCBjb250ZW50cyApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2tzIG91dCBhIHNwZWNpZmljIFJlbGVhc2UgQnJhbmNoICh1c2luZyBsb2NhbCBjb21taXQgZGF0YSBhcyBuZWNlc3NhcnkpLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG91dHB1dEpTPWZhbHNlIC0gaWYgdHJ1ZSwgb25jZSBjaGVja2VkIG91dCB0aGlzIHdpbGwgYWxzbyBydW4gYGdydW50IG91dHB1dC1qcy1wcm9qZWN0YFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgY2hlY2tvdXRCcmFuY2goIHJlcG8sIGJyYW5jaCwgb3V0cHV0SlMgPSBmYWxzZSApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcblxyXG4gICAgICBjb25zdCBtb2RpZmllZEJyYW5jaCA9IGF3YWl0IG1haW50ZW5hbmNlLmVuc3VyZU1vZGlmaWVkQnJhbmNoKCByZXBvLCBicmFuY2gsIHRydWUgKTtcclxuICAgICAgYXdhaXQgbW9kaWZpZWRCcmFuY2guY2hlY2tvdXQoKTtcclxuXHJcbiAgICAgIGlmICggb3V0cHV0SlMgJiYgY2hpcHBlclN1cHBvcnRzT3V0cHV0SlNHcnVudFRhc2tzKCkgKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coICdSdW5uaW5nIG91dHB1dC1qcy1wcm9qZWN0JyApO1xyXG5cclxuICAgICAgICAvLyBXZSBtaWdodCBub3QgYmUgYWJsZSB0byBydW4gdGhpcyBjb21tYW5kIVxyXG4gICAgICAgIGF3YWl0IGV4ZWN1dGUoIGdydW50Q29tbWFuZCwgWyAnb3V0cHV0LWpzLXByb2plY3QnIF0sIGAuLi8ke3JlcG99YCwge1xyXG4gICAgICAgICAgZXJyb3JzOiAncmVzb2x2ZSdcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIE5vIG5lZWQgdG8gc2F2ZSwgc2hvdWxkbid0IGJlIGNoYW5naW5nIHRoaW5nc1xyXG4gICAgICBjb25zb2xlLmxvZyggYENoZWNrZWQgb3V0ICR7cmVwb30gJHticmFuY2h9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0ZW1wdHMgdG8gYXBwbHkgcGF0Y2hlcyB0byB0aGUgbW9kaWZpZWQgYnJhbmNoZXMgdGhhdCBhcmUgbWFya2VkIGFzIG5lZWRlZC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGFwcGx5UGF0Y2hlcygpIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcbiAgICAgIGxldCBudW1BcHBsaWVkID0gMDtcclxuXHJcbiAgICAgIGZvciAoIGNvbnN0IG1vZGlmaWVkQnJhbmNoIG9mIG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgaWYgKCBtb2RpZmllZEJyYW5jaC5uZWVkZWRQYXRjaGVzLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmVwbyA9IG1vZGlmaWVkQnJhbmNoLnJlcG87XHJcbiAgICAgICAgY29uc3QgYnJhbmNoID0gbW9kaWZpZWRCcmFuY2guYnJhbmNoO1xyXG5cclxuICAgICAgICAvLyBEZWZlbnNpdmUgY29weSwgc2luY2Ugd2UgbW9kaWZ5IGl0IGR1cmluZyBpdGVyYXRpb25cclxuICAgICAgICBmb3IgKCBjb25zdCBwYXRjaCBvZiBtb2RpZmllZEJyYW5jaC5uZWVkZWRQYXRjaGVzLnNsaWNlKCkgKSB7XHJcbiAgICAgICAgICBpZiAoIHBhdGNoLnNoYXMubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjb25zdCBwYXRjaFJlcG8gPSBwYXRjaC5yZXBvO1xyXG5cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIENoZWNrb3V0IHdoYXRldmVyIHRoZSBsYXRlc3QgcGF0Y2hlZCBTSEEgaXMgKGlmIHdlJ3ZlIHBhdGNoZWQgaXQpXHJcbiAgICAgICAgICAgIGlmICggbW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llc1sgcGF0Y2hSZXBvIF0gKSB7XHJcbiAgICAgICAgICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHBhdGNoUmVwbywgbW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llc1sgcGF0Y2hSZXBvIF0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyBMb29rIHVwIHRoZSBTSEEgdG8gY2hlY2sgb3V0XHJcbiAgICAgICAgICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHJlcG8sIGJyYW5jaCApO1xyXG4gICAgICAgICAgICAgIGF3YWl0IGdpdFB1bGwoIHJlcG8gKTtcclxuICAgICAgICAgICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHJlcG8gKTtcclxuICAgICAgICAgICAgICBjb25zdCBzaGEgPSBkZXBlbmRlbmNpZXNbIHBhdGNoUmVwbyBdLnNoYTtcclxuICAgICAgICAgICAgICBhd2FpdCBnaXRDaGVja291dCggcmVwbywgJ21haW4nICk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFRoZW4gY2hlY2sgaXQgb3V0XHJcbiAgICAgICAgICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHBhdGNoUmVwbywgc2hhICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgQ2hlY2tlZCBvdXQgJHtwYXRjaFJlcG99IFNIQSBmb3IgJHtyZXBvfSAke2JyYW5jaH1gICk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKCBjb25zdCBzaGEgb2YgcGF0Y2guc2hhcyApIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gSWYgdGhlIHNoYSBkb2Vzbid0IGV4aXN0IGluIHRoZSByZXBvLCB0aGVuIGdpdmUgYSBzcGVjaWZpYyBlcnJvciBmb3IgdGhhdC5cclxuICAgICAgICAgICAgICBjb25zdCBoYXNTaGEgPSAoIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdjYXQtZmlsZScsICctZScsIHNoYSBdLCBgLi4vJHtwYXRjaFJlcG99YCwgeyBlcnJvcnM6ICdyZXNvbHZlJyB9ICkgKS5jb2RlID09PSAwO1xyXG4gICAgICAgICAgICAgIGlmICggIWhhc1NoYSApIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYFNIQSBub3QgZm91bmQgaW4gJHtwYXRjaFJlcG99OiAke3NoYX1gICk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjb25zdCBjaGVycnlQaWNrU3VjY2VzcyA9IGF3YWl0IGdpdENoZXJyeVBpY2soIHBhdGNoUmVwbywgc2hhICk7XHJcblxyXG4gICAgICAgICAgICAgIGlmICggY2hlcnJ5UGlja1N1Y2Nlc3MgKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U0hBID0gYXdhaXQgZ2l0UmV2UGFyc2UoIHBhdGNoUmVwbywgJ0hFQUQnICk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggYENoZXJyeS1waWNrIHN1Y2Nlc3MgZm9yICR7c2hhfSwgcmVzdWx0IGlzICR7Y3VycmVudFNIQX1gICk7XHJcblxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llc1sgcGF0Y2hSZXBvIF0gPSBjdXJyZW50U0hBO1xyXG4gICAgICAgICAgICAgICAgbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5zcGxpY2UoIG1vZGlmaWVkQnJhbmNoLm5lZWRlZFBhdGNoZXMuaW5kZXhPZiggcGF0Y2ggKSwgMSApO1xyXG4gICAgICAgICAgICAgICAgbnVtQXBwbGllZCsrO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIERvbid0IGluY2x1ZGUgZHVwbGljYXRlIG1lc3NhZ2VzLCBzaW5jZSBtdWx0aXBsZSBwYXRjaGVzIG1pZ2h0IGJlIGZvciBhIHNpbmdsZSBpc3N1ZVxyXG4gICAgICAgICAgICAgICAgaWYgKCAhbW9kaWZpZWRCcmFuY2gucGVuZGluZ01lc3NhZ2VzLmluY2x1ZGVzKCBwYXRjaC5tZXNzYWdlICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgIG1vZGlmaWVkQnJhbmNoLnBlbmRpbmdNZXNzYWdlcy5wdXNoKCBwYXRjaC5tZXNzYWdlICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coIGBDb3VsZCBub3QgY2hlcnJ5LXBpY2sgJHtzaGF9YCApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYEZhaWx1cmUgYXBwbHlpbmcgcGF0Y2ggJHtwYXRjaFJlcG99IHRvICR7cmVwb30gJHticmFuY2h9OiAke2V9YCApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIG1vZGlmaWVkQnJhbmNoLnJlcG8sICdtYWluJyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBtYWludGVuYW5jZS5zYXZlKCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggYCR7bnVtQXBwbGllZH0gcGF0Y2hlcyBhcHBsaWVkYCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUHVzaGVzIGxvY2FsIGNoYW5nZXMgdXAgdG8gR2l0SHViLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oTW9kaWZpZWRCcmFuY2gpOlByb21pc2UuPGJvb2xlYW4+fSBbZmlsdGVyXSAtIE9wdGlvbmFsIGZpbHRlciwgbW9kaWZpZWQgYnJhbmNoZXMgd2lsbCBiZSBza2lwcGVkXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiB0aGlzIHJlc29sdmVzIHRvIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyB1cGRhdGVEZXBlbmRlbmNpZXMoIGZpbHRlciApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBtb2RpZmllZEJyYW5jaCBvZiBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzICkge1xyXG4gICAgICAgIGNvbnN0IGNoYW5nZWRSZXBvcyA9IE9iamVjdC5rZXlzKCBtb2RpZmllZEJyYW5jaC5jaGFuZ2VkRGVwZW5kZW5jaWVzICk7XHJcbiAgICAgICAgaWYgKCBjaGFuZ2VkUmVwb3MubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIGZpbHRlciAmJiAhKCBhd2FpdCBmaWx0ZXIoIG1vZGlmaWVkQnJhbmNoICkgKSApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgU2tpcHBpbmcgZGVwZW5kZW5jeSB1cGRhdGUgZm9yICR7bW9kaWZpZWRCcmFuY2gucmVwb30gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9YCApO1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgLy8gTm8gTlBNIG5lZWRlZFxyXG4gICAgICAgICAgYXdhaXQgY2hlY2tvdXRUYXJnZXQoIG1vZGlmaWVkQnJhbmNoLnJlcG8sIG1vZGlmaWVkQnJhbmNoLmJyYW5jaCwgZmFsc2UgKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgQ2hlY2tlZCBvdXQgJHttb2RpZmllZEJyYW5jaC5yZXBvfSAke21vZGlmaWVkQnJhbmNoLmJyYW5jaH1gICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgZGVwZW5kZW5jaWVzSlNPTkZpbGUgPSBgLi4vJHttb2RpZmllZEJyYW5jaC5yZXBvfS9kZXBlbmRlbmNpZXMuanNvbmA7XHJcbiAgICAgICAgICBjb25zdCBkZXBlbmRlbmNpZXNKU09OID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBkZXBlbmRlbmNpZXNKU09ORmlsZSwgJ3V0Zi04JyApICk7XHJcblxyXG4gICAgICAgICAgLy8gTW9kaWZ5IHRoZSBcInNlbGZcIiBpbiB0aGUgZGVwZW5kZW5jaWVzLmpzb24gYXMgZXhwZWN0ZWRcclxuICAgICAgICAgIGRlcGVuZGVuY2llc0pTT05bIG1vZGlmaWVkQnJhbmNoLnJlcG8gXS5zaGEgPSBhd2FpdCBnaXRSZXZQYXJzZSggbW9kaWZpZWRCcmFuY2gucmVwbywgbW9kaWZpZWRCcmFuY2guYnJhbmNoICk7XHJcblxyXG4gICAgICAgICAgZm9yICggY29uc3QgZGVwZW5kZW5jeSBvZiBjaGFuZ2VkUmVwb3MgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY3lCcmFuY2ggPSBtb2RpZmllZEJyYW5jaC5kZXBlbmRlbmN5QnJhbmNoO1xyXG4gICAgICAgICAgICBjb25zdCBicmFuY2hlcyA9IGF3YWl0IGdldEJyYW5jaGVzKCBkZXBlbmRlbmN5ICk7XHJcbiAgICAgICAgICAgIGNvbnN0IHNoYSA9IG1vZGlmaWVkQnJhbmNoLmNoYW5nZWREZXBlbmRlbmNpZXNbIGRlcGVuZGVuY3kgXTtcclxuXHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llc0pTT05bIGRlcGVuZGVuY3kgXS5zaGEgPSBzaGE7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGJyYW5jaGVzLmluY2x1ZGVzKCBkZXBlbmRlbmN5QnJhbmNoICkgKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coIGBCcmFuY2ggJHtkZXBlbmRlbmN5QnJhbmNofSBhbHJlYWR5IGV4aXN0cyBpbiAke2RlcGVuZGVuY3l9YCApO1xyXG4gICAgICAgICAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCBkZXBlbmRlbmN5LCBkZXBlbmRlbmN5QnJhbmNoICk7XHJcbiAgICAgICAgICAgICAgYXdhaXQgZ2l0UHVsbCggZGVwZW5kZW5jeSApO1xyXG4gICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTSEEgPSBhd2FpdCBnaXRSZXZQYXJzZSggZGVwZW5kZW5jeSwgJ0hFQUQnICk7XHJcblxyXG4gICAgICAgICAgICAgIGlmICggc2hhICE9PSBjdXJyZW50U0hBICkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coIGBBdHRlbXB0aW5nIHRvIChob3BlZnVsbHkgZmFzdC1mb3J3YXJkKSBtZXJnZSAke3NoYX1gICk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnbWVyZ2UnLCBzaGEgXSwgYC4uLyR7ZGVwZW5kZW5jeX1gICk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBnaXRQdXNoKCBkZXBlbmRlbmN5LCBkZXBlbmRlbmN5QnJhbmNoICk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgQnJhbmNoICR7ZGVwZW5kZW5jeUJyYW5jaH0gZG9lcyBub3QgZXhpc3QgaW4gJHtkZXBlbmRlbmN5fSwgY3JlYXRpbmcuYCApO1xyXG4gICAgICAgICAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCBkZXBlbmRlbmN5LCBzaGEgKTtcclxuICAgICAgICAgICAgICBhd2FpdCBnaXRDcmVhdGVCcmFuY2goIGRlcGVuZGVuY3ksIGRlcGVuZGVuY3lCcmFuY2ggKTtcclxuICAgICAgICAgICAgICBhd2FpdCBnaXRQdXNoKCBkZXBlbmRlbmN5LCBkZXBlbmRlbmN5QnJhbmNoICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRlbGV0ZSBtb2RpZmllZEJyYW5jaC5jaGFuZ2VkRGVwZW5kZW5jaWVzWyBkZXBlbmRlbmN5IF07XHJcbiAgICAgICAgICAgIG1vZGlmaWVkQnJhbmNoLmRlcGxveWVkVmVyc2lvbiA9IG51bGw7XHJcbiAgICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTsgLy8gc2F2ZSBoZXJlIGluIGNhc2UgYSBmdXR1cmUgZmFpbHVyZSB3b3VsZCBcInJldmVydFwiIHRoaW5nc1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBtb2RpZmllZEJyYW5jaC5wZW5kaW5nTWVzc2FnZXMuam9pbiggJyBhbmQgJyApO1xyXG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyggZGVwZW5kZW5jaWVzSlNPTkZpbGUsIEpTT04uc3RyaW5naWZ5KCBkZXBlbmRlbmNpZXNKU09OLCBudWxsLCAyICkgKTtcclxuICAgICAgICAgIGF3YWl0IGdpdEFkZCggbW9kaWZpZWRCcmFuY2gucmVwbywgJ2RlcGVuZGVuY2llcy5qc29uJyApO1xyXG4gICAgICAgICAgYXdhaXQgZ2l0Q29tbWl0KCBtb2RpZmllZEJyYW5jaC5yZXBvLCBgdXBkYXRlZCBkZXBlbmRlbmNpZXMuanNvbiBmb3IgJHttZXNzYWdlfWAgKTtcclxuICAgICAgICAgIGF3YWl0IGdpdFB1c2goIG1vZGlmaWVkQnJhbmNoLnJlcG8sIG1vZGlmaWVkQnJhbmNoLmJyYW5jaCApO1xyXG5cclxuICAgICAgICAgIC8vIE1vdmUgbWVzc2FnZXMgZnJvbSBwZW5kaW5nIHRvIHB1c2hlZFxyXG4gICAgICAgICAgZm9yICggY29uc3QgbWVzc2FnZSBvZiBtb2RpZmllZEJyYW5jaC5wZW5kaW5nTWVzc2FnZXMgKSB7XHJcbiAgICAgICAgICAgIGlmICggIW1vZGlmaWVkQnJhbmNoLnB1c2hlZE1lc3NhZ2VzLmluY2x1ZGVzKCBtZXNzYWdlICkgKSB7XHJcbiAgICAgICAgICAgICAgbW9kaWZpZWRCcmFuY2gucHVzaGVkTWVzc2FnZXMucHVzaCggbWVzc2FnZSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBtb2RpZmllZEJyYW5jaC5wZW5kaW5nTWVzc2FnZXMgPSBbXTtcclxuICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTsgLy8gc2F2ZSBoZXJlIGluIGNhc2UgYSBmdXR1cmUgZmFpbHVyZSB3b3VsZCBcInJldmVydFwiIHRoaW5nc1xyXG5cclxuICAgICAgICAgIGF3YWl0IGNoZWNrb3V0TWFpbiggbW9kaWZpZWRCcmFuY2gucmVwbywgZmFsc2UgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICBtYWludGVuYW5jZS5zYXZlKCk7XHJcblxyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgRmFpbHVyZSB1cGRhdGluZyBkZXBlbmRlbmNpZXMgZm9yICR7bW9kaWZpZWRCcmFuY2gucmVwb30gdG8gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9OiAke2V9YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coICdEZXBlbmRlbmNpZXMgdXBkYXRlZCcgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIERlcGxveXMgUkMgdmVyc2lvbnMgb2YgdGhlIG1vZGlmaWVkIGJyYW5jaGVzIHRoYXQgbmVlZCBpdC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE1vZGlmaWVkQnJhbmNoKTpQcm9taXNlLjxib29sZWFuPn0gW2ZpbHRlcl0gLSBPcHRpb25hbCBmaWx0ZXIsIG1vZGlmaWVkIGJyYW5jaGVzIHdpbGwgYmUgc2tpcHBlZFxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGhpcyByZXNvbHZlcyB0byBmYWxzZVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgZGVwbG95UmVsZWFzZUNhbmRpZGF0ZXMoIGZpbHRlciApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBtb2RpZmllZEJyYW5jaCBvZiBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzICkge1xyXG4gICAgICAgIGlmICggIW1vZGlmaWVkQnJhbmNoLmlzUmVhZHlGb3JSZWxlYXNlQ2FuZGlkYXRlIHx8ICFtb2RpZmllZEJyYW5jaC5yZWxlYXNlQnJhbmNoLmlzUmVsZWFzZWQgKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCAnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09JyApO1xyXG5cclxuICAgICAgICBpZiAoIGZpbHRlciAmJiAhKCBhd2FpdCBmaWx0ZXIoIG1vZGlmaWVkQnJhbmNoICkgKSApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgU2tpcHBpbmcgUkMgZGVwbG95IGZvciAke21vZGlmaWVkQnJhbmNoLnJlcG99ICR7bW9kaWZpZWRCcmFuY2guYnJhbmNofWAgKTtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgUnVubmluZyBSQyBkZXBsb3kgZm9yICR7bW9kaWZpZWRCcmFuY2gucmVwb30gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9YCApO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHZlcnNpb24gPSBhd2FpdCByYyggbW9kaWZpZWRCcmFuY2gucmVwbywgbW9kaWZpZWRCcmFuY2guYnJhbmNoLCBtb2RpZmllZEJyYW5jaC5icmFuZHMsIHRydWUsIG1vZGlmaWVkQnJhbmNoLnB1c2hlZE1lc3NhZ2VzLmpvaW4oICcsICcgKSApO1xyXG4gICAgICAgICAgbW9kaWZpZWRCcmFuY2guZGVwbG95ZWRWZXJzaW9uID0gdmVyc2lvbjtcclxuICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTsgLy8gc2F2ZSBoZXJlIGluIGNhc2UgYSBmdXR1cmUgZmFpbHVyZSB3b3VsZCBcInJldmVydFwiIHRoaW5nc1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuXHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBGYWlsdXJlIHdpdGggUkMgZGVwbG95IGZvciAke21vZGlmaWVkQnJhbmNoLnJlcG99IHRvICR7bW9kaWZpZWRCcmFuY2guYnJhbmNofTogJHtlfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnUkMgdmVyc2lvbnMgZGVwbG95ZWQnICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZXBsb3lzIHByb2R1Y3Rpb24gdmVyc2lvbnMgb2YgdGhlIG1vZGlmaWVkIGJyYW5jaGVzIHRoYXQgbmVlZCBpdC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE1vZGlmaWVkQnJhbmNoKTpQcm9taXNlLjxib29sZWFuPn0gW2ZpbHRlcl0gLSBPcHRpb25hbCBmaWx0ZXIsIG1vZGlmaWVkIGJyYW5jaGVzIHdpbGwgYmUgc2tpcHBlZFxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGhpcyByZXNvbHZlcyB0byBmYWxzZVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgZGVwbG95UHJvZHVjdGlvbiggZmlsdGVyICkge1xyXG4gICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuXHJcbiAgICAgIGZvciAoIGNvbnN0IG1vZGlmaWVkQnJhbmNoIG9mIG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgaWYgKCAhbW9kaWZpZWRCcmFuY2guaXNSZWFkeUZvclByb2R1Y3Rpb24gfHwgIW1vZGlmaWVkQnJhbmNoLnJlbGVhc2VCcmFuY2guaXNSZWxlYXNlZCApIHtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCBmaWx0ZXIgJiYgISggYXdhaXQgZmlsdGVyKCBtb2RpZmllZEJyYW5jaCApICkgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYFNraXBwaW5nIHByb2R1Y3Rpb24gZGVwbG95IGZvciAke21vZGlmaWVkQnJhbmNoLnJlcG99ICR7bW9kaWZpZWRCcmFuY2guYnJhbmNofWAgKTtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgUnVubmluZyBwcm9kdWN0aW9uIGRlcGxveSBmb3IgJHttb2RpZmllZEJyYW5jaC5yZXBvfSAke21vZGlmaWVkQnJhbmNoLmJyYW5jaH1gICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgdmVyc2lvbiA9IGF3YWl0IHByb2R1Y3Rpb24oIG1vZGlmaWVkQnJhbmNoLnJlcG8sIG1vZGlmaWVkQnJhbmNoLmJyYW5jaCwgbW9kaWZpZWRCcmFuY2guYnJhbmRzLCB0cnVlLCBmYWxzZSwgbW9kaWZpZWRCcmFuY2gucHVzaGVkTWVzc2FnZXMuam9pbiggJywgJyApICk7XHJcbiAgICAgICAgICBtb2RpZmllZEJyYW5jaC5kZXBsb3llZFZlcnNpb24gPSB2ZXJzaW9uO1xyXG4gICAgICAgICAgbW9kaWZpZWRCcmFuY2gucHVzaGVkTWVzc2FnZXMgPSBbXTtcclxuICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTsgLy8gc2F2ZSBoZXJlIGluIGNhc2UgYSBmdXR1cmUgZmFpbHVyZSB3b3VsZCBcInJldmVydFwiIHRoaW5nc1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuXHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBGYWlsdXJlIHdpdGggcHJvZHVjdGlvbiBkZXBsb3kgZm9yICR7bW9kaWZpZWRCcmFuY2gucmVwb30gdG8gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9OiAke2V9YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coICdwcm9kdWN0aW9uIHZlcnNpb25zIGRlcGxveWVkJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIGEgc2VwYXJhdGUgZGlyZWN0b3J5IGZvciBlYWNoIHJlbGVhc2UgYnJhbmNoLiBUaGlzIGRvZXMgbm90IGludGVyZmFjZSB3aXRoIHRoZSBzYXZlZCBtYWludGVuYW5jZSBzdGF0ZSBhdFxyXG4gICAgICogYWxsLCBhbmQgaW5zdGVhZCBqdXN0IGxvb2tzIGF0IHRoZSBjb21taXR0ZWQgZGVwZW5kZW5jaWVzLmpzb24gd2hlbiB1cGRhdGluZy5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKFJlbGVhc2VCcmFuY2gpOlByb21pc2UuPGJvb2xlYW4+fSBbZmlsdGVyXSAtIE9wdGlvbmFsIGZpbHRlciwgcmVsZWFzZSBicmFuY2hlcyB3aWxsIGJlIHNraXBwZWRcclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGhpcyByZXNvbHZlcyB0byBmYWxzZVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIGJ1aWxkPWZhbHNlIC0gdG8gb3B0IG91dCBvZiBidWlsZGluZywgc2V0IHRvIGZhbHNlLlxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zcGlsZT1mYWxzZSAtIHRvIG9wdCBvdXQgb2YgdHJhbnNwaWxpbmcsIHNldCB0byBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIHVwZGF0ZUNoZWNrb3V0cyggZmlsdGVyLCBvcHRpb25zICkge1xyXG4gICAgICBvcHRpb25zID0gXy5tZXJnZSgge1xyXG4gICAgICAgIGNvbmN1cnJlbnQ6IDUsXHJcbiAgICAgICAgYnVpbGQ6IHRydWUsXHJcbiAgICAgICAgdHJhbnNwaWxlOiB0cnVlLFxyXG4gICAgICAgIGJ1aWxkT3B0aW9uczogeyBsaW50OiB0cnVlIH1cclxuICAgICAgfSwgb3B0aW9ucyApO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coIGBVcGRhdGluZyBjaGVja291dHMgKHJ1bm5pbmcgaW4gcGFyYWxsZWwgd2l0aCAke29wdGlvbnMuY29uY3VycmVudH0gdGhyZWFkcylgICk7XHJcblxyXG4gICAgICBjb25zdCByZWxlYXNlQnJhbmNoZXMgPSBhd2FpdCBNYWludGVuYW5jZS5nZXRNYWludGVuYW5jZUJyYW5jaGVzKCk7XHJcblxyXG4gICAgICBjb25zdCBmaWx0ZXJlZEJyYW5jaGVzID0gW107XHJcblxyXG4gICAgICAvLyBSdW4gYWxsIGZpbHRlcmluZyBpbiBhIHN0ZXAgYmVmb3JlIHRoZSBwYXJhbGxlbCBzdGVwLiBUaGlzIHdheSB0aGUgZmlsdGVyIGhhcyBmdWxsIGFjY2VzcyB0byByZXBvcyBhbmQgZ2l0IGNvbW1hbmRzIHdpdGhvdXQgcmFjZSBjb25kaXRpb25zLCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGVyZW5uaWFsL2lzc3Vlcy8zNDFcclxuICAgICAgZm9yICggY29uc3QgcmVsZWFzZUJyYW5jaCBvZiByZWxlYXNlQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgaWYgKCAhZmlsdGVyIHx8IGF3YWl0IGZpbHRlciggcmVsZWFzZUJyYW5jaCApICkge1xyXG4gICAgICAgICAgZmlsdGVyZWRCcmFuY2hlcy5wdXNoKCByZWxlYXNlQnJhbmNoICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggYEZpbHRlciBhcHBsaWVkLiBVcGRhdGluZyAke2ZpbHRlcmVkQnJhbmNoZXMubGVuZ3RofTpgLCBmaWx0ZXJlZEJyYW5jaGVzLm1hcCggeCA9PiB4LnRvU3RyaW5nKCkgKSApO1xyXG5cclxuICAgICAgY29uc3QgYXN5bmNGdW5jdGlvbnMgPSBmaWx0ZXJlZEJyYW5jaGVzLm1hcCggcmVsZWFzZUJyYW5jaCA9PiAoIGFzeW5jICgpID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyggJ0JlZ2lubmluZzogJywgcmVsZWFzZUJyYW5jaC50b1N0cmluZygpICk7XHJcbiAgICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgICBhd2FpdCByZWxlYXNlQnJhbmNoLnVwZGF0ZUNoZWNrb3V0KCk7XHJcblxyXG4gICAgICAgICAgb3B0aW9ucy50cmFuc3BpbGUgJiYgYXdhaXQgcmVsZWFzZUJyYW5jaC50cmFuc3BpbGUoKTtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMuYnVpbGQgJiYgYXdhaXQgcmVsZWFzZUJyYW5jaC5idWlsZCggb3B0aW9ucy5idWlsZE9wdGlvbnMgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggYGZhaWxlZCB0byBidWlsZCAke3JlbGVhc2VCcmFuY2gudG9TdHJpbmcoKX06ICR7ZX1gICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIGBmYWlsZWQgdG8gdXBkYXRlIHJlbGVhc2VCcmFuY2ggJHtyZWxlYXNlQnJhbmNoLnRvU3RyaW5nKCl9OiAke2V9YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApICk7XHJcblxyXG4gICAgICBhd2FpdCBhc3luY3EucGFyYWxsZWxMaW1pdCggYXN5bmNGdW5jdGlvbnMsIG9wdGlvbnMuY29uY3VycmVudCApO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coICdEb25lJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oUmVsZWFzZUJyYW5jaCk6UHJvbWlzZS48Ym9vbGVhbj59IFtmaWx0ZXJdIC0gT3B0aW9uYWwgZmlsdGVyLCByZWxlYXNlIGJyYW5jaGVzIHdpbGwgYmUgc2tpcHBlZFxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiB0aGlzIHJlc29sdmVzIHRvIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBjaGVja1VuYnVpbHRDaGVja291dHMoIGZpbHRlciApIHtcclxuICAgICAgY29uc29sZS5sb2coICdDaGVja2luZyB1bmJ1aWx0IGNoZWNrb3V0cycgKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlbGVhc2VCcmFuY2hlcyA9IGF3YWl0IE1haW50ZW5hbmNlLmdldE1haW50ZW5hbmNlQnJhbmNoZXMoKTtcclxuICAgICAgZm9yICggY29uc3QgcmVsZWFzZUJyYW5jaCBvZiByZWxlYXNlQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgaWYgKCAhZmlsdGVyIHx8IGF3YWl0IGZpbHRlciggcmVsZWFzZUJyYW5jaCApICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIHJlbGVhc2VCcmFuY2gudG9TdHJpbmcoKSApO1xyXG4gICAgICAgICAgY29uc3QgdW5idWlsdFJlc3VsdCA9IGF3YWl0IHJlbGVhc2VCcmFuY2guY2hlY2tVbmJ1aWx0KCk7XHJcbiAgICAgICAgICBpZiAoIHVuYnVpbHRSZXN1bHQgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCB1bmJ1aWx0UmVzdWx0ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihSZWxlYXNlQnJhbmNoKTpQcm9taXNlLjxib29sZWFuPn0gW2ZpbHRlcl0gLSBPcHRpb25hbCBmaWx0ZXIsIHJlbGVhc2UgYnJhbmNoZXMgd2lsbCBiZSBza2lwcGVkXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRoaXMgcmVzb2x2ZXMgdG8gZmFsc2VcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGNoZWNrQnVpbHRDaGVja291dHMoIGZpbHRlciApIHtcclxuICAgICAgY29uc29sZS5sb2coICdDaGVja2luZyBidWlsdCBjaGVja291dHMnICk7XHJcblxyXG4gICAgICBjb25zdCByZWxlYXNlQnJhbmNoZXMgPSBhd2FpdCBNYWludGVuYW5jZS5nZXRNYWludGVuYW5jZUJyYW5jaGVzKCk7XHJcbiAgICAgIGZvciAoIGNvbnN0IHJlbGVhc2VCcmFuY2ggb2YgcmVsZWFzZUJyYW5jaGVzICkge1xyXG4gICAgICAgIGlmICggIWZpbHRlciB8fCBhd2FpdCBmaWx0ZXIoIHJlbGVhc2VCcmFuY2ggKSApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCByZWxlYXNlQnJhbmNoLnRvU3RyaW5nKCkgKTtcclxuICAgICAgICAgIGNvbnN0IGJ1aWx0UmVzdWx0ID0gYXdhaXQgcmVsZWFzZUJyYW5jaC5jaGVja0J1aWx0KCk7XHJcbiAgICAgICAgICBpZiAoIGJ1aWx0UmVzdWx0ICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggYnVpbHRSZXN1bHQgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZGVwbG95cyBwcm9kdWN0aW9uIHZlcnNpb25zIG9mIGFsbCByZWxlYXNlIGJyYW5jaGVzIChvciB0aG9zZSBtYXRjaGluZyBhIHNwZWNpZmljIGZpbHRlclxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIE5PVEU6IFRoaXMgZG9lcyBub3QgdXNlIHRoZSBjdXJyZW50IG1haW50ZW5hbmNlIHN0YXRlIVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gR2VuZXJhbGx5IGFuIGlzc3VlIHRvIHJlZmVyZW5jZVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihSZWxlYXNlQnJhbmNoKTpQcm9taXNlLjxib29sZWFuPn0gW2ZpbHRlcl0gLSBPcHRpb25hbCBmaWx0ZXIsIHJlbGVhc2UgYnJhbmNoZXMgd2lsbCBiZSBza2lwcGVkXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiB0aGlzIHJlc29sdmVzIHRvIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyByZWRlcGxveUFsbFByb2R1Y3Rpb24oIG1lc3NhZ2UsIGZpbHRlciApIHtcclxuICAgICAgLy8gSWdub3JlIHVucmVsZWFzZWQgYnJhbmNoZXMhXHJcbiAgICAgIGNvbnN0IHJlbGVhc2VCcmFuY2hlcyA9IGF3YWl0IE1haW50ZW5hbmNlLmdldE1haW50ZW5hbmNlQnJhbmNoZXMoICgpID0+IHRydWUsIGZhbHNlICk7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCByZWxlYXNlQnJhbmNoIG9mIHJlbGVhc2VCcmFuY2hlcyApIHtcclxuICAgICAgICBpZiAoIGZpbHRlciAmJiAhKCBhd2FpdCBmaWx0ZXIoIHJlbGVhc2VCcmFuY2ggKSApICkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyggcmVsZWFzZUJyYW5jaC50b1N0cmluZygpICk7XHJcbiAgICAgICAgYXdhaXQgcmMoIHJlbGVhc2VCcmFuY2gucmVwbywgcmVsZWFzZUJyYW5jaC5icmFuY2gsIHJlbGVhc2VCcmFuY2guYnJhbmRzLCB0cnVlLCBtZXNzYWdlICk7XHJcbiAgICAgICAgYXdhaXQgcHJvZHVjdGlvbiggcmVsZWFzZUJyYW5jaC5yZXBvLCByZWxlYXNlQnJhbmNoLmJyYW5jaCwgcmVsZWFzZUJyYW5jaC5icmFuZHMsIHRydWUsIGZhbHNlLCBtZXNzYWdlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnRmluaXNoZWQgcmVkZXBsb3lpbmcnICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcHJvdG90eXBlIGNvcHkgb2YgTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcygpLCBpbiB3aGljaCB3ZSB3aWxsIG11dGF0ZSB0aGUgY2xhc3MncyBhbGxSZWxlYXNlQnJhbmNoZXNcclxuICAgICAqIHRvIGVuc3VyZSB0aGVyZSBpcyBubyBzYXZlL2xvYWQgb3JkZXIgZGVwZW5kZW5jeSBwcm9ibGVtcy5cclxuICAgICAqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKFJlbGVhc2VCcmFuY2gpOmJvb2xlYW59IGZpbHRlclJlcG8gLSByZXR1cm4gZmFsc2UgaWYgdGhlIFJlbGVhc2VCcmFuY2ggc2hvdWxkIGJlIGV4Y2x1ZGVkLlxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2hlY2tVbnJlbGVhc2VkQnJhbmNoZXMgLSBJZiBmYWxzZSwgd2lsbCBza2lwIGNoZWNraW5nIGZvciB1bnJlbGVhc2VkIGJyYW5jaGVzLiBUaGlzIGNoZWNraW5nIG5lZWRzIGFsbCByZXBvcyBjaGVja2VkIG91dFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBmb3JjZUNhY2hlQnJlYWs9ZmFsc2UgLSB0cnVlIGlmIHlvdSB3YW50IHRvIGZvcmNlIGEgcmVjYWxjdWxhdGlvbiBvZiBhbGwgUmVsZWFzZUJyYW5jaGVzXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48QXJyYXkuPFJlbGVhc2VCcmFuY2g+Pn1cclxuICAgICAqIEByZWplY3RzIHtFeGVjdXRlRXJyb3J9XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldE1haW50ZW5hbmNlQnJhbmNoZXMoIGZpbHRlclJlcG8gPSAoKSA9PiB0cnVlLCBjaGVja1VucmVsZWFzZWRCcmFuY2hlcyA9IHRydWUsIGZvcmNlQ2FjaGVCcmVhayA9IGZhbHNlICkge1xyXG4gICAgICByZXR1cm4gTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcyggZmlsdGVyUmVwbywgY2hlY2tVbnJlbGVhc2VkQnJhbmNoZXMsIGZvcmNlQ2FjaGVCcmVhaywgdGhpcyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihSZWxlYXNlQnJhbmNoKTpib29sZWFufSBmaWx0ZXJSZXBvIC0gcmV0dXJuIGZhbHNlIGlmIHRoZSBSZWxlYXNlQnJhbmNoIHNob3VsZCBiZSBleGNsdWRlZC5cclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNoZWNrVW5yZWxlYXNlZEJyYW5jaGVzIC0gSWYgZmFsc2UsIHdpbGwgc2tpcCBjaGVja2luZyBmb3IgdW5yZWxlYXNlZCBicmFuY2hlcy4gVGhpcyBjaGVja2luZyBuZWVkcyBhbGwgcmVwb3MgY2hlY2tlZCBvdXRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2VDYWNoZUJyZWFrPWZhbHNlIC0gdHJ1ZSBpZiB5b3Ugd2FudCB0byBmb3JjZSBhIHJlY2FsY3VsYXRpb24gb2YgYWxsIFJlbGVhc2VCcmFuY2hlc1xyXG4gICAgIEBwYXJhbSB7TWFpbnRlbmFuY2V9IG1haW50ZW5hbmNlPU1haW50ZW5hbmNlLmxvYWQoKSAtIGJ5IGRlZmF1bHQgbG9hZCBmcm9tIHNhdmVkIGZpbGUgdGhlIGN1cnJlbnQgbWFpbnRlbmFuY2UgaW5zdGFuY2UuXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48QXJyYXkuPFJlbGVhc2VCcmFuY2g+Pn1cclxuICAgICAqIEByZWplY3RzIHtFeGVjdXRlRXJyb3J9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBnZXRNYWludGVuYW5jZUJyYW5jaGVzKCBmaWx0ZXJSZXBvID0gKCkgPT4gdHJ1ZSwgY2hlY2tVbnJlbGVhc2VkQnJhbmNoZXMgPSB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlQ2FjaGVCcmVhayA9IGZhbHNlLCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKSApIHtcclxuICAgICAgY29uc3QgcmVsZWFzZUJyYW5jaGVzID0gYXdhaXQgTWFpbnRlbmFuY2UubG9hZEFsbE1haW50ZW5hbmNlQnJhbmNoZXMoIGZvcmNlQ2FjaGVCcmVhaywgbWFpbnRlbmFuY2UgKTtcclxuXHJcbiAgICAgIHJldHVybiByZWxlYXNlQnJhbmNoZXMuZmlsdGVyKCByZWxlYXNlQnJhbmNoID0+IHtcclxuICAgICAgICBpZiAoICFjaGVja1VucmVsZWFzZWRCcmFuY2hlcyAmJiAhcmVsZWFzZUJyYW5jaC5pc1JlbGVhc2VkICkge1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmlsdGVyUmVwbyggcmVsZWFzZUJyYW5jaCApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMb2FkcyBldmVyeSBwb3RlbnRpYWwgUmVsZWFzZUJyYW5jaCAocHVibGlzaGVkIHBoZXQgYW5kIHBoZXQtaW8gYnJhbmRzLCBhcyB3ZWxsIGFzIHVucmVsZWFzZWQgYnJhbmNoZXMpLCBhbmRcclxuICAgICAqIHNhdmVzIGl0IHRvIHRoZSBtYWludGVuYW5jZSBzdGF0ZS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBDYWxsIHRoaXMgd2l0aCB0cnVlIHRvIGJyZWFrIHRoZSBjYWNoZSBhbmQgZm9yY2UgYSByZWNhbGN1bGF0aW9uIG9mIGFsbCBSZWxlYXNlQnJhbmNoZXNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlQ2FjaGVCcmVhaz1mYWxzZSAtIHRydWUgaWYgeW91IHdhbnQgdG8gZm9yY2UgYSByZWNhbGN1bGF0aW9uIG9mIGFsbCBSZWxlYXNlQnJhbmNoZXNcclxuICAgICAqIEBwYXJhbSB7TWFpbnRlbmFuY2V9IG1haW50ZW5hbmNlPU1haW50ZW5hbmNlLmxvYWQoKSAtIGJ5IGRlZmF1bHQgbG9hZCBmcm9tIHNhdmVkIGZpbGUgdGhlIGN1cnJlbnQgbWFpbnRlbmFuY2UgaW5zdGFuY2UuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlbGVhc2VCcmFuY2hbXT59XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBsb2FkQWxsTWFpbnRlbmFuY2VCcmFuY2hlcyggZm9yY2VDYWNoZUJyZWFrID0gZmFsc2UsIG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpICkge1xyXG5cclxuICAgICAgbGV0IHJlbGVhc2VCcmFuY2hlcyA9IG51bGw7XHJcbiAgICAgIGlmICggbWFpbnRlbmFuY2UuYWxsUmVsZWFzZUJyYW5jaGVzLmxlbmd0aCA+IDAgJiYgIWZvcmNlQ2FjaGVCcmVhayApIHtcclxuICAgICAgICBhc3NlcnQoIG1haW50ZW5hbmNlLmFsbFJlbGVhc2VCcmFuY2hlc1sgMCBdIGluc3RhbmNlb2YgUmVsZWFzZUJyYW5jaCwgJ2Rlc2VyaWFsaXphdGlvbiBjaGVjaycgKTtcclxuICAgICAgICByZWxlYXNlQnJhbmNoZXMgPSBtYWludGVuYW5jZS5hbGxSZWxlYXNlQnJhbmNoZXM7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgIC8vIGNhY2hlIG1pc3NcclxuICAgICAgICByZWxlYXNlQnJhbmNoZXMgPSBhd2FpdCBSZWxlYXNlQnJhbmNoLmdldEFsbE1haW50ZW5hbmNlQnJhbmNoZXMoKTtcclxuICAgICAgICBtYWludGVuYW5jZS5hbGxSZWxlYXNlQnJhbmNoZXMgPSByZWxlYXNlQnJhbmNoZXM7XHJcbiAgICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmVsZWFzZUJyYW5jaGVzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udmVydCBpbnRvIGEgcGxhaW4gSlMgb2JqZWN0IG1lYW50IGZvciBKU09OIHNlcmlhbGl6YXRpb24uXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1NlcmlhbGl6ZWRNYWludGVuYW5jZX0gLSBzZWUgUGF0Y2guc2VyaWFsaXplKCkgYW5kIE1vZGlmaWVkQnJhbmNoLnNlcmlhbGl6ZSgpXHJcbiAgICAgKi9cclxuICAgIHNlcmlhbGl6ZSgpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBwYXRjaGVzOiB0aGlzLnBhdGNoZXMubWFwKCBwYXRjaCA9PiBwYXRjaC5zZXJpYWxpemUoKSApLFxyXG4gICAgICAgIG1vZGlmaWVkQnJhbmNoZXM6IHRoaXMubW9kaWZpZWRCcmFuY2hlcy5tYXAoIG1vZGlmaWVkQnJhbmNoID0+IG1vZGlmaWVkQnJhbmNoLnNlcmlhbGl6ZSgpICksXHJcbiAgICAgICAgYWxsUmVsZWFzZUJyYW5jaGVzOiB0aGlzLmFsbFJlbGVhc2VCcmFuY2hlcy5tYXAoIHJlbGVhc2VCcmFuY2ggPT4gcmVsZWFzZUJyYW5jaC5zZXJpYWxpemUoKSApXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUYWtlcyBhIHNlcmlhbGl6ZWQgZm9ybSBvZiB0aGUgTWFpbnRlbmFuY2UgYW5kIHJldHVybnMgYW4gYWN0dWFsIGluc3RhbmNlLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U2VyaWFsaXplZE1haW50ZW5hbmNlfSAtIHNlZSBNYWludGVuYW5jZS5zZXJpYWxpemUoKVxyXG4gICAgICogQHJldHVybnMge01haW50ZW5hbmNlfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZGVzZXJpYWxpemUoIHsgcGF0Y2hlcyA9IFtdLCBtb2RpZmllZEJyYW5jaGVzID0gW10sIGFsbFJlbGVhc2VCcmFuY2hlcyA9IFtdIH0gKSB7XHJcbiAgICAgIC8vIFBhc3MgaW4gcGF0Y2ggcmVmZXJlbmNlcyB0byBicmFuY2ggZGVzZXJpYWxpemF0aW9uXHJcbiAgICAgIGNvbnN0IGRlc2VyaWFsaXplZFBhdGNoZXMgPSBwYXRjaGVzLm1hcCggUGF0Y2guZGVzZXJpYWxpemUgKTtcclxuICAgICAgbW9kaWZpZWRCcmFuY2hlcyA9IG1vZGlmaWVkQnJhbmNoZXMubWFwKCBtb2RpZmllZEJyYW5jaCA9PiBNb2RpZmllZEJyYW5jaC5kZXNlcmlhbGl6ZSggbW9kaWZpZWRCcmFuY2gsIGRlc2VyaWFsaXplZFBhdGNoZXMgKSApO1xyXG4gICAgICBtb2RpZmllZEJyYW5jaGVzLnNvcnQoICggYSwgYiApID0+IHtcclxuICAgICAgICBpZiAoIGEucmVwbyAhPT0gYi5yZXBvICkge1xyXG4gICAgICAgICAgcmV0dXJuIGEucmVwbyA8IGIucmVwbyA/IC0xIDogMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBhLmJyYW5jaCAhPT0gYi5icmFuY2ggKSB7XHJcbiAgICAgICAgICByZXR1cm4gYS5icmFuY2ggPCBiLmJyYW5jaCA/IC0xIDogMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgIH0gKTtcclxuICAgICAgY29uc3QgZGVzZXJpYWxpemVkUmVsZWFzZUJyYW5jaGVzID0gYWxsUmVsZWFzZUJyYW5jaGVzLm1hcCggcmVsZWFzZUJyYW5jaCA9PiBSZWxlYXNlQnJhbmNoLmRlc2VyaWFsaXplKCByZWxlYXNlQnJhbmNoICkgKTtcclxuXHJcbiAgICAgIHJldHVybiBuZXcgTWFpbnRlbmFuY2UoIGRlc2VyaWFsaXplZFBhdGNoZXMsIG1vZGlmaWVkQnJhbmNoZXMsIGRlc2VyaWFsaXplZFJlbGVhc2VCcmFuY2hlcyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2F2ZXMgdGhlIHN0YXRlIG9mIHRoaXMgb2JqZWN0IGludG8gdGhlIG1haW50ZW5hbmNlIGZpbGUuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIHNhdmUoKSB7XHJcbiAgICAgIHJldHVybiBmcy53cml0ZUZpbGVTeW5jKCBNQUlOVEVOQU5DRV9GSUxFLCBKU09OLnN0cmluZ2lmeSggdGhpcy5zZXJpYWxpemUoKSwgbnVsbCwgMiApICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMb2FkcyBhIG5ldyBNYWludGVuYW5jZSBvYmplY3QgKGlmIHBvc3NpYmxlKSBmcm9tIHRoZSBtYWludGVuYW5jZSBmaWxlLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtNYWludGVuYW5jZX1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGxvYWQoKSB7XHJcbiAgICAgIGlmICggZnMuZXhpc3RzU3luYyggTUFJTlRFTkFOQ0VfRklMRSApICkge1xyXG4gICAgICAgIHJldHVybiBNYWludGVuYW5jZS5kZXNlcmlhbGl6ZSggSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBNQUlOVEVOQU5DRV9GSUxFLCAndXRmOCcgKSApICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBNYWludGVuYW5jZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTdGFydHMgYSBjb21tYW5kLWxpbmUgUkVQTCB3aXRoIGZlYXR1cmVzIGxvYWRlZC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIHN0YXJ0UkVQTCgpIHtcclxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKCAoIHJlc29sdmUsIHJlamVjdCApID0+IHtcclxuICAgICAgICB3aW5zdG9uLmRlZmF1bHQudHJhbnNwb3J0cy5jb25zb2xlLmxldmVsID0gJ2Vycm9yJztcclxuXHJcbiAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHJlcGwuc3RhcnQoIHtcclxuICAgICAgICAgIHByb21wdDogJ21haW50ZW5hbmNlPiAnLFxyXG4gICAgICAgICAgdXNlQ29sb3JzOiB0cnVlLFxyXG4gICAgICAgICAgcmVwbE1vZGU6IHJlcGwuUkVQTF9NT0RFX1NUUklDVCxcclxuICAgICAgICAgIGlnbm9yZVVuZGVmaW5lZDogdHJ1ZVxyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgLy8gV2FpdCBmb3IgcHJvbWlzZXMgYmVmb3JlIGJlaW5nIHJlYWR5IGZvciBpbnB1dFxyXG4gICAgICAgIGNvbnN0IG5vZGVFdmFsID0gc2Vzc2lvbi5ldmFsO1xyXG4gICAgICAgIHNlc3Npb24uZXZhbCA9IGFzeW5jICggY21kLCBjb250ZXh0LCBmaWxlbmFtZSwgY2FsbGJhY2sgKSA9PiB7XHJcbiAgICAgICAgICBub2RlRXZhbCggY21kLCBjb250ZXh0LCBmaWxlbmFtZSwgKCBfLCByZXN1bHQgKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICggcmVzdWx0IGluc3RhbmNlb2YgUHJvbWlzZSApIHtcclxuICAgICAgICAgICAgICByZXN1bHQudGhlbiggdmFsID0+IGNhbGxiYWNrKCBfLCB2YWwgKSApLmNhdGNoKCBlID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICggZS5zdGFjayApIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvciggYE1haW50ZW5hbmNlIHRhc2sgZmFpbGVkOlxcbiR7ZS5zdGFja31cXG5GdWxsIEVycm9yIGRldGFpbHM6XFxuJHtKU09OLnN0cmluZ2lmeSggZSwgbnVsbCwgMiApfWAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgZSA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoIGBNYWludGVuYW5jZSB0YXNrIGZhaWxlZDogJHtlfWAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCBgTWFpbnRlbmFuY2UgdGFzayBmYWlsZWQgd2l0aCB1bmtub3duIGVycm9yOiAke0pTT04uc3RyaW5naWZ5KCBlLCBudWxsLCAyICl9YCApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICBjYWxsYmFjayggXywgcmVzdWx0ICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBPbmx5IGF1dG9jb21wbGV0ZSBcInB1YmxpY1wiIEFQSSBmdW5jdGlvbnMgZm9yIE1haW50ZW5hbmNlLlxyXG4gICAgICAgIC8vIGNvbnN0IG5vZGVDb21wbGV0ZXIgPSBzZXNzaW9uLmNvbXBsZXRlcjtcclxuICAgICAgICAvLyBzZXNzaW9uLmNvbXBsZXRlciA9IGZ1bmN0aW9uKCB0ZXh0LCBjYiApIHtcclxuICAgICAgICAvLyAgIG5vZGVDb21wbGV0ZXIoIHRleHQsICggXywgWyBjb21wbGV0aW9ucywgY29tcGxldGVkIF0gKSA9PiB7XHJcbiAgICAgICAgLy8gICAgIGNvbnN0IG1hdGNoID0gY29tcGxldGVkLm1hdGNoKCAvXk1haW50ZW5hbmNlXFwuKFxcdyopKy8gKTtcclxuICAgICAgICAvLyAgICAgaWYgKCBtYXRjaCApIHtcclxuICAgICAgICAvLyAgICAgICBjb25zdCBmdW5jU3RhcnQgPSBtYXRjaFsgMSBdO1xyXG4gICAgICAgIC8vICAgICAgIGNiKCBudWxsLCBbIFBVQkxJQ19GVU5DVElPTlMuZmlsdGVyKCBmID0+IGYuc3RhcnRzV2l0aCggZnVuY1N0YXJ0ICkgKS5tYXAoIGYgPT4gYE1haW50ZW5hbmNlLiR7Zn1gICksIGNvbXBsZXRlZCBdICk7XHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gICAgICAgY2IoIG51bGwsIFsgY29tcGxldGlvbnMsIGNvbXBsZXRlZCBdICk7XHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyAgIH0gKTtcclxuICAgICAgICAvLyB9O1xyXG5cclxuICAgICAgICAvLyBBbGxvdyBjb250cm9sbGluZyB2ZXJib3NpdHlcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIGdsb2JhbCwgJ3ZlcmJvc2UnLCB7XHJcbiAgICAgICAgICBnZXQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB3aW5zdG9uLmRlZmF1bHQudHJhbnNwb3J0cy5jb25zb2xlLmxldmVsID09PSAnaW5mbyc7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc2V0KCB2YWx1ZSApIHtcclxuICAgICAgICAgICAgd2luc3Rvbi5kZWZhdWx0LnRyYW5zcG9ydHMuY29uc29sZS5sZXZlbCA9IHZhbHVlID8gJ2luZm8nIDogJ2Vycm9yJztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIHNlc3Npb24uY29udGV4dC5NYWludGVuYW5jZSA9IE1haW50ZW5hbmNlO1xyXG4gICAgICAgIHNlc3Npb24uY29udGV4dC5tID0gTWFpbnRlbmFuY2U7XHJcbiAgICAgICAgc2Vzc2lvbi5jb250ZXh0Lk0gPSBNYWludGVuYW5jZTtcclxuICAgICAgICBzZXNzaW9uLmNvbnRleHQuUmVsZWFzZUJyYW5jaCA9IFJlbGVhc2VCcmFuY2g7XHJcbiAgICAgICAgc2Vzc2lvbi5jb250ZXh0LnJiID0gUmVsZWFzZUJyYW5jaDtcclxuXHJcbiAgICAgICAgc2Vzc2lvbi5vbiggJ2V4aXQnLCByZXNvbHZlICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIExvb2tzIHVwIGEgcGF0Y2ggYnkgaXRzIG5hbWUuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGNoTmFtZVxyXG4gICAgICogQHJldHVybnMge1BhdGNofVxyXG4gICAgICovXHJcbiAgICBmaW5kUGF0Y2goIHBhdGNoTmFtZSApIHtcclxuICAgICAgY29uc3QgcGF0Y2ggPSB0aGlzLnBhdGNoZXMuZmluZCggcCA9PiBwLm5hbWUgPT09IHBhdGNoTmFtZSApO1xyXG4gICAgICBhc3NlcnQoIHBhdGNoLCBgUGF0Y2ggbm90IGZvdW5kIGZvciAke3BhdGNoTmFtZX1gICk7XHJcblxyXG4gICAgICByZXR1cm4gcGF0Y2g7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMb29rcyB1cCAob3IgYWRkcykgYSBNb2RpZmllZEJyYW5jaCBieSBpdHMgaWRlbnRpZnlpbmcgaW5mb3JtYXRpb24uXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtlcnJvcklmTWlzc2luZ11cclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPFJlbGVhc2VCcmFuY2g+fSBbcmVsZWFzZUJyYW5jaGVzXSAtIElmIHByb3ZpZGVkLCBpdCB3aWxsIHNwZWVkIHVwIHRoZSBwcm9jZXNzXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48TW9kaWZpZWRCcmFuY2g+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBlbnN1cmVNb2RpZmllZEJyYW5jaCggcmVwbywgYnJhbmNoLCBlcnJvcklmTWlzc2luZyA9IGZhbHNlLCByZWxlYXNlQnJhbmNoZXMgPSBudWxsICkge1xyXG4gICAgICBsZXQgbW9kaWZpZWRCcmFuY2ggPSB0aGlzLm1vZGlmaWVkQnJhbmNoZXMuZmluZCggbW9kaWZpZWRCcmFuY2ggPT4gbW9kaWZpZWRCcmFuY2gucmVwbyA9PT0gcmVwbyAmJiBtb2RpZmllZEJyYW5jaC5icmFuY2ggPT09IGJyYW5jaCApO1xyXG5cclxuICAgICAgaWYgKCAhbW9kaWZpZWRCcmFuY2ggKSB7XHJcbiAgICAgICAgaWYgKCBlcnJvcklmTWlzc2luZyApIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYENvdWxkIG5vdCBmaW5kIGEgdHJhY2tlZCBtb2RpZmllZCBicmFuY2ggZm9yICR7cmVwb30gJHticmFuY2h9YCApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVXNlIHRoZSBpbnN0YW5jZSB2ZXJzaW9uIG9mIGdldE1haW50ZW5hbmNlQnJhbmNoZXMgdG8gbWFrZSBzdXJlIHRoYXQgdGhpcyBNYWludGVuYW5jZSBpbnN0YW5jZSBpcyB1cGRhdGVkIHdpdGggbmV3IFJlbGVhc2VCcmFuY2hlcy5cclxuICAgICAgICByZWxlYXNlQnJhbmNoZXMgPSByZWxlYXNlQnJhbmNoZXMgfHwgYXdhaXQgdGhpcy5nZXRNYWludGVuYW5jZUJyYW5jaGVzKCByZWxlYXNlQnJhbmNoID0+IHJlbGVhc2VCcmFuY2gucmVwbyA9PT0gcmVwbyApO1xyXG4gICAgICAgIGNvbnN0IHJlbGVhc2VCcmFuY2ggPSByZWxlYXNlQnJhbmNoZXMuZmluZCggcmVsZWFzZSA9PiByZWxlYXNlLnJlcG8gPT09IHJlcG8gJiYgcmVsZWFzZS5icmFuY2ggPT09IGJyYW5jaCApO1xyXG4gICAgICAgIGFzc2VydCggcmVsZWFzZUJyYW5jaCwgYENvdWxkIG5vdCBmaW5kIGEgcmVsZWFzZSBicmFuY2ggZm9yIHJlcG89JHtyZXBvfSBicmFuY2g9JHticmFuY2h9YCApO1xyXG5cclxuICAgICAgICBtb2RpZmllZEJyYW5jaCA9IG5ldyBNb2RpZmllZEJyYW5jaCggcmVsZWFzZUJyYW5jaCApO1xyXG5cclxuICAgICAgICAvLyBJZiB3ZSBhcmUgY3JlYXRpbmcgaXQsIGFkZCBpdCB0byBvdXIgbGlzdC5cclxuICAgICAgICB0aGlzLm1vZGlmaWVkQnJhbmNoZXMucHVzaCggbW9kaWZpZWRCcmFuY2ggKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG1vZGlmaWVkQnJhbmNoO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0ZW1wdHMgdG8gcmVtb3ZlIGEgbW9kaWZpZWQgYnJhbmNoIChpZiBpdCBkb2Vzbid0IG5lZWQgdG8gYmUga2VwdCBhcm91bmQpLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7TW9kaWZpZWRCcmFuY2h9IG1vZGlmaWVkQnJhbmNoXHJcbiAgICAgKi9cclxuICAgIHRyeVJlbW92aW5nTW9kaWZpZWRCcmFuY2goIG1vZGlmaWVkQnJhbmNoICkge1xyXG4gICAgICBpZiAoIG1vZGlmaWVkQnJhbmNoLmlzVW51c2VkICkge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5tb2RpZmllZEJyYW5jaGVzLmluZGV4T2YoIG1vZGlmaWVkQnJhbmNoICk7XHJcbiAgICAgICAgYXNzZXJ0KCBpbmRleCA+PSAwICk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kaWZpZWRCcmFuY2hlcy5zcGxpY2UoIGluZGV4LCAxICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBNYWludGVuYW5jZTtcclxufSApKCk7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OytDQUNBLHFKQUFBQSxtQkFBQSxZQUFBQSxvQkFBQSxXQUFBQyxDQUFBLFNBQUFDLENBQUEsRUFBQUQsQ0FBQSxPQUFBRSxDQUFBLEdBQUFDLE1BQUEsQ0FBQUMsU0FBQSxFQUFBQyxDQUFBLEdBQUFILENBQUEsQ0FBQUksY0FBQSxFQUFBQyxDQUFBLEdBQUFKLE1BQUEsQ0FBQUssY0FBQSxjQUFBUCxDQUFBLEVBQUFELENBQUEsRUFBQUUsQ0FBQSxJQUFBRCxDQUFBLENBQUFELENBQUEsSUFBQUUsQ0FBQSxDQUFBTyxLQUFBLEtBQUFDLENBQUEsd0JBQUFDLE1BQUEsR0FBQUEsTUFBQSxPQUFBQyxDQUFBLEdBQUFGLENBQUEsQ0FBQUcsUUFBQSxrQkFBQUMsQ0FBQSxHQUFBSixDQUFBLENBQUFLLGFBQUEsdUJBQUFDLENBQUEsR0FBQU4sQ0FBQSxDQUFBTyxXQUFBLDhCQUFBQyxPQUFBakIsQ0FBQSxF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QUMsRUFBRSxJQUFJLEVBQUUsQ0FBRSxDQUFDLENBQUcsQ0FBQzswQkFDaEc7d0JBQ0YsQ0FBRSxDQUFDO3NCQUNMLENBQUMsTUFDSTt3QkFDSDJvQixRQUFRLENBQUU1ZSxDQUFDLEVBQUUrZSxNQUFPLENBQUM7c0JBQ3ZCO29CQUNGLENBQUUsQ0FBQztrQkFBQztrQkFBQTtvQkFBQSxPQUFBRCxVQUFBLENBQUE5aUIsSUFBQTtnQkFBQTtjQUFBLEdBQUF5aUIsU0FBQTtZQUFBLENBQ0w7WUFBQSxpQkFBQVMsSUFBQSxFQUFBQyxJQUFBLEVBQUFDLElBQUEsRUFBQUMsSUFBQTtjQUFBLE9BQUFiLE1BQUEsQ0FBQXBoQixLQUFBLE9BQUFELFNBQUE7WUFBQTtVQUFBOztVQUVEO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQS9HLE1BQU0sQ0FBQ0ssY0FBYyxDQUFFNm9CLE1BQU0sRUFBRSxTQUFTLEVBQUU7WUFDeENDLEdBQUcsV0FBQUEsSUFBQSxFQUFHO2NBQ0osT0FBT3BmLE9BQU8sV0FBUSxDQUFDMGQsVUFBVSxDQUFDcGEsT0FBTyxDQUFDcWEsS0FBSyxLQUFLLE1BQU07WUFDNUQsQ0FBQztZQUNEMEIsR0FBRyxXQUFBQSxJQUFFOW9CLEtBQUssRUFBRztjQUNYeUosT0FBTyxXQUFRLENBQUMwZCxVQUFVLENBQUNwYSxPQUFPLENBQUNxYSxLQUFLLEdBQUdwbkIsS0FBSyxHQUFHLE1BQU0sR0FBRyxPQUFPO1lBQ3JFO1VBQ0YsQ0FBRSxDQUFDO1VBRUhxbkIsT0FBTyxDQUFDWSxPQUFPLENBQUNsZSxXQUFXLEdBQUdBLFdBQVc7VUFDekNzZCxPQUFPLENBQUNZLE9BQU8sQ0FBQ2MsQ0FBQyxHQUFHaGYsV0FBVztVQUMvQnNkLE9BQU8sQ0FBQ1ksT0FBTyxDQUFDZSxDQUFDLEdBQUdqZixXQUFXO1VBQy9Cc2QsT0FBTyxDQUFDWSxPQUFPLENBQUMvZixhQUFhLEdBQUdBLGFBQWE7VUFDN0NtZixPQUFPLENBQUNZLE9BQU8sQ0FBQ2dCLEVBQUUsR0FBRy9nQixhQUFhO1VBRWxDbWYsT0FBTyxDQUFDNkIsRUFBRSxDQUFFLE1BQU0sRUFBRXptQixPQUFRLENBQUM7UUFDL0IsQ0FBRSxDQUFDO01BQ0w7SUFBQztFQUFBO0VBZ0VILE9BQU9zSCxXQUFXO0FBQ3BCLENBQUMsQ0FBRyxDQUFDIiwiaWdub3JlTGlzdCI6W119