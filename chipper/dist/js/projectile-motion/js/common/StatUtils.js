// Copyright 2022-2024, University of Colorado Boulder

/**
 * Statistics utilities for the projectile motion sim.
 *
 * @author Matthew Blackman (PhET Interactive Simulations)
 */

import dotRandom from '../../../dot/js/dotRandom.js';
const StatUtils = {
  randomFromNormal: function (mean, standardDeviation) {
    let u = 0;
    let v = 0;
    while (u === 0) {
      u = dotRandom.nextDouble();
    } //Converting [0,1) to (0,1)
    while (v === 0) {
      v = dotRandom.nextDouble();
    }
    return mean + standardDeviation * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
};

// projectileMotion.register("StatUtils", StatUtils);

export default StatUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkb3RSYW5kb20iLCJTdGF0VXRpbHMiLCJyYW5kb21Gcm9tTm9ybWFsIiwibWVhbiIsInN0YW5kYXJkRGV2aWF0aW9uIiwidSIsInYiLCJuZXh0RG91YmxlIiwiTWF0aCIsInNxcnQiLCJsb2ciLCJjb3MiLCJQSSJdLCJzb3VyY2VzIjpbIlN0YXRVdGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTdGF0aXN0aWNzIHV0aWxpdGllcyBmb3IgdGhlIHByb2plY3RpbGUgbW90aW9uIHNpbS5cclxuICpcclxuICogQGF1dGhvciBNYXR0aGV3IEJsYWNrbWFuIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBkb3RSYW5kb20gZnJvbSAnLi4vLi4vLi4vZG90L2pzL2RvdFJhbmRvbS5qcyc7XHJcblxyXG5jb25zdCBTdGF0VXRpbHMgPSB7XHJcblxyXG4gIHJhbmRvbUZyb21Ob3JtYWw6IGZ1bmN0aW9uKCBtZWFuOiBudW1iZXIsIHN0YW5kYXJkRGV2aWF0aW9uOiBudW1iZXIgKTogbnVtYmVyIHtcclxuICAgIGxldCB1ID0gMDtcclxuICAgIGxldCB2ID0gMDtcclxuICAgIHdoaWxlICggdSA9PT0gMCApIHtcclxuICAgICAgdSA9IGRvdFJhbmRvbS5uZXh0RG91YmxlKCk7XHJcbiAgICB9IC8vQ29udmVydGluZyBbMCwxKSB0byAoMCwxKVxyXG4gICAgd2hpbGUgKCB2ID09PSAwICkge1xyXG4gICAgICB2ID0gZG90UmFuZG9tLm5leHREb3VibGUoKTtcclxuICAgIH1cclxuICAgIHJldHVybiAoXHJcbiAgICAgIG1lYW4gK1xyXG4gICAgICBzdGFuZGFyZERldmlhdGlvbiAqXHJcbiAgICAgIE1hdGguc3FydCggLTIuMCAqIE1hdGgubG9nKCB1ICkgKSAqXHJcbiAgICAgIE1hdGguY29zKCAyLjAgKiBNYXRoLlBJICogdiApXHJcbiAgICApO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIHByb2plY3RpbGVNb3Rpb24ucmVnaXN0ZXIoXCJTdGF0VXRpbHNcIiwgU3RhdFV0aWxzKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFN0YXRVdGlsczsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsU0FBUyxNQUFNLDhCQUE4QjtBQUVwRCxNQUFNQyxTQUFTLEdBQUc7RUFFaEJDLGdCQUFnQixFQUFFLFNBQUFBLENBQVVDLElBQVksRUFBRUMsaUJBQXlCLEVBQVc7SUFDNUUsSUFBSUMsQ0FBQyxHQUFHLENBQUM7SUFDVCxJQUFJQyxDQUFDLEdBQUcsQ0FBQztJQUNULE9BQVFELENBQUMsS0FBSyxDQUFDLEVBQUc7TUFDaEJBLENBQUMsR0FBR0wsU0FBUyxDQUFDTyxVQUFVLENBQUMsQ0FBQztJQUM1QixDQUFDLENBQUM7SUFDRixPQUFRRCxDQUFDLEtBQUssQ0FBQyxFQUFHO01BQ2hCQSxDQUFDLEdBQUdOLFNBQVMsQ0FBQ08sVUFBVSxDQUFDLENBQUM7SUFDNUI7SUFDQSxPQUNFSixJQUFJLEdBQ0pDLGlCQUFpQixHQUNqQkksSUFBSSxDQUFDQyxJQUFJLENBQUUsQ0FBQyxHQUFHLEdBQUdELElBQUksQ0FBQ0UsR0FBRyxDQUFFTCxDQUFFLENBQUUsQ0FBQyxHQUNqQ0csSUFBSSxDQUFDRyxHQUFHLENBQUUsR0FBRyxHQUFHSCxJQUFJLENBQUNJLEVBQUUsR0FBR04sQ0FBRSxDQUFDO0VBRWpDO0FBQ0YsQ0FBQzs7QUFFRDs7QUFFQSxlQUFlTCxTQUFTIiwiaWdub3JlTGlzdCI6W119