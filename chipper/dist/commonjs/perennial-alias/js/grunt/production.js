"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
// Copyright 2017, University of Colorado Boulder

/**
 * Deploys a production version after incrementing the test version number.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var SimVersion = require('../common/SimVersion');
var booleanPrompt = require('../common/booleanPrompt');
var build = require('../common/build');
var buildServerRequest = require('../common/buildServerRequest');
var checkoutMain = require('../common/checkoutMain');
var checkoutTarget = require('../common/checkoutTarget');
var execute = require('../common/execute');
var getDependencies = require('../common/getDependencies');
var getRepoVersion = require('../common/getRepoVersion');
var gitAdd = require('../common/gitAdd');
var gitCommit = require('../common/gitCommit');
var gitIsClean = require('../common/gitIsClean');
var gitPush = require('../common/gitPush');
var grunt = require('grunt');
var gruntCommand = require('../common/gruntCommand');
var hasRemoteBranch = require('../common/hasRemoteBranch');
var isPublished = require('../common/isPublished');
var npmUpdate = require('../common/npmUpdate');
var setRepoVersion = require('../common/setRepoVersion');
var simMetadata = require('../common/simMetadata');
var updateDependenciesJSON = require('../common/updateDependenciesJSON');
var vpnCheck = require('../common/vpnCheck');
var buildLocal = require('../common/buildLocal');
var assert = require('assert');

/**
 * Deploys a production version after incrementing the test version number.
 * @public
 *
 * @param {string} repo
 * @param {string} branch
 * @param {Array.<string>} brands
 * @param {boolean} noninteractive
 * @param {boolean} redeploy
 * @param {string} [message] - Optional message to append to the version-increment commit.
 * @returns {Promise.<SimVersion>}
 */
