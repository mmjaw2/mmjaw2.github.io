// Copyright 2013-2024, University of Colorado Boulder

/**
 * Shape handling
 *
 * Shapes are internally made up of Subpaths, which contain a series of segments, and are optionally closed.
 * Familiarity with how Canvas handles subpaths is helpful for understanding this code.
 *
 * Canvas spec: http://www.w3.org/TR/2dcontext/
 * SVG spec: http://www.w3.org/TR/SVG/expanded-toc.html
 *           http://www.w3.org/TR/SVG/paths.html#PathData (for paths)
 * Notes for elliptical arcs: http://www.w3.org/TR/SVG/implnote.html#PathElementImplementationNotes
 * Notes for painting strokes: https://svgwg.org/svg2-draft/painting.html
 *
 * TODO: add nonzero / evenodd support when browsers support it https://github.com/phetsims/kite/issues/76
 * TODO: docs
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import TinyEmitter from '../../axon/js/TinyEmitter.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import dotRandom from '../../dot/js/dotRandom.js';
import Ray2 from '../../dot/js/Ray2.js';
import Vector2 from '../../dot/js/Vector2.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import { Arc, Cubic, EllipticalArc, Graph, kite, Line, Quadratic, Segment, Subpath, svgNumber, svgPath } from './imports.js';
// (We can't get joist's random reference here)
const randomSource = Math.random;

// Convenience function that returns a Vector2, used throughout this file as an abbreviation for a displacement, a
// position or a point.
const v = (x, y) => new Vector2(x, y);

/**
 * The tension parameter controls how smoothly the curve turns through its control points. For a Catmull-Rom curve,
 * the tension is zero. The tension should range from -1 to 1.
 * @param beforeVector
 * @param currentVector
 * @param afterVector
 * @param tension - the tension should range from -1 to 1.
 */
const weightedSplineVector = (beforeVector, currentVector, afterVector, tension) => {
  return afterVector.copy().subtract(beforeVector).multiplyScalar((1 - tension) / 6).add(currentVector);
};

// a normalized vector for non-zero winding checks
// var weirdDir = v( Math.PI, 22 / 7 );

// STATIC API that is used when turning parsed SVG into a Shape. Methods with these types will be called during the
// "apply parsed SVG" step. IF these need to be changed, it will need to be accompanied by changes to svgPath.pegjs
// and the SVG parser. If we change this WITHOUT doing that, things will break (so basically, don't change this).

// Type of the parsed SVG item that is returned by the parser (from svgPath.js)

class Shape {
  // Lower-level piecewise mathematical description using segments, also individually immutable
  subpaths = [];

  // If non-null, computed bounds for all pieces added so far. Lazily computed with getBounds/bounds ES5 getter

  // So we can invalidate all of the points without firing invalidation tons of times
  _invalidatingPoints = false;

  // When set by makeImmutable(), it indicates this Shape won't be changed from now on, and attempts to change it may
  // result in errors.
  _immutable = false;
  invalidatedEmitter = new TinyEmitter();
  // For tracking the last quadratic/cubic control point for smooth* functions,
  // see https://github.com/phetsims/kite/issues/38
  lastQuadraticControlPoint = null;
  lastCubicControlPoint = null;

  /**
   * All arguments optional, they are for the copy() method. if used, ensure that 'bounds' is consistent with 'subpaths'
   */
  constructor(subpaths, bounds) {
    this._bounds = bounds ? bounds.copy() : null;
    this.resetControlPoints();
    this._invalidateListener = this.invalidate.bind(this);

    // Add in subpaths from the constructor (if applicable)
    if (typeof subpaths === 'object') {
      // assume it's an array
      for (let i = 0; i < subpaths.length; i++) {
        this.addSubpath(subpaths[i]);
      }
    }
    if (subpaths && typeof subpaths !== 'object') {
      // parse the SVG path
      _.each(svgPath.parse(subpaths), item => {
        assert && assert(Shape.prototype[item.cmd] !== undefined, `method ${item.cmd} from parsed SVG does not exist`);

        // @ts-expect-error - This is a valid call, but TypeScript isn't figuring it out based on the union type right now
        this[item.cmd].apply(this, item.args); // eslint-disable-line prefer-spread
      });
    }

    // defines _bounds if not already defined (among other things)
    this.invalidate();
  }

  /**
   * Resets the control points
   *
   * for tracking the last quadratic/cubic control point for smooth* functions
   * see https://github.com/phetsims/kite/issues/38
   */
  resetControlPoints() {
    this.lastQuadraticControlPoint = null;
    this.lastCubicControlPoint = null;
  }

  /**
   * Sets the quadratic control point
   */
  setQuadraticControlPoint(point) {
    this.lastQuadraticControlPoint = point;
    this.lastCubicControlPoint = null;
  }

  /**
   * Sets the cubic control point
   */
  setCubicControlPoint(point) {
    this.lastQuadraticControlPoint = null;
    this.lastCubicControlPoint = point;
  }

  /**
   * Moves to a point given by the coordinates x and y
   */
  moveTo(x, y) {
    assert && assert(isFinite(x), `x must be a finite number: ${x}`);
    assert && assert(isFinite(y), `y must be a finite number: ${y}`);
    return this.moveToPoint(v(x, y));
  }

  /**
   * Moves a relative displacement (x,y) from last point
   */
  moveToRelative(x, y) {
    assert && assert(isFinite(x), `x must be a finite number: ${x}`);
    assert && assert(isFinite(y), `y must be a finite number: ${y}`);
    return this.moveToPointRelative(v(x, y));
  }

  /**
   * Moves a relative displacement (point) from last point
   */
  moveToPointRelative(displacement) {
    return this.moveToPoint(this.getRelativePoint().plus(displacement));
  }

  /**
   * Adds to this shape a subpath that moves (no joint) it to a point
   */
  moveToPoint(point) {
    this.addSubpath(new Subpath().addPoint(point));
    this.resetControlPoints();
    return this; // for chaining
  }

  /**
   * Adds to this shape a straight line from last point to the coordinate (x,y)
   */
  lineTo(x, y) {
    assert && assert(isFinite(x), `x must be a finite number: ${x}`);
    assert && assert(isFinite(y), `y must be a finite number: ${y}`);
    return this.lineToPoint(v(x, y));
  }

  /**
   * Adds to this shape a straight line displaced by a relative amount x, and y from last point
   *
   * @param x - horizontal displacement
   * @param y - vertical displacement
   */
  lineToRelative(x, y) {
    assert && assert(isFinite(x), `x must be a finite number: ${x}`);
    assert && assert(isFinite(y), `y must be a finite number: ${y}`);
    return this.lineToPointRelative(v(x, y));
  }

  /**
   * Adds to this shape a straight line displaced by a relative displacement (point)
   */
  lineToPointRelative(displacement) {
    return this.lineToPoint(this.getRelativePoint().plus(displacement));
  }

  /**
   * Adds to this shape a straight line from this lastPoint to point
   */
  lineToPoint(point) {
    // see http://www.w3.org/TR/2dcontext/#dom-context-2d-lineto
    if (this.hasSubpaths()) {
      const start = this.getLastSubpath().getLastPoint();
      const end = point;
      const line = new Line(start, end);
      this.getLastSubpath().addPoint(end);
      this.addSegmentAndBounds(line);
    } else {
      this.ensure(point);
    }
    this.resetControlPoints();
    return this; // for chaining
  }

  /**
   * Adds a horizontal line (x represents the x-coordinate of the end point)
   */
  horizontalLineTo(x) {
    return this.lineTo(x, this.getRelativePoint().y);
  }

  /**
   * Adds a horizontal line (x represent a horizontal displacement)
   */
  horizontalLineToRelative(x) {
    return this.lineToRelative(x, 0);
  }

  /**
   * Adds a vertical line (y represents the y-coordinate of the end point)
   */
  verticalLineTo(y) {
    return this.lineTo(this.getRelativePoint().x, y);
  }

  /**
   * Adds a vertical line (y represents a vertical displacement)
   */
  verticalLineToRelative(y) {
    return this.lineToRelative(0, y);
  }

  /**
   * Zig-zags between the current point and the specified point
   *
   * @param endX - the end of the shape
   * @param endY - the end of the shape
   * @param amplitude - the vertical amplitude of the zig zag wave
   * @param numberZigZags - the number of oscillations
   * @param symmetrical - flag for drawing a symmetrical zig zag
   */
  zigZagTo(endX, endY, amplitude, numberZigZags, symmetrical) {
    return this.zigZagToPoint(new Vector2(endX, endY), amplitude, numberZigZags, symmetrical);
  }

  /**
   * Zig-zags between the current point and the specified point.
   * Implementation moved from circuit-construction-kit-common on April 22, 2019.
   *
   * @param endPoint - the end of the shape
   * @param amplitude - the vertical amplitude of the zig zag wave, signed to choose initial direction
   * @param numberZigZags - the number of complete oscillations
   * @param symmetrical - flag for drawing a symmetrical zig zag
   */
  zigZagToPoint(endPoint, amplitude, numberZigZags, symmetrical) {
    assert && assert(Number.isInteger(numberZigZags), `numberZigZags must be an integer: ${numberZigZags}`);
    this.ensure(endPoint);
    const startPoint = this.getLastPoint();
    const delta = endPoint.minus(startPoint);
    const directionUnitVector = delta.normalized();
    const amplitudeNormalVector = directionUnitVector.perpendicular.times(amplitude);
    let wavelength;
    if (symmetrical) {
      // the wavelength is shorter to add half a wave.
      wavelength = delta.magnitude / (numberZigZags + 0.5);
    } else {
      wavelength = delta.magnitude / numberZigZags;
    }
    for (let i = 0; i < numberZigZags; i++) {
      const waveOrigin = directionUnitVector.times(i * wavelength).plus(startPoint);
      const topPoint = waveOrigin.plus(directionUnitVector.times(wavelength / 4)).plus(amplitudeNormalVector);
      const bottomPoint = waveOrigin.plus(directionUnitVector.times(3 * wavelength / 4)).minus(amplitudeNormalVector);
      this.lineToPoint(topPoint);
      this.lineToPoint(bottomPoint);
    }

    // add last half of the wavelength
    if (symmetrical) {
      const waveOrigin = directionUnitVector.times(numberZigZags * wavelength).plus(startPoint);
      const topPoint = waveOrigin.plus(directionUnitVector.times(wavelength / 4)).plus(amplitudeNormalVector);
      this.lineToPoint(topPoint);
    }
    return this.lineToPoint(endPoint);
  }

  /**
   * Adds a quadratic curve to this shape
   *
   * The curve is guaranteed to pass through the coordinate (x,y) but does not pass through the control point
   *
   * @param cpx - control point horizontal coordinate
   * @param cpy - control point vertical coordinate
   * @param x
   * @param y
   */
  quadraticCurveTo(cpx, cpy, x, y) {
    assert && assert(isFinite(cpx), `cpx must be a finite number: ${cpx}`);
    assert && assert(isFinite(cpy), `cpy must be a finite number: ${cpy}`);
    assert && assert(isFinite(x), `x must be a finite number: ${x}`);
    assert && assert(isFinite(y), `y must be a finite number: ${y}`);
    return this.quadraticCurveToPoint(v(cpx, cpy), v(x, y));
  }

  /**
   * Adds a quadratic curve to this shape. The control and final points are specified as displacment from the last
   * point in this shape
   *
   * @param cpx - control point horizontal coordinate
   * @param cpy - control point vertical coordinate
   * @param x - final x position of the quadratic curve
   * @param y - final y position of the quadratic curve
   */
  quadraticCurveToRelative(cpx, cpy, x, y) {
    assert && assert(isFinite(cpx), `cpx must be a finite number: ${cpx}`);
    assert && assert(isFinite(cpy), `cpy must be a finite number: ${cpy}`);
    assert && assert(isFinite(x), `x must be a finite number: ${x}`);
    assert && assert(isFinite(y), `y must be a finite number: ${y}`);
    return this.quadraticCurveToPointRelative(v(cpx, cpy), v(x, y));
  }

  /**
   * Adds a quadratic curve to this shape. The control and final points are specified as displacement from the
   * last point in this shape
   *
   * @param controlPoint
   * @param point - the quadratic curve passes through this point
   */
  quadraticCurveToPointRelative(controlPoint, point) {
    const relativePoint = this.getRelativePoint();
    return this.quadraticCurveToPoint(relativePoint.plus(controlPoint), relativePoint.plus(point));
  }

  /**
   * Adds a quadratic curve to this shape. The quadratic curves passes through the x and y coordinate.
   * The shape should join smoothly with the previous subpaths
   *
   * TODO: consider a rename to put 'smooth' farther back? https://github.com/phetsims/kite/issues/76
   *
   * @param x - final x position of the quadratic curve
   * @param y - final y position of the quadratic curve
   */
  smoothQuadraticCurveTo(x, y) {
    assert && assert(isFinite(x), `x must be a finite number: ${x}`);
    assert && assert(isFinite(y), `y must be a finite number: ${y}`);
    return this.quadraticCurveToPoint(this.getSmoothQuadraticControlPoint(), v(x, y));
  }

  /**
   * Adds a quadratic curve to this shape. The quadratic curves passes through the x and y coordinate.
   * The shape should join smoothly with the previous subpaths
   *
   * @param x - final x position of the quadratic curve
   * @param y - final y position of the quadratic curve
   */
  smoothQuadraticCurveToRelative(x, y) {
    assert && assert(isFinite(x), `x must be a finite number: ${x}`);
    assert && assert(isFinite(y), `y must be a finite number: ${y}`);
    return this.quadraticCurveToPoint(this.getSmoothQuadraticControlPoint(), v(x, y).plus(this.getRelativePoint()));
  }

  /**
   * Adds a quadratic bezier curve to this shape.
   *
   * @param controlPoint
   * @param point - the quadratic curve passes through this point
   */
  quadraticCurveToPoint(controlPoint, point) {
    // see http://www.w3.org/TR/2dcontext/#dom-context-2d-quadraticcurveto
    this.ensure(controlPoint);
    const start = this.getLastSubpath().getLastPoint();
    const quadratic = new Quadratic(start, controlPoint, point);
    this.getLastSubpath().addPoint(point);
    const nondegenerateSegments = quadratic.getNondegenerateSegments();
    _.each(nondegenerateSegments, segment => {
      // TODO: optimization https://github.com/phetsims/kite/issues/76
      this.addSegmentAndBounds(segment);
    });
    this.setQuadraticControlPoint(controlPoint);
    return this; // for chaining
  }

  /**
   * Adds a cubic bezier curve to this shape.
   *
   * @param cp1x - control point 1,  horizontal coordinate
   * @param cp1y - control point 1,  vertical coordinate
   * @param cp2x - control point 2,  horizontal coordinate
   * @param cp2y - control point 2,  vertical coordinate
   * @param x - final x position of the cubic curve
   * @param y - final y position of the cubic curve
   */
  cubicCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    assert && assert(isFinite(cp1x), `cp1x must be a finite number: ${cp1x}`);
    assert && assert(isFinite(cp1y), `cp1y must be a finite number: ${cp1y}`);
    assert && assert(isFinite(cp2x), `cp2x must be a finite number: ${cp2x}`);
    assert && assert(isFinite(cp2y), `cp2y must be a finite number: ${cp2y}`);
    assert && assert(isFinite(x), `x must be a finite number: ${x}`);
    assert && assert(isFinite(y), `y must be a finite number: ${y}`);
    return this.cubicCurveToPoint(v(cp1x, cp1y), v(cp2x, cp2y), v(x, y));
  }

  /**
   * @param cp1x - control point 1,  horizontal displacement
   * @param cp1y - control point 1,  vertical displacement
   * @param cp2x - control point 2,  horizontal displacement
   * @param cp2y - control point 2,  vertical displacement
   * @param x - final horizontal displacement
   * @param y - final vertical displacment
   */
  cubicCurveToRelative(cp1x, cp1y, cp2x, cp2y, x, y) {
    assert && assert(isFinite(cp1x), `cp1x must be a finite number: ${cp1x}`);
    assert && assert(isFinite(cp1y), `cp1y must be a finite number: ${cp1y}`);
    assert && assert(isFinite(cp2x), `cp2x must be a finite number: ${cp2x}`);
    assert && assert(isFinite(cp2y), `cp2y must be a finite number: ${cp2y}`);
    assert && assert(isFinite(x), `x must be a finite number: ${x}`);
    assert && assert(isFinite(y), `y must be a finite number: ${y}`);
    return this.cubicCurveToPointRelative(v(cp1x, cp1y), v(cp2x, cp2y), v(x, y));
  }

  /**
   * @param control1 - control displacement  1
   * @param control2 - control displacement 2
   * @param point - final displacement
   */
  cubicCurveToPointRelative(control1, control2, point) {
    const relativePoint = this.getRelativePoint();
    return this.cubicCurveToPoint(relativePoint.plus(control1), relativePoint.plus(control2), relativePoint.plus(point));
  }

  /**
   * @param cp2x - control point 2,  horizontal coordinate
   * @param cp2y - control point 2,  vertical coordinate
   * @param x
   * @param y
   */
  smoothCubicCurveTo(cp2x, cp2y, x, y) {
    assert && assert(isFinite(cp2x), `cp2x must be a finite number: ${cp2x}`);
    assert && assert(isFinite(cp2y), `cp2y must be a finite number: ${cp2y}`);
    assert && assert(isFinite(x), `x must be a finite number: ${x}`);
    assert && assert(isFinite(y), `y must be a finite number: ${y}`);
    return this.cubicCurveToPoint(this.getSmoothCubicControlPoint(), v(cp2x, cp2y), v(x, y));
  }

  /**
   * @param cp2x - control point 2,  horizontal coordinate
   * @param cp2y - control point 2,  vertical coordinate
   * @param x
   * @param y
   */
  smoothCubicCurveToRelative(cp2x, cp2y, x, y) {
    assert && assert(isFinite(cp2x), `cp2x must be a finite number: ${cp2x}`);
    assert && assert(isFinite(cp2y), `cp2y must be a finite number: ${cp2y}`);
    assert && assert(isFinite(x), `x must be a finite number: ${x}`);
    assert && assert(isFinite(y), `y must be a finite number: ${y}`);
    return this.cubicCurveToPoint(this.getSmoothCubicControlPoint(), v(cp2x, cp2y).plus(this.getRelativePoint()), v(x, y).plus(this.getRelativePoint()));
  }
  cubicCurveToPoint(control1, control2, point) {
    // see http://www.w3.org/TR/2dcontext/#dom-context-2d-quadraticcurveto
    this.ensure(control1);
    const start = this.getLastSubpath().getLastPoint();
    const cubic = new Cubic(start, control1, control2, point);
    const nondegenerateSegments = cubic.getNondegenerateSegments();
    _.each(nondegenerateSegments, segment => {
      this.addSegmentAndBounds(segment);
    });
    this.getLastSubpath().addPoint(point);
    this.setCubicControlPoint(control2);
    return this; // for chaining
  }

  /**
   * @param centerX - horizontal coordinate of the center of the arc
   * @param centerY - Center of the arc
   * @param radius - How far from the center the arc will be
   * @param startAngle - Angle (radians) of the start of the arc
   * @param endAngle - Angle (radians) of the end of the arc
   * @param [anticlockwise] - Decides which direction the arc takes around the center
   */
  arc(centerX, centerY, radius, startAngle, endAngle, anticlockwise) {
    assert && assert(isFinite(centerX), `centerX must be a finite number: ${centerX}`);
    assert && assert(isFinite(centerY), `centerY must be a finite number: ${centerY}`);
    return this.arcPoint(v(centerX, centerY), radius, startAngle, endAngle, anticlockwise);
  }

  /**
   * @param center - Center of the arc (every point on the arc is equally far from the center)
   * @param radius - How far from the center the arc will be
   * @param startAngle - Angle (radians) of the start of the arc
   * @param endAngle - Angle (radians) of the end of the arc
   * @param [anticlockwise] - Decides which direction the arc takes around the center
   */
  arcPoint(center, radius, startAngle, endAngle, anticlockwise) {
    // see http://www.w3.org/TR/2dcontext/#dom-context-2d-arc
    if (anticlockwise === undefined) {
      anticlockwise = false;
    }
    const arc = new Arc(center, radius, startAngle, endAngle, anticlockwise);

    // we are assuming that the normal conditions were already met (or exceptioned out) so that these actually work with canvas
    const startPoint = arc.getStart();
    const endPoint = arc.getEnd();

    // if there is already a point on the subpath, and it is different than our starting point, draw a line between them
    if (this.hasSubpaths() && this.getLastSubpath().getLength() > 0 && !startPoint.equals(this.getLastSubpath().getLastPoint())) {
      this.addSegmentAndBounds(new Line(this.getLastSubpath().getLastPoint(), startPoint));
    }
    if (!this.hasSubpaths()) {
      this.addSubpath(new Subpath());
    }

    // technically the Canvas spec says to add the start point, so we do this even though it is probably completely unnecessary (there is no conditional)
    this.getLastSubpath().addPoint(startPoint);
    this.getLastSubpath().addPoint(endPoint);
    this.addSegmentAndBounds(arc);
    this.resetControlPoints();
    return this; // for chaining
  }

  /**
   * Creates an elliptical arc
   *
   * @param centerX - horizontal coordinate of the center of the arc
   * @param centerY -  vertical coordinate of the center of the arc
   * @param radiusX - semi axis
   * @param radiusY - semi axis
   * @param rotation - rotation of the elliptical arc with respect to the positive x axis.
   * @param startAngle
   * @param endAngle
   * @param [anticlockwise]
   */
  ellipticalArc(centerX, centerY, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
    assert && assert(isFinite(centerX), `centerX must be a finite number: ${centerX}`);
    assert && assert(isFinite(centerY), `centerY must be a finite number: ${centerY}`);
    return this.ellipticalArcPoint(v(centerX, centerY), radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
  }

  /**
   * Creates an elliptic arc
   *
   * @param center
   * @param radiusX
   * @param radiusY
   * @param rotation - rotation of the arc with respect to the positive x axis.
   * @param startAngle -
   * @param endAngle
   * @param [anticlockwise]
   */
  ellipticalArcPoint(center, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
    // see http://www.w3.org/TR/2dcontext/#dom-context-2d-arc
    if (anticlockwise === undefined) {
      anticlockwise = false;
    }
    const ellipticalArc = new EllipticalArc(center, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);

    // we are assuming that the normal conditions were already met (or exceptioned out) so that these actually work with canvas
    const startPoint = ellipticalArc.start;
    const endPoint = ellipticalArc.end;

    // if there is already a point on the subpath, and it is different than our starting point, draw a line between them
    if (this.hasSubpaths() && this.getLastSubpath().getLength() > 0 && !startPoint.equals(this.getLastSubpath().getLastPoint())) {
      this.addSegmentAndBounds(new Line(this.getLastSubpath().getLastPoint(), startPoint));
    }
    if (!this.hasSubpaths()) {
      this.addSubpath(new Subpath());
    }

    // technically the Canvas spec says to add the start point, so we do this even though it is probably completely unnecessary (there is no conditional)
    this.getLastSubpath().addPoint(startPoint);
    this.getLastSubpath().addPoint(endPoint);
    this.addSegmentAndBounds(ellipticalArc);
    this.resetControlPoints();
    return this; // for chaining
  }

  /**
   * Adds a subpath that joins the last point of this shape to the first point to form a closed shape
   *
   */
  close() {
    if (this.hasSubpaths()) {
      const previousPath = this.getLastSubpath();
      const nextPath = new Subpath();
      previousPath.close();
      this.addSubpath(nextPath);
      nextPath.addPoint(previousPath.getFirstPoint());
    }
    this.resetControlPoints();
    return this; // for chaining
  }

  /**
   * Moves to the next subpath, but without adding any points to it (like a moveTo would do).
   *
   * This is particularly helpful for cases where you don't want to have to compute the explicit starting point of
   * the next subpath. For instance, if you want three disconnected circles:
   * - shape.circle( 50, 50, 20 ).newSubpath().circle( 100, 100, 20 ).newSubpath().circle( 150, 50, 20 )
   *
   * See https://github.com/phetsims/kite/issues/72 for more info.
   */
  newSubpath() {
    this.addSubpath(new Subpath());
    this.resetControlPoints();
    return this; // for chaining
  }

  /**
   * Makes this Shape immutable, so that attempts to further change the Shape will fail. This allows clients to avoid
   * adding change listeners to this Shape.
   */
  makeImmutable() {
    this._immutable = true;
    this.notifyInvalidationListeners();
    return this; // for chaining
  }

  /**
   * Returns whether this Shape is immutable (see makeImmutable for details).
   */
  isImmutable() {
    return this._immutable;
  }

  /**
   * Matches SVG's elliptical arc from http://www.w3.org/TR/SVG/paths.html
   *
   * WARNING: rotation (for now) is in DEGREES. This will probably change in the future.
   *
   * @param radiusX - Semi-major axis size
   * @param radiusY - Semi-minor axis size
   * @param rotation - Rotation of the ellipse (its semi-major axis)
   * @param largeArc - Whether the arc will go the longest route around the ellipse.
   * @param sweep - Whether the arc made goes from start to end "clockwise" (opposite of anticlockwise flag)
   * @param x - End point X position
   * @param y - End point Y position
   */
  ellipticalArcToRelative(radiusX, radiusY, rotation, largeArc, sweep, x, y) {
    const relativePoint = this.getRelativePoint();
    return this.ellipticalArcTo(radiusX, radiusY, rotation, largeArc, sweep, x + relativePoint.x, y + relativePoint.y);
  }

  /**
   * Matches SVG's elliptical arc from http://www.w3.org/TR/SVG/paths.html
   *
   * WARNING: rotation (for now) is in DEGREES. This will probably change in the future.
   *
   * @param radiusX - Semi-major axis size
   * @param radiusY - Semi-minor axis size
   * @param rotation - Rotation of the ellipse (its semi-major axis)
   * @param largeArc - Whether the arc will go the longest route around the ellipse.
   * @param sweep - Whether the arc made goes from start to end "clockwise" (opposite of anticlockwise flag)
   * @param x - End point X position
   * @param y - End point Y position
   */
  ellipticalArcTo(radiusX, radiusY, rotation, largeArc, sweep, x, y) {
    // See "F.6.5 Conversion from endpoint to center parameterization"
    // in https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes

    const endPoint = new Vector2(x, y);
    this.ensure(endPoint);
    const startPoint = this.getLastSubpath().getLastPoint();
    this.getLastSubpath().addPoint(endPoint);

    // Absolute value applied to radii (per SVG spec)
    if (radiusX < 0) {
      radiusX *= -1.0;
    }
    if (radiusY < 0) {
      radiusY *= -1.0;
    }
    let rxs = radiusX * radiusX;
    let rys = radiusY * radiusY;
    const prime = startPoint.minus(endPoint).dividedScalar(2).rotated(-rotation);
    const pxs = prime.x * prime.x;
    const pys = prime.y * prime.y;
    let centerPrime = new Vector2(radiusX * prime.y / radiusY, -radiusY * prime.x / radiusX);

    // If the radii are not large enough to accomodate the start/end point, apply F.6.6 correction
    const size = pxs / rxs + pys / rys;
    if (size > 1) {
      radiusX *= Math.sqrt(size);
      radiusY *= Math.sqrt(size);

      // redo some computations from above
      rxs = radiusX * radiusX;
      rys = radiusY * radiusY;
      centerPrime = new Vector2(radiusX * prime.y / radiusY, -radiusY * prime.x / radiusX);
    }

    // Naming matches https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes for
    // F.6.5 Conversion from endpoint to center parameterization

    centerPrime.multiplyScalar(Math.sqrt(Math.max(0, (rxs * rys - rxs * pys - rys * pxs) / (rxs * pys + rys * pxs))));
    if (largeArc === sweep) {
      // From spec: where the + sign is chosen if fA ≠ fS, and the − sign is chosen if fA = fS.
      centerPrime.multiplyScalar(-1);
    }
    const center = startPoint.blend(endPoint, 0.5).plus(centerPrime.rotated(rotation));
    const signedAngle = (u, v) => {
      // From spec: where the ± sign appearing here is the sign of ux vy − uy vx.
      return (u.x * v.y - u.y * v.x > 0 ? 1 : -1) * u.angleBetween(v);
    };
    const victor = new Vector2((prime.x - centerPrime.x) / radiusX, (prime.y - centerPrime.y) / radiusY);
    const ross = new Vector2((-prime.x - centerPrime.x) / radiusX, (-prime.y - centerPrime.y) / radiusY);
    const startAngle = signedAngle(Vector2.X_UNIT, victor);
    let deltaAngle = signedAngle(victor, ross) % (Math.PI * 2);

    // From spec:
    // > In other words, if fS = 0 and the right side of (F.6.5.6) is greater than 0, then subtract 360°, whereas if
    // > fS = 1 and the right side of (F.6.5.6) is less than 0, then add 360°. In all other cases leave it as is.
    if (!sweep && deltaAngle > 0) {
      deltaAngle -= Math.PI * 2;
    }
    if (sweep && deltaAngle < 0) {
      deltaAngle += Math.PI * 2;
    }

    // Standard handling of degenerate segments (particularly, converting elliptical arcs to circular arcs)
    const ellipticalArc = new EllipticalArc(center, radiusX, radiusY, rotation, startAngle, startAngle + deltaAngle, !sweep);
    const nondegenerateSegments = ellipticalArc.getNondegenerateSegments();
    _.each(nondegenerateSegments, segment => {
      this.addSegmentAndBounds(segment);
    });
    return this;
  }

  /**
   * Draws a circle using the arc() call
   */

  circle(centerX, centerY, radius) {
    if (typeof centerX === 'object') {
      // circle( center, radius )
      const center = centerX;
      radius = centerY;
      return this.arcPoint(center, radius, 0, Math.PI * 2, false).close();
    } else {
      assert && assert(isFinite(centerX), `centerX must be a finite number: ${centerX}`);
      assert && assert(isFinite(centerY), `centerY must be a finite number: ${centerY}`);

      // circle( centerX, centerY, radius )
      return this.arcPoint(v(centerX, centerY), radius, 0, Math.PI * 2, false).close();
    }
  }

  /**
   * Draws an ellipse using the ellipticalArc() call
   *
   * The rotation is about the centerX, centerY.
   */

  ellipse(centerX, centerY, radiusX, radiusY, rotation) {
    // TODO: separate into ellipse() and ellipsePoint()? https://github.com/phetsims/kite/issues/76
    // TODO: Ellipse/EllipticalArc has a mess of parameters. Consider parameter object, or double-check parameter handling https://github.com/phetsims/kite/issues/76
    if (typeof centerX === 'object') {
      // ellipse( center, radiusX, radiusY, rotation )
      const center = centerX;
      rotation = radiusY;
      radiusY = radiusX;
      radiusX = centerY;
      return this.ellipticalArcPoint(center, radiusX, radiusY, rotation || 0, 0, Math.PI * 2, false).close();
    } else {
      assert && assert(isFinite(centerX), `centerX must be a finite number: ${centerX}`);
      assert && assert(isFinite(centerY), `centerY must be a finite number: ${centerY}`);

      // ellipse( centerX, centerY, radiusX, radiusY, rotation )
      return this.ellipticalArcPoint(v(centerX, centerY), radiusX, radiusY, rotation || 0, 0, Math.PI * 2, false).close();
    }
  }

  /**
   * Creates a rectangle shape
   *
   * @param x - left position
   * @param y - bottom position (in non inverted cartesian system)
   * @param width
   * @param height
   */
  rect(x, y, width, height) {
    assert && assert(isFinite(x), `x must be a finite number: ${x}`);
    assert && assert(isFinite(y), `y must be a finite number: ${y}`);
    assert && assert(isFinite(width), `width must be a finite number: ${width}`);
    assert && assert(isFinite(height), `height must be a finite number: ${height}`);
    const subpath = new Subpath();
    this.addSubpath(subpath);
    subpath.addPoint(v(x, y));
    subpath.addPoint(v(x + width, y));
    subpath.addPoint(v(x + width, y + height));
    subpath.addPoint(v(x, y + height));
    this.addSegmentAndBounds(new Line(subpath.points[0], subpath.points[1]));
    this.addSegmentAndBounds(new Line(subpath.points[1], subpath.points[2]));
    this.addSegmentAndBounds(new Line(subpath.points[2], subpath.points[3]));
    subpath.close();
    this.addSubpath(new Subpath());
    this.getLastSubpath().addPoint(v(x, y));
    assert && assert(!isNaN(this.bounds.getX()));
    this.resetControlPoints();
    return this;
  }

  /**
   * Creates a round rectangle. All arguments are number.
   *
   * @param x
   * @param y
   * @param width - width of the rectangle
   * @param height - height of the rectangle
   * @param arcw - arc width
   * @param arch - arc height
   */
  roundRect(x, y, width, height, arcw, arch) {
    const lowX = x + arcw;
    const highX = x + width - arcw;
    const lowY = y + arch;
    const highY = y + height - arch;
    // if ( true ) {
    if (arcw === arch) {
      // we can use circular arcs, which have well defined stroked offsets
      this.arc(highX, lowY, arcw, -Math.PI / 2, 0, false).arc(highX, highY, arcw, 0, Math.PI / 2, false).arc(lowX, highY, arcw, Math.PI / 2, Math.PI, false).arc(lowX, lowY, arcw, Math.PI, Math.PI * 3 / 2, false).close();
    } else {
      // we have to resort to elliptical arcs
      this.ellipticalArc(highX, lowY, arcw, arch, 0, -Math.PI / 2, 0, false).ellipticalArc(highX, highY, arcw, arch, 0, 0, Math.PI / 2, false).ellipticalArc(lowX, highY, arcw, arch, 0, Math.PI / 2, Math.PI, false).ellipticalArc(lowX, lowY, arcw, arch, 0, Math.PI, Math.PI * 3 / 2, false).close();
    }
    return this;
  }

  /**
   * Creates a polygon from an array of vertices.
   */
  polygon(vertices) {
    const length = vertices.length;
    if (length > 0) {
      this.moveToPoint(vertices[0]);
      for (let i = 1; i < length; i++) {
        this.lineToPoint(vertices[i]);
      }
    }
    return this.close();
  }

  /**
   * This is a convenience function that allows to generate Cardinal splines
   * from a position array. Cardinal spline differs from Bezier curves in that all
   * defined points on a Cardinal spline are on the path itself.
   *
   * It includes a tension parameter to allow the client to specify how tightly
   * the path interpolates between points. One can think of the tension as the tension in
   * a rubber band around pegs. however unlike a rubber band the tension can be negative.
   * the tension ranges from -1 to 1
   */
  cardinalSpline(positions, providedOptions) {
    const options = optionize()({
      tension: 0,
      isClosedLineSegments: false
    }, providedOptions);
    assert && assert(options.tension < 1 && options.tension > -1, ' the tension goes from -1 to 1 ');
    const pointNumber = positions.length; // number of points in the array

    // if the line is open, there is one less segments than point vectors
    const segmentNumber = options.isClosedLineSegments ? pointNumber : pointNumber - 1;
    for (let i = 0; i < segmentNumber; i++) {
      let cardinalPoints; // {Array.<Vector2>} cardinal points Array
      if (i === 0 && !options.isClosedLineSegments) {
        cardinalPoints = [positions[0], positions[0], positions[1], positions[2]];
      } else if (i === segmentNumber - 1 && !options.isClosedLineSegments) {
        cardinalPoints = [positions[i - 1], positions[i], positions[i + 1], positions[i + 1]];
      } else {
        cardinalPoints = [positions[(i - 1 + pointNumber) % pointNumber], positions[i % pointNumber], positions[(i + 1) % pointNumber], positions[(i + 2) % pointNumber]];
      }

      // Cardinal Spline to Cubic Bezier conversion matrix
      //    0                 1             0            0
      //  (-1+tension)/6      1      (1-tension)/6       0
      //    0            (1-tension)/6      1       (-1+tension)/6
      //    0                 0             1           0

      // {Array.<Vector2>} bezier points Array
      const bezierPoints = [cardinalPoints[1], weightedSplineVector(cardinalPoints[0], cardinalPoints[1], cardinalPoints[2], options.tension), weightedSplineVector(cardinalPoints[3], cardinalPoints[2], cardinalPoints[1], options.tension), cardinalPoints[2]];

      // special operations on the first point
      if (i === 0) {
        this.ensure(bezierPoints[0]);
        this.getLastSubpath().addPoint(bezierPoints[0]);
      }
      this.cubicCurveToPoint(bezierPoints[1], bezierPoints[2], bezierPoints[3]);
    }
    return this;
  }

  /**
   * Returns a copy of this shape
   */
  copy() {
    // copy each individual subpath, so future modifications to either Shape doesn't affect the other one
    return new Shape(_.map(this.subpaths, subpath => subpath.copy()), this.bounds);
  }

  /**
   * Writes out this shape's path to a canvas 2d context. does NOT include the beginPath()!
   */
  writeToContext(context) {
    const len = this.subpaths.length;
    for (let i = 0; i < len; i++) {
      this.subpaths[i].writeToContext(context);
    }
  }

  /**
   * Returns something like "M150 0 L75 200 L225 200 Z" for a triangle (to be used with a SVG path element's 'd'
   * attribute)
   */
  getSVGPath() {
    let string = '';
    const len = this.subpaths.length;
    for (let i = 0; i < len; i++) {
      const subpath = this.subpaths[i];
      if (subpath.isDrawable()) {
        // since the commands after this are relative to the previous 'point', we need to specify a move to the initial point
        const startPoint = subpath.segments[0].start;
        string += `M ${svgNumber(startPoint.x)} ${svgNumber(startPoint.y)} `;
        for (let k = 0; k < subpath.segments.length; k++) {
          string += `${subpath.segments[k].getSVGPathFragment()} `;
        }
        if (subpath.isClosed()) {
          string += 'Z ';
        }
      }
    }
    return string;
  }

  /**
   * Returns a new Shape that is transformed by the associated matrix
   */
  transformed(matrix) {
    // TODO: allocation reduction https://github.com/phetsims/kite/issues/76
    const subpaths = _.map(this.subpaths, subpath => subpath.transformed(matrix));
    const bounds = _.reduce(subpaths, (bounds, subpath) => bounds.union(subpath.bounds), Bounds2.NOTHING);
    return new Shape(subpaths, bounds);
  }

  /**
   * Converts this subpath to a new shape made of many line segments (approximating the current shape) with the
   * transformation applied.
   */
  nonlinearTransformed(providedOptions) {
    const options = combineOptions({
      minLevels: 0,
      maxLevels: 7,
      distanceEpsilon: 0.16,
      // NOTE: this will change when the Shape is scaled, since this is a threshold for the square of a distance value
      curveEpsilon: providedOptions && providedOptions.includeCurvature ? 0.002 : null
    }, providedOptions);

    // TODO: allocation reduction https://github.com/phetsims/kite/issues/76
    const subpaths = _.map(this.subpaths, subpath => subpath.nonlinearTransformed(options));
    const bounds = _.reduce(subpaths, (bounds, subpath) => bounds.union(subpath.bounds), Bounds2.NOTHING);
    return new Shape(subpaths, bounds);
  }

  /**
   * Maps points by treating their x coordinate as polar angle, and y coordinate as polar magnitude.
   * See http://en.wikipedia.org/wiki/Polar_coordinate_system
   *
   * Please see Shape.nonlinearTransformed for more documentation on adaptive discretization options (minLevels, maxLevels, distanceEpsilon, curveEpsilon)
   *
   * Example: A line from (0,10) to (pi,10) will be transformed to a circular arc from (10,0) to (-10,0) passing through (0,10).
   */
  polarToCartesian(options) {
    return this.nonlinearTransformed(combineOptions({
      pointMap: p => Vector2.createPolar(p.y, p.x),
      methodName: 'polarToCartesian' // this will be called on Segments if it exists to do more optimized conversion (see Line)
    }, options));
  }

  /**
   * Converts each segment into lines, using an adaptive (midpoint distance subdivision) method.
   *
   * NOTE: uses nonlinearTransformed method internally, but since we don't provide a pointMap or methodName, it won't create anything but line segments.
   * See nonlinearTransformed for documentation of options
   */
  toPiecewiseLinear(options) {
    assert && assert(!options || !options.pointMap, 'No pointMap for toPiecewiseLinear allowed, since it could create non-linear segments');
    assert && assert(!options || !options.methodName, 'No methodName for toPiecewiseLinear allowed, since it could create non-linear segments');
    return this.nonlinearTransformed(options);
  }

  /**
   * Is this point contained in this shape
   */
  containsPoint(point) {
    // We pick a ray, and determine the winding number over that ray. if the number of segments crossing it
    // CCW == number of segments crossing it CW, then the point is contained in the shape

    const rayDirection = Vector2.X_UNIT.copy(); // we may mutate it

    // Try to find a ray that doesn't intersect with any of the vertices of the shape segments,
    // see https://github.com/phetsims/kite/issues/94.
    // Put a limit on attempts, so we don't try forever
    let count = 0;
    while (count < 5) {
      count++;

      // Look for cases where the proposed ray will intersect with one of the vertices of a shape segment - in this case
      // the intersection in windingIntersection may not be well-defined and won't be counted, so we need to use a ray
      // with a different direction
      const rayIntersectsSegmentVertex = _.some(this.subpaths, subpath => {
        return _.some(subpath.segments, segment => {
          const delta = segment.start.minus(point);
          const magnitude = delta.magnitude;
          if (magnitude !== 0) {
            delta.divideScalar(magnitude); // normalize it
            delta.subtract(rayDirection); // check against the proposed ray direction
            return delta.magnitudeSquared < 1e-9;
          } else {
            // If our point is on a segment start, there probably won't be a great ray to use
            return false;
          }
        });
      });
      if (rayIntersectsSegmentVertex) {
        // the proposed ray may not work because it intersects with a segment vertex - try another one
        rayDirection.rotate(dotRandom.nextDouble());
      } else {
        // Should be safe to use this rayDirection for windingIntersection
        break;
      }
    }
    return this.windingIntersection(new Ray2(point, rayDirection)) !== 0;
  }

  /**
   * Hit-tests this shape with the ray. An array of all intersections of the ray with this shape will be returned.
   * For this function, intersections will be returned sorted by the distance from the ray's position.
   */
  intersection(ray) {
    let hits = [];
    const numSubpaths = this.subpaths.length;
    for (let i = 0; i < numSubpaths; i++) {
      const subpath = this.subpaths[i];
      if (subpath.isDrawable()) {
        const numSegments = subpath.segments.length;
        for (let k = 0; k < numSegments; k++) {
          const segment = subpath.segments[k];
          hits = hits.concat(segment.intersection(ray));
        }
        if (subpath.hasClosingSegment()) {
          hits = hits.concat(subpath.getClosingSegment().intersection(ray));
        }
      }
    }
    return _.sortBy(hits, hit => hit.distance);
  }

  /**
   * Returns whether the provided line segment would have some part on top or touching the interior (filled area) of
   * this shape.
   *
   * This differs somewhat from an intersection of the line segment with the Shape's path, as we will return true
   * ("intersection") if the line segment is entirely contained in the interior of the Shape's path.
   *
   * @param startPoint - One end of the line segment
   * @param endPoint - The other end of the line segment
   */
  interiorIntersectsLineSegment(startPoint, endPoint) {
    // First check if our midpoint is in the Shape (as either our midpoint is in the Shape, OR the line segment will
    // intersect the Shape's boundary path).
    const midpoint = startPoint.blend(endPoint, 0.5);
    if (this.containsPoint(midpoint)) {
      return true;
    }

    // TODO: if an issue, we can reduce this allocation to a scratch variable local in the Shape.js scope. https://github.com/phetsims/kite/issues/76
    const delta = endPoint.minus(startPoint);
    const length = delta.magnitude;
    if (length === 0) {
      return false;
    }
    delta.normalize(); // so we can use it as a unit vector, expected by the Ray

    // Grab all intersections (that are from startPoint towards the direction of endPoint)
    const hits = this.intersection(new Ray2(startPoint, delta));

    // See if we have any intersections along our infinite ray whose distance from the startPoint is less than or
    // equal to our line segment's length.
    for (let i = 0; i < hits.length; i++) {
      if (hits[i].distance <= length) {
        return true;
      }
    }

    // Did not hit the boundary, and wasn't fully contained.
    return false;
  }

  /**
   * Returns the winding number for intersection with a ray
   */
  windingIntersection(ray) {
    let wind = 0;
    const numSubpaths = this.subpaths.length;
    for (let i = 0; i < numSubpaths; i++) {
      const subpath = this.subpaths[i];
      if (subpath.isDrawable()) {
        const numSegments = subpath.segments.length;
        for (let k = 0; k < numSegments; k++) {
          wind += subpath.segments[k].windingIntersection(ray);
        }

        // handle the implicit closing line segment
        if (subpath.hasClosingSegment()) {
          wind += subpath.getClosingSegment().windingIntersection(ray);
        }
      }
    }
    return wind;
  }

  /**
   * Whether the path of the Shape intersects (or is contained in) the provided bounding box.
   * Computed by checking intersections with all four edges of the bounding box, or whether the Shape is totally
   * contained within the bounding box.
   */
  intersectsBounds(bounds) {
    // If the bounding box completely surrounds our shape, it intersects the bounds
    if (this.bounds.intersection(bounds).equals(this.bounds)) {
      return true;
    }

    // rays for hit testing along the bounding box edges
    const minHorizontalRay = new Ray2(new Vector2(bounds.minX, bounds.minY), new Vector2(1, 0));
    const minVerticalRay = new Ray2(new Vector2(bounds.minX, bounds.minY), new Vector2(0, 1));
    const maxHorizontalRay = new Ray2(new Vector2(bounds.maxX, bounds.maxY), new Vector2(-1, 0));
    const maxVerticalRay = new Ray2(new Vector2(bounds.maxX, bounds.maxY), new Vector2(0, -1));
    let hitPoint;
    let i;
    // TODO: could optimize to intersect differently so we bail sooner https://github.com/phetsims/kite/issues/76
    const horizontalRayIntersections = this.intersection(minHorizontalRay).concat(this.intersection(maxHorizontalRay));
    for (i = 0; i < horizontalRayIntersections.length; i++) {
      hitPoint = horizontalRayIntersections[i].point;
      if (hitPoint.x >= bounds.minX && hitPoint.x <= bounds.maxX) {
        return true;
      }
    }
    const verticalRayIntersections = this.intersection(minVerticalRay).concat(this.intersection(maxVerticalRay));
    for (i = 0; i < verticalRayIntersections.length; i++) {
      hitPoint = verticalRayIntersections[i].point;
      if (hitPoint.y >= bounds.minY && hitPoint.y <= bounds.maxY) {
        return true;
      }
    }

    // not contained, and no intersections with the sides of the bounding box
    return false;
  }

  /**
   * Returns a new Shape that is an outline of the stroked path of this current Shape. currently not intended to be
   * nested (doesn't do intersection computations yet)
   *
   * TODO: rename stroked( lineStyles )? https://github.com/phetsims/kite/issues/76
   */
  getStrokedShape(lineStyles) {
    let subpaths = [];
    const bounds = Bounds2.NOTHING.copy();
    let subLen = this.subpaths.length;
    for (let i = 0; i < subLen; i++) {
      const subpath = this.subpaths[i];
      const strokedSubpath = subpath.stroked(lineStyles);
      subpaths = subpaths.concat(strokedSubpath);
    }
    subLen = subpaths.length;
    for (let i = 0; i < subLen; i++) {
      bounds.includeBounds(subpaths[i].bounds);
    }
    return new Shape(subpaths, bounds);
  }

  /**
   * Gets a shape offset by a certain amount.
   */
  getOffsetShape(distance) {
    // TODO: abstract away this type of behavior https://github.com/phetsims/kite/issues/76
    const subpaths = [];
    const bounds = Bounds2.NOTHING.copy();
    let subLen = this.subpaths.length;
    for (let i = 0; i < subLen; i++) {
      subpaths.push(this.subpaths[i].offset(distance));
    }
    subLen = subpaths.length;
    for (let i = 0; i < subLen; i++) {
      bounds.includeBounds(subpaths[i].bounds);
    }
    return new Shape(subpaths, bounds);
  }

  /**
   * Returns a copy of this subpath with the dash "holes" removed (has many subpaths usually).
   */
  getDashedShape(lineDash, lineDashOffset, providedOptions) {
    const options = optionize()({
      distanceEpsilon: 1e-10,
      curveEpsilon: 1e-8
    }, providedOptions);
    return new Shape(_.flatten(this.subpaths.map(subpath => subpath.dashed(lineDash, lineDashOffset, options.distanceEpsilon, options.curveEpsilon))));
  }

  /**
   * Returns the bounds of this shape. It is the bounding-box union of the bounds of each subpath contained.
   */
  getBounds() {
    if (this._bounds === null) {
      const bounds = Bounds2.NOTHING.copy();
      _.each(this.subpaths, subpath => {
        bounds.includeBounds(subpath.getBounds());
      });
      this._bounds = bounds;
    }
    return this._bounds;
  }
  get bounds() {
    return this.getBounds();
  }

  /**
   * Returns the bounds for a stroked version of this shape. The input lineStyles are used to determine the size and
   * style of the stroke, and then the bounds of the stroked shape are returned.
   */
  getStrokedBounds(lineStyles) {
    // Check if all of our segments end vertically or horizontally AND our drawable subpaths are all closed. If so,
    // we can apply a bounds dilation.
    let areStrokedBoundsDilated = true;
    for (let i = 0; i < this.subpaths.length; i++) {
      const subpath = this.subpaths[i];

      // If a subpath with any segments is NOT closed, line-caps will apply. We can't make the simplification in this
      // case.
      if (subpath.isDrawable() && !subpath.isClosed()) {
        areStrokedBoundsDilated = false;
        break;
      }
      for (let j = 0; j < subpath.segments.length; j++) {
        const segment = subpath.segments[j];
        if (!segment.areStrokedBoundsDilated()) {
          areStrokedBoundsDilated = false;
          break;
        }
      }
    }
    if (areStrokedBoundsDilated) {
      return this.bounds.dilated(lineStyles.lineWidth / 2);
    } else {
      const bounds = this.bounds.copy();
      for (let i = 0; i < this.subpaths.length; i++) {
        const subpaths = this.subpaths[i].stroked(lineStyles);
        for (let j = 0; j < subpaths.length; j++) {
          bounds.includeBounds(subpaths[j].bounds);
        }
      }
      return bounds;
    }
  }

  /**
   * Returns a simplified form of this shape.
   *
   * Runs it through the normal CAG process, which should combine areas where possible, handles self-intersection,
   * etc.
   *
   * NOTE: Currently (2017-10-04) adjacent segments may get simplified only if they are lines. Not yet complete.
   */
  getSimplifiedAreaShape() {
    return Graph.simplifyNonZero(this);
  }
  getBoundsWithTransform(matrix, lineStyles) {
    const bounds = Bounds2.NOTHING.copy();
    const numSubpaths = this.subpaths.length;
    for (let i = 0; i < numSubpaths; i++) {
      const subpath = this.subpaths[i];
      bounds.includeBounds(subpath.getBoundsWithTransform(matrix));
    }
    if (lineStyles) {
      bounds.includeBounds(this.getStrokedShape(lineStyles).getBoundsWithTransform(matrix));
    }
    return bounds;
  }

  /**
   * Return an approximate value of the area inside of this Shape (where containsPoint is true) using Monte-Carlo.
   *
   * NOTE: Generally, use getArea(). This can be used for verification, but takes a large number of samples.
   *
   * @param numSamples - How many times to randomly check for inclusion of points.
   */
  getApproximateArea(numSamples) {
    const x = this.bounds.minX;
    const y = this.bounds.minY;
    const width = this.bounds.width;
    const height = this.bounds.height;
    const rectangleArea = width * height;
    let count = 0;
    const point = new Vector2(0, 0);
    for (let i = 0; i < numSamples; i++) {
      point.x = x + randomSource() * width;
      point.y = y + randomSource() * height;
      if (this.containsPoint(point)) {
        count++;
      }
    }
    return rectangleArea * count / numSamples;
  }

  /**
   * Return the area inside the Shape (where containsPoint is true), assuming there is no self-intersection or
   * overlap, and the same orientation (winding order) is used. Should also support holes (with opposite orientation),
   * assuming they don't intersect the containing subpath.
   */
  getNonoverlappingArea() {
    // Only absolute-value the final value.
    return Math.abs(_.sum(this.subpaths.map(subpath => _.sum(subpath.getFillSegments().map(segment => segment.getSignedAreaFragment())))));
  }

  /**
   * Returns the area inside the shape.
   *
   * NOTE: This requires running it through a lot of computation to determine a non-overlapping non-self-intersecting
   *       form first. If the Shape is "simple" enough, getNonoverlappingArea would be preferred.
   */
  getArea() {
    return this.getSimplifiedAreaShape().getNonoverlappingArea();
  }

  /**
   * Return the approximate location of the centroid of the Shape (the average of all points where containsPoint is true)
   * using Monte-Carlo methods.
   *
   * @param numSamples - How many times to randomly check for inclusion of points.
   */
  getApproximateCentroid(numSamples) {
    const x = this.bounds.minX;
    const y = this.bounds.minY;
    const width = this.bounds.width;
    const height = this.bounds.height;
    let count = 0;
    const sum = new Vector2(0, 0);
    const point = new Vector2(0, 0);
    for (let i = 0; i < numSamples; i++) {
      point.x = x + randomSource() * width;
      point.y = y + randomSource() * height;
      if (this.containsPoint(point)) {
        sum.add(point);
        count++;
      }
    }
    return sum.dividedScalar(count);
  }

  /**
   * Returns an array of potential closest point results on the Shape to the given point.
   */
  getClosestPoints(point) {
    return Segment.filterClosestToPointResult(_.flatten(this.subpaths.map(subpath => subpath.getClosestPoints(point))));
  }

  /**
   * Returns a single point ON the Shape boundary that is closest to the given point (picks an arbitrary one if there
   * are multiple).
   */
  getClosestPoint(point) {
    return this.getClosestPoints(point)[0].closestPoint;
  }

  /**
   * Should be called after mutating the x/y of Vector2 points that were passed in to various Shape calls, so that
   * derived information computed (bounds, etc.) will be correct, and any clients (e.g. Scenery Paths) will be
   * notified of the updates.
   */
  invalidatePoints() {
    this._invalidatingPoints = true;
    const numSubpaths = this.subpaths.length;
    for (let i = 0; i < numSubpaths; i++) {
      this.subpaths[i].invalidatePoints();
    }
    this._invalidatingPoints = false;
    this.invalidate();
  }
  toString() {
    // TODO: consider a more verbose but safer way? https://github.com/phetsims/kite/issues/76
    return `new phet.kite.Shape( '${this.getSVGPath()}' )`;
  }

  /*---------------------------------------------------------------------------*
   * Internal subpath computations
   *----------------------------------------------------------------------------*/

  invalidate() {
    assert && assert(!this._immutable, 'Attempt to modify an immutable Shape');
    if (!this._invalidatingPoints) {
      this._bounds = null;
      this.notifyInvalidationListeners();
    }
  }

  /**
   * Called when a part of the Shape has changed, or if metadata on the Shape has changed (e.g. it became immutable).
   */
  notifyInvalidationListeners() {
    this.invalidatedEmitter.emit();
  }
  addSegmentAndBounds(segment) {
    this.getLastSubpath().addSegment(segment);
    this.invalidate();
  }

  /**
   * Makes sure that we have a subpath (and if there is no subpath, start it at this point)
   */
  ensure(point) {
    if (!this.hasSubpaths()) {
      this.addSubpath(new Subpath());
      this.getLastSubpath().addPoint(point);
    }
  }

  /**
   * Adds a subpath
   */
  addSubpath(subpath) {
    this.subpaths.push(subpath);

    // listen to when the subpath is invalidated (will cause bounds recomputation here)
    subpath.invalidatedEmitter.addListener(this._invalidateListener);
    this.invalidate();
    return this; // allow chaining
  }

  /**
   * Determines if there are any subpaths
   */
  hasSubpaths() {
    return this.subpaths.length > 0;
  }

  /**
   * Gets the last subpath
   */
  getLastSubpath() {
    assert && assert(this.hasSubpaths(), 'We should have a subpath if this is called');
    return _.last(this.subpaths);
  }

  /**
   * Gets the last point in the last subpath, or null if it doesn't exist
   */
  getLastPoint() {
    assert && assert(this.hasSubpaths(), 'We should have a subpath if this is called');
    assert && assert(this.getLastSubpath().getLastPoint(), 'We should have a last point');
    return this.getLastSubpath().getLastPoint();
  }

  /**
   * Gets the last drawable segment in the last subpath, or null if it doesn't exist
   */
  getLastSegment() {
    if (!this.hasSubpaths()) {
      return null;
    }
    const subpath = this.getLastSubpath();
    if (!subpath.isDrawable()) {
      return null;
    }
    return subpath.getLastSegment();
  }

  /**
   * Returns the control point to be used to create a smooth quadratic segments
   */
  getSmoothQuadraticControlPoint() {
    const lastPoint = this.getLastPoint();
    if (this.lastQuadraticControlPoint) {
      return lastPoint.plus(lastPoint.minus(this.lastQuadraticControlPoint));
    } else {
      return lastPoint;
    }
  }

  /**
   * Returns the control point to be used to create a smooth cubic segment
   */
  getSmoothCubicControlPoint() {
    const lastPoint = this.getLastPoint();
    if (this.lastCubicControlPoint) {
      return lastPoint.plus(lastPoint.minus(this.lastCubicControlPoint));
    } else {
      return lastPoint;
    }
  }

  /**
   * Returns the last point in the last subpath, or the Vector ZERO if it doesn't exist
   */
  getRelativePoint() {
    let result = Vector2.ZERO;
    if (this.hasSubpaths()) {
      const subpath = this.getLastSubpath();
      if (subpath.points.length) {
        result = subpath.getLastPoint();
      }
    }
    return result;
  }

  /**
   * Returns a new shape that contains a union of the two shapes (a point in either shape is in the resulting shape).
   */
  shapeUnion(shape) {
    return Graph.binaryResult(this, shape, Graph.BINARY_NONZERO_UNION);
  }

  /**
   * Returns a new shape that contains the intersection of the two shapes (a point in both shapes is in the
   * resulting shape).
   */
  shapeIntersection(shape) {
    return Graph.binaryResult(this, shape, Graph.BINARY_NONZERO_INTERSECTION);
  }

  /**
   * Returns a new shape that contains the difference of the two shapes (a point in the first shape and NOT in the
   * second shape is in the resulting shape).
   */
  shapeDifference(shape) {
    return Graph.binaryResult(this, shape, Graph.BINARY_NONZERO_DIFFERENCE);
  }

  /**
   * Returns a new shape that contains the xor of the two shapes (a point in only one shape is in the resulting
   * shape).
   */
  shapeXor(shape) {
    return Graph.binaryResult(this, shape, Graph.BINARY_NONZERO_XOR);
  }

  /**
   * Returns a new shape that only contains portions of segments that are within the passed-in shape's area.
   *
   * // TODO: convert Graph to TS and get the types from there https://github.com/phetsims/kite/issues/76
   */
  shapeClip(shape, options) {
    return Graph.clipShape(shape, this, options);
  }

  /**
   * Returns the (sometimes approximate) arc length of all the shape's subpaths combined.
   */
  getArcLength(distanceEpsilon, curveEpsilon, maxLevels) {
    let length = 0;
    for (let i = 0; i < this.subpaths.length; i++) {
      length += this.subpaths[i].getArcLength(distanceEpsilon, curveEpsilon, maxLevels);
    }
    return length;
  }

  /**
   * Returns an object form that can be turned back into a segment with the corresponding deserialize method.
   */
  serialize() {
    return {
      type: 'Shape',
      subpaths: this.subpaths.map(subpath => subpath.serialize())
    };
  }

  /**
   * Returns a Shape from the serialized representation.
   */
  static deserialize(obj) {
    assert && assert(obj.type === 'Shape');
    return new Shape(obj.subpaths.map(Subpath.deserialize));
  }

  /**
   * Creates a rectangle
   */
  static rectangle(x, y, width, height) {
    return new Shape().rect(x, y, width, height);
  }
  static rect = Shape.rectangle;

  /**
   * Creates a round rectangle {Shape}, with {number} arguments. Uses circular or elliptical arcs if given.
   */
  static roundRect(x, y, width, height, arcw, arch) {
    return new Shape().roundRect(x, y, width, height, arcw, arch);
  }
  static roundRectangle = Shape.roundRect;

  /**
   * Creates a rounded rectangle, where each corner can have a different radius. The radii default to 0, and may be set
   * using topLeft, topRight, bottomLeft and bottomRight in the options. If the specified radii are larger than the dimension
   * on that side, they radii are reduced proportionally, see https://github.com/phetsims/under-pressure/issues/151
   *
   * E.g.:
   *
   * var cornerRadius = 20;
   * var rect = Shape.roundedRectangleWithRadii( 0, 0, 200, 100, {
   *   topLeft: cornerRadius,
   *   topRight: cornerRadius
   * } );
   *
   * @param x - Left edge position
   * @param y - Top edge position
   * @param width - Width of rectangle
   * @param height - Height of rectangle
   * @param [cornerRadii] - Optional object with potential radii for each corner.
   */
  static roundedRectangleWithRadii(x, y, width, height, cornerRadii) {
    // defaults to 0 (not using merge, since we reference each multiple times)
    let topLeftRadius = cornerRadii && cornerRadii.topLeft || 0;
    let topRightRadius = cornerRadii && cornerRadii.topRight || 0;
    let bottomLeftRadius = cornerRadii && cornerRadii.bottomLeft || 0;
    let bottomRightRadius = cornerRadii && cornerRadii.bottomRight || 0;

    // type and constraint assertions
    assert && assert(isFinite(x), 'Non-finite x');
    assert && assert(isFinite(y), 'Non-finite y');
    assert && assert(width >= 0 && isFinite(width), 'Negative or non-finite width');
    assert && assert(height >= 0 && isFinite(height), 'Negative or non-finite height');
    assert && assert(topLeftRadius >= 0 && isFinite(topLeftRadius), 'Invalid topLeft');
    assert && assert(topRightRadius >= 0 && isFinite(topRightRadius), 'Invalid topRight');
    assert && assert(bottomLeftRadius >= 0 && isFinite(bottomLeftRadius), 'Invalid bottomLeft');
    assert && assert(bottomRightRadius >= 0 && isFinite(bottomRightRadius), 'Invalid bottomRight');

    // The width and height take precedence over the corner radii. If the sum of the corner radii exceed
    // that dimension, then the corner radii are reduced proportionately
    const topSum = topLeftRadius + topRightRadius;
    if (topSum > width && topSum > 0) {
      topLeftRadius = topLeftRadius / topSum * width;
      topRightRadius = topRightRadius / topSum * width;
    }
    const bottomSum = bottomLeftRadius + bottomRightRadius;
    if (bottomSum > width && bottomSum > 0) {
      bottomLeftRadius = bottomLeftRadius / bottomSum * width;
      bottomRightRadius = bottomRightRadius / bottomSum * width;
    }
    const leftSum = topLeftRadius + bottomLeftRadius;
    if (leftSum > height && leftSum > 0) {
      topLeftRadius = topLeftRadius / leftSum * height;
      bottomLeftRadius = bottomLeftRadius / leftSum * height;
    }
    const rightSum = topRightRadius + bottomRightRadius;
    if (rightSum > height && rightSum > 0) {
      topRightRadius = topRightRadius / rightSum * height;
      bottomRightRadius = bottomRightRadius / rightSum * height;
    }

    // verify there is no overlap between corners
    assert && assert(topLeftRadius + topRightRadius <= width, 'Corner overlap on top edge');
    assert && assert(bottomLeftRadius + bottomRightRadius <= width, 'Corner overlap on bottom edge');
    assert && assert(topLeftRadius + bottomLeftRadius <= height, 'Corner overlap on left edge');
    assert && assert(topRightRadius + bottomRightRadius <= height, 'Corner overlap on right edge');
    const shape = new Shape();
    const right = x + width;
    const bottom = y + height;

    // To draw the rounded rectangle, we use the implicit "line from last segment to next segment" and the close() for
    // all the straight line edges between arcs, or lineTo the corner.

    if (bottomRightRadius > 0) {
      shape.arc(right - bottomRightRadius, bottom - bottomRightRadius, bottomRightRadius, 0, Math.PI / 2, false);
    } else {
      shape.moveTo(right, bottom);
    }
    if (bottomLeftRadius > 0) {
      shape.arc(x + bottomLeftRadius, bottom - bottomLeftRadius, bottomLeftRadius, Math.PI / 2, Math.PI, false);
    } else {
      shape.lineTo(x, bottom);
    }
    if (topLeftRadius > 0) {
      shape.arc(x + topLeftRadius, y + topLeftRadius, topLeftRadius, Math.PI, 3 * Math.PI / 2, false);
    } else {
      shape.lineTo(x, y);
    }
    if (topRightRadius > 0) {
      shape.arc(right - topRightRadius, y + topRightRadius, topRightRadius, 3 * Math.PI / 2, 2 * Math.PI, false);
    } else {
      shape.lineTo(right, y);
    }
    shape.close();
    return shape;
  }

  /**
   * Returns a Shape from a bounds, offset (expanded) by certain amounts, and with certain corner radii.
   */
  static boundsOffsetWithRadii(bounds, offsets, radii) {
    const offsetBounds = bounds.withOffsets(offsets.left, offsets.top, offsets.right, offsets.bottom);
    return Shape.roundedRectangleWithRadii(offsetBounds.minX, offsetBounds.minY, offsetBounds.width, offsetBounds.height, radii);
  }

  /**
   * Creates a closed polygon from an array of vertices by connecting them by a series of lines.
   * The lines are joining the adjacent vertices in the array.
   */
  static polygon(vertices) {
    return new Shape().polygon(vertices);
  }

  /**
   * Creates a rectangular shape from bounds
   */
  static bounds(bounds) {
    return new Shape().rect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  }

  /**
   * Creates a line segment, using either (x1,y1,x2,y2) or ({x1,y1},{x2,y2}) arguments
   */

  static lineSegment(a, b, c, d) {
    if (typeof a === 'number') {
      return new Shape().moveTo(a, b).lineTo(c, d);
    } else {
      // then a and b must be {Vector2}
      return new Shape().moveToPoint(a).lineToPoint(b);
    }
  }

  /**
   * Returns a regular polygon of radius and number of sides
   * The regular polygon is oriented such that the first vertex lies on the positive x-axis.
   *
   * @param sides - an integer
   * @param radius
   */
  static regularPolygon(sides, radius) {
    const shape = new Shape();
    _.each(_.range(sides), k => {
      const point = Vector2.createPolar(radius, 2 * Math.PI * k / sides);
      k === 0 ? shape.moveToPoint(point) : shape.lineToPoint(point);
    });
    return shape.close();
  }

  /**
   * Creates a circle
   * supports both circle( centerX, centerY, radius ), circle( center, radius ), and circle( radius ) with the center default to 0,0
   */

  static circle(a, b, c) {
    if (b === undefined) {
      // circle( radius ), center = 0,0
      return new Shape().circle(0, 0, a);
    }
    // @ts-expect-error - The signatures are compatible, it's just multiple different types at the same time
    return new Shape().circle(a, b, c);
  }

  /**
   * Supports ellipse( centerX, centerY, radiusX, radiusY, rotation ), ellipse( center, radiusX, radiusY, rotation ), and ellipse( radiusX, radiusY, rotation )
   * with the center default to 0,0 and rotation of 0.  The rotation is about the centerX, centerY.
   */

  static ellipse(a, b, c, d, e) {
    // TODO: Ellipse/EllipticalArc has a mess of parameters. Consider parameter object, or double-check parameter handling https://github.com/phetsims/kite/issues/76
    if (d === undefined) {
      // ellipse( radiusX, radiusY ), center = 0,0
      return new Shape().ellipse(0, 0, a, b, c);
    }
    // @ts-expect-error - The signatures are compatible, it's just multiple different types at the same time
    return new Shape().ellipse(a, b, c, d, e);
  }

  /**
   * Supports both arc( centerX, centerY, radius, startAngle, endAngle, anticlockwise ) and arc( center, radius, startAngle, endAngle, anticlockwise )
   *
   * @param radius - How far from the center the arc will be
   * @param startAngle - Angle (radians) of the start of the arc
   * @param endAngle - Angle (radians) of the end of the arc
   * @param [anticlockwise] - Decides which direction the arc takes around the center
   */

  static arc(a, b, c, d, e, f) {
    // @ts-expect-error - The signatures are compatible, it's just multiple different types at the same time
    return new Shape().arc(a, b, c, d, e, f);
  }

  /**
   * Returns the union of an array of shapes.
   */
  static union(shapes) {
    return Graph.unionNonZero(shapes);
  }

  /**
   * Returns the intersection of an array of shapes.
   */
  static intersection(shapes) {
    return Graph.intersectionNonZero(shapes);
  }

  /**
   * Returns the xor of an array of shapes.
   */
  static xor(shapes) {
    return Graph.xorNonZero(shapes);
  }

  /**
   * Returns a new Shape constructed by appending a list of segments together.
   */
  static segments(segments, closed) {
    if (assert) {
      for (let i = 1; i < segments.length; i++) {
        assert(segments[i - 1].end.equalsEpsilon(segments[i].start, 1e-6), 'Mismatched start/end');
      }
    }
    return new Shape([new Subpath(segments, undefined, !!closed)]);
  }
}
kite.register('Shape', Shape);
export default Shape;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55RW1pdHRlciIsIkJvdW5kczIiLCJkb3RSYW5kb20iLCJSYXkyIiwiVmVjdG9yMiIsIm9wdGlvbml6ZSIsImNvbWJpbmVPcHRpb25zIiwiQXJjIiwiQ3ViaWMiLCJFbGxpcHRpY2FsQXJjIiwiR3JhcGgiLCJraXRlIiwiTGluZSIsIlF1YWRyYXRpYyIsIlNlZ21lbnQiLCJTdWJwYXRoIiwic3ZnTnVtYmVyIiwic3ZnUGF0aCIsInJhbmRvbVNvdXJjZSIsIk1hdGgiLCJyYW5kb20iLCJ2IiwieCIsInkiLCJ3ZWlnaHRlZFNwbGluZVZlY3RvciIsImJlZm9yZVZlY3RvciIsImN1cnJlbnRWZWN0b3IiLCJhZnRlclZlY3RvciIsInRlbnNpb24iLCJjb3B5Iiwic3VidHJhY3QiLCJtdWx0aXBseVNjYWxhciIsImFkZCIsIlNoYXBlIiwic3VicGF0aHMiLCJfaW52YWxpZGF0aW5nUG9pbnRzIiwiX2ltbXV0YWJsZSIsImludmFsaWRhdGVkRW1pdHRlciIsImxhc3RRdWFkcmF0aWNDb250cm9sUG9pbnQiLCJsYXN0Q3ViaWNDb250cm9sUG9pbnQiLCJjb25zdHJ1Y3RvciIsImJvdW5kcyIsIl9ib3VuZHMiLCJyZXNldENvbnRyb2xQb2ludHMiLCJfaW52YWxpZGF0ZUxpc3RlbmVyIiwiaW52YWxpZGF0ZSIsImJpbmQiLCJpIiwibGVuZ3RoIiwiYWRkU3VicGF0aCIsIl8iLCJlYWNoIiwicGFyc2UiLCJpdGVtIiwiYXNzZXJ0IiwicHJvdG90eXBlIiwiY21kIiwidW5kZWZpbmVkIiwiYXBwbHkiLCJhcmdzIiwic2V0UXVhZHJhdGljQ29udHJvbFBvaW50IiwicG9pbnQiLCJzZXRDdWJpY0NvbnRyb2xQb2ludCIsIm1vdmVUbyIsImlzRmluaXRlIiwibW92ZVRvUG9pbnQiLCJtb3ZlVG9SZWxhdGl2ZSIsIm1vdmVUb1BvaW50UmVsYXRpdmUiLCJkaXNwbGFjZW1lbnQiLCJnZXRSZWxhdGl2ZVBvaW50IiwicGx1cyIsImFkZFBvaW50IiwibGluZVRvIiwibGluZVRvUG9pbnQiLCJsaW5lVG9SZWxhdGl2ZSIsImxpbmVUb1BvaW50UmVsYXRpdmUiLCJoYXNTdWJwYXRocyIsInN0YXJ0IiwiZ2V0TGFzdFN1YnBhdGgiLCJnZXRMYXN0UG9pbnQiLCJlbmQiLCJsaW5lIiwiYWRkU2VnbWVudEFuZEJvdW5kcyIsImVuc3VyZSIsImhvcml6b250YWxMaW5lVG8iLCJob3Jpem9udGFsTGluZVRvUmVsYXRpdmUiLCJ2ZXJ0aWNhbExpbmVUbyIsInZlcnRpY2FsTGluZVRvUmVsYXRpdmUiLCJ6aWdaYWdUbyIsImVuZFgiLCJlbmRZIiwiYW1wbGl0dWRlIiwibnVtYmVyWmlnWmFncyIsInN5bW1ldHJpY2FsIiwiemlnWmFnVG9Qb2ludCIsImVuZFBvaW50IiwiTnVtYmVyIiwiaXNJbnRlZ2VyIiwic3RhcnRQb2ludCIsImRlbHRhIiwibWludXMiLCJkaXJlY3Rpb25Vbml0VmVjdG9yIiwibm9ybWFsaXplZCIsImFtcGxpdHVkZU5vcm1hbFZlY3RvciIsInBlcnBlbmRpY3VsYXIiLCJ0aW1lcyIsIndhdmVsZW5ndGgiLCJtYWduaXR1ZGUiLCJ3YXZlT3JpZ2luIiwidG9wUG9pbnQiLCJib3R0b21Qb2ludCIsInF1YWRyYXRpY0N1cnZlVG8iLCJjcHgiLCJjcHkiLCJxdWFkcmF0aWNDdXJ2ZVRvUG9pbnQiLCJxdWFkcmF0aWNDdXJ2ZVRvUmVsYXRpdmUiLCJxdWFkcmF0aWNDdXJ2ZVRvUG9pbnRSZWxhdGl2ZSIsImNvbnRyb2xQb2ludCIsInJlbGF0aXZlUG9pbnQiLCJzbW9vdGhRdWFkcmF0aWNDdXJ2ZVRvIiwiZ2V0U21vb3RoUXVhZHJhdGljQ29udHJvbFBvaW50Iiwic21vb3RoUXVhZHJhdGljQ3VydmVUb1JlbGF0aXZlIiwicXVhZHJhdGljIiwibm9uZGVnZW5lcmF0ZVNlZ21lbnRzIiwiZ2V0Tm9uZGVnZW5lcmF0ZVNlZ21lbnRzIiwic2VnbWVudCIsImN1YmljQ3VydmVUbyIsImNwMXgiLCJjcDF5IiwiY3AyeCIsImNwMnkiLCJjdWJpY0N1cnZlVG9Qb2ludCIsImN1YmljQ3VydmVUb1JlbGF0aXZlIiwiY3ViaWNDdXJ2ZVRvUG9pbnRSZWxhdGl2ZSIsImNvbnRyb2wxIiwiY29udHJvbDIiLCJzbW9vdGhDdWJpY0N1cnZlVG8iLCJnZXRTbW9vdGhDdWJpY0NvbnRyb2xQb2ludCIsInNtb290aEN1YmljQ3VydmVUb1JlbGF0aXZlIiwiY3ViaWMiLCJhcmMiLCJjZW50ZXJYIiwiY2VudGVyWSIsInJhZGl1cyIsInN0YXJ0QW5nbGUiLCJlbmRBbmdsZSIsImFudGljbG9ja3dpc2UiLCJhcmNQb2ludCIsImNlbnRlciIsImdldFN0YXJ0IiwiZ2V0RW5kIiwiZ2V0TGVuZ3RoIiwiZXF1YWxzIiwiZWxsaXB0aWNhbEFyYyIsInJhZGl1c1giLCJyYWRpdXNZIiwicm90YXRpb24iLCJlbGxpcHRpY2FsQXJjUG9pbnQiLCJjbG9zZSIsInByZXZpb3VzUGF0aCIsIm5leHRQYXRoIiwiZ2V0Rmlyc3RQb2ludCIsIm5ld1N1YnBhdGgiLCJtYWtlSW1tdXRhYmxlIiwibm90aWZ5SW52YWxpZGF0aW9uTGlzdGVuZXJzIiwiaXNJbW11dGFibGUiLCJlbGxpcHRpY2FsQXJjVG9SZWxhdGl2ZSIsImxhcmdlQXJjIiwic3dlZXAiLCJlbGxpcHRpY2FsQXJjVG8iLCJyeHMiLCJyeXMiLCJwcmltZSIsImRpdmlkZWRTY2FsYXIiLCJyb3RhdGVkIiwicHhzIiwicHlzIiwiY2VudGVyUHJpbWUiLCJzaXplIiwic3FydCIsIm1heCIsImJsZW5kIiwic2lnbmVkQW5nbGUiLCJ1IiwiYW5nbGVCZXR3ZWVuIiwidmljdG9yIiwicm9zcyIsIlhfVU5JVCIsImRlbHRhQW5nbGUiLCJQSSIsImNpcmNsZSIsImVsbGlwc2UiLCJyZWN0Iiwid2lkdGgiLCJoZWlnaHQiLCJzdWJwYXRoIiwicG9pbnRzIiwiaXNOYU4iLCJnZXRYIiwicm91bmRSZWN0IiwiYXJjdyIsImFyY2giLCJsb3dYIiwiaGlnaFgiLCJsb3dZIiwiaGlnaFkiLCJwb2x5Z29uIiwidmVydGljZXMiLCJjYXJkaW5hbFNwbGluZSIsInBvc2l0aW9ucyIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJpc0Nsb3NlZExpbmVTZWdtZW50cyIsInBvaW50TnVtYmVyIiwic2VnbWVudE51bWJlciIsImNhcmRpbmFsUG9pbnRzIiwiYmV6aWVyUG9pbnRzIiwibWFwIiwid3JpdGVUb0NvbnRleHQiLCJjb250ZXh0IiwibGVuIiwiZ2V0U1ZHUGF0aCIsInN0cmluZyIsImlzRHJhd2FibGUiLCJzZWdtZW50cyIsImsiLCJnZXRTVkdQYXRoRnJhZ21lbnQiLCJpc0Nsb3NlZCIsInRyYW5zZm9ybWVkIiwibWF0cml4IiwicmVkdWNlIiwidW5pb24iLCJOT1RISU5HIiwibm9ubGluZWFyVHJhbnNmb3JtZWQiLCJtaW5MZXZlbHMiLCJtYXhMZXZlbHMiLCJkaXN0YW5jZUVwc2lsb24iLCJjdXJ2ZUVwc2lsb24iLCJpbmNsdWRlQ3VydmF0dXJlIiwicG9sYXJUb0NhcnRlc2lhbiIsInBvaW50TWFwIiwicCIsImNyZWF0ZVBvbGFyIiwibWV0aG9kTmFtZSIsInRvUGllY2V3aXNlTGluZWFyIiwiY29udGFpbnNQb2ludCIsInJheURpcmVjdGlvbiIsImNvdW50IiwicmF5SW50ZXJzZWN0c1NlZ21lbnRWZXJ0ZXgiLCJzb21lIiwiZGl2aWRlU2NhbGFyIiwibWFnbml0dWRlU3F1YXJlZCIsInJvdGF0ZSIsIm5leHREb3VibGUiLCJ3aW5kaW5nSW50ZXJzZWN0aW9uIiwiaW50ZXJzZWN0aW9uIiwicmF5IiwiaGl0cyIsIm51bVN1YnBhdGhzIiwibnVtU2VnbWVudHMiLCJjb25jYXQiLCJoYXNDbG9zaW5nU2VnbWVudCIsImdldENsb3NpbmdTZWdtZW50Iiwic29ydEJ5IiwiaGl0IiwiZGlzdGFuY2UiLCJpbnRlcmlvckludGVyc2VjdHNMaW5lU2VnbWVudCIsIm1pZHBvaW50Iiwibm9ybWFsaXplIiwid2luZCIsImludGVyc2VjdHNCb3VuZHMiLCJtaW5Ib3Jpem9udGFsUmF5IiwibWluWCIsIm1pblkiLCJtaW5WZXJ0aWNhbFJheSIsIm1heEhvcml6b250YWxSYXkiLCJtYXhYIiwibWF4WSIsIm1heFZlcnRpY2FsUmF5IiwiaGl0UG9pbnQiLCJob3Jpem9udGFsUmF5SW50ZXJzZWN0aW9ucyIsInZlcnRpY2FsUmF5SW50ZXJzZWN0aW9ucyIsImdldFN0cm9rZWRTaGFwZSIsImxpbmVTdHlsZXMiLCJzdWJMZW4iLCJzdHJva2VkU3VicGF0aCIsInN0cm9rZWQiLCJpbmNsdWRlQm91bmRzIiwiZ2V0T2Zmc2V0U2hhcGUiLCJwdXNoIiwib2Zmc2V0IiwiZ2V0RGFzaGVkU2hhcGUiLCJsaW5lRGFzaCIsImxpbmVEYXNoT2Zmc2V0IiwiZmxhdHRlbiIsImRhc2hlZCIsImdldEJvdW5kcyIsImdldFN0cm9rZWRCb3VuZHMiLCJhcmVTdHJva2VkQm91bmRzRGlsYXRlZCIsImoiLCJkaWxhdGVkIiwibGluZVdpZHRoIiwiZ2V0U2ltcGxpZmllZEFyZWFTaGFwZSIsInNpbXBsaWZ5Tm9uWmVybyIsImdldEJvdW5kc1dpdGhUcmFuc2Zvcm0iLCJnZXRBcHByb3hpbWF0ZUFyZWEiLCJudW1TYW1wbGVzIiwicmVjdGFuZ2xlQXJlYSIsImdldE5vbm92ZXJsYXBwaW5nQXJlYSIsImFicyIsInN1bSIsImdldEZpbGxTZWdtZW50cyIsImdldFNpZ25lZEFyZWFGcmFnbWVudCIsImdldEFyZWEiLCJnZXRBcHByb3hpbWF0ZUNlbnRyb2lkIiwiZ2V0Q2xvc2VzdFBvaW50cyIsImZpbHRlckNsb3Nlc3RUb1BvaW50UmVzdWx0IiwiZ2V0Q2xvc2VzdFBvaW50IiwiY2xvc2VzdFBvaW50IiwiaW52YWxpZGF0ZVBvaW50cyIsInRvU3RyaW5nIiwiZW1pdCIsImFkZFNlZ21lbnQiLCJhZGRMaXN0ZW5lciIsImxhc3QiLCJnZXRMYXN0U2VnbWVudCIsImxhc3RQb2ludCIsInJlc3VsdCIsIlpFUk8iLCJzaGFwZVVuaW9uIiwic2hhcGUiLCJiaW5hcnlSZXN1bHQiLCJCSU5BUllfTk9OWkVST19VTklPTiIsInNoYXBlSW50ZXJzZWN0aW9uIiwiQklOQVJZX05PTlpFUk9fSU5URVJTRUNUSU9OIiwic2hhcGVEaWZmZXJlbmNlIiwiQklOQVJZX05PTlpFUk9fRElGRkVSRU5DRSIsInNoYXBlWG9yIiwiQklOQVJZX05PTlpFUk9fWE9SIiwic2hhcGVDbGlwIiwiY2xpcFNoYXBlIiwiZ2V0QXJjTGVuZ3RoIiwic2VyaWFsaXplIiwidHlwZSIsImRlc2VyaWFsaXplIiwib2JqIiwicmVjdGFuZ2xlIiwicm91bmRSZWN0YW5nbGUiLCJyb3VuZGVkUmVjdGFuZ2xlV2l0aFJhZGlpIiwiY29ybmVyUmFkaWkiLCJ0b3BMZWZ0UmFkaXVzIiwidG9wTGVmdCIsInRvcFJpZ2h0UmFkaXVzIiwidG9wUmlnaHQiLCJib3R0b21MZWZ0UmFkaXVzIiwiYm90dG9tTGVmdCIsImJvdHRvbVJpZ2h0UmFkaXVzIiwiYm90dG9tUmlnaHQiLCJ0b3BTdW0iLCJib3R0b21TdW0iLCJsZWZ0U3VtIiwicmlnaHRTdW0iLCJyaWdodCIsImJvdHRvbSIsImJvdW5kc09mZnNldFdpdGhSYWRpaSIsIm9mZnNldHMiLCJyYWRpaSIsIm9mZnNldEJvdW5kcyIsIndpdGhPZmZzZXRzIiwibGVmdCIsInRvcCIsImxpbmVTZWdtZW50IiwiYSIsImIiLCJjIiwiZCIsInJlZ3VsYXJQb2x5Z29uIiwic2lkZXMiLCJyYW5nZSIsImUiLCJmIiwic2hhcGVzIiwidW5pb25Ob25aZXJvIiwiaW50ZXJzZWN0aW9uTm9uWmVybyIsInhvciIsInhvck5vblplcm8iLCJjbG9zZWQiLCJlcXVhbHNFcHNpbG9uIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJTaGFwZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTaGFwZSBoYW5kbGluZ1xyXG4gKlxyXG4gKiBTaGFwZXMgYXJlIGludGVybmFsbHkgbWFkZSB1cCBvZiBTdWJwYXRocywgd2hpY2ggY29udGFpbiBhIHNlcmllcyBvZiBzZWdtZW50cywgYW5kIGFyZSBvcHRpb25hbGx5IGNsb3NlZC5cclxuICogRmFtaWxpYXJpdHkgd2l0aCBob3cgQ2FudmFzIGhhbmRsZXMgc3VicGF0aHMgaXMgaGVscGZ1bCBmb3IgdW5kZXJzdGFuZGluZyB0aGlzIGNvZGUuXHJcbiAqXHJcbiAqIENhbnZhcyBzcGVjOiBodHRwOi8vd3d3LnczLm9yZy9UUi8yZGNvbnRleHQvXHJcbiAqIFNWRyBzcGVjOiBodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcvZXhwYW5kZWQtdG9jLmh0bWxcclxuICogICAgICAgICAgIGh0dHA6Ly93d3cudzMub3JnL1RSL1NWRy9wYXRocy5odG1sI1BhdGhEYXRhIChmb3IgcGF0aHMpXHJcbiAqIE5vdGVzIGZvciBlbGxpcHRpY2FsIGFyY3M6IGh0dHA6Ly93d3cudzMub3JnL1RSL1NWRy9pbXBsbm90ZS5odG1sI1BhdGhFbGVtZW50SW1wbGVtZW50YXRpb25Ob3Rlc1xyXG4gKiBOb3RlcyBmb3IgcGFpbnRpbmcgc3Ryb2tlczogaHR0cHM6Ly9zdmd3Zy5vcmcvc3ZnMi1kcmFmdC9wYWludGluZy5odG1sXHJcbiAqXHJcbiAqIFRPRE86IGFkZCBub256ZXJvIC8gZXZlbm9kZCBzdXBwb3J0IHdoZW4gYnJvd3NlcnMgc3VwcG9ydCBpdCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICogVE9ETzogZG9jc1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IFRpbnlFbWl0dGVyIGZyb20gJy4uLy4uL2F4b24vanMvVGlueUVtaXR0ZXIuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBkb3RSYW5kb20gZnJvbSAnLi4vLi4vZG90L2pzL2RvdFJhbmRvbS5qcyc7XHJcbmltcG9ydCBNYXRyaXgzIGZyb20gJy4uLy4uL2RvdC9qcy9NYXRyaXgzLmpzJztcclxuaW1wb3J0IFJheTIgZnJvbSAnLi4vLi4vZG90L2pzL1JheTIuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgY29tYmluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IHsgQXJjLCBDbG9zZXN0VG9Qb2ludFJlc3VsdCwgQ3ViaWMsIEVsbGlwdGljYWxBcmMsIEdyYXBoLCBraXRlLCBMaW5lLCBMaW5lU3R5bGVzLCBQaWVjZXdpc2VMaW5lYXJPcHRpb25zLCBRdWFkcmF0aWMsIFJheUludGVyc2VjdGlvbiwgU2VnbWVudCwgU3VicGF0aCwgc3ZnTnVtYmVyLCBzdmdQYXRoIH0gZnJvbSAnLi9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHsgU2VyaWFsaXplZFN1YnBhdGggfSBmcm9tICcuL3V0aWwvU3VicGF0aC5qcyc7XHJcblxyXG4vLyAoV2UgY2FuJ3QgZ2V0IGpvaXN0J3MgcmFuZG9tIHJlZmVyZW5jZSBoZXJlKVxyXG5jb25zdCByYW5kb21Tb3VyY2UgPSBNYXRoLnJhbmRvbTtcclxuXHJcbi8vIENvbnZlbmllbmNlIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIFZlY3RvcjIsIHVzZWQgdGhyb3VnaG91dCB0aGlzIGZpbGUgYXMgYW4gYWJicmV2aWF0aW9uIGZvciBhIGRpc3BsYWNlbWVudCwgYVxyXG4vLyBwb3NpdGlvbiBvciBhIHBvaW50LlxyXG5jb25zdCB2ID0gKCB4OiBudW1iZXIsIHk6IG51bWJlciApID0+IG5ldyBWZWN0b3IyKCB4LCB5ICk7XHJcblxyXG4vKipcclxuICogVGhlIHRlbnNpb24gcGFyYW1ldGVyIGNvbnRyb2xzIGhvdyBzbW9vdGhseSB0aGUgY3VydmUgdHVybnMgdGhyb3VnaCBpdHMgY29udHJvbCBwb2ludHMuIEZvciBhIENhdG11bGwtUm9tIGN1cnZlLFxyXG4gKiB0aGUgdGVuc2lvbiBpcyB6ZXJvLiBUaGUgdGVuc2lvbiBzaG91bGQgcmFuZ2UgZnJvbSAtMSB0byAxLlxyXG4gKiBAcGFyYW0gYmVmb3JlVmVjdG9yXHJcbiAqIEBwYXJhbSBjdXJyZW50VmVjdG9yXHJcbiAqIEBwYXJhbSBhZnRlclZlY3RvclxyXG4gKiBAcGFyYW0gdGVuc2lvbiAtIHRoZSB0ZW5zaW9uIHNob3VsZCByYW5nZSBmcm9tIC0xIHRvIDEuXHJcbiAqL1xyXG5jb25zdCB3ZWlnaHRlZFNwbGluZVZlY3RvciA9ICggYmVmb3JlVmVjdG9yOiBWZWN0b3IyLCBjdXJyZW50VmVjdG9yOiBWZWN0b3IyLCBhZnRlclZlY3RvcjogVmVjdG9yMiwgdGVuc2lvbjogbnVtYmVyICkgPT4ge1xyXG4gIHJldHVybiBhZnRlclZlY3Rvci5jb3B5KClcclxuICAgIC5zdWJ0cmFjdCggYmVmb3JlVmVjdG9yIClcclxuICAgIC5tdWx0aXBseVNjYWxhciggKCAxIC0gdGVuc2lvbiApIC8gNiApXHJcbiAgICAuYWRkKCBjdXJyZW50VmVjdG9yICk7XHJcbn07XHJcblxyXG4vLyBhIG5vcm1hbGl6ZWQgdmVjdG9yIGZvciBub24temVybyB3aW5kaW5nIGNoZWNrc1xyXG4vLyB2YXIgd2VpcmREaXIgPSB2KCBNYXRoLlBJLCAyMiAvIDcgKTtcclxuXHJcbmV4cG9ydCB0eXBlIFNlcmlhbGl6ZWRTaGFwZSA9IHtcclxuICB0eXBlOiAnU2hhcGUnO1xyXG4gIHN1YnBhdGhzOiBTZXJpYWxpemVkU3VicGF0aFtdO1xyXG59O1xyXG5cclxudHlwZSBDYXJkaW5hbFNwbGluZU9wdGlvbnMgPSB7XHJcbiAgLy8gdGhlIHRlbnNpb24gcGFyYW1ldGVyIGNvbnRyb2xzIGhvdyBzbW9vdGhseSB0aGUgY3VydmUgdHVybnMgdGhyb3VnaCBpdHNcclxuICAvLyBjb250cm9sIHBvaW50cy4gRm9yIGEgQ2F0bXVsbC1Sb20gY3VydmUgdGhlIHRlbnNpb24gaXMgemVyby5cclxuICAvLyB0aGUgdGVuc2lvbiBzaG91bGQgcmFuZ2UgZnJvbSAgLTEgdG8gMVxyXG4gIHRlbnNpb24/OiBudW1iZXI7XHJcblxyXG4gIC8vIGlzIHRoZSByZXN1bHRpbmcgc2hhcGUgZm9ybWluZyBhIGNsb3NlZCBsaW5lP1xyXG4gIGlzQ2xvc2VkTGluZVNlZ21lbnRzPzogYm9vbGVhbjtcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIE5vbmxpbmVhclRyYW5zZm9ybWVkT3B0aW9ucyA9IHtcclxuICAvLyB3aGV0aGVyIHRvIGluY2x1ZGUgYSBkZWZhdWx0IGN1cnZlRXBzaWxvbiAodXN1YWxseSBvZmYgYnkgZGVmYXVsdClcclxuICBpbmNsdWRlQ3VydmF0dXJlPzogYm9vbGVhbjtcclxufSAmIFBpZWNld2lzZUxpbmVhck9wdGlvbnM7XHJcblxyXG50eXBlIEdldERhc2hlZFNoYXBlT3B0aW9ucyA9IHtcclxuICAvLyBjb250cm9scyBsZXZlbCBvZiBzdWJkaXZpc2lvbiBieSBhdHRlbXB0aW5nIHRvIGVuc3VyZSBhIG1heGltdW0gKHNxdWFyZWQpIGRldmlhdGlvbiBmcm9tIHRoZSBjdXJ2ZVxyXG4gIGRpc3RhbmNlRXBzaWxvbj86IG51bWJlcjtcclxuXHJcbiAgLy8gY29udHJvbHMgbGV2ZWwgb2Ygc3ViZGl2aXNpb24gYnkgYXR0ZW1wdGluZyB0byBlbnN1cmUgYSBtYXhpbXVtIGN1cnZhdHVyZSBjaGFuZ2UgYmV0d2VlbiBzZWdtZW50c1xyXG4gIGN1cnZlRXBzaWxvbj86IG51bWJlcjtcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIENvcm5lclJhZGlpT3B0aW9ucyA9IHtcclxuICB0b3BMZWZ0OiBudW1iZXI7XHJcbiAgdG9wUmlnaHQ6IG51bWJlcjtcclxuICBib3R0b21SaWdodDogbnVtYmVyO1xyXG4gIGJvdHRvbUxlZnQ6IG51bWJlcjtcclxufTtcclxuXHJcbnR5cGUgT2Zmc2V0c09wdGlvbnMgPSB7XHJcbiAgbGVmdDogbnVtYmVyO1xyXG4gIHRvcDogbnVtYmVyO1xyXG4gIHJpZ2h0OiBudW1iZXI7XHJcbiAgYm90dG9tOiBudW1iZXI7XHJcbn07XHJcblxyXG4vLyBTVEFUSUMgQVBJIHRoYXQgaXMgdXNlZCB3aGVuIHR1cm5pbmcgcGFyc2VkIFNWRyBpbnRvIGEgU2hhcGUuIE1ldGhvZHMgd2l0aCB0aGVzZSB0eXBlcyB3aWxsIGJlIGNhbGxlZCBkdXJpbmcgdGhlXHJcbi8vIFwiYXBwbHkgcGFyc2VkIFNWR1wiIHN0ZXAuIElGIHRoZXNlIG5lZWQgdG8gYmUgY2hhbmdlZCwgaXQgd2lsbCBuZWVkIHRvIGJlIGFjY29tcGFuaWVkIGJ5IGNoYW5nZXMgdG8gc3ZnUGF0aC5wZWdqc1xyXG4vLyBhbmQgdGhlIFNWRyBwYXJzZXIuIElmIHdlIGNoYW5nZSB0aGlzIFdJVEhPVVQgZG9pbmcgdGhhdCwgdGhpbmdzIHdpbGwgYnJlYWsgKHNvIGJhc2ljYWxseSwgZG9uJ3QgY2hhbmdlIHRoaXMpLlxyXG50eXBlIENhbkFwcGx5UGFyc2VkU1ZHID0ge1xyXG4gIG1vdmVUbyggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogU2hhcGU7XHJcbiAgbW92ZVRvUmVsYXRpdmUoIHg6IG51bWJlciwgeTogbnVtYmVyICk6IFNoYXBlO1xyXG4gIGxpbmVUbyggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogU2hhcGU7XHJcbiAgbGluZVRvUmVsYXRpdmUoIHg6IG51bWJlciwgeTogbnVtYmVyICk6IFNoYXBlO1xyXG4gIGNsb3NlKCk6IFNoYXBlO1xyXG4gIGhvcml6b250YWxMaW5lVG8oIHg6IG51bWJlciApOiBTaGFwZTtcclxuICBob3Jpem9udGFsTGluZVRvUmVsYXRpdmUoIHg6IG51bWJlciApOiBTaGFwZTtcclxuICB2ZXJ0aWNhbExpbmVUbyggeTogbnVtYmVyICk6IFNoYXBlO1xyXG4gIHZlcnRpY2FsTGluZVRvUmVsYXRpdmUoIHk6IG51bWJlciApOiBTaGFwZTtcclxuICBjdWJpY0N1cnZlVG8oIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyOiBudW1iZXIsIHkyOiBudW1iZXIsIHg6IG51bWJlciwgeTogbnVtYmVyICk6IFNoYXBlO1xyXG4gIGN1YmljQ3VydmVUb1JlbGF0aXZlKCB4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4MjogbnVtYmVyLCB5MjogbnVtYmVyLCB4OiBudW1iZXIsIHk6IG51bWJlciApOiBTaGFwZTtcclxuICBzbW9vdGhDdWJpY0N1cnZlVG8oIHgyOiBudW1iZXIsIHkyOiBudW1iZXIsIHg6IG51bWJlciwgeTogbnVtYmVyICk6IFNoYXBlO1xyXG4gIHNtb290aEN1YmljQ3VydmVUb1JlbGF0aXZlKCB4MjogbnVtYmVyLCB5MjogbnVtYmVyLCB4OiBudW1iZXIsIHk6IG51bWJlciApOiBTaGFwZTtcclxuICBxdWFkcmF0aWNDdXJ2ZVRvKCB4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4OiBudW1iZXIsIHk6IG51bWJlciApOiBTaGFwZTtcclxuICBxdWFkcmF0aWNDdXJ2ZVRvUmVsYXRpdmUoIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHg6IG51bWJlciwgeTogbnVtYmVyICk6IFNoYXBlO1xyXG4gIHNtb290aFF1YWRyYXRpY0N1cnZlVG8oIHg6IG51bWJlciwgeTogbnVtYmVyICk6IFNoYXBlO1xyXG4gIHNtb290aFF1YWRyYXRpY0N1cnZlVG9SZWxhdGl2ZSggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogU2hhcGU7XHJcbiAgZWxsaXB0aWNhbEFyY1RvKCByeDogbnVtYmVyLCByeTogbnVtYmVyLCByb3RhdGlvbjogbnVtYmVyLCBsYXJnZUFyYzogYm9vbGVhbiwgc3dlZXA6IGJvb2xlYW4sIHg6IG51bWJlciwgeTogbnVtYmVyICk6IFNoYXBlO1xyXG4gIGVsbGlwdGljYWxBcmNUb1JlbGF0aXZlKCByeDogbnVtYmVyLCByeTogbnVtYmVyLCByb3RhdGlvbjogbnVtYmVyLCBsYXJnZUFyYzogYm9vbGVhbiwgc3dlZXA6IGJvb2xlYW4sIHg6IG51bWJlciwgeTogbnVtYmVyICk6IFNoYXBlO1xyXG59O1xyXG5cclxuLy8gVHlwZSBvZiB0aGUgcGFyc2VkIFNWRyBpdGVtIHRoYXQgaXMgcmV0dXJuZWQgYnkgdGhlIHBhcnNlciAoZnJvbSBzdmdQYXRoLmpzKVxyXG50eXBlIFBhcnNlZFNWR0l0ZW0gPSB7XHJcbiAgLy8gVHVybiBlYWNoIG1ldGhvZCBpbnRvIHsgY21kOiAnbWV0aG9kTmFtZScsIGFyZ3M6IFsgLi4uIF0gfVxyXG4gIFsgSyBpbiBrZXlvZiBDYW5BcHBseVBhcnNlZFNWRyBdOiBDYW5BcHBseVBhcnNlZFNWR1sgSyBdIGV4dGVuZHMgKCAuLi5hcmdzOiBpbmZlciBBcmdzICkgPT4gU2hhcGUgPyB7IGNtZDogSzsgYXJnczogQXJncyB9IDogbmV2ZXI7XHJcbn1bIGtleW9mIENhbkFwcGx5UGFyc2VkU1ZHIF07XHJcblxyXG5jbGFzcyBTaGFwZSBpbXBsZW1lbnRzIENhbkFwcGx5UGFyc2VkU1ZHIHtcclxuXHJcbiAgLy8gTG93ZXItbGV2ZWwgcGllY2V3aXNlIG1hdGhlbWF0aWNhbCBkZXNjcmlwdGlvbiB1c2luZyBzZWdtZW50cywgYWxzbyBpbmRpdmlkdWFsbHkgaW1tdXRhYmxlXHJcbiAgcHVibGljIHJlYWRvbmx5IHN1YnBhdGhzOiBTdWJwYXRoW10gPSBbXTtcclxuXHJcbiAgLy8gSWYgbm9uLW51bGwsIGNvbXB1dGVkIGJvdW5kcyBmb3IgYWxsIHBpZWNlcyBhZGRlZCBzbyBmYXIuIExhemlseSBjb21wdXRlZCB3aXRoIGdldEJvdW5kcy9ib3VuZHMgRVM1IGdldHRlclxyXG4gIHByaXZhdGUgX2JvdW5kczogQm91bmRzMiB8IG51bGw7XHJcblxyXG4gIC8vIFNvIHdlIGNhbiBpbnZhbGlkYXRlIGFsbCBvZiB0aGUgcG9pbnRzIHdpdGhvdXQgZmlyaW5nIGludmFsaWRhdGlvbiB0b25zIG9mIHRpbWVzXHJcbiAgcHJpdmF0ZSBfaW52YWxpZGF0aW5nUG9pbnRzID0gZmFsc2U7XHJcblxyXG4gIC8vIFdoZW4gc2V0IGJ5IG1ha2VJbW11dGFibGUoKSwgaXQgaW5kaWNhdGVzIHRoaXMgU2hhcGUgd29uJ3QgYmUgY2hhbmdlZCBmcm9tIG5vdyBvbiwgYW5kIGF0dGVtcHRzIHRvIGNoYW5nZSBpdCBtYXlcclxuICAvLyByZXN1bHQgaW4gZXJyb3JzLlxyXG4gIHByaXZhdGUgX2ltbXV0YWJsZSA9IGZhbHNlO1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgaW52YWxpZGF0ZWRFbWl0dGVyOiBUaW55RW1pdHRlciA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IF9pbnZhbGlkYXRlTGlzdGVuZXI6ICgpID0+IHZvaWQ7XHJcblxyXG4gIC8vIEZvciB0cmFja2luZyB0aGUgbGFzdCBxdWFkcmF0aWMvY3ViaWMgY29udHJvbCBwb2ludCBmb3Igc21vb3RoKiBmdW5jdGlvbnMsXHJcbiAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy8zOFxyXG4gIHByaXZhdGUgbGFzdFF1YWRyYXRpY0NvbnRyb2xQb2ludDogVmVjdG9yMiB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgbGFzdEN1YmljQ29udHJvbFBvaW50OiBWZWN0b3IyIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsbCBhcmd1bWVudHMgb3B0aW9uYWwsIHRoZXkgYXJlIGZvciB0aGUgY29weSgpIG1ldGhvZC4gaWYgdXNlZCwgZW5zdXJlIHRoYXQgJ2JvdW5kcycgaXMgY29uc2lzdGVudCB3aXRoICdzdWJwYXRocydcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHN1YnBhdGhzPzogU3VicGF0aFtdIHwgc3RyaW5nLCBib3VuZHM/OiBCb3VuZHMyICkge1xyXG5cclxuICAgIHRoaXMuX2JvdW5kcyA9IGJvdW5kcyA/IGJvdW5kcy5jb3B5KCkgOiBudWxsO1xyXG5cclxuICAgIHRoaXMucmVzZXRDb250cm9sUG9pbnRzKCk7XHJcblxyXG4gICAgdGhpcy5faW52YWxpZGF0ZUxpc3RlbmVyID0gdGhpcy5pbnZhbGlkYXRlLmJpbmQoIHRoaXMgKTtcclxuXHJcbiAgICAvLyBBZGQgaW4gc3VicGF0aHMgZnJvbSB0aGUgY29uc3RydWN0b3IgKGlmIGFwcGxpY2FibGUpXHJcbiAgICBpZiAoIHR5cGVvZiBzdWJwYXRocyA9PT0gJ29iamVjdCcgKSB7XHJcbiAgICAgIC8vIGFzc3VtZSBpdCdzIGFuIGFycmF5XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHN1YnBhdGhzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIHRoaXMuYWRkU3VicGF0aCggc3VicGF0aHNbIGkgXSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBzdWJwYXRocyAmJiB0eXBlb2Ygc3VicGF0aHMgIT09ICdvYmplY3QnICkge1xyXG4gICAgICAvLyBwYXJzZSB0aGUgU1ZHIHBhdGhcclxuICAgICAgXy5lYWNoKCBzdmdQYXRoLnBhcnNlKCBzdWJwYXRocyApLCAoIGl0ZW06IFBhcnNlZFNWR0l0ZW0gKSA9PiB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggU2hhcGUucHJvdG90eXBlWyBpdGVtLmNtZCBdICE9PSB1bmRlZmluZWQsIGBtZXRob2QgJHtpdGVtLmNtZH0gZnJvbSBwYXJzZWQgU1ZHIGRvZXMgbm90IGV4aXN0YCApO1xyXG5cclxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gVGhpcyBpcyBhIHZhbGlkIGNhbGwsIGJ1dCBUeXBlU2NyaXB0IGlzbid0IGZpZ3VyaW5nIGl0IG91dCBiYXNlZCBvbiB0aGUgdW5pb24gdHlwZSByaWdodCBub3dcclxuICAgICAgICB0aGlzWyBpdGVtLmNtZCBdLmFwcGx5KCB0aGlzLCBpdGVtLmFyZ3MgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBwcmVmZXItc3ByZWFkXHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBkZWZpbmVzIF9ib3VuZHMgaWYgbm90IGFscmVhZHkgZGVmaW5lZCAoYW1vbmcgb3RoZXIgdGhpbmdzKVxyXG4gICAgdGhpcy5pbnZhbGlkYXRlKCk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzZXRzIHRoZSBjb250cm9sIHBvaW50c1xyXG4gICAqXHJcbiAgICogZm9yIHRyYWNraW5nIHRoZSBsYXN0IHF1YWRyYXRpYy9jdWJpYyBjb250cm9sIHBvaW50IGZvciBzbW9vdGgqIGZ1bmN0aW9uc1xyXG4gICAqIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvMzhcclxuICAgKi9cclxuICBwcml2YXRlIHJlc2V0Q29udHJvbFBvaW50cygpOiB2b2lkIHtcclxuICAgIHRoaXMubGFzdFF1YWRyYXRpY0NvbnRyb2xQb2ludCA9IG51bGw7XHJcbiAgICB0aGlzLmxhc3RDdWJpY0NvbnRyb2xQb2ludCA9IG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBxdWFkcmF0aWMgY29udHJvbCBwb2ludFxyXG4gICAqL1xyXG4gIHByaXZhdGUgc2V0UXVhZHJhdGljQ29udHJvbFBvaW50KCBwb2ludDogVmVjdG9yMiApOiB2b2lkIHtcclxuICAgIHRoaXMubGFzdFF1YWRyYXRpY0NvbnRyb2xQb2ludCA9IHBvaW50O1xyXG4gICAgdGhpcy5sYXN0Q3ViaWNDb250cm9sUG9pbnQgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgY3ViaWMgY29udHJvbCBwb2ludFxyXG4gICAqL1xyXG4gIHByaXZhdGUgc2V0Q3ViaWNDb250cm9sUG9pbnQoIHBvaW50OiBWZWN0b3IyICk6IHZvaWQge1xyXG4gICAgdGhpcy5sYXN0UXVhZHJhdGljQ29udHJvbFBvaW50ID0gbnVsbDtcclxuICAgIHRoaXMubGFzdEN1YmljQ29udHJvbFBvaW50ID0gcG9pbnQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb3ZlcyB0byBhIHBvaW50IGdpdmVuIGJ5IHRoZSBjb29yZGluYXRlcyB4IGFuZCB5XHJcbiAgICovXHJcbiAgcHVibGljIG1vdmVUbyggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeCApLCBgeCBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHt4fWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB5ICksIGB5IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3l9YCApO1xyXG4gICAgcmV0dXJuIHRoaXMubW92ZVRvUG9pbnQoIHYoIHgsIHkgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW92ZXMgYSByZWxhdGl2ZSBkaXNwbGFjZW1lbnQgKHgseSkgZnJvbSBsYXN0IHBvaW50XHJcbiAgICovXHJcbiAgcHVibGljIG1vdmVUb1JlbGF0aXZlKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB4ICksIGB4IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3h9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHkgKSwgYHkgbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7eX1gICk7XHJcbiAgICByZXR1cm4gdGhpcy5tb3ZlVG9Qb2ludFJlbGF0aXZlKCB2KCB4LCB5ICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vdmVzIGEgcmVsYXRpdmUgZGlzcGxhY2VtZW50IChwb2ludCkgZnJvbSBsYXN0IHBvaW50XHJcbiAgICovXHJcbiAgcHVibGljIG1vdmVUb1BvaW50UmVsYXRpdmUoIGRpc3BsYWNlbWVudDogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLm1vdmVUb1BvaW50KCB0aGlzLmdldFJlbGF0aXZlUG9pbnQoKS5wbHVzKCBkaXNwbGFjZW1lbnQgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyB0byB0aGlzIHNoYXBlIGEgc3VicGF0aCB0aGF0IG1vdmVzIChubyBqb2ludCkgaXQgdG8gYSBwb2ludFxyXG4gICAqL1xyXG4gIHB1YmxpYyBtb3ZlVG9Qb2ludCggcG9pbnQ6IFZlY3RvcjIgKTogdGhpcyB7XHJcbiAgICB0aGlzLmFkZFN1YnBhdGgoIG5ldyBTdWJwYXRoKCkuYWRkUG9pbnQoIHBvaW50ICkgKTtcclxuICAgIHRoaXMucmVzZXRDb250cm9sUG9pbnRzKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGZvciBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyB0byB0aGlzIHNoYXBlIGEgc3RyYWlnaHQgbGluZSBmcm9tIGxhc3QgcG9pbnQgdG8gdGhlIGNvb3JkaW5hdGUgKHgseSlcclxuICAgKi9cclxuICBwdWJsaWMgbGluZVRvKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB4ICksIGB4IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3h9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHkgKSwgYHkgbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7eX1gICk7XHJcbiAgICByZXR1cm4gdGhpcy5saW5lVG9Qb2ludCggdiggeCwgeSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIHRvIHRoaXMgc2hhcGUgYSBzdHJhaWdodCBsaW5lIGRpc3BsYWNlZCBieSBhIHJlbGF0aXZlIGFtb3VudCB4LCBhbmQgeSBmcm9tIGxhc3QgcG9pbnRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB4IC0gaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnRcclxuICAgKiBAcGFyYW0geSAtIHZlcnRpY2FsIGRpc3BsYWNlbWVudFxyXG4gICAqL1xyXG4gIHB1YmxpYyBsaW5lVG9SZWxhdGl2ZSggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeCApLCBgeCBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHt4fWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB5ICksIGB5IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3l9YCApO1xyXG4gICAgcmV0dXJuIHRoaXMubGluZVRvUG9pbnRSZWxhdGl2ZSggdiggeCwgeSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIHRvIHRoaXMgc2hhcGUgYSBzdHJhaWdodCBsaW5lIGRpc3BsYWNlZCBieSBhIHJlbGF0aXZlIGRpc3BsYWNlbWVudCAocG9pbnQpXHJcbiAgICovXHJcbiAgcHVibGljIGxpbmVUb1BvaW50UmVsYXRpdmUoIGRpc3BsYWNlbWVudDogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLmxpbmVUb1BvaW50KCB0aGlzLmdldFJlbGF0aXZlUG9pbnQoKS5wbHVzKCBkaXNwbGFjZW1lbnQgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyB0byB0aGlzIHNoYXBlIGEgc3RyYWlnaHQgbGluZSBmcm9tIHRoaXMgbGFzdFBvaW50IHRvIHBvaW50XHJcbiAgICovXHJcbiAgcHVibGljIGxpbmVUb1BvaW50KCBwb2ludDogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIC8vIHNlZSBodHRwOi8vd3d3LnczLm9yZy9UUi8yZGNvbnRleHQvI2RvbS1jb250ZXh0LTJkLWxpbmV0b1xyXG4gICAgaWYgKCB0aGlzLmhhc1N1YnBhdGhzKCkgKSB7XHJcbiAgICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5nZXRMYXN0U3VicGF0aCgpLmdldExhc3RQb2ludCgpO1xyXG4gICAgICBjb25zdCBlbmQgPSBwb2ludDtcclxuICAgICAgY29uc3QgbGluZSA9IG5ldyBMaW5lKCBzdGFydCwgZW5kICk7XHJcbiAgICAgIHRoaXMuZ2V0TGFzdFN1YnBhdGgoKS5hZGRQb2ludCggZW5kICk7XHJcbiAgICAgIHRoaXMuYWRkU2VnbWVudEFuZEJvdW5kcyggbGluZSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMuZW5zdXJlKCBwb2ludCApO1xyXG4gICAgfVxyXG4gICAgdGhpcy5yZXNldENvbnRyb2xQb2ludHMoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpczsgIC8vIGZvciBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIGhvcml6b250YWwgbGluZSAoeCByZXByZXNlbnRzIHRoZSB4LWNvb3JkaW5hdGUgb2YgdGhlIGVuZCBwb2ludClcclxuICAgKi9cclxuICBwdWJsaWMgaG9yaXpvbnRhbExpbmVUbyggeDogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMubGluZVRvKCB4LCB0aGlzLmdldFJlbGF0aXZlUG9pbnQoKS55ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgaG9yaXpvbnRhbCBsaW5lICh4IHJlcHJlc2VudCBhIGhvcml6b250YWwgZGlzcGxhY2VtZW50KVxyXG4gICAqL1xyXG4gIHB1YmxpYyBob3Jpem9udGFsTGluZVRvUmVsYXRpdmUoIHg6IG51bWJlciApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLmxpbmVUb1JlbGF0aXZlKCB4LCAwICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgdmVydGljYWwgbGluZSAoeSByZXByZXNlbnRzIHRoZSB5LWNvb3JkaW5hdGUgb2YgdGhlIGVuZCBwb2ludClcclxuICAgKi9cclxuICBwdWJsaWMgdmVydGljYWxMaW5lVG8oIHk6IG51bWJlciApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLmxpbmVUbyggdGhpcy5nZXRSZWxhdGl2ZVBvaW50KCkueCwgeSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIHZlcnRpY2FsIGxpbmUgKHkgcmVwcmVzZW50cyBhIHZlcnRpY2FsIGRpc3BsYWNlbWVudClcclxuICAgKi9cclxuICBwdWJsaWMgdmVydGljYWxMaW5lVG9SZWxhdGl2ZSggeTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMubGluZVRvUmVsYXRpdmUoIDAsIHkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFppZy16YWdzIGJldHdlZW4gdGhlIGN1cnJlbnQgcG9pbnQgYW5kIHRoZSBzcGVjaWZpZWQgcG9pbnRcclxuICAgKlxyXG4gICAqIEBwYXJhbSBlbmRYIC0gdGhlIGVuZCBvZiB0aGUgc2hhcGVcclxuICAgKiBAcGFyYW0gZW5kWSAtIHRoZSBlbmQgb2YgdGhlIHNoYXBlXHJcbiAgICogQHBhcmFtIGFtcGxpdHVkZSAtIHRoZSB2ZXJ0aWNhbCBhbXBsaXR1ZGUgb2YgdGhlIHppZyB6YWcgd2F2ZVxyXG4gICAqIEBwYXJhbSBudW1iZXJaaWdaYWdzIC0gdGhlIG51bWJlciBvZiBvc2NpbGxhdGlvbnNcclxuICAgKiBAcGFyYW0gc3ltbWV0cmljYWwgLSBmbGFnIGZvciBkcmF3aW5nIGEgc3ltbWV0cmljYWwgemlnIHphZ1xyXG4gICAqL1xyXG4gIHB1YmxpYyB6aWdaYWdUbyggZW5kWDogbnVtYmVyLCBlbmRZOiBudW1iZXIsIGFtcGxpdHVkZTogbnVtYmVyLCBudW1iZXJaaWdaYWdzOiBudW1iZXIsIHN5bW1ldHJpY2FsOiBib29sZWFuICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMuemlnWmFnVG9Qb2ludCggbmV3IFZlY3RvcjIoIGVuZFgsIGVuZFkgKSwgYW1wbGl0dWRlLCBudW1iZXJaaWdaYWdzLCBzeW1tZXRyaWNhbCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogWmlnLXphZ3MgYmV0d2VlbiB0aGUgY3VycmVudCBwb2ludCBhbmQgdGhlIHNwZWNpZmllZCBwb2ludC5cclxuICAgKiBJbXBsZW1lbnRhdGlvbiBtb3ZlZCBmcm9tIGNpcmN1aXQtY29uc3RydWN0aW9uLWtpdC1jb21tb24gb24gQXByaWwgMjIsIDIwMTkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZW5kUG9pbnQgLSB0aGUgZW5kIG9mIHRoZSBzaGFwZVxyXG4gICAqIEBwYXJhbSBhbXBsaXR1ZGUgLSB0aGUgdmVydGljYWwgYW1wbGl0dWRlIG9mIHRoZSB6aWcgemFnIHdhdmUsIHNpZ25lZCB0byBjaG9vc2UgaW5pdGlhbCBkaXJlY3Rpb25cclxuICAgKiBAcGFyYW0gbnVtYmVyWmlnWmFncyAtIHRoZSBudW1iZXIgb2YgY29tcGxldGUgb3NjaWxsYXRpb25zXHJcbiAgICogQHBhcmFtIHN5bW1ldHJpY2FsIC0gZmxhZyBmb3IgZHJhd2luZyBhIHN5bW1ldHJpY2FsIHppZyB6YWdcclxuICAgKi9cclxuICBwdWJsaWMgemlnWmFnVG9Qb2ludCggZW5kUG9pbnQ6IFZlY3RvcjIsIGFtcGxpdHVkZTogbnVtYmVyLCBudW1iZXJaaWdaYWdzOiBudW1iZXIsIHN5bW1ldHJpY2FsOiBib29sZWFuICk6IHRoaXMge1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIE51bWJlci5pc0ludGVnZXIoIG51bWJlclppZ1phZ3MgKSwgYG51bWJlclppZ1phZ3MgbXVzdCBiZSBhbiBpbnRlZ2VyOiAke251bWJlclppZ1phZ3N9YCApO1xyXG5cclxuICAgIHRoaXMuZW5zdXJlKCBlbmRQb2ludCApO1xyXG4gICAgY29uc3Qgc3RhcnRQb2ludCA9IHRoaXMuZ2V0TGFzdFBvaW50KCk7XHJcbiAgICBjb25zdCBkZWx0YSA9IGVuZFBvaW50Lm1pbnVzKCBzdGFydFBvaW50ICk7XHJcbiAgICBjb25zdCBkaXJlY3Rpb25Vbml0VmVjdG9yID0gZGVsdGEubm9ybWFsaXplZCgpO1xyXG4gICAgY29uc3QgYW1wbGl0dWRlTm9ybWFsVmVjdG9yID0gZGlyZWN0aW9uVW5pdFZlY3Rvci5wZXJwZW5kaWN1bGFyLnRpbWVzKCBhbXBsaXR1ZGUgKTtcclxuXHJcbiAgICBsZXQgd2F2ZWxlbmd0aDtcclxuICAgIGlmICggc3ltbWV0cmljYWwgKSB7XHJcbiAgICAgIC8vIHRoZSB3YXZlbGVuZ3RoIGlzIHNob3J0ZXIgdG8gYWRkIGhhbGYgYSB3YXZlLlxyXG4gICAgICB3YXZlbGVuZ3RoID0gZGVsdGEubWFnbml0dWRlIC8gKCBudW1iZXJaaWdaYWdzICsgMC41ICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgd2F2ZWxlbmd0aCA9IGRlbHRhLm1hZ25pdHVkZSAvIG51bWJlclppZ1phZ3M7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbnVtYmVyWmlnWmFnczsgaSsrICkge1xyXG4gICAgICBjb25zdCB3YXZlT3JpZ2luID0gZGlyZWN0aW9uVW5pdFZlY3Rvci50aW1lcyggaSAqIHdhdmVsZW5ndGggKS5wbHVzKCBzdGFydFBvaW50ICk7XHJcbiAgICAgIGNvbnN0IHRvcFBvaW50ID0gd2F2ZU9yaWdpbi5wbHVzKCBkaXJlY3Rpb25Vbml0VmVjdG9yLnRpbWVzKCB3YXZlbGVuZ3RoIC8gNCApICkucGx1cyggYW1wbGl0dWRlTm9ybWFsVmVjdG9yICk7XHJcbiAgICAgIGNvbnN0IGJvdHRvbVBvaW50ID0gd2F2ZU9yaWdpbi5wbHVzKCBkaXJlY3Rpb25Vbml0VmVjdG9yLnRpbWVzKCAzICogd2F2ZWxlbmd0aCAvIDQgKSApLm1pbnVzKCBhbXBsaXR1ZGVOb3JtYWxWZWN0b3IgKTtcclxuICAgICAgdGhpcy5saW5lVG9Qb2ludCggdG9wUG9pbnQgKTtcclxuICAgICAgdGhpcy5saW5lVG9Qb2ludCggYm90dG9tUG9pbnQgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGQgbGFzdCBoYWxmIG9mIHRoZSB3YXZlbGVuZ3RoXHJcbiAgICBpZiAoIHN5bW1ldHJpY2FsICkge1xyXG4gICAgICBjb25zdCB3YXZlT3JpZ2luID0gZGlyZWN0aW9uVW5pdFZlY3Rvci50aW1lcyggbnVtYmVyWmlnWmFncyAqIHdhdmVsZW5ndGggKS5wbHVzKCBzdGFydFBvaW50ICk7XHJcbiAgICAgIGNvbnN0IHRvcFBvaW50ID0gd2F2ZU9yaWdpbi5wbHVzKCBkaXJlY3Rpb25Vbml0VmVjdG9yLnRpbWVzKCB3YXZlbGVuZ3RoIC8gNCApICkucGx1cyggYW1wbGl0dWRlTm9ybWFsVmVjdG9yICk7XHJcbiAgICAgIHRoaXMubGluZVRvUG9pbnQoIHRvcFBvaW50ICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMubGluZVRvUG9pbnQoIGVuZFBvaW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgcXVhZHJhdGljIGN1cnZlIHRvIHRoaXMgc2hhcGVcclxuICAgKlxyXG4gICAqIFRoZSBjdXJ2ZSBpcyBndWFyYW50ZWVkIHRvIHBhc3MgdGhyb3VnaCB0aGUgY29vcmRpbmF0ZSAoeCx5KSBidXQgZG9lcyBub3QgcGFzcyB0aHJvdWdoIHRoZSBjb250cm9sIHBvaW50XHJcbiAgICpcclxuICAgKiBAcGFyYW0gY3B4IC0gY29udHJvbCBwb2ludCBob3Jpem9udGFsIGNvb3JkaW5hdGVcclxuICAgKiBAcGFyYW0gY3B5IC0gY29udHJvbCBwb2ludCB2ZXJ0aWNhbCBjb29yZGluYXRlXHJcbiAgICogQHBhcmFtIHhcclxuICAgKiBAcGFyYW0geVxyXG4gICAqL1xyXG4gIHB1YmxpYyBxdWFkcmF0aWNDdXJ2ZVRvKCBjcHg6IG51bWJlciwgY3B5OiBudW1iZXIsIHg6IG51bWJlciwgeTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGNweCApLCBgY3B4IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke2NweH1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggY3B5ICksIGBjcHkgbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7Y3B5fWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB4ICksIGB4IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3h9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHkgKSwgYHkgbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7eX1gICk7XHJcbiAgICByZXR1cm4gdGhpcy5xdWFkcmF0aWNDdXJ2ZVRvUG9pbnQoIHYoIGNweCwgY3B5ICksIHYoIHgsIHkgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIHF1YWRyYXRpYyBjdXJ2ZSB0byB0aGlzIHNoYXBlLiBUaGUgY29udHJvbCBhbmQgZmluYWwgcG9pbnRzIGFyZSBzcGVjaWZpZWQgYXMgZGlzcGxhY21lbnQgZnJvbSB0aGUgbGFzdFxyXG4gICAqIHBvaW50IGluIHRoaXMgc2hhcGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSBjcHggLSBjb250cm9sIHBvaW50IGhvcml6b250YWwgY29vcmRpbmF0ZVxyXG4gICAqIEBwYXJhbSBjcHkgLSBjb250cm9sIHBvaW50IHZlcnRpY2FsIGNvb3JkaW5hdGVcclxuICAgKiBAcGFyYW0geCAtIGZpbmFsIHggcG9zaXRpb24gb2YgdGhlIHF1YWRyYXRpYyBjdXJ2ZVxyXG4gICAqIEBwYXJhbSB5IC0gZmluYWwgeSBwb3NpdGlvbiBvZiB0aGUgcXVhZHJhdGljIGN1cnZlXHJcbiAgICovXHJcbiAgcHVibGljIHF1YWRyYXRpY0N1cnZlVG9SZWxhdGl2ZSggY3B4OiBudW1iZXIsIGNweTogbnVtYmVyLCB4OiBudW1iZXIsIHk6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBjcHggKSwgYGNweCBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHtjcHh9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGNweSApLCBgY3B5IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke2NweX1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeCApLCBgeCBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHt4fWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB5ICksIGB5IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3l9YCApO1xyXG4gICAgcmV0dXJuIHRoaXMucXVhZHJhdGljQ3VydmVUb1BvaW50UmVsYXRpdmUoIHYoIGNweCwgY3B5ICksIHYoIHgsIHkgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIHF1YWRyYXRpYyBjdXJ2ZSB0byB0aGlzIHNoYXBlLiBUaGUgY29udHJvbCBhbmQgZmluYWwgcG9pbnRzIGFyZSBzcGVjaWZpZWQgYXMgZGlzcGxhY2VtZW50IGZyb20gdGhlXHJcbiAgICogbGFzdCBwb2ludCBpbiB0aGlzIHNoYXBlXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY29udHJvbFBvaW50XHJcbiAgICogQHBhcmFtIHBvaW50IC0gdGhlIHF1YWRyYXRpYyBjdXJ2ZSBwYXNzZXMgdGhyb3VnaCB0aGlzIHBvaW50XHJcbiAgICovXHJcbiAgcHVibGljIHF1YWRyYXRpY0N1cnZlVG9Qb2ludFJlbGF0aXZlKCBjb250cm9sUG9pbnQ6IFZlY3RvcjIsIHBvaW50OiBWZWN0b3IyICk6IHRoaXMge1xyXG4gICAgY29uc3QgcmVsYXRpdmVQb2ludCA9IHRoaXMuZ2V0UmVsYXRpdmVQb2ludCgpO1xyXG4gICAgcmV0dXJuIHRoaXMucXVhZHJhdGljQ3VydmVUb1BvaW50KCByZWxhdGl2ZVBvaW50LnBsdXMoIGNvbnRyb2xQb2ludCApLCByZWxhdGl2ZVBvaW50LnBsdXMoIHBvaW50ICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBxdWFkcmF0aWMgY3VydmUgdG8gdGhpcyBzaGFwZS4gVGhlIHF1YWRyYXRpYyBjdXJ2ZXMgcGFzc2VzIHRocm91Z2ggdGhlIHggYW5kIHkgY29vcmRpbmF0ZS5cclxuICAgKiBUaGUgc2hhcGUgc2hvdWxkIGpvaW4gc21vb3RobHkgd2l0aCB0aGUgcHJldmlvdXMgc3VicGF0aHNcclxuICAgKlxyXG4gICAqIFRPRE86IGNvbnNpZGVyIGEgcmVuYW1lIHRvIHB1dCAnc21vb3RoJyBmYXJ0aGVyIGJhY2s/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHggLSBmaW5hbCB4IHBvc2l0aW9uIG9mIHRoZSBxdWFkcmF0aWMgY3VydmVcclxuICAgKiBAcGFyYW0geSAtIGZpbmFsIHkgcG9zaXRpb24gb2YgdGhlIHF1YWRyYXRpYyBjdXJ2ZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzbW9vdGhRdWFkcmF0aWNDdXJ2ZVRvKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB4ICksIGB4IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3h9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHkgKSwgYHkgbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7eX1gICk7XHJcbiAgICByZXR1cm4gdGhpcy5xdWFkcmF0aWNDdXJ2ZVRvUG9pbnQoIHRoaXMuZ2V0U21vb3RoUXVhZHJhdGljQ29udHJvbFBvaW50KCksIHYoIHgsIHkgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIHF1YWRyYXRpYyBjdXJ2ZSB0byB0aGlzIHNoYXBlLiBUaGUgcXVhZHJhdGljIGN1cnZlcyBwYXNzZXMgdGhyb3VnaCB0aGUgeCBhbmQgeSBjb29yZGluYXRlLlxyXG4gICAqIFRoZSBzaGFwZSBzaG91bGQgam9pbiBzbW9vdGhseSB3aXRoIHRoZSBwcmV2aW91cyBzdWJwYXRoc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHggLSBmaW5hbCB4IHBvc2l0aW9uIG9mIHRoZSBxdWFkcmF0aWMgY3VydmVcclxuICAgKiBAcGFyYW0geSAtIGZpbmFsIHkgcG9zaXRpb24gb2YgdGhlIHF1YWRyYXRpYyBjdXJ2ZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzbW9vdGhRdWFkcmF0aWNDdXJ2ZVRvUmVsYXRpdmUoIHg6IG51bWJlciwgeTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHggKSwgYHggbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7eH1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeSApLCBgeSBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHt5fWAgKTtcclxuICAgIHJldHVybiB0aGlzLnF1YWRyYXRpY0N1cnZlVG9Qb2ludCggdGhpcy5nZXRTbW9vdGhRdWFkcmF0aWNDb250cm9sUG9pbnQoKSwgdiggeCwgeSApLnBsdXMoIHRoaXMuZ2V0UmVsYXRpdmVQb2ludCgpICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBxdWFkcmF0aWMgYmV6aWVyIGN1cnZlIHRvIHRoaXMgc2hhcGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY29udHJvbFBvaW50XHJcbiAgICogQHBhcmFtIHBvaW50IC0gdGhlIHF1YWRyYXRpYyBjdXJ2ZSBwYXNzZXMgdGhyb3VnaCB0aGlzIHBvaW50XHJcbiAgICovXHJcbiAgcHVibGljIHF1YWRyYXRpY0N1cnZlVG9Qb2ludCggY29udHJvbFBvaW50OiBWZWN0b3IyLCBwb2ludDogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIC8vIHNlZSBodHRwOi8vd3d3LnczLm9yZy9UUi8yZGNvbnRleHQvI2RvbS1jb250ZXh0LTJkLXF1YWRyYXRpY2N1cnZldG9cclxuICAgIHRoaXMuZW5zdXJlKCBjb250cm9sUG9pbnQgKTtcclxuICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5nZXRMYXN0U3VicGF0aCgpLmdldExhc3RQb2ludCgpO1xyXG4gICAgY29uc3QgcXVhZHJhdGljID0gbmV3IFF1YWRyYXRpYyggc3RhcnQsIGNvbnRyb2xQb2ludCwgcG9pbnQgKTtcclxuICAgIHRoaXMuZ2V0TGFzdFN1YnBhdGgoKS5hZGRQb2ludCggcG9pbnQgKTtcclxuICAgIGNvbnN0IG5vbmRlZ2VuZXJhdGVTZWdtZW50cyA9IHF1YWRyYXRpYy5nZXROb25kZWdlbmVyYXRlU2VnbWVudHMoKTtcclxuICAgIF8uZWFjaCggbm9uZGVnZW5lcmF0ZVNlZ21lbnRzLCBzZWdtZW50ID0+IHtcclxuICAgICAgLy8gVE9ETzogb3B0aW1pemF0aW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgICB0aGlzLmFkZFNlZ21lbnRBbmRCb3VuZHMoIHNlZ21lbnQgKTtcclxuICAgIH0gKTtcclxuICAgIHRoaXMuc2V0UXVhZHJhdGljQ29udHJvbFBvaW50KCBjb250cm9sUG9pbnQgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpczsgIC8vIGZvciBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIGN1YmljIGJlemllciBjdXJ2ZSB0byB0aGlzIHNoYXBlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNwMXggLSBjb250cm9sIHBvaW50IDEsICBob3Jpem9udGFsIGNvb3JkaW5hdGVcclxuICAgKiBAcGFyYW0gY3AxeSAtIGNvbnRyb2wgcG9pbnQgMSwgIHZlcnRpY2FsIGNvb3JkaW5hdGVcclxuICAgKiBAcGFyYW0gY3AyeCAtIGNvbnRyb2wgcG9pbnQgMiwgIGhvcml6b250YWwgY29vcmRpbmF0ZVxyXG4gICAqIEBwYXJhbSBjcDJ5IC0gY29udHJvbCBwb2ludCAyLCAgdmVydGljYWwgY29vcmRpbmF0ZVxyXG4gICAqIEBwYXJhbSB4IC0gZmluYWwgeCBwb3NpdGlvbiBvZiB0aGUgY3ViaWMgY3VydmVcclxuICAgKiBAcGFyYW0geSAtIGZpbmFsIHkgcG9zaXRpb24gb2YgdGhlIGN1YmljIGN1cnZlXHJcbiAgICovXHJcbiAgcHVibGljIGN1YmljQ3VydmVUbyggY3AxeDogbnVtYmVyLCBjcDF5OiBudW1iZXIsIGNwMng6IG51bWJlciwgY3AyeTogbnVtYmVyLCB4OiBudW1iZXIsIHk6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBjcDF4ICksIGBjcDF4IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke2NwMXh9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGNwMXkgKSwgYGNwMXkgbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7Y3AxeX1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggY3AyeCApLCBgY3AyeCBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHtjcDJ4fWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBjcDJ5ICksIGBjcDJ5IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke2NwMnl9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHggKSwgYHggbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7eH1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeSApLCBgeSBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHt5fWAgKTtcclxuICAgIHJldHVybiB0aGlzLmN1YmljQ3VydmVUb1BvaW50KCB2KCBjcDF4LCBjcDF5ICksIHYoIGNwMngsIGNwMnkgKSwgdiggeCwgeSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gY3AxeCAtIGNvbnRyb2wgcG9pbnQgMSwgIGhvcml6b250YWwgZGlzcGxhY2VtZW50XHJcbiAgICogQHBhcmFtIGNwMXkgLSBjb250cm9sIHBvaW50IDEsICB2ZXJ0aWNhbCBkaXNwbGFjZW1lbnRcclxuICAgKiBAcGFyYW0gY3AyeCAtIGNvbnRyb2wgcG9pbnQgMiwgIGhvcml6b250YWwgZGlzcGxhY2VtZW50XHJcbiAgICogQHBhcmFtIGNwMnkgLSBjb250cm9sIHBvaW50IDIsICB2ZXJ0aWNhbCBkaXNwbGFjZW1lbnRcclxuICAgKiBAcGFyYW0geCAtIGZpbmFsIGhvcml6b250YWwgZGlzcGxhY2VtZW50XHJcbiAgICogQHBhcmFtIHkgLSBmaW5hbCB2ZXJ0aWNhbCBkaXNwbGFjbWVudFxyXG4gICAqL1xyXG4gIHB1YmxpYyBjdWJpY0N1cnZlVG9SZWxhdGl2ZSggY3AxeDogbnVtYmVyLCBjcDF5OiBudW1iZXIsIGNwMng6IG51bWJlciwgY3AyeTogbnVtYmVyLCB4OiBudW1iZXIsIHk6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBjcDF4ICksIGBjcDF4IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke2NwMXh9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGNwMXkgKSwgYGNwMXkgbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7Y3AxeX1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggY3AyeCApLCBgY3AyeCBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHtjcDJ4fWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBjcDJ5ICksIGBjcDJ5IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke2NwMnl9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHggKSwgYHggbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7eH1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeSApLCBgeSBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHt5fWAgKTtcclxuICAgIHJldHVybiB0aGlzLmN1YmljQ3VydmVUb1BvaW50UmVsYXRpdmUoIHYoIGNwMXgsIGNwMXkgKSwgdiggY3AyeCwgY3AyeSApLCB2KCB4LCB5ICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBjb250cm9sMSAtIGNvbnRyb2wgZGlzcGxhY2VtZW50ICAxXHJcbiAgICogQHBhcmFtIGNvbnRyb2wyIC0gY29udHJvbCBkaXNwbGFjZW1lbnQgMlxyXG4gICAqIEBwYXJhbSBwb2ludCAtIGZpbmFsIGRpc3BsYWNlbWVudFxyXG4gICAqL1xyXG4gIHB1YmxpYyBjdWJpY0N1cnZlVG9Qb2ludFJlbGF0aXZlKCBjb250cm9sMTogVmVjdG9yMiwgY29udHJvbDI6IFZlY3RvcjIsIHBvaW50OiBWZWN0b3IyICk6IHRoaXMge1xyXG4gICAgY29uc3QgcmVsYXRpdmVQb2ludCA9IHRoaXMuZ2V0UmVsYXRpdmVQb2ludCgpO1xyXG4gICAgcmV0dXJuIHRoaXMuY3ViaWNDdXJ2ZVRvUG9pbnQoIHJlbGF0aXZlUG9pbnQucGx1cyggY29udHJvbDEgKSwgcmVsYXRpdmVQb2ludC5wbHVzKCBjb250cm9sMiApLCByZWxhdGl2ZVBvaW50LnBsdXMoIHBvaW50ICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBjcDJ4IC0gY29udHJvbCBwb2ludCAyLCAgaG9yaXpvbnRhbCBjb29yZGluYXRlXHJcbiAgICogQHBhcmFtIGNwMnkgLSBjb250cm9sIHBvaW50IDIsICB2ZXJ0aWNhbCBjb29yZGluYXRlXHJcbiAgICogQHBhcmFtIHhcclxuICAgKiBAcGFyYW0geVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzbW9vdGhDdWJpY0N1cnZlVG8oIGNwMng6IG51bWJlciwgY3AyeTogbnVtYmVyLCB4OiBudW1iZXIsIHk6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBjcDJ4ICksIGBjcDJ4IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke2NwMnh9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGNwMnkgKSwgYGNwMnkgbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7Y3AyeX1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeCApLCBgeCBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHt4fWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB5ICksIGB5IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3l9YCApO1xyXG4gICAgcmV0dXJuIHRoaXMuY3ViaWNDdXJ2ZVRvUG9pbnQoIHRoaXMuZ2V0U21vb3RoQ3ViaWNDb250cm9sUG9pbnQoKSwgdiggY3AyeCwgY3AyeSApLCB2KCB4LCB5ICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBjcDJ4IC0gY29udHJvbCBwb2ludCAyLCAgaG9yaXpvbnRhbCBjb29yZGluYXRlXHJcbiAgICogQHBhcmFtIGNwMnkgLSBjb250cm9sIHBvaW50IDIsICB2ZXJ0aWNhbCBjb29yZGluYXRlXHJcbiAgICogQHBhcmFtIHhcclxuICAgKiBAcGFyYW0geVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzbW9vdGhDdWJpY0N1cnZlVG9SZWxhdGl2ZSggY3AyeDogbnVtYmVyLCBjcDJ5OiBudW1iZXIsIHg6IG51bWJlciwgeTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGNwMnggKSwgYGNwMnggbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7Y3AyeH1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggY3AyeSApLCBgY3AyeSBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHtjcDJ5fWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB4ICksIGB4IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3h9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHkgKSwgYHkgbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7eX1gICk7XHJcbiAgICByZXR1cm4gdGhpcy5jdWJpY0N1cnZlVG9Qb2ludCggdGhpcy5nZXRTbW9vdGhDdWJpY0NvbnRyb2xQb2ludCgpLCB2KCBjcDJ4LCBjcDJ5ICkucGx1cyggdGhpcy5nZXRSZWxhdGl2ZVBvaW50KCkgKSwgdiggeCwgeSApLnBsdXMoIHRoaXMuZ2V0UmVsYXRpdmVQb2ludCgpICkgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBjdWJpY0N1cnZlVG9Qb2ludCggY29udHJvbDE6IFZlY3RvcjIsIGNvbnRyb2wyOiBWZWN0b3IyLCBwb2ludDogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIC8vIHNlZSBodHRwOi8vd3d3LnczLm9yZy9UUi8yZGNvbnRleHQvI2RvbS1jb250ZXh0LTJkLXF1YWRyYXRpY2N1cnZldG9cclxuICAgIHRoaXMuZW5zdXJlKCBjb250cm9sMSApO1xyXG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLmdldExhc3RTdWJwYXRoKCkuZ2V0TGFzdFBvaW50KCk7XHJcbiAgICBjb25zdCBjdWJpYyA9IG5ldyBDdWJpYyggc3RhcnQsIGNvbnRyb2wxLCBjb250cm9sMiwgcG9pbnQgKTtcclxuXHJcbiAgICBjb25zdCBub25kZWdlbmVyYXRlU2VnbWVudHMgPSBjdWJpYy5nZXROb25kZWdlbmVyYXRlU2VnbWVudHMoKTtcclxuICAgIF8uZWFjaCggbm9uZGVnZW5lcmF0ZVNlZ21lbnRzLCBzZWdtZW50ID0+IHtcclxuICAgICAgdGhpcy5hZGRTZWdtZW50QW5kQm91bmRzKCBzZWdtZW50ICk7XHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmdldExhc3RTdWJwYXRoKCkuYWRkUG9pbnQoIHBvaW50ICk7XHJcblxyXG4gICAgdGhpcy5zZXRDdWJpY0NvbnRyb2xQb2ludCggY29udHJvbDIgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpczsgIC8vIGZvciBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGNlbnRlclggLSBob3Jpem9udGFsIGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRlciBvZiB0aGUgYXJjXHJcbiAgICogQHBhcmFtIGNlbnRlclkgLSBDZW50ZXIgb2YgdGhlIGFyY1xyXG4gICAqIEBwYXJhbSByYWRpdXMgLSBIb3cgZmFyIGZyb20gdGhlIGNlbnRlciB0aGUgYXJjIHdpbGwgYmVcclxuICAgKiBAcGFyYW0gc3RhcnRBbmdsZSAtIEFuZ2xlIChyYWRpYW5zKSBvZiB0aGUgc3RhcnQgb2YgdGhlIGFyY1xyXG4gICAqIEBwYXJhbSBlbmRBbmdsZSAtIEFuZ2xlIChyYWRpYW5zKSBvZiB0aGUgZW5kIG9mIHRoZSBhcmNcclxuICAgKiBAcGFyYW0gW2FudGljbG9ja3dpc2VdIC0gRGVjaWRlcyB3aGljaCBkaXJlY3Rpb24gdGhlIGFyYyB0YWtlcyBhcm91bmQgdGhlIGNlbnRlclxyXG4gICAqL1xyXG4gIHB1YmxpYyBhcmMoIGNlbnRlclg6IG51bWJlciwgY2VudGVyWTogbnVtYmVyLCByYWRpdXM6IG51bWJlciwgc3RhcnRBbmdsZTogbnVtYmVyLCBlbmRBbmdsZTogbnVtYmVyLCBhbnRpY2xvY2t3aXNlPzogYm9vbGVhbiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBjZW50ZXJYICksIGBjZW50ZXJYIG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke2NlbnRlclh9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGNlbnRlclkgKSwgYGNlbnRlclkgbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7Y2VudGVyWX1gICk7XHJcbiAgICByZXR1cm4gdGhpcy5hcmNQb2ludCggdiggY2VudGVyWCwgY2VudGVyWSApLCByYWRpdXMsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlLCBhbnRpY2xvY2t3aXNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gY2VudGVyIC0gQ2VudGVyIG9mIHRoZSBhcmMgKGV2ZXJ5IHBvaW50IG9uIHRoZSBhcmMgaXMgZXF1YWxseSBmYXIgZnJvbSB0aGUgY2VudGVyKVxyXG4gICAqIEBwYXJhbSByYWRpdXMgLSBIb3cgZmFyIGZyb20gdGhlIGNlbnRlciB0aGUgYXJjIHdpbGwgYmVcclxuICAgKiBAcGFyYW0gc3RhcnRBbmdsZSAtIEFuZ2xlIChyYWRpYW5zKSBvZiB0aGUgc3RhcnQgb2YgdGhlIGFyY1xyXG4gICAqIEBwYXJhbSBlbmRBbmdsZSAtIEFuZ2xlIChyYWRpYW5zKSBvZiB0aGUgZW5kIG9mIHRoZSBhcmNcclxuICAgKiBAcGFyYW0gW2FudGljbG9ja3dpc2VdIC0gRGVjaWRlcyB3aGljaCBkaXJlY3Rpb24gdGhlIGFyYyB0YWtlcyBhcm91bmQgdGhlIGNlbnRlclxyXG4gICAqL1xyXG4gIHB1YmxpYyBhcmNQb2ludCggY2VudGVyOiBWZWN0b3IyLCByYWRpdXM6IG51bWJlciwgc3RhcnRBbmdsZTogbnVtYmVyLCBlbmRBbmdsZTogbnVtYmVyLCBhbnRpY2xvY2t3aXNlPzogYm9vbGVhbiApOiB0aGlzIHtcclxuICAgIC8vIHNlZSBodHRwOi8vd3d3LnczLm9yZy9UUi8yZGNvbnRleHQvI2RvbS1jb250ZXh0LTJkLWFyY1xyXG4gICAgaWYgKCBhbnRpY2xvY2t3aXNlID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgIGFudGljbG9ja3dpc2UgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhcmMgPSBuZXcgQXJjKCBjZW50ZXIsIHJhZGl1cywgc3RhcnRBbmdsZSwgZW5kQW5nbGUsIGFudGljbG9ja3dpc2UgKTtcclxuXHJcbiAgICAvLyB3ZSBhcmUgYXNzdW1pbmcgdGhhdCB0aGUgbm9ybWFsIGNvbmRpdGlvbnMgd2VyZSBhbHJlYWR5IG1ldCAob3IgZXhjZXB0aW9uZWQgb3V0KSBzbyB0aGF0IHRoZXNlIGFjdHVhbGx5IHdvcmsgd2l0aCBjYW52YXNcclxuICAgIGNvbnN0IHN0YXJ0UG9pbnQgPSBhcmMuZ2V0U3RhcnQoKTtcclxuICAgIGNvbnN0IGVuZFBvaW50ID0gYXJjLmdldEVuZCgpO1xyXG5cclxuICAgIC8vIGlmIHRoZXJlIGlzIGFscmVhZHkgYSBwb2ludCBvbiB0aGUgc3VicGF0aCwgYW5kIGl0IGlzIGRpZmZlcmVudCB0aGFuIG91ciBzdGFydGluZyBwb2ludCwgZHJhdyBhIGxpbmUgYmV0d2VlbiB0aGVtXHJcbiAgICBpZiAoIHRoaXMuaGFzU3VicGF0aHMoKSAmJiB0aGlzLmdldExhc3RTdWJwYXRoKCkuZ2V0TGVuZ3RoKCkgPiAwICYmICFzdGFydFBvaW50LmVxdWFscyggdGhpcy5nZXRMYXN0U3VicGF0aCgpLmdldExhc3RQb2ludCgpICkgKSB7XHJcbiAgICAgIHRoaXMuYWRkU2VnbWVudEFuZEJvdW5kcyggbmV3IExpbmUoIHRoaXMuZ2V0TGFzdFN1YnBhdGgoKS5nZXRMYXN0UG9pbnQoKSwgc3RhcnRQb2ludCApICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCAhdGhpcy5oYXNTdWJwYXRocygpICkge1xyXG4gICAgICB0aGlzLmFkZFN1YnBhdGgoIG5ldyBTdWJwYXRoKCkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB0ZWNobmljYWxseSB0aGUgQ2FudmFzIHNwZWMgc2F5cyB0byBhZGQgdGhlIHN0YXJ0IHBvaW50LCBzbyB3ZSBkbyB0aGlzIGV2ZW4gdGhvdWdoIGl0IGlzIHByb2JhYmx5IGNvbXBsZXRlbHkgdW5uZWNlc3NhcnkgKHRoZXJlIGlzIG5vIGNvbmRpdGlvbmFsKVxyXG4gICAgdGhpcy5nZXRMYXN0U3VicGF0aCgpLmFkZFBvaW50KCBzdGFydFBvaW50ICk7XHJcbiAgICB0aGlzLmdldExhc3RTdWJwYXRoKCkuYWRkUG9pbnQoIGVuZFBvaW50ICk7XHJcblxyXG4gICAgdGhpcy5hZGRTZWdtZW50QW5kQm91bmRzKCBhcmMgKTtcclxuICAgIHRoaXMucmVzZXRDb250cm9sUG9pbnRzKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7ICAvLyBmb3IgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gZWxsaXB0aWNhbCBhcmNcclxuICAgKlxyXG4gICAqIEBwYXJhbSBjZW50ZXJYIC0gaG9yaXpvbnRhbCBjb29yZGluYXRlIG9mIHRoZSBjZW50ZXIgb2YgdGhlIGFyY1xyXG4gICAqIEBwYXJhbSBjZW50ZXJZIC0gIHZlcnRpY2FsIGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRlciBvZiB0aGUgYXJjXHJcbiAgICogQHBhcmFtIHJhZGl1c1ggLSBzZW1pIGF4aXNcclxuICAgKiBAcGFyYW0gcmFkaXVzWSAtIHNlbWkgYXhpc1xyXG4gICAqIEBwYXJhbSByb3RhdGlvbiAtIHJvdGF0aW9uIG9mIHRoZSBlbGxpcHRpY2FsIGFyYyB3aXRoIHJlc3BlY3QgdG8gdGhlIHBvc2l0aXZlIHggYXhpcy5cclxuICAgKiBAcGFyYW0gc3RhcnRBbmdsZVxyXG4gICAqIEBwYXJhbSBlbmRBbmdsZVxyXG4gICAqIEBwYXJhbSBbYW50aWNsb2Nrd2lzZV1cclxuICAgKi9cclxuICBwdWJsaWMgZWxsaXB0aWNhbEFyYyggY2VudGVyWDogbnVtYmVyLCBjZW50ZXJZOiBudW1iZXIsIHJhZGl1c1g6IG51bWJlciwgcmFkaXVzWTogbnVtYmVyLCByb3RhdGlvbjogbnVtYmVyLCBzdGFydEFuZ2xlOiBudW1iZXIsIGVuZEFuZ2xlOiBudW1iZXIsIGFudGljbG9ja3dpc2U/OiBib29sZWFuICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGNlbnRlclggKSwgYGNlbnRlclggbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7Y2VudGVyWH1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggY2VudGVyWSApLCBgY2VudGVyWSBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHtjZW50ZXJZfWAgKTtcclxuICAgIHJldHVybiB0aGlzLmVsbGlwdGljYWxBcmNQb2ludCggdiggY2VudGVyWCwgY2VudGVyWSApLCByYWRpdXNYLCByYWRpdXNZLCByb3RhdGlvbiwgc3RhcnRBbmdsZSwgZW5kQW5nbGUsIGFudGljbG9ja3dpc2UgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gZWxsaXB0aWMgYXJjXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY2VudGVyXHJcbiAgICogQHBhcmFtIHJhZGl1c1hcclxuICAgKiBAcGFyYW0gcmFkaXVzWVxyXG4gICAqIEBwYXJhbSByb3RhdGlvbiAtIHJvdGF0aW9uIG9mIHRoZSBhcmMgd2l0aCByZXNwZWN0IHRvIHRoZSBwb3NpdGl2ZSB4IGF4aXMuXHJcbiAgICogQHBhcmFtIHN0YXJ0QW5nbGUgLVxyXG4gICAqIEBwYXJhbSBlbmRBbmdsZVxyXG4gICAqIEBwYXJhbSBbYW50aWNsb2Nrd2lzZV1cclxuICAgKi9cclxuICBwdWJsaWMgZWxsaXB0aWNhbEFyY1BvaW50KCBjZW50ZXI6IFZlY3RvcjIsIHJhZGl1c1g6IG51bWJlciwgcmFkaXVzWTogbnVtYmVyLCByb3RhdGlvbjogbnVtYmVyLCBzdGFydEFuZ2xlOiBudW1iZXIsIGVuZEFuZ2xlOiBudW1iZXIsIGFudGljbG9ja3dpc2U/OiBib29sZWFuICk6IHRoaXMge1xyXG4gICAgLy8gc2VlIGh0dHA6Ly93d3cudzMub3JnL1RSLzJkY29udGV4dC8jZG9tLWNvbnRleHQtMmQtYXJjXHJcbiAgICBpZiAoIGFudGljbG9ja3dpc2UgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgYW50aWNsb2Nrd2lzZSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGVsbGlwdGljYWxBcmMgPSBuZXcgRWxsaXB0aWNhbEFyYyggY2VudGVyLCByYWRpdXNYLCByYWRpdXNZLCByb3RhdGlvbiwgc3RhcnRBbmdsZSwgZW5kQW5nbGUsIGFudGljbG9ja3dpc2UgKTtcclxuXHJcbiAgICAvLyB3ZSBhcmUgYXNzdW1pbmcgdGhhdCB0aGUgbm9ybWFsIGNvbmRpdGlvbnMgd2VyZSBhbHJlYWR5IG1ldCAob3IgZXhjZXB0aW9uZWQgb3V0KSBzbyB0aGF0IHRoZXNlIGFjdHVhbGx5IHdvcmsgd2l0aCBjYW52YXNcclxuICAgIGNvbnN0IHN0YXJ0UG9pbnQgPSBlbGxpcHRpY2FsQXJjLnN0YXJ0O1xyXG4gICAgY29uc3QgZW5kUG9pbnQgPSBlbGxpcHRpY2FsQXJjLmVuZDtcclxuXHJcbiAgICAvLyBpZiB0aGVyZSBpcyBhbHJlYWR5IGEgcG9pbnQgb24gdGhlIHN1YnBhdGgsIGFuZCBpdCBpcyBkaWZmZXJlbnQgdGhhbiBvdXIgc3RhcnRpbmcgcG9pbnQsIGRyYXcgYSBsaW5lIGJldHdlZW4gdGhlbVxyXG4gICAgaWYgKCB0aGlzLmhhc1N1YnBhdGhzKCkgJiYgdGhpcy5nZXRMYXN0U3VicGF0aCgpLmdldExlbmd0aCgpID4gMCAmJiAhc3RhcnRQb2ludC5lcXVhbHMoIHRoaXMuZ2V0TGFzdFN1YnBhdGgoKS5nZXRMYXN0UG9pbnQoKSApICkge1xyXG4gICAgICB0aGlzLmFkZFNlZ21lbnRBbmRCb3VuZHMoIG5ldyBMaW5lKCB0aGlzLmdldExhc3RTdWJwYXRoKCkuZ2V0TGFzdFBvaW50KCksIHN0YXJ0UG9pbnQgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggIXRoaXMuaGFzU3VicGF0aHMoKSApIHtcclxuICAgICAgdGhpcy5hZGRTdWJwYXRoKCBuZXcgU3VicGF0aCgpICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdGVjaG5pY2FsbHkgdGhlIENhbnZhcyBzcGVjIHNheXMgdG8gYWRkIHRoZSBzdGFydCBwb2ludCwgc28gd2UgZG8gdGhpcyBldmVuIHRob3VnaCBpdCBpcyBwcm9iYWJseSBjb21wbGV0ZWx5IHVubmVjZXNzYXJ5ICh0aGVyZSBpcyBubyBjb25kaXRpb25hbClcclxuICAgIHRoaXMuZ2V0TGFzdFN1YnBhdGgoKS5hZGRQb2ludCggc3RhcnRQb2ludCApO1xyXG4gICAgdGhpcy5nZXRMYXN0U3VicGF0aCgpLmFkZFBvaW50KCBlbmRQb2ludCApO1xyXG5cclxuICAgIHRoaXMuYWRkU2VnbWVudEFuZEJvdW5kcyggZWxsaXB0aWNhbEFyYyApO1xyXG4gICAgdGhpcy5yZXNldENvbnRyb2xQb2ludHMoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpczsgIC8vIGZvciBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIHN1YnBhdGggdGhhdCBqb2lucyB0aGUgbGFzdCBwb2ludCBvZiB0aGlzIHNoYXBlIHRvIHRoZSBmaXJzdCBwb2ludCB0byBmb3JtIGEgY2xvc2VkIHNoYXBlXHJcbiAgICpcclxuICAgKi9cclxuICBwdWJsaWMgY2xvc2UoKTogdGhpcyB7XHJcbiAgICBpZiAoIHRoaXMuaGFzU3VicGF0aHMoKSApIHtcclxuICAgICAgY29uc3QgcHJldmlvdXNQYXRoID0gdGhpcy5nZXRMYXN0U3VicGF0aCgpO1xyXG4gICAgICBjb25zdCBuZXh0UGF0aCA9IG5ldyBTdWJwYXRoKCk7XHJcblxyXG4gICAgICBwcmV2aW91c1BhdGguY2xvc2UoKTtcclxuICAgICAgdGhpcy5hZGRTdWJwYXRoKCBuZXh0UGF0aCApO1xyXG4gICAgICBuZXh0UGF0aC5hZGRQb2ludCggcHJldmlvdXNQYXRoLmdldEZpcnN0UG9pbnQoKSApO1xyXG4gICAgfVxyXG4gICAgdGhpcy5yZXNldENvbnRyb2xQb2ludHMoKTtcclxuICAgIHJldHVybiB0aGlzOyAgLy8gZm9yIGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb3ZlcyB0byB0aGUgbmV4dCBzdWJwYXRoLCBidXQgd2l0aG91dCBhZGRpbmcgYW55IHBvaW50cyB0byBpdCAobGlrZSBhIG1vdmVUbyB3b3VsZCBkbykuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHBhcnRpY3VsYXJseSBoZWxwZnVsIGZvciBjYXNlcyB3aGVyZSB5b3UgZG9uJ3Qgd2FudCB0byBoYXZlIHRvIGNvbXB1dGUgdGhlIGV4cGxpY2l0IHN0YXJ0aW5nIHBvaW50IG9mXHJcbiAgICogdGhlIG5leHQgc3VicGF0aC4gRm9yIGluc3RhbmNlLCBpZiB5b3Ugd2FudCB0aHJlZSBkaXNjb25uZWN0ZWQgY2lyY2xlczpcclxuICAgKiAtIHNoYXBlLmNpcmNsZSggNTAsIDUwLCAyMCApLm5ld1N1YnBhdGgoKS5jaXJjbGUoIDEwMCwgMTAwLCAyMCApLm5ld1N1YnBhdGgoKS5jaXJjbGUoIDE1MCwgNTAsIDIwIClcclxuICAgKlxyXG4gICAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzIgZm9yIG1vcmUgaW5mby5cclxuICAgKi9cclxuICBwdWJsaWMgbmV3U3VicGF0aCgpOiB0aGlzIHtcclxuICAgIHRoaXMuYWRkU3VicGF0aCggbmV3IFN1YnBhdGgoKSApO1xyXG4gICAgdGhpcy5yZXNldENvbnRyb2xQb2ludHMoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpczsgLy8gZm9yIGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYWtlcyB0aGlzIFNoYXBlIGltbXV0YWJsZSwgc28gdGhhdCBhdHRlbXB0cyB0byBmdXJ0aGVyIGNoYW5nZSB0aGUgU2hhcGUgd2lsbCBmYWlsLiBUaGlzIGFsbG93cyBjbGllbnRzIHRvIGF2b2lkXHJcbiAgICogYWRkaW5nIGNoYW5nZSBsaXN0ZW5lcnMgdG8gdGhpcyBTaGFwZS5cclxuICAgKi9cclxuICBwdWJsaWMgbWFrZUltbXV0YWJsZSgpOiB0aGlzIHtcclxuICAgIHRoaXMuX2ltbXV0YWJsZSA9IHRydWU7XHJcblxyXG4gICAgdGhpcy5ub3RpZnlJbnZhbGlkYXRpb25MaXN0ZW5lcnMoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpczsgLy8gZm9yIGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBTaGFwZSBpcyBpbW11dGFibGUgKHNlZSBtYWtlSW1tdXRhYmxlIGZvciBkZXRhaWxzKS5cclxuICAgKi9cclxuICBwdWJsaWMgaXNJbW11dGFibGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5faW1tdXRhYmxlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWF0Y2hlcyBTVkcncyBlbGxpcHRpY2FsIGFyYyBmcm9tIGh0dHA6Ly93d3cudzMub3JnL1RSL1NWRy9wYXRocy5odG1sXHJcbiAgICpcclxuICAgKiBXQVJOSU5HOiByb3RhdGlvbiAoZm9yIG5vdykgaXMgaW4gREVHUkVFUy4gVGhpcyB3aWxsIHByb2JhYmx5IGNoYW5nZSBpbiB0aGUgZnV0dXJlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHJhZGl1c1ggLSBTZW1pLW1ham9yIGF4aXMgc2l6ZVxyXG4gICAqIEBwYXJhbSByYWRpdXNZIC0gU2VtaS1taW5vciBheGlzIHNpemVcclxuICAgKiBAcGFyYW0gcm90YXRpb24gLSBSb3RhdGlvbiBvZiB0aGUgZWxsaXBzZSAoaXRzIHNlbWktbWFqb3IgYXhpcylcclxuICAgKiBAcGFyYW0gbGFyZ2VBcmMgLSBXaGV0aGVyIHRoZSBhcmMgd2lsbCBnbyB0aGUgbG9uZ2VzdCByb3V0ZSBhcm91bmQgdGhlIGVsbGlwc2UuXHJcbiAgICogQHBhcmFtIHN3ZWVwIC0gV2hldGhlciB0aGUgYXJjIG1hZGUgZ29lcyBmcm9tIHN0YXJ0IHRvIGVuZCBcImNsb2Nrd2lzZVwiIChvcHBvc2l0ZSBvZiBhbnRpY2xvY2t3aXNlIGZsYWcpXHJcbiAgICogQHBhcmFtIHggLSBFbmQgcG9pbnQgWCBwb3NpdGlvblxyXG4gICAqIEBwYXJhbSB5IC0gRW5kIHBvaW50IFkgcG9zaXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZWxsaXB0aWNhbEFyY1RvUmVsYXRpdmUoIHJhZGl1c1g6IG51bWJlciwgcmFkaXVzWTogbnVtYmVyLCByb3RhdGlvbjogbnVtYmVyLCBsYXJnZUFyYzogYm9vbGVhbiwgc3dlZXA6IGJvb2xlYW4sIHg6IG51bWJlciwgeTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgY29uc3QgcmVsYXRpdmVQb2ludCA9IHRoaXMuZ2V0UmVsYXRpdmVQb2ludCgpO1xyXG4gICAgcmV0dXJuIHRoaXMuZWxsaXB0aWNhbEFyY1RvKCByYWRpdXNYLCByYWRpdXNZLCByb3RhdGlvbiwgbGFyZ2VBcmMsIHN3ZWVwLCB4ICsgcmVsYXRpdmVQb2ludC54LCB5ICsgcmVsYXRpdmVQb2ludC55ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYXRjaGVzIFNWRydzIGVsbGlwdGljYWwgYXJjIGZyb20gaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHL3BhdGhzLmh0bWxcclxuICAgKlxyXG4gICAqIFdBUk5JTkc6IHJvdGF0aW9uIChmb3Igbm93KSBpcyBpbiBERUdSRUVTLiBUaGlzIHdpbGwgcHJvYmFibHkgY2hhbmdlIGluIHRoZSBmdXR1cmUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcmFkaXVzWCAtIFNlbWktbWFqb3IgYXhpcyBzaXplXHJcbiAgICogQHBhcmFtIHJhZGl1c1kgLSBTZW1pLW1pbm9yIGF4aXMgc2l6ZVxyXG4gICAqIEBwYXJhbSByb3RhdGlvbiAtIFJvdGF0aW9uIG9mIHRoZSBlbGxpcHNlIChpdHMgc2VtaS1tYWpvciBheGlzKVxyXG4gICAqIEBwYXJhbSBsYXJnZUFyYyAtIFdoZXRoZXIgdGhlIGFyYyB3aWxsIGdvIHRoZSBsb25nZXN0IHJvdXRlIGFyb3VuZCB0aGUgZWxsaXBzZS5cclxuICAgKiBAcGFyYW0gc3dlZXAgLSBXaGV0aGVyIHRoZSBhcmMgbWFkZSBnb2VzIGZyb20gc3RhcnQgdG8gZW5kIFwiY2xvY2t3aXNlXCIgKG9wcG9zaXRlIG9mIGFudGljbG9ja3dpc2UgZmxhZylcclxuICAgKiBAcGFyYW0geCAtIEVuZCBwb2ludCBYIHBvc2l0aW9uXHJcbiAgICogQHBhcmFtIHkgLSBFbmQgcG9pbnQgWSBwb3NpdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBlbGxpcHRpY2FsQXJjVG8oIHJhZGl1c1g6IG51bWJlciwgcmFkaXVzWTogbnVtYmVyLCByb3RhdGlvbjogbnVtYmVyLCBsYXJnZUFyYzogYm9vbGVhbiwgc3dlZXA6IGJvb2xlYW4sIHg6IG51bWJlciwgeTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgLy8gU2VlIFwiRi42LjUgQ29udmVyc2lvbiBmcm9tIGVuZHBvaW50IHRvIGNlbnRlciBwYXJhbWV0ZXJpemF0aW9uXCJcclxuICAgIC8vIGluIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9TVkcvaW1wbG5vdGUuaHRtbCNBcmNJbXBsZW1lbnRhdGlvbk5vdGVzXHJcblxyXG4gICAgY29uc3QgZW5kUG9pbnQgPSBuZXcgVmVjdG9yMiggeCwgeSApO1xyXG4gICAgdGhpcy5lbnN1cmUoIGVuZFBvaW50ICk7XHJcblxyXG4gICAgY29uc3Qgc3RhcnRQb2ludCA9IHRoaXMuZ2V0TGFzdFN1YnBhdGgoKS5nZXRMYXN0UG9pbnQoKTtcclxuICAgIHRoaXMuZ2V0TGFzdFN1YnBhdGgoKS5hZGRQb2ludCggZW5kUG9pbnQgKTtcclxuXHJcbiAgICAvLyBBYnNvbHV0ZSB2YWx1ZSBhcHBsaWVkIHRvIHJhZGlpIChwZXIgU1ZHIHNwZWMpXHJcbiAgICBpZiAoIHJhZGl1c1ggPCAwICkgeyByYWRpdXNYICo9IC0xLjA7IH1cclxuICAgIGlmICggcmFkaXVzWSA8IDAgKSB7IHJhZGl1c1kgKj0gLTEuMDsgfVxyXG5cclxuICAgIGxldCByeHMgPSByYWRpdXNYICogcmFkaXVzWDtcclxuICAgIGxldCByeXMgPSByYWRpdXNZICogcmFkaXVzWTtcclxuICAgIGNvbnN0IHByaW1lID0gc3RhcnRQb2ludC5taW51cyggZW5kUG9pbnQgKS5kaXZpZGVkU2NhbGFyKCAyICkucm90YXRlZCggLXJvdGF0aW9uICk7XHJcbiAgICBjb25zdCBweHMgPSBwcmltZS54ICogcHJpbWUueDtcclxuICAgIGNvbnN0IHB5cyA9IHByaW1lLnkgKiBwcmltZS55O1xyXG4gICAgbGV0IGNlbnRlclByaW1lID0gbmV3IFZlY3RvcjIoIHJhZGl1c1ggKiBwcmltZS55IC8gcmFkaXVzWSwgLXJhZGl1c1kgKiBwcmltZS54IC8gcmFkaXVzWCApO1xyXG5cclxuICAgIC8vIElmIHRoZSByYWRpaSBhcmUgbm90IGxhcmdlIGVub3VnaCB0byBhY2NvbW9kYXRlIHRoZSBzdGFydC9lbmQgcG9pbnQsIGFwcGx5IEYuNi42IGNvcnJlY3Rpb25cclxuICAgIGNvbnN0IHNpemUgPSBweHMgLyByeHMgKyBweXMgLyByeXM7XHJcbiAgICBpZiAoIHNpemUgPiAxICkge1xyXG4gICAgICByYWRpdXNYICo9IE1hdGguc3FydCggc2l6ZSApO1xyXG4gICAgICByYWRpdXNZICo9IE1hdGguc3FydCggc2l6ZSApO1xyXG5cclxuICAgICAgLy8gcmVkbyBzb21lIGNvbXB1dGF0aW9ucyBmcm9tIGFib3ZlXHJcbiAgICAgIHJ4cyA9IHJhZGl1c1ggKiByYWRpdXNYO1xyXG4gICAgICByeXMgPSByYWRpdXNZICogcmFkaXVzWTtcclxuICAgICAgY2VudGVyUHJpbWUgPSBuZXcgVmVjdG9yMiggcmFkaXVzWCAqIHByaW1lLnkgLyByYWRpdXNZLCAtcmFkaXVzWSAqIHByaW1lLnggLyByYWRpdXNYICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTmFtaW5nIG1hdGNoZXMgaHR0cHM6Ly93d3cudzMub3JnL1RSL1NWRy9pbXBsbm90ZS5odG1sI0FyY0ltcGxlbWVudGF0aW9uTm90ZXMgZm9yXHJcbiAgICAvLyBGLjYuNSBDb252ZXJzaW9uIGZyb20gZW5kcG9pbnQgdG8gY2VudGVyIHBhcmFtZXRlcml6YXRpb25cclxuXHJcbiAgICBjZW50ZXJQcmltZS5tdWx0aXBseVNjYWxhciggTWF0aC5zcXJ0KCBNYXRoLm1heCggMCwgKCByeHMgKiByeXMgLSByeHMgKiBweXMgLSByeXMgKiBweHMgKSAvICggcnhzICogcHlzICsgcnlzICogcHhzICkgKSApICk7XHJcbiAgICBpZiAoIGxhcmdlQXJjID09PSBzd2VlcCApIHtcclxuICAgICAgLy8gRnJvbSBzcGVjOiB3aGVyZSB0aGUgKyBzaWduIGlzIGNob3NlbiBpZiBmQSDiiaAgZlMsIGFuZCB0aGUg4oiSIHNpZ24gaXMgY2hvc2VuIGlmIGZBID0gZlMuXHJcbiAgICAgIGNlbnRlclByaW1lLm11bHRpcGx5U2NhbGFyKCAtMSApO1xyXG4gICAgfVxyXG4gICAgY29uc3QgY2VudGVyID0gc3RhcnRQb2ludC5ibGVuZCggZW5kUG9pbnQsIDAuNSApLnBsdXMoIGNlbnRlclByaW1lLnJvdGF0ZWQoIHJvdGF0aW9uICkgKTtcclxuXHJcbiAgICBjb25zdCBzaWduZWRBbmdsZSA9ICggdTogVmVjdG9yMiwgdjogVmVjdG9yMiApID0+IHtcclxuICAgICAgLy8gRnJvbSBzcGVjOiB3aGVyZSB0aGUgwrEgc2lnbiBhcHBlYXJpbmcgaGVyZSBpcyB0aGUgc2lnbiBvZiB1eCB2eSDiiJIgdXkgdnguXHJcbiAgICAgIHJldHVybiAoICggdS54ICogdi55IC0gdS55ICogdi54ICkgPiAwID8gMSA6IC0xICkgKiB1LmFuZ2xlQmV0d2VlbiggdiApO1xyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCB2aWN0b3IgPSBuZXcgVmVjdG9yMiggKCBwcmltZS54IC0gY2VudGVyUHJpbWUueCApIC8gcmFkaXVzWCwgKCBwcmltZS55IC0gY2VudGVyUHJpbWUueSApIC8gcmFkaXVzWSApO1xyXG4gICAgY29uc3Qgcm9zcyA9IG5ldyBWZWN0b3IyKCAoIC1wcmltZS54IC0gY2VudGVyUHJpbWUueCApIC8gcmFkaXVzWCwgKCAtcHJpbWUueSAtIGNlbnRlclByaW1lLnkgKSAvIHJhZGl1c1kgKTtcclxuICAgIGNvbnN0IHN0YXJ0QW5nbGUgPSBzaWduZWRBbmdsZSggVmVjdG9yMi5YX1VOSVQsIHZpY3RvciApO1xyXG4gICAgbGV0IGRlbHRhQW5nbGUgPSBzaWduZWRBbmdsZSggdmljdG9yLCByb3NzICkgJSAoIE1hdGguUEkgKiAyICk7XHJcblxyXG4gICAgLy8gRnJvbSBzcGVjOlxyXG4gICAgLy8gPiBJbiBvdGhlciB3b3JkcywgaWYgZlMgPSAwIGFuZCB0aGUgcmlnaHQgc2lkZSBvZiAoRi42LjUuNikgaXMgZ3JlYXRlciB0aGFuIDAsIHRoZW4gc3VidHJhY3QgMzYwwrAsIHdoZXJlYXMgaWZcclxuICAgIC8vID4gZlMgPSAxIGFuZCB0aGUgcmlnaHQgc2lkZSBvZiAoRi42LjUuNikgaXMgbGVzcyB0aGFuIDAsIHRoZW4gYWRkIDM2MMKwLiBJbiBhbGwgb3RoZXIgY2FzZXMgbGVhdmUgaXQgYXMgaXMuXHJcbiAgICBpZiAoICFzd2VlcCAmJiBkZWx0YUFuZ2xlID4gMCApIHtcclxuICAgICAgZGVsdGFBbmdsZSAtPSBNYXRoLlBJICogMjtcclxuICAgIH1cclxuICAgIGlmICggc3dlZXAgJiYgZGVsdGFBbmdsZSA8IDAgKSB7XHJcbiAgICAgIGRlbHRhQW5nbGUgKz0gTWF0aC5QSSAqIDI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RhbmRhcmQgaGFuZGxpbmcgb2YgZGVnZW5lcmF0ZSBzZWdtZW50cyAocGFydGljdWxhcmx5LCBjb252ZXJ0aW5nIGVsbGlwdGljYWwgYXJjcyB0byBjaXJjdWxhciBhcmNzKVxyXG4gICAgY29uc3QgZWxsaXB0aWNhbEFyYyA9IG5ldyBFbGxpcHRpY2FsQXJjKCBjZW50ZXIsIHJhZGl1c1gsIHJhZGl1c1ksIHJvdGF0aW9uLCBzdGFydEFuZ2xlLCBzdGFydEFuZ2xlICsgZGVsdGFBbmdsZSwgIXN3ZWVwICk7XHJcbiAgICBjb25zdCBub25kZWdlbmVyYXRlU2VnbWVudHMgPSBlbGxpcHRpY2FsQXJjLmdldE5vbmRlZ2VuZXJhdGVTZWdtZW50cygpO1xyXG4gICAgXy5lYWNoKCBub25kZWdlbmVyYXRlU2VnbWVudHMsIHNlZ21lbnQgPT4ge1xyXG4gICAgICB0aGlzLmFkZFNlZ21lbnRBbmRCb3VuZHMoIHNlZ21lbnQgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERyYXdzIGEgY2lyY2xlIHVzaW5nIHRoZSBhcmMoKSBjYWxsXHJcbiAgICovXHJcbiAgcHVibGljIGNpcmNsZSggY2VudGVyOiBWZWN0b3IyLCByYWRpdXM6IG51bWJlciApOiB0aGlzO1xyXG4gIHB1YmxpYyBjaXJjbGUoIGNlbnRlclg6IG51bWJlciwgY2VudGVyWTogbnVtYmVyLCByYWRpdXM6IG51bWJlciApOiB0aGlzO1xyXG4gIHB1YmxpYyBjaXJjbGUoIGNlbnRlclg6IFZlY3RvcjIgfCBudW1iZXIsIGNlbnRlclk6IG51bWJlciwgcmFkaXVzPzogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgaWYgKCB0eXBlb2YgY2VudGVyWCA9PT0gJ29iamVjdCcgKSB7XHJcbiAgICAgIC8vIGNpcmNsZSggY2VudGVyLCByYWRpdXMgKVxyXG4gICAgICBjb25zdCBjZW50ZXIgPSBjZW50ZXJYO1xyXG4gICAgICByYWRpdXMgPSBjZW50ZXJZO1xyXG4gICAgICByZXR1cm4gdGhpcy5hcmNQb2ludCggY2VudGVyLCByYWRpdXMsIDAsIE1hdGguUEkgKiAyLCBmYWxzZSApLmNsb3NlKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGNlbnRlclggKSwgYGNlbnRlclggbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7Y2VudGVyWH1gICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBjZW50ZXJZICksIGBjZW50ZXJZIG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke2NlbnRlcll9YCApO1xyXG5cclxuICAgICAgLy8gY2lyY2xlKCBjZW50ZXJYLCBjZW50ZXJZLCByYWRpdXMgKVxyXG4gICAgICByZXR1cm4gdGhpcy5hcmNQb2ludCggdiggY2VudGVyWCwgY2VudGVyWSApLCByYWRpdXMhLCAwLCBNYXRoLlBJICogMiwgZmFsc2UgKS5jbG9zZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRHJhd3MgYW4gZWxsaXBzZSB1c2luZyB0aGUgZWxsaXB0aWNhbEFyYygpIGNhbGxcclxuICAgKlxyXG4gICAqIFRoZSByb3RhdGlvbiBpcyBhYm91dCB0aGUgY2VudGVyWCwgY2VudGVyWS5cclxuICAgKi9cclxuICBwdWJsaWMgZWxsaXBzZSggY2VudGVyOiBWZWN0b3IyLCByYWRpdXNYOiBudW1iZXIsIHJhZGl1c1k6IG51bWJlciwgcm90YXRpb246IG51bWJlciApOiB0aGlzO1xyXG4gIHB1YmxpYyBlbGxpcHNlKCBjZW50ZXJYOiBudW1iZXIsIGNlbnRlclk6IG51bWJlciwgcmFkaXVzWDogbnVtYmVyLCByYWRpdXNZOiBudW1iZXIsIHJvdGF0aW9uOiBudW1iZXIgKTogdGhpcztcclxuICBwdWJsaWMgZWxsaXBzZSggY2VudGVyWDogVmVjdG9yMiB8IG51bWJlciwgY2VudGVyWTogbnVtYmVyLCByYWRpdXNYOiBudW1iZXIsIHJhZGl1c1k6IG51bWJlciwgcm90YXRpb24/OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICAvLyBUT0RPOiBzZXBhcmF0ZSBpbnRvIGVsbGlwc2UoKSBhbmQgZWxsaXBzZVBvaW50KCk/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgLy8gVE9ETzogRWxsaXBzZS9FbGxpcHRpY2FsQXJjIGhhcyBhIG1lc3Mgb2YgcGFyYW1ldGVycy4gQ29uc2lkZXIgcGFyYW1ldGVyIG9iamVjdCwgb3IgZG91YmxlLWNoZWNrIHBhcmFtZXRlciBoYW5kbGluZyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgIGlmICggdHlwZW9mIGNlbnRlclggPT09ICdvYmplY3QnICkge1xyXG4gICAgICAvLyBlbGxpcHNlKCBjZW50ZXIsIHJhZGl1c1gsIHJhZGl1c1ksIHJvdGF0aW9uIClcclxuICAgICAgY29uc3QgY2VudGVyID0gY2VudGVyWDtcclxuICAgICAgcm90YXRpb24gPSByYWRpdXNZO1xyXG4gICAgICByYWRpdXNZID0gcmFkaXVzWDtcclxuICAgICAgcmFkaXVzWCA9IGNlbnRlclk7XHJcbiAgICAgIHJldHVybiB0aGlzLmVsbGlwdGljYWxBcmNQb2ludCggY2VudGVyLCByYWRpdXNYLCByYWRpdXNZLCByb3RhdGlvbiB8fCAwLCAwLCBNYXRoLlBJICogMiwgZmFsc2UgKS5jbG9zZSgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBjZW50ZXJYICksIGBjZW50ZXJYIG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke2NlbnRlclh9YCApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggY2VudGVyWSApLCBgY2VudGVyWSBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHtjZW50ZXJZfWAgKTtcclxuXHJcbiAgICAgIC8vIGVsbGlwc2UoIGNlbnRlclgsIGNlbnRlclksIHJhZGl1c1gsIHJhZGl1c1ksIHJvdGF0aW9uIClcclxuICAgICAgcmV0dXJuIHRoaXMuZWxsaXB0aWNhbEFyY1BvaW50KCB2KCBjZW50ZXJYLCBjZW50ZXJZICksIHJhZGl1c1gsIHJhZGl1c1ksIHJvdGF0aW9uIHx8IDAsIDAsIE1hdGguUEkgKiAyLCBmYWxzZSApLmNsb3NlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgcmVjdGFuZ2xlIHNoYXBlXHJcbiAgICpcclxuICAgKiBAcGFyYW0geCAtIGxlZnQgcG9zaXRpb25cclxuICAgKiBAcGFyYW0geSAtIGJvdHRvbSBwb3NpdGlvbiAoaW4gbm9uIGludmVydGVkIGNhcnRlc2lhbiBzeXN0ZW0pXHJcbiAgICogQHBhcmFtIHdpZHRoXHJcbiAgICogQHBhcmFtIGhlaWdodFxyXG4gICAqL1xyXG4gIHB1YmxpYyByZWN0KCB4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeCApLCBgeCBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHt4fWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB5ICksIGB5IG11c3QgYmUgYSBmaW5pdGUgbnVtYmVyOiAke3l9YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHdpZHRoICksIGB3aWR0aCBtdXN0IGJlIGEgZmluaXRlIG51bWJlcjogJHt3aWR0aH1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggaGVpZ2h0ICksIGBoZWlnaHQgbXVzdCBiZSBhIGZpbml0ZSBudW1iZXI6ICR7aGVpZ2h0fWAgKTtcclxuXHJcbiAgICBjb25zdCBzdWJwYXRoID0gbmV3IFN1YnBhdGgoKTtcclxuICAgIHRoaXMuYWRkU3VicGF0aCggc3VicGF0aCApO1xyXG4gICAgc3VicGF0aC5hZGRQb2ludCggdiggeCwgeSApICk7XHJcbiAgICBzdWJwYXRoLmFkZFBvaW50KCB2KCB4ICsgd2lkdGgsIHkgKSApO1xyXG4gICAgc3VicGF0aC5hZGRQb2ludCggdiggeCArIHdpZHRoLCB5ICsgaGVpZ2h0ICkgKTtcclxuICAgIHN1YnBhdGguYWRkUG9pbnQoIHYoIHgsIHkgKyBoZWlnaHQgKSApO1xyXG4gICAgdGhpcy5hZGRTZWdtZW50QW5kQm91bmRzKCBuZXcgTGluZSggc3VicGF0aC5wb2ludHNbIDAgXSwgc3VicGF0aC5wb2ludHNbIDEgXSApICk7XHJcbiAgICB0aGlzLmFkZFNlZ21lbnRBbmRCb3VuZHMoIG5ldyBMaW5lKCBzdWJwYXRoLnBvaW50c1sgMSBdLCBzdWJwYXRoLnBvaW50c1sgMiBdICkgKTtcclxuICAgIHRoaXMuYWRkU2VnbWVudEFuZEJvdW5kcyggbmV3IExpbmUoIHN1YnBhdGgucG9pbnRzWyAyIF0sIHN1YnBhdGgucG9pbnRzWyAzIF0gKSApO1xyXG4gICAgc3VicGF0aC5jbG9zZSgpO1xyXG4gICAgdGhpcy5hZGRTdWJwYXRoKCBuZXcgU3VicGF0aCgpICk7XHJcbiAgICB0aGlzLmdldExhc3RTdWJwYXRoKCkuYWRkUG9pbnQoIHYoIHgsIHkgKSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIWlzTmFOKCB0aGlzLmJvdW5kcy5nZXRYKCkgKSApO1xyXG4gICAgdGhpcy5yZXNldENvbnRyb2xQb2ludHMoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSByb3VuZCByZWN0YW5nbGUuIEFsbCBhcmd1bWVudHMgYXJlIG51bWJlci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB4XHJcbiAgICogQHBhcmFtIHlcclxuICAgKiBAcGFyYW0gd2lkdGggLSB3aWR0aCBvZiB0aGUgcmVjdGFuZ2xlXHJcbiAgICogQHBhcmFtIGhlaWdodCAtIGhlaWdodCBvZiB0aGUgcmVjdGFuZ2xlXHJcbiAgICogQHBhcmFtIGFyY3cgLSBhcmMgd2lkdGhcclxuICAgKiBAcGFyYW0gYXJjaCAtIGFyYyBoZWlnaHRcclxuICAgKi9cclxuICBwdWJsaWMgcm91bmRSZWN0KCB4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGFyY3c6IG51bWJlciwgYXJjaDogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgY29uc3QgbG93WCA9IHggKyBhcmN3O1xyXG4gICAgY29uc3QgaGlnaFggPSB4ICsgd2lkdGggLSBhcmN3O1xyXG4gICAgY29uc3QgbG93WSA9IHkgKyBhcmNoO1xyXG4gICAgY29uc3QgaGlnaFkgPSB5ICsgaGVpZ2h0IC0gYXJjaDtcclxuICAgIC8vIGlmICggdHJ1ZSApIHtcclxuICAgIGlmICggYXJjdyA9PT0gYXJjaCApIHtcclxuICAgICAgLy8gd2UgY2FuIHVzZSBjaXJjdWxhciBhcmNzLCB3aGljaCBoYXZlIHdlbGwgZGVmaW5lZCBzdHJva2VkIG9mZnNldHNcclxuICAgICAgdGhpc1xyXG4gICAgICAgIC5hcmMoIGhpZ2hYLCBsb3dZLCBhcmN3LCAtTWF0aC5QSSAvIDIsIDAsIGZhbHNlIClcclxuICAgICAgICAuYXJjKCBoaWdoWCwgaGlnaFksIGFyY3csIDAsIE1hdGguUEkgLyAyLCBmYWxzZSApXHJcbiAgICAgICAgLmFyYyggbG93WCwgaGlnaFksIGFyY3csIE1hdGguUEkgLyAyLCBNYXRoLlBJLCBmYWxzZSApXHJcbiAgICAgICAgLmFyYyggbG93WCwgbG93WSwgYXJjdywgTWF0aC5QSSwgTWF0aC5QSSAqIDMgLyAyLCBmYWxzZSApXHJcbiAgICAgICAgLmNsb3NlKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gd2UgaGF2ZSB0byByZXNvcnQgdG8gZWxsaXB0aWNhbCBhcmNzXHJcbiAgICAgIHRoaXNcclxuICAgICAgICAuZWxsaXB0aWNhbEFyYyggaGlnaFgsIGxvd1ksIGFyY3csIGFyY2gsIDAsIC1NYXRoLlBJIC8gMiwgMCwgZmFsc2UgKVxyXG4gICAgICAgIC5lbGxpcHRpY2FsQXJjKCBoaWdoWCwgaGlnaFksIGFyY3csIGFyY2gsIDAsIDAsIE1hdGguUEkgLyAyLCBmYWxzZSApXHJcbiAgICAgICAgLmVsbGlwdGljYWxBcmMoIGxvd1gsIGhpZ2hZLCBhcmN3LCBhcmNoLCAwLCBNYXRoLlBJIC8gMiwgTWF0aC5QSSwgZmFsc2UgKVxyXG4gICAgICAgIC5lbGxpcHRpY2FsQXJjKCBsb3dYLCBsb3dZLCBhcmN3LCBhcmNoLCAwLCBNYXRoLlBJLCBNYXRoLlBJICogMyAvIDIsIGZhbHNlIClcclxuICAgICAgICAuY2xvc2UoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIHBvbHlnb24gZnJvbSBhbiBhcnJheSBvZiB2ZXJ0aWNlcy5cclxuICAgKi9cclxuICBwdWJsaWMgcG9seWdvbiggdmVydGljZXM6IFZlY3RvcjJbXSApOiB0aGlzIHtcclxuICAgIGNvbnN0IGxlbmd0aCA9IHZlcnRpY2VzLmxlbmd0aDtcclxuICAgIGlmICggbGVuZ3RoID4gMCApIHtcclxuICAgICAgdGhpcy5tb3ZlVG9Qb2ludCggdmVydGljZXNbIDAgXSApO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDE7IGkgPCBsZW5ndGg7IGkrKyApIHtcclxuICAgICAgICB0aGlzLmxpbmVUb1BvaW50KCB2ZXJ0aWNlc1sgaSBdICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLmNsb3NlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGlzIGlzIGEgY29udmVuaWVuY2UgZnVuY3Rpb24gdGhhdCBhbGxvd3MgdG8gZ2VuZXJhdGUgQ2FyZGluYWwgc3BsaW5lc1xyXG4gICAqIGZyb20gYSBwb3NpdGlvbiBhcnJheS4gQ2FyZGluYWwgc3BsaW5lIGRpZmZlcnMgZnJvbSBCZXppZXIgY3VydmVzIGluIHRoYXQgYWxsXHJcbiAgICogZGVmaW5lZCBwb2ludHMgb24gYSBDYXJkaW5hbCBzcGxpbmUgYXJlIG9uIHRoZSBwYXRoIGl0c2VsZi5cclxuICAgKlxyXG4gICAqIEl0IGluY2x1ZGVzIGEgdGVuc2lvbiBwYXJhbWV0ZXIgdG8gYWxsb3cgdGhlIGNsaWVudCB0byBzcGVjaWZ5IGhvdyB0aWdodGx5XHJcbiAgICogdGhlIHBhdGggaW50ZXJwb2xhdGVzIGJldHdlZW4gcG9pbnRzLiBPbmUgY2FuIHRoaW5rIG9mIHRoZSB0ZW5zaW9uIGFzIHRoZSB0ZW5zaW9uIGluXHJcbiAgICogYSBydWJiZXIgYmFuZCBhcm91bmQgcGVncy4gaG93ZXZlciB1bmxpa2UgYSBydWJiZXIgYmFuZCB0aGUgdGVuc2lvbiBjYW4gYmUgbmVnYXRpdmUuXHJcbiAgICogdGhlIHRlbnNpb24gcmFuZ2VzIGZyb20gLTEgdG8gMVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjYXJkaW5hbFNwbGluZSggcG9zaXRpb25zOiBWZWN0b3IyW10sIHByb3ZpZGVkT3B0aW9ucz86IENhcmRpbmFsU3BsaW5lT3B0aW9ucyApOiB0aGlzIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPENhcmRpbmFsU3BsaW5lT3B0aW9ucz4oKSgge1xyXG4gICAgICB0ZW5zaW9uOiAwLFxyXG4gICAgICBpc0Nsb3NlZExpbmVTZWdtZW50czogZmFsc2VcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMudGVuc2lvbiA8IDEgJiYgb3B0aW9ucy50ZW5zaW9uID4gLTEsICcgdGhlIHRlbnNpb24gZ29lcyBmcm9tIC0xIHRvIDEgJyApO1xyXG5cclxuICAgIGNvbnN0IHBvaW50TnVtYmVyID0gcG9zaXRpb25zLmxlbmd0aDsgLy8gbnVtYmVyIG9mIHBvaW50cyBpbiB0aGUgYXJyYXlcclxuXHJcbiAgICAvLyBpZiB0aGUgbGluZSBpcyBvcGVuLCB0aGVyZSBpcyBvbmUgbGVzcyBzZWdtZW50cyB0aGFuIHBvaW50IHZlY3RvcnNcclxuICAgIGNvbnN0IHNlZ21lbnROdW1iZXIgPSAoIG9wdGlvbnMuaXNDbG9zZWRMaW5lU2VnbWVudHMgKSA/IHBvaW50TnVtYmVyIDogcG9pbnROdW1iZXIgLSAxO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHNlZ21lbnROdW1iZXI7IGkrKyApIHtcclxuICAgICAgbGV0IGNhcmRpbmFsUG9pbnRzOyAvLyB7QXJyYXkuPFZlY3RvcjI+fSBjYXJkaW5hbCBwb2ludHMgQXJyYXlcclxuICAgICAgaWYgKCBpID09PSAwICYmICFvcHRpb25zLmlzQ2xvc2VkTGluZVNlZ21lbnRzICkge1xyXG4gICAgICAgIGNhcmRpbmFsUG9pbnRzID0gW1xyXG4gICAgICAgICAgcG9zaXRpb25zWyAwIF0sXHJcbiAgICAgICAgICBwb3NpdGlvbnNbIDAgXSxcclxuICAgICAgICAgIHBvc2l0aW9uc1sgMSBdLFxyXG4gICAgICAgICAgcG9zaXRpb25zWyAyIF0gXTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggKCBpID09PSBzZWdtZW50TnVtYmVyIC0gMSApICYmICFvcHRpb25zLmlzQ2xvc2VkTGluZVNlZ21lbnRzICkge1xyXG4gICAgICAgIGNhcmRpbmFsUG9pbnRzID0gW1xyXG4gICAgICAgICAgcG9zaXRpb25zWyBpIC0gMSBdLFxyXG4gICAgICAgICAgcG9zaXRpb25zWyBpIF0sXHJcbiAgICAgICAgICBwb3NpdGlvbnNbIGkgKyAxIF0sXHJcbiAgICAgICAgICBwb3NpdGlvbnNbIGkgKyAxIF0gXTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjYXJkaW5hbFBvaW50cyA9IFtcclxuICAgICAgICAgIHBvc2l0aW9uc1sgKCBpIC0gMSArIHBvaW50TnVtYmVyICkgJSBwb2ludE51bWJlciBdLFxyXG4gICAgICAgICAgcG9zaXRpb25zWyBpICUgcG9pbnROdW1iZXIgXSxcclxuICAgICAgICAgIHBvc2l0aW9uc1sgKCBpICsgMSApICUgcG9pbnROdW1iZXIgXSxcclxuICAgICAgICAgIHBvc2l0aW9uc1sgKCBpICsgMiApICUgcG9pbnROdW1iZXIgXSBdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBDYXJkaW5hbCBTcGxpbmUgdG8gQ3ViaWMgQmV6aWVyIGNvbnZlcnNpb24gbWF0cml4XHJcbiAgICAgIC8vICAgIDAgICAgICAgICAgICAgICAgIDEgICAgICAgICAgICAgMCAgICAgICAgICAgIDBcclxuICAgICAgLy8gICgtMSt0ZW5zaW9uKS82ICAgICAgMSAgICAgICgxLXRlbnNpb24pLzYgICAgICAgMFxyXG4gICAgICAvLyAgICAwICAgICAgICAgICAgKDEtdGVuc2lvbikvNiAgICAgIDEgICAgICAgKC0xK3RlbnNpb24pLzZcclxuICAgICAgLy8gICAgMCAgICAgICAgICAgICAgICAgMCAgICAgICAgICAgICAxICAgICAgICAgICAwXHJcblxyXG4gICAgICAvLyB7QXJyYXkuPFZlY3RvcjI+fSBiZXppZXIgcG9pbnRzIEFycmF5XHJcbiAgICAgIGNvbnN0IGJlemllclBvaW50cyA9IFtcclxuICAgICAgICBjYXJkaW5hbFBvaW50c1sgMSBdLFxyXG4gICAgICAgIHdlaWdodGVkU3BsaW5lVmVjdG9yKCBjYXJkaW5hbFBvaW50c1sgMCBdLCBjYXJkaW5hbFBvaW50c1sgMSBdLCBjYXJkaW5hbFBvaW50c1sgMiBdLCBvcHRpb25zLnRlbnNpb24gKSxcclxuICAgICAgICB3ZWlnaHRlZFNwbGluZVZlY3RvciggY2FyZGluYWxQb2ludHNbIDMgXSwgY2FyZGluYWxQb2ludHNbIDIgXSwgY2FyZGluYWxQb2ludHNbIDEgXSwgb3B0aW9ucy50ZW5zaW9uICksXHJcbiAgICAgICAgY2FyZGluYWxQb2ludHNbIDIgXVxyXG4gICAgICBdO1xyXG5cclxuICAgICAgLy8gc3BlY2lhbCBvcGVyYXRpb25zIG9uIHRoZSBmaXJzdCBwb2ludFxyXG4gICAgICBpZiAoIGkgPT09IDAgKSB7XHJcbiAgICAgICAgdGhpcy5lbnN1cmUoIGJlemllclBvaW50c1sgMCBdICk7XHJcbiAgICAgICAgdGhpcy5nZXRMYXN0U3VicGF0aCgpLmFkZFBvaW50KCBiZXppZXJQb2ludHNbIDAgXSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmN1YmljQ3VydmVUb1BvaW50KCBiZXppZXJQb2ludHNbIDEgXSwgYmV6aWVyUG9pbnRzWyAyIF0sIGJlemllclBvaW50c1sgMyBdICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgY29weSBvZiB0aGlzIHNoYXBlXHJcbiAgICovXHJcbiAgcHVibGljIGNvcHkoKTogU2hhcGUge1xyXG4gICAgLy8gY29weSBlYWNoIGluZGl2aWR1YWwgc3VicGF0aCwgc28gZnV0dXJlIG1vZGlmaWNhdGlvbnMgdG8gZWl0aGVyIFNoYXBlIGRvZXNuJ3QgYWZmZWN0IHRoZSBvdGhlciBvbmVcclxuICAgIHJldHVybiBuZXcgU2hhcGUoIF8ubWFwKCB0aGlzLnN1YnBhdGhzLCBzdWJwYXRoID0+IHN1YnBhdGguY29weSgpICksIHRoaXMuYm91bmRzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXcml0ZXMgb3V0IHRoaXMgc2hhcGUncyBwYXRoIHRvIGEgY2FudmFzIDJkIGNvbnRleHQuIGRvZXMgTk9UIGluY2x1ZGUgdGhlIGJlZ2luUGF0aCgpIVxyXG4gICAqL1xyXG4gIHB1YmxpYyB3cml0ZVRvQ29udGV4dCggY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEICk6IHZvaWQge1xyXG4gICAgY29uc3QgbGVuID0gdGhpcy5zdWJwYXRocy5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcclxuICAgICAgdGhpcy5zdWJwYXRoc1sgaSBdLndyaXRlVG9Db250ZXh0KCBjb250ZXh0ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHNvbWV0aGluZyBsaWtlIFwiTTE1MCAwIEw3NSAyMDAgTDIyNSAyMDAgWlwiIGZvciBhIHRyaWFuZ2xlICh0byBiZSB1c2VkIHdpdGggYSBTVkcgcGF0aCBlbGVtZW50J3MgJ2QnXHJcbiAgICogYXR0cmlidXRlKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTVkdQYXRoKCk6IHN0cmluZyB7XHJcbiAgICBsZXQgc3RyaW5nID0gJyc7XHJcbiAgICBjb25zdCBsZW4gPSB0aGlzLnN1YnBhdGhzLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxlbjsgaSsrICkge1xyXG4gICAgICBjb25zdCBzdWJwYXRoID0gdGhpcy5zdWJwYXRoc1sgaSBdO1xyXG4gICAgICBpZiAoIHN1YnBhdGguaXNEcmF3YWJsZSgpICkge1xyXG4gICAgICAgIC8vIHNpbmNlIHRoZSBjb21tYW5kcyBhZnRlciB0aGlzIGFyZSByZWxhdGl2ZSB0byB0aGUgcHJldmlvdXMgJ3BvaW50Jywgd2UgbmVlZCB0byBzcGVjaWZ5IGEgbW92ZSB0byB0aGUgaW5pdGlhbCBwb2ludFxyXG4gICAgICAgIGNvbnN0IHN0YXJ0UG9pbnQgPSBzdWJwYXRoLnNlZ21lbnRzWyAwIF0uc3RhcnQ7XHJcblxyXG4gICAgICAgIHN0cmluZyArPSBgTSAke3N2Z051bWJlciggc3RhcnRQb2ludC54ICl9ICR7c3ZnTnVtYmVyKCBzdGFydFBvaW50LnkgKX0gYDtcclxuXHJcbiAgICAgICAgZm9yICggbGV0IGsgPSAwOyBrIDwgc3VicGF0aC5zZWdtZW50cy5sZW5ndGg7IGsrKyApIHtcclxuICAgICAgICAgIHN0cmluZyArPSBgJHtzdWJwYXRoLnNlZ21lbnRzWyBrIF0uZ2V0U1ZHUGF0aEZyYWdtZW50KCl9IGA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHN1YnBhdGguaXNDbG9zZWQoKSApIHtcclxuICAgICAgICAgIHN0cmluZyArPSAnWiAnO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN0cmluZztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgU2hhcGUgdGhhdCBpcyB0cmFuc2Zvcm1lZCBieSB0aGUgYXNzb2NpYXRlZCBtYXRyaXhcclxuICAgKi9cclxuICBwdWJsaWMgdHJhbnNmb3JtZWQoIG1hdHJpeDogTWF0cml4MyApOiBTaGFwZSB7XHJcbiAgICAvLyBUT0RPOiBhbGxvY2F0aW9uIHJlZHVjdGlvbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgIGNvbnN0IHN1YnBhdGhzID0gXy5tYXAoIHRoaXMuc3VicGF0aHMsIHN1YnBhdGggPT4gc3VicGF0aC50cmFuc2Zvcm1lZCggbWF0cml4ICkgKTtcclxuICAgIGNvbnN0IGJvdW5kcyA9IF8ucmVkdWNlKCBzdWJwYXRocywgKCBib3VuZHMsIHN1YnBhdGggKSA9PiBib3VuZHMudW5pb24oIHN1YnBhdGguYm91bmRzICksIEJvdW5kczIuTk9USElORyApO1xyXG4gICAgcmV0dXJuIG5ldyBTaGFwZSggc3VicGF0aHMsIGJvdW5kcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udmVydHMgdGhpcyBzdWJwYXRoIHRvIGEgbmV3IHNoYXBlIG1hZGUgb2YgbWFueSBsaW5lIHNlZ21lbnRzIChhcHByb3hpbWF0aW5nIHRoZSBjdXJyZW50IHNoYXBlKSB3aXRoIHRoZVxyXG4gICAqIHRyYW5zZm9ybWF0aW9uIGFwcGxpZWQuXHJcbiAgICovXHJcbiAgcHVibGljIG5vbmxpbmVhclRyYW5zZm9ybWVkKCBwcm92aWRlZE9wdGlvbnM/OiBOb25saW5lYXJUcmFuc2Zvcm1lZE9wdGlvbnMgKTogU2hhcGUge1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IGNvbWJpbmVPcHRpb25zPE5vbmxpbmVhclRyYW5zZm9ybWVkT3B0aW9ucz4oIHtcclxuICAgICAgbWluTGV2ZWxzOiAwLFxyXG4gICAgICBtYXhMZXZlbHM6IDcsXHJcbiAgICAgIGRpc3RhbmNlRXBzaWxvbjogMC4xNiwgLy8gTk9URTogdGhpcyB3aWxsIGNoYW5nZSB3aGVuIHRoZSBTaGFwZSBpcyBzY2FsZWQsIHNpbmNlIHRoaXMgaXMgYSB0aHJlc2hvbGQgZm9yIHRoZSBzcXVhcmUgb2YgYSBkaXN0YW5jZSB2YWx1ZVxyXG4gICAgICBjdXJ2ZUVwc2lsb246ICggcHJvdmlkZWRPcHRpb25zICYmIHByb3ZpZGVkT3B0aW9ucy5pbmNsdWRlQ3VydmF0dXJlICkgPyAwLjAwMiA6IG51bGxcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIC8vIFRPRE86IGFsbG9jYXRpb24gcmVkdWN0aW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgY29uc3Qgc3VicGF0aHMgPSBfLm1hcCggdGhpcy5zdWJwYXRocywgc3VicGF0aCA9PiBzdWJwYXRoLm5vbmxpbmVhclRyYW5zZm9ybWVkKCBvcHRpb25zICkgKTtcclxuICAgIGNvbnN0IGJvdW5kcyA9IF8ucmVkdWNlKCBzdWJwYXRocywgKCBib3VuZHMsIHN1YnBhdGggKSA9PiBib3VuZHMudW5pb24oIHN1YnBhdGguYm91bmRzICksIEJvdW5kczIuTk9USElORyApO1xyXG4gICAgcmV0dXJuIG5ldyBTaGFwZSggc3VicGF0aHMsIGJvdW5kcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFwcyBwb2ludHMgYnkgdHJlYXRpbmcgdGhlaXIgeCBjb29yZGluYXRlIGFzIHBvbGFyIGFuZ2xlLCBhbmQgeSBjb29yZGluYXRlIGFzIHBvbGFyIG1hZ25pdHVkZS5cclxuICAgKiBTZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Qb2xhcl9jb29yZGluYXRlX3N5c3RlbVxyXG4gICAqXHJcbiAgICogUGxlYXNlIHNlZSBTaGFwZS5ub25saW5lYXJUcmFuc2Zvcm1lZCBmb3IgbW9yZSBkb2N1bWVudGF0aW9uIG9uIGFkYXB0aXZlIGRpc2NyZXRpemF0aW9uIG9wdGlvbnMgKG1pbkxldmVscywgbWF4TGV2ZWxzLCBkaXN0YW5jZUVwc2lsb24sIGN1cnZlRXBzaWxvbilcclxuICAgKlxyXG4gICAqIEV4YW1wbGU6IEEgbGluZSBmcm9tICgwLDEwKSB0byAocGksMTApIHdpbGwgYmUgdHJhbnNmb3JtZWQgdG8gYSBjaXJjdWxhciBhcmMgZnJvbSAoMTAsMCkgdG8gKC0xMCwwKSBwYXNzaW5nIHRocm91Z2ggKDAsMTApLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwb2xhclRvQ2FydGVzaWFuKCBvcHRpb25zPzogTm9ubGluZWFyVHJhbnNmb3JtZWRPcHRpb25zICk6IFNoYXBlIHtcclxuICAgIHJldHVybiB0aGlzLm5vbmxpbmVhclRyYW5zZm9ybWVkKCBjb21iaW5lT3B0aW9uczxOb25saW5lYXJUcmFuc2Zvcm1lZE9wdGlvbnM+KCB7XHJcbiAgICAgIHBvaW50TWFwOiBwID0+IFZlY3RvcjIuY3JlYXRlUG9sYXIoIHAueSwgcC54ICksXHJcbiAgICAgIG1ldGhvZE5hbWU6ICdwb2xhclRvQ2FydGVzaWFuJyAvLyB0aGlzIHdpbGwgYmUgY2FsbGVkIG9uIFNlZ21lbnRzIGlmIGl0IGV4aXN0cyB0byBkbyBtb3JlIG9wdGltaXplZCBjb252ZXJzaW9uIChzZWUgTGluZSlcclxuICAgIH0sIG9wdGlvbnMgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udmVydHMgZWFjaCBzZWdtZW50IGludG8gbGluZXMsIHVzaW5nIGFuIGFkYXB0aXZlIChtaWRwb2ludCBkaXN0YW5jZSBzdWJkaXZpc2lvbikgbWV0aG9kLlxyXG4gICAqXHJcbiAgICogTk9URTogdXNlcyBub25saW5lYXJUcmFuc2Zvcm1lZCBtZXRob2QgaW50ZXJuYWxseSwgYnV0IHNpbmNlIHdlIGRvbid0IHByb3ZpZGUgYSBwb2ludE1hcCBvciBtZXRob2ROYW1lLCBpdCB3b24ndCBjcmVhdGUgYW55dGhpbmcgYnV0IGxpbmUgc2VnbWVudHMuXHJcbiAgICogU2VlIG5vbmxpbmVhclRyYW5zZm9ybWVkIGZvciBkb2N1bWVudGF0aW9uIG9mIG9wdGlvbnNcclxuICAgKi9cclxuICBwdWJsaWMgdG9QaWVjZXdpc2VMaW5lYXIoIG9wdGlvbnM/OiBOb25saW5lYXJUcmFuc2Zvcm1lZE9wdGlvbnMgKTogU2hhcGUge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMgfHwgIW9wdGlvbnMucG9pbnRNYXAsICdObyBwb2ludE1hcCBmb3IgdG9QaWVjZXdpc2VMaW5lYXIgYWxsb3dlZCwgc2luY2UgaXQgY291bGQgY3JlYXRlIG5vbi1saW5lYXIgc2VnbWVudHMnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3B0aW9ucyB8fCAhb3B0aW9ucy5tZXRob2ROYW1lLCAnTm8gbWV0aG9kTmFtZSBmb3IgdG9QaWVjZXdpc2VMaW5lYXIgYWxsb3dlZCwgc2luY2UgaXQgY291bGQgY3JlYXRlIG5vbi1saW5lYXIgc2VnbWVudHMnICk7XHJcbiAgICByZXR1cm4gdGhpcy5ub25saW5lYXJUcmFuc2Zvcm1lZCggb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSXMgdGhpcyBwb2ludCBjb250YWluZWQgaW4gdGhpcyBzaGFwZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb250YWluc1BvaW50KCBwb2ludDogVmVjdG9yMiApOiBib29sZWFuIHtcclxuXHJcbiAgICAvLyBXZSBwaWNrIGEgcmF5LCBhbmQgZGV0ZXJtaW5lIHRoZSB3aW5kaW5nIG51bWJlciBvdmVyIHRoYXQgcmF5LiBpZiB0aGUgbnVtYmVyIG9mIHNlZ21lbnRzIGNyb3NzaW5nIGl0XHJcbiAgICAvLyBDQ1cgPT0gbnVtYmVyIG9mIHNlZ21lbnRzIGNyb3NzaW5nIGl0IENXLCB0aGVuIHRoZSBwb2ludCBpcyBjb250YWluZWQgaW4gdGhlIHNoYXBlXHJcblxyXG4gICAgY29uc3QgcmF5RGlyZWN0aW9uID0gVmVjdG9yMi5YX1VOSVQuY29weSgpOyAvLyB3ZSBtYXkgbXV0YXRlIGl0XHJcblxyXG4gICAgLy8gVHJ5IHRvIGZpbmQgYSByYXkgdGhhdCBkb2Vzbid0IGludGVyc2VjdCB3aXRoIGFueSBvZiB0aGUgdmVydGljZXMgb2YgdGhlIHNoYXBlIHNlZ21lbnRzLFxyXG4gICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy85NC5cclxuICAgIC8vIFB1dCBhIGxpbWl0IG9uIGF0dGVtcHRzLCBzbyB3ZSBkb24ndCB0cnkgZm9yZXZlclxyXG4gICAgbGV0IGNvdW50ID0gMDtcclxuICAgIHdoaWxlICggY291bnQgPCA1ICkge1xyXG4gICAgICBjb3VudCsrO1xyXG5cclxuICAgICAgLy8gTG9vayBmb3IgY2FzZXMgd2hlcmUgdGhlIHByb3Bvc2VkIHJheSB3aWxsIGludGVyc2VjdCB3aXRoIG9uZSBvZiB0aGUgdmVydGljZXMgb2YgYSBzaGFwZSBzZWdtZW50IC0gaW4gdGhpcyBjYXNlXHJcbiAgICAgIC8vIHRoZSBpbnRlcnNlY3Rpb24gaW4gd2luZGluZ0ludGVyc2VjdGlvbiBtYXkgbm90IGJlIHdlbGwtZGVmaW5lZCBhbmQgd29uJ3QgYmUgY291bnRlZCwgc28gd2UgbmVlZCB0byB1c2UgYSByYXlcclxuICAgICAgLy8gd2l0aCBhIGRpZmZlcmVudCBkaXJlY3Rpb25cclxuICAgICAgY29uc3QgcmF5SW50ZXJzZWN0c1NlZ21lbnRWZXJ0ZXggPSBfLnNvbWUoIHRoaXMuc3VicGF0aHMsIHN1YnBhdGggPT4ge1xyXG4gICAgICAgIHJldHVybiBfLnNvbWUoIHN1YnBhdGguc2VnbWVudHMsIHNlZ21lbnQgPT4ge1xyXG4gICAgICAgICAgY29uc3QgZGVsdGEgPSBzZWdtZW50LnN0YXJ0Lm1pbnVzKCBwb2ludCApO1xyXG4gICAgICAgICAgY29uc3QgbWFnbml0dWRlID0gZGVsdGEubWFnbml0dWRlO1xyXG4gICAgICAgICAgaWYgKCBtYWduaXR1ZGUgIT09IDAgKSB7XHJcbiAgICAgICAgICAgIGRlbHRhLmRpdmlkZVNjYWxhciggbWFnbml0dWRlICk7IC8vIG5vcm1hbGl6ZSBpdFxyXG4gICAgICAgICAgICBkZWx0YS5zdWJ0cmFjdCggcmF5RGlyZWN0aW9uICk7IC8vIGNoZWNrIGFnYWluc3QgdGhlIHByb3Bvc2VkIHJheSBkaXJlY3Rpb25cclxuICAgICAgICAgICAgcmV0dXJuIGRlbHRhLm1hZ25pdHVkZVNxdWFyZWQgPCAxZS05O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIElmIG91ciBwb2ludCBpcyBvbiBhIHNlZ21lbnQgc3RhcnQsIHRoZXJlIHByb2JhYmx5IHdvbid0IGJlIGEgZ3JlYXQgcmF5IHRvIHVzZVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBpZiAoIHJheUludGVyc2VjdHNTZWdtZW50VmVydGV4ICkge1xyXG4gICAgICAgIC8vIHRoZSBwcm9wb3NlZCByYXkgbWF5IG5vdCB3b3JrIGJlY2F1c2UgaXQgaW50ZXJzZWN0cyB3aXRoIGEgc2VnbWVudCB2ZXJ0ZXggLSB0cnkgYW5vdGhlciBvbmVcclxuICAgICAgICByYXlEaXJlY3Rpb24ucm90YXRlKCBkb3RSYW5kb20ubmV4dERvdWJsZSgpICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gU2hvdWxkIGJlIHNhZmUgdG8gdXNlIHRoaXMgcmF5RGlyZWN0aW9uIGZvciB3aW5kaW5nSW50ZXJzZWN0aW9uXHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy53aW5kaW5nSW50ZXJzZWN0aW9uKCBuZXcgUmF5MiggcG9pbnQsIHJheURpcmVjdGlvbiApICkgIT09IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIaXQtdGVzdHMgdGhpcyBzaGFwZSB3aXRoIHRoZSByYXkuIEFuIGFycmF5IG9mIGFsbCBpbnRlcnNlY3Rpb25zIG9mIHRoZSByYXkgd2l0aCB0aGlzIHNoYXBlIHdpbGwgYmUgcmV0dXJuZWQuXHJcbiAgICogRm9yIHRoaXMgZnVuY3Rpb24sIGludGVyc2VjdGlvbnMgd2lsbCBiZSByZXR1cm5lZCBzb3J0ZWQgYnkgdGhlIGRpc3RhbmNlIGZyb20gdGhlIHJheSdzIHBvc2l0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnRlcnNlY3Rpb24oIHJheTogUmF5MiApOiBSYXlJbnRlcnNlY3Rpb25bXSB7XHJcbiAgICBsZXQgaGl0czogUmF5SW50ZXJzZWN0aW9uW10gPSBbXTtcclxuICAgIGNvbnN0IG51bVN1YnBhdGhzID0gdGhpcy5zdWJwYXRocy5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1TdWJwYXRoczsgaSsrICkge1xyXG4gICAgICBjb25zdCBzdWJwYXRoID0gdGhpcy5zdWJwYXRoc1sgaSBdO1xyXG5cclxuICAgICAgaWYgKCBzdWJwYXRoLmlzRHJhd2FibGUoKSApIHtcclxuICAgICAgICBjb25zdCBudW1TZWdtZW50cyA9IHN1YnBhdGguc2VnbWVudHMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoIGxldCBrID0gMDsgayA8IG51bVNlZ21lbnRzOyBrKysgKSB7XHJcbiAgICAgICAgICBjb25zdCBzZWdtZW50ID0gc3VicGF0aC5zZWdtZW50c1sgayBdO1xyXG4gICAgICAgICAgaGl0cyA9IGhpdHMuY29uY2F0KCBzZWdtZW50LmludGVyc2VjdGlvbiggcmF5ICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggc3VicGF0aC5oYXNDbG9zaW5nU2VnbWVudCgpICkge1xyXG4gICAgICAgICAgaGl0cyA9IGhpdHMuY29uY2F0KCBzdWJwYXRoLmdldENsb3NpbmdTZWdtZW50KCkuaW50ZXJzZWN0aW9uKCByYXkgKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIF8uc29ydEJ5KCBoaXRzLCBoaXQgPT4gaGl0LmRpc3RhbmNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHByb3ZpZGVkIGxpbmUgc2VnbWVudCB3b3VsZCBoYXZlIHNvbWUgcGFydCBvbiB0b3Agb3IgdG91Y2hpbmcgdGhlIGludGVyaW9yIChmaWxsZWQgYXJlYSkgb2ZcclxuICAgKiB0aGlzIHNoYXBlLlxyXG4gICAqXHJcbiAgICogVGhpcyBkaWZmZXJzIHNvbWV3aGF0IGZyb20gYW4gaW50ZXJzZWN0aW9uIG9mIHRoZSBsaW5lIHNlZ21lbnQgd2l0aCB0aGUgU2hhcGUncyBwYXRoLCBhcyB3ZSB3aWxsIHJldHVybiB0cnVlXHJcbiAgICogKFwiaW50ZXJzZWN0aW9uXCIpIGlmIHRoZSBsaW5lIHNlZ21lbnQgaXMgZW50aXJlbHkgY29udGFpbmVkIGluIHRoZSBpbnRlcmlvciBvZiB0aGUgU2hhcGUncyBwYXRoLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHN0YXJ0UG9pbnQgLSBPbmUgZW5kIG9mIHRoZSBsaW5lIHNlZ21lbnRcclxuICAgKiBAcGFyYW0gZW5kUG9pbnQgLSBUaGUgb3RoZXIgZW5kIG9mIHRoZSBsaW5lIHNlZ21lbnRcclxuICAgKi9cclxuICBwdWJsaWMgaW50ZXJpb3JJbnRlcnNlY3RzTGluZVNlZ21lbnQoIHN0YXJ0UG9pbnQ6IFZlY3RvcjIsIGVuZFBvaW50OiBWZWN0b3IyICk6IGJvb2xlYW4ge1xyXG4gICAgLy8gRmlyc3QgY2hlY2sgaWYgb3VyIG1pZHBvaW50IGlzIGluIHRoZSBTaGFwZSAoYXMgZWl0aGVyIG91ciBtaWRwb2ludCBpcyBpbiB0aGUgU2hhcGUsIE9SIHRoZSBsaW5lIHNlZ21lbnQgd2lsbFxyXG4gICAgLy8gaW50ZXJzZWN0IHRoZSBTaGFwZSdzIGJvdW5kYXJ5IHBhdGgpLlxyXG4gICAgY29uc3QgbWlkcG9pbnQgPSBzdGFydFBvaW50LmJsZW5kKCBlbmRQb2ludCwgMC41ICk7XHJcbiAgICBpZiAoIHRoaXMuY29udGFpbnNQb2ludCggbWlkcG9pbnQgKSApIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVE9ETzogaWYgYW4gaXNzdWUsIHdlIGNhbiByZWR1Y2UgdGhpcyBhbGxvY2F0aW9uIHRvIGEgc2NyYXRjaCB2YXJpYWJsZSBsb2NhbCBpbiB0aGUgU2hhcGUuanMgc2NvcGUuIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgY29uc3QgZGVsdGEgPSBlbmRQb2ludC5taW51cyggc3RhcnRQb2ludCApO1xyXG4gICAgY29uc3QgbGVuZ3RoID0gZGVsdGEubWFnbml0dWRlO1xyXG5cclxuICAgIGlmICggbGVuZ3RoID09PSAwICkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZGVsdGEubm9ybWFsaXplKCk7IC8vIHNvIHdlIGNhbiB1c2UgaXQgYXMgYSB1bml0IHZlY3RvciwgZXhwZWN0ZWQgYnkgdGhlIFJheVxyXG5cclxuICAgIC8vIEdyYWIgYWxsIGludGVyc2VjdGlvbnMgKHRoYXQgYXJlIGZyb20gc3RhcnRQb2ludCB0b3dhcmRzIHRoZSBkaXJlY3Rpb24gb2YgZW5kUG9pbnQpXHJcbiAgICBjb25zdCBoaXRzID0gdGhpcy5pbnRlcnNlY3Rpb24oIG5ldyBSYXkyKCBzdGFydFBvaW50LCBkZWx0YSApICk7XHJcblxyXG4gICAgLy8gU2VlIGlmIHdlIGhhdmUgYW55IGludGVyc2VjdGlvbnMgYWxvbmcgb3VyIGluZmluaXRlIHJheSB3aG9zZSBkaXN0YW5jZSBmcm9tIHRoZSBzdGFydFBvaW50IGlzIGxlc3MgdGhhbiBvclxyXG4gICAgLy8gZXF1YWwgdG8gb3VyIGxpbmUgc2VnbWVudCdzIGxlbmd0aC5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGhpdHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGlmICggaGl0c1sgaSBdLmRpc3RhbmNlIDw9IGxlbmd0aCApIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIERpZCBub3QgaGl0IHRoZSBib3VuZGFyeSwgYW5kIHdhc24ndCBmdWxseSBjb250YWluZWQuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB3aW5kaW5nIG51bWJlciBmb3IgaW50ZXJzZWN0aW9uIHdpdGggYSByYXlcclxuICAgKi9cclxuICBwdWJsaWMgd2luZGluZ0ludGVyc2VjdGlvbiggcmF5OiBSYXkyICk6IG51bWJlciB7XHJcbiAgICBsZXQgd2luZCA9IDA7XHJcblxyXG4gICAgY29uc3QgbnVtU3VicGF0aHMgPSB0aGlzLnN1YnBhdGhzLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG51bVN1YnBhdGhzOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IHN1YnBhdGggPSB0aGlzLnN1YnBhdGhzWyBpIF07XHJcblxyXG4gICAgICBpZiAoIHN1YnBhdGguaXNEcmF3YWJsZSgpICkge1xyXG4gICAgICAgIGNvbnN0IG51bVNlZ21lbnRzID0gc3VicGF0aC5zZWdtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICggbGV0IGsgPSAwOyBrIDwgbnVtU2VnbWVudHM7IGsrKyApIHtcclxuICAgICAgICAgIHdpbmQgKz0gc3VicGF0aC5zZWdtZW50c1sgayBdLndpbmRpbmdJbnRlcnNlY3Rpb24oIHJheSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaGFuZGxlIHRoZSBpbXBsaWNpdCBjbG9zaW5nIGxpbmUgc2VnbWVudFxyXG4gICAgICAgIGlmICggc3VicGF0aC5oYXNDbG9zaW5nU2VnbWVudCgpICkge1xyXG4gICAgICAgICAgd2luZCArPSBzdWJwYXRoLmdldENsb3NpbmdTZWdtZW50KCkud2luZGluZ0ludGVyc2VjdGlvbiggcmF5ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHdpbmQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIHRoZSBwYXRoIG9mIHRoZSBTaGFwZSBpbnRlcnNlY3RzIChvciBpcyBjb250YWluZWQgaW4pIHRoZSBwcm92aWRlZCBib3VuZGluZyBib3guXHJcbiAgICogQ29tcHV0ZWQgYnkgY2hlY2tpbmcgaW50ZXJzZWN0aW9ucyB3aXRoIGFsbCBmb3VyIGVkZ2VzIG9mIHRoZSBib3VuZGluZyBib3gsIG9yIHdoZXRoZXIgdGhlIFNoYXBlIGlzIHRvdGFsbHlcclxuICAgKiBjb250YWluZWQgd2l0aGluIHRoZSBib3VuZGluZyBib3guXHJcbiAgICovXHJcbiAgcHVibGljIGludGVyc2VjdHNCb3VuZHMoIGJvdW5kczogQm91bmRzMiApOiBib29sZWFuIHtcclxuICAgIC8vIElmIHRoZSBib3VuZGluZyBib3ggY29tcGxldGVseSBzdXJyb3VuZHMgb3VyIHNoYXBlLCBpdCBpbnRlcnNlY3RzIHRoZSBib3VuZHNcclxuICAgIGlmICggdGhpcy5ib3VuZHMuaW50ZXJzZWN0aW9uKCBib3VuZHMgKS5lcXVhbHMoIHRoaXMuYm91bmRzICkgKSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHJheXMgZm9yIGhpdCB0ZXN0aW5nIGFsb25nIHRoZSBib3VuZGluZyBib3ggZWRnZXNcclxuICAgIGNvbnN0IG1pbkhvcml6b250YWxSYXkgPSBuZXcgUmF5MiggbmV3IFZlY3RvcjIoIGJvdW5kcy5taW5YLCBib3VuZHMubWluWSApLCBuZXcgVmVjdG9yMiggMSwgMCApICk7XHJcbiAgICBjb25zdCBtaW5WZXJ0aWNhbFJheSA9IG5ldyBSYXkyKCBuZXcgVmVjdG9yMiggYm91bmRzLm1pblgsIGJvdW5kcy5taW5ZICksIG5ldyBWZWN0b3IyKCAwLCAxICkgKTtcclxuICAgIGNvbnN0IG1heEhvcml6b250YWxSYXkgPSBuZXcgUmF5MiggbmV3IFZlY3RvcjIoIGJvdW5kcy5tYXhYLCBib3VuZHMubWF4WSApLCBuZXcgVmVjdG9yMiggLTEsIDAgKSApO1xyXG4gICAgY29uc3QgbWF4VmVydGljYWxSYXkgPSBuZXcgUmF5MiggbmV3IFZlY3RvcjIoIGJvdW5kcy5tYXhYLCBib3VuZHMubWF4WSApLCBuZXcgVmVjdG9yMiggMCwgLTEgKSApO1xyXG5cclxuICAgIGxldCBoaXRQb2ludDtcclxuICAgIGxldCBpO1xyXG4gICAgLy8gVE9ETzogY291bGQgb3B0aW1pemUgdG8gaW50ZXJzZWN0IGRpZmZlcmVudGx5IHNvIHdlIGJhaWwgc29vbmVyIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgY29uc3QgaG9yaXpvbnRhbFJheUludGVyc2VjdGlvbnMgPSB0aGlzLmludGVyc2VjdGlvbiggbWluSG9yaXpvbnRhbFJheSApLmNvbmNhdCggdGhpcy5pbnRlcnNlY3Rpb24oIG1heEhvcml6b250YWxSYXkgKSApO1xyXG4gICAgZm9yICggaSA9IDA7IGkgPCBob3Jpem9udGFsUmF5SW50ZXJzZWN0aW9ucy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgaGl0UG9pbnQgPSBob3Jpem9udGFsUmF5SW50ZXJzZWN0aW9uc1sgaSBdLnBvaW50O1xyXG4gICAgICBpZiAoIGhpdFBvaW50LnggPj0gYm91bmRzLm1pblggJiYgaGl0UG9pbnQueCA8PSBib3VuZHMubWF4WCApIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHZlcnRpY2FsUmF5SW50ZXJzZWN0aW9ucyA9IHRoaXMuaW50ZXJzZWN0aW9uKCBtaW5WZXJ0aWNhbFJheSApLmNvbmNhdCggdGhpcy5pbnRlcnNlY3Rpb24oIG1heFZlcnRpY2FsUmF5ICkgKTtcclxuICAgIGZvciAoIGkgPSAwOyBpIDwgdmVydGljYWxSYXlJbnRlcnNlY3Rpb25zLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBoaXRQb2ludCA9IHZlcnRpY2FsUmF5SW50ZXJzZWN0aW9uc1sgaSBdLnBvaW50O1xyXG4gICAgICBpZiAoIGhpdFBvaW50LnkgPj0gYm91bmRzLm1pblkgJiYgaGl0UG9pbnQueSA8PSBib3VuZHMubWF4WSApIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIG5vdCBjb250YWluZWQsIGFuZCBubyBpbnRlcnNlY3Rpb25zIHdpdGggdGhlIHNpZGVzIG9mIHRoZSBib3VuZGluZyBib3hcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgU2hhcGUgdGhhdCBpcyBhbiBvdXRsaW5lIG9mIHRoZSBzdHJva2VkIHBhdGggb2YgdGhpcyBjdXJyZW50IFNoYXBlLiBjdXJyZW50bHkgbm90IGludGVuZGVkIHRvIGJlXHJcbiAgICogbmVzdGVkIChkb2Vzbid0IGRvIGludGVyc2VjdGlvbiBjb21wdXRhdGlvbnMgeWV0KVxyXG4gICAqXHJcbiAgICogVE9ETzogcmVuYW1lIHN0cm9rZWQoIGxpbmVTdHlsZXMgKT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICovXHJcbiAgcHVibGljIGdldFN0cm9rZWRTaGFwZSggbGluZVN0eWxlczogTGluZVN0eWxlcyApOiBTaGFwZSB7XHJcbiAgICBsZXQgc3VicGF0aHM6IFN1YnBhdGhbXSA9IFtdO1xyXG4gICAgY29uc3QgYm91bmRzID0gQm91bmRzMi5OT1RISU5HLmNvcHkoKTtcclxuICAgIGxldCBzdWJMZW4gPSB0aGlzLnN1YnBhdGhzLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHN1YkxlbjsgaSsrICkge1xyXG4gICAgICBjb25zdCBzdWJwYXRoID0gdGhpcy5zdWJwYXRoc1sgaSBdO1xyXG4gICAgICBjb25zdCBzdHJva2VkU3VicGF0aCA9IHN1YnBhdGguc3Ryb2tlZCggbGluZVN0eWxlcyApO1xyXG4gICAgICBzdWJwYXRocyA9IHN1YnBhdGhzLmNvbmNhdCggc3Ryb2tlZFN1YnBhdGggKTtcclxuICAgIH1cclxuICAgIHN1YkxlbiA9IHN1YnBhdGhzLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHN1YkxlbjsgaSsrICkge1xyXG4gICAgICBib3VuZHMuaW5jbHVkZUJvdW5kcyggc3VicGF0aHNbIGkgXS5ib3VuZHMgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgU2hhcGUoIHN1YnBhdGhzLCBib3VuZHMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgYSBzaGFwZSBvZmZzZXQgYnkgYSBjZXJ0YWluIGFtb3VudC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0T2Zmc2V0U2hhcGUoIGRpc3RhbmNlOiBudW1iZXIgKTogU2hhcGUge1xyXG4gICAgLy8gVE9ETzogYWJzdHJhY3QgYXdheSB0aGlzIHR5cGUgb2YgYmVoYXZpb3IgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICBjb25zdCBzdWJwYXRocyA9IFtdO1xyXG4gICAgY29uc3QgYm91bmRzID0gQm91bmRzMi5OT1RISU5HLmNvcHkoKTtcclxuICAgIGxldCBzdWJMZW4gPSB0aGlzLnN1YnBhdGhzLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHN1YkxlbjsgaSsrICkge1xyXG4gICAgICBzdWJwYXRocy5wdXNoKCB0aGlzLnN1YnBhdGhzWyBpIF0ub2Zmc2V0KCBkaXN0YW5jZSApICk7XHJcbiAgICB9XHJcbiAgICBzdWJMZW4gPSBzdWJwYXRocy5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdWJMZW47IGkrKyApIHtcclxuICAgICAgYm91bmRzLmluY2x1ZGVCb3VuZHMoIHN1YnBhdGhzWyBpIF0uYm91bmRzICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IFNoYXBlKCBzdWJwYXRocywgYm91bmRzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgY29weSBvZiB0aGlzIHN1YnBhdGggd2l0aCB0aGUgZGFzaCBcImhvbGVzXCIgcmVtb3ZlZCAoaGFzIG1hbnkgc3VicGF0aHMgdXN1YWxseSkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldERhc2hlZFNoYXBlKCBsaW5lRGFzaDogbnVtYmVyW10sIGxpbmVEYXNoT2Zmc2V0OiBudW1iZXIsIHByb3ZpZGVkT3B0aW9ucz86IEdldERhc2hlZFNoYXBlT3B0aW9ucyApOiBTaGFwZSB7XHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPEdldERhc2hlZFNoYXBlT3B0aW9ucz4oKSgge1xyXG4gICAgICBkaXN0YW5jZUVwc2lsb246IDFlLTEwLFxyXG4gICAgICBjdXJ2ZUVwc2lsb246IDFlLThcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHJldHVybiBuZXcgU2hhcGUoIF8uZmxhdHRlbiggdGhpcy5zdWJwYXRocy5tYXAoIHN1YnBhdGggPT4gc3VicGF0aC5kYXNoZWQoIGxpbmVEYXNoLCBsaW5lRGFzaE9mZnNldCwgb3B0aW9ucy5kaXN0YW5jZUVwc2lsb24sIG9wdGlvbnMuY3VydmVFcHNpbG9uICkgKSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBib3VuZHMgb2YgdGhpcyBzaGFwZS4gSXQgaXMgdGhlIGJvdW5kaW5nLWJveCB1bmlvbiBvZiB0aGUgYm91bmRzIG9mIGVhY2ggc3VicGF0aCBjb250YWluZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIGlmICggdGhpcy5fYm91bmRzID09PSBudWxsICkge1xyXG4gICAgICBjb25zdCBib3VuZHMgPSBCb3VuZHMyLk5PVEhJTkcuY29weSgpO1xyXG4gICAgICBfLmVhY2goIHRoaXMuc3VicGF0aHMsIHN1YnBhdGggPT4ge1xyXG4gICAgICAgIGJvdW5kcy5pbmNsdWRlQm91bmRzKCBzdWJwYXRoLmdldEJvdW5kcygpICk7XHJcbiAgICAgIH0gKTtcclxuICAgICAgdGhpcy5fYm91bmRzID0gYm91bmRzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX2JvdW5kcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgYm91bmRzKCk6IEJvdW5kczIgeyByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBib3VuZHMgZm9yIGEgc3Ryb2tlZCB2ZXJzaW9uIG9mIHRoaXMgc2hhcGUuIFRoZSBpbnB1dCBsaW5lU3R5bGVzIGFyZSB1c2VkIHRvIGRldGVybWluZSB0aGUgc2l6ZSBhbmRcclxuICAgKiBzdHlsZSBvZiB0aGUgc3Ryb2tlLCBhbmQgdGhlbiB0aGUgYm91bmRzIG9mIHRoZSBzdHJva2VkIHNoYXBlIGFyZSByZXR1cm5lZC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U3Ryb2tlZEJvdW5kcyggbGluZVN0eWxlczogTGluZVN0eWxlcyApOiBCb3VuZHMyIHtcclxuXHJcbiAgICAvLyBDaGVjayBpZiBhbGwgb2Ygb3VyIHNlZ21lbnRzIGVuZCB2ZXJ0aWNhbGx5IG9yIGhvcml6b250YWxseSBBTkQgb3VyIGRyYXdhYmxlIHN1YnBhdGhzIGFyZSBhbGwgY2xvc2VkLiBJZiBzbyxcclxuICAgIC8vIHdlIGNhbiBhcHBseSBhIGJvdW5kcyBkaWxhdGlvbi5cclxuICAgIGxldCBhcmVTdHJva2VkQm91bmRzRGlsYXRlZCA9IHRydWU7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLnN1YnBhdGhzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBzdWJwYXRoID0gdGhpcy5zdWJwYXRoc1sgaSBdO1xyXG5cclxuICAgICAgLy8gSWYgYSBzdWJwYXRoIHdpdGggYW55IHNlZ21lbnRzIGlzIE5PVCBjbG9zZWQsIGxpbmUtY2FwcyB3aWxsIGFwcGx5LiBXZSBjYW4ndCBtYWtlIHRoZSBzaW1wbGlmaWNhdGlvbiBpbiB0aGlzXHJcbiAgICAgIC8vIGNhc2UuXHJcbiAgICAgIGlmICggc3VicGF0aC5pc0RyYXdhYmxlKCkgJiYgIXN1YnBhdGguaXNDbG9zZWQoKSApIHtcclxuICAgICAgICBhcmVTdHJva2VkQm91bmRzRGlsYXRlZCA9IGZhbHNlO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIGZvciAoIGxldCBqID0gMDsgaiA8IHN1YnBhdGguc2VnbWVudHMubGVuZ3RoOyBqKysgKSB7XHJcbiAgICAgICAgY29uc3Qgc2VnbWVudCA9IHN1YnBhdGguc2VnbWVudHNbIGogXTtcclxuICAgICAgICBpZiAoICFzZWdtZW50LmFyZVN0cm9rZWRCb3VuZHNEaWxhdGVkKCkgKSB7XHJcbiAgICAgICAgICBhcmVTdHJva2VkQm91bmRzRGlsYXRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBhcmVTdHJva2VkQm91bmRzRGlsYXRlZCApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYm91bmRzLmRpbGF0ZWQoIGxpbmVTdHlsZXMubGluZVdpZHRoIC8gMiApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvbnN0IGJvdW5kcyA9IHRoaXMuYm91bmRzLmNvcHkoKTtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5zdWJwYXRocy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBjb25zdCBzdWJwYXRocyA9IHRoaXMuc3VicGF0aHNbIGkgXS5zdHJva2VkKCBsaW5lU3R5bGVzICk7XHJcbiAgICAgICAgZm9yICggbGV0IGogPSAwOyBqIDwgc3VicGF0aHMubGVuZ3RoOyBqKysgKSB7XHJcbiAgICAgICAgICBib3VuZHMuaW5jbHVkZUJvdW5kcyggc3VicGF0aHNbIGogXS5ib3VuZHMgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGJvdW5kcztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBzaW1wbGlmaWVkIGZvcm0gb2YgdGhpcyBzaGFwZS5cclxuICAgKlxyXG4gICAqIFJ1bnMgaXQgdGhyb3VnaCB0aGUgbm9ybWFsIENBRyBwcm9jZXNzLCB3aGljaCBzaG91bGQgY29tYmluZSBhcmVhcyB3aGVyZSBwb3NzaWJsZSwgaGFuZGxlcyBzZWxmLWludGVyc2VjdGlvbixcclxuICAgKiBldGMuXHJcbiAgICpcclxuICAgKiBOT1RFOiBDdXJyZW50bHkgKDIwMTctMTAtMDQpIGFkamFjZW50IHNlZ21lbnRzIG1heSBnZXQgc2ltcGxpZmllZCBvbmx5IGlmIHRoZXkgYXJlIGxpbmVzLiBOb3QgeWV0IGNvbXBsZXRlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTaW1wbGlmaWVkQXJlYVNoYXBlKCk6IFNoYXBlIHtcclxuICAgIHJldHVybiBHcmFwaC5zaW1wbGlmeU5vblplcm8oIHRoaXMgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRCb3VuZHNXaXRoVHJhbnNmb3JtKCBtYXRyaXg6IE1hdHJpeDMsIGxpbmVTdHlsZXM/OiBMaW5lU3R5bGVzICk6IEJvdW5kczIge1xyXG4gICAgY29uc3QgYm91bmRzID0gQm91bmRzMi5OT1RISU5HLmNvcHkoKTtcclxuXHJcbiAgICBjb25zdCBudW1TdWJwYXRocyA9IHRoaXMuc3VicGF0aHMubGVuZ3RoO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbnVtU3VicGF0aHM7IGkrKyApIHtcclxuICAgICAgY29uc3Qgc3VicGF0aCA9IHRoaXMuc3VicGF0aHNbIGkgXTtcclxuICAgICAgYm91bmRzLmluY2x1ZGVCb3VuZHMoIHN1YnBhdGguZ2V0Qm91bmRzV2l0aFRyYW5zZm9ybSggbWF0cml4ICkgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGxpbmVTdHlsZXMgKSB7XHJcbiAgICAgIGJvdW5kcy5pbmNsdWRlQm91bmRzKCB0aGlzLmdldFN0cm9rZWRTaGFwZSggbGluZVN0eWxlcyApLmdldEJvdW5kc1dpdGhUcmFuc2Zvcm0oIG1hdHJpeCApICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGJvdW5kcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybiBhbiBhcHByb3hpbWF0ZSB2YWx1ZSBvZiB0aGUgYXJlYSBpbnNpZGUgb2YgdGhpcyBTaGFwZSAod2hlcmUgY29udGFpbnNQb2ludCBpcyB0cnVlKSB1c2luZyBNb250ZS1DYXJsby5cclxuICAgKlxyXG4gICAqIE5PVEU6IEdlbmVyYWxseSwgdXNlIGdldEFyZWEoKS4gVGhpcyBjYW4gYmUgdXNlZCBmb3IgdmVyaWZpY2F0aW9uLCBidXQgdGFrZXMgYSBsYXJnZSBudW1iZXIgb2Ygc2FtcGxlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBudW1TYW1wbGVzIC0gSG93IG1hbnkgdGltZXMgdG8gcmFuZG9tbHkgY2hlY2sgZm9yIGluY2x1c2lvbiBvZiBwb2ludHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEFwcHJveGltYXRlQXJlYSggbnVtU2FtcGxlczogbnVtYmVyICk6IG51bWJlciB7XHJcbiAgICBjb25zdCB4ID0gdGhpcy5ib3VuZHMubWluWDtcclxuICAgIGNvbnN0IHkgPSB0aGlzLmJvdW5kcy5taW5ZO1xyXG4gICAgY29uc3Qgd2lkdGggPSB0aGlzLmJvdW5kcy53aWR0aDtcclxuICAgIGNvbnN0IGhlaWdodCA9IHRoaXMuYm91bmRzLmhlaWdodDtcclxuXHJcbiAgICBjb25zdCByZWN0YW5nbGVBcmVhID0gd2lkdGggKiBoZWlnaHQ7XHJcbiAgICBsZXQgY291bnQgPSAwO1xyXG4gICAgY29uc3QgcG9pbnQgPSBuZXcgVmVjdG9yMiggMCwgMCApO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbnVtU2FtcGxlczsgaSsrICkge1xyXG4gICAgICBwb2ludC54ID0geCArIHJhbmRvbVNvdXJjZSgpICogd2lkdGg7XHJcbiAgICAgIHBvaW50LnkgPSB5ICsgcmFuZG9tU291cmNlKCkgKiBoZWlnaHQ7XHJcbiAgICAgIGlmICggdGhpcy5jb250YWluc1BvaW50KCBwb2ludCApICkge1xyXG4gICAgICAgIGNvdW50Kys7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZWN0YW5nbGVBcmVhICogY291bnQgLyBudW1TYW1wbGVzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJuIHRoZSBhcmVhIGluc2lkZSB0aGUgU2hhcGUgKHdoZXJlIGNvbnRhaW5zUG9pbnQgaXMgdHJ1ZSksIGFzc3VtaW5nIHRoZXJlIGlzIG5vIHNlbGYtaW50ZXJzZWN0aW9uIG9yXHJcbiAgICogb3ZlcmxhcCwgYW5kIHRoZSBzYW1lIG9yaWVudGF0aW9uICh3aW5kaW5nIG9yZGVyKSBpcyB1c2VkLiBTaG91bGQgYWxzbyBzdXBwb3J0IGhvbGVzICh3aXRoIG9wcG9zaXRlIG9yaWVudGF0aW9uKSxcclxuICAgKiBhc3N1bWluZyB0aGV5IGRvbid0IGludGVyc2VjdCB0aGUgY29udGFpbmluZyBzdWJwYXRoLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXROb25vdmVybGFwcGluZ0FyZWEoKTogbnVtYmVyIHtcclxuICAgIC8vIE9ubHkgYWJzb2x1dGUtdmFsdWUgdGhlIGZpbmFsIHZhbHVlLlxyXG4gICAgcmV0dXJuIE1hdGguYWJzKCBfLnN1bSggdGhpcy5zdWJwYXRocy5tYXAoIHN1YnBhdGggPT4gXy5zdW0oIHN1YnBhdGguZ2V0RmlsbFNlZ21lbnRzKCkubWFwKCBzZWdtZW50ID0+IHNlZ21lbnQuZ2V0U2lnbmVkQXJlYUZyYWdtZW50KCkgKSApICkgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYXJlYSBpbnNpZGUgdGhlIHNoYXBlLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyByZXF1aXJlcyBydW5uaW5nIGl0IHRocm91Z2ggYSBsb3Qgb2YgY29tcHV0YXRpb24gdG8gZGV0ZXJtaW5lIGEgbm9uLW92ZXJsYXBwaW5nIG5vbi1zZWxmLWludGVyc2VjdGluZ1xyXG4gICAqICAgICAgIGZvcm0gZmlyc3QuIElmIHRoZSBTaGFwZSBpcyBcInNpbXBsZVwiIGVub3VnaCwgZ2V0Tm9ub3ZlcmxhcHBpbmdBcmVhIHdvdWxkIGJlIHByZWZlcnJlZC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0QXJlYSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0U2ltcGxpZmllZEFyZWFTaGFwZSgpLmdldE5vbm92ZXJsYXBwaW5nQXJlYSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJuIHRoZSBhcHByb3hpbWF0ZSBsb2NhdGlvbiBvZiB0aGUgY2VudHJvaWQgb2YgdGhlIFNoYXBlICh0aGUgYXZlcmFnZSBvZiBhbGwgcG9pbnRzIHdoZXJlIGNvbnRhaW5zUG9pbnQgaXMgdHJ1ZSlcclxuICAgKiB1c2luZyBNb250ZS1DYXJsbyBtZXRob2RzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG51bVNhbXBsZXMgLSBIb3cgbWFueSB0aW1lcyB0byByYW5kb21seSBjaGVjayBmb3IgaW5jbHVzaW9uIG9mIHBvaW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0QXBwcm94aW1hdGVDZW50cm9pZCggbnVtU2FtcGxlczogbnVtYmVyICk6IFZlY3RvcjIge1xyXG4gICAgY29uc3QgeCA9IHRoaXMuYm91bmRzLm1pblg7XHJcbiAgICBjb25zdCB5ID0gdGhpcy5ib3VuZHMubWluWTtcclxuICAgIGNvbnN0IHdpZHRoID0gdGhpcy5ib3VuZHMud2lkdGg7XHJcbiAgICBjb25zdCBoZWlnaHQgPSB0aGlzLmJvdW5kcy5oZWlnaHQ7XHJcblxyXG4gICAgbGV0IGNvdW50ID0gMDtcclxuICAgIGNvbnN0IHN1bSA9IG5ldyBWZWN0b3IyKCAwLCAwICk7XHJcbiAgICBjb25zdCBwb2ludCA9IG5ldyBWZWN0b3IyKCAwLCAwICk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1TYW1wbGVzOyBpKysgKSB7XHJcbiAgICAgIHBvaW50LnggPSB4ICsgcmFuZG9tU291cmNlKCkgKiB3aWR0aDtcclxuICAgICAgcG9pbnQueSA9IHkgKyByYW5kb21Tb3VyY2UoKSAqIGhlaWdodDtcclxuICAgICAgaWYgKCB0aGlzLmNvbnRhaW5zUG9pbnQoIHBvaW50ICkgKSB7XHJcbiAgICAgICAgc3VtLmFkZCggcG9pbnQgKTtcclxuICAgICAgICBjb3VudCsrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc3VtLmRpdmlkZWRTY2FsYXIoIGNvdW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHBvdGVudGlhbCBjbG9zZXN0IHBvaW50IHJlc3VsdHMgb24gdGhlIFNoYXBlIHRvIHRoZSBnaXZlbiBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2xvc2VzdFBvaW50cyggcG9pbnQ6IFZlY3RvcjIgKTogQ2xvc2VzdFRvUG9pbnRSZXN1bHRbXSB7XHJcbiAgICByZXR1cm4gU2VnbWVudC5maWx0ZXJDbG9zZXN0VG9Qb2ludFJlc3VsdCggXy5mbGF0dGVuKCB0aGlzLnN1YnBhdGhzLm1hcCggc3VicGF0aCA9PiBzdWJwYXRoLmdldENsb3Nlc3RQb2ludHMoIHBvaW50ICkgKSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgc2luZ2xlIHBvaW50IE9OIHRoZSBTaGFwZSBib3VuZGFyeSB0aGF0IGlzIGNsb3Nlc3QgdG8gdGhlIGdpdmVuIHBvaW50IChwaWNrcyBhbiBhcmJpdHJhcnkgb25lIGlmIHRoZXJlXHJcbiAgICogYXJlIG11bHRpcGxlKS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2xvc2VzdFBvaW50KCBwb2ludDogVmVjdG9yMiApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldENsb3Nlc3RQb2ludHMoIHBvaW50IClbIDAgXS5jbG9zZXN0UG9pbnQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaG91bGQgYmUgY2FsbGVkIGFmdGVyIG11dGF0aW5nIHRoZSB4L3kgb2YgVmVjdG9yMiBwb2ludHMgdGhhdCB3ZXJlIHBhc3NlZCBpbiB0byB2YXJpb3VzIFNoYXBlIGNhbGxzLCBzbyB0aGF0XHJcbiAgICogZGVyaXZlZCBpbmZvcm1hdGlvbiBjb21wdXRlZCAoYm91bmRzLCBldGMuKSB3aWxsIGJlIGNvcnJlY3QsIGFuZCBhbnkgY2xpZW50cyAoZS5nLiBTY2VuZXJ5IFBhdGhzKSB3aWxsIGJlXHJcbiAgICogbm90aWZpZWQgb2YgdGhlIHVwZGF0ZXMuXHJcbiAgICovXHJcbiAgcHVibGljIGludmFsaWRhdGVQb2ludHMoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9pbnZhbGlkYXRpbmdQb2ludHMgPSB0cnVlO1xyXG5cclxuICAgIGNvbnN0IG51bVN1YnBhdGhzID0gdGhpcy5zdWJwYXRocy5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1TdWJwYXRoczsgaSsrICkge1xyXG4gICAgICB0aGlzLnN1YnBhdGhzWyBpIF0uaW52YWxpZGF0ZVBvaW50cygpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2ludmFsaWRhdGluZ1BvaW50cyA9IGZhbHNlO1xyXG4gICAgdGhpcy5pbnZhbGlkYXRlKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIC8vIFRPRE86IGNvbnNpZGVyIGEgbW9yZSB2ZXJib3NlIGJ1dCBzYWZlciB3YXk/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgcmV0dXJuIGBuZXcgcGhldC5raXRlLlNoYXBlKCAnJHt0aGlzLmdldFNWR1BhdGgoKX0nIClgO1xyXG4gIH1cclxuXHJcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXHJcbiAgICogSW50ZXJuYWwgc3VicGF0aCBjb21wdXRhdGlvbnNcclxuICAgKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuICBwcml2YXRlIGludmFsaWRhdGUoKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5faW1tdXRhYmxlLCAnQXR0ZW1wdCB0byBtb2RpZnkgYW4gaW1tdXRhYmxlIFNoYXBlJyApO1xyXG5cclxuICAgIGlmICggIXRoaXMuX2ludmFsaWRhdGluZ1BvaW50cyApIHtcclxuICAgICAgdGhpcy5fYm91bmRzID0gbnVsbDtcclxuXHJcbiAgICAgIHRoaXMubm90aWZ5SW52YWxpZGF0aW9uTGlzdGVuZXJzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBhIHBhcnQgb2YgdGhlIFNoYXBlIGhhcyBjaGFuZ2VkLCBvciBpZiBtZXRhZGF0YSBvbiB0aGUgU2hhcGUgaGFzIGNoYW5nZWQgKGUuZy4gaXQgYmVjYW1lIGltbXV0YWJsZSkuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBub3RpZnlJbnZhbGlkYXRpb25MaXN0ZW5lcnMoKTogdm9pZCB7XHJcbiAgICB0aGlzLmludmFsaWRhdGVkRW1pdHRlci5lbWl0KCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFkZFNlZ21lbnRBbmRCb3VuZHMoIHNlZ21lbnQ6IFNlZ21lbnQgKTogdm9pZCB7XHJcbiAgICB0aGlzLmdldExhc3RTdWJwYXRoKCkuYWRkU2VnbWVudCggc2VnbWVudCApO1xyXG4gICAgdGhpcy5pbnZhbGlkYXRlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYWtlcyBzdXJlIHRoYXQgd2UgaGF2ZSBhIHN1YnBhdGggKGFuZCBpZiB0aGVyZSBpcyBubyBzdWJwYXRoLCBzdGFydCBpdCBhdCB0aGlzIHBvaW50KVxyXG4gICAqL1xyXG4gIHByaXZhdGUgZW5zdXJlKCBwb2ludDogVmVjdG9yMiApOiB2b2lkIHtcclxuICAgIGlmICggIXRoaXMuaGFzU3VicGF0aHMoKSApIHtcclxuICAgICAgdGhpcy5hZGRTdWJwYXRoKCBuZXcgU3VicGF0aCgpICk7XHJcbiAgICAgIHRoaXMuZ2V0TGFzdFN1YnBhdGgoKS5hZGRQb2ludCggcG9pbnQgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBzdWJwYXRoXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhZGRTdWJwYXRoKCBzdWJwYXRoOiBTdWJwYXRoICk6IHRoaXMge1xyXG4gICAgdGhpcy5zdWJwYXRocy5wdXNoKCBzdWJwYXRoICk7XHJcblxyXG4gICAgLy8gbGlzdGVuIHRvIHdoZW4gdGhlIHN1YnBhdGggaXMgaW52YWxpZGF0ZWQgKHdpbGwgY2F1c2UgYm91bmRzIHJlY29tcHV0YXRpb24gaGVyZSlcclxuICAgIHN1YnBhdGguaW52YWxpZGF0ZWRFbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLl9pbnZhbGlkYXRlTGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZXMgaWYgdGhlcmUgYXJlIGFueSBzdWJwYXRoc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFzU3VicGF0aHMoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5zdWJwYXRocy5sZW5ndGggPiAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgbGFzdCBzdWJwYXRoXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRMYXN0U3VicGF0aCgpOiBTdWJwYXRoIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaGFzU3VicGF0aHMoKSwgJ1dlIHNob3VsZCBoYXZlIGEgc3VicGF0aCBpZiB0aGlzIGlzIGNhbGxlZCcgKTtcclxuXHJcbiAgICByZXR1cm4gXy5sYXN0KCB0aGlzLnN1YnBhdGhzICkhO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgbGFzdCBwb2ludCBpbiB0aGUgbGFzdCBzdWJwYXRoLCBvciBudWxsIGlmIGl0IGRvZXNuJ3QgZXhpc3RcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGFzdFBvaW50KCk6IFZlY3RvcjIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5oYXNTdWJwYXRocygpLCAnV2Ugc2hvdWxkIGhhdmUgYSBzdWJwYXRoIGlmIHRoaXMgaXMgY2FsbGVkJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5nZXRMYXN0U3VicGF0aCgpLmdldExhc3RQb2ludCgpLCAnV2Ugc2hvdWxkIGhhdmUgYSBsYXN0IHBvaW50JyApO1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TGFzdFN1YnBhdGgoKS5nZXRMYXN0UG9pbnQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIGxhc3QgZHJhd2FibGUgc2VnbWVudCBpbiB0aGUgbGFzdCBzdWJwYXRoLCBvciBudWxsIGlmIGl0IGRvZXNuJ3QgZXhpc3RcclxuICAgKi9cclxuICBwcml2YXRlIGdldExhc3RTZWdtZW50KCk6IFNlZ21lbnQgfCBudWxsIHtcclxuICAgIGlmICggIXRoaXMuaGFzU3VicGF0aHMoKSApIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICBjb25zdCBzdWJwYXRoID0gdGhpcy5nZXRMYXN0U3VicGF0aCgpO1xyXG4gICAgaWYgKCAhc3VicGF0aC5pc0RyYXdhYmxlKCkgKSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgcmV0dXJuIHN1YnBhdGguZ2V0TGFzdFNlZ21lbnQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNvbnRyb2wgcG9pbnQgdG8gYmUgdXNlZCB0byBjcmVhdGUgYSBzbW9vdGggcXVhZHJhdGljIHNlZ21lbnRzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRTbW9vdGhRdWFkcmF0aWNDb250cm9sUG9pbnQoKTogVmVjdG9yMiB7XHJcbiAgICBjb25zdCBsYXN0UG9pbnQgPSB0aGlzLmdldExhc3RQb2ludCgpO1xyXG5cclxuICAgIGlmICggdGhpcy5sYXN0UXVhZHJhdGljQ29udHJvbFBvaW50ICkge1xyXG4gICAgICByZXR1cm4gbGFzdFBvaW50LnBsdXMoIGxhc3RQb2ludC5taW51cyggdGhpcy5sYXN0UXVhZHJhdGljQ29udHJvbFBvaW50ICkgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gbGFzdFBvaW50O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY29udHJvbCBwb2ludCB0byBiZSB1c2VkIHRvIGNyZWF0ZSBhIHNtb290aCBjdWJpYyBzZWdtZW50XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRTbW9vdGhDdWJpY0NvbnRyb2xQb2ludCgpOiBWZWN0b3IyIHtcclxuICAgIGNvbnN0IGxhc3RQb2ludCA9IHRoaXMuZ2V0TGFzdFBvaW50KCk7XHJcblxyXG4gICAgaWYgKCB0aGlzLmxhc3RDdWJpY0NvbnRyb2xQb2ludCApIHtcclxuICAgICAgcmV0dXJuIGxhc3RQb2ludC5wbHVzKCBsYXN0UG9pbnQubWludXMoIHRoaXMubGFzdEN1YmljQ29udHJvbFBvaW50ICkgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gbGFzdFBvaW50O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbGFzdCBwb2ludCBpbiB0aGUgbGFzdCBzdWJwYXRoLCBvciB0aGUgVmVjdG9yIFpFUk8gaWYgaXQgZG9lc24ndCBleGlzdFxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0UmVsYXRpdmVQb2ludCgpOiBWZWN0b3IyIHtcclxuICAgIGxldCByZXN1bHQgPSBWZWN0b3IyLlpFUk87XHJcblxyXG4gICAgaWYgKCB0aGlzLmhhc1N1YnBhdGhzKCkgKSB7XHJcbiAgICAgIGNvbnN0IHN1YnBhdGggPSB0aGlzLmdldExhc3RTdWJwYXRoKCk7XHJcbiAgICAgIGlmICggc3VicGF0aC5wb2ludHMubGVuZ3RoICkge1xyXG4gICAgICAgIHJlc3VsdCA9IHN1YnBhdGguZ2V0TGFzdFBvaW50KCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5ldyBzaGFwZSB0aGF0IGNvbnRhaW5zIGEgdW5pb24gb2YgdGhlIHR3byBzaGFwZXMgKGEgcG9pbnQgaW4gZWl0aGVyIHNoYXBlIGlzIGluIHRoZSByZXN1bHRpbmcgc2hhcGUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzaGFwZVVuaW9uKCBzaGFwZTogU2hhcGUgKTogU2hhcGUge1xyXG4gICAgcmV0dXJuIEdyYXBoLmJpbmFyeVJlc3VsdCggdGhpcywgc2hhcGUsIEdyYXBoLkJJTkFSWV9OT05aRVJPX1VOSU9OICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbmV3IHNoYXBlIHRoYXQgY29udGFpbnMgdGhlIGludGVyc2VjdGlvbiBvZiB0aGUgdHdvIHNoYXBlcyAoYSBwb2ludCBpbiBib3RoIHNoYXBlcyBpcyBpbiB0aGVcclxuICAgKiByZXN1bHRpbmcgc2hhcGUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzaGFwZUludGVyc2VjdGlvbiggc2hhcGU6IFNoYXBlICk6IFNoYXBlIHtcclxuICAgIHJldHVybiBHcmFwaC5iaW5hcnlSZXN1bHQoIHRoaXMsIHNoYXBlLCBHcmFwaC5CSU5BUllfTk9OWkVST19JTlRFUlNFQ1RJT04gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgc2hhcGUgdGhhdCBjb250YWlucyB0aGUgZGlmZmVyZW5jZSBvZiB0aGUgdHdvIHNoYXBlcyAoYSBwb2ludCBpbiB0aGUgZmlyc3Qgc2hhcGUgYW5kIE5PVCBpbiB0aGVcclxuICAgKiBzZWNvbmQgc2hhcGUgaXMgaW4gdGhlIHJlc3VsdGluZyBzaGFwZSkuXHJcbiAgICovXHJcbiAgcHVibGljIHNoYXBlRGlmZmVyZW5jZSggc2hhcGU6IFNoYXBlICk6IFNoYXBlIHtcclxuICAgIHJldHVybiBHcmFwaC5iaW5hcnlSZXN1bHQoIHRoaXMsIHNoYXBlLCBHcmFwaC5CSU5BUllfTk9OWkVST19ESUZGRVJFTkNFICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbmV3IHNoYXBlIHRoYXQgY29udGFpbnMgdGhlIHhvciBvZiB0aGUgdHdvIHNoYXBlcyAoYSBwb2ludCBpbiBvbmx5IG9uZSBzaGFwZSBpcyBpbiB0aGUgcmVzdWx0aW5nXHJcbiAgICogc2hhcGUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzaGFwZVhvciggc2hhcGU6IFNoYXBlICk6IFNoYXBlIHtcclxuICAgIHJldHVybiBHcmFwaC5iaW5hcnlSZXN1bHQoIHRoaXMsIHNoYXBlLCBHcmFwaC5CSU5BUllfTk9OWkVST19YT1IgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgc2hhcGUgdGhhdCBvbmx5IGNvbnRhaW5zIHBvcnRpb25zIG9mIHNlZ21lbnRzIHRoYXQgYXJlIHdpdGhpbiB0aGUgcGFzc2VkLWluIHNoYXBlJ3MgYXJlYS5cclxuICAgKlxyXG4gICAqIC8vIFRPRE86IGNvbnZlcnQgR3JhcGggdG8gVFMgYW5kIGdldCB0aGUgdHlwZXMgZnJvbSB0aGVyZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgKi9cclxuICBwdWJsaWMgc2hhcGVDbGlwKCBzaGFwZTogU2hhcGUsIG9wdGlvbnM/OiB7IGluY2x1ZGVFeHRlcmlvcj86IGJvb2xlYW47IGluY2x1ZGVCb3VuZGFyeTogYm9vbGVhbjsgaW5jbHVkZUludGVyaW9yOiBib29sZWFuIH0gKTogU2hhcGUge1xyXG4gICAgcmV0dXJuIEdyYXBoLmNsaXBTaGFwZSggc2hhcGUsIHRoaXMsIG9wdGlvbnMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIChzb21ldGltZXMgYXBwcm94aW1hdGUpIGFyYyBsZW5ndGggb2YgYWxsIHRoZSBzaGFwZSdzIHN1YnBhdGhzIGNvbWJpbmVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRBcmNMZW5ndGgoIGRpc3RhbmNlRXBzaWxvbj86IG51bWJlciwgY3VydmVFcHNpbG9uPzogbnVtYmVyLCBtYXhMZXZlbHM/OiBudW1iZXIgKTogbnVtYmVyIHtcclxuICAgIGxldCBsZW5ndGggPSAwO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5zdWJwYXRocy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgbGVuZ3RoICs9IHRoaXMuc3VicGF0aHNbIGkgXS5nZXRBcmNMZW5ndGgoIGRpc3RhbmNlRXBzaWxvbiwgY3VydmVFcHNpbG9uLCBtYXhMZXZlbHMgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBsZW5ndGg7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIG9iamVjdCBmb3JtIHRoYXQgY2FuIGJlIHR1cm5lZCBiYWNrIGludG8gYSBzZWdtZW50IHdpdGggdGhlIGNvcnJlc3BvbmRpbmcgZGVzZXJpYWxpemUgbWV0aG9kLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXJpYWxpemUoKTogU2VyaWFsaXplZFNoYXBlIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6ICdTaGFwZScsXHJcbiAgICAgIHN1YnBhdGhzOiB0aGlzLnN1YnBhdGhzLm1hcCggc3VicGF0aCA9PiBzdWJwYXRoLnNlcmlhbGl6ZSgpIClcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgU2hhcGUgZnJvbSB0aGUgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGRlc2VyaWFsaXplKCBvYmo6IFNlcmlhbGl6ZWRTaGFwZSApOiBTaGFwZSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvYmoudHlwZSA9PT0gJ1NoYXBlJyApO1xyXG5cclxuICAgIHJldHVybiBuZXcgU2hhcGUoIG9iai5zdWJwYXRocy5tYXAoIFN1YnBhdGguZGVzZXJpYWxpemUgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIHJlY3RhbmdsZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVjdGFuZ2xlKCB4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIgKTogU2hhcGUge1xyXG4gICAgcmV0dXJuIG5ldyBTaGFwZSgpLnJlY3QoIHgsIHksIHdpZHRoLCBoZWlnaHQgKTtcclxuICB9XHJcbiAgcHVibGljIHN0YXRpYyByZWN0ID0gU2hhcGUucmVjdGFuZ2xlO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgcm91bmQgcmVjdGFuZ2xlIHtTaGFwZX0sIHdpdGgge251bWJlcn0gYXJndW1lbnRzLiBVc2VzIGNpcmN1bGFyIG9yIGVsbGlwdGljYWwgYXJjcyBpZiBnaXZlbi5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJvdW5kUmVjdCggeDogbnVtYmVyLCB5OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBhcmN3OiBudW1iZXIsIGFyY2g6IG51bWJlciApOiBTaGFwZSB7XHJcbiAgICByZXR1cm4gbmV3IFNoYXBlKCkucm91bmRSZWN0KCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBhcmN3LCBhcmNoICk7XHJcbiAgfVxyXG4gIHB1YmxpYyBzdGF0aWMgcm91bmRSZWN0YW5nbGUgPSBTaGFwZS5yb3VuZFJlY3Q7XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSByb3VuZGVkIHJlY3RhbmdsZSwgd2hlcmUgZWFjaCBjb3JuZXIgY2FuIGhhdmUgYSBkaWZmZXJlbnQgcmFkaXVzLiBUaGUgcmFkaWkgZGVmYXVsdCB0byAwLCBhbmQgbWF5IGJlIHNldFxyXG4gICAqIHVzaW5nIHRvcExlZnQsIHRvcFJpZ2h0LCBib3R0b21MZWZ0IGFuZCBib3R0b21SaWdodCBpbiB0aGUgb3B0aW9ucy4gSWYgdGhlIHNwZWNpZmllZCByYWRpaSBhcmUgbGFyZ2VyIHRoYW4gdGhlIGRpbWVuc2lvblxyXG4gICAqIG9uIHRoYXQgc2lkZSwgdGhleSByYWRpaSBhcmUgcmVkdWNlZCBwcm9wb3J0aW9uYWxseSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy91bmRlci1wcmVzc3VyZS9pc3N1ZXMvMTUxXHJcbiAgICpcclxuICAgKiBFLmcuOlxyXG4gICAqXHJcbiAgICogdmFyIGNvcm5lclJhZGl1cyA9IDIwO1xyXG4gICAqIHZhciByZWN0ID0gU2hhcGUucm91bmRlZFJlY3RhbmdsZVdpdGhSYWRpaSggMCwgMCwgMjAwLCAxMDAsIHtcclxuICAgKiAgIHRvcExlZnQ6IGNvcm5lclJhZGl1cyxcclxuICAgKiAgIHRvcFJpZ2h0OiBjb3JuZXJSYWRpdXNcclxuICAgKiB9ICk7XHJcbiAgICpcclxuICAgKiBAcGFyYW0geCAtIExlZnQgZWRnZSBwb3NpdGlvblxyXG4gICAqIEBwYXJhbSB5IC0gVG9wIGVkZ2UgcG9zaXRpb25cclxuICAgKiBAcGFyYW0gd2lkdGggLSBXaWR0aCBvZiByZWN0YW5nbGVcclxuICAgKiBAcGFyYW0gaGVpZ2h0IC0gSGVpZ2h0IG9mIHJlY3RhbmdsZVxyXG4gICAqIEBwYXJhbSBbY29ybmVyUmFkaWldIC0gT3B0aW9uYWwgb2JqZWN0IHdpdGggcG90ZW50aWFsIHJhZGlpIGZvciBlYWNoIGNvcm5lci5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJvdW5kZWRSZWN0YW5nbGVXaXRoUmFkaWkoIHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgY29ybmVyUmFkaWk/OiBQYXJ0aWFsPENvcm5lclJhZGlpT3B0aW9ucz4gKTogU2hhcGUge1xyXG5cclxuICAgIC8vIGRlZmF1bHRzIHRvIDAgKG5vdCB1c2luZyBtZXJnZSwgc2luY2Ugd2UgcmVmZXJlbmNlIGVhY2ggbXVsdGlwbGUgdGltZXMpXHJcbiAgICBsZXQgdG9wTGVmdFJhZGl1cyA9IGNvcm5lclJhZGlpICYmIGNvcm5lclJhZGlpLnRvcExlZnQgfHwgMDtcclxuICAgIGxldCB0b3BSaWdodFJhZGl1cyA9IGNvcm5lclJhZGlpICYmIGNvcm5lclJhZGlpLnRvcFJpZ2h0IHx8IDA7XHJcbiAgICBsZXQgYm90dG9tTGVmdFJhZGl1cyA9IGNvcm5lclJhZGlpICYmIGNvcm5lclJhZGlpLmJvdHRvbUxlZnQgfHwgMDtcclxuICAgIGxldCBib3R0b21SaWdodFJhZGl1cyA9IGNvcm5lclJhZGlpICYmIGNvcm5lclJhZGlpLmJvdHRvbVJpZ2h0IHx8IDA7XHJcblxyXG4gICAgLy8gdHlwZSBhbmQgY29uc3RyYWludCBhc3NlcnRpb25zXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeCApLCAnTm9uLWZpbml0ZSB4JyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHkgKSwgJ05vbi1maW5pdGUgeScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHdpZHRoID49IDAgJiYgaXNGaW5pdGUoIHdpZHRoICksICdOZWdhdGl2ZSBvciBub24tZmluaXRlIHdpZHRoJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaGVpZ2h0ID49IDAgJiYgaXNGaW5pdGUoIGhlaWdodCApLCAnTmVnYXRpdmUgb3Igbm9uLWZpbml0ZSBoZWlnaHQnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0b3BMZWZ0UmFkaXVzID49IDAgJiYgaXNGaW5pdGUoIHRvcExlZnRSYWRpdXMgKSxcclxuICAgICAgJ0ludmFsaWQgdG9wTGVmdCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRvcFJpZ2h0UmFkaXVzID49IDAgJiYgaXNGaW5pdGUoIHRvcFJpZ2h0UmFkaXVzICksXHJcbiAgICAgICdJbnZhbGlkIHRvcFJpZ2h0JyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggYm90dG9tTGVmdFJhZGl1cyA+PSAwICYmIGlzRmluaXRlKCBib3R0b21MZWZ0UmFkaXVzICksXHJcbiAgICAgICdJbnZhbGlkIGJvdHRvbUxlZnQnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBib3R0b21SaWdodFJhZGl1cyA+PSAwICYmIGlzRmluaXRlKCBib3R0b21SaWdodFJhZGl1cyApLFxyXG4gICAgICAnSW52YWxpZCBib3R0b21SaWdodCcgKTtcclxuXHJcbiAgICAvLyBUaGUgd2lkdGggYW5kIGhlaWdodCB0YWtlIHByZWNlZGVuY2Ugb3ZlciB0aGUgY29ybmVyIHJhZGlpLiBJZiB0aGUgc3VtIG9mIHRoZSBjb3JuZXIgcmFkaWkgZXhjZWVkXHJcbiAgICAvLyB0aGF0IGRpbWVuc2lvbiwgdGhlbiB0aGUgY29ybmVyIHJhZGlpIGFyZSByZWR1Y2VkIHByb3BvcnRpb25hdGVseVxyXG4gICAgY29uc3QgdG9wU3VtID0gdG9wTGVmdFJhZGl1cyArIHRvcFJpZ2h0UmFkaXVzO1xyXG4gICAgaWYgKCB0b3BTdW0gPiB3aWR0aCAmJiB0b3BTdW0gPiAwICkge1xyXG5cclxuICAgICAgdG9wTGVmdFJhZGl1cyA9IHRvcExlZnRSYWRpdXMgLyB0b3BTdW0gKiB3aWR0aDtcclxuICAgICAgdG9wUmlnaHRSYWRpdXMgPSB0b3BSaWdodFJhZGl1cyAvIHRvcFN1bSAqIHdpZHRoO1xyXG4gICAgfVxyXG4gICAgY29uc3QgYm90dG9tU3VtID0gYm90dG9tTGVmdFJhZGl1cyArIGJvdHRvbVJpZ2h0UmFkaXVzO1xyXG4gICAgaWYgKCBib3R0b21TdW0gPiB3aWR0aCAmJiBib3R0b21TdW0gPiAwICkge1xyXG5cclxuICAgICAgYm90dG9tTGVmdFJhZGl1cyA9IGJvdHRvbUxlZnRSYWRpdXMgLyBib3R0b21TdW0gKiB3aWR0aDtcclxuICAgICAgYm90dG9tUmlnaHRSYWRpdXMgPSBib3R0b21SaWdodFJhZGl1cyAvIGJvdHRvbVN1bSAqIHdpZHRoO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbGVmdFN1bSA9IHRvcExlZnRSYWRpdXMgKyBib3R0b21MZWZ0UmFkaXVzO1xyXG4gICAgaWYgKCBsZWZ0U3VtID4gaGVpZ2h0ICYmIGxlZnRTdW0gPiAwICkge1xyXG5cclxuICAgICAgdG9wTGVmdFJhZGl1cyA9IHRvcExlZnRSYWRpdXMgLyBsZWZ0U3VtICogaGVpZ2h0O1xyXG4gICAgICBib3R0b21MZWZ0UmFkaXVzID0gYm90dG9tTGVmdFJhZGl1cyAvIGxlZnRTdW0gKiBoZWlnaHQ7XHJcbiAgICB9XHJcbiAgICBjb25zdCByaWdodFN1bSA9IHRvcFJpZ2h0UmFkaXVzICsgYm90dG9tUmlnaHRSYWRpdXM7XHJcbiAgICBpZiAoIHJpZ2h0U3VtID4gaGVpZ2h0ICYmIHJpZ2h0U3VtID4gMCApIHtcclxuICAgICAgdG9wUmlnaHRSYWRpdXMgPSB0b3BSaWdodFJhZGl1cyAvIHJpZ2h0U3VtICogaGVpZ2h0O1xyXG4gICAgICBib3R0b21SaWdodFJhZGl1cyA9IGJvdHRvbVJpZ2h0UmFkaXVzIC8gcmlnaHRTdW0gKiBoZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdmVyaWZ5IHRoZXJlIGlzIG5vIG92ZXJsYXAgYmV0d2VlbiBjb3JuZXJzXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0b3BMZWZ0UmFkaXVzICsgdG9wUmlnaHRSYWRpdXMgPD0gd2lkdGgsICdDb3JuZXIgb3ZlcmxhcCBvbiB0b3AgZWRnZScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGJvdHRvbUxlZnRSYWRpdXMgKyBib3R0b21SaWdodFJhZGl1cyA8PSB3aWR0aCwgJ0Nvcm5lciBvdmVybGFwIG9uIGJvdHRvbSBlZGdlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdG9wTGVmdFJhZGl1cyArIGJvdHRvbUxlZnRSYWRpdXMgPD0gaGVpZ2h0LCAnQ29ybmVyIG92ZXJsYXAgb24gbGVmdCBlZGdlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdG9wUmlnaHRSYWRpdXMgKyBib3R0b21SaWdodFJhZGl1cyA8PSBoZWlnaHQsICdDb3JuZXIgb3ZlcmxhcCBvbiByaWdodCBlZGdlJyApO1xyXG5cclxuICAgIGNvbnN0IHNoYXBlID0gbmV3IFNoYXBlKCk7XHJcbiAgICBjb25zdCByaWdodCA9IHggKyB3aWR0aDtcclxuICAgIGNvbnN0IGJvdHRvbSA9IHkgKyBoZWlnaHQ7XHJcblxyXG4gICAgLy8gVG8gZHJhdyB0aGUgcm91bmRlZCByZWN0YW5nbGUsIHdlIHVzZSB0aGUgaW1wbGljaXQgXCJsaW5lIGZyb20gbGFzdCBzZWdtZW50IHRvIG5leHQgc2VnbWVudFwiIGFuZCB0aGUgY2xvc2UoKSBmb3JcclxuICAgIC8vIGFsbCB0aGUgc3RyYWlnaHQgbGluZSBlZGdlcyBiZXR3ZWVuIGFyY3MsIG9yIGxpbmVUbyB0aGUgY29ybmVyLlxyXG5cclxuICAgIGlmICggYm90dG9tUmlnaHRSYWRpdXMgPiAwICkge1xyXG4gICAgICBzaGFwZS5hcmMoIHJpZ2h0IC0gYm90dG9tUmlnaHRSYWRpdXMsIGJvdHRvbSAtIGJvdHRvbVJpZ2h0UmFkaXVzLCBib3R0b21SaWdodFJhZGl1cywgMCwgTWF0aC5QSSAvIDIsIGZhbHNlICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgc2hhcGUubW92ZVRvKCByaWdodCwgYm90dG9tICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBib3R0b21MZWZ0UmFkaXVzID4gMCApIHtcclxuICAgICAgc2hhcGUuYXJjKCB4ICsgYm90dG9tTGVmdFJhZGl1cywgYm90dG9tIC0gYm90dG9tTGVmdFJhZGl1cywgYm90dG9tTGVmdFJhZGl1cywgTWF0aC5QSSAvIDIsIE1hdGguUEksIGZhbHNlICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgc2hhcGUubGluZVRvKCB4LCBib3R0b20gKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRvcExlZnRSYWRpdXMgPiAwICkge1xyXG4gICAgICBzaGFwZS5hcmMoIHggKyB0b3BMZWZ0UmFkaXVzLCB5ICsgdG9wTGVmdFJhZGl1cywgdG9wTGVmdFJhZGl1cywgTWF0aC5QSSwgMyAqIE1hdGguUEkgLyAyLCBmYWxzZSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHNoYXBlLmxpbmVUbyggeCwgeSApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggdG9wUmlnaHRSYWRpdXMgPiAwICkge1xyXG4gICAgICBzaGFwZS5hcmMoIHJpZ2h0IC0gdG9wUmlnaHRSYWRpdXMsIHkgKyB0b3BSaWdodFJhZGl1cywgdG9wUmlnaHRSYWRpdXMsIDMgKiBNYXRoLlBJIC8gMiwgMiAqIE1hdGguUEksIGZhbHNlICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgc2hhcGUubGluZVRvKCByaWdodCwgeSApO1xyXG4gICAgfVxyXG5cclxuICAgIHNoYXBlLmNsb3NlKCk7XHJcblxyXG4gICAgcmV0dXJuIHNoYXBlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIFNoYXBlIGZyb20gYSBib3VuZHMsIG9mZnNldCAoZXhwYW5kZWQpIGJ5IGNlcnRhaW4gYW1vdW50cywgYW5kIHdpdGggY2VydGFpbiBjb3JuZXIgcmFkaWkuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBib3VuZHNPZmZzZXRXaXRoUmFkaWkoIGJvdW5kczogQm91bmRzMiwgb2Zmc2V0czogT2Zmc2V0c09wdGlvbnMsIHJhZGlpPzogQ29ybmVyUmFkaWlPcHRpb25zICk6IFNoYXBlIHtcclxuICAgIGNvbnN0IG9mZnNldEJvdW5kcyA9IGJvdW5kcy53aXRoT2Zmc2V0cyggb2Zmc2V0cy5sZWZ0LCBvZmZzZXRzLnRvcCwgb2Zmc2V0cy5yaWdodCwgb2Zmc2V0cy5ib3R0b20gKTtcclxuICAgIHJldHVybiBTaGFwZS5yb3VuZGVkUmVjdGFuZ2xlV2l0aFJhZGlpKCBvZmZzZXRCb3VuZHMubWluWCwgb2Zmc2V0Qm91bmRzLm1pblksIG9mZnNldEJvdW5kcy53aWR0aCwgb2Zmc2V0Qm91bmRzLmhlaWdodCwgcmFkaWkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBjbG9zZWQgcG9seWdvbiBmcm9tIGFuIGFycmF5IG9mIHZlcnRpY2VzIGJ5IGNvbm5lY3RpbmcgdGhlbSBieSBhIHNlcmllcyBvZiBsaW5lcy5cclxuICAgKiBUaGUgbGluZXMgYXJlIGpvaW5pbmcgdGhlIGFkamFjZW50IHZlcnRpY2VzIGluIHRoZSBhcnJheS5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHBvbHlnb24oIHZlcnRpY2VzOiBWZWN0b3IyW10gKTogU2hhcGUge1xyXG4gICAgcmV0dXJuIG5ldyBTaGFwZSgpLnBvbHlnb24oIHZlcnRpY2VzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgcmVjdGFuZ3VsYXIgc2hhcGUgZnJvbSBib3VuZHNcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGJvdW5kcyggYm91bmRzOiBCb3VuZHMyICk6IFNoYXBlIHtcclxuICAgIHJldHVybiBuZXcgU2hhcGUoKS5yZWN0KCBib3VuZHMubWluWCwgYm91bmRzLm1pblksIGJvdW5kcy5tYXhYIC0gYm91bmRzLm1pblgsIGJvdW5kcy5tYXhZIC0gYm91bmRzLm1pblkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBsaW5lIHNlZ21lbnQsIHVzaW5nIGVpdGhlciAoeDEseTEseDIseTIpIG9yICh7eDEseTF9LHt4Mix5Mn0pIGFyZ3VtZW50c1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgbGluZVNlZ21lbnQoIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyOiBudW1iZXIsIHkyOiBudW1iZXIgKTogU2hhcGU7XHJcbiAgcHVibGljIHN0YXRpYyBsaW5lU2VnbWVudCggcDE6IFZlY3RvcjIsIHAyOiBWZWN0b3IyICk6IFNoYXBlO1xyXG4gIHB1YmxpYyBzdGF0aWMgbGluZVNlZ21lbnQoIGE6IFZlY3RvcjIgfCBudW1iZXIsIGI6IFZlY3RvcjIgfCBudW1iZXIsIGM/OiBudW1iZXIsIGQ/OiBudW1iZXIgKTogU2hhcGUge1xyXG4gICAgaWYgKCB0eXBlb2YgYSA9PT0gJ251bWJlcicgKSB7XHJcbiAgICAgIHJldHVybiBuZXcgU2hhcGUoKS5tb3ZlVG8oIGEsIGIgYXMgbnVtYmVyICkubGluZVRvKCBjISwgZCEgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyB0aGVuIGEgYW5kIGIgbXVzdCBiZSB7VmVjdG9yMn1cclxuICAgICAgcmV0dXJuIG5ldyBTaGFwZSgpLm1vdmVUb1BvaW50KCBhICkubGluZVRvUG9pbnQoIGIgYXMgVmVjdG9yMiApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHJlZ3VsYXIgcG9seWdvbiBvZiByYWRpdXMgYW5kIG51bWJlciBvZiBzaWRlc1xyXG4gICAqIFRoZSByZWd1bGFyIHBvbHlnb24gaXMgb3JpZW50ZWQgc3VjaCB0aGF0IHRoZSBmaXJzdCB2ZXJ0ZXggbGllcyBvbiB0aGUgcG9zaXRpdmUgeC1heGlzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHNpZGVzIC0gYW4gaW50ZWdlclxyXG4gICAqIEBwYXJhbSByYWRpdXNcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlZ3VsYXJQb2x5Z29uKCBzaWRlczogbnVtYmVyLCByYWRpdXM6IG51bWJlciApOiBTaGFwZSB7XHJcbiAgICBjb25zdCBzaGFwZSA9IG5ldyBTaGFwZSgpO1xyXG4gICAgXy5lYWNoKCBfLnJhbmdlKCBzaWRlcyApLCBrID0+IHtcclxuICAgICAgY29uc3QgcG9pbnQgPSBWZWN0b3IyLmNyZWF0ZVBvbGFyKCByYWRpdXMsIDIgKiBNYXRoLlBJICogayAvIHNpZGVzICk7XHJcbiAgICAgICggayA9PT0gMCApID8gc2hhcGUubW92ZVRvUG9pbnQoIHBvaW50ICkgOiBzaGFwZS5saW5lVG9Qb2ludCggcG9pbnQgKTtcclxuICAgIH0gKTtcclxuICAgIHJldHVybiBzaGFwZS5jbG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIGNpcmNsZVxyXG4gICAqIHN1cHBvcnRzIGJvdGggY2lyY2xlKCBjZW50ZXJYLCBjZW50ZXJZLCByYWRpdXMgKSwgY2lyY2xlKCBjZW50ZXIsIHJhZGl1cyApLCBhbmQgY2lyY2xlKCByYWRpdXMgKSB3aXRoIHRoZSBjZW50ZXIgZGVmYXVsdCB0byAwLDBcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGNpcmNsZSggY2VudGVyWDogbnVtYmVyLCBjZW50ZXJZOiBudW1iZXIsIHJhZGl1czogbnVtYmVyICk6IFNoYXBlO1xyXG4gIHB1YmxpYyBzdGF0aWMgY2lyY2xlKCBjZW50ZXI6IFZlY3RvcjIsIHJhZGl1czogbnVtYmVyICk6IFNoYXBlO1xyXG4gIHB1YmxpYyBzdGF0aWMgY2lyY2xlKCByYWRpdXM6IG51bWJlciApOiBTaGFwZTtcclxuICBwdWJsaWMgc3RhdGljIGNpcmNsZSggYTogVmVjdG9yMiB8IG51bWJlciwgYj86IG51bWJlciwgYz86IG51bWJlciApOiBTaGFwZSB7XHJcbiAgICBpZiAoIGIgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgLy8gY2lyY2xlKCByYWRpdXMgKSwgY2VudGVyID0gMCwwXHJcbiAgICAgIHJldHVybiBuZXcgU2hhcGUoKS5jaXJjbGUoIDAsIDAsIGEgYXMgbnVtYmVyICk7XHJcbiAgICB9XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gVGhlIHNpZ25hdHVyZXMgYXJlIGNvbXBhdGlibGUsIGl0J3MganVzdCBtdWx0aXBsZSBkaWZmZXJlbnQgdHlwZXMgYXQgdGhlIHNhbWUgdGltZVxyXG4gICAgcmV0dXJuIG5ldyBTaGFwZSgpLmNpcmNsZSggYSwgYiwgYyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3VwcG9ydHMgZWxsaXBzZSggY2VudGVyWCwgY2VudGVyWSwgcmFkaXVzWCwgcmFkaXVzWSwgcm90YXRpb24gKSwgZWxsaXBzZSggY2VudGVyLCByYWRpdXNYLCByYWRpdXNZLCByb3RhdGlvbiApLCBhbmQgZWxsaXBzZSggcmFkaXVzWCwgcmFkaXVzWSwgcm90YXRpb24gKVxyXG4gICAqIHdpdGggdGhlIGNlbnRlciBkZWZhdWx0IHRvIDAsMCBhbmQgcm90YXRpb24gb2YgMC4gIFRoZSByb3RhdGlvbiBpcyBhYm91dCB0aGUgY2VudGVyWCwgY2VudGVyWS5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGVsbGlwc2UoIGNlbnRlclg6IG51bWJlciwgY2VudGVyWTogbnVtYmVyLCByYWRpdXNYOiBudW1iZXIsIHJhZGl1c1k6IG51bWJlciwgcm90YXRpb246IG51bWJlciApOiBTaGFwZTtcclxuICBwdWJsaWMgc3RhdGljIGVsbGlwc2UoIGNlbnRlcjogVmVjdG9yMiwgcmFkaXVzWDogbnVtYmVyLCByYWRpdXNZOiBudW1iZXIsIHJvdGF0aW9uOiBudW1iZXIgKTogU2hhcGU7XHJcbiAgcHVibGljIHN0YXRpYyBlbGxpcHNlKCByYWRpdXNYOiBudW1iZXIsIHJhZGl1c1k6IG51bWJlciwgcm90YXRpb246IG51bWJlciApOiBTaGFwZTtcclxuICBwdWJsaWMgc3RhdGljIGVsbGlwc2UoIGE6IFZlY3RvcjIgfCBudW1iZXIsIGI6IG51bWJlciwgYzogbnVtYmVyLCBkPzogbnVtYmVyLCBlPzogbnVtYmVyICk6IFNoYXBlIHtcclxuICAgIC8vIFRPRE86IEVsbGlwc2UvRWxsaXB0aWNhbEFyYyBoYXMgYSBtZXNzIG9mIHBhcmFtZXRlcnMuIENvbnNpZGVyIHBhcmFtZXRlciBvYmplY3QsIG9yIGRvdWJsZS1jaGVjayBwYXJhbWV0ZXIgaGFuZGxpbmcgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICBpZiAoIGQgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgLy8gZWxsaXBzZSggcmFkaXVzWCwgcmFkaXVzWSApLCBjZW50ZXIgPSAwLDBcclxuICAgICAgcmV0dXJuIG5ldyBTaGFwZSgpLmVsbGlwc2UoIDAsIDAsIGEgYXMgbnVtYmVyLCBiLCBjICk7XHJcbiAgICB9XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gVGhlIHNpZ25hdHVyZXMgYXJlIGNvbXBhdGlibGUsIGl0J3MganVzdCBtdWx0aXBsZSBkaWZmZXJlbnQgdHlwZXMgYXQgdGhlIHNhbWUgdGltZVxyXG4gICAgcmV0dXJuIG5ldyBTaGFwZSgpLmVsbGlwc2UoIGEsIGIsIGMsIGQsIGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1cHBvcnRzIGJvdGggYXJjKCBjZW50ZXJYLCBjZW50ZXJZLCByYWRpdXMsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlLCBhbnRpY2xvY2t3aXNlICkgYW5kIGFyYyggY2VudGVyLCByYWRpdXMsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlLCBhbnRpY2xvY2t3aXNlIClcclxuICAgKlxyXG4gICAqIEBwYXJhbSByYWRpdXMgLSBIb3cgZmFyIGZyb20gdGhlIGNlbnRlciB0aGUgYXJjIHdpbGwgYmVcclxuICAgKiBAcGFyYW0gc3RhcnRBbmdsZSAtIEFuZ2xlIChyYWRpYW5zKSBvZiB0aGUgc3RhcnQgb2YgdGhlIGFyY1xyXG4gICAqIEBwYXJhbSBlbmRBbmdsZSAtIEFuZ2xlIChyYWRpYW5zKSBvZiB0aGUgZW5kIG9mIHRoZSBhcmNcclxuICAgKiBAcGFyYW0gW2FudGljbG9ja3dpc2VdIC0gRGVjaWRlcyB3aGljaCBkaXJlY3Rpb24gdGhlIGFyYyB0YWtlcyBhcm91bmQgdGhlIGNlbnRlclxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgYXJjKCBjZW50ZXJYOiBudW1iZXIsIGNlbnRlclk6IG51bWJlciwgcmFkaXVzOiBudW1iZXIsIHN0YXJ0QW5nbGU6IG51bWJlciwgZW5kQW5nbGU6IG51bWJlciwgYW50aWNsb2Nrd2lzZT86IGJvb2xlYW4gKTogU2hhcGU7XHJcbiAgcHVibGljIHN0YXRpYyBhcmMoIGNlbnRlcjogVmVjdG9yMiwgcmFkaXVzOiBudW1iZXIsIHN0YXJ0QW5nbGU6IG51bWJlciwgZW5kQW5nbGU6IG51bWJlciwgYW50aWNsb2Nrd2lzZT86IGJvb2xlYW4gKTogU2hhcGU7XHJcbiAgcHVibGljIHN0YXRpYyBhcmMoIGE6IFZlY3RvcjIgfCBudW1iZXIsIGI6IG51bWJlciwgYzogbnVtYmVyLCBkOiBudW1iZXIsIGU/OiBudW1iZXIgfCBib29sZWFuLCBmPzogYm9vbGVhbiApOiBTaGFwZSB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gVGhlIHNpZ25hdHVyZXMgYXJlIGNvbXBhdGlibGUsIGl0J3MganVzdCBtdWx0aXBsZSBkaWZmZXJlbnQgdHlwZXMgYXQgdGhlIHNhbWUgdGltZVxyXG4gICAgcmV0dXJuIG5ldyBTaGFwZSgpLmFyYyggYSwgYiwgYywgZCwgZSwgZiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdW5pb24gb2YgYW4gYXJyYXkgb2Ygc2hhcGVzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgdW5pb24oIHNoYXBlczogU2hhcGVbXSApOiBTaGFwZSB7XHJcbiAgICByZXR1cm4gR3JhcGgudW5pb25Ob25aZXJvKCBzaGFwZXMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGludGVyc2VjdGlvbiBvZiBhbiBhcnJheSBvZiBzaGFwZXMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBpbnRlcnNlY3Rpb24oIHNoYXBlczogU2hhcGVbXSApOiBTaGFwZSB7XHJcbiAgICByZXR1cm4gR3JhcGguaW50ZXJzZWN0aW9uTm9uWmVybyggc2hhcGVzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB4b3Igb2YgYW4gYXJyYXkgb2Ygc2hhcGVzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgeG9yKCBzaGFwZXM6IFNoYXBlW10gKTogU2hhcGUge1xyXG4gICAgcmV0dXJuIEdyYXBoLnhvck5vblplcm8oIHNoYXBlcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5ldyBTaGFwZSBjb25zdHJ1Y3RlZCBieSBhcHBlbmRpbmcgYSBsaXN0IG9mIHNlZ21lbnRzIHRvZ2V0aGVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgc2VnbWVudHMoIHNlZ21lbnRzOiBTZWdtZW50W10sIGNsb3NlZD86IGJvb2xlYW4gKTogU2hhcGUge1xyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMTsgaSA8IHNlZ21lbnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGFzc2VydCggc2VnbWVudHNbIGkgLSAxIF0uZW5kLmVxdWFsc0Vwc2lsb24oIHNlZ21lbnRzWyBpIF0uc3RhcnQsIDFlLTYgKSwgJ01pc21hdGNoZWQgc3RhcnQvZW5kJyApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBTaGFwZSggWyBuZXcgU3VicGF0aCggc2VnbWVudHMsIHVuZGVmaW5lZCwgISFjbG9zZWQgKSBdICk7XHJcbiAgfVxyXG59XHJcblxyXG5raXRlLnJlZ2lzdGVyKCAnU2hhcGUnLCBTaGFwZSApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgU2hhcGU7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFdBQVcsTUFBTSw4QkFBOEI7QUFDdEQsT0FBT0MsT0FBTyxNQUFNLHlCQUF5QjtBQUM3QyxPQUFPQyxTQUFTLE1BQU0sMkJBQTJCO0FBRWpELE9BQU9DLElBQUksTUFBTSxzQkFBc0I7QUFDdkMsT0FBT0MsT0FBTyxNQUFNLHlCQUF5QjtBQUM3QyxPQUFPQyxTQUFTLElBQUlDLGNBQWMsUUFBUSxpQ0FBaUM7QUFDM0UsU0FBU0MsR0FBRyxFQUF3QkMsS0FBSyxFQUFFQyxhQUFhLEVBQUVDLEtBQUssRUFBRUMsSUFBSSxFQUFFQyxJQUFJLEVBQXNDQyxTQUFTLEVBQW1CQyxPQUFPLEVBQUVDLE9BQU8sRUFBRUMsU0FBUyxFQUFFQyxPQUFPLFFBQVEsY0FBYztBQUd2TTtBQUNBLE1BQU1DLFlBQVksR0FBR0MsSUFBSSxDQUFDQyxNQUFNOztBQUVoQztBQUNBO0FBQ0EsTUFBTUMsQ0FBQyxHQUFHQSxDQUFFQyxDQUFTLEVBQUVDLENBQVMsS0FBTSxJQUFJbkIsT0FBTyxDQUFFa0IsQ0FBQyxFQUFFQyxDQUFFLENBQUM7O0FBRXpEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNQyxvQkFBb0IsR0FBR0EsQ0FBRUMsWUFBcUIsRUFBRUMsYUFBc0IsRUFBRUMsV0FBb0IsRUFBRUMsT0FBZSxLQUFNO0VBQ3ZILE9BQU9ELFdBQVcsQ0FBQ0UsSUFBSSxDQUFDLENBQUMsQ0FDdEJDLFFBQVEsQ0FBRUwsWUFBYSxDQUFDLENBQ3hCTSxjQUFjLENBQUUsQ0FBRSxDQUFDLEdBQUdILE9BQU8sSUFBSyxDQUFFLENBQUMsQ0FDckNJLEdBQUcsQ0FBRU4sYUFBYyxDQUFDO0FBQ3pCLENBQUM7O0FBRUQ7QUFDQTs7QUE0Q0E7QUFDQTtBQUNBOztBQXVCQTs7QUFNQSxNQUFNTyxLQUFLLENBQThCO0VBRXZDO0VBQ2dCQyxRQUFRLEdBQWMsRUFBRTs7RUFFeEM7O0VBR0E7RUFDUUMsbUJBQW1CLEdBQUcsS0FBSzs7RUFFbkM7RUFDQTtFQUNRQyxVQUFVLEdBQUcsS0FBSztFQUVWQyxrQkFBa0IsR0FBZ0IsSUFBSXJDLFdBQVcsQ0FBQyxDQUFDO0VBSW5FO0VBQ0E7RUFDUXNDLHlCQUF5QixHQUFtQixJQUFJO0VBQ2hEQyxxQkFBcUIsR0FBbUIsSUFBSTs7RUFFcEQ7QUFDRjtBQUNBO0VBQ1NDLFdBQVdBLENBQUVOLFFBQTZCLEVBQUVPLE1BQWdCLEVBQUc7SUFFcEUsSUFBSSxDQUFDQyxPQUFPLEdBQUdELE1BQU0sR0FBR0EsTUFBTSxDQUFDWixJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUk7SUFFNUMsSUFBSSxDQUFDYyxrQkFBa0IsQ0FBQyxDQUFDO0lBRXpCLElBQUksQ0FBQ0MsbUJBQW1CLEdBQUcsSUFBSSxDQUFDQyxVQUFVLENBQUNDLElBQUksQ0FBRSxJQUFLLENBQUM7O0lBRXZEO0lBQ0EsSUFBSyxPQUFPWixRQUFRLEtBQUssUUFBUSxFQUFHO01BQ2xDO01BQ0EsS0FBTSxJQUFJYSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdiLFFBQVEsQ0FBQ2MsTUFBTSxFQUFFRCxDQUFDLEVBQUUsRUFBRztRQUMxQyxJQUFJLENBQUNFLFVBQVUsQ0FBRWYsUUFBUSxDQUFFYSxDQUFDLENBQUcsQ0FBQztNQUNsQztJQUNGO0lBRUEsSUFBS2IsUUFBUSxJQUFJLE9BQU9BLFFBQVEsS0FBSyxRQUFRLEVBQUc7TUFDOUM7TUFDQWdCLENBQUMsQ0FBQ0MsSUFBSSxDQUFFbEMsT0FBTyxDQUFDbUMsS0FBSyxDQUFFbEIsUUFBUyxDQUFDLEVBQUltQixJQUFtQixJQUFNO1FBQzVEQyxNQUFNLElBQUlBLE1BQU0sQ0FBRXJCLEtBQUssQ0FBQ3NCLFNBQVMsQ0FBRUYsSUFBSSxDQUFDRyxHQUFHLENBQUUsS0FBS0MsU0FBUyxFQUFHLFVBQVNKLElBQUksQ0FBQ0csR0FBSSxpQ0FBaUMsQ0FBQzs7UUFFbEg7UUFDQSxJQUFJLENBQUVILElBQUksQ0FBQ0csR0FBRyxDQUFFLENBQUNFLEtBQUssQ0FBRSxJQUFJLEVBQUVMLElBQUksQ0FBQ00sSUFBSyxDQUFDLENBQUMsQ0FBQztNQUM3QyxDQUFFLENBQUM7SUFDTDs7SUFFQTtJQUNBLElBQUksQ0FBQ2QsVUFBVSxDQUFDLENBQUM7RUFDbkI7O0VBR0E7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1VGLGtCQUFrQkEsQ0FBQSxFQUFTO0lBQ2pDLElBQUksQ0FBQ0wseUJBQXlCLEdBQUcsSUFBSTtJQUNyQyxJQUFJLENBQUNDLHFCQUFxQixHQUFHLElBQUk7RUFDbkM7O0VBRUE7QUFDRjtBQUNBO0VBQ1VxQix3QkFBd0JBLENBQUVDLEtBQWMsRUFBUztJQUN2RCxJQUFJLENBQUN2Qix5QkFBeUIsR0FBR3VCLEtBQUs7SUFDdEMsSUFBSSxDQUFDdEIscUJBQXFCLEdBQUcsSUFBSTtFQUNuQzs7RUFFQTtBQUNGO0FBQ0E7RUFDVXVCLG9CQUFvQkEsQ0FBRUQsS0FBYyxFQUFTO0lBQ25ELElBQUksQ0FBQ3ZCLHlCQUF5QixHQUFHLElBQUk7SUFDckMsSUFBSSxDQUFDQyxxQkFBcUIsR0FBR3NCLEtBQUs7RUFDcEM7O0VBRUE7QUFDRjtBQUNBO0VBQ1NFLE1BQU1BLENBQUV6QyxDQUFTLEVBQUVDLENBQVMsRUFBUztJQUMxQytCLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUUxQyxDQUFFLENBQUMsRUFBRyw4QkFBNkJBLENBQUUsRUFBRSxDQUFDO0lBQ3BFZ0MsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRXpDLENBQUUsQ0FBQyxFQUFHLDhCQUE2QkEsQ0FBRSxFQUFFLENBQUM7SUFDcEUsT0FBTyxJQUFJLENBQUMwQyxXQUFXLENBQUU1QyxDQUFDLENBQUVDLENBQUMsRUFBRUMsQ0FBRSxDQUFFLENBQUM7RUFDdEM7O0VBRUE7QUFDRjtBQUNBO0VBQ1MyQyxjQUFjQSxDQUFFNUMsQ0FBUyxFQUFFQyxDQUFTLEVBQVM7SUFDbEQrQixNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFMUMsQ0FBRSxDQUFDLEVBQUcsOEJBQTZCQSxDQUFFLEVBQUUsQ0FBQztJQUNwRWdDLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUV6QyxDQUFFLENBQUMsRUFBRyw4QkFBNkJBLENBQUUsRUFBRSxDQUFDO0lBQ3BFLE9BQU8sSUFBSSxDQUFDNEMsbUJBQW1CLENBQUU5QyxDQUFDLENBQUVDLENBQUMsRUFBRUMsQ0FBRSxDQUFFLENBQUM7RUFDOUM7O0VBRUE7QUFDRjtBQUNBO0VBQ1M0QyxtQkFBbUJBLENBQUVDLFlBQXFCLEVBQVM7SUFDeEQsT0FBTyxJQUFJLENBQUNILFdBQVcsQ0FBRSxJQUFJLENBQUNJLGdCQUFnQixDQUFDLENBQUMsQ0FBQ0MsSUFBSSxDQUFFRixZQUFhLENBQUUsQ0FBQztFQUN6RTs7RUFFQTtBQUNGO0FBQ0E7RUFDU0gsV0FBV0EsQ0FBRUosS0FBYyxFQUFTO0lBQ3pDLElBQUksQ0FBQ1osVUFBVSxDQUFFLElBQUlsQyxPQUFPLENBQUMsQ0FBQyxDQUFDd0QsUUFBUSxDQUFFVixLQUFNLENBQUUsQ0FBQztJQUNsRCxJQUFJLENBQUNsQixrQkFBa0IsQ0FBQyxDQUFDO0lBRXpCLE9BQU8sSUFBSSxDQUFDLENBQUM7RUFDZjs7RUFFQTtBQUNGO0FBQ0E7RUFDUzZCLE1BQU1BLENBQUVsRCxDQUFTLEVBQUVDLENBQVMsRUFBUztJQUMxQytCLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUUxQyxDQUFFLENBQUMsRUFBRyw4QkFBNkJBLENBQUUsRUFBRSxDQUFDO0lBQ3BFZ0MsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRXpDLENBQUUsQ0FBQyxFQUFHLDhCQUE2QkEsQ0FBRSxFQUFFLENBQUM7SUFDcEUsT0FBTyxJQUFJLENBQUNrRCxXQUFXLENBQUVwRCxDQUFDLENBQUVDLENBQUMsRUFBRUMsQ0FBRSxDQUFFLENBQUM7RUFDdEM7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NtRCxjQUFjQSxDQUFFcEQsQ0FBUyxFQUFFQyxDQUFTLEVBQVM7SUFDbEQrQixNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFMUMsQ0FBRSxDQUFDLEVBQUcsOEJBQTZCQSxDQUFFLEVBQUUsQ0FBQztJQUNwRWdDLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUV6QyxDQUFFLENBQUMsRUFBRyw4QkFBNkJBLENBQUUsRUFBRSxDQUFDO0lBQ3BFLE9BQU8sSUFBSSxDQUFDb0QsbUJBQW1CLENBQUV0RCxDQUFDLENBQUVDLENBQUMsRUFBRUMsQ0FBRSxDQUFFLENBQUM7RUFDOUM7O0VBRUE7QUFDRjtBQUNBO0VBQ1NvRCxtQkFBbUJBLENBQUVQLFlBQXFCLEVBQVM7SUFDeEQsT0FBTyxJQUFJLENBQUNLLFdBQVcsQ0FBRSxJQUFJLENBQUNKLGdCQUFnQixDQUFDLENBQUMsQ0FBQ0MsSUFBSSxDQUFFRixZQUFhLENBQUUsQ0FBQztFQUN6RTs7RUFFQTtBQUNGO0FBQ0E7RUFDU0ssV0FBV0EsQ0FBRVosS0FBYyxFQUFTO0lBQ3pDO0lBQ0EsSUFBSyxJQUFJLENBQUNlLFdBQVcsQ0FBQyxDQUFDLEVBQUc7TUFDeEIsTUFBTUMsS0FBSyxHQUFHLElBQUksQ0FBQ0MsY0FBYyxDQUFDLENBQUMsQ0FBQ0MsWUFBWSxDQUFDLENBQUM7TUFDbEQsTUFBTUMsR0FBRyxHQUFHbkIsS0FBSztNQUNqQixNQUFNb0IsSUFBSSxHQUFHLElBQUlyRSxJQUFJLENBQUVpRSxLQUFLLEVBQUVHLEdBQUksQ0FBQztNQUNuQyxJQUFJLENBQUNGLGNBQWMsQ0FBQyxDQUFDLENBQUNQLFFBQVEsQ0FBRVMsR0FBSSxDQUFDO01BQ3JDLElBQUksQ0FBQ0UsbUJBQW1CLENBQUVELElBQUssQ0FBQztJQUNsQyxDQUFDLE1BQ0k7TUFDSCxJQUFJLENBQUNFLE1BQU0sQ0FBRXRCLEtBQU0sQ0FBQztJQUN0QjtJQUNBLElBQUksQ0FBQ2xCLGtCQUFrQixDQUFDLENBQUM7SUFFekIsT0FBTyxJQUFJLENBQUMsQ0FBRTtFQUNoQjs7RUFFQTtBQUNGO0FBQ0E7RUFDU3lDLGdCQUFnQkEsQ0FBRTlELENBQVMsRUFBUztJQUN6QyxPQUFPLElBQUksQ0FBQ2tELE1BQU0sQ0FBRWxELENBQUMsRUFBRSxJQUFJLENBQUMrQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM5QyxDQUFFLENBQUM7RUFDcEQ7O0VBRUE7QUFDRjtBQUNBO0VBQ1M4RCx3QkFBd0JBLENBQUUvRCxDQUFTLEVBQVM7SUFDakQsT0FBTyxJQUFJLENBQUNvRCxjQUFjLENBQUVwRCxDQUFDLEVBQUUsQ0FBRSxDQUFDO0VBQ3BDOztFQUVBO0FBQ0Y7QUFDQTtFQUNTZ0UsY0FBY0EsQ0FBRS9ELENBQVMsRUFBUztJQUN2QyxPQUFPLElBQUksQ0FBQ2lELE1BQU0sQ0FBRSxJQUFJLENBQUNILGdCQUFnQixDQUFDLENBQUMsQ0FBQy9DLENBQUMsRUFBRUMsQ0FBRSxDQUFDO0VBQ3BEOztFQUVBO0FBQ0Y7QUFDQTtFQUNTZ0Usc0JBQXNCQSxDQUFFaEUsQ0FBUyxFQUFTO0lBQy9DLE9BQU8sSUFBSSxDQUFDbUQsY0FBYyxDQUFFLENBQUMsRUFBRW5ELENBQUUsQ0FBQztFQUNwQzs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDU2lFLFFBQVFBLENBQUVDLElBQVksRUFBRUMsSUFBWSxFQUFFQyxTQUFpQixFQUFFQyxhQUFxQixFQUFFQyxXQUFvQixFQUFTO0lBQ2xILE9BQU8sSUFBSSxDQUFDQyxhQUFhLENBQUUsSUFBSTFGLE9BQU8sQ0FBRXFGLElBQUksRUFBRUMsSUFBSyxDQUFDLEVBQUVDLFNBQVMsRUFBRUMsYUFBYSxFQUFFQyxXQUFZLENBQUM7RUFDL0Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NDLGFBQWFBLENBQUVDLFFBQWlCLEVBQUVKLFNBQWlCLEVBQUVDLGFBQXFCLEVBQUVDLFdBQW9CLEVBQVM7SUFFOUd2QyxNQUFNLElBQUlBLE1BQU0sQ0FBRTBDLE1BQU0sQ0FBQ0MsU0FBUyxDQUFFTCxhQUFjLENBQUMsRUFBRyxxQ0FBb0NBLGFBQWMsRUFBRSxDQUFDO0lBRTNHLElBQUksQ0FBQ1QsTUFBTSxDQUFFWSxRQUFTLENBQUM7SUFDdkIsTUFBTUcsVUFBVSxHQUFHLElBQUksQ0FBQ25CLFlBQVksQ0FBQyxDQUFDO0lBQ3RDLE1BQU1vQixLQUFLLEdBQUdKLFFBQVEsQ0FBQ0ssS0FBSyxDQUFFRixVQUFXLENBQUM7SUFDMUMsTUFBTUcsbUJBQW1CLEdBQUdGLEtBQUssQ0FBQ0csVUFBVSxDQUFDLENBQUM7SUFDOUMsTUFBTUMscUJBQXFCLEdBQUdGLG1CQUFtQixDQUFDRyxhQUFhLENBQUNDLEtBQUssQ0FBRWQsU0FBVSxDQUFDO0lBRWxGLElBQUllLFVBQVU7SUFDZCxJQUFLYixXQUFXLEVBQUc7TUFDakI7TUFDQWEsVUFBVSxHQUFHUCxLQUFLLENBQUNRLFNBQVMsSUFBS2YsYUFBYSxHQUFHLEdBQUcsQ0FBRTtJQUN4RCxDQUFDLE1BQ0k7TUFDSGMsVUFBVSxHQUFHUCxLQUFLLENBQUNRLFNBQVMsR0FBR2YsYUFBYTtJQUM5QztJQUVBLEtBQU0sSUFBSTdDLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBRzZDLGFBQWEsRUFBRTdDLENBQUMsRUFBRSxFQUFHO01BQ3hDLE1BQU02RCxVQUFVLEdBQUdQLG1CQUFtQixDQUFDSSxLQUFLLENBQUUxRCxDQUFDLEdBQUcyRCxVQUFXLENBQUMsQ0FBQ3BDLElBQUksQ0FBRTRCLFVBQVcsQ0FBQztNQUNqRixNQUFNVyxRQUFRLEdBQUdELFVBQVUsQ0FBQ3RDLElBQUksQ0FBRStCLG1CQUFtQixDQUFDSSxLQUFLLENBQUVDLFVBQVUsR0FBRyxDQUFFLENBQUUsQ0FBQyxDQUFDcEMsSUFBSSxDQUFFaUMscUJBQXNCLENBQUM7TUFDN0csTUFBTU8sV0FBVyxHQUFHRixVQUFVLENBQUN0QyxJQUFJLENBQUUrQixtQkFBbUIsQ0FBQ0ksS0FBSyxDQUFFLENBQUMsR0FBR0MsVUFBVSxHQUFHLENBQUUsQ0FBRSxDQUFDLENBQUNOLEtBQUssQ0FBRUcscUJBQXNCLENBQUM7TUFDckgsSUFBSSxDQUFDOUIsV0FBVyxDQUFFb0MsUUFBUyxDQUFDO01BQzVCLElBQUksQ0FBQ3BDLFdBQVcsQ0FBRXFDLFdBQVksQ0FBQztJQUNqQzs7SUFFQTtJQUNBLElBQUtqQixXQUFXLEVBQUc7TUFDakIsTUFBTWUsVUFBVSxHQUFHUCxtQkFBbUIsQ0FBQ0ksS0FBSyxDQUFFYixhQUFhLEdBQUdjLFVBQVcsQ0FBQyxDQUFDcEMsSUFBSSxDQUFFNEIsVUFBVyxDQUFDO01BQzdGLE1BQU1XLFFBQVEsR0FBR0QsVUFBVSxDQUFDdEMsSUFBSSxDQUFFK0IsbUJBQW1CLENBQUNJLEtBQUssQ0FBRUMsVUFBVSxHQUFHLENBQUUsQ0FBRSxDQUFDLENBQUNwQyxJQUFJLENBQUVpQyxxQkFBc0IsQ0FBQztNQUM3RyxJQUFJLENBQUM5QixXQUFXLENBQUVvQyxRQUFTLENBQUM7SUFDOUI7SUFFQSxPQUFPLElBQUksQ0FBQ3BDLFdBQVcsQ0FBRXNCLFFBQVMsQ0FBQztFQUNyQzs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTZ0IsZ0JBQWdCQSxDQUFFQyxHQUFXLEVBQUVDLEdBQVcsRUFBRTNGLENBQVMsRUFBRUMsQ0FBUyxFQUFTO0lBQzlFK0IsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRWdELEdBQUksQ0FBQyxFQUFHLGdDQUErQkEsR0FBSSxFQUFFLENBQUM7SUFDMUUxRCxNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFaUQsR0FBSSxDQUFDLEVBQUcsZ0NBQStCQSxHQUFJLEVBQUUsQ0FBQztJQUMxRTNELE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUUxQyxDQUFFLENBQUMsRUFBRyw4QkFBNkJBLENBQUUsRUFBRSxDQUFDO0lBQ3BFZ0MsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRXpDLENBQUUsQ0FBQyxFQUFHLDhCQUE2QkEsQ0FBRSxFQUFFLENBQUM7SUFDcEUsT0FBTyxJQUFJLENBQUMyRixxQkFBcUIsQ0FBRTdGLENBQUMsQ0FBRTJGLEdBQUcsRUFBRUMsR0FBSSxDQUFDLEVBQUU1RixDQUFDLENBQUVDLENBQUMsRUFBRUMsQ0FBRSxDQUFFLENBQUM7RUFDL0Q7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1M0Rix3QkFBd0JBLENBQUVILEdBQVcsRUFBRUMsR0FBVyxFQUFFM0YsQ0FBUyxFQUFFQyxDQUFTLEVBQVM7SUFDdEYrQixNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFZ0QsR0FBSSxDQUFDLEVBQUcsZ0NBQStCQSxHQUFJLEVBQUUsQ0FBQztJQUMxRTFELE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUVpRCxHQUFJLENBQUMsRUFBRyxnQ0FBK0JBLEdBQUksRUFBRSxDQUFDO0lBQzFFM0QsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRTFDLENBQUUsQ0FBQyxFQUFHLDhCQUE2QkEsQ0FBRSxFQUFFLENBQUM7SUFDcEVnQyxNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFekMsQ0FBRSxDQUFDLEVBQUcsOEJBQTZCQSxDQUFFLEVBQUUsQ0FBQztJQUNwRSxPQUFPLElBQUksQ0FBQzZGLDZCQUE2QixDQUFFL0YsQ0FBQyxDQUFFMkYsR0FBRyxFQUFFQyxHQUFJLENBQUMsRUFBRTVGLENBQUMsQ0FBRUMsQ0FBQyxFQUFFQyxDQUFFLENBQUUsQ0FBQztFQUN2RTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTNkYsNkJBQTZCQSxDQUFFQyxZQUFxQixFQUFFeEQsS0FBYyxFQUFTO0lBQ2xGLE1BQU15RCxhQUFhLEdBQUcsSUFBSSxDQUFDakQsZ0JBQWdCLENBQUMsQ0FBQztJQUM3QyxPQUFPLElBQUksQ0FBQzZDLHFCQUFxQixDQUFFSSxhQUFhLENBQUNoRCxJQUFJLENBQUUrQyxZQUFhLENBQUMsRUFBRUMsYUFBYSxDQUFDaEQsSUFBSSxDQUFFVCxLQUFNLENBQUUsQ0FBQztFQUN0Rzs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDUzBELHNCQUFzQkEsQ0FBRWpHLENBQVMsRUFBRUMsQ0FBUyxFQUFTO0lBQzFEK0IsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRTFDLENBQUUsQ0FBQyxFQUFHLDhCQUE2QkEsQ0FBRSxFQUFFLENBQUM7SUFDcEVnQyxNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFekMsQ0FBRSxDQUFDLEVBQUcsOEJBQTZCQSxDQUFFLEVBQUUsQ0FBQztJQUNwRSxPQUFPLElBQUksQ0FBQzJGLHFCQUFxQixDQUFFLElBQUksQ0FBQ00sOEJBQThCLENBQUMsQ0FBQyxFQUFFbkcsQ0FBQyxDQUFFQyxDQUFDLEVBQUVDLENBQUUsQ0FBRSxDQUFDO0VBQ3ZGOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NrRyw4QkFBOEJBLENBQUVuRyxDQUFTLEVBQUVDLENBQVMsRUFBUztJQUNsRStCLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUUxQyxDQUFFLENBQUMsRUFBRyw4QkFBNkJBLENBQUUsRUFBRSxDQUFDO0lBQ3BFZ0MsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRXpDLENBQUUsQ0FBQyxFQUFHLDhCQUE2QkEsQ0FBRSxFQUFFLENBQUM7SUFDcEUsT0FBTyxJQUFJLENBQUMyRixxQkFBcUIsQ0FBRSxJQUFJLENBQUNNLDhCQUE4QixDQUFDLENBQUMsRUFBRW5HLENBQUMsQ0FBRUMsQ0FBQyxFQUFFQyxDQUFFLENBQUMsQ0FBQytDLElBQUksQ0FBRSxJQUFJLENBQUNELGdCQUFnQixDQUFDLENBQUUsQ0FBRSxDQUFDO0VBQ3ZIOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTNkMscUJBQXFCQSxDQUFFRyxZQUFxQixFQUFFeEQsS0FBYyxFQUFTO0lBQzFFO0lBQ0EsSUFBSSxDQUFDc0IsTUFBTSxDQUFFa0MsWUFBYSxDQUFDO0lBQzNCLE1BQU14QyxLQUFLLEdBQUcsSUFBSSxDQUFDQyxjQUFjLENBQUMsQ0FBQyxDQUFDQyxZQUFZLENBQUMsQ0FBQztJQUNsRCxNQUFNMkMsU0FBUyxHQUFHLElBQUk3RyxTQUFTLENBQUVnRSxLQUFLLEVBQUV3QyxZQUFZLEVBQUV4RCxLQUFNLENBQUM7SUFDN0QsSUFBSSxDQUFDaUIsY0FBYyxDQUFDLENBQUMsQ0FBQ1AsUUFBUSxDQUFFVixLQUFNLENBQUM7SUFDdkMsTUFBTThELHFCQUFxQixHQUFHRCxTQUFTLENBQUNFLHdCQUF3QixDQUFDLENBQUM7SUFDbEUxRSxDQUFDLENBQUNDLElBQUksQ0FBRXdFLHFCQUFxQixFQUFFRSxPQUFPLElBQUk7TUFDeEM7TUFDQSxJQUFJLENBQUMzQyxtQkFBbUIsQ0FBRTJDLE9BQVEsQ0FBQztJQUNyQyxDQUFFLENBQUM7SUFDSCxJQUFJLENBQUNqRSx3QkFBd0IsQ0FBRXlELFlBQWEsQ0FBQztJQUU3QyxPQUFPLElBQUksQ0FBQyxDQUFFO0VBQ2hCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NTLFlBQVlBLENBQUVDLElBQVksRUFBRUMsSUFBWSxFQUFFQyxJQUFZLEVBQUVDLElBQVksRUFBRTVHLENBQVMsRUFBRUMsQ0FBUyxFQUFTO0lBQ3hHK0IsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRStELElBQUssQ0FBQyxFQUFHLGlDQUFnQ0EsSUFBSyxFQUFFLENBQUM7SUFDN0V6RSxNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFZ0UsSUFBSyxDQUFDLEVBQUcsaUNBQWdDQSxJQUFLLEVBQUUsQ0FBQztJQUM3RTFFLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUVpRSxJQUFLLENBQUMsRUFBRyxpQ0FBZ0NBLElBQUssRUFBRSxDQUFDO0lBQzdFM0UsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRWtFLElBQUssQ0FBQyxFQUFHLGlDQUFnQ0EsSUFBSyxFQUFFLENBQUM7SUFDN0U1RSxNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFMUMsQ0FBRSxDQUFDLEVBQUcsOEJBQTZCQSxDQUFFLEVBQUUsQ0FBQztJQUNwRWdDLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUV6QyxDQUFFLENBQUMsRUFBRyw4QkFBNkJBLENBQUUsRUFBRSxDQUFDO0lBQ3BFLE9BQU8sSUFBSSxDQUFDNEcsaUJBQWlCLENBQUU5RyxDQUFDLENBQUUwRyxJQUFJLEVBQUVDLElBQUssQ0FBQyxFQUFFM0csQ0FBQyxDQUFFNEcsSUFBSSxFQUFFQyxJQUFLLENBQUMsRUFBRTdHLENBQUMsQ0FBRUMsQ0FBQyxFQUFFQyxDQUFFLENBQUUsQ0FBQztFQUM5RTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1M2RyxvQkFBb0JBLENBQUVMLElBQVksRUFBRUMsSUFBWSxFQUFFQyxJQUFZLEVBQUVDLElBQVksRUFBRTVHLENBQVMsRUFBRUMsQ0FBUyxFQUFTO0lBQ2hIK0IsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRStELElBQUssQ0FBQyxFQUFHLGlDQUFnQ0EsSUFBSyxFQUFFLENBQUM7SUFDN0V6RSxNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFZ0UsSUFBSyxDQUFDLEVBQUcsaUNBQWdDQSxJQUFLLEVBQUUsQ0FBQztJQUM3RTFFLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUVpRSxJQUFLLENBQUMsRUFBRyxpQ0FBZ0NBLElBQUssRUFBRSxDQUFDO0lBQzdFM0UsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRWtFLElBQUssQ0FBQyxFQUFHLGlDQUFnQ0EsSUFBSyxFQUFFLENBQUM7SUFDN0U1RSxNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFMUMsQ0FBRSxDQUFDLEVBQUcsOEJBQTZCQSxDQUFFLEVBQUUsQ0FBQztJQUNwRWdDLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUV6QyxDQUFFLENBQUMsRUFBRyw4QkFBNkJBLENBQUUsRUFBRSxDQUFDO0lBQ3BFLE9BQU8sSUFBSSxDQUFDOEcseUJBQXlCLENBQUVoSCxDQUFDLENBQUUwRyxJQUFJLEVBQUVDLElBQUssQ0FBQyxFQUFFM0csQ0FBQyxDQUFFNEcsSUFBSSxFQUFFQyxJQUFLLENBQUMsRUFBRTdHLENBQUMsQ0FBRUMsQ0FBQyxFQUFFQyxDQUFFLENBQUUsQ0FBQztFQUN0Rjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ1M4Ryx5QkFBeUJBLENBQUVDLFFBQWlCLEVBQUVDLFFBQWlCLEVBQUUxRSxLQUFjLEVBQVM7SUFDN0YsTUFBTXlELGFBQWEsR0FBRyxJQUFJLENBQUNqRCxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzdDLE9BQU8sSUFBSSxDQUFDOEQsaUJBQWlCLENBQUViLGFBQWEsQ0FBQ2hELElBQUksQ0FBRWdFLFFBQVMsQ0FBQyxFQUFFaEIsYUFBYSxDQUFDaEQsSUFBSSxDQUFFaUUsUUFBUyxDQUFDLEVBQUVqQixhQUFhLENBQUNoRCxJQUFJLENBQUVULEtBQU0sQ0FBRSxDQUFDO0VBQzlIOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTMkUsa0JBQWtCQSxDQUFFUCxJQUFZLEVBQUVDLElBQVksRUFBRTVHLENBQVMsRUFBRUMsQ0FBUyxFQUFTO0lBQ2xGK0IsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRWlFLElBQUssQ0FBQyxFQUFHLGlDQUFnQ0EsSUFBSyxFQUFFLENBQUM7SUFDN0UzRSxNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFa0UsSUFBSyxDQUFDLEVBQUcsaUNBQWdDQSxJQUFLLEVBQUUsQ0FBQztJQUM3RTVFLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUUxQyxDQUFFLENBQUMsRUFBRyw4QkFBNkJBLENBQUUsRUFBRSxDQUFDO0lBQ3BFZ0MsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRXpDLENBQUUsQ0FBQyxFQUFHLDhCQUE2QkEsQ0FBRSxFQUFFLENBQUM7SUFDcEUsT0FBTyxJQUFJLENBQUM0RyxpQkFBaUIsQ0FBRSxJQUFJLENBQUNNLDBCQUEwQixDQUFDLENBQUMsRUFBRXBILENBQUMsQ0FBRTRHLElBQUksRUFBRUMsSUFBSyxDQUFDLEVBQUU3RyxDQUFDLENBQUVDLENBQUMsRUFBRUMsQ0FBRSxDQUFFLENBQUM7RUFDaEc7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NtSCwwQkFBMEJBLENBQUVULElBQVksRUFBRUMsSUFBWSxFQUFFNUcsQ0FBUyxFQUFFQyxDQUFTLEVBQVM7SUFDMUYrQixNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFaUUsSUFBSyxDQUFDLEVBQUcsaUNBQWdDQSxJQUFLLEVBQUUsQ0FBQztJQUM3RTNFLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUVrRSxJQUFLLENBQUMsRUFBRyxpQ0FBZ0NBLElBQUssRUFBRSxDQUFDO0lBQzdFNUUsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRTFDLENBQUUsQ0FBQyxFQUFHLDhCQUE2QkEsQ0FBRSxFQUFFLENBQUM7SUFDcEVnQyxNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFekMsQ0FBRSxDQUFDLEVBQUcsOEJBQTZCQSxDQUFFLEVBQUUsQ0FBQztJQUNwRSxPQUFPLElBQUksQ0FBQzRHLGlCQUFpQixDQUFFLElBQUksQ0FBQ00sMEJBQTBCLENBQUMsQ0FBQyxFQUFFcEgsQ0FBQyxDQUFFNEcsSUFBSSxFQUFFQyxJQUFLLENBQUMsQ0FBQzVELElBQUksQ0FBRSxJQUFJLENBQUNELGdCQUFnQixDQUFDLENBQUUsQ0FBQyxFQUFFaEQsQ0FBQyxDQUFFQyxDQUFDLEVBQUVDLENBQUUsQ0FBQyxDQUFDK0MsSUFBSSxDQUFFLElBQUksQ0FBQ0QsZ0JBQWdCLENBQUMsQ0FBRSxDQUFFLENBQUM7RUFDaEs7RUFFTzhELGlCQUFpQkEsQ0FBRUcsUUFBaUIsRUFBRUMsUUFBaUIsRUFBRTFFLEtBQWMsRUFBUztJQUNyRjtJQUNBLElBQUksQ0FBQ3NCLE1BQU0sQ0FBRW1ELFFBQVMsQ0FBQztJQUN2QixNQUFNekQsS0FBSyxHQUFHLElBQUksQ0FBQ0MsY0FBYyxDQUFDLENBQUMsQ0FBQ0MsWUFBWSxDQUFDLENBQUM7SUFDbEQsTUFBTTRELEtBQUssR0FBRyxJQUFJbkksS0FBSyxDQUFFcUUsS0FBSyxFQUFFeUQsUUFBUSxFQUFFQyxRQUFRLEVBQUUxRSxLQUFNLENBQUM7SUFFM0QsTUFBTThELHFCQUFxQixHQUFHZ0IsS0FBSyxDQUFDZix3QkFBd0IsQ0FBQyxDQUFDO0lBQzlEMUUsQ0FBQyxDQUFDQyxJQUFJLENBQUV3RSxxQkFBcUIsRUFBRUUsT0FBTyxJQUFJO01BQ3hDLElBQUksQ0FBQzNDLG1CQUFtQixDQUFFMkMsT0FBUSxDQUFDO0lBQ3JDLENBQUUsQ0FBQztJQUNILElBQUksQ0FBQy9DLGNBQWMsQ0FBQyxDQUFDLENBQUNQLFFBQVEsQ0FBRVYsS0FBTSxDQUFDO0lBRXZDLElBQUksQ0FBQ0Msb0JBQW9CLENBQUV5RSxRQUFTLENBQUM7SUFFckMsT0FBTyxJQUFJLENBQUMsQ0FBRTtFQUNoQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NLLEdBQUdBLENBQUVDLE9BQWUsRUFBRUMsT0FBZSxFQUFFQyxNQUFjLEVBQUVDLFVBQWtCLEVBQUVDLFFBQWdCLEVBQUVDLGFBQXVCLEVBQVM7SUFDbEk1RixNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFNkUsT0FBUSxDQUFDLEVBQUcsb0NBQW1DQSxPQUFRLEVBQUUsQ0FBQztJQUN0RnZGLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUU4RSxPQUFRLENBQUMsRUFBRyxvQ0FBbUNBLE9BQVEsRUFBRSxDQUFDO0lBQ3RGLE9BQU8sSUFBSSxDQUFDSyxRQUFRLENBQUU5SCxDQUFDLENBQUV3SCxPQUFPLEVBQUVDLE9BQVEsQ0FBQyxFQUFFQyxNQUFNLEVBQUVDLFVBQVUsRUFBRUMsUUFBUSxFQUFFQyxhQUFjLENBQUM7RUFDNUY7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDU0MsUUFBUUEsQ0FBRUMsTUFBZSxFQUFFTCxNQUFjLEVBQUVDLFVBQWtCLEVBQUVDLFFBQWdCLEVBQUVDLGFBQXVCLEVBQVM7SUFDdEg7SUFDQSxJQUFLQSxhQUFhLEtBQUt6RixTQUFTLEVBQUc7TUFDakN5RixhQUFhLEdBQUcsS0FBSztJQUN2QjtJQUVBLE1BQU1OLEdBQUcsR0FBRyxJQUFJckksR0FBRyxDQUFFNkksTUFBTSxFQUFFTCxNQUFNLEVBQUVDLFVBQVUsRUFBRUMsUUFBUSxFQUFFQyxhQUFjLENBQUM7O0lBRTFFO0lBQ0EsTUFBTWhELFVBQVUsR0FBRzBDLEdBQUcsQ0FBQ1MsUUFBUSxDQUFDLENBQUM7SUFDakMsTUFBTXRELFFBQVEsR0FBRzZDLEdBQUcsQ0FBQ1UsTUFBTSxDQUFDLENBQUM7O0lBRTdCO0lBQ0EsSUFBSyxJQUFJLENBQUMxRSxXQUFXLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQ0UsY0FBYyxDQUFDLENBQUMsQ0FBQ3lFLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUNyRCxVQUFVLENBQUNzRCxNQUFNLENBQUUsSUFBSSxDQUFDMUUsY0FBYyxDQUFDLENBQUMsQ0FBQ0MsWUFBWSxDQUFDLENBQUUsQ0FBQyxFQUFHO01BQy9ILElBQUksQ0FBQ0csbUJBQW1CLENBQUUsSUFBSXRFLElBQUksQ0FBRSxJQUFJLENBQUNrRSxjQUFjLENBQUMsQ0FBQyxDQUFDQyxZQUFZLENBQUMsQ0FBQyxFQUFFbUIsVUFBVyxDQUFFLENBQUM7SUFDMUY7SUFFQSxJQUFLLENBQUMsSUFBSSxDQUFDdEIsV0FBVyxDQUFDLENBQUMsRUFBRztNQUN6QixJQUFJLENBQUMzQixVQUFVLENBQUUsSUFBSWxDLE9BQU8sQ0FBQyxDQUFFLENBQUM7SUFDbEM7O0lBRUE7SUFDQSxJQUFJLENBQUMrRCxjQUFjLENBQUMsQ0FBQyxDQUFDUCxRQUFRLENBQUUyQixVQUFXLENBQUM7SUFDNUMsSUFBSSxDQUFDcEIsY0FBYyxDQUFDLENBQUMsQ0FBQ1AsUUFBUSxDQUFFd0IsUUFBUyxDQUFDO0lBRTFDLElBQUksQ0FBQ2IsbUJBQW1CLENBQUUwRCxHQUFJLENBQUM7SUFDL0IsSUFBSSxDQUFDakcsa0JBQWtCLENBQUMsQ0FBQztJQUV6QixPQUFPLElBQUksQ0FBQyxDQUFFO0VBQ2hCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTOEcsYUFBYUEsQ0FBRVosT0FBZSxFQUFFQyxPQUFlLEVBQUVZLE9BQWUsRUFBRUMsT0FBZSxFQUFFQyxRQUFnQixFQUFFWixVQUFrQixFQUFFQyxRQUFnQixFQUFFQyxhQUF1QixFQUFTO0lBQ2hMNUYsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRTZFLE9BQVEsQ0FBQyxFQUFHLG9DQUFtQ0EsT0FBUSxFQUFFLENBQUM7SUFDdEZ2RixNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFOEUsT0FBUSxDQUFDLEVBQUcsb0NBQW1DQSxPQUFRLEVBQUUsQ0FBQztJQUN0RixPQUFPLElBQUksQ0FBQ2Usa0JBQWtCLENBQUV4SSxDQUFDLENBQUV3SCxPQUFPLEVBQUVDLE9BQVEsQ0FBQyxFQUFFWSxPQUFPLEVBQUVDLE9BQU8sRUFBRUMsUUFBUSxFQUFFWixVQUFVLEVBQUVDLFFBQVEsRUFBRUMsYUFBYyxDQUFDO0VBQzFIOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDU1csa0JBQWtCQSxDQUFFVCxNQUFlLEVBQUVNLE9BQWUsRUFBRUMsT0FBZSxFQUFFQyxRQUFnQixFQUFFWixVQUFrQixFQUFFQyxRQUFnQixFQUFFQyxhQUF1QixFQUFTO0lBQ3BLO0lBQ0EsSUFBS0EsYUFBYSxLQUFLekYsU0FBUyxFQUFHO01BQ2pDeUYsYUFBYSxHQUFHLEtBQUs7SUFDdkI7SUFFQSxNQUFNTyxhQUFhLEdBQUcsSUFBSWhKLGFBQWEsQ0FBRTJJLE1BQU0sRUFBRU0sT0FBTyxFQUFFQyxPQUFPLEVBQUVDLFFBQVEsRUFBRVosVUFBVSxFQUFFQyxRQUFRLEVBQUVDLGFBQWMsQ0FBQzs7SUFFbEg7SUFDQSxNQUFNaEQsVUFBVSxHQUFHdUQsYUFBYSxDQUFDNUUsS0FBSztJQUN0QyxNQUFNa0IsUUFBUSxHQUFHMEQsYUFBYSxDQUFDekUsR0FBRzs7SUFFbEM7SUFDQSxJQUFLLElBQUksQ0FBQ0osV0FBVyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUNFLGNBQWMsQ0FBQyxDQUFDLENBQUN5RSxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDckQsVUFBVSxDQUFDc0QsTUFBTSxDQUFFLElBQUksQ0FBQzFFLGNBQWMsQ0FBQyxDQUFDLENBQUNDLFlBQVksQ0FBQyxDQUFFLENBQUMsRUFBRztNQUMvSCxJQUFJLENBQUNHLG1CQUFtQixDQUFFLElBQUl0RSxJQUFJLENBQUUsSUFBSSxDQUFDa0UsY0FBYyxDQUFDLENBQUMsQ0FBQ0MsWUFBWSxDQUFDLENBQUMsRUFBRW1CLFVBQVcsQ0FBRSxDQUFDO0lBQzFGO0lBRUEsSUFBSyxDQUFDLElBQUksQ0FBQ3RCLFdBQVcsQ0FBQyxDQUFDLEVBQUc7TUFDekIsSUFBSSxDQUFDM0IsVUFBVSxDQUFFLElBQUlsQyxPQUFPLENBQUMsQ0FBRSxDQUFDO0lBQ2xDOztJQUVBO0lBQ0EsSUFBSSxDQUFDK0QsY0FBYyxDQUFDLENBQUMsQ0FBQ1AsUUFBUSxDQUFFMkIsVUFBVyxDQUFDO0lBQzVDLElBQUksQ0FBQ3BCLGNBQWMsQ0FBQyxDQUFDLENBQUNQLFFBQVEsQ0FBRXdCLFFBQVMsQ0FBQztJQUUxQyxJQUFJLENBQUNiLG1CQUFtQixDQUFFdUUsYUFBYyxDQUFDO0lBQ3pDLElBQUksQ0FBQzlHLGtCQUFrQixDQUFDLENBQUM7SUFFekIsT0FBTyxJQUFJLENBQUMsQ0FBRTtFQUNoQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtFQUNTbUgsS0FBS0EsQ0FBQSxFQUFTO0lBQ25CLElBQUssSUFBSSxDQUFDbEYsV0FBVyxDQUFDLENBQUMsRUFBRztNQUN4QixNQUFNbUYsWUFBWSxHQUFHLElBQUksQ0FBQ2pGLGNBQWMsQ0FBQyxDQUFDO01BQzFDLE1BQU1rRixRQUFRLEdBQUcsSUFBSWpKLE9BQU8sQ0FBQyxDQUFDO01BRTlCZ0osWUFBWSxDQUFDRCxLQUFLLENBQUMsQ0FBQztNQUNwQixJQUFJLENBQUM3RyxVQUFVLENBQUUrRyxRQUFTLENBQUM7TUFDM0JBLFFBQVEsQ0FBQ3pGLFFBQVEsQ0FBRXdGLFlBQVksQ0FBQ0UsYUFBYSxDQUFDLENBQUUsQ0FBQztJQUNuRDtJQUNBLElBQUksQ0FBQ3RILGtCQUFrQixDQUFDLENBQUM7SUFDekIsT0FBTyxJQUFJLENBQUMsQ0FBRTtFQUNoQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDU3VILFVBQVVBLENBQUEsRUFBUztJQUN4QixJQUFJLENBQUNqSCxVQUFVLENBQUUsSUFBSWxDLE9BQU8sQ0FBQyxDQUFFLENBQUM7SUFDaEMsSUFBSSxDQUFDNEIsa0JBQWtCLENBQUMsQ0FBQztJQUV6QixPQUFPLElBQUksQ0FBQyxDQUFDO0VBQ2Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7RUFDU3dILGFBQWFBLENBQUEsRUFBUztJQUMzQixJQUFJLENBQUMvSCxVQUFVLEdBQUcsSUFBSTtJQUV0QixJQUFJLENBQUNnSSwyQkFBMkIsQ0FBQyxDQUFDO0lBRWxDLE9BQU8sSUFBSSxDQUFDLENBQUM7RUFDZjs7RUFFQTtBQUNGO0FBQ0E7RUFDU0MsV0FBV0EsQ0FBQSxFQUFZO0lBQzVCLE9BQU8sSUFBSSxDQUFDakksVUFBVTtFQUN4Qjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTa0ksdUJBQXVCQSxDQUFFWixPQUFlLEVBQUVDLE9BQWUsRUFBRUMsUUFBZ0IsRUFBRVcsUUFBaUIsRUFBRUMsS0FBYyxFQUFFbEosQ0FBUyxFQUFFQyxDQUFTLEVBQVM7SUFDbEosTUFBTStGLGFBQWEsR0FBRyxJQUFJLENBQUNqRCxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzdDLE9BQU8sSUFBSSxDQUFDb0csZUFBZSxDQUFFZixPQUFPLEVBQUVDLE9BQU8sRUFBRUMsUUFBUSxFQUFFVyxRQUFRLEVBQUVDLEtBQUssRUFBRWxKLENBQUMsR0FBR2dHLGFBQWEsQ0FBQ2hHLENBQUMsRUFBRUMsQ0FBQyxHQUFHK0YsYUFBYSxDQUFDL0YsQ0FBRSxDQUFDO0VBQ3RIOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NrSixlQUFlQSxDQUFFZixPQUFlLEVBQUVDLE9BQWUsRUFBRUMsUUFBZ0IsRUFBRVcsUUFBaUIsRUFBRUMsS0FBYyxFQUFFbEosQ0FBUyxFQUFFQyxDQUFTLEVBQVM7SUFDMUk7SUFDQTs7SUFFQSxNQUFNd0UsUUFBUSxHQUFHLElBQUkzRixPQUFPLENBQUVrQixDQUFDLEVBQUVDLENBQUUsQ0FBQztJQUNwQyxJQUFJLENBQUM0RCxNQUFNLENBQUVZLFFBQVMsQ0FBQztJQUV2QixNQUFNRyxVQUFVLEdBQUcsSUFBSSxDQUFDcEIsY0FBYyxDQUFDLENBQUMsQ0FBQ0MsWUFBWSxDQUFDLENBQUM7SUFDdkQsSUFBSSxDQUFDRCxjQUFjLENBQUMsQ0FBQyxDQUFDUCxRQUFRLENBQUV3QixRQUFTLENBQUM7O0lBRTFDO0lBQ0EsSUFBSzJELE9BQU8sR0FBRyxDQUFDLEVBQUc7TUFBRUEsT0FBTyxJQUFJLENBQUMsR0FBRztJQUFFO0lBQ3RDLElBQUtDLE9BQU8sR0FBRyxDQUFDLEVBQUc7TUFBRUEsT0FBTyxJQUFJLENBQUMsR0FBRztJQUFFO0lBRXRDLElBQUllLEdBQUcsR0FBR2hCLE9BQU8sR0FBR0EsT0FBTztJQUMzQixJQUFJaUIsR0FBRyxHQUFHaEIsT0FBTyxHQUFHQSxPQUFPO0lBQzNCLE1BQU1pQixLQUFLLEdBQUcxRSxVQUFVLENBQUNFLEtBQUssQ0FBRUwsUUFBUyxDQUFDLENBQUM4RSxhQUFhLENBQUUsQ0FBRSxDQUFDLENBQUNDLE9BQU8sQ0FBRSxDQUFDbEIsUUFBUyxDQUFDO0lBQ2xGLE1BQU1tQixHQUFHLEdBQUdILEtBQUssQ0FBQ3RKLENBQUMsR0FBR3NKLEtBQUssQ0FBQ3RKLENBQUM7SUFDN0IsTUFBTTBKLEdBQUcsR0FBR0osS0FBSyxDQUFDckosQ0FBQyxHQUFHcUosS0FBSyxDQUFDckosQ0FBQztJQUM3QixJQUFJMEosV0FBVyxHQUFHLElBQUk3SyxPQUFPLENBQUVzSixPQUFPLEdBQUdrQixLQUFLLENBQUNySixDQUFDLEdBQUdvSSxPQUFPLEVBQUUsQ0FBQ0EsT0FBTyxHQUFHaUIsS0FBSyxDQUFDdEosQ0FBQyxHQUFHb0ksT0FBUSxDQUFDOztJQUUxRjtJQUNBLE1BQU13QixJQUFJLEdBQUdILEdBQUcsR0FBR0wsR0FBRyxHQUFHTSxHQUFHLEdBQUdMLEdBQUc7SUFDbEMsSUFBS08sSUFBSSxHQUFHLENBQUMsRUFBRztNQUNkeEIsT0FBTyxJQUFJdkksSUFBSSxDQUFDZ0ssSUFBSSxDQUFFRCxJQUFLLENBQUM7TUFDNUJ2QixPQUFPLElBQUl4SSxJQUFJLENBQUNnSyxJQUFJLENBQUVELElBQUssQ0FBQzs7TUFFNUI7TUFDQVIsR0FBRyxHQUFHaEIsT0FBTyxHQUFHQSxPQUFPO01BQ3ZCaUIsR0FBRyxHQUFHaEIsT0FBTyxHQUFHQSxPQUFPO01BQ3ZCc0IsV0FBVyxHQUFHLElBQUk3SyxPQUFPLENBQUVzSixPQUFPLEdBQUdrQixLQUFLLENBQUNySixDQUFDLEdBQUdvSSxPQUFPLEVBQUUsQ0FBQ0EsT0FBTyxHQUFHaUIsS0FBSyxDQUFDdEosQ0FBQyxHQUFHb0ksT0FBUSxDQUFDO0lBQ3hGOztJQUVBO0lBQ0E7O0lBRUF1QixXQUFXLENBQUNsSixjQUFjLENBQUVaLElBQUksQ0FBQ2dLLElBQUksQ0FBRWhLLElBQUksQ0FBQ2lLLEdBQUcsQ0FBRSxDQUFDLEVBQUUsQ0FBRVYsR0FBRyxHQUFHQyxHQUFHLEdBQUdELEdBQUcsR0FBR00sR0FBRyxHQUFHTCxHQUFHLEdBQUdJLEdBQUcsS0FBT0wsR0FBRyxHQUFHTSxHQUFHLEdBQUdMLEdBQUcsR0FBR0ksR0FBRyxDQUFHLENBQUUsQ0FBRSxDQUFDO0lBQzNILElBQUtSLFFBQVEsS0FBS0MsS0FBSyxFQUFHO01BQ3hCO01BQ0FTLFdBQVcsQ0FBQ2xKLGNBQWMsQ0FBRSxDQUFDLENBQUUsQ0FBQztJQUNsQztJQUNBLE1BQU1xSCxNQUFNLEdBQUdsRCxVQUFVLENBQUNtRixLQUFLLENBQUV0RixRQUFRLEVBQUUsR0FBSSxDQUFDLENBQUN6QixJQUFJLENBQUUyRyxXQUFXLENBQUNILE9BQU8sQ0FBRWxCLFFBQVMsQ0FBRSxDQUFDO0lBRXhGLE1BQU0wQixXQUFXLEdBQUdBLENBQUVDLENBQVUsRUFBRWxLLENBQVUsS0FBTTtNQUNoRDtNQUNBLE9BQU8sQ0FBSWtLLENBQUMsQ0FBQ2pLLENBQUMsR0FBR0QsQ0FBQyxDQUFDRSxDQUFDLEdBQUdnSyxDQUFDLENBQUNoSyxDQUFDLEdBQUdGLENBQUMsQ0FBQ0MsQ0FBQyxHQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUtpSyxDQUFDLENBQUNDLFlBQVksQ0FBRW5LLENBQUUsQ0FBQztJQUN6RSxDQUFDO0lBRUQsTUFBTW9LLE1BQU0sR0FBRyxJQUFJckwsT0FBTyxDQUFFLENBQUV3SyxLQUFLLENBQUN0SixDQUFDLEdBQUcySixXQUFXLENBQUMzSixDQUFDLElBQUtvSSxPQUFPLEVBQUUsQ0FBRWtCLEtBQUssQ0FBQ3JKLENBQUMsR0FBRzBKLFdBQVcsQ0FBQzFKLENBQUMsSUFBS29JLE9BQVEsQ0FBQztJQUMxRyxNQUFNK0IsSUFBSSxHQUFHLElBQUl0TCxPQUFPLENBQUUsQ0FBRSxDQUFDd0ssS0FBSyxDQUFDdEosQ0FBQyxHQUFHMkosV0FBVyxDQUFDM0osQ0FBQyxJQUFLb0ksT0FBTyxFQUFFLENBQUUsQ0FBQ2tCLEtBQUssQ0FBQ3JKLENBQUMsR0FBRzBKLFdBQVcsQ0FBQzFKLENBQUMsSUFBS29JLE9BQVEsQ0FBQztJQUMxRyxNQUFNWCxVQUFVLEdBQUdzQyxXQUFXLENBQUVsTCxPQUFPLENBQUN1TCxNQUFNLEVBQUVGLE1BQU8sQ0FBQztJQUN4RCxJQUFJRyxVQUFVLEdBQUdOLFdBQVcsQ0FBRUcsTUFBTSxFQUFFQyxJQUFLLENBQUMsSUFBS3ZLLElBQUksQ0FBQzBLLEVBQUUsR0FBRyxDQUFDLENBQUU7O0lBRTlEO0lBQ0E7SUFDQTtJQUNBLElBQUssQ0FBQ3JCLEtBQUssSUFBSW9CLFVBQVUsR0FBRyxDQUFDLEVBQUc7TUFDOUJBLFVBQVUsSUFBSXpLLElBQUksQ0FBQzBLLEVBQUUsR0FBRyxDQUFDO0lBQzNCO0lBQ0EsSUFBS3JCLEtBQUssSUFBSW9CLFVBQVUsR0FBRyxDQUFDLEVBQUc7TUFDN0JBLFVBQVUsSUFBSXpLLElBQUksQ0FBQzBLLEVBQUUsR0FBRyxDQUFDO0lBQzNCOztJQUVBO0lBQ0EsTUFBTXBDLGFBQWEsR0FBRyxJQUFJaEosYUFBYSxDQUFFMkksTUFBTSxFQUFFTSxPQUFPLEVBQUVDLE9BQU8sRUFBRUMsUUFBUSxFQUFFWixVQUFVLEVBQUVBLFVBQVUsR0FBRzRDLFVBQVUsRUFBRSxDQUFDcEIsS0FBTSxDQUFDO0lBQzFILE1BQU03QyxxQkFBcUIsR0FBRzhCLGFBQWEsQ0FBQzdCLHdCQUF3QixDQUFDLENBQUM7SUFDdEUxRSxDQUFDLENBQUNDLElBQUksQ0FBRXdFLHFCQUFxQixFQUFFRSxPQUFPLElBQUk7TUFDeEMsSUFBSSxDQUFDM0MsbUJBQW1CLENBQUUyQyxPQUFRLENBQUM7SUFDckMsQ0FBRSxDQUFDO0lBRUgsT0FBTyxJQUFJO0VBQ2I7O0VBRUE7QUFDRjtBQUNBOztFQUdTaUUsTUFBTUEsQ0FBRWpELE9BQXlCLEVBQUVDLE9BQWUsRUFBRUMsTUFBZSxFQUFTO0lBQ2pGLElBQUssT0FBT0YsT0FBTyxLQUFLLFFBQVEsRUFBRztNQUNqQztNQUNBLE1BQU1PLE1BQU0sR0FBR1AsT0FBTztNQUN0QkUsTUFBTSxHQUFHRCxPQUFPO01BQ2hCLE9BQU8sSUFBSSxDQUFDSyxRQUFRLENBQUVDLE1BQU0sRUFBRUwsTUFBTSxFQUFFLENBQUMsRUFBRTVILElBQUksQ0FBQzBLLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBTSxDQUFDLENBQUMvQixLQUFLLENBQUMsQ0FBQztJQUN2RSxDQUFDLE1BQ0k7TUFDSHhHLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUU2RSxPQUFRLENBQUMsRUFBRyxvQ0FBbUNBLE9BQVEsRUFBRSxDQUFDO01BQ3RGdkYsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRThFLE9BQVEsQ0FBQyxFQUFHLG9DQUFtQ0EsT0FBUSxFQUFFLENBQUM7O01BRXRGO01BQ0EsT0FBTyxJQUFJLENBQUNLLFFBQVEsQ0FBRTlILENBQUMsQ0FBRXdILE9BQU8sRUFBRUMsT0FBUSxDQUFDLEVBQUVDLE1BQU0sRUFBRyxDQUFDLEVBQUU1SCxJQUFJLENBQUMwSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQU0sQ0FBQyxDQUFDL0IsS0FBSyxDQUFDLENBQUM7SUFDdkY7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBOztFQUdTaUMsT0FBT0EsQ0FBRWxELE9BQXlCLEVBQUVDLE9BQWUsRUFBRVksT0FBZSxFQUFFQyxPQUFlLEVBQUVDLFFBQWlCLEVBQVM7SUFDdEg7SUFDQTtJQUNBLElBQUssT0FBT2YsT0FBTyxLQUFLLFFBQVEsRUFBRztNQUNqQztNQUNBLE1BQU1PLE1BQU0sR0FBR1AsT0FBTztNQUN0QmUsUUFBUSxHQUFHRCxPQUFPO01BQ2xCQSxPQUFPLEdBQUdELE9BQU87TUFDakJBLE9BQU8sR0FBR1osT0FBTztNQUNqQixPQUFPLElBQUksQ0FBQ2Usa0JBQWtCLENBQUVULE1BQU0sRUFBRU0sT0FBTyxFQUFFQyxPQUFPLEVBQUVDLFFBQVEsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFekksSUFBSSxDQUFDMEssRUFBRSxHQUFHLENBQUMsRUFBRSxLQUFNLENBQUMsQ0FBQy9CLEtBQUssQ0FBQyxDQUFDO0lBQzFHLENBQUMsTUFDSTtNQUNIeEcsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRTZFLE9BQVEsQ0FBQyxFQUFHLG9DQUFtQ0EsT0FBUSxFQUFFLENBQUM7TUFDdEZ2RixNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFOEUsT0FBUSxDQUFDLEVBQUcsb0NBQW1DQSxPQUFRLEVBQUUsQ0FBQzs7TUFFdEY7TUFDQSxPQUFPLElBQUksQ0FBQ2Usa0JBQWtCLENBQUV4SSxDQUFDLENBQUV3SCxPQUFPLEVBQUVDLE9BQVEsQ0FBQyxFQUFFWSxPQUFPLEVBQUVDLE9BQU8sRUFBRUMsUUFBUSxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUV6SSxJQUFJLENBQUMwSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQU0sQ0FBQyxDQUFDL0IsS0FBSyxDQUFDLENBQUM7SUFDekg7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NrQyxJQUFJQSxDQUFFMUssQ0FBUyxFQUFFQyxDQUFTLEVBQUUwSyxLQUFhLEVBQUVDLE1BQWMsRUFBUztJQUN2RTVJLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUUxQyxDQUFFLENBQUMsRUFBRyw4QkFBNkJBLENBQUUsRUFBRSxDQUFDO0lBQ3BFZ0MsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRXpDLENBQUUsQ0FBQyxFQUFHLDhCQUE2QkEsQ0FBRSxFQUFFLENBQUM7SUFDcEUrQixNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFaUksS0FBTSxDQUFDLEVBQUcsa0NBQWlDQSxLQUFNLEVBQUUsQ0FBQztJQUNoRjNJLE1BQU0sSUFBSUEsTUFBTSxDQUFFVSxRQUFRLENBQUVrSSxNQUFPLENBQUMsRUFBRyxtQ0FBa0NBLE1BQU8sRUFBRSxDQUFDO0lBRW5GLE1BQU1DLE9BQU8sR0FBRyxJQUFJcEwsT0FBTyxDQUFDLENBQUM7SUFDN0IsSUFBSSxDQUFDa0MsVUFBVSxDQUFFa0osT0FBUSxDQUFDO0lBQzFCQSxPQUFPLENBQUM1SCxRQUFRLENBQUVsRCxDQUFDLENBQUVDLENBQUMsRUFBRUMsQ0FBRSxDQUFFLENBQUM7SUFDN0I0SyxPQUFPLENBQUM1SCxRQUFRLENBQUVsRCxDQUFDLENBQUVDLENBQUMsR0FBRzJLLEtBQUssRUFBRTFLLENBQUUsQ0FBRSxDQUFDO0lBQ3JDNEssT0FBTyxDQUFDNUgsUUFBUSxDQUFFbEQsQ0FBQyxDQUFFQyxDQUFDLEdBQUcySyxLQUFLLEVBQUUxSyxDQUFDLEdBQUcySyxNQUFPLENBQUUsQ0FBQztJQUM5Q0MsT0FBTyxDQUFDNUgsUUFBUSxDQUFFbEQsQ0FBQyxDQUFFQyxDQUFDLEVBQUVDLENBQUMsR0FBRzJLLE1BQU8sQ0FBRSxDQUFDO0lBQ3RDLElBQUksQ0FBQ2hILG1CQUFtQixDQUFFLElBQUl0RSxJQUFJLENBQUV1TCxPQUFPLENBQUNDLE1BQU0sQ0FBRSxDQUFDLENBQUUsRUFBRUQsT0FBTyxDQUFDQyxNQUFNLENBQUUsQ0FBQyxDQUFHLENBQUUsQ0FBQztJQUNoRixJQUFJLENBQUNsSCxtQkFBbUIsQ0FBRSxJQUFJdEUsSUFBSSxDQUFFdUwsT0FBTyxDQUFDQyxNQUFNLENBQUUsQ0FBQyxDQUFFLEVBQUVELE9BQU8sQ0FBQ0MsTUFBTSxDQUFFLENBQUMsQ0FBRyxDQUFFLENBQUM7SUFDaEYsSUFBSSxDQUFDbEgsbUJBQW1CLENBQUUsSUFBSXRFLElBQUksQ0FBRXVMLE9BQU8sQ0FBQ0MsTUFBTSxDQUFFLENBQUMsQ0FBRSxFQUFFRCxPQUFPLENBQUNDLE1BQU0sQ0FBRSxDQUFDLENBQUcsQ0FBRSxDQUFDO0lBQ2hGRCxPQUFPLENBQUNyQyxLQUFLLENBQUMsQ0FBQztJQUNmLElBQUksQ0FBQzdHLFVBQVUsQ0FBRSxJQUFJbEMsT0FBTyxDQUFDLENBQUUsQ0FBQztJQUNoQyxJQUFJLENBQUMrRCxjQUFjLENBQUMsQ0FBQyxDQUFDUCxRQUFRLENBQUVsRCxDQUFDLENBQUVDLENBQUMsRUFBRUMsQ0FBRSxDQUFFLENBQUM7SUFDM0MrQixNQUFNLElBQUlBLE1BQU0sQ0FBRSxDQUFDK0ksS0FBSyxDQUFFLElBQUksQ0FBQzVKLE1BQU0sQ0FBQzZKLElBQUksQ0FBQyxDQUFFLENBQUUsQ0FBQztJQUNoRCxJQUFJLENBQUMzSixrQkFBa0IsQ0FBQyxDQUFDO0lBRXpCLE9BQU8sSUFBSTtFQUNiOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1M0SixTQUFTQSxDQUFFakwsQ0FBUyxFQUFFQyxDQUFTLEVBQUUwSyxLQUFhLEVBQUVDLE1BQWMsRUFBRU0sSUFBWSxFQUFFQyxJQUFZLEVBQVM7SUFDeEcsTUFBTUMsSUFBSSxHQUFHcEwsQ0FBQyxHQUFHa0wsSUFBSTtJQUNyQixNQUFNRyxLQUFLLEdBQUdyTCxDQUFDLEdBQUcySyxLQUFLLEdBQUdPLElBQUk7SUFDOUIsTUFBTUksSUFBSSxHQUFHckwsQ0FBQyxHQUFHa0wsSUFBSTtJQUNyQixNQUFNSSxLQUFLLEdBQUd0TCxDQUFDLEdBQUcySyxNQUFNLEdBQUdPLElBQUk7SUFDL0I7SUFDQSxJQUFLRCxJQUFJLEtBQUtDLElBQUksRUFBRztNQUNuQjtNQUNBLElBQUksQ0FDRDdELEdBQUcsQ0FBRStELEtBQUssRUFBRUMsSUFBSSxFQUFFSixJQUFJLEVBQUUsQ0FBQ3JMLElBQUksQ0FBQzBLLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQU0sQ0FBQyxDQUNoRGpELEdBQUcsQ0FBRStELEtBQUssRUFBRUUsS0FBSyxFQUFFTCxJQUFJLEVBQUUsQ0FBQyxFQUFFckwsSUFBSSxDQUFDMEssRUFBRSxHQUFHLENBQUMsRUFBRSxLQUFNLENBQUMsQ0FDaERqRCxHQUFHLENBQUU4RCxJQUFJLEVBQUVHLEtBQUssRUFBRUwsSUFBSSxFQUFFckwsSUFBSSxDQUFDMEssRUFBRSxHQUFHLENBQUMsRUFBRTFLLElBQUksQ0FBQzBLLEVBQUUsRUFBRSxLQUFNLENBQUMsQ0FDckRqRCxHQUFHLENBQUU4RCxJQUFJLEVBQUVFLElBQUksRUFBRUosSUFBSSxFQUFFckwsSUFBSSxDQUFDMEssRUFBRSxFQUFFMUssSUFBSSxDQUFDMEssRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBTSxDQUFDLENBQ3hEL0IsS0FBSyxDQUFDLENBQUM7SUFDWixDQUFDLE1BQ0k7TUFDSDtNQUNBLElBQUksQ0FDREwsYUFBYSxDQUFFa0QsS0FBSyxFQUFFQyxJQUFJLEVBQUVKLElBQUksRUFBRUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDdEwsSUFBSSxDQUFDMEssRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBTSxDQUFDLENBQ25FcEMsYUFBYSxDQUFFa0QsS0FBSyxFQUFFRSxLQUFLLEVBQUVMLElBQUksRUFBRUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUV0TCxJQUFJLENBQUMwSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQU0sQ0FBQyxDQUNuRXBDLGFBQWEsQ0FBRWlELElBQUksRUFBRUcsS0FBSyxFQUFFTCxJQUFJLEVBQUVDLElBQUksRUFBRSxDQUFDLEVBQUV0TCxJQUFJLENBQUMwSyxFQUFFLEdBQUcsQ0FBQyxFQUFFMUssSUFBSSxDQUFDMEssRUFBRSxFQUFFLEtBQU0sQ0FBQyxDQUN4RXBDLGFBQWEsQ0FBRWlELElBQUksRUFBRUUsSUFBSSxFQUFFSixJQUFJLEVBQUVDLElBQUksRUFBRSxDQUFDLEVBQUV0TCxJQUFJLENBQUMwSyxFQUFFLEVBQUUxSyxJQUFJLENBQUMwSyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFNLENBQUMsQ0FDM0UvQixLQUFLLENBQUMsQ0FBQztJQUNaO0lBQ0EsT0FBTyxJQUFJO0VBQ2I7O0VBRUE7QUFDRjtBQUNBO0VBQ1NnRCxPQUFPQSxDQUFFQyxRQUFtQixFQUFTO0lBQzFDLE1BQU0vSixNQUFNLEdBQUcrSixRQUFRLENBQUMvSixNQUFNO0lBQzlCLElBQUtBLE1BQU0sR0FBRyxDQUFDLEVBQUc7TUFDaEIsSUFBSSxDQUFDaUIsV0FBVyxDQUFFOEksUUFBUSxDQUFFLENBQUMsQ0FBRyxDQUFDO01BQ2pDLEtBQU0sSUFBSWhLLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR0MsTUFBTSxFQUFFRCxDQUFDLEVBQUUsRUFBRztRQUNqQyxJQUFJLENBQUMwQixXQUFXLENBQUVzSSxRQUFRLENBQUVoSyxDQUFDLENBQUcsQ0FBQztNQUNuQztJQUNGO0lBQ0EsT0FBTyxJQUFJLENBQUMrRyxLQUFLLENBQUMsQ0FBQztFQUNyQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTa0QsY0FBY0EsQ0FBRUMsU0FBb0IsRUFBRUMsZUFBdUMsRUFBUztJQUUzRixNQUFNQyxPQUFPLEdBQUc5TSxTQUFTLENBQXdCLENBQUMsQ0FBRTtNQUNsRHVCLE9BQU8sRUFBRSxDQUFDO01BQ1Z3TCxvQkFBb0IsRUFBRTtJQUN4QixDQUFDLEVBQUVGLGVBQWdCLENBQUM7SUFFcEI1SixNQUFNLElBQUlBLE1BQU0sQ0FBRTZKLE9BQU8sQ0FBQ3ZMLE9BQU8sR0FBRyxDQUFDLElBQUl1TCxPQUFPLENBQUN2TCxPQUFPLEdBQUcsQ0FBQyxDQUFDLEVBQUUsaUNBQWtDLENBQUM7SUFFbEcsTUFBTXlMLFdBQVcsR0FBR0osU0FBUyxDQUFDakssTUFBTSxDQUFDLENBQUM7O0lBRXRDO0lBQ0EsTUFBTXNLLGFBQWEsR0FBS0gsT0FBTyxDQUFDQyxvQkFBb0IsR0FBS0MsV0FBVyxHQUFHQSxXQUFXLEdBQUcsQ0FBQztJQUV0RixLQUFNLElBQUl0SyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUd1SyxhQUFhLEVBQUV2SyxDQUFDLEVBQUUsRUFBRztNQUN4QyxJQUFJd0ssY0FBYyxDQUFDLENBQUM7TUFDcEIsSUFBS3hLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQ29LLE9BQU8sQ0FBQ0Msb0JBQW9CLEVBQUc7UUFDOUNHLGNBQWMsR0FBRyxDQUNmTixTQUFTLENBQUUsQ0FBQyxDQUFFLEVBQ2RBLFNBQVMsQ0FBRSxDQUFDLENBQUUsRUFDZEEsU0FBUyxDQUFFLENBQUMsQ0FBRSxFQUNkQSxTQUFTLENBQUUsQ0FBQyxDQUFFLENBQUU7TUFDcEIsQ0FBQyxNQUNJLElBQU9sSyxDQUFDLEtBQUt1SyxhQUFhLEdBQUcsQ0FBQyxJQUFNLENBQUNILE9BQU8sQ0FBQ0Msb0JBQW9CLEVBQUc7UUFDdkVHLGNBQWMsR0FBRyxDQUNmTixTQUFTLENBQUVsSyxDQUFDLEdBQUcsQ0FBQyxDQUFFLEVBQ2xCa0ssU0FBUyxDQUFFbEssQ0FBQyxDQUFFLEVBQ2RrSyxTQUFTLENBQUVsSyxDQUFDLEdBQUcsQ0FBQyxDQUFFLEVBQ2xCa0ssU0FBUyxDQUFFbEssQ0FBQyxHQUFHLENBQUMsQ0FBRSxDQUFFO01BQ3hCLENBQUMsTUFDSTtRQUNId0ssY0FBYyxHQUFHLENBQ2ZOLFNBQVMsQ0FBRSxDQUFFbEssQ0FBQyxHQUFHLENBQUMsR0FBR3NLLFdBQVcsSUFBS0EsV0FBVyxDQUFFLEVBQ2xESixTQUFTLENBQUVsSyxDQUFDLEdBQUdzSyxXQUFXLENBQUUsRUFDNUJKLFNBQVMsQ0FBRSxDQUFFbEssQ0FBQyxHQUFHLENBQUMsSUFBS3NLLFdBQVcsQ0FBRSxFQUNwQ0osU0FBUyxDQUFFLENBQUVsSyxDQUFDLEdBQUcsQ0FBQyxJQUFLc0ssV0FBVyxDQUFFLENBQUU7TUFDMUM7O01BRUE7TUFDQTtNQUNBO01BQ0E7TUFDQTs7TUFFQTtNQUNBLE1BQU1HLFlBQVksR0FBRyxDQUNuQkQsY0FBYyxDQUFFLENBQUMsQ0FBRSxFQUNuQi9MLG9CQUFvQixDQUFFK0wsY0FBYyxDQUFFLENBQUMsQ0FBRSxFQUFFQSxjQUFjLENBQUUsQ0FBQyxDQUFFLEVBQUVBLGNBQWMsQ0FBRSxDQUFDLENBQUUsRUFBRUosT0FBTyxDQUFDdkwsT0FBUSxDQUFDLEVBQ3RHSixvQkFBb0IsQ0FBRStMLGNBQWMsQ0FBRSxDQUFDLENBQUUsRUFBRUEsY0FBYyxDQUFFLENBQUMsQ0FBRSxFQUFFQSxjQUFjLENBQUUsQ0FBQyxDQUFFLEVBQUVKLE9BQU8sQ0FBQ3ZMLE9BQVEsQ0FBQyxFQUN0RzJMLGNBQWMsQ0FBRSxDQUFDLENBQUUsQ0FDcEI7O01BRUQ7TUFDQSxJQUFLeEssQ0FBQyxLQUFLLENBQUMsRUFBRztRQUNiLElBQUksQ0FBQ29DLE1BQU0sQ0FBRXFJLFlBQVksQ0FBRSxDQUFDLENBQUcsQ0FBQztRQUNoQyxJQUFJLENBQUMxSSxjQUFjLENBQUMsQ0FBQyxDQUFDUCxRQUFRLENBQUVpSixZQUFZLENBQUUsQ0FBQyxDQUFHLENBQUM7TUFDckQ7TUFFQSxJQUFJLENBQUNyRixpQkFBaUIsQ0FBRXFGLFlBQVksQ0FBRSxDQUFDLENBQUUsRUFBRUEsWUFBWSxDQUFFLENBQUMsQ0FBRSxFQUFFQSxZQUFZLENBQUUsQ0FBQyxDQUFHLENBQUM7SUFDbkY7SUFFQSxPQUFPLElBQUk7RUFDYjs7RUFFQTtBQUNGO0FBQ0E7RUFDUzNMLElBQUlBLENBQUEsRUFBVTtJQUNuQjtJQUNBLE9BQU8sSUFBSUksS0FBSyxDQUFFaUIsQ0FBQyxDQUFDdUssR0FBRyxDQUFFLElBQUksQ0FBQ3ZMLFFBQVEsRUFBRWlLLE9BQU8sSUFBSUEsT0FBTyxDQUFDdEssSUFBSSxDQUFDLENBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQ1ksTUFBTyxDQUFDO0VBQ3BGOztFQUVBO0FBQ0Y7QUFDQTtFQUNTaUwsY0FBY0EsQ0FBRUMsT0FBaUMsRUFBUztJQUMvRCxNQUFNQyxHQUFHLEdBQUcsSUFBSSxDQUFDMUwsUUFBUSxDQUFDYyxNQUFNO0lBQ2hDLEtBQU0sSUFBSUQsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHNkssR0FBRyxFQUFFN0ssQ0FBQyxFQUFFLEVBQUc7TUFDOUIsSUFBSSxDQUFDYixRQUFRLENBQUVhLENBQUMsQ0FBRSxDQUFDMkssY0FBYyxDQUFFQyxPQUFRLENBQUM7SUFDOUM7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtFQUNTRSxVQUFVQSxDQUFBLEVBQVc7SUFDMUIsSUFBSUMsTUFBTSxHQUFHLEVBQUU7SUFDZixNQUFNRixHQUFHLEdBQUcsSUFBSSxDQUFDMUwsUUFBUSxDQUFDYyxNQUFNO0lBQ2hDLEtBQU0sSUFBSUQsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHNkssR0FBRyxFQUFFN0ssQ0FBQyxFQUFFLEVBQUc7TUFDOUIsTUFBTW9KLE9BQU8sR0FBRyxJQUFJLENBQUNqSyxRQUFRLENBQUVhLENBQUMsQ0FBRTtNQUNsQyxJQUFLb0osT0FBTyxDQUFDNEIsVUFBVSxDQUFDLENBQUMsRUFBRztRQUMxQjtRQUNBLE1BQU03SCxVQUFVLEdBQUdpRyxPQUFPLENBQUM2QixRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUNuSixLQUFLO1FBRTlDaUosTUFBTSxJQUFLLEtBQUk5TSxTQUFTLENBQUVrRixVQUFVLENBQUM1RSxDQUFFLENBQUUsSUFBR04sU0FBUyxDQUFFa0YsVUFBVSxDQUFDM0UsQ0FBRSxDQUFFLEdBQUU7UUFFeEUsS0FBTSxJQUFJME0sQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHOUIsT0FBTyxDQUFDNkIsUUFBUSxDQUFDaEwsTUFBTSxFQUFFaUwsQ0FBQyxFQUFFLEVBQUc7VUFDbERILE1BQU0sSUFBSyxHQUFFM0IsT0FBTyxDQUFDNkIsUUFBUSxDQUFFQyxDQUFDLENBQUUsQ0FBQ0Msa0JBQWtCLENBQUMsQ0FBRSxHQUFFO1FBQzVEO1FBRUEsSUFBSy9CLE9BQU8sQ0FBQ2dDLFFBQVEsQ0FBQyxDQUFDLEVBQUc7VUFDeEJMLE1BQU0sSUFBSSxJQUFJO1FBQ2hCO01BQ0Y7SUFDRjtJQUNBLE9BQU9BLE1BQU07RUFDZjs7RUFFQTtBQUNGO0FBQ0E7RUFDU00sV0FBV0EsQ0FBRUMsTUFBZSxFQUFVO0lBQzNDO0lBQ0EsTUFBTW5NLFFBQVEsR0FBR2dCLENBQUMsQ0FBQ3VLLEdBQUcsQ0FBRSxJQUFJLENBQUN2TCxRQUFRLEVBQUVpSyxPQUFPLElBQUlBLE9BQU8sQ0FBQ2lDLFdBQVcsQ0FBRUMsTUFBTyxDQUFFLENBQUM7SUFDakYsTUFBTTVMLE1BQU0sR0FBR1MsQ0FBQyxDQUFDb0wsTUFBTSxDQUFFcE0sUUFBUSxFQUFFLENBQUVPLE1BQU0sRUFBRTBKLE9BQU8sS0FBTTFKLE1BQU0sQ0FBQzhMLEtBQUssQ0FBRXBDLE9BQU8sQ0FBQzFKLE1BQU8sQ0FBQyxFQUFFeEMsT0FBTyxDQUFDdU8sT0FBUSxDQUFDO0lBQzNHLE9BQU8sSUFBSXZNLEtBQUssQ0FBRUMsUUFBUSxFQUFFTyxNQUFPLENBQUM7RUFDdEM7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7RUFDU2dNLG9CQUFvQkEsQ0FBRXZCLGVBQTZDLEVBQVU7SUFDbEYsTUFBTUMsT0FBTyxHQUFHN00sY0FBYyxDQUErQjtNQUMzRG9PLFNBQVMsRUFBRSxDQUFDO01BQ1pDLFNBQVMsRUFBRSxDQUFDO01BQ1pDLGVBQWUsRUFBRSxJQUFJO01BQUU7TUFDdkJDLFlBQVksRUFBSTNCLGVBQWUsSUFBSUEsZUFBZSxDQUFDNEIsZ0JBQWdCLEdBQUssS0FBSyxHQUFHO0lBQ2xGLENBQUMsRUFBRTVCLGVBQWdCLENBQUM7O0lBRXBCO0lBQ0EsTUFBTWhMLFFBQVEsR0FBR2dCLENBQUMsQ0FBQ3VLLEdBQUcsQ0FBRSxJQUFJLENBQUN2TCxRQUFRLEVBQUVpSyxPQUFPLElBQUlBLE9BQU8sQ0FBQ3NDLG9CQUFvQixDQUFFdEIsT0FBUSxDQUFFLENBQUM7SUFDM0YsTUFBTTFLLE1BQU0sR0FBR1MsQ0FBQyxDQUFDb0wsTUFBTSxDQUFFcE0sUUFBUSxFQUFFLENBQUVPLE1BQU0sRUFBRTBKLE9BQU8sS0FBTTFKLE1BQU0sQ0FBQzhMLEtBQUssQ0FBRXBDLE9BQU8sQ0FBQzFKLE1BQU8sQ0FBQyxFQUFFeEMsT0FBTyxDQUFDdU8sT0FBUSxDQUFDO0lBQzNHLE9BQU8sSUFBSXZNLEtBQUssQ0FBRUMsUUFBUSxFQUFFTyxNQUFPLENBQUM7RUFDdEM7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTc00sZ0JBQWdCQSxDQUFFNUIsT0FBcUMsRUFBVTtJQUN0RSxPQUFPLElBQUksQ0FBQ3NCLG9CQUFvQixDQUFFbk8sY0FBYyxDQUErQjtNQUM3RTBPLFFBQVEsRUFBRUMsQ0FBQyxJQUFJN08sT0FBTyxDQUFDOE8sV0FBVyxDQUFFRCxDQUFDLENBQUMxTixDQUFDLEVBQUUwTixDQUFDLENBQUMzTixDQUFFLENBQUM7TUFDOUM2TixVQUFVLEVBQUUsa0JBQWtCLENBQUM7SUFDakMsQ0FBQyxFQUFFaEMsT0FBUSxDQUFFLENBQUM7RUFDaEI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NpQyxpQkFBaUJBLENBQUVqQyxPQUFxQyxFQUFVO0lBQ3ZFN0osTUFBTSxJQUFJQSxNQUFNLENBQUUsQ0FBQzZKLE9BQU8sSUFBSSxDQUFDQSxPQUFPLENBQUM2QixRQUFRLEVBQUUsc0ZBQXVGLENBQUM7SUFDekkxTCxNQUFNLElBQUlBLE1BQU0sQ0FBRSxDQUFDNkosT0FBTyxJQUFJLENBQUNBLE9BQU8sQ0FBQ2dDLFVBQVUsRUFBRSx3RkFBeUYsQ0FBQztJQUM3SSxPQUFPLElBQUksQ0FBQ1Ysb0JBQW9CLENBQUV0QixPQUFRLENBQUM7RUFDN0M7O0VBRUE7QUFDRjtBQUNBO0VBQ1NrQyxhQUFhQSxDQUFFeEwsS0FBYyxFQUFZO0lBRTlDO0lBQ0E7O0lBRUEsTUFBTXlMLFlBQVksR0FBR2xQLE9BQU8sQ0FBQ3VMLE1BQU0sQ0FBQzlKLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7SUFFNUM7SUFDQTtJQUNBO0lBQ0EsSUFBSTBOLEtBQUssR0FBRyxDQUFDO0lBQ2IsT0FBUUEsS0FBSyxHQUFHLENBQUMsRUFBRztNQUNsQkEsS0FBSyxFQUFFOztNQUVQO01BQ0E7TUFDQTtNQUNBLE1BQU1DLDBCQUEwQixHQUFHdE0sQ0FBQyxDQUFDdU0sSUFBSSxDQUFFLElBQUksQ0FBQ3ZOLFFBQVEsRUFBRWlLLE9BQU8sSUFBSTtRQUNuRSxPQUFPakosQ0FBQyxDQUFDdU0sSUFBSSxDQUFFdEQsT0FBTyxDQUFDNkIsUUFBUSxFQUFFbkcsT0FBTyxJQUFJO1VBQzFDLE1BQU0xQixLQUFLLEdBQUcwQixPQUFPLENBQUNoRCxLQUFLLENBQUN1QixLQUFLLENBQUV2QyxLQUFNLENBQUM7VUFDMUMsTUFBTThDLFNBQVMsR0FBR1IsS0FBSyxDQUFDUSxTQUFTO1VBQ2pDLElBQUtBLFNBQVMsS0FBSyxDQUFDLEVBQUc7WUFDckJSLEtBQUssQ0FBQ3VKLFlBQVksQ0FBRS9JLFNBQVUsQ0FBQyxDQUFDLENBQUM7WUFDakNSLEtBQUssQ0FBQ3JFLFFBQVEsQ0FBRXdOLFlBQWEsQ0FBQyxDQUFDLENBQUM7WUFDaEMsT0FBT25KLEtBQUssQ0FBQ3dKLGdCQUFnQixHQUFHLElBQUk7VUFDdEMsQ0FBQyxNQUNJO1lBQ0g7WUFDQSxPQUFPLEtBQUs7VUFDZDtRQUNGLENBQUUsQ0FBQztNQUNMLENBQUUsQ0FBQztNQUVILElBQUtILDBCQUEwQixFQUFHO1FBQ2hDO1FBQ0FGLFlBQVksQ0FBQ00sTUFBTSxDQUFFMVAsU0FBUyxDQUFDMlAsVUFBVSxDQUFDLENBQUUsQ0FBQztNQUMvQyxDQUFDLE1BQ0k7UUFDSDtRQUNBO01BQ0Y7SUFDRjtJQUVBLE9BQU8sSUFBSSxDQUFDQyxtQkFBbUIsQ0FBRSxJQUFJM1AsSUFBSSxDQUFFMEQsS0FBSyxFQUFFeUwsWUFBYSxDQUFFLENBQUMsS0FBSyxDQUFDO0VBQzFFOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0VBQ1NTLFlBQVlBLENBQUVDLEdBQVMsRUFBc0I7SUFDbEQsSUFBSUMsSUFBdUIsR0FBRyxFQUFFO0lBQ2hDLE1BQU1DLFdBQVcsR0FBRyxJQUFJLENBQUNoTyxRQUFRLENBQUNjLE1BQU07SUFDeEMsS0FBTSxJQUFJRCxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdtTixXQUFXLEVBQUVuTixDQUFDLEVBQUUsRUFBRztNQUN0QyxNQUFNb0osT0FBTyxHQUFHLElBQUksQ0FBQ2pLLFFBQVEsQ0FBRWEsQ0FBQyxDQUFFO01BRWxDLElBQUtvSixPQUFPLENBQUM0QixVQUFVLENBQUMsQ0FBQyxFQUFHO1FBQzFCLE1BQU1vQyxXQUFXLEdBQUdoRSxPQUFPLENBQUM2QixRQUFRLENBQUNoTCxNQUFNO1FBQzNDLEtBQU0sSUFBSWlMLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR2tDLFdBQVcsRUFBRWxDLENBQUMsRUFBRSxFQUFHO1VBQ3RDLE1BQU1wRyxPQUFPLEdBQUdzRSxPQUFPLENBQUM2QixRQUFRLENBQUVDLENBQUMsQ0FBRTtVQUNyQ2dDLElBQUksR0FBR0EsSUFBSSxDQUFDRyxNQUFNLENBQUV2SSxPQUFPLENBQUNrSSxZQUFZLENBQUVDLEdBQUksQ0FBRSxDQUFDO1FBQ25EO1FBRUEsSUFBSzdELE9BQU8sQ0FBQ2tFLGlCQUFpQixDQUFDLENBQUMsRUFBRztVQUNqQ0osSUFBSSxHQUFHQSxJQUFJLENBQUNHLE1BQU0sQ0FBRWpFLE9BQU8sQ0FBQ21FLGlCQUFpQixDQUFDLENBQUMsQ0FBQ1AsWUFBWSxDQUFFQyxHQUFJLENBQUUsQ0FBQztRQUN2RTtNQUNGO0lBQ0Y7SUFDQSxPQUFPOU0sQ0FBQyxDQUFDcU4sTUFBTSxDQUFFTixJQUFJLEVBQUVPLEdBQUcsSUFBSUEsR0FBRyxDQUFDQyxRQUFTLENBQUM7RUFDOUM7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDU0MsNkJBQTZCQSxDQUFFeEssVUFBbUIsRUFBRUgsUUFBaUIsRUFBWTtJQUN0RjtJQUNBO0lBQ0EsTUFBTTRLLFFBQVEsR0FBR3pLLFVBQVUsQ0FBQ21GLEtBQUssQ0FBRXRGLFFBQVEsRUFBRSxHQUFJLENBQUM7SUFDbEQsSUFBSyxJQUFJLENBQUNzSixhQUFhLENBQUVzQixRQUFTLENBQUMsRUFBRztNQUNwQyxPQUFPLElBQUk7SUFDYjs7SUFFQTtJQUNBLE1BQU14SyxLQUFLLEdBQUdKLFFBQVEsQ0FBQ0ssS0FBSyxDQUFFRixVQUFXLENBQUM7SUFDMUMsTUFBTWxELE1BQU0sR0FBR21ELEtBQUssQ0FBQ1EsU0FBUztJQUU5QixJQUFLM0QsTUFBTSxLQUFLLENBQUMsRUFBRztNQUNsQixPQUFPLEtBQUs7SUFDZDtJQUVBbUQsS0FBSyxDQUFDeUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDOztJQUVuQjtJQUNBLE1BQU1YLElBQUksR0FBRyxJQUFJLENBQUNGLFlBQVksQ0FBRSxJQUFJNVAsSUFBSSxDQUFFK0YsVUFBVSxFQUFFQyxLQUFNLENBQUUsQ0FBQzs7SUFFL0Q7SUFDQTtJQUNBLEtBQU0sSUFBSXBELENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR2tOLElBQUksQ0FBQ2pOLE1BQU0sRUFBRUQsQ0FBQyxFQUFFLEVBQUc7TUFDdEMsSUFBS2tOLElBQUksQ0FBRWxOLENBQUMsQ0FBRSxDQUFDME4sUUFBUSxJQUFJek4sTUFBTSxFQUFHO1FBQ2xDLE9BQU8sSUFBSTtNQUNiO0lBQ0Y7O0lBRUE7SUFDQSxPQUFPLEtBQUs7RUFDZDs7RUFFQTtBQUNGO0FBQ0E7RUFDUzhNLG1CQUFtQkEsQ0FBRUUsR0FBUyxFQUFXO0lBQzlDLElBQUlhLElBQUksR0FBRyxDQUFDO0lBRVosTUFBTVgsV0FBVyxHQUFHLElBQUksQ0FBQ2hPLFFBQVEsQ0FBQ2MsTUFBTTtJQUN4QyxLQUFNLElBQUlELENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR21OLFdBQVcsRUFBRW5OLENBQUMsRUFBRSxFQUFHO01BQ3RDLE1BQU1vSixPQUFPLEdBQUcsSUFBSSxDQUFDakssUUFBUSxDQUFFYSxDQUFDLENBQUU7TUFFbEMsSUFBS29KLE9BQU8sQ0FBQzRCLFVBQVUsQ0FBQyxDQUFDLEVBQUc7UUFDMUIsTUFBTW9DLFdBQVcsR0FBR2hFLE9BQU8sQ0FBQzZCLFFBQVEsQ0FBQ2hMLE1BQU07UUFDM0MsS0FBTSxJQUFJaUwsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHa0MsV0FBVyxFQUFFbEMsQ0FBQyxFQUFFLEVBQUc7VUFDdEM0QyxJQUFJLElBQUkxRSxPQUFPLENBQUM2QixRQUFRLENBQUVDLENBQUMsQ0FBRSxDQUFDNkIsbUJBQW1CLENBQUVFLEdBQUksQ0FBQztRQUMxRDs7UUFFQTtRQUNBLElBQUs3RCxPQUFPLENBQUNrRSxpQkFBaUIsQ0FBQyxDQUFDLEVBQUc7VUFDakNRLElBQUksSUFBSTFFLE9BQU8sQ0FBQ21FLGlCQUFpQixDQUFDLENBQUMsQ0FBQ1IsbUJBQW1CLENBQUVFLEdBQUksQ0FBQztRQUNoRTtNQUNGO0lBQ0Y7SUFFQSxPQUFPYSxJQUFJO0VBQ2I7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNTQyxnQkFBZ0JBLENBQUVyTyxNQUFlLEVBQVk7SUFDbEQ7SUFDQSxJQUFLLElBQUksQ0FBQ0EsTUFBTSxDQUFDc04sWUFBWSxDQUFFdE4sTUFBTyxDQUFDLENBQUMrRyxNQUFNLENBQUUsSUFBSSxDQUFDL0csTUFBTyxDQUFDLEVBQUc7TUFDOUQsT0FBTyxJQUFJO0lBQ2I7O0lBRUE7SUFDQSxNQUFNc08sZ0JBQWdCLEdBQUcsSUFBSTVRLElBQUksQ0FBRSxJQUFJQyxPQUFPLENBQUVxQyxNQUFNLENBQUN1TyxJQUFJLEVBQUV2TyxNQUFNLENBQUN3TyxJQUFLLENBQUMsRUFBRSxJQUFJN1EsT0FBTyxDQUFFLENBQUMsRUFBRSxDQUFFLENBQUUsQ0FBQztJQUNqRyxNQUFNOFEsY0FBYyxHQUFHLElBQUkvUSxJQUFJLENBQUUsSUFBSUMsT0FBTyxDQUFFcUMsTUFBTSxDQUFDdU8sSUFBSSxFQUFFdk8sTUFBTSxDQUFDd08sSUFBSyxDQUFDLEVBQUUsSUFBSTdRLE9BQU8sQ0FBRSxDQUFDLEVBQUUsQ0FBRSxDQUFFLENBQUM7SUFDL0YsTUFBTStRLGdCQUFnQixHQUFHLElBQUloUixJQUFJLENBQUUsSUFBSUMsT0FBTyxDQUFFcUMsTUFBTSxDQUFDMk8sSUFBSSxFQUFFM08sTUFBTSxDQUFDNE8sSUFBSyxDQUFDLEVBQUUsSUFBSWpSLE9BQU8sQ0FBRSxDQUFDLENBQUMsRUFBRSxDQUFFLENBQUUsQ0FBQztJQUNsRyxNQUFNa1IsY0FBYyxHQUFHLElBQUluUixJQUFJLENBQUUsSUFBSUMsT0FBTyxDQUFFcUMsTUFBTSxDQUFDMk8sSUFBSSxFQUFFM08sTUFBTSxDQUFDNE8sSUFBSyxDQUFDLEVBQUUsSUFBSWpSLE9BQU8sQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztJQUVoRyxJQUFJbVIsUUFBUTtJQUNaLElBQUl4TyxDQUFDO0lBQ0w7SUFDQSxNQUFNeU8sMEJBQTBCLEdBQUcsSUFBSSxDQUFDekIsWUFBWSxDQUFFZ0IsZ0JBQWlCLENBQUMsQ0FBQ1gsTUFBTSxDQUFFLElBQUksQ0FBQ0wsWUFBWSxDQUFFb0IsZ0JBQWlCLENBQUUsQ0FBQztJQUN4SCxLQUFNcE8sQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHeU8sMEJBQTBCLENBQUN4TyxNQUFNLEVBQUVELENBQUMsRUFBRSxFQUFHO01BQ3hEd08sUUFBUSxHQUFHQywwQkFBMEIsQ0FBRXpPLENBQUMsQ0FBRSxDQUFDYyxLQUFLO01BQ2hELElBQUswTixRQUFRLENBQUNqUSxDQUFDLElBQUltQixNQUFNLENBQUN1TyxJQUFJLElBQUlPLFFBQVEsQ0FBQ2pRLENBQUMsSUFBSW1CLE1BQU0sQ0FBQzJPLElBQUksRUFBRztRQUM1RCxPQUFPLElBQUk7TUFDYjtJQUNGO0lBRUEsTUFBTUssd0JBQXdCLEdBQUcsSUFBSSxDQUFDMUIsWUFBWSxDQUFFbUIsY0FBZSxDQUFDLENBQUNkLE1BQU0sQ0FBRSxJQUFJLENBQUNMLFlBQVksQ0FBRXVCLGNBQWUsQ0FBRSxDQUFDO0lBQ2xILEtBQU12TyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUcwTyx3QkFBd0IsQ0FBQ3pPLE1BQU0sRUFBRUQsQ0FBQyxFQUFFLEVBQUc7TUFDdER3TyxRQUFRLEdBQUdFLHdCQUF3QixDQUFFMU8sQ0FBQyxDQUFFLENBQUNjLEtBQUs7TUFDOUMsSUFBSzBOLFFBQVEsQ0FBQ2hRLENBQUMsSUFBSWtCLE1BQU0sQ0FBQ3dPLElBQUksSUFBSU0sUUFBUSxDQUFDaFEsQ0FBQyxJQUFJa0IsTUFBTSxDQUFDNE8sSUFBSSxFQUFHO1FBQzVELE9BQU8sSUFBSTtNQUNiO0lBQ0Y7O0lBRUE7SUFDQSxPQUFPLEtBQUs7RUFDZDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDU0ssZUFBZUEsQ0FBRUMsVUFBc0IsRUFBVTtJQUN0RCxJQUFJelAsUUFBbUIsR0FBRyxFQUFFO0lBQzVCLE1BQU1PLE1BQU0sR0FBR3hDLE9BQU8sQ0FBQ3VPLE9BQU8sQ0FBQzNNLElBQUksQ0FBQyxDQUFDO0lBQ3JDLElBQUkrUCxNQUFNLEdBQUcsSUFBSSxDQUFDMVAsUUFBUSxDQUFDYyxNQUFNO0lBQ2pDLEtBQU0sSUFBSUQsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHNk8sTUFBTSxFQUFFN08sQ0FBQyxFQUFFLEVBQUc7TUFDakMsTUFBTW9KLE9BQU8sR0FBRyxJQUFJLENBQUNqSyxRQUFRLENBQUVhLENBQUMsQ0FBRTtNQUNsQyxNQUFNOE8sY0FBYyxHQUFHMUYsT0FBTyxDQUFDMkYsT0FBTyxDQUFFSCxVQUFXLENBQUM7TUFDcER6UCxRQUFRLEdBQUdBLFFBQVEsQ0FBQ2tPLE1BQU0sQ0FBRXlCLGNBQWUsQ0FBQztJQUM5QztJQUNBRCxNQUFNLEdBQUcxUCxRQUFRLENBQUNjLE1BQU07SUFDeEIsS0FBTSxJQUFJRCxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUc2TyxNQUFNLEVBQUU3TyxDQUFDLEVBQUUsRUFBRztNQUNqQ04sTUFBTSxDQUFDc1AsYUFBYSxDQUFFN1AsUUFBUSxDQUFFYSxDQUFDLENBQUUsQ0FBQ04sTUFBTyxDQUFDO0lBQzlDO0lBQ0EsT0FBTyxJQUFJUixLQUFLLENBQUVDLFFBQVEsRUFBRU8sTUFBTyxDQUFDO0VBQ3RDOztFQUVBO0FBQ0Y7QUFDQTtFQUNTdVAsY0FBY0EsQ0FBRXZCLFFBQWdCLEVBQVU7SUFDL0M7SUFDQSxNQUFNdk8sUUFBUSxHQUFHLEVBQUU7SUFDbkIsTUFBTU8sTUFBTSxHQUFHeEMsT0FBTyxDQUFDdU8sT0FBTyxDQUFDM00sSUFBSSxDQUFDLENBQUM7SUFDckMsSUFBSStQLE1BQU0sR0FBRyxJQUFJLENBQUMxUCxRQUFRLENBQUNjLE1BQU07SUFDakMsS0FBTSxJQUFJRCxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUc2TyxNQUFNLEVBQUU3TyxDQUFDLEVBQUUsRUFBRztNQUNqQ2IsUUFBUSxDQUFDK1AsSUFBSSxDQUFFLElBQUksQ0FBQy9QLFFBQVEsQ0FBRWEsQ0FBQyxDQUFFLENBQUNtUCxNQUFNLENBQUV6QixRQUFTLENBQUUsQ0FBQztJQUN4RDtJQUNBbUIsTUFBTSxHQUFHMVAsUUFBUSxDQUFDYyxNQUFNO0lBQ3hCLEtBQU0sSUFBSUQsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHNk8sTUFBTSxFQUFFN08sQ0FBQyxFQUFFLEVBQUc7TUFDakNOLE1BQU0sQ0FBQ3NQLGFBQWEsQ0FBRTdQLFFBQVEsQ0FBRWEsQ0FBQyxDQUFFLENBQUNOLE1BQU8sQ0FBQztJQUM5QztJQUNBLE9BQU8sSUFBSVIsS0FBSyxDQUFFQyxRQUFRLEVBQUVPLE1BQU8sQ0FBQztFQUN0Qzs7RUFFQTtBQUNGO0FBQ0E7RUFDUzBQLGNBQWNBLENBQUVDLFFBQWtCLEVBQUVDLGNBQXNCLEVBQUVuRixlQUF1QyxFQUFVO0lBQ2xILE1BQU1DLE9BQU8sR0FBRzlNLFNBQVMsQ0FBd0IsQ0FBQyxDQUFFO01BQ2xEdU8sZUFBZSxFQUFFLEtBQUs7TUFDdEJDLFlBQVksRUFBRTtJQUNoQixDQUFDLEVBQUUzQixlQUFnQixDQUFDO0lBRXBCLE9BQU8sSUFBSWpMLEtBQUssQ0FBRWlCLENBQUMsQ0FBQ29QLE9BQU8sQ0FBRSxJQUFJLENBQUNwUSxRQUFRLENBQUN1TCxHQUFHLENBQUV0QixPQUFPLElBQUlBLE9BQU8sQ0FBQ29HLE1BQU0sQ0FBRUgsUUFBUSxFQUFFQyxjQUFjLEVBQUVsRixPQUFPLENBQUN5QixlQUFlLEVBQUV6QixPQUFPLENBQUMwQixZQUFhLENBQUUsQ0FBRSxDQUFFLENBQUM7RUFDNUo7O0VBRUE7QUFDRjtBQUNBO0VBQ1MyRCxTQUFTQSxDQUFBLEVBQVk7SUFDMUIsSUFBSyxJQUFJLENBQUM5UCxPQUFPLEtBQUssSUFBSSxFQUFHO01BQzNCLE1BQU1ELE1BQU0sR0FBR3hDLE9BQU8sQ0FBQ3VPLE9BQU8sQ0FBQzNNLElBQUksQ0FBQyxDQUFDO01BQ3JDcUIsQ0FBQyxDQUFDQyxJQUFJLENBQUUsSUFBSSxDQUFDakIsUUFBUSxFQUFFaUssT0FBTyxJQUFJO1FBQ2hDMUosTUFBTSxDQUFDc1AsYUFBYSxDQUFFNUYsT0FBTyxDQUFDcUcsU0FBUyxDQUFDLENBQUUsQ0FBQztNQUM3QyxDQUFFLENBQUM7TUFDSCxJQUFJLENBQUM5UCxPQUFPLEdBQUdELE1BQU07SUFDdkI7SUFDQSxPQUFPLElBQUksQ0FBQ0MsT0FBTztFQUNyQjtFQUVBLElBQVdELE1BQU1BLENBQUEsRUFBWTtJQUFFLE9BQU8sSUFBSSxDQUFDK1AsU0FBUyxDQUFDLENBQUM7RUFBRTs7RUFFeEQ7QUFDRjtBQUNBO0FBQ0E7RUFDU0MsZ0JBQWdCQSxDQUFFZCxVQUFzQixFQUFZO0lBRXpEO0lBQ0E7SUFDQSxJQUFJZSx1QkFBdUIsR0FBRyxJQUFJO0lBQ2xDLEtBQU0sSUFBSTNQLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBRyxJQUFJLENBQUNiLFFBQVEsQ0FBQ2MsTUFBTSxFQUFFRCxDQUFDLEVBQUUsRUFBRztNQUMvQyxNQUFNb0osT0FBTyxHQUFHLElBQUksQ0FBQ2pLLFFBQVEsQ0FBRWEsQ0FBQyxDQUFFOztNQUVsQztNQUNBO01BQ0EsSUFBS29KLE9BQU8sQ0FBQzRCLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQzVCLE9BQU8sQ0FBQ2dDLFFBQVEsQ0FBQyxDQUFDLEVBQUc7UUFDakR1RSx1QkFBdUIsR0FBRyxLQUFLO1FBQy9CO01BQ0Y7TUFDQSxLQUFNLElBQUlDLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR3hHLE9BQU8sQ0FBQzZCLFFBQVEsQ0FBQ2hMLE1BQU0sRUFBRTJQLENBQUMsRUFBRSxFQUFHO1FBQ2xELE1BQU05SyxPQUFPLEdBQUdzRSxPQUFPLENBQUM2QixRQUFRLENBQUUyRSxDQUFDLENBQUU7UUFDckMsSUFBSyxDQUFDOUssT0FBTyxDQUFDNkssdUJBQXVCLENBQUMsQ0FBQyxFQUFHO1VBQ3hDQSx1QkFBdUIsR0FBRyxLQUFLO1VBQy9CO1FBQ0Y7TUFDRjtJQUNGO0lBRUEsSUFBS0EsdUJBQXVCLEVBQUc7TUFDN0IsT0FBTyxJQUFJLENBQUNqUSxNQUFNLENBQUNtUSxPQUFPLENBQUVqQixVQUFVLENBQUNrQixTQUFTLEdBQUcsQ0FBRSxDQUFDO0lBQ3hELENBQUMsTUFDSTtNQUNILE1BQU1wUSxNQUFNLEdBQUcsSUFBSSxDQUFDQSxNQUFNLENBQUNaLElBQUksQ0FBQyxDQUFDO01BQ2pDLEtBQU0sSUFBSWtCLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBRyxJQUFJLENBQUNiLFFBQVEsQ0FBQ2MsTUFBTSxFQUFFRCxDQUFDLEVBQUUsRUFBRztRQUMvQyxNQUFNYixRQUFRLEdBQUcsSUFBSSxDQUFDQSxRQUFRLENBQUVhLENBQUMsQ0FBRSxDQUFDK08sT0FBTyxDQUFFSCxVQUFXLENBQUM7UUFDekQsS0FBTSxJQUFJZ0IsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHelEsUUFBUSxDQUFDYyxNQUFNLEVBQUUyUCxDQUFDLEVBQUUsRUFBRztVQUMxQ2xRLE1BQU0sQ0FBQ3NQLGFBQWEsQ0FBRTdQLFFBQVEsQ0FBRXlRLENBQUMsQ0FBRSxDQUFDbFEsTUFBTyxDQUFDO1FBQzlDO01BQ0Y7TUFDQSxPQUFPQSxNQUFNO0lBQ2Y7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NxUSxzQkFBc0JBLENBQUEsRUFBVTtJQUNyQyxPQUFPcFMsS0FBSyxDQUFDcVMsZUFBZSxDQUFFLElBQUssQ0FBQztFQUN0QztFQUVPQyxzQkFBc0JBLENBQUUzRSxNQUFlLEVBQUVzRCxVQUF1QixFQUFZO0lBQ2pGLE1BQU1sUCxNQUFNLEdBQUd4QyxPQUFPLENBQUN1TyxPQUFPLENBQUMzTSxJQUFJLENBQUMsQ0FBQztJQUVyQyxNQUFNcU8sV0FBVyxHQUFHLElBQUksQ0FBQ2hPLFFBQVEsQ0FBQ2MsTUFBTTtJQUN4QyxLQUFNLElBQUlELENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR21OLFdBQVcsRUFBRW5OLENBQUMsRUFBRSxFQUFHO01BQ3RDLE1BQU1vSixPQUFPLEdBQUcsSUFBSSxDQUFDakssUUFBUSxDQUFFYSxDQUFDLENBQUU7TUFDbENOLE1BQU0sQ0FBQ3NQLGFBQWEsQ0FBRTVGLE9BQU8sQ0FBQzZHLHNCQUFzQixDQUFFM0UsTUFBTyxDQUFFLENBQUM7SUFDbEU7SUFFQSxJQUFLc0QsVUFBVSxFQUFHO01BQ2hCbFAsTUFBTSxDQUFDc1AsYUFBYSxDQUFFLElBQUksQ0FBQ0wsZUFBZSxDQUFFQyxVQUFXLENBQUMsQ0FBQ3FCLHNCQUFzQixDQUFFM0UsTUFBTyxDQUFFLENBQUM7SUFDN0Y7SUFFQSxPQUFPNUwsTUFBTTtFQUNmOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1N3USxrQkFBa0JBLENBQUVDLFVBQWtCLEVBQVc7SUFDdEQsTUFBTTVSLENBQUMsR0FBRyxJQUFJLENBQUNtQixNQUFNLENBQUN1TyxJQUFJO0lBQzFCLE1BQU16UCxDQUFDLEdBQUcsSUFBSSxDQUFDa0IsTUFBTSxDQUFDd08sSUFBSTtJQUMxQixNQUFNaEYsS0FBSyxHQUFHLElBQUksQ0FBQ3hKLE1BQU0sQ0FBQ3dKLEtBQUs7SUFDL0IsTUFBTUMsTUFBTSxHQUFHLElBQUksQ0FBQ3pKLE1BQU0sQ0FBQ3lKLE1BQU07SUFFakMsTUFBTWlILGFBQWEsR0FBR2xILEtBQUssR0FBR0MsTUFBTTtJQUNwQyxJQUFJcUQsS0FBSyxHQUFHLENBQUM7SUFDYixNQUFNMUwsS0FBSyxHQUFHLElBQUl6RCxPQUFPLENBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztJQUNqQyxLQUFNLElBQUkyQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdtUSxVQUFVLEVBQUVuUSxDQUFDLEVBQUUsRUFBRztNQUNyQ2MsS0FBSyxDQUFDdkMsQ0FBQyxHQUFHQSxDQUFDLEdBQUdKLFlBQVksQ0FBQyxDQUFDLEdBQUcrSyxLQUFLO01BQ3BDcEksS0FBSyxDQUFDdEMsQ0FBQyxHQUFHQSxDQUFDLEdBQUdMLFlBQVksQ0FBQyxDQUFDLEdBQUdnTCxNQUFNO01BQ3JDLElBQUssSUFBSSxDQUFDbUQsYUFBYSxDQUFFeEwsS0FBTSxDQUFDLEVBQUc7UUFDakMwTCxLQUFLLEVBQUU7TUFDVDtJQUNGO0lBQ0EsT0FBTzRELGFBQWEsR0FBRzVELEtBQUssR0FBRzJELFVBQVU7RUFDM0M7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNTRSxxQkFBcUJBLENBQUEsRUFBVztJQUNyQztJQUNBLE9BQU9qUyxJQUFJLENBQUNrUyxHQUFHLENBQUVuUSxDQUFDLENBQUNvUSxHQUFHLENBQUUsSUFBSSxDQUFDcFIsUUFBUSxDQUFDdUwsR0FBRyxDQUFFdEIsT0FBTyxJQUFJakosQ0FBQyxDQUFDb1EsR0FBRyxDQUFFbkgsT0FBTyxDQUFDb0gsZUFBZSxDQUFDLENBQUMsQ0FBQzlGLEdBQUcsQ0FBRTVGLE9BQU8sSUFBSUEsT0FBTyxDQUFDMkwscUJBQXFCLENBQUMsQ0FBRSxDQUFFLENBQUUsQ0FBRSxDQUFFLENBQUM7RUFDbEo7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NDLE9BQU9BLENBQUEsRUFBVztJQUN2QixPQUFPLElBQUksQ0FBQ1gsc0JBQXNCLENBQUMsQ0FBQyxDQUFDTSxxQkFBcUIsQ0FBQyxDQUFDO0VBQzlEOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTTSxzQkFBc0JBLENBQUVSLFVBQWtCLEVBQVk7SUFDM0QsTUFBTTVSLENBQUMsR0FBRyxJQUFJLENBQUNtQixNQUFNLENBQUN1TyxJQUFJO0lBQzFCLE1BQU16UCxDQUFDLEdBQUcsSUFBSSxDQUFDa0IsTUFBTSxDQUFDd08sSUFBSTtJQUMxQixNQUFNaEYsS0FBSyxHQUFHLElBQUksQ0FBQ3hKLE1BQU0sQ0FBQ3dKLEtBQUs7SUFDL0IsTUFBTUMsTUFBTSxHQUFHLElBQUksQ0FBQ3pKLE1BQU0sQ0FBQ3lKLE1BQU07SUFFakMsSUFBSXFELEtBQUssR0FBRyxDQUFDO0lBQ2IsTUFBTStELEdBQUcsR0FBRyxJQUFJbFQsT0FBTyxDQUFFLENBQUMsRUFBRSxDQUFFLENBQUM7SUFDL0IsTUFBTXlELEtBQUssR0FBRyxJQUFJekQsT0FBTyxDQUFFLENBQUMsRUFBRSxDQUFFLENBQUM7SUFDakMsS0FBTSxJQUFJMkMsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHbVEsVUFBVSxFQUFFblEsQ0FBQyxFQUFFLEVBQUc7TUFDckNjLEtBQUssQ0FBQ3ZDLENBQUMsR0FBR0EsQ0FBQyxHQUFHSixZQUFZLENBQUMsQ0FBQyxHQUFHK0ssS0FBSztNQUNwQ3BJLEtBQUssQ0FBQ3RDLENBQUMsR0FBR0EsQ0FBQyxHQUFHTCxZQUFZLENBQUMsQ0FBQyxHQUFHZ0wsTUFBTTtNQUNyQyxJQUFLLElBQUksQ0FBQ21ELGFBQWEsQ0FBRXhMLEtBQU0sQ0FBQyxFQUFHO1FBQ2pDeVAsR0FBRyxDQUFDdFIsR0FBRyxDQUFFNkIsS0FBTSxDQUFDO1FBQ2hCMEwsS0FBSyxFQUFFO01BQ1Q7SUFDRjtJQUNBLE9BQU8rRCxHQUFHLENBQUN6SSxhQUFhLENBQUUwRSxLQUFNLENBQUM7RUFDbkM7O0VBRUE7QUFDRjtBQUNBO0VBQ1NvRSxnQkFBZ0JBLENBQUU5UCxLQUFjLEVBQTJCO0lBQ2hFLE9BQU8vQyxPQUFPLENBQUM4UywwQkFBMEIsQ0FBRTFRLENBQUMsQ0FBQ29QLE9BQU8sQ0FBRSxJQUFJLENBQUNwUSxRQUFRLENBQUN1TCxHQUFHLENBQUV0QixPQUFPLElBQUlBLE9BQU8sQ0FBQ3dILGdCQUFnQixDQUFFOVAsS0FBTSxDQUFFLENBQUUsQ0FBRSxDQUFDO0VBQzdIOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0VBQ1NnUSxlQUFlQSxDQUFFaFEsS0FBYyxFQUFZO0lBQ2hELE9BQU8sSUFBSSxDQUFDOFAsZ0JBQWdCLENBQUU5UCxLQUFNLENBQUMsQ0FBRSxDQUFDLENBQUUsQ0FBQ2lRLFlBQVk7RUFDekQ7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNTQyxnQkFBZ0JBLENBQUEsRUFBUztJQUM5QixJQUFJLENBQUM1UixtQkFBbUIsR0FBRyxJQUFJO0lBRS9CLE1BQU0rTixXQUFXLEdBQUcsSUFBSSxDQUFDaE8sUUFBUSxDQUFDYyxNQUFNO0lBQ3hDLEtBQU0sSUFBSUQsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHbU4sV0FBVyxFQUFFbk4sQ0FBQyxFQUFFLEVBQUc7TUFDdEMsSUFBSSxDQUFDYixRQUFRLENBQUVhLENBQUMsQ0FBRSxDQUFDZ1IsZ0JBQWdCLENBQUMsQ0FBQztJQUN2QztJQUVBLElBQUksQ0FBQzVSLG1CQUFtQixHQUFHLEtBQUs7SUFDaEMsSUFBSSxDQUFDVSxVQUFVLENBQUMsQ0FBQztFQUNuQjtFQUVPbVIsUUFBUUEsQ0FBQSxFQUFXO0lBQ3hCO0lBQ0EsT0FBUSx5QkFBd0IsSUFBSSxDQUFDbkcsVUFBVSxDQUFDLENBQUUsS0FBSTtFQUN4RDs7RUFFQTtBQUNGO0FBQ0E7O0VBRVVoTCxVQUFVQSxDQUFBLEVBQVM7SUFDekJTLE1BQU0sSUFBSUEsTUFBTSxDQUFFLENBQUMsSUFBSSxDQUFDbEIsVUFBVSxFQUFFLHNDQUF1QyxDQUFDO0lBRTVFLElBQUssQ0FBQyxJQUFJLENBQUNELG1CQUFtQixFQUFHO01BQy9CLElBQUksQ0FBQ08sT0FBTyxHQUFHLElBQUk7TUFFbkIsSUFBSSxDQUFDMEgsMkJBQTJCLENBQUMsQ0FBQztJQUNwQztFQUNGOztFQUVBO0FBQ0Y7QUFDQTtFQUNVQSwyQkFBMkJBLENBQUEsRUFBUztJQUMxQyxJQUFJLENBQUMvSCxrQkFBa0IsQ0FBQzRSLElBQUksQ0FBQyxDQUFDO0VBQ2hDO0VBRVEvTyxtQkFBbUJBLENBQUUyQyxPQUFnQixFQUFTO0lBQ3BELElBQUksQ0FBQy9DLGNBQWMsQ0FBQyxDQUFDLENBQUNvUCxVQUFVLENBQUVyTSxPQUFRLENBQUM7SUFDM0MsSUFBSSxDQUFDaEYsVUFBVSxDQUFDLENBQUM7RUFDbkI7O0VBRUE7QUFDRjtBQUNBO0VBQ1VzQyxNQUFNQSxDQUFFdEIsS0FBYyxFQUFTO0lBQ3JDLElBQUssQ0FBQyxJQUFJLENBQUNlLFdBQVcsQ0FBQyxDQUFDLEVBQUc7TUFDekIsSUFBSSxDQUFDM0IsVUFBVSxDQUFFLElBQUlsQyxPQUFPLENBQUMsQ0FBRSxDQUFDO01BQ2hDLElBQUksQ0FBQytELGNBQWMsQ0FBQyxDQUFDLENBQUNQLFFBQVEsQ0FBRVYsS0FBTSxDQUFDO0lBQ3pDO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0VBQ1VaLFVBQVVBLENBQUVrSixPQUFnQixFQUFTO0lBQzNDLElBQUksQ0FBQ2pLLFFBQVEsQ0FBQytQLElBQUksQ0FBRTlGLE9BQVEsQ0FBQzs7SUFFN0I7SUFDQUEsT0FBTyxDQUFDOUosa0JBQWtCLENBQUM4UixXQUFXLENBQUUsSUFBSSxDQUFDdlIsbUJBQW9CLENBQUM7SUFFbEUsSUFBSSxDQUFDQyxVQUFVLENBQUMsQ0FBQztJQUVqQixPQUFPLElBQUksQ0FBQyxDQUFDO0VBQ2Y7O0VBRUE7QUFDRjtBQUNBO0VBQ1UrQixXQUFXQSxDQUFBLEVBQVk7SUFDN0IsT0FBTyxJQUFJLENBQUMxQyxRQUFRLENBQUNjLE1BQU0sR0FBRyxDQUFDO0VBQ2pDOztFQUVBO0FBQ0Y7QUFDQTtFQUNVOEIsY0FBY0EsQ0FBQSxFQUFZO0lBQ2hDeEIsTUFBTSxJQUFJQSxNQUFNLENBQUUsSUFBSSxDQUFDc0IsV0FBVyxDQUFDLENBQUMsRUFBRSw0Q0FBNkMsQ0FBQztJQUVwRixPQUFPMUIsQ0FBQyxDQUFDa1IsSUFBSSxDQUFFLElBQUksQ0FBQ2xTLFFBQVMsQ0FBQztFQUNoQzs7RUFFQTtBQUNGO0FBQ0E7RUFDUzZDLFlBQVlBLENBQUEsRUFBWTtJQUM3QnpCLE1BQU0sSUFBSUEsTUFBTSxDQUFFLElBQUksQ0FBQ3NCLFdBQVcsQ0FBQyxDQUFDLEVBQUUsNENBQTZDLENBQUM7SUFDcEZ0QixNQUFNLElBQUlBLE1BQU0sQ0FBRSxJQUFJLENBQUN3QixjQUFjLENBQUMsQ0FBQyxDQUFDQyxZQUFZLENBQUMsQ0FBQyxFQUFFLDZCQUE4QixDQUFDO0lBQ3ZGLE9BQU8sSUFBSSxDQUFDRCxjQUFjLENBQUMsQ0FBQyxDQUFDQyxZQUFZLENBQUMsQ0FBQztFQUM3Qzs7RUFFQTtBQUNGO0FBQ0E7RUFDVXNQLGNBQWNBLENBQUEsRUFBbUI7SUFDdkMsSUFBSyxDQUFDLElBQUksQ0FBQ3pQLFdBQVcsQ0FBQyxDQUFDLEVBQUc7TUFBRSxPQUFPLElBQUk7SUFBRTtJQUUxQyxNQUFNdUgsT0FBTyxHQUFHLElBQUksQ0FBQ3JILGNBQWMsQ0FBQyxDQUFDO0lBQ3JDLElBQUssQ0FBQ3FILE9BQU8sQ0FBQzRCLFVBQVUsQ0FBQyxDQUFDLEVBQUc7TUFBRSxPQUFPLElBQUk7SUFBRTtJQUU1QyxPQUFPNUIsT0FBTyxDQUFDa0ksY0FBYyxDQUFDLENBQUM7RUFDakM7O0VBRUE7QUFDRjtBQUNBO0VBQ1U3TSw4QkFBOEJBLENBQUEsRUFBWTtJQUNoRCxNQUFNOE0sU0FBUyxHQUFHLElBQUksQ0FBQ3ZQLFlBQVksQ0FBQyxDQUFDO0lBRXJDLElBQUssSUFBSSxDQUFDekMseUJBQXlCLEVBQUc7TUFDcEMsT0FBT2dTLFNBQVMsQ0FBQ2hRLElBQUksQ0FBRWdRLFNBQVMsQ0FBQ2xPLEtBQUssQ0FBRSxJQUFJLENBQUM5RCx5QkFBMEIsQ0FBRSxDQUFDO0lBQzVFLENBQUMsTUFDSTtNQUNILE9BQU9nUyxTQUFTO0lBQ2xCO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0VBQ1U3TCwwQkFBMEJBLENBQUEsRUFBWTtJQUM1QyxNQUFNNkwsU0FBUyxHQUFHLElBQUksQ0FBQ3ZQLFlBQVksQ0FBQyxDQUFDO0lBRXJDLElBQUssSUFBSSxDQUFDeEMscUJBQXFCLEVBQUc7TUFDaEMsT0FBTytSLFNBQVMsQ0FBQ2hRLElBQUksQ0FBRWdRLFNBQVMsQ0FBQ2xPLEtBQUssQ0FBRSxJQUFJLENBQUM3RCxxQkFBc0IsQ0FBRSxDQUFDO0lBQ3hFLENBQUMsTUFDSTtNQUNILE9BQU8rUixTQUFTO0lBQ2xCO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0VBQ1VqUSxnQkFBZ0JBLENBQUEsRUFBWTtJQUNsQyxJQUFJa1EsTUFBTSxHQUFHblUsT0FBTyxDQUFDb1UsSUFBSTtJQUV6QixJQUFLLElBQUksQ0FBQzVQLFdBQVcsQ0FBQyxDQUFDLEVBQUc7TUFDeEIsTUFBTXVILE9BQU8sR0FBRyxJQUFJLENBQUNySCxjQUFjLENBQUMsQ0FBQztNQUNyQyxJQUFLcUgsT0FBTyxDQUFDQyxNQUFNLENBQUNwSixNQUFNLEVBQUc7UUFDM0J1UixNQUFNLEdBQUdwSSxPQUFPLENBQUNwSCxZQUFZLENBQUMsQ0FBQztNQUNqQztJQUNGO0lBRUEsT0FBT3dQLE1BQU07RUFDZjs7RUFFQTtBQUNGO0FBQ0E7RUFDU0UsVUFBVUEsQ0FBRUMsS0FBWSxFQUFVO0lBQ3ZDLE9BQU9oVSxLQUFLLENBQUNpVSxZQUFZLENBQUUsSUFBSSxFQUFFRCxLQUFLLEVBQUVoVSxLQUFLLENBQUNrVSxvQkFBcUIsQ0FBQztFQUN0RTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtFQUNTQyxpQkFBaUJBLENBQUVILEtBQVksRUFBVTtJQUM5QyxPQUFPaFUsS0FBSyxDQUFDaVUsWUFBWSxDQUFFLElBQUksRUFBRUQsS0FBSyxFQUFFaFUsS0FBSyxDQUFDb1UsMkJBQTRCLENBQUM7RUFDN0U7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7RUFDU0MsZUFBZUEsQ0FBRUwsS0FBWSxFQUFVO0lBQzVDLE9BQU9oVSxLQUFLLENBQUNpVSxZQUFZLENBQUUsSUFBSSxFQUFFRCxLQUFLLEVBQUVoVSxLQUFLLENBQUNzVSx5QkFBMEIsQ0FBQztFQUMzRTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtFQUNTQyxRQUFRQSxDQUFFUCxLQUFZLEVBQVU7SUFDckMsT0FBT2hVLEtBQUssQ0FBQ2lVLFlBQVksQ0FBRSxJQUFJLEVBQUVELEtBQUssRUFBRWhVLEtBQUssQ0FBQ3dVLGtCQUFtQixDQUFDO0VBQ3BFOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDU0MsU0FBU0EsQ0FBRVQsS0FBWSxFQUFFdkgsT0FBMkYsRUFBVTtJQUNuSSxPQUFPek0sS0FBSyxDQUFDMFUsU0FBUyxDQUFFVixLQUFLLEVBQUUsSUFBSSxFQUFFdkgsT0FBUSxDQUFDO0VBQ2hEOztFQUVBO0FBQ0Y7QUFDQTtFQUNTa0ksWUFBWUEsQ0FBRXpHLGVBQXdCLEVBQUVDLFlBQXFCLEVBQUVGLFNBQWtCLEVBQVc7SUFDakcsSUFBSTNMLE1BQU0sR0FBRyxDQUFDO0lBQ2QsS0FBTSxJQUFJRCxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUcsSUFBSSxDQUFDYixRQUFRLENBQUNjLE1BQU0sRUFBRUQsQ0FBQyxFQUFFLEVBQUc7TUFDL0NDLE1BQU0sSUFBSSxJQUFJLENBQUNkLFFBQVEsQ0FBRWEsQ0FBQyxDQUFFLENBQUNzUyxZQUFZLENBQUV6RyxlQUFlLEVBQUVDLFlBQVksRUFBRUYsU0FBVSxDQUFDO0lBQ3ZGO0lBQ0EsT0FBTzNMLE1BQU07RUFDZjs7RUFFQTtBQUNGO0FBQ0E7RUFDU3NTLFNBQVNBLENBQUEsRUFBb0I7SUFDbEMsT0FBTztNQUNMQyxJQUFJLEVBQUUsT0FBTztNQUNiclQsUUFBUSxFQUFFLElBQUksQ0FBQ0EsUUFBUSxDQUFDdUwsR0FBRyxDQUFFdEIsT0FBTyxJQUFJQSxPQUFPLENBQUNtSixTQUFTLENBQUMsQ0FBRTtJQUM5RCxDQUFDO0VBQ0g7O0VBRUE7QUFDRjtBQUNBO0VBQ0UsT0FBY0UsV0FBV0EsQ0FBRUMsR0FBb0IsRUFBVTtJQUN2RG5TLE1BQU0sSUFBSUEsTUFBTSxDQUFFbVMsR0FBRyxDQUFDRixJQUFJLEtBQUssT0FBUSxDQUFDO0lBRXhDLE9BQU8sSUFBSXRULEtBQUssQ0FBRXdULEdBQUcsQ0FBQ3ZULFFBQVEsQ0FBQ3VMLEdBQUcsQ0FBRTFNLE9BQU8sQ0FBQ3lVLFdBQVksQ0FBRSxDQUFDO0VBQzdEOztFQUVBO0FBQ0Y7QUFDQTtFQUNFLE9BQWNFLFNBQVNBLENBQUVwVSxDQUFTLEVBQUVDLENBQVMsRUFBRTBLLEtBQWEsRUFBRUMsTUFBYyxFQUFVO0lBQ3BGLE9BQU8sSUFBSWpLLEtBQUssQ0FBQyxDQUFDLENBQUMrSixJQUFJLENBQUUxSyxDQUFDLEVBQUVDLENBQUMsRUFBRTBLLEtBQUssRUFBRUMsTUFBTyxDQUFDO0VBQ2hEO0VBQ0EsT0FBY0YsSUFBSSxHQUFHL0osS0FBSyxDQUFDeVQsU0FBUzs7RUFFcEM7QUFDRjtBQUNBO0VBQ0UsT0FBY25KLFNBQVNBLENBQUVqTCxDQUFTLEVBQUVDLENBQVMsRUFBRTBLLEtBQWEsRUFBRUMsTUFBYyxFQUFFTSxJQUFZLEVBQUVDLElBQVksRUFBVTtJQUNoSCxPQUFPLElBQUl4SyxLQUFLLENBQUMsQ0FBQyxDQUFDc0ssU0FBUyxDQUFFakwsQ0FBQyxFQUFFQyxDQUFDLEVBQUUwSyxLQUFLLEVBQUVDLE1BQU0sRUFBRU0sSUFBSSxFQUFFQyxJQUFLLENBQUM7RUFDakU7RUFDQSxPQUFja0osY0FBYyxHQUFHMVQsS0FBSyxDQUFDc0ssU0FBUzs7RUFFOUM7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFjcUoseUJBQXlCQSxDQUFFdFUsQ0FBUyxFQUFFQyxDQUFTLEVBQUUwSyxLQUFhLEVBQUVDLE1BQWMsRUFBRTJKLFdBQXlDLEVBQVU7SUFFL0k7SUFDQSxJQUFJQyxhQUFhLEdBQUdELFdBQVcsSUFBSUEsV0FBVyxDQUFDRSxPQUFPLElBQUksQ0FBQztJQUMzRCxJQUFJQyxjQUFjLEdBQUdILFdBQVcsSUFBSUEsV0FBVyxDQUFDSSxRQUFRLElBQUksQ0FBQztJQUM3RCxJQUFJQyxnQkFBZ0IsR0FBR0wsV0FBVyxJQUFJQSxXQUFXLENBQUNNLFVBQVUsSUFBSSxDQUFDO0lBQ2pFLElBQUlDLGlCQUFpQixHQUFHUCxXQUFXLElBQUlBLFdBQVcsQ0FBQ1EsV0FBVyxJQUFJLENBQUM7O0lBRW5FO0lBQ0EvUyxNQUFNLElBQUlBLE1BQU0sQ0FBRVUsUUFBUSxDQUFFMUMsQ0FBRSxDQUFDLEVBQUUsY0FBZSxDQUFDO0lBQ2pEZ0MsTUFBTSxJQUFJQSxNQUFNLENBQUVVLFFBQVEsQ0FBRXpDLENBQUUsQ0FBQyxFQUFFLGNBQWUsQ0FBQztJQUNqRCtCLE1BQU0sSUFBSUEsTUFBTSxDQUFFMkksS0FBSyxJQUFJLENBQUMsSUFBSWpJLFFBQVEsQ0FBRWlJLEtBQU0sQ0FBQyxFQUFFLDhCQUErQixDQUFDO0lBQ25GM0ksTUFBTSxJQUFJQSxNQUFNLENBQUU0SSxNQUFNLElBQUksQ0FBQyxJQUFJbEksUUFBUSxDQUFFa0ksTUFBTyxDQUFDLEVBQUUsK0JBQWdDLENBQUM7SUFDdEY1SSxNQUFNLElBQUlBLE1BQU0sQ0FBRXdTLGFBQWEsSUFBSSxDQUFDLElBQUk5UixRQUFRLENBQUU4UixhQUFjLENBQUMsRUFDL0QsaUJBQWtCLENBQUM7SUFDckJ4UyxNQUFNLElBQUlBLE1BQU0sQ0FBRTBTLGNBQWMsSUFBSSxDQUFDLElBQUloUyxRQUFRLENBQUVnUyxjQUFlLENBQUMsRUFDakUsa0JBQW1CLENBQUM7SUFDdEIxUyxNQUFNLElBQUlBLE1BQU0sQ0FBRTRTLGdCQUFnQixJQUFJLENBQUMsSUFBSWxTLFFBQVEsQ0FBRWtTLGdCQUFpQixDQUFDLEVBQ3JFLG9CQUFxQixDQUFDO0lBQ3hCNVMsTUFBTSxJQUFJQSxNQUFNLENBQUU4UyxpQkFBaUIsSUFBSSxDQUFDLElBQUlwUyxRQUFRLENBQUVvUyxpQkFBa0IsQ0FBQyxFQUN2RSxxQkFBc0IsQ0FBQzs7SUFFekI7SUFDQTtJQUNBLE1BQU1FLE1BQU0sR0FBR1IsYUFBYSxHQUFHRSxjQUFjO0lBQzdDLElBQUtNLE1BQU0sR0FBR3JLLEtBQUssSUFBSXFLLE1BQU0sR0FBRyxDQUFDLEVBQUc7TUFFbENSLGFBQWEsR0FBR0EsYUFBYSxHQUFHUSxNQUFNLEdBQUdySyxLQUFLO01BQzlDK0osY0FBYyxHQUFHQSxjQUFjLEdBQUdNLE1BQU0sR0FBR3JLLEtBQUs7SUFDbEQ7SUFDQSxNQUFNc0ssU0FBUyxHQUFHTCxnQkFBZ0IsR0FBR0UsaUJBQWlCO0lBQ3RELElBQUtHLFNBQVMsR0FBR3RLLEtBQUssSUFBSXNLLFNBQVMsR0FBRyxDQUFDLEVBQUc7TUFFeENMLGdCQUFnQixHQUFHQSxnQkFBZ0IsR0FBR0ssU0FBUyxHQUFHdEssS0FBSztNQUN2RG1LLGlCQUFpQixHQUFHQSxpQkFBaUIsR0FBR0csU0FBUyxHQUFHdEssS0FBSztJQUMzRDtJQUNBLE1BQU11SyxPQUFPLEdBQUdWLGFBQWEsR0FBR0ksZ0JBQWdCO0lBQ2hELElBQUtNLE9BQU8sR0FBR3RLLE1BQU0sSUFBSXNLLE9BQU8sR0FBRyxDQUFDLEVBQUc7TUFFckNWLGFBQWEsR0FBR0EsYUFBYSxHQUFHVSxPQUFPLEdBQUd0SyxNQUFNO01BQ2hEZ0ssZ0JBQWdCLEdBQUdBLGdCQUFnQixHQUFHTSxPQUFPLEdBQUd0SyxNQUFNO0lBQ3hEO0lBQ0EsTUFBTXVLLFFBQVEsR0FBR1QsY0FBYyxHQUFHSSxpQkFBaUI7SUFDbkQsSUFBS0ssUUFBUSxHQUFHdkssTUFBTSxJQUFJdUssUUFBUSxHQUFHLENBQUMsRUFBRztNQUN2Q1QsY0FBYyxHQUFHQSxjQUFjLEdBQUdTLFFBQVEsR0FBR3ZLLE1BQU07TUFDbkRrSyxpQkFBaUIsR0FBR0EsaUJBQWlCLEdBQUdLLFFBQVEsR0FBR3ZLLE1BQU07SUFDM0Q7O0lBRUE7SUFDQTVJLE1BQU0sSUFBSUEsTUFBTSxDQUFFd1MsYUFBYSxHQUFHRSxjQUFjLElBQUkvSixLQUFLLEVBQUUsNEJBQTZCLENBQUM7SUFDekYzSSxNQUFNLElBQUlBLE1BQU0sQ0FBRTRTLGdCQUFnQixHQUFHRSxpQkFBaUIsSUFBSW5LLEtBQUssRUFBRSwrQkFBZ0MsQ0FBQztJQUNsRzNJLE1BQU0sSUFBSUEsTUFBTSxDQUFFd1MsYUFBYSxHQUFHSSxnQkFBZ0IsSUFBSWhLLE1BQU0sRUFBRSw2QkFBOEIsQ0FBQztJQUM3RjVJLE1BQU0sSUFBSUEsTUFBTSxDQUFFMFMsY0FBYyxHQUFHSSxpQkFBaUIsSUFBSWxLLE1BQU0sRUFBRSw4QkFBK0IsQ0FBQztJQUVoRyxNQUFNd0ksS0FBSyxHQUFHLElBQUl6UyxLQUFLLENBQUMsQ0FBQztJQUN6QixNQUFNeVUsS0FBSyxHQUFHcFYsQ0FBQyxHQUFHMkssS0FBSztJQUN2QixNQUFNMEssTUFBTSxHQUFHcFYsQ0FBQyxHQUFHMkssTUFBTTs7SUFFekI7SUFDQTs7SUFFQSxJQUFLa0ssaUJBQWlCLEdBQUcsQ0FBQyxFQUFHO01BQzNCMUIsS0FBSyxDQUFDOUwsR0FBRyxDQUFFOE4sS0FBSyxHQUFHTixpQkFBaUIsRUFBRU8sTUFBTSxHQUFHUCxpQkFBaUIsRUFBRUEsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFalYsSUFBSSxDQUFDMEssRUFBRSxHQUFHLENBQUMsRUFBRSxLQUFNLENBQUM7SUFDOUcsQ0FBQyxNQUNJO01BQ0g2SSxLQUFLLENBQUMzUSxNQUFNLENBQUUyUyxLQUFLLEVBQUVDLE1BQU8sQ0FBQztJQUMvQjtJQUVBLElBQUtULGdCQUFnQixHQUFHLENBQUMsRUFBRztNQUMxQnhCLEtBQUssQ0FBQzlMLEdBQUcsQ0FBRXRILENBQUMsR0FBRzRVLGdCQUFnQixFQUFFUyxNQUFNLEdBQUdULGdCQUFnQixFQUFFQSxnQkFBZ0IsRUFBRS9VLElBQUksQ0FBQzBLLEVBQUUsR0FBRyxDQUFDLEVBQUUxSyxJQUFJLENBQUMwSyxFQUFFLEVBQUUsS0FBTSxDQUFDO0lBQzdHLENBQUMsTUFDSTtNQUNINkksS0FBSyxDQUFDbFEsTUFBTSxDQUFFbEQsQ0FBQyxFQUFFcVYsTUFBTyxDQUFDO0lBQzNCO0lBRUEsSUFBS2IsYUFBYSxHQUFHLENBQUMsRUFBRztNQUN2QnBCLEtBQUssQ0FBQzlMLEdBQUcsQ0FBRXRILENBQUMsR0FBR3dVLGFBQWEsRUFBRXZVLENBQUMsR0FBR3VVLGFBQWEsRUFBRUEsYUFBYSxFQUFFM1UsSUFBSSxDQUFDMEssRUFBRSxFQUFFLENBQUMsR0FBRzFLLElBQUksQ0FBQzBLLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBTSxDQUFDO0lBQ25HLENBQUMsTUFDSTtNQUNINkksS0FBSyxDQUFDbFEsTUFBTSxDQUFFbEQsQ0FBQyxFQUFFQyxDQUFFLENBQUM7SUFDdEI7SUFFQSxJQUFLeVUsY0FBYyxHQUFHLENBQUMsRUFBRztNQUN4QnRCLEtBQUssQ0FBQzlMLEdBQUcsQ0FBRThOLEtBQUssR0FBR1YsY0FBYyxFQUFFelUsQ0FBQyxHQUFHeVUsY0FBYyxFQUFFQSxjQUFjLEVBQUUsQ0FBQyxHQUFHN1UsSUFBSSxDQUFDMEssRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcxSyxJQUFJLENBQUMwSyxFQUFFLEVBQUUsS0FBTSxDQUFDO0lBQzlHLENBQUMsTUFDSTtNQUNINkksS0FBSyxDQUFDbFEsTUFBTSxDQUFFa1MsS0FBSyxFQUFFblYsQ0FBRSxDQUFDO0lBQzFCO0lBRUFtVCxLQUFLLENBQUM1SyxLQUFLLENBQUMsQ0FBQztJQUViLE9BQU80SyxLQUFLO0VBQ2Q7O0VBRUE7QUFDRjtBQUNBO0VBQ0UsT0FBY2tDLHFCQUFxQkEsQ0FBRW5VLE1BQWUsRUFBRW9VLE9BQXVCLEVBQUVDLEtBQTBCLEVBQVU7SUFDakgsTUFBTUMsWUFBWSxHQUFHdFUsTUFBTSxDQUFDdVUsV0FBVyxDQUFFSCxPQUFPLENBQUNJLElBQUksRUFBRUosT0FBTyxDQUFDSyxHQUFHLEVBQUVMLE9BQU8sQ0FBQ0gsS0FBSyxFQUFFRyxPQUFPLENBQUNGLE1BQU8sQ0FBQztJQUNuRyxPQUFPMVUsS0FBSyxDQUFDMlQseUJBQXlCLENBQUVtQixZQUFZLENBQUMvRixJQUFJLEVBQUUrRixZQUFZLENBQUM5RixJQUFJLEVBQUU4RixZQUFZLENBQUM5SyxLQUFLLEVBQUU4SyxZQUFZLENBQUM3SyxNQUFNLEVBQUU0SyxLQUFNLENBQUM7RUFDaEk7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7RUFDRSxPQUFjaEssT0FBT0EsQ0FBRUMsUUFBbUIsRUFBVTtJQUNsRCxPQUFPLElBQUk5SyxLQUFLLENBQUMsQ0FBQyxDQUFDNkssT0FBTyxDQUFFQyxRQUFTLENBQUM7RUFDeEM7O0VBRUE7QUFDRjtBQUNBO0VBQ0UsT0FBY3RLLE1BQU1BLENBQUVBLE1BQWUsRUFBVTtJQUM3QyxPQUFPLElBQUlSLEtBQUssQ0FBQyxDQUFDLENBQUMrSixJQUFJLENBQUV2SixNQUFNLENBQUN1TyxJQUFJLEVBQUV2TyxNQUFNLENBQUN3TyxJQUFJLEVBQUV4TyxNQUFNLENBQUMyTyxJQUFJLEdBQUczTyxNQUFNLENBQUN1TyxJQUFJLEVBQUV2TyxNQUFNLENBQUM0TyxJQUFJLEdBQUc1TyxNQUFNLENBQUN3TyxJQUFLLENBQUM7RUFDM0c7O0VBRUE7QUFDRjtBQUNBOztFQUdFLE9BQWNrRyxXQUFXQSxDQUFFQyxDQUFtQixFQUFFQyxDQUFtQixFQUFFQyxDQUFVLEVBQUVDLENBQVUsRUFBVTtJQUNuRyxJQUFLLE9BQU9ILENBQUMsS0FBSyxRQUFRLEVBQUc7TUFDM0IsT0FBTyxJQUFJblYsS0FBSyxDQUFDLENBQUMsQ0FBQzhCLE1BQU0sQ0FBRXFULENBQUMsRUFBRUMsQ0FBWSxDQUFDLENBQUM3UyxNQUFNLENBQUU4UyxDQUFDLEVBQUdDLENBQUcsQ0FBQztJQUM5RCxDQUFDLE1BQ0k7TUFDSDtNQUNBLE9BQU8sSUFBSXRWLEtBQUssQ0FBQyxDQUFDLENBQUNnQyxXQUFXLENBQUVtVCxDQUFFLENBQUMsQ0FBQzNTLFdBQVcsQ0FBRTRTLENBQWEsQ0FBQztJQUNqRTtFQUNGOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBY0csY0FBY0EsQ0FBRUMsS0FBYSxFQUFFMU8sTUFBYyxFQUFVO0lBQ25FLE1BQU0yTCxLQUFLLEdBQUcsSUFBSXpTLEtBQUssQ0FBQyxDQUFDO0lBQ3pCaUIsQ0FBQyxDQUFDQyxJQUFJLENBQUVELENBQUMsQ0FBQ3dVLEtBQUssQ0FBRUQsS0FBTSxDQUFDLEVBQUV4SixDQUFDLElBQUk7TUFDN0IsTUFBTXBLLEtBQUssR0FBR3pELE9BQU8sQ0FBQzhPLFdBQVcsQ0FBRW5HLE1BQU0sRUFBRSxDQUFDLEdBQUc1SCxJQUFJLENBQUMwSyxFQUFFLEdBQUdvQyxDQUFDLEdBQUd3SixLQUFNLENBQUM7TUFDbEV4SixDQUFDLEtBQUssQ0FBQyxHQUFLeUcsS0FBSyxDQUFDelEsV0FBVyxDQUFFSixLQUFNLENBQUMsR0FBRzZRLEtBQUssQ0FBQ2pRLFdBQVcsQ0FBRVosS0FBTSxDQUFDO0lBQ3ZFLENBQUUsQ0FBQztJQUNILE9BQU82USxLQUFLLENBQUM1SyxLQUFLLENBQUMsQ0FBQztFQUN0Qjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTs7RUFJRSxPQUFjZ0MsTUFBTUEsQ0FBRXNMLENBQW1CLEVBQUVDLENBQVUsRUFBRUMsQ0FBVSxFQUFVO0lBQ3pFLElBQUtELENBQUMsS0FBSzVULFNBQVMsRUFBRztNQUNyQjtNQUNBLE9BQU8sSUFBSXhCLEtBQUssQ0FBQyxDQUFDLENBQUM2SixNQUFNLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRXNMLENBQVksQ0FBQztJQUNoRDtJQUNBO0lBQ0EsT0FBTyxJQUFJblYsS0FBSyxDQUFDLENBQUMsQ0FBQzZKLE1BQU0sQ0FBRXNMLENBQUMsRUFBRUMsQ0FBQyxFQUFFQyxDQUFFLENBQUM7RUFDdEM7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7O0VBSUUsT0FBY3ZMLE9BQU9BLENBQUVxTCxDQUFtQixFQUFFQyxDQUFTLEVBQUVDLENBQVMsRUFBRUMsQ0FBVSxFQUFFSSxDQUFVLEVBQVU7SUFDaEc7SUFDQSxJQUFLSixDQUFDLEtBQUs5VCxTQUFTLEVBQUc7TUFDckI7TUFDQSxPQUFPLElBQUl4QixLQUFLLENBQUMsQ0FBQyxDQUFDOEosT0FBTyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUVxTCxDQUFDLEVBQVlDLENBQUMsRUFBRUMsQ0FBRSxDQUFDO0lBQ3ZEO0lBQ0E7SUFDQSxPQUFPLElBQUlyVixLQUFLLENBQUMsQ0FBQyxDQUFDOEosT0FBTyxDQUFFcUwsQ0FBQyxFQUFFQyxDQUFDLEVBQUVDLENBQUMsRUFBRUMsQ0FBQyxFQUFFSSxDQUFFLENBQUM7RUFDN0M7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7RUFHRSxPQUFjL08sR0FBR0EsQ0FBRXdPLENBQW1CLEVBQUVDLENBQVMsRUFBRUMsQ0FBUyxFQUFFQyxDQUFTLEVBQUVJLENBQW9CLEVBQUVDLENBQVcsRUFBVTtJQUNsSDtJQUNBLE9BQU8sSUFBSTNWLEtBQUssQ0FBQyxDQUFDLENBQUMyRyxHQUFHLENBQUV3TyxDQUFDLEVBQUVDLENBQUMsRUFBRUMsQ0FBQyxFQUFFQyxDQUFDLEVBQUVJLENBQUMsRUFBRUMsQ0FBRSxDQUFDO0VBQzVDOztFQUVBO0FBQ0Y7QUFDQTtFQUNFLE9BQWNySixLQUFLQSxDQUFFc0osTUFBZSxFQUFVO0lBQzVDLE9BQU9uWCxLQUFLLENBQUNvWCxZQUFZLENBQUVELE1BQU8sQ0FBQztFQUNyQzs7RUFFQTtBQUNGO0FBQ0E7RUFDRSxPQUFjOUgsWUFBWUEsQ0FBRThILE1BQWUsRUFBVTtJQUNuRCxPQUFPblgsS0FBSyxDQUFDcVgsbUJBQW1CLENBQUVGLE1BQU8sQ0FBQztFQUM1Qzs7RUFFQTtBQUNGO0FBQ0E7RUFDRSxPQUFjRyxHQUFHQSxDQUFFSCxNQUFlLEVBQVU7SUFDMUMsT0FBT25YLEtBQUssQ0FBQ3VYLFVBQVUsQ0FBRUosTUFBTyxDQUFDO0VBQ25DOztFQUVBO0FBQ0Y7QUFDQTtFQUNFLE9BQWM3SixRQUFRQSxDQUFFQSxRQUFtQixFQUFFa0ssTUFBZ0IsRUFBVTtJQUNyRSxJQUFLNVUsTUFBTSxFQUFHO01BQ1osS0FBTSxJQUFJUCxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdpTCxRQUFRLENBQUNoTCxNQUFNLEVBQUVELENBQUMsRUFBRSxFQUFHO1FBQzFDTyxNQUFNLENBQUUwSyxRQUFRLENBQUVqTCxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUNpQyxHQUFHLENBQUNtVCxhQUFhLENBQUVuSyxRQUFRLENBQUVqTCxDQUFDLENBQUUsQ0FBQzhCLEtBQUssRUFBRSxJQUFLLENBQUMsRUFBRSxzQkFBdUIsQ0FBQztNQUNwRztJQUNGO0lBRUEsT0FBTyxJQUFJNUMsS0FBSyxDQUFFLENBQUUsSUFBSWxCLE9BQU8sQ0FBRWlOLFFBQVEsRUFBRXZLLFNBQVMsRUFBRSxDQUFDLENBQUN5VSxNQUFPLENBQUMsQ0FBRyxDQUFDO0VBQ3RFO0FBQ0Y7QUFFQXZYLElBQUksQ0FBQ3lYLFFBQVEsQ0FBRSxPQUFPLEVBQUVuVyxLQUFNLENBQUM7QUFFL0IsZUFBZUEsS0FBSyIsImlnbm9yZUxpc3QiOltdfQ==