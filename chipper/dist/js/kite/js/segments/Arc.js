// Copyright 2013-2024, University of Colorado Boulder

/**
 * A circular arc (a continuous sub-part of a circle).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../../dot/js/Bounds2.js';
import Matrix3 from '../../../dot/js/Matrix3.js';
import Utils from '../../../dot/js/Utils.js';
import Vector2 from '../../../dot/js/Vector2.js';
import { EllipticalArc, kite, Line, Overlap, RayIntersection, Segment, SegmentIntersection, svgNumber } from '../imports.js';

// TODO: See if we should use this more https://github.com/phetsims/kite/issues/76
const TWO_PI = Math.PI * 2;
export default class Arc extends Segment {
  // Lazily-computed derived information

  // End angle in relation to our start angle (can get remapped)
  // Whether it's a full circle (and not just an arc)

  /**
   * If the startAngle/endAngle difference is ~2pi, this will be a full circle
   *
   * See http://www.w3.org/TR/2dcontext/#dom-context-2d-arc for detailed information on the parameters.
   *
   * @param center - Center of the arc (every point on the arc is equally far from the center)
   * @param radius - How far from the center the arc will be
   * @param startAngle - Angle (radians) of the start of the arc
   * @param endAngle - Angle (radians) of the end of the arc
   * @param anticlockwise - Decides which direction the arc takes around the center
   */
  constructor(center, radius, startAngle, endAngle, anticlockwise) {
    super();
    this._center = center;
    this._radius = radius;
    this._startAngle = startAngle;
    this._endAngle = endAngle;
    this._anticlockwise = anticlockwise;
    this.invalidate();
  }

  /**
   * Sets the center of the Arc.
   */
  setCenter(center) {
    assert && assert(center.isFinite(), `Arc center should be finite: ${center.toString()}`);
    if (!this._center.equals(center)) {
      this._center = center;
      this.invalidate();
    }
    return this; // allow chaining
  }
  set center(value) {
    this.setCenter(value);
  }
  get center() {
    return this.getCenter();
  }

  /**
   * Returns the center of this Arc.
   */
  getCenter() {
    return this._center;
  }

  /**
   * Sets the radius of the Arc.
   */
  setRadius(radius) {
    assert && assert(isFinite(radius), `Arc radius should be a finite number: ${radius}`);
    if (this._radius !== radius) {
      this._radius = radius;
      this.invalidate();
    }
    return this; // allow chaining
  }
  set radius(value) {
    this.setRadius(value);
  }
  get radius() {
    return this.getRadius();
  }

  /**
   * Returns the radius of this Arc.
   */
  getRadius() {
    return this._radius;
  }

  /**
   * Sets the startAngle of the Arc.
   */
  setStartAngle(startAngle) {
    assert && assert(isFinite(startAngle), `Arc startAngle should be a finite number: ${startAngle}`);
    if (this._startAngle !== startAngle) {
      this._startAngle = startAngle;
      this.invalidate();
    }
    return this; // allow chaining
  }
  set startAngle(value) {
    this.setStartAngle(value);
  }
  get startAngle() {
    return this.getStartAngle();
  }

  /**
   * Returns the startAngle of this Arc.
   */
  getStartAngle() {
    return this._startAngle;
  }

  /**
   * Sets the endAngle of the Arc.
   */
  setEndAngle(endAngle) {
    assert && assert(isFinite(endAngle), `Arc endAngle should be a finite number: ${endAngle}`);
    if (this._endAngle !== endAngle) {
      this._endAngle = endAngle;
      this.invalidate();
    }
    return this; // allow chaining
  }
  set endAngle(value) {
    this.setEndAngle(value);
  }
  get endAngle() {
    return this.getEndAngle();
  }

  /**
   * Returns the endAngle of this Arc.
   */
  getEndAngle() {
    return this._endAngle;
  }

  /**
   * Sets the anticlockwise of the Arc.
   */
  setAnticlockwise(anticlockwise) {
    if (this._anticlockwise !== anticlockwise) {
      this._anticlockwise = anticlockwise;
      this.invalidate();
    }
    return this; // allow chaining
  }
  set anticlockwise(value) {
    this.setAnticlockwise(value);
  }
  get anticlockwise() {
    return this.getAnticlockwise();
  }

  /**
   * Returns the anticlockwise of this Arc.
   */
  getAnticlockwise() {
    return this._anticlockwise;
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
    return this.positionAtAngle(this.angleAt(t));
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
    return this.tangentAtAngle(this.angleAt(t));
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

    // Since it is an arc of as circle, the curvature is independent of t
    return (this._anticlockwise ? -1 : 1) / this._radius;
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

    // TODO: verify that we don't need to switch anticlockwise here, or subtract 2pi off any angles https://github.com/phetsims/kite/issues/76
    const angle0 = this.angleAt(0);
    const angleT = this.angleAt(t);
    const angle1 = this.angleAt(1);
    return [new Arc(this._center, this._radius, angle0, angleT, this._anticlockwise), new Arc(this._center, this._radius, angleT, angle1, this._anticlockwise)];
  }

  /**
   * Clears cached information, should be called when any of the 'constructor arguments' are mutated.
   */
  invalidate() {
    this._start = null;
    this._end = null;
    this._startTangent = null;
    this._endTangent = null;
    this._actualEndAngle = null;
    this._isFullPerimeter = null;
    this._angleDifference = null;
    this._bounds = null;
    this._svgPathFragment = null;
    assert && assert(this._center instanceof Vector2, 'Arc center should be a Vector2');
    assert && assert(this._center.isFinite(), 'Arc center should be finite (not NaN or infinite)');
    assert && assert(typeof this._radius === 'number', `Arc radius should be a number: ${this._radius}`);
    assert && assert(isFinite(this._radius), `Arc radius should be a finite number: ${this._radius}`);
    assert && assert(typeof this._startAngle === 'number', `Arc startAngle should be a number: ${this._startAngle}`);
    assert && assert(isFinite(this._startAngle), `Arc startAngle should be a finite number: ${this._startAngle}`);
    assert && assert(typeof this._endAngle === 'number', `Arc endAngle should be a number: ${this._endAngle}`);
    assert && assert(isFinite(this._endAngle), `Arc endAngle should be a finite number: ${this._endAngle}`);
    assert && assert(typeof this._anticlockwise === 'boolean', `Arc anticlockwise should be a boolean: ${this._anticlockwise}`);

    // Remap negative radius to a positive radius
    if (this._radius < 0) {
      // support this case since we might actually need to handle it inside of strokes?
      this._radius = -this._radius;
      this._startAngle += Math.PI;
      this._endAngle += Math.PI;
    }

    // Constraints that should always be satisfied
    assert && assert(!(!this.anticlockwise && this._endAngle - this._startAngle <= -Math.PI * 2 || this.anticlockwise && this._startAngle - this._endAngle <= -Math.PI * 2), 'Not handling arcs with start/end angles that show differences in-between browser handling');
    assert && assert(!(!this.anticlockwise && this._endAngle - this._startAngle > Math.PI * 2 || this.anticlockwise && this._startAngle - this._endAngle > Math.PI * 2), 'Not handling arcs with start/end angles that show differences in-between browser handling');
    this.invalidationEmitter.emit();
  }

  /**
   * Gets the start position of this arc.
   */
  getStart() {
    if (this._start === null) {
      this._start = this.positionAtAngle(this._startAngle);
    }
    return this._start;
  }
  get start() {
    return this.getStart();
  }

  /**
   * Gets the end position of this arc.
   */
  getEnd() {
    if (this._end === null) {
      this._end = this.positionAtAngle(this._endAngle);
    }
    return this._end;
  }
  get end() {
    return this.getEnd();
  }

  /**
   * Gets the unit vector tangent to this arc at the start point.
   */
  getStartTangent() {
    if (this._startTangent === null) {
      this._startTangent = this.tangentAtAngle(this._startAngle);
    }
    return this._startTangent;
  }
  get startTangent() {
    return this.getStartTangent();
  }

  /**
   * Gets the unit vector tangent to the arc at the end point.
   */
  getEndTangent() {
    if (this._endTangent === null) {
      this._endTangent = this.tangentAtAngle(this._endAngle);
    }
    return this._endTangent;
  }
  get endTangent() {
    return this.getEndTangent();
  }

  /**
   * Gets the end angle in radians.
   */
  getActualEndAngle() {
    if (this._actualEndAngle === null) {
      this._actualEndAngle = Arc.computeActualEndAngle(this._startAngle, this._endAngle, this._anticlockwise);
    }
    return this._actualEndAngle;
  }
  get actualEndAngle() {
    return this.getActualEndAngle();
  }

  /**
   * Returns a boolean value that indicates if the arc wraps up by more than two Pi.
   */
  getIsFullPerimeter() {
    if (this._isFullPerimeter === null) {
      this._isFullPerimeter = !this._anticlockwise && this._endAngle - this._startAngle >= Math.PI * 2 || this._anticlockwise && this._startAngle - this._endAngle >= Math.PI * 2;
    }
    return this._isFullPerimeter;
  }
  get isFullPerimeter() {
    return this.getIsFullPerimeter();
  }

  /**
   * Returns an angle difference that represents how "much" of the circle our arc covers.
   *
   * The answer is always greater or equal to zero
   * The answer can exceed two Pi
   */
  getAngleDifference() {
    if (this._angleDifference === null) {
      // compute an angle difference that represents how "much" of the circle our arc covers
      this._angleDifference = this._anticlockwise ? this._startAngle - this._endAngle : this._endAngle - this._startAngle;
      if (this._angleDifference < 0) {
        this._angleDifference += Math.PI * 2;
      }
      assert && assert(this._angleDifference >= 0); // now it should always be zero or positive
    }
    return this._angleDifference;
  }
  get angleDifference() {
    return this.getAngleDifference();
  }

  /**
   * Returns the bounds of this segment.
   */
  getBounds() {
    if (this._bounds === null) {
      // acceleration for intersection
      this._bounds = Bounds2.NOTHING.copy().withPoint(this.getStart()).withPoint(this.getEnd());

      // if the angles are different, check extrema points
      if (this._startAngle !== this._endAngle) {
        // check all of the extrema points
        this.includeBoundsAtAngle(0);
        this.includeBoundsAtAngle(Math.PI / 2);
        this.includeBoundsAtAngle(Math.PI);
        this.includeBoundsAtAngle(3 * Math.PI / 2);
      }
    }
    return this._bounds;
  }
  get bounds() {
    return this.getBounds();
  }

  /**
   * Returns a list of non-degenerate segments that are equivalent to this segment. Generally gets rid (or simplifies)
   * invalid or repeated segments.
   */
  getNondegenerateSegments() {
    if (this._radius <= 0 || this._startAngle === this._endAngle) {
      return [];
    } else {
      return [this]; // basically, Arcs aren't really degenerate that easily
    }
  }

  /**
   * Attempts to expand the private _bounds bounding box to include a point at a specific angle, making sure that
   * angle is actually included in the arc. This will presumably be called at angles that are at critical points,
   * where the arc should have maximum/minimum x/y values.
   */
  includeBoundsAtAngle(angle) {
    if (this.containsAngle(angle)) {
      // the boundary point is in the arc
      this._bounds = this._bounds.withPoint(this._center.plus(Vector2.createPolar(this._radius, angle)));
    }
  }

  /**
   * Maps a contained angle to between [startAngle,actualEndAngle), even if the end angle is lower.
   */
  mapAngle(angle) {
    if (Math.abs(Utils.moduloBetweenDown(angle - this._startAngle, -Math.PI, Math.PI)) < 1e-8) {
      return this._startAngle;
    }
    if (Math.abs(Utils.moduloBetweenDown(angle - this.getActualEndAngle(), -Math.PI, Math.PI)) < 1e-8) {
      return this.getActualEndAngle();
    }
    // consider an assert that we contain that angle?
    return this._startAngle > this.getActualEndAngle() ? Utils.moduloBetweenUp(angle, this._startAngle - 2 * Math.PI, this._startAngle) : Utils.moduloBetweenDown(angle, this._startAngle, this._startAngle + 2 * Math.PI);
  }

  /**
   * Returns the parametrized value t for a given angle. The value t should range from 0 to 1 (inclusive).
   */
  tAtAngle(angle) {
    const t = (this.mapAngle(angle) - this._startAngle) / (this.getActualEndAngle() - this._startAngle);
    assert && assert(t >= 0 && t <= 1, `tAtAngle out of range: ${t}`);
    return t;
  }

  /**
   * Returns the angle for the parametrized t value. The t value should range from 0 to 1 (inclusive).
   */
  angleAt(t) {
    //TODO: add asserts https://github.com/phetsims/kite/issues/76
    return this._startAngle + (this.getActualEndAngle() - this._startAngle) * t;
  }

  /**
   * Returns the position of this arc at angle.
   */
  positionAtAngle(angle) {
    return this._center.plus(Vector2.createPolar(this._radius, angle));
  }

  /**
   * Returns the normalized tangent of this arc.
   * The tangent points outward (inward) of this arc for clockwise (anticlockwise) direction.
   */
  tangentAtAngle(angle) {
    const normal = Vector2.createPolar(1, angle);
    return this._anticlockwise ? normal.perpendicular : normal.perpendicular.negated();
  }

  /**
   * Returns whether the given angle is contained by the arc (whether a ray from the arc's origin going in that angle
   * will intersect the arc).
   */
  containsAngle(angle) {
    // transform the angle into the appropriate coordinate form
    // TODO: check anticlockwise version! https://github.com/phetsims/kite/issues/76
    const normalizedAngle = this._anticlockwise ? angle - this._endAngle : angle - this._startAngle;

    // get the angle between 0 and 2pi
    const positiveMinAngle = Utils.moduloBetweenDown(normalizedAngle, 0, Math.PI * 2);
    return positiveMinAngle <= this.angleDifference;
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
      // see http://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands for more info
      // rx ry x-axis-rotation large-arc-flag sweep-flag x y

      const epsilon = 0.01; // allow some leeway to render things as 'almost circles'
      const sweepFlag = this._anticlockwise ? '0' : '1';
      let largeArcFlag;
      if (this.angleDifference < Math.PI * 2 - epsilon) {
        largeArcFlag = this.angleDifference < Math.PI ? '0' : '1';
        this._svgPathFragment = `A ${svgNumber(this._radius)} ${svgNumber(this._radius)} 0 ${largeArcFlag} ${sweepFlag} ${svgNumber(this.end.x)} ${svgNumber(this.end.y)}`;
      } else {
        // circle (or almost-circle) case needs to be handled differently
        // since SVG will not be able to draw (or know how to draw) the correct circle if we just have a start and end, we need to split it into two circular arcs

        // get the angle that is between and opposite of both of the points
        const splitOppositeAngle = (this._startAngle + this._endAngle) / 2; // this _should_ work for the modular case?
        const splitPoint = this._center.plus(Vector2.createPolar(this._radius, splitOppositeAngle));
        largeArcFlag = '0'; // since we split it in 2, it's always the small arc

        const firstArc = `A ${svgNumber(this._radius)} ${svgNumber(this._radius)} 0 ${largeArcFlag} ${sweepFlag} ${svgNumber(splitPoint.x)} ${svgNumber(splitPoint.y)}`;
        const secondArc = `A ${svgNumber(this._radius)} ${svgNumber(this._radius)} 0 ${largeArcFlag} ${sweepFlag} ${svgNumber(this.end.x)} ${svgNumber(this.end.y)}`;
        this._svgPathFragment = `${firstArc} ${secondArc}`;
      }
    }
    if (assert) {
      if (oldPathFragment) {
        assert(oldPathFragment === this._svgPathFragment, 'Quadratic line segment changed without invalidate()');
      }
    }
    return this._svgPathFragment;
  }

  /**
   * Returns an array of arcs that will draw an offset on the logical left side
   */
  strokeLeft(lineWidth) {
    return [new Arc(this._center, this._radius + (this._anticlockwise ? 1 : -1) * lineWidth / 2, this._startAngle, this._endAngle, this._anticlockwise)];
  }

  /**
   * Returns an array of arcs that will draw an offset curve on the logical right side
   */
  strokeRight(lineWidth) {
    return [new Arc(this._center, this._radius + (this._anticlockwise ? -1 : 1) * lineWidth / 2, this._endAngle, this._startAngle, !this._anticlockwise)];
  }

  /**
   * Returns a list of t values where dx/dt or dy/dt is 0 where 0 < t < 1. subdividing on these will result in monotonic segments
   * Does not include t=0 and t=1
   */
  getInteriorExtremaTs() {
    const result = [];
    _.each([0, Math.PI / 2, Math.PI, 3 * Math.PI / 2], angle => {
      if (this.containsAngle(angle)) {
        const t = this.tAtAngle(angle);
        const epsilon = 0.0000000001; // TODO: general kite epsilon?, also do 1e-Number format https://github.com/phetsims/kite/issues/76
        if (t > epsilon && t < 1 - epsilon) {
          result.push(t);
        }
      }
    });
    return result.sort(); // modifies original, which is OK
  }

  /**
   * Hit-tests this segment with the ray. An array of all intersections of the ray with this segment will be returned.
   * For details, see the documentation in Segment.js
   */
  intersection(ray) {
    const result = []; // hits in order

    // left here, if in the future we want to better-handle boundary points
    const epsilon = 0;

    // Run a general circle-intersection routine, then we can test the angles later.
    // Solves for the two solutions t such that ray.position + ray.direction * t is on the circle.
    // Then we check whether the angle at each possible hit point is in our arc.
    const centerToRay = ray.position.minus(this._center);
    const tmp = ray.direction.dot(centerToRay);
    const centerToRayDistSq = centerToRay.magnitudeSquared;
    const discriminant = 4 * tmp * tmp - 4 * (centerToRayDistSq - this._radius * this._radius);
    if (discriminant < epsilon) {
      // ray misses circle entirely
      return result;
    }
    const base = ray.direction.dot(this._center) - ray.direction.dot(ray.position);
    const sqt = Math.sqrt(discriminant) / 2;
    const ta = base - sqt;
    const tb = base + sqt;
    if (tb < epsilon) {
      // circle is behind ray
      return result;
    }
    const pointB = ray.pointAtDistance(tb);
    const normalB = pointB.minus(this._center).normalized();
    const normalBAngle = normalB.angle;
    if (ta < epsilon) {
      // we are inside the circle, so only one intersection is possible
      if (this.containsAngle(normalBAngle)) {
        // normal is towards the ray, so we negate it. also winds opposite way
        result.push(new RayIntersection(tb, pointB, normalB.negated(), this._anticlockwise ? -1 : 1, this.tAtAngle(normalBAngle)));
      }
    } else {
      // two possible hits (outside circle)
      const pointA = ray.pointAtDistance(ta);
      const normalA = pointA.minus(this._center).normalized();
      const normalAAngle = normalA.angle;
      if (this.containsAngle(normalAAngle)) {
        // hit from outside
        result.push(new RayIntersection(ta, pointA, normalA, this._anticlockwise ? 1 : -1, this.tAtAngle(normalAAngle)));
      }
      if (this.containsAngle(normalBAngle)) {
        result.push(new RayIntersection(tb, pointB, normalB.negated(), this._anticlockwise ? -1 : 1, this.tAtAngle(normalBAngle)));
      }
    }
    return result;
  }

  /**
   * Returns the resultant winding number of this ray intersecting this arc.
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
   * Draws this arc to the 2D Canvas context, assuming the context's current location is already at the start point
   */
  writeToContext(context) {
    context.arc(this._center.x, this._center.y, this._radius, this._startAngle, this._endAngle, this._anticlockwise);
  }

  /**
   * Returns a new copy of this arc, transformed by the given matrix.
   *
   * TODO: test various transform types, especially rotations, scaling, shears, etc. https://github.com/phetsims/kite/issues/76
   */
  transformed(matrix) {
    // so we can handle reflections in the transform, we do the general case handling for start/end angles
    const startAngle = matrix.timesVector2(Vector2.createPolar(1, this._startAngle)).minus(matrix.timesVector2(Vector2.ZERO)).angle;
    let endAngle = matrix.timesVector2(Vector2.createPolar(1, this._endAngle)).minus(matrix.timesVector2(Vector2.ZERO)).angle;

    // reverse the 'clockwiseness' if our transform includes a reflection
    const anticlockwise = matrix.getDeterminant() >= 0 ? this._anticlockwise : !this._anticlockwise;
    if (Math.abs(this._endAngle - this._startAngle) === Math.PI * 2) {
      endAngle = anticlockwise ? startAngle - Math.PI * 2 : startAngle + Math.PI * 2;
    }
    const scaleVector = matrix.getScaleVector();
    if (scaleVector.x !== scaleVector.y) {
      const radiusX = scaleVector.x * this._radius;
      const radiusY = scaleVector.y * this._radius;
      return new EllipticalArc(matrix.timesVector2(this._center), radiusX, radiusY, 0, startAngle, endAngle, anticlockwise);
    } else {
      const radius = scaleVector.x * this._radius;
      return new Arc(matrix.timesVector2(this._center), radius, startAngle, endAngle, anticlockwise);
    }
  }

  /**
   * Returns the contribution to the signed area computed using Green's Theorem, with P=-y/2 and Q=x/2.
   *
   * NOTE: This is this segment's contribution to the line integral (-y/2 dx + x/2 dy).
   */
  getSignedAreaFragment() {
    const t0 = this._startAngle;
    const t1 = this.getActualEndAngle();

    // Derived via Mathematica (curve-area.nb)
    return 0.5 * this._radius * (this._radius * (t1 - t0) + this._center.x * (Math.sin(t1) - Math.sin(t0)) - this._center.y * (Math.cos(t1) - Math.cos(t0)));
  }

  /**
   * Returns a reversed copy of this segment (mapping the parametrization from [0,1] => [1,0]).
   */
  reversed() {
    return new Arc(this._center, this._radius, this._endAngle, this._startAngle, !this._anticlockwise);
  }

  /**
   * Returns the arc length of the segment.
   */
  getArcLength() {
    return this.getAngleDifference() * this._radius;
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
      type: 'Arc',
      centerX: this._center.x,
      centerY: this._center.y,
      radius: this._radius,
      startAngle: this._startAngle,
      endAngle: this._endAngle,
      anticlockwise: this._anticlockwise
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
    if (segment instanceof Arc) {
      return Arc.getOverlaps(this, segment);
    }
    return null;
  }

  /**
   * Returns the matrix representation of the conic section of the circle.
   * See https://en.wikipedia.org/wiki/Matrix_representation_of_conic_sections
   */
  getConicMatrix() {
    // ( x - a )^2 + ( y - b )^2 = r^2
    // x^2 - 2ax + a^2 + y^2 - 2by + b^2 = r^2
    // x^2 + y^2 - 2ax - 2by + ( a^2 + b^2 - r^2 ) = 0

    const a = this.center.x;
    const b = this.center.y;

    // Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0
    const A = 1;
    const B = 0;
    const C = 1;
    const D = -2 * a;
    const E = -2 * b;
    const F = a * a + b * b - this.radius * this.radius;
    return Matrix3.rowMajor(A, B / 2, D / 2, B / 2, C, E / 2, D / 2, E / 2, F);
  }

  /**
   * Returns an Arc from the serialized representation.
   */
  static deserialize(obj) {
    assert && assert(obj.type === 'Arc');
    return new Arc(new Vector2(obj.centerX, obj.centerY), obj.radius, obj.startAngle, obj.endAngle, obj.anticlockwise);
  }

  /**
   * Determines the actual end angle (compared to the start angle).
   *
   * Normalizes the sign of the angles, so that the sign of ( endAngle - startAngle ) matches whether it is
   * anticlockwise.
   */
  static computeActualEndAngle(startAngle, endAngle, anticlockwise) {
    if (anticlockwise) {
      // angle is 'decreasing'
      // -2pi <= end - start < 2pi
      if (startAngle > endAngle) {
        return endAngle;
      } else if (startAngle < endAngle) {
        return endAngle - 2 * Math.PI;
      } else {
        // equal
        return startAngle;
      }
    } else {
      // angle is 'increasing'
      // -2pi < end - start <= 2pi
      if (startAngle < endAngle) {
        return endAngle;
      } else if (startAngle > endAngle) {
        return endAngle + Math.PI * 2;
      } else {
        // equal
        return startAngle;
      }
    }
  }

  /**
   * Computes the potential overlap between [0,end1] and [start2,end2] (with t-values [0,1] and [tStart2,tEnd2]).
   *
   * @param end1 - Relative end angle of the first segment
   * @param start2 - Relative start angle of the second segment
   * @param end2 - Relative end angle of the second segment
   * @param tStart2 - The parametric value of the second segment's start
   * @param tEnd2 - The parametric value of the second segment's end
   */
  static getPartialOverlap(end1, start2, end2, tStart2, tEnd2) {
    assert && assert(end1 > 0 && end1 <= TWO_PI + 1e-10);
    assert && assert(start2 >= 0 && start2 < TWO_PI + 1e-10);
    assert && assert(end2 >= 0 && end2 <= TWO_PI + 1e-10);
    assert && assert(tStart2 >= 0 && tStart2 <= 1);
    assert && assert(tEnd2 >= 0 && tEnd2 <= 1);
    const reversed2 = end2 < start2;
    const min2 = reversed2 ? end2 : start2;
    const max2 = reversed2 ? start2 : end2;
    const overlapMin = min2;
    const overlapMax = Math.min(end1, max2);

    // If there's not a small amount of overlap
    if (overlapMax < overlapMin + 1e-8) {
      return [];
    } else {
      return [Overlap.createLinear(
      // minimum
      Utils.clamp(Utils.linear(0, end1, 0, 1, overlapMin), 0, 1),
      // arc1 min
      Utils.clamp(Utils.linear(start2, end2, tStart2, tEnd2, overlapMin), 0, 1),
      // arc2 min
      // maximum
      Utils.clamp(Utils.linear(0, end1, 0, 1, overlapMax), 0, 1),
      // arc1 max
      Utils.clamp(Utils.linear(start2, end2, tStart2, tEnd2, overlapMax), 0, 1) // arc2 max
      )];
    }
  }

  /**
   * Determine whether two Arcs overlap over continuous sections, and if so finds the a,b pairs such that
   * p( t ) === q( a * t + b ).
   *
   * @param startAngle1 - Start angle of arc 1
   * @param endAngle1 - "Actual" end angle of arc 1
   * @param startAngle2 - Start angle of arc 2
   * @param endAngle2 - "Actual" end angle of arc 2
   * @returns - Any overlaps (from 0 to 2)
   */
  static getAngularOverlaps(startAngle1, endAngle1, startAngle2, endAngle2) {
    assert && assert(isFinite(startAngle1));
    assert && assert(isFinite(endAngle1));
    assert && assert(isFinite(startAngle2));
    assert && assert(isFinite(endAngle2));

    // Remap start of arc 1 to 0, and the end to be positive (sign1 )
    let end1 = endAngle1 - startAngle1;
    const sign1 = end1 < 0 ? -1 : 1;
    end1 *= sign1;

    // Remap arc 2 so the start point maps to the [0,2pi) range (and end-point may lie outside that)
    const start2 = Utils.moduloBetweenDown(sign1 * (startAngle2 - startAngle1), 0, TWO_PI);
    const end2 = sign1 * (endAngle2 - startAngle2) + start2;
    let wrapT;
    if (end2 < -1e-10) {
      wrapT = -start2 / (end2 - start2);
      return Arc.getPartialOverlap(end1, start2, 0, 0, wrapT).concat(Arc.getPartialOverlap(end1, TWO_PI, end2 + TWO_PI, wrapT, 1));
    } else if (end2 > TWO_PI + 1e-10) {
      wrapT = (TWO_PI - start2) / (end2 - start2);
      return Arc.getPartialOverlap(end1, start2, TWO_PI, 0, wrapT).concat(Arc.getPartialOverlap(end1, 0, end2 - TWO_PI, wrapT, 1));
    } else {
      return Arc.getPartialOverlap(end1, start2, end2, 0, 1);
    }
  }

  /**
   * Determine whether two Arcs overlap over continuous sections, and if so finds the a,b pairs such that
   * p( t ) === q( a * t + b ).
   *
   * @returns - Any overlaps (from 0 to 2)
   */
  static getOverlaps(arc1, arc2) {
    if (arc1._center.distance(arc2._center) > 1e-4 || Math.abs(arc1._radius - arc2._radius) > 1e-4) {
      return [];
    }
    return Arc.getAngularOverlaps(arc1._startAngle, arc1.getActualEndAngle(), arc2._startAngle, arc2.getActualEndAngle());
  }

  /**
   * Returns the points of intersections between two circles.
   *
   * @param center1 - Center of the first circle
   * @param radius1 - Radius of the first circle
   * @param center2 - Center of the second circle
   * @param radius2 - Radius of the second circle
   */
  static getCircleIntersectionPoint(center1, radius1, center2, radius2) {
    assert && assert(isFinite(radius1) && radius1 >= 0);
    assert && assert(isFinite(radius2) && radius2 >= 0);
    const delta = center2.minus(center1);
    const d = delta.magnitude;
    let results = [];
    if (d < 1e-10 || d > radius1 + radius2 + 1e-10) {
      // No intersections
    } else if (d > radius1 + radius2 - 1e-10) {
      results = [center1.blend(center2, radius1 / d)];
    } else {
      const xPrime = 0.5 * (d * d - radius2 * radius2 + radius1 * radius1) / d;
      const bit = d * d - radius2 * radius2 + radius1 * radius1;
      const discriminant = 4 * d * d * radius1 * radius1 - bit * bit;
      const base = center1.blend(center2, xPrime / d);
      if (discriminant >= 1e-10) {
        const yPrime = Math.sqrt(discriminant) / d / 2;
        const perpendicular = delta.perpendicular.setMagnitude(yPrime);
        results = [base.plus(perpendicular), base.minus(perpendicular)];
      } else if (discriminant > -1e-10) {
        results = [base];
      }
    }
    if (assert) {
      results.forEach(result => {
        assert(Math.abs(result.distance(center1) - radius1) < 1e-8);
        assert(Math.abs(result.distance(center2) - radius2) < 1e-8);
      });
    }
    return results;
  }

  /**
   * Returns any (finite) intersection between the two arc segments.
   */
  static intersect(a, b) {
    const epsilon = 1e-7;
    const results = [];

    // If we effectively have the same circle, just different sections of it. The only finite intersections could be
    // at the endpoints, so we'll inspect those.
    if (a._center.equalsEpsilon(b._center, epsilon) && Math.abs(a._radius - b._radius) < epsilon) {
      const aStart = a.positionAt(0);
      const aEnd = a.positionAt(1);
      const bStart = b.positionAt(0);
      const bEnd = b.positionAt(1);
      if (aStart.equalsEpsilon(bStart, epsilon)) {
        results.push(new SegmentIntersection(aStart.average(bStart), 0, 0));
      }
      if (aStart.equalsEpsilon(bEnd, epsilon)) {
        results.push(new SegmentIntersection(aStart.average(bEnd), 0, 1));
      }
      if (aEnd.equalsEpsilon(bStart, epsilon)) {
        results.push(new SegmentIntersection(aEnd.average(bStart), 1, 0));
      }
      if (aEnd.equalsEpsilon(bEnd, epsilon)) {
        results.push(new SegmentIntersection(aEnd.average(bEnd), 1, 1));
      }
    } else {
      const points = Arc.getCircleIntersectionPoint(a._center, a._radius, b._center, b._radius);
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const angleA = point.minus(a._center).angle;
        const angleB = point.minus(b._center).angle;
        if (a.containsAngle(angleA) && b.containsAngle(angleB)) {
          results.push(new SegmentIntersection(point, a.tAtAngle(angleA), b.tAtAngle(angleB)));
        }
      }
    }
    return results;
  }

  /**
   * Creates an Arc (or if straight enough a Line) segment that goes from the startPoint to the endPoint, touching
   * the middlePoint somewhere between the two.
   */
  static createFromPoints(startPoint, middlePoint, endPoint) {
    const center = Utils.circleCenterFromPoints(startPoint, middlePoint, endPoint);

    // Close enough
    if (center === null) {
      return new Line(startPoint, endPoint);
    } else {
      const startDiff = startPoint.minus(center);
      const middleDiff = middlePoint.minus(center);
      const endDiff = endPoint.minus(center);
      const startAngle = startDiff.angle;
      const middleAngle = middleDiff.angle;
      const endAngle = endDiff.angle;
      const radius = (startDiff.magnitude + middleDiff.magnitude + endDiff.magnitude) / 3;

      // Try anticlockwise first. TODO: Don't require creation of extra Arcs https://github.com/phetsims/kite/issues/76
      const arc = new Arc(center, radius, startAngle, endAngle, false);
      if (arc.containsAngle(middleAngle)) {
        return arc;
      } else {
        return new Arc(center, radius, startAngle, endAngle, true);
      }
    }
  }
}
kite.register('Arc', Arc);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiTWF0cml4MyIsIlV0aWxzIiwiVmVjdG9yMiIsIkVsbGlwdGljYWxBcmMiLCJraXRlIiwiTGluZSIsIk92ZXJsYXAiLCJSYXlJbnRlcnNlY3Rpb24iLCJTZWdtZW50IiwiU2VnbWVudEludGVyc2VjdGlvbiIsInN2Z051bWJlciIsIlRXT19QSSIsIk1hdGgiLCJQSSIsIkFyYyIsImNvbnN0cnVjdG9yIiwiY2VudGVyIiwicmFkaXVzIiwic3RhcnRBbmdsZSIsImVuZEFuZ2xlIiwiYW50aWNsb2Nrd2lzZSIsIl9jZW50ZXIiLCJfcmFkaXVzIiwiX3N0YXJ0QW5nbGUiLCJfZW5kQW5nbGUiLCJfYW50aWNsb2Nrd2lzZSIsImludmFsaWRhdGUiLCJzZXRDZW50ZXIiLCJhc3NlcnQiLCJpc0Zpbml0ZSIsInRvU3RyaW5nIiwiZXF1YWxzIiwidmFsdWUiLCJnZXRDZW50ZXIiLCJzZXRSYWRpdXMiLCJnZXRSYWRpdXMiLCJzZXRTdGFydEFuZ2xlIiwiZ2V0U3RhcnRBbmdsZSIsInNldEVuZEFuZ2xlIiwiZ2V0RW5kQW5nbGUiLCJzZXRBbnRpY2xvY2t3aXNlIiwiZ2V0QW50aWNsb2Nrd2lzZSIsInBvc2l0aW9uQXQiLCJ0IiwicG9zaXRpb25BdEFuZ2xlIiwiYW5nbGVBdCIsInRhbmdlbnRBdCIsInRhbmdlbnRBdEFuZ2xlIiwiY3VydmF0dXJlQXQiLCJzdWJkaXZpZGVkIiwiYW5nbGUwIiwiYW5nbGVUIiwiYW5nbGUxIiwiX3N0YXJ0IiwiX2VuZCIsIl9zdGFydFRhbmdlbnQiLCJfZW5kVGFuZ2VudCIsIl9hY3R1YWxFbmRBbmdsZSIsIl9pc0Z1bGxQZXJpbWV0ZXIiLCJfYW5nbGVEaWZmZXJlbmNlIiwiX2JvdW5kcyIsIl9zdmdQYXRoRnJhZ21lbnQiLCJpbnZhbGlkYXRpb25FbWl0dGVyIiwiZW1pdCIsImdldFN0YXJ0Iiwic3RhcnQiLCJnZXRFbmQiLCJlbmQiLCJnZXRTdGFydFRhbmdlbnQiLCJzdGFydFRhbmdlbnQiLCJnZXRFbmRUYW5nZW50IiwiZW5kVGFuZ2VudCIsImdldEFjdHVhbEVuZEFuZ2xlIiwiY29tcHV0ZUFjdHVhbEVuZEFuZ2xlIiwiYWN0dWFsRW5kQW5nbGUiLCJnZXRJc0Z1bGxQZXJpbWV0ZXIiLCJpc0Z1bGxQZXJpbWV0ZXIiLCJnZXRBbmdsZURpZmZlcmVuY2UiLCJhbmdsZURpZmZlcmVuY2UiLCJnZXRCb3VuZHMiLCJOT1RISU5HIiwiY29weSIsIndpdGhQb2ludCIsImluY2x1ZGVCb3VuZHNBdEFuZ2xlIiwiYm91bmRzIiwiZ2V0Tm9uZGVnZW5lcmF0ZVNlZ21lbnRzIiwiYW5nbGUiLCJjb250YWluc0FuZ2xlIiwicGx1cyIsImNyZWF0ZVBvbGFyIiwibWFwQW5nbGUiLCJhYnMiLCJtb2R1bG9CZXR3ZWVuRG93biIsIm1vZHVsb0JldHdlZW5VcCIsInRBdEFuZ2xlIiwibm9ybWFsIiwicGVycGVuZGljdWxhciIsIm5lZ2F0ZWQiLCJub3JtYWxpemVkQW5nbGUiLCJwb3NpdGl2ZU1pbkFuZ2xlIiwiZ2V0U1ZHUGF0aEZyYWdtZW50Iiwib2xkUGF0aEZyYWdtZW50IiwiZXBzaWxvbiIsInN3ZWVwRmxhZyIsImxhcmdlQXJjRmxhZyIsIngiLCJ5Iiwic3BsaXRPcHBvc2l0ZUFuZ2xlIiwic3BsaXRQb2ludCIsImZpcnN0QXJjIiwic2Vjb25kQXJjIiwic3Ryb2tlTGVmdCIsImxpbmVXaWR0aCIsInN0cm9rZVJpZ2h0IiwiZ2V0SW50ZXJpb3JFeHRyZW1hVHMiLCJyZXN1bHQiLCJfIiwiZWFjaCIsInB1c2giLCJzb3J0IiwiaW50ZXJzZWN0aW9uIiwicmF5IiwiY2VudGVyVG9SYXkiLCJwb3NpdGlvbiIsIm1pbnVzIiwidG1wIiwiZGlyZWN0aW9uIiwiZG90IiwiY2VudGVyVG9SYXlEaXN0U3EiLCJtYWduaXR1ZGVTcXVhcmVkIiwiZGlzY3JpbWluYW50IiwiYmFzZSIsInNxdCIsInNxcnQiLCJ0YSIsInRiIiwicG9pbnRCIiwicG9pbnRBdERpc3RhbmNlIiwibm9ybWFsQiIsIm5vcm1hbGl6ZWQiLCJub3JtYWxCQW5nbGUiLCJwb2ludEEiLCJub3JtYWxBIiwibm9ybWFsQUFuZ2xlIiwid2luZGluZ0ludGVyc2VjdGlvbiIsIndpbmQiLCJoaXRzIiwiaGl0Iiwid3JpdGVUb0NvbnRleHQiLCJjb250ZXh0IiwiYXJjIiwidHJhbnNmb3JtZWQiLCJtYXRyaXgiLCJ0aW1lc1ZlY3RvcjIiLCJaRVJPIiwiZ2V0RGV0ZXJtaW5hbnQiLCJzY2FsZVZlY3RvciIsImdldFNjYWxlVmVjdG9yIiwicmFkaXVzWCIsInJhZGl1c1kiLCJnZXRTaWduZWRBcmVhRnJhZ21lbnQiLCJ0MCIsInQxIiwic2luIiwiY29zIiwicmV2ZXJzZWQiLCJnZXRBcmNMZW5ndGgiLCJ0b1BpZWNld2lzZUxpbmVhck9yQXJjU2VnbWVudHMiLCJzZXJpYWxpemUiLCJ0eXBlIiwiY2VudGVyWCIsImNlbnRlclkiLCJnZXRPdmVybGFwcyIsInNlZ21lbnQiLCJnZXRDb25pY01hdHJpeCIsImEiLCJiIiwiQSIsIkIiLCJDIiwiRCIsIkUiLCJGIiwicm93TWFqb3IiLCJkZXNlcmlhbGl6ZSIsIm9iaiIsImdldFBhcnRpYWxPdmVybGFwIiwiZW5kMSIsInN0YXJ0MiIsImVuZDIiLCJ0U3RhcnQyIiwidEVuZDIiLCJyZXZlcnNlZDIiLCJtaW4yIiwibWF4MiIsIm92ZXJsYXBNaW4iLCJvdmVybGFwTWF4IiwibWluIiwiY3JlYXRlTGluZWFyIiwiY2xhbXAiLCJsaW5lYXIiLCJnZXRBbmd1bGFyT3ZlcmxhcHMiLCJzdGFydEFuZ2xlMSIsImVuZEFuZ2xlMSIsInN0YXJ0QW5nbGUyIiwiZW5kQW5nbGUyIiwic2lnbjEiLCJ3cmFwVCIsImNvbmNhdCIsImFyYzEiLCJhcmMyIiwiZGlzdGFuY2UiLCJnZXRDaXJjbGVJbnRlcnNlY3Rpb25Qb2ludCIsImNlbnRlcjEiLCJyYWRpdXMxIiwiY2VudGVyMiIsInJhZGl1czIiLCJkZWx0YSIsImQiLCJtYWduaXR1ZGUiLCJyZXN1bHRzIiwiYmxlbmQiLCJ4UHJpbWUiLCJiaXQiLCJ5UHJpbWUiLCJzZXRNYWduaXR1ZGUiLCJmb3JFYWNoIiwiaW50ZXJzZWN0IiwiZXF1YWxzRXBzaWxvbiIsImFTdGFydCIsImFFbmQiLCJiU3RhcnQiLCJiRW5kIiwiYXZlcmFnZSIsInBvaW50cyIsImkiLCJsZW5ndGgiLCJwb2ludCIsImFuZ2xlQSIsImFuZ2xlQiIsImNyZWF0ZUZyb21Qb2ludHMiLCJzdGFydFBvaW50IiwibWlkZGxlUG9pbnQiLCJlbmRQb2ludCIsImNpcmNsZUNlbnRlckZyb21Qb2ludHMiLCJzdGFydERpZmYiLCJtaWRkbGVEaWZmIiwiZW5kRGlmZiIsIm1pZGRsZUFuZ2xlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJBcmMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBjaXJjdWxhciBhcmMgKGEgY29udGludW91cyBzdWItcGFydCBvZiBhIGNpcmNsZSkuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBNYXRyaXgzIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9NYXRyaXgzLmpzJztcclxuaW1wb3J0IFJheTIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1JheTIuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgeyBFbGxpcHRpY2FsQXJjLCBraXRlLCBMaW5lLCBPdmVybGFwLCBSYXlJbnRlcnNlY3Rpb24sIFNlZ21lbnQsIFNlZ21lbnRJbnRlcnNlY3Rpb24sIHN2Z051bWJlciB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxuLy8gVE9ETzogU2VlIGlmIHdlIHNob3VsZCB1c2UgdGhpcyBtb3JlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG5jb25zdCBUV09fUEkgPSBNYXRoLlBJICogMjtcclxuXHJcbmV4cG9ydCB0eXBlIFNlcmlhbGl6ZWRBcmMgPSB7XHJcbiAgdHlwZTogJ0FyYyc7XHJcbiAgY2VudGVyWDogbnVtYmVyO1xyXG4gIGNlbnRlclk6IG51bWJlcjtcclxuICByYWRpdXM6IG51bWJlcjtcclxuICBzdGFydEFuZ2xlOiBudW1iZXI7XHJcbiAgZW5kQW5nbGU6IG51bWJlcjtcclxuICBhbnRpY2xvY2t3aXNlOiBib29sZWFuO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXJjIGV4dGVuZHMgU2VnbWVudCB7XHJcblxyXG4gIHByaXZhdGUgX2NlbnRlcjogVmVjdG9yMjtcclxuICBwcml2YXRlIF9yYWRpdXM6IG51bWJlcjtcclxuICBwcml2YXRlIF9zdGFydEFuZ2xlOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBfZW5kQW5nbGU6IG51bWJlcjtcclxuICBwcml2YXRlIF9hbnRpY2xvY2t3aXNlOiBib29sZWFuO1xyXG5cclxuICAvLyBMYXppbHktY29tcHV0ZWQgZGVyaXZlZCBpbmZvcm1hdGlvblxyXG4gIHByaXZhdGUgX3N0YXJ0ITogVmVjdG9yMiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBfZW5kITogVmVjdG9yMiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBfc3RhcnRUYW5nZW50ITogVmVjdG9yMiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBfZW5kVGFuZ2VudCE6IFZlY3RvcjIgfCBudWxsO1xyXG4gIHByaXZhdGUgX2FjdHVhbEVuZEFuZ2xlITogbnVtYmVyIHwgbnVsbDsgLy8gRW5kIGFuZ2xlIGluIHJlbGF0aW9uIHRvIG91ciBzdGFydCBhbmdsZSAoY2FuIGdldCByZW1hcHBlZClcclxuICBwcml2YXRlIF9pc0Z1bGxQZXJpbWV0ZXIhOiBib29sZWFuIHwgbnVsbDsgLy8gV2hldGhlciBpdCdzIGEgZnVsbCBjaXJjbGUgKGFuZCBub3QganVzdCBhbiBhcmMpXHJcbiAgcHJpdmF0ZSBfYW5nbGVEaWZmZXJlbmNlITogbnVtYmVyIHwgbnVsbDtcclxuICBwcml2YXRlIF9ib3VuZHMhOiBCb3VuZHMyIHwgbnVsbDtcclxuICBwcml2YXRlIF9zdmdQYXRoRnJhZ21lbnQhOiBzdHJpbmcgfCBudWxsO1xyXG5cclxuICAvKipcclxuICAgKiBJZiB0aGUgc3RhcnRBbmdsZS9lbmRBbmdsZSBkaWZmZXJlbmNlIGlzIH4ycGksIHRoaXMgd2lsbCBiZSBhIGZ1bGwgY2lyY2xlXHJcbiAgICpcclxuICAgKiBTZWUgaHR0cDovL3d3dy53My5vcmcvVFIvMmRjb250ZXh0LyNkb20tY29udGV4dC0yZC1hcmMgZm9yIGRldGFpbGVkIGluZm9ybWF0aW9uIG9uIHRoZSBwYXJhbWV0ZXJzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNlbnRlciAtIENlbnRlciBvZiB0aGUgYXJjIChldmVyeSBwb2ludCBvbiB0aGUgYXJjIGlzIGVxdWFsbHkgZmFyIGZyb20gdGhlIGNlbnRlcilcclxuICAgKiBAcGFyYW0gcmFkaXVzIC0gSG93IGZhciBmcm9tIHRoZSBjZW50ZXIgdGhlIGFyYyB3aWxsIGJlXHJcbiAgICogQHBhcmFtIHN0YXJ0QW5nbGUgLSBBbmdsZSAocmFkaWFucykgb2YgdGhlIHN0YXJ0IG9mIHRoZSBhcmNcclxuICAgKiBAcGFyYW0gZW5kQW5nbGUgLSBBbmdsZSAocmFkaWFucykgb2YgdGhlIGVuZCBvZiB0aGUgYXJjXHJcbiAgICogQHBhcmFtIGFudGljbG9ja3dpc2UgLSBEZWNpZGVzIHdoaWNoIGRpcmVjdGlvbiB0aGUgYXJjIHRha2VzIGFyb3VuZCB0aGUgY2VudGVyXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBjZW50ZXI6IFZlY3RvcjIsIHJhZGl1czogbnVtYmVyLCBzdGFydEFuZ2xlOiBudW1iZXIsIGVuZEFuZ2xlOiBudW1iZXIsIGFudGljbG9ja3dpc2U6IGJvb2xlYW4gKSB7XHJcbiAgICBzdXBlcigpO1xyXG5cclxuICAgIHRoaXMuX2NlbnRlciA9IGNlbnRlcjtcclxuICAgIHRoaXMuX3JhZGl1cyA9IHJhZGl1cztcclxuICAgIHRoaXMuX3N0YXJ0QW5nbGUgPSBzdGFydEFuZ2xlO1xyXG4gICAgdGhpcy5fZW5kQW5nbGUgPSBlbmRBbmdsZTtcclxuICAgIHRoaXMuX2FudGljbG9ja3dpc2UgPSBhbnRpY2xvY2t3aXNlO1xyXG5cclxuICAgIHRoaXMuaW52YWxpZGF0ZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgY2VudGVyIG9mIHRoZSBBcmMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldENlbnRlciggY2VudGVyOiBWZWN0b3IyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggY2VudGVyLmlzRmluaXRlKCksIGBBcmMgY2VudGVyIHNob3VsZCBiZSBmaW5pdGU6ICR7Y2VudGVyLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgIGlmICggIXRoaXMuX2NlbnRlci5lcXVhbHMoIGNlbnRlciApICkge1xyXG4gICAgICB0aGlzLl9jZW50ZXIgPSBjZW50ZXI7XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGNlbnRlciggdmFsdWU6IFZlY3RvcjIgKSB7IHRoaXMuc2V0Q2VudGVyKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgY2VudGVyKCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRDZW50ZXIoKTsgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2VudGVyIG9mIHRoaXMgQXJjLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDZW50ZXIoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5fY2VudGVyO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHJhZGl1cyBvZiB0aGUgQXJjLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRSYWRpdXMoIHJhZGl1czogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHJhZGl1cyApLCBgQXJjIHJhZGl1cyBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3JhZGl1c31gICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9yYWRpdXMgIT09IHJhZGl1cyApIHtcclxuICAgICAgdGhpcy5fcmFkaXVzID0gcmFkaXVzO1xyXG4gICAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCByYWRpdXMoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0UmFkaXVzKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmFkaXVzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFJhZGl1cygpOyB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSByYWRpdXMgb2YgdGhpcyBBcmMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFJhZGl1cygpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3JhZGl1cztcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBzdGFydEFuZ2xlIG9mIHRoZSBBcmMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFN0YXJ0QW5nbGUoIHN0YXJ0QW5nbGU6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBzdGFydEFuZ2xlICksIGBBcmMgc3RhcnRBbmdsZSBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3N0YXJ0QW5nbGV9YCApO1xyXG5cclxuICAgIGlmICggdGhpcy5fc3RhcnRBbmdsZSAhPT0gc3RhcnRBbmdsZSApIHtcclxuICAgICAgdGhpcy5fc3RhcnRBbmdsZSA9IHN0YXJ0QW5nbGU7XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHN0YXJ0QW5nbGUoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0U3RhcnRBbmdsZSggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHN0YXJ0QW5nbGUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0U3RhcnRBbmdsZSgpOyB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBzdGFydEFuZ2xlIG9mIHRoaXMgQXJjLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTdGFydEFuZ2xlKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fc3RhcnRBbmdsZTtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBlbmRBbmdsZSBvZiB0aGUgQXJjLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRFbmRBbmdsZSggZW5kQW5nbGU6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBlbmRBbmdsZSApLCBgQXJjIGVuZEFuZ2xlIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7ZW5kQW5nbGV9YCApO1xyXG5cclxuICAgIGlmICggdGhpcy5fZW5kQW5nbGUgIT09IGVuZEFuZ2xlICkge1xyXG4gICAgICB0aGlzLl9lbmRBbmdsZSA9IGVuZEFuZ2xlO1xyXG4gICAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBlbmRBbmdsZSggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRFbmRBbmdsZSggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGVuZEFuZ2xlKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldEVuZEFuZ2xlKCk7IH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGVuZEFuZ2xlIG9mIHRoaXMgQXJjLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFbmRBbmdsZSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX2VuZEFuZ2xlO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGFudGljbG9ja3dpc2Ugb2YgdGhlIEFyYy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0QW50aWNsb2Nrd2lzZSggYW50aWNsb2Nrd2lzZTogYm9vbGVhbiApOiB0aGlzIHtcclxuXHJcbiAgICBpZiAoIHRoaXMuX2FudGljbG9ja3dpc2UgIT09IGFudGljbG9ja3dpc2UgKSB7XHJcbiAgICAgIHRoaXMuX2FudGljbG9ja3dpc2UgPSBhbnRpY2xvY2t3aXNlO1xyXG4gICAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBhbnRpY2xvY2t3aXNlKCB2YWx1ZTogYm9vbGVhbiApIHsgdGhpcy5zZXRBbnRpY2xvY2t3aXNlKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgYW50aWNsb2Nrd2lzZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuZ2V0QW50aWNsb2Nrd2lzZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFudGljbG9ja3dpc2Ugb2YgdGhpcyBBcmMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEFudGljbG9ja3dpc2UoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fYW50aWNsb2Nrd2lzZTtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBwb3NpdGlvbiBwYXJhbWV0cmljYWxseSwgd2l0aCAwIDw9IHQgPD0gMS5cclxuICAgKlxyXG4gICAqIE5PVEU6IHBvc2l0aW9uQXQoIDAgKSB3aWxsIHJldHVybiB0aGUgc3RhcnQgb2YgdGhlIHNlZ21lbnQsIGFuZCBwb3NpdGlvbkF0KCAxICkgd2lsbCByZXR1cm4gdGhlIGVuZCBvZiB0aGVcclxuICAgKiBzZWdtZW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBtZXRob2QgaXMgcGFydCBvZiB0aGUgU2VnbWVudCBBUEkuIFNlZSBTZWdtZW50LmpzJ3MgY29uc3RydWN0b3IgZm9yIG1vcmUgQVBJIGRvY3VtZW50YXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHBvc2l0aW9uQXQoIHQ6IG51bWJlciApOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPj0gMCwgJ3Bvc2l0aW9uQXQgdCBzaG91bGQgYmUgbm9uLW5lZ2F0aXZlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA8PSAxLCAncG9zaXRpb25BdCB0IHNob3VsZCBiZSBubyBncmVhdGVyIHRoYW4gMScgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5wb3NpdGlvbkF0QW5nbGUoIHRoaXMuYW5nbGVBdCggdCApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBub24tbm9ybWFsaXplZCB0YW5nZW50IChkeC9kdCwgZHkvZHQpIG9mIHRoaXMgc2VnbWVudCBhdCB0aGUgcGFyYW1ldHJpYyB2YWx1ZSBvZiB0LCB3aXRoIDAgPD0gdCA8PSAxLlxyXG4gICAqXHJcbiAgICogTk9URTogdGFuZ2VudEF0KCAwICkgd2lsbCByZXR1cm4gdGhlIHRhbmdlbnQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBzZWdtZW50LCBhbmQgdGFuZ2VudEF0KCAxICkgd2lsbCByZXR1cm4gdGhlXHJcbiAgICogdGFuZ2VudCBhdCB0aGUgZW5kIG9mIHRoZSBzZWdtZW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBtZXRob2QgaXMgcGFydCBvZiB0aGUgU2VnbWVudCBBUEkuIFNlZSBTZWdtZW50LmpzJ3MgY29uc3RydWN0b3IgZm9yIG1vcmUgQVBJIGRvY3VtZW50YXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHRhbmdlbnRBdCggdDogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA+PSAwLCAndGFuZ2VudEF0IHQgc2hvdWxkIGJlIG5vbi1uZWdhdGl2ZScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPD0gMSwgJ3RhbmdlbnRBdCB0IHNob3VsZCBiZSBubyBncmVhdGVyIHRoYW4gMScgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy50YW5nZW50QXRBbmdsZSggdGhpcy5hbmdsZUF0KCB0ICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHNpZ25lZCBjdXJ2YXR1cmUgb2YgdGhlIHNlZ21lbnQgYXQgdGhlIHBhcmFtZXRyaWMgdmFsdWUgdCwgd2hlcmUgMCA8PSB0IDw9IDEuXHJcbiAgICpcclxuICAgKiBUaGUgY3VydmF0dXJlIHdpbGwgYmUgcG9zaXRpdmUgZm9yIHZpc3VhbCBjbG9ja3dpc2UgLyBtYXRoZW1hdGljYWwgY291bnRlcmNsb2Nrd2lzZSBjdXJ2ZXMsIG5lZ2F0aXZlIGZvciBvcHBvc2l0ZVxyXG4gICAqIGN1cnZhdHVyZSwgYW5kIDAgZm9yIG5vIGN1cnZhdHVyZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IGN1cnZhdHVyZUF0KCAwICkgd2lsbCByZXR1cm4gdGhlIGN1cnZhdHVyZSBhdCB0aGUgc3RhcnQgb2YgdGhlIHNlZ21lbnQsIGFuZCBjdXJ2YXR1cmVBdCggMSApIHdpbGwgcmV0dXJuXHJcbiAgICogdGhlIGN1cnZhdHVyZSBhdCB0aGUgZW5kIG9mIHRoZSBzZWdtZW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBtZXRob2QgaXMgcGFydCBvZiB0aGUgU2VnbWVudCBBUEkuIFNlZSBTZWdtZW50LmpzJ3MgY29uc3RydWN0b3IgZm9yIG1vcmUgQVBJIGRvY3VtZW50YXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGN1cnZhdHVyZUF0KCB0OiBudW1iZXIgKTogbnVtYmVyIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPj0gMCwgJ2N1cnZhdHVyZUF0IHQgc2hvdWxkIGJlIG5vbi1uZWdhdGl2ZScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPD0gMSwgJ2N1cnZhdHVyZUF0IHQgc2hvdWxkIGJlIG5vIGdyZWF0ZXIgdGhhbiAxJyApO1xyXG5cclxuICAgIC8vIFNpbmNlIGl0IGlzIGFuIGFyYyBvZiBhcyBjaXJjbGUsIHRoZSBjdXJ2YXR1cmUgaXMgaW5kZXBlbmRlbnQgb2YgdFxyXG4gICAgcmV0dXJuICggdGhpcy5fYW50aWNsb2Nrd2lzZSA/IC0xIDogMSApIC8gdGhpcy5fcmFkaXVzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSB3aXRoIHVwIHRvIDIgc3ViLXNlZ21lbnRzLCBzcGxpdCBhdCB0aGUgcGFyYW1ldHJpYyB0IHZhbHVlLiBUb2dldGhlciAoaW4gb3JkZXIpIHRoZXkgc2hvdWxkIG1ha2VcclxuICAgKiB1cCB0aGUgc2FtZSBzaGFwZSBhcyB0aGUgY3VycmVudCBzZWdtZW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBtZXRob2QgaXMgcGFydCBvZiB0aGUgU2VnbWVudCBBUEkuIFNlZSBTZWdtZW50LmpzJ3MgY29uc3RydWN0b3IgZm9yIG1vcmUgQVBJIGRvY3VtZW50YXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHN1YmRpdmlkZWQoIHQ6IG51bWJlciApOiBBcmNbXSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0ID49IDAsICdzdWJkaXZpZGVkIHQgc2hvdWxkIGJlIG5vbi1uZWdhdGl2ZScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPD0gMSwgJ3N1YmRpdmlkZWQgdCBzaG91bGQgYmUgbm8gZ3JlYXRlciB0aGFuIDEnICk7XHJcblxyXG4gICAgLy8gSWYgdCBpcyAwIG9yIDEsIHdlIG9ubHkgbmVlZCB0byByZXR1cm4gMSBzZWdtZW50XHJcbiAgICBpZiAoIHQgPT09IDAgfHwgdCA9PT0gMSApIHtcclxuICAgICAgcmV0dXJuIFsgdGhpcyBdO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRPRE86IHZlcmlmeSB0aGF0IHdlIGRvbid0IG5lZWQgdG8gc3dpdGNoIGFudGljbG9ja3dpc2UgaGVyZSwgb3Igc3VidHJhY3QgMnBpIG9mZiBhbnkgYW5nbGVzIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgY29uc3QgYW5nbGUwID0gdGhpcy5hbmdsZUF0KCAwICk7XHJcbiAgICBjb25zdCBhbmdsZVQgPSB0aGlzLmFuZ2xlQXQoIHQgKTtcclxuICAgIGNvbnN0IGFuZ2xlMSA9IHRoaXMuYW5nbGVBdCggMSApO1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgbmV3IEFyYyggdGhpcy5fY2VudGVyLCB0aGlzLl9yYWRpdXMsIGFuZ2xlMCwgYW5nbGVULCB0aGlzLl9hbnRpY2xvY2t3aXNlICksXHJcbiAgICAgIG5ldyBBcmMoIHRoaXMuX2NlbnRlciwgdGhpcy5fcmFkaXVzLCBhbmdsZVQsIGFuZ2xlMSwgdGhpcy5fYW50aWNsb2Nrd2lzZSApXHJcbiAgICBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xlYXJzIGNhY2hlZCBpbmZvcm1hdGlvbiwgc2hvdWxkIGJlIGNhbGxlZCB3aGVuIGFueSBvZiB0aGUgJ2NvbnN0cnVjdG9yIGFyZ3VtZW50cycgYXJlIG11dGF0ZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGludmFsaWRhdGUoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9zdGFydCA9IG51bGw7XHJcbiAgICB0aGlzLl9lbmQgPSBudWxsO1xyXG4gICAgdGhpcy5fc3RhcnRUYW5nZW50ID0gbnVsbDtcclxuICAgIHRoaXMuX2VuZFRhbmdlbnQgPSBudWxsO1xyXG4gICAgdGhpcy5fYWN0dWFsRW5kQW5nbGUgPSBudWxsO1xyXG4gICAgdGhpcy5faXNGdWxsUGVyaW1ldGVyID0gbnVsbDtcclxuICAgIHRoaXMuX2FuZ2xlRGlmZmVyZW5jZSA9IG51bGw7XHJcbiAgICB0aGlzLl9ib3VuZHMgPSBudWxsO1xyXG4gICAgdGhpcy5fc3ZnUGF0aEZyYWdtZW50ID0gbnVsbDtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9jZW50ZXIgaW5zdGFuY2VvZiBWZWN0b3IyLCAnQXJjIGNlbnRlciBzaG91bGQgYmUgYSBWZWN0b3IyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fY2VudGVyLmlzRmluaXRlKCksICdBcmMgY2VudGVyIHNob3VsZCBiZSBmaW5pdGUgKG5vdCBOYU4gb3IgaW5maW5pdGUpJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIHRoaXMuX3JhZGl1cyA9PT0gJ251bWJlcicsIGBBcmMgcmFkaXVzIHNob3VsZCBiZSBhIG51bWJlcjogJHt0aGlzLl9yYWRpdXN9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHRoaXMuX3JhZGl1cyApLCBgQXJjIHJhZGl1cyBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3RoaXMuX3JhZGl1c31gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgdGhpcy5fc3RhcnRBbmdsZSA9PT0gJ251bWJlcicsIGBBcmMgc3RhcnRBbmdsZSBzaG91bGQgYmUgYSBudW1iZXI6ICR7dGhpcy5fc3RhcnRBbmdsZX1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggdGhpcy5fc3RhcnRBbmdsZSApLCBgQXJjIHN0YXJ0QW5nbGUgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcjogJHt0aGlzLl9zdGFydEFuZ2xlfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB0aGlzLl9lbmRBbmdsZSA9PT0gJ251bWJlcicsIGBBcmMgZW5kQW5nbGUgc2hvdWxkIGJlIGEgbnVtYmVyOiAke3RoaXMuX2VuZEFuZ2xlfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB0aGlzLl9lbmRBbmdsZSApLCBgQXJjIGVuZEFuZ2xlIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7dGhpcy5fZW5kQW5nbGV9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIHRoaXMuX2FudGljbG9ja3dpc2UgPT09ICdib29sZWFuJywgYEFyYyBhbnRpY2xvY2t3aXNlIHNob3VsZCBiZSBhIGJvb2xlYW46ICR7dGhpcy5fYW50aWNsb2Nrd2lzZX1gICk7XHJcblxyXG4gICAgLy8gUmVtYXAgbmVnYXRpdmUgcmFkaXVzIHRvIGEgcG9zaXRpdmUgcmFkaXVzXHJcbiAgICBpZiAoIHRoaXMuX3JhZGl1cyA8IDAgKSB7XHJcbiAgICAgIC8vIHN1cHBvcnQgdGhpcyBjYXNlIHNpbmNlIHdlIG1pZ2h0IGFjdHVhbGx5IG5lZWQgdG8gaGFuZGxlIGl0IGluc2lkZSBvZiBzdHJva2VzP1xyXG4gICAgICB0aGlzLl9yYWRpdXMgPSAtdGhpcy5fcmFkaXVzO1xyXG4gICAgICB0aGlzLl9zdGFydEFuZ2xlICs9IE1hdGguUEk7XHJcbiAgICAgIHRoaXMuX2VuZEFuZ2xlICs9IE1hdGguUEk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ29uc3RyYWludHMgdGhhdCBzaG91bGQgYWx3YXlzIGJlIHNhdGlzZmllZFxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggISggKCAhdGhpcy5hbnRpY2xvY2t3aXNlICYmIHRoaXMuX2VuZEFuZ2xlIC0gdGhpcy5fc3RhcnRBbmdsZSA8PSAtTWF0aC5QSSAqIDIgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKCB0aGlzLmFudGljbG9ja3dpc2UgJiYgdGhpcy5fc3RhcnRBbmdsZSAtIHRoaXMuX2VuZEFuZ2xlIDw9IC1NYXRoLlBJICogMiApICksXHJcbiAgICAgICdOb3QgaGFuZGxpbmcgYXJjcyB3aXRoIHN0YXJ0L2VuZCBhbmdsZXMgdGhhdCBzaG93IGRpZmZlcmVuY2VzIGluLWJldHdlZW4gYnJvd3NlciBoYW5kbGluZycgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICEoICggIXRoaXMuYW50aWNsb2Nrd2lzZSAmJiB0aGlzLl9lbmRBbmdsZSAtIHRoaXMuX3N0YXJ0QW5nbGUgPiBNYXRoLlBJICogMiApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAoIHRoaXMuYW50aWNsb2Nrd2lzZSAmJiB0aGlzLl9zdGFydEFuZ2xlIC0gdGhpcy5fZW5kQW5nbGUgPiBNYXRoLlBJICogMiApICksXHJcbiAgICAgICdOb3QgaGFuZGxpbmcgYXJjcyB3aXRoIHN0YXJ0L2VuZCBhbmdsZXMgdGhhdCBzaG93IGRpZmZlcmVuY2VzIGluLWJldHdlZW4gYnJvd3NlciBoYW5kbGluZycgKTtcclxuXHJcbiAgICB0aGlzLmludmFsaWRhdGlvbkVtaXR0ZXIuZW1pdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgc3RhcnQgcG9zaXRpb24gb2YgdGhpcyBhcmMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFN0YXJ0KCk6IFZlY3RvcjIge1xyXG4gICAgaWYgKCB0aGlzLl9zdGFydCA9PT0gbnVsbCApIHtcclxuICAgICAgdGhpcy5fc3RhcnQgPSB0aGlzLnBvc2l0aW9uQXRBbmdsZSggdGhpcy5fc3RhcnRBbmdsZSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX3N0YXJ0O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBzdGFydCgpOiBWZWN0b3IyIHsgcmV0dXJuIHRoaXMuZ2V0U3RhcnQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBlbmQgcG9zaXRpb24gb2YgdGhpcyBhcmMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEVuZCgpOiBWZWN0b3IyIHtcclxuICAgIGlmICggdGhpcy5fZW5kID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLl9lbmQgPSB0aGlzLnBvc2l0aW9uQXRBbmdsZSggdGhpcy5fZW5kQW5nbGUgKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9lbmQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGVuZCgpOiBWZWN0b3IyIHsgcmV0dXJuIHRoaXMuZ2V0RW5kKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgdW5pdCB2ZWN0b3IgdGFuZ2VudCB0byB0aGlzIGFyYyBhdCB0aGUgc3RhcnQgcG9pbnQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFN0YXJ0VGFuZ2VudCgpOiBWZWN0b3IyIHtcclxuICAgIGlmICggdGhpcy5fc3RhcnRUYW5nZW50ID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLl9zdGFydFRhbmdlbnQgPSB0aGlzLnRhbmdlbnRBdEFuZ2xlKCB0aGlzLl9zdGFydEFuZ2xlICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fc3RhcnRUYW5nZW50O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBzdGFydFRhbmdlbnQoKTogVmVjdG9yMiB7IHJldHVybiB0aGlzLmdldFN0YXJ0VGFuZ2VudCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIHVuaXQgdmVjdG9yIHRhbmdlbnQgdG8gdGhlIGFyYyBhdCB0aGUgZW5kIHBvaW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFbmRUYW5nZW50KCk6IFZlY3RvcjIge1xyXG4gICAgaWYgKCB0aGlzLl9lbmRUYW5nZW50ID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLl9lbmRUYW5nZW50ID0gdGhpcy50YW5nZW50QXRBbmdsZSggdGhpcy5fZW5kQW5nbGUgKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9lbmRUYW5nZW50O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBlbmRUYW5nZW50KCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRFbmRUYW5nZW50KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgZW5kIGFuZ2xlIGluIHJhZGlhbnMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEFjdHVhbEVuZEFuZ2xlKCk6IG51bWJlciB7XHJcbiAgICBpZiAoIHRoaXMuX2FjdHVhbEVuZEFuZ2xlID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLl9hY3R1YWxFbmRBbmdsZSA9IEFyYy5jb21wdXRlQWN0dWFsRW5kQW5nbGUoIHRoaXMuX3N0YXJ0QW5nbGUsIHRoaXMuX2VuZEFuZ2xlLCB0aGlzLl9hbnRpY2xvY2t3aXNlICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fYWN0dWFsRW5kQW5nbGU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGFjdHVhbEVuZEFuZ2xlKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldEFjdHVhbEVuZEFuZ2xlKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGJvb2xlYW4gdmFsdWUgdGhhdCBpbmRpY2F0ZXMgaWYgdGhlIGFyYyB3cmFwcyB1cCBieSBtb3JlIHRoYW4gdHdvIFBpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRJc0Z1bGxQZXJpbWV0ZXIoKTogYm9vbGVhbiB7XHJcbiAgICBpZiAoIHRoaXMuX2lzRnVsbFBlcmltZXRlciA9PT0gbnVsbCApIHtcclxuICAgICAgdGhpcy5faXNGdWxsUGVyaW1ldGVyID0gKCAhdGhpcy5fYW50aWNsb2Nrd2lzZSAmJiB0aGlzLl9lbmRBbmdsZSAtIHRoaXMuX3N0YXJ0QW5nbGUgPj0gTWF0aC5QSSAqIDIgKSB8fCAoIHRoaXMuX2FudGljbG9ja3dpc2UgJiYgdGhpcy5fc3RhcnRBbmdsZSAtIHRoaXMuX2VuZEFuZ2xlID49IE1hdGguUEkgKiAyICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5faXNGdWxsUGVyaW1ldGVyO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBpc0Z1bGxQZXJpbWV0ZXIoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmdldElzRnVsbFBlcmltZXRlcigpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYW5nbGUgZGlmZmVyZW5jZSB0aGF0IHJlcHJlc2VudHMgaG93IFwibXVjaFwiIG9mIHRoZSBjaXJjbGUgb3VyIGFyYyBjb3ZlcnMuXHJcbiAgICpcclxuICAgKiBUaGUgYW5zd2VyIGlzIGFsd2F5cyBncmVhdGVyIG9yIGVxdWFsIHRvIHplcm9cclxuICAgKiBUaGUgYW5zd2VyIGNhbiBleGNlZWQgdHdvIFBpXHJcbiAgICovXHJcbiAgcHVibGljIGdldEFuZ2xlRGlmZmVyZW5jZSgpOiBudW1iZXIge1xyXG4gICAgaWYgKCB0aGlzLl9hbmdsZURpZmZlcmVuY2UgPT09IG51bGwgKSB7XHJcbiAgICAgIC8vIGNvbXB1dGUgYW4gYW5nbGUgZGlmZmVyZW5jZSB0aGF0IHJlcHJlc2VudHMgaG93IFwibXVjaFwiIG9mIHRoZSBjaXJjbGUgb3VyIGFyYyBjb3ZlcnNcclxuICAgICAgdGhpcy5fYW5nbGVEaWZmZXJlbmNlID0gdGhpcy5fYW50aWNsb2Nrd2lzZSA/IHRoaXMuX3N0YXJ0QW5nbGUgLSB0aGlzLl9lbmRBbmdsZSA6IHRoaXMuX2VuZEFuZ2xlIC0gdGhpcy5fc3RhcnRBbmdsZTtcclxuICAgICAgaWYgKCB0aGlzLl9hbmdsZURpZmZlcmVuY2UgPCAwICkge1xyXG4gICAgICAgIHRoaXMuX2FuZ2xlRGlmZmVyZW5jZSArPSBNYXRoLlBJICogMjtcclxuICAgICAgfVxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9hbmdsZURpZmZlcmVuY2UgPj0gMCApOyAvLyBub3cgaXQgc2hvdWxkIGFsd2F5cyBiZSB6ZXJvIG9yIHBvc2l0aXZlXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fYW5nbGVEaWZmZXJlbmNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBhbmdsZURpZmZlcmVuY2UoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0QW5nbGVEaWZmZXJlbmNlKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYm91bmRzIG9mIHRoaXMgc2VnbWVudC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Qm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgaWYgKCB0aGlzLl9ib3VuZHMgPT09IG51bGwgKSB7XHJcbiAgICAgIC8vIGFjY2VsZXJhdGlvbiBmb3IgaW50ZXJzZWN0aW9uXHJcbiAgICAgIHRoaXMuX2JvdW5kcyA9IEJvdW5kczIuTk9USElORy5jb3B5KCkud2l0aFBvaW50KCB0aGlzLmdldFN0YXJ0KCkgKVxyXG4gICAgICAgIC53aXRoUG9pbnQoIHRoaXMuZ2V0RW5kKCkgKTtcclxuXHJcbiAgICAgIC8vIGlmIHRoZSBhbmdsZXMgYXJlIGRpZmZlcmVudCwgY2hlY2sgZXh0cmVtYSBwb2ludHNcclxuICAgICAgaWYgKCB0aGlzLl9zdGFydEFuZ2xlICE9PSB0aGlzLl9lbmRBbmdsZSApIHtcclxuICAgICAgICAvLyBjaGVjayBhbGwgb2YgdGhlIGV4dHJlbWEgcG9pbnRzXHJcbiAgICAgICAgdGhpcy5pbmNsdWRlQm91bmRzQXRBbmdsZSggMCApO1xyXG4gICAgICAgIHRoaXMuaW5jbHVkZUJvdW5kc0F0QW5nbGUoIE1hdGguUEkgLyAyICk7XHJcbiAgICAgICAgdGhpcy5pbmNsdWRlQm91bmRzQXRBbmdsZSggTWF0aC5QSSApO1xyXG4gICAgICAgIHRoaXMuaW5jbHVkZUJvdW5kc0F0QW5nbGUoIDMgKiBNYXRoLlBJIC8gMiApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fYm91bmRzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBib3VuZHMoKTogQm91bmRzMiB7IHJldHVybiB0aGlzLmdldEJvdW5kcygpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBsaXN0IG9mIG5vbi1kZWdlbmVyYXRlIHNlZ21lbnRzIHRoYXQgYXJlIGVxdWl2YWxlbnQgdG8gdGhpcyBzZWdtZW50LiBHZW5lcmFsbHkgZ2V0cyByaWQgKG9yIHNpbXBsaWZpZXMpXHJcbiAgICogaW52YWxpZCBvciByZXBlYXRlZCBzZWdtZW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Tm9uZGVnZW5lcmF0ZVNlZ21lbnRzKCk6IEFyY1tdIHtcclxuICAgIGlmICggdGhpcy5fcmFkaXVzIDw9IDAgfHwgdGhpcy5fc3RhcnRBbmdsZSA9PT0gdGhpcy5fZW5kQW5nbGUgKSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gWyB0aGlzIF07IC8vIGJhc2ljYWxseSwgQXJjcyBhcmVuJ3QgcmVhbGx5IGRlZ2VuZXJhdGUgdGhhdCBlYXNpbHlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEF0dGVtcHRzIHRvIGV4cGFuZCB0aGUgcHJpdmF0ZSBfYm91bmRzIGJvdW5kaW5nIGJveCB0byBpbmNsdWRlIGEgcG9pbnQgYXQgYSBzcGVjaWZpYyBhbmdsZSwgbWFraW5nIHN1cmUgdGhhdFxyXG4gICAqIGFuZ2xlIGlzIGFjdHVhbGx5IGluY2x1ZGVkIGluIHRoZSBhcmMuIFRoaXMgd2lsbCBwcmVzdW1hYmx5IGJlIGNhbGxlZCBhdCBhbmdsZXMgdGhhdCBhcmUgYXQgY3JpdGljYWwgcG9pbnRzLFxyXG4gICAqIHdoZXJlIHRoZSBhcmMgc2hvdWxkIGhhdmUgbWF4aW11bS9taW5pbXVtIHgveSB2YWx1ZXMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBpbmNsdWRlQm91bmRzQXRBbmdsZSggYW5nbGU6IG51bWJlciApOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5jb250YWluc0FuZ2xlKCBhbmdsZSApICkge1xyXG4gICAgICAvLyB0aGUgYm91bmRhcnkgcG9pbnQgaXMgaW4gdGhlIGFyY1xyXG4gICAgICB0aGlzLl9ib3VuZHMgPSB0aGlzLl9ib3VuZHMhLndpdGhQb2ludCggdGhpcy5fY2VudGVyLnBsdXMoIFZlY3RvcjIuY3JlYXRlUG9sYXIoIHRoaXMuX3JhZGl1cywgYW5nbGUgKSApICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYXBzIGEgY29udGFpbmVkIGFuZ2xlIHRvIGJldHdlZW4gW3N0YXJ0QW5nbGUsYWN0dWFsRW5kQW5nbGUpLCBldmVuIGlmIHRoZSBlbmQgYW5nbGUgaXMgbG93ZXIuXHJcbiAgICovXHJcbiAgcHVibGljIG1hcEFuZ2xlKCBhbmdsZTogbnVtYmVyICk6IG51bWJlciB7XHJcbiAgICBpZiAoIE1hdGguYWJzKCBVdGlscy5tb2R1bG9CZXR3ZWVuRG93biggYW5nbGUgLSB0aGlzLl9zdGFydEFuZ2xlLCAtTWF0aC5QSSwgTWF0aC5QSSApICkgPCAxZS04ICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fc3RhcnRBbmdsZTtcclxuICAgIH1cclxuICAgIGlmICggTWF0aC5hYnMoIFV0aWxzLm1vZHVsb0JldHdlZW5Eb3duKCBhbmdsZSAtIHRoaXMuZ2V0QWN0dWFsRW5kQW5nbGUoKSwgLU1hdGguUEksIE1hdGguUEkgKSApIDwgMWUtOCApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZ2V0QWN0dWFsRW5kQW5nbGUoKTtcclxuICAgIH1cclxuICAgIC8vIGNvbnNpZGVyIGFuIGFzc2VydCB0aGF0IHdlIGNvbnRhaW4gdGhhdCBhbmdsZT9cclxuICAgIHJldHVybiAoIHRoaXMuX3N0YXJ0QW5nbGUgPiB0aGlzLmdldEFjdHVhbEVuZEFuZ2xlKCkgKSA/XHJcbiAgICAgICAgICAgVXRpbHMubW9kdWxvQmV0d2VlblVwKCBhbmdsZSwgdGhpcy5fc3RhcnRBbmdsZSAtIDIgKiBNYXRoLlBJLCB0aGlzLl9zdGFydEFuZ2xlICkgOlxyXG4gICAgICAgICAgIFV0aWxzLm1vZHVsb0JldHdlZW5Eb3duKCBhbmdsZSwgdGhpcy5fc3RhcnRBbmdsZSwgdGhpcy5fc3RhcnRBbmdsZSArIDIgKiBNYXRoLlBJICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBwYXJhbWV0cml6ZWQgdmFsdWUgdCBmb3IgYSBnaXZlbiBhbmdsZS4gVGhlIHZhbHVlIHQgc2hvdWxkIHJhbmdlIGZyb20gMCB0byAxIChpbmNsdXNpdmUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0QXRBbmdsZSggYW5nbGU6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgY29uc3QgdCA9ICggdGhpcy5tYXBBbmdsZSggYW5nbGUgKSAtIHRoaXMuX3N0YXJ0QW5nbGUgKSAvICggdGhpcy5nZXRBY3R1YWxFbmRBbmdsZSgpIC0gdGhpcy5fc3RhcnRBbmdsZSApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHQgPj0gMCAmJiB0IDw9IDEsIGB0QXRBbmdsZSBvdXQgb2YgcmFuZ2U6ICR7dH1gICk7XHJcblxyXG4gICAgcmV0dXJuIHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBhbmdsZSBmb3IgdGhlIHBhcmFtZXRyaXplZCB0IHZhbHVlLiBUaGUgdCB2YWx1ZSBzaG91bGQgcmFuZ2UgZnJvbSAwIHRvIDEgKGluY2x1c2l2ZSkuXHJcbiAgICovXHJcbiAgcHVibGljIGFuZ2xlQXQoIHQ6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgLy9UT0RPOiBhZGQgYXNzZXJ0cyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgIHJldHVybiB0aGlzLl9zdGFydEFuZ2xlICsgKCB0aGlzLmdldEFjdHVhbEVuZEFuZ2xlKCkgLSB0aGlzLl9zdGFydEFuZ2xlICkgKiB0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcG9zaXRpb24gb2YgdGhpcyBhcmMgYXQgYW5nbGUuXHJcbiAgICovXHJcbiAgcHVibGljIHBvc2l0aW9uQXRBbmdsZSggYW5nbGU6IG51bWJlciApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLl9jZW50ZXIucGx1cyggVmVjdG9yMi5jcmVhdGVQb2xhciggdGhpcy5fcmFkaXVzLCBhbmdsZSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBub3JtYWxpemVkIHRhbmdlbnQgb2YgdGhpcyBhcmMuXHJcbiAgICogVGhlIHRhbmdlbnQgcG9pbnRzIG91dHdhcmQgKGlud2FyZCkgb2YgdGhpcyBhcmMgZm9yIGNsb2Nrd2lzZSAoYW50aWNsb2Nrd2lzZSkgZGlyZWN0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0YW5nZW50QXRBbmdsZSggYW5nbGU6IG51bWJlciApOiBWZWN0b3IyIHtcclxuICAgIGNvbnN0IG5vcm1hbCA9IFZlY3RvcjIuY3JlYXRlUG9sYXIoIDEsIGFuZ2xlICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuX2FudGljbG9ja3dpc2UgPyBub3JtYWwucGVycGVuZGljdWxhciA6IG5vcm1hbC5wZXJwZW5kaWN1bGFyLm5lZ2F0ZWQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gYW5nbGUgaXMgY29udGFpbmVkIGJ5IHRoZSBhcmMgKHdoZXRoZXIgYSByYXkgZnJvbSB0aGUgYXJjJ3Mgb3JpZ2luIGdvaW5nIGluIHRoYXQgYW5nbGVcclxuICAgKiB3aWxsIGludGVyc2VjdCB0aGUgYXJjKS5cclxuICAgKi9cclxuICBwdWJsaWMgY29udGFpbnNBbmdsZSggYW5nbGU6IG51bWJlciApOiBib29sZWFuIHtcclxuICAgIC8vIHRyYW5zZm9ybSB0aGUgYW5nbGUgaW50byB0aGUgYXBwcm9wcmlhdGUgY29vcmRpbmF0ZSBmb3JtXHJcbiAgICAvLyBUT0RPOiBjaGVjayBhbnRpY2xvY2t3aXNlIHZlcnNpb24hIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgY29uc3Qgbm9ybWFsaXplZEFuZ2xlID0gdGhpcy5fYW50aWNsb2Nrd2lzZSA/IGFuZ2xlIC0gdGhpcy5fZW5kQW5nbGUgOiBhbmdsZSAtIHRoaXMuX3N0YXJ0QW5nbGU7XHJcblxyXG4gICAgLy8gZ2V0IHRoZSBhbmdsZSBiZXR3ZWVuIDAgYW5kIDJwaVxyXG4gICAgY29uc3QgcG9zaXRpdmVNaW5BbmdsZSA9IFV0aWxzLm1vZHVsb0JldHdlZW5Eb3duKCBub3JtYWxpemVkQW5nbGUsIDAsIE1hdGguUEkgKiAyICk7XHJcblxyXG4gICAgcmV0dXJuIHBvc2l0aXZlTWluQW5nbGUgPD0gdGhpcy5hbmdsZURpZmZlcmVuY2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIFNWRyBwYXRoLiBhc3N1bWVzIHRoYXQgdGhlIHN0YXJ0IHBvaW50IGlzIGFscmVhZHkgcHJvdmlkZWQsXHJcbiAgICogc28gYW55dGhpbmcgdGhhdCBjYWxscyB0aGlzIG5lZWRzIHRvIHB1dCB0aGUgTSBjYWxscyBmaXJzdFxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTVkdQYXRoRnJhZ21lbnQoKTogc3RyaW5nIHtcclxuICAgIGxldCBvbGRQYXRoRnJhZ21lbnQ7XHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgb2xkUGF0aEZyYWdtZW50ID0gdGhpcy5fc3ZnUGF0aEZyYWdtZW50O1xyXG4gICAgICB0aGlzLl9zdmdQYXRoRnJhZ21lbnQgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgaWYgKCAhdGhpcy5fc3ZnUGF0aEZyYWdtZW50ICkge1xyXG4gICAgICAvLyBzZWUgaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHL3BhdGhzLmh0bWwjUGF0aERhdGFFbGxpcHRpY2FsQXJjQ29tbWFuZHMgZm9yIG1vcmUgaW5mb1xyXG4gICAgICAvLyByeCByeSB4LWF4aXMtcm90YXRpb24gbGFyZ2UtYXJjLWZsYWcgc3dlZXAtZmxhZyB4IHlcclxuXHJcbiAgICAgIGNvbnN0IGVwc2lsb24gPSAwLjAxOyAvLyBhbGxvdyBzb21lIGxlZXdheSB0byByZW5kZXIgdGhpbmdzIGFzICdhbG1vc3QgY2lyY2xlcydcclxuICAgICAgY29uc3Qgc3dlZXBGbGFnID0gdGhpcy5fYW50aWNsb2Nrd2lzZSA/ICcwJyA6ICcxJztcclxuICAgICAgbGV0IGxhcmdlQXJjRmxhZztcclxuICAgICAgaWYgKCB0aGlzLmFuZ2xlRGlmZmVyZW5jZSA8IE1hdGguUEkgKiAyIC0gZXBzaWxvbiApIHtcclxuICAgICAgICBsYXJnZUFyY0ZsYWcgPSB0aGlzLmFuZ2xlRGlmZmVyZW5jZSA8IE1hdGguUEkgPyAnMCcgOiAnMSc7XHJcbiAgICAgICAgdGhpcy5fc3ZnUGF0aEZyYWdtZW50ID0gYEEgJHtzdmdOdW1iZXIoIHRoaXMuX3JhZGl1cyApfSAke3N2Z051bWJlciggdGhpcy5fcmFkaXVzICl9IDAgJHtsYXJnZUFyY0ZsYWdcclxuICAgICAgICB9ICR7c3dlZXBGbGFnfSAke3N2Z051bWJlciggdGhpcy5lbmQueCApfSAke3N2Z051bWJlciggdGhpcy5lbmQueSApfWA7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gY2lyY2xlIChvciBhbG1vc3QtY2lyY2xlKSBjYXNlIG5lZWRzIHRvIGJlIGhhbmRsZWQgZGlmZmVyZW50bHlcclxuICAgICAgICAvLyBzaW5jZSBTVkcgd2lsbCBub3QgYmUgYWJsZSB0byBkcmF3IChvciBrbm93IGhvdyB0byBkcmF3KSB0aGUgY29ycmVjdCBjaXJjbGUgaWYgd2UganVzdCBoYXZlIGEgc3RhcnQgYW5kIGVuZCwgd2UgbmVlZCB0byBzcGxpdCBpdCBpbnRvIHR3byBjaXJjdWxhciBhcmNzXHJcblxyXG4gICAgICAgIC8vIGdldCB0aGUgYW5nbGUgdGhhdCBpcyBiZXR3ZWVuIGFuZCBvcHBvc2l0ZSBvZiBib3RoIG9mIHRoZSBwb2ludHNcclxuICAgICAgICBjb25zdCBzcGxpdE9wcG9zaXRlQW5nbGUgPSAoIHRoaXMuX3N0YXJ0QW5nbGUgKyB0aGlzLl9lbmRBbmdsZSApIC8gMjsgLy8gdGhpcyBfc2hvdWxkXyB3b3JrIGZvciB0aGUgbW9kdWxhciBjYXNlP1xyXG4gICAgICAgIGNvbnN0IHNwbGl0UG9pbnQgPSB0aGlzLl9jZW50ZXIucGx1cyggVmVjdG9yMi5jcmVhdGVQb2xhciggdGhpcy5fcmFkaXVzLCBzcGxpdE9wcG9zaXRlQW5nbGUgKSApO1xyXG5cclxuICAgICAgICBsYXJnZUFyY0ZsYWcgPSAnMCc7IC8vIHNpbmNlIHdlIHNwbGl0IGl0IGluIDIsIGl0J3MgYWx3YXlzIHRoZSBzbWFsbCBhcmNcclxuXHJcbiAgICAgICAgY29uc3QgZmlyc3RBcmMgPSBgQSAke3N2Z051bWJlciggdGhpcy5fcmFkaXVzICl9ICR7c3ZnTnVtYmVyKCB0aGlzLl9yYWRpdXMgKX0gMCAke1xyXG4gICAgICAgICAgbGFyZ2VBcmNGbGFnfSAke3N3ZWVwRmxhZ30gJHtzdmdOdW1iZXIoIHNwbGl0UG9pbnQueCApfSAke3N2Z051bWJlciggc3BsaXRQb2ludC55ICl9YDtcclxuICAgICAgICBjb25zdCBzZWNvbmRBcmMgPSBgQSAke3N2Z051bWJlciggdGhpcy5fcmFkaXVzICl9ICR7c3ZnTnVtYmVyKCB0aGlzLl9yYWRpdXMgKX0gMCAke1xyXG4gICAgICAgICAgbGFyZ2VBcmNGbGFnfSAke3N3ZWVwRmxhZ30gJHtzdmdOdW1iZXIoIHRoaXMuZW5kLnggKX0gJHtzdmdOdW1iZXIoIHRoaXMuZW5kLnkgKX1gO1xyXG5cclxuICAgICAgICB0aGlzLl9zdmdQYXRoRnJhZ21lbnQgPSBgJHtmaXJzdEFyY30gJHtzZWNvbmRBcmN9YDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGlmICggb2xkUGF0aEZyYWdtZW50ICkge1xyXG4gICAgICAgIGFzc2VydCggb2xkUGF0aEZyYWdtZW50ID09PSB0aGlzLl9zdmdQYXRoRnJhZ21lbnQsICdRdWFkcmF0aWMgbGluZSBzZWdtZW50IGNoYW5nZWQgd2l0aG91dCBpbnZhbGlkYXRlKCknICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9zdmdQYXRoRnJhZ21lbnQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGFyY3MgdGhhdCB3aWxsIGRyYXcgYW4gb2Zmc2V0IG9uIHRoZSBsb2dpY2FsIGxlZnQgc2lkZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdHJva2VMZWZ0KCBsaW5lV2lkdGg6IG51bWJlciApOiBBcmNbXSB7XHJcbiAgICByZXR1cm4gWyBuZXcgQXJjKCB0aGlzLl9jZW50ZXIsIHRoaXMuX3JhZGl1cyArICggdGhpcy5fYW50aWNsb2Nrd2lzZSA/IDEgOiAtMSApICogbGluZVdpZHRoIC8gMiwgdGhpcy5fc3RhcnRBbmdsZSwgdGhpcy5fZW5kQW5nbGUsIHRoaXMuX2FudGljbG9ja3dpc2UgKSBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBhcmNzIHRoYXQgd2lsbCBkcmF3IGFuIG9mZnNldCBjdXJ2ZSBvbiB0aGUgbG9naWNhbCByaWdodCBzaWRlXHJcbiAgICovXHJcbiAgcHVibGljIHN0cm9rZVJpZ2h0KCBsaW5lV2lkdGg6IG51bWJlciApOiBBcmNbXSB7XHJcbiAgICByZXR1cm4gWyBuZXcgQXJjKCB0aGlzLl9jZW50ZXIsIHRoaXMuX3JhZGl1cyArICggdGhpcy5fYW50aWNsb2Nrd2lzZSA/IC0xIDogMSApICogbGluZVdpZHRoIC8gMiwgdGhpcy5fZW5kQW5nbGUsIHRoaXMuX3N0YXJ0QW5nbGUsICF0aGlzLl9hbnRpY2xvY2t3aXNlICkgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBsaXN0IG9mIHQgdmFsdWVzIHdoZXJlIGR4L2R0IG9yIGR5L2R0IGlzIDAgd2hlcmUgMCA8IHQgPCAxLiBzdWJkaXZpZGluZyBvbiB0aGVzZSB3aWxsIHJlc3VsdCBpbiBtb25vdG9uaWMgc2VnbWVudHNcclxuICAgKiBEb2VzIG5vdCBpbmNsdWRlIHQ9MCBhbmQgdD0xXHJcbiAgICovXHJcbiAgcHVibGljIGdldEludGVyaW9yRXh0cmVtYVRzKCk6IG51bWJlcltdIHtcclxuICAgIGNvbnN0IHJlc3VsdDogbnVtYmVyW10gPSBbXTtcclxuICAgIF8uZWFjaCggWyAwLCBNYXRoLlBJIC8gMiwgTWF0aC5QSSwgMyAqIE1hdGguUEkgLyAyIF0sIGFuZ2xlID0+IHtcclxuICAgICAgaWYgKCB0aGlzLmNvbnRhaW5zQW5nbGUoIGFuZ2xlICkgKSB7XHJcbiAgICAgICAgY29uc3QgdCA9IHRoaXMudEF0QW5nbGUoIGFuZ2xlICk7XHJcbiAgICAgICAgY29uc3QgZXBzaWxvbiA9IDAuMDAwMDAwMDAwMTsgLy8gVE9ETzogZ2VuZXJhbCBraXRlIGVwc2lsb24/LCBhbHNvIGRvIDFlLU51bWJlciBmb3JtYXQgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICAgICAgaWYgKCB0ID4gZXBzaWxvbiAmJiB0IDwgMSAtIGVwc2lsb24gKSB7XHJcbiAgICAgICAgICByZXN1bHQucHVzaCggdCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgcmV0dXJuIHJlc3VsdC5zb3J0KCk7IC8vIG1vZGlmaWVzIG9yaWdpbmFsLCB3aGljaCBpcyBPS1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGl0LXRlc3RzIHRoaXMgc2VnbWVudCB3aXRoIHRoZSByYXkuIEFuIGFycmF5IG9mIGFsbCBpbnRlcnNlY3Rpb25zIG9mIHRoZSByYXkgd2l0aCB0aGlzIHNlZ21lbnQgd2lsbCBiZSByZXR1cm5lZC5cclxuICAgKiBGb3IgZGV0YWlscywgc2VlIHRoZSBkb2N1bWVudGF0aW9uIGluIFNlZ21lbnQuanNcclxuICAgKi9cclxuICBwdWJsaWMgaW50ZXJzZWN0aW9uKCByYXk6IFJheTIgKTogUmF5SW50ZXJzZWN0aW9uW10ge1xyXG4gICAgY29uc3QgcmVzdWx0OiBSYXlJbnRlcnNlY3Rpb25bXSA9IFtdOyAvLyBoaXRzIGluIG9yZGVyXHJcblxyXG4gICAgLy8gbGVmdCBoZXJlLCBpZiBpbiB0aGUgZnV0dXJlIHdlIHdhbnQgdG8gYmV0dGVyLWhhbmRsZSBib3VuZGFyeSBwb2ludHNcclxuICAgIGNvbnN0IGVwc2lsb24gPSAwO1xyXG5cclxuICAgIC8vIFJ1biBhIGdlbmVyYWwgY2lyY2xlLWludGVyc2VjdGlvbiByb3V0aW5lLCB0aGVuIHdlIGNhbiB0ZXN0IHRoZSBhbmdsZXMgbGF0ZXIuXHJcbiAgICAvLyBTb2x2ZXMgZm9yIHRoZSB0d28gc29sdXRpb25zIHQgc3VjaCB0aGF0IHJheS5wb3NpdGlvbiArIHJheS5kaXJlY3Rpb24gKiB0IGlzIG9uIHRoZSBjaXJjbGUuXHJcbiAgICAvLyBUaGVuIHdlIGNoZWNrIHdoZXRoZXIgdGhlIGFuZ2xlIGF0IGVhY2ggcG9zc2libGUgaGl0IHBvaW50IGlzIGluIG91ciBhcmMuXHJcbiAgICBjb25zdCBjZW50ZXJUb1JheSA9IHJheS5wb3NpdGlvbi5taW51cyggdGhpcy5fY2VudGVyICk7XHJcbiAgICBjb25zdCB0bXAgPSByYXkuZGlyZWN0aW9uLmRvdCggY2VudGVyVG9SYXkgKTtcclxuICAgIGNvbnN0IGNlbnRlclRvUmF5RGlzdFNxID0gY2VudGVyVG9SYXkubWFnbml0dWRlU3F1YXJlZDtcclxuICAgIGNvbnN0IGRpc2NyaW1pbmFudCA9IDQgKiB0bXAgKiB0bXAgLSA0ICogKCBjZW50ZXJUb1JheURpc3RTcSAtIHRoaXMuX3JhZGl1cyAqIHRoaXMuX3JhZGl1cyApO1xyXG4gICAgaWYgKCBkaXNjcmltaW5hbnQgPCBlcHNpbG9uICkge1xyXG4gICAgICAvLyByYXkgbWlzc2VzIGNpcmNsZSBlbnRpcmVseVxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgY29uc3QgYmFzZSA9IHJheS5kaXJlY3Rpb24uZG90KCB0aGlzLl9jZW50ZXIgKSAtIHJheS5kaXJlY3Rpb24uZG90KCByYXkucG9zaXRpb24gKTtcclxuICAgIGNvbnN0IHNxdCA9IE1hdGguc3FydCggZGlzY3JpbWluYW50ICkgLyAyO1xyXG4gICAgY29uc3QgdGEgPSBiYXNlIC0gc3F0O1xyXG4gICAgY29uc3QgdGIgPSBiYXNlICsgc3F0O1xyXG5cclxuICAgIGlmICggdGIgPCBlcHNpbG9uICkge1xyXG4gICAgICAvLyBjaXJjbGUgaXMgYmVoaW5kIHJheVxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBvaW50QiA9IHJheS5wb2ludEF0RGlzdGFuY2UoIHRiICk7XHJcbiAgICBjb25zdCBub3JtYWxCID0gcG9pbnRCLm1pbnVzKCB0aGlzLl9jZW50ZXIgKS5ub3JtYWxpemVkKCk7XHJcbiAgICBjb25zdCBub3JtYWxCQW5nbGUgPSBub3JtYWxCLmFuZ2xlO1xyXG5cclxuICAgIGlmICggdGEgPCBlcHNpbG9uICkge1xyXG4gICAgICAvLyB3ZSBhcmUgaW5zaWRlIHRoZSBjaXJjbGUsIHNvIG9ubHkgb25lIGludGVyc2VjdGlvbiBpcyBwb3NzaWJsZVxyXG4gICAgICBpZiAoIHRoaXMuY29udGFpbnNBbmdsZSggbm9ybWFsQkFuZ2xlICkgKSB7XHJcbiAgICAgICAgLy8gbm9ybWFsIGlzIHRvd2FyZHMgdGhlIHJheSwgc28gd2UgbmVnYXRlIGl0LiBhbHNvIHdpbmRzIG9wcG9zaXRlIHdheVxyXG4gICAgICAgIHJlc3VsdC5wdXNoKCBuZXcgUmF5SW50ZXJzZWN0aW9uKCB0YiwgcG9pbnRCLCBub3JtYWxCLm5lZ2F0ZWQoKSwgdGhpcy5fYW50aWNsb2Nrd2lzZSA/IC0xIDogMSwgdGhpcy50QXRBbmdsZSggbm9ybWFsQkFuZ2xlICkgKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gdHdvIHBvc3NpYmxlIGhpdHMgKG91dHNpZGUgY2lyY2xlKVxyXG4gICAgICBjb25zdCBwb2ludEEgPSByYXkucG9pbnRBdERpc3RhbmNlKCB0YSApO1xyXG4gICAgICBjb25zdCBub3JtYWxBID0gcG9pbnRBLm1pbnVzKCB0aGlzLl9jZW50ZXIgKS5ub3JtYWxpemVkKCk7XHJcbiAgICAgIGNvbnN0IG5vcm1hbEFBbmdsZSA9IG5vcm1hbEEuYW5nbGU7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuY29udGFpbnNBbmdsZSggbm9ybWFsQUFuZ2xlICkgKSB7XHJcbiAgICAgICAgLy8gaGl0IGZyb20gb3V0c2lkZVxyXG4gICAgICAgIHJlc3VsdC5wdXNoKCBuZXcgUmF5SW50ZXJzZWN0aW9uKCB0YSwgcG9pbnRBLCBub3JtYWxBLCB0aGlzLl9hbnRpY2xvY2t3aXNlID8gMSA6IC0xLCB0aGlzLnRBdEFuZ2xlKCBub3JtYWxBQW5nbGUgKSApICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCB0aGlzLmNvbnRhaW5zQW5nbGUoIG5vcm1hbEJBbmdsZSApICkge1xyXG4gICAgICAgIHJlc3VsdC5wdXNoKCBuZXcgUmF5SW50ZXJzZWN0aW9uKCB0YiwgcG9pbnRCLCBub3JtYWxCLm5lZ2F0ZWQoKSwgdGhpcy5fYW50aWNsb2Nrd2lzZSA/IC0xIDogMSwgdGhpcy50QXRBbmdsZSggbm9ybWFsQkFuZ2xlICkgKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHJlc3VsdGFudCB3aW5kaW5nIG51bWJlciBvZiB0aGlzIHJheSBpbnRlcnNlY3RpbmcgdGhpcyBhcmMuXHJcbiAgICovXHJcbiAgcHVibGljIHdpbmRpbmdJbnRlcnNlY3Rpb24oIHJheTogUmF5MiApOiBudW1iZXIge1xyXG4gICAgbGV0IHdpbmQgPSAwO1xyXG4gICAgY29uc3QgaGl0cyA9IHRoaXMuaW50ZXJzZWN0aW9uKCByYXkgKTtcclxuICAgIF8uZWFjaCggaGl0cywgaGl0ID0+IHtcclxuICAgICAgd2luZCArPSBoaXQud2luZDtcclxuICAgIH0gKTtcclxuICAgIHJldHVybiB3aW5kO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRHJhd3MgdGhpcyBhcmMgdG8gdGhlIDJEIENhbnZhcyBjb250ZXh0LCBhc3N1bWluZyB0aGUgY29udGV4dCdzIGN1cnJlbnQgbG9jYXRpb24gaXMgYWxyZWFkeSBhdCB0aGUgc3RhcnQgcG9pbnRcclxuICAgKi9cclxuICBwdWJsaWMgd3JpdGVUb0NvbnRleHQoIGNvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCApOiB2b2lkIHtcclxuICAgIGNvbnRleHQuYXJjKCB0aGlzLl9jZW50ZXIueCwgdGhpcy5fY2VudGVyLnksIHRoaXMuX3JhZGl1cywgdGhpcy5fc3RhcnRBbmdsZSwgdGhpcy5fZW5kQW5nbGUsIHRoaXMuX2FudGljbG9ja3dpc2UgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgY29weSBvZiB0aGlzIGFyYywgdHJhbnNmb3JtZWQgYnkgdGhlIGdpdmVuIG1hdHJpeC5cclxuICAgKlxyXG4gICAqIFRPRE86IHRlc3QgdmFyaW91cyB0cmFuc2Zvcm0gdHlwZXMsIGVzcGVjaWFsbHkgcm90YXRpb25zLCBzY2FsaW5nLCBzaGVhcnMsIGV0Yy4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICovXHJcbiAgcHVibGljIHRyYW5zZm9ybWVkKCBtYXRyaXg6IE1hdHJpeDMgKTogQXJjIHwgRWxsaXB0aWNhbEFyYyB7XHJcbiAgICAvLyBzbyB3ZSBjYW4gaGFuZGxlIHJlZmxlY3Rpb25zIGluIHRoZSB0cmFuc2Zvcm0sIHdlIGRvIHRoZSBnZW5lcmFsIGNhc2UgaGFuZGxpbmcgZm9yIHN0YXJ0L2VuZCBhbmdsZXNcclxuICAgIGNvbnN0IHN0YXJ0QW5nbGUgPSBtYXRyaXgudGltZXNWZWN0b3IyKCBWZWN0b3IyLmNyZWF0ZVBvbGFyKCAxLCB0aGlzLl9zdGFydEFuZ2xlICkgKS5taW51cyggbWF0cml4LnRpbWVzVmVjdG9yMiggVmVjdG9yMi5aRVJPICkgKS5hbmdsZTtcclxuICAgIGxldCBlbmRBbmdsZSA9IG1hdHJpeC50aW1lc1ZlY3RvcjIoIFZlY3RvcjIuY3JlYXRlUG9sYXIoIDEsIHRoaXMuX2VuZEFuZ2xlICkgKS5taW51cyggbWF0cml4LnRpbWVzVmVjdG9yMiggVmVjdG9yMi5aRVJPICkgKS5hbmdsZTtcclxuXHJcbiAgICAvLyByZXZlcnNlIHRoZSAnY2xvY2t3aXNlbmVzcycgaWYgb3VyIHRyYW5zZm9ybSBpbmNsdWRlcyBhIHJlZmxlY3Rpb25cclxuICAgIGNvbnN0IGFudGljbG9ja3dpc2UgPSBtYXRyaXguZ2V0RGV0ZXJtaW5hbnQoKSA+PSAwID8gdGhpcy5fYW50aWNsb2Nrd2lzZSA6ICF0aGlzLl9hbnRpY2xvY2t3aXNlO1xyXG5cclxuICAgIGlmICggTWF0aC5hYnMoIHRoaXMuX2VuZEFuZ2xlIC0gdGhpcy5fc3RhcnRBbmdsZSApID09PSBNYXRoLlBJICogMiApIHtcclxuICAgICAgZW5kQW5nbGUgPSBhbnRpY2xvY2t3aXNlID8gc3RhcnRBbmdsZSAtIE1hdGguUEkgKiAyIDogc3RhcnRBbmdsZSArIE1hdGguUEkgKiAyO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNjYWxlVmVjdG9yID0gbWF0cml4LmdldFNjYWxlVmVjdG9yKCk7XHJcbiAgICBpZiAoIHNjYWxlVmVjdG9yLnggIT09IHNjYWxlVmVjdG9yLnkgKSB7XHJcbiAgICAgIGNvbnN0IHJhZGl1c1ggPSBzY2FsZVZlY3Rvci54ICogdGhpcy5fcmFkaXVzO1xyXG4gICAgICBjb25zdCByYWRpdXNZID0gc2NhbGVWZWN0b3IueSAqIHRoaXMuX3JhZGl1cztcclxuICAgICAgcmV0dXJuIG5ldyBFbGxpcHRpY2FsQXJjKCBtYXRyaXgudGltZXNWZWN0b3IyKCB0aGlzLl9jZW50ZXIgKSwgcmFkaXVzWCwgcmFkaXVzWSwgMCwgc3RhcnRBbmdsZSwgZW5kQW5nbGUsIGFudGljbG9ja3dpc2UgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBjb25zdCByYWRpdXMgPSBzY2FsZVZlY3Rvci54ICogdGhpcy5fcmFkaXVzO1xyXG4gICAgICByZXR1cm4gbmV3IEFyYyggbWF0cml4LnRpbWVzVmVjdG9yMiggdGhpcy5fY2VudGVyICksIHJhZGl1cywgc3RhcnRBbmdsZSwgZW5kQW5nbGUsIGFudGljbG9ja3dpc2UgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNvbnRyaWJ1dGlvbiB0byB0aGUgc2lnbmVkIGFyZWEgY29tcHV0ZWQgdXNpbmcgR3JlZW4ncyBUaGVvcmVtLCB3aXRoIFA9LXkvMiBhbmQgUT14LzIuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIGlzIHRoaXMgc2VnbWVudCdzIGNvbnRyaWJ1dGlvbiB0byB0aGUgbGluZSBpbnRlZ3JhbCAoLXkvMiBkeCArIHgvMiBkeSkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFNpZ25lZEFyZWFGcmFnbWVudCgpOiBudW1iZXIge1xyXG4gICAgY29uc3QgdDAgPSB0aGlzLl9zdGFydEFuZ2xlO1xyXG4gICAgY29uc3QgdDEgPSB0aGlzLmdldEFjdHVhbEVuZEFuZ2xlKCk7XHJcblxyXG4gICAgLy8gRGVyaXZlZCB2aWEgTWF0aGVtYXRpY2EgKGN1cnZlLWFyZWEubmIpXHJcbiAgICByZXR1cm4gMC41ICogdGhpcy5fcmFkaXVzICogKCB0aGlzLl9yYWRpdXMgKiAoIHQxIC0gdDAgKSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jZW50ZXIueCAqICggTWF0aC5zaW4oIHQxICkgLSBNYXRoLnNpbiggdDAgKSApIC1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NlbnRlci55ICogKCBNYXRoLmNvcyggdDEgKSAtIE1hdGguY29zKCB0MCApICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSByZXZlcnNlZCBjb3B5IG9mIHRoaXMgc2VnbWVudCAobWFwcGluZyB0aGUgcGFyYW1ldHJpemF0aW9uIGZyb20gWzAsMV0gPT4gWzEsMF0pLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZXZlcnNlZCgpOiBBcmMge1xyXG4gICAgcmV0dXJuIG5ldyBBcmMoIHRoaXMuX2NlbnRlciwgdGhpcy5fcmFkaXVzLCB0aGlzLl9lbmRBbmdsZSwgdGhpcy5fc3RhcnRBbmdsZSwgIXRoaXMuX2FudGljbG9ja3dpc2UgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFyYyBsZW5ndGggb2YgdGhlIHNlZ21lbnQuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGdldEFyY0xlbmd0aCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0QW5nbGVEaWZmZXJlbmNlKCkgKiB0aGlzLl9yYWRpdXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXZSBjYW4gaGFuZGxlIHRoaXMgc2ltcGx5IGJ5IHJldHVybmluZyBvdXJzZWx2ZXMuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIHRvUGllY2V3aXNlTGluZWFyT3JBcmNTZWdtZW50cygpOiBTZWdtZW50W10ge1xyXG4gICAgcmV0dXJuIFsgdGhpcyBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBvYmplY3QgZm9ybSB0aGF0IGNhbiBiZSB0dXJuZWQgYmFjayBpbnRvIGEgc2VnbWVudCB3aXRoIHRoZSBjb3JyZXNwb25kaW5nIGRlc2VyaWFsaXplIG1ldGhvZC5cclxuICAgKi9cclxuICBwdWJsaWMgc2VyaWFsaXplKCk6IFNlcmlhbGl6ZWRBcmMge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ0FyYycsXHJcbiAgICAgIGNlbnRlclg6IHRoaXMuX2NlbnRlci54LFxyXG4gICAgICBjZW50ZXJZOiB0aGlzLl9jZW50ZXIueSxcclxuICAgICAgcmFkaXVzOiB0aGlzLl9yYWRpdXMsXHJcbiAgICAgIHN0YXJ0QW5nbGU6IHRoaXMuX3N0YXJ0QW5nbGUsXHJcbiAgICAgIGVuZEFuZ2xlOiB0aGlzLl9lbmRBbmdsZSxcclxuICAgICAgYW50aWNsb2Nrd2lzZTogdGhpcy5fYW50aWNsb2Nrd2lzZVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZSB3aGV0aGVyIHR3byBsaW5lcyBvdmVybGFwIG92ZXIgYSBjb250aW51b3VzIHNlY3Rpb24sIGFuZCBpZiBzbyBmaW5kcyB0aGUgYSxiIHBhaXIgc3VjaCB0aGF0XHJcbiAgICogcCggdCApID09PSBxKCBhICogdCArIGIgKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBzZWdtZW50XHJcbiAgICogQHBhcmFtIFtlcHNpbG9uXSAtIFdpbGwgcmV0dXJuIG92ZXJsYXBzIG9ubHkgaWYgbm8gdHdvIGNvcnJlc3BvbmRpbmcgcG9pbnRzIGRpZmZlciBieSB0aGlzIGFtb3VudCBvciBtb3JlXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluIG9uZSBjb21wb25lbnQuXHJcbiAgICogQHJldHVybnMgLSBUaGUgc29sdXRpb24sIGlmIHRoZXJlIGlzIG9uZSAoYW5kIG9ubHkgb25lKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRPdmVybGFwcyggc2VnbWVudDogU2VnbWVudCwgZXBzaWxvbiA9IDFlLTYgKTogT3ZlcmxhcFtdIHwgbnVsbCB7XHJcbiAgICBpZiAoIHNlZ21lbnQgaW5zdGFuY2VvZiBBcmMgKSB7XHJcbiAgICAgIHJldHVybiBBcmMuZ2V0T3ZlcmxhcHMoIHRoaXMsIHNlZ21lbnQgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG1hdHJpeCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29uaWMgc2VjdGlvbiBvZiB0aGUgY2lyY2xlLlxyXG4gICAqIFNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NYXRyaXhfcmVwcmVzZW50YXRpb25fb2ZfY29uaWNfc2VjdGlvbnNcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q29uaWNNYXRyaXgoKTogTWF0cml4MyB7XHJcbiAgICAvLyAoIHggLSBhICleMiArICggeSAtIGIgKV4yID0gcl4yXHJcbiAgICAvLyB4XjIgLSAyYXggKyBhXjIgKyB5XjIgLSAyYnkgKyBiXjIgPSByXjJcclxuICAgIC8vIHheMiArIHleMiAtIDJheCAtIDJieSArICggYV4yICsgYl4yIC0gcl4yICkgPSAwXHJcblxyXG4gICAgY29uc3QgYSA9IHRoaXMuY2VudGVyLng7XHJcbiAgICBjb25zdCBiID0gdGhpcy5jZW50ZXIueTtcclxuXHJcbiAgICAvLyBBeF4yICsgQnh5ICsgQ3leMiArIER4ICsgRXkgKyBGID0gMFxyXG4gICAgY29uc3QgQSA9IDE7XHJcbiAgICBjb25zdCBCID0gMDtcclxuICAgIGNvbnN0IEMgPSAxO1xyXG4gICAgY29uc3QgRCA9IC0yICogYTtcclxuICAgIGNvbnN0IEUgPSAtMiAqIGI7XHJcbiAgICBjb25zdCBGID0gYSAqIGEgKyBiICogYiAtIHRoaXMucmFkaXVzICogdGhpcy5yYWRpdXM7XHJcblxyXG4gICAgcmV0dXJuIE1hdHJpeDMucm93TWFqb3IoXHJcbiAgICAgIEEsIEIgLyAyLCBEIC8gMixcclxuICAgICAgQiAvIDIsIEMsIEUgLyAyLFxyXG4gICAgICBEIC8gMiwgRSAvIDIsIEZcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIEFyYyBmcm9tIHRoZSBzZXJpYWxpemVkIHJlcHJlc2VudGF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgb3ZlcnJpZGUgZGVzZXJpYWxpemUoIG9iajogU2VyaWFsaXplZEFyYyApOiBBcmMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb2JqLnR5cGUgPT09ICdBcmMnICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBBcmMoIG5ldyBWZWN0b3IyKCBvYmouY2VudGVyWCwgb2JqLmNlbnRlclkgKSwgb2JqLnJhZGl1cywgb2JqLnN0YXJ0QW5nbGUsIG9iai5lbmRBbmdsZSwgb2JqLmFudGljbG9ja3dpc2UgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZXMgdGhlIGFjdHVhbCBlbmQgYW5nbGUgKGNvbXBhcmVkIHRvIHRoZSBzdGFydCBhbmdsZSkuXHJcbiAgICpcclxuICAgKiBOb3JtYWxpemVzIHRoZSBzaWduIG9mIHRoZSBhbmdsZXMsIHNvIHRoYXQgdGhlIHNpZ24gb2YgKCBlbmRBbmdsZSAtIHN0YXJ0QW5nbGUgKSBtYXRjaGVzIHdoZXRoZXIgaXQgaXNcclxuICAgKiBhbnRpY2xvY2t3aXNlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgY29tcHV0ZUFjdHVhbEVuZEFuZ2xlKCBzdGFydEFuZ2xlOiBudW1iZXIsIGVuZEFuZ2xlOiBudW1iZXIsIGFudGljbG9ja3dpc2U6IGJvb2xlYW4gKTogbnVtYmVyIHtcclxuICAgIGlmICggYW50aWNsb2Nrd2lzZSApIHtcclxuICAgICAgLy8gYW5nbGUgaXMgJ2RlY3JlYXNpbmcnXHJcbiAgICAgIC8vIC0ycGkgPD0gZW5kIC0gc3RhcnQgPCAycGlcclxuICAgICAgaWYgKCBzdGFydEFuZ2xlID4gZW5kQW5nbGUgKSB7XHJcbiAgICAgICAgcmV0dXJuIGVuZEFuZ2xlO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBzdGFydEFuZ2xlIDwgZW5kQW5nbGUgKSB7XHJcbiAgICAgICAgcmV0dXJuIGVuZEFuZ2xlIC0gMiAqIE1hdGguUEk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gZXF1YWxcclxuICAgICAgICByZXR1cm4gc3RhcnRBbmdsZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGFuZ2xlIGlzICdpbmNyZWFzaW5nJ1xyXG4gICAgICAvLyAtMnBpIDwgZW5kIC0gc3RhcnQgPD0gMnBpXHJcbiAgICAgIGlmICggc3RhcnRBbmdsZSA8IGVuZEFuZ2xlICkge1xyXG4gICAgICAgIHJldHVybiBlbmRBbmdsZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggc3RhcnRBbmdsZSA+IGVuZEFuZ2xlICkge1xyXG4gICAgICAgIHJldHVybiBlbmRBbmdsZSArIE1hdGguUEkgKiAyO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIGVxdWFsXHJcbiAgICAgICAgcmV0dXJuIHN0YXJ0QW5nbGU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXB1dGVzIHRoZSBwb3RlbnRpYWwgb3ZlcmxhcCBiZXR3ZWVuIFswLGVuZDFdIGFuZCBbc3RhcnQyLGVuZDJdICh3aXRoIHQtdmFsdWVzIFswLDFdIGFuZCBbdFN0YXJ0Mix0RW5kMl0pLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGVuZDEgLSBSZWxhdGl2ZSBlbmQgYW5nbGUgb2YgdGhlIGZpcnN0IHNlZ21lbnRcclxuICAgKiBAcGFyYW0gc3RhcnQyIC0gUmVsYXRpdmUgc3RhcnQgYW5nbGUgb2YgdGhlIHNlY29uZCBzZWdtZW50XHJcbiAgICogQHBhcmFtIGVuZDIgLSBSZWxhdGl2ZSBlbmQgYW5nbGUgb2YgdGhlIHNlY29uZCBzZWdtZW50XHJcbiAgICogQHBhcmFtIHRTdGFydDIgLSBUaGUgcGFyYW1ldHJpYyB2YWx1ZSBvZiB0aGUgc2Vjb25kIHNlZ21lbnQncyBzdGFydFxyXG4gICAqIEBwYXJhbSB0RW5kMiAtIFRoZSBwYXJhbWV0cmljIHZhbHVlIG9mIHRoZSBzZWNvbmQgc2VnbWVudCdzIGVuZFxyXG4gICAqL1xyXG4gIHByaXZhdGUgc3RhdGljIGdldFBhcnRpYWxPdmVybGFwKCBlbmQxOiBudW1iZXIsIHN0YXJ0MjogbnVtYmVyLCBlbmQyOiBudW1iZXIsIHRTdGFydDI6IG51bWJlciwgdEVuZDI6IG51bWJlciApOiBPdmVybGFwW10ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZW5kMSA+IDAgJiYgZW5kMSA8PSBUV09fUEkgKyAxZS0xMCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc3RhcnQyID49IDAgJiYgc3RhcnQyIDwgVFdPX1BJICsgMWUtMTAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGVuZDIgPj0gMCAmJiBlbmQyIDw9IFRXT19QSSArIDFlLTEwICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0U3RhcnQyID49IDAgJiYgdFN0YXJ0MiA8PSAxICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0RW5kMiA+PSAwICYmIHRFbmQyIDw9IDEgKTtcclxuXHJcbiAgICBjb25zdCByZXZlcnNlZDIgPSBlbmQyIDwgc3RhcnQyO1xyXG4gICAgY29uc3QgbWluMiA9IHJldmVyc2VkMiA/IGVuZDIgOiBzdGFydDI7XHJcbiAgICBjb25zdCBtYXgyID0gcmV2ZXJzZWQyID8gc3RhcnQyIDogZW5kMjtcclxuXHJcbiAgICBjb25zdCBvdmVybGFwTWluID0gbWluMjtcclxuICAgIGNvbnN0IG92ZXJsYXBNYXggPSBNYXRoLm1pbiggZW5kMSwgbWF4MiApO1xyXG5cclxuICAgIC8vIElmIHRoZXJlJ3Mgbm90IGEgc21hbGwgYW1vdW50IG9mIG92ZXJsYXBcclxuICAgIGlmICggb3ZlcmxhcE1heCA8IG92ZXJsYXBNaW4gKyAxZS04ICkge1xyXG4gICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIFsgT3ZlcmxhcC5jcmVhdGVMaW5lYXIoXHJcbiAgICAgICAgLy8gbWluaW11bVxyXG4gICAgICAgIFV0aWxzLmNsYW1wKCBVdGlscy5saW5lYXIoIDAsIGVuZDEsIDAsIDEsIG92ZXJsYXBNaW4gKSwgMCwgMSApLCAvLyBhcmMxIG1pblxyXG4gICAgICAgIFV0aWxzLmNsYW1wKCBVdGlscy5saW5lYXIoIHN0YXJ0MiwgZW5kMiwgdFN0YXJ0MiwgdEVuZDIsIG92ZXJsYXBNaW4gKSwgMCwgMSApLCAvLyBhcmMyIG1pblxyXG4gICAgICAgIC8vIG1heGltdW1cclxuICAgICAgICBVdGlscy5jbGFtcCggVXRpbHMubGluZWFyKCAwLCBlbmQxLCAwLCAxLCBvdmVybGFwTWF4ICksIDAsIDEgKSwgLy8gYXJjMSBtYXhcclxuICAgICAgICBVdGlscy5jbGFtcCggVXRpbHMubGluZWFyKCBzdGFydDIsIGVuZDIsIHRTdGFydDIsIHRFbmQyLCBvdmVybGFwTWF4ICksIDAsIDEgKSAvLyBhcmMyIG1heFxyXG4gICAgICApIF07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmUgd2hldGhlciB0d28gQXJjcyBvdmVybGFwIG92ZXIgY29udGludW91cyBzZWN0aW9ucywgYW5kIGlmIHNvIGZpbmRzIHRoZSBhLGIgcGFpcnMgc3VjaCB0aGF0XHJcbiAgICogcCggdCApID09PSBxKCBhICogdCArIGIgKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBzdGFydEFuZ2xlMSAtIFN0YXJ0IGFuZ2xlIG9mIGFyYyAxXHJcbiAgICogQHBhcmFtIGVuZEFuZ2xlMSAtIFwiQWN0dWFsXCIgZW5kIGFuZ2xlIG9mIGFyYyAxXHJcbiAgICogQHBhcmFtIHN0YXJ0QW5nbGUyIC0gU3RhcnQgYW5nbGUgb2YgYXJjIDJcclxuICAgKiBAcGFyYW0gZW5kQW5nbGUyIC0gXCJBY3R1YWxcIiBlbmQgYW5nbGUgb2YgYXJjIDJcclxuICAgKiBAcmV0dXJucyAtIEFueSBvdmVybGFwcyAoZnJvbSAwIHRvIDIpXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBnZXRBbmd1bGFyT3ZlcmxhcHMoIHN0YXJ0QW5nbGUxOiBudW1iZXIsIGVuZEFuZ2xlMTogbnVtYmVyLCBzdGFydEFuZ2xlMjogbnVtYmVyLCBlbmRBbmdsZTI6IG51bWJlciApOiBPdmVybGFwW10ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHN0YXJ0QW5nbGUxICkgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBlbmRBbmdsZTEgKSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHN0YXJ0QW5nbGUyICkgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBlbmRBbmdsZTIgKSApO1xyXG5cclxuICAgIC8vIFJlbWFwIHN0YXJ0IG9mIGFyYyAxIHRvIDAsIGFuZCB0aGUgZW5kIHRvIGJlIHBvc2l0aXZlIChzaWduMSApXHJcbiAgICBsZXQgZW5kMSA9IGVuZEFuZ2xlMSAtIHN0YXJ0QW5nbGUxO1xyXG4gICAgY29uc3Qgc2lnbjEgPSBlbmQxIDwgMCA/IC0xIDogMTtcclxuICAgIGVuZDEgKj0gc2lnbjE7XHJcblxyXG4gICAgLy8gUmVtYXAgYXJjIDIgc28gdGhlIHN0YXJ0IHBvaW50IG1hcHMgdG8gdGhlIFswLDJwaSkgcmFuZ2UgKGFuZCBlbmQtcG9pbnQgbWF5IGxpZSBvdXRzaWRlIHRoYXQpXHJcbiAgICBjb25zdCBzdGFydDIgPSBVdGlscy5tb2R1bG9CZXR3ZWVuRG93biggc2lnbjEgKiAoIHN0YXJ0QW5nbGUyIC0gc3RhcnRBbmdsZTEgKSwgMCwgVFdPX1BJICk7XHJcbiAgICBjb25zdCBlbmQyID0gc2lnbjEgKiAoIGVuZEFuZ2xlMiAtIHN0YXJ0QW5nbGUyICkgKyBzdGFydDI7XHJcblxyXG4gICAgbGV0IHdyYXBUO1xyXG4gICAgaWYgKCBlbmQyIDwgLTFlLTEwICkge1xyXG4gICAgICB3cmFwVCA9IC1zdGFydDIgLyAoIGVuZDIgLSBzdGFydDIgKTtcclxuICAgICAgcmV0dXJuIEFyYy5nZXRQYXJ0aWFsT3ZlcmxhcCggZW5kMSwgc3RhcnQyLCAwLCAwLCB3cmFwVCApLmNvbmNhdCggQXJjLmdldFBhcnRpYWxPdmVybGFwKCBlbmQxLCBUV09fUEksIGVuZDIgKyBUV09fUEksIHdyYXBULCAxICkgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBlbmQyID4gVFdPX1BJICsgMWUtMTAgKSB7XHJcbiAgICAgIHdyYXBUID0gKCBUV09fUEkgLSBzdGFydDIgKSAvICggZW5kMiAtIHN0YXJ0MiApO1xyXG4gICAgICByZXR1cm4gQXJjLmdldFBhcnRpYWxPdmVybGFwKCBlbmQxLCBzdGFydDIsIFRXT19QSSwgMCwgd3JhcFQgKS5jb25jYXQoIEFyYy5nZXRQYXJ0aWFsT3ZlcmxhcCggZW5kMSwgMCwgZW5kMiAtIFRXT19QSSwgd3JhcFQsIDEgKSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBBcmMuZ2V0UGFydGlhbE92ZXJsYXAoIGVuZDEsIHN0YXJ0MiwgZW5kMiwgMCwgMSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lIHdoZXRoZXIgdHdvIEFyY3Mgb3ZlcmxhcCBvdmVyIGNvbnRpbnVvdXMgc2VjdGlvbnMsIGFuZCBpZiBzbyBmaW5kcyB0aGUgYSxiIHBhaXJzIHN1Y2ggdGhhdFxyXG4gICAqIHAoIHQgKSA9PT0gcSggYSAqIHQgKyBiICkuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyAtIEFueSBvdmVybGFwcyAoZnJvbSAwIHRvIDIpXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBnZXRPdmVybGFwcyggYXJjMTogQXJjLCBhcmMyOiBBcmMgKTogT3ZlcmxhcFtdIHtcclxuXHJcbiAgICBpZiAoIGFyYzEuX2NlbnRlci5kaXN0YW5jZSggYXJjMi5fY2VudGVyICkgPiAxZS00IHx8IE1hdGguYWJzKCBhcmMxLl9yYWRpdXMgLSBhcmMyLl9yYWRpdXMgKSA+IDFlLTQgKSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gQXJjLmdldEFuZ3VsYXJPdmVybGFwcyggYXJjMS5fc3RhcnRBbmdsZSwgYXJjMS5nZXRBY3R1YWxFbmRBbmdsZSgpLCBhcmMyLl9zdGFydEFuZ2xlLCBhcmMyLmdldEFjdHVhbEVuZEFuZ2xlKCkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHBvaW50cyBvZiBpbnRlcnNlY3Rpb25zIGJldHdlZW4gdHdvIGNpcmNsZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY2VudGVyMSAtIENlbnRlciBvZiB0aGUgZmlyc3QgY2lyY2xlXHJcbiAgICogQHBhcmFtIHJhZGl1czEgLSBSYWRpdXMgb2YgdGhlIGZpcnN0IGNpcmNsZVxyXG4gICAqIEBwYXJhbSBjZW50ZXIyIC0gQ2VudGVyIG9mIHRoZSBzZWNvbmQgY2lyY2xlXHJcbiAgICogQHBhcmFtIHJhZGl1czIgLSBSYWRpdXMgb2YgdGhlIHNlY29uZCBjaXJjbGVcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGdldENpcmNsZUludGVyc2VjdGlvblBvaW50KCBjZW50ZXIxOiBWZWN0b3IyLCByYWRpdXMxOiBudW1iZXIsIGNlbnRlcjI6IFZlY3RvcjIsIHJhZGl1czI6IG51bWJlciApOiBWZWN0b3IyW10ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHJhZGl1czEgKSAmJiByYWRpdXMxID49IDAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCByYWRpdXMyICkgJiYgcmFkaXVzMiA+PSAwICk7XHJcblxyXG4gICAgY29uc3QgZGVsdGEgPSBjZW50ZXIyLm1pbnVzKCBjZW50ZXIxICk7XHJcbiAgICBjb25zdCBkID0gZGVsdGEubWFnbml0dWRlO1xyXG4gICAgbGV0IHJlc3VsdHM6IFZlY3RvcjJbXSA9IFtdO1xyXG4gICAgaWYgKCBkIDwgMWUtMTAgfHwgZCA+IHJhZGl1czEgKyByYWRpdXMyICsgMWUtMTAgKSB7XHJcbiAgICAgIC8vIE5vIGludGVyc2VjdGlvbnNcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBkID4gcmFkaXVzMSArIHJhZGl1czIgLSAxZS0xMCApIHtcclxuICAgICAgcmVzdWx0cyA9IFtcclxuICAgICAgICBjZW50ZXIxLmJsZW5kKCBjZW50ZXIyLCByYWRpdXMxIC8gZCApXHJcbiAgICAgIF07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY29uc3QgeFByaW1lID0gMC41ICogKCBkICogZCAtIHJhZGl1czIgKiByYWRpdXMyICsgcmFkaXVzMSAqIHJhZGl1czEgKSAvIGQ7XHJcbiAgICAgIGNvbnN0IGJpdCA9IGQgKiBkIC0gcmFkaXVzMiAqIHJhZGl1czIgKyByYWRpdXMxICogcmFkaXVzMTtcclxuICAgICAgY29uc3QgZGlzY3JpbWluYW50ID0gNCAqIGQgKiBkICogcmFkaXVzMSAqIHJhZGl1czEgLSBiaXQgKiBiaXQ7XHJcbiAgICAgIGNvbnN0IGJhc2UgPSBjZW50ZXIxLmJsZW5kKCBjZW50ZXIyLCB4UHJpbWUgLyBkICk7XHJcbiAgICAgIGlmICggZGlzY3JpbWluYW50ID49IDFlLTEwICkge1xyXG4gICAgICAgIGNvbnN0IHlQcmltZSA9IE1hdGguc3FydCggZGlzY3JpbWluYW50ICkgLyBkIC8gMjtcclxuICAgICAgICBjb25zdCBwZXJwZW5kaWN1bGFyID0gZGVsdGEucGVycGVuZGljdWxhci5zZXRNYWduaXR1ZGUoIHlQcmltZSApO1xyXG4gICAgICAgIHJlc3VsdHMgPSBbXHJcbiAgICAgICAgICBiYXNlLnBsdXMoIHBlcnBlbmRpY3VsYXIgKSxcclxuICAgICAgICAgIGJhc2UubWludXMoIHBlcnBlbmRpY3VsYXIgKVxyXG4gICAgICAgIF07XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGRpc2NyaW1pbmFudCA+IC0xZS0xMCApIHtcclxuICAgICAgICByZXN1bHRzID0gWyBiYXNlIF07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICByZXN1bHRzLmZvckVhY2goIHJlc3VsdCA9PiB7XHJcbiAgICAgICAgYXNzZXJ0ISggTWF0aC5hYnMoIHJlc3VsdC5kaXN0YW5jZSggY2VudGVyMSApIC0gcmFkaXVzMSApIDwgMWUtOCApO1xyXG4gICAgICAgIGFzc2VydCEoIE1hdGguYWJzKCByZXN1bHQuZGlzdGFuY2UoIGNlbnRlcjIgKSAtIHJhZGl1czIgKSA8IDFlLTggKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFueSAoZmluaXRlKSBpbnRlcnNlY3Rpb24gYmV0d2VlbiB0aGUgdHdvIGFyYyBzZWdtZW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIG92ZXJyaWRlIGludGVyc2VjdCggYTogQXJjLCBiOiBBcmMgKTogU2VnbWVudEludGVyc2VjdGlvbltdIHtcclxuICAgIGNvbnN0IGVwc2lsb24gPSAxZS03O1xyXG5cclxuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcclxuXHJcbiAgICAvLyBJZiB3ZSBlZmZlY3RpdmVseSBoYXZlIHRoZSBzYW1lIGNpcmNsZSwganVzdCBkaWZmZXJlbnQgc2VjdGlvbnMgb2YgaXQuIFRoZSBvbmx5IGZpbml0ZSBpbnRlcnNlY3Rpb25zIGNvdWxkIGJlXHJcbiAgICAvLyBhdCB0aGUgZW5kcG9pbnRzLCBzbyB3ZSdsbCBpbnNwZWN0IHRob3NlLlxyXG4gICAgaWYgKCBhLl9jZW50ZXIuZXF1YWxzRXBzaWxvbiggYi5fY2VudGVyLCBlcHNpbG9uICkgJiYgTWF0aC5hYnMoIGEuX3JhZGl1cyAtIGIuX3JhZGl1cyApIDwgZXBzaWxvbiApIHtcclxuICAgICAgY29uc3QgYVN0YXJ0ID0gYS5wb3NpdGlvbkF0KCAwICk7XHJcbiAgICAgIGNvbnN0IGFFbmQgPSBhLnBvc2l0aW9uQXQoIDEgKTtcclxuICAgICAgY29uc3QgYlN0YXJ0ID0gYi5wb3NpdGlvbkF0KCAwICk7XHJcbiAgICAgIGNvbnN0IGJFbmQgPSBiLnBvc2l0aW9uQXQoIDEgKTtcclxuXHJcbiAgICAgIGlmICggYVN0YXJ0LmVxdWFsc0Vwc2lsb24oIGJTdGFydCwgZXBzaWxvbiApICkge1xyXG4gICAgICAgIHJlc3VsdHMucHVzaCggbmV3IFNlZ21lbnRJbnRlcnNlY3Rpb24oIGFTdGFydC5hdmVyYWdlKCBiU3RhcnQgKSwgMCwgMCApICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBhU3RhcnQuZXF1YWxzRXBzaWxvbiggYkVuZCwgZXBzaWxvbiApICkge1xyXG4gICAgICAgIHJlc3VsdHMucHVzaCggbmV3IFNlZ21lbnRJbnRlcnNlY3Rpb24oIGFTdGFydC5hdmVyYWdlKCBiRW5kICksIDAsIDEgKSApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggYUVuZC5lcXVhbHNFcHNpbG9uKCBiU3RhcnQsIGVwc2lsb24gKSApIHtcclxuICAgICAgICByZXN1bHRzLnB1c2goIG5ldyBTZWdtZW50SW50ZXJzZWN0aW9uKCBhRW5kLmF2ZXJhZ2UoIGJTdGFydCApLCAxLCAwICkgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIGFFbmQuZXF1YWxzRXBzaWxvbiggYkVuZCwgZXBzaWxvbiApICkge1xyXG4gICAgICAgIHJlc3VsdHMucHVzaCggbmV3IFNlZ21lbnRJbnRlcnNlY3Rpb24oIGFFbmQuYXZlcmFnZSggYkVuZCApLCAxLCAxICkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvbnN0IHBvaW50cyA9IEFyYy5nZXRDaXJjbGVJbnRlcnNlY3Rpb25Qb2ludCggYS5fY2VudGVyLCBhLl9yYWRpdXMsIGIuX2NlbnRlciwgYi5fcmFkaXVzICk7XHJcblxyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgY29uc3QgcG9pbnQgPSBwb2ludHNbIGkgXTtcclxuICAgICAgICBjb25zdCBhbmdsZUEgPSBwb2ludC5taW51cyggYS5fY2VudGVyICkuYW5nbGU7XHJcbiAgICAgICAgY29uc3QgYW5nbGVCID0gcG9pbnQubWludXMoIGIuX2NlbnRlciApLmFuZ2xlO1xyXG5cclxuICAgICAgICBpZiAoIGEuY29udGFpbnNBbmdsZSggYW5nbGVBICkgJiYgYi5jb250YWluc0FuZ2xlKCBhbmdsZUIgKSApIHtcclxuICAgICAgICAgIHJlc3VsdHMucHVzaCggbmV3IFNlZ21lbnRJbnRlcnNlY3Rpb24oIHBvaW50LCBhLnRBdEFuZ2xlKCBhbmdsZUEgKSwgYi50QXRBbmdsZSggYW5nbGVCICkgKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHRzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBBcmMgKG9yIGlmIHN0cmFpZ2h0IGVub3VnaCBhIExpbmUpIHNlZ21lbnQgdGhhdCBnb2VzIGZyb20gdGhlIHN0YXJ0UG9pbnQgdG8gdGhlIGVuZFBvaW50LCB0b3VjaGluZ1xyXG4gICAqIHRoZSBtaWRkbGVQb2ludCBzb21ld2hlcmUgYmV0d2VlbiB0aGUgdHdvLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlRnJvbVBvaW50cyggc3RhcnRQb2ludDogVmVjdG9yMiwgbWlkZGxlUG9pbnQ6IFZlY3RvcjIsIGVuZFBvaW50OiBWZWN0b3IyICk6IFNlZ21lbnQge1xyXG4gICAgY29uc3QgY2VudGVyID0gVXRpbHMuY2lyY2xlQ2VudGVyRnJvbVBvaW50cyggc3RhcnRQb2ludCwgbWlkZGxlUG9pbnQsIGVuZFBvaW50ICk7XHJcblxyXG4gICAgLy8gQ2xvc2UgZW5vdWdoXHJcbiAgICBpZiAoIGNlbnRlciA9PT0gbnVsbCApIHtcclxuICAgICAgcmV0dXJuIG5ldyBMaW5lKCBzdGFydFBvaW50LCBlbmRQb2ludCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvbnN0IHN0YXJ0RGlmZiA9IHN0YXJ0UG9pbnQubWludXMoIGNlbnRlciApO1xyXG4gICAgICBjb25zdCBtaWRkbGVEaWZmID0gbWlkZGxlUG9pbnQubWludXMoIGNlbnRlciApO1xyXG4gICAgICBjb25zdCBlbmREaWZmID0gZW5kUG9pbnQubWludXMoIGNlbnRlciApO1xyXG4gICAgICBjb25zdCBzdGFydEFuZ2xlID0gc3RhcnREaWZmLmFuZ2xlO1xyXG4gICAgICBjb25zdCBtaWRkbGVBbmdsZSA9IG1pZGRsZURpZmYuYW5nbGU7XHJcbiAgICAgIGNvbnN0IGVuZEFuZ2xlID0gZW5kRGlmZi5hbmdsZTtcclxuXHJcbiAgICAgIGNvbnN0IHJhZGl1cyA9ICggc3RhcnREaWZmLm1hZ25pdHVkZSArIG1pZGRsZURpZmYubWFnbml0dWRlICsgZW5kRGlmZi5tYWduaXR1ZGUgKSAvIDM7XHJcblxyXG4gICAgICAvLyBUcnkgYW50aWNsb2Nrd2lzZSBmaXJzdC4gVE9ETzogRG9uJ3QgcmVxdWlyZSBjcmVhdGlvbiBvZiBleHRyYSBBcmNzIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgICBjb25zdCBhcmMgPSBuZXcgQXJjKCBjZW50ZXIsIHJhZGl1cywgc3RhcnRBbmdsZSwgZW5kQW5nbGUsIGZhbHNlICk7XHJcbiAgICAgIGlmICggYXJjLmNvbnRhaW5zQW5nbGUoIG1pZGRsZUFuZ2xlICkgKSB7XHJcbiAgICAgICAgcmV0dXJuIGFyYztcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbmV3IEFyYyggY2VudGVyLCByYWRpdXMsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlLCB0cnVlICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmtpdGUucmVnaXN0ZXIoICdBcmMnLCBBcmMgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxPQUFPQyxPQUFPLE1BQU0sNEJBQTRCO0FBRWhELE9BQU9DLEtBQUssTUFBTSwwQkFBMEI7QUFDNUMsT0FBT0MsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxTQUFTQyxhQUFhLEVBQUVDLElBQUksRUFBRUMsSUFBSSxFQUFFQyxPQUFPLEVBQUVDLGVBQWUsRUFBRUMsT0FBTyxFQUFFQyxtQkFBbUIsRUFBRUMsU0FBUyxRQUFRLGVBQWU7O0FBRTVIO0FBQ0EsTUFBTUMsTUFBTSxHQUFHQyxJQUFJLENBQUNDLEVBQUUsR0FBRyxDQUFDO0FBWTFCLGVBQWUsTUFBTUMsR0FBRyxTQUFTTixPQUFPLENBQUM7RUFRdkM7O0VBS3lDO0VBQ0U7O0VBSzNDO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDU08sV0FBV0EsQ0FBRUMsTUFBZSxFQUFFQyxNQUFjLEVBQUVDLFVBQWtCLEVBQUVDLFFBQWdCLEVBQUVDLGFBQXNCLEVBQUc7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