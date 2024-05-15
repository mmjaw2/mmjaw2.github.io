// Copyright 2013-2024, University of Colorado Boulder

/**
 * A line segment (all points directly between the start and end point)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../../dot/js/Bounds2.js';
import Ray2 from '../../../dot/js/Ray2.js';
import Utils from '../../../dot/js/Utils.js';
import Vector2 from '../../../dot/js/Vector2.js';
import { Arc, kite, Overlap, RayIntersection, Segment, SegmentIntersection, svgNumber } from '../imports.js';
const scratchVector2 = new Vector2(0, 0);
export default class Line extends Segment {
  /**
   * @param start - Start point
   * @param end - End point
   */
  constructor(start, end) {
    super();
    this._start = start;
    this._end = end;
    this.invalidate();
  }

  /**
   * Sets the start point of the Line.
   */
  setStart(start) {
    assert && assert(start.isFinite(), `Line start should be finite: ${start.toString()}`);
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
   * Returns the start of this Line.
   */
  getStart() {
    return this._start;
  }

  /**
   * Sets the end point of the Line.
   */
  setEnd(end) {
    assert && assert(end.isFinite(), `Line end should be finite: ${end.toString()}`);
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
   * Returns the end of this Line.
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
    return this._start.plus(this._end.minus(this._start).times(t));
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

    // tangent always the same, just use the start tangent
    return this.getStartTangent();
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
    return 0; // no curvature on a straight line segment
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
    const pt = this.positionAt(t);
    return [new Line(this._start, pt), new Line(pt, this._end)];
  }

  /**
   * Clears cached information, should be called when any of the 'constructor arguments' are mutated.
   */
  invalidate() {
    assert && assert(this._start instanceof Vector2, `Line start should be a Vector2: ${this._start}`);
    assert && assert(this._start.isFinite(), `Line start should be finite: ${this._start.toString()}`);
    assert && assert(this._end instanceof Vector2, `Line end should be a Vector2: ${this._end}`);
    assert && assert(this._end.isFinite(), `Line end should be finite: ${this._end.toString()}`);

    // Lazily-computed derived information
    this._tangent = null;
    this._bounds = null;
    this._svgPathFragment = null;
    this.invalidationEmitter.emit();
  }

  /**
   * Returns a normalized unit vector that is tangent to this line (at the starting point)
   * the unit vectors points toward the end points.
   */
  getStartTangent() {
    if (this._tangent === null) {
      // TODO: allocation reduction https://github.com/phetsims/kite/issues/76
      this._tangent = this._end.minus(this._start).normalized();
    }
    return this._tangent;
  }
  get startTangent() {
    return this.getStartTangent();
  }

  /**
   * Returns the normalized unit vector that is tangent to this line
   * same as getStartTangent, since this is a straight line
   */
  getEndTangent() {
    return this.getStartTangent();
  }
  get endTangent() {
    return this.getEndTangent();
  }

  /**
   * Returns the bounds of this segment.
   */
  getBounds() {
    // TODO: allocation reduction https://github.com/phetsims/kite/issues/76
    if (this._bounds === null) {
      this._bounds = Bounds2.NOTHING.copy().addPoint(this._start).addPoint(this._end);
    }
    return this._bounds;
  }
  get bounds() {
    return this.getBounds();
  }

  /**
   * Returns the bounding box for this transformed Line
   */
  getBoundsWithTransform(matrix) {
    // uses mutable calls
    const bounds = Bounds2.NOTHING.copy();
    bounds.addPoint(matrix.multiplyVector2(scratchVector2.set(this._start)));
    bounds.addPoint(matrix.multiplyVector2(scratchVector2.set(this._end)));
    return bounds;
  }

  /**
   * Returns a list of non-degenerate segments that are equivalent to this segment. Generally gets rid (or simplifies)
   * invalid or repeated segments.
   */
  getNondegenerateSegments() {
    // if it is degenerate (0-length), just ignore it
    if (this._start.equals(this._end)) {
      return [];
    } else {
      return [this];
    }
  }

  /**
   * Returns a string containing the SVG path. assumes that the start point is already provided,
   * so anything that calls this needs to put the M calls first
   */
  getSVGPathFragment() {
    let oldPathFragment;
    if (assert) {
      oldPathFragment = this._svgPathFragment;
      this._svgPathFragment = null;
    }
    if (!this._svgPathFragment) {
      this._svgPathFragment = `L ${svgNumber(this._end.x)} ${svgNumber(this._end.y)}`;
    }
    if (assert) {
      if (oldPathFragment) {
        assert(oldPathFragment === this._svgPathFragment, 'Quadratic line segment changed without invalidate()');
      }
    }
    return this._svgPathFragment;
  }

  /**
   * Returns an array of Line that will draw an offset curve on the logical left side
   */
  strokeLeft(lineWidth) {
    const offset = this.getEndTangent().perpendicular.negated().times(lineWidth / 2);
    return [new Line(this._start.plus(offset), this._end.plus(offset))];
  }

  /**
   * Returns an array of Line that will draw an offset curve on the logical right side
   */
  strokeRight(lineWidth) {
    const offset = this.getStartTangent().perpendicular.times(lineWidth / 2);
    return [new Line(this._end.plus(offset), this._start.plus(offset))];
  }

  /**
   * In general, this method returns a list of t values where dx/dt or dy/dt is 0 where 0 < t < 1. subdividing on these will result in monotonic segments
   * Since lines are already monotone, it returns an empty array.
   */
  getInteriorExtremaTs() {
    return [];
  }

  /**
   * Hit-tests this segment with the ray. An array of all intersections of the ray with this segment will be returned.
   * For details, see the documentation in Segment.js
   */
  intersection(ray) {
    // We solve for the parametric line-line intersection, and then ensure the parameters are within both
    // the line segment and forwards from the ray.

    const result = [];
    const start = this._start;
    const end = this._end;
    const diff = end.minus(start);
    if (diff.magnitudeSquared === 0) {
      return result;
    }
    const denom = ray.direction.y * diff.x - ray.direction.x * diff.y;

    // If denominator is 0, the lines are parallel or coincident
    if (denom === 0) {
      return result;
    }

    // linear parameter where start (0) to end (1)
    const t = (ray.direction.x * (start.y - ray.position.y) - ray.direction.y * (start.x - ray.position.x)) / denom;

    // check that the intersection point is between the line segment's endpoints
    if (t < 0 || t >= 1) {
      return result;
    }

    // linear parameter where ray.position (0) to ray.position+ray.direction (1)
    const s = (diff.x * (start.y - ray.position.y) - diff.y * (start.x - ray.position.x)) / denom;

    // bail if it is behind our ray
    if (s < 0.00000001) {
      return result;
    }

    // return the proper winding direction depending on what way our line intersection is "pointed"
    const perp = diff.perpendicular;
    const intersectionPoint = start.plus(diff.times(t));
    const normal = (perp.dot(ray.direction) > 0 ? perp.negated() : perp).normalized();
    const wind = ray.direction.perpendicular.dot(diff) < 0 ? 1 : -1;
    result.push(new RayIntersection(s, intersectionPoint, normal, wind, t));
    return result;
  }

  /**
   * Returns the resultant winding number of a ray intersecting this line.
   */
  windingIntersection(ray) {
    const hits = this.intersection(ray);
    if (hits.length) {
      return hits[0].wind;
    } else {
      return 0;
    }
  }

  /**
   * Draws this line to the 2D Canvas context, assuming the context's current location is already at the start point
   */
  writeToContext(context) {
    context.lineTo(this._end.x, this._end.y);
  }

  /**
   * Returns a new Line that represents this line after transformation by the matrix
   */
  transformed(matrix) {
    return new Line(matrix.timesVector2(this._start), matrix.timesVector2(this._end));
  }

  /**
   * Returns an object that gives information about the closest point (on a line segment) to the point argument
   */
  explicitClosestToPoint(point) {
    const diff = this._end.minus(this._start);
    let t = point.minus(this._start).dot(diff) / diff.magnitudeSquared;
    t = Utils.clamp(t, 0, 1);
    const closestPoint = this.positionAt(t);
    return [{
      segment: this,
      t: t,
      closestPoint: closestPoint,
      distanceSquared: point.distanceSquared(closestPoint)
    }];
  }

  /**
   * Returns the contribution to the signed area computed using Green's Theorem, with P=-y/2 and Q=x/2.
   *
   * NOTE: This is this segment's contribution to the line integral (-y/2 dx + x/2 dy).
   */
  getSignedAreaFragment() {
    return 1 / 2 * (this._start.x * this._end.y - this._start.y * this._end.x);
  }

  /**
   * Given the current curve parameterized by t, will return a curve parameterized by x where t = a * x + b
   */
  reparameterized(a, b) {
    return new Line(this.positionAt(b), this.positionAt(a + b));
  }

  /**
   * Returns a reversed copy of this segment (mapping the parametrization from [0,1] => [1,0]).
   */
  reversed() {
    return new Line(this._end, this._start);
  }

  /**
   * Convert a line in the $(theta,r)$ plane of the form $(\theta_1,r_1)$ to $(\theta_2,r_2)$ and
   * converts to the cartesian coordinate system
   *
   * E.g. a polar line (0,1) to (2 Pi,1) would be mapped to a circle of radius 1
   */
  polarToCartesian(options) {
    // x represent an angle whereas y represent a radius
    if (this._start.x === this._end.x) {
      // angle is the same, we are still a line segment!
      return [new Line(Vector2.createPolar(this._start.y, this._start.x), Vector2.createPolar(this._end.y, this._end.x))];
    } else if (this._start.y === this._end.y) {
      // we have a constant radius, so we are a circular arc
      return [new Arc(Vector2.ZERO, this._start.y, this._start.x, this._end.x, this._start.x > this._end.x)];
    } else {
      return this.toPiecewiseLinearSegments(options);
    }
  }

  /**
   * Returns the arc length of the segment.
   */
  getArcLength() {
    return this.start.distance(this.end);
  }

  /**
   * We can handle this simply by returning ourselves.
   */
  toPiecewiseLinearOrArcSegments() {
    return [this];
  }

  /**
   * Returns an object form that can be turned back into a segment with the corresponding deserialize method.
   */
  serialize() {
    return {
      type: 'Line',
      startX: this._start.x,
      startY: this._start.y,
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
    if (segment instanceof Line) {
      return Line.getOverlaps(this, segment);
    }
    return null;
  }
  getClosestPoints(point) {
    // TODO: Can be simplified by getting the normalized direction vector, getting its perpendicular, and dotting with https://github.com/phetsims/kite/issues/98
    // TODO: the start or end point (should be the same result). https://github.com/phetsims/kite/issues/98
    // TODO: See LinearEdge.evaluateClosestDistanceToOrigin for details. https://github.com/phetsims/kite/issues/98

    const delta = this._end.minus(this._start);

    // Normalized start => end
    const normalizedDirection = delta.normalized();

    // Normalized distance along the line from the start to the point
    const intersectionNormalized = point.minus(this._start).dot(normalizedDirection);
    const intersectionT = Utils.clamp(intersectionNormalized / delta.magnitude, 0, 1);
    const intersectionPoint = this.positionAt(intersectionT);
    return [{
      segment: this,
      t: intersectionT,
      closestPoint: intersectionPoint,
      distanceSquared: intersectionPoint.distanceSquared(point)
    }];
  }

  /**
   * Returns a Line from the serialized representation.
   */
  static deserialize(obj) {
    assert && assert(obj.type === 'Line');
    return new Line(new Vector2(obj.startX, obj.startY), new Vector2(obj.endX, obj.endY));
  }

  /**
   * Determine whether two lines overlap over a continuous section, and if so finds the a,b pair such that
   * p( t ) === q( a * t + b ).
   *
   * @param line1
   * @param line2
   * @param [epsilon] - Will return overlaps only if no two corresponding points differ by this amount or more
   *                             in one component.
   * @returns - The solution, if there is one (and only one)
   */
  static getOverlaps(line1, line2, epsilon = 1e-6) {
    /*
     * NOTE: For implementation details in this function, please see Cubic.getOverlaps. It goes over all of the
     * same implementation details, but instead our bezier matrix is a 2x2:
     *
     * [  1  0 ]
     * [ -1  1 ]
     *
     * And we use the upper-left section of (at+b) adjustment matrix relevant for the line.
     */

    const noOverlap = [];

    // Efficiently compute the multiplication of the bezier matrix:
    const p0x = line1._start.x;
    const p1x = -1 * line1._start.x + line1._end.x;
    const p0y = line1._start.y;
    const p1y = -1 * line1._start.y + line1._end.y;
    const q0x = line2._start.x;
    const q1x = -1 * line2._start.x + line2._end.x;
    const q0y = line2._start.y;
    const q1y = -1 * line2._start.y + line2._end.y;

    // Determine the candidate overlap (preferring the dimension with the largest variation)
    const xSpread = Math.abs(Math.max(line1._start.x, line1._end.x, line2._start.x, line2._end.x) - Math.min(line1._start.x, line1._end.x, line2._start.x, line2._end.x));
    const ySpread = Math.abs(Math.max(line1._start.y, line1._end.y, line2._start.y, line2._end.y) - Math.min(line1._start.y, line1._end.y, line2._start.y, line2._end.y));
    const xOverlap = Segment.polynomialGetOverlapLinear(p0x, p1x, q0x, q1x);
    const yOverlap = Segment.polynomialGetOverlapLinear(p0y, p1y, q0y, q1y);
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

    // Compute linear coefficients for the difference between p(t) and q(a*t+b)
    const d0x = q0x + b * q1x - p0x;
    const d1x = a * q1x - p1x;
    const d0y = q0y + b * q1y - p0y;
    const d1y = a * q1y - p1y;

    // Examine the single-coordinate distances between the "overlaps" at each extreme T value. If the distance is larger
    // than our epsilon, then the "overlap" would not be valid.
    if (Math.abs(d0x) > epsilon || Math.abs(d1x + d0x) > epsilon || Math.abs(d0y) > epsilon || Math.abs(d1y + d0y) > epsilon) {
      // We're able to efficiently hardcode these for the line-line case, since there are no extreme t values that are
      // not t=0 or t=1.
      return noOverlap;
    }
    const qt0 = b;
    const qt1 = a + b;

    // TODO: do we want an epsilon in here to be permissive? https://github.com/phetsims/kite/issues/76
    if (qt0 > 1 && qt1 > 1 || qt0 < 0 && qt1 < 0) {
      return noOverlap;
    }
    return [new Overlap(a, b)];
  }

  /**
   * Returns any (finite) intersection between the two line segments.
   */
  static intersect(a, b) {
    // TODO: look into numerically more accurate solutions? https://github.com/phetsims/kite/issues/98

    const lineSegmentIntersection = Utils.lineSegmentIntersection(a.start.x, a.start.y, a.end.x, a.end.y, b.start.x, b.start.y, b.end.x, b.end.y);
    if (lineSegmentIntersection !== null) {
      const aT = a.explicitClosestToPoint(lineSegmentIntersection)[0].t;
      const bT = b.explicitClosestToPoint(lineSegmentIntersection)[0].t;
      return [new SegmentIntersection(lineSegmentIntersection, aT, bT)];
    } else {
      return [];
    }
  }

  /**
   * Returns any intersections between a line segment and another type of segment.
   *
   * This should be more optimized than the general intersection routine of arbitrary segments.
   */
  static intersectOther(line, other) {
    // Set up a ray
    const delta = line.end.minus(line.start);
    const length = delta.magnitude;
    const ray = new Ray2(line.start, delta.normalize());

    // Find the other segment's intersections with the ray
    const rayIntersections = other.intersection(ray);
    const results = [];
    for (let i = 0; i < rayIntersections.length; i++) {
      const rayIntersection = rayIntersections[i];
      const lineT = rayIntersection.distance / length;

      // Exclude intersections that are outside our line segment (or right on the boundary)
      if (lineT > 1e-8 && lineT < 1 - 1e-8) {
        results.push(new SegmentIntersection(rayIntersection.point, lineT, rayIntersection.t));
      }
    }
    return results;
  }
}
kite.register('Line', Line);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiUmF5MiIsIlV0aWxzIiwiVmVjdG9yMiIsIkFyYyIsImtpdGUiLCJPdmVybGFwIiwiUmF5SW50ZXJzZWN0aW9uIiwiU2VnbWVudCIsIlNlZ21lbnRJbnRlcnNlY3Rpb24iLCJzdmdOdW1iZXIiLCJzY3JhdGNoVmVjdG9yMiIsIkxpbmUiLCJjb25zdHJ1Y3RvciIsInN0YXJ0IiwiZW5kIiwiX3N0YXJ0IiwiX2VuZCIsImludmFsaWRhdGUiLCJzZXRTdGFydCIsImFzc2VydCIsImlzRmluaXRlIiwidG9TdHJpbmciLCJlcXVhbHMiLCJ2YWx1ZSIsImdldFN0YXJ0Iiwic2V0RW5kIiwiZ2V0RW5kIiwicG9zaXRpb25BdCIsInQiLCJwbHVzIiwibWludXMiLCJ0aW1lcyIsInRhbmdlbnRBdCIsImdldFN0YXJ0VGFuZ2VudCIsImN1cnZhdHVyZUF0Iiwic3ViZGl2aWRlZCIsInB0IiwiX3RhbmdlbnQiLCJfYm91bmRzIiwiX3N2Z1BhdGhGcmFnbWVudCIsImludmFsaWRhdGlvbkVtaXR0ZXIiLCJlbWl0Iiwibm9ybWFsaXplZCIsInN0YXJ0VGFuZ2VudCIsImdldEVuZFRhbmdlbnQiLCJlbmRUYW5nZW50IiwiZ2V0Qm91bmRzIiwiTk9USElORyIsImNvcHkiLCJhZGRQb2ludCIsImJvdW5kcyIsImdldEJvdW5kc1dpdGhUcmFuc2Zvcm0iLCJtYXRyaXgiLCJtdWx0aXBseVZlY3RvcjIiLCJzZXQiLCJnZXROb25kZWdlbmVyYXRlU2VnbWVudHMiLCJnZXRTVkdQYXRoRnJhZ21lbnQiLCJvbGRQYXRoRnJhZ21lbnQiLCJ4IiwieSIsInN0cm9rZUxlZnQiLCJsaW5lV2lkdGgiLCJvZmZzZXQiLCJwZXJwZW5kaWN1bGFyIiwibmVnYXRlZCIsInN0cm9rZVJpZ2h0IiwiZ2V0SW50ZXJpb3JFeHRyZW1hVHMiLCJpbnRlcnNlY3Rpb24iLCJyYXkiLCJyZXN1bHQiLCJkaWZmIiwibWFnbml0dWRlU3F1YXJlZCIsImRlbm9tIiwiZGlyZWN0aW9uIiwicG9zaXRpb24iLCJzIiwicGVycCIsImludGVyc2VjdGlvblBvaW50Iiwibm9ybWFsIiwiZG90Iiwid2luZCIsInB1c2giLCJ3aW5kaW5nSW50ZXJzZWN0aW9uIiwiaGl0cyIsImxlbmd0aCIsIndyaXRlVG9Db250ZXh0IiwiY29udGV4dCIsImxpbmVUbyIsInRyYW5zZm9ybWVkIiwidGltZXNWZWN0b3IyIiwiZXhwbGljaXRDbG9zZXN0VG9Qb2ludCIsInBvaW50IiwiY2xhbXAiLCJjbG9zZXN0UG9pbnQiLCJzZWdtZW50IiwiZGlzdGFuY2VTcXVhcmVkIiwiZ2V0U2lnbmVkQXJlYUZyYWdtZW50IiwicmVwYXJhbWV0ZXJpemVkIiwiYSIsImIiLCJyZXZlcnNlZCIsInBvbGFyVG9DYXJ0ZXNpYW4iLCJvcHRpb25zIiwiY3JlYXRlUG9sYXIiLCJaRVJPIiwidG9QaWVjZXdpc2VMaW5lYXJTZWdtZW50cyIsImdldEFyY0xlbmd0aCIsImRpc3RhbmNlIiwidG9QaWVjZXdpc2VMaW5lYXJPckFyY1NlZ21lbnRzIiwic2VyaWFsaXplIiwidHlwZSIsInN0YXJ0WCIsInN0YXJ0WSIsImVuZFgiLCJlbmRZIiwiZ2V0T3ZlcmxhcHMiLCJlcHNpbG9uIiwiZ2V0Q2xvc2VzdFBvaW50cyIsImRlbHRhIiwibm9ybWFsaXplZERpcmVjdGlvbiIsImludGVyc2VjdGlvbk5vcm1hbGl6ZWQiLCJpbnRlcnNlY3Rpb25UIiwibWFnbml0dWRlIiwiZGVzZXJpYWxpemUiLCJvYmoiLCJsaW5lMSIsImxpbmUyIiwibm9PdmVybGFwIiwicDB4IiwicDF4IiwicDB5IiwicDF5IiwicTB4IiwicTF4IiwicTB5IiwicTF5IiwieFNwcmVhZCIsIk1hdGgiLCJhYnMiLCJtYXgiLCJtaW4iLCJ5U3ByZWFkIiwieE92ZXJsYXAiLCJwb2x5bm9taWFsR2V0T3ZlcmxhcExpbmVhciIsInlPdmVybGFwIiwib3ZlcmxhcCIsImQweCIsImQxeCIsImQweSIsImQxeSIsInF0MCIsInF0MSIsImludGVyc2VjdCIsImxpbmVTZWdtZW50SW50ZXJzZWN0aW9uIiwiYVQiLCJiVCIsImludGVyc2VjdE90aGVyIiwibGluZSIsIm90aGVyIiwibm9ybWFsaXplIiwicmF5SW50ZXJzZWN0aW9ucyIsInJlc3VsdHMiLCJpIiwicmF5SW50ZXJzZWN0aW9uIiwibGluZVQiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkxpbmUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBsaW5lIHNlZ21lbnQgKGFsbCBwb2ludHMgZGlyZWN0bHkgYmV0d2VlbiB0aGUgc3RhcnQgYW5kIGVuZCBwb2ludClcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgUmF5MiBmcm9tICcuLi8uLi8uLi9kb3QvanMvUmF5Mi5qcyc7XHJcbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi8uLi9kb3QvanMvVXRpbHMuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCB7IEFyYywgQ2xvc2VzdFRvUG9pbnRSZXN1bHQsIGtpdGUsIE92ZXJsYXAsIFBpZWNld2lzZUxpbmVhck9wdGlvbnMsIFJheUludGVyc2VjdGlvbiwgU2VnbWVudCwgU2VnbWVudEludGVyc2VjdGlvbiwgc3ZnTnVtYmVyIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5jb25zdCBzY3JhdGNoVmVjdG9yMiA9IG5ldyBWZWN0b3IyKCAwLCAwICk7XHJcblxyXG5leHBvcnQgdHlwZSBTZXJpYWxpemVkTGluZSA9IHtcclxuICB0eXBlOiAnTGluZSc7XHJcbiAgc3RhcnRYOiBudW1iZXI7XHJcbiAgc3RhcnRZOiBudW1iZXI7XHJcbiAgZW5kWDogbnVtYmVyO1xyXG4gIGVuZFk6IG51bWJlcjtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpbmUgZXh0ZW5kcyBTZWdtZW50IHtcclxuXHJcbiAgcHJpdmF0ZSBfc3RhcnQ6IFZlY3RvcjI7XHJcbiAgcHJpdmF0ZSBfZW5kOiBWZWN0b3IyO1xyXG5cclxuICBwcml2YXRlIF90YW5nZW50ITogVmVjdG9yMiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBfYm91bmRzITogQm91bmRzMiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBfc3ZnUGF0aEZyYWdtZW50ITogc3RyaW5nIHwgbnVsbDtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHN0YXJ0IC0gU3RhcnQgcG9pbnRcclxuICAgKiBAcGFyYW0gZW5kIC0gRW5kIHBvaW50XHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBzdGFydDogVmVjdG9yMiwgZW5kOiBWZWN0b3IyICkge1xyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICB0aGlzLl9zdGFydCA9IHN0YXJ0O1xyXG4gICAgdGhpcy5fZW5kID0gZW5kO1xyXG5cclxuICAgIHRoaXMuaW52YWxpZGF0ZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgc3RhcnQgcG9pbnQgb2YgdGhlIExpbmUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFN0YXJ0KCBzdGFydDogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHN0YXJ0LmlzRmluaXRlKCksIGBMaW5lIHN0YXJ0IHNob3VsZCBiZSBmaW5pdGU6ICR7c3RhcnQudG9TdHJpbmcoKX1gICk7XHJcblxyXG4gICAgaWYgKCAhdGhpcy5fc3RhcnQuZXF1YWxzKCBzdGFydCApICkge1xyXG4gICAgICB0aGlzLl9zdGFydCA9IHN0YXJ0O1xyXG4gICAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBzdGFydCggdmFsdWU6IFZlY3RvcjIgKSB7IHRoaXMuc2V0U3RhcnQoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBzdGFydCgpOiBWZWN0b3IyIHsgcmV0dXJuIHRoaXMuZ2V0U3RhcnQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBzdGFydCBvZiB0aGlzIExpbmUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFN0YXJ0KCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3N0YXJ0O1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGVuZCBwb2ludCBvZiB0aGUgTGluZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0RW5kKCBlbmQ6IFZlY3RvcjIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBlbmQuaXNGaW5pdGUoKSwgYExpbmUgZW5kIHNob3VsZCBiZSBmaW5pdGU6ICR7ZW5kLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgIGlmICggIXRoaXMuX2VuZC5lcXVhbHMoIGVuZCApICkge1xyXG4gICAgICB0aGlzLl9lbmQgPSBlbmQ7XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGVuZCggdmFsdWU6IFZlY3RvcjIgKSB7IHRoaXMuc2V0RW5kKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZW5kKCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRFbmQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBlbmQgb2YgdGhpcyBMaW5lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFbmQoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5fZW5kO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHBvc2l0aW9uIHBhcmFtZXRyaWNhbGx5LCB3aXRoIDAgPD0gdCA8PSAxLlxyXG4gICAqXHJcbiAgICogTk9URTogcG9zaXRpb25BdCggMCApIHdpbGwgcmV0dXJuIHRoZSBzdGFydCBvZiB0aGUgc2VnbWVudCwgYW5kIHBvc2l0aW9uQXQoIDEgKSB3aWxsIHJldHVybiB0aGUgZW5kIG9mIHRoZVxyXG4gICAqIHNlZ21lbnQuXHJcbiAgICpcclxuICAgKiBUaGlzIG1ldGhvZCBpcyBwYXJ0IG9mIHRoZSBTZWdtZW50IEFQSS4gU2VlIFNlZ21lbnQuanMncyBjb25zdHJ1Y3RvciBmb3IgbW9yZSBBUEkgZG9jdW1lbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgcG9zaXRpb25BdCggdDogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA+PSAwLCAncG9zaXRpb25BdCB0IHNob3VsZCBiZSBub24tbmVnYXRpdmUnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0IDw9IDEsICdwb3NpdGlvbkF0IHQgc2hvdWxkIGJlIG5vIGdyZWF0ZXIgdGhhbiAxJyApO1xyXG5cclxuICAgIHJldHVybiB0aGlzLl9zdGFydC5wbHVzKCB0aGlzLl9lbmQubWludXMoIHRoaXMuX3N0YXJ0ICkudGltZXMoIHQgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbm9uLW5vcm1hbGl6ZWQgdGFuZ2VudCAoZHgvZHQsIGR5L2R0KSBvZiB0aGlzIHNlZ21lbnQgYXQgdGhlIHBhcmFtZXRyaWMgdmFsdWUgb2YgdCwgd2l0aCAwIDw9IHQgPD0gMS5cclxuICAgKlxyXG4gICAqIE5PVEU6IHRhbmdlbnRBdCggMCApIHdpbGwgcmV0dXJuIHRoZSB0YW5nZW50IGF0IHRoZSBzdGFydCBvZiB0aGUgc2VnbWVudCwgYW5kIHRhbmdlbnRBdCggMSApIHdpbGwgcmV0dXJuIHRoZVxyXG4gICAqIHRhbmdlbnQgYXQgdGhlIGVuZCBvZiB0aGUgc2VnbWVudC5cclxuICAgKlxyXG4gICAqIFRoaXMgbWV0aG9kIGlzIHBhcnQgb2YgdGhlIFNlZ21lbnQgQVBJLiBTZWUgU2VnbWVudC5qcydzIGNvbnN0cnVjdG9yIGZvciBtb3JlIEFQSSBkb2N1bWVudGF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0YW5nZW50QXQoIHQ6IG51bWJlciApOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPj0gMCwgJ3RhbmdlbnRBdCB0IHNob3VsZCBiZSBub24tbmVnYXRpdmUnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0IDw9IDEsICd0YW5nZW50QXQgdCBzaG91bGQgYmUgbm8gZ3JlYXRlciB0aGFuIDEnICk7XHJcblxyXG4gICAgLy8gdGFuZ2VudCBhbHdheXMgdGhlIHNhbWUsIGp1c3QgdXNlIHRoZSBzdGFydCB0YW5nZW50XHJcbiAgICByZXR1cm4gdGhpcy5nZXRTdGFydFRhbmdlbnQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHNpZ25lZCBjdXJ2YXR1cmUgb2YgdGhlIHNlZ21lbnQgYXQgdGhlIHBhcmFtZXRyaWMgdmFsdWUgdCwgd2hlcmUgMCA8PSB0IDw9IDEuXHJcbiAgICpcclxuICAgKiBUaGUgY3VydmF0dXJlIHdpbGwgYmUgcG9zaXRpdmUgZm9yIHZpc3VhbCBjbG9ja3dpc2UgLyBtYXRoZW1hdGljYWwgY291bnRlcmNsb2Nrd2lzZSBjdXJ2ZXMsIG5lZ2F0aXZlIGZvciBvcHBvc2l0ZVxyXG4gICAqIGN1cnZhdHVyZSwgYW5kIDAgZm9yIG5vIGN1cnZhdHVyZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IGN1cnZhdHVyZUF0KCAwICkgd2lsbCByZXR1cm4gdGhlIGN1cnZhdHVyZSBhdCB0aGUgc3RhcnQgb2YgdGhlIHNlZ21lbnQsIGFuZCBjdXJ2YXR1cmVBdCggMSApIHdpbGwgcmV0dXJuXHJcbiAgICogdGhlIGN1cnZhdHVyZSBhdCB0aGUgZW5kIG9mIHRoZSBzZWdtZW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBtZXRob2QgaXMgcGFydCBvZiB0aGUgU2VnbWVudCBBUEkuIFNlZSBTZWdtZW50LmpzJ3MgY29uc3RydWN0b3IgZm9yIG1vcmUgQVBJIGRvY3VtZW50YXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGN1cnZhdHVyZUF0KCB0OiBudW1iZXIgKTogbnVtYmVyIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPj0gMCwgJ2N1cnZhdHVyZUF0IHQgc2hvdWxkIGJlIG5vbi1uZWdhdGl2ZScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPD0gMSwgJ2N1cnZhdHVyZUF0IHQgc2hvdWxkIGJlIG5vIGdyZWF0ZXIgdGhhbiAxJyApO1xyXG5cclxuICAgIHJldHVybiAwOyAvLyBubyBjdXJ2YXR1cmUgb24gYSBzdHJhaWdodCBsaW5lIHNlZ21lbnRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgd2l0aCB1cCB0byAyIHN1Yi1zZWdtZW50cywgc3BsaXQgYXQgdGhlIHBhcmFtZXRyaWMgdCB2YWx1ZS4gVG9nZXRoZXIgKGluIG9yZGVyKSB0aGV5IHNob3VsZCBtYWtlXHJcbiAgICogdXAgdGhlIHNhbWUgc2hhcGUgYXMgdGhlIGN1cnJlbnQgc2VnbWVudC5cclxuICAgKlxyXG4gICAqIFRoaXMgbWV0aG9kIGlzIHBhcnQgb2YgdGhlIFNlZ21lbnQgQVBJLiBTZWUgU2VnbWVudC5qcydzIGNvbnN0cnVjdG9yIGZvciBtb3JlIEFQSSBkb2N1bWVudGF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdWJkaXZpZGVkKCB0OiBudW1iZXIgKTogU2VnbWVudFtdIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPj0gMCwgJ3N1YmRpdmlkZWQgdCBzaG91bGQgYmUgbm9uLW5lZ2F0aXZlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA8PSAxLCAnc3ViZGl2aWRlZCB0IHNob3VsZCBiZSBubyBncmVhdGVyIHRoYW4gMScgKTtcclxuXHJcbiAgICAvLyBJZiB0IGlzIDAgb3IgMSwgd2Ugb25seSBuZWVkIHRvIHJldHVybiAxIHNlZ21lbnRcclxuICAgIGlmICggdCA9PT0gMCB8fCB0ID09PSAxICkge1xyXG4gICAgICByZXR1cm4gWyB0aGlzIF07XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcHQgPSB0aGlzLnBvc2l0aW9uQXQoIHQgKTtcclxuICAgIHJldHVybiBbXHJcbiAgICAgIG5ldyBMaW5lKCB0aGlzLl9zdGFydCwgcHQgKSxcclxuICAgICAgbmV3IExpbmUoIHB0LCB0aGlzLl9lbmQgKVxyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsZWFycyBjYWNoZWQgaW5mb3JtYXRpb24sIHNob3VsZCBiZSBjYWxsZWQgd2hlbiBhbnkgb2YgdGhlICdjb25zdHJ1Y3RvciBhcmd1bWVudHMnIGFyZSBtdXRhdGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnZhbGlkYXRlKCk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fc3RhcnQgaW5zdGFuY2VvZiBWZWN0b3IyLCBgTGluZSBzdGFydCBzaG91bGQgYmUgYSBWZWN0b3IyOiAke3RoaXMuX3N0YXJ0fWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3N0YXJ0LmlzRmluaXRlKCksIGBMaW5lIHN0YXJ0IHNob3VsZCBiZSBmaW5pdGU6ICR7dGhpcy5fc3RhcnQudG9TdHJpbmcoKX1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9lbmQgaW5zdGFuY2VvZiBWZWN0b3IyLCBgTGluZSBlbmQgc2hvdWxkIGJlIGEgVmVjdG9yMjogJHt0aGlzLl9lbmR9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fZW5kLmlzRmluaXRlKCksIGBMaW5lIGVuZCBzaG91bGQgYmUgZmluaXRlOiAke3RoaXMuX2VuZC50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICAvLyBMYXppbHktY29tcHV0ZWQgZGVyaXZlZCBpbmZvcm1hdGlvblxyXG4gICAgdGhpcy5fdGFuZ2VudCA9IG51bGw7XHJcbiAgICB0aGlzLl9ib3VuZHMgPSBudWxsO1xyXG4gICAgdGhpcy5fc3ZnUGF0aEZyYWdtZW50ID0gbnVsbDtcclxuXHJcbiAgICB0aGlzLmludmFsaWRhdGlvbkVtaXR0ZXIuZW1pdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5vcm1hbGl6ZWQgdW5pdCB2ZWN0b3IgdGhhdCBpcyB0YW5nZW50IHRvIHRoaXMgbGluZSAoYXQgdGhlIHN0YXJ0aW5nIHBvaW50KVxyXG4gICAqIHRoZSB1bml0IHZlY3RvcnMgcG9pbnRzIHRvd2FyZCB0aGUgZW5kIHBvaW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U3RhcnRUYW5nZW50KCk6IFZlY3RvcjIge1xyXG4gICAgaWYgKCB0aGlzLl90YW5nZW50ID09PSBudWxsICkge1xyXG4gICAgICAvLyBUT0RPOiBhbGxvY2F0aW9uIHJlZHVjdGlvbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgICAgdGhpcy5fdGFuZ2VudCA9IHRoaXMuX2VuZC5taW51cyggdGhpcy5fc3RhcnQgKS5ub3JtYWxpemVkKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fdGFuZ2VudDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc3RhcnRUYW5nZW50KCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRTdGFydFRhbmdlbnQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBub3JtYWxpemVkIHVuaXQgdmVjdG9yIHRoYXQgaXMgdGFuZ2VudCB0byB0aGlzIGxpbmVcclxuICAgKiBzYW1lIGFzIGdldFN0YXJ0VGFuZ2VudCwgc2luY2UgdGhpcyBpcyBhIHN0cmFpZ2h0IGxpbmVcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RW5kVGFuZ2VudCgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFN0YXJ0VGFuZ2VudCgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBlbmRUYW5nZW50KCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRFbmRUYW5nZW50KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYm91bmRzIG9mIHRoaXMgc2VnbWVudC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Qm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgLy8gVE9ETzogYWxsb2NhdGlvbiByZWR1Y3Rpb24gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICBpZiAoIHRoaXMuX2JvdW5kcyA9PT0gbnVsbCApIHtcclxuICAgICAgdGhpcy5fYm91bmRzID0gQm91bmRzMi5OT1RISU5HLmNvcHkoKS5hZGRQb2ludCggdGhpcy5fc3RhcnQgKS5hZGRQb2ludCggdGhpcy5fZW5kICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fYm91bmRzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBib3VuZHMoKTogQm91bmRzMiB7IHJldHVybiB0aGlzLmdldEJvdW5kcygpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGJvdW5kaW5nIGJveCBmb3IgdGhpcyB0cmFuc2Zvcm1lZCBMaW5lXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGdldEJvdW5kc1dpdGhUcmFuc2Zvcm0oIG1hdHJpeDogTWF0cml4MyApOiBCb3VuZHMyIHtcclxuICAgIC8vIHVzZXMgbXV0YWJsZSBjYWxsc1xyXG4gICAgY29uc3QgYm91bmRzID0gQm91bmRzMi5OT1RISU5HLmNvcHkoKTtcclxuICAgIGJvdW5kcy5hZGRQb2ludCggbWF0cml4Lm11bHRpcGx5VmVjdG9yMiggc2NyYXRjaFZlY3RvcjIuc2V0KCB0aGlzLl9zdGFydCApICkgKTtcclxuICAgIGJvdW5kcy5hZGRQb2ludCggbWF0cml4Lm11bHRpcGx5VmVjdG9yMiggc2NyYXRjaFZlY3RvcjIuc2V0KCB0aGlzLl9lbmQgKSApICk7XHJcbiAgICByZXR1cm4gYm91bmRzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGxpc3Qgb2Ygbm9uLWRlZ2VuZXJhdGUgc2VnbWVudHMgdGhhdCBhcmUgZXF1aXZhbGVudCB0byB0aGlzIHNlZ21lbnQuIEdlbmVyYWxseSBnZXRzIHJpZCAob3Igc2ltcGxpZmllcylcclxuICAgKiBpbnZhbGlkIG9yIHJlcGVhdGVkIHNlZ21lbnRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXROb25kZWdlbmVyYXRlU2VnbWVudHMoKTogU2VnbWVudFtdIHtcclxuICAgIC8vIGlmIGl0IGlzIGRlZ2VuZXJhdGUgKDAtbGVuZ3RoKSwganVzdCBpZ25vcmUgaXRcclxuICAgIGlmICggdGhpcy5fc3RhcnQuZXF1YWxzKCB0aGlzLl9lbmQgKSApIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBbIHRoaXMgXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBzdHJpbmcgY29udGFpbmluZyB0aGUgU1ZHIHBhdGguIGFzc3VtZXMgdGhhdCB0aGUgc3RhcnQgcG9pbnQgaXMgYWxyZWFkeSBwcm92aWRlZCxcclxuICAgKiBzbyBhbnl0aGluZyB0aGF0IGNhbGxzIHRoaXMgbmVlZHMgdG8gcHV0IHRoZSBNIGNhbGxzIGZpcnN0XHJcbiAgICovXHJcbiAgcHVibGljIGdldFNWR1BhdGhGcmFnbWVudCgpOiBzdHJpbmcge1xyXG4gICAgbGV0IG9sZFBhdGhGcmFnbWVudDtcclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICBvbGRQYXRoRnJhZ21lbnQgPSB0aGlzLl9zdmdQYXRoRnJhZ21lbnQ7XHJcbiAgICAgIHRoaXMuX3N2Z1BhdGhGcmFnbWVudCA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBpZiAoICF0aGlzLl9zdmdQYXRoRnJhZ21lbnQgKSB7XHJcbiAgICAgIHRoaXMuX3N2Z1BhdGhGcmFnbWVudCA9IGBMICR7c3ZnTnVtYmVyKCB0aGlzLl9lbmQueCApfSAke3N2Z051bWJlciggdGhpcy5fZW5kLnkgKX1gO1xyXG4gICAgfVxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGlmICggb2xkUGF0aEZyYWdtZW50ICkge1xyXG4gICAgICAgIGFzc2VydCggb2xkUGF0aEZyYWdtZW50ID09PSB0aGlzLl9zdmdQYXRoRnJhZ21lbnQsICdRdWFkcmF0aWMgbGluZSBzZWdtZW50IGNoYW5nZWQgd2l0aG91dCBpbnZhbGlkYXRlKCknICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9zdmdQYXRoRnJhZ21lbnQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIExpbmUgdGhhdCB3aWxsIGRyYXcgYW4gb2Zmc2V0IGN1cnZlIG9uIHRoZSBsb2dpY2FsIGxlZnQgc2lkZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdHJva2VMZWZ0KCBsaW5lV2lkdGg6IG51bWJlciApOiBMaW5lW10ge1xyXG4gICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5nZXRFbmRUYW5nZW50KCkucGVycGVuZGljdWxhci5uZWdhdGVkKCkudGltZXMoIGxpbmVXaWR0aCAvIDIgKTtcclxuICAgIHJldHVybiBbIG5ldyBMaW5lKCB0aGlzLl9zdGFydC5wbHVzKCBvZmZzZXQgKSwgdGhpcy5fZW5kLnBsdXMoIG9mZnNldCApICkgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgTGluZSB0aGF0IHdpbGwgZHJhdyBhbiBvZmZzZXQgY3VydmUgb24gdGhlIGxvZ2ljYWwgcmlnaHQgc2lkZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdHJva2VSaWdodCggbGluZVdpZHRoOiBudW1iZXIgKTogTGluZVtdIHtcclxuICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuZ2V0U3RhcnRUYW5nZW50KCkucGVycGVuZGljdWxhci50aW1lcyggbGluZVdpZHRoIC8gMiApO1xyXG4gICAgcmV0dXJuIFsgbmV3IExpbmUoIHRoaXMuX2VuZC5wbHVzKCBvZmZzZXQgKSwgdGhpcy5fc3RhcnQucGx1cyggb2Zmc2V0ICkgKSBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW4gZ2VuZXJhbCwgdGhpcyBtZXRob2QgcmV0dXJucyBhIGxpc3Qgb2YgdCB2YWx1ZXMgd2hlcmUgZHgvZHQgb3IgZHkvZHQgaXMgMCB3aGVyZSAwIDwgdCA8IDEuIHN1YmRpdmlkaW5nIG9uIHRoZXNlIHdpbGwgcmVzdWx0IGluIG1vbm90b25pYyBzZWdtZW50c1xyXG4gICAqIFNpbmNlIGxpbmVzIGFyZSBhbHJlYWR5IG1vbm90b25lLCBpdCByZXR1cm5zIGFuIGVtcHR5IGFycmF5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRJbnRlcmlvckV4dHJlbWFUcygpOiBudW1iZXJbXSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAvKipcclxuICAgKiBIaXQtdGVzdHMgdGhpcyBzZWdtZW50IHdpdGggdGhlIHJheS4gQW4gYXJyYXkgb2YgYWxsIGludGVyc2VjdGlvbnMgb2YgdGhlIHJheSB3aXRoIHRoaXMgc2VnbWVudCB3aWxsIGJlIHJldHVybmVkLlxyXG4gICAqIEZvciBkZXRhaWxzLCBzZWUgdGhlIGRvY3VtZW50YXRpb24gaW4gU2VnbWVudC5qc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnRlcnNlY3Rpb24oIHJheTogUmF5MiApOiBSYXlJbnRlcnNlY3Rpb25bXSB7XHJcbiAgICAvLyBXZSBzb2x2ZSBmb3IgdGhlIHBhcmFtZXRyaWMgbGluZS1saW5lIGludGVyc2VjdGlvbiwgYW5kIHRoZW4gZW5zdXJlIHRoZSBwYXJhbWV0ZXJzIGFyZSB3aXRoaW4gYm90aFxyXG4gICAgLy8gdGhlIGxpbmUgc2VnbWVudCBhbmQgZm9yd2FyZHMgZnJvbSB0aGUgcmF5LlxyXG5cclxuICAgIGNvbnN0IHJlc3VsdDogUmF5SW50ZXJzZWN0aW9uW10gPSBbXTtcclxuXHJcbiAgICBjb25zdCBzdGFydCA9IHRoaXMuX3N0YXJ0O1xyXG4gICAgY29uc3QgZW5kID0gdGhpcy5fZW5kO1xyXG5cclxuICAgIGNvbnN0IGRpZmYgPSBlbmQubWludXMoIHN0YXJ0ICk7XHJcblxyXG4gICAgaWYgKCBkaWZmLm1hZ25pdHVkZVNxdWFyZWQgPT09IDAgKSB7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGVub20gPSByYXkuZGlyZWN0aW9uLnkgKiBkaWZmLnggLSByYXkuZGlyZWN0aW9uLnggKiBkaWZmLnk7XHJcblxyXG4gICAgLy8gSWYgZGVub21pbmF0b3IgaXMgMCwgdGhlIGxpbmVzIGFyZSBwYXJhbGxlbCBvciBjb2luY2lkZW50XHJcbiAgICBpZiAoIGRlbm9tID09PSAwICkge1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGxpbmVhciBwYXJhbWV0ZXIgd2hlcmUgc3RhcnQgKDApIHRvIGVuZCAoMSlcclxuICAgIGNvbnN0IHQgPSAoIHJheS5kaXJlY3Rpb24ueCAqICggc3RhcnQueSAtIHJheS5wb3NpdGlvbi55ICkgLSByYXkuZGlyZWN0aW9uLnkgKiAoIHN0YXJ0LnggLSByYXkucG9zaXRpb24ueCApICkgLyBkZW5vbTtcclxuXHJcbiAgICAvLyBjaGVjayB0aGF0IHRoZSBpbnRlcnNlY3Rpb24gcG9pbnQgaXMgYmV0d2VlbiB0aGUgbGluZSBzZWdtZW50J3MgZW5kcG9pbnRzXHJcbiAgICBpZiAoIHQgPCAwIHx8IHQgPj0gMSApIHtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBsaW5lYXIgcGFyYW1ldGVyIHdoZXJlIHJheS5wb3NpdGlvbiAoMCkgdG8gcmF5LnBvc2l0aW9uK3JheS5kaXJlY3Rpb24gKDEpXHJcbiAgICBjb25zdCBzID0gKCBkaWZmLnggKiAoIHN0YXJ0LnkgLSByYXkucG9zaXRpb24ueSApIC0gZGlmZi55ICogKCBzdGFydC54IC0gcmF5LnBvc2l0aW9uLnggKSApIC8gZGVub207XHJcblxyXG4gICAgLy8gYmFpbCBpZiBpdCBpcyBiZWhpbmQgb3VyIHJheVxyXG4gICAgaWYgKCBzIDwgMC4wMDAwMDAwMSApIHtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvLyByZXR1cm4gdGhlIHByb3BlciB3aW5kaW5nIGRpcmVjdGlvbiBkZXBlbmRpbmcgb24gd2hhdCB3YXkgb3VyIGxpbmUgaW50ZXJzZWN0aW9uIGlzIFwicG9pbnRlZFwiXHJcbiAgICBjb25zdCBwZXJwID0gZGlmZi5wZXJwZW5kaWN1bGFyO1xyXG5cclxuICAgIGNvbnN0IGludGVyc2VjdGlvblBvaW50ID0gc3RhcnQucGx1cyggZGlmZi50aW1lcyggdCApICk7XHJcbiAgICBjb25zdCBub3JtYWwgPSAoIHBlcnAuZG90KCByYXkuZGlyZWN0aW9uICkgPiAwID8gcGVycC5uZWdhdGVkKCkgOiBwZXJwICkubm9ybWFsaXplZCgpO1xyXG4gICAgY29uc3Qgd2luZCA9IHJheS5kaXJlY3Rpb24ucGVycGVuZGljdWxhci5kb3QoIGRpZmYgKSA8IDAgPyAxIDogLTE7XHJcbiAgICByZXN1bHQucHVzaCggbmV3IFJheUludGVyc2VjdGlvbiggcywgaW50ZXJzZWN0aW9uUG9pbnQsIG5vcm1hbCwgd2luZCwgdCApICk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcmVzdWx0YW50IHdpbmRpbmcgbnVtYmVyIG9mIGEgcmF5IGludGVyc2VjdGluZyB0aGlzIGxpbmUuXHJcbiAgICovXHJcbiAgcHVibGljIHdpbmRpbmdJbnRlcnNlY3Rpb24oIHJheTogUmF5MiApOiBudW1iZXIge1xyXG4gICAgY29uc3QgaGl0cyA9IHRoaXMuaW50ZXJzZWN0aW9uKCByYXkgKTtcclxuICAgIGlmICggaGl0cy5sZW5ndGggKSB7XHJcbiAgICAgIHJldHVybiBoaXRzWyAwIF0ud2luZDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERyYXdzIHRoaXMgbGluZSB0byB0aGUgMkQgQ2FudmFzIGNvbnRleHQsIGFzc3VtaW5nIHRoZSBjb250ZXh0J3MgY3VycmVudCBsb2NhdGlvbiBpcyBhbHJlYWR5IGF0IHRoZSBzdGFydCBwb2ludFxyXG4gICAqL1xyXG4gIHB1YmxpYyB3cml0ZVRvQ29udGV4dCggY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEICk6IHZvaWQge1xyXG4gICAgY29udGV4dC5saW5lVG8oIHRoaXMuX2VuZC54LCB0aGlzLl9lbmQueSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5ldyBMaW5lIHRoYXQgcmVwcmVzZW50cyB0aGlzIGxpbmUgYWZ0ZXIgdHJhbnNmb3JtYXRpb24gYnkgdGhlIG1hdHJpeFxyXG4gICAqL1xyXG4gIHB1YmxpYyB0cmFuc2Zvcm1lZCggbWF0cml4OiBNYXRyaXgzICk6IExpbmUge1xyXG4gICAgcmV0dXJuIG5ldyBMaW5lKCBtYXRyaXgudGltZXNWZWN0b3IyKCB0aGlzLl9zdGFydCApLCBtYXRyaXgudGltZXNWZWN0b3IyKCB0aGlzLl9lbmQgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBvYmplY3QgdGhhdCBnaXZlcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY2xvc2VzdCBwb2ludCAob24gYSBsaW5lIHNlZ21lbnQpIHRvIHRoZSBwb2ludCBhcmd1bWVudFxyXG4gICAqL1xyXG4gIHB1YmxpYyBleHBsaWNpdENsb3Nlc3RUb1BvaW50KCBwb2ludDogVmVjdG9yMiApOiBDbG9zZXN0VG9Qb2ludFJlc3VsdFtdIHtcclxuICAgIGNvbnN0IGRpZmYgPSB0aGlzLl9lbmQubWludXMoIHRoaXMuX3N0YXJ0ICk7XHJcbiAgICBsZXQgdCA9IHBvaW50Lm1pbnVzKCB0aGlzLl9zdGFydCApLmRvdCggZGlmZiApIC8gZGlmZi5tYWduaXR1ZGVTcXVhcmVkO1xyXG4gICAgdCA9IFV0aWxzLmNsYW1wKCB0LCAwLCAxICk7XHJcbiAgICBjb25zdCBjbG9zZXN0UG9pbnQgPSB0aGlzLnBvc2l0aW9uQXQoIHQgKTtcclxuICAgIHJldHVybiBbXHJcbiAgICAgIHtcclxuICAgICAgICBzZWdtZW50OiB0aGlzLFxyXG4gICAgICAgIHQ6IHQsXHJcbiAgICAgICAgY2xvc2VzdFBvaW50OiBjbG9zZXN0UG9pbnQsXHJcbiAgICAgICAgZGlzdGFuY2VTcXVhcmVkOiBwb2ludC5kaXN0YW5jZVNxdWFyZWQoIGNsb3Nlc3RQb2ludCApXHJcbiAgICAgIH1cclxuICAgIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjb250cmlidXRpb24gdG8gdGhlIHNpZ25lZCBhcmVhIGNvbXB1dGVkIHVzaW5nIEdyZWVuJ3MgVGhlb3JlbSwgd2l0aCBQPS15LzIgYW5kIFE9eC8yLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBpcyB0aGlzIHNlZ21lbnQncyBjb250cmlidXRpb24gdG8gdGhlIGxpbmUgaW50ZWdyYWwgKC15LzIgZHggKyB4LzIgZHkpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTaWduZWRBcmVhRnJhZ21lbnQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiAxIC8gMiAqICggdGhpcy5fc3RhcnQueCAqIHRoaXMuX2VuZC55IC0gdGhpcy5fc3RhcnQueSAqIHRoaXMuX2VuZC54ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiB0aGUgY3VycmVudCBjdXJ2ZSBwYXJhbWV0ZXJpemVkIGJ5IHQsIHdpbGwgcmV0dXJuIGEgY3VydmUgcGFyYW1ldGVyaXplZCBieSB4IHdoZXJlIHQgPSBhICogeCArIGJcclxuICAgKi9cclxuICBwdWJsaWMgcmVwYXJhbWV0ZXJpemVkKCBhOiBudW1iZXIsIGI6IG51bWJlciApOiBMaW5lIHtcclxuICAgIHJldHVybiBuZXcgTGluZSggdGhpcy5wb3NpdGlvbkF0KCBiICksIHRoaXMucG9zaXRpb25BdCggYSArIGIgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHJldmVyc2VkIGNvcHkgb2YgdGhpcyBzZWdtZW50IChtYXBwaW5nIHRoZSBwYXJhbWV0cml6YXRpb24gZnJvbSBbMCwxXSA9PiBbMSwwXSkuXHJcbiAgICovXHJcbiAgcHVibGljIHJldmVyc2VkKCk6IExpbmUge1xyXG4gICAgcmV0dXJuIG5ldyBMaW5lKCB0aGlzLl9lbmQsIHRoaXMuX3N0YXJ0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0IGEgbGluZSBpbiB0aGUgJCh0aGV0YSxyKSQgcGxhbmUgb2YgdGhlIGZvcm0gJChcXHRoZXRhXzEscl8xKSQgdG8gJChcXHRoZXRhXzIscl8yKSQgYW5kXHJcbiAgICogY29udmVydHMgdG8gdGhlIGNhcnRlc2lhbiBjb29yZGluYXRlIHN5c3RlbVxyXG4gICAqXHJcbiAgICogRS5nLiBhIHBvbGFyIGxpbmUgKDAsMSkgdG8gKDIgUGksMSkgd291bGQgYmUgbWFwcGVkIHRvIGEgY2lyY2xlIG9mIHJhZGl1cyAxXHJcbiAgICovXHJcbiAgcHVibGljIHBvbGFyVG9DYXJ0ZXNpYW4oIG9wdGlvbnM6IFBpZWNld2lzZUxpbmVhck9wdGlvbnMgKTogU2VnbWVudFtdIHtcclxuICAgIC8vIHggcmVwcmVzZW50IGFuIGFuZ2xlIHdoZXJlYXMgeSByZXByZXNlbnQgYSByYWRpdXNcclxuICAgIGlmICggdGhpcy5fc3RhcnQueCA9PT0gdGhpcy5fZW5kLnggKSB7XHJcbiAgICAgIC8vIGFuZ2xlIGlzIHRoZSBzYW1lLCB3ZSBhcmUgc3RpbGwgYSBsaW5lIHNlZ21lbnQhXHJcbiAgICAgIHJldHVybiBbIG5ldyBMaW5lKCBWZWN0b3IyLmNyZWF0ZVBvbGFyKCB0aGlzLl9zdGFydC55LCB0aGlzLl9zdGFydC54ICksIFZlY3RvcjIuY3JlYXRlUG9sYXIoIHRoaXMuX2VuZC55LCB0aGlzLl9lbmQueCApICkgXTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLl9zdGFydC55ID09PSB0aGlzLl9lbmQueSApIHtcclxuICAgICAgLy8gd2UgaGF2ZSBhIGNvbnN0YW50IHJhZGl1cywgc28gd2UgYXJlIGEgY2lyY3VsYXIgYXJjXHJcbiAgICAgIHJldHVybiBbIG5ldyBBcmMoIFZlY3RvcjIuWkVSTywgdGhpcy5fc3RhcnQueSwgdGhpcy5fc3RhcnQueCwgdGhpcy5fZW5kLngsIHRoaXMuX3N0YXJ0LnggPiB0aGlzLl9lbmQueCApIF07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMudG9QaWVjZXdpc2VMaW5lYXJTZWdtZW50cyggb3B0aW9ucyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYXJjIGxlbmd0aCBvZiB0aGUgc2VnbWVudC5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgZ2V0QXJjTGVuZ3RoKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5zdGFydC5kaXN0YW5jZSggdGhpcy5lbmQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdlIGNhbiBoYW5kbGUgdGhpcyBzaW1wbHkgYnkgcmV0dXJuaW5nIG91cnNlbHZlcy5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgdG9QaWVjZXdpc2VMaW5lYXJPckFyY1NlZ21lbnRzKCk6IFNlZ21lbnRbXSB7XHJcbiAgICByZXR1cm4gWyB0aGlzIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIG9iamVjdCBmb3JtIHRoYXQgY2FuIGJlIHR1cm5lZCBiYWNrIGludG8gYSBzZWdtZW50IHdpdGggdGhlIGNvcnJlc3BvbmRpbmcgZGVzZXJpYWxpemUgbWV0aG9kLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXJpYWxpemUoKTogU2VyaWFsaXplZExpbmUge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ0xpbmUnLFxyXG4gICAgICBzdGFydFg6IHRoaXMuX3N0YXJ0LngsXHJcbiAgICAgIHN0YXJ0WTogdGhpcy5fc3RhcnQueSxcclxuICAgICAgZW5kWDogdGhpcy5fZW5kLngsXHJcbiAgICAgIGVuZFk6IHRoaXMuX2VuZC55XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lIHdoZXRoZXIgdHdvIGxpbmVzIG92ZXJsYXAgb3ZlciBhIGNvbnRpbnVvdXMgc2VjdGlvbiwgYW5kIGlmIHNvIGZpbmRzIHRoZSBhLGIgcGFpciBzdWNoIHRoYXRcclxuICAgKiBwKCB0ICkgPT09IHEoIGEgKiB0ICsgYiApLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHNlZ21lbnRcclxuICAgKiBAcGFyYW0gW2Vwc2lsb25dIC0gV2lsbCByZXR1cm4gb3ZlcmxhcHMgb25seSBpZiBubyB0d28gY29ycmVzcG9uZGluZyBwb2ludHMgZGlmZmVyIGJ5IHRoaXMgYW1vdW50IG9yIG1vcmVcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW4gb25lIGNvbXBvbmVudC5cclxuICAgKiBAcmV0dXJucyAtIFRoZSBzb2x1dGlvbiwgaWYgdGhlcmUgaXMgb25lIChhbmQgb25seSBvbmUpXHJcbiAgICovXHJcbiAgcHVibGljIGdldE92ZXJsYXBzKCBzZWdtZW50OiBTZWdtZW50LCBlcHNpbG9uID0gMWUtNiApOiBPdmVybGFwW10gfCBudWxsIHtcclxuICAgIGlmICggc2VnbWVudCBpbnN0YW5jZW9mIExpbmUgKSB7XHJcbiAgICAgIHJldHVybiBMaW5lLmdldE92ZXJsYXBzKCB0aGlzLCBzZWdtZW50ICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZ2V0Q2xvc2VzdFBvaW50cyggcG9pbnQ6IFZlY3RvcjIgKTogQ2xvc2VzdFRvUG9pbnRSZXN1bHRbXSB7XHJcbiAgICAvLyBUT0RPOiBDYW4gYmUgc2ltcGxpZmllZCBieSBnZXR0aW5nIHRoZSBub3JtYWxpemVkIGRpcmVjdGlvbiB2ZWN0b3IsIGdldHRpbmcgaXRzIHBlcnBlbmRpY3VsYXIsIGFuZCBkb3R0aW5nIHdpdGggaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzk4XHJcbiAgICAvLyBUT0RPOiB0aGUgc3RhcnQgb3IgZW5kIHBvaW50IChzaG91bGQgYmUgdGhlIHNhbWUgcmVzdWx0KS4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzk4XHJcbiAgICAvLyBUT0RPOiBTZWUgTGluZWFyRWRnZS5ldmFsdWF0ZUNsb3Nlc3REaXN0YW5jZVRvT3JpZ2luIGZvciBkZXRhaWxzLiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvOThcclxuXHJcbiAgICBjb25zdCBkZWx0YSA9IHRoaXMuX2VuZC5taW51cyggdGhpcy5fc3RhcnQgKTtcclxuXHJcbiAgICAvLyBOb3JtYWxpemVkIHN0YXJ0ID0+IGVuZFxyXG4gICAgY29uc3Qgbm9ybWFsaXplZERpcmVjdGlvbiA9IGRlbHRhLm5vcm1hbGl6ZWQoKTtcclxuXHJcbiAgICAvLyBOb3JtYWxpemVkIGRpc3RhbmNlIGFsb25nIHRoZSBsaW5lIGZyb20gdGhlIHN0YXJ0IHRvIHRoZSBwb2ludFxyXG4gICAgY29uc3QgaW50ZXJzZWN0aW9uTm9ybWFsaXplZCA9IHBvaW50Lm1pbnVzKCB0aGlzLl9zdGFydCApLmRvdCggbm9ybWFsaXplZERpcmVjdGlvbiApO1xyXG5cclxuICAgIGNvbnN0IGludGVyc2VjdGlvblQgPSBVdGlscy5jbGFtcCggaW50ZXJzZWN0aW9uTm9ybWFsaXplZCAvIGRlbHRhLm1hZ25pdHVkZSwgMCwgMSApO1xyXG5cclxuICAgIGNvbnN0IGludGVyc2VjdGlvblBvaW50ID0gdGhpcy5wb3NpdGlvbkF0KCBpbnRlcnNlY3Rpb25UICk7XHJcblxyXG4gICAgcmV0dXJuIFsge1xyXG4gICAgICBzZWdtZW50OiB0aGlzLFxyXG4gICAgICB0OiBpbnRlcnNlY3Rpb25ULFxyXG4gICAgICBjbG9zZXN0UG9pbnQ6IGludGVyc2VjdGlvblBvaW50LFxyXG4gICAgICBkaXN0YW5jZVNxdWFyZWQ6IGludGVyc2VjdGlvblBvaW50LmRpc3RhbmNlU3F1YXJlZCggcG9pbnQgKVxyXG4gICAgfSBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIExpbmUgZnJvbSB0aGUgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIG92ZXJyaWRlIGRlc2VyaWFsaXplKCBvYmo6IFNlcmlhbGl6ZWRMaW5lICk6IExpbmUge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb2JqLnR5cGUgPT09ICdMaW5lJyApO1xyXG5cclxuICAgIHJldHVybiBuZXcgTGluZSggbmV3IFZlY3RvcjIoIG9iai5zdGFydFgsIG9iai5zdGFydFkgKSwgbmV3IFZlY3RvcjIoIG9iai5lbmRYLCBvYmouZW5kWSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmUgd2hldGhlciB0d28gbGluZXMgb3ZlcmxhcCBvdmVyIGEgY29udGludW91cyBzZWN0aW9uLCBhbmQgaWYgc28gZmluZHMgdGhlIGEsYiBwYWlyIHN1Y2ggdGhhdFxyXG4gICAqIHAoIHQgKSA9PT0gcSggYSAqIHQgKyBiICkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbGluZTFcclxuICAgKiBAcGFyYW0gbGluZTJcclxuICAgKiBAcGFyYW0gW2Vwc2lsb25dIC0gV2lsbCByZXR1cm4gb3ZlcmxhcHMgb25seSBpZiBubyB0d28gY29ycmVzcG9uZGluZyBwb2ludHMgZGlmZmVyIGJ5IHRoaXMgYW1vdW50IG9yIG1vcmVcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW4gb25lIGNvbXBvbmVudC5cclxuICAgKiBAcmV0dXJucyAtIFRoZSBzb2x1dGlvbiwgaWYgdGhlcmUgaXMgb25lIChhbmQgb25seSBvbmUpXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBnZXRPdmVybGFwcyggbGluZTE6IExpbmUsIGxpbmUyOiBMaW5lLCBlcHNpbG9uID0gMWUtNiApOiBPdmVybGFwW10ge1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiBOT1RFOiBGb3IgaW1wbGVtZW50YXRpb24gZGV0YWlscyBpbiB0aGlzIGZ1bmN0aW9uLCBwbGVhc2Ugc2VlIEN1YmljLmdldE92ZXJsYXBzLiBJdCBnb2VzIG92ZXIgYWxsIG9mIHRoZVxyXG4gICAgICogc2FtZSBpbXBsZW1lbnRhdGlvbiBkZXRhaWxzLCBidXQgaW5zdGVhZCBvdXIgYmV6aWVyIG1hdHJpeCBpcyBhIDJ4MjpcclxuICAgICAqXHJcbiAgICAgKiBbICAxICAwIF1cclxuICAgICAqIFsgLTEgIDEgXVxyXG4gICAgICpcclxuICAgICAqIEFuZCB3ZSB1c2UgdGhlIHVwcGVyLWxlZnQgc2VjdGlvbiBvZiAoYXQrYikgYWRqdXN0bWVudCBtYXRyaXggcmVsZXZhbnQgZm9yIHRoZSBsaW5lLlxyXG4gICAgICovXHJcblxyXG4gICAgY29uc3Qgbm9PdmVybGFwOiBPdmVybGFwW10gPSBbXTtcclxuXHJcbiAgICAvLyBFZmZpY2llbnRseSBjb21wdXRlIHRoZSBtdWx0aXBsaWNhdGlvbiBvZiB0aGUgYmV6aWVyIG1hdHJpeDpcclxuICAgIGNvbnN0IHAweCA9IGxpbmUxLl9zdGFydC54O1xyXG4gICAgY29uc3QgcDF4ID0gLTEgKiBsaW5lMS5fc3RhcnQueCArIGxpbmUxLl9lbmQueDtcclxuICAgIGNvbnN0IHAweSA9IGxpbmUxLl9zdGFydC55O1xyXG4gICAgY29uc3QgcDF5ID0gLTEgKiBsaW5lMS5fc3RhcnQueSArIGxpbmUxLl9lbmQueTtcclxuICAgIGNvbnN0IHEweCA9IGxpbmUyLl9zdGFydC54O1xyXG4gICAgY29uc3QgcTF4ID0gLTEgKiBsaW5lMi5fc3RhcnQueCArIGxpbmUyLl9lbmQueDtcclxuICAgIGNvbnN0IHEweSA9IGxpbmUyLl9zdGFydC55O1xyXG4gICAgY29uc3QgcTF5ID0gLTEgKiBsaW5lMi5fc3RhcnQueSArIGxpbmUyLl9lbmQueTtcclxuXHJcbiAgICAvLyBEZXRlcm1pbmUgdGhlIGNhbmRpZGF0ZSBvdmVybGFwIChwcmVmZXJyaW5nIHRoZSBkaW1lbnNpb24gd2l0aCB0aGUgbGFyZ2VzdCB2YXJpYXRpb24pXHJcbiAgICBjb25zdCB4U3ByZWFkID0gTWF0aC5hYnMoIE1hdGgubWF4KCBsaW5lMS5fc3RhcnQueCwgbGluZTEuX2VuZC54LCBsaW5lMi5fc3RhcnQueCwgbGluZTIuX2VuZC54ICkgLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbiggbGluZTEuX3N0YXJ0LngsIGxpbmUxLl9lbmQueCwgbGluZTIuX3N0YXJ0LngsIGxpbmUyLl9lbmQueCApICk7XHJcbiAgICBjb25zdCB5U3ByZWFkID0gTWF0aC5hYnMoIE1hdGgubWF4KCBsaW5lMS5fc3RhcnQueSwgbGluZTEuX2VuZC55LCBsaW5lMi5fc3RhcnQueSwgbGluZTIuX2VuZC55ICkgLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbiggbGluZTEuX3N0YXJ0LnksIGxpbmUxLl9lbmQueSwgbGluZTIuX3N0YXJ0LnksIGxpbmUyLl9lbmQueSApICk7XHJcbiAgICBjb25zdCB4T3ZlcmxhcCA9IFNlZ21lbnQucG9seW5vbWlhbEdldE92ZXJsYXBMaW5lYXIoIHAweCwgcDF4LCBxMHgsIHExeCApO1xyXG4gICAgY29uc3QgeU92ZXJsYXAgPSBTZWdtZW50LnBvbHlub21pYWxHZXRPdmVybGFwTGluZWFyKCBwMHksIHAxeSwgcTB5LCBxMXkgKTtcclxuICAgIGxldCBvdmVybGFwO1xyXG4gICAgaWYgKCB4U3ByZWFkID4geVNwcmVhZCApIHtcclxuICAgICAgb3ZlcmxhcCA9ICggeE92ZXJsYXAgPT09IG51bGwgfHwgeE92ZXJsYXAgPT09IHRydWUgKSA/IHlPdmVybGFwIDogeE92ZXJsYXA7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgb3ZlcmxhcCA9ICggeU92ZXJsYXAgPT09IG51bGwgfHwgeU92ZXJsYXAgPT09IHRydWUgKSA/IHhPdmVybGFwIDogeU92ZXJsYXA7XHJcbiAgICB9XHJcbiAgICBpZiAoIG92ZXJsYXAgPT09IG51bGwgfHwgb3ZlcmxhcCA9PT0gdHJ1ZSApIHtcclxuICAgICAgcmV0dXJuIG5vT3ZlcmxhcDsgLy8gTm8gd2F5IHRvIHBpbiBkb3duIGFuIG92ZXJsYXBcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhID0gb3ZlcmxhcC5hO1xyXG4gICAgY29uc3QgYiA9IG92ZXJsYXAuYjtcclxuXHJcbiAgICAvLyBDb21wdXRlIGxpbmVhciBjb2VmZmljaWVudHMgZm9yIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gcCh0KSBhbmQgcShhKnQrYilcclxuICAgIGNvbnN0IGQweCA9IHEweCArIGIgKiBxMXggLSBwMHg7XHJcbiAgICBjb25zdCBkMXggPSBhICogcTF4IC0gcDF4O1xyXG4gICAgY29uc3QgZDB5ID0gcTB5ICsgYiAqIHExeSAtIHAweTtcclxuICAgIGNvbnN0IGQxeSA9IGEgKiBxMXkgLSBwMXk7XHJcblxyXG4gICAgLy8gRXhhbWluZSB0aGUgc2luZ2xlLWNvb3JkaW5hdGUgZGlzdGFuY2VzIGJldHdlZW4gdGhlIFwib3ZlcmxhcHNcIiBhdCBlYWNoIGV4dHJlbWUgVCB2YWx1ZS4gSWYgdGhlIGRpc3RhbmNlIGlzIGxhcmdlclxyXG4gICAgLy8gdGhhbiBvdXIgZXBzaWxvbiwgdGhlbiB0aGUgXCJvdmVybGFwXCIgd291bGQgbm90IGJlIHZhbGlkLlxyXG4gICAgaWYgKCBNYXRoLmFicyggZDB4ICkgPiBlcHNpbG9uIHx8XHJcbiAgICAgICAgIE1hdGguYWJzKCBkMXggKyBkMHggKSA+IGVwc2lsb24gfHxcclxuICAgICAgICAgTWF0aC5hYnMoIGQweSApID4gZXBzaWxvbiB8fFxyXG4gICAgICAgICBNYXRoLmFicyggZDF5ICsgZDB5ICkgPiBlcHNpbG9uICkge1xyXG4gICAgICAvLyBXZSdyZSBhYmxlIHRvIGVmZmljaWVudGx5IGhhcmRjb2RlIHRoZXNlIGZvciB0aGUgbGluZS1saW5lIGNhc2UsIHNpbmNlIHRoZXJlIGFyZSBubyBleHRyZW1lIHQgdmFsdWVzIHRoYXQgYXJlXHJcbiAgICAgIC8vIG5vdCB0PTAgb3IgdD0xLlxyXG4gICAgICByZXR1cm4gbm9PdmVybGFwO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHF0MCA9IGI7XHJcbiAgICBjb25zdCBxdDEgPSBhICsgYjtcclxuXHJcbiAgICAvLyBUT0RPOiBkbyB3ZSB3YW50IGFuIGVwc2lsb24gaW4gaGVyZSB0byBiZSBwZXJtaXNzaXZlPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgIGlmICggKCBxdDAgPiAxICYmIHF0MSA+IDEgKSB8fCAoIHF0MCA8IDAgJiYgcXQxIDwgMCApICkge1xyXG4gICAgICByZXR1cm4gbm9PdmVybGFwO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBbIG5ldyBPdmVybGFwKCBhLCBiICkgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW55IChmaW5pdGUpIGludGVyc2VjdGlvbiBiZXR3ZWVuIHRoZSB0d28gbGluZSBzZWdtZW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIG92ZXJyaWRlIGludGVyc2VjdCggYTogTGluZSwgYjogTGluZSApOiBTZWdtZW50SW50ZXJzZWN0aW9uW10ge1xyXG5cclxuICAgIC8vIFRPRE86IGxvb2sgaW50byBudW1lcmljYWxseSBtb3JlIGFjY3VyYXRlIHNvbHV0aW9ucz8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzk4XHJcblxyXG4gICAgY29uc3QgbGluZVNlZ21lbnRJbnRlcnNlY3Rpb24gPSBVdGlscy5saW5lU2VnbWVudEludGVyc2VjdGlvbihcclxuICAgICAgYS5zdGFydC54LCBhLnN0YXJ0LnksIGEuZW5kLngsIGEuZW5kLnksXHJcbiAgICAgIGIuc3RhcnQueCwgYi5zdGFydC55LCBiLmVuZC54LCBiLmVuZC55XHJcbiAgICApO1xyXG5cclxuICAgIGlmICggbGluZVNlZ21lbnRJbnRlcnNlY3Rpb24gIT09IG51bGwgKSB7XHJcbiAgICAgIGNvbnN0IGFUID0gYS5leHBsaWNpdENsb3Nlc3RUb1BvaW50KCBsaW5lU2VnbWVudEludGVyc2VjdGlvbiApWyAwIF0udDtcclxuICAgICAgY29uc3QgYlQgPSBiLmV4cGxpY2l0Q2xvc2VzdFRvUG9pbnQoIGxpbmVTZWdtZW50SW50ZXJzZWN0aW9uIClbIDAgXS50O1xyXG4gICAgICByZXR1cm4gWyBuZXcgU2VnbWVudEludGVyc2VjdGlvbiggbGluZVNlZ21lbnRJbnRlcnNlY3Rpb24sIGFULCBiVCApIF07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbnkgaW50ZXJzZWN0aW9ucyBiZXR3ZWVuIGEgbGluZSBzZWdtZW50IGFuZCBhbm90aGVyIHR5cGUgb2Ygc2VnbWVudC5cclxuICAgKlxyXG4gICAqIFRoaXMgc2hvdWxkIGJlIG1vcmUgb3B0aW1pemVkIHRoYW4gdGhlIGdlbmVyYWwgaW50ZXJzZWN0aW9uIHJvdXRpbmUgb2YgYXJiaXRyYXJ5IHNlZ21lbnRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgaW50ZXJzZWN0T3RoZXIoIGxpbmU6IExpbmUsIG90aGVyOiBTZWdtZW50ICk6IFNlZ21lbnRJbnRlcnNlY3Rpb25bXSB7XHJcblxyXG4gICAgLy8gU2V0IHVwIGEgcmF5XHJcbiAgICBjb25zdCBkZWx0YSA9IGxpbmUuZW5kLm1pbnVzKCBsaW5lLnN0YXJ0ICk7XHJcbiAgICBjb25zdCBsZW5ndGggPSBkZWx0YS5tYWduaXR1ZGU7XHJcbiAgICBjb25zdCByYXkgPSBuZXcgUmF5MiggbGluZS5zdGFydCwgZGVsdGEubm9ybWFsaXplKCkgKTtcclxuXHJcbiAgICAvLyBGaW5kIHRoZSBvdGhlciBzZWdtZW50J3MgaW50ZXJzZWN0aW9ucyB3aXRoIHRoZSByYXlcclxuICAgIGNvbnN0IHJheUludGVyc2VjdGlvbnMgPSBvdGhlci5pbnRlcnNlY3Rpb24oIHJheSApO1xyXG5cclxuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHJheUludGVyc2VjdGlvbnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IHJheUludGVyc2VjdGlvbiA9IHJheUludGVyc2VjdGlvbnNbIGkgXTtcclxuICAgICAgY29uc3QgbGluZVQgPSByYXlJbnRlcnNlY3Rpb24uZGlzdGFuY2UgLyBsZW5ndGg7XHJcblxyXG4gICAgICAvLyBFeGNsdWRlIGludGVyc2VjdGlvbnMgdGhhdCBhcmUgb3V0c2lkZSBvdXIgbGluZSBzZWdtZW50IChvciByaWdodCBvbiB0aGUgYm91bmRhcnkpXHJcbiAgICAgIGlmICggbGluZVQgPiAxZS04ICYmIGxpbmVUIDwgMSAtIDFlLTggKSB7XHJcbiAgICAgICAgcmVzdWx0cy5wdXNoKCBuZXcgU2VnbWVudEludGVyc2VjdGlvbiggcmF5SW50ZXJzZWN0aW9uLnBvaW50LCBsaW5lVCwgcmF5SW50ZXJzZWN0aW9uLnQgKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxuICB9XHJcbn1cclxuXHJcbmtpdGUucmVnaXN0ZXIoICdMaW5lJywgTGluZSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxPQUFPLE1BQU0sNEJBQTRCO0FBRWhELE9BQU9DLElBQUksTUFBTSx5QkFBeUI7QUFDMUMsT0FBT0MsS0FBSyxNQUFNLDBC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