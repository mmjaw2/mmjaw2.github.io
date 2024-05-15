"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2020-2024, University of Colorado Boulder

/**
 * Sorts imports for a given file.
 *
 * This follows the Intellij/Webstorm defaults, where we do NOT sort based on the eventual name, but instead only based
 * on the import path (e.g. everything after the `from` in the import).
 *
 * This will attempt to group all of the imports in one block.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// 3rd-party packages
var _ = require('lodash');
var fs = require('fs');

// constants
var disallowedComments = ['// modules', '// images', '// strings', '// mipmaps'];
var isImport = function isImport(line) {
  return line.startsWith('import ');
};

/**
 * @param {string} file
 * @param {boolean} verifyOnly - Don't rewrite file, just verify already sorted
 * @returns {boolean} - Was the file properly sorted to begin with?
 */
module.exports = function (file) {
  var verifyOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var before = fs.readFileSync(file, 'utf-8');
  var lines = before.split(/\r?\n/);

  // remove the grouping comments
  lines = lines.filter(function (line, i) {
    var nextLine = lines[i + 1];
    return !disallowedComments.includes(line) || !nextLine || !isImport(nextLine);
  });

  // pull out and sort imports
  var firstImportIndex = _.findIndex(lines, isImport);
  var importLines = lines.filter(isImport);
  var nonImportLines = lines.filter(_.negate(isImport));
  lines = [].concat(_toConsumableArray(nonImportLines.slice(0, firstImportIndex)), _toConsumableArray(_.sortBy(importLines, function (line) {
    return line.slice(line.indexOf('\'')).toLowerCase();
  })), _toConsumableArray(nonImportLines.slice(firstImportIndex)));

  // get rid of blank lines
  var lastImportIndex = _.findLastIndex(lines, isImport);
  var afterLastImportIndex = lastImportIndex + 1;
  while (lines[afterLastImportIndex].length === 0 && lines[lastImportIndex + 2].length === 0) {
    lines.splice(afterLastImportIndex, 1);
  }

  // add a blank line after imports if there was none
  if (lines[afterLastImportIndex].length !== 0) {
    lines.splice(afterLastImportIndex, 0, '');
  }

  // remove multiple blank lines above the imports
  while (lines[firstImportIndex - 1] === '' && lines[firstImportIndex - 2] === '') {
    lines.splice(firstImportIndex - 1, 1);
    firstImportIndex--;
  }
  var after = lines.join('\n');
  if (!verifyOnly) {
    fs.writeFileSync(file, after, 'utf-8');
  }
  return after === before;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImZzIiwiZGlzYWxsb3dlZENvbW1lbnRzIiwiaXNJbXBvcnQiLCJsaW5lIiwic3RhcnRzV2l0aCIsIm1vZHVsZSIsImV4cG9ydHMiLCJmaWxlIiwidmVyaWZ5T25seSIsImFyZ3VtZW50cyIsImxlbmd0aCIsInVuZGVmaW5lZCIsImJlZm9yZSIsInJlYWRGaWxlU3luYyIsImxpbmVzIiwic3BsaXQiLCJmaWx0ZXIiLCJpIiwibmV4dExpbmUiLCJpbmNsdWRlcyIsImZpcnN0SW1wb3J0SW5kZXgiLCJmaW5kSW5kZXgiLCJpbXBvcnRMaW5lcyIsIm5vbkltcG9ydExpbmVzIiwibmVnYXRlIiwiY29uY2F0IiwiX3RvQ29uc3VtYWJsZUFycmF5Iiwic2xpY2UiLCJzb3J0QnkiLCJpbmRleE9mIiwidG9Mb3dlckNhc2UiLCJsYXN0SW1wb3J0SW5kZXgiLCJmaW5kTGFzdEluZGV4IiwiYWZ0ZXJMYXN0SW1wb3J0SW5kZXgiLCJzcGxpY2UiLCJhZnRlciIsImpvaW4iLCJ3cml0ZUZpbGVTeW5jIl0sInNvdXJjZXMiOlsic29ydEltcG9ydHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU29ydHMgaW1wb3J0cyBmb3IgYSBnaXZlbiBmaWxlLlxyXG4gKlxyXG4gKiBUaGlzIGZvbGxvd3MgdGhlIEludGVsbGlqL1dlYnN0b3JtIGRlZmF1bHRzLCB3aGVyZSB3ZSBkbyBOT1Qgc29ydCBiYXNlZCBvbiB0aGUgZXZlbnR1YWwgbmFtZSwgYnV0IGluc3RlYWQgb25seSBiYXNlZFxyXG4gKiBvbiB0aGUgaW1wb3J0IHBhdGggKGUuZy4gZXZlcnl0aGluZyBhZnRlciB0aGUgYGZyb21gIGluIHRoZSBpbXBvcnQpLlxyXG4gKlxyXG4gKiBUaGlzIHdpbGwgYXR0ZW1wdCB0byBncm91cCBhbGwgb2YgdGhlIGltcG9ydHMgaW4gb25lIGJsb2NrLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuXHJcbi8vIDNyZC1wYXJ0eSBwYWNrYWdlc1xyXG5jb25zdCBfID0gcmVxdWlyZSggJ2xvZGFzaCcgKTtcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgZGlzYWxsb3dlZENvbW1lbnRzID0gW1xyXG4gICcvLyBtb2R1bGVzJyxcclxuICAnLy8gaW1hZ2VzJyxcclxuICAnLy8gc3RyaW5ncycsXHJcbiAgJy8vIG1pcG1hcHMnXHJcbl07XHJcbmNvbnN0IGlzSW1wb3J0ID0gbGluZSA9PiBsaW5lLnN0YXJ0c1dpdGgoICdpbXBvcnQgJyApO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdmVyaWZ5T25seSAtIERvbid0IHJld3JpdGUgZmlsZSwganVzdCB2ZXJpZnkgYWxyZWFkeSBzb3J0ZWRcclxuICogQHJldHVybnMge2Jvb2xlYW59IC0gV2FzIHRoZSBmaWxlIHByb3Blcmx5IHNvcnRlZCB0byBiZWdpbiB3aXRoP1xyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggZmlsZSwgdmVyaWZ5T25seSA9IGZhbHNlICkge1xyXG4gIGNvbnN0IGJlZm9yZSA9IGZzLnJlYWRGaWxlU3luYyggZmlsZSwgJ3V0Zi04JyApO1xyXG4gIGxldCBsaW5lcyA9IGJlZm9yZS5zcGxpdCggL1xccj9cXG4vICk7XHJcblxyXG4gIC8vIHJlbW92ZSB0aGUgZ3JvdXBpbmcgY29tbWVudHNcclxuICBsaW5lcyA9IGxpbmVzLmZpbHRlciggKCBsaW5lLCBpICkgPT4ge1xyXG4gICAgY29uc3QgbmV4dExpbmUgPSBsaW5lc1sgaSArIDEgXTtcclxuICAgIHJldHVybiAhZGlzYWxsb3dlZENvbW1lbnRzLmluY2x1ZGVzKCBsaW5lICkgfHwgIW5leHRMaW5lIHx8ICFpc0ltcG9ydCggbmV4dExpbmUgKTtcclxuICB9ICk7XHJcblxyXG4gIC8vIHB1bGwgb3V0IGFuZCBzb3J0IGltcG9ydHNcclxuICBsZXQgZmlyc3RJbXBvcnRJbmRleCA9IF8uZmluZEluZGV4KCBsaW5lcywgaXNJbXBvcnQgKTtcclxuICBjb25zdCBpbXBvcnRMaW5lcyA9IGxpbmVzLmZpbHRlciggaXNJbXBvcnQgKTtcclxuICBjb25zdCBub25JbXBvcnRMaW5lcyA9IGxpbmVzLmZpbHRlciggXy5uZWdhdGUoIGlzSW1wb3J0ICkgKTtcclxuICBsaW5lcyA9IFtcclxuICAgIC4uLm5vbkltcG9ydExpbmVzLnNsaWNlKCAwLCBmaXJzdEltcG9ydEluZGV4ICksXHJcbiAgICAuLi5fLnNvcnRCeSggaW1wb3J0TGluZXMsIGxpbmUgPT4gbGluZS5zbGljZSggbGluZS5pbmRleE9mKCAnXFwnJyApICkudG9Mb3dlckNhc2UoKSApLCAvLyBzb3J0IGFmdGVyIHRoZSBmaXJzdCAnXHJcbiAgICAuLi5ub25JbXBvcnRMaW5lcy5zbGljZSggZmlyc3RJbXBvcnRJbmRleCApXHJcbiAgXTtcclxuXHJcbiAgLy8gZ2V0IHJpZCBvZiBibGFuayBsaW5lc1xyXG4gIGNvbnN0IGxhc3RJbXBvcnRJbmRleCA9IF8uZmluZExhc3RJbmRleCggbGluZXMsIGlzSW1wb3J0ICk7XHJcbiAgY29uc3QgYWZ0ZXJMYXN0SW1wb3J0SW5kZXggPSBsYXN0SW1wb3J0SW5kZXggKyAxO1xyXG4gIHdoaWxlICggbGluZXNbIGFmdGVyTGFzdEltcG9ydEluZGV4IF0ubGVuZ3RoID09PSAwICYmIGxpbmVzWyBsYXN0SW1wb3J0SW5kZXggKyAyIF0ubGVuZ3RoID09PSAwICkge1xyXG4gICAgbGluZXMuc3BsaWNlKCBhZnRlckxhc3RJbXBvcnRJbmRleCwgMSApO1xyXG4gIH1cclxuXHJcbiAgLy8gYWRkIGEgYmxhbmsgbGluZSBhZnRlciBpbXBvcnRzIGlmIHRoZXJlIHdhcyBub25lXHJcbiAgaWYgKCBsaW5lc1sgYWZ0ZXJMYXN0SW1wb3J0SW5kZXggXS5sZW5ndGggIT09IDAgKSB7XHJcbiAgICBsaW5lcy5zcGxpY2UoIGFmdGVyTGFzdEltcG9ydEluZGV4LCAwLCAnJyApO1xyXG4gIH1cclxuXHJcbiAgLy8gcmVtb3ZlIG11bHRpcGxlIGJsYW5rIGxpbmVzIGFib3ZlIHRoZSBpbXBvcnRzXHJcbiAgd2hpbGUgKCBsaW5lc1sgZmlyc3RJbXBvcnRJbmRleCAtIDEgXSA9PT0gJycgJiYgbGluZXNbIGZpcnN0SW1wb3J0SW5kZXggLSAyIF0gPT09ICcnICkge1xyXG4gICAgbGluZXMuc3BsaWNlKCBmaXJzdEltcG9ydEluZGV4IC0gMSwgMSApO1xyXG4gICAgZmlyc3RJbXBvcnRJbmRleC0tO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgYWZ0ZXIgPSBsaW5lcy5qb2luKCAnXFxuJyApO1xyXG4gIGlmICggIXZlcmlmeU9ubHkgKSB7XHJcbiAgICBmcy53cml0ZUZpbGVTeW5jKCBmaWxlLCBhZnRlciwgJ3V0Zi04JyApO1xyXG4gIH1cclxuICByZXR1cm4gKCBhZnRlciA9PT0gYmVmb3JlICk7XHJcbn07Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBO0FBQ0EsSUFBTUEsQ0FBQyxHQUFHQyxPQUFPLENBQUUsUUFBUyxDQUFDO0FBQzdCLElBQU1DLEVBQUUsR0FBR0QsT0FBTyxDQUFFLElBQUssQ0FBQzs7QUFFMUI7QUFDQSxJQUFNRSxrQkFBa0IsR0FBRyxDQUN6QixZQUFZLEVBQ1osV0FBVyxFQUNYLFlBQVksRUFDWixZQUFZLENBQ2I7QUFDRCxJQUFNQyxRQUFRLEdBQUcsU0FBWEEsUUFBUUEsQ0FBR0MsSUFBSTtFQUFBLE9BQUlBLElBQUksQ0FBQ0MsVUFBVSxDQUFFLFNBQVUsQ0FBQztBQUFBOztBQUVyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FDLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVD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