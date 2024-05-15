// Copyright 2019-2023, University of Colorado Boulder

/**
 * View for an arrow that is curved. Used in various other views throughout the sim.
 *
 * A solution using `SCENERY-PHET/CurvedArrowShape` was investigated, but it was inappropriate for use in this sim.
 * See https://github.com/phetsims/vector-addition/blob/main/doc/images/CurvedArrowNode-notes.png for an explanation.
 *
 * ## Other functionality:
 *  - The Arrowhead turns invisible when the angle becomes too small (i.e. the triangle is larger than the arc)
 *  - The arrow is assumed to start at 0 rad.
 *  - Contains methods to change the radius
 *  - Contains methods to change the angle
 *
 * @author Brandon Li
 */

import Vector2 from '../../../../dot/js/Vector2.js';
import { Shape } from '../../../../kite/js/imports.js';
import { Color, Node, Path } from '../../../../scenery/js/imports.js';
import vectorAddition from '../../vectorAddition.js';
const COLOR = Color.BLACK;
const ARROWHEAD_WIDTH = 8; // the arrowhead width (before rotation)
const ARROWHEAD_HEIGHT = 6; // the arrowhead height (before rotation)

export default class CurvedArrowNode extends Node {
  // function that updates this node when the angle / radius changes

  /**
   * @param radius - the radius of curved arrow.
   * @param angle - the end angle (in radians) of the curved arrow. The arrow is assumed to start at 0 radians.
   */
  constructor(radius, angle) {
    assert && assert(radius > 0, `invalid radius: ${radius}`);

    // Create the path for the arc. Set to an arbitrary shape for now. To be updated later.
    const arcPath = new Path(new Shape(), {
      stroke: COLOR,
      lineWidth: 1.2
    });

    // Create the arrowhead - a triangle. The Shape is upright and the midpoint of its base as (0, 0).
    // The Path will be translated/rotated later.
    const arrowheadShape = new Shape();
    arrowheadShape.moveTo(0, 0).lineTo(-ARROWHEAD_WIDTH / 2, 0).lineTo(ARROWHEAD_WIDTH / 2, 0).lineTo(0, -ARROWHEAD_HEIGHT).lineTo(-ARROWHEAD_WIDTH / 2, 0).close();
    const arrowheadPath = new Path(arrowheadShape, {
      fill: COLOR
    });
    super({
      children: [arcPath, arrowheadPath]
    });
    this.radius = radius;
    this.angle = angle;
    this.updateCurvedArrowNode = () => {
      //----------------------------------------------------------------------------------------
      // See https://github.com/phetsims/vector-addition/blob/main/doc/images/angle-calculations.png
      // for an annotated drawing of how the subtended angle and the corrected angle are calculated
      //----------------------------------------------------------------------------------------

      // The arrowhead subtended angle is defined as the angle between the vector from the center to the tip of the
      // arrow and the vector of the center to first point the arc and the triangle intersect
      const arrowheadSubtendedAngle = Math.asin(ARROWHEAD_HEIGHT / this.radius);

      // Flag that indicates if the arc is anticlockwise (measured from positive x-axis) or clockwise.
      const isAnticlockwise = this.angle >= 0;

      // The corrected angle is the angle that is between the vector that goes from the center to the first point the
      // arc and the triangle intersect and the vector along the baseline (x-axis). This is used instead to create a
      // more accurate angle excluding the size of the triangle. Again, look at the drawing above.
      const correctedAngle = isAnticlockwise ? this.angle - arrowheadSubtendedAngle : this.angle + arrowheadSubtendedAngle;

      // Change the arrowhead visibility to false when the angle is too small relative to the subtended angle and true
      // otherwise
      arrowheadPath.visible = Math.abs(this.angle) > arrowheadSubtendedAngle;

      // Create the arc shape
      const arcShape = new Shape().arcPoint(Vector2.ZERO, this.radius, 0, arrowheadPath.visible ? -correctedAngle : -this.angle, isAnticlockwise);
      arcPath.setShape(arcShape);
      if (arrowheadPath.visible) {
        // Adjust the position and angle of arrowhead. Rotate the arrowhead from the tip into the correct position
        // from the original angle
        arrowheadPath.setRotation(isAnticlockwise ? -this.angle : -this.angle + Math.PI);

        // Translate the tip of the arrowhead to the tip of the arc.
        arrowheadPath.setTranslation(Math.cos(arrowheadPath.visible ? correctedAngle : this.angle) * this.radius, -Math.sin(arrowheadPath.visible ? correctedAngle : this.angle) * this.radius);
      }
    };
    this.updateCurvedArrowNode();
  }

  /**
   * Sets the angle of the arc.
   * @param angle - the end angle (in radians) of the curved arrow. The arrow is assumed to start at 0 radians.
   */
  setAngle(angle) {
    this.angle = angle;
    this.updateCurvedArrowNode();
  }

  /**
   * Sets the radius of the arc.
   * @param radius - the radius of curved arrow.
   */
  setRadius(radius) {
    this.radius = radius;
    this.updateCurvedArrowNode();
  }
  getRadius() {
    return this.radius;
  }
}
vectorAddition.register('CurvedArrowNode', CurvedArrowNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJWZWN0b3IyIiwiU2hhcGUiLCJDb2xvciIsIk5vZGUiLCJQYXRoIiwidmVjdG9yQWRkaXRpb24iLCJDT0xPUiIsIkJMQUNLIiwiQVJST1dIRUFEX1dJRFRIIiwiQVJST1dIRUFEX0hFSUdIVCIsIkN1cnZlZEFycm93Tm9kZSIsImNvbnN0cnVjdG9yIiwicmFkaXVzIiwiYW5nbGUiLCJhc3NlcnQiLCJhcmNQYXRoIiwic3Ryb2tlIiwibGluZVdpZHRoIiwiYXJyb3doZWFkU2hhcGUiLCJtb3ZlVG8iLCJsaW5lVG8iLCJjbG9zZSIsImFycm93aGVhZFBhdGgiLCJmaWxsIiwiY2hpbGRyZW4iLCJ1cGRhdGVDdXJ2ZWRBcnJvd05vZGUiLCJhcnJvd2hlYWRTdWJ0ZW5kZWRBbmdsZSIsIk1hdGgiLCJhc2luIiwiaXNBbnRpY2xvY2t3aXNlIiwiY29ycmVjdGVkQW5nbGUiLCJ2aXNpYmxlIiwiYWJzIiwiYXJjU2hhcGUiLCJhcmNQb2ludCIsIlpFUk8iLCJzZXRTaGFwZSIsInNldFJvdGF0aW9uIiwiUEkiLCJzZXRUcmFuc2xhdGlvbiIsImNvcyIsInNpbiIsInNldEFuZ2xlIiwic2V0UmFkaXVzIiwiZ2V0UmFkaXVzIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJDdXJ2ZWRBcnJvd05vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVmlldyBmb3IgYW4gYXJyb3cgdGhhdCBpcyBjdXJ2ZWQuIFVzZWQgaW4gdmFyaW91cyBvdGhlciB2aWV3cyB0aHJvdWdob3V0IHRoZSBzaW0uXHJcbiAqXHJcbiAqIEEgc29sdXRpb24gdXNpbmcgYFNDRU5FUlktUEhFVC9DdXJ2ZWRBcnJvd1NoYXBlYCB3YXMgaW52ZXN0aWdhdGVkLCBidXQgaXQgd2FzIGluYXBwcm9wcmlhdGUgZm9yIHVzZSBpbiB0aGlzIHNpbS5cclxuICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy92ZWN0b3ItYWRkaXRpb24vYmxvYi9tYWluL2RvYy9pbWFnZXMvQ3VydmVkQXJyb3dOb2RlLW5vdGVzLnBuZyBmb3IgYW4gZXhwbGFuYXRpb24uXHJcbiAqXHJcbiAqICMjIE90aGVyIGZ1bmN0aW9uYWxpdHk6XHJcbiAqICAtIFRoZSBBcnJvd2hlYWQgdHVybnMgaW52aXNpYmxlIHdoZW4gdGhlIGFuZ2xlIGJlY29tZXMgdG9vIHNtYWxsIChpLmUuIHRoZSB0cmlhbmdsZSBpcyBsYXJnZXIgdGhhbiB0aGUgYXJjKVxyXG4gKiAgLSBUaGUgYXJyb3cgaXMgYXNzdW1lZCB0byBzdGFydCBhdCAwIHJhZC5cclxuICogIC0gQ29udGFpbnMgbWV0aG9kcyB0byBjaGFuZ2UgdGhlIHJhZGl1c1xyXG4gKiAgLSBDb250YWlucyBtZXRob2RzIHRvIGNoYW5nZSB0aGUgYW5nbGVcclxuICpcclxuICogQGF1dGhvciBCcmFuZG9uIExpXHJcbiAqL1xyXG5cclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gJy4uLy4uLy4uLy4uL2tpdGUvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCB7IENvbG9yLCBOb2RlLCBQYXRoIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHZlY3RvckFkZGl0aW9uIGZyb20gJy4uLy4uL3ZlY3RvckFkZGl0aW9uLmpzJztcclxuXHJcbmNvbnN0IENPTE9SID0gQ29sb3IuQkxBQ0s7XHJcbmNvbnN0IEFSUk9XSEVBRF9XSURUSCA9IDg7ICAvLyB0aGUgYXJyb3doZWFkIHdpZHRoIChiZWZvcmUgcm90YXRpb24pXHJcbmNvbnN0IEFSUk9XSEVBRF9IRUlHSFQgPSA2OyAvLyB0aGUgYXJyb3doZWFkIGhlaWdodCAoYmVmb3JlIHJvdGF0aW9uKVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3VydmVkQXJyb3dOb2RlIGV4dGVuZHMgTm9kZSB7XHJcblxyXG4gIHByaXZhdGUgcmFkaXVzOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBhbmdsZTogbnVtYmVyO1xyXG5cclxuICAvLyBmdW5jdGlvbiB0aGF0IHVwZGF0ZXMgdGhpcyBub2RlIHdoZW4gdGhlIGFuZ2xlIC8gcmFkaXVzIGNoYW5nZXNcclxuICBwcml2YXRlIHJlYWRvbmx5IHVwZGF0ZUN1cnZlZEFycm93Tm9kZTogKCkgPT4gdm9pZDtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHJhZGl1cyAtIHRoZSByYWRpdXMgb2YgY3VydmVkIGFycm93LlxyXG4gICAqIEBwYXJhbSBhbmdsZSAtIHRoZSBlbmQgYW5nbGUgKGluIHJhZGlhbnMpIG9mIHRoZSBjdXJ2ZWQgYXJyb3cuIFRoZSBhcnJvdyBpcyBhc3N1bWVkIHRvIHN0YXJ0IGF0IDAgcmFkaWFucy5cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHJhZGl1czogbnVtYmVyLCBhbmdsZTogbnVtYmVyICkge1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHJhZGl1cyA+IDAsIGBpbnZhbGlkIHJhZGl1czogJHtyYWRpdXN9YCApO1xyXG5cclxuICAgIC8vIENyZWF0ZSB0aGUgcGF0aCBmb3IgdGhlIGFyYy4gU2V0IHRvIGFuIGFyYml0cmFyeSBzaGFwZSBmb3Igbm93LiBUbyBiZSB1cGRhdGVkIGxhdGVyLlxyXG4gICAgY29uc3QgYXJjUGF0aCA9IG5ldyBQYXRoKCBuZXcgU2hhcGUoKSwge1xyXG4gICAgICBzdHJva2U6IENPTE9SLFxyXG4gICAgICBsaW5lV2lkdGg6IDEuMlxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIENyZWF0ZSB0aGUgYXJyb3doZWFkIC0gYSB0cmlhbmdsZS4gVGhlIFNoYXBlIGlzIHVwcmlnaHQgYW5kIHRoZSBtaWRwb2ludCBvZiBpdHMgYmFzZSBhcyAoMCwgMCkuXHJcbiAgICAvLyBUaGUgUGF0aCB3aWxsIGJlIHRyYW5zbGF0ZWQvcm90YXRlZCBsYXRlci5cclxuICAgIGNvbnN0IGFycm93aGVhZFNoYXBlID0gbmV3IFNoYXBlKCk7XHJcbiAgICBhcnJvd2hlYWRTaGFwZS5tb3ZlVG8oIDAsIDAgKVxyXG4gICAgICAubGluZVRvKCAtQVJST1dIRUFEX1dJRFRIIC8gMiwgMCApXHJcbiAgICAgIC5saW5lVG8oIEFSUk9XSEVBRF9XSURUSCAvIDIsIDAgKVxyXG4gICAgICAubGluZVRvKCAwLCAtQVJST1dIRUFEX0hFSUdIVCApXHJcbiAgICAgIC5saW5lVG8oIC1BUlJPV0hFQURfV0lEVEggLyAyLCAwIClcclxuICAgICAgLmNsb3NlKCk7XHJcbiAgICBjb25zdCBhcnJvd2hlYWRQYXRoID0gbmV3IFBhdGgoIGFycm93aGVhZFNoYXBlLCB7XHJcbiAgICAgIGZpbGw6IENPTE9SXHJcbiAgICB9ICk7XHJcblxyXG4gICAgc3VwZXIoIHtcclxuICAgICAgY2hpbGRyZW46IFsgYXJjUGF0aCwgYXJyb3doZWFkUGF0aCBdXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5yYWRpdXMgPSByYWRpdXM7XHJcbiAgICB0aGlzLmFuZ2xlID0gYW5nbGU7XHJcblxyXG4gICAgdGhpcy51cGRhdGVDdXJ2ZWRBcnJvd05vZGUgPSAoKSA9PiB7XHJcblxyXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy92ZWN0b3ItYWRkaXRpb24vYmxvYi9tYWluL2RvYy9pbWFnZXMvYW5nbGUtY2FsY3VsYXRpb25zLnBuZ1xyXG4gICAgICAvLyBmb3IgYW4gYW5ub3RhdGVkIGRyYXdpbmcgb2YgaG93IHRoZSBzdWJ0ZW5kZWQgYW5nbGUgYW5kIHRoZSBjb3JyZWN0ZWQgYW5nbGUgYXJlIGNhbGN1bGF0ZWRcclxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAvLyBUaGUgYXJyb3doZWFkIHN1YnRlbmRlZCBhbmdsZSBpcyBkZWZpbmVkIGFzIHRoZSBhbmdsZSBiZXR3ZWVuIHRoZSB2ZWN0b3IgZnJvbSB0aGUgY2VudGVyIHRvIHRoZSB0aXAgb2YgdGhlXHJcbiAgICAgIC8vIGFycm93IGFuZCB0aGUgdmVjdG9yIG9mIHRoZSBjZW50ZXIgdG8gZmlyc3QgcG9pbnQgdGhlIGFyYyBhbmQgdGhlIHRyaWFuZ2xlIGludGVyc2VjdFxyXG4gICAgICBjb25zdCBhcnJvd2hlYWRTdWJ0ZW5kZWRBbmdsZSA9IE1hdGguYXNpbiggQVJST1dIRUFEX0hFSUdIVCAvIHRoaXMucmFkaXVzICk7XHJcblxyXG4gICAgICAvLyBGbGFnIHRoYXQgaW5kaWNhdGVzIGlmIHRoZSBhcmMgaXMgYW50aWNsb2Nrd2lzZSAobWVhc3VyZWQgZnJvbSBwb3NpdGl2ZSB4LWF4aXMpIG9yIGNsb2Nrd2lzZS5cclxuICAgICAgY29uc3QgaXNBbnRpY2xvY2t3aXNlID0gdGhpcy5hbmdsZSA+PSAwO1xyXG5cclxuICAgICAgLy8gVGhlIGNvcnJlY3RlZCBhbmdsZSBpcyB0aGUgYW5nbGUgdGhhdCBpcyBiZXR3ZWVuIHRoZSB2ZWN0b3IgdGhhdCBnb2VzIGZyb20gdGhlIGNlbnRlciB0byB0aGUgZmlyc3QgcG9pbnQgdGhlXHJcbiAgICAgIC8vIGFyYyBhbmQgdGhlIHRyaWFuZ2xlIGludGVyc2VjdCBhbmQgdGhlIHZlY3RvciBhbG9uZyB0aGUgYmFzZWxpbmUgKHgtYXhpcykuIFRoaXMgaXMgdXNlZCBpbnN0ZWFkIHRvIGNyZWF0ZSBhXHJcbiAgICAgIC8vIG1vcmUgYWNjdXJhdGUgYW5nbGUgZXhjbHVkaW5nIHRoZSBzaXplIG9mIHRoZSB0cmlhbmdsZS4gQWdhaW4sIGxvb2sgYXQgdGhlIGRyYXdpbmcgYWJvdmUuXHJcbiAgICAgIGNvbnN0IGNvcnJlY3RlZEFuZ2xlID0gaXNBbnRpY2xvY2t3aXNlID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFuZ2xlIC0gYXJyb3doZWFkU3VidGVuZGVkQW5nbGUgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYW5nbGUgKyBhcnJvd2hlYWRTdWJ0ZW5kZWRBbmdsZTtcclxuXHJcbiAgICAgIC8vIENoYW5nZSB0aGUgYXJyb3doZWFkIHZpc2liaWxpdHkgdG8gZmFsc2Ugd2hlbiB0aGUgYW5nbGUgaXMgdG9vIHNtYWxsIHJlbGF0aXZlIHRvIHRoZSBzdWJ0ZW5kZWQgYW5nbGUgYW5kIHRydWVcclxuICAgICAgLy8gb3RoZXJ3aXNlXHJcbiAgICAgIGFycm93aGVhZFBhdGgudmlzaWJsZSA9IE1hdGguYWJzKCB0aGlzLmFuZ2xlICkgPiBhcnJvd2hlYWRTdWJ0ZW5kZWRBbmdsZTtcclxuXHJcbiAgICAgIC8vIENyZWF0ZSB0aGUgYXJjIHNoYXBlXHJcbiAgICAgIGNvbnN0IGFyY1NoYXBlID0gbmV3IFNoYXBlKCkuYXJjUG9pbnQoIFZlY3RvcjIuWkVSTyxcclxuICAgICAgICB0aGlzLnJhZGl1cyxcclxuICAgICAgICAwLFxyXG4gICAgICAgIGFycm93aGVhZFBhdGgudmlzaWJsZSA/IC1jb3JyZWN0ZWRBbmdsZSA6IC10aGlzLmFuZ2xlLCBpc0FudGljbG9ja3dpc2UgKTtcclxuICAgICAgYXJjUGF0aC5zZXRTaGFwZSggYXJjU2hhcGUgKTtcclxuXHJcbiAgICAgIGlmICggYXJyb3doZWFkUGF0aC52aXNpYmxlICkge1xyXG5cclxuICAgICAgICAvLyBBZGp1c3QgdGhlIHBvc2l0aW9uIGFuZCBhbmdsZSBvZiBhcnJvd2hlYWQuIFJvdGF0ZSB0aGUgYXJyb3doZWFkIGZyb20gdGhlIHRpcCBpbnRvIHRoZSBjb3JyZWN0IHBvc2l0aW9uXHJcbiAgICAgICAgLy8gZnJvbSB0aGUgb3JpZ2luYWwgYW5nbGVcclxuICAgICAgICBhcnJvd2hlYWRQYXRoLnNldFJvdGF0aW9uKCBpc0FudGljbG9ja3dpc2UgPyAtdGhpcy5hbmdsZSA6IC10aGlzLmFuZ2xlICsgTWF0aC5QSSApO1xyXG5cclxuICAgICAgICAvLyBUcmFuc2xhdGUgdGhlIHRpcCBvZiB0aGUgYXJyb3doZWFkIHRvIHRoZSB0aXAgb2YgdGhlIGFyYy5cclxuICAgICAgICBhcnJvd2hlYWRQYXRoLnNldFRyYW5zbGF0aW9uKFxyXG4gICAgICAgICAgTWF0aC5jb3MoIGFycm93aGVhZFBhdGgudmlzaWJsZSA/IGNvcnJlY3RlZEFuZ2xlIDogdGhpcy5hbmdsZSApICogdGhpcy5yYWRpdXMsXHJcbiAgICAgICAgICAtTWF0aC5zaW4oIGFycm93aGVhZFBhdGgudmlzaWJsZSA/IGNvcnJlY3RlZEFuZ2xlIDogdGhpcy5hbmdsZSApICogdGhpcy5yYWRpdXNcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhpcy51cGRhdGVDdXJ2ZWRBcnJvd05vZGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGFuZ2xlIG9mIHRoZSBhcmMuXHJcbiAgICogQHBhcmFtIGFuZ2xlIC0gdGhlIGVuZCBhbmdsZSAoaW4gcmFkaWFucykgb2YgdGhlIGN1cnZlZCBhcnJvdy4gVGhlIGFycm93IGlzIGFzc3VtZWQgdG8gc3RhcnQgYXQgMCByYWRpYW5zLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRBbmdsZSggYW5nbGU6IG51bWJlciApOiB2b2lkIHtcclxuICAgIHRoaXMuYW5nbGUgPSBhbmdsZTtcclxuICAgIHRoaXMudXBkYXRlQ3VydmVkQXJyb3dOb2RlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSByYWRpdXMgb2YgdGhlIGFyYy5cclxuICAgKiBAcGFyYW0gcmFkaXVzIC0gdGhlIHJhZGl1cyBvZiBjdXJ2ZWQgYXJyb3cuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFJhZGl1cyggcmFkaXVzOiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICB0aGlzLnJhZGl1cyA9IHJhZGl1cztcclxuICAgIHRoaXMudXBkYXRlQ3VydmVkQXJyb3dOb2RlKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0UmFkaXVzKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5yYWRpdXM7XHJcbiAgfVxyXG59XHJcblxyXG52ZWN0b3JBZGRpdGlvbi5yZWdpc3RlciggJ0N1cnZlZEFycm93Tm9kZScsIEN1cnZlZEFycm93Tm9kZSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxPQUFPLE1BQU0sK0JBQStCO0FBQ25ELFNBQVNDLEtBQUssUUFBUSxnQ0FBZ0M7QUFDdEQsU0FBU0MsS0FBSyxFQUFFQyxJQUFJLEVBQUVDLElBQUksUUFBUSxtQ0FBbUM7QUFDckUsT0FBT0MsY0FBYyxNQUFNLHlCQUF5QjtBQUVwRCxNQUFNQyxLQUFLLEdBQUdKLEtBQUssQ0FBQ0ssS0FBSztBQUN6QixNQUFNQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUU7QUFDNUIsTUFBTUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLENBQUM7O0FBRTVCLGVBQWUsTUFBTUMsZUFBZSxTQUFTUCxJQUFJLENBQUM7RUFLaEQ7O0VBR0E7QUFDRjtBQUNBO0FBQ0E7RUFDU1EsV0FBV0EsQ0FBRUMsTUFBYyxFQUFFQyxLQUFhLEVBQUc7SUFFbERDLE1BQU0sSUFBSUEsTUFBTSxDQUFFRixNQUFNLEdBQUcsQ0FBQyxFQUFHLG1CQUFrQkEsTUFBTyxFQUFFLENBQUM7O0lBRTNEO0lBQ0EsTUFBTUcsT0FBTyxHQUFHLElBQUlYLElBQUksQ0FBRSxJQUFJSCxLQUFLLENBQUMsQ0FBQyxFQUFFO01BQ3JDZSxNQUFNLEVBQUVWLEtBQUs7TUFDYlcsU0FBUyxFQUFFO0lBQ2IsQ0FBRSxDQUFDOztJQUVIO0lBQ0E7SUFDQSxNQUFNQyxjQUFjLEdBQUcsSUFBSWpCLEtBQUssQ0FBQyxDQUFDO0lBQ2xDaUIsY0FBYyxDQUFDQyxNQUFNLENBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQyxDQUMxQkMsTUFBTSxDQUFFLENBQUNaLGVBQWUsR0FBRyxDQUFDLEVBQUUsQ0FBRSxDQUFDLENBQ2pDWSxNQUFNLENBQUVaLGVBQWUsR0FBRyxDQUFDLEVBQUUsQ0FBRSxDQUFDLENBQ2hDWSxNQUFNLENBQUUsQ0FBQyxFQUFFLENBQUNYLGdCQUFpQixDQUFDLENBQzlCVyxNQUFNLENBQUUsQ0FBQ1osZUFBZSxHQUFHLENBQUMsRUFBRSxDQUFFLENBQUMsQ0FDakNhLEtBQUssQ0FBQyxDQUFDO0lBQ1YsTUFBTUMsYUFBYSxHQUFHLElBQUlsQixJQUFJLENBQUVjLGNBQWMsRUFBRTtNQUM5Q0ssSUFBSSxFQUFFakI7SUFDUixDQUFFLENBQUM7SUFFSCxLQUFLLENBQUU7TUFDTGtCLFFBQVEsRUFBRSxDQUFFVCxPQUFPLEVBQUVPLGFBQWE7SUFDcEMsQ0FBRSxDQUFDO0lBRUgsSUFBSSxDQUFDVixNQUFNLEdBQUdBLE1BQU07SUFDcEIsSUFBSSxDQUFDQyxLQUFLLEdBQUdBLEtBQUs7SUFFbEIsSUFBSSxDQUFDWSxxQkFBcUIsR0FBRyxNQUFNO01BRWpDO01BQ0E7TUFDQTtNQUNBOztNQUVBO01BQ0E7TUFDQSxNQUFNQyx1QkFBdUIsR0FBR0MsSUFBSSxDQUFDQyxJQUFJLENBQUVuQixnQkFBZ0IsR0FBRyxJQUFJLENBQUNHLE1BQU8sQ0FBQzs7TUFFM0U7TUFDQSxNQUFNaUIsZUFBZSxHQUFHLElBQUksQ0FBQ2hCLEtBQUssSUFBSSxDQUFDOztNQUV2QztNQUNBO01BQ0E7TUFDQSxNQUFNaUIsY0FBYyxHQUFHRCxlQUFlLEdBQ2YsSUFBSSxDQUFDaEIsS0FBSyxHQUFHYSx1QkFBdUIsR0FDcEMsSUFBSSxDQUFDYixLQUFLLEdBQUdhLHVCQUF1Qjs7TUFFM0Q7TUFDQTtNQUNBSixhQUFhLENBQUNTLE9BQU8sR0FBR0osSUFBSSxDQUFDSyxHQUFHLENBQUUsSUFBSSxDQUFDbkIsS0FBTSxDQUFDLEdBQUdhLHVCQUF1Qjs7TUFFeEU7TUFDQSxNQUFNTyxRQUFRLEdBQUcsSUFBSWhDLEtBQUssQ0FBQyxDQUFDLENBQUNpQyxRQUFRLENBQUVsQyxPQUFPLENBQUNtQyxJQUFJLEVBQ2pELElBQUksQ0FBQ3ZCLE1BQU0sRUFDWCxDQUFDLEVBQ0RVLGFBQWEsQ0FBQ1MsT0FBTyxHQUFHLENBQUNELGNBQWMsR0FBRyxDQUFDLElBQUksQ0FBQ2pCLEtBQUssRUFBRWdCLGVBQWdCLENBQUM7TUFDMUVkLE9BQU8sQ0FBQ3FCLFFBQVEsQ0FBRUgsUUFBUyxDQUFDO01BRTVCLElBQUtYLGFBQWEsQ0FBQ1MsT0FBTyxFQUFHO1FBRTNCO1FBQ0E7UUFDQVQsYUFBYSxDQUFDZSxXQUFXLENBQUVSLGVBQWUsR0FBRyxDQUFDLElBQUksQ0FBQ2hCLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQ0EsS0FBSyxHQUFHYyxJQUFJLENBQUNXLEVBQUcsQ0FBQzs7UUFFbEY7UUFDQWhCLGFBQWEsQ0FBQ2lCLGNBQWMsQ0FDMUJaLElBQUksQ0FBQ2EsR0FBRyxDQUFFbEIsYUFBYSxDQUFDUyxPQUFPLEdBQUdELGNBQWMsR0FBRyxJQUFJLENBQUNqQixLQUFNLENBQUMsR0FBRyxJQUFJLENBQUNELE1BQU0sRUFDN0UsQ0FBQ2UsSUFBSSxDQUFDYyxHQUFHLENBQUVuQixhQUFhLENBQUNTLE9BQU8sR0FBR0QsY0FBYyxHQUFHLElBQUksQ0FBQ2pCLEtBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQ0QsTUFDMUUsQ0FBQztNQUNIO0lBQ0YsQ0FBQztJQUNELElBQUksQ0FBQ2EscUJBQXFCLENBQUMsQ0FBQztFQUM5Qjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtFQUNTaUIsUUFBUUEsQ0FBRTdCLEtBQWEsRUFBUztJQUNyQyxJQUFJLENBQUNBLEtBQUssR0FBR0EsS0FBSztJQUNsQixJQUFJLENBQUNZLHFCQUFxQixDQUFDLENBQUM7RUFDOUI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7RUFDU2tCLFNBQVNBLENBQUUvQixNQUFjLEVBQVM7SUFDdkMsSUFBSSxDQUFDQSxNQUFNLEdBQUdBLE1BQU07SUFDcEIsSUFBSSxDQUFDYSxxQkFBcUIsQ0FBQyxDQUFDO0VBQzlCO0VBRU9tQixTQUFTQSxDQUFBLEVBQVc7SUFDekIsT0FBTyxJQUFJLENBQUNoQyxNQUFNO0VBQ3BCO0FBQ0Y7QUFFQVAsY0FBYyxDQUFDd0MsUUFBUSxDQUFFLGlCQUFpQixFQUFFbkMsZUFBZ0IsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==