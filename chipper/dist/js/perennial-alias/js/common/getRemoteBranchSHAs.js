// Copyright 2017, University of Colorado Boulder

/**
 * Gets a mapping from branch name to branch SHA from the remote
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('./execute');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Gets a mapping from branch name to branch SHA from the remote
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise.<Object>} - Object map from branch => sha {string}
 * @rejects {ExecuteError}
 */
module.exports = async function (repo) {
  winston.debug(`retrieving branches from ${repo}`);
  const map = {};
  (await execute('git', ['ls-remote'], `../${repo}`)).split('\n').forEach(line => {
    const match = line.trim().match(/^(\S+)\s+refs\/heads\/(\S+)$/);
    if (match) {
      map[match[2]] = match[1];
    }
  });
  return map;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImRlYnVnIiwibWFwIiwic3BsaXQiLCJmb3JFYWNoIiwibGluZSIsIm1hdGNoIiwidHJpbSJdLCJzb3VyY2VzIjpbImdldFJlbW90ZUJyYW5jaFNIQXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTcsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBtYXBwaW5nIGZyb20gYnJhbmNoIG5hbWUgdG8gYnJhbmNoIFNIQSBmcm9tIHRoZSByZW1vdGVcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApO1xyXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XHJcblxyXG4vKipcclxuICogR2V0cyBhIG1hcHBpbmcgZnJvbSBicmFuY2ggbmFtZSB0byBicmFuY2ggU0hBIGZyb20gdGhlIHJlbW90ZVxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48T2JqZWN0Pn0gLSBPYmplY3QgbWFwIGZyb20gYnJhbmNoID0+IHNoYSB7c3RyaW5nfVxyXG4gKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiggcmVwbyApIHtcclxuICB3aW5zdG9uLmRlYnVnKCBgcmV0cmlldmluZyBicmFuY2hlcyBmcm9tICR7cmVwb31gICk7XHJcblxyXG4gIGNvbnN0IG1hcCA9IHt9O1xyXG5cclxuICAoIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdscy1yZW1vdGUnIF0sIGAuLi8ke3JlcG99YCApICkuc3BsaXQoICdcXG4nICkuZm9yRWFjaCggbGluZSA9PiB7XHJcbiAgICBjb25zdCBtYXRjaCA9IGxpbmUudHJpbSgpLm1hdGNoKCAvXihcXFMrKVxccytyZWZzXFwvaGVhZHNcXC8oXFxTKykkLyApO1xyXG4gICAgaWYgKCBtYXRjaCApIHtcclxuICAgICAgbWFwWyBtYXRjaFsgMiBdIF0gPSBtYXRjaFsgMSBdO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgcmV0dXJuIG1hcDtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsV0FBWSxDQUFDO0FBQ3RDLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFFLFNBQVUsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRSxNQUFNLENBQUNDLE9BQU8sR0FBRyxnQkFBZ0JDLElBQUksRUFBRztFQUN0Q0gsT0FBTyxDQUFDSSxLQUFLLENBQUcsNEJBQTJCRCxJQUFLLEVBQUUsQ0FBQztFQUVuRCxNQUFNRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO0VBRWQsQ0FBRSxNQUFNUCxPQUFPLENBQUUsS0FBSyxFQUFFLENBQUUsV0FBVyxDQUFFLEVBQUcsTUFBS0ssSUFBSyxFQUFFLENBQUMsRUFBR0csS0FBSyxDQUFFLElBQUssQ0FBQyxDQUFDQyxPQUFPLENBQUVDLElBQUksSUFBSTtJQUN2RixNQUFNQyxLQUFLLEdBQUdELElBQUksQ0FBQ0UsSUFBSSxDQUFDLENBQUMsQ0FBQ0QsS0FBSyxDQUFFLDhCQUErQixDQUFDO0lBQ2pFLElBQUtBLEtBQUssRUFBRztNQUNYSixHQUFHLENBQUVJLEtBQUssQ0FBRSxDQUFDLENBQUUsQ0FBRSxHQUFHQSxLQUFLLENBQUUsQ0FBQyxDQUFFO0lBQ2hDO0VBQ0YsQ0FBRSxDQUFDO0VBRUgsT0FBT0osR0FBRztBQUNaLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=