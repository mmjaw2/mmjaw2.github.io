"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _isHMR = _interopRequireDefault(require("./isHMR.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Copyright 2015-2024, University of Colorado Boulder
/**
 * For debugging or usage in the console, Namespace associates modules with a namespaced global for use in the browser.
 * This does not work in Node.js.
 *
 * @author Jonathan Olson
 * @author Chris Malley (PixelZoom, Inc.)
 */
var Namespace = /*#__PURE__*/function () {
  function Namespace(name) {
    _classCallCheck(this, Namespace);
    _defineProperty(this, "name", void 0);
    this.name = name;

    // Unsupported in Node.js
    if (typeof window === 'undefined') {
      return;
    }
    if (window.phet) {
      // We already create the chipper namespace, so we just attach to it with the register function.
      if (name === 'chipper') {
        window.phet.chipper.name = 'chipper';
        window.phet.chipper.register = this.register.bind(window.phet.chipper);
        return window.phet.chipper; // eslint-disable-line -- we want to provide the namespace API on something already existing
      } else {
        /* TODO: Ideally we should always assert this, but in PhET-iO wrapper code, multiple built modules define the
           TODO: same namespace, this should be fixed in https://github.com/phetsims/phet-io-wrappers/issues/631 */
        var ignoreAssertion = !_.hasIn(window, 'phet.chipper.brand');
        assert && !ignoreAssertion && assert(!window.phet[name], "namespace ".concat(name, " already exists"));
        window.phet[name] = this;
      }
    }
  }

  /**
   * Registers a key-value pair with the namespace.
   *
   * If there are no dots ('.') in the key, it will be assigned to the namespace. For example:
   * - x.register( 'A', A );
   * will set x.A = A.
   *
   * If the key contains one or more dots ('.'), it's treated somewhat like a path expression. For instance, if the
   * following is called:
   * - x.register( 'A.B.C', C );
   * then the register function will navigate to the object x.A.B and add x.A.B.C = C.
   */
  return _createClass(Namespace, [{
    key: "register",
    value: function register(key, value) {
      // Unsupported in Node.js
      if (typeof window === 'undefined') {
        return value;
      }

      // When using hot module replacement, a module will be loaded and initialized twice, and hence its namespace.register
      // function will be called twice.  This should not be an assertion error.

      // If the key isn't compound (doesn't contain '.'), we can just look it up on this namespace
      if (key.includes('.')) {
        if (!_isHMR["default"]) {
          // @ts-expect-error
          assert && assert(!this[key], "".concat(key, " is already registered for namespace ").concat(this.name));
        }

        // @ts-expect-error
        this[key] = value;
      }
      // Compound (contains '.' at least once). x.register( 'A.B.C', C ) should set x.A.B.C.
      else {
        var keys = key.split('.'); // e.g. [ 'A', 'B', 'C' ]

        // Walk into the namespace, verifying that each level exists. e.g. parent => x.A.B
        var parent = this; // eslint-disable-line consistent-this, @typescript-eslint/no-this-alias
        for (var i = 0; i < keys.length - 1; i++) {
          // for all but the last key

          if (!_isHMR["default"]) {
            // @ts-expect-error
            assert && assert(!!parent[keys[i]], "".concat([this.name].concat(keys.slice(0, i + 1)).join('.'), " needs to be defined to register ").concat(key));
          }

          // @ts-expect-error
          parent = parent[keys[i]];
        }

        // Write into the inner namespace, e.g. x.A.B[ 'C' ] = C
        var lastKey = keys[keys.length - 1];
        if (!_isHMR["default"]) {
          // @ts-expect-error
          assert && assert(!parent[lastKey], "".concat(key, " is already registered for namespace ").concat(this.name));
        }

        // @ts-expect-error
        parent[lastKey] = value;
      }
      return value;
    }
  }]);
}();
var _default = exports["default"] = Namespace;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfaXNITVIiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJfdHlwZW9mIiwibyIsIlN5bWJvbCIsIml0ZXJhdG9yIiwiY29uc3RydWN0b3IiLCJwcm90b3R5cGUiLCJfY2xhc3NDYWxsQ2hlY2siLCJpbnN0YW5jZSIsIkNvbnN0cnVjdG9yIiwiVHlwZUVycm9yIiwiX2RlZmluZVByb3BlcnRpZXMiLCJ0YXJnZXQiLCJwcm9wcyIsImkiLCJsZW5ndGgiLCJkZXNjcmlwdG9yIiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsIndyaXRhYmxlIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJfdG9Qcm9wZXJ0eUtleSIsImtleSIsIl9jcmVhdGVDbGFzcyIsInByb3RvUHJvcHMiLCJzdGF0aWNQcm9wcyIsIl9kZWZpbmVQcm9wZXJ0eSIsInZhbHVlIiwidCIsIl90b1ByaW1pdGl2ZSIsInIiLCJlIiwidG9QcmltaXRpdmUiLCJjYWxsIiwiU3RyaW5nIiwiTnVtYmVyIiwiTmFtZXNwYWNlIiwibmFtZSIsIndpbmRvdyIsInBoZXQiLCJjaGlwcGVyIiwicmVnaXN0ZXIiLCJiaW5kIiwiaWdub3JlQXNzZXJ0aW9uIiwiXyIsImhhc0luIiwiYXNzZXJ0IiwiY29uY2F0IiwiaW5jbHVkZXMiLCJpc0hNUiIsImtleXMiLCJzcGxpdCIsInBhcmVudCIsInNsaWNlIiwiam9pbiIsImxhc3RLZXkiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyJOYW1lc3BhY2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTUtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogRm9yIGRlYnVnZ2luZyBvciB1c2FnZSBpbiB0aGUgY29uc29sZSwgTmFtZXNwYWNlIGFzc29jaWF0ZXMgbW9kdWxlcyB3aXRoIGEgbmFtZXNwYWNlZCBnbG9iYWwgZm9yIHVzZSBpbiB0aGUgYnJvd3Nlci5cclxuICogVGhpcyBkb2VzIG5vdCB3b3JrIGluIE5vZGUuanMuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb25cclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgaXNITVIgZnJvbSAnLi9pc0hNUi5qcyc7XHJcblxyXG5jbGFzcyBOYW1lc3BhY2Uge1xyXG4gIHB1YmxpYyByZWFkb25seSBuYW1lOiBzdHJpbmc7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggbmFtZTogc3RyaW5nICkge1xyXG5cclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcblxyXG4gICAgLy8gVW5zdXBwb3J0ZWQgaW4gTm9kZS5qc1xyXG4gICAgaWYgKCB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggd2luZG93LnBoZXQgKSB7XHJcbiAgICAgIC8vIFdlIGFscmVhZHkgY3JlYXRlIHRoZSBjaGlwcGVyIG5hbWVzcGFjZSwgc28gd2UganVzdCBhdHRhY2ggdG8gaXQgd2l0aCB0aGUgcmVnaXN0ZXIgZnVuY3Rpb24uXHJcbiAgICAgIGlmICggbmFtZSA9PT0gJ2NoaXBwZXInICkge1xyXG4gICAgICAgIHdpbmRvdy5waGV0LmNoaXBwZXIubmFtZSA9ICdjaGlwcGVyJztcclxuICAgICAgICB3aW5kb3cucGhldC5jaGlwcGVyLnJlZ2lzdGVyID0gdGhpcy5yZWdpc3Rlci5iaW5kKCB3aW5kb3cucGhldC5jaGlwcGVyICk7XHJcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5waGV0LmNoaXBwZXI7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgLS0gd2Ugd2FudCB0byBwcm92aWRlIHRoZSBuYW1lc3BhY2UgQVBJIG9uIHNvbWV0aGluZyBhbHJlYWR5IGV4aXN0aW5nXHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLyogVE9ETzogSWRlYWxseSB3ZSBzaG91bGQgYWx3YXlzIGFzc2VydCB0aGlzLCBidXQgaW4gUGhFVC1pTyB3cmFwcGVyIGNvZGUsIG11bHRpcGxlIGJ1aWx0IG1vZHVsZXMgZGVmaW5lIHRoZVxyXG4gICAgICAgICAgIFRPRE86IHNhbWUgbmFtZXNwYWNlLCB0aGlzIHNob3VsZCBiZSBmaXhlZCBpbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby13cmFwcGVycy9pc3N1ZXMvNjMxICovXHJcbiAgICAgICAgY29uc3QgaWdub3JlQXNzZXJ0aW9uID0gIV8uaGFzSW4oIHdpbmRvdywgJ3BoZXQuY2hpcHBlci5icmFuZCcgKTtcclxuICAgICAgICBhc3NlcnQgJiYgIWlnbm9yZUFzc2VydGlvbiAmJiBhc3NlcnQoICF3aW5kb3cucGhldFsgbmFtZSBdLCBgbmFtZXNwYWNlICR7bmFtZX0gYWxyZWFkeSBleGlzdHNgICk7XHJcbiAgICAgICAgd2luZG93LnBoZXRbIG5hbWUgXSA9IHRoaXM7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZ2lzdGVycyBhIGtleS12YWx1ZSBwYWlyIHdpdGggdGhlIG5hbWVzcGFjZS5cclxuICAgKlxyXG4gICAqIElmIHRoZXJlIGFyZSBubyBkb3RzICgnLicpIGluIHRoZSBrZXksIGl0IHdpbGwgYmUgYXNzaWduZWQgdG8gdGhlIG5hbWVzcGFjZS4gRm9yIGV4YW1wbGU6XHJcbiAgICogLSB4LnJlZ2lzdGVyKCAnQScsIEEgKTtcclxuICAgKiB3aWxsIHNldCB4LkEgPSBBLlxyXG4gICAqXHJcbiAgICogSWYgdGhlIGtleSBjb250YWlucyBvbmUgb3IgbW9yZSBkb3RzICgnLicpLCBpdCdzIHRyZWF0ZWQgc29tZXdoYXQgbGlrZSBhIHBhdGggZXhwcmVzc2lvbi4gRm9yIGluc3RhbmNlLCBpZiB0aGVcclxuICAgKiBmb2xsb3dpbmcgaXMgY2FsbGVkOlxyXG4gICAqIC0geC5yZWdpc3RlciggJ0EuQi5DJywgQyApO1xyXG4gICAqIHRoZW4gdGhlIHJlZ2lzdGVyIGZ1bmN0aW9uIHdpbGwgbmF2aWdhdGUgdG8gdGhlIG9iamVjdCB4LkEuQiBhbmQgYWRkIHguQS5CLkMgPSBDLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZWdpc3RlcjxUPigga2V5OiBzdHJpbmcsIHZhbHVlOiBUICk6IFQge1xyXG5cclxuICAgIC8vIFVuc3VwcG9ydGVkIGluIE5vZGUuanNcclxuICAgIGlmICggdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgKSB7XHJcbiAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBXaGVuIHVzaW5nIGhvdCBtb2R1bGUgcmVwbGFjZW1lbnQsIGEgbW9kdWxlIHdpbGwgYmUgbG9hZGVkIGFuZCBpbml0aWFsaXplZCB0d2ljZSwgYW5kIGhlbmNlIGl0cyBuYW1lc3BhY2UucmVnaXN0ZXJcclxuICAgIC8vIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHR3aWNlLiAgVGhpcyBzaG91bGQgbm90IGJlIGFuIGFzc2VydGlvbiBlcnJvci5cclxuXHJcbiAgICAvLyBJZiB0aGUga2V5IGlzbid0IGNvbXBvdW5kIChkb2Vzbid0IGNvbnRhaW4gJy4nKSwgd2UgY2FuIGp1c3QgbG9vayBpdCB1cCBvbiB0aGlzIG5hbWVzcGFjZVxyXG4gICAgaWYgKCBrZXkuaW5jbHVkZXMoICcuJyApICkge1xyXG4gICAgICBpZiAoICFpc0hNUiApIHtcclxuXHJcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzWyBrZXkgXSwgYCR7a2V5fSBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQgZm9yIG5hbWVzcGFjZSAke3RoaXMubmFtZX1gICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgdGhpc1sga2V5IF0gPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIC8vIENvbXBvdW5kIChjb250YWlucyAnLicgYXQgbGVhc3Qgb25jZSkuIHgucmVnaXN0ZXIoICdBLkIuQycsIEMgKSBzaG91bGQgc2V0IHguQS5CLkMuXHJcbiAgICBlbHNlIHtcclxuICAgICAgY29uc3Qga2V5cyA9IGtleS5zcGxpdCggJy4nICk7IC8vIGUuZy4gWyAnQScsICdCJywgJ0MnIF1cclxuXHJcbiAgICAgIC8vIFdhbGsgaW50byB0aGUgbmFtZXNwYWNlLCB2ZXJpZnlpbmcgdGhhdCBlYWNoIGxldmVsIGV4aXN0cy4gZS5nLiBwYXJlbnQgPT4geC5BLkJcclxuICAgICAgbGV0IHBhcmVudCA9IHRoaXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29uc2lzdGVudC10aGlzLCBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdGhpcy1hbGlhc1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aCAtIDE7IGkrKyApIHsgLy8gZm9yIGFsbCBidXQgdGhlIGxhc3Qga2V5XHJcblxyXG4gICAgICAgIGlmICggIWlzSE1SICkge1xyXG4gICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggISFwYXJlbnRbIGtleXNbIGkgXSBdLFxyXG4gICAgICAgICAgICBgJHtbIHRoaXMubmFtZSBdLmNvbmNhdCgga2V5cy5zbGljZSggMCwgaSArIDEgKSApLmpvaW4oICcuJyApfSBuZWVkcyB0byBiZSBkZWZpbmVkIHRvIHJlZ2lzdGVyICR7a2V5fWAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgICBwYXJlbnQgPSBwYXJlbnRbIGtleXNbIGkgXSBdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBXcml0ZSBpbnRvIHRoZSBpbm5lciBuYW1lc3BhY2UsIGUuZy4geC5BLkJbICdDJyBdID0gQ1xyXG4gICAgICBjb25zdCBsYXN0S2V5ID0ga2V5c1sga2V5cy5sZW5ndGggLSAxIF07XHJcblxyXG4gICAgICBpZiAoICFpc0hNUiApIHtcclxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIXBhcmVudFsgbGFzdEtleSBdLCBgJHtrZXl9IGlzIGFscmVhZHkgcmVnaXN0ZXJlZCBmb3IgbmFtZXNwYWNlICR7dGhpcy5uYW1lfWAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICBwYXJlbnRbIGxhc3RLZXkgXSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB2YWx1ZTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IE5hbWVzcGFjZTsiXSwibWFwcGluZ3MiOiI7Ozs7OztBQVVBLElBQUFBLE1BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUErQixTQUFBRCx1QkFBQUUsR0FBQSxXQUFBQSxHQUFBLElBQUFBLEdBQUEsQ0FBQUMsVUFBQSxHQUFBRCxHQUFBLGdCQUFBQSxHQUFBO0FBQUEsU0FBQUUsUUFBQUMsQ0FBQSxzQ0FBQUQsT0FBQSx3QkFBQUUsTUFBQSx1QkFBQUEsTUFBQSxDQUFBQyxRQUFBLGFBQUFGLENBQUEsa0JBQUFBLENBQUEsZ0JBQUFBLENBQUEsV0FBQUEsQ0FBQSx5QkFBQUMsTUFBQSxJQUFBRCxDQUFBLENBQUFHLFdBQUEsS0FBQUYsTUFBQSxJQUFBRCxDQUFBLEtBQUFDLE1BQUEsQ0FBQUcsU0FBQSxxQkFBQUosQ0FBQSxLQUFBRCxPQUFBLENBQUFDLENBQUE7QUFBQSxTQUFBSyxnQkFBQUMsUUFBQSxFQUFBQyxXQUFBLFVBQUFELFFBQUEsWUFBQUMsV0FBQSxlQUFBQyxTQUFBO0FBQUEsU0FBQUMsa0JBQUFDLE1BQUEsRUFBQUMsS0FBQSxhQUFBQyxDQUFBLE1BQUFBLENBQUEsR0FBQUQsS0FBQSxDQUFBRSxNQUFBLEVBQUFELENBQUEsVUFBQUUsVUFBQSxHQUFBSCxLQUFBLENBQUFDLENBQUEsR0FBQUUsVUFBQSxDQUFBQyxVQUFBLEdBQUFE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