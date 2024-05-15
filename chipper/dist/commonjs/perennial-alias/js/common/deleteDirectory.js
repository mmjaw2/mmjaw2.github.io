"use strict";

// Copyright 2020, University of Colorado Boulder

/**
 * Deletes a path recursively
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var execute = require('./execute');
var winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Deletes a path recursively
 * @public
 *
 * @param {string} path - The path to delete recursively
 * @returns {Promise}
 */
module.exports = function (path) {
  winston.info("Deleting directory ".concat(path));
  return execute('rm', ['-Rf', path], '../');
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicGF0aCIsImluZm8iLCJjb25jYXQiXSwic291cmNlcyI6WyJkZWxldGVEaXJlY3RvcnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIERlbGV0ZXMgYSBwYXRoIHJlY3Vyc2l2ZWx5XHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5cclxuLyoqXHJcbiAqIERlbGV0ZXMgYSBwYXRoIHJlY3Vyc2l2ZWx5XHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBUaGUgcGF0aCB0byBkZWxldGUgcmVjdXJzaXZlbHlcclxuICogQHJldHVybnMge1Byb21pc2V9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBwYXRoICkge1xyXG4gIHdpbnN0b24uaW5mbyggYERlbGV0aW5nIGRpcmVjdG9yeSAke3BhdGh9YCApO1xyXG5cclxuICByZXR1cm4gZXhlY3V0ZSggJ3JtJywgWyAnLVJmJywgcGF0aCBdLCAnLi4vJyApO1xyXG59OyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU1BLE9BQU8sR0FBR0MsT0FBTyxDQUFFLFdBQVksQ0FBQztBQUN0QyxJQUFNQyxPQUFPLEdBQUdELE9BQU8sQ0FBRSxTQUFVLENBQUM7O0FBRXBDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FFLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLElBQUksRUFBRztFQUNoQ0gsT0FBTyxDQUFDSSxJQUFJLHVCQUFBQyxNQUFBLENBQXdCRixJQUFJLENBQUcsQ0FBQztFQUU1QyxPQUFPTCxPQUFPLENBQUUsSUFBSSxFQUFFLENBQUUsS0FBSyxFQUFFSyxJQUFJLENBQUUsRUFBRSxLQUFNLENBQUM7QUFDaEQsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==