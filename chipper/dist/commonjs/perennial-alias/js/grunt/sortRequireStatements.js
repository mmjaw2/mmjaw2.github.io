"use strict";

// Copyright 2015, University of Colorado Boulder

/**
 * Sorts require statements for each file in the js/ directory
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// 3rd-party packages
var _ = require('lodash');
var grunt = require('grunt');

// constants
var KEY = ' = require( '; // the substring that is searched to find require statements

/**
 * @param {string} path
 */
module.exports = function (path) {
  // only address js files
  if (path.indexOf('.js')) {
    // read the file as text
    var text = grunt.file.read(path).toString();

    // split by line
    var lines = text.split(/\r?\n/);

    // full text
    var result = [];

    // accumulated require statement lines
    var accumulator = [];

    // total number of require statements
    var count = 0;
    var _loop = function _loop() {
      var line = lines[i];

      // If it was a require statement, store it for sorting.
      if (line.indexOf(KEY) >= 0) {
        accumulator.push(line);
        count++;
      } else {
        // Not a require statement, sort and flush any pending require statements then continue
        accumulator = _.sortBy(accumulator, function (o) {
          // sort by the beginning of the line, including 'const X = require("PATH/dir/X")
          // case insensitive so that inherit and namespaces don't show up last
          return o.toLowerCase();
        });
        var previous = null;
        accumulator.forEach(function (a) {
          // Omit duplicate require statements
          if (a !== previous) {
            result.push(a);
          }
          previous = a;
        });
        accumulator.length = 0;
        result.push(line);
      }
    };
    for (var i = 0; i < lines.length; i++) {
      _loop();
    }
    grunt.file.write(path, result.join('\n'));
    grunt.log.writeln("sorted ".concat(count, " require statements in ").concat(path));
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImdydW50IiwiS0VZIiwibW9kdWxlIiwiZXhwb3J0cyIsInBhdGgiLCJpbmRleE9mIiwidGV4dCIsImZpbGUiLCJyZWFkIiwidG9TdHJpbmciLCJsaW5lcyIsInNwbGl0IiwicmVzdWx0IiwiYWNjdW11bGF0b3IiLCJjb3VudCIsIl9sb29wIiwibGluZSIsImkiLCJwdXNoIiwic29ydEJ5IiwibyIsInRvTG93ZXJDYXNlIiwicHJldmlvdXMiLCJmb3JFYWNoIiwiYSIsImxlbmd0aCIsIndyaXRlIiwiam9pbiIsImxvZyIsIndyaXRlbG4iLCJjb25jYXQiXSwic291cmNlcyI6WyJzb3J0UmVxdWlyZVN0YXRlbWVudHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTUsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFNvcnRzIHJlcXVpcmUgc3RhdGVtZW50cyBmb3IgZWFjaCBmaWxlIGluIHRoZSBqcy8gZGlyZWN0b3J5XHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuLy8gM3JkLXBhcnR5IHBhY2thZ2VzXHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5jb25zdCBncnVudCA9IHJlcXVpcmUoICdncnVudCcgKTtcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBLRVkgPSAnID0gcmVxdWlyZSggJzsgLy8gdGhlIHN1YnN0cmluZyB0aGF0IGlzIHNlYXJjaGVkIHRvIGZpbmQgcmVxdWlyZSBzdGF0ZW1lbnRzXHJcblxyXG4vKipcclxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIHBhdGggKSB7XHJcblxyXG4gIC8vIG9ubHkgYWRkcmVzcyBqcyBmaWxlc1xyXG4gIGlmICggcGF0aC5pbmRleE9mKCAnLmpzJyApICkge1xyXG5cclxuICAgIC8vIHJlYWQgdGhlIGZpbGUgYXMgdGV4dFxyXG4gICAgY29uc3QgdGV4dCA9IGdydW50LmZpbGUucmVhZCggcGF0aCApLnRvU3RyaW5nKCk7XHJcblxyXG4gICAgLy8gc3BsaXQgYnkgbGluZVxyXG4gICAgY29uc3QgbGluZXMgPSB0ZXh0LnNwbGl0KCAvXFxyP1xcbi8gKTtcclxuXHJcbiAgICAvLyBmdWxsIHRleHRcclxuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG5cclxuICAgIC8vIGFjY3VtdWxhdGVkIHJlcXVpcmUgc3RhdGVtZW50IGxpbmVzXHJcbiAgICBsZXQgYWNjdW11bGF0b3IgPSBbXTtcclxuXHJcbiAgICAvLyB0b3RhbCBudW1iZXIgb2YgcmVxdWlyZSBzdGF0ZW1lbnRzXHJcbiAgICBsZXQgY291bnQgPSAwO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBsaW5lID0gbGluZXNbIGkgXTtcclxuXHJcbiAgICAgIC8vIElmIGl0IHdhcyBhIHJlcXVpcmUgc3RhdGVtZW50LCBzdG9yZSBpdCBmb3Igc29ydGluZy5cclxuICAgICAgaWYgKCBsaW5lLmluZGV4T2YoIEtFWSApID49IDAgKSB7XHJcbiAgICAgICAgYWNjdW11bGF0b3IucHVzaCggbGluZSApO1xyXG4gICAgICAgIGNvdW50Kys7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgIC8vIE5vdCBhIHJlcXVpcmUgc3RhdGVtZW50LCBzb3J0IGFuZCBmbHVzaCBhbnkgcGVuZGluZyByZXF1aXJlIHN0YXRlbWVudHMgdGhlbiBjb250aW51ZVxyXG4gICAgICAgIGFjY3VtdWxhdG9yID0gXy5zb3J0QnkoIGFjY3VtdWxhdG9yLCBvID0+IHtcclxuXHJcbiAgICAgICAgICAvLyBzb3J0IGJ5IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmUsIGluY2x1ZGluZyAnY29uc3QgWCA9IHJlcXVpcmUoXCJQQVRIL2Rpci9YXCIpXHJcbiAgICAgICAgICAvLyBjYXNlIGluc2Vuc2l0aXZlIHNvIHRoYXQgaW5oZXJpdCBhbmQgbmFtZXNwYWNlcyBkb24ndCBzaG93IHVwIGxhc3RcclxuICAgICAgICAgIHJldHVybiBvLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgfSApO1xyXG4gICAgICAgIGxldCBwcmV2aW91cyA9IG51bGw7XHJcbiAgICAgICAgYWNjdW11bGF0b3IuZm9yRWFjaCggYSA9PiB7XHJcblxyXG4gICAgICAgICAgLy8gT21pdCBkdXBsaWNhdGUgcmVxdWlyZSBzdGF0ZW1lbnRzXHJcbiAgICAgICAgICBpZiAoIGEgIT09IHByZXZpb3VzICkge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaCggYSApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHByZXZpb3VzID0gYTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgICAgYWNjdW11bGF0b3IubGVuZ3RoID0gMDtcclxuICAgICAgICByZXN1bHQucHVzaCggbGluZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ3J1bnQuZmlsZS53cml0ZSggcGF0aCwgcmVzdWx0LmpvaW4oICdcXG4nICkgKTtcclxuICAgIGdydW50LmxvZy53cml0ZWxuKCBgc29ydGVkICR7Y291bnR9IHJlcXVpcmUgc3RhdGVtZW50cyBpbiAke3BhdGh9YCApO1xyXG4gIH1cclxufTsiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLElBQU1BLENBQUMsR0FBR0MsT0FBTyxDQUFFLFFBQVMsQ0FBQztBQUM3QixJQUFNQyxLQUFLLEdBQUdELE9BQU8sQ0FBRSxPQUFRLENBQUM7O0FBRWhDO0FBQ0EsSUFBTUUsR0FBRyxHQUFHLGNBQWMsQ0FBQyxDQUFDOztBQUU1QjtBQUNBO0FBQ0E7QUFDQUMsTUFBTSxDQUFDQyxPQUFPLEdBQUcsVUFBVUMsSUFBSSxFQUFHO0VBRWhDO0VBQ0EsSUFBS0EsSUFBSSxDQUFDQyxPQUFPLENBQUUsS0FBTSxDQUFDLEVBQUc7SUFFM0I7SUFDQSxJQUFNQyxJQUFJLEdBQUdOLEtBQUssQ0FBQ08sSUFBSSxDQUFDQyxJQUFJLENBQUVKLElBQUssQ0FBQyxDQUFDSyxRQUFRLENBQUMsQ0FBQzs7SUFFL0M7SUFDQSxJQUFNQyxLQUFLLEdBQUdKLElBQUksQ0FBQ0ssS0FBSyxDQUFFLE9BQVEsQ0FBQzs7SUFFbkM7SUFDQSxJQUFNQyxNQUFNLEdBQUcsRUFBRTs7SUFFakI7SUFDQSxJQUFJQyxXQUFXLEdBQUcsRUFBRTs7SUFFcEI7SUFDQSxJQUFJQyxLQUFLLEdBQUcsQ0FBQztJQUFDLElBQUFDLEtBQUEsWUFBQUEsTUFBQSxFQUUyQjtNQUN2QyxJQUFNQyxJQUFJLEdBQUdOLEtBQUssQ0FBRU8sQ0FBQyxDQUFFOztNQUV2QjtNQUNBLElBQUtELElBQUksQ0FBQ1gsT0FBTyxDQUFFSixHQUFJLENBQUMsSUFBSSxDQUFDLEVBQUc7UUFDOUJZLFdBQVcsQ0FBQ0ssSUFBSSxDQUFFRixJQUFLLENBQUM7UUFDeEJGLEtBQUssRUFBRTtNQUNULENBQUMsTUFDSTtRQUVIO1FBQ0FELFdBQVcsR0FBR2YsQ0FBQyxDQUFDcUIsTUFBTSxDQUFFTixXQUFXLEVBQUUsVUFBQU8sQ0FBQyxFQUFJO1VBRXhDO1VBQ0E7VUFDQSxPQUFPQSxDQUFDLENBQUNDLFdBQVcsQ0FBQyxDQUFDO1FBQ3hCLENBQUUsQ0FBQztRQUNILElBQUlDLFFBQVEsR0FBRyxJQUFJO1FBQ25CVCxXQUFXLENBQUNVLE9BQU8sQ0FBRSxVQUFBQyxDQUFDLEVBQUk7VUFFeEI7VUFDQSxJQUFLQSxDQUFDLEtBQUtGLFFBQVEsRUFBRztZQUNwQlYsTUFBTSxDQUFDTSxJQUFJLENBQUVNLENBQUUsQ0FBQztVQUNsQjtVQUVBRixRQUFRLEdBQUdFLENBQUM7UUFDZCxDQUFFLENBQUM7UUFDSFgsV0FBVyxDQUFDWSxNQUFNLEdBQUcsQ0FBQztRQUN0QmIsTUFBTSxDQUFDTSxJQUFJLENBQUVGLElBQUssQ0FBQztNQUNyQjtJQUNGLENBQUM7SUE5QkQsS0FBTSxJQUFJQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdQLEtBQUssQ0FBQ2UsTUFBTSxFQUFFUixDQUFDLEVBQUU7TUFBQUYsS0FBQTtJQUFBO0lBZ0N0Q2YsS0FBSyxDQUFDTyxJQUFJLENBQUNtQixLQUFLLENBQUV0QixJQUFJLEVBQUVRLE1BQU0sQ0FBQ2UsSUFBSSxDQUFFLElBQUssQ0FBRSxDQUFDO0lBQzdDM0IsS0FBSyxDQUFDNEIsR0FBRyxDQUFDQyxPQUFPLFdBQUFDLE1BQUEsQ0FBWWhCLEtBQUssNkJBQUFnQixNQUFBLENBQTBCMUIsSUFBSSxDQUFHLENBQUM7RUFDdEU7QUFDRixDQUFDIiwiaWdub3JlTGlzdCI6W119