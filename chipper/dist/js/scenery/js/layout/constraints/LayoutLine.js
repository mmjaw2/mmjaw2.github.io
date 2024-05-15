// Copyright 2022-2024, University of Colorado Boulder

/**
 * An internal representation of a row/column for grid/flow handling in constraints (set up for pooling)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { scenery } from '../../imports.js';
export default class LayoutLine {
  // A range of sizes along the secondary axis that our cells could take up
  // (scenery-internal)

  // A range of positions where our align:origin content could go out to (the farthest +/- from 0 that our align:origin
  // nodes go).
  // (scenery-internal)

  // The line's size (along the secondary axis)
  // (scenery-internal)

  // The line's position (along the primary axis)
  // (scenery-internal)

  initializeLayoutLine() {
    this.min = 0;
    this.max = Number.POSITIVE_INFINITY;
    this.minOrigin = Number.POSITIVE_INFINITY;
    this.maxOrigin = Number.NEGATIVE_INFINITY;
    this.size = 0;
    this.position = 0;
  }

  /**
   * Whether there was origin-based content in the layout
   * (scenery-internal)
   */
  hasOrigin() {
    return isFinite(this.minOrigin) && isFinite(this.maxOrigin);
  }
}
scenery.register('LayoutLine', LayoutLine);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzY2VuZXJ5IiwiTGF5b3V0TGluZSIsImluaXRpYWxpemVMYXlvdXRMaW5lIiwibWluIiwibWF4IiwiTnVtYmVyIiwiUE9TSVRJVkVfSU5GSU5JVFkiLCJtaW5PcmlnaW4iLCJtYXhPcmlnaW4iLCJORUdBVElWRV9JTkZJTklUWSIsInNpemUiLCJwb3NpdGlvbiIsImhhc09yaWdpbiIsImlzRmluaXRlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJMYXlvdXRMaW5lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEFuIGludGVybmFsIHJlcHJlc2VudGF0aW9uIG9mIGEgcm93L2NvbHVtbiBmb3IgZ3JpZC9mbG93IGhhbmRsaW5nIGluIGNvbnN0cmFpbnRzIChzZXQgdXAgZm9yIHBvb2xpbmcpXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgeyBzY2VuZXJ5IH0gZnJvbSAnLi4vLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMYXlvdXRMaW5lIHtcclxuXHJcbiAgLy8gQSByYW5nZSBvZiBzaXplcyBhbG9uZyB0aGUgc2Vjb25kYXJ5IGF4aXMgdGhhdCBvdXIgY2VsbHMgY291bGQgdGFrZSB1cFxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBtaW4hOiBudW1iZXI7XHJcbiAgcHVibGljIG1heCE6IG51bWJlcjtcclxuXHJcbiAgLy8gQSByYW5nZSBvZiBwb3NpdGlvbnMgd2hlcmUgb3VyIGFsaWduOm9yaWdpbiBjb250ZW50IGNvdWxkIGdvIG91dCB0byAodGhlIGZhcnRoZXN0ICsvLSBmcm9tIDAgdGhhdCBvdXIgYWxpZ246b3JpZ2luXHJcbiAgLy8gbm9kZXMgZ28pLlxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBtaW5PcmlnaW4hOiBudW1iZXI7XHJcbiAgcHVibGljIG1heE9yaWdpbiE6IG51bWJlcjtcclxuXHJcbiAgLy8gVGhlIGxpbmUncyBzaXplIChhbG9uZyB0aGUgc2Vjb25kYXJ5IGF4aXMpXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIHNpemUhOiBudW1iZXI7XHJcblxyXG4gIC8vIFRoZSBsaW5lJ3MgcG9zaXRpb24gKGFsb25nIHRoZSBwcmltYXJ5IGF4aXMpXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIHBvc2l0aW9uITogbnVtYmVyO1xyXG5cclxuICBwcm90ZWN0ZWQgaW5pdGlhbGl6ZUxheW91dExpbmUoKTogdm9pZCB7XHJcbiAgICB0aGlzLm1pbiA9IDA7XHJcbiAgICB0aGlzLm1heCA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcclxuICAgIHRoaXMubWluT3JpZ2luID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xyXG4gICAgdGhpcy5tYXhPcmlnaW4gPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XHJcbiAgICB0aGlzLnNpemUgPSAwO1xyXG4gICAgdGhpcy5wb3NpdGlvbiA9IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIHRoZXJlIHdhcyBvcmlnaW4tYmFzZWQgY29udGVudCBpbiB0aGUgbGF5b3V0XHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGhhc09yaWdpbigpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBpc0Zpbml0ZSggdGhpcy5taW5PcmlnaW4gKSAmJiBpc0Zpbml0ZSggdGhpcy5tYXhPcmlnaW4gKTtcclxuICB9XHJcbn1cclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdMYXlvdXRMaW5lJywgTGF5b3V0TGluZSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSxPQUFPLFFBQVEsa0JBQWtCO0FBRTFDLGVBQWUsTUFBTUMsVUFBVSxDQUFDO0VBRTlCO0VBQ0E7O0VBSUE7RUFDQTtFQUNBOztFQUlBO0VBQ0E7O0VBR0E7RUFDQTs7RUFHVUMsb0JBQW9CQSxDQUFBLEVBQVM7SUFDckMsSUFBSSxDQUFDQyxHQUFHLEdBQUcsQ0FBQztJQUNaLElBQUksQ0FBQ0MsR0FBRyxHQUFHQyxNQUFNLENBQUNDLGlCQUFpQjtJQUNuQyxJQUFJLENBQUNDLFNBQVMsR0FBR0YsTUFBTSxDQUFDQyxpQkFBaUI7SUFDekMsSUFBSSxDQUFDRSxTQUFTLEdBQUdILE1BQU0sQ0FBQ0ksaUJBQWlCO0lBQ3pDLElBQUksQ0FBQ0MsSUFBSSxHQUFHLENBQUM7SUFDYixJQUFJLENBQUNDLFFBQVEsR0FBRyxDQUFDO0VBQ25COztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0VBQ1NDLFNBQVNBLENBQUEsRUFBWTtJQUMxQixPQUFPQyxRQUFRLENBQUUsSUFBSSxDQUFDTixTQUFVLENBQUMsSUFBSU0sUUFBUSxDQUFFLElBQUksQ0FBQ0wsU0FBVSxDQUFDO0VBQ2pFO0FBQ0Y7QUFFQVIsT0FBTyxDQUFDYyxRQUFRLENBQUUsWUFBWSxFQUFFYixVQUFXLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=