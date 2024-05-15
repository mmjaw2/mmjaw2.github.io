"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2018-2023, University of Colorado Boulder

/**
 * Map for multidimensional arrays.
 *
 * e.g. dimensionMap( 1, array, callback ) is equivalent to array.map( callback )
 * e.g. dimensionMap( 2, [ [ 1, 2 ], [ 3, 4 ] ], f ) will return
 *      [ [ f(1), f(2) ], [ f(3), f(4) ] ]
 *   OR more accurately (since it includes indices indicating how to reach that element:
 *      [ [ f(1,0,0), f(2,0,1) ], [ f(3,1,0), f(3,1,1) ] ]
 *   Notably, f(2,0,1) is called for the element 3 BECAUSE original[ 0 ][ 1 ] is the element 2
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

/**
 * @param dimension - The dimension of the array (how many levels of nested arrays there are). For instance,
 *   [ 'a' ] is a 1-dimensional array, [ [ 'b' ] ] is a 2-dimensional array, etc.
 * @param array - A multidimensional array of the specified dimension
 * @param map - function( element: {*}, indices...: {Array.<number>} ): {*}. Called for each individual
 *   element. The indices are provided as the 2nd, 3rd, etc. parameters to the function (continues depending on the
 *   dimension). This is a generalization of the normal `map` function, which only provides the first index. Thus:
 *   array[ indices[ 0 ] ]...[ indices[ dimension - 1 ] ] === element
 * @returns - A multidimensional array of the same dimension as our input, but with the
 *   values replaced with the return value of the map() calls for each element.
 */
function dimensionMap(dimension, array, map) {
  // Will get indices pushed when we go deeper into the multidimensional array, and popped when we go back, so that
  // this essentially represents our "position" in the multidimensional array during iteration.
  var indices = [];

  /**
   * Responsible for mapping a multidimensional array of the given dimension, while accumulating
   * indices.
   */
  function recur(dim, arr) {
    return arr.map(function (element, index) {
      // To process this element, we need to record our index (in case it is an array that we iterate through).
      indices.push(index);

      // If our dimension is 1, it's our base case (apply the normal map function), otherwise continue recursively.
      var result = dim === 1 ? map.apply(void 0, [element].concat(indices)) : recur(dim - 1, element);

      // We are done with iteration
      indices.pop();
      return result;
    });
  }
  return recur(dimension, array);
}
_phetCore["default"].register('dimensionMap', dimensionMap);
var _default = exports["default"] = dimensionMap;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJkaW1lbnNpb25NYXAiLCJkaW1lbnNpb24iLCJhcnJheSIsIm1hcCIsImluZGljZXMiLCJyZWN1ciIsImRpbSIsImFyciIsImVsZW1lbnQiLCJpbmRleCIsInB1c2giLCJyZXN1bHQiLCJhcHBseSIsImNvbmNhdCIsInBvcCIsInBoZXRDb3JlIiwicmVnaXN0ZXIiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyJkaW1lbnNpb25NYXAudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogTWFwIGZvciBtdWx0aWRpbWVuc2lvbmFsIGFycmF5cy5cclxuICpcclxuICogZS5nLiBkaW1lbnNpb25NYXAoIDEsIGFycmF5LCBjYWxsYmFjayApIGlzIGVxdWl2YWxlbnQgdG8gYXJyYXkubWFwKCBjYWxsYmFjayApXHJcbiAqIGUuZy4gZGltZW5zaW9uTWFwKCAyLCBbIFsgMSwgMiBdLCBbIDMsIDQgXSBdLCBmICkgd2lsbCByZXR1cm5cclxuICogICAgICBbIFsgZigxKSwgZigyKSBdLCBbIGYoMyksIGYoNCkgXSBdXHJcbiAqICAgT1IgbW9yZSBhY2N1cmF0ZWx5IChzaW5jZSBpdCBpbmNsdWRlcyBpbmRpY2VzIGluZGljYXRpbmcgaG93IHRvIHJlYWNoIHRoYXQgZWxlbWVudDpcclxuICogICAgICBbIFsgZigxLDAsMCksIGYoMiwwLDEpIF0sIFsgZigzLDEsMCksIGYoMywxLDEpIF0gXVxyXG4gKiAgIE5vdGFibHksIGYoMiwwLDEpIGlzIGNhbGxlZCBmb3IgdGhlIGVsZW1lbnQgMyBCRUNBVVNFIG9yaWdpbmFsWyAwIF1bIDEgXSBpcyB0aGUgZWxlbWVudCAyXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcblxyXG50eXBlIE11bHRpZGltZW5zaW9uYWxBcnJheTxUPiA9IEFycmF5PE11bHRpZGltZW5zaW9uYWxBcnJheTxUPiB8IFQ+O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gZGltZW5zaW9uIC0gVGhlIGRpbWVuc2lvbiBvZiB0aGUgYXJyYXkgKGhvdyBtYW55IGxldmVscyBvZiBuZXN0ZWQgYXJyYXlzIHRoZXJlIGFyZSkuIEZvciBpbnN0YW5jZSxcclxuICogICBbICdhJyBdIGlzIGEgMS1kaW1lbnNpb25hbCBhcnJheSwgWyBbICdiJyBdIF0gaXMgYSAyLWRpbWVuc2lvbmFsIGFycmF5LCBldGMuXHJcbiAqIEBwYXJhbSBhcnJheSAtIEEgbXVsdGlkaW1lbnNpb25hbCBhcnJheSBvZiB0aGUgc3BlY2lmaWVkIGRpbWVuc2lvblxyXG4gKiBAcGFyYW0gbWFwIC0gZnVuY3Rpb24oIGVsZW1lbnQ6IHsqfSwgaW5kaWNlcy4uLjoge0FycmF5LjxudW1iZXI+fSApOiB7Kn0uIENhbGxlZCBmb3IgZWFjaCBpbmRpdmlkdWFsXHJcbiAqICAgZWxlbWVudC4gVGhlIGluZGljZXMgYXJlIHByb3ZpZGVkIGFzIHRoZSAybmQsIDNyZCwgZXRjLiBwYXJhbWV0ZXJzIHRvIHRoZSBmdW5jdGlvbiAoY29udGludWVzIGRlcGVuZGluZyBvbiB0aGVcclxuICogICBkaW1lbnNpb24pLiBUaGlzIGlzIGEgZ2VuZXJhbGl6YXRpb24gb2YgdGhlIG5vcm1hbCBgbWFwYCBmdW5jdGlvbiwgd2hpY2ggb25seSBwcm92aWRlcyB0aGUgZmlyc3QgaW5kZXguIFRodXM6XHJcbiAqICAgYXJyYXlbIGluZGljZXNbIDAgXSBdLi4uWyBpbmRpY2VzWyBkaW1lbnNpb24gLSAxIF0gXSA9PT0gZWxlbWVudFxyXG4gKiBAcmV0dXJucyAtIEEgbXVsdGlkaW1lbnNpb25hbCBhcnJheSBvZiB0aGUgc2FtZSBkaW1lbnNpb24gYXMgb3VyIGlucHV0LCBidXQgd2l0aCB0aGVcclxuICogICB2YWx1ZXMgcmVwbGFjZWQgd2l0aCB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBtYXAoKSBjYWxscyBmb3IgZWFjaCBlbGVtZW50LlxyXG4gKi9cclxuZnVuY3Rpb24gZGltZW5zaW9uTWFwPElucHV0VHlwZSwgUmV0dXJuVHlwZT4oIGRpbWVuc2lvbjogbnVtYmVyLCBhcnJheTogTXVsdGlkaW1lbnNpb25hbEFycmF5PElucHV0VHlwZT4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXA6ICggZWxlbWVudDogSW5wdXRUeXBlLCAuLi5pbmRpY2VzOiBudW1iZXJbXSApID0+IFJldHVyblR5cGUgKTogTXVsdGlkaW1lbnNpb25hbEFycmF5PFJldHVyblR5cGU+IHtcclxuXHJcbiAgLy8gV2lsbCBnZXQgaW5kaWNlcyBwdXNoZWQgd2hlbiB3ZSBnbyBkZWVwZXIgaW50byB0aGUgbXVsdGlkaW1lbnNpb25hbCBhcnJheSwgYW5kIHBvcHBlZCB3aGVuIHdlIGdvIGJhY2ssIHNvIHRoYXRcclxuICAvLyB0aGlzIGVzc2VudGlhbGx5IHJlcHJlc2VudHMgb3VyIFwicG9zaXRpb25cIiBpbiB0aGUgbXVsdGlkaW1lbnNpb25hbCBhcnJheSBkdXJpbmcgaXRlcmF0aW9uLlxyXG4gIGNvbnN0IGluZGljZXM6IG51bWJlcltdID0gW107XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3BvbnNpYmxlIGZvciBtYXBwaW5nIGEgbXVsdGlkaW1lbnNpb25hbCBhcnJheSBvZiB0aGUgZ2l2ZW4gZGltZW5zaW9uLCB3aGlsZSBhY2N1bXVsYXRpbmdcclxuICAgKiBpbmRpY2VzLlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHJlY3VyKCBkaW06IG51bWJlciwgYXJyOiBNdWx0aWRpbWVuc2lvbmFsQXJyYXk8SW5wdXRUeXBlPiApOiBNdWx0aWRpbWVuc2lvbmFsQXJyYXk8UmV0dXJuVHlwZT4ge1xyXG4gICAgcmV0dXJuIGFyci5tYXAoICggZWxlbWVudCwgaW5kZXggKSA9PiB7XHJcblxyXG4gICAgICAvLyBUbyBwcm9jZXNzIHRoaXMgZWxlbWVudCwgd2UgbmVlZCB0byByZWNvcmQgb3VyIGluZGV4IChpbiBjYXNlIGl0IGlzIGFuIGFycmF5IHRoYXQgd2UgaXRlcmF0ZSB0aHJvdWdoKS5cclxuICAgICAgaW5kaWNlcy5wdXNoKCBpbmRleCApO1xyXG5cclxuICAgICAgLy8gSWYgb3VyIGRpbWVuc2lvbiBpcyAxLCBpdCdzIG91ciBiYXNlIGNhc2UgKGFwcGx5IHRoZSBub3JtYWwgbWFwIGZ1bmN0aW9uKSwgb3RoZXJ3aXNlIGNvbnRpbnVlIHJlY3Vyc2l2ZWx5LlxyXG4gICAgICBjb25zdCByZXN1bHQ6IE11bHRpZGltZW5zaW9uYWxBcnJheTxSZXR1cm5UeXBlPiB8IFJldHVyblR5cGUgPSBkaW0gPT09IDEgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXAoIGVsZW1lbnQgYXMgSW5wdXRUeXBlLCAuLi5pbmRpY2VzICkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWN1ciggZGltIC0gMSwgZWxlbWVudCBhcyBNdWx0aWRpbWVuc2lvbmFsQXJyYXk8SW5wdXRUeXBlPiApO1xyXG5cclxuICAgICAgLy8gV2UgYXJlIGRvbmUgd2l0aCBpdGVyYXRpb25cclxuICAgICAgaW5kaWNlcy5wb3AoKTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIHJldHVybiByZWN1ciggZGltZW5zaW9uLCBhcnJheSApO1xyXG59XHJcblxyXG5waGV0Q29yZS5yZWdpc3RlciggJ2RpbWVuc2lvbk1hcCcsIGRpbWVuc2lvbk1hcCApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGltZW5zaW9uTWFwOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBZUEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQXFDLFNBQUFELHVCQUFBRSxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsZ0JBQUFBLEdBQUE7QUFmckM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTRSxZQUFZQSxDQUF5QkMsU0FBaUIsRUFBRUMsS0FBdUMsRUFDMURDLEdBQStELEVBQXNDO0VBRWpKO0VBQ0E7RUFDQSxJQUFNQyxPQUFpQixHQUFHLEVBQUU7O0VBRTVCO0FBQ0Y7QUFDQTtBQUNBO0VBQ0UsU0FBU0MsS0FBS0EsQ0FBRUMsR0FBVyxFQUFFQyxHQUFxQyxFQUFzQztJQUN0RyxPQUFPQSxHQUFHLENBQUNKLEdBQUcsQ0FBRSxVQUFFSyxPQUFPLEVBQUVDLEtBQUssRUFBTTtNQUVwQztNQUNBTCxPQUFPLENBQUNNLElBQUksQ0FBRUQsS0FBTSxDQUFDOztNQUVyQjtNQUNBLElBQU1FLE1BQXNELEdBQUdMLEdBQUcsS0FBSyxDQUFDLEdBQ1RILEdBQUcsQ0FBQVMsS0FBQSxVQUFFSixPQUFPLEVBQUFLLE1BQUEsQ0FBa0JULE9BQU8sQ0FBQyxDQUFDLEdBQ3ZDQyxLQUFLLENBQUVDLEdBQUcsR0FBRyxDQUFDLEVBQUVFLE9BQTRDLENBQUM7O01BRTVIO01BQ0FKLE9BQU8sQ0FBQ1UsR0FBRyxDQUFDLENBQUM7TUFDYixPQUFPSCxNQUFNO0lBQ2YsQ0FBRSxDQUFDO0VBQ0w7RUFFQSxPQUFPTixLQUFLLENBQUVKLFNBQVMsRUFBRUMsS0FBTSxDQUFDO0FBQ2xDO0FBRUFhLG9CQUFRLENBQUNDLFFBQVEsQ0FBRSxjQUFjLEVBQUVoQixZQUFhLENBQUM7QUFBQyxJQUFBaUIsUUFBQSxHQUFBQyxPQUFBLGNBRW5DbEIsWUFBWSIsImlnbm9yZUxpc3QiOltdfQ==