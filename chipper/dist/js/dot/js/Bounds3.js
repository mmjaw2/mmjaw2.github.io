// Copyright 2013-2024, University of Colorado Boulder

/**
 * A 3D cuboid-shaped bounded area (bounding box).
 *
 * There are a number of convenience functions to get locations and points on the Bounds. Currently we do not
 * store these with the Bounds3 instance, since we want to lower the memory footprint.
 *
 * minX, minY, minZ, maxX, maxY, and maxZ are actually stored. We don't do x,y,z,width,height,depth because this can't properly express
 * semi-infinite bounds (like a half-plane), or easily handle what Bounds3.NOTHING and Bounds3.EVERYTHING do with
 * the constructive solid areas.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Poolable from '../../phet-core/js/Poolable.js';
import IOType from '../../tandem/js/types/IOType.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import dot from './dot.js';
import Vector3 from './Vector3.js';
class Bounds3 {
  /**
   * Creates a 3-dimensional bounds (bounding box).
   *
   * @param minX - The initial minimum X coordinate of the bounds.
   * @param minY - The initial minimum Y coordinate of the bounds.
   * @param minZ - The initial minimum Z coordinate of the bounds.
   * @param maxX - The initial maximum X coordinate of the bounds.
   * @param maxY - The initial maximum Y coordinate of the bounds.
   * @param maxZ - The initial maximum Z coordinate of the bounds.
   */
  constructor(minX, minY, minZ, maxX, maxY, maxZ) {
    this.minX = minX;
    this.minY = minY;
    this.minZ = minZ;
    this.maxX = maxX;
    this.maxY = maxY;
    this.maxZ = maxZ;
    assert && assert(maxY !== undefined, 'Bounds3 requires 4 parameters');
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

  /**
   * The depth of the bounds, defined as maxZ - minZ.
   */
  getDepth() {
    return this.maxZ - this.minZ;
  }
  get depth() {
    return this.getDepth();
  }

  /*
   * Convenience locations
   * upper is in terms of the visual layout in Scenery and other programs, so the minY is the "upper", and minY is the "lower"
   *
   *             minX (x)     centerX        maxX
   *          ---------------------------------------
   * minY (y) | upperLeft   upperCenter   upperRight
   * centerY  | centerLeft    center      centerRight
   * maxY     | lowerLeft   lowerCenter   lowerRight
   */

  /**
   * Alias for minX, when thinking of the bounds as an (x,y,z,width,height,depth) cuboid.
   */
  getX() {
    return this.minX;
  }
  get x() {
    return this.getX();
  }

  /**
   * Alias for minY, when thinking of the bounds as an (x,y,z,width,height,depth) cuboid.
   */
  getY() {
    return this.minY;
  }
  get y() {
    return this.getY();
  }

  /**
   * Alias for minZ, when thinking of the bounds as an (x,y,z,width,height,depth) cuboid.
   */
  getZ() {
    return this.minZ;
  }
  get z() {
    return this.getZ();
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
   * Alias for minZ, supporting the explicit getter function style.
   */
  getMinZ() {
    return this.minZ;
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
   * Alias for maxZ, supporting the explicit getter function style.
   */
  getMaxZ() {
    return this.maxZ;
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
   * Alias for minZ, when thinking in the UI-layout manner.
   */
  getBack() {
    return this.minZ;
  }
  get back() {
    return this.minZ;
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
   * Alias for maxZ, when thinking in the UI-layout manner.
   */
  getFront() {
    return this.maxZ;
  }
  get front() {
    return this.maxZ;
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
   * The depthwise (Z-coordinate) center of the bounds, averaging the minZ and maxZ.
   */
  getCenterZ() {
    return (this.maxZ + this.minZ) / 2;
  }
  get centerZ() {
    return this.getCenterZ();
  }

  /**
   * The point (centerX, centerY, centerZ), in the center of the bounds.
   */
  getCenter() {
    return new Vector3(this.getCenterX(), this.getCenterY(), this.getCenterZ());
  }
  get center() {
    return this.getCenter();
  }

  /**
   * Whether we have negative width, height or depth. Bounds3.NOTHING is a prime example of an empty Bounds3.
   * Bounds with width = height = depth = 0 are considered not empty, since they include the single (0,0,0) point.
   */
  isEmpty() {
    return this.getWidth() < 0 || this.getHeight() < 0 || this.getDepth() < 0;
  }

  /**
   * Whether our minimums and maximums are all finite numbers. This will exclude Bounds3.NOTHING and Bounds3.EVERYTHING.
   */
  isFinite() {
    return isFinite(this.minX) && isFinite(this.minY) && isFinite(this.minZ) && isFinite(this.maxX) && isFinite(this.maxY) && isFinite(this.maxZ);
  }

  /**
   * Whether this bounds has a non-zero area (non-zero positive width, height and depth).
   */
  hasNonzeroArea() {
    return this.getWidth() > 0 && this.getHeight() > 0 && this.getDepth() > 0;
  }

  /**
   * Whether this bounds has a finite and non-negative width, height and depth.
   */
  isValid() {
    return !this.isEmpty() && this.isFinite();
  }

  /**
   * Whether the coordinates are contained inside the bounding box, or are on the boundary.
   *
   * @param x - X coordinate of the point to check
   * @param y - Y coordinate of the point to check
   * @param z - Z coordinate of the point to check
   */
  containsCoordinates(x, y, z) {
    return this.minX <= x && x <= this.maxX && this.minY <= y && y <= this.maxY && this.minZ <= z && z <= this.maxZ;
  }

  /**
   * Whether the point is contained inside the bounding box, or is on the boundary.
   */
  containsPoint(point) {
    return this.containsCoordinates(point.x, point.y, point.z);
  }

  /**
   * Whether this bounding box completely contains the bounding box passed as a parameter. The boundary of a box is
   * considered to be "contained".
   */
  containsBounds(bounds) {
    return this.minX <= bounds.minX && this.maxX >= bounds.maxX && this.minY <= bounds.minY && this.maxY >= bounds.maxY && this.minZ <= bounds.minZ && this.maxZ >= bounds.maxZ;
  }

  /**
   * Whether this and another bounding box have any points of intersection (including touching boundaries).
   */
  intersectsBounds(bounds) {
    // TODO: more efficient way of doing this? https://github.com/phetsims/dot/issues/96
    return !this.intersection(bounds).isEmpty();
  }

  /**
   * Debugging string for the bounds.
   */
  toString() {
    return `[x:(${this.minX},${this.maxX}),y:(${this.minY},${this.maxY}),z:(${this.minZ},${this.maxZ})]`;
  }

  /**
   * Exact equality comparison between this bounds and another bounds.
   */
  equals(other) {
    return this.minX === other.minX && this.minY === other.minY && this.minZ === other.minZ && this.maxX === other.maxX && this.maxY === other.maxY && this.maxZ === other.maxZ;
  }

  /**
   * Approximate equality comparison between this bounds and another bounds.
   * @returns - Whether difference between the two bounds has no min/max with an absolute value greater than epsilon.
   */
  equalsEpsilon(other, epsilon) {
    epsilon = epsilon !== undefined ? epsilon : 0;
    const thisFinite = this.isFinite();
    const otherFinite = other.isFinite();
    if (thisFinite && otherFinite) {
      // both are finite, so we can use Math.abs() - it would fail with non-finite values like Infinity
      return Math.abs(this.minX - other.minX) < epsilon && Math.abs(this.minY - other.minY) < epsilon && Math.abs(this.minZ - other.minZ) < epsilon && Math.abs(this.maxX - other.maxX) < epsilon && Math.abs(this.maxY - other.maxY) < epsilon && Math.abs(this.maxZ - other.maxZ) < epsilon;
    } else if (thisFinite !== otherFinite) {
      return false; // one is finite, the other is not. definitely not equal
    } else if (this === other) {
      return true; // exact same instance, must be equal
    } else {
      // epsilon only applies on finite dimensions. due to JS's handling of isFinite(), it's faster to check the sum of both
      return (isFinite(this.minX + other.minX) ? Math.abs(this.minX - other.minX) < epsilon : this.minX === other.minX) && (isFinite(this.minY + other.minY) ? Math.abs(this.minY - other.minY) < epsilon : this.minY === other.minY) && (isFinite(this.minZ + other.minZ) ? Math.abs(this.minZ - other.minZ) < epsilon : this.minZ === other.minZ) && (isFinite(this.maxX + other.maxX) ? Math.abs(this.maxX - other.maxX) < epsilon : this.maxX === other.maxX) && (isFinite(this.maxY + other.maxY) ? Math.abs(this.maxY - other.maxY) < epsilon : this.maxY === other.maxY) && (isFinite(this.maxZ + other.maxZ) ? Math.abs(this.maxZ - other.maxZ) < epsilon : this.maxZ === other.maxZ);
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
   * @param bounds - If not provided, creates a new Bounds3 with filled in values. Otherwise, fills in the
   *                             values of the provided bounds so that it equals this bounds.
   */
  copy(bounds) {
    if (bounds) {
      return bounds.set(this);
    } else {
      return new Bounds3(this.minX, this.minY, this.minZ, this.maxX, this.maxY, this.maxZ);
    }
  }

  /**
   * The smallest bounds that contains both this bounds and the input bounds, returned as a copy.
   *
   * This is the immutable form of the function includeBounds(). This will return a new bounds, and will not modify
   * this bounds.
   */
  union(bounds) {
    return new Bounds3(Math.min(this.minX, bounds.minX), Math.min(this.minY, bounds.minY), Math.min(this.minZ, bounds.minZ), Math.max(this.maxX, bounds.maxX), Math.max(this.maxY, bounds.maxY), Math.max(this.maxZ, bounds.maxZ));
  }

  /**
   * The smallest bounds that is contained by both this bounds and the input bounds, returned as a copy.
   *
   * This is the immutable form of the function constrainBounds(). This will return a new bounds, and will not modify
   * this bounds.
   */
  intersection(bounds) {
    return new Bounds3(Math.max(this.minX, bounds.minX), Math.max(this.minY, bounds.minY), Math.max(this.minZ, bounds.minZ), Math.min(this.maxX, bounds.maxX), Math.min(this.maxY, bounds.maxY), Math.min(this.maxZ, bounds.maxZ));
  }

  // TODO: difference should be well-defined, but more logic is needed to compute https://github.com/phetsims/dot/issues/96

  /**
   * The smallest bounds that contains this bounds and the point (x,y,z), returned as a copy.
   *
   * This is the immutable form of the function addCoordinates(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withCoordinates(x, y, z) {
    return new Bounds3(Math.min(this.minX, x), Math.min(this.minY, y), Math.min(this.minZ, z), Math.max(this.maxX, x), Math.max(this.maxY, y), Math.max(this.maxZ, z));
  }

  /**
   * The smallest bounds that contains this bounds and the input point, returned as a copy.
   *
   * This is the immutable form of the function addPoint(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withPoint(point) {
    return this.withCoordinates(point.x, point.y, point.z);
  }

  /**
   * A copy of this bounds, with minX replaced with the input.
   *
   * This is the immutable form of the function setMinX(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withMinX(minX) {
    return new Bounds3(minX, this.minY, this.minZ, this.maxX, this.maxY, this.maxZ);
  }

  /**
   * A copy of this bounds, with minY replaced with the input.
   *
   * This is the immutable form of the function setMinY(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withMinY(minY) {
    return new Bounds3(this.minX, minY, this.minZ, this.maxX, this.maxY, this.maxZ);
  }

  /**
   * A copy of this bounds, with minZ replaced with the input.
   *
   * This is the immutable form of the function setMinZ(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withMinZ(minZ) {
    return new Bounds3(this.minX, this.minY, minZ, this.maxX, this.maxY, this.maxZ);
  }

  /**
   * A copy of this bounds, with maxX replaced with the input.
   *
   * This is the immutable form of the function setMaxX(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withMaxX(maxX) {
    return new Bounds3(this.minX, this.minY, this.minZ, maxX, this.maxY, this.maxZ);
  }

  /**
   * A copy of this bounds, with maxY replaced with the input.
   *
   * This is the immutable form of the function setMaxY(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withMaxY(maxY) {
    return new Bounds3(this.minX, this.minY, this.minZ, this.maxX, maxY, this.maxZ);
  }

  /**
   * A copy of this bounds, with maxZ replaced with the input.
   *
   * This is the immutable form of the function setMaxZ(). This will return a new bounds, and will not modify
   * this bounds.
   */
  withMaxZ(maxZ) {
    return new Bounds3(this.minX, this.minY, this.minZ, this.maxX, this.maxY, maxZ);
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
    return new Bounds3(Math.floor(this.minX), Math.floor(this.minY), Math.floor(this.minZ), Math.ceil(this.maxX), Math.ceil(this.maxY), Math.ceil(this.maxZ));
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
    return new Bounds3(Math.ceil(this.minX), Math.ceil(this.minY), Math.ceil(this.minZ), Math.floor(this.maxX), Math.floor(this.maxY), Math.floor(this.maxZ));
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
   * // TODO: Should be Matrix4 type, https://github.com/phetsims/dot/issues/125
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
    return this.dilatedXYZ(d, d, d);
  }

  /**
   * A bounding box that is expanded horizontally (on the left and right) by the specified amount.
   *
   * This is the immutable form of the function dilateX(). This will return a new bounds, and will not modify
   * this bounds.
   */
  dilatedX(x) {
    return new Bounds3(this.minX - x, this.minY, this.minZ, this.maxX + x, this.maxY, this.maxZ);
  }

  /**
   * A bounding box that is expanded vertically (on the top and bottom) by the specified amount.
   *
   * This is the immutable form of the function dilateY(). This will return a new bounds, and will not modify
   * this bounds.
   */
  dilatedY(y) {
    return new Bounds3(this.minX, this.minY - y, this.minZ, this.maxX, this.maxY + y, this.maxZ);
  }

  /**
   * A bounding box that is expanded depth-wise (on the front and back) by the specified amount.
   *
   * This is the immutable form of the function dilateZ(). This will return a new bounds, and will not modify
   * this bounds.
   */
  dilatedZ(z) {
    return new Bounds3(this.minX, this.minY, this.minZ - z, this.maxX, this.maxY, this.maxZ + z);
  }

  /**
   * A bounding box that is expanded on all sides, with different amounts of expansion along each axis.
   * Will be identical to the bounds returned by calling bounds.dilatedX( x ).dilatedY( y ).dilatedZ( z ).
   *
   * This is the immutable form of the function dilateXYZ(). This will return a new bounds, and will not modify
   * this bounds.
   * @param x - Amount to dilate horizontally (for each side)
   * @param y - Amount to dilate vertically (for each side)
   * @param z - Amount to dilate depth-wise (for each side)
   */
  dilatedXYZ(x, y, z) {
    return new Bounds3(this.minX - x, this.minY - y, this.minZ - z, this.maxX + x, this.maxY + y, this.maxZ + z);
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
   * A bounding box that is contracted depth-wise (on the front and back) by the specified amount.
   *
   * This is the immutable form of the function erodeZ(). This will return a new bounds, and will not modify
   * this bounds.
   */
  erodedZ(z) {
    return this.dilatedZ(-z);
  }

  /**
   * A bounding box that is contracted on all sides, with different amounts of contraction along each axis.
   *
   * This is the immutable form of the function erodeXYZ(). This will return a new bounds, and will not modify
   * this bounds.
   * @param x - Amount to erode horizontally (for each side)
   * @param y - Amount to erode vertically (for each side)
   * @param z - Amount to erode depth-wise (for each side)
   */
  erodedXYZ(x, y, z) {
    return this.dilatedXYZ(-x, -y, -z);
  }

  /**
   * Our bounds, translated horizontally by x, returned as a copy.
   *
   * This is the immutable form of the function shiftX(). This will return a new bounds, and will not modify
   * this bounds.
   */
  shiftedX(x) {
    return new Bounds3(this.minX + x, this.minY, this.minZ, this.maxX + x, this.maxY, this.maxZ);
  }

  /**
   * Our bounds, translated vertically by y, returned as a copy.
   *
   * This is the immutable form of the function shiftY(). This will return a new bounds, and will not modify
   * this bounds.
   */
  shiftedY(y) {
    return new Bounds3(this.minX, this.minY + y, this.minZ, this.maxX, this.maxY + y, this.maxZ);
  }

  /**
   * Our bounds, translated depth-wise by z, returned as a copy.
   *
   * This is the immutable form of the function shiftZ(). This will return a new bounds, and will not modify
   * this bounds.
   */
  shiftedZ(z) {
    return new Bounds3(this.minX, this.minY, this.minZ + z, this.maxX, this.maxY, this.maxZ + z);
  }

  /**
   * Our bounds, translated by (x,y,z), returned as a copy.
   *
   * This is the immutable form of the function shift(). This will return a new bounds, and will not modify
   * this bounds.
   */
  shiftedXYZ(x, y, z) {
    return new Bounds3(this.minX + x, this.minY + y, this.minZ + z, this.maxX + x, this.maxY + y, this.maxZ + z);
  }

  /**
   * Returns our bounds, translated by a vector, returned as a copy.
   */
  shifted(v) {
    return this.shiftedXYZ(v.x, v.y, v.z);
  }

  /*---------------------------------------------------------------------------*
   * Mutable operations
   *
   * All mutable operations should call one of the following:
   *   setMinMax, setMinX, setMinY, setMinZ, setMaxX, setMaxY, setMaxZ
   *---------------------------------------------------------------------------*/

  /**
   * Sets each value for this bounds, and returns itself.
   */
  setMinMax(minX, minY, minZ, maxX, maxY, maxZ) {
    this.minX = minX;
    this.minY = minY;
    this.minZ = minZ;
    this.maxX = maxX;
    this.maxY = maxY;
    this.maxZ = maxZ;
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
   * Sets the value of minZ.
   *
   * This is the mutable form of the function withMinZ(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  setMinZ(minZ) {
    this.minZ = minZ;
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
   * Sets the value of maxZ.
   *
   * This is the mutable form of the function withMaxZ(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  setMaxZ(maxZ) {
    this.maxZ = maxZ;
    return this;
  }

  /**
   * Sets the values of this bounds to be equal to the input bounds.
   *
   * This is the mutable form of the function copy(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  set(bounds) {
    return this.setMinMax(bounds.minX, bounds.minY, bounds.minZ, bounds.maxX, bounds.maxY, bounds.maxZ);
  }

  /**
   * Modifies this bounds so that it contains both its original bounds and the input bounds.
   *
   * This is the mutable form of the function union(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  includeBounds(bounds) {
    return this.setMinMax(Math.min(this.minX, bounds.minX), Math.min(this.minY, bounds.minY), Math.min(this.minZ, bounds.minZ), Math.max(this.maxX, bounds.maxX), Math.max(this.maxY, bounds.maxY), Math.max(this.maxZ, bounds.maxZ));
  }

  /**
   * Modifies this bounds so that it is the largest bounds contained both in its original bounds and in the input bounds.
   *
   * This is the mutable form of the function intersection(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  constrainBounds(bounds) {
    return this.setMinMax(Math.max(this.minX, bounds.minX), Math.max(this.minY, bounds.minY), Math.max(this.minZ, bounds.minZ), Math.min(this.maxX, bounds.maxX), Math.min(this.maxY, bounds.maxY), Math.min(this.maxZ, bounds.maxZ));
  }

  /**
   * Modifies this bounds so that it contains both its original bounds and the input point (x,y,z).
   *
   * This is the mutable form of the function withCoordinates(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  addCoordinates(x, y, z) {
    return this.setMinMax(Math.min(this.minX, x), Math.min(this.minY, y), Math.min(this.minZ, z), Math.max(this.maxX, x), Math.max(this.maxY, y), Math.max(this.maxZ, z));
  }

  /**
   * Modifies this bounds so that it contains both its original bounds and the input point.
   *
   * This is the mutable form of the function withPoint(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  addPoint(point) {
    return this.addCoordinates(point.x, point.y, point.z);
  }

  /**
   * Modifies this bounds so that its boundaries are integer-aligned, rounding the minimum boundaries down and the
   * maximum boundaries up (expanding as necessary).
   *
   * This is the mutable form of the function roundedOut(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  roundOut() {
    return this.setMinMax(Math.floor(this.minX), Math.floor(this.minY), Math.floor(this.minZ), Math.ceil(this.maxX), Math.ceil(this.maxY), Math.ceil(this.maxZ));
  }

  /**
   * Modifies this bounds so that its boundaries are integer-aligned, rounding the minimum boundaries up and the
   * maximum boundaries down (contracting as necessary).
   *
   * This is the mutable form of the function roundedIn(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  roundIn() {
    return this.setMinMax(Math.ceil(this.minX), Math.ceil(this.minY), Math.ceil(this.minZ), Math.floor(this.maxX), Math.floor(this.maxY), Math.floor(this.maxZ));
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
   * // TODO: should be Matrix4 type, https://github.com/phetsims/dot/issues/125
   */
  transform(matrix) {
    // do nothing
    if (this.isEmpty()) {
      return this;
    }

    // optimization to bail for identity matrices
    if (matrix.isIdentity()) {
      return this;
    }
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;

    // using mutable vector so we don't create excessive instances of Vector2 during this
    // make sure all 4 corners are inside this transformed bounding box
    const vector = new Vector3(0, 0, 0);
    function withIt(vector) {
      minX = Math.min(minX, vector.x);
      minY = Math.min(minY, vector.y);
      minZ = Math.min(minZ, vector.z);
      maxX = Math.max(maxX, vector.x);
      maxY = Math.max(maxY, vector.y);
      maxZ = Math.max(maxZ, vector.z);
    }
    withIt(matrix.multiplyVector3(vector.setXYZ(this.minX, this.minY, this.minZ)));
    withIt(matrix.multiplyVector3(vector.setXYZ(this.minX, this.maxY, this.minZ)));
    withIt(matrix.multiplyVector3(vector.setXYZ(this.maxX, this.minY, this.minZ)));
    withIt(matrix.multiplyVector3(vector.setXYZ(this.maxX, this.maxY, this.minZ)));
    withIt(matrix.multiplyVector3(vector.setXYZ(this.minX, this.minY, this.maxZ)));
    withIt(matrix.multiplyVector3(vector.setXYZ(this.minX, this.maxY, this.maxZ)));
    withIt(matrix.multiplyVector3(vector.setXYZ(this.maxX, this.minY, this.maxZ)));
    withIt(matrix.multiplyVector3(vector.setXYZ(this.maxX, this.maxY, this.maxZ)));
    return this.setMinMax(minX, minY, minZ, maxX, maxY, maxZ);
  }

  /**
   * Expands this bounds on all sides by the specified amount.
   *
   * This is the mutable form of the function dilated(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  dilate(d) {
    return this.dilateXYZ(d, d, d);
  }

  /**
   * Expands this bounds horizontally (left and right) by the specified amount.
   *
   * This is the mutable form of the function dilatedX(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  dilateX(x) {
    return this.setMinMax(this.minX - x, this.minY, this.minZ, this.maxX + x, this.maxY, this.maxZ);
  }

  /**
   * Expands this bounds vertically (top and bottom) by the specified amount.
   *
   * This is the mutable form of the function dilatedY(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  dilateY(y) {
    return this.setMinMax(this.minX, this.minY - y, this.minZ, this.maxX, this.maxY + y, this.maxZ);
  }

  /**
   * Expands this bounds depth-wise (front and back) by the specified amount.
   *
   * This is the mutable form of the function dilatedZ(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  dilateZ(z) {
    return this.setMinMax(this.minX, this.minY, this.minZ - z, this.maxX, this.maxY, this.maxZ + z);
  }

  /**
   * Expands this bounds independently along each axis. Will be equal to calling
   * bounds.dilateX( x ).dilateY( y ).dilateZ( z ).
   *
   * This is the mutable form of the function dilatedXYZ(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  dilateXYZ(x, y, z) {
    return this.setMinMax(this.minX - x, this.minY - y, this.minZ - z, this.maxX + x, this.maxY + y, this.maxZ + z);
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
   * Contracts this bounds depth-wise (front and back) by the specified amount.
   *
   * This is the mutable form of the function erodedZ(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  erodeZ(z) {
    return this.dilateZ(-z);
  }

  /**
   * Contracts this bounds independently along each axis. Will be equal to calling
   * bounds.erodeX( x ).erodeY( y ).erodeZ( z ).
   *
   * This is the mutable form of the function erodedXYZ(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  erodeXYZ(x, y, z) {
    return this.dilateXYZ(-x, -y, -z);
  }

  /**
   * Translates our bounds horizontally by x.
   *
   * This is the mutable form of the function shiftedX(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  shiftX(x) {
    return this.setMinMax(this.minX + x, this.minY, this.minZ, this.maxX + x, this.maxY, this.maxZ);
  }

  /**
   * Translates our bounds vertically by y.
   *
   * This is the mutable form of the function shiftedY(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  shiftY(y) {
    return this.setMinMax(this.minX, this.minY + y, this.minZ, this.maxX, this.maxY + y, this.maxZ);
  }

  /**
   * Translates our bounds depth-wise by z.
   *
   * This is the mutable form of the function shiftedZ(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  shiftZ(z) {
    return this.setMinMax(this.minX, this.minY, this.minZ + z, this.maxX, this.maxY, this.maxZ + z);
  }

  /**
   * Translates our bounds by (x,y,z).
   *
   * This is the mutable form of the function shifted(). This will mutate (change) this bounds, in addition to returning
   * this bounds itself.
   */
  shiftXYZ(x, y, z) {
    return this.setMinMax(this.minX + x, this.minY + y, this.minZ + z, this.maxX + x, this.maxY + y, this.maxZ + z);
  }

  /**
   * Translates our bounds by the given vector.
   */
  shift(v) {
    return this.shiftXYZ(v.x, v.y, v.z);
  }

  /**
   * Returns a new Bounds3 object, with the cuboid (3d rectangle) construction with x, y, z, width, height and depth.
   *
   * @param x - The minimum value of X for the bounds.
   * @param y - The minimum value of Y for the bounds.
   * @param z - The minimum value of Z for the bounds.
   * @param width - The width (maxX - minX) of the bounds.`
   * @param height - The height (maxY - minY) of the bounds.
   * @param depth - The depth (maxZ - minZ) of the bounds.
   */
  static cuboid(x, y, z, width, height, depth) {
    return new Bounds3(x, y, z, x + width, y + height, z + depth);
  }

  /**
   * Returns a new Bounds3 object that only contains the specified point (x,y,z). Useful for being dilated to form a
   * bounding box around a point. Note that the bounds will not be "empty" as it contains (x,y,z), but it will have
   * zero area.
   */
  static point(x, y, z) {
    return new Bounds3(x, y, z, x, y, z);
  }

  // Helps to identify the dimension of the bounds
  isBounds = true;
  dimension = 3;

  /**
   * A constant Bounds3 with minimums = $\infty$, maximums = $-\infty$, so that it represents "no bounds whatsoever".
   *
   * This allows us to take the union (union/includeBounds) of this and any other Bounds3 to get the other bounds back,
   * e.g. Bounds3.NOTHING.union( bounds ).equals( bounds ). This object naturally serves as the base case as a union of
   * zero bounds objects.
   *
   * Additionally, intersections with NOTHING will always return a Bounds3 equivalent to NOTHING.
   *
   * @constant {Bounds3} NOTHING
   */
  static NOTHING = new Bounds3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

  /**
   * A constant Bounds3 with minimums = $-\infty$, maximums = $\infty$, so that it represents "all bounds".
   *
   * This allows us to take the intersection (intersection/constrainBounds) of this and any other Bounds3 to get the
   * other bounds back, e.g. Bounds3.EVERYTHING.intersection( bounds ).equals( bounds ). This object naturally serves as
   * the base case as an intersection of zero bounds objects.
   *
   * Additionally, unions with EVERYTHING will always return a Bounds3 equivalent to EVERYTHING.
   *
   * @constant {Bounds3} EVERYTHING
   */
  static EVERYTHING = new Bounds3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  static Bounds3IO = new IOType('Bounds3IO', {
    valueType: Bounds3,
    documentation: 'a 3-dimensional bounds (bounding box)',
    stateSchema: {
      minX: NumberIO,
      minY: NumberIO,
      minZ: NumberIO,
      maxX: NumberIO,
      maxY: NumberIO,
      maxZ: NumberIO
    },
    toStateObject: bounds3 => ({
      minX: bounds3.minX,
      minY: bounds3.minY,
      minZ: bounds3.minZ,
      maxX: bounds3.maxX,
      maxY: bounds3.maxY,
      maxZ: bounds3.maxZ
    }),
    fromStateObject: stateObject => new Bounds3(stateObject.minX, stateObject.minY, stateObject.minZ, stateObject.maxX, stateObject.maxY, stateObject.maxZ)
  });
}
dot.register('Bounds3', Bounds3);
Poolable.mixInto(Bounds3, {
  initialize: Bounds3.prototype.setMinMax
});
export default Bounds3;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQb29sYWJsZSIsIklPVHlwZSIsIk51bWJlcklPIiwiZG90IiwiVmVjdG9yMyIsIkJvdW5kczMiLCJjb25zdHJ1Y3RvciIsIm1pblgiLCJtaW5ZIiwibWluWiIsIm1heFgiLCJtYXhZIiwibWF4WiIsImFzc2VydCIsInVuZGVmaW5lZCIsImdldFdpZHRoIiwid2lkdGgiLCJnZXRIZWlnaHQiLCJoZWlnaHQiLCJnZXREZXB0aCIsImRlcHRoIiwiZ2V0WCIsIngiLCJnZXRZIiwieSIsImdldFoiLCJ6IiwiZ2V0TWluWCIsImdldE1pblkiLCJnZXRNaW5aIiwiZ2V0TWF4WCIsImdldE1heFkiLCJnZXRNYXhaIiwiZ2V0TGVmdCIsImxlZnQiLCJnZXRUb3AiLCJ0b3AiLCJnZXRCYWNrIiwiYmFjayIsImdldFJpZ2h0IiwicmlnaHQiLCJnZXRCb3R0b20iLCJib3R0b20iLCJnZXRGcm9udCIsImZyb250IiwiZ2V0Q2VudGVyWCIsImNlbnRlclgiLCJnZXRDZW50ZXJZIiwiY2VudGVyWSIsImdldENlbnRlcloiLCJjZW50ZXJaIiwiZ2V0Q2VudGVyIiwiY2VudGVyIiwiaXNFbXB0eSIsImlzRmluaXRlIiwiaGFzTm9uemVyb0FyZWEiLCJpc1ZhbGlkIiwiY29udGFpbnNDb29yZGluYXRlcyIsImNvbnRhaW5zUG9pbnQiLCJwb2ludCIsImNvbnRhaW5zQm91bmRzIiwiYm91bmRzIiwiaW50ZXJzZWN0c0JvdW5kcyIsImludGVyc2VjdGlvbiIsInRvU3RyaW5nIiwiZXF1YWxzIiwib3RoZXIiLCJlcXVhbHNFcHNpbG9uIiwiZXBzaWxvbiIsInRoaXNGaW5pdGUiLCJvdGhlckZpbml0ZSIsIk1hdGgiLCJhYnMiLCJjb3B5Iiwic2V0IiwidW5pb24iLCJtaW4iLCJtYXgiLCJ3aXRoQ29vcmRpbmF0ZXMiLCJ3aXRoUG9pbnQiLCJ3aXRoTWluWCIsIndpdGhNaW5ZIiwid2l0aE1pbloiLCJ3aXRoTWF4WCIsIndpdGhNYXhZIiwid2l0aE1heFoiLCJyb3VuZGVkT3V0IiwiZmxvb3IiLCJjZWlsIiwicm91bmRlZEluIiwidHJhbnNmb3JtZWQiLCJtYXRyaXgiLCJ0cmFuc2Zvcm0iLCJkaWxhdGVkIiwiZCIsImRpbGF0ZWRYWVoiLCJkaWxhdGVkWCIsImRpbGF0ZWRZIiwiZGlsYXRlZFoiLCJlcm9kZWQiLCJhbW91bnQiLCJlcm9kZWRYIiwiZXJvZGVkWSIsImVyb2RlZFoiLCJlcm9kZWRYWVoiLCJzaGlmdGVkWCIsInNoaWZ0ZWRZIiwic2hpZnRlZFoiLCJzaGlmdGVkWFlaIiwic2hpZnRlZCIsInYiLCJzZXRNaW5NYXgiLCJzZXRNaW5YIiwic2V0TWluWSIsInNldE1pbloiLCJzZXRNYXhYIiwic2V0TWF4WSIsInNldE1heFoiLCJpbmNsdWRlQm91bmRzIiwiY29uc3RyYWluQm91bmRzIiwiYWRkQ29vcmRpbmF0ZXMiLCJhZGRQb2ludCIsInJvdW5kT3V0Iiwicm91bmRJbiIsImlzSWRlbnRpdHkiLCJOdW1iZXIiLCJQT1NJVElWRV9JTkZJTklUWSIsIk5FR0FUSVZFX0lORklOSVRZIiwidmVjdG9yIiwid2l0aEl0IiwibXVsdGlwbHlWZWN0b3IzIiwic2V0WFlaIiwiZGlsYXRlIiwiZGlsYXRlWFlaIiwiZGlsYXRlWCIsImRpbGF0ZVkiLCJkaWxhdGVaIiwiZXJvZGUiLCJlcm9kZVgiLCJlcm9kZVkiLCJlcm9kZVoiLCJlcm9kZVhZWiIsInNoaWZ0WCIsInNoaWZ0WSIsInNoaWZ0WiIsInNoaWZ0WFlaIiwic2hpZnQiLCJjdWJvaWQiLCJpc0JvdW5kcyIsImRpbWVuc2lvbiIsIk5PVEhJTkciLCJFVkVSWVRISU5HIiwiQm91bmRzM0lPIiwidmFsdWVUeXBlIiwiZG9jdW1lbnRhdGlvbiIsInN0YXRlU2NoZW1hIiwidG9TdGF0ZU9iamVjdCIsImJvdW5kczMiLCJmcm9tU3RhdGVPYmplY3QiLCJzdGF0ZU9iamVjdCIsInJlZ2lzdGVyIiwibWl4SW50byIsImluaXRpYWxpemUiLCJwcm90b3R5cGUiXSwic291cmNlcyI6WyJCb3VuZHMzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgM0QgY3Vib2lkLXNoYXBlZCBib3VuZGVkIGFyZWEgKGJvdW5kaW5nIGJveCkuXHJcbiAqXHJcbiAqIFRoZXJlIGFyZSBhIG51bWJlciBvZiBjb252ZW5pZW5jZSBmdW5jdGlvbnMgdG8gZ2V0IGxvY2F0aW9ucyBhbmQgcG9pbnRzIG9uIHRoZSBCb3VuZHMuIEN1cnJlbnRseSB3ZSBkbyBub3RcclxuICogc3RvcmUgdGhlc2Ugd2l0aCB0aGUgQm91bmRzMyBpbnN0YW5jZSwgc2luY2Ugd2Ugd2FudCB0byBsb3dlciB0aGUgbWVtb3J5IGZvb3RwcmludC5cclxuICpcclxuICogbWluWCwgbWluWSwgbWluWiwgbWF4WCwgbWF4WSwgYW5kIG1heFogYXJlIGFjdHVhbGx5IHN0b3JlZC4gV2UgZG9uJ3QgZG8geCx5LHosd2lkdGgsaGVpZ2h0LGRlcHRoIGJlY2F1c2UgdGhpcyBjYW4ndCBwcm9wZXJseSBleHByZXNzXHJcbiAqIHNlbWktaW5maW5pdGUgYm91bmRzIChsaWtlIGEgaGFsZi1wbGFuZSksIG9yIGVhc2lseSBoYW5kbGUgd2hhdCBCb3VuZHMzLk5PVEhJTkcgYW5kIEJvdW5kczMuRVZFUllUSElORyBkbyB3aXRoXHJcbiAqIHRoZSBjb25zdHJ1Y3RpdmUgc29saWQgYXJlYXMuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgUG9vbGFibGUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL1Bvb2xhYmxlLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IE51bWJlcklPIGZyb20gJy4uLy4uL3RhbmRlbS9qcy90eXBlcy9OdW1iZXJJTy5qcyc7XHJcbmltcG9ydCBkb3QgZnJvbSAnLi9kb3QuanMnO1xyXG5pbXBvcnQgVmVjdG9yMyBmcm9tICcuL1ZlY3RvcjMuanMnO1xyXG5pbXBvcnQgTWF0cml4MyBmcm9tICcuL01hdHJpeDMuanMnO1xyXG5cclxuY2xhc3MgQm91bmRzMyB7XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSAzLWRpbWVuc2lvbmFsIGJvdW5kcyAoYm91bmRpbmcgYm94KS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBtaW5YIC0gVGhlIGluaXRpYWwgbWluaW11bSBYIGNvb3JkaW5hdGUgb2YgdGhlIGJvdW5kcy5cclxuICAgKiBAcGFyYW0gbWluWSAtIFRoZSBpbml0aWFsIG1pbmltdW0gWSBjb29yZGluYXRlIG9mIHRoZSBib3VuZHMuXHJcbiAgICogQHBhcmFtIG1pblogLSBUaGUgaW5pdGlhbCBtaW5pbXVtIFogY29vcmRpbmF0ZSBvZiB0aGUgYm91bmRzLlxyXG4gICAqIEBwYXJhbSBtYXhYIC0gVGhlIGluaXRpYWwgbWF4aW11bSBYIGNvb3JkaW5hdGUgb2YgdGhlIGJvdW5kcy5cclxuICAgKiBAcGFyYW0gbWF4WSAtIFRoZSBpbml0aWFsIG1heGltdW0gWSBjb29yZGluYXRlIG9mIHRoZSBib3VuZHMuXHJcbiAgICogQHBhcmFtIG1heFogLSBUaGUgaW5pdGlhbCBtYXhpbXVtIFogY29vcmRpbmF0ZSBvZiB0aGUgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgIHB1YmxpYyBtaW5YOiBudW1iZXIsXHJcbiAgICBwdWJsaWMgbWluWTogbnVtYmVyLFxyXG4gICAgcHVibGljIG1pblo6IG51bWJlcixcclxuICAgIHB1YmxpYyBtYXhYOiBudW1iZXIsXHJcbiAgICBwdWJsaWMgbWF4WTogbnVtYmVyLFxyXG4gICAgcHVibGljIG1heFo6IG51bWJlciApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG1heFkgIT09IHVuZGVmaW5lZCwgJ0JvdW5kczMgcmVxdWlyZXMgNCBwYXJhbWV0ZXJzJyApO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxyXG4gICAqIFByb3BlcnRpZXNcclxuICAgKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSB3aWR0aCBvZiB0aGUgYm91bmRzLCBkZWZpbmVkIGFzIG1heFggLSBtaW5YLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRXaWR0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5tYXhYIC0gdGhpcy5taW5YOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgd2lkdGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0V2lkdGgoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgaGVpZ2h0IG9mIHRoZSBib3VuZHMsIGRlZmluZWQgYXMgbWF4WSAtIG1pblkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEhlaWdodCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5tYXhZIC0gdGhpcy5taW5ZOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgaGVpZ2h0KCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldEhlaWdodCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBkZXB0aCBvZiB0aGUgYm91bmRzLCBkZWZpbmVkIGFzIG1heFogLSBtaW5aLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXREZXB0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5tYXhaIC0gdGhpcy5taW5aOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZGVwdGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0RGVwdGgoKTsgfVxyXG5cclxuICAvKlxyXG4gICAqIENvbnZlbmllbmNlIGxvY2F0aW9uc1xyXG4gICAqIHVwcGVyIGlzIGluIHRlcm1zIG9mIHRoZSB2aXN1YWwgbGF5b3V0IGluIFNjZW5lcnkgYW5kIG90aGVyIHByb2dyYW1zLCBzbyB0aGUgbWluWSBpcyB0aGUgXCJ1cHBlclwiLCBhbmQgbWluWSBpcyB0aGUgXCJsb3dlclwiXHJcbiAgICpcclxuICAgKiAgICAgICAgICAgICBtaW5YICh4KSAgICAgY2VudGVyWCAgICAgICAgbWF4WFxyXG4gICAqICAgICAgICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAqIG1pblkgKHkpIHwgdXBwZXJMZWZ0ICAgdXBwZXJDZW50ZXIgICB1cHBlclJpZ2h0XHJcbiAgICogY2VudGVyWSAgfCBjZW50ZXJMZWZ0ICAgIGNlbnRlciAgICAgIGNlbnRlclJpZ2h0XHJcbiAgICogbWF4WSAgICAgfCBsb3dlckxlZnQgICBsb3dlckNlbnRlciAgIGxvd2VyUmlnaHRcclxuICAgKi9cclxuXHJcbiAgLyoqXHJcbiAgICogQWxpYXMgZm9yIG1pblgsIHdoZW4gdGhpbmtpbmcgb2YgdGhlIGJvdW5kcyBhcyBhbiAoeCx5LHosd2lkdGgsaGVpZ2h0LGRlcHRoKSBjdWJvaWQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWluWDsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0WCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsaWFzIGZvciBtaW5ZLCB3aGVuIHRoaW5raW5nIG9mIHRoZSBib3VuZHMgYXMgYW4gKHgseSx6LHdpZHRoLGhlaWdodCxkZXB0aCkgY3Vib2lkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRZKCk6IG51bWJlciB7IHJldHVybiB0aGlzLm1pblk7IH1cclxuXHJcbiAgcHVibGljIGdldCB5KCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFkoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGlhcyBmb3IgbWluWiwgd2hlbiB0aGlua2luZyBvZiB0aGUgYm91bmRzIGFzIGFuICh4LHkseix3aWR0aCxoZWlnaHQsZGVwdGgpIGN1Ym9pZC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0WigpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5taW5aOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgeigpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRaKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWxpYXMgZm9yIG1pblgsIHN1cHBvcnRpbmcgdGhlIGV4cGxpY2l0IGdldHRlciBmdW5jdGlvbiBzdHlsZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TWluWCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5taW5YOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsaWFzIGZvciBtaW5ZLCBzdXBwb3J0aW5nIHRoZSBleHBsaWNpdCBnZXR0ZXIgZnVuY3Rpb24gc3R5bGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldE1pblkoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWluWTsgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGlhcyBmb3IgbWluWiwgc3VwcG9ydGluZyB0aGUgZXhwbGljaXQgZ2V0dGVyIGZ1bmN0aW9uIHN0eWxlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNaW5aKCk6IG51bWJlciB7IHJldHVybiB0aGlzLm1pblo7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWxpYXMgZm9yIG1heFgsIHN1cHBvcnRpbmcgdGhlIGV4cGxpY2l0IGdldHRlciBmdW5jdGlvbiBzdHlsZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TWF4WCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5tYXhYOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsaWFzIGZvciBtYXhZLCBzdXBwb3J0aW5nIHRoZSBleHBsaWNpdCBnZXR0ZXIgZnVuY3Rpb24gc3R5bGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldE1heFkoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWF4WTsgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGlhcyBmb3IgbWF4Wiwgc3VwcG9ydGluZyB0aGUgZXhwbGljaXQgZ2V0dGVyIGZ1bmN0aW9uIHN0eWxlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNYXhaKCk6IG51bWJlciB7IHJldHVybiB0aGlzLm1heFo7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWxpYXMgZm9yIG1pblgsIHdoZW4gdGhpbmtpbmcgaW4gdGhlIFVJLWxheW91dCBtYW5uZXIuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExlZnQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWluWDsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGxlZnQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWluWDsgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGlhcyBmb3IgbWluWSwgd2hlbiB0aGlua2luZyBpbiB0aGUgVUktbGF5b3V0IG1hbm5lci5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VG9wKCk6IG51bWJlciB7IHJldHVybiB0aGlzLm1pblk7IH1cclxuXHJcbiAgcHVibGljIGdldCB0b3AoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWluWTsgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGlhcyBmb3IgbWluWiwgd2hlbiB0aGlua2luZyBpbiB0aGUgVUktbGF5b3V0IG1hbm5lci5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0QmFjaygpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5taW5aOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgYmFjaygpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5taW5aOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsaWFzIGZvciBtYXhYLCB3aGVuIHRoaW5raW5nIGluIHRoZSBVSS1sYXlvdXQgbWFubmVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRSaWdodCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5tYXhYOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmlnaHQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWF4WDsgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGlhcyBmb3IgbWF4WSwgd2hlbiB0aGlua2luZyBpbiB0aGUgVUktbGF5b3V0IG1hbm5lci5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Qm90dG9tKCk6IG51bWJlciB7IHJldHVybiB0aGlzLm1heFk7IH1cclxuXHJcbiAgcHVibGljIGdldCBib3R0b20oKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWF4WTsgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGlhcyBmb3IgbWF4Wiwgd2hlbiB0aGlua2luZyBpbiB0aGUgVUktbGF5b3V0IG1hbm5lci5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RnJvbnQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubWF4WjsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGZyb250KCk6IG51bWJlciB7IHJldHVybiB0aGlzLm1heFo7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGhvcml6b250YWwgKFgtY29vcmRpbmF0ZSkgY2VudGVyIG9mIHRoZSBib3VuZHMsIGF2ZXJhZ2luZyB0aGUgbWluWCBhbmQgbWF4WC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2VudGVyWCgpOiBudW1iZXIgeyByZXR1cm4gKCB0aGlzLm1heFggKyB0aGlzLm1pblggKSAvIDI7IH1cclxuXHJcbiAgcHVibGljIGdldCBjZW50ZXJYKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldENlbnRlclgoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgdmVydGljYWwgKFktY29vcmRpbmF0ZSkgY2VudGVyIG9mIHRoZSBib3VuZHMsIGF2ZXJhZ2luZyB0aGUgbWluWSBhbmQgbWF4WS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2VudGVyWSgpOiBudW1iZXIgeyByZXR1cm4gKCB0aGlzLm1heFkgKyB0aGlzLm1pblkgKSAvIDI7IH1cclxuXHJcbiAgcHVibGljIGdldCBjZW50ZXJZKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldENlbnRlclkoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgZGVwdGh3aXNlIChaLWNvb3JkaW5hdGUpIGNlbnRlciBvZiB0aGUgYm91bmRzLCBhdmVyYWdpbmcgdGhlIG1pblogYW5kIG1heFouXHJcbiAgICovXHJcbiAgcHVibGljIGdldENlbnRlclooKTogbnVtYmVyIHsgcmV0dXJuICggdGhpcy5tYXhaICsgdGhpcy5taW5aICkgLyAyOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgY2VudGVyWigpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRDZW50ZXJaKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHBvaW50IChjZW50ZXJYLCBjZW50ZXJZLCBjZW50ZXJaKSwgaW4gdGhlIGNlbnRlciBvZiB0aGUgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDZW50ZXIoKTogVmVjdG9yMyB7IHJldHVybiBuZXcgVmVjdG9yMyggdGhpcy5nZXRDZW50ZXJYKCksIHRoaXMuZ2V0Q2VudGVyWSgpLCB0aGlzLmdldENlbnRlclooKSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgY2VudGVyKCk6IFZlY3RvcjMgeyByZXR1cm4gdGhpcy5nZXRDZW50ZXIoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIHdlIGhhdmUgbmVnYXRpdmUgd2lkdGgsIGhlaWdodCBvciBkZXB0aC4gQm91bmRzMy5OT1RISU5HIGlzIGEgcHJpbWUgZXhhbXBsZSBvZiBhbiBlbXB0eSBCb3VuZHMzLlxyXG4gICAqIEJvdW5kcyB3aXRoIHdpZHRoID0gaGVpZ2h0ID0gZGVwdGggPSAwIGFyZSBjb25zaWRlcmVkIG5vdCBlbXB0eSwgc2luY2UgdGhleSBpbmNsdWRlIHRoZSBzaW5nbGUgKDAsMCwwKSBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgaXNFbXB0eSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuZ2V0V2lkdGgoKSA8IDAgfHwgdGhpcy5nZXRIZWlnaHQoKSA8IDAgfHwgdGhpcy5nZXREZXB0aCgpIDwgMDsgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIG91ciBtaW5pbXVtcyBhbmQgbWF4aW11bXMgYXJlIGFsbCBmaW5pdGUgbnVtYmVycy4gVGhpcyB3aWxsIGV4Y2x1ZGUgQm91bmRzMy5OT1RISU5HIGFuZCBCb3VuZHMzLkVWRVJZVEhJTkcuXHJcbiAgICovXHJcbiAgcHVibGljIGlzRmluaXRlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIGlzRmluaXRlKCB0aGlzLm1pblggKSAmJiBpc0Zpbml0ZSggdGhpcy5taW5ZICkgJiYgaXNGaW5pdGUoIHRoaXMubWluWiApICYmIGlzRmluaXRlKCB0aGlzLm1heFggKSAmJiBpc0Zpbml0ZSggdGhpcy5tYXhZICkgJiYgaXNGaW5pdGUoIHRoaXMubWF4WiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hldGhlciB0aGlzIGJvdW5kcyBoYXMgYSBub24temVybyBhcmVhIChub24temVybyBwb3NpdGl2ZSB3aWR0aCwgaGVpZ2h0IGFuZCBkZXB0aCkuXHJcbiAgICovXHJcbiAgcHVibGljIGhhc05vbnplcm9BcmVhKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0V2lkdGgoKSA+IDAgJiYgdGhpcy5nZXRIZWlnaHQoKSA+IDAgJiYgdGhpcy5nZXREZXB0aCgpID4gMDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgdGhpcyBib3VuZHMgaGFzIGEgZmluaXRlIGFuZCBub24tbmVnYXRpdmUgd2lkdGgsIGhlaWdodCBhbmQgZGVwdGguXHJcbiAgICovXHJcbiAgcHVibGljIGlzVmFsaWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gIXRoaXMuaXNFbXB0eSgpICYmIHRoaXMuaXNGaW5pdGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgdGhlIGNvb3JkaW5hdGVzIGFyZSBjb250YWluZWQgaW5zaWRlIHRoZSBib3VuZGluZyBib3gsIG9yIGFyZSBvbiB0aGUgYm91bmRhcnkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0geCAtIFggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnQgdG8gY2hlY2tcclxuICAgKiBAcGFyYW0geSAtIFkgY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnQgdG8gY2hlY2tcclxuICAgKiBAcGFyYW0geiAtIFogY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnQgdG8gY2hlY2tcclxuICAgKi9cclxuICBwdWJsaWMgY29udGFpbnNDb29yZGluYXRlcyggeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLm1pblggPD0geCAmJiB4IDw9IHRoaXMubWF4WCAmJiB0aGlzLm1pblkgPD0geSAmJiB5IDw9IHRoaXMubWF4WSAmJiB0aGlzLm1pblogPD0geiAmJiB6IDw9IHRoaXMubWF4WjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgdGhlIHBvaW50IGlzIGNvbnRhaW5lZCBpbnNpZGUgdGhlIGJvdW5kaW5nIGJveCwgb3IgaXMgb24gdGhlIGJvdW5kYXJ5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb250YWluc1BvaW50KCBwb2ludDogVmVjdG9yMyApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmNvbnRhaW5zQ29vcmRpbmF0ZXMoIHBvaW50LngsIHBvaW50LnksIHBvaW50LnogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgdGhpcyBib3VuZGluZyBib3ggY29tcGxldGVseSBjb250YWlucyB0aGUgYm91bmRpbmcgYm94IHBhc3NlZCBhcyBhIHBhcmFtZXRlci4gVGhlIGJvdW5kYXJ5IG9mIGEgYm94IGlzXHJcbiAgICogY29uc2lkZXJlZCB0byBiZSBcImNvbnRhaW5lZFwiLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb250YWluc0JvdW5kcyggYm91bmRzOiBCb3VuZHMzICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMubWluWCA8PSBib3VuZHMubWluWCAmJiB0aGlzLm1heFggPj0gYm91bmRzLm1heFggJiYgdGhpcy5taW5ZIDw9IGJvdW5kcy5taW5ZICYmIHRoaXMubWF4WSA+PSBib3VuZHMubWF4WSAmJiB0aGlzLm1pblogPD0gYm91bmRzLm1pblogJiYgdGhpcy5tYXhaID49IGJvdW5kcy5tYXhaO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hldGhlciB0aGlzIGFuZCBhbm90aGVyIGJvdW5kaW5nIGJveCBoYXZlIGFueSBwb2ludHMgb2YgaW50ZXJzZWN0aW9uIChpbmNsdWRpbmcgdG91Y2hpbmcgYm91bmRhcmllcykuXHJcbiAgICovXHJcbiAgcHVibGljIGludGVyc2VjdHNCb3VuZHMoIGJvdW5kczogQm91bmRzMyApOiBib29sZWFuIHtcclxuICAgIC8vIFRPRE86IG1vcmUgZWZmaWNpZW50IHdheSBvZiBkb2luZyB0aGlzPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZG90L2lzc3Vlcy85NlxyXG4gICAgcmV0dXJuICF0aGlzLmludGVyc2VjdGlvbiggYm91bmRzICkuaXNFbXB0eSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVidWdnaW5nIHN0cmluZyBmb3IgdGhlIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBgW3g6KCR7dGhpcy5taW5YfSwke3RoaXMubWF4WH0pLHk6KCR7dGhpcy5taW5ZfSwke3RoaXMubWF4WX0pLHo6KCR7dGhpcy5taW5afSwke3RoaXMubWF4Wn0pXWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeGFjdCBlcXVhbGl0eSBjb21wYXJpc29uIGJldHdlZW4gdGhpcyBib3VuZHMgYW5kIGFub3RoZXIgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBlcXVhbHMoIG90aGVyOiBCb3VuZHMzICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMubWluWCA9PT0gb3RoZXIubWluWCAmJlxyXG4gICAgICAgICAgIHRoaXMubWluWSA9PT0gb3RoZXIubWluWSAmJlxyXG4gICAgICAgICAgIHRoaXMubWluWiA9PT0gb3RoZXIubWluWiAmJlxyXG4gICAgICAgICAgIHRoaXMubWF4WCA9PT0gb3RoZXIubWF4WCAmJlxyXG4gICAgICAgICAgIHRoaXMubWF4WSA9PT0gb3RoZXIubWF4WSAmJlxyXG4gICAgICAgICAgIHRoaXMubWF4WiA9PT0gb3RoZXIubWF4WjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFwcHJveGltYXRlIGVxdWFsaXR5IGNvbXBhcmlzb24gYmV0d2VlbiB0aGlzIGJvdW5kcyBhbmQgYW5vdGhlciBib3VuZHMuXHJcbiAgICogQHJldHVybnMgLSBXaGV0aGVyIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgdHdvIGJvdW5kcyBoYXMgbm8gbWluL21heCB3aXRoIGFuIGFic29sdXRlIHZhbHVlIGdyZWF0ZXIgdGhhbiBlcHNpbG9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBlcXVhbHNFcHNpbG9uKCBvdGhlcjogQm91bmRzMywgZXBzaWxvbjogbnVtYmVyICk6IGJvb2xlYW4ge1xyXG4gICAgZXBzaWxvbiA9IGVwc2lsb24gIT09IHVuZGVmaW5lZCA/IGVwc2lsb24gOiAwO1xyXG4gICAgY29uc3QgdGhpc0Zpbml0ZSA9IHRoaXMuaXNGaW5pdGUoKTtcclxuICAgIGNvbnN0IG90aGVyRmluaXRlID0gb3RoZXIuaXNGaW5pdGUoKTtcclxuICAgIGlmICggdGhpc0Zpbml0ZSAmJiBvdGhlckZpbml0ZSApIHtcclxuICAgICAgLy8gYm90aCBhcmUgZmluaXRlLCBzbyB3ZSBjYW4gdXNlIE1hdGguYWJzKCkgLSBpdCB3b3VsZCBmYWlsIHdpdGggbm9uLWZpbml0ZSB2YWx1ZXMgbGlrZSBJbmZpbml0eVxyXG4gICAgICByZXR1cm4gTWF0aC5hYnMoIHRoaXMubWluWCAtIG90aGVyLm1pblggKSA8IGVwc2lsb24gJiZcclxuICAgICAgICAgICAgIE1hdGguYWJzKCB0aGlzLm1pblkgLSBvdGhlci5taW5ZICkgPCBlcHNpbG9uICYmXHJcbiAgICAgICAgICAgICBNYXRoLmFicyggdGhpcy5taW5aIC0gb3RoZXIubWluWiApIDwgZXBzaWxvbiAmJlxyXG4gICAgICAgICAgICAgTWF0aC5hYnMoIHRoaXMubWF4WCAtIG90aGVyLm1heFggKSA8IGVwc2lsb24gJiZcclxuICAgICAgICAgICAgIE1hdGguYWJzKCB0aGlzLm1heFkgLSBvdGhlci5tYXhZICkgPCBlcHNpbG9uICYmXHJcbiAgICAgICAgICAgICBNYXRoLmFicyggdGhpcy5tYXhaIC0gb3RoZXIubWF4WiApIDwgZXBzaWxvbjtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzRmluaXRlICE9PSBvdGhlckZpbml0ZSApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlOyAvLyBvbmUgaXMgZmluaXRlLCB0aGUgb3RoZXIgaXMgbm90LiBkZWZpbml0ZWx5IG5vdCBlcXVhbFxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMgPT09IG90aGVyICkge1xyXG4gICAgICByZXR1cm4gdHJ1ZTsgLy8gZXhhY3Qgc2FtZSBpbnN0YW5jZSwgbXVzdCBiZSBlcXVhbFxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGVwc2lsb24gb25seSBhcHBsaWVzIG9uIGZpbml0ZSBkaW1lbnNpb25zLiBkdWUgdG8gSlMncyBoYW5kbGluZyBvZiBpc0Zpbml0ZSgpLCBpdCdzIGZhc3RlciB0byBjaGVjayB0aGUgc3VtIG9mIGJvdGhcclxuICAgICAgcmV0dXJuICggaXNGaW5pdGUoIHRoaXMubWluWCArIG90aGVyLm1pblggKSA/ICggTWF0aC5hYnMoIHRoaXMubWluWCAtIG90aGVyLm1pblggKSA8IGVwc2lsb24gKSA6ICggdGhpcy5taW5YID09PSBvdGhlci5taW5YICkgKSAmJlxyXG4gICAgICAgICAgICAgKCBpc0Zpbml0ZSggdGhpcy5taW5ZICsgb3RoZXIubWluWSApID8gKCBNYXRoLmFicyggdGhpcy5taW5ZIC0gb3RoZXIubWluWSApIDwgZXBzaWxvbiApIDogKCB0aGlzLm1pblkgPT09IG90aGVyLm1pblkgKSApICYmXHJcbiAgICAgICAgICAgICAoIGlzRmluaXRlKCB0aGlzLm1pblogKyBvdGhlci5taW5aICkgPyAoIE1hdGguYWJzKCB0aGlzLm1pblogLSBvdGhlci5taW5aICkgPCBlcHNpbG9uICkgOiAoIHRoaXMubWluWiA9PT0gb3RoZXIubWluWiApICkgJiZcclxuICAgICAgICAgICAgICggaXNGaW5pdGUoIHRoaXMubWF4WCArIG90aGVyLm1heFggKSA/ICggTWF0aC5hYnMoIHRoaXMubWF4WCAtIG90aGVyLm1heFggKSA8IGVwc2lsb24gKSA6ICggdGhpcy5tYXhYID09PSBvdGhlci5tYXhYICkgKSAmJlxyXG4gICAgICAgICAgICAgKCBpc0Zpbml0ZSggdGhpcy5tYXhZICsgb3RoZXIubWF4WSApID8gKCBNYXRoLmFicyggdGhpcy5tYXhZIC0gb3RoZXIubWF4WSApIDwgZXBzaWxvbiApIDogKCB0aGlzLm1heFkgPT09IG90aGVyLm1heFkgKSApICYmXHJcbiAgICAgICAgICAgICAoIGlzRmluaXRlKCB0aGlzLm1heFogKyBvdGhlci5tYXhaICkgPyAoIE1hdGguYWJzKCB0aGlzLm1heFogLSBvdGhlci5tYXhaICkgPCBlcHNpbG9uICkgOiAoIHRoaXMubWF4WiA9PT0gb3RoZXIubWF4WiApICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBJbW11dGFibGUgb3BlcmF0aW9uc1xyXG4gICAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIGNvcHkgb2YgdGhpcyBib3VuZHMsIG9yIGlmIGEgYm91bmRzIGlzIHBhc3NlZCBpbiwgc2V0IHRoYXQgYm91bmRzJ3MgdmFsdWVzIHRvIG91cnMuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2V0KCksIGlmIGEgYm91bmRzIGlzIHByb3ZpZGVkLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kXHJcbiAgICogd2lsbCBub3QgbW9kaWZ5IHRoaXMgYm91bmRzLlxyXG4gICAqIEBwYXJhbSBib3VuZHMgLSBJZiBub3QgcHJvdmlkZWQsIGNyZWF0ZXMgYSBuZXcgQm91bmRzMyB3aXRoIGZpbGxlZCBpbiB2YWx1ZXMuIE90aGVyd2lzZSwgZmlsbHMgaW4gdGhlXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcyBvZiB0aGUgcHJvdmlkZWQgYm91bmRzIHNvIHRoYXQgaXQgZXF1YWxzIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb3B5KCBib3VuZHM/OiBCb3VuZHMzICk6IEJvdW5kczMge1xyXG4gICAgaWYgKCBib3VuZHMgKSB7XHJcbiAgICAgIHJldHVybiBib3VuZHMuc2V0KCB0aGlzICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIG5ldyBCb3VuZHMzKCB0aGlzLm1pblgsIHRoaXMubWluWSwgdGhpcy5taW5aLCB0aGlzLm1heFgsIHRoaXMubWF4WSwgdGhpcy5tYXhaICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgc21hbGxlc3QgYm91bmRzIHRoYXQgY29udGFpbnMgYm90aCB0aGlzIGJvdW5kcyBhbmQgdGhlIGlucHV0IGJvdW5kcywgcmV0dXJuZWQgYXMgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGluY2x1ZGVCb3VuZHMoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgdW5pb24oIGJvdW5kczogQm91bmRzMyApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiBuZXcgQm91bmRzMyhcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWluWCwgYm91bmRzLm1pblggKSxcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWluWSwgYm91bmRzLm1pblkgKSxcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWluWiwgYm91bmRzLm1pblogKSxcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWF4WCwgYm91bmRzLm1heFggKSxcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWF4WSwgYm91bmRzLm1heFkgKSxcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWF4WiwgYm91bmRzLm1heFogKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBzbWFsbGVzdCBib3VuZHMgdGhhdCBpcyBjb250YWluZWQgYnkgYm90aCB0aGlzIGJvdW5kcyBhbmQgdGhlIGlucHV0IGJvdW5kcywgcmV0dXJuZWQgYXMgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGNvbnN0cmFpbkJvdW5kcygpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnRlcnNlY3Rpb24oIGJvdW5kczogQm91bmRzMyApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiBuZXcgQm91bmRzMyhcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWluWCwgYm91bmRzLm1pblggKSxcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWluWSwgYm91bmRzLm1pblkgKSxcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWluWiwgYm91bmRzLm1pblogKSxcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWF4WCwgYm91bmRzLm1heFggKSxcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWF4WSwgYm91bmRzLm1heFkgKSxcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWF4WiwgYm91bmRzLm1heFogKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8vIFRPRE86IGRpZmZlcmVuY2Ugc2hvdWxkIGJlIHdlbGwtZGVmaW5lZCwgYnV0IG1vcmUgbG9naWMgaXMgbmVlZGVkIHRvIGNvbXB1dGUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2RvdC9pc3N1ZXMvOTZcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHNtYWxsZXN0IGJvdW5kcyB0aGF0IGNvbnRhaW5zIHRoaXMgYm91bmRzIGFuZCB0aGUgcG9pbnQgKHgseSx6KSwgcmV0dXJuZWQgYXMgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGFkZENvb3JkaW5hdGVzKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHdpdGhDb29yZGluYXRlcyggeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiBuZXcgQm91bmRzMyhcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWluWCwgeCApLFxyXG4gICAgICBNYXRoLm1pbiggdGhpcy5taW5ZLCB5ICksXHJcbiAgICAgIE1hdGgubWluKCB0aGlzLm1pblosIHogKSxcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWF4WCwgeCApLFxyXG4gICAgICBNYXRoLm1heCggdGhpcy5tYXhZLCB5ICksXHJcbiAgICAgIE1hdGgubWF4KCB0aGlzLm1heFosIHogKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBzbWFsbGVzdCBib3VuZHMgdGhhdCBjb250YWlucyB0aGlzIGJvdW5kcyBhbmQgdGhlIGlucHV0IHBvaW50LCByZXR1cm5lZCBhcyBhIGNvcHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gYWRkUG9pbnQoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgd2l0aFBvaW50KCBwb2ludDogVmVjdG9yMyApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiB0aGlzLndpdGhDb29yZGluYXRlcyggcG9pbnQueCwgcG9pbnQueSwgcG9pbnQueiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBjb3B5IG9mIHRoaXMgYm91bmRzLCB3aXRoIG1pblggcmVwbGFjZWQgd2l0aCB0aGUgaW5wdXQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2V0TWluWCgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aXRoTWluWCggbWluWDogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIG5ldyBCb3VuZHMzKCBtaW5YLCB0aGlzLm1pblksIHRoaXMubWluWiwgdGhpcy5tYXhYLCB0aGlzLm1heFksIHRoaXMubWF4WiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBjb3B5IG9mIHRoaXMgYm91bmRzLCB3aXRoIG1pblkgcmVwbGFjZWQgd2l0aCB0aGUgaW5wdXQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2V0TWluWSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aXRoTWluWSggbWluWTogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIG5ldyBCb3VuZHMzKCB0aGlzLm1pblgsIG1pblksIHRoaXMubWluWiwgdGhpcy5tYXhYLCB0aGlzLm1heFksIHRoaXMubWF4WiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBjb3B5IG9mIHRoaXMgYm91bmRzLCB3aXRoIG1pblogcmVwbGFjZWQgd2l0aCB0aGUgaW5wdXQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2V0TWluWigpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aXRoTWluWiggbWluWjogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIG5ldyBCb3VuZHMzKCB0aGlzLm1pblgsIHRoaXMubWluWSwgbWluWiwgdGhpcy5tYXhYLCB0aGlzLm1heFksIHRoaXMubWF4WiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBjb3B5IG9mIHRoaXMgYm91bmRzLCB3aXRoIG1heFggcmVwbGFjZWQgd2l0aCB0aGUgaW5wdXQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2V0TWF4WCgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aXRoTWF4WCggbWF4WDogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIG5ldyBCb3VuZHMzKCB0aGlzLm1pblgsIHRoaXMubWluWSwgdGhpcy5taW5aLCBtYXhYLCB0aGlzLm1heFksIHRoaXMubWF4WiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBjb3B5IG9mIHRoaXMgYm91bmRzLCB3aXRoIG1heFkgcmVwbGFjZWQgd2l0aCB0aGUgaW5wdXQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2V0TWF4WSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aXRoTWF4WSggbWF4WTogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIG5ldyBCb3VuZHMzKCB0aGlzLm1pblgsIHRoaXMubWluWSwgdGhpcy5taW5aLCB0aGlzLm1heFgsIG1heFksIHRoaXMubWF4WiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBjb3B5IG9mIHRoaXMgYm91bmRzLCB3aXRoIG1heFogcmVwbGFjZWQgd2l0aCB0aGUgaW5wdXQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2V0TWF4WigpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aXRoTWF4WiggbWF4WjogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIG5ldyBCb3VuZHMzKCB0aGlzLm1pblgsIHRoaXMubWluWSwgdGhpcy5taW5aLCB0aGlzLm1heFgsIHRoaXMubWF4WSwgbWF4WiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBjb3B5IG9mIHRoaXMgYm91bmRzLCB3aXRoIHRoZSBtaW5pbXVtIHZhbHVlcyByb3VuZGVkIGRvd24gdG8gdGhlIG5lYXJlc3QgaW50ZWdlciwgYW5kIHRoZSBtYXhpbXVtIHZhbHVlc1xyXG4gICAqIHJvdW5kZWQgdXAgdG8gdGhlIG5lYXJlc3QgaW50ZWdlci4gVGhpcyBjYXVzZXMgdGhlIGJvdW5kcyB0byBleHBhbmQgYXMgbmVjZXNzYXJ5IHNvIHRoYXQgaXRzIGJvdW5kYXJpZXNcclxuICAgKiBhcmUgaW50ZWdlci1hbGlnbmVkLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHJvdW5kT3V0KCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHJvdW5kZWRPdXQoKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gbmV3IEJvdW5kczMoXHJcbiAgICAgIE1hdGguZmxvb3IoIHRoaXMubWluWCApLFxyXG4gICAgICBNYXRoLmZsb29yKCB0aGlzLm1pblkgKSxcclxuICAgICAgTWF0aC5mbG9vciggdGhpcy5taW5aICksXHJcbiAgICAgIE1hdGguY2VpbCggdGhpcy5tYXhYICksXHJcbiAgICAgIE1hdGguY2VpbCggdGhpcy5tYXhZICksXHJcbiAgICAgIE1hdGguY2VpbCggdGhpcy5tYXhaIClcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGNvcHkgb2YgdGhpcyBib3VuZHMsIHdpdGggdGhlIG1pbmltdW0gdmFsdWVzIHJvdW5kZWQgdXAgdG8gdGhlIG5lYXJlc3QgaW50ZWdlciwgYW5kIHRoZSBtYXhpbXVtIHZhbHVlc1xyXG4gICAqIHJvdW5kZWQgZG93biB0byB0aGUgbmVhcmVzdCBpbnRlZ2VyLiBUaGlzIGNhdXNlcyB0aGUgYm91bmRzIHRvIGNvbnRyYWN0IGFzIG5lY2Vzc2FyeSBzbyB0aGF0IGl0cyBib3VuZGFyaWVzXHJcbiAgICogYXJlIGludGVnZXItYWxpZ25lZC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiByb3VuZEluKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHJvdW5kZWRJbigpOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiBuZXcgQm91bmRzMyhcclxuICAgICAgTWF0aC5jZWlsKCB0aGlzLm1pblggKSxcclxuICAgICAgTWF0aC5jZWlsKCB0aGlzLm1pblkgKSxcclxuICAgICAgTWF0aC5jZWlsKCB0aGlzLm1pblogKSxcclxuICAgICAgTWF0aC5mbG9vciggdGhpcy5tYXhYICksXHJcbiAgICAgIE1hdGguZmxvb3IoIHRoaXMubWF4WSApLFxyXG4gICAgICBNYXRoLmZsb29yKCB0aGlzLm1heFogKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgYm91bmRpbmcgYm94IChzdGlsbCBheGlzLWFsaWduZWQpIHRoYXQgY29udGFpbnMgdGhlIHRyYW5zZm9ybWVkIHNoYXBlIG9mIHRoaXMgYm91bmRzLCBhcHBseWluZyB0aGUgbWF0cml4IGFzXHJcbiAgICogYW4gYWZmaW5lIHRyYW5zZm9ybWF0aW9uLlxyXG4gICAqXHJcbiAgICogTk9URTogYm91bmRzLnRyYW5zZm9ybWVkKCBtYXRyaXggKS50cmFuc2Zvcm1lZCggaW52ZXJzZSApIG1heSBiZSBsYXJnZXIgdGhhbiB0aGUgb3JpZ2luYWwgYm94LCBpZiBpdCBpbmNsdWRlc1xyXG4gICAqIGEgcm90YXRpb24gdGhhdCBpc24ndCBhIG11bHRpcGxlIG9mICRcXHBpLzIkLiBUaGlzIGlzIGJlY2F1c2UgdGhlIHJldHVybmVkIGJvdW5kcyBtYXkgZXhwYW5kIGluIGFyZWEgdG8gY292ZXJcclxuICAgKiBBTEwgb2YgdGhlIGNvcm5lcnMgb2YgdGhlIHRyYW5zZm9ybWVkIGJvdW5kaW5nIGJveC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiB0cmFuc2Zvcm0oKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKiAvLyBUT0RPOiBTaG91bGQgYmUgTWF0cml4NCB0eXBlLCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZG90L2lzc3Vlcy8xMjVcclxuICAgKi9cclxuICBwdWJsaWMgdHJhbnNmb3JtZWQoIG1hdHJpeDogTWF0cml4MyApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiB0aGlzLmNvcHkoKS50cmFuc2Zvcm0oIG1hdHJpeCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBib3VuZGluZyBib3ggdGhhdCBpcyBleHBhbmRlZCBvbiBhbGwgc2lkZXMgYnkgdGhlIHNwZWNpZmllZCBhbW91bnQuKVxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGRpbGF0ZSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaWxhdGVkKCBkOiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gdGhpcy5kaWxhdGVkWFlaKCBkLCBkLCBkICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGJvdW5kaW5nIGJveCB0aGF0IGlzIGV4cGFuZGVkIGhvcml6b250YWxseSAob24gdGhlIGxlZnQgYW5kIHJpZ2h0KSBieSB0aGUgc3BlY2lmaWVkIGFtb3VudC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBkaWxhdGVYKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGRpbGF0ZWRYKCB4OiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gbmV3IEJvdW5kczMoIHRoaXMubWluWCAtIHgsIHRoaXMubWluWSwgdGhpcy5taW5aLCB0aGlzLm1heFggKyB4LCB0aGlzLm1heFksIHRoaXMubWF4WiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBib3VuZGluZyBib3ggdGhhdCBpcyBleHBhbmRlZCB2ZXJ0aWNhbGx5IChvbiB0aGUgdG9wIGFuZCBib3R0b20pIGJ5IHRoZSBzcGVjaWZpZWQgYW1vdW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGRpbGF0ZVkoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZGlsYXRlZFkoIHk6IG51bWJlciApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiBuZXcgQm91bmRzMyggdGhpcy5taW5YLCB0aGlzLm1pblkgLSB5LCB0aGlzLm1pblosIHRoaXMubWF4WCwgdGhpcy5tYXhZICsgeSwgdGhpcy5tYXhaICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGJvdW5kaW5nIGJveCB0aGF0IGlzIGV4cGFuZGVkIGRlcHRoLXdpc2UgKG9uIHRoZSBmcm9udCBhbmQgYmFjaykgYnkgdGhlIHNwZWNpZmllZCBhbW91bnQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gZGlsYXRlWigpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaWxhdGVkWiggejogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIG5ldyBCb3VuZHMzKCB0aGlzLm1pblgsIHRoaXMubWluWSwgdGhpcy5taW5aIC0geiwgdGhpcy5tYXhYLCB0aGlzLm1heFksIHRoaXMubWF4WiArIHogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgYm91bmRpbmcgYm94IHRoYXQgaXMgZXhwYW5kZWQgb24gYWxsIHNpZGVzLCB3aXRoIGRpZmZlcmVudCBhbW91bnRzIG9mIGV4cGFuc2lvbiBhbG9uZyBlYWNoIGF4aXMuXHJcbiAgICogV2lsbCBiZSBpZGVudGljYWwgdG8gdGhlIGJvdW5kcyByZXR1cm5lZCBieSBjYWxsaW5nIGJvdW5kcy5kaWxhdGVkWCggeCApLmRpbGF0ZWRZKCB5ICkuZGlsYXRlZFooIHogKS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBkaWxhdGVYWVooKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKiBAcGFyYW0geCAtIEFtb3VudCB0byBkaWxhdGUgaG9yaXpvbnRhbGx5IChmb3IgZWFjaCBzaWRlKVxyXG4gICAqIEBwYXJhbSB5IC0gQW1vdW50IHRvIGRpbGF0ZSB2ZXJ0aWNhbGx5IChmb3IgZWFjaCBzaWRlKVxyXG4gICAqIEBwYXJhbSB6IC0gQW1vdW50IHRvIGRpbGF0ZSBkZXB0aC13aXNlIChmb3IgZWFjaCBzaWRlKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaWxhdGVkWFlaKCB4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIG5ldyBCb3VuZHMzKCB0aGlzLm1pblggLSB4LCB0aGlzLm1pblkgLSB5LCB0aGlzLm1pblogLSB6LCB0aGlzLm1heFggKyB4LCB0aGlzLm1heFkgKyB5LCB0aGlzLm1heFogKyB6ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGJvdW5kaW5nIGJveCB0aGF0IGlzIGNvbnRyYWN0ZWQgb24gYWxsIHNpZGVzIGJ5IHRoZSBzcGVjaWZpZWQgYW1vdW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGVyb2RlKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGVyb2RlZCggYW1vdW50OiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gdGhpcy5kaWxhdGVkKCAtYW1vdW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGJvdW5kaW5nIGJveCB0aGF0IGlzIGNvbnRyYWN0ZWQgaG9yaXpvbnRhbGx5IChvbiB0aGUgbGVmdCBhbmQgcmlnaHQpIGJ5IHRoZSBzcGVjaWZpZWQgYW1vdW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGVyb2RlWCgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBlcm9kZWRYKCB4OiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gdGhpcy5kaWxhdGVkWCggLXggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgYm91bmRpbmcgYm94IHRoYXQgaXMgY29udHJhY3RlZCB2ZXJ0aWNhbGx5IChvbiB0aGUgdG9wIGFuZCBib3R0b20pIGJ5IHRoZSBzcGVjaWZpZWQgYW1vdW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGVyb2RlWSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBlcm9kZWRZKCB5OiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gdGhpcy5kaWxhdGVkWSggLXkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgYm91bmRpbmcgYm94IHRoYXQgaXMgY29udHJhY3RlZCBkZXB0aC13aXNlIChvbiB0aGUgZnJvbnQgYW5kIGJhY2spIGJ5IHRoZSBzcGVjaWZpZWQgYW1vdW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGVyb2RlWigpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBlcm9kZWRaKCB6OiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gdGhpcy5kaWxhdGVkWiggLXogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgYm91bmRpbmcgYm94IHRoYXQgaXMgY29udHJhY3RlZCBvbiBhbGwgc2lkZXMsIHdpdGggZGlmZmVyZW50IGFtb3VudHMgb2YgY29udHJhY3Rpb24gYWxvbmcgZWFjaCBheGlzLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGVyb2RlWFlaKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICogQHBhcmFtIHggLSBBbW91bnQgdG8gZXJvZGUgaG9yaXpvbnRhbGx5IChmb3IgZWFjaCBzaWRlKVxyXG4gICAqIEBwYXJhbSB5IC0gQW1vdW50IHRvIGVyb2RlIHZlcnRpY2FsbHkgKGZvciBlYWNoIHNpZGUpXHJcbiAgICogQHBhcmFtIHogLSBBbW91bnQgdG8gZXJvZGUgZGVwdGgtd2lzZSAoZm9yIGVhY2ggc2lkZSlcclxuICAgKi9cclxuICBwdWJsaWMgZXJvZGVkWFlaKCB4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIHRoaXMuZGlsYXRlZFhZWiggLXgsIC15LCAteiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3VyIGJvdW5kcywgdHJhbnNsYXRlZCBob3Jpem9udGFsbHkgYnkgeCwgcmV0dXJuZWQgYXMgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHNoaWZ0WCgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzaGlmdGVkWCggeDogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIG5ldyBCb3VuZHMzKCB0aGlzLm1pblggKyB4LCB0aGlzLm1pblksIHRoaXMubWluWiwgdGhpcy5tYXhYICsgeCwgdGhpcy5tYXhZLCB0aGlzLm1heFogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE91ciBib3VuZHMsIHRyYW5zbGF0ZWQgdmVydGljYWxseSBieSB5LCByZXR1cm5lZCBhcyBhIGNvcHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2hpZnRZKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgYm91bmRzLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHNoaWZ0ZWRZKCB5OiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gbmV3IEJvdW5kczMoIHRoaXMubWluWCwgdGhpcy5taW5ZICsgeSwgdGhpcy5taW5aLCB0aGlzLm1heFgsIHRoaXMubWF4WSArIHksIHRoaXMubWF4WiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3VyIGJvdW5kcywgdHJhbnNsYXRlZCBkZXB0aC13aXNlIGJ5IHosIHJldHVybmVkIGFzIGEgY29weS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBzaGlmdFooKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBib3VuZHMsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2hpZnRlZFooIHo6IG51bWJlciApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiBuZXcgQm91bmRzMyggdGhpcy5taW5YLCB0aGlzLm1pblksIHRoaXMubWluWiArIHosIHRoaXMubWF4WCwgdGhpcy5tYXhZLCB0aGlzLm1heFogKyB6ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPdXIgYm91bmRzLCB0cmFuc2xhdGVkIGJ5ICh4LHkseiksIHJldHVybmVkIGFzIGEgY29weS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBzaGlmdCgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGJvdW5kcywgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzaGlmdGVkWFlaKCB4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIG5ldyBCb3VuZHMzKCB0aGlzLm1pblggKyB4LCB0aGlzLm1pblkgKyB5LCB0aGlzLm1pblogKyB6LCB0aGlzLm1heFggKyB4LCB0aGlzLm1heFkgKyB5LCB0aGlzLm1heFogKyB6ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIG91ciBib3VuZHMsIHRyYW5zbGF0ZWQgYnkgYSB2ZWN0b3IsIHJldHVybmVkIGFzIGEgY29weS5cclxuICAgKi9cclxuICBwdWJsaWMgc2hpZnRlZCggdjogVmVjdG9yMyApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiB0aGlzLnNoaWZ0ZWRYWVooIHYueCwgdi55LCB2LnogKTtcclxuICB9XHJcblxyXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxyXG4gICAqIE11dGFibGUgb3BlcmF0aW9uc1xyXG4gICAqXHJcbiAgICogQWxsIG11dGFibGUgb3BlcmF0aW9ucyBzaG91bGQgY2FsbCBvbmUgb2YgdGhlIGZvbGxvd2luZzpcclxuICAgKiAgIHNldE1pbk1heCwgc2V0TWluWCwgc2V0TWluWSwgc2V0TWluWiwgc2V0TWF4WCwgc2V0TWF4WSwgc2V0TWF4WlxyXG4gICAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyBlYWNoIHZhbHVlIGZvciB0aGlzIGJvdW5kcywgYW5kIHJldHVybnMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRNaW5NYXgoIG1pblg6IG51bWJlciwgbWluWTogbnVtYmVyLCBtaW5aOiBudW1iZXIsIG1heFg6IG51bWJlciwgbWF4WTogbnVtYmVyLCBtYXhaOiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICB0aGlzLm1pblggPSBtaW5YO1xyXG4gICAgdGhpcy5taW5ZID0gbWluWTtcclxuICAgIHRoaXMubWluWiA9IG1pblo7XHJcbiAgICB0aGlzLm1heFggPSBtYXhYO1xyXG4gICAgdGhpcy5tYXhZID0gbWF4WTtcclxuICAgIHRoaXMubWF4WiA9IG1heFo7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHZhbHVlIG9mIG1pblguXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHdpdGhNaW5YKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TWluWCggbWluWDogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgdGhpcy5taW5YID0gbWluWDtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdmFsdWUgb2YgbWluWS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gd2l0aE1pblkoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRNaW5ZKCBtaW5ZOiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICB0aGlzLm1pblkgPSBtaW5ZO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB2YWx1ZSBvZiBtaW5aLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiB3aXRoTWluWigpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHNldE1pblooIG1pblo6IG51bWJlciApOiBCb3VuZHMzIHtcclxuICAgIHRoaXMubWluWiA9IG1pblo7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHZhbHVlIG9mIG1heFguXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHdpdGhNYXhYKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TWF4WCggbWF4WDogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgdGhpcy5tYXhYID0gbWF4WDtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdmFsdWUgb2YgbWF4WS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gd2l0aE1heFkoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRNYXhZKCBtYXhZOiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICB0aGlzLm1heFkgPSBtYXhZO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB2YWx1ZSBvZiBtYXhaLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiB3aXRoTWF4WigpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHNldE1heFooIG1heFo6IG51bWJlciApOiBCb3VuZHMzIHtcclxuICAgIHRoaXMubWF4WiA9IG1heFo7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHZhbHVlcyBvZiB0aGlzIGJvdW5kcyB0byBiZSBlcXVhbCB0byB0aGUgaW5wdXQgYm91bmRzLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBjb3B5KCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0KCBib3VuZHM6IEJvdW5kczMgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRNaW5NYXgoIGJvdW5kcy5taW5YLCBib3VuZHMubWluWSwgYm91bmRzLm1pblosIGJvdW5kcy5tYXhYLCBib3VuZHMubWF4WSwgYm91bmRzLm1heFogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vZGlmaWVzIHRoaXMgYm91bmRzIHNvIHRoYXQgaXQgY29udGFpbnMgYm90aCBpdHMgb3JpZ2luYWwgYm91bmRzIGFuZCB0aGUgaW5wdXQgYm91bmRzLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiB1bmlvbigpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGluY2x1ZGVCb3VuZHMoIGJvdW5kczogQm91bmRzMyApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiB0aGlzLnNldE1pbk1heChcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWluWCwgYm91bmRzLm1pblggKSxcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWluWSwgYm91bmRzLm1pblkgKSxcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWluWiwgYm91bmRzLm1pblogKSxcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWF4WCwgYm91bmRzLm1heFggKSxcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWF4WSwgYm91bmRzLm1heFkgKSxcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWF4WiwgYm91bmRzLm1heFogKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vZGlmaWVzIHRoaXMgYm91bmRzIHNvIHRoYXQgaXQgaXMgdGhlIGxhcmdlc3QgYm91bmRzIGNvbnRhaW5lZCBib3RoIGluIGl0cyBvcmlnaW5hbCBib3VuZHMgYW5kIGluIHRoZSBpbnB1dCBib3VuZHMuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGludGVyc2VjdGlvbigpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cmFpbkJvdW5kcyggYm91bmRzOiBCb3VuZHMzICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0TWluTWF4KFxyXG4gICAgICBNYXRoLm1heCggdGhpcy5taW5YLCBib3VuZHMubWluWCApLFxyXG4gICAgICBNYXRoLm1heCggdGhpcy5taW5ZLCBib3VuZHMubWluWSApLFxyXG4gICAgICBNYXRoLm1heCggdGhpcy5taW5aLCBib3VuZHMubWluWiApLFxyXG4gICAgICBNYXRoLm1pbiggdGhpcy5tYXhYLCBib3VuZHMubWF4WCApLFxyXG4gICAgICBNYXRoLm1pbiggdGhpcy5tYXhZLCBib3VuZHMubWF4WSApLFxyXG4gICAgICBNYXRoLm1pbiggdGhpcy5tYXhaLCBib3VuZHMubWF4WiApXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW9kaWZpZXMgdGhpcyBib3VuZHMgc28gdGhhdCBpdCBjb250YWlucyBib3RoIGl0cyBvcmlnaW5hbCBib3VuZHMgYW5kIHRoZSBpbnB1dCBwb2ludCAoeCx5LHopLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiB3aXRoQ29vcmRpbmF0ZXMoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRDb29yZGluYXRlcyggeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiB0aGlzLnNldE1pbk1heChcclxuICAgICAgTWF0aC5taW4oIHRoaXMubWluWCwgeCApLFxyXG4gICAgICBNYXRoLm1pbiggdGhpcy5taW5ZLCB5ICksXHJcbiAgICAgIE1hdGgubWluKCB0aGlzLm1pblosIHogKSxcclxuICAgICAgTWF0aC5tYXgoIHRoaXMubWF4WCwgeCApLFxyXG4gICAgICBNYXRoLm1heCggdGhpcy5tYXhZLCB5ICksXHJcbiAgICAgIE1hdGgubWF4KCB0aGlzLm1heFosIHogKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vZGlmaWVzIHRoaXMgYm91bmRzIHNvIHRoYXQgaXQgY29udGFpbnMgYm90aCBpdHMgb3JpZ2luYWwgYm91bmRzIGFuZCB0aGUgaW5wdXQgcG9pbnQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHdpdGhQb2ludCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGFkZFBvaW50KCBwb2ludDogVmVjdG9yMyApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiB0aGlzLmFkZENvb3JkaW5hdGVzKCBwb2ludC54LCBwb2ludC55LCBwb2ludC56ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb2RpZmllcyB0aGlzIGJvdW5kcyBzbyB0aGF0IGl0cyBib3VuZGFyaWVzIGFyZSBpbnRlZ2VyLWFsaWduZWQsIHJvdW5kaW5nIHRoZSBtaW5pbXVtIGJvdW5kYXJpZXMgZG93biBhbmQgdGhlXHJcbiAgICogbWF4aW11bSBib3VuZGFyaWVzIHVwIChleHBhbmRpbmcgYXMgbmVjZXNzYXJ5KS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gcm91bmRlZE91dCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHJvdW5kT3V0KCk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0TWluTWF4KFxyXG4gICAgICBNYXRoLmZsb29yKCB0aGlzLm1pblggKSxcclxuICAgICAgTWF0aC5mbG9vciggdGhpcy5taW5ZICksXHJcbiAgICAgIE1hdGguZmxvb3IoIHRoaXMubWluWiApLFxyXG4gICAgICBNYXRoLmNlaWwoIHRoaXMubWF4WCApLFxyXG4gICAgICBNYXRoLmNlaWwoIHRoaXMubWF4WSApLFxyXG4gICAgICBNYXRoLmNlaWwoIHRoaXMubWF4WiApXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW9kaWZpZXMgdGhpcyBib3VuZHMgc28gdGhhdCBpdHMgYm91bmRhcmllcyBhcmUgaW50ZWdlci1hbGlnbmVkLCByb3VuZGluZyB0aGUgbWluaW11bSBib3VuZGFyaWVzIHVwIGFuZCB0aGVcclxuICAgKiBtYXhpbXVtIGJvdW5kYXJpZXMgZG93biAoY29udHJhY3RpbmcgYXMgbmVjZXNzYXJ5KS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gcm91bmRlZEluKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgcm91bmRJbigpOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiB0aGlzLnNldE1pbk1heChcclxuICAgICAgTWF0aC5jZWlsKCB0aGlzLm1pblggKSxcclxuICAgICAgTWF0aC5jZWlsKCB0aGlzLm1pblkgKSxcclxuICAgICAgTWF0aC5jZWlsKCB0aGlzLm1pblogKSxcclxuICAgICAgTWF0aC5mbG9vciggdGhpcy5tYXhYICksXHJcbiAgICAgIE1hdGguZmxvb3IoIHRoaXMubWF4WSApLFxyXG4gICAgICBNYXRoLmZsb29yKCB0aGlzLm1heFogKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vZGlmaWVzIHRoaXMgYm91bmRzIHNvIHRoYXQgaXQgd291bGQgZnVsbHkgY29udGFpbiBhIHRyYW5zZm9ybWVkIHZlcnNpb24gaWYgaXRzIHByZXZpb3VzIHZhbHVlLCBhcHBseWluZyB0aGVcclxuICAgKiBtYXRyaXggYXMgYW4gYWZmaW5lIHRyYW5zZm9ybWF0aW9uLlxyXG4gICAqXHJcbiAgICogTk9URTogYm91bmRzLnRyYW5zZm9ybSggbWF0cml4ICkudHJhbnNmb3JtKCBpbnZlcnNlICkgbWF5IGJlIGxhcmdlciB0aGFuIHRoZSBvcmlnaW5hbCBib3gsIGlmIGl0IGluY2x1ZGVzXHJcbiAgICogYSByb3RhdGlvbiB0aGF0IGlzbid0IGEgbXVsdGlwbGUgb2YgJFxccGkvMiQuIFRoaXMgaXMgYmVjYXVzZSB0aGUgYm91bmRzIG1heSBleHBhbmQgaW4gYXJlYSB0byBjb3ZlclxyXG4gICAqIEFMTCBvZiB0aGUgY29ybmVycyBvZiB0aGUgdHJhbnNmb3JtZWQgYm91bmRpbmcgYm94LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiB0cmFuc2Zvcm1lZCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICogLy8gVE9ETzogc2hvdWxkIGJlIE1hdHJpeDQgdHlwZSwgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2RvdC9pc3N1ZXMvMTI1XHJcbiAgICovXHJcbiAgcHVibGljIHRyYW5zZm9ybSggbWF0cml4OiBNYXRyaXgzICk6IEJvdW5kczMge1xyXG4gICAgLy8gZG8gbm90aGluZ1xyXG4gICAgaWYgKCB0aGlzLmlzRW1wdHkoKSApIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gb3B0aW1pemF0aW9uIHRvIGJhaWwgZm9yIGlkZW50aXR5IG1hdHJpY2VzXHJcbiAgICBpZiAoIG1hdHJpeC5pc0lkZW50aXR5KCkgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBtaW5YID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xyXG4gICAgbGV0IG1pblkgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XHJcbiAgICBsZXQgbWluWiA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcclxuICAgIGxldCBtYXhYID0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xyXG4gICAgbGV0IG1heFkgPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XHJcbiAgICBsZXQgbWF4WiA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWTtcclxuXHJcbiAgICAvLyB1c2luZyBtdXRhYmxlIHZlY3RvciBzbyB3ZSBkb24ndCBjcmVhdGUgZXhjZXNzaXZlIGluc3RhbmNlcyBvZiBWZWN0b3IyIGR1cmluZyB0aGlzXHJcbiAgICAvLyBtYWtlIHN1cmUgYWxsIDQgY29ybmVycyBhcmUgaW5zaWRlIHRoaXMgdHJhbnNmb3JtZWQgYm91bmRpbmcgYm94XHJcbiAgICBjb25zdCB2ZWN0b3IgPSBuZXcgVmVjdG9yMyggMCwgMCwgMCApO1xyXG5cclxuICAgIGZ1bmN0aW9uIHdpdGhJdCggdmVjdG9yOiBWZWN0b3IzICk6IHZvaWQge1xyXG4gICAgICBtaW5YID0gTWF0aC5taW4oIG1pblgsIHZlY3Rvci54ICk7XHJcbiAgICAgIG1pblkgPSBNYXRoLm1pbiggbWluWSwgdmVjdG9yLnkgKTtcclxuICAgICAgbWluWiA9IE1hdGgubWluKCBtaW5aLCB2ZWN0b3IueiApO1xyXG4gICAgICBtYXhYID0gTWF0aC5tYXgoIG1heFgsIHZlY3Rvci54ICk7XHJcbiAgICAgIG1heFkgPSBNYXRoLm1heCggbWF4WSwgdmVjdG9yLnkgKTtcclxuICAgICAgbWF4WiA9IE1hdGgubWF4KCBtYXhaLCB2ZWN0b3IueiApO1xyXG4gICAgfVxyXG5cclxuICAgIHdpdGhJdCggbWF0cml4Lm11bHRpcGx5VmVjdG9yMyggdmVjdG9yLnNldFhZWiggdGhpcy5taW5YLCB0aGlzLm1pblksIHRoaXMubWluWiApICkgKTtcclxuICAgIHdpdGhJdCggbWF0cml4Lm11bHRpcGx5VmVjdG9yMyggdmVjdG9yLnNldFhZWiggdGhpcy5taW5YLCB0aGlzLm1heFksIHRoaXMubWluWiApICkgKTtcclxuICAgIHdpdGhJdCggbWF0cml4Lm11bHRpcGx5VmVjdG9yMyggdmVjdG9yLnNldFhZWiggdGhpcy5tYXhYLCB0aGlzLm1pblksIHRoaXMubWluWiApICkgKTtcclxuICAgIHdpdGhJdCggbWF0cml4Lm11bHRpcGx5VmVjdG9yMyggdmVjdG9yLnNldFhZWiggdGhpcy5tYXhYLCB0aGlzLm1heFksIHRoaXMubWluWiApICkgKTtcclxuICAgIHdpdGhJdCggbWF0cml4Lm11bHRpcGx5VmVjdG9yMyggdmVjdG9yLnNldFhZWiggdGhpcy5taW5YLCB0aGlzLm1pblksIHRoaXMubWF4WiApICkgKTtcclxuICAgIHdpdGhJdCggbWF0cml4Lm11bHRpcGx5VmVjdG9yMyggdmVjdG9yLnNldFhZWiggdGhpcy5taW5YLCB0aGlzLm1heFksIHRoaXMubWF4WiApICkgKTtcclxuICAgIHdpdGhJdCggbWF0cml4Lm11bHRpcGx5VmVjdG9yMyggdmVjdG9yLnNldFhZWiggdGhpcy5tYXhYLCB0aGlzLm1pblksIHRoaXMubWF4WiApICkgKTtcclxuICAgIHdpdGhJdCggbWF0cml4Lm11bHRpcGx5VmVjdG9yMyggdmVjdG9yLnNldFhZWiggdGhpcy5tYXhYLCB0aGlzLm1heFksIHRoaXMubWF4WiApICkgKTtcclxuICAgIHJldHVybiB0aGlzLnNldE1pbk1heCggbWluWCwgbWluWSwgbWluWiwgbWF4WCwgbWF4WSwgbWF4WiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXhwYW5kcyB0aGlzIGJvdW5kcyBvbiBhbGwgc2lkZXMgYnkgdGhlIHNwZWNpZmllZCBhbW91bnQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGRpbGF0ZWQoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaWxhdGUoIGQ6IG51bWJlciApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiB0aGlzLmRpbGF0ZVhZWiggZCwgZCwgZCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXhwYW5kcyB0aGlzIGJvdW5kcyBob3Jpem9udGFsbHkgKGxlZnQgYW5kIHJpZ2h0KSBieSB0aGUgc3BlY2lmaWVkIGFtb3VudC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gZGlsYXRlZFgoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaWxhdGVYKCB4OiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRNaW5NYXgoIHRoaXMubWluWCAtIHgsIHRoaXMubWluWSwgdGhpcy5taW5aLCB0aGlzLm1heFggKyB4LCB0aGlzLm1heFksIHRoaXMubWF4WiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXhwYW5kcyB0aGlzIGJvdW5kcyB2ZXJ0aWNhbGx5ICh0b3AgYW5kIGJvdHRvbSkgYnkgdGhlIHNwZWNpZmllZCBhbW91bnQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGRpbGF0ZWRZKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgZGlsYXRlWSggeTogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0TWluTWF4KCB0aGlzLm1pblgsIHRoaXMubWluWSAtIHksIHRoaXMubWluWiwgdGhpcy5tYXhYLCB0aGlzLm1heFkgKyB5LCB0aGlzLm1heFogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4cGFuZHMgdGhpcyBib3VuZHMgZGVwdGgtd2lzZSAoZnJvbnQgYW5kIGJhY2spIGJ5IHRoZSBzcGVjaWZpZWQgYW1vdW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBkaWxhdGVkWigpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGRpbGF0ZVooIHo6IG51bWJlciApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiB0aGlzLnNldE1pbk1heCggdGhpcy5taW5YLCB0aGlzLm1pblksIHRoaXMubWluWiAtIHosIHRoaXMubWF4WCwgdGhpcy5tYXhZLCB0aGlzLm1heFogKyB6ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeHBhbmRzIHRoaXMgYm91bmRzIGluZGVwZW5kZW50bHkgYWxvbmcgZWFjaCBheGlzLiBXaWxsIGJlIGVxdWFsIHRvIGNhbGxpbmdcclxuICAgKiBib3VuZHMuZGlsYXRlWCggeCApLmRpbGF0ZVkoIHkgKS5kaWxhdGVaKCB6ICkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGRpbGF0ZWRYWVooKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaWxhdGVYWVooIHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRNaW5NYXgoIHRoaXMubWluWCAtIHgsIHRoaXMubWluWSAtIHksIHRoaXMubWluWiAtIHosIHRoaXMubWF4WCArIHgsIHRoaXMubWF4WSArIHksIHRoaXMubWF4WiArIHogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnRyYWN0cyB0aGlzIGJvdW5kcyBvbiBhbGwgc2lkZXMgYnkgdGhlIHNwZWNpZmllZCBhbW91bnQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGVyb2RlZCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGVyb2RlKCBkOiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gdGhpcy5kaWxhdGUoIC1kICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb250cmFjdHMgdGhpcyBib3VuZHMgaG9yaXpvbnRhbGx5IChsZWZ0IGFuZCByaWdodCkgYnkgdGhlIHNwZWNpZmllZCBhbW91bnQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGVyb2RlZFgoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBlcm9kZVgoIHg6IG51bWJlciApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiB0aGlzLmRpbGF0ZVgoIC14ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb250cmFjdHMgdGhpcyBib3VuZHMgdmVydGljYWxseSAodG9wIGFuZCBib3R0b20pIGJ5IHRoZSBzcGVjaWZpZWQgYW1vdW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBlcm9kZWRZKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgZXJvZGVZKCB5OiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gdGhpcy5kaWxhdGVZKCAteSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udHJhY3RzIHRoaXMgYm91bmRzIGRlcHRoLXdpc2UgKGZyb250IGFuZCBiYWNrKSBieSB0aGUgc3BlY2lmaWVkIGFtb3VudC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gZXJvZGVkWigpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGVyb2RlWiggejogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIHRoaXMuZGlsYXRlWiggLXogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnRyYWN0cyB0aGlzIGJvdW5kcyBpbmRlcGVuZGVudGx5IGFsb25nIGVhY2ggYXhpcy4gV2lsbCBiZSBlcXVhbCB0byBjYWxsaW5nXHJcbiAgICogYm91bmRzLmVyb2RlWCggeCApLmVyb2RlWSggeSApLmVyb2RlWiggeiApLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBlcm9kZWRYWVooKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBlcm9kZVhZWiggeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiB0aGlzLmRpbGF0ZVhZWiggLXgsIC15LCAteiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJhbnNsYXRlcyBvdXIgYm91bmRzIGhvcml6b250YWxseSBieSB4LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBzaGlmdGVkWCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHNoaWZ0WCggeDogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0TWluTWF4KCB0aGlzLm1pblggKyB4LCB0aGlzLm1pblksIHRoaXMubWluWiwgdGhpcy5tYXhYICsgeCwgdGhpcy5tYXhZLCB0aGlzLm1heFogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyYW5zbGF0ZXMgb3VyIGJvdW5kcyB2ZXJ0aWNhbGx5IGJ5IHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHNoaWZ0ZWRZKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyBib3VuZHMsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgYm91bmRzIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgc2hpZnRZKCB5OiBudW1iZXIgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRNaW5NYXgoIHRoaXMubWluWCwgdGhpcy5taW5ZICsgeSwgdGhpcy5taW5aLCB0aGlzLm1heFgsIHRoaXMubWF4WSArIHksIHRoaXMubWF4WiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJhbnNsYXRlcyBvdXIgYm91bmRzIGRlcHRoLXdpc2UgYnkgei5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2hpZnRlZFooKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGJvdW5kcywgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyBib3VuZHMgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzaGlmdFooIHo6IG51bWJlciApOiBCb3VuZHMzIHtcclxuICAgIHJldHVybiB0aGlzLnNldE1pbk1heCggdGhpcy5taW5YLCB0aGlzLm1pblksIHRoaXMubWluWiArIHosIHRoaXMubWF4WCwgdGhpcy5tYXhZLCB0aGlzLm1heFogKyB6ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmFuc2xhdGVzIG91ciBib3VuZHMgYnkgKHgseSx6KS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2hpZnRlZCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgYm91bmRzLCBpbiBhZGRpdGlvbiB0byByZXR1cm5pbmdcclxuICAgKiB0aGlzIGJvdW5kcyBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHNoaWZ0WFlaKCB4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0TWluTWF4KCB0aGlzLm1pblggKyB4LCB0aGlzLm1pblkgKyB5LCB0aGlzLm1pblogKyB6LCB0aGlzLm1heFggKyB4LCB0aGlzLm1heFkgKyB5LCB0aGlzLm1heFogKyB6ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmFuc2xhdGVzIG91ciBib3VuZHMgYnkgdGhlIGdpdmVuIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgc2hpZnQoIHY6IFZlY3RvcjMgKTogQm91bmRzMyB7XHJcbiAgICByZXR1cm4gdGhpcy5zaGlmdFhZWiggdi54LCB2LnksIHYueiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5ldyBCb3VuZHMzIG9iamVjdCwgd2l0aCB0aGUgY3Vib2lkICgzZCByZWN0YW5nbGUpIGNvbnN0cnVjdGlvbiB3aXRoIHgsIHksIHosIHdpZHRoLCBoZWlnaHQgYW5kIGRlcHRoLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHggLSBUaGUgbWluaW11bSB2YWx1ZSBvZiBYIGZvciB0aGUgYm91bmRzLlxyXG4gICAqIEBwYXJhbSB5IC0gVGhlIG1pbmltdW0gdmFsdWUgb2YgWSBmb3IgdGhlIGJvdW5kcy5cclxuICAgKiBAcGFyYW0geiAtIFRoZSBtaW5pbXVtIHZhbHVlIG9mIFogZm9yIHRoZSBib3VuZHMuXHJcbiAgICogQHBhcmFtIHdpZHRoIC0gVGhlIHdpZHRoIChtYXhYIC0gbWluWCkgb2YgdGhlIGJvdW5kcy5gXHJcbiAgICogQHBhcmFtIGhlaWdodCAtIFRoZSBoZWlnaHQgKG1heFkgLSBtaW5ZKSBvZiB0aGUgYm91bmRzLlxyXG4gICAqIEBwYXJhbSBkZXB0aCAtIFRoZSBkZXB0aCAobWF4WiAtIG1pblopIG9mIHRoZSBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBjdWJvaWQoIHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBkZXB0aDogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIG5ldyBCb3VuZHMzKCB4LCB5LCB6LCB4ICsgd2lkdGgsIHkgKyBoZWlnaHQsIHogKyBkZXB0aCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5ldyBCb3VuZHMzIG9iamVjdCB0aGF0IG9ubHkgY29udGFpbnMgdGhlIHNwZWNpZmllZCBwb2ludCAoeCx5LHopLiBVc2VmdWwgZm9yIGJlaW5nIGRpbGF0ZWQgdG8gZm9ybSBhXHJcbiAgICogYm91bmRpbmcgYm94IGFyb3VuZCBhIHBvaW50LiBOb3RlIHRoYXQgdGhlIGJvdW5kcyB3aWxsIG5vdCBiZSBcImVtcHR5XCIgYXMgaXQgY29udGFpbnMgKHgseSx6KSwgYnV0IGl0IHdpbGwgaGF2ZVxyXG4gICAqIHplcm8gYXJlYS5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHBvaW50KCB4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyICk6IEJvdW5kczMge1xyXG4gICAgcmV0dXJuIG5ldyBCb3VuZHMzKCB4LCB5LCB6LCB4LCB5LCB6ICk7XHJcbiAgfVxyXG5cclxuICAvLyBIZWxwcyB0byBpZGVudGlmeSB0aGUgZGltZW5zaW9uIG9mIHRoZSBib3VuZHNcclxuICBwdWJsaWMgcmVhZG9ubHkgaXNCb3VuZHMgPSB0cnVlO1xyXG4gIHB1YmxpYyByZWFkb25seSBkaW1lbnNpb24gPSAzO1xyXG5cclxuICAvKipcclxuICAgKiBBIGNvbnN0YW50IEJvdW5kczMgd2l0aCBtaW5pbXVtcyA9ICRcXGluZnR5JCwgbWF4aW11bXMgPSAkLVxcaW5mdHkkLCBzbyB0aGF0IGl0IHJlcHJlc2VudHMgXCJubyBib3VuZHMgd2hhdHNvZXZlclwiLlxyXG4gICAqXHJcbiAgICogVGhpcyBhbGxvd3MgdXMgdG8gdGFrZSB0aGUgdW5pb24gKHVuaW9uL2luY2x1ZGVCb3VuZHMpIG9mIHRoaXMgYW5kIGFueSBvdGhlciBCb3VuZHMzIHRvIGdldCB0aGUgb3RoZXIgYm91bmRzIGJhY2ssXHJcbiAgICogZS5nLiBCb3VuZHMzLk5PVEhJTkcudW5pb24oIGJvdW5kcyApLmVxdWFscyggYm91bmRzICkuIFRoaXMgb2JqZWN0IG5hdHVyYWxseSBzZXJ2ZXMgYXMgdGhlIGJhc2UgY2FzZSBhcyBhIHVuaW9uIG9mXHJcbiAgICogemVybyBib3VuZHMgb2JqZWN0cy5cclxuICAgKlxyXG4gICAqIEFkZGl0aW9uYWxseSwgaW50ZXJzZWN0aW9ucyB3aXRoIE5PVEhJTkcgd2lsbCBhbHdheXMgcmV0dXJuIGEgQm91bmRzMyBlcXVpdmFsZW50IHRvIE5PVEhJTkcuXHJcbiAgICpcclxuICAgKiBAY29uc3RhbnQge0JvdW5kczN9IE5PVEhJTkdcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IE5PVEhJTkcgPSBuZXcgQm91bmRzMyggTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksIE51bWJlci5QT1NJVElWRV9JTkZJTklUWSwgTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLCBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksIE51bWJlci5ORUdBVElWRV9JTkZJTklUWSApO1xyXG5cclxuICAvKipcclxuICAgKiBBIGNvbnN0YW50IEJvdW5kczMgd2l0aCBtaW5pbXVtcyA9ICQtXFxpbmZ0eSQsIG1heGltdW1zID0gJFxcaW5mdHkkLCBzbyB0aGF0IGl0IHJlcHJlc2VudHMgXCJhbGwgYm91bmRzXCIuXHJcbiAgICpcclxuICAgKiBUaGlzIGFsbG93cyB1cyB0byB0YWtlIHRoZSBpbnRlcnNlY3Rpb24gKGludGVyc2VjdGlvbi9jb25zdHJhaW5Cb3VuZHMpIG9mIHRoaXMgYW5kIGFueSBvdGhlciBCb3VuZHMzIHRvIGdldCB0aGVcclxuICAgKiBvdGhlciBib3VuZHMgYmFjaywgZS5nLiBCb3VuZHMzLkVWRVJZVEhJTkcuaW50ZXJzZWN0aW9uKCBib3VuZHMgKS5lcXVhbHMoIGJvdW5kcyApLiBUaGlzIG9iamVjdCBuYXR1cmFsbHkgc2VydmVzIGFzXHJcbiAgICogdGhlIGJhc2UgY2FzZSBhcyBhbiBpbnRlcnNlY3Rpb24gb2YgemVybyBib3VuZHMgb2JqZWN0cy5cclxuICAgKlxyXG4gICAqIEFkZGl0aW9uYWxseSwgdW5pb25zIHdpdGggRVZFUllUSElORyB3aWxsIGFsd2F5cyByZXR1cm4gYSBCb3VuZHMzIGVxdWl2YWxlbnQgdG8gRVZFUllUSElORy5cclxuICAgKlxyXG4gICAqIEBjb25zdGFudCB7Qm91bmRzM30gRVZFUllUSElOR1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgRVZFUllUSElORyA9IG5ldyBCb3VuZHMzKCBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksIE51bWJlci5ORUdBVElWRV9JTkZJTklUWSwgTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksIE51bWJlci5QT1NJVElWRV9JTkZJTklUWSwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZICk7XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQm91bmRzM0lPID0gbmV3IElPVHlwZSggJ0JvdW5kczNJTycsIHtcclxuICAgIHZhbHVlVHlwZTogQm91bmRzMyxcclxuICAgIGRvY3VtZW50YXRpb246ICdhIDMtZGltZW5zaW9uYWwgYm91bmRzIChib3VuZGluZyBib3gpJyxcclxuICAgIHN0YXRlU2NoZW1hOiB7XHJcbiAgICAgIG1pblg6IE51bWJlcklPLCBtaW5ZOiBOdW1iZXJJTywgbWluWjogTnVtYmVySU8sXHJcbiAgICAgIG1heFg6IE51bWJlcklPLCBtYXhZOiBOdW1iZXJJTywgbWF4WjogTnVtYmVySU9cclxuICAgIH0sXHJcbiAgICB0b1N0YXRlT2JqZWN0OiBib3VuZHMzID0+ICgge1xyXG4gICAgICBtaW5YOiBib3VuZHMzLm1pblgsIG1pblk6IGJvdW5kczMubWluWSwgbWluWjogYm91bmRzMy5taW5aLFxyXG4gICAgICBtYXhYOiBib3VuZHMzLm1heFgsIG1heFk6IGJvdW5kczMubWF4WSwgbWF4WjogYm91bmRzMy5tYXhaXHJcbiAgICB9ICksXHJcbiAgICBmcm9tU3RhdGVPYmplY3Q6IHN0YXRlT2JqZWN0ID0+IG5ldyBCb3VuZHMzKFxyXG4gICAgICBzdGF0ZU9iamVjdC5taW5YLCBzdGF0ZU9iamVjdC5taW5ZLCBzdGF0ZU9iamVjdC5taW5aLFxyXG4gICAgICBzdGF0ZU9iamVjdC5tYXhYLCBzdGF0ZU9iamVjdC5tYXhZLCBzdGF0ZU9iamVjdC5tYXhaXHJcbiAgICApXHJcbiAgfSApO1xyXG59XHJcblxyXG5kb3QucmVnaXN0ZXIoICdCb3VuZHMzJywgQm91bmRzMyApO1xyXG5cclxuUG9vbGFibGUubWl4SW50byggQm91bmRzMywge1xyXG4gIGluaXRpYWxpemU6IEJvdW5kczMucHJvdG90eXBlLnNldE1pbk1heFxyXG59ICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBCb3VuZHMzOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVB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QUFDO0VBQzFEOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTc0QsUUFBUUEsQ0FBRXpFLElBQVksRUFBWTtJQUN2QyxPQUFPLElBQUlGLE9BQU8sQ0FBRUUsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSyxDQUFDO0VBQ25GOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTcUUsUUFBUUEsQ0FBRXpFLElBQVksRUFBWTtJQUN2QyxPQUFPLElBQUlILE9BQU8sQ0FBRSxJQUFJLENBQUNFLElBQUksRUFBRUMsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSyxDQUFDO0VBQ25GOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTc0UsUUFBUUEsQ0FBRXpFLElBQVksRUFBWTtJQUN2QyxPQUFPLElBQUlKLE9BQU8sQ0FBRSxJQUFJLENBQUNFLElBQUksRUFBRSxJQUFJLENBQUNDLElBQUksRUFBRUMsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSyxDQUFDO0VBQ25GOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTdUUsUUFBUUEsQ0FBRXpFLElBQVksRUFBWTtJQUN2QyxPQUFPLElBQUlMLE9BQU8sQ0FBRSxJQUFJLENBQUNFLElBQUksRUFBRSxJQUFJLENBQUNDLElBQUksRUFBRSxJQUFJLENBQUNDLElBQUksRUFBRUMsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSSxFQUFFLElBQUksQ0FBQ0MsSUFBSyxDQUFDO0VBQ25GOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTd0UsUUFBUUEsQ0FBRXpF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QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQXVCd0IsVUFBVSxHQUFHLElBQUlsSixPQUFPLENBQUV3SCxNQUFNLENBQUNFLGlCQUFpQixFQUFFRixNQUFNLENBQUNFLGlCQUFpQixFQUFFRixNQUFNLENBQUNFLGlCQUFpQixFQUFFRixNQUFNLENBQUNDLGlCQUFpQixFQUFFRCxNQUFNLENBQUNDLGlCQUFpQixFQUFFRCxNQUFNLENBQUNDLGlCQUFrQixDQUFDO0VBRTdNLE9BQXVCMEIsU0FBUyxHQUFHLElBQUl2SixNQUFNLENBQUUsV0FBVyxFQUFFO0lBQzFEd0osU0FBUyxFQUFFcEosT0FBTztJQUNsQnFKLGFBQWEsRUFBRSx1Q0FBdUM7SUFDdERDLFdBQVcsRUFBRTtNQUNYcEosSUFBSSxFQUFFTCxRQUFRO01BQUVNLElBQUksRUFBRU4sUUFBUTtNQUFFTyxJQUFJLEVBQUVQLFFBQVE7TUFDOUNRLElBQUksRUFBRVIsUUFBUTtNQUFFUyxJQUFJLEVBQUVULFFBQVE7TUFBRVUsSUFBSSxFQUFFVjtJQUN4QyxDQUFDO0lBQ0QwSixhQUFhLEVBQUVDLE9BQU8sS0FBTTtNQUMxQnRKLElBQUksRUFBRXNKLE9BQU8sQ0FBQ3RKLElBQUk7TUFBRUMsSUFBSSxFQUFFcUosT0FBTyxDQUFDckosSUFBSTtNQUFFQyxJQUFJLEVBQUVvSixPQUFPLENBQUNwSixJQUFJO01BQzFEQyxJQUFJLEVBQUVtSixPQUFPLENBQUNuSixJQUFJO01BQUVDLElBQUksRUFBRWtKLE9BQU8sQ0FBQ2xKLElBQUk7TUFBRUMsSUFBSSxFQUFFaUosT0FBTyxDQUFDako7SUFDeEQsQ0FBQyxDQUFFO0lBQ0hrSixlQUFlLEVBQUVDLFdBQVcsSUFBSSxJQUFJMUosT0FBTyxDQUN6QzBKLFdBQVcsQ0FBQ3hKLElBQUksRUFBRXdKLFdBQVcsQ0FBQ3ZKLElBQUksRUFBRXVKLFdBQVcsQ0FBQ3RKLElBQUksRUFDcERzSixXQUFXLENBQUNySixJQUFJLEVBQUVxSixXQUFXLENBQUNwSixJQUFJLEVBQUVvSixXQUFXLENBQUNuSixJQUNsRDtFQUNGLENBQUUsQ0FBQztBQUNMO0FBRUFULEdBQUcsQ0FBQzZKLFFBQVEsQ0FBRSxTQUFTLEVBQUUzSixPQUFRLENBQUM7QUFFbENMLFFBQVEsQ0FBQ2lLLE9BQU8sQ0FBRTVKLE9BQU8sRUFBRTtFQUN6QjZKLFVBQVUsRUFBRTdKLE9BQU8sQ0FBQzhKLFNBQVMsQ0FBQ3BEO0FBQ2hDLENBQUUsQ0FBQztBQUVILGVBQWUxRyxPQUFPIiwiaWdub3JlTGlzdCI6W119