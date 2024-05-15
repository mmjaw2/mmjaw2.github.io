// Copyright 2013-2024, University of Colorado Boulder

/**
 * Basic 4-dimensional vector, represented as (x,y).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Utils from './Utils.js';
import Vector3 from './Vector3.js';
import dot from './dot.js';
import Pool from '../../phet-core/js/Pool.js';
export default class Vector4 {
  // The X coordinate of the vector.

  // The Y coordinate of the vector.

  // The Z coordinate of the vector.

  // The W coordinate of the vector.

  /**
   * Creates a 4-dimensional vector with the specified X, Y, Z and W values.
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param z - Z coordinate
   * @param w - W coordinate
   */
  constructor(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  /**
   * The magnitude (Euclidean/L2 Norm) of this vector, i.e. $\sqrt{x^2+y^2+z^2+w^2}$.
   */
  getMagnitude() {
    return Math.sqrt(this.magnitudeSquared);
  }
  get magnitude() {
    return this.getMagnitude();
  }

  /**
   * The squared magnitude (square of the Euclidean/L2 Norm) of this vector, i.e. $x^2+y^2+z^2+w^2$.
   */
  getMagnitudeSquared() {
    return this.dot(this);
  }
  get magnitudeSquared() {
    return this.getMagnitudeSquared();
  }

  /**
   * The Euclidean distance between this vector (treated as a point) and another point.
   */
  distance(point) {
    return this.minus(point).magnitude;
  }

  /**
   * The Euclidean distance between this vector (treated as a point) and another point (x,y,z,w).
   */
  distanceXYZW(x, y, z, w) {
    const dx = this.x - x;
    const dy = this.y - y;
    const dz = this.z - z;
    const dw = this.w - w;
    return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
  }

  /**
   * The squared Euclidean distance between this vector (treated as a point) and another point.
   */
  distanceSquared(point) {
    return this.minus(point).magnitudeSquared;
  }

  /**
   * The squared Euclidean distance between this vector (treated as a point) and another point (x,y,z,w).
   */
  distanceSquaredXYZW(x, y, z, w) {
    const dx = this.x - x;
    const dy = this.y - y;
    const dz = this.z - z;
    const dw = this.w - w;
    return dx * dx + dy * dy + dz * dz + dw * dw;
  }

  /**
   * The dot-product (Euclidean inner product) between this vector and another vector v.
   */
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
  }

  /**
   * The dot-product (Euclidean inner product) between this vector and another vector (x,y,z,w).
   */
  dotXYZW(x, y, z, w) {
    return this.x * x + this.y * y + this.z * z + this.w * w;
  }

  /**
   * The angle between this vector and another vector, in the range $\theta\in[0, \pi]$.
   *
   * Equal to $\theta = \cos^{-1}( \hat{u} \cdot \hat{v} )$ where $\hat{u}$ is this vector (normalized) and $\hat{v}$
   * is the input vector (normalized).
   */
  angleBetween(v) {
    // @ts-expect-error TODO: import with circular protection https://github.com/phetsims/dot/issues/96
    return Math.acos(dot.clamp(this.normalized().dot(v.normalized()), -1, 1));
  }

  /**
   * Exact equality comparison between this vector and another vector.
   *
   * @param other
   * @returns - Whether the two vectors have equal components
   */
  equals(other) {
    return this.x === other.x && this.y === other.y && this.z === other.z && this.w === other.w;
  }

  /**
   * Approximate equality comparison between this vector and another vector.
   *
   * @returns - Whether difference between the two vectors has no component with an absolute value greater
   *                      than epsilon.
   */
  equalsEpsilon(other, epsilon) {
    if (!epsilon) {
      epsilon = 0;
    }
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y) + Math.abs(this.z - other.z) + Math.abs(this.w - other.w) <= epsilon;
  }

  /**
   * Returns false if any component is NaN, infinity, or -infinity. Otherwise returns true.
   */
  isFinite() {
    return isFinite(this.x) && isFinite(this.y) && isFinite(this.z) && isFinite(this.w);
  }

  /*---------------------------------------------------------------------------*
   * Immutables
   *---------------------------------------------------------------------------*/

  /**
   * Creates a copy of this vector, or if a vector is passed in, set that vector's values to ours.
   *
   * This is the immutable form of the function set(), if a vector is provided. This will return a new vector, and
   * will not modify this vector.
   *
   * @param  [vector] - If not provided, creates a v4 with filled in values. Otherwise, fills in the
   *                    values of the provided vector so that it equals this vector.
   */
  copy(vector) {
    if (vector) {
      return vector.set(this);
    } else {
      return v4(this.x, this.y, this.z, this.w);
    }
  }

  /**
   * Normalized (re-scaled) copy of this vector such that its magnitude is 1. If its initial magnitude is zero, an
   * error is thrown.
   *
   * This is the immutable form of the function normalize(). This will return a new vector, and will not modify this
   * vector.
   */
  normalized() {
    const magnitude = this.magnitude;
    assert && assert(magnitude !== 0, 'Cannot normalize a zero-magnitude vector');
    return this.dividedScalar(magnitude);
  }

  /**
   * Returns a copy of this vector with each component rounded by Utils.roundSymmetric.
   *
   * This is the immutable form of the function roundSymmetric(). This will return a new vector, and will not modify
   * this vector.
   */
  roundedSymmetric() {
    return this.copy().roundSymmetric();
  }

  /**
   * Re-scaled copy of this vector such that it has the desired magnitude. If its initial magnitude is zero, an error
   * is thrown. If the passed-in magnitude is negative, the direction of the resulting vector will be reversed.
   *
   * This is the immutable form of the function setMagnitude(). This will return a new vector, and will not modify
   * this vector.
   *
   */
  withMagnitude(magnitude) {
    return this.copy().setMagnitude(magnitude);
  }

  /**
   * Copy of this vector, scaled by the desired scalar value.
   *
   * This is the immutable form of the function multiplyScalar(). This will return a new vector, and will not modify
   * this vector.
   */
  timesScalar(scalar) {
    return v4(this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar);
  }

  /**
   * Same as timesScalar.
   *
   * This is the immutable form of the function multiply(). This will return a new vector, and will not modify
   * this vector.
   */
  times(scalar) {
    return this.timesScalar(scalar);
  }

  /**
   * Copy of this vector, multiplied component-wise by the passed-in vector v.
   *
   * This is the immutable form of the function componentMultiply(). This will return a new vector, and will not modify
   * this vector.
   */
  componentTimes(v) {
    return v4(this.x * v.x, this.y * v.y, this.z * v.z, this.w * v.w);
  }

  /**
   * Addition of this vector and another vector, returning a copy.
   *
   * This is the immutable form of the function add(). This will return a new vector, and will not modify
   * this vector.
   */
  plus(v) {
    return v4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
  }

  /**
   * Addition of this vector and another vector (x,y,z,w), returning a copy.
   *
   * This is the immutable form of the function addXYZW(). This will return a new vector, and will not modify
   * this vector.
   */
  plusXYZW(x, y, z, w) {
    return v4(this.x + x, this.y + y, this.z + z, this.w + w);
  }

  /**
   * Addition of this vector with a scalar (adds the scalar to every component), returning a copy.
   *
   * This is the immutable form of the function addScalar(). This will return a new vector, and will not modify
   * this vector.
   */
  plusScalar(scalar) {
    return v4(this.x + scalar, this.y + scalar, this.z + scalar, this.w + scalar);
  }

  /**
   * Subtraction of this vector by another vector v, returning a copy.
   *
   * This is the immutable form of the function subtract(). This will return a new vector, and will not modify
   * this vector.
   */
  minus(v) {
    return v4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
  }

  /**
   * Subtraction of this vector by another vector (x,y,z,w), returning a copy.
   *
   * This is the immutable form of the function subtractXYZW(). This will return a new vector, and will not modify
   * this vector.
   */
  minusXYZW(x, y, z, w) {
    return v4(this.x - x, this.y - y, this.z - z, this.w - w);
  }

  /**
   * Subtraction of this vector by a scalar (subtracts the scalar from every component), returning a copy.
   *
   * This is the immutable form of the function subtractScalar(). This will return a new vector, and will not modify
   * this vector.
   */
  minusScalar(scalar) {
    return v4(this.x - scalar, this.y - scalar, this.z - scalar, this.w - scalar);
  }

  /**
   * Division of this vector by a scalar (divides every component by the scalar), returning a copy.
   *
   * This is the immutable form of the function divideScalar(). This will return a new vector, and will not modify
   * this vector.
   */
  dividedScalar(scalar) {
    return v4(this.x / scalar, this.y / scalar, this.z / scalar, this.w / scalar);
  }

  /**
   * Negated copy of this vector (multiplies every component by -1).
   *
   * This is the immutable form of the function negate(). This will return a new vector, and will not modify
   * this vector.
   *
   */
  negated() {
    return v4(-this.x, -this.y, -this.z, -this.w);
  }

  /**
   * A linear interpolation between this vector (ratio=0) and another vector (ratio=1).
   *
   * @param vector
   * @param ratio - Not necessarily constrained in [0, 1]
   */
  blend(vector, ratio) {
    return this.plus(vector.minus(this).times(ratio));
  }

  /**
   * The average (midpoint) between this vector and another vector.
   */
  average(vector) {
    return this.blend(vector, 0.5);
  }

  /**
   * Debugging string for the vector.
   */
  toString() {
    return `Vector4(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
  }

  /**
   * Converts this to a 3-dimensional vector, discarding the w-component.
   */
  toVector3() {
    return new Vector3(this.x, this.y, this.z);
  }

  /*---------------------------------------------------------------------------*
   * Mutables
   * - all mutation should go through setXYZW / setX / setY / setZ / setW
   *---------------------------------------------------------------------------*/

  /**
   * Sets all of the components of this vector, returning this.
   */
  setXYZW(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  /**
   * Sets the x-component of this vector, returning this.
   */
  setX(x) {
    this.x = x;
    return this;
  }

  /**
   * Sets the y-component of this vector, returning this.
   */
  setY(y) {
    this.y = y;
    return this;
  }

  /**
   * Sets the z-component of this vector, returning this.
   */
  setZ(z) {
    this.z = z;
    return this;
  }

  /**
   * Sets the w-component of this vector, returning this.
   */
  setW(w) {
    this.w = w;
    return this;
  }

  /**
   * Sets this vector to be a copy of another vector.
   *
   * This is the mutable form of the function copy(). This will mutate (change) this vector, in addition to returning
   * this vector itself.
   */
  set(v) {
    return this.setXYZW(v.x, v.y, v.z, v.w);
  }

  /**
   * Sets the magnitude of this vector. If the passed-in magnitude is negative, this flips the vector and sets its
   * magnitude to abs( magnitude ).
   *
   * This is the mutable form of the function withMagnitude(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  setMagnitude(magnitude) {
    const scale = magnitude / this.magnitude;
    return this.multiplyScalar(scale);
  }

  /**
   * Adds another vector to this vector, changing this vector.
   *
   * This is the mutable form of the function plus(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  add(v) {
    return this.setXYZW(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
  }

  /**
   * Adds another vector (x,y,z,w) to this vector, changing this vector.
   *
   * This is the mutable form of the function plusXYZW(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  addXYZW(x, y, z, w) {
    return this.setXYZW(this.x + x, this.y + y, this.z + z, this.w + w);
  }

  /**
   * Adds a scalar to this vector (added to every component), changing this vector.
   *
   * This is the mutable form of the function plusScalar(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  addScalar(scalar) {
    return this.setXYZW(this.x + scalar, this.y + scalar, this.z + scalar, this.w + scalar);
  }

  /**
   * Subtracts this vector by another vector, changing this vector.
   *
   * This is the mutable form of the function minus(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  subtract(v) {
    return this.setXYZW(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
  }

  /**
   * Subtracts this vector by another vector (x,y,z,w), changing this vector.
   *
   * This is the mutable form of the function minusXYZW(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  subtractXYZW(x, y, z, w) {
    return this.setXYZW(this.x - x, this.y - y, this.z - z, this.w - w);
  }

  /**
   * Subtracts this vector by a scalar (subtracts each component by the scalar), changing this vector.
   *
   * This is the mutable form of the function minusScalar(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  subtractScalar(scalar) {
    return this.setXYZW(this.x - scalar, this.y - scalar, this.z - scalar, this.w - scalar);
  }

  /**
   * Multiplies this vector by a scalar (multiplies each component by the scalar), changing this vector.
   *
   * This is the mutable form of the function timesScalar(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  multiplyScalar(scalar) {
    return this.setXYZW(this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar);
  }

  /**
   * Multiplies this vector by a scalar (multiplies each component by the scalar), changing this vector.
   * Same as multiplyScalar.
   *
   * This is the mutable form of the function times(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  multiply(scalar) {
    return this.multiplyScalar(scalar);
  }

  /**
   * Multiplies this vector by another vector component-wise, changing this vector.
   *
   * This is the mutable form of the function componentTimes(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  componentMultiply(v) {
    return this.setXYZW(this.x * v.x, this.y * v.y, this.z * v.z, this.w * v.w);
  }

  /**
   * Divides this vector by a scalar (divides each component by the scalar), changing this vector.
   *
   * This is the mutable form of the function dividedScalar(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  divideScalar(scalar) {
    return this.setXYZW(this.x / scalar, this.y / scalar, this.z / scalar, this.w / scalar);
  }

  /**
   * Negates this vector (multiplies each component by -1), changing this vector.
   *
   * This is the mutable form of the function negated(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  negate() {
    return this.setXYZW(-this.x, -this.y, -this.z, -this.w);
  }

  /**
   * Normalizes this vector (rescales to where the magnitude is 1), changing this vector.
   *
   * This is the mutable form of the function normalized(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  normalize() {
    const mag = this.magnitude;
    if (mag === 0) {
      throw new Error('Cannot normalize a zero-magnitude vector');
    }
    return this.divideScalar(mag);
  }

  /**
   * Rounds each component of this vector with Utils.roundSymmetric.
   *
   * This is the mutable form of the function roundedSymmetric(). This will mutate (change) this vector, in addition
   * to returning the vector itself.
   */
  roundSymmetric() {
    return this.setXYZW(Utils.roundSymmetric(this.x), Utils.roundSymmetric(this.y), Utils.roundSymmetric(this.z), Utils.roundSymmetric(this.w));
  }
  freeToPool() {
    Vector4.pool.freeToPool(this);
  }
  static pool = new Pool(Vector4, {
    maxSize: 1000,
    initialize: Vector4.prototype.setXYZW,
    defaultArguments: [0, 0, 0, 0]
  });

  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
}

// (read-only) - Helps to identify the dimension of the vector
Vector4.prototype.isVector4 = true;
Vector4.prototype.dimension = 4;
dot.register('Vector4', Vector4);
const v4 = Vector4.pool.create.bind(Vector4.pool);
dot.register('v4', v4);
class ImmutableVector4 extends Vector4 {
  /**
   * Throw errors whenever a mutable method is called on our immutable vector
   */
  static mutableOverrideHelper(mutableFunctionName) {
    ImmutableVector4.prototype[mutableFunctionName] = () => {
      throw new Error(`Cannot call mutable method '${mutableFunctionName}' on immutable Vector3`);
    };
  }
}
ImmutableVector4.mutableOverrideHelper('setXYZW');
ImmutableVector4.mutableOverrideHelper('setX');
ImmutableVector4.mutableOverrideHelper('setY');
ImmutableVector4.mutableOverrideHelper('setZ');
ImmutableVector4.mutableOverrideHelper('setW');
Vector4.ZERO = assert ? new ImmutableVector4(0, 0, 0, 0) : new Vector4(0, 0, 0, 0);
Vector4.X_UNIT = assert ? new ImmutableVector4(1, 0, 0, 0) : new Vector4(1, 0, 0, 0);
Vector4.Y_UNIT = assert ? new ImmutableVector4(0, 1, 0, 0) : new Vector4(0, 1, 0, 0);
Vector4.Z_UNIT = assert ? new ImmutableVector4(0, 0, 1, 0) : new Vector4(0, 0, 1, 0);
Vector4.W_UNIT = assert ? new ImmutableVector4(0, 0, 0, 1) : new Vector4(0, 0, 0, 1);
export { v4 };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJVdGlscyIsIlZlY3RvcjMiLCJkb3QiLCJQb29sIiwiVmVjdG9yNCIsImNvbnN0cnVjdG9yIiwieCIsInkiLCJ6IiwidyIsImdldE1hZ25pdHVkZSIsIk1hdGgiLCJzcXJ0IiwibWFnbml0dWRlU3F1YXJlZCIsIm1hZ25pdHVkZSIsImdldE1hZ25pdHVkZVNxdWFyZWQiLCJkaXN0YW5jZSIsInBvaW50IiwibWludXMiLCJkaXN0YW5jZVhZWlciLCJkeCIsImR5IiwiZHoiLCJkdyIsImRpc3RhbmNlU3F1YXJlZCIsImRpc3RhbmNlU3F1YXJlZFhZWlciLCJ2IiwiZG90WFlaVyIsImFuZ2xlQmV0d2VlbiIsImFjb3MiLCJjbGFtcCIsIm5vcm1hbGl6ZWQiLCJlcXVhbHMiLCJvdGhlciIsImVxdWFsc0Vwc2lsb24iLCJlcHNpbG9uIiwiYWJzIiwiaXNGaW5pdGUiLCJjb3B5IiwidmVjdG9yIiwic2V0IiwidjQiLCJhc3NlcnQiLCJkaXZpZGVkU2NhbGFyIiwicm91bmRlZFN5bW1ldHJpYyIsInJvdW5kU3ltbWV0cmljIiwid2l0aE1hZ25pdHVkZSIsInNldE1hZ25pdHVkZSIsInRpbWVzU2NhbGFyIiwic2NhbGFyIiwidGltZXMiLCJjb21wb25lbnRUaW1lcyIsInBsdXMiLCJwbHVzWFlaVyIsInBsdXNTY2FsYXIiLCJtaW51c1hZWlciLCJtaW51c1NjYWxhciIsIm5lZ2F0ZWQiLCJibGVuZCIsInJhdGlvIiwiYXZlcmFnZSIsInRvU3RyaW5nIiwidG9WZWN0b3IzIiwic2V0WFlaVyIsInNldFgiLCJzZXRZIiwic2V0WiIsInNldFciLCJzY2FsZSIsIm11bHRpcGx5U2NhbGFyIiwiYWRkIiwiYWRkWFlaVyIsImFkZFNjYWxhciIsInN1YnRyYWN0Iiwic3VidHJhY3RYWVpXIiwic3VidHJhY3RTY2FsYXIiLCJtdWx0aXBseSIsImNvbXBvbmVudE11bHRpcGx5IiwiZGl2aWRlU2NhbGFyIiwibmVnYXRlIiwibm9ybWFsaXplIiwibWFnIiwiRXJyb3IiLCJmcmVlVG9Qb29sIiwicG9vbCIsIm1heFNpemUiLCJpbml0aWFsaXplIiwicHJvdG90eXBlIiwiZGVmYXVsdEFyZ3VtZW50cyIsImlzVmVjdG9yNCIsImRpbWVuc2lvbiIsInJlZ2lzdGVyIiwiY3JlYXRlIiwiYmluZCIsIkltbXV0YWJsZVZlY3RvcjQiLCJtdXRhYmxlT3ZlcnJpZGVIZWxwZXIiLCJtdXRhYmxlRnVuY3Rpb25OYW1lIiwiWkVSTyIsIlhfVU5JVCIsIllfVU5JVCIsIlpfVU5JVCIsIldfVU5JVCJdLCJzb3VyY2VzIjpbIlZlY3RvcjQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQmFzaWMgNC1kaW1lbnNpb25hbCB2ZWN0b3IsIHJlcHJlc2VudGVkIGFzICh4LHkpLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IFV0aWxzIGZyb20gJy4vVXRpbHMuanMnO1xyXG5pbXBvcnQgVmVjdG9yMyBmcm9tICcuL1ZlY3RvcjMuanMnO1xyXG5pbXBvcnQgZG90IGZyb20gJy4vZG90LmpzJztcclxuaW1wb3J0IFBvb2wsIHsgVFBvb2xhYmxlIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL1Bvb2wuanMnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVmVjdG9yNCBpbXBsZW1lbnRzIFRQb29sYWJsZSB7XHJcblxyXG4gIC8vIFRoZSBYIGNvb3JkaW5hdGUgb2YgdGhlIHZlY3Rvci5cclxuICBwdWJsaWMgeDogbnVtYmVyO1xyXG5cclxuICAvLyBUaGUgWSBjb29yZGluYXRlIG9mIHRoZSB2ZWN0b3IuXHJcbiAgcHVibGljIHk6IG51bWJlcjtcclxuXHJcbiAgLy8gVGhlIFogY29vcmRpbmF0ZSBvZiB0aGUgdmVjdG9yLlxyXG4gIHB1YmxpYyB6OiBudW1iZXI7XHJcblxyXG4gIC8vIFRoZSBXIGNvb3JkaW5hdGUgb2YgdGhlIHZlY3Rvci5cclxuICBwdWJsaWMgdzogbnVtYmVyO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgNC1kaW1lbnNpb25hbCB2ZWN0b3Igd2l0aCB0aGUgc3BlY2lmaWVkIFgsIFksIFogYW5kIFcgdmFsdWVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHggLSBYIGNvb3JkaW5hdGVcclxuICAgKiBAcGFyYW0geSAtIFkgY29vcmRpbmF0ZVxyXG4gICAqIEBwYXJhbSB6IC0gWiBjb29yZGluYXRlXHJcbiAgICogQHBhcmFtIHcgLSBXIGNvb3JkaW5hdGVcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHc6IG51bWJlciApIHtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gICAgdGhpcy56ID0gejtcclxuICAgIHRoaXMudyA9IHc7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIG1hZ25pdHVkZSAoRXVjbGlkZWFuL0wyIE5vcm0pIG9mIHRoaXMgdmVjdG9yLCBpLmUuICRcXHNxcnR7eF4yK3leMit6XjIrd14yfSQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldE1hZ25pdHVkZSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCggdGhpcy5tYWduaXR1ZGVTcXVhcmVkICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IG1hZ25pdHVkZSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TWFnbml0dWRlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgc3F1YXJlZCBtYWduaXR1ZGUgKHNxdWFyZSBvZiB0aGUgRXVjbGlkZWFuL0wyIE5vcm0pIG9mIHRoaXMgdmVjdG9yLCBpLmUuICR4XjIreV4yK3peMit3XjIkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNYWduaXR1ZGVTcXVhcmVkKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5kb3QoIHRoaXMgYXMgdW5rbm93biBhcyBWZWN0b3I0ICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IG1hZ25pdHVkZVNxdWFyZWQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldE1hZ25pdHVkZVNxdWFyZWQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBFdWNsaWRlYW4gZGlzdGFuY2UgYmV0d2VlbiB0aGlzIHZlY3RvciAodHJlYXRlZCBhcyBhIHBvaW50KSBhbmQgYW5vdGhlciBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgZGlzdGFuY2UoIHBvaW50OiBWZWN0b3I0ICk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5taW51cyggcG9pbnQgKS5tYWduaXR1ZGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgRXVjbGlkZWFuIGRpc3RhbmNlIGJldHdlZW4gdGhpcyB2ZWN0b3IgKHRyZWF0ZWQgYXMgYSBwb2ludCkgYW5kIGFub3RoZXIgcG9pbnQgKHgseSx6LHcpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXN0YW5jZVhZWlcoIHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHc6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgY29uc3QgZHggPSB0aGlzLnggLSB4O1xyXG4gICAgY29uc3QgZHkgPSB0aGlzLnkgLSB5O1xyXG4gICAgY29uc3QgZHogPSB0aGlzLnogLSB6O1xyXG4gICAgY29uc3QgZHcgPSB0aGlzLncgLSB3O1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCggZHggKiBkeCArIGR5ICogZHkgKyBkeiAqIGR6ICsgZHcgKiBkdyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHNxdWFyZWQgRXVjbGlkZWFuIGRpc3RhbmNlIGJldHdlZW4gdGhpcyB2ZWN0b3IgKHRyZWF0ZWQgYXMgYSBwb2ludCkgYW5kIGFub3RoZXIgcG9pbnQuXHJcbiAgICovXHJcbiAgcHVibGljIGRpc3RhbmNlU3F1YXJlZCggcG9pbnQ6IFZlY3RvcjQgKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLm1pbnVzKCBwb2ludCApLm1hZ25pdHVkZVNxdWFyZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgc3F1YXJlZCBFdWNsaWRlYW4gZGlzdGFuY2UgYmV0d2VlbiB0aGlzIHZlY3RvciAodHJlYXRlZCBhcyBhIHBvaW50KSBhbmQgYW5vdGhlciBwb2ludCAoeCx5LHosdykuXHJcbiAgICovXHJcbiAgcHVibGljIGRpc3RhbmNlU3F1YXJlZFhZWlcoIHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHc6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgY29uc3QgZHggPSB0aGlzLnggLSB4O1xyXG4gICAgY29uc3QgZHkgPSB0aGlzLnkgLSB5O1xyXG4gICAgY29uc3QgZHogPSB0aGlzLnogLSB6O1xyXG4gICAgY29uc3QgZHcgPSB0aGlzLncgLSB3O1xyXG4gICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkeiArIGR3ICogZHc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgZG90LXByb2R1Y3QgKEV1Y2xpZGVhbiBpbm5lciBwcm9kdWN0KSBiZXR3ZWVuIHRoaXMgdmVjdG9yIGFuZCBhbm90aGVyIHZlY3RvciB2LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkb3QoIHY6IFZlY3RvcjQgKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2LnkgKyB0aGlzLnogKiB2LnogKyB0aGlzLncgKiB2Lnc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgZG90LXByb2R1Y3QgKEV1Y2xpZGVhbiBpbm5lciBwcm9kdWN0KSBiZXR3ZWVuIHRoaXMgdmVjdG9yIGFuZCBhbm90aGVyIHZlY3RvciAoeCx5LHosdykuXHJcbiAgICovXHJcbiAgcHVibGljIGRvdFhZWlcoIHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHc6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMueCAqIHggKyB0aGlzLnkgKiB5ICsgdGhpcy56ICogeiArIHRoaXMudyAqIHc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgYW5nbGUgYmV0d2VlbiB0aGlzIHZlY3RvciBhbmQgYW5vdGhlciB2ZWN0b3IsIGluIHRoZSByYW5nZSAkXFx0aGV0YVxcaW5bMCwgXFxwaV0kLlxyXG4gICAqXHJcbiAgICogRXF1YWwgdG8gJFxcdGhldGEgPSBcXGNvc157LTF9KCBcXGhhdHt1fSBcXGNkb3QgXFxoYXR7dn0gKSQgd2hlcmUgJFxcaGF0e3V9JCBpcyB0aGlzIHZlY3RvciAobm9ybWFsaXplZCkgYW5kICRcXGhhdHt2fSRcclxuICAgKiBpcyB0aGUgaW5wdXQgdmVjdG9yIChub3JtYWxpemVkKS5cclxuICAgKi9cclxuICBwdWJsaWMgYW5nbGVCZXR3ZWVuKCB2OiBWZWN0b3I0ICk6IG51bWJlciB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE86IGltcG9ydCB3aXRoIGNpcmN1bGFyIHByb3RlY3Rpb24gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2RvdC9pc3N1ZXMvOTZcclxuICAgIHJldHVybiBNYXRoLmFjb3MoIGRvdC5jbGFtcCggdGhpcy5ub3JtYWxpemVkKCkuZG90KCB2Lm5vcm1hbGl6ZWQoKSApLCAtMSwgMSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeGFjdCBlcXVhbGl0eSBjb21wYXJpc29uIGJldHdlZW4gdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXIgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG90aGVyXHJcbiAgICogQHJldHVybnMgLSBXaGV0aGVyIHRoZSB0d28gdmVjdG9ycyBoYXZlIGVxdWFsIGNvbXBvbmVudHNcclxuICAgKi9cclxuICBwdWJsaWMgZXF1YWxzKCBvdGhlcjogVmVjdG9yNCApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnggPT09IG90aGVyLnggJiYgdGhpcy55ID09PSBvdGhlci55ICYmIHRoaXMueiA9PT0gb3RoZXIueiAmJiB0aGlzLncgPT09IG90aGVyLnc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcHByb3hpbWF0ZSBlcXVhbGl0eSBjb21wYXJpc29uIGJldHdlZW4gdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXIgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBXaGV0aGVyIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgdHdvIHZlY3RvcnMgaGFzIG5vIGNvbXBvbmVudCB3aXRoIGFuIGFic29sdXRlIHZhbHVlIGdyZWF0ZXJcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICB0aGFuIGVwc2lsb24uXHJcbiAgICovXHJcbiAgcHVibGljIGVxdWFsc0Vwc2lsb24oIG90aGVyOiBWZWN0b3I0LCBlcHNpbG9uOiBudW1iZXIgKTogYm9vbGVhbiB7XHJcbiAgICBpZiAoICFlcHNpbG9uICkge1xyXG4gICAgICBlcHNpbG9uID0gMDtcclxuICAgIH1cclxuICAgIHJldHVybiBNYXRoLmFicyggdGhpcy54IC0gb3RoZXIueCApICsgTWF0aC5hYnMoIHRoaXMueSAtIG90aGVyLnkgKSArIE1hdGguYWJzKCB0aGlzLnogLSBvdGhlci56ICkgKyBNYXRoLmFicyggdGhpcy53IC0gb3RoZXIudyApIDw9IGVwc2lsb247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGZhbHNlIGlmIGFueSBjb21wb25lbnQgaXMgTmFOLCBpbmZpbml0eSwgb3IgLWluZmluaXR5LiBPdGhlcndpc2UgcmV0dXJucyB0cnVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0Zpbml0ZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBpc0Zpbml0ZSggdGhpcy54ICkgJiYgaXNGaW5pdGUoIHRoaXMueSApICYmIGlzRmluaXRlKCB0aGlzLnogKSAmJiBpc0Zpbml0ZSggdGhpcy53ICk7XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBJbW11dGFibGVzXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgY29weSBvZiB0aGlzIHZlY3Rvciwgb3IgaWYgYSB2ZWN0b3IgaXMgcGFzc2VkIGluLCBzZXQgdGhhdCB2ZWN0b3IncyB2YWx1ZXMgdG8gb3Vycy5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBzZXQoKSwgaWYgYSB2ZWN0b3IgaXMgcHJvdmlkZWQuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmRcclxuICAgKiB3aWxsIG5vdCBtb2RpZnkgdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gIFt2ZWN0b3JdIC0gSWYgbm90IHByb3ZpZGVkLCBjcmVhdGVzIGEgdjQgd2l0aCBmaWxsZWQgaW4gdmFsdWVzLiBPdGhlcndpc2UsIGZpbGxzIGluIHRoZVxyXG4gICAqICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgb2YgdGhlIHByb3ZpZGVkIHZlY3RvciBzbyB0aGF0IGl0IGVxdWFscyB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgY29weSggdmVjdG9yPzogVmVjdG9yNCApOiBWZWN0b3I0IHtcclxuICAgIGlmICggdmVjdG9yICkge1xyXG4gICAgICByZXR1cm4gdmVjdG9yLnNldCggdGhpcyBhcyB1bmtub3duIGFzIFZlY3RvcjQgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gdjQoIHRoaXMueCwgdGhpcy55LCB0aGlzLnosIHRoaXMudyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTm9ybWFsaXplZCAocmUtc2NhbGVkKSBjb3B5IG9mIHRoaXMgdmVjdG9yIHN1Y2ggdGhhdCBpdHMgbWFnbml0dWRlIGlzIDEuIElmIGl0cyBpbml0aWFsIG1hZ25pdHVkZSBpcyB6ZXJvLCBhblxyXG4gICAqIGVycm9yIGlzIHRocm93bi5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBub3JtYWxpemUoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnkgdGhpc1xyXG4gICAqIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgbm9ybWFsaXplZCgpOiBWZWN0b3I0IHtcclxuICAgIGNvbnN0IG1hZ25pdHVkZSA9IHRoaXMubWFnbml0dWRlO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbWFnbml0dWRlICE9PSAwLCAnQ2Fubm90IG5vcm1hbGl6ZSBhIHplcm8tbWFnbml0dWRlIHZlY3RvcicgKTtcclxuICAgIHJldHVybiB0aGlzLmRpdmlkZWRTY2FsYXIoIG1hZ25pdHVkZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGNvcHkgb2YgdGhpcyB2ZWN0b3Igd2l0aCBlYWNoIGNvbXBvbmVudCByb3VuZGVkIGJ5IFV0aWxzLnJvdW5kU3ltbWV0cmljLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHJvdW5kU3ltbWV0cmljKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIHJvdW5kZWRTeW1tZXRyaWMoKTogVmVjdG9yNCB7XHJcbiAgICByZXR1cm4gdGhpcy5jb3B5KCkucm91bmRTeW1tZXRyaWMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlLXNjYWxlZCBjb3B5IG9mIHRoaXMgdmVjdG9yIHN1Y2ggdGhhdCBpdCBoYXMgdGhlIGRlc2lyZWQgbWFnbml0dWRlLiBJZiBpdHMgaW5pdGlhbCBtYWduaXR1ZGUgaXMgemVybywgYW4gZXJyb3JcclxuICAgKiBpcyB0aHJvd24uIElmIHRoZSBwYXNzZWQtaW4gbWFnbml0dWRlIGlzIG5lZ2F0aXZlLCB0aGUgZGlyZWN0aW9uIG9mIHRoZSByZXN1bHRpbmcgdmVjdG9yIHdpbGwgYmUgcmV2ZXJzZWQuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2V0TWFnbml0dWRlKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKi9cclxuICBwdWJsaWMgd2l0aE1hZ25pdHVkZSggbWFnbml0dWRlOiBudW1iZXIgKTogVmVjdG9yNCB7XHJcbiAgICByZXR1cm4gdGhpcy5jb3B5KCkuc2V0TWFnbml0dWRlKCBtYWduaXR1ZGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvcHkgb2YgdGhpcyB2ZWN0b3IsIHNjYWxlZCBieSB0aGUgZGVzaXJlZCBzY2FsYXIgdmFsdWUuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gbXVsdGlwbHlTY2FsYXIoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgdGltZXNTY2FsYXIoIHNjYWxhcjogbnVtYmVyICk6IFZlY3RvcjQge1xyXG4gICAgcmV0dXJuIHY0KCB0aGlzLnggKiBzY2FsYXIsIHRoaXMueSAqIHNjYWxhciwgdGhpcy56ICogc2NhbGFyLCB0aGlzLncgKiBzY2FsYXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNhbWUgYXMgdGltZXNTY2FsYXIuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gbXVsdGlwbHkoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgdGltZXMoIHNjYWxhcjogbnVtYmVyICk6IFZlY3RvcjQge1xyXG4gICAgcmV0dXJuIHRoaXMudGltZXNTY2FsYXIoIHNjYWxhciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29weSBvZiB0aGlzIHZlY3RvciwgbXVsdGlwbGllZCBjb21wb25lbnQtd2lzZSBieSB0aGUgcGFzc2VkLWluIHZlY3RvciB2LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGNvbXBvbmVudE11bHRpcGx5KCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIGNvbXBvbmVudFRpbWVzKCB2OiBWZWN0b3I0ICk6IFZlY3RvcjQge1xyXG4gICAgcmV0dXJuIHY0KCB0aGlzLnggKiB2LngsIHRoaXMueSAqIHYueSwgdGhpcy56ICogdi56LCB0aGlzLncgKiB2LncgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZGl0aW9uIG9mIHRoaXMgdmVjdG9yIGFuZCBhbm90aGVyIHZlY3RvciwgcmV0dXJuaW5nIGEgY29weS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBhZGQoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgcGx1cyggdjogVmVjdG9yNCApOiBWZWN0b3I0IHtcclxuICAgIHJldHVybiB2NCggdGhpcy54ICsgdi54LCB0aGlzLnkgKyB2LnksIHRoaXMueiArIHYueiwgdGhpcy53ICsgdi53ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRpdGlvbiBvZiB0aGlzIHZlY3RvciBhbmQgYW5vdGhlciB2ZWN0b3IgKHgseSx6LHcpLCByZXR1cm5pbmcgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGFkZFhZWlcoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgcGx1c1hZWlcoIHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHc6IG51bWJlciApOiBWZWN0b3I0IHtcclxuICAgIHJldHVybiB2NCggdGhpcy54ICsgeCwgdGhpcy55ICsgeSwgdGhpcy56ICsgeiwgdGhpcy53ICsgdyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkaXRpb24gb2YgdGhpcyB2ZWN0b3Igd2l0aCBhIHNjYWxhciAoYWRkcyB0aGUgc2NhbGFyIHRvIGV2ZXJ5IGNvbXBvbmVudCksIHJldHVybmluZyBhIGNvcHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gYWRkU2NhbGFyKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIHBsdXNTY2FsYXIoIHNjYWxhcjogbnVtYmVyICk6IFZlY3RvcjQge1xyXG4gICAgcmV0dXJuIHY0KCB0aGlzLnggKyBzY2FsYXIsIHRoaXMueSArIHNjYWxhciwgdGhpcy56ICsgc2NhbGFyLCB0aGlzLncgKyBzY2FsYXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1YnRyYWN0aW9uIG9mIHRoaXMgdmVjdG9yIGJ5IGFub3RoZXIgdmVjdG9yIHYsIHJldHVybmluZyBhIGNvcHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc3VidHJhY3QoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgbWludXMoIHY6IFZlY3RvcjQgKTogVmVjdG9yNCB7XHJcbiAgICByZXR1cm4gdjQoIHRoaXMueCAtIHYueCwgdGhpcy55IC0gdi55LCB0aGlzLnogLSB2LnosIHRoaXMudyAtIHYudyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3VidHJhY3Rpb24gb2YgdGhpcyB2ZWN0b3IgYnkgYW5vdGhlciB2ZWN0b3IgKHgseSx6LHcpLCByZXR1cm5pbmcgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHN1YnRyYWN0WFlaVygpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IHZlY3RvciwgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtaW51c1hZWlcoIHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHc6IG51bWJlciApOiBWZWN0b3I0IHtcclxuICAgIHJldHVybiB2NCggdGhpcy54IC0geCwgdGhpcy55IC0geSwgdGhpcy56IC0geiwgdGhpcy53IC0gdyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3VidHJhY3Rpb24gb2YgdGhpcyB2ZWN0b3IgYnkgYSBzY2FsYXIgKHN1YnRyYWN0cyB0aGUgc2NhbGFyIGZyb20gZXZlcnkgY29tcG9uZW50KSwgcmV0dXJuaW5nIGEgY29weS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBzdWJ0cmFjdFNjYWxhcigpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IHZlY3RvciwgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtaW51c1NjYWxhciggc2NhbGFyOiBudW1iZXIgKTogVmVjdG9yNCB7XHJcbiAgICByZXR1cm4gdjQoIHRoaXMueCAtIHNjYWxhciwgdGhpcy55IC0gc2NhbGFyLCB0aGlzLnogLSBzY2FsYXIsIHRoaXMudyAtIHNjYWxhciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGl2aXNpb24gb2YgdGhpcyB2ZWN0b3IgYnkgYSBzY2FsYXIgKGRpdmlkZXMgZXZlcnkgY29tcG9uZW50IGJ5IHRoZSBzY2FsYXIpLCByZXR1cm5pbmcgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGRpdmlkZVNjYWxhcigpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IHZlY3RvciwgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXZpZGVkU2NhbGFyKCBzY2FsYXI6IG51bWJlciApOiBWZWN0b3I0IHtcclxuICAgIHJldHVybiB2NCggdGhpcy54IC8gc2NhbGFyLCB0aGlzLnkgLyBzY2FsYXIsIHRoaXMueiAvIHNjYWxhciwgdGhpcy53IC8gc2NhbGFyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBOZWdhdGVkIGNvcHkgb2YgdGhpcyB2ZWN0b3IgKG11bHRpcGxpZXMgZXZlcnkgY29tcG9uZW50IGJ5IC0xKS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBuZWdhdGUoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqL1xyXG4gIHB1YmxpYyBuZWdhdGVkKCk6IFZlY3RvcjQge1xyXG4gICAgcmV0dXJuIHY0KCAtdGhpcy54LCAtdGhpcy55LCAtdGhpcy56LCAtdGhpcy53ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdGhpcyB2ZWN0b3IgKHJhdGlvPTApIGFuZCBhbm90aGVyIHZlY3RvciAocmF0aW89MSkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdmVjdG9yXHJcbiAgICogQHBhcmFtIHJhdGlvIC0gTm90IG5lY2Vzc2FyaWx5IGNvbnN0cmFpbmVkIGluIFswLCAxXVxyXG4gICAqL1xyXG4gIHB1YmxpYyBibGVuZCggdmVjdG9yOiBWZWN0b3I0LCByYXRpbzogbnVtYmVyICk6IFZlY3RvcjQge1xyXG4gICAgcmV0dXJuIHRoaXMucGx1cyggdmVjdG9yLm1pbnVzKCB0aGlzIGFzIHVua25vd24gYXMgVmVjdG9yNCApLnRpbWVzKCByYXRpbyApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgYXZlcmFnZSAobWlkcG9pbnQpIGJldHdlZW4gdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXIgdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhdmVyYWdlKCB2ZWN0b3I6IFZlY3RvcjQgKTogVmVjdG9yNCB7XHJcbiAgICByZXR1cm4gdGhpcy5ibGVuZCggdmVjdG9yLCAwLjUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlYnVnZ2luZyBzdHJpbmcgZm9yIHRoZSB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIHRvU3RyaW5nKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYFZlY3RvcjQoJHt0aGlzLnh9LCAke3RoaXMueX0sICR7dGhpcy56fSwgJHt0aGlzLnd9KWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0cyB0aGlzIHRvIGEgMy1kaW1lbnNpb25hbCB2ZWN0b3IsIGRpc2NhcmRpbmcgdGhlIHctY29tcG9uZW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b1ZlY3RvcjMoKTogVmVjdG9yMyB7XHJcbiAgICByZXR1cm4gbmV3IFZlY3RvcjMoIHRoaXMueCwgdGhpcy55LCB0aGlzLnogKTtcclxuICB9XHJcblxyXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxyXG4gICAqIE11dGFibGVzXHJcbiAgICogLSBhbGwgbXV0YXRpb24gc2hvdWxkIGdvIHRocm91Z2ggc2V0WFlaVyAvIHNldFggLyBzZXRZIC8gc2V0WiAvIHNldFdcclxuICAgKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgYWxsIG9mIHRoZSBjb21wb25lbnRzIG9mIHRoaXMgdmVjdG9yLCByZXR1cm5pbmcgdGhpcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0WFlaVyggeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgdzogbnVtYmVyICk6IFZlY3RvcjQge1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgICB0aGlzLnogPSB6O1xyXG4gICAgdGhpcy53ID0gdztcclxuICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmVjdG9yNDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHgtY29tcG9uZW50IG9mIHRoaXMgdmVjdG9yLCByZXR1cm5pbmcgdGhpcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0WCggeDogbnVtYmVyICk6IFZlY3RvcjQge1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmVjdG9yNDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHktY29tcG9uZW50IG9mIHRoaXMgdmVjdG9yLCByZXR1cm5pbmcgdGhpcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0WSggeTogbnVtYmVyICk6IFZlY3RvcjQge1xyXG4gICAgdGhpcy55ID0geTtcclxuICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmVjdG9yNDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHotY29tcG9uZW50IG9mIHRoaXMgdmVjdG9yLCByZXR1cm5pbmcgdGhpcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0WiggejogbnVtYmVyICk6IFZlY3RvcjQge1xyXG4gICAgdGhpcy56ID0gejtcclxuICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmVjdG9yNDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHctY29tcG9uZW50IG9mIHRoaXMgdmVjdG9yLCByZXR1cm5pbmcgdGhpcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0VyggdzogbnVtYmVyICk6IFZlY3RvcjQge1xyXG4gICAgdGhpcy53ID0gdztcclxuICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmVjdG9yNDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhpcyB2ZWN0b3IgdG8gYmUgYSBjb3B5IG9mIGFub3RoZXIgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBjb3B5KCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyB2ZWN0b3IsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgdmVjdG9yIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0KCB2OiBWZWN0b3I0ICk6IFZlY3RvcjQge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0WFlaVyggdi54LCB2LnksIHYueiwgdi53ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBtYWduaXR1ZGUgb2YgdGhpcyB2ZWN0b3IuIElmIHRoZSBwYXNzZWQtaW4gbWFnbml0dWRlIGlzIG5lZ2F0aXZlLCB0aGlzIGZsaXBzIHRoZSB2ZWN0b3IgYW5kIHNldHMgaXRzXHJcbiAgICogbWFnbml0dWRlIHRvIGFicyggbWFnbml0dWRlICkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHdpdGhNYWduaXR1ZGUoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRNYWduaXR1ZGUoIG1hZ25pdHVkZTogbnVtYmVyICk6IFZlY3RvcjQge1xyXG4gICAgY29uc3Qgc2NhbGUgPSBtYWduaXR1ZGUgLyB0aGlzLm1hZ25pdHVkZTtcclxuICAgIHJldHVybiB0aGlzLm11bHRpcGx5U2NhbGFyKCBzY2FsZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbm90aGVyIHZlY3RvciB0byB0aGlzIHZlY3RvciwgY2hhbmdpbmcgdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHBsdXMoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGQoIHY6IFZlY3RvcjQgKTogVmVjdG9yNCB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWVpXKCB0aGlzLnggKyB2LngsIHRoaXMueSArIHYueSwgdGhpcy56ICsgdi56LCB0aGlzLncgKyB2LncgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW5vdGhlciB2ZWN0b3IgKHgseSx6LHcpIHRvIHRoaXMgdmVjdG9yLCBjaGFuZ2luZyB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gcGx1c1hZWlcoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRYWVpXKCB4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCB3OiBudW1iZXIgKTogVmVjdG9yNCB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWVpXKCB0aGlzLnggKyB4LCB0aGlzLnkgKyB5LCB0aGlzLnogKyB6LCB0aGlzLncgKyB3ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgc2NhbGFyIHRvIHRoaXMgdmVjdG9yIChhZGRlZCB0byBldmVyeSBjb21wb25lbnQpLCBjaGFuZ2luZyB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gcGx1c1NjYWxhcigpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGFkZFNjYWxhciggc2NhbGFyOiBudW1iZXIgKTogVmVjdG9yNCB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWVpXKCB0aGlzLnggKyBzY2FsYXIsIHRoaXMueSArIHNjYWxhciwgdGhpcy56ICsgc2NhbGFyLCB0aGlzLncgKyBzY2FsYXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1YnRyYWN0cyB0aGlzIHZlY3RvciBieSBhbm90aGVyIHZlY3RvciwgY2hhbmdpbmcgdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIG1pbnVzKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyB2ZWN0b3IsIGluIGFkZGl0aW9uIHRvXHJcbiAgICogcmV0dXJuaW5nIHRoaXMgdmVjdG9yIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgc3VidHJhY3QoIHY6IFZlY3RvcjQgKTogVmVjdG9yNCB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWVpXKCB0aGlzLnggLSB2LngsIHRoaXMueSAtIHYueSwgdGhpcy56IC0gdi56LCB0aGlzLncgLSB2LncgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1YnRyYWN0cyB0aGlzIHZlY3RvciBieSBhbm90aGVyIHZlY3RvciAoeCx5LHosdyksIGNoYW5naW5nIHRoaXMgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBtaW51c1hZWlcoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdWJ0cmFjdFhZWlcoIHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHc6IG51bWJlciApOiBWZWN0b3I0IHtcclxuICAgIHJldHVybiB0aGlzLnNldFhZWlcoIHRoaXMueCAtIHgsIHRoaXMueSAtIHksIHRoaXMueiAtIHosIHRoaXMudyAtIHcgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1YnRyYWN0cyB0aGlzIHZlY3RvciBieSBhIHNjYWxhciAoc3VidHJhY3RzIGVhY2ggY29tcG9uZW50IGJ5IHRoZSBzY2FsYXIpLCBjaGFuZ2luZyB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gbWludXNTY2FsYXIoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdWJ0cmFjdFNjYWxhciggc2NhbGFyOiBudW1iZXIgKTogVmVjdG9yNCB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWVpXKCB0aGlzLnggLSBzY2FsYXIsIHRoaXMueSAtIHNjYWxhciwgdGhpcy56IC0gc2NhbGFyLCB0aGlzLncgLSBzY2FsYXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE11bHRpcGxpZXMgdGhpcyB2ZWN0b3IgYnkgYSBzY2FsYXIgKG11bHRpcGxpZXMgZWFjaCBjb21wb25lbnQgYnkgdGhlIHNjYWxhciksIGNoYW5naW5nIHRoaXMgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiB0aW1lc1NjYWxhcigpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIG11bHRpcGx5U2NhbGFyKCBzY2FsYXI6IG51bWJlciApOiBWZWN0b3I0IHtcclxuICAgIHJldHVybiB0aGlzLnNldFhZWlcoIHRoaXMueCAqIHNjYWxhciwgdGhpcy55ICogc2NhbGFyLCB0aGlzLnogKiBzY2FsYXIsIHRoaXMudyAqIHNjYWxhciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTXVsdGlwbGllcyB0aGlzIHZlY3RvciBieSBhIHNjYWxhciAobXVsdGlwbGllcyBlYWNoIGNvbXBvbmVudCBieSB0aGUgc2NhbGFyKSwgY2hhbmdpbmcgdGhpcyB2ZWN0b3IuXHJcbiAgICogU2FtZSBhcyBtdWx0aXBseVNjYWxhci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gdGltZXMoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtdWx0aXBseSggc2NhbGFyOiBudW1iZXIgKTogVmVjdG9yNCB7XHJcbiAgICByZXR1cm4gdGhpcy5tdWx0aXBseVNjYWxhciggc2NhbGFyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNdWx0aXBsaWVzIHRoaXMgdmVjdG9yIGJ5IGFub3RoZXIgdmVjdG9yIGNvbXBvbmVudC13aXNlLCBjaGFuZ2luZyB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gY29tcG9uZW50VGltZXMoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb21wb25lbnRNdWx0aXBseSggdjogVmVjdG9yNCApOiBWZWN0b3I0IHtcclxuICAgIHJldHVybiB0aGlzLnNldFhZWlcoIHRoaXMueCAqIHYueCwgdGhpcy55ICogdi55LCB0aGlzLnogKiB2LnosIHRoaXMudyAqIHYudyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGl2aWRlcyB0aGlzIHZlY3RvciBieSBhIHNjYWxhciAoZGl2aWRlcyBlYWNoIGNvbXBvbmVudCBieSB0aGUgc2NhbGFyKSwgY2hhbmdpbmcgdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGRpdmlkZWRTY2FsYXIoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXZpZGVTY2FsYXIoIHNjYWxhcjogbnVtYmVyICk6IFZlY3RvcjQge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0WFlaVyggdGhpcy54IC8gc2NhbGFyLCB0aGlzLnkgLyBzY2FsYXIsIHRoaXMueiAvIHNjYWxhciwgdGhpcy53IC8gc2NhbGFyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBOZWdhdGVzIHRoaXMgdmVjdG9yIChtdWx0aXBsaWVzIGVhY2ggY29tcG9uZW50IGJ5IC0xKSwgY2hhbmdpbmcgdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIG5lZ2F0ZWQoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBuZWdhdGUoKTogVmVjdG9yNCB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWVpXKCAtdGhpcy54LCAtdGhpcy55LCAtdGhpcy56LCAtdGhpcy53ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBOb3JtYWxpemVzIHRoaXMgdmVjdG9yIChyZXNjYWxlcyB0byB3aGVyZSB0aGUgbWFnbml0dWRlIGlzIDEpLCBjaGFuZ2luZyB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gbm9ybWFsaXplZCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIG5vcm1hbGl6ZSgpOiBWZWN0b3I0IHtcclxuICAgIGNvbnN0IG1hZyA9IHRoaXMubWFnbml0dWRlO1xyXG4gICAgaWYgKCBtYWcgPT09IDAgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggJ0Nhbm5vdCBub3JtYWxpemUgYSB6ZXJvLW1hZ25pdHVkZSB2ZWN0b3InICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5kaXZpZGVTY2FsYXIoIG1hZyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUm91bmRzIGVhY2ggY29tcG9uZW50IG9mIHRoaXMgdmVjdG9yIHdpdGggVXRpbHMucm91bmRTeW1tZXRyaWMuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHJvdW5kZWRTeW1tZXRyaWMoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb25cclxuICAgKiB0byByZXR1cm5pbmcgdGhlIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHJvdW5kU3ltbWV0cmljKCk6IFZlY3RvcjQge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0WFlaVyggVXRpbHMucm91bmRTeW1tZXRyaWMoIHRoaXMueCApLCBVdGlscy5yb3VuZFN5bW1ldHJpYyggdGhpcy55ICksIFV0aWxzLnJvdW5kU3ltbWV0cmljKCB0aGlzLnogKSwgVXRpbHMucm91bmRTeW1tZXRyaWMoIHRoaXMudyApICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZnJlZVRvUG9vbCgpOiB2b2lkIHtcclxuICAgIFZlY3RvcjQucG9vbC5mcmVlVG9Qb29sKCB0aGlzICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IHBvb2wgPSBuZXcgUG9vbCggVmVjdG9yNCwge1xyXG4gICAgbWF4U2l6ZTogMTAwMCxcclxuICAgIGluaXRpYWxpemU6IFZlY3RvcjQucHJvdG90eXBlLnNldFhZWlcsXHJcbiAgICBkZWZhdWx0QXJndW1lbnRzOiBbIDAsIDAsIDAsIDAgXVxyXG4gIH0gKTtcclxuXHJcbiAgcHVibGljIGlzVmVjdG9yNCE6IGJvb2xlYW47XHJcbiAgcHVibGljIGRpbWVuc2lvbiE6IG51bWJlcjtcclxuICBwdWJsaWMgc3RhdGljIFpFUk86IFZlY3RvcjQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdXBwZXJjYXNlLXN0YXRpY3Mtc2hvdWxkLWJlLXJlYWRvbmx5XHJcbiAgcHVibGljIHN0YXRpYyBYX1VOSVQ6IFZlY3RvcjQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdXBwZXJjYXNlLXN0YXRpY3Mtc2hvdWxkLWJlLXJlYWRvbmx5XHJcbiAgcHVibGljIHN0YXRpYyBZX1VOSVQ6IFZlY3RvcjQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdXBwZXJjYXNlLXN0YXRpY3Mtc2hvdWxkLWJlLXJlYWRvbmx5XHJcbiAgcHVibGljIHN0YXRpYyBaX1VOSVQ6IFZlY3RvcjQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdXBwZXJjYXNlLXN0YXRpY3Mtc2hvdWxkLWJlLXJlYWRvbmx5XHJcbiAgcHVibGljIHN0YXRpYyBXX1VOSVQ6IFZlY3RvcjQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdXBwZXJjYXNlLXN0YXRpY3Mtc2hvdWxkLWJlLXJlYWRvbmx5XHJcbn1cclxuXHJcbi8vIChyZWFkLW9ubHkpIC0gSGVscHMgdG8gaWRlbnRpZnkgdGhlIGRpbWVuc2lvbiBvZiB0aGUgdmVjdG9yXHJcblZlY3RvcjQucHJvdG90eXBlLmlzVmVjdG9yNCA9IHRydWU7XHJcblZlY3RvcjQucHJvdG90eXBlLmRpbWVuc2lvbiA9IDQ7XHJcblxyXG5kb3QucmVnaXN0ZXIoICdWZWN0b3I0JywgVmVjdG9yNCApO1xyXG5cclxuY29uc3QgdjQgPSBWZWN0b3I0LnBvb2wuY3JlYXRlLmJpbmQoIFZlY3RvcjQucG9vbCApO1xyXG5kb3QucmVnaXN0ZXIoICd2NCcsIHY0ICk7XHJcblxyXG5jbGFzcyBJbW11dGFibGVWZWN0b3I0IGV4dGVuZHMgVmVjdG9yNCB7XHJcbiAgLyoqXHJcbiAgICogVGhyb3cgZXJyb3JzIHdoZW5ldmVyIGEgbXV0YWJsZSBtZXRob2QgaXMgY2FsbGVkIG9uIG91ciBpbW11dGFibGUgdmVjdG9yXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBtdXRhYmxlT3ZlcnJpZGVIZWxwZXIoIG11dGFibGVGdW5jdGlvbk5hbWU6ICdzZXRYJyB8ICdzZXRZJyB8ICdzZXRaJyB8ICdzZXRXJyB8ICdzZXRYWVpXJyApOiB2b2lkIHtcclxuICAgIEltbXV0YWJsZVZlY3RvcjQucHJvdG90eXBlWyBtdXRhYmxlRnVuY3Rpb25OYW1lIF0gPSAoKSA9PiB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggYENhbm5vdCBjYWxsIG11dGFibGUgbWV0aG9kICcke211dGFibGVGdW5jdGlvbk5hbWV9JyBvbiBpbW11dGFibGUgVmVjdG9yM2AgKTtcclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG5JbW11dGFibGVWZWN0b3I0Lm11dGFibGVPdmVycmlkZUhlbHBlciggJ3NldFhZWlcnICk7XHJcbkltbXV0YWJsZVZlY3RvcjQubXV0YWJsZU92ZXJyaWRlSGVscGVyKCAnc2V0WCcgKTtcclxuSW1tdXRhYmxlVmVjdG9yNC5tdXRhYmxlT3ZlcnJpZGVIZWxwZXIoICdzZXRZJyApO1xyXG5JbW11dGFibGVWZWN0b3I0Lm11dGFibGVPdmVycmlkZUhlbHBlciggJ3NldFonICk7XHJcbkltbXV0YWJsZVZlY3RvcjQubXV0YWJsZU92ZXJyaWRlSGVscGVyKCAnc2V0VycgKTtcclxuXHJcblZlY3RvcjQuWkVSTyA9IGFzc2VydCA/IG5ldyBJbW11dGFibGVWZWN0b3I0KCAwLCAwLCAwLCAwICkgOiBuZXcgVmVjdG9yNCggMCwgMCwgMCwgMCApO1xyXG5WZWN0b3I0LlhfVU5JVCA9IGFzc2VydCA/IG5ldyBJbW11dGFibGVWZWN0b3I0KCAxLCAwLCAwLCAwICkgOiBuZXcgVmVjdG9yNCggMSwgMCwgMCwgMCApO1xyXG5WZWN0b3I0LllfVU5JVCA9IGFzc2VydCA/IG5ldyBJbW11dGFibGVWZWN0b3I0KCAwLCAxLCAwLCAwICkgOiBuZXcgVmVjdG9yNCggMCwgMSwgMCwgMCApO1xyXG5WZWN0b3I0LlpfVU5JVCA9IGFzc2VydCA/IG5ldyBJbW11dGFibGVWZWN0b3I0KCAwLCAwLCAxLCAwICkgOiBuZXcgVmVjdG9yNCggMCwgMCwgMSwgMCApO1xyXG5WZWN0b3I0LldfVU5JVCA9IGFzc2VydCA/IG5ldyBJbW11dGFibGVWZWN0b3I0KCAwLCAwLCAwLCAxICkgOiBuZXcgVmVjdG9yNCggMCwgMCwgMCwgMSApO1xyXG5cclxuZXhwb3J0IHsgdjQgfTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsS0FBSyxNQUFNLFlBQVk7QUFDOUIsT0FBT0MsT0FBTyxNQUFNLGNBQWM7QUFDbEMsT0FBT0MsR0FBRyxNQUFNLFVBQVU7QUFDMUIsT0FBT0MsSUFBSSxNQUFxQiw0QkFBNEI7QUFFNUQsZUFBZSxNQUFNQyxPQUFPLENBQXNCO0VBRWhEOztFQUdBOztFQUdBOztFQUdBOztFQUdBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDU0MsV0FBV0EsQ0FBRUMsQ0FBUyxFQUFFQyxDQUFTLEVBQUVDLENBQVMsRUFBRUMsQ0FBUyxFQUFHO0lBQy9ELElBQUksQ0FBQ0gsQ0FBQyxHQUFHQSxDQUFDO0lBQ1YsSUFBSSxDQUFDQyxDQUFDLEdBQUdBLENBQUM7SUFDVixJQUFJLENBQUNDLENBQUMsR0FBR0EsQ0FBQztJQUNWLElBQUksQ0FBQ0MsQ0FBQyxHQUFHQSxDQUFDO0VBQ1o7O0VBR0E7QUFDRjtBQUNBO0VBQ1NDLFlBQVlBLENBQUEsRUFBVztJ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