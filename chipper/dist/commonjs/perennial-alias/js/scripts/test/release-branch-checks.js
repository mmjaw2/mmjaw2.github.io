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
// Copyright 2024, University of Colorado Boulder

/**
 * Checking yotta=false (https://github.com/phetsims/phetcommon/issues/65) and yotta*=*
 * (https://github.com/phetsims/phetcommon/issues/66) behavior on non-refreshed release branches.
 *
 * NOTE: refresh release branches if not doing an active MR.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var puppeteerLoad = require('../../common/puppeteerLoad');
var Maintenance = require('../../common/Maintenance');
var winston = require('../../../../../../perennial-alias/node_modules/winston');
var puppeteer = require('puppeteer');
var fs = require('fs');
winston["default"].transports.console.level = 'error';
var TEST_LOCALES = true;
var TEST_ANALYTICS = false;
var localeData = fs.readFileSync('../babel/localeData.json', 'utf8');
_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
  var browser, getBaseURLs, getLoadedURLs, demoYottaQueryParameterKey, demoYottaQueryParameterValue, analyzeURLs, _iterator, _step, _loop;
  return _regeneratorRuntime().wrap(function _callee6$(_context8) {
    while (1) switch (_context8.prev = _context8.next) {
      case 0:
        _context8.next = 2;
        return puppeteer.launch({
          args: ['--disable-gpu']
        });
      case 2:
        browser = _context8.sent;
        getBaseURLs = /*#__PURE__*/function () {
          var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(releaseBranch) {
            var buildDir, urls, usesChipper2, standaloneParams, phetioSuffix;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  buildDir = "http://localhost/release-branches/".concat(releaseBranch.repo, "-").concat(releaseBranch.branch, "/").concat(releaseBranch.repo, "/build");
                  urls = [];
                  _context.next = 4;
                  return releaseBranch.usesChipper2();
                case 4:
                  usesChipper2 = _context.sent;
                  if (releaseBranch.brands.includes('phet')) {
                    urls.push("".concat(buildDir, "/").concat(usesChipper2 ? 'phet/' : '').concat(releaseBranch.repo, "_all").concat(usesChipper2 ? '_phet' : '', ".html?webgl=false"));
                  }
                  if (!releaseBranch.brands.includes('phet-io')) {
                    _context.next = 12;
                    break;
                  }
                  _context.next = 9;
                  return releaseBranch.getPhetioStandaloneQueryParameter();
                case 9:
                  standaloneParams = _context.sent;
                  phetioSuffix = usesChipper2 ? '_all_phet-io' : '_en-phetio';
                  urls.push("".concat(buildDir, "/").concat(usesChipper2 ? 'phet-io/' : '').concat(releaseBranch.repo).concat(phetioSuffix, ".html?").concat(standaloneParams, "&webgl=false"));
                case 12:
                  return _context.abrupt("return", urls);
                case 13:
                case "end":
                  return _context.stop();
              }
            }, _callee);
          }));
          return function getBaseURLs(_x) {
            return _ref2.apply(this, arguments);
          };
        }();
        getLoadedURLs = /*#__PURE__*/function () {
          var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(url) {
            var urls;
            return _regeneratorRuntime().wrap(function _callee2$(_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  urls = [];
                  _context2.next = 3;
                  return puppeteerLoad(url, {
                    onPageCreation: function onPageCreation(page) {
                      return page.on('request', function (request) {
                        var url = request.url();
                        if (!url.startsWith('data:')) {
                          urls.push(url);
                        }
                      });
                    },
                    gotoTimeout: 60000,
                    waitAfterLoad: 2000,
                    browser: browser
                  });
                case 3:
                  return _context2.abrupt("return", urls);
                case 4:
                case "end":
                  return _context2.stop();
              }
            }, _callee2);
          }));
          return function getLoadedURLs(_x2) {
            return _ref3.apply(this, arguments);
          };
        }();
        demoYottaQueryParameterKey = 'yottaSomeFlag';
        demoYottaQueryParameterValue = 'someValue';
        analyzeURLs = function analyzeURLs(urls) {
          return {
            sentGoogleAnalytics: urls.some(function (url) {
              return url.includes('collect?');
            }),
            sentYotta: urls.some(function (url) {
              return url.includes('yotta/immediate.gif');
            }),
            sentExternalRequest: urls.some(function (url) {
              return !url.startsWith('http://localhost');
            }),
            hasDemoYottaQueryParameter: urls.some(function (url) {
              return new URLSearchParams(new URL(url).search).get(demoYottaQueryParameterKey) === demoYottaQueryParameterValue;
            })
          };
        };
        _context8.t0 = _createForOfIteratorHelper;
        _context8.next = 11;
        return Maintenance.loadAllMaintenanceBranches();
      case 11:
        _context8.t1 = _context8.sent;
        _iterator = (0, _context8.t0)(_context8.t1);
        _context8.prev = 13;
        _loop = /*#__PURE__*/_regeneratorRuntime().mark(function _loop() {
          var releaseBranch, urls, _iterator2, _step2, _loop2;
          return _regeneratorRuntime().wrap(function _loop$(_context7) {
            while (1) switch (_context7.prev = _context7.next) {
              case 0:
                releaseBranch = _step.value;
                console.log(releaseBranch.toString());
                _context7.next = 4;
                return getBaseURLs(releaseBranch);
              case 4:
                urls = _context7.sent;
                _iterator2 = _createForOfIteratorHelper(urls);
                _context7.prev = 6;
                _loop2 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop2() {
                  var url, localeValues, getRunningLocale, esLocale, spaLocale, espyLocale, invalidLocale, repoPackageObject, partialPotentialTitleStringKey, fullPotentialTitleStringKey, hasTitleKey, getTitle, lookupSpecificTitleTranslation, lookupFallbackTitle, checkTitle, esTitleError, spaTitleError, espyTitleError, plainURL, plainAnalysis, yottaFalseURL, yottaFalseAnalysis, yottaSomeFlagURL, yottaSomeFlagAnalysis;
                  return _regeneratorRuntime().wrap(function _loop2$(_context6) {
                    while (1) switch (_context6.prev = _context6.next) {
                      case 0:
                        url = _step2.value;
                        if (!TEST_LOCALES) {
                          _context6.next = 50;
                          break;
                        }
                        _context6.next = 4;
                        return puppeteerLoad(url, {
                          evaluate: function evaluate() {
                            var _phet$chipper$localeD;
                            return [!!phet.chipper.localeData, !!((_phet$chipper$localeD = phet.chipper.localeData) !== null && _phet$chipper$localeD !== void 0 && _phet$chipper$localeD.es_PY)];
                          },
                          gotoTimeout: 60000,
                          waitAfterLoad: 2000,
                          browser: browser
                        });
                      case 4:
                        localeValues = _context6.sent;
                        if (!localeValues[0]) {
                          console.log('  no localeData');
                        }
                        if (!localeValues[1]) {
                          console.log('  no es_PY localeData');
                        }
                        getRunningLocale = /*#__PURE__*/function () {
                          var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(locale) {
                            return _regeneratorRuntime().wrap(function _callee3$(_context3) {
                              while (1) switch (_context3.prev = _context3.next) {
                                case 0:
                                  _context3.prev = 0;
                                  _context3.next = 3;
                                  return puppeteerLoad(url.includes('?') ? "".concat(url, "&locale=").concat(locale) : "".concat(url, "?locale=").concat(locale), {
                                    evaluate: function evaluate() {
                                      return phet.chipper.locale;
                                    },
                                    gotoTimeout: 60000,
                                    waitAfterLoad: 2000,
                                    browser: browser
                                  });
                                case 3:
                                  return _context3.abrupt("return", _context3.sent);
                                case 6:
                                  _context3.prev = 6;
                                  _context3.t0 = _context3["catch"](0);
                                  console.log("  error running with locale=".concat(locale));
                                  return _context3.abrupt("return", 'error');
                                case 10:
                                case "end":
                                  return _context3.stop();
                              }
                            }, _callee3, null, [[0, 6]]);
                          }));
                          return function getRunningLocale(_x3) {
                            return _ref4.apply(this, arguments);
                          };
                        }();
                        _context6.next = 10;
                        return getRunningLocale('es');
                      case 10:
                        esLocale = _context6.sent;
                        if (esLocale !== 'es') {
                          console.log('  es locale not es');
                        }
                        _context6.next = 14;
                        return getRunningLocale('spa');
                      case 14:
                        spaLocale = _context6.sent;
                        if (spaLocale !== 'es') {
                          console.log('  spa locale not es');
                        }
                        _context6.next = 18;
                        return getRunningLocale('ES_PY');
                      case 18:
                        espyLocale = _context6.sent;
                        if (espyLocale !== 'es' && espyLocale !== 'es_PY') {
                          console.log('  ES_PY locale not es/es_PY');
                        }
                        _context6.next = 22;
                        return getRunningLocale('aenrtpyarntSRTS');
                      case 22:
                        invalidLocale = _context6.sent;
                        if (invalidLocale !== 'en') {
                          console.log('  invalid locale issue, not en');
                        }
                        repoPackageObject = JSON.parse(fs.readFileSync("../".concat(releaseBranch.repo, "/package.json"), 'utf8'));
                        partialPotentialTitleStringKey = "".concat(repoPackageObject.phet.requirejsNamespace, "/").concat(releaseBranch.repo, ".title");
                        fullPotentialTitleStringKey = "".concat(repoPackageObject.phet.requirejsNamespace, "/").concat(partialPotentialTitleStringKey);
                        _context6.next = 29;
                        return puppeteerLoad(url, {
                          evaluate: "!!phet.chipper.strings.en[ \"".concat(fullPotentialTitleStringKey, "\" ]"),
                          gotoTimeout: 60000,
                          waitAfterLoad: 2000,
                          browser: browser
                        });
                      case 29:
                        hasTitleKey = _context6.sent;
                        if (!hasTitleKey) {
                          _context6.next = 49;
                          break;
                        }
                        getTitle = /*#__PURE__*/function () {
                          var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(locale) {
                            return _regeneratorRuntime().wrap(function _callee4$(_context4) {
                              while (1) switch (_context4.prev = _context4.next) {
                                case 0:
                                  _context4.prev = 0;
                                  _context4.next = 3;
                                  return puppeteerLoad(url.includes('?') ? "".concat(url, "&locale=").concat(locale) : "".concat(url, "?locale=").concat(locale), {
                                    evaluate: function evaluate() {
                                      return document.title;
                                    },
                                    gotoTimeout: 60000,
                                    waitAfterLoad: 2000,
                                    browser: browser
                                  });
                                case 3:
                                  return _context4.abrupt("return", _context4.sent);
                                case 6:
                                  _context4.prev = 6;
                                  _context4.t0 = _context4["catch"](0);
                                  console.log("  error running with locale=".concat(locale));
                                  return _context4.abrupt("return", 'error');
                                case 10:
                                case "end":
                                  return _context4.stop();
                              }
                            }, _callee4, null, [[0, 6]]);
                          }));
                          return function getTitle(_x4) {
                            return _ref5.apply(this, arguments);
                          };
                        }(); // null if could not be found
                        lookupSpecificTitleTranslation = function lookupSpecificTitleTranslation(locale) {
                          var _json$partialPotentia, _json$partialPotentia2;
                          var json;
                          if (locale === 'en') {
                            json = JSON.parse(fs.readFileSync("../".concat(releaseBranch.repo, "/").concat(releaseBranch.repo, "-strings_en.json"), 'utf8'));
                          } else {
                            try {
                              json = JSON.parse(fs.readFileSync("../babel/".concat(releaseBranch.repo, "/").concat(releaseBranch.repo, "-strings_").concat(locale, ".json"), 'utf8'));
                            } catch (e) {
                              return null;
                            }
                          }
                          return (_json$partialPotentia = (_json$partialPotentia2 = json[partialPotentialTitleStringKey]) === null || _json$partialPotentia2 === void 0 ? void 0 : _json$partialPotentia2.value) !== null && _json$partialPotentia !== void 0 ? _json$partialPotentia : null;
                        };
                        lookupFallbackTitle = function lookupFallbackTitle(locale) {
                          var _localeData$locale;
                          var locales = [locale].concat(_toConsumableArray(((_localeData$locale = localeData[locale]) === null || _localeData$locale === void 0 ? void 0 : _localeData$locale.fallbackLocales) || []), ['en']);
                          var _iterator3 = _createForOfIteratorHelper(locales),
                            _step3;
                          try {
                            for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                              var testLocale = _step3.value;
                              var title = lookupSpecificTitleTranslation(testLocale);
                              if (title) {
                                return title;
                              }
                            }
                          } catch (err) {
                            _iterator3.e(err);
                          } finally {
                            _iterator3.f();
                          }
                          throw new Error("could not compute fallback title for locale ".concat(locale));
                        };
                        checkTitle = /*#__PURE__*/function () {
                          var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(locale, lookupLocale) {
                            var actualTitle, expectedTitle;
                            return _regeneratorRuntime().wrap(function _callee5$(_context5) {
                              while (1) switch (_context5.prev = _context5.next) {
                                case 0:
                                  _context5.next = 2;
                                  return getTitle(locale);
                                case 2:
                                  actualTitle = _context5.sent;
                                  expectedTitle = lookupFallbackTitle(lookupLocale);
                                  if (!actualTitle.includes(expectedTitle)) {
                                    _context5.next = 8;
                                    break;
                                  }
                                  return _context5.abrupt("return", null);
                                case 8:
                                  return _context5.abrupt("return", "Actual title ".concat(JSON.stringify(actualTitle), " does not match expected title ").concat(JSON.stringify(expectedTitle), " for locale ").concat(locale, " / ").concat(lookupLocale));
                                case 9:
                                case "end":
                                  return _context5.stop();
                              }
                            }, _callee5);
                          }));
                          return function checkTitle(_x5, _x6) {
                            return _ref6.apply(this, arguments);
                          };
                        }();
                        _context6.next = 37;
                        return checkTitle('es');
                      case 37:
                        esTitleError = _context6.sent;
                        if (esTitleError) {
                          console.log("  es title error: ".concat(esTitleError));
                        }
                        _context6.next = 41;
                        return checkTitle('spa', 'es');
                      case 41:
                        spaTitleError = _context6.sent;
                        if (spaTitleError) {
                          console.log("  spa title error: ".concat(spaTitleError));
                        }
                        _context6.next = 45;
                        return checkTitle('ES_PY', 'es_PY');
                      case 45:
                        espyTitleError = _context6.sent;
                        if (espyTitleError) {
                          console.log("  ES_PY title error: ".concat(espyTitleError));
                        }
                        _context6.next = 50;
                        break;
                      case 49:
                        console.log('    (could not find title string key)');
                      case 50:
                        if (!TEST_ANALYTICS) {
                          _context6.next = 73;
                          break;
                        }
                        plainURL = url;
                        _context6.t0 = analyzeURLs;
                        _context6.next = 55;
                        return getLoadedURLs(plainURL);
                      case 55:
                        _context6.t1 = _context6.sent;
                        plainAnalysis = (0, _context6.t0)(_context6.t1);
                        if (!plainAnalysis.sentGoogleAnalytics) {
                          console.log('  No Google Analytics sent', plainURL);
                        }
                        if (!plainAnalysis.sentYotta) {
                          console.log('  No yotta sent', plainURL);
                        }
                        yottaFalseURL = "".concat(url, "&yotta=false");
                        _context6.t2 = analyzeURLs;
                        _context6.next = 63;
                        return getLoadedURLs(yottaFalseURL);
                      case 63:
                        _context6.t3 = _context6.sent;
                        yottaFalseAnalysis = (0, _context6.t2)(_context6.t3);
                        if (yottaFalseAnalysis.sentExternalRequest || yottaFalseAnalysis.sentGoogleAnalytics || yottaFalseAnalysis.sentYotta) {
                          console.log('  yotta=false sent something', yottaFalseAnalysis);
                        }
                        yottaSomeFlagURL = "".concat(url, "&").concat(demoYottaQueryParameterKey, "=").concat(demoYottaQueryParameterValue);
                        _context6.t4 = analyzeURLs;
                        _context6.next = 70;
                        return getLoadedURLs(yottaSomeFlagURL);
                      case 70:
                        _context6.t5 = _context6.sent;
                        yottaSomeFlagAnalysis = (0, _context6.t4)(_context6.t5);
                        if (!yottaSomeFlagAnalysis.hasDemoYottaQueryParameter) {
                          console.log("  No ".concat(demoYottaQueryParameterKey, "=").concat(demoYottaQueryParameterValue, " sent"), yottaSomeFlagAnalysis);
                        }
                      case 73:
                      case "end":
                        return _context6.stop();
                    }
                  }, _loop2);
                });
                _iterator2.s();
              case 9:
                if ((_step2 = _iterator2.n()).done) {
                  _context7.next = 13;
                  break;
                }
                return _context7.delegateYield(_loop2(), "t0", 11);
              case 11:
                _context7.next = 9;
                break;
              case 13:
                _context7.next = 18;
                break;
              case 15:
                _context7.prev = 15;
                _context7.t1 = _context7["catch"](6);
                _iterator2.e(_context7.t1);
              case 18:
                _context7.prev = 18;
                _iterator2.f();
                return _context7.finish(18);
              case 21:
              case "end":
                return _context7.stop();
            }
          }, _loop, null, [[6, 15, 18, 21]]);
        });
        _iterator.s();
      case 16:
        if ((_step = _iterator.n()).done) {
          _context8.next = 20;
          break;
        }
        return _context8.delegateYield(_loop(), "t2", 18);
      case 18:
        _context8.next = 16;
        break;
      case 20:
        _context8.next = 25;
        break;
      case 22:
        _context8.prev = 22;
        _context8.t3 = _context8["catch"](13);
        _iterator.e(_context8.t3);
      case 25:
        _context8.prev = 25;
        _iterator.f();
        return _context8.finish(25);
      case 28:
        browser.close();
      case 29:
      case "end":
        return _context8.stop();
    }
  }, _callee6, null, [[13, 22, 25, 28]]);
}))();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVnZW5lcmF0b3JSdW50aW1lIiwiZSIsInQiLCJyIiwiT2JqZWN0IiwicHJvdG90eXBlIiwibiIsImhhc093blByb3BlcnR5IiwibyIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJpIiwiU3ltYm9sIiwiYSIsIml0ZXJhdG9yIiwiYyIsImFzeW5jSXRlcmF0b3IiLCJ1IiwidG9TdHJpbmdUYWciLCJkZWZpbmUiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ3cmFwIiwiR2VuZXJhdG9yIiwiY3JlYXRlIiwiQ29udGV4dCIsIm1ha2VJbnZva2VNZXRob2QiLCJ0cnlDYXRjaCIsInR5cGUiLCJhcmciLCJjYWxsIiwiaCIsImwiLCJmIiwicyIsInkiLCJHZW5lcmF0b3JGdW5jdGlvbiIsIkdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlIiwicCIsImQiLCJnZXRQcm90b3R5cGVPZiIsInYiLCJ2YWx1ZXMiLCJnIiwiZGVmaW5lSXRlcmF0b3JNZXRob2RzIiwiZm9yRWFjaCIsIl9pbnZva2UiLCJBc3luY0l0ZXJhdG9yIiwiaW52b2tlIiwiX3R5cGVvZiIsInJlc29sdmUiLCJfX2F3YWl0IiwidGhlbiIsImNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnIiwiRXJyb3IiLCJkb25lIiwibWV0aG9kIiwiZGVsZWdhdGUiLCJtYXliZUludm9rZURlbGVnYXRlIiwic2VudCIsIl9zZW50IiwiZGlzcGF0Y2hFeGNlcHRpb24iLCJhYnJ1cHQiLCJUeXBlRXJyb3IiLCJyZXN1bHROYW1lIiwibmV4dCIsIm5leHRMb2MiLCJwdXNoVHJ5RW50cnkiLCJ0cnlMb2MiLCJjYXRjaExvYyIsImZpbmFsbHlMb2MiLCJhZnRlckxvYyIsInRyeUVudHJpZXMiLCJwdXNoIiwicmVzZXRUcnlFbnRyeSIsImNvbXBsZXRpb24iLCJyZXNldCIsImlzTmFOIiwibGVuZ3RoIiwiZGlzcGxheU5hbWUiLCJpc0dlbmVyYXRvckZ1bmN0aW9uIiwiY29uc3RydWN0b3IiLCJuYW1lIiwibWFyayIsInNldFByb3RvdHlwZU9mIiwiX19wcm90b19fIiwiYXdyYXAiLCJhc3luYyIsIlByb21pc2UiLCJrZXlzIiwicmV2ZXJzZSIsInBvcCIsInByZXYiLCJjaGFyQXQiLCJzbGljZSIsInN0b3AiLCJydmFsIiwiaGFuZGxlIiwiY29tcGxldGUiLCJmaW5pc2giLCJfY2F0Y2giLCJkZWxlZ2F0ZVlpZWxkIiwiYXN5bmNHZW5lcmF0b3JTdGVwIiwiZ2VuIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJpbmZvIiwiZXJyb3IiLCJfYXN5bmNUb0dlbmVyYXRvciIsImZuIiwic2VsZiIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsImVyciIsInVuZGVmaW5lZCIsInB1cHBldGVlckxvYWQiLCJyZXF1aXJlIiwiTWFpbnRlbmFuY2UiLCJ3aW5zdG9uIiwicHVwcGV0ZWVyIiwiZnMiLCJ0cmFuc3BvcnRzIiwiY29uc29sZSIsImxldmVsIiwiVEVTVF9MT0NBTEVTIiwiVEVTVF9BTkFMWVRJQ1MiLCJsb2NhbGVEYXRhIiwicmVhZEZpbGVTeW5jIiwiX2NhbGxlZTYiLCJicm93c2VyIiwiZ2V0QmFzZVVSTHMiLCJnZXRMb2FkZWRVUkxzIiwiZGVtb1lvdHRhUXVlcnlQYXJhbWV0ZXJLZXkiLCJkZW1vWW90dGFRdWVyeVBhcmFtZXRlclZhbHVlIiwiYW5hbHl6ZVVSTHMiLCJfaXRlcmF0b3IiLCJfc3RlcCIsIl9sb29wIiwiX2NhbGxlZTYkIiwiX2NvbnRleHQ4IiwibGF1bmNoIiwiX3JlZjIiLCJfY2FsbGVlIiwicmVsZWFzZUJyYW5jaCIsImJ1aWxkRGlyIiwidXJscyIsInVzZXNDaGlwcGVyMiIsInN0YW5kYWxvbmVQYXJhbXMiLCJwaGV0aW9TdWZmaXgiLCJfY2FsbGVlJCIsIl9jb250ZXh0IiwiY29uY2F0IiwicmVwbyIsImJyYW5jaCIsImJyYW5kcyIsImluY2x1ZGVzIiwiZ2V0UGhldGlvU3RhbmRhbG9uZVF1ZXJ5UGFyYW1ldGVyIiwiX3giLCJfcmVmMyIsIl9jYWxsZWUyIiwidXJsIiwiX2NhbGxlZTIkIiwiX2NvbnRleHQyIiwib25QYWdlQ3JlYXRpb24iLCJwYWdlIiwib24iLCJyZXF1ZXN0Iiwic3RhcnRzV2l0aCIsImdvdG9UaW1lb3V0Iiwid2FpdEFmdGVyTG9hZCIsIl94MiIsInNlbnRHb29nbGVBbmFseXRpY3MiLCJzb21lIiwic2VudFlvdHRhIiwic2VudEV4dGVybmFsUmVxdWVzdCIsImhhc0RlbW9Zb3R0YVF1ZXJ5UGFyYW1ldGVyIiwiVVJMU2VhcmNoUGFyYW1zIiwiVVJMIiwic2VhcmNoIiwiZ2V0IiwidDAiLCJfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlciIsImxvYWRBbGxNYWludGVuYW5jZUJyYW5jaGVzIiwidDEiLCJfaXRlcmF0b3IyIiwiX3N0ZXAyIiwiX2xvb3AyIiwiX2xvb3AkIiwiX2NvbnRleHQ3IiwibG9nIiwidG9TdHJpbmciLCJsb2NhbGVWYWx1ZXMiLCJnZXRSdW5uaW5nTG9jYWxlIiwiZXNMb2NhbGUiLCJzcGFMb2NhbGUiLCJlc3B5TG9jYWxlIiwiaW52YWxpZExvY2FsZSIsInJlcG9QYWNrYWdlT2JqZWN0IiwicGFydGlhbFBvdGVudGlhbFRpdGxlU3RyaW5nS2V5IiwiZnVsbFBvdGVudGlhbFRpdGxlU3RyaW5nS2V5IiwiaGFzVGl0bGVLZXkiLCJnZXRUaXRsZSIsImxvb2t1cFNwZWNpZmljVGl0bGVUcmFuc2xhdGlvbiIsImxvb2t1cEZhbGxiYWNrVGl0bGUiLCJjaGVja1RpdGxlIiwiZXNUaXRsZUVycm9yIiwic3BhVGl0bGVFcnJvciIsImVzcHlUaXRsZUVycm9yIiwicGxhaW5VUkwiLCJwbGFpbkFuYWx5c2lzIiwieW90dGFGYWxzZVVSTCIsInlvdHRhRmFsc2VBbmFseXNpcyIsInlvdHRhU29tZUZsYWdVUkwiLCJ5b3R0YVNvbWVGbGFnQW5hbHlzaXMiLCJfbG9vcDIkIiwiX2NvbnRleHQ2IiwiZXZhbHVhdGUiLCJfcGhldCRjaGlwcGVyJGxvY2FsZUQiLCJwaGV0IiwiY2hpcHBlciIsImVzX1BZIiwiX3JlZjQiLCJfY2FsbGVlMyIsImxvY2FsZSIsIl9jYWxsZWUzJCIsIl9jb250ZXh0MyIsIl94MyIsIkpTT04iLCJwYXJzZSIsInJlcXVpcmVqc05hbWVzcGFjZSIsIl9yZWY1IiwiX2NhbGxlZTQiLCJfY2FsbGVlNCQiLCJfY29udGV4dDQiLCJkb2N1bWVudCIsInRpdGxlIiwiX3g0IiwiX2pzb24kcGFydGlhbFBvdGVudGlhIiwiX2pzb24kcGFydGlhbFBvdGVudGlhMiIsImpzb24iLCJfbG9jYWxlRGF0YSRsb2NhbGUiLCJsb2NhbGVzIiwiX3RvQ29uc3VtYWJsZUFycmF5IiwiZmFsbGJhY2tMb2NhbGVzIiwiX2l0ZXJhdG9yMyIsIl9zdGVwMyIsInRlc3RMb2NhbGUiLCJfcmVmNiIsIl9jYWxsZWU1IiwibG9va3VwTG9jYWxlIiwiYWN0dWFsVGl0bGUiLCJleHBlY3RlZFRpdGxlIiwiX2NhbGxlZTUkIiwiX2NvbnRleHQ1Iiwic3RyaW5naWZ5IiwiX3g1IiwiX3g2IiwidDIiLCJ0MyIsInQ0IiwidDUiLCJjbG9zZSJdLCJzb3VyY2VzIjpbInJlbGVhc2UtYnJhbmNoLWNoZWNrcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ2hlY2tpbmcgeW90dGE9ZmFsc2UgKGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0Y29tbW9uL2lzc3Vlcy82NSkgYW5kIHlvdHRhKj0qXHJcbiAqIChodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldGNvbW1vbi9pc3N1ZXMvNjYpIGJlaGF2aW9yIG9uIG5vbi1yZWZyZXNoZWQgcmVsZWFzZSBicmFuY2hlcy5cclxuICpcclxuICogTk9URTogcmVmcmVzaCByZWxlYXNlIGJyYW5jaGVzIGlmIG5vdCBkb2luZyBhbiBhY3RpdmUgTVIuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBwdXBwZXRlZXJMb2FkID0gcmVxdWlyZSggJy4uLy4uL2NvbW1vbi9wdXBwZXRlZXJMb2FkJyApO1xyXG5jb25zdCBNYWludGVuYW5jZSA9IHJlcXVpcmUoICcuLi8uLi9jb21tb24vTWFpbnRlbmFuY2UnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuY29uc3QgcHVwcGV0ZWVyID0gcmVxdWlyZSggJ3B1cHBldGVlcicgKTtcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcblxyXG53aW5zdG9uLmRlZmF1bHQudHJhbnNwb3J0cy5jb25zb2xlLmxldmVsID0gJ2Vycm9yJztcclxuXHJcbmNvbnN0IFRFU1RfTE9DQUxFUyA9IHRydWU7XHJcbmNvbnN0IFRFU1RfQU5BTFlUSUNTID0gZmFsc2U7XHJcblxyXG5jb25zdCBsb2NhbGVEYXRhID0gZnMucmVhZEZpbGVTeW5jKCAnLi4vYmFiZWwvbG9jYWxlRGF0YS5qc29uJywgJ3V0ZjgnICk7XHJcblxyXG4oIGFzeW5jICgpID0+IHtcclxuICBjb25zdCBicm93c2VyID0gYXdhaXQgcHVwcGV0ZWVyLmxhdW5jaCgge1xyXG4gICAgYXJnczogW1xyXG4gICAgICAnLS1kaXNhYmxlLWdwdSdcclxuICAgIF1cclxuICB9ICk7XHJcblxyXG4gIGNvbnN0IGdldEJhc2VVUkxzID0gYXN5bmMgcmVsZWFzZUJyYW5jaCA9PiB7XHJcbiAgICBjb25zdCBidWlsZERpciA9IGBodHRwOi8vbG9jYWxob3N0L3JlbGVhc2UtYnJhbmNoZXMvJHtyZWxlYXNlQnJhbmNoLnJlcG99LSR7cmVsZWFzZUJyYW5jaC5icmFuY2h9LyR7cmVsZWFzZUJyYW5jaC5yZXBvfS9idWlsZGA7XHJcblxyXG4gICAgY29uc3QgdXJscyA9IFtdO1xyXG5cclxuICAgIGNvbnN0IHVzZXNDaGlwcGVyMiA9IGF3YWl0IHJlbGVhc2VCcmFuY2gudXNlc0NoaXBwZXIyKCk7XHJcblxyXG4gICAgaWYgKCByZWxlYXNlQnJhbmNoLmJyYW5kcy5pbmNsdWRlcyggJ3BoZXQnICkgKSB7XHJcbiAgICAgIHVybHMucHVzaCggYCR7YnVpbGREaXJ9LyR7dXNlc0NoaXBwZXIyID8gJ3BoZXQvJyA6ICcnfSR7cmVsZWFzZUJyYW5jaC5yZXBvfV9hbGwke3VzZXNDaGlwcGVyMiA/ICdfcGhldCcgOiAnJ30uaHRtbD93ZWJnbD1mYWxzZWAgKTtcclxuICAgIH1cclxuICAgIGlmICggcmVsZWFzZUJyYW5jaC5icmFuZHMuaW5jbHVkZXMoICdwaGV0LWlvJyApICkge1xyXG4gICAgICBjb25zdCBzdGFuZGFsb25lUGFyYW1zID0gYXdhaXQgcmVsZWFzZUJyYW5jaC5nZXRQaGV0aW9TdGFuZGFsb25lUXVlcnlQYXJhbWV0ZXIoKTtcclxuXHJcbiAgICAgIGNvbnN0IHBoZXRpb1N1ZmZpeCA9IHVzZXNDaGlwcGVyMiA/ICdfYWxsX3BoZXQtaW8nIDogJ19lbi1waGV0aW8nO1xyXG5cclxuICAgICAgdXJscy5wdXNoKCBgJHtidWlsZERpcn0vJHt1c2VzQ2hpcHBlcjIgPyAncGhldC1pby8nIDogJyd9JHtyZWxlYXNlQnJhbmNoLnJlcG99JHtwaGV0aW9TdWZmaXh9Lmh0bWw/JHtzdGFuZGFsb25lUGFyYW1zfSZ3ZWJnbD1mYWxzZWAgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdXJscztcclxuICB9O1xyXG5cclxuICBjb25zdCBnZXRMb2FkZWRVUkxzID0gYXN5bmMgdXJsID0+IHtcclxuICAgIGNvbnN0IHVybHMgPSBbXTtcclxuXHJcbiAgICBhd2FpdCBwdXBwZXRlZXJMb2FkKCB1cmwsIHtcclxuICAgICAgb25QYWdlQ3JlYXRpb246IHBhZ2UgPT4gcGFnZS5vbiggJ3JlcXVlc3QnLCByZXF1ZXN0ID0+IHtcclxuICAgICAgICBjb25zdCB1cmwgPSByZXF1ZXN0LnVybCgpO1xyXG5cclxuICAgICAgICBpZiAoICF1cmwuc3RhcnRzV2l0aCggJ2RhdGE6JyApICkge1xyXG4gICAgICAgICAgdXJscy5wdXNoKCB1cmwgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKSxcclxuICAgICAgZ290b1RpbWVvdXQ6IDYwMDAwLFxyXG4gICAgICB3YWl0QWZ0ZXJMb2FkOiAyMDAwLFxyXG4gICAgICBicm93c2VyOiBicm93c2VyXHJcbiAgICB9ICk7XHJcblxyXG4gICAgcmV0dXJuIHVybHM7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgZGVtb1lvdHRhUXVlcnlQYXJhbWV0ZXJLZXkgPSAneW90dGFTb21lRmxhZyc7XHJcbiAgY29uc3QgZGVtb1lvdHRhUXVlcnlQYXJhbWV0ZXJWYWx1ZSA9ICdzb21lVmFsdWUnO1xyXG5cclxuICBjb25zdCBhbmFseXplVVJMcyA9IHVybHMgPT4ge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc2VudEdvb2dsZUFuYWx5dGljczogdXJscy5zb21lKCB1cmwgPT4gdXJsLmluY2x1ZGVzKCAnY29sbGVjdD8nICkgKSxcclxuICAgICAgc2VudFlvdHRhOiB1cmxzLnNvbWUoIHVybCA9PiB1cmwuaW5jbHVkZXMoICd5b3R0YS9pbW1lZGlhdGUuZ2lmJyApICksXHJcbiAgICAgIHNlbnRFeHRlcm5hbFJlcXVlc3Q6IHVybHMuc29tZSggdXJsID0+ICF1cmwuc3RhcnRzV2l0aCggJ2h0dHA6Ly9sb2NhbGhvc3QnICkgKSxcclxuICAgICAgaGFzRGVtb1lvdHRhUXVlcnlQYXJhbWV0ZXI6IHVybHMuc29tZSggdXJsID0+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFVSTFNlYXJjaFBhcmFtcyggbmV3IFVSTCggdXJsICkuc2VhcmNoICkuZ2V0KCBkZW1vWW90dGFRdWVyeVBhcmFtZXRlcktleSApID09PSBkZW1vWW90dGFRdWVyeVBhcmFtZXRlclZhbHVlO1xyXG4gICAgICB9IClcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgZm9yICggY29uc3QgcmVsZWFzZUJyYW5jaCBvZiBhd2FpdCBNYWludGVuYW5jZS5sb2FkQWxsTWFpbnRlbmFuY2VCcmFuY2hlcygpICkge1xyXG4gICAgY29uc29sZS5sb2coIHJlbGVhc2VCcmFuY2gudG9TdHJpbmcoKSApO1xyXG5cclxuICAgIGNvbnN0IHVybHMgPSBhd2FpdCBnZXRCYXNlVVJMcyggcmVsZWFzZUJyYW5jaCApO1xyXG5cclxuICAgIGZvciAoIGNvbnN0IHVybCBvZiB1cmxzICkge1xyXG5cclxuICAgICAgaWYgKCBURVNUX0xPQ0FMRVMgKSB7XHJcbiAgICAgICAgLy8gVE9ETzogdGVzdCB1bmJ1aWx0IGxvY2FsZXMgKGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvOTYzKVxyXG5cclxuICAgICAgICAvLyBDaGVjayBsb2NhbGUgTVIuIGVzX1BZIHNob3VsZCBhbHdheXMgYmUgaW4gbG9jYWxlRGF0YVxyXG4gICAgICAgIGNvbnN0IGxvY2FsZVZhbHVlcyA9IGF3YWl0IHB1cHBldGVlckxvYWQoIHVybCwge1xyXG4gICAgICAgICAgZXZhbHVhdGU6ICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIFsgISFwaGV0LmNoaXBwZXIubG9jYWxlRGF0YSwgISEoIHBoZXQuY2hpcHBlci5sb2NhbGVEYXRhPy5lc19QWSApIF07XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZ290b1RpbWVvdXQ6IDYwMDAwLFxyXG4gICAgICAgICAgd2FpdEFmdGVyTG9hZDogMjAwMCxcclxuICAgICAgICAgIGJyb3dzZXI6IGJyb3dzZXJcclxuICAgICAgICB9ICk7XHJcbiAgICAgICAgaWYgKCAhbG9jYWxlVmFsdWVzWyAwIF0gKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggJyAgbm8gbG9jYWxlRGF0YScgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCAhbG9jYWxlVmFsdWVzWyAxIF0gKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggJyAgbm8gZXNfUFkgbG9jYWxlRGF0YScgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGdldFJ1bm5pbmdMb2NhbGUgPSBhc3luYyBsb2NhbGUgPT4ge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHB1cHBldGVlckxvYWQoIHVybC5pbmNsdWRlcyggJz8nICkgPyBgJHt1cmx9JmxvY2FsZT0ke2xvY2FsZX1gIDogYCR7dXJsfT9sb2NhbGU9JHtsb2NhbGV9YCwge1xyXG4gICAgICAgICAgICAgIGV2YWx1YXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGhldC5jaGlwcGVyLmxvY2FsZTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGdvdG9UaW1lb3V0OiA2MDAwMCxcclxuICAgICAgICAgICAgICB3YWl0QWZ0ZXJMb2FkOiAyMDAwLFxyXG4gICAgICAgICAgICAgIGJyb3dzZXI6IGJyb3dzZXJcclxuICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY2F0Y2ggKCBlICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggYCAgZXJyb3IgcnVubmluZyB3aXRoIGxvY2FsZT0ke2xvY2FsZX1gKTtcclxuICAgICAgICAgICAgcmV0dXJuICdlcnJvcic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgZXNMb2NhbGUgPSBhd2FpdCBnZXRSdW5uaW5nTG9jYWxlKCAnZXMnICk7XHJcbiAgICAgICAgaWYgKCBlc0xvY2FsZSAhPT0gJ2VzJyApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCAnICBlcyBsb2NhbGUgbm90IGVzJyApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3BhTG9jYWxlID0gYXdhaXQgZ2V0UnVubmluZ0xvY2FsZSggJ3NwYScgKTtcclxuICAgICAgICBpZiAoIHNwYUxvY2FsZSAhPT0gJ2VzJyApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCAnICBzcGEgbG9jYWxlIG5vdCBlcycgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGVzcHlMb2NhbGUgPSBhd2FpdCBnZXRSdW5uaW5nTG9jYWxlKCAnRVNfUFknICk7XHJcbiAgICAgICAgaWYgKCBlc3B5TG9jYWxlICE9PSAnZXMnICYmIGVzcHlMb2NhbGUgIT09ICdlc19QWScgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggJyAgRVNfUFkgbG9jYWxlIG5vdCBlcy9lc19QWScgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGludmFsaWRMb2NhbGUgPSBhd2FpdCBnZXRSdW5uaW5nTG9jYWxlKCAnYWVucnRweWFybnRTUlRTJyApO1xyXG4gICAgICAgIGlmICggaW52YWxpZExvY2FsZSAhPT0gJ2VuJyApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCAnICBpbnZhbGlkIGxvY2FsZSBpc3N1ZSwgbm90IGVuJyApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmVwb1BhY2thZ2VPYmplY3QgPSBKU09OLnBhcnNlKCBmcy5yZWFkRmlsZVN5bmMoIGAuLi8ke3JlbGVhc2VCcmFuY2gucmVwb30vcGFja2FnZS5qc29uYCwgJ3V0ZjgnICkgKTtcclxuXHJcbiAgICAgICAgY29uc3QgcGFydGlhbFBvdGVudGlhbFRpdGxlU3RyaW5nS2V5ID0gYCR7cmVwb1BhY2thZ2VPYmplY3QucGhldC5yZXF1aXJlanNOYW1lc3BhY2V9LyR7cmVsZWFzZUJyYW5jaC5yZXBvfS50aXRsZWA7XHJcbiAgICAgICAgY29uc3QgZnVsbFBvdGVudGlhbFRpdGxlU3RyaW5nS2V5ID0gYCR7cmVwb1BhY2thZ2VPYmplY3QucGhldC5yZXF1aXJlanNOYW1lc3BhY2V9LyR7cGFydGlhbFBvdGVudGlhbFRpdGxlU3RyaW5nS2V5fWA7XHJcblxyXG4gICAgICAgIGNvbnN0IGhhc1RpdGxlS2V5ID0gYXdhaXQgcHVwcGV0ZWVyTG9hZCggdXJsLCB7XHJcbiAgICAgICAgICBldmFsdWF0ZTogYCEhcGhldC5jaGlwcGVyLnN0cmluZ3MuZW5bIFwiJHtmdWxsUG90ZW50aWFsVGl0bGVTdHJpbmdLZXl9XCIgXWAsXHJcbiAgICAgICAgICBnb3RvVGltZW91dDogNjAwMDAsXHJcbiAgICAgICAgICB3YWl0QWZ0ZXJMb2FkOiAyMDAwLFxyXG4gICAgICAgICAgYnJvd3NlcjogYnJvd3NlclxyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgaWYgKCBoYXNUaXRsZUtleSApIHtcclxuICAgICAgICAgIGNvbnN0IGdldFRpdGxlID0gYXN5bmMgbG9jYWxlID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgcHVwcGV0ZWVyTG9hZCggdXJsLmluY2x1ZGVzKCAnPycgKSA/IGAke3VybH0mbG9jYWxlPSR7bG9jYWxlfWAgOiBgJHt1cmx9P2xvY2FsZT0ke2xvY2FsZX1gLCB7XHJcbiAgICAgICAgICAgICAgICBldmFsdWF0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQudGl0bGU7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZ290b1RpbWVvdXQ6IDYwMDAwLFxyXG4gICAgICAgICAgICAgICAgd2FpdEFmdGVyTG9hZDogMjAwMCxcclxuICAgICAgICAgICAgICAgIGJyb3dzZXI6IGJyb3dzZXJcclxuICAgICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKCBlICkge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgICBlcnJvciBydW5uaW5nIHdpdGggbG9jYWxlPSR7bG9jYWxlfWApO1xyXG4gICAgICAgICAgICAgIHJldHVybiAnZXJyb3InO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIC8vIG51bGwgaWYgY291bGQgbm90IGJlIGZvdW5kXHJcbiAgICAgICAgICBjb25zdCBsb29rdXBTcGVjaWZpY1RpdGxlVHJhbnNsYXRpb24gPSBsb2NhbGUgPT4ge1xyXG4gICAgICAgICAgICBsZXQganNvbjtcclxuICAgICAgICAgICAgaWYgKCBsb2NhbGUgPT09ICdlbicgKSB7XHJcbiAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggYC4uLyR7cmVsZWFzZUJyYW5jaC5yZXBvfS8ke3JlbGVhc2VCcmFuY2gucmVwb30tc3RyaW5nc19lbi5qc29uYCwgJ3V0ZjgnICkgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggYC4uL2JhYmVsLyR7cmVsZWFzZUJyYW5jaC5yZXBvfS8ke3JlbGVhc2VCcmFuY2gucmVwb30tc3RyaW5nc18ke2xvY2FsZX0uanNvbmAsICd1dGY4JyApICk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGNhdGNoICggZSApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4ganNvblsgcGFydGlhbFBvdGVudGlhbFRpdGxlU3RyaW5nS2V5IF0/LnZhbHVlID8/IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIGNvbnN0IGxvb2t1cEZhbGxiYWNrVGl0bGUgPSBsb2NhbGUgPT4ge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbG9jYWxlcyA9IFtcclxuICAgICAgICAgICAgICBsb2NhbGUsXHJcbiAgICAgICAgICAgICAgLi4uKCBsb2NhbGVEYXRhWyBsb2NhbGUgXT8uZmFsbGJhY2tMb2NhbGVzIHx8IFtdICksXHJcbiAgICAgICAgICAgICAgJ2VuJ1xyXG4gICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgZm9yICggY29uc3QgdGVzdExvY2FsZSBvZiBsb2NhbGVzICkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gbG9va3VwU3BlY2lmaWNUaXRsZVRyYW5zbGF0aW9uKCB0ZXN0TG9jYWxlICk7XHJcbiAgICAgICAgICAgICAgaWYgKCB0aXRsZSApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aXRsZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYGNvdWxkIG5vdCBjb21wdXRlIGZhbGxiYWNrIHRpdGxlIGZvciBsb2NhbGUgJHtsb2NhbGV9YCApO1xyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBjb25zdCBjaGVja1RpdGxlID0gYXN5bmMgKCBsb2NhbGUsIGxvb2t1cExvY2FsZSApID0+IHtcclxuICAgICAgICAgICAgY29uc3QgYWN0dWFsVGl0bGUgPSBhd2FpdCBnZXRUaXRsZSggbG9jYWxlICk7XHJcbiAgICAgICAgICAgIGNvbnN0IGV4cGVjdGVkVGl0bGUgPSBsb29rdXBGYWxsYmFja1RpdGxlKCBsb29rdXBMb2NhbGUgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggYWN0dWFsVGl0bGUuaW5jbHVkZXMoIGV4cGVjdGVkVGl0bGUgKSApIHtcclxuICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4gYEFjdHVhbCB0aXRsZSAke0pTT04uc3RyaW5naWZ5KCBhY3R1YWxUaXRsZSApfSBkb2VzIG5vdCBtYXRjaCBleHBlY3RlZCB0aXRsZSAke0pTT04uc3RyaW5naWZ5KCBleHBlY3RlZFRpdGxlICl9IGZvciBsb2NhbGUgJHtsb2NhbGV9IC8gJHtsb29rdXBMb2NhbGV9YDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBjb25zdCBlc1RpdGxlRXJyb3IgPSBhd2FpdCBjaGVja1RpdGxlKCAnZXMnICk7XHJcbiAgICAgICAgICBpZiAoIGVzVGl0bGVFcnJvciApIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coIGAgIGVzIHRpdGxlIGVycm9yOiAke2VzVGl0bGVFcnJvcn1gICk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3Qgc3BhVGl0bGVFcnJvciA9IGF3YWl0IGNoZWNrVGl0bGUoICdzcGEnLCAnZXMnICk7XHJcbiAgICAgICAgICBpZiAoIHNwYVRpdGxlRXJyb3IgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgICBzcGEgdGl0bGUgZXJyb3I6ICR7c3BhVGl0bGVFcnJvcn1gICk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3QgZXNweVRpdGxlRXJyb3IgPSBhd2FpdCBjaGVja1RpdGxlKCAnRVNfUFknLCAnZXNfUFknICk7XHJcbiAgICAgICAgICBpZiAoIGVzcHlUaXRsZUVycm9yICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggYCAgRVNfUFkgdGl0bGUgZXJyb3I6ICR7ZXNweVRpdGxlRXJyb3J9YCApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCAnICAgIChjb3VsZCBub3QgZmluZCB0aXRsZSBzdHJpbmcga2V5KScgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggVEVTVF9BTkFMWVRJQ1MgKSB7XHJcbiAgICAgICAgY29uc3QgcGxhaW5VUkwgPSB1cmw7XHJcbiAgICAgICAgY29uc3QgcGxhaW5BbmFseXNpcyA9IGFuYWx5emVVUkxzKCBhd2FpdCBnZXRMb2FkZWRVUkxzKCBwbGFpblVSTCApICk7XHJcbiAgICAgICAgaWYgKCAhcGxhaW5BbmFseXNpcy5zZW50R29vZ2xlQW5hbHl0aWNzICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coICcgIE5vIEdvb2dsZSBBbmFseXRpY3Mgc2VudCcsIHBsYWluVVJMICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggIXBsYWluQW5hbHlzaXMuc2VudFlvdHRhICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coICcgIE5vIHlvdHRhIHNlbnQnLCBwbGFpblVSTCApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgeW90dGFGYWxzZVVSTCA9IGAke3VybH0meW90dGE9ZmFsc2VgO1xyXG4gICAgICAgIGNvbnN0IHlvdHRhRmFsc2VBbmFseXNpcyA9IGFuYWx5emVVUkxzKCBhd2FpdCBnZXRMb2FkZWRVUkxzKCB5b3R0YUZhbHNlVVJMICkgKTtcclxuICAgICAgICBpZiAoIHlvdHRhRmFsc2VBbmFseXNpcy5zZW50RXh0ZXJuYWxSZXF1ZXN0IHx8IHlvdHRhRmFsc2VBbmFseXNpcy5zZW50R29vZ2xlQW5hbHl0aWNzIHx8IHlvdHRhRmFsc2VBbmFseXNpcy5zZW50WW90dGEgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggJyAgeW90dGE9ZmFsc2Ugc2VudCBzb21ldGhpbmcnLCB5b3R0YUZhbHNlQW5hbHlzaXMgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHlvdHRhU29tZUZsYWdVUkwgPSBgJHt1cmx9JiR7ZGVtb1lvdHRhUXVlcnlQYXJhbWV0ZXJLZXl9PSR7ZGVtb1lvdHRhUXVlcnlQYXJhbWV0ZXJWYWx1ZX1gO1xyXG4gICAgICAgIGNvbnN0IHlvdHRhU29tZUZsYWdBbmFseXNpcyA9IGFuYWx5emVVUkxzKCBhd2FpdCBnZXRMb2FkZWRVUkxzKCB5b3R0YVNvbWVGbGFnVVJMICkgKTtcclxuICAgICAgICBpZiAoICF5b3R0YVNvbWVGbGFnQW5hbHlzaXMuaGFzRGVtb1lvdHRhUXVlcnlQYXJhbWV0ZXIgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgTm8gJHtkZW1vWW90dGFRdWVyeVBhcmFtZXRlcktleX09JHtkZW1vWW90dGFRdWVyeVBhcmFtZXRlclZhbHVlfSBzZW50YCwgeW90dGFTb21lRmxhZ0FuYWx5c2lzICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBDb25zaWRlciBhZGRpbmcgZnV6emluZyBpbiB0aGUgZnV0dXJlLCBpdCBzZWVtcyBsaWtlIHdlJ3JlIHVuYWJsZSB0byBnZXQgdGhpbmdzIHRvIHJ1biBhZnRlciBhIGZ1enogZmFpbHVyZSB0aG91Z2hcclxuICAgICAgLy8gY29uc3QgZnV6elVSTCA9IGAke3VybH0mZnV6eiZmdXp6TW91c2UmZnV6elRvdWNoJmZ1enpCb2FyZGA7XHJcbiAgICAgIC8vIHRyeSB7XHJcbiAgICAgIC8vICAgYXdhaXQgcHVwcGV0ZWVyTG9hZCggZnV6elVSTCwge1xyXG4gICAgICAvLyAgICAgd2FpdEZvckZ1bmN0aW9uOiAnd2luZG93LnBoZXQuam9pc3Quc2ltJyxcclxuICAgICAgLy8gICAgIGdvdG9UaW1lb3V0OiA2MDAwMCxcclxuICAgICAgLy8gICAgIHdhaXRBZnRlckxvYWQ6IDUwMDAsXHJcbiAgICAgIC8vICAgICBicm93c2VyOiBicm93c2VyXHJcbiAgICAgIC8vICAgfSApO1xyXG4gICAgICAvLyB9XHJcbiAgICAgIC8vIGNhdGNoKCBlICkge1xyXG4gICAgICAvLyAgIGNvbnNvbGUubG9nKCBgZnV6eiBmYWlsdXJlIG9uICR7ZnV6elVSTH06XFxuJHtlfWAgKTtcclxuICAgICAgLy8gfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYnJvd3Nlci5jbG9zZSgpO1xyXG59ICkoKTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7K0NBQ0EscUpBQUFBLG1CQUFBLFlBQUFBLG9CQUFBLFdBQUFDLENBQUEsU0FBQUMsQ0FBQSxFQUFBRCxDQUFBLE9BQUFFLENBQUEsR0FBQUMsTUFBQSxDQUFBQyxTQUFBLEVBQUFDLENBQUEsR0FBQUgsQ0FBQSxDQUFBSSxjQUFBLEVBQUFDLENBQUEsR0FBQUosTUFBQSxDQUFBSyxjQUFBLGNBQUFQLENBQUEsRUFBQUQsQ0FBQSxFQUFBRSxDQUFBLElBQUFELENBQUEsQ0FB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O2dCQUFBO2dCQUFBRixVQUFBLENBQUF6SixDQUFBO2NBQUE7Z0JBQUEsS0FBQTBKLE1BQUEsR0FBQUQsVUFBQSxDQUFBdEwsQ0FBQSxJQUFBa0QsSUFBQTtrQkFBQXdJLFNBQUEsQ0FBQTlILElBQUE7a0JBQUE7Z0JBQUE7Z0JBQUEsT0FBQThILFNBQUEsQ0FBQTFGLGFBQUEsQ0FBQXdGLE1BQUE7Y0FBQTtnQkFBQUUsU0FBQSxDQUFBOUgsSUFBQTtnQkFBQTtjQUFBO2dCQUFBOEgsU0FBQSxDQUFBOUgsSUFBQTtnQkFBQTtjQUFBO2dCQUFBOEgsU0FBQSxDQUFBbkcsSUFBQTtnQkFBQW1HLFNBQUEsQ0FBQUwsRUFBQSxHQUFBSyxTQUFBO2dCQUFBSixVQUFBLENBQUEzTCxDQUFBLENBQUErTCxTQUFBLENBQUFMLEVBQUE7Y0FBQTtnQkFBQUssU0FBQSxDQUFBbkcsSUFBQTtnQkFBQStGLFVBQUEsQ0FBQTFKLENBQUE7Z0JBQUEsT0FBQThKLFNBQUEsQ0FBQTVGLE1BQUE7Y0FBQTtjQUFBO2dCQUFBLE9BQUE0RixTQUFBLENBQUFoRyxJQUFBO1lBQUE7VUFBQSxHQUFBNkMsS0FBQTtRQUFBO1FBQUFGLFNBQUEsQ0FBQXhHLENBQUE7TUFBQTtRQUFBLEtBQUF5RyxLQUFBLEdBQUFELFNBQUEsQ0FBQXJJLENBQUEsSUFBQWtELElBQUE7VUFBQXVGLFNBQUEsQ0FBQTdFLElBQUE7VUFBQTtRQUFBO1FBQUEsT0FBQTZFLFNBQUEsQ0FBQXpDLGFBQUEsQ0FBQXVDLEtBQUE7TUFBQTtRQUFBRSxTQUFBLENBQUE3RSxJQUFBO1FBQUE7TUFBQTtRQUFBNkUsU0FBQSxDQUFBN0UsSUFBQTtRQUFBO01BQUE7UUFBQTZFLFNBQUEsQ0FBQWxELElBQUE7UUFBQWtELFNBQUEsQ0FBQXVILEVBQUEsR0FBQXZILFNBQUE7UUFBQUosU0FBQSxDQUFBMUksQ0FBQSxDQUFBOEksU0FBQSxDQUFBdUgsRUFBQTtNQUFBO1FBQUF2SCxTQUFBLENBQUFsRCxJQUFBO1FBQUE4QyxTQUFBLENBQUF6RyxDQUFBO1FBQUEsT0FBQTZHLFNBQUEsQ0FBQTNDLE1BQUE7TUFBQTtRQW1CUGlDLE9BQU8sQ0FBQ29JLEtBQUssQ0FBQyxDQUFDO01BQUM7TUFBQTtRQUFBLE9BQUExSCxTQUFBLENBQUEvQyxJQUFBO0lBQUE7RUFBQSxHQUFBb0MsUUFBQTtBQUFBLENBQ2pCLEdBQUcsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==