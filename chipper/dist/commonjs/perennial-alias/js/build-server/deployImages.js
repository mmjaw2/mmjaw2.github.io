"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
// Copyright 2020, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)

var execute = require('../common/execute');
var gitCheckoutDirectory = require('../common/gitCheckoutDirectory');
var gitCloneOrFetchDirectory = require('../common/gitCloneOrFetchDirectory');
var gitPullDirectory = require('../common/gitPullDirectory');
var constants = require('./constants');
var fs = require('fs');
var axios = require('axios');
var imagesReposDir = '../images-repos';
var chipperDir = "".concat(imagesReposDir, "/chipper");
var perennialAliasDir = "".concat(imagesReposDir, "/perennial-alias");
var processSim = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(simulation, brands, version) {
    var repoDir, brandsArray, brandsString, _iterator, _step, brand, sourceDir, targetDir, files, _iterator2, _step2, file;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          repoDir = "".concat(imagesReposDir, "/").concat(simulation); // Get main
          _context.next = 3;
          return gitCloneOrFetchDirectory(simulation, imagesReposDir);
        case 3:
          _context.next = 5;
          return gitCheckoutDirectory('main', repoDir);
        case 5:
          _context.next = 7;
          return gitPullDirectory(repoDir);
        case 7:
          if (brands) {
            if (brands.split) {
              brandsArray = brands.split(',');
              brandsString = brands;
            } else {
              brandsArray = brands;
              brandsString = brands.join(',');
            }
          } else {
            brandsString = 'phet';
            brandsArray = [brandsString];
          }

          // Build screenshots
          _context.next = 10;
          return execute('grunt', ["--brands=".concat(brandsString), "--repo=".concat(simulation), 'build-images'], chipperDir);
        case 10:
          // Copy into the document root
          _iterator = _createForOfIteratorHelper(brandsArray);
          _context.prev = 11;
          _iterator.s();
        case 13:
          if ((_step = _iterator.n()).done) {
            _context.next = 44;
            break;
          }
          brand = _step.value;
          if (!(brand !== 'phet')) {
            _context.next = 19;
            break;
          }
          console.log("Skipping images for unsupported brand: ".concat(brand));
          _context.next = 42;
          break;
        case 19:
          sourceDir = "".concat(repoDir, "/build/").concat(brand, "/");
          targetDir = "".concat(constants.HTML_SIMS_DIRECTORY).concat(simulation, "/").concat(version, "/");
          files = fs.readdirSync(sourceDir);
          _iterator2 = _createForOfIteratorHelper(files);
          _context.prev = 23;
          _iterator2.s();
        case 25:
          if ((_step2 = _iterator2.n()).done) {
            _context.next = 33;
            break;
          }
          file = _step2.value;
          if (!file.endsWith('png')) {
            _context.next = 31;
            break;
          }
          console.log("copying file ".concat(file));
          _context.next = 31;
          return execute('cp', ["".concat(sourceDir).concat(file), "".concat(targetDir).concat(file)], '.');
        case 31:
          _context.next = 25;
          break;
        case 33:
          _context.next = 38;
          break;
        case 35:
          _context.prev = 35;
          _context.t0 = _context["catch"](23);
          _iterator2.e(_context.t0);
        case 38:
          _context.prev = 38;
          _iterator2.f();
          return _context.finish(38);
        case 41:
          console.log("Done copying files for ".concat(simulation));
        case 42:
          _context.next = 13;
          break;
        case 44:
          _context.next = 49;
          break;
        case 46:
          _context.prev = 46;
          _context.t1 = _context["catch"](11);
          _iterator.e(_context.t1);
        case 49:
          _context.prev = 49;
          _iterator.f();
          return _context.finish(49);
        case 52:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[11, 46, 49, 52], [23, 35, 38, 41]]);
  }));
  return function processSim(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();
var updateRepoDir = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(repo, dir) {
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return gitCloneOrFetchDirectory(repo, imagesReposDir);
        case 2:
          _context2.next = 4;
          return gitCheckoutDirectory('main', dir);
        case 4:
          _context2.next = 6;
          return gitPullDirectory(dir);
        case 6:
          _context2.next = 8;
          return execute('npm', ['prune'], dir);
        case 8:
          _context2.next = 10;
          return execute('npm', ['update'], dir);
        case 10:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function updateRepoDir(_x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * This task deploys all image assets from the main branch to the latest version of all published sims.
 *
 * @param options
 */
var deployImages = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(options) {
    var response, projects, _iterator3, _step3, project, _iterator4, _step4, simulation;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          console.log("deploying images with brands ".concat(options.brands));
          if (fs.existsSync(imagesReposDir)) {
            _context3.next = 4;
            break;
          }
          _context3.next = 4;
          return execute('mkdir', [imagesReposDir], '.');
        case 4:
          _context3.next = 6;
          return updateRepoDir('chipper', chipperDir);
        case 6:
          _context3.next = 8;
          return updateRepoDir('perennial-alias', perennialAliasDir);
        case 8:
          if (!(options.simulation && options.version)) {
            _context3.next = 13;
            break;
          }
          _context3.next = 11;
          return processSim(options.simulation, options.brands, options.version);
        case 11:
          _context3.next = 65;
          break;
        case 13:
          _context3.prev = 13;
          _context3.next = 16;
          return axios('https://phet.colorado.edu/services/metadata/1.2/simulations?format=json&summary&locale=en&type=html');
        case 16:
          response = _context3.sent;
          _context3.next = 22;
          break;
        case 19:
          _context3.prev = 19;
          _context3.t0 = _context3["catch"](13);
          throw new Error(_context3.t0);
        case 22:
          if (!(response.status < 200 || response.status > 299)) {
            _context3.next = 26;
            break;
          }
          throw new Error("Bad Status while fetching metadata: ".concat(response.status));
        case 26:
          _context3.prev = 26;
          projects = response.data.projects;
          _context3.next = 33;
          break;
        case 30:
          _context3.prev = 30;
          _context3.t1 = _context3["catch"](26);
          throw new Error(_context3.t1);
        case 33:
          // Use for index loop to allow async/await
          _iterator3 = _createForOfIteratorHelper(projects);
          _context3.prev = 34;
          _iterator3.s();
        case 36:
          if ((_step3 = _iterator3.n()).done) {
            _context3.next = 57;
            break;
          }
          project = _step3.value;
          _iterator4 = _createForOfIteratorHelper(project.simulations);
          _context3.prev = 39;
          _iterator4.s();
        case 41:
          if ((_step4 = _iterator4.n()).done) {
            _context3.next = 47;
            break;
          }
          simulation = _step4.value;
          _context3.next = 45;
          return processSim(simulation.name, options.brands, project.version.string);
        case 45:
          _context3.next = 41;
          break;
        case 47:
          _context3.next = 52;
          break;
        case 49:
          _context3.prev = 49;
          _context3.t2 = _context3["catch"](39);
          _iterator4.e(_context3.t2);
        case 52:
          _context3.prev = 52;
          _iterator4.f();
          return _context3.finish(52);
        case 55:
          _context3.next = 36;
          break;
        case 57:
          _context3.next = 62;
          break;
        case 59:
          _context3.prev = 59;
          _context3.t3 = _context3["catch"](34);
          _iterator3.e(_context3.t3);
        case 62:
          _context3.prev = 62;
          _iterator3.f();
          return _context3.finish(62);
        case 65:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[13, 19], [26, 30], [34, 59, 62, 65], [39, 49, 52, 55]]);
  }));
  return function deployImages(_x6) {
    return _ref3.apply(this, arguments);
  };
}();
module.exports = deployImages;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVnZW5lcmF0b3JSdW50aW1lIiwiZSIsInQiLCJyIiwiT2JqZWN0IiwicHJvdG90eXBlIiwibiIsImhhc093blByb3BlcnR5IiwibyIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJpIiwiU3ltYm9sIiwiYSIsIml0ZXJhdG9yIiwiYyIsImFzeW5jSXRlcmF0b3IiLCJ1IiwidG9TdHJpbmdUYWciLCJkZWZpbmUiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ3cmFwIiwiR2VuZXJhdG9yIiwiY3JlYXRlIiwiQ29udGV4dCIsIm1ha2VJbnZva2VNZXRob2QiLCJ0cnlDYXRjaCIsInR5cGUiLCJhcmciLCJjYWxsIiwiaCIsImwiLCJmIiwicyIsInkiLCJHZW5lcmF0b3JGdW5jdGlvbiIsIkdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlIiwicCIsImQiLCJnZXRQcm90b3R5cGVPZiIsInYiLCJ2YWx1ZXMiLCJnIiwiZGVmaW5lSXRlcmF0b3JNZXRob2RzIiwiZm9yRWFjaCIsIl9pbnZva2UiLCJBc3luY0l0ZXJhdG9yIiwiaW52b2tlIiwiX3R5cGVvZiIsInJlc29sdmUiLCJfX2F3YWl0IiwidGhlbiIsImNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnIiwiRXJyb3IiLCJkb25lIiwibWV0aG9kIiwiZGVsZWdhdGUiLCJtYXliZUludm9rZURlbGVnYXRlIiwic2VudCIsIl9zZW50IiwiZGlzcGF0Y2hFeGNlcHRpb24iLCJhYnJ1cHQiLCJUeXBlRXJyb3IiLCJyZXN1bHROYW1lIiwibmV4dCIsIm5leHRMb2MiLCJwdXNoVHJ5RW50cnkiLCJ0cnlMb2MiLCJjYXRjaExvYyIsImZpbmFsbHlMb2MiLCJhZnRlckxvYyIsInRyeUVudHJpZXMiLCJwdXNoIiwicmVzZXRUcnlFbnRyeSIsImNvbXBsZXRpb24iLCJyZXNldCIsImlzTmFOIiwibGVuZ3RoIiwiZGlzcGxheU5hbWUiLCJpc0dlbmVyYXRvckZ1bmN0aW9uIiwiY29uc3RydWN0b3IiLCJuYW1lIiwibWFyayIsInNldFByb3RvdHlwZU9mIiwiX19wcm90b19fIiwiYXdyYXAiLCJhc3luYyIsIlByb21pc2UiLCJrZXlzIiwicmV2ZXJzZSIsInBvcCIsInByZXYiLCJjaGFyQXQiLCJzbGljZSIsInN0b3AiLCJydmFsIiwiaGFuZGxlIiwiY29tcGxldGUiLCJmaW5pc2giLCJfY2F0Y2giLCJkZWxlZ2F0ZVlpZWxkIiwiX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXIiLCJhbGxvd0FycmF5TGlrZSIsIml0IiwiQXJyYXkiLCJpc0FycmF5IiwiX3Vuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5IiwiRiIsIl9lIiwibm9ybWFsQ29tcGxldGlvbiIsImRpZEVyciIsImVyciIsInN0ZXAiLCJfZTIiLCJtaW5MZW4iLCJfYXJyYXlMaWtlVG9BcnJheSIsInRvU3RyaW5nIiwiZnJvbSIsInRlc3QiLCJhcnIiLCJsZW4iLCJhcnIyIiwiYXN5bmNHZW5lcmF0b3JTdGVwIiwiZ2VuIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJpbmZvIiwiZXJyb3IiLCJfYXN5bmNUb0dlbmVyYXRvciIsImZuIiwic2VsZiIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsInVuZGVmaW5lZCIsImV4ZWN1dGUiLCJyZXF1aXJlIiwiZ2l0Q2hlY2tvdXREaXJlY3RvcnkiLCJnaXRDbG9uZU9yRmV0Y2hEaXJlY3RvcnkiLCJnaXRQdWxsRGlyZWN0b3J5IiwiY29uc3RhbnRzIiwiZnMiLCJheGlvcyIsImltYWdlc1JlcG9zRGlyIiwiY2hpcHBlckRpciIsImNvbmNhdCIsInBlcmVubmlhbEFsaWFzRGlyIiwicHJvY2Vzc1NpbSIsIl9yZWYiLCJfY2FsbGVlIiwic2ltdWxhdGlvbiIsImJyYW5kcyIsInZlcnNpb24iLCJyZXBvRGlyIiwiYnJhbmRzQXJyYXkiLCJicmFuZHNTdHJpbmciLCJfaXRlcmF0b3IiLCJfc3RlcCIsImJyYW5kIiwic291cmNlRGlyIiwidGFyZ2V0RGlyIiwiZmlsZXMiLCJfaXRlcmF0b3IyIiwiX3N0ZXAyIiwiZmlsZSIsIl9jYWxsZWUkIiwiX2NvbnRleHQiLCJzcGxpdCIsImpvaW4iLCJjb25zb2xlIiwibG9nIiwiSFRNTF9TSU1TX0RJUkVDVE9SWSIsInJlYWRkaXJTeW5jIiwiZW5kc1dpdGgiLCJ0MCIsInQxIiwiX3giLCJfeDIiLCJfeDMiLCJ1cGRhdGVSZXBvRGlyIiwiX3JlZjIiLCJfY2FsbGVlMiIsInJlcG8iLCJkaXIiLCJfY2FsbGVlMiQiLCJfY29udGV4dDIiLCJfeDQiLCJfeDUiLCJkZXBsb3lJbWFnZXMiLCJfcmVmMyIsIl9jYWxsZWUzIiwib3B0aW9ucyIsInJlc3BvbnNlIiwicHJvamVjdHMiLCJfaXRlcmF0b3IzIiwiX3N0ZXAzIiwicHJvamVjdCIsIl9pdGVyYXRvcjQiLCJfc3RlcDQiLCJfY2FsbGVlMyQiLCJfY29udGV4dDMiLCJleGlzdHNTeW5jIiwic3RhdHVzIiwiZGF0YSIsInNpbXVsYXRpb25zIiwic3RyaW5nIiwidDIiLCJ0MyIsIl94NiIsIm1vZHVsZSIsImV4cG9ydHMiXSwic291cmNlcyI6WyJkZXBsb3lJbWFnZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG4vLyBAYXV0aG9yIE1hdHQgUGVubmluZ3RvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuXHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi4vY29tbW9uL2V4ZWN1dGUnICk7XHJcbmNvbnN0IGdpdENoZWNrb3V0RGlyZWN0b3J5ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9naXRDaGVja291dERpcmVjdG9yeScgKTtcclxuY29uc3QgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9naXRDbG9uZU9yRmV0Y2hEaXJlY3RvcnknICk7XHJcbmNvbnN0IGdpdFB1bGxEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi4vY29tbW9uL2dpdFB1bGxEaXJlY3RvcnknICk7XHJcbmNvbnN0IGNvbnN0YW50cyA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKTtcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IGF4aW9zID0gcmVxdWlyZSggJ2F4aW9zJyApO1xyXG5cclxuY29uc3QgaW1hZ2VzUmVwb3NEaXIgPSAnLi4vaW1hZ2VzLXJlcG9zJztcclxuY29uc3QgY2hpcHBlckRpciA9IGAke2ltYWdlc1JlcG9zRGlyfS9jaGlwcGVyYDtcclxuY29uc3QgcGVyZW5uaWFsQWxpYXNEaXIgPSBgJHtpbWFnZXNSZXBvc0Rpcn0vcGVyZW5uaWFsLWFsaWFzYDtcclxuXHJcbmNvbnN0IHByb2Nlc3NTaW0gPSBhc3luYyAoIHNpbXVsYXRpb24sIGJyYW5kcywgdmVyc2lvbiApID0+IHtcclxuXHJcbiAgY29uc3QgcmVwb0RpciA9IGAke2ltYWdlc1JlcG9zRGlyfS8ke3NpbXVsYXRpb259YDtcclxuXHJcbiAgLy8gR2V0IG1haW5cclxuICBhd2FpdCBnaXRDbG9uZU9yRmV0Y2hEaXJlY3RvcnkoIHNpbXVsYXRpb24sIGltYWdlc1JlcG9zRGlyICk7XHJcbiAgYXdhaXQgZ2l0Q2hlY2tvdXREaXJlY3RvcnkoICdtYWluJywgcmVwb0RpciApO1xyXG4gIGF3YWl0IGdpdFB1bGxEaXJlY3RvcnkoIHJlcG9EaXIgKTtcclxuXHJcbiAgbGV0IGJyYW5kc0FycmF5O1xyXG4gIGxldCBicmFuZHNTdHJpbmc7XHJcbiAgaWYgKCBicmFuZHMgKSB7XHJcbiAgICBpZiAoIGJyYW5kcy5zcGxpdCApIHtcclxuICAgICAgYnJhbmRzQXJyYXkgPSBicmFuZHMuc3BsaXQoICcsJyApO1xyXG4gICAgICBicmFuZHNTdHJpbmcgPSBicmFuZHM7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYnJhbmRzQXJyYXkgPSBicmFuZHM7XHJcbiAgICAgIGJyYW5kc1N0cmluZyA9IGJyYW5kcy5qb2luKCAnLCcgKTtcclxuICAgIH1cclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBicmFuZHNTdHJpbmcgPSAncGhldCc7XHJcbiAgICBicmFuZHNBcnJheSA9IFsgYnJhbmRzU3RyaW5nIF07XHJcbiAgfVxyXG5cclxuICAvLyBCdWlsZCBzY3JlZW5zaG90c1xyXG4gIGF3YWl0IGV4ZWN1dGUoICdncnVudCcsIFsgYC0tYnJhbmRzPSR7YnJhbmRzU3RyaW5nfWAsIGAtLXJlcG89JHtzaW11bGF0aW9ufWAsICdidWlsZC1pbWFnZXMnIF0sIGNoaXBwZXJEaXIgKTtcclxuXHJcbiAgLy8gQ29weSBpbnRvIHRoZSBkb2N1bWVudCByb290XHJcbiAgZm9yICggY29uc3QgYnJhbmQgb2YgYnJhbmRzQXJyYXkgKSB7XHJcbiAgICBpZiAoIGJyYW5kICE9PSAncGhldCcgKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCBgU2tpcHBpbmcgaW1hZ2VzIGZvciB1bnN1cHBvcnRlZCBicmFuZDogJHticmFuZH1gICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY29uc3Qgc291cmNlRGlyID0gYCR7cmVwb0Rpcn0vYnVpbGQvJHticmFuZH0vYDtcclxuICAgICAgY29uc3QgdGFyZ2V0RGlyID0gYCR7Y29uc3RhbnRzLkhUTUxfU0lNU19ESVJFQ1RPUll9JHtzaW11bGF0aW9ufS8ke3ZlcnNpb259L2A7XHJcbiAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoIHNvdXJjZURpciApO1xyXG4gICAgICBmb3IgKCBjb25zdCBmaWxlIG9mIGZpbGVzICkge1xyXG4gICAgICAgIGlmICggZmlsZS5lbmRzV2l0aCggJ3BuZycgKSApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgY29weWluZyBmaWxlICR7ZmlsZX1gICk7XHJcbiAgICAgICAgICBhd2FpdCBleGVjdXRlKCAnY3AnLCBbIGAke3NvdXJjZURpcn0ke2ZpbGV9YCwgYCR7dGFyZ2V0RGlyfSR7ZmlsZX1gIF0sICcuJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc29sZS5sb2coIGBEb25lIGNvcHlpbmcgZmlsZXMgZm9yICR7c2ltdWxhdGlvbn1gICk7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuY29uc3QgdXBkYXRlUmVwb0RpciA9IGFzeW5jICggcmVwbywgZGlyICkgPT4ge1xyXG4gIGF3YWl0IGdpdENsb25lT3JGZXRjaERpcmVjdG9yeSggcmVwbywgaW1hZ2VzUmVwb3NEaXIgKTtcclxuICBhd2FpdCBnaXRDaGVja291dERpcmVjdG9yeSggJ21haW4nLCBkaXIgKTtcclxuICBhd2FpdCBnaXRQdWxsRGlyZWN0b3J5KCBkaXIgKTtcclxuICBhd2FpdCBleGVjdXRlKCAnbnBtJywgWyAncHJ1bmUnIF0sIGRpciApO1xyXG4gIGF3YWl0IGV4ZWN1dGUoICducG0nLCBbICd1cGRhdGUnIF0sIGRpciApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgdGFzayBkZXBsb3lzIGFsbCBpbWFnZSBhc3NldHMgZnJvbSB0aGUgbWFpbiBicmFuY2ggdG8gdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIGFsbCBwdWJsaXNoZWQgc2ltcy5cclxuICpcclxuICogQHBhcmFtIG9wdGlvbnNcclxuICovXHJcbmNvbnN0IGRlcGxveUltYWdlcyA9IGFzeW5jIG9wdGlvbnMgPT4ge1xyXG4gIGNvbnNvbGUubG9nKCBgZGVwbG95aW5nIGltYWdlcyB3aXRoIGJyYW5kcyAke29wdGlvbnMuYnJhbmRzfWAgKTtcclxuICBpZiAoICFmcy5leGlzdHNTeW5jKCBpbWFnZXNSZXBvc0RpciApICkge1xyXG4gICAgYXdhaXQgZXhlY3V0ZSggJ21rZGlyJywgWyBpbWFnZXNSZXBvc0RpciBdLCAnLicgKTtcclxuICB9XHJcblxyXG4gIGF3YWl0IHVwZGF0ZVJlcG9EaXIoICdjaGlwcGVyJywgY2hpcHBlckRpciApO1xyXG4gIGF3YWl0IHVwZGF0ZVJlcG9EaXIoICdwZXJlbm5pYWwtYWxpYXMnLCBwZXJlbm5pYWxBbGlhc0RpciApO1xyXG5cclxuICBpZiAoIG9wdGlvbnMuc2ltdWxhdGlvbiAmJiBvcHRpb25zLnZlcnNpb24gKSB7XHJcbiAgICBhd2FpdCBwcm9jZXNzU2ltKCBvcHRpb25zLnNpbXVsYXRpb24sIG9wdGlvbnMuYnJhbmRzLCBvcHRpb25zLnZlcnNpb24gKTtcclxuICB9XHJcbiAgZWxzZSB7XHJcblxyXG4gICAgLy8gR2V0IGFsbCBwdWJsaXNoZWQgc2ltc1xyXG4gICAgbGV0IHJlc3BvbnNlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCBheGlvcyggJ2h0dHBzOi8vcGhldC5jb2xvcmFkby5lZHUvc2VydmljZXMvbWV0YWRhdGEvMS4yL3NpbXVsYXRpb25zP2Zvcm1hdD1qc29uJnN1bW1hcnkmbG9jYWxlPWVuJnR5cGU9aHRtbCcgKTtcclxuICAgIH1cclxuICAgIGNhdGNoKCBlICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIGUgKTtcclxuICAgIH1cclxuICAgIGlmICggcmVzcG9uc2Uuc3RhdHVzIDwgMjAwIHx8IHJlc3BvbnNlLnN0YXR1cyA+IDI5OSApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCBgQmFkIFN0YXR1cyB3aGlsZSBmZXRjaGluZyBtZXRhZGF0YTogJHtyZXNwb25zZS5zdGF0dXN9YCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGxldCBwcm9qZWN0cztcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBwcm9qZWN0cyA9IHJlc3BvbnNlLmRhdGEucHJvamVjdHM7XHJcbiAgICAgIH1cclxuICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFVzZSBmb3IgaW5kZXggbG9vcCB0byBhbGxvdyBhc3luYy9hd2FpdFxyXG4gICAgICBmb3IgKCBjb25zdCBwcm9qZWN0IG9mIHByb2plY3RzICkge1xyXG4gICAgICAgIGZvciAoIGNvbnN0IHNpbXVsYXRpb24gb2YgcHJvamVjdC5zaW11bGF0aW9ucyApIHtcclxuICAgICAgICAgIGF3YWl0IHByb2Nlc3NTaW0oIHNpbXVsYXRpb24ubmFtZSwgb3B0aW9ucy5icmFuZHMsIHByb2plY3QudmVyc2lvbi5zdHJpbmcgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGRlcGxveUltYWdlczsiXSwibWFwcGluZ3MiOiI7OzsrQ0FDQSxxSkFBQUEsbUJBQUEsWUFBQUEsb0JBQUEsV0FBQUMsQ0FBQSxTQUFBQyxDQUFBLEVBQUFELENBQUEsT0FBQUUsQ0FBQSxHQUFBQyxNQUFBLENBQUFDLFNBQUEsRUFBQUMsQ0FBQSxHQUFBSCxDQUFBLENBQUFJLGNBQUEsRUFBQUMsQ0FBQSxHQUFBSixNQUFBLENBQUFLLGNBQUEsY0FBQVAsQ0FBQSxFQUFBRCxDQUFBLEVBQUFFLENBQUEsSUFBQUQsQ0FBQSxDQUFBRCxDQUFBLElBQUFFLENBQUEsQ0FBQU8sS0FBQSxLQUFBQyxDQUFBLHdCQUFBQyxNQUFBLEdBQUFBLE1BQUEsT0FBQUMsQ0FBQSxHQUFBRixDQUFBLENBQUFHLFFBQUEsa0JBQUFDLENBQUEsR0FBQUosQ0FBQSxDQUFBSyxhQUFBLHVCQUFBQyxDQUFBLEdBQUFOLENBQUEsQ0FBQU8sV0FBQSw4QkFBQUMsT0FBQWpCLENBQUEsRUFBQUQsQ0FBQSxFQUFBRSxDQUFBLFdBQUFDLE1BQUEsQ0FBQUssY0FBQSxDQUFBUCxDQUFBLEVBQUFELENBQUEsSUFBQVMsS0FBQSxFQUFBUCxDQUFBLEVBQUFpQixVQUFBLE1BQUFDLFlBQUEsTUFBQUMsUUFBQSxTQUFBcEIsQ0FBQSxDQUFBRCxDQUFBLFdBQUFrQixNQUFBLG1CQUFBakIsQ0FBQSxJQUFBaUIsTUFBQSxZQUFBQSxPQUFBakIsQ0FBQSxFQUFBRCxDQUFBLEVBQUFFLENBQUEsV0FBQUQsQ0FBQSxDQUFBRCxDQUFBLElBQUFFLENBQUEsZ0JBQUFvQixLQUFBckIsQ0FBQSxFQUFBRCxDQUFBLEVBQUFFLENBQUEsRUFBQUcsQ0FBQSxRQUFBSyxDQUFB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a0QsSUFBQTtZQUFBb0osU0FBQSxDQUFBMUksSUFBQTtZQUFBO1VBQUE7VUFBbkJzSSxPQUFPLEdBQUFELE1BQUEsQ0FBQTdMLEtBQUE7VUFBQStMLFVBQUEsR0FBQWxHLDBCQUFBLENBQ1NpRyxPQUFPLENBQUNRLFdBQVc7VUFBQUosU0FBQSxDQUFBL0csSUFBQTtVQUFBNEcsVUFBQSxDQUFBdEssQ0FBQTtRQUFBO1VBQUEsS0FBQXVLLE1BQUEsR0FBQUQsVUFBQSxDQUFBbk0sQ0FBQSxJQUFBa0QsSUFBQTtZQUFBb0osU0FBQSxDQUFBMUksSUFBQTtZQUFBO1VBQUE7VUFBakN3RixVQUFVLEdBQUFnRCxNQUFBLENBQUFoTSxLQUFBO1VBQUFrTSxTQUFBLENBQUExSSxJQUFBO1VBQUEsT0FDZHFGLFVBQVUsQ0FBRUcsVUFBVSxDQUFDdkUsSUFBSSxFQUFFZ0gsT0FBTyxDQUFDeEMsTUFBTSxFQUFFNkMsT0FBTyxDQUFDNUMsT0FBTyxDQUFDcUQsTUFBTyxDQUFDO1FBQUE7VUFBQUwsU0FBQSxDQUFBMUksSUFBQTtVQUFBO1FBQUE7VUFBQTBJLFNBQUEsQ0FBQTFJLElBQUE7VUFBQTtRQUFBO1VBQUEwSSxTQUFBLENBQUEvRyxJQUFBO1VBQUErRyxTQUFBLENBQUFNLEVBQUEsR0FBQU4sU0FBQTtVQUFBSCxVQUFBLENBQUF4TSxDQUFBLENBQUEyTSxTQUFBLENBQUFNLEVBQUE7UUFBQTtVQUFBTixTQUFBLENBQUEvRyxJQUFBO1VBQUE0RyxVQUFBLENBQUF2SyxDQUFBO1VBQUEsT0FBQTBLLFNBQUEsQ0FBQXhHLE1BQUE7UUFBQTtVQUFBd0csU0FBQSxDQUFBMUksSUFBQTtVQUFBO1FBQUE7VUFBQTBJLFNBQUEsQ0FBQTFJLElBQUE7VUFBQTtRQUFBO1VBQUEwSSxTQUFBLENBQUEvRyxJQUFBO1VBQUErRyxTQUFBLENBQUFPLEVBQUEsR0FBQVAsU0FBQTtVQUFBTixVQUFBLENBQUFyTSxDQUFBLENBQUEyTSxTQUFBLENBQUFPLEVBQUE7UUFBQTtVQUFBUCxTQUFBLENBQUEvRyxJQUFBO1VBQUF5RyxVQUFBLENBQUFwSyxDQUFBO1VBQUEsT0FBQTBLLFNBQUEsQ0FBQXhHLE1BQUE7UUFBQTtRQUFBO1VBQUEsT0FBQXdHLFNBQUEsQ0FBQTVHLElBQUE7TUFBQTtJQUFBLEdBQUFrRyxRQUFBO0VBQUEsQ0FLcEY7RUFBQSxnQkExQ0tGLFlBQVlBLENBQUFvQixHQUFBO0lBQUEsT0FBQW5CLEtBQUEsQ0FBQXhELEtBQUEsT0FBQUQsU0FBQTtFQUFBO0FBQUEsR0EwQ2pCO0FBRUQ2RSxNQUFNLENBQUNDLE9BQU8sR0FBR3RCLFlBQVkiLCJpZ25vcmVMaXN0IjpbXX0=