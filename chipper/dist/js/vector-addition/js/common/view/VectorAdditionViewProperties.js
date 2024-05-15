// Copyright 2019-2023, University of Colorado Boulder

/**
 * View-specific Properties for the sim. Can be subclassed to add more Properties.
 *
 * @author Brandon Li
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import EnumerationProperty from '../../../../axon/js/EnumerationProperty.js';
import vectorAddition from '../../vectorAddition.js';
import CoordinateSnapModes from '../model/CoordinateSnapModes.js';
import Disposable from '../../../../axon/js/Disposable.js';
export default class VectorAdditionViewProperties {
  // indicates if the labels should contain the magnitudes

  // controls the visibility of the angle

  // indicates if the graph background grid is visible

  // controls the snapping mode for the vectors

  // whether the VectorValuesToggleBox is expanded

  constructor() {
    this.valuesVisibleProperty = new BooleanProperty(false);
    this.anglesVisibleProperty = new BooleanProperty(false);
    this.gridVisibleProperty = new BooleanProperty(true);
    this.coordinateSnapModeProperty = new EnumerationProperty(CoordinateSnapModes.CARTESIAN);
    this.vectorValuesExpandedProperty = new BooleanProperty(true);
  }
  reset() {
    this.valuesVisibleProperty.reset();
    this.anglesVisibleProperty.reset();
    this.gridVisibleProperty.reset();
    this.coordinateSnapModeProperty.reset();
    this.vectorValuesExpandedProperty.reset();
  }
  dispose() {
    Disposable.assertNotDisposable();
  }
}
vectorAddition.register('VectorAdditionViewProperties', VectorAdditionViewProperties);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJFbnVtZXJhdGlvblByb3BlcnR5IiwidmVjdG9yQWRkaXRpb24iLCJDb29yZGluYXRlU25hcE1vZGVzIiwiRGlzcG9zYWJsZSIsIlZlY3RvckFkZGl0aW9uVmlld1Byb3BlcnRpZXMiLCJjb25zdHJ1Y3RvciIsInZhbHVlc1Zpc2libGVQcm9wZXJ0eSIsImFuZ2xlc1Zpc2libGVQcm9wZXJ0eSIsImdyaWRWaXNpYmxlUHJvcGVydHkiLCJjb29yZGluYXRlU25hcE1vZGVQcm9wZXJ0eSIsIkNBUlRFU0lBTiIsInZlY3RvclZhbHVlc0V4cGFuZGVkUHJvcGVydHkiLCJyZXNldCIsImRpc3Bvc2UiLCJhc3NlcnROb3REaXNwb3NhYmxlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJWZWN0b3JBZGRpdGlvblZpZXdQcm9wZXJ0aWVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFZpZXctc3BlY2lmaWMgUHJvcGVydGllcyBmb3IgdGhlIHNpbS4gQ2FuIGJlIHN1YmNsYXNzZWQgdG8gYWRkIG1vcmUgUHJvcGVydGllcy5cclxuICpcclxuICogQGF1dGhvciBCcmFuZG9uIExpXHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL0Jvb2xlYW5Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBFbnVtZXJhdGlvblByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvRW51bWVyYXRpb25Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB2ZWN0b3JBZGRpdGlvbiBmcm9tICcuLi8uLi92ZWN0b3JBZGRpdGlvbi5qcyc7XHJcbmltcG9ydCBDb29yZGluYXRlU25hcE1vZGVzIGZyb20gJy4uL21vZGVsL0Nvb3JkaW5hdGVTbmFwTW9kZXMuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBEaXNwb3NhYmxlIGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvRGlzcG9zYWJsZS5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZWN0b3JBZGRpdGlvblZpZXdQcm9wZXJ0aWVzIHtcclxuXHJcbiAgLy8gaW5kaWNhdGVzIGlmIHRoZSBsYWJlbHMgc2hvdWxkIGNvbnRhaW4gdGhlIG1hZ25pdHVkZXNcclxuICBwdWJsaWMgcmVhZG9ubHkgdmFsdWVzVmlzaWJsZVByb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgLy8gY29udHJvbHMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIGFuZ2xlXHJcbiAgcHVibGljIHJlYWRvbmx5IGFuZ2xlc1Zpc2libGVQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIGluZGljYXRlcyBpZiB0aGUgZ3JhcGggYmFja2dyb3VuZCBncmlkIGlzIHZpc2libGVcclxuICBwdWJsaWMgcmVhZG9ubHkgZ3JpZFZpc2libGVQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIGNvbnRyb2xzIHRoZSBzbmFwcGluZyBtb2RlIGZvciB0aGUgdmVjdG9yc1xyXG4gIHB1YmxpYyByZWFkb25seSBjb29yZGluYXRlU25hcE1vZGVQcm9wZXJ0eTogRW51bWVyYXRpb25Qcm9wZXJ0eTxDb29yZGluYXRlU25hcE1vZGVzPjtcclxuXHJcbiAgLy8gd2hldGhlciB0aGUgVmVjdG9yVmFsdWVzVG9nZ2xlQm94IGlzIGV4cGFuZGVkXHJcbiAgcHVibGljIHJlYWRvbmx5IHZlY3RvclZhbHVlc0V4cGFuZGVkUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLnZhbHVlc1Zpc2libGVQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIGZhbHNlICk7XHJcbiAgICB0aGlzLmFuZ2xlc1Zpc2libGVQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIGZhbHNlICk7XHJcbiAgICB0aGlzLmdyaWRWaXNpYmxlUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCB0cnVlICk7XHJcbiAgICB0aGlzLmNvb3JkaW5hdGVTbmFwTW9kZVByb3BlcnR5ID0gbmV3IEVudW1lcmF0aW9uUHJvcGVydHkoIENvb3JkaW5hdGVTbmFwTW9kZXMuQ0FSVEVTSUFOICk7XHJcbiAgICB0aGlzLnZlY3RvclZhbHVlc0V4cGFuZGVkUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCB0cnVlICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLnZhbHVlc1Zpc2libGVQcm9wZXJ0eS5yZXNldCgpO1xyXG4gICAgdGhpcy5hbmdsZXNWaXNpYmxlUHJvcGVydHkucmVzZXQoKTtcclxuICAgIHRoaXMuZ3JpZFZpc2libGVQcm9wZXJ0eS5yZXNldCgpO1xyXG4gICAgdGhpcy5jb29yZGluYXRlU25hcE1vZGVQcm9wZXJ0eS5yZXNldCgpO1xyXG4gICAgdGhpcy52ZWN0b3JWYWx1ZXNFeHBhbmRlZFByb3BlcnR5LnJlc2V0KCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIERpc3Bvc2FibGUuYXNzZXJ0Tm90RGlzcG9zYWJsZSgpO1xyXG4gIH1cclxufVxyXG5cclxudmVjdG9yQWRkaXRpb24ucmVnaXN0ZXIoICdWZWN0b3JBZGRpdGlvblZpZXdQcm9wZXJ0aWVzJywgVmVjdG9yQWRkaXRpb25WaWV3UHJvcGVydGllcyApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxlQUFlLE1BQU0sd0NBQXdDO0FBQ3BFLE9BQU9DLG1CQUFtQixNQUFNLDRDQUE0QztBQUM1RSxPQUFPQyxjQUFjLE1BQU0seUJBQXlCO0FBQ3BELE9BQU9DLG1CQUFtQixNQUFNLGlDQUFpQztBQUVqRSxPQUFPQyxVQUFVLE1BQU0sbUNBQW1DO0FBRTFELGVBQWUsTUFBTUMsNEJBQTRCLENBQUM7RUFFaEQ7O0VBR0E7O0VBR0E7O0VBR0E7O0VBR0E7O0VBR09DLFdBQVdBLENBQUEsRUFBRztJQUNuQixJQUFJLENBQUNDLHFCQUFxQixHQUFHLElBQUlQLGVBQWUsQ0FBRSxLQUFNLENBQUM7SUFDekQsSUFBSSxDQUFDUSxxQkFBcUIsR0FBRyxJQUFJUixlQUFlLENBQUUsS0FBTSxDQUFDO0lBQ3pELElBQUksQ0FBQ1MsbUJBQW1CLEdBQUcsSUFBSVQsZUFBZSxDQUFFLElBQUssQ0FBQztJQUN0RCxJQUFJLENBQUNVLDBCQUEwQixHQUFHLElBQUlULG1CQUFtQixDQUFFRSxtQkFBbUIsQ0FBQ1EsU0FBVSxDQUFDO0lBQzFGLElBQUksQ0FBQ0MsNEJBQTRCLEdBQUcsSUFBSVosZUFBZSxDQUFFLElBQUssQ0FBQztFQUNqRTtFQUVPYSxLQUFLQSxDQUFBLEVBQVM7SUFDbkIsSUFBSSxDQUFDTixxQkFBcUIsQ0FBQ00sS0FBSyxDQUFDLENBQUM7SUFDbEMsSUFBSSxDQUFDTCxxQkFBcUIsQ0FBQ0ssS0FBSyxDQUFDLENBQUM7SUFDbEMsSUFBSSxDQUFDSixtQkFBbUIsQ0FBQ0ksS0FBSyxDQUFDLENBQUM7SUFDaEMsSUFBSSxDQUFDSCwwQkFBMEIsQ0FBQ0csS0FBSyxDQUFDLENBQUM7SUFDdkMsSUFBSSxDQUFDRCw0QkFBNEIsQ0FBQ0MsS0FBSyxDQUFDLENBQUM7RUFDM0M7RUFFT0MsT0FBT0EsQ0FBQSxFQUFTO0lBQ3JCVixVQUFVLENBQUNXLG1CQUFtQixDQUFDLENBQUM7RUFDbEM7QUFDRjtBQUVBYixjQUFjLENBQUNjLFFBQVEsQ0FBRSw4QkFBOEIsRUFBRVgsNEJBQTZCLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=