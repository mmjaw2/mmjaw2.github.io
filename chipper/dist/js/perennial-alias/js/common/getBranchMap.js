// Copyright 2023, University of Colorado Boulder

/**
 * Gets a map of branch names (from the origin) to their remote SHAs
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('./execute');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Gets a map of branch names (from the origin) to their remote SHAs
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise.<Array.<Record<string, string>>>}
 * @rejects {ExecuteError}
 */
module.exports = async function (repo) {
  winston.debug(`retrieving branches from ${repo}`);
  const result = {};
  (await execute('git', ['ls-remote'], `../${repo}`)).split('\n').filter(line => line.includes('refs/heads/')).forEach(line => {
    const branch = line.match(/refs\/heads\/(.*)/)[1].trim();
    const sha = line.split(/\s+/)[0].trim();
    result[branch] = sha;
  });
  return result;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImRlYnVnIiwicmVzdWx0Iiwic3BsaXQiLCJmaWx0ZXIiLCJsaW5lIiwiaW5jbHVkZXMiLCJmb3JFYWNoIiwiYnJhbmNoIiwibWF0Y2giLCJ0cmltIiwic2hhIl0sInNvdXJjZXMiOlsiZ2V0QnJhbmNoTWFwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGEgbWFwIG9mIGJyYW5jaCBuYW1lcyAoZnJvbSB0aGUgb3JpZ2luKSB0byB0aGVpciByZW1vdGUgU0hBc1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGEgbWFwIG9mIGJyYW5jaCBuYW1lcyAoZnJvbSB0aGUgb3JpZ2luKSB0byB0aGVpciByZW1vdGUgU0hBc1xyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48QXJyYXkuPFJlY29yZDxzdHJpbmcsIHN0cmluZz4+Pn1cclxuICogQHJlamVjdHMge0V4ZWN1dGVFcnJvcn1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24oIHJlcG8gKSB7XHJcbiAgd2luc3Rvbi5kZWJ1ZyggYHJldHJpZXZpbmcgYnJhbmNoZXMgZnJvbSAke3JlcG99YCApO1xyXG5cclxuICBjb25zdCByZXN1bHQgPSB7fTtcclxuXHJcbiAgKCBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnbHMtcmVtb3RlJyBdLCBgLi4vJHtyZXBvfWAgKSApLnNwbGl0KCAnXFxuJyApLmZpbHRlciggbGluZSA9PiBsaW5lLmluY2x1ZGVzKCAncmVmcy9oZWFkcy8nICkgKS5mb3JFYWNoKCBsaW5lID0+IHtcclxuICAgIGNvbnN0IGJyYW5jaCA9IGxpbmUubWF0Y2goIC9yZWZzXFwvaGVhZHNcXC8oLiopLyApWyAxIF0udHJpbSgpO1xyXG4gICAgY29uc3Qgc2hhID0gbGluZS5zcGxpdCggL1xccysvIClbIDAgXS50cmltKCk7XHJcbiAgICByZXN1bHRbIGJyYW5jaCBdID0gc2hhO1xyXG4gIH0gKTtcclxuXHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsV0FBWSxDQUFDO0FBQ3RDLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFFLFNBQVUsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRSxNQUFNLENBQUNDLE9BQU8sR0FBRyxnQkFBZ0JDLElBQUksRUFBRztFQUN0Q0gsT0FBTyxDQUFDSSxLQUFLLENBQUcsNEJBQTJCRCxJQUFLLEVBQUUsQ0FBQztFQUVuRCxNQUFNRSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0VBRWpCLENBQUUsTUFBTVAsT0FBTyxDQUFFLEtBQUssRUFBRSxDQUFFLFdBQVcsQ0FBRSxFQUFHLE1BQUtLLElBQUssRUFBRSxDQUFDLEVBQUdHLEtBQUssQ0FBRSxJQUFLLENBQUMsQ0FBQ0MsTUFBTSxDQUFFQyxJQUFJLElBQUlBLElBQUksQ0FBQ0MsUUFBUSxDQUFFLGFBQWMsQ0FBRSxDQUFDLENBQUNDLE9BQU8sQ0FBRUYsSUFBSSxJQUFJO0lBQ3hJLE1BQU1HLE1BQU0sR0FBR0gsSUFBSSxDQUFDSSxLQUFLLENBQUUsbUJBQW9CLENBQUMsQ0FBRSxDQUFDLENBQUUsQ0FBQ0MsSUFBSSxDQUFDLENBQUM7SUFDNUQsTUFBTUMsR0FBRyxHQUFHTixJQUFJLENBQUNGLEtBQUssQ0FBRSxLQUFNLENBQUMsQ0FBRSxDQUFDLENBQUUsQ0FBQ08sSUFBSSxDQUFDLENBQUM7SUFDM0NSLE1BQU0sQ0FBRU0sTUFBTSxDQUFFLEdBQUdHLEdBQUc7RUFDeEIsQ0FBRSxDQUFDO0VBRUgsT0FBT1QsTUFBTTtBQUNmLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=