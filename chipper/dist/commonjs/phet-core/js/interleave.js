"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2018-2023, University of Colorado Boulder

/**
 * Returns a copy of an array, with generated elements interleaved (inserted in-between) every element. For example, if
 * you call `interleave( [ a, b, c ], Math.random )`, it will result in the equivalent:
 * `[ a, Math.random(), b, Math.random(), c ]`.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

/**
 * @param arr - The array in which to interleave elements
 * @param generator - function( index: {number} ):{*} - 0-based index for which "separator" it is for. e.g.
 *                               [ _, generator(0), _, generator(1), _, generator(2), ..., _ ]
 * @returns - The interleaved array
 */
function interleave(arr, generator) {
  assert && assert(Array.isArray(arr));
  var result = [];
  var finalLength = arr.length * 2 - 1;
  for (var i = 0; i < finalLength; i++) {
    if (i % 2 === 0) {
      result.push(arr[i / 2]);
    } else {
      result.push(generator((i - 1) / 2));
    }
  }
  return result;
}
_phetCore["default"].register('interleave', interleave);
var _default = exports["default"] = interleave;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJpbnRlcmxlYXZlIiwiYXJyIiwiZ2VuZXJhdG9yIiwiYXNzZXJ0IiwiQXJyYXkiLCJpc0FycmF5IiwicmVzdWx0IiwiZmluYWxMZW5ndGgiLCJsZW5ndGgiLCJpIiwicHVzaCIsInBoZXRDb3JlIiwicmVnaXN0ZXIiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyJpbnRlcmxlYXZlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYSBjb3B5IG9mIGFuIGFycmF5LCB3aXRoIGdlbmVyYXRlZCBlbGVtZW50cyBpbnRlcmxlYXZlZCAoaW5zZXJ0ZWQgaW4tYmV0d2VlbikgZXZlcnkgZWxlbWVudC4gRm9yIGV4YW1wbGUsIGlmXHJcbiAqIHlvdSBjYWxsIGBpbnRlcmxlYXZlKCBbIGEsIGIsIGMgXSwgTWF0aC5yYW5kb20gKWAsIGl0IHdpbGwgcmVzdWx0IGluIHRoZSBlcXVpdmFsZW50OlxyXG4gKiBgWyBhLCBNYXRoLnJhbmRvbSgpLCBiLCBNYXRoLnJhbmRvbSgpLCBjIF1gLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IHBoZXRDb3JlIGZyb20gJy4vcGhldENvcmUuanMnO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBhcnIgLSBUaGUgYXJyYXkgaW4gd2hpY2ggdG8gaW50ZXJsZWF2ZSBlbGVtZW50c1xyXG4gKiBAcGFyYW0gZ2VuZXJhdG9yIC0gZnVuY3Rpb24oIGluZGV4OiB7bnVtYmVyfSApOnsqfSAtIDAtYmFzZWQgaW5kZXggZm9yIHdoaWNoIFwic2VwYXJhdG9yXCIgaXQgaXMgZm9yLiBlLmcuXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFsgXywgZ2VuZXJhdG9yKDApLCBfLCBnZW5lcmF0b3IoMSksIF8sIGdlbmVyYXRvcigyKSwgLi4uLCBfIF1cclxuICogQHJldHVybnMgLSBUaGUgaW50ZXJsZWF2ZWQgYXJyYXlcclxuICovXHJcbmZ1bmN0aW9uIGludGVybGVhdmU8VD4oIGFycjogcmVhZG9ubHkgVFtdLCBnZW5lcmF0b3I6ICggZWxlbWVudDogbnVtYmVyICkgPT4gVCApOiBUW10ge1xyXG4gIGFzc2VydCAmJiBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIGFyciApICk7XHJcblxyXG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG4gIGNvbnN0IGZpbmFsTGVuZ3RoID0gYXJyLmxlbmd0aCAqIDIgLSAxO1xyXG5cclxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBmaW5hbExlbmd0aDsgaSsrICkge1xyXG4gICAgaWYgKCBpICUgMiA9PT0gMCApIHtcclxuICAgICAgcmVzdWx0LnB1c2goIGFyclsgaSAvIDIgXSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJlc3VsdC5wdXNoKCBnZW5lcmF0b3IoICggaSAtIDEgKSAvIDIgKSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdpbnRlcmxlYXZlJywgaW50ZXJsZWF2ZSApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgaW50ZXJsZWF2ZTsiXSwibWFwcGluZ3MiOiI7Ozs7OztBQVVBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUFxQyxTQUFBRCx1QkFBQUUsR0FBQSxXQUFBQSxHQUFBLElBQUFBLEdBQUEsQ0FBQUMsVUFBQSxHQUFBRCxHQUFBLGdCQUFBQSxHQUFBO0FBVnJDOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVNFLFVBQVVBLENBQUtDLEdBQWlCLEVBQUVDLFNBQW1DLEVBQVE7RUFDcEZDLE1BQU0sSUFBSUEsTUFBTSxDQUFFQyxLQUFLLENBQUNDLE9BQU8sQ0FBRUosR0FBSSxDQUFFLENBQUM7RUFFeEMsSUFBTUssTUFBTSxHQUFHLEVBQUU7RUFDakIsSUFBTUMsV0FBVyxHQUFHTixHQUFHLENBQUNPLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQztFQUV0QyxLQUFNLElBQUlDLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR0YsV0FBVyxFQUFFRSxDQUFDLEVBQUUsRUFBRztJQUN0QyxJQUFLQSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRztNQUNqQkgsTUFBTSxDQUFDSSxJQUFJLENBQUVULEdBQUcsQ0FBRVEsQ0FBQyxHQUFHLENBQUMsQ0FBRyxDQUFDO0lBQzdCLENBQUMsTUFDSTtNQUNISCxNQUFNLENBQUNJLElBQUksQ0FBRVIsU0FBUyxDQUFFLENBQUVPLENBQUMsR0FBRyxDQUFDLElBQUssQ0FBRSxDQUFFLENBQUM7SUFDM0M7RUFDRjtFQUVBLE9BQU9ILE1BQU07QUFDZjtBQUVBSyxvQkFBUSxDQUFDQyxRQUFRLENBQUUsWUFBWSxFQUFFWixVQUFXLENBQUM7QUFBQyxJQUFBYSxRQUFBLEdBQUFDLE9BQUEsY0FFL0JkLFVBQVUiLCJpZ25vcmVMaXN0IjpbXX0=