"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2014-2023, University of Colorado Boulder
/* eslint-disable no-useless-concat */

/**
 * Scans through potential event properties on an object to detect prefixed forms, and returns the first match.
 *
 * E.g. currently:
 * phet.phetCore.detectPrefixEvent( document, 'fullscreenchange' ) === 'webkitfullscreenchange'
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// @returns the best String str where obj['on'+str] !== undefined, or returns undefined if that is not available
function detectPrefixEvent(obj, name) {
  // @ts-expect-error
  if (obj["on".concat(name)] !== undefined) {
    return name;
  }

  // Chrome planning to not introduce prefixes in the future, hopefully we will be safe
  // @ts-expect-error
  if (obj["".concat('on' + 'moz').concat(name)] !== undefined) {
    return "moz".concat(name);
  }
  // @ts-expect-error
  if (obj["".concat('on' + 'Moz').concat(name)] !== undefined) {
    return "Moz".concat(name);
  } // some prefixes seem to have all-caps?
  // @ts-expect-error
  if (obj["".concat('on' + 'webkit').concat(name)] !== undefined) {
    return "webkit".concat(name);
  }
  // @ts-expect-error
  if (obj["".concat('on' + 'ms').concat(name)] !== undefined) {
    return "ms".concat(name);
  }
  // @ts-expect-error
  if (obj["".concat('on' + 'o').concat(name)] !== undefined) {
    return "o".concat(name);
  }
  // @ts-expect-error
  return undefined;
}
_phetCore["default"].register('detectPrefixEvent', detectPrefixEvent);
var _default = exports["default"] = detectPrefixEvent;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJkZXRlY3RQcmVmaXhFdmVudCIsIm5hbWUiLCJjb25jYXQiLCJ1bmRlZmluZWQiLCJwaGV0Q29yZSIsInJlZ2lzdGVyIiwiX2RlZmF1bHQiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiZGV0ZWN0UHJlZml4RXZlbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcbi8qIGVzbGludC1kaXNhYmxlIG5vLXVzZWxlc3MtY29uY2F0ICovXHJcblxyXG4vKipcclxuICogU2NhbnMgdGhyb3VnaCBwb3RlbnRpYWwgZXZlbnQgcHJvcGVydGllcyBvbiBhbiBvYmplY3QgdG8gZGV0ZWN0IHByZWZpeGVkIGZvcm1zLCBhbmQgcmV0dXJucyB0aGUgZmlyc3QgbWF0Y2guXHJcbiAqXHJcbiAqIEUuZy4gY3VycmVudGx5OlxyXG4gKiBwaGV0LnBoZXRDb3JlLmRldGVjdFByZWZpeEV2ZW50KCBkb2N1bWVudCwgJ2Z1bGxzY3JlZW5jaGFuZ2UnICkgPT09ICd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlJ1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IHBoZXRDb3JlIGZyb20gJy4vcGhldENvcmUuanMnO1xyXG5cclxuLy8gQHJldHVybnMgdGhlIGJlc3QgU3RyaW5nIHN0ciB3aGVyZSBvYmpbJ29uJytzdHJdICE9PSB1bmRlZmluZWQsIG9yIHJldHVybnMgdW5kZWZpbmVkIGlmIHRoYXQgaXMgbm90IGF2YWlsYWJsZVxyXG5mdW5jdGlvbiBkZXRlY3RQcmVmaXhFdmVudCggb2JqOiBvYmplY3QsIG5hbWU6IHN0cmluZyApOiBzdHJpbmcge1xyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBpZiAoIG9ialsgYG9uJHtuYW1lfWAgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gbmFtZTsgfVxyXG5cclxuICAvLyBDaHJvbWUgcGxhbm5pbmcgdG8gbm90IGludHJvZHVjZSBwcmVmaXhlcyBpbiB0aGUgZnV0dXJlLCBob3BlZnVsbHkgd2Ugd2lsbCBiZSBzYWZlXHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gIGlmICggb2JqWyBgJHsnb24nICsgJ21veid9JHtuYW1lfWAgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gYG1veiR7bmFtZX1gOyB9XHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gIGlmICggb2JqWyBgJHsnb24nICsgJ01veid9JHtuYW1lfWAgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gYE1veiR7bmFtZX1gOyB9IC8vIHNvbWUgcHJlZml4ZXMgc2VlbSB0byBoYXZlIGFsbC1jYXBzP1xyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBpZiAoIG9ialsgYCR7J29uJyArICd3ZWJraXQnfSR7bmFtZX1gIF0gIT09IHVuZGVmaW5lZCApIHsgcmV0dXJuIGB3ZWJraXQke25hbWV9YDsgfVxyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBpZiAoIG9ialsgYCR7J29uJyArICdtcyd9JHtuYW1lfWAgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gYG1zJHtuYW1lfWA7IH1cclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgaWYgKCBvYmpbIGAkeydvbicgKyAnbyd9JHtuYW1lfWAgXSAhPT0gdW5kZWZpbmVkICkgeyByZXR1cm4gYG8ke25hbWV9YDsgfVxyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5waGV0Q29yZS5yZWdpc3RlciggJ2RldGVjdFByZWZpeEV2ZW50JywgZGV0ZWN0UHJlZml4RXZlbnQgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRldGVjdFByZWZpeEV2ZW50OyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBWUEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQXFDLFNBQUFELHVCQUFBRSxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsZ0JBQUFBLEdBQUE7QUFackM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUlBO0FBQ0EsU0FBU0UsaUJBQWlCQSxDQUFFRixHQUFXLEVBQUVHLElBQVksRUFBVztFQUM5RDtFQUNBLElBQUtILEdBQUcsTUFBQUksTUFBQSxDQUFPRCxJQUFJLEVBQUksS0FBS0UsU0FBUyxFQUFHO0lBQUUsT0FBT0YsSUFBSTtFQUFFOztFQUV2RDtFQUNBO0VBQ0EsSUFBS0gsR0FBRyxJQUFBSSxNQUFBLENBQUssSUFBSSxHQUFHLEtBQUssRUFBQUEsTUFBQSxDQUFHRCxJQUFJLEVBQUksS0FBS0UsU0FBUyxFQUFHO0lBQUUsYUFBQUQsTUFBQSxDQUFhRCxJQUFJO0VBQUk7RUFDNUU7RUFDQSxJQUFLSCxHQUFHLElBQUFJLE1BQUEsQ0FBSyxJQUFJLEdBQUcsS0FBSyxFQUFBQSxNQUFBLENBQUdELElBQUksRUFBSSxLQUFLRSxTQUFTLEVBQUc7SUFBRSxhQUFBRCxNQUFBLENBQWFELElBQUk7RUFBSSxDQUFDLENBQUM7RUFDOUU7RUFDQSxJQUFLSCxHQUFHLElBQUFJLE1BQUEsQ0FBSyxJQUFJLEdBQUcsUUFBUSxFQUFBQSxNQUFBLENBQUdELElBQUksRUFBSSxLQUFLRSxTQUFTLEVBQUc7SUFBRSxnQkFBQUQsTUFBQSxDQUFnQkQsSUFBSTtFQUFJO0VBQ2xGO0VBQ0EsSUFBS0gsR0FBRyxJQUFBSSxNQUFBLENBQUssSUFBSSxHQUFHLElBQUksRUFBQUEsTUFBQSxDQUFHRCxJQUFJLEVBQUksS0FBS0UsU0FBUyxFQUFHO0lBQUUsWUFBQUQsTUFBQSxDQUFZRCxJQUFJO0VBQUk7RUFDMUU7RUFDQSxJQUFLSCxHQUFHLElBQUFJLE1BQUEsQ0FBSyxJQUFJLEdBQUcsR0FBRyxFQUFBQSxNQUFBLENBQUdELElBQUksRUFBSSxLQUFLRSxTQUFTLEVBQUc7SUFBRSxXQUFBRCxNQUFBLENBQVdELElBQUk7RUFBSTtFQUN4RTtFQUNBLE9BQU9FLFNBQVM7QUFDbEI7QUFFQUMsb0JBQVEsQ0FBQ0MsUUFBUSxDQUFFLG1CQUFtQixFQUFFTCxpQkFBa0IsQ0FBQztBQUFDLElBQUFNLFFBQUEsR0FBQUMsT0FBQSxjQUU3Q1AsaUJBQWlCIiwiaWdub3JlTGlzdCI6W119