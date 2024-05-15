"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
// Copyright 2020-2024, University of Colorado Boulder

/**
 * Generates JS modules from resources such as images/strings/audio/etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

var _ = require('lodash');
var createMipmap = require('./createMipmap');
var fs = require('fs');
var path = require('path');
var grunt = require('grunt');
var loadFileAsDataURI = require('../common/loadFileAsDataURI');
var pascalCase = require('../common/pascalCase');
var os = require('os');
var getCopyrightLine = require('./getCopyrightLine');
var toLessEscapedString = require('../common/toLessEscapedString');
var assert = require('assert');
var writeFileAndGitAdd = require('../../../perennial-alias/js/common/writeFileAndGitAdd');
var svgo = require('svgo');

// disable lint in compiled files, because it increases the linting time
var HEADER = '/* eslint-disable */';

// supported image types, not case-sensitive
var IMAGE_SUFFIXES = ['.png', '.jpg', '.cur', '.svg'];

// supported sound file types, not case-sensitive
var SOUND_SUFFIXES = ['.mp3', '.wav'];

// supported shader file types, not case-sensitive
var SHADER_SUFFIXES = ['.glsl', '.vert', '.shader'];

/**
 * String replacement
 * @param {string} string - the string which will be searched
 * @param {string} search - the text to be replaced
 * @param {string} replacement - the new text
 * @returns {string}
 */
var replace = function replace(string, search, replacement) {
  return string.split(search).join(replacement);
};

/**
 * Get the relative from the modulified repo to the filename through the provided subdirectory.
 *
 * @param {string} subdir
 * @param {string} filename
 * @returns {string}
 */
var getRelativePath = function getRelativePath(subdir, filename) {
  return "".concat(subdir, "/").concat(filename);
};

/**
 * Gets the relative path to the root based on the depth of a resource
 *
 * @returns {string}
 */
var expandDots = function expandDots(abspath) {
  // Finds the depths of a directory relative to the root of where grunt.recurse was called from (a repo root)
  var depth = abspath.split('/').length - 2;
  var parentDirectory = '';
  for (var i = 0; i < depth; i++) {
    parentDirectory = "".concat(parentDirectory, "../");
  }
  return parentDirectory;
};

/**
 * Output with an OS-specific EOL sequence, see https://github.com/phetsims/chipper/issues/908
 * @param string
 * @returns {string}
 */
var fixEOL = function fixEOL(string) {
  return replace(string, '\n', os.EOL);
};

/**
 * Transform an image file to a JS file that loads the image.
 * @param {string} abspath - the absolute path of the image
 * @param {string} repo - repository name for the modulify command
 * @param {string} subdir - subdirectory location for modulified assets
 * @param {string} filename - name of file being modulified
 */
var modulifyImage = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(abspath, repo, subdir, filename) {
    var dataURI, contents, tsFilename;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          dataURI = loadFileAsDataURI(abspath);
          contents = "".concat(HEADER, "\nimport asyncLoader from '").concat(expandDots(abspath), "phet-core/js/asyncLoader.js';\n\nconst image = new Image();\nconst unlock = asyncLoader.createLock( image );\nimage.onload = unlock;\nimage.src = '").concat(dataURI, "';\nexport default image;");
          tsFilename = convertSuffix(filename, '.ts');
          _context.next = 5;
          return writeFileAndGitAdd(repo, getRelativePath(subdir, tsFilename), fixEOL(contents));
        case 5:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function modulifyImage(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Transform an SVG image file to a JS file that loads the image.
 * @param {string} abspath - the absolute path of the image
 * @param {string} repo - repository name for the modulify command
 * @param {string} subdir - subdirectory location for modulified assets
 * @param {string} filename - name of file being modulified
 */
var modulifySVG = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(abspath, repo, subdir, filename) {
    var fileContents, optimizedContents, contents, tsFilename;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          fileContents = fs.readFileSync(abspath, 'utf-8');
          if (!(!fileContents.includes('width="') || !fileContents.includes('height="'))) {
            _context2.next = 3;
            break;
          }
          throw new Error("SVG file ".concat(abspath, " does not contain width and height attributes"));
        case 3:
          // Use SVGO to optimize the SVG contents, see https://github.com/phetsims/arithmetic/issues/201
          optimizedContents = svgo.optimize(fileContents, {
            multipass: true,
            plugins: [{
              name: 'preset-default',
              params: {
                overrides: {
                  // We can't scale things and get the right bounds if the view box is removed.
                  removeViewBox: false
                }
              }
            }]
          }).data;
          contents = "".concat(HEADER, "\nimport asyncLoader from '").concat(expandDots(abspath), "phet-core/js/asyncLoader.js';\n\nconst image = new Image();\nconst unlock = asyncLoader.createLock( image );\nimage.onload = unlock;\nimage.src = `data:image/svg+xml;base64,${btoa(").concat(toLessEscapedString(optimizedContents), ")}`;\nexport default image;");
          tsFilename = convertSuffix(filename, '.ts');
          _context2.next = 8;
          return writeFileAndGitAdd(repo, getRelativePath(subdir, tsFilename), fixEOL(contents));
        case 8:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function modulifySVG(_x5, _x6, _x7, _x8) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * Transform an image file to a JS file that loads the image as a mipmap.
 * @param {string} abspath - the absolute path of the image
 * @param {string} repo - repository name for the modulify command
 * @param {string} subdir - subdirectory location for modulified assets
 * @param {string} filename - name of file being modulified
 */
var modulifyMipmap = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(abspath, repo, subdir, filename) {
    var config, mipmaps, entry, mipmapContents, jsFilename;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          // Defaults. NOTE: using the default settings because we have not run into a need, see
          // https://github.com/phetsims/chipper/issues/820 and https://github.com/phetsims/chipper/issues/945
          config = {
            level: 4,
            // maximum level
            quality: 98
          };
          _context3.next = 3;
          return createMipmap(abspath, config.level, config.quality);
        case 3:
          mipmaps = _context3.sent;
          entry = mipmaps.map(function (_ref4) {
            var width = _ref4.width,
              height = _ref4.height,
              url = _ref4.url;
            return {
              width: width,
              height: height,
              url: url
            };
          });
          mipmapContents = "".concat(HEADER, "\nimport asyncLoader from '").concat(expandDots(abspath), "phet-core/js/asyncLoader.js';\n\nconst mipmaps = ").concat(JSON.stringify(entry, null, 2), ";\nmipmaps.forEach( mipmap => {\n  mipmap.img = new Image();\n  const unlock = asyncLoader.createLock( mipmap.img );\n  mipmap.img.onload = unlock;\n  mipmap.img.src = mipmap.url; // trigger the loading of the image for its level\n  mipmap.canvas = document.createElement( 'canvas' );\n  mipmap.canvas.width = mipmap.width;\n  mipmap.canvas.height = mipmap.height;\n  const context = mipmap.canvas.getContext( '2d' );\n  mipmap.updateCanvas = () => {\n    if ( mipmap.img.complete && ( typeof mipmap.img.naturalWidth === 'undefined' || mipmap.img.naturalWidth > 0 ) ) {\n      context.drawImage( mipmap.img, 0, 0 );\n      delete mipmap.updateCanvas;\n    }\n  };\n} );\nexport default mipmaps;");
          jsFilename = convertSuffix(filename, '.js');
          _context3.next = 9;
          return writeFileAndGitAdd(repo, getRelativePath(subdir, jsFilename), fixEOL(mipmapContents));
        case 9:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return function modulifyMipmap(_x9, _x10, _x11, _x12) {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * Transform a GLSL shader file to a JS file that is represented by a string.
 * @param {string} abspath - the absolute path of the image
 * @param {string} repo - repository name for the modulify command
 * @param {string} subdir - subdirectory location for modulified assets
 * @param {string} filename - name of file being modulified
 */
var modulifyShader = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(abspath, repo, subdir, filename) {
    var shaderString, contents, jsFilename;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          // load the shader file
          shaderString = fs.readFileSync(abspath, 'utf-8').replace(/\r/g, ''); // output the contents of the file that will define the shader in JS format
          contents = "".concat(HEADER, "\nexport default ").concat(JSON.stringify(shaderString));
          jsFilename = convertSuffix(filename, '.js');
          _context4.next = 5;
          return writeFileAndGitAdd(repo, getRelativePath(subdir, jsFilename), fixEOL(contents));
        case 5:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return function modulifyShader(_x13, _x14, _x15, _x16) {
    return _ref5.apply(this, arguments);
  };
}();

/**
 * Decode a sound file into a Web Audio AudioBuffer.
 * @param {string} abspath - the absolute path of the image
 * @param {string} repo - repository name for the modulify command
 * @param {string} subdir - subdirectory location for modulified assets
 * @param {string} filename - name of file being modulified
 */
var modulifySound = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(abspath, repo, subdir, filename) {
    var dataURI, contents, jsFilename;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          // load the sound file
          dataURI = loadFileAsDataURI(abspath); // output the contents of the file that will define the sound in JS format
          contents = "".concat(HEADER, "\nimport asyncLoader from '").concat(expandDots(abspath), "phet-core/js/asyncLoader.js';\nimport base64SoundToByteArray from '").concat(expandDots(abspath), "tambo/js/base64SoundToByteArray.js';\nimport WrappedAudioBuffer from '").concat(expandDots(abspath), "tambo/js/WrappedAudioBuffer.js';\nimport phetAudioContext from '").concat(expandDots(abspath), "tambo/js/phetAudioContext.js';\n\nconst soundURI = '").concat(dataURI, "';\nconst soundByteArray = base64SoundToByteArray( phetAudioContext, soundURI );\nconst unlock = asyncLoader.createLock( soundURI );\nconst wrappedAudioBuffer = new WrappedAudioBuffer();\n\n// safe way to unlock\nlet unlocked = false;\nconst safeUnlock = () => {\n  if ( !unlocked ) {\n    unlock();\n    unlocked = true;\n  }\n};\n\nconst onDecodeSuccess = decodedAudio => {\n  if ( wrappedAudioBuffer.audioBufferProperty.value === null ) {\n    wrappedAudioBuffer.audioBufferProperty.set( decodedAudio );\n    safeUnlock();\n  }\n};\nconst onDecodeError = decodeError => {\n  console.warn( 'decode of audio data failed, using stubbed sound, error: ' + decodeError );\n  wrappedAudioBuffer.audioBufferProperty.set( phetAudioContext.createBuffer( 1, 1, phetAudioContext.sampleRate ) );\n  safeUnlock();\n};\nconst decodePromise = phetAudioContext.decodeAudioData( soundByteArray.buffer, onDecodeSuccess, onDecodeError );\nif ( decodePromise ) {\n  decodePromise\n    .then( decodedAudio => {\n      if ( wrappedAudioBuffer.audioBufferProperty.value === null ) {\n        wrappedAudioBuffer.audioBufferProperty.set( decodedAudio );\n        safeUnlock();\n      }\n    } )\n    .catch( e => {\n      console.warn( 'promise rejection caught for audio decode, error = ' + e );\n      safeUnlock();\n    } );\n}\nexport default wrappedAudioBuffer;");
          jsFilename = convertSuffix(filename, '.js');
          _context5.next = 5;
          return writeFileAndGitAdd(repo, getRelativePath(subdir, jsFilename), fixEOL(contents));
        case 5:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }));
  return function modulifySound(_x17, _x18, _x19, _x20) {
    return _ref6.apply(this, arguments);
  };
}();

/**
 * Convert .png => _png_mipmap.js, etc.
 *
 * @param {string} abspath - file name with a suffix or a path to it
 * @param {string} suffix - the new suffix, such as '.js'
 * @returns {string}
 */
var convertSuffix = function convertSuffix(abspath, suffix) {
  var lastDotIndex = abspath.lastIndexOf('.');
  return "".concat(abspath.substring(0, lastDotIndex), "_").concat(abspath.substring(lastDotIndex + 1)).concat(suffix);
};

/**
 * Determines the suffix from a filename, everything after the final '.'
 *
 * @param {string} filename
 * @returns {string}
 */
var getSuffix = function getSuffix(filename) {
  var index = filename.lastIndexOf('.');
  return filename.substring(index);
};

/**
 * Creates a *.js file corresponding to matching resources such as images or sounds.
 * @param {string} abspath
 * @param {string} rootdir
 * @param {string} subdir
 * @param {string} filename
 * @param {string} repo
 */
var modulifyFile = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(abspath, rootdir, subdir, filename, repo) {
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          if (!(subdir && (subdir.startsWith('images') ||
          // for brand
          subdir.startsWith('phet/images') || subdir.startsWith('phet-io/images') || subdir.startsWith('adapted-from-phet/images')) && IMAGE_SUFFIXES.indexOf(getSuffix(filename)) >= 0)) {
            _context6.next = 8;
            break;
          }
          if (!(getSuffix(filename) === '.svg')) {
            _context6.next = 6;
            break;
          }
          _context6.next = 4;
          return modulifySVG(abspath, repo, subdir, filename);
        case 4:
          _context6.next = 8;
          break;
        case 6:
          _context6.next = 8;
          return modulifyImage(abspath, repo, subdir, filename);
        case 8:
          if (!(subdir && (subdir.startsWith('mipmaps') ||
          // for brand
          subdir.startsWith('phet/mipmaps') || subdir.startsWith('phet-io/mipmaps') || subdir.startsWith('adapted-from-phet/mipmaps')) && IMAGE_SUFFIXES.indexOf(getSuffix(filename)) >= 0)) {
            _context6.next = 11;
            break;
          }
          _context6.next = 11;
          return modulifyMipmap(abspath, repo, subdir, filename);
        case 11:
          if (!(subdir && subdir.startsWith('sounds') && SOUND_SUFFIXES.indexOf(getSuffix(filename)) >= 0)) {
            _context6.next = 14;
            break;
          }
          _context6.next = 14;
          return modulifySound(abspath, repo, subdir, filename);
        case 14:
          if (!(subdir && subdir.startsWith('shaders') && SHADER_SUFFIXES.indexOf(getSuffix(filename)) >= 0)) {
            _context6.next = 17;
            break;
          }
          _context6.next = 17;
          return modulifyShader(abspath, repo, subdir, filename);
        case 17:
        case "end":
          return _context6.stop();
      }
    }, _callee6);
  }));
  return function modulifyFile(_x21, _x22, _x23, _x24, _x25) {
    return _ref7.apply(this, arguments);
  };
}();

