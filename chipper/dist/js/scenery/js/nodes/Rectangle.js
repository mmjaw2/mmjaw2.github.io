// Copyright 2013-2024, University of Colorado Boulder

/**
 * A rectangular node that inherits Path, and allows for optimized drawing and improved rectangle handling.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../../dot/js/Bounds2.js';
import Dimension2 from '../../../dot/js/Dimension2.js';
import { Shape } from '../../../kite/js/imports.js';
import { Features, Gradient, Path, Pattern, RectangleCanvasDrawable, RectangleDOMDrawable, RectangleSVGDrawable, RectangleWebGLDrawable, Renderer, scenery, Sizable } from '../imports.js';
import { combineOptions } from '../../../phet-core/js/optionize.js';
const RECTANGLE_OPTION_KEYS = ['rectBounds',
// {Bounds2} - Sets x/y/width/height based on bounds. See setRectBounds() for more documentation.
'rectSize',
// {Dimension2} - Sets width/height based on dimension. See setRectSize() for more documentation.
'rectX',
// {number} - Sets x. See setRectX() for more documentation.
'rectY',
// {number} - Sets y. See setRectY() for more documentation.
'rectWidth',
// {number} - Sets width. See setRectWidth() for more documentation.
'rectHeight',
// Sets height. See setRectHeight() for more documentation.
'cornerRadius',
// {number} - Sets corner radii. See setCornerRadius() for more documentation.
'cornerXRadius',
// {number} - Sets horizontal corner radius. See setCornerXRadius() for more documentation.
'cornerYRadius' // {number} - Sets vertical corner radius. See setCornerYRadius() for more documentation.
];
const SuperType = Sizable(Path);
export default class Rectangle extends SuperType {
  // X value of the left side of the rectangle
  // (scenery-internal)

  // Y value of the top side of the rectangle
  // (scenery-internal)

  // Width of the rectangle
  // (scenery-internal)

  // Height of the rectangle
  // (scenery-internal)

  // X radius of rounded corners
  // (scenery-internal)

  // Y radius of rounded corners
  // (scenery-internal)

  /**
   *
   * Possible constructor signatures
   * new Rectangle( x, y, width, height, cornerXRadius, cornerYRadius, [options] )
   * new Rectangle( x, y, width, height, [options] )
   * new Rectangle( [options] )
   * new Rectangle( bounds2, [options] )
   * new Rectangle( bounds2, cornerXRadius, cornerYRadius, [options] )
   *
   * Current available options for the options object (custom for Rectangle, not Path or Node):
   * rectX - Left edge of the rectangle in the local coordinate frame
   * rectY - Top edge of the rectangle in the local coordinate frame
   * rectWidth - Width of the rectangle in the local coordinate frame
   * rectHeight - Height of the rectangle in the local coordinate frame
   * cornerXRadius - The x-axis radius for elliptical/circular rounded corners.
   * cornerYRadius - The y-axis radius for elliptical/circular rounded corners.
   * cornerRadius - Sets both "X" and "Y" corner radii above.
   *
   * NOTE: the X and Y corner radii need to both be greater than zero for rounded corners to appear. If they have the
   * same non-zero value, circular rounded corners will be used.
   *
   * Available parameters to the various constructor options:
   * @param x - x-position of the upper-left corner (left bound)
   * @param [y] - y-position of the upper-left corner (top bound)
   * @param [width] - width of the rectangle to the right of the upper-left corner, required to be >= 0
   * @param [height] - height of the rectangle below the upper-left corner, required to be >= 0
   * @param [cornerXRadius] - positive vertical radius (width) of the rounded corner, or 0 to indicate the corner should be sharp
   * @param [cornerYRadius] - positive horizontal radius (height) of the rounded corner, or 0 to indicate the corner should be sharp
   * @param [options] - Rectangle-specific options are documented in RECTANGLE_OPTION_KEYS above, and can be provided
   *                             along-side options for Node
   */

  constructor(x, y, width, height, cornerXRadius, cornerYRadius, providedOptions) {
    // We'll want to default to sizable:false, but allow clients to pass in something conflicting like widthSizable:true
    // in the super mutate. To avoid the exclusive options, we isolate this out here.
    const initialOptions = {
      sizable: false
    };
    super(null, initialOptions);
    let options = {};
    this._rectX = 0;
    this._rectY = 0;
    this._rectWidth = 0;
    this._rectHeight = 0;
    this._cornerXRadius = 0;
    this._cornerYRadius = 0;
    if (typeof x === 'object') {
      // allow new Rectangle( bounds2, { ... } ) or new Rectangle( bounds2, cornerXRadius, cornerYRadius, { ... } )
      if (x instanceof Bounds2) {
        // new Rectangle( bounds2, { ... } )
        if (typeof y !== 'number') {
          assert && assert(arguments.length === 1 || arguments.length === 2, 'new Rectangle( bounds, { ... } ) should only take one or two arguments');
          assert && assert(y === undefined || typeof y === 'object', 'new Rectangle( bounds, { ... } ) second parameter should only ever be an options object');
          assert && assert(y === undefined || Object.getPrototypeOf(y) === Object.prototype, 'Extra prototype on Node options object is a code smell');
          if (assert && y) {
            assert(y.rectWidth === undefined, 'Should not specify rectWidth in multiple ways');
            assert(y.rectHeight === undefined, 'Should not specify rectHeight in multiple ways');
            assert(y.rectBounds === undefined, 'Should not specify rectBounds in multiple ways');
          }
          options = combineOptions(options, {
            rectBounds: x
          }, y); // Our options object would be at y
        }
        // Rectangle( bounds2, cornerXRadius, cornerYRadius, { ... } )
        else {
          assert && assert(arguments.length === 3 || arguments.length === 4, 'new Rectangle( bounds, cornerXRadius, cornerYRadius, { ... } ) should only take three or four arguments');
          assert && assert(height === undefined || typeof height === 'object', 'new Rectangle( bounds, cornerXRadius, cornerYRadius, { ... } ) fourth parameter should only ever be an options object');
          assert && assert(height === undefined || Object.getPrototypeOf(height) === Object.prototype, 'Extra prototype on Node options object is a code smell');
          if (assert && height) {
            assert(height.rectWidth === undefined, 'Should not specify rectWidth in multiple ways');
            assert(height.rectHeight === undefined, 'Should not specify rectHeight in multiple ways');
            assert(height.rectBounds === undefined, 'Should not specify rectBounds in multiple ways');
            assert(height.cornerXRadius === undefined, 'Should not specify cornerXRadius in multiple ways');
            assert(height.cornerYRadius === undefined, 'Should not specify cornerYRadius in multiple ways');
            assert(height.cornerRadius === undefined, 'Should not specify cornerRadius in multiple ways');
          }
          options = combineOptions(options, {
            rectBounds: x,
            cornerXRadius: y,
            // ignore Intellij warning, our cornerXRadius is the second parameter
            cornerYRadius: width // ignore Intellij warning, our cornerYRadius is the third parameter
          }, height); // Our options object would be at height
        }
      }
      // allow new Rectangle( { rectX: x, rectY: y, rectWidth: width, rectHeight: height, ... } )
      else {
        options = combineOptions(options, x);
      }
    }
    // new Rectangle( x, y, width, height, { ... } )
    else if (cornerYRadius === undefined) {
      assert && assert(arguments.length === 4 || arguments.length === 5, 'new Rectangle( x, y, width, height, { ... } ) should only take four or five arguments');
      assert && assert(cornerXRadius === undefined || typeof cornerXRadius === 'object', 'new Rectangle( x, y, width, height, { ... } ) fifth parameter should only ever be an options object');
      assert && assert(cornerXRadius === undefined || Object.getPrototypeOf(cornerXRadius) === Object.prototype, 'Extra prototype on Node options object is a code smell');
      if (assert && cornerXRadius) {
        assert(cornerXRadius.rectX === undefined, 'Should not specify rectX in multiple ways');
        assert(cornerXRadius.rectY === undefined, 'Should not specify rectY in multiple ways');
        assert(cornerXRadius.rectWidth === undefined, 'Should not specify rectWidth in multiple ways');
        assert(cornerXRadius.rectHeight === undefined, 'Should not specify rectHeight in multiple ways');
        assert(cornerXRadius.rectBounds === undefined, 'Should not specify rectBounds in multiple ways');
      }
      options = combineOptions(options, {
        rectX: x,
        rectY: y,
        rectWidth: width,
        rectHeight: height
      }, cornerXRadius);
    }
    // new Rectangle( x, y, width, height, cornerXRadius, cornerYRadius, { ... } )
    else {
      assert && assert(arguments.length === 6 || arguments.length === 7, 'new Rectangle( x, y, width, height, cornerXRadius, cornerYRadius{ ... } ) should only take six or seven arguments');
      assert && assert(options === undefined || typeof options === 'object', 'new Rectangle( x, y, width, height, cornerXRadius, cornerYRadius{ ... } ) seventh parameter should only ever be an options object');
      assert && assert(options === undefined || Object.getPrototypeOf(options) === Object.prototype, 'Extra prototype on Node options object is a code smell');
      if (assert && providedOptions) {
        assert(providedOptions.rectX === undefined, 'Should not specify rectX in multiple ways');
        assert(providedOptions.rectY === undefined, 'Should not specify rectY in multiple ways');
        assert(providedOptions.rectWidth === undefined, 'Should not specify rectWidth in multiple ways');
        assert(providedOptions.rectHeight === undefined, 'Should not specify rectHeight in multiple ways');
        assert(providedOptions.rectBounds === undefined, 'Should not specify rectBounds in multiple ways');
        assert(providedOptions.cornerXRadius === undefined, 'Should not specify cornerXRadius in multiple ways');
        assert(providedOptions.cornerYRadius === undefined, 'Should not specify cornerYRadius in multiple ways');
        assert(providedOptions.cornerRadius === undefined, 'Should not specify cornerRadius in multiple ways');
      }
      options = combineOptions(options, {
        rectX: x,
        rectY: y,
        rectWidth: width,
        rectHeight: height,
        cornerXRadius: cornerXRadius,
        cornerYRadius: cornerYRadius
      }, providedOptions);
    }
    this.localPreferredWidthProperty.lazyLink(this.updatePreferredSizes.bind(this));
    this.localPreferredHeightProperty.lazyLink(this.updatePreferredSizes.bind(this));
    this.localMinimumWidthProperty.lazyLink(this.updatePreferredSizes.bind(this));
    this.localMinimumHeightProperty.lazyLink(this.updatePreferredSizes.bind(this));
    this.mutate(options);
  }

  /**
   * Determines the maximum arc size that can be accommodated by the current width and height.
   *
   * If the corner radii are the same as the maximum arc size on a square, it will appear to be a circle (the arcs
   * take up all of the room, and leave no straight segments). In the case of a non-square, one direction of edges
   * will exist (e.g. top/bottom or left/right), while the other edges would be fully rounded.
   */
  getMaximumArcSize() {
    return Math.min(this._rectWidth / 2, this._rectHeight / 2);
  }

  /**
   * Determines the default allowed renderers (returned via the Renderer bitmask) that are allowed, given the
   * current stroke options. (scenery-internal)
   *
   * We can support the DOM renderer if there is a solid-styled stroke with non-bevel line joins
   * (which otherwise wouldn't be supported).
   *
   * @returns - Renderer bitmask, see Renderer for details
   */
  getStrokeRendererBitmask() {
    let bitmask = super.getStrokeRendererBitmask();
    const stroke = this.getStroke();
    // DOM stroke handling doesn't YET support gradients, patterns, or dashes (with the current implementation, it shouldn't be too hard)
    if (stroke && !(stroke instanceof Gradient) && !(stroke instanceof Pattern) && !this.hasLineDash()) {
      // we can't support the bevel line-join with our current DOM rectangle display
      if (this.getLineJoin() === 'miter' || this.getLineJoin() === 'round' && Features.borderRadius) {
        bitmask |= Renderer.bitmaskDOM;
      }
    }
    if (!this.hasStroke()) {
      bitmask |= Renderer.bitmaskWebGL;
    }
    return bitmask;
  }

  /**
   * Determines the allowed renderers that are allowed (or excluded) based on the current Path. (scenery-internal)
   *
   * @returns - Renderer bitmask, see Renderer for details
   */
  getPathRendererBitmask() {
    let bitmask = Renderer.bitmaskCanvas | Renderer.bitmaskSVG;
    const maximumArcSize = this.getMaximumArcSize();

    // If the top/bottom or left/right strokes touch and overlap in the middle (small rectangle, big stroke), our DOM method won't work.
    // Additionally, if we're handling rounded rectangles or a stroke with lineJoin 'round', we'll need borderRadius
    // We also require for DOM that if it's a rounded rectangle, it's rounded with circular arcs (for now, could potentially do a transform trick!)
    if ((!this.hasStroke() || this.getLineWidth() <= this._rectHeight && this.getLineWidth() <= this._rectWidth) && (!this.isRounded() || Features.borderRadius && this._cornerXRadius === this._cornerYRadius) && this._cornerYRadius <= maximumArcSize && this._cornerXRadius <= maximumArcSize) {
      bitmask |= Renderer.bitmaskDOM;
    }

    // TODO: why check here, if we also check in the 'stroke' portion? https://github.com/phetsims/scenery/issues/1581
    if (!this.hasStroke() && !this.isRounded()) {
      bitmask |= Renderer.bitmaskWebGL;
    }
    return bitmask;
  }

  /**
   * Sets all of the shape-determining parameters for the rectangle.
   *
   * @param x - The x-position of the left side of the rectangle.
   * @param y - The y-position of the top side of the rectangle.
   * @param width - The width of the rectangle.
   * @param height - The height of the rectangle.
   * @param [cornerXRadius] - The horizontal radius of curved corners (0 for sharp corners)
   * @param [cornerYRadius] - The vertical radius of curved corners (0 for sharp corners)
   */
  setRect(x, y, width, height, cornerXRadius, cornerYRadius) {
    const hasXRadius = cornerXRadius !== undefined;
    const hasYRadius = cornerYRadius !== undefined;
    assert && assert(isFinite(x) && isFinite(y) && isFinite(width) && isFinite(height), 'x/y/width/height should be finite numbers');
    assert && assert(!hasXRadius || isFinite(cornerXRadius) && (!hasYRadius || isFinite(cornerYRadius)), 'Corner radii (if provided) should be finite numbers');

    // If this doesn't change the rectangle, don't notify about changes.
    if (this._rectX === x && this._rectY === y && this._rectWidth === width && this._rectHeight === height && (!hasXRadius || this._cornerXRadius === cornerXRadius) && (!hasYRadius || this._cornerYRadius === cornerYRadius)) {
      return this;
    }
    this._rectX = x;
    this._rectY = y;
    this._rectWidth = width;
    this._rectHeight = height;
    this._cornerXRadius = hasXRadius ? cornerXRadius : this._cornerXRadius;
    this._cornerYRadius = hasYRadius ? cornerYRadius : this._cornerYRadius;
    const stateLen = this._drawables.length;
    for (let i = 0; i < stateLen; i++) {
      this._drawables[i].markDirtyRectangle();
    }
    this.invalidateRectangle();
    return this;
  }

  /**
   * Sets the x coordinate of the left side of this rectangle (in the local coordinate frame).
   */
  setRectX(x) {
    assert && assert(isFinite(x), 'rectX should be a finite number');
    if (this._rectX !== x) {
      this._rectX = x;
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyX();
      }
      this.invalidateRectangle();
    }
    return this;
  }
  set rectX(value) {
    this.setRectX(value);
  }
  get rectX() {
    return this.getRectX();
  }

  /**
   * Returns the x coordinate of the left side of this rectangle (in the local coordinate frame).
   */
  getRectX() {
    return this._rectX;
  }

  /**
   * Sets the y coordinate of the top side of this rectangle (in the local coordinate frame).
   */
  setRectY(y) {
    assert && assert(isFinite(y), 'rectY should be a finite number');
    if (this._rectY !== y) {
      this._rectY = y;
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyY();
      }
      this.invalidateRectangle();
    }
    return this;
  }
  set rectY(value) {
    this.setRectY(value);
  }
  get rectY() {
    return this.getRectY();
  }

  /**
   * Returns the y coordinate of the top side of this rectangle (in the local coordinate frame).
   */
  getRectY() {
    return this._rectY;
  }

  /**
   * Sets the width of the rectangle (in the local coordinate frame).
   */
  setRectWidth(width) {
    assert && assert(isFinite(width), 'rectWidth should be a finite number');
    if (this._rectWidth !== width) {
      this._rectWidth = width;
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyWidth();
      }
      this.invalidateRectangle();
    }
    return this;
  }
  set rectWidth(value) {
    this.setRectWidth(value);
  }
  get rectWidth() {
    return this.getRectWidth();
  }

  /**
   * Returns the width of the rectangle (in the local coordinate frame).
   */
  getRectWidth() {
    return this._rectWidth;
  }

  /**
   * Sets the height of the rectangle (in the local coordinate frame).
   */
  setRectHeight(height) {
    assert && assert(isFinite(height), 'rectHeight should be a finite number');
    if (this._rectHeight !== height) {
      this._rectHeight = height;
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyHeight();
      }
      this.invalidateRectangle();
    }
    return this;
  }
  set rectHeight(value) {
    this.setRectHeight(value);
  }
  get rectHeight() {
    return this.getRectHeight();
  }

  /**
   * Returns the height of the rectangle (in the local coordinate frame).
   */
  getRectHeight() {
    return this._rectHeight;
  }

  /**
   * Sets the horizontal corner radius of the rectangle (in the local coordinate frame).
   *
   * If the cornerXRadius and cornerYRadius are the same, the corners will be rounded circular arcs with that radius
   * (or a smaller radius if the rectangle is too small).
   *
   * If the cornerXRadius and cornerYRadius are different, the corners will be elliptical arcs, and the horizontal
   * radius will be equal to cornerXRadius (or a smaller radius if the rectangle is too small).
   */
  setCornerXRadius(radius) {
    assert && assert(isFinite(radius), 'cornerXRadius should be a finite number');
    if (this._cornerXRadius !== radius) {
      this._cornerXRadius = radius;
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyCornerXRadius();
      }
      this.invalidateRectangle();
    }
    return this;
  }
  set cornerXRadius(value) {
    this.setCornerXRadius(value);
  }
  get cornerXRadius() {
    return this.getCornerXRadius();
  }

  /**
   * Returns the horizontal corner radius of the rectangle (in the local coordinate frame).
   */
  getCornerXRadius() {
    return this._cornerXRadius;
  }

  /**
   * Sets the vertical corner radius of the rectangle (in the local coordinate frame).
   *
   * If the cornerXRadius and cornerYRadius are the same, the corners will be rounded circular arcs with that radius
   * (or a smaller radius if the rectangle is too small).
   *
   * If the cornerXRadius and cornerYRadius are different, the corners will be elliptical arcs, and the vertical
   * radius will be equal to cornerYRadius (or a smaller radius if the rectangle is too small).
   */
  setCornerYRadius(radius) {
    assert && assert(isFinite(radius), 'cornerYRadius should be a finite number');
    if (this._cornerYRadius !== radius) {
      this._cornerYRadius = radius;
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyCornerYRadius();
      }
      this.invalidateRectangle();
    }
    return this;
  }
  set cornerYRadius(value) {
    this.setCornerYRadius(value);
  }
  get cornerYRadius() {
    return this.getCornerYRadius();
  }

  /**
   * Returns the vertical corner radius of the rectangle (in the local coordinate frame).
   */
  getCornerYRadius() {
    return this._cornerYRadius;
  }

  /**
   * Sets the Rectangle's x/y/width/height from the Bounds2 passed in.
   */
  setRectBounds(bounds) {
    this.setRect(bounds.x, bounds.y, bounds.width, bounds.height);
    return this;
  }
  set rectBounds(value) {
    this.setRectBounds(value);
  }
  get rectBounds() {
    return this.getRectBounds();
  }

  /**
   * Returns a new Bounds2 generated from this Rectangle's x/y/width/height.
   */
  getRectBounds() {
    return Bounds2.rect(this._rectX, this._rectY, this._rectWidth, this._rectHeight);
  }

  /**
   * Sets the Rectangle's width/height from the Dimension2 size passed in.
   */
  setRectSize(size) {
    this.setRectWidth(size.width);
    this.setRectHeight(size.height);
    return this;
  }
  set rectSize(value) {
    this.setRectSize(value);
  }
  get rectSize() {
    return this.getRectSize();
  }

  /**
   * Returns a new Dimension2 generated from this Rectangle's width/height.
   */
  getRectSize() {
    return new Dimension2(this._rectWidth, this._rectHeight);
  }

  /**
   * Sets the width of the rectangle while keeping its right edge (x + width) in the same position
   */
  setRectWidthFromRight(width) {
    if (this._rectWidth !== width) {
      const right = this._rectX + this._rectWidth;
      this.setRectWidth(width);
      this.setRectX(right - width);
    }
    return this;
  }
  set rectWidthFromRight(value) {
    this.setRectWidthFromRight(value);
  }
  get rectWidthFromRight() {
    return this.getRectWidth();
  } // because JSHint complains

  /**
   * Sets the height of the rectangle while keeping its bottom edge (y + height) in the same position
   */
  setRectHeightFromBottom(height) {
    if (this._rectHeight !== height) {
      const bottom = this._rectY + this._rectHeight;
      this.setRectHeight(height);
      this.setRectY(bottom - height);
    }
    return this;
  }
  set rectHeightFromBottom(value) {
    this.setRectHeightFromBottom(value);
  }
  get rectHeightFromBottom() {
    return this.getRectHeight();
  } // because JSHint complains

  /**
   * Returns whether this rectangle has any rounding applied at its corners. If either the x or y corner radius is 0,
   * then there is no rounding applied.
   */
  isRounded() {
    return this._cornerXRadius !== 0 && this._cornerYRadius !== 0;
  }

  /**
   * Computes the bounds of the Rectangle, including any applied stroke. Overridden for efficiency.
   */
  computeShapeBounds() {
    let bounds = new Bounds2(this._rectX, this._rectY, this._rectX + this._rectWidth, this._rectY + this._rectHeight);
    if (this._stroke) {
      // since we are axis-aligned, any stroke will expand our bounds by a guaranteed set amount
      bounds = bounds.dilated(this.getLineWidth() / 2);
    }
    return bounds;
  }

  /**
   * Returns a Shape that is equivalent to our rendered display. Generally used to lazily create a Shape instance
   * when one is needed, without having to do so beforehand.
   */
  createRectangleShape() {
    if (this.isRounded()) {
      // copy border-radius CSS behavior in Chrome, where the arcs won't intersect, in cases where the arc segments at full size would intersect each other
      const maximumArcSize = Math.min(this._rectWidth / 2, this._rectHeight / 2);
      return Shape.roundRectangle(this._rectX, this._rectY, this._rectWidth, this._rectHeight, Math.min(maximumArcSize, this._cornerXRadius), Math.min(maximumArcSize, this._cornerYRadius)).makeImmutable();
    } else {
      return Shape.rectangle(this._rectX, this._rectY, this._rectWidth, this._rectHeight).makeImmutable();
    }
  }

  /**
   * Notifies that the rectangle has changed, and invalidates path information and our cached shape.
   */
  invalidateRectangle() {
    assert && assert(isFinite(this._rectX), `A rectangle needs to have a finite x (${this._rectX})`);
    assert && assert(isFinite(this._rectY), `A rectangle needs to have a finite y (${this._rectY})`);
    assert && assert(this._rectWidth >= 0 && isFinite(this._rectWidth), `A rectangle needs to have a non-negative finite width (${this._rectWidth})`);
    assert && assert(this._rectHeight >= 0 && isFinite(this._rectHeight), `A rectangle needs to have a non-negative finite height (${this._rectHeight})`);
    assert && assert(this._cornerXRadius >= 0 && isFinite(this._cornerXRadius), `A rectangle needs to have a non-negative finite arcWidth (${this._cornerXRadius})`);
    assert && assert(this._cornerYRadius >= 0 && isFinite(this._cornerYRadius), `A rectangle needs to have a non-negative finite arcHeight (${this._cornerYRadius})`);

    // sets our 'cache' to null, so we don't always have to recompute our shape
    this._shape = null;

    // should invalidate the path and ensure a redraw
    this.invalidatePath();

    // since we changed the rectangle arc width/height, it could make DOM work or not
    this.invalidateSupportedRenderers();
  }
  updatePreferredSizes() {
    let width = this.localPreferredWidth;
    let height = this.localPreferredHeight;
    if (width !== null) {
      width = Math.max(width, this.localMinimumWidth || 0);
    }
    if (height !== null) {
      height = Math.max(height, this.localMinimumHeight || 0);
    }
    if (width !== null) {
      this.rectWidth = this.hasStroke() ? width - this.lineWidth : width;
    }
    if (height !== null) {
      this.rectHeight = this.hasStroke() ? height - this.lineWidth : height;
    }
  }

  // We need to detect stroke changes, since our preferred size computations depend on it.
  invalidateStroke() {
    super.invalidateStroke();
    this.updatePreferredSizes();
  }

  /**
   * Computes whether the provided point is "inside" (contained) in this Rectangle's self content, or "outside".
   *
   * Handles axis-aligned optionally-rounded rectangles, although can only do optimized computation if it isn't
   * rounded. If it IS rounded, we check if a corner computation is needed (usually isn't), and only need to check
   * one corner for that test.
   *
   * @param point - Considered to be in the local coordinate frame
   */
  containsPointSelf(point) {
    const x = this._rectX;
    const y = this._rectY;
    const width = this._rectWidth;
    const height = this._rectHeight;
    const arcWidth = this._cornerXRadius;
    const arcHeight = this._cornerYRadius;
    const halfLine = this.getLineWidth() / 2;
    let result = true;
    if (this._strokePickable) {
      // test the outer boundary if we are stroke-pickable (if also fill-pickable, this is the only test we need)
      const rounded = this.isRounded();
      if (!rounded && this.getLineJoin() === 'bevel') {
        // fall-back for bevel
        return super.containsPointSelf(point);
      }
      const miter = this.getLineJoin() === 'miter' && !rounded;
      result = result && Rectangle.intersects(x - halfLine, y - halfLine, width + 2 * halfLine, height + 2 * halfLine, miter ? 0 : arcWidth + halfLine, miter ? 0 : arcHeight + halfLine, point);
    }
    if (this._fillPickable) {
      if (this._strokePickable) {
        return result;
      } else {
        return Rectangle.intersects(x, y, width, height, arcWidth, arcHeight, point);
      }
    } else if (this._strokePickable) {
      return result && !Rectangle.intersects(x + halfLine, y + halfLine, width - 2 * halfLine, height - 2 * halfLine, arcWidth - halfLine, arcHeight - halfLine, point);
    } else {
      return false; // either fill nor stroke is pickable
    }
  }

  /**
   * Returns whether this Rectangle's selfBounds is intersected by the specified bounds.
   *
   * @param bounds - Bounds to test, assumed to be in the local coordinate frame.
   */
  intersectsBoundsSelf(bounds) {
    return !this.computeShapeBounds().intersection(bounds).isEmpty();
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
    RectangleCanvasDrawable.prototype.paintCanvas(wrapper, this, matrix);
  }

  /**
   * Creates a DOM drawable for this Rectangle. (scenery-internal)
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createDOMDrawable(renderer, instance) {
    // @ts-expect-error
    return RectangleDOMDrawable.createFromPool(renderer, instance);
  }

  /**
   * Creates a SVG drawable for this Rectangle. (scenery-internal)
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createSVGDrawable(renderer, instance) {
    // @ts-expect-error
    return RectangleSVGDrawable.createFromPool(renderer, instance);
  }

  /**
   * Creates a Canvas drawable for this Rectangle. (scenery-internal)
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createCanvasDrawable(renderer, instance) {
    // @ts-expect-error
    return RectangleCanvasDrawable.createFromPool(renderer, instance);
  }

  /**
   * Creates a WebGL drawable for this Rectangle. (scenery-internal)
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createWebGLDrawable(renderer, instance) {
    // @ts-expect-error
    return RectangleWebGLDrawable.createFromPool(renderer, instance);
  }

  /*---------------------------------------------------------------------------*
   * Miscellaneous
   *----------------------------------------------------------------------------*/

  /**
   * It is impossible to set another shape on this Path subtype, as its effective shape is determined by other
   * parameters.
   *
   * @param shape - Throws an error if it is not null.
   */
  setShape(shape) {
    if (shape !== null) {
      throw new Error('Cannot set the shape of a Rectangle to something non-null');
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
      this._shape = this.createRectangleShape();
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
      throw new Error('Cannot set the shapeProperty of a Rectangle to something non-null, it handles this itself');
    }
    return this;
  }

  /**
   * Sets both of the corner radii to the same value, so that the rounded corners will be circular arcs.
   */
  setCornerRadius(cornerRadius) {
    this.setCornerXRadius(cornerRadius);
    this.setCornerYRadius(cornerRadius);
    return this;
  }
  set cornerRadius(value) {
    this.setCornerRadius(value);
  }
  get cornerRadius() {
    return this.getCornerRadius();
  }

  /**
   * Returns the corner radius if both the horizontal and vertical corner radii are the same.
   *
   * NOTE: If there are different horizontal and vertical corner radii, this will fail an assertion and return the horizontal radius.
   */
  getCornerRadius() {
    assert && assert(this._cornerXRadius === this._cornerYRadius, 'getCornerRadius() invalid if x/y radii are different');
    return this._cornerXRadius;
  }
  mutate(options) {
    return super.mutate(options);
  }

  /**
   * Returns whether a point is within a rounded rectangle.
   *
   * @param x - X value of the left side of the rectangle
   * @param y - Y value of the top side of the rectangle
   * @param width - Width of the rectangle
   * @param height - Height of the rectangle
   * @param arcWidth - Horizontal corner radius of the rectangle
   * @param arcHeight - Vertical corner radius of the rectangle
   * @param point - The point that may or may not be in the rounded rectangle
   */
  static intersects(x, y, width, height, arcWidth, arcHeight, point) {
    const result = point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
    if (!result || arcWidth <= 0 || arcHeight <= 0) {
      return result;
    }

    // copy border-radius CSS behavior in Chrome, where the arcs won't intersect, in cases where the arc segments at full size would intersect each other
    const maximumArcSize = Math.min(width / 2, height / 2);
    arcWidth = Math.min(maximumArcSize, arcWidth);
    arcHeight = Math.min(maximumArcSize, arcHeight);

    // we are rounded and inside the logical rectangle (if it didn't have rounded corners)

    // closest corner arc's center (we assume the rounded rectangle's arcs are 90 degrees fully, and don't intersect)
    let closestCornerX;
    let closestCornerY;
    let guaranteedInside = false;

    // if we are to the inside of the closest corner arc's center, we are guaranteed to be in the rounded rectangle (guaranteedInside)
    if (point.x < x + width / 2) {
      closestCornerX = x + arcWidth;
      guaranteedInside = guaranteedInside || point.x >= closestCornerX;
    } else {
      closestCornerX = x + width - arcWidth;
      guaranteedInside = guaranteedInside || point.x <= closestCornerX;
    }
    if (guaranteedInside) {
      return true;
    }
    if (point.y < y + height / 2) {
      closestCornerY = y + arcHeight;
      guaranteedInside = guaranteedInside || point.y >= closestCornerY;
    } else {
      closestCornerY = y + height - arcHeight;
      guaranteedInside = guaranteedInside || point.y <= closestCornerY;
    }
    if (guaranteedInside) {
      return true;
    }

    // we are now in the rectangular region between the logical corner and the center of the closest corner's arc.

    // offset from the closest corner's arc center
    let offsetX = point.x - closestCornerX;
    let offsetY = point.y - closestCornerY;

    // normalize the coordinates so now we are dealing with a unit circle
    // (technically arc, but we are guaranteed to be in the area covered by the arc, so we just consider the circle)
    // NOTE: we are rounded, so both arcWidth and arcHeight are non-zero (this is well defined)
    offsetX /= arcWidth;
    offsetY /= arcHeight;
    offsetX *= offsetX;
    offsetY *= offsetY;
    return offsetX + offsetY <= 1; // return whether we are in the rounded corner. see the formula for an ellipse
  }

  /**
   * Creates a rectangle with the specified x/y/width/height.
   *
   * See Rectangle's constructor for detailed parameter information.
   */
  static rect(x, y, width, height, options) {
    return new Rectangle(x, y, width, height, 0, 0, options);
  }

  /**
   * Creates a rounded rectangle with the specified x/y/width/height/cornerXRadius/cornerYRadius.
   *
   * See Rectangle's constructor for detailed parameter information.
   */
  static roundedRect(x, y, width, height, cornerXRadius, cornerYRadius, options) {
    return new Rectangle(x, y, width, height, cornerXRadius, cornerYRadius, options);
  }

  /**
   * Creates a rectangle x/y/width/height matching the specified bounds.
   *
   * See Rectangle's constructor for detailed parameter information.
   */
  static bounds(bounds, options) {
    return new Rectangle(bounds.minX, bounds.minY, bounds.width, bounds.height, options);
  }

  /**
   * Creates a rounded rectangle x/y/width/height matching the specified bounds (Rectangle.bounds, but with additional
   * cornerXRadius and cornerYRadius).
   *
   * See Rectangle's constructor for detailed parameter information.
   */
  static roundedBounds(bounds, cornerXRadius, cornerYRadius, options) {
    return new Rectangle(bounds.minX, bounds.minY, bounds.width, bounds.height, cornerXRadius, cornerYRadius, options);
  }

  /**
   * Creates a rectangle with top/left of (0,0) with the specified {Dimension2}'s width and height.
   *
   * See Rectangle's constructor for detailed parameter information.
   */
  static dimension(dimension, options) {
    return new Rectangle(0, 0, dimension.width, dimension.height, 0, 0, options);
  }
}

