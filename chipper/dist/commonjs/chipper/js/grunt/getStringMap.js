"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2015-2024, University of Colorado Boulder

/**
 * Returns a map such that map["locale"]["REPO/stringKey"] will be the string value (with fallbacks to English where needed).
 * Loads each string file only once, and only loads the repository/locale combinations necessary.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var _ = require('lodash');
var assert = require('assert');
var ChipperConstants = require('../common/ChipperConstants');
var pascalCase = require('../common/pascalCase');
var ChipperStringUtils = require('../common/ChipperStringUtils');
var fs = require('fs');
var grunt = require('grunt');
var path = require('path');
var localeData = JSON.parse(fs.readFileSync('../babel/localeData.json', 'utf8'));

/**
 * For a given locale, return an array of specific locales that we'll use as fallbacks, e.g.
 * 'ar_AE' => [ 'ar_AE', 'ar', 'ar_MA', 'en' ]   (note, changed from zh_CN example, which does NOT use 'zh' as a fallback anymore)
 * 'es' => [ 'es', 'en' ]
 * 'en' => [ 'en' ]
 *
 * @param {string} locale
 * @returns {Array.<string>}
 */
var localeFallbacks = function localeFallbacks(locale) {
  return [].concat(_toConsumableArray(locale !== ChipperConstants.FALLBACK_LOCALE ? [locale] : []), _toConsumableArray(localeData[locale].fallbackLocales || []), [ChipperConstants.FALLBACK_LOCALE // e.g. 'en'
  ]);
};

/**
 * Load all the required string files into memory, so we don't load them multiple times (for each usage).
 *
 * @param {Array.<string>} reposWithUsedStrings - All of the repos that have 1+ used strings
 * @param {Array.<string>} locales - All supported locales for this build
 * @returns {Object} - maps {locale:string} => Another map with: {stringKey:string} => {stringValue:string}
 */
var getStringFilesContents = function getStringFilesContents(reposWithUsedStrings, locales) {
  var stringFilesContents = {}; // maps [repositoryName][locale] => contents of locale string file

  reposWithUsedStrings.forEach(function (repo) {
    stringFilesContents[repo] = {};

    /**
     * Adds a locale into our stringFilesContents map.
     *
     * @param {string} locale
     * @param {boolean} isRTL
     */
    var addLocale = function addLocale(locale, isRTL) {
      // Read optional string file
      var stringsFilename = path.normalize("../".concat(locale === ChipperConstants.FALLBACK_LOCALE ? '' : 'babel/').concat(repo, "/").concat(repo, "-strings_").concat(locale, ".json"));
      var fileContents;
      try {
        fileContents = grunt.file.readJSON(stringsFilename);
      } catch (error) {
        grunt.log.debug("missing string file: ".concat(stringsFilename));
        fileContents = {};
      }

      // Format the string values
      ChipperStringUtils.formatStringValues(fileContents, isRTL);
      stringFilesContents[repo][locale] = fileContents;
    };

    // Include fallback locales (they may have duplicates)
    var includedLocales = _.sortBy(_.uniq(locales.flatMap(function (locale) {
      assert(localeData[locale], "unsupported locale: ".concat(locale));
      return localeFallbacks(locale);
    })));
    includedLocales.forEach(function (locale) {
      return addLocale(locale, localeData[locale].direction === 'rtl');
    });
  });
  return stringFilesContents;
};

/**
 * @param {string} mainRepo
 * @param {Array.<string>} locales
 * @param {Array.<string>} phetLibs - Used to check for bad string dependencies
 * @param {Array.<string>} usedModules - relative file path of the module (filename) from the repos root
 *
 * @returns {Object} - map[locale][stringKey] => {string}
 */
