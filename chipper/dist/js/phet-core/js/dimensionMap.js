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

import phetCore from './phetCore.js';
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
  const indices = [];

  /**
   * Responsible for mapping a multidimensional array of the given dimension, while accumulating
   * indices.
   */
  function recur(dim, arr) {
    return arr.map((element, index) => {
      // To process this element, we need to record our index (in case it is an array that we iterate through).
      indices.push(index);

      // If our dimension is 1, it's our base case (apply the normal map function), otherwise continue recursively.
      const result = dim === 1 ? map(element, ...indices) : recur(dim - 1, element);

      // We are done with iteration
      indices.pop();
      return result;
    });
  }
  return recur(dimension, array);
}
phetCore.register('dimensionMap', dimensionMap);
export default dimensionMap;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwaGV0Q29yZSIsImRpbWVuc2lvbk1hcCIsImRpbWVuc2lvbiIsImFycmF5IiwibWFwIiwiaW5kaWNlcyIsInJlY3VyIiwiZGltIiwiYXJyIiwiZWxlbWVudCIsImluZGV4IiwicHVzaCIsInJlc3VsdCIsInBvcCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiZGltZW5zaW9uTWFwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIE1hcCBmb3IgbXVsdGlkaW1lbnNpb25hbCBhcnJheXMuXHJcbiAqXHJcbiAqIGUuZy4gZGltZW5zaW9uTWFwKCAxLCBhcnJheSwgY2FsbGJhY2sgKSBpcyBlcXVpdmFsZW50IHRvIGFycmF5Lm1hcCggY2FsbGJhY2sgKVxyXG4gKiBlLmcuIGRpbWVuc2lvbk1hcCggMiwgWyBbIDEsIDIgXSwgWyAzLCA0IF0gXSwgZiApIHdpbGwgcmV0dXJuXHJcbiAqICAgICAgWyBbIGYoMSksIGYoMikgXSwgWyBmKDMpLCBmKDQpIF0gXVxyXG4gKiAgIE9SIG1vcmUgYWNjdXJhdGVseSAoc2luY2UgaXQgaW5jbHVkZXMgaW5kaWNlcyBpbmRpY2F0aW5nIGhvdyB0byByZWFjaCB0aGF0IGVsZW1lbnQ6XHJcbiAqICAgICAgWyBbIGYoMSwwLDApLCBmKDIsMCwxKSBdLCBbIGYoMywxLDApLCBmKDMsMSwxKSBdIF1cclxuICogICBOb3RhYmx5LCBmKDIsMCwxKSBpcyBjYWxsZWQgZm9yIHRoZSBlbGVtZW50IDMgQkVDQVVTRSBvcmlnaW5hbFsgMCBdWyAxIF0gaXMgdGhlIGVsZW1lbnQgMlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IHBoZXRDb3JlIGZyb20gJy4vcGhldENvcmUuanMnO1xyXG5cclxudHlwZSBNdWx0aWRpbWVuc2lvbmFsQXJyYXk8VD4gPSBBcnJheTxNdWx0aWRpbWVuc2lvbmFsQXJyYXk8VD4gfCBUPjtcclxuXHJcblxyXG4vKipcclxuICogQHBhcmFtIGRpbWVuc2lvbiAtIFRoZSBkaW1lbnNpb24gb2YgdGhlIGFycmF5IChob3cgbWFueSBsZXZlbHMgb2YgbmVzdGVkIGFycmF5cyB0aGVyZSBhcmUpLiBGb3IgaW5zdGFuY2UsXHJcbiAqICAgWyAnYScgXSBpcyBhIDEtZGltZW5zaW9uYWwgYXJyYXksIFsgWyAnYicgXSBdIGlzIGEgMi1kaW1lbnNpb25hbCBhcnJheSwgZXRjLlxyXG4gKiBAcGFyYW0gYXJyYXkgLSBBIG11bHRpZGltZW5zaW9uYWwgYXJyYXkgb2YgdGhlIHNwZWNpZmllZCBkaW1lbnNpb25cclxuICogQHBhcmFtIG1hcCAtIGZ1bmN0aW9uKCBlbGVtZW50OiB7Kn0sIGluZGljZXMuLi46IHtBcnJheS48bnVtYmVyPn0gKTogeyp9LiBDYWxsZWQgZm9yIGVhY2ggaW5kaXZpZHVhbFxyXG4gKiAgIGVsZW1lbnQuIFRoZSBpbmRpY2VzIGFyZSBwcm92aWRlZCBhcyB0aGUgMm5kLCAzcmQsIGV0Yy4gcGFyYW1ldGVycyB0byB0aGUgZnVuY3Rpb24gKGNvbnRpbnVlcyBkZXBlbmRpbmcgb24gdGhlXHJcbiAqICAgZGltZW5zaW9uKS4gVGhpcyBpcyBhIGdlbmVyYWxpemF0aW9uIG9mIHRoZSBub3JtYWwgYG1hcGAgZnVuY3Rpb24sIHdoaWNoIG9ubHkgcHJvdmlkZXMgdGhlIGZpcnN0IGluZGV4LiBUaHVzOlxyXG4gKiAgIGFycmF5WyBpbmRpY2VzWyAwIF0gXS4uLlsgaW5kaWNlc1sgZGltZW5zaW9uIC0gMSBdIF0gPT09IGVsZW1lbnRcclxuICogQHJldHVybnMgLSBBIG11bHRpZGltZW5zaW9uYWwgYXJyYXkgb2YgdGhlIHNhbWUgZGltZW5zaW9uIGFzIG91ciBpbnB1dCwgYnV0IHdpdGggdGhlXHJcbiAqICAgdmFsdWVzIHJlcGxhY2VkIHdpdGggdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgbWFwKCkgY2FsbHMgZm9yIGVhY2ggZWxlbWVudC5cclxuICovXHJcbmZ1bmN0aW9uIGRpbWVuc2lvbk1hcDxJbnB1dFR5cGUsIFJldHVyblR5cGU+KCBkaW1lbnNpb246IG51bWJlciwgYXJyYXk6IE11bHRpZGltZW5zaW9uYWxBcnJheTxJbnB1dFR5cGU+LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwOiAoIGVsZW1lbnQ6IElucHV0VHlwZSwgLi4uaW5kaWNlczogbnVtYmVyW10gKSA9PiBSZXR1cm5UeXBlICk6IE11bHRpZGltZW5zaW9uYWxBcnJheTxSZXR1cm5UeXBlPiB7XHJcblxyXG4gIC8vIFdpbGwgZ2V0IGluZGljZXMgcHVzaGVkIHdoZW4gd2UgZ28gZGVlcGVyIGludG8gdGhlIG11bHRpZGltZW5zaW9uYWwgYXJyYXksIGFuZCBwb3BwZWQgd2hlbiB3ZSBnbyBiYWNrLCBzbyB0aGF0XHJcbiAgLy8gdGhpcyBlc3NlbnRpYWxseSByZXByZXNlbnRzIG91ciBcInBvc2l0aW9uXCIgaW4gdGhlIG11bHRpZGltZW5zaW9uYWwgYXJyYXkgZHVyaW5nIGl0ZXJhdGlvbi5cclxuICBjb25zdCBpbmRpY2VzOiBudW1iZXJbXSA9IFtdO1xyXG5cclxuICAvKipcclxuICAgKiBSZXNwb25zaWJsZSBmb3IgbWFwcGluZyBhIG11bHRpZGltZW5zaW9uYWwgYXJyYXkgb2YgdGhlIGdpdmVuIGRpbWVuc2lvbiwgd2hpbGUgYWNjdW11bGF0aW5nXHJcbiAgICogaW5kaWNlcy5cclxuICAgKi9cclxuICBmdW5jdGlvbiByZWN1ciggZGltOiBudW1iZXIsIGFycjogTXVsdGlkaW1lbnNpb25hbEFycmF5PElucHV0VHlwZT4gKTogTXVsdGlkaW1lbnNpb25hbEFycmF5PFJldHVyblR5cGU+IHtcclxuICAgIHJldHVybiBhcnIubWFwKCAoIGVsZW1lbnQsIGluZGV4ICkgPT4ge1xyXG5cclxuICAgICAgLy8gVG8gcHJvY2VzcyB0aGlzIGVsZW1lbnQsIHdlIG5lZWQgdG8gcmVjb3JkIG91ciBpbmRleCAoaW4gY2FzZSBpdCBpcyBhbiBhcnJheSB0aGF0IHdlIGl0ZXJhdGUgdGhyb3VnaCkuXHJcbiAgICAgIGluZGljZXMucHVzaCggaW5kZXggKTtcclxuXHJcbiAgICAgIC8vIElmIG91ciBkaW1lbnNpb24gaXMgMSwgaXQncyBvdXIgYmFzZSBjYXNlIChhcHBseSB0aGUgbm9ybWFsIG1hcCBmdW5jdGlvbiksIG90aGVyd2lzZSBjb250aW51ZSByZWN1cnNpdmVseS5cclxuICAgICAgY29uc3QgcmVzdWx0OiBNdWx0aWRpbWVuc2lvbmFsQXJyYXk8UmV0dXJuVHlwZT4gfCBSZXR1cm5UeXBlID0gZGltID09PSAxID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwKCBlbGVtZW50IGFzIElucHV0VHlwZSwgLi4uaW5kaWNlcyApIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXIoIGRpbSAtIDEsIGVsZW1lbnQgYXMgTXVsdGlkaW1lbnNpb25hbEFycmF5PElucHV0VHlwZT4gKTtcclxuXHJcbiAgICAgIC8vIFdlIGFyZSBkb25lIHdpdGggaXRlcmF0aW9uXHJcbiAgICAgIGluZGljZXMucG9wKCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcmVjdXIoIGRpbWVuc2lvbiwgYXJyYXkgKTtcclxufVxyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdkaW1lbnNpb25NYXAnLCBkaW1lbnNpb25NYXAgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRpbWVuc2lvbk1hcDsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxRQUFRLE1BQU0sZUFBZTtBQUtwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBU0MsWUFBWUEsQ0FBeUJDLFNBQWlCLEVBQUVDLEtBQXVDLEVBQzFEQyxHQUErRCxFQUFzQztFQUVqSjtFQUNBO0VBQ0EsTUFBTUMsT0FBaUIsR0FBRyxFQUFFOztFQUU1QjtBQUNGO0FBQ0E7QUFDQTtFQUNFLFNBQVNDLEtBQUtBLENBQUVDLEdBQVcsRUFBRUMsR0FBcUMsRUFBc0M7SUFDdEcsT0FBT0EsR0FBRyxDQUFDSixHQUFHLENBQUUsQ0FBRUssT0FBTyxFQUFFQyxLQUFLLEtBQU07TUFFcEM7TUFDQUwsT0FBTyxDQUFDTSxJQUFJLENBQUVELEtBQU0sQ0FBQzs7TUFFckI7TUFDQSxNQUFNRSxNQUFzRCxHQUFHTCxHQUFHLEtBQUssQ0FBQyxHQUNUSCxHQUFHLENBQUVLLE9BQU8sRUFBZSxHQUFHSixPQUFRLENBQUMsR0FDdkNDLEtBQUssQ0FBRUMsR0FBRyxHQUFHLENBQUMsRUFBRUUsT0FBNEMsQ0FBQzs7TUFFNUg7TUFDQUosT0FBTyxDQUFDUSxHQUFHLENBQUMsQ0FBQztNQUNiLE9BQU9ELE1BQU07SUFDZixDQUFFLENBQUM7RUFDTDtFQUVBLE9BQU9OLEtBQUssQ0FBRUosU0FBUyxFQUFFQyxLQUFNLENBQUM7QUFDbEM7QUFFQUgsUUFBUSxDQUFDYyxRQUFRLENBQUUsY0FBYyxFQUFFYixZQUFhLENBQUM7QUFFakQsZUFBZUEsWUFBWSIsImlnbm9yZUxpc3QiOltdfQ==