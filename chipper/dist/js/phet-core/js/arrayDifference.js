// Copyright 2018-2023, University of Colorado Boulder

/**
 * Computes what elements are in both arrays, or only one array.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import phetCore from './phetCore.js';

/**
 * Given two arrays, find the items that are only in one of them (mutates the aOnly/bOnly/inBoth parameters)
 *
 * NOTE: Assumes there are no duplicate values in each individual array.
 *
 * For example:
 *   var a = [ 1, 2 ];
 *   var b = [ 5, 2, 0 ];
 *   var aOnly = [];
 *   var bOnly = [];
 *   var inBoth = [];
 *   arrayDifference( a, b, aOnly, bOnly, inBoth );
 *   // aOnly is [ 1 ]
 *   // bOnly is [ 5, 0 ]
 *   // inBoth is [ 2 ]
 *
 * @param a - Input array
 * @param b - Input array
 * @param [aOnly] - Output array (will be filled with all elements that are in `a` but NOT in `b`).
 *                              Ordered based on the order of `a`.
 * @param [bOnly] - Output array (will be filled with all elements that are in `b` but NOT in `a`).
 *                              Ordered based on the order of `b`.
 * @param [inBoth] - Output array (will be filled with all elements that are in both `a` AND `b`).
 *                               Ordered based on the order of `a`.
 * @returns - Returns the value of aOnly (the classic definition of difference)
 */
