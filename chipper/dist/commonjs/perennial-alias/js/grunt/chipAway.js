"use strict";

// Copyright 2022, University of Colorado Boulder

/**
 * Produces an assignment list of responsible devs. Run from lint.js
 *
 * The Chip Away option provides a quick and easy method to assign devs to their respective repositories
 * for ease in adopting and applying new typescript linting rules.
 * Chip Away will return a markdown formatted checklist with the repository name, responsible dev,
 * and number of errors.
 * Response  format:
 * - [ ] {{REPO}}: @{{GITHUB_USERNAME}} {{NUMBER}} errors in {{NUMBER}} files.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Marla Schulz (PhET Interactive Simulations)
 */

var fs = require('fs');
var _ = require('lodash');
var path = require('path');

/**
 * @param {ESLint.LintResult[]} results - the results from eslint.lintFiles( patterns )
 *                                      - { filePath: string, errorCount: number, warningCount: number }
 *                                      - see https://eslint.org/docs/latest/developer-guide/nodejs-api#-lintresult-type
 * @returns {string} - a message with the chip-away checkboxes in GitHub markdown format, or a message describing why it
 *                   - could not be accomplished
 */
module.exports = function (results) {
  // NOTE: This should never be run in a maintenance mode since this loads a file from phet-info which
  // does not have its SHA tracked as a dependency.
  var responsibleDevs = null;
  try {
    responsibleDevs = JSON.parse(fs.readFileSync('../phet-info/sim-info/responsible_dev.json'));
  } catch (e) {
    // set responsibleDevs to an empty object if the file cannot be found or is not parseable.
    // In this scenario, responsibleDev info would not be logged with other repo error info.
    responsibleDevs = {};
  }
  var repos = results.map(function (result) {
    return path.relative('../', result.filePath).split(path.sep)[0];
  });
  var assignments = _.uniq(repos).map(function (repo) {
    var filteredResults = results.filter(function (result) {
      return path.relative('../', result.filePath).split(path.sep)[0] === repo;
    });
    var fileCount = filteredResults.filter(function (result) {
      return result.errorCount + result.warningCount > 0;
    }).length;
    var errorCount = _.sum(filteredResults.map(function (file) {
      return file.errorCount + file.warningCount;
    }));
    if (errorCount === 0 || repo === 'perennial-alias') {
      return null;
    } else {
      var usernames = responsibleDevs[repo] ? responsibleDevs[repo].responsibleDevs.join(', ') : '';
      return " - [ ] ".concat(repo, ": ").concat(usernames, " ").concat(errorCount, " errors in ").concat(fileCount, " files.");
    }
  });
  return assignments.filter(function (assignment) {
    return assignment !== null;
  }).join('\n');
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJfIiwicGF0aCIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXN1bHRzIiwicmVzcG9uc2libGVEZXZzIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwiZSIsInJlcG9zIiwibWFwIiwicmVzdWx0IiwicmVsYXRpdmUiLCJmaWxlUGF0aCIsInNwbGl0Iiwic2VwIiwiYXNzaWdubWVudHMiLCJ1bmlxIiwicmVwbyIsImZpbHRlcmVkUmVzdWx0cyIsImZpbHRlciIsImZpbGVDb3VudCIsImVycm9yQ291bnQiLCJ3YXJuaW5nQ291bnQiLCJsZW5ndGgiLCJzdW0iLCJmaWxlIiwidXNlcm5hbWVzIiwiam9pbiIsImNvbmNhdCIsImFzc2lnbm1lbnQiXSwic291cmNlcyI6WyJjaGlwQXdheS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUHJvZHVjZXMgYW4gYXNzaWdubWVudCBsaXN0IG9mIHJlc3BvbnNpYmxlIGRldnMuIFJ1biBmcm9tIGxpbnQuanNcclxuICpcclxuICogVGhlIENoaXAgQXdheSBvcHRpb24gcHJvdmlkZXMgYSBxdWljayBhbmQgZWFzeSBtZXRob2QgdG8gYXNzaWduIGRldnMgdG8gdGhlaXIgcmVzcGVjdGl2ZSByZXBvc2l0b3JpZXNcclxuICogZm9yIGVhc2UgaW4gYWRvcHRpbmcgYW5kIGFwcGx5aW5nIG5ldyB0eXBlc2NyaXB0IGxpbnRpbmcgcnVsZXMuXHJcbiAqIENoaXAgQXdheSB3aWxsIHJldHVybiBhIG1hcmtkb3duIGZvcm1hdHRlZCBjaGVja2xpc3Qgd2l0aCB0aGUgcmVwb3NpdG9yeSBuYW1lLCByZXNwb25zaWJsZSBkZXYsXHJcbiAqIGFuZCBudW1iZXIgb2YgZXJyb3JzLlxyXG4gKiBSZXNwb25zZSAgZm9ybWF0OlxyXG4gKiAtIFsgXSB7e1JFUE99fTogQHt7R0lUSFVCX1VTRVJOQU1FfX0ge3tOVU1CRVJ9fSBlcnJvcnMgaW4ge3tOVU1CRVJ9fSBmaWxlcy5cclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBNYXJsYSBTY2h1bHogKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5jb25zdCBwYXRoID0gcmVxdWlyZSggJ3BhdGgnICk7XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtFU0xpbnQuTGludFJlc3VsdFtdfSByZXN1bHRzIC0gdGhlIHJlc3VsdHMgZnJvbSBlc2xpbnQubGludEZpbGVzKCBwYXR0ZXJucyApXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIHsgZmlsZVBhdGg6IHN0cmluZywgZXJyb3JDb3VudDogbnVtYmVyLCB3YXJuaW5nQ291bnQ6IG51bWJlciB9XHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIHNlZSBodHRwczovL2VzbGludC5vcmcvZG9jcy9sYXRlc3QvZGV2ZWxvcGVyLWd1aWRlL25vZGVqcy1hcGkjLWxpbnRyZXN1bHQtdHlwZVxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAtIGEgbWVzc2FnZSB3aXRoIHRoZSBjaGlwLWF3YXkgY2hlY2tib3hlcyBpbiBHaXRIdWIgbWFya2Rvd24gZm9ybWF0LCBvciBhIG1lc3NhZ2UgZGVzY3JpYmluZyB3aHkgaXRcclxuICogICAgICAgICAgICAgICAgICAgLSBjb3VsZCBub3QgYmUgYWNjb21wbGlzaGVkXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IHJlc3VsdHMgPT4ge1xyXG5cclxuICAvLyBOT1RFOiBUaGlzIHNob3VsZCBuZXZlciBiZSBydW4gaW4gYSBtYWludGVuYW5jZSBtb2RlIHNpbmNlIHRoaXMgbG9hZHMgYSBmaWxlIGZyb20gcGhldC1pbmZvIHdoaWNoXHJcbiAgLy8gZG9lcyBub3QgaGF2ZSBpdHMgU0hBIHRyYWNrZWQgYXMgYSBkZXBlbmRlbmN5LlxyXG4gIGxldCByZXNwb25zaWJsZURldnMgPSBudWxsO1xyXG4gIHRyeSB7XHJcbiAgICByZXNwb25zaWJsZURldnMgPSBKU09OLnBhcnNlKCBmcy5yZWFkRmlsZVN5bmMoICcuLi9waGV0LWluZm8vc2ltLWluZm8vcmVzcG9uc2libGVfZGV2Lmpzb24nICkgKTtcclxuICB9XHJcbiAgY2F0Y2goIGUgKSB7XHJcblxyXG4gICAgLy8gc2V0IHJlc3BvbnNpYmxlRGV2cyB0byBhbiBlbXB0eSBvYmplY3QgaWYgdGhlIGZpbGUgY2Fubm90IGJlIGZvdW5kIG9yIGlzIG5vdCBwYXJzZWFibGUuXHJcbiAgICAvLyBJbiB0aGlzIHNjZW5hcmlvLCByZXNwb25zaWJsZURldiBpbmZvIHdvdWxkIG5vdCBiZSBsb2dnZWQgd2l0aCBvdGhlciByZXBvIGVycm9yIGluZm8uXHJcbiAgICByZXNwb25zaWJsZURldnMgPSB7fTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHJlcG9zID0gcmVzdWx0cy5tYXAoIHJlc3VsdCA9PiBwYXRoLnJlbGF0aXZlKCAnLi4vJywgcmVzdWx0LmZpbGVQYXRoICkuc3BsaXQoIHBhdGguc2VwIClbIDAgXSApO1xyXG4gIGNvbnN0IGFzc2lnbm1lbnRzID0gXy51bmlxKCByZXBvcyApLm1hcCggcmVwbyA9PiB7XHJcblxyXG4gICAgY29uc3QgZmlsdGVyZWRSZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIoIHJlc3VsdCA9PiBwYXRoLnJlbGF0aXZlKCAnLi4vJywgcmVzdWx0LmZpbGVQYXRoICkuc3BsaXQoIHBhdGguc2VwIClbIDAgXSA9PT0gcmVwbyApO1xyXG4gICAgY29uc3QgZmlsZUNvdW50ID0gZmlsdGVyZWRSZXN1bHRzLmZpbHRlciggcmVzdWx0ID0+IHJlc3VsdC5lcnJvckNvdW50ICsgcmVzdWx0Lndhcm5pbmdDb3VudCA+IDAgKS5sZW5ndGg7XHJcbiAgICBjb25zdCBlcnJvckNvdW50ID0gXy5zdW0oIGZpbHRlcmVkUmVzdWx0cy5tYXAoIGZpbGUgPT4gZmlsZS5lcnJvckNvdW50ICsgZmlsZS53YXJuaW5nQ291bnQgKSApO1xyXG5cclxuICAgIGlmICggZXJyb3JDb3VudCA9PT0gMCB8fCByZXBvID09PSAncGVyZW5uaWFsLWFsaWFzJyApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY29uc3QgdXNlcm5hbWVzID0gcmVzcG9uc2libGVEZXZzWyByZXBvIF0gPyByZXNwb25zaWJsZURldnNbIHJlcG8gXS5yZXNwb25zaWJsZURldnMuam9pbiggJywgJyApIDogJyc7XHJcbiAgICAgIHJldHVybiBgIC0gWyBdICR7cmVwb306ICR7dXNlcm5hbWVzfSAke2Vycm9yQ291bnR9IGVycm9ycyBpbiAke2ZpbGVDb3VudH0gZmlsZXMuYDtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIHJldHVybiBhc3NpZ25tZW50cy5maWx0ZXIoIGFzc2lnbm1lbnQgPT4gYXNzaWdubWVudCAhPT0gbnVsbCApLmpvaW4oICdcXG4nICk7XHJcbn07Il0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU1BLEVBQUUsR0FBR0MsT0FBTyxDQUFFLElBQUssQ0FBQztBQUMxQixJQUFNQyxDQUFDLEdBQUdELE9BQU8sQ0FBRSxRQUFTLENBQUM7QUFDN0IsSUFBTUUsSUFBSSxHQUFHRixPQUFPLENBQUUsTUFBTyxDQUFDOztBQUU5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRyxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFBQyxPQUFPLEVBQUk7RUFFMUI7RUFDQTtFQUNBLElBQUlDLGVBQWUsR0FBRyxJQUFJO0VBQzFCLElBQUk7SUFDRkEsZUFBZSxHQUFHQyxJQUFJLENBQUNDLEtBQUssQ0FBRVQsRUFBRSxDQUFDVSxZQUFZLENBQUUsNENBQTZDLENBQUUsQ0FBQztFQUNqRyxDQUFDLENBQ0QsT0FBT0MsQ0FBQyxFQUFHO0lBRVQ7SUFDQTtJQUNBSixlQUFlLEdBQUcsQ0FBQyxDQUFDO0VBQ3RCO0VBRUEsSUFBTUssS0FBSyxHQUFHTixPQUFPLENBQUNPLEdBQUcsQ0FBRSxVQUFBQyxNQUFNO0lBQUEsT0FBSVgsSUFBSSxDQUFDWSxRQUFRLENBQUUsS0FBSyxFQUFFRCxNQUFNLENBQUNFLFFBQVMsQ0FBQyxDQUFDQyxLQUFLLENBQUVkLElBQUksQ0FBQ2UsR0FBSSxDQUFDLENBQUUsQ0FBQyxDQUFFO0VBQUEsQ0FBQyxDQUFDO0VBQ3JHLElBQU1DLFdBQVcsR0FBR2pCLENBQUMsQ0FBQ2tCLElBQUksQ0FBRVIsS0FBTSxDQUFDLENBQUNDLEdBQUcsQ0FBRSxVQUFBUSxJQUFJLEVBQUk7SUFFL0MsSUFBTUMsZUFBZSxHQUFHaEIsT0FBTyxDQUFDaUIsTUFBTSxDQUFFLFVBQUFULE1BQU07TUFBQSxPQUFJWCxJQUFJLENBQUNZLFFBQVEsQ0FBRSxLQUFLLEVBQUVELE1BQU0sQ0FBQ0UsUUFBUyxDQUFDLENBQUNDLEtBQUssQ0FBRWQsSUFBSSxDQUFDZSxHQUFJLENBQUMsQ0FBRSxDQUFDLENBQUUsS0FBS0csSUFBSTtJQUFBLENBQUMsQ0FBQztJQUMzSCxJQUFNRyxTQUFTLEdBQUdGLGVBQWUsQ0FBQ0MsTUFBTSxDQUFFLFVBQUFULE1BQU07TUFBQSxPQUFJQSxNQUFNLENBQUNXLFVBQVUsR0FBR1gsTUFBTSxDQUFDWSxZQUFZLEdBQUcsQ0FBQztJQUFBLENBQUMsQ0FBQyxDQUFDQyxNQUFNO0lBQ3hHLElBQU1GLFVBQVUsR0FBR3ZCLENBQUMsQ0FBQzBCLEdBQUcsQ0FBRU4sZUFBZSxDQUFDVCxHQUFHLENBQUUsVUFBQWdCLElBQUk7TUFBQSxPQUFJQSxJQUFJLENBQUNKLFVBQVUsR0FBR0ksSUFBSSxDQUFDSCxZQUFZO0lBQUEsQ0FBQyxDQUFFLENBQUM7SUFFOUYsSUFBS0QsVUFBVSxLQUFLLENBQUMsSUFBSUosSUFBSSxLQUFLLGlCQUFpQixFQUFHO01BQ3BELE9BQU8sSUFBSTtJQUNiLENBQUMsTUFDSTtNQUNILElBQU1TLFNBQVMsR0FBR3ZCLGVBQWUsQ0FBRWMsSUFBSSxDQUFFLEdBQUdkLGVBQWUsQ0FBRWMsSUFBSSxDQUFFLENBQUNkLGVBQWUsQ0FBQ3dCLElBQUksQ0FBRSxJQUFLLENBQUMsR0FBRyxFQUFFO01BQ3JHLGlCQUFBQyxNQUFBLENBQWlCWCxJQUFJLFFBQUFXLE1BQUEsQ0FBS0YsU0FBUyxPQUFBRSxNQUFBLENBQUlQLFVBQVUsaUJBQUFPLE1BQUEsQ0FBY1IsU0FBUztJQUMxRTtFQUNGLENBQUUsQ0FBQztFQUVILE9BQU9MLFdBQVcsQ0FBQ0ksTUFBTSxDQUFFLFVBQUFVLFVBQVU7SUFBQSxPQUFJQSxVQUFVLEtBQUssSUFBSTtFQUFBLENBQUMsQ0FBQyxDQUFDRixJQUFJLENBQUUsSUFBSyxDQUFDO0FBQzdFLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=