// Copyright 2014-2024, University of Colorado Boulder

/**
 * Base type for gradients and patterns (and NOT the only type for fills/strokes)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { scenery } from '../imports.js';
let globalId = 1;
export default class Paint {
  // (scenery-internal)

  // (scenery-internal)

  constructor() {
    this.id = `paint${globalId++}`;
    this.transformMatrix = null;
  }

  /**
   * Returns an object that can be passed to a Canvas context's fillStyle or strokeStyle.
   */

  /**
   * Sets how this paint (pattern/gradient) is transformed, compared with the local coordinate frame of where it is
   *
   * NOTE: This should only be used before the pattern/gradient is ever displayed.
   * TODO: Catch if this is violated? https://github.com/phetsims/scenery/issues/1581
   *
   * NOTE: The scale should be symmetric if it will be used as a stroke. It is difficult to set a different x and y scale
   * for canvas at the same time.
   */
  setTransformMatrix(transformMatrix) {
    if (this.transformMatrix !== transformMatrix) {
      this.transformMatrix = transformMatrix;
    }
    return this;
  }

  /**
   * Creates an SVG paint object for creating/updating the SVG equivalent definition.
   */

  /**
   * Returns a string form of this object
   */
  toString() {
    return this.id;
  }
}

// TODO: can we remove this in favor of type checks? https://github.com/phetsims/scenery/issues/1581
Paint.prototype.isPaint = true;
scenery.register('Paint', Paint);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzY2VuZXJ5IiwiZ2xvYmFsSWQiLCJQYWludCIsImNvbnN0cnVjdG9yIiwiaWQiLCJ0cmFuc2Zvcm1NYXRyaXgiLCJzZXRUcmFuc2Zvcm1NYXRyaXgiLCJ0b1N0cmluZyIsInByb3RvdHlwZSIsImlzUGFpbnQiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlBhaW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE0LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEJhc2UgdHlwZSBmb3IgZ3JhZGllbnRzIGFuZCBwYXR0ZXJucyAoYW5kIE5PVCB0aGUgb25seSB0eXBlIGZvciBmaWxscy9zdHJva2VzKVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgeyBzY2VuZXJ5LCBTVkdCbG9jaywgU1ZHR3JhZGllbnQsIFNWR1BhdHRlcm4gfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuXHJcbmxldCBnbG9iYWxJZCA9IDE7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBQYWludCB7XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBpZDogc3RyaW5nO1xyXG5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgdHJhbnNmb3JtTWF0cml4OiBNYXRyaXgzIHwgbnVsbDtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5pZCA9IGBwYWludCR7Z2xvYmFsSWQrK31gO1xyXG4gICAgdGhpcy50cmFuc2Zvcm1NYXRyaXggPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBvYmplY3QgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGEgQ2FudmFzIGNvbnRleHQncyBmaWxsU3R5bGUgb3Igc3Ryb2tlU3R5bGUuXHJcbiAgICovXHJcbiAgcHVibGljIGFic3RyYWN0IGdldENhbnZhc1N0eWxlKCk6IHN0cmluZyB8IENhbnZhc0dyYWRpZW50IHwgQ2FudmFzUGF0dGVybjtcclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyBob3cgdGhpcyBwYWludCAocGF0dGVybi9ncmFkaWVudCkgaXMgdHJhbnNmb3JtZWQsIGNvbXBhcmVkIHdpdGggdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUgb2Ygd2hlcmUgaXQgaXNcclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgc2hvdWxkIG9ubHkgYmUgdXNlZCBiZWZvcmUgdGhlIHBhdHRlcm4vZ3JhZGllbnQgaXMgZXZlciBkaXNwbGF5ZWQuXHJcbiAgICogVE9ETzogQ2F0Y2ggaWYgdGhpcyBpcyB2aW9sYXRlZD8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgKlxyXG4gICAqIE5PVEU6IFRoZSBzY2FsZSBzaG91bGQgYmUgc3ltbWV0cmljIGlmIGl0IHdpbGwgYmUgdXNlZCBhcyBhIHN0cm9rZS4gSXQgaXMgZGlmZmljdWx0IHRvIHNldCBhIGRpZmZlcmVudCB4IGFuZCB5IHNjYWxlXHJcbiAgICogZm9yIGNhbnZhcyBhdCB0aGUgc2FtZSB0aW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUcmFuc2Zvcm1NYXRyaXgoIHRyYW5zZm9ybU1hdHJpeDogTWF0cml4MyApOiB0aGlzIHtcclxuICAgIGlmICggdGhpcy50cmFuc2Zvcm1NYXRyaXggIT09IHRyYW5zZm9ybU1hdHJpeCApIHtcclxuICAgICAgdGhpcy50cmFuc2Zvcm1NYXRyaXggPSB0cmFuc2Zvcm1NYXRyaXg7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gU1ZHIHBhaW50IG9iamVjdCBmb3IgY3JlYXRpbmcvdXBkYXRpbmcgdGhlIFNWRyBlcXVpdmFsZW50IGRlZmluaXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGFic3RyYWN0IGNyZWF0ZVNWR1BhaW50KCBzdmdCbG9jazogU1ZHQmxvY2sgKTogU1ZHR3JhZGllbnQgfCBTVkdQYXR0ZXJuO1xyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIGZvcm0gb2YgdGhpcyBvYmplY3RcclxuICAgKi9cclxuICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLmlkO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGlzUGFpbnQhOiBib29sZWFuO1xyXG59XHJcblxyXG4vLyBUT0RPOiBjYW4gd2UgcmVtb3ZlIHRoaXMgaW4gZmF2b3Igb2YgdHlwZSBjaGVja3M/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcblBhaW50LnByb3RvdHlwZS5pc1BhaW50ID0gdHJ1ZTtcclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdQYWludCcsIFBhaW50ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLFNBQVNBLE9BQU8sUUFBMkMsZUFBZTtBQUUxRSxJQUFJQyxRQUFRLEdBQUcsQ0FBQztBQUVoQixlQUFlLE1BQWVDLEtBQUssQ0FBQztFQUVsQzs7RUFHQTs7RUFHT0MsV0FBV0EsQ0FBQSxFQUFHO0lBQ25CLElBQUksQ0FBQ0MsRUFBRSxHQUFJLFFBQU9ILFFBQVEsRUFBRyxFQUFDO0lBQzlCLElBQUksQ0FBQ0ksZUFBZSxHQUFHLElBQUk7RUFDN0I7O0VBRUE7QUFDRjtBQUNBOztFQUdFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTQyxrQkFBa0JBLENBQUVELGVBQXdCLEVBQVM7SUFDMUQsSUFBSyxJQUFJLENBQUNBLGVBQWUsS0FBS0EsZUFBZSxFQUFHO01BQzlDLElBQUksQ0FBQ0EsZUFBZSxHQUFHQSxlQUFlO0lBQ3hDO0lBQ0EsT0FBTyxJQUFJO0VBQ2I7O0VBRUE7QUFDRjtBQUNBOztFQUdFO0FBQ0Y7QUFDQTtFQUNTRSxRQUFRQSxDQUFBLEVBQVc7SUFDeEIsT0FBTyxJQUFJLENBQUNILEVBQUU7RUFDaEI7QUFHRjs7QUFFQTtBQUNBRixLQUFLLENBQUNNLFNBQVMsQ0FBQ0MsT0FBTyxHQUFHLElBQUk7QUFFOUJULE9BQU8sQ0FBQ1UsUUFBUSxDQUFFLE9BQU8sRUFBRVIsS0FBTSxDQUFDIiwiaWdub3JlTGlzdCI6W119