// Copyright 2013-2024, University of Colorado Boulder

/**
 * A Canvas-style stateful (mutable) subpath, which tracks segments in addition to the points.
 *
 * See http://www.w3.org/TR/2dcontext/#concept-path
 * for the path / subpath Canvas concept.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import TinyEmitter from '../../../axon/js/TinyEmitter.js';
import Bounds2 from '../../../dot/js/Bounds2.js';
import Vector2 from '../../../dot/js/Vector2.js';
import { Arc, kite, Line, LineStyles, Segment } from '../imports.js';
class Subpath {
  segments = [];
  invalidatedEmitter = new TinyEmitter();

  // If non-null, the bounds of the subpath
  _bounds = null;

  // cached stroked shape (so hit testing can be done quickly on stroked shapes)
  _strokedSubpaths = null;
  _strokedSubpathsComputed = false;
  _strokedStyles = null;

  // So we can invalidate all of the points without firing invalidation tons of times
  _invalidatingPoints = false;
  /**
   * NOTE: No arguments required (they are usually used for copy() usage or creation with new segments)
   */
  constructor(segments, points, closed) {
    // recombine points if necessary, based off of start points of segments + the end point of the last segment
    this.points = points || (segments && segments.length ? _.map(segments, segment => segment.start).concat(segments[segments.length - 1].end) : []);
    this.closed = !!closed;
    this._invalidateListener = this.invalidate.bind(this);

    // Add all segments directly (hooks up invalidation listeners properly)
    if (segments) {
      for (let i = 0; i < segments.length; i++) {
        _.each(segments[i].getNondegenerateSegments(), segment => {
          this.addSegmentDirectly(segment);
        });
      }
    }
  }

  /**
   * Returns the bounds of this subpath. It is the bounding-box union of the bounds of each segment contained.
   */
  getBounds() {
    if (this._bounds === null) {
      const bounds = Bounds2.NOTHING.copy();
      _.each(this.segments, segment => {
        bounds.includeBounds(segment.getBounds());
      });
      this._bounds = bounds;
    }
    return this._bounds;
  }
  get bounds() {
    return this.getBounds();
  }

  /**
   * Returns the (sometimes approximate) arc length of the subpath.
   */
  getArcLength(distanceEpsilon, curveEpsilon, maxLevels) {
    let length = 0;
    for (let i = 0; i < this.segments.length; i++) {
      length += this.segments[i].getArcLength(distanceEpsilon, curveEpsilon, maxLevels);
    }
    return length;
  }

  /**
   * Returns an immutable copy of this subpath
   */
  copy() {
    return new Subpath(this.segments.slice(0), this.points.slice(0), this.closed);
  }

  /**
   * Invalidates all segments (then ourself), since some points in segments may have been changed.
   */
  invalidatePoints() {
    this._invalidatingPoints = true;
    const numSegments = this.segments.length;
    for (let i = 0; i < numSegments; i++) {
      this.segments[i].invalidate();
    }
    this._invalidatingPoints = false;
    this.invalidate();
  }

  /**
   * Trigger invalidation (usually for our Shape)
   * (kite-internal)
   */
  invalidate() {
    if (!this._invalidatingPoints) {
      this._bounds = null;
      this._strokedSubpathsComputed = false;
      this.invalidatedEmitter.emit();
    }
  }

  /**
   * Adds a point to this subpath
   */
  addPoint(point) {
    this.points.push(point);
    return this; // allow chaining
  }

  /**
   * Adds a segment directly
   *
   * CAUTION: REALLY! Make sure we invalidate() after this is called
   */
  addSegmentDirectly(segment) {
    assert && assert(segment.start.isFinite(), 'Segment start is infinite');
    assert && assert(segment.end.isFinite(), 'Segment end is infinite');
    assert && assert(segment.startTangent.isFinite(), 'Segment startTangent is infinite');
    assert && assert(segment.endTangent.isFinite(), 'Segment endTangent is infinite');
    assert && assert(segment.bounds.isEmpty() || segment.bounds.isFinite(), 'Segment bounds is infinite and non-empty');
    this.segments.push(segment);

    // Hook up an invalidation listener, so if this segment is invalidated, it will invalidate our subpath!
    // NOTE: if we add removal of segments, we'll need to remove these listeners, or we'll leak!
    segment.invalidationEmitter.addListener(this._invalidateListener);
    return this; // allow chaining
  }

  /**
   * Adds a segment to this subpath
   */
  addSegment(segment) {
    const nondegenerateSegments = segment.getNondegenerateSegments();
    const numNondegenerateSegments = nondegenerateSegments.length;
    for (let i = 0; i < numNondegenerateSegments; i++) {
      this.addSegmentDirectly(segment);
    }
    this.invalidate(); // need to invalidate after addSegmentDirectly

    return this; // allow chaining
  }

  /**
   * Adds a line segment from the start to end (if non-zero length) and marks the subpath as closed.
   * NOTE: normally you just want to mark the subpath as closed, and not generate the closing segment this way?
   */
  addClosingSegment() {
    if (this.hasClosingSegment()) {
      const closingSegment = this.getClosingSegment();
      this.addSegmentDirectly(closingSegment);
      this.invalidate(); // need to invalidate after addSegmentDirectly
      this.addPoint(this.getFirstPoint());
      this.closed = true;
    }
  }

  /**
   * Sets this subpath to be a closed path
   */
  close() {
    this.closed = true;

    // If needed, add a connecting "closing" segment
    this.addClosingSegment();
  }

  /**
   * Returns the numbers of points in this subpath
   *
   * TODO: This is a confusing name! It should be getNumPoints() or something https://github.com/phetsims/kite/issues/76
   */
  getLength() {
    return this.points.length;
  }

  /**
   * Returns the first point of this subpath
   */
  getFirstPoint() {
    assert && assert(this.points.length);
    return _.first(this.points);
  }

  /**
   * Returns the last point of this subpath
   */
  getLastPoint() {
    assert && assert(this.points.length);
    return _.last(this.points);
  }

  /**
   * Returns the first segment of this subpath
   */
  getFirstSegment() {
    assert && assert(this.segments.length);
    return _.first(this.segments);
  }

  /**
   * Returns the last segment of this subpath
   */
  getLastSegment() {
    assert && assert(this.segments.length);
    return _.last(this.segments);
  }

  /**
   * Returns segments that include the "filled" area, which may include an extra closing segment if necessary.
   */
  getFillSegments() {
    const segments = this.segments.slice();
    if (this.hasClosingSegment()) {
      segments.push(this.getClosingSegment());
    }
    return segments;
  }

  /**
   * Determines if this subpath is drawable, i.e. if it contains asny segments
   */
  isDrawable() {
    return this.segments.length > 0;
  }

  /**
   * Determines if this subpath is a closed path, i.e. if the flag is set to closed
   */
  isClosed() {
    return this.closed;
  }

  /**
   * Determines if this subpath is a closed path, i.e. if it has a closed segment
   */
  hasClosingSegment() {
    return !this.getFirstPoint().equalsEpsilon(this.getLastPoint(), 0.000000001);
  }

  /**
   * Returns a line that would close this subpath
   */
  getClosingSegment() {
    assert && assert(this.hasClosingSegment(), 'Implicit closing segment unnecessary on a fully closed path');
    return new Line(this.getLastPoint(), this.getFirstPoint());
  }

  /**
   * Returns an array of potential closest points on the subpath to the given point.
   */
  getClosestPoints(point) {
    return Segment.filterClosestToPointResult(_.flatten(this.segments.map(segment => segment.getClosestPoints(point))));
  }

  /**
   * Draws the segment to the 2D Canvas context, assuming the context's current location is already at the start point
   */
  writeToContext(context) {
    if (this.isDrawable()) {
      const startPoint = this.getFirstSegment().start;
      context.moveTo(startPoint.x, startPoint.y); // the segments assume the current context position is at their start

      let len = this.segments.length;

      // Omit an ending line segment if our path is closed.
      // see https://github.com/phetsims/ph-scale/issues/83#issuecomment-512663949
      if (this.closed && len >= 2 && this.segments[len - 1] instanceof Line) {
        len--;
      }
      for (let i = 0; i < len; i++) {
        this.segments[i].writeToContext(context);
      }
      if (this.closed) {
        context.closePath();
      }
    }
  }

  /**
   * Converts this subpath to a new subpath made of many line segments (approximating the current subpath)
   */
  toPiecewiseLinear(options) {
    assert && assert(!options.pointMap, 'For use with pointMap, please use nonlinearTransformed');
    return new Subpath(_.flatten(_.map(this.segments, segment => segment.toPiecewiseLinearSegments(options))), undefined, this.closed);
  }

  /**
   * Returns a copy of this Subpath transformed with the given matrix.
   */
  transformed(matrix) {
    return new Subpath(_.map(this.segments, segment => segment.transformed(matrix)), _.map(this.points, point => matrix.timesVector2(point)), this.closed);
  }

  /**
   * Converts this subpath to a new subpath made of many line segments (approximating the current subpath) with the
   * transformation applied.
   */
  nonlinearTransformed(options) {
    return new Subpath(_.flatten(_.map(this.segments, segment => {
      // check for this segment's support for the specific transform or discretization being applied
      // @ts-expect-error We don't need it to exist on segments, but we do want it to exist on some segments
      if (options.methodName && segment[options.methodName]) {
        // @ts-expect-error We don't need it to exist on segments, but we do want it to exist on some segments
        return segment[options.methodName](options);
      } else {
        return segment.toPiecewiseLinearSegments(options);
      }
    })), undefined, this.closed);
  }

  /**
   * Returns the bounds of this subpath when transform by a matrix.
   */
  getBoundsWithTransform(matrix) {
    const bounds = Bounds2.NOTHING.copy();
    const numSegments = this.segments.length;
    for (let i = 0; i < numSegments; i++) {
      bounds.includeBounds(this.segments[i].getBoundsWithTransform(matrix));
    }
    return bounds;
  }

  /**
   * Returns a subpath that is offset from this subpath by a distance
   *
   * TODO: Resolve the bug with the inside-line-join overlap. We have the intersection handling now (potentially) https://github.com/phetsims/kite/issues/76
   */
  offset(distance) {
    if (!this.isDrawable()) {
      return new Subpath([], undefined, this.closed);
    }
    if (distance === 0) {
      return new Subpath(this.segments.slice(), undefined, this.closed);
    }
    let i;
    const regularSegments = this.segments.slice();
    const offsets = [];
    for (i = 0; i < regularSegments.length; i++) {
      offsets.push(regularSegments[i].strokeLeft(2 * distance));
    }
    let segments = [];
    for (i = 0; i < regularSegments.length; i++) {
      if (this.closed || i > 0) {
        const previousI = (i > 0 ? i : regularSegments.length) - 1;
        const center = regularSegments[i].start;
        const fromTangent = regularSegments[previousI].endTangent;
        const toTangent = regularSegments[i].startTangent;
        const startAngle = fromTangent.perpendicular.negated().times(distance).angle;
        const endAngle = toTangent.perpendicular.negated().times(distance).angle;
        const anticlockwise = fromTangent.perpendicular.dot(toTangent) > 0;
        segments.push(new Arc(center, Math.abs(distance), startAngle, endAngle, anticlockwise));
      }
      segments = segments.concat(offsets[i]);
    }
    return new Subpath(segments, undefined, this.closed);
  }

  /**
   * Returns an array of subpaths (one if open, two if closed) that represent a stroked copy of this subpath.
   */
  stroked(lineStyles) {
    // non-drawable subpaths convert to empty subpaths
    if (!this.isDrawable()) {
      return [];
    }
    if (lineStyles === undefined) {
      lineStyles = new LineStyles();
    }

    // return a cached version if possible
    assert && assert(!this._strokedSubpathsComputed || this._strokedStyles && this._strokedSubpaths);
    if (this._strokedSubpathsComputed && this._strokedStyles.equals(lineStyles)) {
      return this._strokedSubpaths;
    }
    const lineWidth = lineStyles.lineWidth;
    let i;
    let leftSegments = [];
    let rightSegments = [];
    const firstSegment = this.getFirstSegment();
    const lastSegment = this.getLastSegment();
    const appendLeftSegments = segments => {
      leftSegments = leftSegments.concat(segments);
    };
    const appendRightSegments = segments => {
      rightSegments = rightSegments.concat(segments);
    };

    // we don't need to insert an implicit closing segment if the start and end points are the same
    const alreadyClosed = lastSegment.end.equals(firstSegment.start);
    // if there is an implicit closing segment
    const closingSegment = alreadyClosed ? null : new Line(this.segments[this.segments.length - 1].end, this.segments[0].start);

    // stroke the logical "left" side of our path
    for (i = 0; i < this.segments.length; i++) {
      if (i > 0) {
        appendLeftSegments(lineStyles.leftJoin(this.segments[i].start, this.segments[i - 1].endTangent, this.segments[i].startTangent));
      }
      appendLeftSegments(this.segments[i].strokeLeft(lineWidth));
    }

    // stroke the logical "right" side of our path
    for (i = this.segments.length - 1; i >= 0; i--) {
      if (i < this.segments.length - 1) {
        appendRightSegments(lineStyles.rightJoin(this.segments[i].end, this.segments[i].endTangent, this.segments[i + 1].startTangent));
      }
      appendRightSegments(this.segments[i].strokeRight(lineWidth));
    }
    let subpaths;
    if (this.closed) {
      if (alreadyClosed) {
        // add the joins between the start and end
        appendLeftSegments(lineStyles.leftJoin(lastSegment.end, lastSegment.endTangent, firstSegment.startTangent));
        appendRightSegments(lineStyles.rightJoin(lastSegment.end, lastSegment.endTangent, firstSegment.startTangent));
      } else {
        // logical "left" stroke on the implicit closing segment
        appendLeftSegments(lineStyles.leftJoin(closingSegment.start, lastSegment.endTangent, closingSegment.startTangent));
        appendLeftSegments(closingSegment.strokeLeft(lineWidth));
        appendLeftSegments(lineStyles.leftJoin(closingSegment.end, closingSegment.endTangent, firstSegment.startTangent));

        // logical "right" stroke on the implicit closing segment
        appendRightSegments(lineStyles.rightJoin(closingSegment.end, closingSegment.endTangent, firstSegment.startTangent));
        appendRightSegments(closingSegment.strokeRight(lineWidth));
        appendRightSegments(lineStyles.rightJoin(closingSegment.start, lastSegment.endTangent, closingSegment.startTangent));
      }
      subpaths = [new Subpath(leftSegments, undefined, true), new Subpath(rightSegments, undefined, true)];
    } else {
      subpaths = [new Subpath(leftSegments.concat(lineStyles.cap(lastSegment.end, lastSegment.endTangent)).concat(rightSegments).concat(lineStyles.cap(firstSegment.start, firstSegment.startTangent.negated())), undefined, true)];
    }
    this._strokedSubpaths = subpaths;
    this._strokedSubpathsComputed = true;
    this._strokedStyles = lineStyles.copy(); // shallow copy, since we consider linestyles to be mutable

    return subpaths;
  }

  /**
   * Returns a copy of this subpath with the dash "holes" removed (has many subpaths usually).
   *
   * @param lineDash
   * @param lineDashOffset
   * @param distanceEpsilon - controls level of subdivision by attempting to ensure a maximum (squared) deviation from the curve
   * @param curveEpsilon - controls level of subdivision by attempting to ensure a maximum curvature change between segments
   */
  dashed(lineDash, lineDashOffset, distanceEpsilon, curveEpsilon) {
    // Combine segment arrays (collapsing the two-most-adjacent arrays into one, with concatenation)
    const combineSegmentArrays = (left, right) => {
      const combined = left[left.length - 1].concat(right[0]);
      const result = left.slice(0, left.length - 1).concat([combined]).concat(right.slice(1));
      assert && assert(result.length === left.length + right.length - 1);
      return result;
    };

    // Whether two dash items (return type from getDashValues()) can be combined together to have their end segments
    // combined with combineSegmentArrays.
    const canBeCombined = (leftItem, rightItem) => {
      if (!leftItem.hasRightFilled || !rightItem.hasLeftFilled) {
        return false;
      }
      const leftSegment = _.last(_.last(leftItem.segmentArrays));
      const rightSegment = rightItem.segmentArrays[0][0];
      return leftSegment.end.distance(rightSegment.start) < 1e-5;
    };

    // Compute all the dashes
    const dashItems = [];
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      const dashItem = segment.getDashValues(lineDash, lineDashOffset, distanceEpsilon, curveEpsilon);
      dashItems.push(dashItem);

      // We moved forward in the offset by this much
      lineDashOffset += dashItem.arcLength;
      const values = [0].concat(dashItem.values).concat([1]);
      const initiallyInside = dashItem.initiallyInside;

      // Mark whether the ends are filled, so adjacent filled ends can be combined
      dashItem.hasLeftFilled = initiallyInside;
      dashItem.hasRightFilled = values.length % 2 === 0 ? initiallyInside : !initiallyInside;

      // {Array.<Array.<Segment>>}, where each contained array will be turned into a subpath at the end.
      dashItem.segmentArrays = [];
      for (let j = initiallyInside ? 0 : 1; j < values.length - 1; j += 2) {
        if (values[j] !== values[j + 1]) {
          dashItem.segmentArrays.push([segment.slice(values[j], values[j + 1])]);
        }
      }
    }

    // Combine adjacent which both are filled on the middle
    for (let i = dashItems.length - 1; i >= 1; i--) {
      const leftItem = dashItems[i - 1];
      const rightItem = dashItems[i];
      if (canBeCombined(leftItem, rightItem)) {
        dashItems.splice(i - 1, 2, {
          segmentArrays: combineSegmentArrays(leftItem.segmentArrays, rightItem.segmentArrays),
          hasLeftFilled: leftItem.hasLeftFilled,
          hasRightFilled: rightItem.hasRightFilled
        });
      }
    }

    // Combine adjacent start/end if applicable
    if (dashItems.length > 1 && canBeCombined(dashItems[dashItems.length - 1], dashItems[0])) {
      const leftItem = dashItems.pop();
      const rightItem = dashItems.shift();
      dashItems.push({
        segmentArrays: combineSegmentArrays(leftItem.segmentArrays, rightItem.segmentArrays),
        hasLeftFilled: leftItem.hasLeftFilled,
        hasRightFilled: rightItem.hasRightFilled
      });
    }

    // Determine if we are closed (have only one subpath)
    if (this.closed && dashItems.length === 1 && dashItems[0].segmentArrays.length === 1 && dashItems[0].hasLeftFilled && dashItems[0].hasRightFilled) {
      return [new Subpath(dashItems[0].segmentArrays[0], undefined, true)];
    }

    // Convert to subpaths
    return _.flatten(dashItems.map(dashItem => dashItem.segmentArrays)).map(segments => new Subpath(segments));
  }

  /**
   * Returns an object form that can be turned back into a segment with the corresponding deserialize method.
   */
  serialize() {
    return {
      type: 'Subpath',
      segments: this.segments.map(segment => segment.serialize()),
      points: this.points.map(point => ({
        x: point.x,
        y: point.y
      })),
      closed: this.closed
    };
  }

  /**
   * Returns a Subpath from the serialized representation.
   */
  static deserialize(obj) {
    assert && assert(obj.type === 'Subpath');
    return new Subpath(obj.segments.map(Segment.deserialize), obj.points.map(pt => new Vector2(pt.x, pt.y)), obj.closed);
  }
}
kite.register('Subpath', Subpath);
export default Subpath;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55RW1pdHRlciIsIkJvdW5kczIiLCJWZWN0b3IyIiwiQXJjIiwia2l0ZSIsIkxpbmUiLCJMaW5lU3R5bGVzIiwiU2VnbWVudCIsIlN1YnBhdGgiLCJzZWdtZW50cyIsImludmFsaWRhdGVkRW1pdHRlciIsIl9ib3VuZHMiLCJfc3Ryb2tlZFN1YnBhdGhzIiwiX3N0cm9rZWRTdWJwYXRoc0NvbXB1dGVkIiwiX3N0cm9rZWRTdHlsZXMiLCJfaW52YWxpZGF0aW5nUG9pbnRzIiwiY29uc3RydWN0b3IiLCJwb2ludHMiLCJjbG9zZWQiLCJsZW5ndGgiLCJfIiwibWFwIiwic2VnbWVudCIsInN0YXJ0IiwiY29uY2F0IiwiZW5kIiwiX2ludmFsaWRhdGVMaXN0ZW5lciIsImludmFsaWRhdGUiLCJiaW5kIiwiaSIsImVhY2giLCJnZXROb25kZWdlbmVyYXRlU2VnbWVudHMiLCJhZGRTZWdtZW50RGlyZWN0bHkiLCJnZXRCb3VuZHMiLCJib3VuZHMiLCJOT1RISU5HIiwiY29weSIsImluY2x1ZGVCb3VuZHMiLCJnZXRBcmNMZW5ndGgiLCJkaXN0YW5jZUVwc2lsb24iLCJjdXJ2ZUVwc2lsb24iLCJtYXhMZXZlbHMiLCJzbGljZSIsImludmFsaWRhdGVQb2ludHMiLCJudW1TZWdtZW50cyIsImVtaXQiLCJhZGRQb2ludCIsInBvaW50IiwicHVzaCIsImFzc2VydCIsImlzRmluaXRlIiwic3RhcnRUYW5nZW50IiwiZW5kVGFuZ2VudCIsImlzRW1wdHkiLCJpbnZhbGlkYXRpb25FbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJhZGRTZWdtZW50Iiwibm9uZGVnZW5lcmF0ZVNlZ21lbnRzIiwibnVtTm9uZGVnZW5lcmF0ZVNlZ21lbnRzIiwiYWRkQ2xvc2luZ1NlZ21lbnQiLCJoYXNDbG9zaW5nU2VnbWVudCIsImNsb3NpbmdTZWdtZW50IiwiZ2V0Q2xvc2luZ1NlZ21lbnQiLCJnZXRGaXJzdFBvaW50IiwiY2xvc2UiLCJnZXRMZW5ndGgiLCJmaXJzdCIsImdldExhc3RQb2ludCIsImxhc3QiLCJnZXRGaXJzdFNlZ21lbnQiLCJnZXRMYXN0U2VnbWVudCIsImdldEZpbGxTZWdtZW50cyIsImlzRHJhd2FibGUiLCJpc0Nsb3NlZCIsImVxdWFsc0Vwc2lsb24iLCJnZXRDbG9zZXN0UG9pbnRzIiwiZmlsdGVyQ2xvc2VzdFRvUG9pbnRSZXN1bHQiLCJmbGF0dGVuIiwid3JpdGVUb0NvbnRleHQiLCJjb250ZXh0Iiwic3RhcnRQb2ludCIsIm1vdmVUbyIsIngiLCJ5IiwibGVuIiwiY2xvc2VQYXRoIiwidG9QaWVjZXdpc2VMaW5lYXIiLCJvcHRpb25zIiwicG9pbnRNYXAiLCJ0b1BpZWNld2lzZUxpbmVhclNlZ21lbnRzIiwidW5kZWZpbmVkIiwidHJhbnNmb3JtZWQiLCJtYXRyaXgiLCJ0aW1lc1ZlY3RvcjIiLCJub25saW5lYXJUcmFuc2Zvcm1lZCIsIm1ldGhvZE5hbWUiLCJnZXRCb3VuZHNXaXRoVHJhbnNmb3JtIiwib2Zmc2V0IiwiZGlzdGFuY2UiLCJyZWd1bGFyU2VnbWVudHMiLCJvZmZzZXRzIiwic3Ryb2tlTGVmdCIsInByZXZpb3VzSSIsImNlbnRlciIsImZyb21UYW5nZW50IiwidG9UYW5nZW50Iiwic3RhcnRBbmdsZSIsInBlcnBlbmRpY3VsYXIiLCJuZWdhdGVkIiwidGltZXMiLCJhbmdsZSIsImVuZEFuZ2xlIiwiYW50aWNsb2Nrd2lzZSIsImRvdCIsIk1hdGgiLCJhYnMiLCJzdHJva2VkIiwibGluZVN0eWxlcyIsImVxdWFscyIsImxpbmVXaWR0aCIsImxlZnRTZWdtZW50cyIsInJpZ2h0U2VnbWVudHMiLCJmaXJzdFNlZ21lbnQiLCJsYXN0U2VnbWVudCIsImFwcGVuZExlZnRTZWdtZW50cyIsImFwcGVuZFJpZ2h0U2VnbWVudHMiLCJhbHJlYWR5Q2xvc2VkIiwibGVmdEpvaW4iLCJyaWdodEpvaW4iLCJzdHJva2VSaWdodCIsInN1YnBhdGhzIiwiY2FwIiwiZGFzaGVkIiwibGluZURhc2giLCJsaW5lRGFzaE9mZnNldCIsImNvbWJpbmVTZWdtZW50QXJyYXlzIiwibGVmdCIsInJpZ2h0IiwiY29tYmluZWQiLCJyZXN1bHQiLCJjYW5CZUNvbWJpbmVkIiwibGVmdEl0ZW0iLCJyaWdodEl0ZW0iLCJoYXNSaWdodEZpbGxlZCIsImhhc0xlZnRGaWxsZWQiLCJsZWZ0U2VnbWVudCIsInNlZ21lbnRBcnJheXMiLCJyaWdodFNlZ21lbnQiLCJkYXNoSXRlbXMiLCJkYXNoSXRlbSIsImdldERhc2hWYWx1ZXMiLCJhcmNMZW5ndGgiLCJ2YWx1ZXMiLCJpbml0aWFsbHlJbnNpZGUiLCJqIiwic3BsaWNlIiwicG9wIiwic2hpZnQiLCJzZXJpYWxpemUiLCJ0eXBlIiwiZGVzZXJpYWxpemUiLCJvYmoiLCJwdCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiU3VicGF0aC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIENhbnZhcy1zdHlsZSBzdGF0ZWZ1bCAobXV0YWJsZSkgc3VicGF0aCwgd2hpY2ggdHJhY2tzIHNlZ21lbnRzIGluIGFkZGl0aW9uIHRvIHRoZSBwb2ludHMuXHJcbiAqXHJcbiAqIFNlZSBodHRwOi8vd3d3LnczLm9yZy9UUi8yZGNvbnRleHQvI2NvbmNlcHQtcGF0aFxyXG4gKiBmb3IgdGhlIHBhdGggLyBzdWJwYXRoIENhbnZhcyBjb25jZXB0LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IFRpbnlFbWl0dGVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvVGlueUVtaXR0ZXIuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgeyBBcmMsIENsb3Nlc3RUb1BvaW50UmVzdWx0LCBEYXNoVmFsdWVzLCBraXRlLCBMaW5lLCBMaW5lU3R5bGVzLCBQaWVjZXdpc2VMaW5lYXJPcHRpb25zLCBTZWdtZW50LCBTZXJpYWxpemVkU2VnbWVudCB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxudHlwZSBEYXNoSXRlbSA9IERhc2hWYWx1ZXMgJiB7XHJcbiAgaGFzTGVmdEZpbGxlZDogYm9vbGVhbjtcclxuICBoYXNSaWdodEZpbGxlZDogYm9vbGVhbjtcclxuXHJcbiAgLy8gd2hlcmUgZWFjaCBjb250YWluZWQgYXJyYXkgd2lsbCBiZSB0dXJuZWQgaW50byBhIHN1YnBhdGggYXQgdGhlIGVuZC5cclxuICBzZWdtZW50QXJyYXlzOiBTZWdtZW50W11bXTtcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIFNlcmlhbGl6ZWRTdWJwYXRoID0ge1xyXG4gIHR5cGU6ICdTdWJwYXRoJztcclxuICBzZWdtZW50czogU2VyaWFsaXplZFNlZ21lbnRbXTtcclxuICBwb2ludHM6IHsgeDogbnVtYmVyOyB5OiBudW1iZXIgfVtdO1xyXG4gIGNsb3NlZDogYm9vbGVhbjtcclxufTtcclxuXHJcbmNsYXNzIFN1YnBhdGgge1xyXG5cclxuICBwdWJsaWMgc2VnbWVudHM6IFNlZ21lbnRbXSA9IFtdO1xyXG4gIHB1YmxpYyBwb2ludHM6IFZlY3RvcjJbXTtcclxuICBwdWJsaWMgY2xvc2VkOiBib29sZWFuO1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgaW52YWxpZGF0ZWRFbWl0dGVyID0gbmV3IFRpbnlFbWl0dGVyKCk7XHJcblxyXG4gIC8vIElmIG5vbi1udWxsLCB0aGUgYm91bmRzIG9mIHRoZSBzdWJwYXRoXHJcbiAgcHVibGljIF9ib3VuZHM6IEJvdW5kczIgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gY2FjaGVkIHN0cm9rZWQgc2hhcGUgKHNvIGhpdCB0ZXN0aW5nIGNhbiBiZSBkb25lIHF1aWNrbHkgb24gc3Ryb2tlZCBzaGFwZXMpXHJcbiAgcHJpdmF0ZSBfc3Ryb2tlZFN1YnBhdGhzOiBTdWJwYXRoW10gfCBudWxsID0gbnVsbDtcclxuICBwcml2YXRlIF9zdHJva2VkU3VicGF0aHNDb21wdXRlZCA9IGZhbHNlO1xyXG4gIHByaXZhdGUgX3N0cm9rZWRTdHlsZXM6IExpbmVTdHlsZXMgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gU28gd2UgY2FuIGludmFsaWRhdGUgYWxsIG9mIHRoZSBwb2ludHMgd2l0aG91dCBmaXJpbmcgaW52YWxpZGF0aW9uIHRvbnMgb2YgdGltZXNcclxuICBwcml2YXRlIF9pbnZhbGlkYXRpbmdQb2ludHMgPSBmYWxzZTtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfaW52YWxpZGF0ZUxpc3RlbmVyOiAoKSA9PiB2b2lkO1xyXG5cclxuICAvKipcclxuICAgKiBOT1RFOiBObyBhcmd1bWVudHMgcmVxdWlyZWQgKHRoZXkgYXJlIHVzdWFsbHkgdXNlZCBmb3IgY29weSgpIHVzYWdlIG9yIGNyZWF0aW9uIHdpdGggbmV3IHNlZ21lbnRzKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvciggc2VnbWVudHM/OiBTZWdtZW50W10sIHBvaW50cz86IFZlY3RvcjJbXSwgY2xvc2VkPzogYm9vbGVhbiApIHtcclxuICAgIC8vIHJlY29tYmluZSBwb2ludHMgaWYgbmVjZXNzYXJ5LCBiYXNlZCBvZmYgb2Ygc3RhcnQgcG9pbnRzIG9mIHNlZ21lbnRzICsgdGhlIGVuZCBwb2ludCBvZiB0aGUgbGFzdCBzZWdtZW50XHJcbiAgICB0aGlzLnBvaW50cyA9IHBvaW50cyB8fCAoICggc2VnbWVudHMgJiYgc2VnbWVudHMubGVuZ3RoICkgPyBfLm1hcCggc2VnbWVudHMsIHNlZ21lbnQgPT4gc2VnbWVudC5zdGFydCApLmNvbmNhdCggc2VnbWVudHNbIHNlZ21lbnRzLmxlbmd0aCAtIDEgXS5lbmQgKSA6IFtdICk7XHJcblxyXG4gICAgdGhpcy5jbG9zZWQgPSAhIWNsb3NlZDtcclxuXHJcbiAgICB0aGlzLl9pbnZhbGlkYXRlTGlzdGVuZXIgPSB0aGlzLmludmFsaWRhdGUuYmluZCggdGhpcyApO1xyXG5cclxuICAgIC8vIEFkZCBhbGwgc2VnbWVudHMgZGlyZWN0bHkgKGhvb2tzIHVwIGludmFsaWRhdGlvbiBsaXN0ZW5lcnMgcHJvcGVybHkpXHJcbiAgICBpZiAoIHNlZ21lbnRzICkge1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzZWdtZW50cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBfLmVhY2goIHNlZ21lbnRzWyBpIF0uZ2V0Tm9uZGVnZW5lcmF0ZVNlZ21lbnRzKCksIHNlZ21lbnQgPT4ge1xyXG4gICAgICAgICAgdGhpcy5hZGRTZWdtZW50RGlyZWN0bHkoIHNlZ21lbnQgKTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGJvdW5kcyBvZiB0aGlzIHN1YnBhdGguIEl0IGlzIHRoZSBib3VuZGluZy1ib3ggdW5pb24gb2YgdGhlIGJvdW5kcyBvZiBlYWNoIHNlZ21lbnQgY29udGFpbmVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICBpZiAoIHRoaXMuX2JvdW5kcyA9PT0gbnVsbCApIHtcclxuICAgICAgY29uc3QgYm91bmRzID0gQm91bmRzMi5OT1RISU5HLmNvcHkoKTtcclxuICAgICAgXy5lYWNoKCB0aGlzLnNlZ21lbnRzLCBzZWdtZW50ID0+IHtcclxuICAgICAgICBib3VuZHMuaW5jbHVkZUJvdW5kcyggc2VnbWVudC5nZXRCb3VuZHMoKSApO1xyXG4gICAgICB9ICk7XHJcbiAgICAgIHRoaXMuX2JvdW5kcyA9IGJvdW5kcztcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9ib3VuZHM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGJvdW5kcygpOiBCb3VuZHMyIHsgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgKHNvbWV0aW1lcyBhcHByb3hpbWF0ZSkgYXJjIGxlbmd0aCBvZiB0aGUgc3VicGF0aC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0QXJjTGVuZ3RoKCBkaXN0YW5jZUVwc2lsb24/OiBudW1iZXIsIGN1cnZlRXBzaWxvbj86IG51bWJlciwgbWF4TGV2ZWxzPzogbnVtYmVyICk6IG51bWJlciB7XHJcbiAgICBsZXQgbGVuZ3RoID0gMDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuc2VnbWVudHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGxlbmd0aCArPSB0aGlzLnNlZ21lbnRzWyBpIF0uZ2V0QXJjTGVuZ3RoKCBkaXN0YW5jZUVwc2lsb24sIGN1cnZlRXBzaWxvbiwgbWF4TGV2ZWxzICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBpbW11dGFibGUgY29weSBvZiB0aGlzIHN1YnBhdGhcclxuICAgKi9cclxuICBwdWJsaWMgY29weSgpOiBTdWJwYXRoIHtcclxuICAgIHJldHVybiBuZXcgU3VicGF0aCggdGhpcy5zZWdtZW50cy5zbGljZSggMCApLCB0aGlzLnBvaW50cy5zbGljZSggMCApLCB0aGlzLmNsb3NlZCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW52YWxpZGF0ZXMgYWxsIHNlZ21lbnRzICh0aGVuIG91cnNlbGYpLCBzaW5jZSBzb21lIHBvaW50cyBpbiBzZWdtZW50cyBtYXkgaGF2ZSBiZWVuIGNoYW5nZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGludmFsaWRhdGVQb2ludHMoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9pbnZhbGlkYXRpbmdQb2ludHMgPSB0cnVlO1xyXG5cclxuICAgIGNvbnN0IG51bVNlZ21lbnRzID0gdGhpcy5zZWdtZW50cy5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1TZWdtZW50czsgaSsrICkge1xyXG4gICAgICB0aGlzLnNlZ21lbnRzWyBpIF0uaW52YWxpZGF0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2ludmFsaWRhdGluZ1BvaW50cyA9IGZhbHNlO1xyXG4gICAgdGhpcy5pbnZhbGlkYXRlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmlnZ2VyIGludmFsaWRhdGlvbiAodXN1YWxseSBmb3Igb3VyIFNoYXBlKVxyXG4gICAqIChraXRlLWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnZhbGlkYXRlKCk6IHZvaWQge1xyXG4gICAgaWYgKCAhdGhpcy5faW52YWxpZGF0aW5nUG9pbnRzICkge1xyXG4gICAgICB0aGlzLl9ib3VuZHMgPSBudWxsO1xyXG4gICAgICB0aGlzLl9zdHJva2VkU3VicGF0aHNDb21wdXRlZCA9IGZhbHNlO1xyXG4gICAgICB0aGlzLmludmFsaWRhdGVkRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgcG9pbnQgdG8gdGhpcyBzdWJwYXRoXHJcbiAgICovXHJcbiAgcHVibGljIGFkZFBvaW50KCBwb2ludDogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIHRoaXMucG9pbnRzLnB1c2goIHBvaW50ICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgc2VnbWVudCBkaXJlY3RseVxyXG4gICAqXHJcbiAgICogQ0FVVElPTjogUkVBTExZISBNYWtlIHN1cmUgd2UgaW52YWxpZGF0ZSgpIGFmdGVyIHRoaXMgaXMgY2FsbGVkXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhZGRTZWdtZW50RGlyZWN0bHkoIHNlZ21lbnQ6IFNlZ21lbnQgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzZWdtZW50LnN0YXJ0LmlzRmluaXRlKCksICdTZWdtZW50IHN0YXJ0IGlzIGluZmluaXRlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc2VnbWVudC5lbmQuaXNGaW5pdGUoKSwgJ1NlZ21lbnQgZW5kIGlzIGluZmluaXRlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc2VnbWVudC5zdGFydFRhbmdlbnQuaXNGaW5pdGUoKSwgJ1NlZ21lbnQgc3RhcnRUYW5nZW50IGlzIGluZmluaXRlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc2VnbWVudC5lbmRUYW5nZW50LmlzRmluaXRlKCksICdTZWdtZW50IGVuZFRhbmdlbnQgaXMgaW5maW5pdGUnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzZWdtZW50LmJvdW5kcy5pc0VtcHR5KCkgfHwgc2VnbWVudC5ib3VuZHMuaXNGaW5pdGUoKSwgJ1NlZ21lbnQgYm91bmRzIGlzIGluZmluaXRlIGFuZCBub24tZW1wdHknICk7XHJcbiAgICB0aGlzLnNlZ21lbnRzLnB1c2goIHNlZ21lbnQgKTtcclxuXHJcbiAgICAvLyBIb29rIHVwIGFuIGludmFsaWRhdGlvbiBsaXN0ZW5lciwgc28gaWYgdGhpcyBzZWdtZW50IGlzIGludmFsaWRhdGVkLCBpdCB3aWxsIGludmFsaWRhdGUgb3VyIHN1YnBhdGghXHJcbiAgICAvLyBOT1RFOiBpZiB3ZSBhZGQgcmVtb3ZhbCBvZiBzZWdtZW50cywgd2UnbGwgbmVlZCB0byByZW1vdmUgdGhlc2UgbGlzdGVuZXJzLCBvciB3ZSdsbCBsZWFrIVxyXG4gICAgc2VnbWVudC5pbnZhbGlkYXRpb25FbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLl9pbnZhbGlkYXRlTGlzdGVuZXIgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBzZWdtZW50IHRvIHRoaXMgc3VicGF0aFxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRTZWdtZW50KCBzZWdtZW50OiBTZWdtZW50ICk6IHRoaXMge1xyXG4gICAgY29uc3Qgbm9uZGVnZW5lcmF0ZVNlZ21lbnRzID0gc2VnbWVudC5nZXROb25kZWdlbmVyYXRlU2VnbWVudHMoKTtcclxuICAgIGNvbnN0IG51bU5vbmRlZ2VuZXJhdGVTZWdtZW50cyA9IG5vbmRlZ2VuZXJhdGVTZWdtZW50cy5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1Ob25kZWdlbmVyYXRlU2VnbWVudHM7IGkrKyApIHtcclxuICAgICAgdGhpcy5hZGRTZWdtZW50RGlyZWN0bHkoIHNlZ21lbnQgKTtcclxuICAgIH1cclxuICAgIHRoaXMuaW52YWxpZGF0ZSgpOyAvLyBuZWVkIHRvIGludmFsaWRhdGUgYWZ0ZXIgYWRkU2VnbWVudERpcmVjdGx5XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgbGluZSBzZWdtZW50IGZyb20gdGhlIHN0YXJ0IHRvIGVuZCAoaWYgbm9uLXplcm8gbGVuZ3RoKSBhbmQgbWFya3MgdGhlIHN1YnBhdGggYXMgY2xvc2VkLlxyXG4gICAqIE5PVEU6IG5vcm1hbGx5IHlvdSBqdXN0IHdhbnQgdG8gbWFyayB0aGUgc3VicGF0aCBhcyBjbG9zZWQsIGFuZCBub3QgZ2VuZXJhdGUgdGhlIGNsb3Npbmcgc2VnbWVudCB0aGlzIHdheT9cclxuICAgKi9cclxuICBwdWJsaWMgYWRkQ2xvc2luZ1NlZ21lbnQoKTogdm9pZCB7XHJcbiAgICBpZiAoIHRoaXMuaGFzQ2xvc2luZ1NlZ21lbnQoKSApIHtcclxuICAgICAgY29uc3QgY2xvc2luZ1NlZ21lbnQgPSB0aGlzLmdldENsb3NpbmdTZWdtZW50KCk7XHJcbiAgICAgIHRoaXMuYWRkU2VnbWVudERpcmVjdGx5KCBjbG9zaW5nU2VnbWVudCApO1xyXG4gICAgICB0aGlzLmludmFsaWRhdGUoKTsgLy8gbmVlZCB0byBpbnZhbGlkYXRlIGFmdGVyIGFkZFNlZ21lbnREaXJlY3RseVxyXG4gICAgICB0aGlzLmFkZFBvaW50KCB0aGlzLmdldEZpcnN0UG9pbnQoKSApO1xyXG4gICAgICB0aGlzLmNsb3NlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoaXMgc3VicGF0aCB0byBiZSBhIGNsb3NlZCBwYXRoXHJcbiAgICovXHJcbiAgcHVibGljIGNsb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xyXG5cclxuICAgIC8vIElmIG5lZWRlZCwgYWRkIGEgY29ubmVjdGluZyBcImNsb3NpbmdcIiBzZWdtZW50XHJcbiAgICB0aGlzLmFkZENsb3NpbmdTZWdtZW50KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBudW1iZXJzIG9mIHBvaW50cyBpbiB0aGlzIHN1YnBhdGhcclxuICAgKlxyXG4gICAqIFRPRE86IFRoaXMgaXMgYSBjb25mdXNpbmcgbmFtZSEgSXQgc2hvdWxkIGJlIGdldE51bVBvaW50cygpIG9yIHNvbWV0aGluZyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGVuZ3RoKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5wb2ludHMubGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZmlyc3QgcG9pbnQgb2YgdGhpcyBzdWJwYXRoXHJcbiAgICovXHJcbiAgcHVibGljIGdldEZpcnN0UG9pbnQoKTogVmVjdG9yMiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnBvaW50cy5sZW5ndGggKTtcclxuXHJcbiAgICByZXR1cm4gXy5maXJzdCggdGhpcy5wb2ludHMgKSE7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBsYXN0IHBvaW50IG9mIHRoaXMgc3VicGF0aFxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMYXN0UG9pbnQoKTogVmVjdG9yMiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnBvaW50cy5sZW5ndGggKTtcclxuXHJcbiAgICByZXR1cm4gXy5sYXN0KCB0aGlzLnBvaW50cyApITtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGZpcnN0IHNlZ21lbnQgb2YgdGhpcyBzdWJwYXRoXHJcbiAgICovXHJcbiAgcHVibGljIGdldEZpcnN0U2VnbWVudCgpOiBTZWdtZW50IHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuc2VnbWVudHMubGVuZ3RoICk7XHJcblxyXG4gICAgcmV0dXJuIF8uZmlyc3QoIHRoaXMuc2VnbWVudHMgKSE7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBsYXN0IHNlZ21lbnQgb2YgdGhpcyBzdWJwYXRoXHJcbiAgICovXHJcbiAgcHVibGljIGdldExhc3RTZWdtZW50KCk6IFNlZ21lbnQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5zZWdtZW50cy5sZW5ndGggKTtcclxuXHJcbiAgICByZXR1cm4gXy5sYXN0KCB0aGlzLnNlZ21lbnRzICkhO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBzZWdtZW50cyB0aGF0IGluY2x1ZGUgdGhlIFwiZmlsbGVkXCIgYXJlYSwgd2hpY2ggbWF5IGluY2x1ZGUgYW4gZXh0cmEgY2xvc2luZyBzZWdtZW50IGlmIG5lY2Vzc2FyeS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RmlsbFNlZ21lbnRzKCk6IFNlZ21lbnRbXSB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHMuc2xpY2UoKTtcclxuICAgIGlmICggdGhpcy5oYXNDbG9zaW5nU2VnbWVudCgpICkge1xyXG4gICAgICBzZWdtZW50cy5wdXNoKCB0aGlzLmdldENsb3NpbmdTZWdtZW50KCkgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBzZWdtZW50cztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZXMgaWYgdGhpcyBzdWJwYXRoIGlzIGRyYXdhYmxlLCBpLmUuIGlmIGl0IGNvbnRhaW5zIGFzbnkgc2VnbWVudHNcclxuICAgKi9cclxuICBwdWJsaWMgaXNEcmF3YWJsZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnNlZ21lbnRzLmxlbmd0aCA+IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIGlmIHRoaXMgc3VicGF0aCBpcyBhIGNsb3NlZCBwYXRoLCBpLmUuIGlmIHRoZSBmbGFnIGlzIHNldCB0byBjbG9zZWRcclxuICAgKi9cclxuICBwdWJsaWMgaXNDbG9zZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5jbG9zZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIGlmIHRoaXMgc3VicGF0aCBpcyBhIGNsb3NlZCBwYXRoLCBpLmUuIGlmIGl0IGhhcyBhIGNsb3NlZCBzZWdtZW50XHJcbiAgICovXHJcbiAgcHVibGljIGhhc0Nsb3NpbmdTZWdtZW50KCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuICF0aGlzLmdldEZpcnN0UG9pbnQoKS5lcXVhbHNFcHNpbG9uKCB0aGlzLmdldExhc3RQb2ludCgpLCAwLjAwMDAwMDAwMSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGxpbmUgdGhhdCB3b3VsZCBjbG9zZSB0aGlzIHN1YnBhdGhcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2xvc2luZ1NlZ21lbnQoKTogTGluZSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmhhc0Nsb3NpbmdTZWdtZW50KCksICdJbXBsaWNpdCBjbG9zaW5nIHNlZ21lbnQgdW5uZWNlc3Nhcnkgb24gYSBmdWxseSBjbG9zZWQgcGF0aCcgKTtcclxuICAgIHJldHVybiBuZXcgTGluZSggdGhpcy5nZXRMYXN0UG9pbnQoKSwgdGhpcy5nZXRGaXJzdFBvaW50KCkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgcG90ZW50aWFsIGNsb3Nlc3QgcG9pbnRzIG9uIHRoZSBzdWJwYXRoIHRvIHRoZSBnaXZlbiBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2xvc2VzdFBvaW50cyggcG9pbnQ6IFZlY3RvcjIgKTogQ2xvc2VzdFRvUG9pbnRSZXN1bHRbXSB7XHJcbiAgICByZXR1cm4gU2VnbWVudC5maWx0ZXJDbG9zZXN0VG9Qb2ludFJlc3VsdCggXy5mbGF0dGVuKCB0aGlzLnNlZ21lbnRzLm1hcCggc2VnbWVudCA9PiBzZWdtZW50LmdldENsb3Nlc3RQb2ludHMoIHBvaW50ICkgKSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEcmF3cyB0aGUgc2VnbWVudCB0byB0aGUgMkQgQ2FudmFzIGNvbnRleHQsIGFzc3VtaW5nIHRoZSBjb250ZXh0J3MgY3VycmVudCBsb2NhdGlvbiBpcyBhbHJlYWR5IGF0IHRoZSBzdGFydCBwb2ludFxyXG4gICAqL1xyXG4gIHB1YmxpYyB3cml0ZVRvQ29udGV4dCggY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEICk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLmlzRHJhd2FibGUoKSApIHtcclxuICAgICAgY29uc3Qgc3RhcnRQb2ludCA9IHRoaXMuZ2V0Rmlyc3RTZWdtZW50KCkuc3RhcnQ7XHJcbiAgICAgIGNvbnRleHQubW92ZVRvKCBzdGFydFBvaW50LngsIHN0YXJ0UG9pbnQueSApOyAvLyB0aGUgc2VnbWVudHMgYXNzdW1lIHRoZSBjdXJyZW50IGNvbnRleHQgcG9zaXRpb24gaXMgYXQgdGhlaXIgc3RhcnRcclxuXHJcbiAgICAgIGxldCBsZW4gPSB0aGlzLnNlZ21lbnRzLmxlbmd0aDtcclxuXHJcbiAgICAgIC8vIE9taXQgYW4gZW5kaW5nIGxpbmUgc2VnbWVudCBpZiBvdXIgcGF0aCBpcyBjbG9zZWQuXHJcbiAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGgtc2NhbGUvaXNzdWVzLzgzI2lzc3VlY29tbWVudC01MTI2NjM5NDlcclxuICAgICAgaWYgKCB0aGlzLmNsb3NlZCAmJiBsZW4gPj0gMiAmJiB0aGlzLnNlZ21lbnRzWyBsZW4gLSAxIF0gaW5zdGFuY2VvZiBMaW5lICkge1xyXG4gICAgICAgIGxlbi0tO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcclxuICAgICAgICB0aGlzLnNlZ21lbnRzWyBpIF0ud3JpdGVUb0NvbnRleHQoIGNvbnRleHQgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCB0aGlzLmNsb3NlZCApIHtcclxuICAgICAgICBjb250ZXh0LmNsb3NlUGF0aCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0cyB0aGlzIHN1YnBhdGggdG8gYSBuZXcgc3VicGF0aCBtYWRlIG9mIG1hbnkgbGluZSBzZWdtZW50cyAoYXBwcm94aW1hdGluZyB0aGUgY3VycmVudCBzdWJwYXRoKVxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b1BpZWNld2lzZUxpbmVhciggb3B0aW9uczogUGllY2V3aXNlTGluZWFyT3B0aW9ucyApOiBTdWJwYXRoIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFvcHRpb25zLnBvaW50TWFwLCAnRm9yIHVzZSB3aXRoIHBvaW50TWFwLCBwbGVhc2UgdXNlIG5vbmxpbmVhclRyYW5zZm9ybWVkJyApO1xyXG4gICAgcmV0dXJuIG5ldyBTdWJwYXRoKCBfLmZsYXR0ZW4oIF8ubWFwKCB0aGlzLnNlZ21lbnRzLCBzZWdtZW50ID0+IHNlZ21lbnQudG9QaWVjZXdpc2VMaW5lYXJTZWdtZW50cyggb3B0aW9ucyApICkgKSwgdW5kZWZpbmVkLCB0aGlzLmNsb3NlZCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGNvcHkgb2YgdGhpcyBTdWJwYXRoIHRyYW5zZm9ybWVkIHdpdGggdGhlIGdpdmVuIG1hdHJpeC5cclxuICAgKi9cclxuICBwdWJsaWMgdHJhbnNmb3JtZWQoIG1hdHJpeDogTWF0cml4MyApOiBTdWJwYXRoIHtcclxuICAgIHJldHVybiBuZXcgU3VicGF0aChcclxuICAgICAgXy5tYXAoIHRoaXMuc2VnbWVudHMsIHNlZ21lbnQgPT4gc2VnbWVudC50cmFuc2Zvcm1lZCggbWF0cml4ICkgKSxcclxuICAgICAgXy5tYXAoIHRoaXMucG9pbnRzLCBwb2ludCA9PiBtYXRyaXgudGltZXNWZWN0b3IyKCBwb2ludCApICksXHJcbiAgICAgIHRoaXMuY2xvc2VkXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udmVydHMgdGhpcyBzdWJwYXRoIHRvIGEgbmV3IHN1YnBhdGggbWFkZSBvZiBtYW55IGxpbmUgc2VnbWVudHMgKGFwcHJveGltYXRpbmcgdGhlIGN1cnJlbnQgc3VicGF0aCkgd2l0aCB0aGVcclxuICAgKiB0cmFuc2Zvcm1hdGlvbiBhcHBsaWVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBub25saW5lYXJUcmFuc2Zvcm1lZCggb3B0aW9uczogUGllY2V3aXNlTGluZWFyT3B0aW9ucyApOiBTdWJwYXRoIHtcclxuICAgIHJldHVybiBuZXcgU3VicGF0aCggXy5mbGF0dGVuKCBfLm1hcCggdGhpcy5zZWdtZW50cywgc2VnbWVudCA9PiB7XHJcbiAgICAgIC8vIGNoZWNrIGZvciB0aGlzIHNlZ21lbnQncyBzdXBwb3J0IGZvciB0aGUgc3BlY2lmaWMgdHJhbnNmb3JtIG9yIGRpc2NyZXRpemF0aW9uIGJlaW5nIGFwcGxpZWRcclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBXZSBkb24ndCBuZWVkIGl0IHRvIGV4aXN0IG9uIHNlZ21lbnRzLCBidXQgd2UgZG8gd2FudCBpdCB0byBleGlzdCBvbiBzb21lIHNlZ21lbnRzXHJcbiAgICAgIGlmICggb3B0aW9ucy5tZXRob2ROYW1lICYmIHNlZ21lbnRbIG9wdGlvbnMubWV0aG9kTmFtZSBdICkge1xyXG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgV2UgZG9uJ3QgbmVlZCBpdCB0byBleGlzdCBvbiBzZWdtZW50cywgYnV0IHdlIGRvIHdhbnQgaXQgdG8gZXhpc3Qgb24gc29tZSBzZWdtZW50c1xyXG4gICAgICAgIHJldHVybiBzZWdtZW50WyBvcHRpb25zLm1ldGhvZE5hbWUgXSggb3B0aW9ucyApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBzZWdtZW50LnRvUGllY2V3aXNlTGluZWFyU2VnbWVudHMoIG9wdGlvbnMgKTtcclxuICAgICAgfVxyXG4gICAgfSApICksIHVuZGVmaW5lZCwgdGhpcy5jbG9zZWQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGJvdW5kcyBvZiB0aGlzIHN1YnBhdGggd2hlbiB0cmFuc2Zvcm0gYnkgYSBtYXRyaXguXHJcbiAgICovXHJcbiAgcHVibGljIGdldEJvdW5kc1dpdGhUcmFuc2Zvcm0oIG1hdHJpeDogTWF0cml4MyApOiBCb3VuZHMyIHtcclxuICAgIGNvbnN0IGJvdW5kcyA9IEJvdW5kczIuTk9USElORy5jb3B5KCk7XHJcbiAgICBjb25zdCBudW1TZWdtZW50cyA9IHRoaXMuc2VnbWVudHMubGVuZ3RoO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbnVtU2VnbWVudHM7IGkrKyApIHtcclxuICAgICAgYm91bmRzLmluY2x1ZGVCb3VuZHMoIHRoaXMuc2VnbWVudHNbIGkgXS5nZXRCb3VuZHNXaXRoVHJhbnNmb3JtKCBtYXRyaXggKSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJvdW5kcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBzdWJwYXRoIHRoYXQgaXMgb2Zmc2V0IGZyb20gdGhpcyBzdWJwYXRoIGJ5IGEgZGlzdGFuY2VcclxuICAgKlxyXG4gICAqIFRPRE86IFJlc29sdmUgdGhlIGJ1ZyB3aXRoIHRoZSBpbnNpZGUtbGluZS1qb2luIG92ZXJsYXAuIFdlIGhhdmUgdGhlIGludGVyc2VjdGlvbiBoYW5kbGluZyBub3cgKHBvdGVudGlhbGx5KSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgKi9cclxuICBwdWJsaWMgb2Zmc2V0KCBkaXN0YW5jZTogbnVtYmVyICk6IFN1YnBhdGgge1xyXG4gICAgaWYgKCAhdGhpcy5pc0RyYXdhYmxlKCkgKSB7XHJcbiAgICAgIHJldHVybiBuZXcgU3VicGF0aCggW10sIHVuZGVmaW5lZCwgdGhpcy5jbG9zZWQgKTtcclxuICAgIH1cclxuICAgIGlmICggZGlzdGFuY2UgPT09IDAgKSB7XHJcbiAgICAgIHJldHVybiBuZXcgU3VicGF0aCggdGhpcy5zZWdtZW50cy5zbGljZSgpLCB1bmRlZmluZWQsIHRoaXMuY2xvc2VkICk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGk7XHJcblxyXG4gICAgY29uc3QgcmVndWxhclNlZ21lbnRzID0gdGhpcy5zZWdtZW50cy5zbGljZSgpO1xyXG4gICAgY29uc3Qgb2Zmc2V0cyA9IFtdO1xyXG5cclxuICAgIGZvciAoIGkgPSAwOyBpIDwgcmVndWxhclNlZ21lbnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBvZmZzZXRzLnB1c2goIHJlZ3VsYXJTZWdtZW50c1sgaSBdLnN0cm9rZUxlZnQoIDIgKiBkaXN0YW5jZSApICk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHNlZ21lbnRzOiBTZWdtZW50W10gPSBbXTtcclxuICAgIGZvciAoIGkgPSAwOyBpIDwgcmVndWxhclNlZ21lbnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBpZiAoIHRoaXMuY2xvc2VkIHx8IGkgPiAwICkge1xyXG4gICAgICAgIGNvbnN0IHByZXZpb3VzSSA9ICggaSA+IDAgPyBpIDogcmVndWxhclNlZ21lbnRzLmxlbmd0aCApIC0gMTtcclxuICAgICAgICBjb25zdCBjZW50ZXIgPSByZWd1bGFyU2VnbWVudHNbIGkgXS5zdGFydDtcclxuICAgICAgICBjb25zdCBmcm9tVGFuZ2VudCA9IHJlZ3VsYXJTZWdtZW50c1sgcHJldmlvdXNJIF0uZW5kVGFuZ2VudDtcclxuICAgICAgICBjb25zdCB0b1RhbmdlbnQgPSByZWd1bGFyU2VnbWVudHNbIGkgXS5zdGFydFRhbmdlbnQ7XHJcblxyXG4gICAgICAgIGNvbnN0IHN0YXJ0QW5nbGUgPSBmcm9tVGFuZ2VudC5wZXJwZW5kaWN1bGFyLm5lZ2F0ZWQoKS50aW1lcyggZGlzdGFuY2UgKS5hbmdsZTtcclxuICAgICAgICBjb25zdCBlbmRBbmdsZSA9IHRvVGFuZ2VudC5wZXJwZW5kaWN1bGFyLm5lZ2F0ZWQoKS50aW1lcyggZGlzdGFuY2UgKS5hbmdsZTtcclxuICAgICAgICBjb25zdCBhbnRpY2xvY2t3aXNlID0gZnJvbVRhbmdlbnQucGVycGVuZGljdWxhci5kb3QoIHRvVGFuZ2VudCApID4gMDtcclxuICAgICAgICBzZWdtZW50cy5wdXNoKCBuZXcgQXJjKCBjZW50ZXIsIE1hdGguYWJzKCBkaXN0YW5jZSApLCBzdGFydEFuZ2xlLCBlbmRBbmdsZSwgYW50aWNsb2Nrd2lzZSApICk7XHJcbiAgICAgIH1cclxuICAgICAgc2VnbWVudHMgPSBzZWdtZW50cy5jb25jYXQoIG9mZnNldHNbIGkgXSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgU3VicGF0aCggc2VnbWVudHMsIHVuZGVmaW5lZCwgdGhpcy5jbG9zZWQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2Ygc3VicGF0aHMgKG9uZSBpZiBvcGVuLCB0d28gaWYgY2xvc2VkKSB0aGF0IHJlcHJlc2VudCBhIHN0cm9rZWQgY29weSBvZiB0aGlzIHN1YnBhdGguXHJcbiAgICovXHJcbiAgcHVibGljIHN0cm9rZWQoIGxpbmVTdHlsZXM6IExpbmVTdHlsZXMgKTogU3VicGF0aFtdIHtcclxuICAgIC8vIG5vbi1kcmF3YWJsZSBzdWJwYXRocyBjb252ZXJ0IHRvIGVtcHR5IHN1YnBhdGhzXHJcbiAgICBpZiAoICF0aGlzLmlzRHJhd2FibGUoKSApIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggbGluZVN0eWxlcyA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICBsaW5lU3R5bGVzID0gbmV3IExpbmVTdHlsZXMoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyByZXR1cm4gYSBjYWNoZWQgdmVyc2lvbiBpZiBwb3NzaWJsZVxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuX3N0cm9rZWRTdWJwYXRoc0NvbXB1dGVkIHx8ICggdGhpcy5fc3Ryb2tlZFN0eWxlcyAmJiB0aGlzLl9zdHJva2VkU3VicGF0aHMgKSApO1xyXG4gICAgaWYgKCB0aGlzLl9zdHJva2VkU3VicGF0aHNDb21wdXRlZCAmJiB0aGlzLl9zdHJva2VkU3R5bGVzIS5lcXVhbHMoIGxpbmVTdHlsZXMgKSApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3N0cm9rZWRTdWJwYXRocyE7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbGluZVdpZHRoID0gbGluZVN0eWxlcy5saW5lV2lkdGg7XHJcblxyXG4gICAgbGV0IGk7XHJcbiAgICBsZXQgbGVmdFNlZ21lbnRzOiBTZWdtZW50W10gPSBbXTtcclxuICAgIGxldCByaWdodFNlZ21lbnRzOiBTZWdtZW50W10gPSBbXTtcclxuICAgIGNvbnN0IGZpcnN0U2VnbWVudCA9IHRoaXMuZ2V0Rmlyc3RTZWdtZW50KCk7XHJcbiAgICBjb25zdCBsYXN0U2VnbWVudCA9IHRoaXMuZ2V0TGFzdFNlZ21lbnQoKTtcclxuXHJcbiAgICBjb25zdCBhcHBlbmRMZWZ0U2VnbWVudHMgPSAoIHNlZ21lbnRzOiBTZWdtZW50W10gKSA9PiB7XHJcbiAgICAgIGxlZnRTZWdtZW50cyA9IGxlZnRTZWdtZW50cy5jb25jYXQoIHNlZ21lbnRzICk7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGFwcGVuZFJpZ2h0U2VnbWVudHMgPSAoIHNlZ21lbnRzOiBTZWdtZW50W10gKSA9PiB7XHJcbiAgICAgIHJpZ2h0U2VnbWVudHMgPSByaWdodFNlZ21lbnRzLmNvbmNhdCggc2VnbWVudHMgKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gd2UgZG9uJ3QgbmVlZCB0byBpbnNlcnQgYW4gaW1wbGljaXQgY2xvc2luZyBzZWdtZW50IGlmIHRoZSBzdGFydCBhbmQgZW5kIHBvaW50cyBhcmUgdGhlIHNhbWVcclxuICAgIGNvbnN0IGFscmVhZHlDbG9zZWQgPSBsYXN0U2VnbWVudC5lbmQuZXF1YWxzKCBmaXJzdFNlZ21lbnQuc3RhcnQgKTtcclxuICAgIC8vIGlmIHRoZXJlIGlzIGFuIGltcGxpY2l0IGNsb3Npbmcgc2VnbWVudFxyXG4gICAgY29uc3QgY2xvc2luZ1NlZ21lbnQgPSBhbHJlYWR5Q2xvc2VkID8gbnVsbCA6IG5ldyBMaW5lKCB0aGlzLnNlZ21lbnRzWyB0aGlzLnNlZ21lbnRzLmxlbmd0aCAtIDEgXS5lbmQsIHRoaXMuc2VnbWVudHNbIDAgXS5zdGFydCApO1xyXG5cclxuICAgIC8vIHN0cm9rZSB0aGUgbG9naWNhbCBcImxlZnRcIiBzaWRlIG9mIG91ciBwYXRoXHJcbiAgICBmb3IgKCBpID0gMDsgaSA8IHRoaXMuc2VnbWVudHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGlmICggaSA+IDAgKSB7XHJcbiAgICAgICAgYXBwZW5kTGVmdFNlZ21lbnRzKCBsaW5lU3R5bGVzLmxlZnRKb2luKCB0aGlzLnNlZ21lbnRzWyBpIF0uc3RhcnQsIHRoaXMuc2VnbWVudHNbIGkgLSAxIF0uZW5kVGFuZ2VudCwgdGhpcy5zZWdtZW50c1sgaSBdLnN0YXJ0VGFuZ2VudCApICk7XHJcbiAgICAgIH1cclxuICAgICAgYXBwZW5kTGVmdFNlZ21lbnRzKCB0aGlzLnNlZ21lbnRzWyBpIF0uc3Ryb2tlTGVmdCggbGluZVdpZHRoICkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBzdHJva2UgdGhlIGxvZ2ljYWwgXCJyaWdodFwiIHNpZGUgb2Ygb3VyIHBhdGhcclxuICAgIGZvciAoIGkgPSB0aGlzLnNlZ21lbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICBpZiAoIGkgPCB0aGlzLnNlZ21lbnRzLmxlbmd0aCAtIDEgKSB7XHJcbiAgICAgICAgYXBwZW5kUmlnaHRTZWdtZW50cyggbGluZVN0eWxlcy5yaWdodEpvaW4oIHRoaXMuc2VnbWVudHNbIGkgXS5lbmQsIHRoaXMuc2VnbWVudHNbIGkgXS5lbmRUYW5nZW50LCB0aGlzLnNlZ21lbnRzWyBpICsgMSBdLnN0YXJ0VGFuZ2VudCApICk7XHJcbiAgICAgIH1cclxuICAgICAgYXBwZW5kUmlnaHRTZWdtZW50cyggdGhpcy5zZWdtZW50c1sgaSBdLnN0cm9rZVJpZ2h0KCBsaW5lV2lkdGggKSApO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBzdWJwYXRocztcclxuICAgIGlmICggdGhpcy5jbG9zZWQgKSB7XHJcbiAgICAgIGlmICggYWxyZWFkeUNsb3NlZCApIHtcclxuICAgICAgICAvLyBhZGQgdGhlIGpvaW5zIGJldHdlZW4gdGhlIHN0YXJ0IGFuZCBlbmRcclxuICAgICAgICBhcHBlbmRMZWZ0U2VnbWVudHMoIGxpbmVTdHlsZXMubGVmdEpvaW4oIGxhc3RTZWdtZW50LmVuZCwgbGFzdFNlZ21lbnQuZW5kVGFuZ2VudCwgZmlyc3RTZWdtZW50LnN0YXJ0VGFuZ2VudCApICk7XHJcbiAgICAgICAgYXBwZW5kUmlnaHRTZWdtZW50cyggbGluZVN0eWxlcy5yaWdodEpvaW4oIGxhc3RTZWdtZW50LmVuZCwgbGFzdFNlZ21lbnQuZW5kVGFuZ2VudCwgZmlyc3RTZWdtZW50LnN0YXJ0VGFuZ2VudCApICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gbG9naWNhbCBcImxlZnRcIiBzdHJva2Ugb24gdGhlIGltcGxpY2l0IGNsb3Npbmcgc2VnbWVudFxyXG4gICAgICAgIGFwcGVuZExlZnRTZWdtZW50cyggbGluZVN0eWxlcy5sZWZ0Sm9pbiggY2xvc2luZ1NlZ21lbnQhLnN0YXJ0LCBsYXN0U2VnbWVudC5lbmRUYW5nZW50LCBjbG9zaW5nU2VnbWVudCEuc3RhcnRUYW5nZW50ICkgKTtcclxuICAgICAgICBhcHBlbmRMZWZ0U2VnbWVudHMoIGNsb3NpbmdTZWdtZW50IS5zdHJva2VMZWZ0KCBsaW5lV2lkdGggKSApO1xyXG4gICAgICAgIGFwcGVuZExlZnRTZWdtZW50cyggbGluZVN0eWxlcy5sZWZ0Sm9pbiggY2xvc2luZ1NlZ21lbnQhLmVuZCwgY2xvc2luZ1NlZ21lbnQhLmVuZFRhbmdlbnQsIGZpcnN0U2VnbWVudC5zdGFydFRhbmdlbnQgKSApO1xyXG5cclxuICAgICAgICAvLyBsb2dpY2FsIFwicmlnaHRcIiBzdHJva2Ugb24gdGhlIGltcGxpY2l0IGNsb3Npbmcgc2VnbWVudFxyXG4gICAgICAgIGFwcGVuZFJpZ2h0U2VnbWVudHMoIGxpbmVTdHlsZXMucmlnaHRKb2luKCBjbG9zaW5nU2VnbWVudCEuZW5kLCBjbG9zaW5nU2VnbWVudCEuZW5kVGFuZ2VudCwgZmlyc3RTZWdtZW50LnN0YXJ0VGFuZ2VudCApICk7XHJcbiAgICAgICAgYXBwZW5kUmlnaHRTZWdtZW50cyggY2xvc2luZ1NlZ21lbnQhLnN0cm9rZVJpZ2h0KCBsaW5lV2lkdGggKSApO1xyXG4gICAgICAgIGFwcGVuZFJpZ2h0U2VnbWVudHMoIGxpbmVTdHlsZXMucmlnaHRKb2luKCBjbG9zaW5nU2VnbWVudCEuc3RhcnQsIGxhc3RTZWdtZW50LmVuZFRhbmdlbnQsIGNsb3NpbmdTZWdtZW50IS5zdGFydFRhbmdlbnQgKSApO1xyXG4gICAgICB9XHJcbiAgICAgIHN1YnBhdGhzID0gW1xyXG4gICAgICAgIG5ldyBTdWJwYXRoKCBsZWZ0U2VnbWVudHMsIHVuZGVmaW5lZCwgdHJ1ZSApLFxyXG4gICAgICAgIG5ldyBTdWJwYXRoKCByaWdodFNlZ21lbnRzLCB1bmRlZmluZWQsIHRydWUgKVxyXG4gICAgICBdO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHN1YnBhdGhzID0gW1xyXG4gICAgICAgIG5ldyBTdWJwYXRoKCBsZWZ0U2VnbWVudHMuY29uY2F0KCBsaW5lU3R5bGVzLmNhcCggbGFzdFNlZ21lbnQuZW5kLCBsYXN0U2VnbWVudC5lbmRUYW5nZW50ICkgKVxyXG4gICAgICAgICAgICAuY29uY2F0KCByaWdodFNlZ21lbnRzIClcclxuICAgICAgICAgICAgLmNvbmNhdCggbGluZVN0eWxlcy5jYXAoIGZpcnN0U2VnbWVudC5zdGFydCwgZmlyc3RTZWdtZW50LnN0YXJ0VGFuZ2VudC5uZWdhdGVkKCkgKSApLFxyXG4gICAgICAgICAgdW5kZWZpbmVkLCB0cnVlIClcclxuICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9zdHJva2VkU3VicGF0aHMgPSBzdWJwYXRocztcclxuICAgIHRoaXMuX3N0cm9rZWRTdWJwYXRoc0NvbXB1dGVkID0gdHJ1ZTtcclxuICAgIHRoaXMuX3N0cm9rZWRTdHlsZXMgPSBsaW5lU3R5bGVzLmNvcHkoKTsgLy8gc2hhbGxvdyBjb3B5LCBzaW5jZSB3ZSBjb25zaWRlciBsaW5lc3R5bGVzIHRvIGJlIG11dGFibGVcclxuXHJcbiAgICByZXR1cm4gc3VicGF0aHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgY29weSBvZiB0aGlzIHN1YnBhdGggd2l0aCB0aGUgZGFzaCBcImhvbGVzXCIgcmVtb3ZlZCAoaGFzIG1hbnkgc3VicGF0aHMgdXN1YWxseSkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbGluZURhc2hcclxuICAgKiBAcGFyYW0gbGluZURhc2hPZmZzZXRcclxuICAgKiBAcGFyYW0gZGlzdGFuY2VFcHNpbG9uIC0gY29udHJvbHMgbGV2ZWwgb2Ygc3ViZGl2aXNpb24gYnkgYXR0ZW1wdGluZyB0byBlbnN1cmUgYSBtYXhpbXVtIChzcXVhcmVkKSBkZXZpYXRpb24gZnJvbSB0aGUgY3VydmVcclxuICAgKiBAcGFyYW0gY3VydmVFcHNpbG9uIC0gY29udHJvbHMgbGV2ZWwgb2Ygc3ViZGl2aXNpb24gYnkgYXR0ZW1wdGluZyB0byBlbnN1cmUgYSBtYXhpbXVtIGN1cnZhdHVyZSBjaGFuZ2UgYmV0d2VlbiBzZWdtZW50c1xyXG4gICAqL1xyXG4gIHB1YmxpYyBkYXNoZWQoIGxpbmVEYXNoOiBudW1iZXJbXSwgbGluZURhc2hPZmZzZXQ6IG51bWJlciwgZGlzdGFuY2VFcHNpbG9uOiBudW1iZXIsIGN1cnZlRXBzaWxvbjogbnVtYmVyICk6IFN1YnBhdGhbXSB7XHJcbiAgICAvLyBDb21iaW5lIHNlZ21lbnQgYXJyYXlzIChjb2xsYXBzaW5nIHRoZSB0d28tbW9zdC1hZGphY2VudCBhcnJheXMgaW50byBvbmUsIHdpdGggY29uY2F0ZW5hdGlvbilcclxuICAgIGNvbnN0IGNvbWJpbmVTZWdtZW50QXJyYXlzID0gKCBsZWZ0OiBTZWdtZW50W11bXSwgcmlnaHQ6IFNlZ21lbnRbXVtdICkgPT4ge1xyXG4gICAgICBjb25zdCBjb21iaW5lZCA9IGxlZnRbIGxlZnQubGVuZ3RoIC0gMSBdLmNvbmNhdCggcmlnaHRbIDAgXSApO1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBsZWZ0LnNsaWNlKCAwLCBsZWZ0Lmxlbmd0aCAtIDEgKS5jb25jYXQoIFsgY29tYmluZWQgXSApLmNvbmNhdCggcmlnaHQuc2xpY2UoIDEgKSApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCByZXN1bHQubGVuZ3RoID09PSBsZWZ0Lmxlbmd0aCArIHJpZ2h0Lmxlbmd0aCAtIDEgKTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH07XHJcblxyXG4gICAgLy8gV2hldGhlciB0d28gZGFzaCBpdGVtcyAocmV0dXJuIHR5cGUgZnJvbSBnZXREYXNoVmFsdWVzKCkpIGNhbiBiZSBjb21iaW5lZCB0b2dldGhlciB0byBoYXZlIHRoZWlyIGVuZCBzZWdtZW50c1xyXG4gICAgLy8gY29tYmluZWQgd2l0aCBjb21iaW5lU2VnbWVudEFycmF5cy5cclxuICAgIGNvbnN0IGNhbkJlQ29tYmluZWQgPSAoIGxlZnRJdGVtOiBEYXNoSXRlbSwgcmlnaHRJdGVtOiBEYXNoSXRlbSApID0+IHtcclxuICAgICAgaWYgKCAhbGVmdEl0ZW0uaGFzUmlnaHRGaWxsZWQgfHwgIXJpZ2h0SXRlbS5oYXNMZWZ0RmlsbGVkICkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBsZWZ0U2VnbWVudCA9IF8ubGFzdCggXy5sYXN0KCBsZWZ0SXRlbS5zZWdtZW50QXJyYXlzICkgKSE7XHJcbiAgICAgIGNvbnN0IHJpZ2h0U2VnbWVudCA9IHJpZ2h0SXRlbS5zZWdtZW50QXJyYXlzWyAwIF1bIDAgXTtcclxuICAgICAgcmV0dXJuIGxlZnRTZWdtZW50LmVuZC5kaXN0YW5jZSggcmlnaHRTZWdtZW50LnN0YXJ0ICkgPCAxZS01O1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBDb21wdXRlIGFsbCB0aGUgZGFzaGVzXHJcbiAgICBjb25zdCBkYXNoSXRlbXM6IERhc2hJdGVtW10gPSBbXTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuc2VnbWVudHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IHNlZ21lbnQgPSB0aGlzLnNlZ21lbnRzWyBpIF07XHJcbiAgICAgIGNvbnN0IGRhc2hJdGVtID0gc2VnbWVudC5nZXREYXNoVmFsdWVzKCBsaW5lRGFzaCwgbGluZURhc2hPZmZzZXQsIGRpc3RhbmNlRXBzaWxvbiwgY3VydmVFcHNpbG9uICkgYXMgRGFzaEl0ZW07XHJcbiAgICAgIGRhc2hJdGVtcy5wdXNoKCBkYXNoSXRlbSApO1xyXG5cclxuICAgICAgLy8gV2UgbW92ZWQgZm9yd2FyZCBpbiB0aGUgb2Zmc2V0IGJ5IHRoaXMgbXVjaFxyXG4gICAgICBsaW5lRGFzaE9mZnNldCArPSBkYXNoSXRlbS5hcmNMZW5ndGg7XHJcblxyXG4gICAgICBjb25zdCB2YWx1ZXMgPSBbIDAgXS5jb25jYXQoIGRhc2hJdGVtLnZhbHVlcyApLmNvbmNhdCggWyAxIF0gKTtcclxuICAgICAgY29uc3QgaW5pdGlhbGx5SW5zaWRlID0gZGFzaEl0ZW0uaW5pdGlhbGx5SW5zaWRlO1xyXG5cclxuICAgICAgLy8gTWFyayB3aGV0aGVyIHRoZSBlbmRzIGFyZSBmaWxsZWQsIHNvIGFkamFjZW50IGZpbGxlZCBlbmRzIGNhbiBiZSBjb21iaW5lZFxyXG4gICAgICBkYXNoSXRlbS5oYXNMZWZ0RmlsbGVkID0gaW5pdGlhbGx5SW5zaWRlO1xyXG4gICAgICBkYXNoSXRlbS5oYXNSaWdodEZpbGxlZCA9ICggdmFsdWVzLmxlbmd0aCAlIDIgPT09IDAgKSA/IGluaXRpYWxseUluc2lkZSA6ICFpbml0aWFsbHlJbnNpZGU7XHJcblxyXG4gICAgICAvLyB7QXJyYXkuPEFycmF5LjxTZWdtZW50Pj59LCB3aGVyZSBlYWNoIGNvbnRhaW5lZCBhcnJheSB3aWxsIGJlIHR1cm5lZCBpbnRvIGEgc3VicGF0aCBhdCB0aGUgZW5kLlxyXG4gICAgICBkYXNoSXRlbS5zZWdtZW50QXJyYXlzID0gW107XHJcbiAgICAgIGZvciAoIGxldCBqID0gKCBpbml0aWFsbHlJbnNpZGUgPyAwIDogMSApOyBqIDwgdmFsdWVzLmxlbmd0aCAtIDE7IGogKz0gMiApIHtcclxuICAgICAgICBpZiAoIHZhbHVlc1sgaiBdICE9PSB2YWx1ZXNbIGogKyAxIF0gKSB7XHJcbiAgICAgICAgICBkYXNoSXRlbS5zZWdtZW50QXJyYXlzLnB1c2goIFsgc2VnbWVudC5zbGljZSggdmFsdWVzWyBqIF0sIHZhbHVlc1sgaiArIDEgXSApIF0gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDb21iaW5lIGFkamFjZW50IHdoaWNoIGJvdGggYXJlIGZpbGxlZCBvbiB0aGUgbWlkZGxlXHJcbiAgICBmb3IgKCBsZXQgaSA9IGRhc2hJdGVtcy5sZW5ndGggLSAxOyBpID49IDE7IGktLSApIHtcclxuICAgICAgY29uc3QgbGVmdEl0ZW0gPSBkYXNoSXRlbXNbIGkgLSAxIF07XHJcbiAgICAgIGNvbnN0IHJpZ2h0SXRlbSA9IGRhc2hJdGVtc1sgaSBdO1xyXG4gICAgICBpZiAoIGNhbkJlQ29tYmluZWQoIGxlZnRJdGVtLCByaWdodEl0ZW0gKSApIHtcclxuICAgICAgICBkYXNoSXRlbXMuc3BsaWNlKCBpIC0gMSwgMiwge1xyXG4gICAgICAgICAgc2VnbWVudEFycmF5czogY29tYmluZVNlZ21lbnRBcnJheXMoIGxlZnRJdGVtLnNlZ21lbnRBcnJheXMsIHJpZ2h0SXRlbS5zZWdtZW50QXJyYXlzICksXHJcbiAgICAgICAgICBoYXNMZWZ0RmlsbGVkOiBsZWZ0SXRlbS5oYXNMZWZ0RmlsbGVkLFxyXG4gICAgICAgICAgaGFzUmlnaHRGaWxsZWQ6IHJpZ2h0SXRlbS5oYXNSaWdodEZpbGxlZFxyXG4gICAgICAgIH0gYXMgRGFzaEl0ZW0gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbWJpbmUgYWRqYWNlbnQgc3RhcnQvZW5kIGlmIGFwcGxpY2FibGVcclxuICAgIGlmICggZGFzaEl0ZW1zLmxlbmd0aCA+IDEgJiYgY2FuQmVDb21iaW5lZCggZGFzaEl0ZW1zWyBkYXNoSXRlbXMubGVuZ3RoIC0gMSBdLCBkYXNoSXRlbXNbIDAgXSApICkge1xyXG4gICAgICBjb25zdCBsZWZ0SXRlbSA9IGRhc2hJdGVtcy5wb3AoKSE7XHJcbiAgICAgIGNvbnN0IHJpZ2h0SXRlbSA9IGRhc2hJdGVtcy5zaGlmdCgpITtcclxuICAgICAgZGFzaEl0ZW1zLnB1c2goIHtcclxuICAgICAgICBzZWdtZW50QXJyYXlzOiBjb21iaW5lU2VnbWVudEFycmF5cyggbGVmdEl0ZW0uc2VnbWVudEFycmF5cywgcmlnaHRJdGVtLnNlZ21lbnRBcnJheXMgKSxcclxuICAgICAgICBoYXNMZWZ0RmlsbGVkOiBsZWZ0SXRlbS5oYXNMZWZ0RmlsbGVkLFxyXG4gICAgICAgIGhhc1JpZ2h0RmlsbGVkOiByaWdodEl0ZW0uaGFzUmlnaHRGaWxsZWRcclxuICAgICAgfSBhcyBEYXNoSXRlbSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERldGVybWluZSBpZiB3ZSBhcmUgY2xvc2VkIChoYXZlIG9ubHkgb25lIHN1YnBhdGgpXHJcbiAgICBpZiAoIHRoaXMuY2xvc2VkICYmIGRhc2hJdGVtcy5sZW5ndGggPT09IDEgJiYgZGFzaEl0ZW1zWyAwIF0uc2VnbWVudEFycmF5cy5sZW5ndGggPT09IDEgJiYgZGFzaEl0ZW1zWyAwIF0uaGFzTGVmdEZpbGxlZCAmJiBkYXNoSXRlbXNbIDAgXS5oYXNSaWdodEZpbGxlZCApIHtcclxuICAgICAgcmV0dXJuIFsgbmV3IFN1YnBhdGgoIGRhc2hJdGVtc1sgMCBdLnNlZ21lbnRBcnJheXNbIDAgXSwgdW5kZWZpbmVkLCB0cnVlICkgXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb252ZXJ0IHRvIHN1YnBhdGhzXHJcbiAgICByZXR1cm4gXy5mbGF0dGVuKCBkYXNoSXRlbXMubWFwKCBkYXNoSXRlbSA9PiBkYXNoSXRlbS5zZWdtZW50QXJyYXlzICkgKS5tYXAoIHNlZ21lbnRzID0+IG5ldyBTdWJwYXRoKCBzZWdtZW50cyApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIG9iamVjdCBmb3JtIHRoYXQgY2FuIGJlIHR1cm5lZCBiYWNrIGludG8gYSBzZWdtZW50IHdpdGggdGhlIGNvcnJlc3BvbmRpbmcgZGVzZXJpYWxpemUgbWV0aG9kLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXJpYWxpemUoKTogU2VyaWFsaXplZFN1YnBhdGgge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ1N1YnBhdGgnLFxyXG4gICAgICBzZWdtZW50czogdGhpcy5zZWdtZW50cy5tYXAoIHNlZ21lbnQgPT4gc2VnbWVudC5zZXJpYWxpemUoKSApLFxyXG4gICAgICBwb2ludHM6IHRoaXMucG9pbnRzLm1hcCggcG9pbnQgPT4gKCB7XHJcbiAgICAgICAgeDogcG9pbnQueCxcclxuICAgICAgICB5OiBwb2ludC55XHJcbiAgICAgIH0gKSApLFxyXG4gICAgICBjbG9zZWQ6IHRoaXMuY2xvc2VkXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIFN1YnBhdGggZnJvbSB0aGUgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGRlc2VyaWFsaXplKCBvYmo6IFNlcmlhbGl6ZWRTdWJwYXRoICk6IFN1YnBhdGgge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb2JqLnR5cGUgPT09ICdTdWJwYXRoJyApO1xyXG5cclxuICAgIHJldHVybiBuZXcgU3VicGF0aCggb2JqLnNlZ21lbnRzLm1hcCggU2VnbWVudC5kZXNlcmlhbGl6ZSApLCBvYmoucG9pbnRzLm1hcCggcHQgPT4gbmV3IFZlY3RvcjIoIHB0LngsIHB0LnkgKSApLCBvYmouY2xvc2VkICk7XHJcbiAgfVxyXG59XHJcblxyXG5raXRlLnJlZ2lzdGVyKCAnU3VicGF0aCcsIFN1YnBhdGggKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFN1YnBhdGg7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFdBQVcsTUFBTSxpQ0FBaUM7QUFDekQsT0FBT0MsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxPQUFPQyxPQUFPLE1BQU0sNEJBQTRCO0FBRWhELFNBQVNDLEdBQUcsRUFBb0NDLElBQUksRUFBRUMsSUFBSSxFQUFFQyxVQUFVLEVBQTBCQyxPQUFPLFFBQTJCLGVBQWU7QUFpQmpKLE1BQU1DLE9BQU8sQ0FBQztFQUVMQyxRQUFRLEdBQWMsRUFBRTtFQUlmQyxrQkFBa0IsR0FBRyxJQUFJVixXQUFXLENBQUMsQ0FBQzs7RUFFdEQ7RUFDT1csT0FBTyxHQUFtQixJQUFJOztFQUVyQztFQUNRQyxnQkFBZ0IsR0FBcUIsSUFBSTtFQUN6Q0Msd0JBQXdCLEdBQUcsS0FBSztFQUNoQ0MsY0FBYyxHQUFzQixJQUFJOztFQUVoRDtFQUNRQyxtQkFBbUIsR0FBRyxLQUFLO0VBSW5DO0FBQ0Y7QUFDQTtFQUNTQyxXQUFXQSxDQUFFUCxRQUFvQixFQUFFUSxNQUFrQixFQUFFQyxNQUFnQixFQUFHO0lBQy9FO0lBQ0EsSUFBSSxDQUFDRCxNQUFNLEdBQUdBLE1BQU0sS0FBUVIsUUFBUSxJQUFJQSxRQUFRLENBQUNVLE1BQU0sR0FBS0MsQ0FBQyxDQUFDQyxHQUFHLENBQUVaLFFBQVEsRUFBRWEsT0FBTyxJQUFJQSxPQUFPLENBQUNDLEtBQU0sQ0FBQyxDQUFDQyxNQUFNLENBQUVmLFFBQVEsQ0FBRUEsUUFBUSxDQUFDVSxNQUFNLEdBQUcsQ0FBQyxDQUFFLENBQUNNLEdBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBRTtJQUU1SixJQUFJLENBQUNQLE1BQU0sR0FBRyxDQUFDLENBQUNBLE1BQU07SUFFdEIsSUFBSSxDQUFDUSxtQkFBbUIsR0FBRyxJQUFJLENBQUNDLFVBQVUsQ0FBQ0MsSUFBSSxDQUFFLElBQUssQ0FBQzs7SUFFdkQ7SUFDQSxJQUFLbkIsUUFBUSxFQUFHO01BQ2QsS0FBTSxJQUFJb0IsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHcEIsUUFBUSxDQUFDVSxNQUFNLEVBQUVVLENBQUMsRUFBRSxFQUFHO1FBQzFDVCxDQUFDLENBQUNVLElBQUksQ0FBRXJCLFFBQVEsQ0FBRW9CLENBQUMsQ0FBRSxDQUFDRSx3QkFBd0IsQ0FBQyxDQUFDLEVBQUVULE9BQU8sSUFBSTtVQUMzRCxJQUFJLENBQUNVLGtCQUFrQixDQUFFVixPQUFRLENBQUM7UUFDcEMsQ0FBRSxDQUFDO01BQ0w7SUFDRjtFQUNGOztFQUVBO0FBQ0Y7QUFDQTtFQUNTVyxTQUFTQSxDQUFBLEVBQVk7SUFDMUIsSUFBSyxJQUFJLENBQUN0QixPQUFPLEtBQUssSUFBSSxFQUFHO01BQzNCLE1BQU11QixNQUFNLEdBQUdqQyxPQUFPLENBQUNrQyxPQUFPLENBQUNDLElBQUksQ0FBQyxDQUFDO01BQ3JDaEIsQ0FBQyxDQUFDVSxJQUFJLENBQUUsSUFBSSxDQUFDckIsUUFBUSxFQUFFYSxPQUFPLElBQUk7UUFDaENZLE1BQU0sQ0FBQ0csYUFBYSxDQUFFZixPQUFPLENBQUNXLFNBQVMsQ0FBQyxDQUFFLENBQUM7TUFDN0MsQ0FBRSxDQUFDO01BQ0gsSUFBSSxDQUFDdEIsT0FBTyxHQUFHdUIsTUFBTTtJQUN2QjtJQUNBLE9BQU8sSUFBSSxDQUFDdkIsT0FBTztFQUNyQjtFQUVBLElBQVd1QixNQUFNQSxDQUFBLEVBQVk7SUFBRSxPQUFPLElBQUksQ0FBQ0QsU0FBUyxDQUFDLENBQUM7RUFBRTs7RUFFeEQ7QUFDRjtBQUNBO0VBQ1NLLFlBQVlBLENBQUVDLGVBQXdCLEVBQUVDLFlBQXFCLEVBQUVDLFNBQWtCLEVBQVc7SUFDakcsSUFBSXRCLE1BQU0sR0FBRyxDQUFDO0lBQ2QsS0FBTSxJQUFJVSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUcsSUFBSSxDQUFDcEIsUUFBUSxDQUFDVSxNQUFNLEVBQUVVLENBQUMsRUFBRSxFQUFHO01BQy9DVixNQUFNLElBQUksSUFBSSxDQUFDVixRQUFRLENBQUVvQixDQUFDLENBQUUsQ0FBQ1MsWUFBWSxDQUFFQyxlQUFlLEVBQUVDLFlBQVksRUFBRUMsU0FBVSxDQUFDO0lBQ3ZGO0lBQ0EsT0FBT3RCLE1BQU07RUFDZjs7RUFFQTtBQUNGO0FBQ0E7RUFDU2lCLElBQUlBLENBQUEsRUFBWTtJQUNyQixPQUFPLElBQUk1QixPQUFPLENBQUUsSUFBSSxDQUFDQyxRQUFRLENBQUNpQyxLQUFLLENBQUUsQ0FBRSxDQUFDLEVBQUUsSUFBSSxDQUFDekIsTUFBTSxDQUFDeUIsS0FBSyxDQUFFLENBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQ3hCLE1BQU8sQ0FBQztFQUNyRjs7RUFFQTtBQUNGO0FBQ0E7RUFDU3lCLGdCQUFnQkEsQ0FBQSxFQUFTO0lBQzlCLElBQUksQ0FBQzVCLG1CQUFtQixHQUFHLElBQUk7SUFFL0IsTUFBTTZCLFdBQVcsR0FBRyxJQUFJLENBQUNuQyxRQUFRLENBQUNVLE1BQU07SUFDeEMsS0FBTSxJQUFJVSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdlLFdBQVcsRUFBRWYsQ0FBQyxFQUFFLEVBQUc7TUFDdEMsSUFBSSxDQUFDcEIsUUFBUSxDQUFFb0IsQ0FBQyxDQUFFLENBQUNGLFVBQVUsQ0FBQyxDQUFDO0lBQ2pDO0lBRUEsSUFBSSxDQUFDWixtQkFBbUIsR0FBRyxLQUFLO0lBQ2hDLElBQUksQ0FBQ1ksVUFBVSxDQUFDLENBQUM7RUFDbkI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7RUFDU0EsVUFBVUEsQ0FBQSxFQUFTO0lBQ3hCLElBQUssQ0FBQyxJQUFJLENBQUNaLG1CQUFtQixFQUFHO01BQy9CLElBQUksQ0FBQ0osT0FBTyxHQUFHLElBQUk7TUFDbkIsSUFBSSxDQUFDRSx3QkFBd0IsR0FBRyxLQUFLO01BQ3JDLElBQUksQ0FBQ0gsa0JBQWtCLENBQUNtQyxJQUFJLENBQUMsQ0FBQztJQUNoQztFQUNGOztFQUVBO0FBQ0Y7QUFDQTtFQUNTQyxRQUFRQSxDQUFFQyxLQUFjLEVBQVM7SUFDdEMsSUFBSSxDQUFDOUIsTUFBTSxDQUFDK0IsSUFBSSxDQUFFRCxLQUFNLENBQUM7SUFFekIsT0FBTyxJQUFJLENBQUMsQ0FBQztFQUNmOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDVWYsa0JBQWtCQSxDQUFFVixPQUFnQixFQUFTO0lBQ25EMkIsTUFBTSxJQUFJQSxNQUFNLENBQUUzQixPQUFPLENBQUNDLEtBQUssQ0FBQzJCLFFBQVEsQ0FBQyxDQUFDLEVBQUUsMkJBQTRCLENBQUM7SUFDekVELE1BQU0sSUFBSUEsTUFBTSxDQUFFM0IsT0FBTyxDQUFDRyxHQUFHLENBQUN5QixRQUFRLENBQUMsQ0FBQyxFQUFFLHlCQUEwQixDQUFDO0lBQ3JFRCxNQUFNLElBQUlBLE1BQU0sQ0FBRTNCLE9BQU8sQ0FBQzZCLFlBQVksQ0FBQ0QsUUFBUSxDQUFDLENBQUMsRUFBRSxrQ0FBbUMsQ0FBQztJQUN2RkQsTUFBTSxJQUFJQSxNQUFNLENBQUUzQixPQUFPLENBQUM4QixVQUFVLENBQUNGLFFBQVEsQ0FBQyxDQUFDLEVBQUUsZ0NBQWlDLENBQUM7SUFDbkZELE1BQU0sSUFBSUEsTUFBTSxDQUFFM0IsT0FBTyxDQUFDWSxNQUFNLENBQUNtQixPQUFPLENBQUMsQ0FBQyxJQUFJL0IsT0FBTyxDQUFDWSxNQUFNLENBQUNnQixRQUFRLENBQUMsQ0FBQyxFQUFFLDBDQUEyQyxDQUFDO0lBQ3JILElBQUksQ0FBQ3pDLFFBQVEsQ0FBQ3VDLElBQUksQ0FBRTFCLE9BQVEsQ0FBQzs7SUFFN0I7SUFDQTtJQUNBQSxPQUFPLENBQUNnQyxtQkFBbUIsQ0FBQ0MsV0FBVyxDQUFFLElBQUksQ0FBQzdCLG1CQUFvQixDQUFDO0lBRW5FLE9BQU8sSUFBSSxDQUFDLENBQUM7RUFDZjs7RUFFQTtBQUNGO0FBQ0E7RUFDUzhCLFVBQVVBLENBQUVsQyxPQUFnQixFQUFTO0lBQzFDLE1BQU1tQyxxQkFBcUIsR0FBR25DLE9BQU8sQ0FBQ1Msd0JBQXdCLENBQUMsQ0FBQztJQUNoRSxNQUFNMkIsd0JBQXdCLEdBQUdELHFCQUFxQixDQUFDdEMsTUFBTTtJQUM3RCxLQUFNLElBQUlVLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBRzZCLHdCQUF3QixFQUFFN0IsQ0FBQyxFQUFFLEVBQUc7TUFDbkQsSUFBSSxDQUFDRyxrQkFBa0IsQ0FBRVYsT0FBUSxDQUFDO0lBQ3BDO0lBQ0EsSUFBSSxDQUFDSyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7O0lBRW5CLE9BQU8sSUFBSSxDQUFDLENBQUM7RUFDZjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtFQUNTZ0MsaUJBQWlCQSxDQUFBLEVBQVM7SUFDL0IsSUFBSyxJQUFJLENBQUNDLGlCQUFpQixDQUFDLENBQUMsRUFBRztNQUM5QixNQUFNQyxjQUFjLEdBQUcsSUFBSSxDQUFDQyxpQkFBaUIsQ0FBQyxDQUFDO01BQy9DLElBQUksQ0FBQzlCLGtCQUFrQixDQUFFNkIsY0FBZSxDQUFDO01BQ3pDLElBQUksQ0FBQ2xDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNuQixJQUFJLENBQUNtQixRQUFRLENBQUUsSUFBSSxDQUFDaUIsYUFBYSxDQUFDLENBQUUsQ0FBQztNQUNyQyxJQUFJLENBQUM3QyxNQUFNLEdBQUcsSUFBSTtJQUNwQjtFQUNGOztFQUVBO0FBQ0Y7QUFDQTtFQUNTOEMsS0FBS0EsQ0FBQSxFQUFTO0lBQ25CLElBQUksQ0FBQzlDLE1BQU0sR0FBRyxJQUFJOztJQUVsQjtJQUNBLElBQUksQ0FBQ3lDLGlCQUFpQixDQUFDLENBQUM7RUFDMUI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNTTSxTQUFTQSxDQUFBLEVBQVc7SUFDekIsT0FBTyxJQUFJLENBQUNoRCxNQUFNLENBQUNFLE1BQU07RUFDM0I7O0VBRUE7QUFDRjtBQUNBO0VBQ1M0QyxhQUFhQSxDQUFBLEVBQVk7SUFDOUJkLE1BQU0sSUFBSUEsTUFBTSxDQUFFLElBQUksQ0FBQ2hDLE1BQU0sQ0FBQ0UsTUFBTyxDQUFDO0lBRXRDLE9BQU9DLENBQUMsQ0FBQzhDLEtBQUssQ0FBRSxJQUFJLENBQUNqRCxNQUFPLENBQUM7RUFDL0I7O0VBRUE7QUFDRjtBQUNBO0VBQ1NrRCxZQUFZQSxDQUFBLEVBQVk7SUFDN0JsQixNQUFNLElBQUlBLE1BQU0sQ0FBRSxJQUFJLENBQUNoQyxNQUFNLENBQUNFLE1BQU8sQ0FBQztJQUV0QyxPQUFPQyxDQUFDLENBQUNnRCxJQUFJLENBQUUsSUFBSSxDQUFDbkQsTUFBTyxDQUFDO0VBQzlCOztFQUVBO0FBQ0Y7QUFDQTtFQUNTb0QsZUFBZUEsQ0FBQSxFQUFZO0lBQ2hDcEIsTUFBTSxJQUFJQSxNQUFNLENBQUUsSUFBSSxDQUFDeEMsUUFBUSxDQUFDVSxNQUFPLENBQUM7SUFFeEMsT0FBT0MsQ0FBQyxDQUFDOEMsS0FBSyxDQUFFLElBQUksQ0FBQ3pELFFBQVMsQ0FBQztFQUNqQzs7RUFFQTtBQUNGO0FBQ0E7RUFDUzZELGNBQWNBLENBQUEsRUFBWTtJQUMvQnJCLE1BQU0sSUFBSUEsTUFBTSxDQUFFLElBQUksQ0FBQ3hDLFFBQVEsQ0FBQ1UsTUFBTyxDQUFDO0lBRXhDLE9BQU9DLENBQUMsQ0FBQ2dELElBQUksQ0FBRSxJQUFJLENBQUMzRCxRQUFTLENBQUM7RUFDaEM7O0VBRUE7QUFDRjtBQUNBO0VBQ1M4RCxlQUFlQSxDQUFBLEVBQWM7SUFDbEMsTUFBTTlELFFBQVEsR0FBRyxJQUFJLENBQUNBLFFBQVEsQ0FBQ2lDLEtBQUssQ0FBQyxDQUFDO0lBQ3RDLElBQUssSUFBSSxDQUFDa0IsaUJBQWlCLENBQUMsQ0FBQyxFQUFHO01BQzlCbkQsUUFBUSxDQUFDdUMsSUFBSSxDQUFFLElBQUksQ0FBQ2MsaUJBQWlCLENBQUMsQ0FBRSxDQUFDO0lBQzNDO0lBQ0EsT0FBT3JELFFBQVE7RUFDakI7O0VBRUE7QUFDRjtBQUNBO0VBQ1MrRCxVQUFVQSxDQUFBLEVBQVk7SUFDM0IsT0FBTyxJQUFJLENBQUMvRCxRQUFRLENBQUNVLE1BQU0sR0FBRyxDQUFDO0VBQ2pDOztFQUVBO0FBQ0Y7QUFDQTtFQUNTc0QsUUFBUUEsQ0FBQSxFQUFZO0lBQ3pCLE9BQU8sSUFBSSxDQUFDdkQsTUFBTTtFQUNwQjs7RUFFQTtBQUNGO0FBQ0E7RUFDUzBDLGlCQUFpQkEsQ0FBQSxFQUFZO0lBQ2xDLE9BQU8sQ0FBQyxJQUFJLENBQUNHLGFBQWEsQ0FBQyxDQUFDLENBQUNXLGFBQWEsQ0FBRSxJQUFJLENBQUNQLFlBQVksQ0FBQyxDQUFDLEVBQUUsV0FBWSxDQUFDO0VBQ2hGOztFQUVBO0FBQ0Y7QUFDQTtFQUNTTCxpQkFBaUJBLENBQUEsRUFBUztJQUMvQmIsTUFBTSxJQUFJQSxNQUFNLENBQUUsSUFBSSxDQUFDVyxpQkFBaUIsQ0FBQyxDQUFDLEVBQUUsNkRBQThELENBQUM7SUFDM0csT0FBTyxJQUFJdkQsSUFBSSxDQUFFLElBQUksQ0FBQzhELFlBQVksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDSixhQUFhLENBQUMsQ0FBRSxDQUFDO0VBQzlEOztFQUVBO0FBQ0Y7QUFDQTtFQUNTWSxnQkFBZ0JBLENBQUU1QixLQUFjLEVBQTJCO0lBQ2hFLE9BQU94QyxPQUFPLENBQUNxRSwwQkFBMEIsQ0FBRXhELENBQUMsQ0FBQ3lELE9BQU8sQ0FBRSxJQUFJLENBQUNwRSxRQUFRLENBQUNZLEdBQUcsQ0FBRUMsT0FBTyxJQUFJQSxPQUFPLENBQUNxRCxnQkFBZ0IsQ0FBRTVCLEtBQU0sQ0FBRSxDQUFFLENBQUUsQ0FBQztFQUM3SDs7RUFFQTtBQUNGO0FBQ0E7RUFDUytCLGNBQWNBLENBQUVDLE9BQWlDLEVBQVM7SUFDL0QsSUFBSyxJQUFJLENBQUNQLFVBQVUsQ0FBQyxDQUFDLEVBQUc7TUFDdkIsTUFBTVEsVUFBVSxHQUFHLElBQUksQ0FBQ1gsZUFBZSxDQUFDLENBQUMsQ0FBQzlDLEtBQUs7TUFDL0N3RCxPQUFPLENBQUNFLE1BQU0sQ0FBRUQsVUFBVSxDQUFDRSxDQUFDLEVBQUVGLFVBQVUsQ0FBQ0csQ0FBRSxDQUFDLENBQUMsQ0FBQzs7TUFFOUMsSUFBSUMsR0FBRyxHQUFHLElBQUksQ0FBQzNFLFFBQVEsQ0FBQ1UsTUFBTTs7TUFFOUI7TUFDQTtNQUNBLElBQUssSUFBSSxDQUFDRCxNQUFNLElBQUlrRSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQzNFLFFBQVEsQ0FBRTJFLEdBQUcsR0FBRyxDQUFDLENBQUUsWUFBWS9FLElBQUksRUFBRztRQUN6RStFLEdBQUcsRUFBRTtNQUNQO01BRUEsS0FBTSxJQUFJdkQsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHdUQsR0FBRyxFQUFFdkQsQ0FBQyxFQUFFLEVBQUc7UUFDOUIsSUFBSSxDQUFDcEIsUUFBUSxDQUFFb0IsQ0FBQyxDQUFFLENBQUNpRCxjQUFjLENBQUVDLE9BQVEsQ0FBQztNQUM5QztNQUVBLElBQUssSUFBSSxDQUFDN0QsTUFBTSxFQUFHO1FBQ2pCNkQsT0FBTyxDQUFDTSxTQUFTLENBQUMsQ0FBQztNQUNyQjtJQUNGO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0VBQ1NDLGlCQUFpQkEsQ0FBRUMsT0FBK0IsRUFBWTtJQUNuRXRDLE1BQU0sSUFBSUEsTUFBTSxDQUFFLENBQUNzQyxPQUFPLENBQUNDLFFBQVEsRUFBRSx3REFBeUQsQ0FBQztJQUMvRixPQUFPLElBQUloRixPQUFPLENBQUVZLENBQUMsQ0FBQ3lELE9BQU8sQ0FBRXpELENBQUMsQ0FBQ0MsR0FBRyxDQUFFLElBQUksQ0FBQ1osUUFBUSxFQUFFYSxPQUFPLElBQUlBLE9BQU8sQ0FBQ21FLHlCQUF5QixDQUFFRixPQUFRLENBQUUsQ0FBRSxDQUFDLEVBQUVHLFNBQVMsRUFBRSxJQUFJLENBQUN4RSxNQUFPLENBQUM7RUFDNUk7O0VBRUE7QUFDRjtBQUNBO0VBQ1N5RSxXQUFXQSxDQUFFQyxNQUFlLEVBQVk7SUFDN0MsT0FBTyxJQUFJcEYsT0FBTyxDQUNoQlksQ0FBQyxDQUFDQyxHQUFHLENBQUUsSUFBSSxDQUFDWixRQUFRLEVBQUVhLE9BQU8sSUFBSUEsT0FBTyxDQUFDcUUsV0FBVyxDQUFFQyxNQUFPLENBQUUsQ0FBQyxFQUNoRXhFLENBQUMsQ0FBQ0MsR0FBRyxDQUFFLElBQUksQ0FBQ0osTUFBTSxFQUFFOEIsS0FBSyxJQUFJNkMsTUFBTSxDQUFDQyxZQUFZLENBQUU5QyxLQUFNLENBQUUsQ0FBQyxFQUMzRCxJQUFJLENBQUM3QixNQUNQLENBQUM7RUFDSDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtFQUNTNEUsb0JBQW9CQSxDQUFFUCxPQUErQixFQUFZO0lBQ3RFLE9BQU8sSUFBSS9FLE9BQU8sQ0FBRVksQ0FBQyxDQUFDeUQsT0FBTyxDQUFFekQsQ0FBQyxDQUFDQyxHQUFHLENBQUUsSUFBSSxDQUFDWixRQUFRLEVBQUVhLE9BQU8sSUFBSTtNQUM5RDtNQUNBO01BQ0EsSUFBS2lFLE9BQU8sQ0FBQ1EsVUFBVSxJQUFJekUsT0FBTyxDQUFFaUUsT0FBTyxDQUFDUSxVQUFVLENBQUUsRUFBRztRQUN6RDtRQUNBLE9BQU96RSxPQUFPLENBQUVpRSxPQUFPLENBQUNRLFVBQVUsQ0FBRSxDQUFFUixPQUFRLENBQUM7TUFDakQsQ0FBQyxNQUNJO1FBQ0gsT0FBT2pFLE9BQU8sQ0FBQ21FLHlCQUF5QixDQUFFRixPQUFRLENBQUM7TUFDckQ7SUFDRixDQUFFLENBQUUsQ0FBQyxFQUFFRyxTQUFTLEVBQUUsSUFBSSxDQUFDeEUsTUFBTyxDQUFDO0VBQ2pDOztFQUVBO0FBQ0Y7QUFDQTtFQUNTOEUsc0JBQXNCQSxDQUFFSixNQUFlLEVBQVk7SUFDeEQsTUFBTTFELE1BQU0sR0FBR2pDLE9BQU8sQ0FBQ2tDLE9BQU8sQ0FBQ0MsSUFBSSxDQUFDLENBQUM7SUFDckMsTUFBTVEsV0FBVyxHQUFHLElBQUksQ0FBQ25DLFFBQVEsQ0FBQ1UsTUFBTTtJQUN4QyxLQUFNLElBQUlVLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR2UsV0FBVyxFQUFFZixDQUFDLEVBQUUsRUFBRztNQUN0Q0ssTUFBTSxDQUFDRyxhQUFhLENBQUUsSUFBSSxDQUFDNUIsUUFBUSxDQUFFb0IsQ0FBQyxDQUFFLENBQUNtRSxzQkFBc0IsQ0FBRUosTUFBTyxDQUFFLENBQUM7SUFDN0U7SUFDQSxPQUFPMUQsTUFBTTtFQUNmOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDUytELE1BQU1BLENBQUVDLFFBQWdCLEVBQVk7SUFDekMsSUFBSyxDQUFDLElBQUksQ0FBQzFCLFVBQVUsQ0FBQyxDQUFDLEVBQUc7TUFDeEIsT0FBTyxJQUFJaEUsT0FBTyxDQUFFLEVBQUUsRUFBRWtGLFNBQVMsRUFBRSxJQUFJLENBQUN4RSxNQUFPLENBQUM7SUFDbEQ7SUFDQSxJQUFLZ0YsUUFBUSxLQUFLLENBQUMsRUFBRztNQUNwQixPQUFPLElBQUkxRixPQUFPLENBQUUsSUFBSSxDQUFDQyxRQUFRLENBQUNpQyxLQUFLLENBQUMsQ0FBQyxFQUFFZ0QsU0FBUyxFQUFFLElBQUksQ0FBQ3hFLE1BQU8sQ0FBQztJQUNyRTtJQUVBLElBQUlXLENBQUM7SUFFTCxNQUFNc0UsZUFBZSxHQUFHLElBQUksQ0FBQzFGLFFBQVEsQ0FBQ2lDLEtBQUssQ0FBQyxDQUFDO0lBQzdDLE1BQU0wRCxPQUFPLEdBQUcsRUFBRTtJQUVsQixLQUFNdkUsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHc0UsZUFBZSxDQUFDaEYsTUFBTSxFQUFFVSxDQUFDLEVBQUUsRUFBRztNQUM3Q3VFLE9BQU8sQ0FBQ3BELElBQUksQ0FBRW1ELGVBQWUsQ0FBRXRFLENBQUMsQ0FBRSxDQUFDd0UsVUFBVSxDQUFFLENBQUMsR0FBR0gsUUFBUyxDQUFFLENBQUM7SUFDakU7SUFFQSxJQUFJekYsUUFBbUIsR0FBRyxFQUFFO0lBQzVCLEtBQU1vQixDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdzRSxlQUFlLENBQUNoRixNQUFNLEVBQUVVLENBQUMsRUFBRSxFQUFHO01BQzdDLElBQUssSUFBSSxDQUFDWCxNQUFNLElBQUlXLENBQUMsR0FBRyxDQUFDLEVBQUc7UUFDMUIsTUFBTXlFLFNBQVMsR0FBRyxDQUFFekUsQ0FBQyxHQUFHLENBQUMsR0FBR0EsQ0FBQyxHQUFHc0UsZUFBZSxDQUFDaEYsTUFBTSxJQUFLLENBQUM7UUFDNUQsTUFBTW9GLE1BQU0sR0FBR0osZUFBZSxDQUFFdEUsQ0FBQyxDQUFFLENBQUNOLEtBQUs7UUFDekMsTUFBTWlGLFdBQVcsR0FBR0wsZUFBZSxDQUFFRyxTQUFTLENBQUUsQ0FBQ2xELFVBQVU7UUFDM0QsTUFBTXFELFNBQVMsR0FBR04sZUFBZSxDQUFFdEUsQ0FBQyxDQUFFLENBQUNzQixZQUFZO1FBRW5ELE1BQU11RCxVQUFVLEdBQUdGLFdBQVcsQ0FBQ0csYUFBYSxDQUFDQyxPQUFPLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUVYLFFBQVMsQ0FBQyxDQUFDWSxLQUFLO1FBQzlFLE1BQU1DLFFBQVEsR0FBR04sU0FBUyxDQUFDRSxhQUFhLENBQUNDLE9BQU8sQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBRVgsUUFBUyxDQUFDLENBQUNZLEtBQUs7UUFDMUUsTUFBTUUsYUFBYSxHQUFHUixXQUFXLENBQUNHLGFBQWEsQ0FBQ00sR0FBRyxDQUFFUixTQUFVLENBQUMsR0FBRyxDQUFDO1FBQ3BFaEcsUUFBUSxDQUFDdUMsSUFBSSxDQUFFLElBQUk3QyxHQUFHLENBQUVvRyxNQUFNLEVBQUVXLElBQUksQ0FBQ0MsR0FBRyxDQUFFakIsUUFBUyxDQUFDLEVBQUVRLFVBQVUsRUFBRUssUUFBUSxFQUFFQyxhQUFjLENBQUUsQ0FBQztNQUMvRjtNQUNBdkcsUUFBUSxHQUFHQSxRQUFRLENBQUNlLE1BQU0sQ0FBRTRFLE9BQU8sQ0FBRXZFLENBQUMsQ0FBRyxDQUFDO0lBQzVDO0lBRUEsT0FBTyxJQUFJckIsT0FBTyxDQUFFQyxRQUFRLEVBQUVpRixTQUFTLEVBQUUsSUFBSSxDQUFDeEUsTUFBTyxDQUFDO0VBQ3hEOztFQUVBO0FBQ0Y7QUFDQTtFQUNTa0csT0FBT0EsQ0FBRUMsVUFBc0IsRUFBYztJQUNsRDtJQUNBLElBQUssQ0FBQyxJQUFJLENBQUM3QyxVQUFVLENBQUMsQ0FBQyxFQUFHO01BQ3hCLE9BQU8sRUFBRTtJQUNYO0lBRUEsSUFBSzZDLFVBQVUsS0FBSzNCLFNBQVMsRUFBRztNQUM5QjJCLFVBQVUsR0FBRyxJQUFJL0csVUFBVSxDQUFDLENBQUM7SUFDL0I7O0lBRUE7SUFDQTJDLE1BQU0sSUFBSUEsTUFBTSxDQUFFLENBQUMsSUFBSSxDQUFDcEMsd0JBQXdCLElBQU0sSUFBSSxDQUFDQyxjQUFjLElBQUksSUFBSSxDQUFDRixnQkFBbUIsQ0FBQztJQUN0RyxJQUFLLElBQUksQ0FBQ0Msd0JBQXdCLElBQUksSUFBSSxDQUFDQyxjQUFjLENBQUV3RyxNQUFNLENBQUVELFVBQVcsQ0FBQyxFQUFHO01BQ2hGLE9BQU8sSUFBSSxDQUFDekcsZ0JBQWdCO0lBQzlCO0lBRUEsTUFBTTJHLFNBQVMsR0FBR0YsVUFBVSxDQUFDRSxTQUFTO0lBRXRDLElBQUkxRixDQUFDO0lBQ0wsSUFBSTJGLFlBQXVCLEdBQUcsRUFBRTtJQUNoQyxJQUFJQyxhQUF3QixHQUFHLEVBQUU7SUFDakMsTUFBTUMsWUFBWSxHQUFHLElBQUksQ0FBQ3JELGVBQWUsQ0FBQyxDQUFDO0lBQzNDLE1BQU1zRCxXQUFXLEdBQUcsSUFBSSxDQUFDckQsY0FBYyxDQUFDLENBQUM7SUFFekMsTUFBTXNELGtCQUFrQixHQUFLbkgsUUFBbUIsSUFBTTtNQUNwRCtHLFlBQVksR0FBR0EsWUFBWSxDQUFDaEcsTUFBTSxDQUFFZixRQUFTLENBQUM7SUFDaEQsQ0FBQztJQUVELE1BQU1vSCxtQkFBbUIsR0FBS3BILFFBQW1CLElBQU07TUFDckRnSCxhQUFhLEdBQUdBLGFBQWEsQ0FBQ2pHLE1BQU0sQ0FBRWYsUUFBUyxDQUFDO0lBQ2xELENBQUM7O0lBRUQ7SUFDQSxNQUFNcUgsYUFBYSxHQUFHSCxXQUFXLENBQUNsRyxHQUFHLENBQUM2RixNQUFNLENBQUVJLFlBQVksQ0FBQ25HLEtBQU0sQ0FBQztJQUNsRTtJQUNBLE1BQU1zQyxjQUFjLEdBQUdpRSxhQUFhLEdBQUcsSUFBSSxHQUFHLElBQUl6SCxJQUFJLENBQUUsSUFBSSxDQUFDSSxRQUFRLENBQUUsSUFBSSxDQUFDQSxRQUFRLENBQUNVLE1BQU0sR0FBRyxDQUFDLENBQUUsQ0FBQ00sR0FBRyxFQUFFLElBQUksQ0FBQ2hCLFFBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQ2MsS0FBTSxDQUFDOztJQUVqSTtJQUNBLEtBQU1NLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBRyxJQUFJLENBQUNwQixRQUFRLENBQUNVLE1BQU0sRUFBRVUsQ0FBQyxFQUFFLEVBQUc7TUFDM0MsSUFBS0EsQ0FBQyxHQUFHLENBQUMsRUFBRztRQUNYK0Ysa0JBQWtCLENBQUVQLFVBQVUsQ0FBQ1UsUUFBUSxDQUFFLElBQUksQ0FBQ3RILFFBQVEsQ0FBRW9CLENBQUMsQ0FBRSxDQUFDTixLQUFLLEVBQUUsSUFBSSxDQUFDZCxRQUFRLENBQUVvQixDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUN1QixVQUFVLEVBQUUsSUFBSSxDQUFDM0MsUUFBUSxDQUFFb0IsQ0FBQyxDQUFFLENBQUNzQixZQUFhLENBQUUsQ0FBQztNQUMzSTtNQUNBeUUsa0JBQWtCLENBQUUsSUFBSSxDQUFDbkgsUUFBUSxDQUFFb0IsQ0FBQyxDQUFFLENBQUN3RSxVQUFVLENBQUVrQixTQUFVLENBQUUsQ0FBQztJQUNsRTs7SUFFQTtJQUNBLEtBQU0xRixDQUFDLEdBQUcsSUFBSSxDQUFDcEIsUUFBUSxDQUFDVSxNQUFNLEdBQUcsQ0FBQyxFQUFFVSxDQUFDLElBQUksQ0FBQyxFQUFFQSxDQUFDLEVBQUUsRUFBRztNQUNoRCxJQUFLQSxDQUFDLEdBQUcsSUFBSSxDQUFDcEIsUUFBUSxDQUFDVSxNQUFNLEdBQUcsQ0FBQyxFQUFHO1FBQ2xDMEcsbUJBQW1CLENBQUVSLFVBQVUsQ0FBQ1csU0FBUyxDQUFFLElBQUksQ0FBQ3ZILFFBQVEsQ0FBRW9CLENBQUMsQ0FBRSxDQUFDSixHQUFHLEVBQUUsSUFBSSxDQUFDaEIsUUFBUSxDQUFFb0IsQ0FBQyxDQUFFLENBQUN1QixVQUFVLEVBQUUsSUFBSSxDQUFDM0MsUUFBUSxDQUFFb0IsQ0FBQyxHQUFHLENBQUMsQ0FBRSxDQUFDc0IsWUFBYSxDQUFFLENBQUM7TUFDM0k7TUFDQTBFLG1CQUFtQixDQUFFLElBQUksQ0FBQ3BILFFBQVEsQ0FBRW9CLENBQUMsQ0FBRSxDQUFDb0csV0FBVyxDQUFFVixTQUFVLENBQUUsQ0FBQztJQUNwRTtJQUVBLElBQUlXLFFBQVE7SUFDWixJQUFLLElBQUksQ0FBQ2hILE1BQU0sRUFBRztNQUNqQixJQUFLNEcsYUFBYSxFQUFHO1FBQ25CO1FBQ0FGLGtCQUFrQixDQUFFUCxVQUFVLENBQUNVLFFBQVEsQ0FBRUosV0FBVyxDQUFDbEcsR0FBRyxFQUFFa0csV0FBVyxDQUFDdkUsVUFBVSxFQUFFc0UsWUFBWSxDQUFDdkUsWUFBYSxDQUFFLENBQUM7UUFDL0cwRSxtQkFBbUIsQ0FBRVIsVUFBVSxDQUFDVyxTQUFTLENBQUVMLFdBQVcsQ0FBQ2xHLEdBQUcsRUFBRWtHLFdBQVcsQ0FBQ3ZFLFVBQVUsRUFBRXNFLFlBQVksQ0FBQ3ZFLFlBQWEsQ0FBRSxDQUFDO01BQ25ILENBQUMsTUFDSTtRQUNIO1FBQ0F5RSxrQkFBa0IsQ0FBRVAsVUFBVSxDQUFDVSxRQUFRLENBQUVsRSxjQUFjLENBQUV0QyxLQUFLLEVBQUVvRyxXQUFXLENBQUN2RSxVQUFVLEVBQUVTLGNBQWMsQ0FBRVYsWUFBYSxDQUFFLENBQUM7UUFDeEh5RSxrQkFBa0IsQ0FBRS9ELGNBQWMsQ0FBRXdDLFVBQVUsQ0FBRWtCLFNBQVUsQ0FBRSxDQUFDO1FBQzdESyxrQkFBa0IsQ0FBRVAsVUFBVSxDQUFDVSxRQUFRLENBQUVsRSxjQUFjLENBQUVwQyxHQUFHLEVBQUVvQyxjQUFjLENBQUVULFVBQVUsRUFBRXNFLFlBQVksQ0FBQ3ZFLFlBQWEsQ0FBRSxDQUFDOztRQUV2SDtRQUNBMEUsbUJBQW1CLENBQUVSLFVBQVUsQ0FBQ1csU0FBUyxDQUFFbkUsY0FBYyxDQUFFcEMsR0FBRyxFQUFFb0MsY0FBYyxDQUFFVCxVQUFVLEVBQUVzRSxZQUFZLENBQUN2RSxZQUFhLENBQUUsQ0FBQztRQUN6SDBFLG1CQUFtQixDQUFFaEUsY0FBYyxDQUFFb0UsV0FBVyxDQUFFVixTQUFVLENBQUUsQ0FBQztRQUMvRE0sbUJBQW1CLENBQUVSLFVBQVUsQ0FBQ1csU0FBUyxDQUFFbkUsY0FBYyxDQUFFdEMsS0FBSyxFQUFFb0csV0FBVyxDQUFDdkUsVUFBVSxFQUFFUyxjQUFjLENBQUVWLFlBQWEsQ0FBRSxDQUFDO01BQzVIO01BQ0ErRSxRQUFRLEdBQUcsQ0FDVCxJQUFJMUgsT0FBTyxDQUFFZ0gsWUFBWSxFQUFFOUIsU0FBUyxFQUFFLElBQUssQ0FBQyxFQUM1QyxJQUFJbEYsT0FBTyxDQUFFaUgsYUFBYSxFQUFFL0IsU0FBUyxFQUFFLElBQUssQ0FBQyxDQUM5QztJQUNILENBQUMsTUFDSTtNQUNId0MsUUFBUSxHQUFHLENBQ1QsSUFBSTFILE9BQU8sQ0FBRWdILFlBQVksQ0FBQ2hHLE1BQU0sQ0FBRTZGLFVBQVUsQ0FBQ2MsR0FBRyxDQUFFUixXQUFXLENBQUNsRyxHQUFHLEVBQUVrRyxXQUFXLENBQUN2RSxVQUFXLENBQUUsQ0FBQyxDQUN4RjVCLE1BQU0sQ0FBRWlHLGFBQWMsQ0FBQyxDQUN2QmpHLE1BQU0sQ0FBRTZGLFVBQVUsQ0FBQ2MsR0FBRyxDQUFFVCxZQUFZLENBQUNuRyxLQUFLLEVBQUVtRyxZQUFZLENBQUN2RSxZQUFZLENBQUN5RCxPQUFPLENBQUMsQ0FBRSxDQUFFLENBQUMsRUFDdEZsQixTQUFTLEVBQUUsSUFBSyxDQUFDLENBQ3BCO0lBQ0g7SUFFQSxJQUFJLENBQUM5RSxnQkFBZ0IsR0FBR3NILFFBQVE7SUFDaEMsSUFBSSxDQUFDckgsd0JBQXdCLEdBQUcsSUFBSTtJQUNwQyxJQUFJLENBQUNDLGNBQWMsR0FBR3VHLFVBQVUsQ0FBQ2pGLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7SUFFekMsT0FBTzhGLFFBQVE7RUFDakI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTRSxNQUFNQSxDQUFFQyxRQUFrQixFQUFFQyxjQUFzQixFQUFFL0YsZUFBdUIsRUFBRUMsWUFBb0IsRUFBYztJQUNwSDtJQUNBLE1BQU0rRixvQkFBb0IsR0FBR0EsQ0FBRUMsSUFBaUIsRUFBRUMsS0FBa0IsS0FBTTtNQUN4RSxNQUFNQyxRQUFRLEdBQUdGLElBQUksQ0FBRUEsSUFBSSxDQUFDckgsTUFBTSxHQUFHLENBQUMsQ0FBRSxDQUFDSyxNQUFNLENBQUVpSCxLQUFLLENBQUUsQ0FBQyxDQUFHLENBQUM7TUFDN0QsTUFBTUUsTUFBTSxHQUFHSCxJQUFJLENBQUM5RixLQUFLLENBQUUsQ0FBQyxFQUFFOEYsSUFBSSxDQUFDckgsTUFBTSxHQUFHLENBQUUsQ0FBQyxDQUFDSyxNQUFNLENBQUUsQ0FBRWtILFFBQVEsQ0FBRyxDQUFDLENBQUNsSCxNQUFNLENBQUVpSCxLQUFLLENBQUMvRixLQUFLLENBQUUsQ0FBRSxDQUFFLENBQUM7TUFDakdPLE1BQU0sSUFBSUEsTUFBTSxDQUFFMEYsTUFBTSxDQUFDeEgsTUFBTSxLQUFLcUgsSUFBSSxDQUFDckgsTUFBTSxHQUFHc0gsS0FBSyxDQUFDdEgsTUFBTSxHQUFHLENBQUUsQ0FBQztNQUNwRSxPQUFPd0gsTUFBTTtJQUNmLENBQUM7O0lBRUQ7SUFDQTtJQUNBLE1BQU1DLGFBQWEsR0FBR0EsQ0FBRUMsUUFBa0IsRUFBRUMsU0FBbUIsS0FBTTtNQUNuRSxJQUFLLENBQUNELFFBQVEsQ0FBQ0UsY0FBYyxJQUFJLENBQUNELFNBQVMsQ0FBQ0UsYUFBYSxFQUFHO1FBQzFELE9BQU8sS0FBSztNQUNkO01BQ0EsTUFBTUMsV0FBVyxHQUFHN0gsQ0FBQyxDQUFDZ0QsSUFBSSxDQUFFaEQsQ0FBQyxDQUFDZ0QsSUFBSSxDQUFFeUUsUUFBUSxDQUFDSyxhQUFjLENBQUUsQ0FBRTtNQUMvRCxNQUFNQyxZQUFZLEdBQUdMLFNBQVMsQ0FBQ0ksYUFBYSxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUMsQ0FBRTtNQUN0RCxPQUFPRCxXQUFXLENBQUN4SCxHQUFHLENBQUN5RSxRQUFRLENBQUVpRCxZQUFZLENBQUM1SCxLQUFNLENBQUMsR0FBRyxJQUFJO0lBQzlELENBQUM7O0lBRUQ7SUFDQSxNQUFNNkgsU0FBcUIsR0FBRyxFQUFFO0lBQ2hDLEtBQU0sSUFBSXZILENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBRyxJQUFJLENBQUNwQixRQUFRLENBQUNVLE1BQU0sRUFBRVUsQ0FBQyxFQUFFLEVBQUc7TUFDL0MsTUFBTVAsT0FBTyxHQUFHLElBQUksQ0FBQ2IsUUFBUSxDQUFFb0IsQ0FBQyxDQUFFO01BQ2xDLE1BQU13SCxRQUFRLEdBQUcvSCxPQUFPLENBQUNnSSxhQUFhLENBQUVqQixRQUFRLEVBQUVDLGNBQWMsRUFBRS9GLGVBQWUsRUFBRUMsWUFBYSxDQUFhO01BQzdHNEcsU0FBUyxDQUFDcEcsSUFBSSxDQUFFcUcsUUFBUyxDQUFDOztNQUUxQjtNQUNBZixjQUFjLElBQUllLFFBQVEsQ0FBQ0UsU0FBUztNQUVwQyxNQUFNQyxNQUFNLEdBQUcsQ0FBRSxDQUFDLENBQUUsQ0FBQ2hJLE1BQU0sQ0FBRTZILFFBQVEsQ0FBQ0csTUFBTyxDQUFDLENBQUNoSSxNQUFNLENBQUUsQ0FBRSxDQUFDLENBQUcsQ0FBQztNQUM5RCxNQUFNaUksZUFBZSxHQUFHSixRQUFRLENBQUNJLGVBQWU7O01BRWhEO01BQ0FKLFFBQVEsQ0FBQ0wsYUFBYSxHQUFHUyxlQUFlO01BQ3hDSixRQUFRLENBQUNOLGNBQWMsR0FBS1MsTUFBTSxDQUFDckksTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUtzSSxlQUFlLEdBQUcsQ0FBQ0EsZUFBZTs7TUFFMUY7TUFDQUosUUFBUSxDQUFDSCxhQUFhLEdBQUcsRUFBRTtNQUMzQixLQUFNLElBQUlRLENBQUMsR0FBS0QsZUFBZSxHQUFHLENBQUMsR0FBRyxDQUFHLEVBQUVDLENBQUMsR0FBR0YsTUFBTSxDQUFDckksTUFBTSxHQUFHLENBQUMsRUFBRXVJLENBQUMsSUFBSSxDQUFDLEVBQUc7UUFDekUsSUFBS0YsTUFBTSxDQUFFRSxDQUFDLENBQUUsS0FBS0YsTUFBTSxDQUFFRSxDQUFDLEdBQUcsQ0FBQyxDQUFFLEVBQUc7VUFDckNMLFFBQVEsQ0FBQ0gsYUFBYSxDQUFDbEcsSUFBSSxDQUFFLENBQUUxQixPQUFPLENBQUNvQixLQUFLLENBQUU4RyxNQUFNLENBQUVFLENBQUMsQ0FBRSxFQUFFRixNQUFNLENBQUVFLENBQUMsR0FBRyxDQUFDLENBQUcsQ0FBQyxDQUFHLENBQUM7UUFDbEY7TUFDRjtJQUNGOztJQUVBO0lBQ0EsS0FBTSxJQUFJN0gsQ0FBQyxHQUFHdUgsU0FBUyxDQUFDakksTUFBTSxHQUFHLENBQUMsRUFBRVUsQ0FBQyxJQUFJLENBQUMsRUFBRUEsQ0FBQyxFQUFFLEVBQUc7TUFDaEQsTUFBTWdILFFBQVEsR0FBR08sU0FBUyxDQUFFdkgsQ0FBQyxHQUFHLENBQUMsQ0FBRTtNQUNuQyxNQUFNaUgsU0FBUyxHQUFHTSxTQUFTLENBQUV2SCxDQUFDLENBQUU7TUFDaEMsSUFBSytHLGFBQWEsQ0FBRUMsUUFBUSxFQUFFQyxTQUFVLENBQUMsRUFBRztRQUMxQ00sU0FBUyxDQUFDTyxNQUFNLENBQUU5SCxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtVQUMxQnFILGFBQWEsRUFBRVgsb0JBQW9CLENBQUVNLFFBQVEsQ0FBQ0ssYUFBYSxFQUFFSixTQUFTLENBQUNJLGFBQWMsQ0FBQztVQUN0RkYsYUFBYSxFQUFFSCxRQUFRLENBQUNHLGFBQWE7VUFDckNELGNBQWMsRUFBRUQsU0FBUyxDQUFDQztRQUM1QixDQUFjLENBQUM7TUFDakI7SUFDRjs7SUFFQTtJQUNBLElBQUtLLFNBQVMsQ0FBQ2pJLE1BQU0sR0FBRyxDQUFDLElBQUl5SCxhQUFhLENBQUVRLFNBQVMsQ0FBRUEsU0FBUyxDQUFDakksTUFBTSxHQUFHLENBQUMsQ0FBRSxFQUFFaUksU0FBUyxDQUFFLENBQUMsQ0FBRyxDQUFDLEVBQUc7TUFDaEcsTUFBTVAsUUFBUSxHQUFHTyxTQUFTLENBQUNRLEdBQUcsQ0FBQyxDQUFFO01BQ2pDLE1BQU1kLFNBQVMsR0FBR00sU0FBUyxDQUFDUyxLQUFLLENBQUMsQ0FBRTtNQUNwQ1QsU0FBUyxDQUFDcEcsSUFBSSxDQUFFO1FBQ2RrRyxhQUFhLEVBQUVYLG9CQUFvQixDQUFFTSxRQUFRLENBQUNLLGFBQWEsRUFBRUosU0FBUyxDQUFDSSxhQUFjLENBQUM7UUFDdEZGLGFBQWEsRUFBRUgsUUFBUSxDQUFDRyxhQUFhO1FBQ3JDRCxjQUFjLEVBQUVELFNBQVMsQ0FBQ0M7TUFDNUIsQ0FBYyxDQUFDO0lBQ2pCOztJQUVBO0lBQ0EsSUFBSyxJQUFJLENBQUM3SCxNQUFNLElBQUlrSSxTQUFTLENBQUNqSSxNQUFNLEtBQUssQ0FBQyxJQUFJaUksU0FBUyxDQUFFLENBQUMsQ0FBRSxDQUFDRixhQUFhLENBQUMvSCxNQUFNLEtBQUssQ0FBQyxJQUFJaUksU0FBUyxDQUFFLENBQUMsQ0FBRSxDQUFDSixhQUFhLElBQUlJLFNBQVMsQ0FBRSxDQUFDLENBQUUsQ0FBQ0wsY0FBYyxFQUFHO01BQ3pKLE9BQU8sQ0FBRSxJQUFJdkksT0FBTyxDQUFFNEksU0FBUyxDQUFFLENBQUMsQ0FBRSxDQUFDRixhQUFhLENBQUUsQ0FBQyxDQUFFLEVBQUV4RCxTQUFTLEVBQUUsSUFBSyxDQUFDLENBQUU7SUFDOUU7O0lBRUE7SUFDQSxPQUFPdEUsQ0FBQyxDQUFDeUQsT0FBTyxDQUFFdUUsU0FBUyxDQUFDL0gsR0FBRyxDQUFFZ0ksUUFBUSxJQUFJQSxRQUFRLENBQUNILGFBQWMsQ0FBRSxDQUFDLENBQUM3SCxHQUFHLENBQUVaLFFBQVEsSUFBSSxJQUFJRCxPQUFPLENBQUVDLFFBQVMsQ0FBRSxDQUFDO0VBQ3BIOztFQUVBO0FBQ0Y7QUFDQTtFQUNTcUosU0FBU0EsQ0FBQSxFQUFzQjtJQUNwQyxPQUFPO01BQ0xDLElBQUksRUFBRSxTQUFTO01BQ2Z0SixRQUFRLEVBQUUsSUFBSSxDQUFDQSxRQUFRLENBQUNZLEdBQUcsQ0FBRUMsT0FBTyxJQUFJQSxPQUFPLENBQUN3SSxTQUFTLENBQUMsQ0FBRSxDQUFDO01BQzdEN0ksTUFBTSxFQUFFLElBQUksQ0FBQ0EsTUFBTSxDQUFDSSxHQUFHLENBQUUwQixLQUFLLEtBQU07UUFDbENtQyxDQUFDLEVBQUVuQyxLQUFLLENBQUNtQyxDQUFDO1FBQ1ZDLENBQUMsRUFBRXBDLEtBQUssQ0FBQ29DO01BQ1gsQ0FBQyxDQUFHLENBQUM7TUFDTGpFLE1BQU0sRUFBRSxJQUFJLENBQUNBO0lBQ2YsQ0FBQztFQUNIOztFQUVBO0FBQ0Y7QUFDQTtFQUNFLE9BQWM4SSxXQUFXQSxDQUFFQyxHQUFzQixFQUFZO0lBQzNEaEgsTUFBTSxJQUFJQSxNQUFNLENBQUVnSCxHQUFHLENBQUNGLElBQUksS0FBSyxTQUFVLENBQUM7SUFFMUMsT0FBTyxJQUFJdkosT0FBTyxDQUFFeUosR0FBRyxDQUFDeEosUUFBUSxDQUFDWSxHQUFHLENBQUVkLE9BQU8sQ0FBQ3lKLFdBQVksQ0FBQyxFQUFFQyxHQUFHLENBQUNoSixNQUFNLENBQUNJLEdBQUcsQ0FBRTZJLEVBQUUsSUFBSSxJQUFJaEssT0FBTyxDQUFFZ0ssRUFBRSxDQUFDaEYsQ0FBQyxFQUFFZ0YsRUFBRSxDQUFDL0UsQ0FBRSxDQUFFLENBQUMsRUFBRThFLEdBQUcsQ0FBQy9JLE1BQU8sQ0FBQztFQUM5SDtBQUNGO0FBRUFkLElBQUksQ0FBQytKLFFBQVEsQ0FBRSxTQUFTLEVBQUUzSixPQUFRLENBQUM7QUFFbkMsZUFBZUEsT0FBTyIsImlnbm9yZUxpc3QiOltdfQ==