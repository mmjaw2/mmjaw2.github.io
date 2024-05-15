// Copyright 2018-2023, University of Colorado Boulder

/**
 * Returns a copy of an array, with generated elements interleaved (inserted in-between) every element. For example, if
 * you call `interleave( [ a, b, c ], Math.random )`, it will result in the equivalent:
 * `[ a, Math.random(), b, Math.random(), c ]`.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import phetCore from './phetCore.js';

/**
 * @param arr - The array in which to interleave elements
 * @param generator - function( index: {number} ):{*} - 0-based index for which "separator" it is for. e.g.
 *                               [ _, generator(0), _, generator(1), _, generator(2), ..., _ ]
 * @returns - The interleaved array
 */
function interleave(arr, generator) {
  assert && assert(Array.isArray(arr));
  const result = [];
  const finalLength = arr.length * 2 - 1;
  for (let i = 0; i < finalLength; i++) {
    if (i % 2 === 0) {
      result.push(arr[i / 2]);
    } else {
      result.push(generator((i - 1) / 2));
    }
  }
  return result;
}
phetCore.register('interleave', interleave);
export default interleave;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwaGV0Q29yZSIsImludGVybGVhdmUiLCJhcnIiLCJnZW5lcmF0b3IiLCJhc3NlcnQiLCJBcnJheSIsImlzQXJyYXkiLCJyZXN1bHQiLCJmaW5hbExlbmd0aCIsImxlbmd0aCIsImkiLCJwdXNoIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJpbnRlcmxlYXZlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYSBjb3B5IG9mIGFuIGFycmF5LCB3aXRoIGdlbmVyYXRlZCBlbGVtZW50cyBpbnRlcmxlYXZlZCAoaW5zZXJ0ZWQgaW4tYmV0d2VlbikgZXZlcnkgZWxlbWVudC4gRm9yIGV4YW1wbGUsIGlmXHJcbiAqIHlvdSBjYWxsIGBpbnRlcmxlYXZlKCBbIGEsIGIsIGMgXSwgTWF0aC5yYW5kb20gKWAsIGl0IHdpbGwgcmVzdWx0IGluIHRoZSBlcXVpdmFsZW50OlxyXG4gKiBgWyBhLCBNYXRoLnJhbmRvbSgpLCBiLCBNYXRoLnJhbmRvbSgpLCBjIF1gLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IHBoZXRDb3JlIGZyb20gJy4vcGhldENvcmUuanMnO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBhcnIgLSBUaGUgYXJyYXkgaW4gd2hpY2ggdG8gaW50ZXJsZWF2ZSBlbGVtZW50c1xyXG4gKiBAcGFyYW0gZ2VuZXJhdG9yIC0gZnVuY3Rpb24oIGluZGV4OiB7bnVtYmVyfSApOnsqfSAtIDAtYmFzZWQgaW5kZXggZm9yIHdoaWNoIFwic2VwYXJhdG9yXCIgaXQgaXMgZm9yLiBlLmcuXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFsgXywgZ2VuZXJhdG9yKDApLCBfLCBnZW5lcmF0b3IoMSksIF8sIGdlbmVyYXRvcigyKSwgLi4uLCBfIF1cclxuICogQHJldHVybnMgLSBUaGUgaW50ZXJsZWF2ZWQgYXJyYXlcclxuICovXHJcbmZ1bmN0aW9uIGludGVybGVhdmU8VD4oIGFycjogcmVhZG9ubHkgVFtdLCBnZW5lcmF0b3I6ICggZWxlbWVudDogbnVtYmVyICkgPT4gVCApOiBUW10ge1xyXG4gIGFzc2VydCAmJiBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIGFyciApICk7XHJcblxyXG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG4gIGNvbnN0IGZpbmFsTGVuZ3RoID0gYXJyLmxlbmd0aCAqIDIgLSAxO1xyXG5cclxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBmaW5hbExlbmd0aDsgaSsrICkge1xyXG4gICAgaWYgKCBpICUgMiA9PT0gMCApIHtcclxuICAgICAgcmVzdWx0LnB1c2goIGFyclsgaSAvIDIgXSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJlc3VsdC5wdXNoKCBnZW5lcmF0b3IoICggaSAtIDEgKSAvIDIgKSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdpbnRlcmxlYXZlJywgaW50ZXJsZWF2ZSApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgaW50ZXJsZWF2ZTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFFBQVEsTUFBTSxlQUFlOztBQUVwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTQyxVQUFVQSxDQUFLQyxHQUFpQixFQUFFQyxTQUFtQyxFQUFRO0VBQ3BGQyxNQUFNLElBQUlBLE1BQU0sQ0FBRUMsS0FBSyxDQUFDQyxPQUFPLENBQUVKLEdBQUksQ0FBRSxDQUFDO0VBRXhDLE1BQU1LLE1BQU0sR0FBRyxFQUFFO0VBQ2pCLE1BQU1DLFdBQVcsR0FBR04sR0FBRyxDQUFDTyxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUM7RUFFdEMsS0FBTSxJQUFJQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdGLFdBQVcsRUFBRUUsQ0FBQyxFQUFFLEVBQUc7SUFDdEMsSUFBS0EsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUc7TUFDakJILE1BQU0sQ0FBQ0ksSUFBSSxDQUFFVCxHQUFHLENBQUVRLENBQUMsR0FBRyxDQUFDLENBQUcsQ0FBQztJQUM3QixDQUFDLE1BQ0k7TUFDSEgsTUFBTSxDQUFDSSxJQUFJLENBQUVSLFNBQVMsQ0FBRSxDQUFFTyxDQUFDLEdBQUcsQ0FBQyxJQUFLLENBQUUsQ0FBRSxDQUFDO0lBQzNDO0VBQ0Y7RUFFQSxPQUFPSCxNQUFNO0FBQ2Y7QUFFQVAsUUFBUSxDQUFDWSxRQUFRLENBQUUsWUFBWSxFQUFFWCxVQUFXLENBQUM7QUFFN0MsZUFBZUEsVUFBVSIsImlnbm9yZUxpc3QiOltdfQ==