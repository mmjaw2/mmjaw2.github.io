// Copyright 2014-2022, University of Colorado Boulder

/**
 * SpectrumNode displays a color spectrum for a range of values. By default, it maps values in the range [0,1] to
 * the grayscale spectrum. The client can provide a different range, and different method of mapping value to color.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Bounds2 from '../../dot/js/Bounds2.js';
import Dimension2 from '../../dot/js/Dimension2.js';
import Utils from '../../dot/js/Utils.js';
import optionize from '../../phet-core/js/optionize.js';
import { Color, Image, Node } from '../../scenery/js/imports.js';
import sceneryPhet from './sceneryPhet.js';
const DEFAULT_SIZE = new Dimension2(150, 30);
export default class SpectrumNode extends Node {
  // value is [0,1] and maps to the grayscale spectrum
  static DEFAULT_VALUE_TO_COLOR = value => {
    assert && assert(value >= 0 && value <= 1, `value is out of range [0,1]: ${value}`);
    return new Color(255 * value, 255 * value, 255 * value);
  };
  constructor(providedOptions) {
    const options = optionize()({
      // SelfOptions
      size: DEFAULT_SIZE,
      valueToColor: SpectrumNode.DEFAULT_VALUE_TO_COLOR,
      minValue: 0,
      maxValue: 1
    }, providedOptions);

    // validate option values
    assert && assert(options.minValue < options.maxValue, 'minValue should be < maxValue');

    // Draw the spectrum directly to a canvas, to improve performance.
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    assert && assert(context, 'expected a CanvasRenderingContext2D');

    // Size the canvas a bit larger, using integer width and height, as required by canvas.
    canvas.width = 1.1 * Math.ceil(options.size.width);
    canvas.height = 1.1 * Math.ceil(options.size.height);

    // Draw the spectrum.
    for (let i = 0; i < canvas.width; i++) {
      const value = Utils.clamp(Utils.linear(0, canvas.width, options.minValue, options.maxValue, i), options.minValue, options.maxValue);
      context.fillStyle = options.valueToColor(value).toCSS();
      context.fillRect(i, 0, 1, canvas.height);
    }
    const image = new Image(canvas.toDataURL());

    // Since the Image's bounds aren't immediately computed, set them here.
    image.setLocalBounds(new Bounds2(0, 0, canvas.width, canvas.height));

    // Scale the Image to match the requested options.size
    image.setScaleMagnitude(options.size.width / canvas.width, options.size.height / canvas.height);
    options.children = [image];
    super(options);
  }
}
sceneryPhet.register('SpectrumNode', SpectrumNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiRGltZW5zaW9uMiIsIlV0aWxzIiwib3B0aW9uaXplIiwiQ29sb3IiLCJJbWFnZSIsIk5vZGUiLCJzY2VuZXJ5UGhldCIsIkRFRkFVTFRfU0laRSIsIlNwZWN0cnVtTm9kZSIsIkRFRkFVTFRfVkFMVUVfVE9fQ09MT1IiLCJ2YWx1ZSIsImFzc2VydCIsImNvbnN0cnVjdG9yIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInNpemUiLCJ2YWx1ZVRvQ29sb3IiLCJtaW5WYWx1ZSIsIm1heFZhbHVlIiwiY2FudmFzIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiY29udGV4dCIsImdldENvbnRleHQiLCJ3aWR0aCIsIk1hdGgiLCJjZWlsIiwiaGVpZ2h0IiwiaSIsImNsYW1wIiwibGluZWFyIiwiZmlsbFN0eWxlIiwidG9DU1MiLCJmaWxsUmVjdCIsImltYWdlIiwidG9EYXRhVVJMIiwic2V0TG9jYWxCb3VuZHMiLCJzZXRTY2FsZU1hZ25pdHVkZSIsImNoaWxkcmVuIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJTcGVjdHJ1bU5vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQtMjAyMiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU3BlY3RydW1Ob2RlIGRpc3BsYXlzIGEgY29sb3Igc3BlY3RydW0gZm9yIGEgcmFuZ2Ugb2YgdmFsdWVzLiBCeSBkZWZhdWx0LCBpdCBtYXBzIHZhbHVlcyBpbiB0aGUgcmFuZ2UgWzAsMV0gdG9cclxuICogdGhlIGdyYXlzY2FsZSBzcGVjdHJ1bS4gVGhlIGNsaWVudCBjYW4gcHJvdmlkZSBhIGRpZmZlcmVudCByYW5nZSwgYW5kIGRpZmZlcmVudCBtZXRob2Qgb2YgbWFwcGluZyB2YWx1ZSB0byBjb2xvci5cclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IERpbWVuc2lvbjIgZnJvbSAnLi4vLi4vZG90L2pzL0RpbWVuc2lvbjIuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IHsgQ29sb3IsIEltYWdlLCBOb2RlLCBOb2RlT3B0aW9ucyB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBzY2VuZXJ5UGhldCBmcm9tICcuL3NjZW5lcnlQaGV0LmpzJztcclxuXHJcbmNvbnN0IERFRkFVTFRfU0laRSA9IG5ldyBEaW1lbnNpb24yKCAxNTAsIDMwICk7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0ge1xyXG5cclxuICAvLyBkaW1lbnNpb25zIG9mIHRoZSBzcGVjdHJ1bVxyXG4gIHNpemU/OiBEaW1lbnNpb24yO1xyXG5cclxuICAvLyBtYXBzIHZhbHVlIHRvIENvbG9yLCByYW5nZSBvZiB2YWx1ZSBpcyBkZXRlcm1pbmVkIGJ5IHRoZSBjbGllbnRcclxuICB2YWx1ZVRvQ29sb3I/OiAoIHZhbHVlOiBudW1iZXIgKSA9PiBDb2xvcjtcclxuXHJcbiAgLy8gbWluIHZhbHVlIHRvIGJlIG1hcHBlZCB0byBDb2xvciB2aWEgdmFsdWVUb0NvbG9yXHJcbiAgbWluVmFsdWU/OiBudW1iZXI7XHJcblxyXG4gIC8vIG1heCB2YWx1ZSB0byBiZSBtYXBwZWQgdG8gQ29sb3IgdmlhIHZhbHVlVG9Db2xvclxyXG4gIG1heFZhbHVlPzogbnVtYmVyO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgU3BlY3RydW1Ob2RlT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgU3RyaWN0T21pdDxOb2RlT3B0aW9ucywgJ2NoaWxkcmVuJz47XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTcGVjdHJ1bU5vZGUgZXh0ZW5kcyBOb2RlIHtcclxuXHJcbiAgLy8gdmFsdWUgaXMgWzAsMV0gYW5kIG1hcHMgdG8gdGhlIGdyYXlzY2FsZSBzcGVjdHJ1bVxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9WQUxVRV9UT19DT0xPUiA9ICggdmFsdWU6IG51bWJlciApOiBDb2xvciA9PiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB2YWx1ZSA+PSAwICYmIHZhbHVlIDw9IDEsIGB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UgWzAsMV06ICR7dmFsdWV9YCApO1xyXG4gICAgcmV0dXJuIG5ldyBDb2xvciggMjU1ICogdmFsdWUsIDI1NSAqIHZhbHVlLCAyNTUgKiB2YWx1ZSApO1xyXG4gIH07XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvdmlkZWRPcHRpb25zPzogU3BlY3RydW1Ob2RlT3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFNwZWN0cnVtTm9kZU9wdGlvbnMsIFNlbGZPcHRpb25zLCBOb2RlT3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8gU2VsZk9wdGlvbnNcclxuICAgICAgc2l6ZTogREVGQVVMVF9TSVpFLFxyXG4gICAgICB2YWx1ZVRvQ29sb3I6IFNwZWN0cnVtTm9kZS5ERUZBVUxUX1ZBTFVFX1RPX0NPTE9SLFxyXG4gICAgICBtaW5WYWx1ZTogMCxcclxuICAgICAgbWF4VmFsdWU6IDFcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIC8vIHZhbGlkYXRlIG9wdGlvbiB2YWx1ZXNcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMubWluVmFsdWUgPCBvcHRpb25zLm1heFZhbHVlLCAnbWluVmFsdWUgc2hvdWxkIGJlIDwgbWF4VmFsdWUnICk7XHJcblxyXG4gICAgLy8gRHJhdyB0aGUgc3BlY3RydW0gZGlyZWN0bHkgdG8gYSBjYW52YXMsIHRvIGltcHJvdmUgcGVyZm9ybWFuY2UuXHJcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xyXG4gICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCAnMmQnICkhO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggY29udGV4dCwgJ2V4cGVjdGVkIGEgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEJyApO1xyXG5cclxuICAgIC8vIFNpemUgdGhlIGNhbnZhcyBhIGJpdCBsYXJnZXIsIHVzaW5nIGludGVnZXIgd2lkdGggYW5kIGhlaWdodCwgYXMgcmVxdWlyZWQgYnkgY2FudmFzLlxyXG4gICAgY2FudmFzLndpZHRoID0gMS4xICogTWF0aC5jZWlsKCBvcHRpb25zLnNpemUud2lkdGggKTtcclxuICAgIGNhbnZhcy5oZWlnaHQgPSAxLjEgKiBNYXRoLmNlaWwoIG9wdGlvbnMuc2l6ZS5oZWlnaHQgKTtcclxuXHJcbiAgICAvLyBEcmF3IHRoZSBzcGVjdHJ1bS5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGNhbnZhcy53aWR0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCB2YWx1ZSA9IFV0aWxzLmNsYW1wKCBVdGlscy5saW5lYXIoIDAsIGNhbnZhcy53aWR0aCwgb3B0aW9ucy5taW5WYWx1ZSwgb3B0aW9ucy5tYXhWYWx1ZSwgaSApLCBvcHRpb25zLm1pblZhbHVlLCBvcHRpb25zLm1heFZhbHVlICk7XHJcbiAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gb3B0aW9ucy52YWx1ZVRvQ29sb3IoIHZhbHVlICkudG9DU1MoKTtcclxuICAgICAgY29udGV4dC5maWxsUmVjdCggaSwgMCwgMSwgY2FudmFzLmhlaWdodCApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCBjYW52YXMudG9EYXRhVVJMKCkgKTtcclxuXHJcbiAgICAvLyBTaW5jZSB0aGUgSW1hZ2UncyBib3VuZHMgYXJlbid0IGltbWVkaWF0ZWx5IGNvbXB1dGVkLCBzZXQgdGhlbSBoZXJlLlxyXG4gICAgaW1hZ2Uuc2V0TG9jYWxCb3VuZHMoIG5ldyBCb3VuZHMyKCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQgKSApO1xyXG5cclxuICAgIC8vIFNjYWxlIHRoZSBJbWFnZSB0byBtYXRjaCB0aGUgcmVxdWVzdGVkIG9wdGlvbnMuc2l6ZVxyXG4gICAgaW1hZ2Uuc2V0U2NhbGVNYWduaXR1ZGUoIG9wdGlvbnMuc2l6ZS53aWR0aCAvIGNhbnZhcy53aWR0aCwgb3B0aW9ucy5zaXplLmhlaWdodCAvIGNhbnZhcy5oZWlnaHQgKTtcclxuXHJcbiAgICBvcHRpb25zLmNoaWxkcmVuID0gWyBpbWFnZSBdO1xyXG5cclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ1NwZWN0cnVtTm9kZScsIFNwZWN0cnVtTm9kZSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsT0FBTyxNQUFNLHlCQUF5QjtBQUU3QyxPQUFPQyxVQUFVLE1BQU0sNEJBQTRCO0FBQ25ELE9BQU9DLEtBQUssTUFBTSx1QkFBdUI7QUFDekMsT0FBT0MsU0FBUyxNQUFNLGlDQUFpQztBQUN2RCxTQUFTQyxLQUFLLEVBQUVDLEtBQUssRUFBRUMsSUFBSSxRQUFxQiw2QkFBNkI7QUFDN0UsT0FBT0MsV0FBVyxNQUFNLGtCQUFrQjtBQUUxQyxNQUFNQyxZQUFZLEdBQUcsSUFBSVAsVUFBVSxDQUFFLEdBQUcsRUFBRSxFQUFHLENBQUM7QUFtQjlDLGVBQWUsTUFBTVEsWUFBWSxTQUFTSCxJQUFJLENBQUM7RUFFN0M7RUFDQSxPQUF1Qkksc0JB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