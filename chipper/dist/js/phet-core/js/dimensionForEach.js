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

import phetCore from './phetCore.js';
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
  const indices = [];

  /**
   * Responsible for iterating through a multidimensional array of the given dimension, while accumulating
   * indices.
   */
  function recur(dim, arr) {
    return arr.forEach((element, index) => {
      // To process this element, we need to record our index (in case it is an array that we iterate through).
      indices.push(index);

      // Our base case, where recur was passed a 1-dimensional array
      if (dim === 1) {
        forEach(element, ...indices);
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
phetCore.register('dimensionForEach', dimensionForEach);
export default dimensionForEach;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwaGV0Q29yZSIsImRpbWVuc2lvbkZvckVhY2giLCJkaW1lbnNpb24iLCJhcnJheSIsImZvckVhY2giLCJpbmRpY2VzIiwicmVjdXIiLCJkaW0iLCJhcnIiLCJlbGVtZW50IiwiaW5kZXgiLCJwdXNoIiwicG9wIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJkaW1lbnNpb25Gb3JFYWNoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEZvckVhY2ggZm9yIG11bHRpZGltZW5zaW9uYWwgYXJyYXlzLlxyXG4gKlxyXG4gKiBlLmcuIGRpbWVuc2lvbkZvckVhY2goIDEsIGFycmF5LCBjYWxsYmFjayApIGlzIGVxdWl2YWxlbnQgdG8gYXJyYXkuZm9yRWFjaCggY2FsbGJhY2sgKVxyXG4gKiBlLmcuIGRpbWVuc2lvbkZvckVhY2goIDIsIFsgWyAxLCAyIF0sIFsgMywgNCBdIF0sIGYgKSB3aWxsIGNhbGw6XHJcbiAqICAgICAgZigxKSwgZigyKSwgZigzKSwgZig0KVxyXG4gKiAgIE9SIG1vcmUgYWNjdXJhdGVseSAoc2luY2UgaXQgaW5jbHVkZXMgaW5kaWNlcyBpbmRpY2F0aW5nIGhvdyB0byByZWFjaCB0aGF0IGVsZW1lbnQ6XHJcbiAqICAgICAgZigxLDAsMCksIGYoMiwwLDEpLCBmKDMsMSwwKSwgZig0LDEsMSlcclxuICogICBOb3RhYmx5LCBmKDIsMCwxKSBpcyBjYWxsZWQgZm9yIHRoZSBlbGVtZW50IDMgQkVDQVVTRSBvcmlnaW5hbFsgMCBdWyAxIF0gaXMgdGhlIGVsZW1lbnQgMlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IHBoZXRDb3JlIGZyb20gJy4vcGhldENvcmUuanMnO1xyXG5cclxudHlwZSBNdWx0aWRpbWVuc2lvbmFsQXJyYXk8VD4gPSBBcnJheTxNdWx0aWRpbWVuc2lvbmFsQXJyYXk8VD4gfCBUPjtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gZGltZW5zaW9uIC0gVGhlIGRpbWVuc2lvbiBvZiB0aGUgYXJyYXkgKGhvdyBtYW55IGxldmVscyBvZiBuZXN0ZWQgYXJyYXlzIHRoZXJlIGFyZSkuIEZvciBpbnN0YW5jZSxcclxuICogICBbICdhJyBdIGlzIGEgMS1kaW1lbnNpb25hbCBhcnJheSwgWyBbICdiJyBdIF0gaXMgYSAyLWRpbWVuc2lvbmFsIGFycmF5LCBldGMuXHJcbiAqIEBwYXJhbSBhcnJheSAtIEEgbXVsdGlkaW1lbnNpb25hbCBhcnJheSBvZiB0aGUgc3BlY2lmaWVkIGRpbWVuc2lvblxyXG4gKiBAcGFyYW0gZm9yRWFjaCAtIGZ1bmN0aW9uKCBlbGVtZW50OiB7Kn0sIGluZGljZXMuLi46IHtBcnJheS48bnVtYmVyPn0gKS4gQ2FsbGVkIGZvciBlYWNoIGluZGl2aWR1YWxcclxuICogICBlbGVtZW50LiBUaGUgaW5kaWNlcyBhcmUgcHJvdmlkZWQgYXMgdGhlIDJuZCwgM3JkLCBldGMuIHBhcmFtZXRlcnMgdG8gdGhlIGZ1bmN0aW9uIChjb250aW51ZXMgZGVwZW5kaW5nIG9uIHRoZVxyXG4gKiAgIGRpbWVuc2lvbikuIFRoaXMgaXMgYSBnZW5lcmFsaXphdGlvbiBvZiB0aGUgbm9ybWFsIGBmb3JFYWNoYCBmdW5jdGlvbiwgd2hpY2ggb25seSBwcm92aWRlcyB0aGUgZmlyc3QgaW5kZXguIFRodXM6XHJcbiAqICAgYXJyYXlbIGluZGljZXNbIDAgXSBdLi4uWyBpbmRpY2VzWyBkaW1lbnNpb24gLSAxIF0gXSA9PT0gZWxlbWVudFxyXG4gKi9cclxuZnVuY3Rpb24gZGltZW5zaW9uRm9yRWFjaDxUPiggZGltZW5zaW9uOiBudW1iZXIsIGFycmF5OiBNdWx0aWRpbWVuc2lvbmFsQXJyYXk8VD4sIGZvckVhY2g6ICggZWxlbWVudDogVCwgLi4uaW5kaWNlczogbnVtYmVyW10gKSA9PiB2b2lkICk6IHZvaWQge1xyXG5cclxuICAvLyBXaWxsIGdldCBpbmRpY2VzIHB1c2hlZCB3aGVuIHdlIGdvIGRlZXBlciBpbnRvIHRoZSBtdWx0aWRpbWVuc2lvbmFsIGFycmF5LCBhbmQgcG9wcGVkIHdoZW4gd2UgZ28gYmFjaywgc28gdGhhdFxyXG4gIC8vIHRoaXMgZXNzZW50aWFsbHkgcmVwcmVzZW50cyBvdXIgXCJwb3NpdGlvblwiIGluIHRoZSBtdWx0aWRpbWVuc2lvbmFsIGFycmF5IGR1cmluZyBpdGVyYXRpb24uXHJcbiAgY29uc3QgaW5kaWNlczogbnVtYmVyW10gPSBbXTtcclxuXHJcbiAgLyoqXHJcbiAgICogUmVzcG9uc2libGUgZm9yIGl0ZXJhdGluZyB0aHJvdWdoIGEgbXVsdGlkaW1lbnNpb25hbCBhcnJheSBvZiB0aGUgZ2l2ZW4gZGltZW5zaW9uLCB3aGlsZSBhY2N1bXVsYXRpbmdcclxuICAgKiBpbmRpY2VzLlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHJlY3VyKCBkaW06IG51bWJlciwgYXJyOiBNdWx0aWRpbWVuc2lvbmFsQXJyYXk8VD4gKTogdm9pZCB7XHJcbiAgICByZXR1cm4gYXJyLmZvckVhY2goICggZWxlbWVudCwgaW5kZXggKSA9PiB7XHJcblxyXG4gICAgICAvLyBUbyBwcm9jZXNzIHRoaXMgZWxlbWVudCwgd2UgbmVlZCB0byByZWNvcmQgb3VyIGluZGV4IChpbiBjYXNlIGl0IGlzIGFuIGFycmF5IHRoYXQgd2UgaXRlcmF0ZSB0aHJvdWdoKS5cclxuICAgICAgaW5kaWNlcy5wdXNoKCBpbmRleCApO1xyXG5cclxuICAgICAgLy8gT3VyIGJhc2UgY2FzZSwgd2hlcmUgcmVjdXIgd2FzIHBhc3NlZCBhIDEtZGltZW5zaW9uYWwgYXJyYXlcclxuICAgICAgaWYgKCBkaW0gPT09IDEgKSB7XHJcbiAgICAgICAgZm9yRWFjaCggZWxlbWVudCBhcyBULCAuLi5pbmRpY2VzICk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gV2UgaGF2ZSBtb3JlIGRpbWVuc2lvbnNcclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmVjdXIoIGRpbSAtIDEsIGVsZW1lbnQgYXMgTXVsdGlkaW1lbnNpb25hbEFycmF5PFQ+ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFdlIGFyZSBkb25lIHdpdGggaXRlcmF0aW9uXHJcbiAgICAgIGluZGljZXMucG9wKCk7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcmVjdXIoIGRpbWVuc2lvbiwgYXJyYXkgKTtcclxufVxyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdkaW1lbnNpb25Gb3JFYWNoJywgZGltZW5zaW9uRm9yRWFjaCApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGltZW5zaW9uRm9yRWFjaDsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxRQUFRLE1BQU0sZUFBZTtBQUlwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTQyxnQkFBZ0JBLENBQUtDLFNBQWlCLEVBQUVDLEtBQStCLEVBQUVDLE9BQXFELEVBQVM7RUFFOUk7RUFDQTtFQUNBLE1BQU1DLE9BQWlCLEdBQUcsRUFBRTs7RUFFNUI7QUFDRjtBQUNBO0FBQ0E7RUFDRSxTQUFTQyxLQUFLQSxDQUFFQyxHQUFXLEVBQUVDLEdBQTZCLEVBQVM7SUFDakUsT0FBT0EsR0FBRyxDQUFDSixPQUFPLENBQUUsQ0FBRUssT0FBTyxFQUFFQyxLQUFLLEtBQU07TUFFeEM7TUFDQUwsT0FBTyxDQUFDTSxJQUFJLENBQUVELEtBQU0sQ0FBQzs7TUFFckI7TUFDQSxJQUFLSCxHQUFHLEtBQUssQ0FBQyxFQUFHO1FBQ2ZILE9BQU8sQ0FBRUssT0FBTyxFQUFPLEdBQUdKLE9BQVEsQ0FBQztNQUNyQztNQUNBO01BQUEsS0FDSztRQUNIQyxLQUFLLENBQUVDLEdBQUcsR0FBRyxDQUFDLEVBQUVFLE9BQW9DLENBQUM7TUFDdkQ7O01BRUE7TUFDQUosT0FBTyxDQUFDTyxHQUFHLENBQUMsQ0FBQztJQUNmLENBQUUsQ0FBQztFQUNMO0VBRUEsT0FBT04sS0FBSyxDQUFFSixTQUFTLEVBQUVDLEtBQU0sQ0FBQztBQUNsQztBQUVBSCxRQUFRLENBQUNhLFFBQVEsQ0FBRSxrQkFBa0IsRUFBRVosZ0JBQWlCLENBQUM7QUFFekQsZUFBZUEsZ0JBQWdCIiwiaWdub3JlTGlzdCI6W119