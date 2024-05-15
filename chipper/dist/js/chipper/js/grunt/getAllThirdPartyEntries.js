// Copyright 2017-2024, University of Colorado Boulder

/**
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const getThirdPartyLibEntries = require('./getThirdPartyLibEntries');
const grunt = require('grunt');

/**
 * Returns an object with information about third-party license entries.
 *
 * NOTE: This pulls entries from some of the chipper globals. Should be done only after the build
 *
 * @param {string} repo
 * @param {string} brand
 * @param {Object} licenseEntries
 */
module.exports = function (repo, brand, licenseEntries) {
  const thirdPartyEntries = {
    lib: getThirdPartyLibEntries(repo, brand)
  };
  if (licenseEntries) {
    for (const mediaType in licenseEntries) {
      if (licenseEntries.hasOwnProperty(mediaType)) {
        const mediaEntry = licenseEntries[mediaType];

        // For each resource of that type
        for (const resourceName in mediaEntry) {
          if (mediaEntry.hasOwnProperty(resourceName)) {
            const licenseEntry = mediaEntry[resourceName];

            // If it is not from PhET, it is from a 3rd party and we must include it in the report
            // But lift this restriction when building a non-phet brand
            if (!licenseEntry) {
              // Fail if there is no license entry.  Though this error should have been caught
              if (brand === 'phet' || brand === 'phet-io') {
                // during plugin loading, so this is a "double check"
                grunt.log.error(`No license.json entry for ${resourceName}`);
              }
            } else if (licenseEntry.projectURL !== 'https://phet.colorado.edu' && licenseEntry.projectURL !== 'http://phet.colorado.edu') {
              thirdPartyEntries[mediaType] = thirdPartyEntries[mediaType] || {};
              thirdPartyEntries[mediaType][resourceName] = licenseEntry;
            }
          }
        }
      }
    }
  }
  return thirdPartyEntries;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnZXRUaGlyZFBhcnR5TGliRW50cmllcyIsInJlcXVpcmUiLCJncnVudCIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwiYnJhbmQiLCJsaWNlbnNlRW50cmllcyIsInRoaXJkUGFydHlFbnRyaWVzIiwibGliIiwibWVkaWFUeXBlIiwiaGFzT3duUHJvcGVydHkiLCJtZWRpYUVudHJ5IiwicmVzb3VyY2VOYW1lIiwibGljZW5zZUVudHJ5IiwibG9nIiwiZXJyb3IiLCJwcm9qZWN0VVJMIl0sInNvdXJjZXMiOlsiZ2V0QWxsVGhpcmRQYXJ0eUVudHJpZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcblxyXG5jb25zdCBnZXRUaGlyZFBhcnR5TGliRW50cmllcyA9IHJlcXVpcmUoICcuL2dldFRoaXJkUGFydHlMaWJFbnRyaWVzJyApO1xyXG5jb25zdCBncnVudCA9IHJlcXVpcmUoICdncnVudCcgKTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGluZm9ybWF0aW9uIGFib3V0IHRoaXJkLXBhcnR5IGxpY2Vuc2UgZW50cmllcy5cclxuICpcclxuICogTk9URTogVGhpcyBwdWxscyBlbnRyaWVzIGZyb20gc29tZSBvZiB0aGUgY2hpcHBlciBnbG9iYWxzLiBTaG91bGQgYmUgZG9uZSBvbmx5IGFmdGVyIHRoZSBidWlsZFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gYnJhbmRcclxuICogQHBhcmFtIHtPYmplY3R9IGxpY2Vuc2VFbnRyaWVzXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCByZXBvLCBicmFuZCwgbGljZW5zZUVudHJpZXMgKSB7XHJcbiAgY29uc3QgdGhpcmRQYXJ0eUVudHJpZXMgPSB7XHJcbiAgICBsaWI6IGdldFRoaXJkUGFydHlMaWJFbnRyaWVzKCByZXBvLCBicmFuZCApXHJcbiAgfTtcclxuICBpZiAoIGxpY2Vuc2VFbnRyaWVzICkge1xyXG4gICAgZm9yICggY29uc3QgbWVkaWFUeXBlIGluIGxpY2Vuc2VFbnRyaWVzICkge1xyXG4gICAgICBpZiAoIGxpY2Vuc2VFbnRyaWVzLmhhc093blByb3BlcnR5KCBtZWRpYVR5cGUgKSApIHtcclxuXHJcbiAgICAgICAgY29uc3QgbWVkaWFFbnRyeSA9IGxpY2Vuc2VFbnRyaWVzWyBtZWRpYVR5cGUgXTtcclxuXHJcbiAgICAgICAgLy8gRm9yIGVhY2ggcmVzb3VyY2Ugb2YgdGhhdCB0eXBlXHJcbiAgICAgICAgZm9yICggY29uc3QgcmVzb3VyY2VOYW1lIGluIG1lZGlhRW50cnkgKSB7XHJcbiAgICAgICAgICBpZiAoIG1lZGlhRW50cnkuaGFzT3duUHJvcGVydHkoIHJlc291cmNlTmFtZSApICkge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbGljZW5zZUVudHJ5ID0gbWVkaWFFbnRyeVsgcmVzb3VyY2VOYW1lIF07XHJcblxyXG4gICAgICAgICAgICAvLyBJZiBpdCBpcyBub3QgZnJvbSBQaEVULCBpdCBpcyBmcm9tIGEgM3JkIHBhcnR5IGFuZCB3ZSBtdXN0IGluY2x1ZGUgaXQgaW4gdGhlIHJlcG9ydFxyXG4gICAgICAgICAgICAvLyBCdXQgbGlmdCB0aGlzIHJlc3RyaWN0aW9uIHdoZW4gYnVpbGRpbmcgYSBub24tcGhldCBicmFuZFxyXG4gICAgICAgICAgICBpZiAoICFsaWNlbnNlRW50cnkgKSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEZhaWwgaWYgdGhlcmUgaXMgbm8gbGljZW5zZSBlbnRyeS4gIFRob3VnaCB0aGlzIGVycm9yIHNob3VsZCBoYXZlIGJlZW4gY2F1Z2h0XHJcbiAgICAgICAgICAgICAgaWYgKCBicmFuZCA9PT0gJ3BoZXQnIHx8IGJyYW5kID09PSAncGhldC1pbycgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBkdXJpbmcgcGx1Z2luIGxvYWRpbmcsIHNvIHRoaXMgaXMgYSBcImRvdWJsZSBjaGVja1wiXHJcbiAgICAgICAgICAgICAgICBncnVudC5sb2cuZXJyb3IoIGBObyBsaWNlbnNlLmpzb24gZW50cnkgZm9yICR7cmVzb3VyY2VOYW1lfWAgKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoIGxpY2Vuc2VFbnRyeS5wcm9qZWN0VVJMICE9PSAnaHR0cHM6Ly9waGV0LmNvbG9yYWRvLmVkdScgJiZcclxuICAgICAgICAgICAgICAgICAgICAgIGxpY2Vuc2VFbnRyeS5wcm9qZWN0VVJMICE9PSAnaHR0cDovL3BoZXQuY29sb3JhZG8uZWR1JyApIHtcclxuICAgICAgICAgICAgICB0aGlyZFBhcnR5RW50cmllc1sgbWVkaWFUeXBlIF0gPSB0aGlyZFBhcnR5RW50cmllc1sgbWVkaWFUeXBlIF0gfHwge307XHJcbiAgICAgICAgICAgICAgdGhpcmRQYXJ0eUVudHJpZXNbIG1lZGlhVHlwZSBdWyByZXNvdXJjZU5hbWUgXSA9IGxpY2Vuc2VFbnRyeTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHRoaXJkUGFydHlFbnRyaWVzO1xyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBOztBQUdBLE1BQU1BLHVCQUF1QixHQUFHQyxPQUFPLENBQUUsMkJBQTRCLENBQUM7QUFDdEUsTUFBTUMsS0FBSyxHQUFHRCxPQUFPLENBQUUsT0FBUSxDQUFDOztBQUVoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUUsTUFBTSxDQUFDQyxPQUFPLEdBQUcsVUFBVUMsSUFBSSxFQUFFQyxLQUFLLEVBQUVDLGNBQWMsRUFBRztFQUN2RCxNQUFNQyxpQkFBaUIsR0FBRztJQUN4QkMsR0FBRyxFQUFFVCx1QkFBdUIsQ0FBRUssSUFBSSxFQUFFQyxLQUFNO0VBQzVDLENBQUM7RUFDRCxJQUFLQyxjQUFjLEVBQUc7SUFDcEIsS0FBTSxNQUFNRyxTQUFTLElBQUlILGNBQWMsRUFBRztNQUN4QyxJQUFLQSxjQUFjLENBQUNJLGNBQWMsQ0FBRUQsU0FBVSxDQUFDLEVBQUc7UUFFaEQsTUFBTUUsVUFBVSxHQUFHTCxjQUFjLENBQUVHLFNBQVMsQ0FBRTs7UUFFOUM7UUFDQSxLQUFNLE1BQU1HLFlBQVksSUFBSUQsVUFBVSxFQUFHO1VBQ3ZDLElBQUtBLFVBQVUsQ0FBQ0QsY0FBYyxDQUFFRSxZQUFhLENBQUMsRUFBRztZQUUvQyxNQUFNQyxZQUFZLEdBQUdGLFVBQVUsQ0FBRUMsWUFBWSxDQUFFOztZQUUvQztZQUNBO1lBQ0EsSUFBSyxDQUFDQyxZQUFZLEVBQUc7Y0FFbkI7Y0FDQSxJQUFLUixLQUFLLEtBQUssTUFBTSxJQUFJQSxLQUFLLEtBQUssU0FBUyxFQUFHO2dCQUM3QztnQkFDQUosS0FBSyxDQUFDYSxHQUFHLENBQUNDLEtBQUssQ0FBRyw2QkFBNEJILFlBQWEsRUFBRSxDQUFDO2NBQ2hFO1lBQ0YsQ0FBQyxNQUNJLElBQUtDLFlBQVksQ0FBQ0csVUFBVSxLQUFLLDJCQUEyQixJQUN2REgsWUFBWSxDQUFDRyxVQUFVLEtBQUssMEJBQTBCLEVBQUc7Y0FDakVULGlCQUFpQixDQUFFRSxTQUFTLENBQUUsR0FBR0YsaUJBQWlCLENBQUVFLFNBQVMsQ0FBRSxJQUFJLENBQUMsQ0FBQztjQUNyRUYsaUJBQWlCLENBQUVFLFNBQVMsQ0FBRSxDQUFFRyxZQUFZLENBQUUsR0FBR0MsWUFBWTtZQUMvRDtVQUNGO1FBQ0Y7TUFDRjtJQUNGO0VBQ0Y7RUFFQSxPQUFPTixpQkFBaUI7QUFDMUIsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==