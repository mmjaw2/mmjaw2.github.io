// Copyright 2014-2023, University of Colorado Boulder

/**
 * Scans through potential properties on an object to detect prefixed forms, and returns the first match.
 *
 * E.g. currently:
 * phet.phetCore.detectPrefix( document.createElement( 'div' ).style, 'transform' ) === 'webkitTransform'
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import phetCore from './phetCore.js';

// @returns the best String str where obj[str] !== undefined, or returns undefined if that is not available
function detectPrefix(obj, name) {
  // @ts-expect-error
  if (obj[name] !== undefined) {
    return name;
  }

  // prepare for camelCase
  name = name.charAt(0).toUpperCase() + name.slice(1);

  // Chrome planning to not introduce prefixes in the future, hopefully we will be safe
  // @ts-expect-error
  if (obj[`moz${name}`] !== undefined) {
    return `moz${name}`;
  }
  // @ts-expect-error
  if (obj[`Moz${name}`] !== undefined) {
    return `Moz${name}`;
  } // some prefixes seem to have all-caps?
  // @ts-expect-error
  if (obj[`webkit${name}`] !== undefined) {
    return `webkit${name}`;
  }
  // @ts-expect-error
  if (obj[`ms${name}`] !== undefined) {
    return `ms${name}`;
  }
  // @ts-expect-error
  if (obj[`o${name}`] !== undefined) {
    return `o${name}`;
  }
  // @ts-expect-error
  return undefined;
}
phetCore.register('detectPrefix', detectPrefix);
export default detectPrefix;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwaGV0Q29yZSIsImRldGVjdFByZWZpeCIsIm9iaiIsIm5hbWUiLCJ1bmRlZmluZWQiLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJkZXRlY3RQcmVmaXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU2NhbnMgdGhyb3VnaCBwb3RlbnRpYWwgcHJvcGVydGllcyBvbiBhbiBvYmplY3QgdG8gZGV0ZWN0IHByZWZpeGVkIGZvcm1zLCBhbmQgcmV0dXJucyB0aGUgZmlyc3QgbWF0Y2guXHJcbiAqXHJcbiAqIEUuZy4gY3VycmVudGx5OlxyXG4gKiBwaGV0LnBoZXRDb3JlLmRldGVjdFByZWZpeCggZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKS5zdHlsZSwgJ3RyYW5zZm9ybScgKSA9PT0gJ3dlYmtpdFRyYW5zZm9ybSdcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBwaGV0Q29yZSBmcm9tICcuL3BoZXRDb3JlLmpzJztcclxuXHJcbi8vIEByZXR1cm5zIHRoZSBiZXN0IFN0cmluZyBzdHIgd2hlcmUgb2JqW3N0cl0gIT09IHVuZGVmaW5lZCwgb3IgcmV0dXJucyB1bmRlZmluZWQgaWYgdGhhdCBpcyBub3QgYXZhaWxhYmxlXHJcbmZ1bmN0aW9uIGRldGVjdFByZWZpeCggb2JqOiBvYmplY3QsIG5hbWU6IHN0cmluZyApOiBzdHJpbmcge1xyXG5cclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgaWYgKCBvYmpbIG5hbWUgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gbmFtZTsgfVxyXG5cclxuICAvLyBwcmVwYXJlIGZvciBjYW1lbENhc2VcclxuICBuYW1lID0gbmFtZS5jaGFyQXQoIDAgKS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zbGljZSggMSApO1xyXG5cclxuICAvLyBDaHJvbWUgcGxhbm5pbmcgdG8gbm90IGludHJvZHVjZSBwcmVmaXhlcyBpbiB0aGUgZnV0dXJlLCBob3BlZnVsbHkgd2Ugd2lsbCBiZSBzYWZlXHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gIGlmICggb2JqWyBgbW96JHtuYW1lfWAgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gYG1veiR7bmFtZX1gOyB9XHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gIGlmICggb2JqWyBgTW96JHtuYW1lfWAgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gYE1veiR7bmFtZX1gOyB9IC8vIHNvbWUgcHJlZml4ZXMgc2VlbSB0byBoYXZlIGFsbC1jYXBzP1xyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBpZiAoIG9ialsgYHdlYmtpdCR7bmFtZX1gIF0gIT09IHVuZGVmaW5lZCApIHsgcmV0dXJuIGB3ZWJraXQke25hbWV9YDsgfVxyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBpZiAoIG9ialsgYG1zJHtuYW1lfWAgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gYG1zJHtuYW1lfWA7IH1cclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgaWYgKCBvYmpbIGBvJHtuYW1lfWAgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gYG8ke25hbWV9YDsgfVxyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5waGV0Q29yZS5yZWdpc3RlciggJ2RldGVjdFByZWZpeCcsIGRldGVjdFByZWZpeCApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGV0ZWN0UHJlZml4OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxRQUFRLE1BQU0sZUFBZTs7QUFFcEM7QUFDQSxTQUFTQyxZQUFZQSxDQUFFQyxHQUFXLEVBQUVDLElBQVksRUFBVztFQUV6RDtFQUNBLElBQUtELEdBQUcsQ0FBRUMsSUFBSSxDQUFFLEtBQUtDLFNBQVMsRUFBRztJQUFFLE9BQU9ELElBQUk7RUFBRTs7RUFFaEQ7RUFDQUEsSUFBSSxHQUFHQSxJQUFJLENBQUNFLE1BQU0sQ0FBRSxDQUFFLENBQUMsQ0FBQ0MsV0FBVyxDQUFDLENBQUMsR0FBR0gsSUFBSSxDQUFDSSxLQUFLLENBQUUsQ0FBRSxDQUFDOztFQUV2RDtFQUNBO0VBQ0EsSUFBS0wsR0FBRyxDQUFHLE1BQUtDLElBQUssRUFBQyxDQUFFLEtBQUtDLFNBQVMsRUFBRztJQUFFLE9BQVEsTUFBS0QsSUFBSyxFQUFDO0VBQUU7RUFDaEU7RUFDQSxJQUFLRCxHQUFHLENBQUcsTUFBS0MsSUFBSyxFQUFDLENBQUUsS0FBS0MsU0FBUyxFQUFHO0lBQUUsT0FBUSxNQUFLRCxJQUFLLEVBQUM7RUFBRSxDQUFDLENBQUM7RUFDbEU7RUFDQSxJQUFLRCxHQUFHLENBQUcsU0FBUUMsSUFBSyxFQUFDLENBQUUsS0FBS0MsU0FBUyxFQUFHO0lBQUUsT0FBUSxTQUFRRCxJQUFLLEVBQUM7RUFBRTtFQUN0RTtFQUNBLElBQUtELEdBQUcsQ0FBRyxLQUFJQyxJQUFLLEVBQUMsQ0FBRSxLQUFLQyxTQUFTLEVBQUc7SUFBRSxPQUFRLEtBQUlELElBQUssRUFBQztFQUFFO0VBQzlEO0VBQ0EsSUFBS0QsR0FBRyxDQUFHLElBQUdDLElBQUssRUFBQyxDQUFFLEtBQUtDLFNBQVMsRUFBRztJQUFFLE9BQVEsSUFBR0QsSUFBSyxFQUFDO0VBQUU7RUFDNUQ7RUFDQSxPQUFPQyxTQUFTO0FBQ2xCO0FBRUFKLFFBQVEsQ0FBQ1EsUUFBUSxDQUFFLGNBQWMsRUFBRVAsWUFBYSxDQUFDO0FBRWpELGVBQWVBLFlBQVkiLCJpZ25vcmVMaXN0IjpbXX0=