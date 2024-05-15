// Copyright 2022-2024, University of Colorado Boulder

/**
 * Demo for WireNode - two circles connected by a wire.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import { Circle, DragListener, Node } from '../../../../scenery/js/imports.js';
import WireNode from '../../WireNode.js';
import Vector2Property from '../../../../dot/js/Vector2Property.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
export default function demoWireNode(layoutBounds) {
  const greenCircle = new Circle(20, {
    fill: 'green',
    cursor: 'pointer'
  });
  greenCircle.addInputListener(new DragListener({
    translateNode: true
  }));
  const redCircle = new Circle(20, {
    fill: 'red',
    cursor: 'pointer',
    center: greenCircle.center.plusXY(200, 200)
  });
  redCircle.addInputListener(new DragListener({
    translateNode: true
  }));

  // Distance the wires stick out from the objects
  const NORMAL_DISTANCE = 100;

  // Add the wire behind the probe.
  const wireNode = new WireNode(
  // Connect to the greenCircle at the center bottom
  new DerivedProperty([greenCircle.boundsProperty], bounds => bounds.centerBottom), new Vector2Property(new Vector2(0, NORMAL_DISTANCE)),
  // Connect to node2 at the left center
  new DerivedProperty([redCircle.boundsProperty], bounds => bounds.leftCenter), new Vector2Property(new Vector2(-NORMAL_DISTANCE, 0)), {
    lineWidth: 3
  });
  return new Node({
    children: [greenCircle, redCircle, wireNode],
    // wireNode on top, so we can see it fully
    center: layoutBounds.center
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDaXJjbGUiLCJEcmFnTGlzdGVuZXIiLCJOb2RlIiwiV2lyZU5vZGUiLCJWZWN0b3IyUHJvcGVydHkiLCJWZWN0b3IyIiwiRGVyaXZlZFByb3BlcnR5IiwiZGVtb1dpcmVOb2RlIiwibGF5b3V0Qm91bmRzIiwiZ3JlZW5DaXJjbGUiLCJmaWxsIiwiY3Vyc29yIiwiYWRkSW5wdXRMaXN0ZW5lciIsInRyYW5zbGF0ZU5vZGUiLCJyZWRDaXJjbGUiLCJjZW50ZXIiLCJwbHVzWFkiLCJOT1JNQUxfRElTVEFOQ0UiLCJ3aXJlTm9kZSIsImJvdW5kc1Byb3BlcnR5IiwiYm91bmRzIiwiY2VudGVyQm90dG9tIiwibGVmdENlbnRlciIsImxpbmVXaWR0aCIsImNoaWxkcmVuIl0sInNvdXJjZXMiOlsiZGVtb1dpcmVOb2RlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIERlbW8gZm9yIFdpcmVOb2RlIC0gdHdvIGNpcmNsZXMgY29ubmVjdGVkIGJ5IGEgd2lyZS5cclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgeyBDaXJjbGUsIERyYWdMaXN0ZW5lciwgTm9kZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IFdpcmVOb2RlIGZyb20gJy4uLy4uL1dpcmVOb2RlLmpzJztcclxuaW1wb3J0IFZlY3RvcjJQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvVmVjdG9yMlByb3BlcnR5LmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgRGVyaXZlZFByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvRGVyaXZlZFByb3BlcnR5LmpzJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRlbW9XaXJlTm9kZSggbGF5b3V0Qm91bmRzOiBCb3VuZHMyICk6IE5vZGUge1xyXG5cclxuICBjb25zdCBncmVlbkNpcmNsZSA9IG5ldyBDaXJjbGUoIDIwLCB7XHJcbiAgICBmaWxsOiAnZ3JlZW4nLFxyXG4gICAgY3Vyc29yOiAncG9pbnRlcidcclxuICB9ICk7XHJcbiAgZ3JlZW5DaXJjbGUuYWRkSW5wdXRMaXN0ZW5lciggbmV3IERyYWdMaXN0ZW5lciggeyB0cmFuc2xhdGVOb2RlOiB0cnVlIH0gKSApO1xyXG5cclxuICBjb25zdCByZWRDaXJjbGUgPSBuZXcgQ2lyY2xlKCAyMCwge1xyXG4gICAgZmlsbDogJ3JlZCcsXHJcbiAgICBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgIGNlbnRlcjogZ3JlZW5DaXJjbGUuY2VudGVyLnBsdXNYWSggMjAwLCAyMDAgKVxyXG4gIH0gKTtcclxuICByZWRDaXJjbGUuYWRkSW5wdXRMaXN0ZW5lciggbmV3IERyYWdMaXN0ZW5lciggeyB0cmFuc2xhdGVOb2RlOiB0cnVlIH0gKSApO1xyXG5cclxuICAvLyBEaXN0YW5jZSB0aGUgd2lyZXMgc3RpY2sgb3V0IGZyb20gdGhlIG9iamVjdHNcclxuICBjb25zdCBOT1JNQUxfRElTVEFOQ0UgPSAxMDA7XHJcblxyXG4gIC8vIEFkZCB0aGUgd2lyZSBiZWhpbmQgdGhlIHByb2JlLlxyXG4gIGNvbnN0IHdpcmVOb2RlID0gbmV3IFdpcmVOb2RlKFxyXG4gICAgLy8gQ29ubmVjdCB0byB0aGUgZ3JlZW5DaXJjbGUgYXQgdGhlIGNlbnRlciBib3R0b21cclxuICAgIG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgZ3JlZW5DaXJjbGUuYm91bmRzUHJvcGVydHkgXSwgYm91bmRzID0+IGJvdW5kcy5jZW50ZXJCb3R0b20gKSxcclxuICAgIG5ldyBWZWN0b3IyUHJvcGVydHkoIG5ldyBWZWN0b3IyKCAwLCBOT1JNQUxfRElTVEFOQ0UgKSApLFxyXG5cclxuICAgIC8vIENvbm5lY3QgdG8gbm9kZTIgYXQgdGhlIGxlZnQgY2VudGVyXHJcbiAgICBuZXcgRGVyaXZlZFByb3BlcnR5KCBbIHJlZENpcmNsZS5ib3VuZHNQcm9wZXJ0eSBdLCBib3VuZHMgPT4gYm91bmRzLmxlZnRDZW50ZXIgKSxcclxuICAgIG5ldyBWZWN0b3IyUHJvcGVydHkoIG5ldyBWZWN0b3IyKCAtTk9STUFMX0RJU1RBTkNFLCAwICkgKSwge1xyXG4gICAgICBsaW5lV2lkdGg6IDNcclxuICAgIH1cclxuICApO1xyXG5cclxuICByZXR1cm4gbmV3IE5vZGUoIHtcclxuICAgIGNoaWxkcmVuOiBbIGdyZWVuQ2lyY2xlLCByZWRDaXJjbGUsIHdpcmVOb2RlIF0sIC8vIHdpcmVOb2RlIG9uIHRvcCwgc28gd2UgY2FuIHNlZSBpdCBmdWxseVxyXG4gICAgY2VudGVyOiBsYXlvdXRCb3VuZHMuY2VudGVyXHJcbiAgfSApO1xyXG59Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQVNBLE1BQU0sRUFBRUMsWUFBWSxFQUFFQyxJQUFJLFFBQVEsbUNBQW1DO0FBRTlFLE9BQU9DLFFBQVEsTUFBTSxtQkFBbUI7QUFDeEMsT0FBT0MsZUFBZSxNQUFNLHVDQUF1QztBQUNuRSxPQUFPQyxPQUFPLE1BQU0sK0JBQStCO0FBQ25ELE9BQU9DLGVBQWUsTUFBTSx3Q0FBd0M7QUFFcEUsZUFBZSxTQUFTQyxZQUFZQSxDQUFFQyxZQUFxQixFQUFTO0VBRWxFLE1BQU1DLFdBQVcsR0FBRyxJQUFJVCxNQUFNLENBQUUsRUFBRSxFQUFFO0lBQ2xDVSxJQUFJLEVBQUUsT0FBTztJQUNiQyxNQUFNLEVBQUU7RUFDVixDQUFFLENBQUM7RUFDSEYsV0FBVyxDQUFDRyxnQkFBZ0IsQ0FBRSxJQUFJWCxZQUFZLENBQUU7SUFBRVksYUFBYSxFQUFFO0VBQUssQ0FBRSxDQUFFLENBQUM7RUFFM0UsTUFBTUMsU0FBUyxHQUFHLElBQUlkLE1BQU0sQ0FBRSxFQUFFLEVBQUU7SUFDaENVLElBQUksRUFBRSxLQUFLO0lBQ1hDLE1BQU0sRUFBRSxTQUFTO0lBQ2pCSSxNQUFNLEVBQUVOLFdBQVcsQ0FBQ00sTUFBTSxDQUFDQyxNQUFNLENBQUUsR0FBRyxFQUFFLEdBQUk7RUFDOUMsQ0FBRSxDQUFDO0VBQ0hGLFNBQVMsQ0FBQ0YsZ0JBQWdCLENBQUUsSUFBSVgsWUFBWSxDQUFFO0lBQUVZLGFBQWEsRUFBRTtFQUFLLENBQUUsQ0FBRSxDQUFDOztFQUV6RTtFQUNBLE1BQU1JLGVBQWUsR0FBRyxHQUFHOztFQUUzQjtFQUNBLE1BQU1DLFFBQVEsR0FBRyxJQUFJZixRQUFRO0VBQzNCO0VBQ0EsSUFBSUcsZUFBZSxDQUFFLENBQUVHLFdBQVcsQ0FBQ1UsY0FBYyxDQUFFLEVBQUVDLE1BQU0sSUFBSUEsTUFBTSxDQUFDQyxZQUFhLENBQUMsRUFDcEYsSUFBSWpCLGVBQWUsQ0FBRSxJQUFJQyxPQUFPLENBQUUsQ0FBQyxFQUFFWSxlQUFnQixDQUFFLENBQUM7RUFFeEQ7RUFDQSxJQUFJWCxlQUFlLENBQUUsQ0FBRVEsU0FBUyxDQUFDSyxjQUFjLENBQUUsRUFBRUMsTUFBTSxJQUFJQSxNQUFNLENBQUNFLFVBQVcsQ0FBQyxFQUNoRixJQUFJbEIsZUFBZSxDQUFFLElBQUlDLE9BQU8sQ0FBRSxDQUFDWSxlQUFlLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRTtJQUN6RE0sU0FBUyxFQUFFO0VBQ2IsQ0FDRixDQUFDO0VBRUQsT0FBTyxJQUFJckIsSUFBSSxDQUFFO0lBQ2ZzQixRQUFRLEVBQUUsQ0FBRWYsV0FBVyxFQUFFSyxTQUFTLEVBQUVJLFFBQVEsQ0FBRTtJQUFFO0lBQ2hESCxNQUFNLEVBQUVQLFlBQVksQ0FBQ087RUFDdkIsQ0FBRSxDQUFDO0FBQ0wiLCJpZ25vcmVMaXN0IjpbXX0=