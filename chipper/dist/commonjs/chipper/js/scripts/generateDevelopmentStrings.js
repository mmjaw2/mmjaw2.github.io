"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2022-2024, University of Colorado Boulder

/**
 * This script makes a JSON file that combines translations for all locales in a repo. Each locale object has every
 * string key/translated-value pair we have for that locale. This is used when running the unbuilt mode simulation with
 * locales=*
 *
 * @author Liam Mulhall (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

// imports
var fs = require('fs');
var path = require('path');

/**
 * @param {string} repo - repo to generate strings for
 */
module.exports = function (repo) {
  var start = Date.now();
  var rootPath = path.join(__dirname, '..', '..', '..');

  // OS-independent path to babel repo.
  var babelPath = path.join(rootPath, 'babel');

  // Create a file name for the conglomerate string file.
  var conglomerateStringFileName = "".concat(repo, "_all.json");

  // Create an empty object for the conglomerate string file that we will add to later.
  var conglomerateStringObject = {};

  // Get an array of files (string files) in the repo subdirectory.
  var babelRepoPath = path.join(babelPath, repo);

  // Regex for extracting locale from file name.
  var localeRegex = /(?<=_)(.*)(?=.json)/;
  var stringFiles = [];
  try {
    var paths = fs.readdirSync(babelRepoPath);
    stringFiles.push.apply(stringFiles, _toConsumableArray(paths.map(function (p) {
      return path.join(babelRepoPath, p);
    })));
  } catch (e) {

    // no translations found in babel. But we still must continue in order to generate an (albeit empty) string file.
  }
  var englishStringPath = path.join(rootPath, repo, "".concat(repo, "-strings_en.json"));
  if (fs.existsSync(englishStringPath)) {
    stringFiles.push(englishStringPath);
  }
  var localeData = JSON.parse(fs.readFileSync('../babel/localeData.json', 'utf8'));

  // Do not generate a file if no translations were found.
  if (stringFiles.length > 0) {
    // For each string file in the repo subdirectory...
    var _iterator = _createForOfIteratorHelper(stringFiles),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var stringFile = _step.value;
        // Extract the locale.
        var join = stringFile.split('\\').join('/');
        var localeMatches = join.substring(join.lastIndexOf('/')).match(localeRegex);
        var locale = localeMatches[0];
        if (!localeData[locale]) {
          console.log('[WARNING] Locale not found in localeData.json: ' + locale);
          continue;
        }

        // Get the contents of the string file.
        var stringFileContents = fs.readFileSync(stringFile, 'utf8');

        // Parse the string file contents.
        var parsedStringFileContents = JSON.parse(stringFileContents);

        // Add only the values of the string file to the new conglomerate string file, and ignore other fields, such as
        // the history.
        var objectToAddToLocale = {};
        for (var _i = 0, _Object$keys = Object.keys(parsedStringFileContents); _i < _Object$keys.length; _i++) {
          var stringKey = _Object$keys[_i];
          objectToAddToLocale[stringKey] = {
            value: parsedStringFileContents[stringKey].value
          };
        }

        // Add the string values to the locale object of the conglomerate string object.
        conglomerateStringObject[locale] = objectToAddToLocale;
      }

      // Make sure the output directory exists.  The name starts with an underscore so that it appears alphabetically
      // first and looks different from the repo names.
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    var outputDir = path.join(babelPath, '_generated_development_strings');
    try {
      fs.mkdirSync(outputDir);
    } catch (e) {
      // already exists
    }
    var outputPath = path.join(outputDir, conglomerateStringFileName);
    fs.writeFileSync(outputPath, JSON.stringify(conglomerateStringObject, null, 2));
    var end = Date.now();
    console.log('Wrote ' + outputPath + ' in ' + (end - start) + 'ms');
  } else {
    console.log('no translations found');
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJwYXRoIiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJzdGFydCIsIkRhdGUiLCJub3ciLCJyb290UGF0aCIsImpvaW4iLCJfX2Rpcm5hbWUiLCJiYWJlbFBhdGgiLCJjb25nbG9tZXJhdGVTdHJpbmdGaWxlTmFtZSIsImNvbmNhdCIsImNvbmdsb21lcmF0ZVN0cmluZ09iamVjdCIsImJhYmVsUmVwb1BhdGgiLCJsb2NhbGVSZWdleCIsInN0cmluZ0ZpbGVzIiwicGF0aHMiLCJyZWFkZGlyU3luYyIsInB1c2giLCJhcHBseSIsIl90b0NvbnN1bWFibGVBcnJheSIsIm1hcCIsInAiLCJlIiwiZW5nbGlzaFN0cmluZ1BhdGgiLCJleGlzdHNTeW5jIiwibG9jYWxlRGF0YSIsIkpTT04iLCJwYXJzZSIsInJlYWRGaWxlU3luYyIsImxlbmd0aCIsIl9pdGVyYXRvciIsIl9jcmVhdGVGb3JPZkl0ZXJhdG9ySGVscGVyIiwiX3N0ZXAiLCJzIiwibiIsImRvbmUiLCJzdHJpbmdGaWxlIiwidmFsdWUiLCJzcGxpdCIsImxvY2FsZU1hdGNoZXMiLCJzdWJzdHJpbmciLCJsYXN0SW5kZXhPZiIsIm1hdGNoIiwibG9jYWxlIiwiY29uc29sZSIsImxvZyIsInN0cmluZ0ZpbGVDb250ZW50cyIsInBhcnNlZFN0cmluZ0ZpbGVDb250ZW50cyIsIm9iamVjdFRvQWRkVG9Mb2NhbGUiLCJfaSIsIl9PYmplY3Qka2V5cyIsIk9iamVjdCIsImtleXMiLCJzdHJpbmdLZXkiLCJlcnIiLCJmIiwib3V0cHV0RGlyIiwibWtkaXJTeW5jIiwib3V0cHV0UGF0aCIsIndyaXRlRmlsZVN5bmMiLCJzdHJpbmdpZnkiLCJlbmQiXSwic291cmNlcyI6WyJnZW5lcmF0ZURldmVsb3BtZW50U3RyaW5ncy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUaGlzIHNjcmlwdCBtYWtlcyBhIEpTT04gZmlsZSB0aGF0IGNvbWJpbmVzIHRyYW5zbGF0aW9ucyBmb3IgYWxsIGxvY2FsZXMgaW4gYSByZXBvLiBFYWNoIGxvY2FsZSBvYmplY3QgaGFzIGV2ZXJ5XHJcbiAqIHN0cmluZyBrZXkvdHJhbnNsYXRlZC12YWx1ZSBwYWlyIHdlIGhhdmUgZm9yIHRoYXQgbG9jYWxlLiBUaGlzIGlzIHVzZWQgd2hlbiBydW5uaW5nIHRoZSB1bmJ1aWx0IG1vZGUgc2ltdWxhdGlvbiB3aXRoXHJcbiAqIGxvY2FsZXM9KlxyXG4gKlxyXG4gKiBAYXV0aG9yIExpYW0gTXVsaGFsbCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG4vLyBpbXBvcnRzXHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5jb25zdCBwYXRoID0gcmVxdWlyZSggJ3BhdGgnICk7XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSByZXBvIHRvIGdlbmVyYXRlIHN0cmluZ3MgZm9yXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IHJlcG8gPT4ge1xyXG5cclxuICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XHJcblxyXG4gIGNvbnN0IHJvb3RQYXRoID0gcGF0aC5qb2luKCBfX2Rpcm5hbWUsICcuLicsICcuLicsICcuLicgKTtcclxuXHJcbiAgLy8gT1MtaW5kZXBlbmRlbnQgcGF0aCB0byBiYWJlbCByZXBvLlxyXG4gIGNvbnN0IGJhYmVsUGF0aCA9IHBhdGguam9pbiggcm9vdFBhdGgsICdiYWJlbCcgKTtcclxuXHJcbiAgLy8gQ3JlYXRlIGEgZmlsZSBuYW1lIGZvciB0aGUgY29uZ2xvbWVyYXRlIHN0cmluZyBmaWxlLlxyXG4gIGNvbnN0IGNvbmdsb21lcmF0ZVN0cmluZ0ZpbGVOYW1lID0gYCR7cmVwb31fYWxsLmpzb25gO1xyXG5cclxuICAvLyBDcmVhdGUgYW4gZW1wdHkgb2JqZWN0IGZvciB0aGUgY29uZ2xvbWVyYXRlIHN0cmluZyBmaWxlIHRoYXQgd2Ugd2lsbCBhZGQgdG8gbGF0ZXIuXHJcbiAgY29uc3QgY29uZ2xvbWVyYXRlU3RyaW5nT2JqZWN0ID0ge307XHJcblxyXG4gIC8vIEdldCBhbiBhcnJheSBvZiBmaWxlcyAoc3RyaW5nIGZpbGVzKSBpbiB0aGUgcmVwbyBzdWJkaXJlY3RvcnkuXHJcbiAgY29uc3QgYmFiZWxSZXBvUGF0aCA9IHBhdGguam9pbiggYmFiZWxQYXRoLCByZXBvICk7XHJcblxyXG4gIC8vIFJlZ2V4IGZvciBleHRyYWN0aW5nIGxvY2FsZSBmcm9tIGZpbGUgbmFtZS5cclxuICBjb25zdCBsb2NhbGVSZWdleCA9IC8oPzw9XykoLiopKD89Lmpzb24pLztcclxuXHJcbiAgY29uc3Qgc3RyaW5nRmlsZXMgPSBbXTtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcGF0aHMgPSBmcy5yZWFkZGlyU3luYyggYmFiZWxSZXBvUGF0aCApO1xyXG4gICAgc3RyaW5nRmlsZXMucHVzaCggLi4ucGF0aHMubWFwKCBwID0+IHBhdGguam9pbiggYmFiZWxSZXBvUGF0aCwgcCApICkgKTtcclxuICB9XHJcbiAgY2F0Y2goIGUgKSB7XHJcblxyXG4gICAgLy8gbm8gdHJhbnNsYXRpb25zIGZvdW5kIGluIGJhYmVsLiBCdXQgd2Ugc3RpbGwgbXVzdCBjb250aW51ZSBpbiBvcmRlciB0byBnZW5lcmF0ZSBhbiAoYWxiZWl0IGVtcHR5KSBzdHJpbmcgZmlsZS5cclxuICB9XHJcblxyXG4gIGNvbnN0IGVuZ2xpc2hTdHJpbmdQYXRoID0gcGF0aC5qb2luKCByb290UGF0aCwgcmVwbywgYCR7cmVwb30tc3RyaW5nc19lbi5qc29uYCApO1xyXG4gIGlmICggZnMuZXhpc3RzU3luYyggZW5nbGlzaFN0cmluZ1BhdGggKSApIHtcclxuICAgIHN0cmluZ0ZpbGVzLnB1c2goIGVuZ2xpc2hTdHJpbmdQYXRoICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb2NhbGVEYXRhID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCAnLi4vYmFiZWwvbG9jYWxlRGF0YS5qc29uJywgJ3V0ZjgnICkgKTtcclxuXHJcbiAgLy8gRG8gbm90IGdlbmVyYXRlIGEgZmlsZSBpZiBubyB0cmFuc2xhdGlvbnMgd2VyZSBmb3VuZC5cclxuICBpZiAoIHN0cmluZ0ZpbGVzLmxlbmd0aCA+IDAgKSB7XHJcblxyXG4gICAgLy8gRm9yIGVhY2ggc3RyaW5nIGZpbGUgaW4gdGhlIHJlcG8gc3ViZGlyZWN0b3J5Li4uXHJcbiAgICBmb3IgKCBjb25zdCBzdHJpbmdGaWxlIG9mIHN0cmluZ0ZpbGVzICkge1xyXG5cclxuICAgICAgLy8gRXh0cmFjdCB0aGUgbG9jYWxlLlxyXG4gICAgICBjb25zdCBqb2luID0gc3RyaW5nRmlsZS5zcGxpdCggJ1xcXFwnICkuam9pbiggJy8nICk7XHJcbiAgICAgIGNvbnN0IGxvY2FsZU1hdGNoZXMgPSBqb2luLnN1YnN0cmluZyggam9pbi5sYXN0SW5kZXhPZiggJy8nICkgKS5tYXRjaCggbG9jYWxlUmVnZXggKTtcclxuICAgICAgY29uc3QgbG9jYWxlID0gbG9jYWxlTWF0Y2hlc1sgMCBdO1xyXG5cclxuICAgICAgaWYgKCAhbG9jYWxlRGF0YVsgbG9jYWxlIF0gKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coICdbV0FSTklOR10gTG9jYWxlIG5vdCBmb3VuZCBpbiBsb2NhbGVEYXRhLmpzb246ICcgKyBsb2NhbGUgKTtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gR2V0IHRoZSBjb250ZW50cyBvZiB0aGUgc3RyaW5nIGZpbGUuXHJcbiAgICAgIGNvbnN0IHN0cmluZ0ZpbGVDb250ZW50cyA9IGZzLnJlYWRGaWxlU3luYyggc3RyaW5nRmlsZSwgJ3V0ZjgnICk7XHJcblxyXG4gICAgICAvLyBQYXJzZSB0aGUgc3RyaW5nIGZpbGUgY29udGVudHMuXHJcbiAgICAgIGNvbnN0IHBhcnNlZFN0cmluZ0ZpbGVDb250ZW50cyA9IEpTT04ucGFyc2UoIHN0cmluZ0ZpbGVDb250ZW50cyApO1xyXG5cclxuICAgICAgLy8gQWRkIG9ubHkgdGhlIHZhbHVlcyBvZiB0aGUgc3RyaW5nIGZpbGUgdG8gdGhlIG5ldyBjb25nbG9tZXJhdGUgc3RyaW5nIGZpbGUsIGFuZCBpZ25vcmUgb3RoZXIgZmllbGRzLCBzdWNoIGFzXHJcbiAgICAgIC8vIHRoZSBoaXN0b3J5LlxyXG4gICAgICBjb25zdCBvYmplY3RUb0FkZFRvTG9jYWxlID0ge307XHJcbiAgICAgIGZvciAoIGNvbnN0IHN0cmluZ0tleSBvZiBPYmplY3Qua2V5cyggcGFyc2VkU3RyaW5nRmlsZUNvbnRlbnRzICkgKSB7XHJcbiAgICAgICAgb2JqZWN0VG9BZGRUb0xvY2FsZVsgc3RyaW5nS2V5IF0gPSB7XHJcbiAgICAgICAgICB2YWx1ZTogcGFyc2VkU3RyaW5nRmlsZUNvbnRlbnRzWyBzdHJpbmdLZXkgXS52YWx1ZVxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEFkZCB0aGUgc3RyaW5nIHZhbHVlcyB0byB0aGUgbG9jYWxlIG9iamVjdCBvZiB0aGUgY29uZ2xvbWVyYXRlIHN0cmluZyBvYmplY3QuXHJcbiAgICAgIGNvbmdsb21lcmF0ZVN0cmluZ09iamVjdFsgbG9jYWxlIF0gPSBvYmplY3RUb0FkZFRvTG9jYWxlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgb3V0cHV0IGRpcmVjdG9yeSBleGlzdHMuICBUaGUgbmFtZSBzdGFydHMgd2l0aCBhbiB1bmRlcnNjb3JlIHNvIHRoYXQgaXQgYXBwZWFycyBhbHBoYWJldGljYWxseVxyXG4gICAgLy8gZmlyc3QgYW5kIGxvb2tzIGRpZmZlcmVudCBmcm9tIHRoZSByZXBvIG5hbWVzLlxyXG4gICAgY29uc3Qgb3V0cHV0RGlyID0gcGF0aC5qb2luKCBiYWJlbFBhdGgsICdfZ2VuZXJhdGVkX2RldmVsb3BtZW50X3N0cmluZ3MnICk7XHJcbiAgICB0cnkge1xyXG4gICAgICBmcy5ta2RpclN5bmMoIG91dHB1dERpciApO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgIC8vIGFscmVhZHkgZXhpc3RzXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgb3V0cHV0UGF0aCA9IHBhdGguam9pbiggb3V0cHV0RGlyLCBjb25nbG9tZXJhdGVTdHJpbmdGaWxlTmFtZSApO1xyXG4gICAgZnMud3JpdGVGaWxlU3luYyggb3V0cHV0UGF0aCwgSlNPTi5zdHJpbmdpZnkoIGNvbmdsb21lcmF0ZVN0cmluZ09iamVjdCwgbnVsbCwgMiApICk7XHJcblxyXG4gICAgY29uc3QgZW5kID0gRGF0ZS5ub3coKTtcclxuICAgIGNvbnNvbGUubG9nKCAnV3JvdGUgJyArIG91dHB1dFBhdGggKyAnIGluICcgKyAoIGVuZCAtIHN0YXJ0ICkgKyAnbXMnICk7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgY29uc29sZS5sb2coICdubyB0cmFuc2xhdGlvbnMgZm91bmQnICk7XHJcbiAgfVxyXG59OyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLElBQU1BLEVBQUUsR0FBR0MsT0FBTyxDQUFFLElBQUssQ0FBQztBQUMxQixJQUFNQyxJQUFJLEdBQUdELE9BQU8sQ0FBRSxNQUFPLENBQUM7O0FBRTlCO0FBQ0E7QUFDQTtBQUNBRSxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFBQyxJQUFJLEVBQUk7RUFFdkIsSUFBTUMsS0FBSyxHQUFHQyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDO0VBRXhCLElBQU1DLFFBQVEsR0FBR1AsSUFBSSxDQUFDUSxJQUFJLENBQUVDLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUssQ0FBQzs7RUFFekQ7RUFDQSxJQUFNQyxTQUFTLEdBQUdWLElBQUksQ0FBQ1EsSUFBSSxDQUFFRCxRQUFRLEVBQUUsT0FB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