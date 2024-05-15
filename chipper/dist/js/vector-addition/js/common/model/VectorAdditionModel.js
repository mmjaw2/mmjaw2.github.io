// Copyright 2019-2023, University of Colorado Boulder

/**
 * VectorAdditionModel is the base class for the top-level model of every screen.
 *
 * @author Martin Veillette
 */

import EnumerationProperty from '../../../../axon/js/EnumerationProperty.js';
import vectorAddition from '../../vectorAddition.js';
import ComponentVectorStyles from './ComponentVectorStyles.js';
import Disposable from '../../../../axon/js/Disposable.js';
export default class VectorAdditionModel {
  // the representation (style) used to display component vectors

  constructor(tandem) {
    this.componentStyleProperty = new EnumerationProperty(ComponentVectorStyles.INVISIBLE);
  }
  reset() {
    this.componentStyleProperty.reset();
  }
  dispose() {
    Disposable.assertNotDisposable();
  }
}
vectorAddition.register('VectorAdditionModel', VectorAdditionModel);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFbnVtZXJhdGlvblByb3BlcnR5IiwidmVjdG9yQWRkaXRpb24iLCJDb21wb25lbnRWZWN0b3JTdHlsZXMiLCJEaXNwb3NhYmxlIiwiVmVjdG9yQWRkaXRpb25Nb2RlbCIsImNvbnN0cnVjdG9yIiwidGFuZGVtIiwiY29tcG9uZW50U3R5bGVQcm9wZXJ0eSIsIklOVklTSUJMRSIsInJlc2V0IiwiZGlzcG9zZSIsImFzc2VydE5vdERpc3Bvc2FibGUiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlZlY3RvckFkZGl0aW9uTW9kZWwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVmVjdG9yQWRkaXRpb25Nb2RlbCBpcyB0aGUgYmFzZSBjbGFzcyBmb3IgdGhlIHRvcC1sZXZlbCBtb2RlbCBvZiBldmVyeSBzY3JlZW4uXHJcbiAqXHJcbiAqIEBhdXRob3IgTWFydGluIFZlaWxsZXR0ZVxyXG4gKi9cclxuXHJcbmltcG9ydCBFbnVtZXJhdGlvblByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvRW51bWVyYXRpb25Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCB2ZWN0b3JBZGRpdGlvbiBmcm9tICcuLi8uLi92ZWN0b3JBZGRpdGlvbi5qcyc7XHJcbmltcG9ydCBDb21wb25lbnRWZWN0b3JTdHlsZXMgZnJvbSAnLi9Db21wb25lbnRWZWN0b3JTdHlsZXMuanMnO1xyXG5pbXBvcnQgVE1vZGVsIGZyb20gJy4uLy4uLy4uLy4uL2pvaXN0L2pzL1RNb2RlbC5qcyc7XHJcbmltcG9ydCBEaXNwb3NhYmxlIGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvRGlzcG9zYWJsZS5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZWN0b3JBZGRpdGlvbk1vZGVsIGltcGxlbWVudHMgVE1vZGVsIHtcclxuXHJcbiAgLy8gdGhlIHJlcHJlc2VudGF0aW9uIChzdHlsZSkgdXNlZCB0byBkaXNwbGF5IGNvbXBvbmVudCB2ZWN0b3JzXHJcbiAgcHVibGljIHJlYWRvbmx5IGNvbXBvbmVudFN0eWxlUHJvcGVydHk6IEVudW1lcmF0aW9uUHJvcGVydHk8Q29tcG9uZW50VmVjdG9yU3R5bGVzPjtcclxuXHJcbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKCB0YW5kZW06IFRhbmRlbSApIHtcclxuICAgIHRoaXMuY29tcG9uZW50U3R5bGVQcm9wZXJ0eSA9IG5ldyBFbnVtZXJhdGlvblByb3BlcnR5KCBDb21wb25lbnRWZWN0b3JTdHlsZXMuSU5WSVNJQkxFICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLmNvbXBvbmVudFN0eWxlUHJvcGVydHkucmVzZXQoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgRGlzcG9zYWJsZS5hc3NlcnROb3REaXNwb3NhYmxlKCk7XHJcbiAgfVxyXG59XHJcblxyXG52ZWN0b3JBZGRpdGlvbi5yZWdpc3RlciggJ1ZlY3RvckFkZGl0aW9uTW9kZWwnLCBWZWN0b3JBZGRpdGlvbk1vZGVsICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLG1CQUFtQixNQUFNLDRDQUE0QztBQUU1RSxPQUFPQyxjQUFjLE1BQU0seUJBQXlCO0FBQ3BELE9BQU9DLHFCQUFxQixNQUFNLDRCQUE0QjtBQUU5RCxPQUFPQyxVQUFVLE1BQU0sbUNBQW1DO0FBRTFELGVBQWUsTUFBTUMsbUJBQW1CLENBQW1CO0VBRXpEOztFQUdVQyxXQUFXQSxDQUFFQyxNQUFjLEVBQUc7SUFDdEMsSUFBSSxDQUFDQyxzQkFBc0IsR0FBRyxJQUFJUCxtQkFBbUIsQ0FBRUUscUJBQXFCLENBQUNNLFNBQVUsQ0FBQztFQUMxRjtFQUVPQyxLQUFLQSxDQUFBLEVBQVM7SUFDbkIsSUFBSSxDQUFDRixzQkFBc0IsQ0FBQ0UsS0FBSyxDQUFDLENBQUM7RUFDckM7RUFFT0MsT0FBT0EsQ0FBQSxFQUFTO0lBQ3JCUCxVQUFVLENBQUNRLG1CQUFtQixDQUFDLENBQUM7RUFDbEM7QUFDRjtBQUVBVixjQUFjLENBQUNXLFFBQVEsQ0FBRSxxQkFBcUIsRUFBRVIsbUJBQW9CLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=