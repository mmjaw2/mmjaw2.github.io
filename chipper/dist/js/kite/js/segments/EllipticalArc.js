// Copyright 2013-2024, University of Colorado Boulder

/**
 * An elliptical arc (a continuous sub-part of an ellipse).
 *
 * Additional helpful notes:
 * - http://www.w3.org/TR/SVG/implnote.html#PathElementImplementationNotes
 * - http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-ellipse
 *   (note: context.ellipse was removed from the Canvas spec)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../../dot/js/Bounds2.js';
import Matrix3 from '../../../dot/js/Matrix3.js';
import Transform3 from '../../../dot/js/Transform3.js';
import Utils from '../../../dot/js/Utils.js';
import Vector2 from '../../../dot/js/Vector2.js';
import Enumeration from '../../../phet-core/js/Enumeration.js';
import EnumerationValue from '../../../phet-core/js/EnumerationValue.js';
import { Arc, BoundsIntersection, kite, Line, RayIntersection, Segment, SegmentIntersection, svgNumber } from '../imports.js';

// constants
const toDegrees = Utils.toDegrees;
const unitCircleConicMatrix = Matrix3.rowMajor(1, 0, 0, 0, 1, 0, 0, 0, -1);
export default class EllipticalArc extends Segment {
  // Lazily-computed derived information
  // Mapping between our ellipse and a unit circle

  // End angle in relation to our start angle (can get remapped)
  // Whether it's a full ellipse (and not just an arc)

  // Corresponding circular arc for our unit transform.

  /**
   * If the startAngle/endAngle difference is ~2pi, this will be a full ellipse
   *
   * @param center - Center of the ellipse
   * @param radiusX - Semi-major radius
   * @param radiusY - Semi-minor radius
   * @param rotation - Rotation of the semi-major axis
   * @param startAngle - Angle (radians) of the start of the arc
   * @param endAngle - Angle (radians) of the end of the arc
   * @param anticlockwise - Decides which direction the arc takes around the center
   */
  constructor(center, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
    super();
    this._center = center;
    this._radiusX = radiusX;
    this._radiusY = radiusY;
    this._rotation = rotation;
    this._startAngle = startAngle;
    this._endAngle = endAngle;
    this._anticlockwise = anticlockwise;
    this.invalidate();
  }

  /**
   * Sets the center of the EllipticalArc.
   */
  setCenter(center) {
    assert && assert(center.isFinite(), `EllipticalArc center should be finite: ${center.toString()}`);
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
   * Returns the center of this EllipticalArc.
   */
  getCenter() {
    return this._center;
  }

  /**
   * Sets the semi-major radius of the EllipticalArc.
   */
  setRadiusX(radiusX) {
    assert && assert(isFinite(radiusX), `EllipticalArc radiusX should be a finite number: ${radiusX}`);
    if (this._radiusX !== radiusX) {
      this._radiusX = radiusX;
      this.invalidate();
    }
    return this; // allow chaining
  }
  set radiusX(value) {
    this.setRadiusX(value);
  }
  get radiusX() {
    return this.getRadiusX();
  }

  /**
   * Returns the semi-major radius of this EllipticalArc.
   */
  getRadiusX() {
    return this._radiusX;
  }

  /**
   * Sets the semi-minor radius of the EllipticalArc.
   */
  setRadiusY(radiusY) {
    assert && assert(isFinite(radiusY), `EllipticalArc radiusY should be a finite number: ${radiusY}`);
    if (this._radiusY !== radiusY) {
      this._radiusY = radiusY;
      this.invalidate();
    }
    return this; // allow chaining
  }
  set radiusY(value) {
    this.setRadiusY(value);
  }
  get radiusY() {
    return this.getRadiusY();
  }

  /**
   * Returns the semi-minor radius of this EllipticalArc.
   */
  getRadiusY() {
    return this._radiusY;
  }

  /**
   * Sets the rotation of the EllipticalArc.
   */
  setRotation(rotation) {
    assert && assert(isFinite(rotation), `EllipticalArc rotation should be a finite number: ${rotation}`);
    if (this._rotation !== rotation) {
      this._rotation = rotation;
      this.invalidate();
    }
    return this; // allow chaining
  }
  set rotation(value) {
    this.setRotation(value);
  }
  get rotation() {
    return this.getRotation();
  }

  /**
   * Returns the rotation of this EllipticalArc.
   */
  getRotation() {
    return this._rotation;
  }

  /**
   * Sets the startAngle of the EllipticalArc.
   */
  setStartAngle(startAngle) {
    assert && assert(isFinite(startAngle), `EllipticalArc startAngle should be a finite number: ${startAngle}`);
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
   * Returns the startAngle of this EllipticalArc.
   */
  getStartAngle() {
    return this._startAngle;
  }

  /**
   * Sets the endAngle of the EllipticalArc.
   */
  setEndAngle(endAngle) {
    assert && assert(isFinite(endAngle), `EllipticalArc endAngle should be a finite number: ${endAngle}`);
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
   * Returns the endAngle of this EllipticalArc.
   */
  getEndAngle() {
    return this._endAngle;
  }

  /**
   * Sets the anticlockwise of the EllipticalArc.
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
   * Returns the anticlockwise of this EllipticalArc.
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

    // see http://mathworld.wolfram.com/Ellipse.html (59)
    const angle = this.angleAt(t);
    const aq = this._radiusX * Math.sin(angle);
    const bq = this._radiusY * Math.cos(angle);
    const denominator = Math.pow(bq * bq + aq * aq, 3 / 2);
    return (this._anticlockwise ? -1 : 1) * this._radiusX * this._radiusY / denominator;
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
    return [new EllipticalArc(this._center, this._radiusX, this._radiusY, this._rotation, angle0, angleT, this._anticlockwise), new EllipticalArc(this._center, this._radiusX, this._radiusY, this._rotation, angleT, angle1, this._anticlockwise)];
  }

  /**
   * Clears cached information, should be called when any of the 'constructor arguments' are mutated.
   */
  invalidate() {
    assert && assert(this._center instanceof Vector2, 'Arc center should be a Vector2');
    assert && assert(this._center.isFinite(), 'Arc center should be finite (not NaN or infinite)');
    assert && assert(typeof this._radiusX === 'number', `Arc radiusX should be a number: ${this._radiusX}`);
    assert && assert(isFinite(this._radiusX), `Arc radiusX should be a finite number: ${this._radiusX}`);
    assert && assert(typeof this._radiusY === 'number', `Arc radiusY should be a number: ${this._radiusY}`);
    assert && assert(isFinite(this._radiusY), `Arc radiusY should be a finite number: ${this._radiusY}`);
    assert && assert(typeof this._rotation === 'number', `Arc rotation should be a number: ${this._rotation}`);
    assert && assert(isFinite(this._rotation), `Arc rotation should be a finite number: ${this._rotation}`);
    assert && assert(typeof this._startAngle === 'number', `Arc startAngle should be a number: ${this._startAngle}`);
    assert && assert(isFinite(this._startAngle), `Arc startAngle should be a finite number: ${this._startAngle}`);
    assert && assert(typeof this._endAngle === 'number', `Arc endAngle should be a number: ${this._endAngle}`);
    assert && assert(isFinite(this._endAngle), `Arc endAngle should be a finite number: ${this._endAngle}`);
    assert && assert(typeof this._anticlockwise === 'boolean', `Arc anticlockwise should be a boolean: ${this._anticlockwise}`);
    this._unitTransform = null;
    this._start = null;
    this._end = null;
    this._startTangent = null;
    this._endTangent = null;
    this._actualEndAngle = null;
    this._isFullPerimeter = null;
    this._angleDifference = null;
    this._unitArcSegment = null;
    this._bounds = null;
    this._svgPathFragment = null;

    // remapping of negative radii
    if (this._radiusX < 0) {
      // support this case since we might actually need to handle it inside of strokes?
      this._radiusX = -this._radiusX;
      this._startAngle = Math.PI - this._startAngle;
      this._endAngle = Math.PI - this._endAngle;
      this._anticlockwise = !this._anticlockwise;
    }
    if (this._radiusY < 0) {
      // support this case since we might actually need to handle it inside of strokes?
      this._radiusY = -this._radiusY;
      this._startAngle = -this._startAngle;
      this._endAngle = -this._endAngle;
      this._anticlockwise = !this._anticlockwise;
    }
    if (this._radiusX < this._radiusY) {
      // swap radiusX and radiusY internally for consistent Canvas / SVG output
      this._rotation += Math.PI / 2;
      this._startAngle -= Math.PI / 2;
      this._endAngle -= Math.PI / 2;

      // swap radiusX and radiusY
      const tmpR = this._radiusX;
      this._radiusX = this._radiusY;
      this._radiusY = tmpR;
    }
    if (this._radiusX < this._radiusY) {
      // TODO: check this https://github.com/phetsims/kite/issues/76
      throw new Error('Not verified to work if radiusX < radiusY');
    }

    // constraints shared with Arc
    assert && assert(!(!this._anticlockwise && this._endAngle - this._startAngle <= -Math.PI * 2 || this._anticlockwise && this._startAngle - this._endAngle <= -Math.PI * 2), 'Not handling elliptical arcs with start/end angles that show differences in-between browser handling');
    assert && assert(!(!this._anticlockwise && this._endAngle - this._startAngle > Math.PI * 2 || this._anticlockwise && this._startAngle - this._endAngle > Math.PI * 2), 'Not handling elliptical arcs with start/end angles that show differences in-between browser handling');
    this.invalidationEmitter.emit();
  }

  /**
   * Computes a transform that maps a unit circle into this ellipse's location.
   *
   * Helpful, since we can get the parametric position of our unit circle (at t), and then transform it with this
   * transform to get the ellipse's parametric position (at t).
   */
  getUnitTransform() {
    if (this._unitTransform === null) {
      this._unitTransform = EllipticalArc.computeUnitTransform(this._center, this._radiusX, this._radiusY, this._rotation);
    }
    return this._unitTransform;
  }
  get unitTransform() {
    return this.getUnitTransform();
  }

  /**
   * Gets the start point of this ellipticalArc
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
   * Gets the end point of this ellipticalArc
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
   * Gets the tangent vector (normalized) to this ellipticalArc at the start, pointing in the direction of motion (from start to end)
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
   * Gets the tangent vector (normalized) to this ellipticalArc at the end point, pointing in the direction of motion (from start to end)
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
   * Gets the end angle in radians
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
   * Returns a boolean value that indicates if the arc wraps up by more than two Pi
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
   * Returns an angle difference that represents how "much" of the circle our arc covers
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
   * A unit arg segment that we can map to our ellipse. useful for hit testing and such.
   */
  getUnitArcSegment() {
    if (this._unitArcSegment === null) {
      this._unitArcSegment = new Arc(Vector2.ZERO, 1, this._startAngle, this._endAngle, this._anticlockwise);
    }
    return this._unitArcSegment;
  }
  get unitArcSegment() {
    return this.getUnitArcSegment();
  }

  /**
   * Returns the bounds of this segment.
   */
  getBounds() {
    if (this._bounds === null) {
      this._bounds = Bounds2.NOTHING.withPoint(this.getStart()).withPoint(this.getEnd());

      // if the angles are different, check extrema points
      if (this._startAngle !== this._endAngle) {
        // solve the mapping from the unit circle, find locations where a coordinate of the gradient is zero.
        // we find one extrema point for both x and y, since the other two are just rotated by pi from them.
        const xAngle = Math.atan(-(this._radiusY / this._radiusX) * Math.tan(this._rotation));
        const yAngle = Math.atan(this._radiusY / this._radiusX / Math.tan(this._rotation));

        // check all of the extrema points
        this.possibleExtremaAngles = [xAngle, xAngle + Math.PI, yAngle, yAngle + Math.PI];
        _.each(this.possibleExtremaAngles, this.includeBoundsAtAngle.bind(this));
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
    if (this._radiusX <= 0 || this._radiusY <= 0 || this._startAngle === this._endAngle) {
      return [];
    } else if (this._radiusX === this._radiusY) {
      // reduce to an Arc
      const startAngle = this._startAngle + this._rotation;
      let endAngle = this._endAngle + this._rotation;

      // preserve full circles
      if (Math.abs(this._endAngle - this._startAngle) === Math.PI * 2) {
        endAngle = this._anticlockwise ? startAngle - Math.PI * 2 : startAngle + Math.PI * 2;
      }
      return [new Arc(this._center, this._radiusX, startAngle, endAngle, this._anticlockwise)];
    } else {
      return [this];
    }
  }

  /**
   * Attempts to expand the private _bounds bounding box to include a point at a specific angle, making sure that
   * angle is actually included in the arc. This will presumably be called at angles that are at critical points,
   * where the arc should have maximum/minimum x/y values.
   */
  includeBoundsAtAngle(angle) {
    if (this.unitArcSegment.containsAngle(angle)) {
      // the boundary point is in the arc
      this._bounds = this._bounds.withPoint(this.positionAtAngle(angle));
    }
  }

  /**
   * Maps a contained angle to between [startAngle,actualEndAngle), even if the end angle is lower.
   *
   * TODO: remove duplication with Arc https://github.com/phetsims/kite/issues/76
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
   *
   * TODO: remove duplication with Arc https://github.com/phetsims/kite/issues/76
   */
  tAtAngle(angle) {
    return (this.mapAngle(angle) - this._startAngle) / (this.getActualEndAngle() - this._startAngle);
  }

  /**
   * Returns the angle for the parametrized t value. The t value should range from 0 to 1 (inclusive).
   */
  angleAt(t) {
    return this._startAngle + (this.getActualEndAngle() - this._startAngle) * t;
  }

  /**
   * Returns the position of this arc at angle.
   */
  positionAtAngle(angle) {
    return this.getUnitTransform().transformPosition2(Vector2.createPolar(1, angle));
  }

  /**
   * Returns the normalized tangent of this arc.
   * The tangent points outward (inward) of this arc for clockwise (anticlockwise) direction.
   */
  tangentAtAngle(angle) {
    const normal = this.getUnitTransform().transformNormal2(Vector2.createPolar(1, angle));
    return this._anticlockwise ? normal.perpendicular : normal.perpendicular.negated();
  }

  /**
   * Returns an array of straight lines that will draw an offset on the logical left (right) side for reverse false (true)
   * It discretizes the elliptical arc in 32 segments and returns an offset curve as a list of lineTos/
   *
   * @param r - distance
   * @param reverse
   */
  offsetTo(r, reverse) {
    // how many segments to create (possibly make this more adaptive?)
    const quantity = 32;
    const points = [];
    const result = [];
    for (let i = 0; i < quantity; i++) {
      let ratio = i / (quantity - 1);
      if (reverse) {
        ratio = 1 - ratio;
      }
      const angle = this.angleAt(ratio);
      points.push(this.positionAtAngle(angle).plus(this.tangentAtAngle(angle).perpendicular.normalized().times(r)));
      if (i > 0) {
        result.push(new Line(points[i - 1], points[i]));
      }
    }
    return result;
  }

  /**
   * Returns a string containing the SVG path. assumes that the start point is already provided,
   * so anything that calls this needs to put the M calls first.
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
      const degreesRotation = toDegrees(this._rotation); // bleh, degrees?
      if (this.getAngleDifference() < Math.PI * 2 - epsilon) {
        largeArcFlag = this.getAngleDifference() < Math.PI ? '0' : '1';
        this._svgPathFragment = `A ${svgNumber(this._radiusX)} ${svgNumber(this._radiusY)} ${degreesRotation} ${largeArcFlag} ${sweepFlag} ${svgNumber(this.getEnd().x)} ${svgNumber(this.getEnd().y)}`;
      } else {
        // ellipse (or almost-ellipse) case needs to be handled differently
        // since SVG will not be able to draw (or know how to draw) the correct circle if we just have a start and end, we need to split it into two circular arcs

        // get the angle that is between and opposite of both of the points
        const splitOppositeAngle = (this._startAngle + this._endAngle) / 2; // this _should_ work for the modular case?
        const splitPoint = this.positionAtAngle(splitOppositeAngle);
        largeArcFlag = '0'; // since we split it in 2, it's always the small arc

        const firstArc = `A ${svgNumber(this._radiusX)} ${svgNumber(this._radiusY)} ${degreesRotation} ${largeArcFlag} ${sweepFlag} ${svgNumber(splitPoint.x)} ${svgNumber(splitPoint.y)}`;
        const secondArc = `A ${svgNumber(this._radiusX)} ${svgNumber(this._radiusY)} ${degreesRotation} ${largeArcFlag} ${sweepFlag} ${svgNumber(this.getEnd().x)} ${svgNumber(this.getEnd().y)}`;
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
   * Returns an array of straight lines  that will draw an offset on the logical left side.
   */
  strokeLeft(lineWidth) {
    return this.offsetTo(-lineWidth / 2, false);
  }

  /**
   * Returns an array of straight lines that will draw an offset curve on the logical right side.
   */
  strokeRight(lineWidth) {
    return this.offsetTo(lineWidth / 2, true);
  }

  /**
   * Returns a list of t values where dx/dt or dy/dt is 0 where 0 < t < 1. subdividing on these will result in monotonic segments
   * Does not include t=0 and t=1.
   */
  getInteriorExtremaTs() {
    const result = [];
    _.each(this.possibleExtremaAngles, angle => {
      if (this.unitArcSegment.containsAngle(angle)) {
        const t = this.tAtAngle(angle);
        const epsilon = 0.0000000001; // TODO: general kite epsilon? https://github.com/phetsims/kite/issues/76
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
    // be lazy. transform it into the space of a non-elliptical arc.
    const unitTransform = this.getUnitTransform();
    const rayInUnitCircleSpace = unitTransform.inverseRay2(ray);
    const hits = this.getUnitArcSegment().intersection(rayInUnitCircleSpace);
    return _.map(hits, hit => {
      const transformedPoint = unitTransform.transformPosition2(hit.point);
      const distance = ray.position.distance(transformedPoint);
      const normal = unitTransform.inverseNormal2(hit.normal);
      return new RayIntersection(distance, transformedPoint, normal, hit.wind, hit.t);
    });
  }

  /**
   * Returns the resultant winding number of this ray intersecting this arc.
   */
  windingIntersection(ray) {
    // be lazy. transform it into the space of a non-elliptical arc.
    const rayInUnitCircleSpace = this.getUnitTransform().inverseRay2(ray);
    return this.getUnitArcSegment().windingIntersection(rayInUnitCircleSpace);
  }

  /**
   * Draws this arc to the 2D Canvas context, assuming the context's current location is already at the start point
   */
  writeToContext(context) {
    if (context.ellipse) {
      context.ellipse(this._center.x, this._center.y, this._radiusX, this._radiusY, this._rotation, this._startAngle, this._endAngle, this._anticlockwise);
    } else {
      // fake the ellipse call by using transforms
      this.getUnitTransform().getMatrix().canvasAppendTransform(context);
      context.arc(0, 0, 1, this._startAngle, this._endAngle, this._anticlockwise);
      this.getUnitTransform().getInverse().canvasAppendTransform(context);
    }
  }

  /**
   * Returns this elliptical arc transformed by a matrix
   */
  transformed(matrix) {
    const transformedSemiMajorAxis = matrix.timesVector2(Vector2.createPolar(this._radiusX, this._rotation)).minus(matrix.timesVector2(Vector2.ZERO));
    const transformedSemiMinorAxis = matrix.timesVector2(Vector2.createPolar(this._radiusY, this._rotation + Math.PI / 2)).minus(matrix.timesVector2(Vector2.ZERO));
    const rotation = transformedSemiMajorAxis.angle;
    const radiusX = transformedSemiMajorAxis.magnitude;
    const radiusY = transformedSemiMinorAxis.magnitude;
    const reflected = matrix.getDeterminant() < 0;

    // reverse the 'clockwiseness' if our transform includes a reflection
    // TODO: check reflections. swapping angle signs should fix clockwiseness https://github.com/phetsims/kite/issues/76
    const anticlockwise = reflected ? !this._anticlockwise : this._anticlockwise;
    const startAngle = reflected ? -this._startAngle : this._startAngle;
    let endAngle = reflected ? -this._endAngle : this._endAngle;
    if (Math.abs(this._endAngle - this._startAngle) === Math.PI * 2) {
      endAngle = anticlockwise ? startAngle - Math.PI * 2 : startAngle + Math.PI * 2;
    }
    return new EllipticalArc(matrix.timesVector2(this._center), radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
  }

  /**
   * Returns the contribution to the signed area computed using Green's Theorem, with P=-y/2 and Q=x/2.
   *
   * NOTE: This is this segment's contribution to the line integral (-y/2 dx + x/2 dy).
   */
  getSignedAreaFragment() {
    const t0 = this._startAngle;
    const t1 = this.getActualEndAngle();
    const sin0 = Math.sin(t0);
    const sin1 = Math.sin(t1);
    const cos0 = Math.cos(t0);
    const cos1 = Math.cos(t1);

    // Derived via Mathematica (curve-area.nb)
    return 0.5 * (this._radiusX * this._radiusY * (t1 - t0) + Math.cos(this._rotation) * (this._radiusX * this._center.y * (cos0 - cos1) + this._radiusY * this._center.x * (sin1 - sin0)) + Math.sin(this._rotation) * (this._radiusX * this._center.x * (cos1 - cos0) + this._radiusY * this._center.y * (sin1 - sin0)));
  }

  /**
   * Returns a reversed copy of this segment (mapping the parametrization from [0,1] => [1,0]).
   */
  reversed() {
    return new EllipticalArc(this._center, this._radiusX, this._radiusY, this._rotation, this._endAngle, this._startAngle, !this._anticlockwise);
  }

  /**
   * Returns an object form that can be turned back into a segment with the corresponding deserialize method.
   */
  serialize() {
    return {
      type: 'EllipticalArc',
      centerX: this._center.x,
      centerY: this._center.y,
      radiusX: this._radiusX,
      radiusY: this._radiusY,
      rotation: this._rotation,
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
    if (segment instanceof EllipticalArc) {
      return EllipticalArc.getOverlaps(this, segment);
    }
    return null;
  }

  /**
   * Returns the matrix representation of the conic section of the ellipse.
   * See https://en.wikipedia.org/wiki/Matrix_representation_of_conic_sections
   */
  getConicMatrix() {
    // Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0

    // x'^2 + y'^2 = 1      ---- our unit circle
    // (x,y,1) = M * (x',y',1)   ---- our transform matrix
    // C = [ 1, 0, 0, 0, 1, 0, 0, 0, -1 ] --- conic matrix for the unit circle

    // (x',y',1)^T * C * (x',y',1) = 0  --- conic matrix equation for our unit circle
    // ( M^-1 * (x,y,1) )^T * C * M^-1 * (x,y,1) = 0 --- substitute in our transform matrix
    // (x,y,1)^T * ( M^-1^T * C * M^-1 ) * (x,y,1) = 0 --- isolate conic matrix for our ellipse

    // ( M^-1^T * C * M^-1 ) is the conic matrix for our ellipse
    const unitMatrix = EllipticalArc.computeUnitMatrix(this._center, this._radiusX, this._radiusY, this._rotation);
    const invertedUnitMatrix = unitMatrix.inverted();
    return invertedUnitMatrix.transposed().multiplyMatrix(unitCircleConicMatrix).multiplyMatrix(invertedUnitMatrix);
  }

  /**
   * Returns an EllipticalArc from the serialized representation.
   */
  static deserialize(obj) {
    assert && assert(obj.type === 'EllipticalArc');
    return new EllipticalArc(new Vector2(obj.centerX, obj.centerY), obj.radiusX, obj.radiusY, obj.rotation, obj.startAngle, obj.endAngle, obj.anticlockwise);
  }

  /**
   * Returns what type of overlap is possible based on the center/radii/rotation. We ignore the start/end angles and
   * anticlockwise information, and determine if the FULL ellipses overlap.
   */
  static getOverlapType(a, b, epsilon = 1e-4) {
    // Different centers can't overlap continuously
    if (a._center.distance(b._center) < epsilon) {
      const matchingRadii = Math.abs(a._radiusX - b._radiusX) < epsilon && Math.abs(a._radiusY - b._radiusY) < epsilon;
      const oppositeRadii = Math.abs(a._radiusX - b._radiusY) < epsilon && Math.abs(a._radiusY - b._radiusX) < epsilon;
      if (matchingRadii) {
        // Difference between rotations should be an approximate multiple of pi. We add pi/2 before modulo, so the
        // result of that should be ~pi/2 (don't need to check both endpoints)
        if (Math.abs(Utils.moduloBetweenDown(a._rotation - b._rotation + Math.PI / 2, 0, Math.PI) - Math.PI / 2) < epsilon) {
          return EllipticalArcOverlapType.MATCHING_OVERLAP;
        }
      }
      if (oppositeRadii) {
        // Difference between rotations should be an approximate multiple of pi (with pi/2 added).
        if (Math.abs(Utils.moduloBetweenDown(a._rotation - b._rotation, 0, Math.PI) - Math.PI / 2) < epsilon) {
          return EllipticalArcOverlapType.OPPOSITE_OVERLAP;
        }
      }
    }
    return EllipticalArcOverlapType.NONE;
  }

  /**
   * Determine whether two elliptical arcs overlap over continuous sections, and if so finds the a,b pairs such that
   * p( t ) === q( a * t + b ).
   *
   * @returns - Any overlaps (from 0 to 2)
   */
  static getOverlaps(a, b) {
    const overlapType = EllipticalArc.getOverlapType(a, b);
    if (overlapType === EllipticalArcOverlapType.NONE) {
      return [];
    } else {
      return Arc.getAngularOverlaps(a._startAngle + a._rotation, a.getActualEndAngle() + a._rotation, b._startAngle + b._rotation, b.getActualEndAngle() + b._rotation);
    }
  }

  /**
   * Returns any (finite) intersection between the two elliptical arc segments.
   */
  static intersect(a, b, epsilon = 1e-10) {
    const overlapType = EllipticalArc.getOverlapType(a, b, epsilon);
    if (overlapType === EllipticalArcOverlapType.NONE) {
      return BoundsIntersection.intersect(a, b);
    } else {
      // If we effectively have the same ellipse, just different sections of it. The only finite intersections could be
      // at the endpoints, so we'll inspect those.

      const results = [];
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
      return results;
    }
  }

  /**
   * Matrix that transforms the unit circle into our ellipse
   */
  static computeUnitMatrix(center, radiusX, radiusY, rotation) {
    return Matrix3.translationFromVector(center).timesMatrix(Matrix3.rotation2(rotation)).timesMatrix(Matrix3.scaling(radiusX, radiusY));
  }

  /**
   * Transforms the unit circle into our ellipse.
   *
   * adapted from http://www.w3.org/TR/SVG/implnote.html#PathElementImplementationNotes
   */
  static computeUnitTransform(center, radiusX, radiusY, rotation) {
    return new Transform3(EllipticalArc.computeUnitMatrix(center, radiusX, radiusY, rotation));
  }
}
export class EllipticalArcOverlapType extends EnumerationValue {
  // radiusX of one equals radiusX of the other, with equivalent centers and rotations to work
  static MATCHING_OVERLAP = new EllipticalArcOverlapType();

  // radiusX of one equals radiusY of the other, with equivalent centers and rotations to work
  static OPPOSITE_OVERLAP = new EllipticalArcOverlapType();

  // no overlap
  static NONE = new EllipticalArcOverlapType();
  static enumeration = new Enumeration(EllipticalArcOverlapType);
}
kite.register('EllipticalArc', EllipticalArc);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiTWF0cml4MyIsIlRyYW5zZm9ybTMiLCJVdGlscyIsIlZlY3RvcjIiLCJFbnVtZXJhdGlvbiIsIkVudW1lcmF0aW9uVmFsdWUiLCJBcmMiLCJCb3VuZHNJbnRlcnNlY3Rpb24iLCJraXRlIiwiTGluZSIsIlJheUludGVyc2VjdGlvbiIsIlNlZ21lbnQiLCJTZWdtZW50SW50ZXJzZWN0aW9uIiwic3ZnTnVtYmVyIiwidG9EZWdyZWVzIiwidW5pdENpcmNsZUNvbmljTWF0cml4Iiwicm93TWFqb3IiLCJFbGxpcHRpY2FsQXJjIiwiY29uc3RydWN0b3IiLCJjZW50ZXIiLCJyYWRpdXNYIiwicmFkaXVzWSIsInJvdGF0aW9uIiwic3RhcnRBbmdsZSIsImVuZEFuZ2xlIiwiYW50aWNsb2Nrd2lzZSIsIl9jZW50ZXIiLCJfcmFkaXVzWCIsIl9yYWRpdXNZIiwiX3JvdGF0aW9uIiwiX3N0YXJ0QW5nbGUiLCJfZW5kQW5nbGUiLCJfYW50aWNsb2Nrd2lzZSIsImludmFsaWRhdGUiLCJzZXRDZW50ZXIiLCJhc3NlcnQiLCJpc0Zpbml0ZSIsInRvU3RyaW5nIiwiZXF1YWxzIiwidmFsdWUiLCJnZXRDZW50ZXIiLCJzZXRSYWRpdXNYIiwiZ2V0UmFkaXVzWCIsInNldFJhZGl1c1kiLCJnZXRSYWRpdXNZIiwic2V0Um90YXRpb24iLCJnZXRSb3RhdGlvbiIsInNldFN0YXJ0QW5nbGUiLCJnZXRTdGFydEFuZ2xlIiwic2V0RW5kQW5nbGUiLCJnZXRFbmRBbmdsZSIsInNldEFudGljbG9ja3dpc2UiLCJnZXRBbnRpY2xvY2t3aXNlIiwicG9zaXRpb25BdCIsInQiLCJwb3NpdGlvbkF0QW5nbGUiLCJhbmdsZUF0IiwidGFuZ2VudEF0IiwidGFuZ2VudEF0QW5nbGUiLCJjdXJ2YXR1cmVBdCIsImFuZ2xlIiwiYXEiLCJNYXRoIiwic2luIiwiYnEiLCJjb3MiLCJkZW5vbWluYXRvciIsInBvdyIsInN1YmRpdmlkZWQiLCJhbmdsZTAiLCJhbmdsZVQiLCJhbmdsZTEiLCJfdW5pdFRyYW5zZm9ybSIsIl9zdGFydCIsIl9lbmQiLCJfc3RhcnRUYW5nZW50IiwiX2VuZFRhbmdlbnQiLCJfYWN0dWFsRW5kQW5nbGUiLCJfaXNGdWxsUGVyaW1ldGVyIiwiX2FuZ2xlRGlmZmVyZW5jZSIsIl91bml0QXJjU2VnbWVudCIsIl9ib3VuZHMiLCJfc3ZnUGF0aEZyYWdtZW50IiwiUEkiLCJ0bXBSIiwiRXJyb3IiLCJpbnZhbGlkYXRpb25FbWl0dGVyIiwiZW1pdCIsImdldFVuaXRUcmFuc2Zvcm0iLCJjb21wdXRlVW5pdFRyYW5zZm9ybSIsInVuaXRUcmFuc2Zvcm0iLCJnZXRTdGFydCIsInN0YXJ0IiwiZ2V0RW5kIiwiZW5kIiwiZ2V0U3RhcnRUYW5nZW50Iiwic3RhcnRUYW5nZW50IiwiZ2V0RW5kVGFuZ2VudCIsImVuZFRhbmdlbnQiLCJnZXRBY3R1YWxFbmRBbmdsZSIsImNvbXB1dGVBY3R1YWxFbmRBbmdsZSIsImFjdHVhbEVuZEFuZ2xlIiwiZ2V0SXNGdWxsUGVyaW1ldGVyIiwiaXNGdWxsUGVyaW1ldGVyIiwiZ2V0QW5nbGVEaWZmZXJlbmNlIiwiYW5nbGVEaWZmZXJlbmNlIiwiZ2V0VW5pdEFyY1NlZ21lbnQiLCJaRVJPIiwidW5pdEFyY1NlZ21lbnQiLCJnZXRCb3VuZHMiLCJOT1RISU5HIiwid2l0aFBvaW50IiwieEFuZ2xlIiwiYXRhbiIsInRhbiIsInlBbmdsZSIsInBvc3NpYmxlRXh0cmVtYUFuZ2xlcyIsIl8iLCJlYWNoIiwiaW5jbHVkZUJvdW5kc0F0QW5nbGUiLCJiaW5kIiwiYm91bmRzIiwiZ2V0Tm9uZGVnZW5lcmF0ZVNlZ21lbnRzIiwiYWJzIiwiY29udGFpbnNBbmdsZSIsIm1hcEFuZ2xlIiwibW9kdWxvQmV0d2VlbkRvd24iLCJtb2R1bG9CZXR3ZWVuVXAiLCJ0QXRBbmdsZSIsInRyYW5zZm9ybVBvc2l0aW9uMiIsImNyZWF0ZVBvbGFyIiwibm9ybWFsIiwidHJhbnNmb3JtTm9ybWFsMiIsInBlcnBlbmRpY3VsYXIiLCJuZWdhdGVkIiwib2Zmc2V0VG8iLCJyIiwicmV2ZXJzZSIsInF1YW50aXR5IiwicG9pbnRzIiwicmVzdWx0IiwiaSIsInJhdGlvIiwicHVzaCIsInBsdXMiLCJub3JtYWxpemVkIiwidGltZXMiLCJnZXRTVkdQYXRoRnJhZ21lbnQiLCJvbGRQYXRoRnJhZ21lbnQiLCJlcHNpbG9uIiwic3dlZXBGbGFnIiwibGFyZ2VBcmNGbGFnIiwiZGVncmVlc1JvdGF0aW9uIiwieCIsInkiLCJzcGxpdE9wcG9zaXRlQW5nbGUiLCJzcGxpdFBvaW50IiwiZmlyc3RBcmMiLCJzZWNvbmRBcmMiLCJzdHJva2VMZWZ0IiwibGluZVdpZHRoIiwic3Ryb2tlUmlnaHQiLCJnZXRJbnRlcmlvckV4dHJlbWFUcyIsInNvcnQiLCJpbnRlcnNlY3Rpb24iLCJyYXkiLCJyYXlJblVuaXRDaXJjbGVTcGFjZSIsImludmVyc2VSYXkyIiwiaGl0cyIsIm1hcCIsImhpdCIsInRyYW5zZm9ybWVkUG9pbnQiLCJwb2ludCIsImRpc3RhbmNlIiwicG9zaXRpb24iLCJpbnZlcnNlTm9ybWFsMiIsIndpbmQiLCJ3aW5kaW5nSW50ZXJzZWN0aW9uIiwid3JpdGVUb0NvbnRleHQiLCJjb250ZXh0IiwiZWxsaXBzZSIsImdldE1hdHJpeCIsImNhbnZhc0FwcGVuZFRyYW5zZm9ybSIsImFyYyIsImdldEludmVyc2UiLCJ0cmFuc2Zvcm1lZCIsIm1hdHJpeCIsInRyYW5zZm9ybWVkU2VtaU1ham9yQXhpcyIsInRpbWVzVmVjdG9yMiIsIm1pbnVzIiwidHJhbnNmb3JtZWRTZW1pTWlub3JBeGlzIiwibWFnbml0dWRlIiwicmVmbGVjdGVkIiwiZ2V0RGV0ZXJtaW5hbnQiLCJnZXRTaWduZWRBcmVhRnJhZ21lbnQiLCJ0MCIsInQxIiwic2luMCIsInNpbjEiLCJjb3MwIiwiY29zMSIsInJldmVyc2VkIiwic2VyaWFsaXplIiwidHlwZSIsImNlbnRlclgiLCJjZW50ZXJZIiwiZ2V0T3ZlcmxhcHMiLCJzZWdtZW50IiwiZ2V0Q29uaWNNYXRyaXgiLCJ1bml0TWF0cml4IiwiY29tcHV0ZVVuaXRNYXRyaXgiLCJpbnZlcnRlZFVuaXRNYXRyaXgiLCJpbnZlcnRlZCIsInRyYW5zcG9zZWQiLCJtdWx0aXBseU1hdHJpeCIsImRlc2VyaWFsaXplIiwib2JqIiwiZ2V0T3ZlcmxhcFR5cGUiLCJhIiwiYiIsIm1hdGNoaW5nUmFkaWkiLCJvcHBvc2l0ZVJhZGlpIiwiRWxsaXB0aWNhbEFyY092ZXJsYXBUeXBlIiwiTUFUQ0hJTkdfT1ZFUkxBUCIsIk9QUE9TSVRFX09WRVJMQVAiLCJOT05FIiwib3ZlcmxhcFR5cGUiLCJnZXRBbmd1bGFyT3ZlcmxhcHMiLCJpbnRlcnNlY3QiLCJyZXN1bHRzIiwiYVN0YXJ0IiwiYUVuZCIsImJTdGFydCIsImJFbmQiLCJlcXVhbHNFcHNpbG9uIiwiYXZlcmFnZSIsInRyYW5zbGF0aW9uRnJvbVZlY3RvciIsInRpbWVzTWF0cml4Iiwicm90YXRpb24yIiwic2NhbGluZyIsImVudW1lcmF0aW9uIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJFbGxpcHRpY2FsQXJjLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEFuIGVsbGlwdGljYWwgYXJjIChhIGNvbnRpbnVvdXMgc3ViLXBhcnQgb2YgYW4gZWxsaXBzZSkuXHJcbiAqXHJcbiAqIEFkZGl0aW9uYWwgaGVscGZ1bCBub3RlczpcclxuICogLSBodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcvaW1wbG5vdGUuaHRtbCNQYXRoRWxlbWVudEltcGxlbWVudGF0aW9uTm90ZXNcclxuICogLSBodHRwOi8vd3d3LndoYXR3Zy5vcmcvc3BlY3Mvd2ViLWFwcHMvY3VycmVudC13b3JrL211bHRpcGFnZS90aGUtY2FudmFzLWVsZW1lbnQuaHRtbCNkb20tY29udGV4dC0yZC1lbGxpcHNlXHJcbiAqICAgKG5vdGU6IGNvbnRleHQuZWxsaXBzZSB3YXMgcmVtb3ZlZCBmcm9tIHRoZSBDYW52YXMgc3BlYylcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgUmF5MiBmcm9tICcuLi8uLi8uLi9kb3QvanMvUmF5Mi5qcyc7XHJcbmltcG9ydCBUcmFuc2Zvcm0zIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9UcmFuc2Zvcm0zLmpzJztcclxuaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9VdGlscy5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IEVudW1lcmF0aW9uIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9FbnVtZXJhdGlvbi5qcyc7XHJcbmltcG9ydCBFbnVtZXJhdGlvblZhbHVlIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9FbnVtZXJhdGlvblZhbHVlLmpzJztcclxuaW1wb3J0IHsgQXJjLCBCb3VuZHNJbnRlcnNlY3Rpb24sIGtpdGUsIExpbmUsIE92ZXJsYXAsIFJheUludGVyc2VjdGlvbiwgU2VnbWVudCwgU2VnbWVudEludGVyc2VjdGlvbiwgc3ZnTnVtYmVyIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgdG9EZWdyZWVzID0gVXRpbHMudG9EZWdyZWVzO1xyXG5cclxuY29uc3QgdW5pdENpcmNsZUNvbmljTWF0cml4ID0gTWF0cml4My5yb3dNYWpvcihcclxuICAxLCAwLCAwLFxyXG4gIDAsIDEsIDAsXHJcbiAgMCwgMCwgLTFcclxuKTtcclxuXHJcbmV4cG9ydCB0eXBlIFNlcmlhbGl6ZWRFbGxpcHRpY2FsQXJjID0ge1xyXG4gIHR5cGU6ICdFbGxpcHRpY2FsQXJjJztcclxuICBjZW50ZXJYOiBudW1iZXI7XHJcbiAgY2VudGVyWTogbnVtYmVyO1xyXG4gIHJhZGl1c1g6IG51bWJlcjtcclxuICByYWRpdXNZOiBudW1iZXI7XHJcbiAgcm90YXRpb246IG51bWJlcjtcclxuICBzdGFydEFuZ2xlOiBudW1iZXI7XHJcbiAgZW5kQW5nbGU6IG51bWJlcjtcclxuICBhbnRpY2xvY2t3aXNlOiBib29sZWFuO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRWxsaXB0aWNhbEFyYyBleHRlbmRzIFNlZ21lbnQge1xyXG5cclxuICBwcml2YXRlIF9jZW50ZXI6IFZlY3RvcjI7XHJcbiAgcHJpdmF0ZSBfcmFkaXVzWDogbnVtYmVyO1xyXG4gIHByaXZhdGUgX3JhZGl1c1k6IG51bWJlcjtcclxuICBwcml2YXRlIF9yb3RhdGlvbjogbnVtYmVyO1xyXG4gIHByaXZhdGUgX3N0YXJ0QW5nbGU6IG51bWJlcjtcclxuICBwcml2YXRlIF9lbmRBbmdsZTogbnVtYmVyO1xyXG4gIHByaXZhdGUgX2FudGljbG9ja3dpc2U6IGJvb2xlYW47XHJcblxyXG4gIC8vIExhemlseS1jb21wdXRlZCBkZXJpdmVkIGluZm9ybWF0aW9uXHJcbiAgcHJpdmF0ZSBfdW5pdFRyYW5zZm9ybSE6IFRyYW5zZm9ybTMgfCBudWxsOyAvLyBNYXBwaW5nIGJldHdlZW4gb3VyIGVsbGlwc2UgYW5kIGEgdW5pdCBjaXJjbGVcclxuICBwcml2YXRlIF9zdGFydCE6IFZlY3RvcjIgfCBudWxsO1xyXG4gIHByaXZhdGUgX2VuZCE6IFZlY3RvcjIgfCBudWxsO1xyXG4gIHByaXZhdGUgX3N0YXJ0VGFuZ2VudCE6IFZlY3RvcjIgfCBudWxsO1xyXG4gIHByaXZhdGUgX2VuZFRhbmdlbnQhOiBWZWN0b3IyIHwgbnVsbDtcclxuICBwcml2YXRlIF9hY3R1YWxFbmRBbmdsZSE6IG51bWJlciB8IG51bGw7IC8vIEVuZCBhbmdsZSBpbiByZWxhdGlvbiB0byBvdXIgc3RhcnQgYW5nbGUgKGNhbiBnZXQgcmVtYXBwZWQpXHJcbiAgcHJpdmF0ZSBfaXNGdWxsUGVyaW1ldGVyITogYm9vbGVhbiB8IG51bGw7IC8vIFdoZXRoZXIgaXQncyBhIGZ1bGwgZWxsaXBzZSAoYW5kIG5vdCBqdXN0IGFuIGFyYylcclxuICBwcml2YXRlIF9hbmdsZURpZmZlcmVuY2UhOiBudW1iZXIgfCBudWxsO1xyXG4gIHByaXZhdGUgX3VuaXRBcmNTZWdtZW50ITogQXJjIHwgbnVsbDsgLy8gQ29ycmVzcG9uZGluZyBjaXJjdWxhciBhcmMgZm9yIG91ciB1bml0IHRyYW5zZm9ybS5cclxuICBwcml2YXRlIF9ib3VuZHMhOiBCb3VuZHMyIHwgbnVsbDtcclxuICBwcml2YXRlIF9zdmdQYXRoRnJhZ21lbnQhOiBzdHJpbmcgfCBudWxsO1xyXG5cclxuICBwcml2YXRlIHBvc3NpYmxlRXh0cmVtYUFuZ2xlcz86IG51bWJlcltdO1xyXG5cclxuICAvKipcclxuICAgKiBJZiB0aGUgc3RhcnRBbmdsZS9lbmRBbmdsZSBkaWZmZXJlbmNlIGlzIH4ycGksIHRoaXMgd2lsbCBiZSBhIGZ1bGwgZWxsaXBzZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNlbnRlciAtIENlbnRlciBvZiB0aGUgZWxsaXBzZVxyXG4gICAqIEBwYXJhbSByYWRpdXNYIC0gU2VtaS1tYWpvciByYWRpdXNcclxuICAgKiBAcGFyYW0gcmFkaXVzWSAtIFNlbWktbWlub3IgcmFkaXVzXHJcbiAgICogQHBhcmFtIHJvdGF0aW9uIC0gUm90YXRpb24gb2YgdGhlIHNlbWktbWFqb3IgYXhpc1xyXG4gICAqIEBwYXJhbSBzdGFydEFuZ2xlIC0gQW5nbGUgKHJhZGlhbnMpIG9mIHRoZSBzdGFydCBvZiB0aGUgYXJjXHJcbiAgICogQHBhcmFtIGVuZEFuZ2xlIC0gQW5nbGUgKHJhZGlhbnMpIG9mIHRoZSBlbmQgb2YgdGhlIGFyY1xyXG4gICAqIEBwYXJhbSBhbnRpY2xvY2t3aXNlIC0gRGVjaWRlcyB3aGljaCBkaXJlY3Rpb24gdGhlIGFyYyB0YWtlcyBhcm91bmQgdGhlIGNlbnRlclxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggY2VudGVyOiBWZWN0b3IyLCByYWRpdXNYOiBudW1iZXIsIHJhZGl1c1k6IG51bWJlciwgcm90YXRpb246IG51bWJlciwgc3RhcnRBbmdsZTogbnVtYmVyLCBlbmRBbmdsZTogbnVtYmVyLCBhbnRpY2xvY2t3aXNlOiBib29sZWFuICkge1xyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICB0aGlzLl9jZW50ZXIgPSBjZW50ZXI7XHJcbiAgICB0aGlzLl9yYWRpdXNYID0gcmFkaXVzWDtcclxuICAgIHRoaXMuX3JhZGl1c1kgPSByYWRpdXNZO1xyXG4gICAgdGhpcy5fcm90YXRpb24gPSByb3RhdGlvbjtcclxuICAgIHRoaXMuX3N0YXJ0QW5nbGUgPSBzdGFydEFuZ2xlO1xyXG4gICAgdGhpcy5fZW5kQW5nbGUgPSBlbmRBbmdsZTtcclxuICAgIHRoaXMuX2FudGljbG9ja3dpc2UgPSBhbnRpY2xvY2t3aXNlO1xyXG5cclxuICAgIHRoaXMuaW52YWxpZGF0ZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgY2VudGVyIG9mIHRoZSBFbGxpcHRpY2FsQXJjLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRDZW50ZXIoIGNlbnRlcjogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGNlbnRlci5pc0Zpbml0ZSgpLCBgRWxsaXB0aWNhbEFyYyBjZW50ZXIgc2hvdWxkIGJlIGZpbml0ZTogJHtjZW50ZXIudG9TdHJpbmcoKX1gICk7XHJcblxyXG4gICAgaWYgKCAhdGhpcy5fY2VudGVyLmVxdWFscyggY2VudGVyICkgKSB7XHJcbiAgICAgIHRoaXMuX2NlbnRlciA9IGNlbnRlcjtcclxuICAgICAgdGhpcy5pbnZhbGlkYXRlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgY2VudGVyKCB2YWx1ZTogVmVjdG9yMiApIHsgdGhpcy5zZXRDZW50ZXIoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBjZW50ZXIoKTogVmVjdG9yMiB7IHJldHVybiB0aGlzLmdldENlbnRlcigpOyB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjZW50ZXIgb2YgdGhpcyBFbGxpcHRpY2FsQXJjLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDZW50ZXIoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5fY2VudGVyO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHNlbWktbWFqb3IgcmFkaXVzIG9mIHRoZSBFbGxpcHRpY2FsQXJjLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRSYWRpdXNYKCByYWRpdXNYOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggcmFkaXVzWCApLCBgRWxsaXB0aWNhbEFyYyByYWRpdXNYIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7cmFkaXVzWH1gICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9yYWRpdXNYICE9PSByYWRpdXNYICkge1xyXG4gICAgICB0aGlzLl9yYWRpdXNYID0gcmFkaXVzWDtcclxuICAgICAgdGhpcy5pbnZhbGlkYXRlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgcmFkaXVzWCggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRSYWRpdXNYKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmFkaXVzWCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRSYWRpdXNYKCk7IH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHNlbWktbWFqb3IgcmFkaXVzIG9mIHRoaXMgRWxsaXB0aWNhbEFyYy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UmFkaXVzWCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3JhZGl1c1g7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgc2VtaS1taW5vciByYWRpdXMgb2YgdGhlIEVsbGlwdGljYWxBcmMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFJhZGl1c1koIHJhZGl1c1k6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCByYWRpdXNZICksIGBFbGxpcHRpY2FsQXJjIHJhZGl1c1kgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcjogJHtyYWRpdXNZfWAgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX3JhZGl1c1kgIT09IHJhZGl1c1kgKSB7XHJcbiAgICAgIHRoaXMuX3JhZGl1c1kgPSByYWRpdXNZO1xyXG4gICAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCByYWRpdXNZKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldFJhZGl1c1koIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCByYWRpdXNZKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFJhZGl1c1koKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBzZW1pLW1pbm9yIHJhZGl1cyBvZiB0aGlzIEVsbGlwdGljYWxBcmMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFJhZGl1c1koKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9yYWRpdXNZO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHJvdGF0aW9uIG9mIHRoZSBFbGxpcHRpY2FsQXJjLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRSb3RhdGlvbiggcm90YXRpb246IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCByb3RhdGlvbiApLCBgRWxsaXB0aWNhbEFyYyByb3RhdGlvbiBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3JvdGF0aW9ufWAgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX3JvdGF0aW9uICE9PSByb3RhdGlvbiApIHtcclxuICAgICAgdGhpcy5fcm90YXRpb24gPSByb3RhdGlvbjtcclxuICAgICAgdGhpcy5pbnZhbGlkYXRlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgcm90YXRpb24oIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0Um90YXRpb24oIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCByb3RhdGlvbigpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRSb3RhdGlvbigpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHJvdGF0aW9uIG9mIHRoaXMgRWxsaXB0aWNhbEFyYy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Um90YXRpb24oKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9yb3RhdGlvbjtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBzdGFydEFuZ2xlIG9mIHRoZSBFbGxpcHRpY2FsQXJjLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRTdGFydEFuZ2xlKCBzdGFydEFuZ2xlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggc3RhcnRBbmdsZSApLCBgRWxsaXB0aWNhbEFyYyBzdGFydEFuZ2xlIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7c3RhcnRBbmdsZX1gICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9zdGFydEFuZ2xlICE9PSBzdGFydEFuZ2xlICkge1xyXG4gICAgICB0aGlzLl9zdGFydEFuZ2xlID0gc3RhcnRBbmdsZTtcclxuICAgICAgdGhpcy5pbnZhbGlkYXRlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgc3RhcnRBbmdsZSggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRTdGFydEFuZ2xlKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc3RhcnRBbmdsZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRTdGFydEFuZ2xlKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc3RhcnRBbmdsZSBvZiB0aGlzIEVsbGlwdGljYWxBcmMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFN0YXJ0QW5nbGUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9zdGFydEFuZ2xlO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGVuZEFuZ2xlIG9mIHRoZSBFbGxpcHRpY2FsQXJjLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRFbmRBbmdsZSggZW5kQW5nbGU6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBlbmRBbmdsZSApLCBgRWxsaXB0aWNhbEFyYyBlbmRBbmdsZSBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyOiAke2VuZEFuZ2xlfWAgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX2VuZEFuZ2xlICE9PSBlbmRBbmdsZSApIHtcclxuICAgICAgdGhpcy5fZW5kQW5nbGUgPSBlbmRBbmdsZTtcclxuICAgICAgdGhpcy5pbnZhbGlkYXRlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgZW5kQW5nbGUoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0RW5kQW5nbGUoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBlbmRBbmdsZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRFbmRBbmdsZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGVuZEFuZ2xlIG9mIHRoaXMgRWxsaXB0aWNhbEFyYy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RW5kQW5nbGUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9lbmRBbmdsZTtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBhbnRpY2xvY2t3aXNlIG9mIHRoZSBFbGxpcHRpY2FsQXJjLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRBbnRpY2xvY2t3aXNlKCBhbnRpY2xvY2t3aXNlOiBib29sZWFuICk6IHRoaXMge1xyXG4gICAgaWYgKCB0aGlzLl9hbnRpY2xvY2t3aXNlICE9PSBhbnRpY2xvY2t3aXNlICkge1xyXG4gICAgICB0aGlzLl9hbnRpY2xvY2t3aXNlID0gYW50aWNsb2Nrd2lzZTtcclxuICAgICAgdGhpcy5pbnZhbGlkYXRlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgYW50aWNsb2Nrd2lzZSggdmFsdWU6IGJvb2xlYW4gKSB7IHRoaXMuc2V0QW50aWNsb2Nrd2lzZSggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGFudGljbG9ja3dpc2UoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmdldEFudGljbG9ja3dpc2UoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBhbnRpY2xvY2t3aXNlIG9mIHRoaXMgRWxsaXB0aWNhbEFyYy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0QW50aWNsb2Nrd2lzZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9hbnRpY2xvY2t3aXNlO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHBvc2l0aW9uIHBhcmFtZXRyaWNhbGx5LCB3aXRoIDAgPD0gdCA8PSAxLlxyXG4gICAqXHJcbiAgICogTk9URTogcG9zaXRpb25BdCggMCApIHdpbGwgcmV0dXJuIHRoZSBzdGFydCBvZiB0aGUgc2VnbWVudCwgYW5kIHBvc2l0aW9uQXQoIDEgKSB3aWxsIHJldHVybiB0aGUgZW5kIG9mIHRoZVxyXG4gICAqIHNlZ21lbnQuXHJcbiAgICpcclxuICAgKiBUaGlzIG1ldGhvZCBpcyBwYXJ0IG9mIHRoZSBTZWdtZW50IEFQSS4gU2VlIFNlZ21lbnQuanMncyBjb25zdHJ1Y3RvciBmb3IgbW9yZSBBUEkgZG9jdW1lbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgcG9zaXRpb25BdCggdDogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA+PSAwLCAncG9zaXRpb25BdCB0IHNob3VsZCBiZSBub24tbmVnYXRpdmUnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0IDw9IDEsICdwb3NpdGlvbkF0IHQgc2hvdWxkIGJlIG5vIGdyZWF0ZXIgdGhhbiAxJyApO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnBvc2l0aW9uQXRBbmdsZSggdGhpcy5hbmdsZUF0KCB0ICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG5vbi1ub3JtYWxpemVkIHRhbmdlbnQgKGR4L2R0LCBkeS9kdCkgb2YgdGhpcyBzZWdtZW50IGF0IHRoZSBwYXJhbWV0cmljIHZhbHVlIG9mIHQsIHdpdGggMCA8PSB0IDw9IDEuXHJcbiAgICpcclxuICAgKiBOT1RFOiB0YW5nZW50QXQoIDAgKSB3aWxsIHJldHVybiB0aGUgdGFuZ2VudCBhdCB0aGUgc3RhcnQgb2YgdGhlIHNlZ21lbnQsIGFuZCB0YW5nZW50QXQoIDEgKSB3aWxsIHJldHVybiB0aGVcclxuICAgKiB0YW5nZW50IGF0IHRoZSBlbmQgb2YgdGhlIHNlZ21lbnQuXHJcbiAgICpcclxuICAgKiBUaGlzIG1ldGhvZCBpcyBwYXJ0IG9mIHRoZSBTZWdtZW50IEFQSS4gU2VlIFNlZ21lbnQuanMncyBjb25zdHJ1Y3RvciBmb3IgbW9yZSBBUEkgZG9jdW1lbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgdGFuZ2VudEF0KCB0OiBudW1iZXIgKTogVmVjdG9yMiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0ID49IDAsICd0YW5nZW50QXQgdCBzaG91bGQgYmUgbm9uLW5lZ2F0aXZlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA8PSAxLCAndGFuZ2VudEF0IHQgc2hvdWxkIGJlIG5vIGdyZWF0ZXIgdGhhbiAxJyApO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRhbmdlbnRBdEFuZ2xlKCB0aGlzLmFuZ2xlQXQoIHQgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc2lnbmVkIGN1cnZhdHVyZSBvZiB0aGUgc2VnbWVudCBhdCB0aGUgcGFyYW1ldHJpYyB2YWx1ZSB0LCB3aGVyZSAwIDw9IHQgPD0gMS5cclxuICAgKlxyXG4gICAqIFRoZSBjdXJ2YXR1cmUgd2lsbCBiZSBwb3NpdGl2ZSBmb3IgdmlzdWFsIGNsb2Nrd2lzZSAvIG1hdGhlbWF0aWNhbCBjb3VudGVyY2xvY2t3aXNlIGN1cnZlcywgbmVnYXRpdmUgZm9yIG9wcG9zaXRlXHJcbiAgICogY3VydmF0dXJlLCBhbmQgMCBmb3Igbm8gY3VydmF0dXJlLlxyXG4gICAqXHJcbiAgICogTk9URTogY3VydmF0dXJlQXQoIDAgKSB3aWxsIHJldHVybiB0aGUgY3VydmF0dXJlIGF0IHRoZSBzdGFydCBvZiB0aGUgc2VnbWVudCwgYW5kIGN1cnZhdHVyZUF0KCAxICkgd2lsbCByZXR1cm5cclxuICAgKiB0aGUgY3VydmF0dXJlIGF0IHRoZSBlbmQgb2YgdGhlIHNlZ21lbnQuXHJcbiAgICpcclxuICAgKiBUaGlzIG1ldGhvZCBpcyBwYXJ0IG9mIHRoZSBTZWdtZW50IEFQSS4gU2VlIFNlZ21lbnQuanMncyBjb25zdHJ1Y3RvciBmb3IgbW9yZSBBUEkgZG9jdW1lbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgY3VydmF0dXJlQXQoIHQ6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA+PSAwLCAnY3VydmF0dXJlQXQgdCBzaG91bGQgYmUgbm9uLW5lZ2F0aXZlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA8PSAxLCAnY3VydmF0dXJlQXQgdCBzaG91bGQgYmUgbm8gZ3JlYXRlciB0aGFuIDEnICk7XHJcblxyXG4gICAgLy8gc2VlIGh0dHA6Ly9tYXRod29ybGQud29sZnJhbS5jb20vRWxsaXBzZS5odG1sICg1OSlcclxuICAgIGNvbnN0IGFuZ2xlID0gdGhpcy5hbmdsZUF0KCB0ICk7XHJcbiAgICBjb25zdCBhcSA9IHRoaXMuX3JhZGl1c1ggKiBNYXRoLnNpbiggYW5nbGUgKTtcclxuICAgIGNvbnN0IGJxID0gdGhpcy5fcmFkaXVzWSAqIE1hdGguY29zKCBhbmdsZSApO1xyXG4gICAgY29uc3QgZGVub21pbmF0b3IgPSBNYXRoLnBvdyggYnEgKiBicSArIGFxICogYXEsIDMgLyAyICk7XHJcbiAgICByZXR1cm4gKCB0aGlzLl9hbnRpY2xvY2t3aXNlID8gLTEgOiAxICkgKiB0aGlzLl9yYWRpdXNYICogdGhpcy5fcmFkaXVzWSAvIGRlbm9taW5hdG9yO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSB3aXRoIHVwIHRvIDIgc3ViLXNlZ21lbnRzLCBzcGxpdCBhdCB0aGUgcGFyYW1ldHJpYyB0IHZhbHVlLiBUb2dldGhlciAoaW4gb3JkZXIpIHRoZXkgc2hvdWxkIG1ha2VcclxuICAgKiB1cCB0aGUgc2FtZSBzaGFwZSBhcyB0aGUgY3VycmVudCBzZWdtZW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBtZXRob2QgaXMgcGFydCBvZiB0aGUgU2VnbWVudCBBUEkuIFNlZSBTZWdtZW50LmpzJ3MgY29uc3RydWN0b3IgZm9yIG1vcmUgQVBJIGRvY3VtZW50YXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHN1YmRpdmlkZWQoIHQ6IG51bWJlciApOiBFbGxpcHRpY2FsQXJjW10ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdCA+PSAwLCAnc3ViZGl2aWRlZCB0IHNob3VsZCBiZSBub24tbmVnYXRpdmUnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0IDw9IDEsICdzdWJkaXZpZGVkIHQgc2hvdWxkIGJlIG5vIGdyZWF0ZXIgdGhhbiAxJyApO1xyXG5cclxuICAgIC8vIElmIHQgaXMgMCBvciAxLCB3ZSBvbmx5IG5lZWQgdG8gcmV0dXJuIDEgc2VnbWVudFxyXG4gICAgaWYgKCB0ID09PSAwIHx8IHQgPT09IDEgKSB7XHJcbiAgICAgIHJldHVybiBbIHRoaXMgXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUT0RPOiB2ZXJpZnkgdGhhdCB3ZSBkb24ndCBuZWVkIHRvIHN3aXRjaCBhbnRpY2xvY2t3aXNlIGhlcmUsIG9yIHN1YnRyYWN0IDJwaSBvZmYgYW55IGFuZ2xlcyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgIGNvbnN0IGFuZ2xlMCA9IHRoaXMuYW5nbGVBdCggMCApO1xyXG4gICAgY29uc3QgYW5nbGVUID0gdGhpcy5hbmdsZUF0KCB0ICk7XHJcbiAgICBjb25zdCBhbmdsZTEgPSB0aGlzLmFuZ2xlQXQoIDEgKTtcclxuICAgIHJldHVybiBbXHJcbiAgICAgIG5ldyBFbGxpcHRpY2FsQXJjKCB0aGlzLl9jZW50ZXIsIHRoaXMuX3JhZGl1c1gsIHRoaXMuX3JhZGl1c1ksIHRoaXMuX3JvdGF0aW9uLCBhbmdsZTAsIGFuZ2xlVCwgdGhpcy5fYW50aWNsb2Nrd2lzZSApLFxyXG4gICAgICBuZXcgRWxsaXB0aWNhbEFyYyggdGhpcy5fY2VudGVyLCB0aGlzLl9yYWRpdXNYLCB0aGlzLl9yYWRpdXNZLCB0aGlzLl9yb3RhdGlvbiwgYW5nbGVULCBhbmdsZTEsIHRoaXMuX2FudGljbG9ja3dpc2UgKVxyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsZWFycyBjYWNoZWQgaW5mb3JtYXRpb24sIHNob3VsZCBiZSBjYWxsZWQgd2hlbiBhbnkgb2YgdGhlICdjb25zdHJ1Y3RvciBhcmd1bWVudHMnIGFyZSBtdXRhdGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnZhbGlkYXRlKCk6IHZvaWQge1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2NlbnRlciBpbnN0YW5jZW9mIFZlY3RvcjIsICdBcmMgY2VudGVyIHNob3VsZCBiZSBhIFZlY3RvcjInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9jZW50ZXIuaXNGaW5pdGUoKSwgJ0FyYyBjZW50ZXIgc2hvdWxkIGJlIGZpbml0ZSAobm90IE5hTiBvciBpbmZpbml0ZSknICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgdGhpcy5fcmFkaXVzWCA9PT0gJ251bWJlcicsIGBBcmMgcmFkaXVzWCBzaG91bGQgYmUgYSBudW1iZXI6ICR7dGhpcy5fcmFkaXVzWH1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggdGhpcy5fcmFkaXVzWCApLCBgQXJjIHJhZGl1c1ggc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcjogJHt0aGlzLl9yYWRpdXNYfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB0aGlzLl9yYWRpdXNZID09PSAnbnVtYmVyJywgYEFyYyByYWRpdXNZIHNob3VsZCBiZSBhIG51bWJlcjogJHt0aGlzLl9yYWRpdXNZfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB0aGlzLl9yYWRpdXNZICksIGBBcmMgcmFkaXVzWSBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3RoaXMuX3JhZGl1c1l9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIHRoaXMuX3JvdGF0aW9uID09PSAnbnVtYmVyJywgYEFyYyByb3RhdGlvbiBzaG91bGQgYmUgYSBudW1iZXI6ICR7dGhpcy5fcm90YXRpb259YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHRoaXMuX3JvdGF0aW9uICksIGBBcmMgcm90YXRpb24gc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcjogJHt0aGlzLl9yb3RhdGlvbn1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgdGhpcy5fc3RhcnRBbmdsZSA9PT0gJ251bWJlcicsIGBBcmMgc3RhcnRBbmdsZSBzaG91bGQgYmUgYSBudW1iZXI6ICR7dGhpcy5fc3RhcnRBbmdsZX1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggdGhpcy5fc3RhcnRBbmdsZSApLCBgQXJjIHN0YXJ0QW5nbGUgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcjogJHt0aGlzLl9zdGFydEFuZ2xlfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB0aGlzLl9lbmRBbmdsZSA9PT0gJ251bWJlcicsIGBBcmMgZW5kQW5nbGUgc2hvdWxkIGJlIGEgbnVtYmVyOiAke3RoaXMuX2VuZEFuZ2xlfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB0aGlzLl9lbmRBbmdsZSApLCBgQXJjIGVuZEFuZ2xlIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7dGhpcy5fZW5kQW5nbGV9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIHRoaXMuX2FudGljbG9ja3dpc2UgPT09ICdib29sZWFuJywgYEFyYyBhbnRpY2xvY2t3aXNlIHNob3VsZCBiZSBhIGJvb2xlYW46ICR7dGhpcy5fYW50aWNsb2Nrd2lzZX1gICk7XHJcblxyXG4gICAgdGhpcy5fdW5pdFRyYW5zZm9ybSA9IG51bGw7XHJcbiAgICB0aGlzLl9zdGFydCA9IG51bGw7XHJcbiAgICB0aGlzLl9lbmQgPSBudWxsO1xyXG4gICAgdGhpcy5fc3RhcnRUYW5nZW50ID0gbnVsbDtcclxuICAgIHRoaXMuX2VuZFRhbmdlbnQgPSBudWxsO1xyXG4gICAgdGhpcy5fYWN0dWFsRW5kQW5nbGUgPSBudWxsO1xyXG4gICAgdGhpcy5faXNGdWxsUGVyaW1ldGVyID0gbnVsbDtcclxuICAgIHRoaXMuX2FuZ2xlRGlmZmVyZW5jZSA9IG51bGw7XHJcbiAgICB0aGlzLl91bml0QXJjU2VnbWVudCA9IG51bGw7XHJcbiAgICB0aGlzLl9ib3VuZHMgPSBudWxsO1xyXG4gICAgdGhpcy5fc3ZnUGF0aEZyYWdtZW50ID0gbnVsbDtcclxuXHJcbiAgICAvLyByZW1hcHBpbmcgb2YgbmVnYXRpdmUgcmFkaWlcclxuICAgIGlmICggdGhpcy5fcmFkaXVzWCA8IDAgKSB7XHJcbiAgICAgIC8vIHN1cHBvcnQgdGhpcyBjYXNlIHNpbmNlIHdlIG1pZ2h0IGFjdHVhbGx5IG5lZWQgdG8gaGFuZGxlIGl0IGluc2lkZSBvZiBzdHJva2VzP1xyXG4gICAgICB0aGlzLl9yYWRpdXNYID0gLXRoaXMuX3JhZGl1c1g7XHJcbiAgICAgIHRoaXMuX3N0YXJ0QW5nbGUgPSBNYXRoLlBJIC0gdGhpcy5fc3RhcnRBbmdsZTtcclxuICAgICAgdGhpcy5fZW5kQW5nbGUgPSBNYXRoLlBJIC0gdGhpcy5fZW5kQW5nbGU7XHJcbiAgICAgIHRoaXMuX2FudGljbG9ja3dpc2UgPSAhdGhpcy5fYW50aWNsb2Nrd2lzZTtcclxuICAgIH1cclxuICAgIGlmICggdGhpcy5fcmFkaXVzWSA8IDAgKSB7XHJcbiAgICAgIC8vIHN1cHBvcnQgdGhpcyBjYXNlIHNpbmNlIHdlIG1pZ2h0IGFjdHVhbGx5IG5lZWQgdG8gaGFuZGxlIGl0IGluc2lkZSBvZiBzdHJva2VzP1xyXG4gICAgICB0aGlzLl9yYWRpdXNZID0gLXRoaXMuX3JhZGl1c1k7XHJcbiAgICAgIHRoaXMuX3N0YXJ0QW5nbGUgPSAtdGhpcy5fc3RhcnRBbmdsZTtcclxuICAgICAgdGhpcy5fZW5kQW5nbGUgPSAtdGhpcy5fZW5kQW5nbGU7XHJcbiAgICAgIHRoaXMuX2FudGljbG9ja3dpc2UgPSAhdGhpcy5fYW50aWNsb2Nrd2lzZTtcclxuICAgIH1cclxuICAgIGlmICggdGhpcy5fcmFkaXVzWCA8IHRoaXMuX3JhZGl1c1kgKSB7XHJcbiAgICAgIC8vIHN3YXAgcmFkaXVzWCBhbmQgcmFkaXVzWSBpbnRlcm5hbGx5IGZvciBjb25zaXN0ZW50IENhbnZhcyAvIFNWRyBvdXRwdXRcclxuICAgICAgdGhpcy5fcm90YXRpb24gKz0gTWF0aC5QSSAvIDI7XHJcbiAgICAgIHRoaXMuX3N0YXJ0QW5nbGUgLT0gTWF0aC5QSSAvIDI7XHJcbiAgICAgIHRoaXMuX2VuZEFuZ2xlIC09IE1hdGguUEkgLyAyO1xyXG5cclxuICAgICAgLy8gc3dhcCByYWRpdXNYIGFuZCByYWRpdXNZXHJcbiAgICAgIGNvbnN0IHRtcFIgPSB0aGlzLl9yYWRpdXNYO1xyXG4gICAgICB0aGlzLl9yYWRpdXNYID0gdGhpcy5fcmFkaXVzWTtcclxuICAgICAgdGhpcy5fcmFkaXVzWSA9IHRtcFI7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLl9yYWRpdXNYIDwgdGhpcy5fcmFkaXVzWSApIHtcclxuICAgICAgLy8gVE9ETzogY2hlY2sgdGhpcyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCAnTm90IHZlcmlmaWVkIHRvIHdvcmsgaWYgcmFkaXVzWCA8IHJhZGl1c1knICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29uc3RyYWludHMgc2hhcmVkIHdpdGggQXJjXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhKCAoICF0aGlzLl9hbnRpY2xvY2t3aXNlICYmIHRoaXMuX2VuZEFuZ2xlIC0gdGhpcy5fc3RhcnRBbmdsZSA8PSAtTWF0aC5QSSAqIDIgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKCB0aGlzLl9hbnRpY2xvY2t3aXNlICYmIHRoaXMuX3N0YXJ0QW5nbGUgLSB0aGlzLl9lbmRBbmdsZSA8PSAtTWF0aC5QSSAqIDIgKSApLFxyXG4gICAgICAnTm90IGhhbmRsaW5nIGVsbGlwdGljYWwgYXJjcyB3aXRoIHN0YXJ0L2VuZCBhbmdsZXMgdGhhdCBzaG93IGRpZmZlcmVuY2VzIGluLWJldHdlZW4gYnJvd3NlciBoYW5kbGluZycgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICEoICggIXRoaXMuX2FudGljbG9ja3dpc2UgJiYgdGhpcy5fZW5kQW5nbGUgLSB0aGlzLl9zdGFydEFuZ2xlID4gTWF0aC5QSSAqIDIgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKCB0aGlzLl9hbnRpY2xvY2t3aXNlICYmIHRoaXMuX3N0YXJ0QW5nbGUgLSB0aGlzLl9lbmRBbmdsZSA+IE1hdGguUEkgKiAyICkgKSxcclxuICAgICAgJ05vdCBoYW5kbGluZyBlbGxpcHRpY2FsIGFyY3Mgd2l0aCBzdGFydC9lbmQgYW5nbGVzIHRoYXQgc2hvdyBkaWZmZXJlbmNlcyBpbi1iZXR3ZWVuIGJyb3dzZXIgaGFuZGxpbmcnICk7XHJcblxyXG4gICAgdGhpcy5pbnZhbGlkYXRpb25FbWl0dGVyLmVtaXQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXB1dGVzIGEgdHJhbnNmb3JtIHRoYXQgbWFwcyBhIHVuaXQgY2lyY2xlIGludG8gdGhpcyBlbGxpcHNlJ3MgbG9jYXRpb24uXHJcbiAgICpcclxuICAgKiBIZWxwZnVsLCBzaW5jZSB3ZSBjYW4gZ2V0IHRoZSBwYXJhbWV0cmljIHBvc2l0aW9uIG9mIG91ciB1bml0IGNpcmNsZSAoYXQgdCksIGFuZCB0aGVuIHRyYW5zZm9ybSBpdCB3aXRoIHRoaXNcclxuICAgKiB0cmFuc2Zvcm0gdG8gZ2V0IHRoZSBlbGxpcHNlJ3MgcGFyYW1ldHJpYyBwb3NpdGlvbiAoYXQgdCkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFVuaXRUcmFuc2Zvcm0oKTogVHJhbnNmb3JtMyB7XHJcbiAgICBpZiAoIHRoaXMuX3VuaXRUcmFuc2Zvcm0gPT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMuX3VuaXRUcmFuc2Zvcm0gPSBFbGxpcHRpY2FsQXJjLmNvbXB1dGVVbml0VHJhbnNmb3JtKCB0aGlzLl9jZW50ZXIsIHRoaXMuX3JhZGl1c1gsIHRoaXMuX3JhZGl1c1ksIHRoaXMuX3JvdGF0aW9uICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fdW5pdFRyYW5zZm9ybTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgdW5pdFRyYW5zZm9ybSgpOiBUcmFuc2Zvcm0zIHsgcmV0dXJuIHRoaXMuZ2V0VW5pdFRyYW5zZm9ybSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIHN0YXJ0IHBvaW50IG9mIHRoaXMgZWxsaXB0aWNhbEFyY1xyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTdGFydCgpOiBWZWN0b3IyIHtcclxuICAgIGlmICggdGhpcy5fc3RhcnQgPT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMuX3N0YXJ0ID0gdGhpcy5wb3NpdGlvbkF0QW5nbGUoIHRoaXMuX3N0YXJ0QW5nbGUgKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9zdGFydDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc3RhcnQoKTogVmVjdG9yMiB7IHJldHVybiB0aGlzLmdldFN0YXJ0KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgZW5kIHBvaW50IG9mIHRoaXMgZWxsaXB0aWNhbEFyY1xyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFbmQoKTogVmVjdG9yMiB7XHJcbiAgICBpZiAoIHRoaXMuX2VuZCA9PT0gbnVsbCApIHtcclxuICAgICAgdGhpcy5fZW5kID0gdGhpcy5wb3NpdGlvbkF0QW5nbGUoIHRoaXMuX2VuZEFuZ2xlICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fZW5kO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBlbmQoKTogVmVjdG9yMiB7IHJldHVybiB0aGlzLmdldEVuZCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIHRhbmdlbnQgdmVjdG9yIChub3JtYWxpemVkKSB0byB0aGlzIGVsbGlwdGljYWxBcmMgYXQgdGhlIHN0YXJ0LCBwb2ludGluZyBpbiB0aGUgZGlyZWN0aW9uIG9mIG1vdGlvbiAoZnJvbSBzdGFydCB0byBlbmQpXHJcbiAgICovXHJcbiAgcHVibGljIGdldFN0YXJ0VGFuZ2VudCgpOiBWZWN0b3IyIHtcclxuICAgIGlmICggdGhpcy5fc3RhcnRUYW5nZW50ID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLl9zdGFydFRhbmdlbnQgPSB0aGlzLnRhbmdlbnRBdEFuZ2xlKCB0aGlzLl9zdGFydEFuZ2xlICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fc3RhcnRUYW5nZW50O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBzdGFydFRhbmdlbnQoKTogVmVjdG9yMiB7IHJldHVybiB0aGlzLmdldFN0YXJ0VGFuZ2VudCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIHRhbmdlbnQgdmVjdG9yIChub3JtYWxpemVkKSB0byB0aGlzIGVsbGlwdGljYWxBcmMgYXQgdGhlIGVuZCBwb2ludCwgcG9pbnRpbmcgaW4gdGhlIGRpcmVjdGlvbiBvZiBtb3Rpb24gKGZyb20gc3RhcnQgdG8gZW5kKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFbmRUYW5nZW50KCk6IFZlY3RvcjIge1xyXG4gICAgaWYgKCB0aGlzLl9lbmRUYW5nZW50ID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLl9lbmRUYW5nZW50ID0gdGhpcy50YW5nZW50QXRBbmdsZSggdGhpcy5fZW5kQW5nbGUgKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9lbmRUYW5nZW50O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBlbmRUYW5nZW50KCk6IFZlY3RvcjIgeyByZXR1cm4gdGhpcy5nZXRFbmRUYW5nZW50KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgZW5kIGFuZ2xlIGluIHJhZGlhbnNcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0QWN0dWFsRW5kQW5nbGUoKTogbnVtYmVyIHtcclxuICAgIGlmICggdGhpcy5fYWN0dWFsRW5kQW5nbGUgPT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMuX2FjdHVhbEVuZEFuZ2xlID0gQXJjLmNvbXB1dGVBY3R1YWxFbmRBbmdsZSggdGhpcy5fc3RhcnRBbmdsZSwgdGhpcy5fZW5kQW5nbGUsIHRoaXMuX2FudGljbG9ja3dpc2UgKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9hY3R1YWxFbmRBbmdsZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgYWN0dWFsRW5kQW5nbGUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0QWN0dWFsRW5kQW5nbGUoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYm9vbGVhbiB2YWx1ZSB0aGF0IGluZGljYXRlcyBpZiB0aGUgYXJjIHdyYXBzIHVwIGJ5IG1vcmUgdGhhbiB0d28gUGlcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0SXNGdWxsUGVyaW1ldGVyKCk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCB0aGlzLl9pc0Z1bGxQZXJpbWV0ZXIgPT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMuX2lzRnVsbFBlcmltZXRlciA9ICggIXRoaXMuX2FudGljbG9ja3dpc2UgJiYgdGhpcy5fZW5kQW5nbGUgLSB0aGlzLl9zdGFydEFuZ2xlID49IE1hdGguUEkgKiAyICkgfHwgKCB0aGlzLl9hbnRpY2xvY2t3aXNlICYmIHRoaXMuX3N0YXJ0QW5nbGUgLSB0aGlzLl9lbmRBbmdsZSA+PSBNYXRoLlBJICogMiApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX2lzRnVsbFBlcmltZXRlcjtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgaXNGdWxsUGVyaW1ldGVyKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5nZXRJc0Z1bGxQZXJpbWV0ZXIoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFuZ2xlIGRpZmZlcmVuY2UgdGhhdCByZXByZXNlbnRzIGhvdyBcIm11Y2hcIiBvZiB0aGUgY2lyY2xlIG91ciBhcmMgY292ZXJzXHJcbiAgICpcclxuICAgKiBUaGUgYW5zd2VyIGlzIGFsd2F5cyBncmVhdGVyIG9yIGVxdWFsIHRvIHplcm9cclxuICAgKiBUaGUgYW5zd2VyIGNhbiBleGNlZWQgdHdvIFBpXHJcbiAgICovXHJcbiAgcHVibGljIGdldEFuZ2xlRGlmZmVyZW5jZSgpOiBudW1iZXIge1xyXG4gICAgaWYgKCB0aGlzLl9hbmdsZURpZmZlcmVuY2UgPT09IG51bGwgKSB7XHJcbiAgICAgIC8vIGNvbXB1dGUgYW4gYW5nbGUgZGlmZmVyZW5jZSB0aGF0IHJlcHJlc2VudHMgaG93IFwibXVjaFwiIG9mIHRoZSBjaXJjbGUgb3VyIGFyYyBjb3ZlcnNcclxuICAgICAgdGhpcy5fYW5nbGVEaWZmZXJlbmNlID0gdGhpcy5fYW50aWNsb2Nrd2lzZSA/IHRoaXMuX3N0YXJ0QW5nbGUgLSB0aGlzLl9lbmRBbmdsZSA6IHRoaXMuX2VuZEFuZ2xlIC0gdGhpcy5fc3RhcnRBbmdsZTtcclxuICAgICAgaWYgKCB0aGlzLl9hbmdsZURpZmZlcmVuY2UgPCAwICkge1xyXG4gICAgICAgIHRoaXMuX2FuZ2xlRGlmZmVyZW5jZSArPSBNYXRoLlBJICogMjtcclxuICAgICAgfVxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9hbmdsZURpZmZlcmVuY2UgPj0gMCApOyAvLyBub3cgaXQgc2hvdWxkIGFsd2F5cyBiZSB6ZXJvIG9yIHBvc2l0aXZlXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fYW5nbGVEaWZmZXJlbmNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBhbmdsZURpZmZlcmVuY2UoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0QW5nbGVEaWZmZXJlbmNlKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSB1bml0IGFyZyBzZWdtZW50IHRoYXQgd2UgY2FuIG1hcCB0byBvdXIgZWxsaXBzZS4gdXNlZnVsIGZvciBoaXQgdGVzdGluZyBhbmQgc3VjaC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VW5pdEFyY1NlZ21lbnQoKTogQXJjIHtcclxuICAgIGlmICggdGhpcy5fdW5pdEFyY1NlZ21lbnQgPT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMuX3VuaXRBcmNTZWdtZW50ID0gbmV3IEFyYyggVmVjdG9yMi5aRVJPLCAxLCB0aGlzLl9zdGFydEFuZ2xlLCB0aGlzLl9lbmRBbmdsZSwgdGhpcy5fYW50aWNsb2Nrd2lzZSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX3VuaXRBcmNTZWdtZW50O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB1bml0QXJjU2VnbWVudCgpOiBBcmMgeyByZXR1cm4gdGhpcy5nZXRVbml0QXJjU2VnbWVudCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGJvdW5kcyBvZiB0aGlzIHNlZ21lbnQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIGlmICggdGhpcy5fYm91bmRzID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLl9ib3VuZHMgPSBCb3VuZHMyLk5PVEhJTkcud2l0aFBvaW50KCB0aGlzLmdldFN0YXJ0KCkgKVxyXG4gICAgICAgIC53aXRoUG9pbnQoIHRoaXMuZ2V0RW5kKCkgKTtcclxuXHJcbiAgICAgIC8vIGlmIHRoZSBhbmdsZXMgYXJlIGRpZmZlcmVudCwgY2hlY2sgZXh0cmVtYSBwb2ludHNcclxuICAgICAgaWYgKCB0aGlzLl9zdGFydEFuZ2xlICE9PSB0aGlzLl9lbmRBbmdsZSApIHtcclxuICAgICAgICAvLyBzb2x2ZSB0aGUgbWFwcGluZyBmcm9tIHRoZSB1bml0IGNpcmNsZSwgZmluZCBsb2NhdGlvbnMgd2hlcmUgYSBjb29yZGluYXRlIG9mIHRoZSBncmFkaWVudCBpcyB6ZXJvLlxyXG4gICAgICAgIC8vIHdlIGZpbmQgb25lIGV4dHJlbWEgcG9pbnQgZm9yIGJvdGggeCBhbmQgeSwgc2luY2UgdGhlIG90aGVyIHR3byBhcmUganVzdCByb3RhdGVkIGJ5IHBpIGZyb20gdGhlbS5cclxuICAgICAgICBjb25zdCB4QW5nbGUgPSBNYXRoLmF0YW4oIC0oIHRoaXMuX3JhZGl1c1kgLyB0aGlzLl9yYWRpdXNYICkgKiBNYXRoLnRhbiggdGhpcy5fcm90YXRpb24gKSApO1xyXG4gICAgICAgIGNvbnN0IHlBbmdsZSA9IE1hdGguYXRhbiggKCB0aGlzLl9yYWRpdXNZIC8gdGhpcy5fcmFkaXVzWCApIC8gTWF0aC50YW4oIHRoaXMuX3JvdGF0aW9uICkgKTtcclxuXHJcbiAgICAgICAgLy8gY2hlY2sgYWxsIG9mIHRoZSBleHRyZW1hIHBvaW50c1xyXG4gICAgICAgIHRoaXMucG9zc2libGVFeHRyZW1hQW5nbGVzID0gW1xyXG4gICAgICAgICAgeEFuZ2xlLFxyXG4gICAgICAgICAgeEFuZ2xlICsgTWF0aC5QSSxcclxuICAgICAgICAgIHlBbmdsZSxcclxuICAgICAgICAgIHlBbmdsZSArIE1hdGguUElcclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICBfLmVhY2goIHRoaXMucG9zc2libGVFeHRyZW1hQW5nbGVzLCB0aGlzLmluY2x1ZGVCb3VuZHNBdEFuZ2xlLmJpbmQoIHRoaXMgKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fYm91bmRzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBib3VuZHMoKTogQm91bmRzMiB7IHJldHVybiB0aGlzLmdldEJvdW5kcygpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBsaXN0IG9mIG5vbi1kZWdlbmVyYXRlIHNlZ21lbnRzIHRoYXQgYXJlIGVxdWl2YWxlbnQgdG8gdGhpcyBzZWdtZW50LiBHZW5lcmFsbHkgZ2V0cyByaWQgKG9yIHNpbXBsaWZpZXMpXHJcbiAgICogaW52YWxpZCBvciByZXBlYXRlZCBzZWdtZW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Tm9uZGVnZW5lcmF0ZVNlZ21lbnRzKCk6IFNlZ21lbnRbXSB7XHJcbiAgICBpZiAoIHRoaXMuX3JhZGl1c1ggPD0gMCB8fCB0aGlzLl9yYWRpdXNZIDw9IDAgfHwgdGhpcy5fc3RhcnRBbmdsZSA9PT0gdGhpcy5fZW5kQW5nbGUgKSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLl9yYWRpdXNYID09PSB0aGlzLl9yYWRpdXNZICkge1xyXG4gICAgICAvLyByZWR1Y2UgdG8gYW4gQXJjXHJcbiAgICAgIGNvbnN0IHN0YXJ0QW5nbGUgPSB0aGlzLl9zdGFydEFuZ2xlICsgdGhpcy5fcm90YXRpb247XHJcbiAgICAgIGxldCBlbmRBbmdsZSA9IHRoaXMuX2VuZEFuZ2xlICsgdGhpcy5fcm90YXRpb247XHJcblxyXG4gICAgICAvLyBwcmVzZXJ2ZSBmdWxsIGNpcmNsZXNcclxuICAgICAgaWYgKCBNYXRoLmFicyggdGhpcy5fZW5kQW5nbGUgLSB0aGlzLl9zdGFydEFuZ2xlICkgPT09IE1hdGguUEkgKiAyICkge1xyXG4gICAgICAgIGVuZEFuZ2xlID0gdGhpcy5fYW50aWNsb2Nrd2lzZSA/IHN0YXJ0QW5nbGUgLSBNYXRoLlBJICogMiA6IHN0YXJ0QW5nbGUgKyBNYXRoLlBJICogMjtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gWyBuZXcgQXJjKCB0aGlzLl9jZW50ZXIsIHRoaXMuX3JhZGl1c1gsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlLCB0aGlzLl9hbnRpY2xvY2t3aXNlICkgXTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gWyB0aGlzIF07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBdHRlbXB0cyB0byBleHBhbmQgdGhlIHByaXZhdGUgX2JvdW5kcyBib3VuZGluZyBib3ggdG8gaW5jbHVkZSBhIHBvaW50IGF0IGEgc3BlY2lmaWMgYW5nbGUsIG1ha2luZyBzdXJlIHRoYXRcclxuICAgKiBhbmdsZSBpcyBhY3R1YWxseSBpbmNsdWRlZCBpbiB0aGUgYXJjLiBUaGlzIHdpbGwgcHJlc3VtYWJseSBiZSBjYWxsZWQgYXQgYW5nbGVzIHRoYXQgYXJlIGF0IGNyaXRpY2FsIHBvaW50cyxcclxuICAgKiB3aGVyZSB0aGUgYXJjIHNob3VsZCBoYXZlIG1heGltdW0vbWluaW11bSB4L3kgdmFsdWVzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgaW5jbHVkZUJvdW5kc0F0QW5nbGUoIGFuZ2xlOiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICBpZiAoIHRoaXMudW5pdEFyY1NlZ21lbnQuY29udGFpbnNBbmdsZSggYW5nbGUgKSApIHtcclxuICAgICAgLy8gdGhlIGJvdW5kYXJ5IHBvaW50IGlzIGluIHRoZSBhcmNcclxuICAgICAgdGhpcy5fYm91bmRzID0gdGhpcy5fYm91bmRzIS53aXRoUG9pbnQoIHRoaXMucG9zaXRpb25BdEFuZ2xlKCBhbmdsZSApICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYXBzIGEgY29udGFpbmVkIGFuZ2xlIHRvIGJldHdlZW4gW3N0YXJ0QW5nbGUsYWN0dWFsRW5kQW5nbGUpLCBldmVuIGlmIHRoZSBlbmQgYW5nbGUgaXMgbG93ZXIuXHJcbiAgICpcclxuICAgKiBUT0RPOiByZW1vdmUgZHVwbGljYXRpb24gd2l0aCBBcmMgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICovXHJcbiAgcHVibGljIG1hcEFuZ2xlKCBhbmdsZTogbnVtYmVyICk6IG51bWJlciB7XHJcbiAgICBpZiAoIE1hdGguYWJzKCBVdGlscy5tb2R1bG9CZXR3ZWVuRG93biggYW5nbGUgLSB0aGlzLl9zdGFydEFuZ2xlLCAtTWF0aC5QSSwgTWF0aC5QSSApICkgPCAxZS04ICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fc3RhcnRBbmdsZTtcclxuICAgIH1cclxuICAgIGlmICggTWF0aC5hYnMoIFV0aWxzLm1vZHVsb0JldHdlZW5Eb3duKCBhbmdsZSAtIHRoaXMuZ2V0QWN0dWFsRW5kQW5nbGUoKSwgLU1hdGguUEksIE1hdGguUEkgKSApIDwgMWUtOCApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZ2V0QWN0dWFsRW5kQW5nbGUoKTtcclxuICAgIH1cclxuICAgIC8vIGNvbnNpZGVyIGFuIGFzc2VydCB0aGF0IHdlIGNvbnRhaW4gdGhhdCBhbmdsZT9cclxuICAgIHJldHVybiAoIHRoaXMuX3N0YXJ0QW5nbGUgPiB0aGlzLmdldEFjdHVhbEVuZEFuZ2xlKCkgKSA/XHJcbiAgICAgICAgICAgVXRpbHMubW9kdWxvQmV0d2VlblVwKCBhbmdsZSwgdGhpcy5fc3RhcnRBbmdsZSAtIDIgKiBNYXRoLlBJLCB0aGlzLl9zdGFydEFuZ2xlICkgOlxyXG4gICAgICAgICAgIFV0aWxzLm1vZHVsb0JldHdlZW5Eb3duKCBhbmdsZSwgdGhpcy5fc3RhcnRBbmdsZSwgdGhpcy5fc3RhcnRBbmdsZSArIDIgKiBNYXRoLlBJICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBwYXJhbWV0cml6ZWQgdmFsdWUgdCBmb3IgYSBnaXZlbiBhbmdsZS4gVGhlIHZhbHVlIHQgc2hvdWxkIHJhbmdlIGZyb20gMCB0byAxIChpbmNsdXNpdmUpLlxyXG4gICAqXHJcbiAgICogVE9ETzogcmVtb3ZlIGR1cGxpY2F0aW9uIHdpdGggQXJjIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0QXRBbmdsZSggYW5nbGU6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgcmV0dXJuICggdGhpcy5tYXBBbmdsZSggYW5nbGUgKSAtIHRoaXMuX3N0YXJ0QW5nbGUgKSAvICggdGhpcy5nZXRBY3R1YWxFbmRBbmdsZSgpIC0gdGhpcy5fc3RhcnRBbmdsZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYW5nbGUgZm9yIHRoZSBwYXJhbWV0cml6ZWQgdCB2YWx1ZS4gVGhlIHQgdmFsdWUgc2hvdWxkIHJhbmdlIGZyb20gMCB0byAxIChpbmNsdXNpdmUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhbmdsZUF0KCB0OiBudW1iZXIgKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9zdGFydEFuZ2xlICsgKCB0aGlzLmdldEFjdHVhbEVuZEFuZ2xlKCkgLSB0aGlzLl9zdGFydEFuZ2xlICkgKiB0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcG9zaXRpb24gb2YgdGhpcyBhcmMgYXQgYW5nbGUuXHJcbiAgICovXHJcbiAgcHVibGljIHBvc2l0aW9uQXRBbmdsZSggYW5nbGU6IG51bWJlciApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFVuaXRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1Qb3NpdGlvbjIoIFZlY3RvcjIuY3JlYXRlUG9sYXIoIDEsIGFuZ2xlICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG5vcm1hbGl6ZWQgdGFuZ2VudCBvZiB0aGlzIGFyYy5cclxuICAgKiBUaGUgdGFuZ2VudCBwb2ludHMgb3V0d2FyZCAoaW53YXJkKSBvZiB0aGlzIGFyYyBmb3IgY2xvY2t3aXNlIChhbnRpY2xvY2t3aXNlKSBkaXJlY3Rpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHRhbmdlbnRBdEFuZ2xlKCBhbmdsZTogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgY29uc3Qgbm9ybWFsID0gdGhpcy5nZXRVbml0VHJhbnNmb3JtKCkudHJhbnNmb3JtTm9ybWFsMiggVmVjdG9yMi5jcmVhdGVQb2xhciggMSwgYW5nbGUgKSApO1xyXG5cclxuICAgIHJldHVybiB0aGlzLl9hbnRpY2xvY2t3aXNlID8gbm9ybWFsLnBlcnBlbmRpY3VsYXIgOiBub3JtYWwucGVycGVuZGljdWxhci5uZWdhdGVkKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHN0cmFpZ2h0IGxpbmVzIHRoYXQgd2lsbCBkcmF3IGFuIG9mZnNldCBvbiB0aGUgbG9naWNhbCBsZWZ0IChyaWdodCkgc2lkZSBmb3IgcmV2ZXJzZSBmYWxzZSAodHJ1ZSlcclxuICAgKiBJdCBkaXNjcmV0aXplcyB0aGUgZWxsaXB0aWNhbCBhcmMgaW4gMzIgc2VnbWVudHMgYW5kIHJldHVybnMgYW4gb2Zmc2V0IGN1cnZlIGFzIGEgbGlzdCBvZiBsaW5lVG9zL1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHIgLSBkaXN0YW5jZVxyXG4gICAqIEBwYXJhbSByZXZlcnNlXHJcbiAgICovXHJcbiAgcHVibGljIG9mZnNldFRvKCByOiBudW1iZXIsIHJldmVyc2U6IGJvb2xlYW4gKTogTGluZVtdIHtcclxuICAgIC8vIGhvdyBtYW55IHNlZ21lbnRzIHRvIGNyZWF0ZSAocG9zc2libHkgbWFrZSB0aGlzIG1vcmUgYWRhcHRpdmU/KVxyXG4gICAgY29uc3QgcXVhbnRpdHkgPSAzMjtcclxuXHJcbiAgICBjb25zdCBwb2ludHMgPSBbXTtcclxuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgcXVhbnRpdHk7IGkrKyApIHtcclxuICAgICAgbGV0IHJhdGlvID0gaSAvICggcXVhbnRpdHkgLSAxICk7XHJcbiAgICAgIGlmICggcmV2ZXJzZSApIHtcclxuICAgICAgICByYXRpbyA9IDEgLSByYXRpbztcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBhbmdsZSA9IHRoaXMuYW5nbGVBdCggcmF0aW8gKTtcclxuXHJcbiAgICAgIHBvaW50cy5wdXNoKCB0aGlzLnBvc2l0aW9uQXRBbmdsZSggYW5nbGUgKS5wbHVzKCB0aGlzLnRhbmdlbnRBdEFuZ2xlKCBhbmdsZSApLnBlcnBlbmRpY3VsYXIubm9ybWFsaXplZCgpLnRpbWVzKCByICkgKSApO1xyXG4gICAgICBpZiAoIGkgPiAwICkge1xyXG4gICAgICAgIHJlc3VsdC5wdXNoKCBuZXcgTGluZSggcG9pbnRzWyBpIC0gMSBdLCBwb2ludHNbIGkgXSApICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHN0cmluZyBjb250YWluaW5nIHRoZSBTVkcgcGF0aC4gYXNzdW1lcyB0aGF0IHRoZSBzdGFydCBwb2ludCBpcyBhbHJlYWR5IHByb3ZpZGVkLFxyXG4gICAqIHNvIGFueXRoaW5nIHRoYXQgY2FsbHMgdGhpcyBuZWVkcyB0byBwdXQgdGhlIE0gY2FsbHMgZmlyc3QuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFNWR1BhdGhGcmFnbWVudCgpOiBzdHJpbmcge1xyXG4gICAgbGV0IG9sZFBhdGhGcmFnbWVudDtcclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICBvbGRQYXRoRnJhZ21lbnQgPSB0aGlzLl9zdmdQYXRoRnJhZ21lbnQ7XHJcbiAgICAgIHRoaXMuX3N2Z1BhdGhGcmFnbWVudCA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBpZiAoICF0aGlzLl9zdmdQYXRoRnJhZ21lbnQgKSB7XHJcbiAgICAgIC8vIHNlZSBodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcvcGF0aHMuaHRtbCNQYXRoRGF0YUVsbGlwdGljYWxBcmNDb21tYW5kcyBmb3IgbW9yZSBpbmZvXHJcbiAgICAgIC8vIHJ4IHJ5IHgtYXhpcy1yb3RhdGlvbiBsYXJnZS1hcmMtZmxhZyBzd2VlcC1mbGFnIHggeVxyXG4gICAgICBjb25zdCBlcHNpbG9uID0gMC4wMTsgLy8gYWxsb3cgc29tZSBsZWV3YXkgdG8gcmVuZGVyIHRoaW5ncyBhcyAnYWxtb3N0IGNpcmNsZXMnXHJcbiAgICAgIGNvbnN0IHN3ZWVwRmxhZyA9IHRoaXMuX2FudGljbG9ja3dpc2UgPyAnMCcgOiAnMSc7XHJcbiAgICAgIGxldCBsYXJnZUFyY0ZsYWc7XHJcbiAgICAgIGNvbnN0IGRlZ3JlZXNSb3RhdGlvbiA9IHRvRGVncmVlcyggdGhpcy5fcm90YXRpb24gKTsgLy8gYmxlaCwgZGVncmVlcz9cclxuICAgICAgaWYgKCB0aGlzLmdldEFuZ2xlRGlmZmVyZW5jZSgpIDwgTWF0aC5QSSAqIDIgLSBlcHNpbG9uICkge1xyXG4gICAgICAgIGxhcmdlQXJjRmxhZyA9IHRoaXMuZ2V0QW5nbGVEaWZmZXJlbmNlKCkgPCBNYXRoLlBJID8gJzAnIDogJzEnO1xyXG4gICAgICAgIHRoaXMuX3N2Z1BhdGhGcmFnbWVudCA9IGBBICR7c3ZnTnVtYmVyKCB0aGlzLl9yYWRpdXNYICl9ICR7c3ZnTnVtYmVyKCB0aGlzLl9yYWRpdXNZICl9ICR7ZGVncmVlc1JvdGF0aW9uXHJcbiAgICAgICAgfSAke2xhcmdlQXJjRmxhZ30gJHtzd2VlcEZsYWd9ICR7c3ZnTnVtYmVyKCB0aGlzLmdldEVuZCgpLnggKX0gJHtzdmdOdW1iZXIoIHRoaXMuZ2V0RW5kKCkueSApfWA7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gZWxsaXBzZSAob3IgYWxtb3N0LWVsbGlwc2UpIGNhc2UgbmVlZHMgdG8gYmUgaGFuZGxlZCBkaWZmZXJlbnRseVxyXG4gICAgICAgIC8vIHNpbmNlIFNWRyB3aWxsIG5vdCBiZSBhYmxlIHRvIGRyYXcgKG9yIGtub3cgaG93IHRvIGRyYXcpIHRoZSBjb3JyZWN0IGNpcmNsZSBpZiB3ZSBqdXN0IGhhdmUgYSBzdGFydCBhbmQgZW5kLCB3ZSBuZWVkIHRvIHNwbGl0IGl0IGludG8gdHdvIGNpcmN1bGFyIGFyY3NcclxuXHJcbiAgICAgICAgLy8gZ2V0IHRoZSBhbmdsZSB0aGF0IGlzIGJldHdlZW4gYW5kIG9wcG9zaXRlIG9mIGJvdGggb2YgdGhlIHBvaW50c1xyXG4gICAgICAgIGNvbnN0IHNwbGl0T3Bwb3NpdGVBbmdsZSA9ICggdGhpcy5fc3RhcnRBbmdsZSArIHRoaXMuX2VuZEFuZ2xlICkgLyAyOyAvLyB0aGlzIF9zaG91bGRfIHdvcmsgZm9yIHRoZSBtb2R1bGFyIGNhc2U/XHJcbiAgICAgICAgY29uc3Qgc3BsaXRQb2ludCA9IHRoaXMucG9zaXRpb25BdEFuZ2xlKCBzcGxpdE9wcG9zaXRlQW5nbGUgKTtcclxuXHJcbiAgICAgICAgbGFyZ2VBcmNGbGFnID0gJzAnOyAvLyBzaW5jZSB3ZSBzcGxpdCBpdCBpbiAyLCBpdCdzIGFsd2F5cyB0aGUgc21hbGwgYXJjXHJcblxyXG4gICAgICAgIGNvbnN0IGZpcnN0QXJjID0gYEEgJHtzdmdOdW1iZXIoIHRoaXMuX3JhZGl1c1ggKX0gJHtzdmdOdW1iZXIoIHRoaXMuX3JhZGl1c1kgKX0gJHtcclxuICAgICAgICAgIGRlZ3JlZXNSb3RhdGlvbn0gJHtsYXJnZUFyY0ZsYWd9ICR7c3dlZXBGbGFnfSAke1xyXG4gICAgICAgICAgc3ZnTnVtYmVyKCBzcGxpdFBvaW50LnggKX0gJHtzdmdOdW1iZXIoIHNwbGl0UG9pbnQueSApfWA7XHJcbiAgICAgICAgY29uc3Qgc2Vjb25kQXJjID0gYEEgJHtzdmdOdW1iZXIoIHRoaXMuX3JhZGl1c1ggKX0gJHtzdmdOdW1iZXIoIHRoaXMuX3JhZGl1c1kgKX0gJHtcclxuICAgICAgICAgIGRlZ3JlZXNSb3RhdGlvbn0gJHtsYXJnZUFyY0ZsYWd9ICR7c3dlZXBGbGFnfSAke1xyXG4gICAgICAgICAgc3ZnTnVtYmVyKCB0aGlzLmdldEVuZCgpLnggKX0gJHtzdmdOdW1iZXIoIHRoaXMuZ2V0RW5kKCkueSApfWA7XHJcblxyXG4gICAgICAgIHRoaXMuX3N2Z1BhdGhGcmFnbWVudCA9IGAke2ZpcnN0QXJjfSAke3NlY29uZEFyY31gO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgaWYgKCBvbGRQYXRoRnJhZ21lbnQgKSB7XHJcbiAgICAgICAgYXNzZXJ0KCBvbGRQYXRoRnJhZ21lbnQgPT09IHRoaXMuX3N2Z1BhdGhGcmFnbWVudCwgJ1F1YWRyYXRpYyBsaW5lIHNlZ21lbnQgY2hhbmdlZCB3aXRob3V0IGludmFsaWRhdGUoKScgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX3N2Z1BhdGhGcmFnbWVudDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2Ygc3RyYWlnaHQgbGluZXMgIHRoYXQgd2lsbCBkcmF3IGFuIG9mZnNldCBvbiB0aGUgbG9naWNhbCBsZWZ0IHNpZGUuXHJcbiAgICovXHJcbiAgcHVibGljIHN0cm9rZUxlZnQoIGxpbmVXaWR0aDogbnVtYmVyICk6IExpbmVbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5vZmZzZXRUbyggLWxpbmVXaWR0aCAvIDIsIGZhbHNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHN0cmFpZ2h0IGxpbmVzIHRoYXQgd2lsbCBkcmF3IGFuIG9mZnNldCBjdXJ2ZSBvbiB0aGUgbG9naWNhbCByaWdodCBzaWRlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdHJva2VSaWdodCggbGluZVdpZHRoOiBudW1iZXIgKTogTGluZVtdIHtcclxuICAgIHJldHVybiB0aGlzLm9mZnNldFRvKCBsaW5lV2lkdGggLyAyLCB0cnVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbGlzdCBvZiB0IHZhbHVlcyB3aGVyZSBkeC9kdCBvciBkeS9kdCBpcyAwIHdoZXJlIDAgPCB0IDwgMS4gc3ViZGl2aWRpbmcgb24gdGhlc2Ugd2lsbCByZXN1bHQgaW4gbW9ub3RvbmljIHNlZ21lbnRzXHJcbiAgICogRG9lcyBub3QgaW5jbHVkZSB0PTAgYW5kIHQ9MS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0SW50ZXJpb3JFeHRyZW1hVHMoKTogbnVtYmVyW10ge1xyXG4gICAgY29uc3QgcmVzdWx0OiBudW1iZXJbXSA9IFtdO1xyXG4gICAgXy5lYWNoKCB0aGlzLnBvc3NpYmxlRXh0cmVtYUFuZ2xlcywgKCBhbmdsZTogbnVtYmVyICkgPT4ge1xyXG4gICAgICBpZiAoIHRoaXMudW5pdEFyY1NlZ21lbnQuY29udGFpbnNBbmdsZSggYW5nbGUgKSApIHtcclxuICAgICAgICBjb25zdCB0ID0gdGhpcy50QXRBbmdsZSggYW5nbGUgKTtcclxuICAgICAgICBjb25zdCBlcHNpbG9uID0gMC4wMDAwMDAwMDAxOyAvLyBUT0RPOiBnZW5lcmFsIGtpdGUgZXBzaWxvbj8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICAgICAgaWYgKCB0ID4gZXBzaWxvbiAmJiB0IDwgMSAtIGVwc2lsb24gKSB7XHJcbiAgICAgICAgICByZXN1bHQucHVzaCggdCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgcmV0dXJuIHJlc3VsdC5zb3J0KCk7IC8vIG1vZGlmaWVzIG9yaWdpbmFsLCB3aGljaCBpcyBPS1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGl0LXRlc3RzIHRoaXMgc2VnbWVudCB3aXRoIHRoZSByYXkuIEFuIGFycmF5IG9mIGFsbCBpbnRlcnNlY3Rpb25zIG9mIHRoZSByYXkgd2l0aCB0aGlzIHNlZ21lbnQgd2lsbCBiZSByZXR1cm5lZC5cclxuICAgKiBGb3IgZGV0YWlscywgc2VlIHRoZSBkb2N1bWVudGF0aW9uIGluIFNlZ21lbnQuanNcclxuICAgKi9cclxuICBwdWJsaWMgaW50ZXJzZWN0aW9uKCByYXk6IFJheTIgKTogUmF5SW50ZXJzZWN0aW9uW10ge1xyXG4gICAgLy8gYmUgbGF6eS4gdHJhbnNmb3JtIGl0IGludG8gdGhlIHNwYWNlIG9mIGEgbm9uLWVsbGlwdGljYWwgYXJjLlxyXG4gICAgY29uc3QgdW5pdFRyYW5zZm9ybSA9IHRoaXMuZ2V0VW5pdFRyYW5zZm9ybSgpO1xyXG4gICAgY29uc3QgcmF5SW5Vbml0Q2lyY2xlU3BhY2UgPSB1bml0VHJhbnNmb3JtLmludmVyc2VSYXkyKCByYXkgKTtcclxuICAgIGNvbnN0IGhpdHMgPSB0aGlzLmdldFVuaXRBcmNTZWdtZW50KCkuaW50ZXJzZWN0aW9uKCByYXlJblVuaXRDaXJjbGVTcGFjZSApO1xyXG5cclxuICAgIHJldHVybiBfLm1hcCggaGl0cywgaGl0ID0+IHtcclxuICAgICAgY29uc3QgdHJhbnNmb3JtZWRQb2ludCA9IHVuaXRUcmFuc2Zvcm0udHJhbnNmb3JtUG9zaXRpb24yKCBoaXQucG9pbnQgKTtcclxuICAgICAgY29uc3QgZGlzdGFuY2UgPSByYXkucG9zaXRpb24uZGlzdGFuY2UoIHRyYW5zZm9ybWVkUG9pbnQgKTtcclxuICAgICAgY29uc3Qgbm9ybWFsID0gdW5pdFRyYW5zZm9ybS5pbnZlcnNlTm9ybWFsMiggaGl0Lm5vcm1hbCApO1xyXG4gICAgICByZXR1cm4gbmV3IFJheUludGVyc2VjdGlvbiggZGlzdGFuY2UsIHRyYW5zZm9ybWVkUG9pbnQsIG5vcm1hbCwgaGl0LndpbmQsIGhpdC50ICk7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSByZXN1bHRhbnQgd2luZGluZyBudW1iZXIgb2YgdGhpcyByYXkgaW50ZXJzZWN0aW5nIHRoaXMgYXJjLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aW5kaW5nSW50ZXJzZWN0aW9uKCByYXk6IFJheTIgKTogbnVtYmVyIHtcclxuICAgIC8vIGJlIGxhenkuIHRyYW5zZm9ybSBpdCBpbnRvIHRoZSBzcGFjZSBvZiBhIG5vbi1lbGxpcHRpY2FsIGFyYy5cclxuICAgIGNvbnN0IHJheUluVW5pdENpcmNsZVNwYWNlID0gdGhpcy5nZXRVbml0VHJhbnNmb3JtKCkuaW52ZXJzZVJheTIoIHJheSApO1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VW5pdEFyY1NlZ21lbnQoKS53aW5kaW5nSW50ZXJzZWN0aW9uKCByYXlJblVuaXRDaXJjbGVTcGFjZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRHJhd3MgdGhpcyBhcmMgdG8gdGhlIDJEIENhbnZhcyBjb250ZXh0LCBhc3N1bWluZyB0aGUgY29udGV4dCdzIGN1cnJlbnQgbG9jYXRpb24gaXMgYWxyZWFkeSBhdCB0aGUgc3RhcnQgcG9pbnRcclxuICAgKi9cclxuICBwdWJsaWMgd3JpdGVUb0NvbnRleHQoIGNvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCApOiB2b2lkIHtcclxuICAgIGlmICggY29udGV4dC5lbGxpcHNlICkge1xyXG4gICAgICBjb250ZXh0LmVsbGlwc2UoIHRoaXMuX2NlbnRlci54LCB0aGlzLl9jZW50ZXIueSwgdGhpcy5fcmFkaXVzWCwgdGhpcy5fcmFkaXVzWSwgdGhpcy5fcm90YXRpb24sIHRoaXMuX3N0YXJ0QW5nbGUsIHRoaXMuX2VuZEFuZ2xlLCB0aGlzLl9hbnRpY2xvY2t3aXNlICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gZmFrZSB0aGUgZWxsaXBzZSBjYWxsIGJ5IHVzaW5nIHRyYW5zZm9ybXNcclxuICAgICAgdGhpcy5nZXRVbml0VHJhbnNmb3JtKCkuZ2V0TWF0cml4KCkuY2FudmFzQXBwZW5kVHJhbnNmb3JtKCBjb250ZXh0ICk7XHJcbiAgICAgIGNvbnRleHQuYXJjKCAwLCAwLCAxLCB0aGlzLl9zdGFydEFuZ2xlLCB0aGlzLl9lbmRBbmdsZSwgdGhpcy5fYW50aWNsb2Nrd2lzZSApO1xyXG4gICAgICB0aGlzLmdldFVuaXRUcmFuc2Zvcm0oKS5nZXRJbnZlcnNlKCkuY2FudmFzQXBwZW5kVHJhbnNmb3JtKCBjb250ZXh0ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoaXMgZWxsaXB0aWNhbCBhcmMgdHJhbnNmb3JtZWQgYnkgYSBtYXRyaXhcclxuICAgKi9cclxuICBwdWJsaWMgdHJhbnNmb3JtZWQoIG1hdHJpeDogTWF0cml4MyApOiBFbGxpcHRpY2FsQXJjIHtcclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkU2VtaU1ham9yQXhpcyA9IG1hdHJpeC50aW1lc1ZlY3RvcjIoIFZlY3RvcjIuY3JlYXRlUG9sYXIoIHRoaXMuX3JhZGl1c1gsIHRoaXMuX3JvdGF0aW9uICkgKS5taW51cyggbWF0cml4LnRpbWVzVmVjdG9yMiggVmVjdG9yMi5aRVJPICkgKTtcclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkU2VtaU1pbm9yQXhpcyA9IG1hdHJpeC50aW1lc1ZlY3RvcjIoIFZlY3RvcjIuY3JlYXRlUG9sYXIoIHRoaXMuX3JhZGl1c1ksIHRoaXMuX3JvdGF0aW9uICsgTWF0aC5QSSAvIDIgKSApLm1pbnVzKCBtYXRyaXgudGltZXNWZWN0b3IyKCBWZWN0b3IyLlpFUk8gKSApO1xyXG4gICAgY29uc3Qgcm90YXRpb24gPSB0cmFuc2Zvcm1lZFNlbWlNYWpvckF4aXMuYW5nbGU7XHJcbiAgICBjb25zdCByYWRpdXNYID0gdHJhbnNmb3JtZWRTZW1pTWFqb3JBeGlzLm1hZ25pdHVkZTtcclxuICAgIGNvbnN0IHJhZGl1c1kgPSB0cmFuc2Zvcm1lZFNlbWlNaW5vckF4aXMubWFnbml0dWRlO1xyXG5cclxuICAgIGNvbnN0IHJlZmxlY3RlZCA9IG1hdHJpeC5nZXREZXRlcm1pbmFudCgpIDwgMDtcclxuXHJcbiAgICAvLyByZXZlcnNlIHRoZSAnY2xvY2t3aXNlbmVzcycgaWYgb3VyIHRyYW5zZm9ybSBpbmNsdWRlcyBhIHJlZmxlY3Rpb25cclxuICAgIC8vIFRPRE86IGNoZWNrIHJlZmxlY3Rpb25zLiBzd2FwcGluZyBhbmdsZSBzaWducyBzaG91bGQgZml4IGNsb2Nrd2lzZW5lc3MgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICBjb25zdCBhbnRpY2xvY2t3aXNlID0gcmVmbGVjdGVkID8gIXRoaXMuX2FudGljbG9ja3dpc2UgOiB0aGlzLl9hbnRpY2xvY2t3aXNlO1xyXG4gICAgY29uc3Qgc3RhcnRBbmdsZSA9IHJlZmxlY3RlZCA/IC10aGlzLl9zdGFydEFuZ2xlIDogdGhpcy5fc3RhcnRBbmdsZTtcclxuICAgIGxldCBlbmRBbmdsZSA9IHJlZmxlY3RlZCA/IC10aGlzLl9lbmRBbmdsZSA6IHRoaXMuX2VuZEFuZ2xlO1xyXG5cclxuICAgIGlmICggTWF0aC5hYnMoIHRoaXMuX2VuZEFuZ2xlIC0gdGhpcy5fc3RhcnRBbmdsZSApID09PSBNYXRoLlBJICogMiApIHtcclxuICAgICAgZW5kQW5nbGUgPSBhbnRpY2xvY2t3aXNlID8gc3RhcnRBbmdsZSAtIE1hdGguUEkgKiAyIDogc3RhcnRBbmdsZSArIE1hdGguUEkgKiAyO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgRWxsaXB0aWNhbEFyYyggbWF0cml4LnRpbWVzVmVjdG9yMiggdGhpcy5fY2VudGVyICksIHJhZGl1c1gsIHJhZGl1c1ksIHJvdGF0aW9uLCBzdGFydEFuZ2xlLCBlbmRBbmdsZSwgYW50aWNsb2Nrd2lzZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY29udHJpYnV0aW9uIHRvIHRoZSBzaWduZWQgYXJlYSBjb21wdXRlZCB1c2luZyBHcmVlbidzIFRoZW9yZW0sIHdpdGggUD0teS8yIGFuZCBRPXgvMi5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgaXMgdGhpcyBzZWdtZW50J3MgY29udHJpYnV0aW9uIHRvIHRoZSBsaW5lIGludGVncmFsICgteS8yIGR4ICsgeC8yIGR5KS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U2lnbmVkQXJlYUZyYWdtZW50KCk6IG51bWJlciB7XHJcbiAgICBjb25zdCB0MCA9IHRoaXMuX3N0YXJ0QW5nbGU7XHJcbiAgICBjb25zdCB0MSA9IHRoaXMuZ2V0QWN0dWFsRW5kQW5nbGUoKTtcclxuXHJcbiAgICBjb25zdCBzaW4wID0gTWF0aC5zaW4oIHQwICk7XHJcbiAgICBjb25zdCBzaW4xID0gTWF0aC5zaW4oIHQxICk7XHJcbiAgICBjb25zdCBjb3MwID0gTWF0aC5jb3MoIHQwICk7XHJcbiAgICBjb25zdCBjb3MxID0gTWF0aC5jb3MoIHQxICk7XHJcblxyXG4gICAgLy8gRGVyaXZlZCB2aWEgTWF0aGVtYXRpY2EgKGN1cnZlLWFyZWEubmIpXHJcbiAgICByZXR1cm4gMC41ICogKCB0aGlzLl9yYWRpdXNYICogdGhpcy5fcmFkaXVzWSAqICggdDEgLSB0MCApICtcclxuICAgICAgICAgICAgICAgICAgIE1hdGguY29zKCB0aGlzLl9yb3RhdGlvbiApICogKCB0aGlzLl9yYWRpdXNYICogdGhpcy5fY2VudGVyLnkgKiAoIGNvczAgLSBjb3MxICkgK1xyXG4gICAgICAgICAgICAgICAgICAgdGhpcy5fcmFkaXVzWSAqIHRoaXMuX2NlbnRlci54ICogKCBzaW4xIC0gc2luMCApICkgK1xyXG4gICAgICAgICAgICAgICAgICAgTWF0aC5zaW4oIHRoaXMuX3JvdGF0aW9uICkgKiAoIHRoaXMuX3JhZGl1c1ggKiB0aGlzLl9jZW50ZXIueCAqICggY29zMSAtIGNvczAgKSArXHJcbiAgICAgICAgICAgICAgICAgICB0aGlzLl9yYWRpdXNZICogdGhpcy5fY2VudGVyLnkgKiAoIHNpbjEgLSBzaW4wICkgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHJldmVyc2VkIGNvcHkgb2YgdGhpcyBzZWdtZW50IChtYXBwaW5nIHRoZSBwYXJhbWV0cml6YXRpb24gZnJvbSBbMCwxXSA9PiBbMSwwXSkuXHJcbiAgICovXHJcbiAgcHVibGljIHJldmVyc2VkKCk6IEVsbGlwdGljYWxBcmMge1xyXG4gICAgcmV0dXJuIG5ldyBFbGxpcHRpY2FsQXJjKCB0aGlzLl9jZW50ZXIsIHRoaXMuX3JhZGl1c1gsIHRoaXMuX3JhZGl1c1ksIHRoaXMuX3JvdGF0aW9uLCB0aGlzLl9lbmRBbmdsZSwgdGhpcy5fc3RhcnRBbmdsZSwgIXRoaXMuX2FudGljbG9ja3dpc2UgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gb2JqZWN0IGZvcm0gdGhhdCBjYW4gYmUgdHVybmVkIGJhY2sgaW50byBhIHNlZ21lbnQgd2l0aCB0aGUgY29ycmVzcG9uZGluZyBkZXNlcmlhbGl6ZSBtZXRob2QuXHJcbiAgICovXHJcbiAgcHVibGljIHNlcmlhbGl6ZSgpOiBTZXJpYWxpemVkRWxsaXB0aWNhbEFyYyB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnRWxsaXB0aWNhbEFyYycsXHJcbiAgICAgIGNlbnRlclg6IHRoaXMuX2NlbnRlci54LFxyXG4gICAgICBjZW50ZXJZOiB0aGlzLl9jZW50ZXIueSxcclxuICAgICAgcmFkaXVzWDogdGhpcy5fcmFkaXVzWCxcclxuICAgICAgcmFkaXVzWTogdGhpcy5fcmFkaXVzWSxcclxuICAgICAgcm90YXRpb246IHRoaXMuX3JvdGF0aW9uLFxyXG4gICAgICBzdGFydEFuZ2xlOiB0aGlzLl9zdGFydEFuZ2xlLFxyXG4gICAgICBlbmRBbmdsZTogdGhpcy5fZW5kQW5nbGUsXHJcbiAgICAgIGFudGljbG9ja3dpc2U6IHRoaXMuX2FudGljbG9ja3dpc2VcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmUgd2hldGhlciB0d28gbGluZXMgb3ZlcmxhcCBvdmVyIGEgY29udGludW91cyBzZWN0aW9uLCBhbmQgaWYgc28gZmluZHMgdGhlIGEsYiBwYWlyIHN1Y2ggdGhhdFxyXG4gICAqIHAoIHQgKSA9PT0gcSggYSAqIHQgKyBiICkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gc2VnbWVudFxyXG4gICAqIEBwYXJhbSBbZXBzaWxvbl0gLSBXaWxsIHJldHVybiBvdmVybGFwcyBvbmx5IGlmIG5vIHR3byBjb3JyZXNwb25kaW5nIHBvaW50cyBkaWZmZXIgYnkgdGhpcyBhbW91bnQgb3IgbW9yZVxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbiBvbmUgY29tcG9uZW50LlxyXG4gICAqIEByZXR1cm5zIC0gVGhlIHNvbHV0aW9uLCBpZiB0aGVyZSBpcyBvbmUgKGFuZCBvbmx5IG9uZSlcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0T3ZlcmxhcHMoIHNlZ21lbnQ6IFNlZ21lbnQsIGVwc2lsb24gPSAxZS02ICk6IE92ZXJsYXBbXSB8IG51bGwge1xyXG4gICAgaWYgKCBzZWdtZW50IGluc3RhbmNlb2YgRWxsaXB0aWNhbEFyYyApIHtcclxuICAgICAgcmV0dXJuIEVsbGlwdGljYWxBcmMuZ2V0T3ZlcmxhcHMoIHRoaXMsIHNlZ21lbnQgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG1hdHJpeCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29uaWMgc2VjdGlvbiBvZiB0aGUgZWxsaXBzZS5cclxuICAgKiBTZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTWF0cml4X3JlcHJlc2VudGF0aW9uX29mX2NvbmljX3NlY3Rpb25zXHJcbiAgICovXHJcbiAgcHVibGljIGdldENvbmljTWF0cml4KCk6IE1hdHJpeDMge1xyXG4gICAgLy8gQXheMiArIEJ4eSArIEN5XjIgKyBEeCArIEV5ICsgRiA9IDBcclxuXHJcbiAgICAvLyB4J14yICsgeSdeMiA9IDEgICAgICAtLS0tIG91ciB1bml0IGNpcmNsZVxyXG4gICAgLy8gKHgseSwxKSA9IE0gKiAoeCcseScsMSkgICAtLS0tIG91ciB0cmFuc2Zvcm0gbWF0cml4XHJcbiAgICAvLyBDID0gWyAxLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAtMSBdIC0tLSBjb25pYyBtYXRyaXggZm9yIHRoZSB1bml0IGNpcmNsZVxyXG5cclxuICAgIC8vICh4Jyx5JywxKV5UICogQyAqICh4Jyx5JywxKSA9IDAgIC0tLSBjb25pYyBtYXRyaXggZXF1YXRpb24gZm9yIG91ciB1bml0IGNpcmNsZVxyXG4gICAgLy8gKCBNXi0xICogKHgseSwxKSApXlQgKiBDICogTV4tMSAqICh4LHksMSkgPSAwIC0tLSBzdWJzdGl0dXRlIGluIG91ciB0cmFuc2Zvcm0gbWF0cml4XHJcbiAgICAvLyAoeCx5LDEpXlQgKiAoIE1eLTFeVCAqIEMgKiBNXi0xICkgKiAoeCx5LDEpID0gMCAtLS0gaXNvbGF0ZSBjb25pYyBtYXRyaXggZm9yIG91ciBlbGxpcHNlXHJcblxyXG4gICAgLy8gKCBNXi0xXlQgKiBDICogTV4tMSApIGlzIHRoZSBjb25pYyBtYXRyaXggZm9yIG91ciBlbGxpcHNlXHJcbiAgICBjb25zdCB1bml0TWF0cml4ID0gRWxsaXB0aWNhbEFyYy5jb21wdXRlVW5pdE1hdHJpeCggdGhpcy5fY2VudGVyLCB0aGlzLl9yYWRpdXNYLCB0aGlzLl9yYWRpdXNZLCB0aGlzLl9yb3RhdGlvbiApO1xyXG4gICAgY29uc3QgaW52ZXJ0ZWRVbml0TWF0cml4ID0gdW5pdE1hdHJpeC5pbnZlcnRlZCgpO1xyXG4gICAgcmV0dXJuIGludmVydGVkVW5pdE1hdHJpeC50cmFuc3Bvc2VkKCkubXVsdGlwbHlNYXRyaXgoIHVuaXRDaXJjbGVDb25pY01hdHJpeCApLm11bHRpcGx5TWF0cml4KCBpbnZlcnRlZFVuaXRNYXRyaXggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gRWxsaXB0aWNhbEFyYyBmcm9tIHRoZSBzZXJpYWxpemVkIHJlcHJlc2VudGF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgb3ZlcnJpZGUgZGVzZXJpYWxpemUoIG9iajogU2VyaWFsaXplZEVsbGlwdGljYWxBcmMgKTogRWxsaXB0aWNhbEFyYyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvYmoudHlwZSA9PT0gJ0VsbGlwdGljYWxBcmMnICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBFbGxpcHRpY2FsQXJjKCBuZXcgVmVjdG9yMiggb2JqLmNlbnRlclgsIG9iai5jZW50ZXJZICksIG9iai5yYWRpdXNYLCBvYmoucmFkaXVzWSwgb2JqLnJvdGF0aW9uLCBvYmouc3RhcnRBbmdsZSwgb2JqLmVuZEFuZ2xlLCBvYmouYW50aWNsb2Nrd2lzZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGF0IHR5cGUgb2Ygb3ZlcmxhcCBpcyBwb3NzaWJsZSBiYXNlZCBvbiB0aGUgY2VudGVyL3JhZGlpL3JvdGF0aW9uLiBXZSBpZ25vcmUgdGhlIHN0YXJ0L2VuZCBhbmdsZXMgYW5kXHJcbiAgICogYW50aWNsb2Nrd2lzZSBpbmZvcm1hdGlvbiwgYW5kIGRldGVybWluZSBpZiB0aGUgRlVMTCBlbGxpcHNlcyBvdmVybGFwLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0T3ZlcmxhcFR5cGUoIGE6IEVsbGlwdGljYWxBcmMsIGI6IEVsbGlwdGljYWxBcmMsIGVwc2lsb24gPSAxZS00ICk6IEVsbGlwdGljYWxBcmNPdmVybGFwVHlwZSB7XHJcblxyXG4gICAgLy8gRGlmZmVyZW50IGNlbnRlcnMgY2FuJ3Qgb3ZlcmxhcCBjb250aW51b3VzbHlcclxuICAgIGlmICggYS5fY2VudGVyLmRpc3RhbmNlKCBiLl9jZW50ZXIgKSA8IGVwc2lsb24gKSB7XHJcblxyXG4gICAgICBjb25zdCBtYXRjaGluZ1JhZGlpID0gTWF0aC5hYnMoIGEuX3JhZGl1c1ggLSBiLl9yYWRpdXNYICkgPCBlcHNpbG9uICYmIE1hdGguYWJzKCBhLl9yYWRpdXNZIC0gYi5fcmFkaXVzWSApIDwgZXBzaWxvbjtcclxuICAgICAgY29uc3Qgb3Bwb3NpdGVSYWRpaSA9IE1hdGguYWJzKCBhLl9yYWRpdXNYIC0gYi5fcmFkaXVzWSApIDwgZXBzaWxvbiAmJiBNYXRoLmFicyggYS5fcmFkaXVzWSAtIGIuX3JhZGl1c1ggKSA8IGVwc2lsb247XHJcblxyXG4gICAgICBpZiAoIG1hdGNoaW5nUmFkaWkgKSB7XHJcbiAgICAgICAgLy8gRGlmZmVyZW5jZSBiZXR3ZWVuIHJvdGF0aW9ucyBzaG91bGQgYmUgYW4gYXBwcm94aW1hdGUgbXVsdGlwbGUgb2YgcGkuIFdlIGFkZCBwaS8yIGJlZm9yZSBtb2R1bG8sIHNvIHRoZVxyXG4gICAgICAgIC8vIHJlc3VsdCBvZiB0aGF0IHNob3VsZCBiZSB+cGkvMiAoZG9uJ3QgbmVlZCB0byBjaGVjayBib3RoIGVuZHBvaW50cylcclxuICAgICAgICBpZiAoIE1hdGguYWJzKCBVdGlscy5tb2R1bG9CZXR3ZWVuRG93biggYS5fcm90YXRpb24gLSBiLl9yb3RhdGlvbiArIE1hdGguUEkgLyAyLCAwLCBNYXRoLlBJICkgLSBNYXRoLlBJIC8gMiApIDwgZXBzaWxvbiApIHtcclxuICAgICAgICAgIHJldHVybiBFbGxpcHRpY2FsQXJjT3ZlcmxhcFR5cGUuTUFUQ0hJTkdfT1ZFUkxBUDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBvcHBvc2l0ZVJhZGlpICkge1xyXG4gICAgICAgIC8vIERpZmZlcmVuY2UgYmV0d2VlbiByb3RhdGlvbnMgc2hvdWxkIGJlIGFuIGFwcHJveGltYXRlIG11bHRpcGxlIG9mIHBpICh3aXRoIHBpLzIgYWRkZWQpLlxyXG4gICAgICAgIGlmICggTWF0aC5hYnMoIFV0aWxzLm1vZHVsb0JldHdlZW5Eb3duKCBhLl9yb3RhdGlvbiAtIGIuX3JvdGF0aW9uLCAwLCBNYXRoLlBJICkgLSBNYXRoLlBJIC8gMiApIDwgZXBzaWxvbiApIHtcclxuICAgICAgICAgIHJldHVybiBFbGxpcHRpY2FsQXJjT3ZlcmxhcFR5cGUuT1BQT1NJVEVfT1ZFUkxBUDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gRWxsaXB0aWNhbEFyY092ZXJsYXBUeXBlLk5PTkU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmUgd2hldGhlciB0d28gZWxsaXB0aWNhbCBhcmNzIG92ZXJsYXAgb3ZlciBjb250aW51b3VzIHNlY3Rpb25zLCBhbmQgaWYgc28gZmluZHMgdGhlIGEsYiBwYWlycyBzdWNoIHRoYXRcclxuICAgKiBwKCB0ICkgPT09IHEoIGEgKiB0ICsgYiApLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBBbnkgb3ZlcmxhcHMgKGZyb20gMCB0byAyKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0T3ZlcmxhcHMoIGE6IEVsbGlwdGljYWxBcmMsIGI6IEVsbGlwdGljYWxBcmMgKTogT3ZlcmxhcFtdIHtcclxuXHJcbiAgICBjb25zdCBvdmVybGFwVHlwZSA9IEVsbGlwdGljYWxBcmMuZ2V0T3ZlcmxhcFR5cGUoIGEsIGIgKTtcclxuXHJcbiAgICBpZiAoIG92ZXJsYXBUeXBlID09PSBFbGxpcHRpY2FsQXJjT3ZlcmxhcFR5cGUuTk9ORSApIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBBcmMuZ2V0QW5ndWxhck92ZXJsYXBzKCBhLl9zdGFydEFuZ2xlICsgYS5fcm90YXRpb24sIGEuZ2V0QWN0dWFsRW5kQW5nbGUoKSArIGEuX3JvdGF0aW9uLFxyXG4gICAgICAgIGIuX3N0YXJ0QW5nbGUgKyBiLl9yb3RhdGlvbiwgYi5nZXRBY3R1YWxFbmRBbmdsZSgpICsgYi5fcm90YXRpb24gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW55IChmaW5pdGUpIGludGVyc2VjdGlvbiBiZXR3ZWVuIHRoZSB0d28gZWxsaXB0aWNhbCBhcmMgc2VnbWVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBvdmVycmlkZSBpbnRlcnNlY3QoIGE6IEVsbGlwdGljYWxBcmMsIGI6IEVsbGlwdGljYWxBcmMsIGVwc2lsb24gPSAxZS0xMCApOiBTZWdtZW50SW50ZXJzZWN0aW9uW10ge1xyXG5cclxuICAgIGNvbnN0IG92ZXJsYXBUeXBlID0gRWxsaXB0aWNhbEFyYy5nZXRPdmVybGFwVHlwZSggYSwgYiwgZXBzaWxvbiApO1xyXG5cclxuICAgIGlmICggb3ZlcmxhcFR5cGUgPT09IEVsbGlwdGljYWxBcmNPdmVybGFwVHlwZS5OT05FICkge1xyXG4gICAgICByZXR1cm4gQm91bmRzSW50ZXJzZWN0aW9uLmludGVyc2VjdCggYSwgYiApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIElmIHdlIGVmZmVjdGl2ZWx5IGhhdmUgdGhlIHNhbWUgZWxsaXBzZSwganVzdCBkaWZmZXJlbnQgc2VjdGlvbnMgb2YgaXQuIFRoZSBvbmx5IGZpbml0ZSBpbnRlcnNlY3Rpb25zIGNvdWxkIGJlXHJcbiAgICAgIC8vIGF0IHRoZSBlbmRwb2ludHMsIHNvIHdlJ2xsIGluc3BlY3QgdGhvc2UuXHJcblxyXG4gICAgICBjb25zdCByZXN1bHRzID0gW107XHJcbiAgICAgIGNvbnN0IGFTdGFydCA9IGEucG9zaXRpb25BdCggMCApO1xyXG4gICAgICBjb25zdCBhRW5kID0gYS5wb3NpdGlvbkF0KCAxICk7XHJcbiAgICAgIGNvbnN0IGJTdGFydCA9IGIucG9zaXRpb25BdCggMCApO1xyXG4gICAgICBjb25zdCBiRW5kID0gYi5wb3NpdGlvbkF0KCAxICk7XHJcblxyXG4gICAgICBpZiAoIGFTdGFydC5lcXVhbHNFcHNpbG9uKCBiU3RhcnQsIGVwc2lsb24gKSApIHtcclxuICAgICAgICByZXN1bHRzLnB1c2goIG5ldyBTZWdtZW50SW50ZXJzZWN0aW9uKCBhU3RhcnQuYXZlcmFnZSggYlN0YXJ0ICksIDAsIDAgKSApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggYVN0YXJ0LmVxdWFsc0Vwc2lsb24oIGJFbmQsIGVwc2lsb24gKSApIHtcclxuICAgICAgICByZXN1bHRzLnB1c2goIG5ldyBTZWdtZW50SW50ZXJzZWN0aW9uKCBhU3RhcnQuYXZlcmFnZSggYkVuZCApLCAwLCAxICkgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIGFFbmQuZXF1YWxzRXBzaWxvbiggYlN0YXJ0LCBlcHNpbG9uICkgKSB7XHJcbiAgICAgICAgcmVzdWx0cy5wdXNoKCBuZXcgU2VnbWVudEludGVyc2VjdGlvbiggYUVuZC5hdmVyYWdlKCBiU3RhcnQgKSwgMSwgMCApICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBhRW5kLmVxdWFsc0Vwc2lsb24oIGJFbmQsIGVwc2lsb24gKSApIHtcclxuICAgICAgICByZXN1bHRzLnB1c2goIG5ldyBTZWdtZW50SW50ZXJzZWN0aW9uKCBhRW5kLmF2ZXJhZ2UoIGJFbmQgKSwgMSwgMSApICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWF0cml4IHRoYXQgdHJhbnNmb3JtcyB0aGUgdW5pdCBjaXJjbGUgaW50byBvdXIgZWxsaXBzZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgY29tcHV0ZVVuaXRNYXRyaXgoIGNlbnRlcjogVmVjdG9yMiwgcmFkaXVzWDogbnVtYmVyLCByYWRpdXNZOiBudW1iZXIsIHJvdGF0aW9uOiBudW1iZXIgKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gTWF0cml4My50cmFuc2xhdGlvbkZyb21WZWN0b3IoIGNlbnRlciApXHJcbiAgICAgIC50aW1lc01hdHJpeCggTWF0cml4My5yb3RhdGlvbjIoIHJvdGF0aW9uICkgKVxyXG4gICAgICAudGltZXNNYXRyaXgoIE1hdHJpeDMuc2NhbGluZyggcmFkaXVzWCwgcmFkaXVzWSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmFuc2Zvcm1zIHRoZSB1bml0IGNpcmNsZSBpbnRvIG91ciBlbGxpcHNlLlxyXG4gICAqXHJcbiAgICogYWRhcHRlZCBmcm9tIGh0dHA6Ly93d3cudzMub3JnL1RSL1NWRy9pbXBsbm90ZS5odG1sI1BhdGhFbGVtZW50SW1wbGVtZW50YXRpb25Ob3Rlc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgY29tcHV0ZVVuaXRUcmFuc2Zvcm0oIGNlbnRlcjogVmVjdG9yMiwgcmFkaXVzWDogbnVtYmVyLCByYWRpdXNZOiBudW1iZXIsIHJvdGF0aW9uOiBudW1iZXIgKTogVHJhbnNmb3JtMyB7XHJcbiAgICByZXR1cm4gbmV3IFRyYW5zZm9ybTMoIEVsbGlwdGljYWxBcmMuY29tcHV0ZVVuaXRNYXRyaXgoIGNlbnRlciwgcmFkaXVzWCwgcmFkaXVzWSwgcm90YXRpb24gKSApO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEVsbGlwdGljYWxBcmNPdmVybGFwVHlwZSBleHRlbmRzIEVudW1lcmF0aW9uVmFsdWUge1xyXG4gIC8vIHJhZGl1c1ggb2Ygb25lIGVxdWFscyByYWRpdXNYIG9mIHRoZSBvdGhlciwgd2l0aCBlcXVpdmFsZW50IGNlbnRlcnMgYW5kIHJvdGF0aW9ucyB0byB3b3JrXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBNQVRDSElOR19PVkVSTEFQID0gbmV3IEVsbGlwdGljYWxBcmNPdmVybGFwVHlwZSgpO1xyXG5cclxuICAvLyByYWRpdXNYIG9mIG9uZSBlcXVhbHMgcmFkaXVzWSBvZiB0aGUgb3RoZXIsIHdpdGggZXF1aXZhbGVudCBjZW50ZXJzIGFuZCByb3RhdGlvbnMgdG8gd29ya1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgT1BQT1NJVEVfT1ZFUkxBUCA9IG5ldyBFbGxpcHRpY2FsQXJjT3ZlcmxhcFR5cGUoKTtcclxuXHJcbiAgLy8gbm8gb3ZlcmxhcFxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgTk9ORSA9IG5ldyBFbGxpcHRpY2FsQXJjT3ZlcmxhcFR5cGUoKTtcclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBlbnVtZXJhdGlvbiA9IG5ldyBFbnVtZXJhdGlvbiggRWxsaXB0aWNhbEFyY092ZXJsYXBUeXBlICk7XHJcbn1cclxuXHJcbmtpdGUucmVnaXN0ZXIoICdFbGxpcHRpY2FsQXJjJywgRWxsaXB0aWNhbEFyYyApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxPQUFPQyxPQUFPLE1BQU0sNEJBQTRCO0FBRWhELE9BQU9DLFVBQVUsTUFBTSwrQkFBK0I7QUFDdEQsT0FBT0MsS0FBSyxNQUFNLDBCQUEwQjtBQUM1QyxPQUFPQyxPQUFPLE1BQU0sNEJBQTRCO0FBQ2hELE9BQU9DLFdBQVcsTUFBTSxzQ0FBc0M7QUFDOUQsT0FBT0MsZ0JBQWdCLE1BQU0sMkNBQTJDO0FBQ3hFLFNBQVNDLEdBQUcsRUFBRUMsa0JBQWtCLEVBQUVDLElBQUksRUFBRUMsSUFBSSxFQUFXQyxlQUFlLEVBQUVDLE9BQU8sRUFBRUMsbUJB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