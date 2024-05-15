"use strict";

// Copyright 2017, University of Colorado Boulder

/**
 * Clones the given repo name into the working copy
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var execute = require('./execute');
var winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Clones the given repo name into the working copy
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise}
 */
module.exports = function (repo) {
  winston.info("cloning ".concat(repo));
  if (repo === 'perennial-alias') {
    return execute('git', ['clone', 'https://github.com/phetsims/perennial.git', 'perennial-alias'], '../');
  } else {
    return execute('git', ['clone', "https://github.com/phetsims/".concat(repo, ".git")], '../');
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImluZm8iLCJjb25jYXQiXSwic291cmNlcyI6WyJjbG9uZVJlcG8uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTcsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENsb25lcyB0aGUgZ2l2ZW4gcmVwbyBuYW1lIGludG8gdGhlIHdvcmtpbmcgY29weVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbi8qKlxyXG4gKiBDbG9uZXMgdGhlIGdpdmVuIHJlcG8gbmFtZSBpbnRvIHRoZSB3b3JraW5nIGNvcHlcclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcclxuICogQHJldHVybnMge1Byb21pc2V9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCByZXBvICkge1xyXG4gIHdpbnN0b24uaW5mbyggYGNsb25pbmcgJHtyZXBvfWAgKTtcclxuXHJcbiAgaWYgKCByZXBvID09PSAncGVyZW5uaWFsLWFsaWFzJyApIHtcclxuICAgIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAnY2xvbmUnLCAnaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BlcmVubmlhbC5naXQnLCAncGVyZW5uaWFsLWFsaWFzJyBdLCAnLi4vJyApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAnY2xvbmUnLCBgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zLyR7cmVwb30uZ2l0YCBdLCAnLi4vJyApO1xyXG4gIH1cclxufTsiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFNQSxPQUFPLEdBQUdDLE9BQU8sQ0FBRSxXQUFZLENBQUM7QUFDdEMsSUFBTUMsT0FBTyxHQUFHRCxPQUFPLENBQUUsU0FBVSxDQUFDOztBQUVwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRSxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxJQUFJLEVBQUc7RUFDaENILE9BQU8sQ0FBQ0ksSUFBSSxZQUFBQyxNQUFBLENBQWFGLElBQUksQ0FBRyxDQUFDO0VBRWpDLElBQUtBLElBQUksS0FBSyxpQkFBaUIsRUFBRztJQUNoQyxPQUFPTCxPQUFPLENBQUUsS0FBSyxFQUFFLENBQUUsT0FBTyxFQUFFLDJDQUEyQyxFQUFFLGlCQUFpQixDQUFFLEVBQUUsS0FBTSxDQUFDO0VBQzdHLENBQUMsTUFDSTtJQUNILE9BQU9BLE9BQU8sQ0FBRSxLQUFLLEVBQUUsQ0FBRSxPQUFPLGlDQUFBTyxNQUFBLENBQWlDRixJQUFJLFVBQVEsRUFBRSxLQUFNLENBQUM7RUFDeEY7QUFDRixDQUFDIiwiaWdub3JlTGlzdCI6W119