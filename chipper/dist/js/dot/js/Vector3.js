// Copyright 2013-2024, University of Colorado Boulder

/**
 * Basic 3-dimensional vector, represented as (x,y,z).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Pool from '../../phet-core/js/Pool.js';
import IOType from '../../tandem/js/types/IOType.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import dot from './dot.js';
import Utils from './Utils.js';
import { v2 } from './Vector2.js';
import { v4 } from './Vector4.js';
const ADDING_ACCUMULATOR = (vector, nextVector) => {
  return vector.add(nextVector);
};
export default class Vector3 {
  // The X coordinate of the vector.

  // The Y coordinate of the vector.

  // The Z coordinate of the vector.

  /**
   * Creates a 3-dimensional vector with the specified X, Y and Z values.
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param z - Z coordinate
   */
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * The magnitude (Euclidean/L2 Norm) of this vector, i.e. $\sqrt{x^2+y^2+z^2}$.
   */
  getMagnitude() {
    return Math.sqrt(this.magnitudeSquared);
  }
  get magnitude() {
    return this.getMagnitude();
  }

  /**
   * T squared magnitude (square of the Euclidean/L2 Norm) of this vector, i.e. $x^2+y^2+z^2$.
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
    return Math.sqrt(this.distanceSquared(point));
  }

  /**
   * The Euclidean distance between this vector (treated as a point) and another point (x,y,z).
   */
  distanceXYZ(x, y, z) {
    const dx = this.x - x;
    const dy = this.y - y;
    const dz = this.z - z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * The squared Euclidean distance between this vector (treated as a point) and another point.
   */
  distanceSquared(point) {
    const dx = this.x - point.x;
    const dy = this.y - point.y;
    const dz = this.z - point.z;
    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * The squared Euclidean distance between this vector (treated as a point) and another point (x,y,z).
   */
  distanceSquaredXYZ(x, y, z) {
    const dx = this.x - x;
    const dy = this.y - y;
    const dz = this.z - z;
    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * The dot-product (Euclidean inner product) between this vector and another vector v.
   */
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  /**
   * The dot-product (Euclidean inner product) between this vector and another vector (x,y,z).
   */
  dotXYZ(x, y, z) {
    return this.x * x + this.y * y + this.z * z;
  }

  /**
   * The angle between this vector and another vector, in the range $\theta\in[0, \pi]$.
   *
   * Equal to $\theta = \cos^{-1}( \hat{u} \cdot \hat{v} )$ where $\hat{u}$ is this vector (normalized) and $\hat{v}$
   * is the input vector (normalized).
   */
  angleBetween(v) {
    return Math.acos(Utils.clamp(this.normalized().dot(v.normalized()), -1, 1));
  }

  /**
   * Exact equality comparison between this vector and another vector.
   *
   * @returns - Whether the two vectors have equal components
   */
  equals(other) {
    return this.x === other.x && this.y === other.y && this.z === other.z;
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
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y) + Math.abs(this.z - other.z) <= epsilon;
  }

  /**
   * Returns false if any component is NaN, infinity, or -infinity. Otherwise returns true.
   */
  isFinite() {
    return isFinite(this.x) && isFinite(this.y) && isFinite(this.z);
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
   * @param [vector] - If not provided, creates a new Vector3 with filled in values. Otherwise, fills in the
   *                   values of the provided vector so that it equals this vector.
   */
  copy(vector) {
    if (vector) {
      return vector.set(this);
    } else {
      return v3(this.x, this.y, this.z);
    }
  }

  /**
   * The Euclidean 3-dimensional cross-product of this vector by the passed-in vector.
   */
  cross(v) {
    return v3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
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
      return v3(this.x / mag, this.y / mag, this.z / mag);
    }
  }

  /**
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
    return v3(this.x * scalar, this.y * scalar, this.z * scalar);
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
    return v3(this.x * v.x, this.y * v.y, this.z * v.z);
  }

  /**
   * Addition of this vector and another vector, returning a copy.
   *
   * This is the immutable form of the function add(). This will return a new vector, and will not modify
   * this vector.
   */
  plus(v) {
    return v3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  /**
   * Addition of this vector and another vector (x,y,z), returning a copy.
   *
   * This is the immutable form of the function addXYZ(). This will return a new vector, and will not modify
   * this vector.
   */
  plusXYZ(x, y, z) {
    return v3(this.x + x, this.y + y, this.z + z);
  }

  /**
   * Addition of this vector with a scalar (adds the scalar to every component), returning a copy.
   *
   * This is the immutable form of the function addScalar(). This will return a new vector, and will not modify
   * this vector.
   */
  plusScalar(scalar) {
    return v3(this.x + scalar, this.y + scalar, this.z + scalar);
  }

  /**
   * Subtraction of this vector by another vector v, returning a copy.
   *
   * This is the immutable form of the function subtract(). This will return a new vector, and will not modify
   * this vector.
   */
  minus(v) {
    return v3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  /**
   * Subtraction of this vector by another vector (x,y,z), returning a copy.
   *
   * This is the immutable form of the function subtractXYZ(). This will return a new vector, and will not modify
   * this vector.
   */
  minusXYZ(x, y, z) {
    return v3(this.x - x, this.y - y, this.z - z);
  }

  /**
   * Subtraction of this vector by a scalar (subtracts the scalar from every component), returning a copy.
   *
   * This is the immutable form of the function subtractScalar(). This will return a new vector, and will not modify
   * this vector.
   */
  minusScalar(scalar) {
    return v3(this.x - scalar, this.y - scalar, this.z - scalar);
  }

  /**
   * Division of this vector by a scalar (divides every component by the scalar), returning a copy.
   *
   * This is the immutable form of the function divideScalar(). This will return a new vector, and will not modify
   * this vector.
   */
  dividedScalar(scalar) {
    return v3(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  /**
   * Negated copy of this vector (multiplies every component by -1).
   *
   * This is the immutable form of the function negate(). This will return a new vector, and will not modify
   * this vector.
   *
   */
  negated() {
    return v3(-this.x, -this.y, -this.z);
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
   * Take a component-based mean of all vectors provided.
   */
  static average(vectors) {
    const added = _.reduce(vectors, ADDING_ACCUMULATOR, new Vector3(0, 0, 0));
    return added.divideScalar(vectors.length);
  }

  /**
   * Debugging string for the vector.
   */
  toString() {
    return `Vector3(${this.x}, ${this.y}, ${this.z})`;
  }

  /**
   * Converts this to a 2-dimensional vector, discarding the z-component.
   */
  toVector2() {
    return v2(this.x, this.y);
  }

  /**
   * Converts this to a 4-dimensional vector, with the w-component equal to 1 (useful for homogeneous coordinates).
   */
  toVector4() {
    return v4(this.x, this.y, this.z, 1);
  }

  /**
   * Converts this to a 4-dimensional vector, with the w-component equal to 0
   */
  toVector4Zero() {
    return v4(this.x, this.y, this.z, 0);
  }

  /*---------------------------------------------------------------------------*
   * Mutables
   * - all mutation should go through setXYZ / setX / setY / setZ
   *---------------------------------------------------------------------------*/

  /**
   * Sets all of the components of this vector, returning this.
   */
  setXYZ(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
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
   * Sets this vector to be a copy of another vector.
   *
   * This is the mutable form of the function copy(). This will mutate (change) this vector, in addition to returning
   * this vector itself.
   */
  set(v) {
    return this.setXYZ(v.x, v.y, v.z);
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
    return this.setXYZ(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  /**
   * Adds another vector (x,y,z) to this vector, changing this vector.
   *
   * This is the mutable form of the function plusXYZ(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  addXYZ(x, y, z) {
    return this.setXYZ(this.x + x, this.y + y, this.z + z);
  }

  /**
   * Adds a scalar to this vector (added to every component), changing this vector.
   *
   * This is the mutable form of the function plusScalar(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  addScalar(scalar) {
    return this.setXYZ(this.x + scalar, this.y + scalar, this.z + scalar);
  }

  /**
   * Subtracts this vector by another vector, changing this vector.
   *
   * This is the mutable form of the function minus(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  subtract(v) {
    return this.setXYZ(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  /**
   * Subtracts this vector by another vector (x,y,z), changing this vector.
   *
   * This is the mutable form of the function minusXYZ(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  subtractXYZ(x, y, z) {
    return this.setXYZ(this.x - x, this.y - y, this.z - z);
  }

  /**
   * Subtracts this vector by a scalar (subtracts each component by the scalar), changing this vector.
   *
   * This is the mutable form of the function minusScalar(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  subtractScalar(scalar) {
    return this.setXYZ(this.x - scalar, this.y - scalar, this.z - scalar);
  }

  /**
   * Multiplies this vector by a scalar (multiplies each component by the scalar), changing this vector.
   *
   * This is the mutable form of the function timesScalar(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  multiplyScalar(scalar) {
    return this.setXYZ(this.x * scalar, this.y * scalar, this.z * scalar);
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
    return this.setXYZ(this.x * v.x, this.y * v.y, this.z * v.z);
  }

  /**
   * Divides this vector by a scalar (divides each component by the scalar), changing this vector.
   *
   * This is the mutable form of the function dividedScalar(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  divideScalar(scalar) {
    return this.setXYZ(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  /**
   * Negates this vector (multiplies each component by -1), changing this vector.
   *
   * This is the mutable form of the function negated(). This will mutate (change) this vector, in addition to
   * returning this vector itself.
   */
  negate() {
    return this.setXYZ(-this.x, -this.y, -this.z);
  }

  /**
   * Sets our value to the Euclidean 3-dimensional cross-product of this vector by the passed-in vector.
   */
  setCross(v) {
    return this.setXYZ(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
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
    return this.setXYZ(Utils.roundSymmetric(this.x), Utils.roundSymmetric(this.y), Utils.roundSymmetric(this.z));
  }

  /**
   * Returns a duck-typed object meant for use with tandem/phet-io serialization.
   */
  toStateObject() {
    return {
      x: this.x,
      y: this.y,
      z: this.z
    };
  }
  freeToPool() {
    Vector3.pool.freeToPool(this);
  }
  static pool = new Pool(Vector3, {
    maxSize: 1000,
    initialize: Vector3.prototype.setXYZ,
    defaultArguments: [0, 0, 0]
  });

  // static methods

  /**
   * Spherical linear interpolation between two unit vectors.
   *
   * @param start - Start unit vector
   * @param end - End unit vector
   * @param ratio  - Between 0 (at start vector) and 1 (at end vector)
   * @returns Spherical linear interpolation between the start and end
   */
  static slerp(start, end, ratio) {
    // @ts-expect-error TODO: import with circular protection https://github.com/phetsims/dot/issues/96
    return dot.Quaternion.slerp(new dot.Quaternion(), dot.Quaternion.getRotationQuaternion(start, end), ratio).timesVector3(start);
  }

  /**
   * Constructs a Vector3 from a duck-typed object, for use with tandem/phet-io deserialization.
   */
  static fromStateObject(stateObject) {
    return v3(stateObject.x, stateObject.y, stateObject.z);
  }

  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
}

// (read-only) - Helps to identify the dimension of the vector
Vector3.prototype.isVector3 = true;
Vector3.prototype.dimension = 3;
dot.register('Vector3', Vector3);
const v3 = Vector3.pool.create.bind(Vector3.pool);
dot.register('v3', v3);
class ImmutableVector3 extends Vector3 {
  /**
   * Throw errors whenever a mutable method is called on our immutable vector
   */
  static mutableOverrideHelper(mutableFunctionName) {
    ImmutableVector3.prototype[mutableFunctionName] = () => {
      throw new Error(`Cannot call mutable method '${mutableFunctionName}' on immutable Vector3`);
    };
  }
}
ImmutableVector3.mutableOverrideHelper('setXYZ');
ImmutableVector3.mutableOverrideHelper('setX');
ImmutableVector3.mutableOverrideHelper('setY');
ImmutableVector3.mutableOverrideHelper('setZ');
Vector3.ZERO = assert ? new ImmutableVector3(0, 0, 0) : new Vector3(0, 0, 0);
Vector3.X_UNIT = assert ? new ImmutableVector3(1, 0, 0) : new Vector3(1, 0, 0);
Vector3.Y_UNIT = assert ? new ImmutableVector3(0, 1, 0) : new Vector3(0, 1, 0);
Vector3.Z_UNIT = assert ? new ImmutableVector3(0, 0, 1) : new Vector3(0, 0, 1);
Vector3.Vector3IO = new IOType('Vector3IO', {
  valueType: Vector3,
  documentation: 'Basic 3-dimensional vector, represented as (x,y,z)',
  toStateObject: vector3 => vector3.toStateObject(),
  fromStateObject: Vector3.fromStateObject,
  stateSchema: {
    x: NumberIO,
    y: NumberIO,
    z: NumberIO
  }
});
export { v3 };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQb29sIiwiSU9UeXBlIiwiTnVtYmVySU8iLCJkb3QiLCJVdGlscyIsInYyIiwidjQiLCJBRERJTkdfQUNDVU1VTEFUT1IiLCJ2ZWN0b3IiLCJuZXh0VmVjdG9yIiwiYWRkIiwiVmVjdG9yMyIsImNvbnN0cnVjdG9yIiwieCIsInkiLCJ6IiwiZ2V0TWFnbml0dWRlIiwiTWF0aCIsInNxcnQiLCJtYWduaXR1ZGVTcXVhcmVkIiwibWFnbml0dWRlIiwiZ2V0TWFnbml0dWRlU3F1YXJlZCIsImRpc3RhbmNlIiwicG9pbnQiLCJkaXN0YW5jZVNxdWFyZWQiLCJkaXN0YW5jZVhZWiIsImR4IiwiZHkiLCJkeiIsImRpc3RhbmNlU3F1YXJlZFhZWiIsInYiLCJkb3RYWVoiLCJhbmdsZUJldHdlZW4iLCJhY29zIiwiY2xhbXAiLCJub3JtYWxpemVkIiwiZXF1YWxzIiwib3RoZXIiLCJlcXVhbHNFcHNpbG9uIiwiZXBzaWxvbiIsImFicyIsImlzRmluaXRlIiwiY29weSIsInNldCIsInYzIiwiY3Jvc3MiLCJtYWciLCJFcnJvciIsInJvdW5kZWRTeW1tZXRyaWMiLCJyb3VuZFN5bW1ldHJpYyIsIndpdGhNYWduaXR1ZGUiLCJzZXRNYWduaXR1ZGUiLCJ0aW1lc1NjYWxhciIsInNjYWxhciIsInRpbWVzIiwiY29tcG9uZW50VGltZXMiLCJwbHVzIiwicGx1c1hZWiIsInBsdXNTY2FsYXIiLCJtaW51cyIsIm1pbnVzWFlaIiwibWludXNTY2FsYXIiLCJkaXZpZGVkU2NhbGFyIiwibmVnYXRlZCIsImJsZW5kIiwicmF0aW8iLCJhdmVyYWdlIiwidmVjdG9ycyIsImFkZGVkIiwiXyIsInJlZHVjZSIsImRpdmlkZVNjYWxhciIsImxlbmd0aCIsInRvU3RyaW5nIiwidG9WZWN0b3IyIiwidG9WZWN0b3I0IiwidG9WZWN0b3I0WmVybyIsInNldFhZWiIsInNldFgiLCJzZXRZIiwic2V0WiIsInNjYWxlIiwibXVsdGlwbHlTY2FsYXIiLCJhZGRYWVoiLCJhZGRTY2FsYXIiLCJzdWJ0cmFjdCIsInN1YnRyYWN0WFlaIiwic3VidHJhY3RTY2FsYXIiLCJtdWx0aXBseSIsImNvbXBvbmVudE11bHRpcGx5IiwibmVnYXRlIiwic2V0Q3Jvc3MiLCJub3JtYWxpemUiLCJ0b1N0YXRlT2JqZWN0IiwiZnJlZVRvUG9vbCIsInBvb2wiLCJtYXhTaXplIiwiaW5pdGlhbGl6ZSIsInByb3RvdHlwZSIsImRlZmF1bHRBcmd1bWVudHMiLCJzbGVycCIsInN0YXJ0IiwiZW5kIiwiUXVhdGVybmlvbiIsImdldFJvdGF0aW9uUXVhdGVybmlvbiIsInRpbWVzVmVjdG9yMyIsImZyb21TdGF0ZU9iamVjdCIsInN0YXRlT2JqZWN0IiwiaXNWZWN0b3IzIiwiZGltZW5zaW9uIiwicmVnaXN0ZXIiLCJjcmVhdGUiLCJiaW5kIiwiSW1tdXRhYmxlVmVjdG9yMyIsIm11dGFibGVPdmVycmlkZUhlbHBlciIsIm11dGFibGVGdW5jdGlvbk5hbWUiLCJaRVJPIiwiYXNzZXJ0IiwiWF9VTklUIiwiWV9VTklUIiwiWl9VTklUIiwiVmVjdG9yM0lPIiwidmFsdWVUeXBlIiwiZG9jdW1lbnRhdGlvbiIsInZlY3RvcjMiLCJzdGF0ZVNjaGVtYSJdLCJzb3VyY2VzIjpbIlZlY3RvcjMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQmFzaWMgMy1kaW1lbnNpb25hbCB2ZWN0b3IsIHJlcHJlc2VudGVkIGFzICh4LHkseikuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgUG9vbCwgeyBUUG9vbGFibGUgfSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvUG9vbC5qcyc7XHJcbmltcG9ydCBJT1R5cGUgZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0lPVHlwZS5qcyc7XHJcbmltcG9ydCBOdW1iZXJJTyBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvTnVtYmVySU8uanMnO1xyXG5pbXBvcnQgZG90IGZyb20gJy4vZG90LmpzJztcclxuaW1wb3J0IFV0aWxzIGZyb20gJy4vVXRpbHMuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiwgeyB2MiB9IGZyb20gJy4vVmVjdG9yMi5qcyc7XHJcbmltcG9ydCBWZWN0b3I0LCB7IHY0IH0gZnJvbSAnLi9WZWN0b3I0LmpzJztcclxuXHJcbmNvbnN0IEFERElOR19BQ0NVTVVMQVRPUiA9ICggdmVjdG9yOiBWZWN0b3IzLCBuZXh0VmVjdG9yOiBWZWN0b3IzICkgPT4ge1xyXG4gIHJldHVybiB2ZWN0b3IuYWRkKCBuZXh0VmVjdG9yICk7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBWZWN0b3IzU3RhdGVPYmplY3QgPSB7XHJcbiAgeDogbnVtYmVyO1xyXG4gIHk6IG51bWJlcjtcclxuICB6OiBudW1iZXI7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZWN0b3IzIGltcGxlbWVudHMgVFBvb2xhYmxlIHtcclxuXHJcbiAgLy8gVGhlIFggY29vcmRpbmF0ZSBvZiB0aGUgdmVjdG9yLlxyXG4gIHB1YmxpYyB4OiBudW1iZXI7XHJcblxyXG4gIC8vIFRoZSBZIGNvb3JkaW5hdGUgb2YgdGhlIHZlY3Rvci5cclxuICBwdWJsaWMgeTogbnVtYmVyO1xyXG5cclxuICAvLyBUaGUgWiBjb29yZGluYXRlIG9mIHRoZSB2ZWN0b3IuXHJcbiAgcHVibGljIHo6IG51bWJlcjtcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIDMtZGltZW5zaW9uYWwgdmVjdG9yIHdpdGggdGhlIHNwZWNpZmllZCBYLCBZIGFuZCBaIHZhbHVlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB4IC0gWCBjb29yZGluYXRlXHJcbiAgICogQHBhcmFtIHkgLSBZIGNvb3JkaW5hdGVcclxuICAgKiBAcGFyYW0geiAtIFogY29vcmRpbmF0ZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciApIHtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gICAgdGhpcy56ID0gejtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBUaGUgbWFnbml0dWRlIChFdWNsaWRlYW4vTDIgTm9ybSkgb2YgdGhpcyB2ZWN0b3IsIGkuZS4gJFxcc3FydHt4XjIreV4yK3peMn0kLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNYWduaXR1ZGUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBNYXRoLnNxcnQoIHRoaXMubWFnbml0dWRlU3F1YXJlZCApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBtYWduaXR1ZGUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldE1hZ25pdHVkZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVCBzcXVhcmVkIG1hZ25pdHVkZSAoc3F1YXJlIG9mIHRoZSBFdWNsaWRlYW4vTDIgTm9ybSkgb2YgdGhpcyB2ZWN0b3IsIGkuZS4gJHheMit5XjIrel4yJC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TWFnbml0dWRlU3F1YXJlZCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZG90KCB0aGlzIGFzIHVua25vd24gYXMgVmVjdG9yMyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBtYWduaXR1ZGVTcXVhcmVkKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRNYWduaXR1ZGVTcXVhcmVkKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgRXVjbGlkZWFuIGRpc3RhbmNlIGJldHdlZW4gdGhpcyB2ZWN0b3IgKHRyZWF0ZWQgYXMgYSBwb2ludCkgYW5kIGFub3RoZXIgcG9pbnQuXHJcbiAgICovXHJcbiAgcHVibGljIGRpc3RhbmNlKCBwb2ludDogVmVjdG9yMyApOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCggdGhpcy5kaXN0YW5jZVNxdWFyZWQoIHBvaW50ICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBFdWNsaWRlYW4gZGlzdGFuY2UgYmV0d2VlbiB0aGlzIHZlY3RvciAodHJlYXRlZCBhcyBhIHBvaW50KSBhbmQgYW5vdGhlciBwb2ludCAoeCx5LHopLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXN0YW5jZVhZWiggeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgY29uc3QgZHggPSB0aGlzLnggLSB4O1xyXG4gICAgY29uc3QgZHkgPSB0aGlzLnkgLSB5O1xyXG4gICAgY29uc3QgZHogPSB0aGlzLnogLSB6O1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCggZHggKiBkeCArIGR5ICogZHkgKyBkeiAqIGR6ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgc3F1YXJlZCBFdWNsaWRlYW4gZGlzdGFuY2UgYmV0d2VlbiB0aGlzIHZlY3RvciAodHJlYXRlZCBhcyBhIHBvaW50KSBhbmQgYW5vdGhlciBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgZGlzdGFuY2VTcXVhcmVkKCBwb2ludDogVmVjdG9yMyApOiBudW1iZXIge1xyXG4gICAgY29uc3QgZHggPSB0aGlzLnggLSBwb2ludC54O1xyXG4gICAgY29uc3QgZHkgPSB0aGlzLnkgLSBwb2ludC55O1xyXG4gICAgY29uc3QgZHogPSB0aGlzLnogLSBwb2ludC56O1xyXG4gICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkejtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBzcXVhcmVkIEV1Y2xpZGVhbiBkaXN0YW5jZSBiZXR3ZWVuIHRoaXMgdmVjdG9yICh0cmVhdGVkIGFzIGEgcG9pbnQpIGFuZCBhbm90aGVyIHBvaW50ICh4LHkseikuXHJcbiAgICovXHJcbiAgcHVibGljIGRpc3RhbmNlU3F1YXJlZFhZWiggeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgY29uc3QgZHggPSB0aGlzLnggLSB4O1xyXG4gICAgY29uc3QgZHkgPSB0aGlzLnkgLSB5O1xyXG4gICAgY29uc3QgZHogPSB0aGlzLnogLSB6O1xyXG4gICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkejtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBkb3QtcHJvZHVjdCAoRXVjbGlkZWFuIGlubmVyIHByb2R1Y3QpIGJldHdlZW4gdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXIgdmVjdG9yIHYuXHJcbiAgICovXHJcbiAgcHVibGljIGRvdCggdjogVmVjdG9yMyApOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueSArIHRoaXMueiAqIHYuejtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBkb3QtcHJvZHVjdCAoRXVjbGlkZWFuIGlubmVyIHByb2R1Y3QpIGJldHdlZW4gdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXIgdmVjdG9yICh4LHkseikuXHJcbiAgICovXHJcbiAgcHVibGljIGRvdFhZWiggeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMueCAqIHggKyB0aGlzLnkgKiB5ICsgdGhpcy56ICogejtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBhbmdsZSBiZXR3ZWVuIHRoaXMgdmVjdG9yIGFuZCBhbm90aGVyIHZlY3RvciwgaW4gdGhlIHJhbmdlICRcXHRoZXRhXFxpblswLCBcXHBpXSQuXHJcbiAgICpcclxuICAgKiBFcXVhbCB0byAkXFx0aGV0YSA9IFxcY29zXnstMX0oIFxcaGF0e3V9IFxcY2RvdCBcXGhhdHt2fSApJCB3aGVyZSAkXFxoYXR7dX0kIGlzIHRoaXMgdmVjdG9yIChub3JtYWxpemVkKSBhbmQgJFxcaGF0e3Z9JFxyXG4gICAqIGlzIHRoZSBpbnB1dCB2ZWN0b3IgKG5vcm1hbGl6ZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhbmdsZUJldHdlZW4oIHY6IFZlY3RvcjMgKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBNYXRoLmFjb3MoIFV0aWxzLmNsYW1wKCB0aGlzLm5vcm1hbGl6ZWQoKS5kb3QoIHYubm9ybWFsaXplZCgpICksIC0xLCAxICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4YWN0IGVxdWFsaXR5IGNvbXBhcmlzb24gYmV0d2VlbiB0aGlzIHZlY3RvciBhbmQgYW5vdGhlciB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyAtIFdoZXRoZXIgdGhlIHR3byB2ZWN0b3JzIGhhdmUgZXF1YWwgY29tcG9uZW50c1xyXG4gICAqL1xyXG4gIHB1YmxpYyBlcXVhbHMoIG90aGVyOiBWZWN0b3IzICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMueCA9PT0gb3RoZXIueCAmJiB0aGlzLnkgPT09IG90aGVyLnkgJiYgdGhpcy56ID09PSBvdGhlci56O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXBwcm94aW1hdGUgZXF1YWxpdHkgY29tcGFyaXNvbiBiZXR3ZWVuIHRoaXMgdmVjdG9yIGFuZCBhbm90aGVyIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIC0gV2hldGhlciBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHR3byB2ZWN0b3JzIGhhcyBubyBjb21wb25lbnQgd2l0aCBhbiBhYnNvbHV0ZSB2YWx1ZSBncmVhdGVyXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgdGhhbiBlcHNpbG9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBlcXVhbHNFcHNpbG9uKCBvdGhlcjogVmVjdG9yMywgZXBzaWxvbjogbnVtYmVyICk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCAhZXBzaWxvbiApIHtcclxuICAgICAgZXBzaWxvbiA9IDA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gTWF0aC5hYnMoIHRoaXMueCAtIG90aGVyLnggKSArIE1hdGguYWJzKCB0aGlzLnkgLSBvdGhlci55ICkgKyBNYXRoLmFicyggdGhpcy56IC0gb3RoZXIueiApIDw9IGVwc2lsb247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGZhbHNlIGlmIGFueSBjb21wb25lbnQgaXMgTmFOLCBpbmZpbml0eSwgb3IgLWluZmluaXR5LiBPdGhlcndpc2UgcmV0dXJucyB0cnVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0Zpbml0ZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBpc0Zpbml0ZSggdGhpcy54ICkgJiYgaXNGaW5pdGUoIHRoaXMueSApICYmIGlzRmluaXRlKCB0aGlzLnogKTtcclxuICB9XHJcblxyXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxyXG4gICAqIEltbXV0YWJsZXNcclxuICAgKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBjb3B5IG9mIHRoaXMgdmVjdG9yLCBvciBpZiBhIHZlY3RvciBpcyBwYXNzZWQgaW4sIHNldCB0aGF0IHZlY3RvcidzIHZhbHVlcyB0byBvdXJzLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHNldCgpLCBpZiBhIHZlY3RvciBpcyBwcm92aWRlZC4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZFxyXG4gICAqIHdpbGwgbm90IG1vZGlmeSB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBbdmVjdG9yXSAtIElmIG5vdCBwcm92aWRlZCwgY3JlYXRlcyBhIG5ldyBWZWN0b3IzIHdpdGggZmlsbGVkIGluIHZhbHVlcy4gT3RoZXJ3aXNlLCBmaWxscyBpbiB0aGVcclxuICAgKiAgICAgICAgICAgICAgICAgICB2YWx1ZXMgb2YgdGhlIHByb3ZpZGVkIHZlY3RvciBzbyB0aGF0IGl0IGVxdWFscyB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgY29weSggdmVjdG9yPzogVmVjdG9yMyApOiBWZWN0b3IzIHtcclxuICAgIGlmICggdmVjdG9yICkge1xyXG4gICAgICByZXR1cm4gdmVjdG9yLnNldCggdGhpcyBhcyB1bmtub3duIGFzIFZlY3RvcjMgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gdjMoIHRoaXMueCwgdGhpcy55LCB0aGlzLnogKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBFdWNsaWRlYW4gMy1kaW1lbnNpb25hbCBjcm9zcy1wcm9kdWN0IG9mIHRoaXMgdmVjdG9yIGJ5IHRoZSBwYXNzZWQtaW4gdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjcm9zcyggdjogVmVjdG9yMyApOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiB2MyhcclxuICAgICAgdGhpcy55ICogdi56IC0gdGhpcy56ICogdi55LFxyXG4gICAgICB0aGlzLnogKiB2LnggLSB0aGlzLnggKiB2LnosXHJcbiAgICAgIHRoaXMueCAqIHYueSAtIHRoaXMueSAqIHYueFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE5vcm1hbGl6ZWQgKHJlLXNjYWxlZCkgY29weSBvZiB0aGlzIHZlY3RvciBzdWNoIHRoYXQgaXRzIG1hZ25pdHVkZSBpcyAxLiBJZiBpdHMgaW5pdGlhbCBtYWduaXR1ZGUgaXMgemVybywgYW5cclxuICAgKiBlcnJvciBpcyB0aHJvd24uXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gbm9ybWFsaXplKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5IHRoaXNcclxuICAgKiB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIG5vcm1hbGl6ZWQoKTogVmVjdG9yMyB7XHJcbiAgICBjb25zdCBtYWcgPSB0aGlzLm1hZ25pdHVkZTtcclxuICAgIGlmICggbWFnID09PSAwICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoICdDYW5ub3Qgbm9ybWFsaXplIGEgemVyby1tYWduaXR1ZGUgdmVjdG9yJyApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiB2MyggdGhpcy54IC8gbWFnLCB0aGlzLnkgLyBtYWcsIHRoaXMueiAvIG1hZyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gcm91bmRTeW1tZXRyaWMoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgcm91bmRlZFN5bW1ldHJpYygpOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiB0aGlzLmNvcHkoKS5yb3VuZFN5bW1ldHJpYygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmUtc2NhbGVkIGNvcHkgb2YgdGhpcyB2ZWN0b3Igc3VjaCB0aGF0IGl0IGhhcyB0aGUgZGVzaXJlZCBtYWduaXR1ZGUuIElmIGl0cyBpbml0aWFsIG1hZ25pdHVkZSBpcyB6ZXJvLCBhbiBlcnJvclxyXG4gICAqIGlzIHRocm93bi4gSWYgdGhlIHBhc3NlZC1pbiBtYWduaXR1ZGUgaXMgbmVnYXRpdmUsIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHJlc3VsdGluZyB2ZWN0b3Igd2lsbCBiZSByZXZlcnNlZC5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBzZXRNYWduaXR1ZGUoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgd2l0aE1hZ25pdHVkZSggbWFnbml0dWRlOiBudW1iZXIgKTogVmVjdG9yMyB7XHJcbiAgICByZXR1cm4gdGhpcy5jb3B5KCkuc2V0TWFnbml0dWRlKCBtYWduaXR1ZGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvcHkgb2YgdGhpcyB2ZWN0b3IsIHNjYWxlZCBieSB0aGUgZGVzaXJlZCBzY2FsYXIgdmFsdWUuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gbXVsdGlwbHlTY2FsYXIoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgdGltZXNTY2FsYXIoIHNjYWxhcjogbnVtYmVyICk6IFZlY3RvcjMge1xyXG4gICAgcmV0dXJuIHYzKCB0aGlzLnggKiBzY2FsYXIsIHRoaXMueSAqIHNjYWxhciwgdGhpcy56ICogc2NhbGFyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTYW1lIGFzIHRpbWVzU2NhbGFyLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIG11bHRpcGx5KCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIHRpbWVzKCBzY2FsYXI6IG51bWJlciApOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiB0aGlzLnRpbWVzU2NhbGFyKCBzY2FsYXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvcHkgb2YgdGhpcyB2ZWN0b3IsIG11bHRpcGxpZWQgY29tcG9uZW50LXdpc2UgYnkgdGhlIHBhc3NlZC1pbiB2ZWN0b3Igdi5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBjb21wb25lbnRNdWx0aXBseSgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IHZlY3RvciwgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb21wb25lbnRUaW1lcyggdjogVmVjdG9yMyApOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiB2MyggdGhpcy54ICogdi54LCB0aGlzLnkgKiB2LnksIHRoaXMueiAqIHYueiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkaXRpb24gb2YgdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXIgdmVjdG9yLCByZXR1cm5pbmcgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGFkZCgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IHZlY3RvciwgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwbHVzKCB2OiBWZWN0b3IzICk6IFZlY3RvcjMge1xyXG4gICAgcmV0dXJuIHYzKCB0aGlzLnggKyB2LngsIHRoaXMueSArIHYueSwgdGhpcy56ICsgdi56ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRpdGlvbiBvZiB0aGlzIHZlY3RvciBhbmQgYW5vdGhlciB2ZWN0b3IgKHgseSx6KSwgcmV0dXJuaW5nIGEgY29weS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBhZGRYWVooKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyB2ZWN0b3IsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgcGx1c1hZWiggeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciApOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiB2MyggdGhpcy54ICsgeCwgdGhpcy55ICsgeSwgdGhpcy56ICsgeiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkaXRpb24gb2YgdGhpcyB2ZWN0b3Igd2l0aCBhIHNjYWxhciAoYWRkcyB0aGUgc2NhbGFyIHRvIGV2ZXJ5IGNvbXBvbmVudCksIHJldHVybmluZyBhIGNvcHkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gYWRkU2NhbGFyKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIHBsdXNTY2FsYXIoIHNjYWxhcjogbnVtYmVyICk6IFZlY3RvcjMge1xyXG4gICAgcmV0dXJuIHYzKCB0aGlzLnggKyBzY2FsYXIsIHRoaXMueSArIHNjYWxhciwgdGhpcy56ICsgc2NhbGFyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdWJ0cmFjdGlvbiBvZiB0aGlzIHZlY3RvciBieSBhbm90aGVyIHZlY3RvciB2LCByZXR1cm5pbmcgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHN1YnRyYWN0KCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIG1pbnVzKCB2OiBWZWN0b3IzICk6IFZlY3RvcjMge1xyXG4gICAgcmV0dXJuIHYzKCB0aGlzLnggLSB2LngsIHRoaXMueSAtIHYueSwgdGhpcy56IC0gdi56ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdWJ0cmFjdGlvbiBvZiB0aGlzIHZlY3RvciBieSBhbm90aGVyIHZlY3RvciAoeCx5LHopLCByZXR1cm5pbmcgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHN1YnRyYWN0WFlaKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIG1pbnVzWFlaKCB4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyICk6IFZlY3RvcjMge1xyXG4gICAgcmV0dXJuIHYzKCB0aGlzLnggLSB4LCB0aGlzLnkgLSB5LCB0aGlzLnogLSB6ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdWJ0cmFjdGlvbiBvZiB0aGlzIHZlY3RvciBieSBhIHNjYWxhciAoc3VidHJhY3RzIHRoZSBzY2FsYXIgZnJvbSBldmVyeSBjb21wb25lbnQpLCByZXR1cm5pbmcgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHN1YnRyYWN0U2NhbGFyKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIG1pbnVzU2NhbGFyKCBzY2FsYXI6IG51bWJlciApOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiB2MyggdGhpcy54IC0gc2NhbGFyLCB0aGlzLnkgLSBzY2FsYXIsIHRoaXMueiAtIHNjYWxhciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGl2aXNpb24gb2YgdGhpcyB2ZWN0b3IgYnkgYSBzY2FsYXIgKGRpdmlkZXMgZXZlcnkgY29tcG9uZW50IGJ5IHRoZSBzY2FsYXIpLCByZXR1cm5pbmcgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgaW1tdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGRpdmlkZVNjYWxhcigpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IHZlY3RvciwgYW5kIHdpbGwgbm90IG1vZGlmeVxyXG4gICAqIHRoaXMgdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXZpZGVkU2NhbGFyKCBzY2FsYXI6IG51bWJlciApOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiB2MyggdGhpcy54IC8gc2NhbGFyLCB0aGlzLnkgLyBzY2FsYXIsIHRoaXMueiAvIHNjYWxhciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTmVnYXRlZCBjb3B5IG9mIHRoaXMgdmVjdG9yIChtdWx0aXBsaWVzIGV2ZXJ5IGNvbXBvbmVudCBieSAtMSkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gbmVnYXRlKCkuIFRoaXMgd2lsbCByZXR1cm4gYSBuZXcgdmVjdG9yLCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKi9cclxuICBwdWJsaWMgbmVnYXRlZCgpOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiB2MyggLXRoaXMueCwgLXRoaXMueSwgLXRoaXMueiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBsaW5lYXIgaW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHRoaXMgdmVjdG9yIChyYXRpbz0wKSBhbmQgYW5vdGhlciB2ZWN0b3IgKHJhdGlvPTEpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHZlY3RvclxyXG4gICAqIEBwYXJhbSByYXRpbyAtIE5vdCBuZWNlc3NhcmlseSBjb25zdHJhaW5lZCBpbiBbMCwgMV1cclxuICAgKi9cclxuICBwdWJsaWMgYmxlbmQoIHZlY3RvcjogVmVjdG9yMywgcmF0aW86IG51bWJlciApOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiB0aGlzLnBsdXMoIHZlY3Rvci5taW51cyggdGhpcyBhcyB1bmtub3duIGFzIFZlY3RvcjMgKS50aW1lcyggcmF0aW8gKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGF2ZXJhZ2UgKG1pZHBvaW50KSBiZXR3ZWVuIHRoaXMgdmVjdG9yIGFuZCBhbm90aGVyIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgYXZlcmFnZSggdmVjdG9yOiBWZWN0b3IzICk6IFZlY3RvcjMge1xyXG4gICAgcmV0dXJuIHRoaXMuYmxlbmQoIHZlY3RvciwgMC41ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlIGEgY29tcG9uZW50LWJhc2VkIG1lYW4gb2YgYWxsIHZlY3RvcnMgcHJvdmlkZWQuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBhdmVyYWdlKCB2ZWN0b3JzOiBWZWN0b3IzW10gKTogVmVjdG9yMyB7XHJcbiAgICBjb25zdCBhZGRlZCA9IF8ucmVkdWNlKCB2ZWN0b3JzLCBBRERJTkdfQUNDVU1VTEFUT1IsIG5ldyBWZWN0b3IzKCAwLCAwLCAwICkgKTtcclxuICAgIHJldHVybiBhZGRlZC5kaXZpZGVTY2FsYXIoIHZlY3RvcnMubGVuZ3RoICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWJ1Z2dpbmcgc3RyaW5nIGZvciB0aGUgdmVjdG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGBWZWN0b3IzKCR7dGhpcy54fSwgJHt0aGlzLnl9LCAke3RoaXMuen0pYDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlcnRzIHRoaXMgdG8gYSAyLWRpbWVuc2lvbmFsIHZlY3RvciwgZGlzY2FyZGluZyB0aGUgei1jb21wb25lbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHRvVmVjdG9yMigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB2MiggdGhpcy54LCB0aGlzLnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlcnRzIHRoaXMgdG8gYSA0LWRpbWVuc2lvbmFsIHZlY3Rvciwgd2l0aCB0aGUgdy1jb21wb25lbnQgZXF1YWwgdG8gMSAodXNlZnVsIGZvciBob21vZ2VuZW91cyBjb29yZGluYXRlcykuXHJcbiAgICovXHJcbiAgcHVibGljIHRvVmVjdG9yNCgpOiBWZWN0b3I0IHtcclxuICAgIHJldHVybiB2NCggdGhpcy54LCB0aGlzLnksIHRoaXMueiwgMSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udmVydHMgdGhpcyB0byBhIDQtZGltZW5zaW9uYWwgdmVjdG9yLCB3aXRoIHRoZSB3LWNvbXBvbmVudCBlcXVhbCB0byAwXHJcbiAgICovXHJcbiAgcHVibGljIHRvVmVjdG9yNFplcm8oKTogVmVjdG9yNCB7XHJcbiAgICByZXR1cm4gdjQoIHRoaXMueCwgdGhpcy55LCB0aGlzLnosIDAgKTtcclxuICB9XHJcblxyXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxyXG4gICAqIE11dGFibGVzXHJcbiAgICogLSBhbGwgbXV0YXRpb24gc2hvdWxkIGdvIHRocm91Z2ggc2V0WFlaIC8gc2V0WCAvIHNldFkgLyBzZXRaXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuICAvKipcclxuICAgKiBTZXRzIGFsbCBvZiB0aGUgY29tcG9uZW50cyBvZiB0aGlzIHZlY3RvciwgcmV0dXJuaW5nIHRoaXMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFhZWiggeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciApOiBWZWN0b3IzIHtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gICAgdGhpcy56ID0gejtcclxuICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmVjdG9yMztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHgtY29tcG9uZW50IG9mIHRoaXMgdmVjdG9yLCByZXR1cm5pbmcgdGhpcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0WCggeDogbnVtYmVyICk6IFZlY3RvcjMge1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmVjdG9yMztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHktY29tcG9uZW50IG9mIHRoaXMgdmVjdG9yLCByZXR1cm5pbmcgdGhpcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0WSggeTogbnVtYmVyICk6IFZlY3RvcjMge1xyXG4gICAgdGhpcy55ID0geTtcclxuICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmVjdG9yMztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHotY29tcG9uZW50IG9mIHRoaXMgdmVjdG9yLCByZXR1cm5pbmcgdGhpcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0WiggejogbnVtYmVyICk6IFZlY3RvcjMge1xyXG4gICAgdGhpcy56ID0gejtcclxuICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmVjdG9yMztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhpcyB2ZWN0b3IgdG8gYmUgYSBjb3B5IG9mIGFub3RoZXIgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBjb3B5KCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyB2ZWN0b3IsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgdmVjdG9yIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0KCB2OiBWZWN0b3IzICk6IFZlY3RvcjMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0WFlaKCB2LngsIHYueSwgdi56ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBtYWduaXR1ZGUgb2YgdGhpcyB2ZWN0b3IuIElmIHRoZSBwYXNzZWQtaW4gbWFnbml0dWRlIGlzIG5lZ2F0aXZlLCB0aGlzIGZsaXBzIHRoZSB2ZWN0b3IgYW5kIHNldHMgaXRzXHJcbiAgICogbWFnbml0dWRlIHRvIGFicyggbWFnbml0dWRlICkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHdpdGhNYWduaXR1ZGUoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRNYWduaXR1ZGUoIG1hZ25pdHVkZTogbnVtYmVyICk6IFZlY3RvcjMge1xyXG4gICAgY29uc3Qgc2NhbGUgPSBtYWduaXR1ZGUgLyB0aGlzLm1hZ25pdHVkZTtcclxuICAgIHJldHVybiB0aGlzLm11bHRpcGx5U2NhbGFyKCBzY2FsZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbm90aGVyIHZlY3RvciB0byB0aGlzIHZlY3RvciwgY2hhbmdpbmcgdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHBsdXMoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGQoIHY6IFZlY3RvcjMgKTogVmVjdG9yMyB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWVooIHRoaXMueCArIHYueCwgdGhpcy55ICsgdi55LCB0aGlzLnogKyB2LnogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW5vdGhlciB2ZWN0b3IgKHgseSx6KSB0byB0aGlzIHZlY3RvciwgY2hhbmdpbmcgdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHBsdXNYWVooKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRYWVooIHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIgKTogVmVjdG9yMyB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWVooIHRoaXMueCArIHgsIHRoaXMueSArIHksIHRoaXMueiArIHogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBzY2FsYXIgdG8gdGhpcyB2ZWN0b3IgKGFkZGVkIHRvIGV2ZXJ5IGNvbXBvbmVudCksIGNoYW5naW5nIHRoaXMgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBwbHVzU2NhbGFyKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyB2ZWN0b3IsIGluIGFkZGl0aW9uIHRvXHJcbiAgICogcmV0dXJuaW5nIHRoaXMgdmVjdG9yIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgYWRkU2NhbGFyKCBzY2FsYXI6IG51bWJlciApOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiB0aGlzLnNldFhZWiggdGhpcy54ICsgc2NhbGFyLCB0aGlzLnkgKyBzY2FsYXIsIHRoaXMueiArIHNjYWxhciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3VidHJhY3RzIHRoaXMgdmVjdG9yIGJ5IGFub3RoZXIgdmVjdG9yLCBjaGFuZ2luZyB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gbWludXMoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdWJ0cmFjdCggdjogVmVjdG9yMyApOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiB0aGlzLnNldFhZWiggdGhpcy54IC0gdi54LCB0aGlzLnkgLSB2LnksIHRoaXMueiAtIHYueiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3VidHJhY3RzIHRoaXMgdmVjdG9yIGJ5IGFub3RoZXIgdmVjdG9yICh4LHkseiksIGNoYW5naW5nIHRoaXMgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBtaW51c1hZWigpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHN1YnRyYWN0WFlaKCB4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyICk6IFZlY3RvcjMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0WFlaKCB0aGlzLnggLSB4LCB0aGlzLnkgLSB5LCB0aGlzLnogLSB6ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdWJ0cmFjdHMgdGhpcyB2ZWN0b3IgYnkgYSBzY2FsYXIgKHN1YnRyYWN0cyBlYWNoIGNvbXBvbmVudCBieSB0aGUgc2NhbGFyKSwgY2hhbmdpbmcgdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIG1pbnVzU2NhbGFyKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyB2ZWN0b3IsIGluIGFkZGl0aW9uIHRvXHJcbiAgICogcmV0dXJuaW5nIHRoaXMgdmVjdG9yIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgc3VidHJhY3RTY2FsYXIoIHNjYWxhcjogbnVtYmVyICk6IFZlY3RvcjMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0WFlaKCB0aGlzLnggLSBzY2FsYXIsIHRoaXMueSAtIHNjYWxhciwgdGhpcy56IC0gc2NhbGFyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNdWx0aXBsaWVzIHRoaXMgdmVjdG9yIGJ5IGEgc2NhbGFyIChtdWx0aXBsaWVzIGVhY2ggY29tcG9uZW50IGJ5IHRoZSBzY2FsYXIpLCBjaGFuZ2luZyB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gdGltZXNTY2FsYXIoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIHZlY3RvciwgaW4gYWRkaXRpb24gdG9cclxuICAgKiByZXR1cm5pbmcgdGhpcyB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtdWx0aXBseVNjYWxhciggc2NhbGFyOiBudW1iZXIgKTogVmVjdG9yMyB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWVooIHRoaXMueCAqIHNjYWxhciwgdGhpcy55ICogc2NhbGFyLCB0aGlzLnogKiBzY2FsYXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE11bHRpcGxpZXMgdGhpcyB2ZWN0b3IgYnkgYSBzY2FsYXIgKG11bHRpcGxpZXMgZWFjaCBjb21wb25lbnQgYnkgdGhlIHNjYWxhciksIGNoYW5naW5nIHRoaXMgdmVjdG9yLlxyXG4gICAqIFNhbWUgYXMgbXVsdGlwbHlTY2FsYXIuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIHRpbWVzKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyB2ZWN0b3IsIGluIGFkZGl0aW9uIHRvXHJcbiAgICogcmV0dXJuaW5nIHRoaXMgdmVjdG9yIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgbXVsdGlwbHkoIHNjYWxhcjogbnVtYmVyICk6IFZlY3RvcjMge1xyXG4gICAgcmV0dXJuIHRoaXMubXVsdGlwbHlTY2FsYXIoIHNjYWxhciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTXVsdGlwbGllcyB0aGlzIHZlY3RvciBieSBhbm90aGVyIHZlY3RvciBjb21wb25lbnQtd2lzZSwgY2hhbmdpbmcgdGhpcyB2ZWN0b3IuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGNvbXBvbmVudFRpbWVzKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyB2ZWN0b3IsIGluIGFkZGl0aW9uIHRvXHJcbiAgICogcmV0dXJuaW5nIHRoaXMgdmVjdG9yIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgY29tcG9uZW50TXVsdGlwbHkoIHY6IFZlY3RvcjMgKTogVmVjdG9yMyB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWVooIHRoaXMueCAqIHYueCwgdGhpcy55ICogdi55LCB0aGlzLnogKiB2LnogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERpdmlkZXMgdGhpcyB2ZWN0b3IgYnkgYSBzY2FsYXIgKGRpdmlkZXMgZWFjaCBjb21wb25lbnQgYnkgdGhlIHNjYWxhciksIGNoYW5naW5nIHRoaXMgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBkaXZpZGVkU2NhbGFyKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyB2ZWN0b3IsIGluIGFkZGl0aW9uIHRvXHJcbiAgICogcmV0dXJuaW5nIHRoaXMgdmVjdG9yIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgZGl2aWRlU2NhbGFyKCBzY2FsYXI6IG51bWJlciApOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiB0aGlzLnNldFhZWiggdGhpcy54IC8gc2NhbGFyLCB0aGlzLnkgLyBzY2FsYXIsIHRoaXMueiAvIHNjYWxhciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTmVnYXRlcyB0aGlzIHZlY3RvciAobXVsdGlwbGllcyBlYWNoIGNvbXBvbmVudCBieSAtMSksIGNoYW5naW5nIHRoaXMgdmVjdG9yLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBuZWdhdGVkKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyB2ZWN0b3IsIGluIGFkZGl0aW9uIHRvXHJcbiAgICogcmV0dXJuaW5nIHRoaXMgdmVjdG9yIGl0c2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgbmVnYXRlKCk6IFZlY3RvcjMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0WFlaKCAtdGhpcy54LCAtdGhpcy55LCAtdGhpcy56ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIG91ciB2YWx1ZSB0byB0aGUgRXVjbGlkZWFuIDMtZGltZW5zaW9uYWwgY3Jvc3MtcHJvZHVjdCBvZiB0aGlzIHZlY3RvciBieSB0aGUgcGFzc2VkLWluIHZlY3Rvci5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Q3Jvc3MoIHY6IFZlY3RvcjMgKTogVmVjdG9yMyB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRYWVooXHJcbiAgICAgIHRoaXMueSAqIHYueiAtIHRoaXMueiAqIHYueSxcclxuICAgICAgdGhpcy56ICogdi54IC0gdGhpcy54ICogdi56LFxyXG4gICAgICB0aGlzLnggKiB2LnkgLSB0aGlzLnkgKiB2LnhcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBOb3JtYWxpemVzIHRoaXMgdmVjdG9yIChyZXNjYWxlcyB0byB3aGVyZSB0aGUgbWFnbml0dWRlIGlzIDEpLCBjaGFuZ2luZyB0aGlzIHZlY3Rvci5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gbm9ybWFsaXplZCgpLiBUaGlzIHdpbGwgbXV0YXRlIChjaGFuZ2UpIHRoaXMgdmVjdG9yLCBpbiBhZGRpdGlvbiB0b1xyXG4gICAqIHJldHVybmluZyB0aGlzIHZlY3RvciBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIG5vcm1hbGl6ZSgpOiBWZWN0b3IzIHtcclxuICAgIGNvbnN0IG1hZyA9IHRoaXMubWFnbml0dWRlO1xyXG4gICAgaWYgKCBtYWcgPT09IDAgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggJ0Nhbm5vdCBub3JtYWxpemUgYSB6ZXJvLW1hZ25pdHVkZSB2ZWN0b3InICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZGl2aWRlU2NhbGFyKCBtYWcgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJvdW5kcyBlYWNoIGNvbXBvbmVudCBvZiB0aGlzIHZlY3RvciB3aXRoIFV0aWxzLnJvdW5kU3ltbWV0cmljLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiByb3VuZGVkU3ltbWV0cmljKCkuIFRoaXMgd2lsbCBtdXRhdGUgKGNoYW5nZSkgdGhpcyB2ZWN0b3IsIGluIGFkZGl0aW9uXHJcbiAgICogdG8gcmV0dXJuaW5nIHRoZSB2ZWN0b3IgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByb3VuZFN5bW1ldHJpYygpOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiB0aGlzLnNldFhZWiggVXRpbHMucm91bmRTeW1tZXRyaWMoIHRoaXMueCApLCBVdGlscy5yb3VuZFN5bW1ldHJpYyggdGhpcy55ICksIFV0aWxzLnJvdW5kU3ltbWV0cmljKCB0aGlzLnogKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGR1Y2stdHlwZWQgb2JqZWN0IG1lYW50IGZvciB1c2Ugd2l0aCB0YW5kZW0vcGhldC1pbyBzZXJpYWxpemF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b1N0YXRlT2JqZWN0KCk6IFZlY3RvcjNTdGF0ZU9iamVjdCB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB4OiB0aGlzLngsXHJcbiAgICAgIHk6IHRoaXMueSxcclxuICAgICAgejogdGhpcy56XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGZyZWVUb1Bvb2woKTogdm9pZCB7XHJcbiAgICBWZWN0b3IzLnBvb2wuZnJlZVRvUG9vbCggdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBwb29sID0gbmV3IFBvb2woIFZlY3RvcjMsIHtcclxuICAgIG1heFNpemU6IDEwMDAsXHJcbiAgICBpbml0aWFsaXplOiBWZWN0b3IzLnByb3RvdHlwZS5zZXRYWVosXHJcbiAgICBkZWZhdWx0QXJndW1lbnRzOiBbIDAsIDAsIDAgXVxyXG4gIH0gKTtcclxuXHJcbiAgLy8gc3RhdGljIG1ldGhvZHNcclxuXHJcbiAgLyoqXHJcbiAgICogU3BoZXJpY2FsIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdHdvIHVuaXQgdmVjdG9ycy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBzdGFydCAtIFN0YXJ0IHVuaXQgdmVjdG9yXHJcbiAgICogQHBhcmFtIGVuZCAtIEVuZCB1bml0IHZlY3RvclxyXG4gICAqIEBwYXJhbSByYXRpbyAgLSBCZXR3ZWVuIDAgKGF0IHN0YXJ0IHZlY3RvcikgYW5kIDEgKGF0IGVuZCB2ZWN0b3IpXHJcbiAgICogQHJldHVybnMgU3BoZXJpY2FsIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdGhlIHN0YXJ0IGFuZCBlbmRcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHNsZXJwKCBzdGFydDogVmVjdG9yMywgZW5kOiBWZWN0b3IzLCByYXRpbzogbnVtYmVyICk6IFZlY3RvcjMge1xyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPOiBpbXBvcnQgd2l0aCBjaXJjdWxhciBwcm90ZWN0aW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9kb3QvaXNzdWVzLzk2XHJcbiAgICByZXR1cm4gZG90LlF1YXRlcm5pb24uc2xlcnAoIG5ldyBkb3QuUXVhdGVybmlvbigpLCBkb3QuUXVhdGVybmlvbi5nZXRSb3RhdGlvblF1YXRlcm5pb24oIHN0YXJ0LCBlbmQgKSwgcmF0aW8gKS50aW1lc1ZlY3RvcjMoIHN0YXJ0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1Y3RzIGEgVmVjdG9yMyBmcm9tIGEgZHVjay10eXBlZCBvYmplY3QsIGZvciB1c2Ugd2l0aCB0YW5kZW0vcGhldC1pbyBkZXNlcmlhbGl6YXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBmcm9tU3RhdGVPYmplY3QoIHN0YXRlT2JqZWN0OiBWZWN0b3IzU3RhdGVPYmplY3QgKTogVmVjdG9yMyB7XHJcbiAgICByZXR1cm4gdjMoXHJcbiAgICAgIHN0YXRlT2JqZWN0LngsXHJcbiAgICAgIHN0YXRlT2JqZWN0LnksXHJcbiAgICAgIHN0YXRlT2JqZWN0LnpcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaXNWZWN0b3IzITogYm9vbGVhbjtcclxuICBwdWJsaWMgZGltZW5zaW9uITogbnVtYmVyO1xyXG4gIHB1YmxpYyBzdGF0aWMgWkVSTzogVmVjdG9yMzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB1cHBlcmNhc2Utc3RhdGljcy1zaG91bGQtYmUtcmVhZG9ubHlcclxuICBwdWJsaWMgc3RhdGljIFhfVU5JVDogVmVjdG9yMzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB1cHBlcmNhc2Utc3RhdGljcy1zaG91bGQtYmUtcmVhZG9ubHlcclxuICBwdWJsaWMgc3RhdGljIFlfVU5JVDogVmVjdG9yMzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB1cHBlcmNhc2Utc3RhdGljcy1zaG91bGQtYmUtcmVhZG9ubHlcclxuICBwdWJsaWMgc3RhdGljIFpfVU5JVDogVmVjdG9yMzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB1cHBlcmNhc2Utc3RhdGljcy1zaG91bGQtYmUtcmVhZG9ubHlcclxuICBwdWJsaWMgc3RhdGljIFZlY3RvcjNJTzogSU9UeXBlO1xyXG59XHJcblxyXG4vLyAocmVhZC1vbmx5KSAtIEhlbHBzIHRvIGlkZW50aWZ5IHRoZSBkaW1lbnNpb24gb2YgdGhlIHZlY3RvclxyXG5WZWN0b3IzLnByb3RvdHlwZS5pc1ZlY3RvcjMgPSB0cnVlO1xyXG5WZWN0b3IzLnByb3RvdHlwZS5kaW1lbnNpb24gPSAzO1xyXG5cclxuZG90LnJlZ2lzdGVyKCAnVmVjdG9yMycsIFZlY3RvcjMgKTtcclxuXHJcbmNvbnN0IHYzID0gVmVjdG9yMy5wb29sLmNyZWF0ZS5iaW5kKCBWZWN0b3IzLnBvb2wgKTtcclxuZG90LnJlZ2lzdGVyKCAndjMnLCB2MyApO1xyXG5cclxuY2xhc3MgSW1tdXRhYmxlVmVjdG9yMyBleHRlbmRzIFZlY3RvcjMge1xyXG4gIC8qKlxyXG4gICAqIFRocm93IGVycm9ycyB3aGVuZXZlciBhIG11dGFibGUgbWV0aG9kIGlzIGNhbGxlZCBvbiBvdXIgaW1tdXRhYmxlIHZlY3RvclxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgbXV0YWJsZU92ZXJyaWRlSGVscGVyKCBtdXRhYmxlRnVuY3Rpb25OYW1lOiAnc2V0WCcgfCAnc2V0WScgfCAnc2V0WicgfCAnc2V0WFlaJyApOiB2b2lkIHtcclxuICAgIEltbXV0YWJsZVZlY3RvcjMucHJvdG90eXBlWyBtdXRhYmxlRnVuY3Rpb25OYW1lIF0gPSAoKSA9PiB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggYENhbm5vdCBjYWxsIG11dGFibGUgbWV0aG9kICcke211dGFibGVGdW5jdGlvbk5hbWV9JyBvbiBpbW11dGFibGUgVmVjdG9yM2AgKTtcclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG5JbW11dGFibGVWZWN0b3IzLm11dGFibGVPdmVycmlkZUhlbHBlciggJ3NldFhZWicgKTtcclxuSW1tdXRhYmxlVmVjdG9yMy5tdXRhYmxlT3ZlcnJpZGVIZWxwZXIoICdzZXRYJyApO1xyXG5JbW11dGFibGVWZWN0b3IzLm11dGFibGVPdmVycmlkZUhlbHBlciggJ3NldFknICk7XHJcbkltbXV0YWJsZVZlY3RvcjMubXV0YWJsZU92ZXJyaWRlSGVscGVyKCAnc2V0WicgKTtcclxuXHJcblZlY3RvcjMuWkVSTyA9IGFzc2VydCA/IG5ldyBJbW11dGFibGVWZWN0b3IzKCAwLCAwLCAwICkgOiBuZXcgVmVjdG9yMyggMCwgMCwgMCApO1xyXG5WZWN0b3IzLlhfVU5JVCA9IGFzc2VydCA/IG5ldyBJbW11dGFibGVWZWN0b3IzKCAxLCAwLCAwICkgOiBuZXcgVmVjdG9yMyggMSwgMCwgMCApO1xyXG5WZWN0b3IzLllfVU5JVCA9IGFzc2VydCA/IG5ldyBJbW11dGFibGVWZWN0b3IzKCAwLCAxLCAwICkgOiBuZXcgVmVjdG9yMyggMCwgMSwgMCApO1xyXG5WZWN0b3IzLlpfVU5JVCA9IGFzc2VydCA/IG5ldyBJbW11dGFibGVWZWN0b3IzKCAwLCAwLCAxICkgOiBuZXcgVmVjdG9yMyggMCwgMCwgMSApO1xyXG5cclxuVmVjdG9yMy5WZWN0b3IzSU8gPSBuZXcgSU9UeXBlKCAnVmVjdG9yM0lPJywge1xyXG4gIHZhbHVlVHlwZTogVmVjdG9yMyxcclxuICBkb2N1bWVudGF0aW9uOiAnQmFzaWMgMy1kaW1lbnNpb25hbCB2ZWN0b3IsIHJlcHJlc2VudGVkIGFzICh4LHkseiknLFxyXG4gIHRvU3RhdGVPYmplY3Q6ICggdmVjdG9yMzogVmVjdG9yMyApID0+IHZlY3RvcjMudG9TdGF0ZU9iamVjdCgpLFxyXG4gIGZyb21TdGF0ZU9iamVjdDogVmVjdG9yMy5mcm9tU3RhdGVPYmplY3QsXHJcbiAgc3RhdGVTY2hlbWE6IHtcclxuICAgIHg6IE51bWJlcklPLFxyXG4gICAgeTogTnVt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