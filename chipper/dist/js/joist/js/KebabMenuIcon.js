// Copyright 2018-2022, University of Colorado Boulder

/**
 * The "kebab" menu icon, 3 dots stacked vertically that look like a shish kebab.
 * See https://github.com/phetsims/joist/issues/544
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import { Shape } from '../../kite/js/imports.js';
import { Path } from '../../scenery/js/imports.js';
import joist from './joist.js';

// constants
const CIRCLE_RADIUS = 2.5;
class KebabMenuIcon extends Path {
  constructor(options) {
    const shape = new Shape();
    for (let i = 0; i < 3; i++) {
      shape.circle(0, i * 3.543 * CIRCLE_RADIUS, CIRCLE_RADIUS); // args are: x, y, radius
    }
    super(shape, options);
  }
}
joist.register('KebabMenuIcon', KebabMenuIcon);
export default KebabMenuIcon;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaGFwZSIsIlBhdGgiLCJqb2lzdCIsIkNJUkNMRV9SQURJVVMiLCJLZWJhYk1lbnVJY29uIiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwic2hhcGUiLCJpIiwiY2lyY2xlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJLZWJhYk1lbnVJY29uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRoZSBcImtlYmFiXCIgbWVudSBpY29uLCAzIGRvdHMgc3RhY2tlZCB2ZXJ0aWNhbGx5IHRoYXQgbG9vayBsaWtlIGEgc2hpc2gga2ViYWIuXHJcbiAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzU0NFxyXG4gKlxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKi9cclxuXHJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSAnLi4vLi4va2l0ZS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHsgUGF0aCwgUGF0aE9wdGlvbnMgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgam9pc3QgZnJvbSAnLi9qb2lzdC5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgQ0lSQ0xFX1JBRElVUyA9IDIuNTtcclxuXHJcbmNsYXNzIEtlYmFiTWVudUljb24gZXh0ZW5kcyBQYXRoIHtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBvcHRpb25zPzogUGF0aE9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgc2hhcGUgPSBuZXcgU2hhcGUoKTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IDM7IGkrKyApIHtcclxuICAgICAgc2hhcGUuY2lyY2xlKCAwLCBpICogMy41NDMgKiBDSVJDTEVfUkFESVVTLCBDSVJDTEVfUkFESVVTICk7IC8vIGFyZ3MgYXJlOiB4LCB5LCByYWRpdXNcclxuICAgIH1cclxuXHJcbiAgICBzdXBlciggc2hhcGUsIG9wdGlvbnMgKTtcclxuICB9XHJcbn1cclxuXHJcbmpvaXN0LnJlZ2lzdGVyKCAnS2ViYWJNZW51SWNvbicsIEtlYmFiTWVudUljb24gKTtcclxuZXhwb3J0IGRlZmF1bHQgS2ViYWJNZW51SWNvbjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSxLQUFLLFFBQVEsMEJBQTBCO0FBQ2hELFNBQVNDLElBQUksUUFBcUIsNkJBQTZCO0FBQy9ELE9BQU9DLEtBQUssTUFBTSxZQUFZOztBQUU5QjtBQUNBLE1BQU1DLGFBQWEsR0FBRyxHQUFHO0FBRXpCLE1BQU1DLGFBQWEsU0FBU0gsSUFBSSxDQUFDO0VBRXhCSSxXQUFXQSxDQUFFQyxPQUFxQixFQUFHO0lBRTFDLE1BQU1DLEtBQUssR0FBRyxJQUFJUCxLQUFLLENBQUMsQ0FBQztJQUN6QixLQUFNLElBQUlRLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsRUFBRSxFQUFHO01BQzVCRCxLQUFLLENBQUNFLE1BQU0sQ0FBRSxDQUFDLEVBQUVELENBQUMsR0FBRyxLQUFLLEdBQUdMLGFBQWEsRUFBRUEsYUFBYyxDQUFDLENBQUMsQ0FBQztJQUMvRDtJQUVBLEtBQUssQ0FBRUksS0FBSyxFQUFFRCxPQUFRLENBQUM7RUFDekI7QUFDRjtBQUVBSixLQUFLLENBQUNRLFFBQVEsQ0FBRSxlQUFlLEVBQUVOLGFBQWMsQ0FBQztBQUNoRCxlQUFlQSxhQUFhIiwiaWdub3JlTGlzdCI6W119