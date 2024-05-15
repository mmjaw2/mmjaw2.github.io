"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
// Copyright 2013-2024, University of Colorado Boulder

/**
 * Grunt configuration file for PhET projects. In general when possible, modules are imported lazily in their task
 * declaration to save on overall load time of this file. The pattern is to require all modules needed at the top of the
 * grunt task registration. If a module is used in multiple tasks, it is best to lazily require in each
 * task.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

///////////////////////////
// NOTE: to improve performance, the vast majority of modules are lazily imported in task registrations. Even duplicating
// require statements improves the load time of this file noticeably. For details, see https://github.com/phetsims/chipper/issues/1107
var assert = require('assert');
require('./checkNodeVersion');
///////////////////////////

// Allow other Gruntfiles to potentially handle exiting and errors differently`
if (!global.processEventOptOut) {
  // See https://medium.com/@dtinth/making-unhandled-promise-rejections-crash-the-node-js-process-ffc27cfcc9dd for how
  // to get unhandled promise rejections to fail out the node process.
  // Relevant for https://github.com/phetsims/wave-interference/issues/491
  process.on('unhandledRejection', function (up) {
    throw up;
  });

  // Exit on Ctrl + C case
  process.on('SIGINT', function () {
    console.log('\n\nCaught interrupt signal, exiting');
    process.exit();
  });
}
var Transpiler = require('../common/Transpiler');
var transpiler = new Transpiler({
  silent: true
});
module.exports = function (grunt) {
  var packageObject = grunt.file.readJSON('package.json');

  // Handle the lack of build.json
  var buildLocal;
  try {
    buildLocal = grunt.file.readJSON("".concat(process.env.HOME, "/.phet/build-local.json"));
  } catch (e) {
    buildLocal = {};
  }
  var repo = grunt.option('repo') || packageObject.name;
  assert(typeof repo === 'string' && /^[a-z]+(\x2D[a-z]+)*$/.test(repo), 'repo name should be composed of lower-case characters, optionally with dashes used as separators');

  /**
   * Wraps a promise's completion with grunt's asynchronous handling, with added helpful failure messages (including
   * stack traces, regardless of whether --stack was provided).
   * @public
   *
   * @param {Promise} promise
   */
  function wrap(_x) {
    return _wrap.apply(this, arguments);
  }
  /**
   * Wraps an async function for a grunt task. Will run the async function when the task should be executed. Will
   * properly handle grunt's async handling, and provides improved error reporting.
   * @public
   *
   * @param {async function} asyncTaskFunction
   */
  function _wrap() {
    _wrap = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee29(promise) {
      var done;
      return _regeneratorRuntime().wrap(function _callee29$(_context30) {
        while (1) switch (_context30.prev = _context30.next) {
          case 0:
            done = grunt.task.current.async();
            _context30.prev = 1;
            _context30.next = 4;
            return promise;
          case 4:
            _context30.next = 9;
            break;
          case 6:
            _context30.prev = 6;
            _context30.t0 = _context30["catch"](1);
            if (_context30.t0.stack) {
              grunt.fail.fatal("Perennial task failed:\n".concat(_context30.t0.stack, "\nFull Error details:\n").concat(_context30.t0));
            }

            // The toString check handles a weird case found from an Error object from puppeteer that doesn't stringify with
            // JSON or have a stack, JSON.stringifies to "{}", but has a `toString` method
            else if (typeof _context30.t0 === 'string' || JSON.stringify(_context30.t0).length === 2 && _context30.t0.toString) {
              grunt.fail.fatal("Perennial task failed: ".concat(_context30.t0));
            } else {
              grunt.fail.fatal("Perennial task failed with unknown error: ".concat(JSON.stringify(_context30.t0, null, 2)));
            }
          case 9:
            done();
          case 10:
          case "end":
            return _context30.stop();
        }
      }, _callee29, null, [[1, 6]]);
    }));
    return _wrap.apply(this, arguments);
  }
  function wrapTask(asyncTaskFunction) {
    return function () {
      wrap(asyncTaskFunction());
    };
  }
  grunt.registerTask('default', 'Builds the repository', [].concat(_toConsumableArray(grunt.option('lint') === false ? [] : ['lint-all']), _toConsumableArray(grunt.option('report-media') === false ? [] : ['report-media']), ['clean', 'build']));
  grunt.registerTask('clean', 'Erases the build/ directory and all its contents, and recreates the build/ directory', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
    var buildDirectory;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          buildDirectory = "../".concat(repo, "/build");
          if (grunt.file.exists(buildDirectory)) {
            grunt.file["delete"](buildDirectory);
          }
          grunt.file.mkdir(buildDirectory);
        case 3:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }))));
  grunt.registerTask('build-images', 'Build images only', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
    var jimp, generateThumbnails, generateTwitterCard, brand, buildDir, thumbnailSizes, _i, _thumbnailSizes, size, altScreenshots, _iterator, _step, altScreenshot, imageNumber;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          jimp = require('jimp');
          generateThumbnails = require('./generateThumbnails');
          generateTwitterCard = require('./generateTwitterCard');
          brand = 'phet';
          grunt.log.writeln("Building images for brand: ".concat(brand));
          buildDir = "../".concat(repo, "/build/").concat(brand); // Thumbnails and twitter card
          if (!grunt.file.exists("../".concat(repo, "/assets/").concat(repo, "-screenshot.png"))) {
            _context2.next = 62;
            break;
          }
          thumbnailSizes = [{
            width: 900,
            height: 591
          }, {
            width: 600,
            height: 394
          }, {
            width: 420,
            height: 276
          }, {
            width: 128,
            height: 84
          }, {
            width: 15,
            height: 10
          }];
          _i = 0, _thumbnailSizes = thumbnailSizes;
        case 9:
          if (!(_i < _thumbnailSizes.length)) {
            _context2.next = 20;
            break;
          }
          size = _thumbnailSizes[_i];
          _context2.t0 = grunt.file;
          _context2.t1 = "".concat(buildDir, "/").concat(repo, "-").concat(size.width, ".png");
          _context2.next = 15;
          return generateThumbnails(repo, size.width, size.height, 100, jimp.MIME_PNG);
        case 15:
          _context2.t2 = _context2.sent;
          _context2.t0.write.call(_context2.t0, _context2.t1, _context2.t2);
        case 17:
          _i++;
          _context2.next = 9;
          break;
        case 20:
          altScreenshots = grunt.file.expand({
            filter: 'isFile',
            cwd: "../".concat(repo, "/assets")
          }, ["./".concat(repo, "-screenshot-alt[0123456789].png")]);
          _iterator = _createForOfIteratorHelper(altScreenshots);
          _context2.prev = 22;
          _iterator.s();
        case 24:
          if ((_step = _iterator.n()).done) {
            _context2.next = 41;
            break;
          }
          altScreenshot = _step.value;
          imageNumber = Number(altScreenshot.substr("./".concat(repo, "-screenshot-alt").length, 1));
          _context2.t3 = grunt.file;
          _context2.t4 = "".concat(buildDir, "/").concat(repo, "-", 600, "-alt").concat(imageNumber, ".png");
          _context2.next = 31;
          return generateThumbnails(repo, 600, 394, 100, jimp.MIME_PNG, "-alt".concat(imageNumber));
        case 31:
          _context2.t5 = _context2.sent;
          _context2.t3.write.call(_context2.t3, _context2.t4, _context2.t5);
          _context2.t6 = grunt.file;
          _context2.t7 = "".concat(buildDir, "/").concat(repo, "-", 900, "-alt").concat(imageNumber, ".png");
          _context2.next = 37;
          return generateThumbnails(repo, 900, 591, 100, jimp.MIME_PNG, "-alt".concat(imageNumber));
        case 37:
          _context2.t8 = _context2.sent;
          _context2.t6.write.call(_context2.t6, _context2.t7, _context2.t8);
        case 39:
          _context2.next = 24;
          break;
        case 41:
          _context2.next = 46;
          break;
        case 43:
          _context2.prev = 43;
          _context2.t9 = _context2["catch"](22);
          _iterator.e(_context2.t9);
        case 46:
          _context2.prev = 46;
          _iterator.f();
          return _context2.finish(46);
        case 49:
          if (!(brand === 'phet')) {
            _context2.next = 62;
            break;
          }
          _context2.t10 = grunt.file;
          _context2.t11 = "".concat(buildDir, "/").concat(repo, "-ios.png");
          _context2.next = 54;
          return generateThumbnails(repo, 420, 276, 90, jimp.MIME_JPEG);
        case 54:
          _context2.t12 = _context2.sent;
          _context2.t10.write.call(_context2.t10, _context2.t11, _context2.t12);
          _context2.t13 = grunt.file;
          _context2.t14 = "".concat(buildDir, "/").concat(repo, "-twitter-card.png");
          _context2.next = 60;
          return generateTwitterCard(repo);
        case 60:
          _context2.t15 = _context2.sent;
          _context2.t13.write.call(_context2.t13, _context2.t14, _context2.t15);
        case 62:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[22, 43, 46, 49]]);
  }))));
  grunt.registerTask('output-js', 'Outputs JS just for the specified repo', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          transpiler.transpileRepo(repo);
        case 1:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }))));
  grunt.registerTask('output-js-project', 'Outputs JS for the specified repo and its dependencies', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
    var getPhetLibs;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          getPhetLibs = require('./getPhetLibs');
          transpiler.transpileRepos(getPhetLibs(repo));
        case 2:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }))));
  grunt.registerTask('output-js-all', 'Outputs JS for all repos', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          transpiler.transpileAll();
        case 1:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }))));
  grunt.registerTask('build', "Builds the repository. Depending on the repository type (runnable/wrapper/standalone), the result may vary.\nRunnable build options:\n --report-media - Will iterate over all of the license.json files and reports any media files, set to false to opt out.\n --brands={{BRANDS} - Can be * (build all supported brands), or a comma-separated list of brand names. Will fall back to using\n                      build-local.json's brands (or adapted-from-phet if that does not exist)\n --allHTML - If provided, will include the _all.html file (if it would not otherwise be built, e.g. phet brand)\n --XHTML - Includes an xhtml/ directory in the build output that contains a runnable XHTML form of the sim (with\n           a separated-out JS file).\n --locales={{LOCALES}} - Can be * (build all available locales, \"en\" and everything in babel), or a comma-separated list of locales\n --noTranspile - Flag to opt out of transpiling repos before build. This should only be used if you are confident that chipper/dist is already correct (to save time).\n --noTSC - Flag to opt out of type checking before build. This should only be used if you are confident that TypeScript is already errorless (to save time).\n --encodeStringMap=false - Disables the encoding of the string map in the built file. This is useful for debugging.\n \nMinify-specific options: \n --minify.babelTranspile=false - Disables babel transpilation phase.\n --minify.uglify=false - Disables uglification, so the built file will include (essentially) concatenated source files.\n --minify.mangle=false - During uglification, it will not \"mangle\" variable names (where they get renamed to short constants to reduce file size.)\n --minify.beautify=true - After uglification, the source code will be syntax formatted nicely\n --minify.stripAssertions=false - During uglification, it will strip assertions.\n --minify.stripLogging=false - During uglification, it will not strip logging statements.\n ", wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9() {
    var buildStandalone, buildRunnable, minify, tsc, reportTscResults, path, fs, getPhetLibs, phetTimingLog;
    return _regeneratorRuntime().wrap(function _callee9$(_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          buildStandalone = require('./buildStandalone');
          buildRunnable = require('./buildRunnable');
          minify = require('./minify');
          tsc = require('./tsc');
          reportTscResults = require('./reportTscResults');
          path = require('path');
          fs = require('fs');
          getPhetLibs = require('./getPhetLibs');
          phetTimingLog = require('../../../perennial-alias/js/common/phetTimingLog');
          _context10.next = 11;
          return phetTimingLog.startAsync('grunt-build', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8() {
            var minifyKeys, minifyOptions, repoPackageObject, brands, parentDir, _iterator2, _step2, file, localPackageObject, allHTML, encodeStringMap, compressScripts, profileFileSize, localesOption, _iterator3, _step3, _loop;
            return _regeneratorRuntime().wrap(function _callee8$(_context9) {
              while (1) switch (_context9.prev = _context9.next) {
                case 0:
                  // Parse minification keys
                  minifyKeys = Object.keys(minify.MINIFY_DEFAULTS);
                  minifyOptions = {};
                  minifyKeys.forEach(function (minifyKey) {
                    var option = grunt.option("minify.".concat(minifyKey));
                    if (option === true || option === false) {
                      minifyOptions[minifyKey] = option;
                    }
                  });
                  repoPackageObject = grunt.file.readJSON("../".concat(repo, "/package.json")); // Run the type checker first.
                  brands = getBrands(grunt, repo, buildLocal);
                  _context9.t0 = !grunt.option('noTSC');
                  if (!_context9.t0) {
                    _context9.next = 9;
                    break;
                  }
                  _context9.next = 9;
                  return phetTimingLog.startAsync('tsc', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
                    var results;
                    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
                      while (1) switch (_context6.prev = _context6.next) {
                        case 0:
                          if (!(brands.includes('phet-io') || brands.includes('phet'))) {
                            _context6.next = 7;
                            break;
                          }
                          _context6.next = 3;
                          return tsc("../".concat(repo));
                        case 3:
                          results = _context6.sent;
                          reportTscResults(results, grunt);
                          _context6.next = 8;
                          break;
                        case 7:
                          grunt.log.writeln('skipping type checking');
                        case 8:
                        case "end":
                          return _context6.stop();
                      }
                    }, _callee6);
                  })));
                case 9:
                  _context9.t1 = !grunt.option('noTranspile');
                  if (!_context9.t1) {
                    _context9.next = 13;
                    break;
                  }
                  _context9.next = 13;
                  return phetTimingLog.startAsync('transpile', function () {
                    // If that succeeds, then convert the code to JS
                    transpiler.transpileRepos(getPhetLibs(repo));
                  });
                case 13:
                  if (!repoPackageObject.phet.buildStandalone) {
                    _context9.next = 36;
                    break;
                  }
                  grunt.log.writeln('Building standalone repository');
                  parentDir = "../".concat(repo, "/build/");
                  if (!fs.existsSync(parentDir)) {
                    fs.mkdirSync(parentDir);
                  }
                  _context9.t2 = fs;
                  _context9.t3 = "".concat(parentDir, "/").concat(repo, ".min.js");
                  _context9.next = 21;
                  return buildStandalone(repo, minifyOptions);
                case 21:
                  _context9.t4 = _context9.sent;
                  _context9.t2.writeFileSync.call(_context9.t2, _context9.t3, _context9.t4);
                  // Build a debug version
                  minifyOptions.minify = false;
                  minifyOptions.babelTranspile = false;
                  minifyOptions.uglify = false;
                  minifyOptions.isDebug = true;
                  _context9.t5 = fs;
                  _context9.t6 = "".concat(parentDir, "/").concat(repo, ".debug.js");
                  _context9.next = 31;
                  return buildStandalone(repo, minifyOptions, true);
                case 31:
                  _context9.t7 = _context9.sent;
                  _context9.t5.writeFileSync.call(_context9.t5, _context9.t6, _context9.t7);
                  if (repoPackageObject.phet.standaloneTranspiles) {
                    _iterator2 = _createForOfIteratorHelper(repoPackageObject.phet.standaloneTranspiles);
                    try {
                      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                        file = _step2.value;
                        fs.writeFileSync("../".concat(repo, "/build/").concat(path.basename(file)), minify(grunt.file.read(file)));
                      }
                    } catch (err) {
                      _iterator2.e(err);
                    } finally {
                      _iterator2.f();
                    }
                  }
                  _context9.next = 60;
                  break;
                case 36:
                  localPackageObject = grunt.file.readJSON("../".concat(repo, "/package.json"));
                  assert(localPackageObject.phet.runnable, "".concat(repo, " does not appear to be runnable"));
                  grunt.log.writeln("Building runnable repository (".concat(repo, ", brands: ").concat(brands.join(', '), ")"));

                  // Other options
                  allHTML = !!grunt.option('allHTML');
                  encodeStringMap = grunt.option('encodeStringMap') !== false;
                  compressScripts = !!grunt.option('compressScripts');
                  profileFileSize = !!grunt.option('profileFileSize');
                  localesOption = grunt.option('locales') || 'en'; // Default back to English for now
                  _iterator3 = _createForOfIteratorHelper(brands);
                  _context9.prev = 45;
                  _loop = /*#__PURE__*/_regeneratorRuntime().mark(function _loop() {
                    var brand;
                    return _regeneratorRuntime().wrap(function _loop$(_context8) {
                      while (1) switch (_context8.prev = _context8.next) {
                        case 0:
                          brand = _step3.value;
                          grunt.log.writeln("Building brand: ".concat(brand));
                          _context8.next = 4;
                          return phetTimingLog.startAsync('build-brand-' + brand, /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7() {
                            return _regeneratorRuntime().wrap(function _callee7$(_context7) {
                              while (1) switch (_context7.prev = _context7.next) {
                                case 0:
                                  _context7.next = 2;
                                  return buildRunnable(repo, minifyOptions, allHTML, brand, localesOption, buildLocal, encodeStringMap, compressScripts, profileFileSize);
                                case 2:
                                case "end":
                                  return _context7.stop();
                              }
                            }, _callee7);
                          })));
                        case 4:
                        case "end":
                          return _context8.stop();
                      }
                    }, _loop);
                  });
                  _iterator3.s();
                case 48:
                  if ((_step3 = _iterator3.n()).done) {
                    _context9.next = 52;
                    break;
                  }
                  return _context9.delegateYield(_loop(), "t8", 50);
                case 50:
                  _context9.next = 48;
                  break;
                case 52:
                  _context9.next = 57;
                  break;
                case 54:
                  _context9.prev = 54;
                  _context9.t9 = _context9["catch"](45);
                  _iterator3.e(_context9.t9);
                case 57:
                  _context9.prev = 57;
                  _iterator3.f();
                  return _context9.finish(57);
                case 60:
                case "end":
                  return _context9.stop();
              }
            }, _callee8, null, [[45, 54, 57, 60]]);
          })));
        case 11:
        case "end":
          return _context10.stop();
      }
    }, _callee9);
  }))));
  grunt.registerTask('generate-used-strings-file', 'Writes used strings to phet-io-sim-specific/ so that PhET-iO sims only output relevant strings to the API in unbuilt mode', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10() {
    var getPhetLibs, fs, webpackBuild, ChipperConstants, getLocalesFromRepository, getStringMap, webpackResult, phetLibs, allLocales, _getStringMap, stringMap;
    return _regeneratorRuntime().wrap(function _callee10$(_context11) {
      while (1) switch (_context11.prev = _context11.next) {
        case 0:
          getPhetLibs = require('./getPhetLibs');
          fs = require('fs');
          webpackBuild = require('./webpackBuild');
          ChipperConstants = require('../common/ChipperConstants');
          getLocalesFromRepository = require('./getLocalesFromRepository');
          getStringMap = require('./getStringMap');
          transpiler.transpileRepos(getPhetLibs(repo));
          _context11.next = 9;
          return webpackBuild(repo, 'phet');
        case 9:
          webpackResult = _context11.sent;
          phetLibs = getPhetLibs(repo, 'phet');
          allLocales = [ChipperConstants.FALLBACK_LOCALE].concat(_toConsumableArray(getLocalesFromRepository(repo)));
          _getStringMap = getStringMap(repo, allLocales, phetLibs, webpackResult.usedModules), stringMap = _getStringMap.stringMap; // TODO: https://github.com/phetsims/phet-io/issues/1877 This is only pertinent for phet-io, so I'm outputting
          // it to phet-io-sim-specific.  But none of intrinsic data is phet-io-specific.
          // Do we want a different path for it?
          // TODO: https://github.com/phetsims/phet-io/issues/1877 How do we indicate that it is a build artifact, and
          // should not be manually updated?
          fs.writeFileSync("../phet-io-sim-specific/repos/".concat(repo, "/used-strings_en.json"), JSON.stringify(stringMap.en, null, 2));
        case 14:
        case "end":
          return _context11.stop();
      }
    }, _callee10);
  }))));
  grunt.registerTask('build-for-server', 'meant for use by build-server only', ['build']);
  grunt.registerTask('lint', "lint js files. Options:\n--disable-eslint-cache: cache will not be read from, and cache will be cleared for next run.\n--fix: autofixable changes will be written to disk\n--chip-away: output a list of responsible devs for each repo with lint problems\n--repos: comma separated list of repos to lint in addition to the repo from running", wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11() {
    var lint, cache, fix, chipAway, extraRepos, lintReturnValue;
    return _regeneratorRuntime().wrap(function _callee11$(_context12) {
      while (1) switch (_context12.prev = _context12.next) {
        case 0:
          lint = require('./lint'); // --disable-eslint-cache disables the cache, useful for developing rules
          cache = !grunt.option('disable-eslint-cache');
          fix = grunt.option('fix');
          chipAway = grunt.option('chip-away');
          extraRepos = grunt.option('repos') ? grunt.option('repos').split(',') : [];
          _context12.next = 7;
          return lint([repo].concat(_toConsumableArray(extraRepos)), {
            cache: cache,
            fix: fix,
            chipAway: chipAway
          });
        case 7:
          lintReturnValue = _context12.sent;
          if (!lintReturnValue.ok) {
            grunt.fail.fatal('Lint failed');
          }
        case 9:
        case "end":
          return _context12.stop();
      }
    }, _callee11);
  }))));
  grunt.registerTask('lint-all', 'lint all js files that are required to build this repository (for the specified brands)', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee12() {
    var lint, cache, fix, chipAway, getPhetLibs, brands, lintReturnValue;
    return _regeneratorRuntime().wrap(function _callee12$(_context13) {
      while (1) switch (_context13.prev = _context13.next) {
        case 0:
          lint = require('./lint'); // --disable-eslint-cache disables the cache, useful for developing rules
          cache = !grunt.option('disable-eslint-cache');
          fix = grunt.option('fix');
          chipAway = grunt.option('chip-away');
          assert && assert(!grunt.option('patterns'), 'patterns not support for lint-all');
          getPhetLibs = require('./getPhetLibs');
          brands = getBrands(grunt, repo, buildLocal);
          _context13.next = 9;
          return lint(getPhetLibs(repo, brands), {
            cache: cache,
            fix: fix,
            chipAway: chipAway
          });
        case 9:
          lintReturnValue = _context13.sent;
          // Output results on errors.
          if (!lintReturnValue.ok) {
            grunt.fail.fatal('Lint failed');
          }
        case 11:
        case "end":
          return _context13.stop();
      }
    }, _callee12);
  }))));
  grunt.registerTask('generate-development-html', 'Generates top-level SIM_en.html file based on the preloads in package.json.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee13() {
    var generateDevelopmentHTML;
    return _regeneratorRuntime().wrap(function _callee13$(_context14) {
      while (1) switch (_context14.prev = _context14.next) {
        case 0:
          generateDevelopmentHTML = require('./generateDevelopmentHTML');
          _context14.next = 3;
          return generateDevelopmentHTML(repo);
        case 3:
        case "end":
          return _context14.stop();
      }
    }, _callee13);
  }))));
  grunt.registerTask('generate-test-html', 'Generates top-level SIM-tests.html file based on the preloads in package.json.  See https://github.com/phetsims/aqua/blob/main/doc/adding-unit-tests.md ' + 'for more information on automated testing. Usually you should ' + 'set the "generatedUnitTests":true flag in the sim package.json and run `grunt update` instead of manually generating this.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee14() {
    var generateTestHTML;
    return _regeneratorRuntime().wrap(function _callee14$(_context15) {
      while (1) switch (_context15.prev = _context15.next) {
        case 0:
          generateTestHTML = require('./generateTestHTML');
          _context15.next = 3;
          return generateTestHTML(repo);
        case 3:
        case "end":
          return _context15.stop();
      }
    }, _callee14);
  }))));
  grunt.registerTask('generate-a11y-view-html', 'Generates top-level SIM-a11y-view.html file used for visualizing accessible content. Usually you should ' + 'set the "phet.simFeatures.supportsInteractiveDescription":true flag in the sim package.json and run `grunt update` ' + 'instead of manually generating this.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee15() {
    var generateA11yViewHTML;
    return _regeneratorRuntime().wrap(function _callee15$(_context16) {
      while (1) switch (_context16.prev = _context16.next) {
        case 0:
          generateA11yViewHTML = require('./generateA11yViewHTML');
          _context16.next = 3;
          return generateA11yViewHTML(repo);
        case 3:
        case "end":
          return _context16.stop();
      }
    }, _callee15);
  }))));
  grunt.registerTask('update', "\nUpdates the normal automatically-generated files for this repository. Includes:\n  * runnables: generate-development-html and modulify\n  * accessible runnables: generate-a11y-view-html\n  * unit tests: generate-test-html\n  * simulations: generateREADME()\n  * phet-io simulations: generate overrides file if needed\n  * create the conglomerate string files for unbuilt mode, for this repo and its dependencies", wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee16() {
    var generateREADME, fs, _, overridesFile, writeFileAndGitAdd, overridesContent, simSpecificWrappers;
    return _regeneratorRuntime().wrap(function _callee16$(_context17) {
      while (1) switch (_context17.prev = _context17.next) {
        case 0:
          generateREADME = require('./generateREADME');
          fs = require('fs');
          _ = require('lodash'); // support repos that don't have a phet object
          if (packageObject.phet) {
            _context17.next = 5;
            break;
          }
          return _context17.abrupt("return");
        case 5:
          // modulify is graceful if there are no files that need modulifying.
          grunt.task.run('modulify');

          // update README.md only for simulations
          if (!(packageObject.phet.simulation && !packageObject.phet.readmeCreatedManually)) {
            _context17.next = 9;
            break;
          }
          _context17.next = 9;
          return generateREADME(repo, !!packageObject.phet.published);
        case 9:
          if (!(packageObject.phet.supportedBrands && packageObject.phet.supportedBrands.includes('phet-io'))) {
            _context17.next = 25;
            break;
          }
          // Copied from build.json and used as a preload for phet-io brand
          overridesFile = "js/".concat(repo, "-phet-io-overrides.js"); // If there is already an overrides file, don't overwrite it with an empty one
          if (fs.existsSync("../".concat(repo, "/").concat(overridesFile))) {
            _context17.next = 16;
            break;
          }
          writeFileAndGitAdd = require('../../../perennial-alias/js/common/writeFileAndGitAdd');
          overridesContent = '/* eslint-disable */\nwindow.phet.preloads.phetio.phetioElementsOverrides = {};';
          _context17.next = 16;
          return writeFileAndGitAdd(repo, overridesFile, overridesContent);
        case 16:
          _context17.prev = 16;
          // Populate sim-specific wrappers into the package.json
          simSpecificWrappers = fs.readdirSync("../phet-io-sim-specific/repos/".concat(repo, "/wrappers/"), {
            withFileTypes: true
          }).filter(function (dirent) {
            return dirent.isDirectory();
          }).map(function (dirent) {
            return "phet-io-sim-specific/repos/".concat(repo, "/wrappers/").concat(dirent.name);
          });
          if (simSpecificWrappers.length > 0) {
            packageObject.phet['phet-io'] = packageObject.phet['phet-io'] || {};
            packageObject.phet['phet-io'].wrappers = _.uniq(simSpecificWrappers.concat(packageObject.phet['phet-io'].wrappers || []));
            grunt.file.write('package.json', JSON.stringify(packageObject, null, 2));
          }
          _context17.next = 25;
          break;
        case 21:
          _context17.prev = 21;
          _context17.t0 = _context17["catch"](16);
          if (_context17.t0.message.includes('no such file or directory')) {
            _context17.next = 25;
            break;
          }
          throw _context17.t0;
        case 25:
          // The above code can mutate the package.json, so do these after
          if (packageObject.phet.runnable) {
            grunt.task.run('generate-development-html');
            if (packageObject.phet.simFeatures && packageObject.phet.simFeatures.supportsInteractiveDescription) {
              grunt.task.run('generate-a11y-view-html');
            }
          }
          if (packageObject.phet.generatedUnitTests) {
            grunt.task.run('generate-test-html');
          }
        case 27:
        case "end":
          return _context17.stop();
      }
    }, _callee16, null, [[16, 21]]);
  }))));

  // This is not run in grunt update because it affects dependencies and outputs files outside of the repo.
  grunt.registerTask('generate-development-strings', 'To support locales=* in unbuilt mode, generate a conglomerate JSON file for each repo with translations in babel. Run on all repos via:\n' + '* for-each.sh perennial-alias/data/active-repos npm install\n' + '* for-each.sh perennial-alias/data/active-repos grunt generate-development-strings', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee17() {
    var generateDevelopmentStrings, fs;
    return _regeneratorRuntime().wrap(function _callee17$(_context18) {
      while (1) switch (_context18.prev = _context18.next) {
        case 0:
          generateDevelopmentStrings = require('../scripts/generateDevelopmentStrings');
          fs = require('fs');
          if (fs.existsSync("../".concat(repo, "/").concat(repo, "-strings_en.json"))) {
            generateDevelopmentStrings(repo);
          }
        case 3:
        case "end":
          return _context18.stop();
      }
    }, _callee17);
  }))));
  grunt.registerTask('published-README', 'Generates README.md file for a published simulation.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee18() {
    var generateREADME;
    return _regeneratorRuntime().wrap(function _callee18$(_context19) {
      while (1) switch (_context19.prev = _context19.next) {
        case 0:
          generateREADME = require('./generateREADME'); // used by multiple tasks
          _context19.next = 3;
          return generateREADME(repo, true /* published */);
        case 3:
        case "end":
          return _context19.stop();
      }
    }, _callee18);
  }))));
  grunt.registerTask('unpublished-README', 'Generates README.md file for an unpublished simulation.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee19() {
    var generateREADME;
    return _regeneratorRuntime().wrap(function _callee19$(_context20) {
      while (1) switch (_context20.prev = _context20.next) {
        case 0:
          generateREADME = require('./generateREADME'); // used by multiple tasks
          _context20.next = 3;
          return generateREADME(repo, false /* published */);
        case 3:
        case "end":
          return _context20.stop();
      }
    }, _callee19);
  }))));
  grunt.registerTask('sort-imports', 'Sort the import statements for a single file (if --file={{FILE}} is provided), or does so for all JS files if not specified', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee20() {
    var sortImports, file;
    return _regeneratorRuntime().wrap(function _callee20$(_context21) {
      while (1) switch (_context21.prev = _context21.next) {
        case 0:
          sortImports = require('./sortImports');
          file = grunt.option('file');
          if (file) {
            sortImports(file);
          } else {
            grunt.file.recurse("../".concat(repo, "/js"), function (absfile) {
              return sortImports(absfile);
            });
          }
        case 3:
        case "end":
          return _context21.stop();
      }
    }, _callee20);
  }))));
  grunt.registerTask('commits-since', 'Shows commits since a specified date. Use --date=<date> to specify the date.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee21() {
    var dateString, commitsSince;
    return _regeneratorRuntime().wrap(function _callee21$(_context22) {
      while (1) switch (_context22.prev = _context22.next) {
        case 0:
          dateString = grunt.option('date');
          assert(dateString, 'missing required option: --date={{DATE}}');
          commitsSince = require('./commitsSince');
          _context22.next = 5;
          return commitsSince(repo, dateString);
        case 5:
        case "end":
          return _context22.stop();
      }
    }, _callee21);
  }))));

  // See reportMedia.js
  grunt.registerTask('report-media', '(project-wide) Report on license.json files throughout all working copies. ' + 'Reports any media (such as images or sound) files that have any of the following problems:\n' + '(1) incompatible-license (resource license not approved)\n' + '(2) not-annotated (license.json missing or entry missing from license.json)\n' + '(3) missing-file (entry in the license.json but not on the file system)', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee22() {
    var reportMedia;
    return _regeneratorRuntime().wrap(function _callee22$(_context23) {
      while (1) switch (_context23.prev = _context23.next) {
        case 0:
          reportMedia = require('./reportMedia');
          _context23.next = 3;
          return reportMedia(repo);
        case 3:
        case "end":
          return _context23.stop();
      }
    }, _callee22);
  }))));

  // see reportThirdParty.js
  grunt.registerTask('report-third-party', 'Creates a report of third-party resources (code, images, sound, etc) used in the published PhET simulations by ' + 'reading the license information in published HTML files on the PhET website. This task must be run from main.  ' + 'After running this task, you must push sherpa/third-party-licenses.md.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee23() {
    var reportThirdParty;
    return _regeneratorRuntime().wrap(function _callee23$(_context24) {
      while (1) switch (_context24.prev = _context24.next) {
        case 0:
          reportThirdParty = require('./reportThirdParty');
          _context24.next = 3;
          return reportThirdParty();
        case 3:
        case "end":
          return _context24.stop();
      }
    }, _callee23);
  }))));
  grunt.registerTask('modulify', 'Creates *.js modules for all images/strings/audio/etc in a repo', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee24() {
    var modulify, reportMedia, generateDevelopmentStrings, fs;
    return _regeneratorRuntime().wrap(function _callee24$(_context25) {
      while (1) switch (_context25.prev = _context25.next) {
        case 0:
          modulify = require('./modulify');
          reportMedia = require('./reportMedia');
          generateDevelopmentStrings = require('../scripts/generateDevelopmentStrings');
          fs = require('fs');
          _context25.next = 6;
          return modulify(repo);
        case 6:
          if (fs.existsSync("../".concat(repo, "/").concat(repo, "-strings_en.json"))) {
            generateDevelopmentStrings(repo);
          }

          // Do this last to help with prototyping before commit (it would be frustrating if this errored out before giving
          // you the asset you could use in the sim).
          _context25.next = 9;
          return reportMedia(repo);
        case 9:
        case "end":
          return _context25.stop();
      }
    }, _callee24);
  }))));

  // Grunt task that determines created and last modified dates from git, and
  // updates copyright statements accordingly, see #403
  grunt.registerTask('update-copyright-dates', 'Update the copyright dates in JS source files based on Github dates', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee25() {
    var updateCopyrightDates;
    return _regeneratorRuntime().wrap(function _callee25$(_context26) {
      while (1) switch (_context26.prev = _context26.next) {
        case 0:
          updateCopyrightDates = require('./updateCopyrightDates');
          _context26.next = 3;
          return updateCopyrightDates(repo);
        case 3:
        case "end":
          return _context26.stop();
      }
    }, _callee25);
  }))));
  grunt.registerTask('webpack-dev-server', "Runs a webpack server for a given list of simulations.\n--repos=REPOS for a comma-separated list of repos (defaults to current repo)\n--port=9000 to adjust the running port\n--devtool=string value for sourcemap generation specified at https://webpack.js.org/configuration/devtool or undefined for (none)\n--chrome: open the sims in Chrome tabs (Mac)", function () {
    // We don't finish! Don't tell grunt this...
    grunt.task.current.async();
    var repos = grunt.option('repos') ? grunt.option('repos').split(',') : [repo];
    var port = grunt.option('port') || 9000;
    var devtool = grunt.option('devtool') || 'inline-source-map';
    if (devtool === 'none' || devtool === 'undefined') {
      devtool = undefined;
    }
    var openChrome = grunt.option('chrome') || false;
    var webpackDevServer = require('./webpackDevServer');

    // NOTE: We don't care about the promise that is returned here, because we are going to keep this task running
    // until the user manually kills it.
    webpackDevServer(repos, port, devtool, openChrome);
  });
  grunt.registerTask('generate-phet-io-api', 'Output the PhET-iO API as JSON to phet-io-sim-specific/api.\n' + 'Options\n:' + '--sims=... a list of sims to compare (defaults to the sim in the current dir)\n' + '--simList=... a file with a list of sims to compare (defaults to the sim in the current dir)\n' + '--stable - regenerate for all "stable sims" (see perennial/data/phet-io-api-stable/)\n' + '--temporary - outputs to the temporary directory\n' + '--transpile=false - skips the transpilation step. You can skip transpilation if a watch process is handling it.', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee26() {
    var formatPhetioAPI, getSimList, generatePhetioMacroAPI, fs, sims, skipTranspile, startTime, transpileTimeMS, results;
    return _regeneratorRuntime().wrap(function _callee26$(_context27) {
      while (1) switch (_context27.prev = _context27.next) {
        case 0:
          formatPhetioAPI = require('../phet-io/formatPhetioAPI');
          getSimList = require('../common/getSimList');
          generatePhetioMacroAPI = require('../phet-io/generatePhetioMacroAPI');
          fs = require('fs');
          sims = getSimList().length === 0 ? [repo] : getSimList(); // Ideally transpilation would be a no-op if the watch process is running. However, it can take 2+ seconds on
          // macOS to check all files, and sometimes much longer (50+ seconds) if the cache mechanism is failing.
          // So this "skip" is a band-aid until we reduce those other problems.
          skipTranspile = grunt.option('transpile') === false;
          if (!skipTranspile) {
            startTime = Date.now();
            transpiler.transpileAll();
            transpileTimeMS = Date.now() - startTime; // Notify about long transpile times, in case more people need to skip
            if (transpileTimeMS >= 5000) {
              grunt.log.writeln("generate-phet-io-api transpilation took ".concat(transpileTimeMS, " ms"));
            }
          } else {
            grunt.log.writeln('Skipping transpilation');
          }
          _context27.next = 9;
          return generatePhetioMacroAPI(sims, {
            showProgressBar: sims.length > 1,
            throwAPIGenerationErrors: false // Write as many as we can, and print what we didn't write
          });
        case 9:
          results = _context27.sent;
          sims.forEach(function (sim) {
            var dir = "../phet-io-sim-specific/repos/".concat(sim);
            try {
              fs.mkdirSync(dir);
            } catch (e) {
              // Directory exists
            }
            var filePath = "".concat(dir, "/").concat(sim, "-phet-io-api").concat(grunt.option('temporary') ? '-temporary' : '', ".json");
            var api = results[sim];
            api && fs.writeFileSync(filePath, formatPhetioAPI(api));
          });
        case 11:
        case "end":
          return _context27.stop();
      }
    }, _callee26);
  }))));
  grunt.registerTask('compare-phet-io-api', 'Compares the phet-io-api against the reference version(s) if this sim\'s package.json marks compareDesignedAPIChanges.  ' + 'This will by default compare designed changes only. Options:\n' + '--sims=... a list of sims to compare (defaults to the sim in the current dir)\n' + '--simList=... a file with a list of sims to compare (defaults to the sim in the current dir)\n' + '--stable, generate the phet-io-apis for each phet-io sim considered to have a stable API (see perennial-alias/data/phet-io-api-stable)\n' + '--delta, by default a breaking-compatibility comparison is done, but --delta shows all changes\n' + '--temporary, compares API files in the temporary directory (otherwise compares to freshly generated APIs)\n' + '--compareBreakingAPIChanges - add this flag to compare breaking changes in addition to designed changes', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee27() {
    var getSimList, generatePhetioMacroAPI, fs, sims, temporary, proposedAPIs, options, ok;
    return _regeneratorRuntime().wrap(function _callee27$(_context28) {
      while (1) switch (_context28.prev = _context28.next) {
        case 0:
          getSimList = require('../common/getSimList');
          generatePhetioMacroAPI = require('../phet-io/generatePhetioMacroAPI');
          fs = require('fs');
          sims = getSimList().length === 0 ? [repo] : getSimList();
          temporary = grunt.option('temporary');
          proposedAPIs = null;
          if (!temporary) {
            _context28.next = 11;
            break;
          }
          proposedAPIs = {};
          sims.forEach(function (sim) {
            proposedAPIs[sim] = JSON.parse(fs.readFileSync("../phet-io-sim-specific/repos/".concat(repo, "/").concat(repo, "-phet-io-api-temporary.json"), 'utf8'));
          });
          _context28.next = 15;
          break;
        case 11:
          transpiler.transpileAll();
          _context28.next = 14;
          return generatePhetioMacroAPI(sims, {
            showProgressBar: sims.length > 1,
            showMessagesFromSim: false
          });
        case 14:
          proposedAPIs = _context28.sent;
        case 15:
          // Don't add to options object if values are `undefined` (as _.extend will keep those entries and not mix in defaults
          options = {};
          if (grunt.option('delta')) {
            options.delta = grunt.option('delta');
          }
          if (grunt.option('compareBreakingAPIChanges')) {
            options.compareBreakingAPIChanges = grunt.option('compareBreakingAPIChanges');
          }
          _context28.next = 20;
          return require('../phet-io/phetioCompareAPISets')(sims, proposedAPIs, options);
        case 20:
          ok = _context28.sent;
          !ok && grunt.fail.fatal('PhET-iO API comparison failed');
        case 22:
        case "end":
          return _context28.stop();
      }
    }, _callee27);
  }))));
  grunt.registerTask('profile-file-size', 'Profiles the file size of the built JS file for a given repo', wrapTask( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee28() {
    var profileFileSize;
    return _regeneratorRuntime().wrap(function _callee28$(_context29) {
      while (1) switch (_context29.prev = _context29.next) {
        case 0:
          profileFileSize = require('../grunt/profileFileSize');
          _context29.next = 3;
          return profileFileSize(repo);
        case 3:
        case "end":
          return _context29.stop();
      }
    }, _callee28);
  }))));

  /**
   * Creates grunt tasks that effectively get forwarded to perennial. It will execute a grunt process running from
   * perennial's directory with the same options (but with --repo={{REPO}} added, so that perennial is aware of what
   * repository is the target).
   * @public
   *
   * @param {string} task - The name of the task
   */
  function forwardToPerennialGrunt(task) {
    grunt.registerTask(task, 'Run grunt --help in perennial to see documentation', function () {
      grunt.log.writeln('(Forwarding task to perennial)');
      var child_process = require('child_process');
      var done = grunt.task.current.async();

      // Include the --repo flag
      var args = ["--repo=".concat(repo)].concat(_toConsumableArray(process.argv.slice(2)));
      var argsString = args.map(function (arg) {
        return "\"".concat(arg, "\"");
      }).join(' ');
      var spawned = child_process.spawn(/^win/.test(process.platform) ? 'grunt.cmd' : 'grunt', args, {
        cwd: '../perennial'
      });
      grunt.log.debug("running grunt ".concat(argsString, " in ../").concat(repo));
      spawned.stderr.on('data', function (data) {
        return grunt.log.error(data.toString());
      });
      spawned.stdout.on('data', function (data) {
        return grunt.log.write(data.toString());
      });
      process.stdin.pipe(spawned.stdin);
      spawned.on('close', function (code) {
        if (code !== 0) {
          throw new Error("perennial grunt ".concat(argsString, " failed with code ").concat(code));
        } else {
          done();
        }
      });
    });
  }
  ['checkout-shas', 'checkout-target', 'checkout-release', 'checkout-main', 'checkout-main-all', 'create-one-off', 'sha-check', 'sim-list', 'npm-update', 'create-release', 'cherry-pick', 'wrapper', 'dev', 'one-off', 'rc', 'production', 'prototype', 'create-sim', 'insert-require-statement', 'lint-everything', 'generate-data', 'pdom-comparison', 'release-branch-list'].forEach(forwardToPerennialGrunt);
};
var getBrands = function getBrands(grunt, repo, buildLocal) {
  // Determine what brands we want to build
  assert(!grunt.option('brand'), 'Use --brands={{BRANDS}} instead of brand');
  var localPackageObject = grunt.file.readJSON("../".concat(repo, "/package.json"));
  var supportedBrands = localPackageObject.phet.supportedBrands || [];
  var brands;
  if (grunt.option('brands')) {
    if (grunt.option('brands') === '*') {
      brands = supportedBrands;
    } else {
      brands = grunt.option('brands').split(',');
    }
  } else if (buildLocal.brands) {
    // Extra check, see https://github.com/phetsims/chipper/issues/640
    assert(Array.isArray(buildLocal.brands), 'If brands exists in build-local.json, it should be an array');
    brands = buildLocal.brands.filter(function (brand) {
      return supportedBrands.includes(brand);
    });
  } else {
    brands = ['adapted-from-phet'];
  }

  // Ensure all listed brands are valid
  brands.forEach(function (brand) {
    return assert(supportedBrands.includes(brand), "Unsupported brand: ".concat(brand));
  });
  return brands;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVnZW5lcmF0b3JSdW50aW1lIiwiZSIsInQiLCJyIiwiT2JqZWN0IiwicHJvdG90eXBlIiwibiIsImhhc093blByb3BlcnR5IiwibyIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJpIiwiU3ltYm9sIiwiYSIsIml0ZXJhdG9yIiwiYyIsImFzeW5jSXRlcmF0b3IiLCJ1IiwidG9TdHJpbmdUYWciLCJkZWZpbmUiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ3cmFwIiwiR2VuZXJhdG9yIiwiY3JlYXRlIiwiQ29udGV4dCIsIm1ha2VJbnZva2VNZXRob2QiLCJ0cnlDYXRjaCIsInR5cGUiLCJhcmciLCJjYWxsIiwiaCIsImwiLCJmIiwicyIsInkiLCJHZW5lcmF0b3JGdW5jdGlvbiIsIkdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlIiwicCIsImQiLCJnZXRQcm90b3R5cGVPZiIsInYiLCJ2YWx1ZXMiLCJnIiwiZGVmaW5lSXRlcmF0b3JNZXRob2RzIiwiZm9yRWFjaCIsIl9pbnZva2UiLCJBc3luY0l0ZXJhdG9yIiwiaW52b2tlIiwiX3R5cGVvZiIsInJlc29sdmUiLCJfX2F3YWl0IiwidGhlbiIsImNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnIiwiRXJyb3IiLCJkb25lIiwibWV0aG9kIiwiZGVsZWdhdGUiLCJtYXliZUludm9rZURlbGVnYXRlIiwic2VudCIsIl9zZW50IiwiZGlzcGF0Y2hFeGNlcHRpb24iLCJhYnJ1cHQiLCJUeXBlRXJyb3IiLCJyZXN1bHROYW1lIiwibmV4dCIsIm5leHRMb2MiLCJwdXNoVHJ5RW50cnkiLCJ0cnlMb2MiLCJjYXRjaExvYyIsImZpbmFsbHlMb2MiLCJhZnRlckxvYyIsInRyeUVudHJpZXMiLCJwdXNoIiwicmVzZXRUcnlFbnRyeSIsImNvbXBsZXRpb24iLCJyZXNldCIsImlzTmFOIiwibGVuZ3RoIiwiZGlzcGxheU5hbWUiLCJpc0dlbmVyYXRvckZ1bmN0aW9uIiwiY29uc3RydWN0b3IiLCJuYW1lIiwibWFyayIsInNldFByb3RvdHlwZU9mIiwiX19wcm90b19fIiwiYXdyYXAiLCJhc3luYyIsIlByb21pc2UiLCJrZXlzIiwicmV2ZXJzZSIsInBvcCIsInByZXYiLCJjaGFyQXQiLCJzbGljZSIsInN0b3AiLCJydmFsIiwiaGFuZGxlIiwiY29tcGxldGUiLCJmaW5pc2giLCJfY2F0Y2giLCJkZWxlZ2F0ZVlpZWxkIiwiX3RvQ29uc3VtYWJsZUFycmF5IiwiYXJyIiwiX2FycmF5V2l0aG91dEhvbGVzIiwiX2l0ZXJhYmxlVG9BcnJheSIsIl91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheSIsIl9ub25JdGVyYWJsZVNwcmVhZCIsIm1pbkxlbiIsIl9hcnJheUxpa2VUb0FycmF5IiwidG9TdHJpbmciLCJBcnJheSIsImZyb20iLCJ0ZXN0IiwiaXRlciIsImlzQXJyYXkiLCJsZW4iLCJhcnIyIiwiYXN5bmNHZW5lcmF0b3JTdGVwIiwiZ2VuIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJpbmZvIiwiZXJyb3IiLCJfYXN5bmNUb0dlbmVyYXRvciIsImZuIiwic2VsZiIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsImVyciIsInVuZGVmaW5lZCIsImFzc2VydCIsInJlcXVpcmUiLCJnbG9iYWwiLCJwcm9jZXNzRXZlbnRPcHRPdXQiLCJwcm9jZXNzIiwib24iLCJ1cCIsImNvbnNvbGUiLCJsb2ciLCJleGl0IiwiVHJhbnNwaWxlciIsInRyYW5zcGlsZXIiLCJzaWxlbnQiLCJtb2R1bGUiLCJleHBvcnRzIiwiZ3J1bnQiLCJwYWNrYWdlT2JqZWN0IiwiZmlsZSIsInJlYWRKU09OIiwiYnVpbGRMb2NhbCIsImNvbmNhdCIsImVudiIsIkhPTUUiLCJyZXBvIiwib3B0aW9uIiwiX3giLCJfd3JhcCIsIl9jYWxsZWUyOSIsInByb21pc2UiLCJfY2FsbGVlMjkkIiwiX2NvbnRleHQzMCIsInRhc2siLCJjdXJyZW50IiwidDAiLCJzdGFjayIsImZhaWwiLCJmYXRhbCIsIkpTT04iLCJzdHJpbmdpZnkiLCJ3cmFwVGFzayIsImFzeW5jVGFza0Z1bmN0aW9uIiwicmVnaXN0ZXJUYXNrIiwiX2NhbGxlZSIsImJ1aWxkRGlyZWN0b3J5IiwiX2NhbGxlZSQiLCJfY29udGV4dCIsImV4aXN0cyIsIm1rZGlyIiwiX2NhbGxlZTIiLCJqaW1wIiwiZ2VuZXJhdGVUaHVtYm5haWxzIiwiZ2VuZXJhdGVUd2l0dGVyQ2FyZCIsImJyYW5kIiwiYnVpbGREaXIiLCJ0aHVtYm5haWxTaXplcyIsIl9pIiwiX3RodW1ibmFpbFNpemVzIiwic2l6ZSIsImFsdFNjcmVlbnNob3RzIiwiX2l0ZXJhdG9yIiwiX3N0ZXAiLCJhbHRTY3JlZW5zaG90IiwiaW1hZ2VOdW1iZXIiLCJfY2FsbGVlMiQiLCJfY29udGV4dDIiLCJ3cml0ZWxuIiwid2lkdGgiLCJoZWlnaHQiLCJ0MSIsIk1JTUVfUE5HIiwidDIiLCJ3cml0ZSIsImV4cGFuZCIsImZpbHRlciIsImN3ZCIsIl9jcmVhdGVGb3JPZkl0ZXJhdG9ySGVscGVyIiwiTnVtYmVyIiwic3Vic3RyIiwidDMiLCJ0NCIsInQ1IiwidDYiLCJ0NyIsInQ4IiwidDkiLCJ0MTAiLCJ0MTEiLCJNSU1FX0pQRUciLCJ0MTIiLCJ0MTMiLCJ0MTQiLCJ0MTUiLCJfY2FsbGVlMyIsIl9jYWxsZWUzJCIsIl9jb250ZXh0MyIsInRyYW5zcGlsZVJlcG8iLCJfY2FsbGVlNCIsImdldFBoZXRMaWJzIiwiX2NhbGxlZTQkIiwiX2NvbnRleHQ0IiwidHJhbnNwaWxlUmVwb3MiLCJfY2FsbGVlNSIsIl9jYWxsZWU1JCIsIl9jb250ZXh0NSIsInRyYW5zcGlsZUFsbCIsIl9jYWxsZWU5IiwiYnVpbGRTdGFuZGFsb25lIiwiYnVpbGRSdW5uYWJsZSIsIm1pbmlmeSIsInRzYyIsInJlcG9ydFRzY1Jlc3VsdHMiLCJwYXRoIiwiZnMiLCJwaGV0VGltaW5nTG9nIiwiX2NhbGxlZTkkIiwiX2NvbnRleHQxMCIsInN0YXJ0QXN5bmMiLCJfY2FsbGVlOCIsIm1pbmlmeUtleXMiLCJtaW5pZnlPcHRpb25zIiwicmVwb1BhY2thZ2VPYmplY3QiLCJicmFuZHMiLCJwYXJlbnREaXIiLCJfaXRlcmF0b3IyIiwiX3N0ZXAyIiwibG9jYWxQYWNrYWdlT2JqZWN0IiwiYWxsSFRNTCIsImVuY29kZVN0cmluZ01hcCIsImNvbXByZXNzU2NyaXB0cyIsInByb2ZpbGVGaWxlU2l6ZSIsImxvY2FsZXNPcHRpb24iLCJfaXRlcmF0b3IzIiwiX3N0ZXAzIiwiX2xvb3AiLCJfY2FsbGVlOCQiLCJfY29udGV4dDkiLCJNSU5JRllfREVGQVVMVFMiLCJtaW5pZnlLZXkiLCJnZXRCcmFuZHMiLCJfY2FsbGVlNiIsInJlc3VsdHMiLCJfY2FsbGVlNiQiLCJfY29udGV4dDYiLCJpbmNsdWRlcyIsInBoZXQiLCJleGlzdHNTeW5jIiwibWtkaXJTeW5jIiwid3JpdGVGaWxlU3luYyIsImJhYmVsVHJhbnNwaWxlIiwidWdsaWZ5IiwiaXNEZWJ1ZyIsInN0YW5kYWxvbmVUcmFuc3BpbGVzIiwiYmFzZW5hbWUiLCJyZWFkIiwicnVubmFibGUiLCJqb2luIiwiX2xvb3AkIiwiX2NvbnRleHQ4IiwiX2NhbGxlZTciLCJfY2FsbGVlNyQiLCJfY29udGV4dDciLCJfY2FsbGVlMTAiLCJ3ZWJwYWNrQnVpbGQiLCJDaGlwcGVyQ29uc3RhbnRzIiwiZ2V0TG9jYWxlc0Zyb21SZXBvc2l0b3J5IiwiZ2V0U3RyaW5nTWFwIiwid2VicGFja1Jlc3VsdCIsInBoZXRMaWJzIiwiYWxsTG9jYWxlcyIsIl9nZXRTdHJpbmdNYXAiLCJzdHJpbmdNYXAiLCJfY2FsbGVlMTAkIiwiX2NvbnRleHQxMSIsIkZBTExCQUNLX0xPQ0FMRSIsInVzZWRNb2R1bGVzIiwiZW4iLCJfY2FsbGVlMTEiLCJsaW50IiwiY2FjaGUiLCJmaXgiLCJjaGlwQXdheSIsImV4dHJhUmVwb3MiLCJsaW50UmV0dXJuVmFsdWUiLCJfY2FsbGVlMTEkIiwiX2NvbnRleHQxMiIsInNwbGl0Iiwib2siLCJfY2FsbGVlMTIiLCJfY2FsbGVlMTIkIiwiX2NvbnRleHQxMyIsIl9jYWxsZWUxMyIsImdlbmVyYXRlRGV2ZWxvcG1lbnRIVE1MIiwiX2NhbGxlZTEzJCIsIl9jb250ZXh0MTQiLCJfY2FsbGVlMTQiLCJnZW5lcmF0ZVRlc3RIVE1MIiwiX2NhbGxlZTE0JCIsIl9jb250ZXh0MTUiLCJfY2FsbGVlMTUiLCJnZW5lcmF0ZUExMXlWaWV3SFRNTCIsIl9jYWxsZWUxNSQiLCJfY29udGV4dDE2IiwiX2NhbGxlZTE2IiwiZ2VuZXJhdGVSRUFETUUiLCJfIiwib3ZlcnJpZGVzRmlsZSIsIndyaXRlRmlsZUFuZEdpdEFkZCIsIm92ZXJyaWRlc0NvbnRlbnQiLCJzaW1TcGVjaWZpY1dyYXBwZXJzIiwiX2NhbGxlZTE2JCIsIl9jb250ZXh0MTciLCJydW4iLCJzaW11bGF0aW9uIiwicmVhZG1lQ3JlYXRlZE1hbnVhbGx5IiwicHVibGlzaGVkIiwic3VwcG9ydGVkQnJhbmRzIiwicmVhZGRpclN5bmMiLCJ3aXRoRmlsZVR5cGVzIiwiZGlyZW50IiwiaXNEaXJlY3RvcnkiLCJtYXAiLCJ3cmFwcGVycyIsInVuaXEiLCJtZXNzYWdlIiwic2ltRmVhdHVyZXMiLCJzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb24iLCJnZW5lcmF0ZWRVbml0VGVzdHMiLCJfY2FsbGVlMTciLCJnZW5lcmF0ZURldmVsb3BtZW50U3RyaW5ncyIsIl9jYWxsZWUxNyQiLCJfY29udGV4dDE4IiwiX2NhbGxlZTE4IiwiX2NhbGxlZTE4JCIsIl9jb250ZXh0MTkiLCJfY2FsbGVlMTkiLCJfY2FsbGVlMTkkIiwiX2NvbnRleHQyMCIsIl9jYWxsZWUyMCIsInNvcnRJbXBvcnRzIiwiX2NhbGxlZTIwJCIsIl9jb250ZXh0MjEiLCJyZWN1cnNlIiwiYWJzZmlsZSIsIl9jYWxsZWUyMSIsImRhdGVTdHJpbmciLCJjb21taXRzU2luY2UiLCJfY2FsbGVlMjEkIiwiX2NvbnRleHQyMiIsIl9jYWxsZWUyMiIsInJlcG9ydE1lZGlhIiwiX2NhbGxlZTIyJCIsIl9jb250ZXh0MjMiLCJfY2FsbGVlMjMiLCJyZXBvcnRUaGlyZFBhcnR5IiwiX2NhbGxlZTIzJCIsIl9jb250ZXh0MjQiLCJfY2FsbGVlMjQiLCJtb2R1bGlmeSIsIl9jYWxsZWUyNCQiLCJfY29udGV4dDI1IiwiX2NhbGxlZTI1IiwidXBkYXRlQ29weXJpZ2h0RGF0ZXMiLCJfY2FsbGVlMjUkIiwiX2NvbnRleHQyNiIsInJlcG9zIiwicG9ydCIsImRldnRvb2wiLCJvcGVuQ2hyb21lIiwid2VicGFja0RldlNlcnZlciIsIl9jYWxsZWUyNiIsImZvcm1hdFBoZXRpb0FQSSIsImdldFNpbUxpc3QiLCJnZW5lcmF0ZVBoZXRpb01hY3JvQVBJIiwic2ltcyIsInNraXBUcmFuc3BpbGUiLCJzdGFydFRpbWUiLCJ0cmFuc3BpbGVUaW1lTVMiLCJfY2FsbGVlMjYkIiwiX2NvbnRleHQyNyIsIkRhdGUiLCJub3ciLCJzaG93UHJvZ3Jlc3NCYXIiLCJ0aHJvd0FQSUdlbmVyYXRpb25FcnJvcnMiLCJzaW0iLCJkaXIiLCJmaWxlUGF0aCIsImFwaSIsIl9jYWxsZWUyNyIsInRlbXBvcmFyeSIsInByb3Bvc2VkQVBJcyIsIm9wdGlvbnMiLCJfY2FsbGVlMjckIiwiX2NvbnRleHQyOCIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwic2hvd01lc3NhZ2VzRnJvbVNpbSIsImRlbHRhIiwiY29tcGFyZUJyZWFraW5nQVBJQ2hhbmdlcyIsIl9jYWxsZWUyOCIsIl9jYWxsZWUyOCQiLCJfY29udGV4dDI5IiwiZm9yd2FyZFRvUGVyZW5uaWFsR3J1bnQiLCJjaGlsZF9wcm9jZXNzIiwiYXJndiIsImFyZ3NTdHJpbmciLCJzcGF3bmVkIiwic3Bhd24iLCJwbGF0Zm9ybSIsImRlYnVnIiwic3RkZXJyIiwiZGF0YSIsInN0ZG91dCIsInN0ZGluIiwicGlwZSIsImNvZGUiXSwic291cmNlcyI6WyJHcnVudGZpbGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogR3J1bnQgY29uZmlndXJhdGlvbiBmaWxlIGZvciBQaEVUIHByb2plY3RzLiBJbiBnZW5lcmFsIHdoZW4gcG9zc2libGUsIG1vZHVsZXMgYXJlIGltcG9ydGVkIGxhemlseSBpbiB0aGVpciB0YXNrXHJcbiAqIGRlY2xhcmF0aW9uIHRvIHNhdmUgb24gb3ZlcmFsbCBsb2FkIHRpbWUgb2YgdGhpcyBmaWxlLiBUaGUgcGF0dGVybiBpcyB0byByZXF1aXJlIGFsbCBtb2R1bGVzIG5lZWRlZCBhdCB0aGUgdG9wIG9mIHRoZVxyXG4gKiBncnVudCB0YXNrIHJlZ2lzdHJhdGlvbi4gSWYgYSBtb2R1bGUgaXMgdXNlZCBpbiBtdWx0aXBsZSB0YXNrcywgaXQgaXMgYmVzdCB0byBsYXppbHkgcmVxdWlyZSBpbiBlYWNoXHJcbiAqIHRhc2suXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gTk9URTogdG8gaW1wcm92ZSBwZXJmb3JtYW5jZSwgdGhlIHZhc3QgbWFqb3JpdHkgb2YgbW9kdWxlcyBhcmUgbGF6aWx5IGltcG9ydGVkIGluIHRhc2sgcmVnaXN0cmF0aW9ucy4gRXZlbiBkdXBsaWNhdGluZ1xyXG4vLyByZXF1aXJlIHN0YXRlbWVudHMgaW1wcm92ZXMgdGhlIGxvYWQgdGltZSBvZiB0aGlzIGZpbGUgbm90aWNlYWJseS4gRm9yIGRldGFpbHMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvMTEwN1xyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5yZXF1aXJlKCAnLi9jaGVja05vZGVWZXJzaW9uJyApO1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbi8vIEFsbG93IG90aGVyIEdydW50ZmlsZXMgdG8gcG90ZW50aWFsbHkgaGFuZGxlIGV4aXRpbmcgYW5kIGVycm9ycyBkaWZmZXJlbnRseWBcclxuaWYgKCAhZ2xvYmFsLnByb2Nlc3NFdmVudE9wdE91dCApIHtcclxuXHJcbi8vIFNlZSBodHRwczovL21lZGl1bS5jb20vQGR0aW50aC9tYWtpbmctdW5oYW5kbGVkLXByb21pc2UtcmVqZWN0aW9ucy1jcmFzaC10aGUtbm9kZS1qcy1wcm9jZXNzLWZmYzI3Y2ZjYzlkZCBmb3IgaG93XHJcbi8vIHRvIGdldCB1bmhhbmRsZWQgcHJvbWlzZSByZWplY3Rpb25zIHRvIGZhaWwgb3V0IHRoZSBub2RlIHByb2Nlc3MuXHJcbi8vIFJlbGV2YW50IGZvciBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvd2F2ZS1pbnRlcmZlcmVuY2UvaXNzdWVzLzQ5MVxyXG4gIHByb2Nlc3Mub24oICd1bmhhbmRsZWRSZWplY3Rpb24nLCB1cCA9PiB7IHRocm93IHVwOyB9ICk7XHJcblxyXG4vLyBFeGl0IG9uIEN0cmwgKyBDIGNhc2VcclxuICBwcm9jZXNzLm9uKCAnU0lHSU5UJywgKCkgPT4ge1xyXG4gICAgY29uc29sZS5sb2coICdcXG5cXG5DYXVnaHQgaW50ZXJydXB0IHNpZ25hbCwgZXhpdGluZycgKTtcclxuICAgIHByb2Nlc3MuZXhpdCgpO1xyXG4gIH0gKTtcclxufVxyXG5cclxuY29uc3QgVHJhbnNwaWxlciA9IHJlcXVpcmUoICcuLi9jb21tb24vVHJhbnNwaWxlcicgKTtcclxuY29uc3QgdHJhbnNwaWxlciA9IG5ldyBUcmFuc3BpbGVyKCB7IHNpbGVudDogdHJ1ZSB9ICk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBncnVudCApIHtcclxuICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggJ3BhY2thZ2UuanNvbicgKTtcclxuXHJcbiAgLy8gSGFuZGxlIHRoZSBsYWNrIG9mIGJ1aWxkLmpzb25cclxuICBsZXQgYnVpbGRMb2NhbDtcclxuICB0cnkge1xyXG4gICAgYnVpbGRMb2NhbCA9IGdydW50LmZpbGUucmVhZEpTT04oIGAke3Byb2Nlc3MuZW52LkhPTUV9Ly5waGV0L2J1aWxkLWxvY2FsLmpzb25gICk7XHJcbiAgfVxyXG4gIGNhdGNoKCBlICkge1xyXG4gICAgYnVpbGRMb2NhbCA9IHt9O1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcmVwbyA9IGdydW50Lm9wdGlvbiggJ3JlcG8nICkgfHwgcGFja2FnZU9iamVjdC5uYW1lO1xyXG4gIGFzc2VydCggdHlwZW9mIHJlcG8gPT09ICdzdHJpbmcnICYmIC9eW2Etel0rKC1bYS16XSspKiQvdS50ZXN0KCByZXBvICksICdyZXBvIG5hbWUgc2hvdWxkIGJlIGNvbXBvc2VkIG9mIGxvd2VyLWNhc2UgY2hhcmFjdGVycywgb3B0aW9uYWxseSB3aXRoIGRhc2hlcyB1c2VkIGFzIHNlcGFyYXRvcnMnICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFdyYXBzIGEgcHJvbWlzZSdzIGNvbXBsZXRpb24gd2l0aCBncnVudCdzIGFzeW5jaHJvbm91cyBoYW5kbGluZywgd2l0aCBhZGRlZCBoZWxwZnVsIGZhaWx1cmUgbWVzc2FnZXMgKGluY2x1ZGluZ1xyXG4gICAqIHN0YWNrIHRyYWNlcywgcmVnYXJkbGVzcyBvZiB3aGV0aGVyIC0tc3RhY2sgd2FzIHByb3ZpZGVkKS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1Byb21pc2V9IHByb21pc2VcclxuICAgKi9cclxuICBhc3luYyBmdW5jdGlvbiB3cmFwKCBwcm9taXNlICkge1xyXG4gICAgY29uc3QgZG9uZSA9IGdydW50LnRhc2suY3VycmVudC5hc3luYygpO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IHByb21pc2U7XHJcbiAgICB9XHJcbiAgICBjYXRjaCggZSApIHtcclxuICAgICAgaWYgKCBlLnN0YWNrICkge1xyXG4gICAgICAgIGdydW50LmZhaWwuZmF0YWwoIGBQZXJlbm5pYWwgdGFzayBmYWlsZWQ6XFxuJHtlLnN0YWNrfVxcbkZ1bGwgRXJyb3IgZGV0YWlsczpcXG4ke2V9YCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRoZSB0b1N0cmluZyBjaGVjayBoYW5kbGVzIGEgd2VpcmQgY2FzZSBmb3VuZCBmcm9tIGFuIEVycm9yIG9iamVjdCBmcm9tIHB1cHBldGVlciB0aGF0IGRvZXNuJ3Qgc3RyaW5naWZ5IHdpdGhcclxuICAgICAgLy8gSlNPTiBvciBoYXZlIGEgc3RhY2ssIEpTT04uc3RyaW5naWZpZXMgdG8gXCJ7fVwiLCBidXQgaGFzIGEgYHRvU3RyaW5nYCBtZXRob2RcclxuICAgICAgZWxzZSBpZiAoIHR5cGVvZiBlID09PSAnc3RyaW5nJyB8fCAoIEpTT04uc3RyaW5naWZ5KCBlICkubGVuZ3RoID09PSAyICYmIGUudG9TdHJpbmcgKSApIHtcclxuICAgICAgICBncnVudC5mYWlsLmZhdGFsKCBgUGVyZW5uaWFsIHRhc2sgZmFpbGVkOiAke2V9YCApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGdydW50LmZhaWwuZmF0YWwoIGBQZXJlbm5pYWwgdGFzayBmYWlsZWQgd2l0aCB1bmtub3duIGVycm9yOiAke0pTT04uc3RyaW5naWZ5KCBlLCBudWxsLCAyICl9YCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZG9uZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV3JhcHMgYW4gYXN5bmMgZnVuY3Rpb24gZm9yIGEgZ3J1bnQgdGFzay4gV2lsbCBydW4gdGhlIGFzeW5jIGZ1bmN0aW9uIHdoZW4gdGhlIHRhc2sgc2hvdWxkIGJlIGV4ZWN1dGVkLiBXaWxsXHJcbiAgICogcHJvcGVybHkgaGFuZGxlIGdydW50J3MgYXN5bmMgaGFuZGxpbmcsIGFuZCBwcm92aWRlcyBpbXByb3ZlZCBlcnJvciByZXBvcnRpbmcuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHthc3luYyBmdW5jdGlvbn0gYXN5bmNUYXNrRnVuY3Rpb25cclxuICAgKi9cclxuICBmdW5jdGlvbiB3cmFwVGFzayggYXN5bmNUYXNrRnVuY3Rpb24gKSB7XHJcbiAgICByZXR1cm4gKCkgPT4ge1xyXG4gICAgICB3cmFwKCBhc3luY1Rhc2tGdW5jdGlvbigpICk7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnZGVmYXVsdCcsICdCdWlsZHMgdGhlIHJlcG9zaXRvcnknLCBbXHJcbiAgICAuLi4oIGdydW50Lm9wdGlvbiggJ2xpbnQnICkgPT09IGZhbHNlID8gW10gOiBbICdsaW50LWFsbCcgXSApLFxyXG4gICAgLi4uKCBncnVudC5vcHRpb24oICdyZXBvcnQtbWVkaWEnICkgPT09IGZhbHNlID8gW10gOiBbICdyZXBvcnQtbWVkaWEnIF0gKSxcclxuICAgICdjbGVhbicsXHJcbiAgICAnYnVpbGQnXHJcbiAgXSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdjbGVhbicsXHJcbiAgICAnRXJhc2VzIHRoZSBidWlsZC8gZGlyZWN0b3J5IGFuZCBhbGwgaXRzIGNvbnRlbnRzLCBhbmQgcmVjcmVhdGVzIHRoZSBidWlsZC8gZGlyZWN0b3J5JyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGJ1aWxkRGlyZWN0b3J5ID0gYC4uLyR7cmVwb30vYnVpbGRgO1xyXG4gICAgICBpZiAoIGdydW50LmZpbGUuZXhpc3RzKCBidWlsZERpcmVjdG9yeSApICkge1xyXG4gICAgICAgIGdydW50LmZpbGUuZGVsZXRlKCBidWlsZERpcmVjdG9yeSApO1xyXG4gICAgICB9XHJcbiAgICAgIGdydW50LmZpbGUubWtkaXIoIGJ1aWxkRGlyZWN0b3J5ICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnYnVpbGQtaW1hZ2VzJyxcclxuICAgICdCdWlsZCBpbWFnZXMgb25seScsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBqaW1wID0gcmVxdWlyZSggJ2ppbXAnICk7XHJcbiAgICAgIGNvbnN0IGdlbmVyYXRlVGh1bWJuYWlscyA9IHJlcXVpcmUoICcuL2dlbmVyYXRlVGh1bWJuYWlscycgKTtcclxuICAgICAgY29uc3QgZ2VuZXJhdGVUd2l0dGVyQ2FyZCA9IHJlcXVpcmUoICcuL2dlbmVyYXRlVHdpdHRlckNhcmQnICk7XHJcblxyXG4gICAgICBjb25zdCBicmFuZCA9ICdwaGV0JztcclxuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oIGBCdWlsZGluZyBpbWFnZXMgZm9yIGJyYW5kOiAke2JyYW5kfWAgKTtcclxuXHJcbiAgICAgIGNvbnN0IGJ1aWxkRGlyID0gYC4uLyR7cmVwb30vYnVpbGQvJHticmFuZH1gO1xyXG4gICAgICAvLyBUaHVtYm5haWxzIGFuZCB0d2l0dGVyIGNhcmRcclxuICAgICAgaWYgKCBncnVudC5maWxlLmV4aXN0cyggYC4uLyR7cmVwb30vYXNzZXRzLyR7cmVwb30tc2NyZWVuc2hvdC5wbmdgICkgKSB7XHJcbiAgICAgICAgY29uc3QgdGh1bWJuYWlsU2l6ZXMgPSBbXHJcbiAgICAgICAgICB7IHdpZHRoOiA5MDAsIGhlaWdodDogNTkxIH0sXHJcbiAgICAgICAgICB7IHdpZHRoOiA2MDAsIGhlaWdodDogMzk0IH0sXHJcbiAgICAgICAgICB7IHdpZHRoOiA0MjAsIGhlaWdodDogMjc2IH0sXHJcbiAgICAgICAgICB7IHdpZHRoOiAxMjgsIGhlaWdodDogODQgfSxcclxuICAgICAgICAgIHsgd2lkdGg6IDE1LCBoZWlnaHQ6IDEwIH1cclxuICAgICAgICBdO1xyXG4gICAgICAgIGZvciAoIGNvbnN0IHNpemUgb2YgdGh1bWJuYWlsU2l6ZXMgKSB7XHJcbiAgICAgICAgICBncnVudC5maWxlLndyaXRlKCBgJHtidWlsZERpcn0vJHtyZXBvfS0ke3NpemUud2lkdGh9LnBuZ2AsIGF3YWl0IGdlbmVyYXRlVGh1bWJuYWlscyggcmVwbywgc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHQsIDEwMCwgamltcC5NSU1FX1BORyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBhbHRTY3JlZW5zaG90cyA9IGdydW50LmZpbGUuZXhwYW5kKCB7IGZpbHRlcjogJ2lzRmlsZScsIGN3ZDogYC4uLyR7cmVwb30vYXNzZXRzYCB9LCBbIGAuLyR7cmVwb30tc2NyZWVuc2hvdC1hbHRbMDEyMzQ1Njc4OV0ucG5nYCBdICk7XHJcbiAgICAgICAgZm9yICggY29uc3QgYWx0U2NyZWVuc2hvdCBvZiBhbHRTY3JlZW5zaG90cyApIHtcclxuICAgICAgICAgIGNvbnN0IGltYWdlTnVtYmVyID0gTnVtYmVyKCBhbHRTY3JlZW5zaG90LnN1YnN0ciggYC4vJHtyZXBvfS1zY3JlZW5zaG90LWFsdGAubGVuZ3RoLCAxICkgKTtcclxuICAgICAgICAgIGdydW50LmZpbGUud3JpdGUoIGAke2J1aWxkRGlyfS8ke3JlcG99LSR7NjAwfS1hbHQke2ltYWdlTnVtYmVyfS5wbmdgLCBhd2FpdCBnZW5lcmF0ZVRodW1ibmFpbHMoIHJlcG8sIDYwMCwgMzk0LCAxMDAsIGppbXAuTUlNRV9QTkcsIGAtYWx0JHtpbWFnZU51bWJlcn1gICkgKTtcclxuICAgICAgICAgIGdydW50LmZpbGUud3JpdGUoIGAke2J1aWxkRGlyfS8ke3JlcG99LSR7OTAwfS1hbHQke2ltYWdlTnVtYmVyfS5wbmdgLCBhd2FpdCBnZW5lcmF0ZVRodW1ibmFpbHMoIHJlcG8sIDkwMCwgNTkxLCAxMDAsIGppbXAuTUlNRV9QTkcsIGAtYWx0JHtpbWFnZU51bWJlcn1gICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggYnJhbmQgPT09ICdwaGV0JyApIHtcclxuICAgICAgICAgIGdydW50LmZpbGUud3JpdGUoIGAke2J1aWxkRGlyfS8ke3JlcG99LWlvcy5wbmdgLCBhd2FpdCBnZW5lcmF0ZVRodW1ibmFpbHMoIHJlcG8sIDQyMCwgMjc2LCA5MCwgamltcC5NSU1FX0pQRUcgKSApO1xyXG4gICAgICAgICAgZ3J1bnQuZmlsZS53cml0ZSggYCR7YnVpbGREaXJ9LyR7cmVwb30tdHdpdHRlci1jYXJkLnBuZ2AsIGF3YWl0IGdlbmVyYXRlVHdpdHRlckNhcmQoIHJlcG8gKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ291dHB1dC1qcycsICdPdXRwdXRzIEpTIGp1c3QgZm9yIHRoZSBzcGVjaWZpZWQgcmVwbycsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICB0cmFuc3BpbGVyLnRyYW5zcGlsZVJlcG8oIHJlcG8gKTtcclxuICAgIH0gKVxyXG4gICk7XHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnb3V0cHV0LWpzLXByb2plY3QnLCAnT3V0cHV0cyBKUyBmb3IgdGhlIHNwZWNpZmllZCByZXBvIGFuZCBpdHMgZGVwZW5kZW5jaWVzJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGdldFBoZXRMaWJzID0gcmVxdWlyZSggJy4vZ2V0UGhldExpYnMnICk7XHJcblxyXG4gICAgICB0cmFuc3BpbGVyLnRyYW5zcGlsZVJlcG9zKCBnZXRQaGV0TGlicyggcmVwbyApICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdvdXRwdXQtanMtYWxsJywgJ091dHB1dHMgSlMgZm9yIGFsbCByZXBvcycsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICB0cmFuc3BpbGVyLnRyYW5zcGlsZUFsbCgpO1xyXG4gICAgfSApXHJcbiAgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnYnVpbGQnLFxyXG4gICAgYEJ1aWxkcyB0aGUgcmVwb3NpdG9yeS4gRGVwZW5kaW5nIG9uIHRoZSByZXBvc2l0b3J5IHR5cGUgKHJ1bm5hYmxlL3dyYXBwZXIvc3RhbmRhbG9uZSksIHRoZSByZXN1bHQgbWF5IHZhcnkuXHJcblJ1bm5hYmxlIGJ1aWxkIG9wdGlvbnM6XHJcbiAtLXJlcG9ydC1tZWRpYSAtIFdpbGwgaXRlcmF0ZSBvdmVyIGFsbCBvZiB0aGUgbGljZW5zZS5qc29uIGZpbGVzIGFuZCByZXBvcnRzIGFueSBtZWRpYSBmaWxlcywgc2V0IHRvIGZhbHNlIHRvIG9wdCBvdXQuXHJcbiAtLWJyYW5kcz17e0JSQU5EU30gLSBDYW4gYmUgKiAoYnVpbGQgYWxsIHN1cHBvcnRlZCBicmFuZHMpLCBvciBhIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGJyYW5kIG5hbWVzLiBXaWxsIGZhbGwgYmFjayB0byB1c2luZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgYnVpbGQtbG9jYWwuanNvbidzIGJyYW5kcyAob3IgYWRhcHRlZC1mcm9tLXBoZXQgaWYgdGhhdCBkb2VzIG5vdCBleGlzdClcclxuIC0tYWxsSFRNTCAtIElmIHByb3ZpZGVkLCB3aWxsIGluY2x1ZGUgdGhlIF9hbGwuaHRtbCBmaWxlIChpZiBpdCB3b3VsZCBub3Qgb3RoZXJ3aXNlIGJlIGJ1aWx0LCBlLmcuIHBoZXQgYnJhbmQpXHJcbiAtLVhIVE1MIC0gSW5jbHVkZXMgYW4geGh0bWwvIGRpcmVjdG9yeSBpbiB0aGUgYnVpbGQgb3V0cHV0IHRoYXQgY29udGFpbnMgYSBydW5uYWJsZSBYSFRNTCBmb3JtIG9mIHRoZSBzaW0gKHdpdGhcclxuICAgICAgICAgICBhIHNlcGFyYXRlZC1vdXQgSlMgZmlsZSkuXHJcbiAtLWxvY2FsZXM9e3tMT0NBTEVTfX0gLSBDYW4gYmUgKiAoYnVpbGQgYWxsIGF2YWlsYWJsZSBsb2NhbGVzLCBcImVuXCIgYW5kIGV2ZXJ5dGhpbmcgaW4gYmFiZWwpLCBvciBhIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGxvY2FsZXNcclxuIC0tbm9UcmFuc3BpbGUgLSBGbGFnIHRvIG9wdCBvdXQgb2YgdHJhbnNwaWxpbmcgcmVwb3MgYmVmb3JlIGJ1aWxkLiBUaGlzIHNob3VsZCBvbmx5IGJlIHVzZWQgaWYgeW91IGFyZSBjb25maWRlbnQgdGhhdCBjaGlwcGVyL2Rpc3QgaXMgYWxyZWFkeSBjb3JyZWN0ICh0byBzYXZlIHRpbWUpLlxyXG4gLS1ub1RTQyAtIEZsYWcgdG8gb3B0IG91dCBvZiB0eXBlIGNoZWNraW5nIGJlZm9yZSBidWlsZC4gVGhpcyBzaG91bGQgb25seSBiZSB1c2VkIGlmIHlvdSBhcmUgY29uZmlkZW50IHRoYXQgVHlwZVNjcmlwdCBpcyBhbHJlYWR5IGVycm9ybGVzcyAodG8gc2F2ZSB0aW1lKS5cclxuIC0tZW5jb2RlU3RyaW5nTWFwPWZhbHNlIC0gRGlzYWJsZXMgdGhlIGVuY29kaW5nIG9mIHRoZSBzdHJpbmcgbWFwIGluIHRoZSBidWlsdCBmaWxlLiBUaGlzIGlzIHVzZWZ1bCBmb3IgZGVidWdnaW5nLlxyXG4gXHJcbk1pbmlmeS1zcGVjaWZpYyBvcHRpb25zOiBcclxuIC0tbWluaWZ5LmJhYmVsVHJhbnNwaWxlPWZhbHNlIC0gRGlzYWJsZXMgYmFiZWwgdHJhbnNwaWxhdGlvbiBwaGFzZS5cclxuIC0tbWluaWZ5LnVnbGlmeT1mYWxzZSAtIERpc2FibGVzIHVnbGlmaWNhdGlvbiwgc28gdGhlIGJ1aWx0IGZpbGUgd2lsbCBpbmNsdWRlIChlc3NlbnRpYWxseSkgY29uY2F0ZW5hdGVkIHNvdXJjZSBmaWxlcy5cclxuIC0tbWluaWZ5Lm1hbmdsZT1mYWxzZSAtIER1cmluZyB1Z2xpZmljYXRpb24sIGl0IHdpbGwgbm90IFwibWFuZ2xlXCIgdmFyaWFibGUgbmFtZXMgKHdoZXJlIHRoZXkgZ2V0IHJlbmFtZWQgdG8gc2hvcnQgY29uc3RhbnRzIHRvIHJlZHVjZSBmaWxlIHNpemUuKVxyXG4gLS1taW5pZnkuYmVhdXRpZnk9dHJ1ZSAtIEFmdGVyIHVnbGlmaWNhdGlvbiwgdGhlIHNvdXJjZSBjb2RlIHdpbGwgYmUgc3ludGF4IGZvcm1hdHRlZCBuaWNlbHlcclxuIC0tbWluaWZ5LnN0cmlwQXNzZXJ0aW9ucz1mYWxzZSAtIER1cmluZyB1Z2xpZmljYXRpb24sIGl0IHdpbGwgc3RyaXAgYXNzZXJ0aW9ucy5cclxuIC0tbWluaWZ5LnN0cmlwTG9nZ2luZz1mYWxzZSAtIER1cmluZyB1Z2xpZmljYXRpb24sIGl0IHdpbGwgbm90IHN0cmlwIGxvZ2dpbmcgc3RhdGVtZW50cy5cclxuIGAsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBidWlsZFN0YW5kYWxvbmUgPSByZXF1aXJlKCAnLi9idWlsZFN0YW5kYWxvbmUnICk7XHJcbiAgICAgIGNvbnN0IGJ1aWxkUnVubmFibGUgPSByZXF1aXJlKCAnLi9idWlsZFJ1bm5hYmxlJyApO1xyXG4gICAgICBjb25zdCBtaW5pZnkgPSByZXF1aXJlKCAnLi9taW5pZnknICk7XHJcbiAgICAgIGNvbnN0IHRzYyA9IHJlcXVpcmUoICcuL3RzYycgKTtcclxuICAgICAgY29uc3QgcmVwb3J0VHNjUmVzdWx0cyA9IHJlcXVpcmUoICcuL3JlcG9ydFRzY1Jlc3VsdHMnICk7XHJcbiAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcclxuICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbiAgICAgIGNvbnN0IGdldFBoZXRMaWJzID0gcmVxdWlyZSggJy4vZ2V0UGhldExpYnMnICk7XHJcbiAgICAgIGNvbnN0IHBoZXRUaW1pbmdMb2cgPSByZXF1aXJlKCAnLi4vLi4vLi4vcGVyZW5uaWFsLWFsaWFzL2pzL2NvbW1vbi9waGV0VGltaW5nTG9nJyApO1xyXG5cclxuICAgICAgYXdhaXQgcGhldFRpbWluZ0xvZy5zdGFydEFzeW5jKCAnZ3J1bnQtYnVpbGQnLCBhc3luYyAoKSA9PiB7XHJcblxyXG4gICAgICAgIC8vIFBhcnNlIG1pbmlmaWNhdGlvbiBrZXlzXHJcbiAgICAgICAgY29uc3QgbWluaWZ5S2V5cyA9IE9iamVjdC5rZXlzKCBtaW5pZnkuTUlOSUZZX0RFRkFVTFRTICk7XHJcbiAgICAgICAgY29uc3QgbWluaWZ5T3B0aW9ucyA9IHt9O1xyXG4gICAgICAgIG1pbmlmeUtleXMuZm9yRWFjaCggbWluaWZ5S2V5ID0+IHtcclxuICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IGdydW50Lm9wdGlvbiggYG1pbmlmeS4ke21pbmlmeUtleX1gICk7XHJcbiAgICAgICAgICBpZiAoIG9wdGlvbiA9PT0gdHJ1ZSB8fCBvcHRpb24gPT09IGZhbHNlICkge1xyXG4gICAgICAgICAgICBtaW5pZnlPcHRpb25zWyBtaW5pZnlLZXkgXSA9IG9wdGlvbjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlcG9QYWNrYWdlT2JqZWN0ID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCApO1xyXG5cclxuICAgICAgICAvLyBSdW4gdGhlIHR5cGUgY2hlY2tlciBmaXJzdC5cclxuICAgICAgICBjb25zdCBicmFuZHMgPSBnZXRCcmFuZHMoIGdydW50LCByZXBvLCBidWlsZExvY2FsICk7XHJcblxyXG4gICAgICAgICFncnVudC5vcHRpb24oICdub1RTQycgKSAmJiBhd2FpdCBwaGV0VGltaW5nTG9nLnN0YXJ0QXN5bmMoICd0c2MnLCBhc3luYyAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgLy8gV2UgbXVzdCBoYXZlIHBoZXQtaW8gY29kZSBjaGVja2VkIG91dCB0byB0eXBlIGNoZWNrLCBzaW5jZSBzaW1MYXVuY2hlciBpbXBvcnRzIHBoZXRpb0VuZ2luZVxyXG4gICAgICAgICAgaWYgKCBicmFuZHMuaW5jbHVkZXMoICdwaGV0LWlvJyApIHx8IGJyYW5kcy5pbmNsdWRlcyggJ3BoZXQnICkgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0c2MoIGAuLi8ke3JlcG99YCApO1xyXG4gICAgICAgICAgICByZXBvcnRUc2NSZXN1bHRzKCByZXN1bHRzLCBncnVudCApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGdydW50LmxvZy53cml0ZWxuKCAnc2tpcHBpbmcgdHlwZSBjaGVja2luZycgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgICFncnVudC5vcHRpb24oICdub1RyYW5zcGlsZScgKSAmJiBhd2FpdCBwaGV0VGltaW5nTG9nLnN0YXJ0QXN5bmMoICd0cmFuc3BpbGUnLCAoKSA9PiB7XHJcbiAgICAgICAgICAvLyBJZiB0aGF0IHN1Y2NlZWRzLCB0aGVuIGNvbnZlcnQgdGhlIGNvZGUgdG8gSlNcclxuICAgICAgICAgIHRyYW5zcGlsZXIudHJhbnNwaWxlUmVwb3MoIGdldFBoZXRMaWJzKCByZXBvICkgKTtcclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIC8vIHN0YW5kYWxvbmVcclxuICAgICAgICBpZiAoIHJlcG9QYWNrYWdlT2JqZWN0LnBoZXQuYnVpbGRTdGFuZGFsb25lICkge1xyXG4gICAgICAgICAgZ3J1bnQubG9nLndyaXRlbG4oICdCdWlsZGluZyBzdGFuZGFsb25lIHJlcG9zaXRvcnknICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgcGFyZW50RGlyID0gYC4uLyR7cmVwb30vYnVpbGQvYDtcclxuICAgICAgICAgIGlmICggIWZzLmV4aXN0c1N5bmMoIHBhcmVudERpciApICkge1xyXG4gICAgICAgICAgICBmcy5ta2RpclN5bmMoIHBhcmVudERpciApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoIGAke3BhcmVudERpcn0vJHtyZXBvfS5taW4uanNgLCBhd2FpdCBidWlsZFN0YW5kYWxvbmUoIHJlcG8sIG1pbmlmeU9wdGlvbnMgKSApO1xyXG5cclxuICAgICAgICAgIC8vIEJ1aWxkIGEgZGVidWcgdmVyc2lvblxyXG4gICAgICAgICAgbWluaWZ5T3B0aW9ucy5taW5pZnkgPSBmYWxzZTtcclxuICAgICAgICAgIG1pbmlmeU9wdGlvbnMuYmFiZWxUcmFuc3BpbGUgPSBmYWxzZTtcclxuICAgICAgICAgIG1pbmlmeU9wdGlvbnMudWdsaWZ5ID0gZmFsc2U7XHJcbiAgICAgICAgICBtaW5pZnlPcHRpb25zLmlzRGVidWcgPSB0cnVlO1xyXG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyggYCR7cGFyZW50RGlyfS8ke3JlcG99LmRlYnVnLmpzYCwgYXdhaXQgYnVpbGRTdGFuZGFsb25lKCByZXBvLCBtaW5pZnlPcHRpb25zLCB0cnVlICkgKTtcclxuXHJcbiAgICAgICAgICBpZiAoIHJlcG9QYWNrYWdlT2JqZWN0LnBoZXQuc3RhbmRhbG9uZVRyYW5zcGlsZXMgKSB7XHJcbiAgICAgICAgICAgIGZvciAoIGNvbnN0IGZpbGUgb2YgcmVwb1BhY2thZ2VPYmplY3QucGhldC5zdGFuZGFsb25lVHJhbnNwaWxlcyApIHtcclxuICAgICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKCBgLi4vJHtyZXBvfS9idWlsZC8ke3BhdGguYmFzZW5hbWUoIGZpbGUgKX1gLCBtaW5pZnkoIGdydW50LmZpbGUucmVhZCggZmlsZSApICkgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICBjb25zdCBsb2NhbFBhY2thZ2VPYmplY3QgPSBncnVudC5maWxlLnJlYWRKU09OKCBgLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gICk7XHJcbiAgICAgICAgICBhc3NlcnQoIGxvY2FsUGFja2FnZU9iamVjdC5waGV0LnJ1bm5hYmxlLCBgJHtyZXBvfSBkb2VzIG5vdCBhcHBlYXIgdG8gYmUgcnVubmFibGVgICk7XHJcbiAgICAgICAgICBncnVudC5sb2cud3JpdGVsbiggYEJ1aWxkaW5nIHJ1bm5hYmxlIHJlcG9zaXRvcnkgKCR7cmVwb30sIGJyYW5kczogJHticmFuZHMuam9pbiggJywgJyApfSlgICk7XHJcblxyXG4gICAgICAgICAgLy8gT3RoZXIgb3B0aW9uc1xyXG4gICAgICAgICAgY29uc3QgYWxsSFRNTCA9ICEhZ3J1bnQub3B0aW9uKCAnYWxsSFRNTCcgKTtcclxuICAgICAgICAgIGNvbnN0IGVuY29kZVN0cmluZ01hcCA9IGdydW50Lm9wdGlvbiggJ2VuY29kZVN0cmluZ01hcCcgKSAhPT0gZmFsc2U7XHJcbiAgICAgICAgICBjb25zdCBjb21wcmVzc1NjcmlwdHMgPSAhIWdydW50Lm9wdGlvbiggJ2NvbXByZXNzU2NyaXB0cycgKTtcclxuICAgICAgICAgIGNvbnN0IHByb2ZpbGVGaWxlU2l6ZSA9ICEhZ3J1bnQub3B0aW9uKCAncHJvZmlsZUZpbGVTaXplJyApO1xyXG4gICAgICAgICAgY29uc3QgbG9jYWxlc09wdGlvbiA9IGdydW50Lm9wdGlvbiggJ2xvY2FsZXMnICkgfHwgJ2VuJzsgLy8gRGVmYXVsdCBiYWNrIHRvIEVuZ2xpc2ggZm9yIG5vd1xyXG5cclxuICAgICAgICAgIGZvciAoIGNvbnN0IGJyYW5kIG9mIGJyYW5kcyApIHtcclxuICAgICAgICAgICAgZ3J1bnQubG9nLndyaXRlbG4oIGBCdWlsZGluZyBicmFuZDogJHticmFuZH1gICk7XHJcblxyXG4gICAgICAgICAgICBhd2FpdCBwaGV0VGltaW5nTG9nLnN0YXJ0QXN5bmMoICdidWlsZC1icmFuZC0nICsgYnJhbmQsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICBhd2FpdCBidWlsZFJ1bm5hYmxlKCByZXBvLCBtaW5pZnlPcHRpb25zLCBhbGxIVE1MLCBicmFuZCwgbG9jYWxlc09wdGlvbiwgYnVpbGRMb2NhbCwgZW5jb2RlU3RyaW5nTWFwLCBjb21wcmVzc1NjcmlwdHMsIHByb2ZpbGVGaWxlU2l6ZSApO1xyXG4gICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdnZW5lcmF0ZS11c2VkLXN0cmluZ3MtZmlsZScsXHJcbiAgICAnV3JpdGVzIHVzZWQgc3RyaW5ncyB0byBwaGV0LWlvLXNpbS1zcGVjaWZpYy8gc28gdGhhdCBQaEVULWlPIHNpbXMgb25seSBvdXRwdXQgcmVsZXZhbnQgc3RyaW5ncyB0byB0aGUgQVBJIGluIHVuYnVpbHQgbW9kZScsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZXRQaGV0TGlicyA9IHJlcXVpcmUoICcuL2dldFBoZXRMaWJzJyApO1xyXG4gICAgICBjb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuICAgICAgY29uc3Qgd2VicGFja0J1aWxkID0gcmVxdWlyZSggJy4vd2VicGFja0J1aWxkJyApO1xyXG4gICAgICBjb25zdCBDaGlwcGVyQ29uc3RhbnRzID0gcmVxdWlyZSggJy4uL2NvbW1vbi9DaGlwcGVyQ29uc3RhbnRzJyApO1xyXG4gICAgICBjb25zdCBnZXRMb2NhbGVzRnJvbVJlcG9zaXRvcnkgPSByZXF1aXJlKCAnLi9nZXRMb2NhbGVzRnJvbVJlcG9zaXRvcnknICk7XHJcbiAgICAgIGNvbnN0IGdldFN0cmluZ01hcCA9IHJlcXVpcmUoICcuL2dldFN0cmluZ01hcCcgKTtcclxuXHJcbiAgICAgIHRyYW5zcGlsZXIudHJhbnNwaWxlUmVwb3MoIGdldFBoZXRMaWJzKCByZXBvICkgKTtcclxuICAgICAgY29uc3Qgd2VicGFja1Jlc3VsdCA9IGF3YWl0IHdlYnBhY2tCdWlsZCggcmVwbywgJ3BoZXQnICk7XHJcblxyXG4gICAgICBjb25zdCBwaGV0TGlicyA9IGdldFBoZXRMaWJzKCByZXBvLCAncGhldCcgKTtcclxuICAgICAgY29uc3QgYWxsTG9jYWxlcyA9IFsgQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUsIC4uLmdldExvY2FsZXNGcm9tUmVwb3NpdG9yeSggcmVwbyApIF07XHJcbiAgICAgIGNvbnN0IHsgc3RyaW5nTWFwIH0gPSBnZXRTdHJpbmdNYXAoIHJlcG8sIGFsbExvY2FsZXMsIHBoZXRMaWJzLCB3ZWJwYWNrUmVzdWx0LnVzZWRNb2R1bGVzICk7XHJcblxyXG4gICAgICAvLyBUT0RPOiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTg3NyBUaGlzIGlzIG9ubHkgcGVydGluZW50IGZvciBwaGV0LWlvLCBzbyBJJ20gb3V0cHV0dGluZ1xyXG4gICAgICAvLyBpdCB0byBwaGV0LWlvLXNpbS1zcGVjaWZpYy4gIEJ1dCBub25lIG9mIGludHJpbnNpYyBkYXRhIGlzIHBoZXQtaW8tc3BlY2lmaWMuXHJcbiAgICAgIC8vIERvIHdlIHdhbnQgYSBkaWZmZXJlbnQgcGF0aCBmb3IgaXQ/XHJcbiAgICAgIC8vIFRPRE86IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xODc3IEhvdyBkbyB3ZSBpbmRpY2F0ZSB0aGF0IGl0IGlzIGEgYnVpbGQgYXJ0aWZhY3QsIGFuZFxyXG4gICAgICAvLyBzaG91bGQgbm90IGJlIG1hbnVhbGx5IHVwZGF0ZWQ/XHJcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoIGAuLi9waGV0LWlvLXNpbS1zcGVjaWZpYy9yZXBvcy8ke3JlcG99L3VzZWQtc3RyaW5nc19lbi5qc29uYCwgSlNPTi5zdHJpbmdpZnkoIHN0cmluZ01hcC5lbiwgbnVsbCwgMiApICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdidWlsZC1mb3Itc2VydmVyJywgJ21lYW50IGZvciB1c2UgYnkgYnVpbGQtc2VydmVyIG9ubHknLFxyXG4gICAgWyAnYnVpbGQnIF1cclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdsaW50JyxcclxuICAgIGBsaW50IGpzIGZpbGVzLiBPcHRpb25zOlxyXG4tLWRpc2FibGUtZXNsaW50LWNhY2hlOiBjYWNoZSB3aWxsIG5vdCBiZSByZWFkIGZyb20sIGFuZCBjYWNoZSB3aWxsIGJlIGNsZWFyZWQgZm9yIG5leHQgcnVuLlxyXG4tLWZpeDogYXV0b2ZpeGFibGUgY2hhbmdlcyB3aWxsIGJlIHdyaXR0ZW4gdG8gZGlza1xyXG4tLWNoaXAtYXdheTogb3V0cHV0IGEgbGlzdCBvZiByZXNwb25zaWJsZSBkZXZzIGZvciBlYWNoIHJlcG8gd2l0aCBsaW50IHByb2JsZW1zXHJcbi0tcmVwb3M6IGNvbW1hIHNlcGFyYXRlZCBsaXN0IG9mIHJlcG9zIHRvIGxpbnQgaW4gYWRkaXRpb24gdG8gdGhlIHJlcG8gZnJvbSBydW5uaW5nYCxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGxpbnQgPSByZXF1aXJlKCAnLi9saW50JyApO1xyXG5cclxuICAgICAgLy8gLS1kaXNhYmxlLWVzbGludC1jYWNoZSBkaXNhYmxlcyB0aGUgY2FjaGUsIHVzZWZ1bCBmb3IgZGV2ZWxvcGluZyBydWxlc1xyXG4gICAgICBjb25zdCBjYWNoZSA9ICFncnVudC5vcHRpb24oICdkaXNhYmxlLWVzbGludC1jYWNoZScgKTtcclxuICAgICAgY29uc3QgZml4ID0gZ3J1bnQub3B0aW9uKCAnZml4JyApO1xyXG4gICAgICBjb25zdCBjaGlwQXdheSA9IGdydW50Lm9wdGlvbiggJ2NoaXAtYXdheScgKTtcclxuXHJcbiAgICAgIGNvbnN0IGV4dHJhUmVwb3MgPSBncnVudC5vcHRpb24oICdyZXBvcycgKSA/IGdydW50Lm9wdGlvbiggJ3JlcG9zJyApLnNwbGl0KCAnLCcgKSA6IFtdO1xyXG5cclxuICAgICAgY29uc3QgbGludFJldHVyblZhbHVlID0gYXdhaXQgbGludCggWyByZXBvLCAuLi5leHRyYVJlcG9zIF0sIHtcclxuICAgICAgICBjYWNoZTogY2FjaGUsXHJcbiAgICAgICAgZml4OiBmaXgsXHJcbiAgICAgICAgY2hpcEF3YXk6IGNoaXBBd2F5XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGlmICggIWxpbnRSZXR1cm5WYWx1ZS5vayApIHtcclxuICAgICAgICBncnVudC5mYWlsLmZhdGFsKCAnTGludCBmYWlsZWQnICk7XHJcbiAgICAgIH1cclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdsaW50LWFsbCcsICdsaW50IGFsbCBqcyBmaWxlcyB0aGF0IGFyZSByZXF1aXJlZCB0byBidWlsZCB0aGlzIHJlcG9zaXRvcnkgKGZvciB0aGUgc3BlY2lmaWVkIGJyYW5kcyknLCB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgY29uc3QgbGludCA9IHJlcXVpcmUoICcuL2xpbnQnICk7XHJcblxyXG4gICAgLy8gLS1kaXNhYmxlLWVzbGludC1jYWNoZSBkaXNhYmxlcyB0aGUgY2FjaGUsIHVzZWZ1bCBmb3IgZGV2ZWxvcGluZyBydWxlc1xyXG4gICAgY29uc3QgY2FjaGUgPSAhZ3J1bnQub3B0aW9uKCAnZGlzYWJsZS1lc2xpbnQtY2FjaGUnICk7XHJcbiAgICBjb25zdCBmaXggPSBncnVudC5vcHRpb24oICdmaXgnICk7XHJcbiAgICBjb25zdCBjaGlwQXdheSA9IGdydW50Lm9wdGlvbiggJ2NoaXAtYXdheScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFncnVudC5vcHRpb24oICdwYXR0ZXJucycgKSwgJ3BhdHRlcm5zIG5vdCBzdXBwb3J0IGZvciBsaW50LWFsbCcgKTtcclxuXHJcbiAgICBjb25zdCBnZXRQaGV0TGlicyA9IHJlcXVpcmUoICcuL2dldFBoZXRMaWJzJyApO1xyXG5cclxuICAgIGNvbnN0IGJyYW5kcyA9IGdldEJyYW5kcyggZ3J1bnQsIHJlcG8sIGJ1aWxkTG9jYWwgKTtcclxuXHJcbiAgICBjb25zdCBsaW50UmV0dXJuVmFsdWUgPSBhd2FpdCBsaW50KCBnZXRQaGV0TGlicyggcmVwbywgYnJhbmRzICksIHtcclxuICAgICAgY2FjaGU6IGNhY2hlLFxyXG4gICAgICBmaXg6IGZpeCxcclxuICAgICAgY2hpcEF3YXk6IGNoaXBBd2F5XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gT3V0cHV0IHJlc3VsdHMgb24gZXJyb3JzLlxyXG4gICAgaWYgKCAhbGludFJldHVyblZhbHVlLm9rICkge1xyXG4gICAgICBncnVudC5mYWlsLmZhdGFsKCAnTGludCBmYWlsZWQnICk7XHJcbiAgICB9XHJcbiAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2dlbmVyYXRlLWRldmVsb3BtZW50LWh0bWwnLFxyXG4gICAgJ0dlbmVyYXRlcyB0b3AtbGV2ZWwgU0lNX2VuLmh0bWwgZmlsZSBiYXNlZCBvbiB0aGUgcHJlbG9hZHMgaW4gcGFja2FnZS5qc29uLicsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZURldmVsb3BtZW50SFRNTCA9IHJlcXVpcmUoICcuL2dlbmVyYXRlRGV2ZWxvcG1lbnRIVE1MJyApO1xyXG5cclxuICAgICAgYXdhaXQgZ2VuZXJhdGVEZXZlbG9wbWVudEhUTUwoIHJlcG8gKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdnZW5lcmF0ZS10ZXN0LWh0bWwnLFxyXG4gICAgJ0dlbmVyYXRlcyB0b3AtbGV2ZWwgU0lNLXRlc3RzLmh0bWwgZmlsZSBiYXNlZCBvbiB0aGUgcHJlbG9hZHMgaW4gcGFja2FnZS5qc29uLiAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9hcXVhL2Jsb2IvbWFpbi9kb2MvYWRkaW5nLXVuaXQtdGVzdHMubWQgJyArXHJcbiAgICAnZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gYXV0b21hdGVkIHRlc3RpbmcuIFVzdWFsbHkgeW91IHNob3VsZCAnICtcclxuICAgICdzZXQgdGhlIFwiZ2VuZXJhdGVkVW5pdFRlc3RzXCI6dHJ1ZSBmbGFnIGluIHRoZSBzaW0gcGFja2FnZS5qc29uIGFuZCBydW4gYGdydW50IHVwZGF0ZWAgaW5zdGVhZCBvZiBtYW51YWxseSBnZW5lcmF0aW5nIHRoaXMuJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGdlbmVyYXRlVGVzdEhUTUwgPSByZXF1aXJlKCAnLi9nZW5lcmF0ZVRlc3RIVE1MJyApO1xyXG5cclxuICAgICAgYXdhaXQgZ2VuZXJhdGVUZXN0SFRNTCggcmVwbyApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2dlbmVyYXRlLWExMXktdmlldy1odG1sJyxcclxuICAgICdHZW5lcmF0ZXMgdG9wLWxldmVsIFNJTS1hMTF5LXZpZXcuaHRtbCBmaWxlIHVzZWQgZm9yIHZpc3VhbGl6aW5nIGFjY2Vzc2libGUgY29udGVudC4gVXN1YWxseSB5b3Ugc2hvdWxkICcgK1xyXG4gICAgJ3NldCB0aGUgXCJwaGV0LnNpbUZlYXR1cmVzLnN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvblwiOnRydWUgZmxhZyBpbiB0aGUgc2ltIHBhY2thZ2UuanNvbiBhbmQgcnVuIGBncnVudCB1cGRhdGVgICcgK1xyXG4gICAgJ2luc3RlYWQgb2YgbWFudWFsbHkgZ2VuZXJhdGluZyB0aGlzLicsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG5cclxuICAgICAgY29uc3QgZ2VuZXJhdGVBMTF5Vmlld0hUTUwgPSByZXF1aXJlKCAnLi9nZW5lcmF0ZUExMXlWaWV3SFRNTCcgKTtcclxuICAgICAgYXdhaXQgZ2VuZXJhdGVBMTF5Vmlld0hUTUwoIHJlcG8gKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICd1cGRhdGUnLCBgXHJcblVwZGF0ZXMgdGhlIG5vcm1hbCBhdXRvbWF0aWNhbGx5LWdlbmVyYXRlZCBmaWxlcyBmb3IgdGhpcyByZXBvc2l0b3J5LiBJbmNsdWRlczpcclxuICAqIHJ1bm5hYmxlczogZ2VuZXJhdGUtZGV2ZWxvcG1lbnQtaHRtbCBhbmQgbW9kdWxpZnlcclxuICAqIGFjY2Vzc2libGUgcnVubmFibGVzOiBnZW5lcmF0ZS1hMTF5LXZpZXctaHRtbFxyXG4gICogdW5pdCB0ZXN0czogZ2VuZXJhdGUtdGVzdC1odG1sXHJcbiAgKiBzaW11bGF0aW9uczogZ2VuZXJhdGVSRUFETUUoKVxyXG4gICogcGhldC1pbyBzaW11bGF0aW9uczogZ2VuZXJhdGUgb3ZlcnJpZGVzIGZpbGUgaWYgbmVlZGVkXHJcbiAgKiBjcmVhdGUgdGhlIGNvbmdsb21lcmF0ZSBzdHJpbmcgZmlsZXMgZm9yIHVuYnVpbHQgbW9kZSwgZm9yIHRoaXMgcmVwbyBhbmQgaXRzIGRlcGVuZGVuY2llc2AsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZVJFQURNRSA9IHJlcXVpcmUoICcuL2dlbmVyYXRlUkVBRE1FJyApO1xyXG4gICAgICBjb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuICAgICAgY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcblxyXG4gICAgICAvLyBzdXBwb3J0IHJlcG9zIHRoYXQgZG9uJ3QgaGF2ZSBhIHBoZXQgb2JqZWN0XHJcbiAgICAgIGlmICggIXBhY2thZ2VPYmplY3QucGhldCApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIG1vZHVsaWZ5IGlzIGdyYWNlZnVsIGlmIHRoZXJlIGFyZSBubyBmaWxlcyB0aGF0IG5lZWQgbW9kdWxpZnlpbmcuXHJcbiAgICAgIGdydW50LnRhc2sucnVuKCAnbW9kdWxpZnknICk7XHJcblxyXG4gICAgICAvLyB1cGRhdGUgUkVBRE1FLm1kIG9ubHkgZm9yIHNpbXVsYXRpb25zXHJcbiAgICAgIGlmICggcGFja2FnZU9iamVjdC5waGV0LnNpbXVsYXRpb24gJiYgIXBhY2thZ2VPYmplY3QucGhldC5yZWFkbWVDcmVhdGVkTWFudWFsbHkgKSB7XHJcbiAgICAgICAgYXdhaXQgZ2VuZXJhdGVSRUFETUUoIHJlcG8sICEhcGFja2FnZU9iamVjdC5waGV0LnB1Ymxpc2hlZCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIHBhY2thZ2VPYmplY3QucGhldC5zdXBwb3J0ZWRCcmFuZHMgJiYgcGFja2FnZU9iamVjdC5waGV0LnN1cHBvcnRlZEJyYW5kcy5pbmNsdWRlcyggJ3BoZXQtaW8nICkgKSB7XHJcblxyXG4gICAgICAgIC8vIENvcGllZCBmcm9tIGJ1aWxkLmpzb24gYW5kIHVzZWQgYXMgYSBwcmVsb2FkIGZvciBwaGV0LWlvIGJyYW5kXHJcbiAgICAgICAgY29uc3Qgb3ZlcnJpZGVzRmlsZSA9IGBqcy8ke3JlcG99LXBoZXQtaW8tb3ZlcnJpZGVzLmpzYDtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYWxyZWFkeSBhbiBvdmVycmlkZXMgZmlsZSwgZG9uJ3Qgb3ZlcndyaXRlIGl0IHdpdGggYW4gZW1wdHkgb25lXHJcbiAgICAgICAgaWYgKCAhZnMuZXhpc3RzU3luYyggYC4uLyR7cmVwb30vJHtvdmVycmlkZXNGaWxlfWAgKSApIHtcclxuICAgICAgICAgIGNvbnN0IHdyaXRlRmlsZUFuZEdpdEFkZCA9IHJlcXVpcmUoICcuLi8uLi8uLi9wZXJlbm5pYWwtYWxpYXMvanMvY29tbW9uL3dyaXRlRmlsZUFuZEdpdEFkZCcgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBvdmVycmlkZXNDb250ZW50ID0gJy8qIGVzbGludC1kaXNhYmxlICovXFxud2luZG93LnBoZXQucHJlbG9hZHMucGhldGlvLnBoZXRpb0VsZW1lbnRzT3ZlcnJpZGVzID0ge307JztcclxuICAgICAgICAgIGF3YWl0IHdyaXRlRmlsZUFuZEdpdEFkZCggcmVwbywgb3ZlcnJpZGVzRmlsZSwgb3ZlcnJpZGVzQ29udGVudCApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHNpbVNwZWNpZmljV3JhcHBlcnM7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIC8vIFBvcHVsYXRlIHNpbS1zcGVjaWZpYyB3cmFwcGVycyBpbnRvIHRoZSBwYWNrYWdlLmpzb25cclxuICAgICAgICAgIHNpbVNwZWNpZmljV3JhcHBlcnMgPSBmcy5yZWFkZGlyU3luYyggYC4uL3BoZXQtaW8tc2ltLXNwZWNpZmljL3JlcG9zLyR7cmVwb30vd3JhcHBlcnMvYCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0gKVxyXG4gICAgICAgICAgICAuZmlsdGVyKCBkaXJlbnQgPT4gZGlyZW50LmlzRGlyZWN0b3J5KCkgKVxyXG4gICAgICAgICAgICAubWFwKCBkaXJlbnQgPT4gYHBoZXQtaW8tc2ltLXNwZWNpZmljL3JlcG9zLyR7cmVwb30vd3JhcHBlcnMvJHtkaXJlbnQubmFtZX1gICk7XHJcbiAgICAgICAgICBpZiAoIHNpbVNwZWNpZmljV3JhcHBlcnMubGVuZ3RoID4gMCApIHtcclxuXHJcbiAgICAgICAgICAgIHBhY2thZ2VPYmplY3QucGhldFsgJ3BoZXQtaW8nIF0gPSBwYWNrYWdlT2JqZWN0LnBoZXRbICdwaGV0LWlvJyBdIHx8IHt9O1xyXG4gICAgICAgICAgICBwYWNrYWdlT2JqZWN0LnBoZXRbICdwaGV0LWlvJyBdLndyYXBwZXJzID0gXy51bmlxKCBzaW1TcGVjaWZpY1dyYXBwZXJzLmNvbmNhdCggcGFja2FnZU9iamVjdC5waGV0WyAncGhldC1pbycgXS53cmFwcGVycyB8fCBbXSApICk7XHJcbiAgICAgICAgICAgIGdydW50LmZpbGUud3JpdGUoICdwYWNrYWdlLmpzb24nLCBKU09OLnN0cmluZ2lmeSggcGFja2FnZU9iamVjdCwgbnVsbCwgMiApICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgICAgaWYgKCAhZS5tZXNzYWdlLmluY2x1ZGVzKCAnbm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeScgKSApIHtcclxuICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFRoZSBhYm92ZSBjb2RlIGNhbiBtdXRhdGUgdGhlIHBhY2thZ2UuanNvbiwgc28gZG8gdGhlc2UgYWZ0ZXJcclxuICAgICAgaWYgKCBwYWNrYWdlT2JqZWN0LnBoZXQucnVubmFibGUgKSB7XHJcbiAgICAgICAgZ3J1bnQudGFzay5ydW4oICdnZW5lcmF0ZS1kZXZlbG9wbWVudC1odG1sJyApO1xyXG5cclxuICAgICAgICBpZiAoIHBhY2thZ2VPYmplY3QucGhldC5zaW1GZWF0dXJlcyAmJiBwYWNrYWdlT2JqZWN0LnBoZXQuc2ltRmVhdHVyZXMuc3VwcG9ydHNJbnRlcmFjdGl2ZURlc2NyaXB0aW9uICkge1xyXG4gICAgICAgICAgZ3J1bnQudGFzay5ydW4oICdnZW5lcmF0ZS1hMTF5LXZpZXctaHRtbCcgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBwYWNrYWdlT2JqZWN0LnBoZXQuZ2VuZXJhdGVkVW5pdFRlc3RzICkge1xyXG4gICAgICAgIGdydW50LnRhc2sucnVuKCAnZ2VuZXJhdGUtdGVzdC1odG1sJyApO1xyXG4gICAgICB9XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgLy8gVGhpcyBpcyBub3QgcnVuIGluIGdydW50IHVwZGF0ZSBiZWNhdXNlIGl0IGFmZmVjdHMgZGVwZW5kZW5jaWVzIGFuZCBvdXRwdXRzIGZpbGVzIG91dHNpZGUgb2YgdGhlIHJlcG8uXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnZ2VuZXJhdGUtZGV2ZWxvcG1lbnQtc3RyaW5ncycsXHJcbiAgICAnVG8gc3VwcG9ydCBsb2NhbGVzPSogaW4gdW5idWlsdCBtb2RlLCBnZW5lcmF0ZSBhIGNvbmdsb21lcmF0ZSBKU09OIGZpbGUgZm9yIGVhY2ggcmVwbyB3aXRoIHRyYW5zbGF0aW9ucyBpbiBiYWJlbC4gUnVuIG9uIGFsbCByZXBvcyB2aWE6XFxuJyArXHJcbiAgICAnKiBmb3ItZWFjaC5zaCBwZXJlbm5pYWwtYWxpYXMvZGF0YS9hY3RpdmUtcmVwb3MgbnBtIGluc3RhbGxcXG4nICtcclxuICAgICcqIGZvci1lYWNoLnNoIHBlcmVubmlhbC1hbGlhcy9kYXRhL2FjdGl2ZS1yZXBvcyBncnVudCBnZW5lcmF0ZS1kZXZlbG9wbWVudC1zdHJpbmdzJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGdlbmVyYXRlRGV2ZWxvcG1lbnRTdHJpbmdzID0gcmVxdWlyZSggJy4uL3NjcmlwdHMvZ2VuZXJhdGVEZXZlbG9wbWVudFN0cmluZ3MnICk7XHJcbiAgICAgIGNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5cclxuICAgICAgaWYgKCBmcy5leGlzdHNTeW5jKCBgLi4vJHtyZXBvfS8ke3JlcG99LXN0cmluZ3NfZW4uanNvbmAgKSApIHtcclxuICAgICAgICBnZW5lcmF0ZURldmVsb3BtZW50U3RyaW5ncyggcmVwbyApO1xyXG4gICAgICB9XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdwdWJsaXNoZWQtUkVBRE1FJyxcclxuICAgICdHZW5lcmF0ZXMgUkVBRE1FLm1kIGZpbGUgZm9yIGEgcHVibGlzaGVkIHNpbXVsYXRpb24uJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGdlbmVyYXRlUkVBRE1FID0gcmVxdWlyZSggJy4vZ2VuZXJhdGVSRUFETUUnICk7IC8vIHVzZWQgYnkgbXVsdGlwbGUgdGFza3NcclxuICAgICAgYXdhaXQgZ2VuZXJhdGVSRUFETUUoIHJlcG8sIHRydWUgLyogcHVibGlzaGVkICovICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAndW5wdWJsaXNoZWQtUkVBRE1FJyxcclxuICAgICdHZW5lcmF0ZXMgUkVBRE1FLm1kIGZpbGUgZm9yIGFuIHVucHVibGlzaGVkIHNpbXVsYXRpb24uJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGdlbmVyYXRlUkVBRE1FID0gcmVxdWlyZSggJy4vZ2VuZXJhdGVSRUFETUUnICk7IC8vIHVzZWQgYnkgbXVsdGlwbGUgdGFza3NcclxuICAgICAgYXdhaXQgZ2VuZXJhdGVSRUFETUUoIHJlcG8sIGZhbHNlIC8qIHB1Ymxpc2hlZCAqLyApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ3NvcnQtaW1wb3J0cycsICdTb3J0IHRoZSBpbXBvcnQgc3RhdGVtZW50cyBmb3IgYSBzaW5nbGUgZmlsZSAoaWYgLS1maWxlPXt7RklMRX19IGlzIHByb3ZpZGVkKSwgb3IgZG9lcyBzbyBmb3IgYWxsIEpTIGZpbGVzIGlmIG5vdCBzcGVjaWZpZWQnLCB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgY29uc3Qgc29ydEltcG9ydHMgPSByZXF1aXJlKCAnLi9zb3J0SW1wb3J0cycgKTtcclxuXHJcbiAgICBjb25zdCBmaWxlID0gZ3J1bnQub3B0aW9uKCAnZmlsZScgKTtcclxuXHJcbiAgICBpZiAoIGZpbGUgKSB7XHJcbiAgICAgIHNvcnRJbXBvcnRzKCBmaWxlICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgZ3J1bnQuZmlsZS5yZWN1cnNlKCBgLi4vJHtyZXBvfS9qc2AsIGFic2ZpbGUgPT4gc29ydEltcG9ydHMoIGFic2ZpbGUgKSApO1xyXG4gICAgfVxyXG4gIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdjb21taXRzLXNpbmNlJyxcclxuICAgICdTaG93cyBjb21taXRzIHNpbmNlIGEgc3BlY2lmaWVkIGRhdGUuIFVzZSAtLWRhdGU9PGRhdGU+IHRvIHNwZWNpZnkgdGhlIGRhdGUuJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGRhdGVTdHJpbmcgPSBncnVudC5vcHRpb24oICdkYXRlJyApO1xyXG4gICAgICBhc3NlcnQoIGRhdGVTdHJpbmcsICdtaXNzaW5nIHJlcXVpcmVkIG9wdGlvbjogLS1kYXRlPXt7REFURX19JyApO1xyXG5cclxuICAgICAgY29uc3QgY29tbWl0c1NpbmNlID0gcmVxdWlyZSggJy4vY29tbWl0c1NpbmNlJyApO1xyXG5cclxuICAgICAgYXdhaXQgY29tbWl0c1NpbmNlKCByZXBvLCBkYXRlU3RyaW5nICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgLy8gU2VlIHJlcG9ydE1lZGlhLmpzXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAncmVwb3J0LW1lZGlhJyxcclxuICAgICcocHJvamVjdC13aWRlKSBSZXBvcnQgb24gbGljZW5zZS5qc29uIGZpbGVzIHRocm91Z2hvdXQgYWxsIHdvcmtpbmcgY29waWVzLiAnICtcclxuICAgICdSZXBvcnRzIGFueSBtZWRpYSAoc3VjaCBhcyBpbWFnZXMgb3Igc291bmQpIGZpbGVzIHRoYXQgaGF2ZSBhbnkgb2YgdGhlIGZvbGxvd2luZyBwcm9ibGVtczpcXG4nICtcclxuICAgICcoMSkgaW5jb21wYXRpYmxlLWxpY2Vuc2UgKHJlc291cmNlIGxpY2Vuc2Ugbm90IGFwcHJvdmVkKVxcbicgK1xyXG4gICAgJygyKSBub3QtYW5ub3RhdGVkIChsaWNlbnNlLmpzb24gbWlzc2luZyBvciBlbnRyeSBtaXNzaW5nIGZyb20gbGljZW5zZS5qc29uKVxcbicgK1xyXG4gICAgJygzKSBtaXNzaW5nLWZpbGUgKGVudHJ5IGluIHRoZSBsaWNlbnNlLmpzb24gYnV0IG5vdCBvbiB0aGUgZmlsZSBzeXN0ZW0pJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlcG9ydE1lZGlhID0gcmVxdWlyZSggJy4vcmVwb3J0TWVkaWEnICk7XHJcblxyXG4gICAgICBhd2FpdCByZXBvcnRNZWRpYSggcmVwbyApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIC8vIHNlZSByZXBvcnRUaGlyZFBhcnR5LmpzXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAncmVwb3J0LXRoaXJkLXBhcnR5JyxcclxuICAgICdDcmVhdGVzIGEgcmVwb3J0IG9mIHRoaXJkLXBhcnR5IHJlc291cmNlcyAoY29kZSwgaW1hZ2VzLCBzb3VuZCwgZXRjKSB1c2VkIGluIHRoZSBwdWJsaXNoZWQgUGhFVCBzaW11bGF0aW9ucyBieSAnICtcclxuICAgICdyZWFkaW5nIHRoZSBsaWNlbnNlIGluZm9ybWF0aW9uIGluIHB1Ymxpc2hlZCBIVE1MIGZpbGVzIG9uIHRoZSBQaEVUIHdlYnNpdGUuIFRoaXMgdGFzayBtdXN0IGJlIHJ1biBmcm9tIG1haW4uICAnICtcclxuICAgICdBZnRlciBydW5uaW5nIHRoaXMgdGFzaywgeW91IG11c3QgcHVzaCBzaGVycGEvdGhpcmQtcGFydHktbGljZW5zZXMubWQuJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlcG9ydFRoaXJkUGFydHkgPSByZXF1aXJlKCAnLi9yZXBvcnRUaGlyZFBhcnR5JyApO1xyXG5cclxuICAgICAgYXdhaXQgcmVwb3J0VGhpcmRQYXJ0eSgpO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ21vZHVsaWZ5JywgJ0NyZWF0ZXMgKi5qcyBtb2R1bGVzIGZvciBhbGwgaW1hZ2VzL3N0cmluZ3MvYXVkaW8vZXRjIGluIGEgcmVwbycsIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICBjb25zdCBtb2R1bGlmeSA9IHJlcXVpcmUoICcuL21vZHVsaWZ5JyApO1xyXG4gICAgY29uc3QgcmVwb3J0TWVkaWEgPSByZXF1aXJlKCAnLi9yZXBvcnRNZWRpYScgKTtcclxuICAgIGNvbnN0IGdlbmVyYXRlRGV2ZWxvcG1lbnRTdHJpbmdzID0gcmVxdWlyZSggJy4uL3NjcmlwdHMvZ2VuZXJhdGVEZXZlbG9wbWVudFN0cmluZ3MnICk7XHJcbiAgICBjb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuXHJcbiAgICBhd2FpdCBtb2R1bGlmeSggcmVwbyApO1xyXG5cclxuICAgIGlmICggZnMuZXhpc3RzU3luYyggYC4uLyR7cmVwb30vJHtyZXBvfS1zdHJpbmdzX2VuLmpzb25gICkgKSB7XHJcbiAgICAgIGdlbmVyYXRlRGV2ZWxvcG1lbnRTdHJpbmdzKCByZXBvICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRG8gdGhpcyBsYXN0IHRvIGhlbHAgd2l0aCBwcm90b3R5cGluZyBiZWZvcmUgY29tbWl0IChpdCB3b3VsZCBiZSBmcnVzdHJhdGluZyBpZiB0aGlzIGVycm9yZWQgb3V0IGJlZm9yZSBnaXZpbmdcclxuICAgIC8vIHlvdSB0aGUgYXNzZXQgeW91IGNvdWxkIHVzZSBpbiB0aGUgc2ltKS5cclxuICAgIGF3YWl0IHJlcG9ydE1lZGlhKCByZXBvICk7XHJcbiAgfSApICk7XHJcblxyXG4gIC8vIEdydW50IHRhc2sgdGhhdCBkZXRlcm1pbmVzIGNyZWF0ZWQgYW5kIGxhc3QgbW9kaWZpZWQgZGF0ZXMgZnJvbSBnaXQsIGFuZFxyXG4gIC8vIHVwZGF0ZXMgY29weXJpZ2h0IHN0YXRlbWVudHMgYWNjb3JkaW5nbHksIHNlZSAjNDAzXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKFxyXG4gICAgJ3VwZGF0ZS1jb3B5cmlnaHQtZGF0ZXMnLFxyXG4gICAgJ1VwZGF0ZSB0aGUgY29weXJpZ2h0IGRhdGVzIGluIEpTIHNvdXJjZSBmaWxlcyBiYXNlZCBvbiBHaXRodWIgZGF0ZXMnLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgdXBkYXRlQ29weXJpZ2h0RGF0ZXMgPSByZXF1aXJlKCAnLi91cGRhdGVDb3B5cmlnaHREYXRlcycgKTtcclxuXHJcbiAgICAgIGF3YWl0IHVwZGF0ZUNvcHlyaWdodERhdGVzKCByZXBvICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soXHJcbiAgICAnd2VicGFjay1kZXYtc2VydmVyJywgYFJ1bnMgYSB3ZWJwYWNrIHNlcnZlciBmb3IgYSBnaXZlbiBsaXN0IG9mIHNpbXVsYXRpb25zLlxyXG4tLXJlcG9zPVJFUE9TIGZvciBhIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIHJlcG9zIChkZWZhdWx0cyB0byBjdXJyZW50IHJlcG8pXHJcbi0tcG9ydD05MDAwIHRvIGFkanVzdCB0aGUgcnVubmluZyBwb3J0XHJcbi0tZGV2dG9vbD1zdHJpbmcgdmFsdWUgZm9yIHNvdXJjZW1hcCBnZW5lcmF0aW9uIHNwZWNpZmllZCBhdCBodHRwczovL3dlYnBhY2suanMub3JnL2NvbmZpZ3VyYXRpb24vZGV2dG9vbCBvciB1bmRlZmluZWQgZm9yIChub25lKVxyXG4tLWNocm9tZTogb3BlbiB0aGUgc2ltcyBpbiBDaHJvbWUgdGFicyAoTWFjKWAsXHJcbiAgICAoKSA9PiB7XHJcbiAgICAgIC8vIFdlIGRvbid0IGZpbmlzaCEgRG9uJ3QgdGVsbCBncnVudCB0aGlzLi4uXHJcbiAgICAgIGdydW50LnRhc2suY3VycmVudC5hc3luYygpO1xyXG5cclxuICAgICAgY29uc3QgcmVwb3MgPSBncnVudC5vcHRpb24oICdyZXBvcycgKSA/IGdydW50Lm9wdGlvbiggJ3JlcG9zJyApLnNwbGl0KCAnLCcgKSA6IFsgcmVwbyBdO1xyXG4gICAgICBjb25zdCBwb3J0ID0gZ3J1bnQub3B0aW9uKCAncG9ydCcgKSB8fCA5MDAwO1xyXG4gICAgICBsZXQgZGV2dG9vbCA9IGdydW50Lm9wdGlvbiggJ2RldnRvb2wnICkgfHwgJ2lubGluZS1zb3VyY2UtbWFwJztcclxuICAgICAgaWYgKCBkZXZ0b29sID09PSAnbm9uZScgfHwgZGV2dG9vbCA9PT0gJ3VuZGVmaW5lZCcgKSB7XHJcbiAgICAgICAgZGV2dG9vbCA9IHVuZGVmaW5lZDtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBvcGVuQ2hyb21lID0gZ3J1bnQub3B0aW9uKCAnY2hyb21lJyApIHx8IGZhbHNlO1xyXG5cclxuICAgICAgY29uc3Qgd2VicGFja0RldlNlcnZlciA9IHJlcXVpcmUoICcuL3dlYnBhY2tEZXZTZXJ2ZXInICk7XHJcblxyXG4gICAgICAvLyBOT1RFOiBXZSBkb24ndCBjYXJlIGFib3V0IHRoZSBwcm9taXNlIHRoYXQgaXMgcmV0dXJuZWQgaGVyZSwgYmVjYXVzZSB3ZSBhcmUgZ29pbmcgdG8ga2VlcCB0aGlzIHRhc2sgcnVubmluZ1xyXG4gICAgICAvLyB1bnRpbCB0aGUgdXNlciBtYW51YWxseSBraWxscyBpdC5cclxuICAgICAgd2VicGFja0RldlNlcnZlciggcmVwb3MsIHBvcnQsIGRldnRvb2wsIG9wZW5DaHJvbWUgKTtcclxuICAgIH1cclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soXHJcbiAgICAnZ2VuZXJhdGUtcGhldC1pby1hcGknLFxyXG4gICAgJ091dHB1dCB0aGUgUGhFVC1pTyBBUEkgYXMgSlNPTiB0byBwaGV0LWlvLXNpbS1zcGVjaWZpYy9hcGkuXFxuJyArXHJcbiAgICAnT3B0aW9uc1xcbjonICtcclxuICAgICctLXNpbXM9Li4uIGEgbGlzdCBvZiBzaW1zIHRvIGNvbXBhcmUgKGRlZmF1bHRzIHRvIHRoZSBzaW0gaW4gdGhlIGN1cnJlbnQgZGlyKVxcbicgK1xyXG4gICAgJy0tc2ltTGlzdD0uLi4gYSBmaWxlIHdpdGggYSBsaXN0IG9mIHNpbXMgdG8gY29tcGFyZSAoZGVmYXVsdHMgdG8gdGhlIHNpbSBpbiB0aGUgY3VycmVudCBkaXIpXFxuJyArXHJcbiAgICAnLS1zdGFibGUgLSByZWdlbmVyYXRlIGZvciBhbGwgXCJzdGFibGUgc2ltc1wiIChzZWUgcGVyZW5uaWFsL2RhdGEvcGhldC1pby1hcGktc3RhYmxlLylcXG4nICtcclxuICAgICctLXRlbXBvcmFyeSAtIG91dHB1dHMgdG8gdGhlIHRlbXBvcmFyeSBkaXJlY3RvcnlcXG4nICtcclxuICAgICctLXRyYW5zcGlsZT1mYWxzZSAtIHNraXBzIHRoZSB0cmFuc3BpbGF0aW9uIHN0ZXAuIFlvdSBjYW4gc2tpcCB0cmFuc3BpbGF0aW9uIGlmIGEgd2F0Y2ggcHJvY2VzcyBpcyBoYW5kbGluZyBpdC4nLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZm9ybWF0UGhldGlvQVBJID0gcmVxdWlyZSggJy4uL3BoZXQtaW8vZm9ybWF0UGhldGlvQVBJJyApO1xyXG4gICAgICBjb25zdCBnZXRTaW1MaXN0ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXRTaW1MaXN0JyApO1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZVBoZXRpb01hY3JvQVBJID0gcmVxdWlyZSggJy4uL3BoZXQtaW8vZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSScgKTtcclxuICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcblxyXG4gICAgICBjb25zdCBzaW1zID0gZ2V0U2ltTGlzdCgpLmxlbmd0aCA9PT0gMCA/IFsgcmVwbyBdIDogZ2V0U2ltTGlzdCgpO1xyXG5cclxuICAgICAgLy8gSWRlYWxseSB0cmFuc3BpbGF0aW9uIHdvdWxkIGJlIGEgbm8tb3AgaWYgdGhlIHdhdGNoIHByb2Nlc3MgaXMgcnVubmluZy4gSG93ZXZlciwgaXQgY2FuIHRha2UgMisgc2Vjb25kcyBvblxyXG4gICAgICAvLyBtYWNPUyB0byBjaGVjayBhbGwgZmlsZXMsIGFuZCBzb21ldGltZXMgbXVjaCBsb25nZXIgKDUwKyBzZWNvbmRzKSBpZiB0aGUgY2FjaGUgbWVjaGFuaXNtIGlzIGZhaWxpbmcuXHJcbiAgICAgIC8vIFNvIHRoaXMgXCJza2lwXCIgaXMgYSBiYW5kLWFpZCB1bnRpbCB3ZSByZWR1Y2UgdGhvc2Ugb3RoZXIgcHJvYmxlbXMuXHJcbiAgICAgIGNvbnN0IHNraXBUcmFuc3BpbGUgPSBncnVudC5vcHRpb24oICd0cmFuc3BpbGUnICkgPT09IGZhbHNlO1xyXG4gICAgICBpZiAoICFza2lwVHJhbnNwaWxlICkge1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgdHJhbnNwaWxlci50cmFuc3BpbGVBbGwoKTtcclxuICAgICAgICBjb25zdCB0cmFuc3BpbGVUaW1lTVMgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xyXG5cclxuICAgICAgICAvLyBOb3RpZnkgYWJvdXQgbG9uZyB0cmFuc3BpbGUgdGltZXMsIGluIGNhc2UgbW9yZSBwZW9wbGUgbmVlZCB0byBza2lwXHJcbiAgICAgICAgaWYgKCB0cmFuc3BpbGVUaW1lTVMgPj0gNTAwMCApIHtcclxuICAgICAgICAgIGdydW50LmxvZy53cml0ZWxuKCBgZ2VuZXJhdGUtcGhldC1pby1hcGkgdHJhbnNwaWxhdGlvbiB0b29rICR7dHJhbnNwaWxlVGltZU1TfSBtc2AgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgZ3J1bnQubG9nLndyaXRlbG4oICdTa2lwcGluZyB0cmFuc3BpbGF0aW9uJyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSSggc2ltcywge1xyXG4gICAgICAgIHNob3dQcm9ncmVzc0Jhcjogc2ltcy5sZW5ndGggPiAxLFxyXG4gICAgICAgIHRocm93QVBJR2VuZXJhdGlvbkVycm9yczogZmFsc2UgLy8gV3JpdGUgYXMgbWFueSBhcyB3ZSBjYW4sIGFuZCBwcmludCB3aGF0IHdlIGRpZG4ndCB3cml0ZVxyXG4gICAgICB9ICk7XHJcbiAgICAgIHNpbXMuZm9yRWFjaCggc2ltID0+IHtcclxuICAgICAgICBjb25zdCBkaXIgPSBgLi4vcGhldC1pby1zaW0tc3BlY2lmaWMvcmVwb3MvJHtzaW19YDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgZnMubWtkaXJTeW5jKCBkaXIgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICAvLyBEaXJlY3RvcnkgZXhpc3RzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gYCR7ZGlyfS8ke3NpbX0tcGhldC1pby1hcGkke2dydW50Lm9wdGlvbiggJ3RlbXBvcmFyeScgKSA/ICctdGVtcG9yYXJ5JyA6ICcnfS5qc29uYDtcclxuICAgICAgICBjb25zdCBhcGkgPSByZXN1bHRzWyBzaW0gXTtcclxuICAgICAgICBhcGkgJiYgZnMud3JpdGVGaWxlU3luYyggZmlsZVBhdGgsIGZvcm1hdFBoZXRpb0FQSSggYXBpICkgKTtcclxuICAgICAgfSApO1xyXG4gICAgfSApXHJcbiAgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKFxyXG4gICAgJ2NvbXBhcmUtcGhldC1pby1hcGknLFxyXG4gICAgJ0NvbXBhcmVzIHRoZSBwaGV0LWlvLWFwaSBhZ2FpbnN0IHRoZSByZWZlcmVuY2UgdmVyc2lvbihzKSBpZiB0aGlzIHNpbVxcJ3MgcGFja2FnZS5qc29uIG1hcmtzIGNvbXBhcmVEZXNpZ25lZEFQSUNoYW5nZXMuICAnICtcclxuICAgICdUaGlzIHdpbGwgYnkgZGVmYXVsdCBjb21wYXJlIGRlc2lnbmVkIGNoYW5nZXMgb25seS4gT3B0aW9uczpcXG4nICtcclxuICAgICctLXNpbXM9Li4uIGEgbGlzdCBvZiBzaW1zIHRvIGNvbXBhcmUgKGRlZmF1bHRzIHRvIHRoZSBzaW0gaW4gdGhlIGN1cnJlbnQgZGlyKVxcbicgK1xyXG4gICAgJy0tc2ltTGlzdD0uLi4gYSBmaWxlIHdpdGggYSBsaXN0IG9mIHNpbXMgdG8gY29tcGFyZSAoZGVmYXVsdHMgdG8gdGhlIHNpbSBpbiB0aGUgY3VycmVudCBkaXIpXFxuJyArXHJcbiAgICAnLS1zdGFibGUsIGdlbmVyYXRlIHRoZSBwaGV0LWlvLWFwaXMgZm9yIGVhY2ggcGhldC1pbyBzaW0gY29uc2lkZXJlZCB0byBoYXZlIGEgc3RhYmxlIEFQSSAoc2VlIHBlcmVubmlhbC1hbGlhcy9kYXRhL3BoZXQtaW8tYXBpLXN0YWJsZSlcXG4nICtcclxuICAgICctLWRlbHRhLCBieSBkZWZhdWx0IGEgYnJlYWtpbmctY29tcGF0aWJpbGl0eSBjb21wYXJpc29uIGlzIGRvbmUsIGJ1dCAtLWRlbHRhIHNob3dzIGFsbCBjaGFuZ2VzXFxuJyArXHJcbiAgICAnLS10ZW1wb3JhcnksIGNvbXBhcmVzIEFQSSBmaWxlcyBpbiB0aGUgdGVtcG9yYXJ5IGRpcmVjdG9yeSAob3RoZXJ3aXNlIGNvbXBhcmVzIHRvIGZyZXNobHkgZ2VuZXJhdGVkIEFQSXMpXFxuJyArXHJcbiAgICAnLS1jb21wYXJlQnJlYWtpbmdBUElDaGFuZ2VzIC0gYWRkIHRoaXMgZmxhZyB0byBjb21wYXJlIGJyZWFraW5nIGNoYW5nZXMgaW4gYWRkaXRpb24gdG8gZGVzaWduZWQgY2hhbmdlcycsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZXRTaW1MaXN0ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXRTaW1MaXN0JyApO1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZVBoZXRpb01hY3JvQVBJID0gcmVxdWlyZSggJy4uL3BoZXQtaW8vZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSScgKTtcclxuICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcblxyXG4gICAgICBjb25zdCBzaW1zID0gZ2V0U2ltTGlzdCgpLmxlbmd0aCA9PT0gMCA/IFsgcmVwbyBdIDogZ2V0U2ltTGlzdCgpO1xyXG4gICAgICBjb25zdCB0ZW1wb3JhcnkgPSBncnVudC5vcHRpb24oICd0ZW1wb3JhcnknICk7XHJcbiAgICAgIGxldCBwcm9wb3NlZEFQSXMgPSBudWxsO1xyXG4gICAgICBpZiAoIHRlbXBvcmFyeSApIHtcclxuICAgICAgICBwcm9wb3NlZEFQSXMgPSB7fTtcclxuICAgICAgICBzaW1zLmZvckVhY2goIHNpbSA9PiB7XHJcbiAgICAgICAgICBwcm9wb3NlZEFQSXNbIHNpbSBdID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgLi4vcGhldC1pby1zaW0tc3BlY2lmaWMvcmVwb3MvJHtyZXBvfS8ke3JlcG99LXBoZXQtaW8tYXBpLXRlbXBvcmFyeS5qc29uYCwgJ3V0ZjgnICkgKTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgIHRyYW5zcGlsZXIudHJhbnNwaWxlQWxsKCk7XHJcbiAgICAgICAgcHJvcG9zZWRBUElzID0gYXdhaXQgZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSSggc2ltcywge1xyXG4gICAgICAgICAgc2hvd1Byb2dyZXNzQmFyOiBzaW1zLmxlbmd0aCA+IDEsXHJcbiAgICAgICAgICBzaG93TWVzc2FnZXNGcm9tU2ltOiBmYWxzZVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRG9uJ3QgYWRkIHRvIG9wdGlvbnMgb2JqZWN0IGlmIHZhbHVlcyBhcmUgYHVuZGVmaW5lZGAgKGFzIF8uZXh0ZW5kIHdpbGwga2VlcCB0aG9zZSBlbnRyaWVzIGFuZCBub3QgbWl4IGluIGRlZmF1bHRzXHJcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7fTtcclxuICAgICAgaWYgKCBncnVudC5vcHRpb24oICdkZWx0YScgKSApIHtcclxuICAgICAgICBvcHRpb25zLmRlbHRhID0gZ3J1bnQub3B0aW9uKCAnZGVsdGEnICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBncnVudC5vcHRpb24oICdjb21wYXJlQnJlYWtpbmdBUElDaGFuZ2VzJyApICkge1xyXG4gICAgICAgIG9wdGlvbnMuY29tcGFyZUJyZWFraW5nQVBJQ2hhbmdlcyA9IGdydW50Lm9wdGlvbiggJ2NvbXBhcmVCcmVha2luZ0FQSUNoYW5nZXMnICk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgb2sgPSBhd2FpdCByZXF1aXJlKCAnLi4vcGhldC1pby9waGV0aW9Db21wYXJlQVBJU2V0cycgKSggc2ltcywgcHJvcG9zZWRBUElzLCBvcHRpb25zICk7XHJcbiAgICAgICFvayAmJiBncnVudC5mYWlsLmZhdGFsKCAnUGhFVC1pTyBBUEkgY29tcGFyaXNvbiBmYWlsZWQnICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soXHJcbiAgICAncHJvZmlsZS1maWxlLXNpemUnLFxyXG4gICAgJ1Byb2ZpbGVzIHRoZSBmaWxlIHNpemUgb2YgdGhlIGJ1aWx0IEpTIGZpbGUgZm9yIGEgZ2l2ZW4gcmVwbycsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBwcm9maWxlRmlsZVNpemUgPSByZXF1aXJlKCAnLi4vZ3J1bnQvcHJvZmlsZUZpbGVTaXplJyApO1xyXG5cclxuICAgICAgYXdhaXQgcHJvZmlsZUZpbGVTaXplKCByZXBvICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGdydW50IHRhc2tzIHRoYXQgZWZmZWN0aXZlbHkgZ2V0IGZvcndhcmRlZCB0byBwZXJlbm5pYWwuIEl0IHdpbGwgZXhlY3V0ZSBhIGdydW50IHByb2Nlc3MgcnVubmluZyBmcm9tXHJcbiAgICogcGVyZW5uaWFsJ3MgZGlyZWN0b3J5IHdpdGggdGhlIHNhbWUgb3B0aW9ucyAoYnV0IHdpdGggLS1yZXBvPXt7UkVQT319IGFkZGVkLCBzbyB0aGF0IHBlcmVubmlhbCBpcyBhd2FyZSBvZiB3aGF0XHJcbiAgICogcmVwb3NpdG9yeSBpcyB0aGUgdGFyZ2V0KS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFzayAtIFRoZSBuYW1lIG9mIHRoZSB0YXNrXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZm9yd2FyZFRvUGVyZW5uaWFsR3J1bnQoIHRhc2sgKSB7XHJcbiAgICBncnVudC5yZWdpc3RlclRhc2soIHRhc2ssICdSdW4gZ3J1bnQgLS1oZWxwIGluIHBlcmVubmlhbCB0byBzZWUgZG9jdW1lbnRhdGlvbicsICgpID0+IHtcclxuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oICcoRm9yd2FyZGluZyB0YXNrIHRvIHBlcmVubmlhbCknICk7XHJcblxyXG4gICAgICBjb25zdCBjaGlsZF9wcm9jZXNzID0gcmVxdWlyZSggJ2NoaWxkX3Byb2Nlc3MnICk7XHJcblxyXG5cclxuICAgICAgY29uc3QgZG9uZSA9IGdydW50LnRhc2suY3VycmVudC5hc3luYygpO1xyXG5cclxuICAgICAgLy8gSW5jbHVkZSB0aGUgLS1yZXBvIGZsYWdcclxuICAgICAgY29uc3QgYXJncyA9IFsgYC0tcmVwbz0ke3JlcG99YCwgLi4ucHJvY2Vzcy5hcmd2LnNsaWNlKCAyICkgXTtcclxuICAgICAgY29uc3QgYXJnc1N0cmluZyA9IGFyZ3MubWFwKCBhcmcgPT4gYFwiJHthcmd9XCJgICkuam9pbiggJyAnICk7XHJcbiAgICAgIGNvbnN0IHNwYXduZWQgPSBjaGlsZF9wcm9jZXNzLnNwYXduKCAvXndpbi8udGVzdCggcHJvY2Vzcy5wbGF0Zm9ybSApID8gJ2dydW50LmNtZCcgOiAnZ3J1bnQnLCBhcmdzLCB7XHJcbiAgICAgICAgY3dkOiAnLi4vcGVyZW5uaWFsJ1xyXG4gICAgICB9ICk7XHJcbiAgICAgIGdydW50LmxvZy5kZWJ1ZyggYHJ1bm5pbmcgZ3J1bnQgJHthcmdzU3RyaW5nfSBpbiAuLi8ke3JlcG99YCApO1xyXG5cclxuICAgICAgc3Bhd25lZC5zdGRlcnIub24oICdkYXRhJywgZGF0YSA9PiBncnVudC5sb2cuZXJyb3IoIGRhdGEudG9TdHJpbmcoKSApICk7XHJcbiAgICAgIHNwYXduZWQuc3Rkb3V0Lm9uKCAnZGF0YScsIGRhdGEgPT4gZ3J1bnQubG9nLndyaXRlKCBkYXRhLnRvU3RyaW5nKCkgKSApO1xyXG4gICAgICBwcm9jZXNzLnN0ZGluLnBpcGUoIHNwYXduZWQuc3RkaW4gKTtcclxuXHJcbiAgICAgIHNwYXduZWQub24oICdjbG9zZScsIGNvZGUgPT4ge1xyXG4gICAgICAgIGlmICggY29kZSAhPT0gMCApIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYHBlcmVubmlhbCBncnVudCAke2FyZ3NTdHJpbmd9IGZhaWxlZCB3aXRoIGNvZGUgJHtjb2RlfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBkb25lKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICBbXHJcbiAgICAnY2hlY2tvdXQtc2hhcycsXHJcbiAgICAnY2hlY2tvdXQtdGFyZ2V0JyxcclxuICAgICdjaGVja291dC1yZWxlYXNlJyxcclxuICAgICdjaGVja291dC1tYWluJyxcclxuICAgICdjaGVja291dC1tYWluLWFsbCcsXHJcbiAgICAnY3JlYXRlLW9uZS1vZmYnLFxyXG4gICAgJ3NoYS1jaGVjaycsXHJcbiAgICAnc2ltLWxpc3QnLFxyXG4gICAgJ25wbS11cGRhdGUnLFxyXG4gICAgJ2NyZWF0ZS1yZWxlYXNlJyxcclxuICAgICdjaGVycnktcGljaycsXHJcbiAgICAnd3JhcHBlcicsXHJcbiAgICAnZGV2JyxcclxuICAgICdvbmUtb2ZmJyxcclxuICAgICdyYycsXHJcbiAgICAncHJvZHVjdGlvbicsXHJcbiAgICAncHJvdG90eXBlJyxcclxuICAgICdjcmVhdGUtc2ltJyxcclxuICAgICdpbnNlcnQtcmVxdWlyZS1zdGF0ZW1lbnQnLFxyXG4gICAgJ2xpbnQtZXZlcnl0aGluZycsXHJcbiAgICAnZ2VuZXJhdGUtZGF0YScsXHJcbiAgICAncGRvbS1jb21wYXJpc29uJyxcclxuICAgICdyZWxlYXNlLWJyYW5jaC1saXN0J1xyXG4gIF0uZm9yRWFjaCggZm9yd2FyZFRvUGVyZW5uaWFsR3J1bnQgKTtcclxufTtcclxuXHJcbmNvbnN0IGdldEJyYW5kcyA9ICggZ3J1bnQsIHJlcG8sIGJ1aWxkTG9jYWwgKSA9PiB7XHJcblxyXG4gIC8vIERldGVybWluZSB3aGF0IGJyYW5kcyB3ZSB3YW50IHRvIGJ1aWxkXHJcbiAgYXNzZXJ0KCAhZ3J1bnQub3B0aW9uKCAnYnJhbmQnICksICdVc2UgLS1icmFuZHM9e3tCUkFORFN9fSBpbnN0ZWFkIG9mIGJyYW5kJyApO1xyXG5cclxuICBjb25zdCBsb2NhbFBhY2thZ2VPYmplY3QgPSBncnVudC5maWxlLnJlYWRKU09OKCBgLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gICk7XHJcbiAgY29uc3Qgc3VwcG9ydGVkQnJhbmRzID0gbG9jYWxQYWNrYWdlT2JqZWN0LnBoZXQuc3VwcG9ydGVkQnJhbmRzIHx8IFtdO1xyXG5cclxuICBsZXQgYnJhbmRzO1xyXG4gIGlmICggZ3J1bnQub3B0aW9uKCAnYnJhbmRzJyApICkge1xyXG4gICAgaWYgKCBncnVudC5vcHRpb24oICdicmFuZHMnICkgPT09ICcqJyApIHtcclxuICAgICAgYnJhbmRzID0gc3VwcG9ydGVkQnJhbmRzO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGJyYW5kcyA9IGdydW50Lm9wdGlvbiggJ2JyYW5kcycgKS5zcGxpdCggJywnICk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGVsc2UgaWYgKCBidWlsZExvY2FsLmJyYW5kcyApIHtcclxuICAgIC8vIEV4dHJhIGNoZWNrLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzY0MFxyXG4gICAgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBidWlsZExvY2FsLmJyYW5kcyApLCAnSWYgYnJhbmRzIGV4aXN0cyBpbiBidWlsZC1sb2NhbC5qc29uLCBpdCBzaG91bGQgYmUgYW4gYXJyYXknICk7XHJcbiAgICBicmFuZHMgPSBidWlsZExvY2FsLmJyYW5kcy5maWx0ZXIoIGJyYW5kID0+IHN1cHBvcnRlZEJyYW5kcy5pbmNsdWRlcyggYnJhbmQgKSApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGJyYW5kcyA9IFsgJ2FkYXB0ZWQtZnJvbS1waGV0JyBdO1xyXG4gIH1cclxuXHJcbiAgLy8gRW5zdXJlIGFsbCBsaXN0ZWQgYnJhbmRzIGFyZSB2YWxpZFxyXG4gIGJyYW5kcy5mb3JFYWNoKCBicmFuZCA9PiBhc3NlcnQoIHN1cHBvcnRlZEJyYW5kcy5pbmNsdWRlcyggYnJhbmQgKSwgYFVuc3VwcG9ydGVkIGJyYW5kOiAke2JyYW5kfWAgKSApO1xyXG5cclxuICByZXR1cm4gYnJhbmRzO1xyXG59OyJdLCJtYXBwaW5ncyI6Ijs7OzsrQ0FDQSxxSkFBQUEsbUJBQUEsWUFBQUEsb0JBQUEsV0FBQUMsQ0FBQSxTQUFBQyxDQUFBLEVBQUFELENBQUEsT0FBQUUsQ0FBQSxHQUFBQyxNQUFBLENBQUFDLFNBQUEsRUFBQUMsQ0FBQSxHQUFBSCxDQUFBLENBQUFJLGNBQUEsRUFBQUMsQ0FBQSxHQUFBSixNQUFBLENBQUFLLGNBQUEsY0FBQVAsQ0FBQSxFQUFBRCxDQUFBLEVBQUFFLENBQUEsSUFBQUQsQ0FBQSxDQUFBRCxDQUFBLElBQUFFLENBQUEsQ0FBQU8sS0FBQSxLQUFBQyxDQUFBLHdCQUFBQyxNQUFBLEdBQUFBLE1BQUEsT0FBQUMsQ0FBQSxHQUFBRixDQUFBLENBQUFHLFFBQUEsa0JBQUFDLENBQUEsR0FBQUosQ0FBQSxDQUFBSyxhQUFBLHVCQUFBQyxDQUFBLEdBQUFOLENBQUEsQ0FB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akIscUJBQXFCLENBQ3RCLENBQUNWLE9BQU8sQ0FBRXNZLHVCQUF3QixDQUFDO0FBQ3RDLENBQUM7QUFFRCxJQUFNbkssU0FBUyxHQUFHLFNBQVpBLFNBQVNBLENBQUszSCxLQUFLLEVBQUVRLElBQUksRUFBRUosVUFBVSxFQUFNO0VBRS9DO0VBQ0FuQixNQUFNLENBQUUsQ0FBQ2UsS0FBSyxDQUFDUyxNQUFNLENBQUUsT0FBUSxDQUFDLEVBQUUsMENBQTJDLENBQUM7RUFFOUUsSUFBTXFHLGtCQUFrQixHQUFHOUcsS0FBSyxDQUFDRSxJQUFJLENBQUNDLFFBQVEsT0FBQUUsTUFBQSxDQUFRRyxJQUFJLGtCQUFnQixDQUFDO0VBQzNFLElBQU1nTSxlQUFlLEdBQUcxRixrQkFBa0IsQ0FBQ21CLElBQUksQ0FBQ3VFLGVBQWUsSUFBSSxFQUFFO0VBRXJFLElBQUk5RixNQUFNO0VBQ1YsSUFBSzFHLEtBQUssQ0FBQ1MsTUFBTSxDQUFFLFFBQVMsQ0FBQyxFQUFHO0lBQzlCLElBQUtULEtBQUssQ0FBQ1MsTUFBTSxDQUFFLFFBQVMsQ0FBQyxLQUFLLEdBQUcsRUFBRztNQUN0Q2lHLE1BQU0sR0FBRzhGLGVBQWU7SUFDMUIsQ0FBQyxNQUNJO01BQ0g5RixNQUFNLEdBQUcxRyxLQUFLLENBQUNTLE1BQU0sQ0FBRSxRQUFTLENBQUMsQ0FBQ2lLLEtBQUssQ0FBRSxHQUFJLENBQUM7SUFDaEQ7RUFDRixDQUFDLE1BQ0ksSUFBS3RLLFVBQVUsQ0FBQ3NHLE1BQU0sRUFBRztJQUM1QjtJQUNBekgsTUFBTSxDQUFFdkIsS0FBSyxDQUFDSSxPQUFPLENBQUVzQyxVQUFVLENBQUNzRyxNQUFPLENBQUMsRUFBRSw2REFBOEQsQ0FBQztJQUMzR0EsTUFBTSxHQUFHdEcsVUFBVSxDQUFDc0csTUFBTSxDQUFDaEQsTUFBTSxDQUFFLFVBQUFyQixLQUFLO01BQUEsT0FBSW1LLGVBQWUsQ0FBQ3hFLFFBQVEsQ0FBRTNGLEtBQU0sQ0FBQztJQUFBLENBQUMsQ0FBQztFQUNqRixDQUFDLE1BQ0k7SUFDSHFFLE1BQU0sR0FBRyxDQUFFLG1CQUFtQixDQUFFO0VBQ2xDOztFQUVBO0VBQ0FBLE1BQU0sQ0FBQ2xOLE9BQU8sQ0FBRSxVQUFBNkksS0FBSztJQUFBLE9BQUlwRCxNQUFNLENBQUV1TixlQUFlLENBQUN4RSxRQUFRLENBQUUzRixLQUFNLENBQUMsd0JBQUFoQyxNQUFBLENBQXdCZ0MsS0FBSyxDQUFHLENBQUM7RUFBQSxDQUFDLENBQUM7RUFFckcsT0FBT3FFLE1BQU07QUFDZixDQUFDIiwiaWdub3JlTGlzdCI6W119