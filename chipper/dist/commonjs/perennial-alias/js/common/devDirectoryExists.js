"use strict";

// Copyright 2017, University of Colorado Boulder

/**
 * Checks to see whether a directory on the dev server exists.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var devSsh = require('./devSsh');

/**
 * Checks to see whether a directory on the dev server exists.
 * @public
 *
 * @param {string} directory
 * @returns {Promise.<boolean>} - Whether the directory exists
 */
module.exports = function (directory) {
  return devSsh("[[ -d \"".concat(directory, "\" ]] && echo exists || echo not")).then(function (stdout) {
    if (stdout.trim() === 'exists') {
      return true;
    } else if (stdout.trim() === 'not') {
      return false;
    } else {
      throw new Error("Problem determining whether a dev directory exists: ".concat(directory));
    }
  })["catch"](function (reason) {
    if (reason.stderr.includes('Connection timed out')) {
      throw new Error('Cannot reach the dev server.  Check that you have an internet connection and that you are either on campus or on the VPN.');
    }
    throw new Error(reason);
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkZXZTc2giLCJyZXF1aXJlIiwibW9kdWxlIiwiZXhwb3J0cyIsImRpcmVjdG9yeSIsImNvbmNhdCIsInRoZW4iLCJzdGRvdXQiLCJ0cmltIiwiRXJyb3IiLCJyZWFzb24iLCJzdGRlcnIiLCJpbmNsdWRlcyJdLCJzb3VyY2VzIjpbImRldkRpcmVjdG9yeUV4aXN0cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ2hlY2tzIHRvIHNlZSB3aGV0aGVyIGEgZGlyZWN0b3J5IG9uIHRoZSBkZXYgc2VydmVyIGV4aXN0cy5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcblxyXG5jb25zdCBkZXZTc2ggPSByZXF1aXJlKCAnLi9kZXZTc2gnICk7XHJcblxyXG4vKipcclxuICogQ2hlY2tzIHRvIHNlZSB3aGV0aGVyIGEgZGlyZWN0b3J5IG9uIHRoZSBkZXYgc2VydmVyIGV4aXN0cy5cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGlyZWN0b3J5XHJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxib29sZWFuPn0gLSBXaGV0aGVyIHRoZSBkaXJlY3RvcnkgZXhpc3RzXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBkaXJlY3RvcnkgKSB7XHJcbiAgcmV0dXJuIGRldlNzaCggYFtbIC1kIFwiJHtkaXJlY3Rvcnl9XCIgXV0gJiYgZWNobyBleGlzdHMgfHwgZWNobyBub3RgICkudGhlbiggc3Rkb3V0ID0+IHtcclxuICAgIGlmICggc3Rkb3V0LnRyaW0oKSA9PT0gJ2V4aXN0cycgKSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHN0ZG91dC50cmltKCkgPT09ICdub3QnICkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCBgUHJvYmxlbSBkZXRlcm1pbmluZyB3aGV0aGVyIGEgZGV2IGRpcmVjdG9yeSBleGlzdHM6ICR7ZGlyZWN0b3J5fWAgKTtcclxuICAgIH1cclxuICB9ICkuY2F0Y2goIHJlYXNvbiA9PiB7XHJcbiAgICBpZiAoIHJlYXNvbi5zdGRlcnIuaW5jbHVkZXMoICdDb25uZWN0aW9uIHRpbWVkIG91dCcgKSApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQ2Fubm90IHJlYWNoIHRoZSBkZXYgc2VydmVyLiAgQ2hlY2sgdGhhdCB5b3UgaGF2ZSBhbiBpbnRlcm5ldCBjb25uZWN0aW9uIGFuZCB0aGF0IHlvdSBhcmUgZWl0aGVyIG9uIGNhbXB1cyBvciBvbiB0aGUgVlBOLicgKTtcclxuICAgIH1cclxuICAgIHRocm93IG5ldyBFcnJvciggcmVhc29uICk7XHJcbiAgfSApO1xyXG59OyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLElBQU1BLE1BQU0sR0FBR0MsT0FBTyxDQUFFLFVBQVcsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUMsTUFBTSxDQUFDQyxPQUFPLEdBQUcsVUFBVUMsU0FBUyxFQUFHO0VBQ3JDLE9BQU9KLE1BQU0sWUFBQUssTUFBQSxDQUFZRCxTQUFTLHFDQUFrQyxDQUFDLENBQUNFLElBQUksQ0FBRSxVQUFBQyxNQUFNLEVBQUk7SUFDcEYsSUFBS0EsTUFBTSxDQUFDQyxJQUFJLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRztNQUNoQyxPQUFPLElBQUk7SUFDYixDQUFDLE1BQ0ksSUFBS0QsTUFBTSxDQUFDQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEtBQUssRUFBRztNQUNsQyxPQUFPLEtBQUs7SUFDZCxDQUFDLE1BQ0k7TUFDSCxNQUFNLElBQUlDLEtBQUssd0RBQUFKLE1BQUEsQ0FBeURELFNBQVMsQ0FBRyxDQUFDO0lBQ3ZGO0VBQ0YsQ0FBRSxDQUFDLFNBQU0sQ0FBRSxVQUFBTSxNQUFNLEVBQUk7SUFDbkIsSUFBS0EsTUFBTSxDQUFDQyxNQUFNLENBQUNDLFFBQVEsQ0FBRSxzQkFBdUIsQ0FBQyxFQUFHO01BQ3RELE1BQU0sSUFBSUgsS0FBSyxDQUFFLDJIQUE0SCxDQUFDO0lBQ2hKO0lBQ0EsTUFBTSxJQUFJQSxLQUFLLENBQUVDLE1BQU8sQ0FBQztFQUMzQixDQUFFLENBQUM7QUFDTCxDQUFDIiwiaWdub3JlTGlzdCI6W119