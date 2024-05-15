// Copyright 2015-2024, University of Colorado Boulder

/**
 * For debugging or usage in the console, Namespace associates modules with a namespaced global for use in the browser.
 * This does not work in Node.js.
 *
 * @author Jonathan Olson
 * @author Chris Malley (PixelZoom, Inc.)
 */

import isHMR from './isHMR.js';
class Namespace {
  constructor(name) {
    this.name = name;

    // Unsupported in Node.js
    if (typeof window === 'undefined') {
      return;
    }
    if (window.phet) {
      // We already create the chipper namespace, so we just attach to it with the register function.
      if (name === 'chipper') {
        window.phet.chipper.name = 'chipper';
        window.phet.chipper.register = this.register.bind(window.phet.chipper);
        return window.phet.chipper; // eslint-disable-line -- we want to provide the namespace API on something already existing
      } else {
        /* TODO: Ideally we should always assert this, but in PhET-iO wrapper code, multiple built modules define the
           TODO: same namespace, this should be fixed in https://github.com/phetsims/phet-io-wrappers/issues/631 */
        const ignoreAssertion = !_.hasIn(window, 'phet.chipper.brand');
        assert && !ignoreAssertion && assert(!window.phet[name], `namespace ${name} already exists`);
        window.phet[name] = this;
      }
    }
  }

