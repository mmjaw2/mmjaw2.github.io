// Copyright 2013-2024, University of Colorado Boulder

/**
 * Quadratic Bezier segment
 *
 * Good reference: http://cagd.cs.byu.edu/~557/text/ch2.pdf
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../../dot/js/Bounds2.js';
import Matrix3 from '../../../dot/js/Matrix3.js';
import Utils from '../../../dot/js/Utils.js';
import Vector2 from '../../../dot/js/Vector2.js';
import { Cubic, kite, Line, Overlap, RayIntersection, Segment, svgNumber } from '../imports.js';

// constants
const solveQuadraticRootsReal = Utils.solveQuadraticRootsReal;
const arePointsCollinear = Utils.arePointsCollinear;

// Used in multiple filters
function isBetween0And1(t) {
  return t >= 0 && t <= 1;
}
export default class Quadratic extends Segment {
  // Lazily-computed derived information

  // T where x-derivative is 0 (replaced with NaN if not in range)
  // T where y-derivative is 0 (replaced with NaN if not in range)

  /**
   * @param start - Start point of the quadratic bezier
   * @param control - Control point (curve usually doesn't go through here)
   * @param end - End point of the quadratic bezier
   */
  constructor(start, control, end) {
    super();
    this._start = start;
    this._control = control;
    this._end = end;
    this.invalidate();
  }

  /**
   * Sets the start point of the Quadratic.
   */
  setStart(start) {
    assert && assert(start.isFinite(), `Quadratic start should be finite: ${start.toString()}`);
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
   * Returns the start of this Quadratic.
   */
  getStart() {
    return this._start;
  }

  /**
   * Sets the control point of the Quadratic.
   */
  setControl(control) {
    assert && assert(control.isFinite(), `Quadratic control should be finite: ${control.toString()}`);
    if (!this._control.equals(control)) {
      this._control = control;
      this.invalidate();
    }
    return this; // allow chaining
  }
  set control(value) {
    this.setControl(value);
  }
  get control() {
    return this.getControl();
  }

  /**
   * Returns the control point of this Quadratic.
   */
  getControl() {
    return this._control;
  }

  /**
   * Sets the end point of the Quadratic.
   */
  setEnd(end) {
    assert && assert(end.isFinite(), `Quadratic end should be finite: ${end.toString()}`);
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
   * Returns the end of this Quadratic.
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
    const mt = 1 - t;
    // described from t=[0,1] as: (1-t)^2 start + 2(1-t)t control + t^2 end
    // TODO: allocation reduction https://github.com/phetsims/kite/issues/76
    return this._start.times(mt * mt).plus(this._control.times(2 * mt * t)).plus(this._end.times(t * t));
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

    // For a quadratic curve, the derivative is given by : 2(1-t)( control - start ) + 2t( end - control )
    // TODO: allocation reduction https://github.com/phetsims/kite/issues/76
    return this._control.minus(this._start).times(2 * (1 - t)).plus(this._end.minus(this._control).times(2 * t));
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
    // TODO: remove code duplication with Cubic https://github.com/phetsims/kite/issues/76
    const epsilon = 0.0000001;
    if (Math.abs(t - 0.5) > 0.5 - epsilon) {
      const isZero = t < 0.5;
      const p0 = isZero ? this._start : this._end;
      const p1 = this._control;
      const p2 = isZero ? this._end : this._start;
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
    const leftMid = this._start.blend(this._control, t);
    const rightMid = this._control.blend(this._end, t);
    const mid = leftMid.blend(rightMid, t);
    return [new Quadratic(this._start, leftMid, mid), new Quadratic(mid, rightMid, this._end)];
  }

  /**
   * Clears cached information, should be called when any of the 'constructor arguments' are mutated.
   */
  invalidate() {
    assert && assert(this._start instanceof Vector2, `Quadratic start should be a Vector2: ${this._start}`);
    assert && assert(this._start.isFinite(), `Quadratic start should be finite: ${this._start.toString()}`);
    assert && assert(this._control instanceof Vector2, `Quadratic control should be a Vector2: ${this._control}`);
    assert && assert(this._control.isFinite(), `Quadratic control should be finite: ${this._control.toString()}`);
    assert && assert(this._end instanceof Vector2, `Quadratic end should be a Vector2: ${this._end}`);
    assert && assert(this._end.isFinite(), `Quadratic end should be finite: ${this._end.toString()}`);

    // Lazily-computed derived information
    this._startTangent = null;
    this._endTangent = null;
    this._tCriticalX = null;
    this._tCriticalY = null;
    this._bounds = null;
    this._svgPathFragment = null;
    this.invalidationEmitter.emit();
  }

  /**
   * Returns the tangent vector (normalized) to the segment at the start, pointing in the direction of motion (from start to end)
   */
  getStartTangent() {
    if (this._startTangent === null) {
      const controlIsStart = this._start.equals(this._control);
      // TODO: allocation reduction https://github.com/phetsims/kite/issues/76
      this._startTangent = controlIsStart ? this._end.minus(this._start).normalized() : this._control.minus(this._start).normalized();
    }
    return this._startTangent;
  }
  get startTangent() {
    return this.getStartTangent();
  }

  /**
   * Returns the tangent vector (normalized) to the segment at the end, pointing in the direction of motion (from start to end)
   */
  getEndTangent() {
    if (this._endTangent === null) {
      const controlIsEnd = this._end.equals(this._control);
      // TODO: allocation reduction https://github.com/phetsims/kite/issues/76
      this._endTangent = controlIsEnd ? this._end.minus(this._start).normalized() : this._end.minus(this._control).normalized();
    }
    return this._endTangent;
  }
  get endTangent() {
    return this.getEndTangent();
  }
  getTCriticalX() {
    // compute x where the derivative is 0 (used for bounds and other things)
    if (this._tCriticalX === null) {
      this._tCriticalX = Quadratic.extremaT(this._start.x, this._control.x, this._end.x);
    }
    return this._tCriticalX;
  }
  get tCriticalX() {
    return this.getTCriticalX();
  }
  getTCriticalY() {
    // compute y where the derivative is 0 (used for bounds and other things)
    if (this._tCriticalY === null) {
      this._tCriticalY = Quadratic.extremaT(this._start.y, this._control.y, this._end.y);
    }
    return this._tCriticalY;
  }
  get tCriticalY() {
    return this.getTCriticalY();
  }

  /**
   * Returns a list of non-degenerate segments that are equivalent to this segment. Generally gets rid (or simplifies)
   * invalid or repeated segments.
   */
  getNondegenerateSegments() {
    const start = this._start;
    const control = this._control;
    const end = this._end;
    const startIsEnd = start.equals(end);
    const startIsControl = start.equals(control);
    const endIsControl = start.equals(control);
    if (startIsEnd && startIsControl) {
      // all same points
      return [];
    } else if (startIsEnd) {
      // this is a special collinear case, we basically line out to the farthest point and back
      const halfPoint = this.positionAt(0.5);
      return [new Line(start, halfPoint), new Line(halfPoint, end)];
    } else if (arePointsCollinear(start, control, end)) {
      // if they are collinear, we can reduce to start->control and control->end, or if control is between, just one line segment
      // also, start !== end (handled earlier)
      if (startIsControl || endIsControl) {
        // just a line segment!
        return [new Line(start, end)]; // no extra nondegenerate check since start !== end
      }
      // now control point must be unique. we check to see if our rendered path will be outside of the start->end line segment
      const delta = end.minus(start);
      const p1d = control.minus(start).dot(delta.normalized()) / delta.magnitude;
      const t = Quadratic.extremaT(0, p1d, 1);
      if (!isNaN(t) && t > 0 && t < 1) {
        // we have a local max inside the range, indicating that our extrema point is outside of start->end
        // we'll line to and from it
        const pt = this.positionAt(t);
        return _.flatten([new Line(start, pt).getNondegenerateSegments(), new Line(pt, end).getNondegenerateSegments()]);
      } else {
        // just provide a line segment, our rendered path doesn't go outside of this
        return [new Line(start, end)]; // no extra nondegenerate check since start !== end
      }
    } else {
      return [this];
    }
  }

  /**
   * Returns the bounds of this segment.
   */
  getBounds() {
    // calculate our temporary guaranteed lower bounds based on the end points
    if (this._bounds === null) {
      this._bounds = new Bounds2(Math.min(this._start.x, this._end.x), Math.min(this._start.y, this._end.y), Math.max(this._start.x, this._end.x), Math.max(this._start.y, this._end.y));

      // compute x and y where the derivative is 0, so we can include this in the bounds
      const tCriticalX = this.getTCriticalX();
      const tCriticalY = this.getTCriticalY();
      if (!isNaN(tCriticalX) && tCriticalX > 0 && tCriticalX < 1) {
        this._bounds = this._bounds.withPoint(this.positionAt(tCriticalX));
      }
      if (!isNaN(tCriticalY) && tCriticalY > 0 && tCriticalY < 1) {
        this._bounds = this._bounds.withPoint(this.positionAt(tCriticalY));
      }
    }
    return this._bounds;
  }
  get bounds() {
    return this.getBounds();
  }

  // see http://www.visgraf.impa.br/sibgrapi96/trabs/pdf/a14.pdf
  // and http://math.stackexchange.com/questions/12186/arc-length-of-bezier-curves for curvature / arc length

  /**
   * Returns an array of quadratic that are offset to this quadratic by a distance r
   *
   * @param r - distance
   * @param reverse
   */
  offsetTo(r, reverse) {
    // TODO: implement more accurate method at http://www.antigrain.com/research/adaptive_bezier/index.html https://github.com/phetsims/kite/issues/76
    // TODO: or more recently (and relevantly): http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf https://github.com/phetsims/kite/issues/76
    let curves = [this];

    // subdivide this curve
    const depth = 5; // generates 2^depth curves
    for (let i = 0; i < depth; i++) {
      curves = _.flatten(_.map(curves, curve => curve.subdivided(0.5)));
    }
    let offsetCurves = _.map(curves, curve => curve.approximateOffset(r));
    if (reverse) {
      offsetCurves.reverse();
      offsetCurves = _.map(offsetCurves, curve => curve.reversed());
    }
    return offsetCurves;
  }

  /**
   * Elevation of this quadratic Bezier curve to a cubic Bezier curve
   */
  degreeElevated() {
    // TODO: allocation reduction https://github.com/phetsims/kite/issues/76
    return new Cubic(this._start, this._start.plus(this._control.timesScalar(2)).dividedScalar(3), this._end.plus(this._control.timesScalar(2)).dividedScalar(3), this._end);
  }

  /**
   * @param r - distance
   */
  approximateOffset(r) {
    return new Quadratic(this._start.plus((this._start.equals(this._control) ? this._end.minus(this._start) : this._control.minus(this._start)).perpendicular.normalized().times(r)), this._control.plus(this._end.minus(this._start).perpendicular.normalized().times(r)), this._end.plus((this._end.equals(this._control) ? this._end.minus(this._start) : this._end.minus(this._control)).perpendicular.normalized().times(r)));
  }

  /**
   * Returns a string containing the SVG path. assumes that the start point is already provided, so anything that calls this needs to put the M calls first
   */
  getSVGPathFragment() {
    let oldPathFragment;
    if (assert) {
      oldPathFragment = this._svgPathFragment;
      this._svgPathFragment = null;
    }
    if (!this._svgPathFragment) {
      this._svgPathFragment = `Q ${svgNumber(this._control.x)} ${svgNumber(this._control.y)} ${svgNumber(this._end.x)} ${svgNumber(this._end.y)}`;
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
  getInteriorExtremaTs() {
    // TODO: we assume here we are reduce, so that a criticalX doesn't equal a criticalY? https://github.com/phetsims/kite/issues/76
    const result = [];
    const epsilon = 0.0000000001; // TODO: general kite epsilon? https://github.com/phetsims/kite/issues/76

    const criticalX = this.getTCriticalX();
    const criticalY = this.getTCriticalY();
    if (!isNaN(criticalX) && criticalX > epsilon && criticalX < 1 - epsilon) {
      result.push(this.tCriticalX);
    }
    if (!isNaN(criticalY) && criticalY > epsilon && criticalY < 1 - epsilon) {
      result.push(this.tCriticalY);
    }
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
    const p1 = inverseMatrix.timesVector2(this._control);
    const p2 = inverseMatrix.timesVector2(this._end);

    //(1-t)^2 start + 2(1-t)t control + t^2 end
    const a = p0.y - 2 * p1.y + p2.y;
    const b = -2 * p0.y + 2 * p1.y;
    const c = p0.y;
    const ts = solveQuadraticRootsReal(a, b, c);
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
    context.quadraticCurveTo(this._control.x, this._control.y, this._end.x, this._end.y);
  }

  /**
   * Returns a new quadratic that represents this quadratic after transformation by the matrix
   */
  transformed(matrix) {
    return new Quadratic(matrix.timesVector2(this._start), matrix.timesVector2(this._control), matrix.timesVector2(this._end));
  }

  /**
   * Returns the contribution to the signed area computed using Green's Theorem, with P=-y/2 and Q=x/2.
   *
   * NOTE: This is this segment's contribution to the line integral (-y/2 dx + x/2 dy).
   */
  getSignedAreaFragment() {
    return 1 / 6 * (this._start.x * (2 * this._control.y + this._end.y) + this._control.x * (-2 * this._start.y + 2 * this._end.y) + this._end.x * (-this._start.y - 2 * this._control.y));
  }

  /**
   * Given the current curve parameterized by t, will return a curve parameterized by x where t = a * x + b
   */
  reparameterized(a, b) {
    // to the polynomial pt^2 + qt + r:
    const p = this._start.plus(this._end.plus(this._control.timesScalar(-2)));
    const q = this._control.minus(this._start).timesScalar(2);
    const r = this._start;

    // to the polynomial alpha*x^2 + beta*x + gamma:
    const alpha = p.timesScalar(a * a);
    const beta = p.timesScalar(a * b).timesScalar(2).plus(q.timesScalar(a));
    const gamma = p.timesScalar(b * b).plus(q.timesScalar(b)).plus(r);

    // back to the form start,control,end
    return new Quadratic(gamma, beta.timesScalar(0.5).plus(gamma), alpha.plus(beta).plus(gamma));
  }

  /**
   * Returns a reversed copy of this segment (mapping the parametrization from [0,1] => [1,0]).
   */
  reversed() {
    return new Quadratic(this._end, this._control, this._start);
  }

  /**
   * Returns an object form that can be turned back into a segment with the corresponding deserialize method.
   */
  serialize() {
    return {
      type: 'Quadratic',
      startX: this._start.x,
      startY: this._start.y,
      controlX: this._control.x,
      controlY: this._control.y,
      endX: this._end.x,
      endY: this._end.y
    };
  }

  /**
   * Determine whether two lines overlap over a continuous section, and if so finds the a,b pair such that
   * p( t ) === q( a * t + b ).
   *
   * @param segment
   * @param [epsilon] - Will return overlaps only if no two corresponding points differ by this amount or more in one component.
   * @returns - The solution, if there is one (and only one)
   */
  getOverlaps(segment, epsilon = 1e-6) {
    if (segment instanceof Quadratic) {
      return Quadratic.getOverlaps(this, segment);
    }
    return null;
  }

  /**
   * Returns a Quadratic from the serialized representation.
   */
  static deserialize(obj) {
    assert && assert(obj.type === 'Quadratic');
    return new Quadratic(new Vector2(obj.startX, obj.startY), new Vector2(obj.controlX, obj.controlY), new Vector2(obj.endX, obj.endY));
  }

  /**
   * One-dimensional solution to extrema
   */
  static extremaT(start, control, end) {
    // compute t where the derivative is 0 (used for bounds and other things)
    const divisorX = 2 * (end - 2 * control + start);
    if (divisorX !== 0) {
      return -2 * (control - start) / divisorX;
    } else {
      return NaN;
    }
  }

  /**
   * Determine whether two Quadratics overlap over a continuous section, and if so finds the a,b pair such that
   * p( t ) === q( a * t + b ).
   *
   * NOTE: for this particular function, we assume we're not degenerate. Things may work if we can be degree-reduced
   * to a quadratic, but generally that shouldn't be done.
   *
   * @param quadratic1
   * @param quadratic2
   * @param [epsilon] - Will return overlaps only if no two corresponding points differ by this amount or more
   *                             in one component.
   * @returns - The solution, if there is one (and only one)
   */
  static getOverlaps(quadratic1, quadratic2, epsilon = 1e-6) {
    /*
     * NOTE: For implementation details in this function, please see Cubic.getOverlaps. It goes over all of the
     * same implementation details, but instead our bezier matrix is a 3x3:
     *
     * [  1  0  0 ]
     * [ -2  2  0 ]
     * [  1 -2  1 ]
     *
     * And we use the upper-left section of (at+b) adjustment matrix relevant for the quadratic.
     */

    const noOverlap = [];

    // Efficiently compute the multiplication of the bezier matrix:
    const p0x = quadratic1._start.x;
    const p1x = -2 * quadratic1._start.x + 2 * quadratic1._control.x;
    const p2x = quadratic1._start.x - 2 * quadratic1._control.x + quadratic1._end.x;
    const p0y = quadratic1._start.y;
    const p1y = -2 * quadratic1._start.y + 2 * quadratic1._control.y;
    const p2y = quadratic1._start.y - 2 * quadratic1._control.y + quadratic1._end.y;
    const q0x = quadratic2._start.x;
    const q1x = -2 * quadratic2._start.x + 2 * quadratic2._control.x;
    const q2x = quadratic2._start.x - 2 * quadratic2._control.x + quadratic2._end.x;
    const q0y = quadratic2._start.y;
    const q1y = -2 * quadratic2._start.y + 2 * quadratic2._control.y;
    const q2y = quadratic2._start.y - 2 * quadratic2._control.y + quadratic2._end.y;

    // Determine the candidate overlap (preferring the dimension with the largest variation)
    const xSpread = Math.abs(Math.max(quadratic1._start.x, quadratic1._control.x, quadratic1._end.x, quadratic2._start.x, quadratic2._control.x, quadratic2._end.x) - Math.min(quadratic1._start.x, quadratic1._control.x, quadratic1._end.x, quadratic2._start.x, quadratic2._control.x, quadratic2._end.x));
    const ySpread = Math.abs(Math.max(quadratic1._start.y, quadratic1._control.y, quadratic1._end.y, quadratic2._start.y, quadratic2._control.y, quadratic2._end.y) - Math.min(quadratic1._start.y, quadratic1._control.y, quadratic1._end.y, quadratic2._start.y, quadratic2._control.y, quadratic2._end.y));
    const xOverlap = Segment.polynomialGetOverlapQuadratic(p0x, p1x, p2x, q0x, q1x, q2x);
    const yOverlap = Segment.polynomialGetOverlapQuadratic(p0y, p1y, p2y, q0y, q1y, q2y);
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
    const aa = a * a;
    const bb = b * b;
    const ab2 = 2 * a * b;

    // Compute quadratic coefficients for the difference between p(t) and q(a*t+b)
    const d0x = q0x + b * q1x + bb * q2x - p0x;
    const d1x = a * q1x + ab2 * q2x - p1x;
    const d2x = aa * q2x - p2x;
    const d0y = q0y + b * q1y + bb * q2y - p0y;
    const d1y = a * q1y + ab2 * q2y - p1y;
    const d2y = aa * q2y - p2y;

    // Find the t values where extremes lie in the [0,1] range for each 1-dimensional quadratic. We do this by
    // differentiating the quadratic and finding the roots of the resulting line.
    const xRoots = Utils.solveLinearRootsReal(2 * d2x, d1x);
    const yRoots = Utils.solveLinearRootsReal(2 * d2y, d1y);
    const xExtremeTs = _.uniq([0, 1].concat(xRoots ? xRoots.filter(isBetween0And1) : []));
    const yExtremeTs = _.uniq([0, 1].concat(yRoots ? yRoots.filter(isBetween0And1) : []));

    // Examine the single-coordinate distances between the "overlaps" at each extreme T value. If the distance is larger
    // than our epsilon, then the "overlap" would not be valid.
    for (let i = 0; i < xExtremeTs.length; i++) {
      const t = xExtremeTs[i];
      if (Math.abs((d2x * t + d1x) * t + d0x) > epsilon) {
        return noOverlap;
      }
    }
    for (let i = 0; i < yExtremeTs.length; i++) {
      const t = yExtremeTs[i];
      if (Math.abs((d2y * t + d1y) * t + d0y) > epsilon) {
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

  // Degree of the polynomial (quadratic)
}
Quadratic.prototype.degree = 2;
kite.register('Quadratic', Quadratic);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiTWF0cml4MyIsIlV0aWxzIiwiVmVjdG9yMiIsIkN1YmljIiwia2l0ZSIsIkxpbmUiLCJPdmVybGFwIiwiUmF5SW50ZXJzZWN0aW9uIiwiU2VnbWVudCIsInN2Z051bWJlciIsInNvbHZlUXVhZHJhdGljUm9vdHNSZWFsIiwiYXJlUG9pbnRzQ29sbGluZWFyIiwiaXNCZXR3ZWVuMEFuZDEiLCJ0IiwiUXVhZHJhdGljIiwiY29uc3RydWN0b3IiLCJzdGFydCIsImNvbnRyb2wiLCJlbmQiLCJfc3RhcnQiLCJfY29udHJvbCIsIl9lbmQiLCJpbnZhbGlkYXRlIiwic2V0U3RhcnQiLCJhc3NlcnQiLCJpc0Zpbml0ZSIsInRvU3RyaW5nIiwiZXF1YWxzIiwidmFsdWUiLCJnZXRTdGFydCIsInNldENvbnRyb2wiLCJnZXRDb250cm9sIiwic2V0RW5kIiwiZ2V0RW5kIiwicG9zaXRpb25BdCIsIm10IiwidGltZXMiLCJwbHVzIiwidGFuZ2VudEF0IiwibWludXMiLCJjdXJ2YXR1cmVBdCIsImVwc2lsb24iLCJNYXRoIiwiYWJzIiwiaXNaZXJvIiwicDAiLCJwMSIsInAyIiwiZDEwIiwiYSIsIm1hZ25pdHVkZSIsImgiLCJwZXJwZW5kaWN1bGFyIiwibm9ybWFsaXplZCIsImRvdCIsImRlZ3JlZSIsInN1YmRpdmlkZWQiLCJsZWZ0TWlkIiwiYmxlbmQiLCJyaWdodE1pZCIsIm1pZCIsIl9zdGFydFRhbmdlbnQiLCJfZW5kVGFuZ2VudCIsIl90Q3JpdGljYWxYIiwiX3RDcml0aWNhbFkiLCJfYm91bmRzIiwiX3N2Z1BhdGhGcmFnbWVudCIsImludmFsaWRhdGlvbkVtaXR0ZXIiLCJlbWl0IiwiZ2V0U3RhcnRUYW5nZW50IiwiY29udHJvbElzU3RhcnQiLCJzdGFydFRhbmdlbnQiLCJnZXRFbmRUYW5nZW50IiwiY29udHJvbElzRW5kIiwiZW5kVGFuZ2VudCIsImdldFRDcml0aWNhbFgiLCJleHRyZW1hVCIsIngiLCJ0Q3JpdGljYWxYIiwiZ2V0VENyaXRpY2FsWSIsInkiLCJ0Q3JpdGljYWxZIiwiZ2V0Tm9uZGVnZW5lcmF0ZVNlZ21lbnRzIiwic3RhcnRJc0VuZCIsInN0YXJ0SXNDb250cm9sIiwiZW5kSXNDb250cm9sIiwiaGFsZlBvaW50IiwiZGVsdGEiLCJwMWQiLCJpc05hTiIsInB0IiwiXyIsImZsYXR0ZW4iLCJnZXRCb3VuZHMiLCJtaW4iLCJtYXgiLCJ3aXRoUG9pbnQiLCJib3VuZHMiLCJvZmZzZXRUbyIsInIiLCJyZXZlcnNlIiwiY3VydmVzIiwiZGVwdGgiLCJpIiwibWFwIiwiY3VydmUiLCJvZmZzZXRDdXJ2ZXMiLCJhcHByb3hpbWF0ZU9mZnNldCIsInJldmVyc2VkIiwiZGVncmVlRWxldmF0ZWQiLCJ0aW1lc1NjYWxhciIsImRpdmlkZWRTY2FsYXIiLCJnZXRTVkdQYXRoRnJhZ21lbnQiLCJvbGRQYXRoRnJhZ21lbnQiLCJzdHJva2VMZWZ0IiwibGluZVdpZHRoIiwic3Ryb2tlUmlnaHQiLCJnZXRJbnRlcmlvckV4dHJlbWFUcyIsInJlc3VsdCIsImNyaXRpY2FsWCIsImNyaXRpY2FsWSIsInB1c2giLCJzb3J0IiwiaW50ZXJzZWN0aW9uIiwicmF5IiwiaW52ZXJzZU1hdHJpeCIsInJvdGF0aW9uMiIsImRpcmVjdGlvbiIsImFuZ2xlIiwidGltZXNNYXRyaXgiLCJ0cmFuc2xhdGlvbiIsInBvc2l0aW9uIiwidGltZXNWZWN0b3IyIiwiYiIsImMiLCJ0cyIsImVhY2giLCJoaXRQb2ludCIsInVuaXRUYW5nZW50IiwicGVycCIsInRvSGl0Iiwibm9ybWFsIiwibmVnYXRlZCIsIndpbmQiLCJ3aW5kaW5nSW50ZXJzZWN0aW9uIiwiaGl0cyIsImhpdCIsIndyaXRlVG9Db250ZXh0IiwiY29udGV4dCIsInF1YWRyYXRpY0N1cnZlVG8iLCJ0cmFuc2Zvcm1lZCIsIm1hdHJpeCIsImdldFNpZ25lZEFyZWFGcmFnbWVudCIsInJlcGFyYW1ldGVyaXplZCIsInAiLCJxIiwiYWxwaGEiLCJiZXRhIiwiZ2FtbWEiLCJzZXJpYWxpemUiLCJ0eXBlIiwic3RhcnRYIiwic3RhcnRZIiwiY29udHJvbFgiLCJjb250cm9sWSIsImVuZFgiLCJlbmRZIiwiZ2V0T3ZlcmxhcHMiLCJzZWdtZW50IiwiZGVzZXJpYWxpemUiLCJvYmoiLCJkaXZpc29yWCIsIk5hTiIsInF1YWRyYXRpYzEiLCJxdWFkcmF0aWMyIiwibm9PdmVybGFwIiwicDB4IiwicDF4IiwicDJ4IiwicDB5IiwicDF5IiwicDJ5IiwicTB4IiwicTF4IiwicTJ4IiwicTB5IiwicTF5IiwicTJ5IiwieFNwcmVhZCIsInlTcHJlYWQiLCJ4T3ZlcmxhcCIsInBvbHlub21pYWxHZXRPdmVybGFwUXVhZHJhdGljIiwieU92ZXJsYXAiLCJvdmVybGFwIiwiYWEiLCJiYiIsImFiMiIsImQweCIsImQxeCIsImQyeCIsImQweSIsImQxeSIsImQyeSIsInhSb290cyIsInNvbHZlTGluZWFyUm9vdHNSZWFsIiwieVJvb3RzIiwieEV4dHJlbWVUcyIsInVuaXEiLCJjb25jYXQiLCJmaWx0ZXIiLCJ5RXh0cmVtZVRzIiwibGVuZ3RoIiwicXQwIiwicXQxIiwicHJvdG90eXBlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJRdWFkcmF0aWMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUXVhZHJhdGljIEJlemllciBzZWdtZW50XHJcbiAqXHJcbiAqIEdvb2QgcmVmZXJlbmNlOiBodHRwOi8vY2FnZC5jcy5ieXUuZWR1L341NTcvdGV4dC9jaDIucGRmXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBNYXRyaXgzIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9NYXRyaXgzLmpzJztcclxuaW1wb3J0IFJheTIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1JheTIuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgeyBDdWJpYywga2l0ZSwgTGluZSwgT3ZlcmxhcCwgUmF5SW50ZXJzZWN0aW9uLCBTZWdtZW50LCBzdmdOdW1iZXIgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBzb2x2ZVF1YWRyYXRpY1Jvb3RzUmVhbCA9IFV0aWxzLnNvbHZlUXVhZHJhdGljUm9vdHNSZWFsO1xyXG5jb25zdCBhcmVQb2ludHNDb2xsaW5lYXIgPSBVdGlscy5hcmVQb2ludHNDb2xsaW5lYXI7XHJcblxyXG4vLyBVc2VkIGluIG11bHRpcGxlIGZpbHRlcnNcclxuZnVuY3Rpb24gaXNCZXR3ZWVuMEFuZDEoIHQ6IG51bWJlciApOiBib29sZWFuIHtcclxuICByZXR1cm4gdCA+PSAwICYmIHQgPD0gMTtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgU2VyaWFsaXplZFF1YWRyYXRpYyA9IHtcclxuICB0eXBlOiAnUXVhZHJhdGljJztcclxuICBzdGFydFg6IG51bWJlcjtcclxuICBzdGFydFk6IG51bWJlcjtcclxuICBjb250cm9sWDogbnVtYmVyO1xyXG4gIGNvbnRyb2xZOiBudW1iZXI7XHJcbiAgZW5kWDogbnVtYmVyO1xyXG4gIGVuZFk6IG51bWJlcjtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFF1YWRyYXRpYyBleHRlbmRzIFNlZ21lbnQge1xyXG5cclxuICBwcml2YXRlIF9zdGFydDogVmVjdG9yMjtcclxuICBwcml2YXRlIF9jb250cm9sOiBWZWN0b3IyO1xyXG4gIHByaXZhdGUgX2VuZDogVmVjdG9yMjtcclxuXHJcbiAgLy8gTGF6aWx5LWNvbXB1dGVkIGRlcml2ZWQgaW5mb3JtYXRpb25cclxuICBwcml2YXRlIF9zdGFydFRhbmdlbnQhOiBWZWN0b3IyIHwgbnVsbDtcclxuICBwcml2YXRlIF9lbmRUYW5nZW50ITogVmVjdG9yMiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBfdENyaXRpY2FsWCE6IG51bWJlciB8IG51bGw7IC8vIFQgd2hlcmUgeC1kZXJpdmF0aXZlIGlzIDAgKHJlcGxhY2VkIHdpdGggTmFOIGlmIG5vdCBpbiByYW5nZSlcclxuICBwcml2YXRlIF90Q3JpdGljYWxZITogbnVtYmVyIHwgbnVsbDsgLy8gVCB3aGVyZSB5LWRlcml2YXRpdmUgaXMgMCAocmVwbGFjZWQgd2l0aCBOYU4gaWYgbm90IGluIHJhbmdlKVxyXG4gIHByaXZhdGUgX2JvdW5kcyE6IEJvdW5kczIgfCBudWxsO1xyXG4gIHByaXZhdGUgX3N2Z1BhdGhGcmFnbWVudCE6IHN0cmluZyB8IG51bGw7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBzdGFydCAtIFN0YXJ0IHBvaW50IG9mIHRoZSBxdWFkcmF0aWMgYmV6aWVyXHJcbiAgICogQHBhcmFtIGNvbnRyb2wgLSBDb250cm9sIHBvaW50IChjdXJ2ZSB1c3VhbGx5IGRvZXNuJ3QgZ28gdGhyb3VnaCBoZXJlKVxyXG4gICAqIEBwYXJhbSBlbmQgLSBFbmQgcG9pbnQgb2YgdGhlIHF1YWRyYXRpYyBiZXppZXJcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHN0YXJ0OiBWZWN0b3IyLCBjb250cm9sOiBWZWN0b3IyLCBlbmQ6IFZlY3RvcjIgKSB7XHJcbiAgICBzdXBlcigpO1xyXG5cclxuICAgIHRoaXMuX3N0YXJ0ID0gc3RhcnQ7XHJcbiAgICB0aGlzLl9jb250cm9sID0gY29udHJvbDtcclxuICAgIHRoaXMuX2VuZCA9IGVuZDtcclxuXHJcbiAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHN0YXJ0IHBvaW50IG9mIHRoZSBRdWFkcmF0aWMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFN0YXJ0KCBzdGFydDogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHN0YXJ0LmlzRmluaXRlKCksIGBRdWFkcmF0aWMgc3RhcnQgc2hvdWxkIGJlIGZpbml0ZTogJHtzdGFydC50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICBpZiAoICF0aGlzLl9zdGFydC5lcXVhbHMoIHN0YXJ0ICkgKSB7XHJcbiAgICAgIHRoaXMuX3N0YXJ0ID0gc3RhcnQ7XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHN0YXJ0KCB2YWx1ZTogVmVjdG9yMiApIHsgdGhpcy5zZXRTdGFydCggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHN0YXJ0KCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRTdGFydCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHN0YXJ0IG9mIHRoaXMgUXVhZHJhdGljLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTdGFydCgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLl9zdGFydDtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBjb250cm9sIHBvaW50IG9mIHRoZSBRdWFkcmF0aWMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldENvbnRyb2woIGNvbnRyb2w6IFZlY3RvcjIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBjb250cm9sLmlzRmluaXRlKCksIGBRdWFkcmF0aWMgY29udHJvbCBzaG91bGQgYmUgZmluaXRlOiAke2NvbnRyb2wudG9TdHJpbmcoKX1gICk7XHJcblxyXG4gICAgaWYgKCAhdGhpcy5fY29udHJvbC5lcXVhbHMoIGNvbnRyb2wgKSApIHtcclxuICAgICAgdGhpcy5fY29udHJvbCA9IGNvbnRyb2w7XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGNvbnRyb2woIHZhbHVlOiBWZWN0b3IyICkgeyB0aGlzLnNldENvbnRyb2woIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBjb250cm9sKCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRDb250cm9sKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY29udHJvbCBwb2ludCBvZiB0aGlzIFF1YWRyYXRpYy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q29udHJvbCgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLl9jb250cm9sO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGVuZCBwb2ludCBvZiB0aGUgUXVhZHJhdGljLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRFbmQoIGVuZDogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGVuZC5pc0Zpbml0ZSgpLCBgUXVhZHJhdGljIGVuZCBzaG91bGQgYmUgZmluaXRlOiAke2VuZC50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICBpZiAoICF0aGlzLl9lbmQuZXF1YWxzKCBlbmQgKSApIHtcclxuICAgICAgdGhpcy5fZW5kID0gZW5kO1xyXG4gICAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBlbmQoIHZhbHVlOiBWZWN0b3IyICkgeyB0aGlzLnNldEVuZCggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGVuZCgpOiBWZWN0b3IyIHsgcmV0dXJuIHRoaXMuZ2V0RW5kKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZW5kIG9mIHRoaXMgUXVhZHJhdGljLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFbmQoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5fZW5kO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHBvc2l0aW9uIHBhcmFtZXRyaWNhbGx5LCB3aXRoIDAgPD0gdCA8PSAxLlxyXG4gICAqXHJcbiAgICogTk9URTogcG9zaXRpb25BdCggMCApIHdpbGwgcmV0dXJuIHRoZSBzdGFydCBvZiB0aGUgc2VnbWVudCwgYW5kIHBvc2l0aW9uQXQoIDEgKSB3aWxsIHJldHVybiB0aGUgZW5kIG9mIHRoZVxyXG4gICAqIHNlZ21lbnQuXHJcbiAgICpcclxuICAgKiBUaGlzIG1ldGhvZCBpcyBwYXJ0IG9mIHRoZSBTZWdtZW50IEFQSS4gU2VlIFNlZ21lbnQuanMncyBjb25zdHJ1Y3RvciBmb3IgbW9yZSBBUEkgZG9jdW1lbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgcG9zaXRpb25BdCggdDogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA+PSAwLCAncG9zaXRpb25BdCB0IHNob3VsZCBiZSBub24tbmVnYXRpdmUnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0IDw9IDEsICdwb3NpdGlvbkF0IHQgc2hvdWxkIGJlIG5vIGdyZWF0ZXIgdGhhbiAxJyApO1xyXG5cclxuICAgIGNvbnN0IG10ID0gMSAtIHQ7XHJcbiAgICAvLyBkZXNjcmliZWQgZnJvbSB0PVswLDFdIGFzOiAoMS10KV4yIHN0YXJ0ICsgMigxLXQpdCBjb250cm9sICsgdF4yIGVuZFxyXG4gICAgLy8gVE9ETzogYWxsb2NhdGlvbiByZWR1Y3Rpb24gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICByZXR1cm4gdGhpcy5fc3RhcnQudGltZXMoIG10ICogbXQgKS5wbHVzKCB0aGlzLl9jb250cm9sLnRpbWVzKCAyICogbXQgKiB0ICkgKS5wbHVzKCB0aGlzLl9lbmQudGltZXMoIHQgKiB0ICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG5vbi1ub3JtYWxpemVkIHRhbmdlbnQgKGR4L2R0LCBkeS9kdCkgb2YgdGhpcyBzZWdtZW50IGF0IHRoZSBwYXJhbWV0cmljIHZhbHVlIG9mIHQsIHdpdGggMCA8PSB0IDw9IDEuXHJcbiAgICpcclxuICAgKiBOT1RFOiB0YW5nZW50QXQoIDAgKSB3aWxsIHJldHVybiB0aGUgdGFuZ2VudCBhdCB0aGUgc3RhcnQgb2YgdGhlIHNlZ21lbnQsIGFuZCB0YW5nZW50QXQoIDEgKSB3aWxsIHJldHVybiB0aGVcclxuICAgKiB0YW5nZW50IGF0IHRoZSBlbmQgb2YgdGhlIHNlZ21lbnQuXHJcbiAgICpcclxuICAgKiBUaGlzIG1ldGhvZCBpcyBwYXJ0IG9mIHRoZSBTZWdtZW50IEFQSS4gU2VlIFNlZ21lbnQuanMncyBjb25zdHJ1Y3RvciBmb3IgbW9yZSBBUEkgZG9jdW1lbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgdGFuZ2VudEF0KCB0OiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0ID49IDAsICd0YW5nZW50QXQgdCBzaG91bGQgYmUgbm9uLW5lZ2F0aXZlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA8PSAxLCAndGFuZ2VudEF0IHQgc2hvdWxkIGJlIG5vIGdyZWF0ZXIgdGhhbiAxJyApO1xyXG5cclxuICAgIC8vIEZvciBhIHF1YWRyYXRpYyBjdXJ2ZSwgdGhlIGRlcml2YXRpdmUgaXMgZ2l2ZW4gYnkgOiAyKDEtdCkoIGNvbnRyb2wgLSBzdGFydCApICsgMnQoIGVuZCAtIGNvbnRyb2wgKVxyXG4gICAgLy8gVE9ETzogYWxsb2NhdGlvbiByZWR1Y3Rpb24gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICByZXR1cm4gdGhpcy5fY29udHJvbC5taW51cyggdGhpcy5fc3RhcnQgKS50aW1lcyggMiAqICggMSAtIHQgKSApLnBsdXMoIHRoaXMuX2VuZC5taW51cyggdGhpcy5fY29udHJvbCApLnRpbWVzKCAyICogdCApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBzaWduZWQgY3VydmF0dXJlIG9mIHRoZSBzZWdtZW50IGF0IHRoZSBwYXJhbWV0cmljIHZhbHVlIHQsIHdoZXJlIDAgPD0gdCA8PSAxLlxyXG4gICAqXHJcbiAgICogVGhlIGN1cnZhdHVyZSB3aWxsIGJlIHBvc2l0aXZlIGZvciB2aXN1YWwgY2xvY2t3aXNlIC8gbWF0aGVtYXRpY2FsIGNvdW50ZXJjbG9ja3dpc2UgY3VydmVzLCBuZWdhdGl2ZSBmb3Igb3Bwb3NpdGVcclxuICAgKiBjdXJ2YXR1cmUsIGFuZCAwIGZvciBubyBjdXJ2YXR1cmUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBjdXJ2YXR1cmVBdCggMCApIHdpbGwgcmV0dXJuIHRoZSBjdXJ2YXR1cmUgYXQgdGhlIHN0YXJ0IG9mIHRoZSBzZWdtZW50LCBhbmQgY3VydmF0dXJlQXQoIDEgKSB3aWxsIHJldHVyblxyXG4gICAqIHRoZSBjdXJ2YXR1cmUgYXQgdGhlIGVuZCBvZiB0aGUgc2VnbWVudC5cclxuICAgKlxyXG4gICAqIFRoaXMgbWV0aG9kIGlzIHBhcnQgb2YgdGhlIFNlZ21lbnQgQVBJLiBTZWUgU2VnbWVudC5qcydzIGNvbnN0cnVjdG9yIGZvciBtb3JlIEFQSSBkb2N1bWVudGF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjdXJ2YXR1cmVBdCggdDogbnVtYmVyICk6IG51bWJlciB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0ID49IDAsICdjdXJ2YXR1cmVBdCB0IHNob3VsZCBiZSBub24tbmVnYXRpdmUnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0IDw9IDEsICdjdXJ2YXR1cmVBdCB0IHNob3VsZCBiZSBubyBncmVhdGVyIHRoYW4gMScgKTtcclxuXHJcbiAgICAvLyBzZWUgaHR0cDovL2NhZ2QuY3MuYnl1LmVkdS9+NTU3L3RleHQvY2gyLnBkZiBwMzFcclxuICAgIC8vIFRPRE86IHJlbW92ZSBjb2RlIGR1cGxpY2F0aW9uIHdpdGggQ3ViaWMgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICBjb25zdCBlcHNpbG9uID0gMC4wMDAwMDAxO1xyXG4gICAgaWYgKCBNYXRoLmFicyggdCAtIDAuNSApID4gMC41IC0gZXBzaWxvbiApIHtcclxuICAgICAgY29uc3QgaXNaZXJvID0gdCA8IDAuNTtcclxuICAgICAgY29uc3QgcDAgPSBpc1plcm8gPyB0aGlzLl9zdGFydCA6IHRoaXMuX2VuZDtcclxuICAgICAgY29uc3QgcDEgPSB0aGlzLl9jb250cm9sO1xyXG4gICAgICBjb25zdCBwMiA9IGlzWmVybyA/IHRoaXMuX2VuZCA6IHRoaXMuX3N0YXJ0O1xyXG4gICAgICBjb25zdCBkMTAgPSBwMS5taW51cyggcDAgKTtcclxuICAgICAgY29uc3QgYSA9IGQxMC5tYWduaXR1ZGU7XHJcbiAgICAgIGNvbnN0IGggPSAoIGlzWmVybyA/IC0xIDogMSApICogZDEwLnBlcnBlbmRpY3VsYXIubm9ybWFsaXplZCgpLmRvdCggcDIubWludXMoIHAxICkgKTtcclxuICAgICAgcmV0dXJuICggaCAqICggdGhpcy5kZWdyZWUgLSAxICkgKSAvICggdGhpcy5kZWdyZWUgKiBhICogYSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN1YmRpdmlkZWQoIHQgKVsgMCBdLmN1cnZhdHVyZUF0KCAxICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IHdpdGggdXAgdG8gMiBzdWItc2VnbWVudHMsIHNwbGl0IGF0IHRoZSBwYXJhbWV0cmljIHQgdmFsdWUuIFRvZ2V0aGVyIChpbiBvcmRlcikgdGhleSBzaG91bGQgbWFrZVxyXG4gICAqIHVwIHRoZSBzYW1lIHNoYXBlIGFzIHRoZSBjdXJyZW50IHNlZ21lbnQuXHJcbiAgICpcclxuICAgKiBUaGlzIG1ldGhvZCBpcyBwYXJ0IG9mIHRoZSBTZWdtZW50IEFQSS4gU2VlIFNlZ21lbnQuanMncyBjb25zdHJ1Y3RvciBmb3IgbW9yZSBBUEkgZG9jdW1lbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgc3ViZGl2aWRlZCggdDogbnVtYmVyICk6IFF1YWRyYXRpY1tdIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPj0gMCwgJ3N1YmRpdmlkZWQgdCBzaG91bGQgYmUgbm9uLW5lZ2F0aXZlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA8PSAxLCAnc3ViZGl2aWRlZCB0IHNob3VsZCBiZSBubyBncmVhdGVyIHRoYW4gMScgKTtcclxuXHJcbiAgICAvLyBJZiB0IGlzIDAgb3IgMSwgd2Ugb25seSBuZWVkIHRvIHJldHVybiAxIHNlZ21lbnRcclxuICAgIGlmICggdCA9PT0gMCB8fCB0ID09PSAxICkge1xyXG4gICAgICByZXR1cm4gWyB0aGlzIF07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZGUgQ2FzdGVsamF1IG1ldGhvZFxyXG4gICAgY29uc3QgbGVmdE1pZCA9IHRoaXMuX3N0YXJ0LmJsZW5kKCB0aGlzLl9jb250cm9sLCB0ICk7XHJcbiAgICBjb25zdCByaWdodE1pZCA9IHRoaXMuX2NvbnRyb2wuYmxlbmQoIHRoaXMuX2VuZCwgdCApO1xyXG4gICAgY29uc3QgbWlkID0gbGVmdE1pZC5ibGVuZCggcmlnaHRNaWQsIHQgKTtcclxuICAgIHJldHVybiBbXHJcbiAgICAgIG5ldyBRdWFkcmF0aWMoIHRoaXMuX3N0YXJ0LCBsZWZ0TWlkLCBtaWQgKSxcclxuICAgICAgbmV3IFF1YWRyYXRpYyggbWlkLCByaWdodE1pZCwgdGhpcy5fZW5kIClcclxuICAgIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbGVhcnMgY2FjaGVkIGluZm9ybWF0aW9uLCBzaG91bGQgYmUgY2FsbGVkIHdoZW4gYW55IG9mIHRoZSAnY29uc3RydWN0b3IgYXJndW1lbnRzJyBhcmUgbXV0YXRlZC5cclxuICAgKi9cclxuICBwdWJsaWMgaW52YWxpZGF0ZSgpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3N0YXJ0IGluc3RhbmNlb2YgVmVjdG9yMiwgYFF1YWRyYXRpYyBzdGFydCBzaG91bGQgYmUgYSBWZWN0b3IyOiAke3RoaXMuX3N0YXJ0fWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3N0YXJ0LmlzRmluaXRlKCksIGBRdWFkcmF0aWMgc3RhcnQgc2hvdWxkIGJlIGZpbml0ZTogJHt0aGlzLl9zdGFydC50b1N0cmluZygpfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2NvbnRyb2wgaW5zdGFuY2VvZiBWZWN0b3IyLCBgUXVhZHJhdGljIGNvbnRyb2wgc2hvdWxkIGJlIGEgVmVjdG9yMjogJHt0aGlzLl9jb250cm9sfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2NvbnRyb2wuaXNGaW5pdGUoKSwgYFF1YWRyYXRpYyBjb250cm9sIHNob3VsZCBiZSBmaW5pdGU6ICR7dGhpcy5fY29udHJvbC50b1N0cmluZygpfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2VuZCBpbnN0YW5jZW9mIFZlY3RvcjIsIGBRdWFkcmF0aWMgZW5kIHNob3VsZCBiZSBhIFZlY3RvcjI6ICR7dGhpcy5fZW5kfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2VuZC5pc0Zpbml0ZSgpLCBgUXVhZHJhdGljIGVuZCBzaG91bGQgYmUgZmluaXRlOiAke3RoaXMuX2VuZC50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICAvLyBMYXppbHktY29tcHV0ZWQgZGVyaXZlZCBpbmZvcm1hdGlvblxyXG4gICAgdGhpcy5fc3RhcnRUYW5nZW50ID0gbnVsbDtcclxuICAgIHRoaXMuX2VuZFRhbmdlbnQgPSBudWxsO1xyXG4gICAgdGhpcy5fdENyaXRpY2FsWCA9IG51bGw7XHJcbiAgICB0aGlzLl90Q3JpdGljYWxZID0gbnVsbDtcclxuXHJcbiAgICB0aGlzLl9ib3VuZHMgPSBudWxsO1xyXG4gICAgdGhpcy5fc3ZnUGF0aEZyYWdtZW50ID0gbnVsbDtcclxuXHJcbiAgICB0aGlzLmludmFsaWRhdGlvbkVtaXR0ZXIuZW1pdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdGFuZ2VudCB2ZWN0b3IgKG5vcm1hbGl6ZWQpIHRvIHRoZSBzZWdtZW50IGF0IHRoZSBzdGFydCwgcG9pbnRpbmcgaW4gdGhlIGRpcmVjdGlvbiBvZiBtb3Rpb24gKGZyb20gc3RhcnQgdG8gZW5kKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTdGFydFRhbmdlbnQoKTogVmVjdG9yMiB7XHJcbiAgICBpZiAoIHRoaXMuX3N0YXJ0VGFuZ2VudCA9PT0gbnVsbCApIHtcclxuICAgICAgY29uc3QgY29udHJvbElzU3RhcnQgPSB0aGlzLl9zdGFydC5lcXVhbHMoIHRoaXMuX2NvbnRyb2wgKTtcclxuICAgICAgLy8gVE9ETzogYWxsb2NhdGlvbiByZWR1Y3Rpb24gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICAgIHRoaXMuX3N0YXJ0VGFuZ2VudCA9IGNvbnRyb2xJc1N0YXJ0ID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZW5kLm1pbnVzKCB0aGlzLl9zdGFydCApLm5vcm1hbGl6ZWQoKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRyb2wubWludXMoIHRoaXMuX3N0YXJ0ICkubm9ybWFsaXplZCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX3N0YXJ0VGFuZ2VudDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc3RhcnRUYW5nZW50KCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRTdGFydFRhbmdlbnQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB0YW5nZW50IHZlY3RvciAobm9ybWFsaXplZCkgdG8gdGhlIHNlZ21lbnQgYXQgdGhlIGVuZCwgcG9pbnRpbmcgaW4gdGhlIGRpcmVjdGlvbiBvZiBtb3Rpb24gKGZyb20gc3RhcnQgdG8gZW5kKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFbmRUYW5nZW50KCk6IFZlY3RvcjIge1xyXG4gICAgaWYgKCB0aGlzLl9lbmRUYW5nZW50ID09PSBudWxsICkge1xyXG4gICAgICBjb25zdCBjb250cm9sSXNFbmQgPSB0aGlzLl9lbmQuZXF1YWxzKCB0aGlzLl9jb250cm9sICk7XHJcbiAgICAgIC8vIFRPRE86IGFsbG9jYXRpb24gcmVkdWN0aW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgICB0aGlzLl9lbmRUYW5nZW50ID0gY29udHJvbElzRW5kID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2VuZC5taW51cyggdGhpcy5fc3RhcnQgKS5ub3JtYWxpemVkKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZW5kLm1pbnVzKCB0aGlzLl9jb250cm9sICkubm9ybWFsaXplZCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX2VuZFRhbmdlbnQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGVuZFRhbmdlbnQoKTogVmVjdG9yMiB7IHJldHVybiB0aGlzLmdldEVuZFRhbmdlbnQoKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0VENyaXRpY2FsWCgpOiBudW1iZXIge1xyXG4gICAgLy8gY29tcHV0ZSB4IHdoZXJlIHRoZSBkZXJpdmF0aXZlIGlzIDAgKHVzZWQgZm9yIGJvdW5kcyBhbmQgb3RoZXIgdGhpbmdzKVxyXG4gICAgaWYgKCB0aGlzLl90Q3JpdGljYWxYID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLl90Q3JpdGljYWxYID0gUXVhZHJhdGljLmV4dHJlbWFUKCB0aGlzLl9zdGFydC54LCB0aGlzLl9jb250cm9sLngsIHRoaXMuX2VuZC54ICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fdENyaXRpY2FsWDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgdENyaXRpY2FsWCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRUQ3JpdGljYWxYKCk7IH1cclxuXHJcbiAgcHVibGljIGdldFRDcml0aWNhbFkoKTogbnVtYmVyIHtcclxuICAgIC8vIGNvbXB1dGUgeSB3aGVyZSB0aGUgZGVyaXZhdGl2ZSBpcyAwICh1c2VkIGZvciBib3VuZHMgYW5kIG90aGVyIHRoaW5ncylcclxuICAgIGlmICggdGhpcy5fdENyaXRpY2FsWSA9PT0gbnVsbCApIHtcclxuICAgICAgdGhpcy5fdENyaXRpY2FsWSA9IFF1YWRyYXRpYy5leHRyZW1hVCggdGhpcy5fc3RhcnQueSwgdGhpcy5fY29udHJvbC55LCB0aGlzLl9lbmQueSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX3RDcml0aWNhbFk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHRDcml0aWNhbFkoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0VENyaXRpY2FsWSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBsaXN0IG9mIG5vbi1kZWdlbmVyYXRlIHNlZ21lbnRzIHRoYXQgYXJlIGVxdWl2YWxlbnQgdG8gdGhpcyBzZWdtZW50LiBHZW5lcmFsbHkgZ2V0cyByaWQgKG9yIHNpbXBsaWZpZXMpXHJcbiAgICogaW52YWxpZCBvciByZXBlYXRlZCBzZWdtZW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Tm9uZGVnZW5lcmF0ZVNlZ21lbnRzKCk6IFNlZ21lbnRbXSB7XHJcbiAgICBjb25zdCBzdGFydCA9IHRoaXMuX3N0YXJ0O1xyXG4gICAgY29uc3QgY29udHJvbCA9IHRoaXMuX2NvbnRyb2w7XHJcbiAgICBjb25zdCBlbmQgPSB0aGlzLl9lbmQ7XHJcblxyXG4gICAgY29uc3Qgc3RhcnRJc0VuZCA9IHN0YXJ0LmVxdWFscyggZW5kICk7XHJcbiAgICBjb25zdCBzdGFydElzQ29udHJvbCA9IHN0YXJ0LmVxdWFscyggY29udHJvbCApO1xyXG4gICAgY29uc3QgZW5kSXNDb250cm9sID0gc3RhcnQuZXF1YWxzKCBjb250cm9sICk7XHJcblxyXG4gICAgaWYgKCBzdGFydElzRW5kICYmIHN0YXJ0SXNDb250cm9sICkge1xyXG4gICAgICAvLyBhbGwgc2FtZSBwb2ludHNcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHN0YXJ0SXNFbmQgKSB7XHJcbiAgICAgIC8vIHRoaXMgaXMgYSBzcGVjaWFsIGNvbGxpbmVhciBjYXNlLCB3ZSBiYXNpY2FsbHkgbGluZSBvdXQgdG8gdGhlIGZhcnRoZXN0IHBvaW50IGFuZCBiYWNrXHJcbiAgICAgIGNvbnN0IGhhbGZQb2ludCA9IHRoaXMucG9zaXRpb25BdCggMC41ICk7XHJcbiAgICAgIHJldHVybiBbXHJcbiAgICAgICAgbmV3IExpbmUoIHN0YXJ0LCBoYWxmUG9pbnQgKSxcclxuICAgICAgICBuZXcgTGluZSggaGFsZlBvaW50LCBlbmQgKVxyXG4gICAgICBdO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGFyZVBvaW50c0NvbGxpbmVhciggc3RhcnQsIGNvbnRyb2wsIGVuZCApICkge1xyXG4gICAgICAvLyBpZiB0aGV5IGFyZSBjb2xsaW5lYXIsIHdlIGNhbiByZWR1Y2UgdG8gc3RhcnQtPmNvbnRyb2wgYW5kIGNvbnRyb2wtPmVuZCwgb3IgaWYgY29udHJvbCBpcyBiZXR3ZWVuLCBqdXN0IG9uZSBsaW5lIHNlZ21lbnRcclxuICAgICAgLy8gYWxzbywgc3RhcnQgIT09IGVuZCAoaGFuZGxlZCBlYXJsaWVyKVxyXG4gICAgICBpZiAoIHN0YXJ0SXNDb250cm9sIHx8IGVuZElzQ29udHJvbCApIHtcclxuICAgICAgICAvLyBqdXN0IGEgbGluZSBzZWdtZW50IVxyXG4gICAgICAgIHJldHVybiBbIG5ldyBMaW5lKCBzdGFydCwgZW5kICkgXTsgLy8gbm8gZXh0cmEgbm9uZGVnZW5lcmF0ZSBjaGVjayBzaW5jZSBzdGFydCAhPT0gZW5kXHJcbiAgICAgIH1cclxuICAgICAgLy8gbm93IGNvbnRyb2wgcG9pbnQgbXVzdCBiZSB1bmlxdWUuIHdlIGNoZWNrIHRvIHNlZSBpZiBvdXIgcmVuZGVyZWQgcGF0aCB3aWxsIGJlIG91dHNpZGUgb2YgdGhlIHN0YXJ0LT5lbmQgbGluZSBzZWdtZW50XHJcbiAgICAgIGNvbnN0IGRlbHRhID0gZW5kLm1pbnVzKCBzdGFydCApO1xyXG4gICAgICBjb25zdCBwMWQgPSBjb250cm9sLm1pbnVzKCBzdGFydCApLmRvdCggZGVsdGEubm9ybWFsaXplZCgpICkgLyBkZWx0YS5tYWduaXR1ZGU7XHJcbiAgICAgIGNvbnN0IHQgPSBRdWFkcmF0aWMuZXh0cmVtYVQoIDAsIHAxZCwgMSApO1xyXG4gICAgICBpZiAoICFpc05hTiggdCApICYmIHQgPiAwICYmIHQgPCAxICkge1xyXG4gICAgICAgIC8vIHdlIGhhdmUgYSBsb2NhbCBtYXggaW5zaWRlIHRoZSByYW5nZSwgaW5kaWNhdGluZyB0aGF0IG91ciBleHRyZW1hIHBvaW50IGlzIG91dHNpZGUgb2Ygc3RhcnQtPmVuZFxyXG4gICAgICAgIC8vIHdlJ2xsIGxpbmUgdG8gYW5kIGZyb20gaXRcclxuICAgICAgICBjb25zdCBwdCA9IHRoaXMucG9zaXRpb25BdCggdCApO1xyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4oIFtcclxuICAgICAgICAgIG5ldyBMaW5lKCBzdGFydCwgcHQgKS5nZXROb25kZWdlbmVyYXRlU2VnbWVudHMoKSxcclxuICAgICAgICAgIG5ldyBMaW5lKCBwdCwgZW5kICkuZ2V0Tm9uZGVnZW5lcmF0ZVNlZ21lbnRzKClcclxuICAgICAgICBdICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8ganVzdCBwcm92aWRlIGEgbGluZSBzZWdtZW50LCBvdXIgcmVuZGVyZWQgcGF0aCBkb2Vzbid0IGdvIG91dHNpZGUgb2YgdGhpc1xyXG4gICAgICAgIHJldHVybiBbIG5ldyBMaW5lKCBzdGFydCwgZW5kICkgXTsgLy8gbm8gZXh0cmEgbm9uZGVnZW5lcmF0ZSBjaGVjayBzaW5jZSBzdGFydCAhPT0gZW5kXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gWyB0aGlzIF07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBib3VuZHMgb2YgdGhpcyBzZWdtZW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICAvLyBjYWxjdWxhdGUgb3VyIHRlbXBvcmFyeSBndWFyYW50ZWVkIGxvd2VyIGJvdW5kcyBiYXNlZCBvbiB0aGUgZW5kIHBvaW50c1xyXG4gICAgaWYgKCB0aGlzLl9ib3VuZHMgPT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMuX2JvdW5kcyA9IG5ldyBCb3VuZHMyKCBNYXRoLm1pbiggdGhpcy5fc3RhcnQueCwgdGhpcy5fZW5kLnggKSwgTWF0aC5taW4oIHRoaXMuX3N0YXJ0LnksIHRoaXMuX2VuZC55ICksIE1hdGgubWF4KCB0aGlzLl9zdGFydC54LCB0aGlzLl9lbmQueCApLCBNYXRoLm1heCggdGhpcy5fc3RhcnQueSwgdGhpcy5fZW5kLnkgKSApO1xyXG5cclxuICAgICAgLy8gY29tcHV0ZSB4IGFuZCB5IHdoZXJlIHRoZSBkZXJpdmF0aXZlIGlzIDAsIHNvIHdlIGNhbiBpbmNsdWRlIHRoaXMgaW4gdGhlIGJvdW5kc1xyXG4gICAgICBjb25zdCB0Q3JpdGljYWxYID0gdGhpcy5nZXRUQ3JpdGljYWxYKCk7XHJcbiAgICAgIGNvbnN0IHRDcml0aWNhbFkgPSB0aGlzLmdldFRDcml0aWNhbFkoKTtcclxuXHJcbiAgICAgIGlmICggIWlzTmFOKCB0Q3JpdGljYWxYICkgJiYgdENyaXRpY2FsWCA+IDAgJiYgdENyaXRpY2FsWCA8IDEgKSB7XHJcbiAgICAgICAgdGhpcy5fYm91bmRzID0gdGhpcy5fYm91bmRzLndpdGhQb2ludCggdGhpcy5wb3NpdGlvbkF0KCB0Q3JpdGljYWxYICkgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoICFpc05hTiggdENyaXRpY2FsWSApICYmIHRDcml0aWNhbFkgPiAwICYmIHRDcml0aWNhbFkgPCAxICkge1xyXG4gICAgICAgIHRoaXMuX2JvdW5kcyA9IHRoaXMuX2JvdW5kcy53aXRoUG9pbnQoIHRoaXMucG9zaXRpb25BdCggdENyaXRpY2FsWSApICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9ib3VuZHM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGJvdW5kcygpOiBCb3VuZHMyIHsgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzKCk7IH1cclxuXHJcbiAgLy8gc2VlIGh0dHA6Ly93d3cudmlzZ3JhZi5pbXBhLmJyL3NpYmdyYXBpOTYvdHJhYnMvcGRmL2ExNC5wZGZcclxuICAvLyBhbmQgaHR0cDovL21hdGguc3RhY2tleGNoYW5nZS5jb20vcXVlc3Rpb25zLzEyMTg2L2FyYy1sZW5ndGgtb2YtYmV6aWVyLWN1cnZlcyBmb3IgY3VydmF0dXJlIC8gYXJjIGxlbmd0aFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHF1YWRyYXRpYyB0aGF0IGFyZSBvZmZzZXQgdG8gdGhpcyBxdWFkcmF0aWMgYnkgYSBkaXN0YW5jZSByXHJcbiAgICpcclxuICAgKiBAcGFyYW0gciAtIGRpc3RhbmNlXHJcbiAgICogQHBhcmFtIHJldmVyc2VcclxuICAgKi9cclxuICBwdWJsaWMgb2Zmc2V0VG8oIHI6IG51bWJlciwgcmV2ZXJzZTogYm9vbGVhbiApOiBRdWFkcmF0aWNbXSB7XHJcbiAgICAvLyBUT0RPOiBpbXBsZW1lbnQgbW9yZSBhY2N1cmF0ZSBtZXRob2QgYXQgaHR0cDovL3d3dy5hbnRpZ3JhaW4uY29tL3Jlc2VhcmNoL2FkYXB0aXZlX2Jlemllci9pbmRleC5odG1sIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgLy8gVE9ETzogb3IgbW9yZSByZWNlbnRseSAoYW5kIHJlbGV2YW50bHkpOiBodHRwOi8vd3d3LmNpcy51c291dGhhbC5lZHUvfmhhaW4vZ2VuZXJhbC9QdWJsaWNhdGlvbnMvQmV6aWVyL0JlemllckZsYXR0ZW5pbmcucGRmIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgbGV0IGN1cnZlczogUXVhZHJhdGljW10gPSBbIHRoaXMgXTtcclxuXHJcbiAgICAvLyBzdWJkaXZpZGUgdGhpcyBjdXJ2ZVxyXG4gICAgY29uc3QgZGVwdGggPSA1OyAvLyBnZW5lcmF0ZXMgMl5kZXB0aCBjdXJ2ZXNcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGRlcHRoOyBpKysgKSB7XHJcbiAgICAgIGN1cnZlcyA9IF8uZmxhdHRlbiggXy5tYXAoIGN1cnZlcywgKCBjdXJ2ZTogUXVhZHJhdGljICkgPT4gY3VydmUuc3ViZGl2aWRlZCggMC41ICkgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBvZmZzZXRDdXJ2ZXMgPSBfLm1hcCggY3VydmVzLCAoIGN1cnZlOiBRdWFkcmF0aWMgKSA9PiBjdXJ2ZS5hcHByb3hpbWF0ZU9mZnNldCggciApICk7XHJcblxyXG4gICAgaWYgKCByZXZlcnNlICkge1xyXG4gICAgICBvZmZzZXRDdXJ2ZXMucmV2ZXJzZSgpO1xyXG4gICAgICBvZmZzZXRDdXJ2ZXMgPSBfLm1hcCggb2Zmc2V0Q3VydmVzLCAoIGN1cnZlOiBRdWFkcmF0aWMgKSA9PiBjdXJ2ZS5yZXZlcnNlZCgpICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG9mZnNldEN1cnZlcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVsZXZhdGlvbiBvZiB0aGlzIHF1YWRyYXRpYyBCZXppZXIgY3VydmUgdG8gYSBjdWJpYyBCZXppZXIgY3VydmVcclxuICAgKi9cclxuICBwdWJsaWMgZGVncmVlRWxldmF0ZWQoKTogQ3ViaWMge1xyXG4gICAgLy8gVE9ETzogYWxsb2NhdGlvbiByZWR1Y3Rpb24gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICByZXR1cm4gbmV3IEN1YmljKFxyXG4gICAgICB0aGlzLl9zdGFydCxcclxuICAgICAgdGhpcy5fc3RhcnQucGx1cyggdGhpcy5fY29udHJvbC50aW1lc1NjYWxhciggMiApICkuZGl2aWRlZFNjYWxhciggMyApLFxyXG4gICAgICB0aGlzLl9lbmQucGx1cyggdGhpcy5fY29udHJvbC50aW1lc1NjYWxhciggMiApICkuZGl2aWRlZFNjYWxhciggMyApLFxyXG4gICAgICB0aGlzLl9lbmRcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gciAtIGRpc3RhbmNlXHJcbiAgICovXHJcbiAgcHVibGljIGFwcHJveGltYXRlT2Zmc2V0KCByOiBudW1iZXIgKTogUXVhZHJhdGljIHtcclxuICAgIHJldHVybiBuZXcgUXVhZHJhdGljKFxyXG4gICAgICB0aGlzLl9zdGFydC5wbHVzKCAoIHRoaXMuX3N0YXJ0LmVxdWFscyggdGhpcy5fY29udHJvbCApID8gdGhpcy5fZW5kLm1pbnVzKCB0aGlzLl9zdGFydCApIDogdGhpcy5fY29udHJvbC5taW51cyggdGhpcy5fc3RhcnQgKSApLnBlcnBlbmRpY3VsYXIubm9ybWFsaXplZCgpLnRpbWVzKCByICkgKSxcclxuICAgICAgdGhpcy5fY29udHJvbC5wbHVzKCB0aGlzLl9lbmQubWludXMoIHRoaXMuX3N0YXJ0ICkucGVycGVuZGljdWxhci5ub3JtYWxpemVkKCkudGltZXMoIHIgKSApLFxyXG4gICAgICB0aGlzLl9lbmQucGx1cyggKCB0aGlzLl9lbmQuZXF1YWxzKCB0aGlzLl9jb250cm9sICkgPyB0aGlzLl9lbmQubWludXMoIHRoaXMuX3N0YXJ0ICkgOiB0aGlzLl9lbmQubWludXMoIHRoaXMuX2NvbnRyb2wgKSApLnBlcnBlbmRpY3VsYXIubm9ybWFsaXplZCgpLnRpbWVzKCByICkgKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBzdHJpbmcgY29udGFpbmluZyB0aGUgU1ZHIHBhdGguIGFzc3VtZXMgdGhhdCB0aGUgc3RhcnQgcG9pbnQgaXMgYWxyZWFkeSBwcm92aWRlZCwgc28gYW55dGhpbmcgdGhhdCBjYWxscyB0aGlzIG5lZWRzIHRvIHB1dCB0aGUgTSBjYWxscyBmaXJzdFxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTVkdQYXRoRnJhZ21lbnQoKTogc3RyaW5nIHtcclxuICAgIGxldCBvbGRQYXRoRnJhZ21lbnQ7XHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgb2xkUGF0aEZyYWdtZW50ID0gdGhpcy5fc3ZnUGF0aEZyYWdtZW50O1xyXG4gICAgICB0aGlzLl9zdmdQYXRoRnJhZ21lbnQgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgaWYgKCAhdGhpcy5fc3ZnUGF0aEZyYWdtZW50ICkge1xyXG4gICAgICB0aGlzLl9zdmdQYXRoRnJhZ21lbnQgPSBgUSAke3N2Z051bWJlciggdGhpcy5fY29udHJvbC54ICl9ICR7c3ZnTnVtYmVyKCB0aGlzLl9jb250cm9sLnkgKX0gJHtcclxuICAgICAgICBzdmdOdW1iZXIoIHRoaXMuX2VuZC54ICl9ICR7c3ZnTnVtYmVyKCB0aGlzLl9lbmQueSApfWA7XHJcbiAgICB9XHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgaWYgKCBvbGRQYXRoRnJhZ21lbnQgKSB7XHJcbiAgICAgICAgYXNzZXJ0KCBvbGRQYXRoRnJhZ21lbnQgPT09IHRoaXMuX3N2Z1BhdGhGcmFnbWVudCwgJ1F1YWRyYXRpYyBsaW5lIHNlZ21lbnQgY2hhbmdlZCB3aXRob3V0IGludmFsaWRhdGUoKScgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX3N2Z1BhdGhGcmFnbWVudDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgbGluZXMgdGhhdCB3aWxsIGRyYXcgYW4gb2Zmc2V0IGN1cnZlIG9uIHRoZSBsb2dpY2FsIGxlZnQgc2lkZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdHJva2VMZWZ0KCBsaW5lV2lkdGg6IG51bWJlciApOiBRdWFkcmF0aWNbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5vZmZzZXRUbyggLWxpbmVXaWR0aCAvIDIsIGZhbHNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGxpbmVzIHRoYXQgd2lsbCBkcmF3IGFuIG9mZnNldCBjdXJ2ZSBvbiB0aGUgbG9naWNhbCByaWdodCBzaWRlXHJcbiAgICovXHJcbiAgcHVibGljIHN0cm9rZVJpZ2h0KCBsaW5lV2lkdGg6IG51bWJlciApOiBRdWFkcmF0aWNbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5vZmZzZXRUbyggbGluZVdpZHRoIC8gMiwgdHJ1ZSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldEludGVyaW9yRXh0cmVtYVRzKCk6IG51bWJlcltdIHtcclxuICAgIC8vIFRPRE86IHdlIGFzc3VtZSBoZXJlIHdlIGFyZSByZWR1Y2UsIHNvIHRoYXQgYSBjcml0aWNhbFggZG9lc24ndCBlcXVhbCBhIGNyaXRpY2FsWT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICBjb25zdCByZXN1bHQgPSBbXTtcclxuICAgIGNvbnN0IGVwc2lsb24gPSAwLjAwMDAwMDAwMDE7IC8vIFRPRE86IGdlbmVyYWwga2l0ZSBlcHNpbG9uPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuXHJcbiAgICBjb25zdCBjcml0aWNhbFggPSB0aGlzLmdldFRDcml0aWNhbFgoKTtcclxuICAgIGNvbnN0IGNyaXRpY2FsWSA9IHRoaXMuZ2V0VENyaXRpY2FsWSgpO1xyXG5cclxuICAgIGlmICggIWlzTmFOKCBjcml0aWNhbFggKSAmJiBjcml0aWNhbFggPiBlcHNpbG9uICYmIGNyaXRpY2FsWCA8IDEgLSBlcHNpbG9uICkge1xyXG4gICAgICByZXN1bHQucHVzaCggdGhpcy50Q3JpdGljYWxYICk7XHJcbiAgICB9XHJcbiAgICBpZiAoICFpc05hTiggY3JpdGljYWxZICkgJiYgY3JpdGljYWxZID4gZXBzaWxvbiAmJiBjcml0aWNhbFkgPCAxIC0gZXBzaWxvbiApIHtcclxuICAgICAgcmVzdWx0LnB1c2goIHRoaXMudENyaXRpY2FsWSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdC5zb3J0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIaXQtdGVzdHMgdGhpcyBzZWdtZW50IHdpdGggdGhlIHJheS4gQW4gYXJyYXkgb2YgYWxsIGludGVyc2VjdGlvbnMgb2YgdGhlIHJheSB3aXRoIHRoaXMgc2VnbWVudCB3aWxsIGJlIHJldHVybmVkLlxyXG4gICAqIEZvciBkZXRhaWxzLCBzZWUgdGhlIGRvY3VtZW50YXRpb24gaW4gU2VnbWVudC5qc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnRlcnNlY3Rpb24oIHJheTogUmF5MiApOiBSYXlJbnRlcnNlY3Rpb25bXSB7XHJcbiAgICBjb25zdCByZXN1bHQ6IFJheUludGVyc2VjdGlvbltdID0gW107XHJcblxyXG4gICAgLy8gZmluZCB0aGUgcm90YXRpb24gdGhhdCB3aWxsIHB1dCBvdXIgcmF5IGluIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHgtYXhpcyBzbyB3ZSBjYW4gb25seSBzb2x2ZSBmb3IgeT0wIGZvciBpbnRlcnNlY3Rpb25zXHJcbiAgICBjb25zdCBpbnZlcnNlTWF0cml4ID0gTWF0cml4My5yb3RhdGlvbjIoIC1yYXkuZGlyZWN0aW9uLmFuZ2xlICkudGltZXNNYXRyaXgoIE1hdHJpeDMudHJhbnNsYXRpb24oIC1yYXkucG9zaXRpb24ueCwgLXJheS5wb3NpdGlvbi55ICkgKTtcclxuXHJcbiAgICBjb25zdCBwMCA9IGludmVyc2VNYXRyaXgudGltZXNWZWN0b3IyKCB0aGlzLl9zdGFydCApO1xyXG4gICAgY29uc3QgcDEgPSBpbnZlcnNlTWF0cml4LnRpbWVzVmVjdG9yMiggdGhpcy5fY29udHJvbCApO1xyXG4gICAgY29uc3QgcDIgPSBpbnZlcnNlTWF0cml4LnRpbWVzVmVjdG9yMiggdGhpcy5fZW5kICk7XHJcblxyXG4gICAgLy8oMS10KV4yIHN0YXJ0ICsgMigxLXQpdCBjb250cm9sICsgdF4yIGVuZFxyXG4gICAgY29uc3QgYSA9IHAwLnkgLSAyICogcDEueSArIHAyLnk7XHJcbiAgICBjb25zdCBiID0gLTIgKiBwMC55ICsgMiAqIHAxLnk7XHJcbiAgICBjb25zdCBjID0gcDAueTtcclxuXHJcbiAgICBjb25zdCB0cyA9IHNvbHZlUXVhZHJhdGljUm9vdHNSZWFsKCBhLCBiLCBjICk7XHJcblxyXG4gICAgXy5lYWNoKCB0cywgdCA9PiB7XHJcbiAgICAgIGlmICggdCA+PSAwICYmIHQgPD0gMSApIHtcclxuICAgICAgICBjb25zdCBoaXRQb2ludCA9IHRoaXMucG9zaXRpb25BdCggdCApO1xyXG4gICAgICAgIGNvbnN0IHVuaXRUYW5nZW50ID0gdGhpcy50YW5nZW50QXQoIHQgKS5ub3JtYWxpemVkKCk7XHJcbiAgICAgICAgY29uc3QgcGVycCA9IHVuaXRUYW5nZW50LnBlcnBlbmRpY3VsYXI7XHJcbiAgICAgICAgY29uc3QgdG9IaXQgPSBoaXRQb2ludC5taW51cyggcmF5LnBvc2l0aW9uICk7XHJcblxyXG4gICAgICAgIC8vIG1ha2Ugc3VyZSBpdCdzIG5vdCBiZWhpbmQgdGhlIHJheVxyXG4gICAgICAgIGlmICggdG9IaXQuZG90KCByYXkuZGlyZWN0aW9uICkgPiAwICkge1xyXG4gICAgICAgICAgY29uc3Qgbm9ybWFsID0gcGVycC5kb3QoIHJheS5kaXJlY3Rpb24gKSA+IDAgPyBwZXJwLm5lZ2F0ZWQoKSA6IHBlcnA7XHJcbiAgICAgICAgICBjb25zdCB3aW5kID0gcmF5LmRpcmVjdGlvbi5wZXJwZW5kaWN1bGFyLmRvdCggdW5pdFRhbmdlbnQgKSA8IDAgPyAxIDogLTE7XHJcbiAgICAgICAgICByZXN1bHQucHVzaCggbmV3IFJheUludGVyc2VjdGlvbiggdG9IaXQubWFnbml0dWRlLCBoaXRQb2ludCwgbm9ybWFsLCB3aW5kLCB0ICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB3aW5kaW5nIG51bWJlciBmb3IgaW50ZXJzZWN0aW9uIHdpdGggYSByYXlcclxuICAgKi9cclxuICBwdWJsaWMgd2luZGluZ0ludGVyc2VjdGlvbiggcmF5OiBSYXkyICk6IG51bWJlciB7XHJcbiAgICBsZXQgd2luZCA9IDA7XHJcbiAgICBjb25zdCBoaXRzID0gdGhpcy5pbnRlcnNlY3Rpb24oIHJheSApO1xyXG4gICAgXy5lYWNoKCBoaXRzLCBoaXQgPT4ge1xyXG4gICAgICB3aW5kICs9IGhpdC53aW5kO1xyXG4gICAgfSApO1xyXG4gICAgcmV0dXJuIHdpbmQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEcmF3cyB0aGUgc2VnbWVudCB0byB0aGUgMkQgQ2FudmFzIGNvbnRleHQsIGFzc3VtaW5nIHRoZSBjb250ZXh0J3MgY3VycmVudCBsb2NhdGlvbiBpcyBhbHJlYWR5IGF0IHRoZSBzdGFydCBwb2ludFxyXG4gICAqL1xyXG4gIHB1YmxpYyB3cml0ZVRvQ29udGV4dCggY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEICk6IHZvaWQge1xyXG4gICAgY29udGV4dC5xdWFkcmF0aWNDdXJ2ZVRvKCB0aGlzLl9jb250cm9sLngsIHRoaXMuX2NvbnRyb2wueSwgdGhpcy5fZW5kLngsIHRoaXMuX2VuZC55ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbmV3IHF1YWRyYXRpYyB0aGF0IHJlcHJlc2VudHMgdGhpcyBxdWFkcmF0aWMgYWZ0ZXIgdHJhbnNmb3JtYXRpb24gYnkgdGhlIG1hdHJpeFxyXG4gICAqL1xyXG4gIHB1YmxpYyB0cmFuc2Zvcm1lZCggbWF0cml4OiBNYXRyaXgzICk6IFF1YWRyYXRpYyB7XHJcbiAgICByZXR1cm4gbmV3IFF1YWRyYXRpYyggbWF0cml4LnRpbWVzVmVjdG9yMiggdGhpcy5fc3RhcnQgKSwgbWF0cml4LnRpbWVzVmVjdG9yMiggdGhpcy5fY29udHJvbCApLCBtYXRyaXgudGltZXNWZWN0b3IyKCB0aGlzLl9lbmQgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY29udHJpYnV0aW9uIHRvIHRoZSBzaWduZWQgYXJlYSBjb21wdXRlZCB1c2luZyBHcmVlbidzIFRoZW9yZW0sIHdpdGggUD0teS8yIGFuZCBRPXgvMi5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgaXMgdGhpcyBzZWdtZW50J3MgY29udHJpYnV0aW9uIHRvIHRoZSBsaW5lIGludGVncmFsICgteS8yIGR4ICsgeC8yIGR5KS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U2lnbmVkQXJlYUZyYWdtZW50KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gMSAvIDYgKiAoXHJcbiAgICAgIHRoaXMuX3N0YXJ0LnggKiAoIDIgKiB0aGlzLl9jb250cm9sLnkgKyB0aGlzLl9lbmQueSApICtcclxuICAgICAgdGhpcy5fY29udHJvbC54ICogKCAtMiAqIHRoaXMuX3N0YXJ0LnkgKyAyICogdGhpcy5fZW5kLnkgKSArXHJcbiAgICAgIHRoaXMuX2VuZC54ICogKCAtdGhpcy5fc3RhcnQueSAtIDIgKiB0aGlzLl9jb250cm9sLnkgKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIHRoZSBjdXJyZW50IGN1cnZlIHBhcmFtZXRlcml6ZWQgYnkgdCwgd2lsbCByZXR1cm4gYSBjdXJ2ZSBwYXJhbWV0ZXJpemVkIGJ5IHggd2hlcmUgdCA9IGEgKiB4ICsgYlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZXBhcmFtZXRlcml6ZWQoIGE6IG51bWJlciwgYjogbnVtYmVyICk6IFF1YWRyYXRpYyB7XHJcbiAgICAvLyB0byB0aGUgcG9seW5vbWlhbCBwdF4yICsgcXQgKyByOlxyXG4gICAgY29uc3QgcCA9IHRoaXMuX3N0YXJ0LnBsdXMoIHRoaXMuX2VuZC5wbHVzKCB0aGlzLl9jb250cm9sLnRpbWVzU2NhbGFyKCAtMiApICkgKTtcclxuICAgIGNvbnN0IHEgPSB0aGlzLl9jb250cm9sLm1pbnVzKCB0aGlzLl9zdGFydCApLnRpbWVzU2NhbGFyKCAyICk7XHJcbiAgICBjb25zdCByID0gdGhpcy5fc3RhcnQ7XHJcblxyXG4gICAgLy8gdG8gdGhlIHBvbHlub21pYWwgYWxwaGEqeF4yICsgYmV0YSp4ICsgZ2FtbWE6XHJcbiAgICBjb25zdCBhbHBoYSA9IHAudGltZXNTY2FsYXIoIGEgKiBhICk7XHJcbiAgICBjb25zdCBiZXRhID0gcC50aW1lc1NjYWxhciggYSAqIGIgKS50aW1lc1NjYWxhciggMiApLnBsdXMoIHEudGltZXNTY2FsYXIoIGEgKSApO1xyXG4gICAgY29uc3QgZ2FtbWEgPSBwLnRpbWVzU2NhbGFyKCBiICogYiApLnBsdXMoIHEudGltZXNTY2FsYXIoIGIgKSApLnBsdXMoIHIgKTtcclxuXHJcbiAgICAvLyBiYWNrIHRvIHRoZSBmb3JtIHN0YXJ0LGNvbnRyb2wsZW5kXHJcbiAgICByZXR1cm4gbmV3IFF1YWRyYXRpYyggZ2FtbWEsIGJldGEudGltZXNTY2FsYXIoIDAuNSApLnBsdXMoIGdhbW1hICksIGFscGhhLnBsdXMoIGJldGEgKS5wbHVzKCBnYW1tYSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgcmV2ZXJzZWQgY29weSBvZiB0aGlzIHNlZ21lbnQgKG1hcHBpbmcgdGhlIHBhcmFtZXRyaXphdGlvbiBmcm9tIFswLDFdID0+IFsxLDBdKS5cclxuICAgKi9cclxuICBwdWJsaWMgcmV2ZXJzZWQoKTogUXVhZHJhdGljIHtcclxuICAgIHJldHVybiBuZXcgUXVhZHJhdGljKCB0aGlzLl9lbmQsIHRoaXMuX2NvbnRyb2wsIHRoaXMuX3N0YXJ0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIG9iamVjdCBmb3JtIHRoYXQgY2FuIGJlIHR1cm5lZCBiYWNrIGludG8gYSBzZWdtZW50IHdpdGggdGhlIGNvcnJlc3BvbmRpbmcgZGVzZXJpYWxpemUgbWV0aG9kLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXJpYWxpemUoKTogU2VyaWFsaXplZFF1YWRyYXRpYyB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnUXVhZHJhdGljJyxcclxuICAgICAgc3RhcnRYOiB0aGlzLl9zdGFydC54LFxyXG4gICAgICBzdGFydFk6IHRoaXMuX3N0YXJ0LnksXHJcbiAgICAgIGNvbnRyb2xYOiB0aGlzLl9jb250cm9sLngsXHJcbiAgICAgIGNvbnRyb2xZOiB0aGlzLl9jb250cm9sLnksXHJcbiAgICAgIGVuZFg6IHRoaXMuX2VuZC54LFxyXG4gICAgICBlbmRZOiB0aGlzLl9lbmQueVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZSB3aGV0aGVyIHR3byBsaW5lcyBvdmVybGFwIG92ZXIgYSBjb250aW51b3VzIHNlY3Rpb24sIGFuZCBpZiBzbyBmaW5kcyB0aGUgYSxiIHBhaXIgc3VjaCB0aGF0XHJcbiAgICogcCggdCApID09PSBxKCBhICogdCArIGIgKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBzZWdtZW50XHJcbiAgICogQHBhcmFtIFtlcHNpbG9uXSAtIFdpbGwgcmV0dXJuIG92ZXJsYXBzIG9ubHkgaWYgbm8gdHdvIGNvcnJlc3BvbmRpbmcgcG9pbnRzIGRpZmZlciBieSB0aGlzIGFtb3VudCBvciBtb3JlIGluIG9uZSBjb21wb25lbnQuXHJcbiAgICogQHJldHVybnMgLSBUaGUgc29sdXRpb24sIGlmIHRoZXJlIGlzIG9uZSAoYW5kIG9ubHkgb25lKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRPdmVybGFwcyggc2VnbWVudDogU2VnbWVudCwgZXBzaWxvbiA9IDFlLTYgKTogT3ZlcmxhcFtdIHwgbnVsbCB7XHJcbiAgICBpZiAoIHNlZ21lbnQgaW5zdGFuY2VvZiBRdWFkcmF0aWMgKSB7XHJcbiAgICAgIHJldHVybiBRdWFkcmF0aWMuZ2V0T3ZlcmxhcHMoIHRoaXMsIHNlZ21lbnQgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBRdWFkcmF0aWMgZnJvbSB0aGUgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIG92ZXJyaWRlIGRlc2VyaWFsaXplKCBvYmo6IFNlcmlhbGl6ZWRRdWFkcmF0aWMgKTogUXVhZHJhdGljIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG9iai50eXBlID09PSAnUXVhZHJhdGljJyApO1xyXG5cclxuICAgIHJldHVybiBuZXcgUXVhZHJhdGljKCBuZXcgVmVjdG9yMiggb2JqLnN0YXJ0WCwgb2JqLnN0YXJ0WSApLCBuZXcgVmVjdG9yMiggb2JqLmNvbnRyb2xYLCBvYmouY29udHJvbFkgKSwgbmV3IFZlY3RvcjIoIG9iai5lbmRYLCBvYmouZW5kWSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPbmUtZGltZW5zaW9uYWwgc29sdXRpb24gdG8gZXh0cmVtYVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZXh0cmVtYVQoIHN0YXJ0OiBudW1iZXIsIGNvbnRyb2w6IG51bWJlciwgZW5kOiBudW1iZXIgKTogbnVtYmVyIHtcclxuICAgIC8vIGNvbXB1dGUgdCB3aGVyZSB0aGUgZGVyaXZhdGl2ZSBpcyAwICh1c2VkIGZvciBib3VuZHMgYW5kIG90aGVyIHRoaW5ncylcclxuICAgIGNvbnN0IGRpdmlzb3JYID0gMiAqICggZW5kIC0gMiAqIGNvbnRyb2wgKyBzdGFydCApO1xyXG4gICAgaWYgKCBkaXZpc29yWCAhPT0gMCApIHtcclxuICAgICAgcmV0dXJuIC0yICogKCBjb250cm9sIC0gc3RhcnQgKSAvIGRpdmlzb3JYO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBOYU47XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmUgd2hldGhlciB0d28gUXVhZHJhdGljcyBvdmVybGFwIG92ZXIgYSBjb250aW51b3VzIHNlY3Rpb24sIGFuZCBpZiBzbyBmaW5kcyB0aGUgYSxiIHBhaXIgc3VjaCB0aGF0XHJcbiAgICogcCggdCApID09PSBxKCBhICogdCArIGIgKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IGZvciB0aGlzIHBhcnRpY3VsYXIgZnVuY3Rpb24sIHdlIGFzc3VtZSB3ZSdyZSBub3QgZGVnZW5lcmF0ZS4gVGhpbmdzIG1heSB3b3JrIGlmIHdlIGNhbiBiZSBkZWdyZWUtcmVkdWNlZFxyXG4gICAqIHRvIGEgcXVhZHJhdGljLCBidXQgZ2VuZXJhbGx5IHRoYXQgc2hvdWxkbid0IGJlIGRvbmUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcXVhZHJhdGljMVxyXG4gICAqIEBwYXJhbSBxdWFkcmF0aWMyXHJcbiAgICogQHBhcmFtIFtlcHNpbG9uXSAtIFdpbGwgcmV0dXJuIG92ZXJsYXBzIG9ubHkgaWYgbm8gdHdvIGNvcnJlc3BvbmRpbmcgcG9pbnRzIGRpZmZlciBieSB0aGlzIGFtb3VudCBvciBtb3JlXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluIG9uZSBjb21wb25lbnQuXHJcbiAgICogQHJldHVybnMgLSBUaGUgc29sdXRpb24sIGlmIHRoZXJlIGlzIG9uZSAoYW5kIG9ubHkgb25lKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0T3ZlcmxhcHMoIHF1YWRyYXRpYzE6IFF1YWRyYXRpYywgcXVhZHJhdGljMjogUXVhZHJhdGljLCBlcHNpbG9uID0gMWUtNiApOiBPdmVybGFwW10ge1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiBOT1RFOiBGb3IgaW1wbGVtZW50YXRpb24gZGV0YWlscyBpbiB0aGlzIGZ1bmN0aW9uLCBwbGVhc2Ugc2VlIEN1YmljLmdldE92ZXJsYXBzLiBJdCBnb2VzIG92ZXIgYWxsIG9mIHRoZVxyXG4gICAgICogc2FtZSBpbXBsZW1lbnRhdGlvbiBkZXRhaWxzLCBidXQgaW5zdGVhZCBvdXIgYmV6aWVyIG1hdHJpeCBpcyBhIDN4MzpcclxuICAgICAqXHJcbiAgICAgKiBbICAxICAwICAwIF1cclxuICAgICAqIFsgLTIgIDIgIDAgXVxyXG4gICAgICogWyAgMSAtMiAgMSBdXHJcbiAgICAgKlxyXG4gICAgICogQW5kIHdlIHVzZSB0aGUgdXBwZXItbGVmdCBzZWN0aW9uIG9mIChhdCtiKSBhZGp1c3RtZW50IG1hdHJpeCByZWxldmFudCBmb3IgdGhlIHF1YWRyYXRpYy5cclxuICAgICAqL1xyXG5cclxuICAgIGNvbnN0IG5vT3ZlcmxhcDogT3ZlcmxhcFtdID0gW107XHJcblxyXG4gICAgLy8gRWZmaWNpZW50bHkgY29tcHV0ZSB0aGUgbXVsdGlwbGljYXRpb24gb2YgdGhlIGJlemllciBtYXRyaXg6XHJcbiAgICBjb25zdCBwMHggPSBxdWFkcmF0aWMxLl9zdGFydC54O1xyXG4gICAgY29uc3QgcDF4ID0gLTIgKiBxdWFkcmF0aWMxLl9zdGFydC54ICsgMiAqIHF1YWRyYXRpYzEuX2NvbnRyb2wueDtcclxuICAgIGNvbnN0IHAyeCA9IHF1YWRyYXRpYzEuX3N0YXJ0LnggLSAyICogcXVhZHJhdGljMS5fY29udHJvbC54ICsgcXVhZHJhdGljMS5fZW5kLng7XHJcbiAgICBjb25zdCBwMHkgPSBxdWFkcmF0aWMxLl9zdGFydC55O1xyXG4gICAgY29uc3QgcDF5ID0gLTIgKiBxdWFkcmF0aWMxLl9zdGFydC55ICsgMiAqIHF1YWRyYXRpYzEuX2NvbnRyb2wueTtcclxuICAgIGNvbnN0IHAyeSA9IHF1YWRyYXRpYzEuX3N0YXJ0LnkgLSAyICogcXVhZHJhdGljMS5fY29udHJvbC55ICsgcXVhZHJhdGljMS5fZW5kLnk7XHJcbiAgICBjb25zdCBxMHggPSBxdWFkcmF0aWMyLl9zdGFydC54O1xyXG4gICAgY29uc3QgcTF4ID0gLTIgKiBxdWFkcmF0aWMyLl9zdGFydC54ICsgMiAqIHF1YWRyYXRpYzIuX2NvbnRyb2wueDtcclxuICAgIGNvbnN0IHEyeCA9IHF1YWRyYXRpYzIuX3N0YXJ0LnggLSAyICogcXVhZHJhdGljMi5fY29udHJvbC54ICsgcXVhZHJhdGljMi5fZW5kLng7XHJcbiAgICBjb25zdCBxMHkgPSBxdWFkcmF0aWMyLl9zdGFydC55O1xyXG4gICAgY29uc3QgcTF5ID0gLTIgKiBxdWFkcmF0aWMyLl9zdGFydC55ICsgMiAqIHF1YWRyYXRpYzIuX2NvbnRyb2wueTtcclxuICAgIGNvbnN0IHEyeSA9IHF1YWRyYXRpYzIuX3N0YXJ0LnkgLSAyICogcXVhZHJhdGljMi5fY29udHJvbC55ICsgcXVhZHJhdGljMi5fZW5kLnk7XHJcblxyXG4gICAgLy8gRGV0ZXJtaW5lIHRoZSBjYW5kaWRhdGUgb3ZlcmxhcCAocHJlZmVycmluZyB0aGUgZGltZW5zaW9uIHdpdGggdGhlIGxhcmdlc3QgdmFyaWF0aW9uKVxyXG4gICAgY29uc3QgeFNwcmVhZCA9IE1hdGguYWJzKCBNYXRoLm1heCggcXVhZHJhdGljMS5fc3RhcnQueCwgcXVhZHJhdGljMS5fY29udHJvbC54LCBxdWFkcmF0aWMxLl9lbmQueCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFkcmF0aWMyLl9zdGFydC54LCBxdWFkcmF0aWMyLl9jb250cm9sLngsIHF1YWRyYXRpYzIuX2VuZC54ICkgLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbiggcXVhZHJhdGljMS5fc3RhcnQueCwgcXVhZHJhdGljMS5fY29udHJvbC54LCBxdWFkcmF0aWMxLl9lbmQueCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFkcmF0aWMyLl9zdGFydC54LCBxdWFkcmF0aWMyLl9jb250cm9sLngsIHF1YWRyYXRpYzIuX2VuZC54ICkgKTtcclxuICAgIGNvbnN0IHlTcHJlYWQgPSBNYXRoLmFicyggTWF0aC5tYXgoIHF1YWRyYXRpYzEuX3N0YXJ0LnksIHF1YWRyYXRpYzEuX2NvbnRyb2wueSwgcXVhZHJhdGljMS5fZW5kLnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhZHJhdGljMi5fc3RhcnQueSwgcXVhZHJhdGljMi5fY29udHJvbC55LCBxdWFkcmF0aWMyLl9lbmQueSApIC1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oIHF1YWRyYXRpYzEuX3N0YXJ0LnksIHF1YWRyYXRpYzEuX2NvbnRyb2wueSwgcXVhZHJhdGljMS5fZW5kLnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhZHJhdGljMi5fc3RhcnQueSwgcXVhZHJhdGljMi5fY29udHJvbC55LCBxdWFkcmF0aWMyLl9lbmQueSApICk7XHJcbiAgICBjb25zdCB4T3ZlcmxhcCA9IFNlZ21lbnQucG9seW5vbWlhbEdldE92ZXJsYXBRdWFkcmF0aWMoIHAweCwgcDF4LCBwMngsIHEweCwgcTF4LCBxMnggKTtcclxuICAgIGNvbnN0IHlPdmVybGFwID0gU2VnbWVudC5wb2x5bm9taWFsR2V0T3ZlcmxhcFF1YWRyYXRpYyggcDB5LCBwMXksIHAyeSwgcTB5LCBxMXksIHEyeSApO1xyXG4gICAgbGV0IG92ZXJsYXA7XHJcbiAgICBpZiAoIHhTcHJlYWQgPiB5U3ByZWFkICkge1xyXG4gICAgICBvdmVybGFwID0gKCB4T3ZlcmxhcCA9PT0gbnVsbCB8fCB4T3ZlcmxhcCA9PT0gdHJ1ZSApID8geU92ZXJsYXAgOiB4T3ZlcmxhcDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBvdmVybGFwID0gKCB5T3ZlcmxhcCA9PT0gbnVsbCB8fCB5T3ZlcmxhcCA9PT0gdHJ1ZSApID8geE92ZXJsYXAgOiB5T3ZlcmxhcDtcclxuICAgIH1cclxuICAgIGlmICggb3ZlcmxhcCA9PT0gbnVsbCB8fCBvdmVybGFwID09PSB0cnVlICkge1xyXG4gICAgICByZXR1cm4gbm9PdmVybGFwOyAvLyBObyB3YXkgdG8gcGluIGRvd24gYW4gb3ZlcmxhcFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGEgPSBvdmVybGFwLmE7XHJcbiAgICBjb25zdCBiID0gb3ZlcmxhcC5iO1xyXG5cclxuICAgIGNvbnN0IGFhID0gYSAqIGE7XHJcbiAgICBjb25zdCBiYiA9IGIgKiBiO1xyXG4gICAgY29uc3QgYWIyID0gMiAqIGEgKiBiO1xyXG5cclxuICAgIC8vIENvbXB1dGUgcXVhZHJhdGljIGNvZWZmaWNpZW50cyBmb3IgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBwKHQpIGFuZCBxKGEqdCtiKVxyXG4gICAgY29uc3QgZDB4ID0gcTB4ICsgYiAqIHExeCArIGJiICogcTJ4IC0gcDB4O1xyXG4gICAgY29uc3QgZDF4ID0gYSAqIHExeCArIGFiMiAqIHEyeCAtIHAxeDtcclxuICAgIGNvbnN0IGQyeCA9IGFhICogcTJ4IC0gcDJ4O1xyXG4gICAgY29uc3QgZDB5ID0gcTB5ICsgYiAqIHExeSArIGJiICogcTJ5IC0gcDB5O1xyXG4gICAgY29uc3QgZDF5ID0gYSAqIHExeSArIGFiMiAqIHEyeSAtIHAxeTtcclxuICAgIGNvbnN0IGQyeSA9IGFhICogcTJ5IC0gcDJ5O1xyXG5cclxuICAgIC8vIEZpbmQgdGhlIHQgdmFsdWVzIHdoZXJlIGV4dHJlbWVzIGxpZSBpbiB0aGUgWzAsMV0gcmFuZ2UgZm9yIGVhY2ggMS1kaW1lbnNpb25hbCBxdWFkcmF0aWMuIFdlIGRvIHRoaXMgYnlcclxuICAgIC8vIGRpZmZlcmVudGlhdGluZyB0aGUgcXVhZHJhdGljIGFuZCBmaW5kaW5nIHRoZSByb290cyBvZiB0aGUgcmVzdWx0aW5nIGxpbmUuXHJcbiAgICBjb25zdCB4Um9vdHMgPSBVdGlscy5zb2x2ZUxpbmVhclJvb3RzUmVhbCggMiAqIGQyeCwgZDF4ICk7XHJcbiAgICBjb25zdCB5Um9vdHMgPSBVdGlscy5zb2x2ZUxpbmVhclJvb3RzUmVhbCggMiAqIGQyeSwgZDF5ICk7XHJcbiAgICBjb25zdCB4RXh0cmVtZVRzID0gXy51bmlxKCBbIDAsIDEgXS5jb25jYXQoIHhSb290cyA/IHhSb290cy5maWx0ZXIoIGlzQmV0d2VlbjBBbmQxICkgOiBbXSApICk7XHJcbiAgICBjb25zdCB5RXh0cmVtZVRzID0gXy51bmlxKCBbIDAsIDEgXS5jb25jYXQoIHlSb290cyA/IHlSb290cy5maWx0ZXIoIGlzQmV0d2VlbjBBbmQxICkgOiBbXSApICk7XHJcblxyXG4gICAgLy8gRXhhbWluZSB0aGUgc2luZ2xlLWNvb3JkaW5hdGUgZGlzdGFuY2VzIGJldHdlZW4gdGhlIFwib3ZlcmxhcHNcIiBhdCBlYWNoIGV4dHJlbWUgVCB2YWx1ZS4gSWYgdGhlIGRpc3RhbmNlIGlzIGxhcmdlclxyXG4gICAgLy8gdGhhbiBvdXIgZXBzaWxvbiwgdGhlbiB0aGUgXCJvdmVybGFwXCIgd291bGQgbm90IGJlIHZhbGlkLlxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgeEV4dHJlbWVUcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgdCA9IHhFeHRyZW1lVHNbIGkgXTtcclxuICAgICAgaWYgKCBNYXRoLmFicyggKCBkMnggKiB0ICsgZDF4ICkgKiB0ICsgZDB4ICkgPiBlcHNpbG9uICkge1xyXG4gICAgICAgIHJldHVybiBub092ZXJsYXA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHlFeHRyZW1lVHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IHQgPSB5RXh0cmVtZVRzWyBpIF07XHJcbiAgICAgIGlmICggTWF0aC5hYnMoICggZDJ5ICogdCArIGQxeSApICogdCArIGQweSApID4gZXBzaWxvbiApIHtcclxuICAgICAgICByZXR1cm4gbm9PdmVybGFwO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcXQwID0gYjtcclxuICAgIGNvbnN0IHF0MSA9IGEgKyBiO1xyXG5cclxuICAgIC8vIFRPRE86IGRvIHdlIHdhbnQgYW4gZXBzaWxvbiBpbiBoZXJlIHRvIGJlIHBlcm1pc3NpdmU/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgaWYgKCAoIHF0MCA+IDEgJiYgcXQxID4gMSApIHx8ICggcXQwIDwgMCAmJiBxdDEgPCAwICkgKSB7XHJcbiAgICAgIHJldHVybiBub092ZXJsYXA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFsgbmV3IE92ZXJsYXAoIGEsIGIgKSBdO1xyXG4gIH1cclxuXHJcbiAgLy8gRGVncmVlIG9mIHRoZSBwb2x5bm9taWFsIChxdWFkcmF0aWMpXHJcbiAgcHVibGljIGRlZ3JlZSE6IG51bWJlcjtcclxufVxyXG5cclxuUXVhZHJhdGljLnByb3RvdHlwZS5kZWdyZWUgPSAyO1xyXG5cclxua2l0ZS5yZWdpc3RlciggJ1F1YWRyYXRpYycsIFF1YWRyYXRpYyApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxPQUFPQyxPQUFPLE1BQU0sNEJBQTRCO0FBRWhELE9BQU9DLEtBQUssTUFBTSwwQkFBMEI7QUFDNUMsT0FBT0MsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxTQUFTQyxLQUFLLEVBQUVDLElBQUksRUFBRUMsSUFBSSxFQUFFQyxPQUFPLEVBQUVDLGVBQWUsRUFBRUMsT0FBTyxFQUFFQyxTQUFTLFFBQVEsZUFBZTs7QUFFL0Y7QUFDQSxNQUFNQyx1QkFBdUIsR0FBR1QsS0FBSyxDQUFDUyx1QkFBdUI7QUFDN0QsTUFBTUMsa0JBQWtCLEdBQUdWLEtBQUssQ0FBQ1Usa0JBQWtCOztBQUVuRDtBQUNBLFNBQVNDLGNBQWNBLENBQUVDLENBQVMsRUFBWTtFQUM1QyxPQUFPQSxDQUFDLElBQUksQ0FBQyxJQUFJQSxDQUFDLElBQUksQ0FBQztBQUN6QjtBQVlBLGVB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