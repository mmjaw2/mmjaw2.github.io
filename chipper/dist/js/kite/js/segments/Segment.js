// Copyright 2013-2024, University of Colorado Boulder

/**
 * A segment represents a specific curve with a start and end.
 *
 * Each segment is treated parametrically, where t=0 is the start of the segment, and t=1 is the end. Values of t
 * between those represent points along the segment.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import TinyEmitter from '../../../axon/js/TinyEmitter.js';
import Bounds2 from '../../../dot/js/Bounds2.js';
import Utils from '../../../dot/js/Utils.js';
import Vector2 from '../../../dot/js/Vector2.js';
import optionize from '../../../phet-core/js/optionize.js';
import { Arc, BoundsIntersection, Cubic, EllipticalArc, kite, Line, Quadratic, SegmentIntersection, Shape, Subpath } from '../imports.js';

// null if no solution, true if every a,b pair is a solution, otherwise the single solution

export default class Segment {
  constructor() {
    this.invalidationEmitter = new TinyEmitter();
  }

  // The start point of the segment, parametrically at t=0.

  // The end point of the segment, parametrically at t=1.

  // The normalized tangent vector to the segment at its start point, pointing in the direction of motion (from start to
  // end).

  // The normalized tangent vector to the segment at its end point, pointing in the direction of motion (from start to
  // end).

  // The bounding box for the segment.

  // Returns the position parametrically, with 0 <= t <= 1. NOTE that this function doesn't keep a constant magnitude
  // tangent.

  // Returns the non-normalized tangent (dx/dt, dy/dt) of this segment at the parametric value of t, with 0 <= t <= 1.

  // Returns the signed curvature (positive for visual clockwise - mathematical counterclockwise)

  // Returns an array with up to 2 sub-segments, split at the parametric t value. The segments together should make the
  // same shape as the original segment.

  // Returns a string containing the SVG path. assumes that the start point is already provided, so anything that calls
  // this needs to put the M calls first

  // Returns an array of segments that will draw an offset curve on the logical left side

  // Returns an array of segments that will draw an offset curve on the logical right side

  // Returns the winding number for intersection with a ray

  // Returns a list of t values where dx/dt or dy/dt is 0 where 0 < t < 1. subdividing on these will result in monotonic
  // segments

  // Returns a list of intersections between the segment and the ray.

  // Returns a {Bounds2} representing the bounding box for the segment.

  // Returns signed area contribution for this segment using Green's Theorem

  // Returns a list of non-degenerate segments that are equivalent to this segment. Generally gets rid (or simplifies)
  // invalid or repeated segments.

  // Draws the segment to the 2D Canvas context, assuming the context's current location is already at the start point

  // Returns a new segment that represents this segment after transformation by the matrix

  /**
   * Will return true if the start/end tangents are purely vertical or horizontal. If all of the segments of a shape
   * have this property, then the only line joins will be a multiple of pi/2 (90 degrees), and so all of the types of
   * line joins will have the same bounds. This means that the stroked bounds will just be a pure dilation of the
   * regular bounds, by lineWidth / 2.
   */
  areStrokedBoundsDilated() {
    const epsilon = 0.0000001;

    // If the derivative at the start/end are pointing in a cardinal direction (north/south/east/west), then the
    // endpoints won't trigger non-dilated bounds, and the interior of the curve will not contribute.
    return Math.abs(this.startTangent.x * this.startTangent.y) < epsilon && Math.abs(this.endTangent.x * this.endTangent.y) < epsilon;
  }

  /**
   * TODO: override everywhere so this isn't necessary (it's not particularly efficient!) https://github.com/phetsims/kite/issues/76
   */
  getBoundsWithTransform(matrix) {
    const transformedSegment = this.transformed(matrix);
    return transformedSegment.getBounds();
  }

  /**
   * Extracts a slice of a segment, based on the parametric value.
   *
   * Given that this segment is represented by the interval [0,1]
   */
  slice(t0, t1) {
    assert && assert(t0 >= 0 && t0 <= 1 && t1 >= 0 && t1 <= 1, 'Parametric value out of range');
    assert && assert(t0 < t1);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let segment = this; // eslint-disable-line consistent-this
    if (t1 < 1) {
      segment = segment.subdivided(t1)[0];
    }
    if (t0 > 0) {
      segment = segment.subdivided(Utils.linear(0, t1, 0, 1, t0))[1];
    }
    return segment;
  }

  /**
   * @param tList - list of sorted t values from 0 <= t <= 1
   */
  subdivisions(tList) {
    // this could be solved by recursion, but we don't plan on the JS engine doing tail-call optimization

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let right = this; // eslint-disable-line consistent-this
    const result = [];
    for (let i = 0; i < tList.length; i++) {
      // assume binary subdivision
      const t = tList[i];
      const arr = right.subdivided(t);
      assert && assert(arr.length === 2);
      result.push(arr[0]);
      right = arr[1];

      // scale up the remaining t values
      for (let j = i + 1; j < tList.length; j++) {
        tList[j] = Utils.linear(t, 1, 0, 1, tList[j]);
      }
    }
    result.push(right);
    return result;
  }

  /**
   * Return an array of segments from breaking this segment into monotone pieces
   */
  subdividedIntoMonotone() {
    return this.subdivisions(this.getInteriorExtremaTs());
  }

  /**
   * Determines if the segment is sufficiently flat (given certain epsilon values)
   *
   * @param distanceEpsilon - controls level of subdivision by attempting to ensure a maximum (squared)
   *                          deviation from the curve
   * @param curveEpsilon - controls level of subdivision by attempting to ensure a maximum curvature change
   *                       between segments
   */
  isSufficientlyFlat(distanceEpsilon, curveEpsilon) {
    const start = this.start;
    const middle = this.positionAt(0.5);
    const end = this.end;
    return Segment.isSufficientlyFlat(distanceEpsilon, curveEpsilon, start, middle, end);
  }

  /**
   * Returns the (sometimes approximate) arc length of the segment.
   */
  getArcLength(distanceEpsilon, curveEpsilon, maxLevels) {
    distanceEpsilon = distanceEpsilon === undefined ? 1e-10 : distanceEpsilon;
    curveEpsilon = curveEpsilon === undefined ? 1e-8 : curveEpsilon;
    maxLevels = maxLevels === undefined ? 15 : maxLevels;
    if (maxLevels <= 0 || this.isSufficientlyFlat(distanceEpsilon, curveEpsilon)) {
      return this.start.distance(this.end);
    } else {
      const subdivided = this.subdivided(0.5);
      return subdivided[0].getArcLength(distanceEpsilon, curveEpsilon, maxLevels - 1) + subdivided[1].getArcLength(distanceEpsilon, curveEpsilon, maxLevels - 1);
    }
  }

  /**
   * Returns information about the line dash parametric offsets for a given segment.
   *
   * As always, this is fairly approximate depending on the type of segment.
   *
   * @param lineDash
   * @param lineDashOffset
   * @param distanceEpsilon - controls level of subdivision by attempting to ensure a maximum (squared)
   *                          deviation from the curve
   * @param curveEpsilon - controls level of subdivision by attempting to ensure a maximum curvature change
   *                       between segments
   */
  getDashValues(lineDash, lineDashOffset, distanceEpsilon, curveEpsilon) {
    assert && assert(lineDash.length > 0, 'Do not call with an empty dash array');

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const values = [];
    let arcLength = 0;

    // Do the offset modulo the sum, so that we don't have to cycle for a long time
    const lineDashSum = _.sum(lineDash);
    lineDashOffset = lineDashOffset % lineDashSum;

    // Ensure the lineDashOffset is positive
    if (lineDashOffset < 0) {
      lineDashOffset += lineDashSum;
    }

    // The current section of lineDash that we are in
    let dashIndex = 0;
    let dashOffset = 0;
    let isInside = true;
    function nextDashIndex() {
      dashIndex = (dashIndex + 1) % lineDash.length;
      isInside = !isInside;
    }

    // Burn off initial lineDashOffset
    while (lineDashOffset > 0) {
      if (lineDashOffset >= lineDash[dashIndex]) {
        lineDashOffset -= lineDash[dashIndex];
        nextDashIndex();
      } else {
        dashOffset = lineDashOffset;
        lineDashOffset = 0;
      }
    }
    const initiallyInside = isInside;

    // Recursively progress through until we have mostly-linear segments.
    (function recur(t0, t1, p0, p1, depth) {
      // Compute the t/position at the midpoint t value
      const tMid = (t0 + t1) / 2;
      const pMid = self.positionAt(tMid);

      // If it's flat enough (or we hit our recursion limit), process it
      if (depth > 14 || Segment.isSufficientlyFlat(distanceEpsilon, curveEpsilon, p0, pMid, p1)) {
        // Estimate length
        const totalLength = p0.distance(pMid) + pMid.distance(p1);
        arcLength += totalLength;

        // While we are longer than the remaining amount for the next dash change.
        let lengthLeft = totalLength;
        while (dashOffset + lengthLeft >= lineDash[dashIndex]) {
          // Compute the t (for now, based on the total length for ease)
          const t = Utils.linear(0, totalLength, t0, t1, totalLength - lengthLeft + lineDash[dashIndex] - dashOffset);

          // Record the dash change
          values.push(t);

          // Remove amount added from our lengthLeft (move to the dash)
          lengthLeft -= lineDash[dashIndex] - dashOffset;
          dashOffset = 0; // at the dash, we'll have 0 offset
          nextDashIndex();
        }

        // Spill-over, just add it
        dashOffset = dashOffset + lengthLeft;
      } else {
        recur(t0, tMid, p0, pMid, depth + 1);
        recur(tMid, t1, pMid, p1, depth + 1);
      }
    })(0, 1, this.start, this.end, 0);
    return {
      values: values,
      arcLength: arcLength,
      initiallyInside: initiallyInside
    };
  }

  /**
   *
   * @param [options]
   * @param [minLevels] -   how many levels to force subdivisions
   * @param [maxLevels] -   prevent subdivision past this level
   * @param [segments]
   * @param [start]
   * @param [end]
   */
  toPiecewiseLinearSegments(options, minLevels, maxLevels, segments, start, end) {
    // for the first call, initialize min/max levels from our options
    minLevels = minLevels === undefined ? options.minLevels : minLevels;
    maxLevels = maxLevels === undefined ? options.maxLevels : maxLevels;
    segments = segments || [];
    const pointMap = options.pointMap || _.identity;

    // points mapped by the (possibly-nonlinear) pointMap.
    start = start || pointMap(this.start);
    end = end || pointMap(this.end);
    const middle = pointMap(this.positionAt(0.5));
    assert && assert(minLevels <= maxLevels);
    assert && assert(options.distanceEpsilon === null || typeof options.distanceEpsilon === 'number');
    assert && assert(options.curveEpsilon === null || typeof options.curveEpsilon === 'number');
    assert && assert(!pointMap || typeof pointMap === 'function');

    // i.e. we will have finished = maxLevels === 0 || ( minLevels <= 0 && epsilonConstraints ), just didn't want to one-line it
    let finished = maxLevels === 0; // bail out once we reach our maximum number of subdivision levels
    if (!finished && minLevels <= 0) {
      // force subdivision if minLevels hasn't been reached
      finished = this.isSufficientlyFlat(options.distanceEpsilon === null || options.distanceEpsilon === undefined ? Number.POSITIVE_INFINITY : options.distanceEpsilon, options.curveEpsilon === null || options.curveEpsilon === undefined ? Number.POSITIVE_INFINITY : options.curveEpsilon);
    }
    if (finished) {
      segments.push(new Line(start, end));
    } else {
      const subdividedSegments = this.subdivided(0.5);
      subdividedSegments[0].toPiecewiseLinearSegments(options, minLevels - 1, maxLevels - 1, segments, start, middle);
      subdividedSegments[1].toPiecewiseLinearSegments(options, minLevels - 1, maxLevels - 1, segments, middle, end);
    }
    return segments;
  }

  /**
   * Returns a list of Line and/or Arc segments that approximates this segment.
   */
  toPiecewiseLinearOrArcSegments(providedOptions) {
    const options = optionize()({
      minLevels: 2,
      maxLevels: 7,
      curvatureThreshold: 0.02,
      errorThreshold: 10,
      errorPoints: [0.25, 0.75]
    }, providedOptions);
    const segments = [];
    this.toPiecewiseLinearOrArcRecursion(options, options.minLevels, options.maxLevels, segments, 0, 1, this.positionAt(0), this.positionAt(1), this.curvatureAt(0), this.curvatureAt(1));
    return segments;
  }

  /**
   * Helper function for toPiecewiseLinearOrArcSegments. - will push into segments
   */
  toPiecewiseLinearOrArcRecursion(options, minLevels, maxLevels, segments, startT, endT, startPoint, endPoint, startCurvature, endCurvature) {
    const middleT = (startT + endT) / 2;
    const middlePoint = this.positionAt(middleT);
    const middleCurvature = this.curvatureAt(middleT);
    if (maxLevels <= 0 || minLevels <= 0 && Math.abs(startCurvature - middleCurvature) + Math.abs(middleCurvature - endCurvature) < options.curvatureThreshold * 2) {
      const segment = Arc.createFromPoints(startPoint, middlePoint, endPoint);
      let needsSplit = false;
      if (segment instanceof Arc) {
        const radiusSquared = segment.radius * segment.radius;
        for (let i = 0; i < options.errorPoints.length; i++) {
          const t = options.errorPoints[i];
          const point = this.positionAt(startT * (1 - t) + endT * t);
          if (Math.abs(point.distanceSquared(segment.center) - radiusSquared) > options.errorThreshold) {
            needsSplit = true;
            break;
          }
        }
      }
      if (!needsSplit) {
        segments.push(segment);
        return;
      }
    }
    this.toPiecewiseLinearOrArcRecursion(options, minLevels - 1, maxLevels - 1, segments, startT, middleT, startPoint, middlePoint, startCurvature, middleCurvature);
    this.toPiecewiseLinearOrArcRecursion(options, minLevels - 1, maxLevels - 1, segments, middleT, endT, middlePoint, endPoint, middleCurvature, endCurvature);
  }

  /**
   * Returns a Shape containing just this one segment.
   */
  toShape() {
    return new Shape([new Subpath([this])]);
  }
  getClosestPoints(point) {
    // TODO: solve segments to determine this analytically! (only implemented for Line right now, should be easy to do with some things) https://github.com/phetsims/kite/issues/76
    return Segment.closestToPoint([this], point, 1e-7);
  }

  /**
   * List of results (since there can be duplicates), threshold is used for subdivision,
   * where it will exit if all of the segments are shorter than the threshold
   *
   * TODO: solve segments to determine this analytically! https://github.com/phetsims/kite/issues/76
   */
  static closestToPoint(segments, point, threshold) {
    const thresholdSquared = threshold * threshold;
    let items = [];
    let bestList = [];
    let bestDistanceSquared = Number.POSITIVE_INFINITY;
    let thresholdOk = false;
    _.each(segments, segment => {
      // if we have an explicit computation for this segment, use it
      if (segment instanceof Line) {
        const infos = segment.explicitClosestToPoint(point);
        _.each(infos, info => {
          if (info.distanceSquared < bestDistanceSquared) {
            bestList = [info];
            bestDistanceSquared = info.distanceSquared;
          } else if (info.distanceSquared === bestDistanceSquared) {
            bestList.push(info);
          }
        });
      } else {
        // otherwise, we will split based on monotonicity, so we can subdivide
        // separate, so we can map the subdivided segments
        const ts = [0].concat(segment.getInteriorExtremaTs()).concat([1]);
        for (let i = 0; i < ts.length - 1; i++) {
          const ta = ts[i];
          const tb = ts[i + 1];
          const pa = segment.positionAt(ta);
          const pb = segment.positionAt(tb);
          const bounds = Bounds2.point(pa).addPoint(pb);
          const minDistanceSquared = bounds.minimumDistanceToPointSquared(point);
          if (minDistanceSquared <= bestDistanceSquared) {
            const maxDistanceSquared = bounds.maximumDistanceToPointSquared(point);
            if (maxDistanceSquared < bestDistanceSquared) {
              bestDistanceSquared = maxDistanceSquared;
              bestList = []; // clear it
            }
            items.push({
              ta: ta,
              tb: tb,
              pa: pa,
              pb: pb,
              segment: segment,
              bounds: bounds,
              min: minDistanceSquared,
              max: maxDistanceSquared
            });
          }
        }
      }
    });
    while (items.length && !thresholdOk) {
      const curItems = items;
      items = [];

      // whether all of the segments processed are shorter than the threshold
      thresholdOk = true;
      for (const item of curItems) {
        if (item.min > bestDistanceSquared) {
          continue; // drop this item
        }
        if (thresholdOk && item.pa.distanceSquared(item.pb) > thresholdSquared) {
          thresholdOk = false;
        }
        const tmid = (item.ta + item.tb) / 2;
        const pmid = item.segment.positionAt(tmid);
        const boundsA = Bounds2.point(item.pa).addPoint(pmid);
        const boundsB = Bounds2.point(item.pb).addPoint(pmid);
        const minA = boundsA.minimumDistanceToPointSquared(point);
        const minB = boundsB.minimumDistanceToPointSquared(point);
        if (minA <= bestDistanceSquared) {
          const maxA = boundsA.maximumDistanceToPointSquared(point);
          if (maxA < bestDistanceSquared) {
            bestDistanceSquared = maxA;
            bestList = []; // clear it
          }
          items.push({
            ta: item.ta,
            tb: tmid,
            pa: item.pa,
            pb: pmid,
            segment: item.segment,
            bounds: boundsA,
            min: minA,
            max: maxA
          });
        }
        if (minB <= bestDistanceSquared) {
          const maxB = boundsB.maximumDistanceToPointSquared(point);
          if (maxB < bestDistanceSquared) {
            bestDistanceSquared = maxB;
            bestList = []; // clear it
          }
          items.push({
            ta: tmid,
            tb: item.tb,
            pa: pmid,
            pb: item.pb,
            segment: item.segment,
            bounds: boundsB,
            min: minB,
            max: maxB
          });
        }
      }
    }

    // if there are any closest regions, they are within the threshold, so we will add them all
    _.each(items, item => {
      const t = (item.ta + item.tb) / 2;
      const closestPoint = item.segment.positionAt(t);
      bestList.push({
        segment: item.segment,
        t: t,
        closestPoint: closestPoint,
        distanceSquared: point.distanceSquared(closestPoint)
      });
    });
    return bestList;
  }

  /**
   * Given the cubic-premultiplied values for two cubic bezier curves, determines (if available) a specified (a,b) pair
   * such that p( t ) === q( a * t + b ).
   *
   * Given a 1-dimensional cubic bezier determined by the control points p0, p1, p2 and p3, compute:
   *
   * [ p0s ]    [  1   0   0   0 ]   [ p0 ]
   * [ p1s ] == [ -3   3   0   0 ] * [ p1 ]
   * [ p2s ] == [  3  -6   3   0 ] * [ p2 ]
   * [ p3s ]    [ -1   3  -3   1 ]   [ p3 ]
   *
   * see Cubic.getOverlaps for more information.
   */
  static polynomialGetOverlapCubic(p0s, p1s, p2s, p3s, q0s, q1s, q2s, q3s) {
    if (q3s === 0) {
      return Segment.polynomialGetOverlapQuadratic(p0s, p1s, p2s, q0s, q1s, q2s);
    }
    const a = Math.sign(p3s / q3s) * Math.pow(Math.abs(p3s / q3s), 1 / 3);
    if (a === 0) {
      return null; // If there would be solutions, then q3s would have been non-zero
    }
    const b = (p2s - a * a * q2s) / (3 * a * a * q3s);
    return {
      a: a,
      b: b
    };
  }

  /**
   * Given the quadratic-premultiplied values for two quadratic bezier curves, determines (if available) a specified (a,b) pair
   * such that p( t ) === q( a * t + b ).
   *
   * Given a 1-dimensional quadratic bezier determined by the control points p0, p1, p2, compute:
   *
   * [ p0s ]    [  1   0   0 ]   [ p0 ]
   * [ p1s ] == [ -2   2   0 ] * [ p1 ]
   * [ p2s ]    [  2  -2   3 ] * [ p2 ]
   *
   * see Quadratic.getOverlaps for more information.
   */
  static polynomialGetOverlapQuadratic(p0s, p1s, p2s, q0s, q1s, q2s) {
    if (q2s === 0) {
      return Segment.polynomialGetOverlapLinear(p0s, p1s, q0s, q1s);
    }
    const discr = p2s / q2s;
    if (discr < 0) {
      return null; // not possible to have a solution with an imaginary a
    }
    const a = Math.sqrt(p2s / q2s);
    if (a === 0) {
      return null; // If there would be solutions, then q2s would have been non-zero
    }
    const b = (p1s - a * q1s) / (2 * a * q2s);
    return {
      a: a,
      b: b
    };
  }

  /**
   * Given the linear-premultiplied values for two lines, determines (if available) a specified (a,b) pair
   * such that p( t ) === q( a * t + b ).
   *
   * Given a line determined by the control points p0, p1, compute:
   *
   * [ p0s ] == [  1   0 ] * [ p0 ]
   * [ p1s ] == [ -1   1 ] * [ p1 ]
   *
   * see Quadratic/Cubic.getOverlaps for more information.
   */
  static polynomialGetOverlapLinear(p0s, p1s, q0s, q1s) {
    if (q1s === 0) {
      if (p0s === q0s) {
        return true;
      } else {
        return null;
      }
    }
    const a = p1s / q1s;
    if (a === 0) {
      return null;
    }
    const b = (p0s - q0s) / q1s;
    return {
      a: a,
      b: b
    };
  }

  /**
   * Returns all the distinct (non-endpoint, non-finite) intersections between the two segments.
   */
  static intersect(a, b) {
    if (Line && a instanceof Line && b instanceof Line) {
      return Line.intersect(a, b);
    } else if (Line && a instanceof Line) {
      return Line.intersectOther(a, b);
    } else if (Line && b instanceof Line) {
      // need to swap our intersections, since 'b' is the line
      return Line.intersectOther(b, a).map(swapSegmentIntersection);
    } else if (Arc && a instanceof Arc && b instanceof Arc) {
      return Arc.intersect(a, b);
    } else if (EllipticalArc && a instanceof EllipticalArc && b instanceof EllipticalArc) {
      return EllipticalArc.intersect(a, b);
    } else if (Quadratic && Cubic && (a instanceof Quadratic || a instanceof Cubic) && (b instanceof Quadratic || b instanceof Cubic)) {
      const cubicA = a instanceof Cubic ? a : a.degreeElevated();
      const cubicB = b instanceof Cubic ? b : b.degreeElevated();

      // @ts-expect-error (no type definitions yet, perhaps useful if we use it more)
      const paperCurveA = new paper.Curve(cubicA.start.x, cubicA.start.y, cubicA.control1.x, cubicA.control1.y, cubicA.control2.x, cubicA.control2.y, cubicA.end.x, cubicA.end.y);

      // @ts-expect-error (no type definitions yet, perhaps useful if we use it more)
      const paperCurveB = new paper.Curve(cubicB.start.x, cubicB.start.y, cubicB.control1.x, cubicB.control1.y, cubicB.control2.x, cubicB.control2.y, cubicB.end.x, cubicB.end.y);
      const paperIntersections = paperCurveA.getIntersections(paperCurveB);
      return paperIntersections.map(paperIntersection => {
        const point = new Vector2(paperIntersection.point.x, paperIntersection.point.y);
        return new SegmentIntersection(point, paperIntersection.time, paperIntersection.intersection.time);
      });
    } else {
      return BoundsIntersection.intersect(a, b);
    }
  }

  /**
   * Returns a Segment from the serialized representation.
   */
  static deserialize(obj) {
    // TODO: just import them now that we have circular reference protection, and switch between https://github.com/phetsims/kite/issues/76
    // @ts-expect-error TODO: namespacing https://github.com/phetsims/kite/issues/76
    assert && assert(obj.type && kite[obj.type] && kite[obj.type].deserialize);

    // @ts-expect-error TODO: namespacing https://github.com/phetsims/kite/issues/76
    return kite[obj.type].deserialize(obj);
  }

  /**
   * Determines if the start/middle/end points are representative of a sufficiently flat segment
   * (given certain epsilon values)
   *
   * @param start
   * @param middle
   * @param end
   * @param distanceEpsilon - controls level of subdivision by attempting to ensure a maximum (squared)
   *                          deviation from the curve
   * @param curveEpsilon - controls level of subdivision by attempting to ensure a maximum curvature change
   *                       between segments
   */
  static isSufficientlyFlat(distanceEpsilon, curveEpsilon, start, middle, end) {
    // flatness criterion: A=start, B=end, C=midpoint, d0=distance from AB, d1=||B-A||, subdivide if d0/d1 > sqrt(epsilon)
    if (Utils.distToSegmentSquared(middle, start, end) / start.distanceSquared(end) > curveEpsilon) {
      return false;
    }
    // deviation criterion
    if (Utils.distToSegmentSquared(middle, start, end) > distanceEpsilon) {
      return false;
    }
    return true;
  }
  static filterClosestToPointResult(results) {
    if (results.length === 0) {
      return [];
    }
    const closestDistanceSquared = _.minBy(results, result => result.distanceSquared).distanceSquared;

    // Return all results that are within 1e-11 of the closest distance (to account for floating point error), but unique
    // based on the location.
    return _.uniqWith(results.filter(result => Math.abs(result.distanceSquared - closestDistanceSquared) < 1e-11), (a, b) => a.closestPoint.distanceSquared(b.closestPoint) < 1e-11);
  }
}
kite.register('Segment', Segment);
function swapSegmentIntersection(segmentIntersection) {
  return segmentIntersection.getSwapped();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55RW1pdHRlciIsIkJvdW5kczIiLCJVdGlscyIsIlZlY3RvcjIiLCJvcHRpb25pemUiLCJBcmMiLCJCb3VuZHNJbnRlcnNlY3Rpb24iLCJDdWJpYyIsIkVsbGlwdGljYWxBcmMiLCJraXRlIiwiTGluZSIsIlF1YWRyYXRpYyIsIlNlZ21lbnRJbnRlcnNlY3Rpb24iLCJTaGFwZSIsIlN1YnBhdGgiLCJTZWdtZW50IiwiY29uc3RydWN0b3IiLCJpbnZhbGlkYXRpb25FbWl0dGVyIiwiYXJlU3Ryb2tlZEJvdW5kc0RpbGF0ZWQiLCJlcHNpbG9uIiwiTWF0aCIsImFicyIsInN0YXJ0VGFuZ2VudCIsIngiLCJ5IiwiZW5kVGFuZ2VudCIsImdldEJvdW5kc1dpdGhUcmFuc2Zvcm0iLCJtYXRyaXgiLCJ0cmFuc2Zvcm1lZFNlZ21lbnQiLCJ0cmFuc2Zvcm1lZCIsImdldEJvdW5kcyIsInNsaWNlIiwidDAiLCJ0MSIsImFzc2VydCIsInNlZ21lbnQiLCJzdWJkaXZpZGVkIiwibGluZWFyIiwic3ViZGl2aXNpb25zIiwidExpc3QiLCJyaWdodCIsInJlc3VsdCIsImkiLCJsZW5ndGgiLCJ0IiwiYXJyIiwicHVzaCIsImoiLCJzdWJkaXZpZGVkSW50b01vbm90b25lIiwiZ2V0SW50ZXJpb3JFeHRyZW1hVHMiLCJpc1N1ZmZpY2llbnRseUZsYXQiLCJkaXN0YW5jZUVwc2lsb24iLCJjdXJ2ZUVwc2lsb24iLCJzdGFydCIsIm1pZGRsZSIsInBvc2l0aW9uQXQiLCJlbmQiLCJnZXRBcmNMZW5ndGgiLCJtYXhMZXZlbHMiLCJ1bmRlZmluZWQiLCJkaXN0YW5jZSIsImdldERhc2hWYWx1ZXMiLCJsaW5lRGFzaCIsImxpbmVEYXNoT2Zmc2V0Iiwic2VsZiIsInZhbHVlcyIsImFyY0xlbmd0aCIsImxpbmVEYXNoU3VtIiwiXyIsInN1bSIsImRhc2hJbmRleCIsImRhc2hPZmZzZXQiLCJpc0luc2lkZSIsIm5leHREYXNoSW5kZXgiLCJpbml0aWFsbHlJbnNpZGUiLCJyZWN1ciIsInAwIiwicDEiLCJkZXB0aCIsInRNaWQiLCJwTWlkIiwidG90YWxMZW5ndGgiLCJsZW5ndGhMZWZ0IiwidG9QaWVjZXdpc2VMaW5lYXJTZWdtZW50cyIsIm9wdGlvbnMiLCJtaW5MZXZlbHMiLCJzZWdtZW50cyIsInBvaW50TWFwIiwiaWRlbnRpdHkiLCJmaW5pc2hlZCIsIk51bWJlciIsIlBPU0lUSVZFX0lORklOSVRZIiwic3ViZGl2aWRlZFNlZ21lbnRzIiwidG9QaWVjZXdpc2VMaW5lYXJPckFyY1NlZ21lbnRzIiwicHJvdmlkZWRPcHRpb25zIiwiY3VydmF0dXJlVGhyZXNob2xkIiwiZXJyb3JUaHJlc2hvbGQiLCJlcnJvclBvaW50cyIsInRvUGllY2V3aXNlTGluZWFyT3JBcmNSZWN1cnNpb24iLCJjdXJ2YXR1cmVBdCIsInN0YXJ0VCIsImVuZFQiLCJzdGFydFBvaW50IiwiZW5kUG9pbnQiLCJzdGFydEN1cnZhdHVyZSIsImVuZEN1cnZhdHVyZSIsIm1pZGRsZVQiLCJtaWRkbGVQb2ludCIsIm1pZGRsZUN1cnZhdHVyZSIsImNyZWF0ZUZyb21Qb2ludHMiLCJuZWVkc1NwbGl0IiwicmFkaXVzU3F1YXJlZCIsInJhZGl1cyIsInBvaW50IiwiZGlzdGFuY2VTcXVhcmVkIiwiY2VudGVyIiwidG9TaGFwZSIsImdldENsb3Nlc3RQb2ludHMiLCJjbG9zZXN0VG9Qb2ludCIsInRocmVzaG9sZCIsInRocmVzaG9sZFNxdWFyZWQiLCJpdGVtcyIsImJlc3RMaXN0IiwiYmVzdERpc3RhbmNlU3F1YXJlZCIsInRocmVzaG9sZE9rIiwiZWFjaCIsImluZm9zIiwiZXhwbGljaXRDbG9zZXN0VG9Qb2ludCIsImluZm8iLCJ0cyIsImNvbmNhdCIsInRhIiwidGIiLCJwYSIsInBiIiwiYm91bmRzIiwiYWRkUG9pbnQiLCJtaW5EaXN0YW5jZVNxdWFyZWQiLCJtaW5pbXVtRGlzdGFuY2VUb1BvaW50U3F1YXJlZCIsIm1heERpc3RhbmNlU3F1YXJlZCIsIm1heGltdW1EaXN0YW5jZVRvUG9pbnRTcXVhcmVkIiwibWluIiwibWF4IiwiY3VySXRlbXMiLCJpdGVtIiwidG1pZCIsInBtaWQiLCJib3VuZHNBIiwiYm91bmRzQiIsIm1pbkEiLCJtaW5CIiwibWF4QSIsIm1heEIiLCJjbG9zZXN0UG9pbnQiLCJwb2x5bm9taWFsR2V0T3ZlcmxhcEN1YmljIiwicDBzIiwicDFzIiwicDJzIiwicDNzIiwicTBzIiwicTFzIiwicTJzIiwicTNzIiwicG9seW5vbWlhbEdldE92ZXJsYXBRdWFkcmF0aWMiLCJhIiwic2lnbiIsInBvdyIsImIiLCJwb2x5bm9taWFsR2V0T3ZlcmxhcExpbmVhciIsImRpc2NyIiwic3FydCIsImludGVyc2VjdCIsImludGVyc2VjdE90aGVyIiwibWFwIiwic3dhcFNlZ21lbnRJbnRlcnNlY3Rpb24iLCJjdWJpY0EiLCJkZWdyZWVFbGV2YXRlZCIsImN1YmljQiIsInBhcGVyQ3VydmVBIiwicGFwZXIiLCJDdXJ2ZSIsImNvbnRyb2wxIiwiY29udHJvbDIiLCJwYXBlckN1cnZlQiIsInBhcGVySW50ZXJzZWN0aW9ucyIsImdldEludGVyc2VjdGlvbnMiLCJwYXBlckludGVyc2VjdGlvbiIsInRpbWUiLCJpbnRlcnNlY3Rpb24iLCJkZXNlcmlhbGl6ZSIsIm9iaiIsInR5cGUiLCJkaXN0VG9TZWdtZW50U3F1YXJlZCIsImZpbHRlckNsb3Nlc3RUb1BvaW50UmVzdWx0IiwicmVzdWx0cyIsImNsb3Nlc3REaXN0YW5jZVNxdWFyZWQiLCJtaW5CeSIsInVuaXFXaXRoIiwiZmlsdGVyIiwicmVnaXN0ZXIiLCJzZWdtZW50SW50ZXJzZWN0aW9uIiwiZ2V0U3dhcHBlZCJdLCJzb3VyY2VzIjpbIlNlZ21lbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBzZWdtZW50IHJlcHJlc2VudHMgYSBzcGVjaWZpYyBjdXJ2ZSB3aXRoIGEgc3RhcnQgYW5kIGVuZC5cclxuICpcclxuICogRWFjaCBzZWdtZW50IGlzIHRyZWF0ZWQgcGFyYW1ldHJpY2FsbHksIHdoZXJlIHQ9MCBpcyB0aGUgc3RhcnQgb2YgdGhlIHNlZ21lbnQsIGFuZCB0PTEgaXMgdGhlIGVuZC4gVmFsdWVzIG9mIHRcclxuICogYmV0d2VlbiB0aG9zZSByZXByZXNlbnQgcG9pbnRzIGFsb25nIHRoZSBzZWdtZW50LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IFRFbWl0dGVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvVEVtaXR0ZXIuanMnO1xyXG5pbXBvcnQgVGlueUVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UaW55RW1pdHRlci5qcyc7XHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgUmF5MiBmcm9tICcuLi8uLi8uLi9kb3QvanMvUmF5Mi5qcyc7XHJcbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi8uLi9kb3QvanMvVXRpbHMuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBLZXlzTWF0Y2hpbmcgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0tleXNNYXRjaGluZy5qcyc7XHJcbmltcG9ydCB7IEFyYywgQm91bmRzSW50ZXJzZWN0aW9uLCBDdWJpYywgRWxsaXB0aWNhbEFyYywga2l0ZSwgTGluZSwgUXVhZHJhdGljLCBSYXlJbnRlcnNlY3Rpb24sIFNlZ21lbnRJbnRlcnNlY3Rpb24sIFNlcmlhbGl6ZWRBcmMsIFNlcmlhbGl6ZWRDdWJpYywgU2VyaWFsaXplZEVsbGlwdGljYWxBcmMsIFNlcmlhbGl6ZWRMaW5lLCBTZXJpYWxpemVkUXVhZHJhdGljLCBTaGFwZSwgU3VicGF0aCB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgSW50ZW50aW9uYWxBbnkgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuXHJcbmV4cG9ydCB0eXBlIERhc2hWYWx1ZXMgPSB7XHJcblxyXG4gIC8vIFBhcmFtZXRyaWMgKHQpIHZhbHVlcyBmb3Igd2hlcmUgZGFzaCBib3VuZGFyaWVzIGV4aXN0XHJcbiAgdmFsdWVzOiBudW1iZXJbXTtcclxuXHJcbiAgLy8gVG90YWwgYXJjIGxlbmd0aCBmb3IgdGhpcyBzZWdtZW50XHJcbiAgYXJjTGVuZ3RoOiBudW1iZXI7XHJcblxyXG4gIC8vIFdoZXRoZXIgdGhlIHN0YXJ0IG9mIHRoZSBzZWdtZW50IGlzIGluc2lkZSBhIGRhc2ggKGluc3RlYWQgb2YgYSBnYXApXHJcbiAgaW5pdGlhbGx5SW5zaWRlOiBib29sZWFuO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgU2VyaWFsaXplZFNlZ21lbnQgPSBTZXJpYWxpemVkQXJjIHwgU2VyaWFsaXplZEN1YmljIHwgU2VyaWFsaXplZEVsbGlwdGljYWxBcmMgfCBTZXJpYWxpemVkTGluZSB8IFNlcmlhbGl6ZWRRdWFkcmF0aWM7XHJcblxyXG50eXBlIFNpbXBsZU92ZXJsYXAgPSB7XHJcbiAgYTogbnVtYmVyO1xyXG4gIGI6IG51bWJlcjtcclxufTtcclxuXHJcbi8vIG51bGwgaWYgbm8gc29sdXRpb24sIHRydWUgaWYgZXZlcnkgYSxiIHBhaXIgaXMgYSBzb2x1dGlvbiwgb3RoZXJ3aXNlIHRoZSBzaW5nbGUgc29sdXRpb25cclxudHlwZSBQb3NzaWJsZVNpbXBsZU92ZXJsYXAgPSBTaW1wbGVPdmVybGFwIHwgbnVsbCB8IHRydWU7XHJcblxyXG5leHBvcnQgdHlwZSBDbG9zZXN0VG9Qb2ludFJlc3VsdCA9IHtcclxuICBzZWdtZW50OiBTZWdtZW50O1xyXG4gIHQ6IG51bWJlcjtcclxuICBjbG9zZXN0UG9pbnQ6IFZlY3RvcjI7XHJcbiAgZGlzdGFuY2VTcXVhcmVkOiBudW1iZXI7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBQaWVjZXdpc2VMaW5lYXJPcHRpb25zID0ge1xyXG4gIC8vIGhvdyBtYW55IGxldmVscyB0byBmb3JjZSBzdWJkaXZpc2lvbnNcclxuICBtaW5MZXZlbHM/OiBudW1iZXI7XHJcblxyXG4gIC8vIHByZXZlbnQgc3ViZGl2aXNpb24gcGFzdCB0aGlzIGxldmVsXHJcbiAgbWF4TGV2ZWxzPzogbnVtYmVyO1xyXG5cclxuICAvLyBjb250cm9scyBsZXZlbCBvZiBzdWJkaXZpc2lvbiBieSBhdHRlbXB0aW5nIHRvIGVuc3VyZSBhIG1heGltdW0gKHNxdWFyZWQpIGRldmlhdGlvbiBmcm9tIHRoZSBjdXJ2ZVxyXG4gIGRpc3RhbmNlRXBzaWxvbj86IG51bWJlciB8IG51bGw7XHJcblxyXG4gIC8vIGNvbnRyb2xzIGxldmVsIG9mIHN1YmRpdmlzaW9uIGJ5IGF0dGVtcHRpbmcgdG8gZW5zdXJlIGEgbWF4aW11bSBjdXJ2YXR1cmUgY2hhbmdlIGJldHdlZW4gc2VnbWVudHNcclxuICBjdXJ2ZUVwc2lsb24/OiBudW1iZXIgfCBudWxsO1xyXG5cclxuICAvLyByZXByZXNlbnRzIGEgKHVzdWFsbHkgbm9uLWxpbmVhcikgdHJhbnNmb3JtYXRpb24gYXBwbGllZFxyXG4gIHBvaW50TWFwPzogKCB2OiBWZWN0b3IyICkgPT4gVmVjdG9yMjtcclxuXHJcbiAgLy8gaWYgdGhlIG1ldGhvZCBuYW1lIGlzIGZvdW5kIG9uIHRoZSBzZWdtZW50LCBpdCBpcyBjYWxsZWQgd2l0aCB0aGUgZXhwZWN0ZWQgc2lnbmF0dXJlXHJcbiAgLy8gZnVuY3Rpb24oIG9wdGlvbnMgKSA6IEFycmF5W1NlZ21lbnRdIGluc3RlYWQgb2YgdXNpbmcgb3VyIGJydXRlLWZvcmNlIGxvZ2ljXHJcbiAgbWV0aG9kTmFtZT86IEtleXNNYXRjaGluZzxTZWdtZW50LCAoIG9wdGlvbnM6IFBpZWNld2lzZUxpbmVhck9wdGlvbnMgKSA9PiBTZWdtZW50W10+IHxcclxuICAgICAgICAgICAgICAgS2V5c01hdGNoaW5nPEFyYywgKCBvcHRpb25zOiBQaWVjZXdpc2VMaW5lYXJPcHRpb25zICkgPT4gU2VnbWVudFtdPiB8XHJcbiAgICAgICAgICAgICAgIEtleXNNYXRjaGluZzxDdWJpYywgKCBvcHRpb25zOiBQaWVjZXdpc2VMaW5lYXJPcHRpb25zICkgPT4gU2VnbWVudFtdPiB8XHJcbiAgICAgICAgICAgICAgIEtleXNNYXRjaGluZzxFbGxpcHRpY2FsQXJjLCAoIG9wdGlvbnM6IFBpZWNld2lzZUxpbmVhck9wdGlvbnMgKSA9PiBTZWdtZW50W10+IHxcclxuICAgICAgICAgICAgICAgS2V5c01hdGNoaW5nPExpbmUsICggb3B0aW9uczogUGllY2V3aXNlTGluZWFyT3B0aW9ucyApID0+IFNlZ21lbnRbXT4gfFxyXG4gICAgICAgICAgICAgICBLZXlzTWF0Y2hpbmc8UXVhZHJhdGljLCAoIG9wdGlvbnM6IFBpZWNld2lzZUxpbmVhck9wdGlvbnMgKSA9PiBTZWdtZW50W10+O1xyXG59O1xyXG5cclxudHlwZSBQaWVjZXdpc2VMaW5lYXJPckFyY1JlY3Vyc2lvbk9wdGlvbnMgPSB7XHJcbiAgY3VydmF0dXJlVGhyZXNob2xkOiBudW1iZXI7XHJcbiAgZXJyb3JUaHJlc2hvbGQ6IG51bWJlcjtcclxuICBlcnJvclBvaW50czogW251bWJlciwgbnVtYmVyXTtcclxufTtcclxuXHJcbnR5cGUgUGllY2V3aXNlTGluZWFyT3JBcmNPcHRpb25zID0ge1xyXG4gIG1pbkxldmVscz86IG51bWJlcjtcclxuICBtYXhMZXZlbHM/OiBudW1iZXI7XHJcbn0gJiBQYXJ0aWFsPFBpZWNld2lzZUxpbmVhck9yQXJjUmVjdXJzaW9uT3B0aW9ucz47XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBTZWdtZW50IHtcclxuXHJcbiAgcHVibGljIGludmFsaWRhdGlvbkVtaXR0ZXI6IFRFbWl0dGVyO1xyXG5cclxuICBwcm90ZWN0ZWQgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLmludmFsaWRhdGlvbkVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuICB9XHJcblxyXG4gIC8vIFRoZSBzdGFydCBwb2ludCBvZiB0aGUgc2VnbWVudCwgcGFyYW1ldHJpY2FsbHkgYXQgdD0wLlxyXG4gIHB1YmxpYyBhYnN0cmFjdCBnZXQgc3RhcnQoKTogVmVjdG9yMjtcclxuXHJcbiAgLy8gVGhlIGVuZCBwb2ludCBvZiB0aGUgc2VnbWVudCwgcGFyYW1ldHJpY2FsbHkgYXQgdD0xLlxyXG4gIHB1YmxpYyBhYnN0cmFjdCBnZXQgZW5kKCk6IFZlY3RvcjI7XHJcblxyXG4gIC8vIFRoZSBub3JtYWxpemVkIHRhbmdlbnQgdmVjdG9yIHRvIHRoZSBzZWdtZW50IGF0IGl0cyBzdGFydCBwb2ludCwgcG9pbnRpbmcgaW4gdGhlIGRpcmVjdGlvbiBvZiBtb3Rpb24gKGZyb20gc3RhcnQgdG9cclxuICAvLyBlbmQpLlxyXG4gIHB1YmxpYyBhYnN0cmFjdCBnZXQgc3RhcnRUYW5nZW50KCk6IFZlY3RvcjI7XHJcblxyXG4gIC8vIFRoZSBub3JtYWxpemVkIHRhbmdlbnQgdmVjdG9yIHRvIHRoZSBzZWdtZW50IGF0IGl0cyBlbmQgcG9pbnQsIHBvaW50aW5nIGluIHRoZSBkaXJlY3Rpb24gb2YgbW90aW9uIChmcm9tIHN0YXJ0IHRvXHJcbiAgLy8gZW5kKS5cclxuICBwdWJsaWMgYWJzdHJhY3QgZ2V0IGVuZFRhbmdlbnQoKTogVmVjdG9yMjtcclxuXHJcbiAgLy8gVGhlIGJvdW5kaW5nIGJveCBmb3IgdGhlIHNlZ21lbnQuXHJcbiAgcHVibGljIGFic3RyYWN0IGdldCBib3VuZHMoKTogQm91bmRzMjtcclxuXHJcbiAgLy8gUmV0dXJucyB0aGUgcG9zaXRpb24gcGFyYW1ldHJpY2FsbHksIHdpdGggMCA8PSB0IDw9IDEuIE5PVEUgdGhhdCB0aGlzIGZ1bmN0aW9uIGRvZXNuJ3Qga2VlcCBhIGNvbnN0YW50IG1hZ25pdHVkZVxyXG4gIC8vIHRhbmdlbnQuXHJcbiAgcHVibGljIGFic3RyYWN0IHBvc2l0aW9uQXQoIHQ6IG51bWJlciApOiBWZWN0b3IyO1xyXG5cclxuICAvLyBSZXR1cm5zIHRoZSBub24tbm9ybWFsaXplZCB0YW5nZW50IChkeC9kdCwgZHkvZHQpIG9mIHRoaXMgc2VnbWVudCBhdCB0aGUgcGFyYW1ldHJpYyB2YWx1ZSBvZiB0LCB3aXRoIDAgPD0gdCA8PSAxLlxyXG4gIHB1YmxpYyBhYnN0cmFjdCB0YW5nZW50QXQoIHQ6IG51bWJlciApOiBWZWN0b3IyO1xyXG5cclxuICAvLyBSZXR1cm5zIHRoZSBzaWduZWQgY3VydmF0dXJlIChwb3NpdGl2ZSBmb3IgdmlzdWFsIGNsb2Nrd2lzZSAtIG1hdGhlbWF0aWNhbCBjb3VudGVyY2xvY2t3aXNlKVxyXG4gIHB1YmxpYyBhYnN0cmFjdCBjdXJ2YXR1cmVBdCggdDogbnVtYmVyICk6IG51bWJlcjtcclxuXHJcbiAgLy8gUmV0dXJucyBhbiBhcnJheSB3aXRoIHVwIHRvIDIgc3ViLXNlZ21lbnRzLCBzcGxpdCBhdCB0aGUgcGFyYW1ldHJpYyB0IHZhbHVlLiBUaGUgc2VnbWVudHMgdG9nZXRoZXIgc2hvdWxkIG1ha2UgdGhlXHJcbiAgLy8gc2FtZSBzaGFwZSBhcyB0aGUgb3JpZ2luYWwgc2VnbWVudC5cclxuICBwdWJsaWMgYWJzdHJhY3Qgc3ViZGl2aWRlZCggdDogbnVtYmVyICk6IFNlZ21lbnRbXTtcclxuXHJcbiAgLy8gUmV0dXJucyBhIHN0cmluZyBjb250YWluaW5nIHRoZSBTVkcgcGF0aC4gYXNzdW1lcyB0aGF0IHRoZSBzdGFydCBwb2ludCBpcyBhbHJlYWR5IHByb3ZpZGVkLCBzbyBhbnl0aGluZyB0aGF0IGNhbGxzXHJcbiAgLy8gdGhpcyBuZWVkcyB0byBwdXQgdGhlIE0gY2FsbHMgZmlyc3RcclxuICBwdWJsaWMgYWJzdHJhY3QgZ2V0U1ZHUGF0aEZyYWdtZW50KCk6IHN0cmluZztcclxuXHJcbiAgLy8gUmV0dXJucyBhbiBhcnJheSBvZiBzZWdtZW50cyB0aGF0IHdpbGwgZHJhdyBhbiBvZmZzZXQgY3VydmUgb24gdGhlIGxvZ2ljYWwgbGVmdCBzaWRlXHJcbiAgcHVibGljIGFic3RyYWN0IHN0cm9rZUxlZnQoIGxpbmVXaWR0aDogbnVtYmVyICk6IFNlZ21lbnRbXTtcclxuXHJcbiAgLy8gUmV0dXJucyBhbiBhcnJheSBvZiBzZWdtZW50cyB0aGF0IHdpbGwgZHJhdyBhbiBvZmZzZXQgY3VydmUgb24gdGhlIGxvZ2ljYWwgcmlnaHQgc2lkZVxyXG4gIHB1YmxpYyBhYnN0cmFjdCBzdHJva2VSaWdodCggbGluZVdpZHRoOiBudW1iZXIgKTogU2VnbWVudFtdO1xyXG5cclxuICAvLyBSZXR1cm5zIHRoZSB3aW5kaW5nIG51bWJlciBmb3IgaW50ZXJzZWN0aW9uIHdpdGggYSByYXlcclxuICBwdWJsaWMgYWJzdHJhY3Qgd2luZGluZ0ludGVyc2VjdGlvbiggcmF5OiBSYXkyICk6IG51bWJlcjtcclxuXHJcbiAgLy8gUmV0dXJucyBhIGxpc3Qgb2YgdCB2YWx1ZXMgd2hlcmUgZHgvZHQgb3IgZHkvZHQgaXMgMCB3aGVyZSAwIDwgdCA8IDEuIHN1YmRpdmlkaW5nIG9uIHRoZXNlIHdpbGwgcmVzdWx0IGluIG1vbm90b25pY1xyXG4gIC8vIHNlZ21lbnRzXHJcbiAgcHVibGljIGFic3RyYWN0IGdldEludGVyaW9yRXh0cmVtYVRzKCk6IG51bWJlcltdO1xyXG5cclxuICAvLyBSZXR1cm5zIGEgbGlzdCBvZiBpbnRlcnNlY3Rpb25zIGJldHdlZW4gdGhlIHNlZ21lbnQgYW5kIHRoZSByYXkuXHJcbiAgcHVibGljIGFic3RyYWN0IGludGVyc2VjdGlvbiggcmF5OiBSYXkyICk6IFJheUludGVyc2VjdGlvbltdO1xyXG5cclxuICAvLyBSZXR1cm5zIGEge0JvdW5kczJ9IHJlcHJlc2VudGluZyB0aGUgYm91bmRpbmcgYm94IGZvciB0aGUgc2VnbWVudC5cclxuICBwdWJsaWMgYWJzdHJhY3QgZ2V0Qm91bmRzKCk6IEJvdW5kczI7XHJcblxyXG4gIC8vIFJldHVybnMgc2lnbmVkIGFyZWEgY29udHJpYnV0aW9uIGZvciB0aGlzIHNlZ21lbnQgdXNpbmcgR3JlZW4ncyBUaGVvcmVtXHJcbiAgcHVibGljIGFic3RyYWN0IGdldFNpZ25lZEFyZWFGcmFnbWVudCgpOiBudW1iZXI7XHJcblxyXG4gIC8vIFJldHVybnMgYSBsaXN0IG9mIG5vbi1kZWdlbmVyYXRlIHNlZ21lbnRzIHRoYXQgYXJlIGVxdWl2YWxlbnQgdG8gdGhpcyBzZWdtZW50LiBHZW5lcmFsbHkgZ2V0cyByaWQgKG9yIHNpbXBsaWZpZXMpXHJcbiAgLy8gaW52YWxpZCBvciByZXBlYXRlZCBzZWdtZW50cy5cclxuICBwdWJsaWMgYWJzdHJhY3QgZ2V0Tm9uZGVnZW5lcmF0ZVNlZ21lbnRzKCk6IFNlZ21lbnRbXTtcclxuXHJcbiAgLy8gRHJhd3MgdGhlIHNlZ21lbnQgdG8gdGhlIDJEIENhbnZhcyBjb250ZXh0LCBhc3N1bWluZyB0aGUgY29udGV4dCdzIGN1cnJlbnQgbG9jYXRpb24gaXMgYWxyZWFkeSBhdCB0aGUgc3RhcnQgcG9pbnRcclxuICBwdWJsaWMgYWJzdHJhY3Qgd3JpdGVUb0NvbnRleHQoIGNvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCApOiB2b2lkO1xyXG5cclxuICAvLyBSZXR1cm5zIGEgbmV3IHNlZ21lbnQgdGhhdCByZXByZXNlbnRzIHRoaXMgc2VnbWVudCBhZnRlciB0cmFuc2Zvcm1hdGlvbiBieSB0aGUgbWF0cml4XHJcbiAgcHVibGljIGFic3RyYWN0IHRyYW5zZm9ybWVkKCBtYXRyaXg6IE1hdHJpeDMgKTogU2VnbWVudDtcclxuXHJcbiAgcHVibGljIGFic3RyYWN0IGludmFsaWRhdGUoKTogdm9pZDtcclxuXHJcbiAgcHVibGljIGFic3RyYWN0IHNlcmlhbGl6ZSgpOiBTZXJpYWxpemVkU2VnbWVudDtcclxuXHJcbiAgLyoqXHJcbiAgICogV2lsbCByZXR1cm4gdHJ1ZSBpZiB0aGUgc3RhcnQvZW5kIHRhbmdlbnRzIGFyZSBwdXJlbHkgdmVydGljYWwgb3IgaG9yaXpvbnRhbC4gSWYgYWxsIG9mIHRoZSBzZWdtZW50cyBvZiBhIHNoYXBlXHJcbiAgICogaGF2ZSB0aGlzIHByb3BlcnR5LCB0aGVuIHRoZSBvbmx5IGxpbmUgam9pbnMgd2lsbCBiZSBhIG11bHRpcGxlIG9mIHBpLzIgKDkwIGRlZ3JlZXMpLCBhbmQgc28gYWxsIG9mIHRoZSB0eXBlcyBvZlxyXG4gICAqIGxpbmUgam9pbnMgd2lsbCBoYXZlIHRoZSBzYW1lIGJvdW5kcy4gVGhpcyBtZWFucyB0aGF0IHRoZSBzdHJva2VkIGJvdW5kcyB3aWxsIGp1c3QgYmUgYSBwdXJlIGRpbGF0aW9uIG9mIHRoZVxyXG4gICAqIHJlZ3VsYXIgYm91bmRzLCBieSBsaW5lV2lkdGggLyAyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhcmVTdHJva2VkQm91bmRzRGlsYXRlZCgpOiBib29sZWFuIHtcclxuICAgIGNvbnN0IGVwc2lsb24gPSAwLjAwMDAwMDE7XHJcblxyXG4gICAgLy8gSWYgdGhlIGRlcml2YXRpdmUgYXQgdGhlIHN0YXJ0L2VuZCBhcmUgcG9pbnRpbmcgaW4gYSBjYXJkaW5hbCBkaXJlY3Rpb24gKG5vcnRoL3NvdXRoL2Vhc3Qvd2VzdCksIHRoZW4gdGhlXHJcbiAgICAvLyBlbmRwb2ludHMgd29uJ3QgdHJpZ2dlciBub24tZGlsYXRlZCBib3VuZHMsIGFuZCB0aGUgaW50ZXJpb3Igb2YgdGhlIGN1cnZlIHdpbGwgbm90IGNvbnRyaWJ1dGUuXHJcbiAgICByZXR1cm4gTWF0aC5hYnMoIHRoaXMuc3RhcnRUYW5nZW50LnggKiB0aGlzLnN0YXJ0VGFuZ2VudC55ICkgPCBlcHNpbG9uICYmIE1hdGguYWJzKCB0aGlzLmVuZFRhbmdlbnQueCAqIHRoaXMuZW5kVGFuZ2VudC55ICkgPCBlcHNpbG9uO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVE9ETzogb3ZlcnJpZGUgZXZlcnl3aGVyZSBzbyB0aGlzIGlzbid0IG5lY2Vzc2FyeSAoaXQncyBub3QgcGFydGljdWxhcmx5IGVmZmljaWVudCEpIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRCb3VuZHNXaXRoVHJhbnNmb3JtKCBtYXRyaXg6IE1hdHJpeDMgKTogQm91bmRzMiB7XHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZFNlZ21lbnQgPSB0aGlzLnRyYW5zZm9ybWVkKCBtYXRyaXggKTtcclxuICAgIHJldHVybiB0cmFuc2Zvcm1lZFNlZ21lbnQuZ2V0Qm91bmRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeHRyYWN0cyBhIHNsaWNlIG9mIGEgc2VnbWVudCwgYmFzZWQgb24gdGhlIHBhcmFtZXRyaWMgdmFsdWUuXHJcbiAgICpcclxuICAgKiBHaXZlbiB0aGF0IHRoaXMgc2VnbWVudCBpcyByZXByZXNlbnRlZCBieSB0aGUgaW50ZXJ2YWwgWzAsMV1cclxuICAgKi9cclxuICBwdWJsaWMgc2xpY2UoIHQwOiBudW1iZXIsIHQxOiBudW1iZXIgKTogU2VnbWVudCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0MCA+PSAwICYmIHQwIDw9IDEgJiYgdDEgPj0gMCAmJiB0MSA8PSAxLCAnUGFyYW1ldHJpYyB2YWx1ZSBvdXQgb2YgcmFuZ2UnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0MCA8IHQxICk7XHJcblxyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby10aGlzLWFsaWFzXHJcbiAgICBsZXQgc2VnbWVudDogU2VnbWVudCA9IHRoaXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29uc2lzdGVudC10aGlzXHJcbiAgICBpZiAoIHQxIDwgMSApIHtcclxuICAgICAgc2VnbWVudCA9IHNlZ21lbnQuc3ViZGl2aWRlZCggdDEgKVsgMCBdO1xyXG4gICAgfVxyXG4gICAgaWYgKCB0MCA+IDAgKSB7XHJcbiAgICAgIHNlZ21lbnQgPSBzZWdtZW50LnN1YmRpdmlkZWQoIFV0aWxzLmxpbmVhciggMCwgdDEsIDAsIDEsIHQwICkgKVsgMSBdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNlZ21lbnQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gdExpc3QgLSBsaXN0IG9mIHNvcnRlZCB0IHZhbHVlcyBmcm9tIDAgPD0gdCA8PSAxXHJcbiAgICovXHJcbiAgcHVibGljIHN1YmRpdmlzaW9ucyggdExpc3Q6IG51bWJlcltdICk6IFNlZ21lbnRbXSB7XHJcbiAgICAvLyB0aGlzIGNvdWxkIGJlIHNvbHZlZCBieSByZWN1cnNpb24sIGJ1dCB3ZSBkb24ndCBwbGFuIG9uIHRoZSBKUyBlbmdpbmUgZG9pbmcgdGFpbC1jYWxsIG9wdGltaXphdGlvblxyXG5cclxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdGhpcy1hbGlhc1xyXG4gICAgbGV0IHJpZ2h0OiBTZWdtZW50ID0gdGhpczsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb25zaXN0ZW50LXRoaXNcclxuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdExpc3QubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIC8vIGFzc3VtZSBiaW5hcnkgc3ViZGl2aXNpb25cclxuICAgICAgY29uc3QgdCA9IHRMaXN0WyBpIF07XHJcbiAgICAgIGNvbnN0IGFyciA9IHJpZ2h0LnN1YmRpdmlkZWQoIHQgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggYXJyLmxlbmd0aCA9PT0gMiApO1xyXG4gICAgICByZXN1bHQucHVzaCggYXJyWyAwIF0gKTtcclxuICAgICAgcmlnaHQgPSBhcnJbIDEgXTtcclxuXHJcbiAgICAgIC8vIHNjYWxlIHVwIHRoZSByZW1haW5pbmcgdCB2YWx1ZXNcclxuICAgICAgZm9yICggbGV0IGogPSBpICsgMTsgaiA8IHRMaXN0Lmxlbmd0aDsgaisrICkge1xyXG4gICAgICAgIHRMaXN0WyBqIF0gPSBVdGlscy5saW5lYXIoIHQsIDEsIDAsIDEsIHRMaXN0WyBqIF0gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmVzdWx0LnB1c2goIHJpZ2h0ICk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJuIGFuIGFycmF5IG9mIHNlZ21lbnRzIGZyb20gYnJlYWtpbmcgdGhpcyBzZWdtZW50IGludG8gbW9ub3RvbmUgcGllY2VzXHJcbiAgICovXHJcbiAgcHVibGljIHN1YmRpdmlkZWRJbnRvTW9ub3RvbmUoKTogU2VnbWVudFtdIHtcclxuICAgIHJldHVybiB0aGlzLnN1YmRpdmlzaW9ucyggdGhpcy5nZXRJbnRlcmlvckV4dHJlbWFUcygpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBzZWdtZW50IGlzIHN1ZmZpY2llbnRseSBmbGF0IChnaXZlbiBjZXJ0YWluIGVwc2lsb24gdmFsdWVzKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIGRpc3RhbmNlRXBzaWxvbiAtIGNvbnRyb2xzIGxldmVsIG9mIHN1YmRpdmlzaW9uIGJ5IGF0dGVtcHRpbmcgdG8gZW5zdXJlIGEgbWF4aW11bSAoc3F1YXJlZClcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWF0aW9uIGZyb20gdGhlIGN1cnZlXHJcbiAgICogQHBhcmFtIGN1cnZlRXBzaWxvbiAtIGNvbnRyb2xzIGxldmVsIG9mIHN1YmRpdmlzaW9uIGJ5IGF0dGVtcHRpbmcgdG8gZW5zdXJlIGEgbWF4aW11bSBjdXJ2YXR1cmUgY2hhbmdlXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgIGJldHdlZW4gc2VnbWVudHNcclxuICAgKi9cclxuICBwdWJsaWMgaXNTdWZmaWNpZW50bHlGbGF0KCBkaXN0YW5jZUVwc2lsb246IG51bWJlciwgY3VydmVFcHNpbG9uOiBudW1iZXIgKTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCBzdGFydCA9IHRoaXMuc3RhcnQ7XHJcbiAgICBjb25zdCBtaWRkbGUgPSB0aGlzLnBvc2l0aW9uQXQoIDAuNSApO1xyXG4gICAgY29uc3QgZW5kID0gdGhpcy5lbmQ7XHJcblxyXG4gICAgcmV0dXJuIFNlZ21lbnQuaXNTdWZmaWNpZW50bHlGbGF0KCBkaXN0YW5jZUVwc2lsb24sIGN1cnZlRXBzaWxvbiwgc3RhcnQsIG1pZGRsZSwgZW5kICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSAoc29tZXRpbWVzIGFwcHJveGltYXRlKSBhcmMgbGVuZ3RoIG9mIHRoZSBzZWdtZW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRBcmNMZW5ndGgoIGRpc3RhbmNlRXBzaWxvbj86IG51bWJlciwgY3VydmVFcHNpbG9uPzogbnVtYmVyLCBtYXhMZXZlbHM/OiBudW1iZXIgKTogbnVtYmVyIHtcclxuICAgIGRpc3RhbmNlRXBzaWxvbiA9IGRpc3RhbmNlRXBzaWxvbiA9PT0gdW5kZWZpbmVkID8gMWUtMTAgOiBkaXN0YW5jZUVwc2lsb247XHJcbiAgICBjdXJ2ZUVwc2lsb24gPSBjdXJ2ZUVwc2lsb24gPT09IHVuZGVmaW5lZCA/IDFlLTggOiBjdXJ2ZUVwc2lsb247XHJcbiAgICBtYXhMZXZlbHMgPSBtYXhMZXZlbHMgPT09IHVuZGVmaW5lZCA/IDE1IDogbWF4TGV2ZWxzO1xyXG5cclxuICAgIGlmICggbWF4TGV2ZWxzIDw9IDAgfHwgdGhpcy5pc1N1ZmZpY2llbnRseUZsYXQoIGRpc3RhbmNlRXBzaWxvbiwgY3VydmVFcHNpbG9uICkgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN0YXJ0LmRpc3RhbmNlKCB0aGlzLmVuZCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvbnN0IHN1YmRpdmlkZWQgPSB0aGlzLnN1YmRpdmlkZWQoIDAuNSApO1xyXG4gICAgICByZXR1cm4gc3ViZGl2aWRlZFsgMCBdLmdldEFyY0xlbmd0aCggZGlzdGFuY2VFcHNpbG9uLCBjdXJ2ZUVwc2lsb24sIG1heExldmVscyAtIDEgKSArXHJcbiAgICAgICAgICAgICBzdWJkaXZpZGVkWyAxIF0uZ2V0QXJjTGVuZ3RoKCBkaXN0YW5jZUVwc2lsb24sIGN1cnZlRXBzaWxvbiwgbWF4TGV2ZWxzIC0gMSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbGluZSBkYXNoIHBhcmFtZXRyaWMgb2Zmc2V0cyBmb3IgYSBnaXZlbiBzZWdtZW50LlxyXG4gICAqXHJcbiAgICogQXMgYWx3YXlzLCB0aGlzIGlzIGZhaXJseSBhcHByb3hpbWF0ZSBkZXBlbmRpbmcgb24gdGhlIHR5cGUgb2Ygc2VnbWVudC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBsaW5lRGFzaFxyXG4gICAqIEBwYXJhbSBsaW5lRGFzaE9mZnNldFxyXG4gICAqIEBwYXJhbSBkaXN0YW5jZUVwc2lsb24gLSBjb250cm9scyBsZXZlbCBvZiBzdWJkaXZpc2lvbiBieSBhdHRlbXB0aW5nIHRvIGVuc3VyZSBhIG1heGltdW0gKHNxdWFyZWQpXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgIGRldmlhdGlvbiBmcm9tIHRoZSBjdXJ2ZVxyXG4gICAqIEBwYXJhbSBjdXJ2ZUVwc2lsb24gLSBjb250cm9scyBsZXZlbCBvZiBzdWJkaXZpc2lvbiBieSBhdHRlbXB0aW5nIHRvIGVuc3VyZSBhIG1heGltdW0gY3VydmF0dXJlIGNoYW5nZVxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICBiZXR3ZWVuIHNlZ21lbnRzXHJcbiAgICovXHJcbiAgcHVibGljIGdldERhc2hWYWx1ZXMoIGxpbmVEYXNoOiBudW1iZXJbXSwgbGluZURhc2hPZmZzZXQ6IG51bWJlciwgZGlzdGFuY2VFcHNpbG9uOiBudW1iZXIsIGN1cnZlRXBzaWxvbjogbnVtYmVyICk6IERhc2hWYWx1ZXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbGluZURhc2gubGVuZ3RoID4gMCwgJ0RvIG5vdCBjYWxsIHdpdGggYW4gZW1wdHkgZGFzaCBhcnJheScgKTtcclxuXHJcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXRoaXMtYWxpYXNcclxuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGNvbnN0IHZhbHVlcyA9IFtdO1xyXG4gICAgbGV0IGFyY0xlbmd0aCA9IDA7XHJcblxyXG4gICAgLy8gRG8gdGhlIG9mZnNldCBtb2R1bG8gdGhlIHN1bSwgc28gdGhhdCB3ZSBkb24ndCBoYXZlIHRvIGN5Y2xlIGZvciBhIGxvbmcgdGltZVxyXG4gICAgY29uc3QgbGluZURhc2hTdW0gPSBfLnN1bSggbGluZURhc2ggKTtcclxuICAgIGxpbmVEYXNoT2Zmc2V0ID0gbGluZURhc2hPZmZzZXQgJSBsaW5lRGFzaFN1bTtcclxuXHJcbiAgICAvLyBFbnN1cmUgdGhlIGxpbmVEYXNoT2Zmc2V0IGlzIHBvc2l0aXZlXHJcbiAgICBpZiAoIGxpbmVEYXNoT2Zmc2V0IDwgMCApIHtcclxuICAgICAgbGluZURhc2hPZmZzZXQgKz0gbGluZURhc2hTdW07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVGhlIGN1cnJlbnQgc2VjdGlvbiBvZiBsaW5lRGFzaCB0aGF0IHdlIGFyZSBpblxyXG4gICAgbGV0IGRhc2hJbmRleCA9IDA7XHJcbiAgICBsZXQgZGFzaE9mZnNldCA9IDA7XHJcbiAgICBsZXQgaXNJbnNpZGUgPSB0cnVlO1xyXG5cclxuICAgIGZ1bmN0aW9uIG5leHREYXNoSW5kZXgoKTogdm9pZCB7XHJcbiAgICAgIGRhc2hJbmRleCA9ICggZGFzaEluZGV4ICsgMSApICUgbGluZURhc2gubGVuZ3RoO1xyXG4gICAgICBpc0luc2lkZSA9ICFpc0luc2lkZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBCdXJuIG9mZiBpbml0aWFsIGxpbmVEYXNoT2Zmc2V0XHJcbiAgICB3aGlsZSAoIGxpbmVEYXNoT2Zmc2V0ID4gMCApIHtcclxuICAgICAgaWYgKCBsaW5lRGFzaE9mZnNldCA+PSBsaW5lRGFzaFsgZGFzaEluZGV4IF0gKSB7XHJcbiAgICAgICAgbGluZURhc2hPZmZzZXQgLT0gbGluZURhc2hbIGRhc2hJbmRleCBdO1xyXG4gICAgICAgIG5leHREYXNoSW5kZXgoKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBkYXNoT2Zmc2V0ID0gbGluZURhc2hPZmZzZXQ7XHJcbiAgICAgICAgbGluZURhc2hPZmZzZXQgPSAwO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaW5pdGlhbGx5SW5zaWRlID0gaXNJbnNpZGU7XHJcblxyXG4gICAgLy8gUmVjdXJzaXZlbHkgcHJvZ3Jlc3MgdGhyb3VnaCB1bnRpbCB3ZSBoYXZlIG1vc3RseS1saW5lYXIgc2VnbWVudHMuXHJcbiAgICAoIGZ1bmN0aW9uIHJlY3VyKCB0MDogbnVtYmVyLCB0MTogbnVtYmVyLCBwMDogVmVjdG9yMiwgcDE6IFZlY3RvcjIsIGRlcHRoOiBudW1iZXIgKSB7XHJcbiAgICAgIC8vIENvbXB1dGUgdGhlIHQvcG9zaXRpb24gYXQgdGhlIG1pZHBvaW50IHQgdmFsdWVcclxuICAgICAgY29uc3QgdE1pZCA9ICggdDAgKyB0MSApIC8gMjtcclxuICAgICAgY29uc3QgcE1pZCA9IHNlbGYucG9zaXRpb25BdCggdE1pZCApO1xyXG5cclxuICAgICAgLy8gSWYgaXQncyBmbGF0IGVub3VnaCAob3Igd2UgaGl0IG91ciByZWN1cnNpb24gbGltaXQpLCBwcm9jZXNzIGl0XHJcbiAgICAgIGlmICggZGVwdGggPiAxNCB8fCBTZWdtZW50LmlzU3VmZmljaWVudGx5RmxhdCggZGlzdGFuY2VFcHNpbG9uLCBjdXJ2ZUVwc2lsb24sIHAwLCBwTWlkLCBwMSApICkge1xyXG4gICAgICAgIC8vIEVzdGltYXRlIGxlbmd0aFxyXG4gICAgICAgIGNvbnN0IHRvdGFsTGVuZ3RoID0gcDAuZGlzdGFuY2UoIHBNaWQgKSArIHBNaWQuZGlzdGFuY2UoIHAxICk7XHJcbiAgICAgICAgYXJjTGVuZ3RoICs9IHRvdGFsTGVuZ3RoO1xyXG5cclxuICAgICAgICAvLyBXaGlsZSB3ZSBhcmUgbG9uZ2VyIHRoYW4gdGhlIHJlbWFpbmluZyBhbW91bnQgZm9yIHRoZSBuZXh0IGRhc2ggY2hhbmdlLlxyXG4gICAgICAgIGxldCBsZW5ndGhMZWZ0ID0gdG90YWxMZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKCBkYXNoT2Zmc2V0ICsgbGVuZ3RoTGVmdCA+PSBsaW5lRGFzaFsgZGFzaEluZGV4IF0gKSB7XHJcbiAgICAgICAgICAvLyBDb21wdXRlIHRoZSB0IChmb3Igbm93LCBiYXNlZCBvbiB0aGUgdG90YWwgbGVuZ3RoIGZvciBlYXNlKVxyXG4gICAgICAgICAgY29uc3QgdCA9IFV0aWxzLmxpbmVhciggMCwgdG90YWxMZW5ndGgsIHQwLCB0MSwgdG90YWxMZW5ndGggLSBsZW5ndGhMZWZ0ICsgbGluZURhc2hbIGRhc2hJbmRleCBdIC0gZGFzaE9mZnNldCApO1xyXG5cclxuICAgICAgICAgIC8vIFJlY29yZCB0aGUgZGFzaCBjaGFuZ2VcclxuICAgICAgICAgIHZhbHVlcy5wdXNoKCB0ICk7XHJcblxyXG4gICAgICAgICAgLy8gUmVtb3ZlIGFtb3VudCBhZGRlZCBmcm9tIG91ciBsZW5ndGhMZWZ0IChtb3ZlIHRvIHRoZSBkYXNoKVxyXG4gICAgICAgICAgbGVuZ3RoTGVmdCAtPSBsaW5lRGFzaFsgZGFzaEluZGV4IF0gLSBkYXNoT2Zmc2V0O1xyXG4gICAgICAgICAgZGFzaE9mZnNldCA9IDA7IC8vIGF0IHRoZSBkYXNoLCB3ZSdsbCBoYXZlIDAgb2Zmc2V0XHJcbiAgICAgICAgICBuZXh0RGFzaEluZGV4KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBTcGlsbC1vdmVyLCBqdXN0IGFkZCBpdFxyXG4gICAgICAgIGRhc2hPZmZzZXQgPSBkYXNoT2Zmc2V0ICsgbGVuZ3RoTGVmdDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZWN1ciggdDAsIHRNaWQsIHAwLCBwTWlkLCBkZXB0aCArIDEgKTtcclxuICAgICAgICByZWN1ciggdE1pZCwgdDEsIHBNaWQsIHAxLCBkZXB0aCArIDEgKTtcclxuICAgICAgfVxyXG4gICAgfSApKCAwLCAxLCB0aGlzLnN0YXJ0LCB0aGlzLmVuZCwgMCApO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHZhbHVlczogdmFsdWVzLFxyXG4gICAgICBhcmNMZW5ndGg6IGFyY0xlbmd0aCxcclxuICAgICAgaW5pdGlhbGx5SW5zaWRlOiBpbml0aWFsbHlJbnNpZGVcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqIEBwYXJhbSBbb3B0aW9uc11cclxuICAgKiBAcGFyYW0gW21pbkxldmVsc10gLSAgIGhvdyBtYW55IGxldmVscyB0byBmb3JjZSBzdWJkaXZpc2lvbnNcclxuICAgKiBAcGFyYW0gW21heExldmVsc10gLSAgIHByZXZlbnQgc3ViZGl2aXNpb24gcGFzdCB0aGlzIGxldmVsXHJcbiAgICogQHBhcmFtIFtzZWdtZW50c11cclxuICAgKiBAcGFyYW0gW3N0YXJ0XVxyXG4gICAqIEBwYXJhbSBbZW5kXVxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b1BpZWNld2lzZUxpbmVhclNlZ21lbnRzKCBvcHRpb25zOiBQaWVjZXdpc2VMaW5lYXJPcHRpb25zLCBtaW5MZXZlbHM/OiBudW1iZXIsIG1heExldmVscz86IG51bWJlciwgc2VnbWVudHM/OiBMaW5lW10sIHN0YXJ0PzogVmVjdG9yMiwgZW5kPzogVmVjdG9yMiApOiBMaW5lW10ge1xyXG4gICAgLy8gZm9yIHRoZSBmaXJzdCBjYWxsLCBpbml0aWFsaXplIG1pbi9tYXggbGV2ZWxzIGZyb20gb3VyIG9wdGlvbnNcclxuICAgIG1pbkxldmVscyA9IG1pbkxldmVscyA9PT0gdW5kZWZpbmVkID8gb3B0aW9ucy5taW5MZXZlbHMhIDogbWluTGV2ZWxzO1xyXG4gICAgbWF4TGV2ZWxzID0gbWF4TGV2ZWxzID09PSB1bmRlZmluZWQgPyBvcHRpb25zLm1heExldmVscyEgOiBtYXhMZXZlbHM7XHJcblxyXG4gICAgc2VnbWVudHMgPSBzZWdtZW50cyB8fCBbXTtcclxuICAgIGNvbnN0IHBvaW50TWFwID0gb3B0aW9ucy5wb2ludE1hcCB8fCBfLmlkZW50aXR5O1xyXG5cclxuICAgIC8vIHBvaW50cyBtYXBwZWQgYnkgdGhlIChwb3NzaWJseS1ub25saW5lYXIpIHBvaW50TWFwLlxyXG4gICAgc3RhcnQgPSBzdGFydCB8fCBwb2ludE1hcCggdGhpcy5zdGFydCApO1xyXG4gICAgZW5kID0gZW5kIHx8IHBvaW50TWFwKCB0aGlzLmVuZCApO1xyXG4gICAgY29uc3QgbWlkZGxlID0gcG9pbnRNYXAoIHRoaXMucG9zaXRpb25BdCggMC41ICkgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBtaW5MZXZlbHMgPD0gbWF4TGV2ZWxzICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLmRpc3RhbmNlRXBzaWxvbiA9PT0gbnVsbCB8fCB0eXBlb2Ygb3B0aW9ucy5kaXN0YW5jZUVwc2lsb24gPT09ICdudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLmN1cnZlRXBzaWxvbiA9PT0gbnVsbCB8fCB0eXBlb2Ygb3B0aW9ucy5jdXJ2ZUVwc2lsb24gPT09ICdudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhcG9pbnRNYXAgfHwgdHlwZW9mIHBvaW50TWFwID09PSAnZnVuY3Rpb24nICk7XHJcblxyXG4gICAgLy8gaS5lLiB3ZSB3aWxsIGhhdmUgZmluaXNoZWQgPSBtYXhMZXZlbHMgPT09IDAgfHwgKCBtaW5MZXZlbHMgPD0gMCAmJiBlcHNpbG9uQ29uc3RyYWludHMgKSwganVzdCBkaWRuJ3Qgd2FudCB0byBvbmUtbGluZSBpdFxyXG4gICAgbGV0IGZpbmlzaGVkID0gbWF4TGV2ZWxzID09PSAwOyAvLyBiYWlsIG91dCBvbmNlIHdlIHJlYWNoIG91ciBtYXhpbXVtIG51bWJlciBvZiBzdWJkaXZpc2lvbiBsZXZlbHNcclxuICAgIGlmICggIWZpbmlzaGVkICYmIG1pbkxldmVscyA8PSAwICkgeyAvLyBmb3JjZSBzdWJkaXZpc2lvbiBpZiBtaW5MZXZlbHMgaGFzbid0IGJlZW4gcmVhY2hlZFxyXG4gICAgICBmaW5pc2hlZCA9IHRoaXMuaXNTdWZmaWNpZW50bHlGbGF0KFxyXG4gICAgICAgIG9wdGlvbnMuZGlzdGFuY2VFcHNpbG9uID09PSBudWxsIHx8IG9wdGlvbnMuZGlzdGFuY2VFcHNpbG9uID09PSB1bmRlZmluZWQgPyBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkgOiBvcHRpb25zLmRpc3RhbmNlRXBzaWxvbixcclxuICAgICAgICBvcHRpb25zLmN1cnZlRXBzaWxvbiA9PT0gbnVsbCB8fCBvcHRpb25zLmN1cnZlRXBzaWxvbiA9PT0gdW5kZWZpbmVkID8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZIDogb3B0aW9ucy5jdXJ2ZUVwc2lsb25cclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGZpbmlzaGVkICkge1xyXG4gICAgICBzZWdtZW50cy5wdXNoKCBuZXcgTGluZSggc3RhcnQhLCBlbmQhICkgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBjb25zdCBzdWJkaXZpZGVkU2VnbWVudHMgPSB0aGlzLnN1YmRpdmlkZWQoIDAuNSApO1xyXG4gICAgICBzdWJkaXZpZGVkU2VnbWVudHNbIDAgXS50b1BpZWNld2lzZUxpbmVhclNlZ21lbnRzKCBvcHRpb25zLCBtaW5MZXZlbHMgLSAxLCBtYXhMZXZlbHMgLSAxLCBzZWdtZW50cywgc3RhcnQsIG1pZGRsZSApO1xyXG4gICAgICBzdWJkaXZpZGVkU2VnbWVudHNbIDEgXS50b1BpZWNld2lzZUxpbmVhclNlZ21lbnRzKCBvcHRpb25zLCBtaW5MZXZlbHMgLSAxLCBtYXhMZXZlbHMgLSAxLCBzZWdtZW50cywgbWlkZGxlLCBlbmQgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBzZWdtZW50cztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBsaXN0IG9mIExpbmUgYW5kL29yIEFyYyBzZWdtZW50cyB0aGF0IGFwcHJveGltYXRlcyB0aGlzIHNlZ21lbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHRvUGllY2V3aXNlTGluZWFyT3JBcmNTZWdtZW50cyggcHJvdmlkZWRPcHRpb25zOiBQaWVjZXdpc2VMaW5lYXJPckFyY09wdGlvbnMgKTogU2VnbWVudFtdIHtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8UGllY2V3aXNlTGluZWFyT3JBcmNPcHRpb25zLCBQaWVjZXdpc2VMaW5lYXJPckFyY09wdGlvbnMsIFBpZWNld2lzZUxpbmVhck9yQXJjUmVjdXJzaW9uT3B0aW9ucz4oKSgge1xyXG4gICAgICBtaW5MZXZlbHM6IDIsXHJcbiAgICAgIG1heExldmVsczogNyxcclxuICAgICAgY3VydmF0dXJlVGhyZXNob2xkOiAwLjAyLFxyXG4gICAgICBlcnJvclRocmVzaG9sZDogMTAsXHJcbiAgICAgIGVycm9yUG9pbnRzOiBbIDAuMjUsIDAuNzUgXVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgY29uc3Qgc2VnbWVudHM6IFNlZ21lbnRbXSA9IFtdO1xyXG4gICAgdGhpcy50b1BpZWNld2lzZUxpbmVhck9yQXJjUmVjdXJzaW9uKCBvcHRpb25zLCBvcHRpb25zLm1pbkxldmVscywgb3B0aW9ucy5tYXhMZXZlbHMsIHNlZ21lbnRzLFxyXG4gICAgICAwLCAxLFxyXG4gICAgICB0aGlzLnBvc2l0aW9uQXQoIDAgKSwgdGhpcy5wb3NpdGlvbkF0KCAxICksXHJcbiAgICAgIHRoaXMuY3VydmF0dXJlQXQoIDAgKSwgdGhpcy5jdXJ2YXR1cmVBdCggMSApICk7XHJcbiAgICByZXR1cm4gc2VnbWVudHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIZWxwZXIgZnVuY3Rpb24gZm9yIHRvUGllY2V3aXNlTGluZWFyT3JBcmNTZWdtZW50cy4gLSB3aWxsIHB1c2ggaW50byBzZWdtZW50c1xyXG4gICAqL1xyXG4gIHByaXZhdGUgdG9QaWVjZXdpc2VMaW5lYXJPckFyY1JlY3Vyc2lvbiggb3B0aW9uczogUGllY2V3aXNlTGluZWFyT3JBcmNSZWN1cnNpb25PcHRpb25zLCBtaW5MZXZlbHM6IG51bWJlciwgbWF4TGV2ZWxzOiBudW1iZXIsIHNlZ21lbnRzOiBTZWdtZW50W10sIHN0YXJ0VDogbnVtYmVyLCBlbmRUOiBudW1iZXIsIHN0YXJ0UG9pbnQ6IFZlY3RvcjIsIGVuZFBvaW50OiBWZWN0b3IyLCBzdGFydEN1cnZhdHVyZTogbnVtYmVyLCBlbmRDdXJ2YXR1cmU6IG51bWJlciApOiB2b2lkIHtcclxuICAgIGNvbnN0IG1pZGRsZVQgPSAoIHN0YXJ0VCArIGVuZFQgKSAvIDI7XHJcbiAgICBjb25zdCBtaWRkbGVQb2ludCA9IHRoaXMucG9zaXRpb25BdCggbWlkZGxlVCApO1xyXG4gICAgY29uc3QgbWlkZGxlQ3VydmF0dXJlID0gdGhpcy5jdXJ2YXR1cmVBdCggbWlkZGxlVCApO1xyXG5cclxuICAgIGlmICggbWF4TGV2ZWxzIDw9IDAgfHwgKCBtaW5MZXZlbHMgPD0gMCAmJiBNYXRoLmFicyggc3RhcnRDdXJ2YXR1cmUgLSBtaWRkbGVDdXJ2YXR1cmUgKSArIE1hdGguYWJzKCBtaWRkbGVDdXJ2YXR1cmUgLSBlbmRDdXJ2YXR1cmUgKSA8IG9wdGlvbnMuY3VydmF0dXJlVGhyZXNob2xkICogMiApICkge1xyXG4gICAgICBjb25zdCBzZWdtZW50ID0gQXJjLmNyZWF0ZUZyb21Qb2ludHMoIHN0YXJ0UG9pbnQsIG1pZGRsZVBvaW50LCBlbmRQb2ludCApO1xyXG4gICAgICBsZXQgbmVlZHNTcGxpdCA9IGZhbHNlO1xyXG4gICAgICBpZiAoIHNlZ21lbnQgaW5zdGFuY2VvZiBBcmMgKSB7XHJcbiAgICAgICAgY29uc3QgcmFkaXVzU3F1YXJlZCA9IHNlZ21lbnQucmFkaXVzICogc2VnbWVudC5yYWRpdXM7XHJcbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgb3B0aW9ucy5lcnJvclBvaW50cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgIGNvbnN0IHQgPSBvcHRpb25zLmVycm9yUG9pbnRzWyBpIF07XHJcbiAgICAgICAgICBjb25zdCBwb2ludCA9IHRoaXMucG9zaXRpb25BdCggc3RhcnRUICogKCAxIC0gdCApICsgZW5kVCAqIHQgKTtcclxuICAgICAgICAgIGlmICggTWF0aC5hYnMoIHBvaW50LmRpc3RhbmNlU3F1YXJlZCggc2VnbWVudC5jZW50ZXIgKSAtIHJhZGl1c1NxdWFyZWQgKSA+IG9wdGlvbnMuZXJyb3JUaHJlc2hvbGQgKSB7XHJcbiAgICAgICAgICAgIG5lZWRzU3BsaXQgPSB0cnVlO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAhbmVlZHNTcGxpdCApIHtcclxuICAgICAgICBzZWdtZW50cy5wdXNoKCBzZWdtZW50ICk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnRvUGllY2V3aXNlTGluZWFyT3JBcmNSZWN1cnNpb24oIG9wdGlvbnMsIG1pbkxldmVscyAtIDEsIG1heExldmVscyAtIDEsIHNlZ21lbnRzLFxyXG4gICAgICBzdGFydFQsIG1pZGRsZVQsXHJcbiAgICAgIHN0YXJ0UG9pbnQsIG1pZGRsZVBvaW50LFxyXG4gICAgICBzdGFydEN1cnZhdHVyZSwgbWlkZGxlQ3VydmF0dXJlICk7XHJcbiAgICB0aGlzLnRvUGllY2V3aXNlTGluZWFyT3JBcmNSZWN1cnNpb24oIG9wdGlvbnMsIG1pbkxldmVscyAtIDEsIG1heExldmVscyAtIDEsIHNlZ21lbnRzLFxyXG4gICAgICBtaWRkbGVULCBlbmRULFxyXG4gICAgICBtaWRkbGVQb2ludCwgZW5kUG9pbnQsXHJcbiAgICAgIG1pZGRsZUN1cnZhdHVyZSwgZW5kQ3VydmF0dXJlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgU2hhcGUgY29udGFpbmluZyBqdXN0IHRoaXMgb25lIHNlZ21lbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHRvU2hhcGUoKTogU2hhcGUge1xyXG4gICAgcmV0dXJuIG5ldyBTaGFwZSggWyBuZXcgU3VicGF0aCggWyB0aGlzIF0gKSBdICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0Q2xvc2VzdFBvaW50cyggcG9pbnQ6IFZlY3RvcjIgKTogQ2xvc2VzdFRvUG9pbnRSZXN1bHRbXSB7XHJcbiAgICAvLyBUT0RPOiBzb2x2ZSBzZWdtZW50cyB0byBkZXRlcm1pbmUgdGhpcyBhbmFseXRpY2FsbHkhIChvbmx5IGltcGxlbWVudGVkIGZvciBMaW5lIHJpZ2h0IG5vdywgc2hvdWxkIGJlIGVhc3kgdG8gZG8gd2l0aCBzb21lIHRoaW5ncykgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICByZXR1cm4gU2VnbWVudC5jbG9zZXN0VG9Qb2ludCggWyB0aGlzIF0sIHBvaW50LCAxZS03ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMaXN0IG9mIHJlc3VsdHMgKHNpbmNlIHRoZXJlIGNhbiBiZSBkdXBsaWNhdGVzKSwgdGhyZXNob2xkIGlzIHVzZWQgZm9yIHN1YmRpdmlzaW9uLFxyXG4gICAqIHdoZXJlIGl0IHdpbGwgZXhpdCBpZiBhbGwgb2YgdGhlIHNlZ21lbnRzIGFyZSBzaG9ydGVyIHRoYW4gdGhlIHRocmVzaG9sZFxyXG4gICAqXHJcbiAgICogVE9ETzogc29sdmUgc2VnbWVudHMgdG8gZGV0ZXJtaW5lIHRoaXMgYW5hbHl0aWNhbGx5ISBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGNsb3Nlc3RUb1BvaW50KCBzZWdtZW50czogU2VnbWVudFtdLCBwb2ludDogVmVjdG9yMiwgdGhyZXNob2xkOiBudW1iZXIgKTogQ2xvc2VzdFRvUG9pbnRSZXN1bHRbXSB7XHJcbiAgICB0eXBlIEl0ZW0gPSB7XHJcbiAgICAgIHRhOiBudW1iZXI7XHJcbiAgICAgIHRiOiBudW1iZXI7XHJcbiAgICAgIHBhOiBWZWN0b3IyO1xyXG4gICAgICBwYjogVmVjdG9yMjtcclxuICAgICAgc2VnbWVudDogU2VnbWVudDtcclxuICAgICAgYm91bmRzOiBCb3VuZHMyO1xyXG4gICAgICBtaW46IG51bWJlcjtcclxuICAgICAgbWF4OiBudW1iZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IHRocmVzaG9sZFNxdWFyZWQgPSB0aHJlc2hvbGQgKiB0aHJlc2hvbGQ7XHJcbiAgICBsZXQgaXRlbXM6IEl0ZW1bXSA9IFtdO1xyXG4gICAgbGV0IGJlc3RMaXN0OiBDbG9zZXN0VG9Qb2ludFJlc3VsdFtdID0gW107XHJcbiAgICBsZXQgYmVzdERpc3RhbmNlU3F1YXJlZCA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcclxuICAgIGxldCB0aHJlc2hvbGRPayA9IGZhbHNlO1xyXG5cclxuICAgIF8uZWFjaCggc2VnbWVudHMsICggc2VnbWVudDogU2VnbWVudCApID0+IHtcclxuICAgICAgLy8gaWYgd2UgaGF2ZSBhbiBleHBsaWNpdCBjb21wdXRhdGlvbiBmb3IgdGhpcyBzZWdtZW50LCB1c2UgaXRcclxuICAgICAgaWYgKCBzZWdtZW50IGluc3RhbmNlb2YgTGluZSApIHtcclxuICAgICAgICBjb25zdCBpbmZvcyA9IHNlZ21lbnQuZXhwbGljaXRDbG9zZXN0VG9Qb2ludCggcG9pbnQgKTtcclxuICAgICAgICBfLmVhY2goIGluZm9zLCBpbmZvID0+IHtcclxuICAgICAgICAgIGlmICggaW5mby5kaXN0YW5jZVNxdWFyZWQgPCBiZXN0RGlzdGFuY2VTcXVhcmVkICkge1xyXG4gICAgICAgICAgICBiZXN0TGlzdCA9IFsgaW5mbyBdO1xyXG4gICAgICAgICAgICBiZXN0RGlzdGFuY2VTcXVhcmVkID0gaW5mby5kaXN0YW5jZVNxdWFyZWQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmICggaW5mby5kaXN0YW5jZVNxdWFyZWQgPT09IGJlc3REaXN0YW5jZVNxdWFyZWQgKSB7XHJcbiAgICAgICAgICAgIGJlc3RMaXN0LnB1c2goIGluZm8gKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gb3RoZXJ3aXNlLCB3ZSB3aWxsIHNwbGl0IGJhc2VkIG9uIG1vbm90b25pY2l0eSwgc28gd2UgY2FuIHN1YmRpdmlkZVxyXG4gICAgICAgIC8vIHNlcGFyYXRlLCBzbyB3ZSBjYW4gbWFwIHRoZSBzdWJkaXZpZGVkIHNlZ21lbnRzXHJcbiAgICAgICAgY29uc3QgdHMgPSBbIDAgXS5jb25jYXQoIHNlZ21lbnQuZ2V0SW50ZXJpb3JFeHRyZW1hVHMoKSApLmNvbmNhdCggWyAxIF0gKTtcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0cy5sZW5ndGggLSAxOyBpKysgKSB7XHJcbiAgICAgICAgICBjb25zdCB0YSA9IHRzWyBpIF07XHJcbiAgICAgICAgICBjb25zdCB0YiA9IHRzWyBpICsgMSBdO1xyXG4gICAgICAgICAgY29uc3QgcGEgPSBzZWdtZW50LnBvc2l0aW9uQXQoIHRhICk7XHJcbiAgICAgICAgICBjb25zdCBwYiA9IHNlZ21lbnQucG9zaXRpb25BdCggdGIgKTtcclxuICAgICAgICAgIGNvbnN0IGJvdW5kcyA9IEJvdW5kczIucG9pbnQoIHBhICkuYWRkUG9pbnQoIHBiICk7XHJcbiAgICAgICAgICBjb25zdCBtaW5EaXN0YW5jZVNxdWFyZWQgPSBib3VuZHMubWluaW11bURpc3RhbmNlVG9Qb2ludFNxdWFyZWQoIHBvaW50ICk7XHJcbiAgICAgICAgICBpZiAoIG1pbkRpc3RhbmNlU3F1YXJlZCA8PSBiZXN0RGlzdGFuY2VTcXVhcmVkICkge1xyXG4gICAgICAgICAgICBjb25zdCBtYXhEaXN0YW5jZVNxdWFyZWQgPSBib3VuZHMubWF4aW11bURpc3RhbmNlVG9Qb2ludFNxdWFyZWQoIHBvaW50ICk7XHJcbiAgICAgICAgICAgIGlmICggbWF4RGlzdGFuY2VTcXVhcmVkIDwgYmVzdERpc3RhbmNlU3F1YXJlZCApIHtcclxuICAgICAgICAgICAgICBiZXN0RGlzdGFuY2VTcXVhcmVkID0gbWF4RGlzdGFuY2VTcXVhcmVkO1xyXG4gICAgICAgICAgICAgIGJlc3RMaXN0ID0gW107IC8vIGNsZWFyIGl0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaXRlbXMucHVzaCgge1xyXG4gICAgICAgICAgICAgIHRhOiB0YSxcclxuICAgICAgICAgICAgICB0YjogdGIsXHJcbiAgICAgICAgICAgICAgcGE6IHBhLFxyXG4gICAgICAgICAgICAgIHBiOiBwYixcclxuICAgICAgICAgICAgICBzZWdtZW50OiBzZWdtZW50LFxyXG4gICAgICAgICAgICAgIGJvdW5kczogYm91bmRzLFxyXG4gICAgICAgICAgICAgIG1pbjogbWluRGlzdGFuY2VTcXVhcmVkLFxyXG4gICAgICAgICAgICAgIG1heDogbWF4RGlzdGFuY2VTcXVhcmVkXHJcbiAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICB3aGlsZSAoIGl0ZW1zLmxlbmd0aCAmJiAhdGhyZXNob2xkT2sgKSB7XHJcbiAgICAgIGNvbnN0IGN1ckl0ZW1zID0gaXRlbXM7XHJcbiAgICAgIGl0ZW1zID0gW107XHJcblxyXG4gICAgICAvLyB3aGV0aGVyIGFsbCBvZiB0aGUgc2VnbWVudHMgcHJvY2Vzc2VkIGFyZSBzaG9ydGVyIHRoYW4gdGhlIHRocmVzaG9sZFxyXG4gICAgICB0aHJlc2hvbGRPayA9IHRydWU7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBpdGVtIG9mIGN1ckl0ZW1zICkge1xyXG4gICAgICAgIGlmICggaXRlbS5taW4gPiBiZXN0RGlzdGFuY2VTcXVhcmVkICkge1xyXG4gICAgICAgICAgY29udGludWU7IC8vIGRyb3AgdGhpcyBpdGVtXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggdGhyZXNob2xkT2sgJiYgaXRlbS5wYS5kaXN0YW5jZVNxdWFyZWQoIGl0ZW0ucGIgKSA+IHRocmVzaG9sZFNxdWFyZWQgKSB7XHJcbiAgICAgICAgICB0aHJlc2hvbGRPayA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB0bWlkID0gKCBpdGVtLnRhICsgaXRlbS50YiApIC8gMjtcclxuICAgICAgICBjb25zdCBwbWlkID0gaXRlbS5zZWdtZW50LnBvc2l0aW9uQXQoIHRtaWQgKTtcclxuICAgICAgICBjb25zdCBib3VuZHNBID0gQm91bmRzMi5wb2ludCggaXRlbS5wYSApLmFkZFBvaW50KCBwbWlkICk7XHJcbiAgICAgICAgY29uc3QgYm91bmRzQiA9IEJvdW5kczIucG9pbnQoIGl0ZW0ucGIgKS5hZGRQb2ludCggcG1pZCApO1xyXG4gICAgICAgIGNvbnN0IG1pbkEgPSBib3VuZHNBLm1pbmltdW1EaXN0YW5jZVRvUG9pbnRTcXVhcmVkKCBwb2ludCApO1xyXG4gICAgICAgIGNvbnN0IG1pbkIgPSBib3VuZHNCLm1pbmltdW1EaXN0YW5jZVRvUG9pbnRTcXVhcmVkKCBwb2ludCApO1xyXG4gICAgICAgIGlmICggbWluQSA8PSBiZXN0RGlzdGFuY2VTcXVhcmVkICkge1xyXG4gICAgICAgICAgY29uc3QgbWF4QSA9IGJvdW5kc0EubWF4aW11bURpc3RhbmNlVG9Qb2ludFNxdWFyZWQoIHBvaW50ICk7XHJcbiAgICAgICAgICBpZiAoIG1heEEgPCBiZXN0RGlzdGFuY2VTcXVhcmVkICkge1xyXG4gICAgICAgICAgICBiZXN0RGlzdGFuY2VTcXVhcmVkID0gbWF4QTtcclxuICAgICAgICAgICAgYmVzdExpc3QgPSBbXTsgLy8gY2xlYXIgaXRcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGl0ZW1zLnB1c2goIHtcclxuICAgICAgICAgICAgdGE6IGl0ZW0udGEsXHJcbiAgICAgICAgICAgIHRiOiB0bWlkLFxyXG4gICAgICAgICAgICBwYTogaXRlbS5wYSxcclxuICAgICAgICAgICAgcGI6IHBtaWQsXHJcbiAgICAgICAgICAgIHNlZ21lbnQ6IGl0ZW0uc2VnbWVudCxcclxuICAgICAgICAgICAgYm91bmRzOiBib3VuZHNBLFxyXG4gICAgICAgICAgICBtaW46IG1pbkEsXHJcbiAgICAgICAgICAgIG1heDogbWF4QVxyXG4gICAgICAgICAgfSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIG1pbkIgPD0gYmVzdERpc3RhbmNlU3F1YXJlZCApIHtcclxuICAgICAgICAgIGNvbnN0IG1heEIgPSBib3VuZHNCLm1heGltdW1EaXN0YW5jZVRvUG9pbnRTcXVhcmVkKCBwb2ludCApO1xyXG4gICAgICAgICAgaWYgKCBtYXhCIDwgYmVzdERpc3RhbmNlU3F1YXJlZCApIHtcclxuICAgICAgICAgICAgYmVzdERpc3RhbmNlU3F1YXJlZCA9IG1heEI7XHJcbiAgICAgICAgICAgIGJlc3RMaXN0ID0gW107IC8vIGNsZWFyIGl0XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpdGVtcy5wdXNoKCB7XHJcbiAgICAgICAgICAgIHRhOiB0bWlkLFxyXG4gICAgICAgICAgICB0YjogaXRlbS50YixcclxuICAgICAgICAgICAgcGE6IHBtaWQsXHJcbiAgICAgICAgICAgIHBiOiBpdGVtLnBiLFxyXG4gICAgICAgICAgICBzZWdtZW50OiBpdGVtLnNlZ21lbnQsXHJcbiAgICAgICAgICAgIGJvdW5kczogYm91bmRzQixcclxuICAgICAgICAgICAgbWluOiBtaW5CLFxyXG4gICAgICAgICAgICBtYXg6IG1heEJcclxuICAgICAgICAgIH0gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiB0aGVyZSBhcmUgYW55IGNsb3Nlc3QgcmVnaW9ucywgdGhleSBhcmUgd2l0aGluIHRoZSB0aHJlc2hvbGQsIHNvIHdlIHdpbGwgYWRkIHRoZW0gYWxsXHJcbiAgICBfLmVhY2goIGl0ZW1zLCBpdGVtID0+IHtcclxuICAgICAgY29uc3QgdCA9ICggaXRlbS50YSArIGl0ZW0udGIgKSAvIDI7XHJcbiAgICAgIGNvbnN0IGNsb3Nlc3RQb2ludCA9IGl0ZW0uc2VnbWVudC5wb3NpdGlvbkF0KCB0ICk7XHJcbiAgICAgIGJlc3RMaXN0LnB1c2goIHtcclxuICAgICAgICBzZWdtZW50OiBpdGVtLnNlZ21lbnQsXHJcbiAgICAgICAgdDogdCxcclxuICAgICAgICBjbG9zZXN0UG9pbnQ6IGNsb3Nlc3RQb2ludCxcclxuICAgICAgICBkaXN0YW5jZVNxdWFyZWQ6IHBvaW50LmRpc3RhbmNlU3F1YXJlZCggY2xvc2VzdFBvaW50IClcclxuICAgICAgfSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIHJldHVybiBiZXN0TGlzdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIHRoZSBjdWJpYy1wcmVtdWx0aXBsaWVkIHZhbHVlcyBmb3IgdHdvIGN1YmljIGJlemllciBjdXJ2ZXMsIGRldGVybWluZXMgKGlmIGF2YWlsYWJsZSkgYSBzcGVjaWZpZWQgKGEsYikgcGFpclxyXG4gICAqIHN1Y2ggdGhhdCBwKCB0ICkgPT09IHEoIGEgKiB0ICsgYiApLlxyXG4gICAqXHJcbiAgICogR2l2ZW4gYSAxLWRpbWVuc2lvbmFsIGN1YmljIGJlemllciBkZXRlcm1pbmVkIGJ5IHRoZSBjb250cm9sIHBvaW50cyBwMCwgcDEsIHAyIGFuZCBwMywgY29tcHV0ZTpcclxuICAgKlxyXG4gICAqIFsgcDBzIF0gICAgWyAgMSAgIDAgICAwICAgMCBdICAgWyBwMCBdXHJcbiAgICogWyBwMXMgXSA9PSBbIC0zICAgMyAgIDAgICAwIF0gKiBbIHAxIF1cclxuICAgKiBbIHAycyBdID09IFsgIDMgIC02ICAgMyAgIDAgXSAqIFsgcDIgXVxyXG4gICAqIFsgcDNzIF0gICAgWyAtMSAgIDMgIC0zICAgMSBdICAgWyBwMyBdXHJcbiAgICpcclxuICAgKiBzZWUgQ3ViaWMuZ2V0T3ZlcmxhcHMgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBwb2x5bm9taWFsR2V0T3ZlcmxhcEN1YmljKCBwMHM6IG51bWJlciwgcDFzOiBudW1iZXIsIHAyczogbnVtYmVyLCBwM3M6IG51bWJlciwgcTBzOiBudW1iZXIsIHExczogbnVtYmVyLCBxMnM6IG51bWJlciwgcTNzOiBudW1iZXIgKTogUG9zc2libGVTaW1wbGVPdmVybGFwIHtcclxuICAgIGlmICggcTNzID09PSAwICkge1xyXG4gICAgICByZXR1cm4gU2VnbWVudC5wb2x5bm9taWFsR2V0T3ZlcmxhcFF1YWRyYXRpYyggcDBzLCBwMXMsIHAycywgcTBzLCBxMXMsIHEycyApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGEgPSBNYXRoLnNpZ24oIHAzcyAvIHEzcyApICogTWF0aC5wb3coIE1hdGguYWJzKCBwM3MgLyBxM3MgKSwgMSAvIDMgKTtcclxuICAgIGlmICggYSA9PT0gMCApIHtcclxuICAgICAgcmV0dXJuIG51bGw7IC8vIElmIHRoZXJlIHdvdWxkIGJlIHNvbHV0aW9ucywgdGhlbiBxM3Mgd291bGQgaGF2ZSBiZWVuIG5vbi16ZXJvXHJcbiAgICB9XHJcbiAgICBjb25zdCBiID0gKCBwMnMgLSBhICogYSAqIHEycyApIC8gKCAzICogYSAqIGEgKiBxM3MgKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGE6IGEsXHJcbiAgICAgIGI6IGJcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiB0aGUgcXVhZHJhdGljLXByZW11bHRpcGxpZWQgdmFsdWVzIGZvciB0d28gcXVhZHJhdGljIGJlemllciBjdXJ2ZXMsIGRldGVybWluZXMgKGlmIGF2YWlsYWJsZSkgYSBzcGVjaWZpZWQgKGEsYikgcGFpclxyXG4gICAqIHN1Y2ggdGhhdCBwKCB0ICkgPT09IHEoIGEgKiB0ICsgYiApLlxyXG4gICAqXHJcbiAgICogR2l2ZW4gYSAxLWRpbWVuc2lvbmFsIHF1YWRyYXRpYyBiZXppZXIgZGV0ZXJtaW5lZCBieSB0aGUgY29udHJvbCBwb2ludHMgcDAsIHAxLCBwMiwgY29tcHV0ZTpcclxuICAgKlxyXG4gICAqIFsgcDBzIF0gICAgWyAgMSAgIDAgICAwIF0gICBbIHAwIF1cclxuICAgKiBbIHAxcyBdID09IFsgLTIgICAyICAgMCBdICogWyBwMSBdXHJcbiAgICogWyBwMnMgXSAgICBbICAyICAtMiAgIDMgXSAqIFsgcDIgXVxyXG4gICAqXHJcbiAgICogc2VlIFF1YWRyYXRpYy5nZXRPdmVybGFwcyBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHBvbHlub21pYWxHZXRPdmVybGFwUXVhZHJhdGljKCBwMHM6IG51bWJlciwgcDFzOiBudW1iZXIsIHAyczogbnVtYmVyLCBxMHM6IG51bWJlciwgcTFzOiBudW1iZXIsIHEyczogbnVtYmVyICk6IFBvc3NpYmxlU2ltcGxlT3ZlcmxhcCB7XHJcbiAgICBpZiAoIHEycyA9PT0gMCApIHtcclxuICAgICAgcmV0dXJuIFNlZ21lbnQucG9seW5vbWlhbEdldE92ZXJsYXBMaW5lYXIoIHAwcywgcDFzLCBxMHMsIHExcyApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRpc2NyID0gcDJzIC8gcTJzO1xyXG4gICAgaWYgKCBkaXNjciA8IDAgKSB7XHJcbiAgICAgIHJldHVybiBudWxsOyAvLyBub3QgcG9zc2libGUgdG8gaGF2ZSBhIHNvbHV0aW9uIHdpdGggYW4gaW1hZ2luYXJ5IGFcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhID0gTWF0aC5zcXJ0KCBwMnMgLyBxMnMgKTtcclxuICAgIGlmICggYSA9PT0gMCApIHtcclxuICAgICAgcmV0dXJuIG51bGw7IC8vIElmIHRoZXJlIHdvdWxkIGJlIHNvbHV0aW9ucywgdGhlbiBxMnMgd291bGQgaGF2ZSBiZWVuIG5vbi16ZXJvXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYiA9ICggcDFzIC0gYSAqIHExcyApIC8gKCAyICogYSAqIHEycyApO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgYTogYSxcclxuICAgICAgYjogYlxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIHRoZSBsaW5lYXItcHJlbXVsdGlwbGllZCB2YWx1ZXMgZm9yIHR3byBsaW5lcywgZGV0ZXJtaW5lcyAoaWYgYXZhaWxhYmxlKSBhIHNwZWNpZmllZCAoYSxiKSBwYWlyXHJcbiAgICogc3VjaCB0aGF0IHAoIHQgKSA9PT0gcSggYSAqIHQgKyBiICkuXHJcbiAgICpcclxuICAgKiBHaXZlbiBhIGxpbmUgZGV0ZXJtaW5lZCBieSB0aGUgY29udHJvbCBwb2ludHMgcDAsIHAxLCBjb21wdXRlOlxyXG4gICAqXHJcbiAgICogWyBwMHMgXSA9PSBbICAxICAgMCBdICogWyBwMCBdXHJcbiAgICogWyBwMXMgXSA9PSBbIC0xICAgMSBdICogWyBwMSBdXHJcbiAgICpcclxuICAgKiBzZWUgUXVhZHJhdGljL0N1YmljLmdldE92ZXJsYXBzIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcG9seW5vbWlhbEdldE92ZXJsYXBMaW5lYXIoIHAwczogbnVtYmVyLCBwMXM6IG51bWJlciwgcTBzOiBudW1iZXIsIHExczogbnVtYmVyICk6IFBvc3NpYmxlU2ltcGxlT3ZlcmxhcCB7XHJcbiAgICBpZiAoIHExcyA9PT0gMCApIHtcclxuICAgICAgaWYgKCBwMHMgPT09IHEwcyApIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGEgPSBwMXMgLyBxMXM7XHJcbiAgICBpZiAoIGEgPT09IDAgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGIgPSAoIHAwcyAtIHEwcyApIC8gcTFzO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgYTogYSxcclxuICAgICAgYjogYlxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYWxsIHRoZSBkaXN0aW5jdCAobm9uLWVuZHBvaW50LCBub24tZmluaXRlKSBpbnRlcnNlY3Rpb25zIGJldHdlZW4gdGhlIHR3byBzZWdtZW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGludGVyc2VjdCggYTogU2VnbWVudCwgYjogU2VnbWVudCApOiBTZWdtZW50SW50ZXJzZWN0aW9uW10ge1xyXG4gICAgaWYgKCBMaW5lICYmIGEgaW5zdGFuY2VvZiBMaW5lICYmIGIgaW5zdGFuY2VvZiBMaW5lICkge1xyXG4gICAgICByZXR1cm4gTGluZS5pbnRlcnNlY3QoIGEsIGIgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBMaW5lICYmIGEgaW5zdGFuY2VvZiBMaW5lICkge1xyXG4gICAgICByZXR1cm4gTGluZS5pbnRlcnNlY3RPdGhlciggYSwgYiApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIExpbmUgJiYgYiBpbnN0YW5jZW9mIExpbmUgKSB7XHJcbiAgICAgIC8vIG5lZWQgdG8gc3dhcCBvdXIgaW50ZXJzZWN0aW9ucywgc2luY2UgJ2InIGlzIHRoZSBsaW5lXHJcbiAgICAgIHJldHVybiBMaW5lLmludGVyc2VjdE90aGVyKCBiLCBhICkubWFwKCBzd2FwU2VnbWVudEludGVyc2VjdGlvbiApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIEFyYyAmJiBhIGluc3RhbmNlb2YgQXJjICYmIGIgaW5zdGFuY2VvZiBBcmMgKSB7XHJcbiAgICAgIHJldHVybiBBcmMuaW50ZXJzZWN0KCBhLCBiICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggRWxsaXB0aWNhbEFyYyAmJiBhIGluc3RhbmNlb2YgRWxsaXB0aWNhbEFyYyAmJiBiIGluc3RhbmNlb2YgRWxsaXB0aWNhbEFyYyApIHtcclxuICAgICAgcmV0dXJuIEVsbGlwdGljYWxBcmMuaW50ZXJzZWN0KCBhLCBiICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggUXVhZHJhdGljICYmIEN1YmljICYmICggYSBpbnN0YW5jZW9mIFF1YWRyYXRpYyB8fCBhIGluc3RhbmNlb2YgQ3ViaWMgKSAmJiAoIGIgaW5zdGFuY2VvZiBRdWFkcmF0aWMgfHwgYiBpbnN0YW5jZW9mIEN1YmljICkgKSB7XHJcbiAgICAgIGNvbnN0IGN1YmljQSA9IGEgaW5zdGFuY2VvZiBDdWJpYyA/IGEgOiBhLmRlZ3JlZUVsZXZhdGVkKCk7XHJcbiAgICAgIGNvbnN0IGN1YmljQiA9IGIgaW5zdGFuY2VvZiBDdWJpYyA/IGIgOiBiLmRlZ3JlZUVsZXZhdGVkKCk7XHJcblxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIChubyB0eXBlIGRlZmluaXRpb25zIHlldCwgcGVyaGFwcyB1c2VmdWwgaWYgd2UgdXNlIGl0IG1vcmUpXHJcbiAgICAgIGNvbnN0IHBhcGVyQ3VydmVBID0gbmV3IHBhcGVyLkN1cnZlKCBjdWJpY0Euc3RhcnQueCwgY3ViaWNBLnN0YXJ0LnksIGN1YmljQS5jb250cm9sMS54LCBjdWJpY0EuY29udHJvbDEueSwgY3ViaWNBLmNvbnRyb2wyLngsIGN1YmljQS5jb250cm9sMi55LCBjdWJpY0EuZW5kLngsIGN1YmljQS5lbmQueSApO1xyXG5cclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciAobm8gdHlwZSBkZWZpbml0aW9ucyB5ZXQsIHBlcmhhcHMgdXNlZnVsIGlmIHdlIHVzZSBpdCBtb3JlKVxyXG4gICAgICBjb25zdCBwYXBlckN1cnZlQiA9IG5ldyBwYXBlci5DdXJ2ZSggY3ViaWNCLnN0YXJ0LngsIGN1YmljQi5zdGFydC55LCBjdWJpY0IuY29udHJvbDEueCwgY3ViaWNCLmNvbnRyb2wxLnksIGN1YmljQi5jb250cm9sMi54LCBjdWJpY0IuY29udHJvbDIueSwgY3ViaWNCLmVuZC54LCBjdWJpY0IuZW5kLnkgKTtcclxuXHJcbiAgICAgIGNvbnN0IHBhcGVySW50ZXJzZWN0aW9ucyA9IHBhcGVyQ3VydmVBLmdldEludGVyc2VjdGlvbnMoIHBhcGVyQ3VydmVCICk7XHJcbiAgICAgIHJldHVybiBwYXBlckludGVyc2VjdGlvbnMubWFwKCAoIHBhcGVySW50ZXJzZWN0aW9uOiBJbnRlbnRpb25hbEFueSApID0+IHtcclxuICAgICAgICBjb25zdCBwb2ludCA9IG5ldyBWZWN0b3IyKCBwYXBlckludGVyc2VjdGlvbi5wb2ludC54LCBwYXBlckludGVyc2VjdGlvbi5wb2ludC55ICk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBTZWdtZW50SW50ZXJzZWN0aW9uKCBwb2ludCwgcGFwZXJJbnRlcnNlY3Rpb24udGltZSwgcGFwZXJJbnRlcnNlY3Rpb24uaW50ZXJzZWN0aW9uLnRpbWUgKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBCb3VuZHNJbnRlcnNlY3Rpb24uaW50ZXJzZWN0KCBhLCBiICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgU2VnbWVudCBmcm9tIHRoZSBzZXJpYWxpemVkIHJlcHJlc2VudGF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZGVzZXJpYWxpemUoIG9iajogU2VyaWFsaXplZFNlZ21lbnQgKTogU2VnbWVudCB7XHJcbiAgICAvLyBUT0RPOiBqdXN0IGltcG9ydCB0aGVtIG5vdyB0aGF0IHdlIGhhdmUgY2lyY3VsYXIgcmVmZXJlbmNlIHByb3RlY3Rpb24sIGFuZCBzd2l0Y2ggYmV0d2VlbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETzogbmFtZXNwYWNpbmcgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvYmoudHlwZSAmJiBraXRlWyBvYmoudHlwZSBdICYmIGtpdGVbIG9iai50eXBlIF0uZGVzZXJpYWxpemUgKTtcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE86IG5hbWVzcGFjaW5nIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgcmV0dXJuIGtpdGVbIG9iai50eXBlIF0uZGVzZXJpYWxpemUoIG9iaiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgc3RhcnQvbWlkZGxlL2VuZCBwb2ludHMgYXJlIHJlcHJlc2VudGF0aXZlIG9mIGEgc3VmZmljaWVudGx5IGZsYXQgc2VnbWVudFxyXG4gICAqIChnaXZlbiBjZXJ0YWluIGVwc2lsb24gdmFsdWVzKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHN0YXJ0XHJcbiAgICogQHBhcmFtIG1pZGRsZVxyXG4gICAqIEBwYXJhbSBlbmRcclxuICAgKiBAcGFyYW0gZGlzdGFuY2VFcHNpbG9uIC0gY29udHJvbHMgbGV2ZWwgb2Ygc3ViZGl2aXNpb24gYnkgYXR0ZW1wdGluZyB0byBlbnN1cmUgYSBtYXhpbXVtIChzcXVhcmVkKVxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICBkZXZpYXRpb24gZnJvbSB0aGUgY3VydmVcclxuICAgKiBAcGFyYW0gY3VydmVFcHNpbG9uIC0gY29udHJvbHMgbGV2ZWwgb2Ygc3ViZGl2aXNpb24gYnkgYXR0ZW1wdGluZyB0byBlbnN1cmUgYSBtYXhpbXVtIGN1cnZhdHVyZSBjaGFuZ2VcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgYmV0d2VlbiBzZWdtZW50c1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgaXNTdWZmaWNpZW50bHlGbGF0KCBkaXN0YW5jZUVwc2lsb246IG51bWJlciwgY3VydmVFcHNpbG9uOiBudW1iZXIsIHN0YXJ0OiBWZWN0b3IyLCBtaWRkbGU6IFZlY3RvcjIsIGVuZDogVmVjdG9yMiApOiBib29sZWFuIHtcclxuICAgIC8vIGZsYXRuZXNzIGNyaXRlcmlvbjogQT1zdGFydCwgQj1lbmQsIEM9bWlkcG9pbnQsIGQwPWRpc3RhbmNlIGZyb20gQUIsIGQxPXx8Qi1BfHwsIHN1YmRpdmlkZSBpZiBkMC9kMSA+IHNxcnQoZXBzaWxvbilcclxuICAgIGlmICggVXRpbHMuZGlzdFRvU2VnbWVudFNxdWFyZWQoIG1pZGRsZSwgc3RhcnQsIGVuZCApIC8gc3RhcnQuZGlzdGFuY2VTcXVhcmVkKCBlbmQgKSA+IGN1cnZlRXBzaWxvbiApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLy8gZGV2aWF0aW9uIGNyaXRlcmlvblxyXG4gICAgaWYgKCBVdGlscy5kaXN0VG9TZWdtZW50U3F1YXJlZCggbWlkZGxlLCBzdGFydCwgZW5kICkgPiBkaXN0YW5jZUVwc2lsb24gKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBmaWx0ZXJDbG9zZXN0VG9Qb2ludFJlc3VsdCggcmVzdWx0czogQ2xvc2VzdFRvUG9pbnRSZXN1bHRbXSApOiBDbG9zZXN0VG9Qb2ludFJlc3VsdFtdIHtcclxuICAgIGlmICggcmVzdWx0cy5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjbG9zZXN0RGlzdGFuY2VTcXVhcmVkID0gXy5taW5CeSggcmVzdWx0cywgcmVzdWx0ID0+IHJlc3VsdC5kaXN0YW5jZVNxdWFyZWQgKSEuZGlzdGFuY2VTcXVhcmVkO1xyXG5cclxuICAgIC8vIFJldHVybiBhbGwgcmVzdWx0cyB0aGF0IGFyZSB3aXRoaW4gMWUtMTEgb2YgdGhlIGNsb3Nlc3QgZGlzdGFuY2UgKHRvIGFjY291bnQgZm9yIGZsb2F0aW5nIHBvaW50IGVycm9yKSwgYnV0IHVuaXF1ZVxyXG4gICAgLy8gYmFzZWQgb24gdGhlIGxvY2F0aW9uLlxyXG4gICAgcmV0dXJuIF8udW5pcVdpdGgoIHJlc3VsdHMuZmlsdGVyKCByZXN1bHQgPT4gTWF0aC5hYnMoIHJlc3VsdC5kaXN0YW5jZVNxdWFyZWQgLSBjbG9zZXN0RGlzdGFuY2VTcXVhcmVkICkgPCAxZS0xMSApLCAoIGEsIGIgKSA9PiBhLmNsb3Nlc3RQb2ludC5kaXN0YW5jZVNxdWFyZWQoIGIuY2xvc2VzdFBvaW50ICkgPCAxZS0xMSApO1xyXG4gIH1cclxufVxyXG5cclxua2l0ZS5yZWdpc3RlciggJ1NlZ21lbnQnLCBTZWdtZW50ICk7XHJcblxyXG5mdW5jdGlvbiBzd2FwU2VnbWVudEludGVyc2VjdGlvbiggc2VnbWVudEludGVyc2VjdGlvbjogU2VnbWVudEludGVyc2VjdGlvbiApOiBTZWdtZW50SW50ZXJzZWN0aW9uIHtcclxuICByZXR1cm4gc2VnbWVudEludGVyc2VjdGlvbi5nZXRTd2FwcGVkKCk7XHJcbn0iXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0EsT0FBT0EsV0FBVyxNQUFNLGlDQUFpQztBQUN6RCxPQUFPQyxPQUFPLE1BQU0sNEJBQTRCO0FBR2hELE9BQU9DLEtBQUssTUFBTSwwQkFBMEI7QUFDNUMsT0FBT0MsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxPQUFPQyxTQUFTLE1BQU0sb0NBQW9DO0FBRTFELFNBQVNDLEdBQUcsRUFBRUMsa0JBQWtCLEVBQUVDLEtBQUssRUFBRUMsYUFBYSxFQUFFQyxJQUFJLEVBQUVDLElBQUksRUFBRUMsU0FBUyxFQUFtQkMsbUJBQW1CLEVBQWdHQyxLQUFLLEVBQUVDLE9BQU8sUUFBUSxlQUFlOztBQXNCeFA7O0FBK0NBLGVBQWUsTUFBZUMsT0FBTyxDQUFDO0VBSTFCQyxXQUFXQSxDQUFBLEVBQUc7SUFDdEIsSUFBSSxDQUFDQyxtQkFBbUIsR0FBRyxJQUFJakIsV0FBVyxDQUFDLENBQUM7RUFDOUM7O0VBRUE7O0VBR0E7O0VBR0E7RUFDQTs7RUFHQTtFQUNBOztFQUdBOztF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