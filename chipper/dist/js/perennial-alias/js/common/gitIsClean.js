// Copyright 2017-2022, University of Colorado Boulder

/**
 * Checks to see if the git state/status is clean
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('./execute');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Checks to see if the git state/status is clean
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} [file] - Optional file or path if you only want to check state of a single file or subdirectory
 * @returns {Promise.<boolean>} - Whether it is clean or not
 * @rejects {ExecuteError}
 */
module.exports = function (repo, file) {
  winston.debug(`git status check on ${repo}`);
  const gitArgs = ['status', '--porcelain'];
  if (file) {
    gitArgs.push(file);
  }
  return execute('git', gitArgs, `../${repo}`).then(stdout => Promise.resolve(stdout.length === 0));
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImZpbGUiLCJkZWJ1ZyIsImdpdEFyZ3MiLCJwdXNoIiwidGhlbiIsInN0ZG91dCIsIlByb21pc2UiLCJyZXNvbHZlIiwibGVuZ3RoIl0sInNvdXJjZXMiOlsiZ2l0SXNDbGVhbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDIyLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgdG8gc2VlIGlmIHRoZSBnaXQgc3RhdGUvc3RhdHVzIGlzIGNsZWFuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5cclxuLyoqXHJcbiAqIENoZWNrcyB0byBzZWUgaWYgdGhlIGdpdCBzdGF0ZS9zdGF0dXMgaXMgY2xlYW5cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IFtmaWxlXSAtIE9wdGlvbmFsIGZpbGUgb3IgcGF0aCBpZiB5b3Ugb25seSB3YW50IHRvIGNoZWNrIHN0YXRlIG9mIGEgc2luZ2xlIGZpbGUgb3Igc3ViZGlyZWN0b3J5XHJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxib29sZWFuPn0gLSBXaGV0aGVyIGl0IGlzIGNsZWFuIG9yIG5vdFxyXG4gKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggcmVwbywgZmlsZSApIHtcclxuICB3aW5zdG9uLmRlYnVnKCBgZ2l0IHN0YXR1cyBjaGVjayBvbiAke3JlcG99YCApO1xyXG5cclxuICBjb25zdCBnaXRBcmdzID0gWyAnc3RhdHVzJywgJy0tcG9yY2VsYWluJyBdO1xyXG5cclxuICBpZiAoIGZpbGUgKSB7XHJcbiAgICBnaXRBcmdzLnB1c2goIGZpbGUgKTtcclxuICB9XHJcbiAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBnaXRBcmdzLCBgLi4vJHtyZXBvfWAgKS50aGVuKCBzdGRvdXQgPT4gUHJvbWlzZS5yZXNvbHZlKCBzdGRvdXQubGVuZ3RoID09PSAwICkgKTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsV0FBWSxDQUFDO0FBQ3RDLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFFLFNBQVUsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FFLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLElBQUksRUFBRUMsSUFBSSxFQUFHO0VBQ3RDSixPQUFPLENBQUNLLEtBQUssQ0FBRyx1QkFBc0JGLElBQUssRUFBRSxDQUFDO0VBRTlDLE1BQU1HLE9BQU8sR0FBRyxDQUFFLFFBQVEsRUFBRSxhQUFhLENBQUU7RUFFM0MsSUFBS0YsSUFBSSxFQUFHO0lBQ1ZFLE9BQU8sQ0FBQ0MsSUFBSSxDQUFFSCxJQUFLLENBQUM7RUFDdEI7RUFDQSxPQUFPTixPQUFPLENBQUUsS0FBSyxFQUFFUSxPQUFPLEVBQUcsTUFBS0gsSUFBSyxFQUFFLENBQUMsQ0FBQ0ssSUFBSSxDQUFFQyxNQUFNLElBQUlDLE9BQU8sQ0FBQ0MsT0FBTyxDQUFFRixNQUFNLENBQUNHLE1BQU0sS0FBSyxDQUFFLENBQUUsQ0FBQztBQUN6RyxDQUFDIiwiaWdub3JlTGlzdCI6W119