/**
 * {Array.<string>} - String keys for all the allowed options that will be set by node.mutate( options ), in the
 * order they will be evaluated in.
 *
 * NOTE: See Node's _mutatorKeys documentation for more information on how this operates, and potential special
 *       cases that may apply.
 */
Rectangle.prototype._mutatorKeys = [...RECTANGLE_OPTION_KEYS, ...SuperType.prototype._mutatorKeys];

/**
 * {Array.<String>} - List of all dirty flags that should be available on drawables created from this node (or
 *                    subtype). Given a flag (e.g. radius), it indicates the existence of a function
 *                    drawable.markDirtyRadius() that will indicate to the drawable that the radius has changed.
 * (scenery-internal)
 * @override
 */
Rectangle.prototype.drawableMarkFlags = Path.prototype.drawableMarkFlags.concat(['x', 'y', 'width', 'height', 'cornerXRadius', 'cornerYRadius']).filter(flag => flag !== 'shape');
scenery.register('Rectangle', Rectangle);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiRGltZW5zaW9uMiIsIlNoYXBlIiwiRmVhdHVyZXMiLCJHcmFkaWVudCIsIlBhdGgiLCJQYXR0ZXJuIiwiUmVjdGFuZ2xlQ2FudmFzRHJhd2FibGUiLCJSZWN0YW5nbGVET01EcmF3YWJsZSIsIlJlY3RhbmdsZVNWR0RyYXdhYmxlIiwiUmVjdGFuZ2xlV2ViR0xEcmF3YWJsZSIsIlJlbmRlcmVyIiwic2NlbmVyeSIsIlNpemFibGUiLCJjb21iaW5lT3B0aW9ucyIsIlJFQ1RBTkdMRV9PUFRJT05fS0VZUyIsIlN1cGVyVHlwZSIsIlJlY3RhbmdsZSIsImNvbnN0cnVjdG9yIiwieCIsInkiLCJ3aWR0aCIsImhlaWdodCIsImNvcm5lclhSYWRpdXMiLCJjb3JuZXJZUmFkaXVzIiwicHJvdmlkZWRPcHRpb25zIiwiaW5pdGlhbE9wdGlvbnMiLCJzaXphYmxlIiwib3B0aW9ucyIsIl9yZWN0WCIsIl9yZWN0WSIsIl9yZWN0V2lkdGgiLCJfcmVjdEhlaWdodCIsIl9jb3JuZXJYUmFkaXVzIiwiX2Nvcm5lcllSYWRpdXMiLCJhc3NlcnQiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJ1bmRlZmluZWQiLCJPYmplY3QiLCJnZXRQcm90b3R5cGVPZiIsInByb3RvdHlwZSIsInJlY3RXaWR0aCIsInJlY3RIZWlnaHQiLCJyZWN0Qm91bmRzIiwiY29ybmVyUmFkaXVzIiwicmVjdFgiLCJyZWN0WSIsImxvY2FsUHJlZmVycmVkV2lkdGhQcm9wZXJ0eSIsImxhenlMaW5rIiwidXBkYXRlUHJlZmVycmVkU2l6ZXMiLCJiaW5kIiwibG9jYWxQcmVmZXJyZWRIZWlnaHRQcm9wZXJ0eSIsImxvY2FsTWluaW11bVdpZHRoUHJvcGVydHkiLCJsb2NhbE1pbmltdW1IZWlnaHRQcm9wZXJ0eSIsIm11dGF0ZSIsImdldE1heGltdW1BcmNTaXplIiwiTWF0aCIsIm1pbiIsImdldFN0cm9rZVJlbmRlcmVyQml0bWFzayIsImJpdG1hc2siLCJzdHJva2UiLCJnZXRTdHJva2UiLCJoYXNMaW5lRGFzaCIsImdldExpbmVKb2luIiwiYm9yZGVyUmFkaXVzIiwiYml0bWFza0RPTSIsImhhc1N0cm9rZSIsImJpdG1hc2tXZWJHTCIsImdldFBhdGhSZW5kZXJlckJpdG1hc2siLCJiaXRtYXNrQ2FudmFzIiwiYml0bWFza1NWRyIsIm1heGltdW1BcmNTaXplIiwiZ2V0TGluZVdpZHRoIiwiaXNSb3VuZGVkIiwic2V0UmVjdCIsImhhc1hSYWRpdXMiLCJoYXNZUmFkaXVzIiwiaXNGaW5pdGUiLCJzdGF0ZUxlbiIsIl9kcmF3YWJsZXMiLCJpIiwibWFya0RpcnR5UmVjdGFuZ2xlIiwiaW52YWxpZGF0ZVJlY3RhbmdsZSIsInNldFJlY3RYIiwibWFya0RpcnR5WCIsInZhbHVlIiwiZ2V0UmVjdFgiLCJzZXRSZWN0WSIsIm1hcmtEaXJ0eVkiLCJnZXRSZWN0WSIsInNldFJlY3RXaWR0aCIsIm1hcmtEaXJ0eVdpZHRoIiwiZ2V0UmVjdFdpZHRoIiwic2V0UmVjdEhlaWdodCIsIm1hcmtEaXJ0eUhlaWdodCIsImdldFJlY3RIZWlnaHQiLCJzZXRDb3JuZXJYUmFkaXVzIiwicmFkaXVzIiwibWFya0RpcnR5Q29ybmVyWFJhZGl1cyIsImdldENvcm5lclhSYWRpdXMiLCJzZXRDb3JuZXJZUmFkaXVzIiwibWFya0RpcnR5Q29ybmVyWVJhZGl1cyIsImdldENvcm5lcllSYWRpdXMiLCJzZXRSZWN0Qm91bmRzIiwiYm91bmRzIiwiZ2V0UmVjdEJvdW5kcyIsInJlY3QiLCJzZXRSZWN0U2l6ZSIsInNpemUiLCJyZWN0U2l6ZSIsImdldFJlY3RTaXplIiwic2V0UmVjdFdpZHRoRnJvbVJpZ2h0IiwicmlnaHQiLCJyZWN0V2lkdGhGcm9tUmlnaHQiLCJzZXRSZWN0SGVpZ2h0RnJvbUJvdHRvbSIsImJvdHRvbSIsInJlY3RIZWlnaHRGcm9tQm90dG9tIiwiY29tcHV0ZVNoYXBlQm91bmRzIiwiX3N0cm9rZSIsImRpbGF0ZWQiLCJjcmVhdGVSZWN0YW5nbGVTaGFwZSIsInJvdW5kUmVjdGFuZ2xlIiwibWFrZUltbXV0YWJsZSIsInJlY3RhbmdsZSIsIl9zaGFwZSIsImludmFsaWRhdGVQYXRoIiwiaW52YWxpZGF0ZVN1cHBvcnRlZFJlbmRlcmVycyIsImxvY2FsUHJlZmVycmVkV2lkdGgiLCJsb2NhbFByZWZlcnJlZEhlaWdodCIsIm1heCIsImxvY2FsTWluaW11bVdpZHRoIiwibG9jYWxNaW5pbXVtSGVpZ2h0IiwibGluZVdpZHRoIiwiaW52YWxpZGF0ZVN0cm9rZSIsImNvbnRhaW5zUG9pbnRTZWxmIiwicG9pbnQiLCJhcmNXaWR0aCIsImFyY0hlaWdodCIsImhhbGZMaW5lIiwicmVzdWx0IiwiX3N0cm9rZVBpY2thYmxlIiwicm91bmRlZCIsIm1pdGVyIiwiaW50ZXJzZWN0cyIsIl9maWxsUGlja2FibGUiLCJpbnRlcnNlY3RzQm91bmRzU2VsZiIsImludGVyc2VjdGlvbiIsImlzRW1wdHkiLCJjYW52YXNQYWludFNlbGYiLCJ3cmFwcGVyIiwibWF0cml4IiwicGFpbnRDYW52YXMiLCJjcmVhdGVET01EcmF3YWJsZSIsInJlbmRlcmVyIiwiaW5zdGFuY2UiLCJjcmVhdGVGcm9tUG9vbCIsImNyZWF0ZVNWR0RyYXdhYmxlIiwiY3JlYXRlQ2FudmFzRHJhd2FibGUiLCJjcmVhdGVXZWJHTERyYXdhYmxlIiwic2V0U2hhcGUiLCJzaGFwZSIsIkVycm9yIiwiZ2V0U2hhcGUiLCJoYXNTaGFwZSIsInNldFNoYXBlUHJvcGVydHkiLCJuZXdUYXJnZXQiLCJzZXRDb3JuZXJSYWRpdXMiLCJnZXRDb3JuZXJSYWRpdXMiLCJjbG9zZXN0Q29ybmVyWCIsImNsb3Nlc3RDb3JuZXJZIiwiZ3VhcmFudGVlZEluc2lkZSIsIm9mZnNldFgiLCJvZmZzZXRZIiwicm91bmRlZFJlY3QiLCJtaW5YIiwibWluWSIsInJvdW5kZWRCb3VuZHMiLCJkaW1lbnNpb24iLCJfbXV0YXRvcktleXMiLCJkcmF3YWJsZU1hcmtGbGFncyIsImNvbmNhdCIsImZpbHRlciIsImZsYWciLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlJlY3RhbmdsZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIHJlY3Rhbmd1bGFyIG5vZGUgdGhhdCBpbmhlcml0cyBQYXRoLCBhbmQgYWxsb3dzIGZvciBvcHRpbWl6ZWQgZHJhd2luZyBhbmQgaW1wcm92ZWQgcmVjdGFuZ2xlIGhhbmRsaW5nLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcbmltcG9ydCBEaW1lbnNpb24yIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9EaW1lbnNpb24yLmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCB7IENhbnZhc0NvbnRleHRXcmFwcGVyLCBDYW52YXNTZWxmRHJhd2FibGUsIERPTVNlbGZEcmF3YWJsZSwgRmVhdHVyZXMsIEdyYWRpZW50LCBJbnN0YW5jZSwgUGF0aCwgUGF0aE9wdGlvbnMsIFBhdHRlcm4sIFJlY3RhbmdsZUNhbnZhc0RyYXdhYmxlLCBSZWN0YW5nbGVET01EcmF3YWJsZSwgUmVjdGFuZ2xlU1ZHRHJhd2FibGUsIFJlY3RhbmdsZVdlYkdMRHJhd2FibGUsIFJlbmRlcmVyLCBzY2VuZXJ5LCBTaXphYmxlLCBTaXphYmxlT3B0aW9ucywgU1ZHU2VsZkRyYXdhYmxlLCBUUmVjdGFuZ2xlRHJhd2FibGUsIFdlYkdMU2VsZkRyYXdhYmxlIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBNYXRyaXgzIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9NYXRyaXgzLmpzJztcclxuaW1wb3J0IHsgY29tYmluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5cclxuY29uc3QgUkVDVEFOR0xFX09QVElPTl9LRVlTID0gW1xyXG4gICdyZWN0Qm91bmRzJywgLy8ge0JvdW5kczJ9IC0gU2V0cyB4L3kvd2lkdGgvaGVpZ2h0IGJhc2VkIG9uIGJvdW5kcy4gU2VlIHNldFJlY3RCb3VuZHMoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uLlxyXG4gICdyZWN0U2l6ZScsIC8vIHtEaW1lbnNpb24yfSAtIFNldHMgd2lkdGgvaGVpZ2h0IGJhc2VkIG9uIGRpbWVuc2lvbi4gU2VlIHNldFJlY3RTaXplKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvbi5cclxuICAncmVjdFgnLCAvLyB7bnVtYmVyfSAtIFNldHMgeC4gU2VlIHNldFJlY3RYKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvbi5cclxuICAncmVjdFknLCAvLyB7bnVtYmVyfSAtIFNldHMgeS4gU2VlIHNldFJlY3RZKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvbi5cclxuICAncmVjdFdpZHRoJywgLy8ge251bWJlcn0gLSBTZXRzIHdpZHRoLiBTZWUgc2V0UmVjdFdpZHRoKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvbi5cclxuICAncmVjdEhlaWdodCcsIC8vIFNldHMgaGVpZ2h0LiBTZWUgc2V0UmVjdEhlaWdodCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb24uXHJcbiAgJ2Nvcm5lclJhZGl1cycsIC8vIHtudW1iZXJ9IC0gU2V0cyBjb3JuZXIgcmFkaWkuIFNlZSBzZXRDb3JuZXJSYWRpdXMoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uLlxyXG4gICdjb3JuZXJYUmFkaXVzJywgLy8ge251bWJlcn0gLSBTZXRzIGhvcml6b250YWwgY29ybmVyIHJhZGl1cy4gU2VlIHNldENvcm5lclhSYWRpdXMoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uLlxyXG4gICdjb3JuZXJZUmFkaXVzJyAvLyB7bnVtYmVyfSAtIFNldHMgdmVydGljYWwgY29ybmVyIHJhZGl1cy4gU2VlIHNldENvcm5lcllSYWRpdXMoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uLlxyXG5dO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICByZWN0Qm91bmRzPzogQm91bmRzMjtcclxuICByZWN0U2l6ZT86IERpbWVuc2lvbjI7XHJcbiAgcmVjdFg/OiBudW1iZXI7XHJcbiAgcmVjdFk/OiBudW1iZXI7XHJcbiAgcmVjdFdpZHRoPzogbnVtYmVyO1xyXG4gIHJlY3RIZWlnaHQ/OiBudW1iZXI7XHJcbiAgY29ybmVyUmFkaXVzPzogbnVtYmVyO1xyXG4gIGNvcm5lclhSYWRpdXM/OiBudW1iZXI7XHJcbiAgY29ybmVyWVJhZGl1cz86IG51bWJlcjtcclxufTtcclxudHlwZSBQYXJlbnRPcHRpb25zID0gU2l6YWJsZU9wdGlvbnMgJiBQYXRoT3B0aW9ucztcclxuZXhwb3J0IHR5cGUgUmVjdGFuZ2xlT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgU3RyaWN0T21pdDxQYXJlbnRPcHRpb25zLCAnc2hhcGUnIHwgJ3NoYXBlUHJvcGVydHknPjtcclxuXHJcbmNvbnN0IFN1cGVyVHlwZSA9IFNpemFibGUoIFBhdGggKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlY3RhbmdsZSBleHRlbmRzIFN1cGVyVHlwZSB7XHJcbiAgLy8gWCB2YWx1ZSBvZiB0aGUgbGVmdCBzaWRlIG9mIHRoZSByZWN0YW5nbGVcclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX3JlY3RYOiBudW1iZXI7XHJcblxyXG4gIC8vIFkgdmFsdWUgb2YgdGhlIHRvcCBzaWRlIG9mIHRoZSByZWN0YW5nbGVcclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX3JlY3RZOiBudW1iZXI7XHJcblxyXG4gIC8vIFdpZHRoIG9mIHRoZSByZWN0YW5nbGVcclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX3JlY3RXaWR0aDogbnVtYmVyO1xyXG5cclxuICAvLyBIZWlnaHQgb2YgdGhlIHJlY3RhbmdsZVxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfcmVjdEhlaWdodDogbnVtYmVyO1xyXG5cclxuICAvLyBYIHJhZGl1cyBvZiByb3VuZGVkIGNvcm5lcnNcclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX2Nvcm5lclhSYWRpdXM6IG51bWJlcjtcclxuXHJcbiAgLy8gWSByYWRpdXMgb2Ygcm91bmRlZCBjb3JuZXJzXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9jb3JuZXJZUmFkaXVzOiBudW1iZXI7XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogUG9zc2libGUgY29uc3RydWN0b3Igc2lnbmF0dXJlc1xyXG4gICAqIG5ldyBSZWN0YW5nbGUoIHgsIHksIHdpZHRoLCBoZWlnaHQsIGNvcm5lclhSYWRpdXMsIGNvcm5lcllSYWRpdXMsIFtvcHRpb25zXSApXHJcbiAgICogbmV3IFJlY3RhbmdsZSggeCwgeSwgd2lkdGgsIGhlaWdodCwgW29wdGlvbnNdIClcclxuICAgKiBuZXcgUmVjdGFuZ2xlKCBbb3B0aW9uc10gKVxyXG4gICAqIG5ldyBSZWN0YW5nbGUoIGJvdW5kczIsIFtvcHRpb25zXSApXHJcbiAgICogbmV3IFJlY3RhbmdsZSggYm91bmRzMiwgY29ybmVyWFJhZGl1cywgY29ybmVyWVJhZGl1cywgW29wdGlvbnNdIClcclxuICAgKlxyXG4gICAqIEN1cnJlbnQgYXZhaWxhYmxlIG9wdGlvbnMgZm9yIHRoZSBvcHRpb25zIG9iamVjdCAoY3VzdG9tIGZvciBSZWN0YW5nbGUsIG5vdCBQYXRoIG9yIE5vZGUpOlxyXG4gICAqIHJlY3RYIC0gTGVmdCBlZGdlIG9mIHRoZSByZWN0YW5nbGUgaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWVcclxuICAgKiByZWN0WSAtIFRvcCBlZGdlIG9mIHRoZSByZWN0YW5nbGUgaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWVcclxuICAgKiByZWN0V2lkdGggLSBXaWR0aCBvZiB0aGUgcmVjdGFuZ2xlIGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lXHJcbiAgICogcmVjdEhlaWdodCAtIEhlaWdodCBvZiB0aGUgcmVjdGFuZ2xlIGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lXHJcbiAgICogY29ybmVyWFJhZGl1cyAtIFRoZSB4LWF4aXMgcmFkaXVzIGZvciBlbGxpcHRpY2FsL2NpcmN1bGFyIHJvdW5kZWQgY29ybmVycy5cclxuICAgKiBjb3JuZXJZUmFkaXVzIC0gVGhlIHktYXhpcyByYWRpdXMgZm9yIGVsbGlwdGljYWwvY2lyY3VsYXIgcm91bmRlZCBjb3JuZXJzLlxyXG4gICAqIGNvcm5lclJhZGl1cyAtIFNldHMgYm90aCBcIlhcIiBhbmQgXCJZXCIgY29ybmVyIHJhZGlpIGFib3ZlLlxyXG4gICAqXHJcbiAgICogTk9URTogdGhlIFggYW5kIFkgY29ybmVyIHJhZGlpIG5lZWQgdG8gYm90aCBiZSBncmVhdGVyIHRoYW4gemVybyBmb3Igcm91bmRlZCBjb3JuZXJzIHRvIGFwcGVhci4gSWYgdGhleSBoYXZlIHRoZVxyXG4gICAqIHNhbWUgbm9uLXplcm8gdmFsdWUsIGNpcmN1bGFyIHJvdW5kZWQgY29ybmVycyB3aWxsIGJlIHVzZWQuXHJcbiAgICpcclxuICAgKiBBdmFpbGFibGUgcGFyYW1ldGVycyB0byB0aGUgdmFyaW91cyBjb25zdHJ1Y3RvciBvcHRpb25zOlxyXG4gICAqIEBwYXJhbSB4IC0geC1wb3NpdGlvbiBvZiB0aGUgdXBwZXItbGVmdCBjb3JuZXIgKGxlZnQgYm91bmQpXHJcbiAgICogQHBhcmFtIFt5XSAtIHktcG9zaXRpb24gb2YgdGhlIHVwcGVyLWxlZnQgY29ybmVyICh0b3AgYm91bmQpXHJcbiAgICogQHBhcmFtIFt3aWR0aF0gLSB3aWR0aCBvZiB0aGUgcmVjdGFuZ2xlIHRvIHRoZSByaWdodCBvZiB0aGUgdXBwZXItbGVmdCBjb3JuZXIsIHJlcXVpcmVkIHRvIGJlID49IDBcclxuICAgKiBAcGFyYW0gW2hlaWdodF0gLSBoZWlnaHQgb2YgdGhlIHJlY3RhbmdsZSBiZWxvdyB0aGUgdXBwZXItbGVmdCBjb3JuZXIsIHJlcXVpcmVkIHRvIGJlID49IDBcclxuICAgKiBAcGFyYW0gW2Nvcm5lclhSYWRpdXNdIC0gcG9zaXRpdmUgdmVydGljYWwgcmFkaXVzICh3aWR0aCkgb2YgdGhlIHJvdW5kZWQgY29ybmVyLCBvciAwIHRvIGluZGljYXRlIHRoZSBjb3JuZXIgc2hvdWxkIGJlIHNoYXJwXHJcbiAgICogQHBhcmFtIFtjb3JuZXJZUmFkaXVzXSAtIHBvc2l0aXZlIGhvcml6b250YWwgcmFkaXVzIChoZWlnaHQpIG9mIHRoZSByb3VuZGVkIGNvcm5lciwgb3IgMCB0byBpbmRpY2F0ZSB0aGUgY29ybmVyIHNob3VsZCBiZSBzaGFycFxyXG4gICAqIEBwYXJhbSBbb3B0aW9uc10gLSBSZWN0YW5nbGUtc3BlY2lmaWMgb3B0aW9ucyBhcmUgZG9jdW1lbnRlZCBpbiBSRUNUQU5HTEVfT1BUSU9OX0tFWVMgYWJvdmUsIGFuZCBjYW4gYmUgcHJvdmlkZWRcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxvbmctc2lkZSBvcHRpb25zIGZvciBOb2RlXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBvcHRpb25zPzogUmVjdGFuZ2xlT3B0aW9ucyApO1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggYm91bmRzOiBCb3VuZHMyLCBvcHRpb25zPzogUmVjdGFuZ2xlT3B0aW9ucyApO1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggYm91bmRzOiBCb3VuZHMyLCBjb3JuZXJSYWRpdXNYOiBudW1iZXIsIGNvcm5lclJhZGl1c1k6IG51bWJlciwgb3B0aW9ucz86IFJlY3RhbmdsZU9wdGlvbnMgKTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgb3B0aW9ucz86IFJlY3RhbmdsZU9wdGlvbnMgKTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgY29ybmVyWFJhZGl1czogbnVtYmVyLCBjb3JuZXJZUmFkaXVzOiBudW1iZXIsIG9wdGlvbnM/OiBSZWN0YW5nbGVPcHRpb25zICk7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCB4PzogbnVtYmVyIHwgQm91bmRzMiB8IFJlY3RhbmdsZU9wdGlvbnMsIHk/OiBudW1iZXIgfCBSZWN0YW5nbGVPcHRpb25zLCB3aWR0aD86IG51bWJlciwgaGVpZ2h0PzogbnVtYmVyIHwgUmVjdGFuZ2xlT3B0aW9ucywgY29ybmVyWFJhZGl1cz86IG51bWJlciB8IFJlY3RhbmdsZU9wdGlvbnMsIGNvcm5lcllSYWRpdXM/OiBudW1iZXIsIHByb3ZpZGVkT3B0aW9ucz86IFJlY3RhbmdsZU9wdGlvbnMgKSB7XHJcblxyXG4gICAgLy8gV2UnbGwgd2FudCB0byBkZWZhdWx0IHRvIHNpemFibGU6ZmFsc2UsIGJ1dCBhbGxvdyBjbGllbnRzIHRvIHBhc3MgaW4gc29tZXRoaW5nIGNvbmZsaWN0aW5nIGxpa2Ugd2lkdGhTaXphYmxlOnRydWVcclxuICAgIC8vIGluIHRoZSBzdXBlciBtdXRhdGUuIFRvIGF2b2lkIHRoZSBleGNsdXNpdmUgb3B0aW9ucywgd2UgaXNvbGF0ZSB0aGlzIG91dCBoZXJlLlxyXG4gICAgY29uc3QgaW5pdGlhbE9wdGlvbnM6IFJlY3RhbmdsZU9wdGlvbnMgPSB7XHJcbiAgICAgIHNpemFibGU6IGZhbHNlXHJcbiAgICB9O1xyXG4gICAgc3VwZXIoIG51bGwsIGluaXRpYWxPcHRpb25zICk7XHJcblxyXG4gICAgbGV0IG9wdGlvbnM6IFJlY3RhbmdsZU9wdGlvbnMgPSB7fTtcclxuXHJcbiAgICB0aGlzLl9yZWN0WCA9IDA7XHJcbiAgICB0aGlzLl9yZWN0WSA9IDA7XHJcbiAgICB0aGlzLl9yZWN0V2lkdGggPSAwO1xyXG4gICAgdGhpcy5fcmVjdEhlaWdodCA9IDA7XHJcbiAgICB0aGlzLl9jb3JuZXJYUmFkaXVzID0gMDtcclxuICAgIHRoaXMuX2Nvcm5lcllSYWRpdXMgPSAwO1xyXG5cclxuICAgIGlmICggdHlwZW9mIHggPT09ICdvYmplY3QnICkge1xyXG4gICAgICAvLyBhbGxvdyBuZXcgUmVjdGFuZ2xlKCBib3VuZHMyLCB7IC4uLiB9ICkgb3IgbmV3IFJlY3RhbmdsZSggYm91bmRzMiwgY29ybmVyWFJhZGl1cywgY29ybmVyWVJhZGl1cywgeyAuLi4gfSApXHJcbiAgICAgIGlmICggeCBpbnN0YW5jZW9mIEJvdW5kczIgKSB7XHJcbiAgICAgICAgLy8gbmV3IFJlY3RhbmdsZSggYm91bmRzMiwgeyAuLi4gfSApXHJcbiAgICAgICAgaWYgKCB0eXBlb2YgeSAhPT0gJ251bWJlcicgKSB7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhcmd1bWVudHMubGVuZ3RoID09PSAxIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDIsXHJcbiAgICAgICAgICAgICduZXcgUmVjdGFuZ2xlKCBib3VuZHMsIHsgLi4uIH0gKSBzaG91bGQgb25seSB0YWtlIG9uZSBvciB0d28gYXJndW1lbnRzJyApO1xyXG4gICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggeSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiB5ID09PSAnb2JqZWN0JyxcclxuICAgICAgICAgICAgJ25ldyBSZWN0YW5nbGUoIGJvdW5kcywgeyAuLi4gfSApIHNlY29uZCBwYXJhbWV0ZXIgc2hvdWxkIG9ubHkgZXZlciBiZSBhbiBvcHRpb25zIG9iamVjdCcgKTtcclxuICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHkgPT09IHVuZGVmaW5lZCB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoIHkgKSA9PT0gT2JqZWN0LnByb3RvdHlwZSxcclxuICAgICAgICAgICAgJ0V4dHJhIHByb3RvdHlwZSBvbiBOb2RlIG9wdGlvbnMgb2JqZWN0IGlzIGEgY29kZSBzbWVsbCcgKTtcclxuXHJcbiAgICAgICAgICBpZiAoIGFzc2VydCAmJiB5ICkge1xyXG4gICAgICAgICAgICBhc3NlcnQoIHkucmVjdFdpZHRoID09PSB1bmRlZmluZWQsICdTaG91bGQgbm90IHNwZWNpZnkgcmVjdFdpZHRoIGluIG11bHRpcGxlIHdheXMnICk7XHJcbiAgICAgICAgICAgIGFzc2VydCggeS5yZWN0SGVpZ2h0ID09PSB1bmRlZmluZWQsICdTaG91bGQgbm90IHNwZWNpZnkgcmVjdEhlaWdodCBpbiBtdWx0aXBsZSB3YXlzJyApO1xyXG4gICAgICAgICAgICBhc3NlcnQoIHkucmVjdEJvdW5kcyA9PT0gdW5kZWZpbmVkLCAnU2hvdWxkIG5vdCBzcGVjaWZ5IHJlY3RCb3VuZHMgaW4gbXVsdGlwbGUgd2F5cycgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIG9wdGlvbnMgPSBjb21iaW5lT3B0aW9uczxSZWN0YW5nbGVPcHRpb25zPiggb3B0aW9ucywge1xyXG4gICAgICAgICAgICByZWN0Qm91bmRzOiB4XHJcbiAgICAgICAgICB9LCB5ICk7IC8vIE91ciBvcHRpb25zIG9iamVjdCB3b3VsZCBiZSBhdCB5XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFJlY3RhbmdsZSggYm91bmRzMiwgY29ybmVyWFJhZGl1cywgY29ybmVyWVJhZGl1cywgeyAuLi4gfSApXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhcmd1bWVudHMubGVuZ3RoID09PSAzIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDQsXHJcbiAgICAgICAgICAgICduZXcgUmVjdGFuZ2xlKCBib3VuZHMsIGNvcm5lclhSYWRpdXMsIGNvcm5lcllSYWRpdXMsIHsgLi4uIH0gKSBzaG91bGQgb25seSB0YWtlIHRocmVlIG9yIGZvdXIgYXJndW1lbnRzJyApO1xyXG4gICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaGVpZ2h0ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGhlaWdodCA9PT0gJ29iamVjdCcsXHJcbiAgICAgICAgICAgICduZXcgUmVjdGFuZ2xlKCBib3VuZHMsIGNvcm5lclhSYWRpdXMsIGNvcm5lcllSYWRpdXMsIHsgLi4uIH0gKSBmb3VydGggcGFyYW1ldGVyIHNob3VsZCBvbmx5IGV2ZXIgYmUgYW4gb3B0aW9ucyBvYmplY3QnICk7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBoZWlnaHQgPT09IHVuZGVmaW5lZCB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoIGhlaWdodCApID09PSBPYmplY3QucHJvdG90eXBlLFxyXG4gICAgICAgICAgICAnRXh0cmEgcHJvdG90eXBlIG9uIE5vZGUgb3B0aW9ucyBvYmplY3QgaXMgYSBjb2RlIHNtZWxsJyApO1xyXG5cclxuICAgICAgICAgIGlmICggYXNzZXJ0ICYmIGhlaWdodCApIHtcclxuICAgICAgICAgICAgYXNzZXJ0KCAoIGhlaWdodCBhcyBSZWN0YW5nbGVPcHRpb25zICkucmVjdFdpZHRoID09PSB1bmRlZmluZWQsICdTaG91bGQgbm90IHNwZWNpZnkgcmVjdFdpZHRoIGluIG11bHRpcGxlIHdheXMnICk7XHJcbiAgICAgICAgICAgIGFzc2VydCggKCBoZWlnaHQgYXMgUmVjdGFuZ2xlT3B0aW9ucyApLnJlY3RIZWlnaHQgPT09IHVuZGVmaW5lZCwgJ1Nob3VsZCBub3Qgc3BlY2lmeSByZWN0SGVpZ2h0IGluIG11bHRpcGxlIHdheXMnICk7XHJcbiAgICAgICAgICAgIGFzc2VydCggKCBoZWlnaHQgYXMgUmVjdGFuZ2xlT3B0aW9ucyApLnJlY3RCb3VuZHMgPT09IHVuZGVmaW5lZCwgJ1Nob3VsZCBub3Qgc3BlY2lmeSByZWN0Qm91bmRzIGluIG11bHRpcGxlIHdheXMnICk7XHJcbiAgICAgICAgICAgIGFzc2VydCggKCBoZWlnaHQgYXMgUmVjdGFuZ2xlT3B0aW9ucyApLmNvcm5lclhSYWRpdXMgPT09IHVuZGVmaW5lZCwgJ1Nob3VsZCBub3Qgc3BlY2lmeSBjb3JuZXJYUmFkaXVzIGluIG11bHRpcGxlIHdheXMnICk7XHJcbiAgICAgICAgICAgIGFzc2VydCggKCBoZWlnaHQgYXMgUmVjdGFuZ2xlT3B0aW9ucyApLmNvcm5lcllSYWRpdXMgPT09IHVuZGVmaW5lZCwgJ1Nob3VsZCBub3Qgc3BlY2lmeSBjb3JuZXJZUmFkaXVzIGluIG11bHRpcGxlIHdheXMnICk7XHJcbiAgICAgICAgICAgIGFzc2VydCggKCBoZWlnaHQgYXMgUmVjdGFuZ2xlT3B0aW9ucyApLmNvcm5lclJhZGl1cyA9PT0gdW5kZWZpbmVkLCAnU2hvdWxkIG5vdCBzcGVjaWZ5IGNvcm5lclJhZGl1cyBpbiBtdWx0aXBsZSB3YXlzJyApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgb3B0aW9ucyA9IGNvbWJpbmVPcHRpb25zPFJlY3RhbmdsZU9wdGlvbnM+KCBvcHRpb25zLCB7XHJcbiAgICAgICAgICAgIHJlY3RCb3VuZHM6IHgsXHJcbiAgICAgICAgICAgIGNvcm5lclhSYWRpdXM6IHksIC8vIGlnbm9yZSBJbnRlbGxpaiB3YXJuaW5nLCBvdXIgY29ybmVyWFJhZGl1cyBpcyB0aGUgc2Vjb25kIHBhcmFtZXRlclxyXG4gICAgICAgICAgICBjb3JuZXJZUmFkaXVzOiB3aWR0aCAvLyBpZ25vcmUgSW50ZWxsaWogd2FybmluZywgb3VyIGNvcm5lcllSYWRpdXMgaXMgdGhlIHRoaXJkIHBhcmFtZXRlclxyXG4gICAgICAgICAgfSwgaGVpZ2h0IGFzIFJlY3RhbmdsZU9wdGlvbnMgfCB1bmRlZmluZWQgKTsgLy8gT3VyIG9wdGlvbnMgb2JqZWN0IHdvdWxkIGJlIGF0IGhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICAvLyBhbGxvdyBuZXcgUmVjdGFuZ2xlKCB7IHJlY3RYOiB4LCByZWN0WTogeSwgcmVjdFdpZHRoOiB3aWR0aCwgcmVjdEhlaWdodDogaGVpZ2h0LCAuLi4gfSApXHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIG9wdGlvbnMgPSBjb21iaW5lT3B0aW9uczxSZWN0YW5nbGVPcHRpb25zPiggb3B0aW9ucywgeCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBuZXcgUmVjdGFuZ2xlKCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCB7IC4uLiB9IClcclxuICAgIGVsc2UgaWYgKCBjb3JuZXJZUmFkaXVzID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGFyZ3VtZW50cy5sZW5ndGggPT09IDQgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gNSxcclxuICAgICAgICAnbmV3IFJlY3RhbmdsZSggeCwgeSwgd2lkdGgsIGhlaWdodCwgeyAuLi4gfSApIHNob3VsZCBvbmx5IHRha2UgZm91ciBvciBmaXZlIGFyZ3VtZW50cycgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggY29ybmVyWFJhZGl1cyA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBjb3JuZXJYUmFkaXVzID09PSAnb2JqZWN0JyxcclxuICAgICAgICAnbmV3IFJlY3RhbmdsZSggeCwgeSwgd2lkdGgsIGhlaWdodCwgeyAuLi4gfSApIGZpZnRoIHBhcmFtZXRlciBzaG91bGQgb25seSBldmVyIGJlIGFuIG9wdGlvbnMgb2JqZWN0JyApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBjb3JuZXJYUmFkaXVzID09PSB1bmRlZmluZWQgfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKCBjb3JuZXJYUmFkaXVzICkgPT09IE9iamVjdC5wcm90b3R5cGUsXHJcbiAgICAgICAgJ0V4dHJhIHByb3RvdHlwZSBvbiBOb2RlIG9wdGlvbnMgb2JqZWN0IGlzIGEgY29kZSBzbWVsbCcgKTtcclxuXHJcbiAgICAgIGlmICggYXNzZXJ0ICYmIGNvcm5lclhSYWRpdXMgKSB7XHJcbiAgICAgICAgYXNzZXJ0KCAoIGNvcm5lclhSYWRpdXMgYXMgUmVjdGFuZ2xlT3B0aW9ucyApLnJlY3RYID09PSB1bmRlZmluZWQsICdTaG91bGQgbm90IHNwZWNpZnkgcmVjdFggaW4gbXVsdGlwbGUgd2F5cycgKTtcclxuICAgICAgICBhc3NlcnQoICggY29ybmVyWFJhZGl1cyBhcyBSZWN0YW5nbGVPcHRpb25zICkucmVjdFkgPT09IHVuZGVmaW5lZCwgJ1Nob3VsZCBub3Qgc3BlY2lmeSByZWN0WSBpbiBtdWx0aXBsZSB3YXlzJyApO1xyXG4gICAgICAgIGFzc2VydCggKCBjb3JuZXJYUmFkaXVzIGFzIFJlY3RhbmdsZU9wdGlvbnMgKS5yZWN0V2lkdGggPT09IHVuZGVmaW5lZCwgJ1Nob3VsZCBub3Qgc3BlY2lmeSByZWN0V2lkdGggaW4gbXVsdGlwbGUgd2F5cycgKTtcclxuICAgICAgICBhc3NlcnQoICggY29ybmVyWFJhZGl1cyBhcyBSZWN0YW5nbGVPcHRpb25zICkucmVjdEhlaWdodCA9PT0gdW5kZWZpbmVkLCAnU2hvdWxkIG5vdCBzcGVjaWZ5IHJlY3RIZWlnaHQgaW4gbXVsdGlwbGUgd2F5cycgKTtcclxuICAgICAgICBhc3NlcnQoICggY29ybmVyWFJhZGl1cyBhcyBSZWN0YW5nbGVPcHRpb25zICkucmVjdEJvdW5kcyA9PT0gdW5kZWZpbmVkLCAnU2hvdWxkIG5vdCBzcGVjaWZ5IHJlY3RCb3VuZHMgaW4gbXVsdGlwbGUgd2F5cycgKTtcclxuICAgICAgfVxyXG4gICAgICBvcHRpb25zID0gY29tYmluZU9wdGlvbnM8UmVjdGFuZ2xlT3B0aW9ucz4oIG9wdGlvbnMsIHtcclxuICAgICAgICByZWN0WDogeCxcclxuICAgICAgICByZWN0WTogeSBhcyBudW1iZXIsXHJcbiAgICAgICAgcmVjdFdpZHRoOiB3aWR0aCxcclxuICAgICAgICByZWN0SGVpZ2h0OiBoZWlnaHQgYXMgbnVtYmVyXHJcbiAgICAgIH0sIGNvcm5lclhSYWRpdXMgYXMgUmVjdGFuZ2xlT3B0aW9ucyApO1xyXG4gICAgfVxyXG4gICAgLy8gbmV3IFJlY3RhbmdsZSggeCwgeSwgd2lkdGgsIGhlaWdodCwgY29ybmVyWFJhZGl1cywgY29ybmVyWVJhZGl1cywgeyAuLi4gfSApXHJcbiAgICBlbHNlIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggYXJndW1lbnRzLmxlbmd0aCA9PT0gNiB8fCBhcmd1bWVudHMubGVuZ3RoID09PSA3LFxyXG4gICAgICAgICduZXcgUmVjdGFuZ2xlKCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBjb3JuZXJYUmFkaXVzLCBjb3JuZXJZUmFkaXVzeyAuLi4gfSApIHNob3VsZCBvbmx5IHRha2Ugc2l4IG9yIHNldmVuIGFyZ3VtZW50cycgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucyA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0JyxcclxuICAgICAgICAnbmV3IFJlY3RhbmdsZSggeCwgeSwgd2lkdGgsIGhlaWdodCwgY29ybmVyWFJhZGl1cywgY29ybmVyWVJhZGl1c3sgLi4uIH0gKSBzZXZlbnRoIHBhcmFtZXRlciBzaG91bGQgb25seSBldmVyIGJlIGFuIG9wdGlvbnMgb2JqZWN0JyApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zID09PSB1bmRlZmluZWQgfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKCBvcHRpb25zICkgPT09IE9iamVjdC5wcm90b3R5cGUsXHJcbiAgICAgICAgJ0V4dHJhIHByb3RvdHlwZSBvbiBOb2RlIG9wdGlvbnMgb2JqZWN0IGlzIGEgY29kZSBzbWVsbCcgKTtcclxuXHJcbiAgICAgIGlmICggYXNzZXJ0ICYmIHByb3ZpZGVkT3B0aW9ucyApIHtcclxuICAgICAgICBhc3NlcnQoIHByb3ZpZGVkT3B0aW9ucy5yZWN0WCA9PT0gdW5kZWZpbmVkLCAnU2hvdWxkIG5vdCBzcGVjaWZ5IHJlY3RYIGluIG11bHRpcGxlIHdheXMnICk7XHJcbiAgICAgICAgYXNzZXJ0KCBwcm92aWRlZE9wdGlvbnMucmVjdFkgPT09IHVuZGVmaW5lZCwgJ1Nob3VsZCBub3Qgc3BlY2lmeSByZWN0WSBpbiBtdWx0aXBsZSB3YXlzJyApO1xyXG4gICAgICAgIGFzc2VydCggcHJvdmlkZWRPcHRpb25zLnJlY3RXaWR0aCA9PT0gdW5kZWZpbmVkLCAnU2hvdWxkIG5vdCBzcGVjaWZ5IHJlY3RXaWR0aCBpbiBtdWx0aXBsZSB3YXlzJyApO1xyXG4gICAgICAgIGFzc2VydCggcHJvdmlkZWRPcHRpb25zLnJlY3RIZWlnaHQgPT09IHVuZGVmaW5lZCwgJ1Nob3VsZCBub3Qgc3BlY2lmeSByZWN0SGVpZ2h0IGluIG11bHRpcGxlIHdheXMnICk7XHJcbiAgICAgICAgYXNzZXJ0KCBwcm92aWRlZE9wdGlvbnMucmVjdEJvdW5kcyA9PT0gdW5kZWZpbmVkLCAnU2hvdWxkIG5vdCBzcGVjaWZ5IHJlY3RCb3VuZHMgaW4gbXVsdGlwbGUgd2F5cycgKTtcclxuICAgICAgICBhc3NlcnQoIHByb3ZpZGVkT3B0aW9ucy5jb3JuZXJYUmFkaXVzID09PSB1bmRlZmluZWQsICdTaG91bGQgbm90IHNwZWNpZnkgY29ybmVyWFJhZGl1cyBpbiBtdWx0aXBsZSB3YXlzJyApO1xyXG4gICAgICAgIGFzc2VydCggcHJvdmlkZWRPcHRpb25zLmNvcm5lcllSYWRpdXMgPT09IHVuZGVmaW5lZCwgJ1Nob3VsZCBub3Qgc3BlY2lmeSBjb3JuZXJZUmFkaXVzIGluIG11bHRpcGxlIHdheXMnICk7XHJcbiAgICAgICAgYXNzZXJ0KCBwcm92aWRlZE9wdGlvbnMuY29ybmVyUmFkaXVzID09PSB1bmRlZmluZWQsICdTaG91bGQgbm90IHNwZWNpZnkgY29ybmVyUmFkaXVzIGluIG11bHRpcGxlIHdheXMnICk7XHJcbiAgICAgIH1cclxuICAgICAgb3B0aW9ucyA9IGNvbWJpbmVPcHRpb25zPFJlY3RhbmdsZU9wdGlvbnM+KCBvcHRpb25zLCB7XHJcbiAgICAgICAgcmVjdFg6IHgsXHJcbiAgICAgICAgcmVjdFk6IHkgYXMgbnVtYmVyLFxyXG4gICAgICAgIHJlY3RXaWR0aDogd2lkdGgsXHJcbiAgICAgICAgcmVjdEhlaWdodDogaGVpZ2h0IGFzIG51bWJlcixcclxuICAgICAgICBjb3JuZXJYUmFkaXVzOiBjb3JuZXJYUmFkaXVzIGFzIG51bWJlcixcclxuICAgICAgICBjb3JuZXJZUmFkaXVzOiBjb3JuZXJZUmFkaXVzXHJcbiAgICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubG9jYWxQcmVmZXJyZWRXaWR0aFByb3BlcnR5LmxhenlMaW5rKCB0aGlzLnVwZGF0ZVByZWZlcnJlZFNpemVzLmJpbmQoIHRoaXMgKSApO1xyXG4gICAgdGhpcy5sb2NhbFByZWZlcnJlZEhlaWdodFByb3BlcnR5LmxhenlMaW5rKCB0aGlzLnVwZGF0ZVByZWZlcnJlZFNpemVzLmJpbmQoIHRoaXMgKSApO1xyXG4gICAgdGhpcy5sb2NhbE1pbmltdW1XaWR0aFByb3BlcnR5LmxhenlMaW5rKCB0aGlzLnVwZGF0ZVByZWZlcnJlZFNpemVzLmJpbmQoIHRoaXMgKSApO1xyXG4gICAgdGhpcy5sb2NhbE1pbmltdW1IZWlnaHRQcm9wZXJ0eS5sYXp5TGluayggdGhpcy51cGRhdGVQcmVmZXJyZWRTaXplcy5iaW5kKCB0aGlzICkgKTtcclxuXHJcbiAgICB0aGlzLm11dGF0ZSggb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZXMgdGhlIG1heGltdW0gYXJjIHNpemUgdGhhdCBjYW4gYmUgYWNjb21tb2RhdGVkIGJ5IHRoZSBjdXJyZW50IHdpZHRoIGFuZCBoZWlnaHQuXHJcbiAgICpcclxuICAgKiBJZiB0aGUgY29ybmVyIHJhZGlpIGFyZSB0aGUgc2FtZSBhcyB0aGUgbWF4aW11bSBhcmMgc2l6ZSBvbiBhIHNxdWFyZSwgaXQgd2lsbCBhcHBlYXIgdG8gYmUgYSBjaXJjbGUgKHRoZSBhcmNzXHJcbiAgICogdGFrZSB1cCBhbGwgb2YgdGhlIHJvb20sIGFuZCBsZWF2ZSBubyBzdHJhaWdodCBzZWdtZW50cykuIEluIHRoZSBjYXNlIG9mIGEgbm9uLXNxdWFyZSwgb25lIGRpcmVjdGlvbiBvZiBlZGdlc1xyXG4gICAqIHdpbGwgZXhpc3QgKGUuZy4gdG9wL2JvdHRvbSBvciBsZWZ0L3JpZ2h0KSwgd2hpbGUgdGhlIG90aGVyIGVkZ2VzIHdvdWxkIGJlIGZ1bGx5IHJvdW5kZWQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRNYXhpbXVtQXJjU2l6ZSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIE1hdGgubWluKCB0aGlzLl9yZWN0V2lkdGggLyAyLCB0aGlzLl9yZWN0SGVpZ2h0IC8gMiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lcyB0aGUgZGVmYXVsdCBhbGxvd2VkIHJlbmRlcmVycyAocmV0dXJuZWQgdmlhIHRoZSBSZW5kZXJlciBiaXRtYXNrKSB0aGF0IGFyZSBhbGxvd2VkLCBnaXZlbiB0aGVcclxuICAgKiBjdXJyZW50IHN0cm9rZSBvcHRpb25zLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIFdlIGNhbiBzdXBwb3J0IHRoZSBET00gcmVuZGVyZXIgaWYgdGhlcmUgaXMgYSBzb2xpZC1zdHlsZWQgc3Ryb2tlIHdpdGggbm9uLWJldmVsIGxpbmUgam9pbnNcclxuICAgKiAod2hpY2ggb3RoZXJ3aXNlIHdvdWxkbid0IGJlIHN1cHBvcnRlZCkuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyAtIFJlbmRlcmVyIGJpdG1hc2ssIHNlZSBSZW5kZXJlciBmb3IgZGV0YWlsc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBnZXRTdHJva2VSZW5kZXJlckJpdG1hc2soKTogbnVtYmVyIHtcclxuICAgIGxldCBiaXRtYXNrID0gc3VwZXIuZ2V0U3Ryb2tlUmVuZGVyZXJCaXRtYXNrKCk7XHJcbiAgICBjb25zdCBzdHJva2UgPSB0aGlzLmdldFN0cm9rZSgpO1xyXG4gICAgLy8gRE9NIHN0cm9rZSBoYW5kbGluZyBkb2Vzbid0IFlFVCBzdXBwb3J0IGdyYWRpZW50cywgcGF0dGVybnMsIG9yIGRhc2hlcyAod2l0aCB0aGUgY3VycmVudCBpbXBsZW1lbnRhdGlvbiwgaXQgc2hvdWxkbid0IGJlIHRvbyBoYXJkKVxyXG4gICAgaWYgKCBzdHJva2UgJiYgISggc3Ryb2tlIGluc3RhbmNlb2YgR3JhZGllbnQgKSAmJiAhKCBzdHJva2UgaW5zdGFuY2VvZiBQYXR0ZXJuICkgJiYgIXRoaXMuaGFzTGluZURhc2goKSApIHtcclxuICAgICAgLy8gd2UgY2FuJ3Qgc3VwcG9ydCB0aGUgYmV2ZWwgbGluZS1qb2luIHdpdGggb3VyIGN1cnJlbnQgRE9NIHJlY3RhbmdsZSBkaXNwbGF5XHJcbiAgICAgIGlmICggdGhpcy5nZXRMaW5lSm9pbigpID09PSAnbWl0ZXInIHx8ICggdGhpcy5nZXRMaW5lSm9pbigpID09PSAncm91bmQnICYmIEZlYXR1cmVzLmJvcmRlclJhZGl1cyApICkge1xyXG4gICAgICAgIGJpdG1hc2sgfD0gUmVuZGVyZXIuYml0bWFza0RPTTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICggIXRoaXMuaGFzU3Ryb2tlKCkgKSB7XHJcbiAgICAgIGJpdG1hc2sgfD0gUmVuZGVyZXIuYml0bWFza1dlYkdMO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBiaXRtYXNrO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lcyB0aGUgYWxsb3dlZCByZW5kZXJlcnMgdGhhdCBhcmUgYWxsb3dlZCAob3IgZXhjbHVkZWQpIGJhc2VkIG9uIHRoZSBjdXJyZW50IFBhdGguIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBSZW5kZXJlciBiaXRtYXNrLCBzZWUgUmVuZGVyZXIgZm9yIGRldGFpbHNcclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgZ2V0UGF0aFJlbmRlcmVyQml0bWFzaygpOiBudW1iZXIge1xyXG4gICAgbGV0IGJpdG1hc2sgPSBSZW5kZXJlci5iaXRtYXNrQ2FudmFzIHwgUmVuZGVyZXIuYml0bWFza1NWRztcclxuXHJcbiAgICBjb25zdCBtYXhpbXVtQXJjU2l6ZSA9IHRoaXMuZ2V0TWF4aW11bUFyY1NpemUoKTtcclxuXHJcbiAgICAvLyBJZiB0aGUgdG9wL2JvdHRvbSBvciBsZWZ0L3JpZ2h0IHN0cm9rZXMgdG91Y2ggYW5kIG92ZXJsYXAgaW4gdGhlIG1pZGRsZSAoc21hbGwgcmVjdGFuZ2xlLCBiaWcgc3Ryb2tlKSwgb3VyIERPTSBtZXRob2Qgd29uJ3Qgd29yay5cclxuICAgIC8vIEFkZGl0aW9uYWxseSwgaWYgd2UncmUgaGFuZGxpbmcgcm91bmRlZCByZWN0YW5nbGVzIG9yIGEgc3Ryb2tlIHdpdGggbGluZUpvaW4gJ3JvdW5kJywgd2UnbGwgbmVlZCBib3JkZXJSYWRpdXNcclxuICAgIC8vIFdlIGFsc28gcmVxdWlyZSBmb3IgRE9NIHRoYXQgaWYgaXQncyBhIHJvdW5kZWQgcmVjdGFuZ2xlLCBpdCdzIHJvdW5kZWQgd2l0aCBjaXJjdWxhciBhcmNzIChmb3Igbm93LCBjb3VsZCBwb3RlbnRpYWxseSBkbyBhIHRyYW5zZm9ybSB0cmljayEpXHJcbiAgICBpZiAoICggIXRoaXMuaGFzU3Ryb2tlKCkgfHwgKCB0aGlzLmdldExpbmVXaWR0aCgpIDw9IHRoaXMuX3JlY3RIZWlnaHQgJiYgdGhpcy5nZXRMaW5lV2lkdGgoKSA8PSB0aGlzLl9yZWN0V2lkdGggKSApICYmXHJcbiAgICAgICAgICggIXRoaXMuaXNSb3VuZGVkKCkgfHwgKCBGZWF0dXJlcy5ib3JkZXJSYWRpdXMgJiYgdGhpcy5fY29ybmVyWFJhZGl1cyA9PT0gdGhpcy5fY29ybmVyWVJhZGl1cyApICkgJiZcclxuICAgICAgICAgdGhpcy5fY29ybmVyWVJhZGl1cyA8PSBtYXhpbXVtQXJjU2l6ZSAmJiB0aGlzLl9jb3JuZXJYUmFkaXVzIDw9IG1heGltdW1BcmNTaXplICkge1xyXG4gICAgICBiaXRtYXNrIHw9IFJlbmRlcmVyLmJpdG1hc2tET007XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVE9ETzogd2h5IGNoZWNrIGhlcmUsIGlmIHdlIGFsc28gY2hlY2sgaW4gdGhlICdzdHJva2UnIHBvcnRpb24/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBpZiAoICF0aGlzLmhhc1N0cm9rZSgpICYmICF0aGlzLmlzUm91bmRlZCgpICkge1xyXG4gICAgICBiaXRtYXNrIHw9IFJlbmRlcmVyLmJpdG1hc2tXZWJHTDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYml0bWFzaztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgYWxsIG9mIHRoZSBzaGFwZS1kZXRlcm1pbmluZyBwYXJhbWV0ZXJzIGZvciB0aGUgcmVjdGFuZ2xlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHggLSBUaGUgeC1wb3NpdGlvbiBvZiB0aGUgbGVmdCBzaWRlIG9mIHRoZSByZWN0YW5nbGUuXHJcbiAgICogQHBhcmFtIHkgLSBUaGUgeS1wb3NpdGlvbiBvZiB0aGUgdG9wIHNpZGUgb2YgdGhlIHJlY3RhbmdsZS5cclxuICAgKiBAcGFyYW0gd2lkdGggLSBUaGUgd2lkdGggb2YgdGhlIHJlY3RhbmdsZS5cclxuICAgKiBAcGFyYW0gaGVpZ2h0IC0gVGhlIGhlaWdodCBvZiB0aGUgcmVjdGFuZ2xlLlxyXG4gICAqIEBwYXJhbSBbY29ybmVyWFJhZGl1c10gLSBUaGUgaG9yaXpvbnRhbCByYWRpdXMgb2YgY3VydmVkIGNvcm5lcnMgKDAgZm9yIHNoYXJwIGNvcm5lcnMpXHJcbiAgICogQHBhcmFtIFtjb3JuZXJZUmFkaXVzXSAtIFRoZSB2ZXJ0aWNhbCByYWRpdXMgb2YgY3VydmVkIGNvcm5lcnMgKDAgZm9yIHNoYXJwIGNvcm5lcnMpXHJcbiAgICovXHJcbiAgcHVibGljIHNldFJlY3QoIHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgY29ybmVyWFJhZGl1cz86IG51bWJlciwgY29ybmVyWVJhZGl1cz86IG51bWJlciApOiB0aGlzIHtcclxuICAgIGNvbnN0IGhhc1hSYWRpdXMgPSBjb3JuZXJYUmFkaXVzICE9PSB1bmRlZmluZWQ7XHJcbiAgICBjb25zdCBoYXNZUmFkaXVzID0gY29ybmVyWVJhZGl1cyAhPT0gdW5kZWZpbmVkO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB4ICkgJiYgaXNGaW5pdGUoIHkgKSAmJlxyXG4gICAgaXNGaW5pdGUoIHdpZHRoICkgJiYgaXNGaW5pdGUoIGhlaWdodCApLCAneC95L3dpZHRoL2hlaWdodCBzaG91bGQgYmUgZmluaXRlIG51bWJlcnMnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhaGFzWFJhZGl1cyB8fCBpc0Zpbml0ZSggY29ybmVyWFJhZGl1cyApICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAoICFoYXNZUmFkaXVzIHx8IGlzRmluaXRlKCBjb3JuZXJZUmFkaXVzICkgKSxcclxuICAgICAgJ0Nvcm5lciByYWRpaSAoaWYgcHJvdmlkZWQpIHNob3VsZCBiZSBmaW5pdGUgbnVtYmVycycgKTtcclxuXHJcbiAgICAvLyBJZiB0aGlzIGRvZXNuJ3QgY2hhbmdlIHRoZSByZWN0YW5nbGUsIGRvbid0IG5vdGlmeSBhYm91dCBjaGFuZ2VzLlxyXG4gICAgaWYgKCB0aGlzLl9yZWN0WCA9PT0geCAmJlxyXG4gICAgICAgICB0aGlzLl9yZWN0WSA9PT0geSAmJlxyXG4gICAgICAgICB0aGlzLl9yZWN0V2lkdGggPT09IHdpZHRoICYmXHJcbiAgICAgICAgIHRoaXMuX3JlY3RIZWlnaHQgPT09IGhlaWdodCAmJlxyXG4gICAgICAgICAoICFoYXNYUmFkaXVzIHx8IHRoaXMuX2Nvcm5lclhSYWRpdXMgPT09IGNvcm5lclhSYWRpdXMgKSAmJlxyXG4gICAgICAgICAoICFoYXNZUmFkaXVzIHx8IHRoaXMuX2Nvcm5lcllSYWRpdXMgPT09IGNvcm5lcllSYWRpdXMgKSApIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fcmVjdFggPSB4O1xyXG4gICAgdGhpcy5fcmVjdFkgPSB5O1xyXG4gICAgdGhpcy5fcmVjdFdpZHRoID0gd2lkdGg7XHJcbiAgICB0aGlzLl9yZWN0SGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgdGhpcy5fY29ybmVyWFJhZGl1cyA9IGhhc1hSYWRpdXMgPyBjb3JuZXJYUmFkaXVzIDogdGhpcy5fY29ybmVyWFJhZGl1cztcclxuICAgIHRoaXMuX2Nvcm5lcllSYWRpdXMgPSBoYXNZUmFkaXVzID8gY29ybmVyWVJhZGl1cyA6IHRoaXMuX2Nvcm5lcllSYWRpdXM7XHJcblxyXG4gICAgY29uc3Qgc3RhdGVMZW4gPSB0aGlzLl9kcmF3YWJsZXMubGVuZ3RoO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgc3RhdGVMZW47IGkrKyApIHtcclxuICAgICAgKCB0aGlzLl9kcmF3YWJsZXNbIGkgXSBhcyB1bmtub3duIGFzIFRSZWN0YW5nbGVEcmF3YWJsZSApLm1hcmtEaXJ0eVJlY3RhbmdsZSgpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5pbnZhbGlkYXRlUmVjdGFuZ2xlKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGxlZnQgc2lkZSBvZiB0aGlzIHJlY3RhbmdsZSAoaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRSZWN0WCggeDogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHggKSwgJ3JlY3RYIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9yZWN0WCAhPT0geCApIHtcclxuICAgICAgdGhpcy5fcmVjdFggPSB4O1xyXG5cclxuICAgICAgY29uc3Qgc3RhdGVMZW4gPSB0aGlzLl9kcmF3YWJsZXMubGVuZ3RoO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGF0ZUxlbjsgaSsrICkge1xyXG4gICAgICAgICggdGhpcy5fZHJhd2FibGVzWyBpIF0gYXMgdW5rbm93biBhcyBUUmVjdGFuZ2xlRHJhd2FibGUgKS5tYXJrRGlydHlYKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZVJlY3RhbmdsZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHJlY3RYKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldFJlY3RYKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmVjdFgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0UmVjdFgoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGxlZnQgc2lkZSBvZiB0aGlzIHJlY3RhbmdsZSAoaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRSZWN0WCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3JlY3RYO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgeSBjb29yZGluYXRlIG9mIHRoZSB0b3Agc2lkZSBvZiB0aGlzIHJlY3RhbmdsZSAoaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRSZWN0WSggeTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHkgKSwgJ3JlY3RZIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9yZWN0WSAhPT0geSApIHtcclxuICAgICAgdGhpcy5fcmVjdFkgPSB5O1xyXG5cclxuICAgICAgY29uc3Qgc3RhdGVMZW4gPSB0aGlzLl9kcmF3YWJsZXMubGVuZ3RoO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGF0ZUxlbjsgaSsrICkge1xyXG4gICAgICAgICggdGhpcy5fZHJhd2FibGVzWyBpIF0gYXMgdW5rbm93biBhcyBUUmVjdGFuZ2xlRHJhd2FibGUgKS5tYXJrRGlydHlZKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZVJlY3RhbmdsZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHJlY3RZKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldFJlY3RZKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmVjdFkoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0UmVjdFkoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB5IGNvb3JkaW5hdGUgb2YgdGhlIHRvcCBzaWRlIG9mIHRoaXMgcmVjdGFuZ2xlIChpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFJlY3RZKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fcmVjdFk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB3aWR0aCBvZiB0aGUgcmVjdGFuZ2xlIChpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFJlY3RXaWR0aCggd2lkdGg6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB3aWR0aCApLCAncmVjdFdpZHRoIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9yZWN0V2lkdGggIT09IHdpZHRoICkge1xyXG4gICAgICB0aGlzLl9yZWN0V2lkdGggPSB3aWR0aDtcclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlTGVuID0gdGhpcy5fZHJhd2FibGVzLmxlbmd0aDtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgc3RhdGVMZW47IGkrKyApIHtcclxuICAgICAgICAoIHRoaXMuX2RyYXdhYmxlc1sgaSBdIGFzIHVua25vd24gYXMgVFJlY3RhbmdsZURyYXdhYmxlICkubWFya0RpcnR5V2lkdGgoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5pbnZhbGlkYXRlUmVjdGFuZ2xlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgcmVjdFdpZHRoKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldFJlY3RXaWR0aCggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHJlY3RXaWR0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRSZWN0V2lkdGgoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB3aWR0aCBvZiB0aGUgcmVjdGFuZ2xlIChpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFJlY3RXaWR0aCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3JlY3RXaWR0aDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGhlaWdodCBvZiB0aGUgcmVjdGFuZ2xlIChpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFJlY3RIZWlnaHQoIGhlaWdodDogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGhlaWdodCApLCAncmVjdEhlaWdodCBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fcmVjdEhlaWdodCAhPT0gaGVpZ2h0ICkge1xyXG4gICAgICB0aGlzLl9yZWN0SGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgICAgY29uc3Qgc3RhdGVMZW4gPSB0aGlzLl9kcmF3YWJsZXMubGVuZ3RoO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGF0ZUxlbjsgaSsrICkge1xyXG4gICAgICAgICggdGhpcy5fZHJhd2FibGVzWyBpIF0gYXMgdW5rbm93biBhcyBUUmVjdGFuZ2xlRHJhd2FibGUgKS5tYXJrRGlydHlIZWlnaHQoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5pbnZhbGlkYXRlUmVjdGFuZ2xlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgcmVjdEhlaWdodCggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRSZWN0SGVpZ2h0KCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmVjdEhlaWdodCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRSZWN0SGVpZ2h0KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaGVpZ2h0IG9mIHRoZSByZWN0YW5nbGUgKGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lKS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UmVjdEhlaWdodCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3JlY3RIZWlnaHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBob3Jpem9udGFsIGNvcm5lciByYWRpdXMgb2YgdGhlIHJlY3RhbmdsZSAoaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqXHJcbiAgICogSWYgdGhlIGNvcm5lclhSYWRpdXMgYW5kIGNvcm5lcllSYWRpdXMgYXJlIHRoZSBzYW1lLCB0aGUgY29ybmVycyB3aWxsIGJlIHJvdW5kZWQgY2lyY3VsYXIgYXJjcyB3aXRoIHRoYXQgcmFkaXVzXHJcbiAgICogKG9yIGEgc21hbGxlciByYWRpdXMgaWYgdGhlIHJlY3RhbmdsZSBpcyB0b28gc21hbGwpLlxyXG4gICAqXHJcbiAgICogSWYgdGhlIGNvcm5lclhSYWRpdXMgYW5kIGNvcm5lcllSYWRpdXMgYXJlIGRpZmZlcmVudCwgdGhlIGNvcm5lcnMgd2lsbCBiZSBlbGxpcHRpY2FsIGFyY3MsIGFuZCB0aGUgaG9yaXpvbnRhbFxyXG4gICAqIHJhZGl1cyB3aWxsIGJlIGVxdWFsIHRvIGNvcm5lclhSYWRpdXMgKG9yIGEgc21hbGxlciByYWRpdXMgaWYgdGhlIHJlY3RhbmdsZSBpcyB0b28gc21hbGwpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRDb3JuZXJYUmFkaXVzKCByYWRpdXM6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCByYWRpdXMgKSwgJ2Nvcm5lclhSYWRpdXMgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX2Nvcm5lclhSYWRpdXMgIT09IHJhZGl1cyApIHtcclxuICAgICAgdGhpcy5fY29ybmVyWFJhZGl1cyA9IHJhZGl1cztcclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlTGVuID0gdGhpcy5fZHJhd2FibGVzLmxlbmd0aDtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgc3RhdGVMZW47IGkrKyApIHtcclxuICAgICAgICAoIHRoaXMuX2RyYXdhYmxlc1sgaSBdIGFzIHVua25vd24gYXMgVFJlY3RhbmdsZURyYXdhYmxlICkubWFya0RpcnR5Q29ybmVyWFJhZGl1cygpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmludmFsaWRhdGVSZWN0YW5nbGUoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBjb3JuZXJYUmFkaXVzKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldENvcm5lclhSYWRpdXMoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBjb3JuZXJYUmFkaXVzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldENvcm5lclhSYWRpdXMoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBob3Jpem9udGFsIGNvcm5lciByYWRpdXMgb2YgdGhlIHJlY3RhbmdsZSAoaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDb3JuZXJYUmFkaXVzKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29ybmVyWFJhZGl1cztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHZlcnRpY2FsIGNvcm5lciByYWRpdXMgb2YgdGhlIHJlY3RhbmdsZSAoaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqXHJcbiAgICogSWYgdGhlIGNvcm5lclhSYWRpdXMgYW5kIGNvcm5lcllSYWRpdXMgYXJlIHRoZSBzYW1lLCB0aGUgY29ybmVycyB3aWxsIGJlIHJvdW5kZWQgY2lyY3VsYXIgYXJjcyB3aXRoIHRoYXQgcmFkaXVzXHJcbiAgICogKG9yIGEgc21hbGxlciByYWRpdXMgaWYgdGhlIHJlY3RhbmdsZSBpcyB0b28gc21hbGwpLlxyXG4gICAqXHJcbiAgICogSWYgdGhlIGNvcm5lclhSYWRpdXMgYW5kIGNvcm5lcllSYWRpdXMgYXJlIGRpZmZlcmVudCwgdGhlIGNvcm5lcnMgd2lsbCBiZSBlbGxpcHRpY2FsIGFyY3MsIGFuZCB0aGUgdmVydGljYWxcclxuICAgKiByYWRpdXMgd2lsbCBiZSBlcXVhbCB0byBjb3JuZXJZUmFkaXVzIChvciBhIHNtYWxsZXIgcmFkaXVzIGlmIHRoZSByZWN0YW5nbGUgaXMgdG9vIHNtYWxsKS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Q29ybmVyWVJhZGl1cyggcmFkaXVzOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggcmFkaXVzICksICdjb3JuZXJZUmFkaXVzIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9jb3JuZXJZUmFkaXVzICE9PSByYWRpdXMgKSB7XHJcbiAgICAgIHRoaXMuX2Nvcm5lcllSYWRpdXMgPSByYWRpdXM7XHJcblxyXG4gICAgICBjb25zdCBzdGF0ZUxlbiA9IHRoaXMuX2RyYXdhYmxlcy5sZW5ndGg7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHN0YXRlTGVuOyBpKysgKSB7XHJcbiAgICAgICAgKCB0aGlzLl9kcmF3YWJsZXNbIGkgXSBhcyB1bmtub3duIGFzIFRSZWN0YW5nbGVEcmF3YWJsZSApLm1hcmtEaXJ0eUNvcm5lcllSYWRpdXMoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5pbnZhbGlkYXRlUmVjdGFuZ2xlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgY29ybmVyWVJhZGl1cyggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRDb3JuZXJZUmFkaXVzKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgY29ybmVyWVJhZGl1cygpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRDb3JuZXJZUmFkaXVzKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdmVydGljYWwgY29ybmVyIHJhZGl1cyBvZiB0aGUgcmVjdGFuZ2xlIChpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENvcm5lcllSYWRpdXMoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9jb3JuZXJZUmFkaXVzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgUmVjdGFuZ2xlJ3MgeC95L3dpZHRoL2hlaWdodCBmcm9tIHRoZSBCb3VuZHMyIHBhc3NlZCBpbi5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0UmVjdEJvdW5kcyggYm91bmRzOiBCb3VuZHMyICk6IHRoaXMge1xyXG4gICAgdGhpcy5zZXRSZWN0KCBib3VuZHMueCwgYm91bmRzLnksIGJvdW5kcy53aWR0aCwgYm91bmRzLmhlaWdodCApO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCByZWN0Qm91bmRzKCB2YWx1ZTogQm91bmRzMiApIHsgdGhpcy5zZXRSZWN0Qm91bmRzKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmVjdEJvdW5kcygpOiBCb3VuZHMyIHsgcmV0dXJuIHRoaXMuZ2V0UmVjdEJvdW5kcygpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgQm91bmRzMiBnZW5lcmF0ZWQgZnJvbSB0aGlzIFJlY3RhbmdsZSdzIHgveS93aWR0aC9oZWlnaHQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFJlY3RCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gQm91bmRzMi5yZWN0KCB0aGlzLl9yZWN0WCwgdGhpcy5fcmVjdFksIHRoaXMuX3JlY3RXaWR0aCwgdGhpcy5fcmVjdEhlaWdodCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgUmVjdGFuZ2xlJ3Mgd2lkdGgvaGVpZ2h0IGZyb20gdGhlIERpbWVuc2lvbjIgc2l6ZSBwYXNzZWQgaW4uXHJcbiAgICovXHJcbiAgcHVibGljIHNldFJlY3RTaXplKCBzaXplOiBEaW1lbnNpb24yICk6IHRoaXMge1xyXG4gICAgdGhpcy5zZXRSZWN0V2lkdGgoIHNpemUud2lkdGggKTtcclxuICAgIHRoaXMuc2V0UmVjdEhlaWdodCggc2l6ZS5oZWlnaHQgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgcmVjdFNpemUoIHZhbHVlOiBEaW1lbnNpb24yICkgeyB0aGlzLnNldFJlY3RTaXplKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmVjdFNpemUoKTogRGltZW5zaW9uMiB7IHJldHVybiB0aGlzLmdldFJlY3RTaXplKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5ldyBEaW1lbnNpb24yIGdlbmVyYXRlZCBmcm9tIHRoaXMgUmVjdGFuZ2xlJ3Mgd2lkdGgvaGVpZ2h0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRSZWN0U2l6ZSgpOiBEaW1lbnNpb24yIHtcclxuICAgIHJldHVybiBuZXcgRGltZW5zaW9uMiggdGhpcy5fcmVjdFdpZHRoLCB0aGlzLl9yZWN0SGVpZ2h0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB3aWR0aCBvZiB0aGUgcmVjdGFuZ2xlIHdoaWxlIGtlZXBpbmcgaXRzIHJpZ2h0IGVkZ2UgKHggKyB3aWR0aCkgaW4gdGhlIHNhbWUgcG9zaXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0UmVjdFdpZHRoRnJvbVJpZ2h0KCB3aWR0aDogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgaWYgKCB0aGlzLl9yZWN0V2lkdGggIT09IHdpZHRoICkge1xyXG4gICAgICBjb25zdCByaWdodCA9IHRoaXMuX3JlY3RYICsgdGhpcy5fcmVjdFdpZHRoO1xyXG4gICAgICB0aGlzLnNldFJlY3RXaWR0aCggd2lkdGggKTtcclxuICAgICAgdGhpcy5zZXRSZWN0WCggcmlnaHQgLSB3aWR0aCApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCByZWN0V2lkdGhGcm9tUmlnaHQoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0UmVjdFdpZHRoRnJvbVJpZ2h0KCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmVjdFdpZHRoRnJvbVJpZ2h0KCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFJlY3RXaWR0aCgpOyB9IC8vIGJlY2F1c2UgSlNIaW50IGNvbXBsYWluc1xyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBoZWlnaHQgb2YgdGhlIHJlY3RhbmdsZSB3aGlsZSBrZWVwaW5nIGl0cyBib3R0b20gZWRnZSAoeSArIGhlaWdodCkgaW4gdGhlIHNhbWUgcG9zaXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0UmVjdEhlaWdodEZyb21Cb3R0b20oIGhlaWdodDogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgaWYgKCB0aGlzLl9yZWN0SGVpZ2h0ICE9PSBoZWlnaHQgKSB7XHJcbiAgICAgIGNvbnN0IGJvdHRvbSA9IHRoaXMuX3JlY3RZICsgdGhpcy5fcmVjdEhlaWdodDtcclxuICAgICAgdGhpcy5zZXRSZWN0SGVpZ2h0KCBoZWlnaHQgKTtcclxuICAgICAgdGhpcy5zZXRSZWN0WSggYm90dG9tIC0gaGVpZ2h0ICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHJlY3RIZWlnaHRGcm9tQm90dG9tKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldFJlY3RIZWlnaHRGcm9tQm90dG9tKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmVjdEhlaWdodEZyb21Cb3R0b20oKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0UmVjdEhlaWdodCgpOyB9IC8vIGJlY2F1c2UgSlNIaW50IGNvbXBsYWluc1xyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyByZWN0YW5nbGUgaGFzIGFueSByb3VuZGluZyBhcHBsaWVkIGF0IGl0cyBjb3JuZXJzLiBJZiBlaXRoZXIgdGhlIHggb3IgeSBjb3JuZXIgcmFkaXVzIGlzIDAsXHJcbiAgICogdGhlbiB0aGVyZSBpcyBubyByb3VuZGluZyBhcHBsaWVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc1JvdW5kZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29ybmVyWFJhZGl1cyAhPT0gMCAmJiB0aGlzLl9jb3JuZXJZUmFkaXVzICE9PSAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZXMgdGhlIGJvdW5kcyBvZiB0aGUgUmVjdGFuZ2xlLCBpbmNsdWRpbmcgYW55IGFwcGxpZWQgc3Ryb2tlLiBPdmVycmlkZGVuIGZvciBlZmZpY2llbmN5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBjb21wdXRlU2hhcGVCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICBsZXQgYm91bmRzID0gbmV3IEJvdW5kczIoIHRoaXMuX3JlY3RYLCB0aGlzLl9yZWN0WSwgdGhpcy5fcmVjdFggKyB0aGlzLl9yZWN0V2lkdGgsIHRoaXMuX3JlY3RZICsgdGhpcy5fcmVjdEhlaWdodCApO1xyXG4gICAgaWYgKCB0aGlzLl9zdHJva2UgKSB7XHJcbiAgICAgIC8vIHNpbmNlIHdlIGFyZSBheGlzLWFsaWduZWQsIGFueSBzdHJva2Ugd2lsbCBleHBhbmQgb3VyIGJvdW5kcyBieSBhIGd1YXJhbnRlZWQgc2V0IGFtb3VudFxyXG4gICAgICBib3VuZHMgPSBib3VuZHMuZGlsYXRlZCggdGhpcy5nZXRMaW5lV2lkdGgoKSAvIDIgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBib3VuZHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgU2hhcGUgdGhhdCBpcyBlcXVpdmFsZW50IHRvIG91ciByZW5kZXJlZCBkaXNwbGF5LiBHZW5lcmFsbHkgdXNlZCB0byBsYXppbHkgY3JlYXRlIGEgU2hhcGUgaW5zdGFuY2VcclxuICAgKiB3aGVuIG9uZSBpcyBuZWVkZWQsIHdpdGhvdXQgaGF2aW5nIHRvIGRvIHNvIGJlZm9yZWhhbmQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBjcmVhdGVSZWN0YW5nbGVTaGFwZSgpOiBTaGFwZSB7XHJcbiAgICBpZiAoIHRoaXMuaXNSb3VuZGVkKCkgKSB7XHJcbiAgICAgIC8vIGNvcHkgYm9yZGVyLXJhZGl1cyBDU1MgYmVoYXZpb3IgaW4gQ2hyb21lLCB3aGVyZSB0aGUgYXJjcyB3b24ndCBpbnRlcnNlY3QsIGluIGNhc2VzIHdoZXJlIHRoZSBhcmMgc2VnbWVudHMgYXQgZnVsbCBzaXplIHdvdWxkIGludGVyc2VjdCBlYWNoIG90aGVyXHJcbiAgICAgIGNvbnN0IG1heGltdW1BcmNTaXplID0gTWF0aC5taW4oIHRoaXMuX3JlY3RXaWR0aCAvIDIsIHRoaXMuX3JlY3RIZWlnaHQgLyAyICk7XHJcbiAgICAgIHJldHVybiBTaGFwZS5yb3VuZFJlY3RhbmdsZSggdGhpcy5fcmVjdFgsIHRoaXMuX3JlY3RZLCB0aGlzLl9yZWN0V2lkdGgsIHRoaXMuX3JlY3RIZWlnaHQsXHJcbiAgICAgICAgTWF0aC5taW4oIG1heGltdW1BcmNTaXplLCB0aGlzLl9jb3JuZXJYUmFkaXVzICksIE1hdGgubWluKCBtYXhpbXVtQXJjU2l6ZSwgdGhpcy5fY29ybmVyWVJhZGl1cyApICkubWFrZUltbXV0YWJsZSgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBTaGFwZS5yZWN0YW5nbGUoIHRoaXMuX3JlY3RYLCB0aGlzLl9yZWN0WSwgdGhpcy5fcmVjdFdpZHRoLCB0aGlzLl9yZWN0SGVpZ2h0ICkubWFrZUltbXV0YWJsZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTm90aWZpZXMgdGhhdCB0aGUgcmVjdGFuZ2xlIGhhcyBjaGFuZ2VkLCBhbmQgaW52YWxpZGF0ZXMgcGF0aCBpbmZvcm1hdGlvbiBhbmQgb3VyIGNhY2hlZCBzaGFwZS5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgaW52YWxpZGF0ZVJlY3RhbmdsZSgpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB0aGlzLl9yZWN0WCApLCBgQSByZWN0YW5nbGUgbmVlZHMgdG8gaGF2ZSBhIGZpbml0ZSB4ICgke3RoaXMuX3JlY3RYfSlgICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggdGhpcy5fcmVjdFkgKSwgYEEgcmVjdGFuZ2xlIG5lZWRzIHRvIGhhdmUgYSBmaW5pdGUgeSAoJHt0aGlzLl9yZWN0WX0pYCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fcmVjdFdpZHRoID49IDAgJiYgaXNGaW5pdGUoIHRoaXMuX3JlY3RXaWR0aCApLFxyXG4gICAgICBgQSByZWN0YW5nbGUgbmVlZHMgdG8gaGF2ZSBhIG5vbi1uZWdhdGl2ZSBmaW5pdGUgd2lkdGggKCR7dGhpcy5fcmVjdFdpZHRofSlgICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9yZWN0SGVpZ2h0ID49IDAgJiYgaXNGaW5pdGUoIHRoaXMuX3JlY3RIZWlnaHQgKSxcclxuICAgICAgYEEgcmVjdGFuZ2xlIG5lZWRzIHRvIGhhdmUgYSBub24tbmVnYXRpdmUgZmluaXRlIGhlaWdodCAoJHt0aGlzLl9yZWN0SGVpZ2h0fSlgICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9jb3JuZXJYUmFkaXVzID49IDAgJiYgaXNGaW5pdGUoIHRoaXMuX2Nvcm5lclhSYWRpdXMgKSxcclxuICAgICAgYEEgcmVjdGFuZ2xlIG5lZWRzIHRvIGhhdmUgYSBub24tbmVnYXRpdmUgZmluaXRlIGFyY1dpZHRoICgke3RoaXMuX2Nvcm5lclhSYWRpdXN9KWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2Nvcm5lcllSYWRpdXMgPj0gMCAmJiBpc0Zpbml0ZSggdGhpcy5fY29ybmVyWVJhZGl1cyApLFxyXG4gICAgICBgQSByZWN0YW5nbGUgbmVlZHMgdG8gaGF2ZSBhIG5vbi1uZWdhdGl2ZSBmaW5pdGUgYXJjSGVpZ2h0ICgke3RoaXMuX2Nvcm5lcllSYWRpdXN9KWAgKTtcclxuXHJcbiAgICAvLyBzZXRzIG91ciAnY2FjaGUnIHRvIG51bGwsIHNvIHdlIGRvbid0IGFsd2F5cyBoYXZlIHRvIHJlY29tcHV0ZSBvdXIgc2hhcGVcclxuICAgIHRoaXMuX3NoYXBlID0gbnVsbDtcclxuXHJcbiAgICAvLyBzaG91bGQgaW52YWxpZGF0ZSB0aGUgcGF0aCBhbmQgZW5zdXJlIGEgcmVkcmF3XHJcbiAgICB0aGlzLmludmFsaWRhdGVQYXRoKCk7XHJcblxyXG4gICAgLy8gc2luY2Ugd2UgY2hhbmdlZCB0aGUgcmVjdGFuZ2xlIGFyYyB3aWR0aC9oZWlnaHQsIGl0IGNvdWxkIG1ha2UgRE9NIHdvcmsgb3Igbm90XHJcbiAgICB0aGlzLmludmFsaWRhdGVTdXBwb3J0ZWRSZW5kZXJlcnMoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgdXBkYXRlUHJlZmVycmVkU2l6ZXMoKTogdm9pZCB7XHJcbiAgICBsZXQgd2lkdGggPSB0aGlzLmxvY2FsUHJlZmVycmVkV2lkdGg7XHJcbiAgICBsZXQgaGVpZ2h0ID0gdGhpcy5sb2NhbFByZWZlcnJlZEhlaWdodDtcclxuXHJcbiAgICBpZiAoIHdpZHRoICE9PSBudWxsICkge1xyXG4gICAgICB3aWR0aCA9IE1hdGgubWF4KCB3aWR0aCwgdGhpcy5sb2NhbE1pbmltdW1XaWR0aCB8fCAwICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBoZWlnaHQgIT09IG51bGwgKSB7XHJcbiAgICAgIGhlaWdodCA9IE1hdGgubWF4KCBoZWlnaHQsIHRoaXMubG9jYWxNaW5pbXVtSGVpZ2h0IHx8IDAgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHdpZHRoICE9PSBudWxsICkge1xyXG4gICAgICB0aGlzLnJlY3RXaWR0aCA9IHRoaXMuaGFzU3Ryb2tlKCkgPyB3aWR0aCAtIHRoaXMubGluZVdpZHRoIDogd2lkdGg7XHJcbiAgICB9XHJcbiAgICBpZiAoIGhlaWdodCAhPT0gbnVsbCApIHtcclxuICAgICAgdGhpcy5yZWN0SGVpZ2h0ID0gdGhpcy5oYXNTdHJva2UoKSA/IGhlaWdodCAtIHRoaXMubGluZVdpZHRoIDogaGVpZ2h0O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gV2UgbmVlZCB0byBkZXRlY3Qgc3Ryb2tlIGNoYW5nZXMsIHNpbmNlIG91ciBwcmVmZXJyZWQgc2l6ZSBjb21wdXRhdGlvbnMgZGVwZW5kIG9uIGl0LlxyXG4gIHB1YmxpYyBvdmVycmlkZSBpbnZhbGlkYXRlU3Ryb2tlKCk6IHZvaWQge1xyXG4gICAgc3VwZXIuaW52YWxpZGF0ZVN0cm9rZSgpO1xyXG5cclxuICAgIHRoaXMudXBkYXRlUHJlZmVycmVkU2l6ZXMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXB1dGVzIHdoZXRoZXIgdGhlIHByb3ZpZGVkIHBvaW50IGlzIFwiaW5zaWRlXCIgKGNvbnRhaW5lZCkgaW4gdGhpcyBSZWN0YW5nbGUncyBzZWxmIGNvbnRlbnQsIG9yIFwib3V0c2lkZVwiLlxyXG4gICAqXHJcbiAgICogSGFuZGxlcyBheGlzLWFsaWduZWQgb3B0aW9uYWxseS1yb3VuZGVkIHJlY3RhbmdsZXMsIGFsdGhvdWdoIGNhbiBvbmx5IGRvIG9wdGltaXplZCBjb21wdXRhdGlvbiBpZiBpdCBpc24ndFxyXG4gICAqIHJvdW5kZWQuIElmIGl0IElTIHJvdW5kZWQsIHdlIGNoZWNrIGlmIGEgY29ybmVyIGNvbXB1dGF0aW9uIGlzIG5lZWRlZCAodXN1YWxseSBpc24ndCksIGFuZCBvbmx5IG5lZWQgdG8gY2hlY2tcclxuICAgKiBvbmUgY29ybmVyIGZvciB0aGF0IHRlc3QuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcG9pbnQgLSBDb25zaWRlcmVkIHRvIGJlIGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGNvbnRhaW5zUG9pbnRTZWxmKCBwb2ludDogVmVjdG9yMiApOiBib29sZWFuIHtcclxuICAgIGNvbnN0IHggPSB0aGlzLl9yZWN0WDtcclxuICAgIGNvbnN0IHkgPSB0aGlzLl9yZWN0WTtcclxuICAgIGNvbnN0IHdpZHRoID0gdGhpcy5fcmVjdFdpZHRoO1xyXG4gICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5fcmVjdEhlaWdodDtcclxuICAgIGNvbnN0IGFyY1dpZHRoID0gdGhpcy5fY29ybmVyWFJhZGl1cztcclxuICAgIGNvbnN0IGFyY0hlaWdodCA9IHRoaXMuX2Nvcm5lcllSYWRpdXM7XHJcbiAgICBjb25zdCBoYWxmTGluZSA9IHRoaXMuZ2V0TGluZVdpZHRoKCkgLyAyO1xyXG5cclxuICAgIGxldCByZXN1bHQgPSB0cnVlO1xyXG4gICAgaWYgKCB0aGlzLl9zdHJva2VQaWNrYWJsZSApIHtcclxuICAgICAgLy8gdGVzdCB0aGUgb3V0ZXIgYm91bmRhcnkgaWYgd2UgYXJlIHN0cm9rZS1waWNrYWJsZSAoaWYgYWxzbyBmaWxsLXBpY2thYmxlLCB0aGlzIGlzIHRoZSBvbmx5IHRlc3Qgd2UgbmVlZClcclxuICAgICAgY29uc3Qgcm91bmRlZCA9IHRoaXMuaXNSb3VuZGVkKCk7XHJcbiAgICAgIGlmICggIXJvdW5kZWQgJiYgdGhpcy5nZXRMaW5lSm9pbigpID09PSAnYmV2ZWwnICkge1xyXG4gICAgICAgIC8vIGZhbGwtYmFjayBmb3IgYmV2ZWxcclxuICAgICAgICByZXR1cm4gc3VwZXIuY29udGFpbnNQb2ludFNlbGYoIHBvaW50ICk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgbWl0ZXIgPSB0aGlzLmdldExpbmVKb2luKCkgPT09ICdtaXRlcicgJiYgIXJvdW5kZWQ7XHJcbiAgICAgIHJlc3VsdCA9IHJlc3VsdCAmJiBSZWN0YW5nbGUuaW50ZXJzZWN0cyggeCAtIGhhbGZMaW5lLCB5IC0gaGFsZkxpbmUsXHJcbiAgICAgICAgd2lkdGggKyAyICogaGFsZkxpbmUsIGhlaWdodCArIDIgKiBoYWxmTGluZSxcclxuICAgICAgICBtaXRlciA/IDAgOiAoIGFyY1dpZHRoICsgaGFsZkxpbmUgKSwgbWl0ZXIgPyAwIDogKCBhcmNIZWlnaHQgKyBoYWxmTGluZSApLFxyXG4gICAgICAgIHBvaW50ICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLl9maWxsUGlja2FibGUgKSB7XHJcbiAgICAgIGlmICggdGhpcy5fc3Ryb2tlUGlja2FibGUgKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gUmVjdGFuZ2xlLmludGVyc2VjdHMoIHgsIHksIHdpZHRoLCBoZWlnaHQsIGFyY1dpZHRoLCBhcmNIZWlnaHQsIHBvaW50ICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLl9zdHJva2VQaWNrYWJsZSApIHtcclxuICAgICAgcmV0dXJuIHJlc3VsdCAmJiAhUmVjdGFuZ2xlLmludGVyc2VjdHMoIHggKyBoYWxmTGluZSwgeSArIGhhbGZMaW5lLFxyXG4gICAgICAgIHdpZHRoIC0gMiAqIGhhbGZMaW5lLCBoZWlnaHQgLSAyICogaGFsZkxpbmUsXHJcbiAgICAgICAgYXJjV2lkdGggLSBoYWxmTGluZSwgYXJjSGVpZ2h0IC0gaGFsZkxpbmUsXHJcbiAgICAgICAgcG9pbnQgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gZmFsc2U7IC8vIGVpdGhlciBmaWxsIG5vciBzdHJva2UgaXMgcGlja2FibGVcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGlzIFJlY3RhbmdsZSdzIHNlbGZCb3VuZHMgaXMgaW50ZXJzZWN0ZWQgYnkgdGhlIHNwZWNpZmllZCBib3VuZHMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYm91bmRzIC0gQm91bmRzIHRvIHRlc3QsIGFzc3VtZWQgdG8gYmUgaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGludGVyc2VjdHNCb3VuZHNTZWxmKCBib3VuZHM6IEJvdW5kczIgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gIXRoaXMuY29tcHV0ZVNoYXBlQm91bmRzKCkuaW50ZXJzZWN0aW9uKCBib3VuZHMgKS5pc0VtcHR5KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEcmF3cyB0aGUgY3VycmVudCBOb2RlJ3Mgc2VsZiByZXByZXNlbnRhdGlvbiwgYXNzdW1pbmcgdGhlIHdyYXBwZXIncyBDYW52YXMgY29udGV4dCBpcyBhbHJlYWR5IGluIHRoZSBsb2NhbFxyXG4gICAqIGNvb3JkaW5hdGUgZnJhbWUgb2YgdGhpcyBub2RlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHdyYXBwZXJcclxuICAgKiBAcGFyYW0gbWF0cml4IC0gVGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBhbHJlYWR5IGFwcGxpZWQgdG8gdGhlIGNvbnRleHQuXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIG92ZXJyaWRlIGNhbnZhc1BhaW50U2VsZiggd3JhcHBlcjogQ2FudmFzQ29udGV4dFdyYXBwZXIsIG1hdHJpeDogTWF0cml4MyApOiB2b2lkIHtcclxuICAgIC8vVE9ETzogSGF2ZSBhIHNlcGFyYXRlIG1ldGhvZCBmb3IgdGhpcywgaW5zdGVhZCBvZiB0b3VjaGluZyB0aGUgcHJvdG90eXBlLiBDYW4gbWFrZSAndGhpcycgcmVmZXJlbmNlcyB0b28gZWFzaWx5LiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgUmVjdGFuZ2xlQ2FudmFzRHJhd2FibGUucHJvdG90eXBlLnBhaW50Q2FudmFzKCB3cmFwcGVyLCB0aGlzLCBtYXRyaXggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBET00gZHJhd2FibGUgZm9yIHRoaXMgUmVjdGFuZ2xlLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIEBwYXJhbSByZW5kZXJlciAtIEluIHRoZSBiaXRtYXNrIGZvcm1hdCBzcGVjaWZpZWQgYnkgUmVuZGVyZXIsIHdoaWNoIG1heSBjb250YWluIGFkZGl0aW9uYWwgYml0IGZsYWdzLlxyXG4gICAqIEBwYXJhbSBpbnN0YW5jZSAtIEluc3RhbmNlIG9iamVjdCB0aGF0IHdpbGwgYmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBjcmVhdGVET01EcmF3YWJsZSggcmVuZGVyZXI6IG51bWJlciwgaW5zdGFuY2U6IEluc3RhbmNlICk6IERPTVNlbGZEcmF3YWJsZSB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICByZXR1cm4gUmVjdGFuZ2xlRE9NRHJhd2FibGUuY3JlYXRlRnJvbVBvb2woIHJlbmRlcmVyLCBpbnN0YW5jZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIFNWRyBkcmF3YWJsZSBmb3IgdGhpcyBSZWN0YW5nbGUuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHJlbmRlcmVyIC0gSW4gdGhlIGJpdG1hc2sgZm9ybWF0IHNwZWNpZmllZCBieSBSZW5kZXJlciwgd2hpY2ggbWF5IGNvbnRhaW4gYWRkaXRpb25hbCBiaXQgZmxhZ3MuXHJcbiAgICogQHBhcmFtIGluc3RhbmNlIC0gSW5zdGFuY2Ugb2JqZWN0IHRoYXQgd2lsbCBiZSBhc3NvY2lhdGVkIHdpdGggdGhlIGRyYXdhYmxlXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGNyZWF0ZVNWR0RyYXdhYmxlKCByZW5kZXJlcjogbnVtYmVyLCBpbnN0YW5jZTogSW5zdGFuY2UgKTogU1ZHU2VsZkRyYXdhYmxlIHtcclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgIHJldHVybiBSZWN0YW5nbGVTVkdEcmF3YWJsZS5jcmVhdGVGcm9tUG9vbCggcmVuZGVyZXIsIGluc3RhbmNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgQ2FudmFzIGRyYXdhYmxlIGZvciB0aGlzIFJlY3RhbmdsZS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcmVuZGVyZXIgLSBJbiB0aGUgYml0bWFzayBmb3JtYXQgc3BlY2lmaWVkIGJ5IFJlbmRlcmVyLCB3aGljaCBtYXkgY29udGFpbiBhZGRpdGlvbmFsIGJpdCBmbGFncy5cclxuICAgKiBAcGFyYW0gaW5zdGFuY2UgLSBJbnN0YW5jZSBvYmplY3QgdGhhdCB3aWxsIGJlIGFzc29jaWF0ZWQgd2l0aCB0aGUgZHJhd2FibGVcclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgY3JlYXRlQ2FudmFzRHJhd2FibGUoIHJlbmRlcmVyOiBudW1iZXIsIGluc3RhbmNlOiBJbnN0YW5jZSApOiBDYW52YXNTZWxmRHJhd2FibGUge1xyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgcmV0dXJuIFJlY3RhbmdsZUNhbnZhc0RyYXdhYmxlLmNyZWF0ZUZyb21Qb29sKCByZW5kZXJlciwgaW5zdGFuY2UgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBXZWJHTCBkcmF3YWJsZSBmb3IgdGhpcyBSZWN0YW5nbGUuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHJlbmRlcmVyIC0gSW4gdGhlIGJpdG1hc2sgZm9ybWF0IHNwZWNpZmllZCBieSBSZW5kZXJlciwgd2hpY2ggbWF5IGNvbnRhaW4gYWRkaXRpb25hbCBiaXQgZmxhZ3MuXHJcbiAgICogQHBhcmFtIGluc3RhbmNlIC0gSW5zdGFuY2Ugb2JqZWN0IHRoYXQgd2lsbCBiZSBhc3NvY2lhdGVkIHdpdGggdGhlIGRyYXdhYmxlXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGNyZWF0ZVdlYkdMRHJhd2FibGUoIHJlbmRlcmVyOiBudW1iZXIsIGluc3RhbmNlOiBJbnN0YW5jZSApOiBXZWJHTFNlbGZEcmF3YWJsZSB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICByZXR1cm4gUmVjdGFuZ2xlV2ViR0xEcmF3YWJsZS5jcmVhdGVGcm9tUG9vbCggcmVuZGVyZXIsIGluc3RhbmNlICk7XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBNaXNjZWxsYW5lb3VzXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgLyoqXHJcbiAgICogSXQgaXMgaW1wb3NzaWJsZSB0byBzZXQgYW5vdGhlciBzaGFwZSBvbiB0aGlzIFBhdGggc3VidHlwZSwgYXMgaXRzIGVmZmVjdGl2ZSBzaGFwZSBpcyBkZXRlcm1pbmVkIGJ5IG90aGVyXHJcbiAgICogcGFyYW1ldGVycy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBzaGFwZSAtIFRocm93cyBhbiBlcnJvciBpZiBpdCBpcyBub3QgbnVsbC5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgc2V0U2hhcGUoIHNoYXBlOiBTaGFwZSB8IHN0cmluZyB8IG51bGwgKTogdGhpcyB7XHJcbiAgICBpZiAoIHNoYXBlICE9PSBudWxsICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoICdDYW5ub3Qgc2V0IHRoZSBzaGFwZSBvZiBhIFJlY3RhbmdsZSB0byBzb21ldGhpbmcgbm9uLW51bGwnICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gcHJvYmFibHkgY2FsbGVkIGZyb20gdGhlIFBhdGggY29uc3RydWN0b3JcclxuICAgICAgdGhpcy5pbnZhbGlkYXRlUGF0aCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGltbXV0YWJsZSBjb3B5IG9mIHRoaXMgUGF0aCBzdWJ0eXBlJ3MgcmVwcmVzZW50YXRpb24uXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIGlzIGNyZWF0ZWQgbGF6aWx5LCBzbyBkb24ndCBjYWxsIGl0IGlmIHlvdSBkb24ndCBoYXZlIHRvIVxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBnZXRTaGFwZSgpOiBTaGFwZSB7XHJcbiAgICBpZiAoICF0aGlzLl9zaGFwZSApIHtcclxuICAgICAgdGhpcy5fc2hhcGUgPSB0aGlzLmNyZWF0ZVJlY3RhbmdsZVNoYXBlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fc2hhcGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBQYXRoIGhhcyBhbiBhc3NvY2lhdGVkIFNoYXBlIChpbnN0ZWFkIG9mIG5vIHNoYXBlLCByZXByZXNlbnRlZCBieSBudWxsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBoYXNTaGFwZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIHNldFNoYXBlUHJvcGVydHkoIG5ld1RhcmdldDogVFJlYWRPbmx5UHJvcGVydHk8U2hhcGUgfCBzdHJpbmcgfCBudWxsPiB8IG51bGwgKTogdGhpcyB7XHJcbiAgICBpZiAoIG5ld1RhcmdldCAhPT0gbnVsbCApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQ2Fubm90IHNldCB0aGUgc2hhcGVQcm9wZXJ0eSBvZiBhIFJlY3RhbmdsZSB0byBzb21ldGhpbmcgbm9uLW51bGwsIGl0IGhhbmRsZXMgdGhpcyBpdHNlbGYnICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIGJvdGggb2YgdGhlIGNvcm5lciByYWRpaSB0byB0aGUgc2FtZSB2YWx1ZSwgc28gdGhhdCB0aGUgcm91bmRlZCBjb3JuZXJzIHdpbGwgYmUgY2lyY3VsYXIgYXJjcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Q29ybmVyUmFkaXVzKCBjb3JuZXJSYWRpdXM6IG51bWJlciApOiB0aGlzIHtcclxuICAgIHRoaXMuc2V0Q29ybmVyWFJhZGl1cyggY29ybmVyUmFkaXVzICk7XHJcbiAgICB0aGlzLnNldENvcm5lcllSYWRpdXMoIGNvcm5lclJhZGl1cyApO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGNvcm5lclJhZGl1cyggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRDb3JuZXJSYWRpdXMoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBjb3JuZXJSYWRpdXMoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0Q29ybmVyUmFkaXVzKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY29ybmVyIHJhZGl1cyBpZiBib3RoIHRoZSBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBjb3JuZXIgcmFkaWkgYXJlIHRoZSBzYW1lLlxyXG4gICAqXHJcbiAgICogTk9URTogSWYgdGhlcmUgYXJlIGRpZmZlcmVudCBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBjb3JuZXIgcmFkaWksIHRoaXMgd2lsbCBmYWlsIGFuIGFzc2VydGlvbiBhbmQgcmV0dXJuIHRoZSBob3Jpem9udGFsIHJhZGl1cy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q29ybmVyUmFkaXVzKCk6IG51bWJlciB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9jb3JuZXJYUmFkaXVzID09PSB0aGlzLl9jb3JuZXJZUmFkaXVzLFxyXG4gICAgICAnZ2V0Q29ybmVyUmFkaXVzKCkgaW52YWxpZCBpZiB4L3kgcmFkaWkgYXJlIGRpZmZlcmVudCcgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5fY29ybmVyWFJhZGl1cztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBtdXRhdGUoIG9wdGlvbnM/OiBSZWN0YW5nbGVPcHRpb25zICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHN1cGVyLm11dGF0ZSggb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIGEgcG9pbnQgaXMgd2l0aGluIGEgcm91bmRlZCByZWN0YW5nbGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0geCAtIFggdmFsdWUgb2YgdGhlIGxlZnQgc2lkZSBvZiB0aGUgcmVjdGFuZ2xlXHJcbiAgICogQHBhcmFtIHkgLSBZIHZhbHVlIG9mIHRoZSB0b3Agc2lkZSBvZiB0aGUgcmVjdGFuZ2xlXHJcbiAgICogQHBhcmFtIHdpZHRoIC0gV2lkdGggb2YgdGhlIHJlY3RhbmdsZVxyXG4gICAqIEBwYXJhbSBoZWlnaHQgLSBIZWlnaHQgb2YgdGhlIHJlY3RhbmdsZVxyXG4gICAqIEBwYXJhbSBhcmNXaWR0aCAtIEhvcml6b250YWwgY29ybmVyIHJhZGl1cyBvZiB0aGUgcmVjdGFuZ2xlXHJcbiAgICogQHBhcmFtIGFyY0hlaWdodCAtIFZlcnRpY2FsIGNvcm5lciByYWRpdXMgb2YgdGhlIHJlY3RhbmdsZVxyXG4gICAqIEBwYXJhbSBwb2ludCAtIFRoZSBwb2ludCB0aGF0IG1heSBvciBtYXkgbm90IGJlIGluIHRoZSByb3VuZGVkIHJlY3RhbmdsZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgaW50ZXJzZWN0cyggeDogbnVtYmVyLCB5OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBhcmNXaWR0aDogbnVtYmVyLCBhcmNIZWlnaHQ6IG51bWJlciwgcG9pbnQ6IFZlY3RvcjIgKTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBwb2ludC54ID49IHggJiZcclxuICAgICAgICAgICAgICAgICAgIHBvaW50LnggPD0geCArIHdpZHRoICYmXHJcbiAgICAgICAgICAgICAgICAgICBwb2ludC55ID49IHkgJiZcclxuICAgICAgICAgICAgICAgICAgIHBvaW50LnkgPD0geSArIGhlaWdodDtcclxuXHJcbiAgICBpZiAoICFyZXN1bHQgfHwgYXJjV2lkdGggPD0gMCB8fCBhcmNIZWlnaHQgPD0gMCApIHtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjb3B5IGJvcmRlci1yYWRpdXMgQ1NTIGJlaGF2aW9yIGluIENocm9tZSwgd2hlcmUgdGhlIGFyY3Mgd29uJ3QgaW50ZXJzZWN0LCBpbiBjYXNlcyB3aGVyZSB0aGUgYXJjIHNlZ21lbnRzIGF0IGZ1bGwgc2l6ZSB3b3VsZCBpbnRlcnNlY3QgZWFjaCBvdGhlclxyXG4gICAgY29uc3QgbWF4aW11bUFyY1NpemUgPSBNYXRoLm1pbiggd2lkdGggLyAyLCBoZWlnaHQgLyAyICk7XHJcbiAgICBhcmNXaWR0aCA9IE1hdGgubWluKCBtYXhpbXVtQXJjU2l6ZSwgYXJjV2lkdGggKTtcclxuICAgIGFyY0hlaWdodCA9IE1hdGgubWluKCBtYXhpbXVtQXJjU2l6ZSwgYXJjSGVpZ2h0ICk7XHJcblxyXG4gICAgLy8gd2UgYXJlIHJvdW5kZWQgYW5kIGluc2lkZSB0aGUgbG9naWNhbCByZWN0YW5nbGUgKGlmIGl0IGRpZG4ndCBoYXZlIHJvdW5kZWQgY29ybmVycylcclxuXHJcbiAgICAvLyBjbG9zZXN0IGNvcm5lciBhcmMncyBjZW50ZXIgKHdlIGFzc3VtZSB0aGUgcm91bmRlZCByZWN0YW5nbGUncyBhcmNzIGFyZSA5MCBkZWdyZWVzIGZ1bGx5LCBhbmQgZG9uJ3QgaW50ZXJzZWN0KVxyXG4gICAgbGV0IGNsb3Nlc3RDb3JuZXJYO1xyXG4gICAgbGV0IGNsb3Nlc3RDb3JuZXJZO1xyXG4gICAgbGV0IGd1YXJhbnRlZWRJbnNpZGUgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBpZiB3ZSBhcmUgdG8gdGhlIGluc2lkZSBvZiB0aGUgY2xvc2VzdCBjb3JuZXIgYXJjJ3MgY2VudGVyLCB3ZSBhcmUgZ3VhcmFudGVlZCB0byBiZSBpbiB0aGUgcm91bmRlZCByZWN0YW5nbGUgKGd1YXJhbnRlZWRJbnNpZGUpXHJcbiAgICBpZiAoIHBvaW50LnggPCB4ICsgd2lkdGggLyAyICkge1xyXG4gICAgICBjbG9zZXN0Q29ybmVyWCA9IHggKyBhcmNXaWR0aDtcclxuICAgICAgZ3VhcmFudGVlZEluc2lkZSA9IGd1YXJhbnRlZWRJbnNpZGUgfHwgcG9pbnQueCA+PSBjbG9zZXN0Q29ybmVyWDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBjbG9zZXN0Q29ybmVyWCA9IHggKyB3aWR0aCAtIGFyY1dpZHRoO1xyXG4gICAgICBndWFyYW50ZWVkSW5zaWRlID0gZ3VhcmFudGVlZEluc2lkZSB8fCBwb2ludC54IDw9IGNsb3Nlc3RDb3JuZXJYO1xyXG4gICAgfVxyXG4gICAgaWYgKCBndWFyYW50ZWVkSW5zaWRlICkgeyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuICAgIGlmICggcG9pbnQueSA8IHkgKyBoZWlnaHQgLyAyICkge1xyXG4gICAgICBjbG9zZXN0Q29ybmVyWSA9IHkgKyBhcmNIZWlnaHQ7XHJcbiAgICAgIGd1YXJhbnRlZWRJbnNpZGUgPSBndWFyYW50ZWVkSW5zaWRlIHx8IHBvaW50LnkgPj0gY2xvc2VzdENvcm5lclk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY2xvc2VzdENvcm5lclkgPSB5ICsgaGVpZ2h0IC0gYXJjSGVpZ2h0O1xyXG4gICAgICBndWFyYW50ZWVkSW5zaWRlID0gZ3VhcmFudGVlZEluc2lkZSB8fCBwb2ludC55IDw9IGNsb3Nlc3RDb3JuZXJZO1xyXG4gICAgfVxyXG4gICAgaWYgKCBndWFyYW50ZWVkSW5zaWRlICkgeyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuICAgIC8vIHdlIGFyZSBub3cgaW4gdGhlIHJlY3Rhbmd1bGFyIHJlZ2lvbiBiZXR3ZWVuIHRoZSBsb2dpY2FsIGNvcm5lciBhbmQgdGhlIGNlbnRlciBvZiB0aGUgY2xvc2VzdCBjb3JuZXIncyBhcmMuXHJcblxyXG4gICAgLy8gb2Zmc2V0IGZyb20gdGhlIGNsb3Nlc3QgY29ybmVyJ3MgYXJjIGNlbnRlclxyXG4gICAgbGV0IG9mZnNldFggPSBwb2ludC54IC0gY2xvc2VzdENvcm5lclg7XHJcbiAgICBsZXQgb2Zmc2V0WSA9IHBvaW50LnkgLSBjbG9zZXN0Q29ybmVyWTtcclxuXHJcbiAgICAvLyBub3JtYWxpemUgdGhlIGNvb3JkaW5hdGVzIHNvIG5vdyB3ZSBhcmUgZGVhbGluZyB3aXRoIGEgdW5pdCBjaXJjbGVcclxuICAgIC8vICh0ZWNobmljYWxseSBhcmMsIGJ1dCB3ZSBhcmUgZ3VhcmFudGVlZCB0byBiZSBpbiB0aGUgYXJlYSBjb3ZlcmVkIGJ5IHRoZSBhcmMsIHNvIHdlIGp1c3QgY29uc2lkZXIgdGhlIGNpcmNsZSlcclxuICAgIC8vIE5PVEU6IHdlIGFyZSByb3VuZGVkLCBzbyBib3RoIGFyY1dpZHRoIGFuZCBhcmNIZWlnaHQgYXJlIG5vbi16ZXJvICh0aGlzIGlzIHdlbGwgZGVmaW5lZClcclxuICAgIG9mZnNldFggLz0gYXJjV2lkdGg7XHJcbiAgICBvZmZzZXRZIC89IGFyY0hlaWdodDtcclxuXHJcbiAgICBvZmZzZXRYICo9IG9mZnNldFg7XHJcbiAgICBvZmZzZXRZICo9IG9mZnNldFk7XHJcbiAgICByZXR1cm4gb2Zmc2V0WCArIG9mZnNldFkgPD0gMTsgLy8gcmV0dXJuIHdoZXRoZXIgd2UgYXJlIGluIHRoZSByb3VuZGVkIGNvcm5lci4gc2VlIHRoZSBmb3JtdWxhIGZvciBhbiBlbGxpcHNlXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgcmVjdGFuZ2xlIHdpdGggdGhlIHNwZWNpZmllZCB4L3kvd2lkdGgvaGVpZ2h0LlxyXG4gICAqXHJcbiAgICogU2VlIFJlY3RhbmdsZSdzIGNvbnN0cnVjdG9yIGZvciBkZXRhaWxlZCBwYXJhbWV0ZXIgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByZWN0KCB4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIG9wdGlvbnM/OiBSZWN0YW5nbGVPcHRpb25zICk6IFJlY3RhbmdsZSB7XHJcbiAgICByZXR1cm4gbmV3IFJlY3RhbmdsZSggeCwgeSwgd2lkdGgsIGhlaWdodCwgMCwgMCwgb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIHJvdW5kZWQgcmVjdGFuZ2xlIHdpdGggdGhlIHNwZWNpZmllZCB4L3kvd2lkdGgvaGVpZ2h0L2Nvcm5lclhSYWRpdXMvY29ybmVyWVJhZGl1cy5cclxuICAgKlxyXG4gICAqIFNlZSBSZWN0YW5nbGUncyBjb25zdHJ1Y3RvciBmb3IgZGV0YWlsZWQgcGFyYW1ldGVyIGluZm9ybWF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcm91bmRlZFJlY3QoIHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgY29ybmVyWFJhZGl1czogbnVtYmVyLCBjb3JuZXJZUmFkaXVzOiBudW1iZXIsIG9wdGlvbnM/OiBSZWN0YW5nbGVPcHRpb25zICk6IFJlY3RhbmdsZSB7XHJcbiAgICByZXR1cm4gbmV3IFJlY3RhbmdsZSggeCwgeSwgd2lkdGgsIGhlaWdodCwgY29ybmVyWFJhZGl1cywgY29ybmVyWVJhZGl1cywgb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIHJlY3RhbmdsZSB4L3kvd2lkdGgvaGVpZ2h0IG1hdGNoaW5nIHRoZSBzcGVjaWZpZWQgYm91bmRzLlxyXG4gICAqXHJcbiAgICogU2VlIFJlY3RhbmdsZSdzIGNvbnN0cnVjdG9yIGZvciBkZXRhaWxlZCBwYXJhbWV0ZXIgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBib3VuZHMoIGJvdW5kczogQm91bmRzMiwgb3B0aW9ucz86IFJlY3RhbmdsZU9wdGlvbnMgKTogUmVjdGFuZ2xlIHtcclxuICAgIHJldHVybiBuZXcgUmVjdGFuZ2xlKCBib3VuZHMubWluWCwgYm91bmRzLm1pblksIGJvdW5kcy53aWR0aCwgYm91bmRzLmhlaWdodCwgb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIHJvdW5kZWQgcmVjdGFuZ2xlIHgveS93aWR0aC9oZWlnaHQgbWF0Y2hpbmcgdGhlIHNwZWNpZmllZCBib3VuZHMgKFJlY3RhbmdsZS5ib3VuZHMsIGJ1dCB3aXRoIGFkZGl0aW9uYWxcclxuICAgKiBjb3JuZXJYUmFkaXVzIGFuZCBjb3JuZXJZUmFkaXVzKS5cclxuICAgKlxyXG4gICAqIFNlZSBSZWN0YW5nbGUncyBjb25zdHJ1Y3RvciBmb3IgZGV0YWlsZWQgcGFyYW1ldGVyIGluZm9ybWF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcm91bmRlZEJvdW5kcyggYm91bmRzOiBCb3VuZHMyLCBjb3JuZXJYUmFkaXVzOiBudW1iZXIsIGNvcm5lcllSYWRpdXM6IG51bWJlciwgb3B0aW9ucz86IFJlY3RhbmdsZU9wdGlvbnMgKTogUmVjdGFuZ2xlIHtcclxuICAgIHJldHVybiBuZXcgUmVjdGFuZ2xlKCBib3VuZHMubWluWCwgYm91bmRzLm1pblksIGJvdW5kcy53aWR0aCwgYm91bmRzLmhlaWdodCwgY29ybmVyWFJhZGl1cywgY29ybmVyWVJhZGl1cywgb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIHJlY3RhbmdsZSB3aXRoIHRvcC9sZWZ0IG9mICgwLDApIHdpdGggdGhlIHNwZWNpZmllZCB7RGltZW5zaW9uMn0ncyB3aWR0aCBhbmQgaGVpZ2h0LlxyXG4gICAqXHJcbiAgICogU2VlIFJlY3RhbmdsZSdzIGNvbnN0cnVjdG9yIGZvciBkZXRhaWxlZCBwYXJhbWV0ZXIgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBkaW1lbnNpb24oIGRpbWVuc2lvbjogRGltZW5zaW9uMiwgb3B0aW9ucz86IFJlY3RhbmdsZU9wdGlvbnMgKTogUmVjdGFuZ2xlIHtcclxuICAgIHJldHVybiBuZXcgUmVjdGFuZ2xlKCAwLCAwLCBkaW1lbnNpb24ud2lkdGgsIGRpbWVuc2lvbi5oZWlnaHQsIDAsIDAsIG9wdGlvbnMgKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiB7QXJyYXkuPHN0cmluZz59IC0gU3RyaW5nIGtleXMgZm9yIGFsbCB0aGUgYWxsb3dlZCBvcHRpb25zIHRoYXQgd2lsbCBiZSBzZXQgYnkgbm9kZS5tdXRhdGUoIG9wdGlvbnMgKSwgaW4gdGhlXHJcbiAqIG9yZGVyIHRoZXkgd2lsbCBiZSBldmFsdWF0ZWQgaW4uXHJcbiAqXHJcbiAqIE5PVEU6IFNlZSBOb2RlJ3MgX211dGF0b3JLZXlzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gaG93IHRoaXMgb3BlcmF0ZXMsIGFuZCBwb3RlbnRpYWwgc3BlY2lhbFxyXG4gKiAgICAgICBjYXNlcyB0aGF0IG1heSBhcHBseS5cclxuICovXHJcblJlY3RhbmdsZS5wcm90b3R5cGUuX211dGF0b3JLZXlzID0gWyAuLi5SRUNUQU5HTEVfT1BUSU9OX0tFWVMsIC4uLlN1cGVyVHlwZS5wcm90b3R5cGUuX211dGF0b3JLZXlzIF07XHJcblxyXG4vKipcclxuICoge0FycmF5LjxTdHJpbmc+fSAtIExpc3Qgb2YgYWxsIGRpcnR5IGZsYWdzIHRoYXQgc2hvdWxkIGJlIGF2YWlsYWJsZSBvbiBkcmF3YWJsZXMgY3JlYXRlZCBmcm9tIHRoaXMgbm9kZSAob3JcclxuICogICAgICAgICAgICAgICAgICAgIHN1YnR5cGUpLiBHaXZlbiBhIGZsYWcgKGUuZy4gcmFkaXVzKSwgaXQgaW5kaWNhdGVzIHRoZSBleGlzdGVuY2Ugb2YgYSBmdW5jdGlvblxyXG4gKiAgICAgICAgICAgICAgICAgICAgZHJhd2FibGUubWFya0RpcnR5UmFkaXVzKCkgdGhhdCB3aWxsIGluZGljYXRlIHRvIHRoZSBkcmF3YWJsZSB0aGF0IHRoZSByYWRpdXMgaGFzIGNoYW5nZWQuXHJcbiAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gKiBAb3ZlcnJpZGVcclxuICovXHJcblJlY3RhbmdsZS5wcm90b3R5cGUuZHJhd2FibGVNYXJrRmxhZ3MgPSBQYXRoLnByb3RvdHlwZS5kcmF3YWJsZU1hcmtGbGFncy5jb25jYXQoIFsgJ3gnLCAneScsICd3aWR0aCcsICdoZWlnaHQnLCAnY29ybmVyWFJhZGl1cycsICdjb3JuZXJZUmFkaXVzJyBdICkuZmlsdGVyKCBmbGFnID0+IGZsYWcgIT09ICdzaGFwZScgKTtcclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdSZWN0YW5nbGUnLCBSZWN0YW5nbGUgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEs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