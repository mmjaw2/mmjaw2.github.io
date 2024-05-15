// Copyright 2019-2023, University of Colorado Boulder

/**
 * OriginManipulator shows the origin on the graph, and can be dragged to reposition the origin.
 *
 * @author Martin Veillette
 */

import Property from '../../../../axon/js/Property.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import Vector2Property from '../../../../dot/js/Vector2Property.js';
import { Shape } from '../../../../kite/js/imports.js';
import merge from '../../../../phet-core/js/merge.js';
import ShadedSphereNode from '../../../../scenery-phet/js/ShadedSphereNode.js';
import { Color, DragListener } from '../../../../scenery/js/imports.js';
import vectorAddition from '../../vectorAddition.js';
import VectorAdditionColors from '../VectorAdditionColors.js';

// constants

// the closest the user can drag the origin to the edge of the graph, in model units
const ORIGIN_DRAG_MARGIN = 5;

// origin
const ORIGIN_COLOR = Color.toColor(VectorAdditionColors.ORIGIN_COLOR);
const ORIGIN_DIAMETER = 0.8; // in model coordinates
const ORIGIN_OPTIONS = {
  cursor: 'move',
  fill: ORIGIN_COLOR.withAlpha(0.15),
  mainColor: ORIGIN_COLOR,
  highlightColor: Color.WHITE,
  shadowColor: ORIGIN_COLOR.darkerColor(),
  lineWidth: 1,
  stroke: ORIGIN_COLOR.darkerColor(),
  isDisposable: false
};
export default class OriginManipulator extends ShadedSphereNode {
  constructor(graph) {
    // convenience variable
    const modelViewTransform = graph.modelViewTransformProperty.value;

    // Origin, in view coordinates
    const origin = modelViewTransform.modelToViewPosition(Vector2.ZERO);

    // Diameter, view coordinates
    const diameter = modelViewTransform.modelToViewDeltaX(ORIGIN_DIAMETER);
    super(diameter, merge({
      center: origin
    }, ORIGIN_OPTIONS));
    this.touchArea = Shape.circle(0, 0, diameter);

    // Create a dragBounds to constrain the drag
    const restrictedGraphViewBounds = modelViewTransform.modelToViewBounds(graph.graphModelBounds.eroded(ORIGIN_DRAG_MARGIN));

    // Create a Property of to track the view's origin in view coordinates
    const originPositionProperty = new Vector2Property(origin);

    // Add a drag listener. removeInputListener is unnecessary, since this class owns the listener.
    this.addInputListener(new DragListener({
      positionProperty: originPositionProperty,
      translateNode: false,
      dragBoundsProperty: new Property(restrictedGraphViewBounds),
      pressCursor: ORIGIN_OPTIONS.cursor
    }));

    // Update the origin position.
    // unlink is unnecessary, exists for the lifetime of the simulation.
    originPositionProperty.lazyLink(originPosition => {
      // Tell the model to update the origin
      graph.moveOriginToPoint(graph.modelViewTransformProperty.value.viewToModelPosition(originPosition));
    });

    // Observe when the model view transform changes to update the position of the circle.
    // unlink is unnecessary, exists for the lifetime of the sim.
    graph.modelViewTransformProperty.link(modelViewTransform => {
      this.center = modelViewTransform.modelToViewPosition(Vector2.ZERO);
    });
  }
}
vectorAddition.register('OriginManipulator', OriginManipulator);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQcm9wZXJ0eSIsIlZlY3RvcjIiLCJWZWN0b3IyUHJvcGVydHkiLCJTaGFwZSIsIm1lcmdlIiwiU2hhZGVkU3BoZXJlTm9kZSIsIkNvbG9yIiwiRHJhZ0xpc3RlbmVyIiwidmVjdG9yQWRkaXRpb24iLCJWZWN0b3JBZGRpdGlvbkNvbG9ycyIsIk9SSUdJTl9EUkFHX01BUkdJTiIsIk9SSUdJTl9DT0xPUiIsInRvQ29sb3IiLCJPUklHSU5fRElBTUVURVIiLCJPUklHSU5fT1BUSU9OUyIsImN1cnNvciIsImZpbGwiLCJ3aXRoQWxwaGEiLCJtYWluQ29sb3IiLCJoaWdobGlnaHRDb2xvciIsIldISVRFIiwic2hhZG93Q29sb3IiLCJkYXJrZXJDb2xvciIsImxpbmVXaWR0aCIsInN0cm9rZSIsImlzRGlzcG9zYWJsZSIsIk9yaWdpbk1hbmlwdWxhdG9yIiwiY29uc3RydWN0b3IiLCJncmFwaCIsIm1vZGVsVmlld1RyYW5zZm9ybSIsIm1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5IiwidmFsdWUiLCJvcmlnaW4iLCJtb2RlbFRvVmlld1Bvc2l0aW9uIiwiWkVSTyIsImRpYW1ldGVyIiwibW9kZWxUb1ZpZXdEZWx0YVgiLCJjZW50ZXIiLCJ0b3VjaEFyZWEiLCJjaXJjbGUiLCJyZXN0cmljdGVkR3JhcGhWaWV3Qm91bmRzIiwibW9kZWxUb1ZpZXdCb3VuZHMiLCJncmFwaE1vZGVsQm91bmRzIiwiZXJvZGVkIiwib3JpZ2luUG9zaXRpb25Qcm9wZXJ0eSIsImFkZElucHV0TGlzdGVuZXIiLCJwb3NpdGlvblByb3BlcnR5IiwidHJhbnNsYXRlTm9kZSIsImRyYWdCb3VuZHNQcm9wZXJ0eSIsInByZXNzQ3Vyc29yIiwibGF6eUxpbmsiLCJvcmlnaW5Qb3NpdGlvbiIsIm1vdmVPcmlnaW5Ub1BvaW50Iiwidmlld1RvTW9kZWxQb3NpdGlvbiIsImxpbmsiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIk9yaWdpbk1hbmlwdWxhdG9yLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIE9yaWdpbk1hbmlwdWxhdG9yIHNob3dzIHRoZSBvcmlnaW4gb24gdGhlIGdyYXBoLCBhbmQgY2FuIGJlIGRyYWdnZWQgdG8gcmVwb3NpdGlvbiB0aGUgb3JpZ2luLlxyXG4gKlxyXG4gKiBAYXV0aG9yIE1hcnRpbiBWZWlsbGV0dGVcclxuICovXHJcblxyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IFZlY3RvcjJQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvVmVjdG9yMlByb3BlcnR5LmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi8uLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IFNoYWRlZFNwaGVyZU5vZGUgZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS1waGV0L2pzL1NoYWRlZFNwaGVyZU5vZGUuanMnO1xyXG5pbXBvcnQgeyBDb2xvciwgRHJhZ0xpc3RlbmVyIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHZlY3RvckFkZGl0aW9uIGZyb20gJy4uLy4uL3ZlY3RvckFkZGl0aW9uLmpzJztcclxuaW1wb3J0IEdyYXBoIGZyb20gJy4uL21vZGVsL0dyYXBoLmpzJztcclxuaW1wb3J0IFZlY3RvckFkZGl0aW9uQ29sb3JzIGZyb20gJy4uL1ZlY3RvckFkZGl0aW9uQ29sb3JzLmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5cclxuLy8gdGhlIGNsb3Nlc3QgdGhlIHVzZXIgY2FuIGRyYWcgdGhlIG9yaWdpbiB0byB0aGUgZWRnZSBvZiB0aGUgZ3JhcGgsIGluIG1vZGVsIHVuaXRzXHJcbmNvbnN0IE9SSUdJTl9EUkFHX01BUkdJTiA9IDU7XHJcblxyXG4vLyBvcmlnaW5cclxuY29uc3QgT1JJR0lOX0NPTE9SID0gQ29sb3IudG9Db2xvciggVmVjdG9yQWRkaXRpb25Db2xvcnMuT1JJR0lOX0NPTE9SICk7XHJcbmNvbnN0IE9SSUdJTl9ESUFNRVRFUiA9IDAuODsgLy8gaW4gbW9kZWwgY29vcmRpbmF0ZXNcclxuY29uc3QgT1JJR0lOX09QVElPTlMgPSB7XHJcbiAgY3Vyc29yOiAnbW92ZScsXHJcbiAgZmlsbDogT1JJR0lOX0NPTE9SLndpdGhBbHBoYSggMC4xNSApLFxyXG4gIG1haW5Db2xvcjogT1JJR0lOX0NPTE9SLFxyXG4gIGhpZ2hsaWdodENvbG9yOiBDb2xvci5XSElURSxcclxuICBzaGFkb3dDb2xvcjogT1JJR0lOX0NPTE9SLmRhcmtlckNvbG9yKCksXHJcbiAgbGluZVdpZHRoOiAxLFxyXG4gIHN0cm9rZTogT1JJR0lOX0NPTE9SLmRhcmtlckNvbG9yKCksXHJcbiAgaXNEaXNwb3NhYmxlOiBmYWxzZVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT3JpZ2luTWFuaXB1bGF0b3IgZXh0ZW5kcyBTaGFkZWRTcGhlcmVOb2RlIHtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBncmFwaDogR3JhcGggKSB7XHJcblxyXG4gICAgLy8gY29udmVuaWVuY2UgdmFyaWFibGVcclxuICAgIGNvbnN0IG1vZGVsVmlld1RyYW5zZm9ybSA9IGdyYXBoLm1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5LnZhbHVlO1xyXG5cclxuICAgIC8vIE9yaWdpbiwgaW4gdmlldyBjb29yZGluYXRlc1xyXG4gICAgY29uc3Qgb3JpZ2luID0gbW9kZWxWaWV3VHJhbnNmb3JtLm1vZGVsVG9WaWV3UG9zaXRpb24oIFZlY3RvcjIuWkVSTyApO1xyXG5cclxuICAgIC8vIERpYW1ldGVyLCB2aWV3IGNvb3JkaW5hdGVzXHJcbiAgICBjb25zdCBkaWFtZXRlciA9IG1vZGVsVmlld1RyYW5zZm9ybS5tb2RlbFRvVmlld0RlbHRhWCggT1JJR0lOX0RJQU1FVEVSICk7XHJcblxyXG4gICAgc3VwZXIoIGRpYW1ldGVyLCBtZXJnZSggeyBjZW50ZXI6IG9yaWdpbiB9LCBPUklHSU5fT1BUSU9OUyApICk7XHJcblxyXG4gICAgdGhpcy50b3VjaEFyZWEgPSBTaGFwZS5jaXJjbGUoIDAsIDAsIGRpYW1ldGVyICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGEgZHJhZ0JvdW5kcyB0byBjb25zdHJhaW4gdGhlIGRyYWdcclxuICAgIGNvbnN0IHJlc3RyaWN0ZWRHcmFwaFZpZXdCb3VuZHMgPSBtb2RlbFZpZXdUcmFuc2Zvcm0ubW9kZWxUb1ZpZXdCb3VuZHMoXHJcbiAgICAgIGdyYXBoLmdyYXBoTW9kZWxCb3VuZHMuZXJvZGVkKCBPUklHSU5fRFJBR19NQVJHSU4gKVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgYSBQcm9wZXJ0eSBvZiB0byB0cmFjayB0aGUgdmlldydzIG9yaWdpbiBpbiB2aWV3IGNvb3JkaW5hdGVzXHJcbiAgICBjb25zdCBvcmlnaW5Qb3NpdGlvblByb3BlcnR5ID0gbmV3IFZlY3RvcjJQcm9wZXJ0eSggb3JpZ2luICk7XHJcblxyXG4gICAgLy8gQWRkIGEgZHJhZyBsaXN0ZW5lci4gcmVtb3ZlSW5wdXRMaXN0ZW5lciBpcyB1bm5lY2Vzc2FyeSwgc2luY2UgdGhpcyBjbGFzcyBvd25zIHRoZSBsaXN0ZW5lci5cclxuICAgIHRoaXMuYWRkSW5wdXRMaXN0ZW5lciggbmV3IERyYWdMaXN0ZW5lcigge1xyXG4gICAgICBwb3NpdGlvblByb3BlcnR5OiBvcmlnaW5Qb3NpdGlvblByb3BlcnR5LFxyXG4gICAgICB0cmFuc2xhdGVOb2RlOiBmYWxzZSxcclxuICAgICAgZHJhZ0JvdW5kc1Byb3BlcnR5OiBuZXcgUHJvcGVydHkoIHJlc3RyaWN0ZWRHcmFwaFZpZXdCb3VuZHMgKSxcclxuICAgICAgcHJlc3NDdXJzb3I6IE9SSUdJTl9PUFRJT05TLmN1cnNvclxyXG4gICAgfSApICk7XHJcblxyXG4gICAgLy8gVXBkYXRlIHRoZSBvcmlnaW4gcG9zaXRpb24uXHJcbiAgICAvLyB1bmxpbmsgaXMgdW5uZWNlc3NhcnksIGV4aXN0cyBmb3IgdGhlIGxpZmV0aW1lIG9mIHRoZSBzaW11bGF0aW9uLlxyXG4gICAgb3JpZ2luUG9zaXRpb25Qcm9wZXJ0eS5sYXp5TGluayggb3JpZ2luUG9zaXRpb24gPT4ge1xyXG4gICAgICAvLyBUZWxsIHRoZSBtb2RlbCB0byB1cGRhdGUgdGhlIG9yaWdpblxyXG4gICAgICBncmFwaC5tb3ZlT3JpZ2luVG9Qb2ludCggZ3JhcGgubW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkudmFsdWUudmlld1RvTW9kZWxQb3NpdGlvbiggb3JpZ2luUG9zaXRpb24gKSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIE9ic2VydmUgd2hlbiB0aGUgbW9kZWwgdmlldyB0cmFuc2Zvcm0gY2hhbmdlcyB0byB1cGRhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZSBjaXJjbGUuXHJcbiAgICAvLyB1bmxpbmsgaXMgdW5uZWNlc3NhcnksIGV4aXN0cyBmb3IgdGhlIGxpZmV0aW1lIG9mIHRoZSBzaW0uXHJcbiAgICBncmFwaC5tb2RlbFZpZXdUcmFuc2Zvcm1Qcm9wZXJ0eS5saW5rKCBtb2RlbFZpZXdUcmFuc2Zvcm0gPT4ge1xyXG4gICAgICB0aGlzLmNlbnRlciA9IG1vZGVsVmlld1RyYW5zZm9ybS5tb2RlbFRvVmlld1Bvc2l0aW9uKCBWZWN0b3IyLlpFUk8gKTtcclxuICAgIH0gKTtcclxuICB9XHJcbn1cclxuXHJcbnZlY3RvckFkZGl0aW9uLnJlZ2lzdGVyKCAnT3JpZ2luTWFuaXB1bGF0b3InLCBPcmlnaW5NYW5pcHVsYXRvciApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxRQUFRLE1BQU0saUNBQWlD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