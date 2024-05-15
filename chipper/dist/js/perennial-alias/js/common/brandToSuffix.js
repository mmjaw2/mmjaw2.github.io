// Copyright 2017, University of Colorado Boulder

/**
 * Returns the brand suffix, given a brand name.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

/**
 * Returns the brand suffix, given a brand name (e.g. 'phet' => '-phet', 'phet-io' => '-phetio', 'adapted-from-phet' => '-adaptedFromPhet')
 * @public
 *
 * @param {string} brand
 * @returns {string}
 */
module.exports = function (brand) {
  if (brand === 'phet-io') {
    return 'phetio';
  }
  return brand.split('-').map((bit, index) => {
    return (index > 0 ? bit[0].toUpperCase() : bit[0]) + bit.slice(1);
  }).join('');
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwiYnJhbmQiLCJzcGxpdCIsIm1hcCIsImJpdCIsImluZGV4IiwidG9VcHBlckNhc2UiLCJzbGljZSIsImpvaW4iXSwic291cmNlcyI6WyJicmFuZFRvU3VmZml4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBicmFuZCBzdWZmaXgsIGdpdmVuIGEgYnJhbmQgbmFtZS5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBicmFuZCBzdWZmaXgsIGdpdmVuIGEgYnJhbmQgbmFtZSAoZS5nLiAncGhldCcgPT4gJy1waGV0JywgJ3BoZXQtaW8nID0+ICctcGhldGlvJywgJ2FkYXB0ZWQtZnJvbS1waGV0JyA9PiAnLWFkYXB0ZWRGcm9tUGhldCcpXHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGJyYW5kXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBicmFuZCApIHtcclxuICBpZiAoIGJyYW5kID09PSAncGhldC1pbycgKSB7XHJcbiAgICByZXR1cm4gJ3BoZXRpbyc7XHJcbiAgfVxyXG4gIHJldHVybiBicmFuZC5zcGxpdCggJy0nICkubWFwKCAoIGJpdCwgaW5kZXggKSA9PiB7XHJcbiAgICByZXR1cm4gKCBpbmRleCA+IDAgPyBiaXRbIDAgXS50b1VwcGVyQ2FzZSgpIDogYml0WyAwIF0gKSArIGJpdC5zbGljZSggMSApO1xyXG4gIH0gKS5qb2luKCAnJyApO1xyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBQSxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxLQUFLLEVBQUc7RUFDakMsSUFBS0EsS0FBSyxLQUFLLFNBQVMsRUFBRztJQUN6QixPQUFPLFFBQVE7RUFDakI7RUFDQSxPQUFPQSxLQUFLLENBQUNDLEtBQUssQ0FBRSxHQUFJLENBQUMsQ0FBQ0MsR0FBRyxDQUFFLENBQUVDLEdBQUcsRUFBRUMsS0FBSyxLQUFNO0lBQy9DLE9BQU8sQ0FBRUEsS0FBSyxHQUFHLENBQUMsR0FBR0QsR0FBRyxDQUFFLENBQUMsQ0FBRSxDQUFDRSxXQUFXLENBQUMsQ0FBQyxHQUFHRixHQUFHLENBQUUsQ0FBQyxDQUFFLElBQUtBLEdBQUcsQ0FBQ0csS0FBSyxDQUFFLENBQUUsQ0FBQztFQUMzRSxDQUFFLENBQUMsQ0FBQ0MsSUFBSSxDQUFFLEVBQUcsQ0FBQztBQUNoQixDQUFDIiwiaWdub3JlTGlzdCI6W119