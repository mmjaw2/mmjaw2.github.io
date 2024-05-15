// Copyright 2020-2022, University of Colorado Boulder

/**
 * TimeSpeed is an enumeration of time speeds. These are supported by TimeControlNode, when it includes speed controls.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Enumeration from '../../phet-core/js/Enumeration.js';
import EnumerationValue from '../../phet-core/js/EnumerationValue.js';
import sceneryPhet from './sceneryPhet.js';
export default class TimeSpeed extends EnumerationValue {
  static FAST = new TimeSpeed();
  static NORMAL = new TimeSpeed();
  static SLOW = new TimeSpeed();

  // Gets a list of keys, values and mapping between them. For use in EnumerationProperty and PhET-iO
  static enumeration = new Enumeration(TimeSpeed);
}
sceneryPhet.register('TimeSpeed', TimeSpeed);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFbnVtZXJhdGlvbiIsIkVudW1lcmF0aW9uVmFsdWUiLCJzY2VuZXJ5UGhldCIsIlRpbWVTcGVlZCIsIkZBU1QiLCJOT1JNQUwiLCJTTE9XIiwiZW51bWVyYXRpb24iLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlRpbWVTcGVlZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDIyLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUaW1lU3BlZWQgaXMgYW4gZW51bWVyYXRpb24gb2YgdGltZSBzcGVlZHMuIFRoZXNlIGFyZSBzdXBwb3J0ZWQgYnkgVGltZUNvbnRyb2xOb2RlLCB3aGVuIGl0IGluY2x1ZGVzIHNwZWVkIGNvbnRyb2xzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgRW51bWVyYXRpb24gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL0VudW1lcmF0aW9uLmpzJztcclxuaW1wb3J0IEVudW1lcmF0aW9uVmFsdWUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL0VudW1lcmF0aW9uVmFsdWUuanMnO1xyXG5pbXBvcnQgc2NlbmVyeVBoZXQgZnJvbSAnLi9zY2VuZXJ5UGhldC5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUaW1lU3BlZWQgZXh0ZW5kcyBFbnVtZXJhdGlvblZhbHVlIHtcclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBGQVNUID0gbmV3IFRpbWVTcGVlZCgpO1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgTk9STUFMID0gbmV3IFRpbWVTcGVlZCgpO1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgU0xPVyA9IG5ldyBUaW1lU3BlZWQoKTtcclxuXHJcbiAgLy8gR2V0cyBhIGxpc3Qgb2Yga2V5cywgdmFsdWVzIGFuZCBtYXBwaW5nIGJldHdlZW4gdGhlbS4gRm9yIHVzZSBpbiBFbnVtZXJhdGlvblByb3BlcnR5IGFuZCBQaEVULWlPXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBlbnVtZXJhdGlvbiA9IG5ldyBFbnVtZXJhdGlvbiggVGltZVNwZWVkICk7XHJcbn1cclxuXHJcbnNjZW5lcnlQaGV0LnJlZ2lzdGVyKCAnVGltZVNwZWVkJywgVGltZVNwZWVkICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsV0FBVyxNQUFNLG1DQUFtQztBQUMzRCxPQUFPQyxnQkFBZ0IsTUFBTSx3Q0FBd0M7QUFDckUsT0FBT0MsV0FBVyxNQUFNLGtCQUFrQjtBQUUxQyxlQUFlLE1BQU1DLFNBQVMsU0FBU0YsZ0JBQWdCLENBQUM7RUFFdEQsT0FBdUJHLElBQUksR0FBRyxJQUFJRCxTQUFTLENBQUMsQ0FBQztFQUM3QyxPQUF1QkUsTUFBTSxHQUFHLElBQUlGLFNBQVMsQ0FBQyxDQUFDO0VBQy9DLE9BQXVCRyxJQUFJLEdBQUcsSUFBSUgsU0FBUyxDQUFDLENBQUM7O0VBRTdDO0VBQ0EsT0FBdUJJLFdBQVcsR0FBRyxJQUFJUCxXQUFXLENBQUVHLFNBQVUsQ0FBQztBQUNuRTtBQUVBRCxXQUFXLENBQUNNLFFBQVEsQ0FBRSxXQUFXLEVBQUVMLFNBQVUsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==