/**
 * Creates the image module at js/${_.camelCase( repo )}Images.js for repos that need it.
 *
 * @param {string} repo
 * @param {string[]} supportedRegionsAndCultures
 * @returns {Promise<void>}
 */
var createImageModule = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(repo, supportedRegionsAndCultures) {
    var spec, namespace, imageModuleName, relativeImageModuleFile, providedRegionsAndCultures, imageNames, imageFiles, getImportName, importNames, duplicates, firstDuplicate, originalNames, copyrightLine;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          spec = grunt.file.readJSON("../".concat(repo, "/").concat(repo, "-images.json"));
          namespace = _.camelCase(repo);
          imageModuleName = "".concat(pascalCase(repo), "Images");
          relativeImageModuleFile = "js/".concat(imageModuleName, ".ts");
          providedRegionsAndCultures = Object.keys(spec); // Ensure our regionAndCultures in the -images.json file match with the supportedRegionsAndCultures in the package.json
          supportedRegionsAndCultures.forEach(function (regionAndCulture) {
            if (!providedRegionsAndCultures.includes(regionAndCulture)) {
              throw new Error("regionAndCulture '".concat(regionAndCulture, "' is required, but not found in ").concat(repo, "-images.json"));
            }
          });
          providedRegionsAndCultures.forEach(function (regionAndCulture) {
            if (!supportedRegionsAndCultures.includes(regionAndCulture)) {
              throw new Error("regionAndCulture '".concat(regionAndCulture, "' is not supported, but found in ").concat(repo, "-images.json"));
            }
          });
          imageNames = _.uniq(providedRegionsAndCultures.flatMap(function (regionAndCulture) {
            return Object.keys(spec[regionAndCulture]);
          })).sort();
          imageFiles = _.uniq(providedRegionsAndCultures.flatMap(function (regionAndCulture) {
            return Object.values(spec[regionAndCulture]);
          })).sort(); // Do images exist?
          imageFiles.forEach(function (imageFile) {
            if (!fs.existsSync("../".concat(repo, "/").concat(imageFile))) {
              throw new Error("Image file ".concat(imageFile, " is referenced in ").concat(repo, "-images.json, but does not exist"));
            }
          });

          // Ensure that all image names are provided for all regionAndCultures
          providedRegionsAndCultures.forEach(function (regionAndCulture) {
            imageNames.forEach(function (imageName) {
              if (!spec[regionAndCulture].hasOwnProperty(imageName)) {
                throw new Error("Image name ".concat(imageName, " is not provided for regionAndCulture ").concat(regionAndCulture, " (but provided for others)"));
              }
            });
          });
          getImportName = function getImportName(imageFile) {
            return path.basename(imageFile, path.extname(imageFile));
          }; // Check that import names are unique
          // NOTE: we could disambiguate in the future in an automated way fairly easily, but should it be done?
          if (!(_.uniq(imageFiles.map(getImportName)).length !== imageFiles.length)) {
            _context7.next = 19;
            break;
          }
          // Find and report the name collision
          importNames = imageFiles.map(getImportName);
          duplicates = importNames.filter(function (name, index) {
            return importNames.indexOf(name) !== index;
          });
          if (!duplicates.length) {
            _context7.next = 19;
            break;
          }
          // sanity check!
          firstDuplicate = duplicates[0];
          originalNames = imageFiles.filter(function (imageFile) {
            return getImportName(imageFile) === firstDuplicate;
          });
          throw new Error("Multiple images result in the same import name ".concat(firstDuplicate, ": ").concat(originalNames.join(', ')));
        case 19:
          _context7.next = 21;
          return getCopyrightLine(repo, relativeImageModuleFile);
        case 21:
          copyrightLine = _context7.sent;
          _context7.next = 24;
          return writeFileAndGitAdd(repo, relativeImageModuleFile, fixEOL("".concat(copyrightLine, "\n\n/**\n * Auto-generated from modulify, DO NOT manually modify.\n */\n/* eslint-disable */\nimport LocalizedImageProperty from '../../joist/js/i18n/LocalizedImageProperty.js';\nimport ").concat(namespace, " from './").concat(namespace, ".js';\n").concat(imageFiles.map(function (imageFile) {
            return "import ".concat(getImportName(imageFile), " from '../").concat(imageFile.replace('.ts', '.js'), "';");
          }).join('\n'), "\n\nconst ").concat(imageModuleName, " = {\n  ").concat(imageNames.map(function (imageName) {
            return "".concat(imageName, "ImageProperty: new LocalizedImageProperty( '").concat(imageName, "', {\n    ").concat(supportedRegionsAndCultures.map(function (regionAndCulture) {
              return "".concat(regionAndCulture, ": ").concat(getImportName(spec[regionAndCulture][imageName]));
            }).join(',\n    '), "\n  } )");
          }).join(',\n  '), "\n};\n\n").concat(namespace, ".register( '").concat(imageModuleName, "', ").concat(imageModuleName, " );\n\nexport default ").concat(imageModuleName, ";\n")));
        case 24:
        case "end":
          return _context7.stop();
      }
    }, _callee7);
  }));
  return function createImageModule(_x26, _x27) {
    return _ref8.apply(this, arguments);
  };
}();

/**
 * Creates the string module at js/${_.camelCase( repo )}Strings.js for repos that need it.
 * @public
 *
 * @param {string} repo
 */
var createStringModule = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8(repo) {
    var packageObject, stringModuleName, relativeStringModuleFile, stringModuleFileJS, namespace, copyrightLine;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          packageObject = grunt.file.readJSON("../".concat(repo, "/package.json"));
          stringModuleName = "".concat(pascalCase(repo), "Strings");
          relativeStringModuleFile = "js/".concat(stringModuleName, ".ts");
          stringModuleFileJS = "../".concat(repo, "/js/").concat(stringModuleName, ".js");
          namespace = _.camelCase(repo);
          if (fs.existsSync(stringModuleFileJS)) {
            console.log('Found JS string file in TS repo.  It should be deleted manually.  ' + stringModuleFileJS);
          }
          _context8.next = 8;
          return getCopyrightLine(repo, relativeStringModuleFile);
        case 8:
          copyrightLine = _context8.sent;
          _context8.next = 11;
          return writeFileAndGitAdd(repo, relativeStringModuleFile, fixEOL("".concat(copyrightLine, "\n\n/**\n * Auto-generated from modulify, DO NOT manually modify.\n */\n/* eslint-disable */\nimport getStringModule from '../../chipper/js/getStringModule.js';\nimport type LocalizedStringProperty from '../../chipper/js/LocalizedStringProperty.js';\nimport ").concat(namespace, " from './").concat(namespace, ".js';\n\ntype StringsType = ").concat(getStringTypes(repo), ";\n\nconst ").concat(stringModuleName, " = getStringModule( '").concat(packageObject.phet.requirejsNamespace, "' ) as StringsType;\n\n").concat(namespace, ".register( '").concat(stringModuleName, "', ").concat(stringModuleName, " );\n\nexport default ").concat(stringModuleName, ";\n")));
        case 11:
        case "end":
          return _context8.stop();
      }
    }, _callee8);
  }));
  return function createStringModule(_x28) {
    return _ref9.apply(this, arguments);
  };
}();

/**
 * Creates a *.d.ts file that represents the types of the strings for the repo.
 * @public
 *
 * @param {string} repo
 */
var getStringTypes = function getStringTypes(repo) {
  var packageObject = grunt.file.readJSON("../".concat(repo, "/package.json"));
  var json = grunt.file.readJSON("../".concat(repo, "/").concat(repo, "-strings_en.json"));

  // Track paths to all the keys with values.
  var all = [];

  // Recursively collect all of the paths to keys with values.
  var visit = function visit(level, path) {
    Object.keys(level).forEach(function (key) {
      if (key !== '_comment') {
        if (level[key].value && typeof level[key].value === 'string') {
          all.push({
            path: [].concat(_toConsumableArray(path), [key]),
            value: level[key].value
          });
        } else {
          visit(level[key], [].concat(_toConsumableArray(path), [key]));
        }
      }
    });
  };
  visit(json, []);

  // Transform to a new structure that matches the types we access at runtime.
  var structure = {};
  for (var i = 0; i < all.length; i++) {
    var allElement = all[i];
    var _path = allElement.path;
    var level = structure;
    for (var k = 0; k < _path.length; k++) {
      var pathElement = _path[k];
      var tokens = pathElement.split('.');
      for (var m = 0; m < tokens.length; m++) {
        var token = tokens[m];
        assert(!token.includes(';'), "Token ".concat(token, " cannot include forbidden characters"));
        assert(!token.includes(','), "Token ".concat(token, " cannot include forbidden characters"));
        assert(!token.includes(' '), "Token ".concat(token, " cannot include forbidden characters"));
        if (k === _path.length - 1 && m === tokens.length - 1) {
          if (!(packageObject.phet && packageObject.phet.simFeatures && packageObject.phet.simFeatures.supportsDynamicLocale)) {
            level[token] = '{{STRING}}'; // instead of value = allElement.value
          }
          level["".concat(token, "StringProperty")] = '{{STRING_PROPERTY}}';
        } else {
          level[token] = level[token] || {};
          level = level[token];
        }
      }
    }
  }
  var text = JSON.stringify(structure, null, 2);

  // Use single quotes instead of the double quotes from JSON
  text = replace(text, '"', '\'');
  text = replace(text, '\'{{STRING}}\'', 'string');
  text = replace(text, '\'{{STRING_PROPERTY}}\'', 'LocalizedStringProperty');

  // Add ; to the last in the list
  text = replace(text, ': string\n', ': string;\n');
  text = replace(text, ': LocalizedStringProperty\n', ': LocalizedStringProperty;\n');

  // Use ; instead of ,
  text = replace(text, ',', ';');
  return text;
};

/**
 * Entry point for modulify, which transforms all of the resources in a repo to *.js files.
 * @param {string} repo - the name of a repo, such as 'joist'
 */
