"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _Tandem = _interopRequireDefault(require("../../../tandem/js/Tandem.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n["default"] = e, t && t.set(e, n), n; } // Copyright 2020-2024, University of Colorado Boulder
/**
 * Start Qunit while supporting PhET-iO brand
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
var qunitStart = function qunitStart() {
  var start = function start() {
    // Uncomment for a debugger whenever a test fails
    if (_.hasIn(window, 'phet.chipper.queryParameters') && phet.chipper.queryParameters["debugger"]) {
      QUnit.log(function (context) {
        if (!context.result) {
          debugger;
        }
      }); // eslint-disable-line no-debugger
    }
    if (_Tandem["default"].PHET_IO_ENABLED) {
      Promise.resolve().then(function () {
        return _interopRequireWildcard(require( /* webpackMode: "eager" */'../../../phet-io/js/phetioEngine.js'));
      }).then(function () {
        // no API validation in unit tests
        phet.tandem.phetioAPIValidation.enabled = false;
        phet.phetio.phetioEngine.flushPhetioObjectBuffer();
        QUnit.start();
      });
    } else {
      QUnit.start();
    }
  };

  // When running in the puppeteer harness, we need the opportunity to wire up listeners before QUnit begins.
  if (QueryStringMachine.containsKey('qunitHooks')) {
    window.qunitLaunchAfterHooks = start;
  } else {
    start();
  }
};
var _default = exports["default"] = qunitStart;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfVGFuZGVtIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJvYmoiLCJfX2VzTW9kdWxlIiwiX3R5cGVvZiIsIm8iLCJTeW1ib2wiLCJpdGVyYXRvciIsImNvbnN0cnVjdG9yIiwicHJvdG90eXBlIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwiZSIsIldlYWtNYXAiLCJyIiwidCIsIl9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkIiwiaGFzIiwiZ2V0IiwibiIsIl9fcHJvdG9fXyIsImEiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldE93blByb3BlcnR5RGVzY3JpcHRvciIsInUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJpIiwic2V0IiwicXVuaXRTdGFydCIsInN0YXJ0IiwiXyIsImhhc0luIiwid2luZG93IiwicGhldCIsImNoaXBwZXIiLCJxdWVyeVBhcmFtZXRlcnMiLCJRVW5pdCIsImxvZyIsImNvbnRleHQiLCJyZXN1bHQiLCJUYW5kZW0iLCJQSEVUX0lPX0VOQUJMRUQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInRoZW4iLCJ0YW5kZW0iLCJwaGV0aW9BUElWYWxpZGF0aW9uIiwiZW5hYmxlZCIsInBoZXRpbyIsInBoZXRpb0VuZ2luZSIsImZsdXNoUGhldGlvT2JqZWN0QnVmZmVyIiwiUXVlcnlTdHJpbmdNYWNoaW5lIiwiY29udGFpbnNLZXkiLCJxdW5pdExhdW5jaEFmdGVySG9va3MiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyJxdW5pdFN0YXJ0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFN0YXJ0IFF1bml0IHdoaWxlIHN1cHBvcnRpbmcgUGhFVC1pTyBicmFuZFxyXG4gKlxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuXHJcbmNvbnN0IHF1bml0U3RhcnQgPSAoKSA9PiB7XHJcblxyXG4gIGNvbnN0IHN0YXJ0ID0gKCkgPT4ge1xyXG5cclxuICAgIC8vIFVuY29tbWVudCBmb3IgYSBkZWJ1Z2dlciB3aGVuZXZlciBhIHRlc3QgZmFpbHNcclxuICAgIGlmICggXy5oYXNJbiggd2luZG93LCAncGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycycgKSAmJiBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmRlYnVnZ2VyICkge1xyXG4gICAgICBRVW5pdC5sb2coIGNvbnRleHQgPT4geyBpZiAoICFjb250ZXh0LnJlc3VsdCApIHsgZGVidWdnZXI7IH19ICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZGVidWdnZXJcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIFRhbmRlbS5QSEVUX0lPX0VOQUJMRUQgKSB7XHJcbiAgICAgIGltcG9ydCggLyogd2VicGFja01vZGU6IFwiZWFnZXJcIiAqLyAnLi4vLi4vLi4vcGhldC1pby9qcy9waGV0aW9FbmdpbmUuanMnICkudGhlbiggKCkgPT4ge1xyXG5cclxuICAgICAgICAvLyBubyBBUEkgdmFsaWRhdGlvbiBpbiB1bml0IHRlc3RzXHJcbiAgICAgICAgcGhldC50YW5kZW0ucGhldGlvQVBJVmFsaWRhdGlvbi5lbmFibGVkID0gZmFsc2U7XHJcbiAgICAgICAgcGhldC5waGV0aW8ucGhldGlvRW5naW5lLmZsdXNoUGhldGlvT2JqZWN0QnVmZmVyKCk7XHJcbiAgICAgICAgUVVuaXQuc3RhcnQoKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIFFVbml0LnN0YXJ0KCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gV2hlbiBydW5uaW5nIGluIHRoZSBwdXBwZXRlZXIgaGFybmVzcywgd2UgbmVlZCB0aGUgb3Bwb3J0dW5pdHkgdG8gd2lyZSB1cCBsaXN0ZW5lcnMgYmVmb3JlIFFVbml0IGJlZ2lucy5cclxuICBpZiAoIFF1ZXJ5U3RyaW5nTWFjaGluZS5jb250YWluc0tleSggJ3F1bml0SG9va3MnICkgKSB7XHJcbiAgICB3aW5kb3cucXVuaXRMYXVuY2hBZnRlckhvb2tzID0gc3RhcnQ7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgc3RhcnQoKTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBxdW5pdFN0YXJ0OyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBUUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQWtELFNBQUFELHVCQUFBRSxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsZ0JBQUFBLEdBQUE7QUFBQSxTQUFBRSxRQUFBQyxDQUFBLHNDQUFBRCxPQUFBLHdCQUFBRSxNQUFBLHVCQUFBQSxNQUFBLENBQUFDLFFBQUEsYUFBQUYsQ0FBQSxrQkFBQUEsQ0FBQSxnQkFBQUEsQ0FBQSxXQUFBQSxDQUFBLHlCQUFBQyxNQUFBLElBQUFELENBQUEsQ0FBQUcsV0FBQSxLQUFBRixNQUFBLElBQUFELENBQUEsS0FBQUMsTUFBQSxDQUFBRyxTQUFBLHFCQUFBSixDQUFBLEtBQUFELE9BQUEsQ0FBQUMsQ0FBQTtBQUFBLFNBQUFLLHlCQUFBQyxDQUFBLDZCQUFBQyxPQUFBLG1CQUFBQyxDQUFBLE9BQUFELE9BQUEsSUFBQUUsQ0FBQSxPQUFBRixPQUFBLFlBQUFGLHdCQUFBLFlBQUFBLHlCQUFBQyxDQUFBLFdBQUFBLENBQUEsR0FBQUcsQ0FBQSxHQUFBRCxDQUFBLEtBQUFGLENBQUE7QUFBQSxTQUFBSSx3QkFBQUosQ0FBQSxFQUFBRSxDQUFBLFNBQUFBLENBQUEsSUFBQUYsQ0FBQSxJQUFBQSxDQUFBLENBQUFSLFVBQUEsU0FBQVEsQ0FBQSxlQUFBQSxDQUFBLGdCQUFBUCxPQUFBLENBQUFPLENBQUEsMEJBQUFB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