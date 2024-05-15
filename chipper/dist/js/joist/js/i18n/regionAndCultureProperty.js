// Copyright 2024, University of Colorado Boulder

/**
 * In this file:
 *
 * regionAndCultureProperty is a global Property used to set aspects of i18n that are related to region and/or culture,
 * but that do not pertain to language (see localeProperty for language).
 *
 * The type RegionAndCulture defines the complete set of choices for regionAndCultureProperty. The choices supported by
 * a sim are defined in package.json via "supportedRegionsAndCultures", and determines the value of
 * supportedRegionAndCultureValues. Whether included explicitly or implicitly, 'usa' is always choice, because it
 * is the fallback.
 *
 * The initial value of regionAndCultureProperty can be specified in package.json and via a query parameter.
 * In package.json, "defaultRegionAndCulture" identifies the initial choice, and defaults to 'usa'.
 * Use the ?regionAndCulture query parameter to override the default, for example ?regionAndCulture=asia
 *
 * @author Marla Schulz (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Property from '../../../axon/js/Property.js';
import Tandem from '../../../tandem/js/Tandem.js';
import StringIO from '../../../tandem/js/types/StringIO.js';
import joist from '../joist.js';
import packageJSON from '../packageJSON.js';
export const DEFAULT_REGION_AND_CULTURE = 'usa';

// The complete set of valid values.
const RegionAndCultureValues = [
// Inspired by the images and dress of the USA. Although many other countries may also identify with this choice,
// as PhET being based in the USA, and having difficulty finding language that appropriately reflects all the regions
// where that may match this value, it was decided to keep "United States of America" as the descriptor with the
// understanding that other regions may identify with this choice.
'usa',
// Inspired by the images and dress of Africa.
'africa',
// Similar to 'africa', with adjustments to dress that is representative of more modest cultures.
'africaModest',
// Inspired by the images and dress of Asia.
'asia',
// Inspired by the images and dress of Latin America.
'latinAmerica',
// Inspired by the images and dress of Oceania.
'oceania',
// Randomly selects one of the other choices, but not the current choice.
'random'];
// The subset of RegionAndCultureValues that is supported by the sim, specified via "supportedRegionsAndCultures" in package.json.
export const supportedRegionAndCultureValues = _.uniq([DEFAULT_REGION_AND_CULTURE,
// Always supported, since it is our fallback.
...(packageJSON?.phet?.simFeatures?.supportedRegionsAndCultures || [])].filter(regionAndCulture => RegionAndCultureValues.includes(regionAndCulture)));

// Is the specified regionAndCulture supported at runtime?
const isSupportedRegionAndCulture = regionAndCulture => {
  return !!(regionAndCulture && supportedRegionAndCultureValues.includes(regionAndCulture));
};
const initialRegionAndCulture = window.phet.chipper.queryParameters.regionAndCulture;
assert && assert(isSupportedRegionAndCulture(initialRegionAndCulture), `Unsupported value for query parameter ?regionAndCulture: ${initialRegionAndCulture}`);

// Globally available, similar to phet.chipper.locale, for things that might read this (e.g. from puppeteer in the future).
phet.chipper.regionAndCulture = initialRegionAndCulture;
class RegionAndCultureProperty extends Property {
  unguardedSet(value) {
    if (supportedRegionAndCultureValues.includes(value)) {
      super.unguardedSet(value);
    } else {
      assert && assert(false, 'Unsupported region-and-culture: ' + value);

      // Do not try to set if the value was invalid
    }
  }
}
const isInstrumented = supportedRegionAndCultureValues.length > 1;
const regionAndCultureProperty = new RegionAndCultureProperty(initialRegionAndCulture, {
  // Sorted so that changing the order of "supportedRegionsAndCultures" in package.json does not change the PhET-iO API.
  validValues: supportedRegionAndCultureValues.sort(),
  tandem: isInstrumented ? Tandem.GENERAL_MODEL.createTandem('regionAndCultureProperty') : Tandem.OPT_OUT,
  phetioFeatured: isInstrumented,
  phetioValueType: StringIO,
  phetioDocumentation: 'Describes how a region and culture will be portrayed in the sim.'
});
joist.register('regionAndCultureProperty', regionAndCultureProperty);
export default regionAndCultureProperty;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQcm9wZXJ0eSIsIlRhbmRlbSIsIlN0cmluZ0lPIiwiam9pc3QiLCJwYWNrYWdlSlNPTiIsIkRFRkFVTFRfUkVHSU9OX0FORF9DVUxUVVJFIiwiUmVnaW9uQW5kQ3VsdHVyZVZhbHVlcyIsInN1cHBvcnRlZFJlZ2lvbkFuZEN1bHR1cmVWYWx1ZXMiLCJfIiwidW5pcSIsInBoZXQiLCJzaW1GZWF0dXJlcyIsInN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlcyIsImZpbHRlciIsInJlZ2lvbkFuZEN1bHR1cmUiLCJpbmNsdWRlcyIsImlzU3VwcG9ydGVkUmVnaW9uQW5kQ3VsdHVyZSIsImluaXRpYWxSZWdpb25BbmRDdWx0dXJlIiwid2luZG93IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImFzc2VydCIsIlJlZ2lvbkFuZEN1bHR1cmVQcm9wZXJ0eSIsInVuZ3VhcmRlZFNldCIsInZhbHVlIiwiaXNJbnN0cnVtZW50ZWQiLCJsZW5ndGgiLCJyZWdpb25BbmRDdWx0dXJlUHJvcGVydHkiLCJ2YWxpZFZhbHVlcyIsInNvcnQiLCJ0YW5kZW0iLCJHRU5FUkFMX01PREVMIiwiY3JlYXRlVGFuZGVtIiwiT1BUX09VVCIsInBoZXRpb0ZlYXR1cmVkIiwicGhldGlvVmFsdWVUeXBlIiwicGhldGlvRG9jdW1lbnRhdGlvbiIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsicmVnaW9uQW5kQ3VsdHVyZVByb3BlcnR5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBJbiB0aGlzIGZpbGU6XHJcbiAqXHJcbiAqIHJlZ2lvbkFuZEN1bHR1cmVQcm9wZXJ0eSBpcyBhIGdsb2JhbCBQcm9wZXJ0eSB1c2VkIHRvIHNldCBhc3BlY3RzIG9mIGkxOG4gdGhhdCBhcmUgcmVsYXRlZCB0byByZWdpb24gYW5kL29yIGN1bHR1cmUsXHJcbiAqIGJ1dCB0aGF0IGRvIG5vdCBwZXJ0YWluIHRvIGxhbmd1YWdlIChzZWUgbG9jYWxlUHJvcGVydHkgZm9yIGxhbmd1YWdlKS5cclxuICpcclxuICogVGhlIHR5cGUgUmVnaW9uQW5kQ3VsdHVyZSBkZWZpbmVzIHRoZSBjb21wbGV0ZSBzZXQgb2YgY2hvaWNlcyBmb3IgcmVnaW9uQW5kQ3VsdHVyZVByb3BlcnR5LiBUaGUgY2hvaWNlcyBzdXBwb3J0ZWQgYnlcclxuICogYSBzaW0gYXJlIGRlZmluZWQgaW4gcGFja2FnZS5qc29uIHZpYSBcInN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlc1wiLCBhbmQgZGV0ZXJtaW5lcyB0aGUgdmFsdWUgb2ZcclxuICogc3VwcG9ydGVkUmVnaW9uQW5kQ3VsdHVyZVZhbHVlcy4gV2hldGhlciBpbmNsdWRlZCBleHBsaWNpdGx5IG9yIGltcGxpY2l0bHksICd1c2EnIGlzIGFsd2F5cyBjaG9pY2UsIGJlY2F1c2UgaXRcclxuICogaXMgdGhlIGZhbGxiYWNrLlxyXG4gKlxyXG4gKiBUaGUgaW5pdGlhbCB2YWx1ZSBvZiByZWdpb25BbmRDdWx0dXJlUHJvcGVydHkgY2FuIGJlIHNwZWNpZmllZCBpbiBwYWNrYWdlLmpzb24gYW5kIHZpYSBhIHF1ZXJ5IHBhcmFtZXRlci5cclxuICogSW4gcGFja2FnZS5qc29uLCBcImRlZmF1bHRSZWdpb25BbmRDdWx0dXJlXCIgaWRlbnRpZmllcyB0aGUgaW5pdGlhbCBjaG9pY2UsIGFuZCBkZWZhdWx0cyB0byAndXNhJy5cclxuICogVXNlIHRoZSA/cmVnaW9uQW5kQ3VsdHVyZSBxdWVyeSBwYXJhbWV0ZXIgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHQsIGZvciBleGFtcGxlID9yZWdpb25BbmRDdWx0dXJlPWFzaWFcclxuICpcclxuICogQGF1dGhvciBNYXJsYSBTY2h1bHogKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBTdHJpbmdJTyBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvdHlwZXMvU3RyaW5nSU8uanMnO1xyXG5pbXBvcnQgam9pc3QgZnJvbSAnLi4vam9pc3QuanMnO1xyXG5pbXBvcnQgcGFja2FnZUpTT04gZnJvbSAnLi4vcGFja2FnZUpTT04uanMnO1xyXG5cclxuZXhwb3J0IGNvbnN0IERFRkFVTFRfUkVHSU9OX0FORF9DVUxUVVJFID0gJ3VzYSc7XHJcblxyXG4vLyBUaGUgY29tcGxldGUgc2V0IG9mIHZhbGlkIHZhbHVlcy5cclxuY29uc3QgUmVnaW9uQW5kQ3VsdHVyZVZhbHVlcyA9IFtcclxuXHJcbiAgLy8gSW5zcGlyZWQgYnkgdGhlIGltYWdlcyBhbmQgZHJlc3Mgb2YgdGhlIFVTQS4gQWx0aG91Z2ggbWFueSBvdGhlciBjb3VudHJpZXMgbWF5IGFsc28gaWRlbnRpZnkgd2l0aCB0aGlzIGNob2ljZSxcclxuICAvLyBhcyBQaEVUIGJlaW5nIGJhc2VkIGluIHRoZSBVU0EsIGFuZCBoYXZpbmcgZGlmZmljdWx0eSBmaW5kaW5nIGxhbmd1YWdlIHRoYXQgYXBwcm9wcmlhdGVseSByZWZsZWN0cyBhbGwgdGhlIHJlZ2lvbnNcclxuICAvLyB3aGVyZSB0aGF0IG1heSBtYXRjaCB0aGlzIHZhbHVlLCBpdCB3YXMgZGVjaWRlZCB0byBrZWVwIFwiVW5pdGVkIFN0YXRlcyBvZiBBbWVyaWNhXCIgYXMgdGhlIGRlc2NyaXB0b3Igd2l0aCB0aGVcclxuICAvLyB1bmRlcnN0YW5kaW5nIHRoYXQgb3RoZXIgcmVnaW9ucyBtYXkgaWRlbnRpZnkgd2l0aCB0aGlzIGNob2ljZS5cclxuICAndXNhJyxcclxuXHJcbiAgLy8gSW5zcGlyZWQgYnkgdGhlIGltYWdlcyBhbmQgZHJlc3Mgb2YgQWZyaWNhLlxyXG4gICdhZnJpY2EnLFxyXG5cclxuICAvLyBTaW1pbGFyIHRvICdhZnJpY2EnLCB3aXRoIGFkanVzdG1lbnRzIHRvIGRyZXNzIHRoYXQgaXMgcmVwcmVzZW50YXRpdmUgb2YgbW9yZSBtb2Rlc3QgY3VsdHVyZXMuXHJcbiAgJ2FmcmljYU1vZGVzdCcsXHJcblxyXG4gIC8vIEluc3BpcmVkIGJ5IHRoZSBpbWFnZXMgYW5kIGRyZXNzIG9mIEFzaWEuXHJcbiAgJ2FzaWEnLFxyXG5cclxuICAvLyBJbnNwaXJlZCBieSB0aGUgaW1hZ2VzIGFuZCBkcmVzcyBvZiBMYXRpbiBBbWVyaWNhLlxyXG4gICdsYXRpbkFtZXJpY2EnLFxyXG5cclxuICAvLyBJbnNwaXJlZCBieSB0aGUgaW1hZ2VzIGFuZCBkcmVzcyBvZiBPY2VhbmlhLlxyXG4gICdvY2VhbmlhJyxcclxuXHJcbiAgLy8gUmFuZG9tbHkgc2VsZWN0cyBvbmUgb2YgdGhlIG90aGVyIGNob2ljZXMsIGJ1dCBub3QgdGhlIGN1cnJlbnQgY2hvaWNlLlxyXG4gICdyYW5kb20nXHJcblxyXG5dIGFzIGNvbnN0O1xyXG5leHBvcnQgdHlwZSBSZWdpb25BbmRDdWx0dXJlID0gdHlwZW9mIFJlZ2lvbkFuZEN1bHR1cmVWYWx1ZXNbIG51bWJlciBdO1xyXG5cclxuLy8gVGhlIHN1YnNldCBvZiBSZWdpb25BbmRDdWx0dXJlVmFsdWVzIHRoYXQgaXMgc3VwcG9ydGVkIGJ5IHRoZSBzaW0sIHNwZWNpZmllZCB2aWEgXCJzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXNcIiBpbiBwYWNrYWdlLmpzb24uXHJcbmV4cG9ydCBjb25zdCBzdXBwb3J0ZWRSZWdpb25BbmRDdWx0dXJlVmFsdWVzOiBSZWdpb25BbmRDdWx0dXJlW10gPSBfLnVuaXEoIFtcclxuICBERUZBVUxUX1JFR0lPTl9BTkRfQ1VMVFVSRSwgLy8gQWx3YXlzIHN1cHBvcnRlZCwgc2luY2UgaXQgaXMgb3VyIGZhbGxiYWNrLlxyXG4gIC4uLiggcGFja2FnZUpTT04/LnBoZXQ/LnNpbUZlYXR1cmVzPy5zdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMgfHwgW10gKVxyXG5dLmZpbHRlciggcmVnaW9uQW5kQ3VsdHVyZSA9PiBSZWdpb25BbmRDdWx0dXJlVmFsdWVzLmluY2x1ZGVzKCByZWdpb25BbmRDdWx0dXJlICkgKSApO1xyXG5cclxuLy8gSXMgdGhlIHNwZWNpZmllZCByZWdpb25BbmRDdWx0dXJlIHN1cHBvcnRlZCBhdCBydW50aW1lP1xyXG5jb25zdCBpc1N1cHBvcnRlZFJlZ2lvbkFuZEN1bHR1cmUgPSAoIHJlZ2lvbkFuZEN1bHR1cmU/OiBSZWdpb25BbmRDdWx0dXJlICk6IGJvb2xlYW4gPT4ge1xyXG4gIHJldHVybiAhISggcmVnaW9uQW5kQ3VsdHVyZSAmJiBzdXBwb3J0ZWRSZWdpb25BbmRDdWx0dXJlVmFsdWVzLmluY2x1ZGVzKCByZWdpb25BbmRDdWx0dXJlICkgKTtcclxufTtcclxuXHJcbmNvbnN0IGluaXRpYWxSZWdpb25BbmRDdWx0dXJlOiBSZWdpb25BbmRDdWx0dXJlID0gd2luZG93LnBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMucmVnaW9uQW5kQ3VsdHVyZTtcclxuYXNzZXJ0ICYmIGFzc2VydCggaXNTdXBwb3J0ZWRSZWdpb25BbmRDdWx0dXJlKCBpbml0aWFsUmVnaW9uQW5kQ3VsdHVyZSApLFxyXG4gIGBVbnN1cHBvcnRlZCB2YWx1ZSBmb3IgcXVlcnkgcGFyYW1ldGVyID9yZWdpb25BbmRDdWx0dXJlOiAke2luaXRpYWxSZWdpb25BbmRDdWx0dXJlfWAgKTtcclxuXHJcbi8vIEdsb2JhbGx5IGF2YWlsYWJsZSwgc2ltaWxhciB0byBwaGV0LmNoaXBwZXIubG9jYWxlLCBmb3IgdGhpbmdzIHRoYXQgbWlnaHQgcmVhZCB0aGlzIChlLmcuIGZyb20gcHVwcGV0ZWVyIGluIHRoZSBmdXR1cmUpLlxyXG5waGV0LmNoaXBwZXIucmVnaW9uQW5kQ3VsdHVyZSA9IGluaXRpYWxSZWdpb25BbmRDdWx0dXJlO1xyXG5cclxuY2xhc3MgUmVnaW9uQW5kQ3VsdHVyZVByb3BlcnR5IGV4dGVuZHMgUHJvcGVydHk8UmVnaW9uQW5kQ3VsdHVyZT4ge1xyXG4gIHByb3RlY3RlZCBvdmVycmlkZSB1bmd1YXJkZWRTZXQoIHZhbHVlOiBSZWdpb25BbmRDdWx0dXJlICk6IHZvaWQge1xyXG4gICAgaWYgKCBzdXBwb3J0ZWRSZWdpb25BbmRDdWx0dXJlVmFsdWVzLmluY2x1ZGVzKCB2YWx1ZSApICkge1xyXG4gICAgICBzdXBlci51bmd1YXJkZWRTZXQoIHZhbHVlICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZmFsc2UsICdVbnN1cHBvcnRlZCByZWdpb24tYW5kLWN1bHR1cmU6ICcgKyB2YWx1ZSApO1xyXG5cclxuICAgICAgLy8gRG8gbm90IHRyeSB0byBzZXQgaWYgdGhlIHZhbHVlIHdhcyBpbnZhbGlkXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBpc0luc3RydW1lbnRlZCA9IHN1cHBvcnRlZFJlZ2lvbkFuZEN1bHR1cmVWYWx1ZXMubGVuZ3RoID4gMTtcclxuXHJcbmNvbnN0IHJlZ2lvbkFuZEN1bHR1cmVQcm9wZXJ0eSA9IG5ldyBSZWdpb25BbmRDdWx0dXJlUHJvcGVydHkoIGluaXRpYWxSZWdpb25BbmRDdWx0dXJlLCB7XHJcblxyXG4gIC8vIFNvcnRlZCBzbyB0aGF0IGNoYW5naW5nIHRoZSBvcmRlciBvZiBcInN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlc1wiIGluIHBhY2thZ2UuanNvbiBkb2VzIG5vdCBjaGFuZ2UgdGhlIFBoRVQtaU8gQVBJLlxyXG4gIHZhbGlkVmFsdWVzOiBzdXBwb3J0ZWRSZWdpb25BbmRDdWx0dXJlVmFsdWVzLnNvcnQoKSxcclxuICB0YW5kZW06IGlzSW5zdHJ1bWVudGVkID8gVGFuZGVtLkdFTkVSQUxfTU9ERUwuY3JlYXRlVGFuZGVtKCAncmVnaW9uQW5kQ3VsdHVyZVByb3BlcnR5JyApIDogVGFuZGVtLk9QVF9PVVQsXHJcbiAgcGhldGlvRmVhdHVyZWQ6IGlzSW5zdHJ1bWVudGVkLFxyXG4gIHBoZXRpb1ZhbHVlVHlwZTogU3RyaW5nSU8sXHJcbiAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0Rlc2NyaWJlcyBob3cgYSByZWdpb24gYW5kIGN1bHR1cmUgd2lsbCBiZSBwb3J0cmF5ZWQgaW4gdGhlIHNpbS4nXHJcbn0gKTtcclxuXHJcbmpvaXN0LnJlZ2lzdGVyKCAncmVnaW9uQW5kQ3VsdHVyZVByb3BlcnR5JywgcmVnaW9uQW5kQ3VsdHVyZVByb3BlcnR5ICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCByZWdpb25BbmRDdWx0dXJlUHJvcGVydHk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxRQUFRLE1BQU0sOEJBQThCO0FBQ25ELE9BQU9DLE1BQU0sTUFBTSw4QkFBOEI7QUFDakQsT0FBT0MsUUFBUSxNQUFNLHNDQUFzQztBQUMzRCxPQUFPQyxLQUFLLE1BQU0sYUFBYTtBQUMvQixPQUFPQyxXQUFXLE1BQU0sbUJBQW1CO0FBRTNDLE9BQU8sTUFBTUMsMEJBQTBCLEdBQUcsS0FBSzs7QUFFL0M7QUFDQSxNQUFNQyxzQkFBc0IsR0FBRztBQUU3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFFTDtBQUNBLFFBQVE7QUFFUjtBQUNBLGNBQWM7QUFFZDtBQUNBLE1BQU07QUFFTjtBQUNBLGNBQWM7QUFFZDtBQUNBLFNBQVM7QUFFVDtBQUNBLFFBQVEsQ0FFQTtBQUdWO0FBQ0EsT0FBTyxNQUFNQywrQkFBbUQsR0FBR0MsQ0FBQyxDQUFDQyxJQUFJLENBQUUsQ0FDekVKLDBCQUEwQjtBQUFFO0FBQzVCLElBQUtELFdBQVcsRUFBRU0sSUFBSSxFQUFFQyxXQUFXLEVBQUVDLDJCQUEyQixJQUFJLEVBQUUsQ0FBRSxDQUN6RSxDQUFDQyxNQUFNLENBQUVDLGdCQUFnQixJQUFJUixzQkFBc0IsQ0FBQ1MsUUFBUSxDQUFFRCxnQkFBaUIsQ0FBRSxDQUFFLENBQUM7O0FBRXJGO0FBQ0EsTUFBTUUsMkJBQTJCLEdBQUtGLGdCQUFtQyxJQUFlO0VBQ3RGLE9BQU8sQ0FBQyxFQUFHQSxnQkFBZ0IsSUFBSVAsK0JBQStCLENBQUNRLFFBQVEsQ0FBRUQsZ0JBQWlCLENBQUMsQ0FBRTtBQUMvRixDQUFDO0FBRUQsTUFBTUcsdUJBQXlDLEdBQUdDLE1BQU0sQ0FBQ1IsSUFBSSxDQUFDUyxPQUFPLENBQUNDLGVBQWUsQ0FBQ04sZ0JBQWdCO0FBQ3RHTyxNQUFNLElBQUlBLE1BQU0sQ0FBRUwsMkJBQTJCLENBQUVDLHVCQUF3QixDQUFDLEVBQ3JFLDREQUEyREEsdUJBQXdCLEVBQUUsQ0FBQzs7QUFFekY7QUFDQVAsSUFBSSxDQUFDUyxPQUFPLENBQUNMLGdCQUFnQixHQUFHRyx1QkFBdUI7QUFFdkQsTUFBTUssd0JBQXdCLFNBQVN0QixRQUFRLENBQW1CO0VBQzdDdUIsWUFBWUEsQ0FBRUMsS0FBdUIsRUFBUztJQUMvRCxJQUFLakIsK0JBQStCLENBQUNRLFFBQVEsQ0FBRVMsS0FBTSxDQUFDLEVBQUc7TUFDdkQsS0FBSyxDQUFDRCxZQUFZLENBQUVDLEtBQU0sQ0FBQztJQUM3QixDQUFDLE1BQ0k7TUFDSEgsTUFBTSxJQUFJQSxNQUFNLENBQUUsS0FBSyxFQUFFLGtDQUFrQyxHQUFHRyxLQUFNLENBQUM7O01BRXJFO0lBQ0Y7RUFDRjtBQUNGO0FBRUEsTUFBTUMsY0FBYyxHQUFHbEIsK0JBQStCLENBQUNtQixNQUFNLEdBQUcsQ0FBQztBQUVqRSxNQUFNQyx3QkFBd0IsR0FBRyxJQUFJTCx3QkFBd0IsQ0FBRUwsdUJBQXVCLEVBQUU7RUFFdEY7RUFDQVcsV0FBVyxFQUFFckIsK0JBQStCLENBQUNzQixJQUFJLENBQUMsQ0FBQztFQUNuREMsTUFBTSxFQUFFTCxjQUFjLEdBQUd4QixNQUFNLENBQUM4QixhQUFhLENBQUNDLFlBQVksQ0FBRSwwQkFBMkIsQ0FBQyxHQUFHL0IsTUFBTSxDQUFDZ0MsT0FBTztFQUN6R0MsY0FBYyxFQUFFVCxjQUFjO0VBQzlCVSxlQUFlLEVBQUVqQyxRQUFRO0VBQ3pCa0MsbUJBQW1CLEVBQUU7QUFDdkIsQ0FBRSxDQUFDO0FBRUhqQyxLQUFLLENBQUNrQyxRQUFRLENBQUUsMEJBQTBCLEVBQUVWLHdCQUF5QixDQUFDO0FBRXRFLGVBQWVBLHdCQUF3QiIsImlnbm9yZUxpc3QiOltdfQ==