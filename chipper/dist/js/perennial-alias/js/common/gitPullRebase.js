// Copyright 2017, University of Colorado Boulder

/**
 * git pull --rebase
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('./execute');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Executes git pull
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */
module.exports = function (repo) {
  winston.info(`git pull --rebase on ${repo}`);
  return execute('git', ['pull', '--rebase'], `../${repo}`);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImluZm8iXSwic291cmNlcyI6WyJnaXRQdWxsUmViYXNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBnaXQgcHVsbCAtLXJlYmFzZVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbi8qKlxyXG4gKiBFeGVjdXRlcyBnaXQgcHVsbFxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nPn0gLSBTdGRvdXRcclxuICogQHJlamVjdHMge0V4ZWN1dGVFcnJvcn1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIHJlcG8gKSB7XHJcbiAgd2luc3Rvbi5pbmZvKCBgZ2l0IHB1bGwgLS1yZWJhc2Ugb24gJHtyZXBvfWAgKTtcclxuXHJcbiAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBbICdwdWxsJywgJy0tcmViYXNlJyBdLCBgLi4vJHtyZXBvfWAgKTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsV0FBWSxDQUFDO0FBQ3RDLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFFLFNBQVUsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRSxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxJQUFJLEVBQUc7RUFDaENILE9BQU8sQ0FBQ0ksSUFBSSxDQUFHLHdCQUF1QkQsSUFBSyxFQUFFLENBQUM7RUFFOUMsT0FBT0wsT0FBTyxDQUFFLEtBQUssRUFBRSxDQUFFLE1BQU0sRUFBRSxVQUFVLENBQUUsRUFBRyxNQUFLSyxJQUFLLEVBQUUsQ0FBQztBQUMvRCxDQUFDIiwiaWdub3JlTGlzdCI6W119