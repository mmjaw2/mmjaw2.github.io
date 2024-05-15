// Copyright 2021, University of Colorado Boulder

/**
 * Provides the SHA of the first SHA from a target that diverges from the second target
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('./execute');
const assert = require('assert');

/**
 * Provides the SHA of the first SHA from a target that diverges from the second target
 * @public
 *
 * e.g. to get the first commit of acid-base-solutions' 1.2 branch that does not exist in main:
 *
 *   gitFirstDivergingCommit( 'acid-base-solutions', '1.2', 'main' )
 *
 * @param {string} repo - The repository name
 * @param {string} primaryTarget - Branch/SHA
 * @param {string} secondaryTarget - Branch/SHA
 * @returns {Promise.<string>} - Resolves to the SHA
 */
module.exports = function (repo, primaryTarget, secondaryTarget) {
  assert(typeof repo === 'string');
  assert(typeof primaryTarget === 'string');
  assert(typeof secondaryTarget === 'string');
  return execute('git', ['log', `${secondaryTarget}...${primaryTarget}`, '--reverse', '--pretty=oneline'], `../${repo}`).then(stdout => {
    return Promise.resolve(stdout.trim().split('\n')[0].trim().split(' ')[0]);
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImFzc2VydCIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwicHJpbWFyeVRhcmdldCIsInNlY29uZGFyeVRhcmdldCIsInRoZW4iLCJzdGRvdXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInRyaW0iLCJzcGxpdCJdLCJzb3VyY2VzIjpbImdpdEZpcnN0RGl2ZXJnaW5nQ29tbWl0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyB0aGUgU0hBIG9mIHRoZSBmaXJzdCBTSEEgZnJvbSBhIHRhcmdldCB0aGF0IGRpdmVyZ2VzIGZyb20gdGhlIHNlY29uZCB0YXJnZXRcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApO1xyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIHRoZSBTSEEgb2YgdGhlIGZpcnN0IFNIQSBmcm9tIGEgdGFyZ2V0IHRoYXQgZGl2ZXJnZXMgZnJvbSB0aGUgc2Vjb25kIHRhcmdldFxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIGUuZy4gdG8gZ2V0IHRoZSBmaXJzdCBjb21taXQgb2YgYWNpZC1iYXNlLXNvbHV0aW9ucycgMS4yIGJyYW5jaCB0aGF0IGRvZXMgbm90IGV4aXN0IGluIG1haW46XHJcbiAqXHJcbiAqICAgZ2l0Rmlyc3REaXZlcmdpbmdDb21taXQoICdhY2lkLWJhc2Utc29sdXRpb25zJywgJzEuMicsICdtYWluJyApXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJpbWFyeVRhcmdldCAtIEJyYW5jaC9TSEFcclxuICogQHBhcmFtIHtzdHJpbmd9IHNlY29uZGFyeVRhcmdldCAtIEJyYW5jaC9TSEFcclxuICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59IC0gUmVzb2x2ZXMgdG8gdGhlIFNIQVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggcmVwbywgcHJpbWFyeVRhcmdldCwgc2Vjb25kYXJ5VGFyZ2V0ICkge1xyXG4gIGFzc2VydCggdHlwZW9mIHJlcG8gPT09ICdzdHJpbmcnICk7XHJcbiAgYXNzZXJ0KCB0eXBlb2YgcHJpbWFyeVRhcmdldCA9PT0gJ3N0cmluZycgKTtcclxuICBhc3NlcnQoIHR5cGVvZiBzZWNvbmRhcnlUYXJnZXQgPT09ICdzdHJpbmcnICk7XHJcblxyXG4gIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAnbG9nJywgYCR7c2Vjb25kYXJ5VGFyZ2V0fS4uLiR7cHJpbWFyeVRhcmdldH1gLCAnLS1yZXZlcnNlJywgJy0tcHJldHR5PW9uZWxpbmUnIF0sIGAuLi8ke3JlcG99YCApLnRoZW4oIHN0ZG91dCA9PiB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCBzdGRvdXQudHJpbSgpLnNwbGl0KCAnXFxuJyApWyAwIF0udHJpbSgpLnNwbGl0KCAnICcgKVsgMCBdICk7XHJcbiAgfSApO1xyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNQSxPQUFPLEdBQUdDLE9BQU8sQ0FBRSxXQUFZLENBQUM7QUFDdEMsTUFBTUMsTUFBTSxHQUFHRCxPQUFPLENBQUUsUUFBUyxDQUFDOztBQUVsQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRSxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxJQUFJLEVBQUVDLGFBQWEsRUFBRUMsZUFBZSxFQUFHO0VBQ2hFTCxNQUFNLENBQUUsT0FBT0csSUFBSSxLQUFLLFFBQVMsQ0FBQztFQUNsQ0gsTUFBTSxDQUFFLE9BQU9JLGFBQWEsS0FBSyxRQUFTLENBQUM7RUFDM0NKLE1BQU0sQ0FBRSxPQUFPSyxlQUFlLEtBQUssUUFBUyxDQUFDO0VBRTdDLE9BQU9QLE9BQU8sQ0FBRSxLQUFLLEVBQUUsQ0FBRSxLQUFLLEVBQUcsR0FBRU8sZUFBZ0IsTUFBS0QsYUFBYyxFQUFDLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixDQUFFLEVBQUcsTUFBS0QsSUFBSyxFQUFFLENBQUMsQ0FBQ0csSUFBSSxDQUFFQyxNQUFNLElBQUk7SUFDekksT0FBT0MsT0FBTyxDQUFDQyxPQUFPLENBQUVGLE1BQU0sQ0FBQ0csSUFBSSxDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFFLElBQUssQ0FBQyxDQUFFLENBQUMsQ0FBRSxDQUFDRCxJQUFJLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUUsR0FBSSxDQUFDLENBQUUsQ0FBQyxDQUFHLENBQUM7RUFDckYsQ0FBRSxDQUFDO0FBQ0wsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==