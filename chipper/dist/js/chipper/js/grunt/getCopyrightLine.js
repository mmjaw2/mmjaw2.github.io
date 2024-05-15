// Copyright 2021-2024, University of Colorado Boulder

/**
 * Function that determines created and last modified dates from git, see #403. If the file is not tracked in git
 * then returns a copyright statement with the current year.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('../../../perennial-alias/js/common/execute');

/**
 * @public
 * @param {string} repo - The repository of the file to update (should be a git root)
 * @param {string} relativeFile - The filename relative to the repository root.
 * @returns {Promise}
 */
module.exports = async (repo, relativeFile) => {
  let startDate = (await execute('git', ['log', '--diff-filter=A', '--follow', '--date=short', '--format=%cd', '-1', '--', relativeFile], `../${repo}`)).trim().split('-')[0];
  const endDate = (await execute('git', ['log', '--follow', '--date=short', '--format=%cd', '-1', '--', relativeFile], `../${repo}`)).trim().split('-')[0];
  let dateString = '';

  // git was unable to get any information about the file. Perhaps it is new or not yet tracked in get? Use the current year.
  if (startDate === '' && endDate === '') {
    dateString = new Date().getFullYear();
  } else {
    // There is a bug with the first git log command that sometimes yields a blank link as output
    // You can find occurrences of this by searching our repos for "Copyright 2002-"
    if (startDate === '') {
      startDate = '2002';
    }

    // Create the single date or date range to use in the copyright statement
    dateString = startDate === endDate ? startDate : `${startDate}-${endDate}`;
  }
  return `// Copyright ${dateString}, University of Colorado Boulder`;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwicmVsYXRpdmVGaWxlIiwic3RhcnREYXRlIiwidHJpbSIsInNwbGl0IiwiZW5kRGF0ZSIsImRhdGVTdHJpbmciLCJEYXRlIiwiZ2V0RnVsbFllYXIiXSwic291cmNlcyI6WyJnZXRDb3B5cmlnaHRMaW5lLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRoYXQgZGV0ZXJtaW5lcyBjcmVhdGVkIGFuZCBsYXN0IG1vZGlmaWVkIGRhdGVzIGZyb20gZ2l0LCBzZWUgIzQwMy4gSWYgdGhlIGZpbGUgaXMgbm90IHRyYWNrZWQgaW4gZ2l0XHJcbiAqIHRoZW4gcmV0dXJucyBhIGNvcHlyaWdodCBzdGF0ZW1lbnQgd2l0aCB0aGUgY3VycmVudCB5ZWFyLlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuXHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi4vLi4vLi4vcGVyZW5uaWFsLWFsaWFzL2pzL2NvbW1vbi9leGVjdXRlJyApO1xyXG5cclxuLyoqXHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBvZiB0aGUgZmlsZSB0byB1cGRhdGUgKHNob3VsZCBiZSBhIGdpdCByb290KVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVsYXRpdmVGaWxlIC0gVGhlIGZpbGVuYW1lIHJlbGF0aXZlIHRvIHRoZSByZXBvc2l0b3J5IHJvb3QuXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyAoIHJlcG8sIHJlbGF0aXZlRmlsZSApID0+IHtcclxuXHJcbiAgbGV0IHN0YXJ0RGF0ZSA9ICggYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIFtcclxuICAgICdsb2cnLCAnLS1kaWZmLWZpbHRlcj1BJywgJy0tZm9sbG93JywgJy0tZGF0ZT1zaG9ydCcsICctLWZvcm1hdD0lY2QnLCAnLTEnLCAnLS0nLCByZWxhdGl2ZUZpbGVcclxuICBdLCBgLi4vJHtyZXBvfWAgKSApLnRyaW0oKS5zcGxpdCggJy0nIClbIDAgXTtcclxuXHJcbiAgY29uc3QgZW5kRGF0ZSA9ICggYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIFtcclxuICAgICdsb2cnLCAnLS1mb2xsb3cnLCAnLS1kYXRlPXNob3J0JywgJy0tZm9ybWF0PSVjZCcsICctMScsICctLScsIHJlbGF0aXZlRmlsZVxyXG4gIF0sIGAuLi8ke3JlcG99YCApICkudHJpbSgpLnNwbGl0KCAnLScgKVsgMCBdO1xyXG5cclxuICBsZXQgZGF0ZVN0cmluZyA9ICcnO1xyXG5cclxuICAvLyBnaXQgd2FzIHVuYWJsZSB0byBnZXQgYW55IGluZm9ybWF0aW9uIGFib3V0IHRoZSBmaWxlLiBQZXJoYXBzIGl0IGlzIG5ldyBvciBub3QgeWV0IHRyYWNrZWQgaW4gZ2V0PyBVc2UgdGhlIGN1cnJlbnQgeWVhci5cclxuICBpZiAoIHN0YXJ0RGF0ZSA9PT0gJycgJiYgZW5kRGF0ZSA9PT0gJycgKSB7XHJcbiAgICBkYXRlU3RyaW5nID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpO1xyXG4gIH1cclxuICBlbHNlIHtcclxuXHJcbiAgICAvLyBUaGVyZSBpcyBhIGJ1ZyB3aXRoIHRoZSBmaXJzdCBnaXQgbG9nIGNvbW1hbmQgdGhhdCBzb21ldGltZXMgeWllbGRzIGEgYmxhbmsgbGluayBhcyBvdXRwdXRcclxuICAgIC8vIFlvdSBjYW4gZmluZCBvY2N1cnJlbmNlcyBvZiB0aGlzIGJ5IHNlYXJjaGluZyBvdXIgcmVwb3MgZm9yIFwiQ29weXJpZ2h0IDIwMDItXCJcclxuICAgIGlmICggc3RhcnREYXRlID09PSAnJyApIHtcclxuICAgICAgc3RhcnREYXRlID0gJzIwMDInO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENyZWF0ZSB0aGUgc2luZ2xlIGRhdGUgb3IgZGF0ZSByYW5nZSB0byB1c2UgaW4gdGhlIGNvcHlyaWdodCBzdGF0ZW1lbnRcclxuICAgIGRhdGVTdHJpbmcgPSAoIHN0YXJ0RGF0ZSA9PT0gZW5kRGF0ZSApID8gc3RhcnREYXRlIDogKCBgJHtzdGFydERhdGV9LSR7ZW5kRGF0ZX1gICk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYC8vIENvcHlyaWdodCAke2RhdGVTdHJpbmd9LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJgO1xyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0EsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsNENBQTZDLENBQUM7O0FBRXZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBQyxNQUFNLENBQUNDLE9BQU8sR0FBRyxPQUFRQyxJQUFJLEVBQUVDLFlBQVksS0FBTTtFQUUvQyxJQUFJQyxTQUFTLEdBQUcsQ0FBRSxNQUFNTixPQUFPLENBQUUsS0FBSyxFQUFFLENBQ3RDLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFSyxZQUFZLENBQy9GLEVBQUcsTUFBS0QsSUFBSyxFQUFFLENBQUMsRUFBR0csSUFBSSxDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFFLEdBQUksQ0FBQyxDQUFFLENBQUMsQ0FBRTtFQUU1QyxNQUFNQyxPQUFPLEdBQUcsQ0FBRSxNQUFNVCxPQUFPLENBQUUsS0FBSyxFQUFFLENBQ3RDLEtBQUssRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFSyxZQUFZLENBQzVFLEVBQUcsTUFBS0QsSUFBSyxFQUFFLENBQUMsRUFBR0csSUFBSSxDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFFLEdBQUksQ0FBQyxDQUFFLENBQUMsQ0FBRTtFQUU1QyxJQUFJRSxVQUFVLEdBQUcsRUFBRTs7RUFFbkI7RUFDQSxJQUFLSixTQUFTLEtBQUssRUFBRSxJQUFJRyxPQUFPLEtBQUssRUFBRSxFQUFHO0lBQ3hDQyxVQUFVLEdBQUcsSUFBSUMsSUFBSSxDQUFDLENBQUMsQ0FBQ0MsV0FBVyxDQUFDLENBQUM7RUFDdkMsQ0FBQyxNQUNJO0lBRUg7SUFDQTtJQUNBLElBQUtOLFNBQVMsS0FBSyxFQUFFLEVBQUc7TUFDdEJBLFNBQVMsR0FBRyxNQUFNO0lBQ3BCOztJQUVBO0lBQ0FJLFVBQVUsR0FBS0osU0FBUyxLQUFLRyxPQUFPLEdBQUtILFNBQVMsR0FBTSxHQUFFQSxTQUFVLElBQUdHLE9BQVEsRUFBRztFQUNwRjtFQUVBLE9BQVEsZ0JBQWVDLFVBQVcsa0NBQWlDO0FBQ3JFLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=