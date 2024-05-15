"use strict";

// Copyright 2017, University of Colorado Boulder

/**
 * git commit
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var execute = require('./execute');
var winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Executes git commit
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} message - The message to include in the commit
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */
module.exports = function (repo, message) {
  winston.info("git commit on ".concat(repo, " with message:\n").concat(message));
  return execute('git', ['commit', '--no-verify', '-m', message], "../".concat(repo));
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsIm1lc3NhZ2UiLCJpbmZvIiwiY29uY2F0Il0sInNvdXJjZXMiOlsiZ2l0Q29tbWl0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBnaXQgY29tbWl0XHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5cclxuLyoqXHJcbiAqIEV4ZWN1dGVzIGdpdCBjb21taXRcclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSB0byBpbmNsdWRlIGluIHRoZSBjb21taXRcclxuICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59IC0gU3Rkb3V0XHJcbiAqIEByZWplY3RzIHtFeGVjdXRlRXJyb3J9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCByZXBvLCBtZXNzYWdlICkge1xyXG4gIHdpbnN0b24uaW5mbyggYGdpdCBjb21taXQgb24gJHtyZXBvfSB3aXRoIG1lc3NhZ2U6XFxuJHttZXNzYWdlfWAgKTtcclxuXHJcbiAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBbICdjb21taXQnLCAnLS1uby12ZXJpZnknLCAnLW0nLCBtZXNzYWdlIF0sIGAuLi8ke3JlcG99YCApO1xyXG59OyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU1BLE9BQU8sR0FBR0MsT0FBTyxDQUFFLFdBQVksQ0FBQztBQUN0QyxJQUFNQyxPQUFPLEdBQUdELE9BQU8sQ0FBRSxTQUFVLENBQUM7O0FBRXBDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRSxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxJQUFJLEVBQUVDLE9BQU8sRUFBRztFQUN6Q0osT0FBTyxDQUFDSyxJQUFJLGtCQUFBQyxNQUFBLENBQW1CSCxJQUFJLHNCQUFBRyxNQUFBLENBQW1CRixPQUFPLENBQUcsQ0FBQztFQUVqRSxPQUFPTixPQUFPLENBQUUsS0FBSyxFQUFFLENBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUVNLE9BQU8sQ0FBRSxRQUFBRSxNQUFBLENBQVFILElBQUksQ0FBRyxDQUFDO0FBQ25GLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=