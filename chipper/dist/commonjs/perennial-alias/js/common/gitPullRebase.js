"use strict";

// Copyright 2017, University of Colorado Boulder

/**
 * git pull --rebase
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var execute = require('./execute');
var winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Executes git pull
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */
module.exports = function (repo) {
  winston.info("git pull --rebase on ".concat(repo));
  return execute('git', ['pull', '--rebase'], "../".concat(repo));
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImluZm8iLCJjb25jYXQiXSwic291cmNlcyI6WyJnaXRQdWxsUmViYXNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBnaXQgcHVsbCAtLXJlYmFzZVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbi8qKlxyXG4gKiBFeGVjdXRlcyBnaXQgcHVsbFxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nPn0gLSBTdGRvdXRcclxuICogQHJlamVjdHMge0V4ZWN1dGVFcnJvcn1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIHJlcG8gKSB7XHJcbiAgd2luc3Rvbi5pbmZvKCBgZ2l0IHB1bGwgLS1yZWJhc2Ugb24gJHtyZXBvfWAgKTtcclxuXHJcbiAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBbICdwdWxsJywgJy0tcmViYXNlJyBdLCBgLi4vJHtyZXBvfWAgKTtcclxufTsiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFNQSxPQUFPLEdBQUdDLE9BQU8sQ0FBRSxXQUFZLENBQUM7QUFDdEMsSUFBTUMsT0FBTyxHQUFHRCxPQUFPLENBQUUsU0FBVSxDQUFDOztBQUVwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FFLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLElBQUksRUFBRztFQUNoQ0gsT0FBTyxDQUFDSSxJQUFJLHlCQUFBQyxNQUFBLENBQTBCRixJQUFJLENBQUcsQ0FBQztFQUU5QyxPQUFPTCxPQUFPLENBQUUsS0FBSyxFQUFFLENBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBRSxRQUFBTyxNQUFBLENBQVFGLElBQUksQ0FBRyxDQUFDO0FBQy9ELENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=