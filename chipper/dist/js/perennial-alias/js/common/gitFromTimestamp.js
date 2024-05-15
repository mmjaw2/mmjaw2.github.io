// Copyright 2018, University of Colorado Boulder

/**
 * git rev-list -1 --before="{{TIMESTAMP}}" {{BRANCH}}
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('./execute');
const assert = require('assert');

/**
 * Gets the best SHA from a given branch at the given timestamp
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} branch - The SHA/branch/whatnot to check out
 * @param {string} timestamp
 * @returns {Promise.<string>} - Resolves to the SHA
 */
module.exports = function (repo, branch, timestamp) {
  assert(typeof repo === 'string');
  assert(typeof branch === 'string');
  assert(typeof timestamp === 'string');
  return execute('git', ['rev-list', '-1', `--before="${timestamp}"`, branch], `../${repo}`).then(stdout => {
    const sha = stdout.trim();
    if (sha.length === 0) {
      return Promise.reject(new Error('No matching SHA for timestamp'));
    } else {
      return Promise.resolve(sha);
    }
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImFzc2VydCIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwiYnJhbmNoIiwidGltZXN0YW1wIiwidGhlbiIsInN0ZG91dCIsInNoYSIsInRyaW0iLCJsZW5ndGgiLCJQcm9taXNlIiwicmVqZWN0IiwiRXJyb3IiLCJyZXNvbHZlIl0sInNvdXJjZXMiOlsiZ2l0RnJvbVRpbWVzdGFtcC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogZ2l0IHJldi1saXN0IC0xIC0tYmVmb3JlPVwie3tUSU1FU1RBTVB9fVwiIHt7QlJBTkNIfX1cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApO1xyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIGJlc3QgU0hBIGZyb20gYSBnaXZlbiBicmFuY2ggYXQgdGhlIGdpdmVuIHRpbWVzdGFtcFxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoIC0gVGhlIFNIQS9icmFuY2gvd2hhdG5vdCB0byBjaGVjayBvdXRcclxuICogQHBhcmFtIHtzdHJpbmd9IHRpbWVzdGFtcFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nPn0gLSBSZXNvbHZlcyB0byB0aGUgU0hBXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCByZXBvLCBicmFuY2gsIHRpbWVzdGFtcCApIHtcclxuICBhc3NlcnQoIHR5cGVvZiByZXBvID09PSAnc3RyaW5nJyApO1xyXG4gIGFzc2VydCggdHlwZW9mIGJyYW5jaCA9PT0gJ3N0cmluZycgKTtcclxuICBhc3NlcnQoIHR5cGVvZiB0aW1lc3RhbXAgPT09ICdzdHJpbmcnICk7XHJcblxyXG4gIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAncmV2LWxpc3QnLCAnLTEnLCBgLS1iZWZvcmU9XCIke3RpbWVzdGFtcH1cImAsIGJyYW5jaCBdLCBgLi4vJHtyZXBvfWAgKS50aGVuKCBzdGRvdXQgPT4ge1xyXG4gICAgY29uc3Qgc2hhID0gc3Rkb3V0LnRyaW0oKTtcclxuICAgIGlmICggc2hhLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCBuZXcgRXJyb3IoICdObyBtYXRjaGluZyBTSEEgZm9yIHRpbWVzdGFtcCcgKSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoIHNoYSApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsV0FBWSxDQUFDO0FBQ3RDLE1BQU1DLE1BQU0sR0FBR0QsT0FBTyxDQUFFLFFBQVMsQ0FBQzs7QUFFbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FFLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLElBQUksRUFBRUMsTUFBTSxFQUFFQyxTQUFTLEVBQUc7RUFDbkRMLE1BQU0sQ0FBRSxPQUFPRyxJQUFJLEtBQUssUUFBUyxDQUFDO0VBQ2xDSCxNQUFNLENBQUUsT0FBT0ksTUFBTSxLQUFLLFFBQVMsQ0FBQztFQUNwQ0osTUFBTSxDQUFFLE9BQU9LLFNBQVMsS0FBSyxRQUFTLENBQUM7RUFFdkMsT0FBT1AsT0FBTyxDQUFFLEtBQUssRUFBRSxDQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUcsYUFBWU8sU0FBVSxHQUFFLEVBQUVELE1BQU0sQ0FBRSxFQUFHLE1BQUtELElBQUssRUFBRSxDQUFDLENBQUNHLElBQUksQ0FBRUMsTUFBTSxJQUFJO0lBQzdHLE1BQU1DLEdBQUcsR0FBR0QsTUFBTSxDQUFDRSxJQUFJLENBQUMsQ0FBQztJQUN6QixJQUFLRCxHQUFHLENBQUNFLE1BQU0sS0FBSyxDQUFDLEVBQUc7TUFDdEIsT0FBT0MsT0FBTyxDQUFDQyxNQUFNLENBQUUsSUFBSUMsS0FBSyxDQUFFLCtCQUFnQyxDQUFFLENBQUM7SUFDdkUsQ0FBQyxNQUNJO01BQ0gsT0FBT0YsT0FBTyxDQUFDRyxPQUFPLENBQUVOLEdBQUksQ0FBQztJQUMvQjtFQUNGLENBQUUsQ0FBQztBQUNMLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=