var modulify = /*#__PURE__*/function () {
  var _ref10 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10(repo) {
    var relativeFiles, i, entry, packageObject, _packageObject$phet, _packageObject$phet$s, supportedRegionsAndCultures, concreteRegionsAndCultures;
    return _regeneratorRuntime().wrap(function _callee10$(_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          console.log("modulifying ".concat(repo));
          relativeFiles = [];
          grunt.file.recurse("../".concat(repo), /*#__PURE__*/function () {
            var _ref11 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9(abspath, rootdir, subdir, filename) {
              return _regeneratorRuntime().wrap(function _callee9$(_context9) {
                while (1) switch (_context9.prev = _context9.next) {
                  case 0:
                    relativeFiles.push({
                      abspath: abspath,
                      rootdir: rootdir,
                      subdir: subdir,
                      filename: filename
                    });
                  case 1:
                  case "end":
                    return _context9.stop();
                }
              }, _callee9);
            }));
            return function (_x30, _x31, _x32, _x33) {
              return _ref11.apply(this, arguments);
            };
          }());
          i = 0;
        case 4:
          if (!(i < relativeFiles.length)) {
            _context10.next = 11;
            break;
          }
          entry = relativeFiles[i];
          _context10.next = 8;
          return modulifyFile(entry.abspath, entry.rootdir, entry.subdir, entry.filename, repo);
        case 8:
          i++;
          _context10.next = 4;
          break;
        case 11:
          packageObject = grunt.file.readJSON("../".concat(repo, "/package.json")); // Strings module file
          if (!(fs.existsSync("../".concat(repo, "/").concat(repo, "-strings_en.json")) && packageObject.phet && packageObject.phet.requirejsNamespace)) {
            _context10.next = 15;
            break;
          }
          _context10.next = 15;
          return createStringModule(repo);
        case 15:
          if (!fs.existsSync("../".concat(repo, "/").concat(repo, "-images.json"))) {
            _context10.next = 26;
            break;
          }
          supportedRegionsAndCultures = packageObject === null || packageObject === void 0 ? void 0 : (_packageObject$phet = packageObject.phet) === null || _packageObject$phet === void 0 ? void 0 : (_packageObject$phet$s = _packageObject$phet.simFeatures) === null || _packageObject$phet$s === void 0 ? void 0 : _packageObject$phet$s.supportedRegionsAndCultures;
          if (supportedRegionsAndCultures) {
            _context10.next = 19;
            break;
          }
          throw new Error("supportedRegionsAndCultures is not defined in package.json, but ".concat(repo, "-images.json exists"));
        case 19:
          if (supportedRegionsAndCultures.includes('usa')) {
            _context10.next = 21;
            break;
          }
          throw new Error('regionAndCulture \'usa\' is required, but not found in supportedRegionsAndCultures');
        case 21:
          if (!(supportedRegionsAndCultures.includes('multi') && supportedRegionsAndCultures.length < 3)) {
            _context10.next = 23;
            break;
          }
          throw new Error('regionAndCulture \'multi\' is supported, but there are not enough regionAndCultures to support it');
        case 23:
          concreteRegionsAndCultures = supportedRegionsAndCultures.filter(function (regionAndCulture) {
            return regionAndCulture !== 'random';
          }); // Update the images module file
          _context10.next = 26;
          return createImageModule(repo, concreteRegionsAndCultures);
        case 26:
        case "end":
          return _context10.stop();
      }
    }, _callee10);
  }));
  return function modulify(_x29) {
    return _ref10.apply(this, arguments);
  };
}();
module.exports = modulify;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVnZW5lcmF0b3JSdW50aW1lIiwiZSIsInQiLCJyIiwiT2JqZWN0IiwicHJvdG90eXBlIiwibiIsImhhc093blByb3BlcnR5IiwibyIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJpIiwiU3ltYm9sIiwiYSIsIml0ZXJhdG9yIiwiYyIsImFzeW5jSXRlcmF0b3IiLCJ1IiwidG9TdHJpbmdUYWciLCJkZWZpbmUiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ3cmFwIiwiR2VuZXJhdG9yIiwiY3JlYXRlIiwiQ29udGV4dCIsIm1ha2VJbnZva2VNZXRob2QiLCJ0cnlDYXRjaCIsInR5cGUiLCJhcmciLCJjYWxsIiwiaCIsImwiLCJmIiwicyIsInkiLCJHZW5lcmF0b3JGdW5jdGlvbiIsIkdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlIiwicCIsImQiLCJnZXRQcm90b3R5cGVPZiIsInYiLCJ2YWx1ZXMiLCJnIiwiZGVmaW5lSXRlcmF0b3JNZXRob2RzIiwiZm9yRWFjaCIsIl9pbnZva2UiLCJBc3luY0l0ZXJhdG9yIiwiaW52b2tlIiwiX3R5cGVvZiIsInJlc29sdmUiLCJfX2F3YWl0IiwidGhlbiIsImNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnIiwiRXJyb3IiLCJkb25lIiwibWV0aG9kIiwiZGVsZWdhdGUiLCJtYXliZUludm9rZURlbGVnYXRlIiwic2VudCIsIl9zZW50IiwiZGlzcGF0Y2hFeGNlcHRpb24iLCJhYnJ1cHQiLCJUeXBlRXJyb3IiLCJyZXN1bHROYW1lIiwibmV4dCIsIm5leHRMb2MiLCJwdXNoVHJ5RW50cnkiLCJ0cnlMb2MiLCJjYXRjaExvYyIsImZpbmFsbHlMb2MiLCJhZnRlckxvYyIsInRyeUVudHJpZXMiLCJwdXNoIiwicmVzZXRUcnlFbnRyeSIsImNvbXBsZXRpb24iLCJyZXNldCIsImlzTmFOIiwibGVuZ3RoIiwiZGlzcGxheU5hbWUiLCJpc0dlbmVyYXRvckZ1bmN0aW9uIiwiY29uc3RydWN0b3IiLCJuYW1lIiwibWFyayIsInNldFByb3RvdHlwZU9mIiwiX19wcm90b19fIiwiYXdyYXAiLCJhc3luYyIsIlByb21pc2UiLCJrZXlzIiwicmV2ZXJzZSIsInBvcCIsInByZXYiLCJjaGFyQXQiLCJzbGljZSIsInN0b3AiLCJydmFsIiwiaGFuZGxlIiwiY29tcGxldGUiLCJmaW5pc2giLCJfY2F0Y2giLCJkZWxlZ2F0ZVlpZWxkIiwiYXN5bmNHZW5lcmF0b3JTdGVwIiwiZ2VuIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJpbmZvIiwiZXJyb3IiLCJfYXN5bmNUb0dlbmVyYXRvciIsImZuIiwic2VsZiIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsImVyciIsInVuZGVmaW5lZCIsIl8iLCJyZXF1aXJlIiwiY3JlYXRlTWlwbWFwIiwiZnMiLCJwYXRoIiwiZ3J1bnQiLCJsb2FkRmlsZUFzRGF0YVVSSSIsInBhc2NhbENhc2UiLCJvcyIsImdldENvcHlyaWdodExpbmUiLCJ0b0xlc3NFc2NhcGVkU3RyaW5nIiwiYXNzZXJ0Iiwid3JpdGVGaWxlQW5kR2l0QWRkIiwic3ZnbyIsIkhFQURFUiIsIklNQUdFX1NVRkZJWEVTIiwiU09VTkRfU1VGRklYRVMiLCJTSEFERVJfU1VGRklYRVMiLCJyZXBsYWNlIiwic3RyaW5nIiwic2VhcmNoIiwicmVwbGFjZW1lbnQiLCJzcGxpdCIsImpvaW4iLCJnZXRSZWxhdGl2ZVBhdGgiLCJzdWJkaXIiLCJmaWxlbmFtZSIsImNvbmNhdCIsImV4cGFuZERvdHMiLCJhYnNwYXRoIiwiZGVwdGgiLCJwYXJlbnREaXJlY3RvcnkiLCJmaXhFT0wiLCJFT0wiLCJtb2R1bGlmeUltYWdlIiwiX3JlZiIsIl9jYWxsZWUiLCJyZXBvIiwiZGF0YVVSSSIsImNvbnRlbnRzIiwidHNGaWxlbmFtZSIsIl9jYWxsZWUkIiwiX2NvbnRleHQiLCJjb252ZXJ0U3VmZml4IiwiX3giLCJfeDIiLCJfeDMiLCJfeDQiLCJtb2R1bGlmeVNWRyIsIl9yZWYyIiwiX2NhbGxlZTIiLCJmaWxlQ29udGVudHMiLCJvcHRpbWl6ZWRDb250ZW50cyIsIl9jYWxsZWUyJCIsIl9jb250ZXh0MiIsInJlYWRGaWxlU3luYyIsImluY2x1ZGVzIiwib3B0aW1pemUiLCJtdWx0aXBhc3MiLCJwbHVnaW5zIiwicGFyYW1zIiwib3ZlcnJpZGVzIiwicmVtb3ZlVmlld0JveCIsImRhdGEiLCJfeDUiLCJfeDYiLCJfeDciLCJfeDgiLCJtb2R1bGlmeU1pcG1hcCIsIl9yZWYzIiwiX2NhbGxlZTMiLCJjb25maWciLCJtaXBtYXBzIiwiZW50cnkiLCJtaXBtYXBDb250ZW50cyIsImpzRmlsZW5hbWUiLCJfY2FsbGVlMyQiLCJfY29udGV4dDMiLCJsZXZlbCIsInF1YWxpdHkiLCJtYXAiLCJfcmVmNCIsIndpZHRoIiwiaGVpZ2h0IiwidXJsIiwiSlNPTiIsInN0cmluZ2lmeSIsIl94OSIsIl94MTAiLCJfeDExIiwiX3gxMiIsIm1vZHVsaWZ5U2hhZGVyIiwiX3JlZjUiLCJfY2FsbGVlNCIsInNoYWRlclN0cmluZyIsIl9jYWxsZWU0JCIsIl9jb250ZXh0NCIsIl94MTMiLCJfeDE0IiwiX3gxNSIsIl94MTYiLCJtb2R1bGlmeVNvdW5kIiwiX3JlZjYiLCJfY2FsbGVlNSIsIl9jYWxsZWU1JCIsIl9jb250ZXh0NSIsIl94MTciLCJfeDE4IiwiX3gxOSIsIl94MjAiLCJzdWZmaXgiLCJsYXN0RG90SW5kZXgiLCJsYXN0SW5kZXhPZiIsInN1YnN0cmluZyIsImdldFN1ZmZpeCIsImluZGV4IiwibW9kdWxpZnlGaWxlIiwiX3JlZjciLCJfY2FsbGVlNiIsInJvb3RkaXIiLCJfY2FsbGVlNiQiLCJfY29udGV4dDYiLCJzdGFydHNXaXRoIiwiaW5kZXhPZiIsIl94MjEiLCJfeDIyIiwiX3gyMyIsIl94MjQiLCJfeDI1IiwiY3JlYXRlSW1hZ2VNb2R1bGUiLCJfcmVmOCIsIl9jYWxsZWU3Iiwic3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzIiwic3BlYyIsIm5hbWVzcGFjZSIsImltYWdlTW9kdWxlTmFtZSIsInJlbGF0aXZlSW1hZ2VNb2R1bGVGaWxlIiwicHJvdmlkZWRSZWdpb25zQW5kQ3VsdHVyZXMiLCJpbWFnZU5hbWVzIiwiaW1hZ2VGaWxlcyIsImdldEltcG9ydE5hbWUiLCJpbXBvcnROYW1lcyIsImR1cGxpY2F0ZXMiLCJmaXJzdER1cGxpY2F0ZSIsIm9yaWdpbmFsTmFtZXMiLCJjb3B5cmlnaHRMaW5lIiwiX2NhbGxlZTckIiwiX2NvbnRleHQ3IiwiZmlsZSIsInJlYWRKU09OIiwiY2FtZWxDYXNlIiwicmVnaW9uQW5kQ3VsdHVyZSIsInVuaXEiLCJmbGF0TWFwIiwic29ydCIsImltYWdlRmlsZSIsImV4aXN0c1N5bmMiLCJpbWFnZU5hbWUiLCJiYXNlbmFtZSIsImV4dG5hbWUiLCJmaWx0ZXIiLCJfeDI2IiwiX3gyNyIsImNyZWF0ZVN0cmluZ01vZHVsZSIsIl9yZWY5IiwiX2NhbGxlZTgiLCJwYWNrYWdlT2JqZWN0Iiwic3RyaW5nTW9kdWxlTmFtZSIsInJlbGF0aXZlU3RyaW5nTW9kdWxlRmlsZSIsInN0cmluZ01vZHVsZUZpbGVKUyIsIl9jYWxsZWU4JCIsIl9jb250ZXh0OCIsImNvbnNvbGUiLCJsb2ciLCJnZXRTdHJpbmdUeXBlcyIsInBoZXQiLCJyZXF1aXJlanNOYW1lc3BhY2UiLCJfeDI4IiwianNvbiIsImFsbCIsInZpc2l0IiwiX3RvQ29uc3VtYWJsZUFycmF5Iiwic3RydWN0dXJlIiwiYWxsRWxlbWVudCIsImsiLCJwYXRoRWxlbWVudCIsInRva2VucyIsIm0iLCJ0b2tlbiIsInNpbUZlYXR1cmVzIiwic3VwcG9ydHNEeW5hbWljTG9jYWxlIiwidGV4dCIsIm1vZHVsaWZ5IiwiX3JlZjEwIiwiX2NhbGxlZTEwIiwicmVsYXRpdmVGaWxlcyIsIl9wYWNrYWdlT2JqZWN0JHBoZXQiLCJfcGFja2FnZU9iamVjdCRwaGV0JHMiLCJjb25jcmV0ZVJlZ2lvbnNBbmRDdWx0dXJlcyIsIl9jYWxsZWUxMCQiLCJfY29udGV4dDEwIiwicmVjdXJzZSIsIl9yZWYxMSIsIl9jYWxsZWU5IiwiX2NhbGxlZTkkIiwiX2NvbnRleHQ5IiwiX3gzMCIsIl94MzEiLCJfeDMyIiwiX3gzMyIsIl94MjkiLCJtb2R1bGUiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsibW9kdWxpZnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogR2VuZXJhdGVzIEpTIG1vZHVsZXMgZnJvbSByZXNvdXJjZXMgc3VjaCBhcyBpbWFnZXMvc3RyaW5ncy9hdWRpby9ldGMuXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuXHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5jb25zdCBjcmVhdGVNaXBtYXAgPSByZXF1aXJlKCAnLi9jcmVhdGVNaXBtYXAnICk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5jb25zdCBwYXRoID0gcmVxdWlyZSggJ3BhdGgnICk7XHJcbmNvbnN0IGdydW50ID0gcmVxdWlyZSggJ2dydW50JyApO1xyXG5jb25zdCBsb2FkRmlsZUFzRGF0YVVSSSA9IHJlcXVpcmUoICcuLi9jb21tb24vbG9hZEZpbGVBc0RhdGFVUkknICk7XHJcbmNvbnN0IHBhc2NhbENhc2UgPSByZXF1aXJlKCAnLi4vY29tbW9uL3Bhc2NhbENhc2UnICk7XHJcbmNvbnN0IG9zID0gcmVxdWlyZSggJ29zJyApO1xyXG5jb25zdCBnZXRDb3B5cmlnaHRMaW5lID0gcmVxdWlyZSggJy4vZ2V0Q29weXJpZ2h0TGluZScgKTtcclxuY29uc3QgdG9MZXNzRXNjYXBlZFN0cmluZyA9IHJlcXVpcmUoICcuLi9jb21tb24vdG9MZXNzRXNjYXBlZFN0cmluZycgKTtcclxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcclxuY29uc3Qgd3JpdGVGaWxlQW5kR2l0QWRkID0gcmVxdWlyZSggJy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vd3JpdGVGaWxlQW5kR2l0QWRkJyApO1xyXG5jb25zdCBzdmdvID0gcmVxdWlyZSggJ3N2Z28nICk7XHJcblxyXG4vLyBkaXNhYmxlIGxpbnQgaW4gY29tcGlsZWQgZmlsZXMsIGJlY2F1c2UgaXQgaW5jcmVhc2VzIHRoZSBsaW50aW5nIHRpbWVcclxuY29uc3QgSEVBREVSID0gJy8qIGVzbGludC1kaXNhYmxlICovJztcclxuXHJcbi8vIHN1cHBvcnRlZCBpbWFnZSB0eXBlcywgbm90IGNhc2Utc2Vuc2l0aXZlXHJcbmNvbnN0IElNQUdFX1NVRkZJWEVTID0gWyAnLnBuZycsICcuanBnJywgJy5jdXInLCAnLnN2ZycgXTtcclxuXHJcbi8vIHN1cHBvcnRlZCBzb3VuZCBmaWxlIHR5cGVzLCBub3QgY2FzZS1zZW5zaXRpdmVcclxuY29uc3QgU09VTkRfU1VGRklYRVMgPSBbICcubXAzJywgJy53YXYnIF07XHJcblxyXG4vLyBzdXBwb3J0ZWQgc2hhZGVyIGZpbGUgdHlwZXMsIG5vdCBjYXNlLXNlbnNpdGl2ZVxyXG5jb25zdCBTSEFERVJfU1VGRklYRVMgPSBbICcuZ2xzbCcsICcudmVydCcsICcuc2hhZGVyJyBdO1xyXG5cclxuLyoqXHJcbiAqIFN0cmluZyByZXBsYWNlbWVudFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gdGhlIHN0cmluZyB3aGljaCB3aWxsIGJlIHNlYXJjaGVkXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWFyY2ggLSB0aGUgdGV4dCB0byBiZSByZXBsYWNlZFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbGFjZW1lbnQgLSB0aGUgbmV3IHRleHRcclxuICogQHJldHVybnMge3N0cmluZ31cclxuICovXHJcbmNvbnN0IHJlcGxhY2UgPSAoIHN0cmluZywgc2VhcmNoLCByZXBsYWNlbWVudCApID0+IHN0cmluZy5zcGxpdCggc2VhcmNoICkuam9pbiggcmVwbGFjZW1lbnQgKTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIHJlbGF0aXZlIGZyb20gdGhlIG1vZHVsaWZpZWQgcmVwbyB0byB0aGUgZmlsZW5hbWUgdGhyb3VnaCB0aGUgcHJvdmlkZWQgc3ViZGlyZWN0b3J5LlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3ViZGlyXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZVxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gKi9cclxuY29uc3QgZ2V0UmVsYXRpdmVQYXRoID0gKCBzdWJkaXIsIGZpbGVuYW1lICkgPT4ge1xyXG4gIHJldHVybiBgJHtzdWJkaXJ9LyR7ZmlsZW5hbWV9YDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSByZWxhdGl2ZSBwYXRoIHRvIHRoZSByb290IGJhc2VkIG9uIHRoZSBkZXB0aCBvZiBhIHJlc291cmNlXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAqL1xyXG5jb25zdCBleHBhbmREb3RzID0gYWJzcGF0aCA9PiB7XHJcblxyXG4gIC8vIEZpbmRzIHRoZSBkZXB0aHMgb2YgYSBkaXJlY3RvcnkgcmVsYXRpdmUgdG8gdGhlIHJvb3Qgb2Ygd2hlcmUgZ3J1bnQucmVjdXJzZSB3YXMgY2FsbGVkIGZyb20gKGEgcmVwbyByb290KVxyXG4gIGNvbnN0IGRlcHRoID0gYWJzcGF0aC5zcGxpdCggJy8nICkubGVuZ3RoIC0gMjtcclxuICBsZXQgcGFyZW50RGlyZWN0b3J5ID0gJyc7XHJcbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgZGVwdGg7IGkrKyApIHtcclxuICAgIHBhcmVudERpcmVjdG9yeSA9IGAke3BhcmVudERpcmVjdG9yeX0uLi9gO1xyXG4gIH1cclxuICByZXR1cm4gcGFyZW50RGlyZWN0b3J5O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE91dHB1dCB3aXRoIGFuIE9TLXNwZWNpZmljIEVPTCBzZXF1ZW5jZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy85MDhcclxuICogQHBhcmFtIHN0cmluZ1xyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gKi9cclxuY29uc3QgZml4RU9MID0gc3RyaW5nID0+IHJlcGxhY2UoIHN0cmluZywgJ1xcbicsIG9zLkVPTCApO1xyXG5cclxuLyoqXHJcbiAqIFRyYW5zZm9ybSBhbiBpbWFnZSBmaWxlIHRvIGEgSlMgZmlsZSB0aGF0IGxvYWRzIHRoZSBpbWFnZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IGFic3BhdGggLSB0aGUgYWJzb2x1dGUgcGF0aCBvZiB0aGUgaW1hZ2VcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSByZXBvc2l0b3J5IG5hbWUgZm9yIHRoZSBtb2R1bGlmeSBjb21tYW5kXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdWJkaXIgLSBzdWJkaXJlY3RvcnkgbG9jYXRpb24gZm9yIG1vZHVsaWZpZWQgYXNzZXRzXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAtIG5hbWUgb2YgZmlsZSBiZWluZyBtb2R1bGlmaWVkXHJcbiAqL1xyXG5jb25zdCBtb2R1bGlmeUltYWdlID0gYXN5bmMgKCBhYnNwYXRoLCByZXBvLCBzdWJkaXIsIGZpbGVuYW1lICkgPT4ge1xyXG5cclxuICBjb25zdCBkYXRhVVJJID0gbG9hZEZpbGVBc0RhdGFVUkkoIGFic3BhdGggKTtcclxuXHJcbiAgY29uc3QgY29udGVudHMgPSBgJHtIRUFERVJ9XHJcbmltcG9ydCBhc3luY0xvYWRlciBmcm9tICcke2V4cGFuZERvdHMoIGFic3BhdGggKX1waGV0LWNvcmUvanMvYXN5bmNMb2FkZXIuanMnO1xyXG5cclxuY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuY29uc3QgdW5sb2NrID0gYXN5bmNMb2FkZXIuY3JlYXRlTG9jayggaW1hZ2UgKTtcclxuaW1hZ2Uub25sb2FkID0gdW5sb2NrO1xyXG5pbWFnZS5zcmMgPSAnJHtkYXRhVVJJfSc7XHJcbmV4cG9ydCBkZWZhdWx0IGltYWdlO2A7XHJcblxyXG4gIGNvbnN0IHRzRmlsZW5hbWUgPSBjb252ZXJ0U3VmZml4KCBmaWxlbmFtZSwgJy50cycgKTtcclxuICBhd2FpdCB3cml0ZUZpbGVBbmRHaXRBZGQoIHJlcG8sIGdldFJlbGF0aXZlUGF0aCggc3ViZGlyLCB0c0ZpbGVuYW1lICksIGZpeEVPTCggY29udGVudHMgKSApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRyYW5zZm9ybSBhbiBTVkcgaW1hZ2UgZmlsZSB0byBhIEpTIGZpbGUgdGhhdCBsb2FkcyB0aGUgaW1hZ2UuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBhYnNwYXRoIC0gdGhlIGFic29sdXRlIHBhdGggb2YgdGhlIGltYWdlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gcmVwb3NpdG9yeSBuYW1lIGZvciB0aGUgbW9kdWxpZnkgY29tbWFuZFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3ViZGlyIC0gc3ViZGlyZWN0b3J5IGxvY2F0aW9uIGZvciBtb2R1bGlmaWVkIGFzc2V0c1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgLSBuYW1lIG9mIGZpbGUgYmVpbmcgbW9kdWxpZmllZFxyXG4gKi9cclxuY29uc3QgbW9kdWxpZnlTVkcgPSBhc3luYyAoIGFic3BhdGgsIHJlcG8sIHN1YmRpciwgZmlsZW5hbWUgKSA9PiB7XHJcblxyXG4gIGNvbnN0IGZpbGVDb250ZW50cyA9IGZzLnJlYWRGaWxlU3luYyggYWJzcGF0aCwgJ3V0Zi04JyApO1xyXG5cclxuICBpZiAoICFmaWxlQ29udGVudHMuaW5jbHVkZXMoICd3aWR0aD1cIicgKSB8fCAhZmlsZUNvbnRlbnRzLmluY2x1ZGVzKCAnaGVpZ2h0PVwiJyApICkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCBgU1ZHIGZpbGUgJHthYnNwYXRofSBkb2VzIG5vdCBjb250YWluIHdpZHRoIGFuZCBoZWlnaHQgYXR0cmlidXRlc2AgKTtcclxuICB9XHJcblxyXG4gIC8vIFVzZSBTVkdPIHRvIG9wdGltaXplIHRoZSBTVkcgY29udGVudHMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXJpdGhtZXRpYy9pc3N1ZXMvMjAxXHJcbiAgY29uc3Qgb3B0aW1pemVkQ29udGVudHMgPSBzdmdvLm9wdGltaXplKCBmaWxlQ29udGVudHMsIHtcclxuICAgIG11bHRpcGFzczogdHJ1ZSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIG5hbWU6ICdwcmVzZXQtZGVmYXVsdCcsXHJcbiAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICBvdmVycmlkZXM6IHtcclxuICAgICAgICAgICAgLy8gV2UgY2FuJ3Qgc2NhbGUgdGhpbmdzIGFuZCBnZXQgdGhlIHJpZ2h0IGJvdW5kcyBpZiB0aGUgdmlldyBib3ggaXMgcmVtb3ZlZC5cclxuICAgICAgICAgICAgcmVtb3ZlVmlld0JveDogZmFsc2VcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIF1cclxuICB9ICkuZGF0YTtcclxuXHJcbiAgY29uc3QgY29udGVudHMgPSBgJHtIRUFERVJ9XHJcbmltcG9ydCBhc3luY0xvYWRlciBmcm9tICcke2V4cGFuZERvdHMoIGFic3BhdGggKX1waGV0LWNvcmUvanMvYXN5bmNMb2FkZXIuanMnO1xyXG5cclxuY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuY29uc3QgdW5sb2NrID0gYXN5bmNMb2FkZXIuY3JlYXRlTG9jayggaW1hZ2UgKTtcclxuaW1hZ2Uub25sb2FkID0gdW5sb2NrO1xyXG5pbWFnZS5zcmMgPSBcXGBkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFxcJHtidG9hKCR7dG9MZXNzRXNjYXBlZFN0cmluZyggb3B0aW1pemVkQ29udGVudHMgKX0pfVxcYDtcclxuZXhwb3J0IGRlZmF1bHQgaW1hZ2U7YDtcclxuXHJcbiAgY29uc3QgdHNGaWxlbmFtZSA9IGNvbnZlcnRTdWZmaXgoIGZpbGVuYW1lLCAnLnRzJyApO1xyXG4gIGF3YWl0IHdyaXRlRmlsZUFuZEdpdEFkZCggcmVwbywgZ2V0UmVsYXRpdmVQYXRoKCBzdWJkaXIsIHRzRmlsZW5hbWUgKSwgZml4RU9MKCBjb250ZW50cyApICk7XHJcbn07XHJcblxyXG4vKipcclxuICogVHJhbnNmb3JtIGFuIGltYWdlIGZpbGUgdG8gYSBKUyBmaWxlIHRoYXQgbG9hZHMgdGhlIGltYWdlIGFzIGEgbWlwbWFwLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gYWJzcGF0aCAtIHRoZSBhYnNvbHV0ZSBwYXRoIG9mIHRoZSBpbWFnZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIHJlcG9zaXRvcnkgbmFtZSBmb3IgdGhlIG1vZHVsaWZ5IGNvbW1hbmRcclxuICogQHBhcmFtIHtzdHJpbmd9IHN1YmRpciAtIHN1YmRpcmVjdG9yeSBsb2NhdGlvbiBmb3IgbW9kdWxpZmllZCBhc3NldHNcclxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIC0gbmFtZSBvZiBmaWxlIGJlaW5nIG1vZHVsaWZpZWRcclxuICovXHJcbmNvbnN0IG1vZHVsaWZ5TWlwbWFwID0gYXN5bmMgKCBhYnNwYXRoLCByZXBvLCBzdWJkaXIsIGZpbGVuYW1lICkgPT4ge1xyXG5cclxuICAvLyBEZWZhdWx0cy4gTk9URTogdXNpbmcgdGhlIGRlZmF1bHQgc2V0dGluZ3MgYmVjYXVzZSB3ZSBoYXZlIG5vdCBydW4gaW50byBhIG5lZWQsIHNlZVxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy84MjAgYW5kIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy85NDVcclxuICBjb25zdCBjb25maWcgPSB7XHJcbiAgICBsZXZlbDogNCwgLy8gbWF4aW11bSBsZXZlbFxyXG4gICAgcXVhbGl0eTogOThcclxuICB9O1xyXG5cclxuICBjb25zdCBtaXBtYXBzID0gYXdhaXQgY3JlYXRlTWlwbWFwKCBhYnNwYXRoLCBjb25maWcubGV2ZWwsIGNvbmZpZy5xdWFsaXR5ICk7XHJcbiAgY29uc3QgZW50cnkgPSBtaXBtYXBzLm1hcCggKCB7IHdpZHRoLCBoZWlnaHQsIHVybCB9ICkgPT4gKCB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQsIHVybDogdXJsIH0gKSApO1xyXG5cclxuICBjb25zdCBtaXBtYXBDb250ZW50cyA9IGAke0hFQURFUn1cclxuaW1wb3J0IGFzeW5jTG9hZGVyIGZyb20gJyR7ZXhwYW5kRG90cyggYWJzcGF0aCApfXBoZXQtY29yZS9qcy9hc3luY0xvYWRlci5qcyc7XHJcblxyXG5jb25zdCBtaXBtYXBzID0gJHtKU09OLnN0cmluZ2lmeSggZW50cnksIG51bGwsIDIgKX07XHJcbm1pcG1hcHMuZm9yRWFjaCggbWlwbWFwID0+IHtcclxuICBtaXBtYXAuaW1nID0gbmV3IEltYWdlKCk7XHJcbiAgY29uc3QgdW5sb2NrID0gYXN5bmNMb2FkZXIuY3JlYXRlTG9jayggbWlwbWFwLmltZyApO1xyXG4gIG1pcG1hcC5pbWcub25sb2FkID0gdW5sb2NrO1xyXG4gIG1pcG1hcC5pbWcuc3JjID0gbWlwbWFwLnVybDsgLy8gdHJpZ2dlciB0aGUgbG9hZGluZyBvZiB0aGUgaW1hZ2UgZm9yIGl0cyBsZXZlbFxyXG4gIG1pcG1hcC5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xyXG4gIG1pcG1hcC5jYW52YXMud2lkdGggPSBtaXBtYXAud2lkdGg7XHJcbiAgbWlwbWFwLmNhbnZhcy5oZWlnaHQgPSBtaXBtYXAuaGVpZ2h0O1xyXG4gIGNvbnN0IGNvbnRleHQgPSBtaXBtYXAuY2FudmFzLmdldENvbnRleHQoICcyZCcgKTtcclxuICBtaXBtYXAudXBkYXRlQ2FudmFzID0gKCkgPT4ge1xyXG4gICAgaWYgKCBtaXBtYXAuaW1nLmNvbXBsZXRlICYmICggdHlwZW9mIG1pcG1hcC5pbWcubmF0dXJhbFdpZHRoID09PSAndW5kZWZpbmVkJyB8fCBtaXBtYXAuaW1nLm5hdHVyYWxXaWR0aCA+IDAgKSApIHtcclxuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoIG1pcG1hcC5pbWcsIDAsIDAgKTtcclxuICAgICAgZGVsZXRlIG1pcG1hcC51cGRhdGVDYW52YXM7XHJcbiAgICB9XHJcbiAgfTtcclxufSApO1xyXG5leHBvcnQgZGVmYXVsdCBtaXBtYXBzO2A7XHJcbiAgY29uc3QganNGaWxlbmFtZSA9IGNvbnZlcnRTdWZmaXgoIGZpbGVuYW1lLCAnLmpzJyApO1xyXG4gIGF3YWl0IHdyaXRlRmlsZUFuZEdpdEFkZCggcmVwbywgZ2V0UmVsYXRpdmVQYXRoKCBzdWJkaXIsIGpzRmlsZW5hbWUgKSwgZml4RU9MKCBtaXBtYXBDb250ZW50cyApICk7XHJcbn07XHJcblxyXG4vKipcclxuICogVHJhbnNmb3JtIGEgR0xTTCBzaGFkZXIgZmlsZSB0byBhIEpTIGZpbGUgdGhhdCBpcyByZXByZXNlbnRlZCBieSBhIHN0cmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IGFic3BhdGggLSB0aGUgYWJzb2x1dGUgcGF0aCBvZiB0aGUgaW1hZ2VcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSByZXBvc2l0b3J5IG5hbWUgZm9yIHRoZSBtb2R1bGlmeSBjb21tYW5kXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdWJkaXIgLSBzdWJkaXJlY3RvcnkgbG9jYXRpb24gZm9yIG1vZHVsaWZpZWQgYXNzZXRzXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAtIG5hbWUgb2YgZmlsZSBiZWluZyBtb2R1bGlmaWVkXHJcbiAqL1xyXG5jb25zdCBtb2R1bGlmeVNoYWRlciA9IGFzeW5jICggYWJzcGF0aCwgcmVwbywgc3ViZGlyLCBmaWxlbmFtZSApID0+IHtcclxuXHJcbiAgLy8gbG9hZCB0aGUgc2hhZGVyIGZpbGVcclxuICBjb25zdCBzaGFkZXJTdHJpbmcgPSBmcy5yZWFkRmlsZVN5bmMoIGFic3BhdGgsICd1dGYtOCcgKS5yZXBsYWNlKCAvXFxyL2csICcnICk7XHJcblxyXG4gIC8vIG91dHB1dCB0aGUgY29udGVudHMgb2YgdGhlIGZpbGUgdGhhdCB3aWxsIGRlZmluZSB0aGUgc2hhZGVyIGluIEpTIGZvcm1hdFxyXG4gIGNvbnN0IGNvbnRlbnRzID0gYCR7SEVBREVSfVxyXG5leHBvcnQgZGVmYXVsdCAke0pTT04uc3RyaW5naWZ5KCBzaGFkZXJTdHJpbmcgKX1gO1xyXG5cclxuICBjb25zdCBqc0ZpbGVuYW1lID0gY29udmVydFN1ZmZpeCggZmlsZW5hbWUsICcuanMnICk7XHJcbiAgYXdhaXQgd3JpdGVGaWxlQW5kR2l0QWRkKCByZXBvLCBnZXRSZWxhdGl2ZVBhdGgoIHN1YmRpciwganNGaWxlbmFtZSApLCBmaXhFT0woIGNvbnRlbnRzICkgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZWNvZGUgYSBzb3VuZCBmaWxlIGludG8gYSBXZWIgQXVkaW8gQXVkaW9CdWZmZXIuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBhYnNwYXRoIC0gdGhlIGFic29sdXRlIHBhdGggb2YgdGhlIGltYWdlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gcmVwb3NpdG9yeSBuYW1lIGZvciB0aGUgbW9kdWxpZnkgY29tbWFuZFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3ViZGlyIC0gc3ViZGlyZWN0b3J5IGxvY2F0aW9uIGZvciBtb2R1bGlmaWVkIGFzc2V0c1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgLSBuYW1lIG9mIGZpbGUgYmVpbmcgbW9kdWxpZmllZFxyXG4gKi9cclxuY29uc3QgbW9kdWxpZnlTb3VuZCA9IGFzeW5jICggYWJzcGF0aCwgcmVwbywgc3ViZGlyLCBmaWxlbmFtZSApID0+IHtcclxuXHJcbiAgLy8gbG9hZCB0aGUgc291bmQgZmlsZVxyXG4gIGNvbnN0IGRhdGFVUkkgPSBsb2FkRmlsZUFzRGF0YVVSSSggYWJzcGF0aCApO1xyXG5cclxuICAvLyBvdXRwdXQgdGhlIGNvbnRlbnRzIG9mIHRoZSBmaWxlIHRoYXQgd2lsbCBkZWZpbmUgdGhlIHNvdW5kIGluIEpTIGZvcm1hdFxyXG4gIGNvbnN0IGNvbnRlbnRzID0gYCR7SEVBREVSfVxyXG5pbXBvcnQgYXN5bmNMb2FkZXIgZnJvbSAnJHtleHBhbmREb3RzKCBhYnNwYXRoICl9cGhldC1jb3JlL2pzL2FzeW5jTG9hZGVyLmpzJztcclxuaW1wb3J0IGJhc2U2NFNvdW5kVG9CeXRlQXJyYXkgZnJvbSAnJHtleHBhbmREb3RzKCBhYnNwYXRoICl9dGFtYm8vanMvYmFzZTY0U291bmRUb0J5dGVBcnJheS5qcyc7XHJcbmltcG9ydCBXcmFwcGVkQXVkaW9CdWZmZXIgZnJvbSAnJHtleHBhbmREb3RzKCBhYnNwYXRoICl9dGFtYm8vanMvV3JhcHBlZEF1ZGlvQnVmZmVyLmpzJztcclxuaW1wb3J0IHBoZXRBdWRpb0NvbnRleHQgZnJvbSAnJHtleHBhbmREb3RzKCBhYnNwYXRoICl9dGFtYm8vanMvcGhldEF1ZGlvQ29udGV4dC5qcyc7XHJcblxyXG5jb25zdCBzb3VuZFVSSSA9ICcke2RhdGFVUkl9JztcclxuY29uc3Qgc291bmRCeXRlQXJyYXkgPSBiYXNlNjRTb3VuZFRvQnl0ZUFycmF5KCBwaGV0QXVkaW9Db250ZXh0LCBzb3VuZFVSSSApO1xyXG5jb25zdCB1bmxvY2sgPSBhc3luY0xvYWRlci5jcmVhdGVMb2NrKCBzb3VuZFVSSSApO1xyXG5jb25zdCB3cmFwcGVkQXVkaW9CdWZmZXIgPSBuZXcgV3JhcHBlZEF1ZGlvQnVmZmVyKCk7XHJcblxyXG4vLyBzYWZlIHdheSB0byB1bmxvY2tcclxubGV0IHVubG9ja2VkID0gZmFsc2U7XHJcbmNvbnN0IHNhZmVVbmxvY2sgPSAoKSA9PiB7XHJcbiAgaWYgKCAhdW5sb2NrZWQgKSB7XHJcbiAgICB1bmxvY2soKTtcclxuICAgIHVubG9ja2VkID0gdHJ1ZTtcclxuICB9XHJcbn07XHJcblxyXG5jb25zdCBvbkRlY29kZVN1Y2Nlc3MgPSBkZWNvZGVkQXVkaW8gPT4ge1xyXG4gIGlmICggd3JhcHBlZEF1ZGlvQnVmZmVyLmF1ZGlvQnVmZmVyUHJvcGVydHkudmFsdWUgPT09IG51bGwgKSB7XHJcbiAgICB3cmFwcGVkQXVkaW9CdWZmZXIuYXVkaW9CdWZmZXJQcm9wZXJ0eS5zZXQoIGRlY29kZWRBdWRpbyApO1xyXG4gICAgc2FmZVVubG9jaygpO1xyXG4gIH1cclxufTtcclxuY29uc3Qgb25EZWNvZGVFcnJvciA9IGRlY29kZUVycm9yID0+IHtcclxuICBjb25zb2xlLndhcm4oICdkZWNvZGUgb2YgYXVkaW8gZGF0YSBmYWlsZWQsIHVzaW5nIHN0dWJiZWQgc291bmQsIGVycm9yOiAnICsgZGVjb2RlRXJyb3IgKTtcclxuICB3cmFwcGVkQXVkaW9CdWZmZXIuYXVkaW9CdWZmZXJQcm9wZXJ0eS5zZXQoIHBoZXRBdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyKCAxLCAxLCBwaGV0QXVkaW9Db250ZXh0LnNhbXBsZVJhdGUgKSApO1xyXG4gIHNhZmVVbmxvY2soKTtcclxufTtcclxuY29uc3QgZGVjb2RlUHJvbWlzZSA9IHBoZXRBdWRpb0NvbnRleHQuZGVjb2RlQXVkaW9EYXRhKCBzb3VuZEJ5dGVBcnJheS5idWZmZXIsIG9uRGVjb2RlU3VjY2Vzcywgb25EZWNvZGVFcnJvciApO1xyXG5pZiAoIGRlY29kZVByb21pc2UgKSB7XHJcbiAgZGVjb2RlUHJvbWlzZVxyXG4gICAgLnRoZW4oIGRlY29kZWRBdWRpbyA9PiB7XHJcbiAgICAgIGlmICggd3JhcHBlZEF1ZGlvQnVmZmVyLmF1ZGlvQnVmZmVyUHJvcGVydHkudmFsdWUgPT09IG51bGwgKSB7XHJcbiAgICAgICAgd3JhcHBlZEF1ZGlvQnVmZmVyLmF1ZGlvQnVmZmVyUHJvcGVydHkuc2V0KCBkZWNvZGVkQXVkaW8gKTtcclxuICAgICAgICBzYWZlVW5sb2NrKCk7XHJcbiAgICAgIH1cclxuICAgIH0gKVxyXG4gICAgLmNhdGNoKCBlID0+IHtcclxuICAgICAgY29uc29sZS53YXJuKCAncHJvbWlzZSByZWplY3Rpb24gY2F1Z2h0IGZvciBhdWRpbyBkZWNvZGUsIGVycm9yID0gJyArIGUgKTtcclxuICAgICAgc2FmZVVubG9jaygpO1xyXG4gICAgfSApO1xyXG59XHJcbmV4cG9ydCBkZWZhdWx0IHdyYXBwZWRBdWRpb0J1ZmZlcjtgO1xyXG5cclxuICBjb25zdCBqc0ZpbGVuYW1lID0gY29udmVydFN1ZmZpeCggZmlsZW5hbWUsICcuanMnICk7XHJcbiAgYXdhaXQgd3JpdGVGaWxlQW5kR2l0QWRkKCByZXBvLCBnZXRSZWxhdGl2ZVBhdGgoIHN1YmRpciwganNGaWxlbmFtZSApLCBmaXhFT0woIGNvbnRlbnRzICkgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0IC5wbmcgPT4gX3BuZ19taXBtYXAuanMsIGV0Yy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGFic3BhdGggLSBmaWxlIG5hbWUgd2l0aCBhIHN1ZmZpeCBvciBhIHBhdGggdG8gaXRcclxuICogQHBhcmFtIHtzdHJpbmd9IHN1ZmZpeCAtIHRoZSBuZXcgc3VmZml4LCBzdWNoIGFzICcuanMnXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAqL1xyXG5jb25zdCBjb252ZXJ0U3VmZml4ID0gKCBhYnNwYXRoLCBzdWZmaXggKSA9PiB7XHJcbiAgY29uc3QgbGFzdERvdEluZGV4ID0gYWJzcGF0aC5sYXN0SW5kZXhPZiggJy4nICk7XHJcbiAgcmV0dXJuIGAke2Fic3BhdGguc3Vic3RyaW5nKCAwLCBsYXN0RG90SW5kZXggKX1fJHthYnNwYXRoLnN1YnN0cmluZyggbGFzdERvdEluZGV4ICsgMSApfSR7c3VmZml4fWA7XHJcbn07XHJcblxyXG4vKipcclxuICogRGV0ZXJtaW5lcyB0aGUgc3VmZml4IGZyb20gYSBmaWxlbmFtZSwgZXZlcnl0aGluZyBhZnRlciB0aGUgZmluYWwgJy4nXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZVxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gKi9cclxuY29uc3QgZ2V0U3VmZml4ID0gZmlsZW5hbWUgPT4ge1xyXG4gIGNvbnN0IGluZGV4ID0gZmlsZW5hbWUubGFzdEluZGV4T2YoICcuJyApO1xyXG4gIHJldHVybiBmaWxlbmFtZS5zdWJzdHJpbmcoIGluZGV4ICk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhICouanMgZmlsZSBjb3JyZXNwb25kaW5nIHRvIG1hdGNoaW5nIHJlc291cmNlcyBzdWNoIGFzIGltYWdlcyBvciBzb3VuZHMuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBhYnNwYXRoXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByb290ZGlyXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdWJkaXJcclxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAqL1xyXG5jb25zdCBtb2R1bGlmeUZpbGUgPSBhc3luYyAoIGFic3BhdGgsIHJvb3RkaXIsIHN1YmRpciwgZmlsZW5hbWUsIHJlcG8gKSA9PiB7XHJcblxyXG4gIGlmICggc3ViZGlyICYmICggc3ViZGlyLnN0YXJ0c1dpdGgoICdpbWFnZXMnICkgfHxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAvLyBmb3IgYnJhbmRcclxuICAgICAgICAgICAgICAgICAgIHN1YmRpci5zdGFydHNXaXRoKCAncGhldC9pbWFnZXMnICkgfHxcclxuICAgICAgICAgICAgICAgICAgIHN1YmRpci5zdGFydHNXaXRoKCAncGhldC1pby9pbWFnZXMnICkgfHxcclxuICAgICAgICAgICAgICAgICAgIHN1YmRpci5zdGFydHNXaXRoKCAnYWRhcHRlZC1mcm9tLXBoZXQvaW1hZ2VzJyApIClcclxuICAgICAgICYmIElNQUdFX1NVRkZJWEVTLmluZGV4T2YoIGdldFN1ZmZpeCggZmlsZW5hbWUgKSApID49IDAgKSB7XHJcbiAgICBpZiAoIGdldFN1ZmZpeCggZmlsZW5hbWUgKSA9PT0gJy5zdmcnICkge1xyXG4gICAgICBhd2FpdCBtb2R1bGlmeVNWRyggYWJzcGF0aCwgcmVwbywgc3ViZGlyLCBmaWxlbmFtZSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGF3YWl0IG1vZHVsaWZ5SW1hZ2UoIGFic3BhdGgsIHJlcG8sIHN1YmRpciwgZmlsZW5hbWUgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmICggc3ViZGlyICYmICggc3ViZGlyLnN0YXJ0c1dpdGgoICdtaXBtYXBzJyApIHx8XHJcblxyXG4gICAgICAgICAgICAgICAgICAgLy8gZm9yIGJyYW5kXHJcbiAgICAgICAgICAgICAgICAgICBzdWJkaXIuc3RhcnRzV2l0aCggJ3BoZXQvbWlwbWFwcycgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgc3ViZGlyLnN0YXJ0c1dpdGgoICdwaGV0LWlvL21pcG1hcHMnICkgfHxcclxuICAgICAgICAgICAgICAgICAgIHN1YmRpci5zdGFydHNXaXRoKCAnYWRhcHRlZC1mcm9tLXBoZXQvbWlwbWFwcycgKSApXHJcbiAgICAgICAmJiBJTUFHRV9TVUZGSVhFUy5pbmRleE9mKCBnZXRTdWZmaXgoIGZpbGVuYW1lICkgKSA+PSAwICkge1xyXG4gICAgYXdhaXQgbW9kdWxpZnlNaXBtYXAoIGFic3BhdGgsIHJlcG8sIHN1YmRpciwgZmlsZW5hbWUgKTtcclxuICB9XHJcblxyXG4gIGlmICggc3ViZGlyICYmIHN1YmRpci5zdGFydHNXaXRoKCAnc291bmRzJyApICYmIFNPVU5EX1NVRkZJWEVTLmluZGV4T2YoIGdldFN1ZmZpeCggZmlsZW5hbWUgKSApID49IDAgKSB7XHJcbiAgICBhd2FpdCBtb2R1bGlmeVNvdW5kKCBhYnNwYXRoLCByZXBvLCBzdWJkaXIsIGZpbGVuYW1lICk7XHJcbiAgfVxyXG5cclxuICBpZiAoIHN1YmRpciAmJiBzdWJkaXIuc3RhcnRzV2l0aCggJ3NoYWRlcnMnICkgJiYgU0hBREVSX1NVRkZJWEVTLmluZGV4T2YoIGdldFN1ZmZpeCggZmlsZW5hbWUgKSApID49IDAgKSB7XHJcbiAgICBhd2FpdCBtb2R1bGlmeVNoYWRlciggYWJzcGF0aCwgcmVwbywgc3ViZGlyLCBmaWxlbmFtZSApO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIHRoZSBpbWFnZSBtb2R1bGUgYXQganMvJHtfLmNhbWVsQ2FzZSggcmVwbyApfUltYWdlcy5qcyBmb3IgcmVwb3MgdGhhdCBuZWVkIGl0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXNcclxuICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XHJcbiAqL1xyXG5jb25zdCBjcmVhdGVJbWFnZU1vZHVsZSA9IGFzeW5jICggcmVwbywgc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzICkgPT4ge1xyXG4gIGNvbnN0IHNwZWMgPSBncnVudC5maWxlLnJlYWRKU09OKCBgLi4vJHtyZXBvfS8ke3JlcG99LWltYWdlcy5qc29uYCApO1xyXG4gIGNvbnN0IG5hbWVzcGFjZSA9IF8uY2FtZWxDYXNlKCByZXBvICk7XHJcbiAgY29uc3QgaW1hZ2VNb2R1bGVOYW1lID0gYCR7cGFzY2FsQ2FzZSggcmVwbyApfUltYWdlc2A7XHJcbiAgY29uc3QgcmVsYXRpdmVJbWFnZU1vZHVsZUZpbGUgPSBganMvJHtpbWFnZU1vZHVsZU5hbWV9LnRzYDtcclxuXHJcbiAgY29uc3QgcHJvdmlkZWRSZWdpb25zQW5kQ3VsdHVyZXMgPSBPYmplY3Qua2V5cyggc3BlYyApO1xyXG5cclxuICAvLyBFbnN1cmUgb3VyIHJlZ2lvbkFuZEN1bHR1cmVzIGluIHRoZSAtaW1hZ2VzLmpzb24gZmlsZSBtYXRjaCB3aXRoIHRoZSBzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMgaW4gdGhlIHBhY2thZ2UuanNvblxyXG4gIHN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlcy5mb3JFYWNoKCByZWdpb25BbmRDdWx0dXJlID0+IHtcclxuICAgIGlmICggIXByb3ZpZGVkUmVnaW9uc0FuZEN1bHR1cmVzLmluY2x1ZGVzKCByZWdpb25BbmRDdWx0dXJlICkgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggYHJlZ2lvbkFuZEN1bHR1cmUgJyR7cmVnaW9uQW5kQ3VsdHVyZX0nIGlzIHJlcXVpcmVkLCBidXQgbm90IGZvdW5kIGluICR7cmVwb30taW1hZ2VzLmpzb25gICk7XHJcbiAgICB9XHJcbiAgfSApO1xyXG4gIHByb3ZpZGVkUmVnaW9uc0FuZEN1bHR1cmVzLmZvckVhY2goIHJlZ2lvbkFuZEN1bHR1cmUgPT4ge1xyXG4gICAgaWYgKCAhc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzLmluY2x1ZGVzKCByZWdpb25BbmRDdWx0dXJlICkgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggYHJlZ2lvbkFuZEN1bHR1cmUgJyR7cmVnaW9uQW5kQ3VsdHVyZX0nIGlzIG5vdCBzdXBwb3J0ZWQsIGJ1dCBmb3VuZCBpbiAke3JlcG99LWltYWdlcy5qc29uYCApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgaW1hZ2VOYW1lcyA9IF8udW5pcSggcHJvdmlkZWRSZWdpb25zQW5kQ3VsdHVyZXMuZmxhdE1hcCggcmVnaW9uQW5kQ3VsdHVyZSA9PiB7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoIHNwZWNbIHJlZ2lvbkFuZEN1bHR1cmUgXSApO1xyXG4gIH0gKSApLnNvcnQoKTtcclxuXHJcbiAgY29uc3QgaW1hZ2VGaWxlcyA9IF8udW5pcSggcHJvdmlkZWRSZWdpb25zQW5kQ3VsdHVyZXMuZmxhdE1hcCggcmVnaW9uQW5kQ3VsdHVyZSA9PiB7XHJcbiAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyggc3BlY1sgcmVnaW9uQW5kQ3VsdHVyZSBdICk7XHJcbiAgfSApICkuc29ydCgpO1xyXG5cclxuICAvLyBEbyBpbWFnZXMgZXhpc3Q/XHJcbiAgaW1hZ2VGaWxlcy5mb3JFYWNoKCBpbWFnZUZpbGUgPT4ge1xyXG4gICAgaWYgKCAhZnMuZXhpc3RzU3luYyggYC4uLyR7cmVwb30vJHtpbWFnZUZpbGV9YCApICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIGBJbWFnZSBmaWxlICR7aW1hZ2VGaWxlfSBpcyByZWZlcmVuY2VkIGluICR7cmVwb30taW1hZ2VzLmpzb24sIGJ1dCBkb2VzIG5vdCBleGlzdGAgKTtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIC8vIEVuc3VyZSB0aGF0IGFsbCBpbWFnZSBuYW1lcyBhcmUgcHJvdmlkZWQgZm9yIGFsbCByZWdpb25BbmRDdWx0dXJlc1xyXG4gIHByb3ZpZGVkUmVnaW9uc0FuZEN1bHR1cmVzLmZvckVhY2goIHJlZ2lvbkFuZEN1bHR1cmUgPT4ge1xyXG4gICAgaW1hZ2VOYW1lcy5mb3JFYWNoKCBpbWFnZU5hbWUgPT4ge1xyXG4gICAgICBpZiAoICFzcGVjWyByZWdpb25BbmRDdWx0dXJlIF0uaGFzT3duUHJvcGVydHkoIGltYWdlTmFtZSApICkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYEltYWdlIG5hbWUgJHtpbWFnZU5hbWV9IGlzIG5vdCBwcm92aWRlZCBmb3IgcmVnaW9uQW5kQ3VsdHVyZSAke3JlZ2lvbkFuZEN1bHR1cmV9IChidXQgcHJvdmlkZWQgZm9yIG90aGVycylgICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9ICk7XHJcblxyXG4gIGNvbnN0IGdldEltcG9ydE5hbWUgPSBpbWFnZUZpbGUgPT4gcGF0aC5iYXNlbmFtZSggaW1hZ2VGaWxlLCBwYXRoLmV4dG5hbWUoIGltYWdlRmlsZSApICk7XHJcblxyXG4gIC8vIENoZWNrIHRoYXQgaW1wb3J0IG5hbWVzIGFyZSB1bmlxdWVcclxuICAvLyBOT1RFOiB3ZSBjb3VsZCBkaXNhbWJpZ3VhdGUgaW4gdGhlIGZ1dHVyZSBpbiBhbiBhdXRvbWF0ZWQgd2F5IGZhaXJseSBlYXNpbHksIGJ1dCBzaG91bGQgaXQgYmUgZG9uZT9cclxuICBpZiAoIF8udW5pcSggaW1hZ2VGaWxlcy5tYXAoIGdldEltcG9ydE5hbWUgKSApLmxlbmd0aCAhPT0gaW1hZ2VGaWxlcy5sZW5ndGggKSB7XHJcbiAgICAvLyBGaW5kIGFuZCByZXBvcnQgdGhlIG5hbWUgY29sbGlzaW9uXHJcbiAgICBjb25zdCBpbXBvcnROYW1lcyA9IGltYWdlRmlsZXMubWFwKCBnZXRJbXBvcnROYW1lICk7XHJcbiAgICBjb25zdCBkdXBsaWNhdGVzID0gaW1wb3J0TmFtZXMuZmlsdGVyKCAoIG5hbWUsIGluZGV4ICkgPT4gaW1wb3J0TmFtZXMuaW5kZXhPZiggbmFtZSApICE9PSBpbmRleCApO1xyXG4gICAgaWYgKCBkdXBsaWNhdGVzLmxlbmd0aCApIHsgLy8gc2FuaXR5IGNoZWNrIVxyXG4gICAgICBjb25zdCBmaXJzdER1cGxpY2F0ZSA9IGR1cGxpY2F0ZXNbIDAgXTtcclxuICAgICAgY29uc3Qgb3JpZ2luYWxOYW1lcyA9IGltYWdlRmlsZXMuZmlsdGVyKCBpbWFnZUZpbGUgPT4gZ2V0SW1wb3J0TmFtZSggaW1hZ2VGaWxlICkgPT09IGZpcnN0RHVwbGljYXRlICk7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggYE11bHRpcGxlIGltYWdlcyByZXN1bHQgaW4gdGhlIHNhbWUgaW1wb3J0IG5hbWUgJHtmaXJzdER1cGxpY2F0ZX06ICR7b3JpZ2luYWxOYW1lcy5qb2luKCAnLCAnICl9YCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgY29weXJpZ2h0TGluZSA9IGF3YWl0IGdldENvcHlyaWdodExpbmUoIHJlcG8sIHJlbGF0aXZlSW1hZ2VNb2R1bGVGaWxlICk7XHJcbiAgYXdhaXQgd3JpdGVGaWxlQW5kR2l0QWRkKCByZXBvLCByZWxhdGl2ZUltYWdlTW9kdWxlRmlsZSwgZml4RU9MKFxyXG4gICAgYCR7Y29weXJpZ2h0TGluZX1cclxuXHJcbi8qKlxyXG4gKiBBdXRvLWdlbmVyYXRlZCBmcm9tIG1vZHVsaWZ5LCBETyBOT1QgbWFudWFsbHkgbW9kaWZ5LlxyXG4gKi9cclxuLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IExvY2FsaXplZEltYWdlUHJvcGVydHkgZnJvbSAnLi4vLi4vam9pc3QvanMvaTE4bi9Mb2NhbGl6ZWRJbWFnZVByb3BlcnR5LmpzJztcclxuaW1wb3J0ICR7bmFtZXNwYWNlfSBmcm9tICcuLyR7bmFtZXNwYWNlfS5qcyc7XHJcbiR7aW1hZ2VGaWxlcy5tYXAoIGltYWdlRmlsZSA9PiBgaW1wb3J0ICR7Z2V0SW1wb3J0TmFtZSggaW1hZ2VGaWxlICl9IGZyb20gJy4uLyR7aW1hZ2VGaWxlLnJlcGxhY2UoICcudHMnLCAnLmpzJyApfSc7YCApLmpvaW4oICdcXG4nICl9XHJcblxyXG5jb25zdCAke2ltYWdlTW9kdWxlTmFtZX0gPSB7XHJcbiAgJHtpbWFnZU5hbWVzLm1hcCggaW1hZ2VOYW1lID0+XHJcbiAgYCR7aW1hZ2VOYW1lfUltYWdlUHJvcGVydHk6IG5ldyBMb2NhbGl6ZWRJbWFnZVByb3BlcnR5KCAnJHtpbWFnZU5hbWV9Jywge1xyXG4gICAgJHtzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMubWFwKCByZWdpb25BbmRDdWx0dXJlID0+IGAke3JlZ2lvbkFuZEN1bHR1cmV9OiAke2dldEltcG9ydE5hbWUoIHNwZWNbIHJlZ2lvbkFuZEN1bHR1cmUgXVsgaW1hZ2VOYW1lIF0gKX1gICkuam9pbiggJyxcXG4gICAgJyApfVxyXG4gIH0gKWAgKS5qb2luKCAnLFxcbiAgJyApfVxyXG59O1xyXG5cclxuJHtuYW1lc3BhY2V9LnJlZ2lzdGVyKCAnJHtpbWFnZU1vZHVsZU5hbWV9JywgJHtpbWFnZU1vZHVsZU5hbWV9ICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCAke2ltYWdlTW9kdWxlTmFtZX07XHJcbmAgKSApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgdGhlIHN0cmluZyBtb2R1bGUgYXQganMvJHtfLmNhbWVsQ2FzZSggcmVwbyApfVN0cmluZ3MuanMgZm9yIHJlcG9zIHRoYXQgbmVlZCBpdC5cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gKi9cclxuY29uc3QgY3JlYXRlU3RyaW5nTW9kdWxlID0gYXN5bmMgcmVwbyA9PiB7XHJcblxyXG4gIGNvbnN0IHBhY2thZ2VPYmplY3QgPSBncnVudC5maWxlLnJlYWRKU09OKCBgLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gICk7XHJcbiAgY29uc3Qgc3RyaW5nTW9kdWxlTmFtZSA9IGAke3Bhc2NhbENhc2UoIHJlcG8gKX1TdHJpbmdzYDtcclxuICBjb25zdCByZWxhdGl2ZVN0cmluZ01vZHVsZUZpbGUgPSBganMvJHtzdHJpbmdNb2R1bGVOYW1lfS50c2A7XHJcbiAgY29uc3Qgc3RyaW5nTW9kdWxlRmlsZUpTID0gYC4uLyR7cmVwb30vanMvJHtzdHJpbmdNb2R1bGVOYW1lfS5qc2A7XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gXy5jYW1lbENhc2UoIHJlcG8gKTtcclxuXHJcbiAgaWYgKCBmcy5leGlzdHNTeW5jKCBzdHJpbmdNb2R1bGVGaWxlSlMgKSApIHtcclxuICAgIGNvbnNvbGUubG9nKCAnRm91bmQgSlMgc3RyaW5nIGZpbGUgaW4gVFMgcmVwby4gIEl0IHNob3VsZCBiZSBkZWxldGVkIG1hbnVhbGx5LiAgJyArIHN0cmluZ01vZHVsZUZpbGVKUyApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgY29weXJpZ2h0TGluZSA9IGF3YWl0IGdldENvcHlyaWdodExpbmUoIHJlcG8sIHJlbGF0aXZlU3RyaW5nTW9kdWxlRmlsZSApO1xyXG4gIGF3YWl0IHdyaXRlRmlsZUFuZEdpdEFkZCggcmVwbywgcmVsYXRpdmVTdHJpbmdNb2R1bGVGaWxlLCBmaXhFT0woXHJcbiAgICBgJHtjb3B5cmlnaHRMaW5lfVxyXG5cclxuLyoqXHJcbiAqIEF1dG8tZ2VuZXJhdGVkIGZyb20gbW9kdWxpZnksIERPIE5PVCBtYW51YWxseSBtb2RpZnkuXHJcbiAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgZ2V0U3RyaW5nTW9kdWxlIGZyb20gJy4uLy4uL2NoaXBwZXIvanMvZ2V0U3RyaW5nTW9kdWxlLmpzJztcclxuaW1wb3J0IHR5cGUgTG9jYWxpemVkU3RyaW5nUHJvcGVydHkgZnJvbSAnLi4vLi4vY2hpcHBlci9qcy9Mb2NhbGl6ZWRTdHJpbmdQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCAke25hbWVzcGFjZX0gZnJvbSAnLi8ke25hbWVzcGFjZX0uanMnO1xyXG5cclxudHlwZSBTdHJpbmdzVHlwZSA9ICR7Z2V0U3RyaW5nVHlwZXMoIHJlcG8gKX07XHJcblxyXG5jb25zdCAke3N0cmluZ01vZHVsZU5hbWV9ID0gZ2V0U3RyaW5nTW9kdWxlKCAnJHtwYWNrYWdlT2JqZWN0LnBoZXQucmVxdWlyZWpzTmFtZXNwYWNlfScgKSBhcyBTdHJpbmdzVHlwZTtcclxuXHJcbiR7bmFtZXNwYWNlfS5yZWdpc3RlciggJyR7c3RyaW5nTW9kdWxlTmFtZX0nLCAke3N0cmluZ01vZHVsZU5hbWV9ICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCAke3N0cmluZ01vZHVsZU5hbWV9O1xyXG5gICkgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgKi5kLnRzIGZpbGUgdGhhdCByZXByZXNlbnRzIHRoZSB0eXBlcyBvZiB0aGUgc3RyaW5ncyBmb3IgdGhlIHJlcG8uXHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG9cclxuICovXHJcbmNvbnN0IGdldFN0cmluZ1R5cGVzID0gcmVwbyA9PiB7XHJcbiAgY29uc3QgcGFja2FnZU9iamVjdCA9IGdydW50LmZpbGUucmVhZEpTT04oIGAuLi8ke3JlcG99L3BhY2thZ2UuanNvbmAgKTtcclxuICBjb25zdCBqc29uID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggYC4uLyR7cmVwb30vJHtyZXBvfS1zdHJpbmdzX2VuLmpzb25gICk7XHJcblxyXG4gIC8vIFRyYWNrIHBhdGhzIHRvIGFsbCB0aGUga2V5cyB3aXRoIHZhbHVlcy5cclxuICBjb25zdCBhbGwgPSBbXTtcclxuXHJcbiAgLy8gUmVjdXJzaXZlbHkgY29sbGVjdCBhbGwgb2YgdGhlIHBhdGhzIHRvIGtleXMgd2l0aCB2YWx1ZXMuXHJcbiAgY29uc3QgdmlzaXQgPSAoIGxldmVsLCBwYXRoICkgPT4ge1xyXG4gICAgT2JqZWN0LmtleXMoIGxldmVsICkuZm9yRWFjaCgga2V5ID0+IHtcclxuICAgICAgaWYgKCBrZXkgIT09ICdfY29tbWVudCcgKSB7XHJcbiAgICAgICAgaWYgKCBsZXZlbFsga2V5IF0udmFsdWUgJiYgdHlwZW9mIGxldmVsWyBrZXkgXS52YWx1ZSA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgICBhbGwucHVzaCggeyBwYXRoOiBbIC4uLnBhdGgsIGtleSBdLCB2YWx1ZTogbGV2ZWxbIGtleSBdLnZhbHVlIH0gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICB2aXNpdCggbGV2ZWxbIGtleSBdLCBbIC4uLnBhdGgsIGtleSBdICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfTtcclxuICB2aXNpdCgganNvbiwgW10gKTtcclxuXHJcbiAgLy8gVHJhbnNmb3JtIHRvIGEgbmV3IHN0cnVjdHVyZSB0aGF0IG1hdGNoZXMgdGhlIHR5cGVzIHdlIGFjY2VzcyBhdCBydW50aW1lLlxyXG4gIGNvbnN0IHN0cnVjdHVyZSA9IHt9O1xyXG4gIGZvciAoIGxldCBpID0gMDsgaSA8IGFsbC5sZW5ndGg7IGkrKyApIHtcclxuICAgIGNvbnN0IGFsbEVsZW1lbnQgPSBhbGxbIGkgXTtcclxuICAgIGNvbnN0IHBhdGggPSBhbGxFbGVtZW50LnBhdGg7XHJcbiAgICBsZXQgbGV2ZWwgPSBzdHJ1Y3R1cmU7XHJcbiAgICBmb3IgKCBsZXQgayA9IDA7IGsgPCBwYXRoLmxlbmd0aDsgaysrICkge1xyXG4gICAgICBjb25zdCBwYXRoRWxlbWVudCA9IHBhdGhbIGsgXTtcclxuICAgICAgY29uc3QgdG9rZW5zID0gcGF0aEVsZW1lbnQuc3BsaXQoICcuJyApO1xyXG4gICAgICBmb3IgKCBsZXQgbSA9IDA7IG0gPCB0b2tlbnMubGVuZ3RoOyBtKysgKSB7XHJcbiAgICAgICAgY29uc3QgdG9rZW4gPSB0b2tlbnNbIG0gXTtcclxuXHJcbiAgICAgICAgYXNzZXJ0KCAhdG9rZW4uaW5jbHVkZXMoICc7JyApLCBgVG9rZW4gJHt0b2tlbn0gY2Fubm90IGluY2x1ZGUgZm9yYmlkZGVuIGNoYXJhY3RlcnNgICk7XHJcbiAgICAgICAgYXNzZXJ0KCAhdG9rZW4uaW5jbHVkZXMoICcsJyApLCBgVG9rZW4gJHt0b2tlbn0gY2Fubm90IGluY2x1ZGUgZm9yYmlkZGVuIGNoYXJhY3RlcnNgICk7XHJcbiAgICAgICAgYXNzZXJ0KCAhdG9rZW4uaW5jbHVkZXMoICcgJyApLCBgVG9rZW4gJHt0b2tlbn0gY2Fubm90IGluY2x1ZGUgZm9yYmlkZGVuIGNoYXJhY3RlcnNgICk7XHJcblxyXG4gICAgICAgIGlmICggayA9PT0gcGF0aC5sZW5ndGggLSAxICYmIG0gPT09IHRva2Vucy5sZW5ndGggLSAxICkge1xyXG4gICAgICAgICAgaWYgKCAhKCBwYWNrYWdlT2JqZWN0LnBoZXQgJiYgcGFja2FnZU9iamVjdC5waGV0LnNpbUZlYXR1cmVzICYmIHBhY2thZ2VPYmplY3QucGhldC5zaW1GZWF0dXJlcy5zdXBwb3J0c0R5bmFtaWNMb2NhbGUgKSApIHtcclxuICAgICAgICAgICAgbGV2ZWxbIHRva2VuIF0gPSAne3tTVFJJTkd9fSc7IC8vIGluc3RlYWQgb2YgdmFsdWUgPSBhbGxFbGVtZW50LnZhbHVlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBsZXZlbFsgYCR7dG9rZW59U3RyaW5nUHJvcGVydHlgIF0gPSAne3tTVFJJTkdfUFJPUEVSVFl9fSc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgbGV2ZWxbIHRva2VuIF0gPSBsZXZlbFsgdG9rZW4gXSB8fCB7fTtcclxuICAgICAgICAgIGxldmVsID0gbGV2ZWxbIHRva2VuIF07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBsZXQgdGV4dCA9IEpTT04uc3RyaW5naWZ5KCBzdHJ1Y3R1cmUsIG51bGwsIDIgKTtcclxuXHJcbiAgLy8gVXNlIHNpbmdsZSBxdW90ZXMgaW5zdGVhZCBvZiB0aGUgZG91YmxlIHF1b3RlcyBmcm9tIEpTT05cclxuICB0ZXh0ID0gcmVwbGFjZSggdGV4dCwgJ1wiJywgJ1xcJycgKTtcclxuXHJcbiAgdGV4dCA9IHJlcGxhY2UoIHRleHQsICdcXCd7e1NUUklOR319XFwnJywgJ3N0cmluZycgKTtcclxuICB0ZXh0ID0gcmVwbGFjZSggdGV4dCwgJ1xcJ3t7U1RSSU5HX1BST1BFUlRZfX1cXCcnLCAnTG9jYWxpemVkU3RyaW5nUHJvcGVydHknICk7XHJcblxyXG4gIC8vIEFkZCA7IHRvIHRoZSBsYXN0IGluIHRoZSBsaXN0XHJcbiAgdGV4dCA9IHJlcGxhY2UoIHRleHQsICc6IHN0cmluZ1xcbicsICc6IHN0cmluZztcXG4nICk7XHJcbiAgdGV4dCA9IHJlcGxhY2UoIHRleHQsICc6IExvY2FsaXplZFN0cmluZ1Byb3BlcnR5XFxuJywgJzogTG9jYWxpemVkU3RyaW5nUHJvcGVydHk7XFxuJyApO1xyXG5cclxuICAvLyBVc2UgOyBpbnN0ZWFkIG9mICxcclxuICB0ZXh0ID0gcmVwbGFjZSggdGV4dCwgJywnLCAnOycgKTtcclxuXHJcbiAgcmV0dXJuIHRleHQ7XHJcbn07XHJcblxyXG4vKipcclxuICogRW50cnkgcG9pbnQgZm9yIG1vZHVsaWZ5LCB3aGljaCB0cmFuc2Zvcm1zIGFsbCBvZiB0aGUgcmVzb3VyY2VzIGluIGEgcmVwbyB0byAqLmpzIGZpbGVzLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIHRoZSBuYW1lIG9mIGEgcmVwbywgc3VjaCBhcyAnam9pc3QnXHJcbiAqL1xyXG5jb25zdCBtb2R1bGlmeSA9IGFzeW5jIHJlcG8gPT4ge1xyXG4gIGNvbnNvbGUubG9nKCBgbW9kdWxpZnlpbmcgJHtyZXBvfWAgKTtcclxuICBjb25zdCByZWxhdGl2ZUZpbGVzID0gW107XHJcbiAgZ3J1bnQuZmlsZS5yZWN1cnNlKCBgLi4vJHtyZXBvfWAsIGFzeW5jICggYWJzcGF0aCwgcm9vdGRpciwgc3ViZGlyLCBmaWxlbmFtZSApID0+IHtcclxuICAgIHJlbGF0aXZlRmlsZXMucHVzaCggeyBhYnNwYXRoOiBhYnNwYXRoLCByb290ZGlyOiByb290ZGlyLCBzdWJkaXI6IHN1YmRpciwgZmlsZW5hbWU6IGZpbGVuYW1lIH0gKTtcclxuICB9ICk7XHJcblxyXG4gIGZvciAoIGxldCBpID0gMDsgaSA8IHJlbGF0aXZlRmlsZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICBjb25zdCBlbnRyeSA9IHJlbGF0aXZlRmlsZXNbIGkgXTtcclxuICAgIGF3YWl0IG1vZHVsaWZ5RmlsZSggZW50cnkuYWJzcGF0aCwgZW50cnkucm9vdGRpciwgZW50cnkuc3ViZGlyLCBlbnRyeS5maWxlbmFtZSwgcmVwbyApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcGFja2FnZU9iamVjdCA9IGdydW50LmZpbGUucmVhZEpTT04oIGAuLi8ke3JlcG99L3BhY2thZ2UuanNvbmAgKTtcclxuXHJcbiAgLy8gU3RyaW5ncyBtb2R1bGUgZmlsZVxyXG4gIGlmICggZnMuZXhpc3RzU3luYyggYC4uLyR7cmVwb30vJHtyZXBvfS1zdHJpbmdzX2VuLmpzb25gICkgJiYgcGFja2FnZU9iamVjdC5waGV0ICYmIHBhY2thZ2VPYmplY3QucGhldC5yZXF1aXJlanNOYW1lc3BhY2UgKSB7XHJcbiAgICBhd2FpdCBjcmVhdGVTdHJpbmdNb2R1bGUoIHJlcG8gKTtcclxuICB9XHJcblxyXG4gIC8vIEltYWdlcyBtb2R1bGUgZmlsZSAobG9jYWxpemVkIGltYWdlcylcclxuICBpZiAoIGZzLmV4aXN0c1N5bmMoIGAuLi8ke3JlcG99LyR7cmVwb30taW1hZ2VzLmpzb25gICkgKSB7XHJcbiAgICBjb25zdCBzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMgPSBwYWNrYWdlT2JqZWN0Py5waGV0Py5zaW1GZWF0dXJlcz8uc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzO1xyXG5cclxuICAgIGlmICggIXN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlcyApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCBgc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzIGlzIG5vdCBkZWZpbmVkIGluIHBhY2thZ2UuanNvbiwgYnV0ICR7cmVwb30taW1hZ2VzLmpzb24gZXhpc3RzYCApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggIXN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlcy5pbmNsdWRlcyggJ3VzYScgKSApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCAncmVnaW9uQW5kQ3VsdHVyZSBcXCd1c2FcXCcgaXMgcmVxdWlyZWQsIGJ1dCBub3QgZm91bmQgaW4gc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzJyApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzLmluY2x1ZGVzKCAnbXVsdGknICkgJiYgc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzLmxlbmd0aCA8IDMgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggJ3JlZ2lvbkFuZEN1bHR1cmUgXFwnbXVsdGlcXCcgaXMgc3VwcG9ydGVkLCBidXQgdGhlcmUgYXJlIG5vdCBlbm91Z2ggcmVnaW9uQW5kQ3VsdHVyZXMgdG8gc3VwcG9ydCBpdCcgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjb25jcmV0ZVJlZ2lvbnNBbmRDdWx0dXJlcyA9IHN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlcy5maWx0ZXIoIHJlZ2lvbkFuZEN1bHR1cmUgPT4gcmVnaW9uQW5kQ3VsdHVyZSAhPT0gJ3JhbmRvbScgKTtcclxuICAgIFxyXG4gICAgLy8gVXBkYXRlIHRoZSBpbWFnZXMgbW9kdWxlIGZpbGVcclxuICAgIGF3YWl0IGNyZWF0ZUltYWdlTW9kdWxlKCByZXBvLCBjb25jcmV0ZVJlZ2lvbnNBbmRDdWx0dXJlcyApO1xyXG4gIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbW9kdWxpZnk7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7K0NBQ0EscUpBQUFBLG1CQUFBLFlBQUFBLG9CQUFBLFdBQUFDLENBQUEsU0FBQUMsQ0FB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