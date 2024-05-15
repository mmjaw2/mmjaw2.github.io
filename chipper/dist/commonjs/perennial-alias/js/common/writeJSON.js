"use strict";

// Copyright 2017, University of Colorado Boulder

/**
 * Handling for writing JSON to a file.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var fs = require('fs');
var winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Write JSON to a file
 * @public
 *
 * @param {string} file
 * @param {Object} content
 * @returns {Promise}
 */
module.exports = function (file, content) {
  return new Promise(function (resolve, reject) {
    winston.debug("Writing JSON to ".concat(file));
    fs.writeFile(file, JSON.stringify(content, null, 2), function (err) {
      if (err) {
        reject(new Error("Could not write to file: ".concat(file, " due to: ").concat(err)));
      } else {
        resolve();
      }
    });
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJ3aW5zdG9uIiwibW9kdWxlIiwiZXhwb3J0cyIsImZpbGUiLCJjb250ZW50IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJkZWJ1ZyIsImNvbmNhdCIsIndyaXRlRmlsZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJlcnIiLCJFcnJvciJdLCJzb3VyY2VzIjpbIndyaXRlSlNPTi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogSGFuZGxpbmcgZm9yIHdyaXRpbmcgSlNPTiB0byBhIGZpbGUuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlIEpTT04gdG8gYSBmaWxlXHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVcclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRlbnRcclxuICogQHJldHVybnMge1Byb21pc2V9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBmaWxlLCBjb250ZW50ICkge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSggKCByZXNvbHZlLCByZWplY3QgKSA9PiB7XHJcbiAgICB3aW5zdG9uLmRlYnVnKCBgV3JpdGluZyBKU09OIHRvICR7ZmlsZX1gICk7XHJcblxyXG4gICAgZnMud3JpdGVGaWxlKCBmaWxlLCBKU09OLnN0cmluZ2lmeSggY29udGVudCwgbnVsbCwgMiApLCBlcnIgPT4ge1xyXG4gICAgICBpZiAoIGVyciApIHtcclxuICAgICAgICByZWplY3QoIG5ldyBFcnJvciggYENvdWxkIG5vdCB3cml0ZSB0byBmaWxlOiAke2ZpbGV9IGR1ZSB0bzogJHtlcnJ9YCApICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfSApO1xyXG59OyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU1BLEVBQUUsR0FBR0MsT0FBTyxDQUFFLElBQUssQ0FBQztBQUMxQixJQUFNQyxPQUFPLEdBQUdELE9BQU8sQ0FBRSxTQUFVLENBQUM7O0FBRXBDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUUsTUFBTSxDQUFDQyxPQUFPLEdBQUcsVUFBVUMsSUFBSSxFQUFFQyxPQUFPLEVBQUc7RUFDekMsT0FBTyxJQUFJQyxPQUFPLENBQUUsVUFBRUMsT0FBTyxFQUFFQyxNQUFNLEVBQU07SUFDekNQLE9BQU8sQ0FBQ1EsS0FBSyxvQkFBQUMsTUFBQSxDQUFxQk4sSUFBSSxDQUFHLENBQUM7SUFFMUNMLEVBQUUsQ0FBQ1ksU0FBUyxDQUFFUCxJQUFJLEVBQUVRLElBQUksQ0FBQ0MsU0FBUyxDQUFFUixPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUUsQ0FBQyxFQUFFLFVBQUFTLEdBQUcsRUFBSTtNQUM3RCxJQUFLQSxHQUFHLEVBQUc7UUFDVE4sTUFBTSxDQUFFLElBQUlPLEtBQUssNkJBQUFMLE1BQUEsQ0FBOEJOLElBQUksZUFBQU0sTUFBQSxDQUFZSSxHQUFHLENBQUcsQ0FBRSxDQUFDO01BQzFFLENBQUMsTUFDSTtRQUNIUCxPQUFPLENBQUMsQ0FBQztNQUNYO0lBQ0YsQ0FBRSxDQUFDO0VBQ0wsQ0FBRSxDQUFDO0FBQ0wsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==