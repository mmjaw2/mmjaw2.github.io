"use strict";

// Copyright 2017, University of Colorado Boulder

/**
 * git push
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var execute = require('./execute');
var winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Executes git push
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} remoteBranch - The branch that is getting pushed to, e.g. 'main' or '1.0'
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */
module.exports = function (repo, remoteBranch) {
  winston.info("git push on ".concat(repo, " to ").concat(remoteBranch));
  return execute('git', ['push', '-u', 'origin', remoteBranch], "../".concat(repo));
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsInJlbW90ZUJyYW5jaCIsImluZm8iLCJjb25jYXQiXSwic291cmNlcyI6WyJnaXRQdXNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBnaXQgcHVzaFxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbi8qKlxyXG4gKiBFeGVjdXRlcyBnaXQgcHVzaFxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVtb3RlQnJhbmNoIC0gVGhlIGJyYW5jaCB0aGF0IGlzIGdldHRpbmcgcHVzaGVkIHRvLCBlLmcuICdtYWluJyBvciAnMS4wJ1xyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nPn0gLSBTdGRvdXRcclxuICogQHJlamVjdHMge0V4ZWN1dGVFcnJvcn1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIHJlcG8sIHJlbW90ZUJyYW5jaCApIHtcclxuICB3aW5zdG9uLmluZm8oIGBnaXQgcHVzaCBvbiAke3JlcG99IHRvICR7cmVtb3RlQnJhbmNofWAgKTtcclxuXHJcbiAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBbICdwdXNoJywgJy11JywgJ29yaWdpbicsIHJlbW90ZUJyYW5jaCBdLCBgLi4vJHtyZXBvfWAgKTtcclxufTsiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFNQSxPQUFPLEdBQUdDLE9BQU8sQ0FBRSxXQUFZLENBQUM7QUFDdEMsSUFBTUMsT0FBTyxHQUFHRCxPQUFPLENBQUUsU0FBVSxDQUFDOztBQUVwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUUsTUFBTSxDQUFDQyxPQUFPLEdBQUcsVUFBVUMsSUFBSSxFQUFFQyxZQUFZLEVBQUc7RUFDOUNKLE9BQU8sQ0FBQ0ssSUFBSSxnQkFBQUMsTUFBQSxDQUFpQkgsSUFBSSxVQUFBRyxNQUFBLENBQU9GLFlBQVksQ0FBRyxDQUFDO0VBRXhELE9BQU9OLE9BQU8sQ0FBRSxLQUFLLEVBQUUsQ0FBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRU0sWUFBWSxDQUFFLFFBQUFFLE1BQUEsQ0FBUUgsSUFBSSxDQUFHLENBQUM7QUFDakYsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==