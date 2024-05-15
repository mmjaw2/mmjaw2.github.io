"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2014-2023, University of Colorado Boulder

/**
 * Scans through potential properties on an object to detect prefixed forms, and returns the first match.
 *
 * E.g. currently:
 * phet.phetCore.detectPrefix( document.createElement( 'div' ).style, 'transform' ) === 'webkitTransform'
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

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
  if (obj["moz".concat(name)] !== undefined) {
    return "moz".concat(name);
  }
  // @ts-expect-error
  if (obj["Moz".concat(name)] !== undefined) {
    return "Moz".concat(name);
  } // some prefixes seem to have all-caps?
  // @ts-expect-error
  if (obj["webkit".concat(name)] !== undefined) {
    return "webkit".concat(name);
  }
  // @ts-expect-error
  if (obj["ms".concat(name)] !== undefined) {
    return "ms".concat(name);
  }
  // @ts-expect-error
  if (obj["o".concat(name)] !== undefined) {
    return "o".concat(name);
  }
  // @ts-expect-error
  return undefined;
}
_phetCore["default"].register('detectPrefix', detectPrefix);
var _default = exports["default"] = detectPrefix;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJkZXRlY3RQcmVmaXgiLCJuYW1lIiwidW5kZWZpbmVkIiwiY2hhckF0IiwidG9VcHBlckNhc2UiLCJzbGljZSIsImNvbmNhdCIsInBoZXRDb3JlIiwicmVnaXN0ZXIiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyJkZXRlY3RQcmVmaXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU2NhbnMgdGhyb3VnaCBwb3RlbnRpYWwgcHJvcGVydGllcyBvbiBhbiBvYmplY3QgdG8gZGV0ZWN0IHByZWZpeGVkIGZvcm1zLCBhbmQgcmV0dXJucyB0aGUgZmlyc3QgbWF0Y2guXHJcbiAqXHJcbiAqIEUuZy4gY3VycmVudGx5OlxyXG4gKiBwaGV0LnBoZXRDb3JlLmRldGVjdFByZWZpeCggZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKS5zdHlsZSwgJ3RyYW5zZm9ybScgKSA9PT0gJ3dlYmtpdFRyYW5zZm9ybSdcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBwaGV0Q29yZSBmcm9tICcuL3BoZXRDb3JlLmpzJztcclxuXHJcbi8vIEByZXR1cm5zIHRoZSBiZXN0IFN0cmluZyBzdHIgd2hlcmUgb2JqW3N0cl0gIT09IHVuZGVmaW5lZCwgb3IgcmV0dXJucyB1bmRlZmluZWQgaWYgdGhhdCBpcyBub3QgYXZhaWxhYmxlXHJcbmZ1bmN0aW9uIGRldGVjdFByZWZpeCggb2JqOiBvYmplY3QsIG5hbWU6IHN0cmluZyApOiBzdHJpbmcge1xyXG5cclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgaWYgKCBvYmpbIG5hbWUgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gbmFtZTsgfVxyXG5cclxuICAvLyBwcmVwYXJlIGZvciBjYW1lbENhc2VcclxuICBuYW1lID0gbmFtZS5jaGFyQXQoIDAgKS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zbGljZSggMSApO1xyXG5cclxuICAvLyBDaHJvbWUgcGxhbm5pbmcgdG8gbm90IGludHJvZHVjZSBwcmVmaXhlcyBpbiB0aGUgZnV0dXJlLCBob3BlZnVsbHkgd2Ugd2lsbCBiZSBzYWZlXHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gIGlmICggb2JqWyBgbW96JHtuYW1lfWAgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gYG1veiR7bmFtZX1gOyB9XHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gIGlmICggb2JqWyBgTW96JHtuYW1lfWAgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gYE1veiR7bmFtZX1gOyB9IC8vIHNvbWUgcHJlZml4ZXMgc2VlbSB0byBoYXZlIGFsbC1jYXBzP1xyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBpZiAoIG9ialsgYHdlYmtpdCR7bmFtZX1gIF0gIT09IHVuZGVmaW5lZCApIHsgcmV0dXJuIGB3ZWJraXQke25hbWV9YDsgfVxyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBpZiAoIG9ialsgYG1zJHtuYW1lfWAgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gYG1zJHtuYW1lfWA7IH1cclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgaWYgKCBvYmpbIGBvJHtuYW1lfWAgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gYG8ke25hbWV9YDsgfVxyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5waGV0Q29yZS5yZWdpc3RlciggJ2RldGVjdFByZWZpeCcsIGRldGVjdFByZWZpeCApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGV0ZWN0UHJlZml4OyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBV0EsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQXFDLFNBQUFELHVCQUFBRSxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsZ0JBQUFBLEdBQUE7QUFYckM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFJQTtBQUNBLFNBQVNFLFlBQVlBLENBQUVGLEdBQVcsRUFBRUcsSUFBWSxFQUFXO0VBRXpEO0VBQ0EsSUFBS0gsR0FBRyxDQUFFRyxJQUFJLENBQUUsS0FBS0MsU0FBUyxFQUFHO0lBQUUsT0FBT0QsSUFBSTtFQUFFOztFQUVoRDtFQUNBQSxJQUFJLEdBQUdBLElBQUksQ0FBQ0UsTUFBTSxDQUFFLENBQUUsQ0FBQyxDQUFDQyxXQUFXLENBQUMsQ0FBQyxHQUFHSCxJQUFJLENBQUNJLEtBQUssQ0FBRSxDQUFFLENBQUM7O0VBRXZEO0VBQ0E7RUFDQSxJQUFLUCxHQUFHLE9BQUFRLE1BQUEsQ0FBUUwsSUFBSSxFQUFJLEtBQUtDLFNBQVMsRUFBRztJQUFFLGFBQUFJLE1BQUEsQ0FBYUwsSUFBSTtFQUFJO0VBQ2hFO0VBQ0EsSUFBS0gsR0FBRyxPQUFBUSxNQUFBLENBQVFMLElBQUksRUFBSSxLQUFLQyxTQUFTLEVBQUc7SUFBRSxhQUFBSSxNQUFBLENBQWFMLElBQUk7RUFBSSxDQUFDLENBQUM7RUFDbEU7RUFDQSxJQUFLSCxHQUFHLFVBQUFRLE1BQUEsQ0FBV0wsSUFBSSxFQUFJLEtBQUtDLFNBQVMsRUFBRztJQUFFLGdCQUFBSSxNQUFBLENBQWdCTCxJQUFJO0VBQUk7RUFDdEU7RUFDQSxJQUFLSCxHQUFHLE1BQUFRLE1BQUEsQ0FBT0wsSUFBSSxFQUFJLEtBQUtDLFNBQVMsRUFBRztJQUFFLFlBQUFJLE1BQUEsQ0FBWUwsSUFBSTtFQUFJO0VBQzlEO0VBQ0EsSUFBS0gsR0FBRyxLQUFBUSxNQUFBLENBQU1MLElBQUksRUFBSSxLQUFLQyxTQUFTLEVBQUc7SUFBRSxXQUFBSSxNQUFBLENBQVdMLElBQUk7RUFBSTtFQUM1RDtFQUNBLE9BQU9DLFNBQVM7QUFDbEI7QUFFQUssb0JBQVEsQ0FBQ0MsUUFBUSxDQUFFLGNBQWMsRUFBRVIsWUFBYSxDQUFDO0FBQUMsSUFBQVMsUUFBQSxHQUFBQyxPQUFBLGNBRW5DVixZQUFZIiwiaWdub3JlTGlzdCI6W119