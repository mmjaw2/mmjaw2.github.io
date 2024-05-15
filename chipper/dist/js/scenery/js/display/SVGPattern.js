// Copyright 2017-2024, University of Colorado Boulder

/**
 * Creates an SVG pattern element for a given pattern.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Pool from '../../../phet-core/js/Pool.js';
import { scenery, svgns, xlinkns } from '../imports.js';
export default class SVGPattern {
  // persistent

  constructor(pattern) {
    this.initialize(pattern);
  }
  initialize(pattern) {
    sceneryLog && sceneryLog.Paints && sceneryLog.Paints(`[SVGPattern] initialize: ${pattern.id}`);
    sceneryLog && sceneryLog.Paints && sceneryLog.push();
    const hasPreviousDefinition = this.definition !== undefined;
    this.definition = this.definition || document.createElementNS(svgns, 'pattern');
    if (!hasPreviousDefinition) {
      // so we don't depend on the bounds of the object being drawn with the pattern
      this.definition.setAttribute('patternUnits', 'userSpaceOnUse');

      //TODO: is this needed? https://github.com/phetsims/scenery/issues/1581
      this.definition.setAttribute('patternContentUnits', 'userSpaceOnUse');
    }
    if (pattern.transformMatrix) {
      this.definition.setAttribute('patternTransform', pattern.transformMatrix.getSVGTransform());
    } else {
      this.definition.removeAttribute('patternTransform');
    }
    this.definition.setAttribute('x', '0');
    this.definition.setAttribute('y', '0');
    this.definition.setAttribute('width', '' + pattern.image.width);
    this.definition.setAttribute('height', '' + pattern.image.height);
    this.imageElement = this.imageElement || document.createElementNS(svgns, 'image');
    this.imageElement.setAttribute('x', '0');
    this.imageElement.setAttribute('y', '0');
    this.imageElement.setAttribute('width', `${pattern.image.width}px`);
    this.imageElement.setAttribute('height', `${pattern.image.height}px`);
    this.imageElement.setAttributeNS(xlinkns, 'xlink:href', pattern.image.src);
    if (!hasPreviousDefinition) {
      this.definition.appendChild(this.imageElement);
    }
    sceneryLog && sceneryLog.Paints && sceneryLog.pop();
    return this;
  }

  /**
   * Called from SVGBlock, matches other paints.
   */
  update() {
    // Nothing
  }

  /**
   * Disposes, so that it can be reused from the pool.
   */
  dispose() {
    this.freeToPool();
  }
  freeToPool() {
    SVGPattern.pool.freeToPool(this);
  }
  static pool = new Pool(SVGPattern);
}
scenery.register('SVGPattern', SVGPattern);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQb29sIiwic2NlbmVyeSIsInN2Z25zIiwieGxpbmtucyIsIlNWR1BhdHRlcm4iLCJjb25zdHJ1Y3RvciIsInBhdHRlcm4iLCJpbml0aWFsaXplIiwic2NlbmVyeUxvZyIsIlBhaW50cyIsImlkIiwicHVzaCIsImhhc1ByZXZpb3VzRGVmaW5pdGlvbiIsImRlZmluaXRpb24iLCJ1bmRlZmluZWQiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnROUyIsInNldEF0dHJpYnV0ZSIsInRyYW5zZm9ybU1hdHJpeCIsImdldFNWR1RyYW5zZm9ybSIsInJlbW92ZUF0dHJpYnV0ZSIsImltYWdlIiwid2lkdGgiLCJoZWlnaHQiLCJpbWFnZUVsZW1lbnQiLCJzZXRBdHRyaWJ1dGVOUyIsInNyYyIsImFwcGVuZENoaWxkIiwicG9wIiwidXBkYXRlIiwiZGlzcG9zZSIsImZyZWVUb1Bvb2wiLCJwb29sIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJTVkdQYXR0ZXJuLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYW4gU1ZHIHBhdHRlcm4gZWxlbWVudCBmb3IgYSBnaXZlbiBwYXR0ZXJuLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IFBvb2wsIHsgVFBvb2xhYmxlIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL1Bvb2wuanMnO1xyXG5pbXBvcnQgeyBQYXR0ZXJuLCBzY2VuZXJ5LCBzdmducywgeGxpbmtucyB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU1ZHUGF0dGVybiBpbXBsZW1lbnRzIFRQb29sYWJsZSB7XHJcblxyXG4gIC8vIHBlcnNpc3RlbnRcclxuICBwdWJsaWMgZGVmaW5pdGlvbiE6IFNWR1BhdHRlcm5FbGVtZW50O1xyXG4gIHByaXZhdGUgaW1hZ2VFbGVtZW50ITogU1ZHSW1hZ2VFbGVtZW50O1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHBhdHRlcm46IFBhdHRlcm4gKSB7XHJcbiAgICB0aGlzLmluaXRpYWxpemUoIHBhdHRlcm4gKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBpbml0aWFsaXplKCBwYXR0ZXJuOiBQYXR0ZXJuICk6IHRoaXMge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBhaW50cyAmJiBzY2VuZXJ5TG9nLlBhaW50cyggYFtTVkdQYXR0ZXJuXSBpbml0aWFsaXplOiAke3BhdHRlcm4uaWR9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBhaW50cyAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBjb25zdCBoYXNQcmV2aW91c0RlZmluaXRpb24gPSB0aGlzLmRlZmluaXRpb24gIT09IHVuZGVmaW5lZDtcclxuXHJcbiAgICB0aGlzLmRlZmluaXRpb24gPSB0aGlzLmRlZmluaXRpb24gfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCBzdmducywgJ3BhdHRlcm4nICk7XHJcblxyXG4gICAgaWYgKCAhaGFzUHJldmlvdXNEZWZpbml0aW9uICkge1xyXG4gICAgICAvLyBzbyB3ZSBkb24ndCBkZXBlbmQgb24gdGhlIGJvdW5kcyBvZiB0aGUgb2JqZWN0IGJlaW5nIGRyYXduIHdpdGggdGhlIHBhdHRlcm5cclxuICAgICAgdGhpcy5kZWZpbml0aW9uLnNldEF0dHJpYnV0ZSggJ3BhdHRlcm5Vbml0cycsICd1c2VyU3BhY2VPblVzZScgKTtcclxuXHJcbiAgICAgIC8vVE9ETzogaXMgdGhpcyBuZWVkZWQ/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIHRoaXMuZGVmaW5pdGlvbi5zZXRBdHRyaWJ1dGUoICdwYXR0ZXJuQ29udGVudFVuaXRzJywgJ3VzZXJTcGFjZU9uVXNlJyApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggcGF0dGVybi50cmFuc2Zvcm1NYXRyaXggKSB7XHJcbiAgICAgIHRoaXMuZGVmaW5pdGlvbi5zZXRBdHRyaWJ1dGUoICdwYXR0ZXJuVHJhbnNmb3JtJywgcGF0dGVybi50cmFuc2Zvcm1NYXRyaXguZ2V0U1ZHVHJhbnNmb3JtKCkgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmRlZmluaXRpb24ucmVtb3ZlQXR0cmlidXRlKCAncGF0dGVyblRyYW5zZm9ybScgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmRlZmluaXRpb24uc2V0QXR0cmlidXRlKCAneCcsICcwJyApO1xyXG4gICAgdGhpcy5kZWZpbml0aW9uLnNldEF0dHJpYnV0ZSggJ3knLCAnMCcgKTtcclxuICAgIHRoaXMuZGVmaW5pdGlvbi5zZXRBdHRyaWJ1dGUoICd3aWR0aCcsICcnICsgcGF0dGVybi5pbWFnZS53aWR0aCApO1xyXG4gICAgdGhpcy5kZWZpbml0aW9uLnNldEF0dHJpYnV0ZSggJ2hlaWdodCcsICcnICsgcGF0dGVybi5pbWFnZS5oZWlnaHQgKTtcclxuXHJcbiAgICB0aGlzLmltYWdlRWxlbWVudCA9IHRoaXMuaW1hZ2VFbGVtZW50IHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyggc3ZnbnMsICdpbWFnZScgKTtcclxuICAgIHRoaXMuaW1hZ2VFbGVtZW50LnNldEF0dHJpYnV0ZSggJ3gnLCAnMCcgKTtcclxuICAgIHRoaXMuaW1hZ2VFbGVtZW50LnNldEF0dHJpYnV0ZSggJ3knLCAnMCcgKTtcclxuICAgIHRoaXMuaW1hZ2VFbGVtZW50LnNldEF0dHJpYnV0ZSggJ3dpZHRoJywgYCR7cGF0dGVybi5pbWFnZS53aWR0aH1weGAgKTtcclxuICAgIHRoaXMuaW1hZ2VFbGVtZW50LnNldEF0dHJpYnV0ZSggJ2hlaWdodCcsIGAke3BhdHRlcm4uaW1hZ2UuaGVpZ2h0fXB4YCApO1xyXG4gICAgdGhpcy5pbWFnZUVsZW1lbnQuc2V0QXR0cmlidXRlTlMoIHhsaW5rbnMsICd4bGluazpocmVmJywgcGF0dGVybi5pbWFnZS5zcmMgKTtcclxuICAgIGlmICggIWhhc1ByZXZpb3VzRGVmaW5pdGlvbiApIHtcclxuICAgICAgdGhpcy5kZWZpbml0aW9uLmFwcGVuZENoaWxkKCB0aGlzLmltYWdlRWxlbWVudCApO1xyXG4gICAgfVxyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QYWludHMgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCBmcm9tIFNWR0Jsb2NrLCBtYXRjaGVzIG90aGVyIHBhaW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgdXBkYXRlKCk6IHZvaWQge1xyXG4gICAgLy8gTm90aGluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGlzcG9zZXMsIHNvIHRoYXQgaXQgY2FuIGJlIHJldXNlZCBmcm9tIHRoZSBwb29sLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5mcmVlVG9Qb29sKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZnJlZVRvUG9vbCgpOiB2b2lkIHtcclxuICAgIFNWR1BhdHRlcm4ucG9vbC5mcmVlVG9Qb29sKCB0aGlzICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IHBvb2wgPSBuZXcgUG9vbCggU1ZHUGF0dGVybiApO1xyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnU1ZHUGF0dGVybicsIFNWR1BhdHRlcm4gKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsSUFBSSxNQUFxQiwrQkFBK0I7QUFDL0QsU0FBa0JDLE9BQU8sRUFBRUMsS0FBSyxFQUFFQyxPQUFPLFFBQVEsZUFBZTtBQUVoRSxlQUFlLE1BQU1D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