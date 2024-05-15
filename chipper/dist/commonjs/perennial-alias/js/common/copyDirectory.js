"use strict";

// Copyright 2020, University of Colorado Boulder

/**
 * Copies a directory (recursively) to another location
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var ncp = require('ncp');
var winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Copies a directory (recursively) to another location
 * @public
 *
 * @param {string} path
 * @param {string} location
 * @param {Object} [options]
 * @returns {Promise}
 */
module.exports = function (pathToCopy, location, options) {
  winston.info("copying ".concat(pathToCopy, " into ").concat(location));
  return new Promise(function (resolve, reject) {
    ncp.ncp(pathToCopy, location, options, function (err) {
      if (err) {
        reject(new Error("copyDirectory error: ".concat(err)));
      } else {
        resolve();
      }
    });
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJuY3AiLCJyZXF1aXJlIiwid2luc3RvbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJwYXRoVG9Db3B5IiwibG9jYXRpb24iLCJvcHRpb25zIiwiaW5mbyIsImNvbmNhdCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiZXJyIiwiRXJyb3IiXSwic291cmNlcyI6WyJjb3B5RGlyZWN0b3J5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBDb3BpZXMgYSBkaXJlY3RvcnkgKHJlY3Vyc2l2ZWx5KSB0byBhbm90aGVyIGxvY2F0aW9uXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBuY3AgPSByZXF1aXJlKCAnbmNwJyApO1xyXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XHJcblxyXG4vKipcclxuICogQ29waWVzIGEgZGlyZWN0b3J5IChyZWN1cnNpdmVseSkgdG8gYW5vdGhlciBsb2NhdGlvblxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBsb2NhdGlvblxyXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggcGF0aFRvQ29weSwgbG9jYXRpb24sIG9wdGlvbnMgKSB7XHJcbiAgd2luc3Rvbi5pbmZvKCBgY29weWluZyAke3BhdGhUb0NvcHl9IGludG8gJHtsb2NhdGlvbn1gICk7XHJcblxyXG4gIHJldHVybiBuZXcgUHJvbWlzZSggKCByZXNvbHZlLCByZWplY3QgKSA9PiB7XHJcbiAgICBuY3AubmNwKCBwYXRoVG9Db3B5LCBsb2NhdGlvbiwgb3B0aW9ucywgZXJyID0+IHtcclxuICAgICAgaWYgKCBlcnIgKSB7XHJcbiAgICAgICAgcmVqZWN0KCBuZXcgRXJyb3IoIGBjb3B5RGlyZWN0b3J5IGVycm9yOiAke2Vycn1gICkgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9ICk7XHJcbn07Il0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUEsR0FBRyxHQUFHQyxPQUFPLENBQUUsS0FBTSxDQUFDO0FBQzVCLElBQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFFLFNBQVUsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FFLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLFVBQVUsRUFBRUMsUUFBUSxFQUFFQyxPQUFPLEVBQUc7RUFDekRMLE9BQU8sQ0FBQ00sSUFBSSxZQUFBQyxNQUFBLENBQWFKLFVBQVUsWUFBQUksTUFBQSxDQUFTSCxRQUFRLENBQUcsQ0FBQztFQUV4RCxPQUFPLElBQUlJLE9BQU8sQ0FBRSxVQUFFQyxPQUFPLEVBQUVDLE1BQU0sRUFBTTtJQUN6Q1osR0FBRyxDQUFDQSxHQUFHLENBQUVLLFVBQVUsRUFBRUMsUUFBUSxFQUFFQyxPQUFPLEVBQUUsVUFBQU0sR0FBRyxFQUFJO01BQzdDLElBQUtBLEdBQUcsRUFBRztRQUNURCxNQUFNLENBQUUsSUFBSUUsS0FBSyx5QkFBQUwsTUFBQSxDQUEwQkksR0FBRyxDQUFHLENBQUUsQ0FBQztNQUN0RCxDQUFDLE1BQ0k7UUFDSEYsT0FBTyxDQUFDLENBQUM7TUFDWDtJQUNGLENBQUUsQ0FBQztFQUNMLENBQUUsQ0FBQztBQUNMLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=