"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
// Copyright 2015-2021, University of Colorado Boulder

/**
 * Report which translatable strings from a sim were not used in the simulation with a require statement.
 *
 * Each time a string is loaded by the plugin, it is added to a global list.  After all strings are loaded,
 * the global will contain the list of all strings that are actually used by the sim.  Comparing this list to
 * the strings in the translatable strings JSON file will identify which strings are unused.
 *
 * See https://github.com/phetsims/tasks/issues/460
 *
 * @author Jesse Greenberg
 */

var grunt = require('grunt');

/**
 * @param {string} repo
 * @param {string} requirejsNamespace
 * @param {Object} usedStringMap - Maps full keys to string values, FOR USED STRINGS ONLY
 */
module.exports = function (repo, requirejsNamespace, usedStringMap) {
  /**
   * Builds a string map recursively from a string-file-like object.
   *
   * @param {Object} object
   * @returns {Object}
   */
  var buildStringMap = function buildStringMap(object) {
    var result = {};
    if (typeof object.value === 'string') {
      result[''] = object.value;
    }
    Object.keys(object).filter(function (key) {
      return key !== 'value';
    }).forEach(function (key) {
      if (_typeof(object[key]) === 'object') {
        var subresult = buildStringMap(object[key]);
        Object.keys(subresult).forEach(function (subkey) {
          result[key + (subkey.length ? ".".concat(subkey) : '')] = subresult[subkey];
        });
      }
    });
    return result;
  };
  var availableStringMap = buildStringMap(grunt.file.readJSON("../".concat(repo, "/").concat(repo, "-strings_en.json")));
  Object.keys(availableStringMap).forEach(function (availableStringKey) {
    if (!usedStringMap["".concat(requirejsNamespace, "/").concat(availableStringKey)]) {
      grunt.log.warn("Unused string: key=".concat(availableStringKey, ", value=").concat(availableStringMap[availableStringKey]));
    }
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJncnVudCIsInJlcXVpcmUiLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsInJlcXVpcmVqc05hbWVzcGFjZSIsInVzZWRTdHJpbmdNYXAiLCJidWlsZFN0cmluZ01hcCIsIm9iamVjdCIsInJlc3VsdCIsInZhbHVlIiwiT2JqZWN0Iiwia2V5cyIsImZpbHRlciIsImtleSIsImZvckVhY2giLCJfdHlwZW9mIiwic3VicmVzdWx0Iiwic3Via2V5IiwibGVuZ3RoIiwiY29uY2F0IiwiYXZhaWxhYmxlU3RyaW5nTWFwIiwiZmlsZSIsInJlYWRKU09OIiwiYXZhaWxhYmxlU3RyaW5nS2V5IiwibG9nIiwid2FybiJdLCJzb3VyY2VzIjpbInJlcG9ydFVudXNlZFN0cmluZ3MuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTUtMjAyMSwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUmVwb3J0IHdoaWNoIHRyYW5zbGF0YWJsZSBzdHJpbmdzIGZyb20gYSBzaW0gd2VyZSBub3QgdXNlZCBpbiB0aGUgc2ltdWxhdGlvbiB3aXRoIGEgcmVxdWlyZSBzdGF0ZW1lbnQuXHJcbiAqXHJcbiAqIEVhY2ggdGltZSBhIHN0cmluZyBpcyBsb2FkZWQgYnkgdGhlIHBsdWdpbiwgaXQgaXMgYWRkZWQgdG8gYSBnbG9iYWwgbGlzdC4gIEFmdGVyIGFsbCBzdHJpbmdzIGFyZSBsb2FkZWQsXHJcbiAqIHRoZSBnbG9iYWwgd2lsbCBjb250YWluIHRoZSBsaXN0IG9mIGFsbCBzdHJpbmdzIHRoYXQgYXJlIGFjdHVhbGx5IHVzZWQgYnkgdGhlIHNpbS4gIENvbXBhcmluZyB0aGlzIGxpc3QgdG9cclxuICogdGhlIHN0cmluZ3MgaW4gdGhlIHRyYW5zbGF0YWJsZSBzdHJpbmdzIEpTT04gZmlsZSB3aWxsIGlkZW50aWZ5IHdoaWNoIHN0cmluZ3MgYXJlIHVudXNlZC5cclxuICpcclxuICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy90YXNrcy9pc3N1ZXMvNDYwXHJcbiAqXHJcbiAqIEBhdXRob3IgSmVzc2UgR3JlZW5iZXJnXHJcbiAqL1xyXG5cclxuXHJcbmNvbnN0IGdydW50ID0gcmVxdWlyZSggJ2dydW50JyApO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXF1aXJlanNOYW1lc3BhY2VcclxuICogQHBhcmFtIHtPYmplY3R9IHVzZWRTdHJpbmdNYXAgLSBNYXBzIGZ1bGwga2V5cyB0byBzdHJpbmcgdmFsdWVzLCBGT1IgVVNFRCBTVFJJTkdTIE9OTFlcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIHJlcG8sIHJlcXVpcmVqc05hbWVzcGFjZSwgdXNlZFN0cmluZ01hcCApIHtcclxuXHJcbiAgLyoqXHJcbiAgICogQnVpbGRzIGEgc3RyaW5nIG1hcCByZWN1cnNpdmVseSBmcm9tIGEgc3RyaW5nLWZpbGUtbGlrZSBvYmplY3QuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XHJcbiAgICogQHJldHVybnMge09iamVjdH1cclxuICAgKi9cclxuICBjb25zdCBidWlsZFN0cmluZ01hcCA9IG9iamVjdCA9PiB7XHJcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcclxuXHJcbiAgICBpZiAoIHR5cGVvZiBvYmplY3QudmFsdWUgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICByZXN1bHRbICcnIF0gPSBvYmplY3QudmFsdWU7XHJcbiAgICB9XHJcbiAgICBPYmplY3Qua2V5cyggb2JqZWN0ICkuZmlsdGVyKCBrZXkgPT4ga2V5ICE9PSAndmFsdWUnICkuZm9yRWFjaCgga2V5ID0+IHtcclxuICAgICAgaWYgKCB0eXBlb2Ygb2JqZWN0WyBrZXkgXSA9PT0gJ29iamVjdCcgKSB7XHJcbiAgICAgICAgY29uc3Qgc3VicmVzdWx0ID0gYnVpbGRTdHJpbmdNYXAoIG9iamVjdFsga2V5IF0gKTtcclxuXHJcbiAgICAgICAgT2JqZWN0LmtleXMoIHN1YnJlc3VsdCApLmZvckVhY2goIHN1YmtleSA9PiB7XHJcbiAgICAgICAgICByZXN1bHRbIGtleSArICggc3Via2V5Lmxlbmd0aCA/IGAuJHtzdWJrZXl9YCA6ICcnICkgXSA9IHN1YnJlc3VsdFsgc3Via2V5IF07XHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9O1xyXG5cclxuICBjb25zdCBhdmFpbGFibGVTdHJpbmdNYXAgPSBidWlsZFN0cmluZ01hcCggZ3J1bnQuZmlsZS5yZWFkSlNPTiggYC4uLyR7cmVwb30vJHtyZXBvfS1zdHJpbmdzX2VuLmpzb25gICkgKTtcclxuXHJcbiAgT2JqZWN0LmtleXMoIGF2YWlsYWJsZVN0cmluZ01hcCApLmZvckVhY2goIGF2YWlsYWJsZVN0cmluZ0tleSA9PiB7XHJcbiAgICBpZiAoICF1c2VkU3RyaW5nTWFwWyBgJHtyZXF1aXJlanNOYW1lc3BhY2V9LyR7YXZhaWxhYmxlU3RyaW5nS2V5fWAgXSApIHtcclxuICAgICAgZ3J1bnQubG9nLndhcm4oIGBVbnVzZWQgc3RyaW5nOiBrZXk9JHthdmFpbGFibGVTdHJpbmdLZXl9LCB2YWx1ZT0ke2F2YWlsYWJsZVN0cmluZ01hcFsgYXZhaWxhYmxlU3RyaW5nS2V5IF19YCApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxufTsiXSwibWFwcGluZ3MiOiI7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0EsSUFBTUEsS0FBSyxHQUFHQyxPQUFPLENBQUUsT0FBUSxDQUFDOztBQUVoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FDLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLElBQUksRUFBRUMsa0JBQWtCLEVBQUVDLGFBQWEsRUFBRztFQUVuRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxJQUFNQyxjQUFjLEdBQUcsU0FBakJBLGNBQWNBLENBQUdDLE1BQU0sRUFBSTtJQUMvQixJQUFNQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBRWpCLElBQUssT0FBT0QsTUFBTSxDQUFDRSxLQUFLLEtBQUssUUFBUSxFQUFHO01BQ3RDRCxNQUFNLENBQUUsRUFBRSxDQUFFLEdBQUdELE1BQU0sQ0FBQ0UsS0FBSztJQUM3QjtJQUNBQyxNQUFNLENBQUNDLElBQUksQ0FBRUosTUFBTyxDQUFDLENBQUNLLE1BQU0sQ0FBRSxVQUFBQyxHQUFHO01BQUEsT0FBSUEsR0FBRyxLQUFLLE9BQU87SUFBQSxDQUFDLENBQUMsQ0FBQ0MsT0FBTyxDQUFFLFVBQUFELEdBQUcsRUFBSTtNQUNyRSxJQUFLRSxPQUFBLENBQU9SLE1BQU0sQ0FBRU0sR0FBRyxDQUFFLE1BQUssUUFBUSxFQUFHO1FBQ3ZDLElBQU1HLFNBQVMsR0FBR1YsY0FBYyxDQUFFQyxNQUFNLENBQUVNLEdBQUcsQ0FBRyxDQUFDO1FBRWpESCxNQUFNLENBQUNDLElBQUksQ0FBRUssU0FBVSxDQUFDLENBQUNGLE9BQU8sQ0FBRSxVQUFBRyxNQUFNLEVBQUk7VUFDMUNULE1BQU0sQ0FBRUssR0FBRyxJQUFLSSxNQUFNLENBQUNDLE1BQU0sT0FBQUMsTUFBQSxDQUFPRixNQUFNLElBQUssRUFBRSxDQUFFLENBQUUsR0FBR0QsU0FBUyxDQUFFQyxNQUFNLENBQUU7UUFDN0UsQ0FBRSxDQUFDO01BQ0w7SUFDRixDQUFFLENBQUM7SUFFSCxPQUFPVCxNQUFNO0VBQ2YsQ0FBQztFQUVELElBQU1ZLGtCQUFrQixHQUFHZCxjQUFjLENBQUVQLEtBQUssQ0FBQ3NCLElBQUksQ0FBQ0MsUUFBUSxPQUFBSCxNQUFBLENBQVFoQixJQUFJLE9BQUFnQixNQUFBLENBQUloQixJQUFJLHFCQUFtQixDQUFFLENBQUM7RUFFeEdPLE1BQU0sQ0FBQ0MsSUFBSSxDQUFFUyxrQkFBbUIsQ0FBQyxDQUFDTixPQUFPLENBQUUsVUFBQVMsa0JBQWtCLEVBQUk7SUFDL0QsSUFBSyxDQUFDbEIsYUFBYSxJQUFBYyxNQUFBLENBQUtmLGtCQUFrQixPQUFBZSxNQUFBLENBQUlJLGtCQUFrQixFQUFJLEVBQUc7TUFDckV4QixLQUFLLENBQUN5QixHQUFHLENBQUNDLElBQUksdUJBQUFOLE1BQUEsQ0FBd0JJLGtCQUFrQixjQUFBSixNQUFBLENBQVdDLGtCQUFrQixDQUFFRyxrQkFBa0IsQ0FBRSxDQUFHLENBQUM7SUFDakg7RUFDRixDQUFFLENBQUM7QUFDTCxDQUFDIiwiaWdub3JlTGlzdCI6W119