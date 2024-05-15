// Copyright 2022-2023, University of Colorado Boulder

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

const fs = require('fs');
const _ = require('lodash');
const path = require('path');

/**
 * @param {ESLint.LintResult[]} results - the results from eslint.lintFiles( patterns )
 *                                      - { filePath: string, errorCount: number, warningCount: number }
 *                                      - see https://eslint.org/docs/latest/developer-guide/nodejs-api#-lintresult-type
 * @returns {string} - a message with the chip-away checkboxes in GitHub markdown format, or a message describing why it
 *                   - could not be accomplished
 */
module.exports = results => {
  // NOTE: This should never be run in a maintenance mode since this loads a file from phet-info which
  // does not have its SHA tracked as a dependency.
  let responsibleDevs = null;
  try {
    responsibleDevs = JSON.parse(fs.readFileSync('../phet-info/sim-info/responsible_dev.json'));
  } catch (e) {
    // set responsibleDevs to an empty object if the file cannot be found or is not parseable.
    // In this scenario, responsibleDev info would not be logged with other repo error info.
    responsibleDevs = {};
  }
  const repos = results.map(result => path.relative('../', result.filePath).split(path.sep)[0]);
  const assignments = _.uniq(repos).map(repo => {
    const filteredResults = results.filter(result => path.relative('../', result.filePath).split(path.sep)[0] === repo);
    const fileCount = filteredResults.filter(result => result.errorCount + result.warningCount > 0).length;
    const errorCount = _.sum(filteredResults.map(file => file.errorCount + file.warningCount));
    if (errorCount === 0 || repo === 'perennial-alias') {
      return null;
    } else {
      const usernames = responsibleDevs[repo] ? responsibleDevs[repo].responsibleDevs.join(', ') : '';
      return ` - [ ] ${repo}: ${usernames} ${errorCount} errors in ${fileCount} files.`;
    }
  });
  return assignments.filter(assignment => assignment !== null).join('\n');
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJfIiwicGF0aCIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXN1bHRzIiwicmVzcG9uc2libGVEZXZzIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwiZSIsInJlcG9zIiwibWFwIiwicmVzdWx0IiwicmVsYXRpdmUiLCJmaWxlUGF0aCIsInNwbGl0Iiwic2VwIiwiYXNzaWdubWVudHMiLCJ1bmlxIiwicmVwbyIsImZpbHRlcmVkUmVzdWx0cyIsImZpbHRlciIsImZpbGVDb3VudCIsImVycm9yQ291bnQiLCJ3YXJuaW5nQ291bnQiLCJsZW5ndGgiLCJzdW0iLCJmaWxlIiwidXNlcm5hbWVzIiwiam9pbiIsImFzc2lnbm1lbnQiXSwic291cmNlcyI6WyJjaGlwQXdheS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBQcm9kdWNlcyBhbiBhc3NpZ25tZW50IGxpc3Qgb2YgcmVzcG9uc2libGUgZGV2cy4gUnVuIGZyb20gbGludC5qc1xyXG4gKlxyXG4gKiBUaGUgQ2hpcCBBd2F5IG9wdGlvbiBwcm92aWRlcyBhIHF1aWNrIGFuZCBlYXN5IG1ldGhvZCB0byBhc3NpZ24gZGV2cyB0byB0aGVpciByZXNwZWN0aXZlIHJlcG9zaXRvcmllc1xyXG4gKiBmb3IgZWFzZSBpbiBhZG9wdGluZyBhbmQgYXBwbHlpbmcgbmV3IHR5cGVzY3JpcHQgbGludGluZyBydWxlcy5cclxuICogQ2hpcCBBd2F5IHdpbGwgcmV0dXJuIGEgbWFya2Rvd24gZm9ybWF0dGVkIGNoZWNrbGlzdCB3aXRoIHRoZSByZXBvc2l0b3J5IG5hbWUsIHJlc3BvbnNpYmxlIGRldixcclxuICogYW5kIG51bWJlciBvZiBlcnJvcnMuXHJcbiAqIFJlc3BvbnNlICBmb3JtYXQ6XHJcbiAqIC0gWyBdIHt7UkVQT319OiBAe3tHSVRIVUJfVVNFUk5BTUV9fSB7e05VTUJFUn19IGVycm9ycyBpbiB7e05VTUJFUn19IGZpbGVzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIE1hcmxhIFNjaHVseiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge0VTTGludC5MaW50UmVzdWx0W119IHJlc3VsdHMgLSB0aGUgcmVzdWx0cyBmcm9tIGVzbGludC5saW50RmlsZXMoIHBhdHRlcm5zIClcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0geyBmaWxlUGF0aDogc3RyaW5nLCBlcnJvckNvdW50OiBudW1iZXIsIHdhcm5pbmdDb3VudDogbnVtYmVyIH1cclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gc2VlIGh0dHBzOi8vZXNsaW50Lm9yZy9kb2NzL2xhdGVzdC9kZXZlbG9wZXItZ3VpZGUvbm9kZWpzLWFwaSMtbGludHJlc3VsdC10eXBlXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IC0gYSBtZXNzYWdlIHdpdGggdGhlIGNoaXAtYXdheSBjaGVja2JveGVzIGluIEdpdEh1YiBtYXJrZG93biBmb3JtYXQsIG9yIGEgbWVzc2FnZSBkZXNjcmliaW5nIHdoeSBpdFxyXG4gKiAgICAgICAgICAgICAgICAgICAtIGNvdWxkIG5vdCBiZSBhY2NvbXBsaXNoZWRcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gcmVzdWx0cyA9PiB7XHJcblxyXG4gIC8vIE5PVEU6IFRoaXMgc2hvdWxkIG5ldmVyIGJlIHJ1biBpbiBhIG1haW50ZW5hbmNlIG1vZGUgc2luY2UgdGhpcyBsb2FkcyBhIGZpbGUgZnJvbSBwaGV0LWluZm8gd2hpY2hcclxuICAvLyBkb2VzIG5vdCBoYXZlIGl0cyBTSEEgdHJhY2tlZCBhcyBhIGRlcGVuZGVuY3kuXHJcbiAgbGV0IHJlc3BvbnNpYmxlRGV2cyA9IG51bGw7XHJcbiAgdHJ5IHtcclxuICAgIHJlc3BvbnNpYmxlRGV2cyA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggJy4uL3BoZXQtaW5mby9zaW0taW5mby9yZXNwb25zaWJsZV9kZXYuanNvbicgKSApO1xyXG4gIH1cclxuICBjYXRjaCggZSApIHtcclxuXHJcbiAgICAvLyBzZXQgcmVzcG9uc2libGVEZXZzIHRvIGFuIGVtcHR5IG9iamVjdCBpZiB0aGUgZmlsZSBjYW5ub3QgYmUgZm91bmQgb3IgaXMgbm90IHBhcnNlYWJsZS5cclxuICAgIC8vIEluIHRoaXMgc2NlbmFyaW8sIHJlc3BvbnNpYmxlRGV2IGluZm8gd291bGQgbm90IGJlIGxvZ2dlZCB3aXRoIG90aGVyIHJlcG8gZXJyb3IgaW5mby5cclxuICAgIHJlc3BvbnNpYmxlRGV2cyA9IHt9O1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcmVwb3MgPSByZXN1bHRzLm1hcCggcmVzdWx0ID0+IHBhdGgucmVsYXRpdmUoICcuLi8nLCByZXN1bHQuZmlsZVBhdGggKS5zcGxpdCggcGF0aC5zZXAgKVsgMCBdICk7XHJcbiAgY29uc3QgYXNzaWdubWVudHMgPSBfLnVuaXEoIHJlcG9zICkubWFwKCByZXBvID0+IHtcclxuXHJcbiAgICBjb25zdCBmaWx0ZXJlZFJlc3VsdHMgPSByZXN1bHRzLmZpbHRlciggcmVzdWx0ID0+IHBhdGgucmVsYXRpdmUoICcuLi8nLCByZXN1bHQuZmlsZVBhdGggKS5zcGxpdCggcGF0aC5zZXAgKVsgMCBdID09PSByZXBvICk7XHJcbiAgICBjb25zdCBmaWxlQ291bnQgPSBmaWx0ZXJlZFJlc3VsdHMuZmlsdGVyKCByZXN1bHQgPT4gcmVzdWx0LmVycm9yQ291bnQgKyByZXN1bHQud2FybmluZ0NvdW50ID4gMCApLmxlbmd0aDtcclxuICAgIGNvbnN0IGVycm9yQ291bnQgPSBfLnN1bSggZmlsdGVyZWRSZXN1bHRzLm1hcCggZmlsZSA9PiBmaWxlLmVycm9yQ291bnQgKyBmaWxlLndhcm5pbmdDb3VudCApICk7XHJcblxyXG4gICAgaWYgKCBlcnJvckNvdW50ID09PSAwIHx8IHJlcG8gPT09ICdwZXJlbm5pYWwtYWxpYXMnICkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBjb25zdCB1c2VybmFtZXMgPSByZXNwb25zaWJsZURldnNbIHJlcG8gXSA/IHJlc3BvbnNpYmxlRGV2c1sgcmVwbyBdLnJlc3BvbnNpYmxlRGV2cy5qb2luKCAnLCAnICkgOiAnJztcclxuICAgICAgcmV0dXJuIGAgLSBbIF0gJHtyZXBvfTogJHt1c2VybmFtZXN9ICR7ZXJyb3JDb3VudH0gZXJyb3JzIGluICR7ZmlsZUNvdW50fSBmaWxlcy5gO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgcmV0dXJuIGFzc2lnbm1lbnRzLmZpbHRlciggYXNzaWdubWVudCA9PiBhc3NpZ25tZW50ICE9PSBudWxsICkuam9pbiggJ1xcbicgKTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE1BQU1BLEVBQUUsR0FBR0MsT0FBTyxDQUFFLElBQUssQ0FBQztBQUMxQixNQUFNQyxDQUFDLEdBQUdELE9BQU8sQ0FBRSxRQUFTLENBQUM7QUFDN0IsTUFBTUUsSUFBSSxHQUFHRixPQUFPLENBQUUsTUFBTyxDQUFDOztBQUU5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRyxNQUFNLENBQUNDLE9BQU8sR0FBR0MsT0FBTyxJQUFJO0VBRTFCO0VBQ0E7RUFDQSxJQUFJQyxlQUFlLEdBQUcsSUFBSTtFQUMxQixJQUFJO0lBQ0ZBLGVBQWUsR0FBR0MsSUFBSSxDQUFDQyxLQUFLLENBQUVULEVBQUUsQ0FBQ1UsWUFBWSxDQUFFLDRDQUE2QyxDQUFFLENBQUM7RUFDakcsQ0FBQyxDQUNELE9BQU9DLENBQUMsRUFBRztJQUVUO0lBQ0E7SUFDQUosZUFBZSxHQUFHLENBQUMsQ0FBQztFQUN0QjtFQUVBLE1BQU1LLEtBQUssR0FBR04sT0FBTyxDQUFDTyxHQUFHLENBQUVDLE1BQU0sSUFBSVgsSUFBSSxDQUFDWSxRQUFRLENBQUUsS0FBSyxFQUFFRCxNQUFNLENBQUNFLFFBQVMsQ0FBQyxDQUFDQyxLQUFLLENBQUVkLElBQUksQ0FBQ2UsR0FBSSxDQUFDLENBQUUsQ0FBQyxDQUFHLENBQUM7RUFDckcsTUFBTUMsV0FBVyxHQUFHakIsQ0FBQyxDQUFDa0IsSUFBSSxDQUFFUixLQUFNLENBQUMsQ0FBQ0MsR0FBRyxDQUFFUSxJQUFJLElBQUk7SUFFL0MsTUFBTUMsZUFBZSxHQUFHaEIsT0FBTyxDQUFDaUIsTUFBTSxDQUFFVCxNQUFNLElBQUlYLElBQUksQ0FBQ1ksUUFBUSxDQUFFLEtBQUssRUFBRUQsTUFBTSxDQUFDRSxRQUFTLENBQUMsQ0FBQ0MsS0FBSyxDQUFFZCxJQUFJLENBQUNlLEdBQUksQ0FBQyxDQUFFLENBQUMsQ0FBRSxLQUFLRyxJQUFLLENBQUM7SUFDM0gsTUFBTUcsU0FBUyxHQUFHRixlQUFlLENBQUNDLE1BQU0sQ0FBRVQsTUFBTSxJQUFJQSxNQUFNLENBQUNXLFVBQVUsR0FBR1gsTUFBTSxDQUFDWSxZQUFZLEdBQUcsQ0FBRSxDQUFDLENBQUNDLE1BQU07SUFDeEcsTUFBTUYsVUFBVSxHQUFHdkIsQ0FBQyxDQUFDMEIsR0FBRyxDQUFFTixlQUFlLENBQUNULEdBQUcsQ0FBRWdCLElBQUksSUFBSUEsSUFBSSxDQUFDSixVQUFVLEdBQUdJLElBQUksQ0FBQ0gsWUFBYSxDQUFFLENBQUM7SUFFOUYsSUFBS0QsVUFBVSxLQUFLLENBQUMsSUFBSUosSUFBSSxLQUFLLGlCQUFpQixFQUFHO01BQ3BELE9BQU8sSUFBSTtJQUNiLENBQUMsTUFDSTtNQUNILE1BQU1TLFNBQVMsR0FBR3ZCLGVBQWUsQ0FBRWMsSUFBSSxDQUFFLEdBQUdkLGVBQWUsQ0FBRWMsSUFBSSxDQUFFLENBQUNkLGVBQWUsQ0FBQ3dCLElBQUksQ0FBRSxJQUFLLENBQUMsR0FBRyxFQUFFO01BQ3JHLE9BQVEsVUFBU1YsSUFBSyxLQUFJUyxTQUFVLElBQUdMLFVBQVcsY0FBYUQsU0FBVSxTQUFRO0lBQ25GO0VBQ0YsQ0FBRSxDQUFDO0VBRUgsT0FBT0wsV0FBVyxDQUFDSSxNQUFNLENBQUVTLFVBQVUsSUFBSUEsVUFBVSxLQUFLLElBQUssQ0FBQyxDQUFDRCxJQUFJLENBQUUsSUFBSyxDQUFDO0FBQzdFLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=