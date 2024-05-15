// Copyright 2023-2024, University of Colorado Boulder

/**
 * The `createGatedVisibleProperty` function abstracts the process of creating a "gated" visibility Property
 * designed for PhET-iO integration. This method comes in handy when an object's visibility is already controlled
 * within the simulation, but there is a need to grant additional visibility control to an external entity,
 * such as a studio or a PhET-iO client.
 *
 * @author Marla Schulz (PhET Interactive Simulations)
 *
 */

import DerivedProperty from '../../../axon/js/DerivedProperty.js';
import BooleanProperty from '../../../axon/js/BooleanProperty.js';
import BooleanIO from '../../../tandem/js/types/BooleanIO.js';
import { combineOptions } from '../../../phet-core/js/optionize.js';
import { scenery } from '../imports.js';
const createGatedVisibleProperty = (visibleProperty, tandem, selfVisiblePropertyOptions) => {
  return DerivedProperty.and([visibleProperty, new BooleanProperty(true, combineOptions({
    tandem: tandem.createTandem('selfVisibleProperty'),
    phetioFeatured: true
  }, selfVisiblePropertyOptions))], {
    tandem: tandem.createTandem('visibleProperty'),
    phetioValueType: BooleanIO
  });
};
export default createGatedVisibleProperty;
scenery.register('createGatedVisibleProperty', createGatedVisibleProperty);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEZXJpdmVkUHJvcGVydHkiLCJCb29sZWFuUHJvcGVydHkiLCJCb29sZWFuSU8iLCJjb21iaW5lT3B0aW9ucyIsInNjZW5lcnkiLCJjcmVhdGVHYXRlZFZpc2libGVQcm9wZXJ0eSIsInZpc2libGVQcm9wZXJ0eSIsInRhbmRlbSIsInNlbGZWaXNpYmxlUHJvcGVydHlPcHRpb25zIiwiYW5kIiwiY3JlYXRlVGFuZGVtIiwicGhldGlvRmVhdHVyZWQiLCJwaGV0aW9WYWx1ZVR5cGUiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbImNyZWF0ZUdhdGVkVmlzaWJsZVByb3BlcnR5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRoZSBgY3JlYXRlR2F0ZWRWaXNpYmxlUHJvcGVydHlgIGZ1bmN0aW9uIGFic3RyYWN0cyB0aGUgcHJvY2VzcyBvZiBjcmVhdGluZyBhIFwiZ2F0ZWRcIiB2aXNpYmlsaXR5IFByb3BlcnR5XHJcbiAqIGRlc2lnbmVkIGZvciBQaEVULWlPIGludGVncmF0aW9uLiBUaGlzIG1ldGhvZCBjb21lcyBpbiBoYW5keSB3aGVuIGFuIG9iamVjdCdzIHZpc2liaWxpdHkgaXMgYWxyZWFkeSBjb250cm9sbGVkXHJcbiAqIHdpdGhpbiB0aGUgc2ltdWxhdGlvbiwgYnV0IHRoZXJlIGlzIGEgbmVlZCB0byBncmFudCBhZGRpdGlvbmFsIHZpc2liaWxpdHkgY29udHJvbCB0byBhbiBleHRlcm5hbCBlbnRpdHksXHJcbiAqIHN1Y2ggYXMgYSBzdHVkaW8gb3IgYSBQaEVULWlPIGNsaWVudC5cclxuICpcclxuICogQGF1dGhvciBNYXJsYSBTY2h1bHogKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqXHJcbiAqL1xyXG5cclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IERlcml2ZWRQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL0Rlcml2ZWRQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBCb29sZWFuUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9Cb29sZWFuUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgQm9vbGVhbklPIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy90eXBlcy9Cb29sZWFuSU8uanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IFBoZXRpb09iamVjdE9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvUGhldGlvT2JqZWN0LmpzJztcclxuaW1wb3J0IHsgY29tYmluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IHsgc2NlbmVyeSB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxuY29uc3QgY3JlYXRlR2F0ZWRWaXNpYmxlUHJvcGVydHkgPSAoIHZpc2libGVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4sIHRhbmRlbTogVGFuZGVtLCBzZWxmVmlzaWJsZVByb3BlcnR5T3B0aW9ucz86IFBoZXRpb09iamVjdE9wdGlvbnMgKTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4gPT4ge1xyXG4gIHJldHVybiBEZXJpdmVkUHJvcGVydHkuYW5kKCBbIHZpc2libGVQcm9wZXJ0eSwgbmV3IEJvb2xlYW5Qcm9wZXJ0eSggdHJ1ZSwgY29tYmluZU9wdGlvbnM8UGhldGlvT2JqZWN0T3B0aW9ucz4oIHtcclxuICAgIHRhbmRlbTogdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3NlbGZWaXNpYmxlUHJvcGVydHknICksXHJcbiAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZVxyXG4gIH0sIHNlbGZWaXNpYmxlUHJvcGVydHlPcHRpb25zICkgKSBdLCB7XHJcbiAgICB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oICd2aXNpYmxlUHJvcGVydHknICksXHJcbiAgICBwaGV0aW9WYWx1ZVR5cGU6IEJvb2xlYW5JT1xyXG4gIH0gKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZUdhdGVkVmlzaWJsZVByb3BlcnR5O1xyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ2NyZWF0ZUdhdGVkVmlzaWJsZVByb3BlcnR5JywgY3JlYXRlR2F0ZWRWaXNpYmxlUHJvcGVydHkgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxPQUFPQSxlQUFlLE1BQU0scUNBQXFDO0FBQ2pFLE9BQU9DLGVBQWUsTUFBTSxxQ0FBcUM7QUFDakUsT0FBT0MsU0FBUyxNQUFNLHVDQUF1QztBQUc3RCxTQUFTQyxjQUFjLFFBQVEsb0NBQW9DO0FBQ25FLFNBQVNDLE9BQU8sUUFBUSxlQUFlO0FBRXZDLE1BQU1DLDBCQUEwQixHQUFHQSxDQUFFQyxlQUEyQyxFQUFFQyxNQUFjLEVBQUVDLDBCQUFnRCxLQUFrQztFQUNsTCxPQUFPUixlQUFlLENBQUNTLEdBQUcsQ0FBRSxDQUFFSCxlQUFlLEVBQUUsSUFBSUwsZUFBZSxDQUFFLElBQUksRUFBRUUsY0FBYyxDQUF1QjtJQUM3R0ksTUFBTSxFQUFFQSxNQUFNLENBQUNHLFlBQVksQ0FBRSxxQkFBc0IsQ0FBQztJQUNwREMsY0FBYyxFQUFFO0VBQ2xCLENBQUMsRUFBRUgsMEJBQTJCLENBQUUsQ0FBQyxDQUFFLEVBQUU7SUFDbkNELE1BQU0sRUFBRUEsTUFBTSxDQUFDRyxZQUFZLENBQUUsaUJBQWtCLENBQUM7SUFDaERFLGVBQWUsRUFBRVY7RUFDbkIsQ0FBRSxDQUFDO0FBQ0wsQ0FBQztBQUVELGVBQWVHLDBCQUEwQjtBQUV6Q0QsT0FBTyxDQUFDUyxRQUFRLENBQUUsNEJBQTRCLEVBQUVSLDBCQUEyQixDQUFDIiwiaWdub3JlTGlzdCI6W119