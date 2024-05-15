"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
// Copyright 2017-2022, University of Colorado Boulder

/**
 * Uses a browser to see whether a page loads without an error. Throws errors it receives.
 *
 * Supports multiple supported browsers from puppeteer and playwright. Must provide a browserCreator from either with a
 * `launch()` interface.
 * There are now many more features of this class. It is best to see its functionality by looking at options.
 *
 * To support authentication, we use process.env.BASIC_PASSWORD and process.env.BASIC_USERNAME, set those before calling
 * this function.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

var sleep = require('./sleep');
var _ = require('lodash');
var winston = require('../../../../../../perennial-alias/node_modules/winston');
var puppeteer = require('puppeteer');
var assert = require('assert');

/**
 * Uses puppeteer to see whether a page loads without an error
 * @public
 *
 * Rejects if encountering an error loading the page OR (with option provided within the puppeteer page itself).
 *
 * @param {Browser} browserCreator - either `puppeteer` or a specific Browser from playright
 * @param {string} url
 * @param {Object} [options]
 * @returns {Promise.<null|*>} - The eval result/null
 */
module.exports = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(browserCreator, url, options) {
    var pageLoaded, ownsBrowser, browser, page, cleanup, username, password, resolve, reject, promise, timeoutID, result;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          pageLoaded = false;
          options = _.merge({
            // See https://github.com/puppeteer/puppeteer/blob/v14.1.1/docs/api.md#puppeteerlaunchoptions
            // Make sure to provide options that work with your browserCreator (playwright or puppeteer)
            launchOptions: {
              args: ['--disable-gpu']
            },
            browser: null,
            // If provided, browserCreator is not used to create a browser, and this browser is not closed.

            evaluate: null,
            // {function|null}
            waitForFunction: null,
            // {string|null}

            rejectPageErrors: true,
            // reject when the page errors
            rejectErrors: true,
            // reject when there is an error with the browser

            // By default, once loaded we resolve, but opt out of this here. If you set to false, you must resolve in custom logic in onPageCreation
            resolveFromLoad: true,
            waitAfterLoad: 5000,
            // milliseconds
            allowedTimeToLoad: 40000,
            // milliseconds
            gotoTimeout: 30000,
            // milliseconds

            // Callback when logic is not complete after timeout of length: allowedTimeToLoad.
            onLoadTimeout: function onLoadTimeout(resolve, reject) {
              if (!pageLoaded) {
                options.logger('puppeteer page not loaded');
                reject(new Error("Did not load in ".concat(options.allowedTimeToLoad)));
              }
            },
            onPageCreation: null,
            // {function(page, resolve,reject):Promise<void>|null} - any extra items you want to do with the page before goto is called
            evaluateOnNewDocument: null,
            // {function|null} page.evaluateOnNewDocument for puppeteer, and addInitScript for playwrite

            cachePages: true,
            logConsoleOutput: false,
            // if true, this process will log all messages that come from page.on( 'console' )
            logNavigation: false,
            // if true, this process will log all messages that come from page.on( 'frame*' )
            logger: winston.info // {function(message)} pass in `console.log` if you are running in a context that doesn't use winston
          }, options);
          !options.resolveFromLoad && assert(options.onPageCreation, 'must resolve from onPageCreation');
          ownsBrowser = !options.browser;
          cleanup = /*#__PURE__*/function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
              return _regeneratorRuntime().wrap(function _callee$(_context) {
                while (1) switch (_context.prev = _context.next) {
                  case 0:
                    _context.t0 = page && !page.isClosed();
                    if (!_context.t0) {
                      _context.next = 4;
                      break;
                    }
                    _context.next = 4;
                    return page.close();
                  case 4:
                    _context.t1 = ownsBrowser && browser;
                    if (!_context.t1) {
                      _context.next = 8;
                      break;
                    }
                    _context.next = 8;
                    return browser.close();
                  case 8:
                  case "end":
                    return _context.stop();
                }
              }, _callee);
            }));
            return function cleanup() {
              return _ref2.apply(this, arguments);
            };
          }();
          _context7.prev = 5;
          _context7.t0 = options.browser;
          if (_context7.t0) {
            _context7.next = 11;
            break;
          }
          _context7.next = 10;
          return browserCreator.launch(options.launchOptions);
        case 10:
          _context7.t0 = _context7.sent;
        case 11:
          browser = _context7.t0;
          _context7.next = 14;
          return browser.newPage();
        case 14:
          page = _context7.sent;
          page.setCacheEnabled && page.setCacheEnabled(options.cachePages);
          _context7.next = 18;
          return page.setDefaultNavigationTimeout(options.gotoTimeout);
        case 18:
          // The API for playwright was much more complicated, so just support puppeteer
          username = process.env.BASIC_USERNAME;
          password = process.env.BASIC_PASSWORD;
          if (!(username && password)) {
            _context7.next = 27;
            break;
          }
          if (!(browserCreator === puppeteer)) {
            _context7.next = 26;
            break;
          }
          _context7.next = 24;
          return page.authenticate({
            username: username,
            password: password
          });
        case 24:
          _context7.next = 27;
          break;
        case 26:
          // Handle playwright browsers, see https://github.com/phetsims/aqua/issues/188

          // This is not the best method for puppeteer because it violated CORS policies, for example with console errors like:
          // [CONSOLE] Access to script at 'https://static.cloudflareinsights.com/beacon.min.js/v84a3a4012de94ce1a686ba8c167c359c1696973893317' from origin 'https:phet-io.colorado.edu' has been blocked by CORS policy: Request header field authorization is not allowed by Access-Control-Allow-Headers in preflight response.
          // [CONSOLE] Failed to load resource: net::ERR_FAILED:      https://static.cloudflareinsights.com/beacon.min.js/v84a3a4012de94ce1a686ba8c167c359c1696973893317
          // [CONSOLE] Access to fetch at 'https://phet.colorado.edu/services/metadata/phetio?latest=true&active=true' from origin 'https://phet-io.colorado.edu' has been blocked by CORS policy: Request header field authorization is not allowed by Access-Control-Allow-Headers in preflight response.
          // [CONSOLE] Failed to load resource: net::ERR_FAILED:      https://phet.colorado.edu/services/metadata/phetio?latest=true&active=true
          page.setExtraHTTPHeaders({
            Authorization: "Basic ".concat(Buffer.from("".concat(username, ":").concat(password)).toString('base64'))
          });
        case 27:
          promise = new Promise(function (res, rej) {
            resolve = res;
            reject = rej;
          });
          page.on('response', /*#__PURE__*/function () {
            var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(response) {
              var responseStatus, responseURL;
              return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                while (1) switch (_context2.prev = _context2.next) {
                  case 0:
                    responseStatus = response.status(); // 200 and 300 class status are most likely fine here
                    if (responseStatus >= 400) {
                      responseURL = response.url();
                      if (responseURL === url) {
                        options.logger("[ERROR] Could not load from status: ".concat(responseStatus));
                      } else if (responseStatus !== 404) {
                        // There will be lots of 404 errors, like for strings files that don't exist
                        options.logger("[ERROR] Could not load dependency from status: ".concat(responseStatus, ", url: ").concat(responseURL));
                      }
                    }
                  case 2:
                  case "end":
                    return _context2.stop();
                }
              }, _callee2);
            }));
            return function (_x4) {
              return _ref3.apply(this, arguments);
            };
          }());
          options.logConsoleOutput && page.on('console', function (msg) {
            var messageTxt = msg.text();

            // Append the location to messages that would benefit from it.
            if (messageTxt.includes('net:') || messageTxt.includes('Failed to load resource')) {
              messageTxt += ": \t ".concat(msg.location().url);
            }
            options.logger("[CONSOLE] ".concat(messageTxt));
          });
          page.on('load', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
            return _regeneratorRuntime().wrap(function _callee3$(_context3) {
              while (1) switch (_context3.prev = _context3.next) {
                case 0:
                  pageLoaded = true;
                  _context3.next = 3;
                  return sleep(options.waitAfterLoad);
                case 3:
                  if (!options.waitForFunction) {
                    _context3.next = 6;
                    break;
                  }
                  _context3.next = 6;
                  return page.waitForFunction(options.waitForFunction, {
                    polling: 100,
                    // default is every animation frame
                    timeout: options.gotoTimeout
                  });
                case 6:
                  _context3.t0 = options.resolveFromLoad;
                  if (!_context3.t0) {
                    _context3.next = 18;
                    break;
                  }
                  _context3.t1 = resolve;
                  if (!(options.evaluate && !page.isClosed())) {
                    _context3.next = 15;
                    break;
                  }
                  _context3.next = 12;
                  return page.evaluate(options.evaluate);
                case 12:
                  _context3.t2 = _context3.sent;
                  _context3.next = 16;
                  break;
                case 15:
                  _context3.t2 = null;
                case 16:
                  _context3.t3 = _context3.t2;
                  (0, _context3.t1)(_context3.t3);
                case 18:
                case "end":
                  return _context3.stop();
              }
            }, _callee3);
          })));
          _context7.t1 = options.onPageCreation;
          if (!_context7.t1) {
            _context7.next = 35;
            break;
          }
          _context7.next = 35;
          return options.onPageCreation(page, resolve, reject);
        case 35:
          _context7.t2 = options.evaluateOnNewDocument;
          if (!_context7.t2) {
            _context7.next = 39;
            break;
          }
          _context7.next = 39;
          return (page.evaluateOnNewDocument || page.addInitScript).call(page, options.evaluateOnNewDocument);
        case 39:
          page.on('error', function (message) {
            options.logger("[ERROR] ".concat(message));
            if (options.rejectErrors) {
              reject(new Error(message));
            }
          });
          page.on('pageerror', function (message) {
            options.logger("[PAGE ERROR] ".concat(message));
            if (options.rejectPageErrors) {
              reject(new Error(message));
            }
          });
          if (options.logNavigation) {
            page.on('frameattached', /*#__PURE__*/function () {
              var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(frame) {
                return _regeneratorRuntime().wrap(function _callee4$(_context4) {
                  while (1) switch (_context4.prev = _context4.next) {
                    case 0:
                      options.logger("[ATTACHED] ".concat(frame.url()));
                    case 1:
                    case "end":
                      return _context4.stop();
                  }
                }, _callee4);
              }));
              return function (_x5) {
                return _ref5.apply(this, arguments);
              };
            }());
            page.on('framedetached', /*#__PURE__*/function () {
              var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(frame) {
                return _regeneratorRuntime().wrap(function _callee5$(_context5) {
                  while (1) switch (_context5.prev = _context5.next) {
                    case 0:
                      options.logger("[DETACHED] ".concat(frame.url()));
                    case 1:
                    case "end":
                      return _context5.stop();
                  }
                }, _callee5);
              }));
              return function (_x6) {
                return _ref6.apply(this, arguments);
              };
            }());
            page.on('framenavigated', /*#__PURE__*/function () {
              var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(frame) {
                return _regeneratorRuntime().wrap(function _callee6$(_context6) {
                  while (1) switch (_context6.prev = _context6.next) {
                    case 0:
                      options.logger("[NAVIGATED] ".concat(frame.url()));
                    case 1:
                    case "end":
                      return _context6.stop();
                  }
                }, _callee6);
              }));
              return function (_x7) {
                return _ref7.apply(this, arguments);
              };
            }());
          }

          // Use timeout so that you can cancel it once we have a result. Node will wait for this if it is a orphaned Promise.
          timeoutID = setTimeout(function () {
            options.onLoadTimeout(resolve, reject);
          }, options.allowedTimeToLoad);
          options.logger("[URL] ".concat(url));
          result = null; // Await both at the same time, because all rejection is hooked up to the `promise`, but that could cause an error
          // during the goto call (not afterward), see https://github.com/phetsims/aqua/issues/197
          _context7.next = 47;
          return Promise.all([page["goto"](url, {
            timeout: options.gotoTimeout
          }), promise.then(function (myResult) {
            result = myResult;
          })]);
        case 47:
          _context7.next = 49;
          return cleanup();
        case 49:
          clearTimeout(timeoutID);
          return _context7.abrupt("return", result);
        case 53:
          _context7.prev = 53;
          _context7.t3 = _context7["catch"](5);
          options.logger(_context7.t3);
          _context7.next = 58;
          return cleanup();
        case 58:
          throw _context7.t3;
        case 59:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[5, 53]]);
  }));
  return function (_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVnZW5lcmF0b3JSdW50aW1lIiwiZSIsInQiLCJyIiwiT2JqZWN0IiwicHJvdG90eXBlIiwibiIsImhhc093blByb3BlcnR5IiwibyIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJpIiwiU3ltYm9sIiwiYSIsIml0ZXJhdG9yIiwiYyIsImFzeW5jSXRlcmF0b3IiLCJ1IiwidG9TdHJpbmdUYWciLCJkZWZpbmUiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ3cmFwIiwiR2VuZXJhdG9yIiwiY3JlYXRlIiwiQ29udGV4dCIsIm1ha2VJbnZva2VNZXRob2QiLCJ0cnlDYXRjaCIsInR5cGUiLCJhcmciLCJjYWxsIiwiaCIsImwiLCJmIiwicyIsInkiLCJHZW5lcmF0b3JGdW5jdGlvbiIsIkdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlIiwicCIsImQiLCJnZXRQcm90b3R5cGVPZiIsInYiLCJ2YWx1ZXMiLCJnIiwiZGVmaW5lSXRlcmF0b3JNZXRob2RzIiwiZm9yRWFjaCIsIl9pbnZva2UiLCJBc3luY0l0ZXJhdG9yIiwiaW52b2tlIiwiX3R5cGVvZiIsInJlc29sdmUiLCJfX2F3YWl0IiwidGhlbiIsImNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnIiwiRXJyb3IiLCJkb25lIiwibWV0aG9kIiwiZGVsZWdhdGUiLCJtYXliZUludm9rZURlbGVnYXRlIiwic2VudCIsIl9zZW50IiwiZGlzcGF0Y2hFeGNlcHRpb24iLCJhYnJ1cHQiLCJUeXBlRXJyb3IiLCJyZXN1bHROYW1lIiwibmV4dCIsIm5leHRMb2MiLCJwdXNoVHJ5RW50cnkiLCJ0cnlMb2MiLCJjYXRjaExvYyIsImZpbmFsbHlMb2MiLCJhZnRlckxvYyIsInRyeUVudHJpZXMiLCJwdXNoIiwicmVzZXRUcnlFbnRyeSIsImNvbXBsZXRpb24iLCJyZXNldCIsImlzTmFOIiwibGVuZ3RoIiwiZGlzcGxheU5hbWUiLCJpc0dlbmVyYXRvckZ1bmN0aW9uIiwiY29uc3RydWN0b3IiLCJuYW1lIiwibWFyayIsInNldFByb3RvdHlwZU9mIiwiX19wcm90b19fIiwiYXdyYXAiLCJhc3luYyIsIlByb21pc2UiLCJrZXlzIiwicmV2ZXJzZSIsInBvcCIsInByZXYiLCJjaGFyQXQiLCJzbGljZSIsInN0b3AiLCJydmFsIiwiaGFuZGxlIiwiY29tcGxldGUiLCJmaW5pc2giLCJfY2F0Y2giLCJkZWxlZ2F0ZVlpZWxkIiwiYXN5bmNHZW5lcmF0b3JTdGVwIiwiZ2VuIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJpbmZvIiwiZXJyb3IiLCJfYXN5bmNUb0dlbmVyYXRvciIsImZuIiwic2VsZiIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsImVyciIsInVuZGVmaW5lZCIsInNsZWVwIiwicmVxdWlyZSIsIl8iLCJ3aW5zdG9uIiwicHVwcGV0ZWVyIiwiYXNzZXJ0IiwibW9kdWxlIiwiZXhwb3J0cyIsIl9yZWYiLCJfY2FsbGVlNyIsImJyb3dzZXJDcmVhdG9yIiwidXJsIiwib3B0aW9ucyIsInBhZ2VMb2FkZWQiLCJvd25zQnJvd3NlciIsImJyb3dzZXIiLCJwYWdlIiwiY2xlYW51cCIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJwcm9taXNlIiwidGltZW91dElEIiwicmVzdWx0IiwiX2NhbGxlZTckIiwiX2NvbnRleHQ3IiwibWVyZ2UiLCJsYXVuY2hPcHRpb25zIiwiZXZhbHVhdGUiLCJ3YWl0Rm9yRnVuY3Rpb24iLCJyZWplY3RQYWdlRXJyb3JzIiwicmVqZWN0RXJyb3JzIiwicmVzb2x2ZUZyb21Mb2FkIiwid2FpdEFmdGVyTG9hZCIsImFsbG93ZWRUaW1lVG9Mb2FkIiwiZ290b1RpbWVvdXQiLCJvbkxvYWRUaW1lb3V0IiwibG9nZ2VyIiwiY29uY2F0Iiwib25QYWdlQ3JlYXRpb24iLCJldmFsdWF0ZU9uTmV3RG9jdW1lbnQiLCJjYWNoZVBhZ2VzIiwibG9nQ29uc29sZU91dHB1dCIsImxvZ05hdmlnYXRpb24iLCJfcmVmMiIsIl9jYWxsZWUiLCJfY2FsbGVlJCIsIl9jb250ZXh0IiwidDAiLCJpc0Nsb3NlZCIsImNsb3NlIiwidDEiLCJsYXVuY2giLCJuZXdQYWdlIiwic2V0Q2FjaGVFbmFibGVkIiwic2V0RGVmYXVsdE5hdmlnYXRpb25UaW1lb3V0IiwicHJvY2VzcyIsImVudiIsIkJBU0lDX1VTRVJOQU1FIiwiQkFTSUNfUEFTU1dPUkQiLCJhdXRoZW50aWNhdGUiLCJzZXRFeHRyYUhUVFBIZWFkZXJzIiwiQXV0aG9yaXphdGlvbiIsIkJ1ZmZlciIsImZyb20iLCJ0b1N0cmluZyIsInJlcyIsInJlaiIsIm9uIiwiX3JlZjMiLCJfY2FsbGVlMiIsInJlc3BvbnNlIiwicmVzcG9uc2VTdGF0dXMiLCJyZXNwb25zZVVSTCIsIl9jYWxsZWUyJCIsIl9jb250ZXh0MiIsInN0YXR1cyIsIl94NCIsIm1zZyIsIm1lc3NhZ2VUeHQiLCJ0ZXh0IiwiaW5jbHVkZXMiLCJsb2NhdGlvbiIsIl9jYWxsZWUzIiwiX2NhbGxlZTMkIiwiX2NvbnRleHQzIiwicG9sbGluZyIsInRpbWVvdXQiLCJ0MiIsInQzIiwiYWRkSW5pdFNjcmlwdCIsIm1lc3NhZ2UiLCJfcmVmNSIsIl9jYWxsZWU0IiwiZnJhbWUiLCJfY2FsbGVlNCQiLCJfY29udGV4dDQiLCJfeDUiLCJfcmVmNiIsIl9jYWxsZWU1IiwiX2NhbGxlZTUkIiwiX2NvbnRleHQ1IiwiX3g2IiwiX3JlZjciLCJfY2FsbGVlNiIsIl9jYWxsZWU2JCIsIl9jb250ZXh0NiIsIl94NyIsInNldFRpbWVvdXQiLCJhbGwiLCJteVJlc3VsdCIsImNsZWFyVGltZW91dCIsIl94IiwiX3gyIiwiX3gzIl0sInNvdXJjZXMiOlsiYnJvd3NlclBhZ2VMb2FkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjIsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFVzZXMgYSBicm93c2VyIHRvIHNlZSB3aGV0aGVyIGEgcGFnZSBsb2FkcyB3aXRob3V0IGFuIGVycm9yLiBUaHJvd3MgZXJyb3JzIGl0IHJlY2VpdmVzLlxyXG4gKlxyXG4gKiBTdXBwb3J0cyBtdWx0aXBsZSBzdXBwb3J0ZWQgYnJvd3NlcnMgZnJvbSBwdXBwZXRlZXIgYW5kIHBsYXl3cmlnaHQuIE11c3QgcHJvdmlkZSBhIGJyb3dzZXJDcmVhdG9yIGZyb20gZWl0aGVyIHdpdGggYVxyXG4gKiBgbGF1bmNoKClgIGludGVyZmFjZS5cclxuICogVGhlcmUgYXJlIG5vdyBtYW55IG1vcmUgZmVhdHVyZXMgb2YgdGhpcyBjbGFzcy4gSXQgaXMgYmVzdCB0byBzZWUgaXRzIGZ1bmN0aW9uYWxpdHkgYnkgbG9va2luZyBhdCBvcHRpb25zLlxyXG4gKlxyXG4gKiBUbyBzdXBwb3J0IGF1dGhlbnRpY2F0aW9uLCB3ZSB1c2UgcHJvY2Vzcy5lbnYuQkFTSUNfUEFTU1dPUkQgYW5kIHByb2Nlc3MuZW52LkJBU0lDX1VTRVJOQU1FLCBzZXQgdGhvc2UgYmVmb3JlIGNhbGxpbmdcclxuICogdGhpcyBmdW5jdGlvbi5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuY29uc3Qgc2xlZXAgPSByZXF1aXJlKCAnLi9zbGVlcCcgKTtcclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuY29uc3QgcHVwcGV0ZWVyID0gcmVxdWlyZSggJ3B1cHBldGVlcicgKTtcclxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcclxuXHJcbi8qKlxyXG4gKiBVc2VzIHB1cHBldGVlciB0byBzZWUgd2hldGhlciBhIHBhZ2UgbG9hZHMgd2l0aG91dCBhbiBlcnJvclxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIFJlamVjdHMgaWYgZW5jb3VudGVyaW5nIGFuIGVycm9yIGxvYWRpbmcgdGhlIHBhZ2UgT1IgKHdpdGggb3B0aW9uIHByb3ZpZGVkIHdpdGhpbiB0aGUgcHVwcGV0ZWVyIHBhZ2UgaXRzZWxmKS5cclxuICpcclxuICogQHBhcmFtIHtCcm93c2VyfSBicm93c2VyQ3JlYXRvciAtIGVpdGhlciBgcHVwcGV0ZWVyYCBvciBhIHNwZWNpZmljIEJyb3dzZXIgZnJvbSBwbGF5cmlnaHRcclxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxudWxsfCo+fSAtIFRoZSBldmFsIHJlc3VsdC9udWxsXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uKCBicm93c2VyQ3JlYXRvciwgdXJsLCBvcHRpb25zICkge1xyXG4gIGxldCBwYWdlTG9hZGVkID0gZmFsc2U7XHJcbiAgb3B0aW9ucyA9IF8ubWVyZ2UoIHtcclxuXHJcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3B1cHBldGVlci9wdXBwZXRlZXIvYmxvYi92MTQuMS4xL2RvY3MvYXBpLm1kI3B1cHBldGVlcmxhdW5jaG9wdGlvbnNcclxuICAgIC8vIE1ha2Ugc3VyZSB0byBwcm92aWRlIG9wdGlvbnMgdGhhdCB3b3JrIHdpdGggeW91ciBicm93c2VyQ3JlYXRvciAocGxheXdyaWdodCBvciBwdXBwZXRlZXIpXHJcbiAgICBsYXVuY2hPcHRpb25zOiB7XHJcbiAgICAgIGFyZ3M6IFtcclxuICAgICAgICAnLS1kaXNhYmxlLWdwdSdcclxuICAgICAgXVxyXG4gICAgfSxcclxuXHJcbiAgICBicm93c2VyOiBudWxsLCAvLyBJZiBwcm92aWRlZCwgYnJvd3NlckNyZWF0b3IgaXMgbm90IHVzZWQgdG8gY3JlYXRlIGEgYnJvd3NlciwgYW5kIHRoaXMgYnJvd3NlciBpcyBub3QgY2xvc2VkLlxyXG5cclxuICAgIGV2YWx1YXRlOiBudWxsLCAvLyB7ZnVuY3Rpb258bnVsbH1cclxuICAgIHdhaXRGb3JGdW5jdGlvbjogbnVsbCwgLy8ge3N0cmluZ3xudWxsfVxyXG5cclxuICAgIHJlamVjdFBhZ2VFcnJvcnM6IHRydWUsIC8vIHJlamVjdCB3aGVuIHRoZSBwYWdlIGVycm9yc1xyXG4gICAgcmVqZWN0RXJyb3JzOiB0cnVlLCAvLyByZWplY3Qgd2hlbiB0aGVyZSBpcyBhbiBlcnJvciB3aXRoIHRoZSBicm93c2VyXHJcblxyXG4gICAgLy8gQnkgZGVmYXVsdCwgb25jZSBsb2FkZWQgd2UgcmVzb2x2ZSwgYnV0IG9wdCBvdXQgb2YgdGhpcyBoZXJlLiBJZiB5b3Ugc2V0IHRvIGZhbHNlLCB5b3UgbXVzdCByZXNvbHZlIGluIGN1c3RvbSBsb2dpYyBpbiBvblBhZ2VDcmVhdGlvblxyXG4gICAgcmVzb2x2ZUZyb21Mb2FkOiB0cnVlLFxyXG4gICAgd2FpdEFmdGVyTG9hZDogNTAwMCwgLy8gbWlsbGlzZWNvbmRzXHJcbiAgICBhbGxvd2VkVGltZVRvTG9hZDogNDAwMDAsIC8vIG1pbGxpc2Vjb25kc1xyXG4gICAgZ290b1RpbWVvdXQ6IDMwMDAwLCAvLyBtaWxsaXNlY29uZHNcclxuXHJcbiAgICAvLyBDYWxsYmFjayB3aGVuIGxvZ2ljIGlzIG5vdCBjb21wbGV0ZSBhZnRlciB0aW1lb3V0IG9mIGxlbmd0aDogYWxsb3dlZFRpbWVUb0xvYWQuXHJcbiAgICBvbkxvYWRUaW1lb3V0OiAoIHJlc29sdmUsIHJlamVjdCApID0+IHtcclxuICAgICAgaWYgKCAhcGFnZUxvYWRlZCApIHtcclxuICAgICAgICBvcHRpb25zLmxvZ2dlciggJ3B1cHBldGVlciBwYWdlIG5vdCBsb2FkZWQnICk7XHJcbiAgICAgICAgcmVqZWN0KCBuZXcgRXJyb3IoIGBEaWQgbm90IGxvYWQgaW4gJHtvcHRpb25zLmFsbG93ZWRUaW1lVG9Mb2FkfWAgKSApO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgb25QYWdlQ3JlYXRpb246IG51bGwsIC8vIHtmdW5jdGlvbihwYWdlLCByZXNvbHZlLHJlamVjdCk6UHJvbWlzZTx2b2lkPnxudWxsfSAtIGFueSBleHRyYSBpdGVtcyB5b3Ugd2FudCB0byBkbyB3aXRoIHRoZSBwYWdlIGJlZm9yZSBnb3RvIGlzIGNhbGxlZFxyXG4gICAgZXZhbHVhdGVPbk5ld0RvY3VtZW50OiBudWxsLCAvLyB7ZnVuY3Rpb258bnVsbH0gcGFnZS5ldmFsdWF0ZU9uTmV3RG9jdW1lbnQgZm9yIHB1cHBldGVlciwgYW5kIGFkZEluaXRTY3JpcHQgZm9yIHBsYXl3cml0ZVxyXG5cclxuICAgIGNhY2hlUGFnZXM6IHRydWUsXHJcbiAgICBsb2dDb25zb2xlT3V0cHV0OiBmYWxzZSwgLy8gaWYgdHJ1ZSwgdGhpcyBwcm9jZXNzIHdpbGwgbG9nIGFsbCBtZXNzYWdlcyB0aGF0IGNvbWUgZnJvbSBwYWdlLm9uKCAnY29uc29sZScgKVxyXG4gICAgbG9nTmF2aWdhdGlvbjogZmFsc2UsIC8vIGlmIHRydWUsIHRoaXMgcHJvY2VzcyB3aWxsIGxvZyBhbGwgbWVzc2FnZXMgdGhhdCBjb21lIGZyb20gcGFnZS5vbiggJ2ZyYW1lKicgKVxyXG4gICAgbG9nZ2VyOiB3aW5zdG9uLmluZm8gLy8ge2Z1bmN0aW9uKG1lc3NhZ2UpfSBwYXNzIGluIGBjb25zb2xlLmxvZ2AgaWYgeW91IGFyZSBydW5uaW5nIGluIGEgY29udGV4dCB0aGF0IGRvZXNuJ3QgdXNlIHdpbnN0b25cclxuICB9LCBvcHRpb25zICk7XHJcblxyXG4gICFvcHRpb25zLnJlc29sdmVGcm9tTG9hZCAmJiBhc3NlcnQoIG9wdGlvbnMub25QYWdlQ3JlYXRpb24sICdtdXN0IHJlc29sdmUgZnJvbSBvblBhZ2VDcmVhdGlvbicgKTtcclxuXHJcbiAgY29uc3Qgb3duc0Jyb3dzZXIgPSAhb3B0aW9ucy5icm93c2VyO1xyXG5cclxuICBsZXQgYnJvd3NlcjtcclxuICBsZXQgcGFnZTtcclxuXHJcbiAgY29uc3QgY2xlYW51cCA9IGFzeW5jICgpID0+IHtcclxuICAgIHBhZ2UgJiYgIXBhZ2UuaXNDbG9zZWQoKSAmJiBhd2FpdCBwYWdlLmNsb3NlKCk7XHJcblxyXG4gICAgLy8gSWYgd2UgY3JlYXRlZCBhIHRlbXBvcmFyeSBicm93c2VyLCBjbG9zZSBpdFxyXG4gICAgb3duc0Jyb3dzZXIgJiYgYnJvd3NlciAmJiBhd2FpdCBicm93c2VyLmNsb3NlKCk7XHJcbiAgfTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGJyb3dzZXIgPSBvcHRpb25zLmJyb3dzZXIgfHwgYXdhaXQgYnJvd3NlckNyZWF0b3IubGF1bmNoKCBvcHRpb25zLmxhdW5jaE9wdGlvbnMgKTtcclxuXHJcbiAgICBwYWdlID0gYXdhaXQgYnJvd3Nlci5uZXdQYWdlKCk7XHJcblxyXG4gICAgcGFnZS5zZXRDYWNoZUVuYWJsZWQgJiYgcGFnZS5zZXRDYWNoZUVuYWJsZWQoIG9wdGlvbnMuY2FjaGVQYWdlcyApO1xyXG5cclxuICAgIGF3YWl0IHBhZ2Uuc2V0RGVmYXVsdE5hdmlnYXRpb25UaW1lb3V0KCBvcHRpb25zLmdvdG9UaW1lb3V0ICk7XHJcblxyXG4gICAgLy8gVGhlIEFQSSBmb3IgcGxheXdyaWdodCB3YXMgbXVjaCBtb3JlIGNvbXBsaWNhdGVkLCBzbyBqdXN0IHN1cHBvcnQgcHVwcGV0ZWVyXHJcbiAgICBjb25zdCB1c2VybmFtZSA9IHByb2Nlc3MuZW52LkJBU0lDX1VTRVJOQU1FO1xyXG4gICAgY29uc3QgcGFzc3dvcmQgPSBwcm9jZXNzLmVudi5CQVNJQ19QQVNTV09SRDtcclxuXHJcbiAgICBpZiAoIHVzZXJuYW1lICYmIHBhc3N3b3JkICkge1xyXG4gICAgICBpZiAoIGJyb3dzZXJDcmVhdG9yID09PSBwdXBwZXRlZXIgKSB7XHJcbiAgICAgICAgLy8gcHVwcGV0ZWVyIGhhcyBpdHMgb3duIGF1dGhlbnRpY2F0aW9uIG1ldGhvZCwgdGhhbmtzIVxyXG4gICAgICAgIGF3YWl0IHBhZ2UuYXV0aGVudGljYXRlKCB7IHVzZXJuYW1lOiB1c2VybmFtZSwgcGFzc3dvcmQ6IHBhc3N3b3JkIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBIYW5kbGUgcGxheXdyaWdodCBicm93c2Vycywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9hcXVhL2lzc3Vlcy8xODhcclxuXHJcbiAgICAgICAgLy8gVGhpcyBpcyBub3QgdGhlIGJlc3QgbWV0aG9kIGZvciBwdXBwZXRlZXIgYmVjYXVzZSBpdCB2aW9sYXRlZCBDT1JTIHBvbGljaWVzLCBmb3IgZXhhbXBsZSB3aXRoIGNvbnNvbGUgZXJyb3JzIGxpa2U6XHJcbiAgICAgICAgLy8gW0NPTlNPTEVdIEFjY2VzcyB0byBzY3JpcHQgYXQgJ2h0dHBzOi8vc3RhdGljLmNsb3VkZmxhcmVpbnNpZ2h0cy5jb20vYmVhY29uLm1pbi5qcy92ODRhM2E0MDEyZGU5NGNlMWE2ODZiYThjMTY3YzM1OWMxNjk2OTczODkzMzE3JyBmcm9tIG9yaWdpbiAnaHR0cHM6cGhldC1pby5jb2xvcmFkby5lZHUnIGhhcyBiZWVuIGJsb2NrZWQgYnkgQ09SUyBwb2xpY3k6IFJlcXVlc3QgaGVhZGVyIGZpZWxkIGF1dGhvcml6YXRpb24gaXMgbm90IGFsbG93ZWQgYnkgQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyBpbiBwcmVmbGlnaHQgcmVzcG9uc2UuXHJcbiAgICAgICAgLy8gW0NPTlNPTEVdIEZhaWxlZCB0byBsb2FkIHJlc291cmNlOiBuZXQ6OkVSUl9GQUlMRUQ6ICAgICAgaHR0cHM6Ly9zdGF0aWMuY2xvdWRmbGFyZWluc2lnaHRzLmNvbS9iZWFjb24ubWluLmpzL3Y4NGEzYTQwMTJkZTk0Y2UxYTY4NmJhOGMxNjdjMzU5YzE2OTY5NzM4OTMzMTdcclxuICAgICAgICAvLyBbQ09OU09MRV0gQWNjZXNzIHRvIGZldGNoIGF0ICdodHRwczovL3BoZXQuY29sb3JhZG8uZWR1L3NlcnZpY2VzL21ldGFkYXRhL3BoZXRpbz9sYXRlc3Q9dHJ1ZSZhY3RpdmU9dHJ1ZScgZnJvbSBvcmlnaW4gJ2h0dHBzOi8vcGhldC1pby5jb2xvcmFkby5lZHUnIGhhcyBiZWVuIGJsb2NrZWQgYnkgQ09SUyBwb2xpY3k6IFJlcXVlc3QgaGVhZGVyIGZpZWxkIGF1dGhvcml6YXRpb24gaXMgbm90IGFsbG93ZWQgYnkgQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyBpbiBwcmVmbGlnaHQgcmVzcG9uc2UuXHJcbiAgICAgICAgLy8gW0NPTlNPTEVdIEZhaWxlZCB0byBsb2FkIHJlc291cmNlOiBuZXQ6OkVSUl9GQUlMRUQ6ICAgICAgaHR0cHM6Ly9waGV0LmNvbG9yYWRvLmVkdS9zZXJ2aWNlcy9tZXRhZGF0YS9waGV0aW8/bGF0ZXN0PXRydWUmYWN0aXZlPXRydWVcclxuICAgICAgICBwYWdlLnNldEV4dHJhSFRUUEhlYWRlcnMoIHtcclxuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJhc2ljICR7QnVmZmVyLmZyb20oIGAke3VzZXJuYW1lfToke3Bhc3N3b3JkfWAgKS50b1N0cmluZyggJ2Jhc2U2NCcgKX1gXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHByb21vdGUgZm9yIHVzZSBvdXRzaWRlIHRoZSBjbG9zdXJlXHJcbiAgICBsZXQgcmVzb2x2ZTtcclxuICAgIGxldCByZWplY3Q7XHJcbiAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoICggcmVzLCByZWogKSA9PiB7XHJcbiAgICAgIHJlc29sdmUgPSByZXM7XHJcbiAgICAgIHJlamVjdCA9IHJlajtcclxuICAgIH0gKTtcclxuXHJcbiAgICBwYWdlLm9uKCAncmVzcG9uc2UnLCBhc3luYyByZXNwb25zZSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlU3RhdHVzID0gcmVzcG9uc2Uuc3RhdHVzKCk7XHJcblxyXG4gICAgICAvLyAyMDAgYW5kIDMwMCBjbGFzcyBzdGF0dXMgYXJlIG1vc3QgbGlrZWx5IGZpbmUgaGVyZVxyXG4gICAgICBpZiAoIHJlc3BvbnNlU3RhdHVzID49IDQwMCApIHtcclxuICAgICAgICBjb25zdCByZXNwb25zZVVSTCA9IHJlc3BvbnNlLnVybCgpO1xyXG4gICAgICAgIGlmICggcmVzcG9uc2VVUkwgPT09IHVybCApIHtcclxuICAgICAgICAgIG9wdGlvbnMubG9nZ2VyKCBgW0VSUk9SXSBDb3VsZCBub3QgbG9hZCBmcm9tIHN0YXR1czogJHtyZXNwb25zZVN0YXR1c31gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCByZXNwb25zZVN0YXR1cyAhPT0gNDA0ICkgeyAvLyBUaGVyZSB3aWxsIGJlIGxvdHMgb2YgNDA0IGVycm9ycywgbGlrZSBmb3Igc3RyaW5ncyBmaWxlcyB0aGF0IGRvbid0IGV4aXN0XHJcbiAgICAgICAgICBvcHRpb25zLmxvZ2dlciggYFtFUlJPUl0gQ291bGQgbm90IGxvYWQgZGVwZW5kZW5jeSBmcm9tIHN0YXR1czogJHtyZXNwb25zZVN0YXR1c30sIHVybDogJHtyZXNwb25zZVVSTH1gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICBvcHRpb25zLmxvZ0NvbnNvbGVPdXRwdXQgJiYgcGFnZS5vbiggJ2NvbnNvbGUnLCBtc2cgPT4ge1xyXG4gICAgICBsZXQgbWVzc2FnZVR4dCA9IG1zZy50ZXh0KCk7XHJcblxyXG4gICAgICAvLyBBcHBlbmQgdGhlIGxvY2F0aW9uIHRvIG1lc3NhZ2VzIHRoYXQgd291bGQgYmVuZWZpdCBmcm9tIGl0LlxyXG4gICAgICBpZiAoIG1lc3NhZ2VUeHQuaW5jbHVkZXMoICduZXQ6JyApIHx8IG1lc3NhZ2VUeHQuaW5jbHVkZXMoICdGYWlsZWQgdG8gbG9hZCByZXNvdXJjZScgKSApIHtcclxuICAgICAgICBtZXNzYWdlVHh0ICs9IGA6IFxcdCAke21zZy5sb2NhdGlvbigpLnVybH1gO1xyXG4gICAgICB9XHJcbiAgICAgIG9wdGlvbnMubG9nZ2VyKCBgW0NPTlNPTEVdICR7bWVzc2FnZVR4dH1gICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgcGFnZS5vbiggJ2xvYWQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIHBhZ2VMb2FkZWQgPSB0cnVlO1xyXG4gICAgICBhd2FpdCBzbGVlcCggb3B0aW9ucy53YWl0QWZ0ZXJMb2FkICk7XHJcbiAgICAgIGlmICggb3B0aW9ucy53YWl0Rm9yRnVuY3Rpb24gKSB7XHJcbiAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yRnVuY3Rpb24oIG9wdGlvbnMud2FpdEZvckZ1bmN0aW9uLCB7XHJcbiAgICAgICAgICBwb2xsaW5nOiAxMDAsIC8vIGRlZmF1bHQgaXMgZXZlcnkgYW5pbWF0aW9uIGZyYW1lXHJcbiAgICAgICAgICB0aW1lb3V0OiBvcHRpb25zLmdvdG9UaW1lb3V0XHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcbiAgICAgIG9wdGlvbnMucmVzb2x2ZUZyb21Mb2FkICYmIHJlc29sdmUoIG9wdGlvbnMuZXZhbHVhdGUgJiYgIXBhZ2UuaXNDbG9zZWQoKSA/IGF3YWl0IHBhZ2UuZXZhbHVhdGUoIG9wdGlvbnMuZXZhbHVhdGUgKSA6IG51bGwgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBvcHRpb25zLm9uUGFnZUNyZWF0aW9uICYmIGF3YWl0IG9wdGlvbnMub25QYWdlQ3JlYXRpb24oIHBhZ2UsIHJlc29sdmUsIHJlamVjdCApO1xyXG5cclxuICAgIC8vIFN1cHBvcnQgcHVwcGV0ZWVyIChldmFsdWF0ZU9uTmV3RG9jdW1lbnQpIG9yIHBsYXl3cmlnaHQgKGFkZEluaXRTY3JpcHQpXHJcbiAgICBvcHRpb25zLmV2YWx1YXRlT25OZXdEb2N1bWVudCAmJiBhd2FpdCAoICggcGFnZS5ldmFsdWF0ZU9uTmV3RG9jdW1lbnQgfHwgcGFnZS5hZGRJbml0U2NyaXB0ICkuY2FsbCggcGFnZSwgb3B0aW9ucy5ldmFsdWF0ZU9uTmV3RG9jdW1lbnQgKSApO1xyXG5cclxuXHJcbiAgICBwYWdlLm9uKCAnZXJyb3InLCBtZXNzYWdlID0+IHtcclxuICAgICAgb3B0aW9ucy5sb2dnZXIoIGBbRVJST1JdICR7bWVzc2FnZX1gICk7XHJcbiAgICAgIGlmICggb3B0aW9ucy5yZWplY3RFcnJvcnMgKSB7XHJcbiAgICAgICAgcmVqZWN0KCBuZXcgRXJyb3IoIG1lc3NhZ2UgKSApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICBwYWdlLm9uKCAncGFnZWVycm9yJywgbWVzc2FnZSA9PiB7XHJcbiAgICAgIG9wdGlvbnMubG9nZ2VyKCBgW1BBR0UgRVJST1JdICR7bWVzc2FnZX1gICk7XHJcbiAgICAgIGlmICggb3B0aW9ucy5yZWplY3RQYWdlRXJyb3JzICkge1xyXG4gICAgICAgIHJlamVjdCggbmV3IEVycm9yKCBtZXNzYWdlICkgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgaWYgKCBvcHRpb25zLmxvZ05hdmlnYXRpb24gKSB7XHJcbiAgICAgIHBhZ2Uub24oICdmcmFtZWF0dGFjaGVkJywgYXN5bmMgZnJhbWUgPT4ge1xyXG4gICAgICAgIG9wdGlvbnMubG9nZ2VyKCBgW0FUVEFDSEVEXSAke2ZyYW1lLnVybCgpfWAgKTtcclxuICAgICAgfSApO1xyXG4gICAgICBwYWdlLm9uKCAnZnJhbWVkZXRhY2hlZCcsIGFzeW5jIGZyYW1lID0+IHtcclxuICAgICAgICBvcHRpb25zLmxvZ2dlciggYFtERVRBQ0hFRF0gJHtmcmFtZS51cmwoKX1gICk7XHJcbiAgICAgIH0gKTtcclxuICAgICAgcGFnZS5vbiggJ2ZyYW1lbmF2aWdhdGVkJywgYXN5bmMgZnJhbWUgPT4ge1xyXG4gICAgICAgIG9wdGlvbnMubG9nZ2VyKCBgW05BVklHQVRFRF0gJHtmcmFtZS51cmwoKX1gICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBVc2UgdGltZW91dCBzbyB0aGF0IHlvdSBjYW4gY2FuY2VsIGl0IG9uY2Ugd2UgaGF2ZSBhIHJlc3VsdC4gTm9kZSB3aWxsIHdhaXQgZm9yIHRoaXMgaWYgaXQgaXMgYSBvcnBoYW5lZCBQcm9taXNlLlxyXG4gICAgY29uc3QgdGltZW91dElEID0gc2V0VGltZW91dCggKCkgPT4ge1xyXG4gICAgICBvcHRpb25zLm9uTG9hZFRpbWVvdXQoIHJlc29sdmUsIHJlamVjdCApO1xyXG4gICAgfSwgb3B0aW9ucy5hbGxvd2VkVGltZVRvTG9hZCApO1xyXG5cclxuICAgIG9wdGlvbnMubG9nZ2VyKCBgW1VSTF0gJHt1cmx9YCApO1xyXG5cclxuICAgIGxldCByZXN1bHQgPSBudWxsO1xyXG5cclxuICAgIC8vIEF3YWl0IGJvdGggYXQgdGhlIHNhbWUgdGltZSwgYmVjYXVzZSBhbGwgcmVqZWN0aW9uIGlzIGhvb2tlZCB1cCB0byB0aGUgYHByb21pc2VgLCBidXQgdGhhdCBjb3VsZCBjYXVzZSBhbiBlcnJvclxyXG4gICAgLy8gZHVyaW5nIHRoZSBnb3RvIGNhbGwgKG5vdCBhZnRlcndhcmQpLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2FxdWEvaXNzdWVzLzE5N1xyXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoIFtcclxuICAgICAgcGFnZS5nb3RvKCB1cmwsIHtcclxuICAgICAgICB0aW1lb3V0OiBvcHRpb25zLmdvdG9UaW1lb3V0XHJcbiAgICAgIH0gKSxcclxuICAgICAgcHJvbWlzZS50aGVuKCBteVJlc3VsdCA9PiB7IHJlc3VsdCA9IG15UmVzdWx0O30gKVxyXG4gICAgXSApO1xyXG5cclxuICAgIGF3YWl0IGNsZWFudXAoKTtcclxuICAgIGNsZWFyVGltZW91dCggdGltZW91dElEICk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgY2F0Y2goIGUgKSB7XHJcbiAgICBvcHRpb25zLmxvZ2dlciggZSApO1xyXG4gICAgYXdhaXQgY2xlYW51cCgpO1xyXG4gICAgdGhyb3cgZTtcclxuICB9XHJcbn07Il0sIm1hcHBpbmdzIjoiOzs7K0NBQ0EscUpBQUFBLG1CQUFBLFlBQUFBLG9CQUFBLFdBQUFDLENBQUEsU0FBQUMsQ0FBQSxFQUFBRCxDQUFBLE9BQUFFLENBQUEsR0FBQUMsTUFBQSxDQUFBQyxTQUFBLEVBQUFDLENBQUEsR0FBQUgsQ0FBQSxDQUFBSSxjQUFBLEVBQUFDLENBQUEsR0FBQUosTUFBQSxDQUFBSyxj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