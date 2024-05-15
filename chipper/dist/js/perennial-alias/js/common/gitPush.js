// Copyright 2017, University of Colorado Boulder

/**
 * git push
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('./execute');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

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
  winston.info(`git push on ${repo} to ${remoteBranch}`);
  return execute('git', ['push', '-u', 'origin', remoteBranch], `../${repo}`);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsInJlbW90ZUJyYW5jaCIsImluZm8iXSwic291cmNlcyI6WyJnaXRQdXNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBnaXQgcHVzaFxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbi8qKlxyXG4gKiBFeGVjdXRlcyBnaXQgcHVzaFxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVtb3RlQnJhbmNoIC0gVGhlIGJyYW5jaCB0aGF0IGlzIGdldHRpbmcgcHVzaGVkIHRvLCBlLmcuICdtYWluJyBvciAnMS4wJ1xyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nPn0gLSBTdGRvdXRcclxuICogQHJlamVjdHMge0V4ZWN1dGVFcnJvcn1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIHJlcG8sIHJlbW90ZUJyYW5jaCApIHtcclxuICB3aW5zdG9uLmluZm8oIGBnaXQgcHVzaCBvbiAke3JlcG99IHRvICR7cmVtb3RlQnJhbmNofWAgKTtcclxuXHJcbiAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBbICdwdXNoJywgJy11JywgJ29yaWdpbicsIHJlbW90ZUJyYW5jaCBdLCBgLi4vJHtyZXBvfWAgKTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsV0FBWSxDQUFDO0FBQ3RDLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFFLFNBQVUsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FFLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLElBQUksRUFBRUMsWUFBWSxFQUFHO0VBQzlDSixPQUFPLENBQUNLLElBQUksQ0FBRyxlQUFjRixJQUFLLE9BQU1DLFlBQWEsRUFBRSxDQUFDO0VBRXhELE9BQU9OLE9BQU8sQ0FBRSxLQUFLLEVBQUUsQ0FBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRU0sWUFBWSxDQUFFLEVBQUcsTUFBS0QsSUFBSyxFQUFFLENBQUM7QUFDakYsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==