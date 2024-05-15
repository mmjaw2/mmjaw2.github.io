"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2014-2023, University of Colorado Boulder

/**
 * Creates an array of arrays, which consists of pairs of objects from the input array without duplication.
 *
 * For example, phet.phetCore.pairs( [ 'a', 'b', 'c' ] ) will return:
 * [ [ 'a', 'b' ], [ 'a', 'c' ], [ 'b', 'c' ] ]
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

function pairs(array) {
  var result = [];
  var length = array.length;
  if (length > 1) {
    for (var i = 0; i < length - 1; i++) {
      var first = array[i];
      for (var j = i + 1; j < length; j++) {
        result.push([first, array[j]]);
      }
    }
  }
  return result;
}
_phetCore["default"].register('pairs', pairs);
var _default = exports["default"] = pairs;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJwYWlycyIsImFycmF5IiwicmVzdWx0IiwibGVuZ3RoIiwiaSIsImZpcnN0IiwiaiIsInB1c2giLCJwaGV0Q29yZSIsInJlZ2lzdGVyIiwiX2RlZmF1bHQiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsicGFpcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiBhcnJheXMsIHdoaWNoIGNvbnNpc3RzIG9mIHBhaXJzIG9mIG9iamVjdHMgZnJvbSB0aGUgaW5wdXQgYXJyYXkgd2l0aG91dCBkdXBsaWNhdGlvbi5cclxuICpcclxuICogRm9yIGV4YW1wbGUsIHBoZXQucGhldENvcmUucGFpcnMoIFsgJ2EnLCAnYicsICdjJyBdICkgd2lsbCByZXR1cm46XHJcbiAqIFsgWyAnYScsICdiJyBdLCBbICdhJywgJ2MnIF0sIFsgJ2InLCAnYycgXSBdXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuXHJcbnR5cGUgQXJyYXlPZlBhaXJzID0gQXJyYXk8cmVhZG9ubHkgWyBJbnRlbnRpb25hbEFueSwgSW50ZW50aW9uYWxBbnkgXT47XHJcblxyXG5mdW5jdGlvbiBwYWlycyggYXJyYXk6IEludGVudGlvbmFsQW55W10gKTogQXJyYXlPZlBhaXJzIHtcclxuICBjb25zdCByZXN1bHQ6IEFycmF5T2ZQYWlycyA9IFtdO1xyXG4gIGNvbnN0IGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcclxuICBpZiAoIGxlbmd0aCA+IDEgKSB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsZW5ndGggLSAxOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGZpcnN0ID0gYXJyYXlbIGkgXTtcclxuICAgICAgZm9yICggbGV0IGogPSBpICsgMTsgaiA8IGxlbmd0aDsgaisrICkge1xyXG4gICAgICAgIHJlc3VsdC5wdXNoKCBbIGZpcnN0LCBhcnJheVsgaiBdIF0gYXMgY29uc3QgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5waGV0Q29yZS5yZWdpc3RlciggJ3BhaXJzJywgcGFpcnMgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHBhaXJzOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBV0EsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQXFDLFNBQUFELHVCQUFBRSxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsZ0JBQUFBLEdBQUE7QUFYckM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFPQSxTQUFTRSxLQUFLQSxDQUFFQyxLQUF1QixFQUFpQjtFQUN0RCxJQUFNQyxNQUFvQixHQUFHLEVBQUU7RUFDL0IsSUFBTUMsTUFBTSxHQUFHRixLQUFLLENBQUNFLE1BQU07RUFDM0IsSUFBS0EsTUFBTSxHQUFHLENBQUMsRUFBRztJQUNoQixLQUFNLElBQUlDLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR0QsTUFBTSxHQUFHLENBQUMsRUFBRUMsQ0FBQyxFQUFFLEVBQUc7TUFDckMsSUFBTUMsS0FBSyxHQUFHSixLQUFLLENBQUVHLENBQUMsQ0FBRTtNQUN4QixLQUFNLElBQUlFLENBQUMsR0FBR0YsQ0FBQyxHQUFHLENBQUMsRUFBRUUsQ0FBQyxHQUFHSCxNQUFNLEVBQUVHLENBQUMsRUFBRSxFQUFHO1FBQ3JDSixNQUFNLENBQUNLLElBQUksQ0FBRSxDQUFFRixLQUFLLEVBQUVKLEtBQUssQ0FBRUssQ0FBQyxDQUFFLENBQVksQ0FBQztNQUMvQztJQUNGO0VBQ0Y7RUFDQSxPQUFPSixNQUFNO0FBQ2Y7QUFFQU0sb0JBQVEsQ0FBQ0MsUUFBUSxDQUFFLE9BQU8sRUFBRVQsS0FBTSxDQUFDO0FBQUMsSUFBQVUsUUFBQSxHQUFBQyxPQUFBLGNBRXJCWCxLQUFLIiwiaWdub3JlTGlzdCI6W119