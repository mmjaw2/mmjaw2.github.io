"use strict";

// Copyright 2017, University of Colorado Boulder

/**
 * Returns the branch (if any) that the repository is on.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var execute = require('./execute');

/**
 * Returns the branch (if any) that the repository is on.
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise} - Resolves to the branch name (or the empty string if not on a branch)
 */
module.exports = function (repo) {
  return execute('git', ['symbolic-ref', '-q', 'HEAD'], "../".concat(repo)).then(function (stdout) {
    return stdout.trim().replace('refs/heads/', '');
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwiY29uY2F0IiwidGhlbiIsInN0ZG91dCIsInRyaW0iLCJyZXBsYWNlIl0sInNvdXJjZXMiOlsiZ2V0QnJhbmNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBicmFuY2ggKGlmIGFueSkgdGhhdCB0aGUgcmVwb3NpdG9yeSBpcyBvbi5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApO1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGJyYW5jaCAoaWYgYW55KSB0aGF0IHRoZSByZXBvc2l0b3J5IGlzIG9uLlxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gLSBSZXNvbHZlcyB0byB0aGUgYnJhbmNoIG5hbWUgKG9yIHRoZSBlbXB0eSBzdHJpbmcgaWYgbm90IG9uIGEgYnJhbmNoKVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggcmVwbyApIHtcclxuICByZXR1cm4gZXhlY3V0ZSggJ2dpdCcsIFsgJ3N5bWJvbGljLXJlZicsICctcScsICdIRUFEJyBdLCBgLi4vJHtyZXBvfWAgKS50aGVuKCBzdGRvdXQgPT4gc3Rkb3V0LnRyaW0oKS5yZXBsYWNlKCAncmVmcy9oZWFkcy8nLCAnJyApICk7XHJcbn07Il0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsV0FBWSxDQUFDOztBQUV0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBQyxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxJQUFJLEVBQUc7RUFDaEMsT0FBT0osT0FBTyxDQUFFLEtBQUssRUFBRSxDQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFFLFFBQUFLLE1BQUEsQ0FBUUQsSUFBSSxDQUFHLENBQUMsQ0FBQ0UsSUFBSSxDQUFFLFVBQUFDLE1BQU07SUFBQSxPQUFJQSxNQUFNLENBQUNDLElBQUksQ0FBQyxDQUFDLENBQUNDLE9BQU8sQ0FBRSxhQUFhLEVBQUUsRUFBRyxDQUFDO0VBQUEsQ0FBQyxDQUFDO0FBQ3RJLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=