// Copyright 2013-2024, University of Colorado Boulder

/**
 * 3-dimensional Matrix
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import EnumerationIO from '../../tandem/js/types/EnumerationIO.js';
import ArrayIO from '../../tandem/js/types/ArrayIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import dot from './dot.js';
import Matrix4 from './Matrix4.js';
import toSVGNumber from './toSVGNumber.js';
import Vector2 from './Vector2.js';
import Vector3 from './Vector3.js';
import EnumerationValue from '../../phet-core/js/EnumerationValue.js';
import Enumeration from '../../phet-core/js/Enumeration.js';
import Pool from '../../phet-core/js/Pool.js';
export class Matrix3Type extends EnumerationValue {
  static OTHER = new Matrix3Type();
  static IDENTITY = new Matrix3Type();
  static TRANSLATION_2D = new Matrix3Type();
  static SCALING = new Matrix3Type();
  static AFFINE = new Matrix3Type();
  static enumeration = new Enumeration(Matrix3Type);
}
export default class Matrix3 {
  // Entries stored in column-major format

  /**
   * Creates an identity matrix, that can then be mutated into the proper form.
   */
  constructor() {
    //Make sure no clients are expecting to create a matrix with non-identity values
    assert && assert(arguments.length === 0, 'Matrix3 constructor should not be called with any arguments.  Use m3()/Matrix3.identity()/etc.');
    this.entries = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    this.type = Matrix3Type.IDENTITY;
  }
  initialize() {
    return this;
  }

  /**
   * Convenience getter for the individual 0,0 entry of the matrix.
   */
  m00() {
    return this.entries[0];
  }

  /**
   * Convenience getter for the individual 0,1 entry of the matrix.
   */
  m01() {
    return this.entries[3];
  }

  /**
   * Convenience getter for the individual 0,2 entry of the matrix.
   */
  m02() {
    return this.entries[6];
  }

  /**
   * Convenience getter for the individual 1,0 entry of the matrix.
   */
  m10() {
    return this.entries[1];
  }

  /**
   * Convenience getter for the individual 1,1 entry of the matrix.
   */
  m11() {
    return this.entries[4];
  }

  /**
   * Convenience getter for the individual 1,2 entry of the matrix.
   */
  m12() {
    return this.entries[7];
  }

  /**
   * Convenience getter for the individual 2,0 entry of the matrix.
   */
  m20() {
    return this.entries[2];
  }

  /**
   * Convenience getter for the individual 2,1 entry of the matrix.
   */
  m21() {
    return this.entries[5];
  }

  /**
   * Convenience getter for the individual 2,2 entry of the matrix.
   */
  m22() {
    return this.entries[8];
  }

  /**
   * Returns whether this matrix is an identity matrix.
   */
  isIdentity() {
    return this.type === Matrix3Type.IDENTITY || this.equals(Matrix3.IDENTITY);
  }

  /**
   * Returns whether this matrix is likely to be an identity matrix (returning false means "inconclusive, may be
   * identity or not"), but true is guaranteed to be an identity matrix.
   */
  isFastIdentity() {
    return this.type === Matrix3Type.IDENTITY;
  }

  /**
   * Returns whether this matrix is a translation matrix.
   * By this we mean it has no shear, rotation, or scaling
   * It may be a translation of zero.
   */
  isTranslation() {
    return this.type === Matrix3Type.TRANSLATION_2D || this.m00() === 1 && this.m11() === 1 && this.m22() === 1 && this.m01() === 0 && this.m10() === 0 && this.m20() === 0 && this.m21() === 0;
  }

  /**
   * Returns whether this matrix is an affine matrix (e.g. no shear).
   */
  isAffine() {
    return this.type === Matrix3Type.AFFINE || this.m20() === 0 && this.m21() === 0 && this.m22() === 1;
  }

  /**
   * Returns whether it's an affine matrix where the components of transforms are independent, i.e. constructed from
   * arbitrary component scaling and translation.
   */
  isAligned() {
    // non-diagonal non-translation entries should all be zero.
    return this.isAffine() && this.m01() === 0 && this.m10() === 0;
  }

  /**
   * Returns if it's an affine matrix where the components of transforms are independent, but may be switched (unlike isAligned)
   *
   * i.e. the 2x2 rotational sub-matrix is of one of the two forms:
   * A 0  or  0  A
   * 0 B      B  0
   * This means that moving a transformed point by (x,0) or (0,y) will result in a motion along one of the axes.
   */
  isAxisAligned() {
    return this.isAffine() && (this.m01() === 0 && this.m10() === 0 || this.m00() === 0 && this.m11() === 0);
  }

  /**
   * Returns whether every single entry in this matrix is a finite number (non-NaN, non-infinite).
   */
  isFinite() {
    return isFinite(this.m00()) && isFinite(this.m01()) && isFinite(this.m02()) && isFinite(this.m10()) && isFinite(this.m11()) && isFinite(this.m12()) && isFinite(this.m20()) && isFinite(this.m21()) && isFinite(this.m22());
  }

  /**
   * Returns the determinant of this matrix.
   */
  getDeterminant() {
    return this.m00() * this.m11() * this.m22() + this.m01() * this.m12() * this.m20() + this.m02() * this.m10() * this.m21() - this.m02() * this.m11() * this.m20() - this.m01() * this.m10() * this.m22() - this.m00() * this.m12() * this.m21();
  }
  get determinant() {
    return this.getDeterminant();
  }

  /**
   * Returns the 2D translation, assuming multiplication with a homogeneous vector
   */
  getTranslation() {
    return new Vector2(this.m02(), this.m12());
  }
  get translation() {
    return this.getTranslation();
  }

  /**
   * Returns a vector that is equivalent to ( T(1,0).magnitude(), T(0,1).magnitude() ) where T is a relative transform
   */
  getScaleVector() {
    return new Vector2(Math.sqrt(this.m00() * this.m00() + this.m10() * this.m10()), Math.sqrt(this.m01() * this.m01() + this.m11() * this.m11()));
  }
  get scaleVector() {
    return this.getScaleVector();
  }

  /**
   * Returns the total "amount" of scaled area in this matrix (which will be negative if it flips the coordinate system).
   * For instance, Matrix3.scaling( 2 ) will return 4, since it scales the area by 4.
   */
  getSignedScale() {
    // It's the cross product of untranslated-transformed-(1,0) and untranslated-transformed-(0,1)
    return this.m00() * this.m11() - this.m10() * this.m01();
  }

  /**
   * Returns the angle in radians for the 2d rotation from this matrix, between pi, -pi
   */
  getRotation() {
    return Math.atan2(this.m10(), this.m00());
  }
  get rotation() {
    return this.getRotation();
  }

  /**
   * Returns an identity-padded copy of this matrix with an increased dimension.
   */
  toMatrix4() {
    return new Matrix4(this.m00(), this.m01(), this.m02(), 0, this.m10(), this.m11(), this.m12(), 0, this.m20(), this.m21(), this.m22(), 0, 0, 0, 0, 1);
  }

  /**
   * Returns an identity-padded copy of this matrix with an increased dimension, treating this matrix's affine
   * components only.
   */
  toAffineMatrix4() {
    return new Matrix4(this.m00(), this.m01(), 0, this.m02(), this.m10(), this.m11(), 0, this.m12(), 0, 0, 1, 0, 0, 0, 0, 1);
  }

  /**
   * Returns a string form of this object
   */
  toString() {
    return `${this.m00()} ${this.m01()} ${this.m02()}\n${this.m10()} ${this.m11()} ${this.m12()}\n${this.m20()} ${this.m21()} ${this.m22()}`;
  }

  /**
   * Creates an SVG form of this matrix, for high-performance processing in SVG output.
   */
  toSVGMatrix() {
    const result = document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGMatrix();

    // top two rows
    result.a = this.m00();
    result.b = this.m10();
    result.c = this.m01();
    result.d = this.m11();
    result.e = this.m02();
    result.f = this.m12();
    return result;
  }

  /**
   * Returns the CSS form (simplified if possible) for this transformation matrix.
   */
  getCSSTransform() {
    // See http://www.w3.org/TR/css3-transforms/, particularly Section 13 that discusses the SVG compatibility

    // We need to prevent the numbers from being in an exponential toString form, since the CSS transform does not support that
    // 20 is the largest guaranteed number of digits according to https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Number/toFixed
    // See https://github.com/phetsims/dot/issues/36

    // the inner part of a CSS3 transform, but remember to add the browser-specific parts!
    // NOTE: the toFixed calls are inlined for performance reasons
    return `matrix(${this.entries[0].toFixed(20)},${this.entries[1].toFixed(20)},${this.entries[3].toFixed(20)},${this.entries[4].toFixed(20)},${this.entries[6].toFixed(20)},${this.entries[7].toFixed(20)})`; // eslint-disable-line bad-sim-text
  }
  get cssTransform() {
    return this.getCSSTransform();
  }

  /**
   * Returns the CSS-like SVG matrix form for this transformation matrix.
   */
  getSVGTransform() {
    // SVG transform presentation attribute. See http://www.w3.org/TR/SVG/coords.html#TransformAttribute
    switch (this.type) {
      case Matrix3Type.IDENTITY:
        return '';
      case Matrix3Type.TRANSLATION_2D:
        return `translate(${toSVGNumber(this.entries[6])},${toSVGNumber(this.entries[7])})`;
      case Matrix3Type.SCALING:
        return `scale(${toSVGNumber(this.entries[0])}${this.entries[0] === this.entries[4] ? '' : `,${toSVGNumber(this.entries[4])}`})`;
      default:
        return `matrix(${toSVGNumber(this.entries[0])},${toSVGNumber(this.entries[1])},${toSVGNumber(this.entries[3])},${toSVGNumber(this.entries[4])},${toSVGNumber(this.entries[6])},${toSVGNumber(this.entries[7])})`;
    }
  }
  get svgTransform() {
    return this.getSVGTransform();
  }

  /**
   * Returns a parameter object suitable for use with jQuery's .css()
   */
  getCSSTransformStyles() {
    const transformCSS = this.getCSSTransform();

    // notes on triggering hardware acceleration: http://creativejs.com/2011/12/day-2-gpu-accelerate-your-dom-elements/
    return {
      // force iOS hardware acceleration
      '-webkit-perspective': '1000',
      '-webkit-backface-visibility': 'hidden',
      '-webkit-transform': `${transformCSS} translateZ(0)`,
      // trigger hardware acceleration if possible
      '-moz-transform': `${transformCSS} translateZ(0)`,
      // trigger hardware acceleration if possible
      '-ms-transform': transformCSS,
      '-o-transform': transformCSS,
      transform: transformCSS,
      'transform-origin': 'top left',
      // at the origin of the component. consider 0px 0px instead. Critical, since otherwise this defaults to 50% 50%!!! see https://developer.mozilla.org/en-US/docs/CSS/transform-origin
      '-ms-transform-origin': 'top left' // TODO: do we need other platform-specific transform-origin styles? https://github.com/phetsims/dot/issues/96
    };
  }
  get cssTransformStyles() {
    return this.getCSSTransformStyles();
  }

  /**
   * Returns exact equality with another matrix
   */
  equals(matrix) {
    return this.m00() === matrix.m00() && this.m01() === matrix.m01() && this.m02() === matrix.m02() && this.m10() === matrix.m10() && this.m11() === matrix.m11() && this.m12() === matrix.m12() && this.m20() === matrix.m20() && this.m21() === matrix.m21() && this.m22() === matrix.m22();
  }

  /**
   * Returns equality within a margin of error with another matrix
   */
  equalsEpsilon(matrix, epsilon) {
    return Math.abs(this.m00() - matrix.m00()) < epsilon && Math.abs(this.m01() - matrix.m01()) < epsilon && Math.abs(this.m02() - matrix.m02()) < epsilon && Math.abs(this.m10() - matrix.m10()) < epsilon && Math.abs(this.m11() - matrix.m11()) < epsilon && Math.abs(this.m12() - matrix.m12()) < epsilon && Math.abs(this.m20() - matrix.m20()) < epsilon && Math.abs(this.m21() - matrix.m21()) < epsilon && Math.abs(this.m22() - matrix.m22()) < epsilon;
  }

  /*---------------------------------------------------------------------------*
   * Immutable operations (returns a new matrix)
   *----------------------------------------------------------------------------*/

  /**
   * Returns a copy of this matrix
   */
  copy() {
    return m3(this.m00(), this.m01(), this.m02(), this.m10(), this.m11(), this.m12(), this.m20(), this.m21(), this.m22(), this.type);
  }

  /**
   * Returns a new matrix, defined by this matrix plus the provided matrix
   */
  plus(matrix) {
    return m3(this.m00() + matrix.m00(), this.m01() + matrix.m01(), this.m02() + matrix.m02(), this.m10() + matrix.m10(), this.m11() + matrix.m11(), this.m12() + matrix.m12(), this.m20() + matrix.m20(), this.m21() + matrix.m21(), this.m22() + matrix.m22());
  }

  /**
   * Returns a new matrix, defined by this matrix plus the provided matrix
   */
  minus(matrix) {
    return m3(this.m00() - matrix.m00(), this.m01() - matrix.m01(), this.m02() - matrix.m02(), this.m10() - matrix.m10(), this.m11() - matrix.m11(), this.m12() - matrix.m12(), this.m20() - matrix.m20(), this.m21() - matrix.m21(), this.m22() - matrix.m22());
  }

  /**
   * Returns a transposed copy of this matrix
   */
  transposed() {
    return m3(this.m00(), this.m10(), this.m20(), this.m01(), this.m11(), this.m21(), this.m02(), this.m12(), this.m22(), this.type === Matrix3Type.IDENTITY || this.type === Matrix3Type.SCALING ? this.type : undefined);
  }

  /**
   * Returns a negated copy of this matrix
   */
  negated() {
    return m3(-this.m00(), -this.m01(), -this.m02(), -this.m10(), -this.m11(), -this.m12(), -this.m20(), -this.m21(), -this.m22());
  }

  /**
   * Returns an inverted copy of this matrix
   */
  inverted() {
    let det;
    switch (this.type) {
      case Matrix3Type.IDENTITY:
        return this;
      case Matrix3Type.TRANSLATION_2D:
        return m3(1, 0, -this.m02(), 0, 1, -this.m12(), 0, 0, 1, Matrix3Type.TRANSLATION_2D);
      case Matrix3Type.SCALING:
        return m3(1 / this.m00(), 0, 0, 0, 1 / this.m11(), 0, 0, 0, 1 / this.m22(), Matrix3Type.SCALING);
      case Matrix3Type.AFFINE:
        det = this.getDeterminant();
        if (det !== 0) {
          return m3((-this.m12() * this.m21() + this.m11() * this.m22()) / det, (this.m02() * this.m21() - this.m01() * this.m22()) / det, (-this.m02() * this.m11() + this.m01() * this.m12()) / det, (this.m12() * this.m20() - this.m10() * this.m22()) / det, (-this.m02() * this.m20() + this.m00() * this.m22()) / det, (this.m02() * this.m10() - this.m00() * this.m12()) / det, 0, 0, 1, Matrix3Type.AFFINE);
        } else {
          throw new Error('Matrix could not be inverted, determinant === 0');
        }
      case Matrix3Type.OTHER:
        det = this.getDeterminant();
        if (det !== 0) {
          return m3((-this.m12() * this.m21() + this.m11() * this.m22()) / det, (this.m02() * this.m21() - this.m01() * this.m22()) / det, (-this.m02() * this.m11() + this.m01() * this.m12()) / det, (this.m12() * this.m20() - this.m10() * this.m22()) / det, (-this.m02() * this.m20() + this.m00() * this.m22()) / det, (this.m02() * this.m10() - this.m00() * this.m12()) / det, (-this.m11() * this.m20() + this.m10() * this.m21()) / det, (this.m01() * this.m20() - this.m00() * this.m21()) / det, (-this.m01() * this.m10() + this.m00() * this.m11()) / det, Matrix3Type.OTHER);
        } else {
          throw new Error('Matrix could not be inverted, determinant === 0');
        }
      default:
        throw new Error(`Matrix3.inverted with unknown type: ${this.type}`);
    }
  }

  /**
   * Returns a matrix, defined by the multiplication of this * matrix.
   *
   * @param matrix
   * @returns - NOTE: this may be the same matrix!
   */
  timesMatrix(matrix) {
    // I * M === M * I === M (the identity)
    if (this.type === Matrix3Type.IDENTITY || matrix.type === Matrix3Type.IDENTITY) {
      return this.type === Matrix3Type.IDENTITY ? matrix : this;
    }
    if (this.type === matrix.type) {
      // currently two matrices of the same type will result in the same result type
      if (this.type === Matrix3Type.TRANSLATION_2D) {
        // faster combination of translations
        return m3(1, 0, this.m02() + matrix.m02(), 0, 1, this.m12() + matrix.m12(), 0, 0, 1, Matrix3Type.TRANSLATION_2D);
      } else if (this.type === Matrix3Type.SCALING) {
        // faster combination of scaling
        return m3(this.m00() * matrix.m00(), 0, 0, 0, this.m11() * matrix.m11(), 0, 0, 0, 1, Matrix3Type.SCALING);
      }
    }
    if (this.type !== Matrix3Type.OTHER && matrix.type !== Matrix3Type.OTHER) {
      // currently two matrices that are anything but "other" are technically affine, and the result will be affine

      // affine case
      return m3(this.m00() * matrix.m00() + this.m01() * matrix.m10(), this.m00() * matrix.m01() + this.m01() * matrix.m11(), this.m00() * matrix.m02() + this.m01() * matrix.m12() + this.m02(), this.m10() * matrix.m00() + this.m11() * matrix.m10(), this.m10() * matrix.m01() + this.m11() * matrix.m11(), this.m10() * matrix.m02() + this.m11() * matrix.m12() + this.m12(), 0, 0, 1, Matrix3Type.AFFINE);
    }

    // general case
    return m3(this.m00() * matrix.m00() + this.m01() * matrix.m10() + this.m02() * matrix.m20(), this.m00() * matrix.m01() + this.m01() * matrix.m11() + this.m02() * matrix.m21(), this.m00() * matrix.m02() + this.m01() * matrix.m12() + this.m02() * matrix.m22(), this.m10() * matrix.m00() + this.m11() * matrix.m10() + this.m12() * matrix.m20(), this.m10() * matrix.m01() + this.m11() * matrix.m11() + this.m12() * matrix.m21(), this.m10() * matrix.m02() + this.m11() * matrix.m12() + this.m12() * matrix.m22(), this.m20() * matrix.m00() + this.m21() * matrix.m10() + this.m22() * matrix.m20(), this.m20() * matrix.m01() + this.m21() * matrix.m11() + this.m22() * matrix.m21(), this.m20() * matrix.m02() + this.m21() * matrix.m12() + this.m22() * matrix.m22());
  }

  /*---------------------------------------------------------------------------*
   * Immutable operations (returns new form of a parameter)
   *----------------------------------------------------------------------------*/

  /**
   * Returns the multiplication of this matrix times the provided vector (treating this matrix as homogeneous, so that
   * it is the technical multiplication of (x,y,1)).
   */
  timesVector2(vector2) {
    const x = this.m00() * vector2.x + this.m01() * vector2.y + this.m02();
    const y = this.m10() * vector2.x + this.m11() * vector2.y + this.m12();
    return new Vector2(x, y);
  }

  /**
   * Returns the multiplication of this matrix times the provided vector
   */
  timesVector3(vector3) {
    const x = this.m00() * vector3.x + this.m01() * vector3.y + this.m02() * vector3.z;
    const y = this.m10() * vector3.x + this.m11() * vector3.y + this.m12() * vector3.z;
    const z = this.m20() * vector3.x + this.m21() * vector3.y + this.m22() * vector3.z;
    return new Vector3(x, y, z);
  }

  /**
   * Returns the multiplication of the transpose of this matrix times the provided vector (assuming the 2x2 quadrant)
   */
  timesTransposeVector2(vector2) {
    const x = this.m00() * vector2.x + this.m10() * vector2.y;
    const y = this.m01() * vector2.x + this.m11() * vector2.y;
    return new Vector2(x, y);
  }

  /**
   * TODO: this operation seems to not work for transformDelta2, should be vetted https://github.com/phetsims/dot/issues/96
   */
  timesRelativeVector2(vector2) {
    const x = this.m00() * vector2.x + this.m01() * vector2.y;
    const y = this.m10() * vector2.y + this.m11() * vector2.y;
    return new Vector2(x, y);
  }

  /*---------------------------------------------------------------------------*
   * Mutable operations (changes this matrix)
   *----------------------------------------------------------------------------*/

  /**
   * Sets the entire state of the matrix, in row-major order.
   *
   * NOTE: Every mutable method goes through rowMajor
   */
  rowMajor(v00, v01, v02, v10, v11, v12, v20, v21, v22, type) {
    this.entries[0] = v00;
    this.entries[1] = v10;
    this.entries[2] = v20;
    this.entries[3] = v01;
    this.entries[4] = v11;
    this.entries[5] = v21;
    this.entries[6] = v02;
    this.entries[7] = v12;
    this.entries[8] = v22;

    // TODO: consider performance of the affine check here https://github.com/phetsims/dot/issues/96
    this.type = type === undefined ? v20 === 0 && v21 === 0 && v22 === 1 ? Matrix3Type.AFFINE : Matrix3Type.OTHER : type;
    return this;
  }

  /**
   * Sets this matrix to be a copy of another matrix.
   */
  set(matrix) {
    return this.rowMajor(matrix.m00(), matrix.m01(), matrix.m02(), matrix.m10(), matrix.m11(), matrix.m12(), matrix.m20(), matrix.m21(), matrix.m22(), matrix.type);
  }

  /**
   * Sets this matrix to be a copy of the column-major data stored in an array (e.g. WebGL).
   */
  setArray(array) {
    return this.rowMajor(array[0], array[3], array[6], array[1], array[4], array[7], array[2], array[5], array[8]);
  }

  /**
   * Sets the individual 0,0 component of this matrix.
   */
  set00(value) {
    this.entries[0] = value;
    return this;
  }

  /**
   * Sets the individual 0,1 component of this matrix.
   */
  set01(value) {
    this.entries[3] = value;
    return this;
  }

  /**
   * Sets the individual 0,2 component of this matrix.
   */
  set02(value) {
    this.entries[6] = value;
    return this;
  }

  /**
   * Sets the individual 1,0 component of this matrix.
   */
  set10(value) {
    this.entries[1] = value;
    return this;
  }

  /**
   * Sets the individual 1,1 component of this matrix.
   */
  set11(value) {
    this.entries[4] = value;
    return this;
  }

  /**
   * Sets the individual 1,2 component of this matrix.
   */
  set12(value) {
    this.entries[7] = value;
    return this;
  }

  /**
   * Sets the individual 2,0 component of this matrix.
   */
  set20(value) {
    this.entries[2] = value;
    return this;
  }

  /**
   * Sets the individual 2,1 component of this matrix.
   */
  set21(value) {
    this.entries[5] = value;
    return this;
  }

  /**
   * Sets the individual 2,2 component of this matrix.
   */
  set22(value) {
    this.entries[8] = value;
    return this;
  }

  /**
   * Makes this matrix effectively immutable to the normal methods (except direct setters?)
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
   * Sets the entire state of the matrix, in column-major order.
   */
  columnMajor(v00, v10, v20, v01, v11, v21, v02, v12, v22, type) {
    return this.rowMajor(v00, v01, v02, v10, v11, v12, v20, v21, v22, type);
  }

  /**
   * Sets this matrix to itself plus the given matrix.
   */
  add(matrix) {
    return this.rowMajor(this.m00() + matrix.m00(), this.m01() + matrix.m01(), this.m02() + matrix.m02(), this.m10() + matrix.m10(), this.m11() + matrix.m11(), this.m12() + matrix.m12(), this.m20() + matrix.m20(), this.m21() + matrix.m21(), this.m22() + matrix.m22());
  }

  /**
   * Sets this matrix to itself minus the given matrix.
   */
  subtract(m) {
    return this.rowMajor(this.m00() - m.m00(), this.m01() - m.m01(), this.m02() - m.m02(), this.m10() - m.m10(), this.m11() - m.m11(), this.m12() - m.m12(), this.m20() - m.m20(), this.m21() - m.m21(), this.m22() - m.m22());
  }

  /**
   * Sets this matrix to its own transpose.
   */
  transpose() {
    return this.rowMajor(this.m00(), this.m10(), this.m20(), this.m01(), this.m11(), this.m21(), this.m02(), this.m12(), this.m22(), this.type === Matrix3Type.IDENTITY || this.type === Matrix3Type.SCALING ? this.type : undefined);
  }

  /**
   * Sets this matrix to its own negation.
   */
  negate() {
    return this.rowMajor(-this.m00(), -this.m01(), -this.m02(), -this.m10(), -this.m11(), -this.m12(), -this.m20(), -this.m21(), -this.m22());
  }

  /**
   * Sets this matrix to its own inverse.
   */
  invert() {
    let det;
    switch (this.type) {
      case Matrix3Type.IDENTITY:
        return this;
      case Matrix3Type.TRANSLATION_2D:
        return this.rowMajor(1, 0, -this.m02(), 0, 1, -this.m12(), 0, 0, 1, Matrix3Type.TRANSLATION_2D);
      case Matrix3Type.SCALING:
        return this.rowMajor(1 / this.m00(), 0, 0, 0, 1 / this.m11(), 0, 0, 0, 1 / this.m22(), Matrix3Type.SCALING);
      case Matrix3Type.AFFINE:
        det = this.getDeterminant();
        if (det !== 0) {
          return this.rowMajor((-this.m12() * this.m21() + this.m11() * this.m22()) / det, (this.m02() * this.m21() - this.m01() * this.m22()) / det, (-this.m02() * this.m11() + this.m01() * this.m12()) / det, (this.m12() * this.m20() - this.m10() * this.m22()) / det, (-this.m02() * this.m20() + this.m00() * this.m22()) / det, (this.m02() * this.m10() - this.m00() * this.m12()) / det, 0, 0, 1, Matrix3Type.AFFINE);
        } else {
          throw new Error('Matrix could not be inverted, determinant === 0');
        }
      case Matrix3Type.OTHER:
        det = this.getDeterminant();
        if (det !== 0) {
          return this.rowMajor((-this.m12() * this.m21() + this.m11() * this.m22()) / det, (this.m02() * this.m21() - this.m01() * this.m22()) / det, (-this.m02() * this.m11() + this.m01() * this.m12()) / det, (this.m12() * this.m20() - this.m10() * this.m22()) / det, (-this.m02() * this.m20() + this.m00() * this.m22()) / det, (this.m02() * this.m10() - this.m00() * this.m12()) / det, (-this.m11() * this.m20() + this.m10() * this.m21()) / det, (this.m01() * this.m20() - this.m00() * this.m21()) / det, (-this.m01() * this.m10() + this.m00() * this.m11()) / det, Matrix3Type.OTHER);
        } else {
          throw new Error('Matrix could not be inverted, determinant === 0');
        }
      default:
        throw new Error(`Matrix3.inverted with unknown type: ${this.type}`);
    }
  }

  /**
   * Sets this matrix to the value of itself times the provided matrix
   */
  multiplyMatrix(matrix) {
    // M * I === M (the identity)
    if (matrix.type === Matrix3Type.IDENTITY) {
      // no change needed
      return this;
    }

    // I * M === M (the identity)
    if (this.type === Matrix3Type.IDENTITY) {
      // copy the other matrix to us
      return this.set(matrix);
    }
    if (this.type === matrix.type) {
      // currently two matrices of the same type will result in the same result type
      if (this.type === Matrix3Type.TRANSLATION_2D) {
        // faster combination of translations
        return this.rowMajor(1, 0, this.m02() + matrix.m02(), 0, 1, this.m12() + matrix.m12(), 0, 0, 1, Matrix3Type.TRANSLATION_2D);
      } else if (this.type === Matrix3Type.SCALING) {
        // faster combination of scaling
        return this.rowMajor(this.m00() * matrix.m00(), 0, 0, 0, this.m11() * matrix.m11(), 0, 0, 0, 1, Matrix3Type.SCALING);
      }
    }
    if (this.type !== Matrix3Type.OTHER && matrix.type !== Matrix3Type.OTHER) {
      // currently two matrices that are anything but "other" are technically affine, and the result will be affine

      // affine case
      return this.rowMajor(this.m00() * matrix.m00() + this.m01() * matrix.m10(), this.m00() * matrix.m01() + this.m01() * matrix.m11(), this.m00() * matrix.m02() + this.m01() * matrix.m12() + this.m02(), this.m10() * matrix.m00() + this.m11() * matrix.m10(), this.m10() * matrix.m01() + this.m11() * matrix.m11(), this.m10() * matrix.m02() + this.m11() * matrix.m12() + this.m12(), 0, 0, 1, Matrix3Type.AFFINE);
    }

    // general case
    return this.rowMajor(this.m00() * matrix.m00() + this.m01() * matrix.m10() + this.m02() * matrix.m20(), this.m00() * matrix.m01() + this.m01() * matrix.m11() + this.m02() * matrix.m21(), this.m00() * matrix.m02() + this.m01() * matrix.m12() + this.m02() * matrix.m22(), this.m10() * matrix.m00() + this.m11() * matrix.m10() + this.m12() * matrix.m20(), this.m10() * matrix.m01() + this.m11() * matrix.m11() + this.m12() * matrix.m21(), this.m10() * matrix.m02() + this.m11() * matrix.m12() + this.m12() * matrix.m22(), this.m20() * matrix.m00() + this.m21() * matrix.m10() + this.m22() * matrix.m20(), this.m20() * matrix.m01() + this.m21() * matrix.m11() + this.m22() * matrix.m21(), this.m20() * matrix.m02() + this.m21() * matrix.m12() + this.m22() * matrix.m22());
  }

  /**
   * Mutates this matrix, equivalent to (translation * this).
   */
  prependTranslation(x, y) {
    this.set02(this.m02() + x);
    this.set12(this.m12() + y);
    if (this.type === Matrix3Type.IDENTITY || this.type === Matrix3Type.TRANSLATION_2D) {
      this.type = Matrix3Type.TRANSLATION_2D;
    } else if (this.type === Matrix3Type.OTHER) {
      this.type = Matrix3Type.OTHER;
    } else {
      this.type = Matrix3Type.AFFINE;
    }
    return this; // for chaining
  }

  /**
   * Sets this matrix to the 3x3 identity matrix.
   */
  setToIdentity() {
    return this.rowMajor(1, 0, 0, 0, 1, 0, 0, 0, 1, Matrix3Type.IDENTITY);
  }

  /**
   * Sets this matrix to the affine translation matrix.
   */
  setToTranslation(x, y) {
    return this.rowMajor(1, 0, x, 0, 1, y, 0, 0, 1, Matrix3Type.TRANSLATION_2D);
  }

  /**
   * Sets this matrix to the affine scaling matrix.
   */
  setToScale(x, y) {
    // allow using one parameter to scale everything
    y = y === undefined ? x : y;
    return this.rowMajor(x, 0, 0, 0, y, 0, 0, 0, 1, Matrix3Type.SCALING);
  }

  /**
   * Sets this matrix to an affine matrix with the specified row-major values.
   */
  setToAffine(m00, m01, m02, m10, m11, m12) {
    return this.rowMajor(m00, m01, m02, m10, m11, m12, 0, 0, 1, Matrix3Type.AFFINE);
  }

  /**
   * Sets the matrix to a rotation defined by a rotation of the specified angle around the given unit axis.
   *
   * @param axis - normalized
   * @param angle - in radians
   */
  setToRotationAxisAngle(axis, angle) {
    let c = Math.cos(angle);
    let s = Math.sin(angle);

    // Handle cases close to 0, since we want Math.PI/2 rotations (and the like) to be exact
    if (Math.abs(c) < 1e-15) {
      c = 0;
    }
    if (Math.abs(s) < 1e-15) {
      s = 0;
    }
    const C = 1 - c;
    return this.rowMajor(axis.x * axis.x * C + c, axis.x * axis.y * C - axis.z * s, axis.x * axis.z * C + axis.y * s, axis.y * axis.x * C + axis.z * s, axis.y * axis.y * C + c, axis.y * axis.z * C - axis.x * s, axis.z * axis.x * C - axis.y * s, axis.z * axis.y * C + axis.x * s, axis.z * axis.z * C + c, Matrix3Type.OTHER);
  }

  /**
   * Sets this matrix to a rotation around the x axis (in the yz plane).
   *
   * @param angle - in radians
   */
  setToRotationX(angle) {
    let c = Math.cos(angle);
    let s = Math.sin(angle);

    // Handle cases close to 0, since we want Math.PI/2 rotations (and the like) to be exact
    if (Math.abs(c) < 1e-15) {
      c = 0;
    }
    if (Math.abs(s) < 1e-15) {
      s = 0;
    }
    return this.rowMajor(1, 0, 0, 0, c, -s, 0, s, c, Matrix3Type.OTHER);
  }

  /**
   * Sets this matrix to a rotation around the y axis (in the xz plane).
   *
   * @param angle - in radians
   */
  setToRotationY(angle) {
    let c = Math.cos(angle);
    let s = Math.sin(angle);

    // Handle cases close to 0, since we want Math.PI/2 rotations (and the like) to be exact
    if (Math.abs(c) < 1e-15) {
      c = 0;
    }
    if (Math.abs(s) < 1e-15) {
      s = 0;
    }
    return this.rowMajor(c, 0, s, 0, 1, 0, -s, 0, c, Matrix3Type.OTHER);
  }

  /**
   * Sets this matrix to a rotation around the z axis (in the xy plane).
   *
   * @param angle - in radians
   */
  setToRotationZ(angle) {
    let c = Math.cos(angle);
    let s = Math.sin(angle);

    // Handle cases close to 0, since we want Math.PI/2 rotations (and the like) to be exact
    if (Math.abs(c) < 1e-15) {
      c = 0;
    }
    if (Math.abs(s) < 1e-15) {
      s = 0;
    }
    return this.rowMajor(c, -s, 0, s, c, 0, 0, 0, 1, Matrix3Type.AFFINE);
  }

  /**
   * Sets this matrix to the combined translation+rotation (where the rotation logically would happen first, THEN it
   * would be translated).
   *
   * @param x
   * @param y
   * @param angle - in radians
   */
  setToTranslationRotation(x, y, angle) {
    let c = Math.cos(angle);
    let s = Math.sin(angle);

    // Handle cases close to 0, since we want Math.PI/2 rotations (and the like) to be exact
    if (Math.abs(c) < 1e-15) {
      c = 0;
    }
    if (Math.abs(s) < 1e-15) {
      s = 0;
    }
    return this.rowMajor(c, -s, x, s, c, y, 0, 0, 1, Matrix3Type.AFFINE);
  }

  /**
   * Sets this matrix to the combined translation+rotation (where the rotation logically would happen first, THEN it
   * would be translated).
   *
   * @param translation
   * @param angle - in radians
   */
  setToTranslationRotationPoint(translation, angle) {
    return this.setToTranslationRotation(translation.x, translation.y, angle);
  }

  /**
   * Sets this matrix to the combined scale+translation+rotation.
   *
   * The order of operations is scale, then rotate, then translate.
   *
   * @param x
   * @param y
   * @param angle - in radians
   */
  setToScaleTranslationRotation(scale, x, y, angle) {
    let c = Math.cos(angle);
    let s = Math.sin(angle);

    // Handle cases close to 0, since we want Math.PI/2 rotations (and the like) to be exact
    if (Math.abs(c) < 1e-15) {
      c = 0;
    }
    if (Math.abs(s) < 1e-15) {
      s = 0;
    }
    c *= scale;
    s *= scale;
    return this.rowMajor(c, -s, x, s, c, y, 0, 0, 1, Matrix3Type.AFFINE);
  }

  /**
   * Sets this matrix to the combined translation+rotation (where the rotation logically would happen first, THEN it
   * would be translated).
   *
   * @param translation
   * @param angle - in radians
   */
  setToScaleTranslationRotationPoint(scale, translation, angle) {
    return this.setToScaleTranslationRotation(scale, translation.x, translation.y, angle);
  }

  /**
   * Sets this matrix to the values contained in an SVGMatrix.
   */
  setToSVGMatrix(svgMatrix) {
    return this.rowMajor(svgMatrix.a, svgMatrix.c, svgMatrix.e, svgMatrix.b, svgMatrix.d, svgMatrix.f, 0, 0, 1, Matrix3Type.AFFINE);
  }

  /**
   * Sets this matrix to a rotation matrix that rotates A to B (Vector3 instances), by rotating about the axis
   * A.cross( B ) -- Shortest path. ideally should be unit vectors.
   */
  setRotationAToB(a, b) {
    // see http://graphics.cs.brown.edu/~jfh/papers/Moller-EBA-1999/paper.pdf for information on this implementation
    const start = a;
    const end = b;
    const epsilon = 0.0001;
    let v = start.cross(end);
    const e = start.dot(end);
    const f = e < 0 ? -e : e;

    // if "from" and "to" vectors are nearly parallel
    if (f > 1.0 - epsilon) {
      let x = new Vector3(start.x > 0.0 ? start.x : -start.x, start.y > 0.0 ? start.y : -start.y, start.z > 0.0 ? start.z : -start.z);
      if (x.x < x.y) {
        if (x.x < x.z) {
          x = Vector3.X_UNIT;
        } else {
          x = Vector3.Z_UNIT;
        }
      } else {
        if (x.y < x.z) {
          x = Vector3.Y_UNIT;
        } else {
          x = Vector3.Z_UNIT;
        }
      }
      const u = x.minus(start);
      v = x.minus(end);
      const c1 = 2.0 / u.dot(u);
      const c2 = 2.0 / v.dot(v);
      const c3 = c1 * c2 * u.dot(v);
      return this.rowMajor(-c1 * u.x * u.x - c2 * v.x * v.x + c3 * v.x * u.x + 1, -c1 * u.x * u.y - c2 * v.x * v.y + c3 * v.x * u.y, -c1 * u.x * u.z - c2 * v.x * v.z + c3 * v.x * u.z, -c1 * u.y * u.x - c2 * v.y * v.x + c3 * v.y * u.x, -c1 * u.y * u.y - c2 * v.y * v.y + c3 * v.y * u.y + 1, -c1 * u.y * u.z - c2 * v.y * v.z + c3 * v.y * u.z, -c1 * u.z * u.x - c2 * v.z * v.x + c3 * v.z * u.x, -c1 * u.z * u.y - c2 * v.z * v.y + c3 * v.z * u.y, -c1 * u.z * u.z - c2 * v.z * v.z + c3 * v.z * u.z + 1);
    } else {
      // the most common case, unless "start"="end", or "start"=-"end"
      const h = 1.0 / (1.0 + e);
      const hvx = h * v.x;
      const hvz = h * v.z;
      const hvxy = hvx * v.y;
      const hvxz = hvx * v.z;
      const hvyz = hvz * v.y;
      return this.rowMajor(e + hvx * v.x, hvxy - v.z, hvxz + v.y, hvxy + v.z, e + h * v.y * v.y, hvyz - v.x, hvxz - v.y, hvyz + v.x, e + hvz * v.z);
    }
  }

  /*---------------------------------------------------------------------------*
   * Mutable operations (changes the parameter)
   *----------------------------------------------------------------------------*/

  /**
   * Sets the vector to the result of (matrix * vector), as a homogeneous multiplication.
   *
   * @returns - The vector that was mutated
   */
  multiplyVector2(vector2) {
    return vector2.setXY(this.m00() * vector2.x + this.m01() * vector2.y + this.m02(), this.m10() * vector2.x + this.m11() * vector2.y + this.m12());
  }

  /**
   * Sets the vector to the result of (matrix * vector).
   *
   * @returns - The vector that was mutated
   */
  multiplyVector3(vector3) {
    return vector3.setXYZ(this.m00() * vector3.x + this.m01() * vector3.y + this.m02() * vector3.z, this.m10() * vector3.x + this.m11() * vector3.y + this.m12() * vector3.z, this.m20() * vector3.x + this.m21() * vector3.y + this.m22() * vector3.z);
  }

  /**
   * Sets the vector to the result of (transpose(matrix) * vector), ignoring the translation parameters.
   *
   * @returns - The vector that was mutated
   */
  multiplyTransposeVector2(v) {
    return v.setXY(this.m00() * v.x + this.m10() * v.y, this.m01() * v.x + this.m11() * v.y);
  }

  /**
   * Sets the vector to the result of (matrix * vector - matrix * zero). Since this is a homogeneous operation, it is
   * equivalent to the multiplication of (x,y,0).
   *
   * @returns - The vector that was mutated
   */
  multiplyRelativeVector2(v) {
    return v.setXY(this.m00() * v.x + this.m01() * v.y, this.m10() * v.y + this.m11() * v.y);
  }

  /**
   * Sets the transform of a Canvas 2D rendering context to the affine part of this matrix
   */
  canvasSetTransform(context) {
    context.setTransform(
    // inlined array entries
    this.entries[0], this.entries[1], this.entries[3], this.entries[4], this.entries[6], this.entries[7]);
  }

  /**
   * Appends to the affine part of this matrix to the Canvas 2D rendering context
   */
  canvasAppendTransform(context) {
    if (this.type !== Matrix3Type.IDENTITY) {
      context.transform(
      // inlined array entries
      this.entries[0], this.entries[1], this.entries[3], this.entries[4], this.entries[6], this.entries[7]);
    }
  }

  /**
   * Copies the entries of this matrix over to an arbitrary array (typed or normal).
   */
  copyToArray(array) {
    array[0] = this.m00();
    array[1] = this.m10();
    array[2] = this.m20();
    array[3] = this.m01();
    array[4] = this.m11();
    array[5] = this.m21();
    array[6] = this.m02();
    array[7] = this.m12();
    array[8] = this.m22();
    return array;
  }
  freeToPool() {
    Matrix3.pool.freeToPool(this);
  }
  static pool = new Pool(Matrix3, {
    initialize: Matrix3.prototype.initialize,
    useDefaultConstruction: true,
    maxSize: 300
  });

  /**
   * Returns an identity matrix.
   */
  static identity() {
    return fromPool().setToIdentity();
  }

  /**
   * Returns a translation matrix.
   */
  static translation(x, y) {
    return fromPool().setToTranslation(x, y);
  }

  /**
   * Returns a translation matrix computed from a vector.
   */
  static translationFromVector(vector) {
    return Matrix3.translation(vector.x, vector.y);
  }

  /**
   * Returns a matrix that scales things in each dimension.
   */
  static scaling(x, y) {
    return fromPool().setToScale(x, y);
  }

  /**
   * Returns a matrix that scales things in each dimension.
   */
  static scale(x, y) {
    return Matrix3.scaling(x, y);
  }

  /**
   * Returns an affine matrix with the given parameters.
   */
  static affine(m00, m01, m02, m10, m11, m12) {
    return fromPool().setToAffine(m00, m01, m02, m10, m11, m12);
  }

  /**
   * Creates a new matrix with all entries determined in row-major order.
   */
  static rowMajor(v00, v01, v02, v10, v11, v12, v20, v21, v22, type) {
    return fromPool().rowMajor(v00, v01, v02, v10, v11, v12, v20, v21, v22, type);
  }

  /**
   * Returns a matrix rotation defined by a rotation of the specified angle around the given unit axis.
   *
   * @param axis - normalized
   * @param angle - in radians
   */
  static rotationAxisAngle(axis, angle) {
    return fromPool().setToRotationAxisAngle(axis, angle);
  }

  /**
   * Returns a matrix that rotates around the x axis (in the yz plane).
   *
   * @param angle - in radians
   */
  static rotationX(angle) {
    return fromPool().setToRotationX(angle);
  }

  /**
   * Returns a matrix that rotates around the y axis (in the xz plane).
   *
   * @param angle - in radians
   */
  static rotationY(angle) {
    return fromPool().setToRotationY(angle);
  }

  /**
   * Returns a matrix that rotates around the z axis (in the xy plane).
   *
   * @param angle - in radians
   */
  static rotationZ(angle) {
    return fromPool().setToRotationZ(angle);
  }

  /**
   * Returns a combined 2d translation + rotation (with the rotation effectively applied first).
   *
   * @param angle - in radians
   */
  static translationRotation(x, y, angle) {
    return fromPool().setToTranslationRotation(x, y, angle);
  }

  /**
   * Standard 2d rotation matrix for a given angle.
   *
   * @param angle - in radians
   */
  static rotation2(angle) {
    return fromPool().setToRotationZ(angle);
  }

  /**
   * Returns a matrix which will be a 2d rotation around a given x,y point.
   *
   * @param angle - in radians
   * @param x
   * @param y
   */
  static rotationAround(angle, x, y) {
    return Matrix3.translation(x, y).timesMatrix(Matrix3.rotation2(angle)).timesMatrix(Matrix3.translation(-x, -y));
  }

  /**
   * Returns a matrix which will be a 2d rotation around a given 2d point.
   *
   * @param angle - in radians
   * @param point
   */
  static rotationAroundPoint(angle, point) {
    return Matrix3.rotationAround(angle, point.x, point.y);
  }

  /**
   * Returns a matrix equivalent to a given SVGMatrix.
   */
  static fromSVGMatrix(svgMatrix) {
    return fromPool().setToSVGMatrix(svgMatrix);
  }

  /**
   * Returns a rotation matrix that rotates A to B, by rotating about the axis A.cross( B ) -- Shortest path. ideally
   * should be unit vectors.
   */
  static rotateAToB(a, b) {
    return fromPool().setRotationAToB(a, b);
  }

  /**
   * Shortcut for translation times a matrix (without allocating a translation matrix), see scenery#119
   */
  static translationTimesMatrix(x, y, matrix) {
    let type;
    if (matrix.type === Matrix3Type.IDENTITY || matrix.type === Matrix3Type.TRANSLATION_2D) {
      return m3(1, 0, matrix.m02() + x, 0, 1, matrix.m12() + y, 0, 0, 1, Matrix3Type.TRANSLATION_2D);
    } else if (matrix.type === Matrix3Type.OTHER) {
      type = Matrix3Type.OTHER;
    } else {
      type = Matrix3Type.AFFINE;
    }
    return m3(matrix.m00(), matrix.m01(), matrix.m02() + x, matrix.m10(), matrix.m11(), matrix.m12() + y, matrix.m20(), matrix.m21(), matrix.m22(), type);
  }

  /**
   * Serialize to an Object that can be handled by PhET-iO
   */
  static toStateObject(matrix3) {
    return {
      entries: matrix3.entries,
      type: matrix3.type.name
    };
  }

  /**
   * Convert back from a serialized Object to a Matrix3
   */
  static fromStateObject(stateObject) {
    const matrix = Matrix3.identity();
    matrix.entries = stateObject.entries;
    matrix.type = Matrix3Type.enumeration.getValue(stateObject.type);
    return matrix;
  }

  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
}
dot.register('Matrix3', Matrix3);
const fromPool = Matrix3.pool.fetch.bind(Matrix3.pool);
const m3 = (v00, v01, v02, v10, v11, v12, v20, v21, v22, type) => {
  return fromPool().rowMajor(v00, v01, v02, v10, v11, v12, v20, v21, v22, type);
};
export { m3 };
dot.register('m3', m3);
Matrix3.IDENTITY = Matrix3.identity().makeImmutable();
Matrix3.X_REFLECTION = m3(-1, 0, 0, 0, 1, 0, 0, 0, 1, Matrix3Type.AFFINE).makeImmutable();
Matrix3.Y_REFLECTION = m3(1, 0, 0, 0, -1, 0, 0, 0, 1, Matrix3Type.AFFINE).makeImmutable();
Matrix3.Matrix3IO = new IOType('Matrix3IO', {
  valueType: Matrix3,
  documentation: 'A 3x3 matrix often used for holding transform data.',
  toStateObject: matrix3 => Matrix3.toStateObject(matrix3),
  fromStateObject: Matrix3.fromStateObject,
  stateSchema: {
    entries: ArrayIO(NumberIO),
    type: EnumerationIO(Matrix3Type)
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFbnVtZXJhdGlvbklPIiwiQXJyYXlJTyIsIklPVHlwZSIsIk51bWJlcklPIiwiZG90IiwiTWF0cml4NCIsInRvU1ZHTnVtYmVyIiwiVmVjdG9yMiIsIlZlY3RvcjMiLCJFbnVtZXJhdGlvblZhbHVlIiwiRW51bWVyYXRpb24iLCJQb29sIiwiTWF0cml4M1R5cGUiLCJPVEhFUiIsIklERU5USVRZIiwiVFJBTlNMQVRJT05fMkQiLCJTQ0FMSU5HIiwiQUZGSU5FIiwiZW51bWVyYXRpb24iLCJNYXRyaXgzIiwiY29uc3RydWN0b3IiLCJhc3NlcnQiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJlbnRyaWVzIiwidHlwZSIsImluaXRpYWxpemUiLCJtMDAiLCJtMDEiLCJtMDIiLCJtMTAiLCJtMTEiLCJtMTIiLCJtMjAiLCJtMjEiLCJtMjIiLCJpc0lkZW50aXR5IiwiZXF1YWxzIiwiaXNGYXN0SWRlbnRpdHkiLCJpc1RyYW5zbGF0aW9uIiwiaXNBZmZpbmUiLCJpc0FsaWduZWQiLCJpc0F4aXNBbGlnbmVkIiwiaXNGaW5pdGUiLCJnZXREZXRlcm1pbmFudCIsImRldGVybWluYW50IiwiZ2V0VHJhbnNsYXRpb24iLCJ0cmFuc2xhdGlvbiIsImdldFNjYWxlVmVjdG9yIiwiTWF0aCIsInNxcnQiLCJzY2FsZVZlY3RvciIsImdldFNpZ25lZFNjYWxlIiwiZ2V0Um90YXRpb24iLCJhdGFuMiIsInJvdGF0aW9uIiwidG9NYXRyaXg0IiwidG9BZmZpbmVNYXRyaXg0IiwidG9TdHJpbmciLCJ0b1NWR01hdHJpeCIsInJlc3VsdCIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudE5TIiwiY3JlYXRlU1ZHTWF0cml4IiwiYSIsImIiLCJjIiwiZCIsImUiLCJmIiwiZ2V0Q1NTVHJhbnNmb3JtIiwidG9GaXhlZCIsImNzc1RyYW5zZm9ybSIsImdldFNWR1RyYW5zZm9ybSIsInN2Z1RyYW5zZm9ybSIsImdldENTU1RyYW5zZm9ybVN0eWxlcyIsInRyYW5zZm9ybUNTUyIsInRyYW5zZm9ybSIsImNzc1RyYW5zZm9ybVN0eWxlcyIsIm1hdHJpeCIsImVxdWFsc0Vwc2lsb24iLCJlcHNpbG9uIiwiYWJzIiwiY29weSIsIm0zIiwicGx1cyIsIm1pbnVzIiwidHJhbnNwb3NlZCIsInVuZGVmaW5lZCIsIm5lZ2F0ZWQiLCJpbnZlcnRlZCIsImRldCIsIkVycm9yIiwidGltZXNNYXRyaXgiLCJ0aW1lc1ZlY3RvcjIiLCJ2ZWN0b3IyIiwieCIsInkiLCJ0aW1lc1ZlY3RvcjMiLCJ2ZWN0b3IzIiwieiIsInRpbWVzVHJhbnNwb3NlVmVjdG9yMiIsInRpbWVzUmVsYXRpdmVWZWN0b3IyIiwicm93TWFqb3IiLCJ2MDAiLCJ2MDEiLCJ2MDIiLCJ2MTAiLCJ2MTEiLCJ2MTIiLCJ2MjAiLCJ2MjEiLCJ2MjIiLCJzZXQiLCJzZXRBcnJheSIsImFycmF5Iiwic2V0MDAiLCJ2YWx1ZSIsInNldDAxIiwic2V0MDIiLCJzZXQxMCIsInNldDExIiwic2V0MTIiLCJzZXQyMCIsInNldDIxIiwic2V0MjIiLCJtYWtlSW1tdXRhYmxlIiwiY29sdW1uTWFqb3IiLCJhZGQiLCJzdWJ0cmFjdCIsIm0iLCJ0cmFuc3Bvc2UiLCJuZWdhdGUiLCJpbnZlcnQiLCJtdWx0aXBseU1hdHJpeCIsInByZXBlbmRUcmFuc2xhdGlvbiIsInNldFRvSWRlbnRpdHkiLCJzZXRUb1RyYW5zbGF0aW9uIiwic2V0VG9TY2FsZSIsInNldFRvQWZmaW5lIiwic2V0VG9Sb3RhdGlvbkF4aXNBbmdsZSIsImF4aXMiLCJhbmdsZSIsImNvcyIsInMiLCJzaW4iLCJDIiwic2V0VG9Sb3RhdGlvblgiLCJzZXRUb1JvdGF0aW9uWSIsInNldFRvUm90YXRpb25aIiwic2V0VG9UcmFuc2xhdGlvblJvdGF0aW9uIiwic2V0VG9UcmFuc2xhdGlvblJvdGF0aW9uUG9pbnQiLCJzZXRUb1NjYWxlVHJhbnNsYXRpb25Sb3RhdGlvbiIsInNjYWxlIiwic2V0VG9TY2FsZVRyYW5zbGF0aW9uUm90YXRpb25Qb2ludCIsInNldFRvU1ZHTWF0cml4Iiwic3ZnTWF0cml4Iiwic2V0Um90YXRpb25BVG9CIiwic3RhcnQiLCJlbmQiLCJ2IiwiY3Jvc3MiLCJYX1VOSVQiLCJaX1VOSVQiLCJZX1VOSVQiLCJ1IiwiYzEiLCJjMiIsImMzIiwiaCIsImh2eCIsImh2eiIsImh2eHkiLCJodnh6IiwiaHZ5eiIsIm11bHRpcGx5VmVjdG9yMiIsInNldFhZIiwibXVsdGlwbHlWZWN0b3IzIiwic2V0WFlaIiwibXVsdGlwbHlUcmFuc3Bvc2VWZWN0b3IyIiwibXVsdGlwbHlSZWxhdGl2ZVZlY3RvcjIiLCJjYW52YXNTZXRUcmFuc2Zvcm0iLCJjb250ZXh0Iiwic2V0VHJhbnNmb3JtIiwiY2FudmFzQXBwZW5kVHJhbnNmb3JtIiwiY29weVRvQXJyYXkiLCJmcmVlVG9Qb29sIiwicG9vbCIsInByb3RvdHlwZSIsInVzZURlZmF1bHRDb25zdHJ1Y3Rpb24iLCJtYXhTaXplIiwiaWRlbnRpdHkiLCJmcm9tUG9vbCIsInRyYW5zbGF0aW9uRnJvbVZlY3RvciIsInZlY3RvciIsInNjYWxpbmciLCJhZmZpbmUiLCJyb3RhdGlvbkF4aXNBbmdsZSIsInJvdGF0aW9uWCIsInJvdGF0aW9uWSIsInJvdGF0aW9uWiIsInRyYW5zbGF0aW9uUm90YXRpb24iLCJyb3RhdGlvbjIiLCJyb3RhdGlvbkFyb3VuZCIsInJvdGF0aW9uQXJvdW5kUG9pbnQiLCJwb2ludCIsImZyb21TVkdNYXRyaXgiLCJyb3RhdGVBVG9CIiwidHJhbnNsYXRpb25UaW1lc01hdHJpeCIsInRvU3RhdGVPYmplY3QiLCJtYXRyaXgzIiwibmFtZSIsImZyb21TdGF0ZU9iamVjdCIsInN0YXRlT2JqZWN0IiwiZ2V0VmFsdWUiLCJyZWdpc3RlciIsImZldGNoIiwiYmluZCIsIlhfUkVGTEVDVElPTiIsIllfUkVGTEVDVElPTiIsIk1hdHJpeDNJTyIsInZhbHVlVHlwZSIsImRvY3VtZW50YXRpb24iLCJzdGF0ZVNjaGVtYSJdLCJzb3VyY2VzIjpbIk1hdHJpeDMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogMy1kaW1lbnNpb25hbCBNYXRyaXhcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBFbnVtZXJhdGlvbklPIGZyb20gJy4uLy4uL3RhbmRlbS9qcy90eXBlcy9FbnVtZXJhdGlvbklPLmpzJztcclxuaW1wb3J0IEFycmF5SU8gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0FycmF5SU8uanMnO1xyXG5pbXBvcnQgSU9UeXBlIGZyb20gJy4uLy4uL3RhbmRlbS9qcy90eXBlcy9JT1R5cGUuanMnO1xyXG5pbXBvcnQgTnVtYmVySU8gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL051bWJlcklPLmpzJztcclxuaW1wb3J0IGRvdCBmcm9tICcuL2RvdC5qcyc7XHJcbmltcG9ydCBNYXRyaXg0IGZyb20gJy4vTWF0cml4NC5qcyc7XHJcbmltcG9ydCB0b1NWR051bWJlciBmcm9tICcuL3RvU1ZHTnVtYmVyLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi9WZWN0b3IyLmpzJztcclxuaW1wb3J0IFZlY3RvcjMgZnJvbSAnLi9WZWN0b3IzLmpzJztcclxuaW1wb3J0IEVudW1lcmF0aW9uVmFsdWUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL0VudW1lcmF0aW9uVmFsdWUuanMnO1xyXG5pbXBvcnQgRW51bWVyYXRpb24gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL0VudW1lcmF0aW9uLmpzJztcclxuaW1wb3J0IFBvb2wsIHsgVFBvb2xhYmxlIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL1Bvb2wuanMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIE1hdHJpeDNUeXBlIGV4dGVuZHMgRW51bWVyYXRpb25WYWx1ZSB7XHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBPVEhFUiA9IG5ldyBNYXRyaXgzVHlwZSgpO1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgSURFTlRJVFkgPSBuZXcgTWF0cml4M1R5cGUoKTtcclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFRSQU5TTEFUSU9OXzJEID0gbmV3IE1hdHJpeDNUeXBlKCk7XHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBTQ0FMSU5HID0gbmV3IE1hdHJpeDNUeXBlKCk7XHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBBRkZJTkUgPSBuZXcgTWF0cml4M1R5cGUoKTtcclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBlbnVtZXJhdGlvbiA9IG5ldyBFbnVtZXJhdGlvbiggTWF0cml4M1R5cGUgKTtcclxufVxyXG5cclxudHlwZSBOaW5lTnVtYmVycyA9IFtcclxuICBudW1iZXIsIG51bWJlciwgbnVtYmVyLFxyXG4gIG51bWJlciwgbnVtYmVyLCBudW1iZXIsXHJcbiAgbnVtYmVyLCBudW1iZXIsIG51bWJlclxyXG5dO1xyXG5cclxuZXhwb3J0IHR5cGUgTWF0cml4M1N0YXRlT2JqZWN0ID0ge1xyXG4gIGVudHJpZXM6IE5pbmVOdW1iZXJzO1xyXG4gIHR5cGU6IHN0cmluZztcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1hdHJpeDMgaW1wbGVtZW50cyBUUG9vbGFibGUge1xyXG5cclxuICAvLyBFbnRyaWVzIHN0b3JlZCBpbiBjb2x1bW4tbWFqb3IgZm9ybWF0XHJcbiAgcHVibGljIGVudHJpZXM6IE5pbmVOdW1iZXJzO1xyXG5cclxuICBwdWJsaWMgdHlwZTogTWF0cml4M1R5cGU7XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gaWRlbnRpdHkgbWF0cml4LCB0aGF0IGNhbiB0aGVuIGJlIG11dGF0ZWQgaW50byB0aGUgcHJvcGVyIGZvcm0uXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgLy9NYWtlIHN1cmUgbm8gY2xpZW50cyBhcmUgZXhwZWN0aW5nIHRvIGNyZWF0ZSBhIG1hdHJpeCB3aXRoIG5vbi1pZGVudGl0eSB2YWx1ZXNcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGFyZ3VtZW50cy5sZW5ndGggPT09IDAsICdNYXRyaXgzIGNvbnN0cnVjdG9yIHNob3VsZCBub3QgYmUgY2FsbGVkIHdpdGggYW55IGFyZ3VtZW50cy4gIFVzZSBtMygpL01hdHJpeDMuaWRlbnRpdHkoKS9ldGMuJyApO1xyXG5cclxuICAgIHRoaXMuZW50cmllcyA9IFsgMSwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMSBdO1xyXG4gICAgdGhpcy50eXBlID0gTWF0cml4M1R5cGUuSURFTlRJVFk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaW5pdGlhbGl6ZSgpOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udmVuaWVuY2UgZ2V0dGVyIGZvciB0aGUgaW5kaXZpZHVhbCAwLDAgZW50cnkgb2YgdGhlIG1hdHJpeC5cclxuICAgKi9cclxuICBwdWJsaWMgbTAwKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5lbnRyaWVzWyAwIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZW5pZW5jZSBnZXR0ZXIgZm9yIHRoZSBpbmRpdmlkdWFsIDAsMSBlbnRyeSBvZiB0aGUgbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtMDEoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmVudHJpZXNbIDMgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlbmllbmNlIGdldHRlciBmb3IgdGhlIGluZGl2aWR1YWwgMCwyIGVudHJ5IG9mIHRoZSBtYXRyaXguXHJcbiAgICovXHJcbiAgcHVibGljIG0wMigpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZW50cmllc1sgNiBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udmVuaWVuY2UgZ2V0dGVyIGZvciB0aGUgaW5kaXZpZHVhbCAxLDAgZW50cnkgb2YgdGhlIG1hdHJpeC5cclxuICAgKi9cclxuICBwdWJsaWMgbTEwKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5lbnRyaWVzWyAxIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZW5pZW5jZSBnZXR0ZXIgZm9yIHRoZSBpbmRpdmlkdWFsIDEsMSBlbnRyeSBvZiB0aGUgbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtMTEoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmVudHJpZXNbIDQgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlbmllbmNlIGdldHRlciBmb3IgdGhlIGluZGl2aWR1YWwgMSwyIGVudHJ5IG9mIHRoZSBtYXRyaXguXHJcbiAgICovXHJcbiAgcHVibGljIG0xMigpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZW50cmllc1sgNyBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udmVuaWVuY2UgZ2V0dGVyIGZvciB0aGUgaW5kaXZpZHVhbCAyLDAgZW50cnkgb2YgdGhlIG1hdHJpeC5cclxuICAgKi9cclxuICBwdWJsaWMgbTIwKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5lbnRyaWVzWyAyIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZW5pZW5jZSBnZXR0ZXIgZm9yIHRoZSBpbmRpdmlkdWFsIDIsMSBlbnRyeSBvZiB0aGUgbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtMjEoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmVudHJpZXNbIDUgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlbmllbmNlIGdldHRlciBmb3IgdGhlIGluZGl2aWR1YWwgMiwyIGVudHJ5IG9mIHRoZSBtYXRyaXguXHJcbiAgICovXHJcbiAgcHVibGljIG0yMigpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZW50cmllc1sgOCBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgbWF0cml4IGlzIGFuIGlkZW50aXR5IG1hdHJpeC5cclxuICAgKi9cclxuICBwdWJsaWMgaXNJZGVudGl0eSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnR5cGUgPT09IE1hdHJpeDNUeXBlLklERU5USVRZIHx8IHRoaXMuZXF1YWxzKCBNYXRyaXgzLklERU5USVRZICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBtYXRyaXggaXMgbGlrZWx5IHRvIGJlIGFuIGlkZW50aXR5IG1hdHJpeCAocmV0dXJuaW5nIGZhbHNlIG1lYW5zIFwiaW5jb25jbHVzaXZlLCBtYXkgYmVcclxuICAgKiBpZGVudGl0eSBvciBub3RcIiksIGJ1dCB0cnVlIGlzIGd1YXJhbnRlZWQgdG8gYmUgYW4gaWRlbnRpdHkgbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0Zhc3RJZGVudGl0eSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnR5cGUgPT09IE1hdHJpeDNUeXBlLklERU5USVRZO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgbWF0cml4IGlzIGEgdHJhbnNsYXRpb24gbWF0cml4LlxyXG4gICAqIEJ5IHRoaXMgd2UgbWVhbiBpdCBoYXMgbm8gc2hlYXIsIHJvdGF0aW9uLCBvciBzY2FsaW5nXHJcbiAgICogSXQgbWF5IGJlIGEgdHJhbnNsYXRpb24gb2YgemVyby5cclxuICAgKi9cclxuICBwdWJsaWMgaXNUcmFuc2xhdGlvbigpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnR5cGUgPT09IE1hdHJpeDNUeXBlLlRSQU5TTEFUSU9OXzJEIHx8ICggdGhpcy5tMDAoKSA9PT0gMSAmJiB0aGlzLm0xMSgpID09PSAxICYmIHRoaXMubTIyKCkgPT09IDEgJiYgdGhpcy5tMDEoKSA9PT0gMCAmJiB0aGlzLm0xMCgpID09PSAwICYmIHRoaXMubTIwKCkgPT09IDAgJiYgdGhpcy5tMjEoKSA9PT0gMCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgbWF0cml4IGlzIGFuIGFmZmluZSBtYXRyaXggKGUuZy4gbm8gc2hlYXIpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0FmZmluZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnR5cGUgPT09IE1hdHJpeDNUeXBlLkFGRklORSB8fCAoIHRoaXMubTIwKCkgPT09IDAgJiYgdGhpcy5tMjEoKSA9PT0gMCAmJiB0aGlzLm0yMigpID09PSAxICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgaXQncyBhbiBhZmZpbmUgbWF0cml4IHdoZXJlIHRoZSBjb21wb25lbnRzIG9mIHRyYW5zZm9ybXMgYXJlIGluZGVwZW5kZW50LCBpLmUuIGNvbnN0cnVjdGVkIGZyb21cclxuICAgKiBhcmJpdHJhcnkgY29tcG9uZW50IHNjYWxpbmcgYW5kIHRyYW5zbGF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0FsaWduZWQoKTogYm9vbGVhbiB7XHJcbiAgICAvLyBub24tZGlhZ29uYWwgbm9uLXRyYW5zbGF0aW9uIGVudHJpZXMgc2hvdWxkIGFsbCBiZSB6ZXJvLlxyXG4gICAgcmV0dXJuIHRoaXMuaXNBZmZpbmUoKSAmJiB0aGlzLm0wMSgpID09PSAwICYmIHRoaXMubTEwKCkgPT09IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGlmIGl0J3MgYW4gYWZmaW5lIG1hdHJpeCB3aGVyZSB0aGUgY29tcG9uZW50cyBvZiB0cmFuc2Zvcm1zIGFyZSBpbmRlcGVuZGVudCwgYnV0IG1heSBiZSBzd2l0Y2hlZCAodW5saWtlIGlzQWxpZ25lZClcclxuICAgKlxyXG4gICAqIGkuZS4gdGhlIDJ4MiByb3RhdGlvbmFsIHN1Yi1tYXRyaXggaXMgb2Ygb25lIG9mIHRoZSB0d28gZm9ybXM6XHJcbiAgICogQSAwICBvciAgMCAgQVxyXG4gICAqIDAgQiAgICAgIEIgIDBcclxuICAgKiBUaGlzIG1lYW5zIHRoYXQgbW92aW5nIGEgdHJhbnNmb3JtZWQgcG9pbnQgYnkgKHgsMCkgb3IgKDAseSkgd2lsbCByZXN1bHQgaW4gYSBtb3Rpb24gYWxvbmcgb25lIG9mIHRoZSBheGVzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0F4aXNBbGlnbmVkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaXNBZmZpbmUoKSAmJiAoICggdGhpcy5tMDEoKSA9PT0gMCAmJiB0aGlzLm0xMCgpID09PSAwICkgfHwgKCB0aGlzLm0wMCgpID09PSAwICYmIHRoaXMubTExKCkgPT09IDAgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIGV2ZXJ5IHNpbmdsZSBlbnRyeSBpbiB0aGlzIG1hdHJpeCBpcyBhIGZpbml0ZSBudW1iZXIgKG5vbi1OYU4sIG5vbi1pbmZpbml0ZSkuXHJcbiAgICovXHJcbiAgcHVibGljIGlzRmluaXRlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIGlzRmluaXRlKCB0aGlzLm0wMCgpICkgJiZcclxuICAgICAgICAgICBpc0Zpbml0ZSggdGhpcy5tMDEoKSApICYmXHJcbiAgICAgICAgICAgaXNGaW5pdGUoIHRoaXMubTAyKCkgKSAmJlxyXG4gICAgICAgICAgIGlzRmluaXRlKCB0aGlzLm0xMCgpICkgJiZcclxuICAgICAgICAgICBpc0Zpbml0ZSggdGhpcy5tMTEoKSApICYmXHJcbiAgICAgICAgICAgaXNGaW5pdGUoIHRoaXMubTEyKCkgKSAmJlxyXG4gICAgICAgICAgIGlzRmluaXRlKCB0aGlzLm0yMCgpICkgJiZcclxuICAgICAgICAgICBpc0Zpbml0ZSggdGhpcy5tMjEoKSApICYmXHJcbiAgICAgICAgICAgaXNGaW5pdGUoIHRoaXMubTIyKCkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGRldGVybWluYW50IG9mIHRoaXMgbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXREZXRlcm1pbmFudCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMubTAwKCkgKiB0aGlzLm0xMSgpICogdGhpcy5tMjIoKSArIHRoaXMubTAxKCkgKiB0aGlzLm0xMigpICogdGhpcy5tMjAoKSArIHRoaXMubTAyKCkgKiB0aGlzLm0xMCgpICogdGhpcy5tMjEoKSAtIHRoaXMubTAyKCkgKiB0aGlzLm0xMSgpICogdGhpcy5tMjAoKSAtIHRoaXMubTAxKCkgKiB0aGlzLm0xMCgpICogdGhpcy5tMjIoKSAtIHRoaXMubTAwKCkgKiB0aGlzLm0xMigpICogdGhpcy5tMjEoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZGV0ZXJtaW5hbnQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0RGV0ZXJtaW5hbnQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSAyRCB0cmFuc2xhdGlvbiwgYXNzdW1pbmcgbXVsdGlwbGljYXRpb24gd2l0aCBhIGhvbW9nZW5lb3VzIHZlY3RvclxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRUcmFuc2xhdGlvbigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiBuZXcgVmVjdG9yMiggdGhpcy5tMDIoKSwgdGhpcy5tMTIoKSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB0cmFuc2xhdGlvbigpOiBWZWN0b3IyIHsgcmV0dXJuIHRoaXMuZ2V0VHJhbnNsYXRpb24oKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgdmVjdG9yIHRoYXQgaXMgZXF1aXZhbGVudCB0byAoIFQoMSwwKS5tYWduaXR1ZGUoKSwgVCgwLDEpLm1hZ25pdHVkZSgpICkgd2hlcmUgVCBpcyBhIHJlbGF0aXZlIHRyYW5zZm9ybVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTY2FsZVZlY3RvcigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiBuZXcgVmVjdG9yMihcclxuICAgICAgTWF0aC5zcXJ0KCB0aGlzLm0wMCgpICogdGhpcy5tMDAoKSArIHRoaXMubTEwKCkgKiB0aGlzLm0xMCgpICksXHJcbiAgICAgIE1hdGguc3FydCggdGhpcy5tMDEoKSAqIHRoaXMubTAxKCkgKyB0aGlzLm0xMSgpICogdGhpcy5tMTEoKSApICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHNjYWxlVmVjdG9yKCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRTY2FsZVZlY3RvcigpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHRvdGFsIFwiYW1vdW50XCIgb2Ygc2NhbGVkIGFyZWEgaW4gdGhpcyBtYXRyaXggKHdoaWNoIHdpbGwgYmUgbmVnYXRpdmUgaWYgaXQgZmxpcHMgdGhlIGNvb3JkaW5hdGUgc3lzdGVtKS5cclxuICAgKiBGb3IgaW5zdGFuY2UsIE1hdHJpeDMuc2NhbGluZyggMiApIHdpbGwgcmV0dXJuIDQsIHNpbmNlIGl0IHNjYWxlcyB0aGUgYXJlYSBieSA0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTaWduZWRTY2FsZSgpOiBudW1iZXIge1xyXG4gICAgLy8gSXQncyB0aGUgY3Jvc3MgcHJvZHVjdCBvZiB1bnRyYW5zbGF0ZWQtdHJhbnNmb3JtZWQtKDEsMCkgYW5kIHVudHJhbnNsYXRlZC10cmFuc2Zvcm1lZC0oMCwxKVxyXG4gICAgcmV0dXJuIHRoaXMubTAwKCkgKiB0aGlzLm0xMSgpIC0gdGhpcy5tMTAoKSAqIHRoaXMubTAxKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBhbmdsZSBpbiByYWRpYW5zIGZvciB0aGUgMmQgcm90YXRpb24gZnJvbSB0aGlzIG1hdHJpeCwgYmV0d2VlbiBwaSwgLXBpXHJcbiAgICovXHJcbiAgcHVibGljIGdldFJvdGF0aW9uKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gTWF0aC5hdGFuMiggdGhpcy5tMTAoKSwgdGhpcy5tMDAoKSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCByb3RhdGlvbigpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRSb3RhdGlvbigpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gaWRlbnRpdHktcGFkZGVkIGNvcHkgb2YgdGhpcyBtYXRyaXggd2l0aCBhbiBpbmNyZWFzZWQgZGltZW5zaW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b01hdHJpeDQoKTogTWF0cml4NCB7XHJcbiAgICByZXR1cm4gbmV3IE1hdHJpeDQoXHJcbiAgICAgIHRoaXMubTAwKCksIHRoaXMubTAxKCksIHRoaXMubTAyKCksIDAsXHJcbiAgICAgIHRoaXMubTEwKCksIHRoaXMubTExKCksIHRoaXMubTEyKCksIDAsXHJcbiAgICAgIHRoaXMubTIwKCksIHRoaXMubTIxKCksIHRoaXMubTIyKCksIDAsXHJcbiAgICAgIDAsIDAsIDAsIDEgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gaWRlbnRpdHktcGFkZGVkIGNvcHkgb2YgdGhpcyBtYXRyaXggd2l0aCBhbiBpbmNyZWFzZWQgZGltZW5zaW9uLCB0cmVhdGluZyB0aGlzIG1hdHJpeCdzIGFmZmluZVxyXG4gICAqIGNvbXBvbmVudHMgb25seS5cclxuICAgKi9cclxuICBwdWJsaWMgdG9BZmZpbmVNYXRyaXg0KCk6IE1hdHJpeDQge1xyXG4gICAgcmV0dXJuIG5ldyBNYXRyaXg0KFxyXG4gICAgICB0aGlzLm0wMCgpLCB0aGlzLm0wMSgpLCAwLCB0aGlzLm0wMigpLFxyXG4gICAgICB0aGlzLm0xMCgpLCB0aGlzLm0xMSgpLCAwLCB0aGlzLm0xMigpLFxyXG4gICAgICAwLCAwLCAxLCAwLFxyXG4gICAgICAwLCAwLCAwLCAxICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIGZvcm0gb2YgdGhpcyBvYmplY3RcclxuICAgKi9cclxuICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBgJHt0aGlzLm0wMCgpfSAke3RoaXMubTAxKCl9ICR7dGhpcy5tMDIoKX1cXG4ke1xyXG4gICAgICB0aGlzLm0xMCgpfSAke3RoaXMubTExKCl9ICR7dGhpcy5tMTIoKX1cXG4ke1xyXG4gICAgICB0aGlzLm0yMCgpfSAke3RoaXMubTIxKCl9ICR7dGhpcy5tMjIoKX1gO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBTVkcgZm9ybSBvZiB0aGlzIG1hdHJpeCwgZm9yIGhpZ2gtcGVyZm9ybWFuY2UgcHJvY2Vzc2luZyBpbiBTVkcgb3V0cHV0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b1NWR01hdHJpeCgpOiBTVkdNYXRyaXgge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCAnc3ZnJyApLmNyZWF0ZVNWR01hdHJpeCgpO1xyXG5cclxuICAgIC8vIHRvcCB0d28gcm93c1xyXG4gICAgcmVzdWx0LmEgPSB0aGlzLm0wMCgpO1xyXG4gICAgcmVzdWx0LmIgPSB0aGlzLm0xMCgpO1xyXG4gICAgcmVzdWx0LmMgPSB0aGlzLm0wMSgpO1xyXG4gICAgcmVzdWx0LmQgPSB0aGlzLm0xMSgpO1xyXG4gICAgcmVzdWx0LmUgPSB0aGlzLm0wMigpO1xyXG4gICAgcmVzdWx0LmYgPSB0aGlzLm0xMigpO1xyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBDU1MgZm9ybSAoc2ltcGxpZmllZCBpZiBwb3NzaWJsZSkgZm9yIHRoaXMgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDU1NUcmFuc2Zvcm0oKTogc3RyaW5nIHtcclxuICAgIC8vIFNlZSBodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLXRyYW5zZm9ybXMvLCBwYXJ0aWN1bGFybHkgU2VjdGlvbiAxMyB0aGF0IGRpc2N1c3NlcyB0aGUgU1ZHIGNvbXBhdGliaWxpdHlcclxuXHJcbiAgICAvLyBXZSBuZWVkIHRvIHByZXZlbnQgdGhlIG51bWJlcnMgZnJvbSBiZWluZyBpbiBhbiBleHBvbmVudGlhbCB0b1N0cmluZyBmb3JtLCBzaW5jZSB0aGUgQ1NTIHRyYW5zZm9ybSBkb2VzIG5vdCBzdXBwb3J0IHRoYXRcclxuICAgIC8vIDIwIGlzIHRoZSBsYXJnZXN0IGd1YXJhbnRlZWQgbnVtYmVyIG9mIGRpZ2l0cyBhY2NvcmRpbmcgdG8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9OdW1iZXIvdG9GaXhlZFxyXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9kb3QvaXNzdWVzLzM2XHJcblxyXG4gICAgLy8gdGhlIGlubmVyIHBhcnQgb2YgYSBDU1MzIHRyYW5zZm9ybSwgYnV0IHJlbWVtYmVyIHRvIGFkZCB0aGUgYnJvd3Nlci1zcGVjaWZpYyBwYXJ0cyFcclxuICAgIC8vIE5PVEU6IHRoZSB0b0ZpeGVkIGNhbGxzIGFyZSBpbmxpbmVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zXHJcbiAgICByZXR1cm4gYG1hdHJpeCgke3RoaXMuZW50cmllc1sgMCBdLnRvRml4ZWQoIDIwICl9LCR7dGhpcy5lbnRyaWVzWyAxIF0udG9GaXhlZCggMjAgKX0sJHt0aGlzLmVudHJpZXNbIDMgXS50b0ZpeGVkKCAyMCApfSwke3RoaXMuZW50cmllc1sgNCBdLnRvRml4ZWQoIDIwICl9LCR7dGhpcy5lbnRyaWVzWyA2IF0udG9GaXhlZCggMjAgKX0sJHt0aGlzLmVudHJpZXNbIDcgXS50b0ZpeGVkKCAyMCApfSlgOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJhZC1zaW0tdGV4dFxyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBjc3NUcmFuc2Zvcm0oKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuZ2V0Q1NTVHJhbnNmb3JtKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgQ1NTLWxpa2UgU1ZHIG1hdHJpeCBmb3JtIGZvciB0aGlzIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U1ZHVHJhbnNmb3JtKCk6IHN0cmluZyB7XHJcbiAgICAvLyBTVkcgdHJhbnNmb3JtIHByZXNlbnRhdGlvbiBhdHRyaWJ1dGUuIFNlZSBodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcvY29vcmRzLmh0bWwjVHJhbnNmb3JtQXR0cmlidXRlXHJcbiAgICBzd2l0Y2goIHRoaXMudHlwZSApIHtcclxuICAgICAgY2FzZSBNYXRyaXgzVHlwZS5JREVOVElUWTpcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgIGNhc2UgTWF0cml4M1R5cGUuVFJBTlNMQVRJT05fMkQ6XHJcbiAgICAgICAgcmV0dXJuIGB0cmFuc2xhdGUoJHt0b1NWR051bWJlciggdGhpcy5lbnRyaWVzWyA2IF0gKX0sJHt0b1NWR051bWJlciggdGhpcy5lbnRyaWVzWyA3IF0gKX0pYDtcclxuICAgICAgY2FzZSBNYXRyaXgzVHlwZS5TQ0FMSU5HOlxyXG4gICAgICAgIHJldHVybiBgc2NhbGUoJHt0b1NWR051bWJlciggdGhpcy5lbnRyaWVzWyAwIF0gKX0ke3RoaXMuZW50cmllc1sgMCBdID09PSB0aGlzLmVudHJpZXNbIDQgXSA/ICcnIDogYCwke3RvU1ZHTnVtYmVyKCB0aGlzLmVudHJpZXNbIDQgXSApfWB9KWA7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIGBtYXRyaXgoJHt0b1NWR051bWJlciggdGhpcy5lbnRyaWVzWyAwIF0gKX0sJHt0b1NWR051bWJlciggdGhpcy5lbnRyaWVzWyAxIF0gKX0sJHt0b1NWR051bWJlciggdGhpcy5lbnRyaWVzWyAzIF0gKX0sJHt0b1NWR051bWJlciggdGhpcy5lbnRyaWVzWyA0IF0gKX0sJHt0b1NWR051bWJlciggdGhpcy5lbnRyaWVzWyA2IF0gKX0sJHt0b1NWR051bWJlciggdGhpcy5lbnRyaWVzWyA3IF0gKX0pYDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc3ZnVHJhbnNmb3JtKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmdldFNWR1RyYW5zZm9ybSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBwYXJhbWV0ZXIgb2JqZWN0IHN1aXRhYmxlIGZvciB1c2Ugd2l0aCBqUXVlcnkncyAuY3NzKClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q1NTVHJhbnNmb3JtU3R5bGVzKCk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xyXG4gICAgY29uc3QgdHJhbnNmb3JtQ1NTID0gdGhpcy5nZXRDU1NUcmFuc2Zvcm0oKTtcclxuXHJcbiAgICAvLyBub3RlcyBvbiB0cmlnZ2VyaW5nIGhhcmR3YXJlIGFjY2VsZXJhdGlvbjogaHR0cDovL2NyZWF0aXZlanMuY29tLzIwMTEvMTIvZGF5LTItZ3B1LWFjY2VsZXJhdGUteW91ci1kb20tZWxlbWVudHMvXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAvLyBmb3JjZSBpT1MgaGFyZHdhcmUgYWNjZWxlcmF0aW9uXHJcbiAgICAgICctd2Via2l0LXBlcnNwZWN0aXZlJzogJzEwMDAnLFxyXG4gICAgICAnLXdlYmtpdC1iYWNrZmFjZS12aXNpYmlsaXR5JzogJ2hpZGRlbicsXHJcblxyXG4gICAgICAnLXdlYmtpdC10cmFuc2Zvcm0nOiBgJHt0cmFuc2Zvcm1DU1N9IHRyYW5zbGF0ZVooMClgLCAvLyB0cmlnZ2VyIGhhcmR3YXJlIGFjY2VsZXJhdGlvbiBpZiBwb3NzaWJsZVxyXG4gICAgICAnLW1vei10cmFuc2Zvcm0nOiBgJHt0cmFuc2Zvcm1DU1N9IHRyYW5zbGF0ZVooMClgLCAvLyB0cmlnZ2VyIGhhcmR3YXJlIGFjY2VsZXJhdGlvbiBpZiBwb3NzaWJsZVxyXG4gICAgICAnLW1zLXRyYW5zZm9ybSc6IHRyYW5zZm9ybUNTUyxcclxuICAgICAgJy1vLXRyYW5zZm9ybSc6IHRyYW5zZm9ybUNTUyxcclxuICAgICAgdHJhbnNmb3JtOiB0cmFuc2Zvcm1DU1MsXHJcbiAgICAgICd0cmFuc2Zvcm0tb3JpZ2luJzogJ3RvcCBsZWZ0JywgLy8gYXQgdGhlIG9yaWdpbiBvZiB0aGUgY29tcG9uZW50LiBjb25zaWRlciAwcHggMHB4IGluc3RlYWQuIENyaXRpY2FsLCBzaW5jZSBvdGhlcndpc2UgdGhpcyBkZWZhdWx0cyB0byA1MCUgNTAlISEhIHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0NTUy90cmFuc2Zvcm0tb3JpZ2luXHJcbiAgICAgICctbXMtdHJhbnNmb3JtLW9yaWdpbic6ICd0b3AgbGVmdCcgLy8gVE9ETzogZG8gd2UgbmVlZCBvdGhlciBwbGF0Zm9ybS1zcGVjaWZpYyB0cmFuc2Zvcm0tb3JpZ2luIHN0eWxlcz8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2RvdC9pc3N1ZXMvOTZcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGNzc1RyYW5zZm9ybVN0eWxlcygpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHsgcmV0dXJuIHRoaXMuZ2V0Q1NTVHJhbnNmb3JtU3R5bGVzKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBleGFjdCBlcXVhbGl0eSB3aXRoIGFub3RoZXIgbWF0cml4XHJcbiAgICovXHJcbiAgcHVibGljIGVxdWFscyggbWF0cml4OiBNYXRyaXgzICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMubTAwKCkgPT09IG1hdHJpeC5tMDAoKSAmJiB0aGlzLm0wMSgpID09PSBtYXRyaXgubTAxKCkgJiYgdGhpcy5tMDIoKSA9PT0gbWF0cml4Lm0wMigpICYmXHJcbiAgICAgICAgICAgdGhpcy5tMTAoKSA9PT0gbWF0cml4Lm0xMCgpICYmIHRoaXMubTExKCkgPT09IG1hdHJpeC5tMTEoKSAmJiB0aGlzLm0xMigpID09PSBtYXRyaXgubTEyKCkgJiZcclxuICAgICAgICAgICB0aGlzLm0yMCgpID09PSBtYXRyaXgubTIwKCkgJiYgdGhpcy5tMjEoKSA9PT0gbWF0cml4Lm0yMSgpICYmIHRoaXMubTIyKCkgPT09IG1hdHJpeC5tMjIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgZXF1YWxpdHkgd2l0aGluIGEgbWFyZ2luIG9mIGVycm9yIHdpdGggYW5vdGhlciBtYXRyaXhcclxuICAgKi9cclxuICBwdWJsaWMgZXF1YWxzRXBzaWxvbiggbWF0cml4OiBNYXRyaXgzLCBlcHNpbG9uOiBudW1iZXIgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gTWF0aC5hYnMoIHRoaXMubTAwKCkgLSBtYXRyaXgubTAwKCkgKSA8IGVwc2lsb24gJiZcclxuICAgICAgICAgICBNYXRoLmFicyggdGhpcy5tMDEoKSAtIG1hdHJpeC5tMDEoKSApIDwgZXBzaWxvbiAmJlxyXG4gICAgICAgICAgIE1hdGguYWJzKCB0aGlzLm0wMigpIC0gbWF0cml4Lm0wMigpICkgPCBlcHNpbG9uICYmXHJcbiAgICAgICAgICAgTWF0aC5hYnMoIHRoaXMubTEwKCkgLSBtYXRyaXgubTEwKCkgKSA8IGVwc2lsb24gJiZcclxuICAgICAgICAgICBNYXRoLmFicyggdGhpcy5tMTEoKSAtIG1hdHJpeC5tMTEoKSApIDwgZXBzaWxvbiAmJlxyXG4gICAgICAgICAgIE1hdGguYWJzKCB0aGlzLm0xMigpIC0gbWF0cml4Lm0xMigpICkgPCBlcHNpbG9uICYmXHJcbiAgICAgICAgICAgTWF0aC5hYnMoIHRoaXMubTIwKCkgLSBtYXRyaXgubTIwKCkgKSA8IGVwc2lsb24gJiZcclxuICAgICAgICAgICBNYXRoLmFicyggdGhpcy5tMjEoKSAtIG1hdHJpeC5tMjEoKSApIDwgZXBzaWxvbiAmJlxyXG4gICAgICAgICAgIE1hdGguYWJzKCB0aGlzLm0yMigpIC0gbWF0cml4Lm0yMigpICkgPCBlcHNpbG9uO1xyXG4gIH1cclxuXHJcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXHJcbiAgICogSW1tdXRhYmxlIG9wZXJhdGlvbnMgKHJldHVybnMgYSBuZXcgbWF0cml4KVxyXG4gICAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBjb3B5IG9mIHRoaXMgbWF0cml4XHJcbiAgICovXHJcbiAgcHVibGljIGNvcHkoKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gbTMoXHJcbiAgICAgIHRoaXMubTAwKCksIHRoaXMubTAxKCksIHRoaXMubTAyKCksXHJcbiAgICAgIHRoaXMubTEwKCksIHRoaXMubTExKCksIHRoaXMubTEyKCksXHJcbiAgICAgIHRoaXMubTIwKCksIHRoaXMubTIxKCksIHRoaXMubTIyKCksXHJcbiAgICAgIHRoaXMudHlwZVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgbWF0cml4LCBkZWZpbmVkIGJ5IHRoaXMgbWF0cml4IHBsdXMgdGhlIHByb3ZpZGVkIG1hdHJpeFxyXG4gICAqL1xyXG4gIHB1YmxpYyBwbHVzKCBtYXRyaXg6IE1hdHJpeDMgKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gbTMoXHJcbiAgICAgIHRoaXMubTAwKCkgKyBtYXRyaXgubTAwKCksIHRoaXMubTAxKCkgKyBtYXRyaXgubTAxKCksIHRoaXMubTAyKCkgKyBtYXRyaXgubTAyKCksXHJcbiAgICAgIHRoaXMubTEwKCkgKyBtYXRyaXgubTEwKCksIHRoaXMubTExKCkgKyBtYXRyaXgubTExKCksIHRoaXMubTEyKCkgKyBtYXRyaXgubTEyKCksXHJcbiAgICAgIHRoaXMubTIwKCkgKyBtYXRyaXgubTIwKCksIHRoaXMubTIxKCkgKyBtYXRyaXgubTIxKCksIHRoaXMubTIyKCkgKyBtYXRyaXgubTIyKClcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbmV3IG1hdHJpeCwgZGVmaW5lZCBieSB0aGlzIG1hdHJpeCBwbHVzIHRoZSBwcm92aWRlZCBtYXRyaXhcclxuICAgKi9cclxuICBwdWJsaWMgbWludXMoIG1hdHJpeDogTWF0cml4MyApOiBNYXRyaXgzIHtcclxuICAgIHJldHVybiBtMyhcclxuICAgICAgdGhpcy5tMDAoKSAtIG1hdHJpeC5tMDAoKSwgdGhpcy5tMDEoKSAtIG1hdHJpeC5tMDEoKSwgdGhpcy5tMDIoKSAtIG1hdHJpeC5tMDIoKSxcclxuICAgICAgdGhpcy5tMTAoKSAtIG1hdHJpeC5tMTAoKSwgdGhpcy5tMTEoKSAtIG1hdHJpeC5tMTEoKSwgdGhpcy5tMTIoKSAtIG1hdHJpeC5tMTIoKSxcclxuICAgICAgdGhpcy5tMjAoKSAtIG1hdHJpeC5tMjAoKSwgdGhpcy5tMjEoKSAtIG1hdHJpeC5tMjEoKSwgdGhpcy5tMjIoKSAtIG1hdHJpeC5tMjIoKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB0cmFuc3Bvc2VkIGNvcHkgb2YgdGhpcyBtYXRyaXhcclxuICAgKi9cclxuICBwdWJsaWMgdHJhbnNwb3NlZCgpOiBNYXRyaXgzIHtcclxuICAgIHJldHVybiBtMyhcclxuICAgICAgdGhpcy5tMDAoKSwgdGhpcy5tMTAoKSwgdGhpcy5tMjAoKSxcclxuICAgICAgdGhpcy5tMDEoKSwgdGhpcy5tMTEoKSwgdGhpcy5tMjEoKSxcclxuICAgICAgdGhpcy5tMDIoKSwgdGhpcy5tMTIoKSwgdGhpcy5tMjIoKSwgKCB0aGlzLnR5cGUgPT09IE1hdHJpeDNUeXBlLklERU5USVRZIHx8IHRoaXMudHlwZSA9PT0gTWF0cml4M1R5cGUuU0NBTElORyApID8gdGhpcy50eXBlIDogdW5kZWZpbmVkXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5lZ2F0ZWQgY29weSBvZiB0aGlzIG1hdHJpeFxyXG4gICAqL1xyXG4gIHB1YmxpYyBuZWdhdGVkKCk6IE1hdHJpeDMge1xyXG4gICAgcmV0dXJuIG0zKFxyXG4gICAgICAtdGhpcy5tMDAoKSwgLXRoaXMubTAxKCksIC10aGlzLm0wMigpLFxyXG4gICAgICAtdGhpcy5tMTAoKSwgLXRoaXMubTExKCksIC10aGlzLm0xMigpLFxyXG4gICAgICAtdGhpcy5tMjAoKSwgLXRoaXMubTIxKCksIC10aGlzLm0yMigpXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBpbnZlcnRlZCBjb3B5IG9mIHRoaXMgbWF0cml4XHJcbiAgICovXHJcbiAgcHVibGljIGludmVydGVkKCk6IE1hdHJpeDMge1xyXG4gICAgbGV0IGRldDtcclxuXHJcbiAgICBzd2l0Y2goIHRoaXMudHlwZSApIHtcclxuICAgICAgY2FzZSBNYXRyaXgzVHlwZS5JREVOVElUWTpcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgY2FzZSBNYXRyaXgzVHlwZS5UUkFOU0xBVElPTl8yRDpcclxuICAgICAgICByZXR1cm4gbTMoXHJcbiAgICAgICAgICAxLCAwLCAtdGhpcy5tMDIoKSxcclxuICAgICAgICAgIDAsIDEsIC10aGlzLm0xMigpLFxyXG4gICAgICAgICAgMCwgMCwgMSwgTWF0cml4M1R5cGUuVFJBTlNMQVRJT05fMkQgKTtcclxuICAgICAgY2FzZSBNYXRyaXgzVHlwZS5TQ0FMSU5HOlxyXG4gICAgICAgIHJldHVybiBtMyhcclxuICAgICAgICAgIDEgLyB0aGlzLm0wMCgpLCAwLCAwLFxyXG4gICAgICAgICAgMCwgMSAvIHRoaXMubTExKCksIDAsXHJcbiAgICAgICAgICAwLCAwLCAxIC8gdGhpcy5tMjIoKSwgTWF0cml4M1R5cGUuU0NBTElORyApO1xyXG4gICAgICBjYXNlIE1hdHJpeDNUeXBlLkFGRklORTpcclxuICAgICAgICBkZXQgPSB0aGlzLmdldERldGVybWluYW50KCk7XHJcbiAgICAgICAgaWYgKCBkZXQgIT09IDAgKSB7XHJcbiAgICAgICAgICByZXR1cm4gbTMoXHJcbiAgICAgICAgICAgICggLXRoaXMubTEyKCkgKiB0aGlzLm0yMSgpICsgdGhpcy5tMTEoKSAqIHRoaXMubTIyKCkgKSAvIGRldCxcclxuICAgICAgICAgICAgKCB0aGlzLm0wMigpICogdGhpcy5tMjEoKSAtIHRoaXMubTAxKCkgKiB0aGlzLm0yMigpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggLXRoaXMubTAyKCkgKiB0aGlzLm0xMSgpICsgdGhpcy5tMDEoKSAqIHRoaXMubTEyKCkgKSAvIGRldCxcclxuICAgICAgICAgICAgKCB0aGlzLm0xMigpICogdGhpcy5tMjAoKSAtIHRoaXMubTEwKCkgKiB0aGlzLm0yMigpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggLXRoaXMubTAyKCkgKiB0aGlzLm0yMCgpICsgdGhpcy5tMDAoKSAqIHRoaXMubTIyKCkgKSAvIGRldCxcclxuICAgICAgICAgICAgKCB0aGlzLm0wMigpICogdGhpcy5tMTAoKSAtIHRoaXMubTAwKCkgKiB0aGlzLm0xMigpICkgLyBkZXQsXHJcbiAgICAgICAgICAgIDAsIDAsIDEsIE1hdHJpeDNUeXBlLkFGRklORVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdNYXRyaXggY291bGQgbm90IGJlIGludmVydGVkLCBkZXRlcm1pbmFudCA9PT0gMCcgKTtcclxuICAgICAgICB9XHJcbiAgICAgIGNhc2UgTWF0cml4M1R5cGUuT1RIRVI6XHJcbiAgICAgICAgZGV0ID0gdGhpcy5nZXREZXRlcm1pbmFudCgpO1xyXG4gICAgICAgIGlmICggZGV0ICE9PSAwICkge1xyXG4gICAgICAgICAgcmV0dXJuIG0zKFxyXG4gICAgICAgICAgICAoIC10aGlzLm0xMigpICogdGhpcy5tMjEoKSArIHRoaXMubTExKCkgKiB0aGlzLm0yMigpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMDIoKSAqIHRoaXMubTIxKCkgLSB0aGlzLm0wMSgpICogdGhpcy5tMjIoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIC10aGlzLm0wMigpICogdGhpcy5tMTEoKSArIHRoaXMubTAxKCkgKiB0aGlzLm0xMigpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMTIoKSAqIHRoaXMubTIwKCkgLSB0aGlzLm0xMCgpICogdGhpcy5tMjIoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIC10aGlzLm0wMigpICogdGhpcy5tMjAoKSArIHRoaXMubTAwKCkgKiB0aGlzLm0yMigpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMDIoKSAqIHRoaXMubTEwKCkgLSB0aGlzLm0wMCgpICogdGhpcy5tMTIoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIC10aGlzLm0xMSgpICogdGhpcy5tMjAoKSArIHRoaXMubTEwKCkgKiB0aGlzLm0yMSgpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMDEoKSAqIHRoaXMubTIwKCkgLSB0aGlzLm0wMCgpICogdGhpcy5tMjEoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIC10aGlzLm0wMSgpICogdGhpcy5tMTAoKSArIHRoaXMubTAwKCkgKiB0aGlzLm0xMSgpICkgLyBkZXQsXHJcbiAgICAgICAgICAgIE1hdHJpeDNUeXBlLk9USEVSXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ01hdHJpeCBjb3VsZCBub3QgYmUgaW52ZXJ0ZWQsIGRldGVybWluYW50ID09PSAwJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBNYXRyaXgzLmludmVydGVkIHdpdGggdW5rbm93biB0eXBlOiAke3RoaXMudHlwZX1gICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbWF0cml4LCBkZWZpbmVkIGJ5IHRoZSBtdWx0aXBsaWNhdGlvbiBvZiB0aGlzICogbWF0cml4LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG1hdHJpeFxyXG4gICAqIEByZXR1cm5zIC0gTk9URTogdGhpcyBtYXkgYmUgdGhlIHNhbWUgbWF0cml4IVxyXG4gICAqL1xyXG4gIHB1YmxpYyB0aW1lc01hdHJpeCggbWF0cml4OiBNYXRyaXgzICk6IE1hdHJpeDMge1xyXG4gICAgLy8gSSAqIE0gPT09IE0gKiBJID09PSBNICh0aGUgaWRlbnRpdHkpXHJcbiAgICBpZiAoIHRoaXMudHlwZSA9PT0gTWF0cml4M1R5cGUuSURFTlRJVFkgfHwgbWF0cml4LnR5cGUgPT09IE1hdHJpeDNUeXBlLklERU5USVRZICkge1xyXG4gICAgICByZXR1cm4gdGhpcy50eXBlID09PSBNYXRyaXgzVHlwZS5JREVOVElUWSA/IG1hdHJpeCA6IHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLnR5cGUgPT09IG1hdHJpeC50eXBlICkge1xyXG4gICAgICAvLyBjdXJyZW50bHkgdHdvIG1hdHJpY2VzIG9mIHRoZSBzYW1lIHR5cGUgd2lsbCByZXN1bHQgaW4gdGhlIHNhbWUgcmVzdWx0IHR5cGVcclxuICAgICAgaWYgKCB0aGlzLnR5cGUgPT09IE1hdHJpeDNUeXBlLlRSQU5TTEFUSU9OXzJEICkge1xyXG4gICAgICAgIC8vIGZhc3RlciBjb21iaW5hdGlvbiBvZiB0cmFuc2xhdGlvbnNcclxuICAgICAgICByZXR1cm4gbTMoXHJcbiAgICAgICAgICAxLCAwLCB0aGlzLm0wMigpICsgbWF0cml4Lm0wMigpLFxyXG4gICAgICAgICAgMCwgMSwgdGhpcy5tMTIoKSArIG1hdHJpeC5tMTIoKSxcclxuICAgICAgICAgIDAsIDAsIDEsIE1hdHJpeDNUeXBlLlRSQU5TTEFUSU9OXzJEICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRoaXMudHlwZSA9PT0gTWF0cml4M1R5cGUuU0NBTElORyApIHtcclxuICAgICAgICAvLyBmYXN0ZXIgY29tYmluYXRpb24gb2Ygc2NhbGluZ1xyXG4gICAgICAgIHJldHVybiBtMyhcclxuICAgICAgICAgIHRoaXMubTAwKCkgKiBtYXRyaXgubTAwKCksIDAsIDAsXHJcbiAgICAgICAgICAwLCB0aGlzLm0xMSgpICogbWF0cml4Lm0xMSgpLCAwLFxyXG4gICAgICAgICAgMCwgMCwgMSwgTWF0cml4M1R5cGUuU0NBTElORyApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLnR5cGUgIT09IE1hdHJpeDNUeXBlLk9USEVSICYmIG1hdHJpeC50eXBlICE9PSBNYXRyaXgzVHlwZS5PVEhFUiApIHtcclxuICAgICAgLy8gY3VycmVudGx5IHR3byBtYXRyaWNlcyB0aGF0IGFyZSBhbnl0aGluZyBidXQgXCJvdGhlclwiIGFyZSB0ZWNobmljYWxseSBhZmZpbmUsIGFuZCB0aGUgcmVzdWx0IHdpbGwgYmUgYWZmaW5lXHJcblxyXG4gICAgICAvLyBhZmZpbmUgY2FzZVxyXG4gICAgICByZXR1cm4gbTMoXHJcbiAgICAgICAgdGhpcy5tMDAoKSAqIG1hdHJpeC5tMDAoKSArIHRoaXMubTAxKCkgKiBtYXRyaXgubTEwKCksXHJcbiAgICAgICAgdGhpcy5tMDAoKSAqIG1hdHJpeC5tMDEoKSArIHRoaXMubTAxKCkgKiBtYXRyaXgubTExKCksXHJcbiAgICAgICAgdGhpcy5tMDAoKSAqIG1hdHJpeC5tMDIoKSArIHRoaXMubTAxKCkgKiBtYXRyaXgubTEyKCkgKyB0aGlzLm0wMigpLFxyXG4gICAgICAgIHRoaXMubTEwKCkgKiBtYXRyaXgubTAwKCkgKyB0aGlzLm0xMSgpICogbWF0cml4Lm0xMCgpLFxyXG4gICAgICAgIHRoaXMubTEwKCkgKiBtYXRyaXgubTAxKCkgKyB0aGlzLm0xMSgpICogbWF0cml4Lm0xMSgpLFxyXG4gICAgICAgIHRoaXMubTEwKCkgKiBtYXRyaXgubTAyKCkgKyB0aGlzLm0xMSgpICogbWF0cml4Lm0xMigpICsgdGhpcy5tMTIoKSxcclxuICAgICAgICAwLCAwLCAxLCBNYXRyaXgzVHlwZS5BRkZJTkUgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBnZW5lcmFsIGNhc2VcclxuICAgIHJldHVybiBtMyhcclxuICAgICAgdGhpcy5tMDAoKSAqIG1hdHJpeC5tMDAoKSArIHRoaXMubTAxKCkgKiBtYXRyaXgubTEwKCkgKyB0aGlzLm0wMigpICogbWF0cml4Lm0yMCgpLFxyXG4gICAgICB0aGlzLm0wMCgpICogbWF0cml4Lm0wMSgpICsgdGhpcy5tMDEoKSAqIG1hdHJpeC5tMTEoKSArIHRoaXMubTAyKCkgKiBtYXRyaXgubTIxKCksXHJcbiAgICAgIHRoaXMubTAwKCkgKiBtYXRyaXgubTAyKCkgKyB0aGlzLm0wMSgpICogbWF0cml4Lm0xMigpICsgdGhpcy5tMDIoKSAqIG1hdHJpeC5tMjIoKSxcclxuICAgICAgdGhpcy5tMTAoKSAqIG1hdHJpeC5tMDAoKSArIHRoaXMubTExKCkgKiBtYXRyaXgubTEwKCkgKyB0aGlzLm0xMigpICogbWF0cml4Lm0yMCgpLFxyXG4gICAgICB0aGlzLm0xMCgpICogbWF0cml4Lm0wMSgpICsgdGhpcy5tMTEoKSAqIG1hdHJpeC5tMTEoKSArIHRoaXMubTEyKCkgKiBtYXRyaXgubTIxKCksXHJcbiAgICAgIHRoaXMubTEwKCkgKiBtYXRyaXgubTAyKCkgKyB0aGlzLm0xMSgpICogbWF0cml4Lm0xMigpICsgdGhpcy5tMTIoKSAqIG1hdHJpeC5tMjIoKSxcclxuICAgICAgdGhpcy5tMjAoKSAqIG1hdHJpeC5tMDAoKSArIHRoaXMubTIxKCkgKiBtYXRyaXgubTEwKCkgKyB0aGlzLm0yMigpICogbWF0cml4Lm0yMCgpLFxyXG4gICAgICB0aGlzLm0yMCgpICogbWF0cml4Lm0wMSgpICsgdGhpcy5tMjEoKSAqIG1hdHJpeC5tMTEoKSArIHRoaXMubTIyKCkgKiBtYXRyaXgubTIxKCksXHJcbiAgICAgIHRoaXMubTIwKCkgKiBtYXRyaXgubTAyKCkgKyB0aGlzLm0yMSgpICogbWF0cml4Lm0xMigpICsgdGhpcy5tMjIoKSAqIG1hdHJpeC5tMjIoKSApO1xyXG4gIH1cclxuXHJcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXHJcbiAgICogSW1tdXRhYmxlIG9wZXJhdGlvbnMgKHJldHVybnMgbmV3IGZvcm0gb2YgYSBwYXJhbWV0ZXIpXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbXVsdGlwbGljYXRpb24gb2YgdGhpcyBtYXRyaXggdGltZXMgdGhlIHByb3ZpZGVkIHZlY3RvciAodHJlYXRpbmcgdGhpcyBtYXRyaXggYXMgaG9tb2dlbmVvdXMsIHNvIHRoYXRcclxuICAgKiBpdCBpcyB0aGUgdGVjaG5pY2FsIG11bHRpcGxpY2F0aW9uIG9mICh4LHksMSkpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0aW1lc1ZlY3RvcjIoIHZlY3RvcjI6IFZlY3RvcjIgKTogVmVjdG9yMiB7XHJcbiAgICBjb25zdCB4ID0gdGhpcy5tMDAoKSAqIHZlY3RvcjIueCArIHRoaXMubTAxKCkgKiB2ZWN0b3IyLnkgKyB0aGlzLm0wMigpO1xyXG4gICAgY29uc3QgeSA9IHRoaXMubTEwKCkgKiB2ZWN0b3IyLnggKyB0aGlzLm0xMSgpICogdmVjdG9yMi55ICsgdGhpcy5tMTIoKTtcclxuICAgIHJldHVybiBuZXcgVmVjdG9yMiggeCwgeSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbXVsdGlwbGljYXRpb24gb2YgdGhpcyBtYXRyaXggdGltZXMgdGhlIHByb3ZpZGVkIHZlY3RvclxyXG4gICAqL1xyXG4gIHB1YmxpYyB0aW1lc1ZlY3RvcjMoIHZlY3RvcjM6IFZlY3RvcjMgKTogVmVjdG9yMyB7XHJcbiAgICBjb25zdCB4ID0gdGhpcy5tMDAoKSAqIHZlY3RvcjMueCArIHRoaXMubTAxKCkgKiB2ZWN0b3IzLnkgKyB0aGlzLm0wMigpICogdmVjdG9yMy56O1xyXG4gICAgY29uc3QgeSA9IHRoaXMubTEwKCkgKiB2ZWN0b3IzLnggKyB0aGlzLm0xMSgpICogdmVjdG9yMy55ICsgdGhpcy5tMTIoKSAqIHZlY3RvcjMuejtcclxuICAgIGNvbnN0IHogPSB0aGlzLm0yMCgpICogdmVjdG9yMy54ICsgdGhpcy5tMjEoKSAqIHZlY3RvcjMueSArIHRoaXMubTIyKCkgKiB2ZWN0b3IzLno7XHJcbiAgICByZXR1cm4gbmV3IFZlY3RvcjMoIHgsIHksIHogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG11bHRpcGxpY2F0aW9uIG9mIHRoZSB0cmFuc3Bvc2Ugb2YgdGhpcyBtYXRyaXggdGltZXMgdGhlIHByb3ZpZGVkIHZlY3RvciAoYXNzdW1pbmcgdGhlIDJ4MiBxdWFkcmFudClcclxuICAgKi9cclxuICBwdWJsaWMgdGltZXNUcmFuc3Bvc2VWZWN0b3IyKCB2ZWN0b3IyOiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgY29uc3QgeCA9IHRoaXMubTAwKCkgKiB2ZWN0b3IyLnggKyB0aGlzLm0xMCgpICogdmVjdG9yMi55O1xyXG4gICAgY29uc3QgeSA9IHRoaXMubTAxKCkgKiB2ZWN0b3IyLnggKyB0aGlzLm0xMSgpICogdmVjdG9yMi55O1xyXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IyKCB4LCB5ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUT0RPOiB0aGlzIG9wZXJhdGlvbiBzZWVtcyB0byBub3Qgd29yayBmb3IgdHJhbnNmb3JtRGVsdGEyLCBzaG91bGQgYmUgdmV0dGVkIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9kb3QvaXNzdWVzLzk2XHJcbiAgICovXHJcbiAgcHVibGljIHRpbWVzUmVsYXRpdmVWZWN0b3IyKCB2ZWN0b3IyOiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgY29uc3QgeCA9IHRoaXMubTAwKCkgKiB2ZWN0b3IyLnggKyB0aGlzLm0wMSgpICogdmVjdG9yMi55O1xyXG4gICAgY29uc3QgeSA9IHRoaXMubTEwKCkgKiB2ZWN0b3IyLnkgKyB0aGlzLm0xMSgpICogdmVjdG9yMi55O1xyXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IyKCB4LCB5ICk7XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBNdXRhYmxlIG9wZXJhdGlvbnMgKGNoYW5nZXMgdGhpcyBtYXRyaXgpXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgZW50aXJlIHN0YXRlIG9mIHRoZSBtYXRyaXgsIGluIHJvdy1tYWpvciBvcmRlci5cclxuICAgKlxyXG4gICAqIE5PVEU6IEV2ZXJ5IG11dGFibGUgbWV0aG9kIGdvZXMgdGhyb3VnaCByb3dNYWpvclxyXG4gICAqL1xyXG4gIHB1YmxpYyByb3dNYWpvciggdjAwOiBudW1iZXIsIHYwMTogbnVtYmVyLCB2MDI6IG51bWJlciwgdjEwOiBudW1iZXIsIHYxMTogbnVtYmVyLCB2MTI6IG51bWJlciwgdjIwOiBudW1iZXIsIHYyMTogbnVtYmVyLCB2MjI6IG51bWJlciwgdHlwZT86IE1hdHJpeDNUeXBlICk6IHRoaXMge1xyXG4gICAgdGhpcy5lbnRyaWVzWyAwIF0gPSB2MDA7XHJcbiAgICB0aGlzLmVudHJpZXNbIDEgXSA9IHYxMDtcclxuICAgIHRoaXMuZW50cmllc1sgMiBdID0gdjIwO1xyXG4gICAgdGhpcy5lbnRyaWVzWyAzIF0gPSB2MDE7XHJcbiAgICB0aGlzLmVudHJpZXNbIDQgXSA9IHYxMTtcclxuICAgIHRoaXMuZW50cmllc1sgNSBdID0gdjIxO1xyXG4gICAgdGhpcy5lbnRyaWVzWyA2IF0gPSB2MDI7XHJcbiAgICB0aGlzLmVudHJpZXNbIDcgXSA9IHYxMjtcclxuICAgIHRoaXMuZW50cmllc1sgOCBdID0gdjIyO1xyXG5cclxuICAgIC8vIFRPRE86IGNvbnNpZGVyIHBlcmZvcm1hbmNlIG9mIHRoZSBhZmZpbmUgY2hlY2sgaGVyZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZG90L2lzc3Vlcy85NlxyXG4gICAgdGhpcy50eXBlID0gdHlwZSA9PT0gdW5kZWZpbmVkID8gKCAoIHYyMCA9PT0gMCAmJiB2MjEgPT09IDAgJiYgdjIyID09PSAxICkgPyBNYXRyaXgzVHlwZS5BRkZJTkUgOiBNYXRyaXgzVHlwZS5PVEhFUiApIDogdHlwZTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byBiZSBhIGNvcHkgb2YgYW5vdGhlciBtYXRyaXguXHJcbiAgICovXHJcbiAgcHVibGljIHNldCggbWF0cml4OiBNYXRyaXgzICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMucm93TWFqb3IoXHJcbiAgICAgIG1hdHJpeC5tMDAoKSwgbWF0cml4Lm0wMSgpLCBtYXRyaXgubTAyKCksXHJcbiAgICAgIG1hdHJpeC5tMTAoKSwgbWF0cml4Lm0xMSgpLCBtYXRyaXgubTEyKCksXHJcbiAgICAgIG1hdHJpeC5tMjAoKSwgbWF0cml4Lm0yMSgpLCBtYXRyaXgubTIyKCksXHJcbiAgICAgIG1hdHJpeC50eXBlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIGJlIGEgY29weSBvZiB0aGUgY29sdW1uLW1ham9yIGRhdGEgc3RvcmVkIGluIGFuIGFycmF5IChlLmcuIFdlYkdMKS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0QXJyYXkoIGFycmF5OiBudW1iZXJbXSB8IEZsb2F0MzJBcnJheSB8IEZsb2F0NjRBcnJheSApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLnJvd01ham9yKFxyXG4gICAgICBhcnJheVsgMCBdLCBhcnJheVsgMyBdLCBhcnJheVsgNiBdLFxyXG4gICAgICBhcnJheVsgMSBdLCBhcnJheVsgNCBdLCBhcnJheVsgNyBdLFxyXG4gICAgICBhcnJheVsgMiBdLCBhcnJheVsgNSBdLCBhcnJheVsgOCBdICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBpbmRpdmlkdWFsIDAsMCBjb21wb25lbnQgb2YgdGhpcyBtYXRyaXguXHJcbiAgICovXHJcbiAgcHVibGljIHNldDAwKCB2YWx1ZTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgdGhpcy5lbnRyaWVzWyAwIF0gPSB2YWx1ZTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgaW5kaXZpZHVhbCAwLDEgY29tcG9uZW50IG9mIHRoaXMgbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQwMSggdmFsdWU6IG51bWJlciApOiB0aGlzIHtcclxuICAgIHRoaXMuZW50cmllc1sgMyBdID0gdmFsdWU7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGluZGl2aWR1YWwgMCwyIGNvbXBvbmVudCBvZiB0aGlzIG1hdHJpeC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0MDIoIHZhbHVlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICB0aGlzLmVudHJpZXNbIDYgXSA9IHZhbHVlO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBpbmRpdmlkdWFsIDEsMCBjb21wb25lbnQgb2YgdGhpcyBtYXRyaXguXHJcbiAgICovXHJcbiAgcHVibGljIHNldDEwKCB2YWx1ZTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgdGhpcy5lbnRyaWVzWyAxIF0gPSB2YWx1ZTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgaW5kaXZpZHVhbCAxLDEgY29tcG9uZW50IG9mIHRoaXMgbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQxMSggdmFsdWU6IG51bWJlciApOiB0aGlzIHtcclxuICAgIHRoaXMuZW50cmllc1sgNCBdID0gdmFsdWU7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGluZGl2aWR1YWwgMSwyIGNvbXBvbmVudCBvZiB0aGlzIG1hdHJpeC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0MTIoIHZhbHVlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICB0aGlzLmVudHJpZXNbIDcgXSA9IHZhbHVlO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBpbmRpdmlkdWFsIDIsMCBjb21wb25lbnQgb2YgdGhpcyBtYXRyaXguXHJcbiAgICovXHJcbiAgcHVibGljIHNldDIwKCB2YWx1ZTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgdGhpcy5lbnRyaWVzWyAyIF0gPSB2YWx1ZTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgaW5kaXZpZHVhbCAyLDEgY29tcG9uZW50IG9mIHRoaXMgbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQyMSggdmFsdWU6IG51bWJlciApOiB0aGlzIHtcclxuICAgIHRoaXMuZW50cmllc1sgNSBdID0gdmFsdWU7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGluZGl2aWR1YWwgMiwyIGNvbXBvbmVudCBvZiB0aGlzIG1hdHJpeC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0MjIoIHZhbHVlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICB0aGlzLmVudHJpZXNbIDggXSA9IHZhbHVlO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYWtlcyB0aGlzIG1hdHJpeCBlZmZlY3RpdmVseSBpbW11dGFibGUgdG8gdGhlIG5vcm1hbCBtZXRob2RzIChleGNlcHQgZGlyZWN0IHNldHRlcnM/KVxyXG4gICAqL1xyXG4gIHB1YmxpYyBtYWtlSW1tdXRhYmxlKCk6IHRoaXMge1xyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIHRoaXMucm93TWFqb3IgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQ2Fubm90IG1vZGlmeSBpbW11dGFibGUgbWF0cml4JyApO1xyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBlbnRpcmUgc3RhdGUgb2YgdGhlIG1hdHJpeCwgaW4gY29sdW1uLW1ham9yIG9yZGVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb2x1bW5NYWpvciggdjAwOiBudW1iZXIsIHYxMDogbnVtYmVyLCB2MjA6IG51bWJlciwgdjAxOiBudW1iZXIsIHYxMTogbnVtYmVyLCB2MjE6IG51bWJlciwgdjAyOiBudW1iZXIsIHYxMjogbnVtYmVyLCB2MjI6IG51bWJlciwgdHlwZTogTWF0cml4M1R5cGUgKTogdGhpcyB7XHJcbiAgICByZXR1cm4gdGhpcy5yb3dNYWpvciggdjAwLCB2MDEsIHYwMiwgdjEwLCB2MTEsIHYxMiwgdjIwLCB2MjEsIHYyMiwgdHlwZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byBpdHNlbGYgcGx1cyB0aGUgZ2l2ZW4gbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGQoIG1hdHJpeDogTWF0cml4MyApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLnJvd01ham9yKFxyXG4gICAgICB0aGlzLm0wMCgpICsgbWF0cml4Lm0wMCgpLCB0aGlzLm0wMSgpICsgbWF0cml4Lm0wMSgpLCB0aGlzLm0wMigpICsgbWF0cml4Lm0wMigpLFxyXG4gICAgICB0aGlzLm0xMCgpICsgbWF0cml4Lm0xMCgpLCB0aGlzLm0xMSgpICsgbWF0cml4Lm0xMSgpLCB0aGlzLm0xMigpICsgbWF0cml4Lm0xMigpLFxyXG4gICAgICB0aGlzLm0yMCgpICsgbWF0cml4Lm0yMCgpLCB0aGlzLm0yMSgpICsgbWF0cml4Lm0yMSgpLCB0aGlzLm0yMigpICsgbWF0cml4Lm0yMigpXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byBpdHNlbGYgbWludXMgdGhlIGdpdmVuIG1hdHJpeC5cclxuICAgKi9cclxuICBwdWJsaWMgc3VidHJhY3QoIG06IE1hdHJpeDMgKTogdGhpcyB7XHJcbiAgICByZXR1cm4gdGhpcy5yb3dNYWpvcihcclxuICAgICAgdGhpcy5tMDAoKSAtIG0ubTAwKCksIHRoaXMubTAxKCkgLSBtLm0wMSgpLCB0aGlzLm0wMigpIC0gbS5tMDIoKSxcclxuICAgICAgdGhpcy5tMTAoKSAtIG0ubTEwKCksIHRoaXMubTExKCkgLSBtLm0xMSgpLCB0aGlzLm0xMigpIC0gbS5tMTIoKSxcclxuICAgICAgdGhpcy5tMjAoKSAtIG0ubTIwKCksIHRoaXMubTIxKCkgLSBtLm0yMSgpLCB0aGlzLm0yMigpIC0gbS5tMjIoKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhpcyBtYXRyaXggdG8gaXRzIG93biB0cmFuc3Bvc2UuXHJcbiAgICovXHJcbiAgcHVibGljIHRyYW5zcG9zZSgpOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLnJvd01ham9yKFxyXG4gICAgICB0aGlzLm0wMCgpLCB0aGlzLm0xMCgpLCB0aGlzLm0yMCgpLFxyXG4gICAgICB0aGlzLm0wMSgpLCB0aGlzLm0xMSgpLCB0aGlzLm0yMSgpLFxyXG4gICAgICB0aGlzLm0wMigpLCB0aGlzLm0xMigpLCB0aGlzLm0yMigpLFxyXG4gICAgICAoIHRoaXMudHlwZSA9PT0gTWF0cml4M1R5cGUuSURFTlRJVFkgfHwgdGhpcy50eXBlID09PSBNYXRyaXgzVHlwZS5TQ0FMSU5HICkgPyB0aGlzLnR5cGUgOiB1bmRlZmluZWRcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIGl0cyBvd24gbmVnYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIG5lZ2F0ZSgpOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLnJvd01ham9yKFxyXG4gICAgICAtdGhpcy5tMDAoKSwgLXRoaXMubTAxKCksIC10aGlzLm0wMigpLFxyXG4gICAgICAtdGhpcy5tMTAoKSwgLXRoaXMubTExKCksIC10aGlzLm0xMigpLFxyXG4gICAgICAtdGhpcy5tMjAoKSwgLXRoaXMubTIxKCksIC10aGlzLm0yMigpXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byBpdHMgb3duIGludmVyc2UuXHJcbiAgICovXHJcbiAgcHVibGljIGludmVydCgpOiB0aGlzIHtcclxuICAgIGxldCBkZXQ7XHJcblxyXG4gICAgc3dpdGNoKCB0aGlzLnR5cGUgKSB7XHJcbiAgICAgIGNhc2UgTWF0cml4M1R5cGUuSURFTlRJVFk6XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIGNhc2UgTWF0cml4M1R5cGUuVFJBTlNMQVRJT05fMkQ6XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm93TWFqb3IoXHJcbiAgICAgICAgICAxLCAwLCAtdGhpcy5tMDIoKSxcclxuICAgICAgICAgIDAsIDEsIC10aGlzLm0xMigpLFxyXG4gICAgICAgICAgMCwgMCwgMSwgTWF0cml4M1R5cGUuVFJBTlNMQVRJT05fMkQgKTtcclxuICAgICAgY2FzZSBNYXRyaXgzVHlwZS5TQ0FMSU5HOlxyXG4gICAgICAgIHJldHVybiB0aGlzLnJvd01ham9yKFxyXG4gICAgICAgICAgMSAvIHRoaXMubTAwKCksIDAsIDAsXHJcbiAgICAgICAgICAwLCAxIC8gdGhpcy5tMTEoKSwgMCxcclxuICAgICAgICAgIDAsIDAsIDEgLyB0aGlzLm0yMigpLCBNYXRyaXgzVHlwZS5TQ0FMSU5HICk7XHJcbiAgICAgIGNhc2UgTWF0cml4M1R5cGUuQUZGSU5FOlxyXG4gICAgICAgIGRldCA9IHRoaXMuZ2V0RGV0ZXJtaW5hbnQoKTtcclxuICAgICAgICBpZiAoIGRldCAhPT0gMCApIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLnJvd01ham9yKFxyXG4gICAgICAgICAgICAoIC10aGlzLm0xMigpICogdGhpcy5tMjEoKSArIHRoaXMubTExKCkgKiB0aGlzLm0yMigpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMDIoKSAqIHRoaXMubTIxKCkgLSB0aGlzLm0wMSgpICogdGhpcy5tMjIoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIC10aGlzLm0wMigpICogdGhpcy5tMTEoKSArIHRoaXMubTAxKCkgKiB0aGlzLm0xMigpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMTIoKSAqIHRoaXMubTIwKCkgLSB0aGlzLm0xMCgpICogdGhpcy5tMjIoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIC10aGlzLm0wMigpICogdGhpcy5tMjAoKSArIHRoaXMubTAwKCkgKiB0aGlzLm0yMigpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMDIoKSAqIHRoaXMubTEwKCkgLSB0aGlzLm0wMCgpICogdGhpcy5tMTIoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAwLCAwLCAxLCBNYXRyaXgzVHlwZS5BRkZJTkVcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnTWF0cml4IGNvdWxkIG5vdCBiZSBpbnZlcnRlZCwgZGV0ZXJtaW5hbnQgPT09IDAnICk7XHJcbiAgICAgICAgfVxyXG4gICAgICBjYXNlIE1hdHJpeDNUeXBlLk9USEVSOlxyXG4gICAgICAgIGRldCA9IHRoaXMuZ2V0RGV0ZXJtaW5hbnQoKTtcclxuICAgICAgICBpZiAoIGRldCAhPT0gMCApIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLnJvd01ham9yKFxyXG4gICAgICAgICAgICAoIC10aGlzLm0xMigpICogdGhpcy5tMjEoKSArIHRoaXMubTExKCkgKiB0aGlzLm0yMigpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMDIoKSAqIHRoaXMubTIxKCkgLSB0aGlzLm0wMSgpICogdGhpcy5tMjIoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIC10aGlzLm0wMigpICogdGhpcy5tMTEoKSArIHRoaXMubTAxKCkgKiB0aGlzLm0xMigpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMTIoKSAqIHRoaXMubTIwKCkgLSB0aGlzLm0xMCgpICogdGhpcy5tMjIoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIC10aGlzLm0wMigpICogdGhpcy5tMjAoKSArIHRoaXMubTAwKCkgKiB0aGlzLm0yMigpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMDIoKSAqIHRoaXMubTEwKCkgLSB0aGlzLm0wMCgpICogdGhpcy5tMTIoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIC10aGlzLm0xMSgpICogdGhpcy5tMjAoKSArIHRoaXMubTEwKCkgKiB0aGlzLm0yMSgpICkgLyBkZXQsXHJcbiAgICAgICAgICAgICggdGhpcy5tMDEoKSAqIHRoaXMubTIwKCkgLSB0aGlzLm0wMCgpICogdGhpcy5tMjEoKSApIC8gZGV0LFxyXG4gICAgICAgICAgICAoIC10aGlzLm0wMSgpICogdGhpcy5tMTAoKSArIHRoaXMubTAwKCkgKiB0aGlzLm0xMSgpICkgLyBkZXQsXHJcbiAgICAgICAgICAgIE1hdHJpeDNUeXBlLk9USEVSXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ01hdHJpeCBjb3VsZCBub3QgYmUgaW52ZXJ0ZWQsIGRldGVybWluYW50ID09PSAwJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBNYXRyaXgzLmludmVydGVkIHdpdGggdW5rbm93biB0eXBlOiAke3RoaXMudHlwZX1gICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIHRoZSB2YWx1ZSBvZiBpdHNlbGYgdGltZXMgdGhlIHByb3ZpZGVkIG1hdHJpeFxyXG4gICAqL1xyXG4gIHB1YmxpYyBtdWx0aXBseU1hdHJpeCggbWF0cml4OiBNYXRyaXgzICk6IHRoaXMge1xyXG4gICAgLy8gTSAqIEkgPT09IE0gKHRoZSBpZGVudGl0eSlcclxuICAgIGlmICggbWF0cml4LnR5cGUgPT09IE1hdHJpeDNUeXBlLklERU5USVRZICkge1xyXG4gICAgICAvLyBubyBjaGFuZ2UgbmVlZGVkXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEkgKiBNID09PSBNICh0aGUgaWRlbnRpdHkpXHJcbiAgICBpZiAoIHRoaXMudHlwZSA9PT0gTWF0cml4M1R5cGUuSURFTlRJVFkgKSB7XHJcbiAgICAgIC8vIGNvcHkgdGhlIG90aGVyIG1hdHJpeCB0byB1c1xyXG4gICAgICByZXR1cm4gdGhpcy5zZXQoIG1hdHJpeCApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggdGhpcy50eXBlID09PSBtYXRyaXgudHlwZSApIHtcclxuICAgICAgLy8gY3VycmVudGx5IHR3byBtYXRyaWNlcyBvZiB0aGUgc2FtZSB0eXBlIHdpbGwgcmVzdWx0IGluIHRoZSBzYW1lIHJlc3VsdCB0eXBlXHJcbiAgICAgIGlmICggdGhpcy50eXBlID09PSBNYXRyaXgzVHlwZS5UUkFOU0xBVElPTl8yRCApIHtcclxuICAgICAgICAvLyBmYXN0ZXIgY29tYmluYXRpb24gb2YgdHJhbnNsYXRpb25zXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm93TWFqb3IoXHJcbiAgICAgICAgICAxLCAwLCB0aGlzLm0wMigpICsgbWF0cml4Lm0wMigpLFxyXG4gICAgICAgICAgMCwgMSwgdGhpcy5tMTIoKSArIG1hdHJpeC5tMTIoKSxcclxuICAgICAgICAgIDAsIDAsIDEsIE1hdHJpeDNUeXBlLlRSQU5TTEFUSU9OXzJEICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRoaXMudHlwZSA9PT0gTWF0cml4M1R5cGUuU0NBTElORyApIHtcclxuICAgICAgICAvLyBmYXN0ZXIgY29tYmluYXRpb24gb2Ygc2NhbGluZ1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJvd01ham9yKFxyXG4gICAgICAgICAgdGhpcy5tMDAoKSAqIG1hdHJpeC5tMDAoKSwgMCwgMCxcclxuICAgICAgICAgIDAsIHRoaXMubTExKCkgKiBtYXRyaXgubTExKCksIDAsXHJcbiAgICAgICAgICAwLCAwLCAxLCBNYXRyaXgzVHlwZS5TQ0FMSU5HICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMudHlwZSAhPT0gTWF0cml4M1R5cGUuT1RIRVIgJiYgbWF0cml4LnR5cGUgIT09IE1hdHJpeDNUeXBlLk9USEVSICkge1xyXG4gICAgICAvLyBjdXJyZW50bHkgdHdvIG1hdHJpY2VzIHRoYXQgYXJlIGFueXRoaW5nIGJ1dCBcIm90aGVyXCIgYXJlIHRlY2huaWNhbGx5IGFmZmluZSwgYW5kIHRoZSByZXN1bHQgd2lsbCBiZSBhZmZpbmVcclxuXHJcbiAgICAgIC8vIGFmZmluZSBjYXNlXHJcbiAgICAgIHJldHVybiB0aGlzLnJvd01ham9yKFxyXG4gICAgICAgIHRoaXMubTAwKCkgKiBtYXRyaXgubTAwKCkgKyB0aGlzLm0wMSgpICogbWF0cml4Lm0xMCgpLFxyXG4gICAgICAgIHRoaXMubTAwKCkgKiBtYXRyaXgubTAxKCkgKyB0aGlzLm0wMSgpICogbWF0cml4Lm0xMSgpLFxyXG4gICAgICAgIHRoaXMubTAwKCkgKiBtYXRyaXgubTAyKCkgKyB0aGlzLm0wMSgpICogbWF0cml4Lm0xMigpICsgdGhpcy5tMDIoKSxcclxuICAgICAgICB0aGlzLm0xMCgpICogbWF0cml4Lm0wMCgpICsgdGhpcy5tMTEoKSAqIG1hdHJpeC5tMTAoKSxcclxuICAgICAgICB0aGlzLm0xMCgpICogbWF0cml4Lm0wMSgpICsgdGhpcy5tMTEoKSAqIG1hdHJpeC5tMTEoKSxcclxuICAgICAgICB0aGlzLm0xMCgpICogbWF0cml4Lm0wMigpICsgdGhpcy5tMTEoKSAqIG1hdHJpeC5tMTIoKSArIHRoaXMubTEyKCksXHJcbiAgICAgICAgMCwgMCwgMSwgTWF0cml4M1R5cGUuQUZGSU5FICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2VuZXJhbCBjYXNlXHJcbiAgICByZXR1cm4gdGhpcy5yb3dNYWpvcihcclxuICAgICAgdGhpcy5tMDAoKSAqIG1hdHJpeC5tMDAoKSArIHRoaXMubTAxKCkgKiBtYXRyaXgubTEwKCkgKyB0aGlzLm0wMigpICogbWF0cml4Lm0yMCgpLFxyXG4gICAgICB0aGlzLm0wMCgpICogbWF0cml4Lm0wMSgpICsgdGhpcy5tMDEoKSAqIG1hdHJpeC5tMTEoKSArIHRoaXMubTAyKCkgKiBtYXRyaXgubTIxKCksXHJcbiAgICAgIHRoaXMubTAwKCkgKiBtYXRyaXgubTAyKCkgKyB0aGlzLm0wMSgpICogbWF0cml4Lm0xMigpICsgdGhpcy5tMDIoKSAqIG1hdHJpeC5tMjIoKSxcclxuICAgICAgdGhpcy5tMTAoKSAqIG1hdHJpeC5tMDAoKSArIHRoaXMubTExKCkgKiBtYXRyaXgubTEwKCkgKyB0aGlzLm0xMigpICogbWF0cml4Lm0yMCgpLFxyXG4gICAgICB0aGlzLm0xMCgpICogbWF0cml4Lm0wMSgpICsgdGhpcy5tMTEoKSAqIG1hdHJpeC5tMTEoKSArIHRoaXMubTEyKCkgKiBtYXRyaXgubTIxKCksXHJcbiAgICAgIHRoaXMubTEwKCkgKiBtYXRyaXgubTAyKCkgKyB0aGlzLm0xMSgpICogbWF0cml4Lm0xMigpICsgdGhpcy5tMTIoKSAqIG1hdHJpeC5tMjIoKSxcclxuICAgICAgdGhpcy5tMjAoKSAqIG1hdHJpeC5tMDAoKSArIHRoaXMubTIxKCkgKiBtYXRyaXgubTEwKCkgKyB0aGlzLm0yMigpICogbWF0cml4Lm0yMCgpLFxyXG4gICAgICB0aGlzLm0yMCgpICogbWF0cml4Lm0wMSgpICsgdGhpcy5tMjEoKSAqIG1hdHJpeC5tMTEoKSArIHRoaXMubTIyKCkgKiBtYXRyaXgubTIxKCksXHJcbiAgICAgIHRoaXMubTIwKCkgKiBtYXRyaXgubTAyKCkgKyB0aGlzLm0yMSgpICogbWF0cml4Lm0xMigpICsgdGhpcy5tMjIoKSAqIG1hdHJpeC5tMjIoKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTXV0YXRlcyB0aGlzIG1hdHJpeCwgZXF1aXZhbGVudCB0byAodHJhbnNsYXRpb24gKiB0aGlzKS5cclxuICAgKi9cclxuICBwdWJsaWMgcHJlcGVuZFRyYW5zbGF0aW9uKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiB0aGlzIHtcclxuICAgIHRoaXMuc2V0MDIoIHRoaXMubTAyKCkgKyB4ICk7XHJcbiAgICB0aGlzLnNldDEyKCB0aGlzLm0xMigpICsgeSApO1xyXG5cclxuICAgIGlmICggdGhpcy50eXBlID09PSBNYXRyaXgzVHlwZS5JREVOVElUWSB8fCB0aGlzLnR5cGUgPT09IE1hdHJpeDNUeXBlLlRSQU5TTEFUSU9OXzJEICkge1xyXG4gICAgICB0aGlzLnR5cGUgPSBNYXRyaXgzVHlwZS5UUkFOU0xBVElPTl8yRDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLnR5cGUgPT09IE1hdHJpeDNUeXBlLk9USEVSICkge1xyXG4gICAgICB0aGlzLnR5cGUgPSBNYXRyaXgzVHlwZS5PVEhFUjtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLnR5cGUgPSBNYXRyaXgzVHlwZS5BRkZJTkU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpczsgLy8gZm9yIGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIHRoZSAzeDMgaWRlbnRpdHkgbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUb0lkZW50aXR5KCk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMucm93TWFqb3IoXHJcbiAgICAgIDEsIDAsIDAsXHJcbiAgICAgIDAsIDEsIDAsXHJcbiAgICAgIDAsIDAsIDEsXHJcbiAgICAgIE1hdHJpeDNUeXBlLklERU5USVRZICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIHRoZSBhZmZpbmUgdHJhbnNsYXRpb24gbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUb1RyYW5zbGF0aW9uKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLnJvd01ham9yKFxyXG4gICAgICAxLCAwLCB4LFxyXG4gICAgICAwLCAxLCB5LFxyXG4gICAgICAwLCAwLCAxLFxyXG4gICAgICBNYXRyaXgzVHlwZS5UUkFOU0xBVElPTl8yRCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byB0aGUgYWZmaW5lIHNjYWxpbmcgbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUb1NjYWxlKCB4OiBudW1iZXIsIHk/OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICAvLyBhbGxvdyB1c2luZyBvbmUgcGFyYW1ldGVyIHRvIHNjYWxlIGV2ZXJ5dGhpbmdcclxuICAgIHkgPSB5ID09PSB1bmRlZmluZWQgPyB4IDogeTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5yb3dNYWpvcihcclxuICAgICAgeCwgMCwgMCxcclxuICAgICAgMCwgeSwgMCxcclxuICAgICAgMCwgMCwgMSxcclxuICAgICAgTWF0cml4M1R5cGUuU0NBTElORyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byBhbiBhZmZpbmUgbWF0cml4IHdpdGggdGhlIHNwZWNpZmllZCByb3ctbWFqb3IgdmFsdWVzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUb0FmZmluZSggbTAwOiBudW1iZXIsIG0wMTogbnVtYmVyLCBtMDI6IG51bWJlciwgbTEwOiBudW1iZXIsIG0xMTogbnVtYmVyLCBtMTI6IG51bWJlciApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLnJvd01ham9yKCBtMDAsIG0wMSwgbTAyLCBtMTAsIG0xMSwgbTEyLCAwLCAwLCAxLCBNYXRyaXgzVHlwZS5BRkZJTkUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIG1hdHJpeCB0byBhIHJvdGF0aW9uIGRlZmluZWQgYnkgYSByb3RhdGlvbiBvZiB0aGUgc3BlY2lmaWVkIGFuZ2xlIGFyb3VuZCB0aGUgZ2l2ZW4gdW5pdCBheGlzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGF4aXMgLSBub3JtYWxpemVkXHJcbiAgICogQHBhcmFtIGFuZ2xlIC0gaW4gcmFkaWFuc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUb1JvdGF0aW9uQXhpc0FuZ2xlKCBheGlzOiBWZWN0b3IzLCBhbmdsZTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgbGV0IGMgPSBNYXRoLmNvcyggYW5nbGUgKTtcclxuICAgIGxldCBzID0gTWF0aC5zaW4oIGFuZ2xlICk7XHJcblxyXG4gICAgLy8gSGFuZGxlIGNhc2VzIGNsb3NlIHRvIDAsIHNpbmNlIHdlIHdhbnQgTWF0aC5QSS8yIHJvdGF0aW9ucyAoYW5kIHRoZSBsaWtlKSB0byBiZSBleGFjdFxyXG4gICAgaWYgKCBNYXRoLmFicyggYyApIDwgMWUtMTUgKSB7XHJcbiAgICAgIGMgPSAwO1xyXG4gICAgfVxyXG4gICAgaWYgKCBNYXRoLmFicyggcyApIDwgMWUtMTUgKSB7XHJcbiAgICAgIHMgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IEMgPSAxIC0gYztcclxuXHJcbiAgICByZXR1cm4gdGhpcy5yb3dNYWpvcihcclxuICAgICAgYXhpcy54ICogYXhpcy54ICogQyArIGMsIGF4aXMueCAqIGF4aXMueSAqIEMgLSBheGlzLnogKiBzLCBheGlzLnggKiBheGlzLnogKiBDICsgYXhpcy55ICogcyxcclxuICAgICAgYXhpcy55ICogYXhpcy54ICogQyArIGF4aXMueiAqIHMsIGF4aXMueSAqIGF4aXMueSAqIEMgKyBjLCBheGlzLnkgKiBheGlzLnogKiBDIC0gYXhpcy54ICogcyxcclxuICAgICAgYXhpcy56ICogYXhpcy54ICogQyAtIGF4aXMueSAqIHMsIGF4aXMueiAqIGF4aXMueSAqIEMgKyBheGlzLnggKiBzLCBheGlzLnogKiBheGlzLnogKiBDICsgYyxcclxuICAgICAgTWF0cml4M1R5cGUuT1RIRVIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhpcyBtYXRyaXggdG8gYSByb3RhdGlvbiBhcm91bmQgdGhlIHggYXhpcyAoaW4gdGhlIHl6IHBsYW5lKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhbmdsZSAtIGluIHJhZGlhbnNcclxuICAgKi9cclxuICBwdWJsaWMgc2V0VG9Sb3RhdGlvblgoIGFuZ2xlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBsZXQgYyA9IE1hdGguY29zKCBhbmdsZSApO1xyXG4gICAgbGV0IHMgPSBNYXRoLnNpbiggYW5nbGUgKTtcclxuXHJcbiAgICAvLyBIYW5kbGUgY2FzZXMgY2xvc2UgdG8gMCwgc2luY2Ugd2Ugd2FudCBNYXRoLlBJLzIgcm90YXRpb25zIChhbmQgdGhlIGxpa2UpIHRvIGJlIGV4YWN0XHJcbiAgICBpZiAoIE1hdGguYWJzKCBjICkgPCAxZS0xNSApIHtcclxuICAgICAgYyA9IDA7XHJcbiAgICB9XHJcbiAgICBpZiAoIE1hdGguYWJzKCBzICkgPCAxZS0xNSApIHtcclxuICAgICAgcyA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMucm93TWFqb3IoXHJcbiAgICAgIDEsIDAsIDAsXHJcbiAgICAgIDAsIGMsIC1zLFxyXG4gICAgICAwLCBzLCBjLFxyXG4gICAgICBNYXRyaXgzVHlwZS5PVEhFUiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byBhIHJvdGF0aW9uIGFyb3VuZCB0aGUgeSBheGlzIChpbiB0aGUgeHogcGxhbmUpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGFuZ2xlIC0gaW4gcmFkaWFuc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUb1JvdGF0aW9uWSggYW5nbGU6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGxldCBjID0gTWF0aC5jb3MoIGFuZ2xlICk7XHJcbiAgICBsZXQgcyA9IE1hdGguc2luKCBhbmdsZSApO1xyXG5cclxuICAgIC8vIEhhbmRsZSBjYXNlcyBjbG9zZSB0byAwLCBzaW5jZSB3ZSB3YW50IE1hdGguUEkvMiByb3RhdGlvbnMgKGFuZCB0aGUgbGlrZSkgdG8gYmUgZXhhY3RcclxuICAgIGlmICggTWF0aC5hYnMoIGMgKSA8IDFlLTE1ICkge1xyXG4gICAgICBjID0gMDtcclxuICAgIH1cclxuICAgIGlmICggTWF0aC5hYnMoIHMgKSA8IDFlLTE1ICkge1xyXG4gICAgICBzID0gMDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5yb3dNYWpvcihcclxuICAgICAgYywgMCwgcyxcclxuICAgICAgMCwgMSwgMCxcclxuICAgICAgLXMsIDAsIGMsXHJcbiAgICAgIE1hdHJpeDNUeXBlLk9USEVSICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIGEgcm90YXRpb24gYXJvdW5kIHRoZSB6IGF4aXMgKGluIHRoZSB4eSBwbGFuZSkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYW5nbGUgLSBpbiByYWRpYW5zXHJcbiAgICovXHJcbiAgcHVibGljIHNldFRvUm90YXRpb25aKCBhbmdsZTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgbGV0IGMgPSBNYXRoLmNvcyggYW5nbGUgKTtcclxuICAgIGxldCBzID0gTWF0aC5zaW4oIGFuZ2xlICk7XHJcblxyXG4gICAgLy8gSGFuZGxlIGNhc2VzIGNsb3NlIHRvIDAsIHNpbmNlIHdlIHdhbnQgTWF0aC5QSS8yIHJvdGF0aW9ucyAoYW5kIHRoZSBsaWtlKSB0byBiZSBleGFjdFxyXG4gICAgaWYgKCBNYXRoLmFicyggYyApIDwgMWUtMTUgKSB7XHJcbiAgICAgIGMgPSAwO1xyXG4gICAgfVxyXG4gICAgaWYgKCBNYXRoLmFicyggcyApIDwgMWUtMTUgKSB7XHJcbiAgICAgIHMgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLnJvd01ham9yKFxyXG4gICAgICBjLCAtcywgMCxcclxuICAgICAgcywgYywgMCxcclxuICAgICAgMCwgMCwgMSxcclxuICAgICAgTWF0cml4M1R5cGUuQUZGSU5FICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIHRoZSBjb21iaW5lZCB0cmFuc2xhdGlvbityb3RhdGlvbiAod2hlcmUgdGhlIHJvdGF0aW9uIGxvZ2ljYWxseSB3b3VsZCBoYXBwZW4gZmlyc3QsIFRIRU4gaXRcclxuICAgKiB3b3VsZCBiZSB0cmFuc2xhdGVkKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB4XHJcbiAgICogQHBhcmFtIHlcclxuICAgKiBAcGFyYW0gYW5nbGUgLSBpbiByYWRpYW5zXHJcbiAgICovXHJcbiAgcHVibGljIHNldFRvVHJhbnNsYXRpb25Sb3RhdGlvbiggeDogbnVtYmVyLCB5OiBudW1iZXIsIGFuZ2xlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBsZXQgYyA9IE1hdGguY29zKCBhbmdsZSApO1xyXG4gICAgbGV0IHMgPSBNYXRoLnNpbiggYW5nbGUgKTtcclxuXHJcbiAgICAvLyBIYW5kbGUgY2FzZXMgY2xvc2UgdG8gMCwgc2luY2Ugd2Ugd2FudCBNYXRoLlBJLzIgcm90YXRpb25zIChhbmQgdGhlIGxpa2UpIHRvIGJlIGV4YWN0XHJcbiAgICBpZiAoIE1hdGguYWJzKCBjICkgPCAxZS0xNSApIHtcclxuICAgICAgYyA9IDA7XHJcbiAgICB9XHJcbiAgICBpZiAoIE1hdGguYWJzKCBzICkgPCAxZS0xNSApIHtcclxuICAgICAgcyA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMucm93TWFqb3IoXHJcbiAgICAgIGMsIC1zLCB4LFxyXG4gICAgICBzLCBjLCB5LFxyXG4gICAgICAwLCAwLCAxLFxyXG4gICAgICBNYXRyaXgzVHlwZS5BRkZJTkUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhpcyBtYXRyaXggdG8gdGhlIGNvbWJpbmVkIHRyYW5zbGF0aW9uK3JvdGF0aW9uICh3aGVyZSB0aGUgcm90YXRpb24gbG9naWNhbGx5IHdvdWxkIGhhcHBlbiBmaXJzdCwgVEhFTiBpdFxyXG4gICAqIHdvdWxkIGJlIHRyYW5zbGF0ZWQpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHRyYW5zbGF0aW9uXHJcbiAgICogQHBhcmFtIGFuZ2xlIC0gaW4gcmFkaWFuc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUb1RyYW5zbGF0aW9uUm90YXRpb25Qb2ludCggdHJhbnNsYXRpb246IFZlY3RvcjIsIGFuZ2xlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRUb1RyYW5zbGF0aW9uUm90YXRpb24oIHRyYW5zbGF0aW9uLngsIHRyYW5zbGF0aW9uLnksIGFuZ2xlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIHRoZSBjb21iaW5lZCBzY2FsZSt0cmFuc2xhdGlvbityb3RhdGlvbi5cclxuICAgKlxyXG4gICAqIFRoZSBvcmRlciBvZiBvcGVyYXRpb25zIGlzIHNjYWxlLCB0aGVuIHJvdGF0ZSwgdGhlbiB0cmFuc2xhdGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0geFxyXG4gICAqIEBwYXJhbSB5XHJcbiAgICogQHBhcmFtIGFuZ2xlIC0gaW4gcmFkaWFuc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUb1NjYWxlVHJhbnNsYXRpb25Sb3RhdGlvbiggc2NhbGU6IG51bWJlciwgeDogbnVtYmVyLCB5OiBudW1iZXIsIGFuZ2xlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBsZXQgYyA9IE1hdGguY29zKCBhbmdsZSApO1xyXG4gICAgbGV0IHMgPSBNYXRoLnNpbiggYW5nbGUgKTtcclxuXHJcbiAgICAvLyBIYW5kbGUgY2FzZXMgY2xvc2UgdG8gMCwgc2luY2Ugd2Ugd2FudCBNYXRoLlBJLzIgcm90YXRpb25zIChhbmQgdGhlIGxpa2UpIHRvIGJlIGV4YWN0XHJcbiAgICBpZiAoIE1hdGguYWJzKCBjICkgPCAxZS0xNSApIHtcclxuICAgICAgYyA9IDA7XHJcbiAgICB9XHJcbiAgICBpZiAoIE1hdGguYWJzKCBzICkgPCAxZS0xNSApIHtcclxuICAgICAgcyA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgYyAqPSBzY2FsZTtcclxuICAgIHMgKj0gc2NhbGU7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMucm93TWFqb3IoXHJcbiAgICAgIGMsIC1zLCB4LFxyXG4gICAgICBzLCBjLCB5LFxyXG4gICAgICAwLCAwLCAxLFxyXG4gICAgICBNYXRyaXgzVHlwZS5BRkZJTkUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhpcyBtYXRyaXggdG8gdGhlIGNvbWJpbmVkIHRyYW5zbGF0aW9uK3JvdGF0aW9uICh3aGVyZSB0aGUgcm90YXRpb24gbG9naWNhbGx5IHdvdWxkIGhhcHBlbiBmaXJzdCwgVEhFTiBpdFxyXG4gICAqIHdvdWxkIGJlIHRyYW5zbGF0ZWQpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHRyYW5zbGF0aW9uXHJcbiAgICogQHBhcmFtIGFuZ2xlIC0gaW4gcmFkaWFuc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUb1NjYWxlVHJhbnNsYXRpb25Sb3RhdGlvblBvaW50KCBzY2FsZTogbnVtYmVyLCB0cmFuc2xhdGlvbjogVmVjdG9yMiwgYW5nbGU6IG51bWJlciApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLnNldFRvU2NhbGVUcmFuc2xhdGlvblJvdGF0aW9uKCBzY2FsZSwgdHJhbnNsYXRpb24ueCwgdHJhbnNsYXRpb24ueSwgYW5nbGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhpcyBtYXRyaXggdG8gdGhlIHZhbHVlcyBjb250YWluZWQgaW4gYW4gU1ZHTWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUb1NWR01hdHJpeCggc3ZnTWF0cml4OiBTVkdNYXRyaXggKTogdGhpcyB7XHJcbiAgICByZXR1cm4gdGhpcy5yb3dNYWpvcihcclxuICAgICAgc3ZnTWF0cml4LmEsIHN2Z01hdHJpeC5jLCBzdmdNYXRyaXguZSxcclxuICAgICAgc3ZnTWF0cml4LmIsIHN2Z01hdHJpeC5kLCBzdmdNYXRyaXguZixcclxuICAgICAgMCwgMCwgMSxcclxuICAgICAgTWF0cml4M1R5cGUuQUZGSU5FICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIGEgcm90YXRpb24gbWF0cml4IHRoYXQgcm90YXRlcyBBIHRvIEIgKFZlY3RvcjMgaW5zdGFuY2VzKSwgYnkgcm90YXRpbmcgYWJvdXQgdGhlIGF4aXNcclxuICAgKiBBLmNyb3NzKCBCICkgLS0gU2hvcnRlc3QgcGF0aC4gaWRlYWxseSBzaG91bGQgYmUgdW5pdCB2ZWN0b3JzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRSb3RhdGlvbkFUb0IoIGE6IFZlY3RvcjMsIGI6IFZlY3RvcjMgKTogdGhpcyB7XHJcbiAgICAvLyBzZWUgaHR0cDovL2dyYXBoaWNzLmNzLmJyb3duLmVkdS9+amZoL3BhcGVycy9Nb2xsZXItRUJBLTE5OTkvcGFwZXIucGRmIGZvciBpbmZvcm1hdGlvbiBvbiB0aGlzIGltcGxlbWVudGF0aW9uXHJcbiAgICBjb25zdCBzdGFydCA9IGE7XHJcbiAgICBjb25zdCBlbmQgPSBiO1xyXG5cclxuICAgIGNvbnN0IGVwc2lsb24gPSAwLjAwMDE7XHJcblxyXG4gICAgbGV0IHYgPSBzdGFydC5jcm9zcyggZW5kICk7XHJcbiAgICBjb25zdCBlID0gc3RhcnQuZG90KCBlbmQgKTtcclxuICAgIGNvbnN0IGYgPSAoIGUgPCAwICkgPyAtZSA6IGU7XHJcblxyXG4gICAgLy8gaWYgXCJmcm9tXCIgYW5kIFwidG9cIiB2ZWN0b3JzIGFyZSBuZWFybHkgcGFyYWxsZWxcclxuICAgIGlmICggZiA+IDEuMCAtIGVwc2lsb24gKSB7XHJcbiAgICAgIGxldCB4ID0gbmV3IFZlY3RvcjMoXHJcbiAgICAgICAgKCBzdGFydC54ID4gMC4wICkgPyBzdGFydC54IDogLXN0YXJ0LngsXHJcbiAgICAgICAgKCBzdGFydC55ID4gMC4wICkgPyBzdGFydC55IDogLXN0YXJ0LnksXHJcbiAgICAgICAgKCBzdGFydC56ID4gMC4wICkgPyBzdGFydC56IDogLXN0YXJ0LnpcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmICggeC54IDwgeC55ICkge1xyXG4gICAgICAgIGlmICggeC54IDwgeC56ICkge1xyXG4gICAgICAgICAgeCA9IFZlY3RvcjMuWF9VTklUO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHggPSBWZWN0b3IzLlpfVU5JVDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKCB4LnkgPCB4LnogKSB7XHJcbiAgICAgICAgICB4ID0gVmVjdG9yMy5ZX1VOSVQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgeCA9IFZlY3RvcjMuWl9VTklUO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgdSA9IHgubWludXMoIHN0YXJ0ICk7XHJcbiAgICAgIHYgPSB4Lm1pbnVzKCBlbmQgKTtcclxuXHJcbiAgICAgIGNvbnN0IGMxID0gMi4wIC8gdS5kb3QoIHUgKTtcclxuICAgICAgY29uc3QgYzIgPSAyLjAgLyB2LmRvdCggdiApO1xyXG4gICAgICBjb25zdCBjMyA9IGMxICogYzIgKiB1LmRvdCggdiApO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMucm93TWFqb3IoXHJcbiAgICAgICAgLWMxICogdS54ICogdS54IC0gYzIgKiB2LnggKiB2LnggKyBjMyAqIHYueCAqIHUueCArIDEsXHJcbiAgICAgICAgLWMxICogdS54ICogdS55IC0gYzIgKiB2LnggKiB2LnkgKyBjMyAqIHYueCAqIHUueSxcclxuICAgICAgICAtYzEgKiB1LnggKiB1LnogLSBjMiAqIHYueCAqIHYueiArIGMzICogdi54ICogdS56LFxyXG4gICAgICAgIC1jMSAqIHUueSAqIHUueCAtIGMyICogdi55ICogdi54ICsgYzMgKiB2LnkgKiB1LngsXHJcbiAgICAgICAgLWMxICogdS55ICogdS55IC0gYzIgKiB2LnkgKiB2LnkgKyBjMyAqIHYueSAqIHUueSArIDEsXHJcbiAgICAgICAgLWMxICogdS55ICogdS56IC0gYzIgKiB2LnkgKiB2LnogKyBjMyAqIHYueSAqIHUueixcclxuICAgICAgICAtYzEgKiB1LnogKiB1LnggLSBjMiAqIHYueiAqIHYueCArIGMzICogdi56ICogdS54LFxyXG4gICAgICAgIC1jMSAqIHUueiAqIHUueSAtIGMyICogdi56ICogdi55ICsgYzMgKiB2LnogKiB1LnksXHJcbiAgICAgICAgLWMxICogdS56ICogdS56IC0gYzIgKiB2LnogKiB2LnogKyBjMyAqIHYueiAqIHUueiArIDFcclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyB0aGUgbW9zdCBjb21tb24gY2FzZSwgdW5sZXNzIFwic3RhcnRcIj1cImVuZFwiLCBvciBcInN0YXJ0XCI9LVwiZW5kXCJcclxuICAgICAgY29uc3QgaCA9IDEuMCAvICggMS4wICsgZSApO1xyXG4gICAgICBjb25zdCBodnggPSBoICogdi54O1xyXG4gICAgICBjb25zdCBodnogPSBoICogdi56O1xyXG4gICAgICBjb25zdCBodnh5ID0gaHZ4ICogdi55O1xyXG4gICAgICBjb25zdCBodnh6ID0gaHZ4ICogdi56O1xyXG4gICAgICBjb25zdCBodnl6ID0gaHZ6ICogdi55O1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMucm93TWFqb3IoXHJcbiAgICAgICAgZSArIGh2eCAqIHYueCwgaHZ4eSAtIHYueiwgaHZ4eiArIHYueSxcclxuICAgICAgICBodnh5ICsgdi56LCBlICsgaCAqIHYueSAqIHYueSwgaHZ5eiAtIHYueCxcclxuICAgICAgICBodnh6IC0gdi55LCBodnl6ICsgdi54LCBlICsgaHZ6ICogdi56XHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBNdXRhYmxlIG9wZXJhdGlvbnMgKGNoYW5nZXMgdGhlIHBhcmFtZXRlcilcclxuICAgKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB2ZWN0b3IgdG8gdGhlIHJlc3VsdCBvZiAobWF0cml4ICogdmVjdG9yKSwgYXMgYSBob21vZ2VuZW91cyBtdWx0aXBsaWNhdGlvbi5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIC0gVGhlIHZlY3RvciB0aGF0IHdhcyBtdXRhdGVkXHJcbiAgICovXHJcbiAgcHVibGljIG11bHRpcGx5VmVjdG9yMiggdmVjdG9yMjogVmVjdG9yMiApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB2ZWN0b3IyLnNldFhZKFxyXG4gICAgICB0aGlzLm0wMCgpICogdmVjdG9yMi54ICsgdGhpcy5tMDEoKSAqIHZlY3RvcjIueSArIHRoaXMubTAyKCksXHJcbiAgICAgIHRoaXMubTEwKCkgKiB2ZWN0b3IyLnggKyB0aGlzLm0xMSgpICogdmVjdG9yMi55ICsgdGhpcy5tMTIoKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdmVjdG9yIHRvIHRoZSByZXN1bHQgb2YgKG1hdHJpeCAqIHZlY3RvcikuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyAtIFRoZSB2ZWN0b3IgdGhhdCB3YXMgbXV0YXRlZFxyXG4gICAqL1xyXG4gIHB1YmxpYyBtdWx0aXBseVZlY3RvcjMoIHZlY3RvcjM6IFZlY3RvcjMgKTogVmVjdG9yMyB7XHJcbiAgICByZXR1cm4gdmVjdG9yMy5zZXRYWVooXHJcbiAgICAgIHRoaXMubTAwKCkgKiB2ZWN0b3IzLnggKyB0aGlzLm0wMSgpICogdmVjdG9yMy55ICsgdGhpcy5tMDIoKSAqIHZlY3RvcjMueixcclxuICAgICAgdGhpcy5tMTAoKSAqIHZlY3RvcjMueCArIHRoaXMubTExKCkgKiB2ZWN0b3IzLnkgKyB0aGlzLm0xMigpICogdmVjdG9yMy56LFxyXG4gICAgICB0aGlzLm0yMCgpICogdmVjdG9yMy54ICsgdGhpcy5tMjEoKSAqIHZlY3RvcjMueSArIHRoaXMubTIyKCkgKiB2ZWN0b3IzLnogKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHZlY3RvciB0byB0aGUgcmVzdWx0IG9mICh0cmFuc3Bvc2UobWF0cml4KSAqIHZlY3RvciksIGlnbm9yaW5nIHRoZSB0cmFuc2xhdGlvbiBwYXJhbWV0ZXJzLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBUaGUgdmVjdG9yIHRoYXQgd2FzIG11dGF0ZWRcclxuICAgKi9cclxuICBwdWJsaWMgbXVsdGlwbHlUcmFuc3Bvc2VWZWN0b3IyKCB2OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHYuc2V0WFkoXHJcbiAgICAgIHRoaXMubTAwKCkgKiB2LnggKyB0aGlzLm0xMCgpICogdi55LFxyXG4gICAgICB0aGlzLm0wMSgpICogdi54ICsgdGhpcy5tMTEoKSAqIHYueSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdmVjdG9yIHRvIHRoZSByZXN1bHQgb2YgKG1hdHJpeCAqIHZlY3RvciAtIG1hdHJpeCAqIHplcm8pLiBTaW5jZSB0aGlzIGlzIGEgaG9tb2dlbmVvdXMgb3BlcmF0aW9uLCBpdCBpc1xyXG4gICAqIGVxdWl2YWxlbnQgdG8gdGhlIG11bHRpcGxpY2F0aW9uIG9mICh4LHksMCkuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyAtIFRoZSB2ZWN0b3IgdGhhdCB3YXMgbXV0YXRlZFxyXG4gICAqL1xyXG4gIHB1YmxpYyBtdWx0aXBseVJlbGF0aXZlVmVjdG9yMiggdjogVmVjdG9yMiApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB2LnNldFhZKFxyXG4gICAgICB0aGlzLm0wMCgpICogdi54ICsgdGhpcy5tMDEoKSAqIHYueSxcclxuICAgICAgdGhpcy5tMTAoKSAqIHYueSArIHRoaXMubTExKCkgKiB2LnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHRyYW5zZm9ybSBvZiBhIENhbnZhcyAyRCByZW5kZXJpbmcgY29udGV4dCB0byB0aGUgYWZmaW5lIHBhcnQgb2YgdGhpcyBtYXRyaXhcclxuICAgKi9cclxuICBwdWJsaWMgY2FudmFzU2V0VHJhbnNmb3JtKCBjb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgKTogdm9pZCB7XHJcbiAgICBjb250ZXh0LnNldFRyYW5zZm9ybShcclxuICAgICAgLy8gaW5saW5lZCBhcnJheSBlbnRyaWVzXHJcbiAgICAgIHRoaXMuZW50cmllc1sgMCBdLFxyXG4gICAgICB0aGlzLmVudHJpZXNbIDEgXSxcclxuICAgICAgdGhpcy5lbnRyaWVzWyAzIF0sXHJcbiAgICAgIHRoaXMuZW50cmllc1sgNCBdLFxyXG4gICAgICB0aGlzLmVudHJpZXNbIDYgXSxcclxuICAgICAgdGhpcy5lbnRyaWVzWyA3IF1cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcHBlbmRzIHRvIHRoZSBhZmZpbmUgcGFydCBvZiB0aGlzIG1hdHJpeCB0byB0aGUgQ2FudmFzIDJEIHJlbmRlcmluZyBjb250ZXh0XHJcbiAgICovXHJcbiAgcHVibGljIGNhbnZhc0FwcGVuZFRyYW5zZm9ybSggY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEICk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLnR5cGUgIT09IE1hdHJpeDNUeXBlLklERU5USVRZICkge1xyXG4gICAgICBjb250ZXh0LnRyYW5zZm9ybShcclxuICAgICAgICAvLyBpbmxpbmVkIGFycmF5IGVudHJpZXNcclxuICAgICAgICB0aGlzLmVudHJpZXNbIDAgXSxcclxuICAgICAgICB0aGlzLmVudHJpZXNbIDEgXSxcclxuICAgICAgICB0aGlzLmVudHJpZXNbIDMgXSxcclxuICAgICAgICB0aGlzLmVudHJpZXNbIDQgXSxcclxuICAgICAgICB0aGlzLmVudHJpZXNbIDYgXSxcclxuICAgICAgICB0aGlzLmVudHJpZXNbIDcgXVxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29waWVzIHRoZSBlbnRyaWVzIG9mIHRoaXMgbWF0cml4IG92ZXIgdG8gYW4gYXJiaXRyYXJ5IGFycmF5ICh0eXBlZCBvciBub3JtYWwpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb3B5VG9BcnJheSggYXJyYXk6IG51bWJlcltdIHwgRmxvYXQzMkFycmF5IHwgRmxvYXQ2NEFycmF5ICk6IG51bWJlcltdIHwgRmxvYXQzMkFycmF5IHwgRmxvYXQ2NEFycmF5IHtcclxuICAgIGFycmF5WyAwIF0gPSB0aGlzLm0wMCgpO1xyXG4gICAgYXJyYXlbIDEgXSA9IHRoaXMubTEwKCk7XHJcbiAgICBhcnJheVsgMiBdID0gdGhpcy5tMjAoKTtcclxuICAgIGFycmF5WyAzIF0gPSB0aGlzLm0wMSgpO1xyXG4gICAgYXJyYXlbIDQgXSA9IHRoaXMubTExKCk7XHJcbiAgICBhcnJheVsgNSBdID0gdGhpcy5tMjEoKTtcclxuICAgIGFycmF5WyA2IF0gPSB0aGlzLm0wMigpO1xyXG4gICAgYXJyYXlbIDcgXSA9IHRoaXMubTEyKCk7XHJcbiAgICBhcnJheVsgOCBdID0gdGhpcy5tMjIoKTtcclxuICAgIHJldHVybiBhcnJheTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBmcmVlVG9Qb29sKCk6IHZvaWQge1xyXG4gICAgTWF0cml4My5wb29sLmZyZWVUb1Bvb2woIHRoaXMgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgcG9vbCA9IG5ldyBQb29sKCBNYXRyaXgzLCB7XHJcbiAgICBpbml0aWFsaXplOiBNYXRyaXgzLnByb3RvdHlwZS5pbml0aWFsaXplLFxyXG4gICAgdXNlRGVmYXVsdENvbnN0cnVjdGlvbjogdHJ1ZSxcclxuICAgIG1heFNpemU6IDMwMFxyXG4gIH0gKTtcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBpZGVudGl0eSBtYXRyaXguXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBpZGVudGl0eSgpOiBNYXRyaXgzIHtcclxuICAgIHJldHVybiBmcm9tUG9vbCgpLnNldFRvSWRlbnRpdHkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB0cmFuc2xhdGlvbiBtYXRyaXguXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyB0cmFuc2xhdGlvbiggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gZnJvbVBvb2woKS5zZXRUb1RyYW5zbGF0aW9uKCB4LCB5ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgdHJhbnNsYXRpb24gbWF0cml4IGNvbXB1dGVkIGZyb20gYSB2ZWN0b3IuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyB0cmFuc2xhdGlvbkZyb21WZWN0b3IoIHZlY3RvcjogVmVjdG9yMiB8IFZlY3RvcjMgKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gTWF0cml4My50cmFuc2xhdGlvbiggdmVjdG9yLngsIHZlY3Rvci55ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbWF0cml4IHRoYXQgc2NhbGVzIHRoaW5ncyBpbiBlYWNoIGRpbWVuc2lvbi5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHNjYWxpbmcoIHg6IG51bWJlciwgeT86IG51bWJlciApOiBNYXRyaXgzIHtcclxuICAgIHJldHVybiBmcm9tUG9vbCgpLnNldFRvU2NhbGUoIHgsIHkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBtYXRyaXggdGhhdCBzY2FsZXMgdGhpbmdzIGluIGVhY2ggZGltZW5zaW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgc2NhbGUoIHg6IG51bWJlciwgeT86IG51bWJlciApOiBNYXRyaXgzIHtcclxuICAgIHJldHVybiBNYXRyaXgzLnNjYWxpbmcoIHgsIHkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYWZmaW5lIG1hdHJpeCB3aXRoIHRoZSBnaXZlbiBwYXJhbWV0ZXJzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgYWZmaW5lKCBtMDA6IG51bWJlciwgbTAxOiBudW1iZXIsIG0wMjogbnVtYmVyLCBtMTA6IG51bWJlciwgbTExOiBudW1iZXIsIG0xMjogbnVtYmVyICk6IE1hdHJpeDMge1xyXG4gICAgcmV0dXJuIGZyb21Qb29sKCkuc2V0VG9BZmZpbmUoIG0wMCwgbTAxLCBtMDIsIG0xMCwgbTExLCBtMTIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgbWF0cml4IHdpdGggYWxsIGVudHJpZXMgZGV0ZXJtaW5lZCBpbiByb3ctbWFqb3Igb3JkZXIuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByb3dNYWpvciggdjAwOiBudW1iZXIsIHYwMTogbnVtYmVyLCB2MDI6IG51bWJlciwgdjEwOiBudW1iZXIsIHYxMTogbnVtYmVyLCB2MTI6IG51bWJlciwgdjIwOiBudW1iZXIsIHYyMTogbnVtYmVyLCB2MjI6IG51bWJlciwgdHlwZT86IE1hdHJpeDNUeXBlICk6IE1hdHJpeDMge1xyXG4gICAgcmV0dXJuIGZyb21Qb29sKCkucm93TWFqb3IoXHJcbiAgICAgIHYwMCwgdjAxLCB2MDIsXHJcbiAgICAgIHYxMCwgdjExLCB2MTIsXHJcbiAgICAgIHYyMCwgdjIxLCB2MjIsXHJcbiAgICAgIHR5cGVcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbWF0cml4IHJvdGF0aW9uIGRlZmluZWQgYnkgYSByb3RhdGlvbiBvZiB0aGUgc3BlY2lmaWVkIGFuZ2xlIGFyb3VuZCB0aGUgZ2l2ZW4gdW5pdCBheGlzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGF4aXMgLSBub3JtYWxpemVkXHJcbiAgICogQHBhcmFtIGFuZ2xlIC0gaW4gcmFkaWFuc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcm90YXRpb25BeGlzQW5nbGUoIGF4aXM6IFZlY3RvcjMsIGFuZ2xlOiBudW1iZXIgKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gZnJvbVBvb2woKS5zZXRUb1JvdGF0aW9uQXhpc0FuZ2xlKCBheGlzLCBhbmdsZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG1hdHJpeCB0aGF0IHJvdGF0ZXMgYXJvdW5kIHRoZSB4IGF4aXMgKGluIHRoZSB5eiBwbGFuZSkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYW5nbGUgLSBpbiByYWRpYW5zXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByb3RhdGlvblgoIGFuZ2xlOiBudW1iZXIgKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gZnJvbVBvb2woKS5zZXRUb1JvdGF0aW9uWCggYW5nbGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBtYXRyaXggdGhhdCByb3RhdGVzIGFyb3VuZCB0aGUgeSBheGlzIChpbiB0aGUgeHogcGxhbmUpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGFuZ2xlIC0gaW4gcmFkaWFuc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcm90YXRpb25ZKCBhbmdsZTogbnVtYmVyICk6IE1hdHJpeDMge1xyXG4gICAgcmV0dXJuIGZyb21Qb29sKCkuc2V0VG9Sb3RhdGlvblkoIGFuZ2xlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbWF0cml4IHRoYXQgcm90YXRlcyBhcm91bmQgdGhlIHogYXhpcyAoaW4gdGhlIHh5IHBsYW5lKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhbmdsZSAtIGluIHJhZGlhbnNcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJvdGF0aW9uWiggYW5nbGU6IG51bWJlciApOiBNYXRyaXgzIHtcclxuICAgIHJldHVybiBmcm9tUG9vbCgpLnNldFRvUm90YXRpb25aKCBhbmdsZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGNvbWJpbmVkIDJkIHRyYW5zbGF0aW9uICsgcm90YXRpb24gKHdpdGggdGhlIHJvdGF0aW9uIGVmZmVjdGl2ZWx5IGFwcGxpZWQgZmlyc3QpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGFuZ2xlIC0gaW4gcmFkaWFuc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgdHJhbnNsYXRpb25Sb3RhdGlvbiggeDogbnVtYmVyLCB5OiBudW1iZXIsIGFuZ2xlOiBudW1iZXIgKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gZnJvbVBvb2woKS5zZXRUb1RyYW5zbGF0aW9uUm90YXRpb24oIHgsIHksIGFuZ2xlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdGFuZGFyZCAyZCByb3RhdGlvbiBtYXRyaXggZm9yIGEgZ2l2ZW4gYW5nbGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYW5nbGUgLSBpbiByYWRpYW5zXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByb3RhdGlvbjIoIGFuZ2xlOiBudW1iZXIgKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gZnJvbVBvb2woKS5zZXRUb1JvdGF0aW9uWiggYW5nbGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBtYXRyaXggd2hpY2ggd2lsbCBiZSBhIDJkIHJvdGF0aW9uIGFyb3VuZCBhIGdpdmVuIHgseSBwb2ludC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhbmdsZSAtIGluIHJhZGlhbnNcclxuICAgKiBAcGFyYW0geFxyXG4gICAqIEBwYXJhbSB5XHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByb3RhdGlvbkFyb3VuZCggYW5nbGU6IG51bWJlciwgeDogbnVtYmVyLCB5OiBudW1iZXIgKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gTWF0cml4My50cmFuc2xhdGlvbiggeCwgeSApLnRpbWVzTWF0cml4KCBNYXRyaXgzLnJvdGF0aW9uMiggYW5nbGUgKSApLnRpbWVzTWF0cml4KCBNYXRyaXgzLnRyYW5zbGF0aW9uKCAteCwgLXkgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG1hdHJpeCB3aGljaCB3aWxsIGJlIGEgMmQgcm90YXRpb24gYXJvdW5kIGEgZ2l2ZW4gMmQgcG9pbnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYW5nbGUgLSBpbiByYWRpYW5zXHJcbiAgICogQHBhcmFtIHBvaW50XHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByb3RhdGlvbkFyb3VuZFBvaW50KCBhbmdsZTogbnVtYmVyLCBwb2ludDogVmVjdG9yMiApOiBNYXRyaXgzIHtcclxuICAgIHJldHVybiBNYXRyaXgzLnJvdGF0aW9uQXJvdW5kKCBhbmdsZSwgcG9pbnQueCwgcG9pbnQueSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG1hdHJpeCBlcXVpdmFsZW50IHRvIGEgZ2l2ZW4gU1ZHTWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZnJvbVNWR01hdHJpeCggc3ZnTWF0cml4OiBTVkdNYXRyaXggKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gZnJvbVBvb2woKS5zZXRUb1NWR01hdHJpeCggc3ZnTWF0cml4ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgcm90YXRpb24gbWF0cml4IHRoYXQgcm90YXRlcyBBIHRvIEIsIGJ5IHJvdGF0aW5nIGFib3V0IHRoZSBheGlzIEEuY3Jvc3MoIEIgKSAtLSBTaG9ydGVzdCBwYXRoLiBpZGVhbGx5XHJcbiAgICogc2hvdWxkIGJlIHVuaXQgdmVjdG9ycy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJvdGF0ZUFUb0IoIGE6IFZlY3RvcjMsIGI6IFZlY3RvcjMgKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gZnJvbVBvb2woKS5zZXRSb3RhdGlvbkFUb0IoIGEsIGIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNob3J0Y3V0IGZvciB0cmFuc2xhdGlvbiB0aW1lcyBhIG1hdHJpeCAod2l0aG91dCBhbGxvY2F0aW5nIGEgdHJhbnNsYXRpb24gbWF0cml4KSwgc2VlIHNjZW5lcnkjMTE5XHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyB0cmFuc2xhdGlvblRpbWVzTWF0cml4KCB4OiBudW1iZXIsIHk6IG51bWJlciwgbWF0cml4OiBNYXRyaXgzICk6IE1hdHJpeDMge1xyXG4gICAgbGV0IHR5cGU7XHJcbiAgICBpZiAoIG1hdHJpeC50eXBlID09PSBNYXRyaXgzVHlwZS5JREVOVElUWSB8fCBtYXRyaXgudHlwZSA9PT0gTWF0cml4M1R5cGUuVFJBTlNMQVRJT05fMkQgKSB7XHJcbiAgICAgIHJldHVybiBtMyhcclxuICAgICAgICAxLCAwLCBtYXRyaXgubTAyKCkgKyB4LFxyXG4gICAgICAgIDAsIDEsIG1hdHJpeC5tMTIoKSArIHksXHJcbiAgICAgICAgMCwgMCwgMSxcclxuICAgICAgICBNYXRyaXgzVHlwZS5UUkFOU0xBVElPTl8yRCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIG1hdHJpeC50eXBlID09PSBNYXRyaXgzVHlwZS5PVEhFUiApIHtcclxuICAgICAgdHlwZSA9IE1hdHJpeDNUeXBlLk9USEVSO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHR5cGUgPSBNYXRyaXgzVHlwZS5BRkZJTkU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbTMoXHJcbiAgICAgIG1hdHJpeC5tMDAoKSwgbWF0cml4Lm0wMSgpLCBtYXRyaXgubTAyKCkgKyB4LFxyXG4gICAgICBtYXRyaXgubTEwKCksIG1hdHJpeC5tMTEoKSwgbWF0cml4Lm0xMigpICsgeSxcclxuICAgICAgbWF0cml4Lm0yMCgpLCBtYXRyaXgubTIxKCksIG1hdHJpeC5tMjIoKSxcclxuICAgICAgdHlwZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VyaWFsaXplIHRvIGFuIE9iamVjdCB0aGF0IGNhbiBiZSBoYW5kbGVkIGJ5IFBoRVQtaU9cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHRvU3RhdGVPYmplY3QoIG1hdHJpeDM6IE1hdHJpeDMgKTogTWF0cml4M1N0YXRlT2JqZWN0IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGVudHJpZXM6IG1hdHJpeDMuZW50cmllcyxcclxuICAgICAgdHlwZTogbWF0cml4My50eXBlLm5hbWVcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0IGJhY2sgZnJvbSBhIHNlcmlhbGl6ZWQgT2JqZWN0IHRvIGEgTWF0cml4M1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZnJvbVN0YXRlT2JqZWN0KCBzdGF0ZU9iamVjdDogTWF0cml4M1N0YXRlT2JqZWN0ICk6IE1hdHJpeDMge1xyXG4gICAgY29uc3QgbWF0cml4ID0gTWF0cml4My5pZGVudGl0eSgpO1xyXG4gICAgbWF0cml4LmVudHJpZXMgPSBzdGF0ZU9iamVjdC5lbnRyaWVzO1xyXG4gICAgbWF0cml4LnR5cGUgPSBNYXRyaXgzVHlwZS5lbnVtZXJhdGlvbi5nZXRWYWx1ZSggc3RhdGVPYmplY3QudHlwZSApO1xyXG4gICAgcmV0dXJuIG1hdHJpeDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgSURFTlRJVFk6IE1hdHJpeDM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdXBwZXJjYXNlLXN0YXRpY3Mtc2hvdWxkLWJlLXJlYWRvbmx5XHJcbiAgcHVibGljIHN0YXRpYyBYX1JFRkxFQ1RJT046IE1hdHJpeDM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdXBwZXJjYXNlLXN0YXRpY3Mtc2hvdWxkLWJlLXJlYWRvbmx5XHJcbiAgcHVibGljIHN0YXRpYyBZX1JFRkxFQ1RJT046IE1hdHJpeDM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdXBwZXJjYXNlLXN0YXRpY3Mtc2hvdWxkLWJlLXJlYWRvbmx5XHJcbiAgcHVibGljIHN0YXRpYyBNYXRyaXgzSU86IElPVHlwZTtcclxufVxyXG5cclxuZG90LnJlZ2lzdGVyKCAnTWF0cml4MycsIE1hdHJpeDMgKTtcclxuXHJcbmNvbnN0IGZyb21Qb29sID0gTWF0cml4My5wb29sLmZldGNoLmJpbmQoIE1hdHJpeDMucG9vbCApO1xyXG5cclxuY29uc3QgbTMgPSAoIHYwMDogbnVtYmVyLCB2MDE6IG51bWJlciwgdjAyOiBudW1iZXIsIHYxMDogbnVtYmVyLCB2MTE6IG51bWJlciwgdjEyOiBudW1iZXIsIHYyMDogbnVtYmVyLCB2MjE6IG51bWJlciwgdjIyOiBudW1iZXIsIHR5cGU/OiBNYXRyaXgzVHlwZSApOiBNYXRyaXgzID0+IHtcclxuICByZXR1cm4gZnJvbVBvb2woKS5yb3dNYWpvciggdjAwLCB2MDEsIHYwMiwgdjEwLCB2MTEsIHYxMiwgdjIwLCB2MjEsIHYyMiwgdHlwZSApO1xyXG59O1xyXG5leHBvcnQgeyBtMyB9O1xyXG5kb3QucmVnaXN0ZXIoICdtMycsIG0zICk7XHJcblxyXG5NYXRyaXgzLklERU5USVRZID0gTWF0cml4My5pZGVudGl0eSgpLm1ha2VJbW11dGFibGUoKTtcclxuTWF0cml4My5YX1JFRkxFQ1RJT04gPSBtMyhcclxuICAtMSwgMCwgMCxcclxuICAwLCAxLCAwLFxyXG4gIDAsIDAsIDEsXHJcbiAgTWF0cml4M1R5cGUuQUZGSU5FXHJcbikubWFrZUltbXV0YWJsZSgpO1xyXG5NYXRyaXgzLllfUkVGTEVDVElPTiA9IG0zKFxyXG4gIDEsIDAsIDAsXHJcbiAgMCwgLTEsIDAsXHJcbiAgMCwgMCwgMSxcclxuICBNYXRyaXgzVHlwZS5BRkZJTkVcclxuKS5tYWtlSW1tdXRhYmxlKCk7XHJcblxyXG5NYXRyaXgzLk1hdHJpeDNJTyA9IG5ldyBJT1R5cGUoICdNYXRyaXgzSU8nLCB7XHJcbiAgdmFsdWVUeXBlOiBNYXRyaXgzLFxyXG4gIGRvY3VtZW50YXRpb246ICdBIDN4MyBtYXRyaXggb2Z0ZW4gdXNlZCBmb3IgaG9sZGluZyB0cmFuc2Zvcm0gZGF0YS4nLFxyXG4gIHRvU3RhdGVPYmplY3Q6ICggbWF0cml4MzogTWF0cml4MyApID0+IE1hdHJpeDMudG9TdGF0ZU9iamVjdCggbWF0cml4MyApLFxyXG4gIGZyb21TdGF0ZU9iamVjdDogTWF0cml4My5mcm9tU3RhdGVPYmplY3QsXHJcbiAgc3RhdGVTY2hlbWE6IHtcclxuICAgIGVudHJpZXM6IEFycmF5SU8oIE51bWJlcklPICksXHJcbiAgICB0eXBlOiBFbnVtZXJhdGlvbklPKCBNYXRyaXgzVHlwZSApXHJcbiAgfVxyXG59ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGFBQWEsTUFBTSx3Q0FBd0M7QUFDbEUsT0FBT0MsT0FBTyxNQUFNLGtDQUFrQztBQUN0RCxPQUFPQyxNQUFNLE1BQU0saUNBQWlDO0FBQ3BELE9BQU9DLFFBQVEsTUFBTSxtQ0FBbUM7QUFDeEQsT0FBT0MsR0FBRyxNQUFNLFVBQVU7QUFDMUIsT0FBT0MsT0FBTyxNQUFNLGNBQWM7QUFDbEMsT0FBT0MsV0FBVyxNQUFNLGtCQUFr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LElBQUksQ0FBQ3ZFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNJLEdBQUcsQ0FBQyxDQUFDLElBQUt3RCxHQUFHLEVBQzVELENBQUUsSUFBSSxDQUFDOUQsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDTixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ08sR0FBRyxDQUFDLENBQUMsSUFBS3dELEdBQUcsRUFDM0QsQ0FBRSxDQUFDLElBQUksQ0FBQzlELEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0gsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNJLEdBQUcsQ0FBQyxDQUFDLElBQUsyRCxHQUFHLEVBQzVELENBQUUsSUFBSSxDQUFDM0QsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsSUFBS3dELEdBQUcsRUFDM0QsQ0FBRSxDQUFDLElBQUksQ0FBQzlELEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ04sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNRLEdBQUcsQ0FBQyxDQUFDLElBQUt3RCxHQUFHLEVBQzVELENBQUUsSUFBSSxDQUFDOUQsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDSCxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0ssR0FBRyxDQUFDLENBQUMsSUFBSzJELEdBQUcsRUFDM0QsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUvRSxXQUFX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