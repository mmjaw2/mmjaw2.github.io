"use strict";

// Copyright 2017-2024, University of Colorado Boulder

/**
 * Gets the license keys for sherpa (third-party) libs that are used.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var _ = require('lodash');
var getPreloads = require('./getPreloads');
var webpackGlobalLibraries = require('../common/webpackGlobalLibraries');
var grunt = require('grunt');

/**
 * Gets the license keys for sherpa (third-party) libs that are used.
 *
 * @param {string} repo
 * @param {string} brand
 * @returns {Array.<string>}
 */
module.exports = function (repo, brand) {
  var packageObject = grunt.file.readJSON("../".concat(repo, "/package.json"));
  var buildObject;
  try {
    buildObject = grunt.file.readJSON('../chipper/build.json');
  } catch (e) {
    buildObject = {};
  }
  var preload = getPreloads(repo, brand);

  // start with package.json
  var licenseKeys = packageObject.phet.licenseKeys || [];

  // add common and brand-specific entries from build.json
  ['common', brand].forEach(function (id) {
    if (buildObject[id] && buildObject[id].licenseKeys) {
      licenseKeys = licenseKeys.concat(buildObject[id].licenseKeys);
    }
  });

  // Extract keys from preloads and webpack-supported imports for
  // sherpa (third-party) dependencies.
  var allPaths = preload.concat(Object.values(webpackGlobalLibraries).map(function (path) {
    return "../".concat(path);
  }));
  allPaths.forEach(function (path) {
    if (path.includes('/sherpa/')) {
      var lastSlash = path.lastIndexOf('/');
      var key = path.substring(lastSlash + 1);
      licenseKeys.push(key);
    }
  });

  // sort and remove duplicates
  return _.uniq(_.sortBy(licenseKeys, function (key) {
    return key.toUpperCase();
  }));
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImdldFByZWxvYWRzIiwid2VicGFja0dsb2JhbExpYnJhcmllcyIsImdydW50IiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJicmFuZCIsInBhY2thZ2VPYmplY3QiLCJmaWxlIiwicmVhZEpTT04iLCJjb25jYXQiLCJidWlsZE9iamVjdCIsImUiLCJwcmVsb2FkIiwibGljZW5zZUtleXMiLCJwaGV0IiwiZm9yRWFjaCIsImlkIiwiYWxsUGF0aHMiLCJPYmplY3QiLCJ2YWx1ZXMiLCJtYXAiLCJwYXRoIiwiaW5jbHVkZXMiLCJsYXN0U2xhc2giLCJsYXN0SW5kZXhPZiIsImtleSIsInN1YnN0cmluZyIsInB1c2giLCJ1bmlxIiwic29ydEJ5IiwidG9VcHBlckNhc2UiXSwic291cmNlcyI6WyJnZXRMaWNlbnNlS2V5cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBsaWNlbnNlIGtleXMgZm9yIHNoZXJwYSAodGhpcmQtcGFydHkpIGxpYnMgdGhhdCBhcmUgdXNlZC5cclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcblxyXG5jb25zdCBfID0gcmVxdWlyZSggJ2xvZGFzaCcgKTtcclxuY29uc3QgZ2V0UHJlbG9hZHMgPSByZXF1aXJlKCAnLi9nZXRQcmVsb2FkcycgKTtcclxuY29uc3Qgd2VicGFja0dsb2JhbExpYnJhcmllcyA9IHJlcXVpcmUoICcuLi9jb21tb24vd2VicGFja0dsb2JhbExpYnJhcmllcycgKTtcclxuY29uc3QgZ3J1bnQgPSByZXF1aXJlKCAnZ3J1bnQnICk7XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbGljZW5zZSBrZXlzIGZvciBzaGVycGEgKHRoaXJkLXBhcnR5KSBsaWJzIHRoYXQgYXJlIHVzZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBicmFuZFxyXG4gKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCByZXBvLCBicmFuZCApIHtcclxuICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCApO1xyXG4gIGxldCBidWlsZE9iamVjdDtcclxuICB0cnkge1xyXG4gICAgYnVpbGRPYmplY3QgPSBncnVudC5maWxlLnJlYWRKU09OKCAnLi4vY2hpcHBlci9idWlsZC5qc29uJyApO1xyXG4gIH1cclxuICBjYXRjaCggZSApIHtcclxuICAgIGJ1aWxkT2JqZWN0ID0ge307XHJcbiAgfVxyXG4gIGNvbnN0IHByZWxvYWQgPSBnZXRQcmVsb2FkcyggcmVwbywgYnJhbmQgKTtcclxuXHJcbiAgLy8gc3RhcnQgd2l0aCBwYWNrYWdlLmpzb25cclxuICBsZXQgbGljZW5zZUtleXMgPSBwYWNrYWdlT2JqZWN0LnBoZXQubGljZW5zZUtleXMgfHwgW107XHJcblxyXG4gIC8vIGFkZCBjb21tb24gYW5kIGJyYW5kLXNwZWNpZmljIGVudHJpZXMgZnJvbSBidWlsZC5qc29uXHJcbiAgWyAnY29tbW9uJywgYnJhbmQgXS5mb3JFYWNoKCBpZCA9PiB7XHJcbiAgICBpZiAoIGJ1aWxkT2JqZWN0WyBpZCBdICYmIGJ1aWxkT2JqZWN0WyBpZCBdLmxpY2Vuc2VLZXlzICkge1xyXG4gICAgICBsaWNlbnNlS2V5cyA9IGxpY2Vuc2VLZXlzLmNvbmNhdCggYnVpbGRPYmplY3RbIGlkIF0ubGljZW5zZUtleXMgKTtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIC8vIEV4dHJhY3Qga2V5cyBmcm9tIHByZWxvYWRzIGFuZCB3ZWJwYWNrLXN1cHBvcnRlZCBpbXBvcnRzIGZvclxyXG4gIC8vIHNoZXJwYSAodGhpcmQtcGFydHkpIGRlcGVuZGVuY2llcy5cclxuICBjb25zdCBhbGxQYXRocyA9IHByZWxvYWQuY29uY2F0KCBPYmplY3QudmFsdWVzKCB3ZWJwYWNrR2xvYmFsTGlicmFyaWVzICkubWFwKCBwYXRoID0+IGAuLi8ke3BhdGh9YCApICk7XHJcblxyXG4gIGFsbFBhdGhzLmZvckVhY2goIHBhdGggPT4ge1xyXG4gICAgaWYgKCBwYXRoLmluY2x1ZGVzKCAnL3NoZXJwYS8nICkgKSB7XHJcbiAgICAgIGNvbnN0IGxhc3RTbGFzaCA9IHBhdGgubGFzdEluZGV4T2YoICcvJyApO1xyXG4gICAgICBjb25zdCBrZXkgPSBwYXRoLnN1YnN0cmluZyggbGFzdFNsYXNoICsgMSApO1xyXG4gICAgICBsaWNlbnNlS2V5cy5wdXNoKCBrZXkgKTtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIC8vIHNvcnQgYW5kIHJlbW92ZSBkdXBsaWNhdGVzXHJcbiAgcmV0dXJuIF8udW5pcSggXy5zb3J0QnkoIGxpY2Vuc2VLZXlzLCBrZXkgPT4ga2V5LnRvVXBwZXJDYXNlKCkgKSApO1xyXG59OyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0EsSUFBTUEsQ0FBQyxHQUFHQyxPQUFPLENBQUUsUUFBUyxDQUFDO0FBQzdCLElBQU1DLFdBQVcsR0FBR0QsT0FBTyxDQUFFLGVBQWdCLENBQUM7QUFDOUMsSUFBTUUsc0JBQXNCLEdBQUdGLE9BQU8sQ0FBRSxrQ0FBbUMsQ0FBQztBQUM1RSxJQUFNRyxLQUFLLEdBQUdILE9BQU8sQ0FBRSxPQUFRLENBQUM7O0FBRWhDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FJLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLElBQUksRUFBRUMsS0FBSyxFQUFHO0VBQ3ZDLElBQU1DLGFBQWEsR0FBR0wsS0FBSyxDQUFDTSxJQUFJLENBQUNDLFFBQVEsT0FBQUMsTUFBQSxDQUFRTCxJQUFJLGtCQUFnQixDQUFDO0VBQ3RFLElBQUlNLFdBQVc7RUFDZixJQUFJO0lBQ0ZBLFdBQVcsR0FBR1QsS0FBSyxDQUFDTSxJQUFJLENBQUNDLFFBQVEsQ0FBRSx1QkFBd0IsQ0FBQztFQUM5RCxDQUFDLENBQ0QsT0FBT0csQ0FBQyxFQUFHO0lBQ1RELFdBQVcsR0FBRyxDQUFDLENBQUM7RUFDbEI7RUFDQSxJQUFNRSxPQUFPLEdBQUdiLFdBQVcsQ0FBRUssSUFBSSxFQUFFQyxLQUFNLENBQUM7O0VBRTFDO0VBQ0EsSUFBSVEsV0FBVyxHQUFHUCxhQUFhLENBQUNRLElBQUksQ0FBQ0QsV0FBVyxJQUFJLEVBQUU7O0VBRXREO0VBQ0EsQ0FBRSxRQUFRLEVBQUVSLEtBQUssQ0FBRSxDQUFDVSxPQUFPLENBQUUsVUFBQUMsRUFBRSxFQUFJO0lBQ2pDLElBQUtOLFdBQVcsQ0FBRU0sRUFBRSxDQUFFLElBQUlOLFdBQVcsQ0FBRU0sRUFBRSxDQUFFLENBQUNILFdBQVcsRUFBRztNQUN4REEsV0FBVyxHQUFHQSxXQUFXLENBQUNKLE1BQU0sQ0FBRUMsV0FBVyxDQUFFTSxFQUFFLENBQUUsQ0FBQ0gsV0FBWSxDQUFDO0lBQ25FO0VBQ0YsQ0FBRSxDQUFDOztFQUVIO0VBQ0E7RUFDQSxJQUFNSSxRQUFRLEdBQUdMLE9BQU8sQ0FBQ0gsTUFBTSxDQUFFUyxNQUFNLENBQUNDLE1BQU0sQ0FBRW5CLHNCQUF1QixDQUFDLENBQUNvQixHQUFHLENBQUUsVUFBQUMsSUFBSTtJQUFBLGFBQUFaLE1BQUEsQ0FBVVksSUFBSTtFQUFBLENBQUcsQ0FBRSxDQUFDO0VBRXRHSixRQUFRLENBQUNGLE9BQU8sQ0FBRSxVQUFBTSxJQUFJLEVBQUk7SUFDeEIsSUFBS0EsSUFBSSxDQUFDQyxRQUFRLENBQUUsVUFBVyxDQUFDLEVBQUc7TUFDakMsSUFBTUMsU0FBUyxHQUFHRixJQUFJLENBQUNHLFdBQVcsQ0FBRSxHQUFJLENBQUM7TUFDekMsSUFBTUMsR0FBRyxHQUFHSixJQUFJLENBQUNLLFNBQVMsQ0FBRUgsU0FBUyxHQUFHLENBQUUsQ0FBQztNQUMzQ1YsV0FBVyxDQUFDYyxJQUFJLENBQUVGLEdBQUksQ0FBQztJQUN6QjtFQUNGLENBQUUsQ0FBQzs7RUFFSDtFQUNBLE9BQU81QixDQUFDLENBQUMrQixJQUFJLENBQUUvQixDQUFDLENBQUNnQyxNQUFNLENBQUVoQixXQUFXLEVBQUUsVUFBQVksR0FBRztJQUFBLE9BQUlBLEdBQUcsQ0FBQ0ssV0FBVyxDQUFDLENBQUM7RUFBQSxDQUFDLENBQUUsQ0FBQztBQUNwRSxDQUFDIiwiaWdub3JlTGlzdCI6W119