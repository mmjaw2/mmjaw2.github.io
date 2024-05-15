"use strict";

// Copyright 2017, University of Colorado Boulder

/**
 * git cherry-pick (but if it fails, it will back out of the cherry-pick)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var execute = require('./execute');
var winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Executes git cherry-pick (but if it fails, it will back out of the cherry-pick)
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} target - The SHA/branch/whatnot to check out
 * @returns {Promise.<boolean>} - Resolves to whether the cherry-pick worked or not. If aborting fails, will reject.
 */
module.exports = function (repo, target) {
  winston.info("git cherry-pick ".concat(target, " on ").concat(repo));
  return execute('git', ['cherry-pick', target], "../".concat(repo)).then(function (stdout) {
    return Promise.resolve(true);
  }, function (cherryPickError) {
    winston.info("git cherry-pick failed (aborting): ".concat(target, " on ").concat(repo));
    return execute('git', ['cherry-pick', '--abort'], "../".concat(repo)).then(function (stdout) {
      return Promise.resolve(false);
    }, function (abortError) {
      winston.error("git cherry-pick --abort failed: ".concat(target, " on ").concat(repo));
      return Promise.reject(abortError);
    });
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsInRhcmdldCIsImluZm8iLCJjb25jYXQiLCJ0aGVuIiwic3Rkb3V0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJjaGVycnlQaWNrRXJyb3IiLCJhYm9ydEVycm9yIiwiZXJyb3IiLCJyZWplY3QiXSwic291cmNlcyI6WyJnaXRDaGVycnlQaWNrLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBnaXQgY2hlcnJ5LXBpY2sgKGJ1dCBpZiBpdCBmYWlscywgaXQgd2lsbCBiYWNrIG91dCBvZiB0aGUgY2hlcnJ5LXBpY2spXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5cclxuLyoqXHJcbiAqIEV4ZWN1dGVzIGdpdCBjaGVycnktcGljayAoYnV0IGlmIGl0IGZhaWxzLCBpdCB3aWxsIGJhY2sgb3V0IG9mIHRoZSBjaGVycnktcGljaylcclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IHRhcmdldCAtIFRoZSBTSEEvYnJhbmNoL3doYXRub3QgdG8gY2hlY2sgb3V0XHJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxib29sZWFuPn0gLSBSZXNvbHZlcyB0byB3aGV0aGVyIHRoZSBjaGVycnktcGljayB3b3JrZWQgb3Igbm90LiBJZiBhYm9ydGluZyBmYWlscywgd2lsbCByZWplY3QuXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCByZXBvLCB0YXJnZXQgKSB7XHJcbiAgd2luc3Rvbi5pbmZvKCBgZ2l0IGNoZXJyeS1waWNrICR7dGFyZ2V0fSBvbiAke3JlcG99YCApO1xyXG5cclxuICByZXR1cm4gZXhlY3V0ZSggJ2dpdCcsIFsgJ2NoZXJyeS1waWNrJywgdGFyZ2V0IF0sIGAuLi8ke3JlcG99YCApLnRoZW4oIHN0ZG91dCA9PiBQcm9taXNlLnJlc29sdmUoIHRydWUgKSwgY2hlcnJ5UGlja0Vycm9yID0+IHtcclxuICAgIHdpbnN0b24uaW5mbyggYGdpdCBjaGVycnktcGljayBmYWlsZWQgKGFib3J0aW5nKTogJHt0YXJnZXR9IG9uICR7cmVwb31gICk7XHJcblxyXG4gICAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBbICdjaGVycnktcGljaycsICctLWFib3J0JyBdLCBgLi4vJHtyZXBvfWAgKS50aGVuKCBzdGRvdXQgPT4gUHJvbWlzZS5yZXNvbHZlKCBmYWxzZSApLCBhYm9ydEVycm9yID0+IHtcclxuICAgICAgd2luc3Rvbi5lcnJvciggYGdpdCBjaGVycnktcGljayAtLWFib3J0IGZhaWxlZDogJHt0YXJnZXR9IG9uICR7cmVwb31gICk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCggYWJvcnRFcnJvciApO1xyXG4gICAgfSApO1xyXG4gIH0gKTtcclxufTsiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFNQSxPQUFPLEdBQUdDLE9BQU8sQ0FBRSxXQUFZLENBQUM7QUFDdEMsSUFBTUMsT0FBTyxHQUFHRCxPQUFPLENBQUUsU0FBVSxDQUFDOztBQUVwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FFLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLElBQUksRUFBRUMsTUFBTSxFQUFHO0VBQ3hDSixPQUFPLENBQUNLLElBQUksb0JBQUFDLE1BQUEsQ0FBcUJGLE1BQU0sVUFBQUUsTUFBQSxDQUFPSCxJQUFJLENBQUcsQ0FBQztFQUV0RCxPQUFPTCxPQUFPLENBQUUsS0FBSyxFQUFFLENBQUUsYUFBYSxFQUFFTSxNQUFNLENBQUUsUUFBQUUsTUFBQSxDQUFRSCxJQUFJLENBQUcsQ0FBQyxDQUFDSSxJQUFJLENBQUUsVUFBQUMsTUFBTTtJQUFBLE9BQUlDLE9BQU8sQ0FBQ0MsT0FBTyxDQUFFLElBQUssQ0FBQztFQUFBLEdBQUUsVUFBQUMsZUFBZSxFQUFJO0lBQzNIWCxPQUFPLENBQUNLLElBQUksdUNBQUFDLE1BQUEsQ0FBd0NGLE1BQU0sVUFBQUUsTUFBQSxDQUFPSCxJQUFJLENBQUcsQ0FBQztJQUV6RSxPQUFPTCxPQUFPLENBQUUsS0FBSyxFQUFFLENBQUUsYUFBYSxFQUFFLFNBQVMsQ0FBRSxRQUFBUSxNQUFBLENBQVFILElBQUksQ0FBRyxDQUFDLENBQUNJLElBQUksQ0FBRSxVQUFBQyxNQUFNO01BQUEsT0FBSUMsT0FBTyxDQUFDQyxPQUFPLENBQUUsS0FBTSxDQUFDO0lBQUEsR0FBRSxVQUFBRSxVQUFVLEVBQUk7TUFDMUhaLE9BQU8sQ0FBQ2EsS0FBSyxvQ0FBQVAsTUFBQSxDQUFxQ0YsTUFBTSxVQUFBRSxNQUFBLENBQU9ILElBQUksQ0FBRyxDQUFDO01BQ3ZFLE9BQU9NLE9BQU8sQ0FBQ0ssTUFBTSxDQUFFRixVQUFXLENBQUM7SUFDckMsQ0FBRSxDQUFDO0VBQ0wsQ0FBRSxDQUFDO0FBQ0wsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==