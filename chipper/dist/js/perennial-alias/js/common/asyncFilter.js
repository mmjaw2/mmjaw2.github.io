// Copyright 2020, University of Colorado Boulder

/**
 * Returns an array filtered asynchronously
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

/**
 * Returns an array filtered asynchronously
 *
 * @param {Array.<*>} list
 * @param {function({*}):*})} f
 * @returns {Promise.<Array.<*>>}
 */
const asyncFilter = async (list, f) => {
  const items = [];
  for (const item of list) {
    if (await f(item)) {
      items.push(item);
    }
  }
  return items;
};
module.exports = asyncFilter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3luY0ZpbHRlciIsImxpc3QiLCJmIiwiaXRlbXMiLCJpdGVtIiwicHVzaCIsIm1vZHVsZSIsImV4cG9ydHMiXSwic291cmNlcyI6WyJhc3luY0ZpbHRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhbiBhcnJheSBmaWx0ZXJlZCBhc3luY2hyb25vdXNseVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYW4gYXJyYXkgZmlsdGVyZWQgYXN5bmNocm9ub3VzbHlcclxuICpcclxuICogQHBhcmFtIHtBcnJheS48Kj59IGxpc3RcclxuICogQHBhcmFtIHtmdW5jdGlvbih7Kn0pOip9KX0gZlxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48QXJyYXkuPCo+Pn1cclxuICovXHJcbmNvbnN0IGFzeW5jRmlsdGVyID0gYXN5bmMgKCBsaXN0LCBmICkgPT4ge1xyXG4gIGNvbnN0IGl0ZW1zID0gW107XHJcbiAgZm9yICggY29uc3QgaXRlbSBvZiBsaXN0ICkge1xyXG4gICAgaWYgKCBhd2FpdCBmKCBpdGVtICkgKSB7XHJcbiAgICAgIGl0ZW1zLnB1c2goIGl0ZW0gKTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGl0ZW1zO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luY0ZpbHRlcjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNQSxXQUFXLEdBQUcsTUFBQUEsQ0FBUUMsSUFBSSxFQUFFQyxDQUFDLEtBQU07RUFDdkMsTUFBTUMsS0FBSyxHQUFHLEVBQUU7RUFDaEIsS0FBTSxNQUFNQyxJQUFJLElBQUlILElBQUksRUFBRztJQUN6QixJQUFLLE1BQU1DLENBQUMsQ0FBRUUsSUFBSyxDQUFDLEVBQUc7TUFDckJELEtBQUssQ0FBQ0UsSUFBSSxDQUFFRCxJQUFLLENBQUM7SUFDcEI7RUFDRjtFQUNBLE9BQU9ELEtBQUs7QUFDZCxDQUFDO0FBRURHLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHUCxXQUFXIiwiaWdub3JlTGlzdCI6W119