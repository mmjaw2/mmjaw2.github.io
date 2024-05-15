// Copyright 2023, University of Colorado Boulder

/**
 * Sets the supported brands of the current checked-in repo's package.json, creating a commit with the change
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const gitAdd = require('./gitAdd');
const gitCommit = require('./gitCommit');
const gitIsClean = require('./gitIsClean');
const loadJSON = require('./loadJSON');
const writeJSON = require('./writeJSON');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Sets the supported brands of the current checked-in repo's package.json, creating a commit with the change
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string[]} brands
 * @param {string} [message] - Optional. If provided, appended at the end
 * @returns {Promise}
 */
module.exports = async function setRepoSupportedBrands(repo, brands, message) {
  winston.info(`Setting supported brands from package.json for ${repo} to ${brands}`);
  const packageFile = `../${repo}/package.json`;
  const isClean = await gitIsClean(repo);
  if (!isClean) {
    throw new Error(`Unclean status in ${repo}, cannot increment version`);
  }
  const packageObject = await loadJSON(packageFile);
  packageObject.phet = packageObject.phet || {};
  packageObject.phet.supportedBrands = brands;
  await writeJSON(packageFile, packageObject);
  await gitAdd(repo, 'package.json');
  await gitCommit(repo, `Updating supported brands to [${brands}]${message ? `, ${message}` : ''}`);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnaXRBZGQiLCJyZXF1aXJlIiwiZ2l0Q29tbWl0IiwiZ2l0SXNDbGVhbiIsImxvYWRKU09OIiwid3JpdGVKU09OIiwid2luc3RvbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJzZXRSZXBvU3VwcG9ydGVkQnJhbmRzIiwicmVwbyIsImJyYW5kcyIsIm1lc3NhZ2UiLCJpbmZvIiwicGFja2FnZUZpbGUiLCJpc0NsZWFuIiwiRXJyb3IiLCJwYWNrYWdlT2JqZWN0IiwicGhldCIsInN1cHBvcnRlZEJyYW5kcyJdLCJzb3VyY2VzIjpbInNldFJlcG9TdXBwb3J0ZWRCcmFuZHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHN1cHBvcnRlZCBicmFuZHMgb2YgdGhlIGN1cnJlbnQgY2hlY2tlZC1pbiByZXBvJ3MgcGFja2FnZS5qc29uLCBjcmVhdGluZyBhIGNvbW1pdCB3aXRoIHRoZSBjaGFuZ2VcclxuICpcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZ2l0QWRkID0gcmVxdWlyZSggJy4vZ2l0QWRkJyApO1xyXG5jb25zdCBnaXRDb21taXQgPSByZXF1aXJlKCAnLi9naXRDb21taXQnICk7XHJcbmNvbnN0IGdpdElzQ2xlYW4gPSByZXF1aXJlKCAnLi9naXRJc0NsZWFuJyApO1xyXG5jb25zdCBsb2FkSlNPTiA9IHJlcXVpcmUoICcuL2xvYWRKU09OJyApO1xyXG5jb25zdCB3cml0ZUpTT04gPSByZXF1aXJlKCAnLi93cml0ZUpTT04nICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBzdXBwb3J0ZWQgYnJhbmRzIG9mIHRoZSBjdXJyZW50IGNoZWNrZWQtaW4gcmVwbydzIHBhY2thZ2UuanNvbiwgY3JlYXRpbmcgYSBjb21taXQgd2l0aCB0aGUgY2hhbmdlXHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nW119IGJyYW5kc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIC0gT3B0aW9uYWwuIElmIHByb3ZpZGVkLCBhcHBlbmRlZCBhdCB0aGUgZW5kXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBzZXRSZXBvU3VwcG9ydGVkQnJhbmRzKCByZXBvLCBicmFuZHMsIG1lc3NhZ2UgKSB7XHJcbiAgd2luc3Rvbi5pbmZvKCBgU2V0dGluZyBzdXBwb3J0ZWQgYnJhbmRzIGZyb20gcGFja2FnZS5qc29uIGZvciAke3JlcG99IHRvICR7YnJhbmRzfWAgKTtcclxuXHJcbiAgY29uc3QgcGFja2FnZUZpbGUgPSBgLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gO1xyXG5cclxuICBjb25zdCBpc0NsZWFuID0gYXdhaXQgZ2l0SXNDbGVhbiggcmVwbyApO1xyXG4gIGlmICggIWlzQ2xlYW4gKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoIGBVbmNsZWFuIHN0YXR1cyBpbiAke3JlcG99LCBjYW5ub3QgaW5jcmVtZW50IHZlcnNpb25gICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gYXdhaXQgbG9hZEpTT04oIHBhY2thZ2VGaWxlICk7XHJcbiAgcGFja2FnZU9iamVjdC5waGV0ID0gcGFja2FnZU9iamVjdC5waGV0IHx8IHt9O1xyXG4gIHBhY2thZ2VPYmplY3QucGhldC5zdXBwb3J0ZWRCcmFuZHMgPSBicmFuZHM7XHJcblxyXG4gIGF3YWl0IHdyaXRlSlNPTiggcGFja2FnZUZpbGUsIHBhY2thZ2VPYmplY3QgKTtcclxuICBhd2FpdCBnaXRBZGQoIHJlcG8sICdwYWNrYWdlLmpzb24nICk7XHJcbiAgYXdhaXQgZ2l0Q29tbWl0KCByZXBvLCBgVXBkYXRpbmcgc3VwcG9ydGVkIGJyYW5kcyB0byBbJHticmFuZHN9XSR7bWVzc2FnZSA/IGAsICR7bWVzc2FnZX1gIDogJyd9YCApO1xyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE1BQU1BLE1BQU0sR0FBR0MsT0FBTyxDQUFFLFVBQVcsQ0FBQztBQUNwQyxNQUFNQyxTQUFTLEdBQUdELE9BQU8sQ0FBRSxhQUFjLENBQUM7QUFDMUMsTUFBTUUsVUFBVSxHQUFHRixPQUFPLENBQUUsY0FBZSxDQUFDO0FBQzVDLE1BQU1HLFFBQVEsR0FBR0gsT0FBTyxDQUFFLFlBQWEsQ0FBQztBQUN4QyxNQUFNSSxTQUFTLEdBQUdKLE9BQU8sQ0FBRSxhQUFjLENBQUM7QUFDMUMsTUFBTUssT0FBTyxHQUFHTCxPQUFPLENBQUUsU0FBVSxDQUFDOztBQUVwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQU0sTUFBTSxDQUFDQyxPQUFPLEdBQUcsZUFBZUMsc0JBQXNCQSxDQUFFQyxJQUFJLEVBQUVDLE1BQU0sRUFBRUMsT0FBTyxFQUFHO0VBQzlFTixPQUFPLENBQUNPLElBQUksQ0FBRyxrREFBaURILElBQUssT0FBTUMsTUFBTyxFQUFFLENBQUM7RUFFckYsTUFBTUcsV0FBVyxHQUFJLE1BQUtKLElBQUssZUFBYztFQUU3QyxNQUFNSyxPQUFPLEdBQUcsTUFBTVosVUFBVSxDQUFFTyxJQUFLLENBQUM7RUFDeEMsSUFBSyxDQUFDSyxPQUFPLEVBQUc7SUFDZCxNQUFNLElBQUlDLEtBQUssQ0FBRyxxQkFBb0JOLElBQUssNEJBQTRCLENBQUM7RUFDMUU7RUFFQSxNQUFNTyxhQUFhLEdBQUcsTUFBTWIsUUFBUSxDQUFFVSxXQUFZLENBQUM7RUFDbkRHLGFBQWEsQ0FBQ0MsSUFBSSxHQUFHRCxhQUFhLENBQUNDLElBQUksSUFBSSxDQUFDLENBQUM7RUFDN0NELGFBQWEsQ0FBQ0MsSUFBSSxDQUFDQyxlQUFlLEdBQUdSLE1BQU07RUFFM0MsTUFBTU4sU0FBUyxDQUFFUyxXQUFXLEVBQUVHLGFBQWMsQ0FBQztFQUM3QyxNQUFNakIsTUFBTSxDQUFFVSxJQUFJLEVBQUUsY0FBZSxDQUFDO0VBQ3BDLE1BQU1SLFNBQVMsQ0FBRVEsSUFBSSxFQUFHLGlDQUFnQ0MsTUFBTyxJQUFHQyxPQUFPLEdBQUksS0FBSUEsT0FBUSxFQUFDLEdBQUcsRUFBRyxFQUFFLENBQUM7QUFDckcsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==