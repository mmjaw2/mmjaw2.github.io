// Copyright 2017-2024, University of Colorado Boulder

/**
 * Gets the license keys for sherpa (third-party) libs that are used.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const _ = require('lodash');
const getPreloads = require('./getPreloads');
const webpackGlobalLibraries = require('../common/webpackGlobalLibraries');
const grunt = require('grunt');

/**
 * Gets the license keys for sherpa (third-party) libs that are used.
 *
 * @param {string} repo
 * @param {string} brand
 * @returns {Array.<string>}
 */
module.exports = function (repo, brand) {
  const packageObject = grunt.file.readJSON(`../${repo}/package.json`);
  let buildObject;
  try {
    buildObject = grunt.file.readJSON('../chipper/build.json');
  } catch (e) {
    buildObject = {};
  }
  const preload = getPreloads(repo, brand);

  // start with package.json
  let licenseKeys = packageObject.phet.licenseKeys || [];

  // add common and brand-specific entries from build.json
  ['common', brand].forEach(id => {
    if (buildObject[id] && buildObject[id].licenseKeys) {
      licenseKeys = licenseKeys.concat(buildObject[id].licenseKeys);
    }
  });

  // Extract keys from preloads and webpack-supported imports for
  // sherpa (third-party) dependencies.
  const allPaths = preload.concat(Object.values(webpackGlobalLibraries).map(path => `../${path}`));
  allPaths.forEach(path => {
    if (path.includes('/sherpa/')) {
      const lastSlash = path.lastIndexOf('/');
      const key = path.substring(lastSlash + 1);
      licenseKeys.push(key);
    }
  });

  // sort and remove duplicates
  return _.uniq(_.sortBy(licenseKeys, key => key.toUpperCase()));
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImdldFByZWxvYWRzIiwid2VicGFja0dsb2JhbExpYnJhcmllcyIsImdydW50IiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJicmFuZCIsInBhY2thZ2VPYmplY3QiLCJmaWxlIiwicmVhZEpTT04iLCJidWlsZE9iamVjdCIsImUiLCJwcmVsb2FkIiwibGljZW5zZUtleXMiLCJwaGV0IiwiZm9yRWFjaCIsImlkIiwiY29uY2F0IiwiYWxsUGF0aHMiLCJPYmplY3QiLCJ2YWx1ZXMiLCJtYXAiLCJwYXRoIiwiaW5jbHVkZXMiLCJsYXN0U2xhc2giLCJsYXN0SW5kZXhPZiIsImtleSIsInN1YnN0cmluZyIsInB1c2giLCJ1bmlxIiwic29ydEJ5IiwidG9VcHBlckNhc2UiXSwic291cmNlcyI6WyJnZXRMaWNlbnNlS2V5cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBsaWNlbnNlIGtleXMgZm9yIHNoZXJwYSAodGhpcmQtcGFydHkpIGxpYnMgdGhhdCBhcmUgdXNlZC5cclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcblxyXG5jb25zdCBfID0gcmVxdWlyZSggJ2xvZGFzaCcgKTtcclxuY29uc3QgZ2V0UHJlbG9hZHMgPSByZXF1aXJlKCAnLi9nZXRQcmVsb2FkcycgKTtcclxuY29uc3Qgd2VicGFja0dsb2JhbExpYnJhcmllcyA9IHJlcXVpcmUoICcuLi9jb21tb24vd2VicGFja0dsb2JhbExpYnJhcmllcycgKTtcclxuY29uc3QgZ3J1bnQgPSByZXF1aXJlKCAnZ3J1bnQnICk7XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbGljZW5zZSBrZXlzIGZvciBzaGVycGEgKHRoaXJkLXBhcnR5KSBsaWJzIHRoYXQgYXJlIHVzZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBicmFuZFxyXG4gKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCByZXBvLCBicmFuZCApIHtcclxuICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCApO1xyXG4gIGxldCBidWlsZE9iamVjdDtcclxuICB0cnkge1xyXG4gICAgYnVpbGRPYmplY3QgPSBncnVudC5maWxlLnJlYWRKU09OKCAnLi4vY2hpcHBlci9idWlsZC5qc29uJyApO1xyXG4gIH1cclxuICBjYXRjaCggZSApIHtcclxuICAgIGJ1aWxkT2JqZWN0ID0ge307XHJcbiAgfVxyXG4gIGNvbnN0IHByZWxvYWQgPSBnZXRQcmVsb2FkcyggcmVwbywgYnJhbmQgKTtcclxuXHJcbiAgLy8gc3RhcnQgd2l0aCBwYWNrYWdlLmpzb25cclxuICBsZXQgbGljZW5zZUtleXMgPSBwYWNrYWdlT2JqZWN0LnBoZXQubGljZW5zZUtleXMgfHwgW107XHJcblxyXG4gIC8vIGFkZCBjb21tb24gYW5kIGJyYW5kLXNwZWNpZmljIGVudHJpZXMgZnJvbSBidWlsZC5qc29uXHJcbiAgWyAnY29tbW9uJywgYnJhbmQgXS5mb3JFYWNoKCBpZCA9PiB7XHJcbiAgICBpZiAoIGJ1aWxkT2JqZWN0WyBpZCBdICYmIGJ1aWxkT2JqZWN0WyBpZCBdLmxpY2Vuc2VLZXlzICkge1xyXG4gICAgICBsaWNlbnNlS2V5cyA9IGxpY2Vuc2VLZXlzLmNvbmNhdCggYnVpbGRPYmplY3RbIGlkIF0ubGljZW5zZUtleXMgKTtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIC8vIEV4dHJhY3Qga2V5cyBmcm9tIHByZWxvYWRzIGFuZCB3ZWJwYWNrLXN1cHBvcnRlZCBpbXBvcnRzIGZvclxyXG4gIC8vIHNoZXJwYSAodGhpcmQtcGFydHkpIGRlcGVuZGVuY2llcy5cclxuICBjb25zdCBhbGxQYXRocyA9IHByZWxvYWQuY29uY2F0KCBPYmplY3QudmFsdWVzKCB3ZWJwYWNrR2xvYmFsTGlicmFyaWVzICkubWFwKCBwYXRoID0+IGAuLi8ke3BhdGh9YCApICk7XHJcblxyXG4gIGFsbFBhdGhzLmZvckVhY2goIHBhdGggPT4ge1xyXG4gICAgaWYgKCBwYXRoLmluY2x1ZGVzKCAnL3NoZXJwYS8nICkgKSB7XHJcbiAgICAgIGNvbnN0IGxhc3RTbGFzaCA9IHBhdGgubGFzdEluZGV4T2YoICcvJyApO1xyXG4gICAgICBjb25zdCBrZXkgPSBwYXRoLnN1YnN0cmluZyggbGFzdFNsYXNoICsgMSApO1xyXG4gICAgICBsaWNlbnNlS2V5cy5wdXNoKCBrZXkgKTtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIC8vIHNvcnQgYW5kIHJlbW92ZSBkdXBsaWNhdGVzXHJcbiAgcmV0dXJuIF8udW5pcSggXy5zb3J0QnkoIGxpY2Vuc2VLZXlzLCBrZXkgPT4ga2V5LnRvVXBwZXJDYXNlKCkgKSApO1xyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLE1BQU1BLENBQUMsR0FBR0MsT0FBTyxDQUFFLFFBQVMsQ0FBQztBQUM3QixNQUFNQyxXQUFXLEdBQUdELE9BQU8sQ0FBRSxlQUFnQixDQUFDO0FBQzlDLE1BQU1FLHNCQUFzQixHQUFHRixPQUFPLENBQUUsa0NBQW1DLENBQUM7QUFDNUUsTUFBTUcsS0FBSyxHQUFHSCxPQUFPLENBQUUsT0FBUSxDQUFDOztBQUVoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBSSxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxJQUFJLEVBQUVDLEtBQUssRUFBRztFQUN2QyxNQUFNQyxhQUFhLEdBQUdMLEtBQUssQ0FBQ00sSUFBSSxDQUFDQyxRQUFRLENBQUcsTUFBS0osSUFBSyxlQUFlLENBQUM7RUFDdEUsSUFBSUssV0FBVztFQUNmLElBQUk7SUFDRkEsV0FBVyxHQUFHUixLQUFLLENBQUNNLElBQUksQ0FBQ0MsUUFBUSxDQUFFLHVCQUF3QixDQUFDO0VBQzlELENBQUMsQ0FDRCxPQUFPRSxDQUFDLEVBQUc7SUFDVEQsV0FBVyxHQUFHLENBQUMsQ0FBQztFQUNsQjtFQUNBLE1BQU1FLE9BQU8sR0FBR1osV0FBVyxDQUFFSyxJQUFJLEVBQUVDLEtBQU0sQ0FBQzs7RUFFMUM7RUFDQSxJQUFJTyxXQUFXLEdBQUdOLGFBQWEsQ0FBQ08sSUFBSSxDQUFDRCxXQUFXLElBQUksRUFBRTs7RUFFdEQ7RUFDQSxDQUFFLFFBQVEsRUFBRVAsS0FBSyxDQUFFLENBQUNTLE9BQU8sQ0FBRUMsRUFBRSxJQUFJO0lBQ2pDLElBQUtOLFdBQVcsQ0FBRU0sRUFBRSxDQUFFLElBQUlOLFdBQVcsQ0FBRU0sRUFBRSxDQUFFLENBQUNILFdBQVcsRUFBRztNQUN4REEsV0FBVyxHQUFHQSxXQUFXLENBQUNJLE1BQU0sQ0FBRVAsV0FBVyxDQUFFTSxFQUFFLENBQUUsQ0FBQ0gsV0FBWSxDQUFDO0lBQ25FO0VBQ0YsQ0FBRSxDQUFDOztFQUVIO0VBQ0E7RUFDQSxNQUFNSyxRQUFRLEdBQUdOLE9BQU8sQ0FBQ0ssTUFBTSxDQUFFRSxNQUFNLENBQUNDLE1BQU0sQ0FBRW5CLHNCQUF1QixDQUFDLENBQUNvQixHQUFHLENBQUVDLElBQUksSUFBSyxNQUFLQSxJQUFLLEVBQUUsQ0FBRSxDQUFDO0VBRXRHSixRQUFRLENBQUNILE9BQU8sQ0FBRU8sSUFBSSxJQUFJO0lBQ3hCLElBQUtBLElBQUksQ0FBQ0MsUUFBUSxDQUFFLFVBQVcsQ0FBQyxFQUFHO01BQ2pDLE1BQU1DLFNBQVMsR0FBR0YsSUFBSSxDQUFDRyxXQUFXLENBQUUsR0FBSSxDQUFDO01BQ3pDLE1BQU1DLEdBQUcsR0FBR0osSUFBSSxDQUFDSyxTQUFTLENBQUVILFNBQVMsR0FBRyxDQUFFLENBQUM7TUFDM0NYLFdBQVcsQ0FBQ2UsSUFBSSxDQUFFRixHQUFJLENBQUM7SUFDekI7RUFDRixDQUFFLENBQUM7O0VBRUg7RUFDQSxPQUFPNUIsQ0FBQyxDQUFDK0IsSUFBSSxDQUFFL0IsQ0FBQyxDQUFDZ0MsTUFBTSxDQUFFakIsV0FBVyxFQUFFYSxHQUFHLElBQUlBLEdBQUcsQ0FBQ0ssV0FBVyxDQUFDLENBQUUsQ0FBRSxDQUFDO0FBQ3BFLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=