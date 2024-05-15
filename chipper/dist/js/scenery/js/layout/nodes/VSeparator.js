// Copyright 2021-2024, University of Colorado Boulder

/**
 * A vertical line for separating items in a horizontal layout container.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { HeightSizable, scenery, Separator } from '../../imports.js';
export default class VSeparator extends HeightSizable(Separator) {
  constructor(options) {
    super();
    this.localPreferredHeightProperty.link(height => {
      if (height !== null) {
        this.y2 = height;
      }
    });
    this.mutate(options);
  }
}
scenery.register('VSeparator', VSeparator);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJIZWlnaHRTaXphYmxlIiwic2NlbmVyeSIsIlNlcGFyYXRvciIsIlZTZXBhcmF0b3IiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJsb2NhbFByZWZlcnJlZEhlaWdodFByb3BlcnR5IiwibGluayIsImhlaWdodCIsInkyIiwibXV0YXRlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJWU2VwYXJhdG9yLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgdmVydGljYWwgbGluZSBmb3Igc2VwYXJhdGluZyBpdGVtcyBpbiBhIGhvcml6b250YWwgbGF5b3V0IGNvbnRhaW5lci5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCB7IEVtcHR5U2VsZk9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IHsgSGVpZ2h0U2l6YWJsZSwgSGVpZ2h0U2l6YWJsZU9wdGlvbnMsIHNjZW5lcnksIFNlcGFyYXRvciwgU2VwYXJhdG9yT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ltcG9ydHMuanMnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IEVtcHR5U2VsZk9wdGlvbnM7XHJcbnR5cGUgUGFyZW50T3B0aW9ucyA9IEhlaWdodFNpemFibGVPcHRpb25zICYgU2VwYXJhdG9yT3B0aW9ucztcclxuZXhwb3J0IHR5cGUgVlNlcGFyYXRvck9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFBhcmVudE9wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWU2VwYXJhdG9yIGV4dGVuZHMgSGVpZ2h0U2l6YWJsZSggU2VwYXJhdG9yICkge1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvciggb3B0aW9ucz86IFZTZXBhcmF0b3JPcHRpb25zICkge1xyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICB0aGlzLmxvY2FsUHJlZmVycmVkSGVpZ2h0UHJvcGVydHkubGluayggaGVpZ2h0ID0+IHtcclxuICAgICAgaWYgKCBoZWlnaHQgIT09IG51bGwgKSB7XHJcbiAgICAgICAgdGhpcy55MiA9IGhlaWdodDtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMubXV0YXRlKCBvcHRpb25zICk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnVlNlcGFyYXRvcicsIFZTZXBhcmF0b3IgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0EsU0FBU0EsYUFBYSxFQUF3QkMsT0FBTyxFQUFFQyxTQUFTLFFBQTBCLGtCQUFrQjtBQU01RyxlQUFlLE1BQU1DLFVBQVUsU0FBU0gsYUFBYSxDQUFFRSxTQUFVLENBQUMsQ0FBQztFQUMxREUsV0FBV0EsQ0FBRUMsT0FBMkIsRUFBRztJQUNoRCxLQUFLLENBQUMsQ0FBQztJQUVQLElBQUksQ0FBQ0MsNEJBQTRCLENBQUNDLElBQUksQ0FBRUMsTUFBTSxJQUFJO01BQ2hELElBQUtBLE1BQU0sS0FBSyxJQUFJLEVBQUc7UUFDckIsSUFBSSxDQUFDQyxFQUFFLEdBQUdELE1BQU07TUFDbEI7SUFDRixDQUFFLENBQUM7SUFFSCxJQUFJLENBQUNFLE1BQU0sQ0FBRUwsT0FBUSxDQUFDO0VBQ3hCO0FBQ0Y7QUFFQUosT0FBTyxDQUFDVSxRQUFRLENBQUUsWUFBWSxFQUFFUixVQUFXLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=