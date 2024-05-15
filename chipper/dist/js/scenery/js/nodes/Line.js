// Copyright 2013-2024, University of Colorado Boulder

/**
 * Displays a (stroked) line. Inherits Path, and allows for optimized drawing and improved parameter handling.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../../dot/js/Bounds2.js';
import Vector2 from '../../../dot/js/Vector2.js';
import { Shape } from '../../../kite/js/imports.js';
import extendDefined from '../../../phet-core/js/extendDefined.js';
import { LineCanvasDrawable, LineSVGDrawable, Path, Renderer, scenery } from '../imports.js';
const LINE_OPTION_KEYS = ['p1',
// {Vector2} - Start position
'p2',
// {Vector2} - End position
'x1',
// {number} - Start x position
'y1',
// {number} - Start y position
'x2',
// {number} - End x position
'y2' // {number} - End y position
];
export default class Line extends Path {
  // The x coordinate of the start point (point 1)

  // The Y coordinate of the start point (point 1)

  // The x coordinate of the start point (point 2)

  // The y coordinate of the start point (point 2)

  constructor(x1, y1, x2, y2, options) {
    super(null);
    this._x1 = 0;
    this._y1 = 0;
    this._x2 = 0;
    this._y2 = 0;

    // Remap constructor parameters to options
    if (typeof x1 === 'object') {
      if (x1 instanceof Vector2) {
        // assumes Line( Vector2, Vector2, options ), where x2 is our options
        assert && assert(x2 === undefined || typeof x2 === 'object');
        assert && assert(x2 === undefined || Object.getPrototypeOf(x2) === Object.prototype, 'Extra prototype on Node options object is a code smell');
        options = extendDefined({
          // First Vector2 is under the x1 name
          x1: x1.x,
          y1: x1.y,
          // Second Vector2 is under the y1 name
          x2: y1.x,
          y2: y1.y,
          strokePickable: true
        }, x2); // Options object (if available) is under the x2 name
      } else {
        // assumes Line( { ... } ), init to zero for now
        assert && assert(y1 === undefined);

        // Options object is under the x1 name
        assert && assert(x1 === undefined || Object.getPrototypeOf(x1) === Object.prototype, 'Extra prototype on Node options object is a code smell');
        options = extendDefined({
          strokePickable: true
        }, x1); // Options object (if available) is under the x1 name
      }
    } else {
      // new Line( x1, y1, x2, y2, [options] )
      assert && assert(x1 !== undefined && typeof y1 === 'number' && typeof x2 === 'number' && typeof y2 === 'number');
      assert && assert(options === undefined || Object.getPrototypeOf(options) === Object.prototype, 'Extra prototype on Node options object is a code smell');
      options = extendDefined({
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        strokePickable: true
      }, options);
    }
    this.mutate(options);
  }

  /**
   * Set all of the line's x and y values.
   *
   * @param x1 - the start x coordinate
   * @param y1 - the start y coordinate
   * @param x2 - the end x coordinate
   * @param y2 - the end y coordinate
   */
  setLine(x1, y1, x2, y2) {
    assert && assert(x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined, 'parameters need to be defined');
    this._x1 = x1;
    this._y1 = y1;
    this._x2 = x2;
    this._y2 = y2;
    const stateLen = this._drawables.length;
    for (let i = 0; i < stateLen; i++) {
      const state = this._drawables[i];
      state.markDirtyLine();
    }
    this.invalidateLine();
    return this;
  }

  /**
   * Set the line's first point's x and y values
   */

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  setPoint1(x1, y1) {
    // eslint-disable-line @typescript-eslint/explicit-member-accessibility
    if (typeof x1 === 'number') {
      // setPoint1( x1, y1 );
      assert && assert(x1 !== undefined && y1 !== undefined, 'parameters need to be defined');
      this._x1 = x1;
      this._y1 = y1;
    } else {
      // setPoint1( Vector2 )
      assert && assert(x1.x !== undefined && x1.y !== undefined, 'parameters need to be defined');
      this._x1 = x1.x;
      this._y1 = x1.y;
    }
    const numDrawables = this._drawables.length;
    for (let i = 0; i < numDrawables; i++) {
      this._drawables[i].markDirtyP1();
    }
    this.invalidateLine();
    return this;
  }
  set p1(point) {
    this.setPoint1(point);
  }
  get p1() {
    return new Vector2(this._x1, this._y1);
  }

  /**
   * Set the line's second point's x and y values
   */

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  setPoint2(x2, y2) {
    // eslint-disable-line @typescript-eslint/explicit-member-accessibility
    if (typeof x2 === 'number') {
      // setPoint2( x2, y2 );
      assert && assert(x2 !== undefined && y2 !== undefined, 'parameters need to be defined');
      this._x2 = x2;
      this._y2 = y2;
    } else {
      // setPoint2( Vector2 )
      assert && assert(x2.x !== undefined && x2.y !== undefined, 'parameters need to be defined');
      this._x2 = x2.x;
      this._y2 = x2.y;
    }
    const numDrawables = this._drawables.length;
    for (let i = 0; i < numDrawables; i++) {
      this._drawables[i].markDirtyP2();
    }
    this.invalidateLine();
    return this;
  }
  set p2(point) {
    this.setPoint2(point);
  }
  get p2() {
    return new Vector2(this._x2, this._y2);
  }

  /**
   * Sets the x coordinate of the first point of the line.
   */
  setX1(x1) {
    if (this._x1 !== x1) {
      this._x1 = x1;
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyX1();
      }
      this.invalidateLine();
    }
    return this;
  }
  set x1(value) {
    this.setX1(value);
  }
  get x1() {
    return this.getX1();
  }

  /**
   * Returns the x coordinate of the first point of the line.
   */
  getX1() {
    return this._x1;
  }

  /**
   * Sets the y coordinate of the first point of the line.
   */
  setY1(y1) {
    if (this._y1 !== y1) {
      this._y1 = y1;
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyY1();
      }
      this.invalidateLine();
    }
    return this;
  }
  set y1(value) {
    this.setY1(value);
  }
  get y1() {
    return this.getY1();
  }

  /**
   * Returns the y coordinate of the first point of the line.
   */
  getY1() {
    return this._y1;
  }

  /**
   * Sets the x coordinate of the second point of the line.
   */
  setX2(x2) {
    if (this._x2 !== x2) {
      this._x2 = x2;
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyX2();
      }
      this.invalidateLine();
    }
    return this;
  }
  set x2(value) {
    this.setX2(value);
  }
  get x2() {
    return this.getX2();
  }

  /**
   * Returns the x coordinate of the second point of the line.
   */
  getX2() {
    return this._x2;
  }

  /**
   * Sets the y coordinate of the second point of the line.
   */
  setY2(y2) {
    if (this._y2 !== y2) {
      this._y2 = y2;
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyY2();
      }
      this.invalidateLine();
    }
    return this;
  }
  set y2(value) {
    this.setY2(value);
  }
  get y2() {
    return this.getY2();
  }

  /**
   * Returns the y coordinate of the second point of the line.
   */
  getY2() {
    return this._y2;
  }

  /**
   * Returns a Shape that is equivalent to our rendered display. Generally used to lazily create a Shape instance
   * when one is needed, without having to do so beforehand.
   */
  createLineShape() {
    return Shape.lineSegment(this._x1, this._y1, this._x2, this._y2).makeImmutable();
  }

  /**
   * Notifies that the line has changed and invalidates path information and our cached shape.
   */
  invalidateLine() {
    assert && assert(isFinite(this._x1), `A line needs to have a finite x1 (${this._x1})`);
    assert && assert(isFinite(this._y1), `A line needs to have a finite y1 (${this._y1})`);
    assert && assert(isFinite(this._x2), `A line needs to have a finite x2 (${this._x2})`);
    assert && assert(isFinite(this._y2), `A line needs to have a finite y2 (${this._y2})`);

    // sets our 'cache' to null, so we don't always have to recompute our shape
    this._shape = null;

    // should invalidate the path and ensure a redraw
    this.invalidatePath();
  }

  /**
   * Computes whether the provided point is "inside" (contained) in this Line's self content, or "outside".
   *
   * Since an unstroked Line contains no area, we can quickly shortcut this operation.
   *
   * @param point - Considered to be in the local coordinate frame
   */
  containsPointSelf(point) {
    if (this._strokePickable) {
      return super.containsPointSelf(point);
    } else {
      return false; // nothing is in a line! (although maybe we should handle edge points properly?)
    }
  }

  /**
   * Draws the current Node's self representation, assuming the wrapper's Canvas context is already in the local
   * coordinate frame of this node.
   *
   * @param wrapper
   * @param matrix - The transformation matrix already applied to the context.
   */
  canvasPaintSelf(wrapper, matrix) {
    //TODO: Have a separate method for this, instead of touching the prototype. Can make 'this' references too easily. https://github.com/phetsims/scenery/issues/1581
    LineCanvasDrawable.prototype.paintCanvas(wrapper, this, matrix);
  }

  /**
   * Computes the bounds of the Line, including any applied stroke. Overridden for efficiency.
   */
  computeShapeBounds() {
    // optimized form for a single line segment (no joins, just two caps)
    if (this._stroke) {
      const lineCap = this.getLineCap();
      const halfLineWidth = this.getLineWidth() / 2;
      if (lineCap === 'round') {
        // we can simply dilate by half the line width
        return new Bounds2(Math.min(this._x1, this._x2) - halfLineWidth, Math.min(this._y1, this._y2) - halfLineWidth, Math.max(this._x1, this._x2) + halfLineWidth, Math.max(this._y1, this._y2) + halfLineWidth);
      } else {
        // (dx,dy) is a vector p2-p1
        const dx = this._x2 - this._x1;
        const dy = this._y2 - this._y1;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        if (magnitude === 0) {
          // if our line is a point, just dilate by halfLineWidth
          return new Bounds2(this._x1 - halfLineWidth, this._y1 - halfLineWidth, this._x2 + halfLineWidth, this._y2 + halfLineWidth);
        }
        // (sx,sy) is a vector with a magnitude of halfLineWidth pointed in the direction of (dx,dy)
        const sx = halfLineWidth * dx / magnitude;
        const sy = halfLineWidth * dy / magnitude;
        const bounds = Bounds2.NOTHING.copy();
        if (lineCap === 'butt') {
          // four points just using the perpendicular stroked offsets (sy,-sx) and (-sy,sx)
          bounds.addCoordinates(this._x1 - sy, this._y1 + sx);
          bounds.addCoordinates(this._x1 + sy, this._y1 - sx);
          bounds.addCoordinates(this._x2 - sy, this._y2 + sx);
          bounds.addCoordinates(this._x2 + sy, this._y2 - sx);
        } else {
          assert && assert(lineCap === 'square');

          // four points just using the perpendicular stroked offsets (sy,-sx) and (-sy,sx) and parallel stroked offsets
          bounds.addCoordinates(this._x1 - sx - sy, this._y1 - sy + sx);
          bounds.addCoordinates(this._x1 - sx + sy, this._y1 - sy - sx);
          bounds.addCoordinates(this._x2 + sx - sy, this._y2 + sy + sx);
          bounds.addCoordinates(this._x2 + sx + sy, this._y2 + sy - sx);
        }
        return bounds;
      }
    } else {
      // It might have a fill? Just include the fill bounds for now.
      const fillBounds = Bounds2.NOTHING.copy();
      fillBounds.addCoordinates(this._x1, this._y1);
      fillBounds.addCoordinates(this._x2, this._y2);
      return fillBounds;
    }
  }

  /**
   * Creates a SVG drawable for this Line.
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createSVGDrawable(renderer, instance) {
    // @ts-expect-error
    return LineSVGDrawable.createFromPool(renderer, instance);
  }

  /**
   * Creates a Canvas drawable for this Line.
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createCanvasDrawable(renderer, instance) {
    // @ts-expect-error
    return LineCanvasDrawable.createFromPool(renderer, instance);
  }

  /**
   * It is impossible to set another shape on this Path subtype, as its effective shape is determined by other
   * parameters.
   *
   * Throws an error if it is not null.
   */
  setShape(shape) {
    if (shape !== null) {
      throw new Error('Cannot set the shape of a Line to something non-null');
    } else {
      // probably called from the Path constructor
      this.invalidatePath();
    }
    return this;
  }

  /**
   * Returns an immutable copy of this Path subtype's representation.
   *
   * NOTE: This is created lazily, so don't call it if you don't have to!
   */
  getShape() {
    if (!this._shape) {
      this._shape = this.createLineShape();
    }
    return this._shape;
  }

  /**
   * Returns whether this Path has an associated Shape (instead of no shape, represented by null)
   */
  hasShape() {
    return true;
  }
  setShapeProperty(newTarget) {
    if (newTarget !== null) {
      throw new Error('Cannot set the shapeProperty of a Line to something non-null, it handles this itself');
    }
    return this;
  }
  mutate(options) {
    return super.mutate(options);
  }

  /**
   * Returns available fill renderers. (scenery-internal)
   *
   * Since our line can't be filled, we support all fill renderers.
   *
   * See Renderer for more information on the bitmasks
   */
  getFillRendererBitmask() {
    return Renderer.bitmaskCanvas | Renderer.bitmaskSVG | Renderer.bitmaskDOM | Renderer.bitmaskWebGL;
  }
}

