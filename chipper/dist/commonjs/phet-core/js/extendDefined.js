"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2016-2023, University of Colorado Boulder

/**
 * Like phet-core's extend, but does not overwrite properties with undefined values.
 *
 * For example:
 *
 * extendDefined( { a: 5 }, { a: undefined } ) will return { a: 5 }
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

function extendDefined(obj) {
  for (var _len = arguments.length, sources = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    sources[_key - 1] = arguments[_key];
  }
  _.each(sources, function (source) {
    if (source) {
      for (var prop in source) {
        var descriptor = Object.getOwnPropertyDescriptor(source, prop);
        if (descriptor && (typeof descriptor.get === 'function' || source[prop] !== undefined)) {
          Object.defineProperty(obj, prop, descriptor);
        }
      }
    }
  });
  return obj;
}
_phetCore["default"].register('extendDefined', extendDefined);
var _default = exports["default"] = extendDefined;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJleHRlbmREZWZpbmVkIiwiX2xlbiIsImFyZ3VtZW50cyIsImxlbmd0aCIsInNvdXJjZXMiLCJBcnJheSIsIl9rZXkiLCJfIiwiZWFjaCIsInNvdXJjZSIsInByb3AiLCJkZXNjcmlwdG9yIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiZ2V0IiwidW5kZWZpbmVkIiwiZGVmaW5lUHJvcGVydHkiLCJwaGV0Q29yZSIsInJlZ2lzdGVyIiwiX2RlZmF1bHQiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiZXh0ZW5kRGVmaW5lZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNi0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBMaWtlIHBoZXQtY29yZSdzIGV4dGVuZCwgYnV0IGRvZXMgbm90IG92ZXJ3cml0ZSBwcm9wZXJ0aWVzIHdpdGggdW5kZWZpbmVkIHZhbHVlcy5cclxuICpcclxuICogRm9yIGV4YW1wbGU6XHJcbiAqXHJcbiAqIGV4dGVuZERlZmluZWQoIHsgYTogNSB9LCB7IGE6IHVuZGVmaW5lZCB9ICkgd2lsbCByZXR1cm4geyBhOiA1IH1cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBwaGV0Q29yZSBmcm9tICcuL3BoZXRDb3JlLmpzJztcclxuXHJcbmZ1bmN0aW9uIGV4dGVuZERlZmluZWQ8VD4oIG9iajogVCwgLi4uc291cmNlczogQXJyYXk8VCB8IHVuZGVmaW5lZD4gKTogVCB7XHJcbiAgXy5lYWNoKCBzb3VyY2VzLCBzb3VyY2UgPT4ge1xyXG4gICAgaWYgKCBzb3VyY2UgKSB7XHJcbiAgICAgIGZvciAoIGNvbnN0IHByb3AgaW4gc291cmNlICkge1xyXG4gICAgICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKCBzb3VyY2UsIHByb3AgKTtcclxuXHJcbiAgICAgICAgaWYgKCBkZXNjcmlwdG9yICYmICggdHlwZW9mIGRlc2NyaXB0b3IuZ2V0ID09PSAnZnVuY3Rpb24nIHx8IHNvdXJjZVsgcHJvcCBdICE9PSB1bmRlZmluZWQgKSApIHtcclxuICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggb2JqLCBwcm9wLCBkZXNjcmlwdG9yICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSApO1xyXG4gIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbnBoZXRDb3JlLnJlZ2lzdGVyKCAnZXh0ZW5kRGVmaW5lZCcsIGV4dGVuZERlZmluZWQgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGV4dGVuZERlZmluZWQ7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFZQSxJQUFBQSxTQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFBcUMsU0FBQUQsdUJBQUFFLEdBQUEsV0FBQUEsR0FBQSxJQUFBQSxHQUFBLENBQUFDLFVBQUEsR0FBQUQsR0FBQSxnQkFBQUEsR0FBQTtBQVpyQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBSUEsU0FBU0UsYUFBYUEsQ0FBS0YsR0FBTSxFQUF3QztFQUFBLFNBQUFHLElBQUEsR0FBQUMsU0FBQSxDQUFBQyxNQUFBLEVBQW5DQyxPQUFPLE9BQUFDLEtBQUEsQ0FBQUosSUFBQSxPQUFBQSxJQUFBLFdBQUFLLElBQUEsTUFBQUEsSUFBQSxHQUFBTCxJQUFBLEVBQUFLLElBQUE7SUFBUEYsT0FBTyxDQUFBRSxJQUFBLFFBQUFKLFNBQUEsQ0FBQUksSUFBQTtFQUFBO0VBQzNDQyxDQUFDLENBQUNDLElBQUksQ0FBRUosT0FBTyxFQUFFLFVBQUFLLE1BQU0sRUFBSTtJQUN6QixJQUFLQSxNQUFNLEVBQUc7TUFDWixLQUFNLElBQU1DLElBQUksSUFBSUQsTUFBTSxFQUFHO1FBQzNCLElBQU1FLFVBQVUsR0FBR0MsTUFBTSxDQUFDQyx3QkFBd0IsQ0FBRUosTUFBTSxFQUFFQyxJQUFLLENBQUM7UUFFbEUsSUFBS0MsVUFBVSxLQUFNLE9BQU9BLFVBQVUsQ0FBQ0csR0FBRyxLQUFLLFVBQVUsSUFBSUwsTUFBTSxDQUFFQyxJQUFJLENBQUUsS0FBS0ssU0FBUyxDQUFFLEVBQUc7VUFDNUZILE1BQU0sQ0FBQ0ksY0FBYyxDQUFFbEIsR0FBRyxFQUFFWSxJQUFJLEVBQUVDLFVBQVcsQ0FBQztRQUNoRDtNQUNGO0lBQ0Y7RUFDRixDQUFFLENBQUM7RUFDSCxPQUFPYixHQUFHO0FBQ1o7QUFFQW1CLG9CQUFRLENBQUNDLFFBQVEsQ0FBRSxlQUFlLEVBQUVsQixhQUFjLENBQUM7QUFBQyxJQUFBbUIsUUFBQSxHQUFBQyxPQUFBLGNBRXJDcEIsYUFBYSIsImlnbm9yZUxpc3QiOltdfQ==