module.exports = function (mainRepo, locales, phetLibs, usedModules) {
  assert(locales.indexOf(ChipperConstants.FALLBACK_LOCALE) !== -1, 'fallback locale is required');

  // Load the file contents of every single JS module that used any strings
  var usedFileContents = usedModules.map(function (usedModule) {
    return fs.readFileSync("../".concat(usedModule), 'utf-8');
  });

  // Compute which repositories contain one more more used strings (since we'll need to load string files for those
  // repositories).
  var reposWithUsedStrings = [];
  usedFileContents.forEach(function (fileContent) {
    // [a-zA-Z_$][a-zA-Z0-9_$] ---- general JS identifiers, first character can't be a number
    // [^\n\r] ---- grab everything except for newlines here, so we get everything
    var allImportStatements = fileContent.match(/import [a-zA-Z_$][a-zA-Z0-9_$]*Strings from '[^\n\r]+Strings.js';/g);
    if (allImportStatements) {
      var _reposWithUsedStrings;
      (_reposWithUsedStrings = reposWithUsedStrings).push.apply(_reposWithUsedStrings, _toConsumableArray(allImportStatements.map(function (importStatement) {
        // Grabs out the prefix before `Strings.js` (without the leading slash too)
        var importName = importStatement.match(/\/([\w-]+)Strings\.js/)[1];

        // kebab case the repo
        return _.kebabCase(importName);
      })));
    }
  });
  reposWithUsedStrings = _.uniq(reposWithUsedStrings).filter(function (repo) {
    return fs.existsSync("../".concat(repo, "/package.json"));
  });

  // Compute a map of {repo:string} => {requirejsNamepsace:string}, so we can construct full string keys from strings
  // that would be accessing them, e.g. `JoistStrings.ResetAllButton.name` => `JOIST/ResetAllButton.name`.
  var requirejsNamespaceMap = {};
  reposWithUsedStrings.forEach(function (repo) {
    var packageObject = JSON.parse(fs.readFileSync("../".concat(repo, "/package.json"), 'utf-8'));
    requirejsNamespaceMap[repo] = packageObject.phet.requirejsNamespace;
  });

  // Load all the required string files into memory, so we don't load them multiple times (for each usage)
  // maps [repositoryName][locale] => contents of locale string file
  var stringFilesContents = getStringFilesContents(reposWithUsedStrings, locales);

  // Initialize our full stringMap object (which will be filled with results and then returned as our string map).
  var stringMap = {};
  var stringMetadata = {};
  locales.forEach(function (locale) {
    stringMap[locale] = {};
  });

  // combine our strings into [locale][stringKey] map, using the fallback locale where necessary. In regards to nested
  // strings, this data structure doesn't nest. Instead it gets nested string values, and then sets them with the
  // flat key string like `"FRICTION/a11y.some.string.here": { value: 'My Some String' }`
  reposWithUsedStrings.forEach(function (repo) {
    // Scan all of the files with string module references, scanning for anything that looks like a string access for
    // our repo. This will include the string module reference, e.g. `JoistStrings.ResetAllButton.name`, but could also
    // include slightly more (since we're string parsing), e.g. `JoistStrings.ResetAllButton.name.length` would be
    // included, even though only part of that is a string access.
    var stringAccesses = [];
    var prefix = "".concat(pascalCase(repo), "Strings"); // e.g. JoistStrings
    usedFileContents.forEach(function (fileContent, i) {
      // Only scan files where we can identify an import for it
      if (fileContent.includes("import ".concat(prefix, " from"))) {
        // Look for normal matches, e.g. `JoistStrings.` followed by one or more chunks like:
        // .somethingVaguely_alphaNum3r1c
        // [ 'aStringInBracketsBecauseOfSpecialCharacters' ]
        //
        // It will also then end on anything that doesn't look like another one of those chunks
        // [a-zA-Z_$][a-zA-Z0-9_$]* ---- this grabs things that looks like valid JS identifiers
        // \\[ '[^']+' \\])+ ---- this grabs things like our second case above
        // [^\\.\\[] ---- matches something at the end that is NOT either of those other two cases
        // It is also generalized to support arbitrary whitespace and requires that ' match ' or " match ", since
        // this must support JS code and minified TypeScript code
        // Matches one final character that is not '.' or '[', since any valid string accesses should NOT have that
        // after. NOTE: there are some degenerate cases that will break this, e.g.:
        // - JoistStrings.someStringProperty[ 0 ]
        // - JoistStrings.something[ 0 ]
        // - JoistStrings.something[ 'length' ]
        var matches = fileContent.match(new RegExp("".concat(prefix, "(\\.[a-zA-Z_$][a-zA-Z0-9_$]*|\\[\\s*['\"][^'\"]+['\"]\\s*\\])+[^\\.\\[]"), 'g'));
        if (matches) {
          var _stringAccesses;
          (_stringAccesses = stringAccesses).push.apply(_stringAccesses, _toConsumableArray(matches.map(function (match) {
            return match
            // We always have to strip off the last character - it's a character that shouldn't be in a string access
            .slice(0, match.length - 1)
            // Handle JoistStrings[ 'some-thingStringProperty' ].value => JoistStrings[ 'some-thing' ]
            // -- Anything after StringProperty should go
            // away, but we need to add the final '] to maintain the format
            .replace(/StringProperty'].*/, '\']')
            // Handle JoistStrings.somethingStringProperty.value => JoistStrings.something
            .replace(/StringProperty.*/, '');
          })));
        }
      }
    });

    // Strip off our prefixes, so our stringAccesses will have things like `'ResetAllButton.name'` inside.
    stringAccesses = _.uniq(stringAccesses).map(function (str) {
      return str.slice(prefix.length);
    });

    // The JS outputted by TS is minified and missing the whitespace
    var depth = 2;

    // Turn each string access into an array of parts, e.g. '.ResetAllButton.name' => [ 'ResetAllButton', 'name' ]
    // or '[ \'A\' ].B[ \'C\' ]' => [ 'A', 'B', 'C' ]
    // Regex grabs either `.identifier` or `[ 'text' ]`.
    var stringKeysByParts = stringAccesses.map(function (access) {
      return access.match(/\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\s*['"][^'"]+['"]\s*\]/g).map(function (token) {
        return token.startsWith('.') ? token.slice(1) : token.slice(depth, token.length - depth);
      });
    });

    // Concatenate the string parts for each access into something that looks like a partial string key, e.g.
    // [ 'ResetAllButton', 'name' ] => 'ResetAllButton.name'
    var partialStringKeys = _.uniq(stringKeysByParts.map(function (parts) {
      return parts.join('.');
    })).filter(function (key) {
      return key !== 'js';
    });

    // For each string key and locale, we'll look up the string entry and fill it into the stringMap
    partialStringKeys.forEach(function (partialStringKey) {
      locales.forEach(function (locale) {
        var stringEntry = null;
        var _iterator = _createForOfIteratorHelper(localeFallbacks(locale)),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var fallbackLocale = _step.value;
            var stringFileContents = stringFilesContents[repo][fallbackLocale];
            if (stringFileContents) {
              stringEntry = ChipperStringUtils.getStringEntryFromMap(stringFileContents, partialStringKey);
              if (stringEntry) {
                break;
              }
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        if (!partialStringKey.endsWith('StringProperty')) {
          assert(stringEntry !== null, "Missing string information for ".concat(repo, " ").concat(partialStringKey));
          var stringKey = "".concat(requirejsNamespaceMap[repo], "/").concat(partialStringKey);
          stringMap[locale][stringKey] = stringEntry.value;
          if (stringEntry.metadata && locale === ChipperConstants.FALLBACK_LOCALE) {
            stringMetadata[stringKey] = stringEntry.metadata;
          }
        }
      });
    });
  });
  return {
    stringMap: stringMap,
    stringMetadata: stringMetadata
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImFzc2VydCIsIkNoaXBwZXJDb25zdGFudHMiLCJwYXNjYWxDYXNlIiwiQ2hpcHBlclN0cmluZ1V0aWxzIiwiZnMiLCJncnVudCIsInBhdGgiLCJsb2NhbGVEYXRhIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwibG9jYWxlRmFsbGJhY2tzIiwibG9jYWxlIiwiY29uY2F0IiwiX3RvQ29uc3VtYWJsZUFycmF5IiwiRkFMTEJBQ0tfTE9DQUxFIiwiZmFsbGJhY2tMb2NhbGVzIiwiZ2V0U3RyaW5nRmlsZXNDb250ZW50cyIsInJlcG9zV2l0aFVzZWRTdHJpbmdzIiwibG9jYWxlcyIsInN0cmluZ0ZpbGVzQ29udGVudHMiLCJmb3JFYWNoIiwicmVwbyIsImFkZExvY2FsZSIsImlzUlRMIiwic3RyaW5nc0ZpbGVuYW1lIiwibm9ybWFsaXplIiwiZmlsZUNvbnRlbnRzIiwiZmlsZSIsInJlYWRKU09OIiwiZXJyb3IiLCJsb2ciLCJkZWJ1ZyIsImZvcm1hdFN0cmluZ1ZhbHVlcyIsImluY2x1ZGVkTG9jYWxlcyIsInNvcnRCeSIsInVuaXEiLCJmbGF0TWFwIiwiZGlyZWN0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyIsIm1haW5SZXBvIiwicGhldExpYnMiLCJ1c2VkTW9kdWxlcyIsImluZGV4T2YiLCJ1c2VkRmlsZUNvbnRlbnRzIiwibWFwIiwidXNlZE1vZHVsZSIsImZpbGVDb250ZW50IiwiYWxsSW1wb3J0U3RhdGVtZW50cyIsIm1hdGNoIiwiX3JlcG9zV2l0aFVzZWRTdHJpbmdzIiwicHVzaCIsImFwcGx5IiwiaW1wb3J0U3RhdGVtZW50IiwiaW1wb3J0TmFtZSIsImtlYmFiQ2FzZSIsImZpbHRlciIsImV4aXN0c1N5bmMiLCJyZXF1aXJlanNOYW1lc3BhY2VNYXAiLCJwYWNrYWdlT2JqZWN0IiwicGhldCIsInJlcXVpcmVqc05hbWVzcGFjZSIsInN0cmluZ01hcCIsInN0cmluZ01ldGFkYXRhIiwic3RyaW5nQWNjZXNzZXMiLCJwcmVmaXgiLCJpIiwiaW5jbHVkZXMiLCJtYXRjaGVzIiwiUmVnRXhwIiwiX3N0cmluZ0FjY2Vzc2VzIiwic2xpY2UiLCJsZW5ndGgiLCJyZXBsYWNlIiwic3RyIiwiZGVwdGgiLCJzdHJpbmdLZXlzQnlQYXJ0cyIsImFjY2VzcyIsInRva2VuIiwic3RhcnRzV2l0aCIsInBhcnRpYWxTdHJpbmdLZXlzIiwicGFydHMiLCJqb2luIiwia2V5IiwicGFydGlhbFN0cmluZ0tleSIsInN0cmluZ0VudHJ5IiwiX2l0ZXJhdG9yIiwiX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXIiLCJfc3RlcCIsInMiLCJuIiwiZG9uZSIsImZhbGxiYWNrTG9jYWxlIiwidmFsdWUiLCJzdHJpbmdGaWxlQ29udGVudHMiLCJnZXRTdHJpbmdFbnRyeUZyb21NYXAiLCJlcnIiLCJlIiwiZiIsImVuZHNXaXRoIiwic3RyaW5nS2V5IiwibWV0YWRhdGEiXSwic291cmNlcyI6WyJnZXRTdHJpbmdNYXAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTUtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhIG1hcCBzdWNoIHRoYXQgbWFwW1wibG9jYWxlXCJdW1wiUkVQTy9zdHJpbmdLZXlcIl0gd2lsbCBiZSB0aGUgc3RyaW5nIHZhbHVlICh3aXRoIGZhbGxiYWNrcyB0byBFbmdsaXNoIHdoZXJlIG5lZWRlZCkuXHJcbiAqIExvYWRzIGVhY2ggc3RyaW5nIGZpbGUgb25seSBvbmNlLCBhbmQgb25seSBsb2FkcyB0aGUgcmVwb3NpdG9yeS9sb2NhbGUgY29tYmluYXRpb25zIG5lY2Vzc2FyeS5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcblxyXG5jb25zdCBfID0gcmVxdWlyZSggJ2xvZGFzaCcgKTtcclxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcclxuY29uc3QgQ2hpcHBlckNvbnN0YW50cyA9IHJlcXVpcmUoICcuLi9jb21tb24vQ2hpcHBlckNvbnN0YW50cycgKTtcclxuY29uc3QgcGFzY2FsQ2FzZSA9IHJlcXVpcmUoICcuLi9jb21tb24vcGFzY2FsQ2FzZScgKTtcclxuY29uc3QgQ2hpcHBlclN0cmluZ1V0aWxzID0gcmVxdWlyZSggJy4uL2NvbW1vbi9DaGlwcGVyU3RyaW5nVXRpbHMnICk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5jb25zdCBncnVudCA9IHJlcXVpcmUoICdncnVudCcgKTtcclxuY29uc3QgcGF0aCA9IHJlcXVpcmUoICdwYXRoJyApO1xyXG5cclxuY29uc3QgbG9jYWxlRGF0YSA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggJy4uL2JhYmVsL2xvY2FsZURhdGEuanNvbicsICd1dGY4JyApICk7XHJcblxyXG4vKipcclxuICogRm9yIGEgZ2l2ZW4gbG9jYWxlLCByZXR1cm4gYW4gYXJyYXkgb2Ygc3BlY2lmaWMgbG9jYWxlcyB0aGF0IHdlJ2xsIHVzZSBhcyBmYWxsYmFja3MsIGUuZy5cclxuICogJ2FyX0FFJyA9PiBbICdhcl9BRScsICdhcicsICdhcl9NQScsICdlbicgXSAgIChub3RlLCBjaGFuZ2VkIGZyb20gemhfQ04gZXhhbXBsZSwgd2hpY2ggZG9lcyBOT1QgdXNlICd6aCcgYXMgYSBmYWxsYmFjayBhbnltb3JlKVxyXG4gKiAnZXMnID0+IFsgJ2VzJywgJ2VuJyBdXHJcbiAqICdlbicgPT4gWyAnZW4nIF1cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGxvY2FsZVxyXG4gKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59XHJcbiAqL1xyXG5jb25zdCBsb2NhbGVGYWxsYmFja3MgPSBsb2NhbGUgPT4ge1xyXG4gIHJldHVybiBbXHJcbiAgICAuLi4oIGxvY2FsZSAhPT0gQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgPyBbIGxvY2FsZSBdIDogW10gKSxcclxuICAgIC4uLiggbG9jYWxlRGF0YVsgbG9jYWxlIF0uZmFsbGJhY2tMb2NhbGVzIHx8IFtdICksXHJcbiAgICBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSAvLyBlLmcuICdlbidcclxuICBdO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvYWQgYWxsIHRoZSByZXF1aXJlZCBzdHJpbmcgZmlsZXMgaW50byBtZW1vcnksIHNvIHdlIGRvbid0IGxvYWQgdGhlbSBtdWx0aXBsZSB0aW1lcyAoZm9yIGVhY2ggdXNhZ2UpLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSByZXBvc1dpdGhVc2VkU3RyaW5ncyAtIEFsbCBvZiB0aGUgcmVwb3MgdGhhdCBoYXZlIDErIHVzZWQgc3RyaW5nc1xyXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBsb2NhbGVzIC0gQWxsIHN1cHBvcnRlZCBsb2NhbGVzIGZvciB0aGlzIGJ1aWxkXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gbWFwcyB7bG9jYWxlOnN0cmluZ30gPT4gQW5vdGhlciBtYXAgd2l0aDoge3N0cmluZ0tleTpzdHJpbmd9ID0+IHtzdHJpbmdWYWx1ZTpzdHJpbmd9XHJcbiAqL1xyXG5jb25zdCBnZXRTdHJpbmdGaWxlc0NvbnRlbnRzID0gKCByZXBvc1dpdGhVc2VkU3RyaW5ncywgbG9jYWxlcyApID0+IHtcclxuICBjb25zdCBzdHJpbmdGaWxlc0NvbnRlbnRzID0ge307IC8vIG1hcHMgW3JlcG9zaXRvcnlOYW1lXVtsb2NhbGVdID0+IGNvbnRlbnRzIG9mIGxvY2FsZSBzdHJpbmcgZmlsZVxyXG5cclxuICByZXBvc1dpdGhVc2VkU3RyaW5ncy5mb3JFYWNoKCByZXBvID0+IHtcclxuICAgIHN0cmluZ0ZpbGVzQ29udGVudHNbIHJlcG8gXSA9IHt9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIGxvY2FsZSBpbnRvIG91ciBzdHJpbmdGaWxlc0NvbnRlbnRzIG1hcC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbG9jYWxlXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzUlRMXHJcbiAgICAgKi9cclxuICAgIGNvbnN0IGFkZExvY2FsZSA9ICggbG9jYWxlLCBpc1JUTCApID0+IHtcclxuICAgICAgLy8gUmVhZCBvcHRpb25hbCBzdHJpbmcgZmlsZVxyXG4gICAgICBjb25zdCBzdHJpbmdzRmlsZW5hbWUgPSBwYXRoLm5vcm1hbGl6ZSggYC4uLyR7bG9jYWxlID09PSBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSA/ICcnIDogJ2JhYmVsLyd9JHtyZXBvfS8ke3JlcG99LXN0cmluZ3NfJHtsb2NhbGV9Lmpzb25gICk7XHJcbiAgICAgIGxldCBmaWxlQ29udGVudHM7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgZmlsZUNvbnRlbnRzID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggc3RyaW5nc0ZpbGVuYW1lICk7XHJcbiAgICAgIH1cclxuICAgICAgY2F0Y2goIGVycm9yICkge1xyXG4gICAgICAgIGdydW50LmxvZy5kZWJ1ZyggYG1pc3Npbmcgc3RyaW5nIGZpbGU6ICR7c3RyaW5nc0ZpbGVuYW1lfWAgKTtcclxuICAgICAgICBmaWxlQ29udGVudHMgPSB7fTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRm9ybWF0IHRoZSBzdHJpbmcgdmFsdWVzXHJcbiAgICAgIENoaXBwZXJTdHJpbmdVdGlscy5mb3JtYXRTdHJpbmdWYWx1ZXMoIGZpbGVDb250ZW50cywgaXNSVEwgKTtcclxuXHJcbiAgICAgIHN0cmluZ0ZpbGVzQ29udGVudHNbIHJlcG8gXVsgbG9jYWxlIF0gPSBmaWxlQ29udGVudHM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEluY2x1ZGUgZmFsbGJhY2sgbG9jYWxlcyAodGhleSBtYXkgaGF2ZSBkdXBsaWNhdGVzKVxyXG4gICAgY29uc3QgaW5jbHVkZWRMb2NhbGVzID0gXy5zb3J0QnkoIF8udW5pcSggbG9jYWxlcy5mbGF0TWFwKCBsb2NhbGUgPT4ge1xyXG4gICAgICBhc3NlcnQoIGxvY2FsZURhdGFbIGxvY2FsZSBdLCBgdW5zdXBwb3J0ZWQgbG9jYWxlOiAke2xvY2FsZX1gICk7XHJcblxyXG4gICAgICByZXR1cm4gbG9jYWxlRmFsbGJhY2tzKCBsb2NhbGUgKTtcclxuICAgIH0gKSApICk7XHJcblxyXG4gICAgaW5jbHVkZWRMb2NhbGVzLmZvckVhY2goIGxvY2FsZSA9PiBhZGRMb2NhbGUoIGxvY2FsZSwgbG9jYWxlRGF0YVsgbG9jYWxlIF0uZGlyZWN0aW9uID09PSAncnRsJyApICk7XHJcbiAgfSApO1xyXG5cclxuICByZXR1cm4gc3RyaW5nRmlsZXNDb250ZW50cztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWFpblJlcG9cclxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gbG9jYWxlc1xyXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBwaGV0TGlicyAtIFVzZWQgdG8gY2hlY2sgZm9yIGJhZCBzdHJpbmcgZGVwZW5kZW5jaWVzXHJcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IHVzZWRNb2R1bGVzIC0gcmVsYXRpdmUgZmlsZSBwYXRoIG9mIHRoZSBtb2R1bGUgKGZpbGVuYW1lKSBmcm9tIHRoZSByZXBvcyByb290XHJcbiAqXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gbWFwW2xvY2FsZV1bc3RyaW5nS2V5XSA9PiB7c3RyaW5nfVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggbWFpblJlcG8sIGxvY2FsZXMsIHBoZXRMaWJzLCB1c2VkTW9kdWxlcyApIHtcclxuXHJcbiAgYXNzZXJ0KCBsb2NhbGVzLmluZGV4T2YoIENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFICkgIT09IC0xLCAnZmFsbGJhY2sgbG9jYWxlIGlzIHJlcXVpcmVkJyApO1xyXG5cclxuICAvLyBMb2FkIHRoZSBmaWxlIGNvbnRlbnRzIG9mIGV2ZXJ5IHNpbmdsZSBKUyBtb2R1bGUgdGhhdCB1c2VkIGFueSBzdHJpbmdzXHJcbiAgY29uc3QgdXNlZEZpbGVDb250ZW50cyA9IHVzZWRNb2R1bGVzLm1hcCggdXNlZE1vZHVsZSA9PiBmcy5yZWFkRmlsZVN5bmMoIGAuLi8ke3VzZWRNb2R1bGV9YCwgJ3V0Zi04JyApICk7XHJcblxyXG4gIC8vIENvbXB1dGUgd2hpY2ggcmVwb3NpdG9yaWVzIGNvbnRhaW4gb25lIG1vcmUgbW9yZSB1c2VkIHN0cmluZ3MgKHNpbmNlIHdlJ2xsIG5lZWQgdG8gbG9hZCBzdHJpbmcgZmlsZXMgZm9yIHRob3NlXHJcbiAgLy8gcmVwb3NpdG9yaWVzKS5cclxuICBsZXQgcmVwb3NXaXRoVXNlZFN0cmluZ3MgPSBbXTtcclxuICB1c2VkRmlsZUNvbnRlbnRzLmZvckVhY2goIGZpbGVDb250ZW50ID0+IHtcclxuICAgIC8vIFthLXpBLVpfJF1bYS16QS1aMC05XyRdIC0tLS0gZ2VuZXJhbCBKUyBpZGVudGlmaWVycywgZmlyc3QgY2hhcmFjdGVyIGNhbid0IGJlIGEgbnVtYmVyXHJcbiAgICAvLyBbXlxcblxccl0gLS0tLSBncmFiIGV2ZXJ5dGhpbmcgZXhjZXB0IGZvciBuZXdsaW5lcyBoZXJlLCBzbyB3ZSBnZXQgZXZlcnl0aGluZ1xyXG4gICAgY29uc3QgYWxsSW1wb3J0U3RhdGVtZW50cyA9IGZpbGVDb250ZW50Lm1hdGNoKCAvaW1wb3J0IFthLXpBLVpfJF1bYS16QS1aMC05XyRdKlN0cmluZ3MgZnJvbSAnW15cXG5cXHJdK1N0cmluZ3MuanMnOy9nICk7XHJcbiAgICBpZiAoIGFsbEltcG9ydFN0YXRlbWVudHMgKSB7XHJcbiAgICAgIHJlcG9zV2l0aFVzZWRTdHJpbmdzLnB1c2goIC4uLmFsbEltcG9ydFN0YXRlbWVudHMubWFwKCBpbXBvcnRTdGF0ZW1lbnQgPT4ge1xyXG4gICAgICAgIC8vIEdyYWJzIG91dCB0aGUgcHJlZml4IGJlZm9yZSBgU3RyaW5ncy5qc2AgKHdpdGhvdXQgdGhlIGxlYWRpbmcgc2xhc2ggdG9vKVxyXG4gICAgICAgIGNvbnN0IGltcG9ydE5hbWUgPSBpbXBvcnRTdGF0ZW1lbnQubWF0Y2goIC9cXC8oW1xcdy1dKylTdHJpbmdzXFwuanMvIClbIDEgXTtcclxuXHJcbiAgICAgICAgLy8ga2ViYWIgY2FzZSB0aGUgcmVwb1xyXG4gICAgICAgIHJldHVybiBfLmtlYmFiQ2FzZSggaW1wb3J0TmFtZSApO1xyXG4gICAgICB9ICkgKTtcclxuICAgIH1cclxuICB9ICk7XHJcbiAgcmVwb3NXaXRoVXNlZFN0cmluZ3MgPSBfLnVuaXEoIHJlcG9zV2l0aFVzZWRTdHJpbmdzICkuZmlsdGVyKCByZXBvID0+IHtcclxuICAgIHJldHVybiBmcy5leGlzdHNTeW5jKCBgLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gICk7XHJcbiAgfSApO1xyXG5cclxuICAvLyBDb21wdXRlIGEgbWFwIG9mIHtyZXBvOnN0cmluZ30gPT4ge3JlcXVpcmVqc05hbWVwc2FjZTpzdHJpbmd9LCBzbyB3ZSBjYW4gY29uc3RydWN0IGZ1bGwgc3RyaW5nIGtleXMgZnJvbSBzdHJpbmdzXHJcbiAgLy8gdGhhdCB3b3VsZCBiZSBhY2Nlc3NpbmcgdGhlbSwgZS5nLiBgSm9pc3RTdHJpbmdzLlJlc2V0QWxsQnV0dG9uLm5hbWVgID0+IGBKT0lTVC9SZXNldEFsbEJ1dHRvbi5uYW1lYC5cclxuICBjb25zdCByZXF1aXJlanNOYW1lc3BhY2VNYXAgPSB7fTtcclxuICByZXBvc1dpdGhVc2VkU3RyaW5ncy5mb3JFYWNoKCByZXBvID0+IHtcclxuICAgIGNvbnN0IHBhY2thZ2VPYmplY3QgPSBKU09OLnBhcnNlKCBmcy5yZWFkRmlsZVN5bmMoIGAuLi8ke3JlcG99L3BhY2thZ2UuanNvbmAsICd1dGYtOCcgKSApO1xyXG4gICAgcmVxdWlyZWpzTmFtZXNwYWNlTWFwWyByZXBvIF0gPSBwYWNrYWdlT2JqZWN0LnBoZXQucmVxdWlyZWpzTmFtZXNwYWNlO1xyXG4gIH0gKTtcclxuXHJcbiAgLy8gTG9hZCBhbGwgdGhlIHJlcXVpcmVkIHN0cmluZyBmaWxlcyBpbnRvIG1lbW9yeSwgc28gd2UgZG9uJ3QgbG9hZCB0aGVtIG11bHRpcGxlIHRpbWVzIChmb3IgZWFjaCB1c2FnZSlcclxuICAvLyBtYXBzIFtyZXBvc2l0b3J5TmFtZV1bbG9jYWxlXSA9PiBjb250ZW50cyBvZiBsb2NhbGUgc3RyaW5nIGZpbGVcclxuICBjb25zdCBzdHJpbmdGaWxlc0NvbnRlbnRzID0gZ2V0U3RyaW5nRmlsZXNDb250ZW50cyggcmVwb3NXaXRoVXNlZFN0cmluZ3MsIGxvY2FsZXMgKTtcclxuXHJcbiAgLy8gSW5pdGlhbGl6ZSBvdXIgZnVsbCBzdHJpbmdNYXAgb2JqZWN0ICh3aGljaCB3aWxsIGJlIGZpbGxlZCB3aXRoIHJlc3VsdHMgYW5kIHRoZW4gcmV0dXJuZWQgYXMgb3VyIHN0cmluZyBtYXApLlxyXG4gIGNvbnN0IHN0cmluZ01hcCA9IHt9O1xyXG4gIGNvbnN0IHN0cmluZ01ldGFkYXRhID0ge307XHJcbiAgbG9jYWxlcy5mb3JFYWNoKCBsb2NhbGUgPT4ge1xyXG4gICAgc3RyaW5nTWFwWyBsb2NhbGUgXSA9IHt9O1xyXG4gIH0gKTtcclxuXHJcbiAgLy8gY29tYmluZSBvdXIgc3RyaW5ncyBpbnRvIFtsb2NhbGVdW3N0cmluZ0tleV0gbWFwLCB1c2luZyB0aGUgZmFsbGJhY2sgbG9jYWxlIHdoZXJlIG5lY2Vzc2FyeS4gSW4gcmVnYXJkcyB0byBuZXN0ZWRcclxuICAvLyBzdHJpbmdzLCB0aGlzIGRhdGEgc3RydWN0dXJlIGRvZXNuJ3QgbmVzdC4gSW5zdGVhZCBpdCBnZXRzIG5lc3RlZCBzdHJpbmcgdmFsdWVzLCBhbmQgdGhlbiBzZXRzIHRoZW0gd2l0aCB0aGVcclxuICAvLyBmbGF0IGtleSBzdHJpbmcgbGlrZSBgXCJGUklDVElPTi9hMTF5LnNvbWUuc3RyaW5nLmhlcmVcIjogeyB2YWx1ZTogJ015IFNvbWUgU3RyaW5nJyB9YFxyXG4gIHJlcG9zV2l0aFVzZWRTdHJpbmdzLmZvckVhY2goIHJlcG8gPT4ge1xyXG5cclxuICAgIC8vIFNjYW4gYWxsIG9mIHRoZSBmaWxlcyB3aXRoIHN0cmluZyBtb2R1bGUgcmVmZXJlbmNlcywgc2Nhbm5pbmcgZm9yIGFueXRoaW5nIHRoYXQgbG9va3MgbGlrZSBhIHN0cmluZyBhY2Nlc3MgZm9yXHJcbiAgICAvLyBvdXIgcmVwby4gVGhpcyB3aWxsIGluY2x1ZGUgdGhlIHN0cmluZyBtb2R1bGUgcmVmZXJlbmNlLCBlLmcuIGBKb2lzdFN0cmluZ3MuUmVzZXRBbGxCdXR0b24ubmFtZWAsIGJ1dCBjb3VsZCBhbHNvXHJcbiAgICAvLyBpbmNsdWRlIHNsaWdodGx5IG1vcmUgKHNpbmNlIHdlJ3JlIHN0cmluZyBwYXJzaW5nKSwgZS5nLiBgSm9pc3RTdHJpbmdzLlJlc2V0QWxsQnV0dG9uLm5hbWUubGVuZ3RoYCB3b3VsZCBiZVxyXG4gICAgLy8gaW5jbHVkZWQsIGV2ZW4gdGhvdWdoIG9ubHkgcGFydCBvZiB0aGF0IGlzIGEgc3RyaW5nIGFjY2Vzcy5cclxuICAgIGxldCBzdHJpbmdBY2Nlc3NlcyA9IFtdO1xyXG5cclxuICAgIGNvbnN0IHByZWZpeCA9IGAke3Bhc2NhbENhc2UoIHJlcG8gKX1TdHJpbmdzYDsgLy8gZS5nLiBKb2lzdFN0cmluZ3NcclxuICAgIHVzZWRGaWxlQ29udGVudHMuZm9yRWFjaCggKCBmaWxlQ29udGVudCwgaSApID0+IHtcclxuICAgICAgLy8gT25seSBzY2FuIGZpbGVzIHdoZXJlIHdlIGNhbiBpZGVudGlmeSBhbiBpbXBvcnQgZm9yIGl0XHJcbiAgICAgIGlmICggZmlsZUNvbnRlbnQuaW5jbHVkZXMoIGBpbXBvcnQgJHtwcmVmaXh9IGZyb21gICkgKSB7XHJcblxyXG4gICAgICAgIC8vIExvb2sgZm9yIG5vcm1hbCBtYXRjaGVzLCBlLmcuIGBKb2lzdFN0cmluZ3MuYCBmb2xsb3dlZCBieSBvbmUgb3IgbW9yZSBjaHVua3MgbGlrZTpcclxuICAgICAgICAvLyAuc29tZXRoaW5nVmFndWVseV9hbHBoYU51bTNyMWNcclxuICAgICAgICAvLyBbICdhU3RyaW5nSW5CcmFja2V0c0JlY2F1c2VPZlNwZWNpYWxDaGFyYWN0ZXJzJyBdXHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBJdCB3aWxsIGFsc28gdGhlbiBlbmQgb24gYW55dGhpbmcgdGhhdCBkb2Vzbid0IGxvb2sgbGlrZSBhbm90aGVyIG9uZSBvZiB0aG9zZSBjaHVua3NcclxuICAgICAgICAvLyBbYS16QS1aXyRdW2EtekEtWjAtOV8kXSogLS0tLSB0aGlzIGdyYWJzIHRoaW5ncyB0aGF0IGxvb2tzIGxpa2UgdmFsaWQgSlMgaWRlbnRpZmllcnNcclxuICAgICAgICAvLyBcXFxcWyAnW14nXSsnIFxcXFxdKSsgLS0tLSB0aGlzIGdyYWJzIHRoaW5ncyBsaWtlIG91ciBzZWNvbmQgY2FzZSBhYm92ZVxyXG4gICAgICAgIC8vIFteXFxcXC5cXFxcW10gLS0tLSBtYXRjaGVzIHNvbWV0aGluZyBhdCB0aGUgZW5kIHRoYXQgaXMgTk9UIGVpdGhlciBvZiB0aG9zZSBvdGhlciB0d28gY2FzZXNcclxuICAgICAgICAvLyBJdCBpcyBhbHNvIGdlbmVyYWxpemVkIHRvIHN1cHBvcnQgYXJiaXRyYXJ5IHdoaXRlc3BhY2UgYW5kIHJlcXVpcmVzIHRoYXQgJyBtYXRjaCAnIG9yIFwiIG1hdGNoIFwiLCBzaW5jZVxyXG4gICAgICAgIC8vIHRoaXMgbXVzdCBzdXBwb3J0IEpTIGNvZGUgYW5kIG1pbmlmaWVkIFR5cGVTY3JpcHQgY29kZVxyXG4gICAgICAgIC8vIE1hdGNoZXMgb25lIGZpbmFsIGNoYXJhY3RlciB0aGF0IGlzIG5vdCAnLicgb3IgJ1snLCBzaW5jZSBhbnkgdmFsaWQgc3RyaW5nIGFjY2Vzc2VzIHNob3VsZCBOT1QgaGF2ZSB0aGF0XHJcbiAgICAgICAgLy8gYWZ0ZXIuIE5PVEU6IHRoZXJlIGFyZSBzb21lIGRlZ2VuZXJhdGUgY2FzZXMgdGhhdCB3aWxsIGJyZWFrIHRoaXMsIGUuZy46XHJcbiAgICAgICAgLy8gLSBKb2lzdFN0cmluZ3Muc29tZVN0cmluZ1Byb3BlcnR5WyAwIF1cclxuICAgICAgICAvLyAtIEpvaXN0U3RyaW5ncy5zb21ldGhpbmdbIDAgXVxyXG4gICAgICAgIC8vIC0gSm9pc3RTdHJpbmdzLnNvbWV0aGluZ1sgJ2xlbmd0aCcgXVxyXG4gICAgICAgIGNvbnN0IG1hdGNoZXMgPSBmaWxlQ29udGVudC5tYXRjaCggbmV3IFJlZ0V4cCggYCR7cHJlZml4fShcXFxcLlthLXpBLVpfJF1bYS16QS1aMC05XyRdKnxcXFxcW1xcXFxzKlsnXCJdW14nXCJdK1snXCJdXFxcXHMqXFxcXF0pK1teXFxcXC5cXFxcW11gLCAnZycgKSApO1xyXG4gICAgICAgIGlmICggbWF0Y2hlcyApIHtcclxuICAgICAgICAgIHN0cmluZ0FjY2Vzc2VzLnB1c2goIC4uLm1hdGNoZXMubWFwKCBtYXRjaCA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBtYXRjaFxyXG4gICAgICAgICAgICAgIC8vIFdlIGFsd2F5cyBoYXZlIHRvIHN0cmlwIG9mZiB0aGUgbGFzdCBjaGFyYWN0ZXIgLSBpdCdzIGEgY2hhcmFjdGVyIHRoYXQgc2hvdWxkbid0IGJlIGluIGEgc3RyaW5nIGFjY2Vzc1xyXG4gICAgICAgICAgICAgIC5zbGljZSggMCwgbWF0Y2gubGVuZ3RoIC0gMSApXHJcbiAgICAgICAgICAgICAgLy8gSGFuZGxlIEpvaXN0U3RyaW5nc1sgJ3NvbWUtdGhpbmdTdHJpbmdQcm9wZXJ0eScgXS52YWx1ZSA9PiBKb2lzdFN0cmluZ3NbICdzb21lLXRoaW5nJyBdXHJcbiAgICAgICAgICAgICAgLy8gLS0gQW55dGhpbmcgYWZ0ZXIgU3RyaW5nUHJvcGVydHkgc2hvdWxkIGdvXHJcbiAgICAgICAgICAgICAgLy8gYXdheSwgYnV0IHdlIG5lZWQgdG8gYWRkIHRoZSBmaW5hbCAnXSB0byBtYWludGFpbiB0aGUgZm9ybWF0XHJcbiAgICAgICAgICAgICAgLnJlcGxhY2UoIC9TdHJpbmdQcm9wZXJ0eSddLiovLCAnXFwnXScgKVxyXG4gICAgICAgICAgICAgIC8vIEhhbmRsZSBKb2lzdFN0cmluZ3Muc29tZXRoaW5nU3RyaW5nUHJvcGVydHkudmFsdWUgPT4gSm9pc3RTdHJpbmdzLnNvbWV0aGluZ1xyXG4gICAgICAgICAgICAgIC5yZXBsYWNlKCAvU3RyaW5nUHJvcGVydHkuKi8sICcnICk7XHJcbiAgICAgICAgICB9ICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBTdHJpcCBvZmYgb3VyIHByZWZpeGVzLCBzbyBvdXIgc3RyaW5nQWNjZXNzZXMgd2lsbCBoYXZlIHRoaW5ncyBsaWtlIGAnUmVzZXRBbGxCdXR0b24ubmFtZSdgIGluc2lkZS5cclxuICAgIHN0cmluZ0FjY2Vzc2VzID0gXy51bmlxKCBzdHJpbmdBY2Nlc3NlcyApLm1hcCggc3RyID0+IHN0ci5zbGljZSggcHJlZml4Lmxlbmd0aCApICk7XHJcblxyXG4gICAgLy8gVGhlIEpTIG91dHB1dHRlZCBieSBUUyBpcyBtaW5pZmllZCBhbmQgbWlzc2luZyB0aGUgd2hpdGVzcGFjZVxyXG4gICAgY29uc3QgZGVwdGggPSAyO1xyXG5cclxuICAgIC8vIFR1cm4gZWFjaCBzdHJpbmcgYWNjZXNzIGludG8gYW4gYXJyYXkgb2YgcGFydHMsIGUuZy4gJy5SZXNldEFsbEJ1dHRvbi5uYW1lJyA9PiBbICdSZXNldEFsbEJ1dHRvbicsICduYW1lJyBdXHJcbiAgICAvLyBvciAnWyBcXCdBXFwnIF0uQlsgXFwnQ1xcJyBdJyA9PiBbICdBJywgJ0InLCAnQycgXVxyXG4gICAgLy8gUmVnZXggZ3JhYnMgZWl0aGVyIGAuaWRlbnRpZmllcmAgb3IgYFsgJ3RleHQnIF1gLlxyXG4gICAgY29uc3Qgc3RyaW5nS2V5c0J5UGFydHMgPSBzdHJpbmdBY2Nlc3Nlcy5tYXAoIGFjY2VzcyA9PiBhY2Nlc3MubWF0Y2goIC9cXC5bYS16QS1aXyRdW2EtekEtWjAtOV8kXSp8XFxbXFxzKlsnXCJdW14nXCJdK1snXCJdXFxzKlxcXS9nICkubWFwKCB0b2tlbiA9PiB7XHJcbiAgICAgIHJldHVybiB0b2tlbi5zdGFydHNXaXRoKCAnLicgKSA/IHRva2VuLnNsaWNlKCAxICkgOiB0b2tlbi5zbGljZSggZGVwdGgsIHRva2VuLmxlbmd0aCAtIGRlcHRoICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgICAvLyBDb25jYXRlbmF0ZSB0aGUgc3RyaW5nIHBhcnRzIGZvciBlYWNoIGFjY2VzcyBpbnRvIHNvbWV0aGluZyB0aGF0IGxvb2tzIGxpa2UgYSBwYXJ0aWFsIHN0cmluZyBrZXksIGUuZy5cclxuICAgIC8vIFsgJ1Jlc2V0QWxsQnV0dG9uJywgJ25hbWUnIF0gPT4gJ1Jlc2V0QWxsQnV0dG9uLm5hbWUnXHJcbiAgICBjb25zdCBwYXJ0aWFsU3RyaW5nS2V5cyA9IF8udW5pcSggc3RyaW5nS2V5c0J5UGFydHMubWFwKCBwYXJ0cyA9PiBwYXJ0cy5qb2luKCAnLicgKSApICkuZmlsdGVyKCBrZXkgPT4ga2V5ICE9PSAnanMnICk7XHJcblxyXG4gICAgLy8gRm9yIGVhY2ggc3RyaW5nIGtleSBhbmQgbG9jYWxlLCB3ZSdsbCBsb29rIHVwIHRoZSBzdHJpbmcgZW50cnkgYW5kIGZpbGwgaXQgaW50byB0aGUgc3RyaW5nTWFwXHJcbiAgICBwYXJ0aWFsU3RyaW5nS2V5cy5mb3JFYWNoKCBwYXJ0aWFsU3RyaW5nS2V5ID0+IHtcclxuICAgICAgbG9jYWxlcy5mb3JFYWNoKCBsb2NhbGUgPT4ge1xyXG4gICAgICAgIGxldCBzdHJpbmdFbnRyeSA9IG51bGw7XHJcbiAgICAgICAgZm9yICggY29uc3QgZmFsbGJhY2tMb2NhbGUgb2YgbG9jYWxlRmFsbGJhY2tzKCBsb2NhbGUgKSApIHtcclxuICAgICAgICAgIGNvbnN0IHN0cmluZ0ZpbGVDb250ZW50cyA9IHN0cmluZ0ZpbGVzQ29udGVudHNbIHJlcG8gXVsgZmFsbGJhY2tMb2NhbGUgXTtcclxuICAgICAgICAgIGlmICggc3RyaW5nRmlsZUNvbnRlbnRzICkge1xyXG4gICAgICAgICAgICBzdHJpbmdFbnRyeSA9IENoaXBwZXJTdHJpbmdVdGlscy5nZXRTdHJpbmdFbnRyeUZyb21NYXAoIHN0cmluZ0ZpbGVDb250ZW50cywgcGFydGlhbFN0cmluZ0tleSApO1xyXG4gICAgICAgICAgICBpZiAoIHN0cmluZ0VudHJ5ICkge1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggIXBhcnRpYWxTdHJpbmdLZXkuZW5kc1dpdGgoICdTdHJpbmdQcm9wZXJ0eScgKSApIHtcclxuICAgICAgICAgIGFzc2VydCggc3RyaW5nRW50cnkgIT09IG51bGwsIGBNaXNzaW5nIHN0cmluZyBpbmZvcm1hdGlvbiBmb3IgJHtyZXBvfSAke3BhcnRpYWxTdHJpbmdLZXl9YCApO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHN0cmluZ0tleSA9IGAke3JlcXVpcmVqc05hbWVzcGFjZU1hcFsgcmVwbyBdfS8ke3BhcnRpYWxTdHJpbmdLZXl9YDtcclxuICAgICAgICAgIHN0cmluZ01hcFsgbG9jYWxlIF1bIHN0cmluZ0tleSBdID0gc3RyaW5nRW50cnkudmFsdWU7XHJcbiAgICAgICAgICBpZiAoIHN0cmluZ0VudHJ5Lm1ldGFkYXRhICYmIGxvY2FsZSA9PT0gQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgKSB7XHJcbiAgICAgICAgICAgIHN0cmluZ01ldGFkYXRhWyBzdHJpbmdLZXkgXSA9IHN0cmluZ0VudHJ5Lm1ldGFkYXRhO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfSApO1xyXG4gIH0gKTtcclxuXHJcbiAgcmV0dXJuIHsgc3RyaW5nTWFwOiBzdHJpbmdNYXAsIHN0cmluZ01ldGFkYXRhOiBzdHJpbmdNZXRhZGF0YSB9O1xyXG59OyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLElBQU1BLENBQUMsR0FBR0MsT0FBTyxDQUFFLFFBQVMsQ0FBQztBQUM3QixJQUFNQyxNQUFNLEdBQUdELE9BQU8sQ0FBRSxRQUFTLENBQUM7QUFDbEMsSUFBTUUsZ0JBQWdCLEdB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