// Copyright 2023, University of Colorado Boulder

/**
 * Uses playwright to see whether a page loads without an error. Throws errors it receives
 *
 * Defaults to using firefox, but you can provide any playwright browser for this
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

const browserPageLoad = require('./browserPageLoad');
const playwright = require('playwright');
const _ = require('lodash');

/**
 * @public
 *
 * Rejects if encountering an error loading the page OR (with option provided within the puppeteer page itself).
 *
 * @param {string} url
 * @param {Object} [options] - see browserPageLoad
 * @returns {Promise.<null|*>} - The eval result/null
 */
module.exports = async function (url, options) {
  options = _.merge({
    testingBrowserCreator: playwright.firefox
  }, options);
  return browserPageLoad(options.testingBrowserCreator, url, options);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJicm93c2VyUGFnZUxvYWQiLCJyZXF1aXJlIiwicGxheXdyaWdodCIsIl8iLCJtb2R1bGUiLCJleHBvcnRzIiwidXJsIiwib3B0aW9ucyIsIm1lcmdlIiwidGVzdGluZ0Jyb3dzZXJDcmVhdG9yIiwiZmlyZWZveCJdLCJzb3VyY2VzIjpbInBsYXl3cmlnaHRMb2FkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBVc2VzIHBsYXl3cmlnaHQgdG8gc2VlIHdoZXRoZXIgYSBwYWdlIGxvYWRzIHdpdGhvdXQgYW4gZXJyb3IuIFRocm93cyBlcnJvcnMgaXQgcmVjZWl2ZXNcclxuICpcclxuICogRGVmYXVsdHMgdG8gdXNpbmcgZmlyZWZveCwgYnV0IHlvdSBjYW4gcHJvdmlkZSBhbnkgcGxheXdyaWdodCBicm93c2VyIGZvciB0aGlzXHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5jb25zdCBicm93c2VyUGFnZUxvYWQgPSByZXF1aXJlKCAnLi9icm93c2VyUGFnZUxvYWQnICk7XHJcbmNvbnN0IHBsYXl3cmlnaHQgPSByZXF1aXJlKCAncGxheXdyaWdodCcgKTtcclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcblxyXG4vKipcclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBSZWplY3RzIGlmIGVuY291bnRlcmluZyBhbiBlcnJvciBsb2FkaW5nIHRoZSBwYWdlIE9SICh3aXRoIG9wdGlvbiBwcm92aWRlZCB3aXRoaW4gdGhlIHB1cHBldGVlciBwYWdlIGl0c2VsZikuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIHNlZSBicm93c2VyUGFnZUxvYWRcclxuICogQHJldHVybnMge1Byb21pc2UuPG51bGx8Kj59IC0gVGhlIGV2YWwgcmVzdWx0L251bGxcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24oIHVybCwgb3B0aW9ucyApIHtcclxuICBvcHRpb25zID0gXy5tZXJnZSgge1xyXG4gICAgdGVzdGluZ0Jyb3dzZXJDcmVhdG9yOiBwbGF5d3JpZ2h0LmZpcmVmb3hcclxuICB9LCBvcHRpb25zICk7XHJcbiAgcmV0dXJuIGJyb3dzZXJQYWdlTG9hZCggb3B0aW9ucy50ZXN0aW5nQnJvd3NlckNyZWF0b3IsIHVybCwgb3B0aW9ucyApO1xyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsZUFBZSxHQUFHQyxPQUFPLENBQUUsbUJBQW9CLENBQUM7QUFDdEQsTUFBTUMsVUFBVSxHQUFHRCxPQUFPLENBQUUsWUFBYSxDQUFDO0FBQzFDLE1BQU1FLENBQUMsR0FBR0YsT0FBTyxDQUFFLFFBQVMsQ0FBQzs7QUFFN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FHLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLGdCQUFnQkMsR0FBRyxFQUFFQyxPQUFPLEVBQUc7RUFDOUNBLE9BQU8sR0FBR0osQ0FBQyxDQUFDSyxLQUFLLENBQUU7SUFDakJDLHFCQUFxQixFQUFFUCxVQUFVLENBQUNRO0VBQ3BDLENBQUMsRUFBRUgsT0FBUSxDQUFDO0VBQ1osT0FBT1AsZUFBZSxDQUFFTyxPQUFPLENBQUNFLHFCQUFxQixFQUFFSCxHQUFHLEVBQUVDLE9BQVEsQ0FBQztBQUN2RSxDQUFDIiwiaWdub3JlTGlzdCI6W119