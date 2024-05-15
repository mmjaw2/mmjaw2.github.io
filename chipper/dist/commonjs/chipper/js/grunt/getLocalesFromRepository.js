"use strict";

// Copyright 2017-2024, University of Colorado Boulder

/**
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var assert = require('assert');
var grunt = require('grunt');

/*
 * Gets the locales from a repository, by inspecting the names of the string files in babel for that repository.
 * @public
 *
 * @param {string} repo - name of the repository to get locales from
 */
module.exports = function (repo) {
  // confirm that the repository has a strings directory
  var stringsDirectory = "../babel/".concat(repo);
  assert(grunt.file.isDir(), "".concat(stringsDirectory, " is not a directory"));

  // Get names of string files.
  var stringFiles = grunt.file.expand("".concat(stringsDirectory, "/").concat(repo, "-strings_*.json"));

  // Don't fail out if there are no string files, as this is a normal condition when building new simulations
  if (stringFiles.length === 0) {
    grunt.log.debug("No string files found in ".concat(stringsDirectory, " for repository ").concat(repo));
    return [];
  }

  // Extract the locales from the file names.
  // File names must have a form like 'graphing-lines-strings_ar_SA.json', where no '_' appear in the repo name.
  var locales = stringFiles.map(function (filename) {
    return filename.substring(filename.indexOf('_') + 1, filename.lastIndexOf('.'));
  });
  assert(locales.length > 0, "no locales found in ".concat(stringsDirectory));
  return locales;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiZ3J1bnQiLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsInN0cmluZ3NEaXJlY3RvcnkiLCJjb25jYXQiLCJmaWxlIiwiaXNEaXIiLCJzdHJpbmdGaWxlcyIsImV4cGFuZCIsImxlbmd0aCIsImxvZyIsImRlYnVnIiwibG9jYWxlcyIsIm1hcCIsImZpbGVuYW1lIiwic3Vic3RyaW5nIiwiaW5kZXhPZiIsImxhc3RJbmRleE9mIl0sInNvdXJjZXMiOlsiZ2V0TG9jYWxlc0Zyb21SZXBvc2l0b3J5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5cclxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcclxuY29uc3QgZ3J1bnQgPSByZXF1aXJlKCAnZ3J1bnQnICk7XHJcblxyXG4vKlxyXG4gKiBHZXRzIHRoZSBsb2NhbGVzIGZyb20gYSByZXBvc2l0b3J5LCBieSBpbnNwZWN0aW5nIHRoZSBuYW1lcyBvZiB0aGUgc3RyaW5nIGZpbGVzIGluIGJhYmVsIGZvciB0aGF0IHJlcG9zaXRvcnkuXHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBuYW1lIG9mIHRoZSByZXBvc2l0b3J5IHRvIGdldCBsb2NhbGVzIGZyb21cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIHJlcG8gKSB7XHJcblxyXG4gIC8vIGNvbmZpcm0gdGhhdCB0aGUgcmVwb3NpdG9yeSBoYXMgYSBzdHJpbmdzIGRpcmVjdG9yeVxyXG4gIGNvbnN0IHN0cmluZ3NEaXJlY3RvcnkgPSBgLi4vYmFiZWwvJHtyZXBvfWA7XHJcbiAgYXNzZXJ0KCBncnVudC5maWxlLmlzRGlyKCksIGAke3N0cmluZ3NEaXJlY3Rvcnl9IGlzIG5vdCBhIGRpcmVjdG9yeWAgKTtcclxuXHJcbiAgLy8gR2V0IG5hbWVzIG9mIHN0cmluZyBmaWxlcy5cclxuICBjb25zdCBzdHJpbmdGaWxlcyA9IGdydW50LmZpbGUuZXhwYW5kKCBgJHtzdHJpbmdzRGlyZWN0b3J5fS8ke3JlcG99LXN0cmluZ3NfKi5qc29uYCApO1xyXG5cclxuICAvLyBEb24ndCBmYWlsIG91dCBpZiB0aGVyZSBhcmUgbm8gc3RyaW5nIGZpbGVzLCBhcyB0aGlzIGlzIGEgbm9ybWFsIGNvbmRpdGlvbiB3aGVuIGJ1aWxkaW5nIG5ldyBzaW11bGF0aW9uc1xyXG4gIGlmICggc3RyaW5nRmlsZXMubGVuZ3RoID09PSAwICkge1xyXG4gICAgZ3J1bnQubG9nLmRlYnVnKCBgTm8gc3RyaW5nIGZpbGVzIGZvdW5kIGluICR7c3RyaW5nc0RpcmVjdG9yeX0gZm9yIHJlcG9zaXRvcnkgJHtyZXBvfWAgKTtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcblxyXG4gIC8vIEV4dHJhY3QgdGhlIGxvY2FsZXMgZnJvbSB0aGUgZmlsZSBuYW1lcy5cclxuICAvLyBGaWxlIG5hbWVzIG11c3QgaGF2ZSBhIGZvcm0gbGlrZSAnZ3JhcGhpbmctbGluZXMtc3RyaW5nc19hcl9TQS5qc29uJywgd2hlcmUgbm8gJ18nIGFwcGVhciBpbiB0aGUgcmVwbyBuYW1lLlxyXG4gIGNvbnN0IGxvY2FsZXMgPSBzdHJpbmdGaWxlcy5tYXAoIGZpbGVuYW1lID0+IHtcclxuICAgIHJldHVybiBmaWxlbmFtZS5zdWJzdHJpbmcoIGZpbGVuYW1lLmluZGV4T2YoICdfJyApICsgMSwgZmlsZW5hbWUubGFzdEluZGV4T2YoICcuJyApICk7XHJcbiAgfSApO1xyXG4gIGFzc2VydCggbG9jYWxlcy5sZW5ndGggPiAwLCBgbm8gbG9jYWxlcyBmb3VuZCBpbiAke3N0cmluZ3NEaXJlY3Rvcnl9YCApO1xyXG5cclxuICByZXR1cm4gbG9jYWxlcztcclxufTsiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBR0EsSUFBTUEsTUFBTSxHQUFHQyxPQUFPLENBQUUsUUFBUyxDQUFDO0FBQ2xDLElBQU1DLEtBQUssR0FBR0QsT0FBTyxDQUFFLE9BQVEsQ0FBQzs7QUFFaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FFLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLElBQUksRUFBRztFQUVoQztFQUNBLElBQU1DLGdCQUFnQixlQUFBQyxNQUFBLENBQWVGLElBQUksQ0FBRTtFQUMzQ0wsTUFBTSxDQUFFRSxLQUFLLENBQUNNLElBQUksQ0FBQ0MsS0FBSyxDQUFDLENBQUMsS0FBQUYsTUFBQSxDQUFLRCxnQkFBZ0Isd0JBQXNCLENBQUM7O0VBRXRFO0VBQ0EsSUFBTUksV0FBVyxHQUFHUixLQUFLLENBQUNNLElBQUksQ0FBQ0csTUFBTSxJQUFBSixNQUFBLENBQUtELGdCQUFnQixPQUFBQyxNQUFBLENBQUlGLElBQUksb0JBQWtCLENBQUM7O0VBRXJGO0VBQ0EsSUFBS0ssV0FBVyxDQUFDRSxNQUFNLEtBQUssQ0FBQyxFQUFHO0lBQzlCVixLQUFLLENBQUNXLEdBQUcsQ0FBQ0MsS0FBSyw2QkFBQVAsTUFBQSxDQUE4QkQsZ0JBQWdCLHNCQUFBQyxNQUFBLENBQW1CRixJQUFJLENBQUcsQ0FBQztJQUN4RixPQUFPLEVBQUU7RUFDWDs7RUFFQTtFQUNBO0VBQ0EsSUFBTVUsT0FBTyxHQUFHTCxXQUFXLENBQUNNLEdBQUcsQ0FBRSxVQUFBQyxRQUFRLEVBQUk7SUFDM0MsT0FBT0EsUUFBUSxDQUFDQyxTQUFTLENBQUVELFFBQVEsQ0FBQ0UsT0FBTyxDQUFFLEdBQUksQ0FBQyxHQUFHLENBQUMsRUFBRUYsUUFBUSxDQUFDRyxXQUFXLENBQUUsR0FBSSxDQUFFLENBQUM7RUFDdkYsQ0FBRSxDQUFDO0VBQ0hwQixNQUFNLENBQUVlLE9BQU8sQ0FBQ0gsTUFBTSxHQUFHLENBQUMseUJBQUFMLE1BQUEsQ0FBeUJELGdCQUFnQixDQUFHLENBQUM7RUFFdkUsT0FBT1MsT0FBTztBQUNoQixDQUFDIiwiaWdub3JlTGlzdCI6W119