function arrayDifference(a, b, aOnly, bOnly, inBoth) {
  assert && assert(Array.isArray(a) && _.uniq(a).length === a.length, 'a is not an array of unique items');
  assert && assert(Array.isArray(b) && _.uniq(b).length === b.length, 'b is not an array of unique items');
  aOnly = aOnly || [];
  bOnly = bOnly || [];
  inBoth = inBoth || [];
  assert && assert(Array.isArray(aOnly) && aOnly.length === 0);
  assert && assert(Array.isArray(bOnly) && bOnly.length === 0);
  assert && assert(Array.isArray(inBoth) && inBoth.length === 0);
  Array.prototype.push.apply(aOnly, a);
  Array.prototype.push.apply(bOnly, b);
  outerLoop:
  // eslint-disable-line no-labels
  for (let i = 0; i < aOnly.length; i++) {
    const aItem = aOnly[i];
    for (let j = 0; j < bOnly.length; j++) {
      const bItem = bOnly[j];
      if (aItem === bItem) {
        inBoth.push(aItem);
        aOnly.splice(i, 1);
        bOnly.splice(j, 1);
        j = 0;
        if (i === aOnly.length) {
          break outerLoop; // eslint-disable-line no-labels
        }
        i -= 1;
      }
    }
  }

  // We return the classic meaning of "difference"
  return aOnly;
}
phetCore.register('arrayDifference', arrayDifference);
export default arrayDifference;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwaGV0Q29yZSIsImFycmF5RGlmZmVyZW5jZSIsImEiLCJiIiwiYU9ubHkiLCJiT25seSIsImluQm90aCIsImFzc2VydCIsIkFycmF5IiwiaXNBcnJheSIsIl8iLCJ1bmlxIiwibGVuZ3RoIiwicHJvdG90eXBlIiwicHVzaCIsImFwcGx5Iiwib3V0ZXJMb29wIiwiaSIsImFJdGVtIiwiaiIsImJJdGVtIiwic3BsaWNlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJhcnJheURpZmZlcmVuY2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ29tcHV0ZXMgd2hhdCBlbGVtZW50cyBhcmUgaW4gYm90aCBhcnJheXMsIG9yIG9ubHkgb25lIGFycmF5LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IHBoZXRDb3JlIGZyb20gJy4vcGhldENvcmUuanMnO1xyXG5cclxuLyoqXHJcbiAqIEdpdmVuIHR3byBhcnJheXMsIGZpbmQgdGhlIGl0ZW1zIHRoYXQgYXJlIG9ubHkgaW4gb25lIG9mIHRoZW0gKG11dGF0ZXMgdGhlIGFPbmx5L2JPbmx5L2luQm90aCBwYXJhbWV0ZXJzKVxyXG4gKlxyXG4gKiBOT1RFOiBBc3N1bWVzIHRoZXJlIGFyZSBubyBkdXBsaWNhdGUgdmFsdWVzIGluIGVhY2ggaW5kaXZpZHVhbCBhcnJheS5cclxuICpcclxuICogRm9yIGV4YW1wbGU6XHJcbiAqICAgdmFyIGEgPSBbIDEsIDIgXTtcclxuICogICB2YXIgYiA9IFsgNSwgMiwgMCBdO1xyXG4gKiAgIHZhciBhT25seSA9IFtdO1xyXG4gKiAgIHZhciBiT25seSA9IFtdO1xyXG4gKiAgIHZhciBpbkJvdGggPSBbXTtcclxuICogICBhcnJheURpZmZlcmVuY2UoIGEsIGIsIGFPbmx5LCBiT25seSwgaW5Cb3RoICk7XHJcbiAqICAgLy8gYU9ubHkgaXMgWyAxIF1cclxuICogICAvLyBiT25seSBpcyBbIDUsIDAgXVxyXG4gKiAgIC8vIGluQm90aCBpcyBbIDIgXVxyXG4gKlxyXG4gKiBAcGFyYW0gYSAtIElucHV0IGFycmF5XHJcbiAqIEBwYXJhbSBiIC0gSW5wdXQgYXJyYXlcclxuICogQHBhcmFtIFthT25seV0gLSBPdXRwdXQgYXJyYXkgKHdpbGwgYmUgZmlsbGVkIHdpdGggYWxsIGVsZW1lbnRzIHRoYXQgYXJlIGluIGBhYCBidXQgTk9UIGluIGBiYCkuXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT3JkZXJlZCBiYXNlZCBvbiB0aGUgb3JkZXIgb2YgYGFgLlxyXG4gKiBAcGFyYW0gW2JPbmx5XSAtIE91dHB1dCBhcnJheSAod2lsbCBiZSBmaWxsZWQgd2l0aCBhbGwgZWxlbWVudHMgdGhhdCBhcmUgaW4gYGJgIGJ1dCBOT1QgaW4gYGFgKS5cclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPcmRlcmVkIGJhc2VkIG9uIHRoZSBvcmRlciBvZiBgYmAuXHJcbiAqIEBwYXJhbSBbaW5Cb3RoXSAtIE91dHB1dCBhcnJheSAod2lsbCBiZSBmaWxsZWQgd2l0aCBhbGwgZWxlbWVudHMgdGhhdCBhcmUgaW4gYm90aCBgYWAgQU5EIGBiYCkuXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9yZGVyZWQgYmFzZWQgb24gdGhlIG9yZGVyIG9mIGBhYC5cclxuICogQHJldHVybnMgLSBSZXR1cm5zIHRoZSB2YWx1ZSBvZiBhT25seSAodGhlIGNsYXNzaWMgZGVmaW5pdGlvbiBvZiBkaWZmZXJlbmNlKVxyXG4gKi9cclxuZnVuY3Rpb24gYXJyYXlEaWZmZXJlbmNlPFQ+KCBhOiBUW10sIGI6IFRbXSwgYU9ubHk/OiBUW10sIGJPbmx5PzogVFtdLCBpbkJvdGg/OiBUW10gKTogVFtdIHtcclxuICBhc3NlcnQgJiYgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBhICkgJiYgXy51bmlxKCBhICkubGVuZ3RoID09PSBhLmxlbmd0aCwgJ2EgaXMgbm90IGFuIGFycmF5IG9mIHVuaXF1ZSBpdGVtcycgKTtcclxuICBhc3NlcnQgJiYgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBiICkgJiYgXy51bmlxKCBiICkubGVuZ3RoID09PSBiLmxlbmd0aCwgJ2IgaXMgbm90IGFuIGFycmF5IG9mIHVuaXF1ZSBpdGVtcycgKTtcclxuXHJcbiAgYU9ubHkgPSBhT25seSB8fCBbXTtcclxuICBiT25seSA9IGJPbmx5IHx8IFtdO1xyXG4gIGluQm90aCA9IGluQm90aCB8fCBbXTtcclxuXHJcbiAgYXNzZXJ0ICYmIGFzc2VydCggQXJyYXkuaXNBcnJheSggYU9ubHkgKSAmJiBhT25seS5sZW5ndGggPT09IDAgKTtcclxuICBhc3NlcnQgJiYgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBiT25seSApICYmIGJPbmx5Lmxlbmd0aCA9PT0gMCApO1xyXG4gIGFzc2VydCAmJiBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIGluQm90aCApICYmIGluQm90aC5sZW5ndGggPT09IDAgKTtcclxuXHJcbiAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoIGFPbmx5LCBhICk7XHJcbiAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoIGJPbmx5LCBiICk7XHJcblxyXG4gIG91dGVyTG9vcDogLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1sYWJlbHNcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGFPbmx5Lmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBhSXRlbSA9IGFPbmx5WyBpIF07XHJcblxyXG4gICAgICBmb3IgKCBsZXQgaiA9IDA7IGogPCBiT25seS5sZW5ndGg7IGorKyApIHtcclxuICAgICAgICBjb25zdCBiSXRlbSA9IGJPbmx5WyBqIF07XHJcblxyXG4gICAgICAgIGlmICggYUl0ZW0gPT09IGJJdGVtICkge1xyXG4gICAgICAgICAgaW5Cb3RoLnB1c2goIGFJdGVtICk7XHJcbiAgICAgICAgICBhT25seS5zcGxpY2UoIGksIDEgKTtcclxuICAgICAgICAgIGJPbmx5LnNwbGljZSggaiwgMSApO1xyXG4gICAgICAgICAgaiA9IDA7XHJcbiAgICAgICAgICBpZiAoIGkgPT09IGFPbmx5Lmxlbmd0aCApIHtcclxuICAgICAgICAgICAgYnJlYWsgb3V0ZXJMb29wOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxhYmVsc1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaSAtPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAvLyBXZSByZXR1cm4gdGhlIGNsYXNzaWMgbWVhbmluZyBvZiBcImRpZmZlcmVuY2VcIlxyXG4gIHJldHVybiBhT25seTtcclxufVxyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdhcnJheURpZmZlcmVuY2UnLCBhcnJheURpZmZlcmVuY2UgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFycmF5RGlmZmVyZW5jZTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsUUFBUSxNQUFNLGVBQWU7O0FBRXBDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTQyxlQUFlQSxDQUFLQyxDQUFNLEVBQUVDLENBQU0sRUFBRUMsS0FBVyxFQUFFQyxLQUFXLEVBQUVDLE1BQVksRUFBUTtFQUN6RkMsTUFBTSxJQUFJQSxNQUFNLENBQUVDLEtBQUssQ0FBQ0MsT0FBTyxDQUFFUCxDQUFFLENBQUMsSUFBSVEsQ0FBQyxDQUFDQyxJQUFJLENBQUVULENBQUUsQ0FBQyxDQUFDVSxNQUFNLEtBQUtWLENBQUMsQ0FBQ1UsTUFBTSxFQUFFLG1DQUFvQyxDQUFDO0VBQzlHTCxNQUFNLElBQUlBLE1BQU0sQ0FBRUMsS0FBSyxDQUFDQyxPQUFPLENBQUVOLENBQUUsQ0FBQyxJQUFJTyxDQUFDLENBQUNDLElBQUksQ0FBRVIsQ0FBRSxDQUFDLENBQUNTLE1BQU0sS0FBS1QsQ0FBQyxDQUFDUyxNQUFNLEVBQUUsbUNBQW9DLENBQUM7RUFFOUdSLEtBQUssR0FBR0EsS0FBSyxJQUFJLEVBQUU7RUFDbkJDLEtBQUssR0FBR0EsS0FBSyxJQUFJLEVBQUU7RUFDbkJDLE1BQU0sR0FBR0EsTUFBTSxJQUFJLEVBQUU7RUFFckJDLE1BQU0sSUFBSUEsTUFBTSxDQUFFQyxLQUFLLENBQUNDLE9BQU8sQ0FBRUwsS0FBTSxDQUFDLElBQUlBLEtBQUssQ0FBQ1EsTUFBTSxLQUFLLENBQUUsQ0FBQztFQUNoRUwsTUFBTSxJQUFJQSxNQUFNLENBQUVDLEtBQUssQ0FBQ0MsT0FBTyxDQUFFSixLQUFNLENBQUMsSUFBSUEsS0FBSyxDQUFDTyxNQUFNLEtBQUssQ0FBRSxDQUFDO0VBQ2hFTCxNQUFNLElBQUlBLE1BQU0sQ0FBRUMsS0FBSyxDQUFDQyxPQUFPLENBQUVILE1BQU8sQ0FBQyxJQUFJQSxNQUFNLENBQUNNLE1BQU0sS0FBSyxDQUFFLENBQUM7RUFFbEVKLEtBQUssQ0FBQ0ssU0FBUyxDQUFDQyxJQUFJLENBQUNDLEtBQUssQ0FBRVgsS0FBSyxFQUFFRixDQUFFLENBQUM7RUFDdENNLEtBQUssQ0FBQ0ssU0FBUyxDQUFDQyxJQUFJLENBQUNDLEtBQUssQ0FBRVYsS0FBSyxFQUFFRixDQUFFLENBQUM7RUFFdENhLFNBQVM7RUFBRTtFQUNULEtBQU0sSUFBSUMsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHYixLQUFLLENBQUNRLE1BQU0sRUFBRUssQ0FBQyxFQUFFLEVBQUc7SUFDdkMsTUFBTUMsS0FBSyxHQUFHZCxLQUFLLENBQUVhLENBQUMsQ0FBRTtJQUV4QixLQUFNLElBQUlFLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR2QsS0FBSyxDQUFDTyxNQUFNLEVBQUVPLENBQUMsRUFBRSxFQUFHO01BQ3ZDLE1BQU1DLEtBQUssR0FBR2YsS0FBSyxDQUFFYyxDQUFDLENBQUU7TUFFeEIsSUFBS0QsS0FBSyxLQUFLRSxLQUFLLEVBQUc7UUFDckJkLE1BQU0sQ0FBQ1EsSUFBSSxDQUFFSSxLQUFNLENBQUM7UUFDcEJkLEtBQUssQ0FBQ2lCLE1BQU0sQ0FBRUosQ0FBQyxFQUFFLENBQUUsQ0FBQztRQUNwQlosS0FBSyxDQUFDZ0IsTUFBTSxDQUFFRixDQUFDLEVBQUUsQ0FBRSxDQUFDO1FBQ3BCQSxDQUFDLEdBQUcsQ0FBQztRQUNMLElBQUtGLENBQUMsS0FBS2IsS0FBSyxDQUFDUSxNQUFNLEVBQUc7VUFDeEIsTUFBTUksU0FBUyxDQUFDLENBQUM7UUFDbkI7UUFDQUMsQ0FBQyxJQUFJLENBQUM7TUFDUjtJQUNGO0VBQ0Y7O0VBRUY7RUFDQSxPQUFPYixLQUFLO0FBQ2Q7QUFFQUosUUFBUSxDQUFDc0IsUUFBUSxDQUFFLGlCQUFpQixFQUFFckIsZUFBZ0IsQ0FBQztBQUV2RCxlQUFlQSxlQUFlIiwiaWdub3JlTGlzdCI6W119