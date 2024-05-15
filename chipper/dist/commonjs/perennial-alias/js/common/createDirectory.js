"use strict";

// Copyright 2020, University of Colorado Boulder

/**
 * Creates a directory at the given path
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var fs = require('fs');
var winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Creates a directory at the given path
 * @public
 *
 * @param {string} path
 * @returns {Promise}
 */
module.exports = function (path) {
  winston.info("Creating directory ".concat(path));
  return new Promise(function (resolve, reject) {
    fs.mkdir(path, function (err) {
      if (err) {
        reject(new Error("createDirectory: ".concat(err)));
      } else {
        resolve();
      }
    });
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJ3aW5zdG9uIiwibW9kdWxlIiwiZXhwb3J0cyIsInBhdGgiLCJpbmZvIiwiY29uY2F0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJta2RpciIsImVyciIsIkVycm9yIl0sInNvdXJjZXMiOlsiY3JlYXRlRGlyZWN0b3J5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgZGlyZWN0b3J5IGF0IHRoZSBnaXZlbiBwYXRoXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBkaXJlY3RvcnkgYXQgdGhlIGdpdmVuIHBhdGhcclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIHBhdGggKSB7XHJcbiAgd2luc3Rvbi5pbmZvKCBgQ3JlYXRpbmcgZGlyZWN0b3J5ICR7cGF0aH1gICk7XHJcblxyXG4gIHJldHVybiBuZXcgUHJvbWlzZSggKCByZXNvbHZlLCByZWplY3QgKSA9PiB7XHJcbiAgICBmcy5ta2RpciggcGF0aCwgZXJyID0+IHtcclxuICAgICAgaWYgKCBlcnIgKSB7XHJcbiAgICAgICAgcmVqZWN0KCBuZXcgRXJyb3IoIGBjcmVhdGVEaXJlY3Rvcnk6ICR7ZXJyfWAgKSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gIH0gKTtcclxufTsiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFNQSxFQUFFLEdBQUdDLE9BQU8sQ0FBRSxJQUFLLENBQUM7QUFDMUIsSUFBTUMsT0FBTyxHQUFHRCxPQUFPLENBQUUsU0FBVSxDQUFDOztBQUVwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRSxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxJQUFJLEVBQUc7RUFDaENILE9BQU8sQ0FBQ0ksSUFBSSx1QkFBQUMsTUFBQSxDQUF3QkYsSUFBSSxDQUFHLENBQUM7RUFFNUMsT0FBTyxJQUFJRyxPQUFPLENBQUUsVUFBRUMsT0FBTyxFQUFFQyxNQUFNLEVBQU07SUFDekNWLEVBQUUsQ0FBQ1csS0FBSyxDQUFFTixJQUFJLEVBQUUsVUFBQU8sR0FBRyxFQUFJO01BQ3JCLElBQUtBLEdBQUcsRUFBRztRQUNURixNQUFNLENBQUUsSUFBSUcsS0FBSyxxQkFBQU4sTUFBQSxDQUFzQkssR0FBRyxDQUFHLENBQUUsQ0FBQztNQUNsRCxDQUFDLE1BQ0k7UUFDSEgsT0FBTyxDQUFDLENBQUM7TUFDWDtJQUNGLENBQUUsQ0FBQztFQUNMLENBQUUsQ0FBQztBQUNMLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=