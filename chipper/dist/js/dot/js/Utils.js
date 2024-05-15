// Copyright 2013-2024, University of Colorado Boulder

/**
 * Utility functions for Dot, placed into the phet.dot.X namespace.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Big from '../../sherpa/lib/big-6.2.1.mjs'; // eslint-disable-line default-import-match-filename
import dot from './dot.js';
import Vector2 from './Vector2.js';
import Vector3 from './Vector3.js';

// constants
const EPSILON = Number.MIN_VALUE;
const TWO_PI = 2 * Math.PI;

// "static" variables used in boxMullerTransform
let generate;
let z0;
let z1;
const Utils = {
  /**
   * Returns the original value if it is inclusively within the [max,min] range. If it's below the range, min is
   * returned, and if it's above the range, max is returned.
   * @public
   *
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  clamp(value, min, max) {
    if (value < min) {
      return min;
    } else if (value > max) {
      return max;
    } else {
      return value;
    }
  },
  /**
   * Returns a number in the range $n\in[\mathrm{min},\mathrm{max})$ with the same equivalence class as the input
   * value mod (max-min), i.e. for a value $m$, $m\equiv n\ (\mathrm{mod}\ \mathrm{max}-\mathrm{min})$.
   * @public
   *
   * The 'down' indicates that if the value is equal to min or max, the max is returned.
   *
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  moduloBetweenDown(value, min, max) {
    assert && assert(max > min, 'max > min required for moduloBetween');
    const divisor = max - min;

    // get a partial result of value-min between [0,divisor)
    let partial = (value - min) % divisor;
    if (partial < 0) {
      // since if value-min < 0, the remainder will give us a negative number
      partial += divisor;
    }
    return partial + min; // add back in the minimum value
  },
  /**
   * Returns a number in the range $n\in(\mathrm{min},\mathrm{max}]$ with the same equivalence class as the input
   * value mod (max-min), i.e. for a value $m$, $m\equiv n\ (\mathrm{mod}\ \mathrm{max}-\mathrm{min})$.
   * @public
   *
   * The 'up' indicates that if the value is equal to min or max, the min is returned.
   *
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  moduloBetweenUp(value, min, max) {
    return -Utils.moduloBetweenDown(-value, -max, -min);
  },
  /**
   * Returns an array of integers from A to B (inclusive), e.g. rangeInclusive( 4, 7 ) maps to [ 4, 5, 6, 7 ].
   * @public
   *
   * @param {number} a
   * @param {number} b
   * @returns {Array.<number>}
   */
  rangeInclusive(a, b) {
    if (b < a) {
      return [];
    }
    const result = new Array(b - a + 1);
    for (let i = a; i <= b; i++) {
      result[i - a] = i;
    }
    return result;
  },
  /**
   * Returns an array of integers from A to B (exclusive), e.g. rangeExclusive( 4, 7 ) maps to [ 5, 6 ].
   * @public
   *
   * @param {number} a
   * @param {number} b
   * @returns {Array.<number>}
   */
  rangeExclusive(a, b) {
    return Utils.rangeInclusive(a + 1, b - 1);
  },
  /**
   * Converts degrees to radians.
   * @public
   *
   * @param {number} degrees
   * @returns {number}
   */
  toRadians(degrees) {
    return Math.PI * degrees / 180;
  },
  /**
   * Converts radians to degrees.
   * @public
   *
   * @param {number} radians
   * @returns {number}
   */
  toDegrees(radians) {
    return 180 * radians / Math.PI;
  },
  /**
   * Workaround for broken modulo operator.
   * E.g. on iOS9, 1e10 % 1e10 -> 2.65249474e-315
   * See https://github.com/phetsims/dot/issues/75
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  mod(a, b) {
    if (a / b % 1 === 0) {
      return 0; // a is a multiple of b
    } else {
      return a % b;
    }
  },
  /**
   * Greatest Common Divisor, using https://en.wikipedia.org/wiki/Euclidean_algorithm. See
   * https://en.wikipedia.org/wiki/Greatest_common_divisor
   * @public
   *
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  gcd(a, b) {
    return Math.abs(b === 0 ? a : this.gcd(b, Utils.mod(a, b)));
  },
  /**
   * Least Common Multiple, https://en.wikipedia.org/wiki/Least_common_multiple
   * @public
   *
   * @param {number} a
   * @param {number} b
   * @returns {number} lcm, an integer
   */
  lcm(a, b) {
    return Utils.roundSymmetric(Math.abs(a * b) / Utils.gcd(a, b));
  },
  /**
   * Intersection point between the lines defined by the line segments p1-p2 and p3-p4. If the
   * lines are not properly defined, null is returned. If there are no intersections or infinitely many,
   * e.g. parallel lines, null is returned.
   * @public
   *
   * @param {Vector2} p1
   * @param {Vector2} p2
   * @param {Vector2} p3
   * @param {Vector2} p4
   * @returns {Vector2|null}
   */
  lineLineIntersection(p1, p2, p3, p4) {
    const epsilon = 1e-10;

    // If the endpoints are the same, they don't properly define a line
    if (p1.equals(p2) || p3.equals(p4)) {
      return null;
    }

    // Taken from an answer in
    // http://stackoverflow.com/questions/385305/efficient-maths-algorithm-to-calculate-intersections
    const x12 = p1.x - p2.x;
    const x34 = p3.x - p4.x;
    const y12 = p1.y - p2.y;
    const y34 = p3.y - p4.y;
    const denom = x12 * y34 - y12 * x34;

    // If the denominator is 0, lines are parallel or coincident
    if (Math.abs(denom) < epsilon) {
      return null;
    }

    // define intersection using determinants, see https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
    const a = p1.x * p2.y - p1.y * p2.x;
    const b = p3.x * p4.y - p3.y * p4.x;
    return new Vector2((a * x34 - x12 * b) / denom, (a * y34 - y12 * b) / denom);
  },
  /**
   * Returns the center of a circle that will lie on 3 points (if it exists), otherwise null (if collinear).
   * @public
   *
   * @param {Vector2} p1
   * @param {Vector2} p2
   * @param {Vector2} p3
   * @returns {Vector2|null}
   */
  circleCenterFromPoints(p1, p2, p3) {
    // TODO: Can we make scratch vectors here, avoiding the circular reference? https://github.com/phetsims/dot/issues/96

    // midpoints between p1-p2 and p2-p3
    const p12 = new Vector2((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    const p23 = new Vector2((p2.x + p3.x) / 2, (p2.y + p3.y) / 2);

    // perpendicular points from the minpoints
    const p12x = new Vector2(p12.x + (p2.y - p1.y), p12.y - (p2.x - p1.x));
    const p23x = new Vector2(p23.x + (p3.y - p2.y), p23.y - (p3.x - p2.x));
    return Utils.lineLineIntersection(p12, p12x, p23, p23x);
  },
  /**
   * Returns whether the point p is inside the circle defined by the other three points (p1, p2, p3).
   * @public
   *
   * NOTE: p1,p2,p3 should be specified in a counterclockwise (mathematically) order, and thus should have a positive
   * signed area.
   *
   * See notes in https://en.wikipedia.org/wiki/Delaunay_triangulation.
   *
   * @param {Vector2} p1
   * @param {Vector2} p2
   * @param {Vector2} p3
   * @param {Vector2} p
   * @returns {boolean}
   */
  pointInCircleFromPoints(p1, p2, p3, p) {
    assert && assert(Utils.triangleAreaSigned(p1, p2, p3) > 0, 'Defined points should be in a counterclockwise order');
    const m00 = p1.x - p.x;
    const m01 = p1.y - p.y;
    const m02 = (p1.x - p.x) * (p1.x - p.x) + (p1.y - p.y) * (p1.y - p.y);
    const m10 = p2.x - p.x;
    const m11 = p2.y - p.y;
    const m12 = (p2.x - p.x) * (p2.x - p.x) + (p2.y - p.y) * (p2.y - p.y);
    const m20 = p3.x - p.x;
    const m21 = p3.y - p.y;
    const m22 = (p3.x - p.x) * (p3.x - p.x) + (p3.y - p.y) * (p3.y - p.y);
    const determinant = m00 * m11 * m22 + m01 * m12 * m20 + m02 * m10 * m21 - m02 * m11 * m20 - m01 * m10 * m22 - m00 * m12 * m21;
    return determinant > 0;
  },
  /**
   * Ray-sphere intersection, returning information about the closest intersection. Assumes the sphere is centered
   * at the origin (for ease of computation), transform the ray to compensate if needed.
   * @public
   *
   * If there is no intersection, null is returned. Otherwise an object will be returned like:
   * <pre class="brush: js">
   * {
   *   distance: {number}, // distance from the ray position to the intersection
   *   hitPoint: {Vector3}, // location of the intersection
   *   normal: {Vector3}, // the normal of the sphere's surface at the intersection
   *   fromOutside: {boolean}, // whether the ray intersected the sphere from outside the sphere first
   * }
   * </pre>
   *
   * @param {number} radius
   * @param {Ray3} ray
   * @param {number} epsilon
   * @returns {Object}
   */
  // assumes a sphere with the specified radius, centered at the origin
  sphereRayIntersection(radius, ray, epsilon) {
    epsilon = epsilon === undefined ? 1e-5 : epsilon;

    // center is the origin for now, but leaving in computations so that we can change that in the future. optimize away if needed
    const center = new Vector3(0, 0, 0);
    const rayDir = ray.direction;
    const pos = ray.position;
    const centerToRay = pos.minus(center);

    // basically, we can use the quadratic equation to solve for both possible hit points (both +- roots are the hit points)
    const tmp = rayDir.dot(centerToRay);
    const centerToRayDistSq = centerToRay.magnitudeSquared;
    const det = 4 * tmp * tmp - 4 * (centerToRayDistSq - radius * radius);
    if (det < epsilon) {
      // ray misses sphere entirely
      return null;
    }
    const base = rayDir.dot(center) - rayDir.dot(pos);
    const sqt = Math.sqrt(det) / 2;

    // the "first" entry point distance into the sphere. if we are inside the sphere, it is behind us
    const ta = base - sqt;

    // the "second" entry point distance
    const tb = base + sqt;
    if (tb < epsilon) {
      // sphere is behind ray, so don't return an intersection
      return null;
    }
    const hitPositionB = ray.pointAtDistance(tb);
    const normalB = hitPositionB.minus(center).normalized();
    if (ta < epsilon) {
      // we are inside the sphere
      // in => out
      return {
        distance: tb,
        hitPoint: hitPositionB,
        normal: normalB.negated(),
        fromOutside: false
      };
    } else {
      // two possible hits
      const hitPositionA = ray.pointAtDistance(ta);
      const normalA = hitPositionA.minus(center).normalized();

      // close hit, we have out => in
      return {
        distance: ta,
        hitPoint: hitPositionA,
        normal: normalA,
        fromOutside: true
      };
    }
  },
  /**
   * Returns an array of the real roots of the quadratic equation $ax + b=0$, or null if every value is a solution.
   * @public
   *
   * @param {number} a
   * @param {number} b
   * @returns {Array.<number>|null} - The real roots of the equation, or null if all values are roots. If the root has
   *                                  a multiplicity larger than 1, it will be repeated that many times.
   */
  solveLinearRootsReal(a, b) {
    if (a === 0) {
      if (b === 0) {
        return null;
      } else {
        return [];
      }
    } else {
      return [-b / a];
    }
  },
  /**
   * Returns an array of the real roots of the quadratic equation $ax^2 + bx + c=0$, or null if every value is a
   * solution. If a is nonzero, there should be between 0 and 2 (inclusive) values returned.
   * @public
   *
   * @param {number} a
   * @param {number} b
   * @param {number} c
   * @returns {Array.<number>|null} - The real roots of the equation, or null if all values are roots. If the root has
   *                                  a multiplicity larger than 1, it will be repeated that many times.
   */
  solveQuadraticRootsReal(a, b, c) {
    // Check for a degenerate case where we don't have a quadratic, or if the order of magnitude is such where the
    // linear solution would be expected
    const epsilon = 1E7;
    if (a === 0 || Math.abs(b / a) > epsilon || Math.abs(c / a) > epsilon) {
      return Utils.solveLinearRootsReal(b, c);
    }
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
      return [];
    }
    const sqrt = Math.sqrt(discriminant);
    // TODO: how to handle if discriminant is 0? give unique root or double it? https://github.com/phetsims/dot/issues/96
    // TODO: probably just use Complex for the future https://github.com/phetsims/dot/issues/96
    return [(-b - sqrt) / (2 * a), (-b + sqrt) / (2 * a)];
  },
  /**
   * Returns an array of the real roots of the cubic equation $ax^3 + bx^2 + cx + d=0$, or null if every value is a
   * solution. If a is nonzero, there should be between 0 and 3 (inclusive) values returned.
   * @public
   *
   * @param {number} a
   * @param {number} b
   * @param {number} c
   * @param {number} d
   * @param {number} [discriminantThreshold] - for determining whether we have a single real root
   * @returns {Array.<number>|null} - The real roots of the equation, or null if all values are roots. If the root has
   *                                  a multiplicity larger than 1, it will be repeated that many times.
   */
  solveCubicRootsReal(a, b, c, d, discriminantThreshold = 1e-7) {
    let roots;

    // TODO: a Complex type! https://github.com/phetsims/dot/issues/96

    // Check for a degenerate case where we don't have a cubic
    if (a === 0) {
      roots = Utils.solveQuadraticRootsReal(b, c, d);
    } else {
      //We need to test whether a is several orders of magnitude less than b, c, d
      const epsilon = 1E7;
      if (a === 0 || Math.abs(b / a) > epsilon || Math.abs(c / a) > epsilon || Math.abs(d / a) > epsilon) {
        roots = Utils.solveQuadraticRootsReal(b, c, d);
      } else {
        if (d === 0 || Math.abs(a / d) > epsilon || Math.abs(b / d) > epsilon || Math.abs(c / d) > epsilon) {
          roots = [0].concat(Utils.solveQuadraticRootsReal(a, b, c));
        } else {
          b /= a;
          c /= a;
          d /= a;
          const q = (3.0 * c - b * b) / 9;
          const r = (-(27 * d) + b * (9 * c - 2 * (b * b))) / 54;
          const discriminant = q * q * q + r * r;
          const b3 = b / 3;
          if (discriminant > discriminantThreshold) {
            // a single real root
            const dsqrt = Math.sqrt(discriminant);
            roots = [Utils.cubeRoot(r + dsqrt) + Utils.cubeRoot(r - dsqrt) - b3];
          } else if (discriminant > -discriminantThreshold) {
            // would truly be discriminant==0, but floating-point error
            // contains a double root (but with three roots)
            const rsqrt = Utils.cubeRoot(r);
            const doubleRoot = -b3 - rsqrt;
            roots = [-b3 + 2 * rsqrt, doubleRoot, doubleRoot];
          } else {
            // all unique (three roots)
            let qX = -q * q * q;
            qX = Math.acos(r / Math.sqrt(qX));
            const rr = 2 * Math.sqrt(-q);
            roots = [-b3 + rr * Math.cos(qX / 3), -b3 + rr * Math.cos((qX + 2 * Math.PI) / 3), -b3 + rr * Math.cos((qX + 4 * Math.PI) / 3)];
          }
        }
      }
    }
    assert && roots && roots.forEach(root => assert(isFinite(root), 'All returned solveCubicRootsReal roots should be finite'));
    return roots;
  },
  /**
   * Returns the unique real cube root of x, such that $y^3=x$.
   * @public
   *
   * @param {number} x
   * @returns {number}
   */
  cubeRoot(x) {
    return x >= 0 ? Math.pow(x, 1 / 3) : -Math.pow(-x, 1 / 3);
  },
  /**
   * Defines and evaluates a linear mapping. The mapping is defined so that $f(a_1)=b_1$ and $f(a_2)=b_2$, and other
   * values are interpolated along the linear equation. The returned value is $f(a_3)$.
   * @public
   *
   * @param {number} a1
   * @param {number} a2
   * @param {number} b1
   * @param {number} b2
   * @param {number} a3
   * @returns {number}
   */
  linear(a1, a2, b1, b2, a3) {
    assert && assert(typeof a3 === 'number', 'linear requires a number to evaluate');
    return (b2 - b1) / (a2 - a1) * (a3 - a1) + b1;
  },
  /**
   * Rounds using "Round half away from zero" algorithm. See dot#35.
   * @public
   *
   * JavaScript's Math.round is not symmetric for positive and negative numbers, it uses IEEE 754 "Round half up".
   * See https://en.wikipedia.org/wiki/Rounding#Round_half_up.
   * For sims, we want to treat positive and negative values symmetrically, which is IEEE 754 "Round half away from zero",
   * See https://en.wikipedia.org/wiki/Rounding#Round_half_away_from_zero
   *
   * Note that -0 is rounded to 0, since we typically do not want to display -0 in sims.
   *
   * @param {number} value                               `
   * @returns {number}
   */
  roundSymmetric(value) {
    return (value < 0 ? -1 : 1) * Math.round(Math.abs(value)); // eslint-disable-line bad-sim-text
  },
  /**
   * A predictable implementation of toFixed.
   * @public
   *
   * JavaScript's toFixed is notoriously buggy, behavior differs depending on browser,
   * because the spec doesn't specify whether to round or floor.
   * Rounding is symmetric for positive and negative values, see Utils.roundSymmetric.
   *
   * @param {number} value
   * @param {number} decimalPlaces
   * @returns {string}
   */
  toFixed(value, decimalPlaces) {
    assert && assert(typeof value === 'number');
    assert && assert(Number.isInteger(decimalPlaces), `decimal places must be an integer: ${decimalPlaces}`);
    if (isNaN(value)) {
      return 'NaN';
    } else if (value === Number.POSITIVE_INFINITY) {
      return 'Infinity';
    } else if (value === Number.NEGATIVE_INFINITY) {
      return '-Infinity';
    }

    // eslint-disable-next-line bad-sim-text
    const result = new Big(value).toFixed(decimalPlaces);

    // Avoid reporting -0.000
    if (result.startsWith('-0.') && Number.parseFloat(result) === 0) {
      return '0' + result.slice(2);
    } else {
      return result;
    }
  },
  /**
   * A predictable implementation of toFixed, where the result is returned as a number instead of a string.
   * @public
   *
   * JavaScript's toFixed is notoriously buggy, behavior differs depending on browser,
   * because the spec doesn't specify whether to round or floor.
   * Rounding is symmetric for positive and negative values, see Utils.roundSymmetric.
   *
   * @param {number} value
   * @param {number} decimalPlaces
   * @returns {number}
   */
  toFixedNumber(value, decimalPlaces) {
    return parseFloat(Utils.toFixed(value, decimalPlaces));
  },
  /**
   * Returns true if two numbers are within epsilon of each other.
   *
   * @param {number} a
   * @param {number} b
   * @param {number} epsilon
   * @returns {boolean}
   */
  equalsEpsilon(a, b, epsilon) {
    return Math.abs(a - b) <= epsilon;
  },
  /**
   * Computes the intersection of the two line segments $(x_1,y_1)(x_2,y_2)$ and $(x_3,y_3)(x_4,y_4)$. If there is no
   * intersection, null is returned.
   * @public
   *
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {number} x3
   * @param {number} y3
   * @param {number} x4
   * @param {number} y4
   * @returns {Vector2|null}
   */
  lineSegmentIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    // @private
    // Determines counterclockwiseness. Positive if counterclockwise, negative if clockwise, zero if straight line
    // Point1(a,b), Point2(c,d), Point3(e,f)
    // See http://jeffe.cs.illinois.edu/teaching/373/notes/x05-convexhull.pdf
    // @returns {number}
    const ccw = (a, b, c, d, e, f) => (f - b) * (c - a) - (d - b) * (e - a);

    // Check if intersection doesn't exist. See http://jeffe.cs.illinois.edu/teaching/373/notes/x06-sweepline.pdf
    // If point1 and point2 are on opposite sides of line 3 4, exactly one of the two triples 1, 3, 4 and 2, 3, 4
    // is in counterclockwise order.
    if (ccw(x1, y1, x3, y3, x4, y4) * ccw(x2, y2, x3, y3, x4, y4) > 0 || ccw(x3, y3, x1, y1, x2, y2) * ccw(x4, y4, x1, y1, x2, y2) > 0) {
      return null;
    }
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    // If denominator is 0, the lines are parallel or coincident
    if (Math.abs(denom) < 1e-10) {
      return null;
    }

    // Check if there is an exact endpoint overlap (and then return an exact answer).
    if (x1 === x3 && y1 === y3 || x1 === x4 && y1 === y4) {
      return new Vector2(x1, y1);
    } else if (x2 === x3 && y2 === y3 || x2 === x4 && y2 === y4) {
      return new Vector2(x2, y2);
    }

    // Use determinants to calculate intersection, see https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
    const intersectionX = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
    const intersectionY = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;
    return new Vector2(intersectionX, intersectionY);
  },
  /**
   * Squared distance from a point to a line segment squared.
   * See http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
   * @public
   *
   * @param {Vector2} point - The point
   * @param {Vector2} a - Starting point of the line segment
   * @param {Vector2} b - Ending point of the line segment
   * @returns {number}
   */
  distToSegmentSquared(point, a, b) {
    // the square of the distance between a and b,
    const segmentSquaredLength = a.distanceSquared(b);

    // if the segment length is zero, the a and b point are coincident. return the squared distance between a and point
    if (segmentSquaredLength === 0) {
      return point.distanceSquared(a);
    }

    // the t value parametrize the projection of the point onto the a b line
    const t = ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / segmentSquaredLength;
    let distanceSquared;
    if (t < 0) {
      // if t<0, the projection point is outside the ab line, beyond a
      distanceSquared = point.distanceSquared(a);
    } else if (t > 1) {
      // if t>1, the projection past is outside the ab segment, beyond b,
      distanceSquared = point.distanceSquared(b);
    } else {
      // if 0<t<1, the projection point lies along the line joining a and b.
      distanceSquared = point.distanceSquared(new Vector2(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y)));
    }
    return distanceSquared;
  },
  /**
   * distance from a point to a line segment squared.
   * @public
   *
   * @param {Vector2} point - The point
   * @param {Vector2} a - Starting point of the line segment
   * @param {Vector2} b - Ending point of the line segment
   * @returns {number}
   */
  distToSegment(point, a, b) {
    return Math.sqrt(this.distToSegmentSquared(point, a, b));
  },
  /**
   * Determines whether the three points are approximately collinear.
   * @public
   *
   * @param {Vector2} a
   * @param {Vector2} b
   * @param {Vector2} c
   * @param {number} [epsilon]
   * @returns {boolean}
   */
  arePointsCollinear(a, b, c, epsilon) {
    if (epsilon === undefined) {
      epsilon = 0;
    }
    return Utils.triangleArea(a, b, c) <= epsilon;
  },
  /**
   * The area inside the triangle defined by the three vertices.
   * @public
   *
   * @param {Vector2} a
   * @param {Vector2} b
   * @param {Vector2} c
   * @returns {number}
   */
  triangleArea(a, b, c) {
    return Math.abs(Utils.triangleAreaSigned(a, b, c));
  },
  /**
   * The area inside the triangle defined by the three vertices, but with the sign determined by whether the vertices
   * provided are clockwise or counter-clockwise.
   * @public
   *
   * If the vertices are counterclockwise (in a right-handed coordinate system), then the signed area will be
   * positive.
   *
   * @param {Vector2} a
   * @param {Vector2} b
   * @param {Vector2} c
   * @returns {number}
   */
  triangleAreaSigned(a, b, c) {
    return a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y);
  },
  /**
   * Returns the centroid of the simple planar polygon using Green's Theorem P=-y/2, Q=x/2 (similar to how kite
   * computes areas). See also https://en.wikipedia.org/wiki/Shoelace_formula.
   * @public
   *
   * @param {Array.<Vector2>} vertices
   * @returns {Vector2}
   */
  centroidOfPolygon(vertices) {
    const centroid = new Vector2(0, 0);
    let area = 0;
    vertices.forEach((v0, i) => {
      const v1 = vertices[(i + 1) % vertices.length];
      const doubleShoelace = v0.x * v1.y - v1.x * v0.y;
      area += doubleShoelace / 2;

      // Compute the centroid of the flat intersection with https://en.wikipedia.org/wiki/Centroid#Of_a_polygon
      centroid.addXY((v0.x + v1.x) * doubleShoelace, (v0.y + v1.y) * doubleShoelace);
    });
    centroid.divideScalar(6 * area);
    return centroid;
  },
  /**
   * Function that returns the hyperbolic cosine of a number
   * @public
   *
   * @param {number} value
   * @returns {number}
   */
  cosh(value) {
    return (Math.exp(value) + Math.exp(-value)) / 2;
  },
  /**
   * Function that returns the hyperbolic sine of a number
   * @public
   *
   * @param {number} value
   * @returns {number}
   */
  sinh(value) {
    return (Math.exp(value) - Math.exp(-value)) / 2;
  },
  /**
   * Log base-10, since it wasn't included in every supported browser.
   * @public
   *
   * @param {number} val
   * @returns {number}
   */
  log10(val) {
    return Math.log(val) / Math.LN10;
  },
  /**
   * Generates a random Gaussian sample with the given mean and standard deviation.
   * This method relies on the "static" variables generate, z0, and z1 defined above.
   * Random.js is the primary client of this function, but it is defined here so it can be
   * used other places more easily if need be.
   * Code inspired by example here: https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform.
   * @public
   *
   * @param {number} mu - The mean of the Gaussian
   * @param {number} sigma - The standard deviation of the Gaussian
   * @param {Random} random - the source of randomness
   * @returns {number}
   */
  boxMullerTransform(mu, sigma, random) {
    generate = !generate;
    if (!generate) {
      return z1 * sigma + mu;
    }
    let u1;
    let u2;
    do {
      u1 = random.nextDouble();
      u2 = random.nextDouble();
    } while (u1 <= EPSILON);
    z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(TWO_PI * u2);
    z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(TWO_PI * u2);
    return z0 * sigma + mu;
  },
  /**
   * Determines the number of decimal places in a value.
   * @public
   *
   * @param {number} value - a finite number, scientific notation is not supported for decimal numbers
   * @returns {number}
   */
  numberOfDecimalPlaces(value) {
    assert && assert(typeof value === 'number' && isFinite(value), `value must be a finite number ${value}`);
    if (Math.floor(value) === value) {
      return 0;
    } else {
      const string = value.toString();

      // Handle scientific notation
      if (string.includes('e')) {
        // e.g. '1e-21', '5.6e+34', etc.
        const split = string.split('e');
        const mantissa = split[0]; // The left part, e.g. '1' or '5.6'
        const exponent = Number(split[1]); // The right part, e.g. '-21' or '+34'

        // How many decimal places are there in the left part
        const mantissaDecimalPlaces = mantissa.includes('.') ? mantissa.split('.')[1].length : 0;

        // We adjust the number of decimal places by the exponent, e.g. '1.5e1' has zero decimal places, and
        // '1.5e-2' has three.
        return Math.max(mantissaDecimalPlaces - exponent, 0);
      } else {
        // Handle decimal notation. Since we're not an integer, we should be guaranteed to have a decimal
        return string.split('.')[1].length;
      }
    }
  },
  /**
   * Rounds a value to a multiple of a specified interval.
   * Examples:
   * roundToInterval( 0.567, 0.01 ) -> 0.57
   * roundToInterval( 0.567, 0.02 ) -> 0.56
   * roundToInterval( 5.67, 0.5 ) -> 5.5
   *
   * @param {number} value
   * @param {number} interval
   * @returns {number}
   */
  roundToInterval(value, interval) {
    return Utils.toFixedNumber(Utils.roundSymmetric(value / interval) * interval, Utils.numberOfDecimalPlaces(interval));
  }
};
dot.register('Utils', Utils);

// make these available in the main namespace directly (for now)
dot.clamp = Utils.clamp;
dot.moduloBetweenDown = Utils.moduloBetweenDown;
dot.moduloBetweenUp = Utils.moduloBetweenUp;
dot.rangeInclusive = Utils.rangeInclusive;
dot.rangeExclusive = Utils.rangeExclusive;
dot.toRadians = Utils.toRadians;
dot.toDegrees = Utils.toDegrees;
dot.lineLineIntersection = Utils.lineLineIntersection;
dot.lineSegmentIntersection = Utils.lineSegmentIntersection;
dot.sphereRayIntersection = Utils.sphereRayIntersection;
dot.solveQuadraticRootsReal = Utils.solveQuadraticRootsReal;
dot.solveCubicRootsReal = Utils.solveCubicRootsReal;
dot.cubeRoot = Utils.cubeRoot;
dot.linear = Utils.linear;
dot.boxMullerTransform = Utils.boxMullerTransform;
export default Utils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCaWciLCJkb3QiLCJWZWN0b3IyIiwiVmVjdG9yMyIsIkVQU0lMT04iLCJOdW1iZXIiLCJNSU5fVkFMVUUiLCJUV09fUEkiLCJNYXRoIiwiUEkiLCJnZW5lcmF0ZSIsInowIiwiejEiLCJVdGlscyIsImNsYW1wIiwidmFsdWUiLCJtaW4iLCJtYXgiLCJtb2R1bG9CZXR3ZWVuRG93biIsImFzc2VydCIsImRpdmlzb3IiLCJwYXJ0aWFsIiwibW9kdWxvQmV0d2VlblVwIiwicmFuZ2VJbmNsdXNpdmUiLCJhIiwiYiIsInJlc3VsdCIsIkFycmF5IiwiaSIsInJhbmdlRXhjbHVzaXZlIiwidG9SYWRpYW5zIiwiZGVncmVlcyIsInRvRGVncmVlcyIsInJhZGlhbnMiLCJtb2QiLCJnY2QiLCJhYnMiLCJsY20iLCJyb3VuZFN5bW1ldHJpYyIsImxpbmVMaW5lSW50ZXJzZWN0aW9uIiwicDEiLCJwMiIsInAzIiwicDQiLCJlcHNpbG9uIiwiZXF1YWxzIiwieDEyIiwieCIsIngzNCIsInkxMiIsInkiLCJ5MzQiLCJkZW5vbSIsImNpcmNsZUNlbnRlckZyb21Qb2ludHMiLCJwMTIiLCJwMjMiLCJwMTJ4IiwicDIzeCIsInBvaW50SW5DaXJjbGVGcm9tUG9pbnRzIiwicCIsInRyaWFuZ2xlQXJlYVNpZ25lZCIsIm0wMCIsIm0wMSIsIm0wMiIsIm0xMCIsIm0xMSIsIm0xMiIsIm0yMCIsIm0yMSIsIm0yMiIsImRldGVybWluYW50Iiwic3BoZXJlUmF5SW50ZXJzZWN0aW9uIiwicmFkaXVzIiwicmF5IiwidW5kZWZpbmVkIiwiY2VudGVyIiwicmF5RGlyIiwiZGlyZWN0aW9uIiwicG9zIiwicG9zaXRpb24iLCJjZW50ZXJUb1JheSIsIm1pbnVzIiwidG1wIiwiY2VudGVyVG9SYXlEaXN0U3EiLCJtYWduaXR1ZGVTcXVhcmVkIiwiZGV0IiwiYmFzZSIsInNxdCIsInNxcnQiLCJ0YSIsInRiIiwiaGl0UG9zaXRpb25CIiwicG9pbnRBdERpc3RhbmNlIiwibm9ybWFsQiIsIm5vcm1hbGl6ZWQiLCJkaXN0YW5jZSIsImhpdFBvaW50Iiwibm9ybWFsIiwibmVnYXRlZCIsImZyb21PdXRzaWRlIiwiaGl0UG9zaXRpb25BIiwibm9ybWFsQSIsInNvbHZlTGluZWFyUm9vdHNSZWFsIiwic29sdmVRdWFkcmF0aWNSb290c1JlYWwiLCJjIiwiZGlzY3JpbWluYW50Iiwic29sdmVDdWJpY1Jvb3RzUmVhbCIsImQiLCJkaXNjcmltaW5hbnRUaHJlc2hvbGQiLCJyb290cyIsImNvbmNhdCIsInEiLCJyIiwiYjMiLCJkc3FydCIsImN1YmVSb290IiwicnNxcnQiLCJkb3VibGVSb290IiwicVgiLCJhY29zIiwicnIiLCJjb3MiLCJmb3JFYWNoIiwicm9vdCIsImlzRmluaXRlIiwicG93IiwibGluZWFyIiwiYTEiLCJhMiIsImIxIiwiYjIiLCJhMyIsInJvdW5kIiwidG9GaXhlZCIsImRlY2ltYWxQbGFjZXMiLCJpc0ludGVnZXIiLCJpc05hTiIsIlBPU0lUSVZFX0lORklOSVRZIiwiTkVHQVRJVkVfSU5GSU5JVFkiLCJzdGFydHNXaXRoIiwicGFyc2VGbG9hdCIsInNsaWNlIiwidG9GaXhlZE51bWJlciIsImVxdWFsc0Vwc2lsb24iLCJsaW5lU2VnbWVudEludGVyc2VjdGlvbiIsIngxIiwieTEiLCJ4MiIsInkyIiwieDMiLCJ5MyIsIng0IiwieTQiLCJjY3ciLCJlIiwiZiIsImludGVyc2VjdGlvblgiLCJpbnRlcnNlY3Rpb25ZIiwiZGlzdFRvU2VnbWVudFNxdWFyZWQiLCJwb2ludCIsInNlZ21lbnRTcXVhcmVkTGVuZ3RoIiwiZGlzdGFuY2VTcXVhcmVkIiwidCIsImRpc3RUb1NlZ21lbnQiLCJhcmVQb2ludHNDb2xsaW5lYXIiLCJ0cmlhbmdsZUFyZWEiLCJjZW50cm9pZE9mUG9seWdvbiIsInZlcnRpY2VzIiwiY2VudHJvaWQiLCJhcmVhIiwidjAiLCJ2MSIsImxlbmd0aCIsImRvdWJsZVNob2VsYWNlIiwiYWRkWFkiLCJkaXZpZGVTY2FsYXIiLCJjb3NoIiwiZXhwIiwic2luaCIsImxvZzEwIiwidmFsIiwibG9nIiwiTE4xMCIsImJveE11bGxlclRyYW5zZm9ybSIsIm11Iiwic2lnbWEiLCJyYW5kb20iLCJ1MSIsInUyIiwibmV4dERvdWJsZSIsInNpbiIsIm51bWJlck9mRGVjaW1hbFBsYWNlcyIsImZsb29yIiwic3RyaW5nIiwidG9TdHJpbmciLCJpbmNsdWRlcyIsInNwbGl0IiwibWFudGlzc2EiLCJleHBvbmVudCIsIm1hbnRpc3NhRGVjaW1hbFBsYWNlcyIsInJvdW5kVG9JbnRlcnZhbCIsImludGVydmFsIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJVdGlscy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBVdGlsaXR5IGZ1bmN0aW9ucyBmb3IgRG90LCBwbGFjZWQgaW50byB0aGUgcGhldC5kb3QuWCBuYW1lc3BhY2UuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgQmlnIGZyb20gJy4uLy4uL3NoZXJwYS9saWIvYmlnLTYuMi4xLm1qcyc7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZGVmYXVsdC1pbXBvcnQtbWF0Y2gtZmlsZW5hbWVcclxuaW1wb3J0IGRvdCBmcm9tICcuL2RvdC5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4vVmVjdG9yMi5qcyc7XHJcbmltcG9ydCBWZWN0b3IzIGZyb20gJy4vVmVjdG9yMy5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgRVBTSUxPTiA9IE51bWJlci5NSU5fVkFMVUU7XHJcbmNvbnN0IFRXT19QSSA9IDIgKiBNYXRoLlBJO1xyXG5cclxuLy8gXCJzdGF0aWNcIiB2YXJpYWJsZXMgdXNlZCBpbiBib3hNdWxsZXJUcmFuc2Zvcm1cclxubGV0IGdlbmVyYXRlO1xyXG5sZXQgejA7XHJcbmxldCB6MTtcclxuXHJcbmNvbnN0IFV0aWxzID0ge1xyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG9yaWdpbmFsIHZhbHVlIGlmIGl0IGlzIGluY2x1c2l2ZWx5IHdpdGhpbiB0aGUgW21heCxtaW5dIHJhbmdlLiBJZiBpdCdzIGJlbG93IHRoZSByYW5nZSwgbWluIGlzXHJcbiAgICogcmV0dXJuZWQsIGFuZCBpZiBpdCdzIGFib3ZlIHRoZSByYW5nZSwgbWF4IGlzIHJldHVybmVkLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtaW5cclxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4XHJcbiAgICogQHJldHVybnMge251bWJlcn1cclxuICAgKi9cclxuICBjbGFtcCggdmFsdWUsIG1pbiwgbWF4ICkge1xyXG4gICAgaWYgKCB2YWx1ZSA8IG1pbiApIHtcclxuICAgICAgcmV0dXJuIG1pbjtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB2YWx1ZSA+IG1heCApIHtcclxuICAgICAgcmV0dXJuIG1heDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG51bWJlciBpbiB0aGUgcmFuZ2UgJG5cXGluW1xcbWF0aHJte21pbn0sXFxtYXRocm17bWF4fSkkIHdpdGggdGhlIHNhbWUgZXF1aXZhbGVuY2UgY2xhc3MgYXMgdGhlIGlucHV0XHJcbiAgICogdmFsdWUgbW9kIChtYXgtbWluKSwgaS5lLiBmb3IgYSB2YWx1ZSAkbSQsICRtXFxlcXVpdiBuXFwgKFxcbWF0aHJte21vZH1cXCBcXG1hdGhybXttYXh9LVxcbWF0aHJte21pbn0pJC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBUaGUgJ2Rvd24nIGluZGljYXRlcyB0aGF0IGlmIHRoZSB2YWx1ZSBpcyBlcXVhbCB0byBtaW4gb3IgbWF4LCB0aGUgbWF4IGlzIHJldHVybmVkLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pblxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtYXhcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIG1vZHVsb0JldHdlZW5Eb3duKCB2YWx1ZSwgbWluLCBtYXggKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBtYXggPiBtaW4sICdtYXggPiBtaW4gcmVxdWlyZWQgZm9yIG1vZHVsb0JldHdlZW4nICk7XHJcblxyXG4gICAgY29uc3QgZGl2aXNvciA9IG1heCAtIG1pbjtcclxuXHJcbiAgICAvLyBnZXQgYSBwYXJ0aWFsIHJlc3VsdCBvZiB2YWx1ZS1taW4gYmV0d2VlbiBbMCxkaXZpc29yKVxyXG4gICAgbGV0IHBhcnRpYWwgPSAoIHZhbHVlIC0gbWluICkgJSBkaXZpc29yO1xyXG4gICAgaWYgKCBwYXJ0aWFsIDwgMCApIHtcclxuICAgICAgLy8gc2luY2UgaWYgdmFsdWUtbWluIDwgMCwgdGhlIHJlbWFpbmRlciB3aWxsIGdpdmUgdXMgYSBuZWdhdGl2ZSBudW1iZXJcclxuICAgICAgcGFydGlhbCArPSBkaXZpc29yO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBwYXJ0aWFsICsgbWluOyAvLyBhZGQgYmFjayBpbiB0aGUgbWluaW11bSB2YWx1ZVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBudW1iZXIgaW4gdGhlIHJhbmdlICRuXFxpbihcXG1hdGhybXttaW59LFxcbWF0aHJte21heH1dJCB3aXRoIHRoZSBzYW1lIGVxdWl2YWxlbmNlIGNsYXNzIGFzIHRoZSBpbnB1dFxyXG4gICAqIHZhbHVlIG1vZCAobWF4LW1pbiksIGkuZS4gZm9yIGEgdmFsdWUgJG0kLCAkbVxcZXF1aXYgblxcIChcXG1hdGhybXttb2R9XFwgXFxtYXRocm17bWF4fS1cXG1hdGhybXttaW59KSQuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogVGhlICd1cCcgaW5kaWNhdGVzIHRoYXQgaWYgdGhlIHZhbHVlIGlzIGVxdWFsIHRvIG1pbiBvciBtYXgsIHRoZSBtaW4gaXMgcmV0dXJuZWQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcclxuICAgKiBAcGFyYW0ge251bWJlcn0gbWluXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heFxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgbW9kdWxvQmV0d2VlblVwKCB2YWx1ZSwgbWluLCBtYXggKSB7XHJcbiAgICByZXR1cm4gLVV0aWxzLm1vZHVsb0JldHdlZW5Eb3duKCAtdmFsdWUsIC1tYXgsIC1taW4gKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGludGVnZXJzIGZyb20gQSB0byBCIChpbmNsdXNpdmUpLCBlLmcuIHJhbmdlSW5jbHVzaXZlKCA0LCA3ICkgbWFwcyB0byBbIDQsIDUsIDYsIDcgXS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBiXHJcbiAgICogQHJldHVybnMge0FycmF5LjxudW1iZXI+fVxyXG4gICAqL1xyXG4gIHJhbmdlSW5jbHVzaXZlKCBhLCBiICkge1xyXG4gICAgaWYgKCBiIDwgYSApIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IEFycmF5KCBiIC0gYSArIDEgKTtcclxuICAgIGZvciAoIGxldCBpID0gYTsgaSA8PSBiOyBpKysgKSB7XHJcbiAgICAgIHJlc3VsdFsgaSAtIGEgXSA9IGk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgaW50ZWdlcnMgZnJvbSBBIHRvIEIgKGV4Y2x1c2l2ZSksIGUuZy4gcmFuZ2VFeGNsdXNpdmUoIDQsIDcgKSBtYXBzIHRvIFsgNSwgNiBdLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGJcclxuICAgKiBAcmV0dXJucyB7QXJyYXkuPG51bWJlcj59XHJcbiAgICovXHJcbiAgcmFuZ2VFeGNsdXNpdmUoIGEsIGIgKSB7XHJcbiAgICByZXR1cm4gVXRpbHMucmFuZ2VJbmNsdXNpdmUoIGEgKyAxLCBiIC0gMSApO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlcnRzIGRlZ3JlZXMgdG8gcmFkaWFucy5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gZGVncmVlc1xyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgdG9SYWRpYW5zKCBkZWdyZWVzICkge1xyXG4gICAgcmV0dXJuIE1hdGguUEkgKiBkZWdyZWVzIC8gMTgwO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlcnRzIHJhZGlhbnMgdG8gZGVncmVlcy5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gcmFkaWFuc1xyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgdG9EZWdyZWVzKCByYWRpYW5zICkge1xyXG4gICAgcmV0dXJuIDE4MCAqIHJhZGlhbnMgLyBNYXRoLlBJO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFdvcmthcm91bmQgZm9yIGJyb2tlbiBtb2R1bG8gb3BlcmF0b3IuXHJcbiAgICogRS5nLiBvbiBpT1M5LCAxZTEwICUgMWUxMCAtPiAyLjY1MjQ5NDc0ZS0zMTVcclxuICAgKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2RvdC9pc3N1ZXMvNzVcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBiXHJcbiAgICogQHJldHVybnMge251bWJlcn1cclxuICAgKi9cclxuICBtb2QoIGEsIGIgKSB7XHJcbiAgICBpZiAoIGEgLyBiICUgMSA9PT0gMCApIHtcclxuICAgICAgcmV0dXJuIDA7IC8vIGEgaXMgYSBtdWx0aXBsZSBvZiBiXHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIGEgJSBiO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEdyZWF0ZXN0IENvbW1vbiBEaXZpc29yLCB1c2luZyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9FdWNsaWRlYW5fYWxnb3JpdGhtLiBTZWVcclxuICAgKiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9HcmVhdGVzdF9jb21tb25fZGl2aXNvclxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGJcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIGdjZCggYSwgYiApIHtcclxuICAgIHJldHVybiBNYXRoLmFicyggYiA9PT0gMCA/IGEgOiB0aGlzLmdjZCggYiwgVXRpbHMubW9kKCBhLCBiICkgKSApO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIExlYXN0IENvbW1vbiBNdWx0aXBsZSwgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTGVhc3RfY29tbW9uX211bHRpcGxlXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYlxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IGxjbSwgYW4gaW50ZWdlclxyXG4gICAqL1xyXG4gIGxjbSggYSwgYiApIHtcclxuICAgIHJldHVybiBVdGlscy5yb3VuZFN5bW1ldHJpYyggTWF0aC5hYnMoIGEgKiBiICkgLyBVdGlscy5nY2QoIGEsIGIgKSApO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEludGVyc2VjdGlvbiBwb2ludCBiZXR3ZWVuIHRoZSBsaW5lcyBkZWZpbmVkIGJ5IHRoZSBsaW5lIHNlZ21lbnRzIHAxLXAyIGFuZCBwMy1wNC4gSWYgdGhlXHJcbiAgICogbGluZXMgYXJlIG5vdCBwcm9wZXJseSBkZWZpbmVkLCBudWxsIGlzIHJldHVybmVkLiBJZiB0aGVyZSBhcmUgbm8gaW50ZXJzZWN0aW9ucyBvciBpbmZpbml0ZWx5IG1hbnksXHJcbiAgICogZS5nLiBwYXJhbGxlbCBsaW5lcywgbnVsbCBpcyByZXR1cm5lZC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHAxXHJcbiAgICogQHBhcmFtIHtWZWN0b3IyfSBwMlxyXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gcDNcclxuICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHA0XHJcbiAgICogQHJldHVybnMge1ZlY3RvcjJ8bnVsbH1cclxuICAgKi9cclxuICBsaW5lTGluZUludGVyc2VjdGlvbiggcDEsIHAyLCBwMywgcDQgKSB7XHJcbiAgICBjb25zdCBlcHNpbG9uID0gMWUtMTA7XHJcblxyXG4gICAgLy8gSWYgdGhlIGVuZHBvaW50cyBhcmUgdGhlIHNhbWUsIHRoZXkgZG9uJ3QgcHJvcGVybHkgZGVmaW5lIGEgbGluZVxyXG4gICAgaWYgKCBwMS5lcXVhbHMoIHAyICkgfHwgcDMuZXF1YWxzKCBwNCApICkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUYWtlbiBmcm9tIGFuIGFuc3dlciBpblxyXG4gICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zODUzMDUvZWZmaWNpZW50LW1hdGhzLWFsZ29yaXRobS10by1jYWxjdWxhdGUtaW50ZXJzZWN0aW9uc1xyXG4gICAgY29uc3QgeDEyID0gcDEueCAtIHAyLng7XHJcbiAgICBjb25zdCB4MzQgPSBwMy54IC0gcDQueDtcclxuICAgIGNvbnN0IHkxMiA9IHAxLnkgLSBwMi55O1xyXG4gICAgY29uc3QgeTM0ID0gcDMueSAtIHA0Lnk7XHJcblxyXG4gICAgY29uc3QgZGVub20gPSB4MTIgKiB5MzQgLSB5MTIgKiB4MzQ7XHJcblxyXG4gICAgLy8gSWYgdGhlIGRlbm9taW5hdG9yIGlzIDAsIGxpbmVzIGFyZSBwYXJhbGxlbCBvciBjb2luY2lkZW50XHJcbiAgICBpZiAoIE1hdGguYWJzKCBkZW5vbSApIDwgZXBzaWxvbiApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZGVmaW5lIGludGVyc2VjdGlvbiB1c2luZyBkZXRlcm1pbmFudHMsIHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9MaW5lJUUyJTgwJTkzbGluZV9pbnRlcnNlY3Rpb25cclxuICAgIGNvbnN0IGEgPSBwMS54ICogcDIueSAtIHAxLnkgKiBwMi54O1xyXG4gICAgY29uc3QgYiA9IHAzLnggKiBwNC55IC0gcDMueSAqIHA0Lng7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IyKFxyXG4gICAgICAoIGEgKiB4MzQgLSB4MTIgKiBiICkgLyBkZW5vbSxcclxuICAgICAgKCBhICogeTM0IC0geTEyICogYiApIC8gZGVub21cclxuICAgICk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2VudGVyIG9mIGEgY2lyY2xlIHRoYXQgd2lsbCBsaWUgb24gMyBwb2ludHMgKGlmIGl0IGV4aXN0cyksIG90aGVyd2lzZSBudWxsIChpZiBjb2xsaW5lYXIpLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gcDFcclxuICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHAyXHJcbiAgICogQHBhcmFtIHtWZWN0b3IyfSBwM1xyXG4gICAqIEByZXR1cm5zIHtWZWN0b3IyfG51bGx9XHJcbiAgICovXHJcbiAgY2lyY2xlQ2VudGVyRnJvbVBvaW50cyggcDEsIHAyLCBwMyApIHtcclxuICAgIC8vIFRPRE86IENhbiB3ZSBtYWtlIHNjcmF0Y2ggdmVjdG9ycyBoZXJlLCBhdm9pZGluZyB0aGUgY2lyY3VsYXIgcmVmZXJlbmNlPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZG90L2lzc3Vlcy85NlxyXG5cclxuICAgIC8vIG1pZHBvaW50cyBiZXR3ZWVuIHAxLXAyIGFuZCBwMi1wM1xyXG4gICAgY29uc3QgcDEyID0gbmV3IFZlY3RvcjIoICggcDEueCArIHAyLnggKSAvIDIsICggcDEueSArIHAyLnkgKSAvIDIgKTtcclxuICAgIGNvbnN0IHAyMyA9IG5ldyBWZWN0b3IyKCAoIHAyLnggKyBwMy54ICkgLyAyLCAoIHAyLnkgKyBwMy55ICkgLyAyICk7XHJcblxyXG4gICAgLy8gcGVycGVuZGljdWxhciBwb2ludHMgZnJvbSB0aGUgbWlucG9pbnRzXHJcbiAgICBjb25zdCBwMTJ4ID0gbmV3IFZlY3RvcjIoIHAxMi54ICsgKCBwMi55IC0gcDEueSApLCBwMTIueSAtICggcDIueCAtIHAxLnggKSApO1xyXG4gICAgY29uc3QgcDIzeCA9IG5ldyBWZWN0b3IyKCBwMjMueCArICggcDMueSAtIHAyLnkgKSwgcDIzLnkgLSAoIHAzLnggLSBwMi54ICkgKTtcclxuXHJcbiAgICByZXR1cm4gVXRpbHMubGluZUxpbmVJbnRlcnNlY3Rpb24oIHAxMiwgcDEyeCwgcDIzLCBwMjN4ICk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBwb2ludCBwIGlzIGluc2lkZSB0aGUgY2lyY2xlIGRlZmluZWQgYnkgdGhlIG90aGVyIHRocmVlIHBvaW50cyAocDEsIHAyLCBwMykuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogTk9URTogcDEscDIscDMgc2hvdWxkIGJlIHNwZWNpZmllZCBpbiBhIGNvdW50ZXJjbG9ja3dpc2UgKG1hdGhlbWF0aWNhbGx5KSBvcmRlciwgYW5kIHRodXMgc2hvdWxkIGhhdmUgYSBwb3NpdGl2ZVxyXG4gICAqIHNpZ25lZCBhcmVhLlxyXG4gICAqXHJcbiAgICogU2VlIG5vdGVzIGluIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0RlbGF1bmF5X3RyaWFuZ3VsYXRpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHAxXHJcbiAgICogQHBhcmFtIHtWZWN0b3IyfSBwMlxyXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gcDNcclxuICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHBcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgKi9cclxuICBwb2ludEluQ2lyY2xlRnJvbVBvaW50cyggcDEsIHAyLCBwMywgcCApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIFV0aWxzLnRyaWFuZ2xlQXJlYVNpZ25lZCggcDEsIHAyLCBwMyApID4gMCxcclxuICAgICAgJ0RlZmluZWQgcG9pbnRzIHNob3VsZCBiZSBpbiBhIGNvdW50ZXJjbG9ja3dpc2Ugb3JkZXInICk7XHJcblxyXG4gICAgY29uc3QgbTAwID0gcDEueCAtIHAueDtcclxuICAgIGNvbnN0IG0wMSA9IHAxLnkgLSBwLnk7XHJcbiAgICBjb25zdCBtMDIgPSAoIHAxLnggLSBwLnggKSAqICggcDEueCAtIHAueCApICsgKCBwMS55IC0gcC55ICkgKiAoIHAxLnkgLSBwLnkgKTtcclxuICAgIGNvbnN0IG0xMCA9IHAyLnggLSBwLng7XHJcbiAgICBjb25zdCBtMTEgPSBwMi55IC0gcC55O1xyXG4gICAgY29uc3QgbTEyID0gKCBwMi54IC0gcC54ICkgKiAoIHAyLnggLSBwLnggKSArICggcDIueSAtIHAueSApICogKCBwMi55IC0gcC55ICk7XHJcbiAgICBjb25zdCBtMjAgPSBwMy54IC0gcC54O1xyXG4gICAgY29uc3QgbTIxID0gcDMueSAtIHAueTtcclxuICAgIGNvbnN0IG0yMiA9ICggcDMueCAtIHAueCApICogKCBwMy54IC0gcC54ICkgKyAoIHAzLnkgLSBwLnkgKSAqICggcDMueSAtIHAueSApO1xyXG5cclxuICAgIGNvbnN0IGRldGVybWluYW50ID0gbTAwICogbTExICogbTIyICsgbTAxICogbTEyICogbTIwICsgbTAyICogbTEwICogbTIxIC0gbTAyICogbTExICogbTIwIC0gbTAxICogbTEwICogbTIyIC0gbTAwICogbTEyICogbTIxO1xyXG4gICAgcmV0dXJuIGRldGVybWluYW50ID4gMDtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSYXktc3BoZXJlIGludGVyc2VjdGlvbiwgcmV0dXJuaW5nIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjbG9zZXN0IGludGVyc2VjdGlvbi4gQXNzdW1lcyB0aGUgc3BoZXJlIGlzIGNlbnRlcmVkXHJcbiAgICogYXQgdGhlIG9yaWdpbiAoZm9yIGVhc2Ugb2YgY29tcHV0YXRpb24pLCB0cmFuc2Zvcm0gdGhlIHJheSB0byBjb21wZW5zYXRlIGlmIG5lZWRlZC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBJZiB0aGVyZSBpcyBubyBpbnRlcnNlY3Rpb24sIG51bGwgaXMgcmV0dXJuZWQuIE90aGVyd2lzZSBhbiBvYmplY3Qgd2lsbCBiZSByZXR1cm5lZCBsaWtlOlxyXG4gICAqIDxwcmUgY2xhc3M9XCJicnVzaDoganNcIj5cclxuICAgKiB7XHJcbiAgICogICBkaXN0YW5jZToge251bWJlcn0sIC8vIGRpc3RhbmNlIGZyb20gdGhlIHJheSBwb3NpdGlvbiB0byB0aGUgaW50ZXJzZWN0aW9uXHJcbiAgICogICBoaXRQb2ludDoge1ZlY3RvcjN9LCAvLyBsb2NhdGlvbiBvZiB0aGUgaW50ZXJzZWN0aW9uXHJcbiAgICogICBub3JtYWw6IHtWZWN0b3IzfSwgLy8gdGhlIG5vcm1hbCBvZiB0aGUgc3BoZXJlJ3Mgc3VyZmFjZSBhdCB0aGUgaW50ZXJzZWN0aW9uXHJcbiAgICogICBmcm9tT3V0c2lkZToge2Jvb2xlYW59LCAvLyB3aGV0aGVyIHRoZSByYXkgaW50ZXJzZWN0ZWQgdGhlIHNwaGVyZSBmcm9tIG91dHNpZGUgdGhlIHNwaGVyZSBmaXJzdFxyXG4gICAqIH1cclxuICAgKiA8L3ByZT5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByYWRpdXNcclxuICAgKiBAcGFyYW0ge1JheTN9IHJheVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBlcHNpbG9uXHJcbiAgICogQHJldHVybnMge09iamVjdH1cclxuICAgKi9cclxuICAvLyBhc3N1bWVzIGEgc3BoZXJlIHdpdGggdGhlIHNwZWNpZmllZCByYWRpdXMsIGNlbnRlcmVkIGF0IHRoZSBvcmlnaW5cclxuICBzcGhlcmVSYXlJbnRlcnNlY3Rpb24oIHJhZGl1cywgcmF5LCBlcHNpbG9uICkge1xyXG4gICAgZXBzaWxvbiA9IGVwc2lsb24gPT09IHVuZGVmaW5lZCA/IDFlLTUgOiBlcHNpbG9uO1xyXG5cclxuICAgIC8vIGNlbnRlciBpcyB0aGUgb3JpZ2luIGZvciBub3csIGJ1dCBsZWF2aW5nIGluIGNvbXB1dGF0aW9ucyBzbyB0aGF0IHdlIGNhbiBjaGFuZ2UgdGhhdCBpbiB0aGUgZnV0dXJlLiBvcHRpbWl6ZSBhd2F5IGlmIG5lZWRlZFxyXG4gICAgY29uc3QgY2VudGVyID0gbmV3IFZlY3RvcjMoIDAsIDAsIDAgKTtcclxuXHJcbiAgICBjb25zdCByYXlEaXIgPSByYXkuZGlyZWN0aW9uO1xyXG4gICAgY29uc3QgcG9zID0gcmF5LnBvc2l0aW9uO1xyXG4gICAgY29uc3QgY2VudGVyVG9SYXkgPSBwb3MubWludXMoIGNlbnRlciApO1xyXG5cclxuICAgIC8vIGJhc2ljYWxseSwgd2UgY2FuIHVzZSB0aGUgcXVhZHJhdGljIGVxdWF0aW9uIHRvIHNvbHZlIGZvciBib3RoIHBvc3NpYmxlIGhpdCBwb2ludHMgKGJvdGggKy0gcm9vdHMgYXJlIHRoZSBoaXQgcG9pbnRzKVxyXG4gICAgY29uc3QgdG1wID0gcmF5RGlyLmRvdCggY2VudGVyVG9SYXkgKTtcclxuICAgIGNvbnN0IGNlbnRlclRvUmF5RGlzdFNxID0gY2VudGVyVG9SYXkubWFnbml0dWRlU3F1YXJlZDtcclxuICAgIGNvbnN0IGRldCA9IDQgKiB0bXAgKiB0bXAgLSA0ICogKCBjZW50ZXJUb1JheURpc3RTcSAtIHJhZGl1cyAqIHJhZGl1cyApO1xyXG4gICAgaWYgKCBkZXQgPCBlcHNpbG9uICkge1xyXG4gICAgICAvLyByYXkgbWlzc2VzIHNwaGVyZSBlbnRpcmVseVxyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBiYXNlID0gcmF5RGlyLmRvdCggY2VudGVyICkgLSByYXlEaXIuZG90KCBwb3MgKTtcclxuICAgIGNvbnN0IHNxdCA9IE1hdGguc3FydCggZGV0ICkgLyAyO1xyXG5cclxuICAgIC8vIHRoZSBcImZpcnN0XCIgZW50cnkgcG9pbnQgZGlzdGFuY2UgaW50byB0aGUgc3BoZXJlLiBpZiB3ZSBhcmUgaW5zaWRlIHRoZSBzcGhlcmUsIGl0IGlzIGJlaGluZCB1c1xyXG4gICAgY29uc3QgdGEgPSBiYXNlIC0gc3F0O1xyXG5cclxuICAgIC8vIHRoZSBcInNlY29uZFwiIGVudHJ5IHBvaW50IGRpc3RhbmNlXHJcbiAgICBjb25zdCB0YiA9IGJhc2UgKyBzcXQ7XHJcblxyXG4gICAgaWYgKCB0YiA8IGVwc2lsb24gKSB7XHJcbiAgICAgIC8vIHNwaGVyZSBpcyBiZWhpbmQgcmF5LCBzbyBkb24ndCByZXR1cm4gYW4gaW50ZXJzZWN0aW9uXHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGhpdFBvc2l0aW9uQiA9IHJheS5wb2ludEF0RGlzdGFuY2UoIHRiICk7XHJcbiAgICBjb25zdCBub3JtYWxCID0gaGl0UG9zaXRpb25CLm1pbnVzKCBjZW50ZXIgKS5ub3JtYWxpemVkKCk7XHJcblxyXG4gICAgaWYgKCB0YSA8IGVwc2lsb24gKSB7XHJcbiAgICAgIC8vIHdlIGFyZSBpbnNpZGUgdGhlIHNwaGVyZVxyXG4gICAgICAvLyBpbiA9PiBvdXRcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBkaXN0YW5jZTogdGIsXHJcbiAgICAgICAgaGl0UG9pbnQ6IGhpdFBvc2l0aW9uQixcclxuICAgICAgICBub3JtYWw6IG5vcm1hbEIubmVnYXRlZCgpLFxyXG4gICAgICAgIGZyb21PdXRzaWRlOiBmYWxzZVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIHR3byBwb3NzaWJsZSBoaXRzXHJcbiAgICAgIGNvbnN0IGhpdFBvc2l0aW9uQSA9IHJheS5wb2ludEF0RGlzdGFuY2UoIHRhICk7XHJcbiAgICAgIGNvbnN0IG5vcm1hbEEgPSBoaXRQb3NpdGlvbkEubWludXMoIGNlbnRlciApLm5vcm1hbGl6ZWQoKTtcclxuXHJcbiAgICAgIC8vIGNsb3NlIGhpdCwgd2UgaGF2ZSBvdXQgPT4gaW5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBkaXN0YW5jZTogdGEsXHJcbiAgICAgICAgaGl0UG9pbnQ6IGhpdFBvc2l0aW9uQSxcclxuICAgICAgICBub3JtYWw6IG5vcm1hbEEsXHJcbiAgICAgICAgZnJvbU91dHNpZGU6IHRydWVcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHRoZSByZWFsIHJvb3RzIG9mIHRoZSBxdWFkcmF0aWMgZXF1YXRpb24gJGF4ICsgYj0wJCwgb3IgbnVsbCBpZiBldmVyeSB2YWx1ZSBpcyBhIHNvbHV0aW9uLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGJcclxuICAgKiBAcmV0dXJucyB7QXJyYXkuPG51bWJlcj58bnVsbH0gLSBUaGUgcmVhbCByb290cyBvZiB0aGUgZXF1YXRpb24sIG9yIG51bGwgaWYgYWxsIHZhbHVlcyBhcmUgcm9vdHMuIElmIHRoZSByb290IGhhc1xyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEgbXVsdGlwbGljaXR5IGxhcmdlciB0aGFuIDEsIGl0IHdpbGwgYmUgcmVwZWF0ZWQgdGhhdCBtYW55IHRpbWVzLlxyXG4gICAqL1xyXG4gIHNvbHZlTGluZWFyUm9vdHNSZWFsKCBhLCBiICkge1xyXG4gICAgaWYgKCBhID09PSAwICkge1xyXG4gICAgICBpZiAoIGIgPT09IDAgKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIFsgLWIgLyBhIF07XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiB0aGUgcmVhbCByb290cyBvZiB0aGUgcXVhZHJhdGljIGVxdWF0aW9uICRheF4yICsgYnggKyBjPTAkLCBvciBudWxsIGlmIGV2ZXJ5IHZhbHVlIGlzIGFcclxuICAgKiBzb2x1dGlvbi4gSWYgYSBpcyBub256ZXJvLCB0aGVyZSBzaG91bGQgYmUgYmV0d2VlbiAwIGFuZCAyIChpbmNsdXNpdmUpIHZhbHVlcyByZXR1cm5lZC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBiXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNcclxuICAgKiBAcmV0dXJucyB7QXJyYXkuPG51bWJlcj58bnVsbH0gLSBUaGUgcmVhbCByb290cyBvZiB0aGUgZXF1YXRpb24sIG9yIG51bGwgaWYgYWxsIHZhbHVlcyBhcmUgcm9vdHMuIElmIHRoZSByb290IGhhc1xyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEgbXVsdGlwbGljaXR5IGxhcmdlciB0aGFuIDEsIGl0IHdpbGwgYmUgcmVwZWF0ZWQgdGhhdCBtYW55IHRpbWVzLlxyXG4gICAqL1xyXG4gIHNvbHZlUXVhZHJhdGljUm9vdHNSZWFsKCBhLCBiLCBjICkge1xyXG4gICAgLy8gQ2hlY2sgZm9yIGEgZGVnZW5lcmF0ZSBjYXNlIHdoZXJlIHdlIGRvbid0IGhhdmUgYSBxdWFkcmF0aWMsIG9yIGlmIHRoZSBvcmRlciBvZiBtYWduaXR1ZGUgaXMgc3VjaCB3aGVyZSB0aGVcclxuICAgIC8vIGxpbmVhciBzb2x1dGlvbiB3b3VsZCBiZSBleHBlY3RlZFxyXG4gICAgY29uc3QgZXBzaWxvbiA9IDFFNztcclxuICAgIGlmICggYSA9PT0gMCB8fCBNYXRoLmFicyggYiAvIGEgKSA+IGVwc2lsb24gfHwgTWF0aC5hYnMoIGMgLyBhICkgPiBlcHNpbG9uICkge1xyXG4gICAgICByZXR1cm4gVXRpbHMuc29sdmVMaW5lYXJSb290c1JlYWwoIGIsIGMgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkaXNjcmltaW5hbnQgPSBiICogYiAtIDQgKiBhICogYztcclxuICAgIGlmICggZGlzY3JpbWluYW50IDwgMCApIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgc3FydCA9IE1hdGguc3FydCggZGlzY3JpbWluYW50ICk7XHJcbiAgICAvLyBUT0RPOiBob3cgdG8gaGFuZGxlIGlmIGRpc2NyaW1pbmFudCBpcyAwPyBnaXZlIHVuaXF1ZSByb290IG9yIGRvdWJsZSBpdD8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2RvdC9pc3N1ZXMvOTZcclxuICAgIC8vIFRPRE86IHByb2JhYmx5IGp1c3QgdXNlIENvbXBsZXggZm9yIHRoZSBmdXR1cmUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2RvdC9pc3N1ZXMvOTZcclxuICAgIHJldHVybiBbXHJcbiAgICAgICggLWIgLSBzcXJ0ICkgLyAoIDIgKiBhICksXHJcbiAgICAgICggLWIgKyBzcXJ0ICkgLyAoIDIgKiBhIClcclxuICAgIF07XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiB0aGUgcmVhbCByb290cyBvZiB0aGUgY3ViaWMgZXF1YXRpb24gJGF4XjMgKyBieF4yICsgY3ggKyBkPTAkLCBvciBudWxsIGlmIGV2ZXJ5IHZhbHVlIGlzIGFcclxuICAgKiBzb2x1dGlvbi4gSWYgYSBpcyBub256ZXJvLCB0aGVyZSBzaG91bGQgYmUgYmV0d2VlbiAwIGFuZCAzIChpbmNsdXNpdmUpIHZhbHVlcyByZXR1cm5lZC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBiXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNcclxuICAgKiBAcGFyYW0ge251bWJlcn0gZFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbZGlzY3JpbWluYW50VGhyZXNob2xkXSAtIGZvciBkZXRlcm1pbmluZyB3aGV0aGVyIHdlIGhhdmUgYSBzaW5nbGUgcmVhbCByb290XHJcbiAgICogQHJldHVybnMge0FycmF5LjxudW1iZXI+fG51bGx9IC0gVGhlIHJlYWwgcm9vdHMgb2YgdGhlIGVxdWF0aW9uLCBvciBudWxsIGlmIGFsbCB2YWx1ZXMgYXJlIHJvb3RzLiBJZiB0aGUgcm9vdCBoYXNcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhIG11bHRpcGxpY2l0eSBsYXJnZXIgdGhhbiAxLCBpdCB3aWxsIGJlIHJlcGVhdGVkIHRoYXQgbWFueSB0aW1lcy5cclxuICAgKi9cclxuICBzb2x2ZUN1YmljUm9vdHNSZWFsKCBhLCBiLCBjLCBkLCBkaXNjcmltaW5hbnRUaHJlc2hvbGQgPSAxZS03ICkge1xyXG5cclxuICAgIGxldCByb290cztcclxuXHJcbiAgICAvLyBUT0RPOiBhIENvbXBsZXggdHlwZSEgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2RvdC9pc3N1ZXMvOTZcclxuXHJcbiAgICAvLyBDaGVjayBmb3IgYSBkZWdlbmVyYXRlIGNhc2Ugd2hlcmUgd2UgZG9uJ3QgaGF2ZSBhIGN1YmljXHJcbiAgICBpZiAoIGEgPT09IDAgKSB7XHJcbiAgICAgIHJvb3RzID0gVXRpbHMuc29sdmVRdWFkcmF0aWNSb290c1JlYWwoIGIsIGMsIGQgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvL1dlIG5lZWQgdG8gdGVzdCB3aGV0aGVyIGEgaXMgc2V2ZXJhbCBvcmRlcnMgb2YgbWFnbml0dWRlIGxlc3MgdGhhbiBiLCBjLCBkXHJcbiAgICAgIGNvbnN0IGVwc2lsb24gPSAxRTc7XHJcblxyXG4gICAgICBpZiAoIGEgPT09IDAgfHwgTWF0aC5hYnMoIGIgLyBhICkgPiBlcHNpbG9uIHx8IE1hdGguYWJzKCBjIC8gYSApID4gZXBzaWxvbiB8fCBNYXRoLmFicyggZCAvIGEgKSA+IGVwc2lsb24gKSB7XHJcbiAgICAgICAgcm9vdHMgPSBVdGlscy5zb2x2ZVF1YWRyYXRpY1Jvb3RzUmVhbCggYiwgYywgZCApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGlmICggZCA9PT0gMCB8fCBNYXRoLmFicyggYSAvIGQgKSA+IGVwc2lsb24gfHwgTWF0aC5hYnMoIGIgLyBkICkgPiBlcHNpbG9uIHx8IE1hdGguYWJzKCBjIC8gZCApID4gZXBzaWxvbiApIHtcclxuICAgICAgICAgIHJvb3RzID0gWyAwIF0uY29uY2F0KCBVdGlscy5zb2x2ZVF1YWRyYXRpY1Jvb3RzUmVhbCggYSwgYiwgYyApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgYiAvPSBhO1xyXG4gICAgICAgICAgYyAvPSBhO1xyXG4gICAgICAgICAgZCAvPSBhO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHEgPSAoIDMuMCAqIGMgLSAoIGIgKiBiICkgKSAvIDk7XHJcbiAgICAgICAgICBjb25zdCByID0gKCAtKCAyNyAqIGQgKSArIGIgKiAoIDkgKiBjIC0gMiAqICggYiAqIGIgKSApICkgLyA1NDtcclxuICAgICAgICAgIGNvbnN0IGRpc2NyaW1pbmFudCA9IHEgKiBxICogcSArIHIgKiByO1xyXG4gICAgICAgICAgY29uc3QgYjMgPSBiIC8gMztcclxuXHJcbiAgICAgICAgICBpZiAoIGRpc2NyaW1pbmFudCA+IGRpc2NyaW1pbmFudFRocmVzaG9sZCApIHtcclxuICAgICAgICAgICAgLy8gYSBzaW5nbGUgcmVhbCByb290XHJcbiAgICAgICAgICAgIGNvbnN0IGRzcXJ0ID0gTWF0aC5zcXJ0KCBkaXNjcmltaW5hbnQgKTtcclxuICAgICAgICAgICAgcm9vdHMgPSBbIFV0aWxzLmN1YmVSb290KCByICsgZHNxcnQgKSArIFV0aWxzLmN1YmVSb290KCByIC0gZHNxcnQgKSAtIGIzIF07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmICggZGlzY3JpbWluYW50ID4gLWRpc2NyaW1pbmFudFRocmVzaG9sZCApIHsgLy8gd291bGQgdHJ1bHkgYmUgZGlzY3JpbWluYW50PT0wLCBidXQgZmxvYXRpbmctcG9pbnQgZXJyb3JcclxuICAgICAgICAgICAgLy8gY29udGFpbnMgYSBkb3VibGUgcm9vdCAoYnV0IHdpdGggdGhyZWUgcm9vdHMpXHJcbiAgICAgICAgICAgIGNvbnN0IHJzcXJ0ID0gVXRpbHMuY3ViZVJvb3QoIHIgKTtcclxuICAgICAgICAgICAgY29uc3QgZG91YmxlUm9vdCA9IC1iMyAtIHJzcXJ0O1xyXG4gICAgICAgICAgICByb290cyA9IFsgLWIzICsgMiAqIHJzcXJ0LCBkb3VibGVSb290LCBkb3VibGVSb290IF07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gYWxsIHVuaXF1ZSAodGhyZWUgcm9vdHMpXHJcbiAgICAgICAgICAgIGxldCBxWCA9IC1xICogcSAqIHE7XHJcbiAgICAgICAgICAgIHFYID0gTWF0aC5hY29zKCByIC8gTWF0aC5zcXJ0KCBxWCApICk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJyID0gMiAqIE1hdGguc3FydCggLXEgKTtcclxuICAgICAgICAgICAgcm9vdHMgPSBbXHJcbiAgICAgICAgICAgICAgLWIzICsgcnIgKiBNYXRoLmNvcyggcVggLyAzICksXHJcbiAgICAgICAgICAgICAgLWIzICsgcnIgKiBNYXRoLmNvcyggKCBxWCArIDIgKiBNYXRoLlBJICkgLyAzICksXHJcbiAgICAgICAgICAgICAgLWIzICsgcnIgKiBNYXRoLmNvcyggKCBxWCArIDQgKiBNYXRoLlBJICkgLyAzIClcclxuICAgICAgICAgICAgXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3NlcnQgJiYgcm9vdHMgJiYgcm9vdHMuZm9yRWFjaCggcm9vdCA9PiBhc3NlcnQoIGlzRmluaXRlKCByb290ICksICdBbGwgcmV0dXJuZWQgc29sdmVDdWJpY1Jvb3RzUmVhbCByb290cyBzaG91bGQgYmUgZmluaXRlJyApICk7XHJcblxyXG4gICAgcmV0dXJuIHJvb3RzO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHVuaXF1ZSByZWFsIGN1YmUgcm9vdCBvZiB4LCBzdWNoIHRoYXQgJHleMz14JC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0geFxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgY3ViZVJvb3QoIHggKSB7XHJcbiAgICByZXR1cm4geCA+PSAwID8gTWF0aC5wb3coIHgsIDEgLyAzICkgOiAtTWF0aC5wb3coIC14LCAxIC8gMyApO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIERlZmluZXMgYW5kIGV2YWx1YXRlcyBhIGxpbmVhciBtYXBwaW5nLiBUaGUgbWFwcGluZyBpcyBkZWZpbmVkIHNvIHRoYXQgJGYoYV8xKT1iXzEkIGFuZCAkZihhXzIpPWJfMiQsIGFuZCBvdGhlclxyXG4gICAqIHZhbHVlcyBhcmUgaW50ZXJwb2xhdGVkIGFsb25nIHRoZSBsaW5lYXIgZXF1YXRpb24uIFRoZSByZXR1cm5lZCB2YWx1ZSBpcyAkZihhXzMpJC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYTFcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYTJcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYjFcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYjJcclxuICAgKiBAcGFyYW0ge251bWJlcn0gYTNcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIGxpbmVhciggYTEsIGEyLCBiMSwgYjIsIGEzICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIGEzID09PSAnbnVtYmVyJywgJ2xpbmVhciByZXF1aXJlcyBhIG51bWJlciB0byBldmFsdWF0ZScgKTtcclxuICAgIHJldHVybiAoIGIyIC0gYjEgKSAvICggYTIgLSBhMSApICogKCBhMyAtIGExICkgKyBiMTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSb3VuZHMgdXNpbmcgXCJSb3VuZCBoYWxmIGF3YXkgZnJvbSB6ZXJvXCIgYWxnb3JpdGhtLiBTZWUgZG90IzM1LlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEphdmFTY3JpcHQncyBNYXRoLnJvdW5kIGlzIG5vdCBzeW1tZXRyaWMgZm9yIHBvc2l0aXZlIGFuZCBuZWdhdGl2ZSBudW1iZXJzLCBpdCB1c2VzIElFRUUgNzU0IFwiUm91bmQgaGFsZiB1cFwiLlxyXG4gICAqIFNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Sb3VuZGluZyNSb3VuZF9oYWxmX3VwLlxyXG4gICAqIEZvciBzaW1zLCB3ZSB3YW50IHRvIHRyZWF0IHBvc2l0aXZlIGFuZCBuZWdhdGl2ZSB2YWx1ZXMgc3ltbWV0cmljYWxseSwgd2hpY2ggaXMgSUVFRSA3NTQgXCJSb3VuZCBoYWxmIGF3YXkgZnJvbSB6ZXJvXCIsXHJcbiAgICogU2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1JvdW5kaW5nI1JvdW5kX2hhbGZfYXdheV9mcm9tX3plcm9cclxuICAgKlxyXG4gICAqIE5vdGUgdGhhdCAtMCBpcyByb3VuZGVkIHRvIDAsIHNpbmNlIHdlIHR5cGljYWxseSBkbyBub3Qgd2FudCB0byBkaXNwbGF5IC0wIGluIHNpbXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYFxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgcm91bmRTeW1tZXRyaWMoIHZhbHVlICkge1xyXG4gICAgcmV0dXJuICggKCB2YWx1ZSA8IDAgKSA/IC0xIDogMSApICogTWF0aC5yb3VuZCggTWF0aC5hYnMoIHZhbHVlICkgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBBIHByZWRpY3RhYmxlIGltcGxlbWVudGF0aW9uIG9mIHRvRml4ZWQuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogSmF2YVNjcmlwdCdzIHRvRml4ZWQgaXMgbm90b3Jpb3VzbHkgYnVnZ3ksIGJlaGF2aW9yIGRpZmZlcnMgZGVwZW5kaW5nIG9uIGJyb3dzZXIsXHJcbiAgICogYmVjYXVzZSB0aGUgc3BlYyBkb2Vzbid0IHNwZWNpZnkgd2hldGhlciB0byByb3VuZCBvciBmbG9vci5cclxuICAgKiBSb3VuZGluZyBpcyBzeW1tZXRyaWMgZm9yIHBvc2l0aXZlIGFuZCBuZWdhdGl2ZSB2YWx1ZXMsIHNlZSBVdGlscy5yb3VuZFN5bW1ldHJpYy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkZWNpbWFsUGxhY2VzXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICB0b0ZpeGVkKCB2YWx1ZSwgZGVjaW1hbFBsYWNlcyApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIE51bWJlci5pc0ludGVnZXIoIGRlY2ltYWxQbGFjZXMgKSwgYGRlY2ltYWwgcGxhY2VzIG11c3QgYmUgYW4gaW50ZWdlcjogJHtkZWNpbWFsUGxhY2VzfWAgKTtcclxuICAgIGlmICggaXNOYU4oIHZhbHVlICkgKSB7XHJcbiAgICAgIHJldHVybiAnTmFOJztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB2YWx1ZSA9PT0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZICkge1xyXG4gICAgICByZXR1cm4gJ0luZmluaXR5JztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB2YWx1ZSA9PT0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZICkge1xyXG4gICAgICByZXR1cm4gJy1JbmZpbml0eSc7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGJhZC1zaW0tdGV4dFxyXG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IEJpZyggdmFsdWUgKS50b0ZpeGVkKCBkZWNpbWFsUGxhY2VzICk7XHJcblxyXG4gICAgLy8gQXZvaWQgcmVwb3J0aW5nIC0wLjAwMFxyXG4gICAgaWYgKCByZXN1bHQuc3RhcnRzV2l0aCggJy0wLicgKSAmJiBOdW1iZXIucGFyc2VGbG9hdCggcmVzdWx0ICkgPT09IDAgKSB7XHJcbiAgICAgIHJldHVybiAnMCcgKyByZXN1bHQuc2xpY2UoIDIgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEEgcHJlZGljdGFibGUgaW1wbGVtZW50YXRpb24gb2YgdG9GaXhlZCwgd2hlcmUgdGhlIHJlc3VsdCBpcyByZXR1cm5lZCBhcyBhIG51bWJlciBpbnN0ZWFkIG9mIGEgc3RyaW5nLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEphdmFTY3JpcHQncyB0b0ZpeGVkIGlzIG5vdG9yaW91c2x5IGJ1Z2d5LCBiZWhhdmlvciBkaWZmZXJzIGRlcGVuZGluZyBvbiBicm93c2VyLFxyXG4gICAqIGJlY2F1c2UgdGhlIHNwZWMgZG9lc24ndCBzcGVjaWZ5IHdoZXRoZXIgdG8gcm91bmQgb3IgZmxvb3IuXHJcbiAgICogUm91bmRpbmcgaXMgc3ltbWV0cmljIGZvciBwb3NpdGl2ZSBhbmQgbmVnYXRpdmUgdmFsdWVzLCBzZWUgVXRpbHMucm91bmRTeW1tZXRyaWMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcclxuICAgKiBAcGFyYW0ge251bWJlcn0gZGVjaW1hbFBsYWNlc1xyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgdG9GaXhlZE51bWJlciggdmFsdWUsIGRlY2ltYWxQbGFjZXMgKSB7XHJcbiAgICByZXR1cm4gcGFyc2VGbG9hdCggVXRpbHMudG9GaXhlZCggdmFsdWUsIGRlY2ltYWxQbGFjZXMgKSApO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0d28gbnVtYmVycyBhcmUgd2l0aGluIGVwc2lsb24gb2YgZWFjaCBvdGhlci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGJcclxuICAgKiBAcGFyYW0ge251bWJlcn0gZXBzaWxvblxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAqL1xyXG4gIGVxdWFsc0Vwc2lsb24oIGEsIGIsIGVwc2lsb24gKSB7XHJcbiAgICByZXR1cm4gTWF0aC5hYnMoIGEgLSBiICkgPD0gZXBzaWxvbjtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlcyB0aGUgaW50ZXJzZWN0aW9uIG9mIHRoZSB0d28gbGluZSBzZWdtZW50cyAkKHhfMSx5XzEpKHhfMix5XzIpJCBhbmQgJCh4XzMseV8zKSh4XzQseV80KSQuIElmIHRoZXJlIGlzIG5vXHJcbiAgICogaW50ZXJzZWN0aW9uLCBudWxsIGlzIHJldHVybmVkLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4MVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4MlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4M1xyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5M1xyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4NFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5NFxyXG4gICAqIEByZXR1cm5zIHtWZWN0b3IyfG51bGx9XHJcbiAgICovXHJcbiAgbGluZVNlZ21lbnRJbnRlcnNlY3Rpb24oIHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCApIHtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZVxyXG4gICAgLy8gRGV0ZXJtaW5lcyBjb3VudGVyY2xvY2t3aXNlbmVzcy4gUG9zaXRpdmUgaWYgY291bnRlcmNsb2Nrd2lzZSwgbmVnYXRpdmUgaWYgY2xvY2t3aXNlLCB6ZXJvIGlmIHN0cmFpZ2h0IGxpbmVcclxuICAgIC8vIFBvaW50MShhLGIpLCBQb2ludDIoYyxkKSwgUG9pbnQzKGUsZilcclxuICAgIC8vIFNlZSBodHRwOi8vamVmZmUuY3MuaWxsaW5vaXMuZWR1L3RlYWNoaW5nLzM3My9ub3Rlcy94MDUtY29udmV4aHVsbC5wZGZcclxuICAgIC8vIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICBjb25zdCBjY3cgPSAoIGEsIGIsIGMsIGQsIGUsIGYgKSA9PiAoIGYgLSBiICkgKiAoIGMgLSBhICkgLSAoIGQgLSBiICkgKiAoIGUgLSBhICk7XHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgaW50ZXJzZWN0aW9uIGRvZXNuJ3QgZXhpc3QuIFNlZSBodHRwOi8vamVmZmUuY3MuaWxsaW5vaXMuZWR1L3RlYWNoaW5nLzM3My9ub3Rlcy94MDYtc3dlZXBsaW5lLnBkZlxyXG4gICAgLy8gSWYgcG9pbnQxIGFuZCBwb2ludDIgYXJlIG9uIG9wcG9zaXRlIHNpZGVzIG9mIGxpbmUgMyA0LCBleGFjdGx5IG9uZSBvZiB0aGUgdHdvIHRyaXBsZXMgMSwgMywgNCBhbmQgMiwgMywgNFxyXG4gICAgLy8gaXMgaW4gY291bnRlcmNsb2Nrd2lzZSBvcmRlci5cclxuICAgIGlmICggY2N3KCB4MSwgeTEsIHgzLCB5MywgeDQsIHk0ICkgKiBjY3coIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQgKSA+IDAgfHxcclxuICAgICAgICAgY2N3KCB4MywgeTMsIHgxLCB5MSwgeDIsIHkyICkgKiBjY3coIHg0LCB5NCwgeDEsIHkxLCB4MiwgeTIgKSA+IDBcclxuICAgICkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkZW5vbSA9ICggeDEgLSB4MiApICogKCB5MyAtIHk0ICkgLSAoIHkxIC0geTIgKSAqICggeDMgLSB4NCApO1xyXG4gICAgLy8gSWYgZGVub21pbmF0b3IgaXMgMCwgdGhlIGxpbmVzIGFyZSBwYXJhbGxlbCBvciBjb2luY2lkZW50XHJcbiAgICBpZiAoIE1hdGguYWJzKCBkZW5vbSApIDwgMWUtMTAgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFuIGV4YWN0IGVuZHBvaW50IG92ZXJsYXAgKGFuZCB0aGVuIHJldHVybiBhbiBleGFjdCBhbnN3ZXIpLlxyXG4gICAgaWYgKCAoIHgxID09PSB4MyAmJiB5MSA9PT0geTMgKSB8fCAoIHgxID09PSB4NCAmJiB5MSA9PT0geTQgKSApIHtcclxuICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKCB4MSwgeTEgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCAoIHgyID09PSB4MyAmJiB5MiA9PT0geTMgKSB8fCAoIHgyID09PSB4NCAmJiB5MiA9PT0geTQgKSApIHtcclxuICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKCB4MiwgeTIgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBVc2UgZGV0ZXJtaW5hbnRzIHRvIGNhbGN1bGF0ZSBpbnRlcnNlY3Rpb24sIHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9MaW5lJUUyJTgwJTkzbGluZV9pbnRlcnNlY3Rpb25cclxuICAgIGNvbnN0IGludGVyc2VjdGlvblggPSAoICggeDEgKiB5MiAtIHkxICogeDIgKSAqICggeDMgLSB4NCApIC0gKCB4MSAtIHgyICkgKiAoIHgzICogeTQgLSB5MyAqIHg0ICkgKSAvIGRlbm9tO1xyXG4gICAgY29uc3QgaW50ZXJzZWN0aW9uWSA9ICggKCB4MSAqIHkyIC0geTEgKiB4MiApICogKCB5MyAtIHk0ICkgLSAoIHkxIC0geTIgKSAqICggeDMgKiB5NCAtIHkzICogeDQgKSApIC8gZGVub207XHJcbiAgICByZXR1cm4gbmV3IFZlY3RvcjIoIGludGVyc2VjdGlvblgsIGludGVyc2VjdGlvblkgKTtcclxuICB9LFxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogU3F1YXJlZCBkaXN0YW5jZSBmcm9tIGEgcG9pbnQgdG8gYSBsaW5lIHNlZ21lbnQgc3F1YXJlZC5cclxuICAgKiBTZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84NDkyMTEvc2hvcnRlc3QtZGlzdGFuY2UtYmV0d2Vlbi1hLXBvaW50LWFuZC1hLWxpbmUtc2VnbWVudFxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gcG9pbnQgLSBUaGUgcG9pbnRcclxuICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGEgLSBTdGFydGluZyBwb2ludCBvZiB0aGUgbGluZSBzZWdtZW50XHJcbiAgICogQHBhcmFtIHtWZWN0b3IyfSBiIC0gRW5kaW5nIHBvaW50IG9mIHRoZSBsaW5lIHNlZ21lbnRcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIGRpc3RUb1NlZ21lbnRTcXVhcmVkKCBwb2ludCwgYSwgYiApIHtcclxuICAgIC8vIHRoZSBzcXVhcmUgb2YgdGhlIGRpc3RhbmNlIGJldHdlZW4gYSBhbmQgYixcclxuICAgIGNvbnN0IHNlZ21lbnRTcXVhcmVkTGVuZ3RoID0gYS5kaXN0YW5jZVNxdWFyZWQoIGIgKTtcclxuXHJcbiAgICAvLyBpZiB0aGUgc2VnbWVudCBsZW5ndGggaXMgemVybywgdGhlIGEgYW5kIGIgcG9pbnQgYXJlIGNvaW5jaWRlbnQuIHJldHVybiB0aGUgc3F1YXJlZCBkaXN0YW5jZSBiZXR3ZWVuIGEgYW5kIHBvaW50XHJcbiAgICBpZiAoIHNlZ21lbnRTcXVhcmVkTGVuZ3RoID09PSAwICkgeyByZXR1cm4gcG9pbnQuZGlzdGFuY2VTcXVhcmVkKCBhICk7IH1cclxuXHJcbiAgICAvLyB0aGUgdCB2YWx1ZSBwYXJhbWV0cml6ZSB0aGUgcHJvamVjdGlvbiBvZiB0aGUgcG9pbnQgb250byB0aGUgYSBiIGxpbmVcclxuICAgIGNvbnN0IHQgPSAoICggcG9pbnQueCAtIGEueCApICogKCBiLnggLSBhLnggKSArICggcG9pbnQueSAtIGEueSApICogKCBiLnkgLSBhLnkgKSApIC8gc2VnbWVudFNxdWFyZWRMZW5ndGg7XHJcblxyXG4gICAgbGV0IGRpc3RhbmNlU3F1YXJlZDtcclxuXHJcbiAgICBpZiAoIHQgPCAwICkge1xyXG4gICAgICAvLyBpZiB0PDAsIHRoZSBwcm9qZWN0aW9uIHBvaW50IGlzIG91dHNpZGUgdGhlIGFiIGxpbmUsIGJleW9uZCBhXHJcbiAgICAgIGRpc3RhbmNlU3F1YXJlZCA9IHBvaW50LmRpc3RhbmNlU3F1YXJlZCggYSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHQgPiAxICkge1xyXG4gICAgICAvLyBpZiB0PjEsIHRoZSBwcm9qZWN0aW9uIHBhc3QgaXMgb3V0c2lkZSB0aGUgYWIgc2VnbWVudCwgYmV5b25kIGIsXHJcbiAgICAgIGRpc3RhbmNlU3F1YXJlZCA9IHBvaW50LmRpc3RhbmNlU3F1YXJlZCggYiApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGlmIDA8dDwxLCB0aGUgcHJvamVjdGlvbiBwb2ludCBsaWVzIGFsb25nIHRoZSBsaW5lIGpvaW5pbmcgYSBhbmQgYi5cclxuICAgICAgZGlzdGFuY2VTcXVhcmVkID0gcG9pbnQuZGlzdGFuY2VTcXVhcmVkKCBuZXcgVmVjdG9yMiggYS54ICsgdCAqICggYi54IC0gYS54ICksIGEueSArIHQgKiAoIGIueSAtIGEueSApICkgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZGlzdGFuY2VTcXVhcmVkO1xyXG5cclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBkaXN0YW5jZSBmcm9tIGEgcG9pbnQgdG8gYSBsaW5lIHNlZ21lbnQgc3F1YXJlZC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHBvaW50IC0gVGhlIHBvaW50XHJcbiAgICogQHBhcmFtIHtWZWN0b3IyfSBhIC0gU3RhcnRpbmcgcG9pbnQgb2YgdGhlIGxpbmUgc2VnbWVudFxyXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gYiAtIEVuZGluZyBwb2ludCBvZiB0aGUgbGluZSBzZWdtZW50XHJcbiAgICogQHJldHVybnMge251bWJlcn1cclxuICAgKi9cclxuICBkaXN0VG9TZWdtZW50KCBwb2ludCwgYSwgYiApIHtcclxuICAgIHJldHVybiBNYXRoLnNxcnQoIHRoaXMuZGlzdFRvU2VnbWVudFNxdWFyZWQoIHBvaW50LCBhLCBiICkgKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIHRocmVlIHBvaW50cyBhcmUgYXBwcm94aW1hdGVseSBjb2xsaW5lYXIuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtWZWN0b3IyfSBhXHJcbiAgICogQHBhcmFtIHtWZWN0b3IyfSBiXHJcbiAgICogQHBhcmFtIHtWZWN0b3IyfSBjXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtlcHNpbG9uXVxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAqL1xyXG4gIGFyZVBvaW50c0NvbGxpbmVhciggYSwgYiwgYywgZXBzaWxvbiApIHtcclxuICAgIGlmICggZXBzaWxvbiA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICBlcHNpbG9uID0gMDtcclxuICAgIH1cclxuICAgIHJldHVybiBVdGlscy50cmlhbmdsZUFyZWEoIGEsIGIsIGMgKSA8PSBlcHNpbG9uO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBhcmVhIGluc2lkZSB0aGUgdHJpYW5nbGUgZGVmaW5lZCBieSB0aGUgdGhyZWUgdmVydGljZXMuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtWZWN0b3IyfSBhXHJcbiAgICogQHBhcmFtIHtWZWN0b3IyfSBiXHJcbiAgICogQHBhcmFtIHtWZWN0b3IyfSBjXHJcbiAgICogQHJldHVybnMge251bWJlcn1cclxuICAgKi9cclxuICB0cmlhbmdsZUFyZWEoIGEsIGIsIGMgKSB7XHJcbiAgICByZXR1cm4gTWF0aC5hYnMoIFV0aWxzLnRyaWFuZ2xlQXJlYVNpZ25lZCggYSwgYiwgYyApICk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGFyZWEgaW5zaWRlIHRoZSB0cmlhbmdsZSBkZWZpbmVkIGJ5IHRoZSB0aHJlZSB2ZXJ0aWNlcywgYnV0IHdpdGggdGhlIHNpZ24gZGV0ZXJtaW5lZCBieSB3aGV0aGVyIHRoZSB2ZXJ0aWNlc1xyXG4gICAqIHByb3ZpZGVkIGFyZSBjbG9ja3dpc2Ugb3IgY291bnRlci1jbG9ja3dpc2UuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogSWYgdGhlIHZlcnRpY2VzIGFyZSBjb3VudGVyY2xvY2t3aXNlIChpbiBhIHJpZ2h0LWhhbmRlZCBjb29yZGluYXRlIHN5c3RlbSksIHRoZW4gdGhlIHNpZ25lZCBhcmVhIHdpbGwgYmVcclxuICAgKiBwb3NpdGl2ZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gYVxyXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gYlxyXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gY1xyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgdHJpYW5nbGVBcmVhU2lnbmVkKCBhLCBiLCBjICkge1xyXG4gICAgcmV0dXJuIGEueCAqICggYi55IC0gYy55ICkgKyBiLnggKiAoIGMueSAtIGEueSApICsgYy54ICogKCBhLnkgLSBiLnkgKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjZW50cm9pZCBvZiB0aGUgc2ltcGxlIHBsYW5hciBwb2x5Z29uIHVzaW5nIEdyZWVuJ3MgVGhlb3JlbSBQPS15LzIsIFE9eC8yIChzaW1pbGFyIHRvIGhvdyBraXRlXHJcbiAgICogY29tcHV0ZXMgYXJlYXMpLiBTZWUgYWxzbyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9TaG9lbGFjZV9mb3JtdWxhLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7QXJyYXkuPFZlY3RvcjI+fSB2ZXJ0aWNlc1xyXG4gICAqIEByZXR1cm5zIHtWZWN0b3IyfVxyXG4gICAqL1xyXG4gIGNlbnRyb2lkT2ZQb2x5Z29uKCB2ZXJ0aWNlcyApIHtcclxuICAgIGNvbnN0IGNlbnRyb2lkID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuXHJcbiAgICBsZXQgYXJlYSA9IDA7XHJcbiAgICB2ZXJ0aWNlcy5mb3JFYWNoKCAoIHYwLCBpICkgPT4ge1xyXG4gICAgICBjb25zdCB2MSA9IHZlcnRpY2VzWyAoIGkgKyAxICkgJSB2ZXJ0aWNlcy5sZW5ndGggXTtcclxuICAgICAgY29uc3QgZG91YmxlU2hvZWxhY2UgPSB2MC54ICogdjEueSAtIHYxLnggKiB2MC55O1xyXG5cclxuICAgICAgYXJlYSArPSBkb3VibGVTaG9lbGFjZSAvIDI7XHJcblxyXG4gICAgICAvLyBDb21wdXRlIHRoZSBjZW50cm9pZCBvZiB0aGUgZmxhdCBpbnRlcnNlY3Rpb24gd2l0aCBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9DZW50cm9pZCNPZl9hX3BvbHlnb25cclxuICAgICAgY2VudHJvaWQuYWRkWFkoXHJcbiAgICAgICAgKCB2MC54ICsgdjEueCApICogZG91YmxlU2hvZWxhY2UsXHJcbiAgICAgICAgKCB2MC55ICsgdjEueSApICogZG91YmxlU2hvZWxhY2VcclxuICAgICAgKTtcclxuICAgIH0gKTtcclxuICAgIGNlbnRyb2lkLmRpdmlkZVNjYWxhciggNiAqIGFyZWEgKTtcclxuXHJcbiAgICByZXR1cm4gY2VudHJvaWQ7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogRnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBoeXBlcmJvbGljIGNvc2luZSBvZiBhIG51bWJlclxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgY29zaCggdmFsdWUgKSB7XHJcbiAgICByZXR1cm4gKCBNYXRoLmV4cCggdmFsdWUgKSArIE1hdGguZXhwKCAtdmFsdWUgKSApIC8gMjtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBGdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGh5cGVyYm9saWMgc2luZSBvZiBhIG51bWJlclxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgc2luaCggdmFsdWUgKSB7XHJcbiAgICByZXR1cm4gKCBNYXRoLmV4cCggdmFsdWUgKSAtIE1hdGguZXhwKCAtdmFsdWUgKSApIC8gMjtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBMb2cgYmFzZS0xMCwgc2luY2UgaXQgd2Fzbid0IGluY2x1ZGVkIGluIGV2ZXJ5IHN1cHBvcnRlZCBicm93c2VyLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2YWxcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIGxvZzEwKCB2YWwgKSB7XHJcbiAgICByZXR1cm4gTWF0aC5sb2coIHZhbCApIC8gTWF0aC5MTjEwO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEdlbmVyYXRlcyBhIHJhbmRvbSBHYXVzc2lhbiBzYW1wbGUgd2l0aCB0aGUgZ2l2ZW4gbWVhbiBhbmQgc3RhbmRhcmQgZGV2aWF0aW9uLlxyXG4gICAqIFRoaXMgbWV0aG9kIHJlbGllcyBvbiB0aGUgXCJzdGF0aWNcIiB2YXJpYWJsZXMgZ2VuZXJhdGUsIHowLCBhbmQgejEgZGVmaW5lZCBhYm92ZS5cclxuICAgKiBSYW5kb20uanMgaXMgdGhlIHByaW1hcnkgY2xpZW50IG9mIHRoaXMgZnVuY3Rpb24sIGJ1dCBpdCBpcyBkZWZpbmVkIGhlcmUgc28gaXQgY2FuIGJlXHJcbiAgICogdXNlZCBvdGhlciBwbGFjZXMgbW9yZSBlYXNpbHkgaWYgbmVlZCBiZS5cclxuICAgKiBDb2RlIGluc3BpcmVkIGJ5IGV4YW1wbGUgaGVyZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQm94JUUyJTgwJTkzTXVsbGVyX3RyYW5zZm9ybS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gbXUgLSBUaGUgbWVhbiBvZiB0aGUgR2F1c3NpYW5cclxuICAgKiBAcGFyYW0ge251bWJlcn0gc2lnbWEgLSBUaGUgc3RhbmRhcmQgZGV2aWF0aW9uIG9mIHRoZSBHYXVzc2lhblxyXG4gICAqIEBwYXJhbSB7UmFuZG9tfSByYW5kb20gLSB0aGUgc291cmNlIG9mIHJhbmRvbW5lc3NcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIGJveE11bGxlclRyYW5zZm9ybSggbXUsIHNpZ21hLCByYW5kb20gKSB7XHJcbiAgICBnZW5lcmF0ZSA9ICFnZW5lcmF0ZTtcclxuXHJcbiAgICBpZiAoICFnZW5lcmF0ZSApIHtcclxuICAgICAgcmV0dXJuIHoxICogc2lnbWEgKyBtdTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgdTE7XHJcbiAgICBsZXQgdTI7XHJcbiAgICBkbyB7XHJcbiAgICAgIHUxID0gcmFuZG9tLm5leHREb3VibGUoKTtcclxuICAgICAgdTIgPSByYW5kb20ubmV4dERvdWJsZSgpO1xyXG4gICAgfVxyXG4gICAgd2hpbGUgKCB1MSA8PSBFUFNJTE9OICk7XHJcblxyXG4gICAgejAgPSBNYXRoLnNxcnQoIC0yLjAgKiBNYXRoLmxvZyggdTEgKSApICogTWF0aC5jb3MoIFRXT19QSSAqIHUyICk7XHJcbiAgICB6MSA9IE1hdGguc3FydCggLTIuMCAqIE1hdGgubG9nKCB1MSApICkgKiBNYXRoLnNpbiggVFdPX1BJICogdTIgKTtcclxuICAgIHJldHVybiB6MCAqIHNpZ21hICsgbXU7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lcyB0aGUgbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzIGluIGEgdmFsdWUuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gYSBmaW5pdGUgbnVtYmVyLCBzY2llbnRpZmljIG5vdGF0aW9uIGlzIG5vdCBzdXBwb3J0ZWQgZm9yIGRlY2ltYWwgbnVtYmVyc1xyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgbnVtYmVyT2ZEZWNpbWFsUGxhY2VzKCB2YWx1ZSApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgaXNGaW5pdGUoIHZhbHVlICksIGB2YWx1ZSBtdXN0IGJlIGEgZmluaXRlIG51bWJlciAke3ZhbHVlfWAgKTtcclxuICAgIGlmICggTWF0aC5mbG9vciggdmFsdWUgKSA9PT0gdmFsdWUgKSB7XHJcbiAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvbnN0IHN0cmluZyA9IHZhbHVlLnRvU3RyaW5nKCk7XHJcblxyXG4gICAgICAvLyBIYW5kbGUgc2NpZW50aWZpYyBub3RhdGlvblxyXG4gICAgICBpZiAoIHN0cmluZy5pbmNsdWRlcyggJ2UnICkgKSB7XHJcbiAgICAgICAgLy8gZS5nLiAnMWUtMjEnLCAnNS42ZSszNCcsIGV0Yy5cclxuICAgICAgICBjb25zdCBzcGxpdCA9IHN0cmluZy5zcGxpdCggJ2UnICk7XHJcbiAgICAgICAgY29uc3QgbWFudGlzc2EgPSBzcGxpdFsgMCBdOyAvLyBUaGUgbGVmdCBwYXJ0LCBlLmcuICcxJyBvciAnNS42J1xyXG4gICAgICAgIGNvbnN0IGV4cG9uZW50ID0gTnVtYmVyKCBzcGxpdFsgMSBdICk7IC8vIFRoZSByaWdodCBwYXJ0LCBlLmcuICctMjEnIG9yICcrMzQnXHJcblxyXG4gICAgICAgIC8vIEhvdyBtYW55IGRlY2ltYWwgcGxhY2VzIGFyZSB0aGVyZSBpbiB0aGUgbGVmdCBwYXJ0XHJcbiAgICAgICAgY29uc3QgbWFudGlzc2FEZWNpbWFsUGxhY2VzID0gbWFudGlzc2EuaW5jbHVkZXMoICcuJyApID8gbWFudGlzc2Euc3BsaXQoICcuJyApWyAxIF0ubGVuZ3RoIDogMDtcclxuXHJcbiAgICAgICAgLy8gV2UgYWRqdXN0IHRoZSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMgYnkgdGhlIGV4cG9uZW50LCBlLmcuICcxLjVlMScgaGFzIHplcm8gZGVjaW1hbCBwbGFjZXMsIGFuZFxyXG4gICAgICAgIC8vICcxLjVlLTInIGhhcyB0aHJlZS5cclxuICAgICAgICByZXR1cm4gTWF0aC5tYXgoIG1hbnRpc3NhRGVjaW1hbFBsYWNlcyAtIGV4cG9uZW50LCAwICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7IC8vIEhhbmRsZSBkZWNpbWFsIG5vdGF0aW9uLiBTaW5jZSB3ZSdyZSBub3QgYW4gaW50ZWdlciwgd2Ugc2hvdWxkIGJlIGd1YXJhbnRlZWQgdG8gaGF2ZSBhIGRlY2ltYWxcclxuICAgICAgICByZXR1cm4gc3RyaW5nLnNwbGl0KCAnLicgKVsgMSBdLmxlbmd0aDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJvdW5kcyBhIHZhbHVlIHRvIGEgbXVsdGlwbGUgb2YgYSBzcGVjaWZpZWQgaW50ZXJ2YWwuXHJcbiAgICogRXhhbXBsZXM6XHJcbiAgICogcm91bmRUb0ludGVydmFsKCAwLjU2NywgMC4wMSApIC0+IDAuNTdcclxuICAgKiByb3VuZFRvSW50ZXJ2YWwoIDAuNTY3LCAwLjAyICkgLT4gMC41NlxyXG4gICAqIHJvdW5kVG9JbnRlcnZhbCggNS42NywgMC41ICkgLT4gNS41XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcclxuICAgKiBAcGFyYW0ge251bWJlcn0gaW50ZXJ2YWxcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIHJvdW5kVG9JbnRlcnZhbCggdmFsdWUsIGludGVydmFsICkge1xyXG4gICAgcmV0dXJuIFV0aWxzLnRvRml4ZWROdW1iZXIoIFV0aWxzLnJvdW5kU3ltbWV0cmljKCB2YWx1ZSAvIGludGVydmFsICkgKiBpbnRlcnZhbCxcclxuICAgICAgVXRpbHMubnVtYmVyT2ZEZWNpbWFsUGxhY2VzKCBpbnRlcnZhbCApICk7XHJcbiAgfVxyXG59O1xyXG5kb3QucmVnaXN0ZXIoICdVdGlscycsIFV0aWxzICk7XHJcblxyXG4vLyBtYWtlIHRoZXNlIGF2YWlsYWJsZSBpbiB0aGUgbWFpbiBuYW1lc3BhY2UgZGlyZWN0bHkgKGZvciBub3cpXHJcbmRvdC5jbGFtcCA9IFV0aWxzLmNsYW1wO1xyXG5kb3QubW9kdWxvQmV0d2VlbkRvd24gPSBVdGlscy5tb2R1bG9CZXR3ZWVuRG93bjtcclxuZG90Lm1vZHVsb0JldHdlZW5VcCA9IFV0aWxzLm1vZHVsb0JldHdlZW5VcDtcclxuZG90LnJhbmdlSW5jbHVzaXZlID0gVXRpbHMucmFuZ2VJbmNsdXNpdmU7XHJcbmRvdC5yYW5nZUV4Y2x1c2l2ZSA9IFV0aWxzLnJhbmdlRXhjbHVzaXZlO1xyXG5kb3QudG9SYWRpYW5zID0gVXRpbHMudG9SYWRpYW5zO1xyXG5kb3QudG9EZWdyZWVzID0gVXRpbHMudG9EZWdyZWVzO1xyXG5kb3QubGluZUxpbmVJbnRlcnNlY3Rpb24gPSBVdGlscy5saW5lTGluZUludGVyc2VjdGlvbjtcclxuZG90LmxpbmVTZWdtZW50SW50ZXJzZWN0aW9uID0gVXRpbHMubGluZVNlZ21lbnRJbnRlcnNlY3Rpb247XHJcbmRvdC5zcGhlcmVSYXlJbnRlcnNlY3Rpb24gPSBVdGlscy5zcGhlcmVSYXlJbnRlcnNlY3Rpb247XHJcbmRvdC5zb2x2ZVF1YWRyYXRpY1Jvb3RzUmVhbCA9IFV0aWxzLnNvbHZlUXVhZHJhdGljUm9vdHNSZWFsO1xyXG5kb3Quc29sdmVDdWJpY1Jvb3RzUmVhbCA9IFV0aWxzLnNvbHZlQ3ViaWNSb290c1JlYWw7XHJcbmRvdC5jdWJlUm9vdCA9IFV0aWxzLmN1YmVSb290O1xyXG5kb3QubGluZWFyID0gVXRpbHMubGluZWFyO1xyXG5kb3QuYm94TXVsbGVyVHJhbnNmb3JtID0gVXRpbHMuYm94TXVsbGVyVHJhbnNmb3JtO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgVXRpbHM7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLEdBQUcsTUFBTSxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQ2xELE9BQU9DLEdBQUcsTUFBTSxVQUFVO0FBQzFCLE9BQU9DLE9BQU8sTUFBTSxjQUFjO0FBQ2xDLE9BQU9DLE9BQU8sTUFBTSxjQUFjOztBQUVsQztBQUNBLE1BQU1DLE9BQU8sR0FBR0MsTUFBTSxDQUFDQyxTQUFTO0FBQ2hDLE1BQU1DLE1BQU0sR0FBRyxDQUFDLEdBQUdDLElBQUksQ0FBQ0MsRUFBRTs7QUFFMUI7QUFDQSxJQUFJQyxRQUFRO0FBQ1osSUFBSUMsRUFBRTtBQUNOLElBQUlDLEVBQUU7QUFFTixNQUFNQyxLQUFLLEdBQUc7RUFDWjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxLQUFLQSxDQUFFQyxLQUFLLEVBQUVDLEdBQUcsRUFBRUMsR0FBRyxFQUFHO0lBQ3ZCLElBQUtGLEtBQUss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