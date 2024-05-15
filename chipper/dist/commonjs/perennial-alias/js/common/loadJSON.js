"use strict";

// Copyright 2017, University of Colorado Boulder

/**
 * Handling for loading JSON from a file.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var fs = require('fs');
var winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Load JSON from a file, resulting in the parsed result.
 * @public
 *
 * @param {string} file
 * @returns {Promise} - Resolves with {Object} - Result of JSON.parse
 */
module.exports = function (file) {
  return new Promise(function (resolve, reject) {
    winston.debug("Loading JSON from ".concat(file));
    fs.readFile(file, 'utf8', function (err, data) {
      if (err) {
        winston.error("Error occurred reading version from json at ".concat(file, ": ").concat(err));
        reject(new Error(err));
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJ3aW5zdG9uIiwibW9kdWxlIiwiZXhwb3J0cyIsImZpbGUiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImRlYnVnIiwiY29uY2F0IiwicmVhZEZpbGUiLCJlcnIiLCJkYXRhIiwiZXJyb3IiLCJFcnJvciIsIkpTT04iLCJwYXJzZSJdLCJzb3VyY2VzIjpbImxvYWRKU09OLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBIYW5kbGluZyBmb3IgbG9hZGluZyBKU09OIGZyb20gYSBmaWxlLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkIEpTT04gZnJvbSBhIGZpbGUsIHJlc3VsdGluZyBpbiB0aGUgcGFyc2VkIHJlc3VsdC5cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZVxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gLSBSZXNvbHZlcyB3aXRoIHtPYmplY3R9IC0gUmVzdWx0IG9mIEpTT04ucGFyc2VcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGZpbGUgKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKCAoIHJlc29sdmUsIHJlamVjdCApID0+IHtcclxuICAgIHdpbnN0b24uZGVidWcoIGBMb2FkaW5nIEpTT04gZnJvbSAke2ZpbGV9YCApO1xyXG5cclxuICAgIGZzLnJlYWRGaWxlKCBmaWxlLCAndXRmOCcsICggZXJyLCBkYXRhICkgPT4ge1xyXG4gICAgICBpZiAoIGVyciApIHtcclxuICAgICAgICB3aW5zdG9uLmVycm9yKCBgRXJyb3Igb2NjdXJyZWQgcmVhZGluZyB2ZXJzaW9uIGZyb20ganNvbiBhdCAke2ZpbGV9OiAke2Vycn1gICk7XHJcbiAgICAgICAgcmVqZWN0KCBuZXcgRXJyb3IoIGVyciApICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmVzb2x2ZSggSlNPTi5wYXJzZSggZGF0YSApICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9ICk7XHJcbn07Il0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUEsRUFBRSxHQUFHQyxPQUFPLENBQUUsSUFBSyxDQUFDO0FBQzFCLElBQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFFLFNBQVUsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUUsTUFBTSxDQUFDQyxPQUFPLEdBQUcsVUFBVUMsSUFBSSxFQUFHO0VBQ2hDLE9BQU8sSUFBSUMsT0FBTyxDQUFFLFVBQUVDLE9BQU8sRUFBRUMsTUFBTSxFQUFNO0lBQ3pDTixPQUFPLENBQUNPLEtBQUssc0JBQUFDLE1BQUEsQ0FBdUJMLElBQUksQ0FBRyxDQUFDO0lBRTVDTCxFQUFFLENBQUNXLFFBQVEsQ0FBRU4sSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFFTyxHQUFHLEVBQUVDLElBQUksRUFBTTtNQUMxQyxJQUFLRCxHQUFHLEVBQUc7UUFDVFYsT0FBTyxDQUFDWSxLQUFLLGdEQUFBSixNQUFBLENBQWlETCxJQUFJLFFBQUFLLE1BQUEsQ0FBS0UsR0FBRyxDQUFHLENBQUM7UUFDOUVKLE1BQU0sQ0FBRSxJQUFJTyxLQUFLLENBQUVILEdBQUksQ0FBRSxDQUFDO01BQzVCLENBQUMsTUFDSTtRQUNITCxPQUFPLENBQUVTLElBQUksQ0FBQ0MsS0FBSyxDQUFFSixJQUFLLENBQUUsQ0FBQztNQUMvQjtJQUNGLENBQUUsQ0FBQztFQUNMLENBQUUsQ0FBQztBQUNMLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=