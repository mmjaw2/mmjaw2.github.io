"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
// Copyright 2015-2023, University of Colorado Boulder

/**
 * String utilities used throughout chipper.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

/* eslint-env node */

var assert = require('assert');
var _ = require('lodash');

// What divides the repo prefix from the rest of the string key, like `FRICTION/friction.title`
var NAMESPACE_PREFIX_DIVIDER = '/';
var A11Y_MARKER = 'a11y.';
var ChipperStringUtils = {
  /**
   * Pad LTR/RTL language values with unicode embedding marks (see https://github.com/phetsims/joist/issues/152)
   * Uses directional formatting characters: http://unicode.org/reports/tr9/#Directional_Formatting_Characters
   *
   * @param {string} str
   * @param {boolean} isRTL
   * @returns {string} the input string padded with the embedding marks, or an empty string if the input was empty
   */
  addDirectionalFormatting: function addDirectionalFormatting(str, isRTL) {
    if (str.length > 0) {
      return "".concat((isRTL ? "\u202B" : "\u202A") + str, "\u202C");
    } else {
      return str;
    }
  },
  /**
   * Appends spaces to a string
   *
   * @param {string} str - the input string
   * @param {number} n - number of spaces to append
   * @returns {string} a new string
   */
  padString: function padString(str, n) {
    while (str.length < n) {
      str += ' ';
    }
    return str;
  },
  /**
   * Replaces all occurrences of {string} find with {string} replace in {string} str
   *
   * @param {string} str - the input string
   * @param {string} find - the string to find
   * @param {string} replaceWith - the string to replace find with
   * @returns {string} a new string
   */
  replaceAll: function replaceAll(str, find, replaceWith) {
    return str.replace(new RegExp(find.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replaceWith);
  },
  // TODO chipper#316 determine why this behaves differently than str.replace for some cases (eg, 'MAIN_INLINE_JAVASCRIPT')
  /**
   * Replaces the first occurrence of {string} find with {string} replaceWith in {string} str
   *
   * @param {string} str - the input string
   * @param {string} find - the string to find
   * @param {string} replaceWith - the string to replace find with
   * @returns {string} a new string
   */
  replaceFirst: function replaceFirst(str, find, replaceWith) {
    var idx = str.indexOf(find);
    if (str.indexOf(find) !== -1) {
      return str.slice(0, idx) + replaceWith + str.slice(idx + find.length);
    } else {
      return str;
    }
  },
  /**
   * Returns a string with all of the keys of the mapping replaced with the values.
   * @public
   *
   * @param {string} str
   * @param {Object} mapping
   * @returns {string}
   */
  replacePlaceholders: function replacePlaceholders(str, mapping) {
    Object.keys(mapping).forEach(function (key) {
      var replacement = mapping[key];
      key = "{{".concat(key, "}}");
      var index;
      while ((index = str.indexOf(key)) >= 0) {
        str = str.slice(0, index) + replacement + str.slice(index + key.length);
      }
    });
    Object.keys(mapping).forEach(function (key) {
      if (str.indexOf("{{".concat(key, "}}")) >= 0) {
        throw new Error("Template string detected in placeholders: ".concat(key, "\n\n").concat(str.slice(0, str.indexOf("{{".concat(key, "}}")) + 10)));
      }
    });
    return str;
  },
  /**
   * Recurse through a string file and format each string value appropriately
   * @param {StringMap} stringMap
   * @param {boolean} isRTL - is right to left language
   * @param {boolean} [assertNoWhitespace] - when true, assert that trimming each string value doesn't change the string.
   * @public
   */
  formatStringValues: function formatStringValues(stringMap, isRTL, assertNoWhitespace) {
    ChipperStringUtils.forEachString(stringMap, function (key, stringObject) {
      assert && assertNoWhitespace && assert(stringObject.value === stringObject.value.trim(), "String should not have trailing or leading whitespace, key: ".concat(key, ", value: \"").concat(stringObject.value, "\""));

      // remove leading/trailing whitespace, see chipper#619. Do this before addDirectionalFormatting
      stringObject.value = ChipperStringUtils.addDirectionalFormatting(stringObject.value.trim(), isRTL);
    });
  },
  /**
   * Given a key, get the appropriate string from the "map" object, or null if the key does not appear in the map.
   * This method is called in unbuilt mode from the string plugin and during the build via CHIPPER/getStringMap.
   * This method supports recursing through keys that support string nesting. This method was created to support
   * nested string keys in https://github.com/phetsims/rosetta/issues/193
   * @param {StringMap} map - where an "intermediate" Object should hold nested strings
   * @param {string} key - like `FRICTION/friction.title` or using nesting like `a11y.nested.string.here`
   * @returns {Object|null} - the string entry of the key, or null if the key does not appear in the map
   * @throws  {Error} - if the key doesn't hold a string value in the map
   * @public
   */
  getStringEntryFromMap: function getStringEntryFromMap(map, key) {
    if (key.indexOf(NAMESPACE_PREFIX_DIVIDER) >= 0) {
      throw new Error('getStringEntryFromMap key should not have REPO/');
    }

    // Lodash gives precedence to  "key1.key2" over "key1:{key2}", so we do too.
    var result = _.at(map, key)[0];
    if (result) {
      if (result.value === undefined) {
        throw new Error("no value for string: ".concat(key));
      }
      if (typeof result.value !== 'string') {
        throw new Error("value should be a string for key ".concat(key));
      }

      // Until rosetta supports nested strings in https://github.com/phetsims/rosetta/issues/215, keep this assertion.
      // This should be after because the above errors are more specific. This is better as a fallback.
      assert && !ChipperStringUtils.isA11yStringKey(key) && assert(map[key], "nested strings are not allowed outside of a11y string object for key: ".concat(key));
      return result;
    }

    // They key does not appear in the map
    return null;
  },
  /**
   * @public
   * @param {string} key - without "string!REPO" at the beginning, just the actual "string key"
   * @returns {boolean}
   */
  isA11yStringKey: function isA11yStringKey(key) {
    return key.indexOf(ChipperStringUtils.A11Y_MARKER) === 0;
  },
  /**
   * The start of any a11y specific string key.
   * @public
   * @type {string}
   */
  A11Y_MARKER: A11Y_MARKER,
  /**
   * Call a function on each object with a "value" attribute in an object tree.
   * @param {StringMap} map - string map, like a loaded JSON strings file
   * @param {function(key:string, StringObject)} func
   * @param {string} [keySoFar] - while recursing, build up a string of the key separated with dots.
   * @public
   */
  forEachString: function forEachString(map, func) {
    var keySoFar = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    for (var key in map) {
      if (map.hasOwnProperty(key)) {
        var nextKey = keySoFar ? "".concat(keySoFar, ".").concat(key) : key; // don't start with period, assumes '' is falsey
        var stringObject = map[key];

        // no need to support non-object, null, or arrays in the string map, for example stringObject.history in
        // locale specific files.
        if (_typeof(stringObject) !== 'object' || stringObject === null || Array.isArray(stringObject)) {
          continue;
        }
        if (stringObject.value) {
          func(nextKey, stringObject);
        }

        // recurse to the next level since if it wasn't the `value` key
        key !== 'value' && ChipperStringUtils.forEachString(stringObject, func, nextKey);
      }
    }
  }
};

/**
 * @typedef {Object} StringMapNode
 * @property {StringMapNode} * - A key that stores a StringMapNode inside this one.
 */
/**
 * @typedef {Object} StringObject
 * An object that has a "value" field that holds the string. It can still include more nested `StringObject`s.
 * Each StringMapNode should have at least one StringObject nested inside it.
 * @extends {StringMapNode}
 * @property {string} value - the value key is used in
 */
/**
 * @typedef {Object.<string, StringMapNode>>} StringMap
 * @extends {StringMapNode}
 * A string map can be either a flat map of StringObject (see the output of CHIPPER/getStringMap), or can be a nested
 * Object with StringObjects throughout the object structure (as supported in English JSON string files).
 */

module.exports = ChipperStringUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiXyIsIk5BTUVTUEFDRV9QUkVGSVhfRElWSURFUiIsIkExMVlfTUFSS0VSIiwiQ2hpcHBlclN0cmluZ1V0aWxzIiwiYWRkRGlyZWN0aW9uYWxGb3JtYXR0aW5nIiwic3RyIiwiaXNSVEwiLCJsZW5ndGgiLCJjb25jYXQiLCJwYWRTdHJpbmciLCJuIiwicmVwbGFjZUFsbCIsImZpbmQiLCJyZXBsYWNlV2l0aCIsInJlcGxhY2UiLCJSZWdFeHAiLCJyZXBsYWNlRmlyc3QiLCJpZHgiLCJpbmRleE9mIiwic2xpY2UiLCJyZXBsYWNlUGxhY2Vob2xkZXJzIiwibWFwcGluZyIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwicmVwbGFjZW1lbnQiLCJpbmRleCIsIkVycm9yIiwiZm9ybWF0U3RyaW5nVmFsdWVzIiwic3RyaW5nTWFwIiwiYXNzZXJ0Tm9XaGl0ZXNwYWNlIiwiZm9yRWFjaFN0cmluZyIsInN0cmluZ09iamVjdCIsInZhbHVlIiwidHJpbSIsImdldFN0cmluZ0VudHJ5RnJvbU1hcCIsIm1hcCIsInJlc3VsdCIsImF0IiwidW5kZWZpbmVkIiwiaXNBMTF5U3RyaW5nS2V5IiwiZnVuYyIsImtleVNvRmFyIiwiYXJndW1lbnRzIiwiaGFzT3duUHJvcGVydHkiLCJuZXh0S2V5IiwiX3R5cGVvZiIsIkFycmF5IiwiaXNBcnJheSIsIm1vZHVsZSIsImV4cG9ydHMiXSwic291cmNlcyI6WyJDaGlwcGVyU3RyaW5nVXRpbHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTUtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU3RyaW5nIHV0aWxpdGllcyB1c2VkIHRocm91Z2hvdXQgY2hpcHBlci5cclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbi8qIGVzbGludC1lbnYgbm9kZSAqL1xyXG5cclxuXHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5cclxuLy8gV2hhdCBkaXZpZGVzIHRoZSByZXBvIHByZWZpeCBmcm9tIHRoZSByZXN0IG9mIHRoZSBzdHJpbmcga2V5LCBsaWtlIGBGUklDVElPTi9mcmljdGlvbi50aXRsZWBcclxuY29uc3QgTkFNRVNQQUNFX1BSRUZJWF9ESVZJREVSID0gJy8nO1xyXG5jb25zdCBBMTFZX01BUktFUiA9ICdhMTF5Lic7XHJcblxyXG5jb25zdCBDaGlwcGVyU3RyaW5nVXRpbHMgPSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIFBhZCBMVFIvUlRMIGxhbmd1YWdlIHZhbHVlcyB3aXRoIHVuaWNvZGUgZW1iZWRkaW5nIG1hcmtzIChzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy8xNTIpXHJcbiAgICogVXNlcyBkaXJlY3Rpb25hbCBmb3JtYXR0aW5nIGNoYXJhY3RlcnM6IGh0dHA6Ly91bmljb2RlLm9yZy9yZXBvcnRzL3RyOS8jRGlyZWN0aW9uYWxfRm9ybWF0dGluZ19DaGFyYWN0ZXJzXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBpc1JUTFxyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IHRoZSBpbnB1dCBzdHJpbmcgcGFkZGVkIHdpdGggdGhlIGVtYmVkZGluZyBtYXJrcywgb3IgYW4gZW1wdHkgc3RyaW5nIGlmIHRoZSBpbnB1dCB3YXMgZW1wdHlcclxuICAgKi9cclxuICBhZGREaXJlY3Rpb25hbEZvcm1hdHRpbmc6IGZ1bmN0aW9uKCBzdHIsIGlzUlRMICkge1xyXG4gICAgaWYgKCBzdHIubGVuZ3RoID4gMCApIHtcclxuICAgICAgcmV0dXJuIGAkeyggaXNSVEwgPyAnXFx1MjAyYicgOiAnXFx1MjAyYScgKSArIHN0cn1cXHUyMDJjYDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gc3RyO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEFwcGVuZHMgc3BhY2VzIHRvIGEgc3RyaW5nXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyIC0gdGhlIGlucHV0IHN0cmluZ1xyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBuIC0gbnVtYmVyIG9mIHNwYWNlcyB0byBhcHBlbmRcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBhIG5ldyBzdHJpbmdcclxuICAgKi9cclxuICBwYWRTdHJpbmc6IGZ1bmN0aW9uKCBzdHIsIG4gKSB7XHJcbiAgICB3aGlsZSAoIHN0ci5sZW5ndGggPCBuICkge1xyXG4gICAgICBzdHIgKz0gJyAnO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN0cjtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSZXBsYWNlcyBhbGwgb2NjdXJyZW5jZXMgb2Yge3N0cmluZ30gZmluZCB3aXRoIHtzdHJpbmd9IHJlcGxhY2UgaW4ge3N0cmluZ30gc3RyXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyIC0gdGhlIGlucHV0IHN0cmluZ1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaW5kIC0gdGhlIHN0cmluZyB0byBmaW5kXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlcGxhY2VXaXRoIC0gdGhlIHN0cmluZyB0byByZXBsYWNlIGZpbmQgd2l0aFxyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IGEgbmV3IHN0cmluZ1xyXG4gICAqL1xyXG4gIHJlcGxhY2VBbGw6IGZ1bmN0aW9uKCBzdHIsIGZpbmQsIHJlcGxhY2VXaXRoICkge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKCBuZXcgUmVnRXhwKCBmaW5kLnJlcGxhY2UoIC9bLS9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJyApLCAnZycgKSwgcmVwbGFjZVdpdGggKTtcclxuICB9LFxyXG5cclxuICAvLyBUT0RPIGNoaXBwZXIjMzE2IGRldGVybWluZSB3aHkgdGhpcyBiZWhhdmVzIGRpZmZlcmVudGx5IHRoYW4gc3RyLnJlcGxhY2UgZm9yIHNvbWUgY2FzZXMgKGVnLCAnTUFJTl9JTkxJTkVfSkFWQVNDUklQVCcpXHJcbiAgLyoqXHJcbiAgICogUmVwbGFjZXMgdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2Yge3N0cmluZ30gZmluZCB3aXRoIHtzdHJpbmd9IHJlcGxhY2VXaXRoIGluIHtzdHJpbmd9IHN0clxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0ciAtIHRoZSBpbnB1dCBzdHJpbmdcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmluZCAtIHRoZSBzdHJpbmcgdG8gZmluZFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZXBsYWNlV2l0aCAtIHRoZSBzdHJpbmcgdG8gcmVwbGFjZSBmaW5kIHdpdGhcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBhIG5ldyBzdHJpbmdcclxuICAgKi9cclxuICByZXBsYWNlRmlyc3Q6IGZ1bmN0aW9uKCBzdHIsIGZpbmQsIHJlcGxhY2VXaXRoICkge1xyXG4gICAgY29uc3QgaWR4ID0gc3RyLmluZGV4T2YoIGZpbmQgKTtcclxuICAgIGlmICggc3RyLmluZGV4T2YoIGZpbmQgKSAhPT0gLTEgKSB7XHJcbiAgICAgIHJldHVybiBzdHIuc2xpY2UoIDAsIGlkeCApICsgcmVwbGFjZVdpdGggKyBzdHIuc2xpY2UoIGlkeCArIGZpbmQubGVuZ3RoICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIHN0cjtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIHdpdGggYWxsIG9mIHRoZSBrZXlzIG9mIHRoZSBtYXBwaW5nIHJlcGxhY2VkIHdpdGggdGhlIHZhbHVlcy5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG1hcHBpbmdcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAqL1xyXG4gIHJlcGxhY2VQbGFjZWhvbGRlcnM6IGZ1bmN0aW9uKCBzdHIsIG1hcHBpbmcgKSB7XHJcbiAgICBPYmplY3Qua2V5cyggbWFwcGluZyApLmZvckVhY2goIGtleSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gbWFwcGluZ1sga2V5IF07XHJcbiAgICAgIGtleSA9IGB7eyR7a2V5fX19YDtcclxuICAgICAgbGV0IGluZGV4O1xyXG4gICAgICB3aGlsZSAoICggaW5kZXggPSBzdHIuaW5kZXhPZigga2V5ICkgKSA+PSAwICkge1xyXG4gICAgICAgIHN0ciA9IHN0ci5zbGljZSggMCwgaW5kZXggKSArIHJlcGxhY2VtZW50ICsgc3RyLnNsaWNlKCBpbmRleCArIGtleS5sZW5ndGggKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgT2JqZWN0LmtleXMoIG1hcHBpbmcgKS5mb3JFYWNoKCBrZXkgPT4ge1xyXG4gICAgICBpZiAoIHN0ci5pbmRleE9mKCBge3ske2tleX19fWAgKSA+PSAwICkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYFRlbXBsYXRlIHN0cmluZyBkZXRlY3RlZCBpbiBwbGFjZWhvbGRlcnM6ICR7a2V5fVxcblxcbiR7c3RyLnNsaWNlKCAwLCBzdHIuaW5kZXhPZiggYHt7JHtrZXl9fX1gICkgKyAxMCApfWAgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgcmV0dXJuIHN0cjtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSZWN1cnNlIHRocm91Z2ggYSBzdHJpbmcgZmlsZSBhbmQgZm9ybWF0IGVhY2ggc3RyaW5nIHZhbHVlIGFwcHJvcHJpYXRlbHlcclxuICAgKiBAcGFyYW0ge1N0cmluZ01hcH0gc3RyaW5nTWFwXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBpc1JUTCAtIGlzIHJpZ2h0IHRvIGxlZnQgbGFuZ3VhZ2VcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthc3NlcnROb1doaXRlc3BhY2VdIC0gd2hlbiB0cnVlLCBhc3NlcnQgdGhhdCB0cmltbWluZyBlYWNoIHN0cmluZyB2YWx1ZSBkb2Vzbid0IGNoYW5nZSB0aGUgc3RyaW5nLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBmb3JtYXRTdHJpbmdWYWx1ZXM6IGZ1bmN0aW9uKCBzdHJpbmdNYXAsIGlzUlRMLCBhc3NlcnROb1doaXRlc3BhY2UgKSB7XHJcbiAgICBDaGlwcGVyU3RyaW5nVXRpbHMuZm9yRWFjaFN0cmluZyggc3RyaW5nTWFwLCAoIGtleSwgc3RyaW5nT2JqZWN0ICkgPT4ge1xyXG5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydE5vV2hpdGVzcGFjZSAmJiBhc3NlcnQoIHN0cmluZ09iamVjdC52YWx1ZSA9PT0gc3RyaW5nT2JqZWN0LnZhbHVlLnRyaW0oKSxcclxuICAgICAgICBgU3RyaW5nIHNob3VsZCBub3QgaGF2ZSB0cmFpbGluZyBvciBsZWFkaW5nIHdoaXRlc3BhY2UsIGtleTogJHtrZXl9LCB2YWx1ZTogXCIke3N0cmluZ09iamVjdC52YWx1ZX1cImAgKTtcclxuXHJcbiAgICAgIC8vIHJlbW92ZSBsZWFkaW5nL3RyYWlsaW5nIHdoaXRlc3BhY2UsIHNlZSBjaGlwcGVyIzYxOS4gRG8gdGhpcyBiZWZvcmUgYWRkRGlyZWN0aW9uYWxGb3JtYXR0aW5nXHJcbiAgICAgIHN0cmluZ09iamVjdC52YWx1ZSA9IENoaXBwZXJTdHJpbmdVdGlscy5hZGREaXJlY3Rpb25hbEZvcm1hdHRpbmcoIHN0cmluZ09iamVjdC52YWx1ZS50cmltKCksIGlzUlRMICk7XHJcbiAgICB9ICk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYSBrZXksIGdldCB0aGUgYXBwcm9wcmlhdGUgc3RyaW5nIGZyb20gdGhlIFwibWFwXCIgb2JqZWN0LCBvciBudWxsIGlmIHRoZSBrZXkgZG9lcyBub3QgYXBwZWFyIGluIHRoZSBtYXAuXHJcbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIGluIHVuYnVpbHQgbW9kZSBmcm9tIHRoZSBzdHJpbmcgcGx1Z2luIGFuZCBkdXJpbmcgdGhlIGJ1aWxkIHZpYSBDSElQUEVSL2dldFN0cmluZ01hcC5cclxuICAgKiBUaGlzIG1ldGhvZCBzdXBwb3J0cyByZWN1cnNpbmcgdGhyb3VnaCBrZXlzIHRoYXQgc3VwcG9ydCBzdHJpbmcgbmVzdGluZy4gVGhpcyBtZXRob2Qgd2FzIGNyZWF0ZWQgdG8gc3VwcG9ydFxyXG4gICAqIG5lc3RlZCBzdHJpbmcga2V5cyBpbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcm9zZXR0YS9pc3N1ZXMvMTkzXHJcbiAgICogQHBhcmFtIHtTdHJpbmdNYXB9IG1hcCAtIHdoZXJlIGFuIFwiaW50ZXJtZWRpYXRlXCIgT2JqZWN0IHNob3VsZCBob2xkIG5lc3RlZCBzdHJpbmdzXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIGxpa2UgYEZSSUNUSU9OL2ZyaWN0aW9uLnRpdGxlYCBvciB1c2luZyBuZXN0aW5nIGxpa2UgYGExMXkubmVzdGVkLnN0cmluZy5oZXJlYFxyXG4gICAqIEByZXR1cm5zIHtPYmplY3R8bnVsbH0gLSB0aGUgc3RyaW5nIGVudHJ5IG9mIHRoZSBrZXksIG9yIG51bGwgaWYgdGhlIGtleSBkb2VzIG5vdCBhcHBlYXIgaW4gdGhlIG1hcFxyXG4gICAqIEB0aHJvd3MgIHtFcnJvcn0gLSBpZiB0aGUga2V5IGRvZXNuJ3QgaG9sZCBhIHN0cmluZyB2YWx1ZSBpbiB0aGUgbWFwXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIGdldFN0cmluZ0VudHJ5RnJvbU1hcCggbWFwLCBrZXkgKSB7XHJcblxyXG4gICAgaWYgKCBrZXkuaW5kZXhPZiggTkFNRVNQQUNFX1BSRUZJWF9ESVZJREVSICkgPj0gMCApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCAnZ2V0U3RyaW5nRW50cnlGcm9tTWFwIGtleSBzaG91bGQgbm90IGhhdmUgUkVQTy8nICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTG9kYXNoIGdpdmVzIHByZWNlZGVuY2UgdG8gIFwia2V5MS5rZXkyXCIgb3ZlciBcImtleTE6e2tleTJ9XCIsIHNvIHdlIGRvIHRvby5cclxuICAgIGNvbnN0IHJlc3VsdCA9IF8uYXQoIG1hcCwga2V5IClbIDAgXTtcclxuICAgIGlmICggcmVzdWx0ICkge1xyXG4gICAgICBpZiAoIHJlc3VsdC52YWx1ZSA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYG5vIHZhbHVlIGZvciBzdHJpbmc6ICR7a2V5fWAgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHR5cGVvZiByZXN1bHQudmFsdWUgIT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYHZhbHVlIHNob3VsZCBiZSBhIHN0cmluZyBmb3Iga2V5ICR7a2V5fWAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gVW50aWwgcm9zZXR0YSBzdXBwb3J0cyBuZXN0ZWQgc3RyaW5ncyBpbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcm9zZXR0YS9pc3N1ZXMvMjE1LCBrZWVwIHRoaXMgYXNzZXJ0aW9uLlxyXG4gICAgICAvLyBUaGlzIHNob3VsZCBiZSBhZnRlciBiZWNhdXNlIHRoZSBhYm92ZSBlcnJvcnMgYXJlIG1vcmUgc3BlY2lmaWMuIFRoaXMgaXMgYmV0dGVyIGFzIGEgZmFsbGJhY2suXHJcbiAgICAgIGFzc2VydCAmJiAhQ2hpcHBlclN0cmluZ1V0aWxzLmlzQTExeVN0cmluZ0tleSgga2V5ICkgJiYgYXNzZXJ0KCBtYXBbIGtleSBdLFxyXG4gICAgICAgIGBuZXN0ZWQgc3RyaW5ncyBhcmUgbm90IGFsbG93ZWQgb3V0c2lkZSBvZiBhMTF5IHN0cmluZyBvYmplY3QgZm9yIGtleTogJHtrZXl9YCApO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUaGV5IGtleSBkb2VzIG5vdCBhcHBlYXIgaW4gdGhlIG1hcFxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSB3aXRob3V0IFwic3RyaW5nIVJFUE9cIiBhdCB0aGUgYmVnaW5uaW5nLCBqdXN0IHRoZSBhY3R1YWwgXCJzdHJpbmcga2V5XCJcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgKi9cclxuICBpc0ExMXlTdHJpbmdLZXkoIGtleSApIHtcclxuICAgIHJldHVybiBrZXkuaW5kZXhPZiggQ2hpcHBlclN0cmluZ1V0aWxzLkExMVlfTUFSS0VSICkgPT09IDA7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHN0YXJ0IG9mIGFueSBhMTF5IHNwZWNpZmljIHN0cmluZyBrZXkuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICovXHJcbiAgQTExWV9NQVJLRVI6IEExMVlfTUFSS0VSLFxyXG5cclxuICAvKipcclxuICAgKiBDYWxsIGEgZnVuY3Rpb24gb24gZWFjaCBvYmplY3Qgd2l0aCBhIFwidmFsdWVcIiBhdHRyaWJ1dGUgaW4gYW4gb2JqZWN0IHRyZWUuXHJcbiAgICogQHBhcmFtIHtTdHJpbmdNYXB9IG1hcCAtIHN0cmluZyBtYXAsIGxpa2UgYSBsb2FkZWQgSlNPTiBzdHJpbmdzIGZpbGVcclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKGtleTpzdHJpbmcsIFN0cmluZ09iamVjdCl9IGZ1bmNcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2tleVNvRmFyXSAtIHdoaWxlIHJlY3Vyc2luZywgYnVpbGQgdXAgYSBzdHJpbmcgb2YgdGhlIGtleSBzZXBhcmF0ZWQgd2l0aCBkb3RzLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBmb3JFYWNoU3RyaW5nKCBtYXAsIGZ1bmMsIGtleVNvRmFyID0gJycgKSB7XHJcbiAgICBmb3IgKCBjb25zdCBrZXkgaW4gbWFwICkge1xyXG4gICAgICBpZiAoIG1hcC5oYXNPd25Qcm9wZXJ0eSgga2V5ICkgKSB7XHJcbiAgICAgICAgY29uc3QgbmV4dEtleSA9IGtleVNvRmFyID8gYCR7a2V5U29GYXJ9LiR7a2V5fWAgOiBrZXk7IC8vIGRvbid0IHN0YXJ0IHdpdGggcGVyaW9kLCBhc3N1bWVzICcnIGlzIGZhbHNleVxyXG4gICAgICAgIGNvbnN0IHN0cmluZ09iamVjdCA9IG1hcFsga2V5IF07XHJcblxyXG4gICAgICAgIC8vIG5vIG5lZWQgdG8gc3VwcG9ydCBub24tb2JqZWN0LCBudWxsLCBvciBhcnJheXMgaW4gdGhlIHN0cmluZyBtYXAsIGZvciBleGFtcGxlIHN0cmluZ09iamVjdC5oaXN0b3J5IGluXHJcbiAgICAgICAgLy8gbG9jYWxlIHNwZWNpZmljIGZpbGVzLlxyXG4gICAgICAgIGlmICggdHlwZW9mIHN0cmluZ09iamVjdCAhPT0gJ29iamVjdCcgfHwgc3RyaW5nT2JqZWN0ID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoIHN0cmluZ09iamVjdCApICkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggc3RyaW5nT2JqZWN0LnZhbHVlICkge1xyXG4gICAgICAgICAgZnVuYyggbmV4dEtleSwgc3RyaW5nT2JqZWN0ICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyByZWN1cnNlIHRvIHRoZSBuZXh0IGxldmVsIHNpbmNlIGlmIGl0IHdhc24ndCB0aGUgYHZhbHVlYCBrZXlcclxuICAgICAgICBrZXkgIT09ICd2YWx1ZScgJiYgQ2hpcHBlclN0cmluZ1V0aWxzLmZvckVhY2hTdHJpbmcoIHN0cmluZ09iamVjdCwgZnVuYywgbmV4dEtleSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFN0cmluZ01hcE5vZGVcclxuICogQHByb3BlcnR5IHtTdHJpbmdNYXBOb2RlfSAqIC0gQSBrZXkgdGhhdCBzdG9yZXMgYSBTdHJpbmdNYXBOb2RlIGluc2lkZSB0aGlzIG9uZS5cclxuICovXHJcbi8qKlxyXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBTdHJpbmdPYmplY3RcclxuICogQW4gb2JqZWN0IHRoYXQgaGFzIGEgXCJ2YWx1ZVwiIGZpZWxkIHRoYXQgaG9sZHMgdGhlIHN0cmluZy4gSXQgY2FuIHN0aWxsIGluY2x1ZGUgbW9yZSBuZXN0ZWQgYFN0cmluZ09iamVjdGBzLlxyXG4gKiBFYWNoIFN0cmluZ01hcE5vZGUgc2hvdWxkIGhhdmUgYXQgbGVhc3Qgb25lIFN0cmluZ09iamVjdCBuZXN0ZWQgaW5zaWRlIGl0LlxyXG4gKiBAZXh0ZW5kcyB7U3RyaW5nTWFwTm9kZX1cclxuICogQHByb3BlcnR5IHtzdHJpbmd9IHZhbHVlIC0gdGhlIHZhbHVlIGtleSBpcyB1c2VkIGluXHJcbiAqL1xyXG4vKipcclxuICogQHR5cGVkZWYge09iamVjdC48c3RyaW5nLCBTdHJpbmdNYXBOb2RlPj59IFN0cmluZ01hcFxyXG4gKiBAZXh0ZW5kcyB7U3RyaW5nTWFwTm9kZX1cclxuICogQSBzdHJpbmcgbWFwIGNhbiBiZSBlaXRoZXIgYSBmbGF0IG1hcCBvZiBTdHJpbmdPYmplY3QgKHNlZSB0aGUgb3V0cHV0IG9mIENISVBQRVIvZ2V0U3RyaW5nTWFwKSwgb3IgY2FuIGJlIGEgbmVzdGVkXHJcbiAqIE9iamVjdCB3aXRoIFN0cmluZ09iamVjdHMgdGhyb3VnaG91dCB0aGUgb2JqZWN0IHN0cnVjdHVyZSAoYXMgc3VwcG9ydGVkIGluIEVuZ2xpc2ggSlNPTiBzdHJpbmcgZmlsZXMpLlxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2hpcHBlclN0cmluZ1V0aWxzOyJdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUdBLElBQU1B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