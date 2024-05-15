// Copyright 2013-2024, University of Colorado Boulder

/**
 * Cubic Bezier segment.
 *
 * See http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf for info
 *
 * Good reference: http://cagd.cs.byu.edu/~557/text/ch2.pdf
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../../dot/js/Bounds2.js';
import Matrix3 from '../../../dot/js/Matrix3.js';
import Utils from '../../../dot/js/Utils.js';
import Vector2 from '../../../dot/js/Vector2.js';
import { BoundsIntersection, kite, Line, Overlap, Quadratic, RayIntersection, Segment, SegmentIntersection, svgNumber } from '../imports.js';
const solveQuadraticRootsReal = Utils.solveQuadraticRootsReal; // function that returns an array of number
const solveCubicRootsReal = Utils.solveCubicRootsReal; // function that returns an array of number
const arePointsCollinear = Utils.arePointsCollinear; // function that returns a boolean

// convenience variables use to reduce the number of vector allocations
const scratchVector1 = new Vector2(0, 0);
const scratchVector2 = new Vector2(0, 0);
const scratchVector3 = new Vector2(0, 0);

// Used in multiple filters
function isBetween0And1(t) {
  return t >= 0 && t <= 1;
}
export default class Cubic extends Segment {
  // Lazily-computed derived information

  // Cusp-specific information
  // T value for a potential cusp

  // NaN if not applicable
  // NaN if not applicable

  // T-values where X and Y (respectively) reach an extrema (not necessarily including 0 and 1)

  /**
   * @param start - Start point of the cubic bezier
   * @param control1 - First control point (curve usually doesn't go through here)
   * @param control2 - Second control point (curve usually doesn't go through here)
   * @param end - End point of the cubic bezier
   */
  constructor(start, control1, control2, end) {
    super();
    this._start = start;
    this._control1 = control1;
    this._control2 = control2;
    this._end = end;
    this.invalidate();
  }

  /**
   * Sets the start point of the Cubic.
   */
  setStart(start) {
    assert && assert(start.isFinite(), `Cubic start should be finite: ${start.toString()}`);
    if (!this._start.equals(start)) {
      this._start = start;
      this.invalidate();
    }
    return this; // allow chaining
  }
  set start(value) {
    this.setStart(value);
  }
  get start() {
    return this.getStart();
  }

  /**
   * Returns the start of this Cubic.
   */
  getStart() {
    return this._start;
  }

  /**
   * Sets the first control point of the Cubic.
   */
  setControl1(control1) {
    assert && assert(control1.isFinite(), `Cubic control1 should be finite: ${control1.toString()}`);
    if (!this._control1.equals(control1)) {
      this._control1 = control1;
      this.invalidate();
    }
    return this; // allow chaining
  }
  set control1(value) {
    this.setControl1(value);
  }
  get control1() {
    return this.getControl1();
  }

  /**
   * Returns the first control point of this Cubic.
   */
  getControl1() {
    return this._control1;
  }

  /**
   * Sets the second control point of the Cubic.
   */
  setControl2(control2) {
    assert && assert(control2.isFinite(), `Cubic control2 should be finite: ${control2.toString()}`);
    if (!this._control2.equals(control2)) {
      this._control2 = control2;
      this.invalidate();
    }
    return this; // allow chaining
  }
  set control2(value) {
    this.setControl2(value);
  }
  get control2() {
    return this.getControl2();
  }

  /**
   * Returns the second control point of this Cubic.
   */
  getControl2() {
    return this._control2;
  }

  /**
   * Sets the end point of the Cubic.
   */
  setEnd(end) {
    assert && assert(end.isFinite(), `Cubic end should be finite: ${end.toString()}`);
    if (!this._end.equals(end)) {
      this._end = end;
      this.invalidate();
    }
    return this; // allow chaining
  }
  set end(value) {
    this.setEnd(value);
  }
  get end() {
    return this.getEnd();
  }

  /**
   * Returns the end of this Cubic.
   */
  getEnd() {
    return this._end;
  }

  /**
   * Returns the position parametrically, with 0 <= t <= 1.
   *
   * NOTE: positionAt( 0 ) will return the start of the segment, and positionAt( 1 ) will return the end of the
   * segment.
   *
   * This method is part of the Segment API. See Segment.js's constructor for more API documentation.
   */
  positionAt(t) {
    assert && assert(t >= 0, 'positionAt t should be non-negative');
    assert && assert(t <= 1, 'positionAt t should be no greater than 1');

    // Equivalent position: (1 - t)^3*start + 3*(1 - t)^2*t*control1 + 3*(1 - t) t^2*control2 + t^3*end
    const mt = 1 - t;
    const mmm = mt * mt * mt;
    const mmt = 3 * mt * mt * t;
    const mtt = 3 * mt * t * t;
    const ttt = t * t * t;
    return new Vector2(this._start.x * mmm + this._control1.x * mmt + this._control2.x * mtt + this._end.x * ttt, this._start.y * mmm + this._control1.y * mmt + this._control2.y * mtt + this._end.y * ttt);
  }

  /**
   * Returns the non-normalized tangent (dx/dt, dy/dt) of this segment at the parametric value of t, with 0 <= t <= 1.
   *
   * NOTE: tangentAt( 0 ) will return the tangent at the start of the segment, and tangentAt( 1 ) will return the
   * tangent at the end of the segment.
   *
   * This method is part of the Segment API. See Segment.js's constructor for more API documentation.
   */
  tangentAt(t) {
    assert && assert(t >= 0, 'tangentAt t should be non-negative');
    assert && assert(t <= 1, 'tangentAt t should be no greater than 1');

    // derivative: -3 p0 (1 - t)^2 + 3 p1 (1 - t)^2 - 6 p1 (1 - t) t + 6 p2 (1 - t) t - 3 p2 t^2 + 3 p3 t^2
    const mt = 1 - t;
    const result = new Vector2(0, 0);
    return result.set(this._start).multiplyScalar(-3 * mt * mt).add(scratchVector1.set(this._control1).multiplyScalar(3 * mt * mt - 6 * mt * t)).add(scratchVector1.set(this._control2).multiplyScalar(6 * mt * t - 3 * t * t)).add(scratchVector1.set(this._end).multiplyScalar(3 * t * t));
  }

  /**
   * Returns the signed curvature of the segment at the parametric value t, where 0 <= t <= 1.
   *
   * The curvature will be positive for visual clockwise / mathematical counterclockwise curves, negative for opposite
   * curvature, and 0 for no curvature.
   *
   * NOTE: curvatureAt( 0 ) will return the curvature at the start of the segment, and curvatureAt( 1 ) will return
   * the curvature at the end of the segment.
   *
   * This method is part of the Segment API. See Segment.js's constructor for more API documentation.
   */
  curvatureAt(t) {
    assert && assert(t >= 0, 'curvatureAt t should be non-negative');
    assert && assert(t <= 1, 'curvatureAt t should be no greater than 1');

    // see http://cagd.cs.byu.edu/~557/text/ch2.pdf p31
    // TODO: remove code duplication with Quadratic https://github.com/phetsims/kite/issues/76
    const epsilon = 0.0000001;
    if (Math.abs(t - 0.5) > 0.5 - epsilon) {
      const isZero = t < 0.5;
      const p0 = isZero ? this._start : this._end;
      const p1 = isZero ? this._control1 : this._control2;
      const p2 = isZero ? this._control2 : this._control1;
      const d10 = p1.minus(p0);
      const a = d10.magnitude;
      const h = (isZero ? -1 : 1) * d10.perpendicular.normalized().dot(p2.minus(p1));
      return h * (this.degree - 1) / (this.degree * a * a);
    } else {
      return this.subdivided(t)[0].curvatureAt(1);
    }
  }

  /**
   * Returns an array with up to 2 sub-segments, split at the parametric t value. Together (in order) they should make
   * up the same shape as the current segment.
   *
   * This method is part of the Segment API. See Segment.js's constructor for more API documentation.
   */
  subdivided(t) {
    assert && assert(t >= 0, 'subdivided t should be non-negative');
    assert && assert(t <= 1, 'subdivided t should be no greater than 1');

    // If t is 0 or 1, we only need to return 1 segment
    if (t === 0 || t === 1) {
      return [this];
    }

    // de Casteljau method
    // TODO: add a 'bisect' or 'between' method for vectors? https://github.com/phetsims/kite/issues/76
    const left = this._start.blend(this._control1, t);
    const right = this._control2.blend(this._end, t);
    const middle = this._control1.blend(this._control2, t);
    const leftMid = left.blend(middle, t);
    const rightMid = middle.blend(right, t);
    const mid = leftMid.blend(rightMid, t);
    return [new Cubic(this._start, left, leftMid, mid), new Cubic(mid, rightMid, right, this._end)];
  }

  /**
   * Clears cached information, should be called when any of the 'constructor arguments' are mutated.
   */
  invalidate() {
    assert && assert(this._start instanceof Vector2, `Cubic start should be a Vector2: ${this._start}`);
    assert && assert(this._start.isFinite(), `Cubic start should be finite: ${this._start.toString()}`);
    assert && assert(this._control1 instanceof Vector2, `Cubic control1 should be a Vector2: ${this._control1}`);
    assert && assert(this._control1.isFinite(), `Cubic control1 should be finite: ${this._control1.toString()}`);
    assert && assert(this._control2 instanceof Vector2, `Cubic control2 should be a Vector2: ${this._control2}`);
    assert && assert(this._control2.isFinite(), `Cubic control2 should be finite: ${this._control2.toString()}`);
    assert && assert(this._end instanceof Vector2, `Cubic end should be a Vector2: ${this._end}`);
    assert && assert(this._end.isFinite(), `Cubic end should be finite: ${this._end.toString()}`);

    // Lazily-computed derived information
    this._startTangent = null;
    this._endTangent = null;
    this._r = null;
    this._s = null;

    // Cusp-specific information
    this._tCusp = null;
    this._tDeterminant = null;
    this._tInflection1 = null;
    this._tInflection2 = null;
    this._quadratics = null;

    // T-values where X and Y (respectively) reach an extrema (not necessarily including 0 and 1)
    this._xExtremaT = null;
    this._yExtremaT = null;
    this._bounds = null;
    this._svgPathFragment = null;
    this.invalidationEmitter.emit();
  }

  /**
   * Gets the start position of this cubic polynomial.
   */
  getStartTangent() {
    if (this._startTangent === null) {
      this._startTangent = this.tangentAt(0).normalized();
    }
    return this._startTangent;
  }
  get startTangent() {
    return this.getStartTangent();
  }

  /**
   * Gets the end position of this cubic polynomial.
   */
  getEndTangent() {
    if (this._endTangent === null) {
      this._endTangent = this.tangentAt(1).normalized();
    }
    return this._endTangent;
  }
  get endTangent() {
    return this.getEndTangent();
  }

  /**
   * TODO: documentation https://github.com/phetsims/kite/issues/76
   */
  getR() {
    // from http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf
    if (this._r === null) {
      this._r = this._control1.minus(this._start).normalized();
    }
    return this._r;
  }
  get r() {
    return this.getR();
  }

  /**
   * TODO: documentation https://github.com/phetsims/kite/issues/76
   */
  getS() {
    // from http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf
    if (this._s === null) {
      this._s = this.getR().perpendicular;
    }
    return this._s;
  }
  get s() {
    return this.getS();
  }

  /**
   * Returns the parametric t value for the possible cusp location. A cusp may or may not exist at that point.
   */
  getTCusp() {
    if (this._tCusp === null) {
      this.computeCuspInfo();
    }
    assert && assert(this._tCusp !== null);
    return this._tCusp;
  }
  get tCusp() {
    return this.getTCusp();
  }

  /**
   * Returns the determinant value for the cusp, which indicates the presence (or lack of presence) of a cusp.
   */
  getTDeterminant() {
    if (this._tDeterminant === null) {
      this.computeCuspInfo();
    }
    assert && assert(this._tDeterminant !== null);
    return this._tDeterminant;
  }
  get tDeterminant() {
    return this.getTDeterminant();
  }

  /**
   * Returns the parametric t value for the potential location of the first possible inflection point.
   */
  getTInflection1() {
    if (this._tInflection1 === null) {
      this.computeCuspInfo();
    }
    assert && assert(this._tInflection1 !== null);
    return this._tInflection1;
  }
  get tInflection1() {
    return this.getTInflection1();
  }

  /**
   * Returns the parametric t value for the potential location of the second possible inflection point.
   */
  getTInflection2() {
    if (this._tInflection2 === null) {
      this.computeCuspInfo();
    }
    assert && assert(this._tInflection2 !== null);
    return this._tInflection2;
  }
  get tInflection2() {
    return this.getTInflection2();
  }

  /**
   * If there is a cusp, this cubic will consist of one or two quadratic segments, typically "start => cusp" and
   * "cusp => end".
   */
  getQuadratics() {
    if (this._quadratics === null) {
      this.computeCuspSegments();
    }
    assert && assert(this._quadratics !== null);
    return this._quadratics;
  }

  /**
   * Returns a list of parametric t values where x-extrema exist, i.e. where dx/dt==0. These are candidate locations
   * on the cubic for "maximum X" and "minimum X", and are needed for bounds computations.
   */
  getXExtremaT() {
    if (this._xExtremaT === null) {
      this._xExtremaT = Cubic.extremaT(this._start.x, this._control1.x, this._control2.x, this._end.x);
    }
    return this._xExtremaT;
  }
  get xExtremaT() {
    return this.getXExtremaT();
  }

  /**
   * Returns a list of parametric t values where y-extrema exist, i.e. where dy/dt==0. These are candidate locations
   * on the cubic for "maximum Y" and "minimum Y", and are needed for bounds computations.
   */
  getYExtremaT() {
    if (this._yExtremaT === null) {
      this._yExtremaT = Cubic.extremaT(this._start.y, this._control1.y, this._control2.y, this._end.y);
    }
    return this._yExtremaT;
  }
  get yExtremaT() {
    return this.getYExtremaT();
  }

  /**
   * Returns the bounds of this segment.
   */
  getBounds() {
    if (this._bounds === null) {
      this._bounds = Bounds2.NOTHING;
      this._bounds = this._bounds.withPoint(this._start);
      this._bounds = this._bounds.withPoint(this._end);
      _.each(this.getXExtremaT(), t => {
        if (t >= 0 && t <= 1) {
          this._bounds = this._bounds.withPoint(this.positionAt(t));
        }
      });
      _.each(this.getYExtremaT(), t => {
        if (t >= 0 && t <= 1) {
          this._bounds = this._bounds.withPoint(this.positionAt(t));
        }
      });
      if (this.hasCusp()) {
        this._bounds = this._bounds.withPoint(this.positionAt(this.getTCusp()));
      }
    }
    return this._bounds;
  }
  get bounds() {
    return this.getBounds();
  }

  /**
   * Computes all cusp-related information, including whether there is a cusp, any inflection points, etc.
   */
  computeCuspInfo() {
    // from http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf
    // TODO: allocation reduction https://github.com/phetsims/kite/issues/76
    const a = this._start.times(-1).plus(this._control1.times(3)).plus(this._control2.times(-3)).plus(this._end);
    const b = this._start.times(3).plus(this._control1.times(-6)).plus(this._control2.times(3));
    const c = this._start.times(-3).plus(this._control1.times(3));
    const aPerp = a.perpendicular; // {Vector2}
    const bPerp = b.perpendicular; // {Vector2}
    const aPerpDotB = aPerp.dot(b); // {number}

    this._tCusp = -0.5 * (aPerp.dot(c) / aPerpDotB); // {number}
    this._tDeterminant = this._tCusp * this._tCusp - 1 / 3 * (bPerp.dot(c) / aPerpDotB); // {number}
    if (this._tDeterminant >= 0) {
      const sqrtDet = Math.sqrt(this._tDeterminant);
      this._tInflection1 = this._tCusp - sqrtDet;
      this._tInflection2 = this._tCusp + sqrtDet;
    } else {
      // there are no real roots to the quadratic polynomial.
      this._tInflection1 = NaN;
      this._tInflection2 = NaN;
    }
  }

  /**
   * If there is a cusp, this computes the 2 quadratic Bezier curves that this Cubic can be converted into.
   */
  computeCuspSegments() {
    if (this.hasCusp()) {
      // if there is a cusp, we'll split at the cusp into two quadratic bezier curves.
      // see http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.94.8088&rep=rep1&type=pdf (Singularities of rational Bezier curves - J Monterde, 2001)
      this._quadratics = [];
      const tCusp = this.getTCusp();
      if (tCusp === 0) {
        this._quadratics.push(new Quadratic(this.start, this.control2, this.end));
      } else if (tCusp === 1) {
        this._quadratics.push(new Quadratic(this.start, this.control1, this.end));
      } else {
        const subdividedAtCusp = this.subdivided(tCusp);
        this._quadratics.push(new Quadratic(subdividedAtCusp[0].start, subdividedAtCusp[0].control1, subdividedAtCusp[0].end));
        this._quadratics.push(new Quadratic(subdividedAtCusp[1].start, subdividedAtCusp[1].control2, subdividedAtCusp[1].end));
      }
    } else {
      this._quadratics = null;
    }
  }

  /**
   * Returns a list of non-degenerate segments that are equivalent to this segment. Generally gets rid (or simplifies)
   * invalid or repeated segments.
   */
  getNondegenerateSegments() {
    const start = this._start;
    const control1 = this._control1;
    const control2 = this._control2;
    const end = this._end;
    const reduced = this.degreeReduced(1e-9);
    if (start.equals(end) && start.equals(control1) && start.equals(control2)) {
      // degenerate point
      return [];
    } else if (this.hasCusp()) {
      return _.flatten(this.getQuadratics().map(quadratic => quadratic.getNondegenerateSegments()));
    } else if (reduced) {
      // if we can reduce to a quadratic Bezier, always do this (and make sure it is non-degenerate)
      return reduced.getNondegenerateSegments();
    } else if (arePointsCollinear(start, control1, end) && arePointsCollinear(start, control2, end) && !start.equalsEpsilon(end, 1e-7)) {
      const extremaPoints = this.getXExtremaT().concat(this.getYExtremaT()).sort().map(t => this.positionAt(t));
      const segments = [];
      let lastPoint = start;
      if (extremaPoints.length) {
        segments.push(new Line(start, extremaPoints[0]));
        lastPoint = extremaPoints[0];
      }
      for (let i = 1; i < extremaPoints.length; i++) {
        segments.push(new Line(extremaPoints[i - 1], extremaPoints[i]));
        lastPoint = extremaPoints[i];
      }
      segments.push(new Line(lastPoint, end));
      return _.flatten(segments.map(segment => segment.getNondegenerateSegments()));
    } else {
      return [this];
    }
  }

  /**
   * Returns whether this cubic has a cusp.
   */
  hasCusp() {
    const tCusp = this.getTCusp();
    const epsilon = 1e-7; // TODO: make this available to change? https://github.com/phetsims/kite/issues/76
    return tCusp >= 0 && tCusp <= 1 && this.tangentAt(tCusp).magnitude < epsilon;
  }
  toRS(point) {
    const firstVector = point.minus(this._start);
    return new Vector2(firstVector.dot(this.getR()), firstVector.dot(this.getS()));
  }
  offsetTo(r, reverse) {
    // TODO: implement more accurate method at http://www.antigrain.com/research/adaptive_bezier/index.html https://github.com/phetsims/kite/issues/76
    // TODO: or more recently (and relevantly): http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf https://github.com/phetsims/kite/issues/76

    // how many segments to create (possibly make this more adaptive?)
    const quantity = 32;
    const points = [];
    const result = [];
    for (let i = 0; i < quantity; i++) {
      let t = i / (quantity - 1);
      if (reverse) {
        t = 1 - t;
      }
      points.push(this.positionAt(t).plus(this.tangentAt(t).perpendicular.normalized().times(r)));
      if (i > 0) {
        result.push(new Line(points[i - 1], points[i]));
      }
    }
    return result;
  }

  /**
   * Returns a string containing the SVG path. assumes that the start point is already provided, so anything that calls this needs to put
   * the M calls first
   */
  getSVGPathFragment() {
    let oldPathFragment;
    if (assert) {
      oldPathFragment = this._svgPathFragment;
      this._svgPathFragment = null;
    }
    if (!this._svgPathFragment) {
      this._svgPathFragment = `C ${svgNumber(this._control1.x)} ${svgNumber(this._control1.y)} ${svgNumber(this._control2.x)} ${svgNumber(this._control2.y)} ${svgNumber(this._end.x)} ${svgNumber(this._end.y)}`;
    }
    if (assert) {
      if (oldPathFragment) {
        assert(oldPathFragment === this._svgPathFragment, 'Quadratic line segment changed without invalidate()');
      }
    }
    return this._svgPathFragment;
  }

  /**
   * Returns an array of lines that will draw an offset curve on the logical left side
   */
  strokeLeft(lineWidth) {
    return this.offsetTo(-lineWidth / 2, false);
  }

  /**
   * Returns an array of lines that will draw an offset curve on the logical right side
   */
  strokeRight(lineWidth) {
    return this.offsetTo(lineWidth / 2, true);
  }

  /**
   * Returns a list of t values where dx/dt or dy/dt is 0 where 0 < t < 1. subdividing on these will result in monotonic segments
   * The list does not include t=0 and t=1
   */
  getInteriorExtremaTs() {
    const ts = this.getXExtremaT().concat(this.getYExtremaT());
    const result = [];
    _.each(ts, t => {
      const epsilon = 0.0000000001; // TODO: general kite epsilon? https://github.com/phetsims/kite/issues/76
      if (t > epsilon && t < 1 - epsilon) {
        // don't add duplicate t values
        if (_.every(result, otherT => Math.abs(t - otherT) > epsilon)) {
          result.push(t);
        }
      }
    });
    return result.sort();
  }

  /**
   * Hit-tests this segment with the ray. An array of all intersections of the ray with this segment will be returned.
   * For details, see the documentation in Segment.js
   */
  intersection(ray) {
    const result = [];

    // find the rotation that will put our ray in the direction of the x-axis so we can only solve for y=0 for intersections
    const inverseMatrix = Matrix3.rotation2(-ray.direction.angle).timesMatrix(Matrix3.translation(-ray.position.x, -ray.position.y));
    const p0 = inverseMatrix.timesVector2(this._start);
    const p1 = inverseMatrix.timesVector2(this._control1);
    const p2 = inverseMatrix.timesVector2(this._control2);
    const p3 = inverseMatrix.timesVector2(this._end);

    // polynomial form of cubic: start + (3 control1 - 3 start) t + (-6 control1 + 3 control2 + 3 start) t^2 + (3 control1 - 3 control2 + end - start) t^3
    const a = -p0.y + 3 * p1.y - 3 * p2.y + p3.y;
    const b = 3 * p0.y - 6 * p1.y + 3 * p2.y;
    const c = -3 * p0.y + 3 * p1.y;
    const d = p0.y;
    const ts = solveCubicRootsReal(a, b, c, d);
    _.each(ts, t => {
      if (t >= 0 && t <= 1) {
        const hitPoint = this.positionAt(t);
        const unitTangent = this.tangentAt(t).normalized();
        const perp = unitTangent.perpendicular;
        const toHit = hitPoint.minus(ray.position);

        // make sure it's not behind the ray
        if (toHit.dot(ray.direction) > 0) {
          const normal = perp.dot(ray.direction) > 0 ? perp.negated() : perp;
          const wind = ray.direction.perpendicular.dot(unitTangent) < 0 ? 1 : -1;
          result.push(new RayIntersection(toHit.magnitude, hitPoint, normal, wind, t));
        }
      }
    });
    return result;
  }

  /**
   * Returns the winding number for intersection with a ray
   */
  windingIntersection(ray) {
    let wind = 0;
    const hits = this.intersection(ray);
    _.each(hits, hit => {
      wind += hit.wind;
    });
    return wind;
  }

  /**
   * Draws the segment to the 2D Canvas context, assuming the context's current location is already at the start point
   */
  writeToContext(context) {
    context.bezierCurveTo(this._control1.x, this._control1.y, this._control2.x, this._control2.y, this._end.x, this._end.y);
  }

  /**
   * Returns a new cubic that represents this cubic after transformation by the matrix
   */
  transformed(matrix) {
    return new Cubic(matrix.timesVector2(this._start), matrix.timesVector2(this._control1), matrix.timesVector2(this._control2), matrix.timesVector2(this._end));
  }

  /**
   * Returns a degree-reduced quadratic Bezier if possible, otherwise it returns null
   */
  degreeReduced(epsilon) {
    epsilon = epsilon || 0; // if not provided, use an exact version
    const controlA = scratchVector1.set(this._control1).multiplyScalar(3).subtract(this._start).divideScalar(2);
    const controlB = scratchVector2.set(this._control2).multiplyScalar(3).subtract(this._end).divideScalar(2);
    const difference = scratchVector3.set(controlA).subtract(controlB);
    if (difference.magnitude <= epsilon) {
      return new Quadratic(this._start, controlA.average(controlB),
      // average the control points for stability. they should be almost identical
      this._end);
    } else {
      // the two options for control points are too far away, this curve isn't easily reducible.
      return null;
    }
  }

  /**
   * Returns the contribution to the signed area computed using Green's Theorem, with P=-y/2 and Q=x/2.
   *
   * NOTE: This is this segment's contribution to the line integral (-y/2 dx + x/2 dy).
   */
  getSignedAreaFragment() {
    return 1 / 20 * (this._start.x * (6 * this._control1.y + 3 * this._control2.y + this._end.y) + this._control1.x * (-6 * this._start.y + 3 * this._control2.y + 3 * this._end.y) + this._control2.x * (-3 * this._start.y - 3 * this._control1.y + 6 * this._end.y) + this._end.x * (-this._start.y - 3 * this._control1.y - 6 * this._control2.y));
  }

  /**
   * Returns a reversed copy of this segment (mapping the parametrization from [0,1] => [1,0]).
   */
  reversed() {
    return new Cubic(this._end, this._control2, this._control1, this._start);
  }

  /**
   * If it exists, returns the point where the cubic curve self-intersects.
   *
   * @returns - Null if there is no intersection
   */
  getSelfIntersection() {
    // We split the cubic into monotone sections (which can't self-intersect), then check these for intersections
    const tExtremes = this.getInteriorExtremaTs();
    const fullExtremes = [0].concat(tExtremes).concat([1]);
    const segments = this.subdivisions(tExtremes);
    if (segments.length < 3) {
      return null;
    }
    for (let i = 0; i < segments.length; i++) {
      const aSegment = segments[i];
      for (let j = i + 1; j < segments.length; j++) {
        const bSegment = segments[j];
        const intersections = BoundsIntersection.intersect(aSegment, bSegment);
        assert && assert(intersections.length < 2);
        if (intersections.length) {
          const intersection = intersections[0];
          // Exclude endpoints overlapping
          if (intersection.aT > 1e-7 && intersection.aT < 1 - 1e-7 && intersection.bT > 1e-7 && intersection.bT < 1 - 1e-7) {
            // Remap parametric values from the subdivided segments to the main segment
            const aT = fullExtremes[i] + intersection.aT * (fullExtremes[i + 1] - fullExtremes[i]);
            const bT = fullExtremes[j] + intersection.bT * (fullExtremes[j + 1] - fullExtremes[j]);
            return new SegmentIntersection(intersection.point, aT, bT);
          }
        }
      }
    }
    return null;
  }

  /**
   * Returns an object form that can be turned back into a segment with the corresponding deserialize method.
   */
  serialize() {
    return {
      type: 'Cubic',
      startX: this._start.x,
      startY: this._start.y,
      control1X: this._control1.x,
      control1Y: this._control1.y,
      control2X: this._control2.x,
      control2Y: this._control2.y,
      endX: this._end.x,
      endY: this._end.y
    };
  }

  /**
   * Determine whether two lines overlap over a continuous section, and if so finds the a,b pair such that
   * p( t ) === q( a * t + b ).
   *
   * @param segment
   * @param [epsilon] - Will return overlaps only if no two corresponding points differ by this amount or more
   *                             in one component.
   * @returns - The solution, if there is one (and only one)
   */
  getOverlaps(segment, epsilon = 1e-6) {
    if (segment instanceof Cubic) {
      return Cubic.getOverlaps(this, segment);
    }
    return null;
  }

  /**
   * Returns a Cubic from the serialized representation.
   */
  static deserialize(obj) {
    assert && assert(obj.type === 'Cubic');
    return new Cubic(new Vector2(obj.startX, obj.startY), new Vector2(obj.control1X, obj.control1Y), new Vector2(obj.control2X, obj.control2Y), new Vector2(obj.endX, obj.endY));
  }

  /**
   * Finds what t values the cubic extrema are at (if any). This is just the 1-dimensional case, used for multiple purposes
   */
  static extremaT(v0, v1, v2, v3) {
    if (v0 === v1 && v0 === v2 && v0 === v3) {
      return [];
    }

    // coefficients of derivative
    const a = -3 * v0 + 9 * v1 - 9 * v2 + 3 * v3;
    const b = 6 * v0 - 12 * v1 + 6 * v2;
    const c = -3 * v0 + 3 * v1;
    return _.filter(solveQuadraticRootsReal(a, b, c), isBetween0And1);
  }

  /**
   * Determine whether two Cubics overlap over a continuous section, and if so finds the a,b pair such that
   * p( t ) === q( a * t + b ).
   *
   * NOTE: for this particular function, we assume we're not degenerate. Things may work if we can be degree-reduced
   * to a quadratic, but generally that shouldn't be done.
   *
   * @param cubic1
   * @param cubic2
   * @param [epsilon] - Will return overlaps only if no two corresponding points differ by this amount or more
   *                    in one component.
   * @returns - The solution, if there is one (and only one)
   */
  static getOverlaps(cubic1, cubic2, epsilon = 1e-6) {
    /*
     * For a 1-dimensional cubic bezier, we have the formula:
     *
     *                            [  0  0  0  0 ]   [ p0 ]
     * p( t ) = [ 1 t t^2 t^3 ] * [ -3  3  0  0 ] * [ p1 ]
     *                            [  3 -6  3  0 ]   [ p2 ]
     *                            [ -1  3 -3  1 ]   [ p3 ]
     *
     * where p0,p1,p2,p3 are the control values (start,control1,control2,end). We want to see if a linear-mapped cubic:
     *
     *                                              [ 1 b b^2  b^3  ]   [  0  0  0  0 ]   [ q0 ]
     * p( t ) =? q( a * t + b ) = [ 1 t t^2 t^3 ] * [ 0 a 2ab 3ab^2 ] * [ -3  3  0  0 ] * [ q1 ]
     *                                              [ 0 0 a^2 3a^2b ]   [  3 -6  3  0 ]   [ q2 ]
     *                                              [ 0 0  0   a^3  ]   [ -1  3 -3  1 ]   [ q3 ]
     *
     * (is it equal to the second cubic if we can find a linear way to map its input t-value?)
     *
     * For simplicity and efficiency, we'll precompute the multiplication of the bezier matrix:
     * [ p0s ]    [  1   0   0   0 ]   [ p0 ]
     * [ p1s ] == [ -3   3   0   0 ] * [ p1 ]
     * [ p2s ]    [  3  -6   3   0 ]   [ p2 ]
     * [ p3s ]    [ -1   3  -3   1 ]   [ p3 ]
     *
     * Leaving our computation to solve for a,b such that:
     *
     * [ p0s ]    [ 1 b b^2  b^3  ]   [ q0s ]
     * [ p1s ] == [ 0 a 2ab 3ab^2 ] * [ q1s ]
     * [ p2s ]    [ 0 0 a^2 3a^2b ]   [ q2s ]
     * [ p3s ]    [ 0 0  0   a^3  ]   [ q3s ]
     *
     * The subproblem of computing possible a,b pairs will be left to Segment.polynomialGetOverlapCubic and its
     * reductions (if p3s/q3s are zero, they aren't fully cubic beziers and can be degree reduced, which is handled).
     *
     * Then, given an a,b pair, we need to ensure the above formula is satisfied (approximately, due to floating-point
     * arithmetic).
     */

    const noOverlap = [];

    // Efficiently compute the multiplication of the bezier matrix:
    const p0x = cubic1._start.x;
    const p1x = -3 * cubic1._start.x + 3 * cubic1._control1.x;
    const p2x = 3 * cubic1._start.x - 6 * cubic1._control1.x + 3 * cubic1._control2.x;
    const p3x = -1 * cubic1._start.x + 3 * cubic1._control1.x - 3 * cubic1._control2.x + cubic1._end.x;
    const p0y = cubic1._start.y;
    const p1y = -3 * cubic1._start.y + 3 * cubic1._control1.y;
    const p2y = 3 * cubic1._start.y - 6 * cubic1._control1.y + 3 * cubic1._control2.y;
    const p3y = -1 * cubic1._start.y + 3 * cubic1._control1.y - 3 * cubic1._control2.y + cubic1._end.y;
    const q0x = cubic2._start.x;
    const q1x = -3 * cubic2._start.x + 3 * cubic2._control1.x;
    const q2x = 3 * cubic2._start.x - 6 * cubic2._control1.x + 3 * cubic2._control2.x;
    const q3x = -1 * cubic2._start.x + 3 * cubic2._control1.x - 3 * cubic2._control2.x + cubic2._end.x;
    const q0y = cubic2._start.y;
    const q1y = -3 * cubic2._start.y + 3 * cubic2._control1.y;
    const q2y = 3 * cubic2._start.y - 6 * cubic2._control1.y + 3 * cubic2._control2.y;
    const q3y = -1 * cubic2._start.y + 3 * cubic2._control1.y - 3 * cubic2._control2.y + cubic2._end.y;

    // Determine the candidate overlap (preferring the dimension with the largest variation)
    const xSpread = Math.abs(Math.max(cubic1._start.x, cubic1._control1.x, cubic1._control2.x, cubic1._end.x, cubic1._start.x, cubic1._control1.x, cubic1._control2.x, cubic1._end.x) - Math.min(cubic1._start.x, cubic1._control1.x, cubic1._control2.x, cubic1._end.x, cubic1._start.x, cubic1._control1.x, cubic1._control2.x, cubic1._end.x));
    const ySpread = Math.abs(Math.max(cubic1._start.y, cubic1._control1.y, cubic1._control2.y, cubic1._end.y, cubic1._start.y, cubic1._control1.y, cubic1._control2.y, cubic1._end.y) - Math.min(cubic1._start.y, cubic1._control1.y, cubic1._control2.y, cubic1._end.y, cubic1._start.y, cubic1._control1.y, cubic1._control2.y, cubic1._end.y));
    const xOverlap = Segment.polynomialGetOverlapCubic(p0x, p1x, p2x, p3x, q0x, q1x, q2x, q3x);
    const yOverlap = Segment.polynomialGetOverlapCubic(p0y, p1y, p2y, p3y, q0y, q1y, q2y, q3y);
    let overlap;
    if (xSpread > ySpread) {
      overlap = xOverlap === null || xOverlap === true ? yOverlap : xOverlap;
    } else {
      overlap = yOverlap === null || yOverlap === true ? xOverlap : yOverlap;
    }
    if (overlap === null || overlap === true) {
      return noOverlap; // No way to pin down an overlap
    }
    const a = overlap.a;
    const b = overlap.b;

    // Premultiply a few values
    const aa = a * a;
    const aaa = a * a * a;
    const bb = b * b;
    const bbb = b * b * b;
    const ab2 = 2 * a * b;
    const abb3 = 3 * a * bb;
    const aab3 = 3 * aa * b;

    // Compute cubic coefficients for the difference between p(t) and q(a*t+b)
    const d0x = q0x + b * q1x + bb * q2x + bbb * q3x - p0x;
    const d1x = a * q1x + ab2 * q2x + abb3 * q3x - p1x;
    const d2x = aa * q2x + aab3 * q3x - p2x;
    const d3x = aaa * q3x - p3x;
    const d0y = q0y + b * q1y + bb * q2y + bbb * q3y - p0y;
    const d1y = a * q1y + ab2 * q2y + abb3 * q3y - p1y;
    const d2y = aa * q2y + aab3 * q3y - p2y;
    const d3y = aaa * q3y - p3y;

    // Find the t values where extremes lie in the [0,1] range for each 1-dimensional cubic. We do this by
    // differentiating the cubic and finding the roots of the resulting quadratic.
    const xRoots = Utils.solveQuadraticRootsReal(3 * d3x, 2 * d2x, d1x);
    const yRoots = Utils.solveQuadraticRootsReal(3 * d3y, 2 * d2y, d1y);
    const xExtremeTs = _.uniq([0, 1].concat(xRoots !== null ? xRoots.filter(isBetween0And1) : []));
    const yExtremeTs = _.uniq([0, 1].concat(yRoots !== null ? yRoots.filter(isBetween0And1) : []));

    // Examine the single-coordinate distances between the "overlaps" at each extreme T value. If the distance is larger
    // than our epsilon, then the "overlap" would not be valid.
    for (let i = 0; i < xExtremeTs.length; i++) {
      const t = xExtremeTs[i];
      if (Math.abs(((d3x * t + d2x) * t + d1x) * t + d0x) > epsilon) {
        return noOverlap;
      }
    }
    for (let i = 0; i < yExtremeTs.length; i++) {
      const t = yExtremeTs[i];
      if (Math.abs(((d3y * t + d2y) * t + d1y) * t + d0y) > epsilon) {
        return noOverlap;
      }
    }
    const qt0 = b;
    const qt1 = a + b;

    // TODO: do we want an epsilon in here to be permissive? https://github.com/phetsims/kite/issues/76
    if (qt0 > 1 && qt1 > 1 || qt0 < 0 && qt1 < 0) {
      return noOverlap;
    }
    return [new Overlap(a, b)];
  }

  // Degree of this polynomial (cubic)
}
Cubic.prototype.degree = 3;
kite.register('Cubic', Cubic);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiTWF0cml4MyIsIlV0aWxzIiwiVmVjdG9yMiIsIkJvdW5kc0ludGVyc2VjdGlvbiIsImtpdGUiLCJMaW5lIiwiT3ZlcmxhcCIsIlF1YWRyYXRpYyIsIlJheUludGVyc2VjdGlvbiIsIlNlZ21lbnQiLCJTZWdtZW50SW50ZXJzZWN0aW9uIiwic3ZnTnVtYmVyIiwic29sdmVRdWFkcmF0aWNSb290c1JlYWwiLCJzb2x2ZUN1YmljUm9vdHNSZWFsIiwiYXJlUG9pbnRzQ29sbGluZWFyIiwic2NyYXRjaFZlY3RvcjEiLCJzY3JhdGNoVmVjdG9yMiIsInNjcmF0Y2hWZWN0b3IzIiwiaXNCZXR3ZWVuMEFuZDEiLCJ0IiwiQ3ViaWMiLCJjb25zdHJ1Y3RvciIsInN0YXJ0IiwiY29udHJvbDEiLCJjb250cm9sMiIsImVuZCIsIl9zdGFydCIsIl9jb250cm9sMSIsIl9jb250cm9sMiIsIl9lbmQiLCJpbnZhbGlkYXRlIiwic2V0U3RhcnQiLCJhc3NlcnQiLCJpc0Zpbml0ZSIsInRvU3RyaW5nIiwiZXF1YWxzIiwidmFsdWUiLCJnZXRTdGFydCIsInNldENvbnRyb2wxIiwiZ2V0Q29udHJvbDEiLCJzZXRDb250cm9sMiIsImdldENvbnRyb2wyIiwic2V0RW5kIiwiZ2V0RW5kIiwicG9zaXRpb25BdCIsIm10IiwibW1tIiwibW10IiwibXR0IiwidHR0IiwieCIsInkiLCJ0YW5nZW50QXQiLCJyZXN1bHQiLCJzZXQiLCJtdWx0aXBseVNjYWxhciIsImFkZCIsImN1cnZhdHVyZUF0IiwiZXBzaWxvbiIsIk1hdGgiLCJhYnMiLCJpc1plcm8iLCJwMCIsInAxIiwicDIiLCJkMTAiLCJtaW51cyIsImEiLCJtYWduaXR1ZGUiLCJoIiwicGVycGVuZGljdWxhciIsIm5vcm1hbGl6ZWQiLCJkb3QiLCJkZWdyZWUiLCJzdWJkaXZpZGVkIiwibGVmdCIsImJsZW5kIiwicmlnaHQiLCJtaWRkbGUiLCJsZWZ0TWlkIiwicmlnaHRNaWQiLCJtaWQiLCJfc3RhcnRUYW5nZW50IiwiX2VuZFRhbmdlbnQiLCJfciIsIl9zIiwiX3RDdXNwIiwiX3REZXRlcm1pbmFudCIsIl90SW5mbGVjdGlvbjEiLCJfdEluZmxlY3Rpb24yIiwiX3F1YWRyYXRpY3MiLCJfeEV4dHJlbWFUIiwiX3lFeHRyZW1hVCIsIl9ib3VuZHMiLCJfc3ZnUGF0aEZyYWdtZW50IiwiaW52YWxpZGF0aW9uRW1pdHRlciIsImVtaXQiLCJnZXRTdGFydFRhbmdlbnQiLCJzdGFydFRhbmdlbnQiLCJnZXRFbmRUYW5nZW50IiwiZW5kVGFuZ2VudCIsImdldFIiLCJyIiwiZ2V0UyIsInMiLCJnZXRUQ3VzcCIsImNvbXB1dGVDdXNwSW5mbyIsInRDdXNwIiwiZ2V0VERldGVybWluYW50IiwidERldGVybWluYW50IiwiZ2V0VEluZmxlY3Rpb24xIiwidEluZmxlY3Rpb24xIiwiZ2V0VEluZmxlY3Rpb24yIiwidEluZmxlY3Rpb24yIiwiZ2V0UXVhZHJhdGljcyIsImNvbXB1dGVDdXNwU2VnbWVudHMiLCJnZXRYRXh0cmVtYVQiLCJleHRyZW1hVCIsInhFeHRyZW1hVCIsImdldFlFeHRyZW1hVCIsInlFeHRyZW1hVCIsImdldEJvdW5kcyIsIk5PVEhJTkciLCJ3aXRoUG9pbnQiLCJfIiwiZWFjaCIsImhhc0N1c3AiLCJib3VuZHMiLCJ0aW1lcyIsInBsdXMiLCJiIiwiYyIsImFQZXJwIiwiYlBlcnAiLCJhUGVycERvdEIiLCJzcXJ0RGV0Iiwic3FydCIsIk5hTiIsInB1c2giLCJzdWJkaXZpZGVkQXRDdXNwIiwiZ2V0Tm9uZGVnZW5lcmF0ZVNlZ21lbnRzIiwicmVkdWNlZCIsImRlZ3JlZVJlZHVjZWQiLCJmbGF0dGVuIiwibWFwIiwicXVhZHJhdGljIiwiZXF1YWxzRXBzaWxvbiIsImV4dHJlbWFQb2ludHMiLCJjb25jYXQiLCJzb3J0Iiwic2VnbWVudHMiLCJsYXN0UG9pbnQiLCJsZW5ndGgiLCJpIiwic2VnbWVudCIsInRvUlMiLCJwb2ludCIsImZpcnN0VmVjdG9yIiwib2Zmc2V0VG8iLCJyZXZlcnNlIiwicXVhbnRpdHkiLCJwb2ludHMiLCJnZXRTVkdQYXRoRnJhZ21lbnQiLCJvbGRQYXRoRnJhZ21lbnQiLCJzdHJva2VMZWZ0IiwibGluZVdpZHRoIiwic3Ryb2tlUmlnaHQiLCJnZXRJbnRlcmlvckV4dHJlbWFUcyIsInRzIiwiZXZlcnkiLCJvdGhlclQiLCJpbnRlcnNlY3Rpb24iLCJyYXkiLCJpbnZlcnNlTWF0cml4Iiwicm90YXRpb24yIiwiZGlyZWN0aW9uIiwiYW5nbGUiLCJ0aW1lc01hdHJpeCIsInRyYW5zbGF0aW9uIiwicG9zaXRpb24iLCJ0aW1lc1ZlY3RvcjIiLCJwMyIsImQiLCJoaXRQb2ludCIsInVuaXRUYW5nZW50IiwicGVycCIsInRvSGl0Iiwibm9ybWFsIiwibmVnYXRlZCIsIndpbmQiLCJ3aW5kaW5nSW50ZXJzZWN0aW9uIiwiaGl0cyIsImhpdCIsIndyaXRlVG9Db250ZXh0IiwiY29udGV4dCIsImJlemllckN1cnZlVG8iLCJ0cmFuc2Zvcm1lZCIsIm1hdHJpeCIsImNvbnRyb2xBIiwic3VidHJhY3QiLCJkaXZpZGVTY2FsYXIiLCJjb250cm9sQiIsImRpZmZlcmVuY2UiLCJhdmVyYWdlIiwiZ2V0U2lnbmVkQXJlYUZyYWdtZW50IiwicmV2ZXJzZWQiLCJnZXRTZWxmSW50ZXJzZWN0aW9uIiwidEV4dHJlbWVzIiwiZnVsbEV4dHJlbWVzIiwic3ViZGl2aXNpb25zIiwiYVNlZ21lbnQiLCJqIiwiYlNlZ21lbnQiLCJpbnRlcnNlY3Rpb25zIiwiaW50ZXJzZWN0IiwiYVQiLCJiVCIsInNlcmlhbGl6ZSIsInR5cGUiLCJzdGFydFgiLCJzdGFydFkiLCJjb250cm9sMVgiLCJjb250cm9sMVkiLCJjb250cm9sMlgiLCJjb250cm9sMlkiLCJlbmRYIiwiZW5kWSIsImdldE92ZXJsYXBzIiwiZGVzZXJpYWxpemUiLCJvYmoiLCJ2MCIsInYxIiwidjIiLCJ2MyIsImZpbHRlciIsImN1YmljMSIsImN1YmljMiIsIm5vT3ZlcmxhcCIsInAweCIsInAxeCIsInAyeCIsInAzeCIsInAweSIsInAxeSIsInAyeSIsInAzeSIsInEweCIsInExeCIsInEyeCIsInEzeCIsInEweSIsInExeSIsInEyeSIsInEzeSIsInhTcHJlYWQiLCJtYXgiLCJtaW4iLCJ5U3ByZWFkIiwieE92ZXJsYXAiLCJwb2x5bm9taWFsR2V0T3ZlcmxhcEN1YmljIiwieU92ZXJsYXAiLCJvdmVybGFwIiwiYWEiLCJhYWEiLCJiYiIsImJiYiIsImFiMiIsImFiYjMiLCJhYWIzIiwiZDB4IiwiZDF4IiwiZDJ4IiwiZDN4IiwiZDB5IiwiZDF5IiwiZDJ5IiwiZDN5IiwieFJvb3RzIiwieVJvb3RzIiwieEV4dHJlbWVUcyIsInVuaXEiLCJ5RXh0cmVtZVRzIiwicXQwIiwicXQxIiwicHJvdG90eXBlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJDdWJpYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBDdWJpYyBCZXppZXIgc2VnbWVudC5cclxuICpcclxuICogU2VlIGh0dHA6Ly93d3cuY2lzLnVzb3V0aGFsLmVkdS9+aGFpbi9nZW5lcmFsL1B1YmxpY2F0aW9ucy9CZXppZXIvQmV6aWVyRmxhdHRlbmluZy5wZGYgZm9yIGluZm9cclxuICpcclxuICogR29vZCByZWZlcmVuY2U6IGh0dHA6Ly9jYWdkLmNzLmJ5dS5lZHUvfjU1Ny90ZXh0L2NoMi5wZGZcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgUmF5MiBmcm9tICcuLi8uLi8uLi9kb3QvanMvUmF5Mi5qcyc7XHJcbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi8uLi9kb3QvanMvVXRpbHMuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCB7IEJvdW5kc0ludGVyc2VjdGlvbiwga2l0ZSwgTGluZSwgT3ZlcmxhcCwgUXVhZHJhdGljLCBSYXlJbnRlcnNlY3Rpb24sIFNlZ21lbnQsIFNlZ21lbnRJbnRlcnNlY3Rpb24sIHN2Z051bWJlciB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxuY29uc3Qgc29sdmVRdWFkcmF0aWNSb290c1JlYWwgPSBVdGlscy5zb2x2ZVF1YWRyYXRpY1Jvb3RzUmVhbDsgLy8gZnVuY3Rpb24gdGhhdCByZXR1cm5zIGFuIGFycmF5IG9mIG51bWJlclxyXG5jb25zdCBzb2x2ZUN1YmljUm9vdHNSZWFsID0gVXRpbHMuc29sdmVDdWJpY1Jvb3RzUmVhbDsgLy8gZnVuY3Rpb24gdGhhdCByZXR1cm5zIGFuIGFycmF5IG9mIG51bWJlclxyXG5jb25zdCBhcmVQb2ludHNDb2xsaW5lYXIgPSBVdGlscy5hcmVQb2ludHNDb2xsaW5lYXI7IC8vIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIGJvb2xlYW5cclxuXHJcbi8vIGNvbnZlbmllbmNlIHZhcmlhYmxlcyB1c2UgdG8gcmVkdWNlIHRoZSBudW1iZXIgb2YgdmVjdG9yIGFsbG9jYXRpb25zXHJcbmNvbnN0IHNjcmF0Y2hWZWN0b3IxID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuY29uc3Qgc2NyYXRjaFZlY3RvcjIgPSBuZXcgVmVjdG9yMiggMCwgMCApO1xyXG5jb25zdCBzY3JhdGNoVmVjdG9yMyA9IG5ldyBWZWN0b3IyKCAwLCAwICk7XHJcblxyXG4vLyBVc2VkIGluIG11bHRpcGxlIGZpbHRlcnNcclxuZnVuY3Rpb24gaXNCZXR3ZWVuMEFuZDEoIHQ6IG51bWJlciApOiBib29sZWFuIHtcclxuICByZXR1cm4gdCA+PSAwICYmIHQgPD0gMTtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgU2VyaWFsaXplZEN1YmljID0ge1xyXG4gIHR5cGU6ICdDdWJpYyc7XHJcbiAgc3RhcnRYOiBudW1iZXI7XHJcbiAgc3RhcnRZOiBudW1iZXI7XHJcbiAgY29udHJvbDFYOiBudW1iZXI7XHJcbiAgY29udHJvbDFZOiBudW1iZXI7XHJcbiAgY29udHJvbDJYOiBudW1iZXI7XHJcbiAgY29udHJvbDJZOiBudW1iZXI7XHJcbiAgZW5kWDogbnVtYmVyO1xyXG4gIGVuZFk6IG51bWJlcjtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEN1YmljIGV4dGVuZHMgU2VnbWVudCB7XHJcblxyXG4gIHByaXZhdGUgX3N0YXJ0OiBWZWN0b3IyO1xyXG4gIHByaXZhdGUgX2NvbnRyb2wxOiBWZWN0b3IyO1xyXG4gIHByaXZhdGUgX2NvbnRyb2wyOiBWZWN0b3IyO1xyXG4gIHByaXZhdGUgX2VuZDogVmVjdG9yMjtcclxuXHJcbiAgLy8gTGF6aWx5LWNvbXB1dGVkIGRlcml2ZWQgaW5mb3JtYXRpb25cclxuICBwcml2YXRlIF9zdGFydFRhbmdlbnQhOiBWZWN0b3IyIHwgbnVsbDtcclxuICBwcml2YXRlIF9lbmRUYW5nZW50ITogVmVjdG9yMiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBfciE6IFZlY3RvcjIgfCBudWxsO1xyXG4gIHByaXZhdGUgX3MhOiBWZWN0b3IyIHwgbnVsbDtcclxuXHJcbiAgLy8gQ3VzcC1zcGVjaWZpYyBpbmZvcm1hdGlvblxyXG4gIHByaXZhdGUgX3RDdXNwITogbnVtYmVyIHwgbnVsbDsgLy8gVCB2YWx1ZSBmb3IgYSBwb3RlbnRpYWwgY3VzcFxyXG4gIHByaXZhdGUgX3REZXRlcm1pbmFudCE6IG51bWJlciB8IG51bGw7XHJcbiAgcHJpdmF0ZSBfdEluZmxlY3Rpb24xITogbnVtYmVyIHwgbnVsbDsgLy8gTmFOIGlmIG5vdCBhcHBsaWNhYmxlXHJcbiAgcHJpdmF0ZSBfdEluZmxlY3Rpb24yITogbnVtYmVyIHwgbnVsbDsgLy8gTmFOIGlmIG5vdCBhcHBsaWNhYmxlXHJcbiAgcHJpdmF0ZSBfcXVhZHJhdGljcyE6IFF1YWRyYXRpY1tdIHwgbnVsbDtcclxuXHJcbiAgLy8gVC12YWx1ZXMgd2hlcmUgWCBhbmQgWSAocmVzcGVjdGl2ZWx5KSByZWFjaCBhbiBleHRyZW1hIChub3QgbmVjZXNzYXJpbHkgaW5jbHVkaW5nIDAgYW5kIDEpXHJcbiAgcHJpdmF0ZSBfeEV4dHJlbWFUITogbnVtYmVyW10gfCBudWxsO1xyXG4gIHByaXZhdGUgX3lFeHRyZW1hVCE6IG51bWJlcltdIHwgbnVsbDtcclxuXHJcbiAgcHJpdmF0ZSBfYm91bmRzITogQm91bmRzMiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBfc3ZnUGF0aEZyYWdtZW50ITogc3RyaW5nIHwgbnVsbDtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHN0YXJ0IC0gU3RhcnQgcG9pbnQgb2YgdGhlIGN1YmljIGJlemllclxyXG4gICAqIEBwYXJhbSBjb250cm9sMSAtIEZpcnN0IGNvbnRyb2wgcG9pbnQgKGN1cnZlIHVzdWFsbHkgZG9lc24ndCBnbyB0aHJvdWdoIGhlcmUpXHJcbiAgICogQHBhcmFtIGNvbnRyb2wyIC0gU2Vjb25kIGNvbnRyb2wgcG9pbnQgKGN1cnZlIHVzdWFsbHkgZG9lc24ndCBnbyB0aHJvdWdoIGhlcmUpXHJcbiAgICogQHBhcmFtIGVuZCAtIEVuZCBwb2ludCBvZiB0aGUgY3ViaWMgYmV6aWVyXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBzdGFydDogVmVjdG9yMiwgY29udHJvbDE6IFZlY3RvcjIsIGNvbnRyb2wyOiBWZWN0b3IyLCBlbmQ6IFZlY3RvcjIgKSB7XHJcbiAgICBzdXBlcigpO1xyXG5cclxuICAgIHRoaXMuX3N0YXJ0ID0gc3RhcnQ7XHJcbiAgICB0aGlzLl9jb250cm9sMSA9IGNvbnRyb2wxO1xyXG4gICAgdGhpcy5fY29udHJvbDIgPSBjb250cm9sMjtcclxuICAgIHRoaXMuX2VuZCA9IGVuZDtcclxuXHJcbiAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHN0YXJ0IHBvaW50IG9mIHRoZSBDdWJpYy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0U3RhcnQoIHN0YXJ0OiBWZWN0b3IyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc3RhcnQuaXNGaW5pdGUoKSwgYEN1YmljIHN0YXJ0IHNob3VsZCBiZSBmaW5pdGU6ICR7c3RhcnQudG9TdHJpbmcoKX1gICk7XHJcblxyXG4gICAgaWYgKCAhdGhpcy5fc3RhcnQuZXF1YWxzKCBzdGFydCApICkge1xyXG4gICAgICB0aGlzLl9zdGFydCA9IHN0YXJ0O1xyXG4gICAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBzdGFydCggdmFsdWU6IFZlY3RvcjIgKSB7IHRoaXMuc2V0U3RhcnQoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBzdGFydCgpOiBWZWN0b3IyIHsgcmV0dXJuIHRoaXMuZ2V0U3RhcnQoKTsgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc3RhcnQgb2YgdGhpcyBDdWJpYy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U3RhcnQoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5fc3RhcnQ7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgZmlyc3QgY29udHJvbCBwb2ludCBvZiB0aGUgQ3ViaWMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldENvbnRyb2wxKCBjb250cm9sMTogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGNvbnRyb2wxLmlzRmluaXRlKCksIGBDdWJpYyBjb250cm9sMSBzaG91bGQgYmUgZmluaXRlOiAke2NvbnRyb2wxLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgIGlmICggIXRoaXMuX2NvbnRyb2wxLmVxdWFscyggY29udHJvbDEgKSApIHtcclxuICAgICAgdGhpcy5fY29udHJvbDEgPSBjb250cm9sMTtcclxuICAgICAgdGhpcy5pbnZhbGlkYXRlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgY29udHJvbDEoIHZhbHVlOiBWZWN0b3IyICkgeyB0aGlzLnNldENvbnRyb2wxKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgY29udHJvbDEoKTogVmVjdG9yMiB7IHJldHVybiB0aGlzLmdldENvbnRyb2wxKCk7IH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGZpcnN0IGNvbnRyb2wgcG9pbnQgb2YgdGhpcyBDdWJpYy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q29udHJvbDEoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29udHJvbDE7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgc2Vjb25kIGNvbnRyb2wgcG9pbnQgb2YgdGhlIEN1YmljLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRDb250cm9sMiggY29udHJvbDI6IFZlY3RvcjIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBjb250cm9sMi5pc0Zpbml0ZSgpLCBgQ3ViaWMgY29udHJvbDIgc2hvdWxkIGJlIGZpbml0ZTogJHtjb250cm9sMi50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICBpZiAoICF0aGlzLl9jb250cm9sMi5lcXVhbHMoIGNvbnRyb2wyICkgKSB7XHJcbiAgICAgIHRoaXMuX2NvbnRyb2wyID0gY29udHJvbDI7XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGNvbnRyb2wyKCB2YWx1ZTogVmVjdG9yMiApIHsgdGhpcy5zZXRDb250cm9sMiggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGNvbnRyb2wyKCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRDb250cm9sMigpOyB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBzZWNvbmQgY29udHJvbCBwb2ludCBvZiB0aGlzIEN1YmljLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDb250cm9sMigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLl9jb250cm9sMjtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBlbmQgcG9pbnQgb2YgdGhlIEN1YmljLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRFbmQoIGVuZDogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGVuZC5pc0Zpbml0ZSgpLCBgQ3ViaWMgZW5kIHNob3VsZCBiZSBmaW5pdGU6ICR7ZW5kLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgIGlmICggIXRoaXMuX2VuZC5lcXVhbHMoIGVuZCApICkge1xyXG4gICAgICB0aGlzLl9lbmQgPSBlbmQ7XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGVuZCggdmFsdWU6IFZlY3RvcjIgKSB7IHRoaXMuc2V0RW5kKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZW5kKCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRFbmQoKTsgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZW5kIG9mIHRoaXMgQ3ViaWMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEVuZCgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLl9lbmQ7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcG9zaXRpb24gcGFyYW1ldHJpY2FsbHksIHdpdGggMCA8PSB0IDw9IDEuXHJcbiAgICpcclxuICAgKiBOT1RFOiBwb3NpdGlvbkF0KCAwICkgd2lsbCByZXR1cm4gdGhlIHN0YXJ0IG9mIHRoZSBzZWdtZW50LCBhbmQgcG9zaXRpb25BdCggMSApIHdpbGwgcmV0dXJuIHRoZSBlbmQgb2YgdGhlXHJcbiAgICogc2VnbWVudC5cclxuICAgKlxyXG4gICAqIFRoaXMgbWV0aG9kIGlzIHBhcnQgb2YgdGhlIFNlZ21lbnQgQVBJLiBTZWUgU2VnbWVudC5qcydzIGNvbnN0cnVjdG9yIGZvciBtb3JlIEFQSSBkb2N1bWVudGF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwb3NpdGlvbkF0KCB0OiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0ID49IDAsICdwb3NpdGlvbkF0IHQgc2hvdWxkIGJlIG5vbi1uZWdhdGl2ZScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPD0gMSwgJ3Bvc2l0aW9uQXQgdCBzaG91bGQgYmUgbm8gZ3JlYXRlciB0aGFuIDEnICk7XHJcblxyXG4gICAgLy8gRXF1aXZhbGVudCBwb3NpdGlvbjogKDEgLSB0KV4zKnN0YXJ0ICsgMyooMSAtIHQpXjIqdCpjb250cm9sMSArIDMqKDEgLSB0KSB0XjIqY29udHJvbDIgKyB0XjMqZW5kXHJcbiAgICBjb25zdCBtdCA9IDEgLSB0O1xyXG4gICAgY29uc3QgbW1tID0gbXQgKiBtdCAqIG10O1xyXG4gICAgY29uc3QgbW10ID0gMyAqIG10ICogbXQgKiB0O1xyXG4gICAgY29uc3QgbXR0ID0gMyAqIG10ICogdCAqIHQ7XHJcbiAgICBjb25zdCB0dHQgPSB0ICogdCAqIHQ7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IyKFxyXG4gICAgICB0aGlzLl9zdGFydC54ICogbW1tICsgdGhpcy5fY29udHJvbDEueCAqIG1tdCArIHRoaXMuX2NvbnRyb2wyLnggKiBtdHQgKyB0aGlzLl9lbmQueCAqIHR0dCxcclxuICAgICAgdGhpcy5fc3RhcnQueSAqIG1tbSArIHRoaXMuX2NvbnRyb2wxLnkgKiBtbXQgKyB0aGlzLl9jb250cm9sMi55ICogbXR0ICsgdGhpcy5fZW5kLnkgKiB0dHRcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBub24tbm9ybWFsaXplZCB0YW5nZW50IChkeC9kdCwgZHkvZHQpIG9mIHRoaXMgc2VnbWVudCBhdCB0aGUgcGFyYW1ldHJpYyB2YWx1ZSBvZiB0LCB3aXRoIDAgPD0gdCA8PSAxLlxyXG4gICAqXHJcbiAgICogTk9URTogdGFuZ2VudEF0KCAwICkgd2lsbCByZXR1cm4gdGhlIHRhbmdlbnQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBzZWdtZW50LCBhbmQgdGFuZ2VudEF0KCAxICkgd2lsbCByZXR1cm4gdGhlXHJcbiAgICogdGFuZ2VudCBhdCB0aGUgZW5kIG9mIHRoZSBzZWdtZW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBtZXRob2QgaXMgcGFydCBvZiB0aGUgU2VnbWVudCBBUEkuIFNlZSBTZWdtZW50LmpzJ3MgY29uc3RydWN0b3IgZm9yIG1vcmUgQVBJIGRvY3VtZW50YXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHRhbmdlbnRBdCggdDogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA+PSAwLCAndGFuZ2VudEF0IHQgc2hvdWxkIGJlIG5vbi1uZWdhdGl2ZScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPD0gMSwgJ3RhbmdlbnRBdCB0IHNob3VsZCBiZSBubyBncmVhdGVyIHRoYW4gMScgKTtcclxuXHJcbiAgICAvLyBkZXJpdmF0aXZlOiAtMyBwMCAoMSAtIHQpXjIgKyAzIHAxICgxIC0gdCleMiAtIDYgcDEgKDEgLSB0KSB0ICsgNiBwMiAoMSAtIHQpIHQgLSAzIHAyIHReMiArIDMgcDMgdF4yXHJcbiAgICBjb25zdCBtdCA9IDEgLSB0O1xyXG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuICAgIHJldHVybiByZXN1bHQuc2V0KCB0aGlzLl9zdGFydCApLm11bHRpcGx5U2NhbGFyKCAtMyAqIG10ICogbXQgKVxyXG4gICAgICAuYWRkKCBzY3JhdGNoVmVjdG9yMS5zZXQoIHRoaXMuX2NvbnRyb2wxICkubXVsdGlwbHlTY2FsYXIoIDMgKiBtdCAqIG10IC0gNiAqIG10ICogdCApIClcclxuICAgICAgLmFkZCggc2NyYXRjaFZlY3RvcjEuc2V0KCB0aGlzLl9jb250cm9sMiApLm11bHRpcGx5U2NhbGFyKCA2ICogbXQgKiB0IC0gMyAqIHQgKiB0ICkgKVxyXG4gICAgICAuYWRkKCBzY3JhdGNoVmVjdG9yMS5zZXQoIHRoaXMuX2VuZCApLm11bHRpcGx5U2NhbGFyKCAzICogdCAqIHQgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc2lnbmVkIGN1cnZhdHVyZSBvZiB0aGUgc2VnbWVudCBhdCB0aGUgcGFyYW1ldHJpYyB2YWx1ZSB0LCB3aGVyZSAwIDw9IHQgPD0gMS5cclxuICAgKlxyXG4gICAqIFRoZSBjdXJ2YXR1cmUgd2lsbCBiZSBwb3NpdGl2ZSBmb3IgdmlzdWFsIGNsb2Nrd2lzZSAvIG1hdGhlbWF0aWNhbCBjb3VudGVyY2xvY2t3aXNlIGN1cnZlcywgbmVnYXRpdmUgZm9yIG9wcG9zaXRlXHJcbiAgICogY3VydmF0dXJlLCBhbmQgMCBmb3Igbm8gY3VydmF0dXJlLlxyXG4gICAqXHJcbiAgICogTk9URTogY3VydmF0dXJlQXQoIDAgKSB3aWxsIHJldHVybiB0aGUgY3VydmF0dXJlIGF0IHRoZSBzdGFydCBvZiB0aGUgc2VnbWVudCwgYW5kIGN1cnZhdHVyZUF0KCAxICkgd2lsbCByZXR1cm5cclxuICAgKiB0aGUgY3VydmF0dXJlIGF0IHRoZSBlbmQgb2YgdGhlIHNlZ21lbnQuXHJcbiAgICpcclxuICAgKiBUaGlzIG1ldGhvZCBpcyBwYXJ0IG9mIHRoZSBTZWdtZW50IEFQSS4gU2VlIFNlZ21lbnQuanMncyBjb25zdHJ1Y3RvciBmb3IgbW9yZSBBUEkgZG9jdW1lbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgY3VydmF0dXJlQXQoIHQ6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA+PSAwLCAnY3VydmF0dXJlQXQgdCBzaG91bGQgYmUgbm9uLW5lZ2F0aXZlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA8PSAxLCAnY3VydmF0dXJlQXQgdCBzaG91bGQgYmUgbm8gZ3JlYXRlciB0aGFuIDEnICk7XHJcblxyXG4gICAgLy8gc2VlIGh0dHA6Ly9jYWdkLmNzLmJ5dS5lZHUvfjU1Ny90ZXh0L2NoMi5wZGYgcDMxXHJcbiAgICAvLyBUT0RPOiByZW1vdmUgY29kZSBkdXBsaWNhdGlvbiB3aXRoIFF1YWRyYXRpYyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgIGNvbnN0IGVwc2lsb24gPSAwLjAwMDAwMDE7XHJcbiAgICBpZiAoIE1hdGguYWJzKCB0IC0gMC41ICkgPiAwLjUgLSBlcHNpbG9uICkge1xyXG4gICAgICBjb25zdCBpc1plcm8gPSB0IDwgMC41O1xyXG4gICAgICBjb25zdCBwMCA9IGlzWmVybyA/IHRoaXMuX3N0YXJ0IDogdGhpcy5fZW5kO1xyXG4gICAgICBjb25zdCBwMSA9IGlzWmVybyA/IHRoaXMuX2NvbnRyb2wxIDogdGhpcy5fY29udHJvbDI7XHJcbiAgICAgIGNvbnN0IHAyID0gaXNaZXJvID8gdGhpcy5fY29udHJvbDIgOiB0aGlzLl9jb250cm9sMTtcclxuICAgICAgY29uc3QgZDEwID0gcDEubWludXMoIHAwICk7XHJcbiAgICAgIGNvbnN0IGEgPSBkMTAubWFnbml0dWRlO1xyXG4gICAgICBjb25zdCBoID0gKCBpc1plcm8gPyAtMSA6IDEgKSAqIGQxMC5wZXJwZW5kaWN1bGFyLm5vcm1hbGl6ZWQoKS5kb3QoIHAyLm1pbnVzKCBwMSApICk7XHJcbiAgICAgIHJldHVybiAoIGggKiAoIHRoaXMuZGVncmVlIC0gMSApICkgLyAoIHRoaXMuZGVncmVlICogYSAqIGEgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdWJkaXZpZGVkKCB0IClbIDAgXS5jdXJ2YXR1cmVBdCggMSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSB3aXRoIHVwIHRvIDIgc3ViLXNlZ21lbnRzLCBzcGxpdCBhdCB0aGUgcGFyYW1ldHJpYyB0IHZhbHVlLiBUb2dldGhlciAoaW4gb3JkZXIpIHRoZXkgc2hvdWxkIG1ha2VcclxuICAgKiB1cCB0aGUgc2FtZSBzaGFwZSBhcyB0aGUgY3VycmVudCBzZWdtZW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBtZXRob2QgaXMgcGFydCBvZiB0aGUgU2VnbWVudCBBUEkuIFNlZSBTZWdtZW50LmpzJ3MgY29uc3RydWN0b3IgZm9yIG1vcmUgQVBJIGRvY3VtZW50YXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHN1YmRpdmlkZWQoIHQ6IG51bWJlciApOiBDdWJpY1tdIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPj0gMCwgJ3N1YmRpdmlkZWQgdCBzaG91bGQgYmUgbm9uLW5lZ2F0aXZlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA8PSAxLCAnc3ViZGl2aWRlZCB0IHNob3VsZCBiZSBubyBncmVhdGVyIHRoYW4gMScgKTtcclxuXHJcbiAgICAvLyBJZiB0IGlzIDAgb3IgMSwgd2Ugb25seSBuZWVkIHRvIHJldHVybiAxIHNlZ21lbnRcclxuICAgIGlmICggdCA9PT0gMCB8fCB0ID09PSAxICkge1xyXG4gICAgICByZXR1cm4gWyB0aGlzIF07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZGUgQ2FzdGVsamF1IG1ldGhvZFxyXG4gICAgLy8gVE9ETzogYWRkIGEgJ2Jpc2VjdCcgb3IgJ2JldHdlZW4nIG1ldGhvZCBmb3IgdmVjdG9ycz8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICBjb25zdCBsZWZ0ID0gdGhpcy5fc3RhcnQuYmxlbmQoIHRoaXMuX2NvbnRyb2wxLCB0ICk7XHJcbiAgICBjb25zdCByaWdodCA9IHRoaXMuX2NvbnRyb2wyLmJsZW5kKCB0aGlzLl9lbmQsIHQgKTtcclxuICAgIGNvbnN0IG1pZGRsZSA9IHRoaXMuX2NvbnRyb2wxLmJsZW5kKCB0aGlzLl9jb250cm9sMiwgdCApO1xyXG4gICAgY29uc3QgbGVmdE1pZCA9IGxlZnQuYmxlbmQoIG1pZGRsZSwgdCApO1xyXG4gICAgY29uc3QgcmlnaHRNaWQgPSBtaWRkbGUuYmxlbmQoIHJpZ2h0LCB0ICk7XHJcbiAgICBjb25zdCBtaWQgPSBsZWZ0TWlkLmJsZW5kKCByaWdodE1pZCwgdCApO1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgbmV3IEN1YmljKCB0aGlzLl9zdGFydCwgbGVmdCwgbGVmdE1pZCwgbWlkICksXHJcbiAgICAgIG5ldyBDdWJpYyggbWlkLCByaWdodE1pZCwgcmlnaHQsIHRoaXMuX2VuZCApXHJcbiAgICBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xlYXJzIGNhY2hlZCBpbmZvcm1hdGlvbiwgc2hvdWxkIGJlIGNhbGxlZCB3aGVuIGFueSBvZiB0aGUgJ2NvbnN0cnVjdG9yIGFyZ3VtZW50cycgYXJlIG11dGF0ZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGludmFsaWRhdGUoKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9zdGFydCBpbnN0YW5jZW9mIFZlY3RvcjIsIGBDdWJpYyBzdGFydCBzaG91bGQgYmUgYSBWZWN0b3IyOiAke3RoaXMuX3N0YXJ0fWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3N0YXJ0LmlzRmluaXRlKCksIGBDdWJpYyBzdGFydCBzaG91bGQgYmUgZmluaXRlOiAke3RoaXMuX3N0YXJ0LnRvU3RyaW5nKCl9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fY29udHJvbDEgaW5zdGFuY2VvZiBWZWN0b3IyLCBgQ3ViaWMgY29udHJvbDEgc2hvdWxkIGJlIGEgVmVjdG9yMjogJHt0aGlzLl9jb250cm9sMX1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9jb250cm9sMS5pc0Zpbml0ZSgpLCBgQ3ViaWMgY29udHJvbDEgc2hvdWxkIGJlIGZpbml0ZTogJHt0aGlzLl9jb250cm9sMS50b1N0cmluZygpfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2NvbnRyb2wyIGluc3RhbmNlb2YgVmVjdG9yMiwgYEN1YmljIGNvbnRyb2wyIHNob3VsZCBiZSBhIFZlY3RvcjI6ICR7dGhpcy5fY29udHJvbDJ9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fY29udHJvbDIuaXNGaW5pdGUoKSwgYEN1YmljIGNvbnRyb2wyIHNob3VsZCBiZSBmaW5pdGU6ICR7dGhpcy5fY29udHJvbDIudG9TdHJpbmcoKX1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9lbmQgaW5zdGFuY2VvZiBWZWN0b3IyLCBgQ3ViaWMgZW5kIHNob3VsZCBiZSBhIFZlY3RvcjI6ICR7dGhpcy5fZW5kfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2VuZC5pc0Zpbml0ZSgpLCBgQ3ViaWMgZW5kIHNob3VsZCBiZSBmaW5pdGU6ICR7dGhpcy5fZW5kLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgIC8vIExhemlseS1jb21wdXRlZCBkZXJpdmVkIGluZm9ybWF0aW9uXHJcbiAgICB0aGlzLl9zdGFydFRhbmdlbnQgPSBudWxsO1xyXG4gICAgdGhpcy5fZW5kVGFuZ2VudCA9IG51bGw7XHJcbiAgICB0aGlzLl9yID0gbnVsbDtcclxuICAgIHRoaXMuX3MgPSBudWxsO1xyXG5cclxuICAgIC8vIEN1c3Atc3BlY2lmaWMgaW5mb3JtYXRpb25cclxuICAgIHRoaXMuX3RDdXNwID0gbnVsbDtcclxuICAgIHRoaXMuX3REZXRlcm1pbmFudCA9IG51bGw7XHJcbiAgICB0aGlzLl90SW5mbGVjdGlvbjEgPSBudWxsO1xyXG4gICAgdGhpcy5fdEluZmxlY3Rpb24yID0gbnVsbDtcclxuICAgIHRoaXMuX3F1YWRyYXRpY3MgPSBudWxsO1xyXG5cclxuICAgIC8vIFQtdmFsdWVzIHdoZXJlIFggYW5kIFkgKHJlc3BlY3RpdmVseSkgcmVhY2ggYW4gZXh0cmVtYSAobm90IG5lY2Vzc2FyaWx5IGluY2x1ZGluZyAwIGFuZCAxKVxyXG4gICAgdGhpcy5feEV4dHJlbWFUID0gbnVsbDtcclxuICAgIHRoaXMuX3lFeHRyZW1hVCA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5fYm91bmRzID0gbnVsbDtcclxuICAgIHRoaXMuX3N2Z1BhdGhGcmFnbWVudCA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5pbnZhbGlkYXRpb25FbWl0dGVyLmVtaXQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIHN0YXJ0IHBvc2l0aW9uIG9mIHRoaXMgY3ViaWMgcG9seW5vbWlhbC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U3RhcnRUYW5nZW50KCk6IFZlY3RvcjIge1xyXG4gICAgaWYgKCB0aGlzLl9zdGFydFRhbmdlbnQgPT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMuX3N0YXJ0VGFuZ2VudCA9IHRoaXMudGFuZ2VudEF0KCAwICkubm9ybWFsaXplZCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX3N0YXJ0VGFuZ2VudDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc3RhcnRUYW5nZW50KCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRTdGFydFRhbmdlbnQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBlbmQgcG9zaXRpb24gb2YgdGhpcyBjdWJpYyBwb2x5bm9taWFsLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFbmRUYW5nZW50KCk6IFZlY3RvcjIge1xyXG4gICAgaWYgKCB0aGlzLl9lbmRUYW5nZW50ID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLl9lbmRUYW5nZW50ID0gdGhpcy50YW5nZW50QXQoIDEgKS5ub3JtYWxpemVkKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fZW5kVGFuZ2VudDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZW5kVGFuZ2VudCgpOiBWZWN0b3IyIHsgcmV0dXJuIHRoaXMuZ2V0RW5kVGFuZ2VudCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRPRE86IGRvY3VtZW50YXRpb24gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICovXHJcbiAgcHVibGljIGdldFIoKTogVmVjdG9yMiB7XHJcbiAgICAvLyBmcm9tIGh0dHA6Ly93d3cuY2lzLnVzb3V0aGFsLmVkdS9+aGFpbi9nZW5lcmFsL1B1YmxpY2F0aW9ucy9CZXppZXIvQmV6aWVyRmxhdHRlbmluZy5wZGZcclxuICAgIGlmICggdGhpcy5fciA9PT0gbnVsbCApIHtcclxuICAgICAgdGhpcy5fciA9IHRoaXMuX2NvbnRyb2wxLm1pbnVzKCB0aGlzLl9zdGFydCApLm5vcm1hbGl6ZWQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9yO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCByKCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRSKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogVE9ETzogZG9jdW1lbnRhdGlvbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UygpOiBWZWN0b3IyIHtcclxuICAgIC8vIGZyb20gaHR0cDovL3d3dy5jaXMudXNvdXRoYWwuZWR1L35oYWluL2dlbmVyYWwvUHVibGljYXRpb25zL0Jlemllci9CZXppZXJGbGF0dGVuaW5nLnBkZlxyXG4gICAgaWYgKCB0aGlzLl9zID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLl9zID0gdGhpcy5nZXRSKCkucGVycGVuZGljdWxhcjtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9zO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBzKCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRTKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcGFyYW1ldHJpYyB0IHZhbHVlIGZvciB0aGUgcG9zc2libGUgY3VzcCBsb2NhdGlvbi4gQSBjdXNwIG1heSBvciBtYXkgbm90IGV4aXN0IGF0IHRoYXQgcG9pbnQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFRDdXNwKCk6IG51bWJlciB7XHJcbiAgICBpZiAoIHRoaXMuX3RDdXNwID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLmNvbXB1dGVDdXNwSW5mbygpO1xyXG4gICAgfVxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fdEN1c3AgIT09IG51bGwgKTtcclxuICAgIHJldHVybiB0aGlzLl90Q3VzcCE7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHRDdXNwKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFRDdXNwKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZGV0ZXJtaW5hbnQgdmFsdWUgZm9yIHRoZSBjdXNwLCB3aGljaCBpbmRpY2F0ZXMgdGhlIHByZXNlbmNlIChvciBsYWNrIG9mIHByZXNlbmNlKSBvZiBhIGN1c3AuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFREZXRlcm1pbmFudCgpOiBudW1iZXIge1xyXG4gICAgaWYgKCB0aGlzLl90RGV0ZXJtaW5hbnQgPT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMuY29tcHV0ZUN1c3BJbmZvKCk7XHJcbiAgICB9XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl90RGV0ZXJtaW5hbnQgIT09IG51bGwgKTtcclxuICAgIHJldHVybiB0aGlzLl90RGV0ZXJtaW5hbnQhO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB0RGV0ZXJtaW5hbnQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0VERldGVybWluYW50KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcGFyYW1ldHJpYyB0IHZhbHVlIGZvciB0aGUgcG90ZW50aWFsIGxvY2F0aW9uIG9mIHRoZSBmaXJzdCBwb3NzaWJsZSBpbmZsZWN0aW9uIHBvaW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRUSW5mbGVjdGlvbjEoKTogbnVtYmVyIHtcclxuICAgIGlmICggdGhpcy5fdEluZmxlY3Rpb24xID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLmNvbXB1dGVDdXNwSW5mbygpO1xyXG4gICAgfVxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fdEluZmxlY3Rpb24xICE9PSBudWxsICk7XHJcbiAgICByZXR1cm4gdGhpcy5fdEluZmxlY3Rpb24xITtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgdEluZmxlY3Rpb24xKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFRJbmZsZWN0aW9uMSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHBhcmFtZXRyaWMgdCB2YWx1ZSBmb3IgdGhlIHBvdGVudGlhbCBsb2NhdGlvbiBvZiB0aGUgc2Vjb25kIHBvc3NpYmxlIGluZmxlY3Rpb24gcG9pbnQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFRJbmZsZWN0aW9uMigpOiBudW1iZXIge1xyXG4gICAgaWYgKCB0aGlzLl90SW5mbGVjdGlvbjIgPT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMuY29tcHV0ZUN1c3BJbmZvKCk7XHJcbiAgICB9XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl90SW5mbGVjdGlvbjIgIT09IG51bGwgKTtcclxuICAgIHJldHVybiB0aGlzLl90SW5mbGVjdGlvbjIhO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB0SW5mbGVjdGlvbjIoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0VEluZmxlY3Rpb24yKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogSWYgdGhlcmUgaXMgYSBjdXNwLCB0aGlzIGN1YmljIHdpbGwgY29uc2lzdCBvZiBvbmUgb3IgdHdvIHF1YWRyYXRpYyBzZWdtZW50cywgdHlwaWNhbGx5IFwic3RhcnQgPT4gY3VzcFwiIGFuZFxyXG4gICAqIFwiY3VzcCA9PiBlbmRcIi5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UXVhZHJhdGljcygpOiBRdWFkcmF0aWNbXSB8IG51bGwge1xyXG4gICAgaWYgKCB0aGlzLl9xdWFkcmF0aWNzID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLmNvbXB1dGVDdXNwU2VnbWVudHMoKTtcclxuICAgIH1cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3F1YWRyYXRpY3MgIT09IG51bGwgKTtcclxuICAgIHJldHVybiB0aGlzLl9xdWFkcmF0aWNzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGxpc3Qgb2YgcGFyYW1ldHJpYyB0IHZhbHVlcyB3aGVyZSB4LWV4dHJlbWEgZXhpc3QsIGkuZS4gd2hlcmUgZHgvZHQ9PTAuIFRoZXNlIGFyZSBjYW5kaWRhdGUgbG9jYXRpb25zXHJcbiAgICogb24gdGhlIGN1YmljIGZvciBcIm1heGltdW0gWFwiIGFuZCBcIm1pbmltdW0gWFwiLCBhbmQgYXJlIG5lZWRlZCBmb3IgYm91bmRzIGNvbXB1dGF0aW9ucy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0WEV4dHJlbWFUKCk6IG51bWJlcltdIHtcclxuICAgIGlmICggdGhpcy5feEV4dHJlbWFUID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLl94RXh0cmVtYVQgPSBDdWJpYy5leHRyZW1hVCggdGhpcy5fc3RhcnQueCwgdGhpcy5fY29udHJvbDEueCwgdGhpcy5fY29udHJvbDIueCwgdGhpcy5fZW5kLnggKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl94RXh0cmVtYVQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHhFeHRyZW1hVCgpOiBudW1iZXJbXSB7IHJldHVybiB0aGlzLmdldFhFeHRyZW1hVCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBsaXN0IG9mIHBhcmFtZXRyaWMgdCB2YWx1ZXMgd2hlcmUgeS1leHRyZW1hIGV4aXN0LCBpLmUuIHdoZXJlIGR5L2R0PT0wLiBUaGVzZSBhcmUgY2FuZGlkYXRlIGxvY2F0aW9uc1xyXG4gICAqIG9uIHRoZSBjdWJpYyBmb3IgXCJtYXhpbXVtIFlcIiBhbmQgXCJtaW5pbXVtIFlcIiwgYW5kIGFyZSBuZWVkZWQgZm9yIGJvdW5kcyBjb21wdXRhdGlvbnMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFlFeHRyZW1hVCgpOiBudW1iZXJbXSB7XHJcbiAgICBpZiAoIHRoaXMuX3lFeHRyZW1hVCA9PT0gbnVsbCApIHtcclxuICAgICAgdGhpcy5feUV4dHJlbWFUID0gQ3ViaWMuZXh0cmVtYVQoIHRoaXMuX3N0YXJ0LnksIHRoaXMuX2NvbnRyb2wxLnksIHRoaXMuX2NvbnRyb2wyLnksIHRoaXMuX2VuZC55ICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5feUV4dHJlbWFUO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB5RXh0cmVtYVQoKTogbnVtYmVyW10geyByZXR1cm4gdGhpcy5nZXRZRXh0cmVtYVQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBib3VuZHMgb2YgdGhpcyBzZWdtZW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICBpZiAoIHRoaXMuX2JvdW5kcyA9PT0gbnVsbCApIHtcclxuICAgICAgdGhpcy5fYm91bmRzID0gQm91bmRzMi5OT1RISU5HO1xyXG4gICAgICB0aGlzLl9ib3VuZHMgPSB0aGlzLl9ib3VuZHMud2l0aFBvaW50KCB0aGlzLl9zdGFydCApO1xyXG4gICAgICB0aGlzLl9ib3VuZHMgPSB0aGlzLl9ib3VuZHMud2l0aFBvaW50KCB0aGlzLl9lbmQgKTtcclxuXHJcbiAgICAgIF8uZWFjaCggdGhpcy5nZXRYRXh0cmVtYVQoKSwgdCA9PiB7XHJcbiAgICAgICAgaWYgKCB0ID49IDAgJiYgdCA8PSAxICkge1xyXG4gICAgICAgICAgdGhpcy5fYm91bmRzID0gdGhpcy5fYm91bmRzIS53aXRoUG9pbnQoIHRoaXMucG9zaXRpb25BdCggdCApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICAgIF8uZWFjaCggdGhpcy5nZXRZRXh0cmVtYVQoKSwgdCA9PiB7XHJcbiAgICAgICAgaWYgKCB0ID49IDAgJiYgdCA8PSAxICkge1xyXG4gICAgICAgICAgdGhpcy5fYm91bmRzID0gdGhpcy5fYm91bmRzIS53aXRoUG9pbnQoIHRoaXMucG9zaXRpb25BdCggdCApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuaGFzQ3VzcCgpICkge1xyXG4gICAgICAgIHRoaXMuX2JvdW5kcyA9IHRoaXMuX2JvdW5kcy53aXRoUG9pbnQoIHRoaXMucG9zaXRpb25BdCggdGhpcy5nZXRUQ3VzcCgpICkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX2JvdW5kcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgYm91bmRzKCk6IEJvdW5kczIgeyByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlcyBhbGwgY3VzcC1yZWxhdGVkIGluZm9ybWF0aW9uLCBpbmNsdWRpbmcgd2hldGhlciB0aGVyZSBpcyBhIGN1c3AsIGFueSBpbmZsZWN0aW9uIHBvaW50cywgZXRjLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgY29tcHV0ZUN1c3BJbmZvKCk6IHZvaWQge1xyXG4gICAgLy8gZnJvbSBodHRwOi8vd3d3LmNpcy51c291dGhhbC5lZHUvfmhhaW4vZ2VuZXJhbC9QdWJsaWNhdGlvbnMvQmV6aWVyL0JlemllckZsYXR0ZW5pbmcucGRmXHJcbiAgICAvLyBUT0RPOiBhbGxvY2F0aW9uIHJlZHVjdGlvbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgIGNvbnN0IGEgPSB0aGlzLl9zdGFydC50aW1lcyggLTEgKS5wbHVzKCB0aGlzLl9jb250cm9sMS50aW1lcyggMyApICkucGx1cyggdGhpcy5fY29udHJvbDIudGltZXMoIC0zICkgKS5wbHVzKCB0aGlzLl9lbmQgKTtcclxuICAgIGNvbnN0IGIgPSB0aGlzLl9zdGFydC50aW1lcyggMyApLnBsdXMoIHRoaXMuX2NvbnRyb2wxLnRpbWVzKCAtNiApICkucGx1cyggdGhpcy5fY29udHJvbDIudGltZXMoIDMgKSApO1xyXG4gICAgY29uc3QgYyA9IHRoaXMuX3N0YXJ0LnRpbWVzKCAtMyApLnBsdXMoIHRoaXMuX2NvbnRyb2wxLnRpbWVzKCAzICkgKTtcclxuXHJcbiAgICBjb25zdCBhUGVycCA9IGEucGVycGVuZGljdWxhcjsgLy8ge1ZlY3RvcjJ9XHJcbiAgICBjb25zdCBiUGVycCA9IGIucGVycGVuZGljdWxhcjsgLy8ge1ZlY3RvcjJ9XHJcbiAgICBjb25zdCBhUGVycERvdEIgPSBhUGVycC5kb3QoIGIgKTsgLy8ge251bWJlcn1cclxuXHJcbiAgICB0aGlzLl90Q3VzcCA9IC0wLjUgKiAoIGFQZXJwLmRvdCggYyApIC8gYVBlcnBEb3RCICk7IC8vIHtudW1iZXJ9XHJcbiAgICB0aGlzLl90RGV0ZXJtaW5hbnQgPSB0aGlzLl90Q3VzcCAqIHRoaXMuX3RDdXNwIC0gKCAxIC8gMyApICogKCBiUGVycC5kb3QoIGMgKSAvIGFQZXJwRG90QiApOyAvLyB7bnVtYmVyfVxyXG4gICAgaWYgKCB0aGlzLl90RGV0ZXJtaW5hbnQgPj0gMCApIHtcclxuICAgICAgY29uc3Qgc3FydERldCA9IE1hdGguc3FydCggdGhpcy5fdERldGVybWluYW50ICk7XHJcbiAgICAgIHRoaXMuX3RJbmZsZWN0aW9uMSA9IHRoaXMuX3RDdXNwIC0gc3FydERldDtcclxuICAgICAgdGhpcy5fdEluZmxlY3Rpb24yID0gdGhpcy5fdEN1c3AgKyBzcXJ0RGV0O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIHRoZXJlIGFyZSBubyByZWFsIHJvb3RzIHRvIHRoZSBxdWFkcmF0aWMgcG9seW5vbWlhbC5cclxuICAgICAgdGhpcy5fdEluZmxlY3Rpb24xID0gTmFOO1xyXG4gICAgICB0aGlzLl90SW5mbGVjdGlvbjIgPSBOYU47XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJZiB0aGVyZSBpcyBhIGN1c3AsIHRoaXMgY29tcHV0ZXMgdGhlIDIgcXVhZHJhdGljIEJlemllciBjdXJ2ZXMgdGhhdCB0aGlzIEN1YmljIGNhbiBiZSBjb252ZXJ0ZWQgaW50by5cclxuICAgKi9cclxuICBwcml2YXRlIGNvbXB1dGVDdXNwU2VnbWVudHMoKTogdm9pZCB7XHJcbiAgICBpZiAoIHRoaXMuaGFzQ3VzcCgpICkge1xyXG4gICAgICAvLyBpZiB0aGVyZSBpcyBhIGN1c3AsIHdlJ2xsIHNwbGl0IGF0IHRoZSBjdXNwIGludG8gdHdvIHF1YWRyYXRpYyBiZXppZXIgY3VydmVzLlxyXG4gICAgICAvLyBzZWUgaHR0cDovL2NpdGVzZWVyeC5pc3QucHN1LmVkdS92aWV3ZG9jL2Rvd25sb2FkP2RvaT0xMC4xLjEuOTQuODA4OCZyZXA9cmVwMSZ0eXBlPXBkZiAoU2luZ3VsYXJpdGllcyBvZiByYXRpb25hbCBCZXppZXIgY3VydmVzIC0gSiBNb250ZXJkZSwgMjAwMSlcclxuICAgICAgdGhpcy5fcXVhZHJhdGljcyA9IFtdO1xyXG4gICAgICBjb25zdCB0Q3VzcCA9IHRoaXMuZ2V0VEN1c3AoKTtcclxuICAgICAgaWYgKCB0Q3VzcCA9PT0gMCApIHtcclxuICAgICAgICB0aGlzLl9xdWFkcmF0aWNzLnB1c2goIG5ldyBRdWFkcmF0aWMoIHRoaXMuc3RhcnQsIHRoaXMuY29udHJvbDIsIHRoaXMuZW5kICkgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggdEN1c3AgPT09IDEgKSB7XHJcbiAgICAgICAgdGhpcy5fcXVhZHJhdGljcy5wdXNoKCBuZXcgUXVhZHJhdGljKCB0aGlzLnN0YXJ0LCB0aGlzLmNvbnRyb2wxLCB0aGlzLmVuZCApICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgY29uc3Qgc3ViZGl2aWRlZEF0Q3VzcCA9IHRoaXMuc3ViZGl2aWRlZCggdEN1c3AgKTtcclxuICAgICAgICB0aGlzLl9xdWFkcmF0aWNzLnB1c2goIG5ldyBRdWFkcmF0aWMoIHN1YmRpdmlkZWRBdEN1c3BbIDAgXS5zdGFydCwgc3ViZGl2aWRlZEF0Q3VzcFsgMCBdLmNvbnRyb2wxLCBzdWJkaXZpZGVkQXRDdXNwWyAwIF0uZW5kICkgKTtcclxuICAgICAgICB0aGlzLl9xdWFkcmF0aWNzLnB1c2goIG5ldyBRdWFkcmF0aWMoIHN1YmRpdmlkZWRBdEN1c3BbIDEgXS5zdGFydCwgc3ViZGl2aWRlZEF0Q3VzcFsgMSBdLmNvbnRyb2wyLCBzdWJkaXZpZGVkQXRDdXNwWyAxIF0uZW5kICkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMuX3F1YWRyYXRpY3MgPSBudWxsO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGxpc3Qgb2Ygbm9uLWRlZ2VuZXJhdGUgc2VnbWVudHMgdGhhdCBhcmUgZXF1aXZhbGVudCB0byB0aGlzIHNlZ21lbnQuIEdlbmVyYWxseSBnZXRzIHJpZCAob3Igc2ltcGxpZmllcylcclxuICAgKiBpbnZhbGlkIG9yIHJlcGVhdGVkIHNlZ21lbnRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXROb25kZWdlbmVyYXRlU2VnbWVudHMoKTogU2VnbWVudFtdIHtcclxuICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5fc3RhcnQ7XHJcbiAgICBjb25zdCBjb250cm9sMSA9IHRoaXMuX2NvbnRyb2wxO1xyXG4gICAgY29uc3QgY29udHJvbDIgPSB0aGlzLl9jb250cm9sMjtcclxuICAgIGNvbnN0IGVuZCA9IHRoaXMuX2VuZDtcclxuXHJcbiAgICBjb25zdCByZWR1Y2VkID0gdGhpcy5kZWdyZWVSZWR1Y2VkKCAxZS05ICk7XHJcblxyXG4gICAgaWYgKCBzdGFydC5lcXVhbHMoIGVuZCApICYmIHN0YXJ0LmVxdWFscyggY29udHJvbDEgKSAmJiBzdGFydC5lcXVhbHMoIGNvbnRyb2wyICkgKSB7XHJcbiAgICAgIC8vIGRlZ2VuZXJhdGUgcG9pbnRcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMuaGFzQ3VzcCgpICkge1xyXG4gICAgICByZXR1cm4gXy5mbGF0dGVuKCB0aGlzLmdldFF1YWRyYXRpY3MoKSEubWFwKCBxdWFkcmF0aWMgPT4gcXVhZHJhdGljLmdldE5vbmRlZ2VuZXJhdGVTZWdtZW50cygpICkgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCByZWR1Y2VkICkge1xyXG4gICAgICAvLyBpZiB3ZSBjYW4gcmVkdWNlIHRvIGEgcXVhZHJhdGljIEJlemllciwgYWx3YXlzIGRvIHRoaXMgKGFuZCBtYWtlIHN1cmUgaXQgaXMgbm9uLWRlZ2VuZXJhdGUpXHJcbiAgICAgIHJldHVybiByZWR1Y2VkLmdldE5vbmRlZ2VuZXJhdGVTZWdtZW50cygpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGFyZVBvaW50c0NvbGxpbmVhciggc3RhcnQsIGNvbnRyb2wxLCBlbmQgKSAmJiBhcmVQb2ludHNDb2xsaW5lYXIoIHN0YXJ0LCBjb250cm9sMiwgZW5kICkgJiYgIXN0YXJ0LmVxdWFsc0Vwc2lsb24oIGVuZCwgMWUtNyApICkge1xyXG4gICAgICBjb25zdCBleHRyZW1hUG9pbnRzID0gdGhpcy5nZXRYRXh0cmVtYVQoKS5jb25jYXQoIHRoaXMuZ2V0WUV4dHJlbWFUKCkgKS5zb3J0KCkubWFwKCB0ID0+IHRoaXMucG9zaXRpb25BdCggdCApICk7XHJcblxyXG4gICAgICBjb25zdCBzZWdtZW50cyA9IFtdO1xyXG4gICAgICBsZXQgbGFzdFBvaW50ID0gc3RhcnQ7XHJcbiAgICAgIGlmICggZXh0cmVtYVBvaW50cy5sZW5ndGggKSB7XHJcbiAgICAgICAgc2VnbWVudHMucHVzaCggbmV3IExpbmUoIHN0YXJ0LCBleHRyZW1hUG9pbnRzWyAwIF0gKSApO1xyXG4gICAgICAgIGxhc3RQb2ludCA9IGV4dHJlbWFQb2ludHNbIDAgXTtcclxuICAgICAgfVxyXG4gICAgICBmb3IgKCBsZXQgaSA9IDE7IGkgPCBleHRyZW1hUG9pbnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIHNlZ21lbnRzLnB1c2goIG5ldyBMaW5lKCBleHRyZW1hUG9pbnRzWyBpIC0gMSBdLCBleHRyZW1hUG9pbnRzWyBpIF0gKSApO1xyXG4gICAgICAgIGxhc3RQb2ludCA9IGV4dHJlbWFQb2ludHNbIGkgXTtcclxuICAgICAgfVxyXG4gICAgICBzZWdtZW50cy5wdXNoKCBuZXcgTGluZSggbGFzdFBvaW50LCBlbmQgKSApO1xyXG5cclxuICAgICAgcmV0dXJuIF8uZmxhdHRlbiggc2VnbWVudHMubWFwKCBzZWdtZW50ID0+IHNlZ21lbnQuZ2V0Tm9uZGVnZW5lcmF0ZVNlZ21lbnRzKCkgKSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBbIHRoaXMgXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGlzIGN1YmljIGhhcyBhIGN1c3AuXHJcbiAgICovXHJcbiAgcHVibGljIGhhc0N1c3AoKTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCB0Q3VzcCA9IHRoaXMuZ2V0VEN1c3AoKTtcclxuXHJcbiAgICBjb25zdCBlcHNpbG9uID0gMWUtNzsgLy8gVE9ETzogbWFrZSB0aGlzIGF2YWlsYWJsZSB0byBjaGFuZ2U/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgcmV0dXJuIHRDdXNwID49IDAgJiYgdEN1c3AgPD0gMSAmJiB0aGlzLnRhbmdlbnRBdCggdEN1c3AgKS5tYWduaXR1ZGUgPCBlcHNpbG9uO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHRvUlMoIHBvaW50OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgY29uc3QgZmlyc3RWZWN0b3IgPSBwb2ludC5taW51cyggdGhpcy5fc3RhcnQgKTtcclxuICAgIHJldHVybiBuZXcgVmVjdG9yMiggZmlyc3RWZWN0b3IuZG90KCB0aGlzLmdldFIoKSApLCBmaXJzdFZlY3Rvci5kb3QoIHRoaXMuZ2V0UygpICkgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvZmZzZXRUbyggcjogbnVtYmVyLCByZXZlcnNlOiBib29sZWFuICk6IExpbmVbXSB7XHJcbiAgICAvLyBUT0RPOiBpbXBsZW1lbnQgbW9yZSBhY2N1cmF0ZSBtZXRob2QgYXQgaHR0cDovL3d3dy5hbnRpZ3JhaW4uY29tL3Jlc2VhcmNoL2FkYXB0aXZlX2Jlemllci9pbmRleC5odG1sIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgLy8gVE9ETzogb3IgbW9yZSByZWNlbnRseSAoYW5kIHJlbGV2YW50bHkpOiBodHRwOi8vd3d3LmNpcy51c291dGhhbC5lZHUvfmhhaW4vZ2VuZXJhbC9QdWJsaWNhdGlvbnMvQmV6aWVyL0JlemllckZsYXR0ZW5pbmcucGRmIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG5cclxuICAgIC8vIGhvdyBtYW55IHNlZ21lbnRzIHRvIGNyZWF0ZSAocG9zc2libHkgbWFrZSB0aGlzIG1vcmUgYWRhcHRpdmU/KVxyXG4gICAgY29uc3QgcXVhbnRpdHkgPSAzMjtcclxuXHJcbiAgICBjb25zdCBwb2ludHMgPSBbXTtcclxuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgcXVhbnRpdHk7IGkrKyApIHtcclxuICAgICAgbGV0IHQgPSBpIC8gKCBxdWFudGl0eSAtIDEgKTtcclxuICAgICAgaWYgKCByZXZlcnNlICkge1xyXG4gICAgICAgIHQgPSAxIC0gdDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcG9pbnRzLnB1c2goIHRoaXMucG9zaXRpb25BdCggdCApLnBsdXMoIHRoaXMudGFuZ2VudEF0KCB0ICkucGVycGVuZGljdWxhci5ub3JtYWxpemVkKCkudGltZXMoIHIgKSApICk7XHJcbiAgICAgIGlmICggaSA+IDAgKSB7XHJcbiAgICAgICAgcmVzdWx0LnB1c2goIG5ldyBMaW5lKCBwb2ludHNbIGkgLSAxIF0sIHBvaW50c1sgaSBdICkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIFNWRyBwYXRoLiBhc3N1bWVzIHRoYXQgdGhlIHN0YXJ0IHBvaW50IGlzIGFscmVhZHkgcHJvdmlkZWQsIHNvIGFueXRoaW5nIHRoYXQgY2FsbHMgdGhpcyBuZWVkcyB0byBwdXRcclxuICAgKiB0aGUgTSBjYWxscyBmaXJzdFxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTVkdQYXRoRnJhZ21lbnQoKTogc3RyaW5nIHtcclxuICAgIGxldCBvbGRQYXRoRnJhZ21lbnQ7XHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgb2xkUGF0aEZyYWdtZW50ID0gdGhpcy5fc3ZnUGF0aEZyYWdtZW50O1xyXG4gICAgICB0aGlzLl9zdmdQYXRoRnJhZ21lbnQgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgaWYgKCAhdGhpcy5fc3ZnUGF0aEZyYWdtZW50ICkge1xyXG4gICAgICB0aGlzLl9zdmdQYXRoRnJhZ21lbnQgPSBgQyAke3N2Z051bWJlciggdGhpcy5fY29udHJvbDEueCApfSAke3N2Z051bWJlciggdGhpcy5fY29udHJvbDEueSApfSAke1xyXG4gICAgICAgIHN2Z051bWJlciggdGhpcy5fY29udHJvbDIueCApfSAke3N2Z051bWJlciggdGhpcy5fY29udHJvbDIueSApfSAke1xyXG4gICAgICAgIHN2Z051bWJlciggdGhpcy5fZW5kLnggKX0gJHtzdmdOdW1iZXIoIHRoaXMuX2VuZC55ICl9YDtcclxuICAgIH1cclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICBpZiAoIG9sZFBhdGhGcmFnbWVudCApIHtcclxuICAgICAgICBhc3NlcnQoIG9sZFBhdGhGcmFnbWVudCA9PT0gdGhpcy5fc3ZnUGF0aEZyYWdtZW50LCAnUXVhZHJhdGljIGxpbmUgc2VnbWVudCBjaGFuZ2VkIHdpdGhvdXQgaW52YWxpZGF0ZSgpJyApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fc3ZnUGF0aEZyYWdtZW50O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBsaW5lcyB0aGF0IHdpbGwgZHJhdyBhbiBvZmZzZXQgY3VydmUgb24gdGhlIGxvZ2ljYWwgbGVmdCBzaWRlXHJcbiAgICovXHJcbiAgcHVibGljIHN0cm9rZUxlZnQoIGxpbmVXaWR0aDogbnVtYmVyICk6IExpbmVbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5vZmZzZXRUbyggLWxpbmVXaWR0aCAvIDIsIGZhbHNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGxpbmVzIHRoYXQgd2lsbCBkcmF3IGFuIG9mZnNldCBjdXJ2ZSBvbiB0aGUgbG9naWNhbCByaWdodCBzaWRlXHJcbiAgICovXHJcbiAgcHVibGljIHN0cm9rZVJpZ2h0KCBsaW5lV2lkdGg6IG51bWJlciApOiBMaW5lW10ge1xyXG4gICAgcmV0dXJuIHRoaXMub2Zmc2V0VG8oIGxpbmVXaWR0aCAvIDIsIHRydWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBsaXN0IG9mIHQgdmFsdWVzIHdoZXJlIGR4L2R0IG9yIGR5L2R0IGlzIDAgd2hlcmUgMCA8IHQgPCAxLiBzdWJkaXZpZGluZyBvbiB0aGVzZSB3aWxsIHJlc3VsdCBpbiBtb25vdG9uaWMgc2VnbWVudHNcclxuICAgKiBUaGUgbGlzdCBkb2VzIG5vdCBpbmNsdWRlIHQ9MCBhbmQgdD0xXHJcbiAgICovXHJcbiAgcHVibGljIGdldEludGVyaW9yRXh0cmVtYVRzKCk6IG51bWJlcltdIHtcclxuICAgIGNvbnN0IHRzID0gdGhpcy5nZXRYRXh0cmVtYVQoKS5jb25jYXQoIHRoaXMuZ2V0WUV4dHJlbWFUKCkgKTtcclxuICAgIGNvbnN0IHJlc3VsdDogbnVtYmVyW10gPSBbXTtcclxuICAgIF8uZWFjaCggdHMsIHQgPT4ge1xyXG4gICAgICBjb25zdCBlcHNpbG9uID0gMC4wMDAwMDAwMDAxOyAvLyBUT0RPOiBnZW5lcmFsIGtpdGUgZXBzaWxvbj8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICAgIGlmICggdCA+IGVwc2lsb24gJiYgdCA8IDEgLSBlcHNpbG9uICkge1xyXG4gICAgICAgIC8vIGRvbid0IGFkZCBkdXBsaWNhdGUgdCB2YWx1ZXNcclxuICAgICAgICBpZiAoIF8uZXZlcnkoIHJlc3VsdCwgb3RoZXJUID0+IE1hdGguYWJzKCB0IC0gb3RoZXJUICkgPiBlcHNpbG9uICkgKSB7XHJcbiAgICAgICAgICByZXN1bHQucHVzaCggdCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgcmV0dXJuIHJlc3VsdC5zb3J0KCk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogSGl0LXRlc3RzIHRoaXMgc2VnbWVudCB3aXRoIHRoZSByYXkuIEFuIGFycmF5IG9mIGFsbCBpbnRlcnNlY3Rpb25zIG9mIHRoZSByYXkgd2l0aCB0aGlzIHNlZ21lbnQgd2lsbCBiZSByZXR1cm5lZC5cclxuICAgKiBGb3IgZGV0YWlscywgc2VlIHRoZSBkb2N1bWVudGF0aW9uIGluIFNlZ21lbnQuanNcclxuICAgKi9cclxuICBwdWJsaWMgaW50ZXJzZWN0aW9uKCByYXk6IFJheTIgKTogUmF5SW50ZXJzZWN0aW9uW10ge1xyXG4gICAgY29uc3QgcmVzdWx0OiBSYXlJbnRlcnNlY3Rpb25bXSA9IFtdO1xyXG5cclxuICAgIC8vIGZpbmQgdGhlIHJvdGF0aW9uIHRoYXQgd2lsbCBwdXQgb3VyIHJheSBpbiB0aGUgZGlyZWN0aW9uIG9mIHRoZSB4LWF4aXMgc28gd2UgY2FuIG9ubHkgc29sdmUgZm9yIHk9MCBmb3IgaW50ZXJzZWN0aW9uc1xyXG4gICAgY29uc3QgaW52ZXJzZU1hdHJpeCA9IE1hdHJpeDMucm90YXRpb24yKCAtcmF5LmRpcmVjdGlvbi5hbmdsZSApLnRpbWVzTWF0cml4KCBNYXRyaXgzLnRyYW5zbGF0aW9uKCAtcmF5LnBvc2l0aW9uLngsIC1yYXkucG9zaXRpb24ueSApICk7XHJcblxyXG4gICAgY29uc3QgcDAgPSBpbnZlcnNlTWF0cml4LnRpbWVzVmVjdG9yMiggdGhpcy5fc3RhcnQgKTtcclxuICAgIGNvbnN0IHAxID0gaW52ZXJzZU1hdHJpeC50aW1lc1ZlY3RvcjIoIHRoaXMuX2NvbnRyb2wxICk7XHJcbiAgICBjb25zdCBwMiA9IGludmVyc2VNYXRyaXgudGltZXNWZWN0b3IyKCB0aGlzLl9jb250cm9sMiApO1xyXG4gICAgY29uc3QgcDMgPSBpbnZlcnNlTWF0cml4LnRpbWVzVmVjdG9yMiggdGhpcy5fZW5kICk7XHJcblxyXG4gICAgLy8gcG9seW5vbWlhbCBmb3JtIG9mIGN1YmljOiBzdGFydCArICgzIGNvbnRyb2wxIC0gMyBzdGFydCkgdCArICgtNiBjb250cm9sMSArIDMgY29udHJvbDIgKyAzIHN0YXJ0KSB0XjIgKyAoMyBjb250cm9sMSAtIDMgY29udHJvbDIgKyBlbmQgLSBzdGFydCkgdF4zXHJcbiAgICBjb25zdCBhID0gLXAwLnkgKyAzICogcDEueSAtIDMgKiBwMi55ICsgcDMueTtcclxuICAgIGNvbnN0IGIgPSAzICogcDAueSAtIDYgKiBwMS55ICsgMyAqIHAyLnk7XHJcbiAgICBjb25zdCBjID0gLTMgKiBwMC55ICsgMyAqIHAxLnk7XHJcbiAgICBjb25zdCBkID0gcDAueTtcclxuXHJcbiAgICBjb25zdCB0cyA9IHNvbHZlQ3ViaWNSb290c1JlYWwoIGEsIGIsIGMsIGQgKTtcclxuXHJcbiAgICBfLmVhY2goIHRzLCAoIHQ6IG51bWJlciApID0+IHtcclxuICAgICAgaWYgKCB0ID49IDAgJiYgdCA8PSAxICkge1xyXG4gICAgICAgIGNvbnN0IGhpdFBvaW50ID0gdGhpcy5wb3NpdGlvbkF0KCB0ICk7XHJcbiAgICAgICAgY29uc3QgdW5pdFRhbmdlbnQgPSB0aGlzLnRhbmdlbnRBdCggdCApLm5vcm1hbGl6ZWQoKTtcclxuICAgICAgICBjb25zdCBwZXJwID0gdW5pdFRhbmdlbnQucGVycGVuZGljdWxhcjtcclxuICAgICAgICBjb25zdCB0b0hpdCA9IGhpdFBvaW50Lm1pbnVzKCByYXkucG9zaXRpb24gKTtcclxuXHJcbiAgICAgICAgLy8gbWFrZSBzdXJlIGl0J3Mgbm90IGJlaGluZCB0aGUgcmF5XHJcbiAgICAgICAgaWYgKCB0b0hpdC5kb3QoIHJheS5kaXJlY3Rpb24gKSA+IDAgKSB7XHJcbiAgICAgICAgICBjb25zdCBub3JtYWwgPSBwZXJwLmRvdCggcmF5LmRpcmVjdGlvbiApID4gMCA/IHBlcnAubmVnYXRlZCgpIDogcGVycDtcclxuICAgICAgICAgIGNvbnN0IHdpbmQgPSByYXkuZGlyZWN0aW9uLnBlcnBlbmRpY3VsYXIuZG90KCB1bml0VGFuZ2VudCApIDwgMCA/IDEgOiAtMTtcclxuICAgICAgICAgIHJlc3VsdC5wdXNoKCBuZXcgUmF5SW50ZXJzZWN0aW9uKCB0b0hpdC5tYWduaXR1ZGUsIGhpdFBvaW50LCBub3JtYWwsIHdpbmQsIHQgKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHdpbmRpbmcgbnVtYmVyIGZvciBpbnRlcnNlY3Rpb24gd2l0aCBhIHJheVxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aW5kaW5nSW50ZXJzZWN0aW9uKCByYXk6IFJheTIgKTogbnVtYmVyIHtcclxuICAgIGxldCB3aW5kID0gMDtcclxuICAgIGNvbnN0IGhpdHMgPSB0aGlzLmludGVyc2VjdGlvbiggcmF5ICk7XHJcbiAgICBfLmVhY2goIGhpdHMsICggaGl0OiBSYXlJbnRlcnNlY3Rpb24gKSA9PiB7XHJcbiAgICAgIHdpbmQgKz0gaGl0LndpbmQ7XHJcbiAgICB9ICk7XHJcbiAgICByZXR1cm4gd2luZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERyYXdzIHRoZSBzZWdtZW50IHRvIHRoZSAyRCBDYW52YXMgY29udGV4dCwgYXNzdW1pbmcgdGhlIGNvbnRleHQncyBjdXJyZW50IGxvY2F0aW9uIGlzIGFscmVhZHkgYXQgdGhlIHN0YXJ0IHBvaW50XHJcbiAgICovXHJcbiAgcHVibGljIHdyaXRlVG9Db250ZXh0KCBjb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgKTogdm9pZCB7XHJcbiAgICBjb250ZXh0LmJlemllckN1cnZlVG8oIHRoaXMuX2NvbnRyb2wxLngsIHRoaXMuX2NvbnRyb2wxLnksIHRoaXMuX2NvbnRyb2wyLngsIHRoaXMuX2NvbnRyb2wyLnksIHRoaXMuX2VuZC54LCB0aGlzLl9lbmQueSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5ldyBjdWJpYyB0aGF0IHJlcHJlc2VudHMgdGhpcyBjdWJpYyBhZnRlciB0cmFuc2Zvcm1hdGlvbiBieSB0aGUgbWF0cml4XHJcbiAgICovXHJcbiAgcHVibGljIHRyYW5zZm9ybWVkKCBtYXRyaXg6IE1hdHJpeDMgKTogQ3ViaWMge1xyXG4gICAgcmV0dXJuIG5ldyBDdWJpYyggbWF0cml4LnRpbWVzVmVjdG9yMiggdGhpcy5fc3RhcnQgKSwgbWF0cml4LnRpbWVzVmVjdG9yMiggdGhpcy5fY29udHJvbDEgKSwgbWF0cml4LnRpbWVzVmVjdG9yMiggdGhpcy5fY29udHJvbDIgKSwgbWF0cml4LnRpbWVzVmVjdG9yMiggdGhpcy5fZW5kICkgKTtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgZGVncmVlLXJlZHVjZWQgcXVhZHJhdGljIEJlemllciBpZiBwb3NzaWJsZSwgb3RoZXJ3aXNlIGl0IHJldHVybnMgbnVsbFxyXG4gICAqL1xyXG4gIHB1YmxpYyBkZWdyZWVSZWR1Y2VkKCBlcHNpbG9uOiBudW1iZXIgKTogUXVhZHJhdGljIHwgbnVsbCB7XHJcbiAgICBlcHNpbG9uID0gZXBzaWxvbiB8fCAwOyAvLyBpZiBub3QgcHJvdmlkZWQsIHVzZSBhbiBleGFjdCB2ZXJzaW9uXHJcbiAgICBjb25zdCBjb250cm9sQSA9IHNjcmF0Y2hWZWN0b3IxLnNldCggdGhpcy5fY29udHJvbDEgKS5tdWx0aXBseVNjYWxhciggMyApLnN1YnRyYWN0KCB0aGlzLl9zdGFydCApLmRpdmlkZVNjYWxhciggMiApO1xyXG4gICAgY29uc3QgY29udHJvbEIgPSBzY3JhdGNoVmVjdG9yMi5zZXQoIHRoaXMuX2NvbnRyb2wyICkubXVsdGlwbHlTY2FsYXIoIDMgKS5zdWJ0cmFjdCggdGhpcy5fZW5kICkuZGl2aWRlU2NhbGFyKCAyICk7XHJcbiAgICBjb25zdCBkaWZmZXJlbmNlID0gc2NyYXRjaFZlY3RvcjMuc2V0KCBjb250cm9sQSApLnN1YnRyYWN0KCBjb250cm9sQiApO1xyXG4gICAgaWYgKCBkaWZmZXJlbmNlLm1hZ25pdHVkZSA8PSBlcHNpbG9uICkge1xyXG4gICAgICByZXR1cm4gbmV3IFF1YWRyYXRpYyhcclxuICAgICAgICB0aGlzLl9zdGFydCxcclxuICAgICAgICBjb250cm9sQS5hdmVyYWdlKCBjb250cm9sQiApLCAvLyBhdmVyYWdlIHRoZSBjb250cm9sIHBvaW50cyBmb3Igc3RhYmlsaXR5LiB0aGV5IHNob3VsZCBiZSBhbG1vc3QgaWRlbnRpY2FsXHJcbiAgICAgICAgdGhpcy5fZW5kXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gdGhlIHR3byBvcHRpb25zIGZvciBjb250cm9sIHBvaW50cyBhcmUgdG9vIGZhciBhd2F5LCB0aGlzIGN1cnZlIGlzbid0IGVhc2lseSByZWR1Y2libGUuXHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY29udHJpYnV0aW9uIHRvIHRoZSBzaWduZWQgYXJlYSBjb21wdXRlZCB1c2luZyBHcmVlbidzIFRoZW9yZW0sIHdpdGggUD0teS8yIGFuZCBRPXgvMi5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgaXMgdGhpcyBzZWdtZW50J3MgY29udHJpYnV0aW9uIHRvIHRoZSBsaW5lIGludGVncmFsICgteS8yIGR4ICsgeC8yIGR5KS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U2lnbmVkQXJlYUZyYWdtZW50KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gMSAvIDIwICogKFxyXG4gICAgICB0aGlzLl9zdGFydC54ICogKCA2ICogdGhpcy5fY29udHJvbDEueSArIDMgKiB0aGlzLl9jb250cm9sMi55ICsgdGhpcy5fZW5kLnkgKSArXHJcbiAgICAgIHRoaXMuX2NvbnRyb2wxLnggKiAoIC02ICogdGhpcy5fc3RhcnQueSArIDMgKiB0aGlzLl9jb250cm9sMi55ICsgMyAqIHRoaXMuX2VuZC55ICkgK1xyXG4gICAgICB0aGlzLl9jb250cm9sMi54ICogKCAtMyAqIHRoaXMuX3N0YXJ0LnkgLSAzICogdGhpcy5fY29udHJvbDEueSArIDYgKiB0aGlzLl9lbmQueSApICtcclxuICAgICAgdGhpcy5fZW5kLnggKiAoIC10aGlzLl9zdGFydC55IC0gMyAqIHRoaXMuX2NvbnRyb2wxLnkgLSA2ICogdGhpcy5fY29udHJvbDIueSApXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHJldmVyc2VkIGNvcHkgb2YgdGhpcyBzZWdtZW50IChtYXBwaW5nIHRoZSBwYXJhbWV0cml6YXRpb24gZnJvbSBbMCwxXSA9PiBbMSwwXSkuXHJcbiAgICovXHJcbiAgcHVibGljIHJldmVyc2VkKCk6IEN1YmljIHtcclxuICAgIHJldHVybiBuZXcgQ3ViaWMoIHRoaXMuX2VuZCwgdGhpcy5fY29udHJvbDIsIHRoaXMuX2NvbnRyb2wxLCB0aGlzLl9zdGFydCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSWYgaXQgZXhpc3RzLCByZXR1cm5zIHRoZSBwb2ludCB3aGVyZSB0aGUgY3ViaWMgY3VydmUgc2VsZi1pbnRlcnNlY3RzLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBOdWxsIGlmIHRoZXJlIGlzIG5vIGludGVyc2VjdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTZWxmSW50ZXJzZWN0aW9uKCk6IFNlZ21lbnRJbnRlcnNlY3Rpb24gfCBudWxsIHtcclxuICAgIC8vIFdlIHNwbGl0IHRoZSBjdWJpYyBpbnRvIG1vbm90b25lIHNlY3Rpb25zICh3aGljaCBjYW4ndCBzZWxmLWludGVyc2VjdCksIHRoZW4gY2hlY2sgdGhlc2UgZm9yIGludGVyc2VjdGlvbnNcclxuICAgIGNvbnN0IHRFeHRyZW1lcyA9IHRoaXMuZ2V0SW50ZXJpb3JFeHRyZW1hVHMoKTtcclxuICAgIGNvbnN0IGZ1bGxFeHRyZW1lcyA9IFsgMCBdLmNvbmNhdCggdEV4dHJlbWVzICkuY29uY2F0KCBbIDEgXSApO1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSB0aGlzLnN1YmRpdmlzaW9ucyggdEV4dHJlbWVzICk7XHJcbiAgICBpZiAoIHNlZ21lbnRzLmxlbmd0aCA8IDMgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHNlZ21lbnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBhU2VnbWVudCA9IHNlZ21lbnRzWyBpIF07XHJcbiAgICAgIGZvciAoIGxldCBqID0gaSArIDE7IGogPCBzZWdtZW50cy5sZW5ndGg7IGorKyApIHtcclxuICAgICAgICBjb25zdCBiU2VnbWVudCA9IHNlZ21lbnRzWyBqIF07XHJcblxyXG4gICAgICAgIGNvbnN0IGludGVyc2VjdGlvbnMgPSBCb3VuZHNJbnRlcnNlY3Rpb24uaW50ZXJzZWN0KCBhU2VnbWVudCwgYlNlZ21lbnQgKTtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbnRlcnNlY3Rpb25zLmxlbmd0aCA8IDIgKTtcclxuXHJcbiAgICAgICAgaWYgKCBpbnRlcnNlY3Rpb25zLmxlbmd0aCApIHtcclxuICAgICAgICAgIGNvbnN0IGludGVyc2VjdGlvbiA9IGludGVyc2VjdGlvbnNbIDAgXTtcclxuICAgICAgICAgIC8vIEV4Y2x1ZGUgZW5kcG9pbnRzIG92ZXJsYXBwaW5nXHJcbiAgICAgICAgICBpZiAoIGludGVyc2VjdGlvbi5hVCA+IDFlLTcgJiYgaW50ZXJzZWN0aW9uLmFUIDwgKCAxIC0gMWUtNyApICYmXHJcbiAgICAgICAgICAgICAgIGludGVyc2VjdGlvbi5iVCA+IDFlLTcgJiYgaW50ZXJzZWN0aW9uLmJUIDwgKCAxIC0gMWUtNyApICkge1xyXG4gICAgICAgICAgICAvLyBSZW1hcCBwYXJhbWV0cmljIHZhbHVlcyBmcm9tIHRoZSBzdWJkaXZpZGVkIHNlZ21lbnRzIHRvIHRoZSBtYWluIHNlZ21lbnRcclxuICAgICAgICAgICAgY29uc3QgYVQgPSBmdWxsRXh0cmVtZXNbIGkgXSArIGludGVyc2VjdGlvbi5hVCAqICggZnVsbEV4dHJlbWVzWyBpICsgMSBdIC0gZnVsbEV4dHJlbWVzWyBpIF0gKTtcclxuICAgICAgICAgICAgY29uc3QgYlQgPSBmdWxsRXh0cmVtZXNbIGogXSArIGludGVyc2VjdGlvbi5iVCAqICggZnVsbEV4dHJlbWVzWyBqICsgMSBdIC0gZnVsbEV4dHJlbWVzWyBqIF0gKTtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTZWdtZW50SW50ZXJzZWN0aW9uKCBpbnRlcnNlY3Rpb24ucG9pbnQsIGFULCBiVCApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gb2JqZWN0IGZvcm0gdGhhdCBjYW4gYmUgdHVybmVkIGJhY2sgaW50byBhIHNlZ21lbnQgd2l0aCB0aGUgY29ycmVzcG9uZGluZyBkZXNlcmlhbGl6ZSBtZXRob2QuXHJcbiAgICovXHJcbiAgcHVibGljIHNlcmlhbGl6ZSgpOiBTZXJpYWxpemVkQ3ViaWMge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ0N1YmljJyxcclxuICAgICAgc3RhcnRYOiB0aGlzLl9zdGFydC54LFxyXG4gICAgICBzdGFydFk6IHRoaXMuX3N0YXJ0LnksXHJcbiAgICAgIGNvbnRyb2wxWDogdGhpcy5fY29udHJvbDEueCxcclxuICAgICAgY29udHJvbDFZOiB0aGlzLl9jb250cm9sMS55LFxyXG4gICAgICBjb250cm9sMlg6IHRoaXMuX2NvbnRyb2wyLngsXHJcbiAgICAgIGNvbnRyb2wyWTogdGhpcy5fY29udHJvbDIueSxcclxuICAgICAgZW5kWDogdGhpcy5fZW5kLngsXHJcbiAgICAgIGVuZFk6IHRoaXMuX2VuZC55XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lIHdoZXRoZXIgdHdvIGxpbmVzIG92ZXJsYXAgb3ZlciBhIGNvbnRpbnVvdXMgc2VjdGlvbiwgYW5kIGlmIHNvIGZpbmRzIHRoZSBhLGIgcGFpciBzdWNoIHRoYXRcclxuICAgKiBwKCB0ICkgPT09IHEoIGEgKiB0ICsgYiApLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHNlZ21lbnRcclxuICAgKiBAcGFyYW0gW2Vwc2lsb25dIC0gV2lsbCByZXR1cm4gb3ZlcmxhcHMgb25seSBpZiBubyB0d28gY29ycmVzcG9uZGluZyBwb2ludHMgZGlmZmVyIGJ5IHRoaXMgYW1vdW50IG9yIG1vcmVcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW4gb25lIGNvbXBvbmVudC5cclxuICAgKiBAcmV0dXJucyAtIFRoZSBzb2x1dGlvbiwgaWYgdGhlcmUgaXMgb25lIChhbmQgb25seSBvbmUpXHJcbiAgICovXHJcbiAgcHVibGljIGdldE92ZXJsYXBzKCBzZWdtZW50OiBTZWdtZW50LCBlcHNpbG9uID0gMWUtNiApOiBPdmVybGFwW10gfCBudWxsIHtcclxuICAgIGlmICggc2VnbWVudCBpbnN0YW5jZW9mIEN1YmljICkge1xyXG4gICAgICByZXR1cm4gQ3ViaWMuZ2V0T3ZlcmxhcHMoIHRoaXMsIHNlZ21lbnQgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBDdWJpYyBmcm9tIHRoZSBzZXJpYWxpemVkIHJlcHJlc2VudGF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgb3ZlcnJpZGUgZGVzZXJpYWxpemUoIG9iajogU2VyaWFsaXplZEN1YmljICk6IEN1YmljIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG9iai50eXBlID09PSAnQ3ViaWMnICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBDdWJpYyggbmV3IFZlY3RvcjIoIG9iai5zdGFydFgsIG9iai5zdGFydFkgKSwgbmV3IFZlY3RvcjIoIG9iai5jb250cm9sMVgsIG9iai5jb250cm9sMVkgKSwgbmV3IFZlY3RvcjIoIG9iai5jb250cm9sMlgsIG9iai5jb250cm9sMlkgKSwgbmV3IFZlY3RvcjIoIG9iai5lbmRYLCBvYmouZW5kWSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaW5kcyB3aGF0IHQgdmFsdWVzIHRoZSBjdWJpYyBleHRyZW1hIGFyZSBhdCAoaWYgYW55KS4gVGhpcyBpcyBqdXN0IHRoZSAxLWRpbWVuc2lvbmFsIGNhc2UsIHVzZWQgZm9yIG11bHRpcGxlIHB1cnBvc2VzXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBleHRyZW1hVCggdjA6IG51bWJlciwgdjE6IG51bWJlciwgdjI6IG51bWJlciwgdjM6IG51bWJlciApOiBudW1iZXJbXSB7XHJcbiAgICBpZiAoIHYwID09PSB2MSAmJiB2MCA9PT0gdjIgJiYgdjAgPT09IHYzICkge1xyXG4gICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29lZmZpY2llbnRzIG9mIGRlcml2YXRpdmVcclxuICAgIGNvbnN0IGEgPSAtMyAqIHYwICsgOSAqIHYxIC0gOSAqIHYyICsgMyAqIHYzO1xyXG4gICAgY29uc3QgYiA9IDYgKiB2MCAtIDEyICogdjEgKyA2ICogdjI7XHJcbiAgICBjb25zdCBjID0gLTMgKiB2MCArIDMgKiB2MTtcclxuXHJcbiAgICByZXR1cm4gXy5maWx0ZXIoIHNvbHZlUXVhZHJhdGljUm9vdHNSZWFsKCBhLCBiLCBjICksIGlzQmV0d2VlbjBBbmQxICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmUgd2hldGhlciB0d28gQ3ViaWNzIG92ZXJsYXAgb3ZlciBhIGNvbnRpbnVvdXMgc2VjdGlvbiwgYW5kIGlmIHNvIGZpbmRzIHRoZSBhLGIgcGFpciBzdWNoIHRoYXRcclxuICAgKiBwKCB0ICkgPT09IHEoIGEgKiB0ICsgYiApLlxyXG4gICAqXHJcbiAgICogTk9URTogZm9yIHRoaXMgcGFydGljdWxhciBmdW5jdGlvbiwgd2UgYXNzdW1lIHdlJ3JlIG5vdCBkZWdlbmVyYXRlLiBUaGluZ3MgbWF5IHdvcmsgaWYgd2UgY2FuIGJlIGRlZ3JlZS1yZWR1Y2VkXHJcbiAgICogdG8gYSBxdWFkcmF0aWMsIGJ1dCBnZW5lcmFsbHkgdGhhdCBzaG91bGRuJ3QgYmUgZG9uZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBjdWJpYzFcclxuICAgKiBAcGFyYW0gY3ViaWMyXHJcbiAgICogQHBhcmFtIFtlcHNpbG9uXSAtIFdpbGwgcmV0dXJuIG92ZXJsYXBzIG9ubHkgaWYgbm8gdHdvIGNvcnJlc3BvbmRpbmcgcG9pbnRzIGRpZmZlciBieSB0aGlzIGFtb3VudCBvciBtb3JlXHJcbiAgICogICAgICAgICAgICAgICAgICAgIGluIG9uZSBjb21wb25lbnQuXHJcbiAgICogQHJldHVybnMgLSBUaGUgc29sdXRpb24sIGlmIHRoZXJlIGlzIG9uZSAoYW5kIG9ubHkgb25lKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0T3ZlcmxhcHMoIGN1YmljMTogQ3ViaWMsIGN1YmljMjogQ3ViaWMsIGVwc2lsb24gPSAxZS02ICk6IE92ZXJsYXBbXSB7XHJcblxyXG4gICAgLypcclxuICAgICAqIEZvciBhIDEtZGltZW5zaW9uYWwgY3ViaWMgYmV6aWVyLCB3ZSBoYXZlIHRoZSBmb3JtdWxhOlxyXG4gICAgICpcclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIFsgIDAgIDAgIDAgIDAgXSAgIFsgcDAgXVxyXG4gICAgICogcCggdCApID0gWyAxIHQgdF4yIHReMyBdICogWyAtMyAgMyAgMCAgMCBdICogWyBwMSBdXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbICAzIC02ICAzICAwIF0gICBbIHAyIF1cclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIFsgLTEgIDMgLTMgIDEgXSAgIFsgcDMgXVxyXG4gICAgICpcclxuICAgICAqIHdoZXJlIHAwLHAxLHAyLHAzIGFyZSB0aGUgY29udHJvbCB2YWx1ZXMgKHN0YXJ0LGNvbnRyb2wxLGNvbnRyb2wyLGVuZCkuIFdlIHdhbnQgdG8gc2VlIGlmIGEgbGluZWFyLW1hcHBlZCBjdWJpYzpcclxuICAgICAqXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbIDEgYiBiXjIgIGJeMyAgXSAgIFsgIDAgIDAgIDAgIDAgXSAgIFsgcTAgXVxyXG4gICAgICogcCggdCApID0/IHEoIGEgKiB0ICsgYiApID0gWyAxIHQgdF4yIHReMyBdICogWyAwIGEgMmFiIDNhYl4yIF0gKiBbIC0zICAzICAwICAwIF0gKiBbIHExIF1cclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFsgMCAwIGFeMiAzYV4yYiBdICAgWyAgMyAtNiAgMyAgMCBdICAgWyBxMiBdXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbIDAgMCAgMCAgIGFeMyAgXSAgIFsgLTEgIDMgLTMgIDEgXSAgIFsgcTMgXVxyXG4gICAgICpcclxuICAgICAqIChpcyBpdCBlcXVhbCB0byB0aGUgc2Vjb25kIGN1YmljIGlmIHdlIGNhbiBmaW5kIGEgbGluZWFyIHdheSB0byBtYXAgaXRzIGlucHV0IHQtdmFsdWU/KVxyXG4gICAgICpcclxuICAgICAqIEZvciBzaW1wbGljaXR5IGFuZCBlZmZpY2llbmN5LCB3ZSdsbCBwcmVjb21wdXRlIHRoZSBtdWx0aXBsaWNhdGlvbiBvZiB0aGUgYmV6aWVyIG1hdHJpeDpcclxuICAgICAqIFsgcDBzIF0gICAgWyAgMSAgIDAgICAwICAgMCBdICAgWyBwMCBdXHJcbiAgICAgKiBbIHAxcyBdID09IFsgLTMgICAzICAgMCAgIDAgXSAqIFsgcDEgXVxyXG4gICAgICogWyBwMnMgXSAgICBbICAzICAtNiAgIDMgICAwIF0gICBbIHAyIF1cclxuICAgICAqIFsgcDNzIF0gICAgWyAtMSAgIDMgIC0zICAgMSBdICAgWyBwMyBdXHJcbiAgICAgKlxyXG4gICAgICogTGVhdmluZyBvdXIgY29tcHV0YXRpb24gdG8gc29sdmUgZm9yIGEsYiBzdWNoIHRoYXQ6XHJcbiAgICAgKlxyXG4gICAgICogWyBwMHMgXSAgICBbIDEgYiBiXjIgIGJeMyAgXSAgIFsgcTBzIF1cclxuICAgICAqIFsgcDFzIF0gPT0gWyAwIGEgMmFiIDNhYl4yIF0gKiBbIHExcyBdXHJcbiAgICAgKiBbIHAycyBdICAgIFsgMCAwIGFeMiAzYV4yYiBdICAgWyBxMnMgXVxyXG4gICAgICogWyBwM3MgXSAgICBbIDAgMCAgMCAgIGFeMyAgXSAgIFsgcTNzIF1cclxuICAgICAqXHJcbiAgICAgKiBUaGUgc3VicHJvYmxlbSBvZiBjb21wdXRpbmcgcG9zc2libGUgYSxiIHBhaXJzIHdpbGwgYmUgbGVmdCB0byBTZWdtZW50LnBvbHlub21pYWxHZXRPdmVybGFwQ3ViaWMgYW5kIGl0c1xyXG4gICAgICogcmVkdWN0aW9ucyAoaWYgcDNzL3EzcyBhcmUgemVybywgdGhleSBhcmVuJ3QgZnVsbHkgY3ViaWMgYmV6aWVycyBhbmQgY2FuIGJlIGRlZ3JlZSByZWR1Y2VkLCB3aGljaCBpcyBoYW5kbGVkKS5cclxuICAgICAqXHJcbiAgICAgKiBUaGVuLCBnaXZlbiBhbiBhLGIgcGFpciwgd2UgbmVlZCB0byBlbnN1cmUgdGhlIGFib3ZlIGZvcm11bGEgaXMgc2F0aXNmaWVkIChhcHByb3hpbWF0ZWx5LCBkdWUgdG8gZmxvYXRpbmctcG9pbnRcclxuICAgICAqIGFyaXRobWV0aWMpLlxyXG4gICAgICovXHJcblxyXG4gICAgY29uc3Qgbm9PdmVybGFwOiBPdmVybGFwW10gPSBbXTtcclxuXHJcbiAgICAvLyBFZmZpY2llbnRseSBjb21wdXRlIHRoZSBtdWx0aXBsaWNhdGlvbiBvZiB0aGUgYmV6aWVyIG1hdHJpeDpcclxuICAgIGNvbnN0IHAweCA9IGN1YmljMS5fc3RhcnQueDtcclxuICAgIGNvbnN0IHAxeCA9IC0zICogY3ViaWMxLl9zdGFydC54ICsgMyAqIGN1YmljMS5fY29udHJvbDEueDtcclxuICAgIGNvbnN0IHAyeCA9IDMgKiBjdWJpYzEuX3N0YXJ0LnggLSA2ICogY3ViaWMxLl9jb250cm9sMS54ICsgMyAqIGN1YmljMS5fY29udHJvbDIueDtcclxuICAgIGNvbnN0IHAzeCA9IC0xICogY3ViaWMxLl9zdGFydC54ICsgMyAqIGN1YmljMS5fY29udHJvbDEueCAtIDMgKiBjdWJpYzEuX2NvbnRyb2wyLnggKyBjdWJpYzEuX2VuZC54O1xyXG4gICAgY29uc3QgcDB5ID0gY3ViaWMxLl9zdGFydC55O1xyXG4gICAgY29uc3QgcDF5ID0gLTMgKiBjdWJpYzEuX3N0YXJ0LnkgKyAzICogY3ViaWMxLl9jb250cm9sMS55O1xyXG4gICAgY29uc3QgcDJ5ID0gMyAqIGN1YmljMS5fc3RhcnQueSAtIDYgKiBjdWJpYzEuX2NvbnRyb2wxLnkgKyAzICogY3ViaWMxLl9jb250cm9sMi55O1xyXG4gICAgY29uc3QgcDN5ID0gLTEgKiBjdWJpYzEuX3N0YXJ0LnkgKyAzICogY3ViaWMxLl9jb250cm9sMS55IC0gMyAqIGN1YmljMS5fY29udHJvbDIueSArIGN1YmljMS5fZW5kLnk7XHJcbiAgICBjb25zdCBxMHggPSBjdWJpYzIuX3N0YXJ0Lng7XHJcbiAgICBjb25zdCBxMXggPSAtMyAqIGN1YmljMi5fc3RhcnQueCArIDMgKiBjdWJpYzIuX2NvbnRyb2wxLng7XHJcbiAgICBjb25zdCBxMnggPSAzICogY3ViaWMyLl9zdGFydC54IC0gNiAqIGN1YmljMi5fY29udHJvbDEueCArIDMgKiBjdWJpYzIuX2NvbnRyb2wyLng7XHJcbiAgICBjb25zdCBxM3ggPSAtMSAqIGN1YmljMi5fc3RhcnQueCArIDMgKiBjdWJpYzIuX2NvbnRyb2wxLnggLSAzICogY3ViaWMyLl9jb250cm9sMi54ICsgY3ViaWMyLl9lbmQueDtcclxuICAgIGNvbnN0IHEweSA9IGN1YmljMi5fc3RhcnQueTtcclxuICAgIGNvbnN0IHExeSA9IC0zICogY3ViaWMyLl9zdGFydC55ICsgMyAqIGN1YmljMi5fY29udHJvbDEueTtcclxuICAgIGNvbnN0IHEyeSA9IDMgKiBjdWJpYzIuX3N0YXJ0LnkgLSA2ICogY3ViaWMyLl9jb250cm9sMS55ICsgMyAqIGN1YmljMi5fY29udHJvbDIueTtcclxuICAgIGNvbnN0IHEzeSA9IC0xICogY3ViaWMyLl9zdGFydC55ICsgMyAqIGN1YmljMi5fY29udHJvbDEueSAtIDMgKiBjdWJpYzIuX2NvbnRyb2wyLnkgKyBjdWJpYzIuX2VuZC55O1xyXG5cclxuICAgIC8vIERldGVybWluZSB0aGUgY2FuZGlkYXRlIG92ZXJsYXAgKHByZWZlcnJpbmcgdGhlIGRpbWVuc2lvbiB3aXRoIHRoZSBsYXJnZXN0IHZhcmlhdGlvbilcclxuICAgIGNvbnN0IHhTcHJlYWQgPSBNYXRoLmFicyggTWF0aC5tYXgoIGN1YmljMS5fc3RhcnQueCwgY3ViaWMxLl9jb250cm9sMS54LCBjdWJpYzEuX2NvbnRyb2wyLngsIGN1YmljMS5fZW5kLngsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3ViaWMxLl9zdGFydC54LCBjdWJpYzEuX2NvbnRyb2wxLngsIGN1YmljMS5fY29udHJvbDIueCwgY3ViaWMxLl9lbmQueCApIC1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oIGN1YmljMS5fc3RhcnQueCwgY3ViaWMxLl9jb250cm9sMS54LCBjdWJpYzEuX2NvbnRyb2wyLngsIGN1YmljMS5fZW5kLngsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3ViaWMxLl9zdGFydC54LCBjdWJpYzEuX2NvbnRyb2wxLngsIGN1YmljMS5fY29udHJvbDIueCwgY3ViaWMxLl9lbmQueCApICk7XHJcbiAgICBjb25zdCB5U3ByZWFkID0gTWF0aC5hYnMoIE1hdGgubWF4KCBjdWJpYzEuX3N0YXJ0LnksIGN1YmljMS5fY29udHJvbDEueSwgY3ViaWMxLl9jb250cm9sMi55LCBjdWJpYzEuX2VuZC55LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1YmljMS5fc3RhcnQueSwgY3ViaWMxLl9jb250cm9sMS55LCBjdWJpYzEuX2NvbnRyb2wyLnksIGN1YmljMS5fZW5kLnkgKSAtXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWluKCBjdWJpYzEuX3N0YXJ0LnksIGN1YmljMS5fY29udHJvbDEueSwgY3ViaWMxLl9jb250cm9sMi55LCBjdWJpYzEuX2VuZC55LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1YmljMS5fc3RhcnQueSwgY3ViaWMxLl9jb250cm9sMS55LCBjdWJpYzEuX2NvbnRyb2wyLnksIGN1YmljMS5fZW5kLnkgKSApO1xyXG4gICAgY29uc3QgeE92ZXJsYXAgPSBTZWdtZW50LnBvbHlub21pYWxHZXRPdmVybGFwQ3ViaWMoIHAweCwgcDF4LCBwMngsIHAzeCwgcTB4LCBxMXgsIHEyeCwgcTN4ICk7XHJcbiAgICBjb25zdCB5T3ZlcmxhcCA9IFNlZ21lbnQucG9seW5vbWlhbEdldE92ZXJsYXBDdWJpYyggcDB5LCBwMXksIHAyeSwgcDN5LCBxMHksIHExeSwgcTJ5LCBxM3kgKTtcclxuICAgIGxldCBvdmVybGFwO1xyXG4gICAgaWYgKCB4U3ByZWFkID4geVNwcmVhZCApIHtcclxuICAgICAgb3ZlcmxhcCA9ICggeE92ZXJsYXAgPT09IG51bGwgfHwgeE92ZXJsYXAgPT09IHRydWUgKSA/IHlPdmVybGFwIDogeE92ZXJsYXA7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgb3ZlcmxhcCA9ICggeU92ZXJsYXAgPT09IG51bGwgfHwgeU92ZXJsYXAgPT09IHRydWUgKSA/IHhPdmVybGFwIDogeU92ZXJsYXA7XHJcbiAgICB9XHJcbiAgICBpZiAoIG92ZXJsYXAgPT09IG51bGwgfHwgb3ZlcmxhcCA9PT0gdHJ1ZSApIHtcclxuICAgICAgcmV0dXJuIG5vT3ZlcmxhcDsgLy8gTm8gd2F5IHRvIHBpbiBkb3duIGFuIG92ZXJsYXBcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhID0gb3ZlcmxhcC5hO1xyXG4gICAgY29uc3QgYiA9IG92ZXJsYXAuYjtcclxuXHJcbiAgICAvLyBQcmVtdWx0aXBseSBhIGZldyB2YWx1ZXNcclxuICAgIGNvbnN0IGFhID0gYSAqIGE7XHJcbiAgICBjb25zdCBhYWEgPSBhICogYSAqIGE7XHJcbiAgICBjb25zdCBiYiA9IGIgKiBiO1xyXG4gICAgY29uc3QgYmJiID0gYiAqIGIgKiBiO1xyXG4gICAgY29uc3QgYWIyID0gMiAqIGEgKiBiO1xyXG4gICAgY29uc3QgYWJiMyA9IDMgKiBhICogYmI7XHJcbiAgICBjb25zdCBhYWIzID0gMyAqIGFhICogYjtcclxuXHJcbiAgICAvLyBDb21wdXRlIGN1YmljIGNvZWZmaWNpZW50cyBmb3IgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBwKHQpIGFuZCBxKGEqdCtiKVxyXG4gICAgY29uc3QgZDB4ID0gcTB4ICsgYiAqIHExeCArIGJiICogcTJ4ICsgYmJiICogcTN4IC0gcDB4O1xyXG4gICAgY29uc3QgZDF4ID0gYSAqIHExeCArIGFiMiAqIHEyeCArIGFiYjMgKiBxM3ggLSBwMXg7XHJcbiAgICBjb25zdCBkMnggPSBhYSAqIHEyeCArIGFhYjMgKiBxM3ggLSBwMng7XHJcbiAgICBjb25zdCBkM3ggPSBhYWEgKiBxM3ggLSBwM3g7XHJcbiAgICBjb25zdCBkMHkgPSBxMHkgKyBiICogcTF5ICsgYmIgKiBxMnkgKyBiYmIgKiBxM3kgLSBwMHk7XHJcbiAgICBjb25zdCBkMXkgPSBhICogcTF5ICsgYWIyICogcTJ5ICsgYWJiMyAqIHEzeSAtIHAxeTtcclxuICAgIGNvbnN0IGQyeSA9IGFhICogcTJ5ICsgYWFiMyAqIHEzeSAtIHAyeTtcclxuICAgIGNvbnN0IGQzeSA9IGFhYSAqIHEzeSAtIHAzeTtcclxuXHJcbiAgICAvLyBGaW5kIHRoZSB0IHZhbHVlcyB3aGVyZSBleHRyZW1lcyBsaWUgaW4gdGhlIFswLDFdIHJhbmdlIGZvciBlYWNoIDEtZGltZW5zaW9uYWwgY3ViaWMuIFdlIGRvIHRoaXMgYnlcclxuICAgIC8vIGRpZmZlcmVudGlhdGluZyB0aGUgY3ViaWMgYW5kIGZpbmRpbmcgdGhlIHJvb3RzIG9mIHRoZSByZXN1bHRpbmcgcXVhZHJhdGljLlxyXG4gICAgY29uc3QgeFJvb3RzID0gVXRpbHMuc29sdmVRdWFkcmF0aWNSb290c1JlYWwoIDMgKiBkM3gsIDIgKiBkMngsIGQxeCApO1xyXG4gICAgY29uc3QgeVJvb3RzID0gVXRpbHMuc29sdmVRdWFkcmF0aWNSb290c1JlYWwoIDMgKiBkM3ksIDIgKiBkMnksIGQxeSApO1xyXG4gICAgY29uc3QgeEV4dHJlbWVUcyA9IF8udW5pcSggWyAwLCAxIF0uY29uY2F0KCB4Um9vdHMgIT09IG51bGwgPyB4Um9vdHMuZmlsdGVyKCBpc0JldHdlZW4wQW5kMSApIDogW10gKSApO1xyXG4gICAgY29uc3QgeUV4dHJlbWVUcyA9IF8udW5pcSggWyAwLCAxIF0uY29uY2F0KCB5Um9vdHMgIT09IG51bGwgPyB5Um9vdHMuZmlsdGVyKCBpc0JldHdlZW4wQW5kMSApIDogW10gKSApO1xyXG5cclxuICAgIC8vIEV4YW1pbmUgdGhlIHNpbmdsZS1jb29yZGluYXRlIGRpc3RhbmNlcyBiZXR3ZWVuIHRoZSBcIm92ZXJsYXBzXCIgYXQgZWFjaCBleHRyZW1lIFQgdmFsdWUuIElmIHRoZSBkaXN0YW5jZSBpcyBsYXJnZXJcclxuICAgIC8vIHRoYW4gb3VyIGVwc2lsb24sIHRoZW4gdGhlIFwib3ZlcmxhcFwiIHdvdWxkIG5vdCBiZSB2YWxpZC5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHhFeHRyZW1lVHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IHQgPSB4RXh0cmVtZVRzWyBpIF07XHJcbiAgICAgIGlmICggTWF0aC5hYnMoICggKCBkM3ggKiB0ICsgZDJ4ICkgKiB0ICsgZDF4ICkgKiB0ICsgZDB4ICkgPiBlcHNpbG9uICkge1xyXG4gICAgICAgIHJldHVybiBub092ZXJsYXA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHlFeHRyZW1lVHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IHQgPSB5RXh0cmVtZVRzWyBpIF07XHJcbiAgICAgIGlmICggTWF0aC5hYnMoICggKCBkM3kgKiB0ICsgZDJ5ICkgKiB0ICsgZDF5ICkgKiB0ICsgZDB5ICkgPiBlcHNpbG9uICkge1xyXG4gICAgICAgIHJldHVybiBub092ZXJsYXA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBxdDAgPSBiO1xyXG4gICAgY29uc3QgcXQxID0gYSArIGI7XHJcblxyXG4gICAgLy8gVE9ETzogZG8gd2Ugd2FudCBhbiBlcHNpbG9uIGluIGhlcmUgdG8gYmUgcGVybWlzc2l2ZT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICBpZiAoICggcXQwID4gMSAmJiBxdDEgPiAxICkgfHwgKCBxdDAgPCAwICYmIHF0MSA8IDAgKSApIHtcclxuICAgICAgcmV0dXJuIG5vT3ZlcmxhcDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gWyBuZXcgT3ZlcmxhcCggYSwgYiApIF07XHJcbiAgfVxyXG5cclxuICAvLyBEZWdyZWUgb2YgdGhpcyBwb2x5bm9taWFsIChjdWJpYylcclxuICBwdWJsaWMgZGVncmVlITogbnVtYmVyO1xyXG59XHJcblxyXG5DdWJpYy5wcm90b3R5cGUuZGVncmVlID0gMztcclxuXHJcbmtpdGUucmVnaXN0ZXIoICdDdWJpYycsIEN1YmljICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxPQUFPQyxPQUFPLE1BQU0sNEJBQTRCO0FBRWhELE9BQU9DLEtBQUssTUFBTSwwQkFBMEI7QUFDNUMsT0FBT0MsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxTQUFTQyxrQkFBa0IsRUFBRUMsSUFBSSxFQUFFQyxJQUFJLEVBQUVDLE9BQU8sRUFBRUMsU0FBUyxFQUFFQyxlQUFlLEVBQUVDLE9BQU8sRUFBRUMsbUJBQW1CLEVBQUVDLFNBQVMsUUFBUSxlQUFlO0FBRTVJLE1BQU1DLHVCQUF1QixHQUFHWCxLQUFLLENBQUNXLHVCQUF1QixDQUFDLENBQUM7QUFDL0QsTUFBTUMsbUJBQW1CLEdBQUdaLEtBQUssQ0FBQ1ksbUJBQW1CLENBQUMsQ0FBQztBQUN2RCxNQUFNQyxrQkFBa0IsR0FBR2IsS0FBSyxDQUFDYSxrQkFBa0IsQ0FBQyxDQUFDOztBQUVyRDtBQUNBLE1BQU1D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