module.exports = /*#__PURE__*/function () {
  var _production = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(repo, branch, brands, noninteractive, redeploy, message) {
    var isClean, published, previousVersion, version, versionChanged, isFirstVersion, versionString, postBuildAbort, phetioLogText;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          SimVersion.ensureReleaseBranch(branch);
          _context2.next = 3;
          return vpnCheck();
        case 3:
          if (_context2.sent) {
            _context2.next = 5;
            break;
          }
          grunt.fail.fatal('VPN or being on campus is required for this build. Ensure VPN is enabled, or that you have access to phet-server2.int.colorado.edu');
        case 5:
          _context2.next = 7;
          return gitIsClean(repo);
        case 7:
          isClean = _context2.sent;
          if (isClean) {
            _context2.next = 10;
            break;
          }
          throw new Error("Unclean status in ".concat(repo, ", cannot create release branch"));
        case 10:
          _context2.next = 12;
          return hasRemoteBranch(repo, branch);
        case 12:
          if (_context2.sent) {
            _context2.next = 14;
            break;
          }
          throw new Error("Cannot find release branch ".concat(branch, " for ").concat(repo));
        case 14:
          if (!(!grunt.file.exists("../".concat(repo, "/assets/").concat(repo, "-screenshot.png")) && brands.includes('phet'))) {
            _context2.next = 16;
            break;
          }
          throw new Error("Missing screenshot file (".concat(repo, "/assets/").concat(repo, "-screenshot.png), aborting production deployment"));
        case 16:
          _context2.next = 18;
          return booleanPrompt('Are QA credits up-to-date?', noninteractive);
        case 18:
          if (_context2.sent) {
            _context2.next = 20;
            break;
          }
          throw new Error('Aborted production deployment');
        case 20:
          _context2.next = 22;
          return booleanPrompt('Have all maintenance patches that need spot checks been tested? (An issue would be created in the sim repo)', noninteractive);
        case 22:
          if (_context2.sent) {
            _context2.next = 24;
            break;
          }
          throw new Error('Aborted production deployment');
        case 24:
          redeploy && assert(noninteractive, 'redeploy can only be specified with noninteractive:true');
          _context2.next = 27;
          return isPublished(repo);
        case 27:
          published = _context2.sent;
          _context2.next = 30;
          return checkoutTarget(repo, branch, true);
        case 30:
          _context2.prev = 30;
          _context2.next = 33;
          return getRepoVersion(repo);
        case 33:
          previousVersion = _context2.sent;
          if (!(previousVersion.testType === null)) {
            _context2.next = 49;
            break;
          }
          _context2.t0 = !redeploy;
          if (!_context2.t0) {
            _context2.next = 43;
            break;
          }
          _context2.t1 = noninteractive;
          if (_context2.t1) {
            _context2.next = 42;
            break;
          }
          _context2.next = 41;
          return booleanPrompt("The last deployment was a production deployment (".concat(previousVersion.toString(), ") and an RC version is required between production versions. Would you like to redeploy ").concat(previousVersion.toString(), " (y) or cancel this process and revert to main (N)"), false);
        case 41:
          _context2.t1 = !_context2.sent;
        case 42:
          _context2.t0 = _context2.t1;
        case 43:
          if (!_context2.t0) {
            _context2.next = 45;
            break;
          }
          throw new Error('Aborted production deployment: It appears that the last deployment was for production.');
        case 45:
          version = previousVersion;
          versionChanged = false;
          _context2.next = 55;
          break;
        case 49:
          if (!(previousVersion.testType === 'rc')) {
            _context2.next = 54;
            break;
          }
          version = new SimVersion(previousVersion.major, previousVersion.minor, previousVersion.maintenance);
          versionChanged = true;
          _context2.next = 55;
          break;
        case 54:
          throw new Error('Aborted production deployment since the version number cannot be incremented safely');
        case 55:
          _context2.next = 57;
          return simMetadata({
            simulation: repo
          });
        case 57:
          isFirstVersion = !_context2.sent.projects;
          if (!isFirstVersion) {
            _context2.next = 63;
            break;
          }
          _context2.next = 61;
          return booleanPrompt('Is the main checklist complete (e.g. are screenshots added to assets, etc.)', noninteractive);
        case 61:
          if (_context2.sent) {
            _context2.next = 63;
            break;
          }
          throw new Error('Aborted production deployment');
        case 63:
          versionString = version.toString(); // caps-lock should hopefully shout this at people. do we have a text-to-speech synthesizer we can shout out of their speakers?
          // SECOND THOUGHT: this would be horrible during automated maintenance releases.
          _context2.next = 66;
          return booleanPrompt("DEPLOY ".concat(repo, " ").concat(versionString, " (brands: ").concat(brands.join(','), ") to PRODUCTION"), noninteractive);
        case 66:
          if (_context2.sent) {
            _context2.next = 68;
            break;
          }
          throw new Error('Aborted production deployment');
        case 68:
          if (!versionChanged) {
            _context2.next = 73;
            break;
          }
          _context2.next = 71;
          return setRepoVersion(repo, version, message);
        case 71:
          _context2.next = 73;
          return gitPush(repo, branch);
        case 73:
          _context2.next = 75;
          return npmUpdate(repo);
        case 75:
          _context2.next = 77;
          return npmUpdate('chipper');
        case 77:
          _context2.next = 79;
          return npmUpdate('perennial-alias');
        case 79:
          if (!published) {
            _context2.next = 109;
            break;
          }
          grunt.log.writeln('Updating branch README');
          _context2.prev = 81;
          _context2.next = 84;
          return execute(gruntCommand, ['published-README'], "../".concat(repo));
        case 84:
          _context2.next = 97;
          break;
        case 86:
          _context2.prev = 86;
          _context2.t2 = _context2["catch"](81);
          grunt.log.writeln('published-README error, may not exist, will try generate-published-README');
          _context2.prev = 89;
          _context2.next = 92;
          return execute(gruntCommand, ['generate-published-README'], "../".concat(repo));
        case 92:
          _context2.next = 97;
          break;
        case 94:
          _context2.prev = 94;
          _context2.t3 = _context2["catch"](89);
          grunt.log.writeln('No published README generation found');
        case 97:
          _context2.next = 99;
          return gitAdd(repo, 'README.md');
        case 99:
          _context2.prev = 99;
          _context2.next = 102;
          return gitCommit(repo, "Generated published README.md as part of a production deploy for ".concat(versionString));
        case 102:
          _context2.next = 104;
          return gitPush(repo, branch);
        case 104:
          _context2.next = 109;
          break;
        case 106:
          _context2.prev = 106;
          _context2.t4 = _context2["catch"](99);
          grunt.log.writeln('Production README is already up-to-date');
        case 109:
          _context2.t5 = grunt.log;
          _context2.next = 112;
          return build(repo, {
            brands: brands,
            minify: !noninteractive
          });
        case 112:
          _context2.t6 = _context2.sent;
          _context2.t5.writeln.call(_context2.t5, _context2.t6);
          /**
           * The necessary clean up steps to do if aborting after the build
           * @param {string} message - message to error out with
           * @returns {Promise.<void>}
           */
          postBuildAbort = /*#__PURE__*/function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(message) {
              return _regeneratorRuntime().wrap(function _callee$(_context) {
                while (1) switch (_context.prev = _context.next) {
                  case 0:
                    if (!versionChanged) {
                      _context.next = 5;
                      break;
                    }
                    _context.next = 3;
                    return setRepoVersion(repo, previousVersion, message);
                  case 3:
                    _context.next = 5;
                    return gitPush(repo, branch);
                  case 5:
                    throw new Error(message);
                  case 6:
                  case "end":
                    return _context.stop();
                }
              }, _callee);
            }));
            return function postBuildAbort(_x7) {
              return _ref.apply(this, arguments);
            };
          }();
          _context2.next = 117;
          return booleanPrompt("Please test the built version of ".concat(repo, ".\nIs it ready to deploy?"), noninteractive);
        case 117:
          if (_context2.sent) {
            _context2.next = 120;
            break;
          }
          _context2.next = 120;
          return postBuildAbort('Aborted production deployment (aborted version change too).');
        case 120:
          _context2.next = 122;
          return updateDependenciesJSON(repo, brands, versionString, branch);
        case 122:
          _context2.t7 = buildServerRequest;
          _context2.t8 = repo;
          _context2.t9 = version;
          _context2.t10 = branch;
          _context2.next = 128;
          return getDependencies(repo);
        case 128:
          _context2.t11 = _context2.sent;
          _context2.t12 = {
            locales: '*',
            brands: brands,
            servers: ['dev', 'production']
          };
          _context2.next = 132;
          return (0, _context2.t7)(_context2.t8, _context2.t9, _context2.t10, _context2.t11, _context2.t12);
        case 132:
          _context2.next = 134;
          return checkoutMain(repo, true);
        case 134:
          if (brands.includes('phet')) {
            grunt.log.writeln("Deployed: https://phet.colorado.edu/sims/html/".concat(repo, "/latest/").concat(repo, "_all.html"));
          }
          if (brands.includes('phet-io')) {
            grunt.log.writeln("Deployed: https://phet-io.colorado.edu/sims/".concat(repo, "/").concat(versionString, "/"));
          }
          grunt.log.writeln('Please wait for the build-server to complete the deployment, and then test!');
          grunt.log.writeln("To view the current build status, visit ".concat(buildLocal.productionServerURL, "/deploy-status"));
          if (!(isFirstVersion && brands.includes('phet'))) {
            _context2.next = 156;
            break;
          }
          grunt.log.writeln('After testing, let the simulation lead know it has been deployed, so they can edit metadata on the website');

          // Update the README on main
          if (!published) {
            _context2.next = 156;
            break;
          }
          grunt.log.writeln('Updating main README');
          _context2.next = 144;
          return execute(gruntCommand, ['published-README'], "../".concat(repo));
        case 144:
          _context2.next = 146;
          return gitAdd(repo, 'README.md');
        case 146:
          _context2.prev = 146;
          _context2.next = 149;
          return gitCommit(repo, "Generated published README.md as part of a production deploy for ".concat(versionString));
        case 149:
          _context2.next = 151;
          return gitPush(repo, 'main');
        case 151:
          _context2.next = 156;
          break;
        case 153:
          _context2.prev = 153;
          _context2.t13 = _context2["catch"](146);
          grunt.log.writeln('Production README is already up-to-date');
        case 156:
          // phet-io nags from the checklist
          if (brands.includes('phet-io')) {
            phetioLogText = "\nPhET-iO deploys involve a couple of extra steps after production. Please ensure the following are accomplished:\n1. Make sure the sim is listed in perennial/data/phet-io-api-stable if it has had a designed production release (and that the API is up to date).\n2. Make sure the sim is listed in perennial/data/phet-io-hydrogen.json. It is almost certainly part of this featureset. \n3. Create an issue in the phet-io repo using the \"New PhET-iO Simulation Publication\" issue template.\n      ";
            grunt.log.writeln(phetioLogText);
          }
          return _context2.abrupt("return", version);
        case 160:
          _context2.prev = 160;
          _context2.t14 = _context2["catch"](30);
          grunt.log.warn('Detected failure during deploy, reverting to main');
          _context2.next = 165;
          return checkoutMain(repo, true);
        case 165:
          throw _context2.t14;
        case 166:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[30, 160], [81, 86], [89, 94], [99, 106], [146, 153]]);
  }));
  function production(_x, _x2, _x3, _x4, _x5, _x6) {
    return _production.apply(this, arguments);
  }
  return production;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVnZW5lcmF0b3JSdW50aW1lIiwiZSIsInQiLCJyIiwiT2JqZWN0IiwicHJvdG90eXBlIiwibiIsImhhc093blByb3BlcnR5IiwibyIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJpIiwiU3ltYm9sIiwiYSIsIml0ZXJhdG9yIiwiYyIsImFzeW5jSXRlcmF0b3IiLCJ1IiwidG9TdHJpbmdUYWciLCJkZWZpbmUiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ3cmFwIiwiR2VuZXJhdG9yIiwiY3JlYXRlIiwiQ29udGV4dCIsIm1ha2VJbnZva2VNZXRob2QiLCJ0cnlDYXRjaCIsInR5cGUiLCJhcmciLCJjYWxsIiwiaCIsImwiLCJmIiwicyIsInkiLCJHZW5lcmF0b3JGdW5jdGlvbiIsIkdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlIiwicCIsImQiLCJnZXRQcm90b3R5cGVPZiIsInYiLCJ2YWx1ZXMiLCJnIiwiZGVmaW5lSXRlcmF0b3JNZXRob2RzIiwiZm9yRWFjaCIsIl9pbnZva2UiLCJBc3luY0l0ZXJhdG9yIiwiaW52b2tlIiwiX3R5cGVvZiIsInJlc29sdmUiLCJfX2F3YWl0IiwidGhlbiIsImNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnIiwiRXJyb3IiLCJkb25lIiwibWV0aG9kIiwiZGVsZWdhdGUiLCJtYXliZUludm9rZURlbGVnYXRlIiwic2VudCIsIl9zZW50IiwiZGlzcGF0Y2hFeGNlcHRpb24iLCJhYnJ1cHQiLCJUeXBlRXJyb3IiLCJyZXN1bHROYW1lIiwibmV4dCIsIm5leHRMb2MiLCJwdXNoVHJ5RW50cnkiLCJ0cnlMb2MiLCJjYXRjaExvYyIsImZpbmFsbHlMb2MiLCJhZnRlckxvYyIsInRyeUVudHJpZXMiLCJwdXNoIiwicmVzZXRUcnlFbnRyeSIsImNvbXBsZXRpb24iLCJyZXNldCIsImlzTmFOIiwibGVuZ3RoIiwiZGlzcGxheU5hbWUiLCJpc0dlbmVyYXRvckZ1bmN0aW9uIiwiY29uc3RydWN0b3IiLCJuYW1lIiwibWFyayIsInNldFByb3RvdHlwZU9mIiwiX19wcm90b19fIiwiYXdyYXAiLCJhc3luYyIsIlByb21pc2UiLCJrZXlzIiwicmV2ZXJzZSIsInBvcCIsInByZXYiLCJjaGFyQXQiLCJzbGljZSIsInN0b3AiLCJydmFsIiwiaGFuZGxlIiwiY29tcGxldGUiLCJmaW5pc2giLCJfY2F0Y2giLCJkZWxlZ2F0ZVlpZWxkIiwiYXN5bmNHZW5lcmF0b3JTdGVwIiwiZ2VuIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJpbmZvIiwiZXJyb3IiLCJfYXN5bmNUb0dlbmVyYXRvciIsImZuIiwic2VsZiIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsImVyciIsInVuZGVmaW5lZCIsIlNpbVZlcnNpb24iLCJyZXF1aXJlIiwiYm9vbGVhblByb21wdCIsImJ1aWxkIiwiYnVpbGRTZXJ2ZXJSZXF1ZXN0IiwiY2hlY2tvdXRNYWluIiwiY2hlY2tvdXRUYXJnZXQiLCJleGVjdXRlIiwiZ2V0RGVwZW5kZW5jaWVzIiwiZ2V0UmVwb1ZlcnNpb24iLCJnaXRBZGQiLCJnaXRDb21taXQiLCJnaXRJc0NsZWFuIiwiZ2l0UHVzaCIsImdydW50IiwiZ3J1bnRDb21tYW5kIiwiaGFzUmVtb3RlQnJhbmNoIiwiaXNQdWJsaXNoZWQiLCJucG1VcGRhdGUiLCJzZXRSZXBvVmVyc2lvbiIsInNpbU1ldGFkYXRhIiwidXBkYXRlRGVwZW5kZW5jaWVzSlNPTiIsInZwbkNoZWNrIiwiYnVpbGRMb2NhbCIsImFzc2VydCIsIm1vZHVsZSIsImV4cG9ydHMiLCJfcHJvZHVjdGlvbiIsIl9jYWxsZWUyIiwicmVwbyIsImJyYW5jaCIsImJyYW5kcyIsIm5vbmludGVyYWN0aXZlIiwicmVkZXBsb3kiLCJtZXNzYWdlIiwiaXNDbGVhbiIsInB1Ymxpc2hlZCIsInByZXZpb3VzVmVyc2lvbiIsInZlcnNpb24iLCJ2ZXJzaW9uQ2hhbmdlZCIsImlzRmlyc3RWZXJzaW9uIiwidmVyc2lvblN0cmluZyIsInBvc3RCdWlsZEFib3J0IiwicGhldGlvTG9nVGV4dCIsIl9jYWxsZWUyJCIsIl9jb250ZXh0MiIsImVuc3VyZVJlbGVhc2VCcmFuY2giLCJmYWlsIiwiZmF0YWwiLCJjb25jYXQiLCJmaWxlIiwiZXhpc3RzIiwiaW5jbHVkZXMiLCJ0ZXN0VHlwZSIsInQwIiwidDEiLCJ0b1N0cmluZyIsIm1ham9yIiwibWlub3IiLCJtYWludGVuYW5jZSIsInNpbXVsYXRpb24iLCJwcm9qZWN0cyIsImpvaW4iLCJsb2ciLCJ3cml0ZWxuIiwidDIiLCJ0MyIsInQ0IiwidDUiLCJtaW5pZnkiLCJ0NiIsIl9yZWYiLCJfY2FsbGVlIiwiX2NhbGxlZSQiLCJfY29udGV4dCIsIl94NyIsInQ3IiwidDgiLCJ0OSIsInQxMCIsInQxMSIsInQxMiIsImxvY2FsZXMiLCJzZXJ2ZXJzIiwicHJvZHVjdGlvblNlcnZlclVSTCIsInQxMyIsInQxNCIsIndhcm4iLCJwcm9kdWN0aW9uIiwiX3giLCJfeDIiLCJfeDMiLCJfeDQiLCJfeDUiLCJfeDYiXSwic291cmNlcyI6WyJwcm9kdWN0aW9uLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBEZXBsb3lzIGEgcHJvZHVjdGlvbiB2ZXJzaW9uIGFmdGVyIGluY3JlbWVudGluZyB0aGUgdGVzdCB2ZXJzaW9uIG51bWJlci5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmNvbnN0IFNpbVZlcnNpb24gPSByZXF1aXJlKCAnLi4vY29tbW9uL1NpbVZlcnNpb24nICk7XHJcbmNvbnN0IGJvb2xlYW5Qcm9tcHQgPSByZXF1aXJlKCAnLi4vY29tbW9uL2Jvb2xlYW5Qcm9tcHQnICk7XHJcbmNvbnN0IGJ1aWxkID0gcmVxdWlyZSggJy4uL2NvbW1vbi9idWlsZCcgKTtcclxuY29uc3QgYnVpbGRTZXJ2ZXJSZXF1ZXN0ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9idWlsZFNlcnZlclJlcXVlc3QnICk7XHJcbmNvbnN0IGNoZWNrb3V0TWFpbiA9IHJlcXVpcmUoICcuLi9jb21tb24vY2hlY2tvdXRNYWluJyApO1xyXG5jb25zdCBjaGVja291dFRhcmdldCA9IHJlcXVpcmUoICcuLi9jb21tb24vY2hlY2tvdXRUYXJnZXQnICk7XHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi4vY29tbW9uL2V4ZWN1dGUnICk7XHJcbmNvbnN0IGdldERlcGVuZGVuY2llcyA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2V0RGVwZW5kZW5jaWVzJyApO1xyXG5jb25zdCBnZXRSZXBvVmVyc2lvbiA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2V0UmVwb1ZlcnNpb24nICk7XHJcbmNvbnN0IGdpdEFkZCA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2l0QWRkJyApO1xyXG5jb25zdCBnaXRDb21taXQgPSByZXF1aXJlKCAnLi4vY29tbW9uL2dpdENvbW1pdCcgKTtcclxuY29uc3QgZ2l0SXNDbGVhbiA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2l0SXNDbGVhbicgKTtcclxuY29uc3QgZ2l0UHVzaCA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2l0UHVzaCcgKTtcclxuY29uc3QgZ3J1bnQgPSByZXF1aXJlKCAnZ3J1bnQnICk7XHJcbmNvbnN0IGdydW50Q29tbWFuZCA9IHJlcXVpcmUoICcuLi9jb21tb24vZ3J1bnRDb21tYW5kJyApO1xyXG5jb25zdCBoYXNSZW1vdGVCcmFuY2ggPSByZXF1aXJlKCAnLi4vY29tbW9uL2hhc1JlbW90ZUJyYW5jaCcgKTtcclxuY29uc3QgaXNQdWJsaXNoZWQgPSByZXF1aXJlKCAnLi4vY29tbW9uL2lzUHVibGlzaGVkJyApO1xyXG5jb25zdCBucG1VcGRhdGUgPSByZXF1aXJlKCAnLi4vY29tbW9uL25wbVVwZGF0ZScgKTtcclxuY29uc3Qgc2V0UmVwb1ZlcnNpb24gPSByZXF1aXJlKCAnLi4vY29tbW9uL3NldFJlcG9WZXJzaW9uJyApO1xyXG5jb25zdCBzaW1NZXRhZGF0YSA9IHJlcXVpcmUoICcuLi9jb21tb24vc2ltTWV0YWRhdGEnICk7XHJcbmNvbnN0IHVwZGF0ZURlcGVuZGVuY2llc0pTT04gPSByZXF1aXJlKCAnLi4vY29tbW9uL3VwZGF0ZURlcGVuZGVuY2llc0pTT04nICk7XHJcbmNvbnN0IHZwbkNoZWNrID0gcmVxdWlyZSggJy4uL2NvbW1vbi92cG5DaGVjaycgKTtcclxuY29uc3QgYnVpbGRMb2NhbCA9IHJlcXVpcmUoICcuLi9jb21tb24vYnVpbGRMb2NhbCcgKTtcclxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcclxuXHJcbi8qKlxyXG4gKiBEZXBsb3lzIGEgcHJvZHVjdGlvbiB2ZXJzaW9uIGFmdGVyIGluY3JlbWVudGluZyB0aGUgdGVzdCB2ZXJzaW9uIG51bWJlci5cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoXHJcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGJyYW5kc1xyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG5vbmludGVyYWN0aXZlXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gcmVkZXBsb3lcclxuICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSAtIE9wdGlvbmFsIG1lc3NhZ2UgdG8gYXBwZW5kIHRvIHRoZSB2ZXJzaW9uLWluY3JlbWVudCBjb21taXQuXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxTaW1WZXJzaW9uPn1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gcHJvZHVjdGlvbiggcmVwbywgYnJhbmNoLCBicmFuZHMsIG5vbmludGVyYWN0aXZlLCByZWRlcGxveSwgbWVzc2FnZSApIHtcclxuICBTaW1WZXJzaW9uLmVuc3VyZVJlbGVhc2VCcmFuY2goIGJyYW5jaCApO1xyXG5cclxuICBpZiAoICEoIGF3YWl0IHZwbkNoZWNrKCkgKSApIHtcclxuICAgIGdydW50LmZhaWwuZmF0YWwoICdWUE4gb3IgYmVpbmcgb24gY2FtcHVzIGlzIHJlcXVpcmVkIGZvciB0aGlzIGJ1aWxkLiBFbnN1cmUgVlBOIGlzIGVuYWJsZWQsIG9yIHRoYXQgeW91IGhhdmUgYWNjZXNzIHRvIHBoZXQtc2VydmVyMi5pbnQuY29sb3JhZG8uZWR1JyApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaXNDbGVhbiA9IGF3YWl0IGdpdElzQ2xlYW4oIHJlcG8gKTtcclxuICBpZiAoICFpc0NsZWFuICkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCBgVW5jbGVhbiBzdGF0dXMgaW4gJHtyZXBvfSwgY2Fubm90IGNyZWF0ZSByZWxlYXNlIGJyYW5jaGAgKTtcclxuICB9XHJcblxyXG4gIGlmICggISggYXdhaXQgaGFzUmVtb3RlQnJhbmNoKCByZXBvLCBicmFuY2ggKSApICkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCBgQ2Fubm90IGZpbmQgcmVsZWFzZSBicmFuY2ggJHticmFuY2h9IGZvciAke3JlcG99YCApO1xyXG4gIH1cclxuXHJcbiAgaWYgKCAhZ3J1bnQuZmlsZS5leGlzdHMoIGAuLi8ke3JlcG99L2Fzc2V0cy8ke3JlcG99LXNjcmVlbnNob3QucG5nYCApICYmIGJyYW5kcy5pbmNsdWRlcyggJ3BoZXQnICkgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoIGBNaXNzaW5nIHNjcmVlbnNob3QgZmlsZSAoJHtyZXBvfS9hc3NldHMvJHtyZXBvfS1zY3JlZW5zaG90LnBuZyksIGFib3J0aW5nIHByb2R1Y3Rpb24gZGVwbG95bWVudGAgKTtcclxuICB9XHJcblxyXG4gIGlmICggIWF3YWl0IGJvb2xlYW5Qcm9tcHQoICdBcmUgUUEgY3JlZGl0cyB1cC10by1kYXRlPycsIG5vbmludGVyYWN0aXZlICkgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoICdBYm9ydGVkIHByb2R1Y3Rpb24gZGVwbG95bWVudCcgKTtcclxuICB9XHJcblxyXG4gIGlmICggIWF3YWl0IGJvb2xlYW5Qcm9tcHQoICdIYXZlIGFsbCBtYWludGVuYW5jZSBwYXRjaGVzIHRoYXQgbmVlZCBzcG90IGNoZWNrcyBiZWVuIHRlc3RlZD8gKEFuIGlzc3VlIHdvdWxkIGJlIGNyZWF0ZWQgaW4gdGhlIHNpbSByZXBvKScsIG5vbmludGVyYWN0aXZlICkgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoICdBYm9ydGVkIHByb2R1Y3Rpb24gZGVwbG95bWVudCcgKTtcclxuICB9XHJcblxyXG4gIHJlZGVwbG95ICYmIGFzc2VydCggbm9uaW50ZXJhY3RpdmUsICdyZWRlcGxveSBjYW4gb25seSBiZSBzcGVjaWZpZWQgd2l0aCBub25pbnRlcmFjdGl2ZTp0cnVlJyApO1xyXG5cclxuICBjb25zdCBwdWJsaXNoZWQgPSBhd2FpdCBpc1B1Ymxpc2hlZCggcmVwbyApO1xyXG5cclxuICBhd2FpdCBjaGVja291dFRhcmdldCggcmVwbywgYnJhbmNoLCB0cnVlICk7IC8vIGluY2x1ZGUgbnBtIHVwZGF0ZVxyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcHJldmlvdXNWZXJzaW9uID0gYXdhaXQgZ2V0UmVwb1ZlcnNpb24oIHJlcG8gKTtcclxuICAgIGxldCB2ZXJzaW9uO1xyXG4gICAgbGV0IHZlcnNpb25DaGFuZ2VkO1xyXG5cclxuICAgIGlmICggcHJldmlvdXNWZXJzaW9uLnRlc3RUeXBlID09PSBudWxsICkge1xyXG5cclxuICAgICAgLy8gcmVkZXBsb3kgZmxhZyBjYW4gYnlwYXNzIHRoaXMgcHJvbXB0IGFuZCBlcnJvclxyXG4gICAgICBpZiAoICFyZWRlcGxveSAmJiAoIG5vbmludGVyYWN0aXZlIHx8ICFhd2FpdCBib29sZWFuUHJvbXB0KCBgVGhlIGxhc3QgZGVwbG95bWVudCB3YXMgYSBwcm9kdWN0aW9uIGRlcGxveW1lbnQgKCR7cHJldmlvdXNWZXJzaW9uLnRvU3RyaW5nKCl9KSBhbmQgYW4gUkMgdmVyc2lvbiBpcyByZXF1aXJlZCBiZXR3ZWVuIHByb2R1Y3Rpb24gdmVyc2lvbnMuIFdvdWxkIHlvdSBsaWtlIHRvIHJlZGVwbG95ICR7cHJldmlvdXNWZXJzaW9uLnRvU3RyaW5nKCl9ICh5KSBvciBjYW5jZWwgdGhpcyBwcm9jZXNzIGFuZCByZXZlcnQgdG8gbWFpbiAoTilgLCBmYWxzZSApICkgKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQWJvcnRlZCBwcm9kdWN0aW9uIGRlcGxveW1lbnQ6IEl0IGFwcGVhcnMgdGhhdCB0aGUgbGFzdCBkZXBsb3ltZW50IHdhcyBmb3IgcHJvZHVjdGlvbi4nICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZlcnNpb24gPSBwcmV2aW91c1ZlcnNpb247XHJcbiAgICAgIHZlcnNpb25DaGFuZ2VkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggcHJldmlvdXNWZXJzaW9uLnRlc3RUeXBlID09PSAncmMnICkge1xyXG4gICAgICB2ZXJzaW9uID0gbmV3IFNpbVZlcnNpb24oIHByZXZpb3VzVmVyc2lvbi5tYWpvciwgcHJldmlvdXNWZXJzaW9uLm1pbm9yLCBwcmV2aW91c1ZlcnNpb24ubWFpbnRlbmFuY2UgKTtcclxuICAgICAgdmVyc2lvbkNoYW5nZWQgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggJ0Fib3J0ZWQgcHJvZHVjdGlvbiBkZXBsb3ltZW50IHNpbmNlIHRoZSB2ZXJzaW9uIG51bWJlciBjYW5ub3QgYmUgaW5jcmVtZW50ZWQgc2FmZWx5JyApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGlzRmlyc3RWZXJzaW9uID0gISggYXdhaXQgc2ltTWV0YWRhdGEoIHtcclxuICAgICAgc2ltdWxhdGlvbjogcmVwb1xyXG4gICAgfSApICkucHJvamVjdHM7XHJcblxyXG4gICAgLy8gSW5pdGlhbCBkZXBsb3ltZW50IG5hZ3NcclxuICAgIGlmICggaXNGaXJzdFZlcnNpb24gKSB7XHJcbiAgICAgIGlmICggIWF3YWl0IGJvb2xlYW5Qcm9tcHQoICdJcyB0aGUgbWFpbiBjaGVja2xpc3QgY29tcGxldGUgKGUuZy4gYXJlIHNjcmVlbnNob3RzIGFkZGVkIHRvIGFzc2V0cywgZXRjLiknLCBub25pbnRlcmFjdGl2ZSApICkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvciggJ0Fib3J0ZWQgcHJvZHVjdGlvbiBkZXBsb3ltZW50JyApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdmVyc2lvblN0cmluZyA9IHZlcnNpb24udG9TdHJpbmcoKTtcclxuXHJcbiAgICAvLyBjYXBzLWxvY2sgc2hvdWxkIGhvcGVmdWxseSBzaG91dCB0aGlzIGF0IHBlb3BsZS4gZG8gd2UgaGF2ZSBhIHRleHQtdG8tc3BlZWNoIHN5bnRoZXNpemVyIHdlIGNhbiBzaG91dCBvdXQgb2YgdGhlaXIgc3BlYWtlcnM/XHJcbiAgICAvLyBTRUNPTkQgVEhPVUdIVDogdGhpcyB3b3VsZCBiZSBob3JyaWJsZSBkdXJpbmcgYXV0b21hdGVkIG1haW50ZW5hbmNlIHJlbGVhc2VzLlxyXG4gICAgaWYgKCAhYXdhaXQgYm9vbGVhblByb21wdCggYERFUExPWSAke3JlcG99ICR7dmVyc2lvblN0cmluZ30gKGJyYW5kczogJHticmFuZHMuam9pbiggJywnICl9KSB0byBQUk9EVUNUSU9OYCwgbm9uaW50ZXJhY3RpdmUgKSApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQWJvcnRlZCBwcm9kdWN0aW9uIGRlcGxveW1lbnQnICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB2ZXJzaW9uQ2hhbmdlZCApIHtcclxuICAgICAgYXdhaXQgc2V0UmVwb1ZlcnNpb24oIHJlcG8sIHZlcnNpb24sIG1lc3NhZ2UgKTtcclxuICAgICAgYXdhaXQgZ2l0UHVzaCggcmVwbywgYnJhbmNoICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIG91ciBjb3JyZWN0IG5wbSBkZXBlbmRlbmNpZXMgYXJlIHNldFxyXG4gICAgYXdhaXQgbnBtVXBkYXRlKCByZXBvICk7XHJcbiAgICBhd2FpdCBucG1VcGRhdGUoICdjaGlwcGVyJyApO1xyXG4gICAgYXdhaXQgbnBtVXBkYXRlKCAncGVyZW5uaWFsLWFsaWFzJyApO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgUkVBRE1FIG9uIHRoZSBicmFuY2hcclxuICAgIGlmICggcHVibGlzaGVkICkge1xyXG4gICAgICBncnVudC5sb2cud3JpdGVsbiggJ1VwZGF0aW5nIGJyYW5jaCBSRUFETUUnICk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgZXhlY3V0ZSggZ3J1bnRDb21tYW5kLCBbICdwdWJsaXNoZWQtUkVBRE1FJyBdLCBgLi4vJHtyZXBvfWAgKTtcclxuICAgICAgfVxyXG4gICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICBncnVudC5sb2cud3JpdGVsbiggJ3B1Ymxpc2hlZC1SRUFETUUgZXJyb3IsIG1heSBub3QgZXhpc3QsIHdpbGwgdHJ5IGdlbmVyYXRlLXB1Ymxpc2hlZC1SRUFETUUnICk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGF3YWl0IGV4ZWN1dGUoIGdydW50Q29tbWFuZCwgWyAnZ2VuZXJhdGUtcHVibGlzaGVkLVJFQURNRScgXSwgYC4uLyR7cmVwb31gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgICAgZ3J1bnQubG9nLndyaXRlbG4oICdObyBwdWJsaXNoZWQgUkVBRE1FIGdlbmVyYXRpb24gZm91bmQnICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGF3YWl0IGdpdEFkZCggcmVwbywgJ1JFQURNRS5tZCcgKTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBnaXRDb21taXQoIHJlcG8sIGBHZW5lcmF0ZWQgcHVibGlzaGVkIFJFQURNRS5tZCBhcyBwYXJ0IG9mIGEgcHJvZHVjdGlvbiBkZXBsb3kgZm9yICR7dmVyc2lvblN0cmluZ31gICk7XHJcbiAgICAgICAgYXdhaXQgZ2l0UHVzaCggcmVwbywgYnJhbmNoICk7XHJcbiAgICAgIH1cclxuICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgZ3J1bnQubG9nLndyaXRlbG4oICdQcm9kdWN0aW9uIFJFQURNRSBpcyBhbHJlYWR5IHVwLXRvLWRhdGUnICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBObyBzcGVjaWFsIG9wdGlvbnMgcmVxdWlyZWQgaGVyZSwgYXMgd2Ugc2VuZCB0aGUgbWFpbiByZXF1ZXN0IHRvIHRoZSBidWlsZCBzZXJ2ZXJcclxuICAgIGdydW50LmxvZy53cml0ZWxuKCBhd2FpdCBidWlsZCggcmVwbywge1xyXG4gICAgICBicmFuZHM6IGJyYW5kcyxcclxuICAgICAgbWluaWZ5OiAhbm9uaW50ZXJhY3RpdmVcclxuICAgIH0gKSApO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIG5lY2Vzc2FyeSBjbGVhbiB1cCBzdGVwcyB0byBkbyBpZiBhYm9ydGluZyBhZnRlciB0aGUgYnVpbGRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gbWVzc2FnZSB0byBlcnJvciBvdXQgd2l0aFxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPHZvaWQ+fVxyXG4gICAgICovXHJcbiAgICBjb25zdCBwb3N0QnVpbGRBYm9ydCA9IGFzeW5jIG1lc3NhZ2UgPT4ge1xyXG5cclxuICAgICAgLy8gQWJvcnQgdmVyc2lvbiB1cGRhdGVcclxuICAgICAgaWYgKCB2ZXJzaW9uQ2hhbmdlZCApIHtcclxuICAgICAgICBhd2FpdCBzZXRSZXBvVmVyc2lvbiggcmVwbywgcHJldmlvdXNWZXJzaW9uLCBtZXNzYWdlICk7XHJcbiAgICAgICAgYXdhaXQgZ2l0UHVzaCggcmVwbywgYnJhbmNoICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEFib3J0IGNoZWNrb3V0LCAod2lsbCBiZSBjYXVnaHQgYW5kIG1haW4gd2lsbCBiZSBjaGVja2VkIG91dFxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIG1lc3NhZ2UgKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIGlmICggIWF3YWl0IGJvb2xlYW5Qcm9tcHQoIGBQbGVhc2UgdGVzdCB0aGUgYnVpbHQgdmVyc2lvbiBvZiAke3JlcG99LlxcbklzIGl0IHJlYWR5IHRvIGRlcGxveT9gLCBub25pbnRlcmFjdGl2ZSApICkge1xyXG4gICAgICBhd2FpdCBwb3N0QnVpbGRBYm9ydCggJ0Fib3J0ZWQgcHJvZHVjdGlvbiBkZXBsb3ltZW50IChhYm9ydGVkIHZlcnNpb24gY2hhbmdlIHRvbykuJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1vdmUgb3ZlciBkZXBlbmRlbmNpZXMuanNvbiBhbmQgY29tbWl0L3B1c2hcclxuICAgIGF3YWl0IHVwZGF0ZURlcGVuZGVuY2llc0pTT04oIHJlcG8sIGJyYW5kcywgdmVyc2lvblN0cmluZywgYnJhbmNoICk7XHJcblxyXG4gICAgLy8gU2VuZCB0aGUgYnVpbGQgcmVxdWVzdFxyXG4gICAgYXdhaXQgYnVpbGRTZXJ2ZXJSZXF1ZXN0KCByZXBvLCB2ZXJzaW9uLCBicmFuY2gsIGF3YWl0IGdldERlcGVuZGVuY2llcyggcmVwbyApLCB7XHJcbiAgICAgIGxvY2FsZXM6ICcqJyxcclxuICAgICAgYnJhbmRzOiBicmFuZHMsXHJcbiAgICAgIHNlcnZlcnM6IFsgJ2RldicsICdwcm9kdWN0aW9uJyBdXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gTW92ZSBiYWNrIHRvIG1haW5cclxuICAgIGF3YWl0IGNoZWNrb3V0TWFpbiggcmVwbywgdHJ1ZSApO1xyXG5cclxuICAgIGlmICggYnJhbmRzLmluY2x1ZGVzKCAncGhldCcgKSApIHtcclxuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oIGBEZXBsb3llZDogaHR0cHM6Ly9waGV0LmNvbG9yYWRvLmVkdS9zaW1zL2h0bWwvJHtyZXBvfS9sYXRlc3QvJHtyZXBvfV9hbGwuaHRtbGAgKTtcclxuICAgIH1cclxuICAgIGlmICggYnJhbmRzLmluY2x1ZGVzKCAncGhldC1pbycgKSApIHtcclxuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oIGBEZXBsb3llZDogaHR0cHM6Ly9waGV0LWlvLmNvbG9yYWRvLmVkdS9zaW1zLyR7cmVwb30vJHt2ZXJzaW9uU3RyaW5nfS9gICk7XHJcbiAgICB9XHJcblxyXG4gICAgZ3J1bnQubG9nLndyaXRlbG4oICdQbGVhc2Ugd2FpdCBmb3IgdGhlIGJ1aWxkLXNlcnZlciB0byBjb21wbGV0ZSB0aGUgZGVwbG95bWVudCwgYW5kIHRoZW4gdGVzdCEnICk7XHJcbiAgICBncnVudC5sb2cud3JpdGVsbiggYFRvIHZpZXcgdGhlIGN1cnJlbnQgYnVpbGQgc3RhdHVzLCB2aXNpdCAke2J1aWxkTG9jYWwucHJvZHVjdGlvblNlcnZlclVSTH0vZGVwbG95LXN0YXR1c2AgKTtcclxuXHJcbiAgICBpZiAoIGlzRmlyc3RWZXJzaW9uICYmIGJyYW5kcy5pbmNsdWRlcyggJ3BoZXQnICkgKSB7XHJcbiAgICAgIGdydW50LmxvZy53cml0ZWxuKCAnQWZ0ZXIgdGVzdGluZywgbGV0IHRoZSBzaW11bGF0aW9uIGxlYWQga25vdyBpdCBoYXMgYmVlbiBkZXBsb3llZCwgc28gdGhleSBjYW4gZWRpdCBtZXRhZGF0YSBvbiB0aGUgd2Vic2l0ZScgKTtcclxuXHJcbiAgICAgIC8vIFVwZGF0ZSB0aGUgUkVBRE1FIG9uIG1haW5cclxuICAgICAgaWYgKCBwdWJsaXNoZWQgKSB7XHJcbiAgICAgICAgZ3J1bnQubG9nLndyaXRlbG4oICdVcGRhdGluZyBtYWluIFJFQURNRScgKTtcclxuICAgICAgICBhd2FpdCBleGVjdXRlKCBncnVudENvbW1hbmQsIFsgJ3B1Ymxpc2hlZC1SRUFETUUnIF0sIGAuLi8ke3JlcG99YCApO1xyXG4gICAgICAgIGF3YWl0IGdpdEFkZCggcmVwbywgJ1JFQURNRS5tZCcgKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgYXdhaXQgZ2l0Q29tbWl0KCByZXBvLCBgR2VuZXJhdGVkIHB1Ymxpc2hlZCBSRUFETUUubWQgYXMgcGFydCBvZiBhIHByb2R1Y3Rpb24gZGVwbG95IGZvciAke3ZlcnNpb25TdHJpbmd9YCApO1xyXG4gICAgICAgICAgYXdhaXQgZ2l0UHVzaCggcmVwbywgJ21haW4nICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgICAgZ3J1bnQubG9nLndyaXRlbG4oICdQcm9kdWN0aW9uIFJFQURNRSBpcyBhbHJlYWR5IHVwLXRvLWRhdGUnICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcGhldC1pbyBuYWdzIGZyb20gdGhlIGNoZWNrbGlzdFxyXG4gICAgaWYgKCBicmFuZHMuaW5jbHVkZXMoICdwaGV0LWlvJyApICkge1xyXG4gICAgICBjb25zdCBwaGV0aW9Mb2dUZXh0ID0gYFxyXG5QaEVULWlPIGRlcGxveXMgaW52b2x2ZSBhIGNvdXBsZSBvZiBleHRyYSBzdGVwcyBhZnRlciBwcm9kdWN0aW9uLiBQbGVhc2UgZW5zdXJlIHRoZSBmb2xsb3dpbmcgYXJlIGFjY29tcGxpc2hlZDpcclxuMS4gTWFrZSBzdXJlIHRoZSBzaW0gaXMgbGlzdGVkIGluIHBlcmVubmlhbC9kYXRhL3BoZXQtaW8tYXBpLXN0YWJsZSBpZiBpdCBoYXMgaGFkIGEgZGVzaWduZWQgcHJvZHVjdGlvbiByZWxlYXNlIChhbmQgdGhhdCB0aGUgQVBJIGlzIHVwIHRvIGRhdGUpLlxyXG4yLiBNYWtlIHN1cmUgdGhlIHNpbSBpcyBsaXN0ZWQgaW4gcGVyZW5uaWFsL2RhdGEvcGhldC1pby1oeWRyb2dlbi5qc29uLiBJdCBpcyBhbG1vc3QgY2VydGFpbmx5IHBhcnQgb2YgdGhpcyBmZWF0dXJlc2V0LiBcclxuMy4gQ3JlYXRlIGFuIGlzc3VlIGluIHRoZSBwaGV0LWlvIHJlcG8gdXNpbmcgdGhlIFwiTmV3IFBoRVQtaU8gU2ltdWxhdGlvbiBQdWJsaWNhdGlvblwiIGlzc3VlIHRlbXBsYXRlLlxyXG4gICAgICBgO1xyXG4gICAgICBncnVudC5sb2cud3JpdGVsbiggcGhldGlvTG9nVGV4dCApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB2ZXJzaW9uO1xyXG4gIH1cclxuICBjYXRjaCggZSApIHtcclxuICAgIGdydW50LmxvZy53YXJuKCAnRGV0ZWN0ZWQgZmFpbHVyZSBkdXJpbmcgZGVwbG95LCByZXZlcnRpbmcgdG8gbWFpbicgKTtcclxuICAgIGF3YWl0IGNoZWNrb3V0TWFpbiggcmVwbywgdHJ1ZSApO1xyXG4gICAgdGhyb3cgZTtcclxuICB9XHJcbn07Il0sIm1hcHBpbmdzIjoiOzs7K0NBQ0EscUpBQUFBLG1CQUFBLFlBQUFBLG9CQUFBLFdBQUFDLENBQUEsU0FBQUMsQ0FBQSxFQUFBRCxDQUFBLE9BQUFFLENBQUEsR0FBQUMsTUFBQSxDQUFBQyxTQUFBLEVBQUFDLENBQUEsR0FBQUgsQ0FBQSxDQUFBSSxjQUFBLEVBQUFDLENBQUEsR0FBQUosTUFBQSxDQUFBSyxjQUFBLGNBQUFQLENBQUEsRUFBQUQsQ0FBQSxFQUFBRSxDQUFBLElBQUFELENBQUEsQ0FBQUQsQ0FBQSxJQUFBRSxDQUFBLENBQUFPLEtBQUEsS0FBQUMsQ0FBQSx3QkFBQUMsTUFBQSxHQUFBQSxNQUFBLE9BQUFDLENBQUEsR0FBQUYsQ0FBQSxDQUFBRyxRQUFBLGtCQUFBQyxDQUFBLEdBQUFKLENBQUEsQ0FBQUssYUFBQSx1QkFBQUMsQ0FBQSxHQUFBTixDQUFBLENBQUFPLFdBQUEsOEJBQUFDLE9BQUFqQixDQUFBLEVBQUFELENBQUEsRUFBQUUsQ0FBQSxXQUFBQyxNQUFBLENBQUFLLGNBQUEsQ0FBQVAsQ0FBQSxFQUFBRCxDQUFBLElBQUFTLEtBQUEsRUFBQVAsQ0FBQSxFQUFBaUIsVUFBQSxNQUFBQyxZQUFBLE1BQUFDLFFBQUEsU0FBQXBCLENBQUEsQ0FBQUQsQ0FBQSxXQUFBa0IsTUFBQSxtQkFBQWpCLENBQUEsSUFBQWlCLE1BQUEsWUFBQUEsT0FBQWpCLENBQUEsRUFBQUQsQ0FBQSxFQUFBRSxDQUFBLFdBQUFELENBQUEsQ0FBQUQsQ0FBQSxJQUFBRSxDQUFBLGdCQUFBb0IsS0FBQXJCLENB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