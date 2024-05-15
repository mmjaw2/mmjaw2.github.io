// Copyright 2022-2024, University of Colorado Boulder

/**
 * Draws an equilateral or isosceles triangle pointing up by default.
 * triangleWidth sets the base, while triangleHeight sets the altitude.
 * The point of the triangle is drawn to be perpendicular from the halfway point of the base.
 *
 * @author Marla Schulz (PhET Interactive Simulations)
 */

import { Shape } from '../../kite/js/imports.js';
import { Path } from '../../scenery/js/imports.js';
import sceneryPhet from './sceneryPhet.js';
import optionize from '../../phet-core/js/optionize.js';
export default class TriangleNode extends Path {
  constructor(providedOptions) {
    const options = optionize()({
      pointDirection: 'up',
      triangleWidth: 15,
      triangleHeight: 13,
      stroke: 'black',
      lineWidth: 1,
      cursor: 'pointer'
    }, providedOptions);

    // Draws an equilateral or isosceles triangle
    const triangleShape = new Shape().moveTo(options.triangleWidth / 2, 0).lineTo(options.triangleWidth, options.triangleHeight).lineTo(0, options.triangleHeight).close();
    super(triangleShape, options);

    // rotate triangle according to provided options
    this.rotation = options.pointDirection === 'up' ? 0 : options.pointDirection === 'right' ? Math.PI / 2 : options.pointDirection === 'down' ? Math.PI : -Math.PI / 2;
  }
}
sceneryPhet.register('TriangleNode', TriangleNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaGFwZSIsIlBhdGgiLCJzY2VuZXJ5UGhldCIsIm9wdGlvbml6ZSIsIlRyaWFuZ2xlTm9kZSIsImNvbnN0cnVjdG9yIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInBvaW50RGlyZWN0aW9uIiwidHJpYW5nbGVXaWR0aCIsInRyaWFuZ2xlSGVpZ2h0Iiwic3Ryb2tlIiwibGluZVdpZHRoIiwiY3Vyc29yIiwidHJpYW5nbGVTaGFwZSIsIm1vdmVUbyIsImxpbmVUbyIsImNsb3NlIiwicm90YXRpb24iLCJNYXRoIiwiUEkiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlRyaWFuZ2xlTm9kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBEcmF3cyBhbiBlcXVpbGF0ZXJhbCBvciBpc29zY2VsZXMgdHJpYW5nbGUgcG9pbnRpbmcgdXAgYnkgZGVmYXVsdC5cclxuICogdHJpYW5nbGVXaWR0aCBzZXRzIHRoZSBiYXNlLCB3aGlsZSB0cmlhbmdsZUhlaWdodCBzZXRzIHRoZSBhbHRpdHVkZS5cclxuICogVGhlIHBvaW50IG9mIHRoZSB0cmlhbmdsZSBpcyBkcmF3biB0byBiZSBwZXJwZW5kaWN1bGFyIGZyb20gdGhlIGhhbGZ3YXkgcG9pbnQgb2YgdGhlIGJhc2UuXHJcbiAqXHJcbiAqIEBhdXRob3IgTWFybGEgU2NodWx6IChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSAnLi4vLi4va2l0ZS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHsgUGF0aCwgUGF0aE9wdGlvbnMgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgc2NlbmVyeVBoZXQgZnJvbSAnLi9zY2VuZXJ5UGhldC5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgcG9pbnREaXJlY3Rpb24/OiAndXAnIHwgJ2Rvd24nIHwgJ3JpZ2h0JyB8ICdsZWZ0JztcclxuICB0cmlhbmdsZVdpZHRoPzogbnVtYmVyO1xyXG4gIHRyaWFuZ2xlSGVpZ2h0PzogbnVtYmVyO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgVHJpYW5nbGVOb2RlT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgU3RyaWN0T21pdDxQYXRoT3B0aW9ucywgJ3JvdGF0aW9uJz47XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUcmlhbmdsZU5vZGUgZXh0ZW5kcyBQYXRoIHtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwcm92aWRlZE9wdGlvbnM/OiBUcmlhbmdsZU5vZGVPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8VHJpYW5nbGVOb2RlT3B0aW9ucywgU2VsZk9wdGlvbnMsIFBhdGhPcHRpb25zPigpKCB7XHJcbiAgICAgIHBvaW50RGlyZWN0aW9uOiAndXAnLFxyXG4gICAgICB0cmlhbmdsZVdpZHRoOiAxNSxcclxuICAgICAgdHJpYW5nbGVIZWlnaHQ6IDEzLFxyXG4gICAgICBzdHJva2U6ICdibGFjaycsXHJcbiAgICAgIGxpbmVXaWR0aDogMSxcclxuICAgICAgY3Vyc29yOiAncG9pbnRlcidcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIC8vIERyYXdzIGFuIGVxdWlsYXRlcmFsIG9yIGlzb3NjZWxlcyB0cmlhbmdsZVxyXG4gICAgY29uc3QgdHJpYW5nbGVTaGFwZSA9IG5ldyBTaGFwZSgpXHJcbiAgICAgIC5tb3ZlVG8oIG9wdGlvbnMudHJpYW5nbGVXaWR0aCAvIDIsIDAgKVxyXG4gICAgICAubGluZVRvKCBvcHRpb25zLnRyaWFuZ2xlV2lkdGgsIG9wdGlvbnMudHJpYW5nbGVIZWlnaHQgKVxyXG4gICAgICAubGluZVRvKCAwLCBvcHRpb25zLnRyaWFuZ2xlSGVpZ2h0IClcclxuICAgICAgLmNsb3NlKCk7XHJcblxyXG4gICAgc3VwZXIoIHRyaWFuZ2xlU2hhcGUsIG9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyByb3RhdGUgdHJpYW5nbGUgYWNjb3JkaW5nIHRvIHByb3ZpZGVkIG9wdGlvbnNcclxuICAgIHRoaXMucm90YXRpb24gPSBvcHRpb25zLnBvaW50RGlyZWN0aW9uID09PSAndXAnID8gMCA6XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5wb2ludERpcmVjdGlvbiA9PT0gJ3JpZ2h0JyA/IE1hdGguUEkgLyAyIDpcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnBvaW50RGlyZWN0aW9uID09PSAnZG93bicgPyBNYXRoLlBJIDpcclxuICAgICAgICAgICAgICAgICAgICAtTWF0aC5QSSAvIDI7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ1RyaWFuZ2xlTm9kZScsIFRyaWFuZ2xlTm9kZSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBU0EsS0FBSyxRQUFRLDBCQUEwQjtBQUNoRCxTQUFTQyxJQUFJLFFBQXFCLDZCQUE2QjtBQUMvRCxPQUFPQyxXQUFXLE1BQU0sa0JBQWtCO0FBQzFDLE9BQU9DLFNBQVMsTUFBTSxpQ0FBaUM7QUFXdkQsZUFBZSxNQUFNQyxZQUFZLFNBQVNILElBQUksQ0FBQztFQUV0Q0ksV0FBV0EsQ0FBRUMsZUFBcUMsRUFBRztJQUUxRCxNQUFNQyxPQUFPLEdBQUdKLFNBQVMsQ0FBZ0QsQ0FBQyxDQUFFO01BQzFFSyxjQUFjLEVBQUUsSUFBSTtNQUNwQkMsYUFBYSxFQUFFLEVBQUU7TUFDakJDLGNBQWMsRUFBRSxFQUFFO01BQ2xCQyxNQUFNLEVBQUUsT0FBTztNQUNmQyxTQUFTLEVBQUUsQ0FBQztNQUNaQyxNQUFNLEVBQUU7SUFDVixDQUFDLEVBQUVQLGVBQWdCLENBQUM7O0lBRXBCO0lBQ0EsTUFBTVEsYUFBYSxHQUFHLElBQUlkLEtBQUssQ0FBQyxDQUFDLENBQzlCZSxNQUFNLENBQUVSLE9BQU8sQ0FBQ0UsYUFBYSxHQUFHLENBQUMsRUFBRSxDQUFFLENBQUMsQ0FDdENPLE1BQU0sQ0FBRVQsT0FBTyxDQUFDRSxhQUFhLEVBQUVGLE9BQU8sQ0FBQ0csY0FBZSxDQUFDLENBQ3ZETSxNQUFNLENBQUUsQ0FBQyxFQUFFVCxPQUFPLENBQUNHLGNBQWUsQ0FBQyxDQUNuQ08sS0FBSyxDQUFDLENBQUM7SUFFVixLQUFLLENBQUVILGFBQWEsRUFBRVAsT0FBUSxDQUFDOztJQUUvQjtJQUNBLElBQUksQ0FBQ1csUUFBUSxHQUFHWCxPQUFPLENBQUNDLGNBQWMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxHQUNuQ0QsT0FBTyxDQUFDQyxjQUFjLEtBQUssT0FBTyxHQUFHVyxJQUFJLENBQUNDLEVBQUUsR0FBRyxDQUFDLEdBQ2hEYixPQUFPLENBQUNDLGNBQWMsS0FBSyxNQUFNLEdBQUdXLElBQUksQ0FBQ0MsRUFBRSxHQUMzQyxDQUFDRCxJQUFJLENBQUNDLEVBQUUsR0FBRyxDQUFDO0VBQzlCO0FBQ0Y7QUFFQWxCLFdBQVcsQ0FBQ21CLFFBQVEsQ0FBRSxjQUFjLEVBQUVqQixZQUFhLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=