  /**
   * Registers a key-value pair with the namespace.
   *
   * If there are no dots ('.') in the key, it will be assigned to the namespace. For example:
   * - x.register( 'A', A );
   * will set x.A = A.
   *
   * If the key contains one or more dots ('.'), it's treated somewhat like a path expression. For instance, if the
   * following is called:
   * - x.register( 'A.B.C', C );
   * then the register function will navigate to the object x.A.B and add x.A.B.C = C.
   */
  register(key, value) {
    // Unsupported in Node.js
    if (typeof window === 'undefined') {
      return value;
    }

    // When using hot module replacement, a module will be loaded and initialized twice, and hence its namespace.register
    // function will be called twice.  This should not be an assertion error.

    // If the key isn't compound (doesn't contain '.'), we can just look it up on this namespace
    if (key.includes('.')) {
      if (!isHMR) {
        // @ts-expect-error
        assert && assert(!this[key], `${key} is already registered for namespace ${this.name}`);
      }

      // @ts-expect-error
      this[key] = value;
    }
    // Compound (contains '.' at least once). x.register( 'A.B.C', C ) should set x.A.B.C.
    else {
      const keys = key.split('.'); // e.g. [ 'A', 'B', 'C' ]

      // Walk into the namespace, verifying that each level exists. e.g. parent => x.A.B
      let parent = this; // eslint-disable-line consistent-this, @typescript-eslint/no-this-alias
      for (let i = 0; i < keys.length - 1; i++) {
        // for all but the last key

        if (!isHMR) {
          // @ts-expect-error
          assert && assert(!!parent[keys[i]], `${[this.name].concat(keys.slice(0, i + 1)).join('.')} needs to be defined to register ${key}`);
        }

        // @ts-expect-error
        parent = parent[keys[i]];
      }

      // Write into the inner namespace, e.g. x.A.B[ 'C' ] = C
      const lastKey = keys[keys.length - 1];
      if (!isHMR) {
        // @ts-expect-error
        assert && assert(!parent[lastKey], `${key} is already registered for namespace ${this.name}`);
      }

      // @ts-expect-error
      parent[lastKey] = value;
    }
    return value;
  }
}
export default Namespace;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJpc0hNUiIsIk5hbWVzcGFjZSIsImNvbnN0cnVjdG9yIiwibmFtZSIsIndpbmRvdyIsInBoZXQiLCJjaGlwcGVyIiwicmVnaXN0ZXIiLCJiaW5kIiwiaWdub3JlQXNzZXJ0aW9uIiwiXyIsImhhc0luIiwiYXNzZXJ0Iiwia2V5IiwidmFsdWUiLCJpbmNsdWRlcyIsImtleXMiLCJzcGxpdCIsInBhcmVudCIsImkiLCJsZW5ndGgiLCJjb25jYXQiLCJzbGljZSIsImpvaW4iLCJsYXN0S2V5Il0sInNvdXJjZXMiOlsiTmFtZXNwYWNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE1LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEZvciBkZWJ1Z2dpbmcgb3IgdXNhZ2UgaW4gdGhlIGNvbnNvbGUsIE5hbWVzcGFjZSBhc3NvY2lhdGVzIG1vZHVsZXMgd2l0aCBhIG5hbWVzcGFjZWQgZ2xvYmFsIGZvciB1c2UgaW4gdGhlIGJyb3dzZXIuXHJcbiAqIFRoaXMgZG9lcyBub3Qgd29yayBpbiBOb2RlLmpzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IGlzSE1SIGZyb20gJy4vaXNITVIuanMnO1xyXG5cclxuY2xhc3MgTmFtZXNwYWNlIHtcclxuICBwdWJsaWMgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIG5hbWU6IHN0cmluZyApIHtcclxuXHJcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG5cclxuICAgIC8vIFVuc3VwcG9ydGVkIGluIE5vZGUuanNcclxuICAgIGlmICggdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHdpbmRvdy5waGV0ICkge1xyXG4gICAgICAvLyBXZSBhbHJlYWR5IGNyZWF0ZSB0aGUgY2hpcHBlciBuYW1lc3BhY2UsIHNvIHdlIGp1c3QgYXR0YWNoIHRvIGl0IHdpdGggdGhlIHJlZ2lzdGVyIGZ1bmN0aW9uLlxyXG4gICAgICBpZiAoIG5hbWUgPT09ICdjaGlwcGVyJyApIHtcclxuICAgICAgICB3aW5kb3cucGhldC5jaGlwcGVyLm5hbWUgPSAnY2hpcHBlcic7XHJcbiAgICAgICAgd2luZG93LnBoZXQuY2hpcHBlci5yZWdpc3RlciA9IHRoaXMucmVnaXN0ZXIuYmluZCggd2luZG93LnBoZXQuY2hpcHBlciApO1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cucGhldC5jaGlwcGVyOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIC0tIHdlIHdhbnQgdG8gcHJvdmlkZSB0aGUgbmFtZXNwYWNlIEFQSSBvbiBzb21ldGhpbmcgYWxyZWFkeSBleGlzdGluZ1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIC8qIFRPRE86IElkZWFsbHkgd2Ugc2hvdWxkIGFsd2F5cyBhc3NlcnQgdGhpcywgYnV0IGluIFBoRVQtaU8gd3JhcHBlciBjb2RlLCBtdWx0aXBsZSBidWlsdCBtb2R1bGVzIGRlZmluZSB0aGVcclxuICAgICAgICAgICBUT0RPOiBzYW1lIG5hbWVzcGFjZSwgdGhpcyBzaG91bGQgYmUgZml4ZWQgaW4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW8td3JhcHBlcnMvaXNzdWVzLzYzMSAqL1xyXG4gICAgICAgIGNvbnN0IGlnbm9yZUFzc2VydGlvbiA9ICFfLmhhc0luKCB3aW5kb3csICdwaGV0LmNoaXBwZXIuYnJhbmQnICk7XHJcbiAgICAgICAgYXNzZXJ0ICYmICFpZ25vcmVBc3NlcnRpb24gJiYgYXNzZXJ0KCAhd2luZG93LnBoZXRbIG5hbWUgXSwgYG5hbWVzcGFjZSAke25hbWV9IGFscmVhZHkgZXhpc3RzYCApO1xyXG4gICAgICAgIHdpbmRvdy5waGV0WyBuYW1lIF0gPSB0aGlzO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWdpc3RlcnMgYSBrZXktdmFsdWUgcGFpciB3aXRoIHRoZSBuYW1lc3BhY2UuXHJcbiAgICpcclxuICAgKiBJZiB0aGVyZSBhcmUgbm8gZG90cyAoJy4nKSBpbiB0aGUga2V5LCBpdCB3aWxsIGJlIGFzc2lnbmVkIHRvIHRoZSBuYW1lc3BhY2UuIEZvciBleGFtcGxlOlxyXG4gICAqIC0geC5yZWdpc3RlciggJ0EnLCBBICk7XHJcbiAgICogd2lsbCBzZXQgeC5BID0gQS5cclxuICAgKlxyXG4gICAqIElmIHRoZSBrZXkgY29udGFpbnMgb25lIG9yIG1vcmUgZG90cyAoJy4nKSwgaXQncyB0cmVhdGVkIHNvbWV3aGF0IGxpa2UgYSBwYXRoIGV4cHJlc3Npb24uIEZvciBpbnN0YW5jZSwgaWYgdGhlXHJcbiAgICogZm9sbG93aW5nIGlzIGNhbGxlZDpcclxuICAgKiAtIHgucmVnaXN0ZXIoICdBLkIuQycsIEMgKTtcclxuICAgKiB0aGVuIHRoZSByZWdpc3RlciBmdW5jdGlvbiB3aWxsIG5hdmlnYXRlIHRvIHRoZSBvYmplY3QgeC5BLkIgYW5kIGFkZCB4LkEuQi5DID0gQy5cclxuICAgKi9cclxuICBwdWJsaWMgcmVnaXN0ZXI8VD4oIGtleTogc3RyaW5nLCB2YWx1ZTogVCApOiBUIHtcclxuXHJcbiAgICAvLyBVbnN1cHBvcnRlZCBpbiBOb2RlLmpzXHJcbiAgICBpZiAoIHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnICkge1xyXG4gICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gV2hlbiB1c2luZyBob3QgbW9kdWxlIHJlcGxhY2VtZW50LCBhIG1vZHVsZSB3aWxsIGJlIGxvYWRlZCBhbmQgaW5pdGlhbGl6ZWQgdHdpY2UsIGFuZCBoZW5jZSBpdHMgbmFtZXNwYWNlLnJlZ2lzdGVyXHJcbiAgICAvLyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB0d2ljZS4gIFRoaXMgc2hvdWxkIG5vdCBiZSBhbiBhc3NlcnRpb24gZXJyb3IuXHJcblxyXG4gICAgLy8gSWYgdGhlIGtleSBpc24ndCBjb21wb3VuZCAoZG9lc24ndCBjb250YWluICcuJyksIHdlIGNhbiBqdXN0IGxvb2sgaXQgdXAgb24gdGhpcyBuYW1lc3BhY2VcclxuICAgIGlmICgga2V5LmluY2x1ZGVzKCAnLicgKSApIHtcclxuICAgICAgaWYgKCAhaXNITVIgKSB7XHJcblxyXG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpc1sga2V5IF0sIGAke2tleX0gaXMgYWxyZWFkeSByZWdpc3RlcmVkIGZvciBuYW1lc3BhY2UgJHt0aGlzLm5hbWV9YCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgIHRoaXNbIGtleSBdID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICAvLyBDb21wb3VuZCAoY29udGFpbnMgJy4nIGF0IGxlYXN0IG9uY2UpLiB4LnJlZ2lzdGVyKCAnQS5CLkMnLCBDICkgc2hvdWxkIHNldCB4LkEuQi5DLlxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvbnN0IGtleXMgPSBrZXkuc3BsaXQoICcuJyApOyAvLyBlLmcuIFsgJ0EnLCAnQicsICdDJyBdXHJcblxyXG4gICAgICAvLyBXYWxrIGludG8gdGhlIG5hbWVzcGFjZSwgdmVyaWZ5aW5nIHRoYXQgZWFjaCBsZXZlbCBleGlzdHMuIGUuZy4gcGFyZW50ID0+IHguQS5CXHJcbiAgICAgIGxldCBwYXJlbnQgPSB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbnNpc3RlbnQtdGhpcywgQHR5cGVzY3JpcHQtZXNsaW50L25vLXRoaXMtYWxpYXNcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGggLSAxOyBpKysgKSB7IC8vIGZvciBhbGwgYnV0IHRoZSBsYXN0IGtleVxyXG5cclxuICAgICAgICBpZiAoICFpc0hNUiApIHtcclxuICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoICEhcGFyZW50WyBrZXlzWyBpIF0gXSxcclxuICAgICAgICAgICAgYCR7WyB0aGlzLm5hbWUgXS5jb25jYXQoIGtleXMuc2xpY2UoIDAsIGkgKyAxICkgKS5qb2luKCAnLicgKX0gbmVlZHMgdG8gYmUgZGVmaW5lZCB0byByZWdpc3RlciAke2tleX1gICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgICAgcGFyZW50ID0gcGFyZW50WyBrZXlzWyBpIF0gXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gV3JpdGUgaW50byB0aGUgaW5uZXIgbmFtZXNwYWNlLCBlLmcuIHguQS5CWyAnQycgXSA9IENcclxuICAgICAgY29uc3QgbGFzdEtleSA9IGtleXNbIGtleXMubGVuZ3RoIC0gMSBdO1xyXG5cclxuICAgICAgaWYgKCAhaXNITVIgKSB7XHJcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoICFwYXJlbnRbIGxhc3RLZXkgXSwgYCR7a2V5fSBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQgZm9yIG5hbWVzcGFjZSAke3RoaXMubmFtZX1gICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgcGFyZW50WyBsYXN0S2V5IF0gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBOYW1lc3BhY2U7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxLQUFLLE1BQU0sWUFBWTtBQUU5QixNQUFNQyxTQUFTLENBQUM7RUFHUEMsV0FBV0EsQ0FBRUMsSUFBWSxFQUFHO0lBRWpDLElBQUksQ0FBQ0EsSUFBSSxHQUFHQSxJQUFJOztJQUVoQjtJQUNBLElBQUssT0FBT0MsTUFBTSxLQUFLLFdBQVcsRUFBRztNQUNuQztJQUNGO0lBRUEsSUFBS0EsTUFBTSxDQUFDQyxJQUFJLEVBQUc7TUFDakI7TUFDQSxJQUFLRixJQUFJLEtBQUssU0FBUyxFQUFHO1FBQ3hCQyxNQUFNLENBQUNDLElBQUksQ0FBQ0MsT0FBTyxDQUFDSCxJQUFJLEdBQUcsU0FBUztRQUNwQ0MsTUFBTSxDQUFDQyxJQUFJLENBQUNDLE9BQU8sQ0FBQ0MsUUFBUSxHQUFHLElBQUksQ0FBQ0EsUUFBUSxDQUFDQyxJQUFJLENBQUVKLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDQyxPQUFRLENBQUM7UUFDeEUsT0FBT0YsTUFBTSxDQUFDQyxJQUFJLENBQUNDLE9BQU8sQ0FBQyxDQUFDO01BQzlCLENBQUMsTUFDSTtRQUNIO0FBQ1I7UUFDUSxNQUFNRyxlQUFlLEdBQUcsQ0FBQ0MsQ0FBQyxDQUFDQyxLQUFLLENBQUVQLE1BQU0sRUFBRSxvQkFBcUIsQ0FBQztRQUNoRVEsTUFBTSxJQUFJLENBQUNILGVBQWUsSUFBSUcsTUFBTSxDQUFFLENBQUNSLE1BQU0sQ0FBQ0MsSUFBSSxDQUFFRixJQUFJLENBQUUsRUFBRyxhQUFZQSxJQUFLLGlCQUFpQixDQUFDO1FBQ2hHQyxNQUFNLENBQUNDLElBQUksQ0FBRUYsSUFBSSxDQUFFLEdBQUcsSUFBSTtNQUM1QjtJQUNGO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NJLFFBQVFBLENBQUtNLEdBQVcsRUFBRUMsS0FBUSxFQUFNO0lBRTdDO0lBQ0EsSUFBSyxPQUFPVixNQUFNLEtBQUssV0FBVyxFQUFHO01BQ25DLE9BQU9VLEtBQUs7SUFDZDs7SUFFQTtJQUNBOztJQUVBO0lBQ0EsSUFBS0QsR0FBRyxDQUFDRSxRQUFRLENBQUUsR0FBSSxDQUFDLEVBQUc7TUFDekIsSUFBSyxDQUFDZixLQUFLLEVBQUc7UUFFWjtRQUNBWSxNQUFNLElBQUlBLE1BQU0sQ0FBRSxDQUFDLElBQUksQ0FBRUMsR0FBRyxDQUFFLEVBQUcsR0FBRUEsR0FBSSx3Q0FBdUMsSUFBSSxDQUFDVixJQUFLLEVBQUUsQ0FBQztNQUM3Rjs7TUFFQTtNQUNBLElBQUksQ0FBRVUsR0FBRyxDQUFFLEdBQUdDLEtBQUs7SUFDckI7SUFDQTtJQUFBLEtBQ0s7TUFDSCxNQUFNRSxJQUFJLEdBQUdILEdBQUcsQ0FBQ0ksS0FBSyxDQUFFLEdBQUksQ0FBQyxDQUFDLENBQUM7O01BRS9CO01BQ0EsSUFBSUMsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDO01BQ25CLEtBQU0sSUFBSUMsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHSCxJQUFJLENBQUNJLE1BQU0sR0FBRyxDQUFDLEVBQUVELENBQUMsRUFBRSxFQUFHO1FBQUU7O1FBRTVDLElBQUssQ0FBQ25CLEtBQUssRUFBRztVQUNaO1VBQ0FZLE1BQU0sSUFBSUEsTUFBTSxDQUFFLENBQUMsQ0FBQ00sTUFBTSxDQUFFRixJQUFJLENBQUVHLENBQUMsQ0FBRSxDQUFFLEVBQ3BDLEdBQUUsQ0FBRSxJQUFJLENBQUNoQixJQUFJLENBQUUsQ0FBQ2tCLE1BQU0sQ0FBRUwsSUFBSSxDQUFDTSxLQUFLLENBQUUsQ0FBQyxFQUFFSCxDQUFDLEdBQUcsQ0FBRSxDQUFFLENBQUMsQ0FBQ0ksSUFBSSxDQUFFLEdBQUksQ0FBRSxvQ0FBbUNWLEdBQUksRUFBRSxDQUFDO1FBQzVHOztRQUVBO1FBQ0FLLE1BQU0sR0FBR0EsTUFBTSxDQUFFRixJQUFJLENBQUVHLENBQUMsQ0FBRSxDQUFFO01BQzlCOztNQUVBO01BQ0EsTUFBTUssT0FBTyxHQUFHUixJQUFJLENBQUVBLElBQUksQ0FBQ0ksTUFBTSxHQUFHLENBQUMsQ0FBRTtNQUV2QyxJQUFLLENBQUNwQixLQUFLLEVBQUc7UUFDWjtRQUNBWSxNQUFNLElBQUlBLE1BQU0sQ0FBRSxDQUFDTSxNQUFNLENBQUVNLE9BQU8sQ0FBRSxFQUFHLEdBQUVYLEdBQUksd0NBQXVDLElBQUksQ0FBQ1YsSUFBSyxFQUFFLENBQUM7TUFDbkc7O01BRUE7TUFDQWUsTUFBTSxDQUFFTSxPQUFPLENBQUUsR0FBR1YsS0FBSztJQUMzQjtJQUVBLE9BQU9BLEtBQUs7RUFDZDtBQUNGO0FBRUEsZUFBZWIsU0FBUyIsImlnbm9yZUxpc3QiOltdfQ==