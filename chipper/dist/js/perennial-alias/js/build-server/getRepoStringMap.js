// Copyright 2023, University of Colorado Boulder

/**
 * Returns an inverse string map (stringMap[ stringKey ][ locale ]) for all strings in a given repo.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const loadJSON = require('../common/loadJSON');
const fs = require('fs');

/**
 * Returns an inverse string map (stringMap[ stringKey ][ locale ]) for all strings in a given repo.
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} checkoutDir
 * @returns {Promise.<stringMap[ stringKey ][ locale ]>}
 */
module.exports = async function getRepoStringMap(repo, checkoutDir) {
  // partialKeyMap[ partialStringKey ][ locale ] = stringValue
  const partialKeyMap = {};

  // If we're not a repo with strings
  if (!fs.existsSync(`${checkoutDir}/${repo}/${repo}-strings_en.json`)) {
    return {};
  }
  const packageJSON = await loadJSON(`${checkoutDir}/${repo}/package.json`);
  const requirejsNamespace = packageJSON.phet.requirejsNamespace;
  const englishStrings = await loadJSON(`${checkoutDir}/${repo}/${repo}-strings_en.json`);

  // Support recursive structure of English string files. Tests for `value: <<string type>>` to determine if it's a string.
  // Fills partialKeyMap
  (function recur(stringStructure, stringKeyParts) {
    if (typeof stringStructure.value === 'string') {
      partialKeyMap[stringKeyParts.join('.')] = {
        en: stringStructure.value
      };
    }
    Object.keys(stringStructure).forEach(partialKey => {
      if (typeof stringStructure[partialKey] === 'object') {
        recur(stringStructure[partialKey], [...stringKeyParts, partialKey]);
      }
    });
  })(englishStrings, []);

  // Fill partialKeyMap with other locales (if the directory in babel exists)
  if (fs.existsSync(`${checkoutDir}/babel/${repo}`)) {
    for (const stringFilename of fs.readdirSync(`${checkoutDir}/babel/${repo}`)) {
      const localeStrings = await loadJSON(`${checkoutDir}/babel/${repo}/${stringFilename}`);

      // Extract locale from filename
      const firstUnderscoreIndex = stringFilename.indexOf('_');
      const periodIndex = stringFilename.indexOf('.');
      const locale = stringFilename.substring(firstUnderscoreIndex + 1, periodIndex);
      Object.keys(localeStrings).forEach(partialStringKey => {
        if (partialKeyMap[partialStringKey]) {
          partialKeyMap[partialStringKey][locale] = localeStrings[partialStringKey].value;
        }
      });
    }
  }

  // result[ stringKey ][ locale ] = stringValue
  const result = {};

  // Prepend the requirejsNamespace to the string keys
  Object.keys(partialKeyMap).forEach(partialKey => {
    result[`${requirejsNamespace}/${partialKey}`] = partialKeyMap[partialKey];
  });
  return result;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJsb2FkSlNPTiIsInJlcXVpcmUiLCJmcyIsIm1vZHVsZSIsImV4cG9ydHMiLCJnZXRSZXBvU3RyaW5nTWFwIiwicmVwbyIsImNoZWNrb3V0RGlyIiwicGFydGlhbEtleU1hcCIsImV4aXN0c1N5bmMiLCJwYWNrYWdlSlNPTiIsInJlcXVpcmVqc05hbWVzcGFjZSIsInBoZXQiLCJlbmdsaXNoU3RyaW5ncyIsInJlY3VyIiwic3RyaW5nU3RydWN0dXJlIiwic3RyaW5nS2V5UGFydHMiLCJ2YWx1ZSIsImpvaW4iLCJlbiIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwicGFydGlhbEtleSIsInN0cmluZ0ZpbGVuYW1lIiwicmVhZGRpclN5bmMiLCJsb2NhbGVTdHJpbmdzIiwiZmlyc3RVbmRlcnNjb3JlSW5kZXgiLCJpbmRleE9mIiwicGVyaW9kSW5kZXgiLCJsb2NhbGUiLCJzdWJzdHJpbmciLCJwYXJ0aWFsU3RyaW5nS2V5IiwicmVzdWx0Il0sInNvdXJjZXMiOlsiZ2V0UmVwb1N0cmluZ01hcC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhbiBpbnZlcnNlIHN0cmluZyBtYXAgKHN0cmluZ01hcFsgc3RyaW5nS2V5IF1bIGxvY2FsZSBdKSBmb3IgYWxsIHN0cmluZ3MgaW4gYSBnaXZlbiByZXBvLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgbG9hZEpTT04gPSByZXF1aXJlKCAnLi4vY29tbW9uL2xvYWRKU09OJyApO1xyXG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGFuIGludmVyc2Ugc3RyaW5nIG1hcCAoc3RyaW5nTWFwWyBzdHJpbmdLZXkgXVsgbG9jYWxlIF0pIGZvciBhbGwgc3RyaW5ncyBpbiBhIGdpdmVuIHJlcG8uXHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBjaGVja291dERpclxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nTWFwWyBzdHJpbmdLZXkgXVsgbG9jYWxlIF0+fVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBnZXRSZXBvU3RyaW5nTWFwKCByZXBvLCBjaGVja291dERpciApIHtcclxuXHJcbiAgLy8gcGFydGlhbEtleU1hcFsgcGFydGlhbFN0cmluZ0tleSBdWyBsb2NhbGUgXSA9IHN0cmluZ1ZhbHVlXHJcbiAgY29uc3QgcGFydGlhbEtleU1hcCA9IHt9O1xyXG5cclxuICAvLyBJZiB3ZSdyZSBub3QgYSByZXBvIHdpdGggc3RyaW5nc1xyXG4gIGlmICggIWZzLmV4aXN0c1N5bmMoIGAke2NoZWNrb3V0RGlyfS8ke3JlcG99LyR7cmVwb30tc3RyaW5nc19lbi5qc29uYCApICkge1xyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcGFja2FnZUpTT04gPSBhd2FpdCBsb2FkSlNPTiggYCR7Y2hlY2tvdXREaXJ9LyR7cmVwb30vcGFja2FnZS5qc29uYCApO1xyXG4gIGNvbnN0IHJlcXVpcmVqc05hbWVzcGFjZSA9IHBhY2thZ2VKU09OLnBoZXQucmVxdWlyZWpzTmFtZXNwYWNlO1xyXG5cclxuICBjb25zdCBlbmdsaXNoU3RyaW5ncyA9IGF3YWl0IGxvYWRKU09OKCBgJHtjaGVja291dERpcn0vJHtyZXBvfS8ke3JlcG99LXN0cmluZ3NfZW4uanNvbmAgKTtcclxuXHJcbiAgLy8gU3VwcG9ydCByZWN1cnNpdmUgc3RydWN0dXJlIG9mIEVuZ2xpc2ggc3RyaW5nIGZpbGVzLiBUZXN0cyBmb3IgYHZhbHVlOiA8PHN0cmluZyB0eXBlPj5gIHRvIGRldGVybWluZSBpZiBpdCdzIGEgc3RyaW5nLlxyXG4gIC8vIEZpbGxzIHBhcnRpYWxLZXlNYXBcclxuICAoIGZ1bmN0aW9uIHJlY3VyKCBzdHJpbmdTdHJ1Y3R1cmUsIHN0cmluZ0tleVBhcnRzICkge1xyXG4gICAgaWYgKCB0eXBlb2Ygc3RyaW5nU3RydWN0dXJlLnZhbHVlID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgcGFydGlhbEtleU1hcFsgc3RyaW5nS2V5UGFydHMuam9pbiggJy4nICkgXSA9IHtcclxuICAgICAgICBlbjogc3RyaW5nU3RydWN0dXJlLnZhbHVlXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgICBPYmplY3Qua2V5cyggc3RyaW5nU3RydWN0dXJlICkuZm9yRWFjaCggcGFydGlhbEtleSA9PiB7XHJcbiAgICAgIGlmICggdHlwZW9mIHN0cmluZ1N0cnVjdHVyZVsgcGFydGlhbEtleSBdID09PSAnb2JqZWN0JyApIHtcclxuICAgICAgICByZWN1ciggc3RyaW5nU3RydWN0dXJlWyBwYXJ0aWFsS2V5IF0sIFsgLi4uc3RyaW5nS2V5UGFydHMsIHBhcnRpYWxLZXkgXSApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfSApKCBlbmdsaXNoU3RyaW5ncywgW10gKTtcclxuXHJcbiAgLy8gRmlsbCBwYXJ0aWFsS2V5TWFwIHdpdGggb3RoZXIgbG9jYWxlcyAoaWYgdGhlIGRpcmVjdG9yeSBpbiBiYWJlbCBleGlzdHMpXHJcbiAgaWYgKCBmcy5leGlzdHNTeW5jKCBgJHtjaGVja291dERpcn0vYmFiZWwvJHtyZXBvfWAgKSApIHtcclxuICAgIGZvciAoIGNvbnN0IHN0cmluZ0ZpbGVuYW1lIG9mIGZzLnJlYWRkaXJTeW5jKCBgJHtjaGVja291dERpcn0vYmFiZWwvJHtyZXBvfWAgKSApIHtcclxuICAgICAgY29uc3QgbG9jYWxlU3RyaW5ncyA9IGF3YWl0IGxvYWRKU09OKCBgJHtjaGVja291dERpcn0vYmFiZWwvJHtyZXBvfS8ke3N0cmluZ0ZpbGVuYW1lfWAgKTtcclxuXHJcbiAgICAgIC8vIEV4dHJhY3QgbG9jYWxlIGZyb20gZmlsZW5hbWVcclxuICAgICAgY29uc3QgZmlyc3RVbmRlcnNjb3JlSW5kZXggPSBzdHJpbmdGaWxlbmFtZS5pbmRleE9mKCAnXycgKTtcclxuICAgICAgY29uc3QgcGVyaW9kSW5kZXggPSBzdHJpbmdGaWxlbmFtZS5pbmRleE9mKCAnLicgKTtcclxuICAgICAgY29uc3QgbG9jYWxlID0gc3RyaW5nRmlsZW5hbWUuc3Vic3RyaW5nKCBmaXJzdFVuZGVyc2NvcmVJbmRleCArIDEsIHBlcmlvZEluZGV4ICk7XHJcblxyXG4gICAgICBPYmplY3Qua2V5cyggbG9jYWxlU3RyaW5ncyApLmZvckVhY2goIHBhcnRpYWxTdHJpbmdLZXkgPT4ge1xyXG4gICAgICAgIGlmICggcGFydGlhbEtleU1hcFsgcGFydGlhbFN0cmluZ0tleSBdICkge1xyXG4gICAgICAgICAgcGFydGlhbEtleU1hcFsgcGFydGlhbFN0cmluZ0tleSBdWyBsb2NhbGUgXSA9IGxvY2FsZVN0cmluZ3NbIHBhcnRpYWxTdHJpbmdLZXkgXS52YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIHJlc3VsdFsgc3RyaW5nS2V5IF1bIGxvY2FsZSBdID0gc3RyaW5nVmFsdWVcclxuICBjb25zdCByZXN1bHQgPSB7fTtcclxuXHJcbiAgLy8gUHJlcGVuZCB0aGUgcmVxdWlyZWpzTmFtZXNwYWNlIHRvIHRoZSBzdHJpbmcga2V5c1xyXG4gIE9iamVjdC5rZXlzKCBwYXJ0aWFsS2V5TWFwICkuZm9yRWFjaCggcGFydGlhbEtleSA9PiB7XHJcbiAgICByZXN1bHRbIGAke3JlcXVpcmVqc05hbWVzcGFjZX0vJHtwYXJ0aWFsS2V5fWAgXSA9IHBhcnRpYWxLZXlNYXBbIHBhcnRpYWxLZXkgXTtcclxuICB9ICk7XHJcblxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE1BQU1BLFFBQVEsR0FBR0MsT0FBTyxDQUFFLG9CQUFxQixDQUFDO0FBQ2hELE1BQU1DLEVBQUUsR0FBR0QsT0FBTyxDQUFFLElBQUssQ0FBQzs7QUFFMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRSxNQUFNLENBQUNDLE9BQU8sR0FBRyxlQUFlQyxnQkFBZ0JBLENBQUVDLElBQUksRUFBRUMsV0FBVyxFQUFHO0VBRXBFO0VBQ0EsTUFBTUMsYUFBYSxHQUFHLENBQUMsQ0FBQzs7RUFFeEI7RUFDQSxJQUFLLENBQUNOLEVBQUUsQ0FBQ08sVUFBVSxDQUFHLEdBQUVGLFdBQVksSUFBR0QsSUFBSyxJQUFHQSxJQUFLLGtCQUFrQixDQUFDLEVBQUc7SUFDeEUsT0FBTyxDQUFDLENBQUM7RUFDWDtFQUVBLE1BQU1JLFdBQVcsR0FBRyxNQUFNVixRQUFRLENBQUcsR0FBRU8sV0FBWSxJQUFHRCxJQUFLLGVBQWUsQ0FBQztFQUMzRSxNQUFNSyxrQkFBa0IsR0FBR0QsV0FBVyxDQUFDRSxJQUFJLENBQUNELGtCQUFrQjtFQUU5RCxNQUFNRSxjQUFjLEdBQUcsTUFBTWIsUUFBUSxDQUFHLEdBQUVPLFdBQVksSUFBR0QsSUFBSyxJQUFHQSxJQUFLLGtCQUFrQixDQUFDOztFQUV6RjtFQUNBO0VBQ0EsQ0FBRSxTQUFTUSxLQUFLQSxDQUFFQyxlQUFlLEVBQUVDLGNBQWMsRUFBRztJQUNsRCxJQUFLLE9BQU9ELGVBQWUsQ0FBQ0UsS0FBSyxLQUFLLFFBQVEsRUFBRztNQUMvQ1QsYUFBYSxDQUFFUSxjQUFjLENBQUNFLElBQUksQ0FBRSxHQUFJLENBQUMsQ0FBRSxHQUFHO1FBQzVDQyxFQUFFLEVBQUVKLGVBQWUsQ0FBQ0U7TUFDdEIsQ0FBQztJQUNIO0lBQ0FHLE1BQU0sQ0FBQ0MsSUFBSSxDQUFFTixlQUFnQixDQUFDLENBQUNPLE9BQU8sQ0FBRUMsVUFBVSxJQUFJO01BQ3BELElBQUssT0FBT1IsZUFBZSxDQUFFUSxVQUFVLENBQUUsS0FBSyxRQUFRLEVBQUc7UUFDdkRULEtBQUssQ0FBRUMsZUFBZSxDQUFFUSxVQUFVLENBQUUsRUFBRSxDQUFFLEdBQUdQLGNBQWMsRUFBRU8sVUFBVSxDQUFHLENBQUM7TUFDM0U7SUFDRixDQUFFLENBQUM7RUFDTCxDQUFDLEVBQUlWLGNBQWMsRUFBRSxFQUFHLENBQUM7O0VBRXpCO0VBQ0EsSUFBS1gsRUFBRSxDQUFDTyxVQUFVLENBQUcsR0FBRUYsV0FBWSxVQUFTRCxJQUFLLEVBQUUsQ0FBQyxFQUFHO0lBQ3JELEtBQU0sTUFBTWtCLGNBQWMsSUFBSXRCLEVBQUUsQ0FBQ3VCLFdBQVcsQ0FBRyxHQUFFbEIsV0FBWSxVQUFTRCxJQUFLLEVBQUUsQ0FBQyxFQUFHO01BQy9FLE1BQU1vQixhQUFhLEdBQUcsTUFBTTFCLFFBQVEsQ0FBRyxHQUFFTyxXQUFZLFVBQVNELElBQUssSUFBR2tCLGNBQWUsRUFBRSxDQUFDOztNQUV4RjtNQUNBLE1BQU1HLG9CQUFvQixHQUFHSCxjQUFjLENBQUNJLE9BQU8sQ0FBRSxHQUFJLENBQUM7TUFDMUQsTUFBTUMsV0FBVyxHQUFHTCxjQUFjLENBQUNJLE9BQU8sQ0FBRSxHQUFJLENBQUM7TUFDakQsTUFBTUUsTUFBTSxHQUFHTixjQUFjLENBQUNPLFNBQVMsQ0FBRUosb0JBQW9CLEdBQUcsQ0FBQyxFQUFFRSxXQUFZLENBQUM7TUFFaEZULE1BQU0sQ0FBQ0MsSUFBSSxDQUFFSyxhQUFjLENBQUMsQ0FBQ0osT0FBTyxDQUFFVSxnQkFBZ0IsSUFBSTtRQUN4RCxJQUFLeEIsYUFBYSxDQUFFd0IsZ0JBQWdCLENBQUUsRUFBRztVQUN2Q3hCLGFBQWEsQ0FBRXdCLGdCQUFnQixDQUFFLENBQUVGLE1BQU0sQ0FBRSxHQUFHSixhQUFhLENBQUVNLGdCQUFnQixDQUFFLENBQUNmLEtBQUs7UUFDdkY7TUFDRixDQUFFLENBQUM7SUFDTDtFQUNGOztFQUVBO0VBQ0EsTUFBTWdCLE1BQU0sR0FBRyxDQUFDLENBQUM7O0VBRWpCO0VBQ0FiLE1BQU0sQ0FBQ0MsSUFBSSxDQUFFYixhQUFjLENBQUMsQ0FBQ2MsT0FBTyxDQUFFQyxVQUFVLElBQUk7SUFDbERVLE1BQU0sQ0FBRyxHQUFFdEIsa0JBQW1CLElBQUdZLFVBQVcsRUFBQyxDQUFFLEdBQUdmLGFBQWEsQ0FBRWUsVUFBVSxDQUFFO0VBQy9FLENBQUUsQ0FBQztFQUVILE9BQU9VLE1BQU07QUFDZixDQUFDIiwiaWdub3JlTGlzdCI6W119