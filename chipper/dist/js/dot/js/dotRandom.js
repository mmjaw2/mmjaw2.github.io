// Copyright 2021, University of Colorado Boulder

/**
 * A singleton instance that is statically seeded; for use generally.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import dot from './dot.js';
import Random from './Random.js';
const dotRandom = new Random({
  seed: _.hasIn(window, 'phet.chipper.queryParameters.randomSeed') ? window.phet.chipper.queryParameters.randomSeed : null
});
dot.register('dotRandom', dotRandom);
export default dotRandom;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkb3QiLCJSYW5kb20iLCJkb3RSYW5kb20iLCJzZWVkIiwiXyIsImhhc0luIiwid2luZG93IiwicGhldCIsImNoaXBwZXIiLCJxdWVyeVBhcmFtZXRlcnMiLCJyYW5kb21TZWVkIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJkb3RSYW5kb20uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgc2luZ2xldG9uIGluc3RhbmNlIHRoYXQgaXMgc3RhdGljYWxseSBzZWVkZWQ7IGZvciB1c2UgZ2VuZXJhbGx5LlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IGRvdCBmcm9tICcuL2RvdC5qcyc7XHJcbmltcG9ydCBSYW5kb20gZnJvbSAnLi9SYW5kb20uanMnO1xyXG5cclxuY29uc3QgZG90UmFuZG9tID0gbmV3IFJhbmRvbSgge1xyXG4gIHNlZWQ6IF8uaGFzSW4oIHdpbmRvdywgJ3BoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMucmFuZG9tU2VlZCcgKSA/IHdpbmRvdy5waGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLnJhbmRvbVNlZWQgOiBudWxsXHJcbn0gKTtcclxuXHJcbmRvdC5yZWdpc3RlciggJ2RvdFJhbmRvbScsIGRvdFJhbmRvbSApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZG90UmFuZG9tOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLEdBQUcsTUFBTSxVQUFVO0FBQzFCLE9BQU9DLE1BQU0sTUFBTSxhQUFhO0FBRWhDLE1BQU1DLFNBQVMsR0FBRyxJQUFJRCxNQUFNLENBQUU7RUFDNUJFLElBQUksRUFBRUMsQ0FBQyxDQUFDQyxLQUFLLENBQUVDLE1BQU0sRUFBRSx5Q0FBMEMsQ0FBQyxHQUFHQSxNQUFNLENBQUNDLElBQUksQ0FBQ0MsT0FBTyxDQUFDQyxlQUFlLENBQUNDLFVBQVUsR0FBRztBQUN4SCxDQUFFLENBQUM7QUFFSFYsR0FBRyxDQUFDVyxRQUFRLENBQUUsV0FBVyxFQUFFVCxTQUFVLENBQUM7QUFFdEMsZUFBZUEsU0FBUyIsImlnbm9yZUxpc3QiOltdfQ==