// Copyright 2013-2024, University of Colorado Boulder

/**
 * A 2D rectangle-shaped bounded area (bounding box).
 *
 * There are a number of convenience functions to get positions and points on the Bounds. Currently we do not
 * store these with the Bounds2 instance, since we want to lower the memory footprint.
 *
 * minX, minY, maxX, and maxY are actually stored. We don't do x,y,width,height because this can't properly express
 * semi-infinite bounds (like a half-plane), or easily handle what Bounds2.NOTHING and Bounds2.EVERYTHING do with
 * the constructive solid areas.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import IOType from '../../tandem/js/types/IOType.js';
import InfiniteNumberIO from '../../tandem/js/types/InfiniteNumberIO.js';
import Vector2 from './Vector2.js';
import dot from './dot.js';
import Range from './Range.js';
import Pool from '../../phet-core/js/Pool.js';
import Orientation from '../../phet-core/js/Orientation.js';

// Temporary instances to be used in the transform method.
const scratchVector2 = new Vector2(0, 0);

// For PhET-iO serialization

// Duck typed for when creating a Bounds2 with support for Bounds3 or other structurally similar object.

export default class Bounds2 {
  // The minimum X coordinate of the bounds.

  // The minimum Y coordinate of the bounds.

  // The maximum X coordinate of the bounds.

  // The maximum Y coordinate of the bounds.

  /**
   * Creates a 2-dimensional bounds (bounding box).
   *
   * @param minX - The initial minimum X coordinate of the bounds.
   * @param minY - The initial minimum Y coordinate of the bounds.
   * @param maxX - The initial maximum X coordinate of the bounds.
   * @param maxY - The initial maximum Y coordinate of the bounds.
   */
  constructor(minX, minY, maxX, maxY) {
    assert && assert(maxY !== undefined, 'Bounds2 requires 4 parameters');
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  /*---------------------------------------------------------------------------*
   * Properties
   *---------------------------------------------------------------------------*/

  /**
   * The width of the bounds, defined as maxX - minX.
   */
  getWidth() {
    return this.maxX - this.minX;
  }
  get width() {
    return this.getWidth();
  }

  /**
   * The height of the bounds, defined as maxY - minY.
   */
  getHeight() {
    return this.maxY - this.minY;
  }
  get height() {
    return this.getHeight();
  }

  /*
   * Convenience positions
   * upper is in terms of the visual layout in Scenery and other programs, so the minY is the "upper", and minY is the "lower"
   *
   *             minX (x)     centerX        maxX
   *          ---------------------------------------
   * minY (y) | leftTop     centerTop     rightTop
   * centerY  | leftCenter  center        rightCenter
   * maxY     | leftBottom  centerBottom  rightBottom
   */

  /**
   * Alias for minX, when thinking of the bounds as an (x,y,width,height) rectangle.
   */
  getX() {
    return this.minX;
  }
  get x() {
    return this.getX();
  }

  /**
   * Alias for minY, when thinking of the bounds as an (x,y,width,height) rectangle.
   */
  getY() {
    return this.minY;
  }
  get y() {
    return this.getY();
  }

  /**
   * Alias for minX, supporting the explicit getter function style.
   */
  getMinX() {
    return this.minX;
  }

  /**
   * Alias for minY, supporting the explicit getter function style.
   */
  getMinY() {
    return this.minY;
  }

  /**
   * Alias for maxX, supporting the explicit getter function style.
   */
  getMaxX() {
    return this.maxX;
  }

  /**
   * Alias for maxY, supporting the explicit getter function style.
   */
  getMaxY() {
    return this.maxY;
  }

  /**
   * Alias for minX, when thinking in the UI-layout manner.
   */
  getLeft() {
    return this.minX;
  }
  get left() {
    return this.minX;
  }

  /**
   * Alias for minY, when thinking in the UI-layout manner.
   */
  getTop() {
    return this.minY;
  }
  get top() {
    return this.minY;
  }

  /**
   * Alias for maxX, when thinking in the UI-layout manner.
   */
  getRight() {
    return this.maxX;
  }
  get right() {
    return this.maxX;
  }

  /**
   * Alias for maxY, when thinking in the UI-layout manner.
   */
  getBottom() {
    return this.maxY;
  }
  get bottom() {
    return this.maxY;
  }

  /**
   * The horizontal (X-coordinate) center of the bounds, averaging the minX and maxX.
   */
  getCenterX() {
    return (this.maxX + this.minX) / 2;
  }
  get centerX() {
    return this.getCenterX();
  }

  /**
   * The vertical (Y-coordinate) center of the bounds, averaging the minY and maxY.
   */
  getCenterY() {
    return (this.maxY + this.minY) / 2;
  }
  get centerY() {
    return this.getCenterY();
  }

  /**
   * The point (minX, minY), in the UI-coordinate upper-left.
   */
  getLeftTop() {
    return new Vector2(this.minX, this.minY);
  }
  get leftTop() {
    return this.getLeftTop();
  }

  /**
   * The point (centerX, minY), in the UI-coordinate upper-center.
   */
  getCenterTop() {
    return new Vector2(this.getCenterX(), this.minY);
  }
  get centerTop() {
    return this.getCenterTop();
  }

  /**
   * The point (right, minY), in the UI-coordinate upper-right.
   */
  getRightTop() {
    return new Vector2(this.maxX, this.minY);
  }
  get rightTop() {
    return this.getRightTop();
  }

  /**
   * The point (left, centerY), in the UI-coordinate center-left.
   */
  getLeftCenter() {
    return new Vector2(this.minX, this.getCenterY());
  }
  get leftCenter() {
    return this.getLeftCenter();
  }

  /**
   * The point (centerX, centerY), in the center of the bounds.
   */
  getCenter() {
    return new Vector2(this.getCenterX(), this.getCenterY());
  }
  get center() {
    return this.getCenter();
  }

  /**
   * The point (maxX, centerY), in the UI-coordinate center-right
   */
  getRightCenter() {
    return new Vector2(this.maxX, this.getCenterY());
  }
  get rightCenter() {
    return this.getRightCenter();
  }

  /**
   * The point (minX, maxY), in the UI-coordinate lower-left
   */
  getLeftBottom() {
    return new Vector2(this.minX, this.maxY);
  }
  get leftBottom() {
    return this.getLeftBottom();
  }

  /**
   * The point (centerX, maxY), in the UI-coordinate lower-center
   */
  getCenterBottom() {
    return new Vector2(this.getCenterX(), this.maxY);
  }
  get centerBottom() {
    return this.getCenterBottom();
  }

  /**
   * The point (maxX, maxY), in the UI-coordinate lower-right
   */
  getRightBottom() {
    return new Vector2(this.maxX, this.maxY);
  }
  get rightBottom() {
    return this.getRightBottom();
  }

  /**
   * Whether we have negative width or height. Bounds2.NOTHING is a prime example of an empty Bounds2.
   * Bounds with width = height = 0 are considered not empty, since they include the single (0,0) point.
   */
  isEmpty() {
    return this.getWidth() < 0 || this.getHeight() < 0;
  }

  /**
   * Whether our minimums and maximums are all finite numbers. This will exclude Bounds2.NOTHING and Bounds2.EVERYTHING.
   */
  isFinite() {
    return isFinite(this.minX) && isFinite(this.minY) && isFinite(this.maxX) && isFinite(this.maxY);
  }

  /**
   * Whether this bounds has a non-zero area (non-zero positive width and height).
   */
  hasNonzeroArea() {
    return this.getWidth() > 0 && this.getHeight() > 0;
  }

  /**
   * Whether this bounds has a finite and non-negative width and height.
   */
  isValid() {
    return !this.isEmpty() && this.isFinite();
  }

  /**
   * If the point is inside the bounds, the point will be returned. Otherwise, this will return a new point
   * on the edge of the bounds that is the closest to the provided point.
   */
  closestPointTo(point) {
    if (this.containsCoordinates(point.x, point.y)) {
      return point;
    } else {
      return this.getConstrainedPoint(point);
    }
  }

  /**
   * Find the point on the boundary of the Bounds2 that is closest to the provided point.
   */
  closestBoundaryPointTo(point) {
    if (this.containsCoordinates(point.x, point.y)) {
      const closestXEdge = point.x < this.centerX ? this.minX : this.maxX;
      const closestYEdge = point.y < this.centerY ? this.minY : this.maxY;

      // Decide which cardinal direction to go based on simple distance.
      if (Math.abs(closestXEdge - point.x) < Math.abs(closestYEdge - point.y)) {
        return new Vector2(closestXEdge, point.y);
      } else {
        return new Vector2(point.x, closestYEdge);
      }
    } else {
      return this.getConstrainedPoint(point);
    }
  }

  /**
   * Give a point outside of this Bounds2, constrain it to a point on the boundary of this Bounds2.
   */
  getConstrainedPoint(point) {
    const xConstrained = Math.max(Math.min(point.x, this.maxX), this.x);
    const yConstrained = Math.max(Math.min(point.y, this.maxY), this.y);
    return new Vector2(xConstrained, yConstrained);
  }

  /**
   * Whether the coordinates are contained inside the bounding box, or are on the boundary.
   *
   * @param x - X coordinate of the point to check
   * @param y - Y coordinate of the point to check
   */
  containsCoordinates(x, y) {
    return this.minX <= x && x <= this.maxX && this.minY <= y && y <= this.maxY;
  }

  /**
   * Whether the point is contained inside the bounding box, or is on the boundary.
   */
  containsPoint(point) {
    return this.containsCoordinates(point.x, point.y);
  }

  /**
   * Whether this bounding box completely contains the bounding box passed as a parameter. The boundary of a box is
   * considered to be "contained".
   */
  containsBounds(bounds) {
    return this.minX <= bounds.minX && this.maxX >= bounds.maxX && this.minY <= bounds.minY && this.maxY >= bounds.maxY;
  }

  /**
   * Whether this and another bounding box have any points of intersection (including touching boundaries).
   */
  intersectsBounds(bounds) {
    const minX = Math.max(this.minX, bounds.minX);
    const minY = Math.max(this.minY, bounds.minY);
    const maxX = Math.min(this.maxX, bounds.maxX);
    const maxY = Math.min(this.maxY, bounds.maxY);
    return maxX - minX >= 0 && maxY - minY >= 0;
  }

  /**
   * The squared distance from the input point to the point closest to it inside the bounding box.
   */
  minimumDistanceToPointSquared(point) {
    const closeX = point.x < this.minX ? this.minX : point.x > this.maxX ? this.maxX : null;
    const closeY = point.y < this.minY ? this.minY : point.y > this.maxY ? this.maxY : null;
    let d;
    if (closeX === null && closeY === null) {
      // inside, or on the boundary
      return 0;
    } else if (closeX === null) {
      // vertically directly above/below
      d = closeY - point.y;
      return d * d;
    } else if (closeY === null) {
      // horizontally directly to the left/right
      d = closeX - point.x;
      return d * d;
    } else {
      // corner case
      const dx = closeX - point.x;
      const dy = closeY - point.y;
      return dx * dx + dy * dy;
    }
  }

  /**
   * The squared distance from the input point to the point furthest from it inside the bounding box.
   */
  maximumDistanceToPointSquared(point) {
    let x = point.x > this.getCenterX() ? this.minX : this.maxX;
    let y = point.y > this.getCenterY() ? this.minY : this.maxY;
    x -= point.x;
    y -= point.y;
    return x * x + y * y;
  }

  /**
   * Debugging string for the bounds.
   */
  toString() {
    return `[x:(${this.minX},${this.maxX}),y:(${this.minY},${this.maxY})]`;
  }

  /**
   * Exact equality comparison between this bounds and another bounds.
   *
   * @returns - Whether the two bounds are equal
   */
  equals(other) {
    return this.minX === other.minX && this.minY === other.minY && this.maxX === other.maxX && this.maxY === other.maxY;
  }

  /**
   * Approximate equality comparison between this bounds and another bounds.
   *
   * @returns - Whether difference between the two bounds has no min/max with an absolute value greater
   *            than epsilon.
   */
  equalsEpsilon(other, epsilon) {
    epsilon = epsilon !== undefined ? epsilon : 0;
    const thisFinite = this.isFinite();
    const otherFinite = other.isFinite();
    if (thisFinite && otherFinite) {
      // both are finite, so we can use Math.abs() - it would fail with non-finite values like Infinity
      return Math.abs(this.minX - other.minX) < epsilon && Math.abs(this.minY - other.minY) < epsilon && Math.abs(this.maxX - other.maxX) < epsilon && Math.abs(this.maxY - other.maxY) < epsilon;
    } else if (thisFinite !== otherFinite) {
      return false; // one is finite, the other is not. definitely not equal
    } else if (this === other) {
      return true; // exact same instance, must be equal
    } else {
      // epsilon only applies on finite dimensions. due to JS's handling of isFinite(), it's faster to check the sum of both
      return (isFinite(this.minX + other.minX) ? Math.abs(this.minX - other.minX) < epsilon : this.minX === other.minX) && (isFinite(this.minY + other.minY) ? Math.abs(this.minY - other.minY) < epsilon : this.minY === other.minY) && (isFinite(this.maxX + other.maxX) ? Math.abs(this.maxX - other.maxX) < epsilon : this.maxX === other.maxX) && (isFinite(this.maxY + other.maxY) ? Math.abs(this.maxY - other.maxY) < epsilon : this.maxY === other.maxY);
    }
  }

  /*---------------------------------------------------------------------------*
   * Immutable operations
   *---------------------------------------------------------------------------*/

  /**
   * Creates a copy of this bounds, or if a bounds is passed in, set that bounds's values to ours.
   *
   * This is the immutable form of the function set(), if a bounds is provided. This will return a new bounds, and
   * will not modify this bounds.
   *
   * @param [bounds] - If not provided, creates a new Bounds2 with filled in values. Otherwise, fills in the
   *                   values of the provided bounds so that it equals this bounds.
   */
  copy(bounds) {
    if (bounds) {
      return bounds.set(this);
    } else {
      return b2(this.minX, this.minY, this.maxX, this.maxY);
    }
  }

  /**
   * Static factory method
   */
  static create(bounds) {
    return b2(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
  }

  /**
   * The smallest bounds that contains both this bounds and the input bounds, returned as a copy.
   *
   * This is the immutable form of the function includeBounds(). This will return a new bounds, and will not modify
   * this bounds.
   */
  union(bounds) {
    return b2(Math.min(this.minX, bounds.minX), Math.min(this.minY, bounds.minY), Math.max(this.maxX, bounds.maxX), Math.max(this.maxY, bounds.maxY));
  }

  /**
   * The smallest bounds that is contained by both this bounds and the input bounds, returned as a copy.
   *
   * This is the immutable form of the function constrainBounds(). This will return a new bounds, and will not modify
   * this bounds.
   */
  intersection(bounds) {
    return b2(Math.max(this.minX, bounds.minX), Math.max(this.minY, bounds.minY), Math.min(this.maxX, bounds.maxX), Math.min(this.maxY, bounds.maxY));
  }

  // TODO: difference should be well-defined, but more logic is needed to compute https://github.com/phetsims/dot/issues/96

  /**
   * The smallest bounds that contains this bounds and the point (x,y), returned as a copy.
   *
   * This is the immutable form of the function addCoordinates(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withCoordinates(x, y) {
    return b2(Math.min(this.minX, x), Math.min(this.minY, y), Math.max(this.maxX, x), Math.max(this.maxY, y));
  }

  /**
   * The smallest bounds that contains this bounds and the input point, returned as a copy.
   *
   * This is the immutable form of the function addPoint(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withPoint(point) {
    return this.withCoordinates(point.x, point.y);
  }

  /**
   * Returns the smallest bounds that contains both this bounds and the x value provided.
   *
   * This is the immutable form of the function addX(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withX(x) {
    return this.copy().addX(x);
  }

  /**
   * Returns the smallest bounds that contains both this bounds and the y value provided.
   *
   * This is the immutable form of the function addY(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withY(y) {
    return this.copy().addY(y);
  }

  /**
   * A copy of this bounds, with minX replaced with the input.
   *
   * This is the immutable form of the function setMinX(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withMinX(minX) {
    return b2(minX, this.minY, this.maxX, this.maxY);
  }

  /**
   * A copy of this bounds, with minY replaced with the input.
   *
   * This is the immutable form of the function setMinY(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withMinY(minY) {
    return b2(this.minX, minY, this.maxX, this.maxY);
  }

  /**
   * A copy of this bounds, with maxX replaced with the input.
   *
   * This is the immutable form of the function setMaxX(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withMaxX(maxX) {
    return b2(this.minX, this.minY, maxX, this.maxY);
  }

  /**
   * A copy of this bounds, with maxY replaced with the input.
   *
   * This is the immutable form of the function setMaxY(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withMaxY(maxY) {
    return b2(this.minX, this.minY, this.maxX, maxY);
  }

  /**
   * A copy of this bounds, with the minimum values rounded down to the nearest integer, and the maximum values
   * rounded up to the nearest integer. This causes the bounds to expand as necessary so that its boundaries
   * are integer-aligned.
   *
   * This is the immutable form of the function roundOut(). This will return a new bounds, and will not modify
   * this bounds.
   */
  roundedOut() {
    return b2(Math.floor(this.minX), Math.floor(this.minY), Math.ceil(this.maxX), Math.ceil(this.maxY));
  }

  /**
   * A copy of this bounds, with the minimum values rounded up to the nearest integer, and the maximum values
   * rounded down to the nearest integer. This causes the bounds to contract as necessary so that its boundaries
   * are integer-aligned.
   *
   * This is the immutable form of the function roundIn(). This will return a new bounds, and will not modify
   * this bounds.
   */
  roundedIn() {
    return b2(Math.ceil(this.minX), Math.ceil(this.minY), Math.floor(this.maxX), Math.floor(this.maxY));
  }

  /**
   * A bounding box (still axis-aligned) that contains the transformed shape of this bounds, applying the matrix as
   * an affine transformation.
   *
   * NOTE: bounds.transformed( matrix ).transformed( inverse ) may be larger than the original box, if it includes
   * a rotation that isn't a multiple of $\pi/2$. This is because the returned bounds may expand in area to cover
   * ALL of the corners of the transformed bounding box.
   *
   * This is the immutable form of the function transform(). This will return a new bounds, and will not modify
   * this bounds.
   */
  transformed(matrix) {
    return this.copy().transform(matrix);
  }

  /**
   * A bounding box that is expanded on all sides by the specified amount.)
   *
   * This is the immutable form of the function dilate(). This will return a new bounds, and will not modify
   * this bounds.
   */
  dilated(d) {
    return this.dilatedXY(d, d);
  }

  /**
   * A bounding box that is expanded horizontally (on the left and right) by the specified amount.
   *
   * This is the immutable form of the function dilateX(). This will return a new bounds, and will not modify
   * this bounds.
   */
  dilatedX(x) {
    return b2(this.minX - x, this.minY, this.maxX + x, this.maxY);
  }

  /**
   * A bounding box that is expanded vertically (on the top and bottom) by the specified amount.
   *
   * This is the immutable form of the function dilateY(). This will return a new bounds, and will not modify
   * this bounds.
   */
  dilatedY(y) {
    return b2(this.minX, this.minY - y, this.maxX, this.maxY + y);
  }

  /**
   * A bounding box that is expanded on all sides, with different amounts of expansion horizontally and vertically.
   * Will be identical to the bounds returned by calling bounds.dilatedX( x ).dilatedY( y ).
   *
   * This is the immutable form of the function dilateXY(). This will return a new bounds, and will not modify
   * this bounds.
   *
   * @param x - Amount to dilate horizontally (for each side)
   * @param y - Amount to dilate vertically (for each side)
   */
  dilatedXY(x, y) {
    return b2(this.minX - x, this.minY - y, this.maxX + x, this.maxY + y);
  }

  /**
   * A bounding box that is contracted on all sides by the specified amount.
   *
   * This is the immutable form of the function erode(). This will return a new bounds, and will not modify
   * this bounds.
   */
  eroded(amount) {
    return this.dilated(-amount);
  }

  /**
   * A bounding box that is contracted horizontally (on the left and right) by the specified amount.
   *
   * This is the immutable form of the function erodeX(). This will return a new bounds, and will not modify
   * this bounds.
   */
  erodedX(x) {
    return this.dilatedX(-x);
  }

  /**
   * A bounding box that is contracted vertically (on the top and bottom) by the specified amount.
   *
   * This is the immutable form of the function erodeY(). This will return a new bounds, and will not modify
   * this bounds.
   */
  erodedY(y) {
    return this.dilatedY(-y);
  }

  /**
   * A bounding box that is contracted on all sides, with different amounts of contraction horizontally and vertically.
   *
   * This is the immutable form of the function erodeXY(). This will return a new bounds, and will not modify
   * this bounds.
   *
   * @param x - Amount to erode horizontally (for each side)
   * @param y - Amount to erode vertically (for each side)
   */
  erodedXY(x, y) {
    return this.dilatedXY(-x, -y);
  }

  /**
   * A bounding box that is expanded by a specific amount on all sides (or if some offsets are negative, will contract
   * those sides).
   *
   * This is the immutable form of the function offset(). This will return a new bounds, and will not modify
   * this bounds.
   *
   * @param left - Amount to expand to the left (subtracts from minX)
   * @param top - Amount to expand to the top (subtracts from minY)
   * @param right - Amount to expand to the right (adds to maxX)
   * @param bottom - Amount to expand to the bottom (adds to maxY)
   */
  withOffsets(left, top, right, bottom) {
    return b2(this.minX - left, this.minY - top, this.maxX + right, this.maxY + bottom);
  }

  /**
   * Our bounds, translated horizontally by x, returned as a copy.
   *
   * This is the immutable form of the function shiftX(). This will return a new bounds, and will not modify
   * this bounds.
   */
  shiftedX(x) {
    return b2(this.minX + x, this.minY, this.maxX + x, this.maxY);
  }

  /**
   * Our bounds, translated vertically by y, returned as a copy.
   *
   * This is the immutable form of the function shiftY(). This will return a new bounds, and will not modify
   * this bounds.
   */
  shiftedY(y) {
    return b2(this.minX, this.minY + y, this.maxX, this.maxY + y);
  }

  /**
   * Our bounds, translated by (x,y), returned as a copy.
   *
   * This is the immutable form of the function shift(). This will return a new bounds, and will not modify
   * this bounds.
   */
  shiftedXY(x, y) {
    return b2(this.minX + x, this.minY + y, this.maxX + x, this.maxY + y);
  }

  /**
   * Returns our bounds, translated by a vector, returned as a copy.
   */
  shifted(v) {
    return this.shiftedXY(v.x, v.y);
  }

  /**
   * Returns an interpolated value of this bounds and the argument.
   *
   * @param bounds
   * @param ratio - 0 will result in a copy of `this`, 1 will result in bounds, and in-between controls the
   *                         amount of each.
   */
  blend(bounds, ratio) {
    const t = 1 - ratio;
    return b2(t * this.minX + ratio * bounds.minX, t * this.minY + ratio * bounds.minY, t * this.maxX + ratio * bounds.maxX, t * this.maxY + ratio * bounds.maxY);
  }

  /*---------------------------------------------------------------------------*
   * Mutable operations
   *
   * All mutable operations should call one of the following:
   *   setMinMax, setMinX, setMinY, setMaxX, setMaxY
   *---------------------------------------------------------------------------*/

  /**
   * Sets each value for this bounds, and returns itself.
   */
  setMinMax(minX, minY, maxX, maxY) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    return this;
  }

  /**
   * Sets the value of minX.
   *
   * This is the mutable form of the function withMinX(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  setMinX(minX) {
    this.minX = minX;
    return this;
  }

  /**
   * Sets the value of minY.
   *
   * This is the mutable form of the function withMinY(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  setMinY(minY) {
    this.minY = minY;
    return this;
  }

  /**
   * Sets the value of maxX.
   *
   * This is the mutable form of the function withMaxX(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  setMaxX(maxX) {
    this.maxX = maxX;
    return this;
  }

  /**
   * Sets the value of maxY.
   *
   * This is the mutable form of the function withMaxY(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  setMaxY(maxY) {
    this.maxY = maxY;
    return this;
  }

  /**
   * Sets the values of this bounds to be equal to the input bounds.
   *
   * This is the mutable form of the function copy(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  set(bounds) {
    return this.setMinMax(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
  }

  /**
   * Modifies this bounds so that it contains both its original bounds and the input bounds.
   *
   * This is the mutable form of the function union(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  includeBounds(bounds) {
    return this.setMinMax(Math.min(this.minX, bounds.minX), Math.min(this.minY, bounds.minY), Math.max(this.maxX, bounds.maxX), Math.max(this.maxY, bounds.maxY));
  }

  /**
   * Modifies this bounds so that it is the largest bounds contained both in its original bounds and in the input bounds.
   *
   * This is the mutable form of the function intersection(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  constrainBounds(bounds) {
    return this.setMinMax(Math.max(this.minX, bounds.minX), Math.max(this.minY, bounds.minY), Math.min(this.maxX, bounds.maxX), Math.min(this.maxY, bounds.maxY));
  }

  /**
   * Modifies this bounds so that it contains both its original bounds and the input point (x,y).
   *
   * This is the mutable form of the function withCoordinates(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  addCoordinates(x, y) {
    return this.setMinMax(Math.min(this.minX, x), Math.min(this.minY, y), Math.max(this.maxX, x), Math.max(this.maxY, y));
  }

  /**
   * Modifies this bounds so that it contains both its original bounds and the input point.
   *
   * This is the mutable form of the function withPoint(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  addPoint(point) {
    return this.addCoordinates(point.x, point.y);
  }

  /**
   * Modifies this bounds so that it is guaranteed to include the given x value (if it didn't already). If the x value
   * was already contained, nothing will be done.
   *
   * This is the mutable form of the function withX(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  addX(x) {
    this.minX = Math.min(x, this.minX);
    this.maxX = Math.max(x, this.maxX);
    return this;
  }

  /**
   * Modifies this bounds so that it is guaranteed to include the given y value (if it didn't already). If the y value
   * was already contained, nothing will be done.
   *
   * This is the mutable form of the function withY(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  addY(y) {
    this.minY = Math.min(y, this.minY);
    this.maxY = Math.max(y, this.maxY);
    return this;
  }

  /**
   * Modifies this bounds so that its boundaries are integer-aligned, rounding the minimum boundaries down and the
   * maximum boundaries up (expanding as necessary).
   *
   * This is the mutable form of the function roundedOut(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  roundOut() {
    return this.setMinMax(Math.floor(this.minX), Math.floor(this.minY), Math.ceil(this.maxX), Math.ceil(this.maxY));
  }

  /**
   * Modifies this bounds so that its boundaries are integer-aligned, rounding the minimum boundaries up and the
   * maximum boundaries down (contracting as necessary).
   *
   * This is the mutable form of the function roundedIn(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  roundIn() {
    return this.setMinMax(Math.ceil(this.minX), Math.ceil(this.minY), Math.floor(this.maxX), Math.floor(this.maxY));
  }

  /**
   * Modifies this bounds so that it would fully contain a transformed version if its previous value, applying the
   * matrix as an affine transformation.
   *
   * NOTE: bounds.transform( matrix ).transform( inverse ) may be larger than the original box, if it includes
   * a rotation that isn't a multiple of $\pi/2$. This is because the bounds may expand in area to cover
   * ALL of the corners of the transformed bounding box.
   *
   * This is the mutable form of the function transformed(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  transform(matrix) {
    // if we contain no area, no change is needed
    if (this.isEmpty()) {
      return this;
    }

    // optimization to bail for identity matrices
    if (matrix.isIdentity()) {
      return this;
    }
    const minX = this.minX;
    const minY = this.minY;
    const maxX = this.maxX;
    const maxY = this.maxY;
    this.set(Bounds2.NOTHING);

    // using mutable vector so we don't create excessive instances of Vector2 during this
    // make sure all 4 corners are inside this transformed bounding box

    this.addPoint(matrix.multiplyVector2(scratchVector2.setXY(minX, minY)));
    this.addPoint(matrix.multiplyVector2(scratchVector2.setXY(minX, maxY)));
    this.addPoint(matrix.multiplyVector2(scratchVector2.setXY(maxX, minY)));
    this.addPoint(matrix.multiplyVector2(scratchVector2.setXY(maxX, maxY)));
    return this;
  }

  /**
   * Expands this bounds on all sides by the specified amount.
   *
   * This is the mutable form of the function dilated(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  dilate(d) {
    return this.dilateXY(d, d);
  }

  /**
   * Expands this bounds horizontally (left and right) by the specified amount.
   *
   * This is the mutable form of the function dilatedX(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  dilateX(x) {
    return this.setMinMax(this.minX - x, this.minY, this.maxX + x, this.maxY);
  }

  /**
   * Expands this bounds vertically (top and bottom) by the specified amount.
   *
   * This is the mutable form of the function dilatedY(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  dilateY(y) {
    return this.setMinMax(this.minX, this.minY - y, this.maxX, this.maxY + y);
  }

  /**
   * Expands this bounds independently in the horizontal and vertical directions. Will be equal to calling
   * bounds.dilateX( x ).dilateY( y ).
   *
   * This is the mutable form of the function dilatedXY(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  dilateXY(x, y) {
    return this.setMinMax(this.minX - x, this.minY - y, this.maxX + x, this.maxY + y);
  }

  /**
   * Contracts this bounds on all sides by the specified amount.
   *
   * This is the mutable form of the function eroded(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  erode(d) {
    return this.dilate(-d);
  }

  /**
   * Contracts this bounds horizontally (left and right) by the specified amount.
   *
   * This is the mutable form of the function erodedX(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  erodeX(x) {
    return this.dilateX(-x);
  }

  /**
   * Contracts this bounds vertically (top and bottom) by the specified amount.
   *
   * This is the mutable form of the function erodedY(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  erodeY(y) {
    return this.dilateY(-y);
  }

  /**
   * Contracts this bounds independently in the horizontal and vertical directions. Will be equal to calling
   * bounds.erodeX( x ).erodeY( y ).
   *
   * This is the mutable form of the function erodedXY(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  erodeXY(x, y) {
    return this.dilateXY(-x, -y);
  }

  /**
   * Expands this bounds independently for each side (or if some offsets are negative, will contract those sides).
   *
   * This is the mutable form of the function withOffsets(). This will mutate (change) this bounds, in addition to
   * returning this bounds itself.
   *
   * @param left - Amount to expand to the left (subtracts from minX)
   * @param top - Amount to expand to the top (subtracts from minY)
   * @param right - Amount to expand to the right (adds to maxX)
   * @param bottom - Amount to expand to the bottom (adds to maxY)
   */
  offset(left, top, right, bottom) {
    return b2(this.minX - left, this.minY - top, this.maxX + right, this.maxY + bottom);
  }

  /**
   * Translates our bounds horizontally by x.
   *
   * This is the mutable form of the function shiftedX(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  shiftX(x) {
    return this.setMinMax(this.minX + x, this.minY, this.maxX + x, this.maxY);
  }

  /**
   * Translates our bounds vertically by y.
   *
   * This is the mutable form of the function shiftedY(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  shiftY(y) {
    return this.setMinMax(this.minX, this.minY + y, this.maxX, this.maxY + y);
  }

  /**
   * Translates our bounds by (x,y).
   *
   * This is the mutable form of the function shifted(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  shiftXY(x, y) {
    return this.setMinMax(this.minX + x, this.minY + y, this.maxX + x, this.maxY + y);
  }

  /**
   * Translates our bounds by the given vector.
   */
  shift(v) {
    return this.shiftXY(v.x, v.y);
  }

  /**
   * Returns the range of the x-values of this bounds.
   */
  getXRange() {
    return new Range(this.minX, this.maxX);
  }

  /**
   * Sets the x-range of this bounds.
   */
  setXRange(range) {
    return this.setMinMax(range.min, this.minY, range.max, this.maxY);
  }
  get xRange() {
    return this.getXRange();
  }
  set xRange(range) {
    this.setXRange(range);
  }

  /**
   * Returns the range of the y-values of this bounds.
   */
  getYRange() {
    return new Range(this.minY, this.maxY);
  }

  /**
   * Sets the y-range of this bounds.
   */
  setYRange(range) {
    return this.setMinMax(this.minX, range.min, this.maxX, range.max);
  }
  get yRange() {
    return this.getYRange();
  }
  set yRange(range) {
    this.setYRange(range);
  }

  /**
   * Find a point in the bounds closest to the specified point.
   *
   * @param x - X coordinate of the point to test.
   * @param y - Y coordinate of the point to test.
   * @param [result] - Vector2 that can store the return value to avoid allocations.
   */
  getClosestPoint(x, y, result) {
    if (result) {
      result.setXY(x, y);
    } else {
      result = new Vector2(x, y);
    }
    if (result.x < this.minX) {
      result.x = this.minX;
    }
    if (result.x > this.maxX) {
      result.x = this.maxX;
    }
    if (result.y < this.minY) {
      result.y = this.minY;
    }
    if (result.y > this.maxY) {
      result.y = this.maxY;
    }
    return result;
  }
  freeToPool() {
    Bounds2.pool.freeToPool(this);
  }
  static pool = new Pool(Bounds2, {
    maxSize: 1000,
    initialize: Bounds2.prototype.setMinMax,
    defaultArguments: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]
  });

  /**
   * Returns a new Bounds2 object, with the familiar rectangle construction with x, y, width, and height.
   *
   * @param x - The minimum value of X for the bounds.
   * @param y - The minimum value of Y for the bounds.
   * @param width - The width (maxX - minX) of the bounds.
   * @param height - The height (maxY - minY) of the bounds.
   */
  static rect(x, y, width, height) {
    return b2(x, y, x + width, y + height);
  }

  /**
   * Returns a new Bounds2 object with a given orientation (min/max specified for both the given (primary) orientation,
   * and also the secondary orientation).
   */
  static oriented(orientation, minPrimary, minSecondary, maxPrimary, maxSecondary) {
    return orientation === Orientation.HORIZONTAL ? new Bounds2(minPrimary, minSecondary, maxPrimary, maxSecondary) : new Bounds2(minSecondary, minPrimary, maxSecondary, maxPrimary);
  }

  /**
   * Returns a new Bounds2 object that only contains the specified point (x,y). Useful for being dilated to form a
   * bounding box around a point. Note that the bounds will not be "empty" as it contains (x,y), but it will have
   * zero area. The x and y coordinates can be specified by numbers or with at Vector2
   *
   * @param x
   * @param y
   */

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static point(x, y) {
    // eslint-disable-line @typescript-eslint/explicit-member-accessibility
    if (x instanceof Vector2) {
      const p = x;
      return b2(p.x, p.y, p.x, p.y);
    } else {
      return b2(x, y, x, y);
    }
  }

  // Helps to identify the dimension of the bounds

  /**
   * A constant Bounds2 with minimums = $\infty$, maximums = $-\infty$, so that it represents "no bounds whatsoever".
   *
   * This allows us to take the union (union/includeBounds) of this and any other Bounds2 to get the other bounds back,
   * e.g. Bounds2.NOTHING.union( bounds ).equals( bounds ). This object naturally serves as the base case as a union of
   * zero bounds objects.
   *
   * Additionally, intersections with NOTHING will always return a Bounds2 equivalent to NOTHING.
   */
  static NOTHING = new Bounds2(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

  /**
   * A constant Bounds2 with minimums = $-\infty$, maximums = $\infty$, so that it represents "all bounds".
   *
   * This allows us to take the intersection (intersection/constrainBounds) of this and any other Bounds2 to get the
   * other bounds back, e.g. Bounds2.EVERYTHING.intersection( bounds ).equals( bounds ). This object naturally serves as
   * the base case as an intersection of zero bounds objects.
   *
   * Additionally, unions with EVERYTHING will always return a Bounds2 equivalent to EVERYTHING.
   */
  static EVERYTHING = new Bounds2(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  static Bounds2IO = new IOType('Bounds2IO', {
    valueType: Bounds2,
    documentation: 'a 2-dimensional bounds rectangle',
    toStateObject: bounds2 => ({
      minX: bounds2.minX,
      minY: bounds2.minY,
      maxX: bounds2.maxX,
      maxY: bounds2.maxY
    }),
    fromStateObject: stateObject => {
      return new Bounds2(InfiniteNumberIO.fromStateObject(stateObject.minX), InfiniteNumberIO.fromStateObject(stateObject.minY), InfiniteNumberIO.fromStateObject(stateObject.maxX), InfiniteNumberIO.fromStateObject(stateObject.maxY));
    },
    stateSchema: {
      minX: InfiniteNumberIO,
      maxX: InfiniteNumberIO,
      minY: InfiniteNumberIO,
      maxY: InfiniteNumberIO
    }
  });
}
dot.register('Bounds2', Bounds2);
const b2 = Bounds2.pool.create.bind(Bounds2.pool);
dot.register('b2', b2);
Bounds2.prototype.isBounds = true;
Bounds2.prototype.dimension = 2;
function catchImmutableSetterLowHangingFruit(bounds) {
  bounds.setMinMax = () => {
    throw new Error('Attempt to set "setMinMax" of an immutable Bounds2 object');
  };
  bounds.set = () => {
    throw new Error('Attempt to set "set" of an immutable Bounds2 object');
  };
  bounds.includeBounds = () => {
    throw new Error('Attempt to set "includeBounds" of an immutable Bounds2 object');
  };
  bounds.constrainBounds = () => {
    throw new Error('Attempt to set "constrainBounds" of an immutable Bounds2 object');
  };
  bounds.addCoordinates = () => {
    throw new Error('Attempt to set "addCoordinates" of an immutable Bounds2 object');
  };
  bounds.transform = () => {
    throw new Error('Attempt to set "transform" of an immutable Bounds2 object');
  };
}
if (assert) {
  catchImmutableSetterLowHangingFruit(Bounds2.EVERYTHING);
  catchImmutableSetterLowHangingFruit(Bounds2.NOTHING);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJJT1R5cGUiLCJJbmZpbml0ZU51bWJlcklPIiwiVmVjdG9yMiIsImRvdCIsIlJhbmdlIiwiUG9vbCIsIk9yaWVudGF0aW9uIiwic2NyYXRjaFZlY3RvcjIiLCJCb3VuZHMyIiwiY29uc3RydWN0b3IiLCJtaW5YIiwibWluWSIsIm1heFgiLCJtYXhZIiwiYXNzZXJ0IiwidW5kZWZpbmVkIiwiZ2V0V2lkdGgiLCJ3aWR0aCIsImdldEhlaWdodCIsImhlaWdodCIsImdldFgiLCJ4IiwiZ2V0WSIsInkiLCJnZXRNaW5YIiwiZ2V0TWluWSIsImdldE1heFgiLCJnZXRNYXhZIiwiZ2V0TGVmdCIsImxlZnQiLCJnZXRUb3AiLCJ0b3AiLCJnZXRSaWdodCIsInJpZ2h0IiwiZ2V0Qm90dG9tIiwiYm90dG9tIiwiZ2V0Q2VudGVyWCIsImNlbnRlclgiLCJnZXRDZW50ZXJZIiwiY2VudGVyWSIsImdldExlZnRUb3AiLCJsZWZ0VG9wIiwiZ2V0Q2VudGVyVG9wIiwiY2VudGVyVG9wIiwiZ2V0UmlnaHRUb3AiLCJyaWdodFRvcCIsImdldExlZnRDZW50ZXIiLCJsZWZ0Q2VudGVyIiwiZ2V0Q2VudGVyIiwiY2VudGVyIiwiZ2V0UmlnaHRDZW50ZXIiLCJyaWdodENlbnRlciIsImdldExlZnRCb3R0b20iLCJsZWZ0Qm90dG9tIiwiZ2V0Q2VudGVyQm90dG9tIiwiY2VudGVyQm90dG9tIiwiZ2V0UmlnaHRCb3R0b20iLCJyaWdodEJvdHRvbSIsImlzRW1wdHkiLCJpc0Zpbml0ZSIsImhhc05vbnplcm9BcmVhIiwiaXNWYWxpZCIsImNsb3Nlc3RQb2ludFRvIiwicG9pbnQiLCJjb250YWluc0Nvb3JkaW5hdGVzIiwiZ2V0Q29uc3RyYWluZWRQb2ludCIsImNsb3Nlc3RCb3VuZGFyeVBvaW50VG8iLCJjbG9zZXN0WEVkZ2UiLCJjbG9zZXN0WUVkZ2UiLCJNYXRoIiwiYWJzIiwieENvbnN0cmFpbmVkIiwibWF4IiwibWluIiwieUNvbnN0cmFpbmVkIiwiY29udGFpbnNQb2ludCIsImNvbnRhaW5zQm91bmRzIiwiYm91bmRzIiwiaW50ZXJzZWN0c0JvdW5kcyIsIm1pbmltdW1EaXN0YW5jZVRvUG9pbnRTcXVhcmVkIiwiY2xvc2VYIiwiY2xvc2VZIiwiZCIsImR4IiwiZHkiLCJtYXhpbXVtRGlzdGFuY2VUb1BvaW50U3F1YXJlZCIsInRvU3RyaW5nIiwiZXF1YWxzIiwib3RoZXIiLCJlcXVhbHNFcHNpbG9uIiwiZXBzaWxvbiIsInRoaXNGaW5pdGUiLCJvdGhlckZpbml0ZSIsImNvcHkiLCJzZXQiLCJiMiIsImNyZWF0ZSIsInVuaW9uIiwiaW50ZXJzZWN0aW9uIiwid2l0aENvb3JkaW5hdGVzIiwid2l0aFBvaW50Iiwid2l0aFgiLCJhZGRYIiwid2l0aFkiLCJhZGRZIiwid2l0aE1pblgiLCJ3aXRoTWluWSIsIndpdGhNYXhYIiwid2l0aE1heFkiLCJyb3VuZGVkT3V0IiwiZmxvb3IiLCJjZWlsIiwicm91bmRlZEluIiwidHJhbnNmb3JtZWQiLCJtYXRyaXgiLCJ0cmFuc2Zvcm0iLCJkaWxhdGVkIiwiZGlsYXRlZFhZIiwiZGlsYXRlZFgiLCJkaWxhdGVkWSIsImVyb2RlZCIsImFtb3VudCIsImVyb2RlZFgiLCJlcm9kZWRZIiwiZXJvZGVkWFkiLCJ3aXRoT2Zmc2V0cyIsInNoaWZ0ZWRYIiwic2hpZnRlZFkiLCJzaGlmdGVkWFkiLCJzaGlmdGVkIiwidiIsImJsZW5kIiwicmF0aW8iLCJ0Iiwic2V0TWluTWF4Iiwic2V0TWluWCIsInNldE1pblkiLCJzZXRNYXhYIiwic2V0TWF4WSIsImluY2x1ZGVCb3VuZHMiLCJjb25zdHJhaW5Cb3VuZHMiLCJhZGRDb29yZGluYXRlcyIsImFkZFBvaW50Iiwicm91bmRPdXQiLCJyb3VuZEluIiwiaXNJZGVudGl0eSIsIk5PVEhJTkciLCJtdWx0aXBseVZlY3RvcjIiLCJzZXRYWSIsImRpbGF0ZSIsImRpbGF0ZVhZIiwiZGlsYXRlWCIsImRpbGF0ZVkiLCJlcm9kZSIsImVyb2RlWCIsImVyb2RlWSIsImVyb2RlWFkiLCJvZmZzZXQiLCJzaGlmdFgiLCJzaGlmdFkiLCJzaGlmdFhZIiwic2hpZnQiLCJnZXRYUmFuZ2UiLCJzZXRYUmFuZ2UiLCJyYW5nZSIsInhSYW5nZSIsImdldFlSYW5nZSIsInNldFlSYW5nZSIsInlSYW5nZSIsImdldENsb3Nlc3RQb2ludCIsInJlc3VsdCIsImZyZWVUb1Bvb2wiLCJwb29sIiwibWF4U2l6ZSIsImluaXRpYWxpemUiLCJwcm90b3R5cGUiLCJkZWZhdWx0QXJndW1lbnRzIiwiTnVtYmVyIiwiUE9TSVRJVkVfSU5GSU5JVFkiLCJORUdBVElWRV9JTkZJTklUWSIsInJlY3QiLCJvcmllbnRlZCIsIm9yaWVudGF0aW9uIiwibWluUHJpbWFyeSIsIm1pblNlY29uZGFyeSIsIm1heFByaW1hcnkiLCJtYXhTZWNvbmRhcnkiLCJIT1JJWk9OVEFMIiwicCIsIkVWRVJZVEhJTkciLCJCb3VuZHMySU8iLCJ2YWx1ZVR5cGUiLCJkb2N1bWVudGF0aW9uIiwidG9TdGF0ZU9iamVjdCIsImJvdW5kczIiLCJmcm9tU3RhdGVPYmplY3QiLCJzdGF0ZU9iamVjdCIsInN0YXRlU2NoZW1hIiwicmVnaXN0ZXIiLCJiaW5kIiwiaXNCb3VuZHMiLCJkaW1lbnNpb24iLCJjYXRjaEltbXV0YWJsZVNldHRlckxvd0hhbmdpbmdGcnVpdCIsIkVycm9yIl0sInNvdXJjZXMiOlsiQm91bmRzMi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIDJEIHJlY3RhbmdsZS1zaGFwZWQgYm91bmRlZCBhcmVhIChib3VuZGluZyBib3gpLlxyXG4gKlxyXG4gKiBUaGVyZSBhcmUgYSBudW1iZXIgb2YgY29udmVuaWVuY2UgZnVuY3Rpb25zIHRvIGdldCBwb3NpdGlvbnMgYW5kIHBvaW50cyBvbiB0aGUgQm91bmRzLiBDdXJyZW50bHkgd2UgZG8gbm90XHJcbiAqIHN0b3JlIHRoZXNlIHdpdGggdGhlIEJvdW5kczIgaW5zdGFuY2UsIHNpbmNlIHdlIHdhbnQgdG8gbG93ZXIgdGhlIG1lbW9yeSBmb290cHJpbnQuXHJcbiAqXHJcbiAqIG1pblgsIG1pblksIG1heFgsIGFuZCBtYXhZIGFyZSBhY3R1YWxseSBzdG9yZWQuIFdlIGRvbid0IGRvIHgseSx3aWR0aCxoZWlnaHQgYmVjYXVzZSB0aGlzIGNhbid0IHByb3Blcmx5IGV4cHJlc3NcclxuICogc2VtaS1pbmZpbml0ZSBib3VuZHMgKGxpa2UgYSBoYWxmLXBsYW5lKSwgb3IgZWFzaWx5IGhhbmRsZSB3aGF0IEJvdW5kczIuTk9USElORyBhbmQgQm91bmRzMi5FVkVSWVRISU5HIGRvIHdpdGhcclxuICogdGhlIGNvbnN0cnVjdGl2ZSBzb2xpZCBhcmVhcy5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBJT1R5cGUgZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0lPVHlwZS5qcyc7XHJcbmltcG9ydCBJbmZpbml0ZU51bWJlcklPLCB7IEluZmluaXRlTnVtYmVyU3RhdGVPYmplY3QgfSBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvSW5maW5pdGVOdW1iZXJJTy5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4vVmVjdG9yMi5qcyc7XHJcbmltcG9ydCBkb3QgZnJvbSAnLi9kb3QuanMnO1xyXG5pbXBvcnQgTWF0cml4MyBmcm9tICcuL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgUmFuZ2UgZnJvbSAnLi9SYW5nZS5qcyc7XHJcbmltcG9ydCBQb29sLCB7IFRQb29sYWJsZSB9IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9Qb29sLmpzJztcclxuaW1wb3J0IE9yaWVudGF0aW9uIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9PcmllbnRhdGlvbi5qcyc7XHJcblxyXG4vLyBUZW1wb3JhcnkgaW5zdGFuY2VzIHRvIGJlIHVzZWQgaW4gdGhlIHRyYW5zZm9ybSBtZXRob2QuXHJcbmNvbnN0IHNjcmF0Y2hWZWN0b3IyID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuXHJcbi8vIEZvciBQaEVULWlPIHNlcmlhbGl6YXRpb25cclxuZXhwb3J0IHR5cGUgQm91bmRzMlN0YXRlT2JqZWN0ID0ge1xyXG4gIG1pblg6IEluZmluaXRlTnVtYmVyU3RhdGVPYmplY3Q7XHJcbiAgbWluWTogSW5maW5pdGVOdW1iZXJTdGF0ZU9iamVjdDtcclxuICBtYXhYOiBJbmZpbml0ZU51bWJlclN0YXRlT2JqZWN0O1xyXG4gIG1heFk6IEluZmluaXRlTnVtYmVyU3RhdGVPYmplY3Q7XHJcbn07XHJcblxyXG4vLyBEdWNrIHR5cGVkIGZvciB3aGVuIGNyZWF0aW5nIGEgQm91bmRzMiB3aXRoIHN1cHBvcnQgZm9yIEJvdW5kczMgb3Igb3RoZXIgc3RydWN0dXJhbGx5IHNpbWlsYXIgb2JqZWN0LlxyXG50eXBlIEJvdW5kczJMaWtlID0ge1xyXG4gIG1pblg6IG51bWJlcjtcclxuICBtaW5ZOiBudW1iZXI7XHJcbiAgbWF4WDogbnVtYmVyO1xyXG4gIG1heFk6IG51bWJlcjtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJvdW5kczIgaW1wbGVtZW50cyBUUG9vbGFibGUge1xyXG5cclxuICAvLyBUaGUgbWluaW11bSBYIGNvb3JkaW5hdGUgb2YgdGhlIGJvdW5kcy5cclxuICBwdWJsaWMgbWluWDogbnVtYmVyO1xyXG5cclxuICAvLyBUaGUgbWluaW11bSBZIGNvb3JkaW5hdGUgb2YgdGhlIGJvdW5kcy5cclxuICBwdWJsaWMgbWluWTogbnVtYmVyO1xyXG5cclxuICAvLyBUaGUgbWF4aW11bSBYIGNvb3JkaW5hdGUgb2YgdGhlIGJvdW5kcy5cclxuICBwdWJsaWMgbWF4WDogbnVtYmVyO1xyXG5cclxuICAvLyBUaGUgbWF4aW11bSBZIGNvb3JkaW5hdGUgb2YgdGhlIGJvdW5kcy5cclxuICBwdWJsaWMgbWF4WTogbnVtYmVyO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgMi1kaW1lbnNpb25hbCBib3VuZHMgKGJvdW5kaW5nIGJveCkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbWluWCAtIFRoZSBpbml0aWFsIG1pbmltdW0gWCBjb29yZGluYXRlIG9mIHRoZSBib3VuZHMuXHJcbiAgICogQHBhcmFtIG1pblkgLSBUaGUgaW5pdGlhbCBtaW5pbXVtIFkgY29vcmRpbmF0ZSBvZiB0aGUgYm91bmRzLlxyXG4gICAqIEBwYXJhbSBtYXhYIC0gVGhlIGluaXRpYWwgbWF4aW11bSBYIGNvb3JkaW5hdGUgb2YgdGhlIGJvdW5kcy5cclxuICAgKiBAcGFyYW0gbWF4WSAtIFRoZSBpbml0aWFsIG1heGltdW0gWSBjb29yZGluYXRlIG9mIHRoZSBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBtaW5YOiBudW1iZXIsIG1pblk6IG51bWJlciwgbWF4WDogbnVtYmVyLCBtYXhZOiBudW1iZXIgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBtYXhZICE9PSB1bmRlZmluZWQsICdCb3VuZHMyIHJlcXVpcmVzIDQgcGFyYW1ldGVycycgKTtcclxuXHJcbiAgICB0aGlzLm1pblggPSBtaW5YO1xyXG4gICAgdGhpcy5taW5ZID0gbWluWTtcclxuICAgIHRoaXMubWF4WCA9IG1heFg7XHJcbiAgICB0aGlzLm1heFkgPSBtYXhZO1xyXG4gIH1cclxuXHJcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXHJcbiAgICogUHJvcGVydGllc1xyXG4gICAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHdpZHRoIG9mIHRoZSBib3VuZHMsIGRlZmluZWQgYXMgbWF4WCAtIG1pblguXHJcbiAgICovXHJcbiAgcHVibGljIGdldFdpZHRoKCk6IG51bWJlciB7IHJldHVybiB0aGlzLm1heFggLSB0aGlzLm1pblg7IH1cclxuXHJcbiAgcHVibGljIGdldCB3aWR0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRXaWR0aCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBoZWlnaHQgb2YgdGhlIGJvdW5kcywgZGVmaW5lZCBhcyBtYXhZIC0gbWluWS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0SGVpZ2h0KCk6IG51bWJlciB7IHJldHVybiB0aGlzLm1heFkgLSB0aGlzLm1pblk7IH1cclxuXHJcbiAgcHVibGljIGdldCBoZWlnaHQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0SGVpZ2h0KCk7IH1cclxuXHJcbiAgLypcclxuICAgKiBDb252ZW5pZW5jZSBwb3NpdGlvbnNcclxuICAgKiB1cHBlciBpcyBpbiB0ZXJtcyBvZiB0aGUgdmlzdWFsIGxheW91dCBpbiBTY2VuZXJ5IGFuZCBvdGhlciBwcm9ncmFtcywgc28gdGhlIG1pblkgaXMgdGhlIFwidXBwZXJcIiwgYW5kIG1pblkgaXMgdGhlIFwibG93ZXJcIlxyXG4gICAqXHJcbiAgICogICAgICAgICAgICAgbWluWCAoeCkgICAgIGNlbnRlclggICAgICAgIG1heFhcclxuICAgKiAgICAgICAgICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgKiBtaW5ZICh5KSB8IGxlZnRUb3AgICAgIGNlbnRlclRvcCAgICAgcmlnaHRUb3BcclxuICAgKiBjZW50ZXJZICB8IGxlZnRDZW50ZXIgIGNlbnRlciAgICAgICAgcmlnaHRDZW50ZXJcclxuICAgKiBtYXhZICAgICB8IGxlZnRCb3R0b20gIGNlbnRlckJvdHRvbSAgcmlnaHRCb3R0b21cclxuICAgKi9cclxuXHJcbiAgLyoqXHJcbiAgICogQWxpYXMgZm9yIG1pblgsIHdoZW4gdGhpbmtpbmcgb2YgdGhlIGJvdW5kcyBhcyBhbiAoeCx5LHdpZHRoLGhlaWdodCkgcmVjdGFuZ2xlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRYKCk6IG51bWJlciB7IHJldHVybiB0aGlzLm1pblg7IH1cclxuXHJcbiAgcHVibGljIGdldCB4KCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFgoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGlhcyBmb3IgbWluWSwgd2hlbiB0aGlua2luZyBvZiB0aGUgYm91bmRzIGFzIGFuICh4LHksd2lkdGgsaGVpZ2h0KSByZWN0YW5nbGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFkoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWluWTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHkoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0WSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsaWFzIGZvciBtaW5YLCBzdXBwb3J0aW5nIHRoZSBleHBsaWNpdCBnZXR0ZXIgZnVuY3Rpb24gc3R5bGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldE1pblgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWluWDsgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGlhcyBmb3IgbWluWSwgc3VwcG9ydGluZyB0aGUgZXhwbGljaXQgZ2V0dGVyIGZ1bmN0aW9uIHN0eWxlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNaW5ZKCk6IG51bWJlciB7IHJldHVybiB0aGlzLm1pblk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWxpYXMgZm9yIG1heFgsIHN1cHBvcnRpbmcgdGhlIGV4cGxpY2l0IGdldHRlciBmdW5jdGlvbiBzdHlsZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TWF4WCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5tYXhYOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsaWFzIGZvciBtYXhZLCBzdXBwb3J0aW5nIHRoZSBleHBsaWNpdCBnZXR0ZXIgZnVuY3Rpb24gc3R5bGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldE1heFkoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWF4WTsgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGlhcyBmb3IgbWluWCwgd2hlbiB0aGlua2luZyBpbiB0aGUgVUktbGF5b3V0IG1hbm5lci5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGVmdCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5taW5YOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgbGVmdCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5taW5YOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsaWFzIGZvciBtaW5ZLCB3aGVuIHRoaW5raW5nIGluIHRoZSBVSS1sYXlvdXQgbWFubmVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRUb3AoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWluWTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHRvcCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5taW5ZOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsaWFzIGZvciBtYXhYLCB3aGVuIHRoaW5raW5nIGluIHRoZSBVSS1sYXlvdXQgbWFubmVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRSaWdodCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5tYXhYOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmlnaHQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWF4WDsgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGlhcyBmb3IgbWF4WSwgd2hlbiB0aGlua2luZyBpbiB0aGUgVUktbGF5b3V0IG1hbm5lci5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Qm90dG9tKCk6IG51bWJlciB7IHJldHVybiB0aGlzLm1heFk7IH1cclxuXHJcbiAgcHVibGljIGdldCBib3R0b20oKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWF4WTsgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgaG9yaXpvbnRhbCAoWC1jb29yZGluYXRlKSBjZW50ZXIgb2YgdGhlIGJvdW5kcywgYXZlcmFnaW5nIHRoZSBtaW5YIGFuZCBtYXhYLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDZW50ZXJYKCk6IG51bWJlciB7IHJldHVybiAoIHRoaXMubWF4WCArIHRoaXMubWluWCApIC8gMjsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGNlbnRlclgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0Q2VudGVyWCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSB2ZXJ0aWNhbCAoWS1jb29yZGluYXRlKSBjZW50ZXIgb2YgdGhlIGJvdW5kcywgYXZlcmFnaW5nIHRoZSBtaW5ZIGFuZCBtYXhZLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDZW50ZXJZKCk6IG51bWJlciB7IHJldHVybiAoIHRoaXMubWF4WSArIHRoaXMubWluWSApIC8gMjsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGNlbnRlclkoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0Q2VudGVyWSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBwb2ludCAobWluWCwgbWluWSksIGluIHRoZSBVSS1jb29yZGluYXRlIHVwcGVyLWxlZnQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExlZnRUb3AoKTogVmVjdG9yMiB7IHJldHVybiBuZXcgVmVjdG9yMiggdGhpcy5taW5YLCB0aGlzLm1pblkgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGxlZnRUb3AoKTogVmVjdG9yMiB7IHJldHVybiB0aGlzLmdldExlZnRUb3AoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgcG9pbnQgKGNlbnRlclgsIG1pblkpLCBpbiB0aGUgVUktY29vcmRpbmF0ZSB1cHBlci1jZW50ZXIuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENlbnRlclRvcCgpOiBWZWN0b3IyIHsgcmV0dXJuIG5ldyBWZWN0b3IyKCB0aGlzLmdldENlbnRlclgoKSwgdGhpcy5taW5ZICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBjZW50ZXJUb3AoKTogVmVjdG9yMiB7IHJldHVybiB0aGlzLmdldENlbnRlclRvcCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBwb2ludCAocmlnaHQsIG1pblkpLCBpbiB0aGUgVUktY29vcmRpbmF0ZSB1cHBlci1yaWdodC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UmlnaHRUb3AoKTogVmVjdG9yMiB7IHJldHVybiBuZXcgVmVjdG9yMiggdGhpcy5tYXhYLCB0aGlzLm1pblkgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHJpZ2h0VG9wKCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRSaWdodFRvcCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBwb2ludCAobGVmdCwgY2VudGVyWSksIGluIHRoZSBVSS1jb29yZGluYXRlIGNlbnRlci1sZWZ0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMZWZ0Q2VudGVyKCk6IFZlY3RvcjIgeyByZXR1cm4gbmV3IFZlY3RvcjIoIHRoaXMubWluWCwgdGhpcy5nZXRDZW50ZXJZKCkgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGxlZnRDZW50ZXIoKTogVmVjdG9yMiB7IHJldHVybiB0aGlzLmdldExlZnRDZW50ZXIoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgcG9pbnQgKGNlbnRlclgsIGNlbnRlclkpLCBpbiB0aGUgY2VudGVyIG9mIHRoZSBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENlbnRlcigpOiBWZWN0b3IyIHsgcmV0dXJuIG5ldyBWZWN0b3IyKCB0aGlzLmdldENlbnRlclgoKSwgdGhpcy5nZXRDZW50ZXJZKCkgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGNlbnRlcigpOiBWZWN0b3IyIHsgcmV0dXJuIHRoaXMuZ2V0Q2VudGVyKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHBvaW50IChtYXhYLCBjZW50ZXJZKSwgaW4gdGhlIFVJLWNvb3JkaW5hdGUgY2VudGVyLXJpZ2h0XHJcbiAgICovXHJcbiAgcHVibGljIGdldFJpZ2h0Q2VudGVyKCk6IFZlY3RvcjIgeyByZXR1cm4gbmV3IFZlY3RvcjIoIHRoaXMubWF4WCwgdGhpcy5nZXRDZW50ZXJZKCkgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHJpZ2h0Q2VudGVyKCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRSaWdodENlbnRlcigpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBwb2ludCAobWluWCwgbWF4WSksIGluIHRoZSBVSS1jb29yZGluYXRlIGxvd2VyLWxlZnRcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGVmdEJvdHRvbSgpOiBWZWN0b3IyIHsgcmV0dXJuIG5ldyBWZWN0b3IyKCB0aGlzLm1pblgsIHRoaXMubWF4WSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgbGVmdEJvdHRvbSgpOiBWZWN0b3IyIHsgcmV0dXJuIHRoaXMuZ2V0TGVmdEJvdHRvbSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBwb2ludCAoY2VudGVyWCwgbWF4WSksIGluIHRoZSBVSS1jb29yZGluYXRlIGxvd2VyLWNlbnRlclxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDZW50ZXJCb3R0b20oKTogVmVjdG9yMiB7IHJldHVybiBuZXcgVmVjdG9yMiggdGhpcy5nZXRDZW50ZXJYKCksIHRoaXMubWF4WSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgY2VudGVyQm90dG9tKCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRDZW50ZXJCb3R0b20oKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgcG9pbnQgKG1heFgsIG1heFkpLCBpbiB0aGUgVUktY29vcmRpbmF0ZSBsb3dlci1yaWdodFxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRSaWdodEJvdHRvbSgpOiBWZWN0b3IyIHsgcmV0dXJuIG5ldyBWZWN0b3IyKCB0aGlzLm1heFgsIHRoaXMubWF4WSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmlnaHRCb3R0b20oKTogVmVjdG9yMiB7IHJldHVybiB0aGlzLmdldFJpZ2h0Qm90dG9tKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hldGhlciB3ZSBoYXZlIG5lZ2F0aXZlIHdpZHRoIG9yIGhlaWdodC4gQm91bmRzMi5OT1RISU5HIGlzIGEgcHJpbWUgZXhhbXBsZSBvZiBhbiBlbXB0eSBCb3VuZHMyLlxyXG4gICAqIEJvdW5kcyB3aXRoIHdpZHRoID0gaGVpZ2h0ID0gMCBhcmUgY29uc2lkZXJlZCBub3QgZW1wdHksIHNpbmNlIHRoZXkgaW5jbHVkZSB0aGUgc2luZ2xlICgwLDApIHBvaW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0VtcHR5KCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5nZXRXaWR0aCgpIDwgMCB8fCB0aGlzLmdldEhlaWdodCgpIDwgMDsgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIG91ciBtaW5pbXVtcyBhbmQgbWF4aW11bXMgYXJlIGFsbCBmaW5pdGUgbnVtYmVycy4gVGhpcyB3aWxsIGV4Y2x1ZGUgQm91bmRzMi5OT1RISU5HIGFuZCBCb3VuZHMyLkVWRVJZVEhJTkcuXHJcbiAgICovXHJcbiAgcHVibGljIGlzRmluaXRlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIGlzRmluaXRlKCB0aGlzLm1pblggKSAmJiBpc0Zpbml0ZSggdGhpcy5taW5ZICkgJiYgaXNGaW5pdGUoIHRoaXMubWF4WCApICYmIGlzRmluaXRlKCB0aGlzLm1heFkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgdGhpcyBib3VuZHMgaGFzIGEgbm9uLXplcm8gYXJlYSAobm9uLXplcm8gcG9zaXRpdmUgd2lkdGggYW5kIGhlaWdodCkuXHJcbiAgICovXHJcbiAgcHVibGljIGhhc05vbnplcm9BcmVhKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0V2lkdGgoKSA+IDAgJiYgdGhpcy5nZXRIZWlnaHQoKSA+IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIHRoaXMgYm91bmRzIGhhcyBhIGZpbml0ZSBhbmQgbm9uLW5lZ2F0aXZlIHdpZHRoIGFuZCBoZWlnaHQuXHJcbiAgICovXHJcbiAgcHVibGljIGlzVmFsaWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gIXRoaXMuaXNFbXB0eSgpICYmIHRoaXMuaXNGaW5pdGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIElmIHRoZSBwb2ludCBpcyBpbnNpZGUgdGhlIGJvdW5kcywgdGhlIHBvaW50IHdpbGwgYmUgcmV0dXJuZWQuIE90aGVyd2lzZSwgdGhpcyB3aWxsIHJldHVybiBhIG5ldyBwb2ludFxyXG4gICAqIG9uIHRoZSBlZGdlIG9mIHRoZSBib3VuZHMgdGhhdCBpcyB0aGUgY2xvc2VzdCB0byB0aGUgcHJvdmlkZWQgcG9pbnQuXHJcbiAgICovXHJcbiAgcHVibGljIGNsb3Nlc3RQb2ludFRvKCBwb2ludDogVmVjdG9yMiApOiBWZWN0b3IyIHtcclxuICAgIGlmICggdGhpcy5jb250YWluc0Nvb3JkaW5hdGVzKCBwb2ludC54LCBwb2ludC55ICkgKSB7XHJcbiAgICAgIHJldHVybiBwb2ludDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gdGhpcy5nZXRDb25zdHJhaW5lZFBvaW50KCBwb2ludCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmluZCB0aGUgcG9pbnQgb24gdGhlIGJvdW5kYXJ5IG9mIHRoZSBCb3VuZHMyIHRoYXQgaXMgY2xvc2VzdCB0byB0aGUgcHJvdmlkZWQgcG9pbnQuXHJcbiAgICovXHJcbiAgcHVibGljIGNsb3Nlc3RCb3VuZGFyeVBvaW50VG8oIHBvaW50OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgaWYgKCB0aGlzLmNvbnRhaW5zQ29vcmRpbmF0ZXMoIHBvaW50LngsIHBvaW50LnkgKSApIHtcclxuICAgICAgY29uc3QgY2xvc2VzdFhFZGdlID0gcG9pbnQueCA8IHRoaXMuY2VudGVyWCA/IHRoaXMubWluWCA6IHRoaXMubWF4WDtcclxuICAgICAgY29uc3QgY2xvc2VzdFlFZGdlID0gcG9pbnQueSA8IHRoaXMuY2VudGVyWSA/IHRoaXMubWluWSA6IHRoaXMubWF4WTtcclxuXHJcbiAgICAgIC8vIERlY2lkZSB3aGljaCBjYXJkaW5hbCBkaXJlY3Rpb24gdG8gZ28gYmFzZWQgb24gc2ltcGxlIGRpc3RhbmNlLlxyXG4gICAgICBpZiAoIE1hdGguYWJzKCBjbG9zZXN0WEVkZ2UgLSBwb2ludC54ICkgPCBNYXRoLmFicyggY2xvc2VzdFlFZGdlIC0gcG9pbnQueSApICkge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMiggY2xvc2VzdFhFZGdlLCBwb2ludC55ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKCBwb2ludC54LCBjbG9zZXN0WUVkZ2UgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmdldENvbnN0cmFpbmVkUG9pbnQoIHBvaW50ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHaXZlIGEgcG9pbnQgb3V0c2lkZSBvZiB0aGlzIEJvdW5kczIsIGNvbnN0cmFpbiBpdCB0byBhIHBvaW50IG9uIHRoZSBib3VuZGFyeSBvZiB0aGlzIEJvdW5kczIuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENvbnN0cmFpbmVkUG9pbnQoIHBvaW50OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgY29uc3QgeENvbnN0cmFpbmVkID0gTWF0aC5tYXgoIE1hdGgubWluKCBwb2ludC54LCB0aGlzLm1heFggKSwgdGhpcy54ICk7XHJcbiAgICBjb25zdCB5Q29uc3RyYWluZWQgPSBNYXRoLm1heCggTWF0aC5taW4oIHBvaW50LnksIHRoaXMubWF4WSApLCB0aGlzLnkgKTtcclxuICAgIHJldHVybiBuZXcgVmVjdG9yMiggeENvbnN0cmFpbmVkLCB5Q29uc3RyYWluZWQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgdGhlIGNvb3JkaW5hdGVzIGFyZSBjb250YWluZWQgaW5zaWRlIHRoZSBib3VuZGluZyBib3gsIG9yIGFyZSBvbiB0aGUgYm91bmRhcnkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0geCAtIFggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnQgdG8gY2hlY2tcclxuICAgKiBAcGFyYW0geSAtIFkgY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnQgdG8gY2hlY2tcclxuICAgKi9cclxuICBwdWJsaWMgY29udGFpbnNDb29yZGluYXRlcyggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5taW5YIDw9IHggJiYgeCA8PSB0aGlzLm1heFggJiYgdGhpcy5taW5ZIDw9IHkgJiYgeSA8PSB0aGlzLm1heFk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIHRoZSBwb2ludCBpcyBjb250YWluZWQgaW5zaWRlIHRoZSBib3VuZGluZyBib3gsIG9yIGlzIG9uIHRoZSBib3VuZGFyeS5cclxuICAgKi9cclxuICBwdWJsaWMgY29udGFpbnNQb2ludCggcG9pbnQ6IFZlY3RvcjIgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5jb250YWluc0Nvb3JkaW5hdGVzKCBwb2ludC54LCBwb2ludC55ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIHRoaXMgYm91bmRpbmcgYm94IGNvbXBsZXRlbHkgY29udGFpbnMgdGhlIGJvdW5kaW5nIGJveCBwYXNzZWQgYXMgYSBwYXJhbWV0ZXIuIFRoZSBib3VuZGFyeSBvZiBhIGJveCBpc1xyXG4gICAqIGNvbnNpZGVyZWQgdG8gYmUgXCJjb250YWluZWRcIi5cclxuICAgKi9cclxuICBwdWJsaWMgY29udGFpbnNCb3VuZHMoIGJvdW5kczogQm91bmRzMiApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLm1pblggPD0gYm91bmRzLm1pblggJiYgdGhpcy5tYXhYID49IGJvdW5kcy5tYXhYICYmIHRoaXMubWluWSA8PSBib3VuZHMubWluWSAmJiB0aGlzLm1heFkgPj0gYm91bmRzLm1heFk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIHRoaXMgYW5kIGFub3RoZXIgYm91bmRpbmcgYm94IGhhdmUgYW55IHBvaW50cyBvZiBpbnRlcnNlY3Rpb24gKGluY2x1ZGluZyB0b3VjaGluZyBib3VuZGFyaWVzKS5cclxuICAgKi9cclxuICBwdWJsaWMgaW50ZXJzZWN0c0JvdW5kcyggYm91bmRzOiBCb3VuZHMyICk6IGJvb2xlYW4ge1xyXG4gICAgY29uc3QgbWluWCA9IE1hdGgubWF4KCB0aGlzLm1pblgsIGJvdW5kcy5taW5YICk7XHJcbiAgICBjb25zdCBtaW5ZID0gTWF0aC5tYXgoIHRoaXMubWluWSwgYm91bmRzLm1pblkgKTtcclxuICAgIGNvbnN0IG1heFggPSBNYXRoLm1pbiggdGhpcy5tYXhYLCBib3VuZHMubWF4WCApO1xyXG4gICAgY29uc3QgbWF4WSA9IE1hdGgubWluKCB0aGlzLm1heFksIGJvdW5kcy5tYXhZICk7XHJcbiAgICByZXR1cm4gKCBtYXhYIC0gbWluWCApID49IDAgJiYgKCBtYXhZIC0gbWluWSA+PSAwICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgc3F1YXJlZCBkaXN0YW5jZSBmcm9tIHRoZSBpbnB1dCBwb2ludCB0byB0aGUgcG9pbnQgY2xvc2VzdCB0byBpdCBpbnNpZGUgdGhlIGJvdW5kaW5nIGJveC5cclxuICAgKi9cclxuICBwdWJsaWMgbWluaW11bURpc3RhbmNlVG9Qb2ludFNxdWFyZWQoIHBvaW50OiBWZWN0b3IyICk6IG51bWJlciB7XHJcbiAgICBjb25zdCBjbG9zZVggPSBwb2ludC54IDwgdGhpcy5taW5YID8gdGhpcy5taW5YIDogKCBwb2ludC54ID4gdGhpcy5tYXhYID8gdGhpcy5tYXhYIDogbnVsbCApO1xyXG4gICAgY29uc3QgY2xvc2VZID0gcG9pbnQueSA8IHRoaXMubWluWSA/IHRoaXMubWluWSA6ICggcG9pbnQueSA+IHRoaXMubWF4WSA/IHRoaXMubWF4WSA6IG51bGwgKTtcclxuICAgIGxldCBkO1xyXG4gICAgaWYgKCBjbG9zZVggPT09IG51bGwgJiYgY2xvc2VZID09PSBudWxsICkge1xyXG4gICAgICAvLyBpbnNpZGUsIG9yIG9uIHRoZSBib3VuZGFyeVxyXG4gICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBjbG9zZVggPT09IG51bGwgKSB7XHJcbiAgICAgIC8vIHZlcnRpY2FsbHkgZGlyZWN0bHkgYWJvdmUvYmVsb3dcclxuICAgICAgZCA9IGNsb3NlWSEgLSBwb2ludC55O1xyXG4gICAgICByZXR1cm4gZCAqIGQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggY2xvc2VZID09PSBudWxsICkge1xyXG4gICAgICAvLyBob3Jpem9udGFsbHkgZGlyZWN0bHkgdG8gdGhlIGxlZnQvcmlnaHRcclxuICAgICAgZCA9IGNsb3NlWCAtIHBvaW50Lng7XHJcbiAgICAgIHJldHVybiBkICogZDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBjb3JuZXIgY2FzZVxyXG4gICAgICBjb25zdCBkeCA9IGNsb3NlWCAtIHBvaW50Lng7XHJcbiAgICAgIGNvbnN0IGR5ID0gY2xvc2VZIC0gcG9pbnQueTtcclxuICAgICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHNxdWFyZWQgZGlzdGFuY2UgZnJvbSB0aGUgaW5wdXQgcG9pbnQgdG8gdGhlIHBvaW50IGZ1cnRoZXN0IGZyb20gaXQgaW5zaWRlIHRoZSBib3VuZGluZyBib3guXHJcbiAgICovXHJcbiAgcHVibGljIG1heGltdW1EaXN0YW5jZVRvUG9pbnRTcXVhcmVkKCBwb2ludDogVmVjdG9yMiApOiBudW1iZXIge1xyXG4gICAgbGV0IHggPSBwb2ludC54ID4gdGhpcy5nZXRDZW50ZXJYKCkgPyB0aGlzLm1pblggOiB0aGlzLm1heFg7XHJcbiAgICBsZXQgeSA9IHBvaW50LnkgPiB0aGlzLmdldENlbnRlclkoKSA/IHRoaXMubWluWSA6IHRoaXMubWF4WTtcclxuICAgIHggLT0gcG9pbnQueDtcclxuICAgIHkgLT0gcG9pbnQueTtcclxuICAgIHJldHVybiB4ICogeCArIHkgKiB5O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVidWdnaW5nIHN0cmluZyBmb3IgdGhlIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBgW3g6KCR7dGhpcy5taW5YfSwke3RoaXMubWF4WH0pLHk6KCR7dGhpcy5taW5ZfSwke3RoaXMubWF4WX0pXWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeGFjdCBlcXVhbGl0eSBjb21wYXJpc29uIGJldHdlZW4gdGhpcyBib3VuZHMgYW5kIGFub3RoZXIgYm91bmRzLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBXaGV0aGVyIHRoZSB0d28gYm91bmRzIGFyZSBlcXVhbFxyXG4gICAqL1xyXG4gIHB1YmxpYyBlcXVhbHMoIG90aGVyOiBCb3VuZHMyICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMubWluWCA9PT0gb3RoZXIubWluWCAmJiB0aGlzLm1pblkgPT09IG90aGVyLm1pblkgJiYgdGhpcy5tYXhYID09PSBvdGhlci5tYXhYICYmIHRoaXMubWF4WSA9PT0gb3RoZXIubWF4WTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFwcHJveGltYXRlIGVxdWFsaXR5IGNvbXBhcmlzb24gYmV0d2VlbiB0aGlzIGJvdW5kcyBhbmQgYW5vdGhlciBib3VuZHMuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyAtIFdoZXRoZXIgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSB0d28gYm91bmRzIGhhcyBubyBtaW4vbWF4IHdpdGggYW4gYWJzb2x1dGUgdmFsdWUgZ3JlYXRlclxyXG4gICAqICAgICAgICAgICAgdGhhbiBlcHNpbG9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBlcXVhbHNFcHNpbG9uKCBvdGhlcjogQm91bmRzMiwgZXBzaWxvbjogbnVtYmVyICk6IGJvb2xlYW4ge1xyXG4gICAgZXBzaWxvbiA9IGVwc2lsb24gIT09IHVuZGVmaW5lZCA/IGVwc2lsb24gOiAwO1xyXG4gICAgY29uc3QgdGhpc0Zpbml0ZSA9IHRoaXMuaXNGaW5pdGUoKTtcclxuICAgIGNvbnN0IG90aGVyRmluaXRlID0gb3RoZXIuaXNGaW5pdGUoKTtcclxuICAgIGlmICggdGhpc0Zpbml0ZSAmJiBvdGhlckZpbml0ZSApIHtcclxuICAgICAgLy8gYm90aCBhcmUgZmluaXRlLCBzbyB3ZSBjYW4gdXNlIE1hdGguYWJzKCkgLSBpdCB3b3VsZCBmYWlsIHdpdGggbm9uLWZpbml0ZSB2YWx1ZXMgbGlrZSBJbmZpbml0eVxyXG4gICAgICByZXR1cm4gTWF0aC5hYnMoIHRoaXMubWluWCAtIG90aGVyLm1pblggKSA8IGVwc2lsb24gJiZcclxuICAgICAgICAgICAgIE1hdGguYWJzKCB0aGlzLm1pblkgLSBvdGhlci5taW5ZICkgPCBlcHNpbG9uICYmXHJcbiAgICAgICAgICAgICBNYXRoLmFicyggdGhpcy5tYXhYIC0gb3RoZXIubWF4WCApIDwgZXBzaWxvbiAmJlxyXG4gICAgICAgICAgICAgTWF0aC5hYnMoIHRoaXMubWF4WSAtIG90aGVyLm1heFkgKSA8IGVwc2lsb247XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdGhpc0Zpbml0ZSAhPT0gb3RoZXJGaW5pdGUgKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTsgLy8gb25lIGlzIGZpbml0ZSwgdGhlIG90aGVyIGlzIG5vdC4gZGVmaW5pdGVseSBub3QgZXF1YWxcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCAoIHRoaXMgYXMgdW5rbm93biBhcyBCb3VuZHMyICkgPT09IG90aGVyICkge1xyXG4gICAgICByZXR1cm4gdHJ1ZTsgLy8gZXhhY3Qgc2FtZSBpbnN0YW5jZSwgbXVzdCBiZSBlcXVhbFxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGVwc2lsb24gb25seSBhcHBsaWVzIG9uIGZpbml0ZSBkaW1lbnNpb25zLiBkdWUgdG8gSlMncyBoYW5kbGluZyBvZiBpc0Zpbml0ZSgpLCBpdCdzIGZhc3RlciB0byBjaGVjayB0aGUgc3VtIG9mIGJvdGhcclxuICAgICAgcmV0dXJuICggaXNGaW5pdGUoIHRoaXMubWluWCArIG90aGVyLm1pblggKSA/ICggTWF0aC5hYnMoIHRoaXMubWluWCAtIG90aGVyLm1pblggKSA8IGVwc2lsb24gKSA6ICggdGhpcy5taW5YID09PSBvdGhlci5taW5YICkgKSAmJlxyXG4gICAgICAgICAgICAgKCBpc0Zpbml0ZSggdGhpcy5taW5ZICsgb3RoZXIubWluWSApID8gKCBNYXRoLmFicyggdGhpcy5taW5ZIC0gb3RoZXIubWluWSApIDwgZXBzaWxvbiApIDogKCB0aGlzLm1pblkgPT09IG90aGVyLm1pblkgKSApICYmXHJcbiAgICAgICAgICAgICAoIGlzRmluaXRlKCB0aGlzLm1heFggKyBvdGhlci5tYXhYICkgPyAoIE1hdGguYWJzKCB0aGlzLm1heFggLSBvdGhlci5tYXhYICkgPCBlcHNpbG9uICkgOiAoIHRoaXMubWF4WCA9PT0gb3RoZXIubWF4WCApICkgJiZcclxuICAgICAgICAgICAgICggaXNGaW5pdGUoIHRoaXMubWF4WSArIG90aGVyLm1heFkgKSA/ICggTWF0aC5hYnMoIHRoaXMubWF4WSAtIG90aGVyLm1heFkgKSA8IGVwc2lsb24gKSA6ICggdGhpcy5tYXhZID09PSBvdGhlci5tYXhZICkgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxyXG4gICAqIEltbXV0YWJsZSBvcGVyYXRpb25zXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgY29weSBvZiB0aGlzIGJvdW5kcywgb3IgaWYgYSBib3VuZHMgaXMgcGFzc2VkIGluLCBzZXQgdGhhdCBib3VuZHMncyB2YWx1ZXMgdG8gb3Vycy5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBzZXQoKSwgaWYgYSBib3VuZHMgaXMgcHJvdmlkZWQuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmRcclxuICAgKiB3aWxsIG5vdCBtb2RpZnkgdGhpcyBib3VuZHMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gW2JvdW5kc10gLSBJZiBub3QgcHJvdmlkZWQsIGNyZWF0ZXMgYSBuZXcgQm91bmRzMiB3aXRoIGZpbGxlZCBpbiB2YWx1ZXMuIE90aGVyd2lzZSwgZmlsbHMgaW4gdGhlXHJcbiAgICogICAgICAgICAgICAgICAgICAgdmFsdWVzIG9mIHRoZSBwcm92aWRlZCBib3VuZHMgc28gdGhhdCBpdCBlcXVhbHMgdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGNvcHkoIGJvdW5kcz86IEJvdW5kczIgKTogQm91bmRzMiB7XHJcbiAgICBpZiAoIGJvdW5kcyApIHtcclxuICAgICAgcmV0dXJuIGJvdW5kcy5zZXQoIHRoaXMgYXMgdW5rbm93biBhcyBCb3VuZHMyICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIGIyKCB0aGlzLm1pblgsIHRoaXMubWluWSwgdGhpcy5tYXhYLCB0aGlzLm1heFkgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN0YXRpYyBmYWN0b3J5IG1ldGhvZFxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlKCBib3VuZHM6IEJvdW5kczJMaWtlICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIGIyKCBib3VuZHMubWluWCwgYm91bmRzLm1pblksIGJvdW5kcy5tYXhYLCBib3VuZHMubWF4WSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHNtYWxsZXN0IGJvdW5kcyB0aGF0IGNvbnRhaW5zIGJvdGggdGhpcyBib3VuZHMgYW5kIHRoZSBpbnB1dCBib3VuZHMsIHJldHVybmVkIGFzIGEgY29weS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBpbmNsdWRlQm91bmRzKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHVuaW9uKCBib3VuZHM6IEJvdW5kczIgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gYjIoXHJcbiAgICAgIE1hdGgubWluKCB0aGlzLm1pblgsIGJvdW5kcy5taW5YICksXHJcbiAgICAgIE1hdGgubWluKCB0aGlzLm1pblksIGJvdW5kcy5taW5ZICksXHJcbiAgICAgIE1hdGgubWF4KCB0aGlzLm1heFgsIGJvdW5kcy5tYXhYICksXHJcbiAgICAgIE1hdGgubWF4KCB0aGlzLm1heFksIGJvdW5kcy5tYXhZIClcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgc21hbGxlc3QgYm91bmRzIHRoYXQgaXMgY29udGFpbmVkIGJ5IGJvdGggdGhpcyBib3VuZHMgYW5kIHRoZSBpbnB1dCBib3VuZHMsIHJldHVybmVkIGFzIGEgY29weS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBjb25zdHJhaW5Cb3VuZHMoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgaW50ZXJzZWN0aW9uKCBib3VuZHM6IEJvdW5kczIgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gYjIoXHJcbiAgICAgIE1hdGgubWF4KCB0aGlzLm1pblgsIGJvdW5kcy5taW5YICksXHJcbiAgICAgIE1hdGgubWF4KCB0aGlzLm1pblksIGJvdW5kcy5taW5ZICksXHJcbiAgICAgIE1hdGgubWluKCB0aGlzLm1heFgsIGJvdW5kcy5tYXhYICksXHJcbiAgICAgIE1hdGgubWluKCB0aGlzLm1heFksIGJvdW5kcy5tYXhZIClcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvLyBUT0RPOiBkaWZmZXJlbmNlIHNob3VsZCBiZSB3ZWxsLWRlZmluZWQsIGJ1dCBtb3JlIGxvZ2ljIGlzIG5lZWRlZCB0byBjb21wdXRlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9kb3QvaXNzdWVzLzk2XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBzbWFsbGVzdCBib3VuZHMgdGhhdCBjb250YWlucyB0aGlzIGJvdW5kcyBhbmQgdGhlIHBvaW50ICh4LHkpLCByZXR1cm5lZCBhcyBhIGNvcHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gYWRkQ29vcmRpbmF0ZXMoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgd2l0aENvb3JkaW5hdGVzKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiBiMihcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWluWCwgeCApLFxyXG4gICAgICBNYXRoLm1pbiggdGhpcy5taW5ZLCB5ICksXHJcbiAgICAgIE1hdGgubWF4KCB0aGlzLm1heFgsIHggKSxcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWF4WSwgeSApXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHNtYWxsZXN0IGJvdW5kcyB0aGF0IGNvbnRhaW5zIHRoaXMgYm91bmRzIGFuZCB0aGUgaW5wdXQgcG9pbnQsIHJldHVybmVkIGFzIGEgY29weS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBhZGRQb2ludCgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aXRoUG9pbnQoIHBvaW50OiBWZWN0b3IyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMud2l0aENvb3JkaW5hdGVzKCBwb2ludC54LCBwb2ludC55ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBzbWFsbGVzdCBib3VuZHMgdGhhdCBjb250YWlucyBib3RoIHRoaXMgYm91bmRzIGFuZCB0aGUgeCB2YWx1ZSBwcm92aWRlZC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBhZGRYKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHdpdGhYKCB4OiBudW1iZXIgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5jb3B5KCkuYWRkWCggeCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc21hbGxlc3QgYm91bmRzIHRoYXQgY29udGFpbnMgYm90aCB0aGlzIGJvdW5kcyBhbmQgdGhlIHkgdmFsdWUgcHJvdmlkZWQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gYWRkWSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aXRoWSggeTogbnVtYmVyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuY29weSgpLmFkZFkoIHkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgY29weSBvZiB0aGlzIGJvdW5kcywgd2l0aCBtaW5YIHJlcGxhY2VkIHdpdGggdGhlIGlucHV0LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHNldE1pblgoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgd2l0aE1pblgoIG1pblg6IG51bWJlciApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiBiMiggbWluWCwgdGhpcy5taW5ZLCB0aGlzLm1heFgsIHRoaXMubWF4WSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBjb3B5IG9mIHRoaXMgYm91bmRzLCB3aXRoIG1pblkgcmVwbGFjZWQgd2l0aCB0aGUgaW5wdXQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2V0TWluWSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aXRoTWluWSggbWluWTogbnVtYmVyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIGIyKCB0aGlzLm1pblgsIG1pblksIHRoaXMubWF4WCwgdGhpcy5tYXhZICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGNvcHkgb2YgdGhpcyBib3VuZHMsIHdpdGggbWF4WCByZXBsYWNlZCB3aXRoIHRoZSBpbnB1dC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBzZXRNYXhYKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHdpdGhNYXhYKCBtYXhYOiBudW1iZXIgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gYjIoIHRoaXMubWluWCwgdGhpcy5taW5ZLCBtYXhYLCB0aGlzLm1heFkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgY29weSBvZiB0aGlzIGJvdW5kcywgd2l0aCBtYXhZIHJlcGxhY2VkIHdpdGggdGhlIGlucHV0LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHNldE1heFkoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgd2l0aE1heFkoIG1heFk6IG51bWJlciApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiBiMiggdGhpcy5taW5YLCB0aGlzLm1pblksIHRoaXMubWF4WCwgbWF4WSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBjb3B5IG9mIHRoaXMgYm91bmRzLCB3aXRoIHRoZSBtaW5pbXVtIHZhbHVlcyByb3VuZGVkIGRvd24gdG8gdGhlIG5lYXJlc3QgaW50ZWdlciwgYW5kIHRoZSBtYXhpbXVtIHZhbHVlc1xyXG4gICAqIHJvdW5kZWQgdXAgdG8gdGhlIG5lYXJlc3QgaW50ZWdlci4gVGhpcyBjYXVzZXMgdGhlIGJvdW5kcyB0byBleHBhbmQgYXMgbmVjZXNzYXJ5IHNvIHRoYXQgaXRzIGJvdW5kYXJpZXNcclxuICAgKiBhcmUgaW50ZWdlci1hbGlnbmVkLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHJvdW5kT3V0KCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHJvdW5kZWRPdXQoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gYjIoXHJcbiAgICAgIE1hdGguZmxvb3IoIHRoaXMubWluWCApLFxyXG4gICAgICBNYXRoLmZsb29yKCB0aGlzLm1pblkgKSxcclxuICAgICAgTWF0aC5jZWlsKCB0aGlzLm1heFggKSxcclxuICAgICAgTWF0aC5jZWlsKCB0aGlzLm1heFkgKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgY29weSBvZiB0aGlzIGJvdW5kcywgd2l0aCB0aGUgbWluaW11bSB2YWx1ZXMgcm91bmRlZCB1cCB0byB0aGUgbmVhcmVzdCBpbnRlZ2VyLCBhbmQgdGhlIG1heGltdW0gdmFsdWVzXHJcbiAgICogcm91bmRlZCBkb3duIHRvIHRoZSBuZWFyZXN0IGludGVnZXIuIFRoaXMgY2F1c2VzIHRoZSBib3VuZHMgdG8gY29udHJhY3QgYXMgbmVjZXNzYXJ5IHNvIHRoYXQgaXRzIGJvdW5kYXJpZXNcclxuICAgKiBhcmUgaW50ZWdlci1hbGlnbmVkLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHJvdW5kSW4oKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgcm91bmRlZEluKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIGIyKFxyXG4gICAgICBNYXRoLmNlaWwoIHRoaXMubWluWCApLFxyXG4gICAgICBNYXRoLmNlaWwoIHRoaXMubWluWSApLFxyXG4gICAgICBNYXRoLmZsb29yKCB0aGlzLm1heFggKSxcclxuICAgICAgTWF0aC5mbG9vciggdGhpcy5tYXhZIClcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGJvdW5kaW5nIGJveCAoc3RpbGwgYXhpcy1hbGlnbmVkKSB0aGF0IGNvbnRhaW5zIHRoZSB0cmFuc2Zvcm1lZCBzaGFwZSBvZiB0aGlzIGJvdW5kcywgYXBwbHlpbmcgdGhlIG1hdHJpeCBhc1xyXG4gICAqIGFuIGFmZmluZSB0cmFuc2Zvcm1hdGlvbi5cclxuICAgKlxyXG4gICAqIE5PVEU6IGJvdW5kcy50cmFuc2Zvcm1lZCggbWF0cml4ICkudHJhbnNmb3JtZWQoIGludmVyc2UgKSBtYXkgYmUgbGFyZ2VyIHRoYW4gdGhlIG9yaWdpbmFsIGJveCwgaWYgaXQgaW5jbHVkZXNcclxuICAgKiBhIHJvdGF0aW9uIHRoYXQgaXNuJ3QgYSBtdWx0aXBsZSBvZiAkXFxwaS8yJC4gVGhpcyBpcyBiZWNhdXNlIHRoZSByZXR1cm5lZCBib3VuZHMgbWF5IGV4cGFuZCBpbiBhcmVhIHRvIGNvdmVyXHJcbiAgICogQUxMIG9mIHRoZSBjb3JuZXJzIG9mIHRoZSB0cmFuc2Zvcm1lZCBib3VuZGluZyBib3guXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gdHJhbnNmb3JtKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHRyYW5zZm9ybWVkKCBtYXRyaXg6IE1hdHJpeDMgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5jb3B5KCkudHJhbnNmb3JtKCBtYXRyaXggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgYm91bmRpbmcgYm94IHRoYXQgaXMgZXhwYW5kZWQgb24gYWxsIHNpZGVzIGJ5IHRoZSBzcGVjaWZpZWQgYW1vdW50LilcclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBkaWxhdGUoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZGlsYXRlZCggZDogbnVtYmVyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuZGlsYXRlZFhZKCBkLCBkICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGJvdW5kaW5nIGJveCB0aGF0IGlzIGV4cGFuZGVkIGhvcml6b250YWxseSAob24gdGhlIGxlZnQgYW5kIHJpZ2h0KSBieSB0aGUgc3BlY2lmaWVkIGFtb3VudC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBkaWxhdGVYKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGRpbGF0ZWRYKCB4OiBudW1iZXIgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gYjIoIHRoaXMubWluWCAtIHgsIHRoaXMubWluWSwgdGhpcy5tYXhYICsgeCwgdGhpcy5tYXhZICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGJvdW5kaW5nIGJveCB0aGF0IGlzIGV4cGFuZGVkIHZlcnRpY2FsbHkgKG9uIHRoZSB0b3AgYW5kIGJvdHRvbSkgYnkgdGhlIHNwZWNpZmllZCBhbW91bnQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gZGlsYXRlWSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaWxhdGVkWSggeTogbnVtYmVyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIGIyKCB0aGlzLm1pblgsIHRoaXMubWluWSAtIHksIHRoaXMubWF4WCwgdGhpcy5tYXhZICsgeSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBib3VuZGluZyBib3ggdGhhdCBpcyBleHBhbmRlZCBvbiBhbGwgc2lkZXMsIHdpdGggZGlmZmVyZW50IGFtb3VudHMgb2YgZXhwYW5zaW9uIGhvcml6b250YWxseSBhbmQgdmVydGljYWxseS5cclxuICAgKiBXaWxsIGJlIGlkZW50aWNhbCB0byB0aGUgYm91bmRzIHJldHVybmVkIGJ5IGNhbGxpbmcgYm91bmRzLmRpbGF0ZWRYKCB4ICkuZGlsYXRlZFkoIHkgKS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBkaWxhdGVYWSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHggLSBBbW91bnQgdG8gZGlsYXRlIGhvcml6b250YWxseSAoZm9yIGVhY2ggc2lkZSlcclxuICAgKiBAcGFyYW0geSAtIEFtb3VudCB0byBkaWxhdGUgdmVydGljYWxseSAoZm9yIGVhY2ggc2lkZSlcclxuICAgKi9cclxuICBwdWJsaWMgZGlsYXRlZFhZKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiBiMiggdGhpcy5taW5YIC0geCwgdGhpcy5taW5ZIC0geSwgdGhpcy5tYXhYICsgeCwgdGhpcy5tYXhZICsgeSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBib3VuZGluZyBib3ggdGhhdCBpcyBjb250cmFjdGVkIG9uIGFsbCBzaWRlcyBieSB0aGUgc3BlY2lmaWVkIGFtb3VudC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBlcm9kZSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBlcm9kZWQoIGFtb3VudDogbnVtYmVyICk6IEJvdW5kczIgeyByZXR1cm4gdGhpcy5kaWxhdGVkKCAtYW1vdW50ICk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBib3VuZGluZyBib3ggdGhhdCBpcyBjb250cmFjdGVkIGhvcml6b250YWxseSAob24gdGhlIGxlZnQgYW5kIHJpZ2h0KSBieSB0aGUgc3BlY2lmaWVkIGFtb3VudC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBlcm9kZVgoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZXJvZGVkWCggeDogbnVtYmVyICk6IEJvdW5kczIgeyByZXR1cm4gdGhpcy5kaWxhdGVkWCggLXggKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGJvdW5kaW5nIGJveCB0aGF0IGlzIGNvbnRyYWN0ZWQgdmVydGljYWxseSAob24gdGhlIHRvcCBhbmQgYm90dG9tKSBieSB0aGUgc3BlY2lmaWVkIGFtb3VudC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBlcm9kZVkoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZXJvZGVkWSggeTogbnVtYmVyICk6IEJvdW5kczIgeyByZXR1cm4gdGhpcy5kaWxhdGVkWSggLXkgKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGJvdW5kaW5nIGJveCB0aGF0IGlzIGNvbnRyYWN0ZWQgb24gYWxsIHNpZGVzLCB3aXRoIGRpZmZlcmVudCBhbW91bnRzIG9mIGNvbnRyYWN0aW9uIGhvcml6b250YWxseSBhbmQgdmVydGljYWxseS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBlcm9kZVhZKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0geCAtIEFtb3VudCB0byBlcm9kZSBob3Jpem9udGFsbHkgKGZvciBlYWNoIHNpZGUpXHJcbiAgICogQHBhcmFtIHkgLSBBbW91bnQgdG8gZXJvZGUgdmVydGljYWxseSAoZm9yIGVhY2ggc2lkZSlcclxuICAgKi9cclxuICBwdWJsaWMgZXJvZGVkWFkoIHg6IG51bWJlciwgeTogbnVtYmVyICk6IEJvdW5kczIgeyByZXR1cm4gdGhpcy5kaWxhdGVkWFkoIC14LCAteSApOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgYm91bmRpbmcgYm94IHRoYXQgaXMgZXhwYW5kZWQgYnkgYSBzcGVjaWZpYyBhbW91bnQgb24gYWxsIHNpZGVzIChvciBpZiBzb21lIG9mZnNldHMgYXJlIG5lZ2F0aXZlLCB3aWxsIGNvbnRyYWN0XHJcbiAgICogdGhvc2Ugc2lkZXMpLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIG9mZnNldCgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGxlZnQgLSBBbW91bnQgdG8gZXhwYW5kIHRvIHRoZSBsZWZ0IChzdWJ0cmFjdHMgZnJvbSBtaW5YKVxyXG4gICAqIEBwYXJhbSB0b3AgLSBBbW91bnQgdG8gZXhwYW5kIHRvIHRoZSB0b3AgKHN1YnRyYWN0cyBmcm9tIG1pblkpXHJcbiAgICogQHBhcmFtIHJpZ2h0IC0gQW1vdW50IHRvIGV4cGFuZCB0byB0aGUgcmlnaHQgKGFkZHMgdG8gbWF4WClcclxuICAgKiBAcGFyYW0gYm90dG9tIC0gQW1vdW50IHRvIGV4cGFuZCB0byB0aGUgYm90dG9tIChhZGRzIHRvIG1heFkpXHJcbiAgICovXHJcbiAgcHVibGljIHdpdGhPZmZzZXRzKCBsZWZ0OiBudW1iZXIsIHRvcDogbnVtYmVyLCByaWdodDogbnVtYmVyLCBib3R0b206IG51bWJlciApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiBiMiggdGhpcy5taW5YIC0gbGVmdCwgdGhpcy5taW5ZIC0gdG9wLCB0aGlzLm1heFggKyByaWdodCwgdGhpcy5tYXhZICsgYm90dG9tICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPdXIgYm91bmRzLCB0cmFuc2xhdGVkIGhvcml6b250YWxseSBieSB4LCByZXR1cm5lZCBhcyBhIGNvcHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2hpZnRYKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHNoaWZ0ZWRYKCB4OiBudW1iZXIgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gYjIoIHRoaXMubWluWCArIHgsIHRoaXMubWluWSwgdGhpcy5tYXhYICsgeCwgdGhpcy5tYXhZICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPdXIgYm91bmRzLCB0cmFuc2xhdGVkIHZlcnRpY2FsbHkgYnkgeSwgcmV0dXJuZWQgYXMgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHNoaWZ0WSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzaGlmdGVkWSggeTogbnVtYmVyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIGIyKCB0aGlzLm1pblgsIHRoaXMubWluWSArIHksIHRoaXMubWF4WCwgdGhpcy5tYXhZICsgeSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3VyIGJvdW5kcywgdHJhbnNsYXRlZCBieSAoeCx5KSwgcmV0dXJuZWQgYXMgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHNoaWZ0KCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHNoaWZ0ZWRYWSggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gYjIoIHRoaXMubWluWCArIHgsIHRoaXMubWluWSArIHksIHRoaXMubWF4WCArIHgsIHRoaXMubWF4WSArIHkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgb3VyIGJvdW5kcywgdHJhbnNsYXRlZCBieSBhIHZlY3RvciwgcmV0dXJuZWQgYXMgYSBjb3B5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzaGlmdGVkKCB2OiBWZWN0b3IyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2hpZnRlZFhZKCB2LngsIHYueSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBpbnRlcnBvbGF0ZWQgdmFsdWUgb2YgdGhpcyBib3VuZHMgYW5kIHRoZSBhcmd1bWVudC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBib3VuZHNcclxuICAgKiBAcGFyYW0gcmF0aW8gLSAwIHdpbGwgcmVzdWx0IGluIGEgY29weSBvZiBgdGhpc2AsIDEgd2lsbCByZXN1bHQgaW4gYm91bmRzLCBhbmQgaW4tYmV0d2VlbiBjb250cm9scyB0aGVcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBhbW91bnQgb2YgZWFjaC5cclxuICAgKi9cclxuICBwdWJsaWMgYmxlbmQoIGJvdW5kczogQm91bmRzMiwgcmF0aW86IG51bWJlciApOiBCb3VuZHMyIHtcclxuICAgIGNvbnN0IHQgPSAxIC0gcmF0aW87XHJcbiAgICByZXR1cm4gYjIoXHJcbiAgICAgIHQgKiB0aGlzLm1pblggKyByYXRpbyAqIGJvdW5kcy5taW5YLFxyXG4gICAgICB0ICogdGhpcy5taW5ZICsgcmF0aW8gKiBib3VuZHMubWluWSxcclxuICAgICAgdCAqIHRoaXMubWF4WCArIHJhdGlvICogYm91bmRzLm1heFgsXHJcbiAgICAgIHQgKiB0aGlzLm1heFkgKyByYXRpbyAqIGJvdW5kcy5tYXhZXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXHJcbiAgICogTXV0YWJsZSBvcGVyYXRpb25zXHJcbiAgICpcclxuICAgKiBBbGwgbXV0YWJsZSBvcGVyYXRpb25zIHNob3VsZCBjYWxsIG9uZSBvZiB0aGUgZm9sbG93aW5nOlxyXG4gICAqICAgc2V0TWluTWF4LCBzZXRNaW5YLCBzZXRNaW5ZLCBzZXRNYXhYLCBzZXRNYXhZXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuICAvKipcclxuICAgKiBTZXRzIGVhY2ggdmFsdWUgZm9yIHRoaXMgYm91bmRzLCBhbmQgcmV0dXJucyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHNldE1pbk1heCggbWluWDogbnVtYmVyLCBtaW5ZOiBudW1iZXIsIG1heFg6IG51bWJlciwgbWF4WTogbnVtYmVyICk6IEJvdW5kczIge1xyXG4gICAgdGhpcy5taW5YID0gbWluWDtcclxuICAgIHRoaXMubWluWSA9IG1pblk7XHJcbiAgICB0aGlzLm1heFggPSBtYXhYO1xyXG4gICAgdGhpcy5tYXhZID0gbWF4WTtcclxuICAgIHJldHVybiAoIHRoaXMgYXMgdW5rbm93biBhcyBCb3VuZHMyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB2YWx1ZSBvZiBtaW5YLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiB3aXRoTWluWCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHNldE1pblgoIG1pblg6IG51bWJlciApOiBCb3VuZHMyIHtcclxuICAgIHRoaXMubWluWCA9IG1pblg7XHJcbiAgICByZXR1cm4gKCB0aGlzIGFzIHVua25vd24gYXMgQm91bmRzMiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdmFsdWUgb2YgbWluWS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gd2l0aE1pblkoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRNaW5ZKCBtaW5ZOiBudW1iZXIgKTogQm91bmRzMiB7XHJcbiAgICB0aGlzLm1pblkgPSBtaW5ZO1xyXG4gICAgcmV0dXJuICggdGhpcyBhcyB1bmtub3duIGFzIEJvdW5kczIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHZhbHVlIG9mIG1heFguXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHdpdGhNYXhYKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TWF4WCggbWF4WDogbnVtYmVyICk6IEJvdW5kczIge1xyXG4gICAgdGhpcy5tYXhYID0gbWF4WDtcclxuICAgIHJldHVybiAoIHRoaXMgYXMgdW5rbm93biBhcyBCb3VuZHMyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB2YWx1ZSBvZiBtYXhZLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiB3aXRoTWF4WSgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHNldE1heFkoIG1heFk6IG51bWJlciApOiBCb3VuZHMyIHtcclxuICAgIHRoaXMubWF4WSA9IG1heFk7XHJcbiAgICByZXR1cm4gKCB0aGlzIGFzIHVua25vd24gYXMgQm91bmRzMiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdmFsdWVzIG9mIHRoaXMgYm91bmRzIHRvIGJlIGVxdWFsIHRvIHRoZSBpbnB1dCBib3VuZHMuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGNvcHkoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQoIGJvdW5kczogQm91bmRzMkxpa2UgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRNaW5NYXgoIGJvdW5kcy5taW5YLCBib3VuZHMubWluWSwgYm91bmRzLm1heFgsIGJvdW5kcy5tYXhZICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb2RpZmllcyB0aGlzIGJvdW5kcyBzbyB0aGF0IGl0IGNvbnRhaW5zIGJvdGggaXRzIG9yaWdpbmFsIGJvdW5kcyBhbmQgdGhlIGlucHV0IGJvdW5kcy5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gdW5pb24oKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbmNsdWRlQm91bmRzKCBib3VuZHM6IEJvdW5kczIgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRNaW5NYXgoXHJcbiAgICAgIE1hdGgubWluKCB0aGlzLm1pblgsIGJvdW5kcy5taW5YICksXHJcbiAgICAgIE1hdGgubWluKCB0aGlzLm1pblksIGJvdW5kcy5taW5ZICksXHJcbiAgICAgIE1hdGgubWF4KCB0aGlzLm1heFgsIGJvdW5kcy5tYXhYICksXHJcbiAgICAgIE1hdGgubWF4KCB0aGlzLm1heFksIGJvdW5kcy5tYXhZIClcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb2RpZmllcyB0aGlzIGJvdW5kcyBzbyB0aGF0IGl0IGlzIHRoZSBsYXJnZXN0IGJvdW5kcyBjb250YWluZWQgYm90aCBpbiBpdHMgb3JpZ2luYWwgYm91bmRzIGFuZCBpbiB0aGUgaW5wdXQgYm91bmRzLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBpbnRlcnNlY3Rpb24oKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJhaW5Cb3VuZHMoIGJvdW5kczogQm91bmRzMiApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLnNldE1pbk1heChcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWluWCwgYm91bmRzLm1pblggKSxcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWluWSwgYm91bmRzLm1pblkgKSxcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWF4WCwgYm91bmRzLm1heFggKSxcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWF4WSwgYm91bmRzLm1heFkgKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vZGlmaWVzIHRoaXMgYm91bmRzIHNvIHRoYXQgaXQgY29udGFpbnMgYm90aCBpdHMgb3JpZ2luYWwgYm91bmRzIGFuZCB0aGUgaW5wdXQgcG9pbnQgKHgseSkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHdpdGhDb29yZGluYXRlcygpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGFkZENvb3JkaW5hdGVzKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLnNldE1pbk1heChcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWluWCwgeCApLFxyXG4gICAgICBNYXRoLm1pbiggdGhpcy5taW5ZLCB5ICksXHJcbiAgICAgIE1hdGgubWF4KCB0aGlzLm1heFgsIHggKSxcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWF4WSwgeSApXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW9kaWZpZXMgdGhpcyBib3VuZHMgc28gdGhhdCBpdCBjb250YWlucyBib3RoIGl0cyBvcmlnaW5hbCBib3VuZHMgYW5kIHRoZSBpbnB1dCBwb2ludC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gd2l0aFBvaW50KCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgYWRkUG9pbnQoIHBvaW50OiBWZWN0b3IyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuYWRkQ29vcmRpbmF0ZXMoIHBvaW50LngsIHBvaW50LnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vZGlmaWVzIHRoaXMgYm91bmRzIHNvIHRoYXQgaXQgaXMgZ3VhcmFudGVlZCB0byBpbmNsdWRlIHRoZSBnaXZlbiB4IHZhbHVlIChpZiBpdCBkaWRuJ3QgYWxyZWFkeSkuIElmIHRoZSB4IHZhbHVlXHJcbiAgICogd2FzIGFscmVhZHkgY29udGFpbmVkLCBub3RoaW5nIHdpbGwgYmUgZG9uZS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gd2l0aFgoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRYKCB4OiBudW1iZXIgKTogQm91bmRzMiB7XHJcbiAgICB0aGlzLm1pblggPSBNYXRoLm1pbiggeCwgdGhpcy5taW5YICk7XHJcbiAgICB0aGlzLm1heFggPSBNYXRoLm1heCggeCwgdGhpcy5tYXhYICk7XHJcbiAgICByZXR1cm4gKCB0aGlzIGFzIHVua25vd24gYXMgQm91bmRzMiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW9kaWZpZXMgdGhpcyBib3VuZHMgc28gdGhhdCBpdCBpcyBndWFyYW50ZWVkIHRvIGluY2x1ZGUgdGhlIGdpdmVuIHkgdmFsdWUgKGlmIGl0IGRpZG4ndCBhbHJlYWR5KS4gSWYgdGhlIHkgdmFsdWVcclxuICAgKiB3YXMgYWxyZWFkeSBjb250YWluZWQsIG5vdGhpbmcgd2lsbCBiZSBkb25lLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiB3aXRoWSgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGFkZFkoIHk6IG51bWJlciApOiBCb3VuZHMyIHtcclxuICAgIHRoaXMubWluWSA9IE1hdGgubWluKCB5LCB0aGlzLm1pblkgKTtcclxuICAgIHRoaXMubWF4WSA9IE1hdGgubWF4KCB5LCB0aGlzLm1heFkgKTtcclxuICAgIHJldHVybiAoIHRoaXMgYXMgdW5rbm93biBhcyBCb3VuZHMyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb2RpZmllcyB0aGlzIGJvdW5kcyBzbyB0aGF0IGl0cyBib3VuZGFyaWVzIGFyZSBpbnRlZ2VyLWFsaWduZWQsIHJvdW5kaW5nIHRoZSBtaW5pbXVtIGJvdW5kYXJpZXMgZG93biBhbmQgdGhlXHJcbiAgICogbWF4aW11bSBib3VuZGFyaWVzIHVwIChleHBhbmRpbmcgYXMgbmVjZXNzYXJ5KS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gcm91bmRlZE91dCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHJvdW5kT3V0KCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0TWluTWF4KFxyXG4gICAgICBNYXRoLmZsb29yKCB0aGlzLm1pblggKSxcclxuICAgICAgTWF0aC5mbG9vciggdGhpcy5taW5ZICksXHJcbiAgICAgIE1hdGguY2VpbCggdGhpcy5tYXhYICksXHJcbiAgICAgIE1hdGguY2VpbCggdGhpcy5tYXhZIClcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb2RpZmllcyB0aGlzIGJvdW5kcyBzbyB0aGF0IGl0cyBib3VuZGFyaWVzIGFyZSBpbnRlZ2VyLWFsaWduZWQsIHJvdW5kaW5nIHRoZSBtaW5pbXVtIGJvdW5kYXJpZXMgdXAgYW5kIHRoZVxyXG4gICAqIG1heGltdW0gYm91bmRhcmllcyBkb3duIChjb250cmFjdGluZyBhcyBuZWNlc3NhcnkpLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiByb3VuZGVkSW4oKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByb3VuZEluKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0TWluTWF4KFxyXG4gICAgICBNYXRoLmNlaWwoIHRoaXMubWluWCApLFxyXG4gICAgICBNYXRoLmNlaWwoIHRoaXMubWluWSApLFxyXG4gICAgICBNYXRoLmZsb29yKCB0aGlzLm1heFggKSxcclxuICAgICAgTWF0aC5mbG9vciggdGhpcy5tYXhZIClcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb2RpZmllcyB0aGlzIGJvdW5kcyBzbyB0aGF0IGl0IHdvdWxkIGZ1bGx5IGNvbnRhaW4gYSB0cmFuc2Zvcm1lZCB2ZXJzaW9uIGlmIGl0cyBwcmV2aW91cyB2YWx1ZSwgYXBwbHlpbmcgdGhlXHJcbiAgICogbWF0cml4IGFzIGFuIGFmZmluZSB0cmFuc2Zvcm1hdGlvbi5cclxuICAgKlxyXG4gICAqIE5PVEU6IGJvdW5kcy50cmFuc2Zvcm0oIG1hdHJpeCApLnRyYW5zZm9ybSggaW52ZXJzZSApIG1heSBiZSBsYXJnZXIgdGhhbiB0aGUgb3JpZ2luYWwgYm94LCBpZiBpdCBpbmNsdWRlc1xyXG4gICAqIGEgcm90YXRpb24gdGhhdCBpc24ndCBhIG11bHRpcGxlIG9mICRcXHBpLzIkLiBUaGlzIGlzIGJlY2F1c2UgdGhlIGJvdW5kcyBtYXkgZXhwYW5kIGluIGFyZWEgdG8gY292ZXJcclxuICAgKiBBTEwgb2YgdGhlIGNvcm5lcnMgb2YgdGhlIHRyYW5zZm9ybWVkIGJvdW5kaW5nIGJveC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gdHJhbnNmb3JtZWQoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0cmFuc2Zvcm0oIG1hdHJpeDogTWF0cml4MyApOiBCb3VuZHMyIHtcclxuICAgIC8vIGlmIHdlIGNvbnRhaW4gbm8gYXJlYSwgbm8gY2hhbmdlIGlzIG5lZWRlZFxyXG4gICAgaWYgKCB0aGlzLmlzRW1wdHkoKSApIHtcclxuICAgICAgcmV0dXJuICggdGhpcyBhcyB1bmtub3duIGFzIEJvdW5kczIgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBvcHRpbWl6YXRpb24gdG8gYmFpbCBmb3IgaWRlbnRpdHkgbWF0cmljZXNcclxuICAgIGlmICggbWF0cml4LmlzSWRlbnRpdHkoKSApIHtcclxuICAgICAgcmV0dXJuICggdGhpcyBhcyB1bmtub3duIGFzIEJvdW5kczIgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtaW5YID0gdGhpcy5taW5YO1xyXG4gICAgY29uc3QgbWluWSA9IHRoaXMubWluWTtcclxuICAgIGNvbnN0IG1heFggPSB0aGlzLm1heFg7XHJcbiAgICBjb25zdCBtYXhZID0gdGhpcy5tYXhZO1xyXG4gICAgdGhpcy5zZXQoIEJvdW5kczIuTk9USElORyApO1xyXG5cclxuICAgIC8vIHVzaW5nIG11dGFibGUgdmVjdG9yIHNvIHdlIGRvbid0IGNyZWF0ZSBleGNlc3NpdmUgaW5zdGFuY2VzIG9mIFZlY3RvcjIgZHVyaW5nIHRoaXNcclxuICAgIC8vIG1ha2Ugc3VyZSBhbGwgNCBjb3JuZXJzIGFyZSBpbnNpZGUgdGhpcyB0cmFuc2Zvcm1lZCBib3VuZGluZyBib3hcclxuXHJcbiAgICB0aGlzLmFkZFBvaW50KCBtYXRyaXgubXVsdGlwbHlWZWN0b3IyKCBzY3JhdGNoVmVjdG9yMi5zZXRYWSggbWluWCwgbWluWSApICkgKTtcclxuICAgIHRoaXMuYWRkUG9pbnQoIG1hdHJpeC5tdWx0aXBseVZlY3RvcjIoIHNjcmF0Y2hWZWN0b3IyLnNldFhZKCBtaW5YLCBtYXhZICkgKSApO1xyXG4gICAgdGhpcy5hZGRQb2ludCggbWF0cml4Lm11bHRpcGx5VmVjdG9yMiggc2NyYXRjaFZlY3RvcjIuc2V0WFkoIG1heFgsIG1pblkgKSApICk7XHJcbiAgICB0aGlzLmFkZFBvaW50KCBtYXRyaXgubXVsdGlwbHlWZWN0b3IyKCBzY3JhdGNoVmVjdG9yMi5zZXRYWSggbWF4WCwgbWF4WSApICkgKTtcclxuICAgIHJldHVybiAoIHRoaXMgYXMgdW5rbm93biBhcyBCb3VuZHMyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeHBhbmRzIHRoaXMgYm91bmRzIG9uIGFsbCBzaWRlcyBieSB0aGUgc3BlY2lmaWVkIGFtb3VudC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gZGlsYXRlZCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGRpbGF0ZSggZDogbnVtYmVyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuZGlsYXRlWFkoIGQsIGQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4cGFuZHMgdGhpcyBib3VuZHMgaG9yaXpvbnRhbGx5IChsZWZ0IGFuZCByaWdodCkgYnkgdGhlIHNwZWNpZmllZCBhbW91bnQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGRpbGF0ZWRYKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgZGlsYXRlWCggeDogbnVtYmVyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0TWluTWF4KCB0aGlzLm1pblggLSB4LCB0aGlzLm1pblksIHRoaXMubWF4WCArIHgsIHRoaXMubWF4WSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXhwYW5kcyB0aGlzIGJvdW5kcyB2ZXJ0aWNhbGx5ICh0b3AgYW5kIGJvdHRvbSkgYnkgdGhlIHNwZWNpZmllZCBhbW91bnQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGRpbGF0ZWRZKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgZGlsYXRlWSggeTogbnVtYmVyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0TWluTWF4KCB0aGlzLm1pblgsIHRoaXMubWluWSAtIHksIHRoaXMubWF4WCwgdGhpcy5tYXhZICsgeSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXhwYW5kcyB0aGlzIGJvdW5kcyBpbmRlcGVuZGVudGx5IGluIHRoZSBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBkaXJlY3Rpb25zLiBXaWxsIGJlIGVxdWFsIHRvIGNhbGxpbmdcclxuICAgKiBib3VuZHMuZGlsYXRlWCggeCApLmRpbGF0ZVkoIHkgKS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gZGlsYXRlZFhZKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgZGlsYXRlWFkoIHg6IG51bWJlciwgeTogbnVtYmVyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0TWluTWF4KCB0aGlzLm1pblggLSB4LCB0aGlzLm1pblkgLSB5LCB0aGlzLm1heFggKyB4LCB0aGlzLm1heFkgKyB5ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb250cmFjdHMgdGhpcyBib3VuZHMgb24gYWxsIHNpZGVzIGJ5IHRoZSBzcGVjaWZpZWQgYW1vdW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBlcm9kZWQoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBlcm9kZSggZDogbnVtYmVyICk6IEJvdW5kczIgeyByZXR1cm4gdGhpcy5kaWxhdGUoIC1kICk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udHJhY3RzIHRoaXMgYm91bmRzIGhvcml6b250YWxseSAobGVmdCBhbmQgcmlnaHQpIGJ5IHRoZSBzcGVjaWZpZWQgYW1vdW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBlcm9kZWRYKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgZXJvZGVYKCB4OiBudW1iZXIgKTogQm91bmRzMiB7IHJldHVybiB0aGlzLmRpbGF0ZVgoIC14ICk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udHJhY3RzIHRoaXMgYm91bmRzIHZlcnRpY2FsbHkgKHRvcCBhbmQgYm90dG9tKSBieSB0aGUgc3BlY2lmaWVkIGFtb3VudC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gZXJvZGVkWSgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGVyb2RlWSggeTogbnVtYmVyICk6IEJvdW5kczIgeyByZXR1cm4gdGhpcy5kaWxhdGVZKCAteSApOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnRyYWN0cyB0aGlzIGJvdW5kcyBpbmRlcGVuZGVudGx5IGluIHRoZSBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBkaXJlY3Rpb25zLiBXaWxsIGJlIGVxdWFsIHRvIGNhbGxpbmdcclxuICAgKiBib3VuZHMuZXJvZGVYKCB4ICkuZXJvZGVZKCB5ICkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGVyb2RlZFhZKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgZXJvZGVYWSggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogQm91bmRzMiB7IHJldHVybiB0aGlzLmRpbGF0ZVhZKCAteCwgLXkgKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBFeHBhbmRzIHRoaXMgYm91bmRzIGluZGVwZW5kZW50bHkgZm9yIGVhY2ggc2lkZSAob3IgaWYgc29tZSBvZmZzZXRzIGFyZSBuZWdhdGl2ZSwgd2lsbCBjb250cmFjdCB0aG9zZSBzaWRlcykuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHdpdGhPZmZzZXRzKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvXHJcbiAgICogcmV0dXJuaW5nIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBsZWZ0IC0gQW1vdW50IHRvIGV4cGFuZCB0byB0aGUgbGVmdCAoc3VidHJhY3RzIGZyb20gbWluWClcclxuICAgKiBAcGFyYW0gdG9wIC0gQW1vdW50IHRvIGV4cGFuZCB0byB0aGUgdG9wIChzdWJ0cmFjdHMgZnJvbSBtaW5ZKVxyXG4gICAqIEBwYXJhbSByaWdodCAtIEFtb3VudCB0byBleHBhbmQgdG8gdGhlIHJpZ2h0IChhZGRzIHRvIG1heFgpXHJcbiAgICogQHBhcmFtIGJvdHRvbSAtIEFtb3VudCB0byBleHBhbmQgdG8gdGhlIGJvdHRvbSAoYWRkcyB0byBtYXhZKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBvZmZzZXQoIGxlZnQ6IG51bWJlciwgdG9wOiBudW1iZXIsIHJpZ2h0OiBudW1iZXIsIGJvdHRvbTogbnVtYmVyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIGIyKCB0aGlzLm1pblggLSBsZWZ0LCB0aGlzLm1pblkgLSB0b3AsIHRoaXMubWF4WCArIHJpZ2h0LCB0aGlzLm1heFkgKyBib3R0b20gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyYW5zbGF0ZXMgb3VyIGJvdW5kcyBob3Jpem9udGFsbHkgYnkgeC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2hpZnRlZFgoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzaGlmdFgoIHg6IG51bWJlciApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLnNldE1pbk1heCggdGhpcy5taW5YICsgeCwgdGhpcy5taW5ZLCB0aGlzLm1heFggKyB4LCB0aGlzLm1heFkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyYW5zbGF0ZXMgb3VyIGJvdW5kcyB2ZXJ0aWNhbGx5IGJ5IHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHNoaWZ0ZWRZKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgc2hpZnRZKCB5OiBudW1iZXIgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRNaW5NYXgoIHRoaXMubWluWCwgdGhpcy5taW5ZICsgeSwgdGhpcy5tYXhYLCB0aGlzLm1heFkgKyB5ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmFuc2xhdGVzIG91ciBib3VuZHMgYnkgKHgseSkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHNoaWZ0ZWQoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzaGlmdFhZKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLnNldE1pbk1heCggdGhpcy5taW5YICsgeCwgdGhpcy5taW5ZICsgeSwgdGhpcy5tYXhYICsgeCwgdGhpcy5tYXhZICsgeSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJhbnNsYXRlcyBvdXIgYm91bmRzIGJ5IHRoZSBnaXZlbiB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIHNoaWZ0KCB2OiBWZWN0b3IyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2hpZnRYWSggdi54LCB2LnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHJhbmdlIG9mIHRoZSB4LXZhbHVlcyBvZiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0WFJhbmdlKCk6IFJhbmdlIHtcclxuICAgIHJldHVybiBuZXcgUmFuZ2UoIHRoaXMubWluWCwgdGhpcy5tYXhYICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB4LXJhbmdlIG9mIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRYUmFuZ2UoIHJhbmdlOiBSYW5nZSApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLnNldE1pbk1heCggcmFuZ2UubWluLCB0aGlzLm1pblksIHJhbmdlLm1heCwgdGhpcy5tYXhZICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHhSYW5nZSgpOiBSYW5nZSB7IHJldHVybiB0aGlzLmdldFhSYW5nZSgpOyB9XHJcblxyXG4gIHB1YmxpYyBzZXQgeFJhbmdlKCByYW5nZTogUmFuZ2UgKSB7IHRoaXMuc2V0WFJhbmdlKCByYW5nZSApOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHJhbmdlIG9mIHRoZSB5LXZhbHVlcyBvZiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0WVJhbmdlKCk6IFJhbmdlIHtcclxuICAgIHJldHVybiBuZXcgUmFuZ2UoIHRoaXMubWluWSwgdGhpcy5tYXhZICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB5LXJhbmdlIG9mIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRZUmFuZ2UoIHJhbmdlOiBSYW5nZSApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLnNldE1pbk1heCggdGhpcy5taW5YLCByYW5nZS5taW4sIHRoaXMubWF4WCwgcmFuZ2UubWF4ICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHlSYW5nZSgpOiBSYW5nZSB7IHJldHVybiB0aGlzLmdldFlSYW5nZSgpOyB9XHJcblxyXG4gIHB1YmxpYyBzZXQgeVJhbmdlKCByYW5nZTogUmFuZ2UgKSB7IHRoaXMuc2V0WVJhbmdlKCByYW5nZSApOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZpbmQgYSBwb2ludCBpbiB0aGUgYm91bmRzIGNsb3Nlc3QgdG8gdGhlIHNwZWNpZmllZCBwb2ludC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB4IC0gWCBjb29yZGluYXRlIG9mIHRoZSBwb2ludCB0byB0ZXN0LlxyXG4gICAqIEBwYXJhbSB5IC0gWSBjb29yZGluYXRlIG9mIHRoZSBwb2ludCB0byB0ZXN0LlxyXG4gICAqIEBwYXJhbSBbcmVzdWx0XSAtIFZlY3RvcjIgdGhhdCBjYW4gc3RvcmUgdGhlIHJldHVybiB2YWx1ZSB0byBhdm9pZCBhbGxvY2F0aW9ucy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2xvc2VzdFBvaW50KCB4OiBudW1iZXIsIHk6IG51bWJlciwgcmVzdWx0PzogVmVjdG9yMiApOiBWZWN0b3IyIHtcclxuICAgIGlmICggcmVzdWx0ICkge1xyXG4gICAgICByZXN1bHQuc2V0WFkoIHgsIHkgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXN1bHQgPSBuZXcgVmVjdG9yMiggeCwgeSApO1xyXG4gICAgfVxyXG4gICAgaWYgKCByZXN1bHQueCA8IHRoaXMubWluWCApIHsgcmVzdWx0LnggPSB0aGlzLm1pblg7IH1cclxuICAgIGlmICggcmVzdWx0LnggPiB0aGlzLm1heFggKSB7IHJlc3VsdC54ID0gdGhpcy5tYXhYOyB9XHJcbiAgICBpZiAoIHJlc3VsdC55IDwgdGhpcy5taW5ZICkgeyByZXN1bHQueSA9IHRoaXMubWluWTsgfVxyXG4gICAgaWYgKCByZXN1bHQueSA+IHRoaXMubWF4WSApIHsgcmVzdWx0LnkgPSB0aGlzLm1heFk7IH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZnJlZVRvUG9vbCgpOiB2b2lkIHtcclxuICAgIEJvdW5kczIucG9vbC5mcmVlVG9Qb29sKCB0aGlzICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IHBvb2wgPSBuZXcgUG9vbCggQm91bmRzMiwge1xyXG4gICAgbWF4U2l6ZTogMTAwMCxcclxuICAgIGluaXRpYWxpemU6IEJvdW5kczIucHJvdG90eXBlLnNldE1pbk1heCxcclxuICAgIGRlZmF1bHRBcmd1bWVudHM6IFsgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksIE51bWJlci5ORUdBVElWRV9JTkZJTklUWSwgTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZIF1cclxuICB9ICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgQm91bmRzMiBvYmplY3QsIHdpdGggdGhlIGZhbWlsaWFyIHJlY3RhbmdsZSBjb25zdHJ1Y3Rpb24gd2l0aCB4LCB5LCB3aWR0aCwgYW5kIGhlaWdodC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB4IC0gVGhlIG1pbmltdW0gdmFsdWUgb2YgWCBmb3IgdGhlIGJvdW5kcy5cclxuICAgKiBAcGFyYW0geSAtIFRoZSBtaW5pbXVtIHZhbHVlIG9mIFkgZm9yIHRoZSBib3VuZHMuXHJcbiAgICogQHBhcmFtIHdpZHRoIC0gVGhlIHdpZHRoIChtYXhYIC0gbWluWCkgb2YgdGhlIGJvdW5kcy5cclxuICAgKiBAcGFyYW0gaGVpZ2h0IC0gVGhlIGhlaWdodCAobWF4WSAtIG1pblkpIG9mIHRoZSBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByZWN0KCB4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gYjIoIHgsIHksIHggKyB3aWR0aCwgeSArIGhlaWdodCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5ldyBCb3VuZHMyIG9iamVjdCB3aXRoIGEgZ2l2ZW4gb3JpZW50YXRpb24gKG1pbi9tYXggc3BlY2lmaWVkIGZvciBib3RoIHRoZSBnaXZlbiAocHJpbWFyeSkgb3JpZW50YXRpb24sXHJcbiAgICogYW5kIGFsc28gdGhlIHNlY29uZGFyeSBvcmllbnRhdGlvbikuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBvcmllbnRlZCggb3JpZW50YXRpb246IE9yaWVudGF0aW9uLCBtaW5QcmltYXJ5OiBudW1iZXIsIG1pblNlY29uZGFyeTogbnVtYmVyLCBtYXhQcmltYXJ5OiBudW1iZXIsIG1heFNlY29uZGFyeTogbnVtYmVyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIG9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5IT1JJWk9OVEFMID8gbmV3IEJvdW5kczIoXHJcbiAgICAgIG1pblByaW1hcnksXHJcbiAgICAgIG1pblNlY29uZGFyeSxcclxuICAgICAgbWF4UHJpbWFyeSxcclxuICAgICAgbWF4U2Vjb25kYXJ5XHJcbiAgICApIDogbmV3IEJvdW5kczIoXHJcbiAgICAgIG1pblNlY29uZGFyeSxcclxuICAgICAgbWluUHJpbWFyeSxcclxuICAgICAgbWF4U2Vjb25kYXJ5LFxyXG4gICAgICBtYXhQcmltYXJ5XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5ldyBCb3VuZHMyIG9iamVjdCB0aGF0IG9ubHkgY29udGFpbnMgdGhlIHNwZWNpZmllZCBwb2ludCAoeCx5KS4gVXNlZnVsIGZvciBiZWluZyBkaWxhdGVkIHRvIGZvcm0gYVxyXG4gICAqIGJvdW5kaW5nIGJveCBhcm91bmQgYSBwb2ludC4gTm90ZSB0aGF0IHRoZSBib3VuZHMgd2lsbCBub3QgYmUgXCJlbXB0eVwiIGFzIGl0IGNvbnRhaW5zICh4LHkpLCBidXQgaXQgd2lsbCBoYXZlXHJcbiAgICogemVybyBhcmVhLiBUaGUgeCBhbmQgeSBjb29yZGluYXRlcyBjYW4gYmUgc3BlY2lmaWVkIGJ5IG51bWJlcnMgb3Igd2l0aCBhdCBWZWN0b3IyXHJcbiAgICpcclxuICAgKiBAcGFyYW0geFxyXG4gICAqIEBwYXJhbSB5XHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBwb2ludCggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogQm91bmRzMjtcclxuICBzdGF0aWMgcG9pbnQoIHY6IFZlY3RvcjIgKTogQm91bmRzMjsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHlcclxuICBzdGF0aWMgcG9pbnQoIHg6IFZlY3RvcjIgfCBudW1iZXIsIHk/OiBudW1iZXIgKTogQm91bmRzMiB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1lbWJlci1hY2Nlc3NpYmlsaXR5XHJcbiAgICBpZiAoIHggaW5zdGFuY2VvZiBWZWN0b3IyICkge1xyXG4gICAgICBjb25zdCBwID0geDtcclxuICAgICAgcmV0dXJuIGIyKCBwLngsIHAueSwgcC54LCBwLnkgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gYjIoIHgsIHkhLCB4LCB5ISApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gSGVscHMgdG8gaWRlbnRpZnkgdGhlIGRpbWVuc2lvbiBvZiB0aGUgYm91bmRzXHJcbiAgcHVibGljIGlzQm91bmRzITogYm9vbGVhbjtcclxuICBwdWJsaWMgZGltZW5zaW9uPzogbnVtYmVyO1xyXG5cclxuICAvKipcclxuICAgKiBBIGNvbnN0YW50IEJvdW5kczIgd2l0aCBtaW5pbXVtcyA9ICRcXGluZnR5JCwgbWF4aW11bXMgPSAkLVxcaW5mdHkkLCBzbyB0aGF0IGl0IHJlcHJlc2VudHMgXCJubyBib3VuZHMgd2hhdHNvZXZlclwiLlxyXG4gICAqXHJcbiAgICogVGhpcyBhbGxvd3MgdXMgdG8gdGFrZSB0aGUgdW5pb24gKHVuaW9uL2luY2x1ZGVCb3VuZHMpIG9mIHRoaXMgYW5kIGFueSBvdGhlciBCb3VuZHMyIHRvIGdldCB0aGUgb3RoZXIgYm91bmRzIGJhY2ssXHJcbiAgICogZS5nLiBCb3VuZHMyLk5PVEhJTkcudW5pb24oIGJvdW5kcyApLmVxdWFscyggYm91bmRzICkuIFRoaXMgb2JqZWN0IG5hdHVyYWxseSBzZXJ2ZXMgYXMgdGhlIGJhc2UgY2FzZSBhcyBhIHVuaW9uIG9mXHJcbiAgICogemVybyBib3VuZHMgb2JqZWN0cy5cclxuICAgKlxyXG4gICAqIEFkZGl0aW9uYWxseSwgaW50ZXJzZWN0aW9ucyB3aXRoIE5PVEhJTkcgd2lsbCBhbHdheXMgcmV0dXJuIGEgQm91bmRzMiBlcXVpdmFsZW50IHRvIE5PVEhJTkcuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBOT1RISU5HID0gbmV3IEJvdW5kczIoIE51bWJlci5QT1NJVElWRV9JTkZJTklUWSwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLCBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksIE51bWJlci5ORUdBVElWRV9JTkZJTklUWSApO1xyXG5cclxuICAvKipcclxuICAgKiBBIGNvbnN0YW50IEJvdW5kczIgd2l0aCBtaW5pbXVtcyA9ICQtXFxpbmZ0eSQsIG1heGltdW1zID0gJFxcaW5mdHkkLCBzbyB0aGF0IGl0IHJlcHJlc2VudHMgXCJhbGwgYm91bmRzXCIuXHJcbiAgICpcclxuICAgKiBUaGlzIGFsbG93cyB1cyB0byB0YWtlIHRoZSBpbnRlcnNlY3Rpb24gKGludGVyc2VjdGlvbi9jb25zdHJhaW5Cb3VuZHMpIG9mIHRoaXMgYW5kIGFueSBvdGhlciBCb3VuZHMyIHRvIGdldCB0aGVcclxuICAgKiBvdGhlciBib3VuZHMgYmFjaywgZS5nLiBCb3VuZHMyLkVWRVJZVEhJTkcuaW50ZXJzZWN0aW9uKCBib3VuZHMgKS5lcXVhbHMoIGJvdW5kcyApLiBUaGlzIG9iamVjdCBuYXR1cmFsbHkgc2VydmVzIGFzXHJcbiAgICogdGhlIGJhc2UgY2FzZSBhcyBhbiBpbnRlcnNlY3Rpb24gb2YgemVybyBib3VuZHMgb2JqZWN0cy5cclxuICAgKlxyXG4gICAqIEFkZGl0aW9uYWxseSwgdW5pb25zIHdpdGggRVZFUllUSElORyB3aWxsIGFsd2F5cyByZXR1cm4gYSBCb3VuZHMyIGVxdWl2YWxlbnQgdG8gRVZFUllUSElORy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IEVWRVJZVEhJTkcgPSBuZXcgQm91bmRzMiggTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLCBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksIE51bWJlci5QT1NJVElWRV9JTkZJTklUWSwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZICk7XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQm91bmRzMklPID0gbmV3IElPVHlwZSggJ0JvdW5kczJJTycsIHtcclxuICAgIHZhbHVlVHlwZTogQm91bmRzMixcclxuICAgIGRvY3VtZW50YXRpb246ICdhIDItZGltZW5zaW9uYWwgYm91bmRzIHJlY3RhbmdsZScsXHJcbiAgICB0b1N0YXRlT2JqZWN0OiAoIGJvdW5kczI6IEJvdW5kczIgKSA9PiAoIHsgbWluWDogYm91bmRzMi5taW5YLCBtaW5ZOiBib3VuZHMyLm1pblksIG1heFg6IGJvdW5kczIubWF4WCwgbWF4WTogYm91bmRzMi5tYXhZIH0gKSxcclxuICAgIGZyb21TdGF0ZU9iamVjdDogKCBzdGF0ZU9iamVjdDogQm91bmRzMlN0YXRlT2JqZWN0ICkgPT4ge1xyXG4gICAgICByZXR1cm4gbmV3IEJvdW5kczIoXHJcbiAgICAgICAgSW5maW5pdGVOdW1iZXJJTy5mcm9tU3RhdGVPYmplY3QoIHN0YXRlT2JqZWN0Lm1pblggKSxcclxuICAgICAgICBJbmZpbml0ZU51bWJlcklPLmZyb21TdGF0ZU9iamVjdCggc3RhdGVPYmplY3QubWluWSApLFxyXG4gICAgICAgIEluZmluaXRlTnVtYmVySU8uZnJvbVN0YXRlT2JqZWN0KCBzdGF0ZU9iamVjdC5tYXhYICksXHJcbiAgICAgICAgSW5maW5pdGVOdW1iZXJJTy5mcm9tU3RhdGVPYmplY3QoIHN0YXRlT2JqZWN0Lm1heFkgKVxyXG4gICAgICApO1xyXG4gICAgfSxcclxuICAgIHN0YXRlU2NoZW1hOiB7XHJcbiAgICAgIG1pblg6IEluZmluaXRlTnVtYmVySU8sXHJcbiAgICAgIG1heFg6IEluZmluaXRlTnVtYmVySU8sXHJcbiAgICAgIG1pblk6IEluZmluaXRlTnVtYmVySU8sXHJcbiAgICAgIG1heFk6IEluZmluaXRlTnVtYmVySU9cclxuICAgIH1cclxuICB9ICk7XHJcbn1cclxuXHJcbmRvdC5yZWdpc3RlciggJ0JvdW5kczInLCBCb3VuZHMyICk7XHJcblxyXG5jb25zdCBiMiA9IEJvdW5kczIucG9vbC5jcmVhdGUuYmluZCggQm91bmRzMi5wb29sICk7XHJcbmRvdC5yZWdpc3RlciggJ2IyJywgYjIgKTtcclxuXHJcbkJvdW5kczIucHJvdG90eXBlLmlzQm91bmRzID0gdHJ1ZTtcclxuQm91bmRzMi5wcm90b3R5cGUuZGltZW5zaW9uID0gMjtcclxuXHJcbmZ1bmN0aW9uIGNhdGNoSW1tdXRhYmxlU2V0dGVyTG93SGFuZ2luZ0ZydWl0KCBib3VuZHM6IEJvdW5kczIgKTogdm9pZCB7XHJcbiAgYm91bmRzLnNldE1pbk1heCA9ICgpID0+IHsgdGhyb3cgbmV3IEVycm9yKCAnQXR0ZW1wdCB0byBzZXQgXCJzZXRNaW5NYXhcIiBvZiBhbiBpbW11dGFibGUgQm91bmRzMiBvYmplY3QnICk7IH07XHJcbiAgYm91bmRzLnNldCA9ICgpID0+IHsgdGhyb3cgbmV3IEVycm9yKCAnQXR0ZW1wdCB0byBzZXQgXCJzZXRcIiBvZiBhbiBpbW11dGFibGUgQm91bmRzMiBvYmplY3QnICk7IH07XHJcbiAgYm91bmRzLmluY2x1ZGVCb3VuZHMgPSAoKSA9PiB7IHRocm93IG5ldyBFcnJvciggJ0F0dGVtcHQgdG8gc2V0IFwiaW5jbHVkZUJvdW5kc1wiIG9mIGFuIGltbXV0YWJsZSBCb3VuZHMyIG9iamVjdCcgKTsgfTtcclxuICBib3VuZHMuY29uc3RyYWluQm91bmRzID0gKCkgPT4geyB0aHJvdyBuZXcgRXJyb3IoICdBdHRlbXB0IHRvIHNldCBcImNvbnN0cmFpbkJvdW5kc1wiIG9mIGFuIGltbXV0YWJsZSBCb3VuZHMyIG9iamVjdCcgKTsgfTtcclxuICBib3VuZHMuYWRkQ29vcmRpbmF0ZXMgPSAoKSA9PiB7IHRocm93IG5ldyBFcnJvciggJ0F0dGVtcHQgdG8gc2V0IFwiYWRkQ29vcmRpbmF0ZXNcIiBvZiBhbiBpbW11dGFibGUgQm91bmRzMiBvYmplY3QnICk7IH07XHJcbiAgYm91bmRzLnRyYW5zZm9ybSA9ICgpID0+IHsgdGhyb3cgbmV3IEVycm9yKCAnQXR0ZW1wdCB0byBzZXQgXCJ0cmFuc2Zvcm1cIiBvZiBhbiBpbW11dGFibGUgQm91bmRzMiBvYmplY3QnICk7IH07XHJcbn1cclxuXHJcbmlmICggYXNzZXJ0ICkge1xyXG4gIGNhdGNoSW1tdXRhYmxlU2V0dGVyTG93SGFuZ2luZ0ZydWl0KCBCb3VuZHMyLkVWRVJZVEhJTkcgKTtcclxuICBjYXRjaEltbXV0YWJsZVNldHRlckxvd0hhbmdpbmdGcnVpdCggQm91bmRz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QUNYM0wsSUFBSSxFQUFFVCxnQkFBZ0I7TUFDdEJXLElBQUksRUFBRVgsZ0JBQWdCO01BQ3RCVSxJQUFJLEVBQUVWLGdCQUFnQjtNQUN0QlksSUFBSSxFQUFFWjtJQUNSO0VBQ0YsQ0FBRSxDQUFDO0FBQ0w7QUFFQUUsR0FBRyxDQUFDbU0sUUFBUSxDQUFFLFNBQVMsRUFBRTlMLE9BQVEsQ0FBQztBQUVsQyxNQUFNdUYsRUFBRSxHQUFHdkYsT0FBTyxDQUFDb0ssSUFBSSxDQUFDNUUsTUFBTSxDQUFDdUcsSUFBSSxDQUFFL0wsT0FBTyxDQUFDb0ssSUFBSyxDQUFDO0FBQ25EekssR0FBRyxDQUFDbU0sUUFBUSxDQUFFLElBQUksRUFBRXZHLEVBQUcsQ0FBQztBQUV4QnZGLE9BQU8sQ0FBQ3VLLFNBQVMsQ0FBQ3lCLFFBQVEsR0FBRyxJQUFJO0FBQ2pDaE0sT0FBTyxDQUFDdUssU0FBUyxDQUFDMEIsU0FBUyxHQUFHLENBQUM7QUFFL0IsU0FBU0MsbUNBQW1DQSxDQUFFN0gsTUFBZSxFQUFTO0VBQ3BFQSxNQUFNLENBQUN5RCxTQUFTLEdBQUcsTUFBTTtJQUFFLE1BQU0sSUFBSXFFLEtBQUssQ0FBRSwyREFBNEQsQ0FBQztFQUFFLENBQUM7RUFDNUc5SCxNQUFNLENBQUNpQixHQUFHLEdBQUcsTUFBTTtJQUFFLE1BQU0sSUFBSTZHLEtBQUssQ0FBRSxxREFBc0QsQ0FBQztFQUFFLENBQUM7RUFDaEc5SCxNQUFNLENBQUM4RCxhQUFhLEdBQUcsTUFBTTtJQUFFLE1BQU0sSUFBSWdFLEtBQUssQ0FBRSwrREFBZ0UsQ0FBQztFQUFFLENBQUM7RUFDcEg5SCxNQUFNLENBQUMrRCxlQUFlLEdBQUcsTUFBTTtJQUFFLE1BQU0sSUFBSStELEtBQUssQ0FBRSxpRUFBa0UsQ0FBQztFQUFFLENBQUM7RUFDeEg5SCxNQUFNLENBQUNnRSxjQUFjLEdBQUcsTUFBTTtJQUFFLE1BQU0sSUFBSThELEtBQUssQ0FBRSxnRUFBaUUsQ0FBQztFQUFFLENBQUM7RUFDdEg5SCxNQUFNLENBQUNzQyxTQUFTLEdBQUcsTUFBTTtJQUFFLE1BQU0sSUFBSXdGLEtBQUssQ0FBRSwyREFBNEQsQ0FBQztFQUFFLENBQUM7QUFDOUc7QUFFQSxJQUFLN0wsTUFBTSxFQUFHO0VBQ1o0TCxtQ0FBbUMsQ0FBRWxNLE9BQU8sQ0FBQ3FMLFVBQVcsQ0FBQztFQUN6RGEsbUNBQW1DLENBQUVsTSxPQUFPLENBQUMwSSxPQUFRLENBQUM7QUFDeEQiLCJpZ25vcmVMaXN0IjpbXX0=