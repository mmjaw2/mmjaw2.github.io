// Copyright 2016-2024, University of Colorado Boulder

/**
 * From the a11y view template file, fill in the templated values and return the html as a string.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// modules
const ChipperConstants = require('../common/ChipperConstants');
const ChipperStringUtils = require('../common/ChipperStringUtils');
const fixEOL = require('./fixEOL');
const getTitleStringKey = require('./getTitleStringKey');
const grunt = require('grunt');

/**
 * @param {string} repo
 * @returns {string} - the html string, filled in from the template.
 */
module.exports = function (repo) {
  let html = grunt.file.read('../chipper/templates/sim-a11y-view.html'); // the template file

  const englishStringsString = grunt.file.read(`../${repo}/${repo}-strings_en.json`); // the english strings file
  const englishStringsJSON = JSON.parse(englishStringsString);
  const englishSimTitle = englishStringsJSON[getTitleStringKey(repo).split('/')[1]].value;

  // Replace placeholders in the template.
  html = ChipperStringUtils.replaceAll(html, '{{PHET_SIM_TITLE}}', englishSimTitle);
  html = ChipperStringUtils.replaceAll(html, '{{PHET_SIM_URL}}', `${repo}_${ChipperConstants.FALLBACK_LOCALE}.html`);
  html = ChipperStringUtils.replaceAll(html, '{{PHET_REPOSITORY}}', repo);

  // Remove to-dos so they don't propagate to all repo copies
  html = html.replace(/^.*\/\/[\s]?TODO.*\r?\n/mg, '');
  return fixEOL(html);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDaGlwcGVyQ29uc3RhbnRzIiwicmVxdWlyZSIsIkNoaXBwZXJTdHJpbmdVdGlscyIsImZpeEVPTCIsImdldFRpdGxlU3RyaW5nS2V5IiwiZ3J1bnQiLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImh0bWwiLCJmaWxlIiwicmVhZCIsImVuZ2xpc2hTdHJpbmdzU3RyaW5nIiwiZW5nbGlzaFN0cmluZ3NKU09OIiwiSlNPTiIsInBhcnNlIiwiZW5nbGlzaFNpbVRpdGxlIiwic3BsaXQiLCJ2YWx1ZSIsInJlcGxhY2VBbGwiLCJGQUxMQkFDS19MT0NBTEUiLCJyZXBsYWNlIl0sInNvdXJjZXMiOlsiZ2V0QTExeVZpZXdIVE1MRnJvbVRlbXBsYXRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE2LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEZyb20gdGhlIGExMXkgdmlldyB0ZW1wbGF0ZSBmaWxlLCBmaWxsIGluIHRoZSB0ZW1wbGF0ZWQgdmFsdWVzIGFuZCByZXR1cm4gdGhlIGh0bWwgYXMgYSBzdHJpbmcuXHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5cclxuLy8gbW9kdWxlc1xyXG5jb25zdCBDaGlwcGVyQ29uc3RhbnRzID0gcmVxdWlyZSggJy4uL2NvbW1vbi9DaGlwcGVyQ29uc3RhbnRzJyApO1xyXG5jb25zdCBDaGlwcGVyU3RyaW5nVXRpbHMgPSByZXF1aXJlKCAnLi4vY29tbW9uL0NoaXBwZXJTdHJpbmdVdGlscycgKTtcclxuY29uc3QgZml4RU9MID0gcmVxdWlyZSggJy4vZml4RU9MJyApO1xyXG5jb25zdCBnZXRUaXRsZVN0cmluZ0tleSA9IHJlcXVpcmUoICcuL2dldFRpdGxlU3RyaW5nS2V5JyApO1xyXG5jb25zdCBncnVudCA9IHJlcXVpcmUoICdncnVudCcgKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAtIHRoZSBodG1sIHN0cmluZywgZmlsbGVkIGluIGZyb20gdGhlIHRlbXBsYXRlLlxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggcmVwbyApIHtcclxuXHJcbiAgbGV0IGh0bWwgPSBncnVudC5maWxlLnJlYWQoICcuLi9jaGlwcGVyL3RlbXBsYXRlcy9zaW0tYTExeS12aWV3Lmh0bWwnICk7IC8vIHRoZSB0ZW1wbGF0ZSBmaWxlXHJcblxyXG4gIGNvbnN0IGVuZ2xpc2hTdHJpbmdzU3RyaW5nID0gZ3J1bnQuZmlsZS5yZWFkKCBgLi4vJHtyZXBvfS8ke3JlcG99LXN0cmluZ3NfZW4uanNvbmAgKTsgLy8gdGhlIGVuZ2xpc2ggc3RyaW5ncyBmaWxlXHJcbiAgY29uc3QgZW5nbGlzaFN0cmluZ3NKU09OID0gSlNPTi5wYXJzZSggZW5nbGlzaFN0cmluZ3NTdHJpbmcgKTtcclxuICBjb25zdCBlbmdsaXNoU2ltVGl0bGUgPSBlbmdsaXNoU3RyaW5nc0pTT05bIGdldFRpdGxlU3RyaW5nS2V5KCByZXBvICkuc3BsaXQoICcvJyApWyAxIF0gXS52YWx1ZTtcclxuXHJcbiAgLy8gUmVwbGFjZSBwbGFjZWhvbGRlcnMgaW4gdGhlIHRlbXBsYXRlLlxyXG4gIGh0bWwgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggaHRtbCwgJ3t7UEhFVF9TSU1fVElUTEV9fScsIGVuZ2xpc2hTaW1UaXRsZSApO1xyXG4gIGh0bWwgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggaHRtbCwgJ3t7UEhFVF9TSU1fVVJMfX0nLCBgJHtyZXBvfV8ke0NoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFfS5odG1sYCApO1xyXG4gIGh0bWwgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggaHRtbCwgJ3t7UEhFVF9SRVBPU0lUT1JZfX0nLCByZXBvICk7XHJcblxyXG4gIC8vIFJlbW92ZSB0by1kb3Mgc28gdGhleSBkb24ndCBwcm9wYWdhdGUgdG8gYWxsIHJlcG8gY29waWVzXHJcbiAgaHRtbCA9IGh0bWwucmVwbGFjZSggL14uKlxcL1xcL1tcXHNdP1RPRE8uKlxccj9cXG4vbWcsICcnICk7XHJcblxyXG4gIHJldHVybiBmaXhFT0woIGh0bWwgKTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0E7QUFDQSxNQUFNQSxnQkFBZ0IsR0FBR0MsT0FBTyxDQUFFLDRCQUE2QixDQUFDO0FBQ2hFLE1BQU1DLGtCQUFrQixHQUFHRCxPQUFPLENBQUUsOEJBQStCLENBQUM7QUFDcEUsTUFBTUUsTUFBTSxHQUFHRixPQUFPLENBQUUsVUFBVyxDQUFDO0FBQ3BDLE1BQU1HLGlCQUFpQixHQUFHSCxPQUFPLENBQUUscUJBQXNCLENBQUM7QUFDMUQsTUFBTUksS0FBSyxHQUFHSixPQUFPLENBQUUsT0FBUSxDQUFDOztBQUVoQztBQUNBO0FBQ0E7QUFDQTtBQUNBSyxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxJQUFJLEVBQUc7RUFFaEMsSUFBSUMsSUFBSSxHQUFHSixLQUFLLENBQUNLLElBQUksQ0FBQ0MsSUFBSSxDQUFFLHlDQUEwQyxDQUFDLENBQUMsQ0FBQzs7RUFFekUsTUFBTUMsb0JBQW9CLEdBQUdQLEtBQUssQ0FBQ0ssSUFBSSxDQUFDQyxJQUFJLENBQUcsTUFBS0gsSUFBSyxJQUFHQSxJQUFLLGtCQUFrQixDQUFDLENBQUMsQ0FBQztFQUN0RixNQUFNSyxrQkFBa0IsR0FBR0MsSUFBSSxDQUFDQyxLQUFLLENBQUVILG9CQUFxQixDQUFDO0VBQzdELE1BQU1JLGVBQWUsR0FBR0gsa0JBQWtCLENBQUVULGlCQUFpQixDQUFFSSxJQUFLLENBQUMsQ0FBQ1MsS0FBSyxDQUFFLEdBQUksQ0FBQyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUNDLEtBQUs7O0VBRS9GO0VBQ0FULElBQUksR0FBR1Asa0JBQWtCLENBQUNpQixVQUFVLENBQUVWLElBQUksRUFBRSxvQkFBb0IsRUFBRU8sZUFBZ0IsQ0FBQztFQUNuRlAsSUFBSSxHQUFHUCxrQkFBa0IsQ0FBQ2lCLFVBQVUsQ0FBRVYsSUFBSSxFQUFFLGtCQUFrQixFQUFHLEdBQUVELElBQUssSUFBR1IsZ0JBQWdCLENBQUNvQixlQUFnQixPQUFPLENBQUM7RUFDcEhYLElBQUksR0FBR1Asa0JBQWtCLENBQUNpQixVQUFVLENBQUVWLElBQUksRUFBRSxxQkFBcUIsRUFBRUQsSUFBSyxDQUFDOztFQUV6RTtFQUNBQyxJQUFJLEdBQUdBLElBQUksQ0FBQ1ksT0FBTyxDQUFFLDJCQUEyQixFQUFFLEVBQUcsQ0FBQztFQUV0RCxPQUFPbEIsTUFBTSxDQUFFTSxJQUFLLENBQUM7QUFDdkIsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==