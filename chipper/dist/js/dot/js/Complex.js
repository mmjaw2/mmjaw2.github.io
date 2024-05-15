// Copyright 2013-2024, University of Colorado Boulder

/**
 * A complex number with mutable and immutable methods.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Matt Pennington (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import dot from './dot.js';
import Utils from './Utils.js';
export default class Complex {
  // The real part. For a complex number $a+bi$, this is $a$.

  // The imaginary part. For a complex number $a+bi$, this is $b$.

  /**
   * Creates a complex number, that has both a real and imaginary part.
   *
   * @param real - The real part. For a complex number $a+bi$, this should be $a$.
   * @param imaginary - The imaginary part. For a complex number $a+bi$, this should be $b$.
   */
  constructor(real, imaginary) {
    this.real = real;
    this.imaginary = imaginary;
  }

  /**
   * Creates a copy of this complex, or if a complex is passed in, set that complex's values to ours.
   *
   * This is the immutable form of the function set(), if a complex is provided. This will return a new complex, and
   * will not modify this complex.
   *
   * @param [complex] - If not provided, creates a new Complex with filled in values. Otherwise, fills
   *                              in the values of the provided complex so that it equals this complex.
   */
  copy(complex) {
    if (complex) {
      return complex.set(this);
    } else {
      return new Complex(this.real, this.imaginary);
    }
  }

  /**
   * The phase / argument of the complex number.
   */
  phase() {
    return Math.atan2(this.imaginary, this.real);
  }

  /**
   * The magnitude (Euclidean/L2 Norm) of this complex number, i.e. $\sqrt{a^2+b^2}$.
   */
  getMagnitude() {
    return Math.sqrt(this.magnitudeSquared);
  }
  get magnitude() {
    return this.getMagnitude();
  }

  /**
   * The squared magnitude (square of the Euclidean/L2 Norm) of this complex, i.e. $a^2+b^2$.
   */
  getMagnitudeSquared() {
    return this.real * this.real + this.imaginary * this.imaginary;
  }
  get magnitudeSquared() {
    return this.getMagnitudeSquared();
  }

  /**
   * Returns the argument of this complex number (immutable)
   */
  getArgument() {
    return Math.atan2(this.imaginary, this.real);
  }
  get argument() {
    return this.getArgument();
  }

  /**
   * Exact equality comparison between this Complex and another Complex.
   *
   * @returns Whether the two complex numbers have equal components
   */
  equals(other) {
    return this.real === other.real && this.imaginary === other.imaginary;
  }

  /**
   * Approximate equality comparison between this Complex and another Complex.
   *
   * @returns - Whether difference between the two complex numbers has no component with an absolute value
   *            greater than epsilon.
   */
  equalsEpsilon(other, epsilon = 0) {
    return Math.max(Math.abs(this.real - other.real), Math.abs(this.imaginary - other.imaginary)) <= epsilon;
  }

  /**
   * Addition of this Complex and another Complex, returning a copy.
   *
   * This is the immutable form of the function add(). This will return a new Complex, and will not modify
   * this Complex.
   */
  plus(c) {
    return new Complex(this.real + c.real, this.imaginary + c.imaginary);
  }

  /**
   * Subtraction of this Complex by another Complex c, returning a copy.
   *
   * This is the immutable form of the function subtract(). This will return a new Complex, and will not modify
   * this Complex.
   */
  minus(c) {
    return new Complex(this.real - c.real, this.imaginary - c.imaginary);
  }

  /**
   * Complex multiplication.
   * Immutable version of multiply
   */
  times(c) {
    return new Complex(this.real * c.real - this.imaginary * c.imaginary, this.real * c.imaginary + this.imaginary * c.real);
  }

  /**
   * Complex division.
   * Immutable version of divide
   */
  dividedBy(c) {
    const cMag = c.magnitudeSquared;
    return new Complex((this.real * c.real + this.imaginary * c.imaginary) / cMag, (this.imaginary * c.real - this.real * c.imaginary) / cMag);
  }

  /**
   * Complex negation
   * Immutable version of negate
   */
  negated() {
    return new Complex(-this.real, -this.imaginary);
  }

  /**
   * Square root.
   * Immutable form of sqrt.
   *
   */
  sqrtOf() {
    const mag = this.magnitude;
    return new Complex(Math.sqrt((mag + this.real) / 2), (this.imaginary >= 0 ? 1 : -1) * Math.sqrt((mag - this.real) / 2));
  }

  /**
   * Returns the power of this complex number by a real number.
   */
  powerByReal(realPower) {
    const magTimes = Math.pow(this.magnitude, realPower);
    const angle = realPower * this.phase();
    return new Complex(magTimes * Math.cos(angle), magTimes * Math.sin(angle));
  }

  /**
   * Sine.
   * Immutable form of sin.
   *
   */
  sinOf() {
    return new Complex(Math.sin(this.real) * Utils.cosh(this.imaginary), Math.cos(this.real) * Utils.sinh(this.imaginary));
  }

  /**
   * Cosine.
   * Immutable form of cos.
   *
   */
  cosOf() {
    return new Complex(Math.cos(this.real) * Utils.cosh(this.imaginary), -Math.sin(this.real) * Utils.sinh(this.imaginary));
  }

  /**
   * Returns the square of this complex number and does not modify it.
   * This is the immutable version of square.
   *
   */
  squared() {
    return this.times(this);
  }

  /**
   * Complex conjugate.
   * Immutable form of conjugate
   *
   */
  conjugated() {
    return new Complex(this.real, -this.imaginary);
  }

  /**
   * Takes e to the power of this complex number. $e^{a+bi}=e^a\cos b + i\sin b$.
   * This is the immutable form of exponentiate.
   *
   */
  exponentiated() {
    return Complex.createPolar(Math.exp(this.real), this.imaginary);
  }

  /*** Mutable functions ***/

  /**
   * Sets all components of this complex, returning this
   *
   */
  setRealImaginary(real, imaginary) {
    this.real = real;
    this.imaginary = imaginary;
    return this;
  }

  /**
   * Sets the real component of this complex, returning this
   */
  setReal(real) {
    this.real = real;
    return this;
  }

  /**
   * Sets the imaginary component of this complex, returning this
   */
  setImaginary(imaginary) {
    this.imaginary = imaginary;
    return this;
  }

  /**
   * Sets the components of this complex to be a copy of the parameter
   *
   * This is the mutable form of the function copy(). This will mutate (change) this complex, in addition to returning
   * this complex itself.
   */
  set(c) {
    return this.setRealImaginary(c.real, c.imaginary);
  }

  /**
   * Sets this Complex's value to be the a,b values matching the given magnitude and phase (in radians), changing
   * this Complex, and returning itself.
   *
   * @param magnitude
   * @param phase - In radians
   */
  setPolar(magnitude, phase) {
    return this.setRealImaginary(magnitude * Math.cos(phase), magnitude * Math.sin(phase));
  }

  /**
   * Addition of this Complex and another Complex, returning a copy.
   *
   * This is the mutable form of the function plus(). This will modify and return this.
   */
  add(c) {
    return this.setRealImaginary(this.real + c.real, this.imaginary + c.imaginary);
  }

  /**
   * Subtraction of another Complex from this Complex, returning a copy.
   *
   * This is the mutable form of the function minus(). This will modify and return this.
   */
  subtract(c) {
    return this.setRealImaginary(this.real - c.real, this.imaginary - c.imaginary);
  }

  /**
   * Mutable Complex multiplication.
   */
  multiply(c) {
    return this.setRealImaginary(this.real * c.real - this.imaginary * c.imaginary, this.real * c.imaginary + this.imaginary * c.real);
  }

  /**
   * Mutable Complex division. The immutable form is dividedBy.
   */
  divide(c) {
    const cMag = c.magnitudeSquared;
    return this.setRealImaginary((this.real * c.real + this.imaginary * c.imaginary) / cMag, (this.imaginary * c.real - this.real * c.imaginary) / cMag);
  }

  /**
   * Mutable Complex negation
   *
   */
  negate() {
    return this.setRealImaginary(-this.real, -this.imaginary);
  }

  /**
   * Sets this Complex to e to the power of this complex number. $e^{a+bi}=e^a\cos b + i\sin b$.
   * This is the mutable version of exponentiated
   *
   */
  exponentiate() {
    return this.setPolar(Math.exp(this.real), this.imaginary);
  }

  /**
   * Squares this complex number.
   * This is the mutable version of squared.
   *
   */
  square() {
    return this.multiply(this);
  }

  /**
   * Square root.
   * Mutable form of sqrtOf.
   *
   */
  sqrt() {
    const mag = this.magnitude;
    return this.setRealImaginary(Math.sqrt((mag + this.real) / 2), (this.imaginary >= 0 ? 1 : -1) * Math.sqrt((mag - this.real) / 2));
  }

  /**
   * Sine.
   * Mutable form of sinOf.
   *
   */
  sin() {
    return this.setRealImaginary(Math.sin(this.real) * Utils.cosh(this.imaginary), Math.cos(this.real) * Utils.sinh(this.imaginary));
  }

  /**
   * Cosine.
   * Mutable form of cosOf.
   *
   */
  cos() {
    return this.setRealImaginary(Math.cos(this.real) * Utils.cosh(this.imaginary), -Math.sin(this.real) * Utils.sinh(this.imaginary));
  }

  /**
   * Complex conjugate.
   * Mutable form of conjugated
   *
   */
  conjugate() {
    return this.setRealImaginary(this.real, -this.imaginary);
  }

  /**
   * Returns the cube roots of this complex number.
   */
  getCubeRoots() {
    const arg3 = this.argument / 3;
    const abs = this.magnitude;
    const really = Complex.real(Math.cbrt(abs));
    const principal = really.times(Complex.imaginary(arg3).exponentiate());
    return [principal, really.times(Complex.imaginary(arg3 + Math.PI * 2 / 3).exponentiate()), really.times(Complex.imaginary(arg3 - Math.PI * 2 / 3).exponentiate())];
  }

  /**
   * Debugging string for the complex number (provides real and imaginary parts).
   */
  toString() {
    return `Complex(${this.real}, ${this.imaginary})`;
  }

  /**
   * Constructs a complex number from just the real part (assuming the imaginary part is 0).
   */
  static real(real) {
    return new Complex(real, 0);
  }

  /**
   * Constructs a complex number from just the imaginary part (assuming the real part is 0).
   */
  static imaginary(imaginary) {
    return new Complex(0, imaginary);
  }

  /**
   * Constructs a complex number from the polar form. For a magnitude $r$ and phase $\varphi$, this will be
   * $\cos\varphi+i r\sin\varphi$.
   */
  static createPolar(magnitude, phase) {
    return new Complex(magnitude * Math.cos(phase), magnitude * Math.sin(phase));
  }

  /**
   * Returns an array of the roots of the quadratic equation $ax + b=0$, or null if every value is a solution.
   *
   * @returns The roots of the equation, or null if all values are roots.
   */
  static solveLinearRoots(a, b) {
    if (a.equals(Complex.ZERO)) {
      return b.equals(Complex.ZERO) ? null : [];
    }
    return [b.dividedBy(a).negate()];
  }

  /**
   * Returns an array of the roots of the quadratic equation $ax^2 + bx + c=0$, or null if every value is a
   * solution.
   *
   * @returns The roots of the equation, or null if all values are roots (if multiplicity>1, returns multiple copies)
   */
  static solveQuadraticRoots(a, b, c) {
    if (a.equals(Complex.ZERO)) {
      return Complex.solveLinearRoots(b, c);
    }
    const denom = Complex.real(2).multiply(a);
    const d1 = b.times(b);
    const d2 = Complex.real(4).multiply(a).multiply(c);
    const discriminant = d1.subtract(d2).sqrt();
    return [discriminant.minus(b).divide(denom), discriminant.negated().subtract(b).divide(denom)];
  }

  /**
   * Returns an array of the roots of the cubic equation $ax^3 + bx^2 + cx + d=0$, or null if every value is a
   * solution.
   *
   * @returns The roots of the equation, or null if all values are roots (if multiplicity>1, returns multiple copies)
   */
  static solveCubicRoots(a, b, c, d) {
    if (a.equals(Complex.ZERO)) {
      return Complex.solveQuadraticRoots(b, c, d);
    }
    const denom = a.times(Complex.real(3)).negate();
    const a2 = a.times(a);
    const b2 = b.times(b);
    const b3 = b2.times(b);
    const c2 = c.times(c);
    const c3 = c2.times(c);
    const abc = a.times(b).times(c);

    // TODO: factor out constant numeric values https://github.com/phetsims/dot/issues/96

    const D0_1 = b2;
    const D0_2 = a.times(c).times(Complex.real(3));
    const D1_1 = b3.times(Complex.real(2)).add(a2.times(d).multiply(Complex.real(27)));
    const D1_2 = abc.times(Complex.real(9));
    if (D0_1.equals(D0_2) && D1_1.equals(D1_2)) {
      const tripleRoot = b.divide(denom);
      return [tripleRoot, tripleRoot, tripleRoot];
    }
    const Delta0 = D0_1.minus(D0_2);
    const Delta1 = D1_1.minus(D1_2);
    const discriminant1 = abc.times(d).multiply(Complex.real(18)).add(b2.times(c2));
    const discriminant2 = b3.times(d).multiply(Complex.real(4)).add(c3.times(a).multiply(Complex.real(4))).add(a2.times(d).multiply(d).multiply(Complex.real(27)));
    if (discriminant1.equals(discriminant2)) {
      const simpleRoot = abc.times(Complex.real(4)).subtract(b3.plus(a2.times(d).multiply(Complex.real(9)))).divide(a.times(Delta0));
      const doubleRoot = a.times(d).multiply(Complex.real(9)).subtract(b.times(c)).divide(Delta0.times(Complex.real(2)));
      return [simpleRoot, doubleRoot, doubleRoot];
    }
    let Ccubed;
    if (D0_1.equals(D0_2)) {
      Ccubed = Delta1;
    } else {
      Ccubed = Delta1.plus(Delta1.times(Delta1).subtract(Delta0.times(Delta0).multiply(Delta0).multiply(Complex.real(4))).sqrt()).divide(Complex.real(2));
    }
    return Ccubed.getCubeRoots().map(root => {
      return b.plus(root).add(Delta0.dividedBy(root)).divide(denom);
    });
  }

  /**
   * Immutable constant $0$.
   * @constant
   */
  static ZERO = new Complex(0, 0);

  /**
   * Immutable constant $1$.
   * @constant
   */
  static ONE = new Complex(1, 0);

  /**
   * Immutable constant $i$, the imaginary unit.
   * @constant
   */
  static I = new Complex(0, 1);
}
dot.register('Complex', Complex);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkb3QiLCJVdGlscyIsIkNvbXBsZXgiLCJjb25zdHJ1Y3RvciIsInJlYWwiLCJpbWFnaW5hcnkiLCJjb3B5IiwiY29tcGxleCIsInNldCIsInBoYXNlIiwiTWF0aCIsImF0YW4yIiwiZ2V0TWFnbml0dWRlIiwic3FydCIsIm1hZ25pdHVkZVNxdWFyZWQiLCJtYWduaXR1ZGUiLCJnZXRNYWduaXR1ZGVTcXVhcmVkIiwiZ2V0QXJndW1lbnQiLCJhcmd1bWVudCIsImVxdWFscyIsIm90aGVyIiwiZXF1YWxzRXBzaWxvbiIsImVwc2lsb24iLCJtYXgiLCJhYnMiLCJwbHVzIiwiYyIsIm1pbnVzIiwidGltZXMiLCJkaXZpZGVkQnkiLCJjTWFnIiwibmVnYXRlZCIsInNxcnRPZiIsIm1hZyIsInBvd2VyQnlSZWFsIiwicmVhbFBvd2VyIiwibWFnVGltZXMiLCJwb3ciLCJhbmdsZSIsImNvcyIsInNpbiIsInNpbk9mIiwiY29zaCIsInNpbmgiLCJjb3NPZiIsInNxdWFyZWQiLCJjb25qdWdhdGVkIiwiZXhwb25lbnRpYXRlZCIsImNyZWF0ZVBvbGFyIiwiZXhwIiwic2V0UmVhbEltYWdpbmFyeSIsInNldFJlYWwiLCJzZXRJbWFnaW5hcnkiLCJzZXRQb2xhciIsImFkZCIsInN1YnRyYWN0IiwibXVsdGlwbHkiLCJkaXZpZGUiLCJuZWdhdGUiLCJleHBvbmVudGlhdGUiLCJzcXVhcmUiLCJjb25qdWdhdGUiLCJnZXRDdWJlUm9vdHMiLCJhcmczIiwicmVhbGx5IiwiY2JydCIsInByaW5jaXBhbCIsIlBJIiwidG9TdHJpbmciLCJzb2x2ZUxpbmVhclJvb3RzIiwiYSIsImIiLCJaRVJPIiwic29sdmVRdWFkcmF0aWNSb290cyIsImRlbm9tIiwiZDEiLCJkMiIsImRpc2NyaW1pbmFudCIsInNvbHZlQ3ViaWNSb290cyIsImQiLCJhMiIsImIyIiwiYjMiLCJjMiIsImMzIiwiYWJjIiwiRDBfMSIsIkQwXzIiLCJEMV8xIiwiRDFfMiIsInRyaXBsZVJvb3QiLCJEZWx0YTAiLCJEZWx0YTEiLCJkaXNjcmltaW5hbnQxIiwiZGlzY3JpbWluYW50MiIsInNpbXBsZVJvb3QiLCJkb3VibGVSb290IiwiQ2N1YmVkIiwibWFwIiwicm9vdCIsIk9ORSIsIkkiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkNvbXBsZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBjb21wbGV4IG51bWJlciB3aXRoIG11dGFibGUgYW5kIGltbXV0YWJsZSBtZXRob2RzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqIEBhdXRob3IgTWF0dCBQZW5uaW5ndG9uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBkb3QgZnJvbSAnLi9kb3QuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi9VdGlscy5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21wbGV4IHtcclxuXHJcbiAgLy8gVGhlIHJlYWwgcGFydC4gRm9yIGEgY29tcGxleCBudW1iZXIgJGErYmkkLCB0aGlzIGlzICRhJC5cclxuICBwdWJsaWMgcmVhbDogbnVtYmVyO1xyXG5cclxuICAvLyBUaGUgaW1hZ2luYXJ5IHBhcnQuIEZvciBhIGNvbXBsZXggbnVtYmVyICRhK2JpJCwgdGhpcyBpcyAkYiQuXHJcbiAgcHVibGljIGltYWdpbmFyeTogbnVtYmVyO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgY29tcGxleCBudW1iZXIsIHRoYXQgaGFzIGJvdGggYSByZWFsIGFuZCBpbWFnaW5hcnkgcGFydC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSByZWFsIC0gVGhlIHJlYWwgcGFydC4gRm9yIGEgY29tcGxleCBudW1iZXIgJGErYmkkLCB0aGlzIHNob3VsZCBiZSAkYSQuXHJcbiAgICogQHBhcmFtIGltYWdpbmFyeSAtIFRoZSBpbWFnaW5hcnkgcGFydC4gRm9yIGEgY29tcGxleCBudW1iZXIgJGErYmkkLCB0aGlzIHNob3VsZCBiZSAkYiQuXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCByZWFsOiBudW1iZXIsIGltYWdpbmFyeTogbnVtYmVyICkge1xyXG4gICAgdGhpcy5yZWFsID0gcmVhbDtcclxuICAgIHRoaXMuaW1hZ2luYXJ5ID0gaW1hZ2luYXJ5O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIGNvcHkgb2YgdGhpcyBjb21wbGV4LCBvciBpZiBhIGNvbXBsZXggaXMgcGFzc2VkIGluLCBzZXQgdGhhdCBjb21wbGV4J3MgdmFsdWVzIHRvIG91cnMuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gc2V0KCksIGlmIGEgY29tcGxleCBpcyBwcm92aWRlZC4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBjb21wbGV4LCBhbmRcclxuICAgKiB3aWxsIG5vdCBtb2RpZnkgdGhpcyBjb21wbGV4LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIFtjb21wbGV4XSAtIElmIG5vdCBwcm92aWRlZCwgY3JlYXRlcyBhIG5ldyBDb21wbGV4IHdpdGggZmlsbGVkIGluIHZhbHVlcy4gT3RoZXJ3aXNlLCBmaWxsc1xyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW4gdGhlIHZhbHVlcyBvZiB0aGUgcHJvdmlkZWQgY29tcGxleCBzbyB0aGF0IGl0IGVxdWFscyB0aGlzIGNvbXBsZXguXHJcbiAgICovXHJcbiAgcHVibGljIGNvcHkoIGNvbXBsZXg/OiBDb21wbGV4ICk6IENvbXBsZXgge1xyXG4gICAgaWYgKCBjb21wbGV4ICkge1xyXG4gICAgICByZXR1cm4gY29tcGxleC5zZXQoIHRoaXMgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gbmV3IENvbXBsZXgoIHRoaXMucmVhbCwgdGhpcy5pbWFnaW5hcnkgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBwaGFzZSAvIGFyZ3VtZW50IG9mIHRoZSBjb21wbGV4IG51bWJlci5cclxuICAgKi9cclxuICBwdWJsaWMgcGhhc2UoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBNYXRoLmF0YW4yKCB0aGlzLmltYWdpbmFyeSwgdGhpcy5yZWFsICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgbWFnbml0dWRlIChFdWNsaWRlYW4vTDIgTm9ybSkgb2YgdGhpcyBjb21wbGV4IG51bWJlciwgaS5lLiAkXFxzcXJ0e2FeMitiXjJ9JC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TWFnbml0dWRlKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCB0aGlzLm1hZ25pdHVkZVNxdWFyZWQgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgbWFnbml0dWRlKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRNYWduaXR1ZGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBzcXVhcmVkIG1hZ25pdHVkZSAoc3F1YXJlIG9mIHRoZSBFdWNsaWRlYW4vTDIgTm9ybSkgb2YgdGhpcyBjb21wbGV4LCBpLmUuICRhXjIrYl4yJC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TWFnbml0dWRlU3F1YXJlZCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMucmVhbCAqIHRoaXMucmVhbCArIHRoaXMuaW1hZ2luYXJ5ICogdGhpcy5pbWFnaW5hcnk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IG1hZ25pdHVkZVNxdWFyZWQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldE1hZ25pdHVkZVNxdWFyZWQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFyZ3VtZW50IG9mIHRoaXMgY29tcGxleCBudW1iZXIgKGltbXV0YWJsZSlcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0QXJndW1lbnQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBNYXRoLmF0YW4yKCB0aGlzLmltYWdpbmFyeSwgdGhpcy5yZWFsICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGFyZ3VtZW50KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRBcmd1bWVudCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXhhY3QgZXF1YWxpdHkgY29tcGFyaXNvbiBiZXR3ZWVuIHRoaXMgQ29tcGxleCBhbmQgYW5vdGhlciBDb21wbGV4LlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgV2hldGhlciB0aGUgdHdvIGNvbXBsZXggbnVtYmVycyBoYXZlIGVxdWFsIGNvbXBvbmVudHNcclxuICAgKi9cclxuICBwdWJsaWMgZXF1YWxzKCBvdGhlcjogQ29tcGxleCApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnJlYWwgPT09IG90aGVyLnJlYWwgJiYgdGhpcy5pbWFnaW5hcnkgPT09IG90aGVyLmltYWdpbmFyeTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFwcHJveGltYXRlIGVxdWFsaXR5IGNvbXBhcmlzb24gYmV0d2VlbiB0aGlzIENvbXBsZXggYW5kIGFub3RoZXIgQ29tcGxleC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIC0gV2hldGhlciBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHR3byBjb21wbGV4IG51bWJlcnMgaGFzIG5vIGNvbXBvbmVudCB3aXRoIGFuIGFic29sdXRlIHZhbHVlXHJcbiAgICogICAgICAgICAgICBncmVhdGVyIHRoYW4gZXBzaWxvbi5cclxuICAgKi9cclxuICBwdWJsaWMgZXF1YWxzRXBzaWxvbiggb3RoZXI6IENvbXBsZXgsIGVwc2lsb24gPSAwICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KCBNYXRoLmFicyggdGhpcy5yZWFsIC0gb3RoZXIucmVhbCApLCBNYXRoLmFicyggdGhpcy5pbWFnaW5hcnkgLSBvdGhlci5pbWFnaW5hcnkgKSApIDw9IGVwc2lsb247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRpdGlvbiBvZiB0aGlzIENvbXBsZXggYW5kIGFub3RoZXIgQ29tcGxleCwgcmV0dXJuaW5nIGEgY29weS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBhZGQoKS4gVGhpcyB3aWxsIHJldHVybiBhIG5ldyBDb21wbGV4LCBhbmQgd2lsbCBub3QgbW9kaWZ5XHJcbiAgICogdGhpcyBDb21wbGV4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwbHVzKCBjOiBDb21wbGV4ICk6IENvbXBsZXgge1xyXG4gICAgcmV0dXJuIG5ldyBDb21wbGV4KCB0aGlzLnJlYWwgKyBjLnJlYWwsIHRoaXMuaW1hZ2luYXJ5ICsgYy5pbWFnaW5hcnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1YnRyYWN0aW9uIG9mIHRoaXMgQ29tcGxleCBieSBhbm90aGVyIENvbXBsZXggYywgcmV0dXJuaW5nIGEgY29weS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBzdWJ0cmFjdCgpLiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IENvbXBsZXgsIGFuZCB3aWxsIG5vdCBtb2RpZnlcclxuICAgKiB0aGlzIENvbXBsZXguXHJcbiAgICovXHJcbiAgcHVibGljIG1pbnVzKCBjOiBDb21wbGV4ICk6IENvbXBsZXgge1xyXG4gICAgcmV0dXJuIG5ldyBDb21wbGV4KCB0aGlzLnJlYWwgLSBjLnJlYWwsIHRoaXMuaW1hZ2luYXJ5IC0gYy5pbWFnaW5hcnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXBsZXggbXVsdGlwbGljYXRpb24uXHJcbiAgICogSW1tdXRhYmxlIHZlcnNpb24gb2YgbXVsdGlwbHlcclxuICAgKi9cclxuICBwdWJsaWMgdGltZXMoIGM6IENvbXBsZXggKTogQ29tcGxleCB7XHJcbiAgICByZXR1cm4gbmV3IENvbXBsZXgoIHRoaXMucmVhbCAqIGMucmVhbCAtIHRoaXMuaW1hZ2luYXJ5ICogYy5pbWFnaW5hcnksIHRoaXMucmVhbCAqIGMuaW1hZ2luYXJ5ICsgdGhpcy5pbWFnaW5hcnkgKiBjLnJlYWwgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXBsZXggZGl2aXNpb24uXHJcbiAgICogSW1tdXRhYmxlIHZlcnNpb24gb2YgZGl2aWRlXHJcbiAgICovXHJcbiAgcHVibGljIGRpdmlkZWRCeSggYzogQ29tcGxleCApOiBDb21wbGV4IHtcclxuICAgIGNvbnN0IGNNYWcgPSBjLm1hZ25pdHVkZVNxdWFyZWQ7XHJcbiAgICByZXR1cm4gbmV3IENvbXBsZXgoXHJcbiAgICAgICggdGhpcy5yZWFsICogYy5yZWFsICsgdGhpcy5pbWFnaW5hcnkgKiBjLmltYWdpbmFyeSApIC8gY01hZyxcclxuICAgICAgKCB0aGlzLmltYWdpbmFyeSAqIGMucmVhbCAtIHRoaXMucmVhbCAqIGMuaW1hZ2luYXJ5ICkgLyBjTWFnXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcGxleCBuZWdhdGlvblxyXG4gICAqIEltbXV0YWJsZSB2ZXJzaW9uIG9mIG5lZ2F0ZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBuZWdhdGVkKCk6IENvbXBsZXgge1xyXG4gICAgcmV0dXJuIG5ldyBDb21wbGV4KCAtdGhpcy5yZWFsLCAtdGhpcy5pbWFnaW5hcnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNxdWFyZSByb290LlxyXG4gICAqIEltbXV0YWJsZSBmb3JtIG9mIHNxcnQuXHJcbiAgICpcclxuICAgKi9cclxuICBwdWJsaWMgc3FydE9mKCk6IENvbXBsZXgge1xyXG4gICAgY29uc3QgbWFnID0gdGhpcy5tYWduaXR1ZGU7XHJcbiAgICByZXR1cm4gbmV3IENvbXBsZXgoIE1hdGguc3FydCggKCBtYWcgKyB0aGlzLnJlYWwgKSAvIDIgKSxcclxuICAgICAgKCB0aGlzLmltYWdpbmFyeSA+PSAwID8gMSA6IC0xICkgKiBNYXRoLnNxcnQoICggbWFnIC0gdGhpcy5yZWFsICkgLyAyICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHBvd2VyIG9mIHRoaXMgY29tcGxleCBudW1iZXIgYnkgYSByZWFsIG51bWJlci5cclxuICAgKi9cclxuICBwdWJsaWMgcG93ZXJCeVJlYWwoIHJlYWxQb3dlcjogbnVtYmVyICk6IENvbXBsZXgge1xyXG4gICAgY29uc3QgbWFnVGltZXMgPSBNYXRoLnBvdyggdGhpcy5tYWduaXR1ZGUsIHJlYWxQb3dlciApO1xyXG4gICAgY29uc3QgYW5nbGUgPSByZWFsUG93ZXIgKiB0aGlzLnBoYXNlKCk7XHJcbiAgICByZXR1cm4gbmV3IENvbXBsZXgoXHJcbiAgICAgIG1hZ1RpbWVzICogTWF0aC5jb3MoIGFuZ2xlICksXHJcbiAgICAgIG1hZ1RpbWVzICogTWF0aC5zaW4oIGFuZ2xlIClcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaW5lLlxyXG4gICAqIEltbXV0YWJsZSBmb3JtIG9mIHNpbi5cclxuICAgKlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzaW5PZigpOiBDb21wbGV4IHtcclxuICAgIHJldHVybiBuZXcgQ29tcGxleChcclxuICAgICAgTWF0aC5zaW4oIHRoaXMucmVhbCApICogVXRpbHMuY29zaCggdGhpcy5pbWFnaW5hcnkgKSxcclxuICAgICAgTWF0aC5jb3MoIHRoaXMucmVhbCApICogVXRpbHMuc2luaCggdGhpcy5pbWFnaW5hcnkgKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvc2luZS5cclxuICAgKiBJbW11dGFibGUgZm9ybSBvZiBjb3MuXHJcbiAgICpcclxuICAgKi9cclxuICBwdWJsaWMgY29zT2YoKTogQ29tcGxleCB7XHJcbiAgICByZXR1cm4gbmV3IENvbXBsZXgoXHJcbiAgICAgIE1hdGguY29zKCB0aGlzLnJlYWwgKSAqIFV0aWxzLmNvc2goIHRoaXMuaW1hZ2luYXJ5ICksXHJcbiAgICAgIC1NYXRoLnNpbiggdGhpcy5yZWFsICkgKiBVdGlscy5zaW5oKCB0aGlzLmltYWdpbmFyeSApXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc3F1YXJlIG9mIHRoaXMgY29tcGxleCBudW1iZXIgYW5kIGRvZXMgbm90IG1vZGlmeSBpdC5cclxuICAgKiBUaGlzIGlzIHRoZSBpbW11dGFibGUgdmVyc2lvbiBvZiBzcXVhcmUuXHJcbiAgICpcclxuICAgKi9cclxuICBwdWJsaWMgc3F1YXJlZCgpOiBDb21wbGV4IHtcclxuICAgIHJldHVybiB0aGlzLnRpbWVzKCB0aGlzICk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcGxleCBjb25qdWdhdGUuXHJcbiAgICogSW1tdXRhYmxlIGZvcm0gb2YgY29uanVnYXRlXHJcbiAgICpcclxuICAgKi9cclxuICBwdWJsaWMgY29uanVnYXRlZCgpOiBDb21wbGV4IHtcclxuICAgIHJldHVybiBuZXcgQ29tcGxleCggdGhpcy5yZWFsLCAtdGhpcy5pbWFnaW5hcnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGUgdG8gdGhlIHBvd2VyIG9mIHRoaXMgY29tcGxleCBudW1iZXIuICRlXnthK2JpfT1lXmFcXGNvcyBiICsgaVxcc2luIGIkLlxyXG4gICAqIFRoaXMgaXMgdGhlIGltbXV0YWJsZSBmb3JtIG9mIGV4cG9uZW50aWF0ZS5cclxuICAgKlxyXG4gICAqL1xyXG4gIHB1YmxpYyBleHBvbmVudGlhdGVkKCk6IENvbXBsZXgge1xyXG4gICAgcmV0dXJuIENvbXBsZXguY3JlYXRlUG9sYXIoIE1hdGguZXhwKCB0aGlzLnJlYWwgKSwgdGhpcy5pbWFnaW5hcnkgKTtcclxuICB9XHJcblxyXG4gIC8qKiogTXV0YWJsZSBmdW5jdGlvbnMgKioqL1xyXG5cclxuICAvKipcclxuICAgKiBTZXRzIGFsbCBjb21wb25lbnRzIG9mIHRoaXMgY29tcGxleCwgcmV0dXJuaW5nIHRoaXNcclxuICAgKlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRSZWFsSW1hZ2luYXJ5KCByZWFsOiBudW1iZXIsIGltYWdpbmFyeTogbnVtYmVyICk6IENvbXBsZXgge1xyXG4gICAgdGhpcy5yZWFsID0gcmVhbDtcclxuICAgIHRoaXMuaW1hZ2luYXJ5ID0gaW1hZ2luYXJ5O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSByZWFsIGNvbXBvbmVudCBvZiB0aGlzIGNvbXBsZXgsIHJldHVybmluZyB0aGlzXHJcbiAgICovXHJcbiAgcHVibGljIHNldFJlYWwoIHJlYWw6IG51bWJlciApOiBDb21wbGV4IHtcclxuICAgIHRoaXMucmVhbCA9IHJlYWw7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGltYWdpbmFyeSBjb21wb25lbnQgb2YgdGhpcyBjb21wbGV4LCByZXR1cm5pbmcgdGhpc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRJbWFnaW5hcnkoIGltYWdpbmFyeTogbnVtYmVyICk6IENvbXBsZXgge1xyXG4gICAgdGhpcy5pbWFnaW5hcnkgPSBpbWFnaW5hcnk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGNvbXBvbmVudHMgb2YgdGhpcyBjb21wbGV4IHRvIGJlIGEgY29weSBvZiB0aGUgcGFyYW1ldGVyXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIGZvcm0gb2YgdGhlIGZ1bmN0aW9uIGNvcHkoKS4gVGhpcyB3aWxsIG11dGF0ZSAoY2hhbmdlKSB0aGlzIGNvbXBsZXgsIGluIGFkZGl0aW9uIHRvIHJldHVybmluZ1xyXG4gICAqIHRoaXMgY29tcGxleCBpdHNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIHNldCggYzogQ29tcGxleCApOiBDb21wbGV4IHtcclxuICAgIHJldHVybiB0aGlzLnNldFJlYWxJbWFnaW5hcnkoIGMucmVhbCwgYy5pbWFnaW5hcnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhpcyBDb21wbGV4J3MgdmFsdWUgdG8gYmUgdGhlIGEsYiB2YWx1ZXMgbWF0Y2hpbmcgdGhlIGdpdmVuIG1hZ25pdHVkZSBhbmQgcGhhc2UgKGluIHJhZGlhbnMpLCBjaGFuZ2luZ1xyXG4gICAqIHRoaXMgQ29tcGxleCwgYW5kIHJldHVybmluZyBpdHNlbGYuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbWFnbml0dWRlXHJcbiAgICogQHBhcmFtIHBoYXNlIC0gSW4gcmFkaWFuc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQb2xhciggbWFnbml0dWRlOiBudW1iZXIsIHBoYXNlOiBudW1iZXIgKTogQ29tcGxleCB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRSZWFsSW1hZ2luYXJ5KCBtYWduaXR1ZGUgKiBNYXRoLmNvcyggcGhhc2UgKSwgbWFnbml0dWRlICogTWF0aC5zaW4oIHBoYXNlICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZGl0aW9uIG9mIHRoaXMgQ29tcGxleCBhbmQgYW5vdGhlciBDb21wbGV4LCByZXR1cm5pbmcgYSBjb3B5LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgbXV0YWJsZSBmb3JtIG9mIHRoZSBmdW5jdGlvbiBwbHVzKCkuIFRoaXMgd2lsbCBtb2RpZnkgYW5kIHJldHVybiB0aGlzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGQoIGM6IENvbXBsZXggKTogQ29tcGxleCB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRSZWFsSW1hZ2luYXJ5KCB0aGlzLnJlYWwgKyBjLnJlYWwsIHRoaXMuaW1hZ2luYXJ5ICsgYy5pbWFnaW5hcnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1YnRyYWN0aW9uIG9mIGFub3RoZXIgQ29tcGxleCBmcm9tIHRoaXMgQ29tcGxleCwgcmV0dXJuaW5nIGEgY29weS5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgZm9ybSBvZiB0aGUgZnVuY3Rpb24gbWludXMoKS4gVGhpcyB3aWxsIG1vZGlmeSBhbmQgcmV0dXJuIHRoaXMuXHJcbiAgICovXHJcbiAgcHVibGljIHN1YnRyYWN0KCBjOiBDb21wbGV4ICk6IENvbXBsZXgge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0UmVhbEltYWdpbmFyeSggdGhpcy5yZWFsIC0gYy5yZWFsLCB0aGlzLmltYWdpbmFyeSAtIGMuaW1hZ2luYXJ5ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNdXRhYmxlIENvbXBsZXggbXVsdGlwbGljYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIG11bHRpcGx5KCBjOiBDb21wbGV4ICk6IENvbXBsZXgge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0UmVhbEltYWdpbmFyeShcclxuICAgICAgdGhpcy5yZWFsICogYy5yZWFsIC0gdGhpcy5pbWFnaW5hcnkgKiBjLmltYWdpbmFyeSxcclxuICAgICAgdGhpcy5yZWFsICogYy5pbWFnaW5hcnkgKyB0aGlzLmltYWdpbmFyeSAqIGMucmVhbCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTXV0YWJsZSBDb21wbGV4IGRpdmlzaW9uLiBUaGUgaW1tdXRhYmxlIGZvcm0gaXMgZGl2aWRlZEJ5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXZpZGUoIGM6IENvbXBsZXggKTogQ29tcGxleCB7XHJcbiAgICBjb25zdCBjTWFnID0gYy5tYWduaXR1ZGVTcXVhcmVkO1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0UmVhbEltYWdpbmFyeShcclxuICAgICAgKCB0aGlzLnJlYWwgKiBjLnJlYWwgKyB0aGlzLmltYWdpbmFyeSAqIGMuaW1hZ2luYXJ5ICkgLyBjTWFnLFxyXG4gICAgICAoIHRoaXMuaW1hZ2luYXJ5ICogYy5yZWFsIC0gdGhpcy5yZWFsICogYy5pbWFnaW5hcnkgKSAvIGNNYWdcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNdXRhYmxlIENvbXBsZXggbmVnYXRpb25cclxuICAgKlxyXG4gICAqL1xyXG4gIHB1YmxpYyBuZWdhdGUoKTogQ29tcGxleCB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRSZWFsSW1hZ2luYXJ5KCAtdGhpcy5yZWFsLCAtdGhpcy5pbWFnaW5hcnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhpcyBDb21wbGV4IHRvIGUgdG8gdGhlIHBvd2VyIG9mIHRoaXMgY29tcGxleCBudW1iZXIuICRlXnthK2JpfT1lXmFcXGNvcyBiICsgaVxcc2luIGIkLlxyXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgdmVyc2lvbiBvZiBleHBvbmVudGlhdGVkXHJcbiAgICpcclxuICAgKi9cclxuICBwdWJsaWMgZXhwb25lbnRpYXRlKCk6IENvbXBsZXgge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0UG9sYXIoIE1hdGguZXhwKCB0aGlzLnJlYWwgKSwgdGhpcy5pbWFnaW5hcnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNxdWFyZXMgdGhpcyBjb21wbGV4IG51bWJlci5cclxuICAgKiBUaGlzIGlzIHRoZSBtdXRhYmxlIHZlcnNpb24gb2Ygc3F1YXJlZC5cclxuICAgKlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzcXVhcmUoKTogQ29tcGxleCB7XHJcbiAgICByZXR1cm4gdGhpcy5tdWx0aXBseSggdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3F1YXJlIHJvb3QuXHJcbiAgICogTXV0YWJsZSBmb3JtIG9mIHNxcnRPZi5cclxuICAgKlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzcXJ0KCk6IENvbXBsZXgge1xyXG4gICAgY29uc3QgbWFnID0gdGhpcy5tYWduaXR1ZGU7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRSZWFsSW1hZ2luYXJ5KCBNYXRoLnNxcnQoICggbWFnICsgdGhpcy5yZWFsICkgLyAyICksXHJcbiAgICAgICggdGhpcy5pbWFnaW5hcnkgPj0gMCA/IDEgOiAtMSApICogTWF0aC5zcXJ0KCAoIG1hZyAtIHRoaXMucmVhbCApIC8gMiApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaW5lLlxyXG4gICAqIE11dGFibGUgZm9ybSBvZiBzaW5PZi5cclxuICAgKlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzaW4oKTogQ29tcGxleCB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRSZWFsSW1hZ2luYXJ5KFxyXG4gICAgICBNYXRoLnNpbiggdGhpcy5yZWFsICkgKiBVdGlscy5jb3NoKCB0aGlzLmltYWdpbmFyeSApLFxyXG4gICAgICBNYXRoLmNvcyggdGhpcy5yZWFsICkgKiBVdGlscy5zaW5oKCB0aGlzLmltYWdpbmFyeSApXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29zaW5lLlxyXG4gICAqIE11dGFibGUgZm9ybSBvZiBjb3NPZi5cclxuICAgKlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb3MoKTogQ29tcGxleCB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRSZWFsSW1hZ2luYXJ5KFxyXG4gICAgICBNYXRoLmNvcyggdGhpcy5yZWFsICkgKiBVdGlscy5jb3NoKCB0aGlzLmltYWdpbmFyeSApLFxyXG4gICAgICAtTWF0aC5zaW4oIHRoaXMucmVhbCApICogVXRpbHMuc2luaCggdGhpcy5pbWFnaW5hcnkgKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBDb21wbGV4IGNvbmp1Z2F0ZS5cclxuICAgKiBNdXRhYmxlIGZvcm0gb2YgY29uanVnYXRlZFxyXG4gICAqXHJcbiAgICovXHJcbiAgcHVibGljIGNvbmp1Z2F0ZSgpOiBDb21wbGV4IHtcclxuICAgIHJldHVybiB0aGlzLnNldFJlYWxJbWFnaW5hcnkoIHRoaXMucmVhbCwgLXRoaXMuaW1hZ2luYXJ5ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjdWJlIHJvb3RzIG9mIHRoaXMgY29tcGxleCBudW1iZXIuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEN1YmVSb290cygpOiBDb21wbGV4W10ge1xyXG4gICAgY29uc3QgYXJnMyA9IHRoaXMuYXJndW1lbnQgLyAzO1xyXG4gICAgY29uc3QgYWJzID0gdGhpcy5tYWduaXR1ZGU7XHJcblxyXG4gICAgY29uc3QgcmVhbGx5ID0gQ29tcGxleC5yZWFsKCBNYXRoLmNicnQoIGFicyApICk7XHJcblxyXG4gICAgY29uc3QgcHJpbmNpcGFsID0gcmVhbGx5LnRpbWVzKCBDb21wbGV4LmltYWdpbmFyeSggYXJnMyApLmV4cG9uZW50aWF0ZSgpICk7XHJcblxyXG4gICAgcmV0dXJuIFtcclxuICAgICAgcHJpbmNpcGFsLFxyXG4gICAgICByZWFsbHkudGltZXMoIENvbXBsZXguaW1hZ2luYXJ5KCBhcmczICsgTWF0aC5QSSAqIDIgLyAzICkuZXhwb25lbnRpYXRlKCkgKSxcclxuICAgICAgcmVhbGx5LnRpbWVzKCBDb21wbGV4LmltYWdpbmFyeSggYXJnMyAtIE1hdGguUEkgKiAyIC8gMyApLmV4cG9uZW50aWF0ZSgpIClcclxuICAgIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWJ1Z2dpbmcgc3RyaW5nIGZvciB0aGUgY29tcGxleCBudW1iZXIgKHByb3ZpZGVzIHJlYWwgYW5kIGltYWdpbmFyeSBwYXJ0cykuXHJcbiAgICovXHJcbiAgcHVibGljIHRvU3RyaW5nKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYENvbXBsZXgoJHt0aGlzLnJlYWx9LCAke3RoaXMuaW1hZ2luYXJ5fSlgO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RydWN0cyBhIGNvbXBsZXggbnVtYmVyIGZyb20ganVzdCB0aGUgcmVhbCBwYXJ0IChhc3N1bWluZyB0aGUgaW1hZ2luYXJ5IHBhcnQgaXMgMCkuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByZWFsKCByZWFsOiBudW1iZXIgKTogQ29tcGxleCB7XHJcbiAgICByZXR1cm4gbmV3IENvbXBsZXgoIHJlYWwsIDAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0cnVjdHMgYSBjb21wbGV4IG51bWJlciBmcm9tIGp1c3QgdGhlIGltYWdpbmFyeSBwYXJ0IChhc3N1bWluZyB0aGUgcmVhbCBwYXJ0IGlzIDApLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgaW1hZ2luYXJ5KCBpbWFnaW5hcnk6IG51bWJlciApOiBDb21wbGV4IHtcclxuICAgIHJldHVybiBuZXcgQ29tcGxleCggMCwgaW1hZ2luYXJ5ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1Y3RzIGEgY29tcGxleCBudW1iZXIgZnJvbSB0aGUgcG9sYXIgZm9ybS4gRm9yIGEgbWFnbml0dWRlICRyJCBhbmQgcGhhc2UgJFxcdmFycGhpJCwgdGhpcyB3aWxsIGJlXHJcbiAgICogJFxcY29zXFx2YXJwaGkraSByXFxzaW5cXHZhcnBoaSQuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBjcmVhdGVQb2xhciggbWFnbml0dWRlOiBudW1iZXIsIHBoYXNlOiBudW1iZXIgKTogQ29tcGxleCB7XHJcbiAgICByZXR1cm4gbmV3IENvbXBsZXgoIG1hZ25pdHVkZSAqIE1hdGguY29zKCBwaGFzZSApLCBtYWduaXR1ZGUgKiBNYXRoLnNpbiggcGhhc2UgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiB0aGUgcm9vdHMgb2YgdGhlIHF1YWRyYXRpYyBlcXVhdGlvbiAkYXggKyBiPTAkLCBvciBudWxsIGlmIGV2ZXJ5IHZhbHVlIGlzIGEgc29sdXRpb24uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgcm9vdHMgb2YgdGhlIGVxdWF0aW9uLCBvciBudWxsIGlmIGFsbCB2YWx1ZXMgYXJlIHJvb3RzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgc29sdmVMaW5lYXJSb290cyggYTogQ29tcGxleCwgYjogQ29tcGxleCApOiBDb21wbGV4W10gfCBudWxsIHtcclxuICAgIGlmICggYS5lcXVhbHMoIENvbXBsZXguWkVSTyApICkge1xyXG4gICAgICByZXR1cm4gYi5lcXVhbHMoIENvbXBsZXguWkVSTyApID8gbnVsbCA6IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBbIGIuZGl2aWRlZEJ5KCBhICkubmVnYXRlKCkgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgdGhlIHJvb3RzIG9mIHRoZSBxdWFkcmF0aWMgZXF1YXRpb24gJGF4XjIgKyBieCArIGM9MCQsIG9yIG51bGwgaWYgZXZlcnkgdmFsdWUgaXMgYVxyXG4gICAqIHNvbHV0aW9uLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIHJvb3RzIG9mIHRoZSBlcXVhdGlvbiwgb3IgbnVsbCBpZiBhbGwgdmFsdWVzIGFyZSByb290cyAoaWYgbXVsdGlwbGljaXR5PjEsIHJldHVybnMgbXVsdGlwbGUgY29waWVzKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgc29sdmVRdWFkcmF0aWNSb290cyggYTogQ29tcGxleCwgYjogQ29tcGxleCwgYzogQ29tcGxleCApOiBDb21wbGV4W10gfCBudWxsIHtcclxuICAgIGlmICggYS5lcXVhbHMoIENvbXBsZXguWkVSTyApICkge1xyXG4gICAgICByZXR1cm4gQ29tcGxleC5zb2x2ZUxpbmVhclJvb3RzKCBiLCBjICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGVub20gPSBDb21wbGV4LnJlYWwoIDIgKS5tdWx0aXBseSggYSApO1xyXG4gICAgY29uc3QgZDEgPSBiLnRpbWVzKCBiICk7XHJcbiAgICBjb25zdCBkMiA9IENvbXBsZXgucmVhbCggNCApLm11bHRpcGx5KCBhICkubXVsdGlwbHkoIGMgKTtcclxuICAgIGNvbnN0IGRpc2NyaW1pbmFudCA9IGQxLnN1YnRyYWN0KCBkMiApLnNxcnQoKTtcclxuICAgIHJldHVybiBbXHJcbiAgICAgIGRpc2NyaW1pbmFudC5taW51cyggYiApLmRpdmlkZSggZGVub20gKSxcclxuICAgICAgZGlzY3JpbWluYW50Lm5lZ2F0ZWQoKS5zdWJ0cmFjdCggYiApLmRpdmlkZSggZGVub20gKVxyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgdGhlIHJvb3RzIG9mIHRoZSBjdWJpYyBlcXVhdGlvbiAkYXheMyArIGJ4XjIgKyBjeCArIGQ9MCQsIG9yIG51bGwgaWYgZXZlcnkgdmFsdWUgaXMgYVxyXG4gICAqIHNvbHV0aW9uLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIHJvb3RzIG9mIHRoZSBlcXVhdGlvbiwgb3IgbnVsbCBpZiBhbGwgdmFsdWVzIGFyZSByb290cyAoaWYgbXVsdGlwbGljaXR5PjEsIHJldHVybnMgbXVsdGlwbGUgY29waWVzKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgc29sdmVDdWJpY1Jvb3RzKCBhOiBDb21wbGV4LCBiOiBDb21wbGV4LCBjOiBDb21wbGV4LCBkOiBDb21wbGV4ICk6IENvbXBsZXhbXSB8IG51bGwge1xyXG4gICAgaWYgKCBhLmVxdWFscyggQ29tcGxleC5aRVJPICkgKSB7XHJcbiAgICAgIHJldHVybiBDb21wbGV4LnNvbHZlUXVhZHJhdGljUm9vdHMoIGIsIGMsIGQgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkZW5vbSA9IGEudGltZXMoIENvbXBsZXgucmVhbCggMyApICkubmVnYXRlKCk7XHJcbiAgICBjb25zdCBhMiA9IGEudGltZXMoIGEgKTtcclxuICAgIGNvbnN0IGIyID0gYi50aW1lcyggYiApO1xyXG4gICAgY29uc3QgYjMgPSBiMi50aW1lcyggYiApO1xyXG4gICAgY29uc3QgYzIgPSBjLnRpbWVzKCBjICk7XHJcbiAgICBjb25zdCBjMyA9IGMyLnRpbWVzKCBjICk7XHJcbiAgICBjb25zdCBhYmMgPSBhLnRpbWVzKCBiICkudGltZXMoIGMgKTtcclxuXHJcbiAgICAvLyBUT0RPOiBmYWN0b3Igb3V0IGNvbnN0YW50IG51bWVyaWMgdmFsdWVzIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9kb3QvaXNzdWVzLzk2XHJcblxyXG4gICAgY29uc3QgRDBfMSA9IGIyO1xyXG4gICAgY29uc3QgRDBfMiA9IGEudGltZXMoIGMgKS50aW1lcyggQ29tcGxleC5yZWFsKCAzICkgKTtcclxuICAgIGNvbnN0IEQxXzEgPSBiMy50aW1lcyggQ29tcGxleC5yZWFsKCAyICkgKS5hZGQoIGEyLnRpbWVzKCBkICkubXVsdGlwbHkoIENvbXBsZXgucmVhbCggMjcgKSApICk7XHJcbiAgICBjb25zdCBEMV8yID0gYWJjLnRpbWVzKCBDb21wbGV4LnJlYWwoIDkgKSApO1xyXG5cclxuICAgIGlmICggRDBfMS5lcXVhbHMoIEQwXzIgKSAmJiBEMV8xLmVxdWFscyggRDFfMiApICkge1xyXG4gICAgICBjb25zdCB0cmlwbGVSb290ID0gYi5kaXZpZGUoIGRlbm9tICk7XHJcbiAgICAgIHJldHVybiBbIHRyaXBsZVJvb3QsIHRyaXBsZVJvb3QsIHRyaXBsZVJvb3QgXTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBEZWx0YTAgPSBEMF8xLm1pbnVzKCBEMF8yICk7XHJcbiAgICBjb25zdCBEZWx0YTEgPSBEMV8xLm1pbnVzKCBEMV8yICk7XHJcblxyXG4gICAgY29uc3QgZGlzY3JpbWluYW50MSA9IGFiYy50aW1lcyggZCApLm11bHRpcGx5KCBDb21wbGV4LnJlYWwoIDE4ICkgKS5hZGQoIGIyLnRpbWVzKCBjMiApICk7XHJcbiAgICBjb25zdCBkaXNjcmltaW5hbnQyID0gYjMudGltZXMoIGQgKS5tdWx0aXBseSggQ29tcGxleC5yZWFsKCA0ICkgKVxyXG4gICAgICAuYWRkKCBjMy50aW1lcyggYSApLm11bHRpcGx5KCBDb21wbGV4LnJlYWwoIDQgKSApIClcclxuICAgICAgLmFkZCggYTIudGltZXMoIGQgKS5tdWx0aXBseSggZCApLm11bHRpcGx5KCBDb21wbGV4LnJlYWwoIDI3ICkgKSApO1xyXG5cclxuICAgIGlmICggZGlzY3JpbWluYW50MS5lcXVhbHMoIGRpc2NyaW1pbmFudDIgKSApIHtcclxuICAgICAgY29uc3Qgc2ltcGxlUm9vdCA9IChcclxuICAgICAgICBhYmMudGltZXMoIENvbXBsZXgucmVhbCggNCApICkuc3VidHJhY3QoIGIzLnBsdXMoIGEyLnRpbWVzKCBkICkubXVsdGlwbHkoIENvbXBsZXgucmVhbCggOSApICkgKSApXHJcbiAgICAgICkuZGl2aWRlKCBhLnRpbWVzKCBEZWx0YTAgKSApO1xyXG4gICAgICBjb25zdCBkb3VibGVSb290ID0gKCBhLnRpbWVzKCBkICkubXVsdGlwbHkoIENvbXBsZXgucmVhbCggOSApICkuc3VidHJhY3QoIGIudGltZXMoIGMgKSApICkuZGl2aWRlKCBEZWx0YTAudGltZXMoIENvbXBsZXgucmVhbCggMiApICkgKTtcclxuICAgICAgcmV0dXJuIFsgc2ltcGxlUm9vdCwgZG91YmxlUm9vdCwgZG91YmxlUm9vdCBdO1xyXG4gICAgfVxyXG4gICAgbGV0IENjdWJlZDtcclxuICAgIGlmICggRDBfMS5lcXVhbHMoIEQwXzIgKSApIHtcclxuICAgICAgQ2N1YmVkID0gRGVsdGExO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIENjdWJlZCA9IERlbHRhMS5wbHVzKCAoIERlbHRhMS50aW1lcyggRGVsdGExICkuc3VidHJhY3QoIERlbHRhMC50aW1lcyggRGVsdGEwICkubXVsdGlwbHkoIERlbHRhMCApLm11bHRpcGx5KCBDb21wbGV4LnJlYWwoIDQgKSApICkgKS5zcXJ0KCkgKS5kaXZpZGUoIENvbXBsZXgucmVhbCggMiApICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gQ2N1YmVkLmdldEN1YmVSb290cygpLm1hcCggcm9vdCA9PiB7XHJcbiAgICAgIHJldHVybiBiLnBsdXMoIHJvb3QgKS5hZGQoIERlbHRhMC5kaXZpZGVkQnkoIHJvb3QgKSApLmRpdmlkZSggZGVub20gKTtcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEltbXV0YWJsZSBjb25zdGFudCAkMCQuXHJcbiAgICogQGNvbnN0YW50XHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBaRVJPID0gbmV3IENvbXBsZXgoIDAsIDAgKTtcclxuXHJcbiAgLyoqXHJcbiAgICogSW1tdXRhYmxlIGNvbnN0YW50ICQxJC5cclxuICAgKiBAY29uc3RhbnRcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IE9ORSA9IG5ldyBDb21wbGV4KCAxLCAwICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEltbXV0YWJsZSBjb25zdGFudCAkaSQsIHRoZSBpbWFnaW5hcnkgdW5pdC5cclxuICAgKiBAY29uc3RhbnRcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IEkgPSBuZXcgQ29tcGxleCggMCwgMSApO1xyXG59XHJcblxyXG5kb3QucmVnaXN0ZXIoICdDb21wbGV4JywgQ29tcGxleCApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxHQUFHLE1BQU0sVUFBVTtBQUMxQixPQUFPQyxLQUFLLE1BQU0sWUFBWTtBQUU5QixlQUFlLE1BQU1DLE9BQU8sQ0FBQztFQUUzQjs7RUFHQTs7RUFHQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDU0MsV0FBV0EsQ0FBRUMsSUFBWSxFQUFFQyxTQUFpQixFQUFHO0lBQ3BELElBQUksQ0FBQ0QsSUFBSSxHQUFHQSxJQUFJO0lBQ2hCLElBQUksQ0FBQ0MsU0FBUyxHQUFHQSxTQUFTO0VBQzVCOztFQUVBO0FBQ0Y7QUFDQTtB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