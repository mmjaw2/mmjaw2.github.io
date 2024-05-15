"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }
function _construct(t, e, r) { if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments); var o = [null]; o.push.apply(o, e); var p = new (t.bind.apply(t, o))(); return r && _setPrototypeOf(p, r.prototype), p; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _isNativeFunction(fn) { try { return Function.toString.call(fn).indexOf("[native code]") !== -1; } catch (e) { return typeof fn === "function"; } }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Copyright 2017, University of Colorado Boulder

/**
 * Command execution wrapper (with common settings)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var child_process = require('child_process');
var winston = require('../../../../../../perennial-alias/node_modules/winston');
var _ = require('lodash');
var assert = require('assert');
var grunt = require('grunt');

/**
 * Executes a command, with specific arguments and in a specific directory (cwd).
 * @public
 *
 * Resolves with the stdout: {string}
 * Rejects with { code: {number}, stdout: {string} } -- Happens if the exit code is non-zero.
 *
 * @param {string} cmd - The process to execute. Should be on the current path.
 * @param {Array.<string>} args - Array of arguments. No need to extra-quote things.
 * @param {string} cwd - The working directory where the process should be run from
 * @param {Object} [options]
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */
module.exports = function (cmd, args, cwd, options) {
  var startTime = Date.now();
  options = _.merge({
    // {'reject'|'resolve'} - whether errors should be rejected or resolved.  If errors are resolved, then an object
    //                      - of the form {code:number,stdout:string,stderr:string} is returned. 'resolve' allows usage
    //                      - in Promise.all without exiting on the 1st failure
    errors: 'reject',
    // Provide additional env variables, and they will be merged with the existing defaults.
    childProcessEnv: _objectSpread({}, process.env)
  }, options);
  assert(options.errors === 'reject' || options.errors === 'resolve', 'Errors must reject or resolve');
  return new Promise(function (resolve, reject) {
    var rejectedByError = false;
    var stdout = ''; // to be appended to
    var stderr = '';
    var childProcess = child_process.spawn(cmd, args, {
      cwd: cwd,
      env: options.childProcessEnv
    });
    childProcess.on('error', function (error) {
      rejectedByError = true;
      if (options.errors === 'resolve') {
        resolve({
          code: 1,
          stdout: stdout,
          stderr: stderr,
          cwd: cwd,
          error: error,
          time: Date.now() - startTime
        });
      } else {
        reject(new ExecuteError(cmd, args, cwd, stdout, stderr, -1, Date.now() - startTime));
      }
    });
    winston.debug("Running ".concat(cmd, " ").concat(args.join(' '), " from ").concat(cwd));
    childProcess.stderr.on('data', function (data) {
      stderr += data;
      grunt.log.debug("stderr: ".concat(data));
      winston.debug("stderr: ".concat(data));
    });
    childProcess.stdout.on('data', function (data) {
      stdout += data;
      grunt.log.debug("stdout: ".concat(data));
      winston.debug("stdout: ".concat(data));
    });
    childProcess.on('close', function (code) {
      winston.debug("Command ".concat(cmd, " finished. Output is below."));
      winston.debug(stderr && "stderr: ".concat(stderr) || 'stderr is empty.');
      winston.debug(stdout && "stdout: ".concat(stdout) || 'stdout is empty.');
      if (!rejectedByError) {
        if (options.errors === 'resolve') {
          resolve({
            code: code,
            stdout: stdout,
            stderr: stderr,
            cwd: cwd,
            time: Date.now() - startTime
          });
        } else {
          if (code !== 0) {
            reject(new ExecuteError(cmd, args, cwd, stdout, stderr, code, Date.now() - startTime));
          } else {
            resolve(stdout);
          }
        }
      }
    });
  });
};
var ExecuteError = /*#__PURE__*/function (_Error) {
  /**
   * @param {string} cmd
   * @param {Array.<string>} args
   * @param {string} cwd
   * @param {string} stdout
   * @param {string} stderr
   * @param {number} code - exit code
   * @param {number} time - ms
   */
  function ExecuteError(cmd, args, cwd, stdout, stderr, code, time) {
    var _this;
    _classCallCheck(this, ExecuteError);
    _this = _callSuper(this, ExecuteError, ["".concat(cmd, " ").concat(args.join(' '), " in ").concat(cwd, " failed with exit code ").concat(code).concat(stdout ? "\nstdout:\n".concat(stdout) : '').concat(stderr ? "\nstderr:\n".concat(stderr) : '')]);

    // @public
    _this.cmd = cmd;
    _this.args = args;
    _this.cwd = cwd;
    _this.stdout = stdout;
    _this.stderr = stderr;
    _this.code = code;
    _this.time = time;
    return _this;
  }
  _inherits(ExecuteError, _Error);
  return _createClass(ExecuteError);
}( /*#__PURE__*/_wrapNativeSuper(Error));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGlsZF9wcm9jZXNzIiwicmVxdWlyZSIsIndpbnN0b24iLCJfIiwiYXNzZXJ0IiwiZ3J1bnQiLCJtb2R1bGUiLCJleHBvcnRzIiwiY21kIiwiYXJncyIsImN3ZCIsIm9wdGlvbnMiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwibWVyZ2UiLCJlcnJvcnMiLCJjaGlsZFByb2Nlc3NFbnYiLCJfb2JqZWN0U3ByZWFkIiwicHJvY2VzcyIsImVudiIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwicmVqZWN0ZWRCeUVycm9yIiwic3Rkb3V0Iiwic3RkZXJyIiwiY2hpbGRQcm9jZXNzIiwic3Bhd24iLCJvbiIsImVycm9yIiwiY29kZSIsInRpbWUiLCJFeGVjdXRlRXJyb3IiLCJkZWJ1ZyIsImNvbmNhdCIsImpvaW4iLCJkYXRhIiwibG9nIiwiX0Vycm9yIiwiX3RoaXMiLCJfY2xhc3NDYWxsQ2hlY2siLCJfY2FsbFN1cGVyIiwiX2luaGVyaXRzIiwiX2NyZWF0ZUNsYXNzIiwiX3dyYXBOYXRpdmVTdXBlciIsIkVycm9yIl0sInNvdXJjZXMiOlsiZXhlY3V0ZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ29tbWFuZCBleGVjdXRpb24gd3JhcHBlciAod2l0aCBjb21tb24gc2V0dGluZ3MpXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBjaGlsZF9wcm9jZXNzID0gcmVxdWlyZSggJ2NoaWxkX3Byb2Nlc3MnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IGdydW50ID0gcmVxdWlyZSggJ2dydW50JyApO1xyXG5cclxuLyoqXHJcbiAqIEV4ZWN1dGVzIGEgY29tbWFuZCwgd2l0aCBzcGVjaWZpYyBhcmd1bWVudHMgYW5kIGluIGEgc3BlY2lmaWMgZGlyZWN0b3J5IChjd2QpLlxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIHN0ZG91dDoge3N0cmluZ31cclxuICogUmVqZWN0cyB3aXRoIHsgY29kZToge251bWJlcn0sIHN0ZG91dDoge3N0cmluZ30gfSAtLSBIYXBwZW5zIGlmIHRoZSBleGl0IGNvZGUgaXMgbm9uLXplcm8uXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBjbWQgLSBUaGUgcHJvY2VzcyB0byBleGVjdXRlLiBTaG91bGQgYmUgb24gdGhlIGN1cnJlbnQgcGF0aC5cclxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gYXJncyAtIEFycmF5IG9mIGFyZ3VtZW50cy4gTm8gbmVlZCB0byBleHRyYS1xdW90ZSB0aGluZ3MuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBjd2QgLSBUaGUgd29ya2luZyBkaXJlY3Rvcnkgd2hlcmUgdGhlIHByb2Nlc3Mgc2hvdWxkIGJlIHJ1biBmcm9tXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59IC0gU3Rkb3V0XHJcbiAqIEByZWplY3RzIHtFeGVjdXRlRXJyb3J9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBjbWQsIGFyZ3MsIGN3ZCwgb3B0aW9ucyApIHtcclxuXHJcbiAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgb3B0aW9ucyA9IF8ubWVyZ2UoIHtcclxuXHJcbiAgICAvLyB7J3JlamVjdCd8J3Jlc29sdmUnfSAtIHdoZXRoZXIgZXJyb3JzIHNob3VsZCBiZSByZWplY3RlZCBvciByZXNvbHZlZC4gIElmIGVycm9ycyBhcmUgcmVzb2x2ZWQsIHRoZW4gYW4gb2JqZWN0XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAtIG9mIHRoZSBmb3JtIHtjb2RlOm51bWJlcixzdGRvdXQ6c3RyaW5nLHN0ZGVycjpzdHJpbmd9IGlzIHJldHVybmVkLiAncmVzb2x2ZScgYWxsb3dzIHVzYWdlXHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAtIGluIFByb21pc2UuYWxsIHdpdGhvdXQgZXhpdGluZyBvbiB0aGUgMXN0IGZhaWx1cmVcclxuICAgIGVycm9yczogJ3JlamVjdCcsXHJcblxyXG4gICAgLy8gUHJvdmlkZSBhZGRpdGlvbmFsIGVudiB2YXJpYWJsZXMsIGFuZCB0aGV5IHdpbGwgYmUgbWVyZ2VkIHdpdGggdGhlIGV4aXN0aW5nIGRlZmF1bHRzLlxyXG4gICAgY2hpbGRQcm9jZXNzRW52OiB7IC4uLnByb2Nlc3MuZW52IH1cclxuICB9LCBvcHRpb25zICk7XHJcbiAgYXNzZXJ0KCBvcHRpb25zLmVycm9ycyA9PT0gJ3JlamVjdCcgfHwgb3B0aW9ucy5lcnJvcnMgPT09ICdyZXNvbHZlJywgJ0Vycm9ycyBtdXN0IHJlamVjdCBvciByZXNvbHZlJyApO1xyXG5cclxuICByZXR1cm4gbmV3IFByb21pc2UoICggcmVzb2x2ZSwgcmVqZWN0ICkgPT4ge1xyXG5cclxuICAgIGxldCByZWplY3RlZEJ5RXJyb3IgPSBmYWxzZTtcclxuXHJcbiAgICBsZXQgc3Rkb3V0ID0gJyc7IC8vIHRvIGJlIGFwcGVuZGVkIHRvXHJcbiAgICBsZXQgc3RkZXJyID0gJyc7XHJcblxyXG4gICAgY29uc3QgY2hpbGRQcm9jZXNzID0gY2hpbGRfcHJvY2Vzcy5zcGF3biggY21kLCBhcmdzLCB7XHJcbiAgICAgIGN3ZDogY3dkLFxyXG4gICAgICBlbnY6IG9wdGlvbnMuY2hpbGRQcm9jZXNzRW52XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY2hpbGRQcm9jZXNzLm9uKCAnZXJyb3InLCBlcnJvciA9PiB7XHJcbiAgICAgIHJlamVjdGVkQnlFcnJvciA9IHRydWU7XHJcblxyXG4gICAgICBpZiAoIG9wdGlvbnMuZXJyb3JzID09PSAncmVzb2x2ZScgKSB7XHJcbiAgICAgICAgcmVzb2x2ZSggeyBjb2RlOiAxLCBzdGRvdXQ6IHN0ZG91dCwgc3RkZXJyOiBzdGRlcnIsIGN3ZDogY3dkLCBlcnJvcjogZXJyb3IsIHRpbWU6IERhdGUubm93KCkgLSBzdGFydFRpbWUgfSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICByZWplY3QoIG5ldyBFeGVjdXRlRXJyb3IoIGNtZCwgYXJncywgY3dkLCBzdGRvdXQsIHN0ZGVyciwgLTEsIERhdGUubm93KCkgLSBzdGFydFRpbWUgKSApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICB3aW5zdG9uLmRlYnVnKCBgUnVubmluZyAke2NtZH0gJHthcmdzLmpvaW4oICcgJyApfSBmcm9tICR7Y3dkfWAgKTtcclxuXHJcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLm9uKCAnZGF0YScsIGRhdGEgPT4ge1xyXG4gICAgICBzdGRlcnIgKz0gZGF0YTtcclxuICAgICAgZ3J1bnQubG9nLmRlYnVnKCBgc3RkZXJyOiAke2RhdGF9YCApO1xyXG4gICAgICB3aW5zdG9uLmRlYnVnKCBgc3RkZXJyOiAke2RhdGF9YCApO1xyXG4gICAgfSApO1xyXG4gICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5vbiggJ2RhdGEnLCBkYXRhID0+IHtcclxuICAgICAgc3Rkb3V0ICs9IGRhdGE7XHJcbiAgICAgIGdydW50LmxvZy5kZWJ1ZyggYHN0ZG91dDogJHtkYXRhfWAgKTtcclxuICAgICAgd2luc3Rvbi5kZWJ1ZyggYHN0ZG91dDogJHtkYXRhfWAgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBjaGlsZFByb2Nlc3Mub24oICdjbG9zZScsIGNvZGUgPT4ge1xyXG4gICAgICB3aW5zdG9uLmRlYnVnKCBgQ29tbWFuZCAke2NtZH0gZmluaXNoZWQuIE91dHB1dCBpcyBiZWxvdy5gICk7XHJcblxyXG4gICAgICB3aW5zdG9uLmRlYnVnKCBzdGRlcnIgJiYgYHN0ZGVycjogJHtzdGRlcnJ9YCB8fCAnc3RkZXJyIGlzIGVtcHR5LicgKTtcclxuICAgICAgd2luc3Rvbi5kZWJ1Zyggc3Rkb3V0ICYmIGBzdGRvdXQ6ICR7c3Rkb3V0fWAgfHwgJ3N0ZG91dCBpcyBlbXB0eS4nICk7XHJcblxyXG4gICAgICBpZiAoICFyZWplY3RlZEJ5RXJyb3IgKSB7XHJcbiAgICAgICAgaWYgKCBvcHRpb25zLmVycm9ycyA9PT0gJ3Jlc29sdmUnICkge1xyXG4gICAgICAgICAgcmVzb2x2ZSggeyBjb2RlOiBjb2RlLCBzdGRvdXQ6IHN0ZG91dCwgc3RkZXJyOiBzdGRlcnIsIGN3ZDogY3dkLCB0aW1lOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lIH0gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBpZiAoIGNvZGUgIT09IDAgKSB7XHJcbiAgICAgICAgICAgIHJlamVjdCggbmV3IEV4ZWN1dGVFcnJvciggY21kLCBhcmdzLCBjd2QsIHN0ZG91dCwgc3RkZXJyLCBjb2RlLCBEYXRlLm5vdygpIC0gc3RhcnRUaW1lICkgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXNvbHZlKCBzdGRvdXQgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9ICk7XHJcbn07XHJcblxyXG5jbGFzcyBFeGVjdXRlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjbWRcclxuICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBhcmdzXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGN3ZFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdGRvdXRcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RkZXJyXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvZGUgLSBleGl0IGNvZGVcclxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZSAtIG1zXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoIGNtZCwgYXJncywgY3dkLCBzdGRvdXQsIHN0ZGVyciwgY29kZSwgdGltZSApIHtcclxuICAgIHN1cGVyKCBgJHtjbWR9ICR7YXJncy5qb2luKCAnICcgKX0gaW4gJHtjd2R9IGZhaWxlZCB3aXRoIGV4aXQgY29kZSAke2NvZGV9JHtzdGRvdXQgPyBgXFxuc3Rkb3V0OlxcbiR7c3Rkb3V0fWAgOiAnJ30ke3N0ZGVyciA/IGBcXG5zdGRlcnI6XFxuJHtzdGRlcnJ9YCA6ICcnfWAgKTtcclxuXHJcbiAgICAvLyBAcHVibGljXHJcbiAgICB0aGlzLmNtZCA9IGNtZDtcclxuICAgIHRoaXMuYXJncyA9IGFyZ3M7XHJcbiAgICB0aGlzLmN3ZCA9IGN3ZDtcclxuICAgIHRoaXMuc3Rkb3V0ID0gc3Rkb3V0O1xyXG4gICAgdGhpcy5zdGRlcnIgPSBzdGRlcnI7XHJcbiAgICB0aGlzLmNvZGUgPSBjb2RlO1xyXG4gICAgdGhpcy50aW1lID0gdGltZTtcclxuICB9XHJcbn0iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUEsYUFBYSxHQUFHQyxPQUFPLENBQUUsZUFBZ0IsQ0FBQztBQUNoRCxJQUFNQyxPQUFPLEdBQUdELE9BQU8sQ0FBRSxTQUFVLENBQUM7QUFDcEMsSUFBTUUsQ0FBQyxHQUFHRixPQUFPLENBQUUsUUFBUyxDQUFDO0FBQzdCLElBQU1HLE1BQU0sR0FBR0gsT0FBTyxDQUFFLFFBQVMsQ0FBQztBQUNsQyxJQUFNSSxLQUFLLEdBQUdKLE9BQU8sQ0FBRSxPQUFRLENBQUM7O0FBRWhDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUssTUFBTSxDQUFDQyxPQUFPLEdBQUcsVUFBVUMsR0FBRyxFQUFFQyxJQUFJLEVBQUVDLEdBQUcsRUFB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