// Copyright 2015-2024, University of Colorado Boulder

/**
 * Constants used throughout chipper.
 * All fields are @public (read-only)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

/* eslint-env node */

const ChipperConstants = {
  // Locale to use when no locale is specified
  FALLBACK_LOCALE: 'en',
  // Media types, also the directory names where the media files live
  MEDIA_TYPES: ['sounds', 'images', 'mipmaps'],
  // Used to fill in sim.html, the sim template
  START_THIRD_PARTY_LICENSE_ENTRIES: '### START THIRD PARTY LICENSE ENTRIES ###',
  // Used to fill in sim.html, the sim template
  END_THIRD_PARTY_LICENSE_ENTRIES: '### END THIRD PARTY LICENSE ENTRIES ###',
  // (a11y) tail suffix of the a11y-view template. Expected usage: {{repository-name}}{{A11Y_VIEW_HTML_SUFFIX}}
  A11Y_VIEW_HTML_SUFFIX: '_a11y_view.html',
  // All brands that should be taken into account for dependency handling
  BRANDS: ['phet', 'phet-io', 'adapted-from-phet'],
  // Where temporary build output will go in chipper, see https://github.com/phetsims/chipper/issues/900
  BUILD_DIR: 'build'
};
module.exports = ChipperConstants;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDaGlwcGVyQ29uc3RhbnRzIiwiRkFMTEJBQ0tfTE9DQUxFIiwiTUVESUFfVFlQRVMiLCJTVEFSVF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVMiLCJFTkRfVEhJUkRfUEFSVFlfTElDRU5TRV9FTlRSSUVTIiwiQTExWV9WSUVXX0hUTUxfU1VGRklYIiwiQlJBTkRTIiwiQlVJTERfRElSIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbIkNoaXBwZXJDb25zdGFudHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTUtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ29uc3RhbnRzIHVzZWQgdGhyb3VnaG91dCBjaGlwcGVyLlxyXG4gKiBBbGwgZmllbGRzIGFyZSBAcHVibGljIChyZWFkLW9ubHkpXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuLyogZXNsaW50LWVudiBub2RlICovXHJcblxyXG5cclxuY29uc3QgQ2hpcHBlckNvbnN0YW50cyA9IHtcclxuXHJcbiAgLy8gTG9jYWxlIHRvIHVzZSB3aGVuIG5vIGxvY2FsZSBpcyBzcGVjaWZpZWRcclxuICBGQUxMQkFDS19MT0NBTEU6ICdlbicsXHJcblxyXG4gIC8vIE1lZGlhIHR5cGVzLCBhbHNvIHRoZSBkaXJlY3RvcnkgbmFtZXMgd2hlcmUgdGhlIG1lZGlhIGZpbGVzIGxpdmVcclxuICBNRURJQV9UWVBFUzogWyAnc291bmRzJywgJ2ltYWdlcycsICdtaXBtYXBzJyBdLFxyXG5cclxuICAvLyBVc2VkIHRvIGZpbGwgaW4gc2ltLmh0bWwsIHRoZSBzaW0gdGVtcGxhdGVcclxuICBTVEFSVF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVM6ICcjIyMgU1RBUlQgVEhJUkQgUEFSVFkgTElDRU5TRSBFTlRSSUVTICMjIycsXHJcblxyXG4gIC8vIFVzZWQgdG8gZmlsbCBpbiBzaW0uaHRtbCwgdGhlIHNpbSB0ZW1wbGF0ZVxyXG4gIEVORF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVM6ICcjIyMgRU5EIFRISVJEIFBBUlRZIExJQ0VOU0UgRU5UUklFUyAjIyMnLFxyXG5cclxuICAvLyAoYTExeSkgdGFpbCBzdWZmaXggb2YgdGhlIGExMXktdmlldyB0ZW1wbGF0ZS4gRXhwZWN0ZWQgdXNhZ2U6IHt7cmVwb3NpdG9yeS1uYW1lfX17e0ExMVlfVklFV19IVE1MX1NVRkZJWH19XHJcbiAgQTExWV9WSUVXX0hUTUxfU1VGRklYOiAnX2ExMXlfdmlldy5odG1sJyxcclxuXHJcbiAgLy8gQWxsIGJyYW5kcyB0aGF0IHNob3VsZCBiZSB0YWtlbiBpbnRvIGFjY291bnQgZm9yIGRlcGVuZGVuY3kgaGFuZGxpbmdcclxuICBCUkFORFM6IFsgJ3BoZXQnLCAncGhldC1pbycsICdhZGFwdGVkLWZyb20tcGhldCcgXSxcclxuXHJcbiAgLy8gV2hlcmUgdGVtcG9yYXJ5IGJ1aWxkIG91dHB1dCB3aWxsIGdvIGluIGNoaXBwZXIsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvOTAwXHJcbiAgQlVJTERfRElSOiAnYnVpbGQnXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENoaXBwZXJDb25zdGFudHM7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFHQSxNQUFNQSxnQkFBZ0IsR0FBRztFQUV2QjtFQUNBQyxlQUFlLEVBQUUsSUFBSTtFQUVyQjtFQUNBQyxXQUFXLEVBQUUsQ0FBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBRTtFQUU5QztFQUNBQyxpQ0FBaUMsRUFBRSwyQ0FBMkM7RUFFOUU7RUFDQUMsK0JBQStCLEVBQUUseUNBQXlDO0VBRTFFO0VBQ0FDLHFCQUFxQixFQUFFLGlCQUFpQjtFQUV4QztFQUNBQyxNQUFNLEVBQUUsQ0FBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLG1CQUFtQixDQUFFO0VBRWxEO0VBQ0FDLFNBQVMsRUFBRTtBQUNiLENBQUM7QUFFREMsTUFBTSxDQUFDQyxPQUFPLEdBQUdULGdCQUFnQiIsImlnbm9yZUxpc3QiOltdfQ==