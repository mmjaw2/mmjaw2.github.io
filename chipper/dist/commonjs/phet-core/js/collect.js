"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2013-2023, University of Colorado Boulder

/**
 * Creates an array of results from an iterator that takes a callback.
 *
 * For instance, if calling a function f( g ) will call g( 1 ), g( 2 ), and g( 3 ),
 * collect( function( callback ) { f( callback ); } );
 * will return [1,2,3].
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

function collect(iterate) {
  var result = [];
  iterate(function (ob) {
    result.push(ob);
  });
  return result;
}
_phetCore["default"].register('collect', collect);
var _default = exports["default"] = collect;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJjb2xsZWN0IiwiaXRlcmF0ZSIsInJlc3VsdCIsIm9iIiwicHVzaCIsInBoZXRDb3JlIiwicmVnaXN0ZXIiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyJjb2xsZWN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgcmVzdWx0cyBmcm9tIGFuIGl0ZXJhdG9yIHRoYXQgdGFrZXMgYSBjYWxsYmFjay5cclxuICpcclxuICogRm9yIGluc3RhbmNlLCBpZiBjYWxsaW5nIGEgZnVuY3Rpb24gZiggZyApIHdpbGwgY2FsbCBnKCAxICksIGcoIDIgKSwgYW5kIGcoIDMgKSxcclxuICogY29sbGVjdCggZnVuY3Rpb24oIGNhbGxiYWNrICkgeyBmKCBjYWxsYmFjayApOyB9ICk7XHJcbiAqIHdpbGwgcmV0dXJuIFsxLDIsM10uXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcblxyXG5mdW5jdGlvbiBjb2xsZWN0PFQ+KCBpdGVyYXRlOiAoIGZ1bmM6ICggaXRlbTogVCApID0+IHZvaWQgKSA9PiB2b2lkICk6IFRbXSB7XHJcbiAgY29uc3QgcmVzdWx0OiBUW10gPSBbXTtcclxuICBpdGVyYXRlKCBvYiA9PiB7XHJcbiAgICByZXN1bHQucHVzaCggb2IgKTtcclxuICB9ICk7XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdjb2xsZWN0JywgY29sbGVjdCApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY29sbGVjdDsiXSwibWFwcGluZ3MiOiI7Ozs7OztBQVlBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUFxQyxTQUFBRCx1QkFBQUUsR0FBQSxXQUFBQSxHQUFBLElBQUFBLEdBQUEsQ0FBQUMsVUFBQSxHQUFBRCxHQUFBLGdCQUFBQSxHQUFBO0FBWnJDOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFJQSxTQUFTRSxPQUFPQSxDQUFLQyxPQUE4QyxFQUFRO0VBQ3pFLElBQU1DLE1BQVcsR0FBRyxFQUFFO0VBQ3RCRCxPQUFPLENBQUUsVUFBQUUsRUFBRSxFQUFJO0lBQ2JELE1BQU0sQ0FBQ0UsSUFBSSxDQUFFRCxFQUFHLENBQUM7RUFDbkIsQ0FBRSxDQUFDO0VBQ0gsT0FBT0QsTUFBTTtBQUNmO0FBRUFHLG9CQUFRLENBQUNDLFFBQVEsQ0FBRSxTQUFTLEVBQUVOLE9BQVEsQ0FBQztBQUFDLElBQUFPLFFBQUEsR0FBQUMsT0FBQSxjQUV6QlIsT0FBTyIsImlnbm9yZUxpc3QiOltdfQ==