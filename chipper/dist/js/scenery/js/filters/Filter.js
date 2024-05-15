// Copyright 2020-2024, University of Colorado Boulder

/**
 * Base type for filters
 *
 * Filters have different ways of being applied, depending on what the platform supports AND what content is below.
 * These different ways have potentially different performance characteristics, and potentially quality differences.
 *
 * The current ways are:
 * - DOM element with CSS filter specified (can include mixed content and WebGL underneath, and this is used as a
 *   general fallback). NOTE: General color matrix support is NOT provided under this, we only have specific named
 *   filters that can be used.
 * - SVG filter elements (which are very flexible, a combination of filters may be combined into SVG filter elements).
 *   This only works if ALL of the content under the filter(s) can be placed in one SVG element, so a layerSplit or
 *   non-SVG content can prevent this from being used.
 * - Canvas filter attribute (similar to DOM CSS). Similar to DOM CSS, but not as accelerated (requires applying the
 *   filter by drawing into another Canvas). Chromium-based browsers seem to have issues with the color space used,
 *   so this can't be used on that platform. Additionally, this only works if ALL the content under the filter(s) can
 *   be placed in one Canvas, so a layerSplit or non-SVG content can prevent this from being used.
 * - Canvas ImageData. This is a fallback where we directly get, manipulate, and set pixel data in a Canvas (with the
 *   corresponding performance hit that it takes to CPU-process every pixel). Additionally, this only works if ALL the
 *   content under the filter(s) can   be placed in one Canvas, so a layerSplit or non-SVG content can prevent this from
 *   being used.
 *
 * Some filters may have slightly different appearances depending on the browser/platform/renderer.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { Features, scenery, svgns } from '../imports.js';
let globalId = 1;
export default class Filter {
  // (scenery-internal)

  // Can be mutated by subtypes, determines what filter region increases should be used for when SVG is used for
  // rendering.

  constructor() {
    this.id = `filter${globalId++}`;
    this.filterRegionPercentageIncrease = 0;
  }

  /**
   * Returns the CSS-style filter substring specific to this single filter, e.g. `grayscale(1)`. This should be used for
   * both DOM elements (https://developer.mozilla.org/en-US/docs/Web/CSS/filter) and when supported, Canvas
   * (https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter).
   */

  /**
   * Appends filter sub-elements into the SVG filter element provided. Should include an in=${inName} for all inputs,
   * and should either output using the resultName (or if not provided, the last element appended should be the output).
   * This effectively mutates the provided filter object, and will be successively called on all Filters to build an
   * SVG filter object.
   */

  /**
   * Given a specific canvas/context wrapper, this method should mutate its state so that the canvas now holds the
   * filtered content. Usually this would be by using getImageData/putImageData, however redrawing or other operations
   * are also possible.
   */

  isDOMCompatible() {
    // TODO: We can browser-check on things like color matrix? But we want to disallow things that we can't guarantee we https://github.com/phetsims/scenery/issues/1581
    // can support?
    return false;
  }
  isSVGCompatible() {
    return false;
  }
  isCanvasCompatible() {
    return Features.canvasFilter ? this.isDOMCompatible() : false;
  }
  isWebGLCompatible() {
    return false;
  }

  /**
   * Returns a string form of this object
   */
  toString() {
    return this.id;
  }

  /**
   * Applies a color matrix effect into an existing SVG filter.
   */
  static applyColorMatrix(matrixValues, svgFilter, inName, resultName) {
    const feColorMatrix = document.createElementNS(svgns, 'feColorMatrix');
    feColorMatrix.setAttribute('type', 'matrix');
    feColorMatrix.setAttribute('values', matrixValues);
    feColorMatrix.setAttribute('in', inName);

    // Since the DOM effects are done with sRGB and we can't manipulate that, we'll instead adjust SVG to apply the
    // effects in sRGB so that we have consistency
    feColorMatrix.setAttribute('color-interpolation-filters', 'sRGB');
    if (resultName) {
      feColorMatrix.setAttribute('result', resultName);
    }
    svgFilter.appendChild(feColorMatrix);
  }
}
scenery.register('Filter', Filter);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJGZWF0dXJlcyIsInNjZW5lcnkiLCJzdmducyIsImdsb2JhbElkIiwiRmlsdGVyIiwiY29uc3RydWN0b3IiLCJpZCIsImZpbHRlclJlZ2lvblBlcmNlbnRhZ2VJbmNyZWFzZSIsImlzRE9NQ29tcGF0aWJsZSIsImlzU1ZHQ29tcGF0aWJsZSIsImlzQ2FudmFzQ29tcGF0aWJsZSIsImNhbnZhc0ZpbHRlciIsImlzV2ViR0xDb21wYXRpYmxlIiwidG9TdHJpbmciLCJhcHBseUNvbG9yTWF0cml4IiwibWF0cml4VmFsdWVzIiwic3ZnRmlsdGVyIiwiaW5OYW1lIiwicmVzdWx0TmFtZSIsImZlQ29sb3JNYXRyaXgiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnROUyIsInNldEF0dHJpYnV0ZSIsImFwcGVuZENoaWxkIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJGaWx0ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQmFzZSB0eXBlIGZvciBmaWx0ZXJzXHJcbiAqXHJcbiAqIEZpbHRlcnMgaGF2ZSBkaWZmZXJlbnQgd2F5cyBvZiBiZWluZyBhcHBsaWVkLCBkZXBlbmRpbmcgb24gd2hhdCB0aGUgcGxhdGZvcm0gc3VwcG9ydHMgQU5EIHdoYXQgY29udGVudCBpcyBiZWxvdy5cclxuICogVGhlc2UgZGlmZmVyZW50IHdheXMgaGF2ZSBwb3RlbnRpYWxseSBkaWZmZXJlbnQgcGVyZm9ybWFuY2UgY2hhcmFjdGVyaXN0aWNzLCBhbmQgcG90ZW50aWFsbHkgcXVhbGl0eSBkaWZmZXJlbmNlcy5cclxuICpcclxuICogVGhlIGN1cnJlbnQgd2F5cyBhcmU6XHJcbiAqIC0gRE9NIGVsZW1lbnQgd2l0aCBDU1MgZmlsdGVyIHNwZWNpZmllZCAoY2FuIGluY2x1ZGUgbWl4ZWQgY29udGVudCBhbmQgV2ViR0wgdW5kZXJuZWF0aCwgYW5kIHRoaXMgaXMgdXNlZCBhcyBhXHJcbiAqICAgZ2VuZXJhbCBmYWxsYmFjaykuIE5PVEU6IEdlbmVyYWwgY29sb3IgbWF0cml4IHN1cHBvcnQgaXMgTk9UIHByb3ZpZGVkIHVuZGVyIHRoaXMsIHdlIG9ubHkgaGF2ZSBzcGVjaWZpYyBuYW1lZFxyXG4gKiAgIGZpbHRlcnMgdGhhdCBjYW4gYmUgdXNlZC5cclxuICogLSBTVkcgZmlsdGVyIGVsZW1lbnRzICh3aGljaCBhcmUgdmVyeSBmbGV4aWJsZSwgYSBjb21iaW5hdGlvbiBvZiBmaWx0ZXJzIG1heSBiZSBjb21iaW5lZCBpbnRvIFNWRyBmaWx0ZXIgZWxlbWVudHMpLlxyXG4gKiAgIFRoaXMgb25seSB3b3JrcyBpZiBBTEwgb2YgdGhlIGNvbnRlbnQgdW5kZXIgdGhlIGZpbHRlcihzKSBjYW4gYmUgcGxhY2VkIGluIG9uZSBTVkcgZWxlbWVudCwgc28gYSBsYXllclNwbGl0IG9yXHJcbiAqICAgbm9uLVNWRyBjb250ZW50IGNhbiBwcmV2ZW50IHRoaXMgZnJvbSBiZWluZyB1c2VkLlxyXG4gKiAtIENhbnZhcyBmaWx0ZXIgYXR0cmlidXRlIChzaW1pbGFyIHRvIERPTSBDU1MpLiBTaW1pbGFyIHRvIERPTSBDU1MsIGJ1dCBub3QgYXMgYWNjZWxlcmF0ZWQgKHJlcXVpcmVzIGFwcGx5aW5nIHRoZVxyXG4gKiAgIGZpbHRlciBieSBkcmF3aW5nIGludG8gYW5vdGhlciBDYW52YXMpLiBDaHJvbWl1bS1iYXNlZCBicm93c2VycyBzZWVtIHRvIGhhdmUgaXNzdWVzIHdpdGggdGhlIGNvbG9yIHNwYWNlIHVzZWQsXHJcbiAqICAgc28gdGhpcyBjYW4ndCBiZSB1c2VkIG9uIHRoYXQgcGxhdGZvcm0uIEFkZGl0aW9uYWxseSwgdGhpcyBvbmx5IHdvcmtzIGlmIEFMTCB0aGUgY29udGVudCB1bmRlciB0aGUgZmlsdGVyKHMpIGNhblxyXG4gKiAgIGJlIHBsYWNlZCBpbiBvbmUgQ2FudmFzLCBzbyBhIGxheWVyU3BsaXQgb3Igbm9uLVNWRyBjb250ZW50IGNhbiBwcmV2ZW50IHRoaXMgZnJvbSBiZWluZyB1c2VkLlxyXG4gKiAtIENhbnZhcyBJbWFnZURhdGEuIFRoaXMgaXMgYSBmYWxsYmFjayB3aGVyZSB3ZSBkaXJlY3RseSBnZXQsIG1hbmlwdWxhdGUsIGFuZCBzZXQgcGl4ZWwgZGF0YSBpbiBhIENhbnZhcyAod2l0aCB0aGVcclxuICogICBjb3JyZXNwb25kaW5nIHBlcmZvcm1hbmNlIGhpdCB0aGF0IGl0IHRha2VzIHRvIENQVS1wcm9jZXNzIGV2ZXJ5IHBpeGVsKS4gQWRkaXRpb25hbGx5LCB0aGlzIG9ubHkgd29ya3MgaWYgQUxMIHRoZVxyXG4gKiAgIGNvbnRlbnQgdW5kZXIgdGhlIGZpbHRlcihzKSBjYW4gICBiZSBwbGFjZWQgaW4gb25lIENhbnZhcywgc28gYSBsYXllclNwbGl0IG9yIG5vbi1TVkcgY29udGVudCBjYW4gcHJldmVudCB0aGlzIGZyb21cclxuICogICBiZWluZyB1c2VkLlxyXG4gKlxyXG4gKiBTb21lIGZpbHRlcnMgbWF5IGhhdmUgc2xpZ2h0bHkgZGlmZmVyZW50IGFwcGVhcmFuY2VzIGRlcGVuZGluZyBvbiB0aGUgYnJvd3Nlci9wbGF0Zm9ybS9yZW5kZXJlci5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCB7IENhbnZhc0NvbnRleHRXcmFwcGVyLCBGZWF0dXJlcywgc2NlbmVyeSwgc3ZnbnMgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuXHJcbmxldCBnbG9iYWxJZCA9IDE7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBGaWx0ZXIge1xyXG5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgcmVhZG9ubHkgaWQ6IHN0cmluZztcclxuXHJcbiAgLy8gQ2FuIGJlIG11dGF0ZWQgYnkgc3VidHlwZXMsIGRldGVybWluZXMgd2hhdCBmaWx0ZXIgcmVnaW9uIGluY3JlYXNlcyBzaG91bGQgYmUgdXNlZCBmb3Igd2hlbiBTVkcgaXMgdXNlZCBmb3JcclxuICAvLyByZW5kZXJpbmcuXHJcbiAgcHVibGljIGZpbHRlclJlZ2lvblBlcmNlbnRhZ2VJbmNyZWFzZTogbnVtYmVyO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLmlkID0gYGZpbHRlciR7Z2xvYmFsSWQrK31gO1xyXG4gICAgdGhpcy5maWx0ZXJSZWdpb25QZXJjZW50YWdlSW5jcmVhc2UgPSAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgQ1NTLXN0eWxlIGZpbHRlciBzdWJzdHJpbmcgc3BlY2lmaWMgdG8gdGhpcyBzaW5nbGUgZmlsdGVyLCBlLmcuIGBncmF5c2NhbGUoMSlgLiBUaGlzIHNob3VsZCBiZSB1c2VkIGZvclxyXG4gICAqIGJvdGggRE9NIGVsZW1lbnRzIChodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvZmlsdGVyKSBhbmQgd2hlbiBzdXBwb3J0ZWQsIENhbnZhc1xyXG4gICAqIChodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEL2ZpbHRlcikuXHJcbiAgICovXHJcbiAgcHVibGljIGFic3RyYWN0IGdldENTU0ZpbHRlclN0cmluZygpOiBzdHJpbmc7XHJcblxyXG4gIC8qKlxyXG4gICAqIEFwcGVuZHMgZmlsdGVyIHN1Yi1lbGVtZW50cyBpbnRvIHRoZSBTVkcgZmlsdGVyIGVsZW1lbnQgcHJvdmlkZWQuIFNob3VsZCBpbmNsdWRlIGFuIGluPSR7aW5OYW1lfSBmb3IgYWxsIGlucHV0cyxcclxuICAgKiBhbmQgc2hvdWxkIGVpdGhlciBvdXRwdXQgdXNpbmcgdGhlIHJlc3VsdE5hbWUgKG9yIGlmIG5vdCBwcm92aWRlZCwgdGhlIGxhc3QgZWxlbWVudCBhcHBlbmRlZCBzaG91bGQgYmUgdGhlIG91dHB1dCkuXHJcbiAgICogVGhpcyBlZmZlY3RpdmVseSBtdXRhdGVzIHRoZSBwcm92aWRlZCBmaWx0ZXIgb2JqZWN0LCBhbmQgd2lsbCBiZSBzdWNjZXNzaXZlbHkgY2FsbGVkIG9uIGFsbCBGaWx0ZXJzIHRvIGJ1aWxkIGFuXHJcbiAgICogU1ZHIGZpbHRlciBvYmplY3QuXHJcbiAgICovXHJcbiAgcHVibGljIGFic3RyYWN0IGFwcGx5U1ZHRmlsdGVyKCBzdmdGaWx0ZXI6IFNWR0ZpbHRlckVsZW1lbnQsIGluTmFtZTogc3RyaW5nLCByZXN1bHROYW1lPzogc3RyaW5nICk6IHZvaWQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGEgc3BlY2lmaWMgY2FudmFzL2NvbnRleHQgd3JhcHBlciwgdGhpcyBtZXRob2Qgc2hvdWxkIG11dGF0ZSBpdHMgc3RhdGUgc28gdGhhdCB0aGUgY2FudmFzIG5vdyBob2xkcyB0aGVcclxuICAgKiBmaWx0ZXJlZCBjb250ZW50LiBVc3VhbGx5IHRoaXMgd291bGQgYmUgYnkgdXNpbmcgZ2V0SW1hZ2VEYXRhL3B1dEltYWdlRGF0YSwgaG93ZXZlciByZWRyYXdpbmcgb3Igb3RoZXIgb3BlcmF0aW9uc1xyXG4gICAqIGFyZSBhbHNvIHBvc3NpYmxlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhYnN0cmFjdCBhcHBseUNhbnZhc0ZpbHRlciggd3JhcHBlcjogQ2FudmFzQ29udGV4dFdyYXBwZXIgKTogdm9pZDtcclxuXHJcbiAgcHVibGljIGlzRE9NQ29tcGF0aWJsZSgpOiBib29sZWFuIHtcclxuICAgIC8vIFRPRE86IFdlIGNhbiBicm93c2VyLWNoZWNrIG9uIHRoaW5ncyBsaWtlIGNvbG9yIG1hdHJpeD8gQnV0IHdlIHdhbnQgdG8gZGlzYWxsb3cgdGhpbmdzIHRoYXQgd2UgY2FuJ3QgZ3VhcmFudGVlIHdlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAvLyBjYW4gc3VwcG9ydD9cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBpc1NWR0NvbXBhdGlibGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaXNDYW52YXNDb21wYXRpYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIEZlYXR1cmVzLmNhbnZhc0ZpbHRlciA/IHRoaXMuaXNET01Db21wYXRpYmxlKCkgOiBmYWxzZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBpc1dlYkdMQ29tcGF0aWJsZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBzdHJpbmcgZm9ybSBvZiB0aGlzIG9iamVjdFxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMuaWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcHBsaWVzIGEgY29sb3IgbWF0cml4IGVmZmVjdCBpbnRvIGFuIGV4aXN0aW5nIFNWRyBmaWx0ZXIuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBhcHBseUNvbG9yTWF0cml4KCBtYXRyaXhWYWx1ZXM6IHN0cmluZywgc3ZnRmlsdGVyOiBTVkdGaWx0ZXJFbGVtZW50LCBpbk5hbWU6IHN0cmluZywgcmVzdWx0TmFtZT86IHN0cmluZyApOiB2b2lkIHtcclxuICAgIGNvbnN0IGZlQ29sb3JNYXRyaXggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoIHN2Z25zLCAnZmVDb2xvck1hdHJpeCcgKTtcclxuXHJcbiAgICBmZUNvbG9yTWF0cml4LnNldEF0dHJpYnV0ZSggJ3R5cGUnLCAnbWF0cml4JyApO1xyXG4gICAgZmVDb2xvck1hdHJpeC5zZXRBdHRyaWJ1dGUoICd2YWx1ZXMnLCBtYXRyaXhWYWx1ZXMgKTtcclxuICAgIGZlQ29sb3JNYXRyaXguc2V0QXR0cmlidXRlKCAnaW4nLCBpbk5hbWUgKTtcclxuXHJcbiAgICAvLyBTaW5jZSB0aGUgRE9NIGVmZmVjdHMgYXJlIGRvbmUgd2l0aCBzUkdCIGFuZCB3ZSBjYW4ndCBtYW5pcHVsYXRlIHRoYXQsIHdlJ2xsIGluc3RlYWQgYWRqdXN0IFNWRyB0byBhcHBseSB0aGVcclxuICAgIC8vIGVmZmVjdHMgaW4gc1JHQiBzbyB0aGF0IHdlIGhhdmUgY29uc2lzdGVuY3lcclxuICAgIGZlQ29sb3JNYXRyaXguc2V0QXR0cmlidXRlKCAnY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzJywgJ3NSR0InICk7XHJcblxyXG4gICAgaWYgKCByZXN1bHROYW1lICkge1xyXG4gICAgICBmZUNvbG9yTWF0cml4LnNldEF0dHJpYnV0ZSggJ3Jlc3VsdCcsIHJlc3VsdE5hbWUgKTtcclxuICAgIH1cclxuICAgIHN2Z0ZpbHRlci5hcHBlbmRDaGlsZCggZmVDb2xvck1hdHJpeCApO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0ZpbHRlcicsIEZpbHRlciApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUErQkEsUUFBUSxFQUFFQyxPQUFPLEVBQUVDLEtBQUssUUFBUSxlQUFlO0FBRTlFLElBQUlDLFFBQVEsR0FBRyxDQUFDO0FBRWhCLGVBQWUsTUFBZUMsTUFBTSxDQUFDO0VBRW5DOztFQUdBO0VBQ0E7O0VBR09DLFdBQVdBLENBQUEsRUFBRztJQUNuQixJQUFJLENBQUNDLEVBQUUsR0FBSSxTQUFRSCxRQUFRLEVBQUcsRUFBQztJQUMvQixJQUFJLENBQUNJLDhCQUE4QixHQUFHLENBQUM7RUFDekM7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTs7RUFHRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0VBR0U7QUFDRjtBQUNBO0FBQ0E7QUFDQTs7RUFHU0MsZUFBZUEsQ0FBQSxFQUFZO0lBQ2hDO0lBQ0E7SUFDQSxPQUFPLEtBQUs7RUFDZDtFQUVPQyxlQUFlQSxDQUFBLEVBQVk7SUFDaEMsT0FBTyxLQUFLO0VBQ2Q7RUFFT0Msa0JBQWtCQSxDQUFBLEVBQVk7SUFDbkMsT0FBT1YsUUFBUSxDQUFDVyxZQUFZLEdBQUcsSUFBSSxDQUFDSCxlQUFlLENBQUMsQ0FBQyxHQUFHLEtBQUs7RUFDL0Q7RUFFT0ksaUJBQWlCQSxDQUFBLEVBQVk7SUFDbEMsT0FBTyxLQUFLO0VBQ2Q7O0VBRUE7QUFDRjtBQUNBO0VBQ1NDLFFBQVFBLENBQUEsRUFBVztJQUN4QixPQUFPLElBQUksQ0FBQ1AsRUFBRTtFQUNoQjs7RUFFQTtBQUNGO0FBQ0E7RUFDRSxPQUFjUSxnQkFBZ0JBLENBQUVDLFlBQW9CLEVBQUVDLFNBQTJCLEVBQUVDLE1BQWMsRUFBRUMsVUFBbUIsRUFBUztJQUM3SCxNQUFNQyxhQUFhLEdBQUdDLFFBQVEsQ0FBQ0MsZUFBZSxDQUFFbkIsS0FBSyxFQUFFLGVBQWdCLENBQUM7SUFFeEVpQixhQUFhLENBQUNHLFlBQVksQ0FBRSxNQUFNLEVBQUUsUUFBUyxDQUFDO0lBQzlDSCxhQUFhLENBQUNHLFlBQVksQ0FBRSxRQUFRLEVBQUVQLFlBQWEsQ0FBQztJQUNwREksYUFBYSxDQUFDRyxZQUFZLENBQUUsSUFBSSxFQUFFTCxNQUFPLENBQUM7O0lBRTFDO0lBQ0E7SUFDQUUsYUFBYSxDQUFDRyxZQUFZLENBQUUsNkJBQTZCLEVBQUUsTUFBTyxDQUFDO0lBRW5FLElBQUtKLFVBQVUsRUFBRztNQUNoQkMsYUFBYSxDQUFDRyxZQUFZLENBQUUsUUFBUSxFQUFFSixVQUFXLENBQUM7SUFDcEQ7SUFDQUYsU0FBUyxDQUFDTyxXQUFXLENBQUVKLGFBQWMsQ0FBQztFQUN4QztBQUNGO0FBRUFsQixPQUFPLENBQUN1QixRQUFRLENBQUUsUUFBUSxFQUFFcEIsTUFBTyxDQUFDIiwiaWdub3JlTGlzdCI6W119