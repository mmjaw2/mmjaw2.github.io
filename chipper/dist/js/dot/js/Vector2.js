// Copyright 2013-2024, University of Colorado Boulder

/**
 * Basic 2-dimensional vector, represented as (x,y).  Values can be numeric, or NaN or infinite.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Pool from '../../phet-core/js/Pool.js';
import IOType from '../../tandem/js/types/IOType.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import dot from './dot.js';
import Utils from './Utils.js';
import Vector3 from './Vector3.js';
const ADDING_ACCUMULATOR = (vector, nextVector) => {
  return vector.add(nextVector);
};
export default class Vector2 {
  // The X coordinate of the vector.

  // The Y coordinate of the vector.

  /**
   * Creates a 2-dimensional vector with the specified X and Y values.
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * The magnitude (Euclidean/L2 Norm) of this vector, i.e. $\sqrt{x^2+y^2}$.
   */
  getMagnitude() {
    return Math.sqrt(this.magnitudeSquared);
  }
  get magnitude() {
    return this.getMagnitude();
  }

  /**
   * The squared magnitude (square of the Euclidean/L2 Norm) of this vector, i.e. $x^2+y^2$.
   */
  getMagnitudeSquared() {
    return this.x * this.x + this.y * this.y;
  }
  get magnitudeSquared() {
    return this.getMagnitudeSquared();
  }

  /**
   * The Euclidean distance between this vector (treated as a point) and another point.
   */
  distance(point) {
    return Math.sqrt(this.distanceSquared(point));
  }

  /**
   * The Euclidean distance between this vector (treated as a point) and another point (x,y).
   */
  distanceXY(x, y) {
    const dx = this.x - x;
    const dy = this.y - y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * The squared Euclidean distance between this vector (treated as a point) and another point.
   */
  distanceSquared(point) {
    const dx = this.x - point.x;
    const dy = this.y - point.y;
    return dx * dx + dy * dy;
  }

  /**
   * The squared Euclidean distance between this vector (treated as a point) and another point with coordinates (x,y).
   */
  distanceSquaredXY(x, y) {
    const dx = this.x - x;
    const dy = this.y - y;
    return dx * dx + dy * dy;
  }

  /**
   * The dot-product (Euclidean inner product) between this vector and another vector v.
   */
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * The dot-product (Euclidean inner product) between this vector and another vector (x,y).
   */
  dotXY(x, y) {
    return this.x * x + this.y * y;
  }

  /**
   * The angle $\theta$ of this vector, such that this vector is equal to
   * $$ u = \begin{bmatrix} r\cos\theta \\ r\sin\theta \end{bmatrix} $$
   * for the magnitude $r \ge 0$ of the vector, with $\theta\in(-\pi,\pi]$
   */
  getAngle() {
    return Math.atan2(this.y, this.x);
  }
  get angle() {
    return this.getAngle();
  }

  /**
   * The angle between this vector and another vector, in the range $\theta\in[0, \pi]$.
   *
   * Equal to $\theta = \cos^{-1}( \hat{u} \cdot \hat{v} )$ where $\hat{u}$ is this vector (normalized) and $\hat{v}$
   * is the input vector (normalized).
   */
  angleBetween(v) {
    const thisMagnitude = this.magnitude;
    const vMagnitude = v.magnitude;
    // @ts-expect-error TODO: import with circular protection https://github.com/phetsims/dot/issues/96
    return Math.acos(dot.clamp((this.x * v.x + this.y * v.y) / (thisMagnitude * vMagnitude), -1, 1));
  }

  /**
   * Exact equality comparison between this vector and another vector.
     * @returns - Whether the two vectors have equal components
   */
  equals(other) {
    return this.x === other.x && this.y === other.y;
  }

  /**
   * Approximate equality comparison between this vector and another vector.
   *
   * @returns - Whether difference between the two vectors has no component with an absolute value greater than epsilon.
   */
  equalsEpsilon(other, epsilon) {
    if (!epsilon) {
      epsilon = 0;
    }
    return Math.max(Math.abs(this.x - other.x), Math.abs(this.y - other.y)) <= epsilon;
  }

  /**
   * Returns false if either component is NaN, infinity, or -infinity. Otherwise returns true.
   */
  isFinite() {
    return isFinite(this.x) && isFinite(this.y);
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
   * @param [vector] - If not provided, creates a new Vector2 with filled in values. Otherwise, fills in the
   *                   values of the provided vector so that it equals this vector.
   */
  copy(vector) {
    if (vector) {
      return vector.set(this);
    } else {
      return v2(this.x, this.y);
    }
  }

  /**
   * The scalar value of the z-component of the equivalent 3-dimensional cross product:
   * $$ f( u, v ) = \left( \begin{bmatrix} u_x \\ u_y \\ 0 \end{bmatrix} \times \begin{bmatrix} v_x \\ v_y \\ 0 \end{bmatrix} \right)_z = u_x v_y - u_y v_x $$
   */
  crossScalar(v) {
    return this.x * v.y - this.y * v.x;
  }

  /**
   * Normalized (re-scaled) copy of this vector such that its magnitude is 1. If its initial magnitude is zero, an
   * error is thrown.
   *
   * This is the immutable form of the function normalize(). This will return a new vector, and will not modify this
   * vector.
   */
  normalized() {
    const mag = this.magnitude;
    if (mag === 0) {
      throw new Error('Cannot normalize a zero-magnitude vector');
    } else {
      return v2(this.x / mag, this.y / mag);
    }
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
    return v2(this.x * scalar, this.y * scalar);
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
    return v2(this.x * v.x, this.y * v.y);
  }

  /**
   * Addition of this vector and another vector, returning a copy.
   *
   * This is the immutable form of the function add(). This will return a new vector, and will not modify
   * this vector.
   */
  plus(v) {
    return v2(this.x + v.x, this.y + v.y);
  }

  /**
   * Addition of this vector and another vector (x,y), returning a copy.
   *
   * This is the immutable form of the function addXY(). This will return a new vector, and will not modify
   * this vector.
   */
  plusXY(x, y) {
    return v2(this.x + x, this.y + y);
  }

  /**
   * Addition of this vector with a scalar (adds the scalar to every component), returning a copy.
   *
   * This is the immutable form of the function addScalar(). This will return a new vector, and will not modify
   * this vector.
   */
  plusScalar(scalar) {
    return v2(this.x + scalar, this.y + scalar);
  }

  /**
   * Subtraction of this vector by another vector v, returning a copy.
   *
   * This is the immutable form of the function subtract(). This will return a new vector, and will not modify
   * this vector.
   */
  minus(v) {
    return v2(this.x - v.x, this.y - v.y);
  }

  /**
   * Subtraction of this vector by another vector (x,y), returning a copy.
   *
   * This is the immutable form of the function subtractXY(). This will return a new vector, and will not modify
   * this vector.
   */
  minusXY(x, y) {
    return v2(this.x - x, this.y - y);
  }

  /**
   * Subtraction of this vector by a scalar (subtracts the scalar from every component), returning a copy.
   *
   * This is the immutable form of the function subtractScalar(). This will return a new vector, and will not modify
   * this vector.
   */
  minusScalar(scalar) {
    return v2(this.x - scalar, this.y - scalar);
  }

  /**
   * Division of this vector by a scalar (divides every component by the scalar), returning a copy.
   *
   * This is the immutable form of the function divideScalar(). This will return a new vector, and will not modify
   * this vector.
   */
  dividedScalar(scalar) {
    return v2(this.x / scalar, this.y / scalar);
  }

  /**
   * Negated copy of this vector (multiplies every component by -1).
   *
   * This is the immutable form of the function negate(). This will return a new vector, and will not modify
   * this vector.
   */
  negated() {
    return v2(-this.x, -this.y);
  }

  /**
   * Rotated by -pi/2 (perpendicular to this vector), returned as a copy.
   */
  getPerpendicular() {
    return v2(this.y, -this.x);
  }
  get perpendicular() {
    return this.getPerpendicular();
  }

  /**
   * Rotated by an arbitrary angle, in radians. Returned as a copy.
   *
   * This is the immutable form of the function rotate(). This will return a new vector, and will not modify
   * this vector.
   *
   * @param angle - In radians
   */
  rotated(angle) {
    const newAngle = this.angle + angle;
    const mag = this.magnitude;
    return v2(mag * Math.cos(newAngle), mag * Math.sin(newAngle));
  }

  /**
   * Mutable method that rotates this vector about an x,y point.
   *
   * @param x - origin of rotation in x
   * @param y - origin of rotation in y
   * @param angle - radians to rotate
   * @returns this for chaining
   */
  rotateAboutXY(x, y, angle) {
    const dx = this.x - x;
    const dy = this.y - y;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.x = x + dx * cos - dy * sin;
    this.y = y + dx * sin + dy * cos;
    return this;
  }

  /**
   * Same as rotateAboutXY but with a point argument.
   */
  rotateAboutPoint(point, angle) {
    return this.rotateAboutXY(point.x, point.y, angle);
  }

  /**
   * Immutable method that returns a new Vector2 that is rotated about the given point.
   *
   * @param x - origin for rotation in x
   * @param y - origin for rotation in y
   * @param angle - radians to rotate
   */
  rotatedAboutXY(x, y, angle) {
    return v2(this.x, this.y).rotateAboutXY(x, y, angle);
  }

  /**
   * Immutable method that returns a new Vector2 rotated about the given point.
   */
  rotatedAboutPoint(point, angle) {
    return this.rotatedAboutXY(point.x, point.y, angle);
  }

  /**
   * A linear interpolation between this vector (ratio=0) and another vector (ratio=1).
   *
   * @param vector
   * @param ratio - Not necessarily constrained in [0, 1]
   */
  blend(vector, ratio) {
    return v2(this.x + (vector.x - this.x) * ratio, this.y + (vector.y - this.y) * ratio);
  }

  /**
   * The average (midpoint) between this vector and another vector.
   */
  average(vector) {
    return this.blend(vector, 0.5);
  }

  /**
   * Take a component-based mean of all vectors provided.
   */
  static average(vectors) {
    const added = _.reduce(vectors, ADDING_ACCUMULATOR, new Vector2(0, 0));
    return added.divideScalar(vectors.length);
  }

  /**
   * Debugging string for the vector.
   */
  toString() {
    return `Vector2(${this.x}, ${this.y})`;
  }

  /**
   * Converts this to a 3-dimensional vector, with the z-component equal to 0.
   */
  toVector3() {
    return new Vector3(this.x, this.y, 0);
  }

  /*---------------------------------------------------------------------------*
   * Mutables
   * - all mutation should go through setXY / setX / setY
   *---------------------------------------------------------------------------*/

  /**
   * Sets all of the components of this vector, returning this.
   */
  setXY(x, y) {
    this.x = x;
    this.y = y;
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
   * Sets this vector to be a copy of another vector.
   *
   * This is the mutable form of the function copy(). This will mutate (change) this vector, in addition to returning
   * this vector itself.
   */
  set(v) {
    return this.setXY(v.x, v.y);
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
    return this.setXY(this.x + v.x, this.y + v.y);
  }

  /**
   * Adds another vector (x,y) to this vector, changing this vector.
   *
   * This is the mutable form of the function plusXY(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  addXY(x, y) {
    return this.setXY(this.x + x, this.y + y);
  }

  /**
   * Adds a scalar to this vector (added to every component), changing this vector.
   *
   * This is the mutable form of the function plusScalar(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  addScalar(scalar) {
    return this.setXY(this.x + scalar, this.y + scalar);
  }

  /**
   * Subtracts this vector by another vector, changing this vector.
   *
   * This is the mutable form of the function minus(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  subtract(v) {
    return this.setXY(this.x - v.x, this.y - v.y);
  }

  /**
   * Subtracts this vector by another vector (x,y), changing this vector.
   *
   * This is the mutable form of the function minusXY(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  subtractXY(x, y) {
    return this.setXY(this.x - x, this.y - y);
  }

  /**
   * Subtracts this vector by a scalar (subtracts each component by the scalar), changing this vector.
   *
   * This is the mutable form of the function minusScalar(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  subtractScalar(scalar) {
    return this.setXY(this.x - scalar, this.y - scalar);
  }

  /**
   * Multiplies this vector by a scalar (multiplies each component by the scalar), changing this vector.
   *
   * This is the mutable form of the function timesScalar(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  multiplyScalar(scalar) {
    return this.setXY(this.x * scalar, this.y * scalar);
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
    return this.setXY(this.x * v.x, this.y * v.y);
  }

  /**
   * Divides this vector by a scalar (divides each component by the scalar), changing this vector.
   *
   * This is the mutable form of the function dividedScalar(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  divideScalar(scalar) {
    return this.setXY(this.x / scalar, this.y / scalar);
  }

  /**
   * Negates this vector (multiplies each component by -1), changing this vector.
   *
   * This is the mutable form of the function negated(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  negate() {
    return this.setXY(-this.x, -this.y);
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
    } else {
      return this.divideScalar(mag);
    }
  }

  /**
   * Rounds each component of this vector with Utils.roundSymmetric.
   *
   * This is the mutable form of the function roundedSymmetric(). This will mutate (change) this vector, in addition
   * to returning the vector itself.
   */
  roundSymmetric() {
    return this.setXY(Utils.roundSymmetric(this.x), Utils.roundSymmetric(this.y));
  }

  /**
   * Rotates this vector by the angle (in radians), changing this vector.
   *
   * This is the mutable form of the function rotated(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   *
   * @param angle - In radians
   */
  rotate(angle) {
    const newAngle = this.angle + angle;
    const mag = this.magnitude;
    return this.setXY(mag * Math.cos(newAngle), mag * Math.sin(newAngle));
  }

  /**
   * Sets this vector's value to be the x,y values matching the given magnitude and angle (in radians), changing
   * this vector, and returning itself.
   *
   * @param magnitude
   * @param angle - In radians
   */
  setPolar(magnitude, angle) {
    return this.setXY(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
  }

  /**
   * Returns a duck-typed object meant for use with tandem/phet-io serialization. Although this is redundant with
   * stateSchema, it is a nice feature of such a heavily-used type to be able to call toStateObject directly on the type.
   *
   * @returns - see stateSchema for schema
   */
  toStateObject() {
    return {
      x: this.x,
      y: this.y
    };
  }
  freeToPool() {
    Vector2.pool.freeToPool(this);
  }
  static pool = new Pool(Vector2, {
    maxSize: 1000,
    initialize: Vector2.prototype.setXY,
    defaultArguments: [0, 0]
  });

  // static methods

  /**
   * Returns a Vector2 with the specified magnitude $r$ and angle $\theta$ (in radians), with the formula:
   * $$ f( r, \theta ) = \begin{bmatrix} r\cos\theta \\ r\sin\theta \end{bmatrix} $$
   */
  static createPolar(magnitude, angle) {
    return new Vector2(0, 0).setPolar(magnitude, angle);
  }

  /**
   * Constructs a Vector2 from a duck-typed object, for use with tandem/phet-io deserialization.
   *
   * @param stateObject - see stateSchema for schema
   */
  static fromStateObject(stateObject) {
    return v2(stateObject.x, stateObject.y);
  }

  /**
   * Allocation-free implementation that gets the angle between two vectors
   *
   * @returns the angle between the vectors
   */
  static getAngleBetweenVectors(startVector, endVector) {
    const dx = endVector.x - startVector.x;
    const dy = endVector.y - startVector.y;
    return Math.atan2(dy, dx);
  }

  /**
   * Allocation-free way to get the distance between vectors.
   *
   * @returns the angle between the vectors
   */
  static getDistanceBetweenVectors(startVector, endVector) {
    const dx = endVector.x - startVector.x;
    const dy = endVector.y - startVector.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * ImmutableVector2 zero vector: $\begin{bmatrix} 0\\0 \end{bmatrix}$
   */
  // eslint-disable-line uppercase-statics-should-be-readonly

  /**
   * ImmutableVector2 vector: $\begin{bmatrix} 1\\0 \end{bmatrix}$
   */
  // eslint-disable-line uppercase-statics-should-be-readonly

  /**
   * ImmutableVector2 vector: $\begin{bmatrix} 0\\1 \end{bmatrix}$
   */
  // eslint-disable-line uppercase-statics-should-be-readonly
}

// (read-only) - Helps to identify the dimension of the vector
Vector2.prototype.isVector2 = true;
Vector2.prototype.dimension = 2;
dot.register('Vector2', Vector2);
const v2 = Vector2.pool.create.bind(Vector2.pool);
dot.register('v2', v2);
class ImmutableVector2 extends Vector2 {
  /**
   * Throw errors whenever a mutable method is called on our immutable vector
   */
  static mutableOverrideHelper(mutableFunctionName) {
    ImmutableVector2.prototype[mutableFunctionName] = () => {
      throw new Error(`Cannot call mutable method '${mutableFunctionName}' on immutable Vector2`);
    };
  }
}
ImmutableVector2.mutableOverrideHelper('setXY');
ImmutableVector2.mutableOverrideHelper('setX');
ImmutableVector2.mutableOverrideHelper('setY');
Vector2.ZERO = assert ? new ImmutableVector2(0, 0) : new Vector2(0, 0);
Vector2.X_UNIT = assert ? new ImmutableVector2(1, 0) : new Vector2(1, 0);
Vector2.Y_UNIT = assert ? new ImmutableVector2(0, 1) : new Vector2(0, 1);
const STATE_SCHEMA = {
  x: NumberIO,
  y: NumberIO
};
Vector2.Vector2IO = new IOType('Vector2IO', {
  valueType: Vector2,
  stateSchema: STATE_SCHEMA,
  toStateObject: vector2 => vector2.toStateObject(),
  fromStateObject: stateObject => Vector2.fromStateObject(stateObject),
  documentation: 'A numerical object with x and y properties, like {x:3,y:4}'
});
export { v2 };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQb29sIiwiSU9UeXBlIiwiTnVtYmVySU8iLCJkb3QiLCJVdGlscyIsIlZlY3RvcjMiLCJBRERJTkdfQUNDVU1VTEFUT1IiLCJ2ZWN0b3IiLCJuZXh0VmVjdG9yIiwiYWRkIiwiVmVjdG9yMiIsImNvbnN0cnVjdG9yIiwieCIsInkiLCJnZXRNYWduaXR1ZGUiLCJNYXRoIiwic3FydCIsIm1hZ25pdHVkZVNxdWFyZWQiLCJtYWduaXR1ZGUiLCJnZXRNYWduaXR1ZGVTcXVhcmVkIiwiZGlzdGFuY2UiLCJwb2ludCIsImRpc3RhbmNlU3F1YXJlZCIsImRpc3RhbmNlWFkiLCJkeCIsImR5IiwiZGlzdGFuY2VTcXVhcmVkWFkiLCJ2IiwiZG90WFkiLCJnZXRBbmdsZSIsImF0YW4yIiwiYW5nbGUiLCJhbmdsZUJldHdlZW4iLCJ0aGlzTWFnbml0dWRlIiwidk1hZ25pdHVkZSIsImFjb3MiLCJjbGFtcCIsImVxdWFscyIsIm90aGVyIiwiZXF1YWxzRXBzaWxvbiIsImVwc2lsb24iLCJtYXgiLCJhYnMiLCJpc0Zpbml0ZSIsImNvcHkiLCJzZXQiLCJ2MiIsImNyb3NzU2NhbGFyIiwibm9ybWFsaXplZCIsIm1hZyIsIkVycm9yIiwicm91bmRlZFN5bW1ldHJpYyIsInJvdW5kU3ltbWV0cmljIiwid2l0aE1hZ25pdHVkZSIsInNldE1hZ25pdHVkZSIsInRpbWVzU2NhbGFyIiwic2NhbGFyIiwidGltZXMiLCJjb21wb25lbnRUaW1lcyIsInBsdXMiLCJwbHVzWFkiLCJwbHVzU2NhbGFyIiwibWludXMiLCJtaW51c1hZIiwibWludXNTY2FsYXIiLCJkaXZpZGVkU2NhbGFyIiwibmVnYXRlZCIsImdldFBlcnBlbmRpY3VsYXIiLCJwZXJwZW5kaWN1bGFyIiwicm90YXRlZCIsIm5ld0FuZ2xlIiwiY29zIiwic2luIiwicm90YXRlQWJvdXRYWSIsInJvdGF0ZUFib3V0UG9pbnQiLCJyb3RhdGVkQWJvdXRYWSIsInJvdGF0ZWRBYm91dFBvaW50IiwiYmxlbmQiLCJyYXRpbyIsImF2ZXJhZ2UiLCJ2ZWN0b3JzIiwiYWRkZWQiLCJfIiwicmVkdWNlIiwiZGl2aWRlU2NhbGFyIiwibGVuZ3RoIiwidG9TdHJpbmciLCJ0b1ZlY3RvcjMiLCJzZXRYWSIsInNldFgiLCJzZXRZIiwic2NhbGUiLCJtdWx0aXBseVNjYWxhciIsImFkZFhZIiwiYWRkU2NhbGFyIiwic3VidHJhY3QiLCJzdWJ0cmFjdFhZIiwic3VidHJhY3RTY2FsYXIiLCJtdWx0aXBseSIsImNvbXBvbmVudE11bHRpcGx5IiwibmVnYXRlIiwibm9ybWFsaXplIiwicm90YXRlIiwic2V0UG9sYXIiLCJ0b1N0YXRlT2JqZWN0IiwiZnJlZVRvUG9vbCIsInBvb2wiLCJtYXhTaXplIiwiaW5pdGlhbGl6ZSIsInByb3RvdHlwZSIsImRlZmF1bHRBcmd1bWVudHMiLCJjcmVhdGVQb2xhciIsImZyb21TdGF0ZU9iamVjdCIsInN0YXRlT2JqZWN0IiwiZ2V0QW5nbGVCZXR3ZWVuVmVjdG9ycyIsInN0YXJ0VmVjdG9yIiwiZW5kVmVjdG9yIiwiZ2V0RGlzdGFuY2VCZXR3ZWVuVmVjdG9ycyIsImlzVmVjdG9yMiIsImRpbWVuc2lvbiIsInJlZ2lzdGVyIiwiY3JlYXRlIiwiYmluZCIsIkltbXV0YWJsZVZlY3RvcjIiLCJtdXRhYmxlT3ZlcnJpZGVIZWxwZXIiLCJtdXRhYmxlRnVuY3Rpb25OYW1lIiwiWkVSTyIsImFzc2VydCIsIlhfVU5JVCIsIllfVU5JVCIsIlNUQVRFX1NDSEVNQSIsIlZlY3RvcjJJTyIsInZhbHVlVHlwZSIsInN0YXRlU2NoZW1hIiwidmVjdG9yMiIsImRvY3VtZW50YXRpb24iXSwic291cmNlcyI6WyJWZWN0b3IyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEJhc2ljIDItZGltZW5zaW9uYWwgdmVjdG9yLCByZXByZXNlbnRlZCBhcyAoeCx5KS4gIFZhbHVlcyBjYW4gYmUgbnVtZXJpYywgb3IgTmFOIG9yIGluZmluaXRlLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IFBvb2wsIHsgVFBvb2xhYmxlIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL1Bvb2wuanMnO1xyXG5pbXBvcnQgSU9UeXBlIGZyb20gJy4uLy4uL3RhbmRlbS9qcy90eXBlcy9JT1R5cGUuanMnO1xyXG5pbXBvcnQgTnVtYmVySU8gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL051bWJlcklPLmpzJztcclxuaW1wb3J0IGRvdCBmcm9tICcuL2RvdC5qcyc7XHJcbmltcG9ydCBVdGlscyBmcm9tICcuL1V0aWxzLmpzJztcclxuaW1wb3J0IFZlY3RvcjMgZnJvbSAnLi9WZWN0b3IzLmpzJztcclxuaW1wb3J0IHsgU3RhdGVPYmplY3QgfSBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvU3RhdGVTY2hlbWEuanMnO1xyXG5cclxuY29uc3QgQURESU5HX0FDQ1VNVUxBVE9SID0gKCB2ZWN0b3I6IFZlY3RvcjIsIG5leHRWZWN0b3I6IFZlY3RvcjIgKSA9PiB7XHJcbiAgcmV0dXJuIHZlY3Rvci5hZGQoIG5leHRWZWN0b3IgKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZlY3RvcjIgaW1wbGVtZW50cyBUUG9vbGFibGUge1xyXG5cclxuICAvLyBUaGUgWCBjb29yZGluYXRlIG9mIHRoZSB2ZWN0b3IuXHJcbiAgcHVibGljIHg6IG51bWJlcjtcclxuXHJcbiAgLy8gVGhlIFkgY29vcmRpbmF0ZSBvZiB0aGUgdmVjdG9yLlxyXG4gIHB1YmxpYyB5OiBudW1iZXI7XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSAyLWRpbWVuc2lvbmFsIHZlY3RvciB3aXRoIHRoZSBzcGVjaWZpZWQgWCBhbmQgWSB2YWx1ZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0geCAtIFggY29vcmRpbmF0ZVxyXG4gICAqIEBwYXJhbSB5IC0gWSBjb29yZGluYXRlXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCB4OiBudW1iZXIsIHk6IG51bWJlciApIHtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIG1hZ25pdHVkZSAoRXVjbGlkZWFuL0wyIE5vcm0pIG9mIHRoaXMgdmVjdG9yLCBpLmUuICRcXHNxcnR7eF4yK3leMn0kLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNYWduaXR1ZGUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBNYXRoLnNxcnQoIHRoaXMubWFnbml0dWRlU3F1YXJlZCApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBtYWduaXR1ZGUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0TWFnbml0dWRlKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHNxdWFyZWQgbWFnbml0dWRlIChzcXVhcmUgb2YgdGhlIEV1Y2xpZGVhbi9MMiBOb3JtKSBvZiB0aGlzIHZlY3RvciwgaS5lLiAkeF4yK3leMiQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldE1hZ25pdHVkZVNxdWFyZWQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IG1hZ25pdHVkZVNxdWFyZWQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0TWFnbml0dWRlU3F1YXJlZCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBFdWNsaWRlYW4gZGlzdGFuY2UgYmV0d2VlbiB0aGlzIHZlY3RvciAodHJlYXRlZCBhcyBhIHBvaW50KSBhbmQgYW5vdGhlciBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgZGlzdGFuY2UoIHBvaW50OiBWZWN0b3IyICk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCB0aGlzLmRpc3RhbmNlU3F1YXJlZCggcG9pbnQgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIEV1Y2xpZGVhbiBkaXN0YW5jZSBiZXR3ZWVuIHRoaXMgdmVjdG9yICh0cmVhdGVkIGFzIGEgcG9pbnQpIGFuZCBhbm90aGVyIHBvaW50ICh4LHkpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXN0YW5jZVhZKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgY29uc3QgZHggPSB0aGlzLnggLSB4O1xyXG4gICAgY29uc3QgZHkgPSB0aGlzLnkgLSB5O1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCggZHggKiBkeCArIGR5ICogZHkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBzcXVhcmVkIEV1Y2xpZGVhbiBkaXN0YW5jZSBiZXR3ZWVuIHRoaXMgdmVjdG9yICh0cmVhdGVkIGFzIGEgcG9pbnQpIGFuZCBhbm90aGVyIHBvaW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXN0YW5jZVNxdWFyZWQoIHBvaW50OiBWZWN0b3IyICk6IG51bWJlciB7XHJcbiAgICBjb25zdCBkeCA9IHRoaXMueCAtIHBvaW50Lng7XHJcbiAgICBjb25zdCBkeSA9IHRoaXMueSAtIHBvaW50Lnk7XHJcbiAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgc3F1YXJlZCBFdWNsaWRlYW4gZGlzdGFuY2UgYmV0d2VlbiB0aGlzIHZlY3RvciAodHJlYXRlZCBhcyBhIHBvaW50KSBhbmQgYW5vdGhlciBwb2ludCB3aXRoIGNvb3JkaW5hdGVzICh4LHkpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXN0YW5jZVNxdWFyZWRYWSggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogbnVtYmVyIHtcclxuICAgIGNvbnN0IGR4ID0gdGhpcy54IC0geDtcclxuICAgIGNvbnN0IGR5ID0gdGhpcy55IC0geTtcclxuICAgIHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBkb3QtcHJvZHVjdCAoRXVjbGlkZWFuIGlubmVyIHByb2R1Y3QpIGJldHdlZW4gdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXIgdmVjdG9yIHYuXHJcbiAgICovXHJcbiAgcHVibGljIGRvdCggdjogVmVjdG9yMiApOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBkb3QtcHJvZHVjdCAoRXVjbGlkZWFuIGlubmVyIHByb2R1Y3QpIGJldHdlZW4gdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXIgdmVjdG9yICh4LHkpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkb3RYWSggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLnggKiB4ICsgdGhpcy55ICogeTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBhbmdsZSAkXFx0aGV0YSQgb2YgdGhpcyB2ZWN0b3IsIHN1Y2ggdGhhdCB0aGlzIHZlY3RvciBpcyBlcXVhbCB0b1xyXG4gICAqICQkIHUgPSBcXGJlZ2lue2JtYXRyaXh9IHJcXGNvc1xcdGhldGEgXFxcXCByXFxzaW5cXHRoZXRhIFxcZW5ke2JtYXRyaXh9ICQkXHJcbiAgICogZm9yIHRoZSBtYWduaXR1ZGUgJHIgXFxnZSAwJCBvZiB0aGUgdmVjdG9yLCB3aXRoICRcXHRoZXRhXFxpbigtXFxwaSxcXHBpXSRcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0QW5nbGUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBNYXRoLmF0YW4yKCB0aGlzLnksIHRoaXMueCApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBhbmdsZSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0QW5nbGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBhbmdsZSBiZXR3ZWVuIHRoaXMgdmVjdG9yIGFuZCBhbm90aGVyIHZlY3RvciwgaW4gdGhlIHJhbmdlICRcXHRoZXRhXFxpblswLCBcXHBpXSQuXHJcbiAgICpcclxuICAgKiBFcXVhbCB0byAkXFx0aGV0YSA9IFxcY29zXnstMX0oIFxcaGF0e3V9IFxcY2RvdCBcXGhhdHt2fSApJCB3aGVyZSAkXFxoYXR7dX0kIGlzIHRoaXMgdmVjdG9yIChub3JtYWxpemVkKSBhbmQgJFxcaGF0e3Z9JFxyXG4gICAqIGlzIHRoZSBpbnB1dCB2ZWN0b3IgKG5vcm1hbGl6ZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhbmdsZUJldHdlZW4oIHY6IFZlY3RvcjIgKTogbnVtYmVyIHtcclxuICAgIGNvbnN0IHRoaXNNYWduaXR1ZGUgPSB0aGlzLm1hZ25pdHVkZTtcclxuICAgIGNvbnN0IHZNYWduaXR1ZGUgPSB2Lm1hZ25pdHVkZTtcclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETzogaW1wb3J0IHdpdGggY2lyY3VsYXIgcHJvdGVjdGlvbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZG90L2lzc3Vlcy85NlxyXG4gICAgcmV0dXJuIE1hdGguYWNvcyggZG90LmNsYW1wKCAoIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueSApIC8gKCB0aGlzTWFnbml0dWRlICogdk1hZ25pdHVkZSApLCAtMSwgMSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeGFjdCBlcXVhbGl0eSBjb21wYXJpc29uIGJldHdlZW4gdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXIgdmVjdG9yLlxyXG5cclxuICAgKiBAcmV0dXJucyAtIFdoZXRoZXIgdGhlIHR3byB2ZWN0b3JzIGhhdmUgZXF1YWwgY29tcG9uZW50c1xyXG4gICAqL1xyXG4gIHB1YmxpYyBlcXVhbHMoIG90aGVyOiBWZWN0b3IyICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMueCA9PT0gb3RoZXIueCAmJiB0aGlzLnkgPT09IG90aGVyLnk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcHByb3hpbWF0ZSBlcXVhbGl0eSBjb21wYXJpc29uIGJldHdlZW4gdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXIgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBXaGV0aGVyIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgdHdvIHZlY3RvcnMgaGFzIG5vIGNvbXBvbmVudCB3aXRoIGFuIGFic29sdXRlIHZhbHVlIGdyZWF0ZXIgdGhhbiBlcHNpbG9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBlcXVhbHNFcHNpbG9uKCBvdGhlcjogVmVjdG9yMiwgZXBzaWxvbjogbnVtYmVyICk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCAhZXBzaWxvbiApIHtcclxuICAgICAgZXBzaWxvbiA9IDA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gTWF0aC5tYXgoIE1hdGguYWJzKCB0aGlzLnggLSBvdGhlci54ICksIE1hdGguYWJzKCB0aGlzLnkgLSBvdGhlci55ICkgKSA8PSBlcHNpbG9uO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBmYWxzZSBpZiBlaXRoZXIgY29tcG9uZW50IGlzIE5hTiwgaW5maW5pdHksIG9yIC1pbmZpbml0eS4gT3RoZXJ3aXNlIHJldHVybnMgdHJ1ZS5cclxuICAgKi9cclxuICBwdWJsaWMgaXNGaW5pdGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gaXNGaW5pdGUoIHRoaXMueCApICYmIGlzRmluaXRlKCB0aGlzLnkgKTtcclxuICB9XHJcblxyXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxyXG4gICAqIEltbXV0YWJsZXNcclxuICAgKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBjb3B5IG9mIHRoaXMgdmVjdG9yLCBvciBpZiBhIHZlY3RvciBpcyBwYXNzZWQgaW4sIHNldCB0aGF0IHZlY3RvcidzIHZhbHVlcyB0byBvdXJzLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHNldCgpLCBpZiBhIHZlY3RvciBpcyBwcm92aWRlZC4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZFxyXG4gICAqIHdpbGwgbm90IG1vZGlmeSB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBbdmVjdG9yXSAtIElmIG5vdCBwcm92aWRlZCwgY3JlYXRlcyBhIG5ldyBWZWN0b3IyIHdpdGggZmlsbGVkIGluIHZhbHVlcy4gT3RoZXJ3aXNlLCBmaWxscyBpbiB0aGVcclxuICAgKiAgICAgICAgICAgICAgICAgICB2YWx1ZXMgb2YgdGhlIHByb3ZpZGVkIHZlY3RvciBzbyB0aGF0IGl0IGVxdWFscyB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgY29weSggdmVjdG9yPzogVmVjdG9yMiApOiBWZWN0b3IyIHtcclxuICAgIGlmICggdmVjdG9yICkge1xyXG4gICAgICByZXR1cm4gdmVjdG9yLnNldCggdGhpcyApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiB2MiggdGhpcy54LCB0aGlzLnkgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBzY2FsYXIgdmFsdWUgb2YgdGhlIHotY29tcG9uZW50IG9mIHRoZSBlcXVpdmFsZW50IDMtZGltZW5zaW9uYWwgY3Jvc3MgcHJvZHVjdDpcclxuICAgKiAkJCBmKCB1LCB2ICkgPSBcXGxlZnQoIFxcYmVnaW57Ym1hdHJpeH0gdV94IFxcXFwgdV95IFxcXFwgMCBcXGVuZHtibWF0cml4fSBcXHRpbWVzIFxcYmVnaW57Ym1hdHJpeH0gdl94IFxcXFwgdl95IFxcXFwgMCBcXGVuZHtibWF0cml4fSBcXHJpZ2h0KV96ID0gdV94IHZfeSAtIHVfeSB2X3ggJCRcclxuICAgKi9cclxuICBwdWJsaWMgY3Jvc3NTY2FsYXIoIHY6IFZlY3RvcjIgKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLnggKiB2LnkgLSB0aGlzLnkgKiB2Lng7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBOb3JtYWxpemVkIChyZS1zY2FsZWQpIGNvcHkgb2YgdGhpcyB2ZWN0b3Igc3VjaCB0aGF0IGl0cyBtYWduaXR1ZGUgaXMgMS4gSWYgaXRzIGluaXRpYWwgbWFnbml0dWRlIGlzIHplcm8sIGFuXHJcbiAgICogZXJyb3IgaXMgdGhyb3duLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIG5vcm1hbGl6ZSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IHZlY3RvciwgYW5kIHdpbGwgbm90IG1vZGlmeSB0aGlzXHJcbiAgICogdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBub3JtYWxpemVkKCk6IFZlY3RvcjIge1xyXG4gICAgY29uc3QgbWFnID0gdGhpcy5tYWduaXR1ZGU7XHJcbiAgICBpZiAoIG1hZyA9PT0gMCApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQ2Fubm90IG5vcm1hbGl6ZSBhIHplcm8tbWFnbml0dWRlIHZlY3RvcicgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gdjIoIHRoaXMueCAvIG1hZywgdGhpcy55IC8gbWFnICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgY29weSBvZiB0aGlzIHZlY3RvciB3aXRoIGVhY2ggY29tcG9uZW50IHJvdW5kZWQgYnkgVXRpbHMucm91bmRTeW1tZXRyaWMuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gcm91bmRTeW1tZXRyaWMoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgcm91bmRlZFN5bW1ldHJpYygpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmNvcHkoKS5yb3VuZFN5bW1ldHJpYygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmUtc2NhbGVkIGNvcHkgb2YgdGhpcyB2ZWN0b3Igc3VjaCB0aGF0IGl0IGhhcyB0aGUgZGVzaXJlZCBtYWduaXR1ZGUuIElmIGl0cyBpbml0aWFsIG1hZ25pdHVkZSBpcyB6ZXJvLCBhbiBlcnJvclxyXG4gICAqIGlzIHRocm93bi4gSWYgdGhlIHBhc3NlZC1pbiBtYWduaXR1ZGUgaXMgbmVnYXRpdmUsIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHJlc3VsdGluZyB2ZWN0b3Igd2lsbCBiZSByZXZlcnNlZC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBzZXRNYWduaXR1ZGUoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgd2l0aE1hZ25pdHVkZSggbWFnbml0dWRlOiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5jb3B5KCkuc2V0TWFnbml0dWRlKCBtYWduaXR1ZGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvcHkgb2YgdGhpcyB2ZWN0b3IsIHNjYWxlZCBieSB0aGUgZGVzaXJlZCBzY2FsYXIgdmFsdWUuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gbXVsdGlwbHlTY2FsYXIoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgdGltZXNTY2FsYXIoIHNjYWxhcjogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHYyKCB0aGlzLnggKiBzY2FsYXIsIHRoaXMueSAqIHNjYWxhciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2FtZSBhcyB0aW1lc1NjYWxhci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBtdWx0aXBseSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IHZlY3RvciwgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0aW1lcyggc2NhbGFyOiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy50aW1lc1NjYWxhciggc2NhbGFyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb3B5IG9mIHRoaXMgdmVjdG9yLCBtdWx0aXBsaWVkIGNvbXBvbmVudC13aXNlIGJ5IHRoZSBwYXNzZWQtaW4gdmVjdG9yIHYuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gY29tcG9uZW50TXVsdGlwbHkoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgY29tcG9uZW50VGltZXMoIHY6IFZlY3RvcjIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdjIoIHRoaXMueCAqIHYueCwgdGhpcy55ICogdi55ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRpdGlvbiBvZiB0aGlzIHZlY3RvciBhbmQgYW5vdGhlciB2ZWN0b3IsIHJldHVybmluZyBhIGNvcHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gYWRkKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIHBsdXMoIHY6IFZlY3RvcjIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdjIoIHRoaXMueCArIHYueCwgdGhpcy55ICsgdi55ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRpdGlvbiBvZiB0aGlzIHZlY3RvciBhbmQgYW5vdGhlciB2ZWN0b3IgKHgseSksIHJldHVybmluZyBhIGNvcHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gYWRkWFkoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgcGx1c1hZKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB2MiggdGhpcy54ICsgeCwgdGhpcy55ICsgeSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkaXRpb24gb2YgdGhpcyB2ZWN0b3Igd2l0aCBhIHNjYWxhciAoYWRkcyB0aGUgc2NhbGFyIHRvIGV2ZXJ5IGNvbXBvbmVudCksIHJldHVybmluZyBhIGNvcHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gYWRkU2NhbGFyKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIHBsdXNTY2FsYXIoIHNjYWxhcjogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHYyKCB0aGlzLnggKyBzY2FsYXIsIHRoaXMueSArIHNjYWxhciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3VidHJhY3Rpb24gb2YgdGhpcyB2ZWN0b3IgYnkgYW5vdGhlciB2ZWN0b3IgdiwgcmV0dXJuaW5nIGEgY29weS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBzdWJ0cmFjdCgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IHZlY3RvciwgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtaW51cyggdjogVmVjdG9yMiApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB2MiggdGhpcy54IC0gdi54LCB0aGlzLnkgLSB2LnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1YnRyYWN0aW9uIG9mIHRoaXMgdmVjdG9yIGJ5IGFub3RoZXIgdmVjdG9yICh4LHkpLCByZXR1cm5pbmcgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHN1YnRyYWN0WFkoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgbWludXNYWSggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdjIoIHRoaXMueCAtIHgsIHRoaXMueSAtIHkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1YnRyYWN0aW9uIG9mIHRoaXMgdmVjdG9yIGJ5IGEgc2NhbGFyIChzdWJ0cmFjdHMgdGhlIHNjYWxhciBmcm9tIGV2ZXJ5IGNvbXBvbmVudCksIHJldHVybmluZyBhIGNvcHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc3VidHJhY3RTY2FsYXIoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgbWludXNTY2FsYXIoIHNjYWxhcjogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHYyKCB0aGlzLnggLSBzY2FsYXIsIHRoaXMueSAtIHNjYWxhciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGl2aXNpb24gb2YgdGhpcyB2ZWN0b3IgYnkgYSBzY2FsYXIgKGRpdmlkZXMgZXZlcnkgY29tcG9uZW50IGJ5IHRoZSBzY2FsYXIpLCByZXR1cm5pbmcgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGRpdmlkZVNjYWxhcigpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IHZlY3RvciwgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXZpZGVkU2NhbGFyKCBzY2FsYXI6IG51bWJlciApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB2MiggdGhpcy54IC8gc2NhbGFyLCB0aGlzLnkgLyBzY2FsYXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE5lZ2F0ZWQgY29weSBvZiB0aGlzIHZlY3RvciAobXVsdGlwbGllcyBldmVyeSBjb21wb25lbnQgYnkgLTEpLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIG5lZ2F0ZSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IHZlY3RvciwgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBuZWdhdGVkKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHYyKCAtdGhpcy54LCAtdGhpcy55ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSb3RhdGVkIGJ5IC1waS8yIChwZXJwZW5kaWN1bGFyIHRvIHRoaXMgdmVjdG9yKSwgcmV0dXJuZWQgYXMgYSBjb3B5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRQZXJwZW5kaWN1bGFyKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHYyKCB0aGlzLnksIC10aGlzLnggKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcGVycGVuZGljdWxhcigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFBlcnBlbmRpY3VsYXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJvdGF0ZWQgYnkgYW4gYXJiaXRyYXJ5IGFuZ2xlLCBpbiByYWRpYW5zLiBSZXR1cm5lZCBhcyBhIGNvcHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gcm90YXRlKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYW5nbGUgLSBJbiByYWRpYW5zXHJcbiAgICovXHJcbiAgcHVibGljIHJvdGF0ZWQoIGFuZ2xlOiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICBjb25zdCBuZXdBbmdsZSA9IHRoaXMuYW5nbGUgKyBhbmdsZTtcclxuICAgIGNvbnN0IG1hZyA9IHRoaXMubWFnbml0dWRlO1xyXG4gICAgcmV0dXJuIHYyKCBtYWcgKiBNYXRoLmNvcyggbmV3QW5nbGUgKSwgbWFnICogTWF0aC5zaW4oIG5ld0FuZ2xlICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE11dGFibGUgbWV0aG9kIHRoYXQgcm90YXRlcyB0aGlzIHZlY3RvciBhYm91dCBhbiB4LHkgcG9pbnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0geCAtIG9yaWdpbiBvZiByb3RhdGlvbiBpbiB4XHJcbiAgICogQHBhcmFtIHkgLSBvcmlnaW4gb2Ygcm90YXRpb24gaW4geVxyXG4gICAqIEBwYXJhbSBhbmdsZSAtIHJhZGlhbnMgdG8gcm90YXRlXHJcbiAgICogQHJldHVybnMgdGhpcyBmb3IgY2hhaW5pbmdcclxuICAgKi9cclxuICBwdWJsaWMgcm90YXRlQWJvdXRYWSggeDogbnVtYmVyLCB5OiBudW1iZXIsIGFuZ2xlOiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICBjb25zdCBkeCA9IHRoaXMueCAtIHg7XHJcbiAgICBjb25zdCBkeSA9IHRoaXMueSAtIHk7XHJcbiAgICBjb25zdCBjb3MgPSBNYXRoLmNvcyggYW5nbGUgKTtcclxuICAgIGNvbnN0IHNpbiA9IE1hdGguc2luKCBhbmdsZSApO1xyXG4gICAgdGhpcy54ID0geCArIGR4ICogY29zIC0gZHkgKiBzaW47XHJcbiAgICB0aGlzLnkgPSB5ICsgZHggKiBzaW4gKyBkeSAqIGNvcztcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNhbWUgYXMgcm90YXRlQWJvdXRYWSBidXQgd2l0aCBhIHBvaW50IGFyZ3VtZW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyByb3RhdGVBYm91dFBvaW50KCBwb2ludDogVmVjdG9yMiwgYW5nbGU6IG51bWJlciApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLnJvdGF0ZUFib3V0WFkoIHBvaW50LngsIHBvaW50LnksIGFuZ2xlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbW11dGFibGUgbWV0aG9kIHRoYXQgcmV0dXJucyBhIG5ldyBWZWN0b3IyIHRoYXQgaXMgcm90YXRlZCBhYm91dCB0aGUgZ2l2ZW4gcG9pbnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0geCAtIG9yaWdpbiBmb3Igcm90YXRpb24gaW4geFxyXG4gICAqIEBwYXJhbSB5IC0gb3JpZ2luIGZvciByb3RhdGlvbiBpbiB5XHJcbiAgICogQHBhcmFtIGFuZ2xlIC0gcmFkaWFucyB0byByb3RhdGVcclxuICAgKi9cclxuICBwdWJsaWMgcm90YXRlZEFib3V0WFkoIHg6IG51bWJlciwgeTogbnVtYmVyLCBhbmdsZTogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHYyKCB0aGlzLngsIHRoaXMueSApLnJvdGF0ZUFib3V0WFkoIHgsIHksIGFuZ2xlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbW11dGFibGUgbWV0aG9kIHRoYXQgcmV0dXJucyBhIG5ldyBWZWN0b3IyIHJvdGF0ZWQgYWJvdXQgdGhlIGdpdmVuIHBvaW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyByb3RhdGVkQWJvdXRQb2ludCggcG9pbnQ6IFZlY3RvcjIsIGFuZ2xlOiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5yb3RhdGVkQWJvdXRYWSggcG9pbnQueCwgcG9pbnQueSwgYW5nbGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgbGluZWFyIGludGVycG9sYXRpb24gYmV0d2VlbiB0aGlzIHZlY3RvciAocmF0aW89MCkgYW5kIGFub3RoZXIgdmVjdG9yIChyYXRpbz0xKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB2ZWN0b3JcclxuICAgKiBAcGFyYW0gcmF0aW8gLSBOb3QgbmVjZXNzYXJpbHkgY29uc3RyYWluZWQgaW4gWzAsIDFdXHJcbiAgICovXHJcbiAgcHVibGljIGJsZW5kKCB2ZWN0b3I6IFZlY3RvcjIsIHJhdGlvOiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdjIoIHRoaXMueCArICggdmVjdG9yLnggLSB0aGlzLnggKSAqIHJhdGlvLCB0aGlzLnkgKyAoIHZlY3Rvci55IC0gdGhpcy55ICkgKiByYXRpbyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGF2ZXJhZ2UgKG1pZHBvaW50KSBiZXR3ZWVuIHRoaXMgdmVjdG9yIGFuZCBhbm90aGVyIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgYXZlcmFnZSggdmVjdG9yOiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuYmxlbmQoIHZlY3RvciwgMC41ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlIGEgY29tcG9uZW50LWJhc2VkIG1lYW4gb2YgYWxsIHZlY3RvcnMgcHJvdmlkZWQuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBhdmVyYWdlKCB2ZWN0b3JzOiBWZWN0b3IyW10gKTogVmVjdG9yMiB7XHJcbiAgICBjb25zdCBhZGRlZCA9IF8ucmVkdWNlKCB2ZWN0b3JzLCBBRERJTkdfQUNDVU1VTEFUT1IsIG5ldyBWZWN0b3IyKCAwLCAwICkgKTtcclxuICAgIHJldHVybiBhZGRlZC5kaXZpZGVTY2FsYXIoIHZlY3RvcnMubGVuZ3RoICk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogRGVidWdnaW5nIHN0cmluZyBmb3IgdGhlIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBgVmVjdG9yMigke3RoaXMueH0sICR7dGhpcy55fSlgO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udmVydHMgdGhpcyB0byBhIDMtZGltZW5zaW9uYWwgdmVjdG9yLCB3aXRoIHRoZSB6LWNvbXBvbmVudCBlcXVhbCB0byAwLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b1ZlY3RvcjMoKTogVmVjdG9yMyB7XHJcbiAgICByZXR1cm4gbmV3IFZlY3RvcjMoIHRoaXMueCwgdGhpcy55LCAwICk7XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBNdXRhYmxlc1xyXG4gICAqIC0gYWxsIG11dGF0aW9uIHNob3VsZCBnbyB0aHJvdWdoIHNldFhZIC8gc2V0WCAvIHNldFlcclxuICAgKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgYWxsIG9mIHRoZSBjb21wb25lbnRzIG9mIHRoaXMgdmVjdG9yLCByZXR1cm5pbmcgdGhpcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0WFkoIHg6IG51bWJlciwgeTogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHgtY29tcG9uZW50IG9mIHRoaXMgdmVjdG9yLCByZXR1cm5pbmcgdGhpcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0WCggeDogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgdGhpcy54ID0geDtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHktY29tcG9uZW50IG9mIHRoaXMgdmVjdG9yLCByZXR1cm5pbmcgdGhpcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0WSggeTogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgdGhpcy55ID0geTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGlzIHZlY3RvciB0byBiZSBhIGNvcHkgb2YgYW5vdGhlciB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGNvcHkoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG8gcmV0dXJuaW5nXHJcbiAgICogdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQoIHY6IFZlY3RvcjIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWSggdi54LCB2LnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIG1hZ25pdHVkZSBvZiB0aGlzIHZlY3Rvci4gSWYgdGhlIHBhc3NlZC1pbiBtYWduaXR1ZGUgaXMgbmVnYXRpdmUsIHRoaXMgZmxpcHMgdGhlIHZlY3RvciBhbmQgc2V0cyBpdHNcclxuICAgKiBtYWduaXR1ZGUgdG8gYWJzKCBtYWduaXR1ZGUgKS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gd2l0aE1hZ25pdHVkZSgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHNldE1hZ25pdHVkZSggbWFnbml0dWRlOiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICBjb25zdCBzY2FsZSA9IG1hZ25pdHVkZSAvIHRoaXMubWFnbml0dWRlO1xyXG5cclxuICAgIHJldHVybiB0aGlzLm11bHRpcGx5U2NhbGFyKCBzY2FsZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbm90aGVyIHZlY3RvciB0byB0aGlzIHZlY3RvciwgY2hhbmdpbmcgdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHBsdXMoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGQoIHY6IFZlY3RvcjIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWSggdGhpcy54ICsgdi54LCB0aGlzLnkgKyB2LnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW5vdGhlciB2ZWN0b3IgKHgseSkgdG8gdGhpcyB2ZWN0b3IsIGNoYW5naW5nIHRoaXMgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBwbHVzWFkoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRYWSggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWSggdGhpcy54ICsgeCwgdGhpcy55ICsgeSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIHNjYWxhciB0byB0aGlzIHZlY3RvciAoYWRkZWQgdG8gZXZlcnkgY29tcG9uZW50KSwgY2hhbmdpbmcgdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHBsdXNTY2FsYXIoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRTY2FsYXIoIHNjYWxhcjogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0WFkoIHRoaXMueCArIHNjYWxhciwgdGhpcy55ICsgc2NhbGFyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdWJ0cmFjdHMgdGhpcyB2ZWN0b3IgYnkgYW5vdGhlciB2ZWN0b3IsIGNoYW5naW5nIHRoaXMgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBtaW51cygpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHN1YnRyYWN0KCB2OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0WFkoIHRoaXMueCAtIHYueCwgdGhpcy55IC0gdi55ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdWJ0cmFjdHMgdGhpcyB2ZWN0b3IgYnkgYW5vdGhlciB2ZWN0b3IgKHgseSksIGNoYW5naW5nIHRoaXMgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBtaW51c1hZKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyB2ZWN0b3IsIGluIGFkZGl0aW9uIHRvXHJcbiAgICogcmV0dXJuaW5nIHRoaXMgdmVjdG9yIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgc3VidHJhY3RYWSggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWSggdGhpcy54IC0geCwgdGhpcy55IC0geSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3VidHJhY3RzIHRoaXMgdmVjdG9yIGJ5IGEgc2NhbGFyIChzdWJ0cmFjdHMgZWFjaCBjb21wb25lbnQgYnkgdGhlIHNjYWxhciksIGNoYW5naW5nIHRoaXMgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBtaW51c1NjYWxhcigpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHN1YnRyYWN0U2NhbGFyKCBzY2FsYXI6IG51bWJlciApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLnNldFhZKCB0aGlzLnggLSBzY2FsYXIsIHRoaXMueSAtIHNjYWxhciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTXVsdGlwbGllcyB0aGlzIHZlY3RvciBieSBhIHNjYWxhciAobXVsdGlwbGllcyBlYWNoIGNvbXBvbmVudCBieSB0aGUgc2NhbGFyKSwgY2hhbmdpbmcgdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHRpbWVzU2NhbGFyKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyB2ZWN0b3IsIGluIGFkZGl0aW9uIHRvXHJcbiAgICogcmV0dXJuaW5nIHRoaXMgdmVjdG9yIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgbXVsdGlwbHlTY2FsYXIoIHNjYWxhcjogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0WFkoIHRoaXMueCAqIHNjYWxhciwgdGhpcy55ICogc2NhbGFyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNdWx0aXBsaWVzIHRoaXMgdmVjdG9yIGJ5IGEgc2NhbGFyIChtdWx0aXBsaWVzIGVhY2ggY29tcG9uZW50IGJ5IHRoZSBzY2FsYXIpLCBjaGFuZ2luZyB0aGlzIHZlY3Rvci5cclxuICAgKiBTYW1lIGFzIG11bHRpcGx5U2NhbGFyLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiB0aW1lcygpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIG11bHRpcGx5KCBzY2FsYXI6IG51bWJlciApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLm11bHRpcGx5U2NhbGFyKCBzY2FsYXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE11bHRpcGxpZXMgdGhpcyB2ZWN0b3IgYnkgYW5vdGhlciB2ZWN0b3IgY29tcG9uZW50LXdpc2UsIGNoYW5naW5nIHRoaXMgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBjb21wb25lbnRUaW1lcygpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGNvbXBvbmVudE11bHRpcGx5KCB2OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0WFkoIHRoaXMueCAqIHYueCwgdGhpcy55ICogdi55ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEaXZpZGVzIHRoaXMgdmVjdG9yIGJ5IGEgc2NhbGFyIChkaXZpZGVzIGVhY2ggY29tcG9uZW50IGJ5IHRoZSBzY2FsYXIpLCBjaGFuZ2luZyB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gZGl2aWRlZFNjYWxhcigpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGRpdmlkZVNjYWxhciggc2NhbGFyOiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWSggdGhpcy54IC8gc2NhbGFyLCB0aGlzLnkgLyBzY2FsYXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE5lZ2F0ZXMgdGhpcyB2ZWN0b3IgKG11bHRpcGxpZXMgZWFjaCBjb21wb25lbnQgYnkgLTEpLCBjaGFuZ2luZyB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gbmVnYXRlZCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIG5lZ2F0ZSgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLnNldFhZKCAtdGhpcy54LCAtdGhpcy55ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBOb3JtYWxpemVzIHRoaXMgdmVjdG9yIChyZXNjYWxlcyB0byB3aGVyZSB0aGUgbWFnbml0dWRlIGlzIDEpLCBjaGFuZ2luZyB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gbm9ybWFsaXplZCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIG5vcm1hbGl6ZSgpOiBWZWN0b3IyIHtcclxuICAgIGNvbnN0IG1hZyA9IHRoaXMubWFnbml0dWRlO1xyXG4gICAgaWYgKCBtYWcgPT09IDAgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggJ0Nhbm5vdCBub3JtYWxpemUgYSB6ZXJvLW1hZ25pdHVkZSB2ZWN0b3InICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZGl2aWRlU2NhbGFyKCBtYWcgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJvdW5kcyBlYWNoIGNvbXBvbmVudCBvZiB0aGlzIHZlY3RvciB3aXRoIFV0aWxzLnJvdW5kU3ltbWV0cmljLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiByb3VuZGVkU3ltbWV0cmljKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyB2ZWN0b3IsIGluIGFkZGl0aW9uXHJcbiAgICogdG8gcmV0dXJuaW5nIHRoZSB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByb3VuZFN5bW1ldHJpYygpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLnNldFhZKCBVdGlscy5yb3VuZFN5bW1ldHJpYyggdGhpcy54ICksIFV0aWxzLnJvdW5kU3ltbWV0cmljKCB0aGlzLnkgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUm90YXRlcyB0aGlzIHZlY3RvciBieSB0aGUgYW5nbGUgKGluIHJhZGlhbnMpLCBjaGFuZ2luZyB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gcm90YXRlZCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYW5nbGUgLSBJbiByYWRpYW5zXHJcbiAgICovXHJcbiAgcHVibGljIHJvdGF0ZSggYW5nbGU6IG51bWJlciApOiBWZWN0b3IyIHtcclxuICAgIGNvbnN0IG5ld0FuZ2xlID0gdGhpcy5hbmdsZSArIGFuZ2xlO1xyXG4gICAgY29uc3QgbWFnID0gdGhpcy5tYWduaXR1ZGU7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWSggbWFnICogTWF0aC5jb3MoIG5ld0FuZ2xlICksIG1hZyAqIE1hdGguc2luKCBuZXdBbmdsZSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoaXMgdmVjdG9yJ3MgdmFsdWUgdG8gYmUgdGhlIHgseSB2YWx1ZXMgbWF0Y2hpbmcgdGhlIGdpdmVuIG1hZ25pdHVkZSBhbmQgYW5nbGUgKGluIHJhZGlhbnMpLCBjaGFuZ2luZ1xyXG4gICAqIHRoaXMgdmVjdG9yLCBhbmQgcmV0dXJuaW5nIGl0c2VsZi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBtYWduaXR1ZGVcclxuICAgKiBAcGFyYW0gYW5nbGUgLSBJbiByYWRpYW5zXHJcbiAgICovXHJcbiAgcHVibGljIHNldFBvbGFyKCBtYWduaXR1ZGU6IG51bWJlciwgYW5nbGU6IG51bWJlciApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLnNldFhZKCBtYWduaXR1ZGUgKiBNYXRoLmNvcyggYW5nbGUgKSwgbWFnbml0dWRlICogTWF0aC5zaW4oIGFuZ2xlICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBkdWNrLXR5cGVkIG9iamVjdCBtZWFudCBmb3IgdXNlIHdpdGggdGFuZGVtL3BoZXQtaW8gc2VyaWFsaXphdGlvbi4gQWx0aG91Z2ggdGhpcyBpcyByZWR1bmRhbnQgd2l0aFxyXG4gICAqIHN0YXRlU2NoZW1hLCBpdCBpcyBhIG5pY2UgZmVhdHVyZSBvZiBzdWNoIGEgaGVhdmlseS11c2VkIHR5cGUgdG8gYmUgYWJsZSB0byBjYWxsIHRvU3RhdGVPYmplY3QgZGlyZWN0bHkgb24gdGhlIHR5cGUuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyAtIHNlZSBzdGF0ZVNjaGVtYSBmb3Igc2NoZW1hXHJcbiAgICovXHJcbiAgcHVibGljIHRvU3RhdGVPYmplY3QoKTogVmVjdG9yMlN0YXRlT2JqZWN0IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHg6IHRoaXMueCxcclxuICAgICAgeTogdGhpcy55XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGZyZWVUb1Bvb2woKTogdm9pZCB7XHJcbiAgICBWZWN0b3IyLnBvb2wuZnJlZVRvUG9vbCggdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBwb29sID0gbmV3IFBvb2woIFZlY3RvcjIsIHtcclxuICAgIG1heFNpemU6IDEwMDAsXHJcbiAgICBpbml0aWFsaXplOiBWZWN0b3IyLnByb3RvdHlwZS5zZXRYWSxcclxuICAgIGRlZmF1bHRBcmd1bWVudHM6IFsgMCwgMCBdXHJcbiAgfSApO1xyXG5cclxuICAvLyBzdGF0aWMgbWV0aG9kc1xyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgVmVjdG9yMiB3aXRoIHRoZSBzcGVjaWZpZWQgbWFnbml0dWRlICRyJCBhbmQgYW5nbGUgJFxcdGhldGEkIChpbiByYWRpYW5zKSwgd2l0aCB0aGUgZm9ybXVsYTpcclxuICAgKiAkJCBmKCByLCBcXHRoZXRhICkgPSBcXGJlZ2lue2JtYXRyaXh9IHJcXGNvc1xcdGhldGEgXFxcXCByXFxzaW5cXHRoZXRhIFxcZW5ke2JtYXRyaXh9ICQkXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBjcmVhdGVQb2xhciggbWFnbml0dWRlOiBudW1iZXIsIGFuZ2xlOiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gbmV3IFZlY3RvcjIoIDAsIDAgKS5zZXRQb2xhciggbWFnbml0dWRlLCBhbmdsZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RydWN0cyBhIFZlY3RvcjIgZnJvbSBhIGR1Y2stdHlwZWQgb2JqZWN0LCBmb3IgdXNlIHdpdGggdGFuZGVtL3BoZXQtaW8gZGVzZXJpYWxpemF0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHN0YXRlT2JqZWN0IC0gc2VlIHN0YXRlU2NoZW1hIGZvciBzY2hlbWFcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGZyb21TdGF0ZU9iamVjdCggc3RhdGVPYmplY3Q6IFZlY3RvcjJTdGF0ZU9iamVjdCApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB2MihcclxuICAgICAgc3RhdGVPYmplY3QueCxcclxuICAgICAgc3RhdGVPYmplY3QueVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsbG9jYXRpb24tZnJlZSBpbXBsZW1lbnRhdGlvbiB0aGF0IGdldHMgdGhlIGFuZ2xlIGJldHdlZW4gdHdvIHZlY3RvcnNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHRoZSBhbmdsZSBiZXR3ZWVuIHRoZSB2ZWN0b3JzXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBnZXRBbmdsZUJldHdlZW5WZWN0b3JzKCBzdGFydFZlY3RvcjogVmVjdG9yMiwgZW5kVmVjdG9yOiBWZWN0b3IyICk6IG51bWJlciB7XHJcbiAgICBjb25zdCBkeCA9IGVuZFZlY3Rvci54IC0gc3RhcnRWZWN0b3IueDtcclxuICAgIGNvbnN0IGR5ID0gZW5kVmVjdG9yLnkgLSBzdGFydFZlY3Rvci55O1xyXG4gICAgcmV0dXJuIE1hdGguYXRhbjIoIGR5LCBkeCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWxsb2NhdGlvbi1mcmVlIHdheSB0byBnZXQgdGhlIGRpc3RhbmNlIGJldHdlZW4gdmVjdG9ycy5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHRoZSBhbmdsZSBiZXR3ZWVuIHRoZSB2ZWN0b3JzXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBnZXREaXN0YW5jZUJldHdlZW5WZWN0b3JzKCBzdGFydFZlY3RvcjogVmVjdG9yMiwgZW5kVmVjdG9yOiBWZWN0b3IyICk6IG51bWJlciB7XHJcbiAgICBjb25zdCBkeCA9IGVuZFZlY3Rvci54IC0gc3RhcnRWZWN0b3IueDtcclxuICAgIGNvbnN0IGR5ID0gZW5kVmVjdG9yLnkgLSBzdGFydFZlY3Rvci55O1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCggZHggKiBkeCArIGR5ICogZHkgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBpc1ZlY3RvcjIhOiBib29sZWFuO1xyXG4gIHB1YmxpYyBkaW1lbnNpb24hOiBudW1iZXI7XHJcblxyXG4gIC8qKlxyXG4gICAqIEltbXV0YWJsZVZlY3RvcjIgemVybyB2ZWN0b3I6ICRcXGJlZ2lue2JtYXRyaXh9IDBcXFxcMCBcXGVuZHtibWF0cml4fSRcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIFpFUk86IFZlY3RvcjI7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdXBwZXJjYXNlLXN0YXRpY3Mtc2hvdWxkLWJlLXJlYWRvbmx5XHJcblxyXG4gIC8qKlxyXG4gICAqIEltbXV0YWJsZVZlY3RvcjIgdmVjdG9yOiAkXFxiZWdpbntibWF0cml4fSAxXFxcXDAgXFxlbmR7Ym1hdHJpeH0kXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBYX1VOSVQ6IFZlY3RvcjI7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdXBwZXJjYXNlLXN0YXRpY3Mtc2hvdWxkLWJlLXJlYWRvbmx5XHJcblxyXG4gIC8qKlxyXG4gICAqIEltbXV0YWJsZVZlY3RvcjIgdmVjdG9yOiAkXFxiZWdpbntibWF0cml4fSAwXFxcXDEgXFxlbmR7Ym1hdHJpeH0kXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBZX1VOSVQ6IFZlY3RvcjI7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdXBwZXJjYXNlLXN0YXRpY3Mtc2hvdWxkLWJlLXJlYWRvbmx5XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgVmVjdG9yMklPOiBJT1R5cGU7XHJcbn1cclxuXHJcbi8vIChyZWFkLW9ubHkpIC0gSGVscHMgdG8gaWRlbnRpZnkgdGhlIGRpbWVuc2lvbiBvZiB0aGUgdmVjdG9yXHJcblZlY3RvcjIucHJvdG90eXBlLmlzVmVjdG9yMiA9IHRydWU7XHJcblZlY3RvcjIucHJvdG90eXBlLmRpbWVuc2lvbiA9IDI7XHJcblxyXG5kb3QucmVnaXN0ZXIoICdWZWN0b3IyJywgVmVjdG9yMiApO1xyXG5cclxuY29uc3QgdjIgPSBWZWN0b3IyLnBvb2wuY3JlYXRlLmJpbmQoIFZlY3RvcjIucG9vbCApO1xyXG5kb3QucmVnaXN0ZXIoICd2MicsIHYyICk7XHJcblxyXG5jbGFzcyBJbW11dGFibGVWZWN0b3IyIGV4dGVuZHMgVmVjdG9yMiB7XHJcbiAgLyoqXHJcbiAgICogVGhyb3cgZXJyb3JzIHdoZW5ldmVyIGEgbXV0YWJsZSBtZXRob2QgaXMgY2FsbGVkIG9uIG91ciBpbW11dGFibGUgdmVjdG9yXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBtdXRhYmxlT3ZlcnJpZGVIZWxwZXIoIG11dGFibGVGdW5jdGlvbk5hbWU6ICdzZXRYJyB8ICdzZXRZJyB8ICdzZXRYWScgKTogdm9pZCB7XHJcbiAgICBJbW11dGFibGVWZWN0b3IyLnByb3RvdHlwZVsgbXV0YWJsZUZ1bmN0aW9uTmFtZSBdID0gKCkgPT4ge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIGBDYW5ub3QgY2FsbCBtdXRhYmxlIG1ldGhvZCAnJHttdXRhYmxlRnVuY3Rpb25OYW1lfScgb24gaW1tdXRhYmxlIFZlY3RvcjJgICk7XHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG5cclxuSW1tdXRhYmxlVmVjdG9yMi5tdXRhYmxlT3ZlcnJpZGVIZWxwZXIoICdzZXRYWScgKTtcclxuSW1tdXRhYmxlVmVjdG9yMi5tdXRhYmxlT3ZlcnJpZGVIZWxwZXIoICdzZXRYJyApO1xyXG5JbW11dGFibGVWZWN0b3IyLm11dGFibGVPdmVycmlkZUhlbHBlciggJ3NldFknICk7XHJcblxyXG5WZWN0b3IyLlpFUk8gPSBhc3NlcnQgPyBuZXcgSW1tdXRhYmxlVmVjdG9yMiggMCwgMCApIDogbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuVmVjdG9yMi5YX1VOSVQgPSBhc3NlcnQgPyBuZXcgSW1tdXRhYmxlVmVjdG9yMiggMSwgMCApIDogbmV3IFZlY3RvcjIoIDEsIDAgKTtcclxuVmVjdG9yMi5ZX1VOSVQgPSBhc3NlcnQgPyBuZXcgSW1tdXRhYmxlVmVjdG9yMiggMCwgMSApIDogbmV3IFZlY3RvcjIoIDAsIDEgKTtcclxuXHJcbmNvbnN0IFNUQVRFX1NDSEVNQSA9IHtcclxuICB4OiBOdW1iZXJJTyxcclxuICB5OiBOdW1iZXJJT1xyXG59O1xyXG5leHBvcnQgdHlwZSBWZWN0b3IyU3RhdGVPYmplY3QgPSBTdGF0ZU9iamVjdDx0eXBlb2YgU1RBVEVfU0NIRU1BPjtcclxuXHJcblZlY3RvcjIuVmVjdG9yMklPID0gbmV3IElPVHlwZTxWZWN0b3IyLCBWZWN0b3IyU3RhdGVPYmplY3Q+KCAnVmVjdG9yMklPJywge1xyXG4gIHZhbHVlVHlwZTogVmVjdG9yMixcclxuICBzdGF0ZVNjaGVtYTogU1RBVEVfU0NIRU1BLFxyXG4gIHRvU3RhdGVPYmplY3Q6ICggdmVjdG9yMjogVmVjdG9yMiApID0+IHZlY3RvcjIudG9TdGF0ZU9iamVjdCgpLFxyXG4gIGZyb21TdGF0ZU9iamVjdDogKCBzdGF0ZU9iamVjdDogVmVjdG9yMlN0YXRlT2JqZWN0ICkgPT4gVmVjdG9yMi5mcm9tU3RhdGVPYmplY3QoIHN0YXRlT2JqZWN0ICksXHJcbiAgZG9jdW1lbnRhdGlvbjogJ0EgbnVtZXJpY2FsIG9iamVjdCB3aXRoIHggYW5kIHkgcHJvcGVydGllcywgbGlrZSB7eDozLHk6NH0nXHJcbn0gKTtcclxuXHJcbmV4cG9ydCB7IHYyIH07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLElBQUksTUFBcUIsNEJBQTRCO0FBQzVELE9BQU9DLE1BQU0sTUFBTSxpQ0FBaUM7QUFDcEQsT0FBT0MsUUFBUSxNQUFNLG1DQUFtQztBQUN4RCxPQUFPQyxHQUFHLE1BQU0sVUFBVTtBQUMxQixPQUFPQyxLQUFLLE1BQU0sWUFBWTtBQUM5QixPQUFPQyxPQUFPLE1BQU0sY0FBYztBQUdsQyxNQUFNQyxrQkFBa0IsR0FBR0EsQ0FBRUMsTUFBZSxFQUFFQyxVQUFtQixLQUFNO0VBQ3JFLE9BQU9ELE1BQU0sQ0FBQ0UsR0FBRyxDQUFFRCxVQUFXLENBQUM7QUFDakMsQ0FBQztBQUVELGVBQWUsTUFBTUUsT0FBTyxDQUFzQjtFQUVoRDs7RUFHQTs7RUFHQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDU0MsV0FBV0EsQ0FB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