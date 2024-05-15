// Copyright 2017, University of Colorado Boulder

/**
 * Clones the given repo name into the working copy
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('./execute');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Clones the given repo name into the working copy
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise}
 */
module.exports = function (repo) {
  winston.info(`cloning ${repo}`);
  if (repo === 'perennial-alias') {
    return execute('git', ['clone', 'https://github.com/phetsims/perennial.git', 'perennial-alias'], '../');
  } else {
    return execute('git', ['clone', `https://github.com/phetsims/${repo}.git`], '../');
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImluZm8iXSwic291cmNlcyI6WyJjbG9uZVJlcG8uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTcsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENsb25lcyB0aGUgZ2l2ZW4gcmVwbyBuYW1lIGludG8gdGhlIHdvcmtpbmcgY29weVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbi8qKlxyXG4gKiBDbG9uZXMgdGhlIGdpdmVuIHJlcG8gbmFtZSBpbnRvIHRoZSB3b3JraW5nIGNvcHlcclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcclxuICogQHJldHVybnMge1Byb21pc2V9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCByZXBvICkge1xyXG4gIHdpbnN0b24uaW5mbyggYGNsb25pbmcgJHtyZXBvfWAgKTtcclxuXHJcbiAgaWYgKCByZXBvID09PSAncGVyZW5uaWFsLWFsaWFzJyApIHtcclxuICAgIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAnY2xvbmUnLCAnaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BlcmVubmlhbC5naXQnLCAncGVyZW5uaWFsLWFsaWFzJyBdLCAnLi4vJyApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAnY2xvbmUnLCBgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zLyR7cmVwb30uZ2l0YCBdLCAnLi4vJyApO1xyXG4gIH1cclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsV0FBWSxDQUFDO0FBQ3RDLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFFLFNBQVUsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUUsTUFBTSxDQUFDQyxPQUFPLEdBQUcsVUFBVUMsSUFBSSxFQUFHO0VBQ2hDSCxPQUFPLENBQUNJLElBQUksQ0FBRyxXQUFVRCxJQUFLLEVBQUUsQ0FBQztFQUVqQyxJQUFLQSxJQUFJLEtBQUssaUJBQWlCLEVBQUc7SUFDaEMsT0FBT0wsT0FBTyxDQUFFLEtBQUssRUFBRSxDQUFFLE9BQU8sRUFBRSwyQ0FBMkMsRUFBRSxpQkFBaUIsQ0FBRSxFQUFFLEtBQU0sQ0FBQztFQUM3RyxDQUFDLE1BQ0k7SUFDSCxPQUFPQSxPQUFPLENBQUUsS0FBSyxFQUFFLENBQUUsT0FBTyxFQUFHLCtCQUE4QkssSUFBSyxNQUFLLENBQUUsRUFBRSxLQUFNLENBQUM7RUFDeEY7QUFDRixDQUFDIiwiaWdub3JlTGlzdCI6W119