/**
 * {Array.<string>} - String keys for all of the allowed options that will be set by node.mutate( options ), in the
 * order they will be evaluated in.
 *
 * NOTE: See Node's _mutatorKeys documentation for more information on how this operates, and potential special
 *       cases that may apply.
 */
Line.prototype._mutatorKeys = LINE_OPTION_KEYS.concat(Path.prototype._mutatorKeys);

/**
 * {Array.<String>} - List of all dirty flags that should be available on drawables created from this node (or
 *                    subtype). Given a flag (e.g. radius), it indicates the existence of a function
 *                    drawable.markDirtyRadius() that will indicate to the drawable that the radius has changed.
 * (scenery-internal)
 * @override
 */
Line.prototype.drawableMarkFlags = Path.prototype.drawableMarkFlags.concat(['line', 'p1', 'p2', 'x1', 'x2', 'y1', 'y2']).filter(flag => flag !== 'shape');
scenery.register('Line', Line);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiVmVjdG9yMiIsIlNoYXBlIiwiZXh0ZW5kRGVmaW5lZCIsIkxpbmVDYW52YXNEcmF3YWJsZSIsIkxpbmVTVkdEcmF3YWJsZSIsIlBhdGgiLCJSZW5kZXJlciIsInNjZW5lcnkiLCJMSU5FX09QVElPTl9LRVlTIiwiTGluZSIsImNvbnN0cnVjdG9yIiwieDEiLCJ5MSIsIngyIiwieTIiLCJvcHRpb25zIiwiX3gxIiwiX3kxIiwiX3gyIiwiX3kyIiwiYXNzZXJ0IiwidW5kZWZpbmVkIiwiT2JqZWN0IiwiZ2V0UHJvdG90eXBlT2YiLCJwcm90b3R5cGUiLCJ4IiwieSIsInN0cm9rZVBpY2thYmxlIiwibXV0YXRlIiwic2V0TGluZSIsInN0YXRlTGVuIiwiX2RyYXdhYmxlcyIsImxlbmd0aCIsImkiLCJzdGF0ZSIsIm1hcmtEaXJ0eUxpbmUiLCJpbnZhbGlkYXRlTGluZSIsInNldFBvaW50MSIsIm51bURyYXdhYmxlcyIsIm1hcmtEaXJ0eVAxIiwicDEiLCJwb2ludCIsInNldFBvaW50MiIsIm1hcmtEaXJ0eVAyIiwicDIiLCJzZXRYMSIsIm1hcmtEaXJ0eVgxIiwidmFsdWUiLCJnZXRYMSIsInNldFkxIiwibWFya0RpcnR5WTEiLCJnZXRZMSIsInNldFgyIiwibWFya0RpcnR5WDIiLCJnZXRYMiIsInNldFkyIiwibWFya0RpcnR5WTIiLCJnZXRZMiIsImNyZWF0ZUxpbmVTaGFwZSIsImxpbmVTZWdtZW50IiwibWFrZUltbXV0YWJsZSIsImlzRmluaXRlIiwiX3NoYXBlIiwiaW52YWxpZGF0ZVBhdGgiLCJjb250YWluc1BvaW50U2VsZiIsIl9zdHJva2VQaWNrYWJsZSIsImNhbnZhc1BhaW50U2VsZiIsIndyYXBwZXIiLCJtYXRyaXgiLCJwYWludENhbnZhcyIsImNvbXB1dGVTaGFwZUJvdW5kcyIsIl9zdHJva2UiLCJsaW5lQ2FwIiwiZ2V0TGluZUNhcCIsImhhbGZMaW5lV2lkdGgiLCJnZXRMaW5lV2lkdGgiLCJNYXRoIiwibWluIiwibWF4IiwiZHgiLCJkeSIsIm1hZ25pdHVkZSIsInNxcnQiLCJzeCIsInN5IiwiYm91bmRzIiwiTk9USElORyIsImNvcHkiLCJhZGRDb29yZGluYXRlcyIsImZpbGxCb3VuZHMiLCJjcmVhdGVTVkdEcmF3YWJsZSIsInJlbmRlcmVyIiwiaW5zdGFuY2UiLCJjcmVhdGVGcm9tUG9vbCIsImNyZWF0ZUNhbnZhc0RyYXdhYmxlIiwic2V0U2hhcGUiLCJzaGFwZSIsIkVycm9yIiwiZ2V0U2hhcGUiLCJoYXNTaGFwZSIsInNldFNoYXBlUHJvcGVydHkiLCJuZXdUYXJnZXQiLCJnZXRGaWxsUmVuZGVyZXJCaXRtYXNrIiwiYml0bWFza0NhbnZhcyIsImJpdG1hc2tTVkciLCJiaXRtYXNrRE9NIiwiYml0bWFza1dlYkdMIiwiX211dGF0b3JLZXlzIiwiY29uY2F0IiwiZHJhd2FibGVNYXJrRmxhZ3MiLCJmaWx0ZXIiLCJmbGFnIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJMaW5lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIERpc3BsYXlzIGEgKHN0cm9rZWQpIGxpbmUuIEluaGVyaXRzIFBhdGgsIGFuZCBhbGxvd3MgZm9yIG9wdGltaXplZCBkcmF3aW5nIGFuZCBpbXByb3ZlZCBwYXJhbWV0ZXIgaGFuZGxpbmcuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSAnLi4vLi4vLi4va2l0ZS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IGV4dGVuZERlZmluZWQgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2V4dGVuZERlZmluZWQuanMnO1xyXG5pbXBvcnQgeyBDYW52YXNDb250ZXh0V3JhcHBlciwgQ2FudmFzU2VsZkRyYXdhYmxlLCBJbnN0YW5jZSwgTGluZUNhbnZhc0RyYXdhYmxlLCBMaW5lU1ZHRHJhd2FibGUsIFBhdGgsIFBhdGhPcHRpb25zLCBSZW5kZXJlciwgc2NlbmVyeSwgU1ZHU2VsZkRyYXdhYmxlLCBUTGluZURyYXdhYmxlIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuXHJcbmNvbnN0IExJTkVfT1BUSU9OX0tFWVMgPSBbXHJcbiAgJ3AxJywgLy8ge1ZlY3RvcjJ9IC0gU3RhcnQgcG9zaXRpb25cclxuICAncDInLCAvLyB7VmVjdG9yMn0gLSBFbmQgcG9zaXRpb25cclxuICAneDEnLCAvLyB7bnVtYmVyfSAtIFN0YXJ0IHggcG9zaXRpb25cclxuICAneTEnLCAvLyB7bnVtYmVyfSAtIFN0YXJ0IHkgcG9zaXRpb25cclxuICAneDInLCAvLyB7bnVtYmVyfSAtIEVuZCB4IHBvc2l0aW9uXHJcbiAgJ3kyJyAvLyB7bnVtYmVyfSAtIEVuZCB5IHBvc2l0aW9uXHJcbl07XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0ge1xyXG4gIHAxPzogVmVjdG9yMjtcclxuICBwMj86IFZlY3RvcjI7XHJcbiAgeDE/OiBudW1iZXI7XHJcbiAgeTE/OiBudW1iZXI7XHJcbiAgeDI/OiBudW1iZXI7XHJcbiAgeTI/OiBudW1iZXI7XHJcbn07XHJcbmV4cG9ydCB0eXBlIExpbmVPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBTdHJpY3RPbWl0PFBhdGhPcHRpb25zLCAnc2hhcGUnIHwgJ3NoYXBlUHJvcGVydHknPjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpbmUgZXh0ZW5kcyBQYXRoIHtcclxuXHJcbiAgLy8gVGhlIHggY29vcmRpbmF0ZSBvZiB0aGUgc3RhcnQgcG9pbnQgKHBvaW50IDEpXHJcbiAgcHJpdmF0ZSBfeDE6IG51bWJlcjtcclxuXHJcbiAgLy8gVGhlIFkgY29vcmRpbmF0ZSBvZiB0aGUgc3RhcnQgcG9pbnQgKHBvaW50IDEpXHJcbiAgcHJpdmF0ZSBfeTE6IG51bWJlcjtcclxuXHJcbiAgLy8gVGhlIHggY29vcmRpbmF0ZSBvZiB0aGUgc3RhcnQgcG9pbnQgKHBvaW50IDIpXHJcbiAgcHJpdmF0ZSBfeDI6IG51bWJlcjtcclxuXHJcbiAgLy8gVGhlIHkgY29vcmRpbmF0ZSBvZiB0aGUgc3RhcnQgcG9pbnQgKHBvaW50IDIpXHJcbiAgcHJpdmF0ZSBfeTI6IG51bWJlcjtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBvcHRpb25zPzogTGluZU9wdGlvbnMgKTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHAxOiBWZWN0b3IyLCBwMjogVmVjdG9yMiwgb3B0aW9ucz86IExpbmVPcHRpb25zICk7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCB4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4MjogbnVtYmVyLCB5MjogbnVtYmVyLCBvcHRpb25zPzogTGluZU9wdGlvbnMgKTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHgxPzogbnVtYmVyIHwgVmVjdG9yMiB8IExpbmVPcHRpb25zLCB5MT86IG51bWJlciB8IFZlY3RvcjIsIHgyPzogbnVtYmVyIHwgTGluZU9wdGlvbnMsIHkyPzogbnVtYmVyLCBvcHRpb25zPzogTGluZU9wdGlvbnMgKSB7XHJcbiAgICBzdXBlciggbnVsbCApO1xyXG5cclxuICAgIHRoaXMuX3gxID0gMDtcclxuICAgIHRoaXMuX3kxID0gMDtcclxuICAgIHRoaXMuX3gyID0gMDtcclxuICAgIHRoaXMuX3kyID0gMDtcclxuXHJcbiAgICAvLyBSZW1hcCBjb25zdHJ1Y3RvciBwYXJhbWV0ZXJzIHRvIG9wdGlvbnNcclxuICAgIGlmICggdHlwZW9mIHgxID09PSAnb2JqZWN0JyApIHtcclxuICAgICAgaWYgKCB4MSBpbnN0YW5jZW9mIFZlY3RvcjIgKSB7XHJcbiAgICAgICAgLy8gYXNzdW1lcyBMaW5lKCBWZWN0b3IyLCBWZWN0b3IyLCBvcHRpb25zICksIHdoZXJlIHgyIGlzIG91ciBvcHRpb25zXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggeDIgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgeDIgPT09ICdvYmplY3QnICk7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggeDIgPT09IHVuZGVmaW5lZCB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoIHgyICkgPT09IE9iamVjdC5wcm90b3R5cGUsXHJcbiAgICAgICAgICAnRXh0cmEgcHJvdG90eXBlIG9uIE5vZGUgb3B0aW9ucyBvYmplY3QgaXMgYSBjb2RlIHNtZWxsJyApO1xyXG5cclxuICAgICAgICBvcHRpb25zID0gZXh0ZW5kRGVmaW5lZDxMaW5lT3B0aW9ucz4oIHtcclxuICAgICAgICAgIC8vIEZpcnN0IFZlY3RvcjIgaXMgdW5kZXIgdGhlIHgxIG5hbWVcclxuICAgICAgICAgIHgxOiB4MS54LFxyXG4gICAgICAgICAgeTE6IHgxLnksXHJcbiAgICAgICAgICAvLyBTZWNvbmQgVmVjdG9yMiBpcyB1bmRlciB0aGUgeTEgbmFtZVxyXG4gICAgICAgICAgeDI6ICggeTEgYXMgVmVjdG9yMiApLngsXHJcbiAgICAgICAgICB5MjogKCB5MSBhcyBWZWN0b3IyICkueSxcclxuXHJcbiAgICAgICAgICBzdHJva2VQaWNrYWJsZTogdHJ1ZVxyXG4gICAgICAgIH0sIHgyIGFzIExpbmVPcHRpb25zICk7IC8vIE9wdGlvbnMgb2JqZWN0IChpZiBhdmFpbGFibGUpIGlzIHVuZGVyIHRoZSB4MiBuYW1lXHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gYXNzdW1lcyBMaW5lKCB7IC4uLiB9ICksIGluaXQgdG8gemVybyBmb3Igbm93XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggeTEgPT09IHVuZGVmaW5lZCApO1xyXG5cclxuICAgICAgICAvLyBPcHRpb25zIG9iamVjdCBpcyB1bmRlciB0aGUgeDEgbmFtZVxyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHgxID09PSB1bmRlZmluZWQgfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKCB4MSApID09PSBPYmplY3QucHJvdG90eXBlLFxyXG4gICAgICAgICAgJ0V4dHJhIHByb3RvdHlwZSBvbiBOb2RlIG9wdGlvbnMgb2JqZWN0IGlzIGEgY29kZSBzbWVsbCcgKTtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IGV4dGVuZERlZmluZWQoIHtcclxuICAgICAgICAgIHN0cm9rZVBpY2thYmxlOiB0cnVlXHJcbiAgICAgICAgfSwgeDEgKTsgLy8gT3B0aW9ucyBvYmplY3QgKGlmIGF2YWlsYWJsZSkgaXMgdW5kZXIgdGhlIHgxIG5hbWVcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIG5ldyBMaW5lKCB4MSwgeTEsIHgyLCB5MiwgW29wdGlvbnNdIClcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggeDEgIT09IHVuZGVmaW5lZCAmJlxyXG4gICAgICB0eXBlb2YgeTEgPT09ICdudW1iZXInICYmXHJcbiAgICAgIHR5cGVvZiB4MiA9PT0gJ251bWJlcicgJiZcclxuICAgICAgdHlwZW9mIHkyID09PSAnbnVtYmVyJyApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zID09PSB1bmRlZmluZWQgfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKCBvcHRpb25zICkgPT09IE9iamVjdC5wcm90b3R5cGUsXHJcbiAgICAgICAgJ0V4dHJhIHByb3RvdHlwZSBvbiBOb2RlIG9wdGlvbnMgb2JqZWN0IGlzIGEgY29kZSBzbWVsbCcgKTtcclxuXHJcbiAgICAgIG9wdGlvbnMgPSBleHRlbmREZWZpbmVkPExpbmVPcHRpb25zPigge1xyXG4gICAgICAgIHgxOiB4MSxcclxuICAgICAgICB5MTogeTEgYXMgbnVtYmVyLFxyXG4gICAgICAgIHgyOiB4MiBhcyBudW1iZXIsXHJcbiAgICAgICAgeTI6IHkyLFxyXG4gICAgICAgIHN0cm9rZVBpY2thYmxlOiB0cnVlXHJcbiAgICAgIH0sIG9wdGlvbnMgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm11dGF0ZSggb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IGFsbCBvZiB0aGUgbGluZSdzIHggYW5kIHkgdmFsdWVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHgxIC0gdGhlIHN0YXJ0IHggY29vcmRpbmF0ZVxyXG4gICAqIEBwYXJhbSB5MSAtIHRoZSBzdGFydCB5IGNvb3JkaW5hdGVcclxuICAgKiBAcGFyYW0geDIgLSB0aGUgZW5kIHggY29vcmRpbmF0ZVxyXG4gICAqIEBwYXJhbSB5MiAtIHRoZSBlbmQgeSBjb29yZGluYXRlXHJcbiAgICovXHJcbiAgcHVibGljIHNldExpbmUoIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyOiBudW1iZXIsIHkyOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB4MSAhPT0gdW5kZWZpbmVkICYmXHJcbiAgICB5MSAhPT0gdW5kZWZpbmVkICYmXHJcbiAgICB4MiAhPT0gdW5kZWZpbmVkICYmXHJcbiAgICB5MiAhPT0gdW5kZWZpbmVkLCAncGFyYW1ldGVycyBuZWVkIHRvIGJlIGRlZmluZWQnICk7XHJcblxyXG4gICAgdGhpcy5feDEgPSB4MTtcclxuICAgIHRoaXMuX3kxID0geTE7XHJcbiAgICB0aGlzLl94MiA9IHgyO1xyXG4gICAgdGhpcy5feTIgPSB5MjtcclxuXHJcbiAgICBjb25zdCBzdGF0ZUxlbiA9IHRoaXMuX2RyYXdhYmxlcy5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGF0ZUxlbjsgaSsrICkge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IHRoaXMuX2RyYXdhYmxlc1sgaSBdO1xyXG4gICAgICAoIHN0YXRlIGFzIHVua25vd24gYXMgVExpbmVEcmF3YWJsZSApLm1hcmtEaXJ0eUxpbmUoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmludmFsaWRhdGVMaW5lKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIGxpbmUncyBmaXJzdCBwb2ludCdzIHggYW5kIHkgdmFsdWVzXHJcbiAgICovXHJcbiAgcHVibGljIHNldFBvaW50MSggcDE6IFZlY3RvcjIgKTogdGhpcztcclxuICBzZXRQb2ludDEoIHgxOiBudW1iZXIsIHkxOiBudW1iZXIgKTogdGhpczsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHlcclxuICBzZXRQb2ludDEoIHgxOiBudW1iZXIgfCBWZWN0b3IyLCB5MT86IG51bWJlciApOiB0aGlzIHsgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1lbWJlci1hY2Nlc3NpYmlsaXR5XHJcbiAgICBpZiAoIHR5cGVvZiB4MSA9PT0gJ251bWJlcicgKSB7XHJcblxyXG4gICAgICAvLyBzZXRQb2ludDEoIHgxLCB5MSApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB4MSAhPT0gdW5kZWZpbmVkICYmIHkxICE9PSB1bmRlZmluZWQsICdwYXJhbWV0ZXJzIG5lZWQgdG8gYmUgZGVmaW5lZCcgKTtcclxuICAgICAgdGhpcy5feDEgPSB4MTtcclxuICAgICAgdGhpcy5feTEgPSB5MSE7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIC8vIHNldFBvaW50MSggVmVjdG9yMiApXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHgxLnggIT09IHVuZGVmaW5lZCAmJiB4MS55ICE9PSB1bmRlZmluZWQsICdwYXJhbWV0ZXJzIG5lZWQgdG8gYmUgZGVmaW5lZCcgKTtcclxuICAgICAgdGhpcy5feDEgPSB4MS54O1xyXG4gICAgICB0aGlzLl95MSA9IHgxLnk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBudW1EcmF3YWJsZXMgPSB0aGlzLl9kcmF3YWJsZXMubGVuZ3RoO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbnVtRHJhd2FibGVzOyBpKysgKSB7XHJcbiAgICAgICggdGhpcy5fZHJhd2FibGVzWyBpIF0gYXMgdW5rbm93biBhcyBUTGluZURyYXdhYmxlICkubWFya0RpcnR5UDEoKTtcclxuICAgIH1cclxuICAgIHRoaXMuaW52YWxpZGF0ZUxpbmUoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgcDEoIHBvaW50OiBWZWN0b3IyICkgeyB0aGlzLnNldFBvaW50MSggcG9pbnQgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHAxKCk6IFZlY3RvcjIgeyByZXR1cm4gbmV3IFZlY3RvcjIoIHRoaXMuX3gxLCB0aGlzLl95MSApOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgbGluZSdzIHNlY29uZCBwb2ludCdzIHggYW5kIHkgdmFsdWVzXHJcbiAgICovXHJcbiAgcHVibGljIHNldFBvaW50MiggcDE6IFZlY3RvcjIgKTogdGhpcztcclxuICBzZXRQb2ludDIoIHgyOiBudW1iZXIsIHkyOiBudW1iZXIgKTogdGhpczsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHlcclxuICBzZXRQb2ludDIoIHgyOiBudW1iZXIgfCBWZWN0b3IyLCB5Mj86IG51bWJlciApOiB0aGlzIHsgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1lbWJlci1hY2Nlc3NpYmlsaXR5XHJcbiAgICBpZiAoIHR5cGVvZiB4MiA9PT0gJ251bWJlcicgKSB7XHJcbiAgICAgIC8vIHNldFBvaW50MiggeDIsIHkyICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHgyICE9PSB1bmRlZmluZWQgJiYgeTIgIT09IHVuZGVmaW5lZCwgJ3BhcmFtZXRlcnMgbmVlZCB0byBiZSBkZWZpbmVkJyApO1xyXG4gICAgICB0aGlzLl94MiA9IHgyO1xyXG4gICAgICB0aGlzLl95MiA9IHkyITtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBzZXRQb2ludDIoIFZlY3RvcjIgKVxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB4Mi54ICE9PSB1bmRlZmluZWQgJiYgeDIueSAhPT0gdW5kZWZpbmVkLCAncGFyYW1ldGVycyBuZWVkIHRvIGJlIGRlZmluZWQnICk7XHJcbiAgICAgIHRoaXMuX3gyID0geDIueDtcclxuICAgICAgdGhpcy5feTIgPSB4Mi55O1xyXG4gICAgfVxyXG4gICAgY29uc3QgbnVtRHJhd2FibGVzID0gdGhpcy5fZHJhd2FibGVzLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG51bURyYXdhYmxlczsgaSsrICkge1xyXG4gICAgICAoIHRoaXMuX2RyYXdhYmxlc1sgaSBdIGFzIHVua25vd24gYXMgVExpbmVEcmF3YWJsZSApLm1hcmtEaXJ0eVAyKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmludmFsaWRhdGVMaW5lKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHAyKCBwb2ludDogVmVjdG9yMiApIHsgdGhpcy5zZXRQb2ludDIoIHBvaW50ICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBwMigpOiBWZWN0b3IyIHsgcmV0dXJuIG5ldyBWZWN0b3IyKCB0aGlzLl94MiwgdGhpcy5feTIgKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGZpcnN0IHBvaW50IG9mIHRoZSBsaW5lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRYMSggeDE6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGlmICggdGhpcy5feDEgIT09IHgxICkge1xyXG4gICAgICB0aGlzLl94MSA9IHgxO1xyXG5cclxuICAgICAgY29uc3Qgc3RhdGVMZW4gPSB0aGlzLl9kcmF3YWJsZXMubGVuZ3RoO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGF0ZUxlbjsgaSsrICkge1xyXG4gICAgICAgICggdGhpcy5fZHJhd2FibGVzWyBpIF0gYXMgdW5rbm93biBhcyBUTGluZURyYXdhYmxlICkubWFya0RpcnR5WDEoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5pbnZhbGlkYXRlTGluZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHgxKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldFgxKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgeDEoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0WDEoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGZpcnN0IHBvaW50IG9mIHRoZSBsaW5lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRYMSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3gxO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgeSBjb29yZGluYXRlIG9mIHRoZSBmaXJzdCBwb2ludCBvZiB0aGUgbGluZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0WTEoIHkxOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBpZiAoIHRoaXMuX3kxICE9PSB5MSApIHtcclxuICAgICAgdGhpcy5feTEgPSB5MTtcclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlTGVuID0gdGhpcy5fZHJhd2FibGVzLmxlbmd0aDtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgc3RhdGVMZW47IGkrKyApIHtcclxuICAgICAgICAoIHRoaXMuX2RyYXdhYmxlc1sgaSBdIGFzIHVua25vd24gYXMgVExpbmVEcmF3YWJsZSApLm1hcmtEaXJ0eVkxKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUxpbmUoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCB5MSggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRZMSggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHkxKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFkxKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgeSBjb29yZGluYXRlIG9mIHRoZSBmaXJzdCBwb2ludCBvZiB0aGUgbGluZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0WTEoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl95MTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHggY29vcmRpbmF0ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBsaW5lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRYMiggeDI6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGlmICggdGhpcy5feDIgIT09IHgyICkge1xyXG4gICAgICB0aGlzLl94MiA9IHgyO1xyXG5cclxuICAgICAgY29uc3Qgc3RhdGVMZW4gPSB0aGlzLl9kcmF3YWJsZXMubGVuZ3RoO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGF0ZUxlbjsgaSsrICkge1xyXG4gICAgICAgICggdGhpcy5fZHJhd2FibGVzWyBpIF0gYXMgdW5rbm93biBhcyBUTGluZURyYXdhYmxlICkubWFya0RpcnR5WDIoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5pbnZhbGlkYXRlTGluZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHgyKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldFgyKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgeDIoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0WDIoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB4IGNvb3JkaW5hdGUgb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgbGluZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0WDIoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl94MjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHkgY29vcmRpbmF0ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBsaW5lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRZMiggeTI6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGlmICggdGhpcy5feTIgIT09IHkyICkge1xyXG4gICAgICB0aGlzLl95MiA9IHkyO1xyXG5cclxuICAgICAgY29uc3Qgc3RhdGVMZW4gPSB0aGlzLl9kcmF3YWJsZXMubGVuZ3RoO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGF0ZUxlbjsgaSsrICkge1xyXG4gICAgICAgICggdGhpcy5fZHJhd2FibGVzWyBpIF0gYXMgdW5rbm93biBhcyBUTGluZURyYXdhYmxlICkubWFya0RpcnR5WTIoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5pbnZhbGlkYXRlTGluZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHkyKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldFkyKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgeTIoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0WTIoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB5IGNvb3JkaW5hdGUgb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgbGluZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0WTIoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl95MjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBTaGFwZSB0aGF0IGlzIGVxdWl2YWxlbnQgdG8gb3VyIHJlbmRlcmVkIGRpc3BsYXkuIEdlbmVyYWxseSB1c2VkIHRvIGxhemlseSBjcmVhdGUgYSBTaGFwZSBpbnN0YW5jZVxyXG4gICAqIHdoZW4gb25lIGlzIG5lZWRlZCwgd2l0aG91dCBoYXZpbmcgdG8gZG8gc28gYmVmb3JlaGFuZC5cclxuICAgKi9cclxuICBwcml2YXRlIGNyZWF0ZUxpbmVTaGFwZSgpOiBTaGFwZSB7XHJcbiAgICByZXR1cm4gU2hhcGUubGluZVNlZ21lbnQoIHRoaXMuX3gxLCB0aGlzLl95MSwgdGhpcy5feDIsIHRoaXMuX3kyICkubWFrZUltbXV0YWJsZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTm90aWZpZXMgdGhhdCB0aGUgbGluZSBoYXMgY2hhbmdlZCBhbmQgaW52YWxpZGF0ZXMgcGF0aCBpbmZvcm1hdGlvbiBhbmQgb3VyIGNhY2hlZCBzaGFwZS5cclxuICAgKi9cclxuICBwcml2YXRlIGludmFsaWRhdGVMaW5lKCk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHRoaXMuX3gxICksIGBBIGxpbmUgbmVlZHMgdG8gaGF2ZSBhIGZpbml0ZSB4MSAoJHt0aGlzLl94MX0pYCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHRoaXMuX3kxICksIGBBIGxpbmUgbmVlZHMgdG8gaGF2ZSBhIGZpbml0ZSB5MSAoJHt0aGlzLl95MX0pYCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHRoaXMuX3gyICksIGBBIGxpbmUgbmVlZHMgdG8gaGF2ZSBhIGZpbml0ZSB4MiAoJHt0aGlzLl94Mn0pYCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHRoaXMuX3kyICksIGBBIGxpbmUgbmVlZHMgdG8gaGF2ZSBhIGZpbml0ZSB5MiAoJHt0aGlzLl95Mn0pYCApO1xyXG5cclxuICAgIC8vIHNldHMgb3VyICdjYWNoZScgdG8gbnVsbCwgc28gd2UgZG9uJ3QgYWx3YXlzIGhhdmUgdG8gcmVjb21wdXRlIG91ciBzaGFwZVxyXG4gICAgdGhpcy5fc2hhcGUgPSBudWxsO1xyXG5cclxuICAgIC8vIHNob3VsZCBpbnZhbGlkYXRlIHRoZSBwYXRoIGFuZCBlbnN1cmUgYSByZWRyYXdcclxuICAgIHRoaXMuaW52YWxpZGF0ZVBhdGgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXB1dGVzIHdoZXRoZXIgdGhlIHByb3ZpZGVkIHBvaW50IGlzIFwiaW5zaWRlXCIgKGNvbnRhaW5lZCkgaW4gdGhpcyBMaW5lJ3Mgc2VsZiBjb250ZW50LCBvciBcIm91dHNpZGVcIi5cclxuICAgKlxyXG4gICAqIFNpbmNlIGFuIHVuc3Ryb2tlZCBMaW5lIGNvbnRhaW5zIG5vIGFyZWEsIHdlIGNhbiBxdWlja2x5IHNob3J0Y3V0IHRoaXMgb3BlcmF0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHBvaW50IC0gQ29uc2lkZXJlZCB0byBiZSBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBjb250YWluc1BvaW50U2VsZiggcG9pbnQ6IFZlY3RvcjIgKTogYm9vbGVhbiB7XHJcbiAgICBpZiAoIHRoaXMuX3N0cm9rZVBpY2thYmxlICkge1xyXG4gICAgICByZXR1cm4gc3VwZXIuY29udGFpbnNQb2ludFNlbGYoIHBvaW50ICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIGZhbHNlOyAvLyBub3RoaW5nIGlzIGluIGEgbGluZSEgKGFsdGhvdWdoIG1heWJlIHdlIHNob3VsZCBoYW5kbGUgZWRnZSBwb2ludHMgcHJvcGVybHk/KVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRHJhd3MgdGhlIGN1cnJlbnQgTm9kZSdzIHNlbGYgcmVwcmVzZW50YXRpb24sIGFzc3VtaW5nIHRoZSB3cmFwcGVyJ3MgQ2FudmFzIGNvbnRleHQgaXMgYWxyZWFkeSBpbiB0aGUgbG9jYWxcclxuICAgKiBjb29yZGluYXRlIGZyYW1lIG9mIHRoaXMgbm9kZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB3cmFwcGVyXHJcbiAgICogQHBhcmFtIG1hdHJpeCAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggYWxyZWFkeSBhcHBsaWVkIHRvIHRoZSBjb250ZXh0LlxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBvdmVycmlkZSBjYW52YXNQYWludFNlbGYoIHdyYXBwZXI6IENhbnZhc0NvbnRleHRXcmFwcGVyLCBtYXRyaXg6IE1hdHJpeDMgKTogdm9pZCB7XHJcbiAgICAvL1RPRE86IEhhdmUgYSBzZXBhcmF0ZSBtZXRob2QgZm9yIHRoaXMsIGluc3RlYWQgb2YgdG91Y2hpbmcgdGhlIHByb3RvdHlwZS4gQ2FuIG1ha2UgJ3RoaXMnIHJlZmVyZW5jZXMgdG9vIGVhc2lseS4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIExpbmVDYW52YXNEcmF3YWJsZS5wcm90b3R5cGUucGFpbnRDYW52YXMoIHdyYXBwZXIsIHRoaXMsIG1hdHJpeCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZXMgdGhlIGJvdW5kcyBvZiB0aGUgTGluZSwgaW5jbHVkaW5nIGFueSBhcHBsaWVkIHN0cm9rZS4gT3ZlcnJpZGRlbiBmb3IgZWZmaWNpZW5jeS5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgY29tcHV0ZVNoYXBlQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgLy8gb3B0aW1pemVkIGZvcm0gZm9yIGEgc2luZ2xlIGxpbmUgc2VnbWVudCAobm8gam9pbnMsIGp1c3QgdHdvIGNhcHMpXHJcbiAgICBpZiAoIHRoaXMuX3N0cm9rZSApIHtcclxuICAgICAgY29uc3QgbGluZUNhcCA9IHRoaXMuZ2V0TGluZUNhcCgpO1xyXG4gICAgICBjb25zdCBoYWxmTGluZVdpZHRoID0gdGhpcy5nZXRMaW5lV2lkdGgoKSAvIDI7XHJcbiAgICAgIGlmICggbGluZUNhcCA9PT0gJ3JvdW5kJyApIHtcclxuICAgICAgICAvLyB3ZSBjYW4gc2ltcGx5IGRpbGF0ZSBieSBoYWxmIHRoZSBsaW5lIHdpZHRoXHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZHMyKFxyXG4gICAgICAgICAgTWF0aC5taW4oIHRoaXMuX3gxLCB0aGlzLl94MiApIC0gaGFsZkxpbmVXaWR0aCwgTWF0aC5taW4oIHRoaXMuX3kxLCB0aGlzLl95MiApIC0gaGFsZkxpbmVXaWR0aCxcclxuICAgICAgICAgIE1hdGgubWF4KCB0aGlzLl94MSwgdGhpcy5feDIgKSArIGhhbGZMaW5lV2lkdGgsIE1hdGgubWF4KCB0aGlzLl95MSwgdGhpcy5feTIgKSArIGhhbGZMaW5lV2lkdGggKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyAoZHgsZHkpIGlzIGEgdmVjdG9yIHAyLXAxXHJcbiAgICAgICAgY29uc3QgZHggPSB0aGlzLl94MiAtIHRoaXMuX3gxO1xyXG4gICAgICAgIGNvbnN0IGR5ID0gdGhpcy5feTIgLSB0aGlzLl95MTtcclxuICAgICAgICBjb25zdCBtYWduaXR1ZGUgPSBNYXRoLnNxcnQoIGR4ICogZHggKyBkeSAqIGR5ICk7XHJcbiAgICAgICAgaWYgKCBtYWduaXR1ZGUgPT09IDAgKSB7XHJcbiAgICAgICAgICAvLyBpZiBvdXIgbGluZSBpcyBhIHBvaW50LCBqdXN0IGRpbGF0ZSBieSBoYWxmTGluZVdpZHRoXHJcbiAgICAgICAgICByZXR1cm4gbmV3IEJvdW5kczIoIHRoaXMuX3gxIC0gaGFsZkxpbmVXaWR0aCwgdGhpcy5feTEgLSBoYWxmTGluZVdpZHRoLCB0aGlzLl94MiArIGhhbGZMaW5lV2lkdGgsIHRoaXMuX3kyICsgaGFsZkxpbmVXaWR0aCApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyAoc3gsc3kpIGlzIGEgdmVjdG9yIHdpdGggYSBtYWduaXR1ZGUgb2YgaGFsZkxpbmVXaWR0aCBwb2ludGVkIGluIHRoZSBkaXJlY3Rpb24gb2YgKGR4LGR5KVxyXG4gICAgICAgIGNvbnN0IHN4ID0gaGFsZkxpbmVXaWR0aCAqIGR4IC8gbWFnbml0dWRlO1xyXG4gICAgICAgIGNvbnN0IHN5ID0gaGFsZkxpbmVXaWR0aCAqIGR5IC8gbWFnbml0dWRlO1xyXG4gICAgICAgIGNvbnN0IGJvdW5kcyA9IEJvdW5kczIuTk9USElORy5jb3B5KCk7XHJcblxyXG4gICAgICAgIGlmICggbGluZUNhcCA9PT0gJ2J1dHQnICkge1xyXG4gICAgICAgICAgLy8gZm91ciBwb2ludHMganVzdCB1c2luZyB0aGUgcGVycGVuZGljdWxhciBzdHJva2VkIG9mZnNldHMgKHN5LC1zeCkgYW5kICgtc3ksc3gpXHJcbiAgICAgICAgICBib3VuZHMuYWRkQ29vcmRpbmF0ZXMoIHRoaXMuX3gxIC0gc3ksIHRoaXMuX3kxICsgc3ggKTtcclxuICAgICAgICAgIGJvdW5kcy5hZGRDb29yZGluYXRlcyggdGhpcy5feDEgKyBzeSwgdGhpcy5feTEgLSBzeCApO1xyXG4gICAgICAgICAgYm91bmRzLmFkZENvb3JkaW5hdGVzKCB0aGlzLl94MiAtIHN5LCB0aGlzLl95MiArIHN4ICk7XHJcbiAgICAgICAgICBib3VuZHMuYWRkQ29vcmRpbmF0ZXMoIHRoaXMuX3gyICsgc3ksIHRoaXMuX3kyIC0gc3ggKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsaW5lQ2FwID09PSAnc3F1YXJlJyApO1xyXG5cclxuICAgICAgICAgIC8vIGZvdXIgcG9pbnRzIGp1c3QgdXNpbmcgdGhlIHBlcnBlbmRpY3VsYXIgc3Ryb2tlZCBvZmZzZXRzIChzeSwtc3gpIGFuZCAoLXN5LHN4KSBhbmQgcGFyYWxsZWwgc3Ryb2tlZCBvZmZzZXRzXHJcbiAgICAgICAgICBib3VuZHMuYWRkQ29vcmRpbmF0ZXMoIHRoaXMuX3gxIC0gc3ggLSBzeSwgdGhpcy5feTEgLSBzeSArIHN4ICk7XHJcbiAgICAgICAgICBib3VuZHMuYWRkQ29vcmRpbmF0ZXMoIHRoaXMuX3gxIC0gc3ggKyBzeSwgdGhpcy5feTEgLSBzeSAtIHN4ICk7XHJcbiAgICAgICAgICBib3VuZHMuYWRkQ29vcmRpbmF0ZXMoIHRoaXMuX3gyICsgc3ggLSBzeSwgdGhpcy5feTIgKyBzeSArIHN4ICk7XHJcbiAgICAgICAgICBib3VuZHMuYWRkQ29vcmRpbmF0ZXMoIHRoaXMuX3gyICsgc3ggKyBzeSwgdGhpcy5feTIgKyBzeSAtIHN4ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBib3VuZHM7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBJdCBtaWdodCBoYXZlIGEgZmlsbD8gSnVzdCBpbmNsdWRlIHRoZSBmaWxsIGJvdW5kcyBmb3Igbm93LlxyXG4gICAgICBjb25zdCBmaWxsQm91bmRzID0gQm91bmRzMi5OT1RISU5HLmNvcHkoKTtcclxuICAgICAgZmlsbEJvdW5kcy5hZGRDb29yZGluYXRlcyggdGhpcy5feDEsIHRoaXMuX3kxICk7XHJcbiAgICAgIGZpbGxCb3VuZHMuYWRkQ29vcmRpbmF0ZXMoIHRoaXMuX3gyLCB0aGlzLl95MiApO1xyXG4gICAgICByZXR1cm4gZmlsbEJvdW5kcztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBTVkcgZHJhd2FibGUgZm9yIHRoaXMgTGluZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSByZW5kZXJlciAtIEluIHRoZSBiaXRtYXNrIGZvcm1hdCBzcGVjaWZpZWQgYnkgUmVuZGVyZXIsIHdoaWNoIG1heSBjb250YWluIGFkZGl0aW9uYWwgYml0IGZsYWdzLlxyXG4gICAqIEBwYXJhbSBpbnN0YW5jZSAtIEluc3RhbmNlIG9iamVjdCB0aGF0IHdpbGwgYmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBjcmVhdGVTVkdEcmF3YWJsZSggcmVuZGVyZXI6IG51bWJlciwgaW5zdGFuY2U6IEluc3RhbmNlICk6IFNWR1NlbGZEcmF3YWJsZSB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICByZXR1cm4gTGluZVNWR0RyYXdhYmxlLmNyZWF0ZUZyb21Qb29sKCByZW5kZXJlciwgaW5zdGFuY2UgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBDYW52YXMgZHJhd2FibGUgZm9yIHRoaXMgTGluZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSByZW5kZXJlciAtIEluIHRoZSBiaXRtYXNrIGZvcm1hdCBzcGVjaWZpZWQgYnkgUmVuZGVyZXIsIHdoaWNoIG1heSBjb250YWluIGFkZGl0aW9uYWwgYml0IGZsYWdzLlxyXG4gICAqIEBwYXJhbSBpbnN0YW5jZSAtIEluc3RhbmNlIG9iamVjdCB0aGF0IHdpbGwgYmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBjcmVhdGVDYW52YXNEcmF3YWJsZSggcmVuZGVyZXI6IG51bWJlciwgaW5zdGFuY2U6IEluc3RhbmNlICk6IENhbnZhc1NlbGZEcmF3YWJsZSB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICByZXR1cm4gTGluZUNhbnZhc0RyYXdhYmxlLmNyZWF0ZUZyb21Qb29sKCByZW5kZXJlciwgaW5zdGFuY2UgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEl0IGlzIGltcG9zc2libGUgdG8gc2V0IGFub3RoZXIgc2hhcGUgb24gdGhpcyBQYXRoIHN1YnR5cGUsIGFzIGl0cyBlZmZlY3RpdmUgc2hhcGUgaXMgZGV0ZXJtaW5lZCBieSBvdGhlclxyXG4gICAqIHBhcmFtZXRlcnMuXHJcbiAgICpcclxuICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgaXQgaXMgbm90IG51bGwuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIHNldFNoYXBlKCBzaGFwZTogU2hhcGUgfCBudWxsICk6IHRoaXMge1xyXG4gICAgaWYgKCBzaGFwZSAhPT0gbnVsbCApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQ2Fubm90IHNldCB0aGUgc2hhcGUgb2YgYSBMaW5lIHRvIHNvbWV0aGluZyBub24tbnVsbCcgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBwcm9iYWJseSBjYWxsZWQgZnJvbSB0aGUgUGF0aCBjb25zdHJ1Y3RvclxyXG4gICAgICB0aGlzLmludmFsaWRhdGVQYXRoKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGltbXV0YWJsZSBjb3B5IG9mIHRoaXMgUGF0aCBzdWJ0eXBlJ3MgcmVwcmVzZW50YXRpb24uXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIGlzIGNyZWF0ZWQgbGF6aWx5LCBzbyBkb24ndCBjYWxsIGl0IGlmIHlvdSBkb24ndCBoYXZlIHRvIVxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBnZXRTaGFwZSgpOiBTaGFwZSB7XHJcbiAgICBpZiAoICF0aGlzLl9zaGFwZSApIHtcclxuICAgICAgdGhpcy5fc2hhcGUgPSB0aGlzLmNyZWF0ZUxpbmVTaGFwZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX3NoYXBlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgUGF0aCBoYXMgYW4gYXNzb2NpYXRlZCBTaGFwZSAoaW5zdGVhZCBvZiBubyBzaGFwZSwgcmVwcmVzZW50ZWQgYnkgbnVsbClcclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgaGFzU2hhcGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBzZXRTaGFwZVByb3BlcnR5KCBuZXdUYXJnZXQ6IFRSZWFkT25seVByb3BlcnR5PFNoYXBlIHwgc3RyaW5nIHwgbnVsbD4gfCBudWxsICk6IHRoaXMge1xyXG4gICAgaWYgKCBuZXdUYXJnZXQgIT09IG51bGwgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggJ0Nhbm5vdCBzZXQgdGhlIHNoYXBlUHJvcGVydHkgb2YgYSBMaW5lIHRvIHNvbWV0aGluZyBub24tbnVsbCwgaXQgaGFuZGxlcyB0aGlzIGl0c2VsZicgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBtdXRhdGUoIG9wdGlvbnM/OiBMaW5lT3B0aW9ucyApOiB0aGlzIHtcclxuICAgIHJldHVybiBzdXBlci5tdXRhdGUoIG9wdGlvbnMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYXZhaWxhYmxlIGZpbGwgcmVuZGVyZXJzLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIFNpbmNlIG91ciBsaW5lIGNhbid0IGJlIGZpbGxlZCwgd2Ugc3VwcG9ydCBhbGwgZmlsbCByZW5kZXJlcnMuXHJcbiAgICpcclxuICAgKiBTZWUgUmVuZGVyZXIgZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gdGhlIGJpdG1hc2tzXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGdldEZpbGxSZW5kZXJlckJpdG1hc2soKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBSZW5kZXJlci5iaXRtYXNrQ2FudmFzIHwgUmVuZGVyZXIuYml0bWFza1NWRyB8IFJlbmRlcmVyLmJpdG1hc2tET00gfCBSZW5kZXJlci5iaXRtYXNrV2ViR0w7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICoge0FycmF5LjxzdHJpbmc+fSAtIFN0cmluZyBrZXlzIGZvciBhbGwgb2YgdGhlIGFsbG93ZWQgb3B0aW9ucyB0aGF0IHdpbGwgYmUgc2V0IGJ5IG5vZGUubXV0YXRlKCBvcHRpb25zICksIGluIHRoZVxyXG4gKiBvcmRlciB0aGV5IHdpbGwgYmUgZXZhbHVhdGVkIGluLlxyXG4gKlxyXG4gKiBOT1RFOiBTZWUgTm9kZSdzIF9tdXRhdG9yS2V5cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIGhvdyB0aGlzIG9wZXJhdGVzLCBhbmQgcG90ZW50aWFsIHNwZWNpYWxcclxuICogICAgICAgY2FzZXMgdGhhdCBtYXkgYXBwbHkuXHJcbiAqL1xyXG5MaW5lLnByb3RvdHlwZS5fbXV0YXRvcktleXMgPSBMSU5FX09QVElPTl9LRVlTLmNvbmNhdCggUGF0aC5wcm90b3R5cGUuX211dGF0b3JLZXlzICk7XHJcblxyXG4vKipcclxuICoge0FycmF5LjxTdHJpbmc+fSAtIExpc3Qgb2YgYWxsIGRpcnR5IGZsYWdzIHRoYXQgc2hvdWxkIGJlIGF2YWlsYWJsZSBvbiBkcmF3YWJsZXMgY3JlYXRlZCBmcm9tIHRoaXMgbm9kZSAob3JcclxuICogICAgICAgICAgICAgICAgICAgIHN1YnR5cGUpLiBHaXZlbiBhIGZsYWcgKGUuZy4gcmFkaXVzKSwgaXQgaW5kaWNhdGVzIHRoZSBleGlzdGVuY2Ugb2YgYSBmdW5jdGlvblxyXG4gKiAgICAgICAgICAgICAgICAgICAgZHJhd2FibGUubWFya0RpcnR5UmFkaXVzKCkgdGhhdCB3aWxsIGluZGljYXRlIHRvIHRoZSBkcmF3YWJsZSB0aGF0IHRoZSByYWRpdXMgaGFzIGNoYW5nZWQuXHJcbiAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gKiBAb3ZlcnJpZGVcclxuICovXHJcbkxpbmUucHJvdG90eXBlLmRyYXdhYmxlTWFya0ZsYWdzID0gUGF0aC5wcm90b3R5cGUuZHJhd2FibGVNYXJrRmxhZ3MuY29uY2F0KCBbICdsaW5lJywgJ3AxJywgJ3AyJywgJ3gxJywgJ3gyJywgJ3kxJywgJ3kyJyBdICkuZmlsdGVyKCBmbGFnID0+IGZsYWcgIT09ICdzaGFwZScgKTtcclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdMaW5lJywgTGluZSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxPQUFPLE1BQU0sNEJBQTRCO0FBR2hELE9BQU9DLE9BQU8sTUFBTSw0QkFBNEI7QUFDaEQsU0FBU0MsS0FBSyxRQUFRLDZCQUE2QjtBQUNuRCxPQUFPQyxhQUFhLE1BQU0sd0NBQXdDO0FBQ2xFLFNBQTZEQyxrQkFBa0IsRUFBRUMsZUFBZSxFQUFFQyxJQUFJLEVBQWVDLFFBQVEsRUFBRUMsT0FBTyxRQUF3QyxlQUFlO0FBRzdMLE1BQU1DLGdCQUFnQixHQUFHLENBQ3ZCLElBQUk7QUFBRTtBQUNOLElBQUk7QUFBRTtBQUNOLElBQUk7QUFBRTtBQUNOLElBQUk7QUFBRTtBQUNOLElBQUk7QUFBRTtBQUNOLElBQUksQ0FBQztBQUFBLENBQ047QUFZRCxlQUFlLE1BQU1DLElBQUksU0FBU0osSUFBSSxDQUFDO0VBRXJDOztFQUdBOztFQUdBOztFQUdBOztFQU1PSyxXQUFXQSxDQUFFQyxFQUFtQyxFQUFFQyxFQUFxQixFQUFFQyxFQUF5QixFQUFFQyxFQUFXLEVBQUVDLE9BQXFCLEVBQUc7SUFDOUksS0FBSyxDQUFFLElBQUssQ0FBQztJQUViLElBQUksQ0FBQ0MsR0FBRyxHQUFHLENBQUM7SUFDWixJQUFJLENBQUNDLEdBQUcsR0FBRyxDQUFDO0lBQ1osSUFBSSxDQUFDQyxHQUFHLEdBQUcsQ0FBQztJQUNaLElBQUksQ0FBQ0MsR0FBRyxHQUFHLENBQUM7O0lBRVo7SUFDQSxJQUFLLE9BQU9SLEVBQUUsS0FBSyxRQUFRLEVBQUc7TUFDNUIsSUFBS0EsRUFBRSxZQUFZWCxPQUFPLEVBQUc7UUFDM0I7UUFDQW9CLE1BQU0sSUFBSUEsTUFBTSxDQUFFUCxFQUFFLEtBQUtRLFNBQVMsSUFBSSxPQUFPUixFQUFFLEtBQUssUUFBUyxDQUFDO1FBQzlE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dkI7SUFFQSxPQUFPLElBQUk7RUFDYjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ2tCbUMsUUFBUUEsQ0FBQSxFQUFVO0lBQ2hDLElBQUssQ0FBQyxJQUFJLENBQUNwQyxNQUFNLEVBQUc7TUFDbEIsSUFBSSxDQUFDQSxNQUFNLEdBQUcsSUFBSSxDQUFDSixlQUFlLENBQUMsQ0FBQztJQUN0QztJQUNBLE9BQU8sSUFBSSxDQUFDSSxNQUFNO0VBQ3BCOztFQUVBO0FBQ0Y7QUFDQTtFQUNrQnFDLFFBQVFBLENBQUEsRUFBWTtJQUNsQyxPQUFPLElBQUk7RUFDYjtFQUVnQkMsZ0JBQWdCQSxDQUFFQyxTQUEwRCxFQUFTO0lBQ25HLElBQUtBLFNBQVMsS0FBSyxJQUFJLEVBQUc7TUFDeEIsTUFBTSxJQUFJSixLQUFLLENBQUUsc0ZBQXVGLENBQUM7SUFDM0c7SUFFQSxPQUFPLElBQUk7RUFDYjtFQUVnQnJFLE1BQU1BLENBQUViLE9BQXFCLEVBQVM7SUFDcEQsT0FBTyxLQUFLLENBQUNhLE1BQU0sQ0FBRWIsT0FBUSxDQUFDO0VBQ2hDOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ2tCdUYsc0JBQXNCQSxDQUFBLEVBQVc7SUFDL0MsT0FBT2hHLFFBQVEsQ0FBQ2lHLGFBQWEsR0FBR2pHLFFBQVEsQ0FBQ2tHLFVBQVUsR0FBR2xHLFFBQVEsQ0FBQ21HLFVBQVUsR0FBR25HLFFBQVEsQ0FBQ29HLFlBQVk7RUFDbkc7QUFDRjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBakcsSUFBSSxDQUFDZSxTQUFTLENBQUNtRixZQUFZLEdBQUduRyxnQkFBZ0IsQ0FBQ29HLE1BQU0sQ0FBRXZHLElBQUksQ0FBQ21CLFNBQVMsQ0FBQ21GLFlBQWEsQ0FBQzs7QUFFcEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQWxHLElBQUksQ0FBQ2UsU0FBUyxDQUFDcUYsaUJBQWlCLEdBQUd4RyxJQUFJLENBQUNtQixTQUFTLENBQUNxRixpQkFBaUIsQ0FBQ0QsTUFBTSxDQUFFLENBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFHLENBQUMsQ0FBQ0UsTUFBTSxDQUFFQyxJQUFJLElBQUlBLElBQUksS0FBSyxPQUFRLENBQUM7QUFFL0p4RyxPQUFPLENBQUN5RyxRQUFRLENBQUUsTUFBTSxFQUFFdkcsSUFBSyxDQUFDIiwiaWdub3JlTGlzdCI6W119