// Copyright 2013-2023, University of Colorado Boulder

/**
 * 4-dimensional Matrix
 *
 * TODO: consider adding affine flag if it will help performance (a la Matrix3) https://github.com/phetsims/dot/issues/96
 * TODO: get rotation angles
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

/* eslint-disable bad-sim-text */

import Enumeration from '../../phet-core/js/Enumeration.js';
import EnumerationValue from '../../phet-core/js/EnumerationValue.js';
import dot from './dot.js';
import Vector3 from './Vector3.js';
import Vector4 from './Vector4.js';
const Float32Array = window.Float32Array || Array;
class Matrix4 {
  /**
   * @param {number} [v00]
   * @param {number} [v01]
   * @param {number} [v02]
   * @param {number} [v03]
   * @param {number} [v10]
   * @param {number} [v11]
   * @param {number} [v12]
   * @param {number} [v13]
   * @param {number} [v20]
   * @param {number} [v21]
   * @param {number} [v22]
   * @param {number} [v23]
   * @param {number} [v30]
   * @param {number} [v31]
   * @param {number} [v32]
   * @param {number} [v33]
   * @param {Matrix4.Types|undefined} [type]
   */
  constructor(v00, v01, v02, v03, v10, v11, v12, v13, v20, v21, v22, v23, v30, v31, v32, v33, type) {
    // @public {Float32Array} - entries stored in column-major format
    this.entries = new Float32Array(16);

    // @public {Matrix4.Types}
    this.type = Types.OTHER; // will be set by rowMajor

    this.rowMajor(v00 !== undefined ? v00 : 1, v01 !== undefined ? v01 : 0, v02 !== undefined ? v02 : 0, v03 !== undefined ? v03 : 0, v10 !== undefined ? v10 : 0, v11 !== undefined ? v11 : 1, v12 !== undefined ? v12 : 0, v13 !== undefined ? v13 : 0, v20 !== undefined ? v20 : 0, v21 !== undefined ? v21 : 0, v22 !== undefined ? v22 : 1, v23 !== undefined ? v23 : 0, v30 !== undefined ? v30 : 0, v31 !== undefined ? v31 : 0, v32 !== undefined ? v32 : 0, v33 !== undefined ? v33 : 1, type);
  }

  /**
   * Sets all entries of the matrix in row-major order.
   * @public
   *
   * @param {number} v00
   * @param {number} v01
   * @param {number} v02
   * @param {number} v03
   * @param {number} v10
   * @param {number} v11
   * @param {number} v12
   * @param {number} v13
   * @param {number} v20
   * @param {number} v21
   * @param {number} v22
   * @param {number} v23
   * @param {number} v30
   * @param {number} v31
   * @param {number} v32
   * @param {number} v33
   * @param {Matrix4.Types|undefined} [type]
   * @returns {Matrix4} - Self reference
   */
  rowMajor(v00, v01, v02, v03, v10, v11, v12, v13, v20, v21, v22, v23, v30, v31, v32, v33, type) {
    this.entries[0] = v00;
    this.entries[1] = v10;
    this.entries[2] = v20;
    this.entries[3] = v30;
    this.entries[4] = v01;
    this.entries[5] = v11;
    this.entries[6] = v21;
    this.entries[7] = v31;
    this.entries[8] = v02;
    this.entries[9] = v12;
    this.entries[10] = v22;
    this.entries[11] = v32;
    this.entries[12] = v03;
    this.entries[13] = v13;
    this.entries[14] = v23;
    this.entries[15] = v33;

    // TODO: consider performance of the affine check here https://github.com/phetsims/dot/issues/96
    this.type = type === undefined ? v30 === 0 && v31 === 0 && v32 === 0 && v33 === 1 ? Types.AFFINE : Types.OTHER : type;
    return this;
  }

  /**
   * Sets all entries of the matrix in column-major order.
   * @public
   *
   * @param {*} v00
   * @param {*} v10
   * @param {*} v20
   * @param {*} v30
   * @param {*} v01
   * @param {*} v11
   * @param {*} v21
   * @param {*} v31
   * @param {*} v02
   * @param {*} v12
   * @param {*} v22
   * @param {*} v32
   * @param {*} v03
   * @param {*} v13
   * @param {*} v23
   * @param {*} v33
   * @param {Matrix4.Types|undefined} [type]
   * @returns {Matrix4} - Self reference
   */
  columnMajor(v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33, type) {
    return this.rowMajor(v00, v01, v02, v03, v10, v11, v12, v13, v20, v21, v22, v23, v30, v31, v32, v33, type);
  }

  /**
   * Sets this matrix to the value of the passed-in matrix.
   * @public
   *
   * @param {Matrix4} matrix
   * @returns {Matrix4} - Self reference
   */
  set(matrix) {
    return this.rowMajor(matrix.m00(), matrix.m01(), matrix.m02(), matrix.m03(), matrix.m10(), matrix.m11(), matrix.m12(), matrix.m13(), matrix.m20(), matrix.m21(), matrix.m22(), matrix.m23(), matrix.m30(), matrix.m31(), matrix.m32(), matrix.m33(), matrix.type);
  }

  /**
   * Returns the 0,0 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m00() {
    return this.entries[0];
  }

  /**
   * Returns the 0,1 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m01() {
    return this.entries[4];
  }

  /**
   * Returns the 0,2 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m02() {
    return this.entries[8];
  }

  /**
   * Returns the 0,3 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m03() {
    return this.entries[12];
  }

  /**
   * Returns the 1,0 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m10() {
    return this.entries[1];
  }

  /**
   * Returns the 1,1 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m11() {
    return this.entries[5];
  }

  /**
   * Returns the 1,2 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m12() {
    return this.entries[9];
  }

  /**
   * Returns the 1,3 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m13() {
    return this.entries[13];
  }

  /**
   * Returns the 2,0 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m20() {
    return this.entries[2];
  }

  /**
   * Returns the 2,1 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m21() {
    return this.entries[6];
  }

  /**
   * Returns the 2,2 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m22() {
    return this.entries[10];
  }

  /**
   * Returns the 2,3 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m23() {
    return this.entries[14];
  }

  /**
   * Returns the 3,0 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m30() {
    return this.entries[3];
  }

  /**
   * Returns the 3,1 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m31() {
    return this.entries[7];
  }

  /**
   * Returns the 3,2 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m32() {
    return this.entries[11];
  }

  /**
   * Returns the 3,3 entry of this matrix.
   * @public
   *
   * @returns {number}
   */
  m33() {
    return this.entries[15];
  }

  /**
   * Returns whether all of this matrix's entries are finite (non-infinite and non-NaN).
   * @public
   *
   * @returns {boolean}
   */
  isFinite() {
    return isFinite(this.m00()) && isFinite(this.m01()) && isFinite(this.m02()) && isFinite(this.m03()) && isFinite(this.m10()) && isFinite(this.m11()) && isFinite(this.m12()) && isFinite(this.m13()) && isFinite(this.m20()) && isFinite(this.m21()) && isFinite(this.m22()) && isFinite(this.m23()) && isFinite(this.m30()) && isFinite(this.m31()) && isFinite(this.m32()) && isFinite(this.m33());
  }

  /**
   * Returns the 3D translation, assuming multiplication with a homogeneous vector.
   * @public
   *
   * @returns {Vector3}
   */
  getTranslation() {
    return new Vector3(this.m03(), this.m13(), this.m23());
  }
  get translation() {
    return this.getTranslation();
  }

  /**
   * Returns a vector that is equivalent to ( T(1,0,0).magnitude, T(0,1,0).magnitude, T(0,0,1).magnitude )
   * where T is a relative transform.
   * @public
   *
   * @returns {Vector3}
   */
  getScaleVector() {
    const m0003 = this.m00() + this.m03();
    const m1013 = this.m10() + this.m13();
    const m2023 = this.m20() + this.m23();
    const m3033 = this.m30() + this.m33();
    const m0103 = this.m01() + this.m03();
    const m1113 = this.m11() + this.m13();
    const m2123 = this.m21() + this.m23();
    const m3133 = this.m31() + this.m33();
    const m0203 = this.m02() + this.m03();
    const m1213 = this.m12() + this.m13();
    const m2223 = this.m22() + this.m23();
    const m3233 = this.m32() + this.m33();
    return new Vector3(Math.sqrt(m0003 * m0003 + m1013 * m1013 + m2023 * m2023 + m3033 * m3033), Math.sqrt(m0103 * m0103 + m1113 * m1113 + m2123 * m2123 + m3133 * m3133), Math.sqrt(m0203 * m0203 + m1213 * m1213 + m2223 * m2223 + m3233 * m3233));
  }
  get scaleVector() {
    return this.getScaleVector();
  }

  /**
   * Returns the CSS transform string for the associated homogeneous 3d transformation.
   * @public
   *
   * @returns {string}
   */
  getCSSTransform() {
    // See http://www.w3.org/TR/css3-transforms/, particularly Section 13 that discusses the SVG compatibility

    // the inner part of a CSS3 transform, but remember to add the browser-specific parts!
    // NOTE: the toFixed calls are inlined for performance reasons
    return `matrix3d(${this.entries[0].toFixed(20)},${this.entries[1].toFixed(20)},${this.entries[2].toFixed(20)},${this.entries[3].toFixed(20)},${this.entries[4].toFixed(20)},${this.entries[5].toFixed(20)},${this.entries[6].toFixed(20)},${this.entries[7].toFixed(20)},${this.entries[8].toFixed(20)},${this.entries[9].toFixed(20)},${this.entries[10].toFixed(20)},${this.entries[11].toFixed(20)},${this.entries[12].toFixed(20)},${this.entries[13].toFixed(20)},${this.entries[14].toFixed(20)},${this.entries[15].toFixed(20)})`;
  }
  get cssTransform() {
    return this.getCSSTransform();
  }

  /**
   * Returns exact equality with another matrix
   * @public
   *
   * @param {Matrix4} matrix
   * @returns {boolean}
   */
  equals(matrix) {
    return this.m00() === matrix.m00() && this.m01() === matrix.m01() && this.m02() === matrix.m02() && this.m03() === matrix.m03() && this.m10() === matrix.m10() && this.m11() === matrix.m11() && this.m12() === matrix.m12() && this.m13() === matrix.m13() && this.m20() === matrix.m20() && this.m21() === matrix.m21() && this.m22() === matrix.m22() && this.m23() === matrix.m23() && this.m30() === matrix.m30() && this.m31() === matrix.m31() && this.m32() === matrix.m32() && this.m33() === matrix.m33();
  }

  /**
   * Returns equality within a margin of error with another matrix
   * @public
   *
   * @param {Matrix4} matrix
   * @param {number} epsilon
   * @returns {boolean}
   */
  equalsEpsilon(matrix, epsilon) {
    return Math.abs(this.m00() - matrix.m00()) < epsilon && Math.abs(this.m01() - matrix.m01()) < epsilon && Math.abs(this.m02() - matrix.m02()) < epsilon && Math.abs(this.m03() - matrix.m03()) < epsilon && Math.abs(this.m10() - matrix.m10()) < epsilon && Math.abs(this.m11() - matrix.m11()) < epsilon && Math.abs(this.m12() - matrix.m12()) < epsilon && Math.abs(this.m13() - matrix.m13()) < epsilon && Math.abs(this.m20() - matrix.m20()) < epsilon && Math.abs(this.m21() - matrix.m21()) < epsilon && Math.abs(this.m22() - matrix.m22()) < epsilon && Math.abs(this.m23() - matrix.m23()) < epsilon && Math.abs(this.m30() - matrix.m30()) < epsilon && Math.abs(this.m31() - matrix.m31()) < epsilon && Math.abs(this.m32() - matrix.m32()) < epsilon && Math.abs(this.m33() - matrix.m33()) < epsilon;
  }

  /*---------------------------------------------------------------------------*
   * Immutable operations (returning a new matrix)
   *----------------------------------------------------------------------------*/

  /**
   * Returns a copy of this matrix
   * @public
   *
   * @returns {Matrix4}
   */
  copy() {
    return new Matrix4(this.m00(), this.m01(), this.m02(), this.m03(), this.m10(), this.m11(), this.m12(), this.m13(), this.m20(), this.m21(), this.m22(), this.m23(), this.m30(), this.m31(), this.m32(), this.m33(), this.type);
  }

  /**
   * Returns a new matrix, defined by this matrix plus the provided matrix
   * @public
   *
   * @param {Matrix4} matrix
   * @returns {Matrix4}
   */
  plus(matrix) {
    return new Matrix4(this.m00() + matrix.m00(), this.m01() + matrix.m01(), this.m02() + matrix.m02(), this.m03() + matrix.m03(), this.m10() + matrix.m10(), this.m11() + matrix.m11(), this.m12() + matrix.m12(), this.m13() + matrix.m13(), this.m20() + matrix.m20(), this.m21() + matrix.m21(), this.m22() + matrix.m22(), this.m23() + matrix.m23(), this.m30() + matrix.m30(), this.m31() + matrix.m31(), this.m32() + matrix.m32(), this.m33() + matrix.m33());
  }

  /**
   * Returns a new matrix, defined by this matrix plus the provided matrix
   * @public
   *
   * @param {Matrix4} matrix
   * @returns {Matrix4}
   */
  minus(matrix) {
    return new Matrix4(this.m00() - matrix.m00(), this.m01() - matrix.m01(), this.m02() - matrix.m02(), this.m03() - matrix.m03(), this.m10() - matrix.m10(), this.m11() - matrix.m11(), this.m12() - matrix.m12(), this.m13() - matrix.m13(), this.m20() - matrix.m20(), this.m21() - matrix.m21(), this.m22() - matrix.m22(), this.m23() - matrix.m23(), this.m30() - matrix.m30(), this.m31() - matrix.m31(), this.m32() - matrix.m32(), this.m33() - matrix.m33());
  }

  /**
   * Returns a transposed copy of this matrix
   * @public
   *
   * @returns {Matrix4}
   */
  transposed() {
    return new Matrix4(this.m00(), this.m10(), this.m20(), this.m30(), this.m01(), this.m11(), this.m21(), this.m31(), this.m02(), this.m12(), this.m22(), this.m32(), this.m03(), this.m13(), this.m23(), this.m33());
  }

  /**
   * Returns a negated copy of this matrix
   * @public
   *
   * @returns {Matrix3}
   */
  negated() {
    return new Matrix4(-this.m00(), -this.m01(), -this.m02(), -this.m03(), -this.m10(), -this.m11(), -this.m12(), -this.m13(), -this.m20(), -this.m21(), -this.m22(), -this.m23(), -this.m30(), -this.m31(), -this.m32(), -this.m33());
  }

  /**
   * Returns an inverted copy of this matrix
   * @public
   *
   * @returns {Matrix3}
   */
  inverted() {
    let det;
    switch (this.type) {
      case Types.IDENTITY:
        return this;
      case Types.TRANSLATION_3D:
        return new Matrix4(1, 0, 0, -this.m03(), 0, 1, 0, -this.m13(), 0, 0, 1, -this.m23(), 0, 0, 0, 1, Types.TRANSLATION_3D);
      case Types.SCALING:
        return new Matrix4(1 / this.m00(), 0, 0, 0, 0, 1 / this.m11(), 0, 0, 0, 0, 1 / this.m22(), 0, 0, 0, 0, 1 / this.m33(), Types.SCALING);
      case Types.AFFINE:
      case Types.OTHER:
        det = this.getDeterminant();
        if (det !== 0) {
          return new Matrix4((-this.m31() * this.m22() * this.m13() + this.m21() * this.m32() * this.m13() + this.m31() * this.m12() * this.m23() - this.m11() * this.m32() * this.m23() - this.m21() * this.m12() * this.m33() + this.m11() * this.m22() * this.m33()) / det, (this.m31() * this.m22() * this.m03() - this.m21() * this.m32() * this.m03() - this.m31() * this.m02() * this.m23() + this.m01() * this.m32() * this.m23() + this.m21() * this.m02() * this.m33() - this.m01() * this.m22() * this.m33()) / det, (-this.m31() * this.m12() * this.m03() + this.m11() * this.m32() * this.m03() + this.m31() * this.m02() * this.m13() - this.m01() * this.m32() * this.m13() - this.m11() * this.m02() * this.m33() + this.m01() * this.m12() * this.m33()) / det, (this.m21() * this.m12() * this.m03() - this.m11() * this.m22() * this.m03() - this.m21() * this.m02() * this.m13() + this.m01() * this.m22() * this.m13() + this.m11() * this.m02() * this.m23() - this.m01() * this.m12() * this.m23()) / det, (this.m30() * this.m22() * this.m13() - this.m20() * this.m32() * this.m13() - this.m30() * this.m12() * this.m23() + this.m10() * this.m32() * this.m23() + this.m20() * this.m12() * this.m33() - this.m10() * this.m22() * this.m33()) / det, (-this.m30() * this.m22() * this.m03() + this.m20() * this.m32() * this.m03() + this.m30() * this.m02() * this.m23() - this.m00() * this.m32() * this.m23() - this.m20() * this.m02() * this.m33() + this.m00() * this.m22() * this.m33()) / det, (this.m30() * this.m12() * this.m03() - this.m10() * this.m32() * this.m03() - this.m30() * this.m02() * this.m13() + this.m00() * this.m32() * this.m13() + this.m10() * this.m02() * this.m33() - this.m00() * this.m12() * this.m33()) / det, (-this.m20() * this.m12() * this.m03() + this.m10() * this.m22() * this.m03() + this.m20() * this.m02() * this.m13() - this.m00() * this.m22() * this.m13() - this.m10() * this.m02() * this.m23() + this.m00() * this.m12() * this.m23()) / det, (-this.m30() * this.m21() * this.m13() + this.m20() * this.m31() * this.m13() + this.m30() * this.m11() * this.m23() - this.m10() * this.m31() * this.m23() - this.m20() * this.m11() * this.m33() + this.m10() * this.m21() * this.m33()) / det, (this.m30() * this.m21() * this.m03() - this.m20() * this.m31() * this.m03() - this.m30() * this.m01() * this.m23() + this.m00() * this.m31() * this.m23() + this.m20() * this.m01() * this.m33() - this.m00() * this.m21() * this.m33()) / det, (-this.m30() * this.m11() * this.m03() + this.m10() * this.m31() * this.m03() + this.m30() * this.m01() * this.m13() - this.m00() * this.m31() * this.m13() - this.m10() * this.m01() * this.m33() + this.m00() * this.m11() * this.m33()) / det, (this.m20() * this.m11() * this.m03() - this.m10() * this.m21() * this.m03() - this.m20() * this.m01() * this.m13() + this.m00() * this.m21() * this.m13() + this.m10() * this.m01() * this.m23() - this.m00() * this.m11() * this.m23()) / det, (this.m30() * this.m21() * this.m12() - this.m20() * this.m31() * this.m12() - this.m30() * this.m11() * this.m22() + this.m10() * this.m31() * this.m22() + this.m20() * this.m11() * this.m32() - this.m10() * this.m21() * this.m32()) / det, (-this.m30() * this.m21() * this.m02() + this.m20() * this.m31() * this.m02() + this.m30() * this.m01() * this.m22() - this.m00() * this.m31() * this.m22() - this.m20() * this.m01() * this.m32() + this.m00() * this.m21() * this.m32()) / det, (this.m30() * this.m11() * this.m02() - this.m10() * this.m31() * this.m02() - this.m30() * this.m01() * this.m12() + this.m00() * this.m31() * this.m12() + this.m10() * this.m01() * this.m32() - this.m00() * this.m11() * this.m32()) / det, (-this.m20() * this.m11() * this.m02() + this.m10() * this.m21() * this.m02() + this.m20() * this.m01() * this.m12() - this.m00() * this.m21() * this.m12() - this.m10() * this.m01() * this.m22() + this.m00() * this.m11() * this.m22()) / det);
        } else {
          throw new Error('Matrix could not be inverted, determinant === 0');
        }
      default:
        throw new Error(`Matrix4.inverted with unknown type: ${this.type}`);
    }
  }

  /**
   * Returns a matrix, defined by the multiplication of this * matrix.
   * @public
   *
   * @param {Matrix4} matrix
   * @returns {Matrix4} - NOTE: this may be the same matrix!
   */
  timesMatrix(matrix) {
    // I * M === M * I === I (the identity)
    if (this.type === Types.IDENTITY || matrix.type === Types.IDENTITY) {
      return this.type === Types.IDENTITY ? matrix : this;
    }
    if (this.type === matrix.type) {
      // currently two matrices of the same type will result in the same result type
      if (this.type === Types.TRANSLATION_3D) {
        // faster combination of translations
        return new Matrix4(1, 0, 0, this.m03() + matrix.m02(), 0, 1, 0, this.m13() + matrix.m12(), 0, 0, 1, this.m23() + matrix.m23(), 0, 0, 0, 1, Types.TRANSLATION_3D);
      } else if (this.type === Types.SCALING) {
        // faster combination of scaling
        return new Matrix4(this.m00() * matrix.m00(), 0, 0, 0, 0, this.m11() * matrix.m11(), 0, 0, 0, 0, this.m22() * matrix.m22(), 0, 0, 0, 0, 1, Types.SCALING);
      }
    }
    if (this.type !== Types.OTHER && matrix.type !== Types.OTHER) {
      // currently two matrices that are anything but "other" are technically affine, and the result will be affine

      // affine case
      return new Matrix4(this.m00() * matrix.m00() + this.m01() * matrix.m10() + this.m02() * matrix.m20(), this.m00() * matrix.m01() + this.m01() * matrix.m11() + this.m02() * matrix.m21(), this.m00() * matrix.m02() + this.m01() * matrix.m12() + this.m02() * matrix.m22(), this.m00() * matrix.m03() + this.m01() * matrix.m13() + this.m02() * matrix.m23() + this.m03(), this.m10() * matrix.m00() + this.m11() * matrix.m10() + this.m12() * matrix.m20(), this.m10() * matrix.m01() + this.m11() * matrix.m11() + this.m12() * matrix.m21(), this.m10() * matrix.m02() + this.m11() * matrix.m12() + this.m12() * matrix.m22(), this.m10() * matrix.m03() + this.m11() * matrix.m13() + this.m12() * matrix.m23() + this.m13(), this.m20() * matrix.m00() + this.m21() * matrix.m10() + this.m22() * matrix.m20(), this.m20() * matrix.m01() + this.m21() * matrix.m11() + this.m22() * matrix.m21(), this.m20() * matrix.m02() + this.m21() * matrix.m12() + this.m22() * matrix.m22(), this.m20() * matrix.m03() + this.m21() * matrix.m13() + this.m22() * matrix.m23() + this.m23(), 0, 0, 0, 1, Types.AFFINE);
    }

    // general case
    return new Matrix4(this.m00() * matrix.m00() + this.m01() * matrix.m10() + this.m02() * matrix.m20() + this.m03() * matrix.m30(), this.m00() * matrix.m01() + this.m01() * matrix.m11() + this.m02() * matrix.m21() + this.m03() * matrix.m31(), this.m00() * matrix.m02() + this.m01() * matrix.m12() + this.m02() * matrix.m22() + this.m03() * matrix.m32(), this.m00() * matrix.m03() + this.m01() * matrix.m13() + this.m02() * matrix.m23() + this.m03() * matrix.m33(), this.m10() * matrix.m00() + this.m11() * matrix.m10() + this.m12() * matrix.m20() + this.m13() * matrix.m30(), this.m10() * matrix.m01() + this.m11() * matrix.m11() + this.m12() * matrix.m21() + this.m13() * matrix.m31(), this.m10() * matrix.m02() + this.m11() * matrix.m12() + this.m12() * matrix.m22() + this.m13() * matrix.m32(), this.m10() * matrix.m03() + this.m11() * matrix.m13() + this.m12() * matrix.m23() + this.m13() * matrix.m33(), this.m20() * matrix.m00() + this.m21() * matrix.m10() + this.m22() * matrix.m20() + this.m23() * matrix.m30(), this.m20() * matrix.m01() + this.m21() * matrix.m11() + this.m22() * matrix.m21() + this.m23() * matrix.m31(), this.m20() * matrix.m02() + this.m21() * matrix.m12() + this.m22() * matrix.m22() + this.m23() * matrix.m32(), this.m20() * matrix.m03() + this.m21() * matrix.m13() + this.m22() * matrix.m23() + this.m23() * matrix.m33(), this.m30() * matrix.m00() + this.m31() * matrix.m10() + this.m32() * matrix.m20() + this.m33() * matrix.m30(), this.m30() * matrix.m01() + this.m31() * matrix.m11() + this.m32() * matrix.m21() + this.m33() * matrix.m31(), this.m30() * matrix.m02() + this.m31() * matrix.m12() + this.m32() * matrix.m22() + this.m33() * matrix.m32(), this.m30() * matrix.m03() + this.m31() * matrix.m13() + this.m32() * matrix.m23() + this.m33() * matrix.m33());
  }

  /**
   * Returns the multiplication of this matrix times the provided vector
   * @public
   *
   * @param {Vector4} vector4
   * @returns {Vector4}
   */
  timesVector4(vector4) {
    const x = this.m00() * vector4.x + this.m01() * vector4.y + this.m02() * vector4.z + this.m03() * vector4.w;
    const y = this.m10() * vector4.x + this.m11() * vector4.y + this.m12() * vector4.z + this.m13() * vector4.w;
    const z = this.m20() * vector4.x + this.m21() * vector4.y + this.m22() * vector4.z + this.m23() * vector4.w;
    const w = this.m30() * vector4.x + this.m31() * vector4.y + this.m32() * vector4.z + this.m33() * vector4.w;
    return new Vector4(x, y, z, w);
  }

  /**
   * Returns the multiplication of this matrix times the provided vector (treating this matrix as homogeneous, so that
   * it is the technical multiplication of (x,y,z,1)).
   * @public
   *
   * @param {Vector3} vector3
   * @returns {Vector3}
   */
  timesVector3(vector3) {
    return this.timesVector4(vector3.toVector4()).toVector3();
  }

  /**
   * Returns the multiplication of this matrix's transpose times the provided vector
   * @public
   *
   * @param {Vector4} vector4
   * @returns {Vector4}
   */
  timesTransposeVector4(vector4) {
    const x = this.m00() * vector4.x + this.m10() * vector4.y + this.m20() * vector4.z + this.m30() * vector4.w;
    const y = this.m01() * vector4.x + this.m11() * vector4.y + this.m21() * vector4.z + this.m31() * vector4.w;
    const z = this.m02() * vector4.x + this.m12() * vector4.y + this.m22() * vector4.z + this.m32() * vector4.w;
    const w = this.m03() * vector4.x + this.m13() * vector4.y + this.m23() * vector4.z + this.m33() * vector4.w;
    return new Vector4(x, y, z, w);
  }

  /**
   * Returns the multiplication of this matrix's transpose times the provided vector (homogeneous).
   * @public
   *
   * @param {Vector3} vector3
   * @returns {Vector3}
   */
  timesTransposeVector3(vector3) {
    return this.timesTransposeVector4(vector3.toVector4()).toVector3();
  }

  /**
   * Equivalent to the multiplication of (x,y,z,0), ignoring the homogeneous part.
   * @public
   *
   * @param {Vector3} vector3
   * @returns {Vector3}
   */
  timesRelativeVector3(vector3) {
    const x = this.m00() * vector3.x + this.m10() * vector3.y + this.m20() * vector3.z;
    const y = this.m01() * vector3.y + this.m11() * vector3.y + this.m21() * vector3.z;
    const z = this.m02() * vector3.z + this.m12() * vector3.y + this.m22() * vector3.z;
    return new Vector3(x, y, z);
  }

  /**
   * Returns the determinant of this matrix.
   * @public
   *
   * @returns {number}
   */
  getDeterminant() {
    return this.m03() * this.m12() * this.m21() * this.m30() - this.m02() * this.m13() * this.m21() * this.m30() - this.m03() * this.m11() * this.m22() * this.m30() + this.m01() * this.m13() * this.m22() * this.m30() + this.m02() * this.m11() * this.m23() * this.m30() - this.m01() * this.m12() * this.m23() * this.m30() - this.m03() * this.m12() * this.m20() * this.m31() + this.m02() * this.m13() * this.m20() * this.m31() + this.m03() * this.m10() * this.m22() * this.m31() - this.m00() * this.m13() * this.m22() * this.m31() - this.m02() * this.m10() * this.m23() * this.m31() + this.m00() * this.m12() * this.m23() * this.m31() + this.m03() * this.m11() * this.m20() * this.m32() - this.m01() * this.m13() * this.m20() * this.m32() - this.m03() * this.m10() * this.m21() * this.m32() + this.m00() * this.m13() * this.m21() * this.m32() + this.m01() * this.m10() * this.m23() * this.m32() - this.m00() * this.m11() * this.m23() * this.m32() - this.m02() * this.m11() * this.m20() * this.m33() + this.m01() * this.m12() * this.m20() * this.m33() + this.m02() * this.m10() * this.m21() * this.m33() - this.m00() * this.m12() * this.m21() * this.m33() - this.m01() * this.m10() * this.m22() * this.m33() + this.m00() * this.m11() * this.m22() * this.m33();
  }
  get determinant() {
    return this.getDeterminant();
  }

  /**
   * Returns a string form of this object
   * @public
   *
   * @returns {string}
   */
  toString() {
    return `${this.m00()} ${this.m01()} ${this.m02()} ${this.m03()}\n${this.m10()} ${this.m11()} ${this.m12()} ${this.m13()}\n${this.m20()} ${this.m21()} ${this.m22()} ${this.m23()}\n${this.m30()} ${this.m31()} ${this.m32()} ${this.m33()}`;
  }

  /**
   * Makes this matrix effectively immutable to the normal methods (except direct setters?)
   * @public
   *
   * @returns {Matrix3} - Self reference
   */
  makeImmutable() {
    if (assert) {
      this.rowMajor = () => {
        throw new Error('Cannot modify immutable matrix');
      };
    }
    return this;
  }

  /**
   * Copies the entries of this matrix over to an arbitrary array (typed or normal).
   * @public
   *
   * @param {Array|Float32Array|Float64Array} array
   * @returns {Array|Float32Array|Float64Array} - Returned for chaining
   */
  copyToArray(array) {
    array[0] = this.m00();
    array[1] = this.m10();
    array[2] = this.m20();
    array[3] = this.m30();
    array[4] = this.m01();
    array[5] = this.m11();
    array[6] = this.m21();
    array[7] = this.m31();
    array[8] = this.m02();
    array[9] = this.m12();
    array[10] = this.m22();
    array[11] = this.m32();
    array[12] = this.m03();
    array[13] = this.m13();
    array[14] = this.m23();
    array[15] = this.m33();
    return array;
  }

  /**
   * Returns an identity matrix.
   * @public
   *
   * @returns {Matrix4}
   */
  static identity() {
    return new Matrix4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, Types.IDENTITY);
  }

  /**
   * Returns a translation matrix.
   * @public
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {Matrix4}
   */
  static translation(x, y, z) {
    return new Matrix4(1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1, Types.TRANSLATION_3D);
  }

  /**
   * Returns a translation matrix computed from a vector.
   * @public
   *
   * @param {Vector3|Vector4} vector
   * @returns {Matrix4}
   */
  static translationFromVector(vector) {
    return Matrix4.translation(vector.x, vector.y, vector.z);
  }

  /**
   * Returns a matrix that scales things in each dimension.
   * @public
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {Matrix4}
   */
  static scaling(x, y, z) {
    // allow using one parameter to scale everything
    y = y === undefined ? x : y;
    z = z === undefined ? x : z;
    return new Matrix4(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1, Types.SCALING);
  }

  /**
   * Returns a homogeneous matrix rotation defined by a rotation of the specified angle around the given unit axis.
   * @public
   *
   * @param {Vector3} axis - normalized
   * @param {number} angle - in radians
   * @returns {Matrix4}
   */
  static rotationAxisAngle(axis, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const C = 1 - c;
    return new Matrix4(axis.x * axis.x * C + c, axis.x * axis.y * C - axis.z * s, axis.x * axis.z * C + axis.y * s, 0, axis.y * axis.x * C + axis.z * s, axis.y * axis.y * C + c, axis.y * axis.z * C - axis.x * s, 0, axis.z * axis.x * C - axis.y * s, axis.z * axis.y * C + axis.x * s, axis.z * axis.z * C + c, 0, 0, 0, 0, 1, Types.AFFINE);
  }

  // TODO: add in rotation from quaternion, and from quat + translation https://github.com/phetsims/dot/issues/96

  /**
   * Returns a rotation matrix in the yz plane.
   * @public
   *
   * @param {number} angle - in radians
   * @returns {Matrix4}
   */
  static rotationX(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Matrix4(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, Types.AFFINE);
  }

  /**
   * Returns a rotation matrix in the xz plane.
   * @public
   *
   * @param {number} angle - in radians
   * @returns {Matrix4}
   */
  static rotationY(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Matrix4(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1, Types.AFFINE);
  }

  /**
   * Returns a rotation matrix in the xy plane.
   * @public
   *
   * @param {number} angle - in radians
   * @returns {Matrix4}
   */
  static rotationZ(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Matrix4(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, Types.AFFINE);
  }

  /**
   * Returns the specific perspective matrix needed for certain WebGL contexts.
   * @public
   *
   * @param {number} fovYRadians
   * @param {number} aspect - aspect === width / height
   * @param {number} zNear
   * @param {number} zFar
   * @returns {Matrix4}
   */
  static gluPerspective(fovYRadians, aspect, zNear, zFar) {
    const cotangent = Math.cos(fovYRadians) / Math.sin(fovYRadians);
    return new Matrix4(cotangent / aspect, 0, 0, 0, 0, cotangent, 0, 0, 0, 0, (zFar + zNear) / (zNear - zFar), 2 * zFar * zNear / (zNear - zFar), 0, 0, -1, 0);
  }
}
dot.register('Matrix4', Matrix4);
class Types extends EnumerationValue {
  static OTHER = new Types();
  static IDENTITY = new Types();
  static TRANSLATION_3D = new Types();
  static SCALING = new Types();
  static AFFINE = new Types();
  static enumeration = new Enumeration(Types);
}

// @public {Enumeration}
Matrix4.Types = Types;

// @public {Matrix4}
Matrix4.IDENTITY = new Matrix4().makeImmutable();
export default Matrix4;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFbnVtZXJhdGlvbiIsIkVudW1lcmF0aW9uVmFsdWUiLCJkb3QiLCJWZWN0b3IzIiwiVmVjdG9yNCIsIkZsb2F0MzJBcnJheSIsIndpbmRvdyIsIkFycmF5IiwiTWF0cml4NCIsImNvbnN0cnVjdG9yIiwidjAwIiwidjAxIiwidjAyIiwidjAzIiwidjEwIiwidjExIiwidjEyIiwidjEzIiwidjIwIiwidjIxIiwidjIyIiwidjIzIiwidjMwIiwidjMxIiwidjMyIiwidjMzIiwidHlwZSIsImVudHJpZXMiLCJUeXBlcyIsIk9USEVSIiwicm93TWFqb3IiLCJ1bmRlZmluZWQiLCJBRkZJTkUiLCJjb2x1bW5NYWpvciIsInNldCIsIm1hdHJpeCIsIm0wMCIsIm0wMSIsIm0wMiIsIm0wMyIsIm0xMCIsIm0xMSIsIm0xMiIsIm0xMyIsIm0yMCIsIm0yMSIsIm0yMiIsIm0yMyIsIm0zMCIsIm0zMSIsIm0zMiIsIm0zMyIsImlzRmluaXRlIiwiZ2V0VHJhbnNsYXRpb24iLCJ0cmFuc2xhdGlvbiIsImdldFNjYWxlVmVjdG9yIiwibTAwMDMiLCJtMTAxMyIsIm0yMDIzIiwibTMwMzMiLCJtMDEwMyIsIm0xMTEzIiwibTIxMjMiLCJtMzEzMyIsIm0wMjAzIiwibTEyMTMiLCJtMjIyMyIsIm0zMjMzIiwiTWF0aCIsInNxcnQiLCJzY2FsZVZlY3RvciIsImdldENTU1RyYW5zZm9ybSIsInRvRml4ZWQiLCJjc3NUcmFuc2Zvcm0iLCJlcXVhbHMiLCJlcXVhbHNFcHNpbG9uIiwiZXBzaWxvbiIsImFicyIsImNvcHkiLCJwbHVzIiwibWludXMiLCJ0cmFuc3Bvc2VkIiwibmVnYXRlZCIsImludmVydGVkIiwiZGV0IiwiSURFTlRJVFkiLCJUUkFOU0xBVElPTl8zRCIsIlNDQUxJTkciLCJnZXREZXRlcm1pbmFudCIsIkVycm9yIiwidGltZXNNYXRyaXgiLCJ0aW1lc1ZlY3RvcjQiLCJ2ZWN0b3I0IiwieCIsInkiLCJ6IiwidyIsInRpbWVzVmVjdG9yMyIsInZlY3RvcjMiLCJ0b1ZlY3RvcjQiLCJ0b1ZlY3RvcjMiLCJ0aW1lc1RyYW5zcG9zZVZlY3RvcjQiLCJ0aW1lc1RyYW5zcG9zZVZlY3RvcjMiLCJ0aW1lc1JlbGF0aXZlVmVjdG9yMyIsImRldGVybWluYW50IiwidG9TdHJpbmciLCJtYWtlSW1tdXRhYmxlIiwiYXNzZXJ0IiwiY29weVRvQXJyYXkiLCJhcnJheSIsImlkZW50aXR5IiwidHJhbnNsYXRpb25Gcm9tVmVjdG9yIiwidmVjdG9yIiwic2NhbGluZyIsInJvdGF0aW9uQXhpc0FuZ2xlIiwiYXhpcyIsImFuZ2xlIiwiYyIsImNvcyIsInMiLCJzaW4iLCJDIiwicm90YXRpb25YIiwicm90YXRpb25ZIiwicm90YXRpb25aIiwiZ2x1UGVyc3BlY3RpdmUiLCJmb3ZZUmFkaWFucyIsImFzcGVjdCIsInpOZWFyIiwiekZhciIsImNvdGFuZ2VudCIsInJlZ2lzdGVyIiwiZW51bWVyYXRpb24iXSwic291cmNlcyI6WyJNYXRyaXg0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIDQtZGltZW5zaW9uYWwgTWF0cml4XHJcbiAqXHJcbiAqIFRPRE86IGNvbnNpZGVyIGFkZGluZyBhZmZpbmUgZmxhZyBpZiBpdCB3aWxsIGhlbHAgcGVyZm9ybWFuY2UgKGEgbGEgTWF0cml4MykgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2RvdC9pc3N1ZXMvOTZcclxuICogVE9ETzogZ2V0IHJvdGF0aW9uIGFuZ2xlc1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuLyogZXNsaW50LWRpc2FibGUgYmFkLXNpbS10ZXh0ICovXHJcblxyXG5pbXBvcnQgRW51bWVyYXRpb24gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL0VudW1lcmF0aW9uLmpzJztcclxuaW1wb3J0IEVudW1lcmF0aW9uVmFsdWUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL0VudW1lcmF0aW9uVmFsdWUuanMnO1xyXG5pbXBvcnQgZG90IGZyb20gJy4vZG90LmpzJztcclxuaW1wb3J0IFZlY3RvcjMgZnJvbSAnLi9WZWN0b3IzLmpzJztcclxuaW1wb3J0IFZlY3RvcjQgZnJvbSAnLi9WZWN0b3I0LmpzJztcclxuXHJcbmNvbnN0IEZsb2F0MzJBcnJheSA9IHdpbmRvdy5GbG9hdDMyQXJyYXkgfHwgQXJyYXk7XHJcblxyXG5jbGFzcyBNYXRyaXg0IHtcclxuICAvKipcclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YwMF1cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YwMV1cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YwMl1cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YwM11cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YxMF1cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YxMV1cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YxMl1cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YxM11cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YyMF1cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YyMV1cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YyMl1cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YyM11cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YzMF1cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YzMV1cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YzMl1cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3YzM11cclxuICAgKiBAcGFyYW0ge01hdHJpeDQuVHlwZXN8dW5kZWZpbmVkfSBbdHlwZV1cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvciggdjAwLCB2MDEsIHYwMiwgdjAzLCB2MTAsIHYxMSwgdjEyLCB2MTMsIHYyMCwgdjIxLCB2MjIsIHYyMywgdjMwLCB2MzEsIHYzMiwgdjMzLCB0eXBlICkge1xyXG5cclxuICAgIC8vIEBwdWJsaWMge0Zsb2F0MzJBcnJheX0gLSBlbnRyaWVzIHN0b3JlZCBpbiBjb2x1bW4tbWFqb3IgZm9ybWF0XHJcbiAgICB0aGlzLmVudHJpZXMgPSBuZXcgRmxvYXQzMkFycmF5KCAxNiApO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge01hdHJpeDQuVHlwZXN9XHJcbiAgICB0aGlzLnR5cGUgPSBUeXBlcy5PVEhFUjsgLy8gd2lsbCBiZSBzZXQgYnkgcm93TWFqb3JcclxuXHJcbiAgICB0aGlzLnJvd01ham9yKFxyXG4gICAgICB2MDAgIT09IHVuZGVmaW5lZCA/IHYwMCA6IDEsIHYwMSAhPT0gdW5kZWZpbmVkID8gdjAxIDogMCwgdjAyICE9PSB1bmRlZmluZWQgPyB2MDIgOiAwLCB2MDMgIT09IHVuZGVmaW5lZCA/IHYwMyA6IDAsXHJcbiAgICAgIHYxMCAhPT0gdW5kZWZpbmVkID8gdjEwIDogMCwgdjExICE9PSB1bmRlZmluZWQgPyB2MTEgOiAxLCB2MTIgIT09IHVuZGVmaW5lZCA/IHYxMiA6IDAsIHYxMyAhPT0gdW5kZWZpbmVkID8gdjEzIDogMCxcclxuICAgICAgdjIwICE9PSB1bmRlZmluZWQgPyB2MjAgOiAwLCB2MjEgIT09IHVuZGVmaW5lZCA/IHYyMSA6IDAsIHYyMiAhPT0gdW5kZWZpbmVkID8gdjIyIDogMSwgdjIzICE9PSB1bmRlZmluZWQgPyB2MjMgOiAwLFxyXG4gICAgICB2MzAgIT09IHVuZGVmaW5lZCA/IHYzMCA6IDAsIHYzMSAhPT0gdW5kZWZpbmVkID8gdjMxIDogMCwgdjMyICE9PSB1bmRlZmluZWQgPyB2MzIgOiAwLCB2MzMgIT09IHVuZGVmaW5lZCA/IHYzMyA6IDEsXHJcbiAgICAgIHR5cGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgYWxsIGVudHJpZXMgb2YgdGhlIG1hdHJpeCBpbiByb3ctbWFqb3Igb3JkZXIuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHYwMFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2MDFcclxuICAgKiBAcGFyYW0ge251bWJlcn0gdjAyXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHYwM1xyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2MTBcclxuICAgKiBAcGFyYW0ge251bWJlcn0gdjExXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHYxMlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2MTNcclxuICAgKiBAcGFyYW0ge251bWJlcn0gdjIwXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHYyMVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2MjJcclxuICAgKiBAcGFyYW0ge251bWJlcn0gdjIzXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHYzMFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2MzFcclxuICAgKiBAcGFyYW0ge251bWJlcn0gdjMyXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHYzM1xyXG4gICAqIEBwYXJhbSB7TWF0cml4NC5UeXBlc3x1bmRlZmluZWR9IFt0eXBlXVxyXG4gICAqIEByZXR1cm5zIHtNYXRyaXg0fSAtIFNlbGYgcmVmZXJlbmNlXHJcbiAgICovXHJcbiAgcm93TWFqb3IoIHYwMCwgdjAxLCB2MDIsIHYwMywgdjEwLCB2MTEsIHYxMiwgdjEzLCB2MjAsIHYyMSwgdjIyLCB2MjMsIHYzMCwgdjMxLCB2MzIsIHYzMywgdHlwZSApIHtcclxuICAgIHRoaXMuZW50cmllc1sgMCBdID0gdjAwO1xyXG4gICAgdGhpcy5lbnRyaWVzWyAxIF0gPSB2MTA7XHJcbiAgICB0aGlzLmVudHJpZXNbIDIgXSA9IHYyMDtcclxuICAgIHRoaXMuZW50cmllc1sgMyBdID0gdjMwO1xyXG4gICAgdGhpcy5lbnRyaWVzWyA0IF0gPSB2MDE7XHJcbiAgICB0aGlzLmVudHJpZXNbIDUgXSA9IHYxMTtcclxuICAgIHRoaXMuZW50cmllc1sgNiBdID0gdjIxO1xyXG4gICAgdGhpcy5lbnRyaWVzWyA3IF0gPSB2MzE7XHJcbiAgICB0aGlzLmVudHJpZXNbIDggXSA9IHYwMjtcclxuICAgIHRoaXMuZW50cmllc1sgOSBdID0gdjEyO1xyXG4gICAgdGhpcy5lbnRyaWVzWyAxMCBdID0gdjIyO1xyXG4gICAgdGhpcy5lbnRyaWVzWyAxMSBdID0gdjMyO1xyXG4gICAgdGhpcy5lbnRyaWVzWyAxMiBdID0gdjAzO1xyXG4gICAgdGhpcy5lbnRyaWVzWyAxMyBdID0gdjEzO1xyXG4gICAgdGhpcy5lbnRyaWVzWyAxNCBdID0gdjIzO1xyXG4gICAgdGhpcy5lbnRyaWVzWyAxNSBdID0gdjMzO1xyXG5cclxuICAgIC8vIFRPRE86IGNvbnNpZGVyIHBlcmZvcm1hbmNlIG9mIHRoZSBhZmZpbmUgY2hlY2sgaGVyZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZG90L2lzc3Vlcy85NlxyXG4gICAgdGhpcy50eXBlID0gdHlwZSA9PT0gdW5kZWZpbmVkID8gKCAoIHYzMCA9PT0gMCAmJiB2MzEgPT09IDAgJiYgdjMyID09PSAwICYmIHYzMyA9PT0gMSApID8gVHlwZXMuQUZGSU5FIDogVHlwZXMuT1RIRVIgKSA6IHR5cGU7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgYWxsIGVudHJpZXMgb2YgdGhlIG1hdHJpeCBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHsqfSB2MDBcclxuICAgKiBAcGFyYW0geyp9IHYxMFxyXG4gICAqIEBwYXJhbSB7Kn0gdjIwXHJcbiAgICogQHBhcmFtIHsqfSB2MzBcclxuICAgKiBAcGFyYW0geyp9IHYwMVxyXG4gICAqIEBwYXJhbSB7Kn0gdjExXHJcbiAgICogQHBhcmFtIHsqfSB2MjFcclxuICAgKiBAcGFyYW0geyp9IHYzMVxyXG4gICAqIEBwYXJhbSB7Kn0gdjAyXHJcbiAgICogQHBhcmFtIHsqfSB2MTJcclxuICAgKiBAcGFyYW0geyp9IHYyMlxyXG4gICAqIEBwYXJhbSB7Kn0gdjMyXHJcbiAgICogQHBhcmFtIHsqfSB2MDNcclxuICAgKiBAcGFyYW0geyp9IHYxM1xyXG4gICAqIEBwYXJhbSB7Kn0gdjIzXHJcbiAgICogQHBhcmFtIHsqfSB2MzNcclxuICAgKiBAcGFyYW0ge01hdHJpeDQuVHlwZXN8dW5kZWZpbmVkfSBbdHlwZV1cclxuICAgKiBAcmV0dXJucyB7TWF0cml4NH0gLSBTZWxmIHJlZmVyZW5jZVxyXG4gICAqL1xyXG4gIGNvbHVtbk1ham9yKCB2MDAsIHYxMCwgdjIwLCB2MzAsIHYwMSwgdjExLCB2MjEsIHYzMSwgdjAyLCB2MTIsIHYyMiwgdjMyLCB2MDMsIHYxMywgdjIzLCB2MzMsIHR5cGUgKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb3dNYWpvciggdjAwLCB2MDEsIHYwMiwgdjAzLCB2MTAsIHYxMSwgdjEyLCB2MTMsIHYyMCwgdjIxLCB2MjIsIHYyMywgdjMwLCB2MzEsIHYzMiwgdjMzLCB0eXBlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIHRoZSB2YWx1ZSBvZiB0aGUgcGFzc2VkLWluIG1hdHJpeC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01hdHJpeDR9IG1hdHJpeFxyXG4gICAqIEByZXR1cm5zIHtNYXRyaXg0fSAtIFNlbGYgcmVmZXJlbmNlXHJcbiAgICovXHJcbiAgc2V0KCBtYXRyaXggKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb3dNYWpvcihcclxuICAgICAgbWF0cml4Lm0wMCgpLCBtYXRyaXgubTAxKCksIG1hdHJpeC5tMDIoKSwgbWF0cml4Lm0wMygpLFxyXG4gICAgICBtYXRyaXgubTEwKCksIG1hdHJpeC5tMTEoKSwgbWF0cml4Lm0xMigpLCBtYXRyaXgubTEzKCksXHJcbiAgICAgIG1hdHJpeC5tMjAoKSwgbWF0cml4Lm0yMSgpLCBtYXRyaXgubTIyKCksIG1hdHJpeC5tMjMoKSxcclxuICAgICAgbWF0cml4Lm0zMCgpLCBtYXRyaXgubTMxKCksIG1hdHJpeC5tMzIoKSwgbWF0cml4Lm0zMygpLFxyXG4gICAgICBtYXRyaXgudHlwZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgMCwwIGVudHJ5IG9mIHRoaXMgbWF0cml4LlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgbTAwKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZW50cmllc1sgMCBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgMCwxIGVudHJ5IG9mIHRoaXMgbWF0cml4LlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgbTAxKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZW50cmllc1sgNCBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgMCwyIGVudHJ5IG9mIHRoaXMgbWF0cml4LlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgbTAyKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZW50cmllc1sgOCBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgMCwzIGVudHJ5IG9mIHRoaXMgbWF0cml4LlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgbTAzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZW50cmllc1sgMTIgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIDEsMCBlbnRyeSBvZiB0aGlzIG1hdHJpeC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIG0xMCgpIHtcclxuICAgIHJldHVybiB0aGlzLmVudHJpZXNbIDEgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIDEsMSBlbnRyeSBvZiB0aGlzIG1hdHJpeC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIG0xMSgpIHtcclxuICAgIHJldHVybiB0aGlzLmVudHJpZXNbIDUgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIDEsMiBlbnRyeSBvZiB0aGlzIG1hdHJpeC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIG0xMigpIHtcclxuICAgIHJldHVybiB0aGlzLmVudHJpZXNbIDkgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIDEsMyBlbnRyeSBvZiB0aGlzIG1hdHJpeC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIG0xMygpIHtcclxuICAgIHJldHVybiB0aGlzLmVudHJpZXNbIDEzIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSAyLDAgZW50cnkgb2YgdGhpcyBtYXRyaXguXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge251bWJlcn1cclxuICAgKi9cclxuICBtMjAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5lbnRyaWVzWyAyIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSAyLDEgZW50cnkgb2YgdGhpcyBtYXRyaXguXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge251bWJlcn1cclxuICAgKi9cclxuICBtMjEoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5lbnRyaWVzWyA2IF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSAyLDIgZW50cnkgb2YgdGhpcyBtYXRyaXguXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge251bWJlcn1cclxuICAgKi9cclxuICBtMjIoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5lbnRyaWVzWyAxMCBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgMiwzIGVudHJ5IG9mIHRoaXMgbWF0cml4LlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgbTIzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZW50cmllc1sgMTQgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIDMsMCBlbnRyeSBvZiB0aGlzIG1hdHJpeC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIG0zMCgpIHtcclxuICAgIHJldHVybiB0aGlzLmVudHJpZXNbIDMgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIDMsMSBlbnRyeSBvZiB0aGlzIG1hdHJpeC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIG0zMSgpIHtcclxuICAgIHJldHVybiB0aGlzLmVudHJpZXNbIDcgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIDMsMiBlbnRyeSBvZiB0aGlzIG1hdHJpeC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIG0zMigpIHtcclxuICAgIHJldHVybiB0aGlzLmVudHJpZXNbIDExIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSAzLDMgZW50cnkgb2YgdGhpcyBtYXRyaXguXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge251bWJlcn1cclxuICAgKi9cclxuICBtMzMoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5lbnRyaWVzWyAxNSBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIGFsbCBvZiB0aGlzIG1hdHJpeCdzIGVudHJpZXMgYXJlIGZpbml0ZSAobm9uLWluZmluaXRlIGFuZCBub24tTmFOKS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgKi9cclxuICBpc0Zpbml0ZSgpIHtcclxuICAgIHJldHVybiBpc0Zpbml0ZSggdGhpcy5tMDAoKSApICYmXHJcbiAgICAgICAgICAgaXNGaW5pdGUoIHRoaXMubTAxKCkgKSAmJlxyXG4gICAgICAgICAgIGlzRmluaXRlKCB0aGlzLm0wMigpICkgJiZcclxuICAgICAgICAgICBpc0Zpbml0ZSggdGhpcy5tMDMoKSApICYmXHJcbiAgICAgICAgICAgaXNGaW5pdGUoIHRoaXMubTEwKCkgKSAmJlxyXG4gICAgICAgICAgIGlzRmluaXRlKCB0aGlzLm0xMSgpICkgJiZcclxuICAgICAgICAgICBpc0Zpbml0ZSggdGhpcy5tMTIoKSApICYmXHJcbiAgICAgICAgICAgaXNGaW5pdGUoIHRoaXMubTEzKCkgKSAmJlxyXG4gICAgICAgICAgIGlzRmluaXRlKCB0aGlzLm0yMCgpICkgJiZcclxuICAgICAgICAgICBpc0Zpbml0ZSggdGhpcy5tMjEoKSApICYmXHJcbiAgICAgICAgICAgaXNGaW5pdGUoIHRoaXMubTIyKCkgKSAmJlxyXG4gICAgICAgICAgIGlzRmluaXRlKCB0aGlzLm0yMygpICkgJiZcclxuICAgICAgICAgICBpc0Zpbml0ZSggdGhpcy5tMzAoKSApICYmXHJcbiAgICAgICAgICAgaXNGaW5pdGUoIHRoaXMubTMxKCkgKSAmJlxyXG4gICAgICAgICAgIGlzRmluaXRlKCB0aGlzLm0zMigpICkgJiZcclxuICAgICAgICAgICBpc0Zpbml0ZSggdGhpcy5tMzMoKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgM0QgdHJhbnNsYXRpb24sIGFzc3VtaW5nIG11bHRpcGxpY2F0aW9uIHdpdGggYSBob21vZ2VuZW91cyB2ZWN0b3IuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1ZlY3RvcjN9XHJcbiAgICovXHJcbiAgZ2V0VHJhbnNsYXRpb24oKSB7XHJcbiAgICByZXR1cm4gbmV3IFZlY3RvcjMoIHRoaXMubTAzKCksIHRoaXMubTEzKCksIHRoaXMubTIzKCkgKTtcclxuICB9XHJcblxyXG4gIGdldCB0cmFuc2xhdGlvbigpIHsgcmV0dXJuIHRoaXMuZ2V0VHJhbnNsYXRpb24oKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgdmVjdG9yIHRoYXQgaXMgZXF1aXZhbGVudCB0byAoIFQoMSwwLDApLm1hZ25pdHVkZSwgVCgwLDEsMCkubWFnbml0dWRlLCBUKDAsMCwxKS5tYWduaXR1ZGUgKVxyXG4gICAqIHdoZXJlIFQgaXMgYSByZWxhdGl2ZSB0cmFuc2Zvcm0uXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1ZlY3RvcjN9XHJcbiAgICovXHJcbiAgZ2V0U2NhbGVWZWN0b3IoKSB7XHJcbiAgICBjb25zdCBtMDAwMyA9IHRoaXMubTAwKCkgKyB0aGlzLm0wMygpO1xyXG4gICAgY29uc3QgbTEwMTMgPSB0aGlzLm0xMCgpICsgdGhpcy5tMTMoKTtcclxuICAgIGNvbnN0IG0yMDIzID0gdGhpcy5tMjAoKSArIHRoaXMubTIzKCk7XHJcbiAgICBjb25zdCBtMzAzMyA9IHRoaXMubTMwKCkgKyB0aGlzLm0zMygpO1xyXG4gICAgY29uc3QgbTAxMDMgPSB0aGlzLm0wMSgpICsgdGhpcy5tMDMoKTtcclxuICAgIGNvbnN0IG0xMTEzID0gdGhpcy5tMTEoKSArIHRoaXMubTEzKCk7XHJcbiAgICBjb25zdCBtMjEyMyA9IHRoaXMubTIxKCkgKyB0aGlzLm0yMygpO1xyXG4gICAgY29uc3QgbTMxMzMgPSB0aGlzLm0zMSgpICsgdGhpcy5tMzMoKTtcclxuICAgIGNvbnN0IG0wMjAzID0gdGhpcy5tMDIoKSArIHRoaXMubTAzKCk7XHJcbiAgICBjb25zdCBtMTIxMyA9IHRoaXMubTEyKCkgKyB0aGlzLm0xMygpO1xyXG4gICAgY29uc3QgbTIyMjMgPSB0aGlzLm0yMigpICsgdGhpcy5tMjMoKTtcclxuICAgIGNvbnN0IG0zMjMzID0gdGhpcy5tMzIoKSArIHRoaXMubTMzKCk7XHJcbiAgICByZXR1cm4gbmV3IFZlY3RvcjMoXHJcbiAgICAgIE1hdGguc3FydCggbTAwMDMgKiBtMDAwMyArIG0xMDEzICogbTEwMTMgKyBtMjAyMyAqIG0yMDIzICsgbTMwMzMgKiBtMzAzMyApLFxyXG4gICAgICBNYXRoLnNxcnQoIG0wMTAzICogbTAxMDMgKyBtMTExMyAqIG0xMTEzICsgbTIxMjMgKiBtMjEyMyArIG0zMTMzICogbTMxMzMgKSxcclxuICAgICAgTWF0aC5zcXJ0KCBtMDIwMyAqIG0wMjAzICsgbTEyMTMgKiBtMTIxMyArIG0yMjIzICogbTIyMjMgKyBtMzIzMyAqIG0zMjMzICkgKTtcclxuICB9XHJcblxyXG4gIGdldCBzY2FsZVZlY3RvcigpIHsgcmV0dXJuIHRoaXMuZ2V0U2NhbGVWZWN0b3IoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBDU1MgdHJhbnNmb3JtIHN0cmluZyBmb3IgdGhlIGFzc29jaWF0ZWQgaG9tb2dlbmVvdXMgM2QgdHJhbnNmb3JtYXRpb24uXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICBnZXRDU1NUcmFuc2Zvcm0oKSB7XHJcbiAgICAvLyBTZWUgaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy10cmFuc2Zvcm1zLywgcGFydGljdWxhcmx5IFNlY3Rpb24gMTMgdGhhdCBkaXNjdXNzZXMgdGhlIFNWRyBjb21wYXRpYmlsaXR5XHJcblxyXG4gICAgLy8gdGhlIGlubmVyIHBhcnQgb2YgYSBDU1MzIHRyYW5zZm9ybSwgYnV0IHJlbWVtYmVyIHRvIGFkZCB0aGUgYnJvd3Nlci1zcGVjaWZpYyBwYXJ0cyFcclxuICAgIC8vIE5PVEU6IHRoZSB0b0ZpeGVkIGNhbGxzIGFyZSBpbmxpbmVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zXHJcbiAgICByZXR1cm4gYG1hdHJpeDNkKCR7XHJcbiAgICAgIHRoaXMuZW50cmllc1sgMCBdLnRvRml4ZWQoIDIwICl9LCR7XHJcbiAgICAgIHRoaXMuZW50cmllc1sgMSBdLnRvRml4ZWQoIDIwICl9LCR7XHJcbiAgICAgIHRoaXMuZW50cmllc1sgMiBdLnRvRml4ZWQoIDIwICl9LCR7XHJcbiAgICAgIHRoaXMuZW50cmllc1sgMyBdLnRvRml4ZWQoIDIwICl9LCR7XHJcbiAgICAgIHRoaXMuZW50cmllc1sgNCBdLnRvRml4ZWQoIDIwICl9LCR7XHJcbiAgICAgIHRoaXMuZW50cmllc1sgNSBdLnRvRml4ZWQoIDIwICl9LCR7XHJcbiAgICAgIHRoaXMuZW50cmllc1sgNiBdLnRvRml4ZWQoIDIwICl9LCR7XHJcbiAgICAgIHRoaXMuZW50cmllc1sgNyBdLnRvRml4ZWQoIDIwICl9LCR7XHJcbiAgICAgIHRoaXMuZW50cmllc1sgOCBdLnRvRml4ZWQoIDIwICl9LCR7XHJcbiAgICAgIHRoaXMuZW50cmllc1sgOSBdLnRvRml4ZWQoIDIwICl9LCR7XHJcbiAgICAgIHRoaXMuZW50cmllc1sgMTAgXS50b0ZpeGVkKCAyMCApfSwke1xyXG4gICAgICB0aGlzLmVudHJpZXNbIDExIF0udG9GaXhlZCggMjAgKX0sJHtcclxuICAgICAgdGhpcy5lbnRyaWVzWyAxMiBdLnRvRml4ZWQoIDIwICl9LCR7XHJcbiAgICAgIHRoaXMuZW50cmllc1sgMTMgXS50b0ZpeGVkKCAyMCApfSwke1xyXG4gICAgICB0aGlzLmVudHJpZXNbIDE0IF0udG9GaXhlZCggMjAgKX0sJHtcclxuICAgICAgdGhpcy5lbnRyaWVzWyAxNSBdLnRvRml4ZWQoIDIwICl9KWA7XHJcbiAgfVxyXG5cclxuICBnZXQgY3NzVHJhbnNmb3JtKCkgeyByZXR1cm4gdGhpcy5nZXRDU1NUcmFuc2Zvcm0oKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGV4YWN0IGVxdWFsaXR5IHdpdGggYW5vdGhlciBtYXRyaXhcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01hdHJpeDR9IG1hdHJpeFxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAqL1xyXG4gIGVxdWFscyggbWF0cml4ICkge1xyXG4gICAgcmV0dXJuIHRoaXMubTAwKCkgPT09IG1hdHJpeC5tMDAoKSAmJiB0aGlzLm0wMSgpID09PSBtYXRyaXgubTAxKCkgJiYgdGhpcy5tMDIoKSA9PT0gbWF0cml4Lm0wMigpICYmIHRoaXMubTAzKCkgPT09IG1hdHJpeC5tMDMoKSAmJlxyXG4gICAgICAgICAgIHRoaXMubTEwKCkgPT09IG1hdHJpeC5tMTAoKSAmJiB0aGlzLm0xMSgpID09PSBtYXRyaXgubTExKCkgJiYgdGhpcy5tMTIoKSA9PT0gbWF0cml4Lm0xMigpICYmIHRoaXMubTEzKCkgPT09IG1hdHJpeC5tMTMoKSAmJlxyXG4gICAgICAgICAgIHRoaXMubTIwKCkgPT09IG1hdHJpeC5tMjAoKSAmJiB0aGlzLm0yMSgpID09PSBtYXRyaXgubTIxKCkgJiYgdGhpcy5tMjIoKSA9PT0gbWF0cml4Lm0yMigpICYmIHRoaXMubTIzKCkgPT09IG1hdHJpeC5tMjMoKSAmJlxyXG4gICAgICAgICAgIHRoaXMubTMwKCkgPT09IG1hdHJpeC5tMzAoKSAmJiB0aGlzLm0zMSgpID09PSBtYXRyaXgubTMxKCkgJiYgdGhpcy5tMzIoKSA9PT0gbWF0cml4Lm0zMigpICYmIHRoaXMubTMzKCkgPT09IG1hdHJpeC5tMzMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgZXF1YWxpdHkgd2l0aGluIGEgbWFyZ2luIG9mIGVycm9yIHdpdGggYW5vdGhlciBtYXRyaXhcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01hdHJpeDR9IG1hdHJpeFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBlcHNpbG9uXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICovXHJcbiAgZXF1YWxzRXBzaWxvbiggbWF0cml4LCBlcHNpbG9uICkge1xyXG4gICAgcmV0dXJuIE1hdGguYWJzKCB0aGlzLm0wMCgpIC0gbWF0cml4Lm0wMCgpICkgPCBlcHNpbG9uICYmXHJcbiAgICAgICAgICAgTWF0aC5hYnMoIHRoaXMubTAxKCkgLSBtYXRyaXgubTAxKCkgKSA8IGVwc2lsb24gJiZcclxuICAgICAgICAgICBNYXRoLmFicyggdGhpcy5tMDIoKSAtIG1hdHJpeC5tMDIoKSApIDwgZXBzaWxvbiAmJlxyXG4gICAgICAgICAgIE1hdGguYWJzKCB0aGlzLm0wMygpIC0gbWF0cml4Lm0wMygpICkgPCBlcHNpbG9uICYmXHJcbiAgICAgICAgICAgTWF0aC5hYnMoIHRoaXMubTEwKCkgLSBtYXRyaXgubTEwKCkgKSA8IGVwc2lsb24gJiZcclxuICAgICAgICAgICBNYXRoLmFicyggdGhpcy5tMTEoKSAtIG1hdHJpeC5tMTEoKSApIDwgZXBzaWxvbiAmJlxyXG4gICAgICAgICAgIE1hdGguYWJzKCB0aGlzLm0xMigpIC0gbWF0cml4Lm0xMigpICkgPCBlcHNpbG9uICYmXHJcbiAgICAgICAgICAgTWF0aC5hYnMoIHRoaXMubTEzKCkgLSBtYXRyaXgubTEzKCkgKSA8IGVwc2lsb24gJiZcclxuICAgICAgICAgICBNYXRoLmFicyggdGhpcy5tMjAoKSAtIG1hdHJpeC5tMjAoKSApIDwgZXBzaWxvbiAmJlxyXG4gICAgICAgICAgIE1hdGguYWJzKCB0aGlzLm0yMSgpIC0gbWF0cml4Lm0yMSgpICkgPCBlcHNpbG9uICYmXHJcbiAgICAgICAgICAgTWF0aC5hYnMoIHRoaXMubTIyKCkgLSBtYXRyaXgubTIyKCkgKSA8IGVwc2lsb24gJiZcclxuICAgICAgICAgICBNYXRoLmFicyggdGhpcy5tMjMoKSAtIG1hdHJpeC5tMjMoKSApIDwgZXBzaWxvbiAmJlxyXG4gICAgICAgICAgIE1hdGguYWJzKCB0aGlzLm0zMCgpIC0gbWF0cml4Lm0zMCgpICkgPCBlcHNpbG9uICYmXHJcbiAgICAgICAgICAgTWF0aC5hYnMoIHRoaXMubTMxKCkgLSBtYXRyaXgubTMxKCkgKSA8IGVwc2lsb24gJiZcclxuICAgICAgICAgICBNYXRoLmFicyggdGhpcy5tMzIoKSAtIG1hdHJpeC5tMzIoKSApIDwgZXBzaWxvbiAmJlxyXG4gICAgICAgICAgIE1hdGguYWJzKCB0aGlzLm0zMygpIC0gbWF0cml4Lm0zMygpICkgPCBlcHNpbG9uO1xyXG4gIH1cclxuXHJcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXHJcbiAgICogSW1tdXRhYmxlIG9wZXJhdGlvbnMgKHJldHVybmluZyBhIG5ldyBtYXRyaXgpXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGNvcHkgb2YgdGhpcyBtYXRyaXhcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7TWF0cml4NH1cclxuICAgKi9cclxuICBjb3B5KCkge1xyXG4gICAgcmV0dXJuIG5ldyBNYXRyaXg0KFxyXG4gICAgICB0aGlzLm0wMCgpLCB0aGlzLm0wMSgpLCB0aGlzLm0wMigpLCB0aGlzLm0wMygpLFxyXG4gICAgICB0aGlzLm0xMCgpLCB0aGlzLm0xMSgpLCB0aGlzLm0xMigpLCB0aGlzLm0xMygpLFxyXG4gICAgICB0aGlzLm0yMCgpLCB0aGlzLm0yMSgpLCB0aGlzLm0yMigpLCB0aGlzLm0yMygpLFxyXG4gICAgICB0aGlzLm0zMCgpLCB0aGlzLm0zMSgpLCB0aGlzLm0zMigpLCB0aGlzLm0zMygpLFxyXG4gICAgICB0aGlzLnR5cGVcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbmV3IG1hdHJpeCwgZGVmaW5lZCBieSB0aGlzIG1hdHJpeCBwbHVzIHRoZSBwcm92aWRlZCBtYXRyaXhcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01hdHJpeDR9IG1hdHJpeFxyXG4gICAqIEByZXR1cm5zIHtNYXRyaXg0fVxyXG4gICAqL1xyXG4gIHBsdXMoIG1hdHJpeCApIHtcclxuICAgIHJldHVybiBuZXcgTWF0cml4NChcclxuICAgICAgdGhpcy5tMDAoKSArIG1hdHJpeC5tMDAoKSwgdGhpcy5tMDEoKSArIG1hdHJpeC5tMDEoKSwgdGhpcy5tMDIoKSArIG1hdHJpeC5tMDIoKSwgdGhpcy5tMDMoKSArIG1hdHJpeC5tMDMoKSxcclxuICAgICAgdGhpcy5tMTAoKSArIG1hdHJpeC5tMTAoKSwgdGhpcy5tMTEoKSArIG1hdHJpeC5tMTEoKSwgdGhpcy5tMTIoKSArIG1hdHJpeC5tMTIoKSwgdGhpcy5tMTMoKSArIG1hdHJpeC5tMTMoKSxcclxuICAgICAgdGhpcy5tMjAoKSArIG1hdHJpeC5tMjAoKSwgdGhpcy5tMjEoKSArIG1hdHJpeC5tMjEoKSwgdGhpcy5tMjIoKSArIG1hdHJpeC5tMjIoKSwgdGhpcy5tMjMoKSArIG1hdHJpeC5tMjMoKSxcclxuICAgICAgdGhpcy5tMzAoKSArIG1hdHJpeC5tMzAoKSwgdGhpcy5tMzEoKSArIG1hdHJpeC5tMzEoKSwgdGhpcy5tMzIoKSArIG1hdHJpeC5tMzIoKSwgdGhpcy5tMzMoKSArIG1hdHJpeC5tMzMoKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgbWF0cml4LCBkZWZpbmVkIGJ5IHRoaXMgbWF0cml4IHBsdXMgdGhlIHByb3ZpZGVkIG1hdHJpeFxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7TWF0cml4NH0gbWF0cml4XHJcbiAgICogQHJldHVybnMge01hdHJpeDR9XHJcbiAgICovXHJcbiAgbWludXMoIG1hdHJpeCApIHtcclxuICAgIHJldHVybiBuZXcgTWF0cml4NChcclxuICAgICAgdGhpcy5tMDAoKSAtIG1hdHJpeC5tMDAoKSwgdGhpcy5tMDEoKSAtIG1hdHJpeC5tMDEoKSwgdGhpcy5tMDIoKSAtIG1hdHJpeC5tMDIoKSwgdGhpcy5tMDMoKSAtIG1hdHJpeC5tMDMoKSxcclxuICAgICAgdGhpcy5tMTAoKSAtIG1hdHJpeC5tMTAoKSwgdGhpcy5tMTEoKSAtIG1hdHJpeC5tMTEoKSwgdGhpcy5tMTIoKSAtIG1hdHJpeC5tMTIoKSwgdGhpcy5tMTMoKSAtIG1hdHJpeC5tMTMoKSxcclxuICAgICAgdGhpcy5tMjAoKSAtIG1hdHJpeC5tMjAoKSwgdGhpcy5tMjEoKSAtIG1hdHJpeC5tMjEoKSwgdGhpcy5tMjIoKSAtIG1hdHJpeC5tMjIoKSwgdGhpcy5tMjMoKSAtIG1hdHJpeC5tMjMoKSxcclxuICAgICAgdGhpcy5tMzAoKSAtIG1hdHJpeC5tMzAoKSwgdGhpcy5tMzEoKSAtIG1hdHJpeC5tMzEoKSwgdGhpcy5tMzIoKSAtIG1hdHJpeC5tMzIoKSwgdGhpcy5tMzMoKSAtIG1hdHJpeC5tMzMoKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB0cmFuc3Bvc2VkIGNvcHkgb2YgdGhpcyBtYXRyaXhcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7TWF0cml4NH1cclxuICAgKi9cclxuICB0cmFuc3Bvc2VkKCkge1xyXG4gICAgcmV0dXJuIG5ldyBNYXRyaXg0KFxyXG4gICAgICB0aGlzLm0wMCgpLCB0aGlzLm0xMCgpLCB0aGlzLm0yMCgpLCB0aGlzLm0zMCgpLFxyXG4gICAgICB0aGlzLm0wMSgpLCB0aGlzLm0xMSgpLCB0aGlzLm0yMSgpLCB0aGlzLm0zMSgpLFxyXG4gICAgICB0aGlzLm0wMigpLCB0aGlzLm0xMigpLCB0aGlzLm0yMigpLCB0aGlzLm0zMigpLFxyXG4gICAgICB0aGlzLm0wMygpLCB0aGlzLm0xMygpLCB0aGlzLm0yMygpLCB0aGlzLm0zMygpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbmVnYXRlZCBjb3B5IG9mIHRoaXMgbWF0cml4XHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge01hdHJpeDN9XHJcbiAgICovXHJcbiAgbmVnYXRlZCgpIHtcclxuICAgIHJldHVybiBuZXcgTWF0cml4NChcclxuICAgICAgLXRoaXMubTAwKCksIC10aGlzLm0wMSgpLCAtdGhpcy5tMDIoKSwgLXRoaXMubTAzKCksXHJcbiAgICAgIC10aGlzLm0xMCgpLCAtdGhpcy5tMTEoKSwgLXRoaXMubTEyKCksIC10aGlzLm0xMygpLFxyXG4gICAgICAtdGhpcy5tMjAoKSwgLXRoaXMubTIxKCksIC10aGlzLm0yMigpLCAtdGhpcy5tMjMoKSxcclxuICAgICAgLXRoaXMubTMwKCksIC10aGlzLm0zMSgpLCAtdGhpcy5tMzIoKSwgLXRoaXMubTMzKCkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gaW52ZXJ0ZWQgY29weSBvZiB0aGlzIG1hdHJpeFxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtNYXRyaXgzfVxyXG4gICAqL1xyXG4gIGludmVydGVkKCkge1xyXG4gICAgbGV0IGRldDtcclxuICAgIHN3aXRjaCggdGhpcy50eXBlICkge1xyXG4gICAgICBjYXNlIFR5cGVzLklERU5USVRZOlxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICBjYXNlIFR5cGVzLlRSQU5TTEFUSU9OXzNEOlxyXG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4NChcclxuICAgICAgICAgIDEsIDAsIDAsIC10aGlzLm0wMygpLFxyXG4gICAgICAgICAgMCwgMSwgMCwgLXRoaXMubTEzKCksXHJcbiAgICAgICAgICAwLCAwLCAxLCAtdGhpcy5tMjMoKSxcclxuICAgICAgICAgIDAsIDAsIDAsIDEsIFR5cGVzLlRSQU5TTEFUSU9OXzNEICk7XHJcbiAgICAgIGNhc2UgVHlwZXMuU0NBTElORzpcclxuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeDQoXHJcbiAgICAgICAgICAxIC8gdGhpcy5tMDAoKSwgMCwgMCwgMCxcclxuICAgICAgICAgIDAsIDEgLyB0aGlzLm0xMSgpLCAwLCAwLFxyXG4gICAgICAgICAgMCwgMCwgMSAvIHRoaXMubTIyKCksIDAsXHJcbiAgICAgICAgICAwLCAwLCAwLCAxIC8gdGhpcy5tMzMoKSwgVHlwZXMuU0NBTElORyApO1xyXG4gICAgICBjYXNlIFR5cGVzLkFGRklORTpcclxuICAgICAgY2FzZSBUeXBlcy5PVEhFUjpcclxuICAgICAgICBkZXQgPSB0aGlzLmdldERldGVybWluYW50KCk7XHJcbiAgICAgICAgaWYgKCBkZXQgIT09IDAgKSB7XHJcbiAgICAgICAgICByZXR1cm4gbmV3IE1hdHJpeDQoXHJcbiAgICAgICAgICAgICggLXRoaXMubTMxKCkgKiB0aGlzLm0yMigpICogdGhpcy5tMTMoKSArIHRoaXMubTIxKCkgKiB0aGlzLm0zMigpICogdGhpcy5tMTMoKSArIHRoaXMubTMxKCkgKiB0aGlzLm0xMigpICogdGhpcy5tMjMoKSAtIHRoaXMubTExKCkgKiB0aGlzLm0zMigpICogdGhpcy5tMjMoKSAtIHRoaXMubTIxKCkgKiB0aGlzLm0xMigpICogdGhpcy5tMzMoKSArIHRoaXMubTExKCkgKiB0aGlzLm0yMigpICogdGhpcy5tMzMoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIHRoaXMubTMxKCkgKiB0aGlzLm0yMigpICogdGhpcy5tMDMoKSAtIHRoaXMubTIxKCkgKiB0aGlzLm0zMigpICogdGhpcy5tMDMoKSAtIHRoaXMubTMxKCkgKiB0aGlzLm0wMigpICogdGhpcy5tMjMoKSArIHRoaXMubTAxKCkgKiB0aGlzLm0zMigpICogdGhpcy5tMjMoKSArIHRoaXMubTIxKCkgKiB0aGlzLm0wMigpICogdGhpcy5tMzMoKSAtIHRoaXMubTAxKCkgKiB0aGlzLm0yMigpICogdGhpcy5tMzMoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIC10aGlzLm0zMSgpICogdGhpcy5tMTIoKSAqIHRoaXMubTAzKCkgKyB0aGlzLm0xMSgpICogdGhpcy5tMzIoKSAqIHRoaXMubTAzKCkgKyB0aGlzLm0zMSgpICogdGhpcy5tMDIoKSAqIHRoaXMubTEzKCkgLSB0aGlzLm0wMSgpICogdGhpcy5tMzIoKSAqIHRoaXMubTEzKCkgLSB0aGlzLm0xMSgpICogdGhpcy5tMDIoKSAqIHRoaXMubTMzKCkgKyB0aGlzLm0wMSgpICogdGhpcy5tMTIoKSAqIHRoaXMubTMzKCkgKSAvIGRldCxcclxuICAgICAgICAgICAgKCB0aGlzLm0yMSgpICogdGhpcy5tMTIoKSAqIHRoaXMubTAzKCkgLSB0aGlzLm0xMSgpICogdGhpcy5tMjIoKSAqIHRoaXMubTAzKCkgLSB0aGlzLm0yMSgpICogdGhpcy5tMDIoKSAqIHRoaXMubTEzKCkgKyB0aGlzLm0wMSgpICogdGhpcy5tMjIoKSAqIHRoaXMubTEzKCkgKyB0aGlzLm0xMSgpICogdGhpcy5tMDIoKSAqIHRoaXMubTIzKCkgLSB0aGlzLm0wMSgpICogdGhpcy5tMTIoKSAqIHRoaXMubTIzKCkgKSAvIGRldCxcclxuICAgICAgICAgICAgKCB0aGlzLm0zMCgpICogdGhpcy5tMjIoKSAqIHRoaXMubTEzKCkgLSB0aGlzLm0yMCgpICogdGhpcy5tMzIoKSAqIHRoaXMubTEzKCkgLSB0aGlzLm0zMCgpICogdGhpcy5tMTIoKSAqIHRoaXMubTIzKCkgKyB0aGlzLm0xMCgpICogdGhpcy5tMzIoKSAqIHRoaXMubTIzKCkgKyB0aGlzLm0yMCgpICogdGhpcy5tMTIoKSAqIHRoaXMubTMzKCkgLSB0aGlzLm0xMCgpICogdGhpcy5tMjIoKSAqIHRoaXMubTMzKCkgKSAvIGRldCxcclxuICAgICAgICAgICAgKCAtdGhpcy5tMzAoKSAqIHRoaXMubTIyKCkgKiB0aGlzLm0wMygpICsgdGhpcy5tMjAoKSAqIHRoaXMubTMyKCkgKiB0aGlzLm0wMygpICsgdGhpcy5tMzAoKSAqIHRoaXMubTAyKCkgKiB0aGlzLm0yMygpIC0gdGhpcy5tMDAoKSAqIHRoaXMubTMyKCkgKiB0aGlzLm0yMygpIC0gdGhpcy5tMjAoKSAqIHRoaXMubTAyKCkgKiB0aGlzLm0zMygpICsgdGhpcy5tMDAoKSAqIHRoaXMubTIyKCkgKiB0aGlzLm0zMygpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMzAoKSAqIHRoaXMubTEyKCkgKiB0aGlzLm0wMygpIC0gdGhpcy5tMTAoKSAqIHRoaXMubTMyKCkgKiB0aGlzLm0wMygpIC0gdGhpcy5tMzAoKSAqIHRoaXMubTAyKCkgKiB0aGlzLm0xMygpICsgdGhpcy5tMDAoKSAqIHRoaXMubTMyKCkgKiB0aGlzLm0xMygpICsgdGhpcy5tMTAoKSAqIHRoaXMubTAyKCkgKiB0aGlzLm0zMygpIC0gdGhpcy5tMDAoKSAqIHRoaXMubTEyKCkgKiB0aGlzLm0zMygpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggLXRoaXMubTIwKCkgKiB0aGlzLm0xMigpICogdGhpcy5tMDMoKSArIHRoaXMubTEwKCkgKiB0aGlzLm0yMigpICogdGhpcy5tMDMoKSArIHRoaXMubTIwKCkgKiB0aGlzLm0wMigpICogdGhpcy5tMTMoKSAtIHRoaXMubTAwKCkgKiB0aGlzLm0yMigpICogdGhpcy5tMTMoKSAtIHRoaXMubTEwKCkgKiB0aGlzLm0wMigpICogdGhpcy5tMjMoKSArIHRoaXMubTAwKCkgKiB0aGlzLm0xMigpICogdGhpcy5tMjMoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIC10aGlzLm0zMCgpICogdGhpcy5tMjEoKSAqIHRoaXMubTEzKCkgKyB0aGlzLm0yMCgpICogdGhpcy5tMzEoKSAqIHRoaXMubTEzKCkgKyB0aGlzLm0zMCgpICogdGhpcy5tMTEoKSAqIHRoaXMubTIzKCkgLSB0aGlzLm0xMCgpICogdGhpcy5tMzEoKSAqIHRoaXMubTIzKCkgLSB0aGlzLm0yMCgpICogdGhpcy5tMTEoKSAqIHRoaXMubTMzKCkgKyB0aGlzLm0xMCgpICogdGhpcy5tMjEoKSAqIHRoaXMubTMzKCkgKSAvIGRldCxcclxuICAgICAgICAgICAgKCB0aGlzLm0zMCgpICogdGhpcy5tMjEoKSAqIHRoaXMubTAzKCkgLSB0aGlzLm0yMCgpICogdGhpcy5tMzEoKSAqIHRoaXMubTAzKCkgLSB0aGlzLm0zMCgpICogdGhpcy5tMDEoKSAqIHRoaXMubTIzKCkgKyB0aGlzLm0wMCgpICogdGhpcy5tMzEoKSAqIHRoaXMubTIzKCkgKyB0aGlzLm0yMCgpICogdGhpcy5tMDEoKSAqIHRoaXMubTMzKCkgLSB0aGlzLm0wMCgpICogdGhpcy5tMjEoKSAqIHRoaXMubTMzKCkgKSAvIGRldCxcclxuICAgICAgICAgICAgKCAtdGhpcy5tMzAoKSAqIHRoaXMubTExKCkgKiB0aGlzLm0wMygpICsgdGhpcy5tMTAoKSAqIHRoaXMubTMxKCkgKiB0aGlzLm0wMygpICsgdGhpcy5tMzAoKSAqIHRoaXMubTAxKCkgKiB0aGlzLm0xMygpIC0gdGhpcy5tMDAoKSAqIHRoaXMubTMxKCkgKiB0aGlzLm0xMygpIC0gdGhpcy5tMTAoKSAqIHRoaXMubTAxKCkgKiB0aGlzLm0zMygpICsgdGhpcy5tMDAoKSAqIHRoaXMubTExKCkgKiB0aGlzLm0zMygpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMjAoKSAqIHRoaXMubTExKCkgKiB0aGlzLm0wMygpIC0gdGhpcy5tMTAoKSAqIHRoaXMubTIxKCkgKiB0aGlzLm0wMygpIC0gdGhpcy5tMjAoKSAqIHRoaXMubTAxKCkgKiB0aGlzLm0xMygpICsgdGhpcy5tMDAoKSAqIHRoaXMubTIxKCkgKiB0aGlzLm0xMygpICsgdGhpcy5tMTAoKSAqIHRoaXMubTAxKCkgKiB0aGlzLm0yMygpIC0gdGhpcy5tMDAoKSAqIHRoaXMubTExKCkgKiB0aGlzLm0yMygpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMzAoKSAqIHRoaXMubTIxKCkgKiB0aGlzLm0xMigpIC0gdGhpcy5tMjAoKSAqIHRoaXMubTMxKCkgKiB0aGlzLm0xMigpIC0gdGhpcy5tMzAoKSAqIHRoaXMubTExKCkgKiB0aGlzLm0yMigpICsgdGhpcy5tMTAoKSAqIHRoaXMubTMxKCkgKiB0aGlzLm0yMigpICsgdGhpcy5tMjAoKSAqIHRoaXMubTExKCkgKiB0aGlzLm0zMigpIC0gdGhpcy5tMTAoKSAqIHRoaXMubTIxKCkgKiB0aGlzLm0zMigpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggLXRoaXMubTMwKCkgKiB0aGlzLm0yMSgpICogdGhpcy5tMDIoKSArIHRoaXMubTIwKCkgKiB0aGlzLm0zMSgpICogdGhpcy5tMDIoKSArIHRoaXMubTMwKCkgKiB0aGlzLm0wMSgpICogdGhpcy5tMjIoKSAtIHRoaXMubTAwKCkgKiB0aGlzLm0zMSgpICogdGhpcy5tMjIoKSAtIHRoaXMubTIwKCkgKiB0aGlzLm0wMSgpICogdGhpcy5tMzIoKSArIHRoaXMubTAwKCkgKiB0aGlzLm0yMSgpICogdGhpcy5tMzIoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIHRoaXMubTMwKCkgKiB0aGlzLm0xMSgpICogdGhpcy5tMDIoKSAtIHRoaXMubTEwKCkgKiB0aGlzLm0zMSgpICogdGhpcy5tMDIoKSAtIHRoaXMubTMwKCkgKiB0aGlzLm0wMSgpICogdGhpcy5tMTIoKSArIHRoaXMubTAwKCkgKiB0aGlzLm0zMSgpICogdGhpcy5tMTIoKSArIHRoaXMubTEwKCkgKiB0aGlzLm0wMSgpICogdGhpcy5tMzIoKSAtIHRoaXMubTAwKCkgKiB0aGlzLm0xMSgpICogdGhpcy5tMzIoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIC10aGlzLm0yMCgpICogdGhpcy5tMTEoKSAqIHRoaXMubTAyKCkgKyB0aGlzLm0xMCgpICogdGhpcy5tMjEoKSAqIHRoaXMubTAyKCkgKyB0aGlzLm0yMCgpICogdGhpcy5tMDEoKSAqIHRoaXMubTEyKCkgLSB0aGlzLm0wMCgpICogdGhpcy5tMjEoKSAqIHRoaXMubTEyKCkgLSB0aGlzLm0xMCgpICogdGhpcy5tMDEoKSAqIHRoaXMubTIyKCkgKyB0aGlzLm0wMCgpICogdGhpcy5tMTEoKSAqIHRoaXMubTIyKCkgKSAvIGRldFxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdNYXRyaXggY291bGQgbm90IGJlIGludmVydGVkLCBkZXRlcm1pbmFudCA9PT0gMCcgKTtcclxuICAgICAgICB9XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgTWF0cml4NC5pbnZlcnRlZCB3aXRoIHVua25vd24gdHlwZTogJHt0aGlzLnR5cGV9YCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG1hdHJpeCwgZGVmaW5lZCBieSB0aGUgbXVsdGlwbGljYXRpb24gb2YgdGhpcyAqIG1hdHJpeC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01hdHJpeDR9IG1hdHJpeFxyXG4gICAqIEByZXR1cm5zIHtNYXRyaXg0fSAtIE5PVEU6IHRoaXMgbWF5IGJlIHRoZSBzYW1lIG1hdHJpeCFcclxuICAgKi9cclxuICB0aW1lc01hdHJpeCggbWF0cml4ICkge1xyXG4gICAgLy8gSSAqIE0gPT09IE0gKiBJID09PSBJICh0aGUgaWRlbnRpdHkpXHJcbiAgICBpZiAoIHRoaXMudHlwZSA9PT0gVHlwZXMuSURFTlRJVFkgfHwgbWF0cml4LnR5cGUgPT09IFR5cGVzLklERU5USVRZICkge1xyXG4gICAgICByZXR1cm4gdGhpcy50eXBlID09PSBUeXBlcy5JREVOVElUWSA/IG1hdHJpeCA6IHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLnR5cGUgPT09IG1hdHJpeC50eXBlICkge1xyXG4gICAgICAvLyBjdXJyZW50bHkgdHdvIG1hdHJpY2VzIG9mIHRoZSBzYW1lIHR5cGUgd2lsbCByZXN1bHQgaW4gdGhlIHNhbWUgcmVzdWx0IHR5cGVcclxuICAgICAgaWYgKCB0aGlzLnR5cGUgPT09IFR5cGVzLlRSQU5TTEFUSU9OXzNEICkge1xyXG4gICAgICAgIC8vIGZhc3RlciBjb21iaW5hdGlvbiBvZiB0cmFuc2xhdGlvbnNcclxuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeDQoXHJcbiAgICAgICAgICAxLCAwLCAwLCB0aGlzLm0wMygpICsgbWF0cml4Lm0wMigpLFxyXG4gICAgICAgICAgMCwgMSwgMCwgdGhpcy5tMTMoKSArIG1hdHJpeC5tMTIoKSxcclxuICAgICAgICAgIDAsIDAsIDEsIHRoaXMubTIzKCkgKyBtYXRyaXgubTIzKCksXHJcbiAgICAgICAgICAwLCAwLCAwLCAxLCBUeXBlcy5UUkFOU0xBVElPTl8zRCApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCB0aGlzLnR5cGUgPT09IFR5cGVzLlNDQUxJTkcgKSB7XHJcbiAgICAgICAgLy8gZmFzdGVyIGNvbWJpbmF0aW9uIG9mIHNjYWxpbmdcclxuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeDQoXHJcbiAgICAgICAgICB0aGlzLm0wMCgpICogbWF0cml4Lm0wMCgpLCAwLCAwLCAwLFxyXG4gICAgICAgICAgMCwgdGhpcy5tMTEoKSAqIG1hdHJpeC5tMTEoKSwgMCwgMCxcclxuICAgICAgICAgIDAsIDAsIHRoaXMubTIyKCkgKiBtYXRyaXgubTIyKCksIDAsXHJcbiAgICAgICAgICAwLCAwLCAwLCAxLCBUeXBlcy5TQ0FMSU5HICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMudHlwZSAhPT0gVHlwZXMuT1RIRVIgJiYgbWF0cml4LnR5cGUgIT09IFR5cGVzLk9USEVSICkge1xyXG4gICAgICAvLyBjdXJyZW50bHkgdHdvIG1hdHJpY2VzIHRoYXQgYXJlIGFueXRoaW5nIGJ1dCBcIm90aGVyXCIgYXJlIHRlY2huaWNhbGx5IGFmZmluZSwgYW5kIHRoZSByZXN1bHQgd2lsbCBiZSBhZmZpbmVcclxuXHJcbiAgICAgIC8vIGFmZmluZSBjYXNlXHJcbiAgICAgIHJldHVybiBuZXcgTWF0cml4NChcclxuICAgICAgICB0aGlzLm0wMCgpICogbWF0cml4Lm0wMCgpICsgdGhpcy5tMDEoKSAqIG1hdHJpeC5tMTAoKSArIHRoaXMubTAyKCkgKiBtYXRyaXgubTIwKCksXHJcbiAgICAgICAgdGhpcy5tMDAoKSAqIG1hdHJpeC5tMDEoKSArIHRoaXMubTAxKCkgKiBtYXRyaXgubTExKCkgKyB0aGlzLm0wMigpICogbWF0cml4Lm0yMSgpLFxyXG4gICAgICAgIHRoaXMubTAwKCkgKiBtYXRyaXgubTAyKCkgKyB0aGlzLm0wMSgpICogbWF0cml4Lm0xMigpICsgdGhpcy5tMDIoKSAqIG1hdHJpeC5tMjIoKSxcclxuICAgICAgICB0aGlzLm0wMCgpICogbWF0cml4Lm0wMygpICsgdGhpcy5tMDEoKSAqIG1hdHJpeC5tMTMoKSArIHRoaXMubTAyKCkgKiBtYXRyaXgubTIzKCkgKyB0aGlzLm0wMygpLFxyXG4gICAgICAgIHRoaXMubTEwKCkgKiBtYXRyaXgubTAwKCkgKyB0aGlzLm0xMSgpICogbWF0cml4Lm0xMCgpICsgdGhpcy5tMTIoKSAqIG1hdHJpeC5tMjAoKSxcclxuICAgICAgICB0aGlzLm0xMCgpICogbWF0cml4Lm0wMSgpICsgdGhpcy5tMTEoKSAqIG1hdHJpeC5tMTEoKSArIHRoaXMubTEyKCkgKiBtYXRyaXgubTIxKCksXHJcbiAgICAgICAgdGhpcy5tMTAoKSAqIG1hdHJpeC5tMDIoKSArIHRoaXMubTExKCkgKiBtYXRyaXgubTEyKCkgKyB0aGlzLm0xMigpICogbWF0cml4Lm0yMigpLFxyXG4gICAgICAgIHRoaXMubTEwKCkgKiBtYXRyaXgubTAzKCkgKyB0aGlzLm0xMSgpICogbWF0cml4Lm0xMygpICsgdGhpcy5tMTIoKSAqIG1hdHJpeC5tMjMoKSArIHRoaXMubTEzKCksXHJcbiAgICAgICAgdGhpcy5tMjAoKSAqIG1hdHJpeC5tMDAoKSArIHRoaXMubTIxKCkgKiBtYXRyaXgubTEwKCkgKyB0aGlzLm0yMigpICogbWF0cml4Lm0yMCgpLFxyXG4gICAgICAgIHRoaXMubTIwKCkgKiBtYXRyaXgubTAxKCkgKyB0aGlzLm0yMSgpICogbWF0cml4Lm0xMSgpICsgdGhpcy5tMjIoKSAqIG1hdHJpeC5tMjEoKSxcclxuICAgICAgICB0aGlzLm0yMCgpICogbWF0cml4Lm0wMigpICsgdGhpcy5tMjEoKSAqIG1hdHJpeC5tMTIoKSArIHRoaXMubTIyKCkgKiBtYXRyaXgubTIyKCksXHJcbiAgICAgICAgdGhpcy5tMjAoKSAqIG1hdHJpeC5tMDMoKSArIHRoaXMubTIxKCkgKiBtYXRyaXgubTEzKCkgKyB0aGlzLm0yMigpICogbWF0cml4Lm0yMygpICsgdGhpcy5tMjMoKSxcclxuICAgICAgICAwLCAwLCAwLCAxLCBUeXBlcy5BRkZJTkUgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBnZW5lcmFsIGNhc2VcclxuICAgIHJldHVybiBuZXcgTWF0cml4NChcclxuICAgICAgdGhpcy5tMDAoKSAqIG1hdHJpeC5tMDAoKSArIHRoaXMubTAxKCkgKiBtYXRyaXgubTEwKCkgKyB0aGlzLm0wMigpICogbWF0cml4Lm0yMCgpICsgdGhpcy5tMDMoKSAqIG1hdHJpeC5tMzAoKSxcclxuICAgICAgdGhpcy5tMDAoKSAqIG1hdHJpeC5tMDEoKSArIHRoaXMubTAxKCkgKiBtYXRyaXgubTExKCkgKyB0aGlzLm0wMigpICogbWF0cml4Lm0yMSgpICsgdGhpcy5tMDMoKSAqIG1hdHJpeC5tMzEoKSxcclxuICAgICAgdGhpcy5tMDAoKSAqIG1hdHJpeC5tMDIoKSArIHRoaXMubTAxKCkgKiBtYXRyaXgubTEyKCkgKyB0aGlzLm0wMigpICogbWF0cml4Lm0yMigpICsgdGhpcy5tMDMoKSAqIG1hdHJpeC5tMzIoKSxcclxuICAgICAgdGhpcy5tMDAoKSAqIG1hdHJpeC5tMDMoKSArIHRoaXMubTAxKCkgKiBtYXRyaXgubTEzKCkgKyB0aGlzLm0wMigpICogbWF0cml4Lm0yMygpICsgdGhpcy5tMDMoKSAqIG1hdHJpeC5tMzMoKSxcclxuICAgICAgdGhpcy5tMTAoKSAqIG1hdHJpeC5tMDAoKSArIHRoaXMubTExKCkgKiBtYXRyaXgubTEwKCkgKyB0aGlzLm0xMigpICogbWF0cml4Lm0yMCgpICsgdGhpcy5tMTMoKSAqIG1hdHJpeC5tMzAoKSxcclxuICAgICAgdGhpcy5tMTAoKSAqIG1hdHJpeC5tMDEoKSArIHRoaXMubTExKCkgKiBtYXRyaXgubTExKCkgKyB0aGlzLm0xMigpICogbWF0cml4Lm0yMSgpICsgdGhpcy5tMTMoKSAqIG1hdHJpeC5tMzEoKSxcclxuICAgICAgdGhpcy5tMTAoKSAqIG1hdHJpeC5tMDIoKSArIHRoaXMubTExKCkgKiBtYXRyaXgubTEyKCkgKyB0aGlzLm0xMigpICogbWF0cml4Lm0yMigpICsgdGhpcy5tMTMoKSAqIG1hdHJpeC5tMzIoKSxcclxuICAgICAgdGhpcy5tMTAoKSAqIG1hdHJpeC5tMDMoKSArIHRoaXMubTExKCkgKiBtYXRyaXgubTEzKCkgKyB0aGlzLm0xMigpICogbWF0cml4Lm0yMygpICsgdGhpcy5tMTMoKSAqIG1hdHJpeC5tMzMoKSxcclxuICAgICAgdGhpcy5tMjAoKSAqIG1hdHJpeC5tMDAoKSArIHRoaXMubTIxKCkgKiBtYXRyaXgubTEwKCkgKyB0aGlzLm0yMigpICogbWF0cml4Lm0yMCgpICsgdGhpcy5tMjMoKSAqIG1hdHJpeC5tMzAoKSxcclxuICAgICAgdGhpcy5tMjAoKSAqIG1hdHJpeC5tMDEoKSArIHRoaXMubTIxKCkgKiBtYXRyaXgubTExKCkgKyB0aGlzLm0yMigpICogbWF0cml4Lm0yMSgpICsgdGhpcy5tMjMoKSAqIG1hdHJpeC5tMzEoKSxcclxuICAgICAgdGhpcy5tMjAoKSAqIG1hdHJpeC5tMDIoKSArIHRoaXMubTIxKCkgKiBtYXRyaXgubTEyKCkgKyB0aGlzLm0yMigpICogbWF0cml4Lm0yMigpICsgdGhpcy5tMjMoKSAqIG1hdHJpeC5tMzIoKSxcclxuICAgICAgdGhpcy5tMjAoKSAqIG1hdHJpeC5tMDMoKSArIHRoaXMubTIxKCkgKiBtYXRyaXgubTEzKCkgKyB0aGlzLm0yMigpICogbWF0cml4Lm0yMygpICsgdGhpcy5tMjMoKSAqIG1hdHJpeC5tMzMoKSxcclxuICAgICAgdGhpcy5tMzAoKSAqIG1hdHJpeC5tMDAoKSArIHRoaXMubTMxKCkgKiBtYXRyaXgubTEwKCkgKyB0aGlzLm0zMigpICogbWF0cml4Lm0yMCgpICsgdGhpcy5tMzMoKSAqIG1hdHJpeC5tMzAoKSxcclxuICAgICAgdGhpcy5tMzAoKSAqIG1hdHJpeC5tMDEoKSArIHRoaXMubTMxKCkgKiBtYXRyaXgubTExKCkgKyB0aGlzLm0zMigpICogbWF0cml4Lm0yMSgpICsgdGhpcy5tMzMoKSAqIG1hdHJpeC5tMzEoKSxcclxuICAgICAgdGhpcy5tMzAoKSAqIG1hdHJpeC5tMDIoKSArIHRoaXMubTMxKCkgKiBtYXRyaXgubTEyKCkgKyB0aGlzLm0zMigpICogbWF0cml4Lm0yMigpICsgdGhpcy5tMzMoKSAqIG1hdHJpeC5tMzIoKSxcclxuICAgICAgdGhpcy5tMzAoKSAqIG1hdHJpeC5tMDMoKSArIHRoaXMubTMxKCkgKiBtYXRyaXgubTEzKCkgKyB0aGlzLm0zMigpICogbWF0cml4Lm0yMygpICsgdGhpcy5tMzMoKSAqIG1hdHJpeC5tMzMoKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbXVsdGlwbGljYXRpb24gb2YgdGhpcyBtYXRyaXggdGltZXMgdGhlIHByb3ZpZGVkIHZlY3RvclxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VmVjdG9yNH0gdmVjdG9yNFxyXG4gICAqIEByZXR1cm5zIHtWZWN0b3I0fVxyXG4gICAqL1xyXG4gIHRpbWVzVmVjdG9yNCggdmVjdG9yNCApIHtcclxuICAgIGNvbnN0IHggPSB0aGlzLm0wMCgpICogdmVjdG9yNC54ICsgdGhpcy5tMDEoKSAqIHZlY3RvcjQueSArIHRoaXMubTAyKCkgKiB2ZWN0b3I0LnogKyB0aGlzLm0wMygpICogdmVjdG9yNC53O1xyXG4gICAgY29uc3QgeSA9IHRoaXMubTEwKCkgKiB2ZWN0b3I0LnggKyB0aGlzLm0xMSgpICogdmVjdG9yNC55ICsgdGhpcy5tMTIoKSAqIHZlY3RvcjQueiArIHRoaXMubTEzKCkgKiB2ZWN0b3I0Lnc7XHJcbiAgICBjb25zdCB6ID0gdGhpcy5tMjAoKSAqIHZlY3RvcjQueCArIHRoaXMubTIxKCkgKiB2ZWN0b3I0LnkgKyB0aGlzLm0yMigpICogdmVjdG9yNC56ICsgdGhpcy5tMjMoKSAqIHZlY3RvcjQudztcclxuICAgIGNvbnN0IHcgPSB0aGlzLm0zMCgpICogdmVjdG9yNC54ICsgdGhpcy5tMzEoKSAqIHZlY3RvcjQueSArIHRoaXMubTMyKCkgKiB2ZWN0b3I0LnogKyB0aGlzLm0zMygpICogdmVjdG9yNC53O1xyXG4gICAgcmV0dXJuIG5ldyBWZWN0b3I0KCB4LCB5LCB6LCB3ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBtdWx0aXBsaWNhdGlvbiBvZiB0aGlzIG1hdHJpeCB0aW1lcyB0aGUgcHJvdmlkZWQgdmVjdG9yICh0cmVhdGluZyB0aGlzIG1hdHJpeCBhcyBob21vZ2VuZW91cywgc28gdGhhdFxyXG4gICAqIGl0IGlzIHRoZSB0ZWNobmljYWwgbXVsdGlwbGljYXRpb24gb2YgKHgseSx6LDEpKS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1ZlY3RvcjN9IHZlY3RvcjNcclxuICAgKiBAcmV0dXJucyB7VmVjdG9yM31cclxuICAgKi9cclxuICB0aW1lc1ZlY3RvcjMoIHZlY3RvcjMgKSB7XHJcbiAgICByZXR1cm4gdGhpcy50aW1lc1ZlY3RvcjQoIHZlY3RvcjMudG9WZWN0b3I0KCkgKS50b1ZlY3RvcjMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG11bHRpcGxpY2F0aW9uIG9mIHRoaXMgbWF0cml4J3MgdHJhbnNwb3NlIHRpbWVzIHRoZSBwcm92aWRlZCB2ZWN0b3JcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1ZlY3RvcjR9IHZlY3RvcjRcclxuICAgKiBAcmV0dXJucyB7VmVjdG9yNH1cclxuICAgKi9cclxuICB0aW1lc1RyYW5zcG9zZVZlY3RvcjQoIHZlY3RvcjQgKSB7XHJcbiAgICBjb25zdCB4ID0gdGhpcy5tMDAoKSAqIHZlY3RvcjQueCArIHRoaXMubTEwKCkgKiB2ZWN0b3I0LnkgKyB0aGlzLm0yMCgpICogdmVjdG9yNC56ICsgdGhpcy5tMzAoKSAqIHZlY3RvcjQudztcclxuICAgIGNvbnN0IHkgPSB0aGlzLm0wMSgpICogdmVjdG9yNC54ICsgdGhpcy5tMTEoKSAqIHZlY3RvcjQueSArIHRoaXMubTIxKCkgKiB2ZWN0b3I0LnogKyB0aGlzLm0zMSgpICogdmVjdG9yNC53O1xyXG4gICAgY29uc3QgeiA9IHRoaXMubTAyKCkgKiB2ZWN0b3I0LnggKyB0aGlzLm0xMigpICogdmVjdG9yNC55ICsgdGhpcy5tMjIoKSAqIHZlY3RvcjQueiArIHRoaXMubTMyKCkgKiB2ZWN0b3I0Lnc7XHJcbiAgICBjb25zdCB3ID0gdGhpcy5tMDMoKSAqIHZlY3RvcjQueCArIHRoaXMubTEzKCkgKiB2ZWN0b3I0LnkgKyB0aGlzLm0yMygpICogdmVjdG9yNC56ICsgdGhpcy5tMzMoKSAqIHZlY3RvcjQudztcclxuICAgIHJldHVybiBuZXcgVmVjdG9yNCggeCwgeSwgeiwgdyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbXVsdGlwbGljYXRpb24gb2YgdGhpcyBtYXRyaXgncyB0cmFuc3Bvc2UgdGltZXMgdGhlIHByb3ZpZGVkIHZlY3RvciAoaG9tb2dlbmVvdXMpLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VmVjdG9yM30gdmVjdG9yM1xyXG4gICAqIEByZXR1cm5zIHtWZWN0b3IzfVxyXG4gICAqL1xyXG4gIHRpbWVzVHJhbnNwb3NlVmVjdG9yMyggdmVjdG9yMyApIHtcclxuICAgIHJldHVybiB0aGlzLnRpbWVzVHJhbnNwb3NlVmVjdG9yNCggdmVjdG9yMy50b1ZlY3RvcjQoKSApLnRvVmVjdG9yMygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXF1aXZhbGVudCB0byB0aGUgbXVsdGlwbGljYXRpb24gb2YgKHgseSx6LDApLCBpZ25vcmluZyB0aGUgaG9tb2dlbmVvdXMgcGFydC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1ZlY3RvcjN9IHZlY3RvcjNcclxuICAgKiBAcmV0dXJucyB7VmVjdG9yM31cclxuICAgKi9cclxuICB0aW1lc1JlbGF0aXZlVmVjdG9yMyggdmVjdG9yMyApIHtcclxuICAgIGNvbnN0IHggPSB0aGlzLm0wMCgpICogdmVjdG9yMy54ICsgdGhpcy5tMTAoKSAqIHZlY3RvcjMueSArIHRoaXMubTIwKCkgKiB2ZWN0b3IzLno7XHJcbiAgICBjb25zdCB5ID0gdGhpcy5tMDEoKSAqIHZlY3RvcjMueSArIHRoaXMubTExKCkgKiB2ZWN0b3IzLnkgKyB0aGlzLm0yMSgpICogdmVjdG9yMy56O1xyXG4gICAgY29uc3QgeiA9IHRoaXMubTAyKCkgKiB2ZWN0b3IzLnogKyB0aGlzLm0xMigpICogdmVjdG9yMy55ICsgdGhpcy5tMjIoKSAqIHZlY3RvcjMuejtcclxuICAgIHJldHVybiBuZXcgVmVjdG9yMyggeCwgeSwgeiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZGV0ZXJtaW5hbnQgb2YgdGhpcyBtYXRyaXguXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge251bWJlcn1cclxuICAgKi9cclxuICBnZXREZXRlcm1pbmFudCgpIHtcclxuICAgIHJldHVybiB0aGlzLm0wMygpICogdGhpcy5tMTIoKSAqIHRoaXMubTIxKCkgKiB0aGlzLm0zMCgpIC1cclxuICAgICAgICAgICB0aGlzLm0wMigpICogdGhpcy5tMTMoKSAqIHRoaXMubTIxKCkgKiB0aGlzLm0zMCgpIC1cclxuICAgICAgICAgICB0aGlzLm0wMygpICogdGhpcy5tMTEoKSAqIHRoaXMubTIyKCkgKiB0aGlzLm0zMCgpICtcclxuICAgICAgICAgICB0aGlzLm0wMSgpICogdGhpcy5tMTMoKSAqIHRoaXMubTIyKCkgKiB0aGlzLm0zMCgpICtcclxuICAgICAgICAgICB0aGlzLm0wMigpICogdGhpcy5tMTEoKSAqIHRoaXMubTIzKCkgKiB0aGlzLm0zMCgpIC1cclxuICAgICAgICAgICB0aGlzLm0wMSgpICogdGhpcy5tMTIoKSAqIHRoaXMubTIzKCkgKiB0aGlzLm0zMCgpIC1cclxuICAgICAgICAgICB0aGlzLm0wMygpICogdGhpcy5tMTIoKSAqIHRoaXMubTIwKCkgKiB0aGlzLm0zMSgpICtcclxuICAgICAgICAgICB0aGlzLm0wMigpICogdGhpcy5tMTMoKSAqIHRoaXMubTIwKCkgKiB0aGlzLm0zMSgpICtcclxuICAgICAgICAgICB0aGlzLm0wMygpICogdGhpcy5tMTAoKSAqIHRoaXMubTIyKCkgKiB0aGlzLm0zMSgpIC1cclxuICAgICAgICAgICB0aGlzLm0wMCgpICogdGhpcy5tMTMoKSAqIHRoaXMubTIyKCkgKiB0aGlzLm0zMSgpIC1cclxuICAgICAgICAgICB0aGlzLm0wMigpICogdGhpcy5tMTAoKSAqIHRoaXMubTIzKCkgKiB0aGlzLm0zMSgpICtcclxuICAgICAgICAgICB0aGlzLm0wMCgpICogdGhpcy5tMTIoKSAqIHRoaXMubTIzKCkgKiB0aGlzLm0zMSgpICtcclxuICAgICAgICAgICB0aGlzLm0wMygpICogdGhpcy5tMTEoKSAqIHRoaXMubTIwKCkgKiB0aGlzLm0zMigpIC1cclxuICAgICAgICAgICB0aGlzLm0wMSgpICogdGhpcy5tMTMoKSAqIHRoaXMubTIwKCkgKiB0aGlzLm0zMigpIC1cclxuICAgICAgICAgICB0aGlzLm0wMygpICogdGhpcy5tMTAoKSAqIHRoaXMubTIxKCkgKiB0aGlzLm0zMigpICtcclxuICAgICAgICAgICB0aGlzLm0wMCgpICogdGhpcy5tMTMoKSAqIHRoaXMubTIxKCkgKiB0aGlzLm0zMigpICtcclxuICAgICAgICAgICB0aGlzLm0wMSgpICogdGhpcy5tMTAoKSAqIHRoaXMubTIzKCkgKiB0aGlzLm0zMigpIC1cclxuICAgICAgICAgICB0aGlzLm0wMCgpICogdGhpcy5tMTEoKSAqIHRoaXMubTIzKCkgKiB0aGlzLm0zMigpIC1cclxuICAgICAgICAgICB0aGlzLm0wMigpICogdGhpcy5tMTEoKSAqIHRoaXMubTIwKCkgKiB0aGlzLm0zMygpICtcclxuICAgICAgICAgICB0aGlzLm0wMSgpICogdGhpcy5tMTIoKSAqIHRoaXMubTIwKCkgKiB0aGlzLm0zMygpICtcclxuICAgICAgICAgICB0aGlzLm0wMigpICogdGhpcy5tMTAoKSAqIHRoaXMubTIxKCkgKiB0aGlzLm0zMygpIC1cclxuICAgICAgICAgICB0aGlzLm0wMCgpICogdGhpcy5tMTIoKSAqIHRoaXMubTIxKCkgKiB0aGlzLm0zMygpIC1cclxuICAgICAgICAgICB0aGlzLm0wMSgpICogdGhpcy5tMTAoKSAqIHRoaXMubTIyKCkgKiB0aGlzLm0zMygpICtcclxuICAgICAgICAgICB0aGlzLm0wMCgpICogdGhpcy5tMTEoKSAqIHRoaXMubTIyKCkgKiB0aGlzLm0zMygpO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGRldGVybWluYW50KCkgeyByZXR1cm4gdGhpcy5nZXREZXRlcm1pbmFudCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBzdHJpbmcgZm9ybSBvZiB0aGlzIG9iamVjdFxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICovXHJcbiAgdG9TdHJpbmcoKSB7XHJcbiAgICByZXR1cm4gYCR7dGhpcy5tMDAoKX0gJHt0aGlzLm0wMSgpfSAke3RoaXMubTAyKCl9ICR7dGhpcy5tMDMoKX1cXG4ke1xyXG4gICAgICB0aGlzLm0xMCgpfSAke3RoaXMubTExKCl9ICR7dGhpcy5tMTIoKX0gJHt0aGlzLm0xMygpfVxcbiR7XHJcbiAgICAgIHRoaXMubTIwKCl9ICR7dGhpcy5tMjEoKX0gJHt0aGlzLm0yMigpfSAke3RoaXMubTIzKCl9XFxuJHtcclxuICAgICAgdGhpcy5tMzAoKX0gJHt0aGlzLm0zMSgpfSAke3RoaXMubTMyKCl9ICR7dGhpcy5tMzMoKX1gO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFrZXMgdGhpcyBtYXRyaXggZWZmZWN0aXZlbHkgaW1tdXRhYmxlIHRvIHRoZSBub3JtYWwgbWV0aG9kcyAoZXhjZXB0IGRpcmVjdCBzZXR0ZXJzPylcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7TWF0cml4M30gLSBTZWxmIHJlZmVyZW5jZVxyXG4gICAqL1xyXG4gIG1ha2VJbW11dGFibGUoKSB7XHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgdGhpcy5yb3dNYWpvciA9ICgpID0+IHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdDYW5ub3QgbW9kaWZ5IGltbXV0YWJsZSBtYXRyaXgnICk7XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvcGllcyB0aGUgZW50cmllcyBvZiB0aGlzIG1hdHJpeCBvdmVyIHRvIGFuIGFyYml0cmFyeSBhcnJheSAodHlwZWQgb3Igbm9ybWFsKS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0FycmF5fEZsb2F0MzJBcnJheXxGbG9hdDY0QXJyYXl9IGFycmF5XHJcbiAgICogQHJldHVybnMge0FycmF5fEZsb2F0MzJBcnJheXxGbG9hdDY0QXJyYXl9IC0gUmV0dXJuZWQgZm9yIGNoYWluaW5nXHJcbiAgICovXHJcbiAgY29weVRvQXJyYXkoIGFycmF5ICkge1xyXG4gICAgYXJyYXlbIDAgXSA9IHRoaXMubTAwKCk7XHJcbiAgICBhcnJheVsgMSBdID0gdGhpcy5tMTAoKTtcclxuICAgIGFycmF5WyAyIF0gPSB0aGlzLm0yMCgpO1xyXG4gICAgYXJyYXlbIDMgXSA9IHRoaXMubTMwKCk7XHJcbiAgICBhcnJheVsgNCBdID0gdGhpcy5tMDEoKTtcclxuICAgIGFycmF5WyA1IF0gPSB0aGlzLm0xMSgpO1xyXG4gICAgYXJyYXlbIDYgXSA9IHRoaXMubTIxKCk7XHJcbiAgICBhcnJheVsgNyBdID0gdGhpcy5tMzEoKTtcclxuICAgIGFycmF5WyA4IF0gPSB0aGlzLm0wMigpO1xyXG4gICAgYXJyYXlbIDkgXSA9IHRoaXMubTEyKCk7XHJcbiAgICBhcnJheVsgMTAgXSA9IHRoaXMubTIyKCk7XHJcbiAgICBhcnJheVsgMTEgXSA9IHRoaXMubTMyKCk7XHJcbiAgICBhcnJheVsgMTIgXSA9IHRoaXMubTAzKCk7XHJcbiAgICBhcnJheVsgMTMgXSA9IHRoaXMubTEzKCk7XHJcbiAgICBhcnJheVsgMTQgXSA9IHRoaXMubTIzKCk7XHJcbiAgICBhcnJheVsgMTUgXSA9IHRoaXMubTMzKCk7XHJcbiAgICByZXR1cm4gYXJyYXk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGlkZW50aXR5IG1hdHJpeC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7TWF0cml4NH1cclxuICAgKi9cclxuICBzdGF0aWMgaWRlbnRpdHkoKSB7XHJcbiAgICByZXR1cm4gbmV3IE1hdHJpeDQoXHJcbiAgICAgIDEsIDAsIDAsIDAsXHJcbiAgICAgIDAsIDEsIDAsIDAsXHJcbiAgICAgIDAsIDAsIDEsIDAsXHJcbiAgICAgIDAsIDAsIDAsIDEsXHJcbiAgICAgIFR5cGVzLklERU5USVRZICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgdHJhbnNsYXRpb24gbWF0cml4LlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4XHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHlcclxuICAgKiBAcGFyYW0ge251bWJlcn0gelxyXG4gICAqIEByZXR1cm5zIHtNYXRyaXg0fVxyXG4gICAqL1xyXG4gIHN0YXRpYyB0cmFuc2xhdGlvbiggeCwgeSwgeiApIHtcclxuICAgIHJldHVybiBuZXcgTWF0cml4NChcclxuICAgICAgMSwgMCwgMCwgeCxcclxuICAgICAgMCwgMSwgMCwgeSxcclxuICAgICAgMCwgMCwgMSwgeixcclxuICAgICAgMCwgMCwgMCwgMSxcclxuICAgICAgVHlwZXMuVFJBTlNMQVRJT05fM0QgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB0cmFuc2xhdGlvbiBtYXRyaXggY29tcHV0ZWQgZnJvbSBhIHZlY3Rvci5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1ZlY3RvcjN8VmVjdG9yNH0gdmVjdG9yXHJcbiAgICogQHJldHVybnMge01hdHJpeDR9XHJcbiAgICovXHJcbiAgc3RhdGljIHRyYW5zbGF0aW9uRnJvbVZlY3RvciggdmVjdG9yICkge1xyXG4gICAgcmV0dXJuIE1hdHJpeDQudHJhbnNsYXRpb24oIHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBtYXRyaXggdGhhdCBzY2FsZXMgdGhpbmdzIGluIGVhY2ggZGltZW5zaW9uLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4XHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHlcclxuICAgKiBAcGFyYW0ge251bWJlcn0gelxyXG4gICAqIEByZXR1cm5zIHtNYXRyaXg0fVxyXG4gICAqL1xyXG4gIHN0YXRpYyBzY2FsaW5nKCB4LCB5LCB6ICkge1xyXG4gICAgLy8gYWxsb3cgdXNpbmcgb25lIHBhcmFtZXRlciB0byBzY2FsZSBldmVyeXRoaW5nXHJcbiAgICB5ID0geSA9PT0gdW5kZWZpbmVkID8geCA6IHk7XHJcbiAgICB6ID0geiA9PT0gdW5kZWZpbmVkID8geCA6IHo7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBNYXRyaXg0KFxyXG4gICAgICB4LCAwLCAwLCAwLFxyXG4gICAgICAwLCB5LCAwLCAwLFxyXG4gICAgICAwLCAwLCB6LCAwLFxyXG4gICAgICAwLCAwLCAwLCAxLFxyXG4gICAgICBUeXBlcy5TQ0FMSU5HICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgaG9tb2dlbmVvdXMgbWF0cml4IHJvdGF0aW9uIGRlZmluZWQgYnkgYSByb3RhdGlvbiBvZiB0aGUgc3BlY2lmaWVkIGFuZ2xlIGFyb3VuZCB0aGUgZ2l2ZW4gdW5pdCBheGlzLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VmVjdG9yM30gYXhpcyAtIG5vcm1hbGl6ZWRcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgLSBpbiByYWRpYW5zXHJcbiAgICogQHJldHVybnMge01hdHJpeDR9XHJcbiAgICovXHJcbiAgc3RhdGljIHJvdGF0aW9uQXhpc0FuZ2xlKCBheGlzLCBhbmdsZSApIHtcclxuICAgIGNvbnN0IGMgPSBNYXRoLmNvcyggYW5nbGUgKTtcclxuICAgIGNvbnN0IHMgPSBNYXRoLnNpbiggYW5nbGUgKTtcclxuICAgIGNvbnN0IEMgPSAxIC0gYztcclxuXHJcbiAgICByZXR1cm4gbmV3IE1hdHJpeDQoXHJcbiAgICAgIGF4aXMueCAqIGF4aXMueCAqIEMgKyBjLCBheGlzLnggKiBheGlzLnkgKiBDIC0gYXhpcy56ICogcywgYXhpcy54ICogYXhpcy56ICogQyArIGF4aXMueSAqIHMsIDAsXHJcbiAgICAgIGF4aXMueSAqIGF4aXMueCAqIEMgKyBheGlzLnogKiBzLCBheGlzLnkgKiBheGlzLnkgKiBDICsgYywgYXhpcy55ICogYXhpcy56ICogQyAtIGF4aXMueCAqIHMsIDAsXHJcbiAgICAgIGF4aXMueiAqIGF4aXMueCAqIEMgLSBheGlzLnkgKiBzLCBheGlzLnogKiBheGlzLnkgKiBDICsgYXhpcy54ICogcywgYXhpcy56ICogYXhpcy56ICogQyArIGMsIDAsXHJcbiAgICAgIDAsIDAsIDAsIDEsXHJcbiAgICAgIFR5cGVzLkFGRklORSApO1xyXG4gIH1cclxuXHJcbiAgLy8gVE9ETzogYWRkIGluIHJvdGF0aW9uIGZyb20gcXVhdGVybmlvbiwgYW5kIGZyb20gcXVhdCArIHRyYW5zbGF0aW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9kb3QvaXNzdWVzLzk2XHJcblxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgcm90YXRpb24gbWF0cml4IGluIHRoZSB5eiBwbGFuZS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgLSBpbiByYWRpYW5zXHJcbiAgICogQHJldHVybnMge01hdHJpeDR9XHJcbiAgICovXHJcbiAgc3RhdGljIHJvdGF0aW9uWCggYW5nbGUgKSB7XHJcbiAgICBjb25zdCBjID0gTWF0aC5jb3MoIGFuZ2xlICk7XHJcbiAgICBjb25zdCBzID0gTWF0aC5zaW4oIGFuZ2xlICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBNYXRyaXg0KFxyXG4gICAgICAxLCAwLCAwLCAwLFxyXG4gICAgICAwLCBjLCAtcywgMCxcclxuICAgICAgMCwgcywgYywgMCxcclxuICAgICAgMCwgMCwgMCwgMSxcclxuICAgICAgVHlwZXMuQUZGSU5FICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgcm90YXRpb24gbWF0cml4IGluIHRoZSB4eiBwbGFuZS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgLSBpbiByYWRpYW5zXHJcbiAgICogQHJldHVybnMge01hdHJpeDR9XHJcbiAgICovXHJcbiAgc3RhdGljIHJvdGF0aW9uWSggYW5nbGUgKSB7XHJcbiAgICBjb25zdCBjID0gTWF0aC5jb3MoIGFuZ2xlICk7XHJcbiAgICBjb25zdCBzID0gTWF0aC5zaW4oIGFuZ2xlICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBNYXRyaXg0KFxyXG4gICAgICBjLCAwLCBzLCAwLFxyXG4gICAgICAwLCAxLCAwLCAwLFxyXG4gICAgICAtcywgMCwgYywgMCxcclxuICAgICAgMCwgMCwgMCwgMSxcclxuICAgICAgVHlwZXMuQUZGSU5FICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgcm90YXRpb24gbWF0cml4IGluIHRoZSB4eSBwbGFuZS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgLSBpbiByYWRpYW5zXHJcbiAgICogQHJldHVybnMge01hdHJpeDR9XHJcbiAgICovXHJcbiAgc3RhdGljIHJvdGF0aW9uWiggYW5nbGUgKSB7XHJcbiAgICBjb25zdCBjID0gTWF0aC5jb3MoIGFuZ2xlICk7XHJcbiAgICBjb25zdCBzID0gTWF0aC5zaW4oIGFuZ2xlICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBNYXRyaXg0KFxyXG4gICAgICBjLCAtcywgMCwgMCxcclxuICAgICAgcywgYywgMCwgMCxcclxuICAgICAgMCwgMCwgMSwgMCxcclxuICAgICAgMCwgMCwgMCwgMSxcclxuICAgICAgVHlwZXMuQUZGSU5FICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBzcGVjaWZpYyBwZXJzcGVjdGl2ZSBtYXRyaXggbmVlZGVkIGZvciBjZXJ0YWluIFdlYkdMIGNvbnRleHRzLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBmb3ZZUmFkaWFuc1xyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhc3BlY3QgLSBhc3BlY3QgPT09IHdpZHRoIC8gaGVpZ2h0XHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHpOZWFyXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHpGYXJcclxuICAgKiBAcmV0dXJucyB7TWF0cml4NH1cclxuICAgKi9cclxuICBzdGF0aWMgZ2x1UGVyc3BlY3RpdmUoIGZvdllSYWRpYW5zLCBhc3BlY3QsIHpOZWFyLCB6RmFyICkge1xyXG4gICAgY29uc3QgY290YW5nZW50ID0gTWF0aC5jb3MoIGZvdllSYWRpYW5zICkgLyBNYXRoLnNpbiggZm92WVJhZGlhbnMgKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IE1hdHJpeDQoXHJcbiAgICAgIGNvdGFuZ2VudCAvIGFzcGVjdCwgMCwgMCwgMCxcclxuICAgICAgMCwgY290YW5nZW50LCAwLCAwLFxyXG4gICAgICAwLCAwLCAoIHpGYXIgKyB6TmVhciApIC8gKCB6TmVhciAtIHpGYXIgKSwgKCAyICogekZhciAqIHpOZWFyICkgLyAoIHpOZWFyIC0gekZhciApLFxyXG4gICAgICAwLCAwLCAtMSwgMCApO1xyXG4gIH1cclxufVxyXG5cclxuZG90LnJlZ2lzdGVyKCAnTWF0cml4NCcsIE1hdHJpeDQgKTtcclxuXHJcbmNsYXNzIFR5cGVzIGV4dGVuZHMgRW51bWVyYXRpb25WYWx1ZSB7XHJcbiAgICBzdGF0aWMgT1RIRVIgPSBuZXcgVHlwZXMoKTtcclxuICAgIHN0YXRpYyBJREVOVElUWSA9IG5ldyBUeXBlcygpO1xyXG4gICAgc3RhdGljIFRSQU5TTEFUSU9OXzNEID0gbmV3IFR5cGVzKCk7XHJcbiAgICBzdGF0aWMgU0NBTElORyA9IG5ldyBUeXBlcygpO1xyXG4gICAgc3RhdGljIEFGRklORSA9IG5ldyBUeXBlcygpO1xyXG4gICAgc3RhdGljIGVudW1lcmF0aW9uID0gbmV3IEVudW1lcmF0aW9uKCBUeXBlcyApO1xyXG59XHJcblxyXG4vLyBAcHVibGljIHtFbnVtZXJhdGlvbn1cclxuTWF0cml4NC5UeXBlcyA9IFR5cGVzO1xyXG5cclxuLy8gQHB1YmxpYyB7TWF0cml4NH1cclxuTWF0cml4NC5JREVOVElUWSA9IG5ldyBNYXRyaXg0KCkubWFrZUltbXV0YWJsZSgpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgTWF0cml4NDsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsT0FBT0EsV0FBVyxNQUFNLG1DQUFtQztBQUMzRCxPQUFPQyxnQkFBZ0IsTUFBTSx3Q0FBd0M7QUFDckUsT0FBT0MsR0FBRyxNQUFNLFVBQVU7QUFDMUIsT0FBT0MsT0FBTyxNQUFNLGNBQWM7QUFDbEMsT0FBT0MsT0FBTyxNQUFNLGNBQWM7QUFFbEMsTUFBTUMsWUFBWSxHQUFHQyxNQUFNLENBQUNELFlBQVksSUFBSUUsS0FBSztBQUVqRCxNQUFNQyxPQUFPLENBQUM7RUFDWjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxXQUFXQSxDQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLElBQUksRUFBRztJQUVsRztJQUNBLElBQUksQ0FBQ0MsT0FBTyxHQUFHLElBQUl0QixZQUFZLENBQUUsRUFBRyxDQUFDOztJQUVyQztJQUNBLElBQUksQ0FBQ3FCLElBQUksR0FBR0UsS0FBSyxDQUFDQyxLQUFLLENBQUMsQ0FBQzs7SUFFekIsSUFBSSxDQUFDQyxRQUFRLENBQ1hwQixHQUFHLEtBQUtxQixTQUFTLEdBQUdyQixHQUFHLEdBQUcsQ0FBQyxFQUFFQyxHQUFHLEtBQUtvQixTQUFTLEdBQUdwQixHQUFHLEdBQUcsQ0FBQyxFQUFFQyxHQUFHLEtBQUttQixTQUFTLEdBQUduQixHQUFHLEdBQUcsQ0FBQyxFQUFFQyxHQUFHLEtBQUtrQixTQUFTLEdBQUdsQixHQUFHLEdBQUcsQ0FBQyxFQUNsSEMsR0FBRyxLQUFLaUIsU0FBUyxHQUFHakIsR0FBRyxHQUFHLENBQUMsRUFBRUMsR0FBRyxLQUFLZ0IsU0FBUyxHQUFHaEIsR0FBRyxHQUFHLENBQUMsRUFBRUMsR0FBRyxLQUFLZSxTQUFTLEdBQUdmLEdBQUcsR0FBRyxDQUFDLEVBQUVDLEdBQUcsS0FBS2MsU0FBUyxHQUFHZCxHQUFHLEdBQUcsQ0FBQyxFQUNsSEMsR0FBRyxLQUFLYSxTQUFTLEdBQUdiLEdBQUcsR0FBRyxDQUFDLEVBQUVDLEdBQUcsS0FBS1ksU0FBUyxHQUFHWixHQUFHLEdBQUcsQ0FBQyxFQUFFQyxHQUFHLEtBQUtXLFNBQVMsR0FBR1gsR0FBRyxHQUFHLENBQUMsRUFBRUMsR0FBRyxLQUFLVSxTQUFTLEdBQUdWLEdBQUcsR0FBRyxDQUFDLEVBQ2xIQyxHQUFHLEtBQUtTLFNBQVMsR0FBR1QsR0FBRyxHQUFHLENBQUMsRUFBRUMsR0FBRyxLQUFLUSxTQUFTLEdBQUdSLEdBQUcsR0FBRyxDQUFDLEVBQUVDLEdBQUcsS0FBS08sU0FBUyxHQUFHUCxHQUFHLEdBQUcsQ0FBQyxFQUFFQyxHQUFHLEtBQUtNLFNBQVMsR0FBR04sR0FBRyxHQUFHLENBQUMsRUFDbEhDLElBQUssQ0FBQztFQUNWOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRUksUUFBUUEsQ0FBRXBCLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsSUFBSSxFQUFHO0lBQy9GLElBQUksQ0FBQ0MsT0FBTyxDQUFFLENBQUMsQ0FBRSxHQUFHakIsR0FBRztJQUN2QixJQUFJLENBQUNpQixPQUFPLENBQUUsQ0FBQyxDQUFFLEdBQUdiLEdBQUc7SUFDdkIsSUFBSSxDQUFDYSxPQUFPLENBQUUsQ0FBQyxDQUFFLEdBQUdULEdBQUc7SUFDdkIsSUFBSSxDQUFDUyxPQUFPLENBQUUsQ0FBQyxDQUFFLEdBQUdMLEdBQUc7SUFDdkIsSUFBSSxDQUFDSyxPQUFPLENBQUUsQ0FBQyxDQUFFLEdBQUdoQixHQUFHO0lBQ3ZCLElBQUksQ0FBQ2dCLE9BQU8sQ0FBRSxDQUFDLENBQUUsR0FBR1osR0FBRztJQUN2QixJQUFJLENBQUNZLE9BQU8sQ0FBRSxDQUFDLENBQUUsR0FBR1IsR0FBRztJQUN2QixJQUFJLENBQUNRLE9BQU8sQ0FBRSxDQUFDLENBQUUsR0FBR0osR0FBRztJQUN2QixJQUFJLENBQUNJLE9BQU8sQ0FBRSxDQUFDLENBQUUsR0FBR2YsR0FBRztJQUN2QixJQUFJLENBQUNlLE9BQU8sQ0FBRSxDQUFDLENBQUUsR0FBR1gsR0FBRztJQUN2QixJQUFJLENBQUNXLE9BQU8sQ0FBRSxFQUFFLENBQUUsR0FBR1AsR0FBRztJQUN4QixJQUFJLENBQUNPLE9BQU8sQ0FBRSxFQUFFLENBQUUsR0FBR0gsR0FBRztJQUN4QixJQUFJLENBQUNHLE9BQU8sQ0FBRSxFQUFFLENBQUUsR0FBR2QsR0FBRztJQUN4QixJQUFJLENBQUNjLE9BQU8sQ0FBRSxFQUFFLENBQUUsR0FBR1YsR0FBRztJQUN4QixJQUFJLENBQUNVLE9BQU8sQ0FBRSxFQUFFLENBQUUsR0FBR04sR0FBRztJQUN4QixJQUFJLENBQUNNLE9BQU8sQ0FBRSxFQUFFLENBQUUsR0FBR0YsR0FBRzs7SUFFeEI7SUFDQSxJQUFJLENBQUNDLElBQUksR0FBR0EsSUFBSSxLQUFLSyxTQUFTLEdBQU9ULEdBQUcsS0FBSyxDQUFDLElBQUlDLEdBQUcsS0FBSyxDQUFDLElBQUlDLEdBQUcsS0FBSyxDQUFDLElBQUlDLEdBQUcsS0FBSyxDQUFDLEdBQUtHLEtBQUssQ0FBQ0ksTUFBTSxHQUFHSixLQUFLLENBQUNDLEtBQUssR0FBS0gsSUFBSTtJQUM3SCxPQUFPLElBQUk7RUFDYjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VPLFdBQVdBLENBQUV2QixHQUFHLEVBQUVJLEdBQUcsRUFBRUksR0FBRyxFQUFFSSxHQUFHLEVBQUVYLEdBQUcsRUFBRUksR0FBRyxFQUFFSSxHQUFHLEVBQUVJLEdBQUcsRUFBRVgsR0FBRyxFQUFFSSxHQUFHLEVBQUVJLEdBQUcsRUFBRUksR0FBRyxFQUFFWCxHQUFHLEVBQUVJLEdBQUcsRUFBRUksR0FBRyxFQUFFSSxHQUFHLEVBQUVDLElBQUksRUFBRztJQUNsRyxPQUFPLElBQUksQ0FBQ0ksUUFBUSxDQUFFcEIsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxJQUFLLENBQUM7RUFDOUc7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRVEsR0FBR0EsQ0FBRUMsTUFBTSxFQUFHO0lBQ1osT0FBTyxJQUFJLENBQUNMLFFBQVEsQ0FDbEJLLE1BQU0sQ0FBQ0MsR0FBRyxDQUFDLENBQUMsRUFBRUQsTUFBTSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxFQUFFRixNQUFNLENBQUNHLEdBQUcsQ0FBQyxDQUFDLEVBQUVILE1BQU0sQ0FBQ0ksR0FBRyxDQUFDLENBQUMsRUFDdERKLE1BQU0sQ0FBQ0ssR0FBRyxDQUFDLENBQUMsRUFBRUwsTUFBTSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxFQUFFTixNQUFNLENBQUNPLEdBQUcsQ0FBQyxDQUFDLEVBQUVQLE1BQU0sQ0FBQ1EsR0FBRyxDQUFDLENBQUMsRUFDdERSLE1BQU0sQ0FBQ1MsR0FBRyxDQUFDLENBQUMsRUFBRVQsTUFBTSxDQUFDVSxHQUFHLENBQUMsQ0FBQyxFQUFFVixNQUFNLENBQUNXLEdBQUcsQ0FBQyxDQUFDLEVBQUVYLE1BQU0sQ0FBQ1ksR0FBRyxDQUFDLENBQUMsRUFDdERaLE1BQU0sQ0FBQ2EsR0FBRyxDQUFDLENBQUMsRUFBRWIsTUFBTSxDQUFDYyxHQUFHLENBQUMsQ0FBQyxFQUFFZCxNQUFNLENBQUNlLEdBQUcsQ0FBQyxDQUFDLEVBQUVmLE1BQU0sQ0FBQ2dCLEdBQUcsQ0FBQyxDQUFDLEVBQ3REaEIsTUFBTSxDQUFDVCxJQUFLLENBQUM7RUFDakI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VVLEdBQUdBLENBQUEsRUFBRztJQUNKLE9BQU8sSUFBSSxDQUFDVCxPQUFPLENBQUUsQ0FBQyxDQUFFO0VBQzFCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFVSxHQUFHQSxDQUFBLEVBQUc7SUFDSixPQUFPLElBQUksQ0FBQ1YsT0FBTyxDQUFFLENBQUMsQ0FBRTtFQUMxQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRVcsR0FBR0EsQ0FBQSxFQUFHO0lBQ0osT0FBTyxJQUFJLENBQUNYLE9BQU8sQ0FBRSxDQUFDLENBQUU7RUFDMUI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VZLEdBQUdBLENBQUEsRUFBRztJQUNKLE9BQU8sSUFBSSxDQUFDWixPQUFPLENBQUUsRUFBRSxDQUFFO0VBQzNCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFYSxHQUFHQSxDQUFBLEVBQUc7SUFDSixPQUFPLElBQUksQ0FBQ2IsT0FBTyxDQUFFLENBQUMsQ0FBRTtFQUMxQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRWMsR0FBR0EsQ0FBQSxFQUFHO0lBQ0osT0FBTyxJQUFJLENBQUNkLE9BQU8sQ0FBRSxDQUFDLENBQUU7RUFDMUI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VlLEdBQUdBLENBQUEsRUFBRztJQUNKLE9BQU8sSUFBSSxDQUFDZixPQUFPLENBQUUsQ0FBQyxDQUFFO0VBQzFCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFZ0IsR0FBR0EsQ0FBQSxFQUFHO0lBQ0osT0FBTyxJQUFJLENBQUNoQixPQUFPLENBQUUsRUFBRSxDQUFFO0VBQzNCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFaUIsR0FBR0EsQ0FBQSxFQUFHO0lBQ0osT0FBTyxJQUFJLENBQUNqQixPQUFPLENBQUUsQ0FBQyxDQUFFO0VBQzFCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFa0IsR0FBR0EsQ0FBQSxFQUFHO0lBQ0osT0FBTyxJQUFJLENBQUNsQixPQUFPLENBQUUsQ0FBQyxDQUFFO0VBQzFCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFbUIsR0FBR0EsQ0FBQSxFQUFHO0lBQ0osT0FBTyxJQUFJLENBQUNuQixPQUFPLENBQUUsRUFBRSxDQUFFO0VBQzNCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFb0IsR0FBR0EsQ0FBQSxFQUFHO0lBQ0osT0FBTyxJQUFJLENBQUNwQixPQUFPLENBQUUsRUFBRSxDQUFFO0VBQzNCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFcUIsR0FBR0EsQ0FBQSxFQUFHO0lBQ0osT0FBTyxJQUFJLENBQUNyQixPQUFPLENBQUUsQ0FBQyxDQUFFO0VBQzFCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFc0IsR0FBR0EsQ0FBQSxFQUFHO0lBQ0osT0FBTyxJQUFJLENBQUN0QixPQUFPLENBQUUsQ0FBQyxDQUFFO0VBQzFCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFdUIsR0FBR0EsQ0FBQSxFQUFHO0lBQ0osT0FBTyxJQUFJLENBQUN2QixPQUFPLENBQUUsRUFBRSxDQUFFO0VBQzNCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFd0IsR0FBR0EsQ0FBQSxFQUFHO0lBQ0osT0FBTyxJQUFJLENBQUN4QixPQUFPLENBQUUsRUFBRSxDQUFFO0VBQzNCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFeUIsUUFBUUEsQ0FBQSxFQUFHO0lBQ1QsT0FBT0EsUUFBUSxDQUFFLElBQUksQ0FBQ2hCLEdBQUcsQ0FBQyxDQUFFLENBQUMsSUFDdEJnQixRQUFRLENBQUUsSUFBSSxDQUFDZixHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCZSxRQUFRLENBQUUsSUFBSSxDQUFDZCxHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCYyxRQUFRLENBQUUsSUFBSSxDQUFDYixHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCYSxRQUFRLENBQUUsSUFBSSxDQUFDWixHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCWSxRQUFRLENBQUUsSUFBSSxDQUFDWCxHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCVyxRQUFRLENBQUUsSUFBSSxDQUFDVixHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCVSxRQUFRLENBQUUsSUFBSSxDQUFDVCxHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCUyxRQUFRLENBQUUsSUFBSSxDQUFDUixHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCUSxRQUFRLENBQUUsSUFBSSxDQUFDUCxHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCTyxRQUFRLENBQUUsSUFBSSxDQUFDTixHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCTSxRQUFRLENBQUUsSUFBSSxDQUFDTCxHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCSyxRQUFRLENBQUUsSUFBSSxDQUFDSixHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCSSxRQUFRLENBQUUsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCRyxRQUFRLENBQUUsSUFBSSxDQUFDRixHQUFHLENBQUMsQ0FBRSxDQUFDLElBQ3RCRSxRQUFRLENBQUUsSUFBSSxDQUFDRCxHQUFHLENBQUMsQ0FBRSxDQUFDO0VBQy9COztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFRSxjQUFjQSxDQUFBLEVBQUc7SUFDZixPQUFPLElBQUlsRCxPQUFPLENBQUUsSUFBSSxDQUFDb0MsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUNJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDSSxHQUFHLENBQUMsQ0FBRSxDQUFDO0VBQzFEO0VBRUEsSUFBSU8sV0FBV0EsQ0FBQSxFQUFHO0lBQUUsT0FBTyxJQUFJLENBQUNELGNBQWMsQ0FBQyxDQUFDO0VBQUU7O0VBRWxEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VFLGNBQWNBLENBQUEsRUFBRztJQUNmLE1BQU1DLEtBQUssR0FBRyxJQUFJLENBQUNwQixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0csR0FBRyxDQUFDLENBQUM7SUFDckMsTUFBTWtCLEtBQUssR0FBRyxJQUFJLENBQUNqQixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0csR0FBRyxDQUFDLENBQUM7SUFDckMsTUFBTWUsS0FBSyxHQUFHLElBQUksQ0FBQ2QsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNHLEdBQUcsQ0FBQyxDQUFDO0lBQ3JDLE1BQU1ZLEtBQUssR0FBRyxJQUFJLENBQUNYLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRyxHQUFHLENBQUMsQ0FBQztJQUNyQyxNQUFNUyxLQUFLLEdBQUcsSUFBSSxDQUFDdkIsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNFLEdBQUcsQ0FBQyxDQUFDO0lBQ3JDLE1BQU1zQixLQUFLLEdBQUcsSUFBSSxDQUFDcEIsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNFLEdBQUcsQ0FBQyxDQUFDO0lBQ3JDLE1BQU1tQixLQUFLLEdBQUcsSUFBSSxDQUFDakIsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNFLEdBQUcsQ0FBQyxDQUFDO0lBQ3JDLE1BQU1nQixLQUFLLEdBQUcsSUFBSSxDQUFDZCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0UsR0FBRyxDQUFDLENBQUM7SUFDckMsTUFBTWEsS0FBSyxHQUFHLElBQUksQ0FBQzFCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQztJQUNyQyxNQUFNMEIsS0FBSyxHQUFHLElBQUksQ0FBQ3ZCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQztJQUNyQyxNQUFNdUIsS0FBSyxHQUFHLElBQUksQ0FBQ3BCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQztJQUNyQyxNQUFNb0IsS0FBSyxHQUFHLElBQUksQ0FBQ2pCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQztJQUNyQyxPQUFPLElBQUloRCxPQUFPLENBQ2hCaUUsSUFBSSxDQUFDQyxJQUFJLENBQUViLEtBQUssR0FBR0EsS0FBSyxHQUFHQyxLQUFLLEdBQUdBLEtBQUssR0FBR0MsS0FBSyxHQUFHQSxLQUFLLEdBQUdDLEtBQUssR0FBR0EsS0FBTSxDQUFDLEVBQzFFUyxJQUFJLENBQUNDLElBQUksQ0FBRVQsS0FBSyxHQUFHQSxLQUFLLEdBQUdDLEtBQUssR0FBR0EsS0FBSyxHQUFHQyxLQUFLLEdBQUdBLEtBQUssR0FBR0MsS0FBSyxHQUFHQSxLQUFNLENBQUMsRUFDMUVLLElBQUksQ0FBQ0MsSUFBSSxDQUFFTCxLQUFLLEdBQUdBLEtBQUssR0FBR0MsS0FBSyxHQUFHQSxLQUFLLEdBQUdDLEtBQUssR0FBR0EsS0FBSyxHQUFHQyxLQUFLLEdBQUdBLEtBQU0sQ0FBRSxDQUFDO0VBQ2hGO0VBRUEsSUFBSUcsV0FBV0EsQ0FBQSxFQUFHO0lBQUUsT0FBTyxJQUFJLENBQUNmLGNBQWMsQ0FBQyxDQUFDO0VBQUU7O0VBRWxEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFZ0IsZUFBZUEsQ0FBQSxFQUFHO0lBQ2hCOztJQUVBO0lBQ0E7SUFDQSxPQUFRLFlBQ04sSUFBSSxDQUFDNUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDNkMsT0FBTyxDQUFFLEVBQUcsQ0FBRSxJQUNoQyxJQUFJLENBQUM3QyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUM2QyxPQUFPLENBQUUsRUFBRyxDQUFFLElBQ2hDLElBQUksQ0FBQzdDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQzZDLE9BQU8sQ0FBRSxFQUFHLENBQUUsSUFDaEMsSUFBSSxDQUFDN0MsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDNkMsT0FBTyxDQUFFLEVBQUcsQ0FBRSxJQUNoQyxJQUFJLENBQUM3QyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUM2QyxPQUFPLENBQUUsRUFBRyxDQUFFLElBQ2hDLElBQUksQ0FBQzdDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQzZDLE9BQU8sQ0FBRSxFQUFHLENBQUUsSUFDaEMsSUFBSSxDQUFDN0MsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDNkMsT0FBTyxDQUFFLEVBQUcsQ0FBRSxJQUNoQyxJQUFJLENBQUM3QyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUM2QyxPQUFPLENBQUUsRUFBRyxDQUFFLElBQ2hDLElBQUksQ0FBQzdDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQzZDLE9BQU8sQ0FBRSxFQUFHLENBQUUsSUFDaEMsSUFBSSxDQUFDN0MsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDNkMsT0FBTyxDQUFFLEVBQUcsQ0FBRSxJQUNoQyxJQUFJLENBQUM3QyxPQUFPLENBQUUsRUFBRSxDQUFFLENBQUM2QyxPQUFPLENBQUUsRUFBRyxDQUFFLElBQ2pDLElBQUksQ0FBQzdDLE9BQU8sQ0FBRSxFQUFFLENBQUUsQ0FBQzZDLE9BQU8sQ0FBRSxFQUFHLENBQUUsSUFDakMsSUFBSSxDQUFDN0MsT0FBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDNkMsT0FBTyxDQUFFLEVBQUcsQ0FBRSxJQUNqQyxJQUFJLENBQUM3QyxPQUFPLENBQUUsRUFBRSxDQUFFLENBQUM2QyxPQUFPLENBQUUsRUFBRyxDQUFFLElBQ2pDLElBQUksQ0FBQzdDLE9BQU8s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QUssQ0FBQyxFQUFHO1VBQ2YsT0FBTyxJQUFJNUUsT0FBTyxDQUNoQixDQUFFLENBQUMsSUFBSSxDQUFDeUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNILEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0UsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ00sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNQLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ04sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNTLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0YsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNILEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1YsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxJQUFLaUMsR0FBRyxFQUNsUCxDQUFFLElBQUksQ0FBQ25DLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDWCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNWLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDYSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNGLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ2EsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNkLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsSUFBS2lDLEdBQUcsRUFDalAsQ0FBRSxDQUFDLElBQUksQ0FBQ25DLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDWCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNOLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDYSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNGLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ2EsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNkLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1MsR0FBRyxDQUFDLENBQUMsSUFBS2lDLEdBQUcsRUFDbFAsQ0FBRSxJQUFJLENBQUN2QyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNILEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNQLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNILEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNTLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDVixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLElBQUtxQyxHQUFHLEVBQ2pQLENBQUUsSUFBSSxDQUFDcEMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNGLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNOLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNGLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxJQUFLaUMsR0FBRyxFQUNqUCxDQUFFLENBQUMsSUFBSSxDQUFDcEMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNGLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDWCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNWLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNjLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNOLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDYSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ2YsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxJQUFLaUMsR0FBRyxFQUNsUCxDQUFFLElBQUksQ0FBQ3BDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDVSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNTLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDVixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNQLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDYyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNILEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ2EsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNmLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1MsR0FBRyxDQUFDLENBQUMsSUFBS2lDLEdBQUcsRUFDalAsQ0FBRSxDQUFDLElBQUksQ0FBQ3hDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNQLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDVSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNILEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNYLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsSUFBS3FDLEdBQUcsRUFDbFAsQ0FBRSxDQUFDLElBQUksQ0FBQ3BDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0YsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ04sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ00sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNQLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0YsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNILEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1UsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNYLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ00sR0FBRyxDQUFDLENBQUMsSUFBS2lDLEdBQUcsRUFDbFAsQ0FBRSxJQUFJLENBQUNwQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNOLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNWLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDWCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ2EsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNGLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNjLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDZixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLElBQUtpQyxHQUFHLEVBQ2pQLENBQUUsQ0FBQyxJQUFJLENBQUNwQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNGLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNWLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ2EsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNOLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNjLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDZixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNVLEdBQUcsQ0FBQyxDQUFDLElBQUtpQyxHQUFHLEVBQ2xQLENBQUUsSUFBSSxDQUFDeEMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNILEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNQLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNTLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNILEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDVSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxJQUFLcUMsR0FBRyxFQUNqUCxDQUFFLElBQUksQ0FBQ3BDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNOLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNGLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNWLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsSUFBS2tDLEdBQUcsRUFDalAsQ0FBRSxDQUFDLElBQUksQ0FBQ3BDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDWCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNWLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDYSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNGLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ2EsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNkLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsSUFBS2tDLEdBQUcsRUFDbFAsQ0FBRSxJQUFJLENBQUNwQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNILEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNYLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDVSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ2EsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNQLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNhLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDZCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNTLEdBQUcsQ0FBQyxDQUFDLElBQUtrQyxHQUFHLEVBQ2pQLENBQUUsQ0FBQyxJQUFJLENBQUN4QyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNILEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNQLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNL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LEdBQUcsQ0FBQyxDQUFDLEdBQUdELE1BQU0sQ0FBQ0MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLEdBQUdGLE1BQU0sQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNGLEdBQUcsQ0FBQyxDQUFDLEdBQUdILE1BQU0sQ0FBQ1MsR0FBRyxDQUFDLENBQUMsRUFDakYsSUFBSSxDQUFDUixHQUFHLENBQUMsQ0FBQyxHQUFHRCxNQUFNLENBQUNFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDQSxHQUFHLENBQUMsQ0FBQyxHQUFHRixNQUFNLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHSCxNQUFNLENBQUNVLEdBQUcsQ0FBQyxDQUFDLEVBQ2pGLElBQUksQ0FBQ1QsR0FBRyxDQUFDLENBQUMsR0FBR0QsTUFBTSxDQUFDRyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0QsR0FBRyxDQUFDLENBQUMsR0FBR0YsTUFBTSxDQUFDTyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0osR0FBRyxDQUFDLENBQUMsR0FBR0gsTUFBTSxDQUFDVyxHQUFHLENBQUMsQ0FBQyxFQUNqRixJQUFJLENBQUNWLEdBQUcsQ0FBQyxDQUFDLEdBQUdELE1BQU0sQ0FBQ0ksR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNGLEdBQUcsQ0FBQyxDQUFDLEdBQUdGLE1BQU0sQ0FBQ1EsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNMLEdBQUcsQ0FBQyxDQUFDLEdBQUdILE1BQU0sQ0FBQ1ksR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNSLEdBQUcsQ0FBQyxDQUFDLEVBQzlGLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUMsR0FBR0wsTUFBTSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBR04sTUFBTSxDQUFDSyxHQUFHLENBQUMsQ0FB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LEdBQUcsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUFHUCxNQUFNLENBQUNTLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRCxHQUFHLENBQUMsQ0FBQyxHQUFHUixNQUFNLENBQUNhLEdBQUcsQ0FBQyxDQUFDLEVBQzdHLElBQUksQ0FBQ1IsR0FBRyxDQUFDLENBQUMsR0FBR0wsTUFBTSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ksR0FBRyxDQUFDLENBQUMsR0FBR04sTUFBTSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUMsR0FBR1AsTUFBTSxDQUFDVSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0YsR0FBRyxDQUFDLENBQUMsR0FBR1IsTUFBTSxDQUFDYyxHQUFHLENBQUMsQ0FBQyxFQUM3RyxJQUFJLENBQUNULEdBQUcsQ0FBQyxDQUFDLEdBQUdMLE1BQU0sQ0FBQ0csR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNHLEdBQUcsQ0FBQyxDQUFDLEdBQUdOLE1BQU0sQ0FBQ08sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNBLEdBQUcsQ0FBQyxDQUFDLEdBQUdQLE1BQU0sQ0FBQ1csR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNILEdBQUcsQ0FBQyxDQUFDLEdBQUdSLE1BQU0sQ0FBQ2UsR0FBRyxDQUFDLENBQUMsRUFDN0csSUFBSSxDQUFDVixHQUFHLENBQUMsQ0FBQyxHQUFHTCxNQUFNLENBQUNJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUFHTixNQUFNLENBQUNRLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRCxHQUFHLENBQUMsQ0FBQyxHQUFHUCxNQUFNLENBQUNZLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSixHQUFHLENBQUMsQ0FBQyxHQUFHUixNQUFNLENBQUNnQixHQUFHLENBQUMsQ0FBQyxFQUM3RyxJQUFJLENBQUNQLEdBQUcsQ0FBQyxDQUFDLEdBQUdULE1BQU0sQ0FBQ0MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNTLEdBQUcsQ0FBQyxDQUFDLEdBQUdWLE1BQU0sQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUdYLE1BQU0sQ0FBQ1MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNHLEdBQUcsQ0FBQyxDQUFDLEdBQUdaLE1BQU0sQ0FBQ2EsR0FBRyxDQUFDLENBQUMsRUFDN0csSUFBSSxDQUFDSixHQUFHLENBQUMsQ0FBQyxHQUFHVCxNQUFNLENBQUNFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDUSxHQUFHLENBQUMsQ0FBQyxHQUFHVixNQUFNLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxHQUFHWCxNQUFNLENBQUNVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUFHWixNQUFNLENBQUNjLEdBQUcsQ0FBQyxDQUFDLEVBQzdHLElBQUksQ0FBQ0wsR0FBRyxDQUFDLENBQUMsR0FBR1QsTUFBTSxDQUFDRyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ08sR0FBRyxDQUFDLENBQUMsR0FBR1YsTUFBTSxDQUFDTyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ksR0FBRyxDQUFDLENBQUMsR0FBR1gsTUFBTSxDQUFDVyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUMsR0FBR1osTUFBTSxDQUFDZSxHQUFHLENBQUMsQ0FBQyxFQUM3RyxJQUFJLENBQUNOLEdBQUcsQ0FBQyxDQUFDLEdBQUdULE1BQU0sQ0FBQ0ksR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUdWLE1BQU0sQ0FBQ1EsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNHLEdBQUcsQ0FBQyxD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LElBQUksQ0FBQ1YsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0csR0FBRyxDQUFDLENBQUMsR0FDakQsSUFBSSxDQUFDVCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0UsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUNqRCxJQUFJLENBQUNYLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0csR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNFLEdBQUcsQ0FBQyxDQUFDLEdBQ2pELElBQUksQ0FBQ1YsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUMsR0FDakQsSUFBSSxDQUFDWCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxHQUNqRCxJQUFJLENBQUNULEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0UsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQ2pELElBQUksQ0FBQ1gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FDakQsSUFBSSxDQUFDVixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRyxHQUFHLENBQUMsQ0FBQyxHQUNqRCxJQUFJLENBQUNiLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0csR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNHLEdBQUcsQ0FBQyxDQUFDLEdBQ2pELElBQUksQ0FBQ1gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0UsR0FBRyxDQUFDLENBQUMsR0FDakQsSUFBSSxDQUFDYixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ00sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUNqRCxJQUFJLENBQUNWLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0csR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQ2pELElBQUksQ0FBQ2IsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ00sR0FBRyxDQUFDLENBQUMsR0FDakQsSUFBSSxDQUFDWCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQyxHQUNqRCxJQUFJLENBQUNkLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0UsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQ2pELElBQUksQ0FBQ2IsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0csR0FBRyxDQUFDLENBQUMsR0FDakQsSUFBSSxDQUFDZCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRyxHQUFHLENBQUMsQ0FBQyxHQUNqRCxJQUFJLENBQUNaLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0csR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNPLEdBQUcsQ0FBQyxDQUFDLEdBQ2pELElBQUksQ0FBQ2QsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ08sR0FBRyxDQUFDLENBQUMsR0FDakQsSUFBSSxDQUFDYixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0UsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxHQUNqRCxJQUFJLENBQUNmLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0csR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNNLEdBQUcsQ0FBQyxDQUFDLEdBQ2pELElBQUksQ0FBQ2QsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FDakQsSUFBSSxDQUFDZixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSyxHQUFHLENBQUMsQ0FBQztFQUMxRDtFQUVBLElBQUlxRCxXQUFXQSxDQUFBLEVBQUc7SUFBRSxPQUFPLElBQUksQ0FBQ2hCLGNBQWMsQ0FBQyxDQUFDO0VBQUU7O0VBRWxEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFaUIsUUFBUUEsQ0FBQSxFQUFHO0lBQ1QsT0FBUSxHQUFFLElBQUksQ0FBQ3JFLEdBQUcsQ0FBQyxDQUFFLElBQUcsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBRSxJQUFHLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUUsSUFBRyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFFLEtBQzdELElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUUsSUFBRyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFFLElBQUcsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBRSxJQUFHLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUUsS0FDckQsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBRSxJQUFHLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUUsSUFBRyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFFLElBQUcsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBRSxLQUNyRCxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFFLElBQUcsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBRSxJQUFHLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUUsSUFBRyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFFLEVBQUM7RUFDMUQ7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0V1RCxhQUFhQSxDQUFBLEVBQUc7SUFDZCxJQUFLQyxNQUFNLEVBQUc7TUFDWixJQUFJLENBQUM3RSxRQUFRLEdBQUcsTUFBTTtRQUNwQixNQUFNLElBQUkyRCxLQUFLLENBQUUsZ0NBQWlDLENBQUM7TUFDckQsQ0FBQztJQUNIO0lBQ0EsT0FBTyxJQUFJO0VBQ2I7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRW1CLFdBQVdBLENBQUVDLEtBQUssRUFBRztJQUNuQkEsS0FBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQ3pFLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCeUUsS0FBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQ3JFLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCcUUsS0FBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQ2pFLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCaUUsS0FBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQzdELEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCNkQsS0FBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQ3hFLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCd0UsS0FBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQ3BFLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCb0UsS0FBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQ2hFLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCZ0UsS0FBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQzVELEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCNEQsS0FBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQ3ZFLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCdUUsS0FBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQ25FLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCbUUsS0FBSyxDQUFFLEVBQUUsQ0FBRSxHQUFHLElBQUksQ0FBQy9ELEdBQUcsQ0FBQyxDQUFDO0lBQ3hCK0QsS0FBSyxDQUFFLEVBQUUsQ0FBRSxHQUFHLElBQUksQ0FBQzNELEdBQUcsQ0FBQyxDQUFDO0lBQ3hCMkQsS0FBSyxDQUFFLEVBQUUsQ0FBRSxHQUFHLElBQUksQ0FBQ3RFLEdBQUcsQ0FBQyxDQUFDO0lBQ3hCc0UsS0FBSyxDQUFFLEVBQUUsQ0FBRSxHQUFHLElBQUksQ0FBQ2xFLEdBQUcsQ0FBQyxDQUFDO0lBQ3hCa0UsS0FBSyxDQUFFLEVBQUUsQ0FBRSxHQUFHLElBQUksQ0FBQzlELEdBQUcsQ0FBQyxDQUFDO0lBQ3hCOEQsS0FBSyxDQUFFLEVBQUUsQ0FBRSxHQUFHLElBQUksQ0FBQzFELEdBQUcsQ0FBQyxDQUFDO0lBQ3hCLE9BQU8wRCxLQUFLO0VBQ2Q7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBT0MsUUFBUUEsQ0FBQSxFQUFHO0lBQ2hCLE9BQU8sSUFBSXRHLE9BQU8sQ0FDaEIsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNWLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDVixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ1YsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNWb0IsS0FBSyxDQUFDeUQsUUFBUyxDQUFDO0VBQ3BCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU8vQixXQUFXQSxDQUFFdUMsQ0FBQyxFQUFFQyxDQUFDLEVBQUVDLENBQUMsRUFBRztJQUM1QixPQUFPLElBQUl2RixPQUFPLENBQ2hCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFcUYsQ0FBQyxFQUNWLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFQyxDQUFDLEVBQ1YsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUVDLENBQUMsRUFDVixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ1ZuRSxLQUFLLENBQUMwRCxjQUFlLENBQUM7RUFDMUI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFPeUIscUJBQXFCQSxDQUFFQyxNQUFNLEVBQUc7SUFDckMsT0FBT3hHLE9BQU8sQ0FBQzhDLFdBQVcsQ0FBRTBELE1BQU0sQ0FBQ25CLENBQUMsRUFBRW1CLE1BQU0sQ0FBQ2xCLENBQUMsRUFBRWtCLE1BQU0sQ0FBQ2pCLENBQUUsQ0FBQztFQUM1RDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFPa0IsT0FBT0EsQ0FBRXBCLENBQUMsRUFBRUMsQ0FBQyxFQUFFQyxDQUFDLEVBQUc7SUFDeEI7SUFDQUQsQ0FBQyxHQUFHQSxDQUFDLEtBQUsvRCxTQUFTLEdBQUc4RCxDQUFDLEdBQUdDLENBQUM7SUFDM0JDLENBQUMsR0FBR0EsQ0FBQyxLQUFLaEUsU0FBUyxHQUFHOEQsQ0FBQyxHQUFHRSxDQUFDO0lBRTNCLE9BQU8sSUFBSXZGLE9BQU8sQ0FDaEJxRixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ1YsQ0FBQyxFQUFFQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDVixDQUFDLEVBQUUsQ0FBQyxFQUFFQyxDQUFDLEVBQUUsQ0FBQyxFQUNWLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDVm5FLEtBQUssQ0FBQzJELE9BQVEsQ0FBQztFQUNuQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBTzJCLGlCQUFpQkEsQ0FBRUMsSUFBSSxFQUFFQyxLQUFLLEVBQUc7SUFDdEMsTUFBTUMsQ0FBQyxHQUFHakQsSUFBSSxDQUFDa0QsR0FBRyxDQUFFRixLQUFNLENBQUM7SUFDM0IsTUFBTUcsQ0FBQyxHQUFHbkQsSUFBSSxDQUFDb0QsR0FBRyxDQUFFSixLQUFNLENBQUM7SUFDM0IsTUFBTUssQ0FBQyxHQUFHLENBQUMsR0FBR0osQ0FBQztJQUVmLE9BQU8sSUFBSTdHLE9BQU8sQ0FDaEIyRyxJQUFJLENBQUN0QixDQUFDLEdBQUdzQixJQUFJLENBQUN0QixDQUFDLEdBQUc0QixDQUFDLEdBQUdKLENBQUMsRUFBRUYsSUFBSSxDQUFDdEIsQ0FBQyxHQUFHc0IsSUFBSSxDQUFDckIsQ0FBQyxHQUFHMkIsQ0FBQyxHQUFHTixJQUFJLENBQUNwQixDQUFDLEdBQUd3QixDQUFDLEVBQUVKLElBQUksQ0FBQ3RCLENBQUMsR0FBR3NCLElBQUksQ0FBQ3BCLENBQUMsR0FBRzBCLENBQUMsR0FBR04sSUFBSSxDQUFDckIsQ0FBQyxHQUFHeUIsQ0FBQyxFQUFFLENBQUMsRUFDOUZKLElBQUksQ0FBQ3JCLENBQUMsR0FBR3FCLElBQUksQ0FBQ3RCLENBQUMsR0FBRzRCLENBQUMsR0FBR04sSUFBSSxDQUFDcEIsQ0FBQyxHQUFHd0IsQ0FBQyxFQUFFSixJQUFJLENBQUNyQixDQUFDLEdBQUdxQixJQUFJLENBQUNyQixDQUFDLEdBQUcyQixDQUFDLEdBQUdKLENBQUMsRUFBRUYsSUFBSSxDQUFDckIsQ0FBQyxHQUFHcUIsSUFBSSxDQUFDcEIsQ0FBQyxHQUFHMEIsQ0FBQyxHQUFHTixJQUFJLENBQUN0QixDQUFDLEdBQUcwQixDQUFDLEVBQUUsQ0FBQyxFQUM5RkosSUFBSSxDQUFDcEIsQ0FBQyxHQUFHb0IsSUFBSSxDQUFDdEIsQ0FBQyxHQUFHNEIsQ0FBQyxHQUFHTixJQUFJLENBQUNyQixDQUFDLEdBQUd5QixDQUFDLEVBQUVKLElBQUksQ0FBQ3BCLENBQUMsR0FBR29CLElBQUksQ0FBQ3JCLENBQUMsR0FBRzJCLENBQUMsR0FBR04sSUFBSSxDQUFDdEIsQ0FBQyxHQUFHMEIsQ0FBQyxFQUFFSixJQUFJLENBQUNwQixDQUFDLEdBQUdvQixJQUFJLENBQUNwQixDQUFDLEdBQUcwQixDQUFDLEdBQUdKLENBQUMsRUFBRSxDQUFDLEVBQzlGLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDVnpGLEtBQUssQ0FBQ0ksTUFBTyxDQUFDO0VBQ2xCOztFQUVBOztFQUdBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBTzBGLFNBQVNBLENBQUVOLEtBQUssRUFBRztJQUN4QixNQUFNQyxDQUFDLEdBQUdqRCxJQUFJLENBQUNrRCxHQUFHLENBQUVGLEtBQU0sQ0FBQztJQUMzQixNQUFNRyxDQUFDLEdBQUduRCxJQUFJLENBQUNvRCxHQUFHLENBQUVKLEtBQU0sQ0FBQztJQUUzQixPQUFPLElBQUk1RyxPQUFPLENBQ2hCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDVixDQUFDLEVBQUU2RyxDQUFDLEVBQUUsQ0FBQ0UsQ0FBQyxFQUFFLENBQUMsRUFDWCxDQUFDLEVBQUVBLENBQUMsRUFBRUYsQ0FBQyxFQUFFLENBQUMsRUFDVixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ1Z6RixLQUFLLENBQUNJLE1BQU8sQ0FBQztFQUNsQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU8yRixTQUFTQSxDQUFFUCxLQUFLLEVBQUc7SUFDeEIsTUFBTUMsQ0FBQyxHQUFHakQsSUFBSSxDQUFDa0QsR0FBRyxDQUFFRixLQUFNLENBQUM7SUFDM0IsTUFBTUcsQ0FBQyxHQUFHbkQsSUFBSSxDQUFDb0QsR0FBRyxDQUFFSixLQUFNLENBQUM7SUFFM0IsT0FBTyxJQUFJNUcsT0FBTyxDQUNoQjZHLENBQUMsRUFBRSxDQUFDLEVBQUVFLENBQUMsRUFBRSxDQUFDLEVBQ1YsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNWLENBQUNBLENBQUMsRUFBRSxDQUFDLEVBQUVGLENBQUMsRUFBRSxDQUFDLEVBQ1gsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNWekYsS0FBSyxDQUFDSSxNQUFPLENBQUM7RUFDbEI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFPNEYsU0FBU0EsQ0FBRVIsS0FBSyxFQUFHO0lBQ3hCLE1BQU1DLENBQUMsR0FBR2pELElBQUksQ0FBQ2tELEdBQUcsQ0FBRUYsS0FBTSxDQUFDO0lBQzNCLE1BQU1HLENBQUMsR0FBR25ELElBQUksQ0FBQ29ELEdBQUcsQ0FBRUosS0FBTSxDQUFDO0lBRTNCLE9BQU8sSUFBSTVHLE9BQU8sQ0FDaEI2RyxDQUFDLEVBQUUsQ0FBQ0UsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ1hBLENBQUMsRUFBRUYsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ1YsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNWLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDVnpGLEtBQUssQ0FBQ0ksTUFBTyxDQUFDO0VBQ2xCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBTzZGLGNBQWNBLENBQUVDLFdBQVcsRUFBRUMsTUFBTSxFQUFFQyxLQUFLLEVBQUVDLElBQUksRUFBRztJQUN4RCxNQUFNQyxTQUFTLEdBQUc5RCxJQUFJLENBQUNrRCxHQUFHLENBQUVRLFdBQVksQ0FBQyxHQUFHMUQsSUFBSSxDQUFDb0QsR0FBRyxDQUFFTSxXQUFZLENBQUM7SUFFbkUsT0FBTyxJQUFJdEgsT0FBTyxDQUNoQjBILFNBQVMsR0FBR0gsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUMzQixDQUFDLEVBQUVHLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNsQixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUVELElBQUksR0FBR0QsS0FBSyxLQUFPQSxLQUFLLEdBQUdDLElBQUksQ0FBRSxFQUFJLENBQUMsR0FBR0EsSUFBSSxHQUFHRCxLQUFLLElBQU9BLEtBQUssR0FBR0MsSUFBSSxDQUFFLEVBQ2xGLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBRSxDQUFDO0VBQ2pCO0FBQ0Y7QUFFQS9ILEdBQUcsQ0FBQ2lJLFFBQVEsQ0FBRSxTQUFTLEVBQUUzSCxPQUFRLENBQUM7QUFFbEMsTUFBTW9CLEtBQUssU0FBUzNCLGdCQUFnQixDQUFDO0VBQ2pDLE9BQU80QixLQUFLLEdBQUcsSUFBSUQsS0FBSyxDQUFDLENBQUM7RUFDMUIsT0FBT3lELFFBQVEsR0FBRyxJQUFJekQsS0FBSyxDQUFDLENBQUM7RUFDN0IsT0FBTzBELGNBQWMsR0FBRyxJQUFJMUQsS0FBSyxDQUFDLENBQUM7RUFDbkMsT0FBTzJELE9BQU8sR0FBRyxJQUFJM0QsS0FBSyxDQUFDLENBQUM7RUFDNUIsT0FBT0ksTUFBTSxHQUFHLElBQUlKLEtBQUssQ0FBQyxDQUFDO0VBQzNCLE9BQU93RyxXQUFXLEdBQUcsSUFBSXBJLFdBQVcsQ0FBRTRCLEtBQU0sQ0FBQztBQUNqRDs7QUFFQTtBQUNBcEIsT0FBTyxDQUFDb0IsS0FBSyxHQUFHQSxLQUFLOztBQUVyQjtBQUNBcEIsT0FBTyxDQUFDNkUsUUFBUSxHQUFHLElBQUk3RSxPQUFPLENBQUMsQ0FBQyxDQUFDa0csYUFBYSxDQUFDLENBQUM7QUFFaEQsZUFBZWxHLE9BQU8iLCJpZ25vcmVMaXN0IjpbXX0=