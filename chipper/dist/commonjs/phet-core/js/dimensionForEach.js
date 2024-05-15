"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2018-2023, University of Colorado Boulder

/**
 * ForEach for multidimensional arrays.
 *
 * e.g. dimensionForEach( 1, array, callback ) is equivalent to array.forEach( callback )
 * e.g. dimensionForEach( 2, [ [ 1, 2 ], [ 3, 4 ] ], f ) will call:
 *      f(1), f(2), f(3), f(4)
 *   OR more accurately (since it includes indices indicating how to reach that element:
 *      f(1,0,0), f(2,0,1), f(3,1,0), f(4,1,1)
 *   Notably, f(2,0,1) is called for the element 3 BECAUSE original[ 0 ][ 1 ] is the element 2
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

/**
 * @param dimension - The dimension of the array (how many levels of nested arrays there are). For instance,
 *   [ 'a' ] is a 1-dimensional array, [ [ 'b' ] ] is a 2-dimensional array, etc.
 * @param array - A multidimensional array of the specified dimension
 * @param forEach - function( element: {*}, indices...: {Array.<number>} ). Called for each individual
 *   element. The indices are provided as the 2nd, 3rd, etc. parameters to the function (continues depending on the
 *   dimension). This is a generalization of the normal `forEach` function, which only provides the first index. Thus:
 *   array[ indices[ 0 ] ]...[ indices[ dimension - 1 ] ] === element
 */
function dimensionForEach(dimension, array, forEach) {
  // Will get indices pushed when we go deeper into the multidimensional array, and popped when we go back, so that
  // this essentially represents our "position" in the multidimensional array during iteration.
  var indices = [];

  /**
   * Responsible for iterating through a multidimensional array of the given dimension, while accumulating
   * indices.
   */
  function recur(dim, arr) {
    return arr.forEach(function (element, index) {
      // To process this element, we need to record our index (in case it is an array that we iterate through).
      indices.push(index);

      // Our base case, where recur was passed a 1-dimensional array
      if (dim === 1) {
        forEach.apply(void 0, [element].concat(indices));
      }
      // We have more dimensions
      else {
        recur(dim - 1, element);
      }

      // We are done with iteration
      indices.pop();
    });
  }
  return recur(dimension, array);
}
_phetCore["default"].register('dimensionForEach', dimensionForEach);
var _default = exports["default"] = dimensionForEach;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJkaW1lbnNpb25Gb3JFYWNoIiwiZGltZW5zaW9uIiwiYXJyYXkiLCJmb3JFYWNoIiwiaW5kaWNlcyIsInJlY3VyIiwiZGltIiwiYXJyIiwiZWxlbWVudCIsImluZGV4IiwicHVzaCIsImFwcGx5IiwiY29uY2F0IiwicG9wIiwicGhldENvcmUiLCJyZWdpc3RlciIsIl9kZWZhdWx0IiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbImRpbWVuc2lvbkZvckVhY2gudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogRm9yRWFjaCBmb3IgbXVsdGlkaW1lbnNpb25hbCBhcnJheXMuXHJcbiAqXHJcbiAqIGUuZy4gZGltZW5zaW9uRm9yRWFjaCggMSwgYXJyYXksIGNhbGxiYWNrICkgaXMgZXF1aXZhbGVudCB0byBhcnJheS5mb3JFYWNoKCBjYWxsYmFjayApXHJcbiAqIGUuZy4gZGltZW5zaW9uRm9yRWFjaCggMiwgWyBbIDEsIDIgXSwgWyAzLCA0IF0gXSwgZiApIHdpbGwgY2FsbDpcclxuICogICAgICBmKDEpLCBmKDIpLCBmKDMpLCBmKDQpXHJcbiAqICAgT1IgbW9yZSBhY2N1cmF0ZWx5IChzaW5jZSBpdCBpbmNsdWRlcyBpbmRpY2VzIGluZGljYXRpbmcgaG93IHRvIHJlYWNoIHRoYXQgZWxlbWVudDpcclxuICogICAgICBmKDEsMCwwKSwgZigyLDAsMSksIGYoMywxLDApLCBmKDQsMSwxKVxyXG4gKiAgIE5vdGFibHksIGYoMiwwLDEpIGlzIGNhbGxlZCBmb3IgdGhlIGVsZW1lbnQgMyBCRUNBVVNFIG9yaWdpbmFsWyAwIF1bIDEgXSBpcyB0aGUgZWxlbWVudCAyXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcblxyXG50eXBlIE11bHRpZGltZW5zaW9uYWxBcnJheTxUPiA9IEFycmF5PE11bHRpZGltZW5zaW9uYWxBcnJheTxUPiB8IFQ+O1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBkaW1lbnNpb24gLSBUaGUgZGltZW5zaW9uIG9mIHRoZSBhcnJheSAoaG93IG1hbnkgbGV2ZWxzIG9mIG5lc3RlZCBhcnJheXMgdGhlcmUgYXJlKS4gRm9yIGluc3RhbmNlLFxyXG4gKiAgIFsgJ2EnIF0gaXMgYSAxLWRpbWVuc2lvbmFsIGFycmF5LCBbIFsgJ2InIF0gXSBpcyBhIDItZGltZW5zaW9uYWwgYXJyYXksIGV0Yy5cclxuICogQHBhcmFtIGFycmF5IC0gQSBtdWx0aWRpbWVuc2lvbmFsIGFycmF5IG9mIHRoZSBzcGVjaWZpZWQgZGltZW5zaW9uXHJcbiAqIEBwYXJhbSBmb3JFYWNoIC0gZnVuY3Rpb24oIGVsZW1lbnQ6IHsqfSwgaW5kaWNlcy4uLjoge0FycmF5LjxudW1iZXI+fSApLiBDYWxsZWQgZm9yIGVhY2ggaW5kaXZpZHVhbFxyXG4gKiAgIGVsZW1lbnQuIFRoZSBpbmRpY2VzIGFyZSBwcm92aWRlZCBhcyB0aGUgMm5kLCAzcmQsIGV0Yy4gcGFyYW1ldGVycyB0byB0aGUgZnVuY3Rpb24gKGNvbnRpbnVlcyBkZXBlbmRpbmcgb24gdGhlXHJcbiAqICAgZGltZW5zaW9uKS4gVGhpcyBpcyBhIGdlbmVyYWxpemF0aW9uIG9mIHRoZSBub3JtYWwgYGZvckVhY2hgIGZ1bmN0aW9uLCB3aGljaCBvbmx5IHByb3ZpZGVzIHRoZSBmaXJzdCBpbmRleC4gVGh1czpcclxuICogICBhcnJheVsgaW5kaWNlc1sgMCBdIF0uLi5bIGluZGljZXNbIGRpbWVuc2lvbiAtIDEgXSBdID09PSBlbGVtZW50XHJcbiAqL1xyXG5mdW5jdGlvbiBkaW1lbnNpb25Gb3JFYWNoPFQ+KCBkaW1lbnNpb246IG51bWJlciwgYXJyYXk6IE11bHRpZGltZW5zaW9uYWxBcnJheTxUPiwgZm9yRWFjaDogKCBlbGVtZW50OiBULCAuLi5pbmRpY2VzOiBudW1iZXJbXSApID0+IHZvaWQgKTogdm9pZCB7XHJcblxyXG4gIC8vIFdpbGwgZ2V0IGluZGljZXMgcHVzaGVkIHdoZW4gd2UgZ28gZGVlcGVyIGludG8gdGhlIG11bHRpZGltZW5zaW9uYWwgYXJyYXksIGFuZCBwb3BwZWQgd2hlbiB3ZSBnbyBiYWNrLCBzbyB0aGF0XHJcbiAgLy8gdGhpcyBlc3NlbnRpYWxseSByZXByZXNlbnRzIG91ciBcInBvc2l0aW9uXCIgaW4gdGhlIG11bHRpZGltZW5zaW9uYWwgYXJyYXkgZHVyaW5nIGl0ZXJhdGlvbi5cclxuICBjb25zdCBpbmRpY2VzOiBudW1iZXJbXSA9IFtdO1xyXG5cclxuICAvKipcclxuICAgKiBSZXNwb25zaWJsZSBmb3IgaXRlcmF0aW5nIHRocm91Z2ggYSBtdWx0aWRpbWVuc2lvbmFsIGFycmF5IG9mIHRoZSBnaXZlbiBkaW1lbnNpb24sIHdoaWxlIGFjY3VtdWxhdGluZ1xyXG4gICAqIGluZGljZXMuXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gcmVjdXIoIGRpbTogbnVtYmVyLCBhcnI6IE11bHRpZGltZW5zaW9uYWxBcnJheTxUPiApOiB2b2lkIHtcclxuICAgIHJldHVybiBhcnIuZm9yRWFjaCggKCBlbGVtZW50LCBpbmRleCApID0+IHtcclxuXHJcbiAgICAgIC8vIFRvIHByb2Nlc3MgdGhpcyBlbGVtZW50LCB3ZSBuZWVkIHRvIHJlY29yZCBvdXIgaW5kZXggKGluIGNhc2UgaXQgaXMgYW4gYXJyYXkgdGhhdCB3ZSBpdGVyYXRlIHRocm91Z2gpLlxyXG4gICAgICBpbmRpY2VzLnB1c2goIGluZGV4ICk7XHJcblxyXG4gICAgICAvLyBPdXIgYmFzZSBjYXNlLCB3aGVyZSByZWN1ciB3YXMgcGFzc2VkIGEgMS1kaW1lbnNpb25hbCBhcnJheVxyXG4gICAgICBpZiAoIGRpbSA9PT0gMSApIHtcclxuICAgICAgICBmb3JFYWNoKCBlbGVtZW50IGFzIFQsIC4uLmluZGljZXMgKTtcclxuICAgICAgfVxyXG4gICAgICAvLyBXZSBoYXZlIG1vcmUgZGltZW5zaW9uc1xyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZWN1ciggZGltIC0gMSwgZWxlbWVudCBhcyBNdWx0aWRpbWVuc2lvbmFsQXJyYXk8VD4gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gV2UgYXJlIGRvbmUgd2l0aCBpdGVyYXRpb25cclxuICAgICAgaW5kaWNlcy5wb3AoKTtcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIHJldHVybiByZWN1ciggZGltZW5zaW9uLCBhcnJheSApO1xyXG59XHJcblxyXG5waGV0Q29yZS5yZWdpc3RlciggJ2RpbWVuc2lvbkZvckVhY2gnLCBkaW1lbnNpb25Gb3JFYWNoICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkaW1lbnNpb25Gb3JFYWNoOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBZUEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQXFDLFNBQUFELHVCQUFBRSxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsZ0JBQUFBLEdBQUE7QUFmckM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVNFLGdCQUFnQkEsQ0FBS0MsU0FBaUIsRUFBRUMsS0FBK0IsRUFBRUMsT0FBcUQsRUFBUztFQUU5STtFQUNBO0VBQ0EsSUFBTUMsT0FBaUIsR0FBRyxFQUFFOztFQUU1QjtBQUNGO0FBQ0E7QUFDQTtFQUNFLFNBQVNDLEtBQUtBLENBQUVDLEdBQVcsRUFBRUMsR0FBNkIsRUFBUztJQUNqRSxPQUFPQSxHQUFHLENBQUNKLE9BQU8sQ0FBRSxVQUFFSyxPQUFPLEVBQUVDLEtBQUssRUFBTTtNQUV4QztNQUNBTCxPQUFPLENBQUNNLElBQUksQ0FBRUQsS0FBTSxDQUFDOztNQUVyQjtNQUNBLElBQUtILEdBQUcsS0FBSyxDQUFDLEVBQUc7UUFDZkgsT0FBTyxDQUFBUSxLQUFBLFVBQUVILE9BQU8sRUFBQUksTUFBQSxDQUFVUixPQUFPLENBQUMsQ0FBQztNQUNyQztNQUNBO01BQUEsS0FDSztRQUNIQyxLQUFLLENBQUVDLEdBQUcsR0FBRyxDQUFDLEVBQUVFLE9BQW9DLENBQUM7TUFDdkQ7O01BRUE7TUFDQUosT0FBTyxDQUFDUyxHQUFHLENBQUMsQ0FBQztJQUNmLENBQUUsQ0FBQztFQUNMO0VBRUEsT0FBT1IsS0FBSyxDQUFFSixTQUFTLEVBQUVDLEtBQU0sQ0FBQztBQUNsQztBQUVBWSxvQkFBUSxDQUFDQyxRQUFRLENBQUUsa0JBQWtCLEVBQUVmLGdCQUFpQixDQUFDO0FBQUMsSUFBQWdCLFFBQUEsR0FBQUMsT0FBQSxjQUUzQ2pCLGdCQUFnQiIsImlnbm9yZUxpc3QiOltdfQ==