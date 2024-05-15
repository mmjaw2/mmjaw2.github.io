// Copyright 2015-2022, University of Colorado Boulder

/**
 * SpinningIndicatorNode is a spinning progress indicator, used to indicate operation is in progress (but with no
 * indication of how far along it is).  It spins in a circular clockwise pattern.
 *
 * The actual rectangles/circles/etc. (called elements in the documentation) stay in fixed positions, but their fill is
 * changed to give the impression of rotation.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Malley (PixelZoom, Inc.)
 */

import optionize from '../../phet-core/js/optionize.js';
import { Circle, Color, Node, PaintColorProperty, Rectangle } from '../../scenery/js/imports.js';
import sceneryPhet from './sceneryPhet.js';
export default class SpinningIndicatorNode extends Node {
  // Current angle of rotation

  // The angle between each element

  // A multiplier for how fast/slow the indicator will spin.

  // See SelfOptions

  // Each element of the indicator must be Path or a subclass, because we set fill.

  constructor(providedOptions) {
    const options = optionize()({
      diameter: 15,
      speed: 1,
      numberOfElements: 16,
      elementFactory: SpinningIndicatorNode.rectangleFactory,
      activeColor: 'rgba( 0, 0, 0, 1 )',
      inactiveColor: 'rgba( 0, 0, 0, 0.15 )'
    }, providedOptions);
    super(options);
    this.indicatorRotation = Math.PI * 2; // starts at 2pi so our modulo operation is safe below
    this.angleDelta = 2 * Math.PI / options.numberOfElements;
    this.activeColorProperty = new PaintColorProperty(options.activeColor);
    this.inactiveColorProperty = new PaintColorProperty(options.inactiveColor);
    this.speed = options.speed;

    // Create all of the elements (Paths)
    this.elements = [];
    let angle = 0;
    for (let i = 0; i < options.numberOfElements; i++) {
      const element = options.elementFactory(options.diameter, options.numberOfElements);

      // push the element to the outside of the circle
      element.right = options.diameter / 2;

      // center it vertically, so it can be rotated nicely into place
      element.centerY = 0;

      // rotate each element by its specific angle
      element.rotate(angle, true);
      angle += this.angleDelta;
      this.elements.push(element);
    }
    this.children = this.elements;
    this.step(0); // initialize colors
  }
  step(dt) {
    // increment rotation based on dt
    this.indicatorRotation += dt * 10.0 * this.speed;

    // update each element
    let angle = this.indicatorRotation;
    for (let i = 0; i < this.elements.length; i++) {
      // a number from 0 (active head) to 1 (inactive tail).
      let ratio = Math.pow(angle / (2 * Math.PI) % 1, 0.5);

      // Smoother transition, mapping our ratio from [0,0.2] => [1,0] and [0.2,1] => [0,1].
      // Otherwise, elements can instantly switch from one color to the other, which is visually displeasing.
      if (ratio < 0.2) {
        ratio = 1 - ratio * 5;
      } else {
        ratio = (ratio - 0.2) * 10 / 8;
      }

      // Fill it with the interpolated color
      const red = ratio * this.inactiveColorProperty.value.red + (1 - ratio) * this.activeColorProperty.value.red;
      const green = ratio * this.inactiveColorProperty.value.green + (1 - ratio) * this.activeColorProperty.value.green;
      const blue = ratio * this.inactiveColorProperty.value.blue + (1 - ratio) * this.activeColorProperty.value.blue;
      const alpha = ratio * this.inactiveColorProperty.value.alpha + (1 - ratio) * this.activeColorProperty.value.alpha;
      this.elements[i].fill = new Color(red, green, blue, alpha);

      // And rotate to the next element (in the opposite direction, so our motion is towards the head)
      angle -= this.angleDelta;
    }
  }
  dispose() {
    this.activeColorProperty.dispose();
    this.inactiveColorProperty.dispose();
    super.dispose();
  }

  /**
   * Factory method for creating rectangle-shaped elements, sized to fit.
   */
  static rectangleFactory(diameter, numberOfElements) {
    return new Rectangle(0, 0, diameter * 0.175, 1.2 * diameter / numberOfElements);
  }

  /**
   * Factory method for creating circle-shaped elements, sized to fit.
   */
  static circleFactory(diameter, numberOfElements) {
    return new Circle(0.8 * diameter / numberOfElements);
  }
}
sceneryPhet.register('SpinningIndicatorNode', SpinningIndicatorNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJDaXJjbGUiLCJDb2xvciIsIk5vZGUiLCJQYWludENvbG9yUHJvcGVydHkiLCJSZWN0YW5nbGUiLCJzY2VuZXJ5UGhldCIsIlNwaW5uaW5nSW5kaWNhdG9yTm9kZSIsImNvbnN0cnVjdG9yIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImRpYW1ldGVyIiwic3BlZWQiLCJudW1iZXJPZkVsZW1lbnRzIiwiZWxlbWVudEZhY3RvcnkiLCJyZWN0YW5nbGVGYWN0b3J5IiwiYWN0aXZlQ29sb3IiLCJpbmFjdGl2ZUNvbG9yIiwiaW5kaWNhdG9yUm90YXRpb24iLCJNYXRoIiwiUEkiLCJhbmdsZURlbHRhIiwiYWN0aXZlQ29sb3JQcm9wZXJ0eSIsImluYWN0aXZlQ29sb3JQcm9wZXJ0eSIsImVsZW1lbnRzIiwiYW5nbGUiLCJpIiwiZWxlbWVudCIsInJpZ2h0IiwiY2VudGVyWSIsInJvdGF0ZSIsInB1c2giLCJjaGlsZHJlbiIsInN0ZXAiLCJkdCIsImxlbmd0aCIsInJhdGlvIiwicG93IiwicmVkIiwidmFsdWUiLCJncmVlbiIsImJsdWUiLCJhbHBoYSIsImZpbGwiLCJkaXNwb3NlIiwiY2lyY2xlRmFjdG9yeSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiU3Bpbm5pbmdJbmRpY2F0b3JOb2RlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE1LTIwMjIsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFNwaW5uaW5nSW5kaWNhdG9yTm9kZSBpcyBhIHNwaW5uaW5nIHByb2dyZXNzIGluZGljYXRvciwgdXNlZCB0byBpbmRpY2F0ZSBvcGVyYXRpb24gaXMgaW4gcHJvZ3Jlc3MgKGJ1dCB3aXRoIG5vXHJcbiAqIGluZGljYXRpb24gb2YgaG93IGZhciBhbG9uZyBpdCBpcykuICBJdCBzcGlucyBpbiBhIGNpcmN1bGFyIGNsb2Nrd2lzZSBwYXR0ZXJuLlxyXG4gKlxyXG4gKiBUaGUgYWN0dWFsIHJlY3RhbmdsZXMvY2lyY2xlcy9ldGMuIChjYWxsZWQgZWxlbWVudHMgaW4gdGhlIGRvY3VtZW50YXRpb24pIHN0YXkgaW4gZml4ZWQgcG9zaXRpb25zLCBidXQgdGhlaXIgZmlsbCBpc1xyXG4gKiBjaGFuZ2VkIHRvIGdpdmUgdGhlIGltcHJlc3Npb24gb2Ygcm90YXRpb24uXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcbmltcG9ydCB7IENpcmNsZSwgQ29sb3IsIE5vZGUsIE5vZGVPcHRpb25zLCBQYWludENvbG9yUHJvcGVydHksIFBhdGgsIFJlY3RhbmdsZSB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBzY2VuZXJ5UGhldCBmcm9tICcuL3NjZW5lcnlQaGV0LmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIERpYW1ldGVyIG9mIHRoZSBpbmRpY2F0b3JcclxuICBkaWFtZXRlcj86IG51bWJlcjtcclxuXHJcbiAgLy8gQSBtdWx0aXBsaWVyIGZvciBob3cgZmFzdC9zbG93IHRoZSBpbmRpY2F0b3Igd2lsbCBzcGluLlxyXG4gIHNwZWVkPzogbnVtYmVyO1xyXG5cclxuICAvLyBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbWFrZSB1cCB0aGUgaW5kaWNhdG9yXHJcbiAgbnVtYmVyT2ZFbGVtZW50cz86IG51bWJlcjtcclxuXHJcbiAgLy8gQ3JlYXRlcyBvbmUgb2YgdGhlIGVsZW1lbnRzIChQYXRoKSB0aGF0IG1ha2UgdXAgdGhlIGluZGljYXRvclxyXG4gIGVsZW1lbnRGYWN0b3J5PzogKCBkaWFtZXRlcjogbnVtYmVyLCBudW1iZXJPZkVsZW1lbnRzOiBudW1iZXIgKSA9PiBQYXRoO1xyXG5cclxuICAvLyBUaGUgYWN0aXZlIFwibW9zdGx5IHZpc2libGVcIiBjb2xvciBhdCB0aGUgbGVhZC5cclxuICBhY3RpdmVDb2xvcj86IENvbG9yIHwgc3RyaW5nO1xyXG5cclxuICAvLyBUaGUgaW5hY3RpdmUgXCJtb3N0bHkgaW52aXNpYmxlXCIgY29sb3IgYXQgdGhlIHRhaWwuXHJcbiAgaW5hY3RpdmVDb2xvcj86IENvbG9yIHwgc3RyaW5nO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgU3Bpbm5pbmdJbmRpY2F0b3JOb2RlT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgU3RyaWN0T21pdDxOb2RlT3B0aW9ucywgJ2NoaWxkcmVuJz47XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTcGlubmluZ0luZGljYXRvck5vZGUgZXh0ZW5kcyBOb2RlIHtcclxuXHJcbiAgLy8gQ3VycmVudCBhbmdsZSBvZiByb3RhdGlvblxyXG4gIHByaXZhdGUgaW5kaWNhdG9yUm90YXRpb246IG51bWJlcjtcclxuXHJcbiAgLy8gVGhlIGFuZ2xlIGJldHdlZW4gZWFjaCBlbGVtZW50XHJcbiAgcHJpdmF0ZSByZWFkb25seSBhbmdsZURlbHRhOiBudW1iZXI7XHJcblxyXG4gIC8vIEEgbXVsdGlwbGllciBmb3IgaG93IGZhc3Qvc2xvdyB0aGUgaW5kaWNhdG9yIHdpbGwgc3Bpbi5cclxuICBwcml2YXRlIHJlYWRvbmx5IHNwZWVkOiBudW1iZXI7XHJcblxyXG4gIC8vIFNlZSBTZWxmT3B0aW9uc1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgYWN0aXZlQ29sb3JQcm9wZXJ0eTogUGFpbnRDb2xvclByb3BlcnR5O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgaW5hY3RpdmVDb2xvclByb3BlcnR5OiBQYWludENvbG9yUHJvcGVydHk7XHJcblxyXG4gIC8vIEVhY2ggZWxlbWVudCBvZiB0aGUgaW5kaWNhdG9yIG11c3QgYmUgUGF0aCBvciBhIHN1YmNsYXNzLCBiZWNhdXNlIHdlIHNldCBmaWxsLlxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZWxlbWVudHM6IFBhdGhbXTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwcm92aWRlZE9wdGlvbnM/OiBTcGlubmluZ0luZGljYXRvck5vZGVPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8U3Bpbm5pbmdJbmRpY2F0b3JOb2RlT3B0aW9ucywgU2VsZk9wdGlvbnMsIE5vZGVPcHRpb25zPigpKCB7XHJcbiAgICAgIGRpYW1ldGVyOiAxNSxcclxuICAgICAgc3BlZWQ6IDEsXHJcbiAgICAgIG51bWJlck9mRWxlbWVudHM6IDE2LFxyXG4gICAgICBlbGVtZW50RmFjdG9yeTogU3Bpbm5pbmdJbmRpY2F0b3JOb2RlLnJlY3RhbmdsZUZhY3RvcnksXHJcbiAgICAgIGFjdGl2ZUNvbG9yOiAncmdiYSggMCwgMCwgMCwgMSApJyxcclxuICAgICAgaW5hY3RpdmVDb2xvcjogJ3JnYmEoIDAsIDAsIDAsIDAuMTUgKSdcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5pbmRpY2F0b3JSb3RhdGlvbiA9IE1hdGguUEkgKiAyOyAvLyBzdGFydHMgYXQgMnBpIHNvIG91ciBtb2R1bG8gb3BlcmF0aW9uIGlzIHNhZmUgYmVsb3dcclxuICAgIHRoaXMuYW5nbGVEZWx0YSA9IDIgKiBNYXRoLlBJIC8gb3B0aW9ucy5udW1iZXJPZkVsZW1lbnRzO1xyXG4gICAgdGhpcy5hY3RpdmVDb2xvclByb3BlcnR5ID0gbmV3IFBhaW50Q29sb3JQcm9wZXJ0eSggb3B0aW9ucy5hY3RpdmVDb2xvciApO1xyXG4gICAgdGhpcy5pbmFjdGl2ZUNvbG9yUHJvcGVydHkgPSBuZXcgUGFpbnRDb2xvclByb3BlcnR5KCBvcHRpb25zLmluYWN0aXZlQ29sb3IgKTtcclxuICAgIHRoaXMuc3BlZWQgPSBvcHRpb25zLnNwZWVkO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhbGwgb2YgdGhlIGVsZW1lbnRzIChQYXRocylcclxuICAgIHRoaXMuZWxlbWVudHMgPSBbXTtcclxuICAgIGxldCBhbmdsZSA9IDA7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBvcHRpb25zLm51bWJlck9mRWxlbWVudHM7IGkrKyApIHtcclxuICAgICAgY29uc3QgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudEZhY3RvcnkoIG9wdGlvbnMuZGlhbWV0ZXIsIG9wdGlvbnMubnVtYmVyT2ZFbGVtZW50cyApO1xyXG5cclxuICAgICAgLy8gcHVzaCB0aGUgZWxlbWVudCB0byB0aGUgb3V0c2lkZSBvZiB0aGUgY2lyY2xlXHJcbiAgICAgIGVsZW1lbnQucmlnaHQgPSBvcHRpb25zLmRpYW1ldGVyIC8gMjtcclxuXHJcbiAgICAgIC8vIGNlbnRlciBpdCB2ZXJ0aWNhbGx5LCBzbyBpdCBjYW4gYmUgcm90YXRlZCBuaWNlbHkgaW50byBwbGFjZVxyXG4gICAgICBlbGVtZW50LmNlbnRlclkgPSAwO1xyXG5cclxuICAgICAgLy8gcm90YXRlIGVhY2ggZWxlbWVudCBieSBpdHMgc3BlY2lmaWMgYW5nbGVcclxuICAgICAgZWxlbWVudC5yb3RhdGUoIGFuZ2xlLCB0cnVlICk7XHJcblxyXG4gICAgICBhbmdsZSArPSB0aGlzLmFuZ2xlRGVsdGE7XHJcbiAgICAgIHRoaXMuZWxlbWVudHMucHVzaCggZWxlbWVudCApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY2hpbGRyZW4gPSB0aGlzLmVsZW1lbnRzO1xyXG5cclxuICAgIHRoaXMuc3RlcCggMCApOyAvLyBpbml0aWFsaXplIGNvbG9yc1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0ZXAoIGR0OiBudW1iZXIgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gaW5jcmVtZW50IHJvdGF0aW9uIGJhc2VkIG9uIGR0XHJcbiAgICB0aGlzLmluZGljYXRvclJvdGF0aW9uICs9IGR0ICogMTAuMCAqIHRoaXMuc3BlZWQ7XHJcblxyXG4gICAgLy8gdXBkYXRlIGVhY2ggZWxlbWVudFxyXG4gICAgbGV0IGFuZ2xlID0gdGhpcy5pbmRpY2F0b3JSb3RhdGlvbjtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuZWxlbWVudHMubGVuZ3RoOyBpKysgKSB7XHJcblxyXG4gICAgICAvLyBhIG51bWJlciBmcm9tIDAgKGFjdGl2ZSBoZWFkKSB0byAxIChpbmFjdGl2ZSB0YWlsKS5cclxuICAgICAgbGV0IHJhdGlvID0gTWF0aC5wb3coICggYW5nbGUgLyAoIDIgKiBNYXRoLlBJICkgKSAlIDEsIDAuNSApO1xyXG5cclxuICAgICAgLy8gU21vb3RoZXIgdHJhbnNpdGlvbiwgbWFwcGluZyBvdXIgcmF0aW8gZnJvbSBbMCwwLjJdID0+IFsxLDBdIGFuZCBbMC4yLDFdID0+IFswLDFdLlxyXG4gICAgICAvLyBPdGhlcndpc2UsIGVsZW1lbnRzIGNhbiBpbnN0YW50bHkgc3dpdGNoIGZyb20gb25lIGNvbG9yIHRvIHRoZSBvdGhlciwgd2hpY2ggaXMgdmlzdWFsbHkgZGlzcGxlYXNpbmcuXHJcbiAgICAgIGlmICggcmF0aW8gPCAwLjIgKSB7XHJcbiAgICAgICAgcmF0aW8gPSAxIC0gcmF0aW8gKiA1O1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJhdGlvID0gKCByYXRpbyAtIDAuMiApICogMTAgLyA4O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBGaWxsIGl0IHdpdGggdGhlIGludGVycG9sYXRlZCBjb2xvclxyXG4gICAgICBjb25zdCByZWQgPSByYXRpbyAqIHRoaXMuaW5hY3RpdmVDb2xvclByb3BlcnR5LnZhbHVlLnJlZCArICggMSAtIHJhdGlvICkgKiB0aGlzLmFjdGl2ZUNvbG9yUHJvcGVydHkudmFsdWUucmVkO1xyXG4gICAgICBjb25zdCBncmVlbiA9IHJhdGlvICogdGhpcy5pbmFjdGl2ZUNvbG9yUHJvcGVydHkudmFsdWUuZ3JlZW4gKyAoIDEgLSByYXRpbyApICogdGhpcy5hY3RpdmVDb2xvclByb3BlcnR5LnZhbHVlLmdyZWVuO1xyXG4gICAgICBjb25zdCBibHVlID0gcmF0aW8gKiB0aGlzLmluYWN0aXZlQ29sb3JQcm9wZXJ0eS52YWx1ZS5ibHVlICsgKCAxIC0gcmF0aW8gKSAqIHRoaXMuYWN0aXZlQ29sb3JQcm9wZXJ0eS52YWx1ZS5ibHVlO1xyXG4gICAgICBjb25zdCBhbHBoYSA9IHJhdGlvICogdGhpcy5pbmFjdGl2ZUNvbG9yUHJvcGVydHkudmFsdWUuYWxwaGEgKyAoIDEgLSByYXRpbyApICogdGhpcy5hY3RpdmVDb2xvclByb3BlcnR5LnZhbHVlLmFscGhhO1xyXG4gICAgICB0aGlzLmVsZW1lbnRzWyBpIF0uZmlsbCA9IG5ldyBDb2xvciggcmVkLCBncmVlbiwgYmx1ZSwgYWxwaGEgKTtcclxuXHJcbiAgICAgIC8vIEFuZCByb3RhdGUgdG8gdGhlIG5leHQgZWxlbWVudCAoaW4gdGhlIG9wcG9zaXRlIGRpcmVjdGlvbiwgc28gb3VyIG1vdGlvbiBpcyB0b3dhcmRzIHRoZSBoZWFkKVxyXG4gICAgICBhbmdsZSAtPSB0aGlzLmFuZ2xlRGVsdGE7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuYWN0aXZlQ29sb3JQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLmluYWN0aXZlQ29sb3JQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcblxyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmFjdG9yeSBtZXRob2QgZm9yIGNyZWF0aW5nIHJlY3RhbmdsZS1zaGFwZWQgZWxlbWVudHMsIHNpemVkIHRvIGZpdC5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlY3RhbmdsZUZhY3RvcnkoIGRpYW1ldGVyOiBudW1iZXIsIG51bWJlck9mRWxlbWVudHM6IG51bWJlciApOiBSZWN0YW5nbGUge1xyXG4gICAgcmV0dXJuIG5ldyBSZWN0YW5nbGUoIDAsIDAsIGRpYW1ldGVyICogMC4xNzUsIDEuMiAqIGRpYW1ldGVyIC8gbnVtYmVyT2ZFbGVtZW50cyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmFjdG9yeSBtZXRob2QgZm9yIGNyZWF0aW5nIGNpcmNsZS1zaGFwZWQgZWxlbWVudHMsIHNpemVkIHRvIGZpdC5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGNpcmNsZUZhY3RvcnkoIGRpYW1ldGVyOiBudW1iZXIsIG51bWJlck9mRWxlbWVudHM6IG51bWJlciApOiBDaXJjbGUge1xyXG4gICAgcmV0dXJuIG5ldyBDaXJjbGUoIDAuOCAqIGRpYW1ldGVyIC8gbnVtYmVyT2ZFbGVtZW50cyApO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeVBoZXQucmVnaXN0ZXIoICdTcGlubmluZ0luZGljYXRvck5vZGUnLCBTcGlubmluZ0luZGljYXRvck5vZGUgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFNBQVMsTUFBTSxpQ0FBaUM7QUFFdkQsU0FBU0MsTUFBTSxFQUFFQyxLQUFLLEVBQUVDLElBQUksRUFBZUMsa0JBQWtCLEVBQVFDLFNBQVMsUUFBUSw2QkFBNkI7QUFDbkgsT0FBT0MsV0FBVyxNQUFNLGtCQUFrQjtBQXlCMUMsZUFBZSxNQUFNQyxxQkFBcUIsU0FBU0osSUFBSSxDQUFDO0VBRXREOztFQUdBOztFQUdBOztFQUdBOztFQUlBOztFQUdPSyxXQUFXQSxDQUFFQyxlQUE4QyxFQUFHO0lBRW5FLE1BQU1DLE9BQU8sR0FBR1YsU0FBUyxDQUF5RCxDQUFDLENBQUU7TUFDbkZXLFFBQVEsRUFBRSxFQUFFO01BQ1pDLEtBQUssRUFBRSxDQUFDO01BQ1JDLGdCQUFnQixFQUFFLEVBQUU7TUFDcEJDLGNB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LENBQUMsR0FBR0osS0FBSyxJQUFLLElBQUksQ0FBQ2QsbUJBQW1CLENBQUNpQixLQUFLLENBQUNDLEtBQUs7TUFDbkgsTUFBTUMsSUFBSSxHQUFHTCxLQUFLLEdBQUcsSUFBSSxDQUFDYixxQkFBcUIsQ0FBQ2dCLEtBQUssQ0FBQ0UsSUFBSSxHQUFHLENBQUUsQ0FBQyxHQUFHTCxLQUFLLElBQUssSUFBSSxDQUFDZCxtQkFBbUIsQ0FBQ2lCLEtBQUssQ0FBQ0UsSUFBSTtNQUNoSCxNQUFNQyxLQUFLLEdBQUdOLEtBQUssR0FBRyxJQUFJLENBQUNiLHFCQUFxQixDQUFDZ0IsS0FBSyxDQUFDRyxLQUFLLEdBQUcsQ0FBRSxDQUFDLEdBQUdOLEtBQUssSUFBSyxJQUFJLENBQUNkLG1CQUFtQixDQUFDaUIsS0FBSyxDQUFDRyxLQUFLO01BQ25ILElBQUksQ0FBQ2xCLFFBQVEsQ0FBRUUsQ0FBQyxDQUFFLENBQUNpQixJQUFJLEdBQUcsSUFBSXpDLEtBQUssQ0FBRW9DLEdBQUcsRUFBRUUsS0FBSyxFQUFFQyxJQUFJLEVBQUVDLEtBQU0sQ0FBQzs7TUFFOUQ7TUFDQWpCLEtBQUssSUFBSSxJQUFJLENBQUNKLFVBQVU7SUFDMUI7RUFDRjtFQUVnQnVCLE9BQU9BLENBQUEsRUFBUztJQUM5QixJQUFJLENBQUN0QixtQkFBbUIsQ0FBQ3NCLE9BQU8sQ0FBQyxDQUFDO0lBQ2xDLElBQUksQ0FBQ3JCLHFCQUFxQixDQUFDcUIsT0FBTyxDQUFDLENBQUM7SUFFcEMsS0FBSyxDQUFDQSxPQUFPLENBQUMsQ0FBQztFQUNqQjs7RUFFQTtBQUNGO0FBQ0E7RUFDRSxPQUFjN0IsZ0JBQWdCQSxDQUFFSixRQUFnQixFQUFFRSxnQkFBd0IsRUFBYztJQUN0RixPQUFPLElBQUlSLFNBQVMsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFTSxRQUFRLEdBQUcsS0FBSyxFQUFFLEdBQUcsR0FBR0EsUUFBUSxHQUFHRSxnQkFBaUIsQ0FBQztFQUNuRjs7RUFFQTtBQUNGO0FBQ0E7RUFDRSxPQUFjZ0MsYUFBYUEsQ0FBRWxDLFFBQWdCLEVBQUVFLGdCQUF3QixFQUFXO0lBQ2hGLE9BQU8sSUFBSVosTUFBTSxDQUFFLEdBQUcsR0FBR1UsUUFBUSxHQUFHRSxnQkFBaUIsQ0FBQztFQUN4RDtBQUNGO0FBRUFQLFdBQVcsQ0FBQ3dDLFFBQVEsQ0FBRSx1QkFBdUIsRUFBRXZDLHFCQUFzQixDQUFDIiwiaWdub3JlTGlzdCI6W119