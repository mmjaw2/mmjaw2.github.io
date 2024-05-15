"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2018-2024, University of Colorado Boulder

/**
 * Fills in values for the chipper initialization script script.
 *
 * NOTE: This should not be minified! It contains licenses that should be human readable as well as important formatting
 * for rosetta translation.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// modules
var _ = require('lodash');
var assert = require('assert');
var ChipperConstants = require('../common/ChipperConstants');
var ChipperStringUtils = require('../common/ChipperStringUtils');
var fs = require('fs');
var grunt = require('grunt');
var transpile = require('./transpile');
var stringEncoding = require('../common/stringEncoding');

/**
 * Returns a string for the JS of the initialization script.
 * @public
 *
 * @param {Object} config
 * @returns {string}
 */
module.exports = function (config) {
  var brand = config.brand,
    repo = config.repo,
    allLocales = config.allLocales,
    stringMap = config.stringMap,
    stringMetadata = config.stringMetadata,
    version = config.version,
    dependencies = config.dependencies,
    timestamp = config.timestamp,
    locale = config.locale,
    includeAllLocales = config.includeAllLocales,
    isDebugBuild = config.isDebugBuild,
    allowLocaleSwitching = config.allowLocaleSwitching,
    encodeStringMap = config.encodeStringMap,
    profileFileSize = config.profileFileSize,
    packageObject = config.packageObject;
  assert(typeof repo === 'string', 'Requires repo');
  assert(stringMap, 'Requires stringMap');
  assert(typeof version === 'string', 'Requires version');
  assert(dependencies, 'Requires dependencies');
  assert(typeof timestamp === 'string', 'Requires timestamp');
  assert(typeof locale === 'string', 'Requires locale');
  assert(typeof includeAllLocales === 'boolean', 'Requires includeAllLocales');
  assert(typeof isDebugBuild === 'boolean', 'Requires isDebugBuild');

  // Load localeData
  var fullLocaleData = JSON.parse(fs.readFileSync('../babel/localeData.json', 'utf8'));

  // Include a subset of locales' translated strings
  var phetStrings = stringMap;
  if (!includeAllLocales) {
    phetStrings = {};

    // Go through all of the potential fallback locales, and include the strings for each of them
    var requiredLocales = [
    // duplicates OK
    locale].concat(_toConsumableArray(fullLocaleData[locale].fallbackLocales || []), [ChipperConstants.FALLBACK_LOCALE]);
    var _iterator = _createForOfIteratorHelper(requiredLocales),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _locale = _step.value;
        phetStrings[_locale] = stringMap[_locale];
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  // Include a (larger) subset of locales' localeData.
  var includedDataLocales = _.sortBy(_.uniq([
  // Always include the fallback (en)
  ChipperConstants.FALLBACK_LOCALE].concat(_toConsumableArray(allLocales), _toConsumableArray(Object.keys(fullLocaleData).filter(function (locale) {
    return fullLocaleData[locale].fallbackLocales && fullLocaleData[locale].fallbackLocales.some(function (fallbackLocale) {
      return allLocales.includes(fallbackLocale);
    });
  })))));
  var localeData = {};
  var _iterator2 = _createForOfIteratorHelper(includedDataLocales),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var _locale2 = _step2.value;
      localeData[_locale2] = fullLocaleData[_locale2];
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  return ChipperStringUtils.replacePlaceholders(grunt.file.read('../chipper/templates/chipper-initialization.js'), {
    PHET_PROJECT: repo,
    PHET_VERSION: version,
    PHET_BUILD_TIMESTAMP: timestamp,
    PHET_BRAND: brand,
    PHET_LOCALE: locale,
    PHET_LOCALE_DATA: JSON.stringify(localeData),
    PHET_DEPENDENCIES: JSON.stringify(dependencies, null, 2),
    // If it's a debug build, don't encode the strings, so that they are easier to inspect
    PHET_STRINGS: isDebugBuild || !encodeStringMap ? JSON.stringify(phetStrings, null, isDebugBuild ? 2 : '') : stringEncoding.encodeStringMapToJS(phetStrings),
    PHET_BEFORE_STRINGS: profileFileSize ? 'console.log("START_STRINGS");' : '',
    PHET_AFTER_STRINGS: profileFileSize ? 'console.log("END_STRINGS");' : '',
    PHET_STRING_METADATA: JSON.stringify(stringMetadata, null, isDebugBuild ? 2 : ''),
    PHET_IS_DEBUG_BUILD: !!isDebugBuild,
    PHET_ALLOW_LOCALE_SWITCHING: !!allowLocaleSwitching,
    PHET_PACKAGE_OBJECT: JSON.stringify(packageObject),
    IE_DETECTION_SCRIPT: transpile(grunt.file.read('../chipper/js/ie-detection.js'), true)
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImFzc2VydCIsIkNoaXBwZXJDb25zdGFudHMiLCJDaGlwcGVyU3RyaW5nVXRpbHMiLCJmcyIsImdydW50IiwidHJhbnNwaWxlIiwic3RyaW5nRW5jb2RpbmciLCJtb2R1bGUiLCJleHBvcnRzIiwiY29uZmlnIiwiYnJhbmQiLCJyZXBvIiwiYWxsTG9jYWxlcyIsInN0cmluZ01hcCIsInN0cmluZ01ldGFkYXRhIiwidmVyc2lvbiIsImRlcGVuZGVuY2llcyIsInRpbWVzdGFtcCIsImxvY2FsZSIsImluY2x1ZGVBbGxMb2NhbGVzIiwiaXNEZWJ1Z0J1aWxkIiwiYWxsb3dMb2NhbGVTd2l0Y2hpbmciLCJlbmNvZGVTdHJpbmdNYXAiLCJwcm9maWxlRmlsZVNpemUiLCJwYWNrYWdlT2JqZWN0IiwiZnVsbExvY2FsZURhdGEiLCJKU09OIiwicGFyc2UiLCJyZWFkRmlsZVN5bmMiLCJwaGV0U3RyaW5ncyIsInJlcXVpcmVkTG9jYWxlcyIsImNvbmNhdCIsIl90b0NvbnN1bWFibGVBcnJheSIsImZhbGxiYWNrTG9jYWxlcyIsIkZBTExCQUNLX0xPQ0FMRSIsIl9pdGVyYXRvciIsIl9jcmVhdGVGb3JPZkl0ZXJhdG9ySGVscGVyIiwiX3N0ZXAiLCJzIiwibiIsImRvbmUiLCJ2YWx1ZSIsImVyciIsImUiLCJmIiwiaW5jbHVkZWREYXRhTG9jYWxlcyIsInNvcnRCeSIsInVuaXEiLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyIiwic29tZSIsImZhbGxiYWNrTG9jYWxlIiwiaW5jbHVkZXMiLCJsb2NhbGVEYXRhIiwiX2l0ZXJhdG9yMiIsIl9zdGVwMiIsInJlcGxhY2VQbGFjZWhvbGRlcnMiLCJmaWxlIiwicmVhZCIsIlBIRVRfUFJPSkVDVCIsIlBIRVRfVkVSU0lPTiIsIlBIRVRfQlVJTERfVElNRVNUQU1QIiwiUEhFVF9CUkFORCIsIlBIRVRfTE9DQUxFIiwiUEhFVF9MT0NBTEVfREFUQSIsInN0cmluZ2lmeSIsIlBIRVRfREVQRU5ERU5DSUVTIiwiUEhFVF9TVFJJTkdTIiwiZW5jb2RlU3RyaW5nTWFwVG9KUyIsIlBIRVRfQkVGT1JFX1NUUklOR1MiLCJQSEVUX0FGVEVSX1NUUklOR1MiLCJQSEVUX1NUUklOR19NRVRBREFUQSIsIlBIRVRfSVNfREVCVUdfQlVJTEQiLCJQSEVUX0FMTE9XX0xPQ0FMRV9TV0lUQ0hJTkciLCJQSEVUX1BBQ0tBR0VfT0JKRUNUIiwiSUVfREVURUNUSU9OX1NDUklQVCJdLCJzb3VyY2VzIjpbImdldEluaXRpYWxpemF0aW9uU2NyaXB0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEZpbGxzIGluIHZhbHVlcyBmb3IgdGhlIGNoaXBwZXIgaW5pdGlhbGl6YXRpb24gc2NyaXB0IHNjcmlwdC5cclxuICpcclxuICogTk9URTogVGhpcyBzaG91bGQgbm90IGJlIG1pbmlmaWVkISBJdCBjb250YWlucyBsaWNlbnNlcyB0aGF0IHNob3VsZCBiZSBodW1hbiByZWFkYWJsZSBhcyB3ZWxsIGFzIGltcG9ydGFudCBmb3JtYXR0aW5nXHJcbiAqIGZvciByb3NldHRhIHRyYW5zbGF0aW9uLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuXHJcbi8vIG1vZHVsZXNcclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IENoaXBwZXJDb25zdGFudHMgPSByZXF1aXJlKCAnLi4vY29tbW9uL0NoaXBwZXJDb25zdGFudHMnICk7XHJcbmNvbnN0IENoaXBwZXJTdHJpbmdVdGlscyA9IHJlcXVpcmUoICcuLi9jb21tb24vQ2hpcHBlclN0cmluZ1V0aWxzJyApO1xyXG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuY29uc3QgZ3J1bnQgPSByZXF1aXJlKCAnZ3J1bnQnICk7XHJcbmNvbnN0IHRyYW5zcGlsZSA9IHJlcXVpcmUoICcuL3RyYW5zcGlsZScgKTtcclxuY29uc3Qgc3RyaW5nRW5jb2RpbmcgPSByZXF1aXJlKCAnLi4vY29tbW9uL3N0cmluZ0VuY29kaW5nJyApO1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYSBzdHJpbmcgZm9yIHRoZSBKUyBvZiB0aGUgaW5pdGlhbGl6YXRpb24gc2NyaXB0LlxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWdcclxuICogQHJldHVybnMge3N0cmluZ31cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGNvbmZpZyApIHtcclxuICBjb25zdCB7XHJcbiAgICBicmFuZCwgLy8ge3N0cmluZ30sIGUuZy4gJ3BoZXQnLCAncGhldC1pbydcclxuICAgIHJlcG8sIC8vIHtzdHJpbmd9XHJcbiAgICBhbGxMb2NhbGVzLCAvLyB7c3RyaW5nW119XHJcbiAgICBzdHJpbmdNYXAsIC8vIHtPYmplY3R9LCBtYXBbIGxvY2FsZSBdWyBzdHJpbmdLZXkgXSA9PiB7c3RyaW5nfVxyXG4gICAgc3RyaW5nTWV0YWRhdGEsIC8vIHtPYmplY3R9LCBtYXBbIHN0cmluZ0tleSBdID0+IHtPYmplY3R9XHJcbiAgICB2ZXJzaW9uLCAvLyB7c3RyaW5nfVxyXG4gICAgZGVwZW5kZW5jaWVzLCAvLyB7T2JqZWN0fSAtIEZyb20gZ2V0RGVwZW5kZW5jaWVzXHJcbiAgICB0aW1lc3RhbXAsIC8vIHtzdHJpbmd9XHJcbiAgICBsb2NhbGUsIC8vIHtzdHJpbmd9XHJcbiAgICBpbmNsdWRlQWxsTG9jYWxlcywgLy8ge2Jvb2xlYW59XHJcbiAgICBpc0RlYnVnQnVpbGQsIC8vIHtib29sZWFufVxyXG4gICAgYWxsb3dMb2NhbGVTd2l0Y2hpbmcsIC8vIHtib29sZWFufVxyXG4gICAgZW5jb2RlU3RyaW5nTWFwLCAvLyB7Ym9vbGVhbn1cclxuICAgIHByb2ZpbGVGaWxlU2l6ZSwgLy8ge2Jvb2xlYW59XHJcbiAgICBwYWNrYWdlT2JqZWN0XHJcbiAgfSA9IGNvbmZpZztcclxuICBhc3NlcnQoIHR5cGVvZiByZXBvID09PSAnc3RyaW5nJywgJ1JlcXVpcmVzIHJlcG8nICk7XHJcbiAgYXNzZXJ0KCBzdHJpbmdNYXAsICdSZXF1aXJlcyBzdHJpbmdNYXAnICk7XHJcbiAgYXNzZXJ0KCB0eXBlb2YgdmVyc2lvbiA9PT0gJ3N0cmluZycsICdSZXF1aXJlcyB2ZXJzaW9uJyApO1xyXG4gIGFzc2VydCggZGVwZW5kZW5jaWVzLCAnUmVxdWlyZXMgZGVwZW5kZW5jaWVzJyApO1xyXG4gIGFzc2VydCggdHlwZW9mIHRpbWVzdGFtcCA9PT0gJ3N0cmluZycsICdSZXF1aXJlcyB0aW1lc3RhbXAnICk7XHJcbiAgYXNzZXJ0KCB0eXBlb2YgbG9jYWxlID09PSAnc3RyaW5nJywgJ1JlcXVpcmVzIGxvY2FsZScgKTtcclxuICBhc3NlcnQoIHR5cGVvZiBpbmNsdWRlQWxsTG9jYWxlcyA9PT0gJ2Jvb2xlYW4nLCAnUmVxdWlyZXMgaW5jbHVkZUFsbExvY2FsZXMnICk7XHJcbiAgYXNzZXJ0KCB0eXBlb2YgaXNEZWJ1Z0J1aWxkID09PSAnYm9vbGVhbicsICdSZXF1aXJlcyBpc0RlYnVnQnVpbGQnICk7XHJcblxyXG4gIC8vIExvYWQgbG9jYWxlRGF0YVxyXG4gIGNvbnN0IGZ1bGxMb2NhbGVEYXRhID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCAnLi4vYmFiZWwvbG9jYWxlRGF0YS5qc29uJywgJ3V0ZjgnICkgKTtcclxuXHJcbiAgLy8gSW5jbHVkZSBhIHN1YnNldCBvZiBsb2NhbGVzJyB0cmFuc2xhdGVkIHN0cmluZ3NcclxuICBsZXQgcGhldFN0cmluZ3MgPSBzdHJpbmdNYXA7XHJcbiAgaWYgKCAhaW5jbHVkZUFsbExvY2FsZXMgKSB7XHJcbiAgICBwaGV0U3RyaW5ncyA9IHt9O1xyXG5cclxuICAgIC8vIEdvIHRocm91Z2ggYWxsIG9mIHRoZSBwb3RlbnRpYWwgZmFsbGJhY2sgbG9jYWxlcywgYW5kIGluY2x1ZGUgdGhlIHN0cmluZ3MgZm9yIGVhY2ggb2YgdGhlbVxyXG4gICAgY29uc3QgcmVxdWlyZWRMb2NhbGVzID0gW1xyXG4gICAgICAvLyBkdXBsaWNhdGVzIE9LXHJcbiAgICAgIGxvY2FsZSxcclxuICAgICAgLi4uKCBmdWxsTG9jYWxlRGF0YVsgbG9jYWxlIF0uZmFsbGJhY2tMb2NhbGVzIHx8IFtdICksXHJcbiAgICAgIENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFXHJcbiAgICBdO1xyXG5cclxuICAgIGZvciAoIGNvbnN0IGxvY2FsZSBvZiByZXF1aXJlZExvY2FsZXMgKSB7XHJcbiAgICAgIHBoZXRTdHJpbmdzWyBsb2NhbGUgXSA9IHN0cmluZ01hcFsgbG9jYWxlIF07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBJbmNsdWRlIGEgKGxhcmdlcikgc3Vic2V0IG9mIGxvY2FsZXMnIGxvY2FsZURhdGEuXHJcbiAgY29uc3QgaW5jbHVkZWREYXRhTG9jYWxlcyA9IF8uc29ydEJ5KCBfLnVuaXEoIFtcclxuICAgIC8vIEFsd2F5cyBpbmNsdWRlIHRoZSBmYWxsYmFjayAoZW4pXHJcbiAgICBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSxcclxuXHJcbiAgICAvLyBJbmNsdWRlIGRpcmVjdGx5LXVzZWQgbG9jYWxlc1xyXG4gICAgLi4uYWxsTG9jYWxlcyxcclxuXHJcbiAgICAvLyBJbmNsdWRlIGxvY2FsZXMgdGhhdCB3aWxsIGZhbGwgYmFjayB0byBkaXJlY3RseS11c2VkIGxvY2FsZXNcclxuICAgIC4uLk9iamVjdC5rZXlzKCBmdWxsTG9jYWxlRGF0YSApLmZpbHRlciggbG9jYWxlID0+IHtcclxuICAgICAgcmV0dXJuIGZ1bGxMb2NhbGVEYXRhWyBsb2NhbGUgXS5mYWxsYmFja0xvY2FsZXMgJiYgZnVsbExvY2FsZURhdGFbIGxvY2FsZSBdLmZhbGxiYWNrTG9jYWxlcy5zb21lKCBmYWxsYmFja0xvY2FsZSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGFsbExvY2FsZXMuaW5jbHVkZXMoIGZhbGxiYWNrTG9jYWxlICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH0gKVxyXG4gIF0gKSApO1xyXG4gIGNvbnN0IGxvY2FsZURhdGEgPSB7fTtcclxuICBmb3IgKCBjb25zdCBsb2NhbGUgb2YgaW5jbHVkZWREYXRhTG9jYWxlcyApIHtcclxuICAgIGxvY2FsZURhdGFbIGxvY2FsZSBdID0gZnVsbExvY2FsZURhdGFbIGxvY2FsZSBdO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlUGxhY2Vob2xkZXJzKCBncnVudC5maWxlLnJlYWQoICcuLi9jaGlwcGVyL3RlbXBsYXRlcy9jaGlwcGVyLWluaXRpYWxpemF0aW9uLmpzJyApLCB7XHJcbiAgICBQSEVUX1BST0pFQ1Q6IHJlcG8sXHJcbiAgICBQSEVUX1ZFUlNJT046IHZlcnNpb24sXHJcbiAgICBQSEVUX0JVSUxEX1RJTUVTVEFNUDogdGltZXN0YW1wLFxyXG4gICAgUEhFVF9CUkFORDogYnJhbmQsXHJcbiAgICBQSEVUX0xPQ0FMRTogbG9jYWxlLFxyXG4gICAgUEhFVF9MT0NBTEVfREFUQTogSlNPTi5zdHJpbmdpZnkoIGxvY2FsZURhdGEgKSxcclxuICAgIFBIRVRfREVQRU5ERU5DSUVTOiBKU09OLnN0cmluZ2lmeSggZGVwZW5kZW5jaWVzLCBudWxsLCAyICksXHJcbiAgICAvLyBJZiBpdCdzIGEgZGVidWcgYnVpbGQsIGRvbid0IGVuY29kZSB0aGUgc3RyaW5ncywgc28gdGhhdCB0aGV5IGFyZSBlYXNpZXIgdG8gaW5zcGVjdFxyXG4gICAgUEhFVF9TVFJJTkdTOiAoIGlzRGVidWdCdWlsZCB8fCAhZW5jb2RlU3RyaW5nTWFwICkgPyBKU09OLnN0cmluZ2lmeSggcGhldFN0cmluZ3MsIG51bGwsIGlzRGVidWdCdWlsZCA/IDIgOiAnJyApIDogc3RyaW5nRW5jb2RpbmcuZW5jb2RlU3RyaW5nTWFwVG9KUyggcGhldFN0cmluZ3MgKSxcclxuICAgIFBIRVRfQkVGT1JFX1NUUklOR1M6IHByb2ZpbGVGaWxlU2l6ZSA/ICdjb25zb2xlLmxvZyhcIlNUQVJUX1NUUklOR1NcIik7JyA6ICcnLFxyXG4gICAgUEhFVF9BRlRFUl9TVFJJTkdTOiBwcm9maWxlRmlsZVNpemUgPyAnY29uc29sZS5sb2coXCJFTkRfU1RSSU5HU1wiKTsnIDogJycsXHJcbiAgICBQSEVUX1NUUklOR19NRVRBREFUQTogSlNPTi5zdHJpbmdpZnkoIHN0cmluZ01ldGFkYXRhLCBudWxsLCBpc0RlYnVnQnVpbGQgPyAyIDogJycgKSxcclxuICAgIFBIRVRfSVNfREVCVUdfQlVJTEQ6ICEhaXNEZWJ1Z0J1aWxkLFxyXG4gICAgUEhFVF9BTExPV19MT0NBTEVfU1dJVENISU5HOiAhIWFsbG93TG9jYWxlU3dpdGNoaW5nLFxyXG4gICAgUEhFVF9QQUNLQUdFX09CSkVDVDogSlNPTi5zdHJpbmdpZnkoIHBhY2thZ2VPYmplY3QgKSxcclxuICAgIElFX0RFVEVDVElPTl9TQ1JJUFQ6IHRyYW5zcGlsZSggZ3J1bnQuZmlsZS5yZWFkKCAnLi4vY2hpcHBlci9qcy9pZS1kZXRlY3Rpb24uanMnICksIHRydWUgKVxyXG4gIH0gKTtcclxufTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0E7QUFDQSxJQUFNQSxDQUFDLEdBQUdDLE9BQU8sQ0FBRSxRQUFTLENBQUM7QUFDN0IsSUFBTUMsTUFBTSxHQUFHRCxPQUFPLENBQUUsUUFBUyxDQUFDO0FBQ2xDLElBQU1FLGdCQUFnQixHQUFHRixPQUFPLENBQUUsNEJBQTZCLENBQUM7QUFDaEUsSUFBTUcsa0JBQWtCLEdBQUdILE9BQU8sQ0FBRSw4QkFBK0IsQ0FBQztBQUNwRSxJQUFNSSxFQUFFLEdBQUdKLE9BQU8sQ0FBRSxJQUFLLENBQUM7QUFDMUIsSUFBTUssS0FBSyxHQUFHTCxPQUFPLENBQUUsT0FBUSxDQUFDO0FBQ2hDLElBQU1NLFNBQVMs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