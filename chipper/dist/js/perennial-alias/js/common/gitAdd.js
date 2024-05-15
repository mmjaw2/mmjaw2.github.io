// Copyright 2017, University of Colorado Boulder

/**
 * git add
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('./execute');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Executes git add
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} file - The file to be added
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */
module.exports = function (repo, file) {
  winston.info(`git add ${file} on ${repo}`);
  return execute('git', ['add', file], `../${repo}`);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImZpbGUiLCJpbmZvIl0sInNvdXJjZXMiOlsiZ2l0QWRkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBnaXQgYWRkXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5cclxuLyoqXHJcbiAqIEV4ZWN1dGVzIGdpdCBhZGRcclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGUgLSBUaGUgZmlsZSB0byBiZSBhZGRlZFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nPn0gLSBTdGRvdXRcclxuICogQHJlamVjdHMge0V4ZWN1dGVFcnJvcn1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIHJlcG8sIGZpbGUgKSB7XHJcbiAgd2luc3Rvbi5pbmZvKCBgZ2l0IGFkZCAke2ZpbGV9IG9uICR7cmVwb31gICk7XHJcblxyXG4gIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAnYWRkJywgZmlsZSBdLCBgLi4vJHtyZXBvfWAgKTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsV0FBWSxDQUFDO0FBQ3RDLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFFLFNBQVUsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FFLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLElBQUksRUFBRUMsSUFBSSxFQUFHO0VBQ3RDSixPQUFPLENBQUNLLElBQUksQ0FBRyxXQUFVRCxJQUFLLE9BQU1ELElBQUssRUFBRSxDQUFDO0VBRTVDLE9BQU9MLE9BQU8sQ0FBRSxLQUFLLEVBQUUsQ0FBRSxLQUFLLEVBQUVNLElBQUksQ0FBRSxFQUFHLE1BQUtELElBQUssRUFBRSxDQUFDO0FBQ3hELENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=