// Copyright 2024, University of Colorado Boulder

/**
 * A property that is true when the node appears on the given display. See DisplayedTrailsProperty for additional options
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { DisplayedTrailsProperty, scenery } from '../imports.js';
import { DerivedProperty1 } from '../../../axon/js/DerivedProperty.js';
class DisplayedProperty extends DerivedProperty1 {
  constructor(node, options) {
    const displayedTrailsProperty = new DisplayedTrailsProperty(node, options);
    super([displayedTrailsProperty], trails => trails.length > 0, options);
    this.displayedTrailsProperty = displayedTrailsProperty;
  }
  dispose() {
    this.displayedTrailsProperty.dispose();
    super.dispose();
  }
}
scenery.register('DisplayedProperty', DisplayedProperty);
export default DisplayedProperty;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEaXNwbGF5ZWRUcmFpbHNQcm9wZXJ0eSIsInNjZW5lcnkiLCJEZXJpdmVkUHJvcGVydHkxIiwiRGlzcGxheWVkUHJvcGVydHkiLCJjb25zdHJ1Y3RvciIsIm5vZGUiLCJvcHRpb25zIiwiZGlzcGxheWVkVHJhaWxzUHJvcGVydHkiLCJ0cmFpbHMiLCJsZW5ndGgiLCJkaXNwb3NlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJEaXNwbGF5ZWRQcm9wZXJ0eS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBwcm9wZXJ0eSB0aGF0IGlzIHRydWUgd2hlbiB0aGUgbm9kZSBhcHBlYXJzIG9uIHRoZSBnaXZlbiBkaXNwbGF5LiBTZWUgRGlzcGxheWVkVHJhaWxzUHJvcGVydHkgZm9yIGFkZGl0aW9uYWwgb3B0aW9uc1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgRGlzcGxheWVkVHJhaWxzUHJvcGVydHksIERpc3BsYXllZFRyYWlsc1Byb3BlcnR5T3B0aW9ucywgTm9kZSwgc2NlbmVyeSwgVHJhaWwgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHsgRGVyaXZlZFByb3BlcnR5MSwgRGVyaXZlZFByb3BlcnR5T3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL2F4b24vanMvRGVyaXZlZFByb3BlcnR5LmpzJztcclxuXHJcbmV4cG9ydCB0eXBlIERpc3BsYXllZFByb3BlcnR5T3B0aW9ucyA9IERpc3BsYXllZFRyYWlsc1Byb3BlcnR5T3B0aW9ucyAmIERlcml2ZWRQcm9wZXJ0eU9wdGlvbnM8Ym9vbGVhbj47XHJcblxyXG5jbGFzcyBEaXNwbGF5ZWRQcm9wZXJ0eSBleHRlbmRzIERlcml2ZWRQcm9wZXJ0eTE8Ym9vbGVhbiwgVHJhaWxbXT4ge1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IGRpc3BsYXllZFRyYWlsc1Byb3BlcnR5OiBEaXNwbGF5ZWRUcmFpbHNQcm9wZXJ0eTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBub2RlOiBOb2RlLCBvcHRpb25zPzogRGlzcGxheWVkUHJvcGVydHlPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IGRpc3BsYXllZFRyYWlsc1Byb3BlcnR5ID0gbmV3IERpc3BsYXllZFRyYWlsc1Byb3BlcnR5KCBub2RlLCBvcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoIFsgZGlzcGxheWVkVHJhaWxzUHJvcGVydHkgXSwgdHJhaWxzID0+IHRyYWlscy5sZW5ndGggPiAwLCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5kaXNwbGF5ZWRUcmFpbHNQcm9wZXJ0eSA9IGRpc3BsYXllZFRyYWlsc1Byb3BlcnR5O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3BsYXllZFRyYWlsc1Byb3BlcnR5LmRpc3Bvc2UoKTtcclxuXHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnRGlzcGxheWVkUHJvcGVydHknLCBEaXNwbGF5ZWRQcm9wZXJ0eSApO1xyXG5leHBvcnQgZGVmYXVsdCBEaXNwbGF5ZWRQcm9wZXJ0eTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBU0EsdUJBQXVCLEVBQXdDQyxPQUFPLFFBQWUsZUFBZTtBQUM3RyxTQUFTQyxnQkFBZ0IsUUFBZ0MscUNBQXFDO0FBSTlGLE1BQU1DLGlCQUFpQixTQUFTRCxnQkFBZ0IsQ0FBbUI7RUFJMURFLFdBQVdBLENBQUVDLElBQVUsRUFBRUMsT0FBa0MsRUFBRztJQUVuRSxNQUFNQyx1QkFBdUIsR0FBRyxJQUFJUCx1QkFBdUIsQ0FBRUssSUFBSSxFQUFFQyxPQUFRLENBQUM7SUFFNUUsS0FBSyxDQUFFLENBQUVDLHVCQUF1QixDQUFFLEVBQUVDLE1BQU0sSUFBSUEsTUFBTSxDQUFDQyxNQUFNLEdBQUcsQ0FBQyxFQUFFSCxPQUFRLENBQUM7SUFFMUUsSUFBSSxDQUFDQyx1QkFBdUIsR0FBR0EsdUJBQXVCO0VBQ3hEO0VBRWdCRyxPQUFPQSxDQUFBLEVBQVM7SUFDOUIsSUFBSSxDQUFDSCx1QkFBdUIsQ0FBQ0csT0FBTyxDQUFDLENBQUM7SUFFdEMsS0FBSyxDQUFDQSxPQUFPLENBQUMsQ0FBQztFQUNqQjtBQUNGO0FBRUFULE9BQU8sQ0FBQ1UsUUFBUSxDQUFFLG1CQUFtQixFQUFFUixpQkFBa0IsQ0FBQztBQUMxRCxlQUFlQSxpQkFBaUIiLCJpZ25vcmVMaXN0